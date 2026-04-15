# Refactor Plan — Make `BulkMP3File` Extend `TextToSpeechProPlayer`

**Date:** 2026-04-15
**Goal:** Eliminate ~600 lines of copy-pasted code from `bulk-mp3-file.js` by having `BulkMP3File` extend the `TextToSpeechProPlayer` class defined in `plyr.js`.
**Impact:** `bulk-mp3-file.js` shrinks from **680 lines → ~80 lines**. `plyr.js` gets 3 small surgical edits.

---

## Background — Why This Works

Both files currently define **nearly identical classes** inside their own `DOMContentLoaded` closures:

- `plyr.js` defines `TextToSpeechProPlayer` (lines 34–1655) and exposes `window.TextToSpeechProPlayer` at line 1657.
- `bulk-mp3-file.js` defines `BulkMP3File` (lines 30–674) and exposes `window.BulkMP3File` at line 676.

**Key discovery:** Plyr's `init_gtts`, `init_gctts`, `init_chat_gpt`, `init_elevenlabs` methods **already accept a `shouldReturnURL` flag**. When set to `true`, they return the generated URL instead of setting up a DOM audio player. React's `generate-bulk-mp3-file.js` already calls these methods with `shouldReturnURL=1` (see line 121: `bulkMP3File.init_gtts(1)`).

This means **all 4 `init_*` methods, `fetchData`, `getUrl`, `getSettings`, `ttsLoader`, `#hideLoader`, `#getTotalBatch`, `getCountryCode`, and `findMatchingKey` can be directly inherited with zero duplication**.

The only things `BulkMP3File` actually does differently:

1. Constructor adapter (accepts `TTS` object, hardcodes `buttonId=1`, skips `getStoredContent` + `#thirdPartyPluginCompatible`).
2. Registers a `wp.hooks.addFilter('ttsProGetContentFromDOM', ...)` to prevent DOM content extraction.
3. Skips plyr's auto-initialization (plyr auto-calls `init_gtts()` etc. in constructor lines 74–107; bulk lets React call them manually).
4. Respects `TTS.settings.is_regenerate_file` flag in `#setMP3FileURL`.

All 4 items can be handled via **2 constructor-option flags** and **3 small edits to `plyr.js`**.

---

## Script Load Order — Enqueue Changes Required

**File:** `D:\xampp\htdocs\azizulhasan\tts\wp-content\plugins\text-to-audio-pro\Includes\TTA_Pro_Actions.php`
**Method:** `enqueue_generate_bulk_mp3_file()` (line 212)

### Current state (lines 212–231)

```php
public function enqueue_generate_bulk_mp3_file() {
    if ( ! empty( $_REQUEST['atlasvoice_mp3_file'] ) && self::$player_id > 2 ) {
        if ( \TTA_DEBUG_MODE ) {
            wp_enqueue_script( 'tts-bulk-mp3-file', TTA_PRO_FREE_VERSION_ADMIN_URL . '/js/build/tts-bulk-mp3-file-ui.min.js', [ 'wp-components' ], TTA_PRO_VERSION, true );
        } else {
            wp_enqueue_script( 'tts-bulk-mp3-file', TTA_PRO_JS_URL . '/build/tts-bulk-mp3-file-ui.min.js', ['wp-components'], TTA_PRO_VERSION, true );
        }

        wp_enqueue_style( 'tts-bulk-mp3-file', \TTA_PRO_CSS_URL . '/atlasvoice-css-selectors.css', [], TTA_PRO_VERSION, 'all' );
        wp_localize_script( 'tts-bulk-mp3-file', 'ttsObjPro', self::$localize_data );

        wp_enqueue_script( 'text-to-audio-plyr', TTA_PRO_JS_URL . '/build/bulk-mp3-file.min.js', [ 'tts-bulk-mp3-file' ], TTA_PRO_VERSION, true );
        wp_localize_script( 'text-to-audio-plyr', 'ttsObjPro', self::$localize_data );
        wp_localize_script( 'text-to-audio-plyr', 'ttsObj', self::$localize_data );

        wp_enqueue_style( 'text-to-audio-pro', TTA_PRO_CSS_URL . '/text-to-audio-pro.css', [], TTA_PRO_VERSION, 'all' );
    }
}
```

**Problem:** The handle `text-to-audio-plyr` is being used for `bulk-mp3-file.min.js`, and **`plyr.min.js` (the parent class file) is not enqueued at all** on the bulk page. After the refactor, `bulk-mp3-file.min.js` will depend on `TextToSpeechProPlayer` from `plyr.min.js`, so `plyr.min.js` MUST be enqueued first.

### New state after refactor

