# TTS-249 · T2 — Move player-2..6 handling / customization code out of Free

**Closure ref:** `wp-org-review-email-2.2.2.md` → Guideline 5 (Trialware) / 6 (Serviceware)

> ✨ Local features are intentionally withheld: … the player registry exposes only player 1
> **while this code already includes player-2 handling/customization.**

**Status of the wider trialware work (TTS-249 / TTS-247):**

| Fix | Surface | State |
|-----|---------|-------|
| A | License clamp in `get_player_id()` → capability fallback | ✅ done |
| B | Player dropdown is data-driven (`tts_available_players`) | ✅ done |
| C | Pro demo assets (`admin/demos/player2/3`) removed from free ZIP | ✅ done |
| D | Premium analytics routes (heatmap/export/trend/audience) moved to Pro | ✅ done |
| E | `is_pro_license_active()` feature gating removed from free | ✅ done |
| **T2** | **Player-2..6 implementation + customization code still ships in free bundle** | ⬜ **this ticket** |

T2 is the last structural trialware item. The registry already advertises only player 1 in
free — but the **code that renders and customizes players 2–6 still physically ships inside
Free's JS bundles**, which the reviewer reads as locked Pro code in the free ZIP.

---

## 1. Audit — what player-2..6 code is in Free today, and who owns it at runtime

### 1.1 Frontend (the live player on posts) — Pro is already self-sufficient

