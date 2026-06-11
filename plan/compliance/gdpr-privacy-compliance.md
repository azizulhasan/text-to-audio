# Plan: GDPR & Privacy Compliance (6 Rules)

## Context

The plugins collect user analytics (browser fingerprint IDs, listening events, device info) in a custom DB table `{prefix}atlasvoice_analytics`, and telemetry data via AtlasAiDev tracker. WordPress requires plugins to integrate with its Privacy tools (Tools > Export/Erase Personal Data) and clean up on uninstall. Neither plugin previously implemented any of these hooks.

## Files Modified

1. **`text-to-audio/includes/TTA.php`** — privacy hooks registration (policy content, exporter, eraser)
2. **`text-to-audio/uninstall.php`** — complete uninstall cleanup for free plugin
3. **`text-to-audio-pro/uninstall.php`** — NEW file, uninstall cleanup for pro plugin

## Changes Implemented

### 1. Privacy Policy Content (`wp_add_privacy_policy_content`)

Registered suggested privacy policy text in the free plugin's `TTA` class via `admin_init` hook.

**Policy text covers:**
- What analytics data is collected (browser fingerprint, listening events, device type, duration)
- That the identifier is pseudonymous (not tied to email/name/IP)
- Optional telemetry is opt-in only (anonymized config data, no visitor data)
- Data retention policy (stored until admin clears or uninstalls)

### 2. Personal Data Exporter (`wp_privacy_personal_data_exporters`)

Registered exporter hook that returns empty results. Analytics uses browser fingerprints (FingerprintJS hashes) that cannot be tied to email addresses, so no matching data exists for WordPress's email-based export requests.

### 3. Personal Data Eraser (`wp_privacy_personal_data_erasers`)

Registered eraser hook that returns "no items found" with explanation message. Same pseudonymous fingerprint rationale as the exporter.

### 4. Uninstall Cleanup — Free Plugin (`text-to-audio/uninstall.php`)

Complete cleanup on plugin deletion:

- **30+ known options** deleted (settings, customize, listening, analytics, tracking, onboarding, notices)
- **Dynamic options** via SQL LIKE (`tta_reshow_%`, `tta_clicks_%`)
- **Analytics table** dropped (`{prefix}atlasvoice_analytics`)
- **Post meta** deleted (`tts_mp3_file_urls`, `tts_is_mp3_file_url_exists`, `atlasVoice_analytics`)
- **Transients** cleaned (`tta_%`, `tts_%`, `text-to-audio_%`)
- **Cron jobs** unscheduled (`tta_send_scheduled_report`, `text-to-audio_tracker_send_event`)

### 5. Uninstall Cleanup — Pro Plugin (`text-to-audio-pro/uninstall.php`)

NEW file. Deletes pro-specific data (free plugin handles shared data):

- **Pro options** deleted (`tta_gtts_auth_data`, `chat_gpt_tts`, `elevenlabs_tts`, `tta_gtts_voices`, `tts_cloud_storage_bucket_name`, `tts_is_backup_mp3_file`, `tts_auth_file_name`, `is_tta_installed`, `TTA_PRO_VERSION`, `text-to-audio_wc_am_migrated`, `tta_duplicate_post_ids`, pro tracker options)
- **Post meta** deleted (`atlas_voice_post_all_contents`, `tts_pro_custom_css_selectors`, `tts_mp3_file_regenerate_meta_keys`)
- **Upload directory** recursively removed (`wp-content/uploads/TTA_Pro/` — all generated MP3s and GCS auth file)
- **Transients** cleaned (`tts_pro_%`, `mp3_generation_lock__%`, `text-to-audio-pro_%`)
- **Cron jobs** unscheduled (`license_valid_cron_hook`)

### 6. Data Retention Note

Documented in privacy policy text that analytics data has no automatic expiration. Site admins can clear via plugin settings or by uninstalling. All plugin data is permanently deleted on uninstall.

## Verification

1. Settings > Privacy > Privacy Policy page — AtlasVoice suggested text appears
2. Tools > Export Personal Data — AtlasVoice exporter is listed
3. Tools > Erase Personal Data — AtlasVoice eraser is listed
4. Deactivate + Delete free plugin — all options, table, post meta, transients, cron jobs removed
5. Deactivate + Delete pro plugin — pro options, upload dirs, post meta removed