```php
public function enqueue_generate_bulk_mp3_file() {
    if ( ! empty( $_REQUEST['atlasvoice_mp3_file'] ) && self::$player_id > 2 ) {
        if ( \TTA_DEBUG_MODE ) {
            wp_enqueue_script( 'tts-bulk-mp3-file', TTA_PRO_FREE_VERSION_ADMIN_URL . '/js/build/tts-bulk-mp3-file-ui.min.js', [ 'wp-components' ], TTA_PRO_VERSION, true );
        } else {
            wp_enqueue_script( 'tts-bulk-mp3-file', TTA_PRO_JS_URL . '/build/tts-bulk-mp3-file-ui.min.js', ['wp-components'], TTA_PRO_VERSION, true );
        }

        wp_enqueue_style( 'tts-bulk-mp3-file', \TTA_PRO_CSS_URL . '/atlasvoice-css-selectors.css', [], TTA_PRO_VERSION, 'all' );
        wp_localize_script( 'tts-bulk-mp3-file', 'ttsObjPro', self::$localize_data );

        // NEW: Enqueue plyr lib (Plyr.js audio player library) — required by plyr.min.js
        wp_enqueue_script( 'text-to-audio-plyr-lib', TTA_PRO_JS_URL . '/build/plyr.lib.min.js', array( 'wp-hooks' ), TTA_PRO_VERSION, true );

        // NEW: Enqueue plyr.min.js — defines the parent class TextToSpeechProPlayer
        wp_enqueue_script( 'text-to-audio-plyr', TTA_PRO_JS_URL . '/build/plyr.min.js', [ 'text-to-audio-plyr-lib', 'wp-hooks' ], TTA_PRO_VERSION, true );
        wp_localize_script( 'text-to-audio-plyr', 'ttsObjPro', self::$localize_data );
        wp_localize_script( 'text-to-audio-plyr', 'ttsObj', self::$localize_data );

        // CHANGED: Handle renamed to 'text-to-audio-bulk-mp3' (was 'text-to-audio-plyr'),
        //          dependency list now includes 'text-to-audio-plyr' so parent class is
        //          guaranteed to load first.
        wp_enqueue_script( 'text-to-audio-bulk-mp3', TTA_PRO_JS_URL . '/build/bulk-mp3-file.min.js', [ 'tts-bulk-mp3-file', 'text-to-audio-plyr' ], TTA_PRO_VERSION, true );
        wp_localize_script( 'text-to-audio-bulk-mp3', 'ttsObjPro', self::$localize_data );
        wp_localize_script( 'text-to-audio-bulk-mp3', 'ttsObj', self::$localize_data );

        wp_enqueue_style( 'text-to-audio-pro', TTA_PRO_CSS_URL . '/text-to-audio-pro.css', [], TTA_PRO_VERSION, 'all' );
    }
}
```

### Exact diff

| Line | Action | Detail |
|---|---|---|
| After line 222 | **INSERT** | `wp_enqueue_script( 'text-to-audio-plyr-lib', ... );` |
| After line 222 | **INSERT** | `wp_enqueue_script( 'text-to-audio-plyr', TTA_PRO_JS_URL . '/build/plyr.min.js', [...] );` |
| After line 222 | **INSERT** | 2× `wp_localize_script( 'text-to-audio-plyr', ... );` |
| Line 225 | **MODIFY** | Rename handle `text-to-audio-plyr` → `text-to-audio-bulk-mp3`; change `.min.js` path stays the same (`bulk-mp3-file.min.js`); add `text-to-audio-plyr` to dependency array → `[ 'tts-bulk-mp3-file', 'text-to-audio-plyr' ]` |
| Lines 226–227 | **MODIFY** | Update `wp_localize_script` handles from `text-to-audio-plyr` → `text-to-audio-bulk-mp3` |

---

## Phase 1 — Modify `plyr.js`

**File:** `D:\xampp\htdocs\azizulhasan\tts\wp-content\plugins\text-to-audio-pro\Assets\js\plyr.js`

### Change 1.1 — Move class out of `DOMContentLoaded` closure

**Why:** Allows `BulkMP3File` to `extend TextToSpeechProPlayer` without waiting for DOMContentLoaded-ordering races between the two scripts. The class becomes available immediately on script parse.

**Edit A — Line 22:**
Remove the opening of the DOMContentLoaded wrapper:

```js
// DELETE line 22:
document.addEventListener("DOMContentLoaded", function () {
```

(Also delete the comment-only lines 23–33 — they are commented-out `setInterval` debug code and not used.)

**Edit B — Lines 1657–1660:**
Close out properly:

```js
// BEFORE:
    window.TextToSpeechProPlayer = TextToSpeechProPlayer
    //     }
    // }, 1);
});

// AFTER:
window.TextToSpeechProPlayer = TextToSpeechProPlayer;
```

