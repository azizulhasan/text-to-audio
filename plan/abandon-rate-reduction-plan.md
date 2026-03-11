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
> **STATUS:** Analytics enabled by default (new installs), free limit 5→20 posts, dashboard widget live with 7-day chart + Pro upsell. Admin bar toggle 🔄 in progress.

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

### 3.3 "Need Help?" Rescue Offer

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

## PHASE 5: Ongoing Engagement (Keep Them Beyond Day 1)

### 5.1 Usage Milestone Celebrations

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

## PHASE 6: Technical Quick Wins

### 6.1 Plugin Conflict Auto-Detection

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

### 6.2 "View Player on Your Site" Persistent Link

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
| 1.2 | Brand Naming Consolidation → "AtlasVoice" | Low | MEDIUM | P1 | 🔄 IN PROGRESS |
| 4.1 | TTA_Notices Refactor (remove spam) | Medium | MEDIUM | P1 | 🔄 IN PROGRESS |
| — | Schema Markup for Audio (SEO) | Low | MEDIUM | P1 | 🔄 IN PROGRESS |
| 2.3 | Admin Bar Quick Toggle | Low | LOW-MED | P2 | 🔄 IN PROGRESS |
| 3.3 | "Need Help?" Rescue Offer | Medium | MEDIUM | P2 | ⬜ TODO |
| 5.1 | Usage Milestone Notices | Medium | MEDIUM | P2 | ⬜ TODO |
| 6.1 | Conflict Auto-Detection | Low | LOW | P2 | ⬜ TODO |
| 6.2 | "View on Site" Link | Low | LOW | P2 | ⬜ TODO |
| — | Onboarding Analytics (wizard tracking) | Medium | MEDIUM | P2 | ⬜ TODO |
| — | Pro Onboarding Wizard | High | MEDIUM | P2 | ⬜ TODO |
| 5.2 | Weekly Email Digest | High | LOW-MED | P3 | ⬜ TODO |
| — | Unit Tests | High | MEDIUM | P3 | ⬜ TODO |
| — | Code Splitting (lazy load tabs) | Medium | LOW | P3 | ⬜ TODO |
| — | Accessibility Audit (WCAG 2.1 AA) | Medium | MEDIUM | P3 | ⬜ TODO |

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
