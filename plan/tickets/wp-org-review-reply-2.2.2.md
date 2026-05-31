# Continuation Review Remediation Plan — Free 2.2.2

**Jira:** [TTS-247](https://atlasaidev.atlassian.net/browse/TTS-247) (continuation)
**Branch:** `feature/TTS-247` (continued off the 2.2.1 tip)
**HelpScout thread:** #293 — same thread as the original closure
**Review ID:** `AUTO-SVN … 27May26/4.0.1RC2 (P0TDX157366HGN)`
**Reviewer email received:** 2026-05-27 10:53 AM
**Source email (verbatim):** [`wp-org-review-email-2.2.2.md`](wp-org-review-email-2.2.2.md)
**Original closure plan (foundation):** [`TTS-247-wp-org-closure-remediation.md`](TTS-247-wp-org-closure-remediation.md)
**Original closure email:** [`wp-closure-email.md`](wp-closure-email.md)
**Test cases:** see [`TTS-247-test-cases.md`](TTS-247-test-cases.md) — appended with 2.2.2 cases as each fix lands.

---

## 1. Context

Free **2.2.0** was published to SVN on 2026-05-22 and **2.2.1** followed on 2026-05-24 (the post-publication code-cleanup release that pruned ~1,100 lines of premium-feature code out of `api/AtlasVoice_Analytics.php`). The wp.org review queue picked it up and the AI-pass reviewer replied 2026-05-27 with a continuation report — the plugin is **not yet ready for approval**.

The reviewer's email cites **8 items** across four categories:

1. **Trialware (Guideline 5 / 6)** — two leftover surfaces (analytics + player-2 code) still flagged.
2. **Custom CSS / JS / PHP** — new policy line: plugins may **not** persist arbitrary user CSS/JS/PHP. Free exposes a `custom_css` customization field — must be removed.
3. **Readme / library hygiene** — invalid Terms/Privacy URL, out-of-date Chart.js, direct `file_put_contents` instead of `WP_Filesystem`.
4. **Remember to check everything** — soft-flag bucket: inline `<script>`/`<style>` blocks should move to `wp_enqueue_*`, and the `== External services ==` block must satisfy 1/2/3 for every endpoint.

Reviewer's standing warning is escalated this round:

> ❗ *"If more issues of the same nature are found in the following review, this plugin will not be reviewed again."*

To re-open we must:

1. Fix every cited item.
2. Re-test on a clean WP install with `WP_DEBUG = true`.
3. Run **Plugin Check** clean.
4. Bump `Version:` header and readme `Stable tag:` to **2.2.2**.
5. Commit to SVN `trunk/` and create `tags/2.2.2`.
6. Reply in-thread to HelpScout #293 confirming the new version is in SVN and addressing each cited item point-by-point.

WordPress still reviews the **entire plugin**, not just the diff — so we must do a fresh self-audit (Plugin Check + manual walk-through) before the SVN push.

> Reviewer's standing caveat:
> *"Please note that false positives are possible. As an automated system, we may occasionally make mistakes."*
>
> Strategy this round (same as TTS-247 original): **fix every item that's faster to fix than argue.** None of the 8 cited items has a credible false-positive defence — see §4.

---

## 1a. Cross-check against source (2026-05-29)

Verified the AI-flagged claims against the actual code. All 8 are **real**, no false positives.

| Email claim | Verified in code | Notes |
|---|---|---|
| Trialware: top-post + previous-period analytics calculated only when `is_pro_active()` | ✅ Confirmed — branches inside `aggregated_insights` / `trend_data` / `filtered_insights` short-circuit on `is_pro_active()` then run extra Pro-only math | Same pattern wp.org closed AtlasVoice for in §3.1 of the original ticket: dead premium-feature code in Free. |
| Trialware: player-2 handling / customization code present in Free even though registry exposes only player 1 | ✅ Confirmed in `src/dashboard/components/dashboard/customize/*` + `tta_customize_settings.player_customizations[2]` schema + a few `if (player_id === 2)` branches | Free should ship Player 1 only — Pro registers 2-6 via `tts_available_players`. |
| Custom CSS field — raw user CSS injected via the customization data + client-side settings object | ✅ Confirmed — `tta_customize_settings.custom_css` → carried through `tta_get_button_content()` rendering params → echoed via inline `<style id="tts_button_settings_..."></style>` and into the localized `tta_obj` JS object | New 2026 wp.org rule: arbitrary CSS/JS/PHP is no longer permitted. |
| Invalid Terms/Privacy URL — `https://atlasaidev.com/terms-of-use/` 404 in readme | ✅ Real (URL returns 404). Real working pages are `https://atlasaidev.com/terms-and-conditions/` and `https://atlasaidev.com/privacy-policy/` — verified live 2026-05-29 | Already fixed in working copy. |
| Chart.js out-of-date — v4.4.7 at `admin/js/vendor/chart.umd.min.js` | ✅ Confirmed; npm latest stable is **4.5.1** (May 2025) | Already fixed in working copy. |
| `file_put_contents` direct write — `includes/TTA_Translation_Downloader.php` `download_file()` | ✅ Confirmed; line was wrapped in a `phpcs:ignore` but reviewer still flagged it. WordPress-best-practice swap is `WP_Filesystem::put_contents()` | Already fixed in working copy. |
| Inline `<script>` + `<style>` HTML tags in code | ✅ Confirmed — `includes/helpers.php` `tta_get_button_content()` emits an inline `<style>` block for the button's per-post CSS variables and an inline `<script id="tts_button_settings_N">` for the localized button settings JSON | Soft-flag — convert to `wp_enqueue_style` + `wp_localize_script`. |
| External services disclosure — all 4 entries must list (a) purpose, (b) data + when, (c) ToS + Privacy URLs | ✅ Verified — only the AtlasAiDev Tracker entry had broken URLs; fixed. The other 3 (Catalog, Translations, Geolocation) already meet all three criteria | Already fixed in working copy. |

**Discrepancies worth noting in the reply:**

- None this round — every claim maps cleanly to a real code location. Don't waste reviewer time on clarifications.

---

## 2. Status legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🟨 | In progress |
| ✅ | Done |
| 🔁 | Needs re-test |
| ⛔ | Blocked |
| ❌ | Won't fix (justified) |

---

## 3. Master fix table

### 3.1 Trialware continuation (Guideline 5 / 6)

| # | Area | File(s) / Symptom | Action | Priority | Status |
|---|---|---|---|---|---|
| T1 | Trialware: top-post + previous-period analytics calculated only when `is_pro_active()` | `api/AtlasVoice_Analytics.php` + `admin/TTA_Admin.php` (Free); `Api/TTA_Pro_AtlasVoice_Analytics.php` + `Includes/TTA_Pro_Filters.php` (Pro); `src/dashboard/components/dashboard/analitics/*` (frontend) | **DONE — filter-injection model (§3.1a) implemented + verified.** Free: deleted previous-period branch + `get_previous_period_dates()`, removed post-type cap, removed all `is_pro_active()` from analytics handlers, added `tts_analytics_response` / `tts_analytics_post_list` / `tts_trackable_post_ids` filters + `tts_capabilities` key. Pro: `register_analytics_filters()` injects previous-period, the all-sentinel, and `{previousPeriod, heatmap, export, scheduleReports, extendedDateRange}` capabilities. Frontend: removed every `is_pro_active`/demo-data/overlay from Analitics, BrowserAnalytics, DeviceTypes, EngagementFunnel, PopularPosts, ListenerSegments, GlobalDateRangePicker, ExportSection — sections now render by data-presence / `capabilities.*`. Built (`npm run production`); fresh `tab-analytics.chunk.js` has 0 `is_pro_active`, 3 `capabilities` gates. wp-cli verified: `aggregated_insights`→`previous` injected, `trend_data`→not, post-list + trackable-ids sentinels present. | P0 | ✅ |
| T2 | Trialware: player-2 handling / customization code in Free | `src/dashboard/components/dashboard/customize/*` — Pro-only `if (player_id === 2)` branches, `player_customizations[2]` defaults in the Customize React state, any Pro-skin assets referenced from Free's bundles. Also `includes/helpers.php` `tta_get_button_content()` callers that switch on player id > 1 | **DONE — moved player-2..6 code into Pro via the mounted-island model (§3.1b) + verified across Free-only / Free+Pro / stale-id.** Free: deleted the whole `src/dashboard/buttons/` tree (`TextToSpeech`, `TextToSpeechThree/Four`, dead `TextToSpeechTwo`) + `button.js` + its webpack entry + the `copyProButton` task; `Customize.js` preview branches collapsed to player-1 `ButtonPreview` + an empty `#tts_customize_pro_preview` slot for ids > 1 (with an `availablePlayers` fallback to player 1 for stale Pro ids); `TTSButtonDesign`/`ButtonStateEditor` gated to player 1 only; `build_player_customizations()` emits id 1 only. Pro: new `src/dashboard-customize/` bundle (`text-to-audio-dashboard-pro.min.js`) mounts its OWN React tree into Free's slot and renders the moved components, reading `data-player-id`/`data-button-css`/`data-button-texts` (re-renders via MutationObserver on player switch); Pro builds its own `text-to-audio-pro-button.min.js` (cutting the copyProButton dep); demo preview assets restored under Pro `demos/`. Built; grep confirms 0 player-2..6 component code in Free's `tab-customize.chunk.js`. | P0 | ✅ |

### 3.1a Analytics architecture — filter-injection model (the T1 design)

**Goal:** Free contains **zero** premium analytics code and **zero** `is_pro_active()` checks; the React dashboard contains **zero** license checks. "Is a premium feature available" is answered by one question only — *is the data present?* This is the strongest possible answer to Guideline 5: there is nothing locked in Free to flag, because Free holds no premium logic and no gate.

#### Principle

```
Free computes base data → fires a response filter → returns response
                                    │
                          Pro (if active) hooks the filter,
                          computes premium data, splices it in
                                    │
Frontend renders each section ONLY if its data slice is present in state.
No is_pro_active(), no should_activate_pro_features — anywhere.
```

When Pro is inactive the filter has no listeners, so the response carries only free data and the premium UI sections never render. When Pro is active its filter callbacks enrich the same Free response. The data's existence *is* the permission.

#### Two endpoint shapes — handled differently

| Shape | Examples | Where it lives | Frontend visibility signal |
|---|---|---|---|
| **Display data** (rides on a page-load response) | previous-period comparison, heatmap matrix, top-N-beyond-free | **Filter-injected into Free's existing display routes.** No Pro route, no Free stub. | the data slice is present in state |
| **Action endpoints** (user-triggered, no display payload) | `export_csv`, `export_pdf`, `save_schedule_report`, `get_schedule_report`, `send_test_report` | **Stay entirely in Pro under `tta_pro/v1/`** (the 2.2.1 split — Free has NO route and NO stub). | a `capabilities` flag present in state |

Why the split: filter-injection only works when there's a server response to enrich. Downloads (CSV/PDF) and settings writes (schedule) have no dashboard-load payload to ride on. Forcing them through a Free route would re-create exactly the "requires Pro" stub the reviewer already flagged on `send_test_report`. So actions remain Pro-owned routes; only their *button visibility* on the frontend becomes data-driven (see `capabilities` below).

#### Free-side changes (`api/AtlasVoice_Analytics.php`)

1. Delete the previous-period branch (`if ( is_pro_active() && analytics_table_exists() ) { … $previous_aggregated … }`) and the private `get_previous_period_dates()` helper.
2. Delete the "track all post IDs by default" `is_pro_active()` branches (lines ~316/350/405). If "track-all-by-default" is a Pro convenience, Pro supplies it via a new `tts_default_trackable_post_ids` filter — Free just reads the option with no Pro branch.
3. Before returning each display response, fire a filter:
   ```php
   $response = apply_filters( 'tts_analytics_response', $response, $context, $dates, $results );
   // $context = 'aggregated_insights' | 'trend_data' | 'filtered_insights' | 'insights'
   ```
   (One generically-named filter with a `$context` arg, OR one filter per route — decide in §5. A single filter keeps Free's surface minimal.)
4. Free's bootstrap/settings response carries `'capabilities' => apply_filters( 'tts_capabilities', array() )` — default empty array. Free never lists any premium capability itself.

#### Pro-side changes (`text-to-audio-pro`)

1. `TTA_Pro_AtlasVoice_Analytics` (the class added in 2.2.1) gains the previous-period + heatmap computation helpers.
2. Pro hooks `tts_analytics_response` to splice `previous_aggregated` / `heatmap` / extended top-posts into the Free response per `$context`.
3. Pro hooks `tts_capabilities` to return `array( 'export' => true, 'scheduleReports' => true, 'heatmap' => true, 'previousPeriod' => true, … )`.
4. Pro **keeps** its `tta_pro/v1/` action routes (export/schedule/test-email) exactly as 2.2.1 left them — those are not collapsed.
5. Pro hooks `tts_default_trackable_post_ids` → `['all']` if that default is wanted.

#### Frontend changes (`src/dashboard/components/dashboard/analitics/*`)

1. Remove every `is_pro_active` / `should_activate_pro_features` check from the analytics components.
2. Replace with data-presence guards:
   ```js
   { state.previousPeriod && <ComparisonSection data={state.previousPeriod} /> }
   { state.heatmap        && <HeatmapSection data={state.heatmap} /> }
   { state.capabilities?.export && <ExportButton /> }
   { state.capabilities?.scheduleReports && <ScheduleSection /> }
   ```
3. The display-analytics fetch layer calls **Free's** routes only (`aggregated_insights`, `trend_data`, …) and reads premium slices straight off the same response — it no longer calls `tta_pro/v1/heatmap_data` for the *display* matrix. (Heatmap *display* data moves into the filter-injected response; the `tta_pro/v1/export_*` action routes stay.)
4. Export / Schedule buttons POST to the Pro `tta_pro/v1/` action routes exactly as before — only their render condition changes from `is_pro_active` to `capabilities.*`.

#### New filter contract (document in the free-pro bridge doc)

| Filter | Fired by | Hooked by Pro to | Default (Pro inactive) |
|---|---|---|---|
| `tts_analytics_response` | Free analytics routes | add previous-period / heatmap / top-N per `$context` | unmodified base response |
| `tts_capabilities` | Free bootstrap/settings | return premium capability flags | `array()` |
| `tts_default_trackable_post_ids` | Free analytics settings | return `['all']` | option value as-is |

#### Cross-version impact

| Site | Behavior |
|---|---|
| Free-only | base analytics only; premium sections never render (no data, no capability flags). No change vs today. |
| Free 2.2.2 + Pro 3.3.0 | Pro's filters enrich responses + set capabilities → full dashboard renders exactly as today. |
| Free 2.2.2 + Pro ≤ 3.2.x (transient) | Pro 3.2.x doesn't register the new filters → premium sections gracefully hidden until Pro updates. Resolved by shipping Pro 3.3.0 first (release-ordering rule, §6). |
| All players (1-6) | analytics is post/listener data — player-independent. No impact. |

#### Net change

- **Free:** ~30 lines deleted from `AtlasVoice_Analytics.php` (premium branches + helper), ~4 lines added (filter fires + capabilities key). Zero `is_pro_active()` inside any analytics handler. Zero premium math.
- **Frontend:** every analytics license check replaced by a data-presence guard. Zero `is_pro_active` in the dashboard.
- **Pro:** gains the computation helpers + 3 filter hooks; keeps its action routes unchanged.

---

### 3.1b Player-code move — mounted-island model (the T2 design)

**Goal:** the Free ZIP ships code for **player 1 only**. All player-2..6 implementation (frontend players + customize preview + per-player customization controls) lives in **Pro**, so there is no locked player code in Free to flag under Guideline 5.

#### Audit findings (what was actually in Free, and who owned it at runtime)

| Surface | Runtime owner | Disposition |
|---|---|---|
| Frontend players 2-6 on posts (`TextToSpeechPro.min.js`, Plyr, `text-to-audio-pro-button.min.js`) | **Pro already self-sufficient** | n/a |
| Free's `button.js` + `TextToSpeechThree/Four.js` (frontend renderer) | Free bundle, but **never executes** (free = player 1 only; Pro ships its own) | **moved to Pro** |
| Customize dashboard (`text-to-audio-dashboard-ui` bundle) | **Always Free**, even when Pro active (Pro has no React dashboard of its own) | stays Free |
| Player-2..6 preview components + player-2 customization controls inside that bundle | Free bundle — rendered the Pro previews when Pro active | **moved to Pro** |
| `TextToSpeechTwo.js` | imported nowhere (player 2 preview used the `TextToSpeech` base) | **deleted as dead code** |

#### Why mounted-island, not a filter-returned component

Stage-0 found both plugins bundle their **own React 17** via Laravel Mix `.react()`; neither uses `wp-element` as a shared external. A filter that returns a Pro-built JSX element rendered inside Free's React tree would throw "two copies of React". The existing cross-plugin hook (`ttsProPlayerDesign`) works only because it passes **plain data, not components**. So instead of forcing a shared-React migration across 8+ bundles (high blast radius), the preview crosses the boundary as a **mounted island**:

```
Free Customize.js renders, for player ids > 1, an empty slot:
  <div id="tts_customize_pro_preview"
       data-player-id data-button-css data-button-texts />
  (and renders only the player-1 ButtonPreview itself)
        │
Pro's dashboard-customize bundle (its OWN React 17) finds that node and
  ReactDOM.render(<ProPreview …/>, slot), reading the data-* attributes;
  a MutationObserver re-renders on player switch / draft edits.
```

Each plugin keeps its own React (no migration), DRY is preserved (Pro renders the **moved** components), and no player-2..6 code ships in Free.

#### Free-side changes

1. Delete `src/dashboard/buttons/` (the `TextToSpeech` base + `TextToSpeechThree/Four`, and dead `TextToSpeechTwo`) and `src/dashboard/button.js`; drop the `button.js` webpack entry and neutralise the `copyProButton` gulp task.
2. `Customize.js`: replace the `id == 2/3/4/5/6` preview branch chain with the single `#tts_customize_pro_preview` slot for ids > 1, falling back to the player-1 `ButtonPreview` when the saved id isn't in `ttsObj.availablePlayers` (stale-Pro-id safety — mirrors `get_player_id()`'s server-side capability fallback).
3. `TTSButtonDesign.js` / `ButtonStateEditor.js`: change the `playerId === 1 || playerId === 2` gate to player-1 only.
4. `admin/TTA_Admin.php` `build_player_customizations()`: emit the icon map for id 1 only (Pro appends id 2 via the existing `tts_player_customizations` filter).
5. `TTA_Hooks` minification-exclusion list: drop `text-to-audio-pro-button.min.js` (Pro now adds its own).

#### Pro-side changes

1. New `src/dashboard-customize/` source tree holds the moved components, built to `text-to-audio-dashboard-pro.min.js` (the preview island) and `text-to-audio-pro-button.min.js` (frontend pro-button, from Pro source — replaces the copyProButton copy).
2. `index.js` mounts the island into `#tts_customize_pro_preview`, renders the player-2..6 preview, and re-renders on `data-*` changes.
3. `TTA_Pro_Actions::enqueue_customize_preview()` enqueues the island on the AtlasVoice page (Pro active only) after Free's `text-to-audio-dashboard-ui`.
4. `TTA_Pro_Hooks` adds the new bundles to the JS/CSS minification-exclusion lists.

#### Demo preview assets (sub-issue surfaced during T2)

The customize previews depend on demo CSS/JS/audio that TTS-247 had deleted from Free's `admin/demos/`. Those are Pro-only preview assets, so they were **restored inside Pro** (`text-to-audio-pro/demos/`): player-2 styling + the `TextToSpeechProDemo` speechSynthesis class (which defines `window.TextToSpeechPro` used by the player-2 play handler), and the player-3..6 Plyr demo player. Notes:

- Demo scripts are enqueued **independently** (not as dependencies of the React bundle) so a demo-script issue can never blank the dashboard.
- The Plyr demo plays each preview once and loads provider sample clips per player — player 4 → Google `en-US-Wavenet-C.wav`, player 5 → OpenAI `alloy.wav`, players 3/6 → bundled local mp3 — with the `<source>` MIME type derived from the file extension. (Remote sample URLs are acceptable here because this is the **Pro** plugin, not the wp.org free ZIP that Guideline 8 governs.)
- The preview effect lists `buttonId` in its deps and clears the container before re-init, so switching players loads the correct clip.

#### Cross-version impact

| Site | Behavior |
|---|---|
| Free-only | Customize shows player 1 only (selector + preview + controls); the slot is never created for ids > 1 (those aren't selectable); frontend plays player 1. No player-2..6 code in the ZIP. |
| Free 2.2.2 + Pro 3.3.0 | Pro mounts the island → players 1-6 preview + controls render; frontend players 2-6 play from Pro's own bundles. |
| Pro removed, stale id (e.g. 3) saved | Customize preview + frontend both fall back to player 1 (capability fallback), no JS error. |

---

### 3.2 Arbitrary code insertion (NEW)

| # | Area | File(s) / Symptom | Action | Priority | Status |
|---|---|---|---|---|---|
| A1 | Custom CSS setting exposes raw user CSS | UI: `src/dashboard/components/dashboard/customize/design/TTSButtonDesign.js` (the `<textarea name="custom_css">`) + `Customize.js` `customCSS` state/prop wiring. Save: `api/TTA_Api_Routes.php` `tta_manage_customize_data()`. Render: `includes/helpers.php` `tta_get_button_content()` → frontend `admin/js/text-to-audio-button.js` injected `settings.customCSS` verbatim as `<style>`. Schema/defaults: `includes/TTA_Activator.php`, React defaults. | **DONE — raw-CSS field removed + migrated to WP core Additional CSS (see §3.2a).** Textarea replaced with a note + deep-link to Appearance → Customize → Additional CSS; `customCSS` plumbing removed from `Customize.js`/`CustomizationTabs.js`/`TTSButtonDesign.js`; `custom_css` read dropped from `helpers.php` + the verbatim `<style>` injection removed; defaults removed from `TTA_Activator.php` + `TextToSpeech.js`. One-time migration (`TTA_Activator::migrate_custom_css_to_additional_css()`, guarded by `tta_custom_css_migrated`, wired on the upgrader hook + `admin_init` fallback) appends any saved value to the theme's Additional CSS via `wp_update_custom_css_post()`; original DB value preserved. Player 1 converted shadow→light DOM with a defensive typography reset so Additional CSS reaches it. Verified: no textarea (link present), migration runs, button renders + plays in light DOM, no theme leak, no console errors. | P0 | ✅ |

### 3.2a Custom CSS removal + Additional-CSS migration (the A1 design)

**Goal:** remove the arbitrary-CSS textarea (the barred category) **without** stranding users who relied on it — by migrating their CSS into WordPress core's sanctioned Additional CSS editor and making player 1 actually stylable from there.

#### The shadow-DOM problem (why "just use Additional CSS" isn't enough on its own)

The frontend button is a custom element (`<tts-play-button>`) that calls `this.attachShadow({mode:'open'})` and appends its `<style>` + wrapper **inside the shadow root** (`admin/js/text-to-audio-button.js` ~line 881). Shadow DOM is an isolation boundary: **light-DOM CSS (which is where WP core's Additional CSS lives) cannot reach inside it.** So removing the field and telling users "use Additional CSS" would be a dead end — their CSS wouldn't apply to the button. Only CSS variables, `::part()`, and a few inheritable props cross a shadow boundary.

**Decision:** drop the shadow DOM for **player 1 only** (the Free player) and render it into the light DOM, so Additional CSS reaches it. Players 2-6 (Pro: speechSynthesis-Pro + Plyr) keep their shadow DOM — they're unaffected by this change and their previews/players already work as-is.

#### Leak study — measured on a live page (2026-05-30, `…/mcp-10-simple-daily-habits…`)

Inspected the shadow `<style>` the button currently ships and compared against the theme's global rules:

- The shadow style **explicitly declares** all the major box/visual props on the button: `display, width, height, font-size, color, background-color, border, border-radius, padding, margin(-*), box-shadow, cursor, text-decoration, transition, outline, gap, …`.
- Our scoping selector is `#tts__listent_content_N.tts__listent_content` — **ID + class** specificity, which **outranks any theme `button{…}` rule** (element-level). So every property we explicitly set still wins in the light DOM → **no "leak-in" for those props.**
- **The only real leak surface** is the handful of inheritable/typographic props we *don't* declare, which a theme's `button{}` or global rules could impose: `font-family, line-height, text-transform, letter-spacing, word-spacing, text-shadow, font-weight, font-style`. (e.g. a theme doing `button{text-transform:uppercase}` would bleed in.)
- Leak-**out** is already contained: every selector is ID-scoped, so the button's styles can't affect the rest of the page.

#### Leak-prevention plan

Add a small **defensive reset** to player 1's light-DOM style block, scoped to the same ID selector, neutralising exactly the props the audit flagged as leak-prone — so the button looks identical to its old shadow-DOM rendering regardless of theme:

```css
#tts__listent_content_N.tts__listent_content,
#tts__listent_content_N.tts__listent_content * {
    font-family: inherit;          /* or the plugin's chosen stack */
    line-height: normal;
    text-transform: none;
    letter-spacing: normal;
    word-spacing: normal;
    text-shadow: none;
    font-style: normal;
}
```

This is **additive** — it sits alongside the existing ID-scoped declarations (already high-specificity), so user/theme Additional CSS targeting the same selector with equal-or-higher specificity still wins where intended. The reset only blocks unintended inheritance of typographic props, not deliberate styling.

#### Migration of existing saved CSS

One-time, on upgrade to 2.2.2:

1. Read `tta_customize_settings['custom_css']`. If empty → nothing to do.
2. Append it to the active theme's Additional CSS using WP core's API:
   ```php
   $existing = wp_get_custom_css();                     // current Additional CSS
   $marker   = "\n\n/* Migrated from AtlasVoice Custom CSS (v2.2.2) */\n";
   wp_update_custom_css_post( $existing . $marker . $saved_custom_css );
   ```
   (`wp_update_custom_css_post()` writes the `custom_css` CPT that the Customizer → Additional CSS panel reads/edits — the sanctioned, core-sanitized store.)
3. Guard with a one-shot option flag (e.g. `tta_custom_css_migrated`) so it runs once.
4. **Do not delete** `tta_customize_settings['custom_css']` from the DB (preserve the original value as a safety copy); just stop reading/echoing it.

Caveat to note in the upgrade notice: Additional CSS is **per-theme**, so the migrated block lives under the theme active at upgrade time; if the user switches themes they re-add it (same as any Additional CSS). Also, migrated rules now apply in the light DOM — author them against `#tts__listent_content_N` / `.tts__listent_content` (unchanged selectors), which is exactly what the old field used.

#### UI change

Replace the `<textarea name="custom_css">` in `TTSButtonDesign.js` with a short note + link:
> *Custom CSS has moved. Use Appearance → Customize → Additional CSS.*
linking to `customize.php?autofocus[section]=custom_css`. Remove the `customCSS` state/prop plumbing from `Customize.js` and the `custom_css` key from React defaults + `TTA_Activator.php` defaults.

#### Free / Pro split

All of the above lives in **Free** (the button element, the migration hook, the Customize UI are Free-owned), so **Pro inherits the fix automatically** — player 1 is the Free player, and the Pro players (2-6) are untouched. No Pro-side change required for A1.

#### Cross-impact / risk

| Concern | Handling |
|---|---|
| Player 1 loses shadow-DOM isolation | ID-scoped styles already win over theme rules; defensive typography reset covers the only measured leak-in surface. |
| Existing users lose their Custom CSS | Migrated into per-theme Additional CSS on upgrade; original value preserved in DB as backup. |
| Theme switch after migration | Documented in upgrade notice (Additional CSS is per-theme). |
| Players 2-6 | Unchanged — still shadow DOM; not in scope. |

---

### 3.3 Inline assets (soft-flag → fix)

| # | Area | File(s) / Symptom | Action | Priority | Status |
|---|---|---|---|---|---|
| I1 | Inline `<script>` carrying per-button settings JSON | `includes/helpers.php` `get_enqueued_js_object()` (called via `tta_get_button_content()` → `do_action('tts_enqueue_button_scripts')`) emitted `<script id="tts_button_settings_N">…</script>` inside a `wp_print_footer_scripts` closure | Replaced the raw inline `<script>` with paired `wp_add_inline_script(..., 'before')` calls — one for Free's `text-to-audio-button` handle, one (gated by `wp_script_is(..., 'registered')`) for Pro's `text-to-audio-pro-button` handle, so the per-button payload lands on whichever button-script handle is actually registered (Free-only sites use Free's, Pro-active sites use Pro's; Pro doesn't enqueue Free's button JS when its own is loaded). Closure hook priority dropped from default 10 → 5 so it runs **before** core's `wp_print_scripts` (also priority 10), otherwise the inline data is queued too late and silently dropped. Payload is IIFE-wrapped so multiple buttons on one page don't collide on shared `var` names; all `window.TTS.contents[N]` / `window.TTS.extra[N]` / `window.ttsObj.settings.settings` writes preserved verbatim. Verified live on a Pro-active page (player 1, post 175) — exactly one `<script id="text-to-audio-pro-button-js-before">` block on the page, ordered before `text-to-audio-pro-button-js`, IIFE side-effects intact. PHP `-l` clean. | P1 | ✅ |
| I2 | Inline `<style>` in the page from the player JS | Player 1's `<style id="tts_style">` (the per-button rules), surfaced into the page when A1 moved player 1 to the light DOM; plus the pre-existing settings-modal `<style id="tts-settings-modal-styles">` injected into `<head>` by `TTSPlayButton.injectStyles()` | **DONE — option (a)+(b) combined.** New enqueued stylesheet `admin/css/text-to-audio-button.css` holds all the selector/state/layout rules + the settings-modal CSS (migrated out of `injectStyles()`, now a no-op). The dynamic per-button values (colours/size/border/margins + `--tts-hover-*`/`--tts-icon-display`) are built in PHP from the global customize settings (`tta_get_player_button_inline_css()`) and attached via **`wp_add_inline_style('text-to-audio-button', …)`** — WP renders them in `<head>`, NOT as a `style=""` attribute. JS no longer injects any `<style>` (light DOM) or sets inline styles. Players 2-6 keep their isolated shadow-DOM `<style>` (never in the page). `data-id` attr also hardened with `esc_attr()`. Verified live: **zero plugin `<style>` tags** in the page (only WP core's `wp-custom-css`), no `style=""` on host/button, button styled from head CSS, playback + gear modal work. | P1 | ✅ |
| I3 | Audit for any other inline `<script>` / `<style>` Plugin Check flags | repo-wide | Player-1 frontend now emits **no** inline `<script>` (I1) or `<style>` (I2) — verified via live DOM scan. Remaining: run the repo-wide grep + Plugin Check during the pre-SVN audit to confirm no other surfaces. | P1 | 🟨 |

### 3.4 Readme URL validity

| # | Area | File(s) | Action | Status |
|---|---|---|---|---|
| U1 | Invalid Terms/Privacy URL in readme — `https://atlasaidev.com/terms-of-use/` 404 | `readme.txt` lines 197-198 in the `== External services ==` block, AtlasAiDev Tracker entry | Replaced with `https://atlasaidev.com/terms-and-conditions/` and `https://atlasaidev.com/privacy-policy/` — both verified live via the browser before commit | ✅ |

### 3.5 Library updates

| # | Area | File(s) | Action | Status |
|---|---|---|---|---|
| L1 | Chart.js out-of-date | `admin/js/vendor/chart.umd.min.js` (was 4.4.7) | Replaced with the official UMD build from `cdn.jsdelivr.net/npm/chart.js@4.5.1`. File header preserves the upstream attribution at `https://www.chartjs.org`. 205,909 → 208,522 bytes | ✅ |
| L2 | (Lookahead) Audit other bundled vendor libs for staleness before SVN push | `admin/js/vendor/*` | One-pass check: `countries-and-timezones`, Plyr, and anything else in the `admin/js/vendor/` directory. Bump any that have a newer stable. Reviewer will run the same check on the resubmission | ⬜ |

### 3.6 Filesystem API

| # | Area | File(s) | Action | Status |
|---|---|---|---|---|
| F1 | Direct `file_put_contents` in translation downloader | `includes/TTA_Translation_Downloader.php` `download_file()` | Swapped to `WP_Filesystem`: `require_once ABSPATH . 'wp-admin/includes/file.php'`, `WP_Filesystem()`, `$wp_filesystem->put_contents( $local_path, $body, FS_CHMOD_FILE )`. Returns false cleanly when credentials can't be obtained (FTP-credentialed installs) | ✅ |
| F2 | (Defensive) Audit for any other direct `file_put_contents`, `fopen`, `fwrite`, `mkdir`, `unlink` in Free | repo-wide | `grep -rnE 'file_put_contents|fopen|fwrite|mkdir|unlink' includes/ admin/ api/` — every hit gets `WP_Filesystem::*` or `wp_mkdir_p` / `wp_delete_file` per WP convention | ⬜ |

### 3.7 External services audit

| # | Area | Action | Status |
|---|---|---|---|
| E1 | `== External services ==` block in `readme.txt` — every entry must satisfy (a) what the service is and what it's used for, (b) what data is sent and the exact trigger, (c) Terms of Service + Privacy Policy links | Re-audited 2026-05-29. All 4 documented services pass: AtlasAiDev Tracker (track.atlasaidev.com), AtlasAiDev plugin catalog (raw.githubusercontent.com), Translation downloads (api.github.com + raw.githubusercontent.com), Geolocation lookups (ip-api.com / ipinfo.io / icanhazip.com). All ToS + Privacy URLs verified live | ✅ |

### 3.8 Build / Release

| # | Area | Action | Status |
|---|---|---|---|
| B1 | Bump `Version:` in `text-to-audio.php` header → **2.2.2** | text-to-audio.php (plugin header line + `TEXT_TO_AUDIO_VERSION` constant define) | ⬜ |
| B2 | Bump `Stable tag:` in `readme.txt` → **2.2.2** | readme.txt header | ⬜ |
| B3 | Add `== Changelog == = 2.2.2 =` block | readme.txt | ⬜ |
| B4 | Add `== Upgrade Notice == = 2.2.2 =` block — explain Custom CSS migration to WP core Customizer | readme.txt | ⬜ |
| B5 | `npm run production` + `npm run block:build` to rebuild bundles after T1/T2/A1/I1/I2 React changes | repo root | ⬜ |
| B6 | `npm run makeZip` → release ZIP in `production/` | repo root | ⬜ |

### 3.9 Verification

| # | Action | Status |
|---|---|---|
| V1 | Clean WP install, `WP_DEBUG = true`, `WP_DEBUG_LOG = true` | ⬜ |
| V2 | Install built 2.2.2 ZIP; activate; no PHP notices/warnings | ⬜ |
| V3 | Run Plugin Check — "Checks complete. No errors found." | ⬜ |
| V4 | Smoke: shortcode `[tta_listen_btn]` and block render with no inline `<style>` / `<script>` in the page source (Plugin Check + manual DOM inspection) | ⬜ |
| V5 | Smoke: Customize tab no longer shows Custom CSS textarea or Player 2/3+ controls when Pro is not active | ⬜ |
| V6 | Smoke: Pro active → React dashboard's premium analytics views still populate (top-post + previous-period) via Pro routes | ⬜ |
| V7 | Smoke: translation downloader still writes locale `.mo` files on locale change (WP_Filesystem path) | ⬜ |
| V8 | Smoke: `admin/js/vendor/chart.umd.min.js` v4.5.1 loads cleanly on the Analytics tab; no console errors | ⬜ |

### 3.10 Release / Re-review

| # | Action | Status |
|---|---|---|
| F1 | Merge `feature/TTS-247` (2.2.2 commits) into `develop` via git flow finish | ⬜ |
| F2 | `git flow release start 2.2.2` → finish, tag locally | ⬜ |
| F3 | SVN: copy build to `trunk/` | ⬜ |
| F4 | SVN: `svn cp trunk tags/2.2.2` | ⬜ |
| F5 | SVN commit | ⬜ |
| F6 | Reply in-thread to HelpScout #293 — concise, point-by-point for each of the 8 items, reference the SVN tag | ⬜ |
| F7 | Wait for re-review; capture team feedback | ⬜ |

---

## 4. False-positive analysis

Per the reviewer's standing invitation to flag mistakes, every AI-marked (`✨`) claim was checked against the source. **None warrant pushback this round.** Documented here so we don't relitigate:

| # | Claim | Real or false positive? | Decision |
|---|---|---|---|
| FP1 | Top-post + previous-period analytics only when `is_pro_active()` (T1) | **Real** — Free's analytics methods contain Pro-only math branches that short-circuit on `is_pro_active()` then continue to compute extra metrics; the extra metrics shouldn't ship in the Free build | Fix: move the math to Pro. Same pattern wp.org closed AtlasVoice for in §3.1 of the original ticket; arguing would be slow and reviewer's escalated warning rules out a second chance |
| FP2 | Player-2 handling/customization in Free (T2) | **Real** — the React Customize tab still has Pro-only branches for player 2 customizations and the `player_customizations[2]` schema. wp.org's view: the code shouldn't be in the Free build at all | Fix: strip the Pro-specific branches from Free's React; Pro can carry its own customization additions. (The `tts_available_players` filter pattern from TTS-247 already cleanly separates the player *registry*; what's left is just the customization UI.) |
| FP3 | Custom CSS field allows arbitrary CSS insertion (A1) | **Real, and a new 2026 wp.org rule** — plugins may not persist arbitrary user CSS/JS/PHP. WP core's Customizer "Additional CSS" exists for this | Fix: ✅ field removed; any saved value migrated to WP core's Additional CSS (`wp_update_custom_css_post`), and player 1 moved to the light DOM so that core-sanitized CSS actually reaches the button. |
| FP4 | Invalid Terms/Privacy URL (U1) | **Real** — the URL in readme returned 404 | Fix: ✅ already corrected to the working `terms-and-conditions/` and `privacy-policy/` paths |
| FP5 | Out-of-date Chart.js (L1) | **Real** — 4.4.7 is from late 2024, latest stable is 4.5.1 (May 2025) | Fix: ✅ upgraded to 4.5.1 |
| FP6 | Direct `file_put_contents` in translation downloader (F1) | **Real** — even gated by a `phpcs:ignore`, reviewer wants `WP_Filesystem` | Fix: ✅ swapped to WP_Filesystem |
| FP7 | Inline `<script>` + `<style>` tags in output (I1/I2) | **Real** — both come out of `tta_get_button_content()`. Reviewer's email explicitly says "admin screens are not considered an exception, and neither are inline styles or scripts" | Fix: ✅ script → `wp_add_inline_script` (I1); style → enqueued stylesheet + `wp_add_inline_style` in `<head>` (I2). Verified zero inline `<script>`/`<style>` in the player-1 output. |
| FP8 | External services need 1/2/3 for each entry (E1) | **Met already** after U1 — re-audit confirms all 4 entries have all three pieces | No fix needed; just confirm in the reply |

---

## 5. Open questions (decide before coding)

1. **T1 — Pro analytics math placement.** Option (a) extend Pro's existing `TTA_Pro_AtlasVoice_Analytics` class (added in 2.2.1) to also host the top-post + previous-period helpers; Free's methods just stop computing them. Option (b) ship a separate Pro-only REST route that the React dashboard switches to when Pro is active. *Recommendation: (a) — same pattern as the 5 routes already moved in 2.2.1, no new namespace surface.*
2. **A1 — Custom CSS replacement?** Should we ship a *small* set of customize-tab knobs that achieve the same end without exposing raw CSS (e.g. choose padding / border-radius / shadow from preset sliders)? Or leave styling entirely to WP core's Additional CSS? *Recommendation: leave to WP core — adding sliders re-creates the same surface and is more code to maintain.*
3. **T2 — Player customization data shape.** When we strip `player_customizations[2..6]` from Free's state, Pro will need to re-introduce them via its own React import or via filtering the localized object. Confirm the contract once during the cut and document in the free-pro bridge doc. *Recommendation: Pro extends `tta_obj.player_customizations` via `wp_localize_script` filter; no shared schema needed.*
4. **I1/I2 — Script/style placement during transition.** Some pages render multiple buttons (custom positions). The inline `<script id="tts_button_settings_N">` pattern keyed each block by `N`. Migration target: a single localized object `ttsButtonSettings = { 1: {...}, 2: {...} }` keyed by `N`, populated by repeated `wp_add_inline_script` calls. *Recommendation: validate Plugin Check still passes — sometimes `wp_add_inline_script` is itself considered "inline".*
5. **L2 — Plyr in `admin/demos/`?** The demos folder was excluded from the production ZIP in 2.2.0. Confirm L2's vendor-lib audit covers only ZIP-shipped files; ignore Plyr in demos.

---

## 6. Risk register

| Risk | Mitigation |
|---|---|
| T1 move breaks the React dashboard's "show extra metrics when Pro active" UI on existing Free + Pro 3.2.5 sites (Pro 3.2.5 doesn't expose the moved math yet) | Pro 3.3.0 already includes the moved analytics class (`TTA_Pro_AtlasVoice_Analytics`). Ship the math additions in Pro 3.3.0 *before* Free 2.2.2 reaches users via the wp.org auto-update queue — same release-ordering rule used for TTS-247 (see TTS-247 plan §9.5). The wp.org manual-review delay is the natural buffer. |
| A1 removal of `custom_css` loses any styling existing Free users applied | Preserve the saved option value in DB (don't delete on uninstall mid-release). Add a 2.2.2 upgrade-notice paragraph telling users their Custom CSS is now in WP core's Customizer → Additional CSS and asking them to copy/paste the existing value across. |
| I1/I2 enqueue-conversion breaks page-load order if a theme defers JS | Test on a theme that uses `defer`/`async` (Astra Pro, GeneratePress Premium, Kadence). Use `wp_register_script` + `wp_localize_script` rather than `wp_add_inline_script` where possible — localized objects don't have execution-order constraints. |
| Plugin Check still flags `wp_add_inline_script` as "inline" | Try the localized-object route first; only fall back to `wp_add_inline_script` if a per-button settings difference makes the keyed-localization unworkable. |
| Pro user updates Free to 2.2.2 (via wp.org) while still on Pro 3.2.5 | Same scenario covered by TTS-247 §9.2 / §9.5: ship Pro 3.3.0 first via Freemius, use the wp.org review queue as a buffer; no shim in Free. |

---

## 7. Working notes

_(append as work progresses)_

- **2026-05-29** — Continuation review email received from wp.org reviewer (subject "Re: [WordPress Plugin Directory] Closure Notice - Guideline Violation: Text To Speech TTS Accessibility", 27 May 2026 10:53 AM). Captured verbatim at [`wp-org-review-email-2.2.2.md`](wp-org-review-email-2.2.2.md). 8 items cited.
- **2026-05-29** — Cross-check against source: all 8 are real. Same `feature/TTS-247` branch (no new branch — this is a continuation of the same wp.org closure thread).
- **2026-05-29** — Quick wins landed in working copy:
  - **U1** ✅ — readme.txt lines 197-198 → `https://atlasaidev.com/terms-and-conditions/` + `https://atlasaidev.com/privacy-policy/` (both verified live via browser before commit).
  - **L1** ✅ — `admin/js/vendor/chart.umd.min.js` swapped from 4.4.7 → 4.5.1 (jsDelivr UMD build, 208,522 bytes, header attribution preserved).
  - **F1** ✅ — `includes/TTA_Translation_Downloader.php` `download_file()` switched to `WP_Filesystem::put_contents()` with `wp-admin/includes/file.php` require + `WP_Filesystem()` init + `FS_CHMOD_FILE`.
  - **E1** ✅ — full external-services audit confirms all 4 entries have purpose / data + trigger / ToS + Privacy. No additional readme edits needed beyond U1.
- **T1** ✅ (committed) — analytics filter-injection model implemented + verified across free-only / Free+Pro (see §3.1a). Free holds no premium analytics math and no `is_pro_active()` in any analytics handler.
- **T2** ✅ (committed) — player-2..6 code moved out of Free via the mounted-island model (see §3.1b). Free's `src/dashboard/buttons/` + `button.js` deleted; Pro owns the preview island + frontend pro-button + demo assets.
  - Verified: **Free-only** → selector + preview + controls are player-1 only, frontend plays player 1, no player-2..6 code in the built bundle (grep). **Free+Pro** → preview renders players 1-6 (player switch reactive via MutationObserver), frontend players 2-6 play from Pro's bundle. **Stale id** (saved 3, Pro inactive) → falls back to player 1, no JS error.
  - Sub-fixes landed during T2: restored the Pro `demos/` preview assets (player-2 CSS + `TextToSpeechProDemo` defining `window.TextToSpeechPro`, player-3..6 Plyr demo); fixed a blank-dashboard regression (don't make the React bundle depend on the demo scripts); fixed player-4..6 double-init + stale-clip-on-switch; wired provider sample clips (Google/ChatGPT `.wav` + ext-derived MIME type).
- **A1** ✅ — Custom CSS field removed + migrated to WP core Additional CSS; player 1 moved shadow→light DOM with a defensive typography reset (see §3.2a). Verified free-only + Free+Pro.
- **I1** ✅ / **I2** ✅ — player-1 frontend emits no inline `<script>` or `<style>`. Per-button CSS is now an enqueued stylesheet + `wp_add_inline_style` (head), settings-modal CSS migrated into the same sheet. Verified: zero plugin `<style>` tags in the page.
- **Also (2.2.2 cleanup):** removed the legacy "old player" system entirely (UI toggle + `initOldPlayer` + `getButtonContent` usage + `use_old_player` setting/branches — new player always runs); flattened the player DOM (dropped the `.wrapper` div + the redundant inner `role="region"` div, fixing the duplicate-landmark a11y issue — the host `<tts-play-button>` is now the single region container).
- **Outstanding for 2.2.2 (in priority order)**:
  - I3, F2, L2 — defensive audits (repo-wide inline-`<script>`/`<style>` grep, filesystem-call audit, vendor-lib staleness) — run during the pre-SVN pass
  - B1-B6 → V1-V8 → F1-F7 (version bump, build, verify, release) — last
- **2026-05-30** — T1 + T2 completed on `feature/TTS-247` (Free + Pro). T2 was the largest item; resolved with the mounted-island approach (§3.1b) rather than a shared-React migration, after Stage-0 confirmed both plugins bundle their own React. Full design + plan: [`TTS-249-T2-player-code-move.md`](TTS-249-T2-player-code-move.md).
- **2026-05-31** — A1 + I1/I2 completed on `feature/TTS-247` (Free). Custom CSS removed/migrated to WP core Additional CSS; player 1 moved to the light DOM so that CSS reaches it; all per-button + settings-modal CSS moved to an enqueued stylesheet + `wp_add_inline_style` (no inline `<style>`/`style=""`). Also removed the old-player system and flattened the player DOM (two redundant wrapper divs gone). `data-id` output hardened with `esc_attr()`. Verified live across free-only, Free+Pro, and stale-id states; no console errors. **A1, I1, I2 done — remaining 2.2.2 work is the defensive audits (I3/F2/L2) + the release chain (B/V/F).**
