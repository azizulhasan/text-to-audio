<?php
/**
 * The optional line "Voiced by AtlasVoice" under the player.
 *
 * @package TTA
 */

namespace TTA\Player;

use TTA\TTA_Helper;
use TTA_Admin\TTA_Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Reads, saves and prints the credit line.
 *
 * It is off until the site owner turns it on: a plugin may not put its name
 * on the public site without the owner's say (WordPress.org guideline 10),
 * and a site that updates sees no change. The line is plain text without a
 * link. The setting is one small option of its own
 * (`tta_player_credit_settings`); no other stored setting is touched.
 *
 * The line belongs to the free natural-voice player, so it is printed only
 * under that one: not under the device's own voice, and not under a player
 * an extension renders.
 *
 * The admin screen (REST), `wp atlasvoice credit` and an MCP server all act
 * here (TTS-376). The player markup asks add_to() for the line.
 */
class Credit {

	const OPTION = 'tta_player_credit_settings';

	/**
	 * The line.
	 *
	 * @return string
	 */
	public static function text() {
		return __( 'Voiced by AtlasVoice', 'text-to-audio' );
	}

	/**
	 * The setting, and whether visitors see the line right now.
	 *
	 * @return array{enabled:bool, text:string, available:bool, showing:bool}
	 */
	public static function get() {
		$stored = get_option( self::OPTION, array() );
		$stored = is_object( $stored ) ? get_object_vars( $stored ) : (array) $stored;

		$enabled   = ! empty( $stored['enabled'] );
		$available = ! TTA_Helper::is_pro_active();

		return array(
			'enabled'   => $enabled,
			'text'      => self::text(),
			// Whether this site can show it at all (no extension renders the player).
			'available' => $available,
			// Whether the voice in use now is the one the line belongs to.
			'showing'   => $enabled && $available && self::belongs_to( (int) \get_player_id() ),
		);
	}

	/**
	 * Saves the setting.
	 *
	 * @param array $fields enabled.
	 *
	 * @return array|\WP_Error The setting after the save, or why nothing was saved.
	 */
	public static function save( array $fields ) {
		$clean = self::validate( $fields );
		if ( is_wp_error( $clean ) ) {
			return $clean;
		}

		if ( ! $clean ) {
			return new \WP_Error(
				'atlasvoice_nothing_to_save',
				__( 'Nothing to save.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		update_option( self::OPTION, array( 'enabled' => $clean['enabled'] ) );

		return self::get();
	}

	/**
	 * Checks what was sent. Unknown names are an error, so a typing mistake
	 * in a script is noticed instead of silently ignored.
	 *
	 * @param array $fields What was sent.
	 *
	 * @return array|\WP_Error The clean values.
	 */
	public static function validate( array $fields ) {
		$clean = array();

		foreach ( $fields as $name => $value ) {
			if ( 'enabled' !== $name ) {
				return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}

			$flag = self::to_bool( $value );
			if ( null === $flag ) {
				return self::invalid( $name, __( 'This must be on or off.', 'text-to-audio' ) );
			}
			$clean[ $name ] = $flag;
		}

		return $clean;
	}

	/**
	 * Puts the line under the markup of a player, when the owner turned it on
	 * and the player is the free natural-voice one.
	 *
	 * @param string $player    The markup of one player.
	 * @param int    $player_id The voice that renders it.
	 *
	 * @return string The markup, with the line when it applies.
	 */
	public static function add_to( $player, $player_id ) {
		$stored = get_option( self::OPTION, array() );
		$stored = is_object( $stored ) ? get_object_vars( $stored ) : (array) $stored;

		if ( empty( $stored['enabled'] ) || '' === trim( (string) $player ) || ! self::belongs_to( (int) $player_id ) ) {
			return $player;
		}

		// A div and inline style only: the player markup is filtered to a short list of tags.
		return $player . '<div class="atlasvoice-player-credit" style="margin:4px 0;font-size:11px;line-height:1.4;opacity:.7;">' . esc_html( self::text() ) . '</div>';
	}

	/**
	 * Whether a voice is the free natural-voice player.
	 *
	 * @param int $player_id The voice.
	 *
	 * @return bool
	 */
	private static function belongs_to( $player_id ) {
		return class_exists( '\TTA_Admin\TTA_Admin' ) && TTA_Admin::renders_mp3_player( $player_id );
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
	 *
	 * @return \WP_Error
	 */
	private static function invalid( $field, $message ) {
		return new \WP_Error(
			'atlasvoice_invalid_credit',
			$message,
			array(
				'status' => 400,
				'field'  => sanitize_key( $field ),
			)
		);
	}
}
