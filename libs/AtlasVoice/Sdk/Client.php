<?php
/**
 * AtlasVoice SDK: the client of the AtlasVoice Cloud API.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk;

use AtlasVoice\Sdk\Contracts\Http_Transport;
use AtlasVoice\Sdk\Contracts\Key_Store;
use AtlasVoice\Sdk\Contracts\Logger;

/**
 * Talks to AtlasVoice Cloud (`/v1`) for one project.
 *
 * This class and everything beside it is platform-free: no WordPress
 * function, no global, no file access. A platform (WordPress, Shopify, a
 * plain PHP app) gives it three things — how to send a request, where the
 * key lives, where to log — and gets the same client.
 *
 * What it guarantees to every platform:
 *  - the key is read when a request is built and is never returned, logged
 *    or put in an error;
 *  - every address is built from the configured service address, so nothing
 *    in a request or a response can send the key to another host;
 *  - every call carries a request id and the client's name, and returns the
 *    id, so one call can be followed in the logs of both sides;
 *  - a failure is a Result with a stable code, never an exception.
 */
final class Client {

	const VERSION = '0.1.0';

	/**
	 * The longest a single call may wait, whatever a caller asks for. One
	 * part of audio can take minutes on a slow engine; nothing takes longer.
	 */
	const MAX_TIMEOUT = 300;

	const DEFAULT_TIMEOUT = 30;

	/**
	 * Settings.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * Sends requests.
	 *
	 * @var Http_Transport
	 */
	private $transport;

	/**
	 * Holds the key.
	 *
	 * @var Key_Store
	 */
	private $keys;

	/**
	 * Receives one line per call, or null.
	 *
	 * @var Logger|null
	 */
	private $logger;

	/**
	 * Builds a client.
	 *
	 * @param Config         $config    Service address and host name.
	 * @param Http_Transport $transport How to send a request.
	 * @param Key_Store      $keys      Where the project key lives.
	 * @param Logger|null    $logger    Where to report calls, if anywhere.
	 */
	public function __construct( Config $config, Http_Transport $transport, Key_Store $keys, $logger = null ) {
		$this->config    = $config;
		$this->transport = $transport;
		$this->keys      = $keys;
		$this->logger    = $logger instanceof Logger ? $logger : null;
	}

	/**
	 * Asks for a project key for a site or an app. Sent without a key.
	 *
	 * @param string $platform The platform id, in lower case, e.g. "wordpress".
	 * @param string $site_url The site's public address.
	 * @param string $email    Where the service may contact the owner.
	 * @param string $name     The site's name.
	 *
	 * @return Result data: api_key, key_prefix, project_id, plan, approval.
	 */
	public function register( $platform, $site_url, $email, $name ) {
		return $this->request(
			'POST',
			'/v1/projects/register',
			array(
				'platform' => (string) $platform,
				'site_url' => (string) $site_url,
				'email'    => (string) $email,
				'name'     => (string) $name,
			),
			false,
			self::DEFAULT_TIMEOUT,
			false
		);
	}

	/**
	 * Reads the project's plan and allowance.
	 *
	 * @return Result data: usage { plan, chars_used, chars_limit, chars_remaining, resets_at, … }.
	 */
	public function usage() {
		return $this->request( 'GET', '/v1/usage' );
	}

	/**
	 * Attaches a Pro licence to the project. The licence key is sent once;
	 * the service keeps only the licence id.
	 *
	 * @param string $license_key The licence key.
	 *
	 * @return Result
	 */
	public function attach_license( $license_key ) {
		return $this->request( 'POST', '/v1/projects/license', array( 'license_key' => (string) $license_key ) );
	}

	/**
	 * Returns the project to the free allowance.
	 *
	 * @return Result
	 */
	public function detach_license() {
		return $this->request( 'DELETE', '/v1/projects/license' );
	}

	/**
	 * Makes the audio of one part of text and returns the MP3 bytes.
	 *
	 * @param string $text     The text to speak.
	 * @param string $language Language code, e.g. "en-GB".
	 * @param array  $options  engine (default "gtts"), ref (a reference for the usage log, never content),
	 *                         total_chars (size of the whole text, on its first part), timeout (seconds).
	 *
	 * @return Result data: the MP3 bytes on success.
	 */
	public function synthesize( $text, $language, array $options = array() ) {
		$payload = array(
			'text'   => (string) $text,
			'lang'   => (string) $language,
			'engine' => isset( $options['engine'] ) ? (string) $options['engine'] : 'gtts',
			'ref'    => isset( $options['ref'] ) ? (string) $options['ref'] : '',
		);
		if ( ! empty( $options['total_chars'] ) && (int) $options['total_chars'] > 0 ) {
			$payload['total_chars'] = (int) $options['total_chars'];
		}

		$timeout = isset( $options['timeout'] ) ? (int) $options['timeout'] : 120;

		return $this->request( 'POST', '/v1/synthesize?raw=1', $payload, true, $timeout );
	}

