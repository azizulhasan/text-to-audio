# Future: Multilingual Architecture Refactor

**Status:** Planned (not yet scheduled)
**Date:** 2026-03-29
**Depends on:** TTS-231 (Polylang) should be done first using existing pattern

---

## 1. Problem

Every new multilingual plugin requires editing **8+ files** across both free and pro plugins. The current architecture has:

- `#thirdPartyPluginCompatible()` copy-pasted in 3 JS files (TextToSpeechPro.js, plyr.js, bulk-mp3-file.js) with slightly different signatures
- `getSelectedLanguage()` nearly identical in TTSWPML.js, TranslatePress.js, TTSPolylang.js
- Language detection duplicated between PHP (`get_site_language()`) and JS (`getSelectedLanguage()`)
- Adding each new plugin grows the `else if` chain in all files

---

## 2. Proposed Changes

### A. Centralize `#thirdPartyPluginCompatible()` into `TTSCompatibality.js`

**Current:** Each player file has its own `#thirdPartyPluginCompatible()` with plugin-specific `else if` chains.

**Proposed:** Move language resolution into `TTSCompatibality`:

```javascript
// TTSCompatibality.js
getSelectedLanguage(selectedLang, playerInstance = null) {
    for (const [key, plugin] of Object.entries(this.initiatedPlugins)) {
        if (plugin?.getSelectedLanguage) {
            return plugin.getSelectedLanguage(selectedLang, playerInstance);
        }
    }
    return selectedLang;
}
```

Then all 3 player files become a single line:
```javascript
this.selectedLang = this.compatible.getSelectedLanguage(this.selectedLang, this);
```

**Impact:** New multilingual plugins require 0 changes to player files.

### B. Filter-Based Server-Side Language Detection

**Current:** `get_site_language()` has hardcoded `if/else` for each plugin (GTranslate cookie, WPML constant, Polylang API).

**Proposed:** Each plugin registers its own detection via WordPress filter:

```php
// In TTA_Helper.php — simplified core
public static function get_site_language() {
    $current_lang = get_locale();
    return apply_filters( 'tts_detect_current_language', $current_lang );
}
```

Each plugin hooks in with priority ordering:
```php
// Polylang detection (could live in a separate compatibility class)
add_filter( 'tts_detect_current_language', function( $lang ) {
    if ( function_exists( 'pll_current_language' ) ) {
        $pll_lang = pll_current_language( 'slug' );
        return $pll_lang ? $pll_lang : $lang;
    }
    return $lang;
}, 10 );

// WPML detection
add_filter( 'tts_detect_current_language', function( $lang ) {
    if ( defined( 'ICL_LANGUAGE_CODE' ) ) {
        return ICL_LANGUAGE_CODE;
    }
    return $lang;
}, 10 );

// GTranslate detection
add_filter( 'tts_detect_current_language', function( $lang ) {
    if ( isset( $_COOKIE['googtrans'] ) ) {
        $parts = explode( '/', $_COOKIE['googtrans'] );
        return isset( $parts[2] ) ? $parts[2] : ( isset( $parts[1] ) ? $parts[1] : $lang );
    }
    return $lang;
}, 10 );
```

**Impact:** New multilingual plugins can register detection without touching core files. Third-party developers can also hook in.

### C. Pass Detected Language from PHP to JS

**Current:** Server detects language, JS detects language again independently.

**Proposed:** Pass `ttsObjPro.current_language` from PHP, JS uses it as primary source:

```php
// In wp_localize_script
'current_language' => TTA_Pro_Helper::get_site_language(),
```

```javascript
// In TTSCompatibality or player files
getSelectedLanguage(selectedLang) {
    // Primary: use server-detected language
    if (ttsObjPro?.current_language) {
        return ttsObjPro.current_language;
    }
    // Fallback: client-side detection (for GTranslate which changes lang without reload)
    return this.detectLanguageFromDOM(selectedLang);
}
```

**Impact:** Eliminates most client-side language detection duplication. Client-side detection only needed for plugins that switch language without page reload (GTranslate).

---

## 3. Files Affected

| File | Change |
|------|--------|
| `text-to-audio-pro/Assets/js/compatibality/TTSCompabality.js` | Add centralized `getSelectedLanguage()` method |
| `text-to-audio-pro/Assets/js/TextToSpeechPro.js` | Replace `#thirdPartyPluginCompatible()` with single call |
| `text-to-audio-pro/Assets/js/plyr.js` | Replace `#thirdPartyPluginCompatible()` with single call |
| `text-to-audio-pro/Assets/js/bulk-mp3-file.js` | Replace `#thirdPartyPluginCompatible()` with single call |
| `text-to-audio-pro/Includes/TTA_Pro_Helper.php` | Refactor `get_site_language()` to filter-based |
| `text-to-audio/includes/TTA_Helper.php` | Refactor `get_compatible_plugins_data()`, add filter hooks |
| `text-to-audio-pro/Includes/TTA_Pro_Actions.php` | Pass `current_language` in localized script |

---

## 4. Migration Notes

- Must be backwards compatible with existing saved settings
- GTranslate needs special handling (client-side language switching without page reload)
- All existing handler classes (TTSWPML, TTSGtranslate, TranslatePress, TTSPolylang) continue working
- The refactor simplifies adding future plugins but doesn't break existing ones
