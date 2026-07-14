# TTS-256 — Read-Along Highlighting: Remaining Issues & Follow-ups

Status of the feature as of this doc:

- **Players 1 & 2** (browser / speechSynthesis) — word + sentence highlighting. Shipped.
- **Players 3 & 5** (Google Translate MP3, ChatGPT MP3) — sentence-level estimate from audio time (no provider word timing). **Phase 1**, shipped.
- **Player 6** (ElevenLabs) — real per-word timing via `/with-timestamps`. **Phase 2a**, shipped.
- **Player 4** (Google Cloud) — real per-word timing via v1beta1 `text:synthesize` + SSML `<mark>`. **Phase 2b**, shipped.

Everything is gated on the `tta_highlight_settings['tta__highlight_enabled']` setting: with highlighting OFF, generation and playback behave exactly as before (no timing capture, no sidecar, no driver attach).

Word-timing sidecar contract (next to each MP3, `{title}.json`):
```json
{ "v": 1, "provider": "elevenlabs|gcloud", "words": [ { "w": "Word", "t": 12.34, "o": 567 } ] }
```
- `w` = word string, `t` = absolute start time (s) across the whole concatenated audio, `o` = char offset (informational; the frontend driver keys off `w` + `t`).

Key source files:
- Free painter (base class, exposed as `window.AtlasVoiceHighlighter`): `admin/js/tts/highlighter.js`
- Shared splitter: `admin/js/tts/sentence-splitter.js`
- Highlight settings UI: `src/dashboard/components/dashboard/highlight/Highlight.js`
- Pro sentence-estimate driver (3/5): `text-to-audio-pro/Assets/js/AudioHighlighter.js`
- Pro word driver (4/6): `text-to-audio-pro/Assets/js/WordAudioHighlighter.js`
- Pro backend capture: `text-to-audio-pro/Api/TTA_Pro_Api_Routes.php` (`elevenlabs()`, `synthesize_content_and_rename_file()`, `gcloud_synthesize_with_timing()`, `write_batch_word_timings()`, `write_final_word_timings()`, `delete_word_timings()`)
- Player wiring: `text-to-audio-pro/Assets/js/plyr.js`

---

## 1. Player-aware Highlight menu copy (Free React) — ✅ RESOLVED

**Done.** `Highlight.js` is now player-aware: `isBrowserPlayer` (1/2), `isSentenceOnlyPlayer` (3/5), `isWordTimedPlayer` (4/6) drive the header copy, the mode selector visibility, and the speechSynthesis warning (browser players only). Covers #8 as well.

<details><summary>Original write-up</summary>

**Problem.** The Highlight tab shows the same two blurbs for every player:
- Header: *"…while the browser reads a post aloud (Default and Default Pro players)."*
- A yellow **"speechSynthesis limitation"** warning that word highlighting only works with local voices and falls back to sentence otherwise.

Both are only true for the browser players (1 & 2). For the MP3 players they're misleading:
- Players **4 & 6** now have precise provider word timing — it works in **every** browser, no fallback.
- Players **3 & 5** are sentence-only by design (already shown a blue "generated audio" note, but the header/warning above still contradict it).

**Impact.** A user on player 4/6 reads the warning and believes word highlighting won't work (or is browser-dependent) when it actually does. Undersells the feature.

**Where.** `src/dashboard/components/dashboard/highlight/Highlight.js` — the header `<p>` (~line 112) and the yellow warning `<div>` (~line 121). `currentPlayer` / `isSentenceOnlyPlayer` are already computed in this file.

**Proposed fix.** Make the top note player-aware, three states:
- Players 1–2 → keep the speechSynthesis warning.
- Players 3, 5 → "This player uses generated audio, so highlighting is sentence-level." (already have the inline blue note; align the header too.)
- Players 4, 6 → "This player uses precise provider word timing — word highlighting works in every browser." No speechSynthesis warning.

Also update the header line "(Default and Default Pro players)" → generic ("the players you've enabled").

**Effort.** ~30–40 lines React + rebuild Free dashboard. Low risk (copy only).

</details>

---

