<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://atlasaidev.com/
 * @since             1.0.0
 * @package           TTA
 *
 * @wordpress-plugin
 * Plugin Name:       Text To Speech TTS Accessibility
 * Plugin URI:        https://atlasaidev.com/
 * Description:       The most user-friendly Text-to-Speech Accessibility plugin. Just install and automatically add a Text to Audio player to your WordPress site!
 * Version:           2.1.8
 * Author:            AtlasAiDev
 * Author URI:        http://atlasaidev.com/
 * License:           GPL-3.0+
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.txt
 * Text Domain:       text-to-audio
 * Domain Path:       /languages
 * Requires PHP:      7.4
 * Requires at least: 5.6
 */


// Absolute path to the WordPress directory.
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Include Composer autoloader if using Composer
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

use TTA\TTA;
use TTA\TTA_Activator;
use TTA\TTA_Deactivator;
use TTA_Api\TTA_Api_Routes;
use TTA\TTA_Notices;
use TTA\TTA_Lib_AtlasAiDev;
use TTA\TTA_Cache;

/**
 * Is plugin active
 */
function is_pro_plugin_exists()
{
    $plugin_path = \WP_PLUGIN_DIR;
    $pro_plugins = [
        '/text-to-speech-pro/text-to-audio-pro.php',
        '/text-to-speech-pro-premium/text-to-audio-pro.php',
        '/text-to-audio-pro/text-to-audio-pro.php',
        '/text-to-audio-pro-premium/text-to-audio-pro.php'
    ];

    foreach ($pro_plugins as $pro_plugin) {
        if (file_exists($plugin_path . $pro_plugin)) {
            return true;
        }
    }

    return false;
}

if ( !is_pro_plugin_exists() &&  !function_exists('ttsp_fs')) {
    // Create a helper function for easy SDK access.
    function ttsp_fs()
    {
        global $ttsp_fs;

        if (!isset($ttsp_fs)) {
            // Include Freemius SDK.
            require_once dirname(__FILE__) . '/freemius/start.php';

            $ttsp_fs = fs_dynamic_init(array(
                'id' => '13388',
                'slug' => 'text-to-audio',
                'type' => 'plugin',
                'public_key' => 'pk_937e16238dbdbc42dc1d7a4ead3b7',
                'is_premium' => false,
                'is_premium_only' => false,
                'has_premium_version' => true,
                'has_addons' => false,
                'has_paid_plans' => true,
                'has_affiliation' => 'all',
                'menu' => array(
                    'slug' => 'text-to-audio',
                    'support' => 1,
                    'pricing' => 1,
                    'contact' => false,
                    'account' => false,
                ),
            ));
        }

        return $ttsp_fs;
    }

    // Init Freemius.
    ttsp_fs();
    // Signal that SDK was initiated.
    do_action('ttsp_fs_loaded');

}

if (function_exists('ttsp_fs')) {
    function ttsp_fs_custom_connect_message_on_update(
        $message,
        $user_first_name,
        $plugin_title,
        $user_login,
        $site_link,
        $freemius_link
    )
    {
        return sprintf(
            __('Hey %1$s') . ',<br>' .
            __('Please help us improve %2$s! If you opt-in, some data about your usage of %2$s will be sent to %5$s. If you skip this, that\'s okay! %2$s will still work just fine.', 'text-to-speech-pro'),
            $user_first_name,
            '<b>' . $plugin_title . '</b>',
            '<b>' . $user_login . '</b>',
            $site_link,
            $freemius_link
        );
    }

    ttsp_fs()->add_filter('connect_message_on_update', 'ttsp_fs_custom_connect_message_on_update', 10, 6);
}


/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */

if (!defined('TEXT_TO_AUDIO_NONCE')) {

    define('TEXT_TO_AUDIO_NONCE', 'TEXT_TO_AUDIO_NONCE');
}

