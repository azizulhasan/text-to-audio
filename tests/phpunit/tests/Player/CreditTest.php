<?php
/**
 * Tests for the line "Voiced by AtlasVoice" under the player: the service
 * class, what it prints, its REST routes and `wp atlasvoice credit`
 * (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Credit_Command;
use TTA\Player\AI_Notice;
use TTA\Player\Credit;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Player\Credit
 * @covers \TTA_Api\Credit_Controller
 * @covers \TTA\CLI\Credit_Command
 */
class CreditTest extends WP_UnitTestCase {

	const PLAYER = "<tts-play-button data-id='1' class='tts_play_button'></tts-play-button>";
	const LINE   = 'Voiced by AtlasVoice';

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Credit::OPTION );
		delete_option( AI_Notice::OPTION );
		remove_all_filters( 'tts_get_player_id' );
		remove_all_filters( 'atlasvoice_free_mp3_player' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'tts_get_player_id' );
		remove_all_filters( 'atlasvoice_free_mp3_player' );
		parent::tear_down();
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/credit' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	/** The site's voice is the free natural voice. */
	private function use_the_natural_voice() {
		add_filter(
			'tts_get_player_id',
			function () {
				return Service::PLAYER_ID;
			},
			9999
		);
	}

	// Reading.

	public function test_a_site_that_never_set_it_has_the_line_off() {
		$credit = Credit::get();

		$this->assertFalse( $credit['enabled'] );
		$this->assertFalse( $credit['showing'] );
		$this->assertSame( self::LINE, $credit['text'] );
		$this->assertTrue( $credit['available'] );
	}

	/**
	 * @dataProvider broken_values
	 */
	public function test_a_broken_stored_value_reads_as_off( $stored ) {
		update_option( Credit::OPTION, $stored );

		$this->assertFalse( Credit::get()['enabled'] );
		$this->assertSame( self::PLAYER, Credit::add_to( self::PLAYER, Service::PLAYER_ID ) );
	}

	public function broken_values() {
		return array(
			'text'           => array( 'yes please' ),
			'an empty list'  => array( array() ),
			'another name'   => array( array( 'on' => true ) ),
			'an empty value' => array( array( 'enabled' => '' ) ),
		);
	}

	// What visitors see.

	public function test_a_site_that_updates_sees_no_change_in_the_player() {
		$this->assertSame( self::PLAYER, Credit::add_to( self::PLAYER, Service::PLAYER_ID ) );
	}

	public function test_once_turned_on_the_line_sits_right_under_the_natural_voice_player() {
		Credit::save( array( 'enabled' => true ) );

		$html = Credit::add_to( self::PLAYER, Service::PLAYER_ID );

		$this->assertStringStartsWith( self::PLAYER . '<div class="atlasvoice-player-credit"', $html );
		$this->assertStringEndsWith( '>' . self::LINE . '</div>', $html );
	}

	public function test_the_line_is_plain_text_without_a_link() {
		Credit::save( array( 'enabled' => true ) );

		$line = str_replace( self::PLAYER, '', Credit::add_to( self::PLAYER, Service::PLAYER_ID ) );

		$this->assertStringNotContainsString( '<a', $line );
		$this->assertStringNotContainsString( 'href', $line );
		$this->assertStringNotContainsString( 'http', $line );
	}

	/**
	 * @dataProvider other_voices
	 */
	public function test_it_is_not_put_under_another_voice( $player_id ) {
		Credit::save( array( 'enabled' => true ) );

		$this->assertSame( self::PLAYER, Credit::add_to( self::PLAYER, $player_id ) );
	}

	public function other_voices() {
		return array(
			'the device voice'   => array( 1 ),
			'an extension voice' => array( 2 ),
			'a provider voice'   => array( 6 ),
			'the cloud voice'    => array( 7 ),
		);
	}

	public function test_it_is_not_put_under_a_player_an_extension_renders() {
		Credit::save( array( 'enabled' => true ) );
		add_filter( 'atlasvoice_free_mp3_player', '__return_false' );

		$this->assertSame( self::PLAYER, Credit::add_to( self::PLAYER, Service::PLAYER_ID ) );
	}

	public function test_no_line_where_no_player_is_printed() {
		Credit::save( array( 'enabled' => true ) );

		$this->assertSame( '', Credit::add_to( '', Service::PLAYER_ID ) );
	}

	public function test_showing_says_whether_the_voice_in_use_is_the_one_it_belongs_to() {
		Credit::save( array( 'enabled' => true ) );
		add_filter(
			'tts_get_player_id',
			function () {
				return 1;
			},
			9999
		);
		$this->assertFalse( Credit::get()['showing'] );

		remove_all_filters( 'tts_get_player_id' );
		$this->use_the_natural_voice();
		$this->assertTrue( Credit::get()['showing'] );
	}

	public function test_the_line_survives_the_filter_of_the_player_markup() {
		Credit::save( array( 'enabled' => true ) );

		$allowed = array(
			'div' => array(
				'class' => true,
				'style' => true,
			),
		);
		$html    = wp_kses( Credit::add_to( '', Service::PLAYER_ID ) . Credit::add_to( 'x', Service::PLAYER_ID ), $allowed );

		$this->assertStringContainsString( '<div class="atlasvoice-player-credit" style="', $html );
		$this->assertStringContainsString( self::LINE, $html );
	}

	public function test_the_player_markup_of_a_post_carries_the_line_under_the_player_and_over_the_ai_notice() {
		$source = file_get_contents( dirname( __DIR__, 4 ) . '/includes/helpers.php' );

		$credit = strpos( $source, 'Credit::add_to(' );
		$notice = strpos( $source, 'AI_Notice::add_to(' );
		$filter = strpos( $source, "apply_filters('tts__listening_button'" );
		$kses   = strpos( $source, 'wp_kses( (string) $data, $allowed )' );

		$this->assertNotFalse( $credit );
		$this->assertGreaterThan( $filter, $credit );
		$this->assertLessThan( $notice, $credit );
		$this->assertLessThan( $kses, $credit );
	}

	public function test_with_the_ai_notice_below_the_line_stays_next_to_the_player() {
		Credit::save( array( 'enabled' => true ) );
		AI_Notice::save( array( 'enabled' => true ) );

		$html = AI_Notice::add_to( Credit::add_to( self::PLAYER, Service::PLAYER_ID ) );

		$this->assertLessThan( strpos( $html, 'atlasvoice-ai-notice' ), strpos( $html, 'atlasvoice-player-credit' ) );
	}

	// Saving.

	public function test_a_save_stores_one_small_option() {
		$saved = Credit::save( array( 'enabled' => 'on' ) );

		$this->assertTrue( $saved['enabled'] );
		$this->assertSame( array( 'enabled' => true ), get_option( Credit::OPTION ) );
	}

	public function test_it_can_be_turned_off_again() {
		Credit::save( array( 'enabled' => true ) );
		Credit::save( array( 'enabled' => false ) );

		$this->assertFalse( Credit::get()['enabled'] );
		$this->assertSame( self::PLAYER, Credit::add_to( self::PLAYER, Service::PLAYER_ID ) );
	}

	public function test_no_other_option_is_touched() {
		update_option( 'tta_customize_settings', array( 'buttonSettings' => array( 'id' => 1 ) ) );
		update_option( AI_Notice::OPTION, array( 'enabled' => true ) );
		$customize = serialize( get_option( 'tta_customize_settings' ) );
		$notice    = serialize( get_option( AI_Notice::OPTION ) );

		Credit::save( array( 'enabled' => true ) );

		$this->assertSame( $customize, serialize( get_option( 'tta_customize_settings' ) ) );
		$this->assertSame( $notice, serialize( get_option( AI_Notice::OPTION ) ) );
	}

	public function test_removing_the_plugin_data_removes_the_setting() {
		$this->assertStringContainsString( "'" . Credit::OPTION . "'", file_get_contents( dirname( __DIR__, 4 ) . '/includes/TTA_Reset.php' ) );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( array $fields ) {
		$result = Credit::save( $fields );

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertFalse( get_option( Credit::OPTION ) );
	}

	public function wrong_values() {
		return array(
			'neither on nor off' => array( array( 'enabled' => 'maybe' ) ),
			'a list'             => array( array( 'enabled' => array( 1 ) ) ),
			'an unknown name'    => array( array( 'text' => 'Made by somebody else' ) ),
			'nothing'            => array( array() ),
		);
	}

	// The routes.

	public function test_get_returns_the_setting() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Credit::get(), $response->get_data() );
	}

	public function test_post_turns_it_on_and_off() {
		$this->assertTrue( $this->rest( 'POST', array( 'enabled' => true ) )->get_data()['enabled'] );
		$this->assertFalse( $this->rest( 'POST', array( 'enabled' => false ) )->get_data()['enabled'] );
	}

	public function test_post_refuses_a_value_that_is_not_on_or_off_and_a_missing_one() {
		$this->assertSame( 400, $this->rest( 'POST', array( 'enabled' => 'maybe' ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'text' => 'x' ) )->get_status() );
		$this->assertFalse( get_option( Credit::OPTION ) );
	}

	public function test_each_method_and_the_setting_describe_themselves() {
		$routes = rest_get_server()->get_routes()['/tta/v1/credit'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertSame( 'boolean', $routes[1]['args']['enabled']['type'] );
		$this->assertNotEmpty( $routes[1]['args']['enabled']['description'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_it( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'enabled' => true ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Credit::OPTION ) );
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

		$this->assertSame( Credit_Command::class, WP_CLI::$commands['atlasvoice credit'] );
	}

	public function test_get_prints_the_setting() {
		( new Credit_Command() )->get( array(), array() );

		$this->assertSame(
			array( 'credit: off', 'text: ' . self::LINE, 'visitors see it: no' ),
			wp_list_pluck( WP_CLI::$log, 1 )
		);
	}

	public function test_get_can_print_json_for_scripts() {
		( new Credit_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Credit::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_set_turns_it_on_and_off() {
		$this->use_the_natural_voice();
		( new Credit_Command() )->set( array( 'on' ), array() );

		$this->assertSame( array( 'success', 'Credit line saved.' ), end( WP_CLI::$log ) );
		$this->assertTrue( Credit::get()['showing'] );

		( new Credit_Command() )->set( array( 'off' ), array() );

		$this->assertFalse( Credit::get()['enabled'] );
	}

	public function test_set_says_why_a_value_was_refused() {
		try {
			( new Credit_Command() )->set( array( 'maybe' ), array() );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'on or off', WP_CLI::$log[0][1] );
	}
}
