<?php
/**
 * Merge-on-save for the settings options.
 *
 * @package TTA
 */

namespace TTA\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Prepares a settings payload so that saving it can never wipe a stored field.
 *
 * TTS-370: every settings route used to replace the whole option with the
 * request body. A screen that sends only its own fields (a tab of the new
 * admin, the setup wizard, an older or newer Pro) then deleted the rest.
 * Routes now pass the payload through prepare() and save what it returns.
 *
 * Nothing stored changes: the option keeps the type of the payload (object or
 * array), exactly as a plain replace did, and a full payload gives the same
 * stored value as before.
 */
class Settings_Store {

	/**
	 * Builds the value to store for a map-type option: the stored value with
	 * the sent fields on top.
	 *
	 * Only the top level is merged. A nested value (a list of post types, the
	 * button settings object) is replaced whole, because the sender owns it.
	 *
	 * @param string       $option   Option name, e.g. 'tta_customize_settings'.
	 * @param object|array $incoming Decoded request payload.
	 *
	 * @return object|array|\WP_Error The value to pass to update_option().
	 */
	public static function prepare( $option, $incoming ) {
		if ( ! is_object( $incoming ) && ! is_array( $incoming ) ) {
			// A payload that is not valid JSON used to be stored as null,
			// which emptied the whole option.
			return new \WP_Error(
				'atlasvoice_invalid_settings',
				__( 'The settings could not be read. Nothing was saved.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$stored   = get_option( $option, array() );
		$incoming = self::sanitize( $incoming );
		$value    = self::merge( $stored, $incoming );

		/**
		 * Filters a settings value just before it is stored.
		 *
		 * @param object|array $value    The merged value that will be stored.
		 * @param string       $option   Option name.
		 * @param object|array $incoming The sanitised fields that were sent.
		 * @param mixed        $stored   The value stored before this save.
		 */
		return apply_filters( 'atlasvoice_settings_before_save', $value, $option, $incoming, $stored );
	}

	/**
	 * Puts the sent fields on top of the stored ones (top level only).
	 *
	 * The result has the type of $incoming, which is what a plain replace
	 * stored, so readers see the same shape as before.
	 *
	 * @param mixed        $stored   Stored option value (object, array or anything else).
	 * @param object|array $incoming Fields that were sent.
	 *
	 * @return object|array
	 */
	public static function merge( $stored, $incoming ) {
		$as_object = is_object( $incoming );
		$base      = self::to_map( $stored );
		$sent      = self::to_map( $incoming );

		// array_replace, not array_merge: numeric keys must not be renumbered.
		$merged = array_replace( $base, $sent );

		return $as_object ? (object) $merged : $merged;
	}

	/**
	 * Removes markup the current user is not allowed to save.
	 *
	 * Users who may save unfiltered HTML (administrators on a single site,
	 * super admins on a network) are not touched, so their values are stored
	 * byte for byte as before. For everyone else a string is filtered only
	 * when it contains "<": a value without it cannot open a tag, and CSS
	 * selectors such as "article > p" must stay as typed.
	 *
	 * @param mixed $value Any decoded JSON value.
	 *
	 * @return mixed
	 */
	public static function sanitize( $value ) {
		if ( current_user_can( 'unfiltered_html' ) ) {
			return $value;
		}

		return self::strip_unsafe_markup( $value );
	}

	/**
	 * Walks a decoded JSON value and filters its strings.
	 *
	 * @param mixed $value Any decoded JSON value.
	 *
	 * @return mixed
	 */
	private static function strip_unsafe_markup( $value ) {
		if ( is_string( $value ) ) {
			return false === strpos( $value, '<' ) ? $value : wp_kses_post( $value );
		}

		if ( is_array( $value ) ) {
			foreach ( $value as $key => $item ) {
				$value[ $key ] = self::strip_unsafe_markup( $item );
			}

			return $value;
		}

		if ( is_object( $value ) ) {
			// Work on a copy so the caller's object is not changed.
			$copy = clone $value;
			foreach ( get_object_vars( $copy ) as $key => $item ) {
				$copy->{$key} = self::strip_unsafe_markup( $item );
			}

			return $copy;
		}

		return $value;
	}

	/**
	 * Reads the top level of a stored or sent value as an array.
	 *
	 * @param mixed $value Object, array or anything else.
	 *
	 * @return array
	 */
	private static function to_map( $value ) {
		if ( is_object( $value ) ) {
			return get_object_vars( $value );
		}

		return is_array( $value ) ? $value : array();
	}
}
