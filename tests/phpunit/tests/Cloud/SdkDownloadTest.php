<?php
/**
 * Tests for downloading a finished audio file through the SDK (TTS-378).
 *
 * The file's address comes from a response, so these tests are mostly
 * about what must never be fetched and what must never be sent.
 *
 * @package TTA
 */

use AtlasVoice\Sdk\Client;
use AtlasVoice\Sdk\Config;
use AtlasVoice\Sdk\Contracts\Http_Transport;
use AtlasVoice\Sdk\Contracts\Key_Store;
use AtlasVoice\Sdk\Request;
use AtlasVoice\Sdk\Response;
use TTA\Cloud\WP_Http_Transport;

class Download_Fake_Transport implements Http_Transport {

	/**
	 * @var Request[]
	 */
	public $sent = array();

	/**
	 * @var Response|null
	 */
	public $answer;

	public function send( Request $request ) {
		$this->sent[] = $request;

		return $this->answer ? $this->answer : new Response( 200, array( 'Content-Type' => 'audio/mpeg' ), 'mp3-bytes' );
	}
}

class Download_Fake_Keys implements Key_Store {

	public function get_key() {
		return 'av_live_secret_0123456789';
	}
}

/**
 * @covers \AtlasVoice\Sdk\Client
 * @covers \AtlasVoice\Sdk\Request
 * @covers \TTA\Cloud\WP_Http_Transport
 */
class SdkDownloadTest extends WP_UnitTestCase {

	/**
	 * @var Download_Fake_Transport
	 */
	private $transport;

	/**
	 * @var Client
	 */
	private $client;

	public function set_up() {
		parent::set_up();
		$this->transport = new Download_Fake_Transport();
		$this->client    = new Client( new Config( 'https://voice.atlasvoice.cloud', 'wordpress/2.5.0' ), $this->transport, new Download_Fake_Keys() );
	}

	public function test_a_file_on_the_service_host_is_downloaded_untouched() {
		$result = $this->client->download( 'https://voice.atlasvoice.cloud/files/abc123.mp3' );

		$this->assertTrue( $result->ok() );
		$this->assertSame( 'mp3-bytes', $result->data );
		$this->assertSame( 'GET', $this->transport->sent[0]->method );
		$this->assertSame( 'https://voice.atlasvoice.cloud/files/abc123.mp3', $this->transport->sent[0]->url );
	}

	public function test_the_project_key_is_never_sent_with_a_download() {
		$this->client->download( 'https://voice.atlasvoice.cloud/files/abc123.mp3' );
		$this->client->download( 'https://files.atlasvoice.cloud/abc123.mp3', array( '.atlasvoice.cloud' ) );

		foreach ( $this->transport->sent as $request ) {
			$this->assertArrayNotHasKey( 'Authorization', $request->headers );
			$this->assertStringNotContainsString( 'av_live_secret', wp_json_encode( $request ) );
		}
		$this->assertCount( 2, $this->transport->sent );
	}

	public function test_a_download_is_named_and_can_be_followed_in_the_logs() {
		$result = $this->client->download( 'https://voice.atlasvoice.cloud/files/abc123.mp3' );

		$headers = $this->transport->sent[0]->headers;
		$this->assertSame( $result->request_id, $headers['X-Request-Id'] );
		$this->assertStringStartsWith( 'wordpress/2.5.0 sdk/', $headers['X-AtlasVoice-Client'] );
	}

	public function test_a_redirect_is_not_followed() {
		$this->client->download( 'https://voice.atlasvoice.cloud/files/abc123.mp3' );

		$this->assertFalse( $this->transport->sent[0]->follow_redirects );
	}

	public function test_a_redirect_answer_is_not_a_file() {
		$this->transport->answer = new Response( 302, array( 'Location' => 'http://169.254.169.254/latest/meta-data/' ), '' );

		$result = $this->client->download( 'https://voice.atlasvoice.cloud/files/abc123.mp3' );

		$this->assertFalse( $result->ok() );
		$this->assertNull( $result->data );
	}

	public function test_an_error_page_is_not_a_file() {
		$this->transport->answer = new Response( 404, array( 'Content-Type' => 'text/html' ), '<h1>Not found</h1>' );

		$result = $this->client->download( 'https://voice.atlasvoice.cloud/files/gone.mp3' );

		$this->assertFalse( $result->ok() );
		$this->assertNull( $result->data );
	}

