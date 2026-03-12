<?php

namespace TTA_Api;

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

		// register trend_data route for charts.
		register_rest_route(
			$this->namespace,
			'/trend_data',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'trend_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'date_range' => array(
							'type'        => 'string',
							'description' => 'Date range preset',
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

		// register heatmap_data route (Pro only).
		register_rest_route(
			$this->namespace,
			'/heatmap_data',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'heatmap_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'date_range' => array(
							'type'        => 'string',
							'description' => 'Date range preset',
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

		// register export_csv route (Pro only).
		register_rest_route(
			$this->namespace,
			'/export_csv',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'export_csv' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'date_range' => array(
							'type'        => 'string',
							'description' => 'Date range preset',
							'required'    => false,
						),
					),
				),
			)
		);

		// register export_pdf route (Pro only).
		register_rest_route(
			$this->namespace,
			'/export_pdf',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'export_pdf' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'date_range' => array(
							'type'        => 'string',
							'description' => 'Date range preset',
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

		// register save_schedule_report route (Pro only).
		register_rest_route(
			$this->namespace,
			'/save_schedule_report',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'save_schedule_report' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register get_schedule_report route (Pro only).
		register_rest_route(
			$this->namespace,
			'/get_schedule_report',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'get_schedule_report' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// send_test_report moved to Pro plugin (tta_pro/v1/send_test_report).

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

			update_option( 'tta_customize_settings', $fields );

			$response['data'] = get_option( 'tta_customize_settings' );

			TTA_Cache::delete( 'all_settings' );


			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_customize_settings' );

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

			$response['data'] = get_option( 'tta_settings_data' );

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

	/*
	 * Get route access if request is valid.
	 */
	public function get_route_access_old($request) {

        $has_valid_nonce = false;
        if ( isset( $_SERVER['HTTP_X_WP_NONCE'] ) && wp_verify_nonce( wp_unslash( $_SERVER['HTTP_X_WP_NONCE'] ), 'wp_rest' ) ) {
            $has_valid_nonce = true;
        } elseif ( isset( $request['rest_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $request['rest_nonce'] ) ), 'wp_rest' ) ) {
            $has_valid_nonce = true;
        }

		return apply_filters( 'tts_rest_route_access', $has_valid_nonce );
	}

    /**
     * Permission check for REST routes.
     *
     * @param \WP_REST_Request $request
     * @return true|\WP_Error
     */
    public function get_route_access_new( $request ) {
        $route  = $request->get_route();
        $method = strtoupper( $_SERVER['REQUEST_METHOD'] ?? 'GET' );
        $has_valid_nonce = false;

        // Admin-only routes: only users with manage_tts (or manage_options) can access.
        $admin_only = array(
            '/tta/v1/customize',
            '/tta/v1/settings',
            '/tta/v1/save_analytics_settings',
            '/tta/v1/get_analytics_settings',
            '/tta/v1/compatible_data',
            '/tta/v1/text_alias',
            '/tta/v1/insights',
            '/tta/v1/all_insights',
            '/tta/v1/latest_posts',
            '/tta/v1/categories_and_tags',
            '/tta/v1/acf_fields',
            '/tta/v1/browser', // if this truly only returns non-sensitive info
        );

        // If route is admin-only -> enforce capability
        if ( in_array( $route, $admin_only, true ) ) {
            if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
                return new \WP_Error( 'rest_forbidden', __( 'You do not have permission to access this resource.', 'text-to-audio' ), array( 'status' => 403 ) );
            }
            $has_valid_nonce = true;
        }

        // Public read-only routes (allowed for GET without auth)
        $public_get_routes = array(
            '/tta/v1/track', // if this truly only returns non-sensitive info
        );

        // If route is read-only and method is GET -> allow public
        if ( ! $has_valid_nonce && in_array( $route, $public_get_routes, true ) ) {
            $has_valid_nonce = true;
        }

        if ( isset( $_SERVER['HTTP_X_WP_NONCE'] ) && wp_verify_nonce( wp_unslash( $_SERVER['HTTP_X_WP_NONCE'] ), 'wp_rest' ) ) {
            $has_valid_nonce = true;
        } elseif ( isset( $request['rest_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $request['rest_nonce'] ) ), 'wp_rest' ) ) {
            $has_valid_nonce = true;
        }

        if ( $has_valid_nonce ) {
            return true;
        }

        // Fallback: allow logged-in admins
        if ( is_user_logged_in() && current_user_can( 'manage_options' ) ) {
            return true;
        }


        return new \WP_Error( 'rest_forbidden', __( 'Invalid nonce or insufficient permissions.', 'text-to-audio' ), array( 'status' => 403 ) );


    }

    /**
     * Permission check for REST routes.
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
            '/tta/v1/trend_data',
            '/tta/v1/heatmap_data',
            '/tta/v1/export_csv',
            '/tta/v1/export_pdf',
            '/tta/v1/filtered_insights',
            '/tta/v1/save_schedule_report',
            '/tta/v1/get_schedule_report',
            '/tta/v1/onboarding-event',
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
