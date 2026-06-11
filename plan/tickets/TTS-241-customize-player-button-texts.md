# Player Button Text & Icon Customization

Branch: rolled into `feature/TTS-239` (alongside TTS-239 + TTS-240 work) — phase 1 covers Default + Default Pro only.
Status: **PHASE 1 SHIPPED** — verified on production (`https://cors2.atlasaidev.com`) on 2026-04-26.
Release: Free `2.1.18`, Pro `3.2.3`.

---

## ✅ COMPLETED (Phase 1)

### Backend (PHP)
- `includes/TTA_Player_Icons.php` — new class with 8 curated SVG presets (`play / pause / stop / replay / headphones / ear / volume-up / volume-mute`) using `currentColor` so icons inherit the button's color/hover-color. Sanitizes user-pasted SVG via `wp_kses` whitelist. Provides `default_players()` for ids 1 & 2 and `sanitize_players()` for the REST POST path.
- `includes/helpers.php → get_button_text()` reads `players[id]` first and falls back to flat keys; surfaces hover titles per state and exposes the full `players` map to JS.
- `includes/helpers.php → set_initial_button_texts()` seeds `players[1]` and `players[2]` from `TTA_Player_Icons::default_players()`.
- `admin/TTA_Admin.php` — new `build_player_customizations()` derives the icon map for ids 1 and 2 from the saved option (resolves `preset:` / `custom:` descriptors).
- `api/TTA_Api_Routes.php → tta_manage_customize_data()` accepts `button_texts` on POST (sanitized via `TTA_Player_Icons::sanitize_players`) and returns merged-with-defaults map on GET, plus `presets` and `preset_svgs` for the React picker.

### Frontend JS
- `admin/js/TextToSpeech.js` — `getStateText` / `getStateHover` helpers; `_renderStateContent` produces a single normalized DOM shape for all four states; `displayButtonText` gated to **player 1 only** (player 2 is React-driven and would be destroyed by innerHTML swap); `playButtonIcon` lookup uses the active `playButtonNo`.
- `admin/js/tts/utilities.js → getButtonContent` rewritten to emit identical structure to `_renderStateContent` and read per-player overrides.
- `admin/js/text-to-audio-button.js → initNewPlayer` + `getNewButtonContent` honor per-player text/icon, suppress the host-element focus outline (`:host(:focus)` rule that fixes the right-click "border expansion"), drop the outline-offset focus ring, set hover `color` so SVGs using `currentColor` inherit, and force `box-sizing: border-box`.

### React Dashboard
- `src/dashboard/components/dashboard/customize/design/TTSButtonDesign.js` — section gated to `playerId === 1 || 2`, hidden for 3/4/5/6.
- `src/dashboard/components/dashboard/customize/design/ButtonStateEditor.js` — orchestrator: dynamic title (`Default` / `Default Pro`), 4 state cards, `Reset all to defaults`.
- `src/dashboard/components/dashboard/customize/design/PlayerStateCard.js` — per-state card with text input, icon-picker swatch, per-state reset, hover-title behind "Show advanced".
- `src/dashboard/components/dashboard/customize/design/IconPicker.js` — popover with 4×2 preset grid + Custom SVG paste tab and live preview swatch.
- `src/dashboard/components/dashboard/customize/design/ButtonPreview.js` — Default-player live preview that renders the **same DOM as the front-end web component** (`tts__listent_content` button with `.tts-button-left` / `.tts-button-right` / settings gear) and is **functional via `speechSynthesis`** (idle → playing → paused → finished states).
- `src/dashboard/components/dashboard/customize/Customize.js` — wires `buttonTexts` state from `/customize` GET, posts back under `formData.button_texts`, routes player 2 preview to `<TextToSpeech>` (passing `buttonTexts` + `playerId`), routes player 1 preview to `<ButtonPreview>`.
- `src/dashboard/buttons/components/TextToSpeech.js` — accepts `buttonTexts` and `playerId` props, resolves listen text via `resolveStateText`, wraps `<Play>/<Pause>/<Replay>` so per-player custom SVG overrides them, applies user's `border / border-radius / height / fontSize` from `buttonCSS` with `!important` to defeat Bootstrap's default border, sets `box-sizing: border-box` on `.tts__player` to stop soundwave overflow.
- `src/dashboard/components/dashboard/settings/Settings.js` — "Enable Button Icon" toggle gated to `[1, 2].includes(player_id)`.

