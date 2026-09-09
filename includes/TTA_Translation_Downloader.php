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

		if ( self::is_locale_installed( $locale ) ) {
			return true;
		}

		$languages_dir = self::get_target_dir();
		if ( ! $languages_dir ) {
			return false;
		}

		if ( ! self::is_locale_available( $locale ) ) {
			return false;
		}

		// Get file list from GitHub API.
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

		return $success;
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
	 * The legacy plugin-relative path is still accepted so sites that downloaded
	 * before packs moved out of the plugin folder are not prompted again.
	 *
	 * @param string $locale
	 * @return bool
	 */
	public static function is_locale_installed( $locale ) {
		$installed = wp_get_installed_translations( 'plugins' );

		if ( isset( $installed[ TEXT_TO_AUDIO_TEXT_DOMAIN ][ $locale ] ) ) {
			return true;
		}

		return file_exists( TTA_PLUGIN_PATH . 'languages/text-to-audio-' . $locale . '.mo' );
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
