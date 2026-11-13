<?php
/**
 * Loads the new AtlasVoice admin app (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Decides whether the new admin app is shown, and loads its files.
 *
 * The app is built from src/admin-app into build/admin-app with WordPress's
 * own React and components as dependencies, so nothing is bundled twice. The
 * classic dashboard and the new app read and write the same options; the
 * `tta_admin_ui` option only remembers which of the two is shown.
 */
class Admin_App {

	const HANDLE = 'atlasvoice-admin-app';

	/**
	 * The option that remembers which admin UI a site uses.
	 */
	const OPTION = 'tta_admin_ui';

	const UI_NEW     = 'new';
	const UI_CLASSIC = 'classic';

	/**
	 * What a site without a saved choice shows. It stays 'classic' while the
	 * new screens are being built, and becomes 'new' in the release that
	 * ships them, so no site meets a half-built screen.
	 */
	const DEFAULT_UI = self::UI_CLASSIC;

	/**
	 * Remembers the one-time welcome for sites that update: 'none' for a new
	 * install, 'seen' once it was closed. A site without the option was
	 * installed before the new screens existed, so its welcome is pending.
	 */
	const OPTION_WELCOME = 'tta_admin_ui_welcome';

	/**
	 * Whether this site shows the new app instead of the classic dashboard.
	 *
	 * The classic dashboard stays the default until the switch and the
	 * update-day welcome exist (TTS-374), so nobody meets a half-built screen.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// One-request way out: "&atlasvoice_ui=classic" shows the classic screens
		// without changing what is saved. It only picks a view of a page that
		// already requires manage_options, so no nonce is needed.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['atlasvoice_ui'] ) && self::UI_CLASSIC === sanitize_key( wp_unslash( $_GET['atlasvoice_ui'] ) ) ) {
			return false;
		}

		return self::UI_NEW === self::get_ui() && self::is_built() && self::pro_is_ready();
	}

	/**
	 * The admin UI this site has chosen, or the default when it never chose.
	 *
	 * @return string 'new' or 'classic'.
	 */
	public static function get_ui() {
		$ui = get_option( self::OPTION, self::DEFAULT_UI );

		/**
		 * Filters which admin UI is shown: 'new' or 'classic'.
		 *
		 * @param string $ui The stored choice.
		 */
		$ui = apply_filters( 'atlasvoice_admin_ui', $ui );

		return self::UI_NEW === $ui ? self::UI_NEW : self::UI_CLASSIC;
	}

	/**
	 * Saves which admin UI the site uses. Nothing else is touched: both UIs
	 * read and write the same settings, so switching is always safe.
	 *
	 * @param string $ui 'new' or 'classic'.
	 *
	 * @return bool False when the value is not one of the two words.
	 */
	public static function set_ui( $ui ) {
		if ( ! in_array( $ui, array( self::UI_NEW, self::UI_CLASSIC ), true ) ) {
			return false;
		}

		update_option( self::OPTION, $ui );

		return true;
	}

	/**
	 * Whether the active Pro plugin can show its screens in the new app.
	 *
	 * An older Pro mounts into the classic dashboard only, so with it the
	 * classic screens are kept: its settings must never become unreachable.
	 * Pro answers through the filter; a version number is not compared, so a
	 * renamed or patched Pro is judged by what it can do.
	 *
	 * @return bool
	 */
	public static function pro_is_ready() {
		if ( ! \TTA\TTA_Helper::is_atlasvoice_addon_functional() ) {
			return true;
		}

		/**
		 * Filters whether the active Pro plugin supports the new admin app.
		 *
		 * @param bool $ready False until Pro says it does.
		 */
		return (bool) apply_filters( 'atlasvoice_admin_app_pro_ready', false );
	}

	/**
	 * Whether the one-time welcome for updated sites is still to be shown.
	 *
	 * @return bool
	 */
	public static function welcome_pending() {
		return 'pending' === get_option( self::OPTION_WELCOME, 'pending' );
	}

	/**
	 * Records that the welcome was closed, so it is shown once per site.
	 */
	public static function mark_welcome_seen() {
		update_option( self::OPTION_WELCOME, 'seen', false );
	}

	/**
	 * Called on a first activation: a new install never used the old screens,
	 * so it gets no "what moved" welcome.
	 */
	public static function mark_new_install() {
		add_option( self::OPTION_WELCOME, 'none', '', false );
	}

	/**
	 * Whether the built app is present. A site must never get a blank screen
	 * because a build file is missing, so without it the classic UI is used.
	 *
	 * @return bool
	 */
	public static function is_built() {
		return is_readable( self::build_path( 'index.asset.php' ) ) && is_readable( self::build_path( 'index.js' ) );
	}

	/**
	 * The admin menu icon: the small one-colour "Voice A".
	 *
	 * WordPress recolours a menu icon by rewriting the `fill` of a base64 SVG,
	 * so the three strokes of the logo are drawn here as filled rounded bars
	 * in the same places (v3/logo/atlasvoice-mark-mono-small.svg).
	 *
	 * @return string A data URI for add_menu_page().
	 */
	public static function menu_icon() {
		$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">'
			. '<rect fill="black" x="-17" y="-17" width="192.4" height="34" rx="17" transform="translate(62 202) rotate(-65.38)"/>'
			. '<rect fill="black" x="-17" y="-17" width="192.4" height="34" rx="17" transform="translate(128 58) rotate(65.38)"/>'
			. '<rect fill="black" x="115" y="119" width="26" height="74" rx="13"/>'
			. '</svg>';

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- the format add_menu_page() documents for SVG icons.
		return 'data:image/svg+xml;base64,' . base64_encode( $svg );
	}

