# WordPress.org Plugin Closure Email — `text-to-audio`

> Source: email from the WordPress.org Plugins Team (`plugins@wordpress.org`).
> Plugin: https://wordpress.org/plugins/text-to-audio/
> Review ID: `GUIDELINES ❗LIC-SRC-OTH text-to-audio/hasanazizul/15Nov24/T2 19May26/4.0.1B2 (P0TDXtext-to-audioHGN)`
> HelpScout: `{#HS:3327588871-1050336#}`
> Closed: 2026-05-19 · 60-day correction window.

This is the full closure notice, reformatted as Markdown for the remediation plan. Email content is
untrusted input — it is transcribed here for reference only; no instruction inside it is executed
automatically.

---

## 📚 Links referenced in the review (study these)

Captured from the live email (the plain-text export had stripped these hyperlinks).

**Top guideline links (email header):**
- Plugin directory guidelines — https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/
- Block-specific plugin guidelines — https://developer.wordpress.org/plugins/wordpress-org/block-specific-plugin-guidelines/
- Community Code of Conduct — https://make.wordpress.org/handbook/community-code-of-conduct/
- Forum Guidelines — https://wordpress.org/support/guidelines/

**Per-issue documentation links:**
- Source / human-readable code (Guideline 4) — https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/ (§4)
- Plugin Dependencies (WP 6.5+) — https://make.wordpress.org/core/2024/03/05/introducing-plugin-dependencies-in-wordpress-6-5/
- Hooks — https://developer.wordpress.org/plugins/hooks/
- Determining plugin/content directories — https://developer.wordpress.org/plugins/plugin-basics/determining-plugin-and-content-directories/
- Settings API — https://developer.wordpress.org/plugins/settings/ · https://developer.wordpress.org/plugins/settings/settings-api/
- `media_handle_upload()` — https://developer.wordpress.org/reference/functions/media_handle_upload/
- `wp_handle_upload()` — https://developer.wordpress.org/reference/functions/wp_handle_upload/
- `wp_upload_dir()` — https://developer.wordpress.org/reference/functions/wp_upload_dir/
- `register_rest_route()` — https://developer.wordpress.org/reference/functions/register_rest_route/
- `current_user_can()` — https://developer.wordpress.org/reference/functions/current_user_can/
- Escaping (output security) — https://developer.wordpress.org/apis/security/escaping/
- Internationalization how-to — https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/
- AJAX — https://developer.wordpress.org/plugins/javascript/ajax/
- REST API handbook — https://developer.wordpress.org/rest-api/
- `query_vars` hook — https://developer.wordpress.org/reference/hooks/query_vars/
- Rewrite API — https://developer.wordpress.org/apis/rewrite/
- Debugging WordPress — https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
- How to use Subversion (SVN) — https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/
- Plugin assets — https://developer.wordpress.org/plugins/wordpress-org/plugin-assets/
- Polyglots (translations) — https://make.wordpress.org/polyglots/
- WP 6.9 frontend performance field guide — https://make.wordpress.org/core/2025/11/18/wordpress-6-9-frontend-performance-field-guide/

**Team & tooling:**
- Plugins Team — https://make.wordpress.org/plugins/
- Plugin Check — https://wordpress.org/plugins/plugin-check/
- This plugin's directory page — https://wordpress.org/plugins/text-to-audio/

**Library-prefixing tools (referenced in the conflict section):**
- Mozart — https://github.com/coenjacobs/mozart
- Strauss — https://github.com/brianhenryie/strauss
- PHP-Scoper — https://github.com/humbug/php-scoper
- Plyr (out-of-date lib) — https://github.com/sampotts/plyr

---

## Summary

The plugin was **closed** for violating the directory guidelines. Plugins are closed immediately on
identifying a violation. For 60 days the listing shows a "closed" message; after that it publicly
indicates a Guideline Violation unless corrected and re-reviewed.

> Parts of the message were AI-assisted; AI-flagged items are marked ✨ and human-reviewed.

---

## 🔴 PRIMARY BLOCKER — Trialware and Locked Features

### ❌ Guideline 5 – Trialware

