<?php
/**
 * Tests for the platform-free AtlasVoice SDK (libs/AtlasVoice/Sdk), TTS-378.
 *
 * The client is tested with stand-ins for the three things a platform
 * supplies, so nothing here needs WordPress or the network.
 *
 * @package TTA
 */

use AtlasVoice\Sdk\Client;
use AtlasVoice\Sdk\Config;
use AtlasVoice\Sdk\Contracts\Http_Transport;
use AtlasVoice\Sdk\Contracts\Key_Store;
use AtlasVoice\Sdk\Contracts\Logger;
use AtlasVoice\Sdk\Error_Codes;
use AtlasVoice\Sdk\Request;
use AtlasVoice\Sdk\Response;

/**
 * Records requests and gives the queued answers.
 */
class Sdk_Fake_Transport implements Http_Transport {

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

		return $this->answers ? array_shift( $this->answers ) : Response::failed( 'Could not resolve host.' );
	}
}

class Sdk_Fake_Keys implements Key_Store {

	public $key = '';

	public function get_key() {
		return $this->key;
	}
}

class Sdk_Fake_Logger implements Logger {

	public $lines = array();

	public function log( $level, $event, array $context ) {
		$this->lines[] = compact( 'level', 'event', 'context' );
	}
}

/**
 * @covers \AtlasVoice\Sdk\Client
 * @covers \AtlasVoice\Sdk\Config
 * @covers \AtlasVoice\Sdk\Result
 * @covers \AtlasVoice\Sdk\Response
 */
class SdkClientTest extends WP_UnitTestCase {

	const KEY = 'av_live_0123456789abcdef0123456789abcdef';

	/**
	 * @var Sdk_Fake_Transport
	 */
	private $transport;

	/**
	 * @var Sdk_Fake_Keys
	 */
	private $keys;

	/**
	 * @var Sdk_Fake_Logger
	 */
	private $logger;

	/**
	 * @var Client
	 */
	private $client;

	public function set_up() {
		parent::set_up();
		$this->transport = new Sdk_Fake_Transport();
		$this->keys      = new Sdk_Fake_Keys();
		$this->keys->key = self::KEY;
		$this->logger    = new Sdk_Fake_Logger();
		$this->client    = new Client( new Config( 'https://api.atlasvoice.cloud/', 'wordpress/2.5.0' ), $this->transport, $this->keys, $this->logger );
	}

	private function json( $status, array $body, array $headers = array() ) {
		return new Response( $status, array_merge( array( 'Content-Type' => 'application/json; charset=utf-8' ), $headers ), json_encode( $body ) );
	}

	// The SDK has no platform code in it.

