<?php
/**
 * Tests for the first play of a post without audio: an audio job makes it,
 * and the usual way (batch by batch) stays the fallback (TTS-354).
 *
 * The service is never called: every HTTP request is answered here.
 *
 * @package TTA
 */

use TTA\Cloud\Cloud;
use TTA\Cloud\Jobs;
use TTA\Library\First_Play;
use TTA\TTA_AtlasVoice_Service as Service;
use TTA\TTA_Helper;

/**
 * @covers \TTA\Library\First_Play
 * @covers \TTA_Api\First_Play_Controller
 * @covers \TTA_Api\Route_Access
 */
class FirstPlayTest extends WP_UnitTestCase {

	const KEY  = 'av_live_secret_key_value_0123456789';
	const JOB  = '0b9d3c1e-7a52-4f0c-9d1e-2f6a8b7c5d41';
	const FILE = 'https://api.atlasvoice.cloud/files/avj-0123456789abcdef0123456789abcdef.mp3';
	const MP3  = "ID3\x03\x00\x00\x00\x00\x00\x00fake-mp3-bytes-for-the-test";
	const TEXT = 'The old mill. The mill stands by the river, as it has for two hundred years.';

	/** @var array[] Requests WordPress was asked to send. */
	private $sent = array();

	/** @var array<string, array[]> Answers by "METHOD path-fragment". */
	private $answers = array();

	/** @var int */
	private $post;

	/** @var string[] Job files that were on the site before a test: not ours to delete. */
	private $files_before = array();

