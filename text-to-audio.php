<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              http://azizulhasan.com
 * @since             1.0.0
 * @package           TTA
 *
 * @wordpress-plugin
 * Plugin Name:       Text To Audio
 * Description:       Add functionality to WordPress site to read blogs out loud in more than 30 languages and write blogs by speech in more than 30 languages.
 * Version:           1.0.4
 * Author:            Azizul Hasan
 * Author URI:        http://azizulhasan.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       text-to-audio
 * Domain Path:       /languages
 */
include 'vendor/autoload.php';

use TTA\TTA;
use TTA\TTA_Activator;
use TTA\TTA_Deactivator;
use TTA_Api\TTA_Api_Routes;

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Absolute path to the WordPress directory.
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */

if (!defined('TEXT_TO_AUDIO_VERSION')) {

    define('TEXT_TO_AUDIO_VERSION', '1.0.4');
}

if (!defined('TEXT_TO_AUDIO_NONCE')) {

    define('TEXT_TO_AUDIO_NONCE', 'TEXT_TO_AUDIO_NONCE');
}

if (!defined('TEXT_TO_AUDIO_TEXT_DOMAIN')) {

    define('TEXT_TO_AUDIO_TEXT_DOMAIN', 'text-to-audio');
}

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */

class TTA_Init {

    public function __construct() {

        $this->run();

    }

    public function run() {
        $plugin = new TTA();
        $plugin->run();

        add_action('init', function () {
            global $current_user;
            new TTA_Api_Routes($current_user);
        });

    }

    /**
     * The code that runs during plugin activation.
     * This action is documented in includes/TTA_Activator.php
     */
    public function activate_tta() {
        TTA_Activator::activate();
    }

    /**
     * The code that runs during plugin deactivation.
     * This action is documented in includes/TTA_Deactivator.php
     */
    public function deactivate_tta() {
        TTA_Deactivator::deactivate();
    }
}

$TTA = new TTA_Init();

register_activation_hook(__FILE__, [$TTA, 'activate_tta']);
register_deactivation_hook(__FILE__, [$TTA, 'deactivate_tta']);

/**
 * If classic editor is active then on new-post and edit post
 * activate recording  for blog content.
 */
function tta_clean_content($text) {
    $quotationMarks = array(
        "'" => "\'",
        '"' => '\"',
        '&#8216;' => "\'",
        '&#8217;' => "\'",
        '&rsquo;' => "\'",
        '&lsquo;' => "\'",
        '&#8218;' => '',
        '&#8220;' => '\"',
        '&#8221;' => '\"',
        '&#8222;' => '\"',
        '&ldquo;' => '\"',
        '&rdquo;' => '\"',
        '&quot;' => '\"',
    );

    $otherMarks = array(
        '&auml;' => 'ä',
        '&Auml;' => 'Ä',
        '&ouml;' => 'ö',
        '&Ouml;' => 'Ö',
        '&uuml;' => 'ü',
        '&Uuml;' => 'Ü',
        '&szlig;' => 'ß',
        '&euro;' => '€',
        '&copy;' => '©',
        '&trade;' => '™',
        '&reg;' => '®',
        '&nbsp;' => '',
        '&mdash;' => '—',
        '&amp;' => '&',
        '&gt;' => 'greater than',
        '&lt;' => 'less than',
        '&#8211;' => '-',
        '&#8212;' => '—',
    );

    $text = strip_shortcodes($text);
    $text = wp_strip_all_tags($text, true);

    $text = str_replace(array_keys($quotationMarks), array_values($quotationMarks), $text);
    $text = str_replace(array_keys($otherMarks), array_values($otherMarks), $text);

    // CF 16-Oct-19: We want to make sure no quotes are over-escaped (if somebody writes \" it will get substituted as \\",
    // which will escape the slash instead of the quotation mark. We don't merge them in one regex because neither mark
    // can _always_ be substituted with the other without changing the meaning of the sentence for the TTS engine.
    // Note: backspaces need to be doubled. The first regex (\\\\{2,}") means: match two or more \ followed by "
    $text = preg_replace('/\\\\{2,}"/', '\"', $text);
    $text = preg_replace("/\\\\{2,}'/", "\'", $text);

    $text = preg_replace('/\s+/', ' ', trim($text)); // Get rid of /n and /s in the string.

    return $text;
}

/**
 *
 * Create short code for qr code.
 * Example [tta_listen_btn]
 * @param $atts
 * @return string
 */
function tta_create_shortcode($atts) {

    $listening = (array) get_option('tta_listening_settings');
    $listening = json_encode($listening);
    $customize = (array) get_option('tta_customize_settings');
    $settings = (array) get_option('tta_settings_data');
    $recording = (array) get_option('tta_record_settings');

    //Apply short code for only single page.
    if (isset($settings['tta__settings_display_btn_in_single_page']) && $settings['tta__settings_display_btn_in_single_page'] == 1 && !is_single()) {
        return;
    }

    static $btn_no = 0;
    $btn_no++;

    $sentence_delimiter = isset($recording['tta__sentence_delimiter']) ? $recording['tta__sentence_delimiter'] : '. ';
    $title = get_the_title() . $sentence_delimiter;

    $description = get_the_content();
    $description = apply_filters('tta__content_before_cleaning', $description);
    $description = tta_clean_content($description);
    $description = apply_filters('tta__content_after_cleaning', $description);
    $content = apply_filters('tta__content_title', $title);
    $content .= apply_filters('tta__content_description', $description);

    ?>
<?php
// Button start text.
    $btn_text = (isset($atts['btn_text'])) && strlen($atts['btn_text']) ? esc_html($atts['btn_text']) : "Listen";
    // Speak Icon
    $speakIcon = '<span class="dashicons dashicons-controls-play"></span> ' . $btn_text . '
    ';
    // Button style.
    if (isset($customize) && count($customize)) {
        $btn_style = 'background-color:' . esc_attr($customize['backgroundColor']) . ';color:' . esc_attr($customize['color']) . ';width:' . esc_attr($customize['width']) . '%;border:0;display:block;';
    } else {
        $btn_style = 'width:100%;border:0;display:block;';
    }
    //Custom Css
    $custom_css = '';
    if (isset($customize['custom_css']) && '' !== $customize['custom_css']) {
        $custom_css = esc_attr($customize['custom_css']);
    }

    // Custom class to button.
    $class = (isset($atts['class'])) && strlen($atts['class']) ? esc_attr($atts['class']) : "";

    // Listening button.
    $button = '<button id="tta__listent_content_' . $btn_no . '" class="tta__listent_content ' . esc_attr($class) . '" type="button"  title="Text To Audio:  Tap to listen post.">' . $speakIcon . ' </button>
        <style>
        .tta__listent_content{ ' . esc_attr($btn_style) . ' }
        .tta__listent_content:hover{' . esc_attr($btn_style) . '}
        .dashicons{ line-height: 1.5; }
        ' . $custom_css . '
        </style>
        <script>
            tta__listent_content_' . $btn_no . '.onclick = function() {
                listenCotentInFrontend("' . $content . '", "tta__listent_content_' . $btn_no . '",  ' . $listening . ' );
            };
        </script>';

    return $button;

}

add_shortcode('tta_listen_btn', 'tta_create_shortcode');
