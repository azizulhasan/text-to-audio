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
 * @package           wp_speech
 *
 * @wordpress-plugin
 * Plugin Name:       Text To Audio
 * Description:       Add functionality to WordPress site to read blogs out loud in any language and record blogs by voice in any language.
 * Version:           1.0.0
 * Author:            Azizul Hasan
 * Author URI:        http://azizulhasan.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       wps-speech
 * Domain Path:       /languages
 */
include 'vendor/autoload.php';

use WPSpeech\WP_Speech;
use WPSpeech\WP_Speech_Activator;
use WPSpeech\WP_Speech_Deactivator;
use WPSpeech_Api\WP_Speech_Api_Routes;

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Absolute path to the WordPress directory.
if ( !defined('ABSPATH') )
    define('ABSPATH', dirname(__FILE__) . '/');

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */

if (!defined('TEXT_TO_AUDIO_VERSION')) {

    define('TEXT_TO_AUDIO_VERSION', '1.0.0');
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

class Init
{

    public function __construct()
    {

        $this->run_wp_speech();

    }

    public function run_wp_speech()
    {
        $plugin = new WP_Speech();
        $plugin->run();

        add_action('init', function () {
            global $current_user;
            new WP_Speech_Api_Routes($current_user);
        });
    }

    /**
     * The code that runs during plugin activation.
     * This action is documented in includes/WP_Speech_Activator.php
     */
    public function activate_wp_speech()
    {
        WP_Speech_Activator::activate();
    }

    /**
     * The code that runs during plugin deactivation.
     * This action is documented in includes/WP_Speech_Deactivator.php
     */
    public function deactivate_wp_speech()
    {
        WP_Speech_Deactivator::deactivate();
    }
}

$wpspeech = new Init();

register_activation_hook(__FILE__, [$wpspeech, 'activate_wp_speech']);
register_deactivation_hook(__FILE__, [$wpspeech, 'deactivate_wp_speech']);



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
function wps_create_shortcode( $atts ) {


    $listening =  (array) get_option('wps_listening_settings');
    $listening = json_encode($listening);
    $customize = (array) get_option('wps_customize_settings');
    $settings = (array) get_option('wps_settings_data');


    /**
     * Apply short code for only single page.
     */
    if($settings['wps__settings_display_btn_in_single_page'] == 1 &&  !is_single()) return;
    static  $btn_no = 0;
    $btn_no++;


    $title          = get_the_title().". ";
    $description    = get_the_content( );
    $description    = apply_filters('wps__content_before_cleaning', $description);
    $description    = wps_clean_content($description);
    $description    = apply_filters('wps__content_after_cleaning', $description);
    $content        = apply_filters( 'wps__content_title', $title );
    $content        .= apply_filters( 'wps__content_description', $description );

    ?>
<?php
    // Button start text.
    $btn_text = (isset($atts['btn_text'])) && strlen($atts['btn_text'])? esc_html( $atts['btn_text'] ): "Listen";
    // Speak Icon
    $speakIcon = '<span class="dashicons dashicons-controls-play"></span> ' . $btn_text . '
    ';
    // Button style.
    if(isset($customize) && count($customize)){
        $btn_style = 'background-color:'.esc_html( $customize['backgroundColor'] ).';color:'.esc_html( $customize['color'] ).';width:'. esc_html( $customize['width'] ) .'%;border:0;';
    }else{
        $btn_style = 'width:100%;border:0;';
    }
    // Custom class to button.
    $class = (isset($atts['class'])) && strlen($atts['class'])? esc_html( $atts['class'] ) : "";
    $button = '<button id="wps__listent_content_'.$btn_no.'" style="'.esc_attr( $btn_style ).'" class="'.esc_attr( $class ).'" type="button"  title="WP Speech:  Tap to listen post.">' . $speakIcon . ' </button>
        <script>
        wps__listent_content_'.$btn_no.'.onclick = function(){
                
                listenCotentInFrontend("' . $content . '", "wps__listent_content_'.$btn_no.'",  '. $listening . ' );
                
            };
        </script>
            ';

    return $button;
    
}

add_shortcode( 'wps_listen_btn', 'wps_create_shortcode' );

