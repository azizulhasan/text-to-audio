<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice REST routes (TTS-238 v5 §14.1 / D0b).
 *
 * All AtlasVoice-specific REST endpoints live here instead of bloating
 * `api/TTA_Api_Routes.php`. The legacy file reverts to a byte-identical
 * pre-§0.7 state after this class ships, in line with P1's "zero
 * existing-file edits except opt-in gates" commitment.
 *
 * Routes owned by this class (namespace `tts/v1`):
 *
 *   POST /atlasvoice/save-rule              (scope-aware rule save)
 *   GET  /step-rail/active-rule
 *   GET  /step-rail/scope-rule
 *   GET  /step-rail/sample-url
 *   POST /step-rail/verify-sample
 *   GET  /step-rail/verify-sample
 *   GET  /auth-variant
 *   POST /auth-variant                      (pin OR record-sample)
 *   GET  /language-context
 *   GET|POST /mode                          (Pro: staging / Go Live)
 *   GET|POST /snapshots                     (Pro: ring buffer + revert)
 *
 * Retired in D27.28: /save-selector, /post-rules, /heal-log,
 * /boilerplate-suggestions, /boilerplate-exclude, /step-rail/scopes.
 *
 * All handlers live on this class too — they own the option keys the
 * AtlasVoice subsystem touches (post meta via AuthVariants::*). Keeping
 * route registration and handler code together makes the module
 * delete-safe: removing `includes/atlasvoice/` wipes every AtlasVoice
 * REST surface with no dangling callbacks left in the legacy routes.
 *
 * Permission model mirrors the legacy file:
 *   - Admin routes use a closure that checks manage_options + nonce.
 *   - `/auth-variant` POST is public because logged-out sample reports
 *     are the whole point; the callback splits action handling so
 *     pinning still requires `edit_post` capability.
 */
class RestRoutes {

	/**
	 * Shared REST namespace. Mirrors the legacy TTA_Api_Routes namespace
	 * so dashboard clients keep calling `/wp-json/tts/v1/...`.
	 *
	 * @var string
	 */
	const NAMESPACE_PREFIX = 'tta/v1';

