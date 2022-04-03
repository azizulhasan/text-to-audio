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
            'wpa-meta-box',
            'Accessories',
            array(
                $this,
                'wpa_meta_box',
            ),
            'post',
            'side',
            'high',
            null
        );
    }


    /**
     * Add meta box for record, re-record, listen content with loud.
     */
    public function wpa_meta_box() {
        global $post;
 
        ?>
        <div class="wpa_metabox">
        <a type="button" id="wpa__start__record" onclick="startRecording()" href="#">Start</a>
        <a type="button" id="wpa__listent_content" onclick="listenCotentInDashboard()" href="#">Listen</a>
            
    </div>

        <?php
    }

}
new Webappick_Tracker_Hooks();