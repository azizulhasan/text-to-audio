<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice rule resolver (TTS-238 v5 §5.7 / D7).
 *
 * The canonical precedence walk for every "what rules apply to this
 * post?" lookup in the subsystem. Centralising this logic guarantees
 * the selector store, SelectorHash fingerprint, per-post meta-box
 * breadcrumbs, and the dashboard Rules table all agree on what's
 * actually in effect when a visitor loads a page.
 *
 * Precedence (most-specific wins, post-D26 collapse):
 *
 *   1. per-post override   (`tts_pro_custom_css_selectors` post meta,
 *                          gated on `tta__settings_use_own_css_selectors`)
 *   2. per-post-type       (`tta_settings_data['tta__settings_atlasvoice_per_type_overrides'][<slug>]`)
 *   3. global              (`tta_settings_data['tta__settings_css_selectors']` and
 *                          the three matching exclude keys, all flat)
 *
 * The resolver returns both the merged rule payload and a breadcrumb
 * trail — the latter is what the meta-box UI displays so admins can
 * see at a glance which layer contributed each rule and which layers
 * are being overridden further up the chain. Per-language and
 * per-post-type-per-language layers were retired by the D26 collapse;
 * `language` is still echoed in the resolve() output for callers that
 * include it in cache keys, but it no longer drives selection.
 *
 * This class has no side effects: pure read. It's safe to call during
 * template_redirect, from cron, or inside a REST handler without
 * worrying about option writes.
 *
 * Free tier: the per-post layer is Pro-only — if the plugin isn't
 * Pro-active the post-level lookup returns empty and the chain
 * effectively starts at the per-post-type layer. `is_pro_active()`
 * short-circuits in `load_post_rules()` so the meta read doesn't
 * happen on Free at all.
 */
class RuleResolver {

	/**
	 * Resolve the effective rule payload for a given post.
	 *
	 * The return shape matches the fields SelectorHash::resolve_rules
	 * emits — selector_global, selectors_per_language, etc. — plus a
	 * `source` pseudo-field tagging which layer "won" for the final
	 * `selector` (used by breadcrumbs).
	 *
	 * @param int $post_id
	 * @return array
	 */
	public static function resolve( $post_id ) {
		$post_id   = (int) $post_id;
		$post_type = (string) get_post_type( $post_id );
		$lang      = '';
		if ( class_exists( '\\TTA\\AtlasVoice\\LanguagePlugins' ) ) {
			$lang = (string) LanguagePlugins::current_language_code();
		}

		// TTS-238 D27.21 — read from the post-D26 collapsed storage:
		// global + per-post-type live in `tta_settings_data` (flat),
		// per-post lives in `tts_pro_custom_css_selectors` post meta.
		// The dashboard saves the option as a json_decode'd stdClass,
		// so cast through json to a recursive array for uniform reads.
		$opt_raw = get_option( 'tta_settings_data', array() );
		$opt     = json_decode( wp_json_encode( $opt_raw ), true );
		if ( ! is_array( $opt ) ) { $opt = array(); }
		// Recover from prior nested-settings writes.
		if ( isset( $opt['settings'] ) && is_array( $opt['settings'] ) ) {
			foreach ( $opt['settings'] as $k => $v ) {
				if ( ! array_key_exists( $k, $opt ) ) { $opt[ $k ] = $v; }
			}
		}

		$global_entry = self::settings_to_entry( $opt );

		$per_pt = isset( $opt['tta__settings_atlasvoice_per_type_overrides'] )
		         && is_array( $opt['tta__settings_atlasvoice_per_type_overrides'] )
			? $opt['tta__settings_atlasvoice_per_type_overrides']
			: array();
		$pt_entry = ( $post_type !== '' && isset( $per_pt[ $post_type ] ) && is_array( $per_pt[ $post_type ] ) )
			? self::settings_to_entry( $per_pt[ $post_type ] )
			: null;

		$post_override = self::load_post_rules( $post_id );

		$resolved_selector = '';
		$selector_source   = 'none';
		$resolved_entry    = null;

		$is_pro = class_exists( '\\TTA\\TTA_Helper' ) && \TTA\TTA_Helper::is_pro_active();

		// Layer 1 — per-post override (Pro). Gated on the master toggle:
		// if `tta__settings_use_own_css_selectors` is OFF the layer is
		// inactive even when the meta has data.
		if ( $is_pro
			&& ! empty( $post_override['use_own'] )
			&& isset( $post_override['selector'] )
			&& (string) $post_override['selector'] !== '' ) {
			$resolved_selector = (string) $post_override['selector'];
			$selector_source   = 'post';
			$resolved_entry    = $post_override;
		}
		// Layer 2 — per-post-type (Pro).
		elseif ( $is_pro && $pt_entry !== null && $pt_entry['selector'] !== '' ) {
			$resolved_selector = $pt_entry['selector'];
			$selector_source   = 'post_type';
			$resolved_entry    = $pt_entry;
		}
		// Layer 3 — global.
		elseif ( $global_entry['selector'] !== '' ) {
			$resolved_selector = $global_entry['selector'];
			$selector_source   = 'global';
			$resolved_entry    = $global_entry;
		}

		$excl_set   = ( $resolved_entry !== null );
		$excl_css   = $excl_set && isset( $resolved_entry['excl_css'] )   ? $resolved_entry['excl_css']   : array();
		$excl_texts = $excl_set && isset( $resolved_entry['excl_texts'] ) ? $resolved_entry['excl_texts'] : array();
		$excl_tags  = $excl_set && isset( $resolved_entry['excl_tags'] )  ? $resolved_entry['excl_tags']  : array();

		// `selector_store` retained as a back-compat key — older callers
		// (Rules table, breadcrumbs() helper) used the old option as a
		// freeform reference. We surface the new layered view here.
		$selector_store = array(
			'global'        => $global_entry,
			'per_post_type' => array_combine(
				array_keys( $per_pt ),
				array_map( function ( $bag ) {
					return is_array( $bag ) ? self::settings_to_entry( $bag ) : null;
				}, array_values( $per_pt ) )
			) ?: array(),
		);

		return array(
			'selector'        => $resolved_selector,
			'selector_source' => $selector_source,
			'post_type'       => $post_type,
			'language'        => $lang,
			'selector_store'  => $selector_store,
			'post_override'   => $post_override,
			'excl_set'        => $excl_set,
			'excl_css'        => $excl_css,
			'excl_texts'      => $excl_texts,
			'excl_tags'       => $excl_tags,
		);
	}

