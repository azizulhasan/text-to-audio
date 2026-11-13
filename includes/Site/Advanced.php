<?php
/**
 * The advanced switches of the plugin, and clearing its cache.
 *
 * @package TTA
 */

namespace TTA\Site;

use TTA\Settings\Settings_Store;
use TTA\TTA_Cache;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves the advanced settings.
 *
 * Nothing new is stored. Each switch is a field of `tta_settings_data`
 * that the classic Settings screen already saves, in the same format, so
 * both screens can be used on the same site. fields() is the one list of
 * them: the REST route, `wp atlasvoice advanced` and the checks are built
 * from it.
 *
 * The admin screen (REST), WP-CLI and an MCP server all act here (TTS-376).
 */
class Advanced {

	const OPTION = 'tta_settings_data';

	/**
	 * Every switch.
	 *
	 * The default of a switch is what the plugin does when the site never
	 * saved it, so the screen shows what really happens.
	 *
	 * @return array<string, array{stored:string, default:bool, description:string}>
	 */
	public static function fields() {
		return array(
			'mode_bar'            => array(
				'stored'      => 'tta__settings_show_mode_bar',
				'default'     => true,
				'description' => __( 'Show in the WordPress toolbar whether AtlasVoice is in staging or live.', 'text-to-audio' ),
			),
			'post_toggle'         => array(
				'stored'      => 'tta__settings_show_admin_bar_toggle',
				'default'     => false,
				'description' => __( 'Add a control to the WordPress toolbar, on the front end, that turns the player on or off for the post being viewed.', 'text-to-audio' ),
			),
			'picker'              => array(
				'stored'      => 'tta__settings_enable_steprail',
				'default'     => false,
				'description' => __( 'Show the on-page content picker to administrators on the front end, to choose what is read aloud right on the page.', 'text-to-audio' ),
			),
			'dashboard_widget'    => array(
				'stored'      => 'tta__settings_show_dashboard_widget',
				'default'     => true,
				'description' => __( 'Show the AtlasVoice quick stats widget on the WordPress dashboard.', 'text-to-audio' ),
			),
			'keep_reading'        => array(
				'stored'      => 'tta__settings_stop_auto_pause_after_switching_tab',
				'default'     => true,
				'description' => __( 'Browser voice: keep reading when the listener switches to another browser tab.', 'text-to-audio' ),
			),
			'no_auto_play'        => array(
				'stored'      => 'tta__settings_stop_auto_playing_after_switching_tab',
				'default'     => true,
				'description' => __( 'Browser voice: do not start reading by itself when the listener comes back to the tab.', 'text-to-audio' ),
			),
			'delete_on_uninstall' => array(
				'stored'      => 'tta__settings_delete_data_on_uninstall',
				'default'     => false,
				'description' => __( 'Delete all AtlasVoice data (settings, statistics and audio files) when the plugin is deleted. It cannot be undone.', 'text-to-audio' ),
			),
		);
	}

	/**
	 * The settings.
	 *
	 * @return array<string, bool>
	 */
	public static function get() {
		$stored = get_option( self::OPTION, array() );
		$stored = is_object( $stored ) ? get_object_vars( $stored ) : ( is_array( $stored ) ? $stored : array() );
		$values = array();

		foreach ( self::fields() as $name => $field ) {
			$values[ $name ] = array_key_exists( $field['stored'], $stored ) ? ! empty( $stored[ $field['stored'] ] ) : $field['default'];
		}

		return $values;
	}

	/**
	 * Saves the switches that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of the names of fields(), each on or off.
	 *
	 * @return array|\WP_Error The settings after the save, or why nothing was saved.
	 */
	public static function save( array $fields ) {
		$all   = self::fields();
		$clean = array();

		// Unknown names are an error, so a typing mistake in a script is noticed.
		foreach ( $fields as $name => $value ) {
			if ( ! is_string( $name ) || ! isset( $all[ $name ] ) ) {
				return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}

			$flag = self::to_bool( $value );
			if ( null === $flag ) {
				return self::invalid( $name, __( 'This must be on or off.', 'text-to-audio' ) );
			}
			$clean[ $all[ $name ]['stored'] ] = $flag;
		}

		if ( ! $clean ) {
			return new \WP_Error(
				'atlasvoice_nothing_to_save',
				__( 'Nothing to save.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$settings = Settings_Store::prepare( self::OPTION, (object) $clean );
		if ( is_wp_error( $settings ) ) {
			return $settings;
		}

		update_option( self::OPTION, $settings );
		TTA_Cache::delete( 'all_settings' );

		return self::get();
	}

	/**
	 * Clears what AtlasVoice keeps cached (settings, lists of categories and
	 * content types). No setting, statistic or audio file is removed; the
	 * cache is filled again as pages are viewed.
	 *
	 * @return array{cleared:bool}
	 */
	public static function clear_cache() {
		TTA_Cache::flush();

		// flush() removes the cached values from the database. WordPress also
		// keeps them in its object cache, and on a site with Redis or Memcached
		// they live only there, so those two groups are emptied as well.
		if ( function_exists( 'wp_cache_supports' ) && wp_cache_supports( 'flush_group' ) ) {
			wp_cache_flush_group( 'transient' );
			wp_cache_flush_group( 'options' );
		}

		return array( 'cleared' => true );
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
			'atlasvoice_invalid_advanced_setting',
			$message,
			array(
				'status' => 400,
				'field'  => sanitize_key( $field ),
			)
		);
	}
}