## 2. Sidecar JSON not uploaded to Google Cloud Storage backup — ✅ RESOLVED

**Fixed** (Pro `85ac9bed1`). The sidecar is now uploaded to GCS as a **public** object next to the MP3 (`backup_json_sidecar_to_gcs`), the bucket gets a GET/HEAD CORS rule (`ensure_gcs_bucket_cors`, transient-gated), and the front-end rewrites the derived URL from GCS **virtual-hosted** (`bucket.storage.googleapis.com`) to **path-style** (`storage.googleapis.com/bucket/…`). Two gotchas found while testing on live GCS:
- **Underscore bucket names** (e.g. `atlas_voice_gtts_…`) make the virtual-hosted host an invalid DNS/TLS name → the browser's `fetch()` fails ("Failed to fetch"). Path-style avoids it.
- GCS sends **no CORS headers** by default; without the bucket CORS rule the cross-origin `fetch()` is blocked (public or signed alike). The word timings come from public post content, so public-read + `*` CORS is acceptable.
- Deletion (issue below / task 3) also removes the GCS sidecar in `delete_mp3_file` (route handler + helper). Verified end-to-end: players 4 & 6 generate → MP3 + public JSON on GCS → word highlighting works; meta-box delete removes both.
- *Minor residual:* GCS may edge-cache a no-Origin response without CORS if a non-browser request hits the object first (unlikely for unguessable URLs). Add `Cache-Control: no-store` on the JSON object if it ever surfaces.
- **Follow-up done (Pro `d79767de9`):** the *migrate* path was also covered. If backup is enabled **after** the audio already exists, `tts_upload_previous_file_to_gcs_and_get_new_url_callback` now uploads the `{title}.json` alongside the MP3 (it previously only moved the MP3, leaving the sidecar local → 404 → sentence fallback). Already-migrated posts (MP3 URL no longer local) won't re-fire that path — regenerate or backfill their sidecar once.

<details><summary>Original write-up</summary>

## (was) 2. Sidecar JSON not uploaded to Google Cloud Storage backup

**Problem.** When "Backup MP3 to cloud storage" (`tts_is_backup_mp3_file`) is ON, the final MP3 is uploaded to GCS and the local copy is deleted; the frontend then plays from the GCS URL. The word-timing `{title}.json` is **not** uploaded, and the frontend derives the sidecar URL from the (GCS) MP3 URL → 404 → word driver falls back to the sentence estimate.

**Impact.** On GCS-backup sites, players 4 & 6 lose word-level highlighting (degrade to sentence estimate). Playback unaffected.

**Where.** `TTA_Pro_Api_Routes.php` — the `get_option('tts_is_backup_mp3_file') == 'true'` branches in `synthesize_content_and_rename_file()` (Google) and `elevenlabs()` (ElevenLabs); `TTA_Pro_Helper::upload_google_cloud_content()`; GCS URL refresh via the `tts_get_gcs_new_signed_url` filter.

**Proposed fix.** After the final JSON is written, upload it to GCS alongside the MP3 (same signed-URL scheme), and have the frontend resolve the sidecar URL from the stored mapping rather than naive `.mp3`→`.json` when the MP3 is a GCS URL. Requires a small meta entry mapping MP3→JSON URL (or a parallel `tts_mp3_timing_urls` post-meta).

**Effort.** ~40–70 lines PHP + a few lines JS. Medium (touches GCS signing + a new URL surface).

</details>

---

## 3. Disabled-path gate — ✅ RESOLVED (empirically verified 2026-07-09)

**Verified at both enforcement points:**

1. **Sidecar/API gate (players 4/6)** — exercised the real `/tta_pro/v1/elevenlabs` route end-to-end (real handler → real ElevenLabs call → real finalization), single short batch per run:
   - Highlight **OFF** → plain MP3 produced (63 KB), **no** `{title}.json` written, **and a pre-placed stale sidecar was reconciled away** (`delete_word_timings` lifecycle works).
   - Highlight **ON** → MP3 + real word-timing sidecar (11 words, correct times).
