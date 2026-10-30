---
# gstack: design-md-format=spec
name: AtlasVoice
description: A calm, native wp-admin home for a site's voice. WordPress parts, one indigo brand layer, laid out like a desktop app that fits the screen. Same system as AtlasMCP, Smart Local AI and AtlasAR.
colors:
  brand: "#5646e5"
  brand-hover: "#4536c9"
  brand-ground: "#eeedfd"
  brand-ink: "#3a2db3"
  on-brand: "#ffffff"
  canvas: "#f0f0f1"
  surface: "#ffffff"
  surface-sunken: "#f6f7f7"
  surface-selected: "#eeedfd"
  border: "#dcdcde"
  border-strong: "#a7aaad"
  text: "#1e1e1e"
  text-muted: "#50575e"
  text-subtle: "#757575"
  success: "#007a29"
  success-ground: "#edfaef"
  warning: "#8a5a00"
  warning-ground: "#fcf9e8"
  error: "#b32d2e"
  error-ground: "#fcf0f1"
  info: "#2145e6"
  info-ground: "#eef2fd"
  pro: "#1d2327"
  on-pro: "#f3d27a"
  focus: "#5646e5"
  player-default: "#184c53"
typography:
  page-title:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif
    fontWeight: 600
    fontSize: 20px
    lineHeight: 1.3
  section-title:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif
    fontWeight: 600
    fontSize: 14px
    lineHeight: 1.4
  body:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif
    fontSize: 13px
    lineHeight: 1.5
  label:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif
    fontWeight: 500
    fontSize: 11px
    letterSpacing: 0.02em
  stat:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif
    fontWeight: 600
    fontSize: 24px
    fontFeature: tnum
  mono:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace
    fontSize: 12px
rounded:
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.sm}"
    height: 32px
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand}"
    borderColor: "{colors.brand}"
    rounded: "{rounded.sm}"
  input:
    borderColor: "{colors.border-strong}"
    rounded: "{rounded.sm}"
    height: 40px
  panel:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
  rail-item-current:
    backgroundColor: "{colors.surface-selected}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.md}"
  table-row-selected:
    backgroundColor: "{colors.surface-selected}"
  badge-pro:
    backgroundColor: "{colors.pro}"
    textColor: "{colors.on-pro}"
    rounded: "{rounded.xs}"
  status-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    height: 28px
---

# AtlasVoice

## Overview

**Creative North Star:** the voice desk of the site. The owner opens AtlasVoice to answer three
questions fast: can visitors hear my posts right now, how does it sound, and is anything broken.
Every screen answers those from one fixed frame that fits the window, the way a desktop app does.

**Product context:** the admin dashboard of the AtlasVoice free plugin (`text-to-audio`, wp.org
title "Text To Speech TTS Accessibility") and its Pro add-on (`text-to-audio-pro`), inside
wp-admin. Users are bloggers, publishers, schools, councils, ESL teachers and agencies; 4,000+
active sites. AtlasVoice is also a SaaS client: the natural voice (player 3) and AtlasVoice Cloud
(player 7) are made on atlasvoice.cloud with a monthly character allowance. Peers in the same
family follow the same rules: AtlasMCP (`--atlasmcp-*`), Smart Local AI (`--atlasai-*`) and
AtlasAR (`--atlas-ar-*`).

**Mode per surface:** Operate for every settings screen (dense, scannable, keyboard friendly).
Read for Documentation. Persuade only on Plans & pricing and the Pro description pages in free.
The front-end player is its own surface with its own small stylesheet (see Components → Player).

**Key characteristics:**
- It looks like it belongs in WordPress: `@wordpress/components`, the wp-admin font and grays.
- One indigo brand layer, used for actions and the current place, never as decoration.
- The app fills the window below the admin bar. Lists scroll inside their pane, the page does not.
- Details and editing open in a drawer from the right (the AtlasMCP "Edit prompt" panel pattern).
- A thin status bar at the bottom always shows Live / Staging, the voice and this month's usage,
  and holds the one "Live for visitors" switch.

