<?php
/**
 * Tests for the audio-jobs calls of the platform-free SDK (TTS-378 / TTS-380).
 *
 * The contract is the service's "Audio jobs" section of API-V1.md.
 *
 * @package TTA
 */

use AtlasVoice\Sdk\Circuit_Breaker;
use AtlasVoice\Sdk\Client;
use AtlasVoice\Sdk\Config;
use AtlasVoice\Sdk\Contracts\Http_Transport;
use AtlasVoice\Sdk\Contracts\Key_Store;
use AtlasVoice\Sdk\Contracts\State_Store;
use AtlasVoice\Sdk\Error_Codes;
use AtlasVoice\Sdk\Request;
use AtlasVoice\Sdk\Response;

class Jobs_Fake_Transport implements Http_Transport {

	/**
	 * @var Request[]
	 */
	public $sent = array();

	/**
	 * @var Response[]
	 */
	public $answers = array();

	public function send( Request $request ) {
		$this->sent[] = $request;

		return $this->answers ? array_shift( $this->answers ) : Response::failed( 'Connection refused.' );
	}
}

class Jobs_Fake_Keys implements Key_Store {

	public function get_key() {
		return 'av_live_0123456789abcdef';
	}
}

class Jobs_Fake_Store implements State_Store {

	public $values = array();

	public function get( $name ) {
		return isset( $this->values[ $name ] ) ? $this->values[ $name ] : null;
	}

	public function set( $name, array $value, $seconds ) {
		$this->values[ $name ] = $value;
	}

	public function delete( $name ) {
		unset( $this->values[ $name ] );
	}
}

/**
 * @covers \AtlasVoice\Sdk\Client
 * @covers \AtlasVoice\Sdk\Result
 * @covers \AtlasVoice\Sdk\Error_Codes
 */
class SdkJobsTest extends WP_UnitTestCase {

	const JOB = '0b9d3c1e-7a52-4f0c-9d1e-2f6a8b7c5d41';

	/**
	 * @var Jobs_Fake_Transport
	 */
	private $transport;

	/**
	 * @var Client
	 */
	private $client;

	public function set_up() {
		parent::set_up();
		$this->transport = new Jobs_Fake_Transport();
		$this->client    = new Client(
			new Config( 'https://api.atlasvoice.cloud', 'wordpress/2.5.0' ),
			$this->transport,
			new Jobs_Fake_Keys(),
			null,
			new Circuit_Breaker( new Jobs_Fake_Store(), 'state' )
		);
	}

	private function json( $status, array $body, array $headers = array() ) {
		return new Response( $status, array_merge( array( 'Content-Type' => 'application/json' ), $headers ), json_encode( $body ) );
	}

	// Creating a job.

	public function test_a_job_sends_the_whole_text_once_with_its_reference_and_key() {
		$this->transport->answers[] = $this->json(
			202,
			array(
				'job'           => array(
					'id'     => self::JOB,
					'status' => 'queued',
				),
				'poll_after_ms' => 3200,
			),
			array( 'Retry-After' => '4' )
		);

		$result = $this->client->create_job(
			'A long post.',
			'en',
			array(
				'ref'             => 'post:161:en',
				'idempotency_key' => 'post:161:en:abc',
			)
		);

		$sent = $this->transport->sent[0];
		$this->assertSame( 'POST', $sent->method );
		$this->assertSame( 'https://api.atlasvoice.cloud/v1/jobs', $sent->url );
		$this->assertSame(
			array(
				'text'   => 'A long post.',
				'lang'   => 'en',
				'engine' => 'gtts',
				'voice'  => null,
				'ref'    => 'post:161:en',
			),
			json_decode( $sent->body, true )
		);
		$this->assertSame( 'post:161:en:abc', $sent->headers['Idempotency-Key'] );
		$this->assertStringStartsWith( 'Bearer ', $sent->headers['Authorization'] );
		$this->assertNotEmpty( $sent->headers['X-Request-Id'] );
		$this->assertTrue( $result->ok() );
		$this->assertSame( self::JOB, $result->data['job']['id'] );
		$this->assertSame( 3200, $result->data['poll_after_ms'] );
		$this->assertSame( 4, $result->retry_after() );
	}

