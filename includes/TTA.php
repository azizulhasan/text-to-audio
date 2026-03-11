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

        // Output AudioObject JSON-LD schema in <head> for singular posts with audio player
        add_action('wp_head', [TTA_Helper::class, 'output_audio_schema_head'], 99);

        // Initialize Posts List customization
        if (is_admin()) {
            new TTA_Posts_List();
        }

        // Initialize Dashboard Widget
        new \TTA_Admin\TTA_Dashboard_Widget();

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
