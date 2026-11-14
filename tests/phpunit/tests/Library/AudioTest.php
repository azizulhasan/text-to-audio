<?php
/**
 * Tests for the switch to audio jobs (TTS-354): a finished job's file becomes
 * the post's audio, the "when audio is made" setting with its REST route and
 * `wp atlasvoice audio`, and what the library says about a post's job.
 *
 * The service is never called: every HTTP request is refused here.
 *
 * @package TTA
 */

use TTA\CLI\Audio_Command;
use TTA\CLI\Commands;
use TTA\Cloud\Cloud;
use TTA\Cloud\Jobs;
use TTA\Library\Audio;
use TTA\Library\Posts;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Library\Audio
 * @covers \TTA\Library\Posts
 * @covers \TTA_Api\Library_Controller
 * @covers \TTA\CLI\Audio_Command
 */
class AudioTest extends WP_UnitTestCase {

	const SETTINGS = 'tta_settings_data';
	const URL      = 'https://example.org/wp-content/uploads/atlasvoice/jobs/post-1-en-abc.mp3';

	/**
	 * Requests WordPress was asked to send.
	 *
	 * @var string[]
	 */
	private $sent = array();

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		Cloud::reset();
		delete_option( Audio::OPTION );
		update_option( self::SETTINGS, (object) array( 'tta__settings_allow_listening_for_post_types' => array( 'post' ) ) );
		update_option( 'tta_listening_settings', array( 'tta__listening_lang' => 'en' ) );
		$this->connect();
		$this->use_player( Service::PLAYER_ID );
		\TTA\Site\Advanced::clear_cache();
		$this->sent = array();
		add_filter( 'pre_http_request', array( $this, 'refuse' ), 10, 3 );
		foreach ( array( 'atlasvoice_final_mp3_url', 'atlasvoice_final_mp3_written', 'atlasvoice_cloud_job_file_key', 'atlasvoice_job_players' ) as $hook ) {
			remove_all_filters( $hook );
		}
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'refuse' ), 10 );
		remove_all_filters( 'tts_get_player_id' );
		foreach ( array( 'atlasvoice_final_mp3_url', 'atlasvoice_final_mp3_written', 'atlasvoice_cloud_job_file_key', 'atlasvoice_job_players' ) as $hook ) {
			remove_all_filters( $hook );
		}
		foreach ( array( Audio::OPTION, self::SETTINGS, 'tta_listening_settings', Service::OPTION ) as $option ) {
			delete_option( $option );
		}
		\TTA\Site\Advanced::clear_cache();
		parent::tear_down();
	}

	/**
	 * Notes a request and refuses it, so no test ever reaches the network.
	 */
	public function refuse( $pre, $args, $url ) {
		$this->sent[] = $url;

		return new WP_Error( 'test_offline', 'No network in this test.' );
	}

	private function connect() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value_0123456789',
			),
			false
		);
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

	/**
	 * Stores a job record for a post, as the job runner does.
	 */
	private function job( $post_id, $status, array $more = array() ) {
		update_post_meta(
			$post_id,
			Jobs::META,
			array(
				'en' => array_merge(
					array(
						'id'         => '0b9d3c1e-7a52-4f0c-9d1e-2f6a8b7c5d41',
						'status'     => $status,
						'key'        => 'secret-idempotency-key',
						'parts_done' => 2,
						'parts'      => 5,
						'file_path'  => '/var/www/uploads/atlasvoice/jobs/post-1-en-abc.mp3',
						'created'    => time(),
					),
					$more
				),
			)
		);
	}

	private function request( $method, $route, array $params = array() ) {
		$request = new WP_REST_Request( $method, $route );
		foreach ( $params as $name => $value ) {
			$request->set_param( $name, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	/* ---- whether jobs can run ---------------------------------------- */

	public function test_jobs_can_run_with_the_natural_voice_connected() {
		$this->assertSame(
			array(
				'available' => true,
				'reason'    => '',
			),
			Audio::availability()
		);
	}

	public function test_jobs_cannot_run_for_the_browser_voice() {
		$this->use_player( 1 );

		$this->assertSame(
			array(
				'available' => false,
				'reason'    => 'voice',
			),
			Audio::availability()
		);
	}

	public function test_jobs_cannot_run_before_the_service_is_connected() {
		delete_option( Service::OPTION );

		$this->assertSame( 'not_connected', Audio::availability()['reason'] );
	}

	public function test_an_extension_can_add_a_player_whose_audio_jobs_make() {
		// Any player that is not the natural voice stands in for the extension's.
		$this->use_player( 1 );
		$this->assertFalse( Audio::availability()['available'] );

		add_filter(
			'atlasvoice_job_players',
			static function ( $players ) {
				$players[] = '1';

				return $players;
			}
		);

		$this->assertTrue( Audio::availability()['available'] );
	}

	/* ---- a finished job's file becomes the post's audio ------------- */

	public function test_a_finished_job_is_recorded_as_the_posts_audio_under_the_usual_key() {
		$post_id = self::factory()->post->create();

		do_action( 'atlasvoice_cloud_job_done', $post_id, 'en', self::URL, array( 'file_path' => '/tmp/a.mp3' ) );

		$this->assertSame( array( 'en' => self::URL ), get_post_meta( $post_id, 'tts_mp3_file_urls', true ) );
		$this->assertTrue( (bool) get_post_meta( $post_id, Posts::MARK, true ) );
	}

	public function test_a_job_adds_to_the_files_a_post_already_has() {
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, 'tts_mp3_file_urls', array( 'es' => 'https://example.org/es.mp3' ) );

		Audio::attach( $post_id, 'en', self::URL, array( 'file_path' => '/tmp/a.mp3' ) );

		$this->assertSame(
			array(
				'es' => 'https://example.org/es.mp3',
				'en' => self::URL,
			),
			get_post_meta( $post_id, 'tts_mp3_file_urls', true )
		);
	}

	public function test_the_address_goes_through_the_same_filter_and_action_as_a_file_made_on_first_play() {
		$post_id = self::factory()->post->create();
		$written = array();
		add_filter(
			'atlasvoice_final_mp3_url',
			static function ( $url, $path, $id ) {
				return 'https://storage.example/' . $id . '/' . basename( $path );
			},
			10,
			3
		);
		add_action(
			'atlasvoice_final_mp3_written',
			static function ( $path, $url, $id, $body ) use ( &$written ) {
				$written = array( $path, $url, $id, $body );
			},
			10,
			4
		);

		Audio::attach( $post_id, 'en', self::URL, array( 'file_path' => '/tmp/a.mp3' ) );

		$stored = get_post_meta( $post_id, 'tts_mp3_file_urls', true );
		$this->assertSame( 'https://storage.example/' . $post_id . '/a.mp3', $stored['en'] );
		$this->assertSame(
			array(
				'/tmp/a.mp3',
				$stored['en'],
				$post_id,
				array(
					'source'   => 'job',
					'language' => 'en',
				),
			),
			$written
		);
	}

	public function test_a_file_is_not_attached_when_the_voice_changed_while_the_job_ran() {
		$post_id = self::factory()->post->create();
		$this->use_player( 1 );

		Audio::attach( $post_id, 'en', self::URL, array( 'file_path' => '/tmp/a.mp3' ) );

		$this->assertSame( '', get_post_meta( $post_id, 'tts_mp3_file_urls', true ) );
		$this->assertSame( '', get_post_meta( $post_id, Posts::MARK, true ) );
	}

	public function test_nothing_is_attached_without_an_address_or_for_a_post_that_is_gone() {
		$post_id = self::factory()->post->create();

		Audio::attach( $post_id, 'en', '', array() );
		Audio::attach( $post_id, 'en', array( 'not', 'a', 'string' ), array() );
		Audio::attach( 999999, 'en', self::URL, array() );

		$this->assertSame( '', get_post_meta( $post_id, 'tts_mp3_file_urls', true ) );
	}

	public function test_an_extension_can_choose_the_key_and_an_empty_key_attaches_nothing() {
		$post_id = self::factory()->post->create();
		add_filter(
			'atlasvoice_cloud_job_file_key',
			static function ( $key, $id, $language ) {
				return $language . '--voice--Sarah';
			},
			10,
			3
		);
		Audio::attach( $post_id, 'en', self::URL, array() );
		$this->assertSame( array( 'en--voice--Sarah' => self::URL ), get_post_meta( $post_id, 'tts_mp3_file_urls', true ) );

		remove_all_filters( 'atlasvoice_cloud_job_file_key' );
		add_filter( 'atlasvoice_cloud_job_file_key', '__return_empty_string' );
		$other = self::factory()->post->create();
		Audio::attach( $other, 'en', self::URL, array() );
		$this->assertSame( '', get_post_meta( $other, 'tts_mp3_file_urls', true ) );
	}

	/* ---- when audio is made ------------------------------------------ */

	public function test_audio_is_made_on_the_first_play_until_the_site_chooses_otherwise() {
		$this->assertSame( Audio::WHEN_PLAY, Audio::get()['when'] );
		$this->assertFalse( get_option( Audio::OPTION ) );

		update_option( Audio::OPTION, 'broken' );
		$this->assertSame( Audio::WHEN_PLAY, Audio::when() );
	}

	public function test_saving_stores_the_choice_and_refuses_anything_else() {
		$this->assertSame( Audio::WHEN_PUBLISH, Audio::save( array( 'when' => 'publish' ) )['when'] );
		$this->assertSame( array( 'when' => 'publish' ), get_option( Audio::OPTION ) );

		foreach ( array( 'always', '', array( 'publish' ), 1 ) as $wrong ) {
			$this->assertWPError( Audio::save( array( 'when' => $wrong ) ) );
		}
		$this->assertSame( Audio::WHEN_PUBLISH, Audio::when() );

		// Nothing sent: nothing changes.
		$this->assertSame( Audio::WHEN_PUBLISH, Audio::save( array() )['when'] );
	}

	public function test_publishing_plans_nothing_on_a_site_that_makes_audio_on_first_play() {
		$post_id = self::factory()->post->create();

		$this->assertFalse( wp_next_scheduled( Audio::START_HOOK, array( $post_id ) ) );
		$this->assertSame( array(), $this->sent );
	}

	public function test_publishing_plans_a_job_in_the_background_and_sends_nothing_itself() {
		Audio::save( array( 'when' => 'publish' ) );

		$post_id = self::factory()->post->create();

		$planned = wp_next_scheduled( Audio::START_HOOK, array( $post_id ) );
		$this->assertNotFalse( $planned );
		$this->assertGreaterThanOrEqual( time() + Audio::START_DELAY - 2, $planned );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_second_save_replaces_the_plan_instead_of_adding_one() {
		Audio::save( array( 'when' => 'publish' ) );
		$post_id = self::factory()->post->create();

		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => 'Changed.',
			)
		);

		$events = 0;
		foreach ( (array) _get_cron_array() as $hooks ) {
			$events += isset( $hooks[ Audio::START_HOOK ] ) ? count( $hooks[ Audio::START_HOOK ] ) : 0;
		}
		$this->assertSame( 1, $events );
	}

	/**
	 * @dataProvider posts_that_get_no_job
	 */
	public function test_these_posts_get_no_job( array $post ) {
		Audio::save( array( 'when' => 'publish' ) );

		$post_id = self::factory()->post->create( $post );

		$this->assertFalse( wp_next_scheduled( Audio::START_HOOK, array( $post_id ) ) );
	}

	public function posts_that_get_no_job() {
		return array(
			'a draft'                       => array( array( 'post_status' => 'draft' ) ),
			'a type without a player'       => array( array( 'post_type' => 'page' ) ),
			'a post behind a password'      => array( array( 'post_password' => 'pass' ) ),
			'a post that is still private'  => array( array( 'post_status' => 'private' ) ),
		);
	}

	public function test_publishing_plans_nothing_when_jobs_cannot_run() {
		Audio::save( array( 'when' => 'publish' ) );
		$this->use_player( 1 );

		$post_id = self::factory()->post->create();

		$this->assertFalse( wp_next_scheduled( Audio::START_HOOK, array( $post_id ) ) );
	}

	public function test_the_planned_start_sends_the_post_to_the_service() {
		Audio::save( array( 'when' => 'publish' ) );
		$post_id = self::factory()->post->create( array( 'post_content' => 'The mill stands by the river.' ) );

		Audio::start_planned( $post_id );

		$this->assertCount( 1, $this->sent );
		$this->assertStringContainsString( '/v1/jobs', $this->sent[0] );
	}

	public function test_the_planned_start_does_nothing_when_things_changed_meanwhile() {
		Audio::save( array( 'when' => 'publish' ) );
		$post_id = self::factory()->post->create( array( 'post_content' => 'The mill stands by the river.' ) );

		// Back to a draft.
		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_status' => 'draft',
			)
		);
		Audio::start_planned( $post_id );

		// The site went back to first play.
		wp_publish_post( $post_id );
		Audio::save( array( 'when' => 'play' ) );
		Audio::start_planned( $post_id );

		// The post is gone.
		Audio::start_planned( 999999 );

		$this->assertSame( array(), $this->sent );
	}

	/* ---- the routes --------------------------------------------------- */

	public function test_the_route_reads_and_saves_the_setting() {
		$this->assertSame( Audio::get(), $this->request( 'GET', '/tta/v1/library/settings' )->get_data() );

		$response = $this->request( 'POST', '/tta/v1/library/settings', array( 'when' => 'publish' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'publish', $response->get_data()['when'] );
		$this->assertSame( 'publish', Audio::when() );
	}

	public function test_the_route_refuses_another_word_and_keeps_the_setting() {
		$this->assertSame( 400, $this->request( 'POST', '/tta/v1/library/settings', array( 'when' => 'always' ) )->get_status() );
		$this->assertSame( Audio::WHEN_PLAY, Audio::when() );
	}

	public function test_the_routes_are_for_administrators_only() {
		foreach ( array( self::factory()->user->create( array( 'role' => 'editor' ) ), 0 ) as $user ) {
			wp_set_current_user( $user );

			$this->assertContains( $this->request( 'GET', '/tta/v1/library/settings' )->get_status(), array( 401, 403 ) );
			$this->assertContains( $this->request( 'POST', '/tta/v1/library/settings', array( 'when' => 'publish' ) )->get_status(), array( 401, 403 ) );
		}

		$this->assertSame( Audio::WHEN_PLAY, Audio::when() );
	}

	public function test_the_routes_describe_themselves_and_say_that_publish_sends_text() {
		$routes = rest_get_server()->get_routes();
		$route  = $routes['/tta/v1/library/settings'];

		foreach ( $route as $method ) {
			$this->assertNotEmpty( $method['label'] );
			$this->assertNotEmpty( $method['description'] );
		}
		$this->assertStringContainsString( 'sends its text to the AtlasVoice service', $route[1]['description'] );
	}

	/* ---- the command -------------------------------------------------- */

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Audio_Command::class, WP_CLI::$commands['atlasvoice audio'] );
	}

	public function test_get_prints_the_setting_and_whether_jobs_can_run() {
		( new Audio_Command() )->get( array(), array() );
		$this->assertSame( array( 'audio is made: on the first play', 'audio jobs: can run' ), wp_list_pluck( WP_CLI::$log, 1 ) );

		WP_CLI::reset();
		$this->use_player( 1 );
		Audio::save( array( 'when' => 'publish' ) );
		( new Audio_Command() )->get( array(), array() );
		$this->assertSame(
			array( 'audio is made: when a post is published', 'audio jobs: cannot run: the voice in use is not made by jobs' ),
			wp_list_pluck( WP_CLI::$log, 1 )
		);
	}

	public function test_get_prints_json_that_matches_the_service() {
		( new Audio_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Audio::get(), json_decode( WP_CLI::$log[0][1], true ) );
	}

	public function test_set_saves_and_warns_when_jobs_cannot_run() {
		( new Audio_Command() )->set( array(), array( 'when' => 'publish' ) );
		$this->assertSame( array( array( 'success', 'Audio is made when a post is published.' ) ), WP_CLI::$log );

		WP_CLI::reset();
		$this->use_player( 1 );
		( new Audio_Command() )->set( array(), array( 'when' => 'publish' ) );
		$this->assertSame( 'warning', end( WP_CLI::$log )[0] );
	}

	public function test_set_stops_on_another_word() {
		try {
			( new Audio_Command() )->set( array(), array( 'when' => 'always' ) );
			$this->fail( 'The command should have stopped.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertStringContainsString( '"play"', $stop->getMessage() );
		}

		$this->assertSame( Audio::WHEN_PLAY, Audio::when() );
	}

	/* ---- what the library says about a job --------------------------- */

	public function test_the_library_says_whether_make_audio_can_start_a_job() {
		$this->assertSame( Audio::availability(), Posts::get()['jobs'] );
	}

	public function test_a_post_whose_job_runs_is_making_with_its_progress() {
		$post_id = self::factory()->post->create();
		$this->job( $post_id, 'running' );

		$post = Posts::get()['posts'][0];

		$this->assertSame( 'making', $post['status'] );
		$this->assertSame(
			array(
				'status'     => 'running',
				'parts_done' => 2,
				'parts'      => 5,
				'error'      => '',
			),
			$post['job']
		);
	}

	public function test_a_job_never_shows_its_key_or_its_file_path() {
		$post_id = self::factory()->post->create();
		$this->job( $post_id, 'running' );

		$json = wp_json_encode( $this->request( 'GET', '/tta/v1/library' )->get_data() );

		$this->assertStringNotContainsString( 'secret-idempotency-key', $json );
		$this->assertStringNotContainsString( '/var/www', $json );
	}

	public function test_a_failed_job_shows_as_failed_with_its_reason_until_there_is_a_file() {
		$post_id = self::factory()->post->create();
		$this->job( $post_id, 'failed', array( 'error' => 'quota_exceeded' ) );

		$post = Posts::get()['posts'][0];
		$this->assertSame( 'failed', $post['status'] );
		$this->assertSame( 'quota_exceeded', $post['job']['error'] );

		// A file from before is still the post's audio.
		update_post_meta( $post_id, Posts::MARK, true );
		$this->assertSame( 'ready', Posts::get()['posts'][0]['status'] );
	}

	public function test_a_post_that_is_made_again_says_so_although_it_has_a_file() {
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, Posts::MARK, true );
		$this->job( $post_id, 'queued' );

		$this->assertSame( 'making', Posts::get()['posts'][0]['status'] );
	}

	public function test_a_cancelled_job_and_no_job_are_missing() {
		$cancelled = self::factory()->post->create( array( 'post_date' => '2026-01-02 10:00:00' ) );
		$none      = self::factory()->post->create( array( 'post_date' => '2026-01-01 10:00:00' ) );
		$this->job( $cancelled, 'canceled' );

		$posts = array();
		foreach ( Posts::get()['posts'] as $post ) {
			$posts[ $post['id'] ] = $post;
		}

		$this->assertSame( 'missing', $posts[ $cancelled ]['status'] );
		$this->assertSame( 'missing', $posts[ $none ]['status'] );
		$this->assertNull( $posts[ $none ]['job'] );
	}
}