	public function test_the_sdk_calls_no_wordpress_function() {
		$dir   = dirname( __DIR__, 4 ) . '/libs/AtlasVoice/Sdk';
		$files = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ) );
		$count = 0;

		foreach ( $files as $file ) {
			if ( 'php' !== $file->getExtension() ) {
				continue;
			}
			++$count;

			foreach ( token_get_all( file_get_contents( $file->getPathname() ) ) as $token ) {
				if ( ! is_array( $token ) || T_STRING !== $token[0] ) {
					continue;
				}
				$this->assertDoesNotMatchRegularExpression(
					'/^(wp_|get_option|update_option|add_filter|apply_filters|do_action|add_action|esc_|sanitize_|__$|_e$|WP_Error|is_wp_error|home_url|get_bloginfo|ABSPATH)/',
					$token[1],
					basename( $file->getPathname() ) . ' line ' . $token[2] . ' uses a WordPress name.'
				);
			}
		}

		$this->assertGreaterThan( 5, $count, 'The SDK files were not found.' );
	}

	// Configuration.

	/**
	 * @dataProvider bad_addresses
	 */
	public function test_an_unsafe_service_address_is_refused( $address ) {
		$this->expectException( InvalidArgumentException::class );

		new Config( $address, 'wordpress/2.5.0' );
	}

	public function bad_addresses() {
		return array(
			'plain http'            => array( 'http://api.atlasvoice.cloud' ),
			'no scheme'             => array( 'api.atlasvoice.cloud' ),
			'empty'                 => array( '' ),
			'another scheme'        => array( 'ftp://api.atlasvoice.cloud' ),
			'script'                => array( 'javascript:alert(1)' ),
			'credentials in it'     => array( 'https://user:pass@api.atlasvoice.cloud' ),
			'query in it'           => array( 'https://api.atlasvoice.cloud/?next=https://evil.test' ),
			'lookalike of loopback' => array( 'http://localhost.evil.test' ),
		);
	}

	public function test_plain_http_is_accepted_for_a_developers_own_machine_only() {
		$this->assertSame( 'http://localhost:4000', ( new Config( 'http://localhost:4000/', 'x/1' ) )->base_url );
		$this->assertSame( 'http://127.0.0.1:4000', ( new Config( 'http://127.0.0.1:4000', 'x/1' ) )->base_url );
		// Another http address needs the host to say the owner asked for it.
		$this->assertSame( 'http://192.168.1.20:4000', ( new Config( 'http://192.168.1.20:4000', 'x/1', true ) )->base_url );
	}

	public function test_the_client_names_the_host_and_the_sdk() {
		$this->assertSame( 'wordpress/2.5.0 sdk/' . Client::VERSION, ( new Config( 'https://a.test', 'wordpress/2.5.0' ) )->client_name() );
	}

	public function test_a_host_name_cannot_add_a_header_line() {
		$name = ( new Config(
			'https://a.test',
			'wordpress/2.5.0
X-Evil: 1'
		) )->client_name();

		$this->assertStringNotContainsString( '
', $name );
		$this->assertStringNotContainsString(
			'
',
			$name
		);
	}

	// Requests.

	public function test_every_request_goes_to_the_service_with_its_key_name_and_id() {
		$this->transport->answers[] = $this->json( 200, array( 'usage' => array( 'plan' => 'free' ) ) );

		$result = $this->client->usage();

		$request = $this->transport->sent[0];
		$this->assertSame( 'GET', $request->method );
		$this->assertSame( 'https://api.atlasvoice.cloud/v1/usage', $request->url );
		$this->assertSame( 'Bearer ' . self::KEY, $request->headers['Authorization'] );
		$this->assertSame( 'application/json', $request->headers['Accept'] );
		$this->assertSame( 'wordpress/2.5.0 sdk/' . Client::VERSION, $request->headers['X-AtlasVoice-Client'] );
		$this->assertMatchesRegularExpression( '/^[0-9a-f]{16}$/', $request->headers['X-Request-Id'] );
		$this->assertNull( $request->body );
		$this->assertSame( 30, $request->timeout );
		// The id comes back with the result, to find the call in both logs.
		$this->assertSame( $request->headers['X-Request-Id'], $result->request_id );
		$this->assertTrue( $result->ok() );
		$this->assertSame( 'free', $result->data['usage']['plan'] );
	}

	public function test_each_call_has_its_own_request_id() {
		$this->client->usage();
		$this->client->usage();

		$this->assertNotSame( $this->transport->sent[0]->headers['X-Request-Id'], $this->transport->sent[1]->headers['X-Request-Id'] );
	}

	public function test_the_id_the_service_logged_is_the_one_returned() {
		$this->transport->answers[] = $this->json( 200, array(), array( 'X-Request-Id' => '0b9d3c1e-7a52-4f0c-9d1e-2f6a8b7c5d41' ) );
		$this->transport->answers[] = $this->json( 200, array(), array( 'X-Request-Id' => "bad id
X-Evil: 1" ) );

		$replaced = $this->client->usage();
		$hostile  = $this->client->usage();

		$this->assertSame( '0b9d3c1e-7a52-4f0c-9d1e-2f6a8b7c5d41', $replaced->request_id );
		// A value that is not an id is ignored; the id that was sent is kept.
		$this->assertSame( $this->transport->sent[1]->headers['X-Request-Id'], $hostile->request_id );
		// The log line carries the same id as the result.
		$this->assertSame( $replaced->request_id, $this->logger->lines[0]['context']['request_id'] );
	}

	public function test_registering_never_sends_a_key() {
		$this->transport->answers[] = $this->json( 201, array( 'api_key' => 'av_live_new' ) );

		$this->client->register( 'wordpress', 'https://example.org/', 'owner@example.org', 'Example' );

		$request = $this->transport->sent[0];
		$this->assertArrayNotHasKey( 'Authorization', $request->headers );
		$this->assertSame( 'https://api.atlasvoice.cloud/v1/projects/register', $request->url );
		$this->assertSame(
			array(
				'platform' => 'wordpress',
				'site_url' => 'https://example.org/',
				'email'    => 'owner@example.org',
				'name'     => 'Example',
			),
			json_decode( $request->body, true )
		);
		$this->assertSame( 'application/json', $request->headers['Content-Type'] );
	}

	public function test_a_project_without_a_key_sends_no_authorization_header() {
		$this->keys->key = '';

		$this->client->usage();

		$this->assertArrayNotHasKey( 'Authorization', $this->transport->sent[0]->headers );
	}

	public function test_the_key_is_read_for_every_call_so_a_replaced_key_is_used_at_once() {
		$this->client->usage();
		$this->keys->key = 'av_live_replaced';
		$this->client->usage();

		$this->assertSame( 'Bearer av_live_replaced', $this->transport->sent[1]->headers['Authorization'] );
	}

	/**
	 * @dataProvider paths_that_leave_the_service
	 */
	public function test_a_path_can_never_send_the_key_to_another_host( $path ) {
		try {
			$this->client->request( 'GET', $path );
			$this->fail( 'The path was accepted: ' . $path );
		} catch ( InvalidArgumentException $e ) {
			$this->assertCount( 0, $this->transport->sent, 'A request was sent.' );
		}
	}

	public function paths_that_leave_the_service() {
		return array(
			'full address'      => array( 'https://evil.test/v1/usage' ),
			'protocol relative' => array( '//evil.test/v1/usage' ),
			'no leading slash'  => array( 'v1/usage' ),
			'at sign trick'     => array( '@evil.test/v1/usage' ),
			'address inside'    => array( '/v1/usage?next=https://evil.test' ),
			'backslash'         => array( '/\\evil.test' ),
			'line break'        => array( "/v1/usage\r\nHost: evil.test" ),
			'space'             => array( '/v1/usage evil' ),
			'empty'             => array( '' ),
		);
	}

	public function test_the_timeout_is_kept_within_bounds() {
		$this->client->request( 'GET', '/v1/usage', null, false, 99999 );
		$this->client->request( 'GET', '/v1/usage', null, false, -5 );

		$this->assertSame( Client::MAX_TIMEOUT, $this->transport->sent[0]->timeout );
		$this->assertSame( 1, $this->transport->sent[1]->timeout );
	}

	public function test_text_with_broken_bytes_still_makes_a_valid_request() {
		$this->transport->answers[] = new Response( 200, array( 'content-type' => 'audio/mpeg' ), 'mp3' );

		$this->client->synthesize( "Caf\xE9 au lait", 'fr-FR' );

		$body = json_decode( $this->transport->sent[0]->body, true );
		$this->assertIsArray( $body, 'The body is not valid JSON.' );
		$this->assertStringStartsWith( 'Caf', $body['text'] );
	}

	// Synthesize.

	public function test_synthesize_asks_for_audio_and_returns_the_bytes() {
		$this->transport->answers[] = new Response(
			200,
			array(
				'Content-Type'       => 'audio/mpeg',
				'X-AtlasVoice-Chars' => '11',
			),
			"ID3\x03bytes"
		);

		$result = $this->client->synthesize(
			'Hello world',
			'en-GB',
			array(
				'ref'         => 'post-42',
				'total_chars' => 4200,
			)
		);

		$request = $this->transport->sent[0];
		$this->assertSame( 'POST', $request->method );
		$this->assertSame( 'https://api.atlasvoice.cloud/v1/synthesize?raw=1', $request->url );
		$this->assertSame( 'audio/mpeg', $request->headers['Accept'] );
		$this->assertSame( 120, $request->timeout );
		$this->assertSame(
			array(
				'text'        => 'Hello world',
				'lang'        => 'en-GB',
				'engine'      => 'gtts',
				'ref'         => 'post-42',
				'total_chars' => 4200,
			),
			json_decode( $request->body, true )
		);
		$this->assertTrue( $result->ok() );
		$this->assertSame( "ID3\x03bytes", $result->data );
		// Header names are matched in any case.
		$this->assertSame( '11', $result->header( 'x-atlasvoice-chars' ) );
		$this->assertSame( '11', $result->header( 'X-AtlasVoice-Chars' ) );
	}

	public function test_synthesize_can_name_another_engine() {
		$this->client->synthesize( 'Hello', 'en', array( 'engine' => 'cloud' ) );

		$this->assertSame( 'cloud', json_decode( $this->transport->sent[0]->body, true )['engine'] );
	}

	public function test_a_json_answer_to_an_audio_request_is_not_taken_for_audio() {
		$this->transport->answers[] = $this->json( 200, array( 'url' => 'https://api.atlasvoice.cloud/files/x.mp3' ) );

		$result = $this->client->synthesize( 'Hello', 'en' );

		$this->assertIsArray( $result->data );
	}

	// Errors.

	public function test_an_error_gives_the_services_code_and_message() {
		$this->transport->answers[] = $this->json(
			402,
			array(
				'error' => array(
					'code'    => 'quota_exceeded',
					'message' => 'The monthly allowance is used up.',
				),
			)
		);

		$result = $this->client->synthesize( 'Hello', 'en' );

		$this->assertFalse( $result->ok() );
		$this->assertTrue( $result->reached() );
		$this->assertSame( 402, $result->status );
		$this->assertSame( Error_Codes::QUOTA_EXCEEDED, $result->error );
		$this->assertSame( Error_Codes::QUOTA_EXCEEDED, $result->code() );
		$this->assertSame( 'The monthly allowance is used up.', $result->message );
		$this->assertFalse( $result->is_temporary() );
	}

	public function test_a_service_that_cannot_be_reached_is_a_result_not_an_exception() {
		// No answer queued: the transport reports a network failure.
		$result = $this->client->usage();

		$this->assertFalse( $result->ok() );
		$this->assertFalse( $result->reached() );
		$this->assertSame( 0, $result->status );
		$this->assertSame( '', $result->error );
		$this->assertSame( Error_Codes::UNREACHABLE, $result->code() );
		$this->assertSame( 'Could not resolve host.', $result->transport_error );
		$this->assertTrue( $result->is_temporary() );
	}

	/**
	 * @dataProvider temporary_answers
	 */
	public function test_busy_and_down_are_marked_as_worth_trying_again( $status, $code ) {
		$this->transport->answers[] = $this->json( $status, array( 'error' => array( 'code' => $code ) ) );

		$this->assertTrue( $this->client->usage()->is_temporary() );
	}

	public function temporary_answers() {
		return array(
			'rate limited' => array( 429, 'rate_limited' ),
			'busy'         => array( 503, 'server_busy' ),
			'unavailable'  => array( 503, 'service_unavailable' ),
			'any 5xx'      => array( 500, 'something_new' ),
		);
	}

	/**
	 * @dataProvider hostile_answers
	 */
	public function test_nothing_in_an_answer_is_trusted( $body, $expected_code ) {
		$this->transport->answers[] = new Response( 500, array( 'content-type' => 'application/json' ), $body );

		$result = $this->client->usage();

		$this->assertSame( $expected_code, $result->error );
		$this->assertFalse( $result->ok() );
	}

	public function hostile_answers() {
		return array(
			'html error page'    => array( '<html><body>502 Bad Gateway</body></html>', '' ),
			'empty'              => array( '', '' ),
			'code is markup'     => array( '{"error":{"code":"<script>alert(1)</script>"}}', '' ),
			'code is an array'   => array( '{"error":{"code":["quota_exceeded"]}}', '' ),
			'error is a string'  => array( '{"error":"quota_exceeded"}', '' ),
			'very long code'     => array( '{"error":{"code":"' . str_repeat( 'a', 200 ) . '"}}', '' ),
			'a code it can read' => array( '{"error":{"code":"server_busy"}}', 'server_busy' ),
		);
	}

	public function test_a_transport_that_returns_rubbish_is_handled() {
		$broken = new class() implements Http_Transport {
			public function send( Request $request ) {
				return null;
			}
		};
		$client = new Client( new Config( 'https://api.atlasvoice.cloud', 'x/1' ), $broken, $this->keys );

		$result = $client->usage();

		$this->assertFalse( $result->reached() );
		$this->assertSame( Error_Codes::UNREACHABLE, $result->code() );
	}

	// Logging.

	public function test_each_call_is_logged_with_safe_facts_only() {
		$this->transport->answers[] = new Response( 200, array( 'content-type' => 'audio/mpeg' ), 'mp3' );

		$result = $this->client->synthesize( 'A sentence from a private post', 'en', array( 'ref' => 'post-42' ) );

		$this->assertCount( 1, $this->logger->lines );
		$line = $this->logger->lines[0];
		$this->assertSame( 'info', $line['level'] );
		$this->assertSame( 'request', $line['event'] );
		$this->assertSame( array( 'method', 'route', 'status', 'code', 'reached', 'ms', 'request_id' ), array_keys( $line['context'] ) );
		$this->assertSame( '/v1/synthesize', $line['context']['route'] );
		$this->assertSame( $result->request_id, $line['context']['request_id'] );

		$logged = json_encode( $this->logger->lines );
		$this->assertStringNotContainsString( self::KEY, $logged );
		$this->assertStringNotContainsString( 'private post', $logged );
		$this->assertStringNotContainsString( 'Bearer', $logged );
	}

	public function test_a_failed_call_is_logged_as_an_error_with_its_code() {
		$this->transport->answers[] = $this->json( 401, array( 'error' => array( 'code' => 'invalid_api_key' ) ) );

		$this->client->usage();

		$this->assertSame( 'error', $this->logger->lines[0]['level'] );
		$this->assertSame( 'invalid_api_key', $this->logger->lines[0]['context']['code'] );
	}

	public function test_the_key_is_in_no_result() {
		$this->transport->answers[] = $this->json( 401, array( 'error' => array( 'code' => 'invalid_api_key' ) ) );

		$result = $this->client->usage();

		$this->assertStringNotContainsString( self::KEY, json_encode( get_object_vars( $result ) ) );
	}

	public function test_the_client_works_without_a_logger() {
		$client = new Client( new Config( 'https://api.atlasvoice.cloud', 'x/1' ), $this->transport, $this->keys );

		$this->assertFalse( $client->usage()->reached() );
	}

	// Licences.

	public function test_licence_calls_use_the_documented_routes() {
		$this->client->attach_license( 'sk_licence' );
		$this->client->detach_license();

		$this->assertSame( 'POST', $this->transport->sent[0]->method );
		$this->assertSame( 'https://api.atlasvoice.cloud/v1/projects/license', $this->transport->sent[0]->url );
		$this->assertSame( array( 'license_key' => 'sk_licence' ), json_decode( $this->transport->sent[0]->body, true ) );
		$this->assertSame( 'DELETE', $this->transport->sent[1]->method );
		$this->assertNull( $this->transport->sent[1]->body );
	}
}
