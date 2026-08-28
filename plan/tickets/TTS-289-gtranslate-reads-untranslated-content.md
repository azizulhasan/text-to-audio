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

Eight defects compound. Defect 6 is what actually fires on a free-GTranslate site; the others make it
permanent or would fire once it is fixed.

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


### 6. The urlLang fast path captured at page load. FOUND DURING IMPLEMENTATION

`gtranslate()` has a fast path that captures immediately when `#getLanguageFromUrl()` returns a
language. It was written for `pro_version` / `enterprise_version`, where GTranslate translates
server-side and the markup really is already translated. **TTS-258 widened
`#getLanguageFromUrl()` to every GTranslate variant**, and free GTranslate stamps `<html lang>` at
page load while the text swap arrives seconds later. Measured locally, this branch wrote the source
text into `translations.fr` **within ~1s of page load** — before any of the waiting logic ran, which
is why fixing the wait alone did not fix the bug.

The fast path now requires `#isDomAlreadyTranslated()`: true for pro/enterprise, and for free only
once Google's `<font>` markers are present.

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

---

## What changed during implementation

Testing on localhost turned up three things the plan did not anticipate. All are in the shipped
commit (`4832682f3` on `feature/TTS-289` in the Pro repo).

**A content diff alone is not enough.** Lazy-loaded widgets inside the wrapper (the Jetpack
subscribe form on the test post) mutate it after load and read as "the page changed", so the first
build captured untranslated text anyway. `waitForTranslatedDom()` now takes an optional `isReady`
predicate that must agree; `TTSGtranslate` supplies `#hasGoogleTranslatedText()`, which checks for
the `<font>` elements Google wraps every swapped text node in. Both signals must hold.

**`this.defaultLang` cannot be trusted.** `getSelectedLanguage()` starts with
`this.defaultLang = selectedLang`, so the no-argument call in `gtranslate()` sets it to **null**.
Passing it as the source language made `expectChange` true even when switching back to English, and
the switch-back then cached the French text as the `en` entry. `getSourceLanguage()` reads
`ttsObjPro.language` instead, which comes from PHP and never moves.

**Equality was the wrong comparison in the guard.** The stored source content includes the post
title; a DOM capture does not. A strict compare therefore never matched and let untranslated text
through. The guard now refuses when either string contains the other.

Two smaller adjustments: the wait window is 60s rather than 20s (waiting costs nothing, since the
player reads `window.TTS.contents` at play time), and on timeout `isTranslated` is still set so
players 3-6 fall back to the source text instead of spinning on a loader forever.

---

## Test results — localhost, 2026-08-28

Free 2.3.11 / Pro 3.4.8 + this fix, GTranslate 3.1.1 free, float switcher, real Google Translate.

| Step | DOM | `TTS.contents[1]` | listening lang | voice | cache |
|---|---|---|---|---|---|
| 1. clean English page | English | English | `en` | — | empty |
| 2. switch to French | French | **French** | `fr-FR` | Google français | `fr` = real French |
| 3. switch back to English | English | **English** | `en-GB` | Google UK English Female | `fr` French, `en` English |

Content, language and voice track the page in both directions, and the cached `fr` entry holds real
French rather than the English source.

Also verified:

- **Translation never arrives** (Google throttled the test session repeatedly, which turned out to
  be useful): nothing is cached, the player keeps coherent English text with an English voice, and
  `[TTS] GTranslate did not finish translating in time; skipping capture.` is logged. Before the fix
  this is precisely the moment English was written into `translations.fr`.
- **No forced reload on player 2**: an in-page probe survived the capture, so the page was not
  thrown away.
- **Player 3 (AtlasVoice TTS Pro)**: renders, loads its MP3, and on a language switch where the
  translation never lands it falls back to the source-language MP3 with no spinner and no poisoned
  cache. The reload still happens for the MP3 players, which need per-language file URLs from PHP.

Not yet exercised: players 4-6, and GTranslate paid (`pro_version` / `enterprise_version`), which
has no credentials on this machine.

---

## Round 2 — custom CSS selector, and the title

Tested on localhost with **player 2 (Default Pro)** and **player 3 (AtlasVoice TTS Pro)**. Two more
defects, both fixed: commits `0f73d18cb` and `3eceddfe9` on `feature/TTS-289`.

### Custom CSS selector works

The customer fills in **Include Content By CSS Selectors** (`tta__settings_css_selectors`), and every
earlier test here said nothing about that path: the local value `div.post-content` matches **zero**
elements on this theme, so those runs all used the fallback extractor.

Set to `div.page-content` (which does match on hello-elementor) and switched language:

- **Player 2** — `de` = `"DE TTS-280 Yvonne style — separators, quotes, Jetpack. DE Y1 The strike
  committee…"`, `tta__listening_lang` `de-DE`, voice `Google Deutsch`.
