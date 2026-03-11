# Abandon Rate Reduction Plan: 71.4% → Target 40%

## Problem Summary

71.4% of users who install Text-to-Audio abandon it. The root cause is a **value gap** — users never experience the plugin working before they leave.

**Current flow:** Install → Settings form → Confusion → Deactivate
**Target flow:** Install → Hear it work → See it on their site → Keep it

---

## PHASE 1: First 60 Seconds (The Critical Window)

> Goal: Get users to their "aha moment" — hearing their content read aloud — within 60 seconds of activation.

### 1.1 Welcome Experience Page (Replace Raw Settings Redirect)

**Current:** Redirect to `admin.php?page=text-to-audio&welcome=1` → lands on Settings tab (form fields)
**Proposed:** Redirect to a dedicated **Welcome page** with 3 sections:

```
┌─────────────────────────────────────────────────────┐
│  🔊 AtlasVoice is Active!                          │
│                                                     │
│  Your site now has text-to-speech. Here's a preview:│
│                                                     │
│  ┌───────────────────────────────────────┐          │
│  │  [▶ Listen]  "Welcome to your site.   │          │
│  │   Your visitors can now listen to     │          │
│  │   your content with one click."       │          │
│  └───────────────────────────────────────┘          │
│                                                     │
│  ✅ Audio player added to all your Posts            │
│  ✅ Works immediately — no API key needed           │
│  ✅ 50+ languages supported                         │
│                                                     │
│  ┌──────────────┐  ┌──────────────────────┐         │
│  │ Customize ▶  │  │ Skip, I'll explore   │         │
│  │  Player      │  │  later               │         │
│  └──────────────┘  └──────────────────────┘         │
│                                                     │
│  📄 View a post with the player → [Your Latest Post]│
└─────────────────────────────────────────────────────┘
```

**Key elements:**
- **Auto-playing demo** — The player renders with sample text and the user can click to hear it immediately
- **"View a post with the player"** — Direct link to their most recent published post so they can see it live
- **"Customize Player"** — Goes to Customize tab (not Settings)
- **"Skip"** — Goes to dashboard normally

**Files to modify:**
- `src/dashboard/components/dashboard/Dashboard.js` — Add `/welcome` route
- `src/dashboard/components/dashboard/welcome/Welcome.js` — New component
- `text-to-audio.php` line 358 — Redirect to `#/welcome` instead of bare `welcome=1`

**Impact:** HIGH — Bridges the gap between "installed" and "heard it work"

---

### 1.2 Smart Post Type Auto-Detection

**Current:** Default post type is `['post']` only. Users with Pages or WooCommerce products never see the player.

**Proposed:** On first activation, auto-detect which post types have published content and pre-enable them.

```php
// In TTA_Activator::activate()
$post_types = ['post']; // always include
$candidates = ['page', 'product']; // check these
foreach ($candidates as $pt) {
    if (post_type_exists($pt)) {
        $count = wp_count_posts($pt);
        if ($count && $count->publish > 0) {
            $post_types[] = $pt;
        }
    }
}
// Use $post_types as default for tta__settings_allow_listening_for_post_types
```

**Files to modify:**
- `includes/TTA_Activator.php` line 85

**Impact:** MEDIUM — Prevents "I activated it but nothing happened on my pages" abandon

---

### 1.3 Improve Onboarding Notice (Already Exists, Needs Refinement)

**Current notice:** "AtlasVoice is Active — Let's Set It Up!" → Points to Settings
**Proposed notice:**

