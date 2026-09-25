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
		// Always the live service, unless a developer names another one in
		// wp-config.php (e.g. http://localhost:4000). Never guessed from the
		// environment: customers test on local servers (Local by Flywheel marks
		// sites 'local') and turn on debugging, and must still reach the service.
		if ( defined( 'TTA_ATLASVOICE_SERVICE_URL' ) ) {
			$url = TTA_ATLASVOICE_SERVICE_URL;
		} else {
			// TTS-314: the AtlasVoice API's production home (was gtts.atlasaidev.com).
			$url = 'https://api.atlasvoice.cloud';
		}

		/**
		 * Speech service base URL for player 3.
		 *
		 * @param string $url
		 */
		return untrailingslashit( (string) apply_filters( 'atlasvoice_service_url', $url ) );
	}

	/**
	 * The customer dashboard (sites, keys, usage), without a trailing slash.
	 * In production it has its own subdomain; a local service serves it under
	 * /app.
	 *
	 * @return string
	 */
	public static function dashboard_url() {
		if ( defined( 'TTA_ATLASVOICE_DASHBOARD_URL' ) ) {
			$url = TTA_ATLASVOICE_DASHBOARD_URL;
		} elseif ( defined( 'TTA_ATLASVOICE_SERVICE_URL' ) ) {
			// A developer's own service serves the dashboard under /app.
			$url = self::base_url() . '/app';
		} else {
			$url = 'https://app.atlasvoice.cloud';
		}

		/**
		 * AtlasVoice dashboard URL (the "Manage your sites" link).
		 *
		 * @param string $url
		 */
		return untrailingslashit( (string) apply_filters( 'atlasvoice_dashboard_url', $url ) );
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
			// TTS-314: the email already has an account, so its owner must approve this site.
			'pending_approval' => false,
			// Set when the service refused the Pro licence because all its seats are in use.
			'license_seats_full' => false,
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
	 * Can player 3 make audio for visitors right now? Not before the owner
	 * connects (unless an extension connects on the first play, as Pro does),
	 * and not while the connection waits for the account owner's approval.
	 * A used-up allowance is not included: it ends by itself, and posts that
	 * already have audio keep playing it.
	 *
	 * @return bool
	 */
	public static function can_serve_visitors() {
		if ( self::is_connected() ) {
			return ! self::get()['pending_approval'];
		}

		return (bool) apply_filters( 'atlasvoice_service_auto_connect', false );
	}

	/**
	 * While a connection waits for approval, ask the service again on an admin
	 * page view (at most every 15 minutes): the owner may have approved it from
	 * the email, and visitors get player 3 back without opening Listening.
	 */
	public static function maybe_recheck_approval() {
		if ( ! self::is_connected() || ! self::get()['pending_approval'] || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( get_transient( 'atlasvoice_approval_recheck' ) ) {
			return;
		}
		set_transient( 'atlasvoice_approval_recheck', 1, 15 * MINUTE_IN_SECONDS );
		self::refresh_usage();
	}

	/**
	 * Headers that identify this site to AtlasVoice services: its key and the
	 * client. For other AtlasVoice engines the site calls itself (Pro's player 7
	 * service checks the key with the AtlasVoice service before making audio).
	 * Server-side only; never output them.
	 *
	 * @return array Empty when the site is not connected.
	 */
	public static function auth_headers() {
		if ( ! self::is_connected() ) {
			return array();
		}

		return array(
			'Authorization'       => 'Bearer ' . self::get()['api_key'],
			'X-AtlasVoice-Client' => 'wordpress/' . ( defined( 'TEXT_TO_AUDIO_VERSION' ) ? TEXT_TO_AUDIO_VERSION : '0' ),
		);
	}

	/**
	 * Let another AtlasVoice engine report an error code from the service, so a
	 * revoked key or a pending approval is handled the same way everywhere.
	 *
	 * @param string $code Error code from the service.
	 */
	public static function note_error( $code ) {
		self::note_key_error( (string) $code );
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
			'pendingApproval' => (bool) $state['pending_approval'],
			'licenseSeatsFull' => (bool) $state['license_seats_full'],
			'diagnostics' => self::diagnostics_offer(),
			'serviceUrl'  => self::base_url(),
			'dashboardUrl' => self::dashboard_url(),
			'termsUrl'    => 'https://atlasaidev.com/terms-and-conditions/',
			'privacyUrl'  => 'https://atlasaidev.com/privacy-policy/',
		);
	}

	/**
	 * The optional "help improve AtlasVoice" opt-in shown next to Connect. It is
	 * the plugin's existing tracking library (the same as the admin notice's
	 * Allow button), offered only when that notice would still ask.
	 *
	 * @return array{offer:bool, items:string[]}
	 */
	private static function diagnostics_offer() {
		if ( ! class_exists( TTA_Lib_AtlasAiDev::class ) || ! TTA_Lib_AtlasAiDev::instance()->can_offer_tracking() ) {
			return array( 'offer' => false, 'items' => array() );
		}

		$items = array_map(
			static function ( $item ) {
				return wp_strip_all_tags( html_entity_decode( (string) $item, ENT_QUOTES, 'UTF-8' ) );
			},
			(array) TTA_Lib_AtlasAiDev::instance()->get_data_collection_description()
		);

		return array( 'offer' => true, 'items' => array_values( $items ) );
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
			'pending_approval' => isset( $result['data']['approval'] ) && 'pending' === $result['data']['approval'],
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
			'pending_approval' => false,
			'license_seats_full' => false,
		) );
	}

	/**
	 * Current usage, cached for ten minutes (not cached while waiting for approval).
	 *
	 * @param bool $force
	 * @return array
	 */
	public static function refresh_usage( $force = false ) {
		$state = self::get();

		if ( ! self::is_connected() ) {
			return array();
		}

		if ( ! $force && ! $state['pending_approval'] && $state['usage_at'] > time() - 10 * MINUTE_IN_SECONDS ) {
			return $state['usage'];
		}

		$result = self::request( 'GET', '/v1/usage' );

		if ( 200 === $result['status'] && isset( $result['data']['usage'] ) ) {
			self::put( array( 'pending_approval' => false ) );
			self::remember_usage( $result['data']['usage'] );

			return $result['data']['usage'];
		}

		self::note_key_error( $result['error'] );

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
			// Every site of the licence already uses it: this site stays Free, and the
			// Listening screen says why. Pro retries hourly, so a freed seat is picked up.
			if ( 'license_quota_reached' === $result['error'] ) {
				self::put( array( 'license_seats_full' => true ) );
			}

			return self::error_from( $result );
		}

		self::put( array( 'license_attached' => true, 'license_seats_full' => false ) );
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

		self::put( array( 'license_attached' => false, 'license_seats_full' => false ) );
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
			if ( self::get()['pending_approval'] ) {
				self::put( array( 'pending_approval' => false ) );
			}

			return array( 'ok' => true, 'audio' => $result['data'] );
		}

		if ( 'quota_exceeded' === $result['error'] ) {
			self::remember_usage( isset( $result['data']['usage'] ) ? $result['data']['usage'] : null );
		}

		self::note_key_error( $result['error'] );

		return array( 'ok' => false, 'code' => $result['error'] ? $result['error'] : 'service_unreachable' );
	}

	/**
	 * React to what the service says about this site's key.
	 *
	 * @param string $code Error code from the service.
	 */
	private static function note_key_error( $code ) {
		if ( 'invalid_api_key' === $code ) {
			// Revoked or rejected on the service: ask the owner to connect again.
			self::put( array( 'api_key' => '', 'key_prefix' => '', 'pending_approval' => false ) );
		} elseif ( 'approval_required' === $code ) {
			self::put( array( 'pending_approval' => true ) );
		}
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
