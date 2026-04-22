<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice lazy picker-bundle loader (TTS-238 v5 §5.8 / D8).
 *
 * The Visual Content Picker (src/picker/tts-picker.js → admin/js/build/
 * tts-picker.min.js) is a ~30 KB gzipped bundle that pulls in a full
 * SelectorGadget-style overlay, the step-rail modal shell, and the
 * diff-preview viewer. Eagerly enqueuing it on every admin page (and
 * every front-end singular view) would bloat the payload for the 99%
 * of requests that never open the picker.
 *
 * D8 replaces the eager enqueue with a **lazy loader** shaped around
 * three requirements:
 *
 *   1. Zero cost on pages that don't open the picker — we only
 *      `wp_register_script` the bundle (cheap: just a URL/version
 *      entry in the WP_Scripts registry) and emit a tiny inline stub
 *      that knows how to inject the <script> tag on demand.
 *
 *   2. Cached after first call — repeated `ttsLoadPicker()` calls in
 *      the same document return the same Promise, so the step rail
 *      (D9), per-post meta-box "Pick…" button, and bulk-generate
 *      "Verify across posts" action (D14) can all call it without
 *      duplicate network requests.
 *
 *   3. Framework-agnostic glue — returns a native Promise (no
 *      jQuery), dispatches a `atlasvoice:picker-loaded` DOM event
 *      for legacy listeners, and exposes a `ttsPickerReady` boolean
 *      for inline conditionals. Consumers that predate Promise
 *      support (IE11) fall back to the event path.
 *
 * Scope control (`should_emit`) keeps the stub off pages that can't
 * plausibly launch the picker. In the admin we emit on:
 *   - `post` / `post-new` screens (per-post override Pick… button),
 *   - the AtlasVoice dashboard screen (`toplevel_page_text-to-audio`
 *     and friends).
 * On the front-end we emit on singular views only — the player
 * button lives inside the post content, and the step rail is only
 * reachable from the admin bar when `Mode::is_opted_in()` is true.
 *
 * Pro can bypass this loader entirely by filtering
 * `atlasvoice_skip_picker_loader` to true (e.g. when Pro bundles
 * its own picker asset).
 */
class PickerLoader {

	/** WP_Scripts handle for the lazy-registered bundle. */
	const HANDLE = 'tts-picker';

	/** WP_Scripts handle for the inline loader glue (no src). */
	const LOADER_HANDLE = 'tts-picker-loader';

	/** Guard so we only compute `should_emit` once per request. */
	private static $emitted = false;

	/**
	 * Wire up registration + stub emission. Idempotent via
	 * Bootstrap::register()'s static flag.
	 *
	 * @return void
	 */
	public static function register() {
		// Pro-bypass hook. Lets premium plugins replace us wholesale
		// without having to deregister individual hooks.
		if ( (bool) apply_filters( 'atlasvoice_skip_picker_loader', false ) ) {
			return;
		}

		// Register (NOT enqueue) the bundle early so `wp_script_is(
		// 'tts-picker', 'registered' )` is true by the time the stub
		// runs. Priority 5 means we beat any consumer that might
		// try to enqueue us directly.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'register_script' ), 5 );
		add_action( 'wp_enqueue_scripts',    array( __CLASS__, 'register_script' ), 5 );

		// Emit the inline `window.ttsLoadPicker` glue on pages where
		// the picker is plausibly reachable. Priority 11 puts us
		// right after the main dashboard enqueues (priority 10) so
		// the stub is available before dashboard bootstraps.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'emit_stub' ), 11 );
		add_action( 'wp_enqueue_scripts',    array( __CLASS__, 'emit_stub' ), 11 );
	}

	/**
	 * Register the picker bundle with WP_Scripts but do NOT enqueue
	 * it. Registration is cheap and lets consumers that still want
	 * the synchronous path call `wp_enqueue_script( 'tts-picker' )`.
	 *
	 * @return void
	 */
	public static function register_script() {
		$url = self::picker_url();
		if ( $url === '' ) { return; }
		// `wp_register_script` is a no-op on repeat calls, so the
		// belt-and-braces `wp_script_is` check is mostly here for
		// readability.
		if ( ! wp_script_is( self::HANDLE, 'registered' ) ) {
			wp_register_script( self::HANDLE, $url, array(), self::version(), true );
		}
	}

