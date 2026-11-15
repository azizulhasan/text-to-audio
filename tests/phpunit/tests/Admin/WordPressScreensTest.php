<?php
/**
 * Tests for the AtlasVoice parts on WordPress's own screens (TTS-347): the
 * Network Admin table, the dashboard widget's links and the dialog that
 * offers help before the plugin is deactivated.
 *
 * @package TTA
 */

use TTA\TTA_AtlasVoice_Service as Service;
use TTA_Admin\Admin_App;
use TTA_Admin\TTA_Admin;
use TTA_Admin\TTA_Dashboard_Widget;

/**
 * @covers \TTA_Admin\TTA_Admin::network_row_words
 * @covers \TTA_Admin\TTA_Admin::render_deactivation_rescue_modal
 * @covers \TTA_Admin\TTA_Dashboard_Widget::links
 */
class WordPressScreensTest extends WP_UnitTestCase {

	public function tear_down() {
		remove_all_filters( 'atlasvoice_admin_ui' );
		unset( $GLOBALS['pagenow'] );
		parent::tear_down();
	}

	private function new_admin() {
		add_filter(
			'atlasvoice_admin_ui',
			static function () {
				return Admin_App::UI_NEW;
			}
		);

		return Admin_App::is_enabled();
	}

	// ---- Network Admin ---------------------------------------------------------

	public function test_a_site_that_never_saved_settings_is_off() {
		$words = TTA_Admin::network_row_words( false, false, 0 );

		$this->assertSame( array( 'Off', '', 'No' ), array( $words['mode'], $words['voice'], $words['set_up'] ) );
	}

	public function test_a_site_says_live_or_staging() {
		$this->assertSame( 'Live', TTA_Admin::network_row_words( true, true, 1 )['mode'] );
		$this->assertSame( 'Staging', TTA_Admin::network_row_words( true, false, 1 )['mode'] );
		$this->assertSame( 'Yes', TTA_Admin::network_row_words( true, false, 1 )['set_up'] );
		$this->assertNotSame( TTA_Admin::network_row_words( true, true, 1 )['dot'], TTA_Admin::network_row_words( true, false, 1 )['dot'] );
	}

	public function test_the_voice_is_named_not_numbered() {
		$this->assertSame( 'Browser voice', TTA_Admin::network_row_words( true, true, 1 )['voice'] );
		$this->assertSame( 'Browser voice', TTA_Admin::network_row_words( true, true, 2 )['voice'] );
		$this->assertSame( 'Natural voice', TTA_Admin::network_row_words( true, true, Service::PLAYER_ID )['voice'] );
		$this->assertSame( '', TTA_Admin::network_row_words( true, true, 0 )['voice'] );
		$this->assertSame( '', TTA_Admin::network_row_words( true, true, 99 )['voice'], 'An engine this site does not have has no name to show.' );
	}

	// ---- the dashboard widget --------------------------------------------------

	public function test_the_widget_opens_the_screens_of_the_admin_in_use() {
		$classic = TTA_Dashboard_Widget::links();
		$this->assertStringEndsWith( '#/analytics', $classic['insights'] );
		$this->assertStringEndsWith( '#/customize', $classic['player'] );

		if ( $this->new_admin() ) {
			$new = TTA_Dashboard_Widget::links();
			$this->assertStringEndsWith( '#/insights', $new['insights'] );
			$this->assertStringEndsWith( '#/player', $new['player'] );
		}
	}

	// ---- before deactivating ---------------------------------------------------

	private function dialog() {
		$GLOBALS['pagenow'] = 'plugins.php'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		ob_start();
		( new TTA_Admin( 'text-to-audio', '1' ) )->render_deactivation_rescue_modal();

		return (string) ob_get_clean();
	}

	public function test_the_dialog_is_only_on_the_plugins_screen() {
		$GLOBALS['pagenow'] = 'index.php'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		ob_start();
		( new TTA_Admin( 'text-to-audio', '1' ) )->render_deactivation_rescue_modal();

		$this->assertSame( '', ob_get_clean() );
	}

	public function test_the_dialog_offers_help_first_with_the_approved_words() {
		$html = $this->dialog();

		$this->assertStringContainsString( 'Can we help first?', $html );
		$this->assertStringContainsString( 'Most problems take two minutes to fix.', $html );
		foreach ( array( 'The player doesn’t show', 'Run the health check', 'The voice sounds robotic', 'Try the natural voice', 'Cancel', 'No thanks, deactivate' ) as $words ) {
			$this->assertStringContainsString( $words, $html );
		}
		$this->assertStringNotContainsString( 'Having trouble?', $html );
	}

	public function test_the_dialog_is_a_named_dialog_and_keeps_the_ids_its_script_uses() {
		$html = $this->dialog();

		$this->assertStringContainsString( 'role="dialog"', $html );
		$this->assertStringContainsString( 'aria-labelledby="tta-rescue-title"', $html );
		foreach ( array( 'tta-rescue-modal-overlay', 'tta-rescue-continue-deactivate', 'tta-rescue-cancel', 'tta-rescue-title' ) as $id ) {
			$this->assertStringContainsString( 'id="' . $id . '"', $html );
		}
	}

	public function test_the_dialog_opens_the_screens_of_the_admin_in_use() {
		$classic = $this->dialog();
		$this->assertStringContainsString( '#/compatibility', $classic );
		$this->assertStringContainsString( '#/integrations', $classic );

		if ( $this->new_admin() ) {
			$new = $this->dialog();
			$this->assertStringContainsString( '#/site/health', $new );
			$this->assertStringContainsString( '#/voice"', $new );
		}
	}
}
