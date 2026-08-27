# TTS-285 — Namespace Plyr as `atlasvoice`, and upgrade it from 3.6.8

Two related pieces of work on the third-party player we ship for the MP3 players (3–6):

1. **Prefix** every Plyr class name so our player cannot collide with a theme's or another
   plugin's copy of Plyr.
2. **Upgrade** the vendored copy, which is two minor versions behind.

**Nothing is implemented. This ticket is research + a plan only.**

---

## What we actually ship today

| | Finding | Evidence |
|---|---|---|
| Version | **3.6.8** | The vendored bundle's own default `iconUrl` is `cdn.plyr.io/3.6.8`. It also lacks `plyr__progress__marker`, a class 3.7 introduced. |
| Latest | **3.8.4** | `registry.npmjs.org/plyr/latest` |
| How it is vendored | **Pre-built file committed to the repo**, not an npm dependency. `plyr` does not appear in `package.json` and there is no `node_modules/plyr`. | `Assets/js/build/plyr.lib.min.js` (122 KB), added 2023-07-31 in `14ded0481`, last touched May 2025. Imported as `import * as PlyrLib from './build/plyr.lib.min'` (`Assets/js/plyr.js:13`). |
| CSS | Separately vendored, also pre-built | `Assets/css/plyr.min.css` (37 KB), **54 distinct `.plyr*` class selectors** and **55 `--plyr-*` custom properties**. |
| Sprite | Inlined into the page as `#sprite-plyr`, with symbol ids `plyr-play`, `plyr-pause`, `plyr-settings`, … | Rendered page source |

Because it is a committed build artifact rather than a dependency, "upgrade" is currently a manual
file swap with no lockfile, no changelog trail and nothing that tells us it is stale. That is the
root problem behind both halves of this ticket.

---

## Part 1 — The `atlasvoice` prefix

### What Plyr actually supports

Read from source rather than assumed:

**`classNames` — a fully overridable config object** (`src/js/config/defaults.js`). Every class Plyr
writes at runtime comes from here, roughly 40 entries:

```js
classNames: {
    type: 'plyr--{0}',
    provider: 'plyr--{0}',
    video: 'plyr__video-wrapper',
    control: 'plyr__control',
    controlPressed: 'plyr__control--pressed',
    playing: 'plyr--playing',
    paused: 'plyr--paused',
    stopped: 'plyr--stopped',
    loading: 'plyr--loading',
    hover: 'plyr--hover',
    tooltip: 'plyr__tooltip',
    hidden: 'plyr__sr-only',
    hideControls: 'plyr--hide-controls',
    isTouch: 'plyr--is-touch',
    uiSupported: 'plyr--full-ui',
    noTransition: 'plyr--no-transition',
    // + nested: display.time, menu.*, captions.*, fullscreen.*, pip.*,
    //   airplay.*, previewThumbnails.*
}
```

Plyr merges user options over these, so passing our own `classNames` is a supported, first-class
way to rename them — no fork required.

**`iconPrefix`** — separate and narrower. Default `'plyr'`. It prefixes the **SVG sprite symbol ids**
(`#plyr-play`), not the CSS classes. Its documented purpose is exactly ours: *"to prevent clashes if
you're using your own SVG sprite but with the default controls."*

**`selectors`** — a third object (`container: '.plyr'`, `progress: '.plyr__progress'`, …) used for
querying. If `classNames` changes, these must change to match.

### What Plyr does NOT support — the catch

**There is no SCSS class-prefix variable.** I checked `src/sass/plyr.scss` and
`src/sass/settings/cosmetics.scss`: the imports are all `settings/*` value variables (colours,
breakpoints, type), and the class names are hardcoded as literal `.plyr` / `.plyr__…` throughout the
component partials.

So overriding `classNames` alone **breaks all styling instantly** — the JS would emit
`atlasvoice__control` while our 54-selector stylesheet still targets `.plyr__control`. The two must
be renamed together, in lockstep.

### Recommended approach

**Rename in both layers, driven by one constant, and build the CSS ourselves.**

1. Add `plyr` as a real npm dependency at a pinned version instead of a committed blob.
2. Define the prefix once, e.g. `const AV_PREFIX = 'atlasvoice';`.
3. Generate the `classNames` object from it rather than hand-writing 40 strings — every default is
   mechanically `plyr` → `atlasvoice`, so a small mapper over Plyr's own `defaults.classNames` keeps
   us correct across upgrades:

   ```js
   // Illustrative only — not implemented.
   const prefixed = (obj) => Object.fromEntries(
       Object.entries(obj).map(([k, v]) => [
           k,
           typeof v === 'string' ? v.replace(/\bplyr\b/g, AV_PREFIX) : prefixed(v),
       ])
   );
   ```