**Release:** ships in Free 2.5.0 / Pro 3.6.0 (after 2.4.0 is stable), WordPress 6.6 minimum. The
Pro 3.9.0 release requires Free 2.5.0. Build plan and phases: `atlasvoice/plan/design-system-tts-347/`
in atlasaidev-internal (TTS-347).

## The three rules this system inherits (shared with AtlasMCP, Smart Local AI and AtlasAR)

1. **WordPress parts first.** Buttons, toggles, inputs, selects, tabs, notices, modals, dropdowns,
   tooltips, colour palettes, sliders, token fields and the snackbar come from
   `@wordpress/components` (core `wp-components`, never bundled). We only write our own markup for
   layout and for the few things WordPress has no part for (the app shell, data tables, the
   drawer, the status bar, the live preview, and the front-end player).
2. **A thin brand layer, scoped, on top of WordPress's own design system.** WordPress 7.1 ships
   design tokens (`--wpds-*`, from `@wordpress/theme`) and `wp.theme.ThemeProvider`. The app is
   wrapped in `ThemeProvider` with `color.primary` set to the brand indigo, which recomputes the
   whole `--wpds-color-*` set (and the legacy `--wp-admin-theme-color`) for our subtree only. Our
   own tokens are CSS custom properties named `--atlasvoice-*` on `.atlasvoice-root` (never
   `:root`), and each one aliases a `--wpds-*` token with a fallback value. **AtlasVoice supports
   WordPress 6.6**, so the fallbacks carry the full look when `ThemeProvider` or the tokens are
   missing: on 6.6–7.0 the app sets `--wp-admin-theme-color: #5646e5` on its root instead, and every
   `--atlasvoice-*` token resolves to its fallback.
3. **Prefix everything, leak nothing.** Every class starts with `atlasvoice-` (front-end player:
   `atlasvoice-player-`). Tailwind runs with the `atlasvoice-` prefix, `important: '.atlasvoice-root'`,
   `preflight` off, and our own small reset that only targets elements inside `.atlasvoice-root`.
   Admin CSS is enqueued only on AtlasVoice screens (and the editor panel on post screens). No
   inline `<style>` or `<script>`; data reaches JS through `wp_add_inline_script` /
   `wp_localize_script` on our own handle only.

## Colors

**Strategy:** Restrained. WordPress grays carry 95% of the screen; indigo appears only where the
user can act or where they are. State colors are WordPress's own (success green, warning amber,
error red), darkened to pass 4.5:1 as text on their tinted grounds.

**Light or dark:** light. wp-admin is light, and the plugin must read as part of it. No dark mode
of our own. (The front-end player supports dark themes: it uses the owner's colours, and the
preview has a dark-site switch.)

Named rules:
- `brand` is interaction: primary buttons, links, toggles on, focus rings, the current rail item.
- `surface-selected` marks the selected row or item; it is the only tinted background a list uses.
- Status never relies on color alone: every chip has a word ("Live", "Staging", "Ready",
  "Outdated", "Failed", "Connected").
- No gradients anywhere. The aqua "signal" colour and the web fonts of the earlier TTS-347 draft
  are dropped.
