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
 * Version:           2.2.4
 * Author:            AtlasAiDev
 * Author URI:        http://atlasaidev.com/
 * License:           GPL-3.0+
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.txt
 * Text Domain:       text-to-audio
 * Domain Path:       /languages
 * Requires PHP:      7.4
 * Requires at least: 5.6
 */


// TTS-247: dropped the previous `if (!defined('ABSPATH')) { define('ABSPATH', ...); }`
// block. WordPress defines ABSPATH in wp-load.php before any plugin file is loaded,
// so the body never executed in practice. The WordPress.org Plugin Directory review
// (May 2026, HelpScout #293) still flagged it under "Changing global behaviour" —
// a plugin must not redefine WordPress core constants.
//
// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Include Composer autoloader if using Composer
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

// Suppress WordPress 6.7+ "textdomain loaded too early" notice. Some
// bundled dependencies still call __() before init; the resulting
// _load_textdomain_just_in_time notice is harmless but corrupts REST API
// JSON responses when WP_DEBUG is on.
add_filter( 'doing_it_wrong_trigger_error', function ( $trigger, $function_name ) {
    if ( '_load_textdomain_just_in_time' === $function_name ) {
        return false;
    }
    return $trigger;
}, 10, 2 );

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

if (!defined('TTA_REQUIRED_PRO_VERSION')) {
    // TTS-250: minimum AtlasVoice Pro add-on version that mounts the UI moved
    // out of the free plugin (Listening voice settings, voice-provider
    // integrations, player-2..6 preview). Free shows an "update the add-on"
    // notice when an older Pro is active. Bump this when the free plugin starts
    // to depend on a newer add-on contract.
    define('TTA_REQUIRED_PRO_VERSION', '3.3.1');
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

if (TTA_DEBUG_MODE  && defined('WP_SITEURL') && WP_SITEURL) {
    $rest_url = WP_SITEURL . '/wp-json/';
    update_option('tts_rest_api_url', $rest_url, false);
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
            define('TEXT_TO_AUDIO_VERSION', apply_filters('tts_version', '2.2.4'));
        }

        if (!defined('TEXT_TO_AUDIO_PLUGIN_NAME')) {
            define('TEXT_TO_AUDIO_PLUGIN_NAME', apply_filters('tts_plugin_name', 'AtlasVoice'));
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
                update_option('tts_rest_api_url', $rest_url, false);
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


// TTS-247: load_plugin_textdomain() has been discouraged since WP 4.6 for
// wp.org-hosted plugins -- WordPress loads translations automatically from
// translate.wordpress.org. Removed per the Plugin Check warning.

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
        'display'  => 'Once Weekly',
    );
    $schedules['monthly'] = array(
        'interval' => 2592000, // 30 days in seconds
        'display'  => 'Once Monthly',
    );
    return $schedules;
});

/**
 * Hook for scheduled analytics report
 */
add_action('tta_send_scheduled_report', function () {
    // Email sending is a Pro feature — delegate to Pro Report Email class.
    if (class_exists('TTA_Pro\TTA_Pro_Report_Email')) {
        $reporter = new \TTA_Pro\TTA_Pro_Report_Email();
        $reporter->generate_and_send_report();
    }
});

/**
 * TTS-236: Register cron hook for the chunked play_count migration.
 * Scheduled by TTA_Activator::create_analytics_table_if_not_exists() on upgrade,
 * and by TTA_Notices::query_total_plays() if the large-table guard trips.
 */
add_action('tta_migrate_play_count_column', array('\TTA\TTA_Activator', 'migrate_play_count_batch'));


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
    // One-time migration (2.1.10): enable analytics for existing free users.
    // TTS-250: track every post by default (the "all" sentinel) instead of the
    // latest 20 — the old 20-post cap was an artificial limit on a shipped
    // feature (wp.org Guideline 5).
    if ( ! get_option( 'tta_analytics_migrated_2_1_10' ) ) {
        $analytics = (array) get_option( 'tta_analytics_settings' );
        if ( empty( $analytics['tts_enable_analytics'] ) && empty( $analytics['tts_trackable_post_ids'] ) ) {
            $analytics['tts_enable_analytics']   = true;
            $analytics['tts_trackable_post_ids'] = array( 'all' );
            update_option( 'tta_analytics_settings', $analytics, false );
        }
        update_option( 'tta_analytics_migrated_2_1_10', true, false );
    }

    // Allow resetting onboarding via ?page=text-to-audio&reset_onboard=true
    // phpcs:disable WordPress.Security.NonceVerification.Recommended -- admin-only flow gated by current_user_can(manage_options); read-only routing check
    if ( isset( $_GET['page'] ) && 'text-to-audio' === $_GET['page']
        && isset( $_GET['reset_onboard'] ) && 'true' === $_GET['reset_onboard']
        && current_user_can( 'manage_options' )
    ) {
    // phpcs:enable WordPress.Security.NonceVerification.Recommended
        delete_option( 'tta_onboarding_completed' );
        delete_option( 'tta_pro_onboarding_completed' );
        wp_safe_redirect( admin_url( 'admin.php?page=text-to-audio&welcome=1' ) );
        exit;
    }

    if ( get_transient('tta_activation_redirect') ) {
        delete_transient('tta_activation_redirect');

        // Don't redirect during bulk activation or if user can't manage options.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- WP-core flag set by core during multi-activate; presence-only check
        if ( isset($_GET['activate-multi']) || ! current_user_can('manage_options') ) {
            return;
        }

        // Skip wizard if onboarding was already completed (e.g. reactivation).
        if ( get_option( 'tta_onboarding_completed' ) ) {
            wp_safe_redirect( admin_url( 'admin.php?page=text-to-audio' ) );
        } else {
            wp_safe_redirect( admin_url( 'admin.php?page=text-to-audio&welcome=1' ) );
        }
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
    // TTS-247: escape happens inside tta_get_button_content (wp_kses with
    // a small allow-list around the tts__listening_button filter output).
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