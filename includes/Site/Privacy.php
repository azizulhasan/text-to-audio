<?php
/**
 * What AtlasVoice keeps about visitors, and what it shares with AtlasAiDev.
 *
 * @package TTA
 */

namespace TTA\Site;

use TTA\TTA_Lib_AtlasAiDev;

defined( 'ABSPATH' ) || exit;

/**
 * The privacy facts of the site, and the one choice that can be changed
 * here: sharing anonymous usage data with AtlasAiDev.
 *
 * Nothing new is stored. The choice is the option the install-time notice
 * already writes (`text-to-audio_allow_tracking`), changed through the same
 * opt-in and opt-out code, so the weekly schedule follows it. Nothing is
 * ever sent without that choice being "yes" (wp.org guideline 7).
 *
 * The admin screen (REST), `wp atlasvoice privacy` and an MCP server all
 * act here (TTS-376).
 */
class Privacy {

	const ANALYTICS_TABLE = 'atlasvoice_analytics';

	/**
	 * The facts.
	 *
	 * @return array {
	 *     policy_url: string, export_url: string, erase_url: string,
	 *     listening_records: int,
	 *     usage_sharing: array{managed_here: bool, allowed: bool}
	 * }
	 */
	public static function get() {
		$tracker = self::tracker();

		return array(
			// WordPress' own guide holds the text AtlasVoice suggests for the privacy policy.
			'policy_url'        => admin_url( 'options-privacy.php?tab=policyguide' ),
			'export_url'        => admin_url( 'export-personal-data.php' ),
			'erase_url'         => admin_url( 'erase-personal-data.php' ),
			'listening_records' => self::listening_records(),
			'usage_sharing'     => array(
				// False with AtlasVoice Pro: Pro runs its own usage sharing, with its own choice.
				'managed_here' => null !== $tracker,
				'allowed'      => null !== $tracker && $tracker->is_tracking_allowed(),
			),
		);
	}

	/**
	 * Turns sharing anonymous usage data on or off.
	 *
	 * Turning it on sends the first report now and then weekly; turning it
	 * off stops the weekly report at once.
	 *
	 * @param array $fields Only: usage_sharing (on or off).
	 *
	 * @return array|\WP_Error The facts after the change, or why nothing changed.
	 */
	public static function save( array $fields ) {
		foreach ( array_keys( $fields ) as $name ) {
			if ( 'usage_sharing' !== $name ) {
				return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ), 400 );
			}
		}

		if ( ! array_key_exists( 'usage_sharing', $fields ) ) {
			return new \WP_Error(
				'atlasvoice_nothing_to_save',
				__( 'Nothing to save.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$allow = self::to_bool( $fields['usage_sharing'] );
		if ( null === $allow ) {
			return self::invalid( 'usage_sharing', __( 'This must be on or off.', 'text-to-audio' ), 400 );
		}

		$tracker = self::tracker();
		if ( null === $tracker ) {
			return self::invalid( 'usage_sharing', __( 'AtlasVoice Pro manages usage sharing on this site.', 'text-to-audio' ), 409 );
		}

		if ( $allow !== $tracker->is_tracking_allowed() ) {
			if ( $allow ) {
				$tracker->trackerOptIn();
			} else {
				$tracker->trackerOptOut();
			}
		}

		return self::get();
	}

	/**
	 * How many listening records the site holds (one per listener and post).
	 *
	 * @return int 0 when the table does not exist yet.
	 */
	private static function listening_records() {
		global $wpdb;

		$table = $wpdb->prefix . self::ANALYTICS_TABLE;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- a count of the plugin's own table, read once per screen load.
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $table ) ) ) !== $table ) {
			return 0;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- the table name is the prefix plus a constant.
		return (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" );
	}

	/**
	 * This plugin's usage sharing, when it runs on this site.
	 *
	 * @return TTA_Lib_AtlasAiDev|null Null when another plugin (Pro) runs its own.
	 */
	private static function tracker() {
		$tracker = TTA_Lib_AtlasAiDev::instance();

		return $tracker->is_tracking_managed_here() ? $tracker : null;
	}

	/**
	 * On or off, from the forms a script or a screen sends.
	 *
	 * @param mixed $value What was sent.
	 *
	 * @return bool|null Null when it is neither.
	 */
	private static function to_bool( $value ) {
		if ( is_bool( $value ) ) {
			return $value;
		}

		$text = is_scalar( $value ) ? strtolower( trim( (string) $value ) ) : '';

		if ( in_array( $text, array( '1', 'true', 'on', 'yes' ), true ) ) {
			return true;
		}

		return in_array( $text, array( '0', 'false', 'off', 'no' ), true ) ? false : null;
	}

	/**
	 * An error for one field.
	 *
	 * @param string $field   Field name.
	 * @param string $message What is wrong.
	 * @param int    $status  HTTP status.
	 *
	 * @return \WP_Error
	 */
	private static function invalid( $field, $message, $status ) {
		return new \WP_Error(
			'atlasvoice_invalid_privacy_setting',
			$message,
			array(
				'status' => $status,
				'field'  => sanitize_key( $field ),
			)
		);
	}
}
