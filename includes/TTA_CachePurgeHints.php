<?php

namespace TTA;

/**
 * AtlasVoice Cache Purge Hints (TTS-238 C4a).
 *
 * After the user saves a new AtlasVoice selector (via the picker, via the
 * heal-log revert button, or via self-heal), an aggressive page cache can
 * hold the old extracted content in HTML snapshots for hours. Visitors then
 * hear stale audio until the cache naturally rolls over.
 *
 * This class is a pure detector — it never touches caches directly. It
 * returns structured advice so the dashboard can surface a toast like:
 *
 *   "You saved a new content selector. WP Rocket is active — purge its
 *    page cache so visitors hear the updated audio. [Open WP Rocket]"
 *
 * Kept intentionally small and stateless so it can be wired into any
 * write path that mutates a selector-ish setting without worrying about
 * side effects.
 */
class TTA_CachePurgeHints {

	/**
	 * Plugin file => display metadata for every page cache we know how to
	 * hint. "file" is the slug/<file>.php used by WordPress's plugin-active
	 * check. "settings_url_slug" is the admin page slug (suffixed onto
	 * admin.php or options-general.php) where the user would go to purge.
	 *
	 * The `hint_template` is i18n'd at call time — stored in English here
	 * so static analysis / POT extraction still picks it up as %s fodder.
	 *
	 * @var array
	 */
	private static $KNOWN_CACHES = array(
		'wp-rocket' => array(
			'file'          => 'wp-rocket/wp-rocket.php',
			'label'         => 'WP Rocket',
			'settings_slug' => 'wprocket',
		),
		'litespeed' => array(
			'file'          => 'litespeed-cache/litespeed-cache.php',
			'label'         => 'LiteSpeed Cache',
			'settings_slug' => 'litespeed-cache',
		),
		'w3tc' => array(
			'file'          => 'w3-total-cache/w3-total-cache.php',
			'label'         => 'W3 Total Cache',
			'settings_slug' => 'w3tc_dashboard',
		),
		'wp-super-cache' => array(
			'file'          => 'wp-super-cache/wp-cache.php',
			'label'         => 'WP Super Cache',
			'settings_slug' => 'wpsupercache',
		),
		'wp-optimize' => array(
			'file'          => 'wp-optimize/wp-optimize.php',
			'label'         => 'WP-Optimize',
			'settings_slug' => 'wpo_cache',
		),
		'autoptimize' => array(
			'file'          => 'autoptimize/autoptimize.php',
			'label'         => 'Autoptimize',
			'settings_slug' => 'autoptimize',
		),
		'sg-optimizer' => array(
			'file'          => 'sg-cachepress/sg-cachepress.php',
			'label'         => 'SiteGround Optimizer',
			'settings_slug' => 'sg-cachepress',
		),
		'breeze' => array(
			'file'          => 'breeze/breeze.php',
			'label'         => 'Breeze',
			'settings_slug' => 'breeze',
		),
		'cache-enabler' => array(
			'file'          => 'cache-enabler/cache-enabler.php',
			'label'         => 'Cache Enabler',
			'settings_slug' => 'cache-enabler',
		),
		'hummingbird' => array(
			'file'          => 'hummingbird-performance/wp-hummingbird.php',
			'label'         => 'Hummingbird',
			'settings_slug' => 'wphb-caching',
		),
	);

	/**
	 * Build a hint payload for the front-end. Returns an array shaped for
	 * direct inclusion in a REST response:
	 *
	 *   array(
	 *     'needs_purge'  => bool,             // true only if a cache is active
	 *     'detected'     => array( ['key','label','settings_url'], ... ),
	 *     'message'      => string,           // i18n'd user-facing sentence
	 *   )
	 *
	 * When no known cache is detected, returns needs_purge=false and an
	 * empty detected list — the client is expected to no-op quietly, so
	 * users without a cache plugin never see the hint.
	 *
	 * @return array
	 */
	public static function get_hint() {
		$detected = array();

		if ( ! function_exists( 'is_plugin_active' ) ) {
			include_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		foreach ( self::$KNOWN_CACHES as $key => $meta ) {
			if ( function_exists( 'is_plugin_active' ) && is_plugin_active( $meta['file'] ) ) {
				$detected[] = array(
					'key'          => $key,
					'label'        => $meta['label'],
					'settings_url' => self::build_settings_url( $meta['settings_slug'] ),
				);
			}
		}

		// Host-level page cache hints. We can't click these for the user
		// but we can still name them in the toast so they know where to
		// look. Treated as needs_purge=true even though detected stays
		// empty — UX still helpful.
		$host_hints = self::detect_host_cache();

		if ( empty( $detected ) && empty( $host_hints ) ) {
			return array(
				'needs_purge' => false,
				'detected'    => array(),
				'host_hints'  => array(),
				'message'     => '',
			);
		}

		$labels = array();
		foreach ( $detected as $d ) { $labels[] = $d['label']; }
		foreach ( $host_hints as $h ) { $labels[] = $h; }

		$joined = implode( ', ', $labels );
		/* translators: %s: list of detected cache plugins / hosts. */
		$msg = sprintf(
			__( 'Selector saved. %s is active — purge its page cache so visitors hear the updated audio immediately.', 'text-to-audio' ),
			$joined
		);

		return array(
			'needs_purge' => true,
			'detected'    => $detected,
			'host_hints'  => $host_hints,
			'message'     => $msg,
		);
	}

	/**
	 * Map a settings slug to a best-effort admin URL. We don't crack open
	 * each plugin's internals — the slug is passed to admin.php?page= which
	 * works for the vast majority of WP plugin settings screens.
	 */
	private static function build_settings_url( $slug ) {
		if ( empty( $slug ) || ! function_exists( 'admin_url' ) ) {
			return '';
		}
		return admin_url( 'admin.php?page=' . $slug );
	}

	/**
	 * Best-effort detection of host-level page caches (Cloudflare, Kinsta,
	 * WP Engine, Pantheon, SiteGround server-side). These aren't plugins
	 * so is_plugin_active() doesn't catch them — we sniff env / headers.
	 *
	 * Intentionally conservative: only returns when we're very sure.
	 *
	 * @return array List of display labels.
	 */
	private static function detect_host_cache() {
		$hints = array();

		// Kinsta
		if ( defined( 'KINSTA_CACHE_ZONE' ) || ! empty( $_SERVER['HTTP_X_KINSTA_CACHE'] ) ) {
			$hints[] = 'Kinsta';
		}
		// WP Engine
		if ( function_exists( 'is_wpe' ) || defined( 'WPE_APIKEY' ) ) {
			$hints[] = 'WP Engine';
		}
		// Pantheon
		if ( defined( 'PANTHEON_ENVIRONMENT' ) ) {
			$hints[] = 'Pantheon';
		}
		// Cloudflare (header-based — only present when CF is in front).
		// Note: just a soft hint; we don't promise CF cache is enabled.
		if ( ! empty( $_SERVER['HTTP_CF_RAY'] ) ) {
			$hints[] = 'Cloudflare';
		}

		return $hints;
	}
}
