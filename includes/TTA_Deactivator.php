<?php
namespace TTA;
/**
 * Fired during plugin deactivation
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    TTA
 * @subpackage TTA/includes
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/includes
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class TTA_Deactivator {

    /**
     * Short Description. (use period)
     *
     * Long Description.
     *
     * @since    1.0.0
     */
    public static function deactivate() {
        // TTS-247: removed the previous body that force-deactivated the Pro
        // plugin (`text-to-audio-pro`) and then forcibly redirected the user
        // via `header('Location: …'); die();`. The WordPress.org Plugin
        // Directory guideline "Changing Active Plugins" forbids one plugin
        // from altering another's activation state without explicit user
        // consent -- even when both plugins are published by the same vendor
        // (the user's click on "Deactivate Free" is not implicit consent to
        // deactivate Pro). Reviewer cited this in HelpScout #293.
        //
        // Dependency direction is handled in Pro now, not here:
        //   - WordPress 6.5+: Pro declares `Requires Plugins: text-to-audio`
        //     in its plugin header; WP shows the dependency status in the
        //     plugins admin and blocks Pro from activating without Free.
        //   - WordPress 5.6-6.4: Pro's `free_version_activation_notice()`
        //     (in `text-to-audio-pro.php`) shows an admin notice whenever
        //     Free is inactive, asking the user to install / activate Free.
        //     Pro keeps the user in control -- it does NOT self-deactivate
        //     or force any redirect.
        //
        // TTS-238 D27.28 — the previous TTS-238 branch also added a
        // `BoilerplateDetector::unregister_cron()` call here; that whole
        // subsystem was retired in D27.28 (the cron is unscheduled by the
        // D27.25 admin_init cleanup migration instead) so it's gone too.
    }

}
