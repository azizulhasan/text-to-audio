<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Removes all plugin data via TTA\TTA_Reset::wipe_plugin_data(). Only
 * runs when the user opted-in via Settings → "Delete all data on uninstall".
 *
 * @link       https://atlasaidev.com
 * @since      2.2.0
 * @package    TTA
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// Only delete data if the user opted in via Settings > "Delete all data on uninstall".
$settings = get_option( 'tta_settings_data', array() );
if ( empty( $settings['tta__settings_delete_data_on_uninstall'] ) ) {
    return;
}

// TTS-247: cleanup logic lives in TTA\TTA_Reset so the Settings → Danger zone
// "Reset all plugin data" button can reuse the exact same routine.
if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
    require_once __DIR__ . '/vendor/autoload.php';
} else {
    require_once __DIR__ . '/includes/TTA_Reset.php';
}

\TTA\TTA_Reset::wipe_plugin_data();
