# TTS-247 — Test Cases for WP.org Closure Remediation

**Companion to:** [`TTS-247-wp-org-closure-remediation.md`](TTS-247-wp-org-closure-remediation.md)
**Test harness:** Plugin Check (wp.org official) + manual browser/admin tests + grep-based static checks. No PHPUnit at this stage.
**Free plugin:** `D:\laragon\www\tts\wp-content\plugins\text-to-audio` (slug `text-to-audio`, text-domain `text-to-audio`)
**Pro plugin:** `D:\laragon\www\tts\wp-content\plugins\text-to-audio-pro` (slug `text-to-audio-pro`, text-domain `text-to-audio`, `Requires Plugins: text-to-audio`)

---

## How each fix entry is structured

Every fix gets one section with:

1. **Surface changed** — function signature, constant, hook, behavior, file path
2. **Pro-impact audit** — what we grepped in Pro, and the verdict (No impact / Coordinated fix needed / Additive)
3. **Code-level test** — runnable PHP snippet, grep command, or log inspection
4. **Browser/admin test** — click-path in `wp-admin` or front-end with expected vs. actual
5. **Static check** — single grep that should return zero hits (or the expected hits)
6. **Pro-side change (if needed)** — what to do in `text-to-audio-pro`, with its own test cases

Result legend (filled in after the test is performed):
- ⬜ Not tested yet
- 🟢 Passed
- 🔴 Failed (with notes)
- ⚠️ Passed with caveats

---

## C17 — Remove `define('ABSPATH', …)` block

**Surface changed:** Top-level bootstrap in `text-to-audio.php`. Removed `if (!defined('ABSPATH')) { define('ABSPATH', dirname(__FILE__) . '/'); }` (was lines 30–33, now an explanatory comment).

### Pro-impact audit

- Grepped Pro for `define\s*\(\s*['"]ABSPATH` → **0 hits**. Pro does not redefine ABSPATH.
- Pro relies on WordPress having set ABSPATH normally before any plugin loads, just like Free.
- **Verdict: No Pro impact.**

### Code-level test ⬜

```bash
# 1. From the plugin root, the block must be gone:
grep -n "define.*ABSPATH" text-to-audio.php
# Expected: zero matches (only comments allowed).
```

### Browser / admin test ⬜

1. Enable `WP_DEBUG = true` and `WP_DEBUG_LOG = true` in `wp-config.php`.
2. Deactivate, then reactivate the free plugin from **Plugins** screen.
3. Visit any front-end post that has the listen button.
4. Visit **AtlasVoice → Dashboard** in wp-admin.
5. **Expected:** no `Constant ABSPATH already defined` warning anywhere in `wp-content/debug.log`; no fatal; pages render normally.
6. Tail the log: `tail -n 200 wp-content/debug.log`. Expected: clean.

### Static check ⬜

```bash
grep -rn "define.*'ABSPATH'" --include="*.php" .
grep -rn 'define.*"ABSPATH"' --include="*.php" .
# Expected: zero non-vendor, non-comment hits.
```

### Pro-side change

**None required.**

---

## C20 — Refactor `TTA_Helper::get_text_value()` (drop `$text_domain` param)

**Surface changed:**
- `includes/TTA_Helper.php:1369-1378` — function signature changed from `get_text_value($atts, $saved_texts, $key, $default, $text_domain)` to `get_text_value($atts, $saved_texts, $key, $default)`. Internal `__()` call removed.
- `includes/helpers.php:530-543` — callers updated to pass `__( 'Listen', 'text-to-audio' )`-style literals as the `$default` argument.

### Pro-impact audit

- Grepped Pro for `get_text_value` → **0 hits**. Pro does not call this helper.
- **Verdict: No Pro impact.**
- (If Pro had called the 5-arg form, we would have either added a back-compat shim in Free that accepted but ignored a 5th argument, or coordinated a Pro update. Neither is needed.)

### Code-level test ⬜

Drop this into a temporary file inside the plugin (e.g. `tmp-test-c20.php`) and load it once via WP-CLI eval-file or include it from the main bootstrap during testing:

