<?php
namespace WebappickTracker;
/**
 * Define the internationalization functionality
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @link       https://webappick.com
 * @since      1.0.0
 *
 * @package    Webappick_Tracker
 * @subpackage Webappick_Tracker/includes
 */

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @since      1.0.0
 * @package    Webappick_Tracker
 * @subpackage Webappick_Tracker/includes
 * @author     WebAppick <shoroar@webappick.com>
 */
class Webappick_Tracker_i18n {


	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since    1.0.0
	 */
	public function load_plugin_textdomain() {

		load_plugin_textdomain(
			'webappick-tracker',
			false,
			dirname( dirname( plugin_basename( __FILE__ ) ) ) . '/languages/'
		);

	}



}
