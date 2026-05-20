# TTS-247 — WordPress.org Plugin Closure Remediation Plan

**Jira:** [TTS-247](https://atlasaidev.atlassian.net/browse/TTS-247)
**Branch:** `feature/TTS-247` (off `develop`)
**HelpScout thread:** #293 — *Closure Notice - Guideline Violation: Text To Speech TTS Accessibility*
**Review ID:** `GUIDELINES ❗LIC-SRC-OTH text-to-audio/hasanazizul/15Nov24/T2 19May26/4.0.1B2 (P0TDXtext-to-audioHGN)`
**Closed on:** 2026-05-19
**Deadline:** 2026-07-18 (60 days from closure) — after this date, the public closure reason becomes "Guideline Violation"

**Test cases:** see [`TTS-247-test-cases.md`](TTS-247-test-cases.md) — populated as each fix lands, includes Pro-impact audit per fix.

---

## 1. Context

The WordPress.org Plugins Team closed `text-to-audio` for violating Guideline 5 (Trialware) — the free plugin ships locked Pro-only features. The closure email also enumerates 18+ secondary issues (code quality, security, i18n, undocumented external services, etc.) that must be fixed before re-review.

The closure is temporary. To reopen we must:

1. Fix every blocker.
2. Test on a clean WP install with `WP_DEBUG = true`.
3. Run **Plugin Check + PHPCS/WPCS** clean.
4. Bump `Version:` header and readme `Stable tag:`.
5. Commit to SVN `trunk/` + create new `tags/<version>`.
6. Reply to HelpScout #293 confirming the update is in SVN.

WordPress reviews the **entire plugin**, not just the diff, so we must do a thorough self-audit.

> Reviewer's own caveat (verbatim):
> *"Note that there may be false positives — we are humans and make mistakes, we apologize if there is anything we have gotten wrong. If you have doubts you can ask us for clarification, when asking us please be clear, concise, direct and include an example."*
>
> Strategy: for any flag that we can fix safely and quickly, **fix it** rather than argue — every back-and-forth wastes review cycles. Only push back when the fix would meaningfully regress the product. See §7 for the items we considered pushing back on.

---

## 1a. Cross-check against source (2026-05-20)

Verified the AI-flagged examples against the actual source. All claims so far are **real** (not false positives):

| Email claim | Verified in code | Notes |
|---|---|---|
| `define('ABSPATH', ...)` at `text-to-audio.php:32` | ✅ Confirmed lines 30–33 | Wrapped in `if (!defined('ABSPATH'))`. In real WP load this is dead code (WP defines ABSPATH first), but reviewer is right to flag — just delete. |
| `__('Hey %1$s')` at `text-to-audio.php:139` | ✅ Confirmed inside a `sprintf` Freemius connect-message filter | Missing text-domain + missing translator comment. |
| `__($default, $text_domain)` at `TTA_Helper.php:1376` | ✅ Confirmed in `get_text_value()` helper | Both the string and domain are variables — translators can't read them. |
| Deactivation hook force-deactivates `text-to-audio-pro` | ✅ Real, but the actual location is `includes/TTA_Deactivator.php:37`, **not** `text-to-audio.php` | Worse than flagged — also calls `header('Location: ...'); die();` to force redirect. |
| Trialware: locked Pro features in free | ⏳ To verify file-by-file (see §3.1) | |

**Discrepancies / clarifications worth noting in our reply to wp.org:**
- The deactivation hook lives in `includes/TTA_Deactivator.php` (not the main file). Same severity, just a different location.
- The ABSPATH redefine is gated by `!defined('ABSPATH')` — defensive-but-pointless. Removing it.

---

## 2. Status Legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🟨 | In progress |
| ✅ | Done |
| 🔁 | Needs re-test |
| ⛔ | Blocked |
| ❌ | Won't fix (justified) |

---

## 3. Master Fix Table

### 3.1 Primary blocker — Guideline 5 / 6

| # | Area | File(s) / Symptom | Action | Priority | Status |
|---|---|---|---|---|---|
| P1 | Trialware: player lock | `get_player_id()` forces player 1 when no Pro | Always return the user-selected player ID in the free plugin; gate the *premium voice provider* via Pro, not the player UI | P0 | ⬜ |
| P2 | Trialware: demo player assets | `admin/demos/player2/`, `admin/demos/player3/` shipped in free | Remove the Pro demo bundles from the free build (`gulpfile.js` `productionSrc`) | P0 | ⬜ |
| P3 | Trialware: analytics routes | REST routes / handlers that early-return "requires Pro" | Either (a) remove the routes entirely from the free plugin, or (b) make them fully functional in free | P0 | ⬜ |
| P4 | Trialware: analytics export/reports | Export & report handlers locked behind Pro | Same as P3 — remove or unlock | P0 | ⬜ |
| P5 | Servicware doc | Any remaining license-gated calls | Audit `is_pro_active()` call sites — none may gate local-only features | P0 | ⬜ |

### 3.2 Source availability

| # | Area | File(s) | Action | Priority | Status |
|---|---|---|---|---|---|
| S1 | Compiled JS — no source link | `admin/js/build/chunks/tab-settings.chunk.js` | Add public GitHub repo link in `readme.txt` | P1 | ⬜ |
| S2 | Compiled JS — no source link | `admin/js/build/chunks/tab-customize.chunk.js` | covered by S1 readme link | P1 | ⬜ |
| S3 | Compiled JS — no source link | `admin/js/build/chunks/tab-aliases.chunk.js` | covered by S1 readme link | P1 | ⬜ |
| S4 | Compiled JS — no source link | `admin/js/build/chunks/tab-analytics.chunk.js` | covered by S1 readme link | P1 | ⬜ |
| S5 | Compiled JS — no source link | `admin/js/build/text-to-audio-button.min.js` | covered by S1 readme link | P1 | ⬜ |
| S6 | Compiled JS — no source link | `admin/js/build/AtlasVoicePlayerInsights.min.js` | covered by S1 readme link | P1 | ⬜ |
| S7 | Compiled JS — no source link | `build/blocks.js` | covered by S1 readme link | P1 | ⬜ |
| S8 | Compiled JS — no source link | `admin/js/build/tts-bulk-mp3-file-ui.min.js` | covered by S1 readme link | P1 | ⬜ |
| S9 | Readme build instructions | `readme.txt` | Add a "Building from source" section: clone repo → `npm install` → `npm run production` / `npm run block:build` | P1 | ⬜ |
| S10 | Confirm public repo | GitHub | Verify the repo exists, is public, and contains `src/` + `webpack.mix.js` matching the published build | P1 | ⬜ |
| S11 | Enumerate the remaining 11 unlisted bundles | Email says **"out of a total of 19 incidences"** | Grep `admin/js/build/**/*.min.js` and `admin/js/build/chunks/*.chunk.js` against `src/` and add the missing source-paths or a single repo link covering them all | P1 | ⬜ |

### 3.3 Plugin lifecycle / activation hooks

| # | Area | File(s) | Action | Priority | Status |
|---|---|---|---|---|---|
| L1 | Force-deactivating Pro + forced redirect | `includes/TTA_Deactivator.php:32-42` (`deactivate()` method) | Remove the `deactivate_plugins(['text-to-audio-pro/...'])` call **and** the `header('Location: ...'); die();` redirect. Use the **Plugin Dependencies API** (WP 6.5+) — add `Requires Plugins: text-to-audio` header in the Pro plugin instead, so Pro auto-deactivates when free is deactivated, not the other way around | P0 | ⬜ |

### 3.4 Remote calls / phoning home (no opt-in)

| # | Area | File(s) — Line | URL | Action | Status |
|---|---|---|---|---|---|
| R1 | Chart.js CDN | `admin/TTA_Admin.php:387` | `cdn.jsdelivr.net/npm/chart.js` | Bundle locally under `admin/js/vendor/chart.umd.js` and `wp_enqueue_script` from plugin URL | ⬜ |
| R2 | Countries-and-timezones CDN | `admin/TTA_Admin.php:476` | `cdn.jsdelivr.net/npm/countries-and-timezones/...` | Bundle locally | ⬜ |
| R3 | Atlas plugins.json | `admin/TTA_Admin.php:565` `ATLAS_PLUGINS_REMOTE_URL` | `raw.githubusercontent.com/atlasaidev/plugins/main/plugins.json` | Move behind opt-in (Pro promo banner); only fetch when user explicitly opens promo screen, with a Privacy disclosure | ⬜ |
| R4 | Translations from GitHub raw | `includes/TTA_Translation_Downloader.php:19` | `raw.githubusercontent.com/.../atlasvoice` | Either ship translations in plugin `languages/` (preferred — wp.org translates anyway) or document the service in readme with Terms/Privacy | ⬜ |
| R5 | Translations GitHub API | `includes/TTA_Translation_Downloader.php:24, 113` | `api.github.com/repos/.../contents/atlasvoice` | Same as R4 | ⬜ |
| R6 | Promotion source (Gist) | `includes/TTA_Lib_AtlasAiDev.php:65` | `gist.githubusercontent.com/.../text-to-speech-pro.json` | Behind opt-in or remove | ⬜ |
| R7 | Demo audio (OpenAI CDN) | `admin/demos/player3/js/build/plyr-demo.min.js`; `admin/js/build/tts-welcome-wizard.min.js`; `admin/js/build/chunks/tab-listening.chunk.js` | `cdn.openai.com/API/docs/audio/alloy.wav` | Self-host a short royalty-free MP3 in `admin/assets/audio/` and reference locally | ⬜ |
| R8 | Geolocation — ip-api.com | `api/AtlasVoice_Analytics.php:582` | `ip-api.com/json/` | Either disclose as a service in readme **and** make opt-in, or remove and rely on server-side `REMOTE_ADDR` only | ⬜ |
| R9 | Public IP — icanhazip | `api/AtlasVoice_Analytics.php:537` | `icanhazip.com/` | Remove; use `$_SERVER['REMOTE_ADDR']` server-side | ⬜ |
| R10 | Geolocation fallback — ipinfo | `api/AtlasVoice_Analytics.php:614` | `ipinfo.io/` | Same as R8 | ⬜ |
| R11 | Telemetry endpoint | `libs/AtlasAiDev/Client.php:37, 301` | `track.atlasaidev.com` | Already opt-in — just **document** in readme `== External services ==` with Terms/Privacy links | ⬜ |

### 3.5 Readme: External-services section

| # | Area | Action | Status |
|---|---|---|---|
| D1 | Add `== External services ==` block to `readme.txt` covering every remaining remote endpoint after R1–R11, with: what it is, what data is sent, when, ToS link, Privacy link | ⬜ |
| D2 | Publish/update Terms & Privacy pages on `atlasaidev.com` for `track.atlasaidev.com` and reference in D1 | ⬜ |

### 3.6 Code quality / WP guidelines

| # | Area | File(s) — Line | Action | Status |
|---|---|---|---|---|
| C1 | composer.json missing in SVN | Plugin root | Add `composer.json` (already exists in repo) to the production ZIP — update `gulpfile.js productionSrc` | ⬜ |
| C2 | Out-of-date Plyr | `admin/demos/player3/js/build/plyr-demo.lib.min.js` (3.6.8) | Update Plyr to latest stable | ⬜ |
| C3 | Un-prefixed Freemius | `freemius/start.php` | Run `composer mozart`/`strauss`/`php-scoper` on the Freemius SDK to namespace it under `TTA\Vendor\Freemius` | ⬜ |
| C4 | Plain `include ABSPATH/...` | `admin/TTA_Admin.php:76` | Replace with `require_once ABSPATH . 'wp-admin/includes/plugin.php';` and use a function from it immediately after | ⬜ |
| C5 | Plain `include ABSPATH/...` | `admin/TTA_Admin.php:218` | Same | ⬜ |
| C6 | Plain `include ABSPATH/...` | `libs/AtlasAiDev/Insights.php:629` | Same | ⬜ |
| C7 | Hardcoded plugin URL | `admin/TTA_Admin.php:109, 110, 306` | `WP_PLUGIN_URL . '/text-to-audio'` → `plugins_url('', TEXT_TO_AUDIO_ROOT_FILE)` (or use `TTA_PLUGIN_URL` constant consistently) | ⬜ |
| C8 | Hardcoded themes path | `libs/AtlasAiDev/Client.php:226, 236` | `WP_CONTENT_DIR . '/themes/'` → `get_theme_root()` | ⬜ |
| C9 | Writing to wp-content | `includes/helpers.php:1007` (`debug.log`) | Move log writes into `wp_upload_dir()['basedir'] . '/text-to-audio/'` | ⬜ |
| C10 | REST permission_callback audit | `api/TTA_Api_Routes.php` (18 routes) | Document the auth model on `get_route_access` (nonce + cap) and confirm each route uses the right capability | ⬜ |
| C11 | Output escaping — shortcode `tta_listen_btn` | `text-to-audio.php:643` → `tta_get_button_content()` | Either escape the filtered HTML inside `tta_get_button_content()`, or rebuild output via `wp_kses_post()` / allow-listed tags | ⬜ |
| C12 | Output escaping — shortcode `atlasvoice` | `text-to-audio.php:644` | Same as C11 | ⬜ |
| C13 | Output escaping — block `render_callback` | `admin/TTA_Admin.php:422` | Same | ⬜ |
| C14 | Output escaping — `the_content` filter | `includes/helpers.php:615` (`add_listen_button`) | Same | ⬜ |
| C15 | Unclosed `ob_start()` | `includes/helpers.php:403` | Ensure paired `ob_get_clean()` before every `return`/early exit in the function | ⬜ |
| C16 | Unclosed `ob_start()` | `admin/TTA_Admin.php:359` | Same | ⬜ |
| C17 | Redefining `ABSPATH` | `text-to-audio.php:30-33` (block) | Remove the whole `if (!defined('ABSPATH')) { define('ABSPATH', dirname(__FILE__) . '/'); }` block — WP defines ABSPATH before plugins load, so this is dead code | ✅ |
| C18 | Text domain mismatch (`atlasaidev`) | 49 strings across codebase | Replace `'atlasaidev'` → `'text-to-audio'` in all gettext calls | ⬜ |
| C19 | Text domain mismatch (`text-to-speech-pro`) | 1 string | Replace → `'text-to-audio'` | ⬜ |
| C20 | Variable as string AND domain in `__()` | `includes/TTA_Helper.php:1369-1378` (`get_text_value(..., $default, $text_domain)` → `__($default, $text_domain);`) | Dropped `$text_domain` param and removed the inner `__()` call; callers now pass already-translated literals (`__( 'Listen', 'text-to-audio' )` etc.). All 4 call sites in `includes/helpers.php:530-543` updated. | ✅ |
| C21 | Missing text-domain + missing translator comment | `text-to-audio.php:138-146` (Freemius `connect_message_on_update` filter) | Both `__()` calls now use `'text-to-audio'`; added `/* translators: ... */` comment. Kept plain `__()` (not `esc_html__`) because `$plugin_title` and `$freemius_link` are pre-rendered HTML by Freemius. | ✅ |
| C22 | High admin menu position | `admin/TTA_Admin.php:493` (`add_menu_page(..., 20)`) | Change position to `null` (default) or a high integer like `99` — competing with core slot 20 (Pages) | ⬜ |

### 3.7 Build / Release

| # | Area | Action | Status |
|---|---|---|---|
| B1 | Add `composer.json` to release ZIP | Update `gulpfile.js productionSrc` to include `composer.json` | ⬜ |
| B2 | Add `Building from source` section to `readme.txt` with link to GitHub repo + steps | ⬜ |
| B3 | Add `== External services ==` section to `readme.txt` (per D1) | ⬜ |
| B4 | Bump `Version:` in `text-to-audio.php` header | ⬜ |
| B5 | Bump `Stable tag:` in `readme.txt` | ⬜ |
| B6 | `composer install --no-dev` + `npm run production` + `npm run block:build` + `npm run translate` | ⬜ |
| B7 | Generate release ZIP via `npm run makeZip` | ⬜ |

### 3.8 Verification

| # | Action | Status |
|---|---|---|
| V1 | Spin up a clean WordPress install, set `WP_DEBUG = true`, `WP_DEBUG_LOG = true` | ⬜ |
| V2 | Install built plugin from ZIP; ensure no PHP notices/warnings on activation | ⬜ |
| V3 | Run **Plugin Check** plugin against ours — no critical issues | ⬜ |
| V4 | Run **PHPCS** with `WordPress` + `WordPress-VIP-Go` rulesets — no errors | ⬜ |
| V5 | Smoke test: post page renders the listen button, audio plays | ⬜ |
| V6 | Smoke test: admin dashboard loads, no remote requests to GitHub/jsDelivr/openai/ip-api on first load | ⬜ |
| V7 | Smoke test: free → Pro detection still works; deactivating free no longer touches Pro | ⬜ |
| V8 | Smoke test: shortcode and block both render escaped output (inspect DOM for unintended HTML) | ⬜ |
| V9 | All translations still load (test locale `es_ES`) | ⬜ |

### 3.9 Release / Re-review

| # | Action | Status |
|---|---|---|
| F1 | Merge `feature/TTS-247` into `develop` via git flow finish + tested | ⬜ |
| F2 | `git flow release start <version>` → finish | ⬜ |
| F3 | SVN: `svn co https://plugins.svn.wordpress.org/text-to-audio` → copy build to `trunk/` | ⬜ |
| F4 | SVN: `svn cp trunk tags/<version>` | ⬜ |
| F5 | SVN commit | ⬜ |
| F6 | Reply to HelpScout #293 — concise confirmation that the new version is in SVN and the issues are addressed | ⬜ |
| F7 | Wait for re-review; capture team feedback for follow-up | ⬜ |

---

## 4. False-positive analysis

Per the reviewer's invitation to flag mistakes, we considered each AI-marked (`✨`) claim. **None warrant pushing back — fixing is faster than arguing.** Documented here so we don't forget the nuance:

| # | Claim | Real or false positive? | Decision |
|---|---|---|---|
| FP1 | `define('ABSPATH', …)` "can break later ABSPATH-based core loads" (C17) | **Real flag, but harmless in practice** — wrapped in `if (!defined('ABSPATH'))`, and WordPress always defines ABSPATH before plugins load, so the body never executes | Fix anyway: remove. Easier than explaining. |
| FP2 | "Phoning home" — Chart.js + GitHub plugins.json (R1, R3) | **Real** — these load on every admin page load, no opt-in | Fix: bundle Chart.js locally; gate plugins.json behind an explicit "Check for AtlasAiDev plugins" user action |
| FP3 | Hardcoded `WP_PLUGIN_URL . '/text-to-audio'` (C7) "is not portable across renamed or symlinked installs" | **Technically real, practically rare** — WP.org installs always use the canonical slug | Fix: trivial — use `plugins_url()` / `plugin_dir_url(__FILE__)` |
| FP4 | "Calling ip-api.com / icanhazip.com / ipinfo.io" (R8–R10) | **Real**, but they ARE arguably a "service" (geolocation processing on external servers, not doable locally) — *could* be defended under Guideline 6 with `== External services ==` docs | Decision: **drop them**. Cleaner than disclosing 3 third-party IP services. Use `$_SERVER['REMOTE_ADDR']` + ship a small GeoIP-Lite DB if country is essential, or just store IP and resolve client-side at view time |
| FP5 | 18 REST routes "may need permission_callback" (C10) | **Soft flag** — every flagged route already has `permission_callback => 'get_route_access'`. Reviewer wants us to confirm that `get_route_access` actually enforces capability + nonce per route | Fix: audit `get_route_access`; document the auth contract in a docblock; ensure routes that mutate data require `manage_options` (or appropriate cap), and public-read routes use `__return_true` explicitly |
| FP6 | Freemius PHP library conflict (C3) | **Real** — Freemius is unprefixed and many plugins ship it | Fix: Strauss prefix to `TTA\Vendor\Freemius`. **Risk: Freemius license-activation flow may break — must test on staging before release** |
| FP7 | Text domain `atlasaidev` in 49 strings (C18) | **Real** — `libs/AtlasAiDev/` SDK uses its own domain | Fix: global find-replace `'atlasaidev'` → `'text-to-audio'`. The AtlasAiDev SDK is bundled, not externally referenced, so changing the domain is safe |
| FP8 | Admin menu position 20 (C22) | **Real but borderline** — position 20 sits next to Pages. We *do* want top-level visibility | Decision: keep top-level but raise position to e.g. `80` (below Tools, above Settings). Not lower than 75 so it remains discoverable |
| FP9 | `ob_start()` "unclosed" in `helpers.php:403` & `TTA_Admin.php:359` (C15, C16) | **Possibly stylistic** — most `ob_start()` blocks pair with `ob_get_clean()` later in the same function | Audit each: confirm the pairing exists; if it does, add an inline comment for the reviewer's static analyzer; if any path can `return`/`throw` before the close, add `try { … } finally { ob_get_clean(); }` |

---

## 5. Open Questions (decide before coding)

1. **Player choice in free** — do we remove player 2/3 code from free entirely, or always allow user to pick player 1/2/3 in free (Pro adds only premium voices)? *(Recommended: keep all 3 players free; gate only premium voices.)*
2. **Analytics in free** — what's the minimum analytics surface that should remain in free? Just basic listen counts? *(Recommended: full local analytics; Pro adds export + advanced charts.)*
3. **`ip-api.com` / `ipinfo.io`** — drop entirely (use `REMOTE_ADDR`) or keep with disclosure + opt-in toggle? *(Recommended: drop. Server-side IP is enough for country lookup via WP's `GeoIP` if needed later.)*
4. **Translations** — keep GitHub-pulled translations or rely on wp.org translate?  *(Recommended: rely on wp.org; remove `TTA_Translation_Downloader` for free plugin and bundle compiled `.mo` only.)*
5. **Freemius prefixing** — Mozart is unmaintained; pick Strauss or PHP-Scoper. *(Recommended: Strauss.)*

---

## 6. Risk Register

| Risk | Mitigation |
|---|---|
| Removing locked-Pro stubs breaks Pro plugin's expectations of free | Update Pro plugin in parallel (`text-to-audio-pro`) to use its own implementations; coordinate release |
| Prefixing Freemius SDK breaks license activation flow | Test Freemius opt-in / activation / deactivation flows on staging |
| Bundling Chart.js increases ZIP size | Acceptable trade — required by guideline 7 |
| Translations stop working when GitHub downloader removed | Ship `.mo` files in `languages/` for shipped locales (zh_CN, ja, ko_KR, es_ES, it_IT, pt_BR) |

---

## 7. Working Notes

_(append as work progresses)_

- 2026-05-20 — Plan drafted, Jira TTS-247 opened, branch `feature/TTS-247` created off `develop`. Pro repo switched to `develop`.
- 2026-05-20 — Cross-checked closure email against source code. All 5 sampled claims (ABSPATH redefine, `__('Hey %1$s')`, `__($default, $text_domain)`, deactivation hook, etc.) are real. The only "fix-but-with-nuance" cases are catalogued in §4. The Pro force-deactivation lives in `includes/TTA_Deactivator.php:37`, not `text-to-audio.php` — updated L1.
- 2026-05-20 — Email also lists 19 minified-bundle incidences but only enumerates 8. Added S11 to enumerate the rest.