	/**
	 * Convert a flat `{tta__settings_*: ...}` bag into the resolver's
	 * internal entry shape:
	 *   { selector, excl_css[], excl_texts[], excl_tags[] }
	 *
	 * Storage uses pipe-joined strings for tags/texts and newline-
	 * separated strings for css excludes. Tags split aggressively
	 * (single-word tokens); texts split only on pipe/newline so
	 * commas inside phrases survive.
	 *
	 * @param mixed $bag
	 * @return array
	 */
	protected static function settings_to_entry( $bag ) {
		if ( ! is_array( $bag ) ) { $bag = array(); }
		$split_tags = function ( $val ) {
			if ( is_array( $val ) ) { $parts = $val; }
			else { $parts = preg_split( '/[\s,;|]+/', (string) $val ); }
			return array_values( array_filter( array_map( 'trim', (array) $parts ), function ( $p ) { return $p !== ''; } ) );
		};
		$split_texts = function ( $val ) {
			if ( is_array( $val ) ) { $parts = $val; }
			else { $parts = preg_split( '/[|\r\n]+/', (string) $val ); }
			return array_values( array_filter( array_map( 'trim', (array) $parts ), function ( $p ) { return $p !== ''; } ) );
		};
		$split_lines = function ( $val ) {
			if ( is_array( $val ) ) { $parts = $val; }
			else { $parts = preg_split( '/[\r\n|]+/', (string) $val ); }
			return array_values( array_filter( array_map( 'trim', (array) $parts ), function ( $p ) { return $p !== ''; } ) );
		};
		return array(
			'selector'   => isset( $bag['tta__settings_css_selectors'] ) ? (string) $bag['tta__settings_css_selectors'] : '',
			'excl_css'   => $split_lines( isset( $bag['tta__settings_exclude_content_by_css_selectors'] ) ? $bag['tta__settings_exclude_content_by_css_selectors'] : '' ),
			'excl_texts' => $split_texts( isset( $bag['tta__settings_exclude_texts'] )                    ? $bag['tta__settings_exclude_texts']                    : '' ),
			'excl_tags'  => $split_tags(  isset( $bag['tta__settings_exclude_tags'] )                     ? $bag['tta__settings_exclude_tags']                     : '' ),
		);
	}

