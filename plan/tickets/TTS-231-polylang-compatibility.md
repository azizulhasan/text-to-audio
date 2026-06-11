# TTS-231: Polylang Multilingual Plugin Compatibility

**Branch:** `feature/TTS-231`
**Date:** 2026-03-29
**Status:** Planning

---

## 1. Objective

Add Polylang (`polylang/polylang.php`) as a compatible multilingual plugin for the AtlasVoice Text-to-Audio plugin, following the exact same integration pattern used for WPML, GTranslate, and TranslatePress.

---

## 2. How Polylang Works (Key Differences)

| Feature | GTranslate | WPML / Polylang |
|---------|------------|-----------------|
| Translation method | Client-side Google Translate API | Server-side separate posts per language |
| Content storage | Single post, translated on-the-fly | Separate post per language, linked via taxonomy |
| Language detection | Cookie (`googtrans`) | URL structure or `pll_current_language()` API |
| Client-side translation needed? | Yes | No (content already translated) |
| Voice/language mapping needed? | Yes | Yes |

**Polylang stores languages using:**
- `language` taxonomy — assigns a language to each post
- `post_translations` taxonomy — links translated posts together (serialized `lang => post_id` array)

**Polylang API functions we will use:**
- `pll_languages_list()` — get all active languages (returns `PLL_Language` objects with `->slug`, `->name`, `->locale`)
- `pll_current_language('slug')` — get current language on frontend
- `function_exists('pll_current_language')` — detect if Polylang is active

**Polylang URL patterns (language detection):**
- Directory: `example.com/fr/post-slug/`
- Subdomain: `fr.example.com/post-slug/`
- Query param: `example.com/post-slug/?lang=fr`
- `<html lang="fr-FR">` attribute is always set

---

## 3. Architecture: How `#thirdPartyPluginCompatible()` Works

The multilingual compatibility system has **3 layers** that all need Polylang support:

### Layer 1: PHP Backend — Plugin Detection + Language Detection
- `TTA_Helper::get_compatible_plugins_data()` detects active multilingual plugins and passes config to JS via `wp_localize_script` as `ttsObjPro.compatible`
- `TTA_Pro_Helper::get_site_language()` detects the current site language server-side (used for MP3 file URL key + voice mapping)

### Layer 2: JS Frontend — `#thirdPartyPluginCompatible()` method
This method exists in **3 separate JS player files**, each with slightly different signatures:

| File | Constructor arg to `TTSCompatibality` | `getSelectedLanguage()` call pattern |
|------|--------------------------------------|--------------------------------------|
| `TextToSpeechPro.js` (Player ID < 3) | `this` (TextToSpeechPro instance) | `.getSelectedLanguage(window.TTS.settings.listening.tta__listening_lang)` |
| `plyr.js` (Player ID 3-6) | `{content, thisClass: this}` | `.getSelectedLanguage(this.selectedLang, this)` |
| `bulk-mp3-file.js` (Bulk MP3) | `{content, thisClass: this}` | `.getSelectedLanguage(this.selectedLang, this)` |

After calling `getSelectedLanguage()`, all three files:
1. Set `this.selectedLang` from the result
2. Set `this.TTS.extra[this.buttonId].language = this.selectedLang`
3. `plyr.js` also sets `this.TTS.extra[this.buttonId].file_url_key` for MP3 lookup

### Layer 3: React Dashboard — Language Mapping UI
- `Listening.js` reads `ttsObjPro.compatible` to detect active multilingual plugins
- Shows "Plugin Language Mapping" section where users map each site language to a TTS language + voice
- Saves to `tta__multilingualActiveLanguages`, `tta__currentPlayerLanguages`, `tta__available_currentPlayerVoices`

---

## 4. Implementation Steps

### Step 1: PHP — Register Polylang in Compatible Plugins (Free Plugin)

**File:** `text-to-audio/includes/TTA_Helper.php`
**Method:** `get_compatible_plugins_data()` (line ~283)