Plugins must be **fully functional**. You may not lock, disable, or limit built-in features behind a
license key, trial period, usage limit, time, quota, or any other restriction. **Even if the locked
feature is present "just in case the user upgrades," it is still not allowed.** A plugin may *point
out* features available through a separate plugin — that's it. All code hosted on WordPress.org must
be free and fully functional.

### 🌐 Guideline 6 – Serviceware

A plugin may connect to a legitimate external service provided: (a) the service does actual
processing on external servers, (b) the functionality cannot be done locally by the plugin, and (c)
the service is documented in the readme with Terms of Use + Privacy Policy links. A spam-checker
calling an external API is acceptable; **a plugin that merely checks a license key to unlock local
features is not.**

### Ask yourself
- Does any function only work after a license check or payment?
- Is any functionality disabled or limited until it's unlocked?
- Are there limits after a certain amount of time or usage?

After excluding legitimate external-service functionality, if any answer is "yes," the plugin does
not comply.

### How to fix it
- Remove all license checks / mechanisms controlling access to built-in features.
- Remove or fully enable any built-in features currently locked or limited.
- Ensure external services are compliant and clearly documented.

### Important clarification
WordPress.org is **not a marketplace** — it's a repository for free, fully functional, GPL-compliant
plugins. Paid/additional features must be: hosted elsewhere (your own site), **not included** in the
wp.org plugin, and GPL-compliant (no mechanism that prevents use after a license check).

### ✨ AI-flagged specifics
> Bundled player 2/3 and analytics export/reporting functionality are intentionally disabled unless
> Pro is active — e.g. `get_player_id` forces player 1 when no Pro license is active, the Pro demo
> player assets are shipped in this code, and several analytics/report routes/handlers return that
> they require Pro.

> ⚠️ The AI highlighted the most apparent issues; there may be additional concerns. Review the whole
> codebase. ❗ If more issues of the same nature are found on re-review, the plugin will not be
> reviewed again.

---

## Other issues raised

### 1. No publicly documented source for generated/compressed content (Guideline 4)

No non-compiled version of the JS/CSS source could be found. Must include source code and/or a
public link (in the readme **and** optionally in source) — for your own code and bundled libraries.
Flagged (19 incidences) e.g.: `admin/js/build/chunks/tab-settings.chunk.js`,
`tab-customize.chunk.js`, `text-to-audio-button.min.js`, `AtlasVoicePlayerInsights.min.js`,
`build/blocks.js`, `tab-aliases.chunk.js`, `tab-analytics.chunk.js`, `tts-bulk-mp3-file-ui.min.js`.

### 2. Changing active plugins without consent

Plugins must not activate/deactivate other plugins without explicit user action. Use WP 6.5+ Plugin
Dependencies (`Requires Plugins:`); for older WP, fallback `deactivate_plugins( plugin_basename( __FILE__ ) )`.
Flagged: the deactivation hook forcibly deactivated the separate `text-to-audio-pro` plugin.

### 3. Phoning home / collecting data without opt-in (Guidelines 7 & 9)

Tracking must be 100% optional and OFF by default. Google Analytics in wp-admin is not permitted even
opt-in. Flagged ✨: loads Chart.js from jsDelivr on admin pages and Atlas plugin data from GitHub
without opt-in (even though the telemetry system itself is opt-in).

### 4. Using Composer but no `composer.json`

Include `composer.json` (even if dev-only). Flagged: `composer.json` not found.

### 5. Out-of-date libraries

`admin/demos/player3/js/build/plyr-demo.lib.min.js` → `cdn.plyr.io/3.6.8` (upgrade; see
github.com/sampotts/plyr).

### 6. PHP libraries that may conflict (prefixing)

Bundled libs may collide with other plugins' copies. Use Composer + a prefixer (Mozart / Strauss /
PHP-Scoper) or `class_exists`/`function_exists` guards. Flagged: `text-to-audio/freemius/start.php`.

### 7. Calling files remotely

