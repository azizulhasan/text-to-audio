<?php
/**
 * Tests for TTA_Admin\Admin_App: which admin UI is shown, and what is loaded (TTS-372).
 *
 * @package TTA
 */

use TTA_Admin\Admin_App;

/**
 * @covers \TTA_Admin\Admin_App
 */
class AdminAppTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		if ( ! Admin_App::is_built() ) {
			$this->markTestSkipped( 'The admin app is not built. Run: npm run app:build' );
		}
	}

	public function tear_down() {
		unset( $_GET['atlasvoice_ui'] );
		wp_dequeue_script( Admin_App::HANDLE );
		wp_deregister_script( Admin_App::HANDLE );
		wp_dequeue_style( Admin_App::HANDLE );
		wp_deregister_style( Admin_App::HANDLE );
		parent::tear_down();
	}

	public function test_classic_ui_is_the_default_when_nothing_is_stored() {
		delete_option( Admin_App::OPTION );

		$this->assertFalse( Admin_App::is_enabled() );
	}

	public function test_new_ui_is_shown_only_for_the_exact_stored_word() {
		update_option( Admin_App::OPTION, 'new' );
		$this->assertTrue( Admin_App::is_enabled() );

		foreach ( array( 'classic', '', '1', 'NEW', 'anything' ) as $value ) {
			update_option( Admin_App::OPTION, $value );
			$this->assertFalse( Admin_App::is_enabled(), "Stored value \"$value\" must show the classic UI." );
		}
	}

	public function test_url_can_ask_for_the_classic_ui_without_changing_the_option() {
		update_option( Admin_App::OPTION, 'new' );
		$_GET['atlasvoice_ui'] = 'classic';

		$this->assertFalse( Admin_App::is_enabled() );
		$this->assertSame( 'new', get_option( Admin_App::OPTION ) );
	}

	public function test_url_cannot_switch_the_new_ui_on() {
		update_option( Admin_App::OPTION, 'classic' );
		$_GET['atlasvoice_ui'] = 'new';

		$this->assertFalse( Admin_App::is_enabled() );
	}

	public function test_filter_can_choose_the_ui() {
		delete_option( Admin_App::OPTION );
		add_filter( 'atlasvoice_admin_ui', array( $this, 'return_new' ) );

		$enabled = Admin_App::is_enabled();

		remove_filter( 'atlasvoice_admin_ui', array( $this, 'return_new' ) );

		$this->assertTrue( $enabled );
	}

	public function test_enqueue_uses_wordpress_react_and_components() {
		Admin_App::enqueue();

		$script = wp_scripts()->registered[ Admin_App::HANDLE ];

		$this->assertTrue( wp_script_is( Admin_App::HANDLE, 'enqueued' ) );
		$this->assertContains( 'wp-element', $script->deps );
		$this->assertContains( 'wp-components', $script->deps );
		$this->assertStringContainsString( 'build/admin-app/index.js', $script->src );
		$this->assertTrue( wp_style_is( Admin_App::HANDLE, 'enqueued' ) );
		$this->assertContains( 'wp-components', wp_styles()->registered[ Admin_App::HANDLE ]->deps );
	}

	public function test_boot_data_is_printed_before_the_script() {
		Admin_App::enqueue();

		$before = wp_scripts()->get_data( Admin_App::HANDLE, 'before' );

		$this->assertStringContainsString( 'window.atlasvoiceBoot = {', implode( "\n", (array) $before ) );
	}

	public function test_boot_data_holds_no_secret() {
		// Stored credentials of the kind the plugin keeps.
		update_option( 'elevenlabs_tts', (object) array( 'elevenlabs_api_key' => 'sk_secret_eleven_123' ) );
		update_option( 'chat_gpt_tts', (object) array( 'chatgpt_tts_api_key' => 'sk-secret-openai-456' ) );

		$data = Admin_App::boot_data();
		$json = wp_json_encode( $data );

		$this->assertSame( array( 'version', 'restUrl', 'restNonce', 'logoUrl', 'classicUrl' ), array_keys( $data ) );
		$this->assertStringNotContainsString( 'sk_secret_eleven_123', $json );
		$this->assertStringNotContainsString( 'sk-secret-openai-456', $json );
		$this->assertStringNotContainsString( 'admin@example.org', $json );
	}

	public function test_root_gives_notices_a_place_outside_the_app() {
		ob_start();
		Admin_App::render_root();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'id="atlasvoice-app"', $html );
		$this->assertLessThan(
			strpos( $html, 'id="atlasvoice-app"' ),
			strpos( $html, 'wp-header-end' ),
			'Notices must be placed before the app, not inside it.'
		);
	}

	public function return_new() {
		return 'new';
	}
}
