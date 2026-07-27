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
		 * TTS-266: player 7 (AtlasVoice Cloud) batch synthesis.
		 *
		 * Visitor-callable, like Pro's `gtts` route for player 3 — a first play
		 * triggers generation. It is nonce-gated through get_route_access()'s
		 * frontend list rather than capability-gated, and duplicate work is
		 * prevented by the generation lock, not by a permission check.
		 *
		 * Registered only when the feature flag is on, so existing installs do
		 * not expose an endpoint for an unfinished feature.
		 */
		if ( defined( 'TTA_ENABLE_ATLASVOICE_CLOUD' ) && TTA_ENABLE_ATLASVOICE_CLOUD ) {
			register_rest_route(
				$this->namespace,
				'/atlasvoice_synthesize',
				array(
					array(
						'methods'             => \WP_REST_Server::CREATABLE,
						'callback'            => array( $this, 'atlasvoice_synthesize' ),
						'permission_callback' => array( $this, 'get_route_access' ),
						'args'                => array(),
					),
				)
			);
		}

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
			$fields = json_decode( $request['aliases'] );

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
     *      country lookup, behind the opt-in flag) and, when the feature flag is
     *      on, `/atlasvoice_synthesize` (TTS-266 player 7 generation, triggered
     *      by a visitor's first play). No capability check — frontend visitors
     *      aren't logged in.
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
     *      player 7 helpers that follow this block.
     */

    /**
     * TTS-266: player 7 (AtlasVoice Cloud) — synthesize one batch.
     *
     * Deliberately mirrors Pro's player 3 `gtts` flow so the front end needs no
     * new logic: one POST per batch, `{title}-{n}.mp3` written per batch, and on
     * the last batch the parts are concatenated into `{title}.mp3`.
     *
     * Differences from Pro, both on purpose:
     *   - WP_Filesystem instead of file_get_contents/file_put_contents, because
     *     Free is wp.org-hosted and Plugin Check flags the raw calls.
     *   - Paths and titles are re-sanitised server side; the request is public,
     *     so nothing from the body is trusted as a filesystem path.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function atlasvoice_synthesize( $request ) {

        $body = json_decode( $request->get_body(), true );

        if ( ! is_array( $body ) ) {
            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => 'invalid_body', 'file_already_exists' => false ),
            ) );
        }

        // Only serve this route while the site is actually on player 7, so it can
        // never be used as a generic synthesis proxy.
        if ( 7 !== (int) get_player_id() ) {
            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => 'player_not_active', 'file_already_exists' => false ),
            ) );
        }

        $post_id    = isset( $body['post_id'] ) ? absint( $body['post_id'] ) : 0;
        $user_id    = isset( $body['user_id'] ) ? absint( $body['user_id'] ) : 0;
        $content    = isset( $body['content'] ) ? (string) $body['content'] : '';
        $title      = self::atlasvoice_safe_name( isset( $body['title'] ) ? $body['title'] : '' );
        $temp_title = self::atlasvoice_safe_name( isset( $body['temp_title'] ) ? $body['temp_title'] : '' );
        $date_path  = self::atlasvoice_safe_date_path( isset( $body['path'] ) ? $body['path'] : '' );
        $is_last    = ! empty( $body['is_last_batch'] );

        if ( '' === $title || '' === $temp_title || '' === trim( $content ) ) {
            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => 'missing_parameters', 'file_already_exists' => false ),
            ) );
        }

        $dir           = trailingslashit( TTA_ATLASVOICE_DIR . $date_path );
        $dir_url       = trailingslashit( TTA_ATLASVOICE_DIR_URL . $date_path );
        $final_file    = $dir . $title . '.mp3';
        $transient_key = "mp3_generation_lock__post_id__{$post_id}";

        // Already generated: tell the front end to stop batching and just play it.
        if ( file_exists( $final_file ) && filesize( $final_file ) > 0 ) {
            delete_transient( $transient_key );

            return \rest_ensure_response( array(
                'status' => true,
                'data'   => array(
                    'url'                 => $dir_url . $title . '.mp3',
                    'message'             => '',
                    'file_already_exists' => true,
                ),
            ) );
        }

        // Another visitor is already generating this post — back off rather than
        // paying for the same audio twice.
        $lock = get_transient( $transient_key );
        if ( is_array( $lock ) && isset( $lock['post_id'] ) && (int) $lock['post_id'] === $post_id
             && isset( $lock['user_id'] ) && (int) $lock['user_id'] !== $user_id ) {
            return \rest_ensure_response( array(
                'status' => true,
                'data'   => array( 'url' => '', 'message' => 'locked', 'file_already_exists' => false ),
            ) );
        }

        if ( ! $lock ) {
            set_transient( $transient_key, array( 'user_id' => $user_id, 'post_id' => $post_id ), 300 );
        }

        // ---- ask the service for this batch -------------------------------
        $settings          = isset( $body['settings'] ) && is_array( $body['settings'] ) ? $body['settings'] : array();
        $payload           = $body;
        $payload['title']  = $title;
        $payload['temp_title'] = $temp_title;
        $payload['path']   = $date_path;
        $payload['site_url'] = \site_url();

        $response = \wp_remote_post( TTA_ATLASVOICE_API_URL, array(
            'body'    => \wp_json_encode( $payload ),
            'headers' => array( 'Content-Type' => 'application/json' ),
            'timeout' => 60,
            'method'  => 'POST',
        ) );

        if ( \is_wp_error( $response ) ) {
            delete_transient( $transient_key );

            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => $response->get_error_message(), 'file_already_exists' => false ),
            ) );
        }

        $decoded = json_decode( \wp_remote_retrieve_body( $response ), true );

        if ( ! is_array( $decoded ) || empty( $decoded['path'] ) ) {
            delete_transient( $transient_key );

            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => 'synthesis_failed', 'file_already_exists' => false ),
            ) );
        }

        // ---- fetch the generated batch and store it ------------------------
        $audio = \wp_remote_get( $decoded['path'], array( 'timeout' => 60 ) );

        if ( \is_wp_error( $audio ) ) {
            delete_transient( $transient_key );

            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => $audio->get_error_message(), 'file_already_exists' => false ),
            ) );
        }

        $audio_body = \wp_remote_retrieve_body( $audio );

        if ( '' === $audio_body ) {
            delete_transient( $transient_key );

            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => 'empty_audio', 'file_already_exists' => false ),
            ) );
        }

        if ( ! self::atlasvoice_put_contents( $dir . $temp_title . '.mp3', $audio_body ) ) {
            delete_transient( $transient_key );

            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => 'not_writable', 'file_already_exists' => false ),
            ) );
        }

        // ---- not the last batch: nothing else to do ------------------------
        if ( ! $is_last ) {
            return \rest_ensure_response( array(
                'status' => true,
                'data'   => array( 'url' => '', 'message' => 'batch_stored', 'file_already_exists' => false ),
            ) );
        }

        // ---- last batch: concatenate, clean up, record ---------------------
        $file_url = self::atlasvoice_merge_batches( $dir, $dir_url, $title );

        delete_transient( $transient_key );

        if ( ! $file_url ) {
            return \rest_ensure_response( array(
                'status' => false,
                'data'   => array( 'url' => '', 'message' => 'merge_failed', 'file_already_exists' => false ),
            ) );
        }

        // Same post meta as every other MP3 player: one entry per language+voice.
        if ( $post_id ) {
            $language = isset( $settings['language'] ) ? $settings['language'] : '';
            $voice    = isset( $settings['voice'] ) ? $settings['voice'] : '';
            $key      = TTA_Helper::tts_get_file_url_key( $language, $voice );

            $file_urls = \get_post_meta( $post_id, 'tts_mp3_file_urls', true );
            $file_urls = is_array( $file_urls ) ? $file_urls : array();
            $file_urls[ $key ] = $file_url;

            \update_post_meta( $post_id, 'tts_mp3_file_urls', $file_urls );
            \update_post_meta( $post_id, 'tts_is_mp3_file_url_exists', true );
        }

        /**
         * Fires once the final MP3 exists on disk.
         *
         * Free does nothing further. Pro hooks this to upload the file to Google
         * Cloud Storage, so a Pro site gets cloud backup whether the audio came
         * from a premium provider or from the free AtlasVoice voice — and a
         * free-only site simply has no listener.
         *
         * @param string $file_path Absolute path to the final MP3.
         * @param string $file_url  Public URL of the final MP3.
         * @param int    $post_id   Post the audio belongs to.
         * @param array  $body      The original request body.
         */
        do_action( 'atlasvoice_final_mp3_written', $dir . $title . '.mp3', $file_url, $post_id, $body );

        return \rest_ensure_response( array(
            'status' => true,
            'data'   => array( 'url' => $file_url, 'message' => 'completed', 'file_already_exists' => false ),
        ) );
    }

    /**
     * TTS-266: strip anything that could escape the audio directory.
     * The route is visitor-callable, so the title is never trusted as a path.
     */
    private static function atlasvoice_safe_name( $name ) {
        $name = \str_replace( ' ', '_', (string) $name );
        $name = \preg_replace( '/[^\p{L}\p{N}_\-]/u', '', $name );

        return \substr( (string) $name, 0, 200 );
    }

    /**
     * TTS-266: the date folder the front end sends, e.g. "2026/07". Digits and
     * slashes only, so no traversal is possible.
     */
    private static function atlasvoice_safe_date_path( $path ) {
        $path = \preg_replace( '#[^0-9/]#', '', (string) $path );
        $path = \trim( (string) $path, '/' );

        return \substr( $path, 0, 20 );
    }

    /**
     * TTS-266: write through WP_Filesystem (Plugin Check forbids the raw calls),
     * creating the directory on demand rather than on every page load.
     */
    private static function atlasvoice_put_contents( $file, $contents ) {
        $fs = self::atlasvoice_filesystem();

        if ( ! $fs ) {
            return false;
        }

        $dir = \dirname( $file );

        if ( ! \is_dir( $dir ) && ! \wp_mkdir_p( $dir ) ) {
            return false;
        }

        // FS_CHMOD_FILE is only defined once wp-admin/includes/file.php has been
        // loaded, so never reference it bare.
        $mode = \defined( 'FS_CHMOD_FILE' ) ? FS_CHMOD_FILE : 0644;

        return (bool) $fs->put_contents( $file, $contents, $mode );
    }

    /**
     * TTS-266: initialise WP_Filesystem once and hand back the instance.
     * The require is idempotent and also defines FS_CHMOD_FILE.
     */
    private static function atlasvoice_filesystem() {
        global $wp_filesystem;

        if ( ! $wp_filesystem ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            \WP_Filesystem();
        }

        return $wp_filesystem ? $wp_filesystem : false;
    }

    /**
     * TTS-266: concatenate `{title}-{n}.mp3` into `{title}.mp3` and drop the parts.
     *
     * Byte concatenation, matching what Pro already does for players 3-6 — MP3
     * frames are self-contained, which is why this works, and also why the
     * resulting VBR header is rebuilt downstream for word timing (TTS-256).
     *
     * @return string|false Public URL of the merged file, or false.
     */
    private static function atlasvoice_merge_batches( $dir, $dir_url, $title ) {
        $fs = self::atlasvoice_filesystem();

        if ( ! $fs ) {
            return false;
        }

        $parts = \glob( $dir . $title . '-*.mp3' );

        if ( empty( $parts ) ) {
            return false;
        }

        // natsort so -2 sorts before -10; a plain sort would reorder the audio.
        \natsort( $parts );

        $combined = '';
        foreach ( $parts as $part ) {
            $chunk = $fs->get_contents( $part );
            if ( false !== $chunk ) {
                $combined .= $chunk;
            }
        }

        if ( '' === $combined ) {
            return false;
        }

        if ( ! self::atlasvoice_put_contents( $dir . $title . '.mp3', $combined ) ) {
            return false;
        }

        foreach ( $parts as $part ) {
            \wp_delete_file( $part );
        }

        return $dir_url . $title . '.mp3';
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

        // 3️⃣ Frontend routes that require nonce verification (e.g. analytics tracking)
        $frontend_post_routes = array(
            '/tta/v1/track',
            '/tta/v1/geolocation',
            // TTS-266: player 7 generation is triggered by a visitor's first play,
            // so it must be reachable without login — but still nonce-verified,
            // which is stricter than Pro's equivalent player 3 route.
            '/tta/v1/atlasvoice_synthesize',
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
