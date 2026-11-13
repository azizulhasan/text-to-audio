<?php
/**
 * Tests for the text that is read aloud: the service class, its REST routes
 * and `wp atlasvoice text` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Text_Command;
use TTA\Content\Text;

/**
 * @covers \TTA\Content\Text
 * @covers \TTA_Api\Text_Controller
 * @covers \TTA\CLI\Text_Command
 */
class TextTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Text::OPTION );
		remove_all_filters( 'atlasvoice_text_extras' );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_text_extras' );
		parent::tear_down();
	}

	private function stored() {
		return json_decode( wp_json_encode( get_option( Text::OPTION ) ), true );
	}

	/**
	 * What the classic Settings screen stores.
	 */
	private function classic( array $settings = array() ) {
		update_option(
			Text::OPTION,
			(object) array_replace(
				array(
					'tta__settings_add_post_title_to_read'   => true,
					'tta__settings_add_post_excerpt_to_read' => false,
					'tta__settings_text_before_content'      => '',
					'tta__settings_text_after_content'       => '',
					'tta__settings_apply_number_format'      => false,
					'tta__settings_read_content_from_dom'    => true,
					'tta__settings_emit_legacy_wrapper'      => true,
					'tta__settings_enable_tts_status'        => true,
					'tta__settings_atlasvoice_mode'          => 'live',
					'tta__settings_allow_listening_for_post_types' => array( 'post' ),
				),
				$settings
			)
		);
		\TTA\TTA_Cache::flush();
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/text' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// The list of parts.

	public function test_every_part_names_its_stored_field_once_and_describes_itself() {
		$fields = Text::fields();
		$stored = wp_list_pluck( $fields, 'stored' );

		$this->assertCount( 8, $fields );
		$this->assertSame( array_values( $stored ), array_values( array_unique( $stored ) ) );
		foreach ( $fields as $name => $field ) {
			$this->assertNotEmpty( $field['description'], $name );
			$this->assertStringStartsWith( 'tta__settings_', $field['stored'] );
		}
	}

	// Reading.

	public function test_a_site_that_never_saved_shows_what_the_player_does() {
		$text = Text::get();

		$this->assertTrue( $text['title'] );
		$this->assertFalse( $text['excerpt'] );
		$this->assertSame( '', $text['intro'] );
		$this->assertSame( '', $text['outro'] );
		$this->assertFalse( $text['numbers'] );
		$this->assertFalse( $text['as_seen'] );
		$this->assertTrue( $text['wrapper'] );
		$this->assertFalse( $text['status_column'] );
	}

	public function test_it_reads_what_the_classic_screen_saved() {
		$this->classic(
			array(
				'tta__settings_add_post_title_to_read'   => false,
				'tta__settings_add_post_excerpt_to_read' => true,
				'tta__settings_text_before_content'      => 'Welcome.',
				'tta__settings_emit_legacy_wrapper'      => false,
			)
		);

		$text = Text::get();

		$this->assertFalse( $text['title'] );
		$this->assertTrue( $text['excerpt'] );
		$this->assertSame( 'Welcome.', $text['intro'] );
		$this->assertFalse( $text['wrapper'] );
		$this->assertTrue( $text['as_seen'] );
		$this->assertTrue( $text['status_column'] );
	}

	public function test_markup_stored_by_an_older_version_is_not_sent_to_the_screen() {
		$this->classic( array( 'tta__settings_text_after_content' => 'Thanks <script>alert(1)</script><b>for listening</b>' ) );

		$this->assertSame( 'Thanks for listening', Text::get()['outro'] );
	}

	public function test_the_free_plugin_says_its_players_do_not_apply_the_extras() {
		$this->assertFalse( Text::get()['extras_available'] );

		add_filter( 'atlasvoice_text_extras', '__return_true' );

		$this->assertTrue( Text::get()['extras_available'] );
	}

	// Saving.

	public function test_a_save_writes_the_fields_the_classic_screen_reads() {
		$this->classic();

		$saved = Text::save(
			array(
				'excerpt' => true,
				'intro'   => 'You are listening to Hearth and Grain.',
				'numbers' => 'on',
			)
		);

		$stored = $this->stored();
		$this->assertTrue( $stored['tta__settings_add_post_excerpt_to_read'] );
		$this->assertSame( 'You are listening to Hearth and Grain.', $stored['tta__settings_text_before_content'] );
		$this->assertTrue( $stored['tta__settings_apply_number_format'] );
		$this->assertTrue( $saved['excerpt'] );
	}

	public function test_a_save_keeps_every_other_stored_setting_and_the_shape() {
		$this->classic();
		$before = $this->stored();

		Text::save( array( 'title' => false ) );

		$before['tta__settings_add_post_title_to_read'] = false;
		$this->assertSame( $before, $this->stored() );
		$this->assertIsObject( get_option( Text::OPTION ) );
	}

	public function test_the_sentence_before_the_post_is_plain_text() {
		$this->classic();

		$saved = Text::save( array( 'intro' => "Welcome <b>back</b>.\n<script>alert(1)</script>" ) );

		$this->assertStringNotContainsString( '<', $saved['intro'] );
		$this->assertStringContainsString( 'Welcome back.', $saved['intro'] );
	}

	public function test_an_empty_text_removes_the_sentence() {
		$this->classic( array( 'tta__settings_text_after_content' => 'Thanks.' ) );

		$saved = Text::save( array( 'outro' => '' ) );

		$this->assertSame( '', $saved['outro'] );
		$this->assertSame( '', $this->stored()['tta__settings_text_after_content'] );
	}

	public function test_the_player_reads_the_sentences_that_were_saved() {
		$this->classic();
		Text::save(
			array(
				'intro' => 'Welcome.',
				'outro' => 'Thanks for listening.',
			)
		);

		$settings = (array) \TTA\TTA_Helper::tts_get_settings( 'settings' );

		$this->assertSame( 'Welcome.', $settings['tta__settings_text_before_content'] );
		$this->assertSame( 'Thanks for listening.', $settings['tta__settings_text_after_content'] );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		$this->classic();
		$before = $this->stored();

		$result = Text::save(
			array(
				'excerpt' => true,
				$field    => $value,
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( sanitize_key( $field ), $result->get_error_data()['field'] );
		$this->assertSame( $before, $this->stored() );
	}

	public function wrong_values() {
		return array(
			'a switch as a word'  => array( 'title', 'maybe' ),
			'a switch as a list'  => array( 'wrapper', array( true ) ),
			'a sentence as a list' => array( 'intro', array( 'Welcome.' ) ),
			'a sentence too long' => array( 'outro', str_repeat( 'a', 1001 ) ),
			'an unknown setting'  => array( 'tta__settings_atlasvoice_mode', 'live' ),
			'a read-only answer'  => array( 'extras_available', true ),
		);
	}

	public function test_an_empty_save_is_refused() {
		$result = Text::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// The REST routes.

	public function test_get_returns_the_settings() {
		$this->classic();

		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Text::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent_and_can_turn_a_switch_off() {
		$this->classic();

		$response = $this->rest(
			'POST',
			array(
				'title' => false,
				'outro' => 'Thanks.',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['title'] );
		$this->assertSame( 'Thanks.', $response->get_data()['outro'] );
		$this->assertTrue( $this->stored()['tta__settings_emit_legacy_wrapper'] );
	}

	public function test_post_refuses_a_sentence_that_is_too_long() {
		$this->classic();

		$this->assertSame( 400, $this->rest( 'POST', array( 'intro' => str_repeat( 'a', 1001 ) ) )->get_status() );
		$this->assertSame( '', $this->stored()['tta__settings_text_before_content'] );
	}

	public function test_each_method_and_each_part_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/text'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertSame( array_keys( Text::fields() ), array_keys( $routes[1]['args'] ) );
		$this->assertSame( 'boolean', $routes[1]['args']['title']['type'] );
		$this->assertSame( Text::TEXT_LENGTH, $routes[1]['args']['intro']['maxLength'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_it( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'title' => false ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Text::OPTION ) );
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

		$this->assertSame( Text_Command::class, WP_CLI::$commands['atlasvoice text'] );
	}

	public function test_get_prints_every_part() {
		$this->classic( array( 'tta__settings_text_before_content' => 'Welcome.' ) );

		( new Text_Command() )->get( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertCount( 8, $lines );
		$this->assertContains( 'title: on', $lines );
		$this->assertContains( 'excerpt: off', $lines );
		$this->assertContains( 'intro: Welcome.', $lines );
		$this->assertContains( 'outro:', $lines );
	}

	public function test_get_can_print_json_for_scripts() {
		( new Text_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Text::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_set_saves_what_was_given() {
		$this->classic();

		( new Text_Command() )->set(
			array(),
			array(
				'excerpt' => 'on',
				'intro'   => 'Welcome.',
			)
		);

		$this->assertSame( array( 'success', 'Saved.' ), end( WP_CLI::$log ) );
		$this->assertTrue( Text::get()['excerpt'] );
		$this->assertSame( 'Welcome.', Text::get()['intro'] );
	}

	public function test_set_says_which_value_was_refused_and_why() {
		try {
			( new Text_Command() )->set( array(), array( 'title' => 'maybe' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'title: This must be on or off.', WP_CLI::$log[0][1] );
	}
}
