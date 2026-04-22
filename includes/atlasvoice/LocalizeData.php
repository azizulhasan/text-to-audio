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

		// Selector store — engine uses this to resolve Tier 2 selectors.
		$data['atlasvoice_selectors'] = get_option(
			'tta_atlasvoice_selectors',
			array( 'global' => '', 'per_post_type' => array() )
		);

		// Current multilingual-plugin language code so the client-side
		// resolver picks the language-scoped selector first. Empty string
		// on non-multilingual sites — resolveSavedSelector falls through
		// the per_language slot entirely in that case.
		$data['atlasvoice_language_code'] = class_exists( '\\TTA\\AtlasVoice\\LanguagePlugins' )
			? LanguagePlugins::current_language_code()
			: '';

		// Opt-in flag — the JS engine stays dormant unless this is true.
		// TTA_Admin passes its tts_get_settings('') result as
		// $context['settings'], so the flag lives under
		// settings['settings']['tta__settings_use_atlasvoice_extractor'].
		$data['use_atlasvoice_extractor'] = ! empty(
			$settings['settings']['tta__settings_use_atlasvoice_extractor'] ?? false
		);

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

		if ( empty( $data['current_post_type'] ) ) {
			if ( function_exists( 'is_singular' ) && is_singular() ) {
				$data['current_post_type'] = (string) get_post_type();
			}
		}
		if ( empty( $data['current_post_id'] ) ) {
			if ( function_exists( 'is_singular' ) && is_singular() ) {
				$data['current_post_id'] = (int) get_the_ID();
			}
		}
		return $data;
	}
}
