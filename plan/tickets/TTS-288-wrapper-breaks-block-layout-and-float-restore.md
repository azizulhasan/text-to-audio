# TTS-288 — Content wrapper breaks block-theme full-width layout; floating player sometimes lost on scroll up

Two front-end layout defects, filed together because both come from the plugin's markup interfering
with the theme's own layout rather than from the player itself.

Found on test.atlasaidev.com (Extendable block theme, player 6, production mode) during 2.3.11
release testing, 2026-08-27.

---

## Issue 1 — the wrapper collapses full-width layout. CONFIRMED, root cause found

### Symptom

With `page` added to the listening post types, the front page renders **boxed** instead of
full-width. Turn the plugin's injection off and the page is fine.

### Root cause

`tta_content_wrapper` inserts a DOM level between `.entry-content.is-layout-constrained` and its
children. WordPress block themes implement `alignfull` / `alignwide` with a **direct-child**
selector:

```css
.is-layout-constrained > .alignfull { max-width: none; margin-left: auto; margin-right: auto; }
```

Once our wrapper sits in between, those blocks are no longer direct children, the rule stops
matching, and every `alignfull` section inherits the constrained content width. The wrapper itself
then also picks up the theme's default content width, because it *is* now the direct child.

Measured on the live page:

| | `.tts_content_wrapper_1` | `.alignfull` hero |
|---|---|---|
| With wrapper (as shipped) | 672px, `max-width: 672px` | **672px** |
| Same DOM, wrapper level removed | — | **1521px** |
| Wrapper restored | 672px | 672px |

Parent `.entry-content` is 1521px and carries `is-layout-constrained`. So the page is not "styled
wrong" — our extra element is structurally invalid for the block-layout contract.

### Notes for whoever fixes it

- `tta__settings_emit_legacy_wrapper` (D26.7) already exists as an opt-out and is the workaround
  today. It defaults ON, so every block-theme site with a full-width front page is affected out of
  the box.
- This is the same class of bug as **TTS-260** (wrapper broke Avada Post Cards grids). Two themes,
  two symptoms, one cause: the wrapper is not layout-neutral.
- Options worth weighing: emit the wrapper only where it is actually needed; use `display: contents`
  so it stops participating in layout; copy the parent's layout classes onto the wrapper; or drop the
  wrapper entirely now that markers exist. Each has consequences for the extractor, which is why this
  needs a decision rather than a quick patch.

---

## Issue 2 — floating player sometimes disappears on scroll up. NOT REPRODUCED

### Reported

Intermittent. Scrolling down docks the player to the configured float position (sticky top, bottom
right, bottom left, bottom full width). Scrolling back up makes it vanish entirely rather than
returning to its inline position in the content. Reporter says it happens sometimes, not every time.

### What I tried

Two attempts on the live front page, per instruction:

1. Full scroll to bottom, then full scroll back to top.
2. Partial scroll down, deeper scroll down, partial scroll up, full scroll up.

In both, the inline container returned correctly at scroll position 0: `height: 52`,
`display: block`, `visibility: visible`, `opacity: 1`. **Did not reproduce.**

### Diagnostic clue worth keeping

While docked, the inline container stays in the DOM as `display: block` but collapses to
**`height: 0`** — the docking mechanism empties the inline slot and renders the player elsewhere,
rather than moving the element.

That gives a plausible mechanism for the report: if the restore step is missed — a dropped scroll
event, an IntersectionObserver that does not re-fire, or a race between the dock and undock handlers
— the inline slot stays at height 0 while the docked copy is also gone, and the player is absent from
both places until reload. Worth checking whether the undock path is driven by the same observer that
docks it, and whether it has an idempotent "restore" that runs on any upward scroll rather than only
on a threshold crossing.

### To reproduce, likely needs

Slower/interrupted scrolling, mid-page direction reversals, a specific float position (this run used
whatever the site had set), touch/momentum scrolling on mobile, or a page where the inline slot is
near the very bottom — on this page it sits at y≈6909 of a very long page, so the dock is active for
almost the whole scroll.

---

## Scope

Free. Issue 1 is the wrapper emitted by Free; issue 2 is the floating behaviour that TTS-267 moved
into Free. Pro inherits both.

## Acceptance criteria

1. On a block theme, a page with `alignfull` sections renders full-width with the plugin active and
   the wrapper enabled.
2. The extractor still finds the right content region with whatever wrapper strategy is chosen.
3. TTS-260's Avada Post Cards case does not regress.
4. Scrolling down then up returns the player to its inline position every time, including on
   interrupted and reversed scrolls.
5. The player is never absent from both the inline slot and the dock at the same time.

## Related

- TTS-260 — wrapper broke Avada Post Cards grids. Same cause.
- TTS-267 — floating/docking positions moved into Free.
