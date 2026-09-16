<?php

namespace TTA;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-266: file handling shared by every player that stores MP3s on the site.
 *
 * One reuse surface instead of private copies: Free's audio panel (delete and
 * upload) uses it, and Pro's MP3 players call the same methods rather than
 * shipping their own. Nothing here is player- or plan-specific.
 */
class TTA_Audio_Storage {

	/**
	 * Strip anything that could escape the audio directory. Titles arrive from
	 * visitor-callable routes, so they are never trusted as a path.
	 *
	 * Note it also strips dots: pass a base name and append the extension after.
	 *
	 * @param string $name
	 * @return string
	 */
	public static function safe_name( $name ) {
		$name = \str_replace( ' ', '_', (string) $name );
		$name = \preg_replace( '/[^\p{L}\p{N}_\-]/u', '', $name );

		return \substr( (string) $name, 0, 200 );
	}

	/**
	 * The date folder a caller sends, e.g. "2026/07". Digits and slashes only, so
	 * no traversal is possible.
	 *
	 * @param string $path
	 * @return string
	 */
	public static function safe_date_path( $path ) {
		$path = \preg_replace( '#[^0-9/]#', '', (string) $path );
		$path = \trim( (string) $path, '/' );

		return \substr( $path, 0, 20 );
	}

	/**
	 * Initialise WP_Filesystem once and hand back the instance. The require is
	 * idempotent and also defines FS_CHMOD_FILE.
	 *
	 * @return \WP_Filesystem_Base|false
	 */
	public static function filesystem() {
		global $wp_filesystem;

		if ( ! $wp_filesystem ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			\WP_Filesystem();
		}

		return $wp_filesystem ? $wp_filesystem : false;
	}

	/**
	 * Write through WP_Filesystem (Plugin Check forbids the raw calls), creating
	 * the directory on demand rather than on every page load.
	 *
	 * @param string $file
	 * @param string $contents
	 * @return bool
	 */
	public static function put_contents( $file, $contents ) {
		$fs = self::filesystem();

		if ( ! $fs ) {
			return false;
		}

		$dir = \dirname( $file );

		if ( ! \is_dir( $dir ) && ! \wp_mkdir_p( $dir ) ) {
			return false;
		}

		// FS_CHMOD_FILE is only defined once wp-admin/includes/file.php has been
		// loaded, so never reference it bare.
		$mode = \defined( 'FS_CHMOD_FILE' ) ? FS_CHMOD_FILE : 0644;

		return (bool) $fs->put_contents( $file, $contents, $mode );
	}

	/**
	 * Concatenate `{title}-{n}.mp3` into `{title}.mp3` and drop the parts.
	 *
	 * Byte concatenation works because MP3 frames are self-contained, which is
	 * also why the VBR header is rebuilt downstream for word timing (TTS-256).
	 *
	 * @param string $dir     Directory holding the parts, trailing slash.
	 * @param string $dir_url Matching URL, trailing slash.
	 * @param string $title   Final file name without extension.
	 * @return string|false Public URL of the merged file, or false.
	 */
	public static function merge_batches( $dir, $dir_url, $title ) {
		$fs = self::filesystem();

		if ( ! $fs ) {
			return false;
		}

		$parts = \glob( $dir . $title . '-*.mp3' );

		if ( empty( $parts ) ) {
			return false;
		}

		// natsort so -2 sorts before -10; a plain sort would reorder the audio.
		\natsort( $parts );

		$combined = '';
		foreach ( $parts as $part ) {
			$chunk = $fs->get_contents( $part );
			if ( false !== $chunk ) {
				$combined .= $chunk;
			}
		}

		if ( '' === $combined ) {
			return false;
		}

		if ( ! self::put_contents( $dir . $title . '.mp3', $combined ) ) {
			return false;
		}

		foreach ( $parts as $part ) {
			\wp_delete_file( $part );
		}

		return $dir_url . $title . '.mp3';
	}
}