if (!defined('TEXT_TO_AUDIO_TEXT_DOMAIN')) {

    define('TEXT_TO_AUDIO_TEXT_DOMAIN', 'text-to-audio');
}

if (!defined('TEXT_TO_AUDIO_ROOT_FILE')) {

    define('TEXT_TO_AUDIO_ROOT_FILE', __FILE__);
}

if (!defined('TTA_ROOT_FILE_NAME')) {
    $path = explode(DIRECTORY_SEPARATOR, TEXT_TO_AUDIO_ROOT_FILE);
    $file = end($path);
    define('TTA_ROOT_FILE_NAME', $file);
}

if (!defined('TTA_LIBS_PATH')) {

    define('TTA_LIBS_PATH', dirname(TEXT_TO_AUDIO_ROOT_FILE) . '/libs/');
}

if (!defined('TTA_ADMIN_PATH')) {

    define('TTA_ADMIN_PATH', plugin_dir_url(__FILE__) . 'admin/');
}

if (!defined('TTA_DEBUG_MODE')) {

    define('TTA_DEBUG_MODE', 0);
}


if (!defined('TTA_PLUGIN_URL')) {
    /**
     * Plugin Directory URL
     *
     * @var string
     * @since 1.2.2
     */
    define('TTA_PLUGIN_URL', trailingslashit(plugin_dir_url(TEXT_TO_AUDIO_ROOT_FILE)));
}

if (!defined('TTA_PLUGIN_PATH')) {
    /**
     * Plugin Directory PATH
     *
     * @var string
     * @since 1.2.2
     */
    define('TTA_PLUGIN_PATH', trailingslashit(plugin_dir_path(TEXT_TO_AUDIO_ROOT_FILE)));
}