	/**
	 * Sends one call to the service.
	 *
	 * @param string     $method   HTTP method.
	 * @param string     $path     Route on the service, starting with "/", e.g. "/v1/usage".
	 * @param array|null $body     JSON body, or null.
	 * @param bool       $raw      The answer is audio: return its bytes untouched.
	 * @param int        $timeout  Seconds to wait.
	 * @param bool       $with_key Send the project key. False only for calls made before a key exists.
	 *
	 * @return Result
	 *
	 * @throws \InvalidArgumentException When $path is not a route on the service (a programming mistake).
	 */
	public function request( $method, $path, $body = null, $raw = false, $timeout = self::DEFAULT_TIMEOUT, $with_key = true ) {
		$path = (string) $path;

		// The key travels with this request, so the address must stay on the
		// service: a path may not carry a scheme, a host or a way out of it.
		if ( '' === $path || '/' !== $path[0] || 0 === strpos( $path, '//' ) || false !== strpos( $path, '://' ) || false !== strpos( $path, '\\' ) || preg_match( '/[\x00-\x20]/', $path ) ) {
			throw new \InvalidArgumentException( 'The path must be a route on the AtlasVoice service.' );
		}

		$request_id = self::new_request_id();
		$headers    = array(
			'Accept'              => $raw ? 'audio/mpeg' : 'application/json',
			'X-AtlasVoice-Client' => $this->config->client_name(),
			'X-Request-Id'        => $request_id,
		);

		$key = $with_key ? (string) $this->keys->get_key() : '';
		if ( '' !== $key ) {
			$headers['Authorization'] = 'Bearer ' . $key;
		}

		$encoded = null;
		if ( null !== $body ) {
			$headers['Content-Type'] = 'application/json';
			// Text from a page can hold bytes that are not valid UTF-8; they are
			// replaced instead of failing the whole call.
			$encoded = json_encode( $body, JSON_INVALID_UTF8_SUBSTITUTE ); // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode -- the SDK has no WordPress function in it.
			if ( false === $encoded ) {
				$encoded = '{}';
			}
		}

		$timeout = max( 1, min( self::MAX_TIMEOUT, (int) $timeout ) );
		$started = microtime( true );

		$response = $this->transport->send( new Request( $method, $this->config->base_url . $path, $headers, $encoded, $timeout ) );
		if ( ! $response instanceof Response ) {
			$response = Response::failed( 'The transport returned no answer.' );
		}

		$result = $this->read( $response, $raw, $request_id );

		$this->report( $method, $path, $result, $started );

		return $result;
	}

	/**
	 * Turns an HTTP answer into a Result. Nothing in the answer is trusted:
	 * the code and the message are read only when they are plain strings.
	 *
	 * @param Response $response   The answer.
	 * @param bool     $raw        Whether audio bytes were asked for.
	 * @param string   $request_id Id of the call.
	 *
	 * @return Result
	 */
	private function read( Response $response, $raw, $request_id ) {
		$type     = isset( $response->headers['content-type'] ) ? $response->headers['content-type'] : '';
		$is_audio = $raw && 200 === $response->status && false === strpos( $type, 'json' );
		$data     = $is_audio ? $response->body : json_decode( $response->body, true );

		$error   = '';
		$message = '';
		if ( $response->status >= 400 && is_array( $data ) && isset( $data['error'] ) && is_array( $data['error'] ) ) {
			if ( isset( $data['error']['code'] ) && is_string( $data['error']['code'] ) ) {
				// A code is a short machine word; anything else is not a code.
				$error = preg_match( '/^[a-z0-9_]{1,64}$/', $data['error']['code'] ) ? $data['error']['code'] : '';
			}
			if ( isset( $data['error']['message'] ) && is_string( $data['error']['message'] ) ) {
				$message = $data['error']['message'];
			}
		}

		// The service echoes the id it logged. It is normally the one that was
		// sent; if the service replaced it, its id is the one to quote to support.
		if ( isset( $response->headers['x-request-id'] ) && preg_match( '/^[\w.-]{8,64}$/', $response->headers['x-request-id'] ) ) {
			$request_id = $response->headers['x-request-id'];
		}

		return new Result( $response->status, $data, $error, $message, $response->headers, $response->transport_error, $request_id );
	}

	/**
	 * Reports the call to the logger. Only facts that are safe to keep: no
	 * key, no header, no body, and the route without its query string.
	 *
	 * @param string $method  HTTP method.
	 * @param string $path    Route.
	 * @param Result $result  Outcome.
	 * @param float  $started microtime( true ) when the call began.
	 */
	private function report( $method, $path, Result $result, $started ) {
		if ( ! $this->logger ) {
			return;
		}

		$this->logger->log(
			$result->ok() ? 'info' : 'error',
			'request',
			array(
				'method'     => strtoupper( (string) $method ),
				'route'      => strtok( $path, '?' ),
				'status'     => $result->status,
				'code'       => $result->code(),
				'reached'    => $result->reached(),
				'ms'         => (int) round( ( microtime( true ) - $started ) * 1000 ),
				'request_id' => $result->request_id,
			)
		);
	}

	/**
	 * A random id for one call.
	 *
	 * @return string 16 hexadecimal characters.
	 */
	private static function new_request_id() {
		try {
			return bin2hex( random_bytes( 8 ) );
		} catch ( \Exception $e ) {
			// No secure random source: the id is only a label, so a weaker one will do.
			return substr( md5( uniqid( '', true ) ), 0, 16 );
		}
	}
}