### Pro plugin
- `Assets/js/build/text-to-audio-pro-button.min.js` rebuilt and shipped (this is bundled from free's `src/dashboard/button.js`). No source changes in pro for TTS-241.

---

## ❌ DEFERRED (Phase 2 — separate ticket)

### Plyr-based players (4, 5, 6)
- Per-control labels (`i18n` map for play/pause/restart/rewind/seek/fastForward/captions/download/volume/mute/settings).
- Visible-controls multi-select (already partially exposed via `wp.hooks.addFilter('ttsProPlayerDesign', ...)`, but not wired to a UI).
- "Now playing…" caption template with `{title}` / `{voice}` / `{language}` placeholders.
- Speed presets list customization.
- Section title would become "Button Texts & Icons — ChatGPT TTS" / "ElevenLabs TTS" etc., reading a new `players[4..6]` shape distinct from the speechSynthesis players' shape.

### Icons in Default Pro factory fallback
- Today the fallback for player 2 still uses the `<Play>/<Pause>/<Replay>` React components from `TTSIcons` when no per-player override is saved. Custom SVGs DO override them. Defaults could be replaced with the same heroicons-style preset set used in Default to make defaults visually consistent across both players.

### Width-vs-customCSS interaction (documented, not changed)
- `width` setting respects user's `customCSS` `max-width` clamps (intentional — user's custom CSS wins).
- Optional follow-up: add `!important` to width if we decide the slider should always win.

### Optional
- Loading and error states for Default-style players (currently only listen/pause/resume/replay).
- Consolidate `ButtonPreview.js` into `<TextToSpeech>` so there's one preview path. Today `ButtonPreview.js` exists only for player 1 to match the web-component look; player 2 already uses `<TextToSpeech>`. Consolidation would require rendering the `<tts-play-button>` web component in the dashboard preview, which needs a full `window.TTS` bootstrap.
- Per-post overrides via meta box.

---

## VERIFIED ON PRODUCTION (2026-04-26)

`https://cors2.atlasaidev.com` — see QA report in commit history. Highlights:

- Section visibility rule: PASS for all 6 players (1/2 visible, 3/4/5/6 hidden).
- Save → reload round-trip: PASS — `players[1].listen.text = "PROD-Listen"` with `icon = custom:<svg…>` persisted.
- Frontend Default rendered the saved custom text + custom star SVG.
- Frontend Default Pro rendered with `border-radius: 10px`, `height: 50px`, `fontSize: 20px`, sound-wave inside the border (no overflow).
- ElevenLabs (TTS-240): accent dropdown removed, search-box auto-resolve via `/elevenlabs_voice` works, language change fires exactly 1 fetch, hot cache reload fires 0 fetches.

---

## 1. What I understand

### 1.1 Players in the plugin

There are 6 players, but only **3 distinct frontend UIs**:

| Player ID | Provider | Frontend script | UI family |
|-----------|----------|-----------------|-----------|
| 1 | Browser SpeechSynthesis (free) | `admin/js/TextToSpeech.js` | **Default** |
| 2 | Browser SpeechSynthesis (pro fallback) | `Pro/Assets/js/TextToSpeechPro.js` | **Default Pro** |
| 3 | Google Translate TTS / AtlasVoice TTS Pro | `Pro/Assets/js/TextToSpeechPro.js` | (file-based, separate UI) |
| 4 | Google Cloud TTS (pro) | `Pro/Assets/js/plyr.js` | **Plyr** |
| 5 | ChatGPT TTS (pro) | `Pro/Assets/js/plyr.js` | **Plyr** |
| 6 | ElevenLabs TTS (pro) | `Pro/Assets/js/plyr.js` | **Plyr** |