2. **Frontend paint gate (players 1/2, Default/Default Pro)** — verified in the browser against the built bundle: with `tta__highlight_enabled` false, `syncSentence()` bails (`cfg.enabled=false`, 0 painted ranges); with it true, the sentence paints (1 range).

*Test gotcha worth remembering:* when switching the active player for a test, the previous player's voice/language linger in `tta_listening_settings` and are invalid for the new provider (e.g. a browser voice sent as an ElevenLabs `voice_id` → "invalid ID"; `en-US` → "model does not support language_code"). Always set voice+language in the Listening menu after switching players. Also: `tta_customize_settings` is cached (`TTA_Cache`) — flush after direct option writes, and clear `mp3_generation_lock__post_id__{id}` after failed runs.

<details><summary>Original write-up</summary>

**Problem.** The gate (with-timestamps / v1beta1 timepointing only when highlighting is enabled; plain endpoint otherwise) is implemented at every spot but was not exercised end-to-end, because verifying it means regenerating (costs a provider call) and would delete the good sidecar used for other tests.

**Where.** `elevenlabs()` (endpoint + response parse + finalization), `synthesize_content_and_rename_file()` (synth branch + finalization), `plyr.js` (attach gate).

</details>

---

## 4. Phase-1 drivers (players 3 & 5) can mis-locate the title — ✅ RESOLVED

> **Resolution.** Fixed in the base painter, so **every** driver benefits with no per-driver code:
> - Free `fad8d290` — the base painter captures the post title from `window.TTS.extra[buttonId].title`, normalizes it like a spoken sentence, and **skips the utterance that IS the title** in `syncSentence()`.
> - The title source is universal: `window.TTS.extra[buttonId]` (incl. `title`) is emitted by the button-init inline script (`helpers.php`) for **all players**, not just 1/2 — so players 3/5's `SentenceAudioHighlighter` (which extends the base) gets the guard for free. A briefly-added `ttsObjPro.title` fallback was reverted as unnecessary (Free `b9ab9bc2`, Pro `2f6fbaba8`).
> - Free `b25e8b92` — the title is additionally **resolved lazily** in `syncSentence()` (re-read if empty), surviving "delay JavaScript execution" optimizers (script `type="o/js-lzl"`) that run the localize script after the highlighter singleton is constructed. That was the live-site regression on oshaccredited.com.
> - Verified in-browser: title utterance → skipped (`_lastSentence=null`); colliding body paragraph and normal sentences → still highlight; constructor-before-data case → re-resolves on first utterance.

**Problem.** `AudioHighlighter`/`SentenceAudioHighlighter` (sentence estimate, players 3/5) splits `this.content` and drives `syncSentence()`, but has **no** title source, so the base title-skip guard can't fire. The audio content includes the post title (read first); the painter matches on a short prefix. If a title shares a prefix with a body sentence (e.g. title "The Future of Reading …" vs body "The future of reading is …"), the title read can highlight the wrong body sentence — the exact bug fixed for the word driver in Phase 2a.

**Impact.** Cosmetic but visible mis-highlight during the ~title window, only when a title prefix collides with a body sentence. Not observed in the default test posts, but real.

**Where.** `text-to-audio-pro/Assets/js/AudioHighlighter.js` (`update()` → `syncSentence`).

**Proposed fix.** Port the `_sentenceInBody(sentence)` guard from `WordAudioHighlighter` to `AudioHighlighter` (both extend the same base, so `this.root.textContent` is available). Better: lift the guard into the base painter's `syncSentence()` so every driver benefits — but that also touches players 1 & 2, so verify those still highlight (their spoken text is the body; title handling there needs a check).

**Effort.** ~20 lines if duplicated in `AudioHighlighter`; more if lifted to the base (needs 1/2 regression check).

---

## 5. Google Cloud partial-batch-failure → misaligned sidecar

**Problem.** `gcloud_synthesize_with_timing()` returns `null` on any per-batch failure, and the caller falls back to the plain client synth for **that batch** (MP3 fine, but no `.avtim.json` for it). If some batches succeed and others fail, `write_final_word_timings()` stitches only the successful batches → word times/offsets are shifted for everything after the missing batch.

