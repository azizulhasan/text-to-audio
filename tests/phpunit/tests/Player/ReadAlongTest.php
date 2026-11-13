<?php
/**
 * Tests for the read-along settings: service, REST routes and WP-CLI command.
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Read_Along_Command;
use TTA\Player\Read_Along;

/**
 * @covers \TTA\Player\Read_Along
 * @covers \TTA_Api\Read_Along_Controller
 * @covers \TTA\CLI\Read_Along_Command
 */
class ReadAlongTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
		WP_CLI::reset();
		delete_option( Read_Along::OPTION );
		\TTA\TTA_Cache::flush();
	}

	private function call( $method, array $params = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/read-along' );
		if ( 'GET' !== $method ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	private function classic( array $fields ) {
		$request = new WP_REST_Request( 'POST', '/tta/v1/highlight' );
		$request->set_param( 'method', 'post' );
		$request->set_param( 'fields', wp_json_encode( $fields ) );

		return rest_get_server()->dispatch( $request );
	}

	// The service.

	public function test_defaults_are_the_ones_a_new_install_gets() {
		delete_option( Read_Along::OPTION );
		\TTA\TTA_Activator::activate();

		$this->assertSame( Read_Along::defaults(), get_option( Read_Along::OPTION ) );
		$this->assertSame( Read_Along::defaults(), Read_Along::get() );
	}

	public function test_get_fills_a_missing_key_and_ignores_an_unknown_one() {
		update_option(
			Read_Along::OPTION,
			array(
				'tta__highlight_enabled' => true,
				'left_by_another_plugin' => 'x',
			)
		);

		$settings = Read_Along::get();

		$this->assertTrue( $settings['tta__highlight_enabled'] );
		$this->assertSame( 'sentence', $settings['tta__highlight_mode'] );
		$this->assertArrayNotHasKey( 'left_by_another_plugin', $settings );
		$this->assertSame( array_keys( Read_Along::defaults() ), array_keys( $settings ) );
	}

	public function test_saving_one_setting_keeps_the_other_nine() {
		Read_Along::save(
			array(
				'tta__highlight_enabled' => true,
				'tta__highlight_mode'    => 'word',
				'tta__highlight_word_bg' => '#112233',
			)
		);

		$saved = Read_Along::save( array( 'tta__highlight_autoscroll' => false ) );

		$this->assertTrue( $saved['tta__highlight_enabled'] );
		$this->assertSame( 'word', $saved['tta__highlight_mode'] );
		$this->assertSame( '#112233', $saved['tta__highlight_word_bg'] );
		$this->assertFalse( $saved['tta__highlight_autoscroll'] );
		$this->assertSame( $saved, get_option( Read_Along::OPTION ) );
	}

	public function test_stored_shape_is_the_classic_one() {
		Read_Along::save( array( 'tta__highlight_enabled' => true ) );

		$stored = get_option( Read_Along::OPTION );

		$this->assertIsArray( $stored );
		$this->assertSame(
			array(
				'tta__highlight_enabled',
				'tta__highlight_mode',
				'tta__highlight_word_bg',
				'tta__highlight_word_color',
				'tta__highlight_sentence_bg',
				'tta__highlight_dim_enabled',
				'tta__highlight_dim_opacity',
				'tta__highlight_autoscroll',
				'tta__selection_listen_enabled',
				'tta__selection_announce',
			),
			array_keys( $stored )
		);
		$this->assertIsBool( $stored['tta__highlight_enabled'] );
		$this->assertIsFloat( $stored['tta__highlight_dim_opacity'] );
	}

	public function test_bad_values_fall_back_and_the_opacity_is_clamped() {
		$saved = Read_Along::save(
			array(
				'tta__highlight_mode'        => 'evil',
				'tta__highlight_word_bg'     => 'javascript:alert(1)',
				'tta__highlight_word_color'  => array( '#fff' ),
				'tta__highlight_dim_opacity' => 99,
				'tta__selection_announce'    => '<script>',
			)
		);

		$this->assertSame( 'sentence', $saved['tta__highlight_mode'] );
		$this->assertSame( '#a5abf0', $saved['tta__highlight_word_bg'] );
		$this->assertSame( '#202124', $saved['tta__highlight_word_color'] );
		$this->assertSame( 0.85, $saved['tta__highlight_dim_opacity'] );
		$this->assertSame( 'tip', $saved['tta__selection_announce'] );

		$this->assertSame( 0.1, Read_Along::save( array( 'tta__highlight_dim_opacity' => -3 ) )['tta__highlight_dim_opacity'] );
	}

	public function test_saving_clears_the_settings_cache() {
		\TTA\TTA_Helper::tts_get_settings( 'highlight' );

		Read_Along::save( array( 'tta__highlight_enabled' => true ) );

		$this->assertTrue( (bool) ( (array) \TTA\TTA_Helper::tts_get_settings( 'highlight' ) )['tta__highlight_enabled'] );
	}

	// The classic route still behaves as it did.

	public function test_classic_route_stores_the_same_as_the_new_route() {
		$fields = array(
			'tta__highlight_enabled'        => true,
			'tta__highlight_mode'           => 'word_sentence',
			'tta__highlight_word_bg'        => '#fcd34d',
			'tta__highlight_word_color'     => '#000000',
			'tta__highlight_sentence_bg'    => '#fef3c7',
			'tta__highlight_dim_enabled'    => false,
			'tta__highlight_dim_opacity'    => 0.4,
			'tta__highlight_autoscroll'     => false,
			'tta__selection_listen_enabled' => true,
			'tta__selection_announce'       => 'both',
		);

		$response     = $this->classic( $fields );
		$from_classic = serialize( get_option( Read_Along::OPTION ) );

		$this->assertTrue( $response->get_data()['status'] );
		$this->assertSame( $fields, $response->get_data()['data'] );

		delete_option( Read_Along::OPTION );
		$this->call( 'POST', $fields );

		$this->assertSame( $from_classic, serialize( get_option( Read_Along::OPTION ) ) );
	}

	// The new routes.

	public function test_route_describes_itself_for_api_clients_and_mcp() {
		$routes = rest_get_server()->get_routes();

		foreach ( $routes['/tta/v1/read-along'] as $endpoint ) {
			$this->assertNotEmpty( $endpoint['label'] );
			$this->assertNotEmpty( $endpoint['description'] );
			foreach ( $endpoint['args'] as $name => $arg ) {
				$this->assertNotEmpty( $arg['type'], "$name has no type." );
				$this->assertNotEmpty( $arg['description'], "$name has no description." );
			}
		}

		// One argument per stored key, with the stored name.
		$this->assertSame( array_keys( Read_Along::defaults() ), array_keys( \TTA_Api\Read_Along_Controller::args() ) );
	}

	public function test_get_returns_all_ten_settings() {
		$this->assertSame( Read_Along::defaults(), $this->call( 'GET' )->get_data() );
	}

	public function test_post_changes_only_what_was_sent() {
		$response = $this->call( 'POST', array( 'tta__highlight_enabled' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['tta__highlight_enabled'] );
		$this->assertSame( array_replace( Read_Along::defaults(), array( 'tta__highlight_enabled' => true ) ), get_option( Read_Along::OPTION ) );
	}

	/**
	 * @dataProvider bad_requests
	 */
	public function test_a_value_that_is_not_allowed_is_a_400_and_saves_nothing( $params ) {
		$response = $this->call( 'POST', $params );

		$this->assertSame( 400, $response->get_status() );
		$this->assertFalse( get_option( Read_Along::OPTION ) );
	}

	public function bad_requests() {
		return array(
			'nothing sent'      => array( array() ),
			'only unknown keys' => array( array( 'something_else' => true ) ),
			'unknown mode'      => array( array( 'tta__highlight_mode' => 'evil' ) ),
			'not a colour'      => array( array( 'tta__highlight_word_bg' => 'red' ) ),
			'script as colour'  => array( array( 'tta__highlight_sentence_bg' => '<script>alert(1)</script>' ) ),
			'opacity too high'  => array( array( 'tta__highlight_dim_opacity' => 5 ) ),
			'switch as text'    => array( array( 'tta__highlight_enabled' => 'maybe' ) ),
			'unknown announce'  => array( array( 'tta__selection_announce' => 'popup' ) ),
		);
	}

	public function test_only_administrators_can_read_or_save() {
		foreach ( array( 0, self::factory()->user->create( array( 'role' => 'editor' ) ) ) as $user_id ) {
			wp_set_current_user( $user_id );

			$this->assertContains( $this->call( 'GET' )->get_status(), array( 401, 403 ) );
			$this->assertContains( $this->call( 'POST', array( 'tta__highlight_enabled' => true ) )->get_status(), array( 401, 403 ) );
		}

		$this->assertFalse( get_option( Read_Along::OPTION ) );
	}

	// WP-CLI.

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Read_Along_Command::class, WP_CLI::$commands['atlasvoice read-along'] );
	}

	public function test_cli_set_changes_one_setting_and_reports_it() {
		$command = new Read_Along_Command();

		$command->set( array( 'highlight_enabled', 'on' ), array() );
		$command->set( array( 'highlight_mode', 'word_sentence' ), array() );
		$command->set( array( 'highlight_dim_opacity', '0.5' ), array() );

		$saved = get_option( Read_Along::OPTION );
		$this->assertTrue( $saved['tta__highlight_enabled'] );
		$this->assertSame( 'word_sentence', $saved['tta__highlight_mode'] );
		$this->assertSame( 0.5, $saved['tta__highlight_dim_opacity'] );
		$this->assertSame( array( 'success', 'highlight_dim_opacity is now 0.5.' ), end( WP_CLI::$log ) );
	}

	/**
	 * @dataProvider bad_cli_values
	 */
	public function test_cli_set_refuses_a_bad_value_and_saves_nothing( $setting, $value ) {
		try {
			( new Read_Along_Command() )->set( array( $setting, $value ), array() );
			$this->fail( 'A bad value was accepted.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertFalse( get_option( Read_Along::OPTION ) );
		}
	}

	public function bad_cli_values() {
		return array(
			'unknown setting' => array( 'colour', '#fff' ),
			'unknown mode'    => array( 'highlight_mode', 'evil' ),
			'not a colour'    => array( 'highlight_word_bg', 'banana' ),
			'opacity range'   => array( 'highlight_dim_opacity', '2' ),
			'switch'          => array( 'highlight_enabled', 'maybe' ),
		);
	}

	public function test_cli_get_json_prints_the_stored_names() {
		( new Read_Along_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Read_Along::defaults(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_the_command_and_the_route_store_the_same_bytes() {
		( new Read_Along_Command() )->set( array( 'highlight_word_bg', '#FCD34D' ), array() );
		$from_cli = serialize( get_option( Read_Along::OPTION ) );

		delete_option( Read_Along::OPTION );
		$this->call( 'POST', array( 'tta__highlight_word_bg' => '#FCD34D' ) );

		$this->assertSame( $from_cli, serialize( get_option( Read_Along::OPTION ) ) );
	}
}
