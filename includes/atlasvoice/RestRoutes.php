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
 *   GET  /step-rail/scope-rule
 *   GET  /step-rail/sample-url
 *   POST /step-rail/verify-sample
 *   GET  /step-rail/verify-sample
 *   GET  /mode                              (status pill)
 *   POST /mode                              (Go Live / revert)
 *
 * Retired: /save-selector, /post-rules, /heal-log,
 * /boilerplate-suggestions, /boilerplate-exclude, /step-rail/scopes
 * (D27.28); /snapshots (D27.29); /auth-variant (pre-D27.28),
 * /language-context (D27.30); /step-rail/active-rule
 * (D27.43 — picker reads `ttsObj.atlasvoice_resolved_rule` directly).
 *
 * /mode was retired in D27.30 but restored in TTS-247 — Mode.php's
 * admin-bar Go Live dialog posts to it, so it is not actually dead.
 *
 * All handlers live on this class too. Keeping route registration
 * and handler code together makes the module delete-safe: removing
 * `includes/atlasvoice/` wipes every AtlasVoice REST surface with
 * no dangling callbacks left in the legacy routes.
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

		// TTS-247 — restore the mode status / Go-Live route. It was retired
		// in D27.30 as "unused", but Mode.php's admin-bar Go Live dialog
		// posts to tta/v1/mode (action=go-live|revert); removing it broke
		// Go Live with "No route was found matching the URL". GET returns
		// the status pill data; POST flips the mode under a typed-confirm gate.
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
	}

	/**
	 * GET /mode — current AtlasVoice pipeline status. Returns the
	 * three-state banner info (state / colour / label) the dashboard and
	 * admin-bar dot mirror need. Read-only — delegates to Mode::status().
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
	 *   action=go-live  confirm="GO LIVE"  →  switch to production
	 *                   (confirm compared byte-exactly).
	 *   action=revert                       →  switch to staging.
	 *
	 * On success Mode::set fires `atlasvoice_mode_changed`, plus a
	 * direction-specific `atlasvoice_go_live` / `atlasvoice_reverted_to_staging`.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function post_mode( $request ) {
		if ( ! class_exists( '\\TTA\\AtlasVoice\\Mode' ) ) {
			return new \WP_Error( 'not_available', 'Mode class not loaded.', array( 'status' => 500 ) );
		}

		// Opt-in must be on before mode can be flipped at all.
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
			// Intentionally byte-exact: not strcasecmp, not trim.
			if ( $confirm !== 'GO LIVE' ) {
				return new \WP_Error(
					'confirmation_required',
					__( 'Type GO LIVE exactly to confirm production rollout.', 'text-to-audio' ),
					array( 'status' => 400 )
				);
			}
			Mode::set( Mode::MODE_PRODUCTION );
			/**
			 * Fires after a successful Go Live.
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
			 * Fires after a revert-to-staging.
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
			// TTS-247 — for Global / Language scope, sample only from the post
			// types enabled in "Allow Listening For Post Type" (default: post),
			// NOT every public type. Otherwise the newest published item could
			// be a Page or unrelated CPT the player never runs on.
			$args['post_type'] = class_exists( '\\TTA\\TTA_Helper' )
				? \TTA\TTA_Helper::get_listening_post_types()
				: array( 'post' );
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

}
