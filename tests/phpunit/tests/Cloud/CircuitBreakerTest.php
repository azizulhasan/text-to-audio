<?php
/**
 * Tests for the SDK's back-off and circuit breaker (TTS-378).
 *
 * @package TTA
 */

use AtlasVoice\Sdk\Circuit_Breaker;
use AtlasVoice\Sdk\Client;
use AtlasVoice\Sdk\Config;
use AtlasVoice\Sdk\Contracts\Http_Transport;
use AtlasVoice\Sdk\Contracts\Key_Store;
use AtlasVoice\Sdk\Contracts\Logger;
use AtlasVoice\Sdk\Contracts\State_Store;
use AtlasVoice\Sdk\Request;
use AtlasVoice\Sdk\Response;

/**
 * Keeps state in memory and counts writes.
 */
class Breaker_Fake_Store implements State_Store {

	public $values = array();

	public $writes = 0;

	public function get( $name ) {
		return isset( $this->values[ $name ] ) ? $this->values[ $name ] : null;
	}

	public function set( $name, array $value, $seconds ) {
		++$this->writes;
		$this->values[ $name ] = $value;
	}

	public function delete( $name ) {
		++$this->writes;
		unset( $this->values[ $name ] );
	}
}

class Breaker_Fake_Transport implements Http_Transport {

	public $sent = 0;

	/**
	 * @var Response[]
	 */
	public $answers = array();

	public function send( Request $request ) {
		++$this->sent;

		return $this->answers ? array_shift( $this->answers ) : Response::failed( 'Connection refused.' );
	}
}

class Breaker_Fake_Keys implements Key_Store {

	public function get_key() {
		return 'av_live_0123456789abcdef';
	}
}

class Breaker_Fake_Logger implements Logger {

	public $lines = array();

	public function log( $level, $event, array $context ) {
		$this->lines[] = compact( 'level', 'event', 'context' );
	}
}

/**
 * @covers \AtlasVoice\Sdk\Circuit_Breaker
 * @covers \AtlasVoice\Sdk\Client
 */