4. Pass `classNames: prefixed(Plyr.defaults.classNames)`, `selectors` similarly, and
   `iconPrefix: AV_PREFIX`.
5. Build the CSS from Plyr's SCSS with the same rename applied, so `.plyr__control` ships as
   `.atlasvoice__control`. Since there is no prefix variable, this is a post-processing step on the
   compiled output (a PostCSS rename plugin, or a scoped `sed` in the build) — **not** hand-editing
   the minified CSS, which would be undone by the next upgrade.
6. Rename the inlined sprite's symbol ids to `atlasvoice-play` etc. to match `iconPrefix`.

### What this does NOT solve, and must be decided

- **`--plyr-*` custom properties (55 of them).** These are Plyr's own theming variables. They do not
  collide the way class names do — a duplicate definition is scoped to whatever element declares it
  — but if we rename classes and not variables, the codebase ends up half-prefixed. Decide
  deliberately whether `--plyr-color-main` becomes `--atlasvoice-color-main`, and note that renaming
  them breaks any customer CSS that currently overrides them.
- **Our own code depends on the current names.** `plyr--audio`, `plyr__controls`,
  `plyr__controls__item`, `plyr__control` and `data-plyr` attributes are referenced in
  `Assets/js/plyr.js` and hardcoded in the two customize components
  (`src/dashboard-customize/buttons/components/TextToSpeechThree.js`, `TextToSpeechFour.js`). These
  must be updated in the same change or the player renders unstyled — see TTS-284's sibling issue
  about those same files.
- **Customer custom CSS breaks.** `tta_customize_settings.custom_css` is a free-text field; any
  site that has written `.plyr__control { … }` stops working. This is the single biggest
  compatibility risk and needs a decision: ship a compatibility stylesheet aliasing old → new for a
  release or two, or accept the break and document it.
- **`data-plyr` attributes.** `selectors.labels` is `[data-plyr]` and the controls markup uses
  `data-plyr="play"`. Renaming the attribute is a separate decision from renaming classes; verify
  whether `classNames` alone changes it (it does not).

### Why prefix at all

The concrete failure it prevents: a theme or another plugin that also loads Plyr — a common video
plugin choice — puts a second `.plyr` stylesheet on the page. Whichever loads last wins, and our
player silently inherits someone else's control colours, sizing or icon sprite. Prefixing makes our
copy unreachable from their selectors and vice versa.

---

## Part 2 — The upgrade, 3.6.8 → 3.8.4

Two minor versions. Before doing it:

1. **Read the changelog between 3.6.8 and 3.8.4** and list behaviour changes that touch what we use:
   the `waiting` event (TTS-282 depends on it firing when play is pressed on an empty source),
   `player.download`, the `controls` array, `speed` options, `i18n`, and `loadSprite`/`iconUrl`.
2. **Check whether the class list changed.** 3.7 added `plyr__progress__marker`; any new class must
   be included in the prefix mapping, which is the argument for generating the map from
   `Plyr.defaults.classNames` rather than hardcoding it.
3. **Move to an npm dependency** in the same change. Keeping it a committed blob means the next
   upgrade is as invisible as this one was — nothing in the repo currently states which version we
   ship.

### Sequencing

Upgrade **first**, prefix **second**. Doing both at once makes any regression ambiguous: if the
player breaks you will not know whether it is the version bump or the rename. Land the upgrade,
verify the players, then apply the prefix as its own change.

---

## Verification this ticket needs (none done yet)

1. Players 3, 4, 5 and 6 each render, play and generate an MP3.
2. Read-along highlighting (TTS-256) still aligns — it queries player DOM.
3. TTS-282's deferred-generation path still works: `waiting` fires, `load()` recovers, the download
   href populates.
4. The bulk MP3 admin page, which instantiates the same class via `BulkMP3File`.
5. A page where a second, unprefixed Plyr is present — the actual collision this is for.
6. A site with existing `custom_css` targeting `.plyr__*`.

---

## Open questions for the product decision

- Rename the 55 `--plyr-*` custom properties too, or leave them?
- Ship an old → new compatibility stylesheet, or accept that customer `custom_css` breaks?
- Prefix `data-plyr` attributes as well, or classes only?

---

## Related

- TTS-284 — the same two customize components hardcode Plyr class names; whoever touches them for
  the prefix should read that ticket first.
- TTS-282 — depends on Plyr's `waiting` event and `player.download`; both need re-verifying after
  the version bump.
