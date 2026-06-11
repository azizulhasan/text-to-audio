# Multilingual Setup Guide

## How AtlasVoice Handles Multiple Languages

AtlasVoice Pro plays a different voice (and a different language) for each language your site is translated into. This works automatically with the most common WordPress multilingual plugins:

- **Polylang** (server-side translations — different post per language)
- **WPML** (server-side translations — different post per language)
- **GTranslate** (client-side widget that translates the DOM via Google Translate)
- **TranslatePress** (server-side translations)

The detection runs on every page load: AtlasVoice looks at the active multilingual plugin, figures out which language the current page is in, and picks the matching voice + TTS-language code from your saved Listening preferences.

---

## The Two Settings You Must Configure

Multilingual works only if **both** of these are set up — in this order — for **each player** you plan to use:

### 1. Dashboard → AtlasVoice → Customization → Select Player

Pick the player you want to use for this site:

- **1 — Default** (Free, browser speechSynthesis — limited multilingual support)
- **2 — Default Pro** (Pro browser speechSynthesis — supports multilingual via browser voices)
- **3 — AtlasVoice TTS Pro** (Google Translate TTS, free tier, 82 languages, no per-language voice selection)
- **4 — Google Cloud TTS** (your own GCP service account, 64 languages × ~2,000 voices)
- **5 — ChatGPT TTS** (OpenAI, 58 languages × 7+ voices × 3 models)
- **6 — ElevenLabs** (ElevenLabs, 58 languages × your account's voice library × 4 models)

Click **Save**.

### 2. Dashboard → AtlasVoice → Listening — *for the player you just picked*

This is the step most people miss. Each player has its **own** Listening configuration, and Listening doesn't automatically copy across when you switch player. After every player switch you must re-open Listening and confirm:

| Control | Required for | What to pick |
|---|---|---|
| **Voice Language** | All players | The default site language (e.g. `English`) |
| **Voice Model** | Players 5 & 6 only | Pick one: `gpt-4o-mini-tts` (cheapest, Pro voice control) / `tts-1` / `tts-1-hd` for ChatGPT; `eleven_multilingual_v2` (recommended for multilingual) / `eleven_v3` / `eleven_turbo_v2_5` / `eleven_flash_v2_5` for ElevenLabs |
| **Voice to Speak** | Players 2, 4, 5, 6 | The default voice (used when no per-language voice is mapped) |
| **Voice Speed** / **Output Format** | Optional | Defaults are fine |
| **Plugin Language Mapping** rows | When Polylang / WPML / GTranslate / TranslatePress is active | For each language row, pick the matching TTS language and a voice that speaks that language well |

Click **Save**.

> **Why the per-player rule matters**: AtlasVoice stores Voice + Model + per-language map under `tta_listening_settings → tta__available_currentPlayerVoices[player_id]`. If you switch from Player 5 (ChatGPT) to Player 6 (ElevenLabs) in Customization but skip the Listening step, the next MP3 generation will try to send ElevenLabs an OpenAI voice name like `nova`, ElevenLabs will reject it, and you'll see "Generating MP3 Batch 1 of N…" stuck forever. The fix is always: go to Listening and re-pick the voice.

---

## How the Plugin Language Mapping Section Looks

When a supported multilingual plugin is active, the Listening page shows an extra section titled like **"Polylang Plugin Language Mapping"** / **"WPML Plugin Language Mapping"** / **"Gtranslate Plugin Language Mapping"**. Each row pairs:

- The **multilingual-plugin language slug** (e.g. Polylang's `es`, WPML's `es`, GTranslate's `Français` / `Deutsch` / `简体中文`)
- The **TTS language code** to send to the cloud-TTS API (e.g. `es-ES`, `fr-FR`, `zh`)
- The **voice** to use for that language (e.g. `es-ES-Chirp-HD-F-FEMALE` for Google Cloud TTS, `nova` for ChatGPT, an Eleven voice for ElevenLabs)

Spanish → Spanish voice, German → German voice, etc. Pick a voice that actually speaks the target language — for Google Cloud TTS and ElevenLabs, the voice name itself contains the locale (`en-US-…`, `es-ES-…`); for ChatGPT and gtts, any voice works for any language because the language code drives pronunciation.

---

## Plugin-by-Plugin Notes

### Polylang

Server-side. Each translated post is its own WordPress post. AtlasVoice generates a separate MP3 per translated post and stores its URL under `_post_meta tts_mp3_file_urls[<lang>]`. The Listen button reads the post's own language, looks up the mapped TTS language + voice, and plays.

**Setup:** Activate Polylang → Settings → add languages → translate at least one post → AtlasVoice → Listening → set the per-language voice for each Polylang language → Save → reload the translated front-end page and click Listen.

### WPML

Server-side. Same model as Polylang — each translation is a separate post linked under a shared `trid` in `wp_icl_translations`. AtlasVoice resolves the active language via `wpml_current_language` and uses the same per-language listening map structure.

**Setup:** Activate sitepress-multilingual-cms (and optionally wpml-string-translation) → run the WPML setup wizard → translate posts → AtlasVoice → Listening → set per-language voices → Save → reload the translated post URL (`/es/post-name/` etc.).

### GTranslate

Client-side widget by default. When the user picks "Français" from the floating switcher, GTranslate sets a `googtrans=/en/fr` cookie and re-translates the rendered DOM via Google Translate's JS. The URL doesn't change in widget mode.

**AtlasVoice still respects the language switch**: on the next page load, the plugin reads the `googtrans` cookie server-side and uses it as the active multilingual language. The cloud-TTS API call goes out with the matching language code (`language=fr`) and the per-GTranslate-language voice you mapped in Listening.

**Caveat — text remains in the source language**: because GTranslate translates the rendered DOM client-side, the `the_content` that AtlasVoice reads server-side is always the original-language post. So even when the GT cookie is `fr`, the *text* sent to the cloud-TTS API is the English post content; only the `language` parameter flips. The result is English text spoken with a French-locale voice, not a real translation. For per-language **content** you need a server-side multilingual plugin (Polylang / WPML / TranslatePress).

**Setup:** Activate GTranslate → Settings → choose which languages to expose in the widget → AtlasVoice → Listening → the "Gtranslate Plugin Language Mapping" section appears with one row per exposed language → pick the TTS language code + voice for each → Save → reload the front-end and click Français/Deutsch/etc. in the widget. The next Listen click will generate a new MP3 with `__lang__<code>` in the filename.

### TranslatePress

Server-side. Behaves like Polylang/WPML at the API level. The plugin reads TranslatePress's current-language setting and uses the same per-language Listening map.

---

## Confirming It Works

For Players 3–6, you can verify the right language + voice without listening to the audio:

1. **Check the MP3 filename in the post's AtlasVoice metabox (or `wp-content/uploads/TTA_Pro/<provider>/…`)**: filenames encode the language and voice. A correctly multilingual setup produces names like:
   - `…__lang__es-ES__voice__es-ES-Chirp-HD-F-FEMALE.mp3` (Google Cloud TTS on a Polylang ES page)
   - `…__lang__fr__voice__nova.mp3` (ChatGPT on a GTranslate /fr page)
   - `…__lang__es-es__voice__Orta.mp3` (ElevenLabs on a WPML ES page)

2. **Check the browser's developer-tools network tab**: the POST request to `/wp-json/tta_pro/v1/{gtts|gctts|chat_gpt_tts|elevenlabs_tts}` carries a `settings` object with `language` and `voice` keys. Both should match the page's current multilingual language.

3. **Check `sessionStorage.tts_pro_stored_content`** in the browser console after clicking Listen: it contains the text the player is reading and the language it detected.

For Player 2 (browser TTS, no API call), the plugin logs the content via `console.log` when Listen is clicked — open the console before clicking.

---

## Switching Multilingual Plugins

If you replace one multilingual plugin with another (e.g. deactivate Polylang and activate WPML), do this once for the affected posts:

1. Open the post in WordPress admin.
2. Scroll to the **AtlasVoice Pro** metabox.
3. Click **Delete All MP3 Files**.
4. Reload the front-end post — AtlasVoice will regenerate fresh MP3s for the new multilingual setup.

You don't need to delete MP3s when **switching languages within the same plugin** — the plugin keys MP3 files by language and stores them side-by-side.

You **do** need to delete MP3s when switching the **player** for the post (e.g. from Google Cloud TTS to ElevenLabs), because the existing files were made by the old provider with the old voice and the plugin won't regenerate while a file already exists at the saved URL.

---

## Common Pitfalls

- **"Generating MP3 Batch 1 of N…" stuck forever** — almost always means the active player's Listening voice is from a different provider (e.g. you switched to ElevenLabs in Customization but Listening still has a Google Cloud voice in the default Voice to Speak slot). Go to Listening, re-pick voice + model for the active player, Save.

- **Player loads an audio file but plays the wrong language** — the post has an old MP3 from a previous Listening configuration. Open the post, AtlasVoice metabox → Delete All MP3 Files → reload front-end.

- **GTranslate widget switches the visible DOM but the player keeps reading the original language** — that's working as designed (see "GTranslate" above). If you want per-language audio content, use Polylang or WPML.

- **No "Plugin Language Mapping" section appears in Listening** — you don't have a server-side multilingual plugin active, or GTranslate isn't activated. Activate the multilingual plugin first, then refresh the Listening page.

- **Default Voice Language stuck at "Afrikaans"** — this is just because Afrikaans is alphabetically first in the dropdown; pick your real default language and Save once. Per-language mappings override this default whenever they apply.
