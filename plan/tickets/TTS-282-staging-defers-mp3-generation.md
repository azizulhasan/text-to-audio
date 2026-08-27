# TTS-282 — Staging defers MP3 generation to the first play

## The problem

In staging, `TTA_Helper::should_load_button()` renders the player for `manage_options` users only —
by design, so an admin can confirm the right content is read before going live. But the player was
still generating an MP3 on **every page load**.

So the AtlasVoice CSS-selector workflow — open the post, adjust which content is read, reload,
check, reload again — spent a real generation on each pass, against vendor quota or our own gTTS
server, on content the admin was still in the middle of fixing.

Players 1 and 2 (Default, Default Pro) are not affected and were never in scope: they run on browser
`speechSynthesis`, write no file and cost nothing. This is players 3–6 only.

---

## Root cause

The machinery already existed, behind `ttsAsynchronousMP3Generate` (`Assets/js/plyr.js`):

- when it is **on**, the constructor calls `#setUpPlayer('')` instead of `init_gtts()` / `init_gctts()`
  / `init_chat_gpt()` / `init_elevenlabs()`, so nothing is synthesized;
- `player.on('waiting')` then generates on the first play, sets the `<source>` and starts playback.

Only its **default** was wrong — a hardcoded `false`, so nothing but a hand-written snippet could
ever turn it on.

---

## The fix

The default now comes from the mode:

```php
// Includes/TTA_Pro_Actions.php
'defer_mp3_generation' => class_exists( '\TTA\AtlasVoice\Mode' )
	? ! \TTA\AtlasVoice\Mode::is_production()
	: false,
```

```js
// Assets/js/plyr.js
asynchronousMP3Generate = window?.wp
    ? wp.hooks.applyFilters(
        'ttsAsynchronousMP3Generate',
        !!(typeof ttsObjPro !== 'undefined' && ttsObjPro?.defer_mp3_generation)
      )
    : false;
```

**Deliberately the DEFAULT, not an `add_filter`.** The filter is read in a class-field initializer,
which runs at construction time, so registering an `addFilter` would race the player bundle's own
script tag. As a default there is no ordering problem, and the filter still overrides in either
direction — a site can force eager generation in staging, or deferred generation in production.

`class_exists()`-guarded, so an un-updated Free keeps today's behaviour.

### Reload does not regenerate

Once the file exists, the constructor takes its `else { this.init_gtts() }` branch and plays the
cached URL. The picker workflow therefore costs **one generation per post**, not one per reload —
which is the actual fix for what was reported.

### Staging note under the player

A badge plus a line of text, rendered by `#renderStagingNotice()`:

- no file yet → *"No audio generated yet. Press play to generate it — only you can see this."*
- file exists → *"Visible to you only. Visitors see nothing until you go live."*

Only runs when the mode defers generation, and in staging the player is admin-only, so a visitor
never sees it. Both parts are written with `textContent`, never `innerHTML`, so a translation cannot
inject markup into a front-end page. Styles are literal colours in
`Assets/css/text-to-audio-pro.css` — this sits on the host theme's page and must not inherit a
theme's accent colour — with a `prefers-color-scheme: dark` block.

---

## Verified on a live install

| Case | Result |
|---|---|
| Staging + admin, no MP3 | No generation on load, empty `<source>`, badge reads "No audio generated yet" |
| Staging + admin, press play | Generates once, `<source>` gets the URL, badge flips |
| Staging + admin, reload | `tts_mp3_file_urls` hash byte-identical — no regeneration |
| Staging + logged-out | No player, no badge, no generation at all |
| Production + admin | Auto-generates on load exactly as before, no badge |

---

## Acceptance criteria

1. Loading a post in staging as an admin generates nothing; the meta stays empty.
2. Pressing play generates once and plays.
3. Reloading after that plays the cached file and generates nothing.
4. A logged-out visitor in staging sees no player and triggers no generation.
5. Production behaviour is byte-identical to before this ticket.
6. Players 1 and 2 are unchanged in every mode.
7. `ttsAsynchronousMP3Generate` still overrides the default in both directions.
8. An un-updated Free (no `Mode` class) produces today's behaviour, no fatal.

---

## Follow-ups

- The two badge strings are wrapped in `__()` but not yet in the `.pot`; `npm run makepot` picks
  them up at release.
- Pro bundles were built in dev mode for testing — `npm run production` still owed before release.
