<?php
/**
 * Tests for the WordPress adapter of the AtlasVoice SDK (includes/Cloud), TTS-378.
 *
 * @package TTA
 */

use AtlasVoice\Sdk\Request;
use TTA\Cloud\Cloud;
use TTA\Cloud\Option_Key_Store;
use TTA\Cloud\Request_Log;
use TTA\Cloud\WP_Http_Transport;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Cloud\Cloud
 * @covers \TTA\Cloud\WP_Http_Transport
 * @covers \TTA\Cloud\Option_Key_Store
 * @covers \TTA\Cloud\Request_Log
 */
class WordPressAdapterTest extends WP_UnitTestCase {

	/**
	 * What WordPress was asked to send.
	 *
	 * @var array|null
	 */
	private $sent;

	/**
	 * What to answer.
	 *
	 * @var array|WP_Error
	 */
	private $answer;

	public function set_up() {
		parent::set_up();
		delete_option( Service::OPTION );
		$this->sent   = null;
		$this->answer = new WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out' );
		add_filter( 'pre_http_request', array( $this, 'intercept' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'intercept' ), 10 );
		remove_all_filters( 'atlasvoice_service_url' );
		remove_all_actions( 'atlasvoice_cloud_request' );
		parent::tear_down();
	}

	public function intercept( $pre, $args, $url ) {
		$this->sent = compact( 'url', 'args' );

		return $this->answer;
	}

	// The transport.

	public function test_the_transport_passes_the_request_to_wordpress_unchanged() {
		$this->answer = array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'headers'  => new \WpOrg\Requests\Utility\CaseInsensitiveDictionary(
				array(
					'Content-Type'       => 'audio/mpeg',
					'X-AtlasVoice-Chars' => '11',
				)
			),
			'body'     => 'mp3-bytes',
			'cookies'  => array(),
		);

		$response = ( new WP_Http_Transport() )->send(
			new Request( 'post', 'https://api.atlasvoice.cloud/v1/synthesize?raw=1', array( 'Accept' => 'audio/mpeg' ), '{"text":"Hi"}', 120 )
		);

		$this->assertSame( 'https://api.atlasvoice.cloud/v1/synthesize?raw=1', $this->sent['url'] );
		$this->assertSame( 'POST', $this->sent['args']['method'] );
		$this->assertSame( 120, $this->sent['args']['timeout'] );
		$this->assertSame( array( 'Accept' => 'audio/mpeg' ), $this->sent['args']['headers'] );
		$this->assertSame( '{"text":"Hi"}', $this->sent['args']['body'] );
		// Certificate checks stay on: the transport never turns them off.
		$this->assertTrue( $this->sent['args']['sslverify'] );