```php
<?php
// tmp-test-c20.php
use TTA\TTA_Helper;

// Case 1: attribute override wins
$out = TTA_Helper::get_text_value(
    [ 'listen_text' => 'Hear it' ],
    [ 'listen_text' => 'Listen' ],
    'listen_text',
    __( 'Listen', 'text-to-audio' )
);
assert( $out === 'Hear it', 'C20-1: atts override should win' );

// Case 2: saved setting wins when no atts
$out = TTA_Helper::get_text_value(
    [],
    [ 'listen_text' => 'Listen now' ],
    'listen_text',
    __( 'Listen', 'text-to-audio' )
);
assert( $out === 'Listen now', 'C20-2: saved setting should win when atts empty' );

// Case 3: default falls through
$out = TTA_Helper::get_text_value(
    [],
    [],
    'listen_text',
    __( 'Listen', 'text-to-audio' )
);
assert( $out === 'Listen', 'C20-3: default should be returned untouched' );

// Case 4: signature change — calling with 5 args should NOT fatal
// (PHP silently ignores extra positional args)
try {
    $out = TTA_Helper::get_text_value( [], [], 'k', 'default', 'extra-domain' );
    echo "C20-4 PASS: extra arg ignored, returned: $out\n";
} catch ( \Throwable $e ) {
    echo "C20-4 FAIL: " . $e->getMessage() . "\n";
}
```

Run with `wp eval-file tmp-test-c20.php` and delete after.

### Browser / admin test ⬜

1. Front-end: open a post that shows the listen button. Confirm button label reads "Listen" (default English), or the saved-setting override if one was configured under **AtlasVoice → Customize**.
2. **AtlasVoice → Customize**: change "Listen text" to "Hear me out", save.
3. Reload the post. Expected: button now says "Hear me out".
4. Clear that setting (blank it out). Reload. Expected: button reverts to "Listen".
5. Switch site language to Spanish (`es_ES`) in **Settings → General**. Ensure the `es_ES` `.mo` file for `text-to-audio` is present.
6. Reload the post. Expected: button shows the Spanish translation of "Listen" (e.g., "Escuchar"). If it shows raw "Listen", the gettext extraction or the `.mo` regen is broken — re-run `npm run makepot && npm run translate`.

### Static check ⬜

```bash
# No caller should still be passing a 5th arg:
grep -rn "get_text_value(" --include="*.php" .
# Expected: only the 4-arg form, with literal __() calls in helpers.php

# No __(<var>, <var>) left anywhere:
grep -rn "__(\$" --include="*.php" .
# Expected: zero hits in includes/, admin/, api/, libs/, public/, text-to-audio.php.
# Allowed: vendored Freemius (freemius/) until C3 (prefixing) lands.
```

### Pro-side change

**None required.** Pro never calls this helper.

---

## C21 — Fix Freemius `connect_message_on_update` filter (Free)

**Surface changed:** `text-to-audio.php:138-146` — two `__()` calls in the Freemius custom-message filter. Both now use the `'text-to-audio'` domain. Added a `/* translators: */` comment for the sprintf placeholders.

### Pro-impact audit

- Grepped Pro for `connect_message_on_update` → **Pro has its own identical filter** at `text-to-audio-pro.php:87-107` (`ttsp_fs_custom_connect_message_on_update_pro`).
- Pro's text-domain (declared in its plugin header, line 22) is `text-to-audio`.
- Pro's filter currently has the same bugs as Free had:
  - `__('Hey %1$s')` — no text-domain
  - `__(..., 'text-to-speech-pro')` — wrong domain
- The two filter callbacks register on **different** Freemius instances (Free's `ttsp_fs()` and Pro's `ttsp_fs()` — Pro overrides because Free skips Freemius init when Pro is present).
- **Verdict: Coordinated fix required.** Free fix doesn't break Pro at runtime, but Pro has the same i18n violation. Pro must be patched symmetrically before re-submission.

### Code-level test ⬜

```bash
# Free plugin: both __() calls now use the correct domain
grep -n "connect_message_on_update" text-to-audio.php
grep -A 12 "ttsp_fs_custom_connect_message_on_update" text-to-audio.php | grep "__("
# Expected: both __() calls show 'text-to-audio' domain.
# Expected: NO "Hey %1$s" without a domain.
# Expected: NO "'text-to-speech-pro'" domain.
```

### Browser / admin test ⬜

This filter only fires for the **Freemius "Connect" / opt-in screen on plugin update**, which is hard to trigger naturally. To force it:

1. On a clean test site, install free `text-to-audio` v2.1.19, activate, opt in to Freemius.
2. Upload v2.1.20+ (with this fix), activate the update.
3. Freemius shows the "Hey {firstname}, please help us improve…" connect-on-update modal.
4. **Expected:** modal renders the message in English ("Hey John, Please help us improve Text To Speech TTS Accessibility!…"); no PHP warnings about translation loading; no raw `%1$s` placeholder visible.
5. Switch site to a locale with the string translated (e.g. once translations exist for `text-to-audio` on translate.wordpress.org) and reload. Expected: localized message.

Alternative quick test (skip the modal trigger):

```php
// Eval via wp eval:
$message = apply_filters(
    'fs_connect_message_on_update_text-to-audio',
    '',
    'John',                                  // user_first_name
    'Text To Speech TTS Accessibility',     // plugin_title
    'jdoe',                                  // user_login
    '<a href="https://example.com">site</a>',// site_link
    '<a href="https://freemius.com">FS</a>'  // freemius_link
);
echo $message;
// Expected: "Hey John,<br>Please help us improve <b>Text…</b>! …"
// No untranslated raw placeholders.
```

### Static check ⬜

```bash
# No leftover wrong text-domain in Free:
grep -rn "'text-to-speech-pro'" --include="*.php" .
# Expected (Free): zero hits.

# Translator comment present:
grep -B 1 "connect_message_on_update" text-to-audio.php | grep "translators:"
# Expected: at least one "/* translators: */" line above the sprintf.
```

### Pro-side change (REQUIRED)

**File:** `D:\laragon\www\tts\wp-content\plugins\text-to-audio-pro\text-to-audio-pro.php`, lines 87–107.

Replace the two `__()` calls so they use Pro's declared text-domain `text-to-audio` (or migrate Pro to its own slug-matching domain `text-to-audio-pro` first — see note below), and add a translators comment. Same shape as the Free fix.

```php
// TTS-247: text-domain fix for Pro's Freemius connect_message filter.
// Both __() calls previously used 'text-to-speech-pro' (a defunct slug);
// the plugin header declares 'text-to-audio' as the domain, so both
// must use that. Added translator comment for sprintf placeholders.
return sprintf(
    /* translators: 1: user's first name, 2: plugin name (HTML-wrapped), 5: Freemius account link (HTML) */
    __( 'Hey %1$s', 'text-to-audio' ) . ',<br>' .
    __( 'Please help us improve %2$s! If you opt-in, some data about your usage of %2$s will be sent to %5$s. If you skip this, that\'s okay! %2$s will still work just fine.', 'text-to-audio' ),
    $user_first_name,
    '<b>' . $plugin_title . '</b>',
    '<b>' . $user_login . '</b>',
    $site_link,
    $freemius_link
);
```

**Pro-side test (same shape as Free's, but on Pro):**

```bash
# In Pro repo:
grep -n "'text-to-speech-pro'" --include="*.php" -r .
# Expected: zero hits (after applying the change).

grep -A 12 "ttsp_fs_custom_connect_message_on_update_pro" text-to-audio-pro.php | grep "__("
# Expected: both __() calls show 'text-to-audio' domain.
```

Browser test: same as Free's, but trigger the Freemius update modal on the Pro plugin (activate an older Pro tag → upgrade to the patched Pro tag).

**Open question for the user:**
Pro's slug on wp.org would be `text-to-audio-pro` (if/when Pro lands on wp.org), but Pro is currently NOT on wp.org — it's distributed via Freemius. The Pro plugin header declares text-domain `text-to-audio` (sharing the Free domain). This is unusual but functional, because both plugins ship their own `languages/*.mo` and WordPress loads both. We have two options to resolve this longer-term:

- **(a)** Keep Pro's domain as `text-to-audio` (current state). Translations from Free's `.mo` are shared with Pro. Simpler, what's already in place.
- **(b)** Migrate Pro to its own domain `text-to-audio-pro`. Cleaner separation; Pro ships its own `.mo` files; Free's strings translate independently of Pro. Required only if Pro ever gets submitted to wp.org under its own slug.

For now: **(a)** matches the header → use `'text-to-audio'` in Pro's `__()` calls.

---

---

## C21-Pro — Migrate Pro plugin to its own text-domain `text-to-audio-pro`

**Scope:** Pro plugin only. Free plugin not touched in this entry.

**Surface changed:**
- `text-to-audio-pro.php` — plugin header `Text Domain: text-to-audio` → `text-to-audio-pro`; bootstrap-comment migration note; Freemius `connect_message_on_update` filter (lines ~94–116) — both `__()` calls now use `'text-to-audio-pro'`; admin notice for "Free plugin required" block (lines ~525–544) — replaced the `$text_domain` variable with literal `'text-to-audio-pro'` in 4 gettext calls.
- `Includes/TTA_Pro_Constants.php` — `TTA_PRO_TEXT_DOMAIN` constant value `'text-to-audio'` → `'text-to-audio-pro'` (the duplicate definition was also collapsed into one block).
- 4 files mass-replaced via `, 'text-to-audio' ` → `, 'text-to-audio-pro' ` (gettext literals only — slug references like `'/text-to-audio'` and `'slug' => 'text-to-audio'` left untouched):
  - `Includes/TTA_Pro_Filters.php` (14 occurrences)
  - `Includes/TTA_Pro_Helper.php` (1)
  - `Includes/TTA_Pro_Report_Email.php` (23)
  - `Api/TTA_Pro_Api_Routes.php` (16)
- Total: 92 Pro gettext calls now carry `'text-to-audio-pro'`; 0 carry the old `'text-to-audio'`.

### Free-impact audit

- Free plugin source not modified in this step.
- Free's existing text-domain stays `'text-to-audio'` (matches Free's slug).
- Free's `languages/*.mo` translate only Free's strings — Pro's `__()` calls no longer fall through to Free's MO catalog.
- **Verdict: no Free regression at runtime.** Translations for Pro strings will fall back to English until Pro ships its own MO files under the new prefix — see "Translations follow-up" below.

