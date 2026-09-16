<?php

namespace TTA;

/**
 * Downloads translation files from GitHub based on WordPress locale.
 *
 * Instead of shipping all translation files in the plugin ZIP,
 * this class fetches only the needed locale from a remote repository
 * on plugin activation or when the site language changes.
 *
 * @since 2.2.0
 */
class TTA_Translation_Downloader {

	/**
	 * GitHub raw content base URL for the translations repo.
	 */
	const REPO_BASE_URL = 'https://raw.githubusercontent.com/azizulhasan/atlasaidev-translations/main/atlasvoice';

	/**
	 * GitHub API base URL for listing directory contents.
	 */
	const REPO_API_URL = 'https://api.github.com/repos/azizulhasan/atlasaidev-translations/contents/atlasvoice';

	/**
	 * Manifest describing what the translations repo currently offers.
	 *
	 * Served from raw.githubusercontent.com rather than the API: api.github.com
	 * is rate-limited to 60 requests/hour per IP unauthenticated, which a shared
	 * host would burn through instantly.
	 */
	const MANIFEST_URL = self::REPO_BASE_URL . '/manifest.json';

	/**
	 * Option holding the last fetched manifest (the `locales` map only).
	 */
	const MANIFEST_OPTION = 'tta_translation_manifest';

	/**
	 * Plugin version the manifest was last fetched for.
	 */
	const MANIFEST_VERSION_OPTION = 'tta_translation_manifest_version';

	/**
	 * Available locales with translations.
	 * Update this array when a new language is added to the GitHub repo.
	 *
	 * @var array
	 */
	const AVAILABLE_LOCALES = array(
		'es_ES',
		'it_IT',
		'pt_BR',
		'pt_PT',
		'de_DE',
		'fr_FR',
		'nl_NL',
		'ja',
		'pl_PL',
		'ru_RU',
		'tr_TR',
		'vi',
	);

	/**
	 * Download all translation files for a given locale.
	 *
	 * @param string $locale The WordPress locale (e.g., 'es_ES', 'it_IT').
	 *
	 * @return bool True on success, false on failure.
	 */
	public static function download_locale( $locale ) {
		if ( 'en_US' === $locale ) {
			return false;
		}

		if ( ! self::is_locale_available( $locale ) ) {
			return false;
		}

		// Always re-read the manifest before downloading. It is otherwise only
		// refreshed when the plugin version changes, so a site can hold a record
		// from an earlier publish — naming files the repo no longer has. Every
		// one of those 404s, and a single failure fails the whole download, so
		// the user is told "Failed to download" for a pack that is fine. The
		// click is already a network operation; one more request costs nothing.
		self::refresh_manifest();

		// Now that the record is current, a matching pack really is up to date.
		// A stale one must fall through and be re-fetched, or the "Update"
		// button would report success without changing anything.
		if ( 'current' === self::get_locale_status( $locale ) ) {
			return true;
		}

		$languages_dir = self::get_target_dir();
		if ( ! $languages_dir ) {
			return false;
		}

		$files = self::get_remote_file_list( $locale );
		if ( empty( $files ) ) {
			return false;
		}

		// Ensure languages directory exists.
		if ( ! is_dir( $languages_dir ) ) {
			wp_mkdir_p( $languages_dir );
		}

		$success = true;
		foreach ( $files as $filename ) {
			$remote_url = self::REPO_BASE_URL . '/' . $locale . '/' . $filename;
			$local_path = $languages_dir . $filename;

			$result = self::download_file( $remote_url, $local_path );
			if ( ! $result ) {
				$success = false;
			}
		}

		if ( $success ) {
			self::flush_translation_cache();
		}

		return $success;
	}

	/**
	 * Forget the cached listing of installed translation files.
	 *
	 * wp_get_installed_translations() is served from the `translation_files`
	 * cache group. Without this, a site running a persistent object cache would
	 * keep reporting the pack as missing or stale after a successful download,
	 * so the notice would not go away.
	 *
	 * Delegated to core's own invalidator rather than deleting the cache key
	 * ourselves, so the key derivation stays core's business.
	 */
	private static function flush_translation_cache() {
		global $wp_textdomain_registry;

		if ( ! $wp_textdomain_registry instanceof \WP_Textdomain_Registry ) {
			return;
		}

		$wp_textdomain_registry->invalidate_mo_files_cache(
			null,
			array(
				'type'         => 'translation',
				'translations' => array( array( 'type' => 'plugin' ) ),
			)
		);
	}

