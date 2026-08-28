# TTS-289 — GTranslate: the player reads source-language text in the translated voice

Reported by a customer on **essentialfoodhygiene.co.uk** (Free 2.3.1 / Pro 3.4.1, GTranslate, player 2
"Default Pro"): after switching the site to a non-English language the player still reads the English
text. The **voice** part of that report was already fixed; the **content** part was not.

**Reproduced locally on 2026-08-28 against the current release code — Free 2.3.11 / Pro 3.4.8,
GTranslate 3.1.1 free, player 2, `http://localhost/tts/tts-280-yvonne-style/`. This is a live bug in
the latest version, not something the customer's old version alone.**

Pro-only. The Free plugin needs no change.

---

## Symptom

Switch the page to French with the GTranslate float switcher:

| | value after the switch |
|---|---|
| `<html>` | `lang="fr" class="translated-ltr"` |
| visible page text | fully French |
| `TTS.settings.listening.tta__listening_lang` | `fr-FR` ✅ |
| `TTS.settings.listening.tta__listening_voice` | `Google français` ✅ |
| `window.TTS.contents[1]` | **the original English text** ❌ |
| `sessionStorage.tts_pro_stored_content.translations.fr` | **the original English text** ❌ |

So a French voice reads English words. Language and voice resolution are fine — only the content is
wrong.

---

## Root cause

Five defects compound. The first is the trigger; the rest are what make it permanent.

### 1. The readiness test trusts a marker instead of the content

`TTSGtranslate.#waitForBodyTranslation()` had a 2-second fallback that fired when no DOM mutation had
been observed yet, and it only re-checked `#isHtmlTranslatedToLang()` — an `<html lang>` / `translated-ltr`
test.

GTranslate stamps those attributes **the instant you click**, then fetches the translation over the
network. Measured locally, the actual text swap took **5-8 seconds**. So at t=2s the marker says "done",
the DOM is still English, and `#captureTranslatedContent()` captures English.

This is the class of bug the ticket is really about: *every* translation integration announces "done"
before the DOM is done, so a marker can never be the readiness signal.

### 2. The bad capture is persisted as the translation

`#captureTranslatedContent()` → `setTranslatedContent()` writes the English text into
`sessionStorage.tts_pro_stored_content.translations.fr`. Verified in the browser: that key literally
contained English sentences.

### 3. Nothing re-captures afterwards

`#translateToCurrentLanguage()` returns the cached `translations[options.to]` on every later load.
`#clearStoredTranslation()` only runs on a *fresh* switcher click, so the poisoned entry survives
reloads and navigation for the whole session.

### 4. The `translations` spread put the new value first

```js
translations: { [language]: content, ...storedContentObj?.translations }
```

An existing (bad) entry silently overwrites the new one, so even a correct later capture could not fix
a poisoned entry.

### 5. The capture never read the live DOM

`#getGtranslateContentFromDOM()` passes `this.textToSpeechPro.content` — the text extracted in the
player constructor, at page load, in the source language — into `getContent()`. With
`get_content_from_dom` **off**, `getContent()` early-returns that value, so the "translated" capture is
the original text *regardless of timing*. That path could never have worked.

### Why the forced reload made it worse

`#captureTranslatedContent()` ends with `window.location.reload()` on the free (non-pro/enterprise)
path. Confirmed via `performance.getEntriesByType('navigation')[0].type === "reload"`. After the reload
PHP re-renders English, and the poisoned `fr` entry is read straight back.

### Why player 2 has no second chance

`TextToSpeechPro.js` builds `this.content` synchronously in the constructor and only asks GTranslate for
`getSelectedLanguage()`. `plyr.js` (players 3-6) polls `isTranslatedContent()` in `#gtranslateCompitable()`
before initialising, so a late translation still gets picked up there. On player 2 it never does.

---

## The fix

Two principles:

1. **Readiness is measured on the content, never on the plugin's own marker.**
2. **The cache writer refuses to store a "translation" identical to the source** — so even if a
   subclass's timing logic is wrong, the bug cannot become permanent for *any* translation plugin.

The mechanism goes in the base class `CompitableUtils`, not in `TTSGtranslate`, so WPML, Polylang and
TranslatePress inherit it. The guard goes on the single writer `updateTranslatedContent()`, which both
`setTranslatedContent()` and `getContent()` route through.

### `Assets/js/compatibality/CompitableUtils.js`