	public function test_a_job_can_name_an_engine_and_a_voice() {
		$this->client->create_job(
			'Text',
			'en',
			array(
				'engine' => 'cloud',
				'voice'  => 'sarah',
			)
		);

		$body = json_decode( $this->transport->sent[0]->body, true );
		$this->assertSame( 'cloud', $body['engine'] );
		$this->assertSame( 'sarah', $body['voice'] );
	}

	/**
	 * @dataProvider unusable_keys
	 */
	public function test_a_key_the_service_would_refuse_is_not_sent( $key ) {
		$this->client->create_job( 'Text', 'en', array( 'idempotency_key' => $key ) );

		$this->assertArrayNotHasKey( 'Idempotency-Key', $this->transport->sent[0]->headers );
	}

	public function unusable_keys() {
		return array(
			'a second header line' => array( "abc\r\nX-Evil: 1" ),
			'a space'              => array( 'post 161' ),
			'too long'             => array( str_repeat( 'a', 129 ) ),
			'empty'                => array( '' ),
			'not text'             => array( array( 'abc' ) ),
		);
	}

	public function test_the_same_text_gives_the_same_key_and_a_changed_text_another() {
		$first  = Client::idempotency_key( 'post:161:en', 'The old mill.' );
		$again  = Client::idempotency_key( 'post:161:en', 'The old mill.' );
		$edited = Client::idempotency_key( 'post:161:en', 'The old mill, restored.' );
		$other  = Client::idempotency_key( 'post:161:fr', 'The old mill.' );

		$this->assertSame( $first, $again );
		$this->assertNotSame( $first, $edited );
		$this->assertNotSame( $first, $other );
		$this->assertMatchesRegularExpression( '/^[A-Za-z0-9_.:-]{1,128}$/', $first );
		$this->assertStringStartsWith( 'post:161:en:', $first );
	}

	public function test_a_key_from_a_long_or_odd_reference_is_still_accepted_by_the_service() {
		$key = Client::idempotency_key( str_repeat( 'post/ünï code #', 30 ), 'Text' );

		$this->assertMatchesRegularExpression( '/^[A-Za-z0-9_.:-]{1,128}$/', $key );
		$this->assertSame( 128, strlen( $key ) );
	}

	public function test_a_reference_is_cut_to_what_the_service_accepts() {
		$this->assertSame( 'post:161:en', Client::job_ref( 'post:161:en' ) );
		$this->assertSame( 'post-161--b-en-', Client::job_ref( 'post 161 <b>en>' ) );
		$this->assertSame( 128, strlen( Client::job_ref( str_repeat( 'a', 300 ) ) ) );
	}

	public function test_a_replayed_request_is_the_same_job_and_says_so() {
		$this->transport->answers[] = $this->json(
			200,
			array( 'job' => array( 'id' => self::JOB ) ),
			array( 'Idempotent-Replayed' => 'true' )
		);

		$result = $this->client->create_job( 'Text', 'en', array( 'idempotency_key' => 'k' ) );

		$this->assertTrue( $result->ok() );
		$this->assertSame( 'true', $result->header( 'Idempotent-Replayed' ) );
	}

	/**
	 * @dataProvider creation_errors
	 */
	public function test_a_refused_job_gives_the_services_code( $status, $code, $temporary ) {
		$this->transport->answers[] = $this->json( $status, array( 'error' => array( 'code' => $code ) ) );

		$result = $this->client->create_job( 'Text', 'en' );

		$this->assertFalse( $result->ok() );
		$this->assertSame( $code, $result->code() );
		$this->assertSame( $temporary, $result->is_temporary() );
	}

	public function creation_errors() {
		return array(
			'the text changed under one key' => array( 409, Error_Codes::IDEMPOTENCY_CONFLICT, false ),
			'the allowance is used up'       => array( 429, Error_Codes::QUOTA_EXCEEDED, false ),
			'too many jobs at once'          => array( 429, Error_Codes::TOO_MANY_JOBS, true ),
			'the queue is full'              => array( 503, Error_Codes::QUEUE_FULL, true ),
			'the text is too long'           => array( 413, Error_Codes::TEXT_TOO_LONG, false ),
			'nothing to speak'               => array( 422, Error_Codes::NOTHING_TO_SPEAK, false ),
			'an older service without jobs'  => array( 404, 'not_found', false ),
		);
	}