**What to do:**
1. Before the `$datas` array, detect Polylang languages:
```php
// Polylang multilingual plugin.
$polylang_languages = array();
if ( function_exists( 'pll_languages_list' ) ) {
    $pll_langs = pll_languages_list( array( 'fields' => '' ) );
    if ( is_array( $pll_langs ) ) {
        foreach ( $pll_langs as $lang ) {
            $polylang_languages[ $lang->slug ] = array(
                'english_name' => $lang->name,
                'locale'       => $lang->locale,
            );
        }
    }
}
```

2. Add Polylang entry to the `$datas` array (after TranslatePress entry, before the closing `]`):
```php
'polylang/polylang.php' => array(
    'type'             => 'class',
    'data'             => array(),
    'plugin'           => 'polylang',
    'active_languages' => $polylang_languages,
),
```

**Why this works:** The existing loop at line 320 already checks `is_plugin_active($plugin_name)` — so this entry will only be included when Polylang is active. The `active_languages` structure matches WPML's format (`slug => ['english_name' => ...]`) so the React UI can reuse the same rendering logic. Uses `array()` syntax for PHP 7.4 compatibility.

---

### Step 2: PHP — Add Polylang to Server-Side Language Detection (Pro Plugin)

**File:** `text-to-audio-pro/Includes/TTA_Pro_Helper.php`
**Method:** `get_site_language()` (line ~1163)

**What to do:** Add Polylang detection after the WPML `ICL_LANGUAGE_CODE` check (line ~1179):
```php
// Polylang language detection.
if ( function_exists( 'pll_current_language' ) ) {
    $pll_lang = pll_current_language( 'slug' );
    if ( $pll_lang ) {
        $current_lang = $pll_lang;
    }
}
```

**Why this is needed:** This method is called by `get_player_language_and_player_voice()` (line ~1186) to determine:
- The mapped TTS language/voice for the current post
- The MP3 file URL key (`language--voice--voiceName`) for serving pre-generated audio
- Without this, all Polylang pages would use the default language voice

---

### Step 3: JS — Create Polylang Frontend Handler (Pro Plugin)

**New File:** `text-to-audio-pro/Assets/js/compatibality/plugins/TTSPolylang.js`

**Pattern:** Follow `TTSWPML.js` structure + `TTSGtranslate.js` `getSelectedLanguage` signature.

The `getSelectedLanguage` method signature follows the `plyr.js` calling convention:
- `plyr.js` calls: `.getSelectedLanguage(this.selectedLang, this)` — passes player instance as 2nd arg
- `TextToSpeechPro.js` calls: `.getSelectedLanguage(window.TTS.settings.listening.tta__listening_lang)` — 1 arg only
- `bulk-mp3-file.js` calls: `.getSelectedLanguage(this.selectedLang, this)` — same as plyr.js

So the handler must accept `(selectedLang, textToSpeechMP3Player = {})` to handle all 3 callers.

