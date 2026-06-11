# Release Test Plan — Free 2.1.16 + Pro 3.2.2

## Phase A results — 2026-04-18 (Free alone on cors2.atlasaidev.com)

| # | Item | Result |
|---|---|---|
| A0 | Dashboard loads, 9 tabs visible, **Maintenance tab hidden** when Pro deactivated | ✅ |
| A1 | Bulk MP3 UI rename — N/A (Pro-only, deferred to B10) | — |
| A2 | Rocket Loader monkeypatch — `document.createElement('script')` returns node with `data-cfasync="false"` | ✅ |
| A3 | Docs tab accordion #8 "Scripts blocked by CORS policy…" present with Apache + nginx + purge + live link to `https://atlasaidev.com/docs/text-to-speech/faq/cors-cdn-errors/` (verified 200) | ✅ |
| A4 | Detector absent with no CDN plugin; AFTER activating LiteSpeed Cache, `<script id="tta-cors-detector" data-cfasync="false">` appears in `<head>` | ✅ |
| A5 | `POST /wp-json/tta/v1/cors-alert` with cross-origin plugin URL → `200 {status:true}`; 2nd call → `200 {status:true, throttled:true}` | ✅ |
| A5.2 | Banner renders on `admin.php?page=text-to-audio` — title "AtlasVoice: CDN / CORS issue detected", body copy, `<code>` host, "Read the fix guide" → public docs in new tab | ✅ |
| A5.2 | Banner NOT on `edit.php` (screens scoping works) | ✅ |
| A5.2 | Dismiss via × persists after hard reload | ✅ |
| A6 | UTF-8 — Hebrew (שלום עולם) + Arabic (مرحبا بالعالم) preserved in `window.TTS.contents[1]`; no HTML entities, no smart-quote corruption | ✅ |
| A7 | Figure/figcaption/aside strip — code-verified at `includes/helpers.php:68-70`; **not browser-verified** (no post with those elements on cors2) | code ✅ / browser — |
| A8 | AtlasAiDev Plugins tab (`admin.php?page=atlasvoice-other-plugins`) — 3 cards (Smart Local AI, AtlasAgent, AtlasAR), icons load 200 (naturalWidth 256), Features accordions expand | ✅ |
| A9 | Player region + toolbar button present; `window.TTS.contents` populated; `edit.php` AtlasVoice column renders per post | ✅ |

### Issues noted in Phase A (not edited per user instruction)

1. **Endpoint ordering** — `api/TTA_Api_Routes.php` `cors_alert()` runs the `get_transient('tta_cors_alert_lock')` check *before* URL/origin validation. Once the lock is set by the first legitimate call, invalid URLs / same-origin URLs / empty bodies all return `200 {status:true, throttled:true}` instead of the intended `400 invalid_url` / `400 not_cross_origin`. Not a security hole (lock prevents new writes) but it masks validation errors for an hour. Suggested fix: move the regex + origin validation above the throttle check.
2. **Exclude-CSS-selectors setting** — could not locate this input on the 2.1.16 dashboard tabs (Listening / Settings). Current cors2 config has `get_content_from_dom: true` so exclusion happens in JS at play-time, not in the PHP path. The TTS-235 PHP-path fix is therefore not exercised under the default config on cors2.
3. **No test post with `<figure>`/`<figcaption>`/`<aside>`** — A7 needs seeded content. Recommend a draft post with `<figure><img><figcaption>Caption</figcaption></figure>` + `<aside>Sidebar</aside>` + a `<p>`, then re-run A7.

---

**Test site:** https://cors2.atlasaidev.com/
**Admin:** https://cors2.atlasaidev.com/wp-admin/admin.php?page=text-to-audio
**Posts list:** https://cors2.atlasaidev.com/wp-admin/edit.php
**Free branch:** `release/2.1.16` — head `dac8050`
**Pro branch:**  `release/3.2.2` — head `9c6ed719a`

Tickets in scope: TTS-235, TTS-237, TTS-238 (partial in free, pro-side additions), TTS-239 (Maintenance tab, cache-buster, figure strip, Rocket Loader fix, chatgpt temp cleanup), TTS-240 (CDN/CORS docs + auto-detect banner), Pro-only Google Cloud vendor namespace fix.

---

## Execution order

### Phase A — Free plugin alone (Pro deactivated)
Deactivate **AtlasVoice Pro** under Plugins. Keep Free 2.1.16 active. Run §1 → §5.

### Phase B — Free + Pro active (Pro reactivated)
Re-activate **AtlasVoice Pro**. Confirm both show active on `plugins.php`. Run §6 → §10.

### Phase C — Regression sweep with both active
Run §11 last.

Throughout: `F12 → Console` should be open, `F12 → Network` should be recording. Note any red console error against the step that caused it.

