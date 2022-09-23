<?php
namespace TTA;

/**
 * Fired during plugin activation
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    TTA
 * @subpackage TTA/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/includes
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class TTA_Hooks {

    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_custom_meta_box'));
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

        $meta_box_arr = [
            "post",
            "product",
            "page",
        ];
        $settings = (array) get_option('tta_settings_data');
        $settings['tta__settings_allow_recording_for_post_type'] = isset($settings['tta__settings_allow_recording_for_post_type']) ? $settings['tta__settings_allow_recording_for_post_type'] : ['all'];
        if (isset($settings['tta__settings_allow_recording_for_post_type'])
            && in_array(get_current_screen()->post_type, $settings['tta__settings_allow_recording_for_post_type'])
            || (in_array('all', $settings['tta__settings_allow_recording_for_post_type'])
                && in_array(get_current_screen()->post_type, $meta_box_arr))) {
            add_meta_box(
                'wps22-meta-box',
                'Text To Audio',
                array(
                    $this,
                    'tta_meta_box',
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
    public function tta_meta_box() {

        $listening = (array) get_option('tta_listening_settings');
        $listening = json_encode($listening);
        $customize = (array) get_option('tta_customize_settings');

        // Button style.
        if (isset($customize) && count($customize)) {
            $btn_style = 'background-color:#184c53;color:#fff;border:0;';
        }
        $short_code = '[tta_listen_btn]';
        if (isset($customize['tta_play_btn_shortcode']) && '' != $customize['tta_play_btn_shortcode']) {
            $short_code = $customize['tta_play_btn_shortcode'];
        }
        ?>
        <div class="tta_metabox">

            <button type="button" id="tta__start__record"  style='<?php echo esc_attr($btn_style); ?>;cursor: pointer' onclick="ttaStartRecording()"><span class="dashicons dashicons-controls-volumeoff"></span>Start</button>
            <button type="button" id="tta__listen_content" style='<?php echo esc_attr($btn_style); ?>;cursor: pointer' onclick='ttaListenCotentInDashboard("tta__listen_content","", <?php echo esc_js($listening); ?> )'><span class="dashicons dashicons-controls-play"></span> Play</button>
            <!-- Shortcode text -->
            <input
                type="text"
                name="tta_play_btn_shortcode"
                id="tta_play_btn_shortcode"
                value="<?php echo esc_attr($short_code) ?>"
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
                var copyText = document.getElementById("tta_play_btn_shortcode");

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
new TTA_Hooks();