	public function test_too_many_jobs_says_how_long_to_wait() {
		$this->transport->answers[] = $this->json( 429, array( 'error' => array( 'code' => 'too_many_jobs' ) ), array( 'Retry-After' => '30' ) );

		$this->assertSame( 30, $this->client->create_job( 'Text', 'en' )->retry_after() );
	}

	/**
	 * @dataProvider untrusted_waits
	 */
	public function test_a_wrong_wait_from_the_service_is_not_obeyed( $header, $expected ) {
		$this->transport->answers[] = $this->json( 503, array(), array( 'Retry-After' => $header ) );

		$this->assertSame( $expected, $this->client->health()->retry_after() );
	}

	public function untrusted_waits() {
		return array(
			'a day is cut'   => array( '86400', 900 ),
			'a date'         => array( 'Wed, 21 Oct 2026 07:28:00 GMT', 0 ),
			'negative'       => array( '-5', 0 ),
			'not a number'   => array( 'soon', 0 ),
			'a normal value' => array( '60', 60 ),
		);
	}

	// Reading jobs.

	public function test_reading_a_job_asks_for_that_job() {
		$this->transport->answers[] = $this->json(
			200,
			array(
				'job'           => array(
					'id'     => self::JOB,
					'status' => 'running',
				),
				'poll_after_ms' => 2500,
			)
		);

		$result = $this->client->get_job( self::JOB );

		$this->assertSame( 'GET', $this->transport->sent[0]->method );
		$this->assertSame( 'https://api.atlasvoice.cloud/v1/jobs/' . self::JOB, $this->transport->sent[0]->url );
		$this->assertNull( $this->transport->sent[0]->body );
		$this->assertSame( 'running', $result->data['job']['status'] );
	}

	/**
	 * @dataProvider not_job_ids
	 */
	public function test_something_that_is_not_a_job_id_is_never_sent( $id ) {
		foreach ( array( $this->client->get_job( $id ), $this->client->cancel_job( $id ) ) as $result ) {
			$this->assertFalse( $result->reached() );
			$this->assertNotSame( '', $result->transport_error );
		}

		$this->assertSame( array(), $this->transport->sent );
	}

	public function not_job_ids() {
		return array(
			'a way out of the route' => array( '../usage' ),
			'another route'          => array( 'abc/def' ),
			'a query'                => array( 'abc?x=1' ),
			'a full address'         => array( 'https://evil.example/' ),
			'a line break'           => array( "abc\ndef" ),
			'empty'                  => array( '' ),
			'not text'               => array( 42 ),
		);
	}

	public function test_many_jobs_are_read_in_one_call() {
		$this->transport->answers[] = $this->json( 200, array( 'jobs' => array() ) );

		$this->client->get_jobs( array( self::JOB, 'bad id', self::JOB, 'abc-123' ) );

		$this->assertCount( 1, $this->transport->sent );
		$this->assertSame( 'https://api.atlasvoice.cloud/v1/jobs?ids=' . self::JOB . ',abc-123', $this->transport->sent[0]->url );
	}

	public function test_at_most_a_hundred_jobs_are_asked_for_at_once() {
		$ids = array();
		for ( $i = 0; $i < 150; $i++ ) {
			$ids[] = 'job-' . $i;
		}

		$this->client->get_jobs( $ids );

		$this->assertCount( 100, explode( ',', substr( $this->transport->sent[0]->url, strlen( 'https://api.atlasvoice.cloud/v1/jobs?ids=' ) ) ) );
	}

	public function test_a_list_without_one_id_is_not_sent() {
		$result = $this->client->get_jobs( array( 'bad id', '' ) );

		$this->assertFalse( $result->reached() );
		$this->assertSame( array(), $this->transport->sent );
	}

