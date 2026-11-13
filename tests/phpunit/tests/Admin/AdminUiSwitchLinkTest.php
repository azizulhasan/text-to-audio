<?php
/**
 * Tests for the way from the classic screens to the new ones (TTS-374).
 *
 * @package TTA
 */

use TTA_Admin\Admin_App;

/**
 * @covers \TTA_Admin\Admin_App
 */
class AdminUiSwitchLinkTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		if ( ! Admin_App::is_built() ) {
			$this->markTestSkipped( 'The admin app is not built. Run: npm run app:build' );
		}
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		delete_option( Admin_App::OPTION );
		set_current_screen( 'toplevel_page_text-to-audio' );
		add_filter( 'wp_redirect', array( $this, 'stop_at_redirect' ) );
	}

	public function tear_down() {
		unset( $_GET['atlasvoice_switch_ui'], $_GET['page'], $_GET['_wpnonce'], $_REQUEST['_wpnonce'] );
		remove_filter( 'wp_redirect', array( $this, 'stop_at_redirect' ) );
		remove_filter( 'atlasvoice_admin_app_available', '__return_true' );
		set_current_screen( 'front' );
		parent::tear_down();
	}

	/**
	 * Stands in for the redirect + exit, so the handler can be tested.
	 */
	public function stop_at_redirect( $location ) {
		throw new RuntimeException( 'redirect:' . $location );
	}

	private function notice() {
		ob_start();
		Admin_App::classic_screen_notice();

		return ob_get_clean();
	}

	private function click( $ui, $nonce ) {
		$_GET['page']                 = 'text-to-audio';
		$_GET['atlasvoice_switch_ui'] = $ui;
		$_GET['_wpnonce']             = $nonce;
		$_REQUEST['_wpnonce']         = $nonce;

		try {
			Admin_App::handle_switch_link();
		} catch ( RuntimeException $stop ) {
			return $stop->getMessage();
		} catch ( WPDieException $died ) {
			return 'died';
		}

		return 'nothing';
	}

	public function test_nobody_is_invited_while_the_screens_are_being_built() {
		$this->assertFalse( Admin_App::AVAILABLE, 'Flip this only in the release that ships the screens.' );
		$this->assertFalse( Admin_App::is_available() );
		$this->assertSame( '', $this->notice() );
	}

	public function test_classic_screen_shows_one_notice_with_a_nonce_link_when_available() {
		add_filter( 'atlasvoice_admin_app_available', '__return_true' );

		$html = $this->notice();

		$this->assertSame( 1, substr_count( $html, 'class="notice' ) );
		$this->assertStringContainsString( 'Try the new screens', $html );
		$this->assertStringContainsString( 'atlasvoice_switch_ui=new', $html );
		$this->assertStringContainsString( '_wpnonce=', $html );
	}

	public function test_no_notice_on_the_new_screens_on_other_pages_or_for_other_users() {
		add_filter( 'atlasvoice_admin_app_available', '__return_true' );

		update_option( Admin_App::OPTION, 'new' );
		$this->assertSame( '', $this->notice(), 'Shown although the new screens are in use.' );
		delete_option( Admin_App::OPTION );

		set_current_screen( 'dashboard' );
		$this->assertSame( '', $this->notice(), 'Shown outside the AtlasVoice screen.' );
		set_current_screen( 'toplevel_page_text-to-audio' );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$this->assertSame( '', $this->notice(), 'Shown to a user who cannot switch.' );
	}

	public function test_a_valid_click_switches_and_reloads_without_the_link_arguments() {
		$result = $this->click( 'new', wp_create_nonce( Admin_App::SWITCH_ACTION ) );

		$this->assertSame( 'new', get_option( Admin_App::OPTION ) );
		$this->assertStringStartsWith( 'redirect:', $result );
		$this->assertStringNotContainsString( 'atlasvoice_switch_ui', $result );
		$this->assertStringNotContainsString( '_wpnonce', $result );
	}

	public function test_a_click_without_a_valid_nonce_changes_nothing() {
		$this->assertSame( 'died', $this->click( 'new', 'forged' ) );
		$this->assertFalse( get_option( Admin_App::OPTION ) );
	}

	public function test_a_user_who_is_not_an_administrator_cannot_switch() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertSame( 'died', $this->click( 'new', wp_create_nonce( Admin_App::SWITCH_ACTION ) ) );
		$this->assertFalse( get_option( Admin_App::OPTION ) );
	}

	public function test_an_unknown_value_in_the_link_saves_nothing() {
		$this->click( 'modern', wp_create_nonce( Admin_App::SWITCH_ACTION ) );

		$this->assertFalse( get_option( Admin_App::OPTION ) );
	}

	public function test_other_admin_pages_are_left_alone() {
		$_GET['page']                 = 'another-plugin';
		$_GET['atlasvoice_switch_ui'] = 'new';

		Admin_App::handle_switch_link();

		$this->assertFalse( get_option( Admin_App::OPTION ) );
	}
}
