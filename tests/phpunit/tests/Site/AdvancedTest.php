<?php
/**
 * Tests for the advanced settings: the service class, its REST routes and
 * `wp atlasvoice advanced` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Advanced_Command;
use TTA\CLI\Commands;
use TTA\Site\Advanced;

/**
 * @covers \TTA\Site\Advanced
 * @covers \TTA_Api\Advanced_Controller
 * @covers \TTA\CLI\Advanced_Command
 */
class AdvancedTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Advanced::OPTION );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	private function stored() {
		return json_decode( wp_json_encode( get_option( Advanced::OPTION ) ), true );
	}

	/**
	 * What the classic Settings screen stores.
	 */
	private function classic( array $settings = array() ) {
		update_option(
			Advanced::OPTION,
			(object) array_replace(
				array(
					'tta__settings_show_mode_bar'         => true,
					'tta__settings_show_admin_bar_toggle' => false,
					'tta__settings_enable_steprail'       => false,
					'tta__settings_show_dashboard_widget' => true,
					'tta__settings_stop_auto_pause_after_switching_tab' => true,
					'tta__settings_stop_auto_playing_after_switching_tab' => true,
					'tta__settings_delete_data_on_uninstall' => false,
					'tta__settings_atlasvoice_mode'       => 'live',
					'tta__settings_allow_listening_for_post_types' => array( 'post' ),
				),
				$settings
			)
		);
		\TTA\TTA_Cache::flush();
	}

	private function rest( $method = 'GET', array $body = array(), $route = '/tta/v1/advanced' ) {
		$request = new WP_REST_Request( $method, $route );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// The list of switches.

	public function test_every_switch_names_its_stored_field_once_and_describes_itself() {
		$fields = Advanced::fields();
		$stored = wp_list_pluck( $fields, 'stored' );

		$this->assertCount( 7, $fields );
		$this->assertSame( array_values( $stored ), array_values( array_unique( $stored ) ) );
		foreach ( $fields as $name => $field ) {
			$this->assertNotEmpty( $field['description'], $name );
			$this->assertIsBool( $field['default'], $name );
		}
	}

	// Reading.

	public function test_a_site_that_never_saved_shows_what_the_plugin_does() {
		$this->assertSame(
			array(
				'mode_bar'            => true,
				'post_toggle'         => false,
				'picker'              => false,
				'dashboard_widget'    => true,
				'keep_reading'        => true,
				'no_auto_play'        => true,
				'delete_on_uninstall' => false,
			),
			Advanced::get()
		);
	}

	public function test_the_defaults_are_the_ones_the_plugin_uses() {
		// Each reader of a switch decides what "never saved" means; these are those readers.
		$this->assertTrue( \TTA\TTA_Helper::show_mode_bar() );
		$this->assertFalse( \TTA\TTA_Helper::is_steprail_enabled() );
	}

	public function test_it_reads_what_the_classic_screen_saved() {
		$this->classic(
			array(
				'tta__settings_show_mode_bar'            => false,
				'tta__settings_enable_steprail'          => true,
				'tta__settings_delete_data_on_uninstall' => true,
			)
		);

		$values = Advanced::get();

		$this->assertFalse( $values['mode_bar'] );
		$this->assertTrue( $values['picker'] );
		$this->assertTrue( $values['delete_on_uninstall'] );
		$this->assertTrue( $values['dashboard_widget'] );
	}

	// Saving.

	public function test_a_save_writes_the_fields_the_classic_screen_reads() {
		$this->classic();

		$saved = Advanced::save(
			array(
				'picker'           => true,
				'dashboard_widget' => 'off',
			)
		);

		$stored = $this->stored();
		$this->assertTrue( $stored['tta__settings_enable_steprail'] );
		$this->assertFalse( $stored['tta__settings_show_dashboard_widget'] );
		$this->assertTrue( $saved['picker'] );
		$this->assertFalse( $saved['dashboard_widget'] );
	}

	public function test_a_save_keeps_every_other_stored_setting_and_the_shape() {
		$this->classic();
		$before = $this->stored();

		Advanced::save( array( 'mode_bar' => false ) );

		$before['tta__settings_show_mode_bar'] = false;
		$this->assertSame( $before, $this->stored() );
		$this->assertIsObject( get_option( Advanced::OPTION ) );
	}

	public function test_the_plugin_follows_the_switch_that_was_saved() {
		$this->classic();

		Advanced::save(
			array(
				'mode_bar' => false,
				'picker'   => true,
			)
		);

		$this->assertFalse( \TTA\TTA_Helper::show_mode_bar() );
		$this->assertTrue( \TTA\TTA_Helper::is_steprail_enabled() );
	}

	public function test_data_is_deleted_with_the_plugin_only_when_the_switch_says_so() {
		$this->classic();
		$uninstall = file_get_contents( dirname( __DIR__, 4 ) . '/uninstall.php' );

		// uninstall.php leaves everything in place unless this exact field is on.
		$this->assertStringContainsString( "empty( \$settings['" . Advanced::fields()['delete_on_uninstall']['stored'] . "'] )", $uninstall );
		$this->assertFalse( Advanced::get()['delete_on_uninstall'] );

		Advanced::save( array( 'delete_on_uninstall' => true ) );

		$this->assertTrue( $this->stored()['tta__settings_delete_data_on_uninstall'] );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		$this->classic();
		$before = $this->stored();

		$result = Advanced::save(
			array(
				'picker' => true,
				$field   => $value,
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( sanitize_key( $field ), $result->get_error_data()['field'] );
		$this->assertSame( $before, $this->stored() );
	}

	public function wrong_values() {
		return array(
			'a switch as a word' => array( 'mode_bar', 'maybe' ),
			'a switch as a list' => array( 'delete_on_uninstall', array( true ) ),
			'an unknown setting' => array( 'tta__settings_atlasvoice_mode', 'live' ),
			'going live'         => array( 'mode', 'live' ),
		);
	}

	public function test_an_empty_save_is_refused() {
		$result = Advanced::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// Clearing the cache.

	public function test_clearing_the_cache_removes_cached_values_and_no_setting() {
		$this->classic();
		\TTA\TTA_Cache::set( 'atlasvoice_test_value', array( 'x' ) );
		$this->assertSame( array( 'x' ), \TTA\TTA_Cache::get( 'atlasvoice_test_value' ) );
		$before = $this->stored();

		$result = Advanced::clear_cache();

		$this->assertSame( array( 'cleared' => true ), $result );
		$this->assertFalse( \TTA\TTA_Cache::get( 'atlasvoice_test_value' ) );
		$this->assertSame( $before, $this->stored() );
	}

	// The REST routes.

	public function test_get_returns_the_settings() {
		$this->classic();

		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Advanced::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent_and_can_turn_a_switch_off() {
		$this->classic();

		$response = $this->rest( 'POST', array( 'dashboard_widget' => false ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['dashboard_widget'] );
		$this->assertTrue( $response->get_data()['mode_bar'] );
	}

	public function test_post_refuses_a_value_that_is_not_on_or_off() {
		$this->classic();

		$this->assertSame( 400, $this->rest( 'POST', array( 'picker' => 'maybe' ) )->get_status() );
		$this->assertFalse( $this->stored()['tta__settings_enable_steprail'] );
	}

	public function test_the_clear_cache_route_clears_the_cache() {
		\TTA\TTA_Cache::set( 'atlasvoice_test_value', 'x' );

		$response = $this->rest( 'POST', array(), '/tta/v1/advanced/clear-cache' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['cleared'] );
		$this->assertFalse( \TTA\TTA_Cache::get( 'atlasvoice_test_value' ) );
	}

	public function test_every_route_and_every_switch_describes_itself() {
		$routes = rest_get_server()->get_routes();

		$this->assertCount( 2, $routes['/tta/v1/advanced'] );
		foreach ( array_merge( $routes['/tta/v1/advanced'], $routes['/tta/v1/advanced/clear-cache'] ) as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertSame( array_keys( Advanced::fields() ), array_keys( $routes['/tta/v1/advanced'][1]['args'] ) );
		$this->assertSame( array( 'POST' => true ), $routes['/tta/v1/advanced/clear-cache'][0]['methods'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_change_or_clear( $role ) {
		\TTA\TTA_Cache::set( 'atlasvoice_test_value', 'x' );
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'picker' => true ) )->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array(), '/tta/v1/advanced/clear-cache' )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Advanced::OPTION ) );
		$this->assertSame( 'x', \TTA\TTA_Cache::get( 'atlasvoice_test_value' ) );
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

		$this->assertSame( Advanced_Command::class, WP_CLI::$commands['atlasvoice advanced'] );
	}

	public function test_get_prints_every_switch() {
		$this->classic();

		( new Advanced_Command() )->get( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertCount( 7, $lines );
		$this->assertContains( 'mode_bar: on', $lines );
		$this->assertContains( 'delete_on_uninstall: off', $lines );
	}

	public function test_get_can_print_json_for_scripts() {
		( new Advanced_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Advanced::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_set_saves_what_was_given() {
		$this->classic();

		( new Advanced_Command() )->set(
			array(),
			array(
				'picker'           => 'on',
				'dashboard_widget' => 'off',
			)
		);

		$this->assertSame( array( 'success', 'Saved.' ), end( WP_CLI::$log ) );
		$this->assertTrue( Advanced::get()['picker'] );
		$this->assertFalse( Advanced::get()['dashboard_widget'] );
	}

	public function test_set_says_which_value_was_refused_and_why() {
		try {
			( new Advanced_Command() )->set( array(), array( 'picker' => 'maybe' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'picker: This must be on or off.', WP_CLI::$log[0][1] );
	}

	public function test_the_command_can_clear_the_cache() {
		\TTA\TTA_Cache::set( 'atlasvoice_test_value', 'x' );

		( new Advanced_Command() )->clear_cache( array(), array() );

		$this->assertSame( array( 'success', 'Cache cleared.' ), end( WP_CLI::$log ) );
		$this->assertFalse( \TTA\TTA_Cache::get( 'atlasvoice_test_value' ) );
	}
}
