# Pro Setup Wizard — Implementation Plan

## Status: ✅ IMPLEMENTED (2026-03-12)

All phases complete. Pro wizard is live and browser-tested.

---

## Overview

A guided setup wizard that launches on first Pro plugin activation (or when "Run Setup Wizard" is clicked with Pro active). Lives in the **Pro plugin codebase** (`text-to-audio-pro`). The free plugin keeps its own wizard unchanged. The Pro wizard is a separate React entry point bundled and enqueued by the Pro plugin.

---

## Trigger Logic

| Scenario | Behavior |
|----------|----------|
| Free plugin activated (fresh install) | Free wizard (existing 4-step flow) |
| Pro plugin activated for first time | Pro wizard (new dynamic-step flow below) |
| "Run Setup Wizard" clicked, Pro active | Pro wizard |
| "Run Setup Wizard" clicked, Pro inactive | Free wizard (existing) |

### Implementation ✅

- New option: `tta_pro_onboarding_completed` (boolean, autoload=false)
- On Pro activation (`TTA_Pro_Activator::activate()`), set `tta_pro_onboarding_completed = false`
- In `TTA_Pro_Actions.php`, when `welcome=1` detected:
  - If Pro is active AND `!get_option('tta_pro_onboarding_completed')` → render Pro wizard
  - Else → render existing free wizard
- `reset_onboard=true` deletes both `tta_onboarding_completed` and `tta_pro_onboarding_completed`
- Pass `is_pro_active` flag via `ttsWizardData` localized object

---

## Pro Wizard Steps (Dynamic: 4 or 5 Steps + Finish)

**Dynamic step system:** When "Default Pro" (WebSpeech, Player ID 2) is selected, Step 4 (Player Settings) is automatically skipped because WebSpeech doesn't generate MP3 files. All other providers show all 5 steps.

| Provider Selected | Steps | Total |
|-------------------|-------|-------|
| Pro Player (WebSpeech) | Post Type → Provider → Voice → Analytics → Finish | 4 + Finish |
| AtlasVoice GTTS | Post Type → Provider → Voice → Player Settings → Analytics → Finish | 5 + Finish |
| Google Cloud TTS | Post Type → Provider → Voice → Player Settings → Analytics → Finish | 5 + Finish |
| ChatGPT TTS | Post Type → Provider → Voice → Player Settings → Analytics → Finish | 5 + Finish |
| ElevenLabs | Post Type → Provider → Voice → Player Settings → Analytics → Finish | 5 + Finish |

### Step 1: Post Type Selection ✅

> "Where should the audio player appear?"

- **Multi-select checkboxes** (Pro supports multiple post types)
- Pre-populated from existing settings
- Shows published count per post type
- State: `selectedPostTypes` (array of slugs)
- Saves to: `tta_settings_data.tta__settings_allow_listening_for_post_types`

### Step 2: AI Voice Provider Selection ✅

> "Choose your AI voice provider"

- Provider cards with info: voice count, languages, API key requirement
- "Will you use this in production?" toggle
- Production toggle logic: "Yes" → updates `buttonSettings.id`, "No" → keeps current

| Provider | Player ID | Voices | Languages | API Key | Badge |
|----------|-----------|--------|-----------|---------|-------|
| Pro Player (WebSpeech) | 2 | Browser | Multi | No | Default Pro |
| AtlasVoice GTTS | 3 | 200+ | 40+ | No | Recommended |
| Google Cloud TTS | 4 | 300+ | 40+ | Yes (JSON) | Popular |
| ChatGPT TTS | 5 | 6 HD | 57 | Yes (OpenAI) | Premium |
| ElevenLabs | 6 | 1000+ | 29 | Yes (API key) | Most Natural |

### Step 3: Voice & Language Configuration ✅

> "Pick your voice and language"

- UI adapts per provider (language dropdown, voice dropdown, model selector)
- Audio preview button
- Provider-specific voice loading:
  - Player 2: Browser `speechSynthesis` voices
  - Player 3: Language dropdown only
  - Player 4: Fetch from `/tta/v1/voices`
  - Player 5: Hardcoded 6 voices + model (tts-1/tts-1-hd)
  - Player 6: Fetch from `/tta_pro/v1/elevenlabs_voices` + model selector

### Step 4: Player Settings ✅ (skipped for Default Pro)

> "Configure your audio player"

- **Skipped when Player ID 2 (WebSpeech)** — no MP3 generation
- MP3 Generation Date Range (from/to date pickers)
- MP3 Download Permission (All Visitors / Logged-in / Admins Only)
- Saves to: `tta_customize_settings.buttonSettings`

### Step 5: Analytics & Reports ✅

> "Set up analytics and reports"

