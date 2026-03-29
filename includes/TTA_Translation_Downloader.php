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

		// Check if locale files already exist locally.
		$languages_dir = TTA_PLUGIN_PATH . 'languages/';
		$mo_file       = $languages_dir . 'text-to-audio-' . $locale . '.mo';
		if ( file_exists( $mo_file ) ) {
			return true;
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

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$written = file_put_contents( $local_path, $body );

		return false !== $written;
	}
}
