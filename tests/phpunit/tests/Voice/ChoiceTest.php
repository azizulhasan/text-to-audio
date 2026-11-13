<?php
/**
 * Tests for the voice choice: the service class, its REST routes and
 * `wp atlasvoice voice` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Voice_Command;
use TTA\TTA_AtlasVoice_Service as Service;
use TTA\Voice\Choice;

/**
 * @covers \TTA\Voice\Choice
 * @covers \TTA_Api\Voice_Controller
 * @covers \TTA\CLI\Voice_Command
 */
class ChoiceTest extends WP_UnitTestCase {

	const MARK = 'tts_is_mp3_file_url_exists';

	/**
	 * @var int
	 */
	private $post;

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		foreach ( array( Choice::LISTENING_OPTION, Choice::CUSTOMIZE_OPTION, Service::OPTION ) as $option ) {
			delete_option( $option );
		}
		\TTA\TTA_Cache::flush();
		$this->post = self::factory()->post->create();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	private function connect() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value',
			),
			false
		);
	}

	private function stored( $option ) {
		$value = get_option( $option );

		return json_decode( wp_json_encode( $value ), true );
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/voice' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Reading.

	public function test_a_new_site_reads_the_browser_voice_at_normal_speed() {
		$choice = Choice::get();

		$this->assertSame( 1, $choice['player_id'] );
		$this->assertSame( '', $choice['language'] );
		$this->assertSame( '', $choice['voice'] );
		$this->assertSame( 1.0, $choice['rate'] );
		$this->assertSame( 1.0, $choice['volume'] );
		$this->assertSame( 1, $choice['pitch'] );
		$this->assertFalse( $choice['connected'] );
		$this->assertSame( Service::PLAYER_ID, $choice['natural_player_id'] );
	}

	public function test_it_lists_the_engines_of_this_site() {
		$players = Choice::get()['players'];
		$by_id   = array_column( $players, null, 'id' );

		$this->assertArrayHasKey( 1, $by_id );
		$this->assertFalse( $by_id[1]['pro'] );
		$this->assertFalse( $by_id[1]['stores_audio'] );
		$this->assertArrayHasKey( Service::PLAYER_ID, $by_id );
		$this->assertTrue( $by_id[ Service::PLAYER_ID ]['stores_audio'] );
	}

	public function test_it_reads_what_the_classic_screen_saved_in_either_shape() {
		update_option(
			Choice::LISTENING_OPTION,
			(object) array(
				'tta__listening_lang'   => 'en-GB',
				'tta__listening_voice'  => 'Google UK English Female',
				'tta__listening_rate'   => '1.5',
				'tta__listening_volume' => '0.8',
				'tta__listening_pitch'  => '2',
			)
		);

		$choice = Choice::get();

		$this->assertSame( 'en-GB', $choice['language'] );
		$this->assertSame( 'Google UK English Female', $choice['voice'] );
		$this->assertSame( 1.5, $choice['rate'] );
		$this->assertSame( 0.8, $choice['volume'] );
		$this->assertSame( 2, $choice['pitch'] );
	}

	public function test_damaged_stored_numbers_are_read_as_normal_values() {
		update_option(
			Choice::LISTENING_OPTION,
			array(
				'tta__listening_rate'   => 'fast',
				'tta__listening_volume' => 7,
				'tta__listening_pitch'  => array( 1 ),
			)
		);

		$choice = Choice::get();

		$this->assertSame( 1.0, $choice['rate'] );
		$this->assertSame( 1.0, $choice['volume'] );
		$this->assertSame( 1, $choice['pitch'] );
	}

	// Saving: the stored format.

	public function test_a_save_writes_the_fields_the_classic_screen_writes_as_text() {
		Choice::save(
			array(
				'language' => 'en-GB',
				'voice'    => 'Google UK English Female',
				'rate'     => 1.25,
				'volume'   => 0.5,
				'pitch'    => 2,
			)
		);

		$this->assertSame(
			array(
				'tta__listening_lang'   => 'en-GB',
				'tta__listening_voice'  => 'Google UK English Female',
				'tta__listening_rate'   => '1.3',
				'tta__listening_volume' => '0.5',
				'tta__listening_pitch'  => '2',
			),
			$this->stored( Choice::LISTENING_OPTION )
		);
	}

	public function test_a_save_keeps_every_field_it_did_not_send() {
		update_option(
			Choice::LISTENING_OPTION,
			(object) array(
				'tta__listening_lang'                => 'en-US',
				'tta__listening_voice'               => 'Samantha',
				'tta__elevenlabs_model'              => 'eleven_turbo_v2',
				'tta__multilingualActiveLanguages'   => (object) array( 'fr' => 'fr-FR' ),
				'tta__available_currentPlayerVoices' => (object) array(),
			)
		);

		Choice::save( array( 'rate' => 2 ) );

		$stored = $this->stored( Choice::LISTENING_OPTION );
		$this->assertSame( 'en-US', $stored['tta__listening_lang'] );
		$this->assertSame( 'Samantha', $stored['tta__listening_voice'] );
		$this->assertSame( 'eleven_turbo_v2', $stored['tta__elevenlabs_model'] );
		$this->assertSame( array( 'fr' => 'fr-FR' ), $stored['tta__multilingualActiveLanguages'] );
		$this->assertSame( '2', $stored['tta__listening_rate'] );
	}

	public function test_choosing_an_engine_changes_only_the_player_number() {
		$this->connect();
		update_option(
			Choice::CUSTOMIZE_OPTION,
			(object) array(
				'backgroundColor' => '#184c53',
				'custom_css'      => '.x{color:red}',
				'buttonSettings'  => (object) array(
					'id'                        => '1',
					'button_position'           => 'after_content',
					'float_position'            => 'bottom_left',
					'display_player_to'         => array( 'administrator' ),
					'who_can_download_mp3_file' => array( 'all' ),
				),
			)
		);
		\TTA\TTA_Cache::flush();

		Choice::save(
			array(
				'player_id' => Service::PLAYER_ID,
				'language'  => 'en',
			)
		);

		$stored = $this->stored( Choice::CUSTOMIZE_OPTION );
		$this->assertSame( '#184c53', $stored['backgroundColor'] );
		$this->assertSame( '.x{color:red}', $stored['custom_css'] );
		$this->assertSame(
			array(
				'id'                        => (string) Service::PLAYER_ID,
				'button_position'           => 'after_content',
				'float_position'            => 'bottom_left',
				'display_player_to'         => array( 'administrator' ),
				'who_can_download_mp3_file' => array( 'all' ),
			),
			$stored['buttonSettings']
		);
		$this->assertSame( Service::PLAYER_ID, Choice::get()['player_id'] );
	}

	public function test_choosing_an_engine_on_a_site_without_saved_look_gives_safe_defaults() {
		$this->connect();

		Choice::save( array( 'player_id' => Service::PLAYER_ID ) );

		$button = $this->stored( Choice::CUSTOMIZE_OPTION )['buttonSettings'];
		$this->assertSame( (string) Service::PLAYER_ID, $button['id'] );
		$this->assertSame( 'before_content', $button['button_position'] );
		$this->assertSame( array( 'all' ), $button['display_player_to'] );
	}

	public function test_saving_the_engine_already_in_use_does_not_touch_the_look() {
		update_option( Choice::CUSTOMIZE_OPTION, (object) array( 'backgroundColor' => '#184c53' ) );
		\TTA\TTA_Cache::flush();

		Choice::save(
			array(
				'player_id' => 1,
				'rate'      => 1,
			)
		);

		$this->assertSame( array( 'backgroundColor' => '#184c53' ), $this->stored( Choice::CUSTOMIZE_OPTION ) );
	}

	// Saving: what the classic screens also do.

	public function test_a_new_voice_clears_the_audio_marks_so_posts_get_the_new_voice() {
		update_option(
			Choice::LISTENING_OPTION,
			(object) array(
				'tta__listening_lang'                => 'en-US',
				'tta__listening_voice'               => 'Samantha',
				'tta__available_currentPlayerVoices' => (object) array(),
				'tta__currentPlayerLanguages'        => (object) array(),
			)
		);
		update_post_meta( $this->post, self::MARK, '1' );

		Choice::save( array( 'voice' => 'Daniel' ) );

		$this->assertSame( '', get_post_meta( $this->post, self::MARK, true ) );
	}

	public function test_a_new_engine_clears_the_audio_marks() {
		$this->connect();
		update_post_meta( $this->post, self::MARK, '1' );

		Choice::save( array( 'player_id' => Service::PLAYER_ID ) );

		$this->assertSame( '', get_post_meta( $this->post, self::MARK, true ) );
	}

	public function test_the_audio_files_meta_of_a_post_is_never_deleted() {
		update_post_meta( $this->post, 'tts_mp3_file_urls', array( 'en' => 'https://example.org/a.mp3' ) );

		Choice::save(
			array(
				'language' => 'fr-FR',
				'voice'    => 'Thomas',
			)
		);

		$this->assertSame( array( 'en' => 'https://example.org/a.mp3' ), get_post_meta( $this->post, 'tts_mp3_file_urls', true ) );
	}

	// Saving: what is refused.

	public function test_the_natural_voice_cannot_be_chosen_before_the_site_is_connected() {
		$result = Choice::save( array( 'player_id' => Service::PLAYER_ID ) );

		$this->assertWPError( $result );
		$this->assertSame( 'not_connected', $result->get_error_code() );
		$this->assertSame( 409, $result->get_error_data()['status'] );
		$this->assertSame( 1, Choice::get()['player_id'] );
	}

	/**
	 * @dataProvider refused_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		update_option( Choice::LISTENING_OPTION, array( 'tta__listening_lang' => 'en-US' ) );

		$result = Choice::save(
			array(
				'language' => 'fr-FR',
				$field     => $value,
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( array( 'tta__listening_lang' => 'en-US' ), $this->stored( Choice::LISTENING_OPTION ), 'A refused save must not store its valid half.' );
	}

	public function refused_values() {
		return array(
			'an engine that does not exist' => array( 'player_id', 99 ),
			'an engine as text'             => array( 'player_id', 'fast one' ),
			'a language with markup'        => array( 'language', '<script>' ),
			'a language sentence'           => array( 'language', 'English please' ),
			'an empty language'             => array( 'language', '' ),
			'a voice as a list'             => array( 'voice', array( 'Emma' ) ),
			'a voice far too long'          => array( 'voice', str_repeat( 'a', 191 ) ),
			'speed too low'                 => array( 'rate', 0 ),
			'speed too high'                => array( 'rate', 11 ),
			'speed as a word'               => array( 'rate', 'fast' ),
			'volume above full'             => array( 'volume', 1.5 ),
			'negative volume'               => array( 'volume', -0.1 ),
			'pitch between steps'           => array( 'pitch', 1.5 ),
			'pitch out of range'            => array( 'pitch', 3 ),
			'a setting that does not exist' => array( 'colour', 'red' ),
		);
	}

	public function test_markup_in_a_voice_name_is_removed() {
		Choice::save( array( 'voice' => '<b>Emma</b>' ) );

		$this->assertSame( 'Emma', Choice::get()['voice'] );
	}

	/**
	 * @dataProvider language_codes
	 */
	public function test_real_language_codes_are_accepted( $code ) {
		$this->assertNotWPError( Choice::save( array( 'language' => $code ) ) );
		$this->assertSame( $code, Choice::get()['language'] );
	}

	public function language_codes() {
		return array( array( 'en' ), array( 'en-GB' ), array( 'pt_BR' ), array( 'zh-yue' ), array( 'yue-hant-hk' ), array( 'fil' ), array( 'es-419' ) );
	}

	public function test_an_empty_save_is_refused() {
		$result = Choice::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// The REST routes.

	public function test_get_returns_the_choice() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Choice::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent() {
		update_option( Choice::LISTENING_OPTION, array( 'tta__listening_voice' => 'Samantha' ) );

		$response = $this->rest( 'POST', array( 'language' => 'en-GB' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'en-GB', $response->get_data()['language'] );
		$this->assertSame( 'Samantha', $response->get_data()['voice'] );
	}

	public function test_post_refuses_the_natural_voice_on_a_site_that_is_not_connected() {
		$response = $this->rest( 'POST', array( 'player_id' => Service::PLAYER_ID ) );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'not_connected', $response->get_data()['code'] );
	}

	public function test_post_refuses_values_outside_the_described_limits() {
		$this->assertSame( 400, $this->rest( 'POST', array( 'rate' => 50 ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'pitch' => 5 ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'language' => 'not a code' ) )->get_status() );
	}

	public function test_each_method_and_each_setting_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/voice'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertSame( array( 'player_id', 'language', 'voice', 'rate', 'volume', 'pitch' ), array_keys( $routes[1]['args'] ) );
		foreach ( $routes[1]['args'] as $arg ) {
			$this->assertNotEmpty( $arg['description'] );
			$this->assertNotEmpty( $arg['type'] );
		}
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_the_voice( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'language' => 'fr-FR' ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Choice::LISTENING_OPTION ) );
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

		$this->assertSame( Voice_Command::class, WP_CLI::$commands['atlasvoice voice'] );
	}

	public function test_get_prints_the_engines_and_marks_the_one_in_use() {
		( new Voice_Command() )->get( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'engine 1: Default (in use)', $lines );
		$this->assertContains( 'speed: 1', $lines );
	}

	public function test_set_saves_what_was_given() {
		( new Voice_Command() )->set(
			array(),
			array(
				'language' => 'en-GB',
				'voice'    => 'Google UK English Female',
				'rate'     => '1.5',
			)
		);

		$this->assertSame( array( 'success', 'Voice saved.' ), end( WP_CLI::$log ) );
		$choice = Choice::get();
		$this->assertSame( 'en-GB', $choice['language'] );
		$this->assertSame( 1.5, $choice['rate'] );
	}

	public function test_set_says_why_a_value_was_refused() {
		try {
			( new Voice_Command() )->set( array(), array( 'player' => (string) Service::PLAYER_ID ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'Connect the natural voice first', WP_CLI::$log[0][1] );
	}
}
