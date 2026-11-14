<?php
/**
 * Tests for a post's audio job on AtlasVoice Cloud: the runner, its REST
 * routes and `wp atlasvoice job` (TTS-378, service contract TTS-380).
 *
 * The service is never called: every HTTP request is answered here.
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Job_Command;
use TTA\Cloud\Cloud;
use TTA\Cloud\Jobs;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Cloud\Jobs
 * @covers \TTA_Api\Cloud_Jobs_Controller
 * @covers \TTA\CLI\Job_Command
 */
class JobsTest extends WP_UnitTestCase {

	const KEY  = 'av_live_secret_key_value_0123456789';
	const JOB  = '0b9d3c1e-7a52-4f0c-9d1e-2f6a8b7c5d41';
	const FILE = 'https://api.atlasvoice.cloud/files/avj-0123456789abcdef0123456789abcdef.mp3';
	const MP3  = "ID3\x03\x00\x00\x00\x00\x00\x00fake-mp3-bytes-for-the-test";

	/**
	 * Requests WordPress was asked to send.
	 *
	 * @var array[]
	 */
	private $sent = array();

	/**
	 * Answers by route: a list per "METHOD path-fragment".
	 *
	 * @var array<string, array[]>
	 */
	private $answers = array();

	/**
	 * @var int
	 */
	private $post;

	/**
	 * The job files that were on the site before a test: they are not ours to delete.
	 *
	 * @var string[]
	 */
	private $files_before = array();