	/**
	 * Emit the inline loader stub on pages where the picker could
	 * be invoked. Guarded by `should_emit` + a per-request flag so
	 * two hooks firing (admin + front-end in weird contexts) don't
	 * duplicate the stub.
	 *
	 * @return void
	 */
	public static function emit_stub() {
		if ( self::$emitted ) { return; }
		if ( ! self::should_emit() ) { return; }

		$url = self::picker_url();
		if ( $url === '' ) { return; }

		self::$emitted = true;

		// Empty-src handle carries the inline script. Registering a
		// throwaway handle keeps us inside the normal WP_Scripts
		// lifecycle (footer printing, dependency graph, etc.) rather
		// than emitting a raw <script> tag via wp_print_footer_scripts.
		if ( ! wp_script_is( self::LOADER_HANDLE, 'registered' ) ) {
			wp_register_script( self::LOADER_HANDLE, '', array(), self::version(), true );
		}
		wp_add_inline_script( self::LOADER_HANDLE, self::build_stub( $url ), 'after' );
		wp_enqueue_script( self::LOADER_HANDLE );
	}

	/**
	 * Build the inline JS stub. Keeps the closure tiny — about 1 KB
	 * before minification. The stub:
	 *
	 *   - Returns the same Promise on repeat calls (`cachedPromise`),
	 *     so `ttsLoadPicker().then(a); ttsLoadPicker().then(b)` fire
	 *     both callbacks against one network hit.
	 *   - Resolves with `window.AtlasVoiceSelector` once the bundle
	 *     declares itself ready (checked on the script's `onload`
	 *     handler). Rejects if the script fails to load so callers
	 *     can surface a toast.
	 *   - Sets `window.ttsPickerReady = true` and fires a
	 *     `atlasvoice:picker-loaded` CustomEvent when the bundle is
	 *     usable — gives non-promise consumers a hook.
	 *
	 * @param string $url Fully-resolved URL to the picker bundle.
	 * @return string JS source, ready to pass to wp_add_inline_script.
	 */
	protected static function build_stub( $url ) {
		$url_js     = wp_json_encode( $url );
		$handle_js  = wp_json_encode( self::HANDLE );
		$version_js = wp_json_encode( self::version() );

		// Using a function expression so we don't pollute the global
		// scope beyond `window.ttsLoadPicker` + `window.ttsPickerReady`.
		// `firedReady` dedupes the `atlasvoice:picker-loaded` event so
		// consumers that call `ttsLoadPicker()` multiple times (meta-box
		// Pick… button + step rail bootstrap + verify-across-posts) get
		// one authoritative ready event per document lifecycle.
		return "(function(w,d){"
			. "if(w.ttsLoadPicker){return;}"
			. "w.ttsPickerReady=!!w.AtlasVoiceSelector;"
			. "var cachedPromise=null;"
			. "var firedReady=false;"
			. "var pickerUrl=" . $url_js . ";"
			. "var pickerVersion=" . $version_js . ";"
			. "var handle=" . $handle_js . ";"
			. "function ready(){"
				. "w.ttsPickerReady=true;"
				. "if(!firedReady){"
					. "firedReady=true;"
					. "try{w.dispatchEvent(new CustomEvent('atlasvoice:picker-loaded',{detail:{handle:handle,version:pickerVersion}}));}catch(e){}"
				. "}"
				. "return w.AtlasVoiceSelector||null;"
			. "}"
			. "w.ttsLoadPicker=function(){"
				. "if(w.AtlasVoiceSelector){return Promise.resolve(ready());}"
				. "if(cachedPromise){return cachedPromise;}"
				. "cachedPromise=new Promise(function(resolve,reject){"
					. "var s=d.createElement('script');"
					. "s.src=pickerUrl+(pickerUrl.indexOf('?')>=0?'&':'?')+'ver='+encodeURIComponent(pickerVersion);"
					. "s.async=true;"
					. "s.setAttribute('data-handle',handle);"
					. "s.onload=function(){"
						. "if(w.AtlasVoiceSelector){resolve(ready());}"
						. "else{cachedPromise=null;reject(new Error('AtlasVoiceSelector missing after load'));}"
					. "};"
					. "s.onerror=function(){cachedPromise=null;reject(new Error('Failed to load picker bundle'));};"
					. "(d.head||d.body||d.documentElement).appendChild(s);"
				. "});"
				. "return cachedPromise;"
			. "};"
			. "if(w.ttsPickerReady){ready();}"
			. "})(window,document);";
	}