	/**
	 * Is a translation pack for this locale already on disk?
	 *
	 * Both the downloader and the admin notice need this answer, so it lives
	 * here rather than being spelled out twice with two chances to drift.
	 *
	 * Uses wp_get_installed_translations() rather than testing WP_LANG_DIR
	 * ourselves: it is core's own answer to "what is installed", it reads the
	 * canonical plugins language directory through the textdomain registry, and
	 * it is a plain read — unlike the filesystem abstraction, which would boot
	 * WP_Filesystem() and can emit a credentials form on FTP/SSH installs, which
	 * is unacceptable from inside an admin_notices callback.
	 *
	 * Note it only counts a .mo that has its .po beside it. Our published packs
	 * always ship both, so this holds; if that ever changes, this check has to
	 * change with it.
	 *
	 * There is deliberately no fallback to the plugin's own languages/ folder.
	 * Nothing lands there: the release ZIP ships only the .pot, and WordPress
	 * deletes the plugin directory on update — which is the whole reason packs
	 * moved out of it — so a pack downloaded there by an older version is
	 * already gone by the time this runs.
	 *
	 * @param string $locale
	 * @return bool
	 */
	public static function is_locale_installed( $locale ) {
		return 'missing' !== self::get_locale_status( $locale );
	}

	/**
	 * Fetch the manifest and remember what the repo currently offers.
	 *
	 * Called once per plugin version, never on a schedule and never on page
	 * load. A site that does not update does not receive new strings either, so
	 * its packs cannot silently fall behind.
	 *
	 * Failure is deliberately quiet: a GitHub outage must not block an update or
	 * nag the admin. The previously stored manifest simply stays in place.
	 *
	 * @return bool Whether a manifest was stored.
	 */
	public static function refresh_manifest() {
		$response = wp_remote_get( self::MANIFEST_URL, array(
			'timeout'   => 15,
			'sslverify' => true,
		) );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		// The locales map is an object keyed by locale. An older manifest used a
		// plain array of codes; that carries no revision data, so ignore it
		// rather than storing something get_locale_status() cannot read.
		if ( ! isset( $data['locales'] ) || ! is_array( $data['locales'] ) || isset( $data['locales'][0] ) ) {
			return false;
		}

		update_option( self::MANIFEST_OPTION, $data['locales'], false );

		return true;
	}

	/**
	 * Refresh the manifest once after the plugin version changes.
	 *
	 * Hooked on admin_init rather than upgrader_process_complete because that
	 * action does not fire for manual or FTP updates; comparing a stored version
	 * catches every route into a new version exactly once.
	 */
	public static function maybe_refresh_manifest() {
		// Also refetch when the stored manifest is gone but the version marker
		// survived — a data reset or a partial option wipe would otherwise leave
		// the site permanently unable to tell a stale pack from a current one.
		$have_manifest = ! empty( get_option( self::MANIFEST_OPTION, array() ) );

		if ( $have_manifest && get_option( self::MANIFEST_VERSION_OPTION ) === TEXT_TO_AUDIO_VERSION ) {
			return;
		}

		// Record the version only on success. Marking it regardless would turn a
		// single failed fetch — an outage, or the CDN still serving a manifest
		// from before the packs were published — into "never check again until
		// the next release".
		if ( self::refresh_manifest() ) {
			update_option( self::MANIFEST_VERSION_OPTION, TEXT_TO_AUDIO_VERSION, false );
		}
	}

	/**
	 * State of this site's translation pack for a locale.
	 *
	 * Compares the installed pack's PO-Revision-Date against the date the
	 * manifest records for that locale. Both sides come from a core method, so
	 * nothing here needs to know a file path — and because the date is stamped
	 * per locale at publish time, updating one language never makes the others
	 * look out of date.
	 *
	 * @param string $locale
	 * @return string 'unavailable' | 'missing' | 'stale' | 'current'
	 */
	public static function get_locale_status( $locale ) {
		if ( 'en_US' === $locale || ! self::is_locale_available( $locale ) ) {
			return 'unavailable';
		}

		$installed = wp_get_installed_translations( 'plugins' );
		$domain    = TEXT_TO_AUDIO_TEXT_DOMAIN;

		if ( ! isset( $installed[ $domain ][ $locale ] ) ) {
			return 'missing';
		}

		$manifest = get_option( self::MANIFEST_OPTION, array() );

		// Without a manifest we cannot prove the pack is behind, and guessing
		// would nag every site whose fetch failed. Treat it as good.
		if ( empty( $manifest[ $locale ]['updated'] ) ) {
			return 'current';
		}

		$revision = isset( $installed[ $domain ][ $locale ]['PO-Revision-Date'] )
			? $installed[ $domain ][ $locale ]['PO-Revision-Date']
			: '';

		// Behind the manifest means stale. Merely *different* does not: the
		// stored manifest is only refreshed when the plugin version changes, so
		// republishing within a version leaves sites holding an older record
		// than the pack they just downloaded. Strict equality called that stale
		// and the notice could never be cleared.
		$installed_at = strtotime( $revision );
		$published_at = strtotime( $manifest[ $locale ]['updated'] );

		// An unparseable installed date is the gettext "YEAR-MO-DA" placeholder
		// or a pack from before stamping — genuinely old, so offer the update.
		if ( false === $installed_at ) {
			return 'stale';
		}

		// An unreadable manifest date proves nothing; do not nag on a guess.
		if ( false === $published_at ) {
			return 'current';
		}

		return $installed_at < $published_at ? 'stale' : 'current';
	}