if (TTA_DEBUG_MODE  && WP_SITEURL) {
    $rest_url = WP_SITEURL . '/wp-json/';
    update_option('tts_rest_api_url', $rest_url);
    TTA_Cache::set('tts_rest_api_url', $rest_url);
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
class TTA_Init
{

    public function __construct()
    {
        if (!defined('TEXT_TO_AUDIO_VERSION')) {
            define('TEXT_TO_AUDIO_VERSION', apply_filters('tts_version', ' 2.1.8'));
        }

        if (!defined('TEXT_TO_AUDIO_PLUGIN_NAME')) {
            define('TEXT_TO_AUDIO_PLUGIN_NAME', apply_filters('tts_plugin_name', 'Text To Speech TTS'));
        }

        $this->run();
    }

    public function run()
    {
        $plugin = new TTA();
        $plugin->run();

        add_action('init', function () {
            if (!defined('TTA_PRO_PLUGIN_PATH')) {
                TTA_Lib_AtlasAiDev::instance()->init();
            }
            if (!TTA_Cache::get('tts_rest_api_url')) {
                $rest_url = esc_url_raw(rest_url());
                update_option('tts_rest_api_url', $rest_url);
                TTA_Cache::set('tts_rest_api_url', $rest_url);
            }
            TTA_Notices::instance();
            //Rest api init.
            new TTA_Api_Routes();
        }, 9999);

        //add plugins action links.
        if (is_admin()) {
            $basename = plugin_basename(__FILE__);
            $prefix = is_network_admin() ? 'network_admin_' : '';
            add_filter(
                "{$prefix}plugin_action_links_$basename",
                array($this, 'add_action_links'),
                10, // priority
                4   // parameters
            );
        }
    }

    /**
     * add action list to plugin.
     */
    public function add_action_links($actions, $plugin_file, $plugin_data, $context)
    {
        $plugin_url = esc_url(admin_url() . 'admin.php?page=text-to-audio');
        $doc_url = esc_url(admin_url() . 'admin.php?page=text-to-audio#/faq');
        $support = esc_url('https://atlasaidev.com/contact-us/');
        $review = esc_url('https://wordpress.org/support/plugin/text-to-audio/reviews/');
        $custom_actions = array(
            'settings' => sprintf('<a href="%s" target="_blank">%s</a>', $plugin_url, __('Settings', 'text-to-audio')),
            'faq' => sprintf('<a href="%s" target="_blank">%s</a>', $doc_url, __('Docs', 'text-to-audio')),
            'support' => sprintf('<a href="%s" target="_blank">%s</a>', $support, __('Support', 'text-to-audio')),
            'review' => sprintf('<a href="%s" target="_blank">%s</a>', $review, __('Write a Review', 'text-to-audio')),
        );

        // add the links to the front of the actions list
        return array_merge($custom_actions, $actions);

    }

}


// Load text domain early
add_action('plugins_loaded', function () {
    load_plugin_textdomain(
        'text-to-audio',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );
});

add_action('plugins_loaded', function () {
    //Rest api init.
    new TTA_Init();
}, 9999);

/**
 * Register custom cron schedule intervals
 */
add_filter('cron_schedules', function ($schedules) {
    $schedules['weekly'] = array(
        'interval' => 604800, // 7 days in seconds
        'display'  => __('Once Weekly', 'text-to-audio'),
    );
    $schedules['monthly'] = array(
        'interval' => 2592000, // 30 days in seconds
        'display'  => __('Once Monthly', 'text-to-audio'),
    );
    return $schedules;
});

/**
 * Hook for scheduled analytics report
 */
add_action('tta_send_scheduled_report', function () {
    // Only run if Pro is active
    if (!class_exists('TTA\TTA_Helper') || !\TTA\TTA_Helper::is_pro_active()) {
        return;
    }

    // Initialize the analytics class and send the report
    if (class_exists('TTA_Api\AtlasVoice_Analytics')) {
        $analytics = new \TTA_Api\AtlasVoice_Analytics();
        $analytics->generate_and_send_report();
    }
});


/**
 * The code that runs during plugin activation.
 * This action is documented in includes/TTA_Activator.php
 */
register_activation_hook(__FILE__, function () {
    TTA_Activator::activate();
});

/**
 * Redirect to settings page on first activation.
 * Uses a transient set in TTA_Activator::activate() to detect first-time activation.
 *
 * @since 2.1.8
 */
add_action('admin_init', function () {
    if ( get_transient('tta_activation_redirect') ) {
        delete_transient('tta_activation_redirect');

        // Don't redirect during bulk activation or if user can't manage options.
        if ( isset($_GET['activate-multi']) || ! current_user_can('manage_options') ) {
            return;
        }

        wp_safe_redirect( admin_url('admin.php?page=text-to-audio&welcome=1') );
        exit;
    }
});

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/TTA_Deactivator.php
 */
register_deactivation_hook(__FILE__, function () {
    TTA_Deactivator::deactivate();
});


/**
 *
 * Create short code for qr code.
 * Example [atlasvoice]
 *
 * @param $atts
 *
 * @return string
 */
function tta_create_shortcode($atts, $content, $shortcode_tag)
{
    return tta_get_button_content($atts, false, $content);
}


//update_post_meta(8, 'tts_mp3_file_urls', []);
add_shortcode('tta_listen_btn', 'tta_create_shortcode');
add_shortcode('atlasvoice', 'tta_create_shortcode');

// Filter to allow shortcodes in HTML tags
add_filter('do_shortcode_tag', 'allow_shortcode_in_html_tag', 10, 4);
function allow_shortcode_in_html_tag($output, $tag, $attr, $m)
{

    if ($tag == 'tta_listen_btn' || $tag == 'atlasvoice' && (!empty($attr) || isset($m[5]))) {
        if (isset($attr['position']) && $attr['position'] == 'before') {
//			$content = tta_get_button_content( $attr, false, $m[5] ) . $m[5];
            $content = $output . $m[5];
        } else {
//			$content = $m[5] . tta_get_button_content( $attr, false, $m[5] );
            $content = $m[5] . $output;
        }

        //Get the content wrapped by the shortcode.
        return $content;
    }

    return $output;
}