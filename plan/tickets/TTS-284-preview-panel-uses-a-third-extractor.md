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

**2. Exclusions are not applied on the fallback tier.** The panel shows `X6 header one`,
`X7 header two`, `X8 cell`, `X9 cell.` (table), `X11 caption text` (figcaption) and
`X12 preformatted line` — all of which the real extractor **drops**, because
`tta__settings_exclude_tags` ships with `table`, `pre` and `figure` in it.

To be precise about which code did that: `extractWithRules()` *does* apply
`state.selection.tta__settings_exclude_tags` (`:986`). This run fell through to
`extractFromActiveSystem()`, whose tiers apply **no** exclusions at all — they read `.textContent`
off the marker/wrapper node and return it. So failure 2 is specific to the fallback tier, while
failure 1 affects both. Both tiers are reachable in normal use, and the fallback is the one an admin
hits after a theme change — exactly when they most need an accurate preview.

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

## The root cause, exactly

`step-rail.shell.js:995`:

```js
var raw = clone.textContent || '';
```

`textContent` concatenates every descendant text node with **no separator**. So
`…follows</p><p>X2 outer item` becomes `followsX2 outer item`. Every tier of
`extractFromActiveSystem()` does the same (`:883`, `:894`, and tier 1's marker read) — the one
exception is its tier 4, which returns `TTS.contents[k]`, the real PHP string. In the measured run
tier 1 won, so the accurate tier was never reached.

The shell also carries its **own** "already punctuated" list at `:1039`:

```js
var DELIM_PUNCT = ['.', ',', '?', '!', '|', ';', ':', '¿', '¡', '،', '؟'];
```

That is a fourth copy of the list TTS-280 consolidated, still carrying the pre-TTS-280 bugs: Latin
and Arabic only, no CJK or Devanagari, no ellipsis, and no walk past a closing quote. It is used
only for the title/excerpt/intro/outro joins, never for block boundaries.

---

## The cheap fix, concretely

Everything needed is already on the page — TTS-280 localises it as `window.TTS.settings.speech`.
No cross-plugin work, no REST round trip.

### 1. Read the shared rules

```js
// TTS-284: the resolved speech surface TTS-280 localises. Reuse it rather than
// inventing a fifth delimiter list in this file.
function speechRules() {
    return (window.TTS && window.TTS.settings && window.TTS.settings.speech) || {};
}
```

### 2. Replace DELIM_PUNCT with the shared, closer-aware test

```js
// TTS-284: mirrors TTA_Speech::tta_should_add_delimiter() and its JS twin.
// Walks back past closing quotes/brackets before deciding, and uses Array.from
// so characters outside the BMP are not split. DELIM_PUNCT stays only as the
// fallback for a Free that predates TTS-280.
function needsDelimiter(text) {
    var rules   = speechRules();
    var enders  = rules.delimiter_characters || DELIM_PUNCT;
    var closers = rules.closing_characters || [];

    var chars = Array.from(String(text || '').trim());
    for (var i = chars.length - 1; i >= 0; i--) {
        if (closers.indexOf(chars[i]) !== -1) { continue; }
        return enders.indexOf(chars[i]) === -1;
    }
    return false;
}
```

### 3. Replace `clone.textContent` with a block-aware walk

```js
// TTS-284: textContent glues blocks together. Walk the tree instead and emit
// the SAME boundary delimiter the real extractor will, so the preview shows
// the sentence structure the listener will actually hear.
//
// Closing boundaries are emitted after the subtree (a </p> ends a unit); void
// boundaries (hr, br) are emitted in place. Absent payload => previous
// behaviour, so an un-updated Free is unchanged.
function blockAwareText(node) {
    var rules  = speechRules();
    var closes = rules.boundary_delimiters;

    if (!closes) { return node.textContent || ''; }

    var voids = rules.void_delimiters || {};
    var out   = '';

    (function walk(el) {
        for (var i = 0; i < el.childNodes.length; i++) {
            var c = el.childNodes[i];

            if (c.nodeType === 3) { out += c.nodeValue; continue; }
            if (c.nodeType !== 1) { continue; }

            var tag = c.tagName.toLowerCase();

            if (voids[tag]) {
                out += needsDelimiter(out) ? voids[tag] : ' ';
                continue;
            }

            walk(c);

            if (closes[tag]) {
                out += needsDelimiter(out) ? closes[tag] : ' ';
            }
        }
    })(node);

    return out;
}
```

### 4. Use it at the four `.textContent` call sites

```js
// extractWithRules(), :995
var raw = blockAwareText(clone);
```

```js
// extractFromActiveSystem() — tier 1 (markers), tier 2 (saved selector),
// tier 3 (legacy wrapper). Tier 4 already returns the real string.
var t3 = blockAwareText(legacies[j]).trim();
```

### 5. Label the source honestly

`updatePreview()` already writes a `source` string into the meta line. Append the engine to it, so
an admin can tell a faithful preview from an approximation:

```js
source += rules.boundary_delimiters ? ' · shared rules' : ' · approximate';
```

**What this does not fix:** the panel still runs its own DOM walk rather than the extractor that
actually produces the audio, so `removeShortcodes()`, `removeDoubleDelimiters()` and
`decodeHTMLEntities()` are still not applied, and a future change to `getContent()` can still drift
away from it. That is why option 1 above remains the real fix — this is the cheap one that makes the
preview honest today.

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