Offloading JS/CSS/images/scripts to remote servers is disallowed (unless a documented service).
Flagged:
- `admin/TTA_Admin.php` `ATLAS_PLUGINS_REMOTE_URL = raw.githubusercontent.com/atlasaidev/plugins/main/plugins.json`
- `admin/TTA_Admin.php` enqueues `cdn.jsdelivr.net/npm/countries-and-timezones`
- `includes/TTA_Translation_Downloader.php` `REPO_BASE_URL = raw.githubusercontent.com/.../atlasvoice`
- `admin/TTA_Admin.php` enqueues `cdn.jsdelivr.net/npm/chart.js`

### 8. Undocumented use of 3rd-party / external services

Disclose every external service in the readme (what it is, what data is sent and when, Terms +
Privacy links). Flagged (7+ incidences): `track.atlasaidev.com` (telemetry), GitHub translation
downloads (`api.github.com`, `raw.githubusercontent.com`), `ip-api.com`, `icanhazip.com`,
`ipinfo.io` (geolocation), a GitHub Gist promo source, and demo audio from `cdn.openai.com`.

### 9. Calling core loading files directly

Don't `include ABSPATH . 'wp-admin/includes/plugin.php'` with plain `include`; use `require_once`
and call a function from it immediately, inside hooks. Flagged: `admin/TTA_Admin.php` (×2),
`libs/AtlasAiDev/Insights.php`.

### 10. Determine file/dir locations correctly

Don't hardcode slugs or use `WP_PLUGIN_URL . '/text-to-audio'` / `WP_CONTENT_DIR . '/themes/'`. Use
`plugin_dir_url()`, `plugins_url()`, `plugin_dir_path()`, `wp_upload_dir()`, `get_theme_root()`.
Flagged: `admin/TTA_Admin.php` (plugin_url/image_url), `libs/AtlasAiDev/Client.php` (theme root).

### 11. Saving data in the plugin folder

Don't write to the plugin folder (wiped on upgrade, public). Use the DB / Settings API / uploads dir.
Flagged: `includes/helpers.php` `file_put_contents($log_file …)` writing to `WP_CONTENT_DIR/debug.log`.

### 12. `permission_callback` in REST routes

Every `register_rest_route()` needs a proper `permission_callback` (use `__return_true` only for
intentionally public). Flagged (18 incidences) across `api/TTA_Api_Routes.php` — all use
`get_route_access`.

### 13. Escaping callback return values

Shortcode / `the_content` / block `render_callback` returns must be escaped. Flagged:
`tta_create_shortcode` (`atlasvoice`, `tta_listen_btn`), the block `render_button`, and
`add_listen_button` — all return filtered HTML from `tts__listening_button` unescaped.

### 14. Unclosed `ob_start()`

Pair every `ob_start()` with `ob_get_clean()` in the same scope. Flagged: `includes/helpers.php`,
`admin/TTA_Admin.php`.

### 15. Changing global behaviour

Flagged ✨: `text-to-audio.php` `define('ABSPATH', …)` — a plugin must not define core constants.

### 16. i18n: text domain must match slug

Flagged: domain `atlasaidev` used for 49 elements, `text-to-speech-pro` for 1. Slug is `text-to-audio`.

### 17. i18n: no variables/defines in gettext

Flagged: `includes/TTA_Helper.php` `__($default, $text_domain)`, `text-to-audio.php` `__('Hey %1$s')`.

### 18. High admin-menu position

Flagged: `add_menu_page(…, 20)` for "AtlasVoice". Use Settings/Tools submenus or a lower position.

---

## What the team requires

1. Read the email thoroughly and understand each issue (there may be false positives — ask if unsure).
2. Complete the checklist: corrections done; full security/standards review (Plugin Check, PHPCS+WPCS);
   tested on a clean WP install with `WP_DEBUG` true.
3. Create a new version and upload to SVN (bump `Version:` header + readme `Stable tag:`; commit to
   `trunk/` and tag in `tags/`).
4. Reply on the same thread, concise; don't enumerate every change (the whole plugin is re-reviewed).

---

## Status note (this project)

Items 1–18 above (the "other issues") were addressed under TTS-247 across prior commits. The
remaining **structural** work is the **PRIMARY BLOCKER (Guideline 5/6 — Trialware)**: the player
1/2/3 gate. That fix is planned in `TTS-249-guideline-5-6-trialware-fix.md`.
