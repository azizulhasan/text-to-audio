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

	const VERSION = '0.3.0';

	/**
	 * The longest a single call may wait, whatever a caller asks for. One
	 * part of audio can take minutes on a slow engine; nothing takes longer.
	 */
	const MAX_TIMEOUT = 300;

	const DEFAULT_TIMEOUT = 30;

	/**
	 * Characters of a job id, an idempotency key and a job reference, as the
	 * service accepts them (character classes without brackets).
	 */
	const ID_CHARS  = 'A-Za-z0-9-';
	const KEY_CHARS = 'A-Za-z0-9_.:-';
	const REF_CHARS = 'A-Za-z0-9_.:\\/#@+-';

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
	 * Pauses calls to a service that is down, or null.
	 *
	 * @var Circuit_Breaker|null
	 */
	private $breaker;

	/**
	 * Builds a client.
	 *
	 * @param Config               $config    Service address and host name.
	 * @param Http_Transport       $transport How to send a request.
	 * @param Key_Store            $keys      Where the project key lives.
	 * @param Logger|null          $logger    Where to report calls, if anywhere.
	 * @param Circuit_Breaker|null $breaker   Pauses calls to a service that is down, if given.
	 */
	public function __construct( Config $config, Http_Transport $transport, Key_Store $keys, $logger = null, $breaker = null ) {
		$this->config    = $config;
		$this->transport = $transport;
		$this->keys      = $keys;
		$this->logger    = $logger instanceof Logger ? $logger : null;
		$this->breaker   = $breaker instanceof Circuit_Breaker ? $breaker : null;
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
	 * Reads everything a settings screen needs about the project in one call:
	 * plan, engines, allowance, limits, licence state and links.
	 *
	 * The answer is the service's word on what the project may do; a platform
	 * shows it and never decides the plan itself. It changes rarely, so a
	 * platform keeps it for a few minutes and reads it again after a licence
	 * change. The links in it are data from a response like any other: a
	 * platform checks them before it prints them.
	 *
	 * @return Result data: project, plan, engines, usage, limits, license, links.
	 */
	public function account() {
		return $this->request( 'GET', '/v1/account' );
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
	 * Downloads a finished audio file whose address the service returned.
	 *
	 * The address comes from a response, so it is checked before anything is
	 * sent: it must be a plain web address on the service's own host or on
	 * one of the hosts the platform allows, over HTTPS (plain http only on
	 * the service's own host, for a developer's local service). The project
	 * key is never sent with a download, and a redirect is not followed.
	 *
	 * @param string   $url           The file's address.
	 * @param string[] $allowed_hosts Other hosts files may come from. An entry that starts
	 *                                with a dot allows every host under that domain, e.g.
	 *                                ".atlasvoice.cloud".
	 * @param int      $timeout       Seconds to wait.
	 *
	 * @return Result data: the file's bytes on success.
	 */
	public function download( $url, array $allowed_hosts = array(), $timeout = self::DEFAULT_TIMEOUT ) {
		$url        = (string) $url;
		$request_id = self::new_request_id();
		$started    = microtime( true );

		if ( ! $this->is_file_address( $url, $allowed_hosts ) ) {
			$result = new Result( 0, null, '', '', array(), 'The file address is not on the AtlasVoice service.', $request_id );
			$this->report( 'GET', '/(file)', $result, $started, true );

			return $result;
		}

		$headers = array(
			'Accept'              => 'audio/mpeg',
			'X-AtlasVoice-Client' => $this->config->client_name(),
			'X-Request-Id'        => $request_id,
		);
		$timeout = max( 1, min( self::MAX_TIMEOUT, (int) $timeout ) );

		$response = $this->transport->send( new Request( 'GET', $url, $headers, null, $timeout, false ) );
		if ( ! $response instanceof Response ) {
			$response = Response::failed( 'The transport returned no answer.' );
		}

		// The bytes are returned untouched; a redirect or an error page is not a file.
		$result = new Result( $response->status, 200 === $response->status ? $response->body : null, '', '', $response->headers, $response->transport_error, $request_id );
		$this->report( 'GET', '/(file)', $result, $started );

		return $result;
	}

	/**
	 * Whether an address from a response may be downloaded.
	 *
	 * @param string   $url           The address.
	 * @param string[] $allowed_hosts Hosts allowed beside the service's own.
	 *
	 * @return bool
	 */
	private function is_file_address( $url, array $allowed_hosts ) {
		if ( '' === $url || strlen( $url ) > 2048 || preg_match( '/[\x00-\x20\x7F\\\\]/', $url ) ) {
			return false;
		}

		$file = parse_url( $url ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url -- the SDK has no WordPress function in it.
		$own  = parse_url( $this->config->base_url ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url -- the SDK has no WordPress function in it.

		if ( ! is_array( $file ) || empty( $file['scheme'] ) || empty( $file['host'] ) || isset( $file['user'] ) || isset( $file['pass'] ) ) {
			return false;
		}

		$scheme   = strtolower( $file['scheme'] );
		$host     = strtolower( $file['host'] );
		$own_host = strtolower( $own['host'] );

		if ( $host === $own_host ) {
			// The service's own host, by the way the service itself is reached.
			return 'https' === $scheme || strtolower( $own['scheme'] ) === $scheme;
		}

		if ( 'https' !== $scheme ) {
			return false;
		}

		foreach ( $allowed_hosts as $allowed ) {
			$allowed = strtolower( (string) $allowed );
			if ( '' === $allowed || '.' === $allowed ) {
				continue;
			}
			if ( $host === $allowed || ( '.' === $allowed[0] && substr( $host, -strlen( $allowed ) ) === $allowed ) ) {
				return true;
			}
		}

		return false;
	}

	// ------------------------------------------------------------ audio jobs

	/**
	 * Asks the service to make the audio of a whole text as one job. The
	 * service cuts the text into parts, makes them, joins them and keeps the
	 * finished file for a limited time; the platform asks how the job is
	 * going (get_job) and downloads the file when it is done.
	 *
	 * @param string $text     The whole text.
	 * @param string $language Language code.
	 * @param array  $options  engine (default "gtts"), voice (or null), ref (a reference for the
	 *                         usage log, never content), idempotency_key (see idempotency_key()).
	 *
	 * @return Result data: job, poll_after_ms.
	 */
	public function create_job( $text, $language, array $options = array() ) {
		$payload = array(
			'text'   => (string) $text,
			'lang'   => (string) $language,
			'engine' => isset( $options['engine'] ) ? (string) $options['engine'] : 'gtts',
			'voice'  => isset( $options['voice'] ) && '' !== $options['voice'] ? (string) $options['voice'] : null,
			'ref'    => isset( $options['ref'] ) ? (string) $options['ref'] : '',
		);

		$headers = array();
		if ( isset( $options['idempotency_key'] ) && self::is_token( $options['idempotency_key'], self::KEY_CHARS ) ) {
			$headers['Idempotency-Key'] = (string) $options['idempotency_key'];
		}

		return $this->call( 'POST', '/v1/jobs', $payload, false, 60, true, $headers );
	}

	/**
	 * Reads one job. The answer's poll_after_ms says how long to wait before
	 * asking again; it is null once the job is finished.
	 *
	 * @param string $id The job's id.
	 *
	 * @return Result data: job, poll_after_ms.
	 */
	public function get_job( $id ) {
		if ( ! self::is_token( $id, self::ID_CHARS ) ) {
			return $this->refused( 'This is not a job id.' );
		}

		return $this->call( 'GET', '/v1/jobs/' . $id, null, false, self::DEFAULT_TIMEOUT, true, array(), false );
	}

	/**
	 * Reads up to 100 jobs in one call.
	 *
	 * @param string[] $ids Job ids. Values that are not ids are left out.
	 *
	 * @return Result data: jobs, poll_after_ms (the shortest wait among the unfinished ones).
	 */
	public function get_jobs( array $ids ) {
		$clean = array();
		foreach ( $ids as $id ) {
			if ( self::is_token( $id, self::ID_CHARS ) ) {
				$clean[ (string) $id ] = true;
			}
		}
		$clean = array_slice( array_keys( $clean ), 0, 100 );

		if ( ! $clean ) {
			return $this->refused( 'There is no job id to ask for.' );
		}

		return $this->call( 'GET', '/v1/jobs?ids=' . implode( ',', $clean ), null, false, self::DEFAULT_TIMEOUT, true, array(), false );
	}

	/**
	 * Reads the latest jobs whose reference starts with a prefix, for example
	 * "post:161:" for every language of one post.
	 *
	 * @param string $prefix Start of the reference.
	 *
	 * @return Result data: jobs, poll_after_ms.
	 */
	public function get_jobs_by_ref( $prefix ) {
		if ( ! self::is_token( $prefix, self::REF_CHARS ) ) {
			return $this->refused( 'This is not a job reference.' );
		}

		return $this->call( 'GET', '/v1/jobs?ref_prefix=' . rawurlencode( (string) $prefix ), null, false, self::DEFAULT_TIMEOUT, true, array(), false );
	}

	/**
	 * Cancels a job. Parts that are not made yet are never made or billed; a
	 * finished job is left as it is.
	 *
	 * @param string $id The job's id.
	 *
	 * @return Result data: job.
	 */
	public function cancel_job( $id ) {
		if ( ! self::is_token( $id, self::ID_CHARS ) ) {
			return $this->refused( 'This is not a job id.' );
		}

		return $this->call( 'DELETE', '/v1/jobs/' . $id, null, false, self::DEFAULT_TIMEOUT, true );
	}

	/**
	 * Reads what the service offers without a key: among other things the
	 * hosts finished files are served from (file_hosts) and the job limits.
	 *
	 * @return Result data: file_hosts, jobs { max_chars, file_hours }, …
	 */
	public function health() {
		return $this->call( 'GET', '/v1/health', null, false, 10, false );
	}

	/**
	 * A key that makes a retry safe: the same reference and the same text
	 * give the same key, so a second request for the same audio returns the
	 * first job and is not billed again. A changed text gives another key.
	 *
	 * @param string $ref  The job's reference, e.g. "post:161:en".
	 * @param string $text The whole text.
	 *
	 * @return string At most 128 characters the service accepts.
	 */
	public static function idempotency_key( $ref, $text ) {
		$ref = preg_replace( '/[^A-Za-z0-9_.:-]/', '-', (string) $ref );

		return substr( $ref, 0, 87 ) . ':' . sha1( (string) $text );
	}

	/**
	 * A reference the service accepts: at most 128 characters, never content.
	 *
	 * @param string $ref The wanted reference.
	 *
	 * @return string
	 */
	public static function job_ref( $ref ) {
		return substr( preg_replace( '/[^A-Za-z0-9_.:\/#@+-]/', '-', (string) $ref ), 0, 128 );
	}

	/**
	 * Whether a value is a short word made of the given characters only.
	 *
	 * @param mixed  $value The value.
	 * @param string $chars A character class without brackets.
	 *
	 * @return bool
	 */
	private static function is_token( $value, $chars ) {
		return is_string( $value ) && 1 === preg_match( '/^[' . $chars . ']{1,128}$/', $value );
	}

	/**
	 * A result for a call that was not sent because its input was wrong.
	 *
	 * @param string $reason Why.
	 *
	 * @return Result
	 */
	private function refused( $reason ) {
		return new Result( 0, null, '', '', array(), (string) $reason, self::new_request_id() );
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
		return $this->call( $method, $path, $body, $raw, $timeout, $with_key );
	}

	/**
	 * Sends one call. request() and the job calls all end here.
	 *
	 * @param string     $method   HTTP method.
	 * @param string     $path     Route on the service.
	 * @param array|null $body     JSON body, or null.
	 * @param bool       $raw      The answer is audio.
	 * @param int        $timeout  Seconds to wait.
	 * @param bool       $with_key Send the project key.
	 * @param array      $extra    More headers, name => value. A value that is not one printable line is left out.
	 * @param bool       $guarded  Obey and feed the circuit breaker. False for polling a job: the service
	 *                             sets the pace of those calls itself, and a job must not be lost because
	 *                             another route was down.
	 *
	 * @return Result
	 *
	 * @throws \InvalidArgumentException When $path is not a route on the service (a programming mistake).
	 */
	private function call( $method, $path, $body, $raw, $timeout, $with_key, array $extra = array(), $guarded = true ) {
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

		foreach ( $extra as $name => $value ) {
			// One printable line each: a value can never add a second header.
			if ( is_string( $name ) && preg_match( '/^[A-Za-z][A-Za-z0-9-]{0,63}$/', $name ) && is_string( $value ) && preg_match( '/^[\x21-\x7E]{1,256}$/', $value ) && ! isset( $headers[ $name ] ) ) {
				$headers[ $name ] = $value;
			}
		}

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

		// A service that is down, or that asked for a pause, is not called: the
		// caller gets the same "could not be reached" answer at once.
		$wait = ( $guarded && $this->breaker ) ? $this->breaker->seconds_to_wait() : 0;
		if ( $wait > 0 ) {
			$result = $this->read( Response::failed( sprintf( 'The AtlasVoice service is not answering. Calls are paused for %d seconds.', $wait ) ), $raw, $request_id );
			$this->report( $method, $path, $result, $started, true );

			return $result;
		}

		$response = $this->transport->send( new Request( $method, $this->config->base_url . $path, $headers, $encoded, $timeout ) );
		if ( ! $response instanceof Response ) {
			$response = Response::failed( 'The transport returned no answer.' );
		}

		$result = $this->read( $response, $raw, $request_id );

		if ( $guarded && $this->breaker ) {
			$this->breaker->record( $result );
		}

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
	 * @param bool   $skipped The call was not sent because calls are paused.
	 */
	private function report( $method, $path, Result $result, $started, $skipped = false ) {
		if ( ! $this->logger ) {
			return;
		}

		$this->logger->log(
			$result->ok() ? 'info' : 'error',
			$skipped ? 'request_skipped' : 'request',
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
