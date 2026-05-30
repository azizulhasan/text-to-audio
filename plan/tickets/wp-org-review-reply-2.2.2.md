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
| T2 | Trialware: player-2 handling / customization code in Free | `src/dashboard/components/dashboard/customize/*` — Pro-only `if (player_id === 2)` branches, `player_customizations[2]` defaults in the Customize React state, any Pro-skin assets referenced from Free's bundles. Also `includes/helpers.php` `tta_get_button_content()` callers that switch on player id > 1 | Strip all player-2 (and higher) branches from Free's React + PHP code paths. Free's customize form should show only Player 1 controls; Pro registers Players 2-6 via `tts_available_players` filter (already wired). Rebuild `admin/js/build/*` bundles | P0 | ⬜ |

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

### 3.2 Arbitrary code insertion (NEW)

| # | Area | File(s) / Symptom | Action | Priority | Status |
|---|---|---|---|---|---|
| A1 | Custom CSS setting exposes raw user CSS | `src/dashboard/components/dashboard/customize/TTSCustomization.js` (Custom CSS `<textarea>`); `includes/TTA_Helper.php` customize-settings schema (`custom_css` key + sanitization); `tta_customize_settings` option storage; `includes/helpers.php` `tta_get_button_content()` where `custom_css` is echoed into the inline `<style>` block and into the localized `tta_obj` settings object | Remove the Custom CSS textarea from the Customize tab; drop `custom_css` from the customize-settings schema, sanitization, and default values; stop reading it in `tta_get_button_content()`; delete the stored value on uninstall. Existing per-site installs that already saved a `custom_css` value: leave the option key intact in DB so the value isn't destroyed, but stop reading/echoing it. Users who need site CSS can use WP core's Customizer → Additional CSS, which is sanitized + reviewable by core | P0 | ⬜ |

### 3.3 Inline assets (soft-flag → fix)

| # | Area | File(s) / Symptom | Action | Priority | Status |
|---|---|---|---|---|---|
| I1 | Inline `<script>` carrying per-button settings JSON | `includes/helpers.php` `get_enqueued_js_object()` (called via `tta_get_button_content()` → `do_action('tts_enqueue_button_scripts')`) emitted `<script id="tts_button_settings_N">…</script>` inside a `wp_print_footer_scripts` closure | Replaced the raw inline `<script>` with paired `wp_add_inline_script(..., 'before')` calls — one for Free's `text-to-audio-button` handle, one (gated by `wp_script_is(..., 'registered')`) for Pro's `text-to-audio-pro-button` handle, so the per-button payload lands on whichever button-script handle is actually registered (Free-only sites use Free's, Pro-active sites use Pro's; Pro doesn't enqueue Free's button JS when its own is loaded). Closure hook priority dropped from default 10 → 5 so it runs **before** core's `wp_print_scripts` (also priority 10), otherwise the inline data is queued too late and silently dropped. Payload is IIFE-wrapped so multiple buttons on one page don't collide on shared `var` names; all `window.TTS.contents[N]` / `window.TTS.extra[N]` / `window.ttsObj.settings.settings` writes preserved verbatim. Verified live on a Pro-active page (player 1, post 175) — exactly one `<script id="text-to-audio-pro-button-js-before">` block on the page, ordered before `text-to-audio-pro-button-js`, IIFE side-effects intact. PHP `-l` clean. | P1 | ✅ |
| I2 | Inline `<style>` carrying per-button CSS variables | Same `tta_get_button_content()` — emits `<style id="tts_button_settings_style_N"></style>` with the customize colors / sizes | Either (a) move to a `wp_enqueue_style()` + `wp_add_inline_style()` pattern hung off `text-to-audio-button` handle, or (b) replace inline-style with CSS custom properties set on a wrapper element via `style="--tts-bg: …"` (no inline `<style>` tag). Option (b) is cleaner and survives Plugin Check's "no inline styles" rule | P1 | ⬜ |
| I3 | Audit for any other inline `<script>` / `<style>` Plugin Check flags | repo-wide | `grep -rn '<script' includes/ admin/` and `grep -rn '<style' includes/ admin/` — every hit either gets enqueued + localized or removed. Document the audit in §7 working notes | P1 | ⬜ |

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
| FP3 | Custom CSS field allows arbitrary CSS insertion (A1) | **Real, and a new 2026 wp.org rule** — plugins may not persist arbitrary user CSS/JS/PHP. WP core's Customizer "Additional CSS" exists for this | Fix: remove the field. No defensible workaround (sanitization isn't enough — the whole *category* of feature is now barred) |
| FP4 | Invalid Terms/Privacy URL (U1) | **Real** — the URL in readme returned 404 | Fix: ✅ already corrected to the working `terms-and-conditions/` and `privacy-policy/` paths |
| FP5 | Out-of-date Chart.js (L1) | **Real** — 4.4.7 is from late 2024, latest stable is 4.5.1 (May 2025) | Fix: ✅ upgraded to 4.5.1 |
| FP6 | Direct `file_put_contents` in translation downloader (F1) | **Real** — even gated by a `phpcs:ignore`, reviewer wants `WP_Filesystem` | Fix: ✅ swapped to WP_Filesystem |
| FP7 | Inline `<script>` + `<style>` tags in output (I1/I2) | **Real** — both come out of `tta_get_button_content()`. Reviewer's email explicitly says "admin screens are not considered an exception, and neither are inline styles or scripts" | Fix: enqueue + localize (script) and inline-style-attribute or `wp_add_inline_style` (style) |
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
- **Outstanding for 2.2.2 (in priority order)**:
  - T1 (Pro analytics math move) — P0, biggest scope item
  - T2 (player-2 code strip from Free) — P0, biggest React refactor
  - A1 (Custom CSS field removal) — P0, isolated to one tab + one settings key
  - I1 + I2 (inline → enqueue) — P1, mechanical but touches every button-render path
  - I3, F2, L2 — defensive audits, run after the P0 items land
  - B1-B6 → V1-V8 → F1-F7 (version bump, build, verify, release) — last