**Indentation:** Since the class is no longer wrapped in a function, remove **one level** of indentation from the entire class body (lines 34–1655). Most editors can do this with a "Decrease Indent" on the selected block.

---

### Change 1.2 — Add `options` parameter to the constructor

**Location:** Line 52

**Why:** Lets `BulkMP3File` pass `{ skipPluginCompat: true, skipAutoInit: true }` to turn off DOM-dependent and auto-initialization behavior that is not valid in the admin bulk-generation context.

#### Edit C — Line 52

```js
// BEFORE:
constructor(buttonId, content = '', button = null, TTS = window.TTS) {

// AFTER:
constructor(buttonId, content = '', button = null, TTS = window.TTS, options = {}) {
    this.options = options || {};
```

*(Insert the `this.options = options || {};` as a new line immediately after the opening brace, before the existing `if (typeof NoSleep === 'function' ...)` block at line 53.)*

---

### Change 1.3 — Guard plugin-compatibility setup behind `skipPluginCompat`

**Location:** Lines 67–68 (inside constructor, after `this.player_id` assignment and before `this.#setTitle(TTS)`)

**Why:** Bulk mode has no DOM (runs in admin React UI) — `getStoredContent`, `#thirdPartyPluginCompatible` (which calls `TTSCompatibality` that probes the DOM for sitepress/polylang/gtranslate UI), and `getContent` with storedContent arg all either fail silently or cost cycles for nothing.

#### Edit D — Lines 67–69

```js
// BEFORE (lines 67–69):
this.storedContent = getStoredContent(content, TTS, this.buttonId);
this.selectedLang = this.#thirdPartyPluginCompatible(this.storedContent);
this.content = getContent(content, TTS, this.buttonId, this.selectedLang);

// AFTER:
if ( ! this.options.skipPluginCompat ) {
    this.storedContent = getStoredContent(content, TTS, this.buttonId);
    this.selectedLang = this.#thirdPartyPluginCompatible(this.storedContent);
    this.content = getContent(content, TTS, this.buttonId, this.selectedLang);
} else {
    // Bulk mode: React already supplied the final translated content via
    // get_bulk_post_content endpoint. Skip DOM scraping and plugin detection.
    this.content = getContent(content, TTS, this.buttonId, this.selectedLang);
}
```

---

### Change 1.4 — Guard auto-initialization behind `skipAutoInit`

**Location:** Lines 74–107 (the big `if (!this.fileURL) { ... }` block at the end of the constructor)

**Why:** In single-post mode, the plyr constructor automatically kicks off `init_gtts()` / `init_gctts()` / `init_chat_gpt()` / `init_elevenlabs()` as the final step. In bulk mode, React wants to call these manually in a loop so it can await each one, track progress, and update UI. So bulk must skip this block.

#### Edit E — Lines 74–107

Wrap the entire existing block in `if ( ! this.options.skipAutoInit )`:

```js
// BEFORE (line 74):
if (!this.fileURL) {
    if (this.asynchronousMP3Generate) {
        this.#setUpPlayer('');
    } else {
        // ... player_id branches ...
    }
} else {
    this.init_gtts()
}

// AFTER:
if ( ! this.options.skipAutoInit ) {
    if (!this.fileURL) {
        if (this.asynchronousMP3Generate) {
            this.#setUpPlayer('');
        } else {
            // ... player_id branches (UNCHANGED) ...
        }
    } else {
        this.init_gtts()
    }
}
```

Only the outer `if (!this.fileURL)` block is wrapped. No inner logic changes.

---

### Change 1.5 — Make `#setMP3FileURL` respect `is_regenerate_file`

**Location:** Line 176 (method definition)

**Why:** Currently `#setMP3FileURL` populates `this.fileURL` from the stored URL map whenever one exists for the current language. In bulk regeneration mode, React sets `postSettings.settings.is_regenerate_file = true` before calling `new BulkMP3File(postSettings)`, and we need `this.fileURL` to stay empty so that generation actually runs.

Currently `bulk-mp3-file.js` line 136–138 hacks this via:
```js
if (this.TTS.settings.is_regenerate_file) {
    this.fileURL = '';
}
```

We move that logic into the parent so it's shared.

#### Edit F — Lines 176–204

