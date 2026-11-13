<?php
/**
 * Pins what the plugin sends to the AtlasVoice service, and how it reads the
 * answers (TTS-378).
 *
 * These tests were written against the code as it was before the service
 * calls moved into the core client, and passed there. They must keep
 * passing: the move may not change a request or a result.
 *
 * No request leaves the machine: every call is answered by the
 * `pre_http_request` filter.
 *
 * @package TTA
 */

use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\TTA_AtlasVoice_Service
 */
class ServiceRequestsTest extends WP_UnitTestCase {

	const KEY = 'av_live_0123456789abcdef0123456789abcdef';

	/**
	 * Requests the plugin made, in order.
	 *
	 * @var array[]
	 */
	private $sent = array();

	/**
	 * Answers to give, in order. Each is an array for a response or a WP_Error.
	 *
	 * @var array
	 */
	private $answers = array();

	public function set_up() {
		parent::set_up();
		delete_option( Service::OPTION );
		$this->sent    = array();
		$this->answers = array();
		add_filter( 'pre_http_request', array( $this, 'answer' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer' ), 10 );
		parent::tear_down();
	}

	public function answer( $pre, $args, $url ) {
		$this->sent[] = array(
			'url'  => $url,
			'args' => $args,
		);

		if ( ! $this->answers ) {
			return new WP_Error( 'http_request_failed', 'No answer queued.' );
		}

		return array_shift( $this->answers );
	}

	private function json( $status, array $body, array $headers = array() ) {
		return array(
			'response' => array(
				'code'    => $status,
				'message' => '',
			),
			'headers'  => new \WpOrg\Requests\Utility\CaseInsensitiveDictionary( array_merge( array( 'content-type' => 'application/json' ), $headers ) ),
			'body'     => wp_json_encode( $body ),
			'cookies'  => array(),
		);
	}

	private function audio( $bytes, array $headers = array() ) {
		return array(
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
			'headers'  => new \WpOrg\Requests\Utility\CaseInsensitiveDictionary( array_merge( array( 'content-type' => 'audio/mpeg' ), $headers ) ),
			'body'     => $bytes,
			'cookies'  => array(),
		);
	}

	private function connect_site() {
		update_option(
			Service::OPTION,
			array(
				'consent'    => true,
				'api_key'    => self::KEY,
				'key_prefix' => 'av_live_0123',
				'email'      => 'owner@example.org',
			),
			false
		);
	}

	private function usage( array $changes = array() ) {
		return array_merge(
			array(
				'plan'            => 'free',
				'period'          => '2026-11',
				'chars_used'      => 1200,
				'chars_limit'     => 100000,
				'chars_remaining' => 98800,
				'requests'        => 3,
				'resets_at'       => '2026-12-01T00:00:00Z',
			),
			$changes
		);
	}

	public function test_connect_registers_the_site_without_an_old_key() {
		$this->connect_site();
		$this->answers[] = $this->json(
			201,
			array(
				'api_key'    => self::KEY,
				'key_prefix' => 'av_live_0123',
				'project_id' => 37,
				'plan'       => 'free',
				'approval'   => 'approved',
			)
		);
		// Connecting reads the allowance straight away.
		$this->answers[] = $this->json( 200, array( 'usage' => $this->usage() ) );

		$result = Service::connect( 'Owner@Example.org' );

		$this->assertTrue( $result );
		$request = $this->sent[0];
		$this->assertSame( Service::base_url() . '/v1/projects/register', $request['url'] );
		$this->assertSame( 'POST', $request['args']['method'] );
		$this->assertSame( 30, $request['args']['timeout'] );
		$this->assertSame( 'application/json', $request['args']['headers']['Accept'] );
		$this->assertSame( 'application/json', $request['args']['headers']['Content-Type'] );
		$this->assertStringStartsWith( 'wordpress/' . TEXT_TO_AUDIO_VERSION, $request['args']['headers']['X-AtlasVoice-Client'] );
		// A new registration must not carry the previous key.
		$this->assertArrayNotHasKey( 'Authorization', $request['args']['headers'] );
		$this->assertSame(
			array(
				'platform' => 'wordpress',
				'site_url' => home_url( '/' ),
				'email'    => 'Owner@Example.org',
				'name'     => get_bloginfo( 'name' ),
			),
			json_decode( $request['args']['body'], true )
		);
		$this->assertTrue( Service::is_connected() );
		$this->assertSame( 37, get_option( Service::OPTION )['project_id'] );
		// The second call reads the allowance, now with the new key.
		$this->assertSame( Service::base_url() . '/v1/usage', $this->sent[1]['url'] );
		$this->assertSame( 'Bearer ' . self::KEY, $this->sent[1]['args']['headers']['Authorization'] );
	}

	public function test_connect_refuses_an_invalid_email_without_calling_the_service() {
		$result = Service::connect( 'not-an-email' );

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_email', $result->get_error_code() );
		$this->assertCount( 0, $this->sent );
	}

	public function test_connect_passes_on_who_owns_the_site() {
		$this->answers[] = $this->json(
			409,
			array(
				'error'      => array(
					'code'    => 'project_exists',
					'message' => 'This site is registered to another email.',
				),
				'owner_hint' => 'a•••@gmail.com',
				'takeover'   => true,
			)
		);

		$result = Service::connect( 'owner@example.org' );

		$this->assertWPError( $result );
		$this->assertSame( 'project_exists', $result->get_error_code() );
		$this->assertSame( 'This site is registered to another email.', $result->get_error_message() );
		$this->assertSame(
			array(
				'status'     => 409,
				'owner_hint' => 'a•••@gmail.com',
				'takeover'   => true,
			),
			$result->get_error_data()
		);
	}

	public function test_usage_is_read_with_the_key_and_remembered() {
		$this->connect_site();
		$this->answers[] = $this->json( 200, array( 'usage' => $this->usage() ) );

		$usage = Service::refresh_usage( true );

		$request = $this->sent[0];
		$this->assertSame( Service::base_url() . '/v1/usage', $request['url'] );
		$this->assertSame( 'GET', $request['args']['method'] );
		$this->assertSame( 'Bearer ' . self::KEY, $request['args']['headers']['Authorization'] );
		$this->assertEmpty( $request['args']['body'] );
		$this->assertSame( 98800, $usage['chars_remaining'] );
		$this->assertSame( 'free', get_option( Service::OPTION )['plan'] );
	}

	public function test_usage_is_not_asked_again_within_ten_minutes() {
		$this->connect_site();
		$this->answers[] = $this->json( 200, array( 'usage' => $this->usage() ) );

		Service::refresh_usage( true );
		Service::refresh_usage();

		$this->assertCount( 1, $this->sent );
	}

	public function test_a_site_that_is_not_connected_calls_nothing() {
		$this->assertSame( array(), Service::refresh_usage( true ) );
		$this->assertSame(
			array(
				'ok'   => false,
				'code' => 'not_connected',
			),
			Service::synthesize( 'Hello', 'en' )
		);
		$this->assertCount( 0, $this->sent );
	}

	public function test_synthesize_sends_one_part_and_returns_the_audio() {
		$this->connect_site();
		$this->answers[] = $this->audio( "ID3\x03fake-mp3-bytes", array( 'x-atlasvoice-chars' => '11' ) );

		$result = Service::synthesize( 'Hello world', 'en-GB', 'post-42', 4200 );

		$request = $this->sent[0];
		$this->assertSame( Service::base_url() . '/v1/synthesize?raw=1', $request['url'] );
		$this->assertSame( 'POST', $request['args']['method'] );
		$this->assertSame( 120, $request['args']['timeout'] );
		$this->assertSame( 'audio/mpeg', $request['args']['headers']['Accept'] );
		$this->assertSame( 'Bearer ' . self::KEY, $request['args']['headers']['Authorization'] );
		$this->assertSame(
			array(
				'text'        => 'Hello world',
				'lang'        => 'en-GB',
				'engine'      => 'gtts',
				'ref'         => 'post-42',
				'total_chars' => 4200,
			),
			json_decode( $request['args']['body'], true )
		);
		$this->assertSame(
			array(
				'ok'    => true,
				'audio' => "ID3\x03fake-mp3-bytes",
			),
			$result
		);
	}

	public function test_synthesize_leaves_total_chars_out_when_it_is_not_given() {
		$this->connect_site();
		$this->answers[] = $this->audio( 'mp3' );

		Service::synthesize( 'Hello', 'en' );

		$this->assertSame(
			array(
				'text'   => 'Hello',
				'lang'   => 'en',
				'engine' => 'gtts',
				'ref'    => '',
			),
			json_decode( $this->sent[0]['args']['body'], true )
		);
	}

	public function test_the_timeout_filter_still_applies() {
		$this->connect_site();
		$this->answers[] = $this->audio( 'mp3' );
		add_filter( 'atlasvoice_service_timeout', array( $this, 'forty_five' ) );

		Service::synthesize( 'Hello', 'en' );

		remove_filter( 'atlasvoice_service_timeout', array( $this, 'forty_five' ) );

		$this->assertSame( 45, $this->sent[0]['args']['timeout'] );
	}

	public function forty_five() {
		return 45;
	}

	public function test_an_empty_allowance_is_remembered_and_stops_further_calls() {
		$this->connect_site();
		$this->answers[] = $this->json(
			402,
			array(
				'error' => array(
					'code'    => 'quota_exceeded',
					'message' => 'The monthly allowance is used up.',
				),
				'usage' => $this->usage(
					array(
						'chars_used'      => 100000,
						'chars_remaining' => 0,
						'resets_at'       => gmdate( 'Y-m-d\TH:i:s\Z', time() + DAY_IN_SECONDS ),
					)
				),
			)
		);

		$first  = Service::synthesize( 'Hello', 'en' );
		$second = Service::synthesize( 'Hello again', 'en' );

		$this->assertSame( 'quota_exceeded', $first['code'] );
		$this->assertSame( 'quota_exceeded', $second['code'] );
		$this->assertTrue( Service::is_exhausted() );
		$this->assertCount( 1, $this->sent, 'A site that is out of characters called the service again.' );
	}

	public function test_a_revoked_key_disconnects_the_site() {
		$this->connect_site();
		$this->answers[] = $this->json(
			401,
			array(
				'error' => array(
					'code'    => 'invalid_api_key',
					'message' => 'Unknown key.',
				),
			)
		);

		$result = Service::synthesize( 'Hello', 'en' );

		$this->assertSame( 'invalid_api_key', $result['code'] );
		$this->assertFalse( Service::is_connected() );
		$this->assertSame( '', get_option( Service::OPTION )['api_key'] );
	}

	public function test_a_pending_approval_is_remembered() {
		$this->connect_site();
		$this->answers[] = $this->json(
			403,
			array(
				'error' => array(
					'code'    => 'approval_required',
					'message' => 'Waiting for approval.',
				),
			)
		);

		Service::synthesize( 'Hello', 'en' );

		$this->assertTrue( Service::is_pending_approval() );
	}

	public function test_a_service_that_cannot_be_reached_is_reported_and_changes_nothing() {
		$this->connect_site();
		$before = get_option( Service::OPTION );
		// No answer queued: the transport fails.

		$result = Service::synthesize( 'Hello', 'en' );

		$this->assertFalse( $result['ok'] );
		$this->assertNotEmpty( $result['code'] );
		$this->assertSame( $before, get_option( Service::OPTION ) );
	}

	public function test_an_empty_audio_answer_is_not_treated_as_audio() {
		$this->connect_site();
		$this->answers[] = $this->audio( '' );

		$result = Service::synthesize( 'Hello', 'en' );

		$this->assertSame(
			array(
				'ok'   => false,
				'code' => 'service_unreachable',
			),
			$result
		);
	}

	public function test_attach_licence_sends_the_key_once_and_stores_only_the_state() {
		$this->connect_site();
		$this->answers[] = $this->json( 200, array( 'usage' => $this->usage( array( 'plan' => 'premium' ) ) ) );

		$result = Service::attach_license( 'sk_freemius_licence_key' );

		$request = $this->sent[0];
		$this->assertTrue( $result );
		$this->assertSame( Service::base_url() . '/v1/projects/license', $request['url'] );
		$this->assertSame( 'POST', $request['args']['method'] );
		$this->assertSame( array( 'license_key' => 'sk_freemius_licence_key' ), json_decode( $request['args']['body'], true ) );
		$this->assertTrue( Service::has_license_attached() );
		// The licence key is sent, never kept.
		$this->assertStringNotContainsString( 'sk_freemius_licence_key', wp_json_encode( get_option( Service::OPTION ) ) );
	}

	public function test_a_licence_that_is_not_active_on_this_site_is_remembered() {
		$this->connect_site();
		$this->answers[] = $this->json(
			409,
			array(
				'error' => array(
					'code'    => 'license_not_active_on_site',
					'message' => 'Activate the licence on this site.',
				),
			)
		);

		$result = Service::attach_license( 'sk_x' );

		$this->assertWPError( $result );
		$this->assertSame( 'license_not_active_on_site', $result->get_error_code() );
		$this->assertTrue( Service::license_not_on_site() );
		$this->assertFalse( Service::has_license_attached() );
	}

	public function test_detach_licence_uses_delete() {
		$this->connect_site();
		$this->answers[] = $this->json( 200, array( 'usage' => $this->usage() ) );

		$this->assertTrue( Service::detach_license() );
		$this->assertSame( 'DELETE', $this->sent[0]['args']['method'] );
		$this->assertSame( Service::base_url() . '/v1/projects/license', $this->sent[0]['url'] );
	}

	public function test_the_key_is_never_part_of_what_admin_screens_receive() {
		$this->connect_site();

		$this->assertStringNotContainsString( self::KEY, wp_json_encode( Service::public_state() ) );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( Service::dashboard_summary() ) );
	}
}