		$this->assertSame( 200, $response->status );
		$this->assertSame( 'mp3-bytes', $response->body );
		$this->assertSame( '11', $response->headers['x-atlasvoice-chars'] );
		$this->assertSame( '', $response->transport_error );
	}

	public function test_a_network_failure_is_an_answer_not_an_exception() {
		$response = ( new WP_Http_Transport() )->send( new Request( 'GET', 'https://api.atlasvoice.cloud/v1/usage', array(), null, 30 ) );

		$this->assertSame( 0, $response->status );
		$this->assertSame( 'cURL error 28: Operation timed out', $response->transport_error );
	}

	public function test_a_request_without_a_body_sends_none() {
		( new WP_Http_Transport() )->send( new Request( 'GET', 'https://api.atlasvoice.cloud/v1/usage', array(), null, 30 ) );

		$this->assertEmpty( $this->sent['args']['body'] );
	}

	// The key store.

	public function test_the_key_is_read_from_the_option_the_plugin_has_always_used() {
		$store = new Option_Key_Store( Service::OPTION );

		$this->assertSame( '', $store->get_key() );

		update_option( Service::OPTION, array( 'api_key' => 'av_live_abc' ), false );
		$this->assertSame( 'av_live_abc', $store->get_key() );
	}

	/**
	 * @dataProvider broken_states
	 */
	public function test_a_damaged_option_gives_no_key_and_no_error( $state ) {
		update_option( Service::OPTION, $state, false );

		$this->assertSame( '', ( new Option_Key_Store( Service::OPTION ) )->get_key() );
	}

	public function broken_states() {
		return array(
			'a string'        => array( 'av_live_abc' ),
			'key is an array' => array( array( 'api_key' => array( 'av_live_abc' ) ) ),
			'no key field'    => array( array( 'email' => 'owner@example.org' ) ),
			'an object'       => array( (object) array( 'api_key' => 'av_live_abc' ) ),
		);
	}

	// The log.

	public function test_every_call_fires_an_action_a_site_can_monitor() {
		$seen = array();
		add_action(
			'atlasvoice_cloud_request',
			static function ( $context, $level ) use ( &$seen ) {
				$seen[] = compact( 'context', 'level' );
			},
			10,
			2
		);

		( new Request_Log() )->log(
			'error',
			'request',
			array(
				'route'      => '/v1/usage',
				'status'     => 503,
				'request_id' => 'abc',
			)
		);

		$this->assertCount( 1, $seen );
		$this->assertSame( 'error', $seen[0]['level'] );
		$this->assertSame( 503, $seen[0]['context']['status'] );
	}

	public function test_a_real_call_reports_its_route_status_and_id_and_never_the_key() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value',
			),
			false
		);
		$seen = array();
		add_action(
			'atlasvoice_cloud_request',
			static function ( $context ) use ( &$seen ) {
				$seen[] = $context;
			}
		);

		Service::refresh_usage( true );

		$this->assertCount( 1, $seen );
		$this->assertSame( '/v1/usage', $seen[0]['route'] );
		$this->assertSame( 0, $seen[0]['status'] );
		$this->assertFalse( $seen[0]['reached'] );
		$this->assertSame( $this->sent['args']['headers']['X-Request-Id'], $seen[0]['request_id'] );
		$this->assertStringNotContainsString( 'av_live_secret_key_value', wp_json_encode( $seen ) );
	}

	// The factory.

	public function test_the_plugin_gets_one_client_per_service_address() {
		$this->assertSame( Cloud::client(), Cloud::client() );
	}

	public function test_the_client_talks_to_the_live_service_by_default() {
		Cloud::client()->usage();

		$this->assertStringStartsWith( 'https://api.atlasvoice.cloud/v1/', $this->sent['url'] );
	}

	public function test_a_developer_can_point_the_client_at_a_local_service() {
		add_filter(
			'atlasvoice_service_url',
			static function () {
				return 'http://192.168.1.20:4000/';
			}
		);

		Cloud::client()->usage();

		$this->assertSame( 'http://192.168.1.20:4000/v1/usage', $this->sent['url'] );
	}

	public function test_an_unusable_address_falls_back_to_the_live_service_and_does_not_break_the_site() {
		add_filter(
			'atlasvoice_service_url',
			static function () {
				return 'not a web address';
			}
		);
		$this->setExpectedIncorrectUsage( 'TTA\Cloud\Cloud::client' );

		Cloud::client()->usage();

		$this->assertSame( 'https://api.atlasvoice.cloud/v1/usage', $this->sent['url'] );
	}

	public function test_the_client_names_wordpress_and_the_plugin_version() {
		Cloud::client()->usage();

		$this->assertStringStartsWith( 'wordpress/' . TEXT_TO_AUDIO_VERSION . ' sdk/', $this->sent['args']['headers']['X-AtlasVoice-Client'] );
	}

	// Back-off and the circuit breaker.

	public function test_a_service_that_is_down_is_not_called_again_and_again() {
		for ( $i = 0; $i < 7; $i++ ) {
			$this->sent = null;
			$result     = Cloud::client()->usage();
		}

		$this->assertNull( $this->sent, 'After five failures in a row no request leaves the site.' );
		$this->assertFalse( $result->reached() );
	}

	public function test_the_pause_is_shared_by_every_request_of_the_site() {
		for ( $i = 0; $i < 5; $i++ ) {
			Cloud::client()->usage();
		}

		// The next page load builds a new client; the state is in a transient.
		Cloud::reset();
		$this->sent = null;
		Cloud::client()->usage();

		$this->assertNull( $this->sent );
		$this->assertIsArray( get_transient( Cloud::STATE_PREFIX . md5( 'https://api.atlasvoice.cloud' ) ) );
	}

	public function test_a_paused_call_tells_a_monitor_it_was_skipped() {
		$events = array();
		add_action(
			'atlasvoice_cloud_request',
			static function ( $context, $level, $event ) use ( &$events ) {
				$events[] = $event;
			},
			10,
			3
		);

		for ( $i = 0; $i < 6; $i++ ) {
			Cloud::client()->usage();
		}

		$this->assertSame( array( 'request', 'request', 'request', 'request', 'request', 'request_skipped' ), $events );
	}

	public function test_a_developer_can_turn_the_pause_off() {
		Cloud::reset();
		add_filter( 'atlasvoice_cloud_circuit_breaker', '__return_false' );

		for ( $i = 0; $i < 7; $i++ ) {
			$this->sent = null;
			Cloud::client()->usage();
		}

		remove_filter( 'atlasvoice_cloud_circuit_breaker', '__return_false' );
		Cloud::reset();

		$this->assertNotNull( $this->sent );
	}

	// A second address of the service.

	public function test_the_voice_host_gets_its_own_client_with_the_same_key_and_name() {
		update_option( Service::OPTION, array( 'api_key' => 'av_live_abc' ), false );

		$voice = Cloud::client_for( 'https://voice.atlasvoice.cloud' );
		$voice->request( 'POST', '/api/atlasvoice', array( 'text' => 'Hi' ) );

		$this->assertNotSame( Cloud::client(), $voice );
		$this->assertSame( $voice, Cloud::client_for( 'https://voice.atlasvoice.cloud' ) );
		$this->assertSame( 'https://voice.atlasvoice.cloud/api/atlasvoice', $this->sent['url'] );
		$this->assertSame( 'Bearer av_live_abc', $this->sent['args']['headers']['Authorization'] );
		$this->assertStringStartsWith( 'wordpress/', $this->sent['args']['headers']['X-AtlasVoice-Client'] );
	}

	public function test_one_host_being_down_does_not_pause_the_other() {
		for ( $i = 0; $i < 6; $i++ ) {
			Cloud::client_for( 'https://voice.atlasvoice.cloud' )->request( 'POST', '/api/atlasvoice', array() );
		}

		$this->sent = null;
		Cloud::client()->usage();

		$this->assertSame( 'https://api.atlasvoice.cloud/v1/usage', $this->sent['url'] );
	}

	public function test_an_owner_who_set_a_plain_http_voice_host_on_purpose_keeps_it() {
		Cloud::client_for( 'http://192.168.1.30:8080', true )->request( 'POST', '/api/atlasvoice', array() );

		$this->assertSame( 'http://192.168.1.30:8080/api/atlasvoice', $this->sent['url'] );
	}

	public function test_the_voice_host_must_be_https_too() {
		$this->setExpectedIncorrectUsage( 'TTA\Cloud\Cloud::client' );

		Cloud::client_for( 'http://voice.example.org' )->usage();

		$this->assertStringStartsWith( 'https://api.atlasvoice.cloud/', $this->sent['url'] );
	}
}