Players 1 and 2 are the speechSynthesis-driven buttons whose content is rewritten on each lifecycle event (listen / pause / resume / replay). Player 3 (Google Translate TTS) reuses `TextToSpeechPro.js` but plays a generated MP3 — its button behaviour and customization needs differ. Players 4/5/6 use the Plyr media player (transport bar / time / volume / settings).

> User scope confirmed: phase 1 covers **Default (player 1)** and **Default Pro (player 2)** — the speechSynthesis-style buttons only. Players 3, 4, 5, 6 are out of scope.

### 1.2 Where button text/icon currently lives

**Backend (PHP)**

- `includes/helpers.php → get_button_text($atts, $content_read_time)` builds the text array on every page render and persists it to the option `tta__button_text_arr`.
  Keys: `listen_text`, `pause_text`, `resume_text`, `replay_text`, `start_text`, `stop_text` (last two are for speech-recognition recording, not the listen flow).
- `set_initial_button_texts()` writes English defaults the first time.
- The text array is overridable per-shortcode via `[atlasvoice listen_text="…"]` (parsed in `get_text_array_from_shortcode`) and via the `tta__button_text_arr` filter.
- `admin/TTA_Admin.php → $this->localize_data['buttonTextArr']` ships the array to the dashboard JS as `ttsObj.buttonTextArr`.
- `admin/TTA_Admin.php → $this->localize_data['player_customizations']` ships per-player SVG icon strings keyed by player id (currently only id `'1'` is populated, with `play / pause / replay / resume`). `$color` is a placeholder substituted at output time.

**Frontend (JS)**

- `admin/js/TextToSpeech.js`:
  - `playButtonText / replayButtonText / pauseButtonText / resumeButtonText` read from `this.buttonTextArr.*` (mirrored from `ttsObj.buttonTextArr`).
  - `playButtonContent / replayButtonContent / pauseButtonContent / resumeButtonContent` build the inner HTML, picking the SVG from `this.playButtonIcon[1].{play|pause|resume|replay}` (mirrored from `ttsObj.player_customizations[1]`).
  - `displayButtonText(listenStatus, isClicked)` is the swap function. **Today it only runs when `playButtonNo == 1`** — so Default Pro (player 2) currently does NOT swap text/icon by event. That's a gap to fix in phase 1.
- `hover_title` keys are read from `ttsObj.buttonTextArr.{replay,pause,resume}_hover_title` for the tooltip but there is **no UI** to edit those today.

### 1.3 The 6 lifecycle states a Default-style button passes through

Reading `displayButtonText` and the speak/pause/resume/finish flow:

| State key | When | Default text | Default icon (current) |
|-----------|------|--------------|------------------------|
| `listen` | Idle / before first play / after end | "Listen" | dashicons-controls-play (or `play` SVG) |
| `pause` | While speaking | "Pause" | dashicons-controls-pause (or `pause` SVG) |
| `resume` | After user paused | "Resume" | dashicons-controls-play (or `resume` SVG) |
| `replay` | After speech finished | "Replay" | dashicons-image-rotate (or `replay` SVG) |
| `loading` *(not implemented)* | Between click and first audio | — | — |
| `error` *(not implemented)* | Synth error / unsupported | alert popup | — |

Phase 1 will keep the same 4 states (listen, pause, resume, replay) but make them **all customizable per-player** with both text and icon, and route them through `displayButtonText` for **player 2/3 too**.

### 1.4 Why this needs to live inside Customize (not Listening)

Customize already owns the visual identity of the button (colors, size, border, radius, custom CSS, shortcode preview). Text labels and icons are part of the button's visual identity. Listening owns voice provider config — orthogonal. Putting it under Customize keeps "what the button looks like and says" in one place.

### 1.5 Open questions for you (please answer before I implement)

