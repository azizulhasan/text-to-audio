# TTS-283 — "Pick content to read" in the AtlasVoice toolbar menu

## The problem

The AtlasVoice content picker (Step Rail / CSS selector) is **off by default in both modes** —
TTS-255 removed the auto-appear for logged-in admins because it bloated every post view.

That left exactly one way in: the **Open & Pick** button on the plugin dashboard. So an admin already
reading a post who spots the wrong content being read has to go back to wp-admin, find the post in
the list, and come back out to the front end — for a task that is inherently about the page they are
already looking at.

## The fix

A new item in the **existing** `AtlasVoice: staging / production` toolbar node's submenu, alongside
*Go Live…* / *Revert to staging* and *Open AtlasVoice settings*:

```
AtlasVoice: staging
  ├─ Go Live…
  ├─ Pick content to read        ← this ticket
  └─ Open AtlasVoice settings
```

No new top-level toolbar node. A standalone node was built first and rejected — the toolbar already
has an AtlasVoice entry and a second one beside it is clutter.

No new picker logic either. `StepRail::maybe_activate()` already treats `?atlasvoice_picker=1` as a
forced launch for `manage_options` users, bypassing both the steprail-enabled setting and the
listening allow-list, in either mode. This is a link builder.

### Behaviour

| Condition | Submenu item |
|---|---|
| Front end, singular, `manage_options` | **"Pick content to read"** → permalink + `?atlasvoice_picker=1` |
| Same, picker already armed | **"Close content picker"** → permalink with the param removed |
| wp-admin | absent — no post being viewed; the dashboard has its own button |
| Non-singular (home, archive) | absent |
| No `manage_options` / logged out | the whole parent node is already absent |

Mode-independent, confirmed 2026-08-26. Choosing which content is read is not a staging-only task,
and a production site is precisely where a wrong selector costs the most. Arming the picker affects
only the admin who clicked — visitors never see the rail.

### Where the code lives

Ownership is split so neither class reaches into the other's business:

- **`StepRail`** owns `AUTO_PARAM`, so it owns the URL: new `picker_toggle_url()` and
  `is_picker_armed()`. `picker_toggle_url()` returns `''` when there is nothing to pick on, so the
  caller can use it as its own gate rather than duplicating the conditions.
- **`Mode::render_bar_node()`** adds the child node, `class_exists()`-guarded, and links to whatever
  StepRail hands it.

`is_picker_armed()` is deliberately distinct from the existing `is_front_active()`: that one answers
"is the rail rendering", which is also true when the steprail setting turns it on by itself. This one
answers "did someone arm it with the URL parameter", which is what the menu item toggles.

No CSS. Inheriting the toolbar's own submenu styling is the point of putting it there.

### Known limitation

The item inherits the parent node's visibility, and that node is gated by
`Mode::should_render_bar_node()` — i.e. `tta__settings_show_mode_bar`, which is **off by default**
(TTS-255). So on a site that has never switched the staging/live indicator on, this link is not
reachable. That is the accepted trade-off for putting it in the existing menu rather than beside it.
Worth revisiting if the indicator stays hidden for most installs.

---

## Verified on a live install

| Case | Result |
|---|---|
| Staging, front end, singular | Submenu = Go Live… / **Pick content to read** / Open AtlasVoice settings |
| Click it | Picker opens (`#av-steprail-root` present), item flips to **Close content picker** |
| Production, front end, singular | Submenu = Revert to staging / **Pick content to read** / Open AtlasVoice settings |
| wp-admin (post edit screen) | Item absent, other two intact |
| Home / non-singular | Item absent, other two intact |
| No top-level `atlasvoice-pick` node anywhere | Confirmed removed |

---

## Acceptance criteria

1. The item appears in the existing AtlasVoice toolbar submenu on a singular front-end view for a
   `manage_options` user, in **both** modes.
2. There is no second top-level toolbar node.
3. Its href is the current post's permalink plus `atlasvoice_picker=1` — not a fixed target.
4. Clicking it opens the picker on that post.
5. With the picker armed it reads "Close content picker" and strips the parameter.
6. It is absent in wp-admin and on non-singular views, while the sibling items stay.
7. Nothing about it reaches a logged-out visitor.