**Impact.** Rare (timepointing usually succeeds when plain synth does), but when it happens the highlight drifts out of sync for the rest of the article. ElevenLabs has the same theoretical exposure.

**Where.** `synthesize_content_and_rename_file()` (fallback path) + `write_final_word_timings()`.

**Proposed fix.** On the last batch, compare the count of `{title}-*.avtim.json` files to the number of MP3 batches; if they don't match, **delete** the partial sidecar (via `delete_word_timings`) so the frontend cleanly falls back to the sentence estimate instead of showing drifted word timing. Log the drop.

**Effort.** ~15 lines PHP.

---

## 6. Selected content (CSS selectors) outside the article wrapper → no highlight

**Problem.** Players 4/6 read whatever `getContentsFromDom()` resolves, including content matched by `tta__settings_css_selectors` anywhere on the page. The painter, however, is scoped to `.tts_content_wrapper_<id>` (the post body). When the selected content lives **outside** that wrapper, the audio reads it but the read-along highlight paints nothing (fails safe via the `_sentenceInBody` guard — no wrong highlight, just none).

**Impact.** Sites that point AtlasVoice at a non-body region (custom container, ACF block rendered elsewhere) get audio but no highlighting on players 4/6 (and 1/2/3/5 similarly, since the painter root is always the wrapper).

**Where.** `TTSProHelper.js::getContentsFromDom()` (content source) vs `highlighter.js` (`this.root = querySelector('.tts_content_wrapper_' + buttonId)`).

**Proposed fix (larger).** Let the painter scope to the same selector set the reader used, instead of hard-coding the wrapper: when `tta__settings_css_selectors` is set, the painter should index/paint across those matched elements (a multi-root painter), falling back to the wrapper otherwise. This is an architectural change to the base painter (multi-root ranges) and should be its own ticket.

**Effort.** Medium–large. Base-painter change affecting all players; needs its own design + test matrix.

---

## 7. Google Cloud batch-duration uses the `end` mark (small drift) — ✅ RESOLVED

**Fixed** (Pro `d79767de9`). Drift *was* reported (highlight ran ~4–5 words ahead of the voice, worst late in long articles). Root cause confirmed by measuring a real file: the `<mark name="end"/>` timepoint is shorter than the batch's real MP3 (trailing/encoder silence after the mark; measured 1.87s unaccounted on a 205s file), and the stitcher summed those short values (`$time_offset += $data['dur']`), so every later word's timestamp drifted earlier and the error accumulated.

Now `gcloud_synthesize_with_timing()` sets each batch's `dur` from the batch MP3's **real decoded duration** via the new `TTA_Pro_Helper::measure_mp3_duration()` (sums MPEG-1/2/2.5 Layer III frame durations); the `end` mark is kept only as a fallback. Validated: helper matches an independent parse to the millisecond. Regenerate a Google Cloud post to pick it up (sidecars are written at generation time).

*Note:* the same helper is provider-agnostic — if ElevenLabs (player 6) ever shows the same lead, point its batch `dur` at `measure_mp3_duration()` too.

<details><summary>Original write-up</summary>

**Problem.** For cross-batch offsetting, ElevenLabs uses the exact last character-end time (precise). Google Cloud has no per-batch MP3 available to measure and no duration lib is bundled, so we use the trailing `<mark name="end"/>` timepoint as the batch duration. That ignores trailing silence, so word start times can drift by ~0.1–0.5s cumulatively over several batches (later words highlight slightly early/late).

**Where.** `gcloud_synthesize_with_timing()` (`$duration` from the `end` mark).

</details>

---

## 8. Header/description copy also says "(Default and Default Pro players)" — ✅ RESOLVED

Resolved as part of #1 — the top-of-tab copy is now player-aware.

---

## 9. "Listen to selected text" — read only what the user selects with the mouse (NEW FEATURE)

**Request.** In a 10-paragraph post the reader highlights, say, the 5th paragraph (or a single sentence) with the mouse and wants the player to read **only that selection**.

