# TTS-238 — Plugin Check (PCP) Report

**Run date:** 2026-05-02
**Tool:** Plugin Check (PCP) plugin, all categories (General, Plugin Repo, Security, Performance, Accessibility), Error + Warning.
**Environment:** `http://localhost/seven/wp-admin/` (the "seven" test install).
**Builds tested:** `integration/TTS-238-into-develop` branch, deployed via `npm run build:seven` for both plugins.

> Status: **REPORT ONLY — nothing fixed yet** (per instruction). This
> file records what PCP found so we can triage before release.

---

## 1. Free plugin — `text-to-audio` (v2.2.4)

**Totals: 1 ERROR + 152 WARNINGS (153 findings).**

### 1.1 ERRORS (1) — release-blocking

| File:Line | Code | Note |
|---|---|---|
| `includes/atlasvoice/StepRail.php:216` | `WordPress.Security.EscapeOutput.OutputNotEscaped` | `echo self::render_common_tag_checkboxes();` — the helper returns pre-built HTML, flagged as unescaped. **Introduced by TTS-238** (the picker tag-checkbox renderer; D27.34 added script/style to the same method). Fix: build the markup with escaping helpers (`esc_attr`, `esc_html`) and either return already-escaped output documented with a `phpcs:ignore`, or echo via a whitelisted approach. |

### 1.2 WARNINGS introduced by TTS-238 (3) — should address before release

| File:Line | Code | Note |
|---|---|---|
| `text-to-audio.php:363` | `WordPress.DB.SlowDBQuery.slow_db_query_meta_key` | `get_posts(['meta_key' => '_atlasvoice_post_rules'])` in the D27.25 cleanup migration. |
| `text-to-audio.php:377` | `WordPress.DB.SlowDBQuery.slow_db_query_meta_key` | Second batch query in the same migration (auth-variant meta). |
| `includes/atlasvoice/VerifyAcrossPosts.php:81` | `WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in` | `post__not_in` in the verify-across-posts sampler (D14). |

> These are WARNINGS, not blockers for WordPress.org. They are
> admin-only / one-shot code paths (migration runs once; verify runs
> only inside the picker), so the performance impact is negligible.
> Can ship as-is with a `phpcs:ignore` + justification comment, or
> refactor later.

### 1.3 WARNINGS pre-existing / project-wide (149) — NOT introduced by TTS-238

All remaining warnings are the `WordPress.NamingConventions.PrefixAllGlobals.*` family — the plugin's long-standing convention of using `TTA` / `TTA_Admin` / `TTA_Api` namespaces and `tts_` / `tta_` hook/function prefixes that PCP doesn't recognize as a unique-enough plugin prefix. **These exist identically on `develop` and `main`** — TTS-238 did not add them (it follows the same naming convention as the rest of the plugin for consistency).

Breakdown by rule:

| Code | Count |
|---|---|
| `PrefixAllGlobals.NonPrefixedHooknameFound` | 80 |
| `PrefixAllGlobals.NonPrefixedNamespaceFound` | 32 |
| `PrefixAllGlobals.NonPrefixedFunctionFound` | 21 |
| `PrefixAllGlobals.DynamicHooknameFound` | 13 |
| `PrefixAllGlobals.NonPrefixedVariableFound` | 3 |

Files affected: every namespaced class (`TTA\*`, `TTA_Admin\*`, `TTA_Api\*`, `TTA\AtlasVoice\*`), `includes/helpers.php` (global functions like `tta_clean_content`, `get_player_id`, `add_listen_button`), `libs/AtlasAiDev/*`, `text-to-audio.php`. The AtlasVoice subsystem files (`Bootstrap`, `RuleResolver`, `StepRail`, etc.) inherit the same `TTA\AtlasVoice` namespace warning — consistent with the existing codebase.

> **Decision needed:** these are a whole-plugin refactor (rename
> namespace + every hook/function to a unique prefix). They are NOT
> TTS-238's responsibility and were presumably already accepted on
> develop. Out of scope for this merge unless the review team
> specifically requires the prefix rename now.

---

## 2. Pro plugin — `text-to-audio-pro` (v3.3.2)

**Totals: 821 ERRORS + 90 WARNINGS (911 findings).**

> ⚠️ The vast majority are **NOT actionable for this merge** — they
> split into three buckets: deploy-folder artifact, bundled vendor SDK,
> and pre-existing plugin code. **None are in the files TTS-238
> touched** (`TTA_Pro_Filters.php`, `TTSProHelper.js`,
> `TTA_Pro_Actions.php`, `TTA_Pro_Api_Routes.php`'s
> `css_selectors_for_posts`).

### 2.1 Deploy-folder artifact — 239 ERRORS (false positive)

