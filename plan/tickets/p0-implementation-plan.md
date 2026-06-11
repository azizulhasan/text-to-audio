# P0 Abandon Rate Reduction — Implementation Plan

## Context

71.4% of Text-to-Audio users abandon the plugin. Root cause: users land on a Settings form after activation and never experience the plugin working. We're implementing 4 P0 items that address the critical first-60-seconds experience and prove ongoing value.

**Implementation order** (dependency-driven):
1. P0-2: Enable Analytics by Default (2 files, prerequisite for widget)
2. P0-4: Deactivation Warning + Custom Reasons (1 file, self-contained)
3. P0-3: Dashboard Widget (2 files, needs analytics data)
4. P0-1: Onboarding Wizard (10+ files, largest item)

**Constraints:**
- All strings: `__('text', 'text-to-audio')` via `@wordpress/i18n` (JS) and `__()` (PHP)
- Wizard CSS: inline style objects in React only — no separate CSS file
- Wizard: separate webpack bundle, NOT added to dashboard bundle
- No React Bootstrap in wizard — native HTML + inline styles (keeps bundle small)
- Backward compatible: only affects new installs

---

## P0-2: Enable Analytics by Default

### File 1: `includes/TTA_Activator.php`

**Line 168:** `"tts_enable_analytics" => false` → `true`
**Line 169:** `"tts_trackable_post_ids" => []` → `"all"`

Only affects new installs — the guard on line 165 (`if ($renew_all_settings || !get_option('tta_analytics_settings'))`) prevents overwriting existing settings.

### File 2: `src/dashboard/components/dashboard/analitics/TrackPostIds.js`

**Line 199:** Change `selectionLimit={isProActive ? 999 : 5}` → `selectionLimit={isProActive ? 999 : 20}`
**Line ~195:** Update toast message string from "5" to "20"

---

## P0-4: Deactivation Warning + Custom Reasons

### File: `text-to-audio.php`

Insert after line 138 (after the `ttsp_fs()` connect_message filter block).

**Filter 1: `deactivation_confirmation_message`**
- Query `{prefix}atlasvoice_analytics` table for total plays and post count
- The `analytics` column uses `maybe_serialize()` (NOT raw JSON), so use PHP `maybe_unserialize()` to read — NOT `JSON_EXTRACT`
- Cache result in transient (1 hour) for performance
- Show: "Your audio player has been used X times... Y posts have audio... Deactivating removes audio immediately."
- Wrap in `if (function_exists('ttsp_fs'))` (Freemius only active when Pro plugin is absent)

**Filter 2: `uninstall_reasons`**
- Replace generic Freemius reasons with 9 TTS-specific reasons:
  voice-quality, no-visitors, too-complex, wrong-language, performance, found-better, temporary, pro-expensive, other
- Reasons with text input: wrong-language ("Which language?"), found-better ("Which plugin?"), other ("Please share...")

---

## P0-3: Dashboard Widget

### New File: `admin/TTA_Dashboard_Widget.php`

Namespace: `TTA_Admin` (PSR-4 autoloaded from `admin/`)

**Class structure:**
```
TTA_Dashboard_Widget
  __construct()        → hooks wp_dashboard_setup
  register_widget()    → wp_add_dashboard_widget('atlasvoice_quick_stats', ...)
  render_widget()      → outputs HTML with inline styles
  get_widget_data()    → queries analytics table, caches in 1-hour transient
```

**Widget HTML (pure PHP, no React):**
- Two stat cards: "Plays Today: X" | "Views Today: X"
- 7-day mini bar chart (CSS `display:inline-block` divs with percentage heights)
- Links: "View Analytics" → `admin.php?page=text-to-audio#/analytics` | "Customize Player" → `#/customize`
- Free users: subtle Pro upsell line ("Unlock listening time, top posts, device analytics")
- Pro users: additionally show total listening time and top post name

**Data query approach:**
- Query `{prefix}atlasvoice_analytics` WHERE `DATE(created_at)` for today / last 7 days
- Use `maybe_unserialize()` on each row's `analytics` column
- Sum `play.count` (plays) and `init.count` (views)
- Cache full result in `atlasvoice_widget_data` transient (1 hour)
- Guard: check table exists before querying

### Modified File: `includes/TTA.php`

In `define_hooks()` after line 127 (after `TTA_Posts_List` block):
```php
if (is_admin()) {
    new \TTA_Admin\TTA_Dashboard_Widget();
}
```

---

## P0-1: Onboarding Wizard (3-Step)

### Architecture

