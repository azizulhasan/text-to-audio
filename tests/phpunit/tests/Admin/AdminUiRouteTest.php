<?php
/**
 * REST tests for POST tta/v1/admin-ui and the state behind it (TTS-374).
 *
 * @package TTA
 */

use TTA_Admin\Admin_App;

/**
 * @covers \TTA_Api\Admin_Ui_Controller
 * @covers \TTA_Api\Route_Access
 * @covers \TTA_Admin\Admin_App
 */
class AdminUiRouteTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
		delete_option( Admin_App::OPTION );
		delete_option( Admin_App::OPTION_WELCOME );
	}

	private function post( array $params ) {
		$request = new WP_REST_Request( 'POST', '/tta/v1/admin-ui' );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	public function test_route_describes_itself_for_api_clients_and_mcp() {
		$routes   = rest_get_server()->get_routes();
		$endpoint = $routes['/tta/v1/admin-ui'][0];

		$this->assertSame( array( 'POST' => true ), $endpoint['methods'] );
		$this->assertNotEmpty( $endpoint['label'] );
		$this->assertNotEmpty( $endpoint['description'] );
		foreach ( array( 'ui', 'welcome' ) as $arg ) {
			$this->assertSame( 'string', $endpoint['args'][ $arg ]['type'] );
			$this->assertNotEmpty( $endpoint['args'][ $arg ]['enum'] );
			$this->assertNotEmpty( $endpoint['args'][ $arg ]['description'] );
		}
	}

	public function test_admin_can_choose_each_ui() {
		$response = $this->post( array( 'ui' => 'new' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'new', get_option( Admin_App::OPTION ) );
		$this->assertSame( 'new', $response->get_data()['ui'] );

		$this->post( array( 'ui' => 'classic' ) );
		$this->assertSame( 'classic', get_option( Admin_App::OPTION ) );
	}

	/**
	 * @dataProvider bad_values
	 */
	public function test_anything_but_the_two_words_is_refused( $value ) {
		update_option( Admin_App::OPTION, 'classic' );

		$response = $this->post( array( 'ui' => $value ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'classic', get_option( Admin_App::OPTION ) );
	}

	public function bad_values() {
		return array(
			'other word' => array( 'modern' ),
			'upper case' => array( 'NEW' ),
			'empty'      => array( '' ),
			'markup'     => array( '<script>alert(1)</script>' ),
			'array'      => array( array( 'new' ) ),
			'number'     => array( 1 ),
		);
	}

	public function test_empty_request_is_refused() {
		$this->assertSame( 400, $this->post( array() )->get_status() );
	}

	public function test_only_administrators_can_switch() {
		foreach ( array( 0, self::factory()->user->create( array( 'role' => 'editor' ) ) ) as $user_id ) {
			wp_set_current_user( $user_id );

			$response = $this->post( array( 'ui' => 'new' ) );

			$this->assertContains( $response->get_status(), array( 401, 403 ) );
			$this->assertFalse( get_option( Admin_App::OPTION ) );
		}
	}

	public function test_a_client_without_a_browser_nonce_is_allowed_when_it_is_an_admin() {
		// An application password, WP-CLI or an MCP server has no X-WP-Nonce.
		// The capability decides; the request sets no nonce here on purpose.
		$this->assertSame( 200, $this->post( array( 'ui' => 'classic' ) )->get_status() );
	}

	public function test_switching_never_touches_the_settings() {
		$settings = (object) array(
			'tta__settings_atlasvoice_mode' => 'production',
			'x'                             => array( 1, 2 ),
		);
		update_option( 'tta_settings_data', $settings );
		update_option( 'tta_customize_settings', (object) array( 'color' => '#184c53' ) );
		$before = array(
			serialize( get_option( 'tta_settings_data' ) ),
			serialize( get_option( 'tta_customize_settings' ) ),
		);

		$this->post( array( 'ui' => 'new' ) );
		$this->post( array( 'ui' => 'classic' ) );
		$this->post( array( 'ui' => 'new' ) );

		$this->assertSame(
			$before,
			array(
				serialize( get_option( 'tta_settings_data' ) ),
				serialize( get_option( 'tta_customize_settings' ) ),
			)
		);
	}

	public function test_a_site_that_updated_gets_the_welcome_once() {
		// No option: the site was installed before the new screens existed.
		$this->assertTrue( Admin_App::welcome_pending() );
		$this->assertTrue( Admin_App::boot_data()['showWelcome'] );

		$response = $this->post( array( 'welcome' => 'seen' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['showWelcome'] );
		$this->assertFalse( Admin_App::welcome_pending() );
	}

	public function test_a_new_install_gets_no_welcome() {
		Admin_App::mark_new_install();

		$this->assertFalse( Admin_App::welcome_pending() );
	}

	public function test_first_activation_marks_a_new_install() {
		delete_option( 'tta_has_been_activated_before' );

		\TTA\TTA_Activator::activate();

		$this->assertSame( 'none', get_option( Admin_App::OPTION_WELCOME ) );
	}

	public function test_reactivating_an_existing_site_keeps_its_welcome() {
		update_option( 'tta_has_been_activated_before', true );

		\TTA\TTA_Activator::activate();

		$this->assertTrue( Admin_App::welcome_pending() );
	}

	public function test_marking_a_new_install_never_overwrites_a_seen_welcome() {
		Admin_App::mark_welcome_seen();
		Admin_App::mark_new_install();

		$this->assertSame( 'seen', get_option( Admin_App::OPTION_WELCOME ) );
	}

	public function test_an_old_pro_keeps_the_classic_screens() {
		if ( ! Admin_App::is_built() ) {
			$this->markTestSkipped( 'The admin app is not built.' );
		}
		update_option( Admin_App::OPTION, 'new' );

		// Pro is active but has not said it supports the new app.
		add_filter( 'tts_is_atlasvoice_addon_functional', '__return_true' );
		$with_old_pro = \TTA\TTA_Helper::is_atlasvoice_addon_functional() ? Admin_App::is_enabled() : null;

		add_filter( 'atlasvoice_admin_app_pro_ready', '__return_true' );
		$with_new_pro = Admin_App::is_enabled();

		remove_filter( 'tts_is_atlasvoice_addon_functional', '__return_true' );
		remove_filter( 'atlasvoice_admin_app_pro_ready', '__return_true' );

		if ( null === $with_old_pro ) {
			$this->markTestSkipped( 'Pro cannot be simulated through a filter on this version.' );
		}
		$this->assertFalse( $with_old_pro, 'An old Pro must keep the classic screens.' );
		$this->assertTrue( $with_new_pro );
	}

	public function test_free_alone_does_not_wait_for_pro() {
		$this->assertTrue( Admin_App::pro_is_ready() );
	}
}
