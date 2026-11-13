<?php
/**
 * Tests for the AI notice of the player: the service class, what it prints,
 * its REST routes and `wp atlasvoice ai-notice` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\AI_Notice_Command;
use TTA\CLI\Commands;
use TTA\Player\AI_Notice;

/**
 * @covers \TTA\Player\AI_Notice
 * @covers \TTA_Api\AI_Notice_Controller
 * @covers \TTA\CLI\AI_Notice_Command
 */
class AINoticeTest extends WP_UnitTestCase {

	const PLAYER  = "<tts-play-button data-id='1' class='tts_play_button'></tts-play-button>";
	const DEFAULT = 'This article is read by an AI-generated voice.';

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( AI_Notice::OPTION );
		remove_all_filters( 'atlasvoice_ai_notice_text' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_ai_notice_text' );
		parent::tear_down();
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/ai-notice' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Reading.

	public function test_a_site_that_never_set_it_has_the_notice_off() {
		$this->assertSame(
			array(
				'enabled'      => false,
				'text'         => '',
				'position'     => 'after',
				'default_text' => self::DEFAULT,
			),
			AI_Notice::get()
		);
		$this->assertFalse( get_option( AI_Notice::OPTION ) );
	}

	/**
	 * @dataProvider broken_options
	 */
	public function test_a_broken_stored_value_reads_as_off_and_safe( $stored ) {
		update_option( AI_Notice::OPTION, $stored );

		$notice = AI_Notice::get();

		$this->assertFalse( $notice['enabled'] );
		$this->assertSame( 'after', $notice['position'] );
		$this->assertStringNotContainsString( '<', $notice['text'] );
	}

	public function broken_options() {
		return array(
			'text'             => array( 'on' ),
			'a wrong position' => array( array( 'position' => 'sideways' ) ),
			'a list as text'   => array( array( 'text' => array( 'x' ) ) ),
			'markup as text'   => array( array( 'text' => '<script>alert(1)</script>' ) ),
		);
	}

	// What visitors see.

	public function test_a_site_that_updates_sees_no_change_in_the_player() {
		$this->assertSame( self::PLAYER, AI_Notice::add_to( self::PLAYER ) );
	}

	public function test_the_notice_sits_below_the_player_by_default() {
		AI_Notice::save( array( 'enabled' => true ) );

		$html = AI_Notice::add_to( self::PLAYER );

		$this->assertStringStartsWith( self::PLAYER, $html );
		$this->assertStringContainsString( '<div class="atlasvoice-ai-notice"', $html );
		$this->assertStringContainsString( '>' . self::DEFAULT . '</div>', $html );
	}

	public function test_it_can_sit_above_the_player() {
		AI_Notice::save(
			array(
				'enabled'  => true,
				'position' => 'before',
			)
		);

		$html = AI_Notice::add_to( self::PLAYER );

		$this->assertStringStartsWith( '<div class="atlasvoice-ai-notice"', $html );
		$this->assertStringEndsWith( self::PLAYER, $html );
	}

	public function test_it_shows_the_owners_own_sentence() {
		AI_Notice::save(
			array(
				'enabled' => true,
				'text'    => 'Read by a synthetic voice.',
			)
		);

		$html = AI_Notice::add_to( self::PLAYER );

		$this->assertStringContainsString( '>Read by a synthetic voice.</div>', $html );
		$this->assertStringNotContainsString( self::DEFAULT, $html );
	}

	public function test_the_text_is_escaped_when_printed() {
		update_option(
			AI_Notice::OPTION,
			array(
				'enabled' => true,
				'text'    => 'Tom & Jerry "read" this',
			)
		);
		add_filter(
			'atlasvoice_ai_notice_text',
			static function ( $text ) {
				return $text . ' <img src=x onerror=alert(1)>';
			}
		);

		$html = AI_Notice::add_to( self::PLAYER );

		$this->assertStringContainsString( 'Tom &amp; Jerry &quot;read&quot; this &lt;img', $html );
		$this->assertStringNotContainsString( '<img', $html );
	}

	public function test_a_filter_can_change_the_text_or_hide_the_notice() {
		AI_Notice::save( array( 'enabled' => true ) );

		add_filter( 'atlasvoice_ai_notice_text', '__return_empty_string' );

		$this->assertSame( self::PLAYER, AI_Notice::add_to( self::PLAYER ) );
	}

	public function test_the_notice_survives_the_filter_of_the_player_markup() {
		AI_Notice::save( array( 'enabled' => true ) );

		// The same allow-list as tta_get_button_content() in includes/helpers.php.
		$allowed = array(
			'tts-play-button' => array(
				'data-id' => true,
				'class'   => true,
			),
			'div'             => array(
				'class'   => true,
				'id'      => true,
				'style'   => true,
				'data-id' => true,
			),
		);

		$html = wp_kses( AI_Notice::add_to( self::PLAYER ), $allowed );

		$this->assertStringContainsString( '<div class="atlasvoice-ai-notice" style="', $html );
		$this->assertStringContainsString( self::DEFAULT, $html );
	}

	public function test_the_player_markup_of_a_post_carries_the_notice() {
		$source = file_get_contents( dirname( __DIR__, 4 ) . '/includes/helpers.php' );

		$notice  = strpos( $source, 'AI_Notice::add_to(' );
		$staging = strpos( $source, 'Mode::staging_note_html(' );
		$filter  = strpos( $source, "apply_filters('tts__listening_button'" );
		$kses    = strpos( $source, 'wp_kses( (string) $data, $allowed )' );

		// After Pro's filter, before the staging note, and before the markup is filtered.
		$this->assertNotFalse( $notice );
		$this->assertGreaterThan( $filter, $notice );
		$this->assertLessThan( $staging, $notice );
		$this->assertLessThan( $kses, $notice );
	}

	// Saving.

	public function test_a_save_stores_one_small_option() {
		$saved = AI_Notice::save(
			array(
				'enabled'  => true,
				'text'     => 'Read by a synthetic voice.',
				'position' => 'before',
			)
		);

		$this->assertSame(
			array(
				'enabled'  => true,
				'text'     => 'Read by a synthetic voice.',
				'position' => 'before',
			),
			get_option( AI_Notice::OPTION )
		);
		$this->assertTrue( $saved['enabled'] );
	}

	public function test_only_what_was_sent_changes() {
		AI_Notice::save(
			array(
				'enabled' => true,
				'text'    => 'Read by a synthetic voice.',
			)
		);

		$saved = AI_Notice::save( array( 'position' => 'before' ) );

		$this->assertTrue( $saved['enabled'] );
		$this->assertSame( 'Read by a synthetic voice.', $saved['text'] );
		$this->assertSame( 'before', $saved['position'] );
	}

	public function test_the_default_sentence_is_stored_as_no_text_so_it_stays_translated() {
		$saved = AI_Notice::save( array( 'text' => self::DEFAULT ) );

		$this->assertSame( '', $saved['text'] );
		$this->assertSame( '', get_option( AI_Notice::OPTION )['text'] );
	}

	public function test_markup_in_the_text_is_removed() {
		$saved = AI_Notice::save( array( 'text' => '<b>AI voice</b><script>alert(1)</script>' ) );

		$this->assertSame( 'AI voice', $saved['text'] );
	}

	public function test_no_other_option_is_touched() {
		update_option( 'tta_customize_settings', (object) array( 'color' => '#000000' ) );
		update_option( 'tta_settings_data', (object) array( 'tta__settings_atlasvoice_mode' => 'live' ) );
		$customize = serialize( get_option( 'tta_customize_settings' ) );
		$settings  = serialize( get_option( 'tta_settings_data' ) );

		AI_Notice::save( array( 'enabled' => true ) );

		$this->assertSame( $customize, serialize( get_option( 'tta_customize_settings' ) ) );
		$this->assertSame( $settings, serialize( get_option( 'tta_settings_data' ) ) );
	}

	public function test_removing_the_plugin_data_removes_the_notice() {
		$this->assertStringContainsString( "'" . AI_Notice::OPTION . "'", file_get_contents( dirname( __DIR__, 4 ) . '/includes/TTA_Reset.php' ) );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		$result = AI_Notice::save(
			array(
				'position' => 'before',
				$field     => $value,
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( sanitize_key( $field ), $result->get_error_data()['field'] );
		$this->assertFalse( get_option( AI_Notice::OPTION ) );
	}

	public function wrong_values() {
		return array(
			'on as a word'       => array( 'enabled', 'maybe' ),
			'on as a list'       => array( 'enabled', array( true ) ),
			'text as a list'     => array( 'text', array( 'x' ) ),
			'text too long'      => array( 'text', str_repeat( 'a', 201 ) ),
			'a wrong position'   => array( 'position', 'left' ),
			'an unknown setting' => array( 'colour', 'red' ),
		);
	}

	public function test_an_empty_save_is_refused() {
		$result = AI_Notice::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// The REST routes.

	public function test_get_returns_the_settings() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( AI_Notice::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent() {
		$response = $this->rest( 'POST', array( 'enabled' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['enabled'] );
		$this->assertSame( 'after', $response->get_data()['position'] );
	}

	public function test_post_can_turn_it_off_again() {
		AI_Notice::save( array( 'enabled' => true ) );

		$response = $this->rest( 'POST', array( 'enabled' => false ) );

		$this->assertFalse( $response->get_data()['enabled'] );
		$this->assertSame( self::PLAYER, AI_Notice::add_to( self::PLAYER ) );
	}

	public function test_post_refuses_values_outside_the_described_limits() {
		$this->assertSame( 400, $this->rest( 'POST', array( 'position' => 'left' ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'text' => str_repeat( 'a', 201 ) ) )->get_status() );
		$this->assertFalse( get_option( AI_Notice::OPTION ) );
	}

	public function test_each_method_and_each_setting_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/ai-notice'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		foreach ( array( 'enabled', 'text', 'position' ) as $name ) {
			$this->assertNotEmpty( $routes[1]['args'][ $name ]['description'], $name );
		}
		$this->assertSame( AI_Notice::POSITIONS, $routes[1]['args']['position']['enum'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_the_notice( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'enabled' => true ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( AI_Notice::OPTION ) );
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

		$this->assertSame( AI_Notice_Command::class, WP_CLI::$commands['atlasvoice ai-notice'] );
	}

	public function test_get_prints_the_settings_and_marks_the_default_sentence() {
		( new AI_Notice_Command() )->get( array(), array() );

		$this->assertSame(
			array( 'notice: off', 'text: ' . self::DEFAULT . ' (default)', 'position: after' ),
			wp_list_pluck( WP_CLI::$log, 1 )
		);
	}

	public function test_get_can_print_json_for_scripts() {
		( new AI_Notice_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( AI_Notice::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_set_turns_it_on_and_places_it() {
		( new AI_Notice_Command() )->set( array( 'on' ), array( 'position' => 'before' ) );

		$this->assertSame( array( 'success', 'AI notice saved.' ), end( WP_CLI::$log ) );
		$this->assertTrue( AI_Notice::get()['enabled'] );
		$this->assertSame( 'before', AI_Notice::get()['position'] );
	}

	public function test_set_can_change_the_text_alone_and_turn_it_off() {
		( new AI_Notice_Command() )->set( array( 'on' ), array() );
		( new AI_Notice_Command() )->set( array(), array( 'text' => 'Read by a synthetic voice.' ) );

		$this->assertTrue( AI_Notice::get()['enabled'] );
		$this->assertSame( 'Read by a synthetic voice.', AI_Notice::get()['text'] );

		( new AI_Notice_Command() )->set( array( 'off' ), array() );

		$this->assertFalse( AI_Notice::get()['enabled'] );
	}

	public function test_set_says_why_a_value_was_refused() {
		try {
			( new AI_Notice_Command() )->set( array( 'maybe' ), array() );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'on or off', WP_CLI::$log[0][1] );
	}
}