	public function set_up() {
		parent::set_up();
		$this->files_before = (array) glob( Service::audio_dir() . 'jobs/post-*.mp3' );
		Cloud::reset();
		delete_transient( Jobs::HOSTS_CACHE );
		foreach ( array( 'tta_settings_data', 'tta_listening_settings' ) as $option ) {
			delete_option( $option );
		}
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => self::KEY,
			),
			false
		);
		update_option( 'tta_listening_settings', array( 'tta__listening_lang' => 'en' ) );
		\TTA\TTA_Cache::flush();
		$this->use_player( Service::PLAYER_ID );
		$this->post    = self::factory()->post->create(
			array(
				'post_title'   => 'The old mill',
				'post_content' => '<p>The mill stands by the river.</p>',
			)
		);
		$this->sent    = array();
		$this->answers = array();
		add_filter( 'pre_http_request', array( $this, 'intercept' ), 10, 3 );
		wp_set_current_user( 0 );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'intercept' ), 10 );
		remove_all_filters( 'tts_get_player_id' );
		remove_all_filters( 'atlasvoice_first_play_text' );
		remove_all_filters( 'atlasvoice_cloud_job_file_key' );
		remove_all_filters( 'atlasvoice_job_players' );
		delete_transient( 'atlasvoice_first_play_' . $this->post );
		foreach ( array_diff( (array) glob( Service::audio_dir() . 'jobs/post-*.mp3' ), $this->files_before ) as $file ) {
			wp_delete_file( $file );
		}
		\TTA\TTA_Cache::flush();
		parent::tear_down();
	}

	public function intercept( $pre, $args, $url ) {
		$this->sent[] = array(
			'url'    => $url,
			'method' => $args['method'],
			'body'   => isset( $args['body'] ) ? json_decode( (string) $args['body'], true ) : null,
		);

		foreach ( $this->answers as $route => $list ) {
			list( $method, $fragment ) = explode( ' ', $route, 2 );
			if ( $method === $args['method'] && false !== strpos( $url, $fragment ) && $list ) {
				$answer = array_shift( $this->answers[ $route ] );

				return array(
					'response' => array(
						'code'    => $answer[0],
						'message' => '',
					),
					'headers'  => new \WpOrg\Requests\Utility\CaseInsensitiveDictionary(
						array( 'Content-Type' => is_string( $answer[1] ) ? 'audio/mpeg' : 'application/json' )
					),
					'body'     => is_string( $answer[1] ) ? $answer[1] : wp_json_encode( $answer[1] ),
					'cookies'  => array(),
				);
			}
		}

		return new WP_Error( 'http_request_failed', 'Could not resolve host.' );
	}

	private function use_player( $player_id ) {
		remove_all_filters( 'tts_get_player_id' );
		add_filter(
			'tts_get_player_id',
			static function () use ( $player_id ) {
				return $player_id;
			},
			9999
		);
	}

	private function job( $status = 'queued', array $more = array() ) {
		return array_merge(
			array(
				'id'           => self::JOB,
				'status'       => $status,
				'parts_total'  => 8,
				'parts_done'   => 'done' === $status ? 8 : 2,
				'chars'        => 6800,
				'billed_chars' => 'done' === $status ? 6800 : 1700,
				'error'        => null,
				'file'         => null,
				'file_expired' => false,
			),
			$more
		);
	}

	private function service_takes_the_job( $status = 'running' ) {
		$this->answers['POST /v1/jobs'][] = array(
			202,
			array(
				'job'           => $this->job( $status ),
				'poll_after_ms' => 3200,
			),
		);
	}

	private function service_says( array $job ) {
		$this->answers[ 'GET /v1/jobs/' . self::JOB ][] = array(
			200,
			array(
				'job'           => $job,
				'poll_after_ms' => in_array( $job['status'], array( 'queued', 'running' ), true ) ? 2500 : null,
			),
		);
	}

	private function service_finished_the_job() {
		$this->service_says(
			$this->job(
				'done',
				array(
					'file' => array(
						'url'    => self::FILE,
						'bytes'  => strlen( self::MP3 ),
						'sha256' => hash( 'sha256', self::MP3 ),
					),
				)
			)
		);
		$this->answers['GET /v1/health'][] = array( 200, array( 'file_hosts' => array( 'api.atlasvoice.cloud' ) ) );
		$this->answers['GET /files/'][]    = array( 200, self::MP3 );
	}

	/** Makes the stored job look as if nobody asked about it for a while. */
	private function time_passes( $seconds = 5 ) {
		$all                  = get_post_meta( $this->post, Jobs::META, true );
		$all['en']['updated'] = time() - $seconds;
		update_post_meta( $this->post, Jobs::META, wp_slash( $all ) );
	}

	private function requests_to( $fragment, $method = '' ) {
		return array_values(
			array_filter(
				$this->sent,
				static function ( $request ) use ( $fragment, $method ) {
					return false !== strpos( $request['url'], $fragment ) && ( '' === $method || $method === $request['method'] );
				}
			)
		);
	}

	private function rest( $method, array $params, $nonce = true ) {
		$request = new WP_REST_Request( $method, '/tta/v1/audio/first-play' );
		if ( $nonce ) {
			$request->set_header( 'X-WP-Nonce', true === $nonce ? wp_create_nonce( 'wp_rest' ) : $nonce );
		}
		if ( 'POST' === $method ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
		} else {
			$request->set_query_params( $params );
		}

		return rest_get_server()->dispatch( $request );
	}

	// ---- a job makes the audio --------------------------------------------------

	public function test_the_first_play_starts_one_job_with_the_text_the_player_reads() {
		$this->service_takes_the_job();

		$answer = First_Play::start( $this->post, self::TEXT );

		$this->assertSame(
			array(
				'state'   => 'making',
				'url'     => '',
				'part'    => 3,
				'parts'   => 8,
				'wait_ms' => First_Play::WAIT_MS,
				'code'    => '',
			),
			$answer
		);
		$posted = $this->requests_to( '/v1/jobs', 'POST' );
		$this->assertCount( 1, $posted );
		$this->assertSame( self::TEXT, $posted[0]['body']['text'], 'What is read does not change with the way it is made.' );
		$this->assertSame( 'en', $posted[0]['body']['lang'] );
	}

	public function test_a_job_that_waits_for_its_turn_has_no_part_yet() {
		$this->service_takes_the_job( 'queued' );
		$this->answers['POST /v1/jobs'][0][1]['job']['parts_total'] = 0;
		$this->answers['POST /v1/jobs'][0][1]['job']['parts_done']  = 0;

		$answer = First_Play::start( $this->post, self::TEXT );

		$this->assertSame( array( 'making', 0, 0 ), array( $answer['state'], $answer['part'], $answer['parts'] ) );
	}

	public function test_a_second_visitor_joins_the_same_job_and_nothing_more_is_sent() {
		$this->service_takes_the_job();
		First_Play::start( $this->post, self::TEXT );

		$second = First_Play::start( $this->post, 'Another visitor, whose page gave slightly other words.' );

		$this->assertSame( 'making', $second['state'] );
		$this->assertCount( 1, $this->requests_to( '/v1/jobs', 'POST' ), 'One job, one bill.' );
	}

	public function test_following_asks_the_service_and_says_which_part_is_being_made() {
		$this->service_takes_the_job();
		First_Play::start( $this->post, self::TEXT );
		$this->time_passes();
		$this->service_says( $this->job( 'running', array( 'parts_done' => 5 ) ) );

		$answer = First_Play::status( $this->post );

		$this->assertSame( array( 'making', 6, 8 ), array( $answer['state'], $answer['part'], $answer['parts'] ) );
	}

	public function test_many_visitors_who_wait_ask_the_service_once_in_a_moment() {
		$this->service_takes_the_job();
		First_Play::start( $this->post, self::TEXT );

		// The job was started a moment ago: nobody asks yet.
		First_Play::status( $this->post );
		First_Play::status( $this->post );
		$this->assertCount( 0, $this->requests_to( '/v1/jobs/' . self::JOB ) );

		$this->time_passes();
		$this->service_says( $this->job( 'running', array( 'parts_done' => 4 ) ) );
		First_Play::status( $this->post );
		First_Play::status( $this->post );
		First_Play::status( $this->post );

		$this->assertCount( 1, $this->requests_to( '/v1/jobs/' . self::JOB ) );
	}

	public function test_while_one_visitors_question_is_on_its_way_the_others_do_not_ask() {
		$this->service_takes_the_job();
		First_Play::start( $this->post, self::TEXT );
		$this->time_passes();
		set_transient( 'atlasvoice_first_play_' . $this->post, 1, 60 );

		$answer = First_Play::status( $this->post );

		$this->assertSame( 'making', $answer['state'] );
		$this->assertCount( 0, $this->requests_to( '/v1/jobs/' . self::JOB ) );
	}

	public function test_a_finished_job_becomes_the_posts_audio_and_is_played() {
		$this->service_takes_the_job();
		First_Play::start( $this->post, self::TEXT );
		$this->time_passes();
		$this->service_finished_the_job();

		$answer = First_Play::status( $this->post );

		$this->assertSame( 'ready', $answer['state'] );
		$this->assertStringContainsString( '/jobs/post-' . $this->post . '-en-', $answer['url'] );
		$this->assertStringContainsString( '.mp3', $answer['url'] );
		// The same place every MP3 of the natural voice is recorded.
		$this->assertSame( $answer['url'], TTA_Helper::atlasvoice_stored_audio_url( $this->post, TTA_Helper::tts_get_file_url_key( 'en' ) ) );
		$this->assertNotEmpty( get_post_meta( $this->post, 'tts_mp3_file_urls', true ) );
		$this->assertFalse( get_transient( 'atlasvoice_first_play_' . $this->post ), 'The next visitor is not held off.' );
	}

	// ---- existing audio is never made again ---------------------------------------

	public function test_a_post_that_has_audio_plays_it_and_nothing_is_sent() {
		TTA_Helper::atlasvoice_store_audio_url( $this->post, TTA_Helper::tts_get_file_url_key( 'en' ), 'https://example.org/wp-content/uploads/TTA/gtts/2026/11/01/the-old-mill.mp3' );
		$meta = get_post_meta( $this->post, 'tts_mp3_file_urls', true );

		$start  = First_Play::start( $this->post, self::TEXT );
		$status = First_Play::status( $this->post );

		$this->assertSame( array( 'ready', 'https://example.org/wp-content/uploads/TTA/gtts/2026/11/01/the-old-mill.mp3' ), array( $start['state'], $start['url'] ) );
		$this->assertSame( $start, $status );
		$this->assertSame( array(), $this->sent );
		$this->assertSame( $meta, get_post_meta( $this->post, 'tts_mp3_file_urls', true ), 'The stored audio is left exactly as it was.' );
		$this->assertSame( '', (string) get_post_meta( $this->post, Jobs::META, true ) );
	}

	// ---- the usual way stays the fallback -------------------------------------------

	/**
	 * @dataProvider services_that_cannot_run_a_job
	 */
	public function test_a_service_that_cannot_run_the_job_gets_the_usual_way( $answer, $code ) {
		if ( null !== $answer ) {
			$this->answers['POST /v1/jobs'][] = $answer;
		}

		$result = First_Play::start( $this->post, self::TEXT );

		$this->assertSame( array( 'fallback', $code ), array( $result['state'], $result['code'] ) );
		$this->assertSame( '', (string) get_post_meta( $this->post, Jobs::META, true ), 'No job is recorded.' );
	}

	public function services_that_cannot_run_a_job() {
		return array(
			'a service from before jobs'    => array( array( 404, array( 'error' => array( 'code' => 'not_found' ) ) ), 'jobs_unavailable' ),
			'a service that is down'        => array( array( 503, array( 'error' => array( 'code' => 'service_unavailable' ) ) ), 'service_unavailable' ),
			'a queue that is full'          => array( array( 503, array( 'error' => array( 'code' => 'queue_full' ) ) ), 'queue_full' ),
			'a broken service'              => array( array( 500, array( 'error' => array( 'code' => 'internal_error' ) ) ), 'internal_error' ),
			'an engine it has no jobs for'  => array( array( 400, array( 'error' => array( 'code' => 'unknown_engine' ) ) ), 'unknown_engine' ),
			'a service that is unreachable' => array( null, 'service_unreachable' ),
		);
	}

	public function test_a_text_too_long_for_one_job_is_made_the_usual_way() {
		$result = First_Play::start( $this->post, str_repeat( 'a', First_Play::MAX_CHARS + 1 ) );

		$this->assertSame( array( 'fallback', 'text_too_long' ), array( $result['state'], $result['code'] ) );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_text_of_exactly_the_limit_is_a_job() {
		$this->service_takes_the_job();

		$this->assertSame( 'making', First_Play::start( $this->post, str_repeat( 'a', First_Play::MAX_CHARS ) )['state'] );
	}

	public function test_a_page_in_another_language_than_the_sites_is_made_the_usual_way() {
		$result = First_Play::start( $this->post, self::TEXT, 'fr' );

		$this->assertSame( array( 'fallback', 'other_language' ), array( $result['state'], $result['code'] ) );
		$this->assertSame( array(), $this->sent );
		$this->assertSame( 'other_language', First_Play::status( $this->post, 'fr' )['code'] );
	}

	public function test_the_sites_own_key_is_a_job_whatever_its_case() {
		$this->service_takes_the_job();

		$this->assertSame( 'making', First_Play::start( $this->post, self::TEXT, strtoupper( TTA_Helper::tts_get_file_url_key( 'en' ) ) )['state'] );
	}

	public function test_a_voice_jobs_are_not_for_keeps_the_usual_way() {
		$this->use_player( 1 );

		$result = First_Play::start( $this->post, self::TEXT );

		$this->assertSame( array( 'fallback', 'no_jobs_for_this_voice' ), array( $result['state'], $result['code'] ) );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_site_that_is_not_connected_keeps_the_usual_way() {
		delete_option( Service::OPTION );
		Cloud::reset();

		$this->assertSame( 'fallback', First_Play::start( $this->post, self::TEXT )['state'] );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_job_that_failed_on_the_services_side_gets_the_usual_way() {
		$this->service_takes_the_job();
		First_Play::start( $this->post, self::TEXT );
		$this->time_passes();
		$this->service_says( $this->job( 'failed', array( 'error' => array( 'code' => 'engine_failed' ) ) ) );

		$result = First_Play::status( $this->post );

		$this->assertSame( 'fallback', $result['state'] );
	}

	public function test_following_a_post_without_a_job_says_to_start_one() {
		$this->assertSame( array( 'fallback', 'no_job' ), array( First_Play::status( $this->post )['state'], First_Play::status( $this->post )['code'] ) );
	}

	// ---- what the usual way would be refused too is a failure ------------------------

	/**
	 * @dataProvider refusals_the_usual_way_would_get_too
	 */
	public function test_a_refusal_the_usual_way_would_get_too_is_a_failure( $status, $code ) {
		$this->answers['POST /v1/jobs'][] = array( $status, array( 'error' => array( 'code' => $code ) ) );

		$result = First_Play::start( $this->post, self::TEXT );

		$this->assertSame( array( 'failed', $code ), array( $result['state'], $result['code'] ) );
	}

	public function refusals_the_usual_way_would_get_too() {
		return array(
			'the allowance is used up'  => array( 429, 'quota_exceeded' ),
			'the daily limit'           => array( 429, 'daily_cap_reached' ),
			'the site is not approved'  => array( 403, 'approval_required' ),
			'the plan lacks the engine' => array( 403, 'engine_not_in_plan' ),
			'the key was revoked'       => array( 401, 'invalid_api_key' ),
			'too many jobs at once'     => array( 429, 'too_many_jobs' ),
		);
	}

	public function test_a_post_switched_off_by_its_editor_gets_no_job() {
		update_post_meta( $this->post, Jobs::OFF_META, '1' );

		$result = First_Play::start( $this->post, self::TEXT );

		$this->assertSame( array( 'failed', 'audio_off_for_post' ), array( $result['state'], $result['code'] ) );
		$this->assertSame( array(), $this->sent );
	}

	public function test_no_text_is_no_job() {
		$this->assertSame( array( 'failed', 'empty' ), array( First_Play::start( $this->post, "  \n " )['state'], First_Play::start( $this->post, array( 'x' ) )['code'] ) );
		$this->assertSame( array(), $this->sent );
	}

	/**
	 * @dataProvider posts_a_visitor_gets_no_audio_for
	 */
	public function test_a_post_a_visitor_cannot_read_gets_no_job( array $changes ) {
		wp_update_post( array( 'ID' => $this->post ) + $changes );

		$this->assertSame( array( 'failed', 'post_not_available' ), array( First_Play::start( $this->post, self::TEXT )['state'], First_Play::status( $this->post )['code'] ) );
		$this->assertSame( array(), $this->sent );
	}

	public function posts_a_visitor_gets_no_audio_for() {
		return array(
			'a draft'                => array( array( 'post_status' => 'draft' ) ),
			'a private post'         => array( array( 'post_status' => 'private' ) ),
			'a post with a password' => array( array( 'post_password' => 'secret' ) ),
		);
	}

	public function test_a_post_that_does_not_exist_gets_no_job() {
		$this->assertSame( 'post_not_available', First_Play::start( 999999, self::TEXT )['code'] );
	}

	public function test_an_editor_can_hear_their_own_draft() {
		wp_update_post(
			array(
				'ID'          => $this->post,
				'post_status' => 'draft',
			)
		);
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->service_takes_the_job();

		$this->assertSame( 'making', First_Play::start( $this->post, self::TEXT )['state'] );
	}

	// ---- an extension has its say ---------------------------------------------------

	public function test_an_extension_can_refuse_a_text_that_is_not_the_posts() {
		add_filter(
			'atlasvoice_first_play_text',
			static function () {
				return new WP_Error( 'text_not_from_post', 'Not this post.' );
			}
		);

		$result = First_Play::start( $this->post, self::TEXT );

		$this->assertSame( array( 'failed', 'text_not_from_post' ), array( $result['state'], $result['code'] ) );
		$this->assertSame( array(), $this->sent );
	}

	public function test_an_extensions_file_key_is_the_one_a_page_must_name() {
		add_filter(
			'atlasvoice_cloud_job_file_key',
			static function () {
				return 'en-us--voice--emily';
			}
		);
		$this->service_takes_the_job();

		$this->assertSame( 'other_language', First_Play::start( $this->post, self::TEXT, TTA_Helper::tts_get_file_url_key( 'en' ) )['code'] );
		$this->assertSame( 'making', First_Play::start( $this->post, self::TEXT, 'en-US--voice--emily' )['state'] );
	}

	// ---- the route --------------------------------------------------------------------

	public function test_a_visitor_with_the_pages_nonce_starts_and_follows_the_job() {
		$this->service_takes_the_job();

		$started = $this->rest(
			'POST',
			array(
				'post_id' => $this->post,
				'content' => self::TEXT,
			)
		);

		$this->assertSame( 200, $started->get_status() );
		$this->assertSame( 'making', $started->get_data()['state'] );

		$followed = $this->rest( 'GET', array( 'post_id' => $this->post ) );

		$this->assertSame( 200, $followed->get_status() );
		$this->assertSame( array( 'state', 'url', 'part', 'parts', 'wait_ms', 'code' ), array_keys( $followed->get_data() ) );
	}

	public function test_without_the_pages_nonce_nothing_is_started_or_told() {
		foreach ( array( false, 'not-a-nonce' ) as $nonce ) {
			$this->assertSame(
				403,
				$this->rest(
					'POST',
					array(
						'post_id' => $this->post,
						'content' => self::TEXT,
					),
					$nonce
				)->get_status()
			);
			$this->assertSame( 403, $this->rest( 'GET', array( 'post_id' => $this->post ), $nonce )->get_status() );
		}
		$this->assertSame( array(), $this->sent );
	}

	public function test_the_route_needs_a_post_and_a_text() {
		$this->assertSame( 400, $this->rest( 'POST', array( 'content' => self::TEXT ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'post_id' => $this->post ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'GET', array() )->get_status() );
	}

	public function test_each_method_and_each_argument_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/audio/first-play'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
			foreach ( $route['args'] as $name => $arg ) {
				$this->assertNotEmpty( $arg['description'], $name );
			}
		}
		$this->assertArrayHasKey( 'content', $routes[1]['args'] );
	}

	public function test_the_answer_never_holds_the_key_or_the_job_id() {
		$this->service_takes_the_job();

		$json = wp_json_encode(
			$this->rest(
				'POST',
				array(
					'post_id' => $this->post,
					'content' => self::TEXT,
				)
			)->get_data()
		);

		$this->assertStringNotContainsString( self::KEY, $json );
		$this->assertStringNotContainsString( self::JOB, $json );
	}
}
