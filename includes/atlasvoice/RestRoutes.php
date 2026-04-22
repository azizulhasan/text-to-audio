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
 *   GET  /save-selector is NOT here — that endpoint pre-existed §0.7
 *        and its current body is an organic extension of the legacy
 *        selector save plumbing; it stays in `TTA_Api_Routes`.
 *   POST /heal-log
 *   GET  /boilerplate-suggestions
 *   POST /boilerplate-suggestions           (refresh-on-demand)
 *   POST /boilerplate-exclude
 *   GET  /auth-variant
 *   POST /auth-variant                      (pin OR record-sample)
 *   GET  /language-context
 *
 * All handlers live on this class too — they own the option keys the
 * AtlasVoice subsystem touches (`tta_atlasvoice_boilerplate_*`,
 * `tta_atlasvoice_heal_log`, post meta via AuthVariants::*). Keeping
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
	const NAMESPACE_PREFIX = 'tts/v1';

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

		// PR-C (C2a) — heal log.
		register_rest_route(
			$ns,
			'/heal-log',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_heal_log' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(),
				),
			)
		);

		// PR-C (C3b) — boilerplate suggestions.
		register_rest_route(
			$ns,
			'/boilerplate-suggestions',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_boilerplate_suggestions' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'refresh_boilerplate_suggestions' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(),
				),
			)
		);

		// PR-C (C3c) — boilerplate exclude/include toggle.
		register_rest_route(
			$ns,
			'/boilerplate-exclude',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'toggle_boilerplate_exclusion' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'text'   => array( 'type' => 'string', 'required' => true ),
						'action' => array( 'type' => 'string', 'default'  => 'add' ),
					),
				),
			)
		);

		// PR-C (C6a) — auth-variant describe + set + record-sample.
		register_rest_route(
			$ns,
			'/auth-variant',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_auth_variant' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'post_id' => array( 'type' => 'integer', 'required' => true ),
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'post_auth_variant' ),
					// Public — sample-record is reachable to logged-out
					// visitors. The callback splits action-level gating.
					'permission_callback' => '__return_true',
					'args'                => array(
						'post_id'   => array( 'type' => 'integer', 'required' => true ),
						'action'    => array( 'type' => 'string', 'default' => 'record' ),
						'variant'   => array( 'type' => 'string', 'required' => false ),
						'text_hash' => array( 'type' => 'string', 'required' => false ),
						'text_len'  => array( 'type' => 'integer', 'required' => false ),
					),
				),
			)
		);

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

		// TTS-238 v5 (D7) — per-post rule override + breadcrumbs.
		// GET  returns the resolved rule chain + breadcrumb trail for
		//      a single post so the dashboard / meta-box UI can render
		//      without duplicating the precedence logic.
		// POST writes the override (action=set) or removes it (action=clear).
		register_rest_route(
			$ns,
			'/post-rules',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_post_rules' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'post_id' => array( 'type' => 'integer', 'required' => true ),
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'post_post_rules' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
					'args'                => array(
						'action'   => array( 'type' => 'string',  'required' => true ),
						'post_id'  => array( 'type' => 'integer', 'required' => true ),
						'selector' => array( 'type' => 'string',  'required' => false ),
						// D10 — chip arrays from the step-rail. Accept
						// array OR string (legacy) for excl_css; arrays
						// only for texts/tags.
						'excl_css' => array( 'required' => false ),
						'excl_texts' => array(
							'type'     => 'array',
							'required' => false,
							'items'    => array( 'type' => 'string' ),
						),
						'excl_tags'  => array(
							'type'     => 'array',
							'required' => false,
							'items'    => array( 'type' => 'string' ),
						),
					),
				),
			)
		);

		// TTS-238 — selector save (used by picker + heal flow). Lives in
		// AtlasVoice because it owns the `tta_atlasvoice_selectors` option,
		// the heal log, and the cache-purge hint payload. Pre-§0.7 this
		// was a stub in TTA_Api_Routes; v5 §14 moved the whole surface
		// into this file so TTA_Api_Routes can revert byte-identical.
		register_rest_route(
			$ns,
			'/save-selector',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'save_selector' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
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
						// PR-C (C5b): language scoping. When present we store
						// the selector under the per-language slot so
						// multilingual sites can pick different DOM regions
						// per language without overwriting each other.
						'language' => array(
							'type'        => 'string',
							'required'    => false,
							'description' => 'Language code (e.g. "en", "fr"). Omit to store globally.',
						),
						// PR-C (C1c) — heal audit fields.
						'reason' => array(
							'type'        => 'string',
							'required'    => false,
							'description' => 'Origin of the save. "heal" means the picker is rewriting a broken saved selector.',
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

		// D9 — step-rail /scopes and /sample-url. Both are admin reads
		// used by the client-side shell to populate row ② (post-type +
		// language selects) and to resolve row ③'s iframe URL.
		register_rest_route(
			$ns,
			'/step-rail/scopes',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_step_rail_scopes' ),
					'permission_callback' => array( __CLASS__, 'admin_guard' ),
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
	 * D9 — Step-rail scope enumerator. Returns:
	 *   - post_types:  array of { slug, label } registered public CPTs
	 *                  that the settings page tracks, so rail and
	 *                  settings agree on what's "rulable".
	 *   - languages:   array of language codes from LanguagePlugins
	 *                  (empty when the site isn't multilingual).
	 *   - active_lang: the currently-resolved language for the caller.
	 *   - active_plugin: detected multilingual plugin ('' when none).
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_step_rail_scopes() {
		$post_types = array();
		$candidates = get_post_types( array( 'public' => true ), 'objects' );
		if ( is_array( $candidates ) ) {
			foreach ( $candidates as $slug => $obj ) {
				if ( $slug === 'attachment' ) { continue; }
				$label = isset( $obj->labels->singular_name ) ? (string) $obj->labels->singular_name : $slug;
				$post_types[] = array( 'slug' => (string) $slug, 'label' => $label );
			}
		}

		$lang_ctx = array(
			'active_plugin'    => '',
			'current_language' => '',
			'default_language' => '',
			'all_languages'    => array(),
		);
		if ( class_exists( '\\TTA\\AtlasVoice\\LanguagePlugins' ) ) {
			$lang_ctx = array_merge( $lang_ctx, (array) LanguagePlugins::detect() );
		}

		return new \WP_REST_Response( array(
			'post_types'    => $post_types,
			'languages'     => array_values( (array) $lang_ctx['all_languages'] ),
			'active_lang'   => (string) $lang_ctx['current_language'],
			'active_plugin' => (string) $lang_ctx['active_plugin'],
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

		$flag = class_exists( '\\TTA\\AtlasVoice\\StepRail' ) ? StepRail::IFRAME_FLAG : 'atlasvoice_iframe';
		$url  = add_query_arg( array(
			$flag     => 1,
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
	 * POST /save-selector — persist a selector chosen via the
	 * AtlasVoiceSelector picker (or written by the heal flow).
	 *
	 * Storage model (unchanged from the legacy shipping behaviour):
	 *   option `tta_atlasvoice_selectors` = array(
	 *     'global'                       => '#main-content',
	 *     'per_post_type'                => array('post' => '…', ...),
	 *     'per_language'                 => array('fr' => '…', ...),
	 *     'per_post_type_per_language'   => array('post' => array('fr' => '…')),
	 *   )
	 *
	 * Routing table (most-specific wins):
	 *   Pro + post_type + language → per_post_type_per_language[pt][lang]
	 *   *   + language              → per_language[lang]
	 *   Pro + post_type             → per_post_type[pt]
	 *   else                        → global
	 *
	 * Side effects:
	 *   - Invalidates `TTA\TTA_Cache::delete('all_settings')` so the
	 *     dashboard settings API returns fresh selectors next GET.
	 *   - Appends a heal/revert entry to `tta_atlasvoice_heal_log` when
	 *     `reason=heal` or `reason=revert`.
	 *   - Attaches a cache-purge hint payload so the UI can toast users
	 *     who have WP Rocket / LiteSpeed / WP Engine / Cloudflare / etc.
	 *     active.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save_selector( $request ) {
		$selector     = trim( (string) $request->get_param( 'selector' ) );
		$post_type    = sanitize_key( (string) $request->get_param( 'post_type' ) );
		$reason       = sanitize_key( (string) $request->get_param( 'reason' ) );
		$old_selector = trim( (string) $request->get_param( 'old_selector' ) );

		// Language scoping (PR-C C5b). Normalise via the detector so "en_US"
		// becomes "en" and casing/locale-form variants don't fragment storage.
		$language_raw = (string) $request->get_param( 'language' );
		$language     = '';
		if ( $language_raw !== '' && class_exists( '\\TTA\\AtlasVoice\\LanguagePlugins' ) ) {
			$language = LanguagePlugins::normalise_code( $language_raw );
		} elseif ( $language_raw !== '' ) {
			$language = sanitize_key( $language_raw );
		}

		if ( $selector === '' || strlen( $selector ) > 512 ) {
			return new \WP_Error( 'invalid_selector', __( 'Selector is empty or too long.', 'text-to-audio' ), array( 'status' => 400 ) );
		}
		// Basic shape check — allow only characters valid in CSS selectors
		// + escaped unicode.
		if ( ! preg_match( '#^[A-Za-z0-9_\-\s\.\#\[\]\=\"\'\>\,\:\(\)\*\^\$\|\\\\]+$#', $selector ) ) {
			return new \WP_Error( 'invalid_selector_chars', __( 'Selector contains invalid characters.', 'text-to-audio' ), array( 'status' => 400 ) );
		}
		if ( $old_selector !== '' ) {
			if ( strlen( $old_selector ) > 512
				 || ! preg_match( '#^[A-Za-z0-9_\-\s\.\#\[\]\=\"\'\>\,\:\(\)\*\^\$\|\\\\]+$#', $old_selector ) ) {
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
		if ( ! isset( $store['per_language'] ) || ! is_array( $store['per_language'] ) ) {
			$store['per_language'] = array();
		}
		if ( ! isset( $store['per_post_type_per_language'] ) || ! is_array( $store['per_post_type_per_language'] ) ) {
			$store['per_post_type_per_language'] = array();
		}

		$is_pro = function_exists( 'is_pro_active' ) && is_pro_active();
		if ( $is_pro && $post_type !== '' && $language !== '' ) {
			if ( ! isset( $store['per_post_type_per_language'][ $post_type ] )
				 || ! is_array( $store['per_post_type_per_language'][ $post_type ] ) ) {
				$store['per_post_type_per_language'][ $post_type ] = array();
			}
			$store['per_post_type_per_language'][ $post_type ][ $language ] = $selector;
		} elseif ( $language !== '' ) {
			$store['per_language'][ $language ] = $selector;
		} elseif ( $is_pro && $post_type !== '' ) {
			$store['per_post_type'][ $post_type ] = $selector;
		} else {
			$store['global'] = $selector;
		}

		update_option( 'tta_atlasvoice_selectors', $store, false );
		if ( class_exists( '\\TTA\\TTA_Cache' ) ) {
			\TTA\TTA_Cache::delete( 'all_settings' );
		}

		// PR-C (C1c + C2a) — heal/revert audit log.
		if ( ( $reason === 'heal' || $reason === 'revert' )
			 && $old_selector !== '' && $old_selector !== $selector ) {
			if ( $is_pro && $post_type !== '' ) {
				$scope = 'post_type:' . $post_type;
			} else {
				$scope = 'global';
			}
			if ( $language !== '' ) {
				$scope .= ':lang=' . $language;
			}
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

		// PR-C (C4a) — cache purge hint payload.
		$cache_hint = array(
			'needs_purge' => false,
			'detected'    => array(),
			'host_hints'  => array(),
			'message'     => '',
		);
		if ( class_exists( '\\TTA\\AtlasVoice\\CachePurgeHints' ) ) {
			$cache_hint = CachePurgeHints::get_hint();
		}

		return rest_ensure_response( array(
			'status'     => true,
			'data'       => $store,
			'reason'     => $reason ?: null,
			'cache_hint' => $cache_hint,
		) );
	}

	/**
	 * GET /heal-log — reverse-chrono ring buffer, normalise missing fields.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function get_heal_log( $request ) {
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
		return rest_ensure_response( array( 'status' => true, 'log' => $out ) );
	}

	/**
	 * GET /boilerplate-suggestions — read cached detector output.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function get_boilerplate_suggestions( $request ) {
		$data = array(
			'generated_at' => 0,
			'sample_size'  => 0,
			'suggestions'  => array(),
		);
		if ( class_exists( '\\TTA\\AtlasVoice\\BoilerplateDetector' ) ) {
			$data = BoilerplateDetector::get_cached();
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
	 * POST /boilerplate-suggestions — re-run the detector on demand.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function refresh_boilerplate_suggestions( $request ) {
		if ( ! class_exists( '\\TTA\\AtlasVoice\\BoilerplateDetector' ) ) {
			return rest_ensure_response( array(
				'status'      => false,
				'message'     => 'BoilerplateDetector class not loaded.',
				'suggestions' => array(),
			) );
		}
		BoilerplateDetector::run();
		$data = BoilerplateDetector::get_cached();
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
	 * POST /boilerplate-exclude — add/remove a fragment from the player
	 * exclusion list. Dedupes on the raw text, caps at 200 entries.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function toggle_boilerplate_exclusion( $request ) {
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
	 * GET /auth-variant — describe a post's variant state.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function get_auth_variant( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		if ( $post_id <= 0 ) {
			return new \WP_Error( 'invalid_post', __( 'Missing post_id.', 'text-to-audio' ), array( 'status' => 400 ) );
		}
		if ( ! class_exists( '\\TTA\\AtlasVoice\\AuthVariants' ) ) {
			return rest_ensure_response( array(
				'status'  => false,
				'message' => 'AuthVariants class not loaded.',
			) );
		}
		return rest_ensure_response( array(
			'status' => true,
			'data'   => AuthVariants::describe( $post_id ),
		) );
	}

	/**
	 * POST /auth-variant — pin variant (admin, action=set) OR record
	 * extraction sample (public, action=record).
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function post_auth_variant( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$action  = sanitize_key( (string) $request->get_param( 'action' ) );
		if ( $post_id <= 0 ) {
			return new \WP_Error( 'invalid_post', __( 'Missing post_id.', 'text-to-audio' ), array( 'status' => 400 ) );
		}
		if ( ! class_exists( '\\TTA\\AtlasVoice\\AuthVariants' ) ) {
			return new \WP_Error( 'not_available', 'AuthVariants class not loaded.', array( 'status' => 500 ) );
		}

		if ( $action === 'set' ) {
			// Admin pin — edit_post is the right cap because variant is
			// a per-post property, not a site-wide setting.
			if ( ! current_user_can( 'edit_post', $post_id ) ) {
				return new \WP_Error( 'forbidden', __( 'You cannot edit this post.', 'text-to-audio' ), array( 'status' => 403 ) );
			}
			$variant = (string) $request->get_param( 'variant' );
			$ok = AuthVariants::set_variant( $post_id, $variant );
			if ( ! $ok ) {
				return new \WP_Error( 'invalid_variant', __( 'Invalid variant value.', 'text-to-audio' ), array( 'status' => 400 ) );
			}
			return rest_ensure_response( array(
				'status' => true,
				'data'   => AuthVariants::describe( $post_id ),
			) );
		}

		if ( $action === 'record' ) {
			// Rate-limit: one record per (IP+post+auth-state) per 60s so
			// a chatty theme doesn't fill the samples ring buffer on
			// every visitor pageload.
			$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
			$key = 'tta_av_' . md5( $ip . '|' . $post_id . '|' . ( is_user_logged_in() ? 'i' : 'o' ) );
			if ( get_transient( $key ) ) {
				return rest_ensure_response( array(
					'status'    => true,
					'throttled' => true,
				) );
			}
			set_transient( $key, 1, MINUTE_IN_SECONDS );

			$text_hash = (string) $request->get_param( 'text_hash' );
			$text_len  = (int) $request->get_param( 'text_len' );
			$samples   = AuthVariants::record_sample(
				$post_id,
				is_user_logged_in(),
				$text_hash,
				$text_len
			);
			return rest_ensure_response( array(
				'status'  => true,
				'samples' => $samples,
			) );
		}

		return new \WP_Error( 'unknown_action', __( 'Unknown action.', 'text-to-audio' ), array( 'status' => 400 ) );
	}

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
	 * GET /post-rules — read the resolved rule chain for a single post.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function get_post_rules( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		if ( $post_id <= 0 ) {
			return new \WP_Error( 'invalid_post', __( 'Missing post_id.', 'text-to-audio' ), array( 'status' => 400 ) );
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new \WP_Error( 'forbidden', __( 'You cannot edit this post.', 'text-to-audio' ), array( 'status' => 403 ) );
		}
		if ( ! class_exists( '\\TTA\\AtlasVoice\\RuleResolver' ) ) {
			return rest_ensure_response( array( 'status' => false, 'error' => 'RuleResolver class not loaded.' ) );
		}
		$resolved = RuleResolver::resolve( $post_id );
		$crumbs   = RuleResolver::breadcrumbs( $post_id );
		$override = array();
		$available = false;
		if ( class_exists( '\\TTA\\AtlasVoice\\PerPostRules' ) ) {
			$available = PerPostRules::available();
			if ( $available ) {
				$override = PerPostRules::get( $post_id );
			}
		}
		return rest_ensure_response( array(
			'status'      => true,
			'post_id'     => $post_id,
			'available'   => $available,
			'resolved'    => array(
				'selector'        => $resolved['selector'],
				'selector_source' => $resolved['selector_source'],
				'post_type'       => $resolved['post_type'],
				'language'        => $resolved['language'],
			),
			'breadcrumbs' => $crumbs,
			'override'    => $override,
		) );
	}

	/**
	 * POST /post-rules — mutate the per-post override.
	 *
	 *   action=set     selector=<css>   → PerPostRules::set
	 *   action=clear                    → PerPostRules::clear
	 *
	 * The Pro gate is enforced at the storage layer — Free returns
	 * 409 here rather than silently swallowing the write, so the
	 * dashboard surfaces a meaningful message.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function post_post_rules( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$action  = sanitize_key( (string) $request->get_param( 'action' ) );
		if ( $post_id <= 0 ) {
			return new \WP_Error( 'invalid_post', __( 'Missing post_id.', 'text-to-audio' ), array( 'status' => 400 ) );
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new \WP_Error( 'forbidden', __( 'You cannot edit this post.', 'text-to-audio' ), array( 'status' => 403 ) );
		}
		if ( ! class_exists( '\\TTA\\AtlasVoice\\PerPostRules' ) ) {
			return new \WP_Error( 'not_available', 'PerPostRules class not loaded.', array( 'status' => 500 ) );
		}
		if ( ! PerPostRules::available() ) {
			return new \WP_Error(
				'pro_required',
				__( 'Per-post rule overrides require the AtlasVoice Pro plugin.', 'text-to-audio' ),
				array( 'status' => 409 )
			);
		}

		if ( $action === 'set' ) {
			// D7 passed only { selector }. D10 accepts the step-rail's
			// chip arrays (excl_css / excl_texts / excl_tags) too. The
			// sanitiser drops unknown fields, so callers can safely send
			// a superset and rely on the server to normalise it.
			$selector = (string) $request->get_param( 'selector' );
			$rules    = array( 'selector' => $selector );

			$excl_css = $request->get_param( 'excl_css' );
			if ( $excl_css !== null ) { $rules['excl_css'] = $excl_css; }

			$excl_texts = $request->get_param( 'excl_texts' );
			if ( is_array( $excl_texts ) ) { $rules['excl_texts'] = $excl_texts; }

			$excl_tags = $request->get_param( 'excl_tags' );
			if ( is_array( $excl_tags ) ) { $rules['excl_tags'] = $excl_tags; }

			$payload = PerPostRules::set( $post_id, $rules );
			return rest_ensure_response( array(
				'status'   => true,
				'post_id'  => $post_id,
				'override' => $payload,
			) );
		}
		if ( $action === 'clear' ) {
			PerPostRules::clear( $post_id );
			return rest_ensure_response( array(
				'status'   => true,
				'post_id'  => $post_id,
				'override' => PerPostRules::empty_payload(),
			) );
		}

		return new \WP_Error( 'unknown_action', __( 'Unknown post-rules action.', 'text-to-audio' ), array( 'status' => 400 ) );
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