- The Pro badge is dark ink with a gold label, the same treatment every AtlasAiDev plugin uses.
- `player-default` (#184c53, "Classic teal") is the front-end player colour existing sites already
  have; it is a preset, not a brand colour.

## Typography

The wp-admin system stack, on purpose: no web font, no extra request, nothing to disclose in the
readme. 20px page title, 14px section title, 13px body, 11px labels, 24px tabular numbers for
stats, 12px mono for selectors, shortcodes, keys and file names. The front-end player inherits the
system stack too, so it never pulls a font into the visitor's page.

## Layout

**The app shell (desktop app frame):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ top bar 64px: title · chip · [ search box   Ctrl K ] · action · 🔔 · ?   │
├────────────┬─────────────────────────────────────────────┬───────────────┤
│ left rail  │ sub-tabs (TabPanel)                          │ drawer 560px  │
│ 232px      │ main pane (its own scroll) │ live preview    │ slides in over│
│ grouped:   │ cards, tables, forms       │ 400px (Voice,   │ a dim page on │
│ Voice ·    │                            │ Player, SEO)    │ row or Edit   │
│ On your    ├────────────────────────────┴─────────────────┤               │
│ site · …   │ sticky footer: Unsaved changes · Save        │               │
├────────────┴─────────────────────────────────────────────┴───────────────┤
│ status bar: ● Live · Emma · Natural voice · ▬ 23% of characters ·         │
│             182 of 214 posts have audio · Pro licensed · Live for visitors│
└──────────────────────────────────────────────────────────────────────────┘
```

- The shell is `height: calc(100vh - var(--wp-admin--admin-bar--height, 32px))`, sticks under the
  admin bar and never makes the page scroll. Only the main pane, the preview and the drawer scroll.
- **Rail groups:** (top) Overview, Setup (until finished) · **Voice**: Voice, Pronunciation,
  Languages, Your own provider, AtlasVoice account · **On your site**: Player, What is read, Audio
  library · **Results**: Insights, SEO & AI Search · **Site health**: Health, Versions, Advanced,
  Privacy · **Help**: Licence & account (Pro only), Plans & pricing, Documentation, More plugins.
- **One main action per screen** in the top bar: Overview → Go live (staging) or View as a visitor;
  Player → View as a visitor; What is read → Pick on a page; Audio library (Pro) → Make missing
  audio. Everything else lives in the pane.
- **Go live has one home:** the status-bar switch "Live for visitors" (plus Overview while in
  staging, the toolbar node and the last setup step). Every route opens the same confirmation.
- **Admin notices** on our screens are moved, never hidden: WordPress prints them as usual, then
  the app gathers them into the Notices bell with a count (AtlasVoice's own: staging, usage,
  update + roll back, translation pack, review; and every other plugin's). Outside AtlasVoice the
  old rule stays: at most one AtlasVoice notice per screen, by priority.
- **Screens with lots of settings get sub-tabs**, not one long page: Player (Look · Placement ·
  Buttons & words · Read-along · AI notice · Shortcode & block), What is read (Where it appears ·
  Text to read · Page areas), Audio library (All posts · Clean up, Pro · Settings), Insights
  (Overview · Posts · Listeners · Tracking). Rule of thumb: taller than two window heights at 1440×900 → split it.
- **Lists open a drawer.** Rows and their Edit buttons open a 560px drawer from the right over a
  dimmed page: header (kicker · title · close), body sections, footer actions. Esc or a click on the
  dim area closes it; focus moves into it. Used for: pronunciation words, provider keys, page-area
  rules, review text (Audio library), post stats (Insights), email report, connection details,
  text before/after, icon and tooltip editors, roll-back plan, the CDN fix, language coverage.
  Modals are only for confirmations (Go live, back to staging, remove a key, delete files, clear
  statistics, deactivate) and short flows.
- **Live preview column** (Voice, Player, SEO): a real post in a browser frame with the player in
  every state, light/dark site and desktop/phone. It updates before Save, so the owner sees the
  result first. Below 1100px it moves under the form.
- **Save model:** forms keep a Save button, now in the sticky footer with "Unsaved changes / All
  changes saved". Instant actions (Go live, connect, delete) confirm and act at once. The save
  moment and the stored options are the same as today (see "Nothing stored changes").
- Grid: 8px base, 12/16/24 steps. Section padding 16px, gap between sections 16px.
- **Responsive, four widths** (checked at 1440, 1100, 820 and 390 px):
  - 1280px and wider: full rail with labels.
  - 782–1279px: the rail shrinks to icons (with tooltips); the drawer is 520px; the preview is 340px.
  - below 1100px: the live preview moves under the form.
  - below 960px: the search box becomes an icon that opens it full width, grids and stat strips
    stack.
  - below 782px (wp-admin mobile): the rail becomes a slide-in menu behind a menu button, the page
    scrolls normally with a sticky header, tabs, footer and status bar, tables scroll sideways
    inside their box (never the page), the drawer is full width.

## Elevation & Depth

Flat. Panels are separated by a 1px `border` line, not shadows. Only floating layers (drawer,
dropdowns, the search results, the snackbar, the docked player on the front end) get a shadow:
`0 8px 24px rgba(0,0,0,.12), 0 1px 3px rgba(0,0,0,.08)`. No glows, no blur.

## Shapes

Small radii, like WordPress: 4px for controls, 6px for rail items, 8px for panels. Pills only
for counts and the docked player. Nothing nests a card inside a card.

## Components

- **Buttons, toggles, inputs, selects, checkboxes, radios:** WordPress components only
  (`Button` primary/secondary/tertiary/link, `ToggleControl`, `TextControl`, `SelectControl`,
  `CheckboxControl`, `RadioControl`, `TextareaControl`), 40px (`__next40pxDefaultSize`) in forms.
- **Choices with a description** (voice engine, placement, setup answers): a tile grid of real
  `<button role="radio">` elements styled as Cards, with the check icon and the word "In use" /
  "Recommended". Short either/or choices use `ToggleGroupControl` with `isAdaptiveWidth`.
- **Colours:** `ColorPalette` with the five style presets' colours and a custom picker; a live
  contrast line under "Text and icons" (4.5:1 or it says why not).
- **Sizes and spacing:** `UnitControl` (border, text size, radius) and `BoxControl` for "Space
  around the player" with px and %; each side keeps the unit it was saved with (TTS-296).
- **Lists of words** (skip categories, tags, posts, areas, element types, phrases, custom fields):
  `FormTokenField` with suggestions. Free limits show as `maxLength` plus one line of help.
- **Sliders:** `RangeControl` (speed, pitch, volume, ElevenLabs stability/similarity/style/speed,
  highlight fade).
- **Data table** (`.atlasvoice-table`): 52px rows, sticky header, row hover, selected row tint,
  checkbox column (Pro Audio library), server-side paging by 50.
- **Drawer** (`.atlasvoice-drawer`): see Layout.
- **Stat strip:** up to four numbers in one Card, divided cells.
- **Status chip:** tinted ground + darker text + dot + a word.
- **Usage meter:** characters used / allowance, a 6px bar (amber at 80%, red at 95%), the reset
  date and, past 80%, the run-out date. Same component in Overview, the Voice preview, AtlasVoice
  account and (compact) the status bar.
- **Search box** (top bar, centre): finds screens, settings and actions, and matches the **old
  setting names** too ("Aliases", "Select Player", "Bulk MP3 Generate"), showing "was …" in the
  result. Ctrl+K and `/` focus it; ↑ ↓ Enter Esc. The same items are registered with WordPress's
  command palette (`@wordpress/commands`), so Ctrl+K anywhere in wp-admin finds AtlasVoice.
- **Player (front end):** one family, three forms, every state designed:
  - forms: button (browser voice), bar (MP3 voices and the Pro browser player), dock (while
    scrolling; the space in the article is kept so text never jumps; full controls on phones);
  - states: ready, playing, paused, finished, phone blocked ("Tap again to listen"), browser can't
    speak, making audio (part n of m), first part playing (progressive), could not be made (+ Try
    again), characters used up (admins see a note; visitors see only the browser-voice button),
    staging note (admins only), AI notice above or below, "Voiced by AtlasVoice" credit (free
    service, only when the service asks), listener settings panel (gear), speed menu.
  - Audio Jobs states (TTS-354): first part playing while the rest is made (part n of m), joined
    someone else's job (pays nothing), device-voice fallback when audio can't be made, daily limit
    reached (both with an editors-only reason), and Outdated audio on the live page with
    "Remake now" (editors only). Visitors never see a technical error.
  - classes `atlasvoice-player-*`; the old player classes stay as aliases so theme CSS keeps
    working; `ttsProPlayerDesign`, `ttsProPlayerOptions`, `ttsProLink` and
    `tts_pro_player_customizations` keep working.
- **Pro features in the free plugin (WordPress.org guideline 5):** never a Pro form, never a
  disabled Pro control, never a greyed-out settings screen. A Pro feature appears only as
  (a) a description page with trial / plans links (SEO & AI Search, Plans & pricing), or (b) one
  dashed "PRO · what it adds · See Pro" line where the feature would sit. Pro-only tabs and rows
  (Audio library → Clean up, Licence & account, AtlasVoice Cloud engine, a voice per language,
  skip parts, numbers as words, read as the visitor sees it, bulk selection, 90-day ranges,
  export, email report, busiest hours, the Pro setup steps) are simply not there in free. The Pro
  plugin renders its own screens, tabs and rows through `@wordpress/hooks` slots on the free app's
  single `window.atlasvoice.ui` surface; the free plugin ships no Pro UI code.
- **Your own provider is free** (owner, 26 Oct): Google Cloud, OpenAI and ElevenLabs keys,
  Google Cloud Storage copies and every provider setting live in the free plugin, billed by the
  provider. The code moves from Pro to Free the way player 3 did, with the same option keys.
- **Pro connects the natural voice automatically** (owner, 21 Oct): kept, and shown clearly —
  a green "Connected automatically with your Pro licence" notice on Voice, with Connection details
  (change email, disconnect) in a drawer.
- **Audio Jobs (TTS-354):** one server-side job per post + language + voice + text. One shared
  set of job states (Ready · Outdated · Missing · Failed · Making n of m) is read by:
  - Audio library → All posts (status filters, Try again, and in Pro a bulk queue drawer with a
    character and cost estimate);
  - Audio library → Settings (when audio is made, what happens when text changes, daily and
    per-post limits, the languages that can have paid audio, background work);
  - the editor's AtlasVoice → Audio panel (status per language, Remake / Try again keeping
    finished parts, and a per-post "when is audio made" choice);
  - the posts-list Audio column, its filter and row action (bulk actions in Pro);
  - the status bar ("n audio jobs running", today's characters against the limit).
  These places can never disagree.
- **Empty, loading, error states** for every list: spinner or skeleton while loading, one sentence
  + one action when empty, an inline `Notice` when a request fails.
- **Icons:** `@wordpress/icons`, bundled with the dashboard. No Dashicons inside the app. The
  front-end player keeps its own three glyphs (play, pause, replay) and accepts an owner SVG.
- **WordPress parts used:** `Card`, `ItemGroup`/`Item`, `Panel`/`PanelBody`, `TabPanel`,
  `ToggleGroupControl` (`isAdaptiveWidth`), `SearchControl`, `SelectControl`, `TextControl`,
  `TextareaControl`, `ToggleControl`/`FormToggle`, `CheckboxControl`, `RadioControl`,
  `RangeControl`, `ColorPalette`, `UnitControl`, `BoxControl`, `NumberControl`, `FormTokenField`,
  `FormFileUpload`, `BaseControl`, `Dropdown` + `MenuGroup`/`MenuItem` (notices, help, export),
  `Notice`, `Modal`, `SnackbarList`, `Tooltip`, `Spinner`.

## Accessibility (WCAG 2.2 AA): AtlasVoice is an accessibility product

The bar is WCAG 2.2 AA for every surface: admin screens, setup, the post editor panel (block and
Classic), the Audio library and bulk queue, the WordPress screens, and above all the front-end
player that visitors use.

- **Keyboard:**
  - every control is a real `button`, `input` or `a`, reachable with Tab;
  - the search opens with Ctrl K or `/` and moves with ↑ ↓ Enter Esc;
  - drawers move focus inside and close with Esc;
  - tables that scroll sideways are focusable regions with a name;
  - nothing interactive is nested inside another control (for example, a voice card's pick,
    favourite and sample are three separate buttons).
- **Focus:** a visible 2px brand outline on everything we style. WordPress components keep their own.
- **Names:** icon-only buttons have `aria-label`. The player's buttons say what they do ("Pause",
  "Download MP3", "Playback speed 1 times"). The seek bar is a `slider` with a value. Job
  progress is a `progressbar` with "Part n of m".
- **Status:** never colour alone. Every chip has a word (Ready, Outdated, Missing, Failed,
  Making 9 of 14, Live, Staging). Progress and "Preparing…" messages are `role="status"`, and a
  failed generation is `role="alert"`.
- **Contrast:** at least 4.5:1 for text, on light and dark sites. The Look screen shows the
  player's contrast ratio live and warns below 4.5:1. Muted text is #50575e on light and #c3c4c7
  on dark, never lower.
- **The player for listeners:**
  - the docked player keeps its space in the article, so text never jumps;
  - phones always get the full-width player with every control;
  - read-along highlighting is optional and its colours pass contrast;
  - "Listen to a selection" works from the keyboard;
  - the optional AI notice is also read out to screen readers;
  - when audio can't be made, visitors get the device voice instead of an error.
- **Motion:** `prefers-reduced-motion` turns off slides, spinners and the waveform animation.
- **Language:** `lang` on the page, and the player and its notices in the visitor's language.
- **Checked (26–27 Oct 2026):**
  - axe-core WCAG 2.2 AA run on all 32 screens and sub-tabs, plus the editor, front-end and
    WordPress views, in Pro, Free and at 390 px: 105 pages, 0 violations
    (`a11y-audit.cjs` in the plans folder);
  - responsive at 1440 / 1100 / 820 / 390 px with no sideways scroll.
  - Still to do in the build: a manual screen-reader pass (NVDA and VoiceOver) and a
    keyboard-only run of every flow, as part of the QA subtask.

## Do's and Don'ts

- Do use a WordPress component whenever one exists, and style it only through tokens.
- Do keep every action reachable without page scroll at 1440×900.
- Do show an item's details and edits in the drawer; keep modals for confirmations.
- Do keep every existing URL working (old `#/` routes and submenu slugs map to their new home).
- Do show the effect before Save (live preview) wherever the setting changes what visitors see.
- Don't change a stored option key, post-meta key, field name or saved value format.
- Don't put a colored left border on cards or notices of our own.
- Don't add a second primary button, a gradient, or a shadow on a resting panel.
- Don't hide another plugin's admin notice; move it into the bell.
- Don't use Tailwind's preflight or any selector outside `.atlasvoice-root`.
- Don't download anything without a click (translation packs, plugin installs).

## Motion

- **Approach:** minimal-functional.
- **Easing:** enter ease-out, exit ease-in.
- **Duration:** 120ms for hover and toggle, 180ms for the drawer slide.
- Respect `prefers-reduced-motion`: no slide, no spinner rotation, just show.
- **The one authored moment:** the status-bar dot pulses once when the site goes from staging to live.

## Nothing stored changes (existing users first)

4,000+ sites keep working through the update:

- Every option and meta key, field name and value format stays as it is today: `tta_settings_data`,
  `tta_customize_settings` (incl. `buttonSettings.id` 1–7), `tta_listening_settings`,
  `tta_highlight_settings`, `tts_text_aliases`, `tta_analytics_settings`, `tta_pro_seo_settings`,
  `tts_mp3_file_urls`, `tta_atlasvoice_service`, `tta__button_text_arr`, the provider keys, and the rest.
- New settings are added next to the old ones, never in place of them: `tta_admin_ui`,
  `tta_player_style`, `ai_notice_*`, the margin unit per side, per-post custom text meta, user-meta
  favourites. Missing keys fall back to today's behaviour.
- Saves merge into the stored option (`array_replace` on the stored value) instead of replacing it,
  so a screen that does not show a field can never wipe it (Phase 0, first part of 2.5.0).
- The new front-end player look is **opt-in for existing sites** and the default for new installs.
  Existing sites keep "Classic teal" and their exact colours.
- The voice engine choice derives the player id; saved ids 1–7 are read as before.
- Old URLs keep working (table below). Old notice dismissals are kept.

## Information architecture (nothing dropped)

| Today | New home | Old URL keeps working |
|---|---|---|
| Settings (`#/`): post types, auto-add, exclusions, status | What is read → Where it appears | `page=text-to-audio` and `#/` open Overview; search finds every old label |
| Settings: title/excerpt, intro/outro, number format, read from DOM, content wrapper, TTS status column | What is read → Text to read (Advanced in a closed panel) | `#/` |
| Settings: content selection rules, include/exclude selectors, tags, texts, per-type overrides | What is read → Page areas (rules table + rule drawer + on-page picker) | `#/`; `?atlasvoice_picker=1&scope=…` unchanged |
| Settings: toolbar indicator, per-post toggle, picker button, dashboard widget, tab-switch playback, clear cache, delete data on uninstall, reset (constant-gated), run wizard | Site health → Advanced | `#/` |
| Settings: mode (staging / live) | Status bar "Live for visitors" + Overview + toolbar + setup last step | — |
| Customization (`#/customize`): select player | Voice → What makes the sound (engine sets the player) | `#/customize` → Player |
| Customization: position, floating, display to, who can download | Player → Placement | `#/customize` |
| Customization: colours, hover, margins, height, font, border, radius, width | Player → Look (presets, palettes, More style options) | `#/customize` |
| Customization: button texts & icons, player 2 texts | Player → Buttons & words | `#/customize` |
| Customization: shortcode | Player → Shortcode & block (with every option, block, Elementor widget) | `#/customize` |
| Customization: MP3 date range | Audio library (Pro setup step "Audio files") | `#/customize` |
| Listening (`#/listening`): language, voice, speed, pitch, volume; AtlasVoice TTS connect | Voice | `#/listening`, `#/listening?setup=atlasvoice-tts` |
| Listening: ChatGPT, ElevenLabs, Cloud voice settings | Voice (engine) + Your own provider (provider drawer) | `#/listening` |
| Listening: multilingual mapping (Pro) | Languages | `#/listening` |
| Integrations (`#/integrations`): Google key, GCS, OpenAI, ElevenLabs keys | Your own provider (free since 26 Oct) | `#/integrations` → Your own provider |
| AtlasVoice service usage, plan, seats (SaaS) | AtlasVoice account (new) | — |
| Highlight (`#/highlight`) | Player → Read-along | `#/highlight` |
| Aliases (`#/aliases`) | Pronunciation (table + drawer + Try it) | `#/aliases` |
| Analytics (`#/analytics`): charts, range, export, schedule report, tracking switches | Insights: Overview · Posts · Listeners · Tracking; Email report drawer | `#/analytics` |
| SEO & AI Search (`#/seo`) | SEO & AI Search (Pro); description page in free | `#/seo` |
| Compatibility (`#/compatibility`) | Site health → Health (checks + plugins we work with); ACF → What is read → Text to read | `#/compatibility` |
| Maintenance (`#/maintenance`, Pro) | Audio library → Clean up | `#/maintenance` |
| Versions (`#/versions`) | Site health → Versions (+ roll-back drawer) | `#/versions` |
| Docs / FAQ (`#/faq`) | Help → Documentation | `#/faq` |
| Our Plugins (`#/plugins`) | Help → More plugins | `#/plugins` |
| Bulk MP3 Generate (`page=bulk-mp3-generate`) | Audio library → All posts (review drawer, queue) and Audio library → Settings, run by Audio Jobs (TTS-354) | old slug redirects |
| Pricing (`page=tta-pricing` / `atlasvoice-pricing`) | Help → Plans & pricing | old slugs redirect |
| Freemius Account / Contact / Affiliation (`page=text-to-audio-account` …) | Help → Licence & account (Pro) | Freemius pages stay reachable |
| Free setup wizard (6 steps) and Pro wizard (7 steps) | Setup: Hear it · Where · Voice · Look · (Pro: Audio files · Reports) · Check and go live · Done | `&reset_onboard=true` unchanged |
| Post editor meta box + audio side panel | Editor sidebar tab "AtlasVoice" (Audio · On this post · Listening · Shortcode); Classic Editor side box | — |
| Notices, toolbar node, Plugins row links, deactivation rescue, dashboard widget, Network Admin | Same places, WordPress components, one notice per screen | — |

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-20 | TTS-347 redesign: free to change the UI, never the stored data | Owner rule; 4,000+ live sites |
| 2026-10-21 | WordPress 6.6 minimum from Free 2.5.0 / Pro 3.6.0 | 9 of 457 tracked sites (2.0%) run older |
| 2026-10-21 | Ships from 2.5.0 / 3.6.0, after 2.4.0 is stable; nothing in 2.4.x | Owner |
| 2026-10-21 | New player look opt-in for existing sites, default for new installs | Existing users first |
| 2026-10-21 | Pro keeps connecting the natural voice automatically, shown clearly | Owner |
| 2026-10-21 | Elementor widget as a thin wrapper of the shortcode | About 41% of sites use Elementor |
| 2026-10-26 | Your own provider moves to Free, same option keys | Owner; provider bills the user, wp.org-safe |
| 2026-10-26 | Rebuilt on the shared AtlasMCP system | Owner: one design system for every AtlasAiDev plugin; the first draft used its own components |
| 2026-10-26 | Keep indigo #5646e5 as the brand | Existing AtlasVoice colour; solid only, no gradients, no second accent |
| 2026-10-26 | System font, no web font | Native to wp-admin, no extra request, nothing to disclose (drops the draft's three web fonts) |
| 2026-10-26 | `--atlasvoice-*` tokens alias `--wpds-*` with fallbacks; `ThemeProvider` with `color.primary` | Looks like the block editor on 7.1; fallbacks carry it on 6.6–7.0 |
| 2026-10-26 | `@wordpress/icons` instead of hand-drawn icons | The block editor's own icon set |
| 2026-10-26 | Voice gets its own rail group (Voice, Pronunciation, Languages, Your own provider, AtlasVoice account) | Five topics were tabs of one screen; each is now one click and searchable |
| 2026-10-26 | Site & tools split into Health, Versions, Advanced, Privacy under "Site health" | Nothing hidden inside another screen; same grouping as AtlasMCP |
| 2026-10-26 | One drawer for every details and edit view; modals only for confirmations | Owner's favourite AtlasMCP pattern |
| 2026-10-26 | Go live lives in the status bar switch (plus Overview, toolbar, setup) | One place, always visible, one confirmation |
| 2026-10-26 | Notices move into the bell inside AtlasVoice, never hidden | Same as AtlasMCP; the draft hid them |
| 2026-10-26 | Forms keep an explicit Save in a sticky footer (the draft saved every change instantly) | Same save moment as today; nothing written behind the owner's back |
| 2026-10-26 | Search matches old setting names | Existing users find moved settings without a map |
| 2026-10-26 | Hash routes kept (`#/screen/sub`), every old route aliased | The current dashboard uses HashRouter; bookmarks and support links keep working |
| 2026-10-26 | No Pro forms or disabled Pro controls in free; Pro renders through hooks | WordPress.org guideline 5 |
| 2026-10-27 | MP3 generation for players 3–7 becomes server-side **Audio Jobs** (TTS-354): one job per post + language + voice + text fingerprint; screens are the editor's AtlasVoice → Audio tab, Audio library (All posts · Clean up · Settings) with a bulk queue, status-bar usage and the posts-list Audio column | Fixes duplicate paid generation, partial or overwritten MP3s, stuck "Generating…", stale audio and bulk/page differences. The engine has its own branch and the screens use it only through REST. Design: canvas TVKNutmwFhhTs4b9Xqt7JC, `docs/design/audio-jobs-prototype.html` |