```javascript
import CompitableUtils from '../CompitableUtils'

class TTSPolylang extends CompitableUtils {
    constructor(textToSpeechPro) {
        super(textToSpeechPro)
    }

    async translate(selector, currentContent = '') {
        let textToSpeechPro = this.textToSpeechPro;
        let defaultLang = this.getCountryCode(
            window.TTS.settings.listening.tta__listening_lang
        );
        let contentText = currentContent
            ? currentContent
            : textToSpeechPro?.storedContent;
        let selectedLang = this.getSelectedLanguage(
            window.TTS.settings.listening.tta__listening_lang
        );
        this.setTranslatedContent(contentText, selectedLang);

        if (ttsObjPro.player_id == 2) {
            await this.#setUpVoiceAndLang(contentText, { to: selectedLang });
        }
        // For player_id >= 3, server-side language detection handles it
    }

    async #setUpVoiceAndLang(contentText, options) {
        if (!contentText || !options?.to) {
            return;
        }
        let parent = this.textToSpeechPro || {};
        let lang = this.getLanguage(options);

        if (lang.isSupported && ttsObjPro.player_id == 2) {
            window.TTS.contents[parent.buttonId] = this.getStoredContent();
            let voice = parent.voice;
            parent.browser.setVoice(voice);
            window.TextToSpeechPro.browser = parent.browser;
            window.TTS.settings.listening.tta__listening_lang = lang.lang;
            window.TTS.settings.listening.tta__listening_voice = voice;
        }
    }

    /**
     * Detect current Polylang language.
     *
     * Called from 3 places with different signatures (following plyr.js pattern):
     * - TextToSpeechPro.js:  getSelectedLanguage(listeningLang)
     * - plyr.js:             getSelectedLanguage(this.selectedLang, this)
     * - bulk-mp3-file.js:    getSelectedLanguage(this.selectedLang, this)
     *
     * @param {string} selectedLang   Default/fallback language code
     * @param {object} textToSpeechMP3Player  Player instance (from plyr.js/bulk-mp3-file.js)
     * @returns {string} Detected language code
     */
    getSelectedLanguage(selectedLang = null, textToSpeechMP3Player = {}) {
        // Method 1: Check <html lang="xx-XX"> attribute (Polylang always sets this)
        let htmlLang = document.documentElement.lang;
        if (htmlLang) {
            let countryCode = htmlLang.split('-')[0].toLowerCase();

            if (ttsObjPro.player_id == 2 && this.browser) {
                if (this.browser?.validateCountryCode(countryCode)) {
                    return this.browser?.aliasCountryCode(countryCode, false);
                }
            } else if (ttsObjPro.player_id > 2) {
                let supportObj = this.isLanguageSupported(countryCode);
                if (supportObj.isSupported) {
                    return supportObj.lang;
                }
            }
        }

        // Method 2: Check URL path segment (e.g., /fr/post-slug/)
        let url = window.location.href;
        let pathAfterSite = url.replace(ttsObjPro.site_url, '');
        let countryCode = pathAfterSite.split('/').filter(Boolean)[0];

        if (countryCode) {
            if (ttsObjPro.player_id == 2 && this.browser) {
                if (this.browser?.validateCountryCode(countryCode)) {
                    return this.browser?.aliasCountryCode(countryCode, false);
                }
            } else if (ttsObjPro.player_id > 2) {
                let supportObj = this.isLanguageSupported(countryCode);
                if (supportObj.isSupported) {
                    return supportObj.lang;
                }
            }
        }

        // Method 3: Check ?lang= query parameter
        let urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('lang')) {
            let langParam = urlParams.get('lang');
            if (ttsObjPro.player_id == 2 && this.browser) {
                if (this.browser?.validateCountryCode(langParam)) {
                    return this.browser?.aliasCountryCode(langParam, false);
                }
            } else if (ttsObjPro.player_id > 2) {
                let supportObj = this.isLanguageSupported(langParam);
                if (supportObj.isSupported) {
                    return supportObj.lang;
                }
            }
        }

        // Fallback: use default language
        return this.getCountryCode(selectedLang);
    }
}

export default TTSPolylang;
```

**Key design decisions:**
- **No Google Translate API import** — Polylang content is already translated server-side
- **`<html lang>` as primary detection** — Polylang always sets this attribute, making it the most reliable method
- **URL path as secondary** — covers directory-based language URLs
- **Query param as tertiary** — covers `?lang=fr` URL format
- **Follows plyr.js calling convention** — `getSelectedLanguage(selectedLang = null, textToSpeechMP3Player = {})` matches the signature used by `TTSGtranslate.js` and handles all 3 caller patterns (TextToSpeechPro.js, plyr.js, bulk-mp3-file.js)
- **Same voice/language mapping logic** — reuses `getPlayerLanguageAndVoice()` from `CompitableUtils`

---

### Step 4: JS — Register Polylang Handler in Compatibility Coordinator (Pro Plugin)

**File:** `text-to-audio-pro/Assets/js/compatibality/TTSCompabality.js`