```js
// BEFORE:
#setMP3FileURL(tts) {
    let fileURLs = {};
    for (let key of Object.keys(tts?.settings?.fileURLs)) {
        fileURLs[key?.toLowerCase()] = tts?.settings?.fileURLs[key];
    }
    let urlLanguage = tts?.extra?.[this.buttonId]?.file_url_key ?? '';
    urlLanguage = urlLanguage?.toLowerCase();
    if (urlLanguage && fileURLs?.[urlLanguage]) {
        this.fileURL = fileURLs[urlLanguage];
    }
    // ... TTS-133 fallback logic (UNCHANGED) ...
}

// AFTER:
#setMP3FileURL(tts) {
    // Bulk regeneration mode — force empty so generation actually runs.
    if ( tts?.settings?.is_regenerate_file ) {
        this.fileURL = '';
        return;
    }

    let fileURLs = {};
    for (let key of Object.keys(tts?.settings?.fileURLs)) {
        fileURLs[key?.toLowerCase()] = tts?.settings?.fileURLs[key];
    }
    let urlLanguage = tts?.extra?.[this.buttonId]?.file_url_key ?? '';
    urlLanguage = urlLanguage?.toLowerCase();
    if (urlLanguage && fileURLs?.[urlLanguage]) {
        this.fileURL = fileURLs[urlLanguage];
    }
    // ... TTS-133 fallback logic (UNCHANGED) ...
}
```

Only the first 4 lines of the method body are new (the `if (is_regenerate_file)` early-return). The rest is unchanged.

---

### Change 1.6 — Null-guard analytics in `init_gctts` / `init_gtts` / `init_chat_gpt` / `init_elevenlabs`

**Location:** Lines 587, 437 (and two more in init_chat_gpt / init_elevenlabs — same pattern)