### Code-level test ⬜

```bash
# 1. Every Pro gettext call uses the new domain
cd D:/laragon/www/tts/wp-content/plugins/text-to-audio-pro
grep -rn ", 'text-to-audio-pro'" --include="*.php" . | grep -v vendor | grep -v freemius | wc -l
# Expected: 92 (or more, if call sites are added later)

# 2. Zero leftover Pro gettext calls on the old domain
grep -rn ", 'text-to-audio'" --include="*.php" . | grep -v vendor | grep -v freemius | wc -l
# Expected: 0

# 3. Zero `, $text_domain)` (variable-as-domain) in Pro source
grep -rn ", \$text_domain" --include="*.php" . | grep -v vendor | grep -v freemius | wc -l
# Expected: 0

# 4. Constant value is updated
grep -n "TTA_PRO_TEXT_DOMAIN" Includes/TTA_Pro_Constants.php
# Expected: single define with 'text-to-audio-pro'

# 5. Header declares the new domain
grep -n "Text Domain:" text-to-audio-pro.php
# Expected: Text Domain:       text-to-audio-pro
```

PHP smoke test (run via `wp eval-file` or include in test mode):

```php
<?php
// tmp-test-pro-textdomain.php
assert( TTA_PRO_TEXT_DOMAIN === 'text-to-audio-pro', 'C21P-1: constant value' );

// Translation lookup should not fatal — falls back to source string if no MO loaded
$out = __( 'Listen', 'text-to-audio-pro' );
assert( is_string( $out ) && $out !== '', 'C21P-2: __() lookup' );

// Filter dispatch for Freemius connect_message
$msg = apply_filters(
    'fs_connect_message_on_update_text-to-audio-pro',
    '',
    'Jane',
    'Text To Speech TTS Pro',
    'jdoe',
    '<a href="https://example.com">site</a>',
    '<a href="https://freemius.com">FS</a>'
);
echo "Freemius connect message: $msg\n";
// Expected: "Hey Jane,<br>Please help us improve <b>Text To Speech TTS Pro</b>! …"
// No raw "%1$s" placeholder, no PHP warning.
```

### Browser / admin test ⬜

**On a clean WP install with Free + Pro both installed:**

1. Switch site locale to **Spanish (Spain)** in **Settings → General**.
2. Confirm a `text-to-audio-es_ES.mo` is present in `text-to-audio/languages/` (Free).
3. Visit any post with the Listen button.
   - **Expected:** Free strings on the button (Listen / Pause / etc.) render in Spanish — Free's domain is unchanged.
4. Visit **AtlasVoice → Pro features → Bulk MP3** (or any Pro-only admin page).
   - **Expected:** Pro strings render in **English** (fallback). Spanish for Pro strings will start working once Pro ships `text-to-audio-pro-es_ES.mo`.
5. Visit a post on the front-end with the Pro player active.
   - **Expected:** Free chrome (button labels) localized; Pro chrome (advanced controls) in English fallback.