```
🔊 AtlasVoice is ready! Your posts now have an audio player.
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

## PHASE 2: First 24 Hours (Proving Ongoing Value)

> Goal: Show users their plugin is actively working and delivering value to their visitors.

### 2.1 Enable Lightweight Analytics by Default

**Current:** Analytics disabled by default. Users never see usage data.
**Proposed:** Enable basic analytics (init + play counts) by default for all enabled post types.

```php
// In TTA_Activator::activate()
$analytics_settings = [
    'tts_enable_analytics' => true,       // ON by default
    'tts_trackable_post_ids' => 'all',    // Track all posts
];
```

**Privacy consideration:** The analytics are anonymous (FingerprintJS-based), on-site only, no PII. Add a one-line note in the onboarding: "Anonymous usage stats are collected on your site to show you how visitors use the player. [Disable in Settings]"

**Files to modify:**
- `includes/TTA_Activator.php` — Default analytics settings

**Impact:** HIGH — Creates the foundation for showing value

---

### 2.2 WordPress Dashboard Widget ("AtlasVoice Quick Stats")

**Current:** No dashboard widget. Users only see analytics if they navigate to the plugin's Analytics tab.
**Proposed:** Add a WordPress admin dashboard widget showing:

```
┌─ AtlasVoice Quick Stats ──────────────────────┐
│                                                │
│  🎧 12 plays today  │  👁 48 player views      │
│  ⏱ 23 min listened  │  📊 Top: "My Best Post" │
│                                                │
│  [View Full Analytics]   [Customize Player →]  │
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
└────────────────────────────────────────────────┘
```

**Key elements:**
- Shows real-time value ("12 plays today")
- Mini bar chart for weekly trend (text-based, lightweight)
- Contextual tip based on actual data
- Links to full analytics and customization
- Dismissible but re-appears if there's new data

**Files to create:**
- `admin/TTA_Dashboard_Widget.php` — WordPress dashboard widget class
- Register via `wp_dashboard_setup` hook in `TTA_Admin`

**Impact:** HIGH — Users see value every time they log into WordPress

---

### 2.3 Admin Bar Quick Indicator

**Current:** No presence in admin bar.
**Proposed:** Add a subtle admin bar item when viewing a post on the front-end:

```
[🔊 AtlasVoice: 5 plays today]
```

- Only shows on singular posts where the player is active
- Clicking it opens the plugin's Analytics tab for that post
- Non-intrusive, informational only

**Files to modify:**
- `admin/TTA_Admin.php` — Add `admin_bar_menu` hook

**Impact:** LOW-MEDIUM — Passive value reminder

---

## PHASE 3: Deactivation Intervention (Save At-Risk Users)

> Goal: When a user decides to deactivate, show them what they're giving up and offer help.

### 3.1 Custom Deactivation Warning Message

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

### 3.2 Custom Deactivation Reasons (TTS-Specific)

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
│  • Need better voices → [Try Pro Free]      │
│                                             │
│  [💬 Chat with Support]  or  [Continue →]   │
└─────────────────────────────────────────────┘
```

**Implementation:** Custom HTML injected via `admin_footer` when on plugins.php page, shown before the Freemius modal triggers.

**Files to modify:**
- `includes/TTA_Notices.php` or new `admin/TTA_Deactivation_Rescue.php`

**Impact:** MEDIUM — Catches users who leave due to fixable issues

---

## PHASE 4: Voice Quality Gap (Address #1 Disappointment)

> Goal: Set correct expectations about browser TTS and create a clear upgrade path.

### 4.1 Voice Quality Expectation Setting

**Current:** Users hear browser TTS and think the plugin sounds bad.
**Proposed:** In the Welcome page and Listening tab, clearly label voice tiers:

```
┌─ Voice Quality ────────────────────────────────┐
│                                                │
│  🔊 Browser Voices (Free) — Currently Active   │
│     Good for basic accessibility. Quality      │
│     depends on visitor's browser/device.       │
│     [▶ Preview]                                │
│                                                │
│  🎙 AI Voices (Pro) — Natural & Consistent     │
│     Google Cloud, ElevenLabs, ChatGPT TTS.     │
│     Same quality for every visitor.            │
│     [▶ Preview]  [Try Free for 7 Days]         │
│                                                │
└────────────────────────────────────────────────┘
```

**Key insight:** Don't hide that browser TTS is limited — frame it as "free tier" with a clear upgrade path. Users who know what to expect are less disappointed.

**Files to modify:**
- `src/dashboard/components/dashboard/welcome/Welcome.js` (new)
- `src/dashboard/components/dashboard/listening/Listening.js`

**Impact:** MEDIUM — Reduces voice-quality-driven abandonment

---

### 4.2 Voice Recommendation Based on Site Language

**Current:** Default voice is "Google UK English Female" regardless of site language.
**Proposed:** On activation, detect `get_locale()` and auto-select the best matching voice.

