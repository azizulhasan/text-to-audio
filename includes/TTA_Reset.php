<?php
namespace TTA;

/**
 * TTS-247: shared cleanup routine reused by uninstall.php and the
 * Settings → Danger zone → "Reset all plugin data" button.
 *
 * Removes every option, transient, post-meta row, cron event, and the
 * analytics DB table this plugin created. Leaves the plugin code itself
 * (and therefore its activation state) untouched so the next page load
 * boots a fresh install.
 *
 * @package    TTA
 * @subpackage TTA/includes
 */
class TTA_Reset {

    /**
     * @return void
     */
    public static function wipe_plugin_data() {
        global $wpdb;

        // 1. Named options
        $options = array(
            // Core settings
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
            'tts_duplicate_post_ids',
            'tta_cors_detected',

            // Analytics & scheduling
            'tta_schedule_report_settings',
            'tta_last_report_sent',
            'tta_analytics_migrated_2_1_10',
            'atlasvoice_analytics_table_is_created',
            'tta_analytics_indexes_added',
            'tta_play_count_migration_last_id',
            'tta_play_count_migration_done',
            'tta_total_plays_counter',
            'tta_total_plays_fallback',

            // Tracking / telemetry
            'text-to-audio_allow_tracking',
            'text-to-audio_tracking_last_send',
            'text-to-audio_tracking_notice',

            // Activation & onboarding
            'tta_has_been_activated_before',
            'tta_activated_at',
            'tta_onboarding_completed',
            'tta_pro_onboarding_completed',
            'tta_onboarding_events',
            'tta_onboarding_summary',
            'tta_milestones_reached',

            // Notices
            'tta_review_notice_next_show_time',
            'tta_feedback_notice_next_show_time',

            'tta_mode_default_migrated'
        );

        foreach ( $options as $option ) {
            delete_option( $option );
        }

        // 2. Pattern-matched options
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE 'tta\_reshow\_%'" );
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE 'tta\_clicks\_%'" );

        // 3. Analytics table
        $table_name = $wpdb->prefix . 'atlasvoice_analytics';
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,PluginCheck.Security.DirectDB.UnescapedDBParameter
        $wpdb->query( "DROP TABLE IF EXISTS {$table_name}" );

        // 4. Post meta
        $meta_keys = array(
            'tts_mp3_file_urls',
            'tts_is_mp3_file_url_exists',
            'atlasVoice_analytics',
            // TTS-238: per-post CSS-selector override (set via the picker /
            // per-post UI). Shared between Free and Pro — Pro's uninstall.php
            // also clears it, but a Free "reset all data" should too.
            'tts_pro_custom_css_selectors',
        );
        foreach ( $meta_keys as $meta_key ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
            $wpdb->query( $wpdb->prepare(
                "DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s",
                $meta_key
            ) );
        }

        // 4b. User meta — per-user notice / review / milestone state.
        // The notices system (TTA_Notices) stores dismissal/seen/clicked
        // flags as user meta. A "reset all plugin data" must clear these
        // or notices stay suppressed for users who dismissed them.
        //
        // Scoping is deliberately conservative to avoid wiping ANOTHER
        // plugin's data:
        //   - `tta_` is this plugin's unique namespace prefix, so a
        //     LIKE 'tta\_%' is safe and covers the dynamic ids
        //     (`tta_dismiss_<id>`, `tta_shown_<id>`, `tta_clicked_<id>`)
        //     plus all fixed `tta_*` keys.
        //   - `tts_` is a generic "text-to-speech" abbreviation that
        //     another plugin could legitimately use, so we do NOT do a
        //     blanket `tts_%` delete. Instead we list only the handful of
        //     legacy `tts_*` notice keys this plugin is known to have set.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $wpdb->query( "DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE 'tta\_%'" );

        $legacy_tts_user_meta = array(
            'tts_plugin_voice_and_language_mismatch_dismissed',
            'tts_plugin_features_notice_dismissed',
            'tts_plugin_compatible_notice_dismissed',
            'tts_setup_notice_dismissed',
            'tts_plugin_analytics_notice_dismissed',
        );
        foreach ( $legacy_tts_user_meta as $um_key ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
            $wpdb->query( $wpdb->prepare(
                "DELETE FROM {$wpdb->usermeta} WHERE meta_key = %s",
                $um_key
            ) );
        }

        // 5. Transients
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_tta\_%' OR option_name LIKE '_transient_timeout_tta\_%'" );
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_tts\_%' OR option_name LIKE '_transient_timeout_tts\_%'" );
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_text-to-audio\_%' OR option_name LIKE '_transient_timeout_text-to-audio\_%'" );

        // 6. Cron
        $cron_hooks = array(
            'tta_send_scheduled_report',
            'text-to-audio_tracker_send_event',
            'tta_migrate_play_count_column',
        );
        foreach ( $cron_hooks as $hook ) {
            $timestamp = wp_next_scheduled( $hook );
            if ( $timestamp ) {
                wp_unschedule_event( $timestamp, $hook );
            }
        }

        // 7. Plugin's own cache layer — without this, TTA_Helper::tts_get_settings()
        // returns the pre-reset values from a cached transient and the UI looks
        // unchanged after reload. Safe at uninstall too (no-ops on missing class).
        if ( class_exists( '\\TTA\\TTA_Cache' ) ) {
            \TTA\TTA_Cache::flush();
        }
        // Also flush WP object cache so any per-request options cache lets go.
        wp_cache_flush();
    }
}