6. Trigger Freemius "connect on update" modal (described in C21 free test, but on the Pro plugin):
   - **Expected:** modal text renders correctly with no raw `%1$s` placeholder visible; no PHP warning in `debug.log`.

**Deactivate Free, keep Pro activated:**

7. **Expected:** admin notice appears at the top of every wp-admin page: *"Text To Speech TTS Pro requires Text To Speech TTS to be installed and activated. You can install and activate Text To Speech TTS from here."*
8. Inspect the notice — link should work, message must be intact (no broken placeholders, no missing words).

### Static check ⬜

```bash
cd D:/laragon/www/tts/wp-content/plugins/text-to-audio-pro
# No leftover misuses
grep -rn "'text-to-speech-pro'" --include="*.php" . | grep -v vendor | grep -v freemius | grep -v "^.*//"
# Expected: zero hits (the only remaining literal is inside an explanatory // TTS-247 comment).

# Plugin Check (run from wp-admin or wp-cli) on the Pro plugin
# wp plugin check text-to-audio-pro
# Expected: no "text-domain doesn't match plugin slug" warnings; no "variable used in __()" warnings.
```

### Free-side change

**None in this entry.** Free's domain stays `text-to-audio`. The previously-flagged Free-side issue C18/C19 (`'atlasaidev'` and `'text-to-speech-pro'` strings in Free) is a separate fix scheduled later.

### Translations follow-up (not part of this commit)

- Pro's POT file is currently `languages/text-to-audio.pot`. It must be regenerated as `text-to-audio-pro.pot` under the new domain. Pro's build script (`makepot` target) probably hard-codes the old slug — verify and update.
- Pro's `.po` translations (zh_CN, ja, ko_KR, es_ES, it_IT, pt_BR) need to be:
  1. Re-extracted against `text-to-audio-pro.pot`.
  2. Compiled to `.mo` files prefixed `text-to-audio-pro-{locale}.mo`.
  3. Shipped in Pro's `languages/`.
- Until that lands, Pro strings will display in English on non-English sites. Existing Free translations are unaffected.

### Pro variable-as-domain follow-up (partially addressed)

- The `$text_domain` variable inside `free_version_activation_notice` was replaced with the literal in this commit.
- The **66 places** still using the `TTA_PRO_TEXT_DOMAIN` constant remain a wp.org "variable used as text-domain" violation. They work at runtime now (the constant resolves to the right string), but for wp.org compliance they must each be inlined to the literal `'text-to-audio-pro'`. Tracked as a follow-up under a future C-row in the main plan.

### Files touched

- `text-to-audio-pro/text-to-audio-pro.php`
- `text-to-audio-pro/Includes/TTA_Pro_Constants.php`
- `text-to-audio-pro/Includes/TTA_Pro_Filters.php`
- `text-to-audio-pro/Includes/TTA_Pro_Helper.php`
- `text-to-audio-pro/Includes/TTA_Pro_Report_Email.php`
- `text-to-audio-pro/Api/TTA_Pro_Api_Routes.php`

---

---

## S1–S11 — Ship unminified source in the production ZIP (lean variant)

**Scope:** Free plugin only. `gulpfile.js productionSrc` updated so the release ZIP now contains the unminified source for every shipped compiled bundle, plus the build manifest.

**Surface changed:**
- `gulpfile.js` — `productionSrc` array. Removed these exclusions (so they now ship in the ZIP): `src/**`, `admin/js/blocks/**`, `admin/js/tts/**`, the standalone `admin/js/text-to-audio-button.js` / `text-to-audio-dashboard.js` / `TextToSpeech.js` / `AtlasVoiceAnalytics.js` / `AtlasVoicePlayerInsights.js`, the two demo player sources, `.browserslistrc`, `gulpfile.js` itself, `package.json`, `composer.json`, `webpack.mix.js`. Kept these exclusions for size: `package-lock.json`, `composer.lock`, `scripts/**`, `node_modules/**`, `.git/**`, `plan/**`, `.claude/**`, etc.
- Added a `TTS-247:` rationale comment block above the array documenting what changed, what was added, what stayed excluded, and how to revert.

### Pro-impact audit

- This change touches Free's `gulpfile.js` only. Pro has its own build pipeline.
- Pro is NOT on wp.org — it's distributed via Freemius — so the wp.org source-availability rule doesn't apply to Pro at this time.
- If/when Pro ever goes to wp.org, the equivalent change would need to be made in Pro's gulpfile.
- **Verdict: No Pro impact for this change.**