**Why:** In bulk mode, `AtlasVoiceAnalyticsPro` is NOT enqueued (the bulk page doesn't load it). So `window.AtlasVoiceAnalyticsPro` is `undefined`, which means the inner `if` at plyr line 433 / 581 / etc. doesn't fire, and `this.analytics` stays `null`. Then the next line calls `await this.analytics.getUniqueUserId()` → **TypeError: Cannot read properties of null**.

Technically this is a latent bug fix that also helps bulk mode.

#### Edit G — Line 437 (inside `init_gctts`)

```js
// BEFORE:
if (this.analytics?.userId == 0 || !this.analytics) {
    if (!this.analytics && window.AtlasVoiceAnalyticsPro) {
        let AtlasVoiceAnalyticsPro = window?.AtlasVoiceAnalyticsPro
        this.analytics = AtlasVoiceAnalyticsPro.getInstance(this.TTS);
    }
    await this.analytics.getUniqueUserId();   // ← crashes if analytics still null
}

// AFTER:
if (this.analytics?.userId == 0 || !this.analytics) {
    if (!this.analytics && window.AtlasVoiceAnalyticsPro) {
        let AtlasVoiceAnalyticsPro = window?.AtlasVoiceAnalyticsPro
        this.analytics = AtlasVoiceAnalyticsPro.getInstance(this.TTS);
    }
    if ( this.analytics ) {
        await this.analytics.getUniqueUserId();
    }
}
```

#### Edit H — Line 587 (inside `init_gtts`)

Same pattern as above. Wrap `await this.analytics.getUniqueUserId();` in `if ( this.analytics )`.

#### Edit I — `init_chat_gpt` (around line 730)

Same pattern. Locate the `await this.analytics.getUniqueUserId();` in this method and wrap it.

#### Edit J — `init_elevenlabs` (around line 860)

Same pattern. Locate the `await this.analytics.getUniqueUserId();` in this method and wrap it.

---

### Summary of plyr.js edits

| # | Location | Change |
|---|---|---|
| 1.1a | Line 22 | Delete `document.addEventListener("DOMContentLoaded", function () {` |
| 1.1b | Lines 23–33 | Delete commented-out debug code |
| 1.1c | Line 1657 | Keep `window.TextToSpeechProPlayer = TextToSpeechProPlayer;` but un-indent one level |
| 1.1d | Lines 1658–1660 | Delete `});` and comment lines |
| 1.1e | Lines 34–1655 | Un-indent entire class body by one level |
| 1.2 | Line 52 | Add `, options = {}` to constructor signature |
| 1.2 | Line 53 (new) | Insert `this.options = options || {};` as first line of constructor body |
| 1.3 | Lines 67–69 | Wrap `getStoredContent` + `#thirdPartyPluginCompatible` + `getContent` in `if (!this.options.skipPluginCompat) { ... } else { this.content = getContent(...); }` |
| 1.4 | Lines 74–107 | Wrap the whole `if (!this.fileURL) { ... } else { this.init_gtts() }` auto-init block in `if (!this.options.skipAutoInit) { ... }` |
| 1.5 | Lines 176–204 | Prepend `if (tts?.settings?.is_regenerate_file) { this.fileURL = ''; return; }` to `#setMP3FileURL` |
| 1.6 G | Line 437 | Wrap `await this.analytics.getUniqueUserId();` in `if (this.analytics)` |
| 1.6 H | Line 587 | Wrap `await this.analytics.getUniqueUserId();` in `if (this.analytics)` |
| 1.6 I | ~Line 730 | Wrap `await this.analytics.getUniqueUserId();` in `if (this.analytics)` (inside `init_chat_gpt`) |
| 1.6 J | ~Line 860 | Wrap `await this.analytics.getUniqueUserId();` in `if (this.analytics)` (inside `init_elevenlabs`) |

**Total lines touched in plyr.js:** ~40 lines of real change (plus one-time indentation adjustment of the class body from Edit 1.1e).

---

## Phase 2 — Rewrite `bulk-mp3-file.js`

**File:** `D:\xampp\htdocs\azizulhasan\tts\wp-content\plugins\text-to-audio-pro\Assets\js\bulk-mp3-file.js`

**Strategy:** **Full file replacement.** The current 680-line file is ~90% duplicate code. Rather than editing method-by-method, we replace the entire file with a ~80-line slim version that extends `TextToSpeechProPlayer`.

### New content of `bulk-mp3-file.js`

```js
/**
 * Bulk MP3 File Generator
 *
 * Thin subclass of TextToSpeechProPlayer used by the React admin UI
 * (generate-bulk-mp3-file.js) to generate MP3 files for many posts in
 * a loop.
 *
 * The parent class (defined in plyr.js) contains all MP3 generation
 * logic — init_gtts, init_gctts, init_chat_gpt, init_elevenlabs,
 * fetchData, getSettings, ttsLoader, etc. This subclass only overrides
 * the constructor to adapt the argument shape (React passes a full TTS
 * object per post) and to opt out of the DOM-bound features plyr does
 * for frontend single-post use.
 *
 * @since  <next-version>
 * @author AtlasAiDev
 */

// Side-effect import: ensures plyr.js has executed and
// window.TextToSpeechProPlayer is defined before we reference it.
// (Also enforced by the wp_enqueue_script dependency chain in
// TTA_Pro_Actions::enqueue_generate_bulk_mp3_file().)
import './plyr';

document.addEventListener( 'DOMContentLoaded', function () {

    /**
     * BulkMP3File — extends TextToSpeechProPlayer with bulk-mode
     * constructor adapter and admin-UI-safe options.
     */
    class BulkMP3File extends window.TextToSpeechProPlayer {

        /**
         * @param {Object} TTS Post settings object from
         *                     get_bulk_post_content REST endpoint.
         *                     Contains: contents, extra, settings.
         */
        constructor( TTS = {} ) {
            // Bulk always uses player button id 1 (the default player).
            const buttonId = 1;
            const content  = ( TTS?.contents && TTS.contents[ buttonId ] ) || '';

            // Prevent any plyr/TTSProHelper code path that tries to
            // extract content from the live DOM — React has already
            // supplied the final content via the REST endpoint.
            if ( window.wp && window.wp.hooks ) {
                wp.hooks.addFilter(
                    'ttsProGetContentFromDOM',
                    'atlasvoice/bulk-mp3',
                    function () { return false; }
                );
            }

            // Call parent constructor with bulk-mode options:
            //   skipPluginCompat — skip getStoredContent +
            //                      #thirdPartyPluginCompatible (DOM probes).
            //   skipAutoInit     — skip the auto-call of init_gtts() etc.
            //                      React will call them in its own loop.
            super( buttonId, content, null, TTS, {
                skipPluginCompat: true,
                skipAutoInit:     true,
            } );
        }
    }

    window.BulkMP3File = BulkMP3File;
} );
```

### What goes away vs what remains

| Current `bulk-mp3-file.js` content | Fate |
|---|---|
| Lines 1–17: imports (`TTSCompatibality`, `TTSProHelper`, `PlyrLib`) | **REMOVED** — handled inside plyr.js parent class |
| Lines 18–29: class opening + comments | **REPLACED** by the new file skeleton above |
| Lines 30–52: class fields (buttonId, title, contents, path, compatible, …) | **REMOVED** — inherited from parent class |
| Lines 54–98: constructor | **REPLACED** with the slim constructor shown above |
| Lines 100–122: `gtranslateCompitable()` | **REMOVED** — never called (was dead code: commented out of constructor) |
| Lines 124–141: `#setMP3FileURL` | **REMOVED** — parent now handles `is_regenerate_file` |
| Lines 144–148: `#setPath` | **REMOVED** — inherited |
| Lines 150–152: `#setTitle` | **REMOVED** — inherited |
| Lines 154–173: `#thirdPartyPluginCompatible` | **REMOVED** — skipped via `skipPluginCompat: true` |
| Lines 176–286: `init_gctts` | **REMOVED** — inherited from parent |
| Lines 288–410: `init_gtts` | **REMOVED** — inherited |
| Lines 412–518: `init_chat_gpt` | **REMOVED** — inherited |
| Lines 520–543: `#getTotalBatch` | **REMOVED** — inherited |
| Lines 545–566: `#lockGeneratingMP3File` | **REMOVED** — the retry logic already lives inline inside parent's `init_gtts`/`init_gctts`/`init_chat_gpt` (plyr.js lines 524–550 in init_gctts, similar in others) |
| Lines 568–580: `fetchData` | **REMOVED** — inherited |
| Lines 582–589: `getUrl` | **REMOVED** — inherited |
| Lines 591–614: `getSettings` | **REMOVED** — inherited |
| Lines 617–631: `getCountryCode` | **REMOVED** — inherited |
| Lines 634–640: `#hideLoader` | **REMOVED** — inherited |
| Lines 642–672: `ttsLoader` | **REMOVED** — inherited as `#ttsLoader` (private). React UI never calls it externally, so this is fine. |
| Line 676: `window.BulkMP3File = BulkMP3File` | **KEPT** (new file re-exports it) |

**Line count:** 680 lines → ~80 lines. **Deleted: ~600 lines of duplicated code.**

---

## Phase 3 — Build & Enqueue Validation

### Step 3.1 — Verify webpack build still produces both bundles

**File:** `D:\xampp\htdocs\azizulhasan\tts\wp-content\plugins\text-to-audio-pro\webpack.mix.js`

Current (lines 5–6):
```js
mix.js('Assets/js/plyr.js', 'Assets/js/build/plyr.min.js');
mix.js('Assets/js/bulk-mp3-file.js', 'Assets/js/build/bulk-mp3-file.min.js');
```

**No change required.** Both entry points stay separate so that:
- Front-end post pages enqueue only `plyr.min.js`.
- Admin bulk page enqueues both `plyr.min.js` and `bulk-mp3-file.min.js`.

However, because `bulk-mp3-file.js` now does `import './plyr'`, webpack will **also inline plyr's code into `bulk-mp3-file.min.js`**. This is redundant (the class will be defined twice at runtime) and wastes bytes.

**Fix (webpack externals approach):**
Update `webpack.mix.js` to add a webpack override that marks the plyr.js module as "external" for the bulk-mp3-file bundle:

```js
mix.js('Assets/js/plyr.js', 'Assets/js/build/plyr.min.js');
mix.js('Assets/js/bulk-mp3-file.js', 'Assets/js/build/bulk-mp3-file.min.js')
    .webpackConfig({
        externals: {
            './plyr': 'window.TextToSpeechProPlayer',
            './plyr.js': 'window.TextToSpeechProPlayer'
        }
    });
```

**Alternative (simpler):** Remove the `import './plyr';` line from `bulk-mp3-file.js` and rely entirely on the PHP enqueue order + the `document.addEventListener('DOMContentLoaded', ...)` wrapper in bulk-mp3-file.js to ensure `window.TextToSpeechProPlayer` is defined before `class BulkMP3File extends window.TextToSpeechProPlayer` is evaluated.

**Recommendation:** Use the **simpler alternative** — skip the `import` and drop the externals config. `wp_enqueue_script`'s dependency array (`[ 'tts-bulk-mp3-file', 'text-to-audio-plyr' ]`) guarantees plyr.min.js is loaded and parsed before bulk-mp3-file.min.js starts, so `window.TextToSpeechProPlayer` will exist by the time bulk's top-level code runs.

Apply this tweak to the new `bulk-mp3-file.js` content shown in Phase 2: **remove the `import './plyr';` line and its comment block.**

### Step 3.2 — Build commands to run after changes

```bash
cd D:/xampp/htdocs/azizulhasan/tts/wp-content/plugins/text-to-audio-pro
npm run production   # or: npm run dev for debug build
```

Verify build succeeds and both `Assets/js/build/plyr.min.js` and `Assets/js/build/bulk-mp3-file.min.js` are produced.

### Step 3.3 — Enqueue verification

Open the bulk MP3 generation page and view the page source / network tab. Expected script load order:

1. `wp-hooks`
2. `wp-components`
3. `tts-bulk-mp3-file-ui.min.js` (handle: `tts-bulk-mp3-file`)
4. `plyr.lib.min.js` (handle: `text-to-audio-plyr-lib`)
5. `plyr.min.js` (handle: `text-to-audio-plyr`)
6. `bulk-mp3-file.min.js` (handle: `text-to-audio-bulk-mp3`)

---

## Phase 4 — Test Matrix

After implementation, verify these scenarios manually:

| # | Scenario | File path tested | Expected |
|---|---|---|---|
| 1 | **Single-post MP3 on front-end** (plyr.js path) — visit a post with the player, click Listen | plyr.js (no subclass involved) | Audio generates and plays in Plyr UI. No regressions. |
| 2 | **Single-post MP3 with WPML active** | plyr.js + TTSCompatibality.sitepress | Correct language detected. |
| 3 | **Single-post MP3 with GTranslate active** | plyr.js + `#gtranslateCompitable` | Polls for translation, then generates. |
| 4 | **Single-post MP3 with Polylang active** | plyr.js + TTSCompatibality.polylang | Correct language detected. |
| 5 | **Bulk MP3 — 5 posts, player_id=3 (gTTS)** | bulk-mp3-file.js → parent.init_gtts | Progress counter increments 1→5. All files URL'd. |
| 6 | **Bulk MP3 — 5 posts, player_id=4 (Google Cloud TTS)** | bulk-mp3-file.js → parent.init_gctts | Same as above. |
| 7 | **Bulk MP3 — 5 posts, player_id=5 (ChatGPT TTS)** | bulk-mp3-file.js → parent.init_chat_gpt | Same as above. |
| 8 | **Bulk regeneration** — existing MP3s, `tts_regenerate_mp3_files=true` | bulk path + `is_regenerate_file` guard in `#setMP3FileURL` | `fileURL` forced empty; generation re-runs; new URLs returned. |
| 9 | **Bulk with a post that already has MP3** | bulk path + plyr's "already has fileURL" early-return | Counter increments but no API call; existing URL reported. |
| 10 | **Locked file retry** — simulate backend returning `{message: 'locked'}` | plyr's `mp3FileGenerateLocked` setTimeout path | Retries after 10s, eventually succeeds. |
| 11 | **Bulk with analytics unavailable** (expected on admin page) | Edit 1.6 G/H/I/J null guards | No TypeError. Generation completes. |
| 12 | **Browser console — no errors** on bulk page load | All phases | Clean console. |
| 13 | **Browser console — `window.TextToSpeechProPlayer` defined** on bulk page | Phase 1.1 (class hoist) + enqueue order | `typeof window.TextToSpeechProPlayer === 'function'` |
| 14 | **Browser console — `BulkMP3File.prototype instanceof TextToSpeechProPlayer`** | Phase 2 subclass | `true` |

---

## Phase 5 — Rollback Plan

If anything breaks:

1. **Git revert** the commit on the release branch.
2. **Rebuild:** `npm run production` in the pro plugin directory.
3. **Cache bust:** increment `TTA_PRO_VERSION` in `TTA_Pro_Constants.php` so customers receive the old bundles (not cached by CDN / caching plugins).
4. The enqueue handle rename (`text-to-audio-plyr` → `text-to-audio-bulk-mp3`) is the only non-reversible thing from a customer-cache perspective, but reverting the PHP file also reverts the handle.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Breaking front-end single-post MP3 generation** (used by every plugin customer) | Keep plyr.js changes minimal and surgical — class hoist is mechanical; `options` parameter defaults to `{}` so no existing caller needs updates; `is_regenerate_file` check only fires when the flag is truthy (not set in single-post mode); analytics null-guards are strict improvements |
| **Script load order regression** — if a caching plugin reorders scripts, `window.TextToSpeechProPlayer` might be undefined when bulk-mp3-file.js parses | Enqueue dependency chain (`[ ..., 'text-to-audio-plyr' ]`) is respected by WP core and all major caching plugins. As a belt-and-suspenders, the `document.addEventListener('DOMContentLoaded', ...)` wrapper in bulk-mp3-file.js ensures the `class BulkMP3File extends window.TextToSpeechProPlayer` line doesn't evaluate until DOM ready — by which point plyr.min.js has fully parsed. |
| **Webpack inlining plyr.js twice** if we use `import './plyr'` | Dropped the `import './plyr'` line per Phase 3.1 recommendation. Rely on enqueue order instead. |
| **`#ttsLoader` is private and shown by parent** — but bulk page has no `#player_content_1` DOM element for it to append to | Parent's `#ttsLoader` calls `document.getElementById('player_content_' + this.buttonId)` and then `.append()`. If the element doesn't exist, `.append` on `null` → TypeError. **MITIGATION:** either add a null check in parent's `#ttsLoader` (one-line fix) OR add a `skipLoader` option to constructor and gate all `this.#ttsLoader()` calls. **Recommended:** add the null check in parent's `#ttsLoader` — cleaner and fixes a latent bug for the unlikely case where the player div is missing from a post template. |
| **`#hideLoader` — same issue** | Same fix: null-guard `document.getElementById('tts_pro_loader_' + this.buttonId)` before calling `.remove()`. (Actually already null-guarded per line 1461 of plyr.js — verify during implementation.) |
| **The plyr constructor's `NoSleep` block runs on mobile** (line 53–59) | Still runs in bulk mode because admin might be mobile. Harmless — `NoSleep` is a no-op if the page never plays audio. Leave unchanged. |
| **Dead code: `gtranslateCompitable` method in bulk (public, never called)** | Deleted entirely in Phase 2. |

---

## Additional Edit Required — `#ttsLoader` null-safety

Adding this to Phase 1 as **Change 1.7**:

### Change 1.7 — Null-guard `#ttsLoader` DOM lookup

**Location:** Line 1476 of plyr.js (inside `#ttsLoader()` method)

**Why:** Parent's `init_gtts` / `init_gctts` / `init_chat_gpt` / `init_elevenlabs` all call `this.#ttsLoader()` unconditionally. In bulk mode there is no `#player_content_1` DOM element, so `document.getElementById('player_content_' + this.buttonId)` returns `null`, and the subsequent `player.append(loader)` call crashes.

#### Edit K — Inside `#ttsLoader`

```js
// BEFORE:
#ttsLoader() {
    if (this.isLoaderActive) { return; }
    if (!this.isLoaderActive) { this.isLoaderActive = true; }

    let player = document.getElementById('player_content_' + this.buttonId);
    let loader = document.createElement('div');
    // ...
    player.append(loader);   // ← crashes if player is null
    // ...
}

// AFTER:
#ttsLoader() {
    if (this.isLoaderActive) { return; }

    let player = document.getElementById('player_content_' + this.buttonId);
    if ( ! player ) {
        // No player element on this page (e.g. admin bulk generation context).
        // Silently skip loader rendering — caller still proceeds with generation.
        return;
    }
    this.isLoaderActive = true;

    let loader = document.createElement('div');
    // ... (UNCHANGED) ...
    player.append(loader);
    // ...
}
```

Only the 5 lines at the top of the method body change. Rest is untouched.

---

## Final Diff Summary

### Files changed

| File | Lines changed | Lines deleted | Net |
|---|---|---|---|
| `text-to-audio-pro/Assets/js/plyr.js` | ~45 lines | 4 lines | +41 |
| `text-to-audio-pro/Assets/js/bulk-mp3-file.js` | 80 lines (new) | 680 lines | **−600** |
| `text-to-audio-pro/Includes/TTA_Pro_Actions.php` | ~8 lines | 0 | +8 |
| `text-to-audio-pro/webpack.mix.js` | 0 | 0 | 0 |

**Total net reduction: ~550 lines of code.**

### Files NOT changed

- `text-to-audio/src/dashboard/bulk-mp3-file/generate-bulk-mp3-file.js` — the React component already calls `new BulkMP3File(postSettings)` and `.init_gtts(1)` / `.init_gctts(1)` / `.init_chat_gpt(1)` — all of which will continue to work identically because the method signatures are unchanged.
- `text-to-audio/src/dashboard/bulk-mp3-file-ui.js` — entry point, no changes needed.
- `text-to-audio-pro/Api/TTA_Pro_Api_Routes.php` — `get_bulk_post_content` response format unchanged.
- Any other JS file.

---

## Implementation Order (when executing)

1. ✅ **Branch:** create `feature/TTS-refactor-bulk-mp3-inherit-plyr` off `develop` via `git flow feature start`
2. ✅ **Phase 1** — edit `plyr.js` (Changes 1.1 through 1.7). Verify single-post MP3 still works in a browser.
3. ✅ **Phase 2** — replace `bulk-mp3-file.js` with the slim version.
4. ✅ **Phase 3** — update `TTA_Pro_Actions.php` `enqueue_generate_bulk_mp3_file()`.
5. ✅ **Build:** `npm run production` inside pro plugin directory.
6. ✅ **Phase 4** — run test matrix (at minimum scenarios 1, 5, 6, 8, 11, 12, 13, 14).
7. ✅ **Commit:** per project memory — use version-only commit message if it's part of a release, otherwise descriptive but single-line.
8. ✅ **Merge** via `git flow feature finish` after review.

---

## Open Questions Before Execution

1. **Do you want me to also remove the `gtranslateCompitable` method from bulk?** (It's currently public but never called — pure dead code from the copy-paste era.) → **Yes**, planned for Phase 2.
2. **Should the handle rename `text-to-audio-plyr` → `text-to-audio-bulk-mp3` happen now?** It's cleaner but it's a handle change. → Yes, recommended. It fixes the misleading handle name.
3. **Version bump?** This refactor is structural — no user-facing behavior change. A patch bump (e.g. 3.2.2) is fine.

---

**End of plan.**
