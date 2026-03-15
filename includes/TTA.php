<?php

namespace TTA;

use TTA_Admin\TTA_Admin;
use TTA_Admin\TTA_Posts_List;

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    TTA
 * @subpackage TTA/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/includes
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */

class TTA {

    /**
     * The loader that's responsible for maintaining and registering all hooks that power
     * the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      TTA_Loader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * The unique identifier of this plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $plugin_name    The string used to uniquely identify this plugin.
     */
    protected $plugin_name;

    /**
     * The current version of the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $version    The current version of the plugin.
     */
    protected $version;

    /**
     * Define the core functionality of the plugin.
     *
     * Set the plugin name and the plugin version that can be used throughout the plugin.
     * Load the dependencies, define the locale, and set the hooks for the admin area and
     * the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function __construct() {
        if (defined('TEXT_TO_AUDIO_VERSION')) {
            $this->version = TEXT_TO_AUDIO_VERSION;
        } else {
            $this->version = '1.0.0';
        }
        $this->plugin_name = 'text-to-audio';

        $this->load_dependencies();
        $this->define_hooks();
    }

    /**
     * Load the required dependencies for this plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function load_dependencies() {

        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/helpers.php';

        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/TTA_Hooks.php';


        $this->loader = new TTA_Loader();

    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_hooks() {

        $plugin_admin = new TTA_Admin($this->get_plugin_name(), $this->get_version());

        $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_styles', 999999);
        $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts', 99999);
        $this->loader->add_action('admin_menu', $plugin_admin, 'TTA_menu');

        // Block registration and translations (following i18n-block-demo pattern)
        $this->loader->add_action('init', $plugin_admin, 'engueue_block_scripts');

        $this->loader->add_action('wp_enqueue_scripts', $plugin_admin, 'enqueue_TTA', 99999);

        // Admin bar quick-toggle for AtlasVoice on front-end singular pages.
        $this->loader->add_action('admin_bar_menu', $plugin_admin, 'add_admin_bar_toggle', 999);
        $this->loader->add_action('wp_head', $plugin_admin, 'admin_bar_inline_css', 999);
        $this->loader->add_action('wp_footer', $plugin_admin, 'admin_bar_inline_js', 999);
        $this->loader->add_action('wp_ajax_tta_toggle_audio', $plugin_admin, 'ajax_toggle_audio');

        // Deactivation rescue modal on plugins.php (shows before Freemius modal).
        $this->loader->add_action('admin_footer', $plugin_admin, 'render_deactivation_rescue_modal');

        // Output AudioObject JSON-LD schema in <head> for singular posts with audio player
        add_action('wp_head', [TTA_Helper::class, 'output_audio_schema_head'], 99);

        // Initialize Posts List customization
        if (is_admin()) {
            new TTA_Posts_List();
        }

        // Initialize Dashboard Widget
        new \TTA_Admin\TTA_Dashboard_Widget();

        // ─── GDPR / WordPress Privacy API integration ───
        $this->loader->add_action( 'admin_init', $this, 'register_privacy_policy_content' );
        add_filter( 'wp_privacy_personal_data_exporters', array( $this, 'register_data_exporter' ) );
        add_filter( 'wp_privacy_personal_data_erasers', array( $this, 'register_data_eraser' ) );
    }

    /**
     * Register suggested privacy policy content for AtlasVoice.
     *
     * Appears under Settings > Privacy > Privacy Policy page as suggested text.
     */
    public function register_privacy_policy_content() {
        $content = __(
            'This site uses the AtlasVoice plugin to provide text-to-speech audio playback. ' .
            'When listening analytics are enabled, the plugin collects the following data:' .
            "\n\n" .
            '<strong>Analytics data (per visitor):</strong>' .
            "\n" .
            '<ul>' .
            '<li>A pseudonymous browser fingerprint identifier (not your name, email, or IP address)</li>' .
            '<li>Which posts or pages you listened to</li>' .
            '<li>Playback events (play, pause, resume, completion)</li>' .
            '<li>Device type, browser, and operating system</li>' .
            '<li>Listening duration and timestamps</li>' .
            '</ul>' .
            "\n" .
            'This data is stored in your site\'s database and is used solely to understand how visitors ' .
            'interact with the audio player. Because the identifier is a browser fingerprint (not tied to ' .
            'your email or account), it cannot be linked to you personally.' .
            "\n\n" .
            '<strong>Optional telemetry (opt-in only):</strong>' .
            "\n" .
            'If the site administrator opts in to usage telemetry, anonymized plugin configuration data ' .
            '(e.g., which text-to-speech engine is selected, feature flags, active post types) is sent ' .
            'weekly to AtlasAiDev. No visitor data, post content, or personal information is included.' .
            "\n\n" .
            '<strong>Data retention:</strong>' .
            "\n" .
            'Analytics data is stored indefinitely until the site administrator clears it via the plugin ' .
            'settings or uninstalls the plugin. All plugin data is permanently deleted on uninstall.',
            TEXT_TO_AUDIO_TEXT_DOMAIN
        );

        wp_add_privacy_policy_content(
            'AtlasVoice – Text to Speech',
            wp_kses_post( wpautop( $content ) )
        );
    }

    /**
     * Register the personal data exporter for AtlasVoice.
     *
     * Analytics data uses pseudonymous browser fingerprints that cannot be
     * matched to an email address, so this exporter returns no items.
     *
     * @param array $exporters Registered exporters.
     * @return array
     */
    public function register_data_exporter( $exporters ) {
        $exporters['atlasvoice'] = array(
            'exporter_friendly_name' => __( 'AtlasVoice Analytics Data', TEXT_TO_AUDIO_TEXT_DOMAIN ),
            'callback'               => array( $this, 'export_personal_data' ),
        );
        return $exporters;
    }

    /**
     * Export personal data callback.
     *
     * Returns empty because analytics uses browser fingerprints (not email).
     *
     * @param string $email_address The user's email address.
     * @param int    $page          Page number for batched exports.
     * @return array
     */
    public function export_personal_data( $email_address, $page = 1 ) {
        return array(
            'data' => array(),
            'done' => true,
        );
    }

    /**
     * Register the personal data eraser for AtlasVoice.
     *
     * @param array $erasers Registered erasers.
     * @return array
     */
    public function register_data_eraser( $erasers ) {
        $erasers['atlasvoice'] = array(
            'eraser_friendly_name' => __( 'AtlasVoice Analytics Data', TEXT_TO_AUDIO_TEXT_DOMAIN ),
            'callback'             => array( $this, 'erase_personal_data' ),
        );
        return $erasers;
    }

    /**
     * Erase personal data callback.
     *
     * Returns "no items found" because analytics uses pseudonymous browser
     * fingerprints that cannot be matched to an email address.
     *
     * @param string $email_address The user's email address.
     * @param int    $page          Page number for batched erasures.
     * @return array
     */
    public function erase_personal_data( $email_address, $page = 1 ) {
        return array(
            'items_removed'  => false,
            'items_retained' => false,
            'messages'       => array(
                __( 'AtlasVoice analytics uses pseudonymous browser fingerprints that cannot be linked to email addresses. No matching data found.', TEXT_TO_AUDIO_TEXT_DOMAIN ),
            ),
            'done'           => true,
        );
    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run() {
        $this->loader->run();
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of
     * WordPress and to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * The reference to the class that orchestrates the hooks with the plugin.
     *
     * @since     1.0.0
     * @return    TTA_Loader    Orchestrates the hooks of the plugin.
     */
    public function get_loader() {
        return $this->loader;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }

}