```js
import { updateTranslatedContent } from '../TTSProHelper'

export default class CompitableUtils {
    // TTS-289: raw wrapper text as it stood BEFORE any translation ran.
    domBaseline = null

    constructor(textToSpeechPro) {
        // ...existing...
        // Snapshot immediately: every integration is constructed at page load,
        // before the user can switch language.
        this.captureDomBaseline();
    }

    getButtonId() {
        return this.textToSpeechPro?.buttonId ?? this.textToSpeechPro?.thisClass?.buttonId;
    }

    baseLanguage(code) {
        return String(code || '').split(/[-_]/)[0].toLowerCase();
    }

    normalizeForCompare(text) {
        return String(text || '').replace(/\s+/g, ' ').trim();
    }

    /**
     * TTS-289: live text of this button's content wrapper.
     * Raw on purpose — used only to DETECT that the page changed, never as the
     * content handed to the player. Comparing against the player's own
     * `content` would be wrong: that has already been through aliases,
     * intro/outro and delimiter cleaning.
     */
    readWrapperText() {
        let wrapper = document.querySelector('.tts_content_wrapper_' + this.getButtonId())
            || document.querySelector('.tts_content_wrapper')
            || document.body;

        return wrapper ? this.normalizeForCompare(wrapper.innerText || wrapper.textContent) : '';
    }

    captureDomBaseline() {
        if (this.domBaseline === null) {
            this.domBaseline = this.readWrapperText();
        }
        return this.domBaseline;
    }

    /**
     * TTS-289: resolve only once the page text has actually reached the state
     * the target language implies, and has stopped changing.
     *
     * Every translation plugin flips its own "done" marker before the text is
     * replaced — GTranslate stamps <html lang> + translated-ltr the instant you
     * click, then fetches the translation over the network. Trusting that
     * marker captured the SOURCE text and cached it as the translation.
     * Content is the only signal that cannot lie.
     *
     * Switching to a foreign language must make the text DIFFER from the
     * baseline; switching back to the source language must make it MATCH the
     * baseline again.
     *
     * @returns {Promise<boolean>} false on timeout — callers MUST NOT capture.
     */
    waitForTranslatedDom(targetLang, sourceLang, { timeoutMs = 20000, pollMs = 250, settleMs = 700 } = {}) {
        const baseline = this.captureDomBaseline();
        const expectChange = this.baseLanguage(targetLang) !== this.baseLanguage(sourceLang);

        return new Promise((resolve) => {
            if (!baseline) {
                resolve(false);
                return;
            }

            let lastText = null;
            let stableSince = 0;
            let timer = null;
            const startedAt = performance.now();

            const tick = () => {
                const now = performance.now();
                const current = this.readWrapperText();
                const reached = expectChange ? (current && current !== baseline) : (current === baseline);

                if (reached && current === lastText) {
                    if (!stableSince) {
                        stableSince = now;
                    }
                    if (now - stableSince >= settleMs) {
                        clearInterval(timer);
                        resolve(true);
                        return;
                    }
                } else {
                    stableSince = 0;
                }

                lastText = current;

                if (now - startedAt >= timeoutMs) {
                    clearInterval(timer);
                    resolve(false);
                }
            };

            timer = setInterval(tick, pollMs);
            tick();
        });
    }

    setTranslatedContent(content, language) {
        // TTS-289: one writer, one guard — see updateTranslatedContent().
        updateTranslatedContent(content, language);

        this.storedContent = this.getStoredContentObj()?.content;

        return this.storedContent;
    }
}
```

### `Assets/js/TTSProHelper.js`

```js
/**
 * TTS-289: the ONE place a translation is written to the session cache.
 *
 * Refuses to store text identical to the source content. A mistimed capture
 * used to be cached forever as e.g. the French entry, so the player read
 * English in a French voice on every later page load and nothing re-captured
 * it. Guarding the writer makes that impossible for GTranslate, WPML,
 * Polylang and TranslatePress alike, whatever a subclass gets wrong.
 *
 * @returns {boolean} Whether the translation was stored.
 */
export const updateTranslatedContent = (content, language) => {
    let storedContentObj = JSON.parse(window.sessionStorage.getItem('tts_pro_stored_content'));

    if (!content || !language) {
        return false;
    }

    const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim();
    const baseLang = (code) => String(code || '').split(/[-_]/)[0].toLowerCase();

    // Storing the source text under the SOURCE language is legitimate — that is
    // the "switched back to the original language" case, and it is how WPML,
    // Polylang and TranslatePress work on every page (they serve translated
    // HTML from the server, so their content IS the source of its own page).
    const isSourceLanguage = storedContentObj?.language
        && baseLang(storedContentObj.language) === baseLang(language);

    if (!isSourceLanguage && normalize(content) === normalize(storedContentObj?.content)) {
        console.warn('[TTS] Refused to cache untranslated text as the "' + language + '" translation.');
        return false;
    }

    window.sessionStorage.setItem('tts_pro_stored_content', JSON.stringify({
        content: storedContentObj?.content,
        language: storedContentObj?.language,
        url: window.location.href,
        // TTS-289: keep the fingerprint. Dropping it made getStoredContent()
        // see settingsChanged on the next load and wipe the whole cache,
        // translations included.
        contentSettings: storedContentObj?.contentSettings,
        translations: {
            ...storedContentObj?.translations,
            // TTS-289: new value LAST. The spread used to come second, so an
            // existing (bad) entry silently won and could never be corrected.
            [language]: content,
        }
    }));

    return true;
}
```

