# TTS-232: Session Summary

**Branch:** `feature/TTS-232` (both free and pro plugins)
**Date:** 2026-03-30 to 2026-04-03

---

## Original Ticket

Customer reported: "the time at the player is always 1 minute" and TTS not reading the whole article. Root cause: when "Add Button Automatically" is off and shortcode is used, the `.tts_content_wrapper_X` div isn't created, so JS content extraction fails and only reads the title.

---

## What Was Done

### 1. Content Extraction Fixes (Core TTS-232 Bug)

**Pro plugin — `TTSProHelper.js`:**
- Added `getContentFromCommonSelectors()` — fallback chain with 16 common WordPress/builder CSS selectors when wrapper div not found
- Added `ttsCommonContentSelectors` JS filter hook for developers
- Added `recalculateReadingTime()` — mirrors PHP backend logic (150 WPM, punctuation pauses, speech rate adjustment)
- Added `decodeHTMLEntities()` — fixes smart quotes (`&#8217;` etc.) via textarea decode
- Added `getContentSettingsFingerprint()` — cache invalidation when intro/outro, CSS selectors, exclude tags/texts, or ACF fields change
- Added `[TTS] Cache invalidated` console log for debugging
- Fixed `recalculateReadingTime` for non-DOM and cached content paths
- Updated `window.TTS.contents[buttonId]` with DOM-extracted content when `get_content_from_dom` is enabled

**Free plugin — `helpers.php`:**
- Removed intro/outro from `ttsCurrentContent` for Pro users (JS handles it)
- Added ACF content to `ttsCurrentContent` so it's always present
- Free users still get intro/outro baked in PHP
- Added per-post settings override via inline script (`ttsObj.settings.settings`)
- Skip empty ACF field names in `get_all_acf_fields()`

**Free plugin — `TTA_Helper.php`:**
- Per-post CSS selector merge: field-by-field instead of all-or-nothing
- Empty per-post fields keep global values

**Free plugin — `TTA_Api_Routes.php`:**
- Settings API GET now uses `tts_get_settings('settings')` for consistent data with defaults

**Pro plugin — `TTA_Pro_Filters.php`:**
- Added `tts_should_add_content_wrapper` filter (default true) to control wrapper div creation

### 2. Unicode Smart Quote Fix

**Free plugin — `helpers.php` `tta_clean_content()`:**
- Added actual Unicode characters to `$quotationMarks` array: `\u{201C}`, `\u{201D}`, `\u{2018}`, `\u{2019}`, `\u{201A}`, `\u{201E}`
- Fixes JS string truncation on PHP 8.4+ where `wp_strip_all_tags()` decodes entities to Unicode before replacements run

**Pro plugin — `TextToSpeechPro.js`:**
- Update `window.TTS.contents[buttonId]` with DOM-extracted content when `get_content_from_dom` enabled
- Ensures React player reads correct full content instead of truncated PHP content

### 3. Content Extraction Improvements (Issues A-I)

**Issue A — Title deduplication:** Skip prepending title when DOM content already starts with it
**Issue B — ACF reading time:** Already fixed via `recalculateReadingTime()`
**Issue C — Per-post selector merge:** Field-by-field override
**Issue D — More common selectors:** Added Astra, OceanWP, Beaver Builder, site-main article
**Issue E — More title selectors:** Added wp-block-post-title, elementor-page-title, ast, oceanwp + `ttsTitleSelectors` JS filter
**Issue F — ACF repeater support:** `array_walk_recursive` + `wp_strip_all_tags` in both free and pro
**Issue G — CPT plugin docs:** Filter examples in documentation
**Issue H — UI helper text:** All CSS selector fields + ACF fields in Settings, CSSSelectorsForPosts, Compatibility
**Issue I — Documentation:** Full guide at `plan/docs-content-extraction-guide.md`

### 4. Listening.js Split (Part of TTS-231, done on TTS-232 branch)

Split `Listening.js` from 1486 lines to 9 files:
- `Listening.js` (401 lines — orchestrator)
- `LanguageMapping.js` (229 lines)
- `utils.js` (68 lines)
- `hooks/useMultilingualDetection.js` (64 lines)
- `hooks/useVoiceLoader.js` (255 lines)
- `tts-providers/DefaultPlayerSettings.js` (205 lines)
- `tts-providers/GoogleCloudSettings.js` (107 lines)
- `tts-providers/ElevenLabsSettings.js` (276 lines)
- `tts-providers/ChatGPTSettings.js` (326 lines — moved from chatgpt/)

### 5. MultiSelect Fixes

- Added `?.click()` null safety on `getElementById` calls (MultiSelect.js, GoogleTTS.js)
- Note: scroll-to-top and selection issues in MultiSelect were investigated but reverted — user chose to keep existing behavior

### 6. Per-Post CSS Selectors Meta Box Redesign

**`CSSSelectorsForPosts.js`:** Complete rewrite with inline styles matching AtlasVoice dashboard design:
- White card layout, green toggle switch, clean labels
- Helper text for all 4 fields
- "Use Own CSS Selectors" toggle with explanation of per-post vs global priority
- Full-width Save button with hover effect