```php
// In TTA_Activator::activate()
$locale = get_locale(); // e.g., 'fr_FR', 'de_DE', 'ja'
$voice_map = [
    'en_US' => ['Google US English', 'en-US'],
    'en_GB' => ['Google UK English Female', 'en-GB'],
    'fr_FR' => ['Google français', 'fr-FR'],
    'de_DE' => ['Google Deutsch', 'de-DE'],
    'es_ES' => ['Google español', 'es-ES'],
    'ja'    => ['Google 日本語', 'ja-JP'],
    // ... more mappings
];
$default_voice = $voice_map[$locale] ?? ['Google UK English Female', 'en-GB'];
```

**Files to modify:**
- `includes/TTA_Activator.php` — Voice default logic

**Impact:** MEDIUM — Prevents "wrong language voice" abandon (especially non-English sites)

---

## PHASE 5: Ongoing Engagement (Keep Them Beyond Day 1)

### 5.1 Usage Milestone Celebrations

**Proposed:** Show contextual admin notices when users hit milestones:

| Milestone | Notice |
|-----------|--------|
| First play | "Your first visitor just used the audio player! 🎉" |
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

### 5.2 Weekly Email Digest (via Freemius or Mailchimp)

**Proposed:** Optional weekly email for site admins:

```
Subject: Your AtlasVoice Weekly Report

Hi [Name],

This week on [Site Name]:
• 34 visitors listened to your content (+12% vs last week)
• Most popular: "How to Bake Sourdough" (8 plays)
• Top device: Mobile (67%)

Keep it up! 🎧
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

| # | Item | Effort | Impact | Priority |
|---|------|--------|--------|----------|
| 1.1 | Welcome Experience Page | Medium | HIGH | 🔴 P0 |
| 2.1 | Enable Analytics by Default | Low | HIGH | 🔴 P0 |
| 2.2 | Dashboard Widget | Medium | HIGH | 🔴 P0 |
| 3.1 | Deactivation Warning (stats) | Low | HIGH | 🔴 P0 |
| 1.2 | Smart Post Type Auto-Detection | Low | MEDIUM | 🟡 P1 |
| 1.3 | Improve Onboarding Notice | Low | MEDIUM | 🟡 P1 |
| 3.2 | Custom Deactivation Reasons | Low | MEDIUM | 🟡 P1 |
| 4.2 | Voice Locale Auto-Detection | Low | MEDIUM | 🟡 P1 |
| 4.1 | Voice Quality Expectation | Medium | MEDIUM | 🟡 P1 |
| 3.3 | "Need Help?" Rescue Offer | Medium | MEDIUM | 🟢 P2 |
| 5.1 | Usage Milestone Notices | Medium | MEDIUM | 🟢 P2 |
| 2.3 | Admin Bar Indicator | Low | LOW | 🟢 P2 |
| 6.1 | Conflict Auto-Detection | Low | LOW | 🟢 P2 |
| 6.2 | "View on Site" Link | Low | LOW | 🟢 P2 |
| 5.2 | Weekly Email Digest | High | LOW-MED | 🔵 P3 |

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
2. **Welcome page completion rate** — % who click "Customize" vs "Skip"
3. **7-day retention rate** — % still active after 1 week
4. **30-day retention rate** — % still active after 1 month
5. **Deactivation reason distribution** — Which custom reasons dominate?
6. **Dashboard widget engagement** — Clicks on "View Full Analytics"
7. **Deactivation rescue rate** — % who cancel deactivation after seeing stats

---

## Notes

- All changes should be backward-compatible (existing users unaffected)
- Welcome page only shows for NEW activations (check `tta_has_been_activated_before`)
- Analytics default change only applies to new installs
- Milestone notices respect existing dismissal system
- All email communications must have opt-out














you're proposing to add multiple post type in free version. this is only for pro version. I can change it if you recommend with reason. my plan is during intsalltion I want to tell user that you can change post type. from post to any other post , but only 1 post can be selected.



2.1 Enable Lightweight Analytics by Default this : current system is by default it is disabled and if enabled then in free version only 5 post can be selected. I can change to default is enabled. should I track all posts or should icrease from 5 to 10/20 etc. why I should follow your recommendation



2.2 WordPress Dashboard Widget ("AtlasVoice Quick Stats"): this one is great. but some data is for free and full analytics is for pro. I can show free data to dashboard widget and all data for pro users. if you suggest to modify tell me what can be done and why?



2.3 Admin Bar Quick Indicator this one should be disable/enable from UI/settings



4.1 Voice Quality Expectation Setting: here remove this [Try Free for 7 Days] as we're not offering it





