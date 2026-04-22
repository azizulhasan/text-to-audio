<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice Language Plugins Detector (TTS-238 C5a, v5 §14.1 refactor).
 *
 * Multilingual WordPress sites serve the same post slug in multiple
 * languages, and the DOM tree rendered by the theme often differs per
 * language (translated theme templates, RTL wrappers, per-language
 * schema blocks). A single AtlasVoice selector stored globally is not
 * sufficient — it may resolve correctly in English and miss entirely
 * on the French translation.
 *
 * This class is a pure detector. It inspects the active plugins and
 * returns a normalised shape:
 *
 *   array(
 *     'active_plugin'    => 'wpml' | 'polylang' | 'translatepress' | 'gtranslate' | '',
 *     'current_language' => 'en',         // 2-letter code, or '' when not multilingual
 *     'default_language' => 'en',
 *     'all_languages'    => array( 'en', 'fr', 'de' ),
 *   );
 *
 * Consumed by:
 *   - C5b extractor / save-selector: to key the saved selector as
 *     "{scope}:{lang_code}" so each translation can have its own picker.
 *   - REST /language-context (C5a): surfaces detection to the dashboard
 *     so the settings UI can explain "we detected WPML — your selectors
 *     will be stored per language".
 *
 * Zero-cost when no multilingual plugin is active: all calls return the
 * empty-shape with `active_plugin = ''` after a quick constant / class
 * check. The class is static & stateless — safe to call from any hook.
 *
 * Isolation note (P1/P4): namespace TTA\AtlasVoice — no cross-calls into
 * the legacy TTA\ namespace. Delete-safe.
 */
class LanguagePlugins {

	/**
	 * Detection order matters: WPML and Polylang are "heavyweight"
	 * translations that alter DOM + post meta; TranslatePress rewrites
	 * content on output; GTranslate is JS-only and doesn't change the
	 * PHP-rendered DOM. If two are somehow active together we prefer
	 * the more structural one so selectors still key correctly.
	 */
	const PLUGIN_WPML          = 'wpml';
	const PLUGIN_POLYLANG      = 'polylang';
	const PLUGIN_TRANSLATEPRESS = 'translatepress';
	const PLUGIN_GTRANSLATE    = 'gtranslate';

	/**
	 * Cache the detection result for the current request. This is called
	 * by the extractor engine, the save-selector route, and the REST
	 * /language-context handler — once per request is plenty.
	 *
	 * @var array|null
	 */
	private static $cached = null;

	/**
	 * Public API. Returns the normalised shape documented above.
	 *
	 * @return array{active_plugin:string,current_language:string,default_language:string,all_languages:array}
	 */
	public static function detect() {
		if ( is_array( self::$cached ) ) {
			return self::$cached;
		}
		$result = array(
			'active_plugin'    => '',
			'current_language' => '',
			'default_language' => '',
			'all_languages'    => array(),
		);

		// WPML first — most common and most disruptive.
		if ( self::is_wpml_active() ) {
			$result = self::read_wpml();
		} elseif ( self::is_polylang_active() ) {
			$result = self::read_polylang();
		} elseif ( self::is_translatepress_active() ) {
			$result = self::read_translatepress();
		} elseif ( self::is_gtranslate_active() ) {
			$result = self::read_gtranslate();
		}

		self::$cached = $result;
		return $result;
	}

	/**
	 * Short accessor for the extractor / save-selector paths. Returns a
	 * 2-letter code like "en" when multilingual, or '' when not. Never
	 * throws — returns '' on any detection hiccup so callers can key
	 * selectors without defensive coding.
	 *
	 * @return string
	 */
	public static function current_language_code() {
		$d = self::detect();
		return isset( $d['current_language'] ) ? (string) $d['current_language'] : '';
	}

	/**
	 * Has any multilingual plugin been detected?
	 *
	 * @return bool
	 */
	public static function is_multilingual() {
		$d = self::detect();
		return ! empty( $d['active_plugin'] );
	}

	// -----------------------------------------------------------------
	// WPML
	// -----------------------------------------------------------------
	private static function is_wpml_active() {
		// SitePress is the main WPML class; ICL_LANGUAGE_CODE is the
		// legacy signal. Either is sufficient.
		return class_exists( '\\SitePress' ) || defined( 'ICL_LANGUAGE_CODE' );
	}

	private static function read_wpml() {
		$current  = defined( 'ICL_LANGUAGE_CODE' ) ? (string) ICL_LANGUAGE_CODE : '';
		$default  = '';
		$all      = array();

		// WPML exposes settings via filters.
		$all_langs = apply_filters( 'wpml_active_languages', null, array() );
		if ( is_array( $all_langs ) ) {
			$all = array_keys( $all_langs );
		}
		$default = (string) apply_filters( 'wpml_default_language', '' );

		// Last-chance fallback — if nothing came back from filters but we
		// know WPML is active, at least fill current so C5b can still key.
		if ( $current === '' && $default !== '' ) {
			$current = $default;
		}

		return array(
			'active_plugin'    => self::PLUGIN_WPML,
			'current_language' => self::normalise_code( $current ),
			'default_language' => self::normalise_code( $default ),
			'all_languages'    => array_values( array_filter( array_map( array( __CLASS__, 'normalise_code' ), $all ) ) ),
		);
	}

	// -----------------------------------------------------------------
	// Polylang
	// -----------------------------------------------------------------
	private static function is_polylang_active() {
		return defined( 'POLYLANG_VERSION' ) || function_exists( 'pll_current_language' );
	}