- **Player 3** — identical capture, followed by the reload the MP3 players need.

So a custom selector does not break translation capture.

**Worth checking with the customer:** their selector is `div.post-content`. If that matches nothing on
*their* theme too, the extractor has been silently falling back for them all along — a separate
configuration problem from this bug.

### Defect 7 — the title was dropped. REGRESSION FROM THIS TICKET'S FIRST COMMIT

`#readTranslatedDOMContent()` read the cloned wrapper's `textContent` directly, which has no title.
That value is what `getContent()` falls back to when the Include selector matches nothing, so on those
sites the title vanished as soon as the language changed.

```js
// Assets/js/compatibality/plugins/TTSGtranslate.js  (0f73d18cb)

 import {
     getContent,
     getContentByLanguage,
     findBatchSplitPoint,
     shouldUseDOMTitle,
-    normalizeLanguageCode
+    normalizeLanguageCode,
+    addTitleAndSanitizeContent
 } from "../../TTSProHelper";

     #readTranslatedDOMContent() {
         // ...clone the wrapper, strip script/style/figure, apply exclude
         // selectors and exclude tags (unchanged)...

-        let content = clonedWrapper?.textContent || clonedWrapper?.innerText || '';
-        content = content.replace(/\s+/g, ' ').trim();
+        // TTS-289: hand the cloned wrapper to the same routine the normal
+        // extractor uses, rather than reading textContent directly. It prepends
+        // the (translated) DOM title and applies the delimiter rules — reading
+        // textContent here dropped the title whenever the site's "Include
+        // Content By CSS Selectors" matched nothing, because this value is then
+        // what getContent() falls back to.
+        let content = addTitleAndSanitizeContent(window.TTS, clonedWrapper, buttonId, 0, this.selectedLang);
+        content = String(content || '').replace(/\s+/g, ' ').trim();

         return content || null;
     }
```

Reusing `addTitleAndSanitizeContent()` also means the title cannot double up: when the Include selector
*does* match, the normal extractor wins and this value is never used.

| Include selector | before | after |
|---|---|---|
| `div.page-content` (matches 1) | title present | title present |
| `div.post-content` (matches 0) | `"DE Y1 The strike committee…"` — **no title** | `"DE TTS-280 Yvonne style — separators… DE Y1 …"` |

### Defect 8 — `shouldUseDOMTitle()` keyed on a mutating value

Same root cause as the `this.defaultLang` fix above. It compared the target language against
`tta__listening_lang` — which a successful capture **rewrites** to the translated language — so any
later call for that same language returned false, the DOM title was skipped and the untranslated PHP
title came back: an English title prepended to German body text.

```js
// Assets/js/TTSProHelper.js, shouldUseDOMTitle()  (3eceddfe9)

-    const defaultLang = (ttsObj?.settings?.listening?.tta__listening_lang || '').substring(0, 2).toLowerCase();
+    // TTS-289: read ttsObjPro.language first. tta__listening_lang is REWRITTEN to
+    // the translated language by a successful capture, so comparing against it
+    // makes this return false on the next call and the untranslated PHP title
+    // comes back. ttsObjPro.language is the site's own language from PHP and
+    // never moves.
+    const defaultLang = (window.ttsObjPro?.language || ttsObj?.settings?.listening?.tta__listening_lang || '')
+        .substring(0, 2).toLowerCase();
     currentLang = (currentLang || '').substring(0, 2).toLowerCase();
```

| Test | Setup | Captured content |
|---|---|---|
| **A** — production post-capture state | `tta__listening_lang` pre-set to `de-DE`, `ttsObjPro.language` `en-US` | `"DE TTS-280 Yvonne style — separators…"` — translated title |
| **B** — control, old behaviour | `ttsObjPro.language` *also* forced to `de-DE` | `"TTS-280 Yvonne style - separators, quotes, Jetpack. DE Y1 Das Streikkomitee gab am Vorabend…"` — **English title on German body** |
| **C** — clean run, real Google | untouched | `"TTS-280 Yvonne-Stil – Trennzeichen, Anführungszeichen, Jetpack. Y1 Das Streikkomitee gab am Vorabend des Streiks…"`, `de-DE`, Google Deutsch |

Test B is the load-bearing one: it forces the *new* variable to the translated language and the bug
reappears exactly as described, so Test A is not passing by accident.

### Branch state

`feature/TTS-289`: `4832682f3` (main fix), `0f73d18cb` (title), `3eceddfe9` (`shouldUseDOMTitle`).
Nothing pushed or merged. Still not exercised: players 4-6, and GTranslate paid
(`pro_version` / `enterprise_version`), which has no credentials on this machine.