**What to do:**

1. Add import at top:
```javascript
import TTSPolylang from "./plugins/TTSPolylang";
```

2. Add to `#compatiblePlugins` map in constructor:
```javascript
'polylang': 'TTSPolylang',
```

3. Add initialization block in `#initPluginCompatibality()` (after TranslatePress block):
```javascript
if (ttsObjPro?.compatible?.hasOwnProperty('polylang/polylang.php')) {
    if (ttsObjPro.compatible['polylang/polylang.php'].type) {
        let polylang = new TTSPolylang(this.textToSpeechPro);
        this.initiatedPlugins['polylang'] = polylang;
        this.initiatedPlugins.polylang.translate(
            ttsObjPro.compatible['polylang/polylang.php']
        );
    }
}
```

---

### Step 5: JS — Add Polylang to `#thirdPartyPluginCompatible()` in TextToSpeechPro.js (Player ID < 3)

**File:** `text-to-audio-pro/Assets/js/TextToSpeechPro.js`
**Method:** `#thirdPartyPluginCompatible()` (line ~90)

**Existing pattern in this file** (1 arg, uses `window.TTS.settings.listening.tta__listening_lang`):
```javascript
// line 93: sitepress
this.selectedLang = this.compatible.initiatedPlugins.sitepress.getSelectedLanguage(window.TTS.settings.listening.tta__listening_lang);
// line 95: gtranslate
this.selectedLang = this.compatible.initiatedPlugins.gtranslate.getSelectedLanguage(window.TTS.settings.listening.tta__listening_lang);
// line 97: translatepress
this.selectedLang = this.compatible.initiatedPlugins.translatepress.getSelectedLanguage(window.TTS.settings.listening.tta__listening_lang);
```

Add after the TranslatePress check (~line 97):
```javascript
} else if (this.compatible?.initiatedPlugins?.polylang) {
    this.selectedLang = this.compatible.initiatedPlugins.polylang.getSelectedLanguage(
        window.TTS.settings.listening.tta__listening_lang
    );
}
```

---

### Step 6: JS — Add Polylang to `#thirdPartyPluginCompatible()` in plyr.js (Player ID 3-6)

**File:** `text-to-audio-pro/Assets/js/plyr.js`
**Method:** `#thirdPartyPluginCompatible()` (line ~315)

**Existing pattern in this file** (2 args: `this.selectedLang` + `this` player instance):
```javascript
// line 324: sitepress
this.selectedLang = this.compatible.initiatedPlugins.sitepress.getSelectedLanguage(this.selectedLang, this)
// line 326: gtranslate
this.selectedLang = this.compatible.initiatedPlugins.gtranslate.getSelectedLanguage(this.selectedLang, this)
// line 357: translatepress (only 1 arg)
this.selectedLang = this.compatible.initiatedPlugins.translatepress.getSelectedLanguage(this.selectedLang);
```

Add after the TranslatePress check (~line 357), **following the sitepress/gtranslate 2-arg pattern**:
```javascript
} else if (this.compatible?.initiatedPlugins?.polylang) {
    this.selectedLang = this.compatible.initiatedPlugins.polylang.getSelectedLanguage(this.selectedLang, this)
}
```

**Why 2 args:** `plyr.js` passes `this` (the `TextToSpeechProPlayer` instance) as second arg. This follows the same convention as sitepress and gtranslate in this file. The handler receives it as `textToSpeechMP3Player` and can use `textToSpeechMP3Player?.thisClass?.selectedLang` if needed (same as GTSGtranslate does).

---

### Step 7: JS — Add Polylang to `#thirdPartyPluginCompatible()` in bulk-mp3-file.js (Bulk MP3 Generation)

**File:** `text-to-audio-pro/Assets/js/bulk-mp3-file.js`
**Method:** `#thirdPartyPluginCompatible()` (line ~154)