- Pro's `Includes/TTA_Pro_Actions.php :: tta_enqueue_pro_scripts_callback()` enqueues Pro's **own**
  frontend players:
  - player 2 → `TextToSpeechPro.min.js` (layered on Free's base `TextToSpeech`)
  - players 3–6 → Pro's Plyr bundle (`plyr.min.js` + `plyr.lib.min.js`)
  - `text-to-audio-pro-button.min.js` drives the Pro button.
- Therefore Free's frontend copies are **never executed when Pro is active**:
  - `src/dashboard/buttons/components/TextToSpeechThree.js`
  - `src/dashboard/buttons/components/TextToSpeechFour.js`
  - their imports/usage in `src/dashboard/button.js`
  - `src/dashboard/buttons/components/TextToSpeechTwo.js` (only used by the dashboard preview, see 1.2)
- In **free-only** these never run either (only player 1 is available).
- **Conclusion:** pure dead weight in the free ZIP → **safe to delete** (Category 1).

### 1.2 Customize dashboard — Free-owned, NOT duplicated in Pro

- Pro has **no** `src/dashboard/`, no `Customize.js`, no React player components for the admin.
- The customize tab is **always** Free's `text-to-audio-dashboard-ui.min.js`, even when Pro is active.
- So these Free files render the **Pro previews / Pro player-2 controls when Pro is active**:
  - `src/dashboard/components/dashboard/customize/Customize.js` — preview branches
    `id == 2 ? <TextToSpeech playerId={2}/> : id==3 ? <TextToSpeechThree/> : id==4 ? <TextToSpeechFour/> : id==5/6 ? <TextToSpeechThree/> : <DefaultPreview/>`
  - `src/dashboard/components/dashboard/customize/design/TTSButtonDesign.js` — `supportsButtonStates = playerId === 1 || playerId === 2`
  - `src/dashboard/components/dashboard/customize/design/ButtonStateEditor.js` — `supported = playerId === 1 || playerId === 2`
  - `src/dashboard/buttons/components/TextToSpeechTwo.js` — player-2 (Default Pro) preview component
- **Conclusion:** cannot simply delete — Pro depends on them through Free's bundle (Category 2).

### 1.3 PHP

- `admin/TTA_Admin.php` → `build_player_customizations()` / localized `player_customizations`
  may emit per-player icon maps for id 2. Restrict to id 1 in free.

### 1.4 Build / runtime facts that constrain the design

- Free builds every dashboard bundle with **Laravel Mix `.react()`** →
  `src/dashboard/index.js` → `text-to-audio-dashboard-ui.min.js`.
- **`.react()` bundles a private copy of React/ReactDOM into each output.** Two `.react()` bundles =
  two independent React runtimes.
- Existing cross-plugin hook usage already exists and is **data-only**, never components:
  - `TextToSpeechThree.js` / `TextToSpeechFour.js`: `wp.hooks.applyFilters('ttsProPlayerDesign', {...})`
  - `Settings.js`: `wp.hooks.applyFilters(...)` for post types / statuses
- Free's dashboard script deps already include `wp-element`, `wp-i18n`, `wp-hooks` (via `TextToSpeech`).
- Pro **does** have React build capability: `webpack.mix.js` builds `src/pro-wizard/index.js` with
  `.react()`, and `@wordpress/i18n`, `react`, `react-dom`, `laravel-mix` are installed. A Pro-owned
  dashboard sub-bundle is therefore feasible.

---

## 2. Chosen approach — Idea 1: `@wordpress/hooks` filter injection

Free renders a **slot** at each player-specific spot and asks for content via a filter. Pro's
dashboard bundle (loaded after Free's) registers the filter and supplies the player-2..6 UI. This
matches the capability/filter pattern already used across the refactor and keeps the **live,
reactive** preview (player switch + button-text edits update on every keystroke) in one place.

### 2.1 The React-boundary decision — RESOLVED: mounted island

**Stage-0 finding changed the decision.** Both plugins bundle their **own React 17** via `.react()`;
neither uses `wp-element` as an external. The original 1B (shared-React) target would re-architect
React for *every* bundle in *both* plugins (welcome wizard, css-selectors, bulk-mp3, dashboard,
pro-wizard) — unacceptable blast radius for a compliance cleanup. The existing working cross-plugin
filter (`wp.hooks.applyFilters('ttsProPlayerDesign', …)`) passes **plain data, not components**,
which is exactly why it survives two separate React runtimes.

**Chosen mechanism — mounted island (Idea 2, scoped to the preview slot only):**
- Free's `Customize.js` renders an **empty slot** for player ids > 1:
  `<div id="tts_customize_pro_preview" data-player-id data-button-css data-button-texts />`
  and renders only the **player-1** default preview itself.
- Pro's dashboard-customize bundle (its **own** React 17) finds that node and
  `ReactDOM.render(<ProPreview .../>, node)`, reading `playerId` + saved settings from the
  `data-*` attributes. A small prop-bridge re-renders the island when those attributes change.
- **No shared-React migration.** Each plugin keeps its own React → zero risk to the 8+ existing
  bundles. DRY preserved: Pro renders the **moved** TextToSpeechTwo/Three/Four. All player-2..6 code
  leaves the free ZIP.
- The player-2 **customization controls** (`ButtonStateEditor` for id 2) are gated to player-1-only
  in Free; Pro injects its player-2 editor into a sibling slot the same way (or via the existing
  data-only filter if no interactive React is needed there).

---

## 3. Implementation stages (test between each)

> **Ordering principle — MOVE, never delete-then-recreate.** The player-2..6 components are the
> exact code the Pro filter must render for the preview, and `button.js` is the exact frontend
> renderer Pro needs. Recreating them in Pro would violate DRY and risk drift. So every relocation
> is: **(1) copy the existing file into Pro and wire it → (2) verify Pro renders from its own copy →
> (3) only then delete from Free.** Pro must own the code *before* Free loses it.

### Stage 0 — Pre-flight: confirm Pro's frontend pro-button build ownership
- `npm run copyProButton` in Free copies Free's built `text-to-audio-pro-button.min.js` into Pro.
  Pro enqueues `TTA_PRO_JS_URL/build/text-to-audio-pro-button.min.js`.
- **Verify** whether that Pro build is produced from **Pro's own source** or is still just a copy of
  Free's `button.js` build. If it's a copy, that copy-dependency must be cut (Pro builds its own)
  **before** `button.js` can leave Free. Record the finding here before proceeding.

### Stage 1 — Shared-React build config (1B only)
- **Free `webpack.mix.js`** and **Pro `webpack.mix.js`**: alias `react` → `React` and
  `react-dom` → `ReactDOM` as **externals** mapped to `wp-element`, OR use
  `@wordpress/dependency-extraction-webpack-plugin`. Confirm `wp-element` is a script dependency of
  every affected bundle.
- Rebuild Free dashboard bundle; smoke-test the whole dashboard renders (no hook errors).
- **Gate:** if the shared-React migration destabilizes other dashboard bundles, fall back to 1A and
  skip this stage.

### Stage 2 — MOVE player code into Pro (Pro owns it first; Free still intact)
- **Copy** these existing files from Free into Pro's new dashboard-customize source tree
  (`text-to-audio-pro/src/dashboard-customize/`), unchanged where possible:
  - `buttons/components/TextToSpeechTwo.js` (player-2 / Default Pro preview)
  - `buttons/components/TextToSpeechThree.js` (players 3/5/6 preview)
  - `buttons/components/TextToSpeechFour.js` (player-4 preview)
  - `button.js` (frontend pro-button renderer — players 2..6) → Pro's own pro-button entry
- Build them in Pro (`webpack.mix.js` entries; `.react()`; shared-React externals from Stage 1).
- **Test:** Pro builds cleanly; the moved components import/compile in Pro. Free is still untouched
  and fully working at this point.

### Stage 3 — Pro dashboard sub-bundle registers the filters (Pro renders from its own copy)
- New `src/dashboard-customize/index.js` in Pro, built via `.react()` →
  `Assets/js/build/text-to-audio-dashboard-pro.min.js` (the stub asset name already exists).
- It registers, rendering the **moved** components:
  - `addFilter('tts_customize_preview', 'tta-pro', (def, ctx) => ctx.playerId>1 ? <ProPreview {...ctx}/> : def)`
    — `<ProPreview>` wraps the moved TextToSpeechTwo/Three/Four.
  - `addFilter('tts_customize_controls', 'tta-pro', (def, ctx) => ctx.playerId===2 ? <ProStateEditor .../> : def)`
- Pro enqueues this bundle on the AtlasVoice admin page **after** Free's
  `text-to-audio-dashboard-ui` (dependency-ordered), registering filters at module top-level so they
  exist before Free renders the customize tab.
- For the frontend: confirm Pro's own pro-button build (from Stage 2) renders players 2..6 on posts.
- **Test (Free+Pro, with Free still containing its old code too):** customize preview + controls
  render from **Pro's** copy for players 1–6; frontend players 2–6 play from Pro's build; live
  updates on player switch + button-text edits; no "two React" console errors. (Confirms Pro is
  self-sufficient *before* we strip Free.)

### Stage 4 — Strip player-2..6 code from Free (Pro now owns everything)
- `Customize.js`: replace the `id == 2/3/4/5/6` preview branch chain with
  ```js
  applyFilters('tts_customize_preview', <DefaultPreview ... />, { playerId, buttonCSS, buttonTexts })
  ```
  Free's default branch renders only the player-1 (and the existing Default/Default-Pro live
  `ButtonStateEditor` draft) preview. Remove the TextToSpeechTwo/Three/Four imports.
- `TTSButtonDesign.js` + `ButtonStateEditor.js`: change `playerId === 1 || playerId === 2` →
  player-1 only, and expose `applyFilters('tts_customize_controls', null, { playerId, ... })` where
  Pro injects the player-2 editor.
- **Delete** from Free: `TextToSpeechTwo.js`, `TextToSpeechThree.js`, `TextToSpeechFour.js`, and
  `button.js` (plus the `copyProButton` script / `webpack.mix.js` entry if Free no longer builds it).
- `TTA_Admin.php`: restrict `player_customizations` localize payload to id 1.
- Rebuild Free. **Test (Free-only):** customize tab shows player-1 preview + controls only; stale
  Pro id falls back cleanly; **grep the built bundles** to confirm no `TextToSpeechTwo/Three/Four`
  or player-2 customization code remains in the free ZIP.

### Stage 5 — Regression matrix

| Scenario | Frontend players | Customize preview | Customize controls |
|----------|------------------|-------------------|--------------------|
| Free-only | player 1 only | player 1 only | player 1 only |
| Free + Pro | players 1–6 play | players 1–6 render | player-1 & player-2 editors |
| Pro removed, stale id=3 saved | falls back to 1, no JS error | falls back to 1 | falls back to 1 |

Plus: `grep` the built free `text-to-audio-dashboard-ui.min.js` (and confirm `button.js` /
pro-button build no longer ships from free) to verify **no `TextToSpeechTwo/Three/Four` or
player-2 customization code remains** in the free ZIP.

---

## 4. Files touched

**MOVED Free → Pro (copy into Pro + wire in Stage 2/3, delete from Free in Stage 4):**
- `src/dashboard/buttons/components/TextToSpeechTwo.js` → Pro `src/dashboard-customize/`
- `src/dashboard/buttons/components/TextToSpeechThree.js` → Pro `src/dashboard-customize/`
- `src/dashboard/buttons/components/TextToSpeechFour.js` → Pro `src/dashboard-customize/`
- `src/dashboard/button.js` (frontend pro-button renderer, players 2..6) → Pro's own pro-button entry

**Free (edit — Stage 4):**
- `src/dashboard/components/dashboard/customize/Customize.js` — preview branches → `tts_customize_preview` filter; drop moved imports
- `src/dashboard/components/dashboard/customize/design/TTSButtonDesign.js` — player-1-only gate + `tts_customize_controls` slot
- `src/dashboard/components/dashboard/customize/design/ButtonStateEditor.js` — player-1-only gate
- `admin/TTA_Admin.php` — `player_customizations` localize → id 1 only
- `webpack.mix.js` — shared-React externals (1B); remove `button.js` entry once it lives in Pro
- `package.json` — remove/retarget `copyProButton` if Free no longer builds the pro-button

**Pro (new / edit):**
- `src/dashboard-customize/index.js` (new) — registers `tts_customize_preview` + `tts_customize_controls`, rendering the **moved** components via `<ProPreview>` / `<ProStateEditor>`
- moved `TextToSpeechTwo/Three/Four.js` + `button.js` (pro-button entry) under Pro's source tree
- `webpack.mix.js` — build the new dashboard sub-bundle + pro-button from Pro source; shared-React externals (1B)
- `Includes/TTA_Pro_Actions.php` (or admin enqueue) — enqueue the dashboard sub-bundle after Free's `text-to-audio-dashboard-ui`

---

## 5. Risks

- **Highest-risk change in the project:** touches the live customize dashboard and the frontend
  player rendering across all 6 players. Stage between commits and test each scenario.
- **Two-React trap:** the whole approach hinges on Stage 0 (shared React) for 1B. If it can't be
  stabilized, drop to 1A (data-only filter) — still removes player-*specific* code, keeps one
  generic renderer in free.
- **Enqueue ordering:** Pro's dashboard sub-bundle must load *after* Free's and register filters
  before Free renders the customize tab (Free's React render happens on DOM-ready; Pro's
  `addFilter` must run first — enqueue as a dependency of, or before, the dashboard-ui handle, and
  register filters at module top-level).
- **No data migration:** `buttonSettings.id` is unchanged throughout; only *where the code lives*
  moves.

---

## 6. Commit / release notes

- Free + Pro both change → two commits, `TTS-249:` prefix, no Co-Authored-By, git flow.
- Not a release commit (no version-only message); version bump for 2.2.2 happens in the separate
  release step after T2 + A1 land.