### `Assets/js/compatibality/plugins/TTSGtranslate.js`

```js
    /**
     * TTS-289: wait for the CONTENT to change, not for GTranslate's marker.
     *
     * GTranslate stamps <html lang> + translated-ltr the moment you click, then
     * fetches the translation over the network — 5-8s on a normal connection.
     * The old 2s "capture anyway" fallback only re-checked that marker, so it
     * captured the still-English DOM and cached it as the translation.
     */
    #waitForBodyTranslation(options, lang, shouldReload = false) {
        this.waitForTranslatedDom(options.to, this.defaultLang).then((reached) => {
            if (!reached) {
                // The page never actually changed. Capturing here is exactly what
                // produced "French voice reading English", and reloading would
                // repeat it on every load — so do neither.
                console.warn('[TTS] GTranslate did not finish translating in time; skipping capture.');
                return;
            }

            this.#captureTranslatedContent(options, lang, shouldReload);
        });
    }

    #getGtranslateContentFromDOM() {
        let buttonId = this.getButtonId();

        // TTS-289: read the LIVE DOM. Passing the player's own `content` fed
        // getContent() the text captured at page load — the source language —
        // so with "get content from DOM" off the capture was ALWAYS the
        // original text, whatever the timing.
        let content = this.#readTranslatedDOMContent() || this.textToSpeechPro?.content;

        content = getContent(content, window.TTS, buttonId, this.selectedLang, 'getGtranslateContentFromDOM');

        return content || null;
    }
```

and in `#captureTranslatedContent()`:

```js
            // TTS-289: player 2 reads window.TTS.contents at play time, so the
            // capture above is already live. Reloading only throws the page away
            // and re-runs the whole race. The reload stays for the MP3 players,
            // which need per-language file URLs from PHP.
            if (shouldReload
                && ttsObjPro.player_id != 2
                && !config?.pro_version
                && !config?.enterprise_version) {
                window.location.reload();
            }
```

`#observeHtmlForTranslation()` keeps its `<html>` observer — it is still the right trigger for
*starting* to wait; only the readiness test changes.

### Rebuild

`npm run production` in `text-to-audio-pro` — `TextToSpeechPro.min.js`, `plyr.min.js` and
`bulk-mp3-file.min.js` all bundle `TTSProHelper` and the compat classes.

---

## Scope: GTranslate now, the other three after

GTranslate is the only integration that translates **in the DOM**; WPML, Polylang and TranslatePress
serve translated HTML from the server on a per-language URL, so PHP already hands us the right text and
there is no race. They are therefore not expected to show this bug — but that is an expectation, not a
tested fact, and the shared guard now sits in their write path too.

Follow-ups, to be done one at a time on the user's direction:

- **TranslatePress** — do first. It has a no-reload AJAX language switch mode, which is the closest
  thing to GTranslate's in-DOM behaviour and the most likely to hit the same race.
- **WPML** — verify with the language switcher in both directory and query-string URL modes.
- **Polylang** — verify, including the "same page, different language" permalink mode.

For each: switch language, then check that `window.TTS.contents[buttonId]` and
`sessionStorage.tts_pro_stored_content.translations[<lang>]` both hold the *translated* text, and that
the console warning from `updateTranslatedContent()` never fires.

---

## Regression checks

1. Player 2 + GTranslate free, switch EN → FR: content, language and voice all French.
2. Switch FR → EN again: content back to English, no console warning, page still works.
3. Players 3-6 + GTranslate: MP3 still generated per language, reload still happens.
4. GTranslate paid (`pro_version` / `enterprise_version`, `/fr/` URLs): unchanged behaviour, no reload.
5. `get_content_from_dom` **off** + GTranslate: capture now returns translated text (this never worked
   before).
6. No translation plugin active at all: no baseline polling side effects, no console noise.
