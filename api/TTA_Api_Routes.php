<?php

namespace TTA_Api;

// TTS-247: prevent direct file access (wp.org Plugin Check requirement).
defined( 'ABSPATH' ) || exit;

use TTA\TTA_Cache;
use TTA\TTA_Helper;

/**
 * This class is for getting all plugin's data  through api.
 * This is applied for tracker menu.
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/api
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class TTA_Api_Routes {

	protected $namespace;
	protected $woocommerce;
	protected $version;
	protected $analytics;
	protected $compatibility;

	public function __construct() {
		$this->version       = 'v1';
		$this->namespace     = 'tta/' . $this->version;
		$this->analytics     = new AtlasVoice_Analytics();
		$this->compatibility = new AtlasVoice_Plugin_Compatibility();
		add_action( 'rest_api_init', [ $this, 'tta_speech_register_routes' ] );
	}

	/**
	 * Register Routes
	 */
	public function tta_speech_register_routes() {

		// register listening route.
		register_rest_route(
			$this->namespace,
			'/listening',
			array(
				array(
					'methods'             => \WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'tta_manage_listening_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register customize route.
		register_rest_route(
			$this->namespace,
			'/customize',
			array(
				array(
					'methods'             => \WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'tta_manage_customize_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register settings route.
		// '/settings-data' is an alias for '/settings'. Some security plugins (e.g. WP Ghost)
		// harden the WP core endpoint wp/v2/settings with a rule that blocks ANY REST path whose
		// final segment is exactly "settings" — which also blocked our save endpoint and made
		// "SAVE does not work". The dashboard now calls '/settings-data'; '/settings' is kept for
		// backward compatibility. Both map to the same callback (no duplicated logic).
		foreach ( array( '/settings', '/settings-data' ) as $settings_route ) {
			register_rest_route(
				$this->namespace,
				$settings_route,
				array(
					array(
						'methods'             => \WP_REST_Server::ALLMETHODS,
						'callback'            => array( $this, 'tta_manage_settings_data' ),
						'permission_callback' => array( $this, 'get_route_access' ),
						'args'                => array(),
					),
				)
			);
		}

		// TTS-256: read-along highlight settings route (players 1 & 2).
		register_rest_route(
			$this->namespace,
			'/highlight',
			array(
				array(
					'methods'             => \WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'tta_manage_highlight_settings' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register settings route.
		register_rest_route(
			$this->namespace,
			'/browser',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'tta_browser_settings' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		/**
		 * TTS-266: the post edit screen's audio panel.
		 *
		 * Free owns these so there is ONE panel whichever plugin generated the
		 * audio, and a site that deactivates Pro can still remove what is stored.
		 * Both are gated on `edit_post` for the specific post, not on
		 * manage_options: an author manages their own posts.
		 */
		register_rest_route(
			$this->namespace,
			'/delete_mp3_file',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'atlasvoice_delete_mp3' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/upload_mp3_file',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'atlasvoice_upload_mp3' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		/*
		 * TTS-314: player 3 (AtlasVoice TTS). `gtts` generates one batch and is
		 * called by the player on a visitor's first play (page nonce, POST only);
		 * `atlasvoice_service` is the Listening screen's connect / disconnect.
		 */
		register_rest_route(
			$this->namespace,
			'/gtts',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'atlasvoice_gtts_batch' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/atlasvoice_service',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'atlasvoice_service_state' ),
					'permission_callback' => array( $this, 'get_route_access' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'atlasvoice_service_connect' ),
					'permission_callback' => array( $this, 'get_route_access' ),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'atlasvoice_service_disconnect' ),
					'permission_callback' => array( $this, 'get_route_access' ),
				),
			)
		);

		// register track route.
		register_rest_route(
			$this->namespace,
			'/track',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'track' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register geolocation route for IP-based city/country detection.
		register_rest_route(
			$this->namespace,
			'/geolocation',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'get_geolocation' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register insights for single post route.
        register_rest_route(
            $this->namespace,
            '/insights',
            array(
                array(
                    'methods'             => \WP_REST_Server::READABLE,
                    'callback'            => array( $this->analytics, 'insights' ),
                    'permission_callback' => array( $this, 'get_route_access' ),
                    'args'                => array(
                        'id' => array(
                            'type'        => 'number',
                            'description' => 'post ID',
                            'required'    => false,
                        ),
                        'from_date' => array(
                            'type'        => 'string',
                            'description' => 'Start date in Y-m-d format',
                            'required'    => false,
                        ),
                        'to_date'   => array(
                            'type'        => 'string',
                            'description' => 'End date in Y-m-d format',
                            'required'    => false,
                        ),
                    ),
                ),
            )
        );


		// register all_insights route.
		register_rest_route(
			$this->namespace,
			'/all_insights',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'all_insights' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register latest_posts  route.
		register_rest_route(
			$this->namespace,
			'/latest_posts',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'latest_posts' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register save_analytics_settings route.
		register_rest_route(
			$this->namespace,
			'/save_analytics_settings',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'save_analytics_settings' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register get_analytics_settings route.
		register_rest_route(
			$this->namespace,
			'/get_analytics_settings',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'get_analytics_settings' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register aggregated_insights route for dashboard.
		register_rest_route(
			$this->namespace,
			'/aggregated_insights',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'aggregated_insights' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'date_range' => array(
							'type'        => 'string',
							'description' => 'Date range preset (Yesterday, Last 7 Days, Last 30 Days, Last 90 Days, Custom)',
							'required'    => false,
						),
						'from_date' => array(
							'type'        => 'string',
							'description' => 'Start date in Y-m-d format (for Custom range)',
							'required'    => false,
						),
						'to_date' => array(
							'type'        => 'string',
							'description' => 'End date in Y-m-d format (for Custom range)',
							'required'    => false,
						),
					),
				),
			)
		);

		// TTS-249/2.2.2: trend_data / heatmap_data / export_csv / export_pdf
		// routes are NOT registered by the free plugin. The Playing Trend
		// Analysis chart and these other handlers are premium features (their
		// free stubs returned "This feature requires Pro version" — a
		// Guideline-5 trialware pattern). They are now registered by the Pro
		// plugin under tta_pro/v1/ so they exist only when Pro is active. The
		// free analytics UI never calls them (the React fetches early-return
		// when the matching capability is absent).

		// register filtered_insights route.
		register_rest_route(
			$this->namespace,
			'/filtered_insights',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'filtered_insights' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'post_ids' => array(
							'type'        => 'string',
							'description' => 'JSON array of post IDs to filter',
							'required'    => false,
						),
						'date_range' => array(
							'type'        => 'string',
							'description' => 'Date range preset',
							'required'    => false,
						),
						'from_date' => array(
							'type'        => 'string',
							'description' => 'Start date in Y-m-d format',
							'required'    => false,
						),
						'to_date' => array(
							'type'        => 'string',
							'description' => 'End date in Y-m-d format',
							'required'    => false,
						),
					),
				),
			)
		);

		// TTS-249: save_schedule_report / get_schedule_report are NOT registered by
		// the free plugin (their handlers were "requires Pro" trialware stubs).
		// Registered by the Pro plugin under the tta/v1 namespace instead.

		// register compatible_data route.
		register_rest_route(
			$this->namespace,
			'/compatible_data',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->compatibility, 'compatible_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register onboarding-event route (wizard analytics).
		register_rest_route(
			$this->namespace,
			'/onboarding-event',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'handle_onboarding_event' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'event' => array(
							'type'        => 'string',
							'required'    => true,
							'enum'        => array( 'wizard_started', 'step_completed', 'wizard_completed', 'wizard_skipped' ),
						),
						'step' => array(
							'type'        => 'integer',
							'required'    => false,
						),
						'data' => array(
							'type'        => 'object',
							'required'    => false,
						),
					),
				),
			)
		);

		// register text_alias route.
		register_rest_route(
			$this->namespace,
			'/text_alias',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'text_alias' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);


		// register get_all_user_roles route.
		register_rest_route(
			$this->namespace,
			'/get_all_user_roles',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_all_user_roles' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register acf_fields route.
		register_rest_route(
			$this->namespace,
			'/acf_fields',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'acf_fields' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register categories_and_tags route.
		register_rest_route(
			$this->namespace,
			'/categories_and_tags',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'categories_and_tags' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// TTS-240: CORS alert (public, rate-limited). Front-end posts here when
		// one of our scripts fails to load from a CDN due to missing CORS header.
		//
		// TTS-247: intentionally public — uses '__return_true' instead of
		// get_route_access() because the request originates from anonymous
		// front-end visitors (no nonce available). The handler itself
		// hard-rate-limits with a 1-hour transient lock (cors_alert(), line
		// ~550) so the surface is safe.
		register_rest_route(
			$this->namespace,
			'/cors-alert',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'cors_alert' ),
					'permission_callback' => '__return_true',
					'args'                => array(),
				),
			)
		);

		// TTS-238 v5 §14 (D0b) — AtlasVoice REST routes moved into
		// `\TTA\AtlasVoice\RestRoutes::register_routes()`. This legacy
		// file carries no AtlasVoice endpoint registration; the Bootstrap
		// wires RestRoutes on `rest_api_init` independently.

		// TTS-247: Settings → Danger zone "Reset all plugin data" button.
		// Admin-only (gated by get_route_access). Requires a literal
		// confirmation string "DELETE" in the body to guard against
		// accidental triggers from CSRF or stale UI sessions.
		register_rest_route(
			$this->namespace,
			'/reset_plugin_data',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'reset_plugin_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

	}

	/**
	 * TTS-247: Reset every option, transient, post-meta row, cron event and
	 * the analytics DB table this plugin created. Surfaces a "fresh-install"
	 * state without uninstalling the plugin itself.
	 *
	 * Triple-gated:
	 *  - get_route_access permission_callback enforces manage_options + nonce.
	 *  - This handler additionally requires the request body to contain
	 *    `confirm === 'DELETE'` so an accidental click in an old browser
	 *    tab can't wipe the site.
	 *  - The React UI requires the user to type DELETE before the button
	 *    becomes enabled.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function reset_plugin_data( $request ) {
		// TTS-247: destructive reset is gated behind TTA_ENABLE_RESET_UI
		// (default false; flip on a test site only). The Settings UI hides
		// the Danger zone when this is off, but we enforce it server-side
		// too so the endpoint can't be hit directly while disabled.
		if ( ! ( defined( 'TTA_ENABLE_RESET_UI' ) && TTA_ENABLE_RESET_UI ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'The reset tool is disabled.', 'text-to-audio' ),
				array( 'status' => 403 )
			);
		}

		$body    = json_decode( (string) $request->get_body(), true );
		$confirm = is_array( $body ) && isset( $body['confirm'] ) ? (string) $body['confirm'] : '';
		if ( 'DELETE' !== $confirm ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Missing or invalid confirmation. Type DELETE to confirm.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		if ( ! class_exists( '\\TTA\\TTA_Reset' ) ) {
			require_once dirname( __DIR__ ) . '/includes/TTA_Reset.php';
		}
		\TTA\TTA_Reset::wipe_plugin_data();

		// TTS-247: re-seed a fresh-install state right after wiping. wipe_plugin_data()
		// is shared with uninstall.php (where re-seeding would be wrong), so this
		// activate() call lives in the reset path only. It recreates the analytics
		// table + indexes and restores default options (incl.
		// tta_customize_settings.buttonSettings), preventing "table doesn't exist"
		// and "undefined buttonSettings" errors when tabs reload after a reset.
		if ( ! class_exists( '\\TTA\\TTA_Activator' ) ) {
			require_once dirname( __DIR__ ) . '/includes/TTA_Activator.php';
		}
		\TTA\TTA_Activator::activate( true );

		return rest_ensure_response( array(
			'status'  => true,
			'message' => __( 'All plugin data has been reset. Reload the page to start fresh.', 'text-to-audio' ),
		) );
	}

	// TTS-238 v5 §14 (D0b) — Handlers moved to \TTA\AtlasVoice\RestRoutes.
	// Legacy wrappers removed; see includes/atlasvoice/RestRoutes.php.


	/**
	 * TTS-240: Record a CORS failure reported by the front-end detector.
	 *
	 * Rate-limited to one write per hour via transient to prevent abuse.
	 * Only accepts URLs pointing at our own plugin directories.
	 */
	public function cors_alert( $request ) {
		$body = $request->get_body();
		$data = json_decode( $body, true );
		$url  = is_array( $data ) && isset( $data['url'] ) ? (string) $data['url'] : '';
		$url  = esc_url_raw( $url );

		if ( ! $url || ! preg_match( '#/plugins/text-to-(audio|speech)[a-z0-9\-]*/#i', $url ) ) {
			return new \WP_Error( 'invalid_url', 'Invalid URL', array( 'status' => 400 ) );
		}

		$site_host   = wp_parse_url( home_url(), PHP_URL_HOST );
		$script_host = wp_parse_url( $url, PHP_URL_HOST );
		if ( ! $script_host || $script_host === $site_host ) {
			return new \WP_Error( 'not_cross_origin', 'Not a cross-origin URL', array( 'status' => 400 ) );
		}

		if ( get_transient( 'tta_cors_alert_lock' ) ) {
			return \rest_ensure_response( array( 'status' => true, 'throttled' => true ) );
		}

		set_transient( 'tta_cors_alert_lock', 1, HOUR_IN_SECONDS );
		update_option( 'tta_cors_detected', array(
			'url'         => $url,
			'script_host' => $script_host,
			'detected_at' => time(),
		), false );

		// Reset any prior dismissal so the banner reappears for new failures.
		delete_user_meta( get_current_user_id() ?: 0, 'tta_dismiss_cors_cdn_issue' );

		return \rest_ensure_response( array( 'status' => true ) );
	}


    /*
     * Manage listening data
     */
	public function tta_manage_listening_data( $request ) {
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'] );

            if(TTA_Helper::is_listening_lang_or_voice_changed($fields)) {
                TTA_Helper::delete_post_meta();
            }

			update_option( 'tta_listening_settings', $fields, false );

			$response['data'] = get_option( 'tta_listening_settings' );
			TTA_Cache::delete( 'all_settings' );

			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_listening_settings' );

			return rest_ensure_response( $response );
		}
	}

	/*
	 * Manage customize data
	 */
	public function tta_manage_customize_data( $request ) {
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'] );

            if(TTA_Helper::is_player_number_changed($fields)) {
                TTA_Helper::delete_post_meta();
            }

			// Extract & save per-player button texts (TTS-241).
			// They travel under the same /customize payload to keep one round-trip.
			if ( is_object( $fields ) && property_exists( $fields, 'button_texts' ) ) {
				$button_texts_raw = $fields->button_texts;
				unset( $fields->button_texts );

				$incoming = json_decode( wp_json_encode( $button_texts_raw ), true );
				if ( is_array( $incoming ) ) {
					$existing = get_option( 'tta__button_text_arr' );
					if ( ! is_array( $existing ) ) {
						$existing = [];
					}
					$players          = isset( $incoming['players'] ) ? $incoming['players'] : [];
					$existing['players'] = \TTA\TTA_Player_Icons::sanitize_players( $players );
					update_option( 'tta__button_text_arr', $existing );
				}
			}

			update_option( 'tta_customize_settings', $fields );

			$response['data'] = get_option( 'tta_customize_settings' );

			TTA_Cache::delete( 'all_settings' );


			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_customize_settings' );

			// Surface the per-player button-text settings under the same
			// /customize GET so the React form can hydrate in one fetch (TTS-241).
			$button_text_arr = get_option( 'tta__button_text_arr' );
			$saved_players   = is_array( $button_text_arr ) && isset( $button_text_arr['players'] ) && is_array( $button_text_arr['players'] )
				? $button_text_arr['players']
				: [];
			// Merge defaults with whatever's saved so the UI always has a
			// fully-populated map for both ids 1 and 2 (TTS-241).
			$defaults = \TTA\TTA_Player_Icons::default_players();
			$players  = $defaults;
			foreach ( $saved_players as $pid => $states ) {
				if ( ! isset( $players[ $pid ] ) || ! is_array( $states ) ) {
					continue;
				}
				$players[ $pid ] = array_replace_recursive( $players[ $pid ], $states );
			}
			$response['button_texts'] = [
				'players'  => $players,
				'presets'  => array_keys( \TTA\TTA_Player_Icons::presets() ),
				'preset_svgs' => \TTA\TTA_Player_Icons::presets(),
				'defaults' => \TTA\TTA_Player_Icons::default_players(),
			];

			return rest_ensure_response( $response );
		}
	}

	/*
	 * Manage settings data
	 */
	public function tta_manage_settings_data( $request ) {
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'] );
			if ( isset( $fields->tta__settings_clear_all_cache ) && $fields->tta__settings_clear_all_cache ) {
				TTA_Cache::flush();
				$fields->tta__settings_clear_all_cache = false;
			} else {
				TTA_Cache::delete( 'all_settings' );
			}

			// TTS-238 D27.11 — Normalize the two pipe-format exclude fields.
			// User can paste comma-, whitespace- or pipe-separated values
			// into the textareas; we always store them as pipe-joined
			// strings (legacy extractor format). Applied at two levels:
			//  - global (top-level keys on $fields)
			//  - per post type ($fields->tta__settings_atlasvoice_per_type_overrides[<slug>])
			// Tags = single-word tokens (split aggressively on whitespace
			// too). Texts = phrases — preserve internal whitespace, only
			// split on the explicit separators a user might use.
			$normalize_tags = function ( $val ) {
				if ( is_array( $val ) ) { $parts = $val; }
				else { $parts = preg_split( '/[\s,;|]+/', (string) $val ); }
				$parts = array_values( array_filter( array_map( 'trim', (array) $parts ), function ( $p ) { return $p !== ''; } ) );
				return implode( '|', $parts );
			};
			$normalize_texts = function ( $val ) {
				// Phrases preserve internal commas/semicolons. Pipe
				// (and newline) are the only legitimate separators.
				if ( is_array( $val ) ) { $parts = $val; }
				else { $parts = preg_split( '/[|\r\n]+/', (string) $val ); }
				$parts = array_values( array_filter( array_map( 'trim', (array) $parts ), function ( $p ) { return $p !== ''; } ) );
				return implode( '|', $parts );
			};
			$apply_to_bag = function ( $bag ) use ( $normalize_tags, $normalize_texts ) {
				$is_obj = is_object( $bag );
				if ( $is_obj && isset( $bag->tta__settings_exclude_tags ) ) {
					$bag->tta__settings_exclude_tags = $normalize_tags( $bag->tta__settings_exclude_tags );
				} elseif ( is_array( $bag ) && isset( $bag['tta__settings_exclude_tags'] ) ) {
					$bag['tta__settings_exclude_tags'] = $normalize_tags( $bag['tta__settings_exclude_tags'] );
				}
				if ( $is_obj && isset( $bag->tta__settings_exclude_texts ) ) {
					$bag->tta__settings_exclude_texts = $normalize_texts( $bag->tta__settings_exclude_texts );
				} elseif ( is_array( $bag ) && isset( $bag['tta__settings_exclude_texts'] ) ) {
					$bag['tta__settings_exclude_texts'] = $normalize_texts( $bag['tta__settings_exclude_texts'] );
				}
				return $bag;
			};
			if ( is_object( $fields ) ) {
				$fields = $apply_to_bag( $fields );
				if ( isset( $fields->tta__settings_atlasvoice_per_type_overrides )
					&& ( is_object( $fields->tta__settings_atlasvoice_per_type_overrides )
						|| is_array( $fields->tta__settings_atlasvoice_per_type_overrides ) ) ) {
					$ovr = $fields->tta__settings_atlasvoice_per_type_overrides;
					foreach ( (array) $ovr as $slug => $bag ) {
						if ( ! is_object( $bag ) && ! is_array( $bag ) ) { continue; }
						$bag = $apply_to_bag( $bag );
						if ( is_object( $ovr ) ) { $ovr->{$slug} = $bag; }
						else { $ovr[ $slug ] = $bag; }
					}
					$fields->tta__settings_atlasvoice_per_type_overrides = $ovr;
				}
			}

			// TTS-247 — the staging/live mode lives inside tta_settings_data,
			// but the dashboard Settings UI doesn't manage it, so a full-option
			// save here would drop the key and silently revert the site to
			// staging (player + MP3 generation vanish). Preserve the stored
			// mode whenever the incoming payload doesn't carry it.
			$existing_raw = get_option( 'tta_settings_data' );
			$existing_arr = is_object( $existing_raw )
				? json_decode( wp_json_encode( $existing_raw ), true )
				: ( is_array( $existing_raw ) ? $existing_raw : array() );
			if ( isset( $existing_arr['tta__settings_atlasvoice_mode'] ) ) {
				$incoming_has_mode = ( is_object( $fields ) && isset( $fields->tta__settings_atlasvoice_mode ) )
					|| ( is_array( $fields ) && isset( $fields['tta__settings_atlasvoice_mode'] ) );
				if ( ! $incoming_has_mode ) {
					if ( is_object( $fields ) ) {
						$fields->tta__settings_atlasvoice_mode = $existing_arr['tta__settings_atlasvoice_mode'];
					} elseif ( is_array( $fields ) ) {
						$fields['tta__settings_atlasvoice_mode'] = $existing_arr['tta__settings_atlasvoice_mode'];
					}
				}
			}

			update_option( 'tta_settings_data', $fields );

			// Mark onboarding as completed if flag is present.
			if ( isset( $fields->tta_onboarding_completed ) && $fields->tta_onboarding_completed ) {
				update_option( 'tta_onboarding_completed', true, false );
			}

			$response['data'] = get_option( 'tta_settings_data' );


			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = TTA_Helper::tts_get_settings( 'settings' );

			return rest_ensure_response( $response );
		}
	}

	/**
	 * TTS-256 — read-along highlight settings (speechSynthesis players 1 & 2).
	 *
	 * Stored as its own option (tta_highlight_settings) and localized to the
	 * front-end via TTA_Helper::tts_get_settings() so admin/js/tts/highlighter.js
	 * can read window.ttsObj.settings.highlight. All values are sanitized here.
	 *
	 * @param \WP_REST_Request $request
	 *
	 * @return \WP_REST_Response
	 */
	public function tta_manage_highlight_settings( $request ) {
		$response['status'] = true;

		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'], true );
			$fields = is_array( $fields ) ? $fields : array();

			$mode = isset( $fields['tta__highlight_mode'] ) ? $fields['tta__highlight_mode'] : 'sentence';
			if ( ! in_array( $mode, array( 'word_sentence', 'word', 'sentence' ), true ) ) {
				$mode = 'sentence';
			}

			$word_bg     = isset( $fields['tta__highlight_word_bg'] ) ? sanitize_hex_color( $fields['tta__highlight_word_bg'] ) : '';
			$word_color  = isset( $fields['tta__highlight_word_color'] ) ? sanitize_hex_color( $fields['tta__highlight_word_color'] ) : '';
			$sentence_bg = isset( $fields['tta__highlight_sentence_bg'] ) ? sanitize_hex_color( $fields['tta__highlight_sentence_bg'] ) : '';

			$opacity = isset( $fields['tta__highlight_dim_opacity'] ) ? floatval( $fields['tta__highlight_dim_opacity'] ) : 0.7;
			$opacity = max( 0.1, min( 0.85, $opacity ) );

			// TTS-263 — announcement strategy for the selection-listen feature.
			$announce = isset( $fields['tta__selection_announce'] ) ? $fields['tta__selection_announce'] : 'tip';
			if ( ! in_array( $announce, array( 'tip', 'badge', 'both', 'off' ), true ) ) {
				$announce = 'tip';
			}

			$clean = array(
				'tta__highlight_enabled'     => ! empty( $fields['tta__highlight_enabled'] ),
				'tta__highlight_mode'        => $mode,
				'tta__highlight_word_bg'     => $word_bg ? $word_bg : '#a5abf0',
				'tta__highlight_word_color'  => $word_color ? $word_color : '#202124',
				'tta__highlight_sentence_bg' => $sentence_bg ? $sentence_bg : '#e8e7fe',
				'tta__highlight_dim_enabled' => ! empty( $fields['tta__highlight_dim_enabled'] ),
				'tta__highlight_dim_opacity' => $opacity,
				'tta__highlight_autoscroll'  => ! empty( $fields['tta__highlight_autoscroll'] ),
				// TTS-263 — "Listen to selected text" floating control (all players).
				'tta__selection_listen_enabled' => ! empty( $fields['tta__selection_listen_enabled'] ),
				'tta__selection_announce'       => $announce,
			);

			update_option( 'tta_highlight_settings', $clean, false );
			TTA_Cache::delete( 'all_settings' ); // invalidate the merged tts_get_settings cache.

			$response['data'] = $clean;

			return rest_ensure_response( $response );
		}

		if ( 'get' == $request['method'] ) {
			$response['data'] = TTA_Helper::tts_get_settings( 'highlight' );

			return rest_ensure_response( $response );
		}
	}

	/**
	 * @param WP_REST_Request
	 *
	 * @return WP_Rest_Response;
	 */
	public function tta_browser_settings( $request ) {

		$browser           = isset( $request['browserName'] ) ? $request['browserName'] : "Mozilla";
		$SpeechRecognition = isset( $request['SpeechRecognition'] ) ? $request['SpeechRecognition'] : "undefined";
		$speechSynthesis   = isset( $request['speechSynthesis'] ) ? $request['speechSynthesis'] : "undefined";
		update_option( 'tta_current_browser_info', [
			'browser'           => $browser,
			'SpeechRecognition' => $SpeechRecognition,
			'speechSynthesis'   => $speechSynthesis,
		], false );

		return rest_ensure_response( get_option( 'tta_current_browser_info' ) );
	}

	public function text_alias( $request ) {
		$response['status'] = true;
		// save data.
		if ( 'post' == $request['method'] ) {
			// TTS-319: keep the stored shape {actual_text, to_read} and only add
			// apply_to_numbers when set. Trimming here (not only in the React
			// form) fixes aliases saved through any client.
			$fields = array();
			foreach ( (array) json_decode( $request['aliases'] ) as $alias ) {
				$alias       = (array) $alias;
				$actual_text = isset( $alias['actual_text'] ) ? trim( sanitize_text_field( (string) $alias['actual_text'] ) ) : '';
				$to_read     = isset( $alias['to_read'] ) ? trim( sanitize_text_field( (string) $alias['to_read'] ) ) : '';
				if ( '' === $actual_text ) {
					continue;
				}
				$row = array(
					'actual_text' => $actual_text,
					'to_read'     => $to_read,
				);
				if ( ! empty( $alias['apply_to_numbers'] ) ) {
					$row['apply_to_numbers'] = true;
				}
				$fields[] = (object) $row;
			}

			update_option( 'tts_text_aliases', $fields, false );

			$response['data'] = get_option( 'tts_text_aliases' );

			TTA_Cache::delete( 'all_settings' );

			return rest_ensure_response( $response );
		}

		// get data.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tts_text_aliases' );

			return rest_ensure_response( $response );
		}
	}

	public function get_all_user_roles( $request ) {
		// Access the global $wp_roles object
		if ( ! isset( $wp_roles ) ) {
			global $wp_roles;
		}

		// Get all roles
		$all_roles = $wp_roles->roles;

		$user_roles        = [];
		$user_roles['all'] = 'All';

		// Output all roles
		foreach ( $all_roles as $role_key => $role_data ) {
			$user_roles[ $role_key ] = $role_data['name'];
		}

		$response['status'] = true;

		$response['data'] = $user_roles;

		return rest_ensure_response( $response );
	}

	public function acf_fields( $request ) {
		$acf_fields = [];
		if ( TTA_Helper::is_acf_active() ) {
			$acf_fields = TTA_Helper::get_all_acf_fields();
		}

		$response['status'] = true;

		$response['data'] = $acf_fields;

		return rest_ensure_response( $response );
	}

	public function categories_and_tags( $request ) {
		$categories = [];
		$categories = TTA_Helper::get_all_categories();

		$tags = [];
		$tags = TTA_Helper::get_all_tags();

		$post_types = [];
		$post_types = TTA_Helper::get_post_types();

		$post_status = [];
		$post_status  = TTA_Helper::all_post_status();

		$response['status'] = true;

		$response['data'] = [
			'categories' => $categories,
			'tags' => $tags,
			'post_types' => $post_types,
			'post_status' => $post_status,
		];

		return rest_ensure_response( $response );
	}


	/**
	 * Handle onboarding wizard analytics events.
	 *
	 * Stores individual events in tta_onboarding_events and maintains
	 * a quick-access summary in tta_onboarding_summary.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public function handle_onboarding_event( $request ) {
		$event = sanitize_text_field( $request->get_param( 'event' ) );
		$step  = $request->get_param( 'step' );
		$data  = $request->get_param( 'data' );

		// Build the event record.
		$record = array(
			'event'     => $event,
			'step'      => $step ? absint( $step ) : null,
			'timestamp' => time(),
		);
		if ( ! empty( $data ) && is_array( $data ) ) {
			$record['data'] = array_map( 'sanitize_text_field', $data );
		}

		// Append to the events log (cap at 200 entries to avoid unbounded growth).
		$events   = get_option( 'tta_onboarding_events', array() );
		$events[] = $record;
		if ( count( $events ) > 200 ) {
			$events = array_slice( $events, -200 );
		}
		update_option( 'tta_onboarding_events', $events, false );

		// Update the summary option.
		$summary = get_option( 'tta_onboarding_summary', array(
			'wizard_started'     => false,
			'steps_completed'    => array(),
			'wizard_completed'   => false,
			'wizard_skipped'     => false,
			'completed_at'       => null,
			'time_spent_seconds' => null,
		) );

		switch ( $event ) {
			case 'wizard_started':
				$summary['wizard_started'] = true;
				break;

			case 'step_completed':
				if ( $step ) {
					$completed = (array) ( $summary['steps_completed'] ?? array() );
					if ( ! in_array( absint( $step ), $completed, true ) ) {
						$completed[] = absint( $step );
						sort( $completed );
					}
					$summary['steps_completed'] = $completed;
				}
				break;

			case 'wizard_completed':
				$summary['wizard_completed'] = true;
				$summary['completed_at']     = gmdate( 'c' );
				if ( ! empty( $data['time_spent_seconds'] ) ) {
					$summary['time_spent_seconds'] = absint( $data['time_spent_seconds'] );
				}
				break;

			case 'wizard_skipped':
				$summary['wizard_skipped'] = true;
				break;
		}

		update_option( 'tta_onboarding_summary', $summary, false );

		return rest_ensure_response( array( 'status' => true ) );
	}

    // TTS-247: get_route_access_old() and get_route_access_new() were dead
    // experimentation copies superseded by get_route_access() below. Removed
    // so the reviewer's grep doesn't hit unused permission_callback variants.

    /**
     * Permission callback for every REST route registered with this->namespace.
     *
     * Three policy tiers — first match wins, otherwise the request is denied:
     *
     *   1. ADMIN-ONLY — request must come from a logged-in user with the
     *      `manage_options` capability. Used for every route that reads or
     *      writes plugin configuration, settings, or analytics (`/customize`,
     *      `/settings`, `/listening`, `/save_analytics_settings`,
     *      `/get_analytics_settings`, `/compatible_data`, `/text_alias`,
     *      `/insights`, `/all_insights`, `/latest_posts`,
     *      `/categories_and_tags`, `/acf_fields`, `/browser`,
     *      `/get_all_user_roles`, `/aggregated_insights`, `/trend_data`,
     *      `/filtered_insights`, `/onboarding-event`).
     *      Premium analytics endpoints (`heatmap_data`, `export_csv`,
     *      `export_pdf`, `save_schedule_report`, `get_schedule_report`,
     *      `send_test_report`) live in the Pro plugin under `tta_pro/v1/`
     *      with their own permission check.
     *
     *   2. FRONTEND-NONCE — request must carry a valid `wp_rest` nonce in the
     *      `X-WP-Nonce` header or the `rest_nonce` body field. Used by
     *      `/track` (listener events), `/geolocation` (per-listener city /
     *      country lookup, behind the opt-in flag). No capability check —
     *      frontend visitors aren't logged in.
     *
     *   3. DEFAULT DENY — any route reaching this callback that isn't in
     *      either list above is rejected with HTTP 403.
     *
     * Routes that are intentionally public (e.g. `/cors-alert`) bypass this
     * callback entirely by registering with `'permission_callback' =>
     * '__return_true'` and a code comment explaining the public exposure.
     *
     * @param \WP_REST_Request $request
     * @return true|\WP_Error
     *
     * @see TTA_Api_Routes::get_route_access() — defined below the TTS-266
     *      audio panel handlers that follow this block.
     */

    /**
     * TTS-314: one batch of player 3 audio.
     *
     * Output buffered like Pro's route (TTS-275): a PHP notice printed on a host
     * with display_errors on must not corrupt the JSON the player reads.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function atlasvoice_gtts_batch( $request ) {
        ob_start();
        $result = \TTA\TTA_GTTS_Generation::handle( json_decode( $request->get_body(), true ) );
        ob_end_clean();

        return rest_ensure_response( $result );
    }

    /**
     * TTS-314: service state for the Listening screen (never the key itself).
     *
     * @return \WP_REST_Response
     */
    public function atlasvoice_service_state() {
        // Ask the service now, not the 10-minute cache: a key revoked in the
        // dashboard must show as disconnected the moment Listening opens.
        \TTA\TTA_AtlasVoice_Service::refresh_usage( true );

        return rest_ensure_response( array( 'status' => true, 'data' => \TTA\TTA_AtlasVoice_Service::public_state() ) );
    }

    /**
     * TTS-314: the site owner ticked the consent box and pressed Connect.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function atlasvoice_service_connect( $request ) {
        $body = json_decode( $request->get_body(), true );

        if ( empty( $body['consent'] ) ) {
            return rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'Tick the box to agree before connecting.', 'text-to-audio' ),
            ) );
        }

        $email = isset( $body['email'] ) ? $body['email'] : '';
        // TTS-314: "Move this site to my email" — prove control of the site
        // instead of registering (the site belongs to another email).
        $result = empty( $body['takeover'] )
            ? \TTA\TTA_AtlasVoice_Service::connect( $email )
            : \TTA\TTA_AtlasVoice_Service::takeover( $email );

        if ( is_wp_error( $result ) ) {
            $data = (array) $result->get_error_data();
            return rest_ensure_response( array(
                'status'    => false,
                'code'      => $result->get_error_code(),
                'message'   => $result->get_error_message(),
                'ownerHint' => isset( $data['owner_hint'] ) ? $data['owner_hint'] : '',
                'takeover'  => ! empty( $data['takeover'] ),
            ) );
        }

        // Optional, unticked by default: the owner chose to share diagnostic data.
        // Same as the tracking notice's "Allow" (wp.org Guideline 7: opt-in only).
        if ( ! empty( $body['share_diagnostics'] ) && \TTA\TTA_Lib_AtlasAiDev::instance()->can_offer_tracking() ) {
            \TTA\TTA_Lib_AtlasAiDev::instance()->trackerOptIn();
        }

        return rest_ensure_response( array( 'status' => true, 'data' => \TTA\TTA_AtlasVoice_Service::public_state() ) );
    }

    /**
     * TTS-314: withdraw consent. Stored audio stays and keeps playing.
     *
     * @return \WP_REST_Response
     */
    public function atlasvoice_service_disconnect() {
        \TTA\TTA_AtlasVoice_Service::disconnect();

        return rest_ensure_response( array( 'status' => true, 'data' => \TTA\TTA_AtlasVoice_Service::public_state() ) );
    }

    /**
     * TTS-266: delete one or more generated MP3s for a post.
     *
     * Free owns this so a site without Pro can still manage stored audio. It
     * only ever removes files it can resolve back inside wp_upload_dir() — a URL
     * that resolves nowhere (a signed cloud link) drops out of the meta and is
     * handed to `atlasvoice_mp3_deleted` so Pro can clean its bucket.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function atlasvoice_delete_mp3( $request ) {
        $body    = json_decode( $request->get_body(), true );
        $post_id = is_array( $body ) && isset( $body['post_id'] ) ? absint( $body['post_id'] ) : 0;

        if ( ! $post_id ) {
            return \rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'Missing post id.', 'text-to-audio' ),
            ) );
        }

        $file_urls = \get_post_meta( $post_id, 'tts_mp3_file_urls', true );
        if ( ! is_array( $file_urls ) ) {
            $file_urls = array();
        }
        if ( isset( $file_urls[0] ) && is_array( $file_urls[0] ) ) {
            $file_urls = $file_urls[0];
        }

        $keys = array();
        if ( isset( $body['language_keys'] ) && is_array( $body['language_keys'] ) ) {
            $keys = array_map( 'sanitize_text_field', $body['language_keys'] );
        }
        if ( ! empty( $body['delete_all'] ) ) {
            $keys = array_keys( $file_urls );
        }

        $keys = array_values( array_unique( array_filter( $keys ) ) );

        if ( empty( $keys ) ) {
            return \rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'Nothing selected to delete.', 'text-to-audio' ),
            ) );
        }

        $deleted = array();
        $removed = array();

        foreach ( $keys as $key ) {
            if ( ! isset( $file_urls[ $key ] ) ) {
                continue;
            }

            $url  = $file_urls[ $key ];
            $path = \TTA\TTA_Helper::atlasvoice_path_from_url( strtok( $url, '?' ) );

            if ( $path && file_exists( $path ) ) {
                $fs = \TTA\TTA_Audio_Storage::filesystem();
                if ( $fs ) {
                    $fs->delete( $path );
                } else {
                    // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink -- WP_Filesystem unavailable.
                    @unlink( $path );
                }

                // TTS-256: the word-timing sidecar belongs to the same audio.
                $sidecar = preg_replace( '/\.mp3$/', '.json', $path );
                if ( $sidecar && $sidecar !== $path && file_exists( $sidecar ) ) {
                    $fs ? $fs->delete( $sidecar ) : @unlink( $sidecar );
                }
            }

            $removed[ $key ] = $url;
            unset( $file_urls[ $key ] );
            $deleted[] = $key;
        }

        if ( empty( $file_urls ) ) {
            \delete_post_meta( $post_id, 'tts_mp3_file_urls' );
            \delete_post_meta( $post_id, 'tts_is_mp3_file_url_exists' );
        } else {
            \update_post_meta( $post_id, 'tts_mp3_file_urls', $file_urls );
        }

        /**
         * Fires after the local files and meta are gone.
         *
         * Pro listens to remove the matching objects from cloud storage — Free has
         * no business knowing that storage exists.
         *
         * @param int   $post_id
         * @param array $removed Map of language key => URL that was removed.
         */
        \do_action( 'atlasvoice_mp3_deleted', $post_id, $removed );

        \TTA\TTA_Cache::flush();

        return \rest_ensure_response( array(
            'status'  => true,
            'deleted' => $deleted,
            'urls'    => $file_urls,
            // TTS-312: the panel re-renders from this, so it never guesses.
            'state'   => \TTA\TTA_Helper::atlasvoice_panel_state( get_post( $post_id ) ),
        ) );
    }

    /**
     * TTS-312: replace one row of the audio panel with a hand-made MP3.
     *
     * The row decides the language, voice and file name, so the uploaded file can
     * be called anything. Only rows the active player uses can be replaced; a
     * file made by another player or setting can only be removed.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function atlasvoice_upload_mp3( $request ) {
        $post_id = absint( $request->get_param( 'post_id' ) );
        $key     = sanitize_text_field( (string) $request->get_param( 'key' ) );
        $files   = $request->get_file_params();
        $post    = $post_id ? get_post( $post_id ) : null;

        if ( ! $post || '' === $key || empty( $files['file'] ) ) {
            return \rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'Missing post, language or file.', 'text-to-audio' ),
            ) );
        }

        $file = $files['file'];

        if ( ! empty( $file['error'] ) || empty( $file['tmp_name'] ) || ! is_uploaded_file( $file['tmp_name'] ) ) {
            return \rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'The upload did not arrive intact.', 'text-to-audio' ),
            ) );
        }

        // Trust the bytes, not the browser's Content-Type: wp_check_filetype_and_ext
        // sniffs the real file. An .mp3 name over a non-MP3 body is refused here.
        $checked = \wp_check_filetype_and_ext( $file['tmp_name'], 'upload.mp3', array( 'mp3' => 'audio/mpeg' ) );

        if ( empty( $checked['ext'] ) || 'mp3' !== $checked['ext'] || 'audio/mpeg' !== $checked['type'] ) {
            return \rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'That file is not an MP3.', 'text-to-audio' ),
            ) );
        }

        $state = \TTA\TTA_Helper::atlasvoice_panel_state( $post );
        $row   = null;
        foreach ( $state['rows'] as $candidate ) {
            if ( ! empty( $candidate['canReplace'] ) && strtolower( $candidate['key'] ) === strtolower( $key ) ) {
                $row = $candidate;
                break;
            }
        }

        $name = $row ? \TTA\TTA_Audio_Storage::safe_name( $row['fileName'] ) : '';

        if ( ! $row || '' === $name ) {
            return \rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'This audio cannot be replaced with the current player.', 'text-to-audio' ),
            ) );
        }

        /**
         * Where uploaded audio is written, per player.
         *
         * The plugin that owns the active MP3 player answers with the folder that
         * player reads from, so a replacement lands where the player looks.
         *
         * @param array $target array( 'dir' => path, 'url' => url ) with trailing slashes.
         */
        $target = (array) \apply_filters( 'atlasvoice_upload_target', array(), $post_id );

        if ( empty( $target['dir'] ) || empty( $target['url'] ) ) {
            return \rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'The active player does not play uploaded audio.', 'text-to-audio' ),
            ) );
        }

        $date_path = \TTA\TTA_Audio_Storage::safe_date_path( (string) $state['path'] );
        $dir       = \trailingslashit( $target['dir'] ) . ( $date_path ? \trailingslashit( $date_path ) : '' );
        $dir_url   = \trailingslashit( $target['url'] ) . ( $date_path ? \trailingslashit( $date_path ) : '' );

        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- reading PHP's own upload temp file.
        $contents = file_get_contents( $file['tmp_name'] );

        if ( false === $contents || ! \TTA\TTA_Audio_Storage::put_contents( $dir . $name . '.mp3', $contents ) ) {
            return \rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'The file could not be written. Check the uploads folder permissions.', 'text-to-audio' ),
            ) );
        }

        $file_urls = \TTA\TTA_Helper::atlasvoice_normalise_urls( \get_post_meta( $post_id, 'tts_mp3_file_urls', true ) );
        $meta_key  = $row['storedKey'] ? $row['storedKey'] : $row['key'];

        $file_urls[ $meta_key ] = $dir_url . $name . '.mp3';

        \update_post_meta( $post_id, 'tts_mp3_file_urls', $file_urls );
        \update_post_meta( $post_id, 'tts_is_mp3_file_url_exists', true );
        \TTA\TTA_Helper::atlasvoice_mark_audio_current( $post_id, $meta_key, $name . '.mp3' );

        \TTA\TTA_Cache::flush();

        return \rest_ensure_response( array(
            'status' => true,
            'state'  => \TTA\TTA_Helper::atlasvoice_panel_state( get_post( $post_id ) ),
        ) );
    }

    public function get_route_access( $request ) {
        $route  = $request->get_route();

        // 1️⃣ Admin-only routes
        $admin_only = array(
            '/tta/v1/customize',
            '/tta/v1/settings',
            // Alias of /settings — same admin-only gate. Added so the WP-Ghost-safe
            // '/settings-data' route the dashboard now calls isn't denied by default.
            '/tta/v1/settings-data',
            '/tta/v1/highlight',
            '/tta/v1/listening',
            '/tta/v1/save_analytics_settings',
            '/tta/v1/get_analytics_settings',
            '/tta/v1/compatible_data',
            '/tta/v1/text_alias',
            '/tta/v1/insights',
            '/tta/v1/all_insights',
            '/tta/v1/latest_posts',
            '/tta/v1/categories_and_tags',
            '/tta/v1/acf_fields',
            '/tta/v1/browser',
            '/tta/v1/get_all_user_roles',
            '/tta/v1/aggregated_insights',
            // TTS-249/2.2.2: trend_data/heatmap_data/export_csv/export_pdf/
            // save_schedule_report/get_schedule_report were moved out of Free to the Pro plugin (3.3.0+)
            // and re-registered under `tta_pro/v1/` with their own permission
            // check (see Pro's TTA_Pro_Api_Routes + TTA_Pro_AtlasVoice_Analytics).
            '/tta/v1/filtered_insights',
            '/tta/v1/onboarding-event',
            // TTS-247: new admin-only route for the Danger zone reset button.
            '/tta/v1/reset_plugin_data',
            // TTS-314: connecting to the speech service records consent for the site.
            '/tta/v1/atlasvoice_service',
            // TTS-238 / merge note: /language-context (D27.30) and
            // /auth-variant (pre-D27.28) were retired so they're no longer
            // in this allowlist.
        );

        if ( in_array( $route, $admin_only, true ) ) {
            if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
                return new \WP_Error(
                    'rest_forbidden',
                    __( 'You do not have permission to access this resource.', 'text-to-audio' ),
                    array( 'status' => 403 )
                );
            }
            return true;
        }

        // 2️⃣ Post-editor routes: nonce, plus edit rights on THAT post.
        //
        // TTS-266. Deliberately not manage_options — an author managing the audio
        // of their own post is normal editorial work, and the capability check is
        // per-post rather than global so it cannot be used to touch someone else's.
        $post_editor_routes = array(
            '/tta/v1/delete_mp3_file',
            '/tta/v1/upload_mp3_file',
        );

        if ( in_array( $route, $post_editor_routes, true ) ) {
            $nonce = isset( $_SERVER['HTTP_X_WP_NONCE'] )
                ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_WP_NONCE'] ) )
                : '';

            if ( ! $nonce || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
                return new \WP_Error(
                    'rest_forbidden',
                    __( 'Invalid or missing nonce.', 'text-to-audio' ),
                    array( 'status' => 403 )
                );
            }

            // The id arrives as JSON on delete and as multipart on upload.
            $post_id = (int) $request->get_param( 'post_id' );
            if ( ! $post_id ) {
                $body    = json_decode( $request->get_body(), true );
                $post_id = is_array( $body ) && isset( $body['post_id'] ) ? (int) $body['post_id'] : 0;
            }

            if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
                return new \WP_Error(
                    'rest_forbidden',
                    __( 'You cannot edit this post.', 'text-to-audio' ),
                    array( 'status' => 403 )
                );
            }

            return true;
        }

        // 3️⃣ Frontend routes that require nonce verification (e.g. analytics tracking)
        $frontend_post_routes = array(
            '/tta/v1/track',
            // TTS-314: player 3 generation; the handler adds its own active-player,
            // published-post, consent and per-post lock checks.
            '/tta/v1/gtts',
            '/tta/v1/geolocation',
        );

        if ( in_array( $route, $frontend_post_routes, true )  ) {
            // Verify nonce from header or body
            $nonce = '';
            if ( isset( $_SERVER['HTTP_X_WP_NONCE'] ) ) {
                $nonce = sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_WP_NONCE'] ) );
            } elseif ( isset( $request['rest_nonce'] ) ) {
                $nonce = sanitize_text_field( wp_unslash( $request['rest_nonce'] ) );
            }

            if ( $nonce && wp_verify_nonce( $nonce, 'wp_rest' ) ) {
                return true;
            }

            return new \WP_Error(
                'rest_forbidden',
                __( 'Invalid or missing nonce for frontend POST request.', 'text-to-audio' ),
                array( 'status' => 403 )
            );
        }

        // 4️⃣ Default: deny all others
        return new \WP_Error(
            'rest_forbidden',
            __( 'Invalid nonce or insufficient permissions.', 'text-to-audio' ),
            array( 'status' => 403 )
        );
    }


}
