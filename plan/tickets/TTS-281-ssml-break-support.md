# TTS-281 — SSML: real pause control between blocks

Follow-up to TTS-280. TTS-280 built the seam; this ticket is the thing the seam was built for.

Raised by Yvonne Hayes (world-outlook.com), whose actual words were:

> "Is there a code snippet that would instruct the system to pause between blocks or at paragra[phs]"
> "I don't want you to add punctuation; I want to know how to create a pause between the different blocks."
> "The mp3 file that generates does not pause the voice between a header, pullquote, separator block (or any other blo[ck])"

She is right that punctuation is the wrong instrument. A full stop is a sentence boundary, not a
duration, and the length of the gap it produces is entirely up to the provider's prosody model.

---

## Why TTS-280 could not finish this

TTS-280 gave every boundary a filterable string via `tta_boundary_delimiter( $delimiter, $tag, $boundary_type )`.
Anything longer than one terminator is destroyed downstream. Measured, not assumed:

| Filter returns | Reaches the provider as |
|---|---|
| `'. . . '` | `'. '` — `TTA_Helper::clean_string()` deletes `. . . ` explicitly (it was written to kill authors' visual dot dividers), and two further delimiter-collapse passes flatten what is left. |
| `'<break time="800ms"/>'` | **nothing** — `wp_strip_all_tags()` removes it. |

A token-placeholder scheme (insert an opaque token, restore it after every cleanup pass) was written
during TTS-280 and **rejected on purpose**: it is a workaround for a symptom, it adds a
protect/restore step to every content path in both PHP and JS, and it would be deleted the day this
ticket lands. Recorded so nobody re-proposes it.

---

## Scope

- **Provider support is not uniform.** Only some providers accept SSML. This must be capability-gated,
  never assumed — sending SSML to a provider that treats it as literal text makes it *read the markup
  aloud*, which is far worse than a short pause.
- **Free has no provider that accepts SSML**, so Free contributes the seam and the settings surface;
  the synthesis change is Pro's.

### Per provider

| Provider | Player | SSML |
|---|---|---|
| Google Cloud TTS | — | Yes — `input.ssml` instead of `input.text`; supports `<break time>`, `<emphasis>`, `<say-as>`. |
| AtlasVoice TTS Pro (gTTS) | 3 | **No.** Google Translate TTS has no SSML. This is the default player, so the default experience gains nothing here — decide what we tell those users. |
| ElevenLabs | — | Partial — `<break time>` supported up to a limit; other tags ignored. Verify current API behaviour before relying on it. |
| ChatGPT TTS | — | No SSML input; pacing is steered by the prompt/voice instructions instead. |
| Browser `speechSynthesis` | 1, 2 | No SSML. |

**Confirm every row against current provider docs before implementation** — these change, and the
gTTS row in particular decides whether this ticket is worth shipping alone.

---

## Work

1. **`TTA_Speech::boundary_delimiter()` returns a break instruction, not a string**, when SSML is
   active for the resolved provider. The call sites already do not care what comes back — that was
   the point of the seam — so `add_delimiter_if_need()` and `addDelimiterIfNeed()` should not change.
2. **Protect the emitted markup from the text-cleaning pipeline.** The three passes that destroy it
   are `TTA_Hooks::tta_after_clean_content_callback()`, `TTA_Helper::clean_string()` and
   `wp_strip_all_tags()` in `tta_clean_content()`, plus `removeDoubleDelimiters()` on the JS side.
   Decide deliberately whether that is a placeholder token, a separate SSML-aware assembly path, or
   building the SSML document after cleaning rather than during it. **The third is most likely
   correct** — clean the plain text, then wrap it, rather than defending markup through a pipeline
   built to strip markup.
3. **Escape the content.** `&`, `<` and `>` must be escaped inside an SSML document or synthesis
   fails. This is the single highest-risk item: every existing post is user-authored HTML.
4. **Wrap in `<speak>`** and switch the request field (`input.ssml` for Google Cloud).
5. **Settings surface** — a break duration per boundary type, defaulting to something conservative,
   with `tta_boundary_delimiter` still able to override per tag.
6. **Capability gate** — when the active provider has no SSML, fall back to today's punctuation
   behaviour silently. No user should get markup read aloud because they switched player.

---

## Risks

- **Reading the markup aloud** if the gate is wrong. Worst possible failure, and the reason this is
  not a small ticket.
- **Word-timing sidecars (TTS-256).** Read-along highlighting matches timings against the synthesized
  text. Inserting break elements shifts offsets; confirm the highlight path before release.
- **Cached MP3 invalidation.** Same regeneration concern as TTS-280 — on-demand, not a bulk sweep,
  or paid-provider customers get a surprise bill.

---

## Acceptance criteria

1. A heading, a separator and a paragraph boundary each produce an audibly longer gap than a full
   stop on a provider that supports SSML.
2. `tta_boundary_delimiter` can set a different duration per tag.
3. A provider without SSML support produces exactly today's output — no markup is ever spoken.
4. Content containing `&`, `<` or `>` synthesizes without error.
5. Read-along highlighting still aligns.
6. Yvonne's own posts, on her provider, produce the gap she asked for — verified against a real post,
   not a synthetic one.
