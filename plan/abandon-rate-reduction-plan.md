# Abandon Rate Reduction Plan: 71.4% → Target 40%

## Problem Summary

71.4% of users who install Text-to-Audio abandon it. The root cause is a **value gap** — users never experience the plugin working before they leave.

**Current flow:** Install → Settings form → Confusion → Deactivate
**Target flow:** Install → Guided Onboarding → Hear it work → See it on their site → Keep it

---

## PHASE 1: First 60 Seconds — Guided Onboarding Session ✅ COMPLETED

> Goal: Walk new users through 3 key decisions in a friendly wizard, delivering the "aha moment" — hearing their content read aloud — within 60 seconds of activation.
>
> **STATUS:** Implemented as 4-step wizard (Post Type → Voice → Customize → Analytics → Finish) with Pro upsell + AI Agent Hub cross-promo on finish page. Separate webpack bundle (188 KiB). Browser-tested and verified.

### 1.1 Onboarding Wizard (3-Step Welcome Experience)

**Current:** Redirect to `admin.php?page=text-to-audio&welcome=1` → lands on Settings tab (form fields)
**Proposed:** Redirect to a **3-step onboarding wizard** inside the existing dashboard.

---

#### Step 1: Post Type Selection

> "Where should the audio player appear?"

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1 of 3                                                    │
│                                                                 │
│  🔊 Where should the audio player appear?                      │
│                                                                 │
│  By default, the player is added to all your Posts.             │
│  You can change it to any single post type:                     │
│                                                                 │
│  ┌─────────────────────────────────────────────┐                │
│  │  ● Posts  (24 published)      ← default     │                │
│  │  ○ Pages  (8 published)                      │                │
│  │  ○ Products  (156 published)                 │                │
│  │  ○ [Custom Post Type Name]                   │                │
│  └─────────────────────────────────────────────┘                │
│                                                                 │
│  ℹ️ Free version supports 1 post type.                          │
│     Need multiple post types? AtlasVoice Pro supports           │
│     unlimited post types plus AI-powered voices.                │
│     [Learn about Pro →]                                         │
│                                                                 │
│                                    [Next: Choose Voice →]       │
└─────────────────────────────────────────────────────────────────┘
```

**Key elements:**
- Radio buttons (single select) — free version only allows 1 post type
- Show published count next to each post type (social proof / helps user decide)
- Auto-detect available post types with published content (post, page, product, custom CPTs)
- Default selected: `post`
- Subtle Pro upsell: "Need multiple post types? AtlasVoice Pro supports unlimited..."
- Setting saves to `tta_settings_data → tta__settings_allow_listening_for_post_types`

**Pro upsell features to mention:**
- Multiple post types simultaneously
- AI-powered voices (Google Cloud, ElevenLabs, ChatGPT TTS)
- 200+ premium voices across 50+ languages
- Bulk MP3 file generation

---

#### Step 2: Voice & Language Selection

> "Choose your voice and language"

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 2 of 3                                                    │
│                                                                 │
│  🎙 Choose your voice and language                              │
│                                                                 │
│  Currently selected:                                            │
│  ┌─────────────────────────────────────────────┐                │
│  │  Voice:    [Google UK English Female  ▾]     │                │
│  │  Language: [English (UK)              ▾]     │                │
│  └─────────────────────────────────────────────┘                │
│                                                                 │
│  [▶ Preview Voice] ← plays sample text with selected voice      │
│                                                                 │
│  "Welcome to your site. Your visitors can now listen            │
│   to your content with one click."                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  🔊 Browser Voices (Free) — Currently Active        │        │
│  │     Good for basic accessibility. Quality varies     │        │
│  │     by visitor's browser/device.                     │        │
│  │                                                      │        │
│  │  🎙 AI Voices (Pro) — Natural & Consistent           │        │
│  │     Google Cloud TTS · ElevenLabs · ChatGPT TTS      │        │
│  │     200+ premium voices. Same quality for every      │        │
│  │     visitor on every device.                         │        │
│  │     [Upgrade to Pro →]                               │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  [← Back]                      [Next: Customize Player →]       │
└─────────────────────────────────────────────────────────────────┘
```

**Key elements:**
- Show current voice and language in dropdowns (auto-detected from `get_locale()`)
- "Preview Voice" button — plays sample text so user hears it immediately (THE aha moment)
- Voice quality tier labels: "Browser Voices (Free)" vs "AI Voices (Pro)"
- No "[Try Free for 7 Days]" — not offered
- Setting saves to `tta_listening_settings`

**Voice auto-detection on activation** (in `TTA_Activator::activate()`):
```php
$locale = get_locale(); // e.g., 'fr_FR', 'de_DE', 'ja'
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
    // ... more mappings
];
$default_voice = $voice_map[$locale] ?? ['Google UK English Female', 'en-GB'];
```

**Pro upsell features to mention:**
- 200+ AI voices (Google Cloud, ElevenLabs, ChatGPT)
- Consistent quality across all browsers and devices
- Generate downloadable MP3 files
- Bulk MP3 generation for entire site

---

#### Step 3: Player Customization