**Existing pattern in this file** (same as plyr.js — 2 args):
```javascript
// line 163: sitepress
this.selectedLang = this.compatible.initiatedPlugins.sitepress.getSelectedLanguage(this.selectedLang, this)
// line 165: gtranslate
this.selectedLang = this.compatible.initiatedPlugins.gtranslate.getSelectedLanguage(this.selectedLang, this)
// line 167: translatepress (only 1 arg)
this.selectedLang = this.compatible.initiatedPlugins.translatepress.getSelectedLanguage(this.selectedLang);
```

Add after the TranslatePress check (~line 167), **following the sitepress/gtranslate 2-arg pattern**:
```javascript
} else if (this.compatible?.initiatedPlugins?.polylang) {
    this.selectedLang = this.compatible.initiatedPlugins.polylang.getSelectedLanguage(this.selectedLang, this)
}
```

---

### Step 8: React Dashboard — Add Polylang to Listening Language Mapping UI (Free Plugin)

**File:** `text-to-audio/src/dashboard/components/dashboard/listening/Listening.js`

**8a. Add Polylang language detection in `useEffect`** (after TranslatePress block, ~line 189):
```javascript
} else if (window?.ttsObjPro?.compatible?.["polylang/polylang.php"]) {
    let polylangActiveLanguages =
        ttsObjPro?.compatible?.["polylang/polylang.php"]?.active_languages;

    const languageObject = {};
    let active_languages = Object.keys(polylangActiveLanguages);

    for (const langCode of active_languages) {
        languageObject[langCode] =
            polylangActiveLanguages[langCode].english_name;
    }

    setMultilingualActiveLanguages(languageObject);

    setListeningSettings({
        ...listeningSettings,
        ...{ tta__listening_activeLanguages_mapping: languageObject },
    });
}
```

**8b. Add Polylang to `getActiveMultingualPluginName()`** (~line 583):
```javascript
} else if (window?.ttsObjPro?.compatible?.["polylang/polylang.php"]) {
    activePluginName = "Polylang";
}
```

**8c. Update tooltip text** (~line 1264) to include Polylang using `sprintf` placeholders:

First, add `sprintf` to the import from `@wordpress/i18n` (line ~12):
```javascript
import {__, sprintf} from "@wordpress/i18n";
```

Then replace the hardcoded plugin names with `sprintf` + `%s` placeholders (brand names are not translatable):
```javascript
{sprintf(
    /* translators: %1$s, %2$s, %3$s: plugin names (brand names, not translatable) */
    __("Language mapping for %1$s, %2$s, %3$s plugin is available in the pro version.", "text-to-audio"),
    "WPML",
    "GTranslate",
    "Polylang"
)}
```

This follows WordPress i18n best practices — brand names as placeholders so translators don't accidentally modify them.

**No new UI components needed** — the existing Language Mapping section renders dynamically based on `multilingualActiveLanguages` state and will automatically show Polylang languages with the voice/language mapping dropdowns.

---

## 5. Files Changed Summary

| # | File | Plugin | Action | Description |
|---|------|--------|--------|-------------|
| 1 | `includes/TTA_Helper.php` | Free | Edit | Register Polylang in `get_compatible_plugins_data()` |
| 2 | `Includes/TTA_Pro_Helper.php` | Pro | Edit | Add Polylang to `get_site_language()` |
| 3 | `Assets/js/compatibality/plugins/TTSPolylang.js` | Pro | **New** | Frontend language detection + voice setup handler |
| 4 | `Assets/js/compatibality/TTSCompabality.js` | Pro | Edit | Import and register TTSPolylang |
| 5 | `Assets/js/TextToSpeechPro.js` | Pro | Edit | Add Polylang to `#thirdPartyPluginCompatible()` |
| 6 | `Assets/js/plyr.js` | Pro | Edit | Add Polylang to `#thirdPartyPluginCompatible()` |
| 7 | `Assets/js/bulk-mp3-file.js` | Pro | Edit | Add Polylang to `#thirdPartyPluginCompatible()` |
| 8 | `src/dashboard/components/dashboard/listening/Listening.js` | Free | Edit | Add Polylang language detection + plugin name in UI |

