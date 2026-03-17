# Blueprint: Reusable Setup Wizard Pattern for AtlasAiDev Plugins

## Purpose

This document is a **complete, self-contained reference** for building setup wizards, telemetry systems, deactivation flows, and uninstall handlers for any AtlasAiDev WordPress plugin. A new Claude session (or developer) should be able to start immediate development from this document alone.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Setup Wizard System](#2-setup-wizard-system)
3. [Telemetry & Tracking System](#3-telemetry--tracking-system)
4. [Deactivation Flow (Single Form, Dual Submission)](#4-deactivation-flow)
5. [Uninstall / Cleanup System](#5-uninstall--cleanup-system)
6. [Abandon Rate Reduction Strategy](#6-abandon-rate-reduction-strategy)
7. [Cross-Promo System](#7-cross-promo-system)
8. [Brand & Design System](#8-brand--design-system)
9. [Plugin-Specific Implementations](#9-plugin-specific-implementations)
10. [File Templates & Contracts](#10-file-templates--contracts)

---

## 1. Architecture Overview

### Dual-Plugin Model (Free + Pro)

Every AtlasAiDev plugin follows a **free + pro** architecture:

```
wp-content/plugins/
  {plugin-slug}/              ← Free plugin (wordpress.org)
    text-to-audio.php         ← Entry point, Freemius init (if Pro NOT active)
    uninstall.php             ← Fallback cleanup (when Freemius not loaded)
    includes/
      TTA_Activator.php       ← Activation hook, default settings, onboarding flag
      TTA_Lib_AtlasAiDev.php  ← Telemetry wrapper, deactivation hooks
    libs/AtlasAiDev/
      Insights.php            ← Core tracking + deactivation modal engine
    src/dashboard/
      welcome.js              ← Wizard mount point
      welcome/                ← Free wizard components
  {plugin-slug}-pro/          ← Pro plugin (premium add-on)
    text-to-audio-pro.php     ← Entry point, Freemius init (admin only)
    uninstall.php             ← Fallback cleanup
    Includes/
      TTA_Pro_Activator.php   ← Pro activation, sets onboarding flag
      TTA_Pro_Actions.php     ← Script enqueue, wizard localization
      TTA_Pro_Lib_AtlasAiDev.php ← Pro telemetry wrapper
    Libs/AtlasAiDev/
      Insights.php            ← Same engine, pro copy
    src/pro-wizard/           ← Pro wizard components
```

### Shared Infrastructure

| Component | Library | Location |
|-----------|---------|----------|
| Licensing/Payments | Freemius SDK | `freemius/` in both plugins |
| Telemetry/Tracking | AtlasAiDev AppService | `libs/AtlasAiDev/` (free), `Libs/AtlasAiDev/` (pro) |
| License Management | AtlasAiDev Pro Client | `Libs/AtlasAiDev/` (pro only) |
| Plugin Updates | AtlasAiDev Pro Updater | `Libs/AtlasAiDev/` (pro only) |

### Key Integration Points

- **Freemius ID:** Both free and pro share the same Freemius ID (e.g., `13388`) so Freemius recognizes the relationship
- **Freemius loads in ONE plugin only:** Free loads Freemius if pro is NOT active; Pro loads Freemius if `is_admin()` and free hasn't already loaded it
- **AtlasAiDev UUID:** Both plugins share the same UUID (e.g., `dec06622-980f-4674-8b08-72e23cc9e70f`)
- **Tracking endpoint:** `https://track.atlasaidev.com/wp-json/atlasaidev_tracker/v1/`

---

## 2. Setup Wizard System

### 2.1 Trigger Logic

| Scenario | Behavior |
|----------|----------|
| Free plugin activated (fresh install) | Free wizard (simpler, fewer steps) |
| Pro plugin activated for first time | Pro wizard (dynamic steps, provider selection) |
| "Run Setup Wizard" clicked, Pro active | Pro wizard |
| "Run Setup Wizard" clicked, Pro inactive | Free wizard |
| `?reset_onboard=true` URL param | Deletes BOTH onboarding flags, shows wizard again |

### WordPress Options for Onboarding State

```php
// Free plugin onboarding
'tta_onboarding_completed'     // bool, autoload=false
// Set false on activation → true when wizard finishes or user clicks "Skip"

// Pro plugin onboarding
'tta_pro_onboarding_completed' // bool, autoload=false
// Set false on pro activation → true via REST endpoint when wizard finishes
```

### 2.2 Free Wizard Architecture

**Entry:** `src/dashboard/welcome.js` → mounts at `#tts_welcome_wizard`
**Bundle:** `admin/js/build/tts-welcome-wizard.min.js`
**Webpack:** `mix.js('src/dashboard/welcome.js', 'admin/js/build/tts-welcome-wizard.min.js').react()`
**Dependencies:** `['wp-element', 'wp-i18n']`

**Fixed 5 Steps + Finish:**

| Step | Component | Purpose | Key State |
|------|-----------|---------|-----------|
| 1 | StepPostType | Single post type selection (radio) | `settings.postType` (string) |
| 2 | StepVoice | Browser voice + language picker with preview | `listening.{voice, lang, pitch, rate, volume}` |
| 3 | StepHearDifference | Free vs Pro voice comparison demos | Read-only (upsell) |
| 4 | StepCustomize | Player colors + border radius | `customize.{backgroundColor, color, border_color, borderRadius}` |
| 5 | StepAnalytics | Enable tracking, select posts (max 20 free) | `analytics.{enableAnalytics, trackablePostIds}` |
| Finish | StepFinish | Summary, "View Player", cross-promo | — |

**Localized Data (`ttsWizardData`):**
```php
wp_localize_script('tts-welcome-wizard', 'ttsWizardData', [
    'post_types'          => [...],  // [{slug, label, count}]
    'recent_posts_by_type'=> [...],  // keyed by slug
    'current_settings'    => get_option('tta_settings_data', []),
    'current_customize'   => get_option('tta_customize_settings', []),
    'current_listening'   => get_option('tta_listening_settings', []),
    'latest_post_url'     => $url,
    'is_pro_active'       => (bool),
    'is_pro_wizard'       => (bool),
    'nonce'               => wp_create_nonce('wp_rest'),
    'api_url'             => rest_url('tta/v1/'),
    'pro_url'             => 'https://atlasaidev.com/plugins/...',
    'dashboard_url'       => admin_url('admin.php?page=text-to-audio'),
    'site_locale'         => get_locale(),
    'plugin_url'          => WP_PLUGIN_URL . '/text-to-audio',
    'admin_url'           => admin_url('/'),
]);
```

### 2.3 Pro Wizard Architecture

**Entry:** `src/pro-wizard/index.js` → mounts via `MutationObserver` at dynamic div
**Bundle:** `Assets/js/build/pro-wizard.min.js`
**Webpack:** `mix.js('src/pro-wizard/index.js', 'Assets/js/build/pro-wizard.min.js').react()`
**Dependencies:** `['wp-element', 'wp-i18n', 'tts-welcome-wizard']` (depends on free bundle)

**Dynamic 4-5 Steps + Finish:**

| Step | Component | Purpose | Skip Condition |
|------|-----------|---------|----------------|
| 1 | StepProPostType | Multi-select post types (checkboxes) | Never |
| 2 | StepProvider | Provider cards + production toggle | Never |
| 3 | StepProVoice | Provider-specific voice/lang/model/API key | Never |
| 4 | StepPlayerSettings | Date range + download permissions | Skipped when Player ID 2 (WebSpeech) |
| 5 | StepProAnalytics | Analytics + email digest | Never |
| Finish | StepProFinish | Summary, multilingual detection, cross-promo | — |

**Dynamic Step System:**
```javascript
const buildSteps = (selectedPlayerId) => {
    const isDefaultPro = selectedPlayerId === '2';
    const allSteps = [
        { id: 'postType' },
        { id: 'provider' },
        { id: 'voice' },
        { id: 'playerSettings', skip: isDefaultPro },
        { id: 'analytics' },
    ];
    return allSteps.filter((s) => !s.skip);
};

const activeSteps = buildSteps(selectedPlayerId);
const TOTAL_STEPS = activeSteps.length;        // 4 or 5
const currentStepId = activeSteps[step - 1]?.id;
const FINISH_STEP = TOTAL_STEPS + 1;
```

**Pro Wizard State:**
```javascript
const [step, setStep] = useState(1);
const [selectedPostTypes, setSelectedPostTypes] = useState([]);
const [selectedPlayerId, setSelectedPlayerId] = useState('3');
const [selectedLang, setSelectedLang] = useState('');
const [selectedVoice, setSelectedVoice] = useState('');
const [selectedModel, setSelectedModel] = useState('');
const [dateFrom, setDateFrom] = useState('');
const [dateTo, setDateTo] = useState('');
const [downloadPermission, setDownloadPermission] = useState(['all']);
const [enableAnalytics, setEnableAnalytics] = useState(true);
const [trackAllPosts, setTrackAllPosts] = useState(true);
const [digestEnabled, setDigestEnabled] = useState(false);
const [digestFrequency, setDigestFrequency] = useState('weekly');
const [digestEmail, setDigestEmail] = useState('');
const [providerAuthenticated, setProviderAuthenticated] = useState(false);
```

**Localized Data (`ttsProWizardData`):**
```php
wp_localize_script('tts-pro-wizard', 'ttsProWizardData', [
    'post_types'              => [...],
    'current_settings'        => get_option('tta_settings_data', []),
    'current_customize'       => get_option('tta_customize_settings', []),
    'current_listening'       => get_option('tta_listening_settings', []),
    'current_analytics'       => get_option('tta_analytics_settings', []),
    'current_schedule_report' => get_option('tta_schedule_report_settings', []),
    'admin_email'             => get_option('admin_email'),
    'nonce'                   => wp_create_nonce('wp_rest'),
    'api_url'                 => rest_url('tta/v1/'),
    'pro_api_url'             => rest_url('tta_pro/v1/'),
    'dashboard_url'           => admin_url('admin.php?page=text-to-audio'),
    'latest_post_url'         => $url,
    'compatible'              => [...],  // detected multilingual plugins
    'is_gc_authenticated'     => (bool),
    'gc_service_account'      => $client_email,
    'chatgpt_has_key'         => (bool),
    'elevenlabs_has_key'      => (bool),
    'site_locale'             => get_locale(),
]);
```

### 2.4 API Calls on Finish

**Free wizard saves (all to `tta/v1/`):**
1. `POST /tta/v1/settings` — post types
2. `POST /tta/v1/listening` — voice/language
3. `POST /tta/v1/customize` — player colors
4. `POST /tta/v1/save_analytics_settings` — analytics config

**Pro wizard saves:**
1. `POST /tta/v1/settings` — post types
2. `POST /tta/v1/customize` — player ID, date range, download perms
3. `POST /tta/v1/listening` — voice, language, model
4. `POST /tta/v1/save_analytics_settings` — analytics
5. `POST /tta/v1/save_schedule_report` — email digest
6. `POST /tta_pro/v1/mark_pro_onboarding_complete` — sets flag to true

**API Helper Pattern (`wizardApi.js`):**
```javascript
// FormData-based (most endpoints)
export async function wizardFetch(endpoint, data) {
    const fd = new FormData();
    fd.append('fields', JSON.stringify(data));
    const res = await fetch(`${wizardData.api_url}${endpoint}`, {
        method: 'POST',
        headers: { 'X-WP-Nonce': wizardData.nonce },
        body: fd,
    });
    return safeJSON(res); // handles PHP warnings mixed with JSON
}

// JSON-based (schedule report, etc.)
export async function postJSON(endpoint, data) {
    const res = await fetch(`${wizardData.api_url}${endpoint}`, {
        method: 'POST',
        headers: {
            'X-WP-Nonce': wizardData.nonce,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return safeJSON(res);
}

// safeJSON strips PHP warnings before JSON.parse
function safeJSON(response) {
    const text = await response.text();
    const jsonStart = text.indexOf('{');
    if (jsonStart > 0) return JSON.parse(text.substring(jsonStart));
    return JSON.parse(text);
}
```

### 2.5 Step Component Contract

```jsx
// Every step component follows this contract:
const StepExample = ({
    data,           // Current step's state slice (or individual props)
    onChange,        // Callback to update parent state (free wizard pattern)
    wizardData,     // Localized PHP data (post types, settings, etc.)
    // OR individual props for pro wizard:
    selectedPlayerId, setSelectedPlayerId,
    selectedLang, setSelectedLang,
    // etc.
}) => {
    return (
        <div>
            <h2 className="wizard-step-heading">{heading}</h2>
            <p className="wizard-step-description">{description}</p>
            {/* Step-specific form fields */}
        </div>
    );
};
```

### 2.6 Wizard Container Contract

```jsx
const WizardContainer = () => {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    const totalSteps = N; // or dynamic via buildSteps()
    const isFinish = step === totalSteps + 1;

    const goNext = () => {
        if (step < totalSteps) setStep(step + 1);
        else handleFinish();
    };
    const goBack = () => step > 1 && setStep(step - 1);

    const handleFinish = async () => {
        setSaving(true);
        // 1. Save all settings via REST API (parallel where possible)
        await Promise.all([
            wizardFetch('settings', settingsData),
            wizardFetch('listening', listeningData),
            wizardFetch('customize', customizeData),
        ]);
        // 2. Save analytics
        await saveAnalytics(analyticsData);
        // 3. Mark onboarding complete
        await markOnboardingComplete();
        setSaving(false);
        setStep(totalSteps + 1); // Show finish screen
    };

    const handleSkip = async () => {
        await markOnboardingComplete();
        window.location.href = wizardData.dashboard_url;
    };

    return (
        <div className="wizard-shell">
            <WizardHeader step={step} totalSteps={totalSteps} />
            <ProgressBar current={step} total={totalSteps} />
            {isFinish ? <FinishScreen /> : renderStep(step)}
            <WizardFooter
                step={step}
                totalSteps={totalSteps}
                onBack={goBack}
                onNext={goNext}
                onSkip={handleSkip}
            />
        </div>
    );
};
```

### 2.7 PHP Backend Contract

```php
// In Activator class (on plugin activation):
class Plugin_Activator {
    public static function activate() {
        // Set onboarding flag
        if (!get_option('plugin_onboarding_completed')) {
            update_option('plugin_onboarding_completed', false, false);
        }
        // Set activation redirect transient
        set_transient('plugin_activation_redirect', true, 30);
        // Initialize default settings...
    }
}

// In Admin/Actions class (on admin page load):
public function enqueue_wizard() {
    if (!isset($_GET['welcome']) || $_GET['welcome'] !== '1') return;
    if (get_option('plugin_onboarding_completed')) return;

    wp_enqueue_script('plugin-wizard', $bundle_url, ['wp-element', 'wp-i18n'], $ver, true);
    wp_localize_script('plugin-wizard', 'wizardData', [
        'post_types'       => $this->get_post_types_with_count(),
        'current_settings' => get_option('plugin_settings', []),
        'nonce'            => wp_create_nonce('wp_rest'),
        'api_url'          => rest_url('plugin/v1/'),
        'dashboard_url'    => admin_url('admin.php?page=plugin-slug'),
        'is_pro_active'    => class_exists('Plugin_Pro'),
    ]);
}

// REST endpoint to mark onboarding complete:
register_rest_route('plugin_pro/v1', '/mark_onboarding_complete', [
    'methods'  => 'POST',
    'callback' => function() {
        update_option('plugin_onboarding_completed', true, false);
        return rest_ensure_response(['status' => true]);
    },
    'permission_callback' => function() {
        return current_user_can('manage_options');
    },
]);

// Reset handler (in main plugin file):
if (isset($_GET['reset_onboard']) && $_GET['reset_onboard'] === 'true') {
    delete_option('plugin_onboarding_completed');
    delete_option('plugin_pro_onboarding_completed');
    wp_redirect(admin_url('admin.php?page=plugin-slug&welcome=1'));
    exit;
}
```

---

## 3. Telemetry & Tracking System

### 3.1 Architecture

```
Plugin Entry → Lib_AtlasAiDev::init() → insightInit()
  ├── Hooks: {slug}_tracker_data filter → get_plugin_telemetry()
  ├── Hooks: {slug}_what_tracked filter → data_we_collect()
  ├── Hooks: AtlasAiDev_{slug}_freemius_deactivation_data filter
  └── Hooks: Support ticket filters (email, template, URL)
```

**Tracking Flow:**
1. User opts in via admin notice (or wizard enables it)
2. Weekly cron fires `{slug}_tracker_send_event`
3. Insights.php collects base data (server, WP, plugins)
4. Filter `{slug}_tracker_data` adds plugin-specific telemetry
5. Data POSTed to `https://track.atlasaidev.com/wp-json/atlasaidev_tracker/v1/tracker/track`

### 3.2 Telemetry Data Groups

**Group 1: Core Engagement** — "Is the plugin actually working?"

```php
'av_player_id'            => (int) TTA_Helper::get_player_id(),
'av_has_audio_plays'      => (bool) analytics shows any plays,
'av_total_posts_with_btn' => (int) count of post types with button,
'av_analytics_enabled'    => (bool) analytics toggle on/off,
```

**Group 2: Feature Adoption** — "Which features matter?"

```php
'av_enabled_post_types'   => (string) "post,page,product",
'av_button_position'      => (string) "before_content" | "after_content" | "custom",
'av_has_aliases'          => (bool) text aliases configured,
'av_uses_css_selectors'   => (bool) custom CSS selector rules,
'av_uses_exclude_rules'   => (bool) excluded posts/categories/tags,
'av_reads_from_dom'       => (bool) DOM vs server-side content parsing,
'av_includes_title'       => (bool) post title in audio,
'av_download_enabled'     => (bool) MP3 download allowed,
'av_has_custom_css'       => (bool) custom button CSS,
'av_onboarding_completed' => (bool) wizard completed,
```

**Group 3: Pro Provider Intelligence** (Pro only)

```php
'av_pro_provider'         => (string) provider name mapping,
'av_gcloud_connected'     => (bool) Google Cloud auth exists,
'av_openai_connected'     => (bool) OpenAI/ChatGPT active,
'av_elevenlabs_connected' => (bool) ElevenLabs API key set,
'av_gcs_backup_enabled'   => (bool) GCS backup on,
'av_voice_name'           => (string) selected voice name,
'av_voice_language'       => (string) language code,
```

**Group 4: Environment & Compatibility** (Pro only)

```php
'av_has_cache_plugin'        => (bool),
'av_cache_plugins'           => (string) comma-separated names,
'av_has_multilingual_plugin' => (bool),
'av_multilingual_plugin'     => (string) plugin name,
'av_has_page_builder'        => (bool),
```

**Detected plugins:**
- Cache: autoptimize, litespeed, wp-rocket, w3-total-cache, wp-optimize, sg-optimizer, wp-super-cache
- Multilingual: wpml, translatepress, gtranslate, polylang
- Page builders: elementor, divi, wpbakery, beaver-builder, bricks

### 3.3 Implementation Pattern

```php
class Plugin_Lib_AtlasAiDev {
    public function insightInit() {
        $projectSlug = $this->client->getSlug(); // e.g., 'text-to-audio'

        // 1. Telemetry enrichment
        add_filter($projectSlug . '_tracker_data', [$this, 'get_plugin_telemetry']);

        // 2. Disclosure text
        add_filter($projectSlug . '_what_tracked', [$this, 'data_we_collect']);

        // 3. Freemius deactivation data
        add_filter('AtlasAiDev_' . $projectSlug . '_freemius_deactivation_data', function() {
            if (function_exists('ttsp_fs')) {
                $fs = ttsp_fs();
                return [
                    'action'    => $fs->get_ajax_action('submit_uninstall_reason'),
                    'security'  => $fs->get_ajax_security('submit_uninstall_reason'),
                    'module_id' => $fs->get_id(),
                ];
            }
            return [];
        });

        // 4. Support ticket config
        add_filter('AtlasAiDev_' . $projectSlug . '_Support_Ticket_Recipient_Email', ...);
        add_filter('AtlasAiDev_' . $projectSlug . '_Support_Page_URL', ...);
    }

    public function get_plugin_telemetry($data) {
        $settings = get_option('tta_settings_data', []);
        $customize = get_option('tta_customize_settings', []);
        // ... read options and populate $data with av_* fields
        return $data;
    }

    public function data_we_collect($items) {
        $items[] = 'Which text-to-speech engine and voice settings are selected.';
        $items[] = 'Feature usage flags (analytics, aliases, download, CSS selectors — no content data).';
        // Pro adds: 'Connected TTS provider status and detected compatibility plugins.'
        return $items;
    }
}
```

### 3.4 Privacy & Consent

- Tracking is **opt-in** (admin notice on first load)
- Option: `{slug}_allow_tracking` = 'yes' | 'no'
- Notice dismissal: `{slug}_tracking_notice` = 'hide'
- Weekly cron: `{slug}_tracker_send_event`
- Minimum interval: 1 week (filterable)
- Skipped on local servers (127.0.0.1/::1)
- No tracking during AJAX requests

---

## 4. Deactivation Flow

### 4.1 Single Form, Dual Submission

**Problem:** Both Freemius and AtlasAiDev show deactivation modals → confusing double-modal.
**Solution:** Disable Freemius modal, use AtlasAiDev's modal, submit to BOTH trackers.

**Flow:**
```
User clicks "Deactivate"
  → Rescue Modal (custom, shows usage stats)
  → "Continue to Deactivate"
  → AtlasAiDev Deactivation Modal:
      - Inline support banner (not overlay)
      - 8 deactivation reasons with optional text input
      - "Submit & Deactivate" / "I rather wouldn't say" / "Cancel"
  → On submit: parallel POST to AtlasAiDev + Freemius
  → Plugin deactivates
```

### 4.2 Disabling Freemius Modal

```php
// In both plugin entry files, after Freemius init:
ttsp_fs()->add_filter('show_deactivation_feedback_form', '__return_false');
// or for free:
tts_fs()->add_filter('show_deactivation_feedback_form', '__return_false');
```

### 4.3 Freemius Data Bridge

**PHP (in Insights.php `deactivate_scripts()`):**
```php
$freemius_data = apply_filters(
    'AtlasAiDev_' . $this->client->getSlug() . '_freemius_deactivation_data',
    []
);
if (!empty($freemius_data)) {
    echo '<script>window._fsDeactivationData = ' . wp_json_encode($freemius_data) . ';</script>';
}
```

**JS (in `_ajax()` function, parallel submission):**
```javascript
// Reason ID mapping: AtlasAiDev → Freemius
const fsReasonMap = {
    'could-not-understand':     10,
    'found-better-plugin':      2,
    'not-have-that-feature':    11,
    'is-not-working':           12,
    'looking-for-other':        13,
    'did-not-work-as-expected': 14,
    'debugging':                15,
    'other':                    7,
    'no-comment':               7,
    'none':                     7,
};

// Send to Freemius via sendBeacon (survives page navigation)
if (window._fsDeactivationData && data.reason_id) {
    var fd = new FormData();
    fd.append('action', window._fsDeactivationData.action);
    fd.append('security', window._fsDeactivationData.security);
    fd.append('module_id', window._fsDeactivationData.module_id);
    fd.append('reason_id', fsReasonMap[data.reason_id] || 7);
    fd.append('reason_info', data.reason_info || '');
    fd.append('is_anonymous', '0');
    navigator.sendBeacon(ajaxurl, fd);
}

// Then send to AtlasAiDev via regular AJAX
$.ajax({ url: ajaxurl, type: 'POST', data: { ... } });
```

### 4.4 Deactivation Reasons (TTS-specific)

| ID | Text | Input Type |
|----|------|-----------|
| `could-not-understand` | "I couldn't understand how to make it work" | textarea |
| `found-better-plugin` | "I found a better plugin" | text |
| `not-have-that-feature` | "The plugin is great, but I need specific feature..." | textarea |
| `is-not-working` | "The plugin is not working" | textarea |
| `looking-for-other` | "It's not what I was looking for" | none |
| `did-not-work-as-expected` | "The plugin didn't work as expected" | textarea |
| `debugging` | "Temporary deactivation for debugging" | none |
| `other` | "Other" | textarea |

### 4.5 Rescue Modal (Usage Stats Warning)

```php
ttsp_fs()->add_filter('deactivation_confirmation_message', function() {
    // Query real usage stats
    $total_plays = /* analytics query */;
    $affected_posts = /* count posts with player */;

    $msg = '';
    if ($total_plays > 0) {
        $msg .= sprintf('Your audio player has been used %d times. ', $total_plays);
    }
    if ($affected_posts > 0) {
        $msg .= sprintf('%d posts currently have audio players. ', $affected_posts);
    }
    $msg .= 'Deactivating will remove audio from all posts immediately.';
    return $msg;
});
```

---

## 5. Uninstall / Cleanup System

### 5.1 The Freemius Override Problem

**Problem:** Freemius SDK calls `register_uninstall_hook()` internally, which overrides WordPress's `uninstall.php`.

**Solution:** Hook into Freemius's `after_uninstall` action:
```php
ttsp_fs()->add_action('after_uninstall', function() {
    // Cleanup code here — runs AFTER Freemius's own cleanup
});
```

**Keep `uninstall.php` as fallback** for edge cases where Freemius isn't loaded (e.g., when Pro is active and handles Freemius, free plugin's Freemius may not be initialized).

### 5.2 Cleanup Gate: User Opt-In

```php
// Both hooks and uninstall.php check this FIRST:
$settings = get_option('tta_settings_data', []);
if (empty($settings['tta__settings_delete_data_on_uninstall'])) {
    return; // User hasn't opted in to data deletion
}
```

### 5.3 Free Plugin Cleanup

```php
// 1. Delete named options (23+)
$options = [
    'tta_settings_data', 'tta_customize_settings', 'tta_listening_settings',
    'tta_analytics_settings', 'tta_schedule_report_settings',
    'tta_onboarding_completed', 'tta_pro_onboarding_completed',
    'is_tta_installed', 'tta_text_to_speech_tts_version',
    // ... all plugin options
];
foreach ($options as $opt) delete_option($opt);

// 2. Delete dynamic options
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'tta_reshow_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'tta_clicks_%'");

// 3. Drop analytics table
$wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}atlasvoice_analytics");

// 4. Delete post meta
delete_post_meta_by_key('tts_mp3_file_urls');
delete_post_meta_by_key('tts_is_mp3_file_url_exists');
delete_post_meta_by_key('atlasVoice_analytics');

// 5. Delete transients
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_tta_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_tts_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_text-to-audio_%'");

// 6. Unschedule cron
wp_clear_scheduled_hook('tta_send_scheduled_report');
wp_clear_scheduled_hook('text-to-audio_tracker_send_event');
```

### 5.4 Pro Plugin Cleanup

```php
// 1. Delete pro-specific options (13+)
$pro_options = [
    'tta_gtts_auth_data', 'tts_auth_file_name', 'tts_cloud_storage_bucket_name',
    'tts_is_backup_mp3_file', 'elevenlabs_tts', 'chatgpt_tts',
    'tta_pro_onboarding_completed', 'tta_pro_version',
    // ... all pro options
];

// 2. Delete pro-specific post meta
delete_post_meta_by_key('atlas_voice_post_all_contents');

// 3. Recursively delete upload directory
$upload_dir = wp_upload_dir()['basedir'] . '/TTA_Pro';
// recursive rmdir...

// 4. Delete pro transients
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_tts_pro_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mp3_generation_lock__%'");

// 5. Unschedule pro cron
wp_clear_scheduled_hook('license_valid_cron_hook');
```

---

## 6. Abandon Rate Reduction Strategy

### Current Problem: 71.4% abandon rate

**Root cause:** Users never experience the plugin working before they leave.

### Phase Summary

| Phase | Goal | Status | Key Metric |
|-------|------|--------|------------|
| 1 | First 60 Seconds — Guided Onboarding | COMPLETED | Time to "aha moment" |
| 2 | First 24 Hours — Prove Ongoing Value | COMPLETED | Dashboard engagement |
| 3 | Deactivation Intervention | COMPLETED | Save at-risk users |
| 4 | Voice Quality Gap | COMPLETED | Set expectations |

### Phase 1: Onboarding Wizard (COMPLETED)

- 4-step wizard with "aha moment" in Step 2 (voice preview)
- Locale auto-detection for 16 languages
- Pro upsell at each step (subtle, value-framed)
- "Hear the Difference" step comparing free vs pro voices

### Phase 2: Ongoing Value (COMPLETED)

- **Analytics enabled by default** for new installs
- **Free limit increased** from 5 → 20 tracked posts
- **Dashboard widget** ("AtlasVoice Quick Stats") with 7-day chart
- **Admin bar indicator** (opt-in, shows plays today on front-end)

### Phase 3: Deactivation Intervention (COMPLETED)

- Custom deactivation warning with real usage stats
- TTS-specific uninstall reasons (voice quality, language, performance)
- Rescue modal with support link before deactivation form

### Phase 4: Voice Quality (COMPLETED)

- Voice quality tiers clearly labeled (Browser Free vs AI Pro)
- In-wizard comparison demos
- Locale auto-detection so users hear a good voice immediately

---

## 7. Cross-Promo System

### Centralized Plugin Registry

```javascript
const atlasPlugins = {
    'text-to-speech': {
        name: 'Text-to-Speech TTS Accessibility',
        description: 'Add AI-powered audio players to your content',
        url: 'https://wordpress.org/plugins/text-to-audio/',
        icon: '🔊',
    },
    'ai-agent-hub': {
        name: 'AI Workflow Automation — AI Agent Hub',
        description: 'Turn WordPress into an AI-powered hub with 80+ abilities',
        url: 'https://wordpress.org/plugins/ai-workflow-automation-ai-agent-hub/',
        icon: '🤖',
    },
    'ar-vr-3d': {
        name: 'AR/VR 3D Model & Try-On',
        description: 'Add immersive 3D product experiences to your shop',
        url: 'https://wordpress.org/plugins/ar-vr-3d-model-try-on/',
        icon: '🥽',
    },
};
// Each plugin's finish screen shows the OTHER two plugins
```

### Placement Rules

1. Cross-promo ONLY appears on the Finish screen
2. Presented as "More from AtlasAiDev" — not as ads
3. Each plugin shows the other two sibling plugins
4. Links open in new tab to wordpress.org listing

---

## 8. Brand & Design System

### Colors

| Element | Color | Hex |
|---------|-------|-----|
| Primary (buttons, accents, progress bar) | Orange | `#FF7853` |
| Primary hover | Dark orange | `#ff5533` |
| Success (checkmarks, enabled toggles) | Green | `#00a32a` |
| Error/Required | Red | `#d63638` |
| Selected state background | Light orange tint | `#fff5f2` |
| Panel background | Light gray | `#f6f7f7` |
| Text primary | Dark | `#1d2327` |
| Text secondary | Medium gray | `#50575e` or `#646970` |
| Disabled/info | Gray | `#787c82` |

### Layout

- Max content width: **720px**
- Sticky header/footer
- Progress bar: **3px height**, animated width transition
- Section padding: **24-32px**
- Cards stack vertically on mobile
- All wizard UI uses consistent coral/orange scheme across both Free and Pro

### Typography

- Headings: WordPress admin default (system fonts)
- Step heading: `h2` with `wizard-step-heading` class
- Step description: `p` with `wizard-step-description` class
- Uses `wp-i18n` for all user-facing strings

---

## 9. Plugin-Specific Implementations

### Applying the Pattern to New Plugins

#### AI Agent Hub

**Free Wizard Steps:**
1. Choose AI Provider (OpenAI, Anthropic, Google, Local)
2. Enter API Key + Test Connection
3. Enable Abilities (select from top 10)
4. Customize Chat Widget (colors, position)
5. Analytics (conversation tracking)
Finish: Summary + cross-promo (TTS, AR/VR)

**Pro Wizard Steps:**
1. Post Type / Integration Selection
2. AI Provider + Model Selection (advanced models)
3. Enter API Key + Test Connection
4. Enable Abilities (80+, multi-select)
5. Configure First Workflow (optional template)
6. Analytics + Reports
Finish: Summary + cross-promo

**Telemetry Groups:**
- Core: `av_provider`, `av_model`, `av_has_conversations`, `av_total_abilities_enabled`
- Features: `av_widget_position`, `av_has_custom_prompts`, `av_uses_workflows`
- Pro: `av_active_abilities_count`, `av_workflow_count`, `av_api_calls_month`
- Compat: `av_has_woocommerce`, `av_has_cache_plugin`

#### AR/VR 3D Model

**Free Wizard Steps:**
1. Choose Display Mode (3D Viewer, AR)
2. Upload First Model or Use Demo
3. Configure Viewer (controls, background)
4. WooCommerce Integration (if active)
Finish: Summary + cross-promo (TTS, AI Agent Hub)

**Pro Wizard Steps:**
1. Display Mode (AR, VR, 3D Viewer, Try-On)
2. Upload Model or Connect Provider
3. Product Integration (WooCommerce mapping)
4. Customize Viewer (colors, controls, lighting)
5. Analytics (view tracking, interaction heatmaps)
Finish: Summary + cross-promo

**Telemetry Groups:**
- Core: `av_display_mode`, `av_has_models`, `av_total_products_with_3d`
- Features: `av_uses_ar`, `av_uses_vr`, `av_viewer_style`, `av_has_custom_lighting`
- Pro: `av_tryon_enabled`, `av_model_count`, `av_woo_integrated`
- Compat: `av_has_woocommerce`, `av_has_page_builder`

---

## 10. File Templates & Contracts

### 10.1 New Plugin Checklist

When creating a new AtlasAiDev plugin, implement these in order:

1. **Plugin entry file** (`plugin-slug.php`)
   - [ ] Freemius SDK init (conditional: free loads if pro not active)
   - [ ] `show_deactivation_feedback_form` → `__return_false`
   - [ ] `deactivation_confirmation_message` filter with usage stats
   - [ ] Custom `uninstall_reasons` filter
   - [ ] `after_uninstall` action hook with cleanup code
   - [ ] Activation hook → sets onboarding flag to false

2. **Activator class** (`includes/Plugin_Activator.php`)
   - [ ] Set `plugin_onboarding_completed = false`
   - [ ] Set default settings
   - [ ] Create database tables if needed
   - [ ] Set activation redirect transient

3. **AtlasAiDev wrapper** (`includes/Plugin_Lib_AtlasAiDev.php`)
   - [ ] `insightInit()` — hook all filters
   - [ ] `get_plugin_telemetry()` — Groups 1-4
   - [ ] `data_we_collect()` — disclosure text
   - [ ] Freemius deactivation data filter
   - [ ] Support ticket filters

4. **Wizard (React)**
   - [ ] `src/dashboard/welcome.js` — mount point
   - [ ] `src/dashboard/welcome/WelcomeWizard.js` — container
   - [ ] `src/dashboard/welcome/wizardApi.js` — API helper
   - [ ] `src/dashboard/welcome/steps/Step*.js` — step components
   - [ ] `webpack.mix.js` — entry point

5. **Pro Wizard (if pro exists)**
   - [ ] `src/pro-wizard/index.js` — mount via MutationObserver
   - [ ] `src/pro-wizard/ProWelcomeWizard.js` — container with buildSteps()
   - [ ] `src/pro-wizard/wizardApi.js` — API helpers (free + pro endpoints)
   - [ ] `src/pro-wizard/steps/Step*.js` — step components
   - [ ] Pro webpack entry point

6. **Uninstall**
   - [ ] `uninstall.php` — fallback cleanup
   - [ ] `after_uninstall` hook in main plugin file — primary cleanup
   - [ ] Both gated by `delete_data_on_uninstall` setting

7. **Dashboard Widget** (Phase 2)
   - [ ] `admin/Plugin_Dashboard_Widget.php`
   - [ ] Register via `wp_dashboard_setup`
   - [ ] Free: basic stats + Pro upsell
   - [ ] Pro: full stats + contextual tips

### 10.2 Naming Conventions

| Item | Free Plugin | Pro Plugin |
|------|-------------|------------|
| Option prefix | `tta_` or `tts_` | `tta_` or `tts_` (shared) |
| Constant prefix | `TTA_` | `TTA_PRO_` |
| REST namespace | `tta/v1` | `tta_pro/v1` |
| Text domain | `text-to-audio` | `text-to-audio` (shared) |
| Onboarding option | `tta_onboarding_completed` | `tta_pro_onboarding_completed` |
| Localized JS object (wizard) | `ttsWizardData` | `ttsProWizardData` |
| Localized JS object (frontend) | `ttsObj` | `ttsObjPro` |
| Webpack bundle (wizard) | `tts-welcome-wizard.min.js` | `pro-wizard.min.js` |

### 10.3 Design Principles

1. **Simple over complete** — Only ask what's necessary. Advanced settings go in dashboard.
2. **Show value fast** — Voice preview / demo is the "aha moment." Make it work without API keys if possible.
3. **Pre-populate from existing settings** — Don't re-ask what the user already configured.
4. **Production toggle is key** — Ask "use in production?" to avoid surprising users by changing their active setup.
5. **No extra state** — Wizard reads/writes existing WordPress options directly. No intermediate wizard-specific options.
6. **Skip is always available** — "Skip Setup" link visible on every step.
7. **Mobile-friendly** — Cards stack vertically on narrow screens.
8. **Consistent brand** — Same coral `#FF7853` color scheme across all AtlasAiDev plugins.
9. **Pro wizard lives in Pro plugin** — All Pro wizard code in the Pro plugin. Free plugin only provides the mount point.
10. **Cross-promo is subtle** — Only on Finish screen, presented as "More from AtlasAiDev" not as ads.

---

## Appendix: TTS Provider Reference

| Player ID | Provider | API Key Required | Audio Dir | Frontend JS |
|-----------|----------|------------------|-----------|-------------|
| 1 | Free Default (Browser TTS) | No | — | Built-in |
| 2 | Pro Browser (WebSpeech) | No | `TTA_PRO_GTTS_DIR` | `TextToSpeechPro.min.js` |
| 3 | AtlasVoice GTTS | No | `TTA_PRO_GTTS_DIR` | `TextToSpeechPro.min.js` |
| 4 | Google Cloud TTS | Yes (JSON) | `TTA_PRO_AUDIO_DIR` | `plyr.min.js` |
| 5 | ChatGPT/OpenAI TTS | Yes (API key) | `TTA_PRO_CHAT_GPT_TTS_DIR` | `plyr.min.js` |
| 6 | ElevenLabs TTS | Yes (API key) | `TTA_PRO_ELEVENLABS_TTS_DIR` | `plyr.min.js` |
