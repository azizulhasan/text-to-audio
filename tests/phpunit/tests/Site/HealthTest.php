<?php
/**
 * Tests for the health checks: the service class, its REST routes and
 * `wp atlasvoice health` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Health_Command;
use TTA\Site\Health;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Site\Health
 * @covers \TTA_Api\Health_Controller
 * @covers \TTA\CLI\Health_Command
 */
class HealthTest extends WP_UnitTestCase {

	/**
	 * Addresses the plugin tried to reach.
	 *
	 * @var string[]
	 */
	private $requests = array();

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		foreach ( array( 'tta_settings_data', 'tta_customize_settings', Health::CDN_OPTION, Service::OPTION ) as $option ) {
			delete_option( $option );
		}
		foreach ( array( 'atlasvoice_health_checks', 'tts_get_player_id' ) as $filter ) {
			remove_all_filters( $filter );
		}
		\TTA\TTA_Cache::flush();
		$this->requests = array();
		add_filter( 'pre_http_request', array( $this, 'note_request' ), 10, 3 );
		$this->settings();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'note_request' ), 10 );
		foreach ( array( 'atlasvoice_health_checks', 'tts_get_player_id' ) as $filter ) {
			remove_all_filters( $filter );
		}
		parent::tear_down();
	}

	public function note_request( $pre, $args, $url ) {
		$this->requests[] = (string) $url;

		return new WP_Error( 'offline', 'No network in this test.' );
	}

	private function settings( array $settings = array() ) {
		update_option(
			'tta_settings_data',
			(object) array_replace(
				array(
					'tta__settings_enable_button_add'              => true,
					'tta__settings_allow_listening_for_post_types' => array( 'post' ),
					'tta__settings_atlasvoice_mode'                => \TTA\AtlasVoice\Mode::MODE_PRODUCTION,
				),
				$settings
			)
		);
		\TTA\TTA_Cache::flush();
	}

	private function check( $id ) {
		return array_column( Health::get()['checks'], null, 'id' )[ $id ];
	}

	private function rest( $method = 'GET', $route = '/tta/v1/health' ) {
		return rest_get_server()->dispatch( new WP_REST_Request( $method, $route ) );
	}

	// The list.

	public function test_every_check_has_a_status_a_title_and_a_sentence() {
		$health = Health::get();

		$this->assertSame( array( 'mode', 'voice', 'placement', 'uploads', 'cdn', 'environment' ), wp_list_pluck( $health['checks'], 'id' ) );
		foreach ( $health['checks'] as $check ) {
			$this->assertContains( $check['status'], Health::STATUSES, $check['id'] );
			$this->assertNotEmpty( $check['title'], $check['id'] );
			$this->assertNotEmpty( $check['detail'], $check['id'] );
			$this->assertStringNotContainsString( '<', $check['detail'] );
		}
		$this->assertEqualsWithDelta( time(), $health['checked_at'], 5 );
	}

	public function test_checking_calls_no_other_server_and_changes_nothing() {
		$options = wp_load_alloptions();

		Health::get();
		$this->rest();

		$this->assertSame( array(), $this->requests );
		$this->assertSame( $options, wp_load_alloptions() );
	}

	public function test_a_healthy_live_site_needs_no_attention() {
		$this->assertSame( 0, Health::get()['needs_attention'] );
	}

	// Each check.

	public function test_staging_is_a_warning_because_visitors_hear_nothing() {
		$this->settings( array( 'tta__settings_atlasvoice_mode' => \TTA\AtlasVoice\Mode::MODE_STAGING ) );

		$check = $this->check( 'mode' );

		$this->assertSame( 'warn', $check['status'] );
		$this->assertStringContainsString( 'Staging', $check['detail'] );
		$this->assertSame( 1, Health::get()['needs_attention'] );
	}

	public function test_live_is_fine() {
		$this->assertSame( 'ok', $this->check( 'mode' )['status'] );
	}

	public function test_the_voice_in_use_is_named() {
		$check = $this->check( 'voice' );

		$this->assertSame( 'ok', $check['status'] );
		$this->assertSame( 'In use: Default.', $check['detail'] );
		$this->assertSame( 'voice:voice', $check['route'] );
	}

	public function test_the_natural_voice_without_a_connection_is_an_error() {
		add_filter(
			'tts_get_player_id',
			static function () {
				return Service::PLAYER_ID;
			}
		);

		$check = $this->check( 'voice' );

		$this->assertSame( 'error', $check['status'] );
		$this->assertStringContainsString( 'not connected', $check['detail'] );
	}

	public function test_the_natural_voice_on_a_connected_site_is_fine() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value',
			),
			false
		);
		add_filter(
			'tts_get_player_id',
			static function () {
				return Service::PLAYER_ID;
			}
		);

		$check = $this->check( 'voice' );

		$this->assertSame( 'ok', $check['status'] );
		$this->assertStringNotContainsString( 'av_live', wp_json_encode( Health::get() ) );
	}

	public function test_no_content_type_is_an_error() {
		$this->settings( array( 'tta__settings_allow_listening_for_post_types' => array() ) );

		$check = $this->check( 'placement' );

		$this->assertSame( 'error', $check['status'] );
		$this->assertSame( 'content:where', $check['route'] );
	}

	public function test_manual_placement_is_information_not_a_problem() {
		$this->settings( array( 'tta__settings_enable_button_add' => false ) );

		$this->assertSame( 'info', $this->check( 'placement' )['status'] );
		$this->assertSame( 0, Health::get()['needs_attention'] );
	}

	public function test_the_content_types_are_named() {
		$this->settings( array( 'tta__settings_allow_listening_for_post_types' => array( 'post', 'page' ) ) );

		$this->assertSame( 'Added automatically to: post, page.', $this->check( 'placement' )['detail'] );
	}

	public function test_an_uploads_folder_that_cannot_be_written_is_an_error() {
		$this->assertSame( 'ok', $this->check( 'uploads' )['status'] );

		$broken = static function ( $uploads ) {
			$uploads['error'] = 'Unable to create directory.';

			return $uploads;
		};
		add_filter( 'upload_dir', $broken );

		$status = $this->check( 'uploads' )['status'];
		remove_filter( 'upload_dir', $broken );

		$this->assertSame( 'error', $status );
	}

	public function test_a_blocked_script_names_the_host_and_never_the_markup() {
		update_option(
			Health::CDN_OPTION,
			array(
				'url'         => 'https://cdn.example.com/wp-content/plugins/text-to-audio/x.js',
				'script_host' => 'cdn.example.com<script>',
				'detected_at' => time(),
			),
			false
		);

		$check = $this->check( 'cdn' );

		$this->assertSame( 'error', $check['status'] );
		$this->assertStringContainsString( 'cdn.example.com', $check['detail'] );
		$this->assertStringNotContainsString( '<', $check['detail'] );
	}

	public function test_no_report_means_the_cdn_is_fine() {
		$this->assertSame( 'ok', $this->check( 'cdn' )['status'] );
	}

	public function test_forgetting_the_cdn_problem_clears_the_check() {
		update_option( Health::CDN_OPTION, array( 'url' => 'https://cdn.example.com/x.js' ), false );

		$health = Health::forget_cdn_problem();

		$this->assertFalse( get_option( Health::CDN_OPTION ) );
		$this->assertSame( 'ok', array_column( $health['checks'], null, 'id' )['cdn']['status'] );
	}

	public function test_the_environment_names_the_versions() {
		$this->assertSame(
			'PHP ' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . ', WordPress ' . get_bloginfo( 'version' ) . '.',
			$this->check( 'environment' )['detail']
		);
	}

	// Plugins.

	public function test_it_lists_the_caching_plugins_and_none_is_active_here() {
		$plugins = Health::get()['plugins'];

		$this->assertSame( array( 'WP Rocket', 'LiteSpeed Cache', 'Autoptimize', 'W3 Total Cache', 'WP-Optimize', 'Speed Optimizer', 'Perfmatters', 'FlyingPress' ), wp_list_pluck( $plugins, 'name' ) );
		foreach ( $plugins as $plugin ) {
			$this->assertFalse( $plugin['active'] );
			$this->assertNotEmpty( $plugin['detail'] );
		}
	}

	public function test_every_caching_plugin_it_names_is_one_the_plugin_adjusts_to() {
		$hooks = file_get_contents( dirname( __DIR__, 4 ) . '/includes/TTA_Hooks.php' );

		foreach ( array( 'rocket_', 'litespeed_', 'autoptimize_', 'w3tc_', 'wp-optimize-', 'sgo_', 'perfmatters_', 'flying_press_' ) as $prefix ) {
			$this->assertStringContainsString( $prefix, $hooks, $prefix );
		}
	}

	// Checks of other plugins.

	public function test_another_plugin_can_add_a_check() {
		add_filter(
			'atlasvoice_health_checks',
			static function ( $checks ) {
				$checks[] = array(
					'id'     => 'licence',
					'title'  => 'Pro licence',
					'status' => 'error',
					'detail' => 'The licence <b>expired</b>.',
					'route'  => 'account:licence',
				);

				return $checks;
			}
		);

		$health = Health::get();
		$added  = array_column( $health['checks'], null, 'id' )['licence'];

		$this->assertSame( 'error', $added['status'] );
		$this->assertSame( 'The licence expired.', $added['detail'] );
		$this->assertSame( 'account:licence', $added['route'] );
		$this->assertSame( 1, $health['needs_attention'] );
	}

	/**
	 * @dataProvider broken_filters
	 */
	public function test_a_filter_that_returns_rubbish_does_not_break_the_list( $returned, $count ) {
		add_filter(
			'atlasvoice_health_checks',
			static function ( $checks ) use ( $returned ) {
				return is_callable( $returned ) ? $returned( $checks ) : $returned;
			}
		);

		$this->assertCount( $count, Health::get()['checks'] );
	}

	public function broken_filters() {
		return array(
			'null'               => array( null, 0 ),
			'text'               => array( 'fine', 0 ),
			'a check as text'    => array(
				static function ( $checks ) {
					$checks[] = 'all good';

					return $checks;
				},
				6,
			),
			'a check with no id' => array(
				static function ( $checks ) {
					$checks[] = array( 'title' => 'x' );

					return $checks;
				},
				6,
			),
		);
	}

	public function test_an_unknown_status_or_route_from_a_filter_is_never_shown_as_fine() {
		add_filter(
			'atlasvoice_health_checks',
			static function () {
				return array(
					array(
						'id'     => 'odd',
						'title'  => 'Odd',
						'status' => 'perfect',
						'route'  => 'javascript:alert(1)',
					),
				);
			}
		);

		$check = Health::get()['checks'][0];

		$this->assertSame( 'warn', $check['status'] );
		$this->assertSame( '', $check['route'] );
	}

	// The REST routes.

	public function test_get_returns_the_checks() {
		$response = $this->rest();
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( wp_list_pluck( Health::get()['checks'], 'status', 'id' ), wp_list_pluck( $data['checks'], 'status', 'id' ) );
	}

	public function test_the_cdn_fixed_route_forgets_the_problem() {
		update_option( Health::CDN_OPTION, array( 'url' => 'https://cdn.example.com/x.js' ), false );

		$response = $this->rest( 'POST', '/tta/v1/health/cdn-fixed' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( get_option( Health::CDN_OPTION ) );
	}

	public function test_every_route_describes_itself() {
		$routes = rest_get_server()->get_routes();

		foreach ( array( '/tta/v1/health', '/tta/v1/health/cdn-fixed' ) as $route ) {
			$this->assertNotEmpty( $routes[ $route ][0]['label'] );
			$this->assertNotEmpty( $routes[ $route ][0]['description'] );
		}
		$this->assertSame( array( 'GET' => true ), $routes['/tta/v1/health'][0]['methods'] );
		$this->assertSame( array( 'POST' => true ), $routes['/tta/v1/health/cdn-fixed'][0]['methods'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_check_or_forget( $role ) {
		update_option( Health::CDN_OPTION, array( 'url' => 'https://cdn.example.com/x.js' ), false );
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', '/tta/v1/health/cdn-fixed' )->get_status(), array( 401, 403 ) );
		$this->assertNotFalse( get_option( Health::CDN_OPTION ) );
	}

	public function people_without_access() {
		return array(
			'a visitor'    => array( '' ),
			'a subscriber' => array( 'subscriber' ),
			'an editor'    => array( 'editor' ),
		);
	}

	// The command.

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Health_Command::class, WP_CLI::$commands['atlasvoice health'] );
	}

	public function test_check_prints_each_check_and_the_count() {
		$this->settings( array( 'tta__settings_atlasvoice_mode' => \TTA\AtlasVoice\Mode::MODE_STAGING ) );

		( new Health_Command() )->check( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertStringStartsWith( '[warn] Staging or live: Staging', $lines[0] );
		$this->assertContains( '[ok] Voice: In use: Default.', $lines );
		$this->assertSame( '1 need attention.', end( $lines ) );
	}

	public function test_check_says_when_nothing_needs_attention() {
		( new Health_Command() )->check( array(), array() );

		$this->assertSame( 'Nothing needs attention.', end( WP_CLI::$log )[1] );
	}

	public function test_check_can_print_json_for_scripts() {
		( new Health_Command() )->check( array(), array( 'format' => 'json' ) );

		$printed = json_decode( end( WP_CLI::$log )[1], true );
		$this->assertSame( 0, $printed['needs_attention'] );
		$this->assertCount( 6, $printed['checks'] );
	}

	public function test_the_command_can_forget_the_cdn_problem() {
		update_option( Health::CDN_OPTION, array( 'url' => 'https://cdn.example.com/x.js' ), false );

		( new Health_Command() )->cdn_fixed( array(), array() );

		$this->assertSame( 'success', end( WP_CLI::$log )[0] );
		$this->assertFalse( get_option( Health::CDN_OPTION ) );
	}
}
