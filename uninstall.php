<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Removes all plugin data: options, analytics table, post meta, transients, and cron jobs.
 * This only runs when the user explicitly deletes the plugin from wp-admin.
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

global $wpdb;

/*
 * ─── 1. Delete known options ─────────────────────────────────────────────
 */
$options = array(
	// Core settings.
	'tta_settings_data',
	'tta_customize_settings',
	'tta_listening_settings',
	'tta_record_settings',
	'tta_analytics_settings',
	'tta__button_text_arr',
	'tta_alias_settings',
	'tts_text_aliases',
	'tta_compatible_data',
	'tta_current_browser_info',
	'tts_rest_api_url',

	// Analytics & scheduling.
	'tta_schedule_report_settings',
	'tta_last_report_sent',
	'tta_analytics_migrated_2_1_10',
	'atlasvoice_analytics_table_is_created',
	'tta_analytics_indexes_added',

	// Tracking / telemetry.
	'text-to-audio_allow_tracking',
	'text-to-audio_tracking_last_send',
	'text-to-audio_tracking_notice',

	// Activation & onboarding.
	'tta_has_been_activated_before',
	'tta_activated_at',
	'tta_onboarding_completed',
	'tta_pro_onboarding_completed',
	'tta_onboarding_events',
	'tta_onboarding_summary',
	'tta_milestones_reached',

	// Notices.
	'tta_review_notice_next_show_time',
	'tta_feedback_notice_next_show_time',
);

foreach ( $options as $option ) {
	delete_option( $option );
}

/*
 * ─── 2. Delete dynamic options (pattern-based) ──────────────────────────
 */
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE 'tta\_reshow\_%'" );
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE 'tta\_clicks\_%'" );

/*
 * ─── 3. Drop the analytics table ────────────────────────────────────────
 */
$table_name = $wpdb->prefix . 'atlasvoice_analytics';
$wpdb->query( "DROP TABLE IF EXISTS {$table_name}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

/*
 * ─── 4. Delete post meta ────────────────────────────────────────────────
 */
$meta_keys = array(
	'tts_mp3_file_urls',
	'tts_is_mp3_file_url_exists',
	'atlasVoice_analytics',
);

foreach ( $meta_keys as $meta_key ) {
	$wpdb->query( $wpdb->prepare(
		"DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s",
		$meta_key
	) );
}

/*
 * ─── 5. Delete transients ───────────────────────────────────────────────
 */
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_tta\_%' OR option_name LIKE '_transient_timeout_tta\_%'" );
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_tts\_%' OR option_name LIKE '_transient_timeout_tts\_%'" );
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_text-to-audio\_%' OR option_name LIKE '_transient_timeout_text-to-audio\_%'" );

/*
 * ─── 6. Unschedule cron jobs ────────────────────────────────────────────
 */
$cron_hooks = array(
	'tta_send_scheduled_report',
	'text-to-audio_tracker_send_event',
);

foreach ( $cron_hooks as $hook ) {
	$timestamp = wp_next_scheduled( $hook );
	if ( $timestamp ) {
		wp_unschedule_event( $timestamp, $hook );
	}
}