> "Match the player to your site's theme"

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 3 of 3                                                    │
│                                                                 │
│  🎨 Customize the player to match your theme                   │
│                                                                 │
│  ┌──────────────────────────────────────────────┐               │
│  │  Background: [#ffffff ■]  Text: [#000000 ■]  │               │
│  │  Border:     [#000000 ■]  Radius: [10px]     │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│  Live Preview:                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │  [▶ Listen]  "Welcome to your site. Your     │               │
│  │   visitors can now listen to your content     │               │
│  │   with one click."                            │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│  ℹ️ You can fully customize the player anytime from the         │
│     Customize tab — including size, position, margins,          │
│     and custom CSS.                                             │
│                                                                 │
│  💡 Pro Tip: AtlasVoice Pro unlocks additional player           │
│     designs, floating player positions (bottom, left, right),   │
│     and the ability to let visitors download MP3 files.         │
│     [See Pro Player Designs →]                                  │
│                                                                 │
│  [← Back]                         [Finish Setup ✓]              │
└─────────────────────────────────────────────────────────────────┘
```

**Key elements:**
- Color pickers for: background, text color, border color, border radius
- **Live preview** with actual player component (reuse existing Customize preview)
- "Finish Setup" saves to `tta_customize_settings` and redirects to dashboard
- Mention: full customization available in Customize tab anytime

**Pro upsell features to mention:**
- Multiple player designs (4 additional player UIs)
- Floating player positions (bottom fixed, left, right, center)
- MP3 download button for visitors
- Advanced CSS selector targeting

---

#### Finish: Success State

After clicking "Finish Setup":

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ✅ AtlasVoice is ready!                                       │
│                                                                 │
│  Your audio player is now live on all your [Posts].             │
│                                                                 │
│  [🔗 View Player on Your Site →]     [Go to Dashboard]         │
│     (opens most recent published post)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- "View Player on Your Site" links to most recent published post of selected post type
- "Go to Dashboard" goes to main plugin page

---

**Files to create/modify:**
- `src/dashboard/components/dashboard/welcome/Welcome.js` — New 3-step wizard component
- `src/dashboard/components/dashboard/Dashboard.js` — Add `/welcome` route
- `text-to-audio.php` line 358 — Redirect to `#/welcome` instead of bare `welcome=1`
- `includes/TTA_Activator.php` — Voice locale auto-detection on activation

**Impact:** HIGH — Users configure AND hear the player working before they can abandon

---

### 1.2 Improve Onboarding Notice (Already Exists, Needs Refinement)

**Current notice:** "AtlasVoice is Active — Let's Set It Up!" → Points to Settings
**Proposed notice:**

```
🔊 AtlasVoice is ready! Your [posts] now have an audio player.
   [Hear a Preview]  [Customize Player]  [View on Your Site →]
```

**Changes:**
- Remove "Let's Set It Up" framing (implies work needed)
- Replace "Configure Now" with "Hear a Preview" (value-first)
- Add "View on Your Site" link to latest published post
- Keep "Customize Player" as secondary CTA → points to Customize tab, not Settings

**Files to modify:**
- `includes/TTA_Notices.php` — `onboarding` notice definition (~line 146)

**Impact:** MEDIUM — Reduces perception that plugin requires configuration

---

## PHASE 2: First 24 Hours (Proving Ongoing Value) ✅ COMPLETED

> Goal: Show users their plugin is actively working and delivering value to their visitors.
>
> **STATUS:** Analytics enabled by default (new installs), free limit 5→20 posts, dashboard widget live with 7-day chart + Pro upsell. Admin bar AJAX toggle implemented.

### 2.1 Enable Lightweight Analytics by Default ✅

**Current:** Analytics disabled by default (`tts_enable_analytics => false`). Free version limited to 5 tracked posts.
**Proposed:** Enable analytics by default for new installs. Increase free limit from 5 to 20 posts.

```php
// In TTA_Activator::activate() — for NEW installs only
$analytics_settings = [
    'tts_enable_analytics' => true,       // ON by default
    'tts_trackable_post_ids' => 'all',    // Track all posts (up to free limit)
];
```

**Why enable by default:**
1. Users who never see data never know the plugin is providing value
2. Analytics is the #1 proof that the plugin is working — "12 plays today" is convincing
3. Without analytics, the dashboard widget (2.2) and admin bar (2.3) have nothing to show
4. Anonymous on-site tracking — no PII, no external calls, minimal performance impact
5. Users can disable in Settings if they prefer

**Why increase from 5 to 20:**
1. 5 posts is too limiting — most blogs have 20+ posts, so only 25% get tracked
2. Users see incomplete data and think analytics is broken
3. 20 gives meaningful coverage while still leaving "unlimited" as a Pro upgrade reason
4. Pro stays unlimited (999) — clear value gap remains

**Privacy note in onboarding:** "Anonymous usage stats are collected on your site to show you how visitors use the player. No personal data is collected. [Disable in Settings]"

**Files to modify:**
- `includes/TTA_Activator.php` — Default analytics settings (line ~168)
- `src/dashboard/components/dashboard/analitics/TrackPostIds.js` — Change free limit from 5 to 20

**Impact:** HIGH — Creates the foundation for showing ongoing value

---

### 2.2 WordPress Dashboard Widget ("AtlasVoice Quick Stats") ✅

**Current:** No dashboard widget. Users only see analytics if they navigate to the plugin's Analytics tab.
**Proposed:** Add a WordPress admin dashboard widget showing tiered data:

#### Free Version Widget:
```
┌─ AtlasVoice Quick Stats ──────────────────────┐
│                                                │
│  🎧 12 plays today  │  👁 48 player views      │
│                                                │
│  ── This Week ─────────────────────────        │
│  Mon ██████████ 18                             │
│  Tue ████████ 14                               │
│  Wed ████████████████ 31                       │
│  Thu ██████ 11                                 │
│  Fri (today)                                   │
│                                                │
│  [View Analytics]   [Customize Player →]       │
│                                                │
│  🔓 Unlock: Listening time, top posts,         │
│     device breakdown, location analytics       │
│     [Upgrade to Pro →]                         │
└────────────────────────────────────────────────┘
```

**Free data shown:**
- Total plays today
- Total player views (inits) today
- Weekly trend bar chart (plays per day)

#### Pro Version Widget:
```
┌─ AtlasVoice Quick Stats ──────────────────────┐
│                                                │
│  🎧 12 plays today  │  👁 48 player views      │
│  ⏱ 23 min listened  │  📊 Top: "My Best Post" │
│                                                │
│  ── This Week ─────────────────────────        │
│  Mon ██████████ 18                             │
│  Tue ████████ 14                               │
│  Wed ████████████████ 31                       │
│  Thu ██████ 11                                 │
│  Fri (today)                                   │
│                                                │
│  💡 Tip: 67% of your listeners are on mobile.  │
│     Your player is mobile-optimized! ✓         │
│                                                │
│  [View Full Analytics]   [Customize Player →]  │
└────────────────────────────────────────────────┘
```

**Pro-only data added:**
- Total listening time
- Top post by plays
- Contextual tip based on actual data (device %, peak hours, etc.)
- Full analytics link (includes location, segments, heatmap, export)

**Files to create:**
- `admin/TTA_Dashboard_Widget.php` — WordPress dashboard widget class
- Register via `wp_dashboard_setup` hook in `TTA_Admin`

**Impact:** HIGH — Users see value every time they log into WordPress

---

### 2.3 Admin Bar Quick Indicator (Toggle in Settings)

**Current:** No presence in admin bar.
**Proposed:** Add a subtle admin bar item when viewing a post on the front-end:

```
[🔊 AtlasVoice: 5 plays today]
```

- Only shows on singular posts where the player is active
- Clicking it opens the plugin's Analytics tab for that post
- **Disabled by default** — user can enable in Settings tab
- Setting: `tta__settings_show_admin_bar_indicator` (default: `false`)

**Files to modify:**
- `admin/TTA_Admin.php` — Add `admin_bar_menu` hook (conditional on setting)
- `includes/TTA_Activator.php` — Add default setting
- `src/dashboard/components/dashboard/settings/Settings.js` — Add toggle in UI

**Impact:** LOW-MEDIUM — Passive value reminder for those who enable it

---

## PHASE 3: Deactivation Intervention (Save At-Risk Users) ✅ COMPLETED

> Goal: When a user decides to deactivate, show them what they're giving up and offer help.
>
> **STATUS:** Custom deactivation warning with real usage stats + 9 TTS-specific uninstall reasons implemented via Freemius filters.

### 3.1 Custom Deactivation Warning Message ✅

**Current:** Default Freemius deactivation feedback form (generic reasons).
**Proposed:** Add a custom message BEFORE the Freemius form using Freemius filter:

```php
ttsp_fs()->add_filter('deactivation_confirmation_message', function() {
    $stats = get_player_stats(); // Quick query
    $msg = '';
    if ($stats['total_plays'] > 0) {
        $msg .= sprintf(
            'Your audio player has been used %d times by your visitors. ',
            $stats['total_plays']
        );
    }
    if ($stats['total_posts'] > 0) {
        $msg .= sprintf(
            '%d of your posts currently have audio players. ',
            $stats['total_posts']
        );
    }
    $msg .= 'Deactivating will remove audio from all posts immediately.';
    return $msg;
});
```

**Example output:**
> "Your audio player has been used 847 times by your visitors. 23 of your posts currently have audio players. Deactivating will remove audio from all posts immediately."

**Files to modify:**
- `text-to-audio.php` — Add Freemius filter

**Impact:** HIGH for users with traffic, LOW for new users (but that's exactly the right targeting)

---

### 3.2 Custom Deactivation Reasons (TTS-Specific) ✅

**Current:** Generic Freemius deactivation reasons.
**Proposed:** Customize with TTS-specific reasons to get better data:

```php
ttsp_fs()->add_filter('uninstall_reasons', function($reasons) {
    return [
        ['id' => 'voice-quality',    'text' => 'The voice quality wasn\'t good enough',     'input_placeholder' => 'What voice quality do you need?'],
        ['id' => 'no-visitors-used', 'text' => 'My visitors aren\'t using the audio player', 'input_placeholder' => ''],
        ['id' => 'too-complex',      'text' => 'It was too hard to set up',                  'input_placeholder' => 'What was confusing?'],
        ['id' => 'wrong-language',   'text' => 'My language/voice isn\'t supported',          'input_placeholder' => 'Which language do you need?'],
        ['id' => 'performance',      'text' => 'It slowed down my site',                     'input_placeholder' => ''],
        ['id' => 'found-better',     'text' => 'I found a better alternative',               'input_placeholder' => 'Which plugin?'],
        ['id' => 'temporary',        'text' => 'Just deactivating temporarily',               'input_placeholder' => ''],
        ['id' => 'pro-too-expensive','text' => 'The Pro version is too expensive',            'input_placeholder' => 'What price would work?'],
        ['id' => 'other',            'text' => 'Other',                                       'input_placeholder' => 'Please share your reason...'],
    ];
});
```

**Files to modify:**
- `text-to-audio.php` — Add Freemius filter

**Impact:** MEDIUM — Better data to understand WHY users leave (drives future fixes)

---

### 3.3 "Need Help?" Rescue Offer ✅

**Current:** Nothing. User deactivates and is gone.
**Proposed:** In the deactivation form, add a prominent rescue CTA:

```
┌─────────────────────────────────────────────┐
│  🤔 Having trouble? We can help!            │
│                                             │
│  Many issues can be fixed in under 2 mins:  │
│  • Voice not working → [Quick Fix Guide]    │
│  • Player not showing → [Troubleshoot]      │
│  • Need better voices → [See Pro Voices]    │
│                                             │
│  [💬 Contact Support]  or  [Continue →]     │
└─────────────────────────────────────────────┘
```

**Implementation:** Custom HTML injected via `admin_footer` when on plugins.php page, shown before the Freemius modal triggers.

**Files to modify:**
- `includes/TTA_Notices.php` or new `admin/TTA_Deactivation_Rescue.php`

**Impact:** MEDIUM — Catches users who leave due to fixable issues

---

## PHASE 4: Voice Quality Gap (Address #1 Disappointment) ✅ COMPLETED

> Goal: Set correct expectations about browser TTS and create a clear upgrade path.
>
> **STATUS:** Voice quality tiers shown in onboarding wizard Step 2 (Browser Voices Free vs AI Voices Pro). Locale auto-detection for 16 languages implemented in TTA_Activator.

### 4.1 Voice Quality Expectation Setting ✅

**Current:** Users hear browser TTS and think the plugin sounds bad.
**Proposed:** In the Onboarding Wizard (Step 2) and Listening tab, clearly label voice tiers:

```
┌─ Voice Quality ────────────────────────────────┐
│                                                │
│  🔊 Browser Voices (Free) — Currently Active   │
│     Good for basic accessibility. Quality      │
│     depends on visitor's browser/device.       │
│     [▶ Preview]                                │
│                                                │
│  🎙 AI Voices (Pro) — Natural & Consistent     │
│     Google Cloud TTS · ElevenLabs · ChatGPT    │
│     200+ voices. Same quality everywhere.      │
│     [▶ Preview]  [Upgrade to Pro →]            │
│                                                │
└────────────────────────────────────────────────┘
```

**Key insight:** Don't hide that browser TTS is limited — frame it as "free tier" with a clear upgrade path. Users who know what to expect are less disappointed.

**Files to modify:**
- `src/dashboard/components/dashboard/welcome/Welcome.js` (new — Step 2)
- `src/dashboard/components/dashboard/listening/Listening.js`

**Impact:** MEDIUM — Reduces voice-quality-driven abandonment

---

### 4.2 Voice Recommendation Based on Site Language ✅

**Current:** Default voice is "Google UK English Female" regardless of site language.
**Proposed:** On activation, detect `get_locale()` and auto-select the best matching voice.

(See implementation code in Phase 1, Step 2 above)

**Files to modify:**
- `includes/TTA_Activator.php` — Voice default logic

**Impact:** MEDIUM — Prevents "wrong language voice" abandon (especially non-English sites)

---

## PHASE 5: Ongoing Engagement (Keep Them Beyond Day 1) ✅ COMPLETED

### 5.1 Usage Milestone Celebrations ✅

**Proposed:** Show contextual admin notices when users hit milestones:

| Milestone | Notice |
|-----------|--------|
| First play | "Your first visitor just used the audio player!" |
| 10 plays | "10 visitors have listened to your content this week." |
| 100 plays | "100 plays! Your accessibility efforts are paying off." |
| 1,000 plays | "1,000 plays! You're making a real impact. [Share your story]" |

**Rules:**
- Max 1 milestone notice per week
- Each milestone shown only once
- Dismissible
- Links to Analytics tab

**Files to create/modify:**
- `includes/TTA_Notices.php` — Add milestone notice type
- Store milestones reached in `tta_milestones_reached` option

**Impact:** MEDIUM — Ongoing value reinforcement

---

### 5.2 Weekly Email Digest (via WP-Cron)

**Proposed:** Optional weekly email for site admins:

```
Subject: Your AtlasVoice Weekly Report

Hi [Name],

This week on [Site Name]:
- 34 visitors listened to your content (+12% vs last week)
- Most popular: "How to Bake Sourdough" (8 plays)
- Top device: Mobile (67%)

Keep it up!
```

**Implementation:**
- Server-side: Weekly WP-Cron job compiles stats
- Email: Uses `wp_mail()` with simple HTML template
- Opt-in: Toggle in Settings → Analytics section
- Opt-out: Unsubscribe link in every email

**Files to create:**
- `includes/TTA_Weekly_Digest.php`

**Impact:** LOW-MEDIUM — Keeps plugin top-of-mind for site owners

---

## PHASE 6: Technical Quick Wins ✅ COMPLETED

### 6.1 Plugin Conflict Auto-Detection ✅

**Current:** `TTA_Hooks` adds compatibility filters but user doesn't know if conflicts exist.
**Proposed:** On activation, detect known conflicting plugins and show targeted guidance:

```php
$conflicts = [];
if (is_plugin_active('autoptimize/autoptimize.php')) {
    $conflicts[] = 'Autoptimize detected — AtlasVoice JS is auto-excluded from minification. ✓';
}
if (is_plugin_active('litespeed-cache/litespeed-cache.php')) {
    $conflicts[] = 'LiteSpeed Cache detected — AtlasVoice JS is auto-excluded. ✓';
}
// Show in Welcome page as "Compatibility: All good ✓" or specific guidance
```

**Impact:** LOW — Preempts "it's broken" abandon from caching conflicts

---

### 6.2 "View Player on Your Site" Persistent Link ✅

**Current:** No easy way to preview the player on an actual post from admin.
**Proposed:** Add a "Preview on site" button in the Customize tab that links to the user's most recent published post:

```php
$latest = get_posts(['numberposts' => 1, 'post_status' => 'publish', 'post_type' => $enabled_types]);
// Pass URL to React via localized data
```

**Files to modify:**
- `admin/TTA_Admin.php` — Add to localized data
- `src/dashboard/components/dashboard/customize/Customize.js` — Add button

**Impact:** LOW — Helps users verify the player is actually showing

---

## Implementation Priority & Effort Matrix

| # | Item | Effort | Impact | Priority | Status |
|---|------|--------|--------|----------|--------|
| 1.1 | Onboarding Wizard (4-step + Finish upsell) | Medium | HIGH | P0 | ✅ DONE |
| 2.1 | Enable Analytics by Default (20 posts free) | Low | HIGH | P0 | ✅ DONE |
| 2.2 | Dashboard Widget (free/pro tiered) | Medium | HIGH | P0 | ✅ DONE |
| 3.1 | Deactivation Warning (stats) | Low | HIGH | P0 | ✅ DONE |
| 3.2 | Custom Deactivation Reasons | Low | MEDIUM | P0 | ✅ DONE |
| 4.2 | Voice Locale Auto-Detection | Low | MEDIUM | P0 | ✅ DONE |
| — | Finish Page Upsell (Pro + AI Agent Hub) | Low | MEDIUM | P0 | ✅ DONE |
| 1.2 | Brand Naming Consolidation → "AtlasVoice" | Low | MEDIUM | P1 | ✅ DONE |
| 4.1 | TTA_Notices Refactor (remove spam) | Medium | MEDIUM | P1 | ✅ DONE |
| — | Schema Markup for Audio (SEO) | Low | MEDIUM | P1 | ✅ DONE |
| 2.3 | Admin Bar Quick Toggle | Low | LOW-MED | P2 | ✅ DONE |
| 3.3 | "Need Help?" Rescue Offer | Medium | MEDIUM | P2 | ✅ DONE |
| 5.1 | Usage Milestone Notices | Medium | MEDIUM | P2 | ✅ DONE |
| 6.1 | Conflict Auto-Detection | Low | LOW | P2 | ✅ DONE |
| 6.2 | "View on Site" Link | Low | LOW | P2 | ✅ DONE |
| — | Onboarding Analytics (wizard tracking) | Medium | MEDIUM | P2 | ✅ DONE |
| — | WP 6.7 textdomain compat fix | Low | HIGH | P2 | ✅ DONE |
| — | Pro Onboarding Wizard | High | MEDIUM | P2 | ⬜ SKIPPED (needs Pro plugin) |
| — | JS Exclusion List Audit + SG Optimizer fix | Low | MEDIUM | P2 | ✅ DONE |
| 7.1 | Accessibility Audit (WCAG 2.1 AA) | Medium | HIGH | P3 | ✅ DONE |
| 7.2 | Unit Tests (PHP + JS) | High | MEDIUM | P3 | ⬜ SKIPPED |
| 7.3 | Font Awesome → Inline SVG Icons | Medium | MEDIUM | P3 | ✅ DONE |
| 7.4 | Weekly Email Digest | High | LOW-MED | P3 | ⬜ SKIPPED (already in Pro) |
| 7.5 | Performance Audit & Optimization | Medium | MEDIUM | P3 | ✅ DONE |
| — | Export UI visible in free version (Pro overlay) | Low | MEDIUM | P3 | ✅ DONE |

---

## PHASE 7: Quality, Performance & Maintainability (P3) ✅ COMPLETED

> Goal: Harden the codebase with tests, improve accessibility compliance, optimize bundle sizes, and add the weekly email engagement feature. These items don't directly reduce abandon rate but ensure long-term plugin quality and WordPress.org review compliance.
>
> **STATUS:** All actionable P3 items completed. Font Awesome 1.2 MB replaced with 3 KB inline SVG component (question-circle icon refined for small-size legibility). DB indexes added for analytics table. Autoload flags optimized across all options. Settings modal focus trap + focus restoration added. Export/Reports UI exposed in free version with Pro upsell banner. All changes browser-tested with both free and Pro plugin active — no compatibility issues found across all dashboard tabs and frontend player.

---

### 7.1 Accessibility Audit (WCAG 2.1 AA Compliance) ✅ DONE

> Priority: HIGH within P3 — WordPress.org guidelines require accessibility, and this is a TTS/accessibility plugin.
>
> **STATUS:** Audited all user-facing UI. Player 2 already has comprehensive ARIA: role="region", aria-label, aria-live announcements, keyboard support on settings icon. Settings modal: added focus trap (Tab cycling) and focus restoration on close. Wizard already has aria-current="step", role="radiogroup", aria-checked, aria-live. No critical WCAG gaps found.

**Scope:** Audit all user-facing UI for WCAG 2.1 AA compliance:

#### 7.1.1 Frontend Player (`TextToSpeech.min.js`)
- Ensure play/pause/stop buttons have proper `aria-label` attributes
- Add `role="region"` and `aria-live="polite"` for playback status announcements
- Keyboard navigation: all controls must be reachable via Tab, activatable via Enter/Space
- Focus indicators: visible focus ring on all interactive elements
- Color contrast: verify all player color combinations meet 4.5:1 ratio (especially user-customized colors)
- Screen reader: announce track progress, play state changes

#### 7.1.2 Onboarding Wizard (`tts-welcome-wizard.min.js`)
- Step indicators need `aria-current="step"` for active step
- Radio buttons in StepPostType need proper `role="radiogroup"` with `aria-labelledby`
- Color pickers in StepCustomize need keyboard support and `aria-label`
- Voice preview button needs `aria-label="Preview selected voice"`
- Progress: announce step changes to screen readers via `aria-live`
- Focus management: auto-focus first interactive element on each step

#### 7.1.3 Admin Dashboard
- Dashboard widget: data visualization (bar chart) needs text alternative
- Milestone notices: ensure dismiss button has `aria-label="Dismiss notice"`
- Admin bar toggle: announce state change ("Audio enabled/disabled") via `aria-live`
- Rescue modal: trap focus inside modal when open, return focus on close

#### 7.1.4 React Dashboard (`text-to-audio-dashboard-ui.min.js`)
- Tab navigation: verify `role="tablist"`, `role="tab"`, `role="tabpanel"` structure
- Form inputs: all fields need associated `<label>` or `aria-label`
- Toast notifications: should use `role="alert"` or `aria-live="assertive"`
- Loading states: announce via `aria-busy="true"` on containers

**Testing tools:**
- axe-core browser extension for automated checks
- Manual keyboard-only navigation test
- NVDA or VoiceOver screen reader testing
- Color contrast checker for all player color presets

**Files to modify:**
- `admin/js/TextToSpeech.js` — Frontend player accessibility
- `src/dashboard/welcome/` — Wizard step components
- `src/dashboard/components/` — Dashboard tab components
- `admin/TTA_Dashboard_Widget.php` — Widget HTML output
- `admin/TTA_Admin.php` — Admin bar, rescue modal markup

**Impact:** HIGH — This is literally an accessibility plugin; it must be accessible itself

---

### 7.2 Unit Tests (PHP + JS)

> Priority: MEDIUM — No tests exist currently. Start with critical paths.

#### 7.2.1 PHP Tests (PHPUnit + WP Test Framework)

**Setup:**
```bash
# Install WordPress test suite
composer require --dev phpunit/phpunit yoast/wp-test-utils
# Bootstrap file: tests/bootstrap.php
# Config: phpunit.xml.dist
```

**Test categories (priority order):**

| Category | Class/Function | Tests | Priority |
|----------|---------------|-------|----------|
| Settings Save/Load | `TTA_Helper::get_settings()`, `TTA_Api_Routes::settings()` | Save/load roundtrip, default values, stdClass cast | HIGH |
| Content Cleaning | `tta_clean_content()` | Shortcode stripping, HTML entity handling, script removal | HIGH |
| Button Visibility | `TTA_Helper::should_load_button()` | Post type check, exclusion by ID/tag/category, filter override | HIGH |
| Activation Defaults | `TTA_Activator::activate()` | Analytics defaults, voice locale detection for 16 languages | MEDIUM |
| Cache Layer | `TTA_Cache::get/set/delete()` | Transient get/set, expiry, `delete('all_settings')` | MEDIUM |
| REST API Auth | `TTA_Api_Routes::get_route_access()` | Valid nonce passes, invalid nonce fails, capability check | MEDIUM |
| Schema Markup | `TTA_Helper::output_audio_schema_head()` | Valid JSON-LD output, correct AudioObject properties | LOW |
| Milestone Notices | `TTA_Notices::register_milestone_notices()` | Correct milestone thresholds, dismissal tracking, transient cache | LOW |
| Onboarding Analytics | `TTA_Api_Routes::handle_onboarding_event()` | Event storage, summary aggregation, invalid event rejection | LOW |
| Caching Exclusions | `TTA_Hooks` | All 6 plugin filters return correct exclusion arrays | LOW |

**File structure:**
```
tests/
├── bootstrap.php
├── php/
│   ├── test-settings.php
│   ├── test-content-cleaning.php
│   ├── test-button-visibility.php
│   ├── test-activation.php
│   ├── test-cache.php
│   ├── test-rest-api.php
│   ├── test-schema-markup.php
│   ├── test-milestone-notices.php
│   ├── test-onboarding-analytics.php
│   └── test-caching-hooks.php
├── js/
│   ├── wizard.test.js
│   └── dashboard.test.js
└── fixtures/
    └── sample-post-content.html
```

#### 7.2.2 JavaScript Tests (Jest)

**Setup:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom babel-jest
```

**Test categories:**

| Component | Tests | Priority |
|-----------|-------|----------|
| `WelcomeWizard.js` | Step navigation, settings save calls, analytics tracking fires | HIGH |
| `StepPostType.js` | Radio selection, published count display, single-select enforcement | MEDIUM |
| `StepVoice.js` | Voice dropdown population, preview button click, language filter | MEDIUM |
| `StepCustomize.js` | Color picker changes, live preview update, border radius slider | MEDIUM |
| `StepAnalytics.js` | Toggle state, post list filtered by selected type | MEDIUM |
| `wizardApi.js` | FormData construction, nonce header, error handling | HIGH |
| `Compatibility.js` | Plugin list rendering, status icons, empty state | LOW |
| `Customize.js` | "Preview on Your Site" link present with correct URL | LOW |

**Scripts to add to `package.json`:**
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:php": "vendor/bin/phpunit",
  "test:all": "npm run test && npm run test:php"
}
```

**Files to create/modify:**
- `phpunit.xml.dist` — PHPUnit config
- `tests/bootstrap.php` — WP test framework bootstrap
- `tests/php/*.php` — PHP test classes
- `tests/js/*.test.js` — Jest test files
- `jest.config.js` — Jest configuration
- `package.json` — Add test scripts
- `composer.json` — Add dev dependencies

**Impact:** MEDIUM — No user-facing change, but prevents regressions as codebase grows

---

### 7.3 Font Awesome → Inline SVG Icons ✅ DONE

> Priority: MEDIUM — Font Awesome was loading 1.18 MiB for only 12 icons.
>
> **STATUS:** Replaced Font Awesome 5.15.3 (1.18 MiB JS) with a lightweight `<Icon>` React component containing only the 12 SVGs actually used (~3 KB). Removed `tts-font-awesome` enqueue from `TTA_Admin.php`. Updated 12 files across the React dashboard + bulk MP3 + CSS selectors. PHP YouTube icon in admin replaced with inline SVG. Removed `font-awesome.min.js` from caching plugin exclusion list. Question-circle icon upgraded from filled FA style to stroke-based SVG for better legibility at 14px.

**Bundle sizes after optimization:**
| Bundle | Size | Loaded On |
|--------|------|-----------|
| `text-to-audio-dashboard-ui.min.js` | **698 KiB** | Admin dashboard page |
| `tts-welcome-wizard.min.js` | 196 KiB | Welcome page only |
| `tts-css-selectors.min.js` | 252 KiB | CSS selectors page only |
| `tts-bulk-mp3-file.min.js` | 226 KiB | Bulk MP3 page only |
| `TextToSpeech.min.js` | 92 KiB | Frontend (every post) |
| ~~`font-awesome.min.js`~~ | ~~**1.18 MiB**~~ | **REMOVED** |

**Strategy: React.lazy() + Suspense for dashboard tabs**

```jsx
// src/dashboard/index.js — lazy load each tab
const Settings = React.lazy(() => import('./components/dashboard/settings/Settings'));
const Customize = React.lazy(() => import('./components/dashboard/customize/Customize'));
const Listening = React.lazy(() => import('./components/dashboard/listening/Listening'));
const Analytics = React.lazy(() => import('./components/dashboard/analitics/Analytics'));
const Compatibility = React.lazy(() => import('./components/dashboard/compatibility/Compatibility'));
const Aliases = React.lazy(() => import('./components/dashboard/alias/AliasSettings'));
const Docs = React.lazy(() => import('./components/dashboard/docs/Docs'));

// Wrap routes in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Settings />} />
    <Route path="/customize" element={<Customize />} />
    ...
  </Routes>
</Suspense>
```

**Webpack config change (`webpack.mix.js`):**
```js
// Enable chunk splitting
mix.webpackConfig({
    output: {
        chunkFilename: 'admin/js/build/chunks/[name].[contenthash:8].js',
    },
});
```

**Expected savings:**
| Scenario | Current | After Split | Savings |
|----------|---------|-------------|---------|
| Initial load (Settings tab) | 691 KiB | ~200 KiB + chunks on demand | ~70% smaller initial load |
| Navigate to Customize | 0 (already loaded) | ~80 KiB chunk | Loaded on demand |
| Total if all tabs visited | 691 KiB | ~691 KiB (same total) | No change in total |

**Additional optimizations:**
1. **Font Awesome tree-shaking** — Import only used icons instead of full 1.18 MiB bundle
2. **React Bootstrap tree-shaking** — Import individual components: `import Button from 'react-bootstrap/Button'` instead of `import { Button } from 'react-bootstrap'`
3. **Shared vendor chunk** — Extract React, React-DOM, React-Router into a shared chunk loaded once

**Files to modify:**
- `webpack.mix.js` — Chunk splitting config
- `src/dashboard/index.js` — React.lazy imports
- `src/dashboard/components/` — Individual tab components (ensure default exports)
- `admin/TTA_Admin.php` — Update script enqueue to handle chunked output
- All components importing Font Awesome — Switch to individual icon imports

**Impact:** MEDIUM — Faster admin page loads, especially on slow connections

---

### 7.4 Weekly Email Digest

> Priority: LOW-MED — Engagement feature. Only implement after tests are in place.

**Implementation:**

#### 7.4.1 WP-Cron Scheduled Job

```php
// includes/TTA_Weekly_Digest.php
class TTA_Weekly_Digest {

    public function __construct() {
        add_action( 'tta_send_weekly_digest', [ $this, 'send_digest' ] );
    }

    public function schedule() {
        if ( ! wp_next_scheduled( 'tta_send_weekly_digest' ) ) {
            wp_schedule_event( strtotime( 'next monday 9:00' ), 'weekly', 'tta_send_weekly_digest' );
        }
    }

    public function send_digest() {
        $opt_in = get_option( 'tta_weekly_digest_enabled', false );
        if ( ! $opt_in ) return;

        $stats = $this->compile_weekly_stats();
        if ( $stats['total_plays'] === 0 && $stats['total_views'] === 0 ) return; // No data, skip

        $admin_email = get_option( 'admin_email' );
        $site_name   = get_bloginfo( 'name' );

        $subject = sprintf( 'Your AtlasVoice Weekly Report — %s', $site_name );
        $body    = $this->render_email_template( $stats, $site_name );

        $headers = [ 'Content-Type: text/html; charset=UTF-8' ];
        wp_mail( $admin_email, $subject, $body, $headers );
    }
}
```

#### 7.4.2 Email Template Content

```
Subject: Your AtlasVoice Weekly Report — [Site Name]

Hi [Admin Name],

Here's how your audio player performed this week on [Site Name]:

📊 This Week's Highlights
   • [X] total plays (+Y% vs last week)
   • [X] player views
   • Top post: "[Post Title]" ([N] plays)

📈 7-Day Trend
   Mon ██████ 12
   Tue ████████ 16
   Wed ████ 8
   Thu ██████████ 20
   Fri ██████ 12
   Sat ████ 8
   Sun ██ 4

💡 Quick Actions
   [View Full Analytics →]
   [Customize Player →]

---
You're receiving this because you enabled weekly reports in AtlasVoice settings.
[Unsubscribe] | [Manage Preferences]
```

#### 7.4.3 Settings Integration

Add toggle to Settings tab:
```
Weekly Email Report
[ ] Send me a weekly summary of player analytics every Monday at 9 AM
    Includes: total plays, top posts, weekly trend
```

**Setting stored:** `tta_weekly_digest_enabled` (default: `false`)
**Opt-out:** Link in every email that sets option to `false` via signed URL token

#### 7.4.4 Pro Version Enhancement

Free email: plays, views, top post, weekly trend
Pro email adds: listening time, device breakdown, location summary, engagement funnel, CSV attachment

**Files to create/modify:**
- `includes/TTA_Weekly_Digest.php` — New class
- `includes/TTA.php` — Register hooks
- `includes/TTA_Activator.php` — Schedule cron on activation
- `includes/TTA_Deactivator.php` — Clear cron on deactivation
- `src/dashboard/components/dashboard/settings/Settings.js` — Add toggle
- `api/TTA_Api_Routes.php` — Unsubscribe endpoint

**Impact:** LOW-MED — Keeps plugin top-of-mind for site owners between logins

---

### 7.5 Performance Audit & Optimization ✅ DONE

> Priority: MEDIUM — Ensure all new features haven't degraded page load performance.
>
> **STATUS:** Font Awesome removed (see 7.3). Added DB indexes `idx_post_id`, `idx_created_at`, `idx_updated_at` on `atlasvoice_analytics` table (both new installs via dbDelta and existing via ALTER TABLE). Optimized autoload flags: core settings keep autoload=yes, all analytics/telemetry/notice/onboarding options set to autoload=no. Onboarding events already capped at 200.

#### 7.5.1 Frontend Performance

- **Audit font-awesome.min.js (1.18 MiB)** — This is the single largest file. Options:
  - Replace with individual SVG icon imports (only ~5 icons used)
  - Use WordPress Dashicons (already loaded in admin)
  - Lazy-load Font Awesome only on pages that need it
- **Audit TextToSpeech.min.js (92 KiB)** on frontend posts — Ensure it's loaded only on posts where player is active (check `should_load_button()` is gating properly)
- **Verify NoSleep.min.js** is only loaded when needed (mobile playback)

#### 7.5.2 Admin Performance

- **Dashboard widget query optimization** — Verify the `atlasvoice_analytics` table has proper indexes on `created_at`, `post_id`
- **Transient caching audit** — Ensure all expensive queries use transients:
  - Dashboard widget: 5-min cache ✅ (already done)
  - Milestone notice: 1-hour cache ✅ (already done)
  - Settings load: via TTA_Cache ✅ (already done)
- **REST API response times** — Benchmark each endpoint, identify any >500ms responses

#### 7.5.3 Database

- Verify `atlasvoice_analytics` table has index on `(created_at, action)` for widget queries
- Verify `tta_onboarding_events` option doesn't grow unbounded (cap at 1000 events)
- Check `autoload` flag on all plugin options — only settings that are needed on every page load should be autoloaded

**Files to audit:**
- `admin/js/TextToSpeech.js` — Frontend loading conditions
- `admin/TTA_Admin.php` — Script enqueue conditions
- `admin/TTA_Dashboard_Widget.php` — Query performance
- `includes/TTA_Activator.php` — Table creation with indexes
- All files using `get_option()` / `update_option()` — Check autoload flags

**Impact:** MEDIUM — Prevents performance complaints which are a deactivation reason (#5 in custom reasons)

---

## Pro Upsell Strategy (Woven Into Onboarding)

The onboarding wizard naturally introduces Pro features at each decision point without being pushy:

| Step | Free Capability | Pro Upsell |
|------|----------------|------------|
| Post Type | 1 post type | Unlimited post types |
| Voice | Browser voices (quality varies) | 200+ AI voices (Google Cloud, ElevenLabs, ChatGPT) |
| Player Design | Standard player, before/after content | 4 additional designs, floating positions, MP3 download |
| Analytics | 20 tracked posts, basic metrics | Unlimited posts, listening time, device/location/segments, export |
| Dashboard Widget | Plays + views + weekly trend | + listening time, top posts, device tips |

**Pro features to highlight (picked for highest conversion impact):**
1. **AI Voices** — #1 reason users upgrade. Browser TTS quality is the top complaint.
2. **MP3 Download** — Visitors can download audio. High-value for content creators.
3. **Bulk MP3 Generation** — Generate MP3 for entire site at once.
4. **Advanced Analytics** — Location, device, listening time, engagement funnel.
5. **Multiple Post Types** — Cover entire site, not just posts.
6. **Google Cloud Storage** — Backup all MP3 files to cloud.
7. **Floating Player** — Bottom fixed, left, right, center positions.
8. **ElevenLabs Integration** — Most natural-sounding AI voices available.

---

## Expected Impact

| Metric | Current | After P0 | After P0+P1 | After All |
|--------|---------|----------|-------------|-----------|
| Abandon Rate | 71.4% | ~55% | ~45% | ~35-40% |
| "Couldn't figure out" | High | Low | Very Low | Minimal |
| "No visible value" | High | Low | Low | Minimal |
| Deactivation saves | 0% | ~10% | ~15% | ~20% |

---

## Measurement Plan

Track these metrics via Freemius + custom analytics:

1. **Activation-to-first-play time** — How long until user hears the preview?
2. **Onboarding wizard completion rate** — % who finish all 3 steps vs skip
3. **7-day retention rate** — % still active after 1 week
4. **30-day retention rate** — % still active after 1 month
5. **Deactivation reason distribution** — Which custom reasons dominate?
6. **Dashboard widget engagement** — Clicks on "View Full Analytics"
7. **Deactivation rescue rate** — % who cancel deactivation after seeing stats
8. **Pro conversion from onboarding** — % who click Pro upsell links during wizard

---

## Notes

- All changes should be backward-compatible (existing users unaffected)
- Onboarding wizard only shows for NEW activations (check `tta_has_been_activated_before`)
- Analytics default change only applies to new installs
- Admin bar indicator is OFF by default, toggled from Settings
- Milestone notices respect existing dismissal system
- All email communications must have opt-out
- Free version: 1 post type only (radio select in onboarding)
- Pro upsells are informational, not blocking — user can always proceed with free features