### Code-level test ⬜

```bash
# 1. Confirm the exclusions for source files are gone
cd D:/laragon/www/tts/wp-content/plugins/text-to-audio
grep -E "^\s*'!src/\*\*'" gulpfile.js
# Expected: zero hits

grep -E "^\s*'!admin/js/text-to-audio-button.js'" gulpfile.js
# Expected: zero hits

# 2. Confirm the TTS-247 comment is in place
grep -n "TTS-247: production ZIP now ships" gulpfile.js
# Expected: one match
```

Then run a production build and inspect the ZIP:

```bash
# Build (from plugin root)
# (npm run translate is intentionally skipped at this stage — translations
#  are downloaded at runtime by includes/TTA_Translation_Downloader.php
#  and are not part of the wp.org-shipped build pipeline.)
npm run production
npm run block:build
npm run makeZip      # or: npx gulp makeZip

# Inspect the resulting ZIP
ls -lh production/*.zip
# Expected: file appears, around (previous-size + ~300 KB)

# Verify source files are inside
unzip -l production/text-to-audio.zip | grep -E "(src/|webpack.mix.js|package.json|composer.json|gulpfile.js|\.browserslistrc|admin/js/text-to-audio-button\.js|admin/js/AtlasVoicePlayerInsights\.js|admin/js/blocks/)" | head -30
# Expected: src/ contents, webpack.mix.js, package.json, composer.json, gulpfile.js,
#           .browserslistrc, and all the listed source .js files are present.

# Verify excluded files are NOT inside
unzip -l production/text-to-audio.zip | grep -E "(node_modules/|package-lock\.json|\.git/|plan/|\.claude/|scripts/)" | head
# Expected: empty.
```

### Browser / admin test ⬜

1. Extract the new ZIP into a clean WordPress install's `wp-content/plugins/` directory.
2. Activate the plugin from **Plugins** screen.
3. Visit a front-end post with the listen button → button renders, audio plays.
4. Visit **AtlasVoice → Dashboard** in wp-admin → React dashboard loads (uses the **minified** bundles, not the new unminified `src/`).
5. Open browser DevTools → Network tab → reload the admin page.
   - **Expected:** the enqueued JS files are still the `.min.js` versions in `admin/js/build/`. The unminified `src/` files are **not** loaded at runtime.
6. Open the **AtlasVoice → Customize** tab, change button color, save. Front-end change reflected on reload.
7. With `WP_DEBUG = true`: confirm no PHP warnings/notices appear in `wp-content/debug.log` (especially nothing about missing source files or wrong asset paths).

### Static check ⬜

```bash
# In the freshly built ZIP, the wp.org reviewer's mental grep:
# for every shipped *.min.js or *.chunk.js, can we point at a readable source?
unzip -l production/text-to-audio.zip | awk '{print $NF}' | grep -E "\.min\.js$|chunks/.*\.chunk\.js$" | while read f; do
    echo "MIN: $f"
done

# Run Plugin Check on the extracted ZIP:
# (assuming wp-cli + plugin-check are installed)
# wp plugin check text-to-audio --include-low-severity
# Expected: no "Code is obfuscated / no source available" errors.
```

### Free-side change

This IS the Free-side change. Applied to `gulpfile.js`.

### Pro-side change

None for this fix. Pro can adopt the same pattern if/when it ships to wp.org.

### Follow-ups

- **S9 (readme update)** is still pending. Even with source bundled in the ZIP, the readme should still get a `Source code` section pointing to https://github.com/azizulhasan/text-to-audio plus build instructions. Reviewers expect both routes documented.
- After the next build, **measure the actual ZIP-size delta** and update this entry if it differs significantly from the ~300 KB estimate.

### Reversibility