	/**
	 * Resolved URL to the picker bundle. Returns empty string if
	 * constants aren't defined (uninstall flow, very early hooks).
	 *
	 * Filterable via `atlasvoice_picker_bundle_url` so Pro can swap
	 * in its own asset path without re-registering the whole loader.
	 *
	 * @return string
	 */
	protected static function picker_url() {
		if ( ! defined( 'TTA_PLUGIN_URL' ) ) { return ''; }
		$url = TTA_PLUGIN_URL . 'admin/js/build/tts-picker.min.js';
		return (string) apply_filters( 'atlasvoice_picker_bundle_url', $url );
	}

	/**
	 * Script version string for cache-busting. Matches the main
	 * plugin version so a release bumps both in lockstep.
	 *
	 * @return string
	 */
	protected static function version() {
		return defined( 'TEXT_TO_AUDIO_VERSION' ) ? (string) TEXT_TO_AUDIO_VERSION : '1.0.0';
	}

	/**
	 * Decide whether to emit the loader stub on the current request.
	 *
	 * Split by context:
	 *   - Admin: `post` / `post-new` screens (per-post override
	 *     meta-box) + any AtlasVoice dashboard screen.
	 *   - Front-end: singular views only (the player + step rail
	 *     both depend on a resolvable post context).
	 *
	 * The final decision runs through `atlasvoice_emit_picker_stub`
	 * so site owners / Pro can force-enable or force-disable per
	 * page without having to unhook us entirely.
	 *
	 * @return bool
	 */
	protected static function should_emit() {
		$emit = is_admin() ? self::emit_on_admin() : self::emit_on_front();
		return (bool) apply_filters( 'atlasvoice_emit_picker_stub', $emit );
	}

	/**
	 * Admin-side emission rule. Returns false during AJAX / REST /
	 * cron requests since those never render a document that could
	 * host the picker overlay.
	 *
	 * @return bool
	 */
	protected static function emit_on_admin() {
		if ( wp_doing_ajax() ) { return false; }
		if ( defined( 'DOING_CRON' ) && DOING_CRON ) { return false; }
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) { return false; }

		if ( ! function_exists( 'get_current_screen' ) ) { return false; }
		$screen = get_current_screen();
		if ( ! $screen instanceof \WP_Screen ) { return false; }

		// Post editor screens (classic + block) expose the per-post
		// rule meta-box, which will get a Pick… button in D10.
		if ( $screen->base === 'post' ) { return true; }

		// AtlasVoice dashboard pages: `toplevel_page_text-to-audio`,
		// `text-to-audio_page_*` subpages, and the Bulk MP3 screen.
		$id = (string) $screen->id;
		if ( strpos( $id, 'text-to-audio' ) !== false ) { return true; }

		return false;
	}

	/**
	 * Front-end emission rule. We only need the picker shim when a
	 * visitor could plausibly trigger the step rail — gated by the
	 * AtlasVoice opt-in plus `is_singular()`.
	 *
	 * @return bool
	 */
	protected static function emit_on_front() {
		if ( ! function_exists( 'is_singular' ) || ! is_singular() ) { return false; }
		if ( class_exists( '\\TTA\\AtlasVoice\\Mode' ) && ! Mode::is_opted_in() ) {
			// When AtlasVoice is opted out, the step rail / picker can
			// never be reached from the front-end, so skip the stub
			// entirely to shave bytes off the public HTML.
			return false;
		}
		return true;
	}
}