- Enable Analytics toggle (default: on)
- Track: All Posts (unlimited with Pro) or Select specific posts
- Email Digest: Enable/disable, Weekly/Monthly frequency, recipient email
- Saves to: `tta_analytics_settings` + `tta_schedule_report_settings`

### Finish Screen ✅

> "AtlasVoice Pro is ready!"

- All settings saved BEFORE this screen renders
- **Setup Summary cards:** Provider, Voice, Download (hidden for Default Pro), Analytics
- **What's Next:** Bulk MP3 (hidden for Default Pro), Analytics
- **Multilingual Detection:** Shows if WPML/GTranslate/TranslatePress detected, links to Language Mapping
- **Cross-promo:** AI Workflow Automation, AR/VR 3D Model

---

## Brand Color Theme ✅

All wizard UI uses consistent coral/orange color scheme:

| Element | Color |
|---------|-------|
| Primary buttons (Next, Finish, View Player) | `#FF7853` |
| Button hover | `#ff5533` |
| Secondary buttons (Back, Go to Dashboard) | `#FF7853` outline |
| Progress bar | `#FF7853` |
| Checkboxes / radio accent | `#FF7853` |
| Selected state backgrounds | `#fff5f2` (light orange tint) |
| Toggle switches | `#FF7853` |

Applied consistently across both Free wizard (6 files) and Pro wizard (7 files), plus Settings and Customization page buttons.

---

## Technical Architecture

### File Structure ✅

**Pro plugin** (`text-to-audio-pro/`):
```
text-to-audio-pro/
  src/
    pro-wizard/
      index.js                        ← Entry point (webpack bundle)
      ProWelcomeWizard.js             ← Pro wizard container with dynamic step system
      wizardApi.js                    ← REST API helper (wizardFetch, postListening, postJSON, saveAnalytics, markProOnboardingComplete)
      steps/
        StepProPostType.js            ← Multi-select post types
        StepProvider.js               ← AI provider cards + production toggle
        StepProVoice.js               ← Voice & language (adapts per provider)
        StepPlayerSettings.js         ← Date range + download permissions
        StepProAnalytics.js           ← Analytics + email digest
        StepProFinish.js              ← Pro finish screen (conditional MP3 UI)
```

**Free plugin** (`text-to-audio/`) — changes:
```
src/dashboard/
  welcome.js                          ← Renders Pro wizard root div when Pro active
  welcome/
    WelcomeWizard.js                  ← Free wizard (4 steps, coral theme)
    steps/                            ← Free wizard steps (coral theme)
  components/dashboard/settings/
    Settings.js                       ← "Preview on Your Site" + "Run Setup Wizard" buttons
  components/dashboard/customize/
    Customize.js                      ← "Preview on Your Site" button (aligned color)
```

### Dynamic Step System (buildSteps) ✅

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

// Inside component:
const activeSteps = buildSteps(selectedPlayerId);
const TOTAL_STEPS = activeSteps.length;        // 4 or 5
const currentStepId = activeSteps[step - 1]?.id;
const FINISH_STEP = TOTAL_STEPS + 1;
```

Step counter, progress bar, next-button labels, and `renderStep()` all adapt reactively when the provider changes.

### API Calls (triggered on "Finish Setup" click) ✅

All calls fire **before** the Finish screen renders. Uses `safeJSON()` pattern to handle PHP warnings in REST responses.

```javascript
// 1. Save post types → POST /tta/v1/settings
// 2. Save customize (player ID, date range, download perms) → POST /tta/v1/customize
// 3. Save listening (voice, lang, model) → POST /tta/v1/listening
// 4. Save analytics → analytics save endpoint
// 5. Save schedule report → POST /tta/v1/save_schedule_report
// 6. Mark Pro onboarding complete → POST /tta_pro/v1/mark_pro_onboarding_complete
```

### PHP Changes ✅

- **`TTA_Pro_Actions.php`**: Enqueues Pro wizard bundle, localizes `ttsProWizardData` with current settings, post types, compatible plugins, admin email, dashboard URL, latest post URL
- **`TTA_Pro_Activator.php`**: Sets `tta_pro_onboarding_completed = false` on activation
- **Pro `webpack.mix.js`**: Added `pro-wizard` entry point → `tts-pro-wizard.min.js`
- **Free `text-to-audio.php`**: `reset_onboard=true` deletes both free and pro onboarding flags

---

## Known Issues

1. **Pro wizard does not auto-redirect on first visit**: After activating Pro, navigating to `admin.php?page=text-to-audio` shows the dashboard. The wizard only shows with `?welcome=1` parameter. The activation redirect may need to be wired up.
2. **Freemius SDK Warnings**: Pre-existing Freemius internals, not our code.

---

## Edge Cases Handled ✅

1. **Default Pro (WebSpeech) selected**: Player Settings step skipped, DOWNLOAD card and Bulk MP3 hidden on Finish
2. **User already completed free wizard**: Pre-populated from existing settings
3. **User skips wizard**: "Skip Setup" link sets `tta_pro_onboarding_completed = true` without changing settings
4. **Pro deactivated then reactivated**: Checks `tta_pro_onboarding_completed` flag
5. **Provider switch mid-wizard**: Step count dynamically updates (4↔5), labels adapt

---

## Blueprint: Reusable Setup Wizard Pattern for AtlasAiDev Plugins

This section documents the **generic wizard pattern** so the same architecture can be reused for any AtlasAiDev plugin (AI Agent Hub, AR/VR 3D Model, future plugins).

### Core Pattern

```
[PluginSlug]/
  src/dashboard/
    welcome.js                    ← Entry: renders wizard or dashboard
    welcome/
      WelcomeWizard.js            ← Free wizard container
      ProWelcomeWizard.js         ← Pro wizard container (if Pro exists)
      wizardApi.js                ← REST API helper (shared)
      steps/
        Step[Name].js             ← Each step is a self-contained component