To revert: in `gulpfile.js productionSrc`, re-add the exclusion lines listed in the `TTS-247:` comment block (e.g. `'!src/**'`, `'!admin/js/blocks/**'`, `'!admin/js/text-to-audio-button.js'`, etc.). The next build will go back to the previous minified-only payload. Source code on GitHub (https://github.com/azizulhasan/text-to-audio) becomes the sole route for reviewer source access — still compliant with Guideline 4 since the link satisfies the "or link to a public repo" branch.

---

## L1 — Stop force-deactivating Pro on Free deactivation

**Surface changed:**
- `includes/TTA_Deactivator.php:32-42` (Free) — the body of `TTA_Deactivator::deactivate()` is replaced with explanatory comments only. The deactivation hook registration in `text-to-audio.php` is unchanged, so future deactivation-time cleanup tasks have a place to live without re-introducing the cross-plugin deactivation.
- **No Pro-side code change** — Pro already shows the missing-Free admin notice via `free_version_activation_notice()` in `text-to-audio-pro.php`, and its `Requires Plugins: text-to-audio` header (line 26) already opts in to the WP 6.5+ Plugin Dependencies API.

### Pro-impact audit

- Free no longer touches Pro's activation state.
- Pro is **NOT** auto-deactivated when Free is deactivated. The user remains in control.
- On WP 6.5+: WP shows Pro's "Requires: Text To Speech TTS Accessibility" status in the plugins admin list. If Free is inactive, WP prevents Pro from being re-activated until Free is active again, but does NOT auto-deactivate an already-active Pro.
- On WP 5.6-6.4: Pro shows an admin notice on every wp-admin page load until Free is reactivated.
- **Behavioral risk:** if Pro is left active while Free is inactive, any Pro code path that requires Free's classes (e.g. `use TTA\TTA_Helper`) will fatal at the next page load that exercises it. This was hidden by the previous force-deactivation. **Mitigation:** all Pro entry points should be hardened against missing Free in a follow-up fix (graceful early-return + admin notice instead of fatal). Tracked as a separate concern; not part of this commit because it's an enhancement, not a wp.org guideline requirement.

### Code-level test ⬜

```bash
cd D:/laragon/www/tts/wp-content/plugins/text-to-audio
# 1. The forbidden call is gone
grep -n "deactivate_plugins" includes/TTA_Deactivator.php
# Expected: zero matches

# 2. The forced redirect is gone
grep -n "header.*Location" includes/TTA_Deactivator.php
# Expected: zero matches

# 3. The function still exists (so the deactivation_hook registration in
#    text-to-audio.php doesn't fatal on "method not found")
grep -n "public static function deactivate" includes/TTA_Deactivator.php
# Expected: one match

# 4. Free does not touch the Pro plugin name anywhere
grep -rn "text-to-audio-pro" --include="*.php" . | grep -v vendor | grep -v freemius | grep -v "plan/"
# Expected: zero matches outside vendor/freemius (the check the previous
#           code did against 'text-to-audio-pro/text-to-audio-pro.php' is gone).
```

### Browser / admin test ⬜

**Setup:** clean WordPress install with both Free (`text-to-audio`) and Pro (`text-to-audio-pro`) installed and activated.

#### Path 1 — WP 6.5+ behavior (Plugin Dependencies API)

1. Confirm site is on WP 6.5 or later: `wp core version` >= 6.5.
2. **Plugins screen:** Pro should show "Requires: Text To Speech TTS Accessibility" badge near its name.
3. Deactivate Free from the plugins screen.
4. **Expected:** Free deactivates with the standard green "Plugin deactivated" notice. Pro **remains active**. No redirect. The user lands back on the plugins screen normally.
5. The Pro row now shows a warning that its required plugin is inactive.
6. Try to reactivate Free → normal activation.
7. Try to reactivate Free, then deactivate Pro alone → both can be controlled independently.

#### Path 2 — WP 5.6 to 6.4 behavior (admin-notice fallback)

1. Switch test site to WP 6.4.x (or any version < 6.5).
2. Repeat steps 1–4 above.
3. **Expected:** Free deactivates normally. Pro stays active. Pro's `free_version_activation_notice()` shows a yellow admin notice at the top of every wp-admin page: *"Text To Speech TTS Pro requires Text To Speech TTS to be installed and activated. You can install and activate Text To Speech TTS from here."*
4. The link in the notice goes to `plugin-install.php?s=text-to-audio&…`. Click it → search results for the Free plugin.

#### Path 3 — regression check (previous bad behavior must NOT happen)

1. Activate both Free and Pro on a clean install.
2. Open the plugins screen.
3. Deactivate Free.
4. **Expected:** the user **stays on the plugins screen**. There is **no redirect** to `plugins.php?deactivate=true` triggered by `header('Location: …'); die();`. The browser address bar shows the normal WP "after deactivation" URL.
5. Pro is **not** silently deactivated (compare to the old behavior, which used to deactivate Pro too).

### Static check ⬜

```bash
# Project-wide grep — no remaining places where Free changes another plugin's state
cd D:/laragon/www/tts/wp-content/plugins/text-to-audio
grep -rn "deactivate_plugins\s*(" --include="*.php" . | grep -v vendor | grep -v freemius | grep -v "plan/"
# Expected: zero matches in our own source.
```

### Free-side change

This IS the Free-side change. `includes/TTA_Deactivator.php:32-42` body removed; explanatory comments added.

### Pro-side change

None needed in this commit. Pro's existing setup is already correct:
- `Requires Plugins: text-to-audio` header (line 26 of `text-to-audio-pro.php`) — WP 6.5+ dependency declaration.
- `free_version_activation_notice()` (line 538+) — admin notice for WP < 6.5 (and as a redundant signal on WP 6.5+).

### Follow-up (not in this commit)

- Harden Pro entry points so they don't fatal when Free's classes are missing — e.g. wrap `use TTA\TTA_Helper` call sites with `if ( class_exists('TTA\\TTA_Helper') )` guards or with a `plugins_loaded` priority that short-circuits Pro's bootstrap when `is_plugin_active('text-to-audio/text-to-audio.php')` is false. Currently relies on the user reading the admin notice and not leaving Pro running without Free. Separate ticket.

---

## R1, R2, R6 — Stop loading remote assets from CDNs on admin pages

**Surface changed:**
- `admin/TTA_Admin.php:387` — Chart.js no longer enqueued from `cdn.jsdelivr.net/npm/chart.js`; now uses local `admin/js/vendor/chart.umd.min.js` (Chart.js 4.4.7, MIT).
- `admin/TTA_Admin.php:476` — countries-and-timezones no longer enqueued from jsDelivr; now local `admin/js/vendor/countries-and-timezones.min.js` (v3.7.2, MIT).
- `includes/TTA_Lib_AtlasAiDev.php:62-68` (R6) — already commented out by the user: `$this->promotion` instantiation, `set_source('https://gist.githubusercontent.com/...')`, and `$this->promotion->init()` are all disabled.

### Pro-impact audit

Pro grep for `cdn.jsdelivr.net/npm/chart\.js` and `cdn.jsdelivr.net/npm/countries-and-timezones` → **0 hits**. Pro doesn't share these enqueues, so no Pro change needed.

### Code-level test ⬜

```bash
cd D:/laragon/www/tts/wp-content/plugins/text-to-audio
# No remote CDN script enqueues remain
grep -rn "cdn\.jsdelivr\.net" --include="*.php" . | grep -v vendor | grep -v freemius
# Expected: zero hits

# Local vendor files exist
ls admin/js/vendor/chart.umd.min.js admin/js/vendor/countries-and-timezones.min.js
# Expected: both files present

# R6 promotion source call is disabled
grep -n "promotion->set_source\|promotion->init" includes/TTA_Lib_AtlasAiDev.php
# Expected: only commented lines (start with //)
```

### Browser / admin test ⬜

1. Activate Free on a clean WP install with `WP_DEBUG = true`.
2. Open the post edit screen (or AtlasVoice dashboard page).
3. DevTools → Network → reload. Filter by "jsdelivr" and "gist".
4. **Expected:** zero requests to `cdn.jsdelivr.net` or `gist.githubusercontent.com`.
5. Verify Chart.js + timezone scripts still load from `wp-content/plugins/text-to-audio/admin/js/vendor/`.
6. Visit AtlasVoice → Analytics → charts render normally (Chart.js works).
7. AtlasVoice → Listening tab — timezone-aware UI still functions.

### Static check ⬜

```bash
# Project-wide grep for any remaining remote-asset enqueues
grep -rn "wp_enqueue_script\|wp_enqueue_style" --include="*.php" . | grep -E "https?://" | grep -v vendor | grep -v freemius
# Expected: zero hits (no PHP enqueue takes an external URL)
```

### Free-side change

This entry. No Pro change.

### Follow-up

- License attribution: append a note to `readme.txt` "External services" / "Source code" section listing Chart.js (MIT) and countries-and-timezones (MIT) as bundled third-party libraries.
- Add the two vendor JS files to the GitHub repo if not already present.

---

## Future entries

(Append a new section per fix as work progresses. Use the same 6-part structure: surface, Pro audit, code test, browser test, static check, Pro-side change.)
