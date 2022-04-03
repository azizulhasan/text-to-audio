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
add_action('admin_init', function () {
    if (is_plugin_active('classic-editor/classic-editor.php')) {
        $server = explode('/', $_SERVER['REQUEST_URI']);
        $end_uri = end($server);
        // if ('post-new.php' == $end_uri) {
        //     posts_html();
        // } elseif (strpos($end_uri, 'post.php') !== false) {
        //     posts_html();
        // }
    }
});