	private static function read_polylang() {
		$current  = function_exists( 'pll_current_language' ) ? (string) pll_current_language( 'slug' ) : '';
		$default  = function_exists( 'pll_default_language' ) ? (string) pll_default_language( 'slug' ) : '';
		$all      = function_exists( 'pll_languages_list' ) ? (array) pll_languages_list() : array();
		return array(
			'active_plugin'    => self::PLUGIN_POLYLANG,
			'current_language' => self::normalise_code( $current ),
			'default_language' => self::normalise_code( $default ),
			'all_languages'    => array_values( array_filter( array_map( array( __CLASS__, 'normalise_code' ), $all ) ) ),
		);
	}

	// -----------------------------------------------------------------
	// TranslatePress
	// -----------------------------------------------------------------
	private static function is_translatepress_active() {
		return class_exists( '\\TRP_Translate_Press' ) || defined( 'TRP_PLUGIN_VERSION' );
	}

	private static function read_translatepress() {
		$current  = '';
		$default  = '';
		$all      = array();

		$settings = get_option( 'trp_settings', array() );
		if ( is_array( $settings ) ) {
			if ( isset( $settings['default-language'] ) ) {
				$default = (string) $settings['default-language'];
			}
			if ( isset( $settings['translation-languages'] ) && is_array( $settings['translation-languages'] ) ) {
				$all = $settings['translation-languages'];
			}
		}

		// TranslatePress sets ?trp-edit-translation=... or uses path-based
		// routing. Honour the explicit query param first, then fall back
		// to the default. get_locale() isn't reliable because TranslatePress
		// doesn't change WP_LOCALE.
		if ( isset( $_GET['lang'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$current = (string) $_GET['lang'];
		} elseif ( $default !== '' ) {
			$current = $default;
		}

		return array(
			'active_plugin'    => self::PLUGIN_TRANSLATEPRESS,
			'current_language' => self::normalise_code( $current ),
			'default_language' => self::normalise_code( $default ),
			'all_languages'    => array_values( array_filter( array_map( array( __CLASS__, 'normalise_code' ), $all ) ) ),
		);
	}

	// -----------------------------------------------------------------
	// GTranslate
	// -----------------------------------------------------------------
	private static function is_gtranslate_active() {
		// GTranslate ships a function named `gtranslate` and stores its
		// settings under the `GTranslate` option. It's a JS-only translator
		// so PHP detection is coarse — we only care that it exists so we
		// key selectors by the site's default locale.
		return function_exists( 'gtranslate' ) || get_option( 'GTranslate' ) !== false;
	}

	private static function read_gtranslate() {
		$settings = get_option( 'GTranslate', array() );
		$default  = '';
		$all      = array();
		if ( is_array( $settings ) ) {
			if ( isset( $settings['default_language'] ) ) {
				$default = (string) $settings['default_language'];
			}
			// GTranslate option schema: `incl_langs` (array) is the list
			// of languages actually exposed in the site switcher. The free
			// plugin also writes `language_codes` which is a comma-separated
			// superset — we prefer the explicit list. Older installs used
			// `languages`, keep that as last-ditch fallback.
			if ( isset( $settings['incl_langs'] ) && is_array( $settings['incl_langs'] ) ) {
				$all = array_values( $settings['incl_langs'] );
			} elseif ( isset( $settings['languages'] ) ) {
				$raw = $settings['languages'];
				if ( is_string( $raw ) ) {
					$all = array_map( 'trim', explode( ',', $raw ) );
				} elseif ( is_array( $raw ) ) {
					$all = array_values( $raw );
				}
			}
		}
		// GTranslate stores the current language in a cookie (`googtrans`)
		// and a query arg (`?lang=xx`). Prefer the explicit query arg.
		$current = '';
		if ( isset( $_GET['lang'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$current = (string) $_GET['lang'];
		} elseif ( isset( $_COOKIE['googtrans'] ) ) {
			// Format: /en/fr — the second segment is the target.
			$parts = array_values( array_filter( explode( '/', (string) $_COOKIE['googtrans'] ) ) );
			if ( count( $parts ) >= 2 ) {
				$current = $parts[1];
			}
		}
		if ( $current === '' && $default !== '' ) {
			$current = $default;
		}
		return array(
			'active_plugin'    => self::PLUGIN_GTRANSLATE,
			'current_language' => self::normalise_code( $current ),
			'default_language' => self::normalise_code( $default ),
			'all_languages'    => array_values( array_filter( array_map( array( __CLASS__, 'normalise_code' ), $all ) ) ),
		);
	}

	/**
	 * Normalise a raw language code for storage. We store lower-case
	 * 2-letter ISO codes where possible. WPML returns "en" already;
	 * Polylang returns slugs like "en" or "pt-br"; TranslatePress
	 * returns locales like "en_US" — we chop to the prefix.
	 *
	 * @param string|mixed $code
	 * @return string
	 */
	public static function normalise_code( $code ) {
		$code = strtolower( trim( (string) $code ) );
		if ( $code === '' ) { return ''; }
		// "en_US" / "en-US" → "en"; preserve "pt-br" as "pt-br" (Polylang
		// genuinely uses these as distinct slugs). Heuristic: if the part
		// after the separator is a 2-letter locale suffix we chop, else
		// we keep the hyphenated slug.
		if ( preg_match( '/^([a-z]{2,3})[_-]([a-z]{2,3})$/', $code, $m ) ) {
			// Keep slug form when Polylang-ish (e.g. pt-br, zh-hans)
			if ( strpos( $code, '-' ) !== false ) {
				return $code;
			}
			// Locale form en_US → en
			return $m[1];
		}
		return $code;
	}
}
