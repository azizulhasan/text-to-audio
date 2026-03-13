# Plan: Telemetry Enrichment — Plugin Usage Data Collection

## Context

The AtlasAiDev tracker currently collects only generic server/environment data (PHP version, WP version, active plugins, site URL, admin email). It tells us nothing about how users actually configure and use AtlasVoice. We need plugin-specific usage telemetry to make data-driven product decisions: which features matter, which providers are popular, where users struggle. All data is opt-in (AtlasAiDev's existing consent flow) and anonymized (no post content, no API keys, just counts and boolean flags).

## Approach

- Hook into the existing `text-to-audio_tracker_data` filter (Insights.php line 324) in both wrapper classes
- Add a new `get_plugin_telemetry()` method to each wrapper class
- Use inline PHP comments documenting each data group's business benefit (best practice — keeps docs next to the code that produces the data, no separate file needed)
- Update `data_we_collect()` disclosure text so users see what's tracked
- Pro wrapper collects Groups 1–4; Free wrapper collects Groups 1–2 only

## Files to Modify

1. **`text-to-audio/includes/TTA_Lib_AtlasAiDev.php`** — add `get_plugin_telemetry()` + filter hook + update `data_we_collect()`
2. **`text-to-audio-pro/Includes/TTA_Pro_Lib_AtlasAiDev.php`** — add `get_plugin_telemetry()` + filter hook + update `data_we_collect()`

## Data Groups

### Group 1: Core Engagement — "Is the plugin actually working for users?"
Helps identify silent failures and measure real adoption.

```php
'av_player_id'            => // Which TTS engine is active (1-6). Reveals provider popularity.
'av_has_audio_plays'      => // (bool) Whether any listening has been tracked. Detects "installed but never used".
'av_total_posts_with_btn' => // Count of posts where button loads. Measures content coverage.
'av_analytics_enabled'    => // (bool) Whether analytics tracking is on. Measures analytics feature adoption.
```

### Group 2: Feature Adoption — "Which features matter?"
Drives roadmap prioritization — invest in what users actually use.

```php
'av_enabled_post_types'   => // Comma-separated list (e.g. "post,page,product"). Shows which content types use TTS.
'av_button_position'      => // "before_content", "after_content", or "custom". Reveals preferred placement.
'av_has_aliases'          => // (bool) Whether text aliases are configured. Measures pronunciation correction usage.
'av_uses_css_selectors'   => // (bool) Custom CSS selectors for content targeting. Measures advanced usage.
'av_uses_exclude_rules'   => // (bool) Has excluded posts, categories, or tags. Measures filtering usage.
'av_reads_from_dom'       => // (bool) "Read content from DOM" setting. Affects how content is parsed.
'av_includes_title'       => // (bool) "Add post title to read" setting.
'av_download_enabled'     => // (bool) Whether MP3 download is allowed for visitors.
'av_has_custom_css'       => // (bool) Whether custom CSS is added to button. Measures styling needs.
'av_onboarding_completed' => // (bool) Whether the setup wizard was completed. Measures onboarding effectiveness.
```

### Group 3: Pro Provider Intelligence (Pro only) — "Which premium providers are popular?"
Guides API partnerships, pricing, and provider investment.

```php
'av_pro_provider'            => // Provider name string. Shows which premium engine is chosen.
'av_gcloud_connected'        => // (bool) Google Cloud auth data exists.
'av_openai_connected'        => // (bool) ChatGPT/OpenAI provider selected (player_id=5).
'av_elevenlabs_connected'    => // (bool) ElevenLabs API key exists.
'av_gcs_backup_enabled'      => // (bool) Google Cloud Storage backup for MP3 files.
'av_voice_name'              => // Selected voice name. Reveals voice preferences across user base.
'av_voice_language'          => // Selected language code. Shows geographic/language distribution.
```

### Group 4: Environment & Compatibility (Pro only) — "What breaks and why?"
Proactively detect conflicts before they become support tickets.

```php
'av_has_cache_plugin'        => // (bool) Any known cache plugin active. Cache plugins cause the most compat issues.
'av_cache_plugins'           => // Comma-separated names of detected cache plugins.
'av_has_multilingual_plugin' => // (bool) WPML, TranslatePress, GTranslate, or Polylang detected.
'av_multilingual_plugin'     => // Name of the multilingual plugin.
'av_has_page_builder'        => // (bool) Elementor, Divi, WPBakery, or Beaver Builder detected.
```

## Implementation Details

### In `insightInit()` of each wrapper class:

```php
add_filter( $projectSlug . '_tracker_data', array( $this, 'get_plugin_telemetry' ), 10, 1 );
```

### `get_plugin_telemetry()` method (Free plugin — Groups 1 & 2):

Reads from:
- `tta_settings_data` — post types, CSS selectors, exclude rules, DOM reading, title inclusion
- `tta_customize_settings` → `buttonSettings` — button position, download permissions
- `tta_listening_settings` — voice name, language
- `tta_analytics_settings` — analytics enabled flag
- `tts_text_aliases` — alias existence check
- `tta_onboarding_completed` — onboarding flag
- `TTA_Helper::get_player_id()` or fallback to `tta_listening_settings` player detection

### `get_plugin_telemetry()` method (Pro plugin — Groups 1–4):

Same as free, plus reads from:
- `TTA_Pro_Helper::get_player_id()` — active provider ID
- `tta_gtts_auth_data` — Google Cloud connection status
- `elevenlabs_tts` — ElevenLabs API key existence
- `tts_is_backup_mp3_file` — GCS backup flag
- Active plugins list scan for cache/multilingual/page-builder plugins

### `data_we_collect()` update:

Add these disclosure lines:
- `'Which text-to-speech engine and voice settings are selected.'`
- `'Feature usage flags (analytics, aliases, download, CSS selectors — no content data).'`
- Pro additionally: `'Connected TTS provider status and detected compatibility plugins.'`

## Implementation Order

1. Add `get_plugin_telemetry()` method + filter hook to **free** wrapper (`TTA_Lib_AtlasAiDev.php`)
2. Update `data_we_collect()` in free wrapper
3. Add `get_plugin_telemetry()` method + filter hook to **pro** wrapper (`TTA_Pro_Lib_AtlasAiDev.php`)
4. Update `data_we_collect()` in pro wrapper
5. Test in browser — verify tracking payload via Network tab
6. Rebuild both plugins (`npm run production && npm run build`)

## Verification

1. Enable tracking opt-in on the test site
2. Trigger a tracking send (call `trackerOptIn(true)` or wait for weekly cycle)
3. Inspect the POST to `https://track.atlasaidev.com/wp-json/atlasaidev_tracker/v1/tracker/track`
4. Confirm all `av_*` fields are present in the payload with correct values
5. Confirm `data_we_collect()` admin notice shows updated disclosure text
