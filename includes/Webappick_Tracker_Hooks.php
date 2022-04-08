<?php
namespace WebappickTracker;
/**
 * Fired during plugin activation
 *
 * @link       https://webappick.com
 * @since      1.0.0
 *
 * @package    Webappick_Tracker
 * @subpackage Webappick_Tracker/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    Webappick_Tracker
 * @subpackage Webappick_Tracker/includes
 * @author     WebAppick <shoroar@webappick.com>
 */
class Webappick_Tracker_Hooks {


    public function __construct(){
        add_action('add_meta_boxes', array( $this, 'add_custom_meta_box' ));
    }
	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function activate() {

	}
        /**
     * Register MetaBox to add PDF Download Button
     */
    public function add_custom_meta_box() {
        

        add_meta_box(
            'wps22-meta-box',
            'WP Speech',
            array(
                $this,
                'wpa_meta_box',
            ),
            get_current_screen()->post_type,
            'side',
            'high',
            null
        );
        


    }


    /**
     * Add meta box for record, re-record, listen content with loud.
     */
    public function wpa_meta_box() {
 
        ?>
        <div class="wpa_metabox">
        <button type="button" id="wpa__start__record" onclick="startRecording()">Start</button>
        <button type="button" id="wpa__listent_content" onclick="listenCotentInDashboard()"><span class="dashicons dashicons-controls-play"></span> Play</button>

            
    </div>

        <?php
    }

}
new Webappick_Tracker_Hooks();