### 7. ACF OrderableFieldSelector Component

**New component: `OrderableFieldSelector.js`:**
- Dual-panel layout: Available Fields (left) + Selected (read order, right)
- Select All / Clear All buttons
- ▲ ▼ move up/down buttons for reordering (Pro only)
- Order numbers on selected fields
- Free version: limited to 1 field selection

**`Compatibility.js`:** Replaced MultiSelect with OrderableFieldSelector for ACF fields

**`tts_acf_custom_order` checkbox:** When enabled, ACF fields are read in user's custom order. Default: ACF field group order.

**Pro plugin — `TTA_Pro_Helper.php`:** `acf_plugin_content()` respects `tts_acf_custom_order` flag

### 8. Polylang Compatibility (TTS-231, merged into TTS-232)

- Registered Polylang in `get_compatible_plugins_data()` (free plugin)
- Added `pll_current_language()` to `get_site_language()` (pro plugin)
- Created `TTSPolylang.js` handler (pro plugin)
- Registered in `TTSCompabality.js`, `TextToSpeechPro.js`, `plyr.js`, `bulk-mp3-file.js`
- Added to `useMultilingualDetection.js` and `LanguageMapping.js`

### 9. Research & Documentation

- `plan/research-competitor-content-extraction.md` — How GSpeech, Mementor TTS, ResponsiveVoice extract content
- `plan/TTS-future-content-extraction-improvements.md` — Issues A-I with UI hints and documentation plan
- `plan/docs-content-extraction-guide.md` — Full user/developer documentation
- `plan/TTS-future-multilingual-architecture-refactor.md` — Future multilingual refactor plan

---

## Files Modified

### Free Plugin (text-to-audio)

| File | Changes |
|------|---------|
| `text-to-audio.php` | Version 2.1.13 → 2.1.14 |
| `includes/helpers.php` | Unicode quotes, ACF in ttsCurrentContent, intro/outro logic, per-post inline override |
| `includes/TTA_Helper.php` | Empty ACF skip, per-post merge, Polylang registration |
| `includes/TTA_Hooks.php` | ACF repeater support |
| `api/TTA_Api_Routes.php` | Settings API GET uses tts_get_settings() |
| `admin/TTA_Admin.php` | User modified — global $post |
| `src/dashboard/components/context/OrderableFieldSelector.js` | **New** |
| `src/dashboard/components/context/MultiSelect.js` | Null safety |
| `src/dashboard/components/dashboard/compatibility/Compatibility.js` | OrderableFieldSelector, tts_acf_custom_order |
| `src/dashboard/components/dashboard/settings/Settings.js` | Helper text |
| `src/dashboard/components/dashboard/integrations/GoogleCloudTTS/GoogleTTS.js` | Null safety |
| `src/dashboard/css-selectors/CSSSelectorsForPosts.js` | Full redesign |
| `src/dashboard/components/dashboard/listening/*` | Split (9 files) |
| `plan/*.md` | 5 plan/research documents |

### Pro Plugin (text-to-audio-pro)

| File | Changes |
|------|---------|
| `text-to-audio-pro.php` | Version 3.1.5 → 3.1.6 |
| `Includes/TTA_Pro_Constants.php` | Version 3.1.5 → 3.1.6 |
| `Includes/TTA_Pro_Helper.php` | Polylang, ACF repeater, tts_acf_custom_order |
| `Includes/TTA_Pro_Filters.php` | tts_should_add_content_wrapper filter |
| `Assets/js/TTSProHelper.js` | Content fallback, reading time, entity decode, cache fingerprint, title dedup, title selectors filter |
| `Assets/js/TextToSpeechPro.js` | Polylang compat, window.TTS.contents update |
| `Assets/js/plyr.js` | Polylang compat |
| `Assets/js/bulk-mp3-file.js` | Polylang compat |
| `Assets/js/compatibality/plugins/TTSPolylang.js` | **New** |


## Git Commits (feature/TTS-232)

### Free Plugin
- `035ddbf` — Skip empty ACF field names + null safety
- `7938456` — Content extraction improvements (Issues A-I)
- `bc56c73` — Per-post CSS selector override + Settings API fix
- `8579a30` — Redesign per-post CSS selectors meta box + docs update
- `7f9ebc4` — ACF custom reading order + OrderableFieldSelector improvements
- `c4469bb` — Fix Unicode smart quote truncation + competitor research

### Pro Plugin
- `07822134` — Content fallback chain + frontend reading time recalculation
- `9cacb413` — Content extraction improvements
- `c4103719` — Reading time punctuation pauses, HTML entity decode, cache fingerprint, wrapper filter
- `f53362e0` — ttsTitleSelectors JS filter + updated CSS selectors build
- `f1eb45a3` — Respect tts_acf_custom_order flag
- `8dafa719` — Update window.TTS.contents with DOM-extracted content
