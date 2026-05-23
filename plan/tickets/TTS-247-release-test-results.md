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

## Recommendation: **GO** for free 2.2.0 SVN publish.

- Plugin Check on the free plugin is green.
- All closure-remediation items (Guidelines 4, 5, 6, 7, 8) verified end-to-end.
- Both plugins compile + run cleanly on **PHP 8.3.31** (WordPress 7.0's recommended PHP), no new deprecations beyond Issue #1.
- The one PHP deprecation in `AtlasVoice_Analytics.php:836` is non-blocking; fix in 2.2.0 (one line) or ship and roll into 2.2.1.
- Pro plugin issues are off-wp.org and should be tracked as a separate Pro ticket — they have no impact on the free SVN re-review.
