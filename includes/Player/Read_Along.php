<?php
/**
 * Read-along settings: highlighting while reading, and listening to a selection.
 *
 * @package TTA
 */

namespace TTA\Player;

use TTA\TTA_Cache;

defined( 'ABSPATH' ) || exit;

/**
 * The one place that reads, checks and stores the read-along settings.
 *
 * The admin screen, the REST routes (classic and new) and
 * `wp atlasvoice read-along` all call this class (TTS-376).
 *
 * Nothing stored changes: the option is still `tta_highlight_settings`, an
 * array with the same ten keys and value formats the classic screen saved.
 */
class Read_Along {

	const OPTION = 'tta_highlight_settings';

	const MODES     = array( 'sentence', 'word', 'word_sentence' );
	const ANNOUNCES = array( 'tip', 'badge', 'both', 'off' );

	/**
	 * How visible the faded text may stay. Below 0.1 it is unreadable; above
	 * 0.85 nothing looks faded.
	 */
	const DIM_MIN = 0.1;
	const DIM_MAX = 0.85;

	/**
	 * The values a new install starts with (the same as TTA_Activator).
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			'tta__highlight_enabled'        => false,
			'tta__highlight_mode'           => 'sentence',
			'tta__highlight_word_bg'        => '#a5abf0',
			'tta__highlight_word_color'     => '#202124',
			'tta__highlight_sentence_bg'    => '#e8e7fe',
			'tta__highlight_dim_enabled'    => true,
			'tta__highlight_dim_opacity'    => 0.7,
			'tta__highlight_autoscroll'     => true,
			'tta__selection_listen_enabled' => false,
			'tta__selection_announce'       => 'tip',
		);
	}

	/**
	 * The saved settings, with a default for any key that is missing.
	 *
	 * @return array
	 */
	public static function get() {
		$stored = get_option( self::OPTION, array() );
		$stored = is_object( $stored ) ? get_object_vars( $stored ) : (array) $stored;

		return self::sanitize( array_replace( self::defaults(), array_intersect_key( $stored, self::defaults() ) ) );
	}

	/**
	 * Turns any input into valid settings. A value that is not allowed falls
	 * back to the default of its key; an unknown key is dropped.
	 *
	 * @param array $fields All ten keys.
	 *
	 * @return array
	 */
	public static function sanitize( array $fields ) {
		$defaults = self::defaults();
		$fields   = array_replace( $defaults, array_intersect_key( $fields, $defaults ) );
		$clean    = array();

		foreach ( array( 'tta__highlight_enabled', 'tta__highlight_dim_enabled', 'tta__highlight_autoscroll', 'tta__selection_listen_enabled' ) as $key ) {
			$clean[ $key ] = self::to_bool( $fields[ $key ] );
		}

		foreach ( array( 'tta__highlight_word_bg', 'tta__highlight_word_color', 'tta__highlight_sentence_bg' ) as $key ) {
			$color         = is_string( $fields[ $key ] ) ? sanitize_hex_color( $fields[ $key ] ) : '';
			$clean[ $key ] = $color ? $color : $defaults[ $key ];
		}

		$clean['tta__highlight_mode']     = in_array( $fields['tta__highlight_mode'], self::MODES, true ) ? $fields['tta__highlight_mode'] : $defaults['tta__highlight_mode'];
		$clean['tta__selection_announce'] = in_array( $fields['tta__selection_announce'], self::ANNOUNCES, true ) ? $fields['tta__selection_announce'] : $defaults['tta__selection_announce'];

		$opacity                             = is_numeric( $fields['tta__highlight_dim_opacity'] ) ? (float) $fields['tta__highlight_dim_opacity'] : $defaults['tta__highlight_dim_opacity'];
		$clean['tta__highlight_dim_opacity'] = max( self::DIM_MIN, min( self::DIM_MAX, $opacity ) );

		// The stored order of the keys, as the classic route wrote them.
		return array_replace( $defaults, $clean );
	}

	/**
	 * Says what is wrong with values before they are saved, for doors that
	 * should refuse a bad value instead of replacing it (WP-CLI). The classic
	 * route does not use it: it has always replaced a bad value by the default.
	 *
	 * @param array $fields Some or all of the ten keys.
	 *
	 * @return true|\WP_Error
	 */
	public static function validate( array $fields ) {
		$defaults = self::defaults();

		foreach ( $fields as $key => $value ) {
			if ( ! array_key_exists( $key, $defaults ) ) {
				/* translators: %s: name of a setting. */
				return new \WP_Error( 'atlasvoice_unknown_setting', sprintf( __( 'Unknown setting: %s', 'text-to-audio' ), $key ), array( 'status' => 400 ) );
			}

			$ok = true;
			if ( 'tta__highlight_mode' === $key ) {
				$ok = in_array( $value, self::MODES, true );
			} elseif ( 'tta__selection_announce' === $key ) {
				$ok = in_array( $value, self::ANNOUNCES, true );
			} elseif ( 'tta__highlight_dim_opacity' === $key ) {
				$ok = is_numeric( $value ) && (float) $value >= self::DIM_MIN && (float) $value <= self::DIM_MAX;
			} elseif ( is_string( $defaults[ $key ] ) ) {
				$ok = is_string( $value ) && (bool) sanitize_hex_color( $value );
			} elseif ( is_string( $value ) ) {
				$ok = in_array( strtolower( trim( $value ) ), array( '1', '0', 'true', 'false', 'on', 'off', 'yes', 'no' ), true );
			} else {
				$ok = is_bool( $value ) || 0 === $value || 1 === $value;
			}

			if ( ! $ok ) {
				return new \WP_Error(
					'atlasvoice_invalid_value',
					/* translators: %s: name of a setting. */
					sprintf( __( 'That value is not allowed for %s.', 'text-to-audio' ), $key ),
					array( 'status' => 400 )
				);
			}
		}//end foreach

		return true;
	}

	/**
	 * Saves the settings that were sent. A key that was not sent keeps its
	 * saved value, so a screen, a command or a tool can change one thing.
	 *
	 * @param array $fields Some or all of the ten keys.
	 *
	 * @return array The settings as stored.
	 */
	public static function save( array $fields ) {
		$clean = self::sanitize( array_replace( self::get(), $fields ) );

		update_option( self::OPTION, $clean, false );
		TTA_Cache::delete( 'all_settings' );

		return $clean;
	}

	/**
	 * Reads a switch that may arrive as a boolean, "1"/"0", or "true"/"false".
	 *
	 * @param mixed $value The value.
	 *
	 * @return bool
	 */
	private static function to_bool( $value ) {
		if ( is_string( $value ) ) {
			return ! in_array( strtolower( trim( $value ) ), array( '', '0', 'false', 'off', 'no' ), true );
		}

		return ! empty( $value );
	}
}
