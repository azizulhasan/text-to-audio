<?php
/**
 * Tests for the words of the player button: the service class, its REST
 * routes and `wp atlasvoice words` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Words_Command;
use TTA\Player\Words;

/**
 * @covers \TTA\Player\Words
 * @covers \TTA_Api\Words_Controller
 * @covers \TTA\CLI\Words_Command
 */
class WordsTest extends WP_UnitTestCase {

	const SVG = '<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Words::OPTION );
		delete_option( Words::SETTINGS_OPTION );
		delete_option( 'tta_customize_settings' );
		remove_all_filters( 'tts_available_players' );
		remove_all_filters( 'tts_get_player_id' );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'tts_available_players' );
		remove_all_filters( 'tts_get_player_id' );
		parent::tear_down();
	}

	/**
	 * What the classic Customization screen stores.
	 */
	private function classic( array $listen = array() ) {
		$states = array(
			'listen' => array_replace(
				array(
					'text'  => 'Listen',
					'hover' => 'Click to listen post.',
					'icon'  => 'preset:play',
				),
				$listen
			),
			'pause'  => array(
				'text'  => 'Pause',
				'hover' => 'Pause playback',
				'icon'  => 'preset:pause',
			),
			'resume' => array(
				'text'  => 'Resume',
				'hover' => 'Resume playback',
				'icon'  => 'preset:play',
			),
			'replay' => array(
				'text'  => 'Replay',
				'hover' => 'Click to listen post.',
				'icon'  => 'preset:replay',
			),
		);

		update_option(
			Words::OPTION,
			array(
				'listen_text' => 'Listen',
				'pause_text'  => 'Pause',
				'start_text'  => 'Start',
				'players'     => array(
					1 => $states,
					2 => $states,
				),
			)
		);
	}

	/**
	 * A site with Pro also has the second browser-voice player.
	 */
	private function with_second_player() {
		add_filter(
			'tts_available_players',
			static function ( $players ) {
				$players[2] = array(
					'id'   => 2,
					'name' => 'Default Pro',
				);

				return $players;
			}
		);
	}

	private function use_player( $id ) {
		add_filter(
			'tts_get_player_id',
			static function () use ( $id ) {
				return $id;
			}
		);
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/words' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	private function listen( $player = 1 ) {
		return get_option( Words::OPTION )['players'][ $player ]['listen'];
	}

	// Reading.

	public function test_a_new_site_has_the_default_words_of_the_browser_voice_button() {
		$words = Words::get();

		$this->assertSame( array( 1 ), array_keys( $words['players'] ) );
		$this->assertSame( array( 'listen', 'pause', 'resume', 'replay' ), array_keys( $words['players'][1] ) );
		$this->assertSame(
			array(
				'text'    => 'Listen',
				'tooltip' => 'Click to listen post.',
				'icon'    => 'preset:play',
			),
			$words['players'][1]['listen']
		);
		$this->assertSame( $words['players'], $words['defaults'] );
		$this->assertFalse( $words['show_icon'] );
	}

	public function test_it_reads_what_the_classic_screen_saved() {
		$this->classic(
			array(
				'text'  => 'Play article',
				'hover' => 'Hear this post',
				'icon'  => 'preset:headphones',
			)
		);
		update_option( Words::SETTINGS_OPTION, (object) array( 'tta__settings_display_btn_icon' => true ) );

		$words = Words::get();

		$this->assertSame( 'Play article', $words['players'][1]['listen']['text'] );
		$this->assertSame( 'Hear this post', $words['players'][1]['listen']['tooltip'] );
		$this->assertSame( 'preset:headphones', $words['players'][1]['listen']['icon'] );
		$this->assertSame( 'Listen', $words['defaults'][1]['listen']['text'] );
		$this->assertTrue( $words['show_icon'] );
	}

	public function test_the_second_player_shows_only_on_a_site_that_has_it() {
		$this->classic();
		$this->assertArrayNotHasKey( 2, Words::get()['players'] );

		$this->with_second_player();
		$words = Words::get();

		$this->assertSame( array( 1, 2 ), array_keys( $words['players'] ) );
		$this->assertSame( 'Default Pro', $words['names'][2] );
		$this->assertSame( 'Default', $words['names'][1] );
	}

	public function test_it_says_whether_the_voice_in_use_has_a_button_with_words() {
		$this->assertTrue( Words::get()['applies'] );

		$this->use_player( 3 );
		$words = Words::get();

		$this->assertSame( 3, $words['player_id'] );
		$this->assertFalse( $words['applies'] );
	}

	public function test_it_lists_the_icons_that_can_be_chosen() {
		$icons = Words::get()['icons'];

		$this->assertContains( 'preset:headphones', wp_list_pluck( $icons, 'id' ) );
		$this->assertCount( 8, $icons );
		foreach ( $icons as $icon ) {
			$this->assertStringStartsWith( '<svg', $icon['svg'] );
		}
	}

	public function test_a_custom_drawing_is_named_but_never_sent_to_the_screen() {
		$this->classic( array( 'icon' => 'custom:' . self::SVG ) );

		$words = Words::get();

		$this->assertSame( 'custom', $words['players'][1]['listen']['icon'] );
		$this->assertStringNotContainsString( 'M2 2h20', wp_json_encode( $words['players'] ) );
	}

	/**
	 * @dataProvider broken_options
	 */
	public function test_a_broken_stored_value_reads_as_the_defaults( $stored ) {
		update_option( Words::OPTION, $stored );

		$words = Words::get();

		$this->assertSame( 'Listen', $words['players'][1]['listen']['text'] );
		$this->assertSame( 'preset:replay', $words['players'][1]['replay']['icon'] );
	}

	public function broken_options() {
		return array(
			'text'             => array( 'broken' ),
			'no players'       => array( array( 'listen_text' => 'Listen' ) ),
			'players as text'  => array( array( 'players' => 'none' ) ),
			'a player as text' => array( array( 'players' => array( 1 => 'none' ) ) ),
		);
	}

	// Saving.

	public function test_a_save_writes_the_map_the_classic_screen_reads() {
		$this->classic();

		$saved = Words::save(
			array(
				'players' => array(
					1 => array(
						'listen' => array(
							'text'    => 'Listen to this article',
							'tooltip' => 'Starts the audio',
							'icon'    => 'preset:headphones',
						),
					),
				),
			)
		);

		$this->assertSame(
			array(
				'text'  => 'Listen to this article',
				'hover' => 'Starts the audio',
				'icon'  => 'preset:headphones',
			),
			$this->listen()
		);
		$this->assertSame( 'Listen to this article', $saved['players'][1]['listen']['text'] );
	}

	public function test_only_the_part_that_was_sent_changes() {
		$this->classic();
		$before = get_option( Words::OPTION );

		Words::save( array( 'players' => array( 1 => array( 'pause' => array( 'text' => 'Stop for now' ) ) ) ) );

		$before['players'][1]['pause']['text'] = 'Stop for now';
		$this->assertSame( $before, get_option( Words::OPTION ) );
	}

	public function test_the_flat_words_and_the_other_player_are_kept() {
		$this->classic();

		Words::save( array( 'players' => array( 2 => array( 'listen' => array( 'text' => 'Play' ) ) ) ) );

		$option = get_option( Words::OPTION );
		$this->assertSame( 'Start', $option['start_text'] );
		$this->assertSame( 'Listen', $option['players'][1]['listen']['text'] );
		$this->assertSame( 'Play', $option['players'][2]['listen']['text'] );
	}

	public function test_the_button_shows_the_word_that_was_saved() {
		$this->classic();
		Words::save( array( 'players' => array( 1 => array( 'listen' => array( 'text' => 'Hear it' ) ) ) ) );

		$texts = \get_button_text( array(), 1 );

		$this->assertSame( 'Hear it', $texts['listen_text'] );
	}

	public function test_an_empty_word_is_stored_empty_so_the_default_word_shows() {
		$this->classic();

		Words::save( array( 'players' => array( 1 => array( 'listen' => array( 'text' => '' ) ) ) ) );

		$this->assertSame( '', $this->listen()['text'] );
		$this->assertSame( 'Listen', \get_button_text( array(), 1 )['listen_text'] );
	}

	public function test_markup_in_a_word_is_removed() {
		$this->classic();

		Words::save( array( 'players' => array( 1 => array( 'listen' => array( 'text' => '<b>Listen</b><script>alert(1)</script>' ) ) ) ) );

		$this->assertSame( 'Listen', $this->listen()['text'] );
	}

	public function test_a_custom_drawing_is_kept_when_the_screen_sends_its_name_back() {
		$this->classic( array( 'icon' => 'custom:' . self::SVG ) );

		Words::save(
			array(
				'players' => array(
					1 => array(
						'listen' => array(
							'text' => 'Hear it',
							'icon' => 'custom',
						),
					),
				),
			)
		);

		$this->assertSame( 'Hear it', $this->listen()['text'] );
		$this->assertStringStartsWith( 'custom:<svg', $this->listen()['icon'] );
	}

	public function test_a_custom_drawing_is_cleaned_like_on_the_classic_screen() {
		$this->classic();

		Words::save( array( 'players' => array( 1 => array( 'listen' => array( 'icon' => 'custom:<svg onload="alert(1)" viewBox="0 0 24 24"><script>x</script><path d="M2 2h20"/></svg>' ) ) ) ) );

		$icon = $this->listen()['icon'];
		$this->assertStringStartsWith( 'custom:<svg', $icon );
		$this->assertStringContainsString( 'M2 2h20', $icon );
		$this->assertStringNotContainsString( 'onload', $icon );
		$this->assertStringNotContainsString( '<script', $icon );
	}

	public function test_show_icon_is_saved_in_the_classic_settings_and_nothing_else_changes() {
		update_option(
			Words::SETTINGS_OPTION,
			(object) array(
				'tta__settings_display_btn_icon' => false,
				'tta__settings_atlasvoice_mode'  => 'live',
			)
		);

		$saved = Words::save( array( 'show_icon' => true ) );

		$settings = get_option( Words::SETTINGS_OPTION );
		$this->assertTrue( $saved['show_icon'] );
		$this->assertIsObject( $settings );
		$this->assertTrue( $settings->tta__settings_display_btn_icon );
		$this->assertSame( 'live', $settings->tta__settings_atlasvoice_mode );
		$this->assertFalse( get_option( Words::OPTION ) );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( array $fields ) {
		$this->classic();
		$before = get_option( Words::OPTION );

		$result = Words::save( array_replace( array( 'show_icon' => true ), $fields ) );

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( $before, get_option( Words::OPTION ) );
		$this->assertFalse( get_option( Words::SETTINGS_OPTION ) );
	}

	public function wrong_values() {
		$listen = static function ( array $parts, $player = 1, $state = 'listen' ) {
			return array( 'players' => array( $player => array( $state => $parts ) ) );
		};

		return array(
			'a player without words'  => array( $listen( array( 'text' => 'x' ), 3 ) ),
			'an unknown state'        => array( $listen( array( 'text' => 'x' ), 1, 'stop' ) ),
			'an unknown part'         => array( $listen( array( 'colour' => 'red' ) ) ),
			'an unknown icon'         => array( $listen( array( 'icon' => 'preset:rocket' ) ) ),
			'an icon without a kind'  => array( $listen( array( 'icon' => 'headphones' ) ) ),
			'a drawing that is empty' => array( $listen( array( 'icon' => 'custom:<script>alert(1)</script>' ) ) ),
			'a word that is a list'   => array( $listen( array( 'text' => array( 'x' ) ) ) ),
			'a word that is too long' => array( $listen( array( 'text' => str_repeat( 'a', 101 ) ) ) ),
			'players as text'         => array( array( 'players' => 'listen' ) ),
			'a state as text'         => array( array( 'players' => array( 1 => array( 'listen' => 'Listen' ) ) ) ),
			'show icon as a word'     => array( array( 'show_icon' => 'maybe' ) ),
			'an unknown setting'      => array( array( 'reading_time' => 'x' ) ),
		);
	}

	public function test_an_empty_save_is_refused() {
		foreach ( array( array(), array( 'players' => array() ) ) as $fields ) {
			$result = Words::save( $fields );

			$this->assertWPError( $result );
			$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
		}
	}

	// The REST routes.

	public function test_get_returns_the_words() {
		$this->classic();

		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Words::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent() {
		$this->classic();

		$response = $this->rest( 'POST', array( 'players' => array( '1' => array( 'replay' => array( 'text' => 'Again' ) ) ) ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Again', $response->get_data()['players'][1]['replay']['text'] );
		$this->assertSame( 'Listen', $this->listen()['text'] );
	}

	public function test_post_refuses_a_wrong_value_and_names_the_field() {
		$response = $this->rest( 'POST', array( 'players' => array( '1' => array( 'listen' => array( 'icon' => 'preset:rocket' ) ) ) ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'atlasvoice_invalid_words', $response->get_data()['code'] );
		$this->assertSame( 'players', $response->get_data()['data']['field'] );
	}

	public function test_each_method_and_each_setting_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/words'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertStringContainsString( 'Example:', $routes[1]['args']['players']['description'] );
		$this->assertSame( 'boolean', $routes[1]['args']['show_icon']['type'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_the_words( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'show_icon' => true ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Words::SETTINGS_OPTION ) );
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

		$this->assertSame( Words_Command::class, WP_CLI::$commands['atlasvoice words'] );
	}

	public function test_get_prints_each_state() {
		$this->classic();

		( new Words_Command() )->get( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'show icon: off', $lines );
		$this->assertContains( 'player 1 listen: "Listen" | tooltip "Click to listen post." | icon preset:play', $lines );
		$this->assertCount( 5, $lines );
	}

	public function test_get_can_print_json_without_the_drawings() {
		( new Words_Command() )->get( array(), array( 'format' => 'json' ) );

		$printed = json_decode( end( WP_CLI::$log )[1], true );
		$this->assertContains( 'preset:ear', $printed['icons'] );
		$this->assertStringNotContainsString( '<svg', end( WP_CLI::$log )[1] );
	}

	public function test_set_changes_one_state() {
		$this->classic();

		( new Words_Command() )->set(
			array( 'listen' ),
			array(
				'text' => 'Listen to this article',
				'icon' => 'headphones',
			)
		);

		$this->assertSame( array( 'success', 'Words saved.' ), end( WP_CLI::$log ) );
		$this->assertSame( 'Listen to this article', $this->listen()['text'] );
		$this->assertSame( 'preset:headphones', $this->listen()['icon'] );
		$this->assertSame( 'Click to listen post.', $this->listen()['hover'] );
	}

	public function test_set_can_turn_the_icon_on_or_off() {
		( new Words_Command() )->set( array(), array( 'show-icon' => 'on' ) );

		$this->assertTrue( Words::get()['show_icon'] );
	}

	/**
	 * @dataProvider refused_commands
	 */
	public function test_set_says_why_it_was_refused( array $args, array $flags, $expected ) {
		try {
			( new Words_Command() )->set( $args, $flags );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( $expected, WP_CLI::$log[0][1] );
	}

	public function refused_commands() {
		return array(
			'no state'        => array( array(), array( 'text' => 'x' ), 'Say which state' ),
			'an unknown icon' => array( array( 'listen' ), array( 'icon' => 'rocket' ), 'This icon does not exist.' ),
			'a wrong state'   => array( array( 'stop' ), array( 'text' => 'x' ), 'listen, pause, resume or replay' ),
		);
	}
}