	public function test_the_jobs_of_a_post_are_found_by_the_start_of_their_reference() {
		$this->transport->answers[] = $this->json( 200, array( 'jobs' => array() ) );

		$this->client->get_jobs_by_ref( 'post:161:' );

		$this->assertSame( 'https://api.atlasvoice.cloud/v1/jobs?ref_prefix=post%3A161%3A', $this->transport->sent[0]->url );
	}

	public function test_a_reference_with_other_characters_is_not_sent() {
		$result = $this->client->get_jobs_by_ref( 'post 161&ids=x' );

		$this->assertFalse( $result->reached() );
		$this->assertSame( array(), $this->transport->sent );
	}

	public function test_cancelling_deletes_that_job() {
		$this->transport->answers[] = $this->json( 200, array( 'job' => array( 'status' => 'canceled' ) ) );

		$result = $this->client->cancel_job( self::JOB );

		$this->assertSame( 'DELETE', $this->transport->sent[0]->method );
		$this->assertSame( 'https://api.atlasvoice.cloud/v1/jobs/' . self::JOB, $this->transport->sent[0]->url );
		$this->assertSame( 'canceled', $result->data['job']['status'] );
	}

	public function test_a_job_that_is_gone_is_a_plain_answer() {
		$this->transport->answers[] = $this->json( 404, array( 'error' => array( 'code' => 'job_not_found' ) ) );

		$result = $this->client->get_job( self::JOB );

		$this->assertSame( Error_Codes::JOB_NOT_FOUND, $result->code() );
		$this->assertFalse( $result->is_temporary() );
	}

	// Polling and the circuit breaker.

	public function test_polling_is_not_stopped_when_another_route_found_the_service_down() {
		// Five failures in a row open the breaker.
		for ( $i = 0; $i < Circuit_Breaker::FAILURES_TO_OPEN; $i++ ) {
			$this->client->usage();
		}
		$this->client->usage();
		$this->assertCount( Circuit_Breaker::FAILURES_TO_OPEN, $this->transport->sent, 'The breaker is open for ordinary calls.' );

		$this->transport->answers[] = $this->json( 200, array( 'job' => array( 'status' => 'done' ) ) );
		$result                     = $this->client->get_job( self::JOB );

		$this->assertTrue( $result->ok(), 'A job must not be lost because another route was down.' );
	}

	public function test_failed_polls_do_not_pause_the_other_calls() {
		for ( $i = 0; $i < 8; $i++ ) {
			$this->client->get_job( self::JOB );
		}

		$this->transport->answers[] = $this->json( 200, array( 'usage' => array() ) );

		$this->assertTrue( $this->client->usage()->ok() );
	}

	public function test_creating_a_job_obeys_the_breaker_like_any_new_work() {
		for ( $i = 0; $i < Circuit_Breaker::FAILURES_TO_OPEN; $i++ ) {
			$this->client->usage();
		}

		$result = $this->client->create_job( 'Text', 'en' );

		$this->assertFalse( $result->reached() );
		$this->assertCount( Circuit_Breaker::FAILURES_TO_OPEN, $this->transport->sent );
	}

	// Health.

	public function test_health_is_read_without_the_key() {
		$this->transport->answers[] = $this->json(
			200,
			array(
				'file_hosts' => array( 'api.atlasvoice.cloud' ),
				'jobs'       => array(
					'max_chars'  => 200000,
					'file_hours' => 48,
				),
			)
		);

		$result = $this->client->health();

		$this->assertSame( 'https://api.atlasvoice.cloud/v1/health', $this->transport->sent[0]->url );
		$this->assertArrayNotHasKey( 'Authorization', $this->transport->sent[0]->headers );
		$this->assertSame( array( 'api.atlasvoice.cloud' ), $result->data['file_hosts'] );
	}

	// request() is unchanged for every existing caller.

	public function test_an_ordinary_request_carries_no_extra_header() {
		$this->client->request( 'GET', '/v1/usage' );

		$this->assertSame(
			array( 'Accept', 'X-AtlasVoice-Client', 'X-Request-Id', 'Authorization' ),
			array_keys( $this->transport->sent[0]->headers )
		);
	}
}