---

## 6. Split Listening.js (1486 lines → ~250 lines + sub-components)

**Do this split BEFORE adding Polylang code** — so Polylang changes go into the new clean files.

### 6.1 Target Structure

```
src/dashboard/components/dashboard/listening/
  Listening.js                    (~250 lines - orchestrator, state, form handlers)
  LanguageMapping.js              (~215 lines - multilingual mapping UI)
  utils.js                        (~100 lines - helpers, flag map, tick generators)
  hooks/
    useVoiceLoader.js             (~225 lines - voice/language fetching per player)
    useMultilingualDetection.js   (~60 lines  - detect active multilingual plugin)
  tts-providers/
    DefaultPlayerSettings.js      (~200 lines - Player ID < 3: browser speech synthesis)
    GoogleCloudSettings.js        (~90 lines  - Player ID 3-4: AtlasVoice TTS / Google Cloud)
    ElevenLabsSettings.js         (~280 lines - Player ID 6: ElevenLabs)
    ChatGPTSettings.js            (move from chatgpt/ - Player ID 5: ChatGPT)
```

### 6.2 What Goes Where

| Source Lines | Content | Destination File |
|-------------|---------|-----------------|
| 588-627 | `getLanguageFlag()` | `utils.js` |
| 656-670 | `generateSpeedTicks()`, `generateVolumeTicks()` | `utils.js` |
| 131-190 | Multilingual plugin detection `useEffect` | `hooks/useMultilingualDetection.js` |
| 570-586 | `getActiveMultingualPluginName()` | `hooks/useMultilingualDetection.js` (as `activePluginName` state) |
| 192-398 | Voice/language loading functions | `hooks/useVoiceLoader.js` |
| 400-423 | Player-type loading `useEffect` | `hooks/useVoiceLoader.js` |
| 685-875 | Default player JSX (Player < 3) | `tts-providers/DefaultPlayerSettings.js` |
| 879-967 | AtlasVoice/Google Cloud JSX (Player 3-4) | `tts-providers/GoogleCloudSettings.js` |
| 984-1245 | ElevenLabs JSX (Player 6) | `tts-providers/ElevenLabsSettings.js` |
| chatgpt/ | ChatGPT settings (already extracted) | `tts-providers/ChatGPTSettings.js` (move) |
| 1252-1467 | Language Mapping section | `LanguageMapping.js` |
| Remaining | State, handlers, form, layout | `Listening.js` (slim orchestrator) |

### 6.3 Extraction Order

1. `utils.js` (pure functions, no dependencies)
2. `hooks/useMultilingualDetection.js`
3. `hooks/useVoiceLoader.js`
4. Move `chatgpt/ChatGPTSettings.js` → `tts-providers/ChatGPTSettings.js`
5. `tts-providers/DefaultPlayerSettings.js`
6. `tts-providers/GoogleCloudSettings.js`
7. `tts-providers/ElevenLabsSettings.js`
8. `LanguageMapping.js`
9. Slim `Listening.js` (replace extracted code with imports + component calls)
10. Delete empty `chatgpt/` directory

### 6.4 Props Pattern (same as existing ChatGPTSettings.js)

Each sub-component receives props from Listening.js:
```javascript
<ElevenLabsSettings
    listeningSettings={listeningSettings}
    currentPlayerLanguages={currentPlayerLanguages}
    elevenLabsVoices={elevenLabsVoices}
    handleChange={handleChange}
    baseMP3File={baseMP3File}
/>
```

Hooks return state:
```javascript
const { multilingualActiveLanguages, activePluginName } = useMultilingualDetection();
const {
    currentPlayerVoices, currentPlayerLanguages, currentPlayerFilteredVoices,
    speechSynthesisVoices, elevenLabsVoices, languageMissingMessage,
    setCurrentPlayerFilteredVoices, setGPTVoicesAndLanguages,
} = useVoiceLoader(customizationSettings);
```

