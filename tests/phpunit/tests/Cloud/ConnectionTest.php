<?php
/**
 * Tests for this site's connection to AtlasVoice Cloud: the service class,
 * its REST routes and `wp atlasvoice cloud` (TTS-347).
 *
 * The service is never called: every HTTP request is answered here.
 *
 * @package TTA
 */

use TTA\CLI\Cloud_Command;
use TTA\CLI\Commands;
use TTA\Cloud\Cloud;
use TTA\Cloud\Connection;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Cloud\Connection
 * @covers \TTA_Api\Cloud_Connection_Controller
 * @covers \TTA\CLI\Cloud_Command
 */
class ConnectionTest extends WP_UnitTestCase {

	const KEY = 'av_live_secret_key_value_0123456789';

	/**
	 * Requests WordPress was asked to send.
	 *
	 * @var array[]
	 */
	private $sent = array();

	/**
	 * Answers to give, in order.
	 *
	 * @var array[]
	 */
	private $answers = array();

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		Cloud::reset();
		delete_option( Service::OPTION );
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
		parent::tear_down();
	}

	public function intercept( $pre, $args, $url ) {
		$this->sent[] = array(
			'url'    => $url,
			'method' => $args['method'],
			'body'   => isset( $args['body'] ) ? json_decode( (string) $args['body'], true ) : null,
		);

		if ( ! $this->answers ) {
			return new WP_Error( 'http_request_failed', 'Could not resolve host.' );
		}

		$answer = array_shift( $this->answers );

		return array(
			'response' => array(
				'code'    => $answer[0],
				'message' => '',
			),
			'headers'  => new \WpOrg\Requests\Utility\CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
			'body'     => wp_json_encode( $answer[1] ),
			'cookies'  => array(),
		);
	}

	/**
	 * Queues the answers of a successful registration: the key, then the usage.
	 *
	 * @param string $approval 'approved' or 'pending'.
	 */
	private function service_accepts( $approval = 'approved', $status = 201 ) {
		$this->answers[] = array(
			$status,
			array(
				'api_key'    => self::KEY,
				'key_prefix' => 'av_live_secr',
				'project_id' => 37,
				'plan'       => 'free',
				'approval'   => $approval,
			),
		);
		// The service gives no usage to a site that still waits for approval.
		if ( 'pending' === $approval ) {
			$this->answers[] = array( 403, array( 'error' => array( 'code' => 'approval_required' ) ) );

			return;
		}

		$this->answers[] = array(
			200,
			array(
				'usage' => array(
					'plan'            => 'free',
					'chars_used'      => 0,
					'chars_limit'     => 100000,
					'chars_remaining' => 100000,
					'resets_at'       => '2026-12-01T00:00:00Z',
				),
			),
		);
	}

	private function connected_site() {
		update_option(
			Service::OPTION,
			array(
				'consent'    => true,
				'api_key'    => self::KEY,
				'key_prefix' => 'av_live_secr',
				'email'      => 'owner@example.org',
				'plan'       => 'free',
			),
			false
		);
	}

	private function rest( $method, array $body = array(), array $query = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/cloud/connection' );
		$request->set_query_params( $query );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Reading the connection.

	public function test_a_site_that_never_connected_says_so_and_asks_nothing() {
		$state = Connection::state( true );

		$this->assertFalse( $state['connected'] );
		$this->assertFalse( $state['key_revoked'] );
		$this->assertSame( '', $state['key_prefix'] );
		$this->assertSame( array(), $this->sent );
		$this->assertStringStartsWith( 'https://', $state['links']['privacy'] );
		$this->assertStringStartsWith( 'https://', $state['links']['terms'] );
	}

	public function test_the_state_never_holds_the_key() {
		$this->connected_site();

		$state = Connection::state();

		$this->assertTrue( $state['connected'] );
		$this->assertSame( 'owner@example.org', $state['email'] );
		$this->assertSame( 'av_live_secr', $state['key_prefix'] );
		$this->assertSame( 'free', $state['plan'] );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( $state ) );
	}

	public function test_reading_does_not_call_the_service_unless_asked() {
		$this->connected_site();

		Connection::state();
		$this->assertSame( array(), $this->sent );

		$this->answers[] = array(
			200,
			array(
				'usage' => array(
					'plan'            => 'free',
					'chars_remaining' => 100000,
				),
			),
		);
		Connection::state( true );
		$this->assertCount( 1, $this->sent );
		$this->assertStringEndsWith( '/v1/usage', $this->sent[0]['url'] );
	}

	// Connecting.

	public function test_nothing_is_sent_without_the_owners_agreement() {
		foreach ( array( false, null, 'yes', 1 ) as $not_agreed ) {
			$result = Connection::connect( 'owner@example.org', $not_agreed );

			$this->assertWPError( $result );
			$this->assertSame( 'consent_required', $result->get_error_code() );
			$this->assertSame( 400, $result->get_error_data()['status'] );
		}

		$this->assertSame( array(), $this->sent, 'No request may leave the site before the owner agrees.' );
		$this->assertFalse( get_option( Service::OPTION ) );
	}

	public function test_connecting_sends_the_site_and_the_email_and_stores_the_key() {
		$this->service_accepts();

		$state = Connection::connect( 'owner@example.org', true );

		$this->assertStringEndsWith( '/v1/projects/register', $this->sent[0]['url'] );
		$this->assertSame( 'POST', $this->sent[0]['method'] );
		$this->assertSame(
			array(
				'platform' => 'wordpress',
				'site_url' => home_url( '/' ),
				'email'    => 'owner@example.org',
				'name'     => get_bloginfo( 'name' ),
			),
			$this->sent[0]['body']
		);
		$this->assertTrue( $state['connected'] );
		$this->assertFalse( $state['pending_approval'] );
		$this->assertSame( 'owner@example.org', $state['email'] );
		$this->assertSame( self::KEY, get_option( Service::OPTION )['api_key'] );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( $state ) );
	}

	public function test_a_site_that_waits_for_approval_says_so() {
		$this->service_accepts( 'pending' );

		$state = Connection::connect( 'owner@example.org', true );

		$this->assertTrue( $state['pending_approval'] );
	}

	public function test_a_wrong_email_is_refused_before_anything_is_sent() {
		$result = Connection::connect( 'not an email', true );

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_email', $result->get_error_code() );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( array(), $this->sent );
	}

	public function test_a_site_owned_by_another_email_says_who_and_that_it_can_be_moved() {
		$this->answers[] = array(
			409,
			array(
				'error'      => array(
					'code'    => 'project_exists',
					'message' => 'This site is already connected to another account.',
				),
				'owner_hint' => 'ra••••@agency.com',
				'takeover'   => true,
			),
		);

		$result = Connection::connect( 'owner@example.org', true );

		$this->assertWPError( $result );
		$this->assertSame( 'project_exists', $result->get_error_code() );
		$this->assertSame(
			array(
				'status'     => 409,
				'owner_hint' => 'ra••••@agency.com',
				'takeover'   => true,
			),
			$result->get_error_data()
		);
	}

	public function test_a_service_that_is_down_is_a_503_not_a_fatal() {
		$result = Connection::connect( 'owner@example.org', true );

		$this->assertWPError( $result );
		$this->assertSame( 503, $result->get_error_data()['status'] );
		$this->assertNotSame( '', $result->get_error_message() );
	}

	public function test_moving_the_site_asks_for_a_code_and_then_for_the_check() {
		$this->answers[] = array(
			201,
			array(
				'challenge_id' => 'ch_123',
				'token'        => 'tok_abc',
			),
		);
		// The check answers 200 with the new key; the usage is read after it.
		$this->service_accepts( 'approved', 200 );

		$state = Connection::connect( 'owner@example.org', true, true );

		$this->assertStringEndsWith( '/v1/projects/takeover', $this->sent[0]['url'] );
		$this->assertStringEndsWith( '/v1/projects/takeover/verify', $this->sent[1]['url'] );
		$this->assertSame( array( 'challenge_id' => 'ch_123' ), $this->sent[1]['body'] );
		$this->assertTrue( $state['connected'] );
		$this->assertFalse( get_transient( 'atlasvoice_takeover' ), 'The one-time code is removed after the check.' );
	}

	// Disconnecting.

	public function test_disconnecting_forgets_the_key_and_calls_nobody() {
		$this->connected_site();

		$state = Connection::disconnect();

		$this->assertFalse( $state['connected'] );
		$this->assertSame( '', get_option( Service::OPTION )['api_key'] );
		$this->assertSame( array(), $this->sent );
	}

	// The REST routes.

	public function test_get_returns_the_connection() {
		$this->connected_site();

		$response = $this->rest( 'GET' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Connection::state(), $response->get_data() );
	}

	public function test_post_connects() {
		$this->service_accepts();

		$response = $this->rest(
			'POST',
			array(
				'email'   => 'owner@example.org',
				'consent' => true,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['connected'] );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( $response->get_data() ) );
	}

	/**
	 * @dataProvider refused_bodies
	 */
	public function test_post_refuses_a_request_without_agreement_or_email( $body ) {
		$response = $this->rest( 'POST', $body );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( array(), $this->sent );
	}

	public function refused_bodies() {
		return array(
			'consent false'      => array(
				array(
					'email'   => 'owner@example.org',
					'consent' => false,
				),
			),
			'no consent'         => array( array( 'email' => 'owner@example.org' ) ),
			'no email'           => array( array( 'consent' => true ) ),
			'not an email'       => array(
				array(
					'email'   => 'owner',
					'consent' => true,
				),
			),
			'consent as a word'  => array(
				array(
					'email'   => 'owner@example.org',
					'consent' => 'maybe',
				),
			),
		);
	}

	public function test_post_passes_on_who_owns_the_site() {
		$this->answers[] = array(
			409,
			array(
				'error'      => array(
					'code'    => 'project_exists',
					'message' => 'This site is already connected to another account.',
				),
				'owner_hint' => 'ra••••@agency.com',
				'takeover'   => true,
			),
		);

		$response = $this->rest(
			'POST',
			array(
				'email'   => 'owner@example.org',
				'consent' => true,
			)
		);

		$this->assertSame( 409, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'project_exists', $data['code'] );
		$this->assertSame( 'ra••••@agency.com', $data['data']['owner_hint'] );
		$this->assertTrue( $data['data']['takeover'] );
	}

	public function test_delete_disconnects() {
		$this->connected_site();

		$response = $this->rest( 'DELETE' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['connected'] );
	}

	public function test_each_method_describes_itself_and_connect_says_what_is_sent() {
		$routes = rest_get_server()->get_routes()['/tta/v1/cloud/connection'];

		$this->assertCount( 3, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}

		$connect = $routes[1];
		$this->assertSame( array( 'POST' => true ), $connect['methods'] );
		$this->assertStringContainsString( 'consent', $connect['description'] );
		$this->assertTrue( $connect['args']['consent']['required'] );
		$this->assertTrue( $connect['args']['email']['required'] );
		foreach ( $connect['args'] as $arg ) {
			$this->assertNotEmpty( $arg['description'] );
		}
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_connect_or_disconnect( $role ) {
		$this->connected_site();
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest( 'GET' )->get_status(), array( 401, 403 ) );
		$this->assertContains(
			$this->rest(
				'POST',
				array(
					'email'   => 'owner@example.org',
					'consent' => true,
				)
			)->get_status(),
			array( 401, 403 )
		);
		$this->assertContains( $this->rest( 'DELETE' )->get_status(), array( 401, 403 ) );
		$this->assertSame( self::KEY, get_option( Service::OPTION )['api_key'], 'The connection is untouched.' );
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

		$this->assertSame( Cloud_Command::class, WP_CLI::$commands['atlasvoice cloud'] );
	}

	public function test_status_prints_the_connection_without_the_key() {
		$this->connected_site();

		( new Cloud_Command() )->status( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'connected: yes', $lines );
		$this->assertContains( 'email: owner@example.org', $lines );
		$this->assertContains( 'site key: av_live_secr...', $lines );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( WP_CLI::$log ) );
	}

	public function test_status_says_when_the_site_is_not_connected() {
		( new Cloud_Command() )->status( array(), array() );

		$this->assertSame( array( 'line', 'Not connected.' ), end( WP_CLI::$log ) );
	}

	public function test_connect_sends_nothing_without_agree() {
		try {
			( new Cloud_Command() )->connect( array(), array( 'email' => 'owner@example.org' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( '--agree', WP_CLI::$log[0][1] );
		$this->assertSame( array(), $this->sent );
	}

	public function test_connect_with_agree_connects() {
		$this->service_accepts();

		( new Cloud_Command() )->connect(
			array(),
			array(
				'email' => 'owner@example.org',
				'agree' => true,
			)
		);

		$this->assertSame( array( 'success', 'Connected to AtlasVoice Cloud as owner@example.org.' ), end( WP_CLI::$log ) );
	}

	public function test_connect_tells_how_to_move_a_site_owned_by_another_email() {
		$this->answers[] = array(
			409,
			array(
				'error'      => array(
					'code'    => 'project_exists',
					'message' => 'This site is already connected to another account.',
				),
				'owner_hint' => 'ra••••@agency.com',
				'takeover'   => true,
			),
		);

		try {
			( new Cloud_Command() )->connect(
				array(),
				array(
					'email' => 'owner@example.org',
					'agree' => true,
				)
			);
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( '--takeover', WP_CLI::$log[0][1] );
	}

	public function test_disconnect_asks_first_and_stops_on_no() {
		$this->connected_site();
		WP_CLI::$confirm_answer = false;

		try {
			( new Cloud_Command() )->disconnect( array(), array() );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( self::KEY, get_option( Service::OPTION )['api_key'] );
	}

	public function test_disconnect_after_yes_forgets_the_key() {
		$this->connected_site();

		( new Cloud_Command() )->disconnect( array(), array( 'yes' => true ) );

		$this->assertSame( '', get_option( Service::OPTION )['api_key'] );
		$this->assertSame( 'success', end( WP_CLI::$log )[0] );
	}
}