	/**
	 * Compute the breadcrumb trail for this post's resolution.
	 *
	 * Each entry is a layer in the precedence walk with:
	 *   - key       a scope-key string the Rules table can link to
	 *   - label     a translated human label for the UI
	 *   - selector  the selector value at that layer (empty if unset)
	 *   - applies   true iff this layer contributed the final selector
	 *   - overridden true iff the layer has a value but was beaten by
	 *                a more-specific layer — used to dim the UI row.
	 *
	 * Output order is most-specific → least-specific, matching how the
	 * meta-box renders rows top-down.
	 *
	 * @param int $post_id
	 * @return array
	 */
	public static function breadcrumbs( $post_id ) {
		$resolved = self::resolve( $post_id );
		$store    = $resolved['selector_store'];
		$pt       = $resolved['post_type'];
		$winner   = $resolved['selector_source'];

		$trail = array();

		// Layer 1 — per-post override. The label distinguishes "unset"
		// (no rule saved) from "draft" (saved but the master toggle is
		// OFF) so the meta-box explains why a saved rule isn't winning.
		$po          = isset( $resolved['post_override'] ) ? $resolved['post_override'] : array();
		$po_selector = isset( $po['selector'] ) ? (string) $po['selector'] : '';
		$po_use_own  = ! empty( $po['use_own'] );
		$po_active   = $po_use_own && $po_selector !== '';
		$po_label    = ( $po_selector !== '' && ! $po_use_own )
			? __( 'This post (override, disabled)', 'text-to-audio' )
			: __( 'This post (override)', 'text-to-audio' );
		$trail[] = self::crumb(
			'post:' . $post_id,
			$po_label,
			$po_selector,
			$winner === 'post',
			$po_active && $winner !== 'post'
		);

		// Layer 2 — per-post-type
		if ( $pt !== '' ) {
			$pt_entry = isset( $store['per_post_type'][ $pt ] ) && is_array( $store['per_post_type'][ $pt ] ) ? $store['per_post_type'][ $pt ] : null;
			$pt_val   = $pt_entry !== null ? (string) $pt_entry['selector'] : '';
			$trail[] = self::crumb(
				'pt:' . $pt,
				sprintf( /* translators: %s: post type */ __( 'Post type "%s"', 'text-to-audio' ), $pt ),
				$pt_val,
				$winner === 'post_type',
				$pt_val !== '' && $winner !== 'post_type'
			);
		}

		// Layer 3 — global
		$global_val = isset( $store['global']['selector'] ) ? (string) $store['global']['selector'] : '';
		$trail[] = self::crumb(
			'global',
			__( 'Global default', 'text-to-audio' ),
			$global_val,
			$winner === 'global',
			$global_val !== '' && $winner !== 'global'
		);

		return $trail;
	}

	/**
	 * Build one breadcrumb row with a consistent shape. Kept separate
	 * so a future "role-scoped" layer can be added without repeating
	 * the row-construction boilerplate five times.
	 *
	 * @param string $key
	 * @param string $label
	 * @param string $selector
	 * @param bool   $applies
	 * @param bool   $overridden
	 * @return array
	 */
	protected static function crumb( $key, $label, $selector, $applies, $overridden ) {
		return array(
			'key'        => (string) $key,
			'label'      => (string) $label,
			'selector'   => (string) $selector,
			'applies'    => (bool) $applies,
			'overridden' => (bool) $overridden,
		);
	}

	/**
	 * Extract the selector string from a store entry that may be either
	 * a legacy plain string (old /save-selector format) or the new rule
	 * array { selector, excl_css, excl_texts, excl_tags }.
	 *
	 * @param mixed $val
	 * @return string
	 */
	protected static function entry_sel( $val ) {
		if ( is_array( $val ) ) {
			return isset( $val['selector'] ) ? (string) $val['selector'] : '';
		}
		return (string) $val;
	}

	/**
	 * Extract excl_* from a store entry. Returns null for legacy string
	 * entries so callers can distinguish "no data saved" (keep UI defaults)
	 * from "data was saved but all arrays are empty" (user cleared all chips).
	 *
	 * @param mixed $val
	 * @return array|null
	 */
	protected static function entry_excl( $val ) {
		if ( ! is_array( $val ) ) {
			return null;
		}
		return array(
			'excl_css'   => isset( $val['excl_css'] )   && is_array( $val['excl_css'] )   ? array_values( $val['excl_css'] )   : array(),
			'excl_texts' => isset( $val['excl_texts'] ) && is_array( $val['excl_texts'] ) ? array_values( $val['excl_texts'] ) : array(),
			'excl_tags'  => isset( $val['excl_tags'] )  && is_array( $val['excl_tags'] )  ? array_values( $val['excl_tags'] )  : array(),
		);
	}

	/**
	 * Read the per-post override array, or return an empty array if the
	 * site isn't Pro or the post has no override. PerPostRules owns the
	 * meta key; this method is a read-only helper so RuleResolver
	 * doesn't pull in the full write-side surface on every resolve.
	 *
	 * @param int $post_id
	 * @return array
	 */
	protected static function load_post_rules( $post_id ) {
		// TTS-238 D27.21 — read from `tts_pro_custom_css_selectors`
		// (the post meta the dashboard's per-post accordion + the
		// scope=post picker save target). Returns the parsed entry
		// shape plus the master `use_own` flag the resolver gates on.
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return array(); }
		$meta = get_post_meta( $post_id, 'tts_pro_custom_css_selectors', true );
		if ( ! is_array( $meta ) ) { $meta = array(); }
		$entry = self::settings_to_entry( $meta );
		$entry['use_own'] = ! empty( $meta['tta__settings_use_own_css_selectors'] );
		return $entry;
	}
}