	/**
	 * Marks our screen on <body>, so the few rules the frame needs outside its
	 * own root (wp-admin's padding and footer) can never reach another screen.
	 *
	 * @param string $classes Space-separated body classes.
	 *
	 * @return string
	 */
	public static function body_class( $classes ) {
		return $classes . ' atlasvoice-app-page';
	}

	/**
	 * Prints the element the app mounts on.
	 *
	 * WordPress moves admin notices to just after `.wp-header-end`. Without it
	 * they are pushed in after the first heading, which would be inside the app.
	 */
	public static function render_root() {
		echo '<div class="atlasvoice-page"><hr class="wp-header-end"><div id="atlasvoice-app"></div></div>';
	}

	/**
	 * Enqueues the app's script, style, translations and boot data.
	 * Call it only on the AtlasVoice admin page.
	 */
	public static function enqueue() {
		add_filter( 'admin_body_class', array( __CLASS__, 'body_class' ) );

		$asset = require self::build_path( 'index.asset.php' );

		$script_deps = isset( $asset['dependencies'] ) ? (array) $asset['dependencies'] : array();
		$style_deps  = array( 'wp-components' );

		// WordPress 7.0+ has design tokens and ThemeProvider in wp-theme. On
		// older sites the fallbacks in the app's own stylesheet carry the look.
		if ( wp_script_is( 'wp-theme', 'registered' ) ) {
			$script_deps[] = 'wp-theme';
		}
		if ( wp_style_is( 'wp-theme', 'registered' ) ) {
			$style_deps[] = 'wp-theme';
		}

		// The version is a hash of the built file, so a new build is never served from cache.
		$version = isset( $asset['version'] ) ? $asset['version'] : TEXT_TO_AUDIO_VERSION;

		wp_enqueue_script( self::HANDLE, self::build_url( 'index.js' ), $script_deps, $version, true );
		wp_set_script_translations( self::HANDLE, 'text-to-audio' );

		// Data reaches the app through an inline script on our own handle only.
		wp_add_inline_script(
			self::HANDLE,
			'window.atlasvoiceBoot = ' . wp_json_encode( self::boot_data() ) . ';',
			'before'
		);

		if ( is_readable( self::build_path( 'index.css' ) ) ) {
			wp_enqueue_style( self::HANDLE, self::build_url( 'index.css' ), $style_deps, $version );
			wp_style_add_data( self::HANDLE, 'rtl', 'replace' );
		}
	}

	/**
	 * The data the app needs before its first request. No secret belongs here:
	 * everything in it is visible in the page source.
	 *
	 * @return array
	 */
	public static function boot_data() {
		$data = array(
			'version'       => TEXT_TO_AUDIO_VERSION,
			'restUrl'       => esc_url_raw( \TTA\TTA_Cache::get_rest_api_url() ),
			'restNonce'     => wp_create_nonce( 'wp_rest' ),
			'logoUrl'       => esc_url_raw( plugins_url( 'admin/images/brand/atlasvoice-icon.svg', TEXT_TO_AUDIO_ROOT_FILE ) ),
			'classicUrl'    => esc_url_raw( admin_url( 'admin.php?page=text-to-audio&atlasvoice_ui=classic' ) ),
			// Whether Pro's screens exist on this site. It decides what is shown,
			// never whether a feature of the free plugin works.
			'isPro'         => (bool) \TTA\TTA_Helper::is_atlasvoice_addon_functional(),
			'proVersion'    => defined( 'TTA_PRO_VERSION' ) ? (string) TTA_PRO_VERSION : '',
			'mode'          => \TTA\AtlasVoice\Mode::get(),
			'setupFinished' => (bool) get_option( 'tta_onboarding_completed' ),
			'helpTopics'    => \TTA\Help\Help_Topics::all(),
			'docsUrl'       => \TTA\Help\Help_Topics::DOCS_BASE,
			'supportUrl'    => 'https://atlasaidev.com/contact-us/',
			'showWelcome'   => self::welcome_pending(),
		);

		/**
		 * Filters the data printed for the admin app. Pro adds its own keys here.
		 *
		 * @param array $data Boot data. Never add a key, token or password.
		 */
		return (array) apply_filters( 'atlasvoice_admin_app_boot_data', $data );
	}

	/**
	 * Absolute path of a file in the built app.
	 *
	 * @param string $file File name inside build/admin-app.
	 *
	 * @return string
	 */
	private static function build_path( $file ) {
		return plugin_dir_path( TEXT_TO_AUDIO_ROOT_FILE ) . 'build/admin-app/' . $file;
	}

	/**
	 * URL of a file in the built app.
	 *
	 * @param string $file File name inside build/admin-app.
	 *
	 * @return string
	 */
	private static function build_url( $file ) {
		return plugins_url( 'build/admin-app/' . $file, TEXT_TO_AUDIO_ROOT_FILE );
	}
}