**Current state.** Not implemented for ANY player — there is no `getSelection` usage anywhere in either plugin's source. Every player reads the full post content (or the `tta__settings_css_selectors` content), not a mouse selection. (The user's assumption that players 1 & 2 already do this is incorrect; it's just *easy* to add there.)

**Feasibility by player:**
- **Players 1 & 2 (speechSynthesis)** — *Easy.* speechSynthesis speaks any string on demand. On selection, read `window.getSelection().toString()` (cleaned via the shared alias/normalisation) and speak it. The existing sentence/word highlight actions already work off the spoken text.
- **Players 4 & 6 (MP3 + real word timing)** — *Feasible now, no extra API cost.* The audio is one fixed MP3, but the Phase-2 word-timing sidecar (`{title}.json`, `words:[{w,t,o}]`) lets us map the selection to a **time range**:
  1. On `mouseup`/selection inside `.tts_content_wrapper_<id>`, get the selected string.
  2. Locate its first + last words in the `words[]` array (normalized subsequence match, in reading order) → `tStart` = first word's `t`, `tEnd` = word-after-last's `t` (or audio end).
  3. `player.currentTime = tStart`, `player.play()`, and on `timeupdate` auto-pause when `currentTime >= tEnd`.
  4. `WordAudioHighlighter` already highlights along the way — bonus, no extra work.
- **Players 3 & 5 (MP3, no word timing)** — *Rough only.* Without per-word times we can only estimate the selection's start from its character-proportion of the content (imprecise; may start mid-sentence). Acceptable as a "best effort" or disabled for these players.

**UX.** A small floating "▶ Listen to selection" button on text selection inside the article (like Medium's highlight menu), or a right-click/toolbar affordance. Selecting nothing → normal full-post playback.

**Where.**
- Selection capture + floating control: new small module, enqueued with the player (Free for 1/2 via `TextToSpeech.js`; Pro for 4/6 via `plyr.js`).
- Time mapping for 4/6: reuse the loaded sidecar `words[]` (the `WordAudioHighlighter` already has it — expose a `seekToText(selection)` / `rangeForText(selection)` helper on the driver).
- speechSynthesis path for 1/2: a `speakText(selection)` entry that bypasses the full-content utterance queue.

**Effort.** Medium. ~1 day: selection UI + speechSynthesis path (1/2) + time-range seek path (4/6) + fallbacks. Should be its own ticket; depends on the Phase-2 timing already shipped.

**Open questions.** Selection spanning multiple non-contiguous ranges; selection partially outside the wrapper (tie-in with #6 multi-root); whether to gate behind a setting.

---

## 10. Frontend JS bundles are versioned by plugin version, not filemtime

**Problem.** `wp_enqueue_script()` for the frontend players uses `$this->version` (the plugin version) as the `?ver` (`TTA_Admin.php:408` and `591`), not `filemtime()`. So when a JS bundle is rebuilt **without** a version bump, browsers keep serving the cached old bundle — a mid-cycle JS fix (e.g. the title guard in #4) doesn't reach users until the next release bumps the version. Surfaced this session: the title fix required a manual hard-refresh to verify.

**Impact.** Self-resolves at release (the version bump busts the cache), so it's not a shipping bug — but it makes hotfix-style JS changes invisible until release, and makes local/staging testing require hard refreshes.

**Where.** `admin/TTA_Admin.php:408`, `591` (frontend `TextToSpeech` enqueue). Note blocks already use `filemtime()` (line ~476), so the pattern exists in-repo.

**Proposed fix.** Version the built bundles with `filemtime(build_path)` (like the blocks do), or a hash, instead of the plugin version — so any rebuild busts the cache immediately.

**Effort.** ~5–10 lines. Low risk.

---

### Suggested order (remaining)
5 (partial-batch guard, ~15 lines) → 10 (filemtime versioning, quick win) → 9 (listen-to-selection, new feature — high user value, own ticket) → 6 (multi-root painter, own ticket).

**Resolved:** #1, #2, #3, #4, #7, #8 (+ non-doc: player-6 Xing-header seek fix, `chat_gpt()` WP_Error fatal guard, OpenAI batch-size timeout tuning, highlight default-off everywhere, lazy title resolve for delay-JS optimizers).
