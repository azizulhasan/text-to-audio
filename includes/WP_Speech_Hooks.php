<?php
namespace WPSpeech;

/**
 * Fired during plugin activation
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    WP_Speech
 * @subpackage WP_Speech/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    WP_Speech
 * @subpackage WP_Speech/includes
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class WP_Speech_Hooks
{

    public function __construct()
    {
        add_action('add_meta_boxes', array($this, 'add_custom_meta_box'));
    }
    /**
     * Short Description. (use period)
     *
     * Long Description.
     *
     * @since    1.0.0
     */
    public static function activate()
    {

    }
    /**
     * Register MetaBox to add PDF Download Button
     */
    public function add_custom_meta_box()
    {

        $meta_box_arr = [
            "post",
            "product",
            "page",
        ];
        $settings = (array) get_option('wps_settings_data');
        $settings['wps__settings_allow_recording_for_post_type'] = isset($settings['wps__settings_allow_recording_for_post_type']) ? $settings['wps__settings_allow_recording_for_post_type'] : ['all'];
        if (isset($settings['wps__settings_allow_recording_for_post_type'])
            && in_array(get_current_screen()->post_type, $settings['wps__settings_allow_recording_for_post_type'])
            || (in_array('all', $settings['wps__settings_allow_recording_for_post_type'])
                && in_array(get_current_screen()->post_type, $meta_box_arr))) {
            add_meta_box(
                'wps22-meta-box',
                'Text To Audio',
                array(
                    $this,
                    'wps_meta_box',
                ),
                get_current_screen()->post_type,
                'side',
                'high',
                null
            );
        }

    }

    /**
     * Add meta box for record, re-record, listen content with loud.
     */
    public function wps_meta_box()
    {

        $listening = (array) get_option('wps_listening_settings');
        $listening = json_encode($listening);
        $customize = (array) get_option('wps_customize_settings');

        // Button style.
        if (isset($customize) && count($customize)) {
            $btn_style = 'background-color:' . $customize['backgroundColor'] . ';color:' . $customize['color'] . ';border:0;';
        }
        ?>
        <div class="wps_metabox">

            <button type="button" id="wps__start__record"  style='<?php echo esc_attr($btn_style); ?>;cursor: pointer' onclick="startRecording()"><span class="dashicons dashicons-controls-volumeoff"></span>Start</button>
            <button type="button" id="wps__listen_content" style='<?php echo esc_attr($btn_style); ?>;cursor: pointer' onclick='listenCotentInDashboard("wps__listen_content","", <?php echo esc_js($listening); ?> )'><span class="dashicons dashicons-controls-play"></span> Play</button>
            <!-- Shortcode text -->
            <input
                type="text"
                name="wps_play_btn_shortcode"
                id="wps_play_btn_shortcode"
                value="[wps_listen_btn]"
                title="Short code"
            />

            <!-- Copy Button -->
            <button type="button" style='<?php echo esc_attr($btn_style); ?>;cursor: copy;margin-top:10px;padding:6px;' onclick="copyshortcode()">
            <span class="dashicons dashicons-admin-page"></span>
            </button>

            <script>
            /**
             * Copy short Code
             */
            function copyshortcode () {
                /* Get the text field */
                var copyText = document.getElementById("wps_play_btn_shortcode");

                /* Copy the text inside the text field */
                navigator.clipboard.writeText(copyText.value);

                /* Alert the copied text */
                alert("Copied the text: " + copyText.value);
            };
            </script>
        </div>

        <?php
}

}
new WP_Speech_Hooks();