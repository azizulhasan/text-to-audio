<?php
/**
 * Tests for the versions of AtlasVoice: the service class, its REST routes
 * and `wp atlasvoice versions` (TTS-347).
 *
 * WordPress.org is never called: the test answers the request itself.
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Versions_Command;
use TTA\Site\Versions;
use TTA\TTA_Rollback_Source_WordPress_Org as Wporg;

/**
 * @covers \TTA\Site\Versions
 * @covers \TTA_Api\Versions_Controller
 * @covers \TTA\CLI\Versions_Command
 */
class VersionsTest extends WP_UnitTestCase {

	/**
	 * Whether WordPress.org answers in this test.
	 *
	 * @var bool
	 */
	private $online = true;

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		$this->online = true;
		delete_site_transient( Wporg::CACHE );
		delete_site_option( 'auto_update_plugins' );
		add_filter( 'pre_http_request', array( $this, 'answer_request' ), 10, 3 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer_request' ), 10 );
		delete_site_transient( Wporg::CACHE );
		delete_site_option( 'auto_update_plugins' );
		parent::tear_down();
	}

	/**
	 * Stands in for WordPress.org: three older versions and one that is not a version.
	 */
	public function answer_request( $pre, $args, $url ) {
		if ( ! $this->online ) {
			return new WP_Error( 'offline', 'No network in this test.' );
		}

		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'headers'  => array(),
			'cookies'  => array(),
			'body'     => wp_json_encode(
				array(
					'versions' => array(
						'1.0.1' => 'https://downloads.wordpress.org/plugin/text-to-audio.1.0.1.zip',
						'1.0.2' => 'https://downloads.wordpress.org/plugin/text-to-audio.1.0.2.zip',
						'1.0.3' => 'https://downloads.wordpress.org/plugin/text-to-audio.1.0.3.zip',
						'trunk' => 'https://downloads.wordpress.org/plugin/text-to-audio.zip',
					),
				)
			),
		);
	}

	private function rest( $method = 'GET', array $body = array(), $route = '/tta/v1/versions' ) {
		$request = new WP_REST_Request( $method, $route );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Reading.

	public function test_it_names_the_installed_version() {
		$free = Versions::get()['installed']['free'];

		$this->assertSame( TEXT_TO_AUDIO_VERSION, $free['version'] );
		$this->assertNotEmpty( $free['label'] );
		$this->assertFalse( $free['auto_update'] );
		$this->assertIsBool( $free['checkout'] );
	}

	public function test_it_names_what_the_versions_were_checked_against() {
		$site = Versions::get()['site'];

		$this->assertSame( PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION, $site['php'] );
		$this->assertSame( get_bloginfo( 'version' ), $site['wordpress'] );
	}

	public function test_it_lists_the_older_versions_with_a_verdict_each() {
		$rows = Versions::get()['modes']['free'];

		$this->assertSame( array( '1.0.3', '1.0.2', '1.0.1' ), wp_list_pluck( $rows, 'version' ) );
		foreach ( $rows as $row ) {
			$this->assertContains( $row['status'], array( 'safe', 'changes', 'blocked' ) );
			$this->assertNotEmpty( $row['label'] );
			$this->assertIsBool( $row['recommended'] );
			foreach ( array( 'blocks', 'changes', 'notes' ) as $list ) {
				foreach ( $row[ $list ] as $text ) {
					$this->assertIsString( $text );
					$this->assertStringNotContainsString( '<', $text );
				}
			}
			// A version that is blocked says why.
			$this->assertSame( 'blocked' === $row['status'], (bool) $row['blocks'] );
		}
	}

	public function test_the_verdicts_are_the_ones_of_the_rollback_engine() {
		$plan = \TTA\TTA_Rollback::plan();
		$mine = Versions::get();

		$this->assertSame( wp_list_pluck( $plan['modes']['free'], 'status' ), wp_list_pluck( $mine['modes']['free'], 'status' ) );
		$this->assertSame( array_keys( $plan['modes'] ), array_keys( $mine['modes'] ) );
	}

	public function test_it_never_hands_out_the_names_of_the_file_replacing_actions() {
		$json = wp_json_encode( Versions::get() );

		$this->assertArrayNotHasKey( 'actions', Versions::get() );
		$this->assertStringNotContainsString( 'downloads.wordpress.org', $json );
		$this->assertStringNotContainsString( '.zip', $json );
	}

	public function test_it_says_why_when_wordpress_org_cannot_be_reached() {
		$this->online = false;

		$versions = Versions::get();

		$this->assertSame( array(), $versions['modes']['free'] );
		$this->assertArrayHasKey( 'free', $versions['errors'] );
		$this->assertNotEmpty( $versions['errors']['free'] );
	}

	public function test_only_someone_who_may_update_plugins_can_roll_back() {
		$this->assertTrue( Versions::get()['can_roll_back'] );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertFalse( Versions::get()['can_roll_back'] );
	}

	// Automatic updates.

	public function test_turning_automatic_updates_on_writes_wordpress_own_list() {
		$saved = Versions::set_auto_update( 'free', true );

		$this->assertTrue( $saved['installed']['free']['auto_update'] );
		$this->assertContains( plugin_basename( TEXT_TO_AUDIO_ROOT_FILE ), (array) get_site_option( 'auto_update_plugins' ) );
	}

	public function test_turning_them_off_removes_only_this_plugin_from_the_list() {
		update_site_option( 'auto_update_plugins', array( 'other/other.php', plugin_basename( TEXT_TO_AUDIO_ROOT_FILE ) ) );

		$saved = Versions::set_auto_update( 'free', 'off' );

		$this->assertFalse( $saved['installed']['free']['auto_update'] );
		$this->assertSame( array( 'other/other.php' ), array_values( (array) get_site_option( 'auto_update_plugins' ) ) );
	}

	/**
	 * @dataProvider wrong_switches
	 */
	public function test_a_wrong_switch_changes_nothing( $plugin, $on, $status ) {
		$result = Versions::set_auto_update( $plugin, $on );

		$this->assertWPError( $result );
		$this->assertSame( $status, $result->get_error_data()['status'] );
		$this->assertFalse( get_site_option( 'auto_update_plugins' ) );
	}

	public function wrong_switches() {
		return array(
			'a plugin that is not installed' => array( 'pro', true, 400 ),
			'another plugin'                 => array( 'akismet/akismet.php', true, 400 ),
			'a list as the plugin'           => array( array( 'free' ), true, 400 ),
			'neither on nor off'             => array( 'free', 'maybe', 400 ),
		);
	}

	public function test_someone_who_may_not_update_plugins_cannot_switch_it() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$result = Versions::set_auto_update( 'free', true );

		$this->assertSame( 403, $result->get_error_data()['status'] );
		$this->assertFalse( get_site_option( 'auto_update_plugins' ) );
	}

	// The REST routes.

	public function test_get_returns_the_versions() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Versions::get(), $response->get_data() );
	}

	public function test_post_switches_automatic_updates() {
		$response = $this->rest(
			'POST',
			array(
				'plugin' => 'free',
				'on'     => true,
			),
			'/tta/v1/versions/auto-update'
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['installed']['free']['auto_update'] );
	}

	public function test_post_needs_both_the_plugin_and_the_switch() {
		$this->assertSame( 400, $this->rest( 'POST', array( 'plugin' => 'free' ), '/tta/v1/versions/auto-update' )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'on' => true ), '/tta/v1/versions/auto-update' )->get_status() );
		$this->assertSame(
			400,
			$this->rest(
				'POST',
				array(
					'plugin' => 'akismet',
					'on'     => true,
				),
				'/tta/v1/versions/auto-update'
			)->get_status()
		);
		$this->assertFalse( get_site_option( 'auto_update_plugins' ) );
	}

	public function test_no_route_here_replaces_plugin_files() {
		$routes = rest_get_server()->get_routes();
		$mine   = array_filter(
			array_keys( $routes ),
			static function ( $route ) {
				return 0 === strpos( $route, '/tta/v1/versions' );
			}
		);

		$this->assertSame( array( '/tta/v1/versions', '/tta/v1/versions/auto-update' ), array_values( $mine ) );
		$this->assertSame( array( 'GET' => true ), $routes['/tta/v1/versions'][0]['methods'] );
		foreach ( $mine as $route ) {
			$this->assertNotEmpty( $routes[ $route ][0]['label'] );
			$this->assertNotEmpty( $routes[ $route ][0]['description'] );
		}
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_switch( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains(
			$this->rest(
				'POST',
				array(
					'plugin' => 'free',
					'on'     => true,
				),
				'/tta/v1/versions/auto-update'
			)->get_status(),
			array( 401, 403 )
		);
		$this->assertFalse( get_site_option( 'auto_update_plugins' ) );
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

		$this->assertSame( Versions_Command::class, WP_CLI::$commands['atlasvoice versions'] );
	}

	public function test_get_prints_the_installed_version_and_each_older_one() {
		( new Versions_Command() )->get( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertStringContainsString( TEXT_TO_AUDIO_VERSION . ' (updates itself: no)', $lines[0] );
		$this->assertCount( 4, $lines );
		$this->assertStringStartsWith( 'free 1.0.3: ', $lines[1] );
	}

	public function test_get_can_print_json_for_scripts() {
		( new Versions_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Versions::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_the_command_switches_automatic_updates() {
		( new Versions_Command() )->auto_update( array( 'free', 'on' ), array() );

		$this->assertSame( 'success', end( WP_CLI::$log )[0] );
		$this->assertStringEndsWith( 'updates itself.', end( WP_CLI::$log )[1] );
		$this->assertTrue( Versions::get()['installed']['free']['auto_update'] );
	}

	public function test_the_command_says_why_it_was_refused() {
		try {
			( new Versions_Command() )->auto_update( array( 'pro', 'on' ), array() );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'not installed', WP_CLI::$log[0][1] );
	}
}