```

### Step Component Contract

```jsx
const StepExample = ({ data, onChange, wizardData }) => {
    // data: current step's state slice
    // onChange: callback to update parent state
    // wizardData: localized PHP data (post types, settings, etc.)

    return (
        <div>
            <h2>{heading}</h2>
            <p>{description}</p>
            {/* Step-specific form fields */}
        </div>
    );
};
```

### Wizard Container Contract

```jsx
const WizardContainer = () => {
    const [step, setStep] = useState(1);
    const [stepData, setStepData] = useState({/* per-step state */});

    const totalSteps = N;
    const goNext = () => step < totalSteps ? setStep(step + 1) : handleFinish();
    const goBack = () => step > 1 && setStep(step - 1);

    const handleFinish = async () => {
        // 1. Save all settings via REST API
        // 2. Mark onboarding complete
        // 3. Track completion event
        setStep(totalSteps + 1); // Show finish screen
    };

    return (
        <WizardShell step={step} totalSteps={totalSteps} onBack={goBack}>
            {renderStep()}
            <WizardNav onBack={goBack} onNext={goNext} />
        </WizardShell>
    );
};
```

### PHP Backend Contract

```php
// 1. Localize wizard data
wp_localize_script('plugin-wizard', 'wizardData', [
    'post_types'       => $post_types,
    'current_settings' => get_option('plugin_settings', []),
    'is_pro_active'    => Helper::is_pro_active(),
    'nonce'            => wp_create_nonce('wp_rest'),
    'api_url'          => rest_url('plugin/v1/'),
    'dashboard_url'    => admin_url('admin.php?page=plugin-slug'),
    'is_pro_wizard'    => $is_pro && !get_option('plugin_pro_onboarding_completed'),
]);

// 2. REST endpoint saves settings + onboarding flag
// 3. Activation hook resets onboarding flag
// 4. reset_onboard=true URL deletes flag and redirects to welcome=1
```

### Applying to Other Plugins

**AI Agent Hub:**
- Step 1: Choose AI Provider (OpenAI, Anthropic, Google, Local)
- Step 2: Enter API Key + Test Connection
- Step 3: Enable Abilities (select from 80+)
- Step 4: Configure Workflow (optional first workflow)
- Finish: Summary + cross-promo (Text-to-Speech, AR/VR)

**AR/VR 3D Model:**
- Step 1: Choose Display Mode (AR, VR, 3D Viewer)
- Step 2: Upload First Model or Connect Provider
- Step 3: Product Integration (WooCommerce mapping)
- Step 4: Customize Viewer (colors, controls, placement)
- Finish: Summary + cross-promo (Text-to-Speech, AI Agent Hub)

### Cross-Promo Strategy

Every plugin's Finish step includes a "More from AtlasAiDev" section with cards for sibling plugins. The card data is centralized:

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

---

## Design Principles

1. **Simple over complete** — Only ask what's necessary. Advanced settings go in the dashboard.
2. **Show value fast** — Voice preview in Step 3 is the "aha moment." Make it work without API keys if possible.
3. **Pre-populate from free wizard** — Don't re-ask what the user already configured.
4. **Production toggle is key** — Step 2 asks "use in production?" to avoid surprising users by changing their active player.
5. **No extra state** — Wizard reads/writes existing WordPress options directly. No intermediate wizard-specific options.
6. **Skip is always available** — "Skip Setup" link visible on every step.
7. **Mobile-friendly** — Cards stack vertically on narrow screens.
8. **Consistent with free wizard** — Same visual language (card styles, button styles, coral `#FF7853` color scheme).
9. **Lives in Pro plugin** — All wizard code is in `text-to-audio-pro`. Free plugin only provides the mount point.
10. **Cross-promo is subtle** — Only on Finish screen, presented as "More from AtlasAiDev" not as ads.
