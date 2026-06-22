# Hebrew `iw` → `he` language-code normalization

## Problem

GTranslate (and Google generally) emit the **deprecated ISO-639 code `iw`** for Hebrew.
That raw `iw` leaked through to the front-end (`TTS.extra.language`, `file_url_key`) and into
provider requests, where browser `speechSynthesis` and provider TTS expect the modern code `he`
(`he-IL`). Symptom seen live: `TTS.extra` showed `"language": "iw"` / `"file_url_key": "iw"`,
so the Hebrew voice never resolved and the MP3 lookup key was wrong.

The two multilingual settings arrays are *not* the bug:
- `tta__multilingualActiveLanguages[player]` legitimately stores `iw` — it must match the
  GTranslate `googtrans` cookie value, so it stays `iw`.
- `tta__currentPlayerLanguages[player]` already maps that slot to `he`.

The leak was the raw code escaping on paths where the mapping didn't run.

## Fix (free plugin only — Pro delegates up)

`includes/TTA_Helper.php`:

1. New `tts_normalize_language_code( $language )` — maps the **primary subtag** only
   (`iw→he`, `in→id`, `ji→yi`, `jw→jv`) and preserves any region/script suffix
   (`iw-IL` → `he-IL`). Filterable via `tts_normalize_language_code`.
2. Applied in `get_player_language_and_player_voice()` on the resolved `language`
   (drives `TTS.extra.language`, file name, speechSynthesis lang).
3. Applied in `tts_get_file_url_key()` on the lookup/storage key (some callers — e.g. Pro
   generation — pass a saved language straight in without resolution).

Both Pro paths (`TTA_Pro_Helper::tts_get_file_url_key()` and the
`tts_player_language_and_player_voice` callback) delegate to these Free methods, so players
2–6 and the bulk/REST generation paths are covered. Pure PHP — no JS rebuild.

## Not covered here

- **External `gtts.atlasaidev.com` service** (player 3 generation): it now receives `he`.
  Google's `translate_tts` accepts `he`, so this works *if* the service forwards the code.
  If that service has its own language whitelist, confirm `he` is allowed.
- `Api/GTTS.php` in Pro (stale, slated for removal) — intentionally skipped.

## Regeneration

Existing Hebrew MP3s stored under the old `iw` key won't match the new `he` key →
**regenerate Hebrew audio once after deploy.**

## Manual verification

With GTranslate set to Hebrew, load a page on the front-end:
- `TTS.extra.language` and `TTS.extra[...].file_url_key` should read `he` (not `iw`).
- Players 3/4 should generate / look up the MP3 under the `he` key and play Hebrew audio.
- Spot-check a non-Hebrew language (e.g. `fr`, `zh-CN`) is unchanged.
