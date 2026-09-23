<?php

namespace TTA;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-314: the AtlasVoice speech service (API v1) for player 3, AtlasVoice TTS.
 *
 * Player 3 reads posts with the Google Translate voice through our own service.
 * The service needs a free site key, which the site owner requests from the
 * Listening screen by ticking the consent box (wp.org Guideline 7: nothing is
 * sent before that). The service meters a monthly character allowance per site
 * and lifts it for Premium; the plugin never locks anything itself.
 *
 * One reuse surface for the free/Pro boundary: Pro calls attach_license() and
 * the generation handler rather than keeping its own copies.
 */
class TTA_AtlasVoice_Service {

	const OPTION = 'tta_atlasvoice_service';

	/** Player id served by this service. */
	const PLAYER_ID = 3;

	/** Per-request limit the service enforces; batches stay well under it. */
	const MAX_BATCH_CHARS = 5000;

	/**
	 * Base URL of the speech service, without a trailing slash.
	 *
	 * @return string
	 */
	public static function base_url() {
		if ( defined( 'TTA_ATLASVOICE_SERVICE_URL' ) ) {
			$url = TTA_ATLASVOICE_SERVICE_URL;
		} elseif ( ( defined( 'TTA_DEBUG_MODE' ) && TTA_DEBUG_MODE ) || 'local' === wp_get_environment_type() ) {
			$url = 'http://localhost:4000';
		} else {
			$url = 'https://gtts.atlasaidev.com';
		}

		/**
		 * Speech service base URL for player 3.
		 *
		 * @param string $url
		 */
		return untrailingslashit( (string) apply_filters( 'atlasvoice_service_url', $url ) );
	}

	/**
	 * Where player 3 stores its MP3s: uploads/TTA/gtts/.
	 *
	 * Files made by Pro before TTS-314 stay in uploads/TTA_Pro/gtts/ and keep
	 * playing from their stored URLs; they are never moved.
	 *
	 * @return string Absolute path with a trailing slash.
	 */
	public static function audio_dir() {
		$upload = wp_upload_dir( null, false );

		return trailingslashit( $upload['basedir'] ) . 'TTA/gtts/';
	}

	/**
	 * @return string URL with a trailing slash.
	 */
	public static function audio_dir_url() {
		$upload = wp_upload_dir( null, false );

		return trailingslashit( set_url_scheme( $upload['baseurl'] ) ) . 'TTA/gtts/';
	}

	// ------------------------------------------------------------------ state

	/**
	 * @return array
	 */
	private static function get() {
		$state = get_option( self::OPTION, array() );

		return wp_parse_args( is_array( $state ) ? $state : array(), array(
			'consent'         => false,
			'api_key'         => '',
			'key_prefix'      => '',
			'email'           => '',
			'project_id'      => 0,
			'plan'            => '',
			'usage'           => array(),
			'usage_at'        => 0,
			'exhausted_until' => 0,
			'license_attached' => false,
		) );
	}

	/**
	 * @param array $changes
	 */
	private static function put( array $changes ) {
		update_option( self::OPTION, array_merge( self::get(), $changes ), false );
	}

	/**
	 * Has the site owner agreed to use the service, and does the site have a key?
	 *
	 * @return bool
	 */
	public static function is_connected() {
		$state = self::get();

		return $state['consent'] && '' !== $state['api_key'];
	}

	/**
	 * Is the monthly allowance known to be used up right now?
	 *
	 * @return bool
	 */
	public static function is_exhausted() {
		return self::get()['exhausted_until'] > time();
	}

	/**
	 * What the Listening screen shows. Never includes the key itself.
	 *
	 * @return array
	 */
	public static function public_state() {
		$state = self::get();

		return array(
			'consent'     => (bool) $state['consent'],
			'connected'   => self::is_connected(),
			'keyPrefix'   => $state['key_prefix'],
			'email'       => $state['email'] ? $state['email'] : (string) get_option( 'admin_email' ),
			'plan'        => $state['plan'],
			'usage'       => $state['usage'],
			'exhausted'   => self::is_exhausted(),
			'serviceUrl'  => self::base_url(),
			'termsUrl'    => 'https://atlasaidev.com/terms-and-conditions/',
			'privacyUrl'  => 'https://atlasaidev.com/privacy-policy/',
		);
	}

	// ------------------------------------------------------------------- HTTP

