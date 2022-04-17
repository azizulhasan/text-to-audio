<?php
namespace WPSpeech;
/**
 * Define the internationalization functionality
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    WP_Speech
 * @subpackage WP_Speech/includes
 */

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @since      1.0.0
 * @package    WP_Speech
 * @subpackage WP_Speech/includes
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class WP_Speech_i18n {


	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since    1.0.0
	 */
	public function load_plugin_textdomain() {

		load_plugin_textdomain(
			'wp-speech',
			false,
			dirname( dirname( plugin_basename( __FILE__ ) ) ) . '/languages/'
		);

	}



}