class CircuitBreakerTest extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	public $now = 1000000;

	/**
	 * @var Breaker_Fake_Store
	 */
	private $store;

	/**
	 * @var Breaker_Fake_Transport
	 */
	private $transport;

	/**
	 * @var Breaker_Fake_Logger
	 */
	private $logger;

	/**
	 * @var Client
	 */
	private $client;

	public function set_up() {
		parent::set_up();
		$this->now       = 1000000;
		$this->store     = new Breaker_Fake_Store();
		$this->transport = new Breaker_Fake_Transport();
		$this->logger    = new Breaker_Fake_Logger();
		$this->client    = new Client( new Config( 'https://api.atlasvoice.cloud', 'wordpress/2.5.0' ), $this->transport, new Breaker_Fake_Keys(), $this->logger, $this->breaker() );
	}

	private function breaker() {
		return new Circuit_Breaker(
			$this->store,
			'state',
			function () {
				return $this->now;
			}
		);
	}

	private function answer( $status, array $headers = array(), array $body = array() ) {
		return new Response( $status, array_merge( array( 'Content-Type' => 'application/json' ), $headers ), json_encode( $body ) );
	}

	private function call_times( $times ) {
		for ( $i = 0; $i < $times; $i++ ) {
			$this->client->usage();
		}
	}

	public function test_a_healthy_service_costs_no_stored_state() {
		$this->transport->answers = array( $this->answer( 200 ), $this->answer( 200 ), $this->answer( 200 ) );

		$this->call_times( 3 );

		$this->assertSame( 3, $this->transport->sent );
		$this->assertSame( 0, $this->store->writes );
	}

	public function test_a_few_failures_do_not_pause_calls() {
		$this->call_times( Circuit_Breaker::FAILURES_TO_OPEN );

		$this->assertSame( Circuit_Breaker::FAILURES_TO_OPEN, $this->transport->sent );
	}

	public function test_after_five_failures_in_a_row_the_service_is_not_called() {
		$this->call_times( Circuit_Breaker::FAILURES_TO_OPEN );

		$result = $this->client->usage();

		$this->assertSame( Circuit_Breaker::FAILURES_TO_OPEN, $this->transport->sent, 'The sixth call must not be sent.' );
		$this->assertFalse( $result->reached() );
		$this->assertTrue( $result->is_temporary() );
		$this->assertStringContainsString( 'paused', $result->transport_error );
		$this->assertNotSame( '', $result->request_id );
	}

	public function test_a_paused_call_is_logged_as_skipped() {
		$this->call_times( Circuit_Breaker::FAILURES_TO_OPEN + 1 );

		$last = end( $this->logger->lines );
		$this->assertSame( 'request_skipped', $last['event'] );
		$this->assertSame( 'error', $last['level'] );
		$this->assertFalse( $last['context']['reached'] );
	}

	public function test_after_the_pause_one_call_tests_the_service_and_a_good_answer_ends_it() {
		$this->call_times( Circuit_Breaker::FAILURES_TO_OPEN );
		$this->now += Circuit_Breaker::OPEN_SECONDS + 1;

		$this->transport->answers[] = $this->answer( 200 );
		$this->assertTrue( $this->client->usage()->ok() );
		$this->assertSame( array(), $this->store->values, 'A good answer forgets the failures.' );

		// The next failures start from zero again.
		$this->call_times( 2 );
		$this->assertSame( Circuit_Breaker::FAILURES_TO_OPEN + 3, $this->transport->sent );
	}

	public function test_a_service_that_is_still_down_after_the_pause_is_paused_again_at_once() {
		$this->call_times( Circuit_Breaker::FAILURES_TO_OPEN );
		$this->now += Circuit_Breaker::OPEN_SECONDS + 1;

		$this->client->usage(); // The test call: sent, and fails.
		$this->client->usage(); // Paused again.

		$this->assertSame( Circuit_Breaker::FAILURES_TO_OPEN + 1, $this->transport->sent );
	}

	/**
	 * @dataProvider working_answers
	 */
	public function test_an_answer_that_means_the_service_works_never_pauses_calls( $status, $code ) {
		for ( $i = 0; $i < 8; $i++ ) {
			$this->transport->answers[] = $this->answer( $status, array(), array( 'error' => array( 'code' => $code ) ) );
		}

		$this->call_times( 8 );

		$this->assertSame( 8, $this->transport->sent );
		$this->assertSame( 0, $this->store->writes );
	}

	public function working_answers() {
		return array(
			'quota used up'        => array( 402, 'quota_exceeded' ),
			'wrong key'            => array( 401, 'invalid_api_key' ),
			'waiting for approval' => array( 403, 'approval_required' ),
			'text too long'        => array( 413, 'text_too_long' ),
			'rate limit, no time'  => array( 429, 'rate_limited' ),
			'a bug in one route'   => array( 500, 'internal_error' ),
		);
	}

	/**
	 * @dataProvider down_answers
	 */
	public function test_gateway_errors_count_as_the_service_being_down( $status ) {
		for ( $i = 0; $i < Circuit_Breaker::FAILURES_TO_OPEN; $i++ ) {
			$this->transport->answers[] = $this->answer( $status );
		}
		$this->call_times( Circuit_Breaker::FAILURES_TO_OPEN + 1 );

		$this->assertSame( Circuit_Breaker::FAILURES_TO_OPEN, $this->transport->sent );
	}

	public function down_answers() {
		return array( array( 502 ), array( 503 ), array( 504 ) );
	}

	public function test_retry_after_on_a_rate_limit_is_obeyed_from_the_first_answer() {
		$this->transport->answers[] = $this->answer( 429, array( 'Retry-After' => '30' ), array( 'error' => array( 'code' => 'rate_limited' ) ) );

		$this->call_times( 2 );
		$this->assertSame( 1, $this->transport->sent, 'No call before the time the service gave.' );

		$this->now                 += 31;
		$this->transport->answers[] = $this->answer( 200 );
		$this->assertTrue( $this->client->usage()->ok() );
	}

	/**
	 * @dataProvider untrusted_retry_after
	 */
	public function test_a_wrong_or_hostile_retry_after_cannot_switch_a_site_off( $value, $expected_wait ) {
		$this->transport->answers[] = $this->answer( 503, array( 'Retry-After' => $value ) );

		$this->client->usage();

		$this->assertSame( $expected_wait, $this->breaker()->seconds_to_wait() );
	}

	public function untrusted_retry_after() {
		return array(
			'a day'         => array( '86400', Circuit_Breaker::MAX_WAIT ),
			'huge'          => array( '99999999999999999999', 0 ),
			'negative'      => array( '-5', 0 ),
			'a date'        => array( 'Wed, 21 Oct 2026 07:28:00 GMT', 0 ),
			'not a number'  => array( '10; DROP', 0 ),
			'a normal wait' => array( '20', 20 ),
		);
	}

	public function test_retry_after_on_a_good_answer_is_ignored() {
		$this->transport->answers[] = $this->answer( 200, array( 'Retry-After' => '600' ) );
		$this->transport->answers[] = $this->answer( 200 );

		$this->call_times( 2 );

		$this->assertSame( 2, $this->transport->sent );
	}

	public function test_damaged_stored_state_is_read_as_no_state() {
		$this->store->values['state'] = array(
			'failures' => 'many',
			'until'    => array( 'never' ),
		);
		$this->transport->answers[]   = $this->answer( 200 );

		$this->assertTrue( $this->client->usage()->ok() );
	}

	public function test_a_client_without_a_breaker_always_calls() {
		$client = new Client( new Config( 'https://api.atlasvoice.cloud', 'wordpress/2.5.0' ), $this->transport, new Breaker_Fake_Keys() );

		for ( $i = 0; $i < 9; $i++ ) {
			$client->usage();
		}

		$this->assertSame( 9, $this->transport->sent );
	}
}