	/**
	 * Wire into `rest_api_init`. Called from Bootstrap::register().
	 * Idempotent — register_rest_route will silently overwrite duplicates.
	 */
	public static function register() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Route definitions. Mirrors the shape used by TTA_Api_Routes so
	 * the REST API surface is byte-identical pre- and post-refactor.
	 */
	public static function register_routes() {
		$ns = self::NAMESPACE_PREFIX;




		// PR-C (C5a) — language context read-out.
		register_rest_route(
			$ns,
			'/language-context',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_language_context' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(),
				),
			)
		);

		// TTS-238 v5 (D5) — mode status read + Go Live / revert mutation.
		// GET  returns the current status (state / colour / label) so the
		//      React dashboard can render its own banner / pill without
		//      re-deriving settings logic.
		// POST mutates the mode under a typed-confirmation gate:
		//        action=go-live  + confirm="GO LIVE"  → production
		//        action=revert                         → staging
		register_rest_route(
			$ns,
			'/mode',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_mode' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'post_mode' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'action'  => array(
							'type'        => 'string',
							'required'    => true,
							'description' => 'One of: go-live | revert.',
						),
						'confirm' => array(
							'type'        => 'string',
							'required'    => false,
							'description' => 'Typed confirmation phrase. Required for action=go-live and must equal "GO LIVE" exactly.',
						),
					),
				),
			)
		);

		// TTS-238 v5 (D6) — snapshot ring buffer reads + revert.
		// GET returns rev-chrono snapshots for a scope. POST either
		// takes a new snapshot (action=take) or reverts to an index
		// (action=revert). The actual rule-apply step is the caller's
		// job; revert returns the payload so the caller's scope-specific
		// writer (selectors option, per-post meta, etc.) can apply it
		// without this class hard-coding each storage location.
		register_rest_route(
			$ns,
			'/snapshots',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_snapshots' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'scope_type' => array( 'type' => 'string', 'default' => 'global' ),
						'post_type'  => array( 'type' => 'string', 'required' => false ),
						'language'   => array( 'type' => 'string', 'required' => false ),
						'post_id'    => array( 'type' => 'integer', 'required' => false ),
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'post_snapshots' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'action'     => array( 'type' => 'string', 'required' => true ),
						'scope_type' => array( 'type' => 'string', 'default' => 'global' ),
						'post_type'  => array( 'type' => 'string', 'required' => false ),
						'language'   => array( 'type' => 'string', 'required' => false ),
						'post_id'    => array( 'type' => 'integer', 'required' => false ),
						'index'      => array( 'type' => 'integer', 'required' => false ),
						'rules'      => array( 'type' => 'object',  'required' => false ),
						'reason'     => array( 'type' => 'string',  'required' => false ),
					),
				),
			)
		);

		// TTS-238 D27.28 — `/post-rules` and `/save-selector` REST routes
		// retired. Per-post saves now go through `/atlasvoice/save-rule`
		// (scope=post) and the picker's auto-save / heal-record paths
		// were removed with their JS callers. Handlers + nested
		// helpers below were also deleted.

		// D26.2 — scope-aware rule save. Replaces /save-selector +
		// /post-rules, writes directly into the legacy keys
		// (tta_settings_data + tts_pro_custom_css_selectors).
		register_rest_route(
			$ns,
			'/atlasvoice/save-rule',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'save_rule_by_scope' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'scope_kind' => array(
							'type'        => 'string',
							'required'    => true,
							'enum'        => array( 'global', 'post_type', 'post' ),
							'description' => 'Which legacy slot to write to.',
						),
						'post_type' => array( 'type' => 'string',  'required' => false ),
						'post_id'   => array( 'type' => 'integer', 'required' => false ),
						// TTS-238 D27.17 — wire format uses canonical storage keys.
						'tta__settings_css_selectors'                    => array( 'type' => 'string', 'required' => true  ),
						'tta__settings_exclude_content_by_css_selectors' => array( 'type' => 'string', 'required' => false ),
						'tta__settings_exclude_texts'                    => array( 'type' => array( 'array', 'string' ), 'required' => false ),
						'tta__settings_exclude_tags'                     => array( 'type' => array( 'array', 'string' ), 'required' => false ),
					),
				),
			)
		);

		// D9 — step-rail active-rule resolver. Returns the winning rule for a
		// given post across all scopes (per-post → post_type_language →
		// language → post_type → global) including the scope label, so the
		// picker shell can pre-fill scope radio, selector field, and chips
		// without duplicating RuleResolver precedence logic on the client.
		register_rest_route(
			$ns,
			'/step-rail/active-rule',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_step_rail_active_rule' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'post_id' => array( 'type' => 'integer', 'required' => true ),
					),
				),
			)
		);

		// D13 — scope-rule reader: returns the saved rule at exactly the
		// requested scope (no precedence walk) so the picker can repopulate
		// the UI when the admin changes the scope radio.
		register_rest_route(
			$ns,
			'/step-rail/scope-rule',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_step_rail_scope_rule' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'post_id'   => array( 'type' => 'integer', 'required' => true ),
						'scope'     => array( 'type' => 'string',  'required' => true ),
						'post_type' => array( 'type' => 'string',  'required' => false ),
						'language'  => array( 'type' => 'string',  'required' => false ),
					),
				),
			)
		);

		// D14 — step-rail /verify-sample. Returns N random published posts
		// matching the given scope so the picker can load each in a hidden
		// iframe and measure whether the saved rule still matches. Used by
		// the "Test rule across N posts" button and as a Go Live prereq.
		register_rest_route(
			$ns,
			'/step-rail/verify-sample',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_step_rail_verify_sample' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'post_type'       => array( 'type' => 'string',  'required' => false ),
						'language'        => array( 'type' => 'string',  'required' => false ),
						'sample_size'     => array( 'type' => 'integer', 'required' => false ),
						'exclude_post_id' => array( 'type' => 'integer', 'required' => false ),
						'orderby'         => array(
							'type'        => 'string',
							'required'    => false,
							'enum'        => array( 'rand', 'date_desc', 'date_asc' ),
							'default'     => 'rand',
							'description' => 'Sort order for the sample. rand = random, date_desc = newest first, date_asc = oldest first.',
						),
					),
				),
			)
		);

		register_rest_route(
			$ns,
			'/step-rail/sample-url',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_step_rail_sample_url' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'scope'     => array( 'type' => 'string',  'required' => false ),
						'post_type' => array( 'type' => 'string',  'required' => false ),
						'language'  => array( 'type' => 'string',  'required' => false ),
						'post_id'   => array( 'type' => 'integer', 'required' => false ),
					),
				),
			)
		);
	}

	/**
	 * D9 — Return the winning AtlasVoice rule for a given post across all
	 * scopes. Delegates to RuleResolver::resolve() and maps selector_source
	 * to the scope key the picker shell uses for its scope radio group.
	 *
	 * Response shape:
	 *   scope      string  'post'|'post_type_language'|'language'|'post_type'|'global'|''
	 *   selector   string  CSS selector of the winning rule, '' when none
	 *   post_type  string  post type of the queried post
	 *   language   string  resolved language code ('' on non-multilingual sites)
	 *   excl_css   array   CSS exclusion selectors (only populated for scope=post)
	 *   excl_texts array   phrase exclusions      (only populated for scope=post)
	 *   excl_tags  array   tag exclusions          (only populated for scope=post)
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function get_step_rail_active_rule( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		// TTS-238 D27.17 — response uses canonical storage keys.
		$empty = array(
			'scope'                                          => '',
			'tta__settings_css_selectors'                    => '',
			'post_type'                                      => '',
			'language'                                       => '',
			'excl_set'                                       => false,
			'tta__settings_exclude_content_by_css_selectors' => '',
			'tta__settings_exclude_texts'                    => '',
			'tta__settings_exclude_tags'                     => '',
		);

		if ( $post_id <= 0 || ! class_exists( '\\TTA\\AtlasVoice\\RuleResolver' ) ) {
			return new \WP_REST_Response( $empty, 200 );
		}

		$resolved = RuleResolver::resolve( $post_id );
		$source   = isset( $resolved['selector_source'] ) ? (string) $resolved['selector_source'] : 'none';
		$selector = isset( $resolved['selector'] )        ? (string) $resolved['selector']         : '';

		$scope_map = array(
			'post'               => 'post',
			'post_type_language' => 'post_type_language',
			'language'           => 'language',
			'post_type'          => 'post_type',
			'global'             => 'global',
		);
		$scope = isset( $scope_map[ $source ] ) ? $scope_map[ $source ] : '';

		// Helper: array-or-string → pipe-joined string for tags/texts.
		$to_str = function ( $val ) {
			if ( is_array( $val ) ) { return implode( '|', array_map( 'strval', $val ) ); }
			return (string) $val;
		};
		$excl_set        = ! empty( $resolved['excl_set'] );
		$excl_css_str    = isset( $resolved['excl_css'] )   ? $to_str( $resolved['excl_css'] )   : '';
		$excl_texts_str  = isset( $resolved['excl_texts'] ) ? $to_str( $resolved['excl_texts'] ) : '';
		$excl_tags_str   = isset( $resolved['excl_tags'] )  ? $to_str( $resolved['excl_tags'] )  : '';

		if ( $source === 'post' && isset( $resolved['post_override'] ) && is_array( $resolved['post_override'] ) ) {
			$po             = $resolved['post_override'];
			$excl_set       = true;
			$excl_css_str   = isset( $po['excl_css'] )   ? $to_str( $po['excl_css'] )   : '';
			$excl_texts_str = isset( $po['excl_texts'] ) ? $to_str( $po['excl_texts'] ) : '';
			$excl_tags_str  = isset( $po['excl_tags'] )  ? $to_str( $po['excl_tags'] )  : '';
		}

		return new \WP_REST_Response( array(
			'scope'                                          => $scope,
			'tta__settings_css_selectors'                    => $selector,
			'post_type'                                      => isset( $resolved['post_type'] ) ? (string) $resolved['post_type'] : '',
			'language'                                       => isset( $resolved['language'] )  ? (string) $resolved['language']  : '',
			'excl_set'                                       => $excl_set,
			'tta__settings_exclude_content_by_css_selectors' => $excl_css_str,
			'tta__settings_exclude_texts'                    => $excl_texts_str,
			'tta__settings_exclude_tags'                     => $excl_tags_str,
		), 200 );
	}

	/**
	 * D9 — Resolve a sample-post URL for the iframe sandbox. The
	 * returned URL carries `?atlasvoice_iframe=1&_wpnonce=<rest>` so
	 * StepRail::maybe_activate_iframe can activate pick mode on the
	 * front-end template_redirect hook.
	 *
	 * Picks a representative post by walking:
	 *   - scope=post → the exact post_id the caller passed (or 400)
	 *   - scope=post_type / post_type_language → most recent published
	 *     post of that type (+ language filter when present)
	 *   - scope=language → most recent published post of any type in
	 *     that language
	 *   - scope=global → most recent published post of any supported type
	 *
	 * The endpoint is read-only and returns a structured reason when
	 * it can't find a suitable post so the rail can show a helpful
	 * message instead of a generic error.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function get_step_rail_sample_url( $request ) {
		$scope = (string) $request->get_param( 'scope' );
		$pt    = (string) $request->get_param( 'post_type' );
		$lang  = (string) $request->get_param( 'language' );
		$pid   = (int) $request->get_param( 'post_id' );

		$post_id = 0;

		switch ( $scope ) {
			case 'post':
				if ( $pid > 0 && get_post( $pid ) instanceof \WP_Post ) { $post_id = $pid; }
				break;
			case 'post_type':
			case 'post_type_language':
				if ( $pt !== '' ) { $post_id = self::find_sample_post( $pt, $lang ); }
				break;
			case 'language':
				$post_id = self::find_sample_post( '', $lang );
				break;
			case 'global':
			default:
				$post_id = self::find_sample_post( '', '' );
				break;
		}

		if ( $post_id <= 0 ) {
			return new \WP_REST_Response( array(
				'url'    => '',
				'reason' => __( 'No matching published post found for this scope.', 'text-to-audio' ),
			), 200 );
		}

		$url = get_permalink( $post_id );
		if ( ! $url ) {
			return new \WP_REST_Response( array(
				'url'    => '',
				'reason' => __( 'Sample post has no permalink (maybe unpublished?).', 'text-to-audio' ),
			), 200 );
		}

		// v5 front-end picker uses AUTO_PARAM (?atlasvoice_picker=1).
		$flag = class_exists( '\\TTA\\AtlasVoice\\StepRail' )
			? \TTA\AtlasVoice\StepRail::AUTO_PARAM
			: 'atlasvoice_picker';
		$url  = add_query_arg( array(
			$flag      => 1,
			'_wpnonce' => wp_create_nonce( 'wp_rest' ),
		), $url );

		return new \WP_REST_Response( array(
			'url'        => esc_url_raw( $url ),
			'post_id'    => $post_id,
			'post_title' => html_entity_decode( (string) get_the_title( $post_id ), ENT_QUOTES ),
			'post_type'  => (string) get_post_type( $post_id ),
		), 200 );
	}

	/**
	 * D14 — Return N random published posts matching the given filters so
	 * the step-rail "Verify across posts" button can load each in a hidden
	 * iframe, run the saved selector, and report match-rate.
	 *
	 * Response shape:
	 *   posts  array  list of { id, url, title, post_type, language }
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	/**
	 * D26.2 — Write a picker rule into the legacy storage slots based on
	 * scope_kind. Replaces save_selector (selector store) and the per-post
	 * route. Three branches:
	 *
	 *   global    → tta_settings_data['settings'][<four legacy keys>]
	 *   post_type → tta_settings_data['settings']['tta__settings_atlasvoice_per_type_overrides'][<slug>]
	 *   post      → post meta tts_pro_custom_css_selectors (Pro only)
	 *
	 * Read-modify-write under no explicit lock (settings option already
	 * follows WP's option-cache discipline). Returns the merged rule the
	 * picker can echo back to the user as a "Saved" confirmation.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save_rule_by_scope( $request ) {
		$scope     = (string) $request->get_param( 'scope_kind' );
		// TTS-238 D27.17 — request body uses canonical storage keys.
		$selector  = trim( (string) $request->get_param( 'tta__settings_css_selectors' ) );
		$post_type = sanitize_key( (string) $request->get_param( 'post_type' ) );
		$post_id   = (int) $request->get_param( 'post_id' );

		if ( $selector === '' || strlen( $selector ) > 2048 ) {
			return new \WP_Error( 'invalid_selector', __( 'Selector is empty or too long.', 'text-to-audio' ), array( 'status' => 400 ) );
		}

		$excl_css_raw   = (string) $request->get_param( 'tta__settings_exclude_content_by_css_selectors' );
		$excl_texts_raw = $request->get_param( 'tta__settings_exclude_texts' );
		$excl_tags_raw  = $request->get_param( 'tta__settings_exclude_tags' );

		// Accept either array (from chip lists) or string (already pipe-joined).
		if ( is_string( $excl_texts_raw ) ) {
			// Phrases preserve internal commas/semicolons.
			$excl_texts_raw = preg_split( '/[|\r\n]+/', $excl_texts_raw );
		}
		if ( is_string( $excl_tags_raw ) ) {
			$excl_tags_raw = preg_split( '/[\s,;|]+/', $excl_tags_raw );
		}
		$excl_texts = is_array( $excl_texts_raw ) ? array_values( array_filter( array_map( 'sanitize_text_field', $excl_texts_raw ) ) ) : array();
		$excl_tags  = is_array( $excl_tags_raw )
			? array_values( array_filter(
				array_map( 'sanitize_key', $excl_tags_raw ),
				function ( $t ) { return $t !== '' && strlen( $t ) <= 32 && preg_match( '/^[a-z][a-z0-9]*$/', $t ); }
			) )
			: array();

		// Always store pipe-joined strings to match dashboard read shape.
		$rule = array(
			'tta__settings_css_selectors'                    => $selector,
			'tta__settings_exclude_content_by_css_selectors' => $excl_css_raw,
			'tta__settings_exclude_texts'                    => implode( '|', $excl_texts ),
			'tta__settings_exclude_tags'                     => implode( '|', $excl_tags ),
		);

		if ( $scope === 'post' ) {
			if ( $post_id <= 0 ) { return new \WP_Error( 'missing_post_id', 'post_id required for scope=post.', array( 'status' => 400 ) ); }
			$is_pro = class_exists( '\\TTA\\TTA_Helper' ) && \TTA\TTA_Helper::is_pro_active();
			if ( ! $is_pro ) { return new \WP_Error( 'pro_only', 'Per-post override is a Pro feature.', array( 'status' => 403 ) ); }

			$existing = get_post_meta( $post_id, 'tts_pro_custom_css_selectors', true );
			if ( ! is_array( $existing ) ) { $existing = array(); }
			$rule['tta__settings_use_own_css_selectors'] = true;
			$merged = array_merge( $existing, $rule );
			update_post_meta( $post_id, 'tts_pro_custom_css_selectors', $merged );
			if ( class_exists( '\\TTA\\TTA_Cache' ) ) { \TTA\TTA_Cache::delete( 'all_settings' ); }

			return new \WP_REST_Response( array( 'status' => true, 'scope' => 'post', 'post_id' => $post_id, 'rule' => $merged ), 200 );
		}

		if ( $scope === 'post_type' ) {
			if ( $post_type === '' ) { return new \WP_Error( 'missing_post_type', 'post_type required for scope=post_type.', array( 'status' => 400 ) ); }
			$is_pro = class_exists( '\\TTA\\TTA_Helper' ) && \TTA\TTA_Helper::is_pro_active();
			if ( ! $is_pro ) { return new \WP_Error( 'pro_only', 'Per-post-type override is a Pro feature.', array( 'status' => 403 ) ); }

			// TTS-238 D27.10 — write flat at the top level of `tta_settings_data`
			// to match the dashboard's read/write shape (Settings.js + the
			// /tta/v1/settings POST handler both treat this option as flat).
			// Wrapping under a `settings` sub-key here would be invisible
			// to the dashboard. Cast through JSON to an array because the
			// dashboard's POST handler saves the option as a json_decode'd
			// stdClass.
			$opt_raw = get_option( 'tta_settings_data', array() );
			$opt     = json_decode( wp_json_encode( $opt_raw ), true );
			if ( ! is_array( $opt ) ) { $opt = array(); }
			// Recover from stale nested writes (`tta_settings_data['settings'][...]`).
			if ( isset( $opt['settings'] ) && is_array( $opt['settings'] ) ) {
				foreach ( $opt['settings'] as $k => $v ) {
					if ( ! array_key_exists( $k, $opt ) ) { $opt[ $k ] = $v; }
				}
				unset( $opt['settings'] );
			}
			$bag = isset( $opt['tta__settings_atlasvoice_per_type_overrides'] ) && is_array( $opt['tta__settings_atlasvoice_per_type_overrides'] )
				? $opt['tta__settings_atlasvoice_per_type_overrides']
				: array();
			$bag[ $post_type ] = $rule;
			$opt['tta__settings_atlasvoice_per_type_overrides'] = $bag;
			update_option( 'tta_settings_data', $opt );
			if ( class_exists( '\\TTA\\TTA_Cache' ) ) { \TTA\TTA_Cache::delete( 'all_settings' ); }

			return new \WP_REST_Response( array( 'status' => true, 'scope' => 'post_type', 'post_type' => $post_type, 'rule' => $rule ), 200 );
		}

		// scope=global — write the four legacy keys flat at the top level
		// of `tta_settings_data` so the dashboard picks them up. Excl_texts /
		// excl_tags become pipe-joined strings (legacy shape) for backward
		// compatibility with the existing extractor. Cast through JSON to
		// an array because the dashboard's POST handler saves the option
		// as a json_decode'd stdClass.
		$opt_raw = get_option( 'tta_settings_data', array() );
		$opt     = json_decode( wp_json_encode( $opt_raw ), true );
		if ( ! is_array( $opt ) ) { $opt = array(); }
		// Recover from stale nested writes (`tta_settings_data['settings'][...]`).
		if ( isset( $opt['settings'] ) && is_array( $opt['settings'] ) ) {
			foreach ( $opt['settings'] as $k => $v ) {
				if ( ! array_key_exists( $k, $opt ) ) { $opt[ $k ] = $v; }
			}
			unset( $opt['settings'] );
		}
		$opt['tta__settings_css_selectors']                    = $selector;
		$opt['tta__settings_exclude_content_by_css_selectors'] = $excl_css_raw;
		$opt['tta__settings_exclude_texts'] = implode( '|', $excl_texts );
		$opt['tta__settings_exclude_tags']  = implode( '|', $excl_tags );
		update_option( 'tta_settings_data', $opt );
		if ( class_exists( '\\TTA\\TTA_Cache' ) ) { \TTA\TTA_Cache::delete( 'all_settings' ); }

		return new \WP_REST_Response( array(
			'status' => true,
			'scope'  => 'global',
			'rule'   => array(
				'tta__settings_css_selectors'                    => $selector,
				'tta__settings_exclude_content_by_css_selectors' => $excl_css_raw,
				'tta__settings_exclude_texts'                    => implode( '|', $excl_texts ),
				'tta__settings_exclude_tags'                     => implode( '|', $excl_tags ),
			),
		), 200 );
	}

	public static function get_step_rail_verify_sample( $request ) {
		$pt      = (string) $request->get_param( 'post_type' );
		$lang    = (string) $request->get_param( 'language' );
		$size    = (int) $request->get_param( 'sample_size' );
		$exid    = (int) $request->get_param( 'exclude_post_id' );
		$orderby = (string) $request->get_param( 'orderby' );
		if ( $size <= 0 )    { $size = 3; }
		if ( $orderby === '' ) { $orderby = 'rand'; }

		$posts = class_exists( '\\TTA\\AtlasVoice\\VerifyAcrossPosts' )
			? \TTA\AtlasVoice\VerifyAcrossPosts::pick_sample_posts( $pt, $lang, $size, $exid, $orderby )
			: array();

		return new \WP_REST_Response( array( 'posts' => $posts ), 200 );
	}

	/**
	 * Helper for get_step_rail_sample_url: find the most-recent
	 * published post matching the given (possibly empty) filters.
	 *
	 * Language filtering delegates to multilingual plugin APIs when
	 * available; on non-multilingual sites the `$lang` param is a
	 * no-op. All filters honour the user's settings-tracked post
	 * types unless `$pt` is explicit.
	 *
	 * @param string $pt   Post type slug, or '' for any tracked type.
	 * @param string $lang Language code, or '' for any.
	 * @return int
	 */
	protected static function find_sample_post( $pt, $lang ) {
		$args = array(
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'orderby'        => 'date',
			'order'          => 'DESC',
			'fields'         => 'ids',
			'no_found_rows'  => true,
			'suppress_filters' => false,
		);
		if ( $pt !== '' ) {
			$args['post_type'] = $pt;
		} else {
			$tracked = get_post_types( array( 'public' => true ) );
			if ( is_array( $tracked ) && ! empty( $tracked ) ) {
				$args['post_type'] = array_values( array_filter( $tracked, function ( $slug ) {
					return $slug !== 'attachment';
				} ) );
			}
		}

		// WPML / Polylang language filter. The plugins both read
		// `lang` from the main query via their own filters — setting
		// `lang` as a query-arg activates that hook on their side.
		if ( $lang !== '' ) {
			$args['lang'] = $lang;
		}

		$ids = get_posts( $args );
		return ( is_array( $ids ) && isset( $ids[0] ) ) ? (int) $ids[0] : 0;
	}

	/**
	 * Admin permission check — mirrors the legacy
	 * TTA_Api_Routes::get_route_access capability + nonce gate.
	 *
	 * @param \WP_REST_Request $request
	 * @return bool|\WP_Error
	 */
	public static function admin_guard( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to access this resource.', 'text-to-audio' ),
				array( 'status' => 401 )
			);
		}
		// Nonce check: the legacy gate accepts either a `_wpnonce` or the
		// `X-WP-Nonce` header — leave both paths in place so dashboard
		// clients keep working unchanged.
		$nonce = $request->get_header( 'x_wp_nonce' );
		if ( ! $nonce ) { $nonce = $request->get_param( '_wpnonce' ); }
		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new \WP_Error(
				'rest_invalid_nonce',
				__( 'Invalid or missing REST nonce.', 'text-to-audio' ),
				array( 'status' => 403 )
			);
		}
		return true;
	}

	// -----------------------------------------------------------------
	// Handlers
	// -----------------------------------------------------------------






	/**
	 * GET /mode — current AtlasVoice pipeline status.
	 *
	 * Returns the three-state banner info the dashboard needs to render
	 * its mode pill / toolbar dot mirror. Cheap — no option write, just
	 * delegates to `Mode::status()` which reads the cached settings row.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function get_mode( $request ) {
		if ( ! class_exists( '\\TTA\\AtlasVoice\\Mode' ) ) {
			return rest_ensure_response( array(
				'status' => false,
				'error'  => 'Mode class not loaded.',
			) );
		}
		return rest_ensure_response( array(
			'status'        => true,
			'opted_in'      => Mode::is_opted_in(),
			'mode'          => Mode::get(),
			'is_production' => Mode::is_production(),
			'display'       => Mode::status(),
		) );
	}

	/**
	 * POST /mode — Go Live / revert-to-staging mutator.
	 *
	 * Two actions are supported:
	 *
	 *   action=go-live  confirm="GO LIVE"  →  switch to production.
	 *                   The confirm string is compared byte-exactly
	 *                   against the literal "GO LIVE". Case matters.
	 *                   The reason this lives server-side (not just in
	 *                   the React dialog) is that a CSRF-armed client
	 *                   with a valid nonce must still type the phrase
	 *                   to flip the production bit. It's the same
	 *                   belt-and-braces style GitHub uses for
	 *                   irreversible org-level actions.
	 *
	 *   action=revert   →  switch to staging (no confirmation needed —
	 *                   reverting is always safe and we want it to be a
	 *                   one-click affordance when a live issue hits).
	 *
	 * On success emits `atlasvoice_mode_changed` (via Mode::set) and a
	 * dedicated `atlasvoice_go_live` / `atlasvoice_reverted_to_staging`
	 * event for consumers that only care about one direction (e.g. a
	 * CDN purge hook only wants to fire on Go Live).
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function post_mode( $request ) {
		if ( ! class_exists( '\\TTA\\AtlasVoice\\Mode' ) ) {
			return new \WP_Error( 'not_available', 'Mode class not loaded.', array( 'status' => 500 ) );
		}

		// Opt-in must be on before mode can be flipped at all. Flipping
		// to production while the whole subsystem is disabled would be
		// a no-op from the visitor's perspective and would confuse
		// later debugging — refuse early so the dashboard can show a
		// precise error instead.
		if ( ! Mode::is_opted_in() ) {
			return new \WP_Error(
				'not_opted_in',
				__( 'Enable the AtlasVoice extractor in the settings before changing mode.', 'text-to-audio' ),
				array( 'status' => 409 )
			);
		}

		$action = sanitize_key( (string) $request->get_param( 'action' ) );

		if ( $action === 'go-live' ) {
			$confirm = (string) $request->get_param( 'confirm' );
			// Intentionally byte-exact: not strcasecmp, not trim. The
			// dashboard dialog hint copy says «type GO LIVE to
			// confirm» so we hold the line on the literal.
			if ( $confirm !== 'GO LIVE' ) {
				return new \WP_Error(
					'confirmation_required',
					__( 'Type GO LIVE exactly to confirm production rollout.', 'text-to-audio' ),
					array( 'status' => 400 )
				);
			}
			Mode::set( Mode::MODE_PRODUCTION );
			/**
			 * Fires after a successful Go Live. Receivers can purge CDN
			 * caches, broadcast to multisite, or log the rollout to an
			 * external SIEM without monkey-patching Mode::set.
			 *
			 * @param int $user_id
			 */
			do_action( 'atlasvoice_go_live', get_current_user_id() );
			return rest_ensure_response( array(
				'status'  => true,
				'message' => __( 'AtlasVoice is now live in production.', 'text-to-audio' ),
				'mode'    => Mode::get(),
				'display' => Mode::status(),
			) );
		}

		if ( $action === 'revert' ) {
			Mode::set( Mode::MODE_STAGING );
			/**
			 * Fires after a revert-to-staging. Useful for alerting —
			 * monitors can page on-call when a live site drops back
			 * to staging unexpectedly.
			 *
			 * @param int $user_id
			 */
			do_action( 'atlasvoice_reverted_to_staging', get_current_user_id() );
			return rest_ensure_response( array(
				'status'  => true,
				'message' => __( 'Reverted to staging mode.', 'text-to-audio' ),
				'mode'    => Mode::get(),
				'display' => Mode::status(),
			) );
		}

		return new \WP_Error(
			'unknown_action',
			__( 'Unknown mode action. Expected go-live or revert.', 'text-to-audio' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Build a scope descriptor from REST request params. Encapsulated
	 * so get_snapshots / post_snapshots share identical scope logic.
	 *
	 * @param \WP_REST_Request $request
	 * @return array { type, post_type?, language?, post_id? }
	 */
	protected static function scope_from_request( $request ) {
		$type = sanitize_key( (string) $request->get_param( 'scope_type' ) );
		if ( $type === '' ) { $type = 'global'; }
		return array(
			'type'      => $type,
			'post_type' => (string) $request->get_param( 'post_type' ),
			'language'  => (string) $request->get_param( 'language' ),
			'post_id'   => (int) $request->get_param( 'post_id' ),
		);
	}

	/**
	 * GET /snapshots — list the ring buffer for a given scope.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function get_snapshots( $request ) {
		if ( ! class_exists( '\\TTA\\AtlasVoice\\Snapshots' ) ) {
			return rest_ensure_response( array( 'status' => false, 'error' => 'Snapshots class not loaded.' ) );
		}
		$scope = self::scope_from_request( $request );
		return rest_ensure_response( array(
			'status'    => true,
			'scope'     => $scope,
			'scope_key' => Snapshots::scope_key( $scope ),
			'snapshots' => Snapshots::listing( $scope ),
		) );
	}

	/**
	 * POST /snapshots — mutate the ring (take or revert).
	 *
	 *   action=take    rules={...}       → append rules to the ring.
	 *   action=revert  index=<N>         → restore snapshot N; returns
	 *                                      the rule payload so the
	 *                                      caller's scope-writer can
	 *                                      apply it.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function post_snapshots( $request ) {
		if ( ! class_exists( '\\TTA\\AtlasVoice\\Snapshots' ) ) {
			return new \WP_Error( 'not_available', 'Snapshots class not loaded.', array( 'status' => 500 ) );
		}
		$scope  = self::scope_from_request( $request );
		$action = sanitize_key( (string) $request->get_param( 'action' ) );

		if ( $action === 'take' ) {
			$rules = $request->get_param( 'rules' );
			if ( is_object( $rules ) ) { $rules = (array) $rules; }
			if ( ! is_array( $rules ) ) {
				return new \WP_Error( 'bad_rules', __( 'Rules payload must be an object.', 'text-to-audio' ), array( 'status' => 400 ) );
			}
			$reason = (string) $request->get_param( 'reason' );
			$ring = Snapshots::take( $scope, $rules, array( 'reason' => $reason ?: 'manual' ) );
			return rest_ensure_response( array(
				'status'    => true,
				'scope'     => $scope,
				'scope_key' => Snapshots::scope_key( $scope ),
				'ring_size' => count( $ring ),
				'snapshots' => Snapshots::listing( $scope ),
			) );
		}

		if ( $action === 'revert' ) {
			$index   = (int) $request->get_param( 'index' );
			$current = $request->get_param( 'rules' );
			if ( is_object( $current ) ) { $current = (array) $current; }
			if ( ! is_array( $current ) ) { $current = null; }

			$payload = Snapshots::revert( $scope, $index, $current );
			if ( is_wp_error( $payload ) ) {
				return $payload;
			}
			return rest_ensure_response( array(
				'status'    => true,
				'scope'     => $scope,
				'scope_key' => Snapshots::scope_key( $scope ),
				'rules'     => $payload,
				'snapshots' => Snapshots::listing( $scope ),
			) );
		}

		return new \WP_Error( 'unknown_action', __( 'Unknown snapshot action.', 'text-to-audio' ), array( 'status' => 400 ) );
	}


	/**
	 * GET /step-rail/scope-rule — return the rule saved at a specific scope
	 * without a precedence walk. Used by the picker shell when the admin
	 * changes the scope radio so the UI can show what is actually stored
	 * at that scope (not just the current winning rule).
	 *
	 * Response: { selector, excl_set, excl_css, excl_texts, excl_tags }
	 * excl_set=false → legacy string entry or no data saved at this scope.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function get_step_rail_scope_rule( $request ) {
		$post_id   = (int) $request->get_param( 'post_id' );
		$scope     = sanitize_key( (string) $request->get_param( 'scope' ) );
		$post_type = sanitize_key( (string) $request->get_param( 'post_type' ) );
		$language  = sanitize_key( (string) $request->get_param( 'language' ) );

		// TTS-238 D27.17 — response uses canonical storage keys.
		$empty = array(
			'tta__settings_css_selectors'                    => '',
			'excl_set'                                       => false,
			'tta__settings_exclude_content_by_css_selectors' => array(),
			'tta__settings_exclude_texts'                    => array(),
			'tta__settings_exclude_tags'                     => array(),
		);

		if ( $post_id <= 0 ) {
			return new \WP_REST_Response( $empty, 200 );
		}

		// Per-post scope — read post meta `tts_pro_custom_css_selectors`
		// (Pro). PerPostRules wraps that meta but exposes legacy short
		// names; we re-shape its output here. When the per-post master
		// toggle (`tta__settings_use_own_css_selectors`) is OFF we treat
		// the meta as logically unset — the scope is not active so the
		// picker should show an empty rule instead of letting admins
		// edit a draft that won't apply at runtime.
		if ( $scope === 'post' ) {
			$meta = get_post_meta( $post_id, 'tts_pro_custom_css_selectors', true );
			if ( ! is_array( $meta ) ) { $meta = array(); }
			$use_own = isset( $meta['tta__settings_use_own_css_selectors'] )
				? ! empty( $meta['tta__settings_use_own_css_selectors'] )
				: false;
			if ( ! $use_own ) {
				return new \WP_REST_Response( $empty, 200 );
			}
			$selector = isset( $meta['tta__settings_css_selectors'] ) ? (string) $meta['tta__settings_css_selectors'] : '';
			if ( $selector === '' ) {
				return new \WP_REST_Response( $empty, 200 );
			}
			$pick = function ( $key ) use ( $meta ) {
				return isset( $meta[ $key ] ) ? $meta[ $key ] : '';
			};
			return new \WP_REST_Response( array(
				'tta__settings_css_selectors'                    => $selector,
				'excl_set'                                       => true,
				'tta__settings_exclude_content_by_css_selectors' => (string) $pick( 'tta__settings_exclude_content_by_css_selectors' ),
				'tta__settings_exclude_texts'                    => (string) $pick( 'tta__settings_exclude_texts' ),
				'tta__settings_exclude_tags'                     => (string) $pick( 'tta__settings_exclude_tags' ),
			), 200 );
		}

		// Derive post_type from the post when the client omits it.
		if ( $post_type === '' && $scope === 'post_type' ) {
			$post_type = (string) get_post_type( $post_id );
		}

		// TTS-238 D27.12 — Read from the new collapsed storage in
		// `tta_settings_data` (flat) so the picker shows what the
		// dashboard / save endpoint actually have. Legacy
		// `tta_atlasvoice_selectors` and the per-language scopes have
		// been retired. Note: the dashboard saves $fields as a
		// json_decode()'d stdClass, so the option round-trips as an
		// object — cast through json to a fully-array shape (recursive)
		// so isset()/is_array() checks below work uniformly.
		$opt_raw = get_option( 'tta_settings_data', array() );
		$opt     = json_decode( wp_json_encode( $opt_raw ), true );
		if ( ! is_array( $opt ) ) { $opt = array(); }
		// Recover from any stale nested-settings data.
		if ( isset( $opt['settings'] ) && is_array( $opt['settings'] ) ) {
			foreach ( $opt['settings'] as $k => $v ) {
				if ( ! array_key_exists( $k, $opt ) ) { $opt[ $k ] = $v; }
			}
		}

		// Helpers. tags = single-word tokens, split aggressively. texts
		// = phrases (preserve internal whitespace), split only on
		// pipe / comma / semicolon / newline. CSS = newline-separated.
		$split_tags = function ( $val ) {
			if ( is_array( $val ) ) { $parts = $val; }
			else { $parts = preg_split( '/[\s,;|]+/', (string) $val ); }
			return array_values( array_filter( array_map( 'trim', (array) $parts ), function ( $p ) { return $p !== ''; } ) );
		};
		$split_texts = function ( $val ) {
			if ( is_array( $val ) ) { $parts = $val; }
			else { $parts = preg_split( '/[|,;\r\n]+/', (string) $val ); }
			return array_values( array_filter( array_map( 'trim', (array) $parts ), function ( $p ) { return $p !== ''; } ) );
		};
		$split_lines = function ( $val ) {
			if ( is_array( $val ) ) { $parts = $val; }
			else { $parts = preg_split( '/[\r\n]+/', (string) $val ); }
			return array_values( array_filter( array_map( 'trim', (array) $parts ), function ( $p ) { return $p !== ''; } ) );
		};

		$bag = null; // associative-shape bag with the 4 legacy keys.
		if ( $scope === 'global' ) {
			$bag = array(
				'tta__settings_css_selectors'                    => isset( $opt['tta__settings_css_selectors'] ) ? $opt['tta__settings_css_selectors'] : '',
				'tta__settings_exclude_content_by_css_selectors' => isset( $opt['tta__settings_exclude_content_by_css_selectors'] ) ? $opt['tta__settings_exclude_content_by_css_selectors'] : '',
				'tta__settings_exclude_tags'                     => isset( $opt['tta__settings_exclude_tags'] ) ? $opt['tta__settings_exclude_tags'] : '',
				'tta__settings_exclude_texts'                    => isset( $opt['tta__settings_exclude_texts'] ) ? $opt['tta__settings_exclude_texts'] : '',
			);
		} elseif ( $scope === 'post_type' && $post_type !== '' ) {
			$ovr = isset( $opt['tta__settings_atlasvoice_per_type_overrides'] ) && is_array( $opt['tta__settings_atlasvoice_per_type_overrides'] )
				? $opt['tta__settings_atlasvoice_per_type_overrides']
				: array();
			if ( isset( $ovr[ $post_type ] ) && ( is_array( $ovr[ $post_type ] ) || is_object( $ovr[ $post_type ] ) ) ) {
				$bag = (array) $ovr[ $post_type ];
			}
		}

		if ( ! is_array( $bag ) ) {
			return new \WP_REST_Response( $empty, 200 );
		}

		$selector = isset( $bag['tta__settings_css_selectors'] ) ? (string) $bag['tta__settings_css_selectors'] : '';
		if ( $selector === '' ) {
			return new \WP_REST_Response( $empty, 200 );
		}

		// TTS-238 D27.17 — response uses canonical storage keys, shipped
		// as raw strings (pipe-joined for tags/texts, newline-separated
		// for CSS). The picker shell splits on the wire.
		return new \WP_REST_Response( array(
			'tta__settings_css_selectors'                    => $selector,
			'excl_set'                                       => true,
			'tta__settings_exclude_content_by_css_selectors' => (string) ( isset( $bag['tta__settings_exclude_content_by_css_selectors'] ) ? $bag['tta__settings_exclude_content_by_css_selectors'] : '' ),
			'tta__settings_exclude_texts'                    => (string) ( isset( $bag['tta__settings_exclude_texts'] )                    ? $bag['tta__settings_exclude_texts']                    : '' ),
			'tta__settings_exclude_tags'                     => (string) ( isset( $bag['tta__settings_exclude_tags'] )                     ? $bag['tta__settings_exclude_tags']                     : '' ),
		), 200 );
	}

	/**
	 * GET /language-context — multilingual-plugin detection for the
	 * dashboard settings panel + picker overlay.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function get_language_context( $request ) {
		$ctx = array(
			'active_plugin'    => '',
			'current_language' => '',
			'default_language' => '',
			'all_languages'    => array(),
		);
		if ( class_exists( '\\TTA\\AtlasVoice\\LanguagePlugins' ) ) {
			$ctx = LanguagePlugins::detect();
		}
		return rest_ensure_response( array(
			'status'  => true,
			'context' => $ctx,
		) );
	}
}