`WordPress.WP.I18n.TextDomainMismatch` — "Expected `text-to-speech-pro-premium` but got `text-to-audio-pro`." 239 occurrences across every file with a translation call.

**Cause:** I deployed Pro into the folder `text-to-speech-pro-premium/` (to match the existing seven install), but the plugin's real text domain is `text-to-audio-pro`. PCP derives the expected text domain from the folder name. On the actual Pro distribution folder (`text-to-audio-pro`) this rule does not fire. **Not a code defect — purely a test-deploy folder mismatch.** Also note: Pro is a premium plugin (Freemius-distributed), not submitted to WordPress.org, so this rule is informational only.

### 2.2 Bundled Freemius SDK — ~470 ERRORS (vendor code, not ours)

The bulk of the real ERRORs live under `freemius/` — `EscapeOutput.OutputNotEscaped` in `freemius/templates/*.php`, `freemius/includes/*.php`, `ExceptionNotEscaped` in the SDK, `plugin_updater_detected`, etc. This is the **third-party Freemius licensing SDK** shipped verbatim. Not our code, not modified by TTS-238, not actionable here.

### 2.3 Pre-existing Pro code findings (~90) — NOT introduced by TTS-238

Genuinely-ours Pro findings, all pre-existing on develop:

| File | Code | Count |
|---|---|---|
| `Includes/TTA_Pro_Lib_AtlasAiDev.php` | `WordPress.WP.I18n.NonSingularStringLiteralDomain` | 32 |
| `Api/TTA_Pro_Api_Routes.php` | `Generic.PHP.ForbiddenFunctions.Found` | 2 |
| `Api/TTA_Pro_Api_Routes.php` | `WordPress.DateTime.RestrictedFunctions.*` | 2 |
| `Api/TTA_Pro_Api_Routes.php` | `WordPress.WP.I18n.NonSingularStringLiteralDomain` | 2 |
| `Includes/TTA_Pro_Activator.php` / `TTA_Pro_Constants.php` / `TTA_Pro_Helper.php` | `WordPress.WP.AlternativeFunctions.file_system_operations_*` (chmod/mkdir/rmdir/is_writable) | ~8 |
| `Includes/TTA_Pro_Report_Email.php` | `WordPress.DB.PreparedSQL.NotPrepared` + `EscapeOutput` | 2 |
| `text-to-audio-pro.php` / `uninstall.php` | `file_system_operations_rmdir` | 4 |
| `Libs/AtlasAiDev/*` | `EscapeOutput` / `NonSingularStringLiteralDomain` | ~4 |

> These are file-system + i18n + SQL-prep hygiene items in existing Pro
> code. None touch the TTS-238 surface. They were the same before the
> merge.

### 2.4 TTS-238 contribution to Pro PCP findings

**Zero.** The TTS-238-modified Pro files produced no new PCP errors or
warnings — the merge's Pro changes (`absint()` casts in
`TTA_Pro_Filters.php`, the `TTSProHelper.js` include/exclude fix, the
`TTA_Pro_Actions.php` post_id resolve, the per-post save normalization)
are all clean.

---

## 3. Release-readiness verdict (PCP dimension only)

| Item | Blocker? | Owner |
|---|---|---|
| Free: StepRail.php:216 EscapeOutput ERROR | **YES** (1 real error from TTS-238) | TTS-238 — fix before release |
| Free: 2× slow_db_query_meta_key (migration) | No (warning, admin-only) | TTS-238 — optional `phpcs:ignore` |
| Free: post__not_in (verify sampler) | No (warning, picker-only) | TTS-238 — optional |
| Free: 149× PrefixAllGlobals | No (pre-existing, project-wide) | Separate refactor, not TTS-238 |
| Pro: 239× TextDomainMismatch | No (deploy-folder artifact) | N/A — deploy into correct slug folder |
| Pro: Freemius SDK errors | No (vendor code) | N/A |
| Pro: ~90 pre-existing code findings | No (pre-existing) | Separate hardening pass |
| Pro: TTS-238 surface | Clean | — |

**Bottom line:** the only PCP item TTS-238 must fix before release is
the single **`StepRail.php:216` EscapeOutput ERROR**. Everything else
is either pre-existing (same on develop), vendor SDK, or a test-deploy
artifact.

---

## 4. Reproduction

1. Deploy: `npm run build:seven` in each plugin.
2. `http://localhost/seven/wp-admin/admin.php?page=plugin-check`
3. Select the plugin → all categories + Error/Warning → "Check it!".
4. Free → `text-to-audio/text-to-audio.php`; Pro →
   `text-to-speech-pro-premium/text-to-audio-pro.php`.