- **Separate webpack entry point** → `admin/js/build/tts-welcome-wizard.min.js`
- Only enqueued when `?page=text-to-audio&welcome=1` AND `tta_onboarding_completed` is not set
- Mounts to `<div id="tts_welcome_wizard">` (replaces `#tts_dashboard_ui` on welcome page)
- Uses own localized data at `window.ttsWizardData` (NOT `ttsObj`)
- Own `wizardFetch()` helper for REST API calls using `ttsWizardData.nonce`
- Native HTML elements + inline styles (no React Bootstrap)

### New Files

**1. `webpack.mix.js`** — Add after line 4:
```js
mix.js('src/dashboard/welcome.js', 'admin/js/build/tts-welcome-wizard.min.js').react();
```

**2. `src/dashboard/welcome.js`** — Entry point
- Import WelcomeWizard component
- Sync translations via `setLocaleData()` (same pattern as `index.js`)
- Mount to `#tts_welcome_wizard`

**3. `src/dashboard/welcome/WelcomeWizard.js`** — Main wizard
- State: `step` (1-4), `settings`, `listening`, `customize`
- Reads initial values from `window.ttsWizardData`
- Step navigation: Back/Next buttons
- On "Finish Setup": 3 parallel REST calls to save settings, listening, customize
- After save: sets `tta_onboarding_completed` flag via settings endpoint
- Renders: step indicator (1/2/3), current step component, navigation buttons

**4. `src/dashboard/welcome/steps/StepPostType.js`** — Step 1
- Radio buttons for each post type from `ttsWizardData.post_types`
- Each shows: label + "(X published)" count
- Default selected: `post`
- Info note: "Free version supports 1 post type. Need multiple? [Learn about Pro]"
- Pro upsell highlights: unlimited post types, AI voices, bulk MP3

**5. `src/dashboard/welcome/steps/StepVoice.js`** — Step 2
- Voice dropdown via `speechSynthesis.getVoices()` + `voiceschanged` event listener
- Language dropdown (derived from available voices)
- "Preview Voice" button: `SpeechSynthesisUtterance` with sample text
- Two info cards: "Browser Voices (Free)" vs "AI Voices (Pro)"
- Pro upsell: Google Cloud TTS, ElevenLabs, ChatGPT — 200+ voices, consistent quality

**6. `src/dashboard/welcome/steps/StepCustomize.js`** — Step 3
- 4 color inputs: background, text, border color, hover background
- Border radius range slider
- Live preview: styled `<div>` button with play icon + sample text
- Info: "Full customization available in the Customize tab anytime"
- Pro upsell: 4 additional player designs, floating positions, MP3 download

**7. `src/dashboard/welcome/steps/StepFinish.js`** — Success
- Checkmark icon + "AtlasVoice is ready!"
- "Your audio player is now live on all your [Posts]."
- Two buttons: "View Player on Your Site" (new tab → latest post) | "Go to Dashboard"

**8. `src/dashboard/welcome/wizardApi.js`** — API helper
```js
export const wizardFetch = async (endpoint, data) => {
    const formData = new FormData();
    formData.append('method', 'post');
    formData.append('fields', JSON.stringify(data));
    const res = await fetch(ttsWizardData.api_url + endpoint, {
        method: 'POST',
        body: formData,
        headers: { 'X-WP-Nonce': ttsWizardData.nonce },
    });
    return res.json();
};
```

### Modified Files

**9. `admin/TTA_Admin.php` — `enqueue_scripts()` (insert before line 180)**

New conditional block: if `page=text-to-audio` AND `welcome=1` AND `!get_option('tta_onboarding_completed')`:
- Register + enqueue `tts-welcome-wizard` script (deps: `wp-element`, `wp-i18n`)
- Localize `ttsWizardData` with:
  - `post_types`: array of `{slug, label, count}` from `get_post_types(['public'=>true])` + `wp_count_posts()`
  - `current_settings`, `current_customize`, `current_listening`: current option values
  - `latest_post_url`: permalink of most recent published post
  - `is_pro_active`, `nonce`, `api_url`, `pro_url`, `dashboard_url`
- `wp_set_script_translations()` for i18n
- `return;` — prevents dashboard bundle from loading when wizard is active

**10. `admin/TTA_Admin.php` — `TTA_settings()` (line 414-417)**

Add conditional before the dashboard div:
```php
if (isset($_GET['welcome']) && $_GET['welcome'] === '1' && !get_option('tta_onboarding_completed')) {
    echo "<div class='wpwrap'><div id='tts_welcome_wizard'></div></div>";
    return;
}
```

**11. `text-to-audio.php` — Activation redirect (lines 351-363)**

