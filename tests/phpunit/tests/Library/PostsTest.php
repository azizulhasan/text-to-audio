<?php
/**
 * Tests for the audio library: the service class, its REST route and
 * `wp atlasvoice library` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Library_Command;
use TTA\Library\Posts;

/**
 * @covers \TTA\Library\Posts
 * @covers \TTA_Api\Library_Controller
 * @covers \TTA\CLI\Library_Command
 */
class PostsTest extends WP_UnitTestCase {

	const SETTINGS = 'tta_settings_data';

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		update_option( self::SETTINGS, (object) array( 'tta__settings_allow_listening_for_post_types' => array( 'post' ) ) );
		\TTA\TTA_Cache::flush();
		$this->use_player( 3 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'tts_get_player_id' );
		delete_option( self::SETTINGS );
		\TTA\TTA_Cache::flush();
		parent::tear_down();
	}

	/**
	 * Makes a player the one in use.
	 */
	private function use_player( $player_id ) {
		remove_all_filters( 'tts_get_player_id' );
		add_filter(
			'tts_get_player_id',
			static function () use ( $player_id ) {
				return $player_id;
			}
		);
	}

	/**
	 * A published post, with its audio stored or not.
	 */
	private function post( $title, $with_audio = false, array $more = array() ) {
		$post_id = self::factory()->post->create( array( 'post_title' => $title ) + $more );
		if ( $with_audio ) {
			update_post_meta( $post_id, Posts::MARK, true );
		}

		return $post_id;
	}

	/**
	 * The lines the command printed.
	 */
	private function lines() {
		return wp_list_pluck( WP_CLI::$log, 1 );
	}

	private function request( array $params = array() ) {
		$request = new WP_REST_Request( 'GET', '/tta/v1/library' );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	public function test_a_browser_voice_has_no_library() {
		$this->use_player( 1 );
		$this->post( 'A post', true );

		$library = Posts::get();

		$this->assertFalse( $library['stores_audio'] );
		$this->assertSame( array(), $library['posts'] );
		$this->assertSame( 0, $library['counts']['all'] );
	}

	public function test_it_lists_each_post_with_whether_its_audio_is_stored() {
		$ready   = $this->post( 'With audio', true );
		$missing = $this->post( 'Without audio' );

		$library = Posts::get();
		$status  = wp_list_pluck( $library['posts'], 'status', 'id' );

		$this->assertTrue( $library['stores_audio'] );
		$this->assertSame( 'AtlasVoice TTS', $library['voice'] );
		$this->assertSame( 'ready', $status[ $ready ] );
		$this->assertSame( 'missing', $status[ $missing ] );
		$this->assertSame(
			array(
				'all'     => 2,
				'ready'   => 1,
				'missing' => 1,
			),
			$library['counts']
		);
	}

	public function test_a_post_carries_its_title_and_links() {
		$post_id = $this->post( 'The <b>old</b> mill', true );

		$post = Posts::get()['posts'][0];

		$this->assertSame( $post_id, $post['id'] );
		$this->assertSame( 'The old mill', $post['title'] );
		$this->assertSame( get_permalink( $post_id ), $post['view_url'] );
		$this->assertStringContainsString( 'post=' . $post_id, $post['edit_url'] );
		$this->assertNotFalse( strtotime( $post['modified'] ) );
	}

	public function test_status_ready_lists_only_posts_with_audio() {
		$ready = $this->post( 'With audio', true );
		$this->post( 'Without audio' );

		$library = Posts::get( array( 'status' => 'ready' ) );

		$this->assertSame( array( $ready ), wp_list_pluck( $library['posts'], 'id' ) );
		$this->assertSame( 1, $library['total'] );
		// The counts stay those of the whole library.
		$this->assertSame( 2, $library['counts']['all'] );
	}

	public function test_status_missing_lists_posts_without_the_mark_or_with_an_empty_one() {
		$this->post( 'With audio', true );
		$never   = $this->post( 'Never made' );
		$emptied = $this->post( 'Emptied' );
		update_post_meta( $emptied, Posts::MARK, '' );

		$ids = wp_list_pluck( Posts::get( array( 'status' => 'missing' ) )['posts'], 'id' );
		sort( $ids );

		$this->assertSame( array( $never, $emptied ), $ids );
	}

	public function test_an_unknown_status_is_an_error() {
		$result = Posts::get( array( 'status' => 'broken' ) );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_invalid_status', $result->get_error_code() );
	}

	public function test_only_published_posts_of_the_chosen_types_are_listed() {
		$post = $this->post( 'A post' );
		$this->post( 'A page', false, array( 'post_type' => 'page' ) );
		$this->post( 'A draft', false, array( 'post_status' => 'draft' ) );

		$library = Posts::get();

		$this->assertSame( array( $post ), wp_list_pluck( $library['posts'], 'id' ) );
		$this->assertSame( 1, $library['counts']['all'] );
	}

	public function test_no_chosen_type_lists_nothing() {
		update_option( self::SETTINGS, (object) array( 'tta__settings_allow_listening_for_post_types' => array() ) );
		\TTA\TTA_Cache::flush();
		$this->post( 'A post' );

		$library = Posts::get();

		$this->assertSame( array(), $library['posts'] );
		$this->assertSame( 0, $library['counts']['all'] );
	}

	public function test_a_type_that_is_not_registered_any_more_is_left_out() {
		update_option( self::SETTINGS, (object) array( 'tta__settings_allow_listening_for_post_types' => array( 'gone_type' ) ) );
		\TTA\TTA_Cache::flush();
		$this->post( 'A post' );

		$this->assertSame( array(), Posts::get()['posts'] );
	}

	public function test_search_finds_a_post_by_its_title() {
		$wanted = $this->post( 'Apple crumble' );
		$this->post( 'Organic cotton' );

		$library = Posts::get( array( 'search' => 'crumble' ) );

		$this->assertSame( array( $wanted ), wp_list_pluck( $library['posts'], 'id' ) );
		$this->assertSame( 'crumble', $library['search'] );
	}

	public function test_pages_hold_per_page_posts_and_never_more_than_the_limit() {
		for ( $i = 1; $i <= 5; $i++ ) {
			$this->post( 'Post ' . $i );
		}

		$first = Posts::get( array( 'per_page' => 2 ) );
		$last  = Posts::get(
			array(
				'per_page' => 2,
				'page'     => 3,
			)
		);

		$this->assertCount( 2, $first['posts'] );
		$this->assertSame( 3, $first['pages'] );
		$this->assertSame( 5, $first['total'] );
		$this->assertCount( 1, $last['posts'] );
		$this->assertSame( 3, $last['page'] );

		$this->assertCount( 5, Posts::get( array( 'per_page' => 9999 ) )['posts'] );
		$this->assertCount( 1, Posts::get( array( 'per_page' => -4 ) )['posts'] );
	}

	public function test_reading_stores_nothing() {
		$post_id = $this->post( 'A post' );
		$before  = get_post_meta( $post_id );
		$options = wp_load_alloptions();

		Posts::get();
		$this->request();

		$this->assertSame( $before, get_post_meta( $post_id ) );
		$this->assertSame( array_keys( $options ), array_keys( wp_load_alloptions() ) );
	}

	public function test_the_route_returns_the_library() {
		$ready = $this->post( 'With audio', true );
		$this->post( 'Without audio' );

		$response = $this->request( array( 'status' => 'ready' ) );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( $ready ), wp_list_pluck( $data['posts'], 'id' ) );
		$this->assertSame( 1, $data['counts']['missing'] );
	}

	public function test_the_route_refuses_an_unknown_status_and_too_many_per_page() {
		$this->assertSame( 400, $this->request( array( 'status' => 'broken' ) )->get_status() );
		$this->assertSame( 400, $this->request( array( 'per_page' => 500 ) )->get_status() );
	}

	public function test_the_route_is_for_administrators_only() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$this->assertContains( $this->request()->get_status(), array( 401, 403 ) );

		wp_set_current_user( 0 );
		$this->assertContains( $this->request()->get_status(), array( 401, 403 ) );
	}

	public function test_the_route_describes_itself_for_tools() {
		$routes = rest_get_server()->get_routes();
		$route  = $routes['/tta/v1/library'][0];

		$this->assertNotEmpty( $route['label'] );
		$this->assertNotEmpty( $route['description'] );
		foreach ( array( 'status', 'search', 'page', 'per_page' ) as $arg ) {
			$this->assertNotEmpty( $route['args'][ $arg ]['description'] );
		}
	}

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Library_Command::class, WP_CLI::$commands['atlasvoice library'] );
	}

	public function test_the_command_prints_the_count_and_the_posts() {
		$this->post( 'With audio', true );
		$missing = $this->post( 'Without audio' );

		( new Library_Command() )( array(), array( 'status' => 'missing' ) );

		$this->assertContains( '1 of 2 posts have no audio yet.', $this->lines() );
		$this->assertContains( $missing . ' missing Without audio', $this->lines() );
		$this->assertCount( 2, $this->lines() );
	}

	public function test_the_command_prints_json_that_matches_the_service() {
		$this->post( 'With audio', true );

		( new Library_Command() )( array(), array( 'format' => 'json' ) );

		$this->assertSame( Posts::get(), json_decode( $this->lines()[0], true ) );
	}

	public function test_the_command_says_when_the_voice_stores_no_files() {
		$this->use_player( 1 );

		( new Library_Command() )( array(), array() );

		$this->assertSame( 'The voice in use reads in the browser and stores no audio files.', $this->lines()[0] );
	}

	public function test_the_command_stops_on_an_unknown_status() {
		try {
			( new Library_Command() )( array(), array( 'status' => 'broken' ) );
			$this->fail( 'The command should have stopped.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertStringContainsString( 'all, ready or missing', $stop->getMessage() );
		}
	}
}