1. **Per-player vs global texts**: The current option `tta__button_text_arr` is global. Each player's UI will eventually want different defaults (e.g. Plyr probably doesn't need a "Listen" label). Should I store as
   - (a) flat global keys (today's shape) plus optional per-player overrides under `tta__button_text_arr.players[1] = {...}` *(my recommendation — backward compatible)*, or
   - (b) replace the option with a strict per-player map?
2. **Icon source**: Today Default's icons are SVG strings in PHP filter. I'd like to add a small **icon picker** with ~8 curated icons (heroicons-style: play, pause, refresh, stop, sound-on, sound-off, ear, headphones) **plus a "Paste custom SVG" textarea**. OK?
3. **Hover titles**: `replay_hover_title / pause_hover_title / resume_hover_title` are read by JS but never editable. I'll surface them as optional fields under each state. OK?
4. **Reset to defaults**: Per-state reset buttons or one global reset?
5. **Live preview**: Should the existing Customize live-preview button reflect the chosen state? Suggested: a small "Preview state: [Listen ▾]" selector on the preview card so the user can flip through Listen/Pause/Resume/Replay and see exactly what each variant looks like.

---

## 2. Plan — Phase 1 (Default + Default Pro)

### 2.1 Settings shape (proposed)

Extend `tta__button_text_arr` to:

```php
[
  // legacy flat keys still written for back-compat (mirror player 1)
  'listen_text'  => 'Listen',
  'pause_text'   => 'Pause',
  'resume_text'  => 'Resume',
  'replay_text'  => 'Replay',
  'start_text'   => 'Start',
  'stop_text'    => 'Stop',

  // new per-player section
  'players' => [
    1 => [  // Default (free, speechSynthesis)
      'listen' => [ 'text' => 'Listen', 'hover' => 'Click to listen post.', 'icon' => 'preset:play' ],
      'pause'  => [ 'text' => 'Pause',  'hover' => 'Pause playback',        'icon' => 'preset:pause' ],
      'resume' => [ 'text' => 'Resume', 'hover' => 'Resume playback',       'icon' => 'preset:play' ],
      'replay' => [ 'text' => 'Replay', 'hover' => 'Click to listen post.', 'icon' => 'preset:refresh' ],
    ],
    2 => [ /* same shape — Default Pro (pro speechSynthesis fallback) */ ],
  ],
]
```

`icon` is either `preset:<name>` (resolved from a server-side curated map) or `custom:<base64-svg>` (raw paste).

Existing flat keys remain authoritative if `players[id]` is empty so old sites keep working unchanged.

### 2.2 Backend changes

| File | Change |
|------|--------|
| `includes/helpers.php` | `get_button_text()` reads `players[player_id]` first, falls back to flat keys. Add `get_button_state()` helper returning `{text, hover, icon}` for `(player_id, state)`. |
| `admin/TTA_Admin.php` | Extend `player_customizations` so ids 1 and 2 carry `play/pause/resume/replay` SVGs derived from the new option (not hard-coded). Continue to emit `buttonTextArr` for back-compat. Also emit `buttonTextArr.players` so JS sees the per-player map. |
| `api/TTA_Api_Routes.php` | The existing `/customize` route already saves `tta_customize_settings`. The texts/icons live on a separate option, so add a new `/button-texts` POST route (or piggyback on `/customize` with a `button_texts` field) that validates and saves the structure above. Sanitize SVG via `wp_kses` with an SVG-safe whitelist. |
| Curated icons | Bundle ~8 SVGs (string constants) in `includes/PlayerIcons.php` (new) so the React UI and PHP frontend share a single source of truth via REST. |

### 2.3 Frontend (TextToSpeech / TextToSpeechPro) changes

| File | Change |
|------|--------|
| `admin/js/TextToSpeech.js` | `displayButtonText` already gates on `playButtonNo == 1`. Generalize: read from `ttsObj.buttonTextArr.players[playButtonNo]` if present, fall back to flat keys. Run the swap for **any player whose `playerCustomizations[playButtonNo]` exists**, not just `1`. |
| `Pro/Assets/js/TextToSpeechPro.js` | Use the same generalized `displayButtonText` (or import the same util). Today this player just shows static text — phase 1 makes it lifecycle-aware. |

### 2.4 React dashboard changes

```
src/dashboard/components/dashboard/customize/
  design/
    TTSButtonDesign.js                  # existing — append <ButtonStateEditor> after Button Properties
    ButtonStateEditor.js                # NEW — orchestrator (player tabs + state grid)
    PlayerStateCard.js                  # NEW — per-state card (text, hover, icon)
    IconPicker.js                       # NEW — preset grid + custom-SVG textarea
    state-presets.js                    # NEW — client-side mirror of PHP icon presets
```

#### 2.4.1 Visual hierarchy (after Button Properties section, before Custom CSS)

> **Visibility rule:** the entire "Button Texts & Icons" section is rendered **only when the currently selected player is 1 (Default) or 2 (Default Pro)**. For players 3/4/5/6 it is hidden — they will be addressed in later phases with their own UIs.
>
> Because only one of the two players is active per site, **no tabs are needed** — the section title becomes "Button Texts & Icons — Default" or "Button Texts & Icons — Default Pro" based on `buttonSettings.id`, and only that player's state cards are shown. This keeps the UI single-purpose and avoids confusing the user with tabs that affect a non-active player.

```
┌─ Button Texts & Icons — Default ──────────────────────┐
│   (shown only when buttonSettings.id == 1 or == 2,    │
│    title swaps between "Default" and "Default Pro")   │
│                                                       │
│  ┌── Listen ────────┐ ┌── Pause ─────────┐            │
│  │ [Icon ▾] Text    │ │ [Icon ▾] Text    │            │
│  │ Hover title      │ │ Hover title      │            │
│  └──────────────────┘ └──────────────────┘            │
│  ┌── Resume ────────┐ ┌── Replay ────────┐            │
│  │ [Icon ▾] Text    │ │ [Icon ▾] Text    │            │
│  │ Hover title      │ │ Hover title      │            │
│  └──────────────────┘ └──────────────────┘            │
│                                                       │
│  Preview: [Listen ▾]   ⟶ live preview card updates    │
│                                                       │
│           [ Reset to defaults ]                       │
└───────────────────────────────────────────────────────┘
```

#### 2.4.2 PlayerStateCard layout

```
┌───────────────────────────────────────────┐
│ ▶ Listen                              [↺] │  ← state title + per-state reset
│ ┌──────┐  Label                           │
│ │ icon │  ┌───────────────────────────┐   │
│ │ pick │  │ Listen                    │   │
│ └──────┘  └───────────────────────────┘   │
│           Tooltip (optional)              │
│           ┌───────────────────────────┐   │
│           │ Click to listen post.     │   │
│           └───────────────────────────┘   │
└───────────────────────────────────────────┘
```

- Icon-pick area is a 32×32 swatch that opens a popover with the 8 presets in a 4×2 grid + a "Custom SVG" tab containing a textarea + 24×24 live render preview.
- Label uses `react-bootstrap` Form.Control. Empty string falls back to factory default at save time.
- Tooltip is collapsed by default behind a "Show advanced" link to reduce visual weight.

#### 2.4.3 No tabs (revised)

Tabs were dropped after re-scoping: only the active player's editor is shown. The settings shape still stores `players[1]` and `players[2]` independently in the option, so a site that switches player from 1 → 2 keeps each player's saved labels/icons untouched.

#### 2.4.4 Live preview integration

- Customize.js already renders a preview button using `tta_obj.buttonTextArr.listen_text`. Replace that with `<PreviewButton state="…" playerId={…} icons={…} texts={…} />` reading the same in-memory draft so changes appear immediately, no round-trip.
- Add a small `[Listen ▾]` `<select>` above the preview button to flip between states.

#### 2.4.5 UX polish (reasoning)

- **Per-state cards over a flat form**: surfaces the lifecycle clearly so the user understands "this fires when the user pauses" without reading docs.
- **Single icon swatch + popover**: avoids cluttering each card with 8 thumbnails; popover keeps it compact.
- **Tooltip behind "Show advanced"**: 90% of users never edit hover titles; hiding them removes 4 extra inputs from the default view.
- **Active-player-only rendering**: only the current player's editor is shown so the user is never editing settings that don't affect their site. Saved values for the other player are preserved in the option.
- **Reset per state, not just global**: users tweak one state and want to undo it without losing the others.
- **In-memory draft until Save**: the existing Customize page already has a Save button — reuse it. Don't auto-save on each keystroke.

### 2.5 Backward compatibility

- Existing flat keys keep working. Sites that never open the new editor see no change.
- `displayButtonText` on player 1 keeps reading `buttonTextArr.listen_text` if `players[1]` is not present.
- Old shortcodes (`[atlasvoice listen_text="Hear it"]`) still override at render time.

### 2.6 Risk / edge cases

- SVG sanitization: malicious paste-in must not allow `<script>`. Use `wp_kses` with an SVG whitelist; reject on the client before save.
- Multilingual: per-player texts are language-agnostic strings stored verbatim (same as today's flat keys). Polylang/WPML integrations already filter `tta__button_text_arr`; we'll keep that filter applied to the merged result so existing translation paths still work.
- Cache: `buttonTextArr` is in `wp_localize_script` output — bumping `TEXT_TO_AUDIO_VERSION` on release invalidates the cached enqueue. No page-cache invalidation needed because nothing in the front-end HTML changes until JS rerenders.
- ACF/Polylang title: out of scope.

### 2.7 Files to touch (phase 1)

```
includes/helpers.php
includes/PlayerIcons.php          (new)
admin/TTA_Admin.php
api/TTA_Api_Routes.php            (or add /button-texts route)
admin/js/TextToSpeech.js
text-to-audio-pro/Assets/js/TextToSpeechPro.js     (mirror displayButtonText)
src/dashboard/components/dashboard/customize/Customize.js          (wire draft state + save)
src/dashboard/components/dashboard/customize/design/TTSButtonDesign.js
src/dashboard/components/dashboard/customize/design/ButtonStateEditor.js  (new)
src/dashboard/components/dashboard/customize/design/PlayerStateCard.js    (new)
src/dashboard/components/dashboard/customize/design/IconPicker.js          (new)
src/dashboard/components/dashboard/customize/design/state-presets.js       (new)
languages/text-to-audio.pot       (re-extract on build)
```

### 2.8 Out of scope (deferred to phase 2)

- Plyr players (4/5/6): customize Plyr `controls` array, custom Plyr labels (`i18n` map: play/pause/restart/rewind/seek/fastForward/captions/download/volume/mute/settings), download-button visibility per role, "Now playing…" caption text, and a `wp.hooks.addFilter('ttsProPlayerDesign', …)` hook surfaced from the same UI.
- Loading & error states for Default-style players.
- Per-post overrides via meta box.

---

## 3. Phase 2 plan (Plyr — sketch only, for context)

The Plyr UI is fundamentally different — it's a media chrome, not a stateful single button. Customization knobs there will be:

- Visible controls (multi-select: play, progress, current-time, mute, volume, captions, settings, pip, airplay, fullscreen, download).
- Per-control labels (i18n strings passed to Plyr `i18n` option).
- "Now playing" caption template (`{title}` / `{voice}` / `{language}` placeholders).
- Download permission (already exists in Listening — surface here too).
- Speed presets list.

Same `Customize > Button Texts & Icons` section will gain a third tab "Plyr (4/5/6)" with a different form. The shape of `tta__button_text_arr.players[4]` will diverge from 1/2/3 — that's why I'm proposing the players-keyed structure now.

---

## 4. Approval checklist before I write code

- [ ] Confirm storage shape (option 1a vs 1b in §1.5.1)
- [ ] Confirm icon source: presets + custom SVG paste
- [ ] Confirm hover-title editing belongs here
- [ ] Confirm reset granularity (per-state buttons)
- [ ] Confirm live preview gets a state selector
- [ ] Confirm scope: phase 1 = players 1 and 2 only; section hidden for players 3/4/5/6
- [ ] Confirm whether to add a new REST route or piggyback `/customize`
