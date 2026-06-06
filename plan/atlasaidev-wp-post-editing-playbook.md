# AtlasAiDev (atlasaidev.com) — Live WordPress Post-Editing Playbook

> Hard-won lessons from editing live posts (e.g. ID 3497 book-readers) via the Chrome browser MCP.
> READ THIS before editing any atlasaidev.com post content. The Gutenberg editor on this site is
> heavily plugin-augmented (Spectra/UAGB, Yoast Premium, ez-toc, LiteSpeed, security plugin) and
> behaves differently from stock Gutenberg.

## Golden rules
1. **Never save destructively without verifying via MCP first.** After any save, re-read the post
   with `awfah-posts-wp-get-post id=<id> context=edit` and parse `content.raw` with **PowerShell**
   (`ConvertFrom-Json`) — `jq`/`python` are NOT available in this Windows env. Also verify on the
   **live front-end** with a cache-buster query string (`?v=check`) + `javascript_tool`.
2. **Live page is only affected on manual Save.** Unsaved editor changes are safe to discard. If the
   editor gets into a bad state, reload (or open a fresh tab) to revert to the last saved version.
3. **MCP cannot round-trip large content.** `update-post` replaces the WHOLE `content.raw` (~40KB
   here) — you cannot reliably reproduce that in a tool call. Use the **browser editor** for content
   changes; use **MCP only for reading/verifying**.

## Known editor traps (and the fix)

### Classic block + baked ez-toc Table of Contents
- Older posts store the entire body in ONE monolithic **Classic block**, including a **baked-in
  ez-toc TOC** (`<div id="ez-toc-container">…`, ~300 `ez-toc` refs) and **mojibake** (curly
  apostrophes stored as `â€™`).
- **Coordinate-based selection inside a Classic block does NOT register** (click-drag, shift-click,
  even keyboard Shift+Ctrl+Home are unreliable). You cannot reliably delete/edit text inside it.
- **Fix:** select the Classic block → toolbar **"Convert to blocks"**. This turns it into native
  paragraph/heading/list/image blocks you can edit reliably via List View.

### "Convert to blocks" strips heading IDs — but the TOC still works
- Conversion drops `id="h-…"` from `<h2>/<h3>` tags (they become `<h2 class="wp-block-heading">`).
- **This does NOT break the TOC.** ez-toc injects its anchor targets at RENDER time, so all TOC
  links still resolve on the live page (verified 48/48 anchors resolved, 0 broken). The ez-toc
  container keeps its full styling (it converts to a **Custom HTML block** preserving the HTML).
- Always re-verify TOC links live after converting:
  `[...document.querySelectorAll('a[href*="/#h-"]')]` → check each `document.getElementById(hash)`.

### The enhanced "Custom HTML" block FREEZES the page
- Inserting a core `/html` block here opens an **enhanced CodeMirror modal (HTML/CSS/JS tabs)**.
- Typing a large string into it (≈1500+ chars) causes a **30s CDP `Input.dispatchKeyEvent` timeout**
  and the whole tab **freezes** (document_idle never fires). You then must close + reopen the tab.
- **Avoid the Custom HTML modal for large content.** If you must, type in SMALL chunks (≤250 chars).

### Core Table block: Tab nav broken, cell-clicks racy
- In a core Table block, **Tab does NOT move between cells**, and clicking each cell + typing is
  **racy** (some cells don't register; row-height growth shifts coordinates of lower rows).
- A stray keystroke during this can leak into other fields (e.g. it set the **Yoast focus keyphrase**
  to a table cell value, and triggered the Yoast "AI title generator" modal).
- **RELIABLE METHOD for tables:** insert a Table block (any size) → block options (⋮) →
  **"Edit as HTML"** → this opens a **plain textarea** (NOT CodeMirror, no freeze) → `Ctrl+A` →
  type the full `<figure class="wp-block-table"><table class="has-fixed-layout"><tbody>…</tbody></table></figure>`
  → toolbar **"Edit visually"** to render. Works first time, every time.

### "Updating failed: not a valid JSON response" on autosave
- The security/LiteSpeed layer intermittently rejects **autosaves** with this red banner (also threw
  a `Can NOT find LSCWP path for object cache` notice). **Manual Save still works** — dismiss the
  banner and click Save; confirm the "Post updated" toast. Don't panic / don't abandon work over it.

### Navigation & scrolling
- **Canvas wheel-scroll is unreliable** (often scrolls the outer admin page instead). Use **List
  View** to jump to blocks, and **block Options → "Add before/after"** (`Ctrl+Alt+T` / `Ctrl+Alt+Y`)
  to insert at a precise spot.
- **List View can be hidden behind the admin sidebar** when the sidebar is scrolled down. Keep the
  sidebar scrolled to top, or collapse the bottom Meta Boxes drawer to free space.
- After heavy table/keyboard editing, **re-check the Yoast focus keyphrase** (Yoast sidebar) — stray
  keystrokes can corrupt it.

## Yoast meta editing
- Open the **Yoast SEO sidebar** (purple "Y" icon in the top toolbar) → **"Search appearance"** modal
  → edit SEO title / slug / **Meta description** → "Return to your post" → Save.

## Reliable end-to-end recipe (content edit)
1. MCP read + PowerShell parse to understand current structure.
2. Browser: if body is a Classic block, **Convert to blocks** first.
3. Insert blocks via List View + "Add before/after"; for tables use **Edit as HTML**.
4. Edit Yoast meta via the Search appearance modal.
5. Save (dismiss any autosave-failed banner). Confirm "Post updated".
6. Verify: MCP read `content.raw` (PowerShell) + live front-end `?v=check` + `javascript_tool`.