### 6.5 Slim Listening.js Render

```jsx
<Form onSubmit={handleSubmit}>
    {playerId < 3 ? (
        <DefaultPlayerSettings ... />
    ) : playerId === 3 || playerId === 4 ? (
        <GoogleCloudSettings ... />
    ) : playerId === 5 ? (
        <ChatGPTSettings ... />
    ) : playerId === 6 ? (
        <ElevenLabsSettings ... />
    ) : null}

    <LanguageMapping ... />

    <Button type="submit">{__('Save', 'text-to-audio')}</Button>
</Form>
```

### 6.6 Post-Split Testing

- `npm run dev` — no build errors
- Test each player type in AtlasVoice > Listening
- Test multilingual mapping section (if active)
- Save settings, reload, verify persistence
- No JS console errors

---

## 7. Implementation Order

1. **Split Listening.js** (Section 6) — do this first so new files are clean
2. **Add Polylang to split files** (Steps 1-8) — Polylang code goes into the new structure:
   - Multilingual detection → `hooks/useMultilingualDetection.js`
   - Language mapping UI → `LanguageMapping.js`
   - Plugin name → `hooks/useMultilingualDetection.js`
   - Tooltip text → `LanguageMapping.js`

---

## 8. Build Steps

```bash
# Free plugin — rebuild React dashboard
cd text-to-audio
npm run production

# Pro plugin — rebuild JS bundles (whatever build system the pro plugin uses)
cd text-to-audio-pro
# (run pro plugin's JS build command)
```

---

## 9. Testing Plan

### 7.1 Prerequisites
- Activate Polylang plugin
- Add at least 2 languages in Polylang (e.g., English + French)
- Create a translated post (e.g., translate "Understanding Zakat" to French)

### 7.2 Admin Dashboard Tests
- [ ] Navigate to AtlasVoice > Listening Preferences
- [ ] Verify "Polylang Plugin Language Mapping" section appears
- [ ] Verify all Polylang languages are listed with correct names
- [ ] Verify language flag icons display correctly
- [ ] Map each Polylang language to a TTS language and voice
- [ ] Save settings and verify they persist on reload
- [ ] Verify no JS console errors

### 7.3 Frontend Tests — Browser TTS (Player ID < 3)
- [ ] Visit English version of a post — verify English voice speaks
- [ ] Visit French version (`/fr/post-slug/`) — verify French voice speaks
- [ ] Switch language via Polylang switcher — verify voice changes

### 7.4 Frontend Tests — Pro TTS Providers (Player ID 3-6)
- [ ] Google Cloud TTS: verify correct language/voice on translated post
- [ ] ChatGPT TTS: verify correct language on translated post
- [ ] ElevenLabs TTS: verify correct language/voice on translated post

### 7.5 Server-Side MP3 Generation Tests
- [ ] Generate MP3 for English post — verify correct language in filename key
- [ ] Generate MP3 for French post — verify French language in filename key
- [ ] Verify both MP3s are stored with correct `tts_mp3_file_urls` meta

### 7.6 Edge Cases
- [ ] Polylang active but no languages configured — no errors, no mapping section
- [ ] Polylang active alongside WPML — only one should be detected (first match wins)
- [ ] Post without a Polylang translation — falls back to default language/voice
- [ ] Polylang deactivated — mapping section disappears, no errors

---

## 10. Compatibility Notes

- **PHP 7.4+ compatible** — uses `array()` syntax instead of `[]` for PHP 7.4 compatibility
- **Polylang Free** and **Polylang Pro** both expose the same API functions (`pll_*`)
- **No conflict with existing integrations** — each plugin is detected via `is_plugin_active()` with its unique plugin file path
- **No new npm dependencies** — Polylang handler does not need `google-translate-api-browser`
- **Backwards compatible** — no changes to existing WPML/GTranslate/TranslatePress integrations
- **WordPress coding standards** — uses `function_exists()` checks before calling Polylang functions