	public function set_up() {
		parent::set_up();
		$this->files_before = (array) glob( Service::audio_dir() . 'jobs/post-*.mp3' );
		WP_CLI::reset();
		Cloud::reset();
		delete_transient( Jobs::HOSTS_CACHE );
		foreach ( array( 'tta_settings_data', 'tta_listening_settings' ) as $option ) {
			delete_option( $option );
		}
		\TTA\TTA_Cache::flush();
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => self::KEY,
			),
			false
		);
		update_option( 'tta_listening_settings', array( 'tta__listening_lang' => 'en' ) );
		$this->post    = self::factory()->post->create(
			array(
				'post_title'   => 'The old mill',
				'post_content' => '<p>The mill stands by the <b>river</b>.</p>',
			)
		);
		$this->sent    = array();
		$this->answers = array();
		add_filter( 'pre_http_request', array( $this, 'intercept' ), 10, 3 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'intercept' ), 10 );
		remove_all_actions( 'atlasvoice_cloud_job_done' );
		remove_all_filters( 'atlasvoice_cloud_file_hosts' );
		// The tests write into the uploads folder of the site they run on, so only
		// the files a test made are removed: a site's real audio is never touched
		// (a run on 2026-11-14 deleted the file of a real job).
		foreach ( array_diff( (array) glob( Service::audio_dir() . 'jobs/post-*.mp3' ), $this->files_before ) as $file ) {
			wp_delete_file( $file );
		}
		parent::tear_down();
	}

	public function intercept( $pre, $args, $url ) {
		$this->sent[] = array(
			'url'         => $url,
			'method'      => $args['method'],
			'headers'     => (array) $args['headers'],
			'body'        => isset( $args['body'] ) ? json_decode( (string) $args['body'], true ) : null,
			'redirection' => isset( $args['redirection'] ) ? $args['redirection'] : null,
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
						array_merge( array( 'Content-Type' => is_string( $answer[1] ) ? 'audio/mpeg' : 'application/json' ), isset( $answer[2] ) ? $answer[2] : array() )
					),
					'body'     => is_string( $answer[1] ) ? $answer[1] : wp_json_encode( $answer[1] ),
					'cookies'  => array(),
				);
			}
		}

		return new WP_Error( 'http_request_failed', 'Could not resolve host.' );
	}

	private function job( $status = 'queued', array $more = array() ) {
		return array_merge(
			array(
				'id'           => self::JOB,
				'status'       => $status,
				'parts_total'  => 3,
				'parts_done'   => 'done' === $status ? 3 : 1,
				'chars'        => 2400,
				'billed_chars' => 'done' === $status ? 2400 : 800,
				'error'        => null,
				'file'         => null,
				'file_expired' => false,
			),
			$more
		);
	}

	private function file( array $more = array() ) {
		return array_merge(
			array(
				'url'    => self::FILE,
				'bytes'  => strlen( self::MP3 ),
				'sha256' => hash( 'sha256', self::MP3 ),
			),
			$more
		);
	}

	private function service_takes_the_job() {
		$this->answers['POST /v1/jobs'][] = array(
			202,
			array(
				'job'           => $this->job(),
				'poll_after_ms' => 3200,
			),
		);
	}

	private function service_finished_the_job( array $file = array() ) {
		$this->answers[ 'GET /v1/jobs/' . self::JOB ][] = array(
			200,
			array(
				'job'           => $this->job( 'done', array( 'file' => $this->file( $file ) ) ),
				'poll_after_ms' => null,
			),
		);
		$this->answers['GET /v1/health'][]              = array( 200, array( 'file_hosts' => array( 'api.atlasvoice.cloud' ) ) );
	}

	private function requests_to( $fragment ) {
		return array_values(
			array_filter(
				$this->sent,
				static function ( $request ) use ( $fragment ) {
					return false !== strpos( $request['url'], $fragment );
				}
			)
		);
	}

	private function next_poll() {
		return wp_next_scheduled( Jobs::HOOK, array( $this->post, 'en' ) );
	}

	private function rest( $method, array $params ) {
		$request = new WP_REST_Request( $method, '/tta/v1/cloud/jobs' );
		if ( 'POST' === $method ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
		} else {
			$request->set_query_params( $params );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Starting a job.

	public function test_a_job_sends_the_whole_text_once_with_a_reference_and_a_key() {
		$this->service_takes_the_job();

		$record = Jobs::start( $this->post );

		$this->assertCount( 1, $this->sent );
		$sent = $this->sent[0];
		$this->assertSame( 'POST', $sent['method'] );
		$this->assertStringEndsWith( '/v1/jobs', $sent['url'] );
		$this->assertSame( 'en', $sent['body']['lang'] );
		$this->assertSame( 'post:' . $this->post . ':en', $sent['body']['ref'] );
		$this->assertStringContainsString( 'The old mill', $sent['body']['text'] );
		$this->assertStringContainsString( 'The mill stands by the river.', $sent['body']['text'] );
		$this->assertStringNotContainsString( '<', $sent['body']['text'] );
		$this->assertStringStartsWith( 'post:' . $this->post . ':en:', $sent['headers']['Idempotency-Key'] );

		$this->assertSame( self::JOB, $record['id'] );
		$this->assertSame( 'queued', $record['status'] );
		$this->assertSame( 2400, $record['chars'] );
	}

	public function test_the_next_check_is_planned_in_wp_cron_after_the_wait_the_service_gave() {
		$this->service_takes_the_job();

		Jobs::start( $this->post );

		$when = $this->next_poll();
		$this->assertNotFalse( $when );
		// 3,200 ms is rounded up to 4 seconds.
		$this->assertEqualsWithDelta( time() + 4, $when, 2 );
	}

	public function test_asking_twice_for_the_same_text_sends_the_same_key() {
		$this->service_takes_the_job();
		$this->service_takes_the_job();

		Jobs::start( $this->post );
		Jobs::start( $this->post );

		$this->assertSame( $this->sent[0]['headers']['Idempotency-Key'], $this->sent[1]['headers']['Idempotency-Key'] );
	}

	public function test_a_changed_text_sends_another_key() {
		$this->service_takes_the_job();
		$this->service_takes_the_job();

		Jobs::start( $this->post );
		wp_update_post(
			array(
				'ID'           => $this->post,
				'post_content' => 'The mill was restored last year.',
			)
		);
		Jobs::start( $this->post );

		$this->assertNotSame( $this->sent[0]['headers']['Idempotency-Key'], $this->sent[1]['headers']['Idempotency-Key'] );
	}

	public function test_each_language_of_a_post_has_its_own_job() {
		$this->service_takes_the_job();
		$this->service_takes_the_job();

		Jobs::start( $this->post, 'en' );
		Jobs::start( $this->post, 'fr' );

		$this->assertSame( 'post:' . $this->post . ':fr', $this->sent[1]['body']['ref'] );
		$this->assertNotNull( Jobs::status( $this->post, 'en' ) );
		$this->assertNotNull( Jobs::status( $this->post, 'fr' ) );
	}

	public function test_a_job_names_no_engine_or_voice_unless_an_extension_does() {
		$this->service_takes_the_job();

		Jobs::start( $this->post );
		$sent = $this->requests_to( '/v1/jobs' )[0]['body'];

		// The SDK's own default, as before this option existed.
		$this->assertSame( 'gtts', $sent['engine'] );
		$this->assertNull( $sent['voice'] );
		$this->assertSame( 'post:' . $this->post . ':en', $sent['ref'] );
	}

	public function test_an_extension_can_name_the_engine_and_the_voice() {
		$this->service_takes_the_job();
		add_filter(
			'atlasvoice_cloud_job_options',
			static function ( $options, $post_id, $language ) {
				return array(
					'engine' => 'cloud',
					'voice'  => 'supertonic-' . $language . '-F1',
				);
			},
			10,
			3
		);

		Jobs::start( $this->post );
		remove_all_filters( 'atlasvoice_cloud_job_options' );
		$request = $this->requests_to( '/v1/jobs' )[0];
		$sent    = $request['body'];

		$this->assertSame( 'cloud', $sent['engine'] );
		$this->assertSame( 'supertonic-en-F1', $sent['voice'] );
		$this->assertSame( 'post:' . $this->post . ':en:cloud:supertonic-en-F1', $sent['ref'] );
	}

	public function test_another_voice_is_another_job_never_a_replay() {
		$keys = array();
		foreach ( array( 'supertonic-en-F1', 'supertonic-en-M2' ) as $voice ) {
			$this->service_takes_the_job();
			add_filter(
				'atlasvoice_cloud_job_options',
				static function () use ( $voice ) {
					return array(
						'engine' => 'cloud',
						'voice'  => $voice,
					);
				}
			);
			Jobs::start( $this->post );
			remove_all_filters( 'atlasvoice_cloud_job_options' );
			$requests = $this->requests_to( '/v1/jobs' );
			$keys[]   = end( $requests )['headers']['Idempotency-Key'];
		}

		$this->assertNotSame( $keys[0], $keys[1] );
	}

	/**
	 * @dataProvider options_that_are_not_sent
	 */
	public function test_an_engine_or_voice_the_service_cannot_take_is_left_out( $options ) {
		$this->service_takes_the_job();
		add_filter(
			'atlasvoice_cloud_job_options',
			static function () use ( $options ) {
				return $options;
			}
		);

		Jobs::start( $this->post );
		remove_all_filters( 'atlasvoice_cloud_job_options' );
		$sent = $this->requests_to( '/v1/jobs' )[0]['body'];

		$this->assertSame( 'gtts', $sent['engine'] );
		$this->assertNull( $sent['voice'] );
		$this->assertSame( 'post:' . $this->post . ':en', $sent['ref'] );
	}

	public function options_that_are_not_sent() {
		return array(
			'not a list'                 => array( 'cloud' ),
			'an engine with a space'     => array(
				array(
					'engine' => 'my engine',
					'voice'  => 'v1',
				),
			),
			'an engine that is not text' => array( array( 'engine' => array( 'cloud' ) ) ),
			'a voice without an engine'  => array( array( 'voice' => 'supertonic-en-F1' ) ),
		);
	}

	public function test_a_voice_with_markup_is_left_out_but_the_engine_is_kept() {
		$this->service_takes_the_job();
		add_filter(
			'atlasvoice_cloud_job_options',
			static function () {
				return array(
					'engine' => 'cloud',
					'voice'  => '<script>',
				);
			}
		);

		Jobs::start( $this->post );
		remove_all_filters( 'atlasvoice_cloud_job_options' );
		$sent = $this->requests_to( '/v1/jobs' )[0]['body'];

		$this->assertSame( 'cloud', $sent['engine'] );
		$this->assertNull( $sent['voice'] );
	}

	public function test_an_engine_can_ask_for_a_fuller_language_code_and_the_job_keeps_the_sites() {
		$this->service_takes_the_job();
		add_filter(
			'atlasvoice_cloud_job_options',
			static function () {
				return array(
					'engine' => 'cloud',
					'voice'  => 'bf_emma',
					'lang'   => 'en-GB',
				);
			}
		);

		$record = Jobs::start( $this->post );
		remove_all_filters( 'atlasvoice_cloud_job_options' );
		$sent = $this->requests_to( '/v1/jobs' )[0]['body'];

		$this->assertSame( 'en-GB', $sent['lang'] );
		// The reference and the record stay under the site's language.
		$this->assertSame( 'post:' . $this->post . ':en:cloud:bf_emma', $sent['ref'] );
		$this->assertSame( $record['id'], Jobs::status( $this->post, 'en' )['id'] );
		$this->assertNull( Jobs::status( $this->post, 'en-GB' ) );
	}

	/**
	 * @dataProvider languages_that_are_not_sent
	 */
	public function test_a_language_that_is_not_a_code_or_has_no_engine_is_not_sent( array $options ) {
		$this->service_takes_the_job();
		add_filter(
			'atlasvoice_cloud_job_options',
			static function () use ( $options ) {
				return $options;
			}
		);

		Jobs::start( $this->post );
		remove_all_filters( 'atlasvoice_cloud_job_options' );

		$this->assertSame( 'en', $this->requests_to( '/v1/jobs' )[0]['body']['lang'] );
	}

	public function languages_that_are_not_sent() {
		return array(
			'markup'            => array(
				array(
					'engine' => 'cloud',
					'lang'   => '<b>en</b>',
				),
			),
			'not text'          => array(
				array(
					'engine' => 'cloud',
					'lang'   => array( 'en-GB' ),
				),
			),
			'without an engine' => array( array( 'lang' => 'en-GB' ) ),
		);
	}

	public function test_a_job_that_is_already_being_made_is_said_in_words() {
		$this->answers['POST /v1/jobs'][] = array( 409, array( 'error' => array( 'code' => 'idempotency_conflict' ) ) );

		$result = Jobs::start( $this->post );

		$this->assertSame( 'idempotency_conflict', $result->get_error_code() );
		$this->assertStringContainsString( 'already being made', $result->get_error_message() );
	}

	public function test_a_site_that_is_not_connected_sends_nothing() {
		delete_option( Service::OPTION );

		$result = Jobs::start( $this->post );

		$this->assertWPError( $result );
		$this->assertSame( 'not_connected', $result->get_error_code() );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_post_without_text_sends_nothing() {
		update_option( 'tta_settings_data', array( 'tta__settings_add_post_title_to_read' => false ) );
		\TTA\TTA_Cache::flush();
		$empty = self::factory()->post->create( array( 'post_content' => '<p> </p>' ) );

		$result = Jobs::start( $empty );

		$this->assertWPError( $result );
		$this->assertSame( 'nothing_to_speak', $result->get_error_code() );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_post_that_does_not_exist_is_refused() {
		$result = Jobs::start( 999999 );

		$this->assertWPError( $result );
		$this->assertSame( 404, $result->get_error_data()['status'] );
	}

	public function test_a_language_that_is_not_a_code_never_reaches_a_reference_or_a_file_name() {
		$this->service_takes_the_job();

		Jobs::start( $this->post, '../../wp-config' );

		$this->assertSame( 'post:' . $this->post . ':en', $this->sent[0]['body']['ref'] );
	}

	// When the service refuses.

	public function test_an_older_service_without_jobs_tells_the_caller_to_use_the_usual_way() {
		$this->answers['POST /v1/jobs'][] = array( 404, array( 'error' => array( 'code' => 'not_found' ) ) );

		$result = Jobs::start( $this->post );

		$this->assertWPError( $result );
		$this->assertSame( 'jobs_unavailable', $result->get_error_code() );
		$this->assertNull( Jobs::status( $this->post ) );
		$this->assertFalse( $this->next_poll() );
	}

	public function test_too_many_jobs_says_how_long_to_wait() {
		$this->answers['POST /v1/jobs'][] = array( 429, array( 'error' => array( 'code' => 'too_many_jobs' ) ), array( 'Retry-After' => '30' ) );

		$result = Jobs::start( $this->post );

		$this->assertSame( 'too_many_jobs', $result->get_error_code() );
		$this->assertSame( 429, $result->get_error_data()['status'] );
		$this->assertSame( 30, $result->get_error_data()['retry_after'] );
	}

	public function test_an_allowance_that_is_too_small_is_said_in_words() {
		$this->answers['POST /v1/jobs'][] = array( 429, array( 'error' => array( 'code' => 'quota_exceeded' ) ) );

		$result = Jobs::start( $this->post );

		$this->assertSame( 'quota_exceeded', $result->get_error_code() );
		$this->assertStringContainsString( 'characters', $result->get_error_message() );
	}

	public function test_a_service_that_cannot_be_reached_is_a_503() {
		$result = Jobs::start( $this->post );

		$this->assertSame( 'service_unreachable', $result->get_error_code() );
		$this->assertSame( 503, $result->get_error_data()['status'] );
	}

	// Polling.

	public function test_a_running_job_is_recorded_and_checked_again_later() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->answers[ 'GET /v1/jobs/' . self::JOB ][] = array(
			200,
			array(
				'job'           => $this->job( 'running', array( 'parts_done' => 2 ) ),
				'poll_after_ms' => 2000,
			),
		);

		Jobs::poll( $this->post, 'en' );

		$record = Jobs::status( $this->post );
		$this->assertSame( 'running', $record['status'] );
		$this->assertSame( 2, $record['parts_done'] );
		$this->assertNotFalse( $this->next_poll() );
	}

	public function test_a_finished_job_is_downloaded_checked_and_stored() {
		$done = array();
		add_action(
			'atlasvoice_cloud_job_done',
			static function ( $post_id, $language, $url ) use ( &$done ) {
				$done[] = compact( 'post_id', 'language', 'url' );
			},
			10,
			3
		);
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job();
		$this->answers['GET /files/'][] = array( 200, self::MP3 );

		Jobs::poll( $this->post, 'en' );

		$record = Jobs::status( $this->post );
		$this->assertSame( 'done', $record['status'] );
		$this->assertSame( '', $record['error'] );
		$this->assertFileExists( $record['file_path'] );
		$this->assertSame( self::MP3, file_get_contents( $record['file_path'] ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file this test wrote.
		$this->assertStringStartsWith( Service::audio_dir_url() . 'jobs/post-' . $this->post . '-en-', $record['file_url'] );
		$this->assertStringEndsWith( '.mp3', $record['file_url'] );
		$this->assertFalse( $this->next_poll(), 'A finished job is not checked again.' );
		$this->assertSame(
			array(
				array(
					'post_id'  => $this->post,
					'language' => 'en',
					'url'      => $record['file_url'],
				),
			),
			$done
		);
	}

	public function test_the_file_is_fetched_without_the_key_and_without_following_a_redirect() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job();
		$this->answers['GET /files/'][] = array( 200, self::MP3 );

		Jobs::poll( $this->post, 'en' );

		$download = $this->requests_to( '/files/' )[0];
		$this->assertSame( self::FILE, $download['url'] );
		$this->assertArrayNotHasKey( 'Authorization', $download['headers'] );
		$this->assertSame( 0, $download['redirection'] );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( $download ) );
	}

	/**
	 * @dataProvider wrong_files
	 */
	public function test_a_file_that_is_not_the_announced_one_is_never_stored( array $file, $bytes, $error ) {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job( $file );
		$this->answers['GET /files/'][] = array( 200, $bytes );

		Jobs::poll( $this->post, 'en' );

		$record = Jobs::status( $this->post );
		$this->assertSame( 'failed', $record['status'] );
		$this->assertSame( $error, $record['error'] );
		$this->assertSame( '', $record['file_url'] );
		$this->assertSame( array(), (array) glob( Service::audio_dir() . 'jobs/post-' . $this->post . '-*.mp3' ) );
	}

	public function wrong_files() {
		return array(
			'other bytes than the checksum' => array( array(), 'something else entirely', 'file_corrupt' ),
			'a shorter file'                => array( array( 'bytes' => 9999 ), self::MP3, 'file_corrupt' ),
			'no checksum announced'         => array( array( 'sha256' => '' ), self::MP3, 'file_unverified' ),
			'a checksum that is not one'    => array( array( 'sha256' => 'abc' ), self::MP3, 'file_unverified' ),
		);
	}

	public function test_a_file_on_another_host_is_never_requested() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job( array( 'url' => 'https://evil.example/files/a.mp3' ) );

		Jobs::poll( $this->post, 'en' );

		$this->assertSame( array(), $this->requests_to( 'evil.example' ) );
		$this->assertSame( 'downloading', Jobs::status( $this->post )['status'] );
	}

	public function test_a_download_that_keeps_failing_is_given_up_after_five_tries() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );

		for ( $try = 0; $try < Jobs::DOWNLOAD_TRIES; $try++ ) {
			$this->service_finished_the_job();
			Jobs::poll( $this->post, 'en' );
		}

		$record = Jobs::status( $this->post );
		$this->assertSame( 'failed', $record['status'] );
		$this->assertSame( 'download_failed', $record['error'] );
	}

	public function test_a_file_the_service_no_longer_keeps_says_so() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->answers[ 'GET /v1/jobs/' . self::JOB ][] = array( 200, array( 'job' => $this->job( 'done', array( 'file_expired' => true ) ) ) );

		Jobs::poll( $this->post, 'en' );

		$this->assertSame( 'file_expired', Jobs::status( $this->post )['error'] );
	}

	public function test_a_job_that_failed_on_the_service_keeps_its_reason() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->answers[ 'GET /v1/jobs/' . self::JOB ][] = array( 200, array( 'job' => $this->job( 'failed', array( 'error' => array( 'code' => 'engine_failed' ) ) ) ) );

		Jobs::poll( $this->post, 'en' );

		$record = Jobs::status( $this->post );
		$this->assertSame( 'failed', $record['status'] );
		$this->assertSame( 'engine_failed', $record['error'] );
		$this->assertFalse( $this->next_poll() );
	}

	public function test_a_job_that_is_gone_is_not_asked_for_again() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->answers[ 'GET /v1/jobs/' . self::JOB ][] = array( 404, array( 'error' => array( 'code' => 'job_not_found' ) ) );

		Jobs::poll( $this->post, 'en' );

		$this->assertSame( 'job_not_found', Jobs::status( $this->post )['error'] );
		$this->assertFalse( $this->next_poll() );
	}

	public function test_a_service_that_is_down_is_asked_again_later_and_the_job_is_kept() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		wp_clear_scheduled_hook( Jobs::HOOK, array( $this->post, 'en' ) );

		Jobs::poll( $this->post, 'en' );

		$this->assertSame( 'queued', Jobs::status( $this->post )['status'] );
		$this->assertEqualsWithDelta( time() + 30, $this->next_poll(), 2 );
	}

	public function test_a_job_that_never_finishes_is_given_up() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$all                  = get_post_meta( $this->post, Jobs::META, true );
		$all['en']['created'] = time() - Jobs::GIVE_UP_AFTER - 60;
		update_post_meta( $this->post, Jobs::META, $all );
		$this->sent = array();

		Jobs::poll( $this->post, 'en' );

		$this->assertSame( 'timed_out', Jobs::status( $this->post )['error'] );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_finished_job_with_its_file_is_not_sent_again() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job();
		$this->answers['GET /files/'][] = array( 200, self::MP3 );
		Jobs::poll( $this->post, 'en' );
		$this->sent = array();

		$record = Jobs::start( $this->post );

		$this->assertSame( 'done', $record['status'] );
		$this->assertSame( array(), $this->sent, 'Audio that is already here costs no request and no characters.' );
	}

	public function test_a_poll_for_a_post_without_a_job_does_nothing() {
		Jobs::poll( $this->post, 'en' );

		$this->assertSame( array(), $this->sent );
	}

	// The file hosts.

	public function test_only_hosts_on_our_own_domain_are_kept_from_the_services_list() {
		$this->answers['GET /v1/health'][] = array(
			200,
			array( 'file_hosts' => array( 'api.atlasvoice.cloud', 'files.atlasvoice.cloud', 'evil.example', 'atlasvoice.cloud.evil.example', 'a b', 42 ) ),
		);

		$this->assertSame( array( 'api.atlasvoice.cloud', 'files.atlasvoice.cloud' ), Jobs::file_hosts() );
	}

	public function test_the_file_hosts_are_asked_for_once_and_kept() {
		$this->answers['GET /v1/health'][] = array( 200, array( 'file_hosts' => array( 'api.atlasvoice.cloud' ) ) );

		Jobs::file_hosts();
		Jobs::file_hosts();

		$this->assertCount( 1, $this->requests_to( '/v1/health' ) );
	}

	// Cancelling.

	public function test_cancelling_tells_the_service_and_stops_the_checks() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->answers[ 'DELETE /v1/jobs/' . self::JOB ][] = array( 200, array( 'job' => $this->job( 'canceled' ) ) );

		$record = Jobs::cancel( $this->post );

		$this->assertSame( 'canceled', $record['status'] );
		$this->assertSame( 'canceled', Jobs::status( $this->post )['status'] );
		$this->assertFalse( $this->next_poll() );
		$this->assertCount( 1, $this->requests_to( '/v1/jobs/' . self::JOB ) );
	}

	public function test_cancelling_a_post_without_a_job_is_a_404() {
		$result = Jobs::cancel( $this->post );

		$this->assertWPError( $result );
		$this->assertSame( 404, $result->get_error_data()['status'] );
	}

	public function test_a_cancel_the_service_could_not_take_leaves_the_job_as_it_is() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );

		$result = Jobs::cancel( $this->post );

		$this->assertWPError( $result );
		$this->assertSame( 'queued', Jobs::status( $this->post )['status'] );
	}

	// The REST routes.

	public function test_post_starts_the_job_and_hides_what_a_client_must_not_see() {
		$this->service_takes_the_job();

		$response = $this->rest( 'POST', array( 'post_id' => $this->post ) );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( self::JOB, $data['id'] );
		$this->assertArrayNotHasKey( 'file_path', $data );
		$this->assertArrayNotHasKey( 'key', $data );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( $data ) );
	}

	public function test_get_returns_the_job_or_a_404() {
		$this->assertSame( 404, $this->rest( 'GET', array( 'post_id' => $this->post ) )->get_status() );

		$this->service_takes_the_job();
		Jobs::start( $this->post );

		$response = $this->rest( 'GET', array( 'post_id' => $this->post ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'queued', $response->get_data()['status'] );
	}

	public function test_delete_cancels_the_job() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->answers[ 'DELETE /v1/jobs/' . self::JOB ][] = array( 200, array( 'job' => $this->job( 'canceled' ) ) );

		$response = $this->rest( 'DELETE', array( 'post_id' => $this->post ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'canceled', $response->get_data()['status'] );
	}

	public function test_the_route_passes_on_why_a_job_was_refused() {
		$this->answers['POST /v1/jobs'][] = array( 429, array( 'error' => array( 'code' => 'too_many_jobs' ) ), array( 'Retry-After' => '30' ) );

		$response = $this->rest( 'POST', array( 'post_id' => $this->post ) );

		$this->assertSame( 429, $response->get_status() );
		$this->assertSame( 'too_many_jobs', $response->get_data()['code'] );
		$this->assertSame( 30, $response->get_data()['data']['retry_after'] );
	}

	public function test_a_request_without_a_post_is_refused() {
		$this->assertSame( 400, $this->rest( 'POST', array() )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'post_id' => 0 ) )->get_status() );
		$this->assertSame( array(), $this->sent );
	}

	public function test_each_method_describes_itself_and_start_says_it_costs_characters() {
		$routes = rest_get_server()->get_routes()['/tta/v1/cloud/jobs'];

		$this->assertCount( 3, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
			$this->assertNotEmpty( $route['args']['post_id']['description'] );
			$this->assertNotEmpty( $route['args']['language']['description'] );
		}
		$this->assertStringContainsString( 'allowance', $routes[1]['description'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_use_the_routes( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		foreach ( array( 'GET', 'POST', 'DELETE' ) as $method ) {
			$this->assertContains( $this->rest( $method, array( 'post_id' => $this->post ) )->get_status(), array( 401, 403 ) );
		}
		$this->assertSame( array(), $this->sent );
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

		$this->assertSame( Job_Command::class, WP_CLI::$commands['atlasvoice job'] );
	}

	public function test_create_starts_the_job_and_says_how_to_follow_it() {
		$this->service_takes_the_job();

		( new Job_Command() )->create( array( (string) $this->post ), array() );

		$last = end( WP_CLI::$log );
		$this->assertSame( 'success', $last[0] );
		$this->assertStringContainsString( 'wp atlasvoice job status ' . $this->post, $last[1] );
	}

	public function test_create_says_why_a_job_was_not_started() {
		delete_option( Service::OPTION );

		try {
			( new Job_Command() )->create( array( (string) $this->post ), array() );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'Connect the natural voice first', WP_CLI::$log[0][1] );
	}

	public function test_status_can_ask_the_service_now_and_prints_the_file() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job();
		$this->answers['GET /files/'][] = array( 200, self::MP3 );

		( new Job_Command() )->status( array( (string) $this->post ), array( 'check' => true ) );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'status: done', $lines );
		$this->assertContains( 'parts: 3 of 3', $lines );
		$this->assertNotEmpty( preg_grep( '/^file: .*\.mp3$/', $lines ) );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( WP_CLI::$log ) );
	}

	public function test_status_says_when_there_is_no_job() {
		( new Job_Command() )->status( array( (string) $this->post ), array() );

		$this->assertSame( array( 'line', 'This post has no audio job.' ), end( WP_CLI::$log ) );
	}

	public function test_cancel_cancels() {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->answers[ 'DELETE /v1/jobs/' . self::JOB ][] = array( 200, array( 'job' => $this->job( 'canceled' ) ) );

		( new Job_Command() )->cancel( array( (string) $this->post ), array() );

		$this->assertSame( array( 'success', 'The job is canceled.' ), end( WP_CLI::$log ) );
	}

	// TTS-354: found with a real job against the service (2026-11-14).

	public function test_a_job_is_still_being_made_while_its_file_becomes_the_posts_audio() {
		$seen = array();
		add_action(
			'atlasvoice_cloud_job_done',
			function ( $post_id, $language, $url, $record ) use ( &$seen ) {
				$seen = array(
					'stored'  => Jobs::status( $post_id, $language )['status'],
					'given'   => $record['status'],
					'file'    => is_file( $record['file_path'] ),
					'planned' => false !== $this->next_poll(),
				);
			},
			10,
			4
		);
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job();
		$this->answers['GET /files/'][] = array( 200, self::MP3 );

		Jobs::poll( $this->post, 'en' );

		$this->assertSame(
			array(
				// A screen that reads the job now still shows "Making", never "No audio yet".
				'stored'  => 'downloading',
				'given'   => 'done',
				'file'    => true,
				// A check is planned in case what runs on the action never comes back.
				'planned' => true,
			),
			$seen
		);
		$this->assertSame( 'done', Jobs::status( $this->post )['status'] );
		$this->assertFalse( $this->next_poll() );
	}

	public function test_a_post_is_never_listed_without_audio_between_done_and_attached() {
		$listed = array();
		add_filter(
			'tts_get_player_id',
			static function () {
				return Service::PLAYER_ID;
			}
		);
		update_option( 'tta_settings_data', (object) array( 'tta__settings_allow_listening_for_post_types' => array( 'post' ) ) );
		\TTA\TTA_Cache::flush();
		// Runs late, after the file became the post's audio and before the record is "done".
		add_action(
			'atlasvoice_cloud_job_done',
			function ( $post_id ) use ( &$listed ) {
				$listed['before'] = wp_list_pluck( \TTA\Library\Posts::get()['posts'], 'status', 'id' )[ $post_id ];
			},
			5
		);
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job();
		$this->answers['GET /files/'][] = array( 200, self::MP3 );

		Jobs::poll( $this->post, 'en' );

		$listed['after'] = wp_list_pluck( \TTA\Library\Posts::get()['posts'], 'status', 'id' )[ $this->post ];
		remove_all_filters( 'tts_get_player_id' );
		delete_option( 'tta_settings_data' );
		\TTA\TTA_Cache::flush();

		$this->assertSame( 'making', $listed['before'] );
		$this->assertContains( $listed['after'], array( 'ready', 'missing' ) );
		$this->assertNotSame( 'making', $listed['after'] );
	}

	public function test_the_file_path_of_a_windows_server_keeps_its_backslashes() {
		$save = new ReflectionMethod( Jobs::class, 'save' );
		$save->setAccessible( true );
		$path = 'D:\\laragon\\www\\site/wp-content/uploads/TTA/gtts/jobs/post-1-en-abc.mp3';

		$save->invoke(
			null,
			$this->post,
			'en',
			array(
				'id'        => 'job-1',
				'status'    => 'done',
				'file_path' => $path,
				'file_url'  => 'https://example.org/a "quoted" name.mp3',
			)
		);

		$record = Jobs::status( $this->post );
		$this->assertSame( $path, $record['file_path'] );
		$this->assertSame( 'https://example.org/a "quoted" name.mp3', $record['file_url'] );
	}

	public function test_the_tests_never_delete_audio_that_was_on_the_site_before() {
		// The file is on the site before a test begins.
		$this->tear_down();
		$real = Service::audio_dir() . 'jobs/post-999999-en-realfile0001.mp3';
		wp_mkdir_p( dirname( $real ) );
		file_put_contents( $real, 'audio of the site' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- a stand-in for a real file, removed below.

		// The test begins, makes a file of its own, and ends.
		$this->set_up();
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$this->service_finished_the_job();
		$this->answers['GET /files/'][] = array( 200, self::MP3 );
		Jobs::poll( $this->post, 'en' );
		$made = Jobs::status( $this->post )['file_path'];
		$this->assertFileExists( $made );
		$this->tear_down();

		$kept = is_file( $real );
		$gone = ! is_file( $made );
		wp_delete_file( $real );
		$this->set_up();

		$this->assertTrue( $kept, 'A file that was on the site before the test is kept.' );
		$this->assertTrue( $gone, 'The file the test made is removed.' );
	}

	// TTS-354: a check that was lost from WP-Cron (seen with a real run, 2026-11-14).

	/**
	 * A job that is being made, last touched some seconds ago, with no check planned.
	 */
	private function job_without_a_check( $status, $seconds_ago ) {
		$this->service_takes_the_job();
		Jobs::start( $this->post );
		$all                  = get_post_meta( $this->post, Jobs::META, true );
		$all['en']['status']  = $status;
		$all['en']['updated'] = time() - $seconds_ago;
		update_post_meta( $this->post, Jobs::META, wp_slash( $all ) );
		wp_clear_scheduled_hook( Jobs::HOOK, array( $this->post, 'en' ) );
	}

	/**
	 * @dataProvider states_that_are_being_made
	 */
	public function test_a_job_that_lost_its_check_gets_one_planned_again( $status ) {
		$this->job_without_a_check( $status, Jobs::LOST_AFTER + 5 );
		$this->assertFalse( $this->next_poll() );

		$this->assertTrue( Jobs::follow( $this->post ) );

		$this->assertNotFalse( $this->next_poll() );
		$this->assertLessThanOrEqual( time() + 10, $this->next_poll() );
		// Asked again, nothing more is planned.
		$this->assertFalse( Jobs::follow( $this->post ) );
	}

	public function states_that_are_being_made() {
		return array(
			'queued'      => array( 'queued' ),
			'running'     => array( 'running' ),
			'downloading' => array( 'downloading' ),
		);
	}

	public function test_a_job_that_was_touched_a_moment_ago_is_left_alone() {
		// Its check may be running right now.
		$this->job_without_a_check( 'running', 10 );

		$this->assertFalse( Jobs::follow( $this->post ) );
		$this->assertFalse( $this->next_poll() );
	}

	/**
	 * @dataProvider states_that_have_ended
	 */
	public function test_a_job_that_has_ended_is_never_checked_again( $status ) {
		$this->job_without_a_check( $status, Jobs::LOST_AFTER + 5 );

		$this->assertFalse( Jobs::follow( $this->post ) );
		$this->assertFalse( $this->next_poll() );
	}

	public function states_that_have_ended() {
		return array(
			'done'     => array( 'done' ),
			'failed'   => array( 'failed' ),
			'canceled' => array( 'canceled' ),
		);
	}

	public function test_a_post_without_a_job_has_nothing_to_follow() {
		$this->assertFalse( Jobs::follow( $this->post ) );
		$this->assertFalse( Jobs::follow( 999999 ) );
	}

	public function test_listing_a_post_whose_job_lost_its_check_plans_it_again() {
		add_filter(
			'tts_get_player_id',
			static function () {
				return Service::PLAYER_ID;
			}
		);
		update_option( 'tta_settings_data', (object) array( 'tta__settings_allow_listening_for_post_types' => array( 'post' ) ) );
		\TTA\TTA_Cache::flush();
		$this->job_without_a_check( 'running', Jobs::LOST_AFTER + 5 );

		$listed = wp_list_pluck( \TTA\Library\Posts::get()['posts'], 'status', 'id' );
		$poll   = $this->next_poll();
		remove_all_filters( 'tts_get_player_id' );
		delete_option( 'tta_settings_data' );
		\TTA\TTA_Cache::flush();

		$this->assertSame( 'making', $listed[ $this->post ] );
		$this->assertNotFalse( $poll );
	}
}