	/**
	 * Call the service. Returns the decoded JSON (or raw body) with the status.
	 *
	 * @param string     $method
	 * @param string     $path    e.g. '/v1/usage'.
	 * @param array|null $body
	 * @param bool       $raw     Return the body untouched (audio).
	 * @param int        $timeout
	 * @return array{status:int, data:mixed, headers:array, error:string}
	 */
	private static function request( $method, $path, $body = null, $raw = false, $timeout = 30 ) {
		$state   = self::get();
		$headers = array(
			'Accept'              => $raw ? 'audio/mpeg' : 'application/json',
			'X-AtlasVoice-Client' => 'wordpress/' . ( defined( 'TEXT_TO_AUDIO_VERSION' ) ? TEXT_TO_AUDIO_VERSION : '0' ),
		);

		if ( '' !== $state['api_key'] ) {
			$headers['Authorization'] = 'Bearer ' . $state['api_key'];
		}

		$args = array(
			'method'  => $method,
			'timeout' => $timeout,
			'headers' => $headers,
		);

		if ( null !== $body ) {
			$args['headers']['Content-Type'] = 'application/json';
			$args['body']                    = wp_json_encode( $body );
		}

		$response = wp_remote_request( self::base_url() . $path, $args );

		if ( is_wp_error( $response ) ) {
			return array( 'status' => 0, 'data' => null, 'headers' => array(), 'error' => $response->get_error_message() );
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$text   = wp_remote_retrieve_body( $response );
		$type   = (string) wp_remote_retrieve_header( $response, 'content-type' );
		$data   = ( $raw && 200 === $status && false === strpos( $type, 'json' ) ) ? $text : json_decode( $text, true );

		return array(
			'status'  => $status,
			'data'    => $data,
			'headers' => wp_remote_retrieve_headers( $response ),
			'error'   => ( $status >= 400 && is_array( $data ) && isset( $data['error']['code'] ) ) ? $data['error']['code'] : '',
		);
	}

	/**
	 * Remember the usage block the service returned.
	 *
	 * @param array $usage
	 */
	private static function remember_usage( $usage ) {
		if ( ! is_array( $usage ) ) {
			return;
		}

		$exhausted = 0;
		if ( null !== $usage['chars_remaining'] && (int) $usage['chars_remaining'] <= 0 && ! empty( $usage['resets_at'] ) ) {
			$exhausted = (int) strtotime( $usage['resets_at'] );
		}

		self::put( array(
			'usage'           => $usage,
			'usage_at'        => time(),
			'plan'            => isset( $usage['plan'] ) ? (string) $usage['plan'] : '',
			'exhausted_until' => $exhausted,
		) );
	}

	// ---------------------------------------------------------------- actions

	/**
	 * Record consent and request a site key.
	 *
	 * @param string $email Where AtlasVoice may contact the site owner about the service.
	 * @return true|\WP_Error
	 */
	public static function connect( $email ) {
		$email = sanitize_email( $email );

		if ( ! is_email( $email ) ) {
			return new \WP_Error( 'invalid_email', __( 'Enter a valid email address.', 'text-to-audio' ) );
		}

		// A new registration must not reuse an old key's Authorization header.
		self::put( array( 'api_key' => '' ) );

		$result = self::request( 'POST', '/v1/projects/register', array(
			'platform' => 'wordpress',
			'site_url' => home_url( '/' ),
			'email'    => $email,
			'name'     => get_bloginfo( 'name' ),
		) );

		if ( ! in_array( $result['status'], array( 200, 201 ), true ) || empty( $result['data']['api_key'] ) ) {
			return self::error_from( $result );
		}

		self::put( array(
			'consent'    => true,
			'api_key'    => (string) $result['data']['api_key'],
			'key_prefix' => (string) $result['data']['key_prefix'],
			'email'      => $email,
			'project_id' => (int) $result['data']['project_id'],
			'plan'       => (string) $result['data']['plan'],
		) );

		/**
		 * Fires once the site has a service key. Pro attaches its licence here.
		 */
		do_action( 'atlasvoice_service_connected' );

		self::refresh_usage( true );

		return true;
	}

	/**
	 * Withdraw consent. The key is forgotten locally; generation stops.
	 */
	public static function disconnect() {
		self::put( array(
			'consent'          => false,
			'api_key'          => '',
			'key_prefix'       => '',
			'project_id'       => 0,
			'plan'             => '',
			'usage'            => array(),
			'exhausted_until'  => 0,
			'license_attached' => false,
		) );
	}

	/**
	 * Current usage, cached for ten minutes.
	 *
	 * @param bool $force
	 * @return array
	 */
	public static function refresh_usage( $force = false ) {
		$state = self::get();

		if ( ! self::is_connected() ) {
			return array();
		}

		if ( ! $force && $state['usage_at'] > time() - 10 * MINUTE_IN_SECONDS ) {
			return $state['usage'];
		}

		$result = self::request( 'GET', '/v1/usage' );

		if ( 200 === $result['status'] && isset( $result['data']['usage'] ) ) {
			self::remember_usage( $result['data']['usage'] );

			return $result['data']['usage'];
		}

		return $state['usage'];
	}

	/**
	 * Premium through a licence. Called by Pro with its licence key; the key
	 * is sent once and not stored by this plugin.
	 *
	 * @param string $license_key
	 * @return true|\WP_Error
	 */
	public static function attach_license( $license_key ) {
		if ( ! self::is_connected() ) {
			return new \WP_Error( 'not_connected', __( 'Connect AtlasVoice TTS first.', 'text-to-audio' ) );
		}

		$result = self::request( 'POST', '/v1/projects/license', array( 'license_key' => (string) $license_key ) );

		if ( 200 !== $result['status'] ) {
			return self::error_from( $result );
		}

		self::put( array( 'license_attached' => true ) );
		self::remember_usage( isset( $result['data']['usage'] ) ? $result['data']['usage'] : null );

		return true;
	}

	/**
	 * Return the site to the free allowance (e.g. the licence was removed).
	 *
	 * @return true|\WP_Error
	 */
	public static function detach_license() {
		if ( ! self::is_connected() ) {
			return true;
		}

		$result = self::request( 'DELETE', '/v1/projects/license' );

		if ( 200 !== $result['status'] ) {
			return self::error_from( $result );
		}

		self::put( array( 'license_attached' => false ) );
		self::remember_usage( isset( $result['data']['usage'] ) ? $result['data']['usage'] : null );

		return true;
	}

	/**
	 * @return bool
	 */
	public static function has_license_attached() {
		return (bool) self::get()['license_attached'];
	}

	/**
	 * Generate one batch of speech.
	 *
	 * @param string $text
	 * @param string $language
	 * @param string $ref      Reference kept in the service's usage log (post id). Never content.
	 * @return array{ok:bool, audio?:string, code?:string}
	 */
	public static function synthesize( $text, $language, $ref = '' ) {
		if ( ! self::is_connected() ) {
			return array( 'ok' => false, 'code' => 'not_connected' );
		}

		if ( self::is_exhausted() ) {
			return array( 'ok' => false, 'code' => 'quota_exceeded' );
		}

		/**
		 * Timeout for one batch, in seconds. The service fetches one Google
		 * request per sentence, so a long batch on a slow link needs time.
		 *
		 * @param int $timeout
		 */
		$timeout = (int) apply_filters( 'atlasvoice_service_timeout', 120 );

		$result = self::request( 'POST', '/v1/synthesize?raw=1', array(
			'text'   => $text,
			'lang'   => $language,
			'engine' => 'gtts',
			'ref'    => $ref,
		), true, $timeout );

		if ( 200 === $result['status'] && is_string( $result['data'] ) && '' !== $result['data'] ) {
			return array( 'ok' => true, 'audio' => $result['data'] );
		}

		if ( 'quota_exceeded' === $result['error'] ) {
			self::remember_usage( isset( $result['data']['usage'] ) ? $result['data']['usage'] : null );
		}

		if ( 'invalid_api_key' === $result['error'] ) {
			// Revoked on the service: ask the owner to connect again.
			self::put( array( 'api_key' => '', 'key_prefix' => '' ) );
		}

		return array( 'ok' => false, 'code' => $result['error'] ? $result['error'] : 'service_unreachable' );
	}

	/**
	 * @param array $result
	 * @return \WP_Error
	 */
	private static function error_from( $result ) {
		$message = __( 'The AtlasVoice service could not be reached. Please try again in a few minutes.', 'text-to-audio' );

		if ( is_array( $result['data'] ) && isset( $result['data']['error']['message'] ) ) {
			$message = sanitize_text_field( $result['data']['error']['message'] );
		}

		return new \WP_Error( $result['error'] ? $result['error'] : 'service_unreachable', $message, array( 'status' => $result['status'] ) );
	}
}
