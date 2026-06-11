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
		register_rest_route(
			$this->namespace,
			'/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'tta_manage_settings_data' ),
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
     *      `/track` (listener events) and `/geolocation` (per-listener city /
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
     */
    public function get_route_access( $request ) {
        $route  = $request->get_route();

        // 1️⃣ Admin-only routes
        $admin_only = array(
            '/tta/v1/customize',
            '/tta/v1/settings',
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
            '/tta/v1/reset_plugin_data',
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
