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
			$expiration = 24 * HOUR_IN_SECONDS;
		}

		return set_transient( $prefix . $key, $data, $expiration );
	}

	public static function delete( $key, $prefix = '__atlas_voice_cache_' ) {
		if ( empty( $key ) ) {
			return false;
		}

		if ( $key == self::get_key( 'tts_get_settings' ) ) {
			delete_transient( $prefix . self::get_key( 'get_player_id' ) );
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

	public static function get_key( $cache_key = 'all' ) {
		// key will be method name and value will be cache key,
		$cache_keys = [
//			'should_load_button' => 'should_load_button', // TODO:: when to update.
			'get_all_categories' => 'get_all_categories',
			'get_all_tags'       => 'get_all_tags',
//			'get_player_id'      => 'get_player_id', // TODO:: when to update.
			'is_pro_active'      => 'is_pro_active',
			'all_post_status'    => 'all_post_status',
			'tts_get_settings'   => 'all_settings',
			'get_post_types'     => 'get_post_types',
			'all_plugins'        => 'all_plugins',
		];

		if ( $cache_key == 'all' ) {
			return $cache_keys;
		}

		return $cache_keys[ $cache_key ] ?? '';
	}

	/**
	 * @param $identifier
	 * @param $post_id
	 *
	 * @return mixed|null
	 */
	private static function all_settings( $identifier = '', $post_id = '' ) {
		$all_settings_keys = [
			'listening'  => 'tta_listening_settings',
			'settings'   => 'tta_settings_data',
			'recording'  => 'tta_record_settings',
			'customize'  => 'tta_customize_settings',
			'analytics'  => 'tta_analytics_settings',
			'compatible' => 'tta_compatible_data',
			'aliases'    => 'tts_text_aliases',
		];
		$cached_settings   = self::get( 'all_settings' );
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

		return \apply_filters( 'atlas_voice_all_settings', $all_settings_data, $post_id, $post );
	}

	private static function set_tts_transient( $all_settings_keys ) {
		$all_settings_data = [];
		foreach ( $all_settings_keys as $identifier => $settings_key ) {
			$settings                         = get_option( $settings_key );
			$settings                         = ! $settings ? false : (array) $settings;
			$all_settings_data[ $identifier ] = $settings;
		}

		self::set( 'all_settings', $all_settings_data );

		return $all_settings_data;
	}

	/**
	 * @return mixed|void
	 */
	public static function all_plugins() {
		$all_plugins_cache_key = 'all_plugins';
		$cached_all_plugins    = self::get( $all_plugins_cache_key );
		if ( $cached_all_plugins ) {
			return $cached_all_plugins;
		}

		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$all_plugins = get_plugins();

		self::set( $all_plugins_cache_key, $all_plugins );

		return $all_plugins;
	}


	// Function to clear and reset the transient cache
	public static function update_cached_categories() {
		// Delete the transient
		$cache_key = self::get_key( 'get_all_categories' );
		self::delete( $cache_key );
		// Fetch categories and reset the transient
		TTA_Helper::get_all_categories();
	}

	// Function to clear and reset the transient cache for tags
	public static function update_cached_tags() {
		// Delete the transient
		$cache_key = self::get_key( 'get_all_tags' );
		self::delete( $cache_key );
		// Fetch tags and reset the transient
		TTA_Helper::get_all_tags();
	}

	// Static function to update cache for all post types
	public static function update_post_type_cache( $post_id ) {
		// Get the post type of the current post
		$post_type = get_post_type( $post_id );
		$cache_key = self::get_key( 'get_post_types' );
		self::delete( $cache_key );
		// Only proceed if the post type is valid
		TTA_Helper::get_post_types();

        TTA_Helper::delete_duplicate_post_ids_if_have( $post_id );
	}

	public static function update_transient_during_plugins_crud() {
		$cache_key = self::get_key( 'is_pro_active' );
		self::delete( $cache_key );

		$cache_key = self::get_key( 'all_plugins' );
		self::delete( $cache_key );
		self::delete( 'tts_rest_api_url' );

	}
}
