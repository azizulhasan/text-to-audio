<?php
/**
 * Tests for the "AtlasVoice" panel of the post editor: the service class,
 * its REST routes, `wp atlasvoice post` and how it is put in the editor
 * (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Post_Command;
use TTA\Cloud\Cloud;
use TTA\Cloud\Jobs;
use TTA\Content\Where;
use TTA\Editor\Post_Panel;
use TTA\Library\Posts;
use TTA\TTA_AtlasVoice_Service as Service;
use TTA_Admin\Admin_App;

/**
 * @covers \TTA\Editor\Post_Panel
 * @covers \TTA\CLI\Post_Command
 * @covers \TTA_Api\Route_Access::post_editor
 */
class PostPanelTest extends WP_UnitTestCase {

	const SETTINGS = 'tta_settings_data';

	/** @var string[] The requests that tried to leave the site. */
	private $sent = array();

	/** @var int */
	private $admin;

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		Cloud::reset();
		update_option(
			self::SETTINGS,
			(object) array(
				'tta__settings_allow_listening_for_post_types' => array( 'post' ),
				'tta__settings_exclude_post_ids'               => array(),
				'tta__settings_exclude_tags'                   => 'aside|figure',
			)
		);
		update_option( 'tta_listening_settings', array( 'tta__listening_lang' => 'en' ) );
		delete_option( Service::OPTION );
		delete_option( 'tta_analytics_settings' );
		delete_option( 'tta_customize_settings' );
		\TTA\TTA_Cache::flush();
		$this->use_player( 1 );
		$this->sent = array();
		add_filter( 'pre_http_request', array( $this, 'refuse' ), 10, 3 );
		remove_all_filters( 'atlasvoice_job_players' );
		$this->admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->admin );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'refuse' ), 10 );
		remove_all_filters( 'tts_get_player_id' );
		remove_all_filters( 'atlasvoice_admin_ui' );
		delete_option( self::SETTINGS );
		delete_option( Service::OPTION );
		\TTA\TTA_Cache::flush();
		parent::tear_down();
	}

	public function refuse( $pre, $args, $url ) {
		$this->sent[] = $url;

		return new WP_Error( 'test_offline', 'No network in this test.' );
	}

	private function use_player( $player_id ) {
		remove_all_filters( 'tts_get_player_id' );
		add_filter(
			'tts_get_player_id',
			static function () use ( $player_id ) {
				return $player_id;
			}
		);
	}

	/** A site whose audio is made by jobs: the natural voice, connected. */
	private function with_jobs() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value_0123456789',
			),
			false
		);
		$this->use_player( Service::PLAYER_ID );
	}

	private function post( array $more = array() ) {
		return self::factory()->post->create( array( 'post_title' => 'A post' ) + $more );
	}

	private function hidden() {
		return array_map( 'intval', (array) json_decode( wp_json_encode( get_option( self::SETTINGS ) ), true )['tta__settings_exclude_post_ids'] );
	}

	private function rest( $method, $path, $body = null ) {
		$request = new WP_REST_Request( $method, '/tta/v1/post-panel/' . $path );
		if ( null !== $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// ---- reading ---------------------------------------------------------------

	public function test_a_post_that_does_not_exist_is_an_error() {
		$this->assertSame( 'atlasvoice_no_post', Post_Panel::get( 999999 )->get_error_code() );
	}

	public function test_the_browser_voice_has_no_files_to_make() {
		$panel = Post_Panel::get( $this->post() );

		$this->assertSame( 'browser', $panel['audio']['kind'] );
		$this->assertSame( '', $panel['audio']['status'] );
		$this->assertFalse( $panel['audio']['can_make'] );
	}

	public function test_a_voice_that_stores_audio_without_jobs_shows_its_files_state() {
		$this->use_player( 3 );
		$post_id = $this->post();

		$this->assertSame( array( 'files', 'missing', false ), array_values( array_intersect_key( Post_Panel::get( $post_id )['audio'], array_flip( array( 'kind', 'status', 'can_make' ) ) ) ) );

		update_post_meta( $post_id, Posts::MARK, true );
		$this->assertSame( 'ready', Post_Panel::get( $post_id )['audio']['status'] );
	}

	public function test_a_draft_never_has_audio_to_make() {
		$this->with_jobs();
		$panel = Post_Panel::get( $this->post( array( 'post_status' => 'draft' ) ) );

		$this->assertSame( 'draft', $panel['audio']['status'] );
		$this->assertFalse( $panel['post']['published'] );
		$this->assertFalse( $panel['audio']['can_make'] );
	}

	public function test_a_published_post_of_a_connected_site_can_have_its_audio_made() {
		$this->with_jobs();
		$panel = Post_Panel::get( $this->post() );

		$this->assertSame( 'jobs', $panel['audio']['kind'] );
		$this->assertSame( 'missing', $panel['audio']['status'] );
		$this->assertTrue( $panel['audio']['can_make'] );
		$this->assertContains( $panel['audio']['when'], array( 'play', 'publish' ) );
	}

	public function test_the_panel_holds_no_key_of_the_service() {
		$this->with_jobs();

		$this->assertStringNotContainsString( 'av_live_secret', wp_json_encode( Post_Panel::get( $this->post() ) ) );
	}

	public function test_the_shortcode_is_the_one_the_site_uses() {
		$post_id = $this->post();
		$this->assertSame( '[atlasvoice]', Post_Panel::get( $post_id )['shortcode'] );

		update_option( 'tta_customize_settings', array( 'tta_play_btn_shortcode' => '[tta_listen_btn]' ) );
		$this->assertSame( '[tta_listen_btn]', Post_Panel::get( $post_id )['shortcode'] );
	}

	// ---- listening -------------------------------------------------------------

	public function test_listening_is_not_counted_when_the_site_does_not_count_it() {
		$listening = Post_Panel::get( $this->post() )['listening'];

		$this->assertSame(
			array(
				'counted'   => false,
				'days'      => 30,
				'plays'     => 0,
				'listeners' => 0,
				'finished'  => 0,
			),
			$listening
		);
	}

	public function test_listening_counts_the_plays_of_this_post_in_the_last_30_days() {
		global $wpdb;
		update_option( 'tta_analytics_settings', array( 'tts_enable_analytics' => true ) );
		$table = $wpdb->prefix . 'atlasvoice_analytics';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "CREATE TABLE IF NOT EXISTS {$table} (id bigint unsigned NOT NULL AUTO_INCREMENT, user_id varchar(190), post_id bigint, analytics longtext, other_data longtext, play_count int DEFAULT 0, created_at datetime, updated_at datetime, PRIMARY KEY (id))" );
		$post_id = $this->post();
		$other   = $this->post();
		$ended   = array(
			'play' => array( 'count' => 1 ),
			'end'  => array( 'count' => 1 ),
		);
		$rows    = array(
			array( $post_id, 3, '-1 day', $ended ),
			array( $post_id, 2, '-29 days', array( 'play' => array( 'count' => 2 ) ) ),
			array( $post_id, 9, '-31 days', $ended ),
			array( $other, 50, '-1 day', $ended ),
		);
		foreach ( $rows as $index => $row ) {
			$wpdb->insert( // phpcs:ignore
				$table,
				array(
					'user_id'    => 'u' . $index,
					'post_id'    => $row[0],
					'play_count' => $row[1],
					'analytics'  => maybe_serialize( $row[3] ),
					'updated_at' => gmdate( 'Y-m-d H:i:s', strtotime( $row[2] ) ),
				)
			);
		}

		$listening = Post_Panel::get( $post_id )['listening'];

		$this->assertTrue( $listening['counted'] );
		$this->assertSame( 5, $listening['plays'] );
		$this->assertSame( 2, $listening['listeners'] );
		// One of the two listeners of the last 30 days heard it to the end.
		$this->assertSame( 50, $listening['finished'] );
	}

	// ---- the player on this post -----------------------------------------------

	public function test_the_player_shows_on_a_post_until_it_is_hidden_there() {
		$post_id = $this->post();
		$other   = $this->post();
		$this->assertTrue( Post_Panel::get( $post_id )['player']['shown'] );

		$panel = Post_Panel::show_player( $post_id, false );

		$this->assertFalse( $panel['player']['shown'] );
		$this->assertSame( array( $post_id ), $this->hidden() );
		$this->assertTrue( Post_Panel::get( $other )['player']['shown'] );
	}

	public function test_hiding_is_stored_where_the_what_is_read_screen_keeps_it_and_keeps_the_rest() {
		$post_id = $this->post();
		$earlier = $this->post();
		Where::save( array( 'skip_posts' => array( $earlier ) ) );

		Post_Panel::show_player( $post_id, false );
		Post_Panel::show_player( $post_id, false );

		$this->assertSame( array( $earlier, $post_id ), $this->hidden() );
		$this->assertSame( array( $earlier, $post_id ), array_map( 'intval', Where::get()['skip_posts'] ) );
		$stored = json_decode( wp_json_encode( get_option( self::SETTINGS ) ), true );
		$this->assertSame( array( 'post' ), $stored['tta__settings_allow_listening_for_post_types'] );
		$this->assertSame( 'aside|figure', $stored['tta__settings_exclude_tags'] );
	}

	public function test_showing_again_takes_only_this_post_out_of_the_list() {
		$post_id = $this->post();
		$earlier = $this->post();
		Where::save( array( 'skip_posts' => array( $earlier, $post_id ) ) );

		$panel = Post_Panel::show_player( $post_id, true );

		$this->assertTrue( $panel['player']['shown'] );
		$this->assertSame( array( $earlier ), $this->hidden() );
	}

	public function test_the_player_of_a_post_that_does_not_exist_cannot_be_set() {
		$this->assertSame( 'atlasvoice_no_post', Post_Panel::show_player( 999999, false )->get_error_code() );
		$this->assertSame( array(), $this->hidden() );
	}

	// ---- making the audio ------------------------------------------------------

	public function test_audio_is_not_made_for_a_voice_that_has_no_jobs() {
		$this->use_player( 3 );

		$this->assertSame( 'atlasvoice_audio_not_by_job', Post_Panel::make_audio( $this->post() )->get_error_code() );
		$this->assertSame( array(), $this->sent );
	}

	public function test_audio_is_not_made_for_a_site_that_is_not_connected() {
		$this->use_player( Service::PLAYER_ID );
		$result = Post_Panel::make_audio( $this->post() );

		$this->assertSame( 'atlasvoice_audio_not_by_job', $result->get_error_code() );
		$this->assertStringContainsString( 'not connected', $result->get_error_message() );
		$this->assertSame( array(), $this->sent );
	}

	public function test_audio_is_not_made_for_a_draft() {
		$this->with_jobs();

		$this->assertSame( 'atlasvoice_post_not_published', Post_Panel::make_audio( $this->post( array( 'post_status' => 'draft' ) ) )->get_error_code() );
		$this->assertSame( array(), $this->sent );
	}

	public function test_making_audio_asks_the_service_and_passes_on_why_it_did_not_start() {
		$this->with_jobs();
		$result = Post_Panel::make_audio( $this->post( array( 'post_content' => 'Some words to read aloud.' ) ) );

		$this->assertWPError( $result );
		$this->assertNotEmpty( $this->sent, 'The job was asked of the service.' );
		foreach ( $this->sent as $url ) {
			$this->assertStringNotContainsString( 'av_live_secret', $url );
		}
	}

	// ---- never for this post ---------------------------------------------------

	public function test_audio_follows_the_site_until_it_is_switched_off_for_a_post() {
		$this->with_jobs();
		$post_id = $this->post();
		$other   = $this->post();
		$this->assertFalse( Post_Panel::get( $post_id )['audio']['off'] );

		$panel = Post_Panel::audio_off( $post_id, true );

		$this->assertTrue( $panel['audio']['off'] );
		$this->assertFalse( $panel['audio']['can_make'] );
		$this->assertTrue( Jobs::is_off( $post_id ) );
		$this->assertFalse( Jobs::is_off( $other ) );
		$this->assertTrue( Post_Panel::get( $other )['audio']['can_make'] );
	}

	public function test_a_post_that_is_switched_off_starts_no_job_by_any_way() {
		$this->with_jobs();
		$post_id = $this->post( array( 'post_content' => 'Some words to read aloud.' ) );
		Post_Panel::audio_off( $post_id, true );

		$this->assertSame( 'atlasvoice_audio_off', Post_Panel::make_audio( $post_id )->get_error_code() );
		// The service's own door: a publish, a first play and a run for all posts go through it.
		$this->assertSame( 'audio_off_for_post', Jobs::start( $post_id )->get_error_code() );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_run_for_all_posts_leaves_a_switched_off_post_out() {
		$this->with_jobs();
		$first  = $this->post();
		$second = $this->post();
		$this->assertSame( array( $first, $second ), Posts::missing_ids() );
		$this->assertSame( 2, Posts::missing_count() );

		Post_Panel::audio_off( $first, true );

		$this->assertSame( array( $second ), Posts::missing_ids() );
		$this->assertSame( 1, Posts::missing_count() );
	}

	public function test_visitors_of_a_switched_off_post_hear_the_browser_voice_with_the_free_player() {
		$this->with_jobs();
		$post_id = $this->post();
		$this->assertSame( '', Post_Panel::get( $post_id )['audio']['visitors'] );

		Post_Panel::audio_off( $post_id, true );
		$this->assertSame( 'browser', Post_Panel::get( $post_id )['audio']['visitors'] );

		// On the page of that post the free player becomes the browser voice.
		$this->go_to( get_permalink( $post_id ) );
		( new \TTA_Admin\TTA_Admin( 'text-to-audio', '1' ) )->serve_player_1_until_ready();
		$this->assertSame( 1, (int) get_player_id() );
		$this->assertTrue( \TTA\Library\Audio::no_player_without_audio( true, get_post( $post_id ) ), 'The player still shows.' );
	}

	public function test_a_post_that_is_not_switched_off_keeps_the_natural_voice_on_its_page() {
		$this->with_jobs();
		$post_id = $this->post();

		$this->go_to( get_permalink( $post_id ) );
		( new \TTA_Admin\TTA_Admin( 'text-to-audio', '1' ) )->serve_player_1_until_ready();

		$this->assertSame( Service::PLAYER_ID, (int) get_player_id() );
	}

	public function test_an_extensions_player_is_not_shown_on_a_switched_off_post_without_audio() {
		$this->with_jobs();
		add_filter( 'atlasvoice_free_mp3_player', '__return_false' );
		$post_id = $this->post();
		$post    = get_post( $post_id );
		$this->assertTrue( \TTA\Library\Audio::no_player_without_audio( true, $post ) );

		Post_Panel::audio_off( $post_id, true );

		$this->assertSame( 'none', Post_Panel::get( $post_id )['audio']['visitors'] );
		$this->assertFalse( \TTA\Library\Audio::no_player_without_audio( true, $post ) );

		// With stored audio the player stays: the file plays without making anything.
		update_post_meta( $post_id, 'tts_mp3_file_urls', array( 'en' => 'https://example.org/a.mp3' ) );
		$this->assertSame( '', Post_Panel::get( $post_id )['audio']['visitors'] );
		$this->assertTrue( \TTA\Library\Audio::no_player_without_audio( true, $post ) );
		remove_filter( 'atlasvoice_free_mp3_player', '__return_false' );
	}

	public function test_the_play_route_makes_nothing_for_a_switched_off_post() {
		$this->with_jobs();
		$post_id = $this->post();
		Post_Panel::audio_off( $post_id, true );

		$result = \TTA\TTA_GTTS_Generation::handle(
			array(
				'post_id'    => $post_id,
				'content'    => 'Some words.',
				'title'      => 'a-post',
				'temp_title' => 'a-post-1',
			)
		);

		$this->assertFalse( $result['status'] );
		$this->assertSame( 'audio_off_for_post', $result['data']['message'] );
		$this->assertSame( array(), $this->sent );
	}

	public function test_switching_it_on_again_removes_the_mark_and_the_post_can_be_made() {
		$this->with_jobs();
		$post_id = $this->post();
		Post_Panel::audio_off( $post_id, true );

		$panel = Post_Panel::audio_off( $post_id, false );

		$this->assertFalse( $panel['audio']['off'] );
		$this->assertTrue( $panel['audio']['can_make'] );
		$this->assertSame( array(), get_post_meta( $post_id, Jobs::OFF_META ) );
		$this->assertSame( array( $post_id ), Posts::missing_ids() );
	}

	public function test_stored_audio_stays_when_audio_is_switched_off() {
		$this->with_jobs();
		$post_id = $this->post();
		update_post_meta( $post_id, Posts::MARK, true );

		$panel = Post_Panel::audio_off( $post_id, true );

		$this->assertSame( 'ready', $panel['audio']['status'] );
		$this->assertNotEmpty( get_post_meta( $post_id, Posts::MARK, true ) );
	}

	public function test_audio_of_a_post_that_does_not_exist_cannot_be_switched_off() {
		$this->assertSame( 'atlasvoice_no_post', Post_Panel::audio_off( 999999, true )->get_error_code() );
	}

	public function test_the_route_switches_audio_off_for_who_can_edit_the_post_only() {
		$this->with_jobs();
		$post_id = $this->post();

		$this->assertSame( 400, $this->rest( 'POST', $post_id . '/audio-off', array() )->get_status() );
		$response = $this->rest( 'POST', $post_id . '/audio-off', array( 'off' => true ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['audio']['off'] );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$this->assertContains( $this->rest( 'POST', $post_id . '/audio-off', array( 'off' => false ) )->get_status(), array( 401, 403 ) );
		$this->assertTrue( Jobs::is_off( $post_id ) );
	}

	public function test_the_command_switches_audio_off_and_on() {
		$post_id = $this->post();
		$command = new Post_Command();

		$command->never( array( $post_id ) );
		$this->assertTrue( Jobs::is_off( $post_id ) );
		$this->assertSame( 'success', WP_CLI::$log[0][0] );

		$command->follow( array( $post_id ) );
		$this->assertFalse( Jobs::is_off( $post_id ) );
	}

	// ---- the files of the post -------------------------------------------------

	public function test_the_panel_holds_the_rows_of_the_audio_files_for_a_voice_that_stores_them() {
		$this->assertNull( Post_Panel::get( $this->post() )['files'] );

		$this->use_player( 3 );
		$post_id = $this->post();
		$panel   = Post_Panel::get( $post_id );

		$this->assertSame( \TTA\TTA_Helper::atlasvoice_panel_state( get_post( $post_id ) ), $panel['files'] );
		$this->assertSame( 32, strlen( $panel['files_key'] ) );

		update_post_meta( $post_id, 'tts_mp3_file_urls', array( 'en' => 'https://example.org/a.mp3' ) );
		$this->assertNotSame( $panel['files_key'], Post_Panel::get( $post_id )['files_key'], 'A changed file gives the rows a new key.' );
	}

	public function test_the_separate_audio_box_is_not_shown_beside_the_panel() {
		$this->assertTrue( apply_filters( 'atlasvoice_render_audio_panel', true ), 'The classic admin keeps its box.' );

		add_filter(
			'atlasvoice_admin_ui',
			static function () {
				return Admin_App::UI_NEW;
			}
		);

		$this->assertSame( ! Post_Panel::is_active(), apply_filters( 'atlasvoice_render_audio_panel', true ) );
		$this->assertFalse( apply_filters( 'atlasvoice_render_audio_panel', false ), 'What switched the box off stays in force.' );
	}

	// ---- the routes ------------------------------------------------------------

	public function test_an_administrator_reads_and_changes_the_panel_through_the_routes() {
		$post_id = $this->post();

		$response = $this->rest( 'GET', $post_id );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Post_Panel::get( $post_id ), $response->get_data() );

		$response = $this->rest( 'POST', $post_id . '/player', array( 'shown' => false ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['player']['shown'] );
		$this->assertSame( array( $post_id ), $this->hidden() );
	}

	public function test_an_author_uses_the_panel_of_an_own_post_and_not_of_another() {
		$author  = self::factory()->user->create( array( 'role' => 'author' ) );
		$own     = $this->post( array( 'post_author' => $author ) );
		$foreign = $this->post( array( 'post_author' => $this->admin ) );
		wp_set_current_user( $author );

		$this->assertSame( 200, $this->rest( 'GET', $own )->get_status() );
		$this->assertSame( 200, $this->rest( 'POST', $own . '/player', array( 'shown' => false ) )->get_status() );
		$this->assertSame( array( $own ), $this->hidden() );

		foreach ( array( array( 'GET', $foreign, null ), array( 'POST', $foreign . '/player', array( 'shown' => false ) ), array( 'POST', $foreign . '/audio', null ) ) as $call ) {
			$this->assertContains( $this->rest( $call[0], $call[1], $call[2] )->get_status(), array( 401, 403 ) );
		}
		$this->assertSame( array( $own ), $this->hidden() );
	}

	/**
	 * @dataProvider who_cannot
	 */
	public function test_the_routes_are_closed_to_those_who_cannot_edit_the_post( $role ) {
		$post_id = $this->post();
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		foreach ( array( array( 'GET', $post_id, null ), array( 'POST', $post_id . '/player', array( 'shown' => false ) ), array( 'POST', $post_id . '/audio', null ) ) as $call ) {
			$this->assertContains( $this->rest( $call[0], $call[1], $call[2] )->get_status(), array( 401, 403 ) );
		}
		$this->assertSame( array(), $this->hidden() );
		$this->assertSame( array(), $this->sent );
	}

	public function who_cannot() {
		return array(
			'a visitor'    => array( '' ),
			'a subscriber' => array( 'subscriber' ),
		);
	}

	public function test_the_routes_refuse_what_is_not_a_post_or_not_a_switch() {
		$post_id = $this->post();

		$this->assertContains( $this->rest( 'GET', 999999 )->get_status(), array( 401, 403, 404 ) );
		$this->assertSame( 400, $this->rest( 'POST', $post_id . '/player', array() )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', $post_id . '/player', array( 'shown' => 'maybe' ) )->get_status() );
		$this->assertSame( array(), $this->hidden() );
	}

	public function test_the_audio_route_says_why_nothing_was_started() {
		$response = $this->rest( 'POST', $this->post() . '/audio' );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'atlasvoice_audio_not_by_job', $response->get_data()['code'] );
	}

	public function test_each_route_describes_itself_for_tools() {
		$count = 0;
		foreach ( rest_get_server()->get_routes() as $route => $endpoints ) {
			if ( 0 !== strpos( $route, '/tta/v1/post-panel/' ) ) {
				continue;
			}
			foreach ( $endpoints as $endpoint ) {
				++$count;
				$this->assertNotEmpty( $endpoint['label'], $route );
				$this->assertNotEmpty( $endpoint['description'], $route );
				foreach ( $endpoint['args'] as $arg ) {
					$this->assertNotEmpty( $arg['description'], $route );
				}
			}
		}

		$this->assertSame( 4, $count );
	}

	// ---- the command -----------------------------------------------------------

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Post_Command::class, WP_CLI::$commands['atlasvoice post'] );
	}

	public function test_the_command_shows_hides_and_reports_a_post() {
		$post_id = $this->post();
		$command = new Post_Command();

		$command->hide( array( $post_id ) );
		$this->assertSame( array( $post_id ), $this->hidden() );
		$command->status( array( $post_id ), array() );
		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'player: hidden', $lines );
		$this->assertContains( 'audio: read live in the browser, no files', $lines );
		$this->assertContains( 'listening is not counted on this site', $lines );
		$this->assertContains( 'shortcode: [atlasvoice]', $lines );

		$command->show( array( $post_id ) );
		$this->assertSame( array(), $this->hidden() );

		WP_CLI::reset();
		$command->status( array( $post_id ), array( 'format' => 'json' ) );
		$this->assertSame( Post_Panel::get( $post_id ), json_decode( WP_CLI::$log[0][1], true ) );
	}

	public function test_the_command_says_so_for_a_post_that_does_not_exist() {
		try {
			( new Post_Command() )->hide( array( 999999 ) );
		} catch ( Exception $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
	}

	// ---- in the editor ---------------------------------------------------------

	public function test_the_panel_is_not_loaded_while_the_classic_admin_is_in_use() {
		global $post;
		$post = get_post( $this->post() ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		add_filter(
			'atlasvoice_admin_ui',
			static function () {
				return Admin_App::UI_CLASSIC;
			}
		);

		$this->assertSame( 0, Post_Panel::post_on_screen() );
		Post_Panel::enqueue();
		$this->assertFalse( wp_script_is( Post_Panel::HANDLE, 'enqueued' ) );
	}
}
