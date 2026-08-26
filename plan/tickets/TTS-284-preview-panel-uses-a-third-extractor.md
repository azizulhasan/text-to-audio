# TTS-284 — The picker's Preview Content panel uses a third, divergent extractor

## The problem

The Step Rail's **Preview Content** panel is the surface an admin uses to confirm what will be read
aloud before going live. It does not show what will be read.

Two independent implementations are on screen at the same time on
`?atlasvoice_picker=1`:

| Surface | Code | What it is |
|---|---|---|
| DevTools console dump | `getContent()` — `text-to-audio-pro/Assets/js/TTSProHelper.js`, `console.log(content)` at both exit points (:1420, :1461) | The **literal string posted to the TTS provider**, after `removeShortcodes()`, `removeDoubleDelimiters()` and `decodeHTMLEntities()` |
| Preview Content panel | `extractWithRules()` — `text-to-audio/includes/atlasvoice/step-rail.shell.js:917` | A **separate DOM extractor**: clones the selected region, strips exclude-marked nodes, reads text off the clone |

The panel never calls `getContent()` and applies none of its post-processing.

TTS-280 removed exactly this class of drift between the PHP path and the DOM path. This is the same
bug one layer up — and it is the layer the admin actually looks at.

---

## Measured on `/tts-280-edge-cases/?atlasvoice_picker=1`

```
PANEL : X1 paragraph then an empty one followsX2 outer itemX3 nested itemX4 nested item two.X5
        last outerX6 header oneX7 header twoX8 cellX9 cell.X11 caption textX12 preformatted
        lineX13 trailingX14 after a line break...

REAL  : X1 paragraph then an empty one follows. X2 outer item X3 nested item. X4 nested item
        two. X5 last outer. X13 trailing. X14 after a line break...
```

Two distinct failures, both visible in that one line:

**1. No block boundaries at all.** `followsX2 outer itemX3 nested item` — the panel glues blocks
together with no delimiter and no space. So the one thing TTS-280 was raised to fix, and the one
thing the customer complained about, is invisible in the preview. An admin tuning pauses cannot see
pauses.

**2. Exclusions are not applied.** The panel shows `X6 header one`, `X7 header two`, `X8 cell`,
`X9 cell.` (table), `X11 caption text` (figcaption) and `X12 preformatted line` — all of which the
real extractor **drops**, because `tta__settings_exclude_tags` ships with
`table`, `pre` and `figure` in it. The panel is showing the admin content that will never be spoken.

The net effect is a preview that is wrong in both directions at once: it hides the sentence structure
that *will* exist and displays text that *will not* be read.

Note: the meta line read `Saved rule misses DOM — fallback: AtlasVoice markers` on this run, so the
panel was in its stale-rule fallback tier. The divergence is not caused by that — `extractWithRules()`
and `extractFromActiveSystem()` are both local to `step-rail.shell.js` and neither calls the real
extractor.

---

## Why it is not simply "call getContent()"

`getContent()` lives in **Pro**. The Step Rail lives in **Free**, and Free has no DOM extractor at
all — that was the TTS-280 scope decision. So the panel cannot unconditionally call it.

Options, in preference order:

1. **Expose the real extractor as a callable and have the panel use it when present.** Pro publishes
   something like `window.AtlasVoice.extract(root, rules)`; Free's panel calls it when defined and
   falls back to its own DOM walk otherwise. Free then previews with Free's rules, Pro previews with
   the exact string it will post. One surface, honest label either way.
2. **Make the panel render server-side output.** Ask the REST layer for the extracted string for the
   current rules and display that. Accurate for the PHP path, but a round trip per rule change makes
   the picker feel dead, and it would not reflect Pro's DOM path.
3. **Keep three implementations and test them against each other.** Rejected — that is what the
   codebase already does implicitly, and it is how this drifted.

Whatever is chosen, the panel's meta line must state which engine produced the text, so an admin can
tell a real preview from an approximation.

**At minimum, and cheaply:** `extractWithRules()` should apply the `TTA_Speech` boundary delimiters
and the exclude-tags list, both of which are already localised to the page by TTS-280 as
`window.TTS.settings.speech`. That alone fixes both measured failures without any cross-plugin work.

---

## Acceptance criteria

1. For a given post and rule set, the Preview Content panel and the string sent to the provider are
   identical — or the panel says plainly which engine it used and why they differ.
2. Block boundaries appear in the preview: `follows. X2 outer item`, never `followsX2`.
3. Content excluded by `tta__settings_exclude_tags` does not appear in the preview.
4. Holds on Free (PHP path) and on Pro (DOM path).
5. Holds in the stale-rule fallback tier, not only when a selector matches.
6. Verified by comparing the panel text against the console dump on the same page load — not by
   reading the code.

---

## Related

- TTS-280 — removed the same drift between the PHP and DOM extractors; this is the third
  implementation that ticket did not reach.
- TTS-282 — the staging workflow that makes this panel the admin's primary verification tool, now
  that generation no longer fires on every page load.
