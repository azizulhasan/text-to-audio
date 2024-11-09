<?php
namespace TTA;

/**
 * settings,
 * mp3 files
 * player_id,
 * is_pro_active,
 *  plugins_data,
 *  post_types,
 * should load button
 *
 */
class TTA_Cache {
	/**
	 * Get Cached Data
	 *
	 * @param string $key Cache Name
	 *
	 * @return mixed|false  false if cache not found.
	 * @since 3.3.10
	 */
	public static function get( $key, $prefix = '__atlas_voice_cache_' ) {
		if ( empty( $key ) ) {
			return false;
		}

		return get_transient( $prefix . $key );
	}

	/**
	 * Set Cached Data
	 *
	 * @param string $key Cache name. Expected to not be SQL-escaped. Must be
	 *                             172 characters or fewer.
	 * @param mixed $data Data to cache. Must be serializable if non-scalar.
	 *                             Expected to not be SQL-escaped.
	 * @param int|bool $expiration Optional. Time until expiration in seconds. Default 0 (no expiration).
	 *
	 * @return bool
	 */
	public static function set( $key, $data, $expiration = false, $prefix = '__atlas_voice_cache_' ) {
		if ( empty( $key ) ) {
			return false;
		}

		if ( false === $expiration ) {
			// TODO: this dynamic.
//			$expiration = get_option( 'atlas_voice_settings', array( 'cache_ttl' => 6 * HOUR_IN_SECONDS ) );
//			$expiration =  6 * HOUR_IN_SECONDS;
		}

		return set_transient( $prefix . $key, $data, $expiration );
	}

	public static function delete( $key, $prefix = '__atlas_voice_cache_' ) {
		if ( empty( $key ) ) {
			return false;
		}

		return delete_transient( $prefix . $key );

	}

	/**
	 * Delete All Cached Data
	 *
	 * @return bool
	 */
	public static function flush() {
		global $wpdb;

		return $wpdb->query( "DELETE FROM $wpdb->options WHERE ({$wpdb->options}.option_name LIKE '_transient_timeout___atlas_voice_cache_%') OR ({$wpdb->options}.option_name LIKE '_transient___atlas_voice_cache_%')" ); // phpcs:ignore
	}

	/**
	 * @param $identifier
	 * @param $post_id
	 *
	 * @return mixed|null
	 */
	public static function settings( $identifier = '', $post_id = '' ) {
		$all_settings_keys = [
			'listening'  => 'tta_listening_settings',
			'settings'   => 'tta_settings_data',
			'recording'  => 'tta_record_settings',
			'customize'  => 'tta_customize_settings',
			'analytics'  => 'tta_analytics_settings',
			'compatible' => 'tta_compatible_data',
			'aliases'    => 'tts_text_aliases',
		];
		$cached_settings   = self::get( 'atlas_voice_all_settings' );
		if ( ! $cached_settings ) {
			$all_settings_data = self::set_tts_transient( $all_settings_keys );
		} else {

			foreach ( $all_settings_keys as $identifier_key => $settings_key ) {
				if ( ! isset( $cached_settings[ $identifier_key ] ) ) {
					$cached_settings = self::set_tts_transient( $all_settings_keys );
					break;
				}
			}

			$all_settings_data = $cached_settings;
		}

		if ( $post_id ) {
			$post_css_selectors = get_post_meta( $post_id, 'tts_pro_custom_css_selectors' );
			if ( isset( $post_css_selectors[0] ) ) {
				$post_css_selectors = json_decode( json_encode( $post_css_selectors[0] ), true );
			}


			if ( ! empty( $post_css_selectors ) && isset( $post_css_selectors['tta__settings_use_own_css_selectors'] ) && $post_css_selectors['tta__settings_use_own_css_selectors'] ) {

				if ( TTA_Helper::check_all_properties_are_empty( $post_css_selectors ) ) {

					$settings                                                   = $all_settings_data['settings'];
					$settings['tta__settings_css_selectors']                    = $post_css_selectors['tta__settings_css_selectors'];
					$settings['tta__settings_exclude_content_by_css_selectors'] = $post_css_selectors['tta__settings_exclude_content_by_css_selectors'];
					$settings['tta__settings_exclude_texts']                    = $post_css_selectors['tta__settings_exclude_texts'];
					$settings['tta__settings_exclude_tags']                     = $post_css_selectors['tta__settings_exclude_tags'];

					$all_settings_data['settings'] = $settings;
				}
			}

		}


		if ( $identifier ) {
			$specified_identifier_data = isset( $all_settings_data[ $identifier ] ) ? $all_settings_data[ $identifier ] : $all_settings_data;
			$all_settings_data         = $specified_identifier_data;
		}


		global $post;

		return \apply_filters( 'atlas_voice_get_settings', $all_settings_data, $post );
	}

	private static function set_tts_transient( $all_settings_keys ) {
		$all_settings_data = [];
		foreach ( $all_settings_keys as $identifier => $settings_key ) {
			$settings                         = get_option( $settings_key );
			$settings                         = ! $settings ? false : (array) $settings;
			$all_settings_data[ $identifier ] = $settings;
		}

		self::set( 'atlas_voice_all_settings', $all_settings_data );

		return $all_settings_data;
	}
}