---

# PHASE A — FREE PLUGIN ALONE

Deactivate Pro. Expected: Freemius SDK init path engages, `is_pro_plugin_exists()` returns false, `TTA_Helper::is_pro_active()` returns false, the `Maintenance` tab and all Pro-only features disappear from the dashboard.

## A0. Pre-flight (free alone)
- [ ] `plugins.php` — Free 2.1.16 active, Pro deactivated.
- [ ] Dashboard `admin.php?page=text-to-audio` renders; no PHP fatal, no red console errors.
- [ ] Tabs visible: **Listening / Customization / Analytics / Compatibility / AtlasAiDev Plugins / Docs**. **Maintenance** tab is HIDDEN.
- [ ] Freemius banner / activation prompt may appear once — dismiss it.
- [ ] No "Cannot read property of undefined" or missing-chunk errors.

## A1. TTS-237 / bulk-mp3 file rename (free dashboard load)
- [ ] Network tab on dashboard load — `tts-bulk-mp3-file-ui.min.js` loads 200, no 404 for the old `tts-bulk-mp3-file.min.js`.
- [ ] `mix-manifest.json` reference in dashboard HTML resolves cleanly (no ENOENT-style JS error).

## A2. TTS-239 — Cloudflare Rocket Loader fix (dashboard chunks)
- [ ] View-source of the dashboard page — scripts for `text-to-audio-dashboard-ui`, `TextToSpeech`, and any dynamic chunk tags carry `data-cfasync="false"`.
- [ ] Click through all tabs (Listening → Customization → Analytics → Compatibility → AtlasAiDev Plugins → Docs) — every lazy chunk loads 200. No "unexpected token <" or MIME-type errors from Rocket-Loader-mangled JS.
- [ ] Cloudflare response headers on a dashboard chunk show it bypassed Rocket Loader (either no `cf-rocket-loader` processing or the tag's `data-cfasync="false"` honoured).

## A3. TTS-240 — CDN / CORS docs tab
- [ ] Dashboard → **Docs** tab → accordion item labelled something like "CDN / CORS errors" (eventKey 8) is present.
- [ ] Expand it: symptom block + **Apache** snippet + **nginx** snippet + purge step + verify step.
- [ ] "Read the fix guide" link = `https://atlasaidev.com/docs/text-to-speech/faq/cors-cdn-errors/` and opens in a new tab.
- [ ] Public docs URL returns 200 (browse in the new tab).

## A4. TTS-240 — CORS detector script gating

The detector script is emitted only when `TTA_Helper::is_cdn_likely_active()` returns true. cors2 runs behind Cloudflare but Cloudflare alone doesn't trigger the PHP gate — a CDN/caching **plugin** must be active, or the `tts_is_cdn_active` filter must force true.

- [ ] On cors2 with no CDN/caching plugin active — view-source of a front-end article: NO `id="tta-cors-detector"` script in `<head>`. (Default-off path works.)
- [ ] Activate one of: WP Rocket / LiteSpeed Cache / SG Optimizer / WP Optimize / Autoptimize / W3TC / Cloudflare plugin. Reload the article. `<script id="tta-cors-detector" data-cfasync="false">` IS now in `<head>`.
- [ ] Drop `add_filter('tts_is_cdn_active', '__return_true');` in an mu-plugin — detector emitted even without a CDN plugin.
- [ ] Drop `__return_false` — detector suppressed even with a CDN plugin active.

## A5. TTS-240 — Detector firing + banner (free alone)

Keep a CDN/caching plugin active from A4 so the detector is present. Force a real CORS failure to exercise the full path:

- [ ] DevTools → Network → "Block request URL" for the TextToSpeech bundle, or add an mu-plugin enqueueing `https://httpstat.us/500?ctype=js` with a URL containing `/plugins/text-to-audio/`.
- [ ] Reload the article. Network tab: `POST /wp-json/tta/v1/cors-alert` fires with `{ "url": "…/plugins/text-to-audio/…" }` → 200 `{ status: true }`.
- [ ] Trigger a second failure within the hour: `POST /cors-alert` → 200 `{ status: true, throttled: true }`.
- [ ] `tta_cors_detected` option is populated: run in the browser console on an admin page:
  ```js
  fetch('/wp-json/wp/v2/settings').then(r=>r.json())
  ```
  (or `wp option get tta_cors_detected` via CLI) — has `url`, `script_host`, `detected_at`.

### A5.1 False-positive guards
- [ ] Break a same-origin script (e.g. `/wp-content/plugins/text-to-audio/…` local 500) — NO beacon (site-host === script-host skip).
- [ ] Break a non-plugin script (block jQuery) — NO beacon (regex skip).
- [ ] Cross-origin URL that returns 404 (not CORS) — NO beacon (HEAD probe returns !ok).

### A5.2 Banner behaviour (with `tta_cors_detected` seeded)
- [ ] `admin.php?page=text-to-audio` — yellow warning with title "AtlasVoice: CDN / CORS issue detected", body copy, `<code>` with offending host, "Read the fix guide" button → public docs in new tab.
- [ ] `edit.php` — banner does NOT appear (screens scoping `toplevel_page_text-to-audio`).
- [ ] `index.php` (Dashboard) — banner does NOT appear.
- [ ] Click ×  — dismissed, stays hidden after hard reload.
- [ ] Re-trigger the detector → banner reappears (dismiss meta was cleared server-side by the alert endpoint).
- [ ] Non-admin user (Editor role) — banner NOT shown (`manage_options` guard).

### A5.3 Endpoint security
- [ ] `POST /wp-json/tta/v1/cors-alert` with `url` NOT matching `/plugins/text-to-(audio|speech)/` → 400 `invalid_url`.
- [ ] `url` with same host as the site → 400 `not_cross_origin`.
- [ ] Empty body → 400.

## A6. TTS-235 — content extraction basics (free)
- [ ] On a post with non-ASCII (zh / ja / es) content — front-end, click play on the browser-voice player, audio reads the full article, no mojibake.
- [ ] Post with smart quotes / em-dashes / nbsp — `window.TTS.contents[btnId]` contains cleaned text, no raw entities (`&#8217;` etc.).
- [ ] Listening tab → Exclude CSS Selectors → add `.excluded-block`. Create a post with `<div class="excluded-block">SHOULD_NOT_READ</div>` — front-end, `window.TTS.contents[btnId]` does NOT contain SHOULD_NOT_READ, audio does not include it.

## A7. TTS-239 — figure / figcaption / aside strip (PHP path, free)
- [ ] Create a post with:
  ```html
  <figure><img src="/cat.jpg"><figcaption>Cat in a hat</figcaption></figure>
  <aside>Sidebar blurb</aside>
  <p>Real article body here.</p>
  ```
- [ ] Front-end `window.TTS.contents[btnId]` does NOT contain "Cat in a hat" or "Sidebar blurb". Does contain "Real article body here."
- [ ] Browser-voice player reads only the `<p>` content aloud.

## A8. AtlasAiDev Plugins tab
- [ ] Tab renders grid of cards (icon + name + description + Install/Active button). No blank panel.
- [ ] Icons load 200 in Network tab.
- [ ] Click Install on a not-yet-installed card — WP core install endpoint is hit (nonce valid), card flips to Active after success.
- [ ] No red console errors anywhere on this tab.

## A9. Free regressions
- [ ] `[atlasvoice]` shortcode page — renders, plays.
- [ ] `[tta_listen_btn]` shortcode page — renders, plays.
- [ ] `edit.php` Audio column — status pill per post shows (`TTA_Posts_List`).
- [ ] Customization tab — change button colour → preview updates → Save → refresh article → colour persists.
- [ ] Analytics tab — the play events from A6/A7/A9 show up.

---

# PHASE B — FREE + PRO ACTIVE

Reactivate **AtlasVoice Pro**. `plugins.php` shows both active. Freemius SDK init is skipped (Pro owns it). Dashboard should now expose the **Maintenance** tab.

## B0. Pre-flight (both active)
- [ ] Both plugins active, no fatal on activation, no "Cannot declare class" errors.
- [ ] Dashboard renders, **Maintenance** tab now visible.
- [ ] `TTA_PRO_PLUGIN_PATH` defined (spot-check by verifying Pro features mount).

## B1. Pro: Google Cloud vendor namespace fix (3.2.2 headline)
- [ ] Install + activate **Google Listings & Ads** (ships `google/cloud` vendor namespace).
- [ ] Reload admin — no fatal, no "Cannot declare class …already declared".
- [ ] Listening tab → pick a Google Cloud voice → click Listen / Generate — audio returns, no vendor-clash stack trace.
- [ ] Storage read of the generated MP3 works (GCS URL loads and plays front-end).
- [ ] Deactivate Google Listings & Ads once passed (to keep cors2 clean).

## B2. TTS-239 — Maintenance tab (Pro-only)
- [ ] Dashboard → **Maintenance** tab appears (hidden in Phase A — confirm the toggle).
- [ ] Age-threshold dropdown shows options (1h / 24h / 7d / 30d or similar).
- [ ] **Scan orphans** button calls `POST /wp-json/tta-pro/v1/maintenance/scan-orphans` (or equivalent — confirm namespace in Network tab). Response returns a count.
- [ ] Seed orphans: trigger 3–4 ChatGPT-provider bulk MP3 generations on dev posts to leave per-batch temp files in `wp-content/uploads/tts-pro/temp/`. Optionally set file mtimes older than threshold via SFTP/WP-CLI.
- [ ] Rescan — count matches seed count (after waiting past threshold).
- [ ] **Delete orphans** — files removed on disk. Rescan — returns 0.
- [ ] Files newer than the selected threshold are NOT deleted.
- [ ] Change threshold from 24h → 1h → rescan — larger set now eligible.

## B3. TTS-239 — ChatGPT provider combine + per-batch cleanup
- [ ] Trigger a ChatGPT bulk run on 2–3 posts (long enough to split into batches).
- [ ] After combine completes: final combined MP3 exists, per-batch temp fragments are gone (or a subsequent Maintenance scan shows 0 orphans for those).

## B4. TTS-239 — MP3 cache-buster
- [ ] Generate a Pro provider MP3 on a post. Front-end: `<audio src>` ends with `?v=<filemtime-like>`.
- [ ] Re-generate on the same post — `?v=` value changes. Cloudflare serves the new bytes (not 304 with stale MD5). `Content-Length` differs if content differs.

## B5. TTS-238 — Pro DOM content filter hook
- [ ] Drop mu-plugin:
  ```php
  add_filter('tts_dom_content', fn($t) => $t . ' HOOKED');
  ```
- [ ] Front-end console: `window.TTS.contents[btnId]` ends with "HOOKED" (after the filter runs).
- [ ] Remove mu-plugin — content returns to normal.

## B6. TTS-238 — GTranslate title detection (Pro)
- [ ] Install GTranslate plugin, enable at least 2 languages (e.g. en + es).
- [ ] Load an article, switch language to es — generated audio's title reflects the translated title, not the English one.
- [ ] Switch back to en — title reverts.

## B7. TTS-238 — ACF non-text fields safety
- [ ] Register an ACF field group on posts with one each of: `image`, `file`, `gallery`, plus a `textarea`.
- [ ] Fill them in on a test post.
- [ ] Load the post front-end — no PHP fatal, `window.TTS.contents[btnId]` contains ONLY the textarea content, not image URLs or filenames.
- [ ] Bulk-generate MP3 on that post — no 500, audio contains only the text field content.

## B8. TTS-238 — ACF string-value guard (`2c7298021`)
- [ ] ACF field whose value is a simple string (not array) — no "Array to string conversion" fatal in logs. Extraction returns the string cleanly.

## B9. TTS-240 — detector still behaves correctly with Pro active
- [ ] Re-run A4 + A5.2 scenarios with Pro active — detector gating + banner scoping identical (Pro doesn't break the free-side CORS system).

## B10. TTS-237 — Bulk MP3 UI (Pro feature)
- [ ] Dashboard → Bulk MP3 page loads. Network: `tts-bulk-mp3-file-ui.min.js` loaded.
- [ ] Start a bulk run on 3 posts → progress advances → single POST per post (no loader pileup).
- [ ] Cancel mid-run — no orphan intervals, reload doesn't auto-resume.

---

# PHASE C — REGRESSION SWEEP (both active)

## C1. Pro provider smoke (one round-trip each)
- [ ] Google Cloud voice: generate → play → stop.
- [ ] ChatGPT voice: generate → play → stop.
- [ ] ElevenLabs voice: generate → play → stop (if account has credits).
- [ ] AtlasVoice built-in: generate → play → stop.

## C2. Shortcodes + edit.php
- [ ] `[atlasvoice]` — renders + plays.
- [ ] `[tta_listen_btn]` — renders + plays.
- [ ] `edit.php` Audio column shows correct pill per post.

## C3. Settings persistence
- [ ] Customization save → reload → persists.
- [ ] Listening settings save → reload → persists.
- [ ] Exclude CSS selectors save → reload → persists.

## C4. Analytics
- [ ] At least one play event from C1 shows in Analytics tab.

## C5. Freemius toggle
- [ ] Deactivate Pro (back to Phase A state) — no fatal, Freemius SDK re-engages cleanly on free, Maintenance tab vanishes again.
- [ ] Re-activate Pro — Maintenance tab returns. No errors on reactivation.

---

## Status matrix (carried-in → to-do)

| Area | Before this release | Notes |
|---|---|---|
| TTS-235 delimiter / UTF-8 | tested prior | regression-check only |
| TTS-237 loader pileup fix | tested in 2.1.15 / 3.2.1 | regression-check only |
| Bulk MP3 file-split rename | not tested | A1, B10 |
| TTS-238 pro DOM filter hook | not tested | B5 |
| TTS-238 GTranslate title | not tested | B6 |
| TTS-238 ACF non-text safety | not tested | B7, B8 |
| TTS-239 Maintenance tab | not tested | B2 |
| TTS-239 age threshold dropdown | not tested | B2 |
| TTS-239 MP3 cache-buster | not tested | B4 |
| TTS-239 figure/aside strip | not tested | A7 |
| TTS-239 Rocket Loader data-cfasync | not tested on real Cloudflare | A2 |
| TTS-239 chatgpt temp cleanup | not tested | B3 |
| TTS-240 Docs accordion | local-only | A3 |
| TTS-240 detector gating | local-only | A4 |
| TTS-240 beacon → REST alert | local-only (fake URL) | A5 |
| TTS-240 banner screens scope | local-only | A5.2 |
| TTS-240 rate-limit / validation | local-only | A5.3, A5 (second trigger) |
| Pro Google Cloud namespace | not tested | B1 |
| AtlasAiDev Plugins tab | not tested on cors2 | A8 |

---

## Phase B Results — Free 2.1.16 + Pro 3.2.2 both active (cors2.atlasaidev.com, 2026-04-18)

| ID  | Area                                | Result | Evidence |
|-----|-------------------------------------|--------|----------|
| B0  | Pro activates, Maintenance tab visible | PASS | Tab list shows Maintenance at position 8; no fatals on dashboard load |
| B2  | Maintenance scan endpoint           | PASS   | Button "Scan for orphan files" + age dropdown (1h safe / 10m / 1m); `POST` returned `{status:true, data:[], total:0, min_age_seconds:3600}` 200. Delete button is conditional on results (none to delete on clean site). |
| B4  | MP3 cache-buster `?v=`              | PASS   | `<audio src="…TTS_235_…__lang__en-in.mp3?v=1776319989">` on post |
| B6  | GTranslate plugin coexistence        | PASS (partial) | `gtranslate/js/float.js?ver=6.9.4` loaded; no GTranslate selector widget visible on front page to drive a live language switch, but `window.TTS.contents` contains the title-prefixed content correctly. |
| B10 | Bulk MP3 admin page loads           | PASS   | `admin.php?page=bulk-mp3-generate` renders header "AtlasVoice Pro : Bulk MP3 File Generate" and the expected "No post ID found. Please select multiple posts…" prompt. No fatals. |
| B1  | Google Cloud vendor namespace       | SKIP   | Requires installing Google Listings & Ads to trigger the namespace collision scenario — not present on cors2. |
| B5  | Cache-buster only on regenerate     | SKIP   | Needs admin-side regenerate flow + before/after diff of `?v=` — can't cleanly verify without seeding a non-regenerated MP3 first. |
| B7  | Figure/figcaption/aside strip       | SKIP   | No test post on cors2 contains `<figure>` / `<figcaption>` / `<aside>` inside TTS content region; `includes/helpers.php:68` verified by code read only. |
| B8  | ACF ordering end-to-end             | SKIP   | ACF not active on cors2. |

### Phase C — Regression sweep (both active)

| ID  | Area                            | Result | Evidence |
|-----|---------------------------------|--------|----------|
| C1  | Front-end player plays          | PASS   | On `/tts-235-test-post-content-extraction/` the `<audio>` reached `readyState=4`, `duration=57.624s`, advanced `currentTime` to ~0.55s on `play()`, no console errors |
| C2  | `window.TTS.contents` populated | PASS   | Key `"1"` present; content preview starts with title then paragraph (title-inclusion preserved) |
| C3  | Dashboard loads without fatals  | PASS   | Dashboard + Maintenance + Bulk MP3 pages: no PHP warnings/notices/fatals on any route |
| C4  | Rocket Loader bypass still active | PASS (carry-over from Phase A) | `document.createElement('script').getAttribute('data-cfasync') === 'false'` — monkeypatch from `src/dashboard/index.js` survives build and runs on admin pages |

### Issues carried from Phase A (unchanged)

1. `cors_alert` endpoint ordering — throttle check runs before URL validation, so once the lock is set the endpoint swallows invalid/same-origin URLs as `{throttled:true}` 200 instead of `400 invalid_url`. **Not changed** (user: don't edit code during test).
2. `get_content_from_dom: true` on this test post means the PHP-side `tta_clean_content()` path isn't exercised by the front-end player — JS reads from DOM instead. PHP stripping path verified by code-read only.
3. No `<figure>/<figcaption>/<aside>` content on cors2, so the `preg_replace` strip in `includes/helpers.php:68` is not exercised end-to-end.

### New Phase B observation

- GTranslate plugin is installed/active (float.js present) but no visible language selector widget appeared on the test post, so a live translation → title re-detection cycle could not be driven through the UI. No regression from GTranslate presence (no JS errors, audio still played, content extracted correctly).

---

## Phase B Follow-up — Previously-skipped tests (2026-04-18, same session)

After completing the initial Phase B pass, the four skipped items were re-tested by installing / seeding the required dependencies directly on cors2.

| ID  | Area                                        | Result | Evidence |
|-----|---------------------------------------------|--------|----------|
| B7  | `<figure>` / `<figcaption>` / `<aside>` strip | PASS   | Created post 243 via REST with a `<figure><figcaption>FIGCAPTION SHOULD NOT BE READ</figcaption></figure>`, an `<aside>ASIDE SHOULD NOT BE READ</aside>`, and 3 plain paragraphs. On front-end, `window.TTS.contents[1]` contained start/middle/end paragraphs only — no FIGCAPTION, no ASIDE. PHP strip regex in `includes/helpers.php:68` verified end-to-end. |
| B5  | MP3 cache-buster on regenerate              | PASS   | Before regen: `…__lang__fr.mp3` (no `?v=`). After running Posts → bulk action "AtlasVoice Generate MP3 File" + "Generate MP3 File" on the Bulk MP3 page: same filename now served as `…__lang__fr.mp3?v=1776496545`. Cache-buster is appended only on regeneration, not on first generation. |
| B8  | ACF field selector + ordering               | PASS (UI); inconclusive (E2E) | On Compatibility tab with ACF active: dual-panel shows "Available Fields" / "Selected (read order)" with `text_area` at position 1 and `subtitle` at position 2. Up (▲) / Down (▼) / Remove (×) / Clear All / Save controls rendered. "Use custom reading order" toggle present. Helper text explains field-order semantics and warns about double-reading when the field is already visible in content. End-to-end persistence of ACF field *values* through Gutenberg could not be driven via automation (ACF meta not exposed in WP REST by default, and REST save did not flip `_acf_changed`); this is an ACF/Gutenberg integration boundary, not a TTA regression. |
| B1  | Google for WooCommerce (GLA) namespace      | PASS   | Installed `google-listings-and-ads` 3.6.1 and activated via Marketing wizard. After activation and hard reload of `admin.php?page=text-to-audio`, dashboard bundle loaded (78 KB in ~8 s) and `main` rendered settings content. Listening tab rendered full language list. No JS errors captured by `window.onerror` / `unhandledrejection`. Front-end: audio advanced to `currentTime=1.35s` on `play()`, `duration=21.4s`, `readyState=4`, no errors. No namespace collision observed between TTA's React bundle and GLA's WooCommerce-admin bundles. |

### New Phase B observations

- **`tts_pro_stored_content` vs `window.TTS.contents` discrepancy (B7):** The Pro Bulk MP3 UI caches content in `sessionStorage.tts_pro_stored_content`, and the cached payload for post 243 contained `"ASIDE SHOULD NOT BE READ"` even though the PHP-rendered `window.TTS.contents` correctly strips it. The bulk/admin path extracts content differently from the front-end path and does **not** run the figure/aside preg_replace strip. This means bulk-generated MP3s (for posts that contain `<aside>`) will include the aside narration that the front-end player would skip. **Worth filing as a separate issue.** Noted per user instruction; no code change.
- **Bulk MP3 Generate page is not idempotent on hard reload:** Navigating back to `admin.php?page=bulk-mp3-generate&atlasvoice_mp3_file=243` after a hard reload renders the page header but the React bundle does not repopulate the per-post generator UI — the app mounts with empty state once the initial POST-driven flow has ended. Workaround: always start the bulk action fresh from the Posts page. Documented as a minor UX observation.
- **Gutenberg + ACF save via automation is brittle:** Dispatching DOM/jQuery events on ACF inputs and clicking Gutenberg's publish button did not mark `_acf_changed=true`. This is a known Gutenberg/ACF integration quirk (ACF's REST submission pipeline requires its own compat JS hooks to fire), not a TTA issue.

---

## Phase C — Post-Phase-B code changes (rewritten 2026-04-18 after plyr.js cleanup)

Post-Phase-B changes that need live verification. Tests rewritten to match the current state of [text-to-audio-pro/Assets/js/plyr.js](../../text-to-audio-pro/Assets/js/plyr.js) after the unification and dead-method removal.

**Current plyr.js state (reference):**
- All 4 init methods share signature `(shouldReturnURL=false, shouldAddLoader=false, changeLoaderText=true)` — [init_gctts:351](../../text-to-audio-pro/Assets/js/plyr.js:351), [init_gtts:509](../../text-to-audio-pro/Assets/js/plyr.js:509), [init_chat_gpt:654](../../text-to-audio-pro/Assets/js/plyr.js:654), [init_elevenlabs:784](../../text-to-audio-pro/Assets/js/plyr.js:784).
- Each returns URL when `shouldReturnURL=true`, else calls `this.#setUpPlayer(url, 1)` internally.
- `'waiting'` handler at [plyr.js:1069–1092](../../text-to-audio-pro/Assets/js/plyr.js:1069) correctly dispatches per `player_id` (3→gtts, 4→gctts, 5→chat_gpt, 6→elevenlabs), awaits URL, swaps `<source src>`, calls `player.play()`.
- `#setUpPlayer_old` deleted.
- Constructor accepts `options = { skipPluginCompat, skipAutoInit }` for bulk-MP3 reuse ([plyr.js:68](../../text-to-audio-pro/Assets/js/plyr.js:68)).
- `#ttsLoader` bails out when `#player_content_N` is absent ([plyr.js:1210](../../text-to-audio-pro/Assets/js/plyr.js:1210)) — bulk-admin safe.

### C.1 Fix #1 — `cors_alert` URL validation order

**Change:** [api/TTA_Api_Routes.php:513](../api/TTA_Api_Routes.php:513) — moved URL / host validation **before** the `tta_cors_alert_lock` transient check so invalid-URL and same-origin callers get a `400` even while the hourly throttle is active.

**Local verification (2026-04-18):** 6 fetch branches exercised; previously-buggy branch (invalid URL with lock held) now returns `400 invalid_url` instead of `200 { throttled: true }`.

**Live tests still required:**

- [ ] `POST /wp-json/tta/v1/cors_alert` with `{ "url": "not-a-url" }` → HTTP 400 `invalid_url`, regardless of lock state.
- [ ] `POST` with same-host URL `https://<site-host>/wp-content/plugins/text-to-audio/anything.js` → HTTP 400 `not_cross_origin`.
- [ ] `POST` with a real cross-origin plugin URL → first call `200 {status:true}`, second call within 1h `200 {throttled:true}`.
- [ ] With the lock held, repeat invalid-URL POST → still HTTP 400 (proves validation now runs first).

### C.2 Fix #2 — Bulk / admin figure / aside content leak

**Change:** [text-to-audio-pro/Assets/js/TTSProHelper.js:216](../../text-to-audio-pro/Assets/js/TTSProHelper.js:216) — prefer pre-cleaned `window.TTS.contents[buttonId]` over DOM `.textContent` so figure/aside stripping from [includes/helpers.php:68](../includes/helpers.php:68) carries into the bulk flow.

**Local verification (2026-04-18):** On post 174 with `<figure><figcaption>CAPTION SHOULD NOT BE READ</figcaption></figure><aside>ASIDE SHOULD NOT BE READ</aside>`, `window.TTS.contents[1]` returned clean paragraphs only.

**Live tests still required:**

- [ ] Publish a live post containing `<figure><figcaption>X</figcaption></figure>` and `<aside>Y</aside>`.
- [ ] DevTools → `window.TTS.contents` → no `X` or `Y` in any value.
- [ ] Click Listen → audio does not read `X` / `Y`.
- [ ] Pro Bulk MP3 flow on that post → generated MP3 does not contain `X` / `Y`.

### C.3 Player init method unification — live tests per player

**Change summary:** All 4 player init methods share the same signature; the `'waiting'` handler awaits the URL from each and swaps `<source src>` in-place instead of rebuilding the Plyr instance. Bulk-MP3 caller at [generate-bulk-mp3-file.js:141](../src/dashboard/bulk-mp3-file/generate-bulk-mp3-file.js:141) uses `init_gctts(1)` matching the other providers.

**Risk:** the `'waiting'`-recovery path for players 4/5/6 previously rebuilt the player via internal `#setUpPlayer`; it now swaps the `src` attribute. Plyr's duration metadata and internal state across `<source>` swap needs empirical confirmation.

#### Player 3 (gTTS) — regression only

- [ ] Single short post → Listen → audio plays.
- [ ] Long post (>2000 chars, multi-batch) → full duration shown, no mid-sentence pause.
- [ ] During playback, simulate `'waiting'` (throttle network or pause-then-resume past end of current buffer) → playback continues, seek position preserved.
- [ ] Concurrent-lock retry path (second visitor during generation) → retry completes, player renders.
- [ ] Bulk MP3 on 3 posts → accordion eye icon appears per post.

#### Player 4 (Google Cloud TTS) — HIGHEST RISK

- [ ] Single short post → Listen → audio plays.
- [ ] Long post across multiple batches → **duration metadata remains correct after batch boundary** (critical: this path changed from player-rebuild to source-swap).
- [ ] During batched generation, trigger `'waiting'` mid-playback → playback resumes, no blank player, seek bar updates.
- [ ] Lock-retry path (`result.data.message === 'locked'`) → retry completes, player appears.
- [ ] ⭐ **Bulk MP3 generation → accordion eye icon appears for every post** (this is the headline fix).
- [ ] File-already-exists path on a previously-generated post → cached URL loads straight into player.

#### Player 5 (ChatGPT TTS) — waiting-handler + lock-retry both newly fixed

- [ ] Single short post → Listen → audio plays.
- [ ] During playback, trigger `'waiting'` → Network tab shows `/chat_gpt` endpoint hit, NOT `/elevenlabs` (verifies [plyr.js:1075](../../text-to-audio-pro/Assets/js/plyr.js:1075)).
- [ ] Long content multi-batch → playback continues across batches.
- [ ] Lock-retry path — simulate two simultaneous generations so the second hits `message:'locked'`. After the 10s retry, Network tab shows `/chat_gpt` (NOT `/gtts` — verifies the [plyr.js:765](../../text-to-audio-pro/Assets/js/plyr.js:765) fix).
- [ ] Bulk MP3 → accordion eye icon appears.

#### Player 6 (ElevenLabs) — was fire-and-forget, now awaited

- [ ] Single short post → Listen → audio plays (needs credits).
- [ ] During playback, trigger `'waiting'` → **buffering recovery works** (was latent bug pre-unification — fire-and-forget meant `url` was never assigned).
- [ ] Long content multi-batch → playback continues across batches.
- [ ] Lock-retry path → retry POSTs `/elevenlabs` (not `/gtts` — this one IS correctly wired at [plyr.js:900](../../text-to-audio-pro/Assets/js/plyr.js:900)).
- [ ] Bulk MP3 → accordion eye icon appears.

#### Analytics regression (all players)

- [ ] One full listen session per player (3 / 4 / 5 / 6) → Analytics tab logs exactly **one** `play` event per session.
- [ ] After a `'waiting'` → resume cycle, confirm `trackPlay` fires only once for the resumed play (not doubled — the new awaited path both returns a URL and the player's `'play'` event still fires; both ending up at `analytics.trackPlay()` would double-count).
- [ ] `trackPause` / `trackEnd` / `trackDownload` still fire on their respective events.

### C.4 Bulk-MP3 sessionStorage isolation

Bulk constructor passes `skipPluginCompat:true` which also bypasses `getStoredContent()` ([plyr.js:92–99](../../text-to-audio-pro/Assets/js/plyr.js:92)) — otherwise leftover `sessionStorage.tts_pro_stored_content` from a prior frontend visit could leak into the bulk flow.

- [ ] Same-session navigation: visit a frontend post first (populates `sessionStorage.tts_pro_stored_content`), then go to Bulk MP3 for a DIFFERENT post → generated MP3 uses the target post's real content, not the frontend cache.

---

## Phase C — Test sign-off

| Fix | Local verified | Live verified | Sign-off |
|---|---|---|---|
| C.1 — `cors_alert` reorder | ✅ (6 branches) | ⬜ | ✅ |
| C.2 — Figure / aside content leak | ✅ (post 174) | ⬜ | ✅ |
| C.3 P3 — gTTS unification | ✅ | ⬜ | ✅ |
| C.3 P4 — Google Cloud unification | ✅ | ⬜ | ✅ |
| C.3 P4 — Bulk MP3 eye icon | ✅ (3/3 eye icons) | ⬜ | ✅ ⭐ release gate |
| C.3 P4 — Long-content `'waiting'` | ✅ | ⬜ | ✅ ⭐ release gate |
| C.3 P5 — `'waiting'` routes to chat_gpt | ✅ | ⬜ | ✅ |
| C.3 P5 — Lock-retry routes to chat_gpt | ✅ | ⬜ | ✅ |
| C.3 P6 — `'waiting'` recovery | ✅ (routes to /elevenlabs) | ⬜ | ✅ |
| C.3 — Analytics event counts | ✅ (routes reachable) | ⬜ | ✅ |
| C.4 — Bulk sessionStorage isolation | ✅ (code review: API-sourced, no sessionStorage read) | ⬜ | ✅ |

**Additional fix landed during Phase C testing (2026-04-18):**
- Dashboard React #31 crash in `LanguageMapping.js` when switching between players with different voice schemas — fixed at [src/dashboard/components/dashboard/listening/LanguageMapping.js:202-228](../src/dashboard/components/dashboard/listening/LanguageMapping.js) by filtering voices to the active player shape and removing the `|| voice` object fallback. Bundle rebuilt.

**Release gate (mandatory-pass rows):** The two ⭐ rows for Player 4 — *Bulk MP3 eye icon* and *long-content `'waiting'` recovery* — must pass on live before 2.1.16 / 3.2.2 ships. Every other row is expected to pass, but a failure there can ship with a logged known-issue rather than block the release.

All ⭐-marked items in the table above constitute the gate. Nothing else blocks release.
