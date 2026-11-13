<?php
/**
 * Tests for the WP-CLI commands `wp atlasvoice ui` and `wp atlasvoice mode` (TTS-376).
 *
 * @package TTA
 */

use TTA\AtlasVoice\Mode;
use TTA\CLI\Commands;
use TTA\CLI\Mode_Command;
use TTA\CLI\Ui_Command;
use TTA_Admin\Admin_App;

/**
 * @covers \TTA\CLI\Commands
 * @covers \TTA\CLI\Ui_Command
 * @covers \TTA\CLI\Mode_Command
 */
class CliCommandsTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Admin_App::OPTION );
		delete_option( 'tta_settings_data' );
		\TTA\TTA_Cache::flush();
	}

	private function last() {
		return end( WP_CLI::$log );
	}

	public function test_commands_are_registered_under_atlasvoice() {
		Commands::register();

		$this->assertSame( Ui_Command::class, WP_CLI::$commands['atlasvoice ui'] );
		$this->assertSame( Mode_Command::class, WP_CLI::$commands['atlasvoice mode'] );
	}

	public function test_pro_can_add_commands_and_a_missing_class_is_skipped() {
		$add = static function ( $commands ) {
			$commands['atlasvoice extra']  = Ui_Command::class;
			$commands['atlasvoice broken'] = 'Class_That_Does_Not_Exist';

			return $commands;
		};
		add_filter( 'atlasvoice_cli_commands', $add );

		Commands::register();

		remove_filter( 'atlasvoice_cli_commands', $add );

		$this->assertArrayHasKey( 'atlasvoice extra', WP_CLI::$commands );
		$this->assertArrayNotHasKey( 'atlasvoice broken', WP_CLI::$commands );
	}

	public function test_ui_get_prints_the_default_then_the_saved_choice() {
		$command = new Ui_Command();

		$command->get( array(), array() );
		$this->assertSame( array( 'line', Admin_App::DEFAULT_UI ), $this->last() );

		update_option( Admin_App::OPTION, 'new' );
		$command->get( array(), array() );
		$this->assertSame( array( 'line', 'new' ), $this->last() );
	}

	public function test_ui_set_saves_the_choice() {
		( new Ui_Command() )->set( array( 'classic' ), array() );

		$this->assertSame( 'classic', get_option( Admin_App::OPTION ) );
		$this->assertSame( 'success', $this->last()[0] );
	}

	public function test_ui_set_refuses_an_unknown_word_and_saves_nothing() {
		try {
			( new Ui_Command() )->set( array( 'modern' ), array() );
			$this->fail( 'An unknown value was accepted.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertSame( 'error', $this->last()[0] );
		}

		$this->assertFalse( get_option( Admin_App::OPTION ) );
	}

	public function test_ui_set_new_warns_when_an_old_pro_keeps_the_classic_screens() {
		add_filter( 'tts_is_atlasvoice_addon_functional', '__return_true' );

		( new Ui_Command() )->set( array( 'new' ), array() );

		remove_filter( 'tts_is_atlasvoice_addon_functional', '__return_true' );

		$this->assertSame( 'new', get_option( Admin_App::OPTION ) );
		$this->assertSame( 'warning', $this->last()[0] );
		$this->assertStringContainsString( 'Pro', $this->last()[1] );
	}

	public function test_mode_get_prints_staging_then_live() {
		$command = new Mode_Command();

		$command->get( array(), array() );
		$this->assertSame( array( 'line', 'staging' ), $this->last() );

		Mode::set( Mode::MODE_PRODUCTION );
		$command->get( array(), array() );
		$this->assertSame( array( 'line', 'live' ), $this->last() );
	}

	public function test_mode_set_live_asks_first_and_fires_the_go_live_action() {
		$fired = did_action( 'atlasvoice_go_live' );

		( new Mode_Command() )->set( array( 'live' ), array() );

		$this->assertSame( 'confirm', WP_CLI::$log[0][0] );
		$this->assertTrue( Mode::is_production() );
		$this->assertSame( $fired + 1, did_action( 'atlasvoice_go_live' ) );
	}

	public function test_mode_set_live_does_nothing_when_the_answer_is_no() {
		WP_CLI::$confirm_answer = false;

		try {
			( new Mode_Command() )->set( array( 'live' ), array() );
			$this->fail( 'Went live without a yes.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertFalse( Mode::is_production() );
		}
	}

	public function test_mode_set_live_with_yes_does_not_ask() {
		( new Mode_Command() )->set( array( 'live' ), array( 'yes' => true ) );

		$this->assertTrue( Mode::is_production() );
		$this->assertNotContains( 'confirm', array_column( WP_CLI::$log, 0 ) );
	}

	public function test_mode_set_staging_keeps_every_other_setting() {
		update_option(
			'tta_settings_data',
			(object) array(
				'tta__settings_atlasvoice_mode' => 'production',
				'kept'                          => 'yes',
			)
		);
		\TTA\TTA_Cache::flush();
		$fired = did_action( 'atlasvoice_reverted_to_staging' );

		( new Mode_Command() )->set( array( 'staging' ), array() );

		$this->assertFalse( Mode::is_production() );
		$this->assertSame( 'yes', get_option( 'tta_settings_data' )->kept );
		$this->assertSame( $fired + 1, did_action( 'atlasvoice_reverted_to_staging' ) );
	}

	public function test_mode_set_refuses_an_unknown_word() {
		try {
			( new Mode_Command() )->set( array( 'production' ), array() );
			$this->fail( 'An unknown value was accepted.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertFalse( Mode::is_production() );
		}
	}
}
