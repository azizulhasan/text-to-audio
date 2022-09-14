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
 * Version:           1.1.1
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

    define('TEXT_TO_AUDIO_VERSION', '1.1.1');
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

        $browser = get_option('tta_current_browser_info', []);
        // Check if SpeechRecognition, speechSynthesis enabled.
        if ((isset($browser['SpeechRecognition']) && 'undefined' === $browser['SpeechRecognition']) ||
            (isset($browser['speechSynthesis']) && 'undefined' === $browser['speechSynthesis'])) {
            add_action('admin_notices', array($this, 'api_missing'));
        }

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

    /**
     * Admin notice
     *
     * When browser doesn'nt support SpeechRecognition.
     *
     * @since 1.0.0
     * @access public
     */
    public function api_missing() {
        $browser = get_option('tta_current_browser_info', []);

        $apis = '';

        if (isset($browser['SpeechRecognition']) && 'undefined' === $browser['SpeechRecognition']) {
            $apis .= 'SpeechRecognition';
        }
        if (isset($browser['speechSynthesis']) && 'undefined' === $browser['speechSynthesis']) {
            $apis .= $apis ? ', speechSynthesis' : 'speechSynthesis';
        }

        $message = sprintf(
            /* translators: 1: Plugin name 2: SpeechRecognition  3: link to doc*/
            esc_html__('%1$s Please enable %2$s. Click here  to %3$s.', 'text-to-audio'),
            '<h3><strong>' . esc_html__('Text To Audio', 'text-to-audio') . '</strong></h3>',
            '<strong>' . esc_html__($apis, 'text-to-audio') . '</strong>',
            '<a href="admin.php?page=text-to-audio#/docs">' . esc_html__('enable', 'text-to-audio') . '</a>'
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

}

$TTA = new TTA_Init();

register_activation_hook(__FILE__, [$TTA, 'activate_tta']);
register_deactivation_hook(__FILE__, [$TTA, 'deactivate_tta']);

/**
 *
 * Create short code for qr code.
 * Example [tta_listen_btn]
 * @param $atts
 * @return string
 */
function tta_create_shortcode($atts) {

    return tta_get_button_content($atts);

}

add_shortcode('tta_listen_btn', 'tta_create_shortcode');
