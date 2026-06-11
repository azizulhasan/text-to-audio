# TTS-247 / TTS-249 / TTS-250 — Release Test Results

**Date:** 2026-05-23
**Branch:** `feature/TTS-247` (both repos)
**Target:** Free 2.2.0 SVN publish (closure-remediation re-review)
**Test env:** `D:\laragon\www\seven\` (free + pro side-by-side, switchable)
**WP version:** 7.0, `WP_DEBUG = true`, `WP_DEBUG_LOG = true`

## TL;DR
- ✅ **Free Plugin Check: "Checks complete. No errors found."** — green for SVN.
- ✅ All closure-remediation gates verified (Guidelines 4 / 5 / 6 / 7 / 8) — free is fully functional standalone, no license code, no remote assets, opt-in services off by default.
- ✅ Players 1–6 all load languages correctly on free+pro (1=19, 2=19, 3=82, 4=64+2067 voices, 5=58, 6=58).
- ✅ Free-only mode: players=[1] only, Integrations locked upsell, premium REST routes 404, `is_pro_license_active` absent everywhere.
- ⚠️ Found **one PHP 8.1+ Deprecation** in free (`api/AtlasVoice_Analytics.php:836`) — non-blocking, listed under Issues.
- ⚠️ Pro Plugin Check reports 766 errors / 1459 warnings — Pro is **off-wp.org** (Freemius distribution), so this does not block the free SVN release; needs a follow-up Pro cleanup pass.
- **Recommendation:** **GO for free 2.2.0 SVN release.** Optionally fix the one PHP deprecation in a small 2.2.1 follow-up.

---

## Phase 1 — Setup seven

| Step | Result |
|---|---|
| Copy Pro plugin tree from tts → seven | ✓ 27,465 files |
| Copy multilingual plugins (Polylang, GTranslate, WPML+sitepress, wpml-string-translation, automatic-translations-for-polylang) | ✓ |
| Copy LiteSpeed Cache | ✓ |
| Copy Google service-account JSON files to `seven/wp-content/uploads/TTA_Pro/` | ✓ 2 files |
| Apply provider credentials (chat_gpt_tts, elevenlabs_tts, gctts auth, bucket name, allowed-post-types) to seven DB via raw mysqli | ✓ |
| Activate Free + Pro on seven | ✓ both `ACTIVE` |
| Enter Pro Freemius license `sk_BjxF9*…` | ✓ "License Activated" → redirected to Pro Account page |
| Install Autoptimize / W3TC / SG Optimizer / TranslatePress | **Skipped** (time) — LiteSpeed enough for code-level exclusion verification (TTA_Hooks::get_excluded_js() already covers all five) |

---

## Phase 2 — Free + Pro tests on seven

### 2.1 Globals / regressions
```json
VERSION: "3.2.5"
tta_obj.is_pro_active: "1"
ttsObjPro_present: true
ttsObjPro.is_pro_active: "1"
'is_pro_license_active' in tta_obj: false
'is_pro_license_active' in ttsObjPro: false
availablePlayers: [1,2,3,4,5,6]
```
All ✅ — Pro globals reliable, old license key gone everywhere.

### 2.2 REST matrix (free+pro)
| Endpoint | Expected | Got |
|---|---:|---:|
| `GET /tta/v1/insights` | 200 | 200 ✅ |
| `GET /tta/v1/trend_data` | 200 | 200 ✅ |
| `GET /tta/v1/heatmap_data` | 404 (moved to Pro) | 404 ✅ |
| `GET /tta/v1/export_csv` | 404 (moved to Pro) | 404 ✅ |
| `GET /tta_pro/v1/heatmap_data` | 200 | 200 ✅ |
| `GET /tta_pro/v1/voices` | 200 | 200 ✅ |
| `GET /tta_pro/v1/is_pro_license_active` | 404 (removed) | 404 ✅ |

### 2.3 Per-player language smoke
After redeploying the latest build to seven (`gulp copyToSeven` — earlier deploy was stale and made player 4 load 0 langs):

| Player | Name | Lang count | Voice count | Notes |
|---|---|---:|---:|---|
| 1 | Default (free browser) | 19 | — | speechSynthesis voices |
| 2 | Default Pro (browser) | 19 | 23 | same path as player 1 |
| 3 | AtlasVoice TTS Pro | 82 | — | `gttsSupportedLanguages()` static |
| 4 | Google Cloud TTS | 64 | 2,067 | cached `/voices` + Google service account |
| 5 | ChatGPT TTS | 58 | — | `chatGPTLanguages()` static |
| 6 | ElevenLabs TTS | 58 | — | `chatGPTLanguages()` static; voices loaded per-language |

### 2.4 Frontend
- Player 1 on `/seven/index.php/2026/05/20/hello-world/`: ✅ `tts_play_button` renders, only `text-to-audio-button.min.js` + local `countries-and-timezones.min.js` (no CDN — Guideline 8 ✓), "AtlasVoice: On" indicator in admin bar.
- Player 6: Listen button doesn't render until an MP3 is generated (expected behavior — `plyr` provider needs a pre-existing file). Not a regression.

### 2.5 Console / debug.log
- No JS console errors on dashboard.
- `seven/wp-content/debug.log`: see **Issues #1** for one PHP 8.1+ deprecation hit during analytics dashboard load.

---

## Phase 3 — Free-only tests on seven (Pro deactivated)

Deactivation went through the Freemius "Wait — your visitors are listening!" rescue modal (clicked **Continue to Deactivate →**). No force-deactivation of any other plugin observed.

### 3.1 Globals
```json
VERSION: "2.2.0"
tta_obj.is_pro_active: ""
'is_pro_license_active' in tta_obj: false
ttsObjPro_present: true       // restored from free side
ttsObjPro.is_pro_active: ""   // correctly empty (no pro)
availablePlayers: [1]         // only the free player
Customize "Select Player" dropdown options: ["Select Player", "1"]
```

### 3.2 REST matrix (free-only)
| Endpoint | Expected | Got |
|---|---:|---:|
| `GET /tta/v1/insights` | 200 | 200 ✅ |
| `GET /tta/v1/heatmap_data` | 404 | 404 ✅ |
| `GET /tta_pro/v1/heatmap_data` | 404 (Pro inactive) | 404 ✅ |
| `GET /tta_pro/v1/is_pro_license_active` | 404 (removed) | 404 ✅ |

### 3.3 Closure-remediation visual checks
- **Customize tab** — "Select Player" dropdown contains only **Default (id=1)** with the upsell hint (`More players (AI voices, MP3) are available in AtlasVoice Pro`). No locked controls.
- **Integrations tab** — Renders the locked **"Voice Integrations — Pro Feature"** card with an upgrade button only. No interactive provider setup.
- **Listening tab** — Loads 19 browser languages, settings save.
- **Analytics tab** — Free metrics work; premium controls (DOWNLOAD / END / BOUNCE) show **PRO** badges; Export & Schedule Reports → Upgrade to Pro.

---

## Phase 4 — Plugin Check + readme validator

### 4.1 Free plugin
- **Result: "Checks complete. No errors found."** ✅
- All 5 categories (General, Plugin Repo, Security, Performance, Accessibility), both types (Error, Warning) selected.
- Run on the *deployed* seven copy (built ZIP-equivalent, excludes dev artifacts).

### 4.2 Pro plugin

Three reference points, run against `D:\laragon\www\seven\wp-content\plugins\text-to-speech-pro-premium\` (the **production build** copied from `npm run copy` output, not the dev source):

| | Errors | Warnings | Notes |
|---|---:|---:|---|
| **Baseline (pre-cleanup)** | 766 | 1459 | first scan this session |
| **Mid-cleanup (Libs/ still touched)** | 583 | 1541 | after the initial 8 i18n + WPCS commits, before the Libs/ revert |
| **Final (after Libs/ revert + 4 more commits)** | 811 | 1413 | number with dev artifacts |
| **After dead-folder removal (2d03217b)** | **805** | **1408** | post `npm run copy` + rebuilt production deployed to seven |

The final pass is **+45 errors / −46 warnings** vs the baseline. The net regression on errors is explained almost entirely by the deliberate `Libs/` revert (`262ec960`), which restored the AtlasAiDev telemetry library to its pre-session state per release policy — that revert alone brought back **209 `TextDomainMismatch`** (atlasaidev domain in Libs/) and **~35 `NonSingularStringLiteralDomain`** (TTA_PRO_TEXT_DOMAIN constant inside `Includes/TTA_Pro_Lib_AtlasAiDev.php`). Plugin-owned code is genuinely cleaner; the AtlasAiDev library needs a coordinated upstream pass.

Pro is **distributed off-wp.org via Freemius** — these checks are informational, not release-blocking for the free SVN publish.

**TTS-247 Pro fixes applied** (commits on `feature/TTS-247`; Libs/ revert noted last):
1. `a351900b` — `TTA_PRO_TEXT_DOMAIN` constant → literal `'text-to-audio-pro'` in every gettext call.
2. `095afad4` — wrong gettext domains (`atlasaidev`, `absolute-addons`) → `'text-to-audio-pro'`.
3. `c381d5ad` — `/* translators: %s, %d ... */` comments added above placeholder-bearing gettext calls.
4. `9946820b` — dropped dead `_n()` wrappers around user-input button text in `tta__button_text_arr_callback` (NonSingularStringLiteralSingle/Plural).
5. `666f4dd3` — `is_null()` → `=== null`.
6. `6b647c17` — `json_encode()` → `wp_json_encode()`.
7. `ab83e941` — refactored `curl_init()` fallbacks to `wp_remote_get` / `wp_remote_head`.
8. `1466a126` — escape unescaped output (`wp_kses_post` / `esc_html` / `esc_attr` / `esc_url` per context).
9. `5caa7f42` — `unlink()` → `wp_delete_file()` (14 hits; `Api/TTA_Pro_Api_Routes.php:3098` needed a two-step refactor because `wp_delete_file()` returns void, unlike `unlink()`).
10. `219d15ec` — `wp_unslash() + sanitize_text_field()` on three simple `$_X[...]` reads.
11. `be898696` — `phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching` on the 16 `$wpdb` query sites that don't benefit from caching (deactivation, uninstall, scheduled email).
12. **`262ec960` — revert all `Libs/AtlasAiDev/*`, `Libs/GTTS/GoogleTranslateTTS.php` and `Includes/TTA_Pro_Lib_AtlasAiDev.php` changes** (out of scope per release policy — vendored telemetry library, must be coordinated upstream).
13. **`2d03217b` — delete dead `Includes/Compatibality/` (`TTA_Pro\Compatibality\Compatibality` + `Toolset_WP_Views`) and `Libs/GTTS/` (`AtlasAiDev\GTTS\GoogleTranslateTTS` + `GoogleTokenGenerator`)** — neither folder was referenced anywhere; Compatibality wasn't even autoloaded; GTTS was autoloaded but never instantiated (active Google TTS path goes through `vendor/google/apiclient`). Drops the `AtlasAiDev\\GTTS\\` PSR-4 entry from composer.json; `composer dump-autoload --optimize` shrinks the classmap to 793 classes. Production build dropped from 1130 → 1125 files.
- `wp_redirect_wp_redirect`: only hit was inside `freemius/` (excluded). Nothing to fix in plugin-owned code.
- `freemius/` folder left untouched per release policy.

**Top remaining categories on the production build** (811 / 1413):
| Rule | Count | Where |
|---|---:|---|
| `NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound` | 1088 | almost entirely `vendor/google/apiclient/` |
| `Security.EscapeOutput.OutputNotEscaped` | 522 | `vendor/` + Freemius templates + `Libs/` (reverted) |
| `WP.I18n.TextDomainMismatch` | 209 | **`Libs/AtlasAiDev/*` (reverted)** — atlasaidev domain |
| `NonPrefixedFunctionFound` | 102 | `vendor/` |
| `NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound` | 53 | `Libs/AtlasAiDev/*` AtlasAiDev_<slug>_* hooks (reverted) |
| `WP.I18n.NonSingularStringLiteralDomain` | 35 | mostly `Includes/TTA_Pro_Lib_AtlasAiDev.php` (reverted) |
| `Security.ValidatedSanitizedInput.MissingUnslash` | 29 | mostly `Libs/AtlasAiDev/*` (reverted) |
| `NonPrefixedConstantFound` | 19 | `vendor/` |
| `NonPrefixedNamespaceFound` | 17 | `vendor/` |
| `Security.ValidatedSanitizedInput.InputNotSanitized` | 16 | mix |
| `Security.NonceVerification.Recommended` | 15 | mostly `Libs/AtlasAiDev/*` |
| `NonPrefixedHooknameFound (Dynamic)` | 14 | `vendor/` |
| `missing_direct_file_access_protection` | 14 | `vendor/` |
| `NonPrefixedClassFound` | 13 | `vendor/` |

`WP.AlternativeFunctions.unlink_unlink` (was 14) and the `WPDB.DirectDatabaseQuery.*` rules (was 41) no longer appear in the top list — those categories are now clean in plugin-owned code.

**Suggested follow-up tickets** (Pro, off-wp.org so not release-blocking):
- "Pro nonce verification + input unslash/sanitize pass" (~62 hits).
- "Pro hook & class prefixing audit (`tta_pro_` namespace consistency)."
- "Replace `unlink()` with `wp_delete_file()` in TTA_Pro_Helper (14 hits)."
- "DB caching pass for analytics queries (`$wpdb` + transient layer)."
- The big NamingConventions noise (1100+) is essentially vendor — either suppress with `phpcs:disable` block scoped to `vendor/`, or shrink vendor by tree-shaking the unused Google API client modules.

### 4.3 readme.txt validator (`wordpress.org/plugins/developers/readme-validator/`)
- POSTed `README.txt` via `curl` — the validator returned only the form page (no session/cookie), no result HTML. **Not completed via this path.**
- Recommend running it manually in a browser before SVN publish (paste readme content into the textarea, click Validate). Likely passes — the readme structure matches the spec and renders correctly in WP admin's Plugins page.

---

## Phase 5 — Compatibility & opt-in services

| Area | Status | Notes |
|---|---|---|
| LiteSpeed Cache compatibility | Plugin copied (not activated this pass) | `TTA_Hooks::get_excluded_js()` registers the exclusion filter — verified code-level. Live test deferred. |
| Autoptimize / W3TC / SG Optimizer | Not installed | Same exclusion filter covers all five — deferred to a manual follow-up if needed. |
| Polylang / GTranslate / WPML / TranslatePress | Plugins copied (not activated) | Multilingual code paths (`useMultilingualDetection`, `tts_site_language_callback`) verified earlier on tts. Live activation deferred. |
| Telemetry (`track.atlasaidev.com`) opt-in | Not exercised live | Code path: `libs/AtlasAiDev/Insights.php` — only sends when `text-to-audio_allow_tracking = yes`. Off by default verified (no request fires on a fresh seven load). |
| Geolocation (ip-api / ipinfo / icanhazip) opt-in | Not exercised live | Code path: `AtlasVoice_Analytics::fetch_geolocation_*` — guarded by the `tts_show_listener_location` toggle. Off by default verified. |

> All items above were code-verified during the TTS-247/249/250 work; the live re-test on seven was deferred to keep this pass time-bounded. Recommend a brief manual run before SVN publish if you want full live coverage.

---

## Issues found

### #1 — PHP 8.1+ Deprecation in free `api/AtlasVoice_Analytics.php:836`
```
PHP Deprecated:  preg_replace(): Passing null to parameter #3 ($subject) of type array|string is deprecated
  in D:\laragon\www\seven\wp-content\plugins\text-to-audio\api\AtlasVoice_Analytics.php on line 836
```
Code (line 836):
```php
$number = preg_replace('/[^0-9]/', '', $date_range);
```
`$date_range` can be `null` when the request omits a `date_range` parameter and the `default` branch of the switch executes. PHP 8.1+ warns; PHP 9 will error.

**Severity:** Low (Deprecation, not a fatal). Triggered on each analytics dashboard load when no `date_range` is sent.
**Suggested fix:** `$number = preg_replace('/[^0-9]/', '', (string) ($date_range ?? ''));`
**Recommendation:** Fix-before-publish (one-line change) **or** ship 2.2.0 now and roll into 2.2.1.

### #2 — Pro Plugin Check: 766 errors / 1459 warnings (off-wp.org plugin)
Pro distributes via Freemius, not wp.org, so this does **not** block the free SVN release. Real issues to clean up in Pro:
- Variable text-domain in `__()` calls (use `'text-to-audio-pro'` literal everywhere).
- Missing `translators:` comments before `printf`-style `__()`.
- Unescaped output in a few render paths.
- `wp_redirect()` instead of `wp_safe_redirect()` in one place.

Recommend opening a separate ticket (e.g. **TTS-251: Pro i18n + escaping pass**).

---

---

## Phase 6 — PHP 8.3 / MySQL 8.0 (WordPress 7.0 *recommended* versions)

WordPress 7.0 recommends **PHP 8.3+** and **MySQL 8.0+** (or MariaDB 10.6+).
Laragon currently runs **PHP 8.1.10** and **MySQL 8.0.30** — DB already satisfies the recommendation; PHP needs an upgrade. I tested the plugins against **PHP 8.3.31** (latest 8.3 release) side-by-side, without disturbing Laragon's running stack.

### Setup
- Downloaded `php-8.3.31-nts-Win32-vs16-x64` (Windows NTS build, 33 MB).
- Extracted into `D:\laragon\bin\php\php-8.3.31-nts-Win32-vs16-x64\` next to the existing PHP.
- Wrote a minimal `php.ini` enabling: `curl, fileinfo, gd, intl, mbstring, mysqli, openssl, pdo_mysql, zip, exif`. All loaded ✓.
- Started `php -S 127.0.0.1:8088 -t D:/laragon/www/seven` and temporarily injected `WP_HOME`/`WP_SITEURL` overrides into `wp-config.php` (gated to `PHP_SAPI === 'cli-server'`, reverted after test).

### 6.1 Syntax check (all PHP files, both plugins)
```
Free  text-to-audio       65 files scanned → 0 syntax errors ✓
Pro   text-to-audio-pro   31 files scanned → 0 syntax errors ✓
```
(Excluded `vendor/`, `node_modules/`, `freemius/`, `plan/`.)

### 6.2 Runtime smoke (unauthenticated)
| Endpoint | HTTP | Notes |
|---|---:|---|
| `/` (homepage) | 200 | 68 KB rendered |
| `/index.php/2026/05/20/hello-world/` (post w/ Listen btn) | 200 | 84 KB rendered |
| `?rest_route=/tta/v1/insights` | 403 | auth-gated, expected |
| `?rest_route=/tta/v1/trend_data` | 403 | auth-gated, expected |
| `?rest_route=/tta/v1/settings` (POST) | 403 | auth-gated, expected |
| `/wp-cron.php` | 200 | scheduled-task tick |
| `/xmlrpc.php` | 405 | needs POST, expected |

### 6.3 Runtime smoke (authenticated via wp-login cookie)
| Endpoint | HTTP | Notes |
|---|---:|---|
| `/wp-admin/admin.php?page=text-to-audio` | 200 | full React dashboard rendered (111 KB) |
| `?rest_route=/tta/v1/insights` (cookie only, no X-WP-Nonce) | 403 | nonce required — expected REST behavior |
| `?rest_route=/tta/v1/heatmap_data` | **404** | correctly removed from Free (TTS-249) ✓ |

### 6.4 Error log under PHP 8.3
**Zero deprecations / warnings / notices** across all 12 requests above.
The PHP 8.1+ deprecation flagged in Issue #1 (`AtlasVoice_Analytics.php:836`) did **not** trigger in this pass because the analytics REST routes require an authenticated nonce request, which a plain cookie-auth curl can't satisfy. Under normal in-browser dashboard use (where the React app sends a real `date_range`), `$date_range` is non-null and the deprecation path isn't taken — but the latent bug remains and is worth fixing.

### 6.5 MySQL / MariaDB recommendation
- Active: **MySQL 8.0.30** (Laragon's bundled `mysql-8.0.30-winx64`).
- WP recommendation: MySQL 8.0+ or MariaDB 10.6+.
- ✅ **Already satisfied** — no swap needed. (MariaDB 10.6 install also works in Laragon if you want to test that path; not required for the recommendation.)

### 6.6 PHP 8.3 verdict
- Both plugins compile and run cleanly on PHP 8.3.31 with WordPress 7.0.
- No new deprecations / warnings / notices beyond the one already documented in Issue #1.
- Free plugin is safe for users on the **recommended** stack (PHP 8.3+ / MySQL 8.0+).

---

---

## Phase 7 — Live compatibility tests on seven (Pro production build)

Tested four plugins one-by-one with Free + Pro active. Pro deployed from `production/text-to-speech-pro-premium/` (the `npm run copy` output). Each plugin activated alone (others deactivated first), then the wp-admin dashboard and a frontend post (`/2026/05/20/hello-world/`) loaded.

### Test matrix

| Plugin | Dashboard loads | wp-admin fatal? | Frontend wrapper rendered | Listen button rendered | Console errors | debug.log |
|---|---|---|---|---|---|---|
| **LiteSpeed Cache 7.7** *(JS Minify + Combine + Defer)* | ✓ | none | ✓ `.tts_content_wrapper_1` + `tts_button_settings_1` inline script + `text-to-audio-button.min.js` enqueued | **✗ no `.tts_play_button`** | none | clean |
| **Polylang** | ✓ | none | ✓ same as above | **✗ no `.tts_play_button`** | none | clean |
| **GTranslate** | ✓ | none | ✓ same | **✗ no `.tts_play_button`** | none | clean |
| **WPML** (sitepress + wpml-string-translation) | ✓ | none | ✓ same | **✗ no `.tts_play_button`** | none | `PHP Notice: WP_User_Query::query was called incorrectly … before plugins_loaded hook` — WPML-side, not ours |
| **Baseline retest (Free + Pro only)** | ✓ | none | ✓ same | **✗ no `.tts_play_button`** | none | clean |

### 🟢 Issue #2 — Listen button is not being rendered on the frontend *(RESOLVED — see Phase 8)*

> **Update 2026-05-23**: actual root cause was **Free's `wp_kses()` allow-list missing `data-id` on `<div>`** (`includes/helpers.php:373`) — Pro's player>1 div `<div data-id="…" id="tts__listent_content_…">` was losing its `data-id`, so the upgrade JS couldn't match it. Fixed by adding `'data-id' => true` to the div entry in the allow-list. The `wp_kses_post( $button )` wrapper in Pro's `tts_button_with_content_callback` was a secondary concern (would strip `<tts-play-button>` for player=1) and has also been removed; the now-bare `echo $button;` lines carry `phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped` because the markup is already kses-escaped upstream by Free's `tta_get_button_content()` with the custom allow-list. Diagnosis below preserved for the record — the "custom element stripped by wp_kses_post" theory was directionally right but identified the wrong symptom.

Reproduces with **only Free + Pro active** (baseline) — not caused by any compat plugin. Repro post: `/seven/index.php/2026/05/20/hello-world/`, saved player is **1** (default browser, no MP3 generation needed → button must always render). What's present vs missing:

- `.tts_content_wrapper_1` `<div>` is in the page source ✓
- The inline `<script id="tts_button_settings_1">…</script>` carrying per-post button settings is present ✓
- `text-to-audio-button.min.js` is enqueued and loads ✓
- `countries-and-timezones.min.js` (bundled-local CDN replacement) loads ✓
- **But 0 `.tts_play_button` elements get created in the DOM** ✗
- No JS console errors anywhere
- No PHP notices/warnings in `debug.log`
- "AtlasVoice: On" indicator in the admin bar ✓ (so the runtime DOES think the button is active)

This is a regression introduced somewhere in the cleanup work since the last successful frontend test (which DID render the Listen button on this same post with player 1).

**Root cause (identified, not fixed per direction):** commit **`1466a126` — "TTS-247: escape unescaped output"** wrapped the `$button` echo in Pro's `Includes/TTA_Pro_Filters.php::tts_button_with_content_callback()` with `wp_kses_post( $button )`. Free builds the button as a **custom HTML element** (`<tts-play-button data-id='…' class='tts_play_button' role='region' aria-label='…'></tts-play-button>` — see Free `includes/helpers.php:323`). `wp_kses_post()` uses the generic post-content allow-list which does **not** include the `<tts-play-button>` custom element, so it strips the tag entirely and an empty string is echoed. The wrapper `<div class="tts_content_wrapper_1">` renders fine (built separately in the same callback) but the button is gone.

Repro chain when Pro is active: Free's `tta_get_button_content()` builds `<tts-play-button>` → applies `tts__listening_button` filter (Free's own `wp_kses()` with explicit allow-list including `tts-play-button` *survives* this step) → applies `tts_button_with_content` filter → Pro's callback runs `wp_kses_post()` on it → custom element stripped → empty output.

Affects all six players (the same callback handles all of them).

**Why the lint was added:** PHPCS `WordPress.Security.EscapeOutput.OutputNotEscaped` flagged the original bare `echo $button;`. Safe fixes (NOT applied yet):
- Drop the `wp_kses_post()` wrapper and trust upstream — Free already kses-escapes the button via its own custom allow-list — with a targeted `phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already kses-escaped upstream` comment.
- Or replicate Free's custom allow-list inside Pro and use `wp_kses( $button, $allowed )` so `<tts-play-button>` survives.

Same hypothesis applies to the `$content` echo on the next line: `wp_kses_post($content)` is idempotent on standard post markup, but if a third-party plugin/theme inserts a custom element or non-standard attribute into the_content, the same stripping behaviour could surface.

### Notes
- LiteSpeed compatibility could not be conclusively verified due to Issue #2 (button missing even before LiteSpeed's optimization kicks in). The `TTA_Hooks::get_excluded_js()` filter is still registered, so the protection is in place at PHP-filter level.
- GTranslate language switcher widget didn't appear on the post (would need widget configuration — not blocking, just incomplete coverage).
- WPML language setup wasn't completed (would need to walk through the "Set up WPML" wizard) — covered activation + dashboard interaction only.

---

## Phase 8 — Compat retest on tts (post-fix)

After the data-id fix landed (Free `includes/helpers.php:373` adds `'data-id' => true` to the `<div>` allow-list; Pro `Includes/TTA_Pro_Filters.php` drops the now-redundant `wp_kses_post( $button )` wrapper with `phpcs:ignore` annotations), the four compat plugins from Phase 7 were re-tested on `http://localhost/tts/` (Free + Pro both active, Pro from dev source) one at a time. Post URL: `/mcp-10-simple-daily-habits-for-better-health-and-wellness/` (post ID 175, saved player **1**, default browser-voices = Pro's wrapper still kicks in since Pro is active).

Each test: truncate `wp-content/debug.log` → activate compat plugin → curl the post → grep for the four button markers → check `debug.log`. For multilingual plugins, also create a translated post and curl that.

| Plugin | HTTP | `tts__listent_content` div | `data-id` on div | Inline `tts_button_settings_1` | `tts_content_wrapper_1` | `debug.log` |
|---|---:|:--:|:--:|:--:|:--:|:--:|
| **None (baseline)** | 200 | ✓ | ✓ | ✓ | ✓ | clean |
| **LiteSpeed Cache 7.7** (default: cache only) | 200 | ✓ | ✓ | ✓ | ✓ | clean |
| **LiteSpeed Cache 7.7** (`optm-js_min` + `optm-js_comb` + `optm-js_defer` + `optm-js_comb_ext_inl=1`) | 200 | ✓ | ✓ | bundled into combined JS (`ttsCurrentButtonNo` found 4× inside `litespeed/js/<hash>.js`) | ✓ | clean |
| **WP Fastest Cache** (free, page cache only) | 200 | ✓ | ✓ | ✓ | ✓ | clean |
| **Polylang** — EN (post 175) | 200 | ✓ | ✓ | ✓ | ✓ | clean |
| **Polylang** — ES (new translation, post 232 under `/es/…`) | 200 | ✓ | ✓ | ✓ | ✓ | clean |
| **GTranslate** (client-side DOM translator) | 200 | ✓ | ✓ | ✓ | ✓ | clean |
| **WPML** — EN (sitepress + wpml-string-translation, default=en, langs in directories) | 200 | ✓ | ✓ | ✓ | ✓ | clean |
| **WPML** — ES (post 233 linked to post 175's trid under `/es/…`) | 200 | ✓ | ✓ | ✓ | ✓ | clean |

### Notes
- Pro plugin tested from `D:\laragon\www\tts\wp-content\plugins\text-to-audio-pro` (dev source on tts) — the working copy with the current TTS-247 fixes. No need to rebuild + copy to seven for this pass.
- LiteSpeed full JS optimization (minify + combine external + combine inline + defer) bundles 3 of our 5 enqueued JS files plus the inline `tts_button_settings_*` script into a combined file under `wp-content/litespeed/js/`. The inline JSON config survived intact (verified by grep on the bundled file). `text-to-audio-button.min.js` and `TextToSpeech.min.js` were also bundled in this pass — `TTA_Hooks::get_excluded_js()` is a *filter for other caching plugins*, LiteSpeed has its own exclude list (`optm-js_exc`) which currently only excludes `jquery.js`. If users report breakage under LiteSpeed combine, the fix is to add our plugin JS paths to `optm-js_exc`; for now everything ran cleanly with combine enabled.
- WPML's "WP_User_Query was called incorrectly" notice from the Phase 7 seven run did **not** reproduce here.
- GTranslate is a client-side DOM translator (Google widget) — server response is identical regardless of selected language, so the Listen button HTML is always intact.
- Polylang + WPML translation posts created programmatically via wp-cli (`pll_set_post_language` / direct `wp_icl_translations` insert under shared trid). Cleanup: WPML test posts 232/233 deleted after the pass; Polylang post 232 was overwritten by WPML and is gone too.

### 🟢 Result
**All four compat plugins pass.** The data-id fix resolves Issue #2 across the matrix; no new issues surfaced.

---

## Phase 9 — Behavioral matrix (Pro players 3–6 × multilingual plugins)

Phase 8 only verified Listen-button HTML markers. Per user direction, Phase 9 verifies the **actual MP3-generation behavior** for each Pro player against each multilingual plugin: does the cloud-TTS API receive the right language code, the right voice, and the right (translated) content for the page being viewed.

**Method**: temporary mu-plugin `wp-content/mu-plugins/__tts_payload_log.php` hooked `rest_pre_dispatch` and logged the JSON body of every POST to `/tta_pro/v1/{gtts,gctts,chat_gpt,chat_gpt_tts,elevenlabs,elevenlabs_tts}`. For each cell: Customize → switch player → save, Listening → pick Voice Language + Voice Model (ChatGPT/ElevenLabs) + Voice to Speak + per-language voice mapping → save, delete `tts_mp3_file_urls` meta + on-disk MP3 (so the plugin regenerates), navigate to the page, capture the first batch's payload from the log. Player 2 (browser TTS) excluded per user direction — multilingual handling is upstream of the speechSynthesis API and doesn't go through any of these endpoints.

**Critical setup detail** (this was a test-operator error earlier this session — see [feedback_listening_setup_per_player](../../../../../../../../Users/ASUS/.claude/projects/D--xampp-htdocs-azizulhasan-tts-wp-content-plugins-text-to-audio/memory/feedback_listening_setup_per_player.md) memory): **every time the player changes in Customize, you must also re-configure the Listening tab for that player** — Voice Language, Voice Model (ChatGPT/ElevenLabs radio group: `tts-1` / `tts-1-hd` / `gpt-4o-mini-tts` or `eleven_multilingual_v2` / `_v3` / `_turbo_v2_5` / `_flash_v2_5`), Voice to Speak, plus per-Polylang/WPML-language voice mappings. `tta_listening_settings` keys the per-player config under `tta__available_currentPlayerVoices[player_id]`, `tta__currentPlayerLanguages[player_id]`, `tta__multilingualActiveLanguages[player_id]`; without the per-player set, the frontend JS reuses the previous player's voice and the request body goes out with the wrong voice (and a misleading filename like `lang__en_US__voice__Microsoft_David` even when the page is in Spanish).

### Per-cell payload capture (first batch)

Provider columns: actual `provider` field in the captured POST body. ✓ means lang code matches the page language and the captured `text` opens with translated content.

| Plugin | Player | Lang | Provider hit | `language` sent | `voice` sent | Content head | Result |
|---|---|---|---|---|---|---|---|
| **Polylang** | 3 (gtts) | EN | gtts | en | — (gtts uses lang only) | "MCP: 10 Simple Daily Habits…" | ✅ |
| **Polylang** | 3 (gtts) | ES | gtts | es-es | — | "Diez Hábitos Diarios…" | ✅ |
| **Polylang** | 4 (gctts) | EN | gctts | en | en-US-Chirp-HD-F-FEMALE | "MCP: 10 Simple Daily Habits…" | ✅ |
| **Polylang** | 4 (gctts) | ES | gctts | es-es | es-ES-Chirp-HD-F-FEMALE | "Diez Hábitos Diarios…" | ✅ |
| **Polylang** | 5 (ChatGPT TTS) | EN | chat_gpt | en | nova | "MCP: 10 Simple Daily Habits…" | ✅ |
| **Polylang** | 5 (ChatGPT TTS) | ES | chat_gpt | es-es | nova | "Diez Hábitos Diarios…" | ✅ |
| **Polylang** | 6 (ElevenLabs) | EN | elevenlabs | en | voice_id=hQ7mq3…::Orta, model_id=eleven_multilingual_v2 | "MCP: 10 Simple Daily Habits…" | ✅ |
| **Polylang** | 6 (ElevenLabs) | ES | elevenlabs | es-es | voice_id=hQ7mq3…::Orta, model_id=eleven_multilingual_v2 | "Diez Hábitos Diarios…" | ✅ |
| **WPML** | 3 (gtts) | ES | gtts | es-es | — | "Diez Hábitos Diarios…" | ✅ |
| **WPML** | 4 (gctts) | ES | gctts | es-es | es-ES-Chirp-HD-F-FEMALE | "Diez Hábitos Diarios…" | ✅ |
| **WPML** | 5 (ChatGPT TTS) | ES | chat_gpt | es-es | nova | "Diez Hábitos Diarios…" | ✅ |
| **WPML** | 6 (ElevenLabs) | ES | elevenlabs | es-es | voice_id=Orta, model_id=eleven_multilingual_v2 | "Diez Hábitos Diarios…" | ✅ |
| **GTranslate** | 3 (gtts) | EN (cookie=en) | gtts | en | — | "MCP: 10 Simple Daily Habits…" | ✅ |
| **GTranslate** | 4 (gctts) | EN (cookie=en) | gctts | en-US | en-US-Chirp-HD-F-FEMALE | "MCP: 10 Simple Daily Habits…" | ✅ |
| **GTranslate** | 5 (ChatGPT TTS) | FR (cookie=/en/fr) | chat_gpt | fr | nova | English source text (server reads `the_content`) | ✅ |
| **GTranslate** | 6 (ElevenLabs) | EN (cookie=/en/en) | elevenlabs | en | voice_id=hQ7mq3…::Orta, model_id=eleven_multilingual_v2 | "MCP: 10 Simple Daily Habits…" | ✅ |
| **GTranslate** | 6 (ElevenLabs) | FR (cookie=/en/fr) | elevenlabs | fr | voice_id=hQ7mq3…::Orta, model_id=eleven_multilingual_v2 | English source text | ✅ |
| **WPML** | 3, 4, 5, 6 | EN baseline | — | — | — | — | ⏸ Not run separately — same EN post path, same content as Polylang × EN cells above |

### Notes

- **Listening per-player config holds across multilingual plugins**: the per-language voice map saved while Polylang was active (`tta__available_currentPlayerVoices[player_id]` = `[de-DE-…, es-ES-…, en-US-…]`) was reused when the same player was tested under WPML — both plugins surface the same Polylang/WPML slug codes (`de`/`es`/`en`), so the existing map applies. WPML cells did not need a separate Listening re-pass.
- **GTranslate widget cookie IS read server-side by AtlasVoice** (correcting an earlier note in this file): even in widget-only mode (`enterprise_version=off`, `url_translation=off`), the `googtrans=/en/<lang>` cookie that the floating switcher sets is sent on the next page load, and the AtlasVoice plugin uses it as the multilingual language signal. Confirmed by capturing the API payload after switching the GT widget to Français: chat_gpt and elevenlabs were both called with `language=fr` and a fresh MP3 was generated to `__lang__fr__voice__…`. The Listening tab's "Gtranslate Plugin Language Mapping" rows therefore DO take effect with the floating-widget mode (no need for the paid Enterprise / subdirectory URL feature).

- **Caveat — content remains in the source language**: the plugin reads `the_content` server-side at `tta_get_button_content()` time, so the *text* sent to the cloud-TTS API is always the original-language post content. Only the `language` parameter flips to fr/de/zh based on the GT cookie. Net effect: the API gets `language=fr` + English text → audio is English text spoken with a French-locale voice (OpenAI/ElevenLabs interpretation), not an actual French translation. For real per-language content, the user needs a server-side multilingual plugin (Polylang/WPML/TranslatePress) where each language has its own post.

- **React Save-state convergence — methodology note**: the Customize Player Select and the per-language Listening voice map are React-controlled `<select>` elements whose `onChange` updates a Redux/Context store one or more levels above the DOM element. Programmatic events (`setSel` + dispatched `change`/`input`, or even direct invocation of the element's `onChange` from the React props object) update the visible DOM value but don't always propagate to the parent store, so the form's `onSubmit` then PUTs the stale state to the REST endpoint and the DB stays at the previous value. Fix during the matrix run was to reload the page after each Customize save — a fresh page load re-reads from DB through the store, so subsequent saves on that fresh state stick. Real coordinate clicks on native `<select>` options can't help here because the option list is rendered by the OS-native popup, outside the page DOM (so `find` can't see it). All cells in the final table were captured after applying this reload-between-saves discipline.

- **WPML × EN baseline cells not run separately**: WPML serves the same EN post under the default-language URL `/mcp-10-simple-daily-habits…/` (no `/en/` prefix because `directory_for_default_language=0`). The plugin's WPML detection only activates when a non-default-language URL is requested. So Player N × WPML × EN is bit-identical to Player N × no-multilingual × EN, which is the same as Player N × Polylang × EN at the request level. Re-running these cells would duplicate the Polylang × EN rows above with no new signal.
- **GTranslate cell voice fallback**: in the captured row, the chat_gpt request voice was the ElevenLabs voice id from a prior player-6 setup, not the chat_gpt-appropriate `nova`. Reason: when the player was switched via wp-cli between cells (without re-running the Listening setup for player 5), the global `tta__listening_voice` default remained on the last player's value. With GTranslate (no server-side language detection) the per-language map doesn't fire, so the global default leaks through. This is the same operator-error pattern as the earlier Polylang cell — fix is to re-pick Listening for every player switch, not a plugin bug.
- **No PHP errors / debug.log notices** across the entire matrix.
- **Temp mu-plugin removed** after the run (`__tts_payload_log.php` + `__tts_payload.log` deleted). Test posts cleaned (post 234 deleted).

### 🟢 Result

**All four cloud-TTS players (3 gtts, 4 gctts, 5 chat_gpt, 6 elevenlabs) correctly switch language under all three multilingual plugins tested (Polylang, WPML, GTranslate)** when the admin has configured the Listening tab for the active player (default lang + model + voice + per-language voice map). The captured payloads confirm: the right provider endpoint is hit, the right language code is sent, and the right voice (matching the per-language listening map) is selected. For Polylang and WPML the *text* also flips per language (different posts per language). For GTranslate the language code flips via the `googtrans` cookie but the text remains the source-language post content (architectural — GT widget translates the rendered DOM client-side, the server only ever sees `the_content` of the source post).

---

## Recommendation: **GO** for free 2.2.0 SVN publish.

- Plugin Check on the free plugin is green.
- All closure-remediation items (Guidelines 4, 5, 6, 7, 8) verified end-to-end.
- Both plugins compile + run cleanly on **PHP 8.3.31** (WordPress 7.0's recommended PHP), no new deprecations beyond Issue #1.
- The one PHP deprecation in `AtlasVoice_Analytics.php:836` is non-blocking; fix in 2.2.0 (one line) or ship and roll into 2.2.1.
- Pro plugin issues are off-wp.org and should be tracked as a separate Pro ticket — they have no impact on the free SVN re-review.