	/**
	 * @dataProvider refused_addresses
	 */
	public function test_an_address_that_is_not_on_the_service_is_never_fetched( $url ) {
		$result = $this->client->download( $url, array( '.atlasvoice.cloud', 'cdn.example.org' ) );

		$this->assertSame( array(), $this->transport->sent, 'Nothing may leave the site for: ' . $url );
		$this->assertFalse( $result->reached() );
		$this->assertNotSame( '', $result->transport_error );
	}

	public function refused_addresses() {
		return array(
			'another host'              => array( 'https://evil.example/files/a.mp3' ),
			'the cloud metadata server' => array( 'http://169.254.169.254/latest/meta-data/' ),
			'the site itself'           => array( 'http://localhost/wp-admin/' ),
			'a private address'         => array( 'https://10.0.0.5/files/a.mp3' ),
			'plain http on our domain'  => array( 'http://files.atlasvoice.cloud/a.mp3' ),
			'plain http on own host'    => array( 'http://voice.atlasvoice.cloud/files/a.mp3' ),
			'a look-alike domain'       => array( 'https://voice.atlasvoice.cloud.evil.example/a.mp3' ),
			'a suffix trick'            => array( 'https://evilatlasvoice.cloud/a.mp3' ),
			'user info trick'           => array( 'https://voice.atlasvoice.cloud@evil.example/a.mp3' ),
			'a password in the address' => array( 'https://user:pass@voice.atlasvoice.cloud/a.mp3' ),
			'a file on the server'      => array( 'file:///etc/passwd' ),
			'another scheme'            => array( 'ftp://voice.atlasvoice.cloud/a.mp3' ),
			'no scheme'                 => array( '//voice.atlasvoice.cloud/a.mp3' ),
			'a path only'               => array( '/files/a.mp3' ),
			'empty'                     => array( '' ),
			'a line break'              => array( "https://voice.atlasvoice.cloud/a.mp3\r\nHost: evil.example" ),
			'a backslash'               => array( 'https://voice.atlasvoice.cloud\\@evil.example/a.mp3' ),
			'a space'                   => array( 'https://voice.atlasvoice.cloud/a b.mp3' ),
			'far too long'              => array( 'https://voice.atlasvoice.cloud/' . str_repeat( 'a', 2100 ) ),
		);
	}

	public function test_an_allowed_host_without_a_dot_is_that_host_only() {
		$this->client->download( 'https://sub.cdn.example.org/a.mp3', array( 'cdn.example.org' ) );
		$this->assertSame( array(), $this->transport->sent );

		$this->client->download( 'https://cdn.example.org/a.mp3', array( 'cdn.example.org' ) );
		$this->assertCount( 1, $this->transport->sent );
	}

	public function test_an_empty_allow_list_entry_allows_nothing() {
		$this->client->download( 'https://evil.example/a.mp3', array( '', '.', null ) );

		$this->assertSame( array(), $this->transport->sent );
	}

	public function test_a_developers_local_service_can_serve_files_over_http() {
		$client = new Client( new Config( 'http://127.0.0.1:8080', 'wordpress/2.5.0' ), $this->transport, new Download_Fake_Keys() );

		$this->assertTrue( $client->download( 'http://127.0.0.1:8080/files/a.mp3' )->ok() );
	}

	public function test_the_timeout_is_kept_within_bounds() {
		$this->client->download( 'https://voice.atlasvoice.cloud/files/a.mp3', array(), 99999 );

		$this->assertSame( Client::MAX_TIMEOUT, $this->transport->sent[0]->timeout );
	}

	public function test_wordpress_is_told_not_to_follow_the_redirect() {
		$seen = null;
		$spy  = static function ( $pre, $args ) use ( &$seen ) {
			$seen = $args;

			return new WP_Error( 'http_request_failed', 'stopped by the test' );
		};
		add_filter( 'pre_http_request', $spy, 10, 2 );

		( new WP_Http_Transport() )->send( new Request( 'GET', 'https://voice.atlasvoice.cloud/files/a.mp3', array(), null, 30, false ) );
		$download = $seen;
		( new WP_Http_Transport() )->send( new Request( 'GET', 'https://api.atlasvoice.cloud/v1/usage', array(), null, 30 ) );
		$call = $seen;

		remove_filter( 'pre_http_request', $spy, 10 );

		$this->assertSame( 0, $download['redirection'] );
		$this->assertNotSame( 0, $call['redirection'], 'An ordinary call keeps the WordPress default.' );
	}
}