	/**
	 * Where downloaded packs are written.
	 *
	 * The languages folder inside the plugin is the wrong place: WordPress
	 * deletes the plugin directory on every update, so a pack downloaded there
	 * is silently thrown away each release and the site falls back to English
	 * until someone downloads it again.
	 *
	 * wp-content/languages/plugins/ survives updates, and WordPress looks there
	 * first anyway — before any path passed to wp_set_script_translations() —
	 * for both the .mo (WP_Textdomain_Registry::get_paths_for_domain()) and the
	 * hashed .json (_load_script_textdomain_from_src()). So nothing else has to
	 * change for the files to be found.
	 *
	 * The path is resolved through the filesystem abstraction rather than the
	 * WP_LANG_DIR constant, because on FTP/SSH-credentialed installs the write
	 * happens against a remote root and the literal constant would not resolve.
	 *
	 * @return string|false Trailing-slashed directory, or false if unavailable.
	 */
	private static function get_target_dir() {
		global $wp_filesystem;

		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if ( ! WP_Filesystem() ) {
			return false;
		}

		$lang_dir = $wp_filesystem->wp_lang_dir();
		if ( ! $lang_dir ) {
			return false;
		}

		return trailingslashit( $lang_dir ) . 'plugins/';
	}

	/**
	 * Check if a locale is available for download.
	 *
	 * Uses the hardcoded AVAILABLE_LOCALES array instead of making an API call.
	 *
	 * @param string $locale The locale to check.
	 *
	 * @return bool Whether the locale is available.
	 */
	public static function is_locale_available( $locale ) {
		return in_array( $locale, self::AVAILABLE_LOCALES, true );
	}

	/**
	 * Get the list of translation files for a locale from GitHub API.
	 *
	 * @param string $locale The locale to fetch files for.
	 *
	 * @return array List of filenames.
	 */
	private static function get_remote_file_list( $locale ) {
		// Prefer the manifest: it already lists every file in the pack, so the
		// common path costs no extra request at all.
		//
		// api.github.com allows 60 requests/hour per IP unauthenticated. Shared
		// hosts share one IP between many sites, so that budget is spent
		// collectively and downloads start failing with a 403 the site owner
		// can neither see nor fix. The API call below is now only a fallback
		// for a manifest published before file lists were recorded.
		$manifest = get_option( self::MANIFEST_OPTION, array() );

		if ( ! empty( $manifest[ $locale ]['files'] ) && is_array( $manifest[ $locale ]['files'] ) ) {
			return $manifest[ $locale ]['files'];
		}

		$api_url = self::REPO_API_URL . '/' . $locale;

		$response = wp_remote_get( $api_url, array(
			'timeout'   => 15,
			'sslverify' => true,
			'headers'   => array(
				'Accept' => 'application/vnd.github.v3+json',
			),
		) );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return array();
		}

		$items = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $items ) ) {
			return array();
		}

		$files = array();
		foreach ( $items as $item ) {
			if ( isset( $item['name'] ) && 'file' === $item['type'] ) {
				$files[] = $item['name'];
			}
		}

		return $files;
	}

	/**
	 * Download a single file from a remote URL to a local path.
	 *
	 * @param string $url        Remote file URL.
	 * @param string $local_path Local destination path.
	 *
	 * @return bool True on success, false on failure.
	 */
	private static function download_file( $url, $local_path ) {
		$response = wp_remote_get( $url, array(
			'timeout'   => 30,
			'sslverify' => true,
		) );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$body = wp_remote_retrieve_body( $response );
		if ( empty( $body ) ) {
			return false;
		}

		// TTS-247: use the WordPress filesystem API instead of file_put_contents()
		// so the write respects hosting filesystems that gate direct file ops
		// (FTP/SSH credentialed installs).
		global $wp_filesystem;

		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if ( ! WP_Filesystem() ) {
			return false;
		}

		return (bool) $wp_filesystem->put_contents( $local_path, $body, FS_CHMOD_FILE );
	}
}
