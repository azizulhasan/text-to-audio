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

		// TTS-238 PR-C (C2a): Read the heal log for the dashboard audit UI.
		// Returns up to the last 50 heal events (ts / scope / old / new / user).
		// Guarded by manage_options via get_route_access (inherited from
		// /save-selector below, same capability).
		register_rest_route(
			$this->namespace,
			'/heal-log',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_heal_log' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// TTS-238 PR-C (C3b): Boilerplate suggestions — the nightly detector
		// output surfaced to the dashboard chip UI. GET returns the cached
		// list; POST (with ?refresh=1) re-runs the detector on demand. Both
		// guarded by admin capability.
		register_rest_route(
			$this->namespace,
			'/boilerplate-suggestions',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_boilerplate_suggestions' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'refresh_boilerplate_suggestions' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// TTS-238 PR-C (C3c): Exclude / un-exclude a boilerplate fragment.
		// POST { text, action: "add"|"remove" }. The fragment is stored in
		// tta_atlasvoice_boilerplate_excluded (autoload=false) and consumed
		// by the content cleaner so the player skips that sentence.
		register_rest_route(
			$this->namespace,
			'/boilerplate-exclude',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'toggle_boilerplate_exclusion' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'text' => array(
							'type'     => 'string',
							'required' => true,
						),
						'action' => array(
							'type'    => 'string',
							'default' => 'add',
						),
					),
				),
			)
		);

		// TTS-238: AtlasVoiceSelector — save the stable CSS selector chosen by
		// the user. Free plugin stores a single global selector; Pro overrides
		// with a per-post-type map keyed under 'per_post_type' in the same option.
		register_rest_route(
			$this->namespace,
			'/save-selector',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_selector' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(
						'selector' => array(
							'type'        => 'string',
							'required'    => true,
							'description' => 'Stable CSS selector picked via AtlasVoiceSelector.',
						),
						'post_type' => array(
							'type'        => 'string',
							'required'    => false,
							'description' => 'Post type to scope the selector to (Pro only).',
						),
						// PR-C (C1c): heal audit fields.
						'reason' => array(
							'type'        => 'string',
							'required'    => false,
							'description' => 'Origin of the save. "heal" means the picker is rewriting a broken saved selector; anything else is a user-initiated save.',
						),
						'old_selector' => array(
							'type'        => 'string',
							'required'    => false,
							'description' => 'When reason="heal", the selector being replaced. Recorded in the heal log for audit + one-click revert.',
						),
					),
				),
			)
		);

	}

	/**
	 * TTS-238: Persist a selector chosen via AtlasVoiceSelector.
	 *
	 * Storage model:
	 *   option 'tta_atlasvoice_selectors' = array(
	 *     'global'        => '#main-content',           // used by Free (and by Pro as fallback)
	 *     'per_post_type' => array( 'post' => '…', 'product' => '…' )  // Pro-only
	 *   )
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function save_selector( $request ) {
		$selector     = trim( (string) $request->get_param( 'selector' ) );
		$post_type    = sanitize_key( (string) $request->get_param( 'post_type' ) );
		// PR-C (C1c): heal audit fields.
		$reason       = sanitize_key( (string) $request->get_param( 'reason' ) );
		$old_selector = trim( (string) $request->get_param( 'old_selector' ) );

		if ( $selector === '' || strlen( $selector ) > 512 ) {
			return new \WP_Error( 'invalid_selector', __( 'Selector is empty or too long.', 'text-to-audio' ), array( 'status' => 400 ) );
		}
		// Basic shape check — allow only characters valid in CSS selectors + escaped unicode.
		if ( ! preg_match( '#^[A-Za-z0-9_\-\s\.\#\[\]\=\"\'\>\,\:\(\)\*\^\$\|\\\\]+$#', $selector ) ) {
			return new \WP_Error( 'invalid_selector_chars', __( 'Selector contains invalid characters.', 'text-to-audio' ), array( 'status' => 400 ) );
		}

		// Same validation for old_selector when provided — we never store
		// arbitrary attacker-controlled text in the heal log.
		if ( $old_selector !== '' ) {
			if ( strlen( $old_selector ) > 512 ||
				 ! preg_match( '#^[A-Za-z0-9_\-\s\.\#\[\]\=\"\'\>\,\:\(\)\*\^\$\|\\\\]+$#', $old_selector ) ) {
				$old_selector = '';
			}
		}

		$store = get_option( 'tta_atlasvoice_selectors', array(
			'global'        => '',
			'per_post_type' => array(),
		) );
		if ( ! is_array( $store ) ) {
			$store = array( 'global' => '', 'per_post_type' => array() );
		}
		if ( ! isset( $store['per_post_type'] ) || ! is_array( $store['per_post_type'] ) ) {
			$store['per_post_type'] = array();
		}

		$is_pro = function_exists( 'is_pro_active' ) && is_pro_active();
		if ( $is_pro && $post_type !== '' ) {
			$store['per_post_type'][ $post_type ] = $selector;
		} else {
			$store['global'] = $selector;
		}

		update_option( 'tta_atlasvoice_selectors', $store, false );
		\TTA\TTA_Cache::delete( 'all_settings' );

		// PR-C (C1c + C2a): record heal / revert events so the admin dashboard
		// can show an audit trail. Ring buffer capped at 50 entries so the
		// option never grows unbounded. Only records when reason explicitly
		// says 'heal' or 'revert' — plain user-initiated saves don't pollute
		// the log.
		//   heal   — picker silently rewrote a broken saved selector.
		//   revert — admin clicked "Revert" in the dashboard log. We record
		//            this too so the log reads forward-only and the user can
		//            see exactly what happened in order.
		if ( ( $reason === 'heal' || $reason === 'revert' )
			 && $old_selector !== '' && $old_selector !== $selector ) {
			$scope = ( $is_pro && $post_type !== '' ) ? ( 'post_type:' . $post_type ) : 'global';
			$log = get_option( 'tta_atlasvoice_heal_log', array() );
			if ( ! is_array( $log ) ) { $log = array(); }
			$log[] = array(
				'ts'           => time(),
				'scope'        => $scope,
				'reason'       => $reason,
				'old_selector' => $old_selector,
				'new_selector' => $selector,
				'user_id'      => get_current_user_id(),
			);
			if ( count( $log ) > 50 ) {
				$log = array_slice( $log, -50 );
			}
			update_option( 'tta_atlasvoice_heal_log', $log, false );
		}

		// PR-C (C4a): attach cache purge hints to every successful save. The
		// detector returns `needs_purge=false` quietly when no known cache is
		// active, so users without a page cache never see the toast. Kept
		// as a small structured payload instead of a pre-rendered string so
		// the client can decide whether to show a link or a plain toast.
		$cache_hint = array(
			'needs_purge' => false,
			'detected'    => array(),
			'host_hints'  => array(),
			'message'     => '',
		);
		if ( class_exists( '\\TTA\\TTA_CachePurgeHints' ) ) {
			$cache_hint = \TTA\TTA_CachePurgeHints::get_hint();
		}

		return rest_ensure_response( array(
			'status'     => true,
			'data'       => $store,
			'reason'     => $reason ?: null,
			'cache_hint' => $cache_hint,
		) );
	}

	/**
	 * PR-C (C2a): Read the heal log for the dashboard audit UI.
	 *
	 * Returns the most-recent events first (reverse chrono) so the dashboard
	 * can render them without sorting client-side. Also normalises older
	 * entries written before C2a — they lack the `reason` field, so fill it
	 * in as 'heal' for display purposes.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_heal_log( $request ) {
		$log = get_option( 'tta_atlasvoice_heal_log', array() );
		if ( ! is_array( $log ) ) { $log = array(); }
		$out = array();
		for ( $i = count( $log ) - 1; $i >= 0; $i-- ) {
			$row = $log[ $i ];
			if ( ! is_array( $row ) ) { continue; }
			$out[] = array(
				'index'        => $i,
				'ts'           => isset( $row['ts'] ) ? (int) $row['ts'] : 0,
				'scope'        => isset( $row['scope'] ) ? (string) $row['scope'] : 'global',
				'reason'       => isset( $row['reason'] ) ? (string) $row['reason'] : 'heal',
				'old_selector' => isset( $row['old_selector'] ) ? (string) $row['old_selector'] : '',
				'new_selector' => isset( $row['new_selector'] ) ? (string) $row['new_selector'] : '',
				'user_id'      => isset( $row['user_id'] ) ? (int) $row['user_id'] : 0,
			);
		}
		return rest_ensure_response( array(
			'status' => true,
			'log'    => $out,
		) );
	}

	/**
	 * TTS-238 PR-C (C3b): Expose the cached boilerplate suggestions to the
	 * dashboard. The list is populated by the nightly cron. Returns the
	 * generated_at timestamp so the UI can show freshness ("Last scanned:
	 * 2 hours ago").
	 *
	 * @return \WP_REST_Response
	 */
	public function get_boilerplate_suggestions( $request ) {
		$data = array(
			'generated_at' => 0,
			'sample_size'  => 0,
			'suggestions'  => array(),
		);
		if ( class_exists( '\\TTA\\TTA_BoilerplateDetector' ) ) {
			$data = \TTA\TTA_BoilerplateDetector::get_cached();
		}
		$excluded = get_option( 'tta_atlasvoice_boilerplate_excluded', array() );
		if ( ! is_array( $excluded ) ) { $excluded = array(); }
		return rest_ensure_response( array(
			'status'       => true,
			'generated_at' => isset( $data['generated_at'] ) ? (int) $data['generated_at'] : 0,
			'sample_size'  => isset( $data['sample_size'] ) ? (int) $data['sample_size'] : 0,
			'post_types'   => isset( $data['post_types'] ) ? (array) $data['post_types'] : array(),
			'suggestions'  => isset( $data['suggestions'] ) ? array_values( (array) $data['suggestions'] ) : array(),
			'excluded'     => array_values( $excluded ),
		) );
	}

	/**
	 * TTS-238 PR-C (C3b): Re-run the detector on demand. Intended for the
	 * dashboard "Re-scan now" button. Runs inline (not queued) since the
	 * detector is capped by SAMPLE_SIZE * num_post_types and completes in
	 * a few seconds on normal sites. Returns the fresh suggestions.
	 *
	 * @return \WP_REST_Response
	 */
	public function refresh_boilerplate_suggestions( $request ) {
		if ( ! class_exists( '\\TTA\\TTA_BoilerplateDetector' ) ) {
			return rest_ensure_response( array(
				'status'      => false,
				'message'     => 'BoilerplateDetector class not loaded.',
				'suggestions' => array(),
			) );
		}
		\TTA\TTA_BoilerplateDetector::run();
		$data = \TTA\TTA_BoilerplateDetector::get_cached();
		$excluded = get_option( 'tta_atlasvoice_boilerplate_excluded', array() );
		if ( ! is_array( $excluded ) ) { $excluded = array(); }
		return rest_ensure_response( array(
			'status'       => true,
			'generated_at' => isset( $data['generated_at'] ) ? (int) $data['generated_at'] : 0,
			'sample_size'  => isset( $data['sample_size'] ) ? (int) $data['sample_size'] : 0,
			'post_types'   => isset( $data['post_types'] ) ? (array) $data['post_types'] : array(),
			'suggestions'  => isset( $data['suggestions'] ) ? array_values( (array) $data['suggestions'] ) : array(),
			'excluded'     => array_values( $excluded ),
		) );
	}

	/**
	 * TTS-238 PR-C (C3c): Add/remove a fragment from the player's boilerplate
	 * exclusion list. The list is stored in tta_atlasvoice_boilerplate_excluded
	 * (autoload=false) and is consumed by the content cleaner in a follow-up
	 * change — this route just owns the add/remove plumbing.
	 *
	 * Dedupes on the raw text (already lower-cased + trimmed by the detector
	 * tokeniser). Caps at 200 entries to keep option size bounded.
	 *
	 * @return \WP_REST_Response
	 */
	public function toggle_boilerplate_exclusion( $request ) {
		$text   = trim( (string) $request->get_param( 'text' ) );
		$action = (string) $request->get_param( 'action' );
		if ( $text === '' ) {
			return rest_ensure_response( array( 'status' => false, 'message' => 'Empty text.' ) );
		}
		$list = get_option( 'tta_atlasvoice_boilerplate_excluded', array() );
		if ( ! is_array( $list ) ) { $list = array(); }

		if ( $action === 'remove' ) {
			$list = array_values( array_filter( $list, function ( $item ) use ( $text ) {
				return (string) $item !== $text;
			} ) );
		} else {
			if ( ! in_array( $text, $list, true ) ) {
				$list[] = $text;
			}
			if ( count( $list ) > 200 ) {
				$list = array_slice( $list, -200 );
			}
		}
		update_option( 'tta_atlasvoice_boilerplate_excluded', $list, false );
		return rest_ensure_response( array(
			'status'   => true,
			'excluded' => array_values( $list ),
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
            '/tta/v1/save-selector',
            '/tta/v1/heal-log',
            '/tta/v1/boilerplate-suggestions',
            '/tta/v1/boilerplate-exclude',
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
