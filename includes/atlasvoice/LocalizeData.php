<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice Localize Data (TTS-238 v5 §14.2 / D0d).
 *
 * Owns every AtlasVoice-specific field that ships in the `ttsObj` JS
 * localisation payload. Legacy `admin/TTA_Admin.php` only invokes one
 * filter — `apply_filters('atlasvoice_localize_data', $data, $context)` —
 * and this class is the sole callback.
 *
 * Why an indirection? P1 ("zero existing-file edits except opt-in
 * gates") forbids the legacy admin class from carrying AtlasVoice-
 * specific field insertions. Before this refactor, TTA_Admin.php had
 * five inline additions (atlasvoice_selectors, atlasvoice_language_code,
 * use_atlasvoice_extractor, can_save_selector, current_post_type,
 * current_post_id). After the refactor it only has a single
 * `apply_filters` call, and every field is injected from here.
 *
 * Two hooks are exposed:
 *
 *   atlasvoice_localize_data
 *     Fired once at the top of the localisation builder. The filter
 *     callback adds the AtlasVoice keys that are safe to compute
 *     unconditionally (opt-in flag, selector store, language code).
 *
 *   atlasvoice_localize_data_lazy
 *     Fired inside enqueue_scripts() and enqueue_styles() once the main
 *     query is available. The callback fills in the post-aware fields
 *     (current_post_type, current_post_id). `is_singular()` and
 *     `get_queried_object_id()` must not run before the main query
 *     resolves (WP throws _doing_it_wrong), which is why a second
 *     pass exists.
 */
class LocalizeData {

	/**
	 * Register both filter callbacks. Called from Bootstrap::register().
	 * Safe to call multiple times; add_filter de-dupes by identity.
	 */
	public static function register() {
		add_filter( 'atlasvoice_localize_data', array( __CLASS__, 'inject' ), 10, 2 );
		add_filter( 'atlasvoice_localize_data_lazy', array( __CLASS__, 'inject_lazy' ), 10, 1 );
	}

	/**
	 * Initial inject — fields that don't depend on the main query.
	 *
	 * @param array $data    The localisation payload built so far.
	 * @param array $context { 'post_id' => int, 'settings' => array } —
	 *                       the legacy admin class passes its settings
	 *                       map so we can read the opt-in flag without
	 *                       doing a second round-trip.
	 * @return array
	 */
	public static function inject( $data, $context = array() ) {
		if ( ! is_array( $data ) ) { $data = array(); }
		$settings = isset( $context['settings'] ) && is_array( $context['settings'] )
			? $context['settings']
			: array();

		// TTS-238 D27.23 — back-compat shim for any front-end caller
		// still reading `tta_obj.atlasvoice_selectors`. The legacy
		// `tta_atlasvoice_selectors` option is retired (no writers
		// since D26.9), so this almost always returns the empty
		// default; the engine's authoritative input is now the
		// pre-resolved rule below.
		$data['atlasvoice_selectors'] = get_option(
			'tta_atlasvoice_selectors',
			array( 'global' => '', 'per_post_type' => array() )
		);

		// TTS-238 D27.33 — LanguagePlugins retired. The legacy extractor
		// engine's Tier-2 fallback walk reads this field, so we keep
		// the key for back-compat but ship an empty value (per-language
		// scopes were already retired by the D26 collapse).
		$data['atlasvoice_language_code'] = '';

		// D26 — opt-in flag retired. Hardcode true so any front-end
		// caller still reading `tts.use_atlasvoice_extractor` keeps
		// running on the new always-on path.
		$data['use_atlasvoice_extractor'] = true;

		// Admin capability for first-visit auto-save. Lifted into the
		// bundle so the engine doesn't speculatively POST /save-selector
		// and eat a 403.
		$data['can_save_selector'] = current_user_can( 'manage_options' );

		// Lazy-populated fields — seed as empty; the lazy filter
		// fills them in after the main query resolves.
		if ( ! isset( $data['current_post_type'] ) ) {
			$data['current_post_type'] = '';
		}
		if ( ! isset( $data['current_post_id'] ) ) {
			$data['current_post_id'] = 0;
		}

		return $data;
	}

	/**
	 * Lazy inject — runs inside enqueue_scripts() / enqueue_styles()
	 * where the main query has resolved and `is_singular()` is safe.
	 *
	 * @param array $data
	 * @return array
	 */
	public static function inject_lazy( $data ) {
		if ( ! is_array( $data ) ) { $data = array(); }

		$post_id = 0;
		if ( empty( $data['current_post_type'] ) ) {
			if ( function_exists( 'is_singular' ) && is_singular() ) {
				$data['current_post_type'] = (string) get_post_type();
			}
		}
		if ( empty( $data['current_post_id'] ) ) {
			if ( function_exists( 'is_singular' ) && is_singular() ) {
				$post_id                   = (int) get_the_ID();
				$data['current_post_id']   = $post_id;
			}
		} else {
			$post_id = (int) $data['current_post_id'];
		}

		// TTS-238 D27.23 — server-resolve the rule for the current post
		// via RuleResolver and ship the answer. The JS extractor engine
		// prefers this over the old `atlasvoice_selectors` store walk
		// so PHP and JS see the same winner. Includes the full payload
		// the engine needs for content extraction (selector + the three
		// exclude lists). If RuleResolver returns no winner the field
		// is null and the engine falls through to its existing tiers.
		if ( $post_id > 0 && class_exists( '\\TTA\\AtlasVoice\\RuleResolver' ) ) {
			$resolved = RuleResolver::resolve( $post_id );
			if ( ! empty( $resolved['selector'] ) ) {
				$data['atlasvoice_resolved_rule'] = array(
					'selector'   => (string) $resolved['selector'],
					'source'     => isset( $resolved['selector_source'] ) ? (string) $resolved['selector_source'] : '',
					'excl_css'   => isset( $resolved['excl_css'] )   && is_array( $resolved['excl_css'] )   ? array_values( $resolved['excl_css'] )   : array(),
					'excl_texts' => isset( $resolved['excl_texts'] ) && is_array( $resolved['excl_texts'] ) ? array_values( $resolved['excl_texts'] ) : array(),
					'excl_tags'  => isset( $resolved['excl_tags'] )  && is_array( $resolved['excl_tags'] )  ? array_values( $resolved['excl_tags'] )  : array(),
				);
			} else {
				$data['atlasvoice_resolved_rule'] = null;
			}
		}

		return $data;
	}
}
