<?php

namespace TTA\Audio;

defined( 'ABSPATH' ) || exit;

/**
 * One request at a time may make (and pay for) a given batch.
 *
 * The post lock compares the visitor id the browser sends, so two requests
 * with the same id (two tabs, a blocked fingerprint) both made every batch.
 * A claim is one row in the options table: inserting a row whose name already
 * exists fails, so exactly one request wins — on every server sharing the
 * database. The others are told to wait and then reuse the finished batch.
 *
 * Built for Pro 3.4.17 (TTS-355); Pro's TTA_Pro\Audio\Part_Claim extends this.
 */
class Part_Claim {

	/** A claim older than this belongs to a request that died; it is taken over. */
	const TTL = 180;

	/** Option name prefix; the rest is a hash, so names stay short and safe. */
	const PREFIX = '_atlasvoice_claim_';

	/**
	 * Claim a batch for this request. Released automatically when the request ends.
	 *
	 * @param string $dir  Folder with a trailing slash.
	 * @param string $name Batch file name without extension.
	 * @return bool True when this request may make the batch.
	 */
	public static function acquire( $dir, $name ) {
		$option = self::option_name( $dir, $name );

		if ( ! self::insert( $option ) ) {
			if ( ! self::is_stale( $option ) ) {
				return false;
			}
			self::delete( $option );
			if ( ! self::insert( $option ) ) {
				return false;
			}
		}

		register_shutdown_function(
			static function () use ( $option ) {
				Part_Claim::release_option( $option );
			}
		);

		return true;
	}

	/**
	 * Let the next request make this batch (normally done at shutdown).
	 *
	 * @param string $dir  Folder with a trailing slash.
	 * @param string $name Batch file name without extension.
	 */
	public static function release( $dir, $name ) {
		self::delete( self::option_name( $dir, $name ) );
	}

	/**
	 * @param string $option Option name from option_name().
	 */
	public static function release_option( $option ) {
		self::delete( $option );
	}

	/**
	 * @param string $dir
	 * @param string $name
	 * @return string
	 */
	public static function option_name( $dir, $name ) {
		return self::PREFIX . md5( $dir . $name );
	}

	/**
	 * Atomic: the options table's unique name means only one insert succeeds.
	 *
	 * @param string $option
	 * @return bool
	 */
	private static function insert( $option ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- add_option() is not atomic; the claim must be.
		$rows = $wpdb->query(
			$wpdb->prepare(
				"INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')",
				$option,
				(string) time()
			)
		);

		return 1 === (int) $rows;
	}

	/**
	 * @param string $option
	 * @return bool
	 */
	private static function is_stale( $option ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- must read the row, not a cached copy.
		$since = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $option ) );

		return null !== $since && ( time() - (int) $since ) > self::TTL;
	}

	/**
	 * @param string $option
	 */
	private static function delete( $option ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- the row was written directly, so it is removed the same way.
		$wpdb->delete( $wpdb->options, array( 'option_name' => $option ), array( '%s' ) );
		wp_cache_delete( $option, 'options' );
	}
}
