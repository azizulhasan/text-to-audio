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
 * Precedence (most-specific wins, same as the D3/D0d plan):
 *
 *   1. per-post override            (_atlasvoice_post_rules meta)
 *   2. per-post-type + per-language (selectors.per_post_type_per_language[pt][lang])
 *   3. per-language                 (selectors.per_language[lang])
 *   4. per-post-type                (selectors.per_post_type[pt])
 *   5. global                       (selectors.global)
 *
 * The resolver returns both the merged rule payload and a breadcrumb
 * trail — the latter is what the meta-box UI displays so admins can
 * see at a glance which layer contributed each rule and which layers
 * are being overridden further up the chain.
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

		$selectors = get_option(
			'tta_atlasvoice_selectors',
			array( 'global' => '', 'per_post_type' => array() )
		);
		if ( ! is_array( $selectors ) ) {
			$selectors = array( 'global' => '', 'per_post_type' => array() );
		}
		$per_pt      = isset( $selectors['per_post_type'] ) && is_array( $selectors['per_post_type'] ) ? $selectors['per_post_type'] : array();
		$per_lang    = isset( $selectors['per_language'] ) && is_array( $selectors['per_language'] ) ? $selectors['per_language'] : array();
		$per_pt_lang = isset( $selectors['per_post_type_per_language'] ) && is_array( $selectors['per_post_type_per_language'] ) ? $selectors['per_post_type_per_language'] : array();

		$post_override = self::load_post_rules( $post_id );

		// Walk from most-specific to least-specific.
		$resolved_selector = '';
		$selector_source   = 'none';

		if ( isset( $post_override['selector'] ) && (string) $post_override['selector'] !== '' ) {
			$resolved_selector = (string) $post_override['selector'];
			$selector_source   = 'post';
		} elseif ( $post_type !== '' && $lang !== '' && isset( $per_pt_lang[ $post_type ][ $lang ] ) && $per_pt_lang[ $post_type ][ $lang ] !== '' ) {
			$resolved_selector = (string) $per_pt_lang[ $post_type ][ $lang ];
			$selector_source   = 'post_type_language';
		} elseif ( $lang !== '' && isset( $per_lang[ $lang ] ) && $per_lang[ $lang ] !== '' ) {
			$resolved_selector = (string) $per_lang[ $lang ];
			$selector_source   = 'language';
		} elseif ( $post_type !== '' && isset( $per_pt[ $post_type ] ) && $per_pt[ $post_type ] !== '' ) {
			$resolved_selector = (string) $per_pt[ $post_type ];
			$selector_source   = 'post_type';
		} elseif ( isset( $selectors['global'] ) && $selectors['global'] !== '' ) {
			$resolved_selector = (string) $selectors['global'];
			$selector_source   = 'global';
		}

		return array(
			'selector'         => $resolved_selector,
			'selector_source'  => $selector_source,
			'post_type'        => $post_type,
			'language'         => $lang,
			'selector_store'   => $selectors,
			'post_override'    => $post_override,
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
		$sel      = $resolved['selector_store'];
		$pt       = $resolved['post_type'];
		$lang     = $resolved['language'];
		$winner   = $resolved['selector_source'];

		$trail = array();

		// Layer 1 — per-post override
		$post_override_sel = isset( $resolved['post_override']['selector'] ) ? (string) $resolved['post_override']['selector'] : '';
		$trail[] = self::crumb(
			'post:' . $post_id,
			__( 'This post (override)', 'text-to-audio' ),
			$post_override_sel,
			$winner === 'post',
			$post_override_sel !== '' && $winner !== 'post'
		);

		// Layer 2 — per-post-type + per-language
		if ( $pt !== '' && $lang !== '' ) {
			$val = isset( $sel['per_post_type_per_language'][ $pt ][ $lang ] ) ? (string) $sel['per_post_type_per_language'][ $pt ][ $lang ] : '';
			$trail[] = self::crumb(
				'pt:' . $pt . ':lang:' . $lang,
				sprintf( /* translators: 1: post type, 2: language */
					__( 'Post type "%1$s" + language "%2$s"', 'text-to-audio' ),
					$pt, $lang
				),
				$val,
				$winner === 'post_type_language',
				$val !== '' && $winner !== 'post_type_language'
			);
		}

		// Layer 3 — per-language
		if ( $lang !== '' ) {
			$val = isset( $sel['per_language'][ $lang ] ) ? (string) $sel['per_language'][ $lang ] : '';
			$trail[] = self::crumb(
				'lang:' . $lang,
				sprintf( /* translators: %s: language */ __( 'Language "%s"', 'text-to-audio' ), $lang ),
				$val,
				$winner === 'language',
				$val !== '' && $winner !== 'language'
			);
		}

		// Layer 4 — per-post-type
		if ( $pt !== '' ) {
			$val = isset( $sel['per_post_type'][ $pt ] ) ? (string) $sel['per_post_type'][ $pt ] : '';
			$trail[] = self::crumb(
				'pt:' . $pt,
				sprintf( /* translators: %s: post type */ __( 'Post type "%s"', 'text-to-audio' ), $pt ),
				$val,
				$winner === 'post_type',
				$val !== '' && $winner !== 'post_type'
			);
		}

		// Layer 5 — global
		$global_val = isset( $sel['global'] ) ? (string) $sel['global'] : '';
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
	 * Read the per-post override array, or return an empty array if the
	 * site isn't Pro or the post has no override. PerPostRules owns the
	 * meta key; this method is a read-only helper so RuleResolver
	 * doesn't pull in the full write-side surface on every resolve.
	 *
	 * @param int $post_id
	 * @return array
	 */
	protected static function load_post_rules( $post_id ) {
		if ( ! class_exists( '\\TTA\\AtlasVoice\\PerPostRules' ) ) {
			return array();
		}
		if ( ! PerPostRules::available() ) {
			return array();
		}
		return PerPostRules::get( $post_id );
	}
}
