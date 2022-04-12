<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://webappick.com
 * @since             1.0.0
 * @package           vue_plugin_boilerplate
 *
 * @wordpress-plugin
 * Plugin Name:       A Vue Plugin Boilerplate
 * Plugin URI:        https://webappick.com
 * Description:       This is a short description of what the plugin does. It's displayed in the WordPress admin area.
 * Version:           1.0.0
 * Author:            WebAppick
 * Author URI:        https://webappick.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       vue-plugin-boilerplate
 * Domain Path:       /languages
 */
include 'vendor/autoload.php';

use WebappickTracker\Webappick_Tracker;
use WebappickTracker\Webappick_Tracker_Activator;
use WebappickTracker\Webappick_Tracker_Deactivator;
use WebappickTracker_Api\Webappick_Tracker_Api_Routes;

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Absolute path to the WordPress directory.
// if ( !defined('ABSPATH') )
//     define('ABSPATH', dirname(__FILE__) . '/');

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */

if (!defined('WEBAPPICK_TRACKER_VERSION')) {

    define('WEBAPPICK_TRACKER_VERSION', '1.0.0');
}

if (!defined('WEBAPPICK_TRACKER_NONCE')) {

    define('WEBAPPICK_TRACKER_NONCE', 'WEBAPPICK_TRACKER_nonce');
}

if (!defined('WP_SPEACH_FRONT_LISTEN_BTN_NO')) {
    $btn_no = (get_option('WP_SPEACH_FRONT_LISTEN_BTN_NO'))?get_option('WP_SPEACH_FRONT_LISTEN_BTN_NO'): 0;
    define('WP_SPEACH_FRONT_LISTEN_BTN_NO', $btn_no);
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

class Init
{

    public function __construct()
    {

        $this->run_vue_plugin_boilerplate();

    }

    public function run_vue_plugin_boilerplate()
    {
        $plugin = new Webappick_Tracker();
        $plugin->run();

        add_action('init', function () {
            global $current_user;
            new Webappick_Tracker_Api_Routes($current_user);
        });
    }

    /**
     * The code that runs during plugin activation.
     * This action is documented in includes/vue_plugin_boilerplate_Activator.php
     */
    public function activate_vue_plugin_boilerplate()
    {
        Webappick_Tracker_Activator::activate();
    }

    /**
     * The code that runs during plugin deactivation.
     * This action is documented in includes/vue_plugin_boilerplate_Deactivator.php
     */
    public function deactivate_vue_plugin_boilerplate()
    {
        Webappick_Tracker_Deactivator::deactivate();
    }
}

$tracker = new Init();

register_activation_hook(__FILE__, [$tracker, 'activate_vue_plugin_boilerplate']);
register_deactivation_hook(__FILE__, [$tracker, 'deactivate_vue_plugin_boilerplate']);

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API#javascript



/**
 * If classic editor is active then on new-post and edit post 
 * activate recording  for blog content.
 */
function wps_clean_content($text)
{
    $quotationMarks = array(
        "'"       => "\'",
        '"'       => '\"',
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
        '&quot;'  => '\"',
    );

    $otherMarks = array(
        '&auml;'  => 'ä',
        '&Auml;'  => 'Ä',
        '&ouml;'  => 'ö',
        '&Ouml;'  => 'Ö',
        '&uuml;'  => 'ü',
        '&Uuml;'  => 'Ü',
        '&szlig;' => 'ß',
        '&euro;'  => '€',
        '&copy;'  => '©',
        '&trade;' => '™',
        '&reg;'   => '®',
        '&nbsp;'  => '',
        '&mdash;' => '—',
        '&amp;'   => '&',
        '&gt;'    => 'greater than',
        '&lt;'    => 'less than',
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
 * Example [wps_listen_btn]
 * @param $atts
 * @return string
 */
function create_shortcode( $atts ) {

    // Apply short code for only single page.
    if(!is_single()) return;
    static  $btn_no = 0;
    $btn_no++;

    // https://responsivevoice.com/wordpress-text-to-speech-plugin/

    $title          = get_the_title();
    $description    = get_the_content( );
    $description    = apply_filters('wps__content_before_cleaning', $description);
    $description    = wps_clean_content($description);
    $description    = apply_filters('wps__content_after_cleaning', $description);
    $content        = apply_filters( 'wps__content_title', $title );
    $content        .= apply_filters( 'wps__content_description', $description );

    ?>
<?php
    $btn_text = (isset($atts['btn_text'])) && strlen($atts['btn_text'])? $atts['btn_text']: "Listen";

    $speakIcon = '<span class="dashicons dashicons-controls-play"></span> ' . $btn_text . '
    
    ';
    $class = (isset($atts['class'])) && strlen($atts['class'])? $atts['class']: "";
    $button = '<button id="wps__listent_content_'.$btn_no.'" style="width:100%" class="'.$class.'" type="button"  title="WP Speech:  Tap to listen post.">' . $speakIcon . ' </button>
        <script>
        wps__listent_content_'.$btn_no.'.onclick = function(){
                
                listenCotentInFrontend("' . $content . '", "wps__listent_content_'.$btn_no.'");
                
            };
        </script>
            ';

    return $button;
    
}

add_shortcode( 'wps_listen_btn', 'create_shortcode' );