Add guard: if `tta_onboarding_completed` is already set, redirect to regular dashboard instead of welcome:
```php
if (get_option('tta_onboarding_completed')) {
    wp_safe_redirect(admin_url('admin.php?page=text-to-audio'));
} else {
    wp_safe_redirect(admin_url('admin.php?page=text-to-audio&welcome=1'));
}
```

**12. `api/TTA_Api_Routes.php` — `tta_manage_settings_data()` (after line 576)**

After `update_option('tta_settings_data', $fields)`, add:
```php
if (isset($fields->tta_onboarding_completed) && $fields->tta_onboarding_completed) {
    update_option('tta_onboarding_completed', true);
}
```

**13. `includes/TTA_Activator.php`** — Add locale-based voice auto-detection

In `activate()`, after the listening settings block (~line 122), add voice locale map:
```php
$locale = get_locale();
$voice_map = [
    'en_US' => ['Google US English', 'en-US'],
    'en_GB' => ['Google UK English Female', 'en-GB'],
    'fr_FR' => ['Google français', 'fr-FR'],
    'de_DE' => ['Google Deutsch', 'de-DE'],
    'es_ES' => ['Google español', 'es-ES'],
    'it_IT' => ['Google italiano', 'it-IT'],
    'pt_BR' => ['Google português do Brasil', 'pt-BR'],
    'ja'    => ['Google 日本語', 'ja-JP'],
    'ko_KR' => ['Google 한국의', 'ko-KR'],
    'zh_CN' => ['Google 普通话（中国大陆）', 'zh-CN'],
];
$voice_defaults = isset($voice_map[$locale]) ? $voice_map[$locale] : ['Google UK English Female', 'en-GB'];
```
Use `$voice_defaults[0]` and `$voice_defaults[1]` for the voice and lang defaults.

---

## File Change Summary

| File | Action | P0 Item |
|------|--------|---------|
| `includes/TTA_Activator.php` | Modify lines 168-169, add voice locale map | P0-2, P0-1 |
| `src/dashboard/components/dashboard/analitics/TrackPostIds.js` | Change limit 5→20 | P0-2 |
| `text-to-audio.php` | Add Freemius filters after L138, modify redirect L351-363 | P0-4, P0-1 |
| `admin/TTA_Dashboard_Widget.php` | **NEW** — PHP dashboard widget class | P0-3 |
| `includes/TTA.php` | Add widget instantiation in `define_hooks()` | P0-3 |
| `webpack.mix.js` | Add welcome wizard entry point | P0-1 |
| `src/dashboard/welcome.js` | **NEW** — React entry point | P0-1 |
| `src/dashboard/welcome/WelcomeWizard.js` | **NEW** — Main wizard component | P0-1 |
| `src/dashboard/welcome/steps/StepPostType.js` | **NEW** — Step 1 | P0-1 |
| `src/dashboard/welcome/steps/StepVoice.js` | **NEW** — Step 2 | P0-1 |
| `src/dashboard/welcome/steps/StepCustomize.js` | **NEW** — Step 3 | P0-1 |
| `src/dashboard/welcome/steps/StepFinish.js` | **NEW** — Success state | P0-1 |
| `src/dashboard/welcome/wizardApi.js` | **NEW** — REST API helper | P0-1 |
| `admin/TTA_Admin.php` | Modify `enqueue_scripts()` + `TTA_settings()` | P0-1 |
| `api/TTA_Api_Routes.php` | Add onboarding flag handler after L576 | P0-1 |

---

## Verification Plan

1. **Fresh activation test:** Delete `tta_has_been_activated_before` + `tta_onboarding_completed` options, deactivate/reactivate → should redirect to welcome wizard
2. **Wizard Step 1:** Post types listed with published counts, radio select works, "Next" advances
3. **Wizard Step 2:** Voices load from browser, preview plays audio, language dropdown works
4. **Wizard Step 3:** Color pickers update live preview in real-time
5. **Finish:** Settings saved to DB (`tta_settings_data`, `tta_listening_settings`, `tta_customize_settings`), `tta_onboarding_completed` = true, "View on Site" opens correct post
6. **Re-visit:** `?welcome=1` redirects to regular dashboard (onboarding completed)
7. **Dashboard widget:** `wp-admin/index.php` shows AtlasVoice widget with stats
8. **Deactivation:** Plugins page → Deactivate → Freemius modal shows custom stats message + TTS-specific reasons
9. **Analytics default:** Fresh install → `tta_analytics_settings` has `tts_enable_analytics: true`
10. **Build:** `npm run production` succeeds, produces `tts-welcome-wizard.min.js`
11. **Translations:** `npm run makepot` extracts all new `__()` strings
