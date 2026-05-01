# TTS-238 — Picker collapse to legacy keys (proposal v5)

**Status:** draft, not yet implemented
**Author conversation:** 2026-04-30
**Supersedes (partially):** TTS-238 v5 §13 D7 (Per-post-rules separate store), §13 D9–D11 (step-rail scope chooser)

---

## 1. Why

The new picker introduced a parallel rule store
(`tta_atlasvoice_selectors` option + `_atlasvoice_post_rules` post meta
+ `RuleResolver` precedence walk) that **duplicates four mechanisms
already wired in the legacy plugin**:

| Picker UI step | Legacy storage key |
| -------------- | ------------------ |
| Content region | `tta__settings_css_selectors` |
| Skip these areas | `tta__settings_exclude_content_by_css_selectors` |
| Skip these tag types | `tta__settings_exclude_tags` |
| Skip these phrases | `tta__settings_exclude_texts` |

Per-post override is **also already wired** in the legacy plugin:

- Storage: `tts_pro_custom_css_selectors` (post meta, JSON).
- Save endpoint: `POST /wp-json/tta_pro/v1/css_selectors_for_posts`.
- React UI: `src/dashboard/css-selectors/CSSSelectorsForPosts.js`.
- **Reader: `TTA_Helper::tts_get_settings($key, $post_id)`** —
  field-by-field merges per-post values over global when
  `tta__settings_use_own_css_selectors` is true and the per-post field
  is non-empty.

So the legacy plugin already has the **two scopes** we actually need
(global + per-post) and a working merge resolver. The new picker's
parallel store reinvents this.

**Greenfield — the new picker store has not shipped to users.** No
migration cost to delete the parallel.

---

## 2. Decisions captured (2026-04-30 conversation)

| Question | Decision |
| -------- | -------- |
| Reuse legacy keys directly? | **Yes** — `tta__settings_*` for global, `tts_pro_custom_css_selectors` for per-post. |
| Per-post-type scope? | **Yes — Pro only.** New option `tta__settings_atlasvoice_per_type_overrides`. |
| Per-language scope? | **No** — no user complaints. Per-post override absorbs language edge cases. |
| Drop `_atlasvoice_post_rules`, `tta_atlasvoice_selectors`, `RuleResolver`, `PerPostRules*`, `/save-selector`, `/post-rules`? | **Yes** — redundant. |
| Picker on dashboard global "CSS Selectors" tab? | **Yes** — single "Pick visually" button at top. Multi-field rail. |
| Picker on per-post `CSSSelectorsForPosts.js`? | **Yes** — single "Pick visually" button at top. Multi-field rail. |
| Picker on Pro per-post-type editor? | **Yes** — Pro only, per type. |
| Free picker scope? | **Content region only.** Excludes steps locked. |
| Free emits wrapper + comment markers? | **Yes (NEW).** Today only Pro emits them. |
| Default value of `tta__settings_css_selectors`? | **`[class*="tts_content_wrapper_"]`** — selects whatever wrapper the Pro/Free filter emitted. Was empty string. |
| Per-post-type entry needs `use_own_css_selectors` toggle? | **No.** The include selector is the gate: non-empty = entry active (whole entry replaces global, even empty fields). Empty include = entry ignored, fall through to global. |
| Per-post entry keeps `tta__settings_use_own_css_selectors`? | **Yes** — existing implementation, don't change. |
| Wrapper opt-out checkbox? | **Yes**, default ON. |

### Net schema

```
┌── Global settings (Free + Pro) ──────────────────────────────────┐
│  tta__settings_css_selectors                = '[class*="tts_content_wrapper_"]'  ← NEW DEFAULT
│  tta__settings_exclude_content_by_css_selectors                                  ← unchanged shape
│  tta__settings_exclude_tags                                                      ← unchanged shape
│  tta__settings_exclude_texts                                                     ← unchanged shape
│  tta__settings_emit_legacy_wrapper          = bool (NEW, default true)           ← wrapper opt-out
└──────────────────────────────────────────────────────────────────┘

┌── Per-post-type overrides (Pro only) ────────────────────────────┐
│  tta__settings_atlasvoice_per_type_overrides = [                 │
│    'post' => [                                                   │
│      'tta__settings_css_selectors'                    => '…',    │  ← include = the GATE
│      'tta__settings_exclude_content_by_css_selectors' => '…',    │  ← applied if gate set
│      'tta__settings_exclude_tags'                     => […],    │  ← applied if gate set
│      'tta__settings_exclude_texts'                    => […],    │  ← applied if gate set
│    ],                                                            │
│    'page' => [                                                   │
│      'tta__settings_css_selectors' => '',                        │  ← gate empty, ignore
│    ],                                                            │
│  ]                                                               │
│                                                                  │
│  No `use_own_css_selectors` field at this tier.                  │
└──────────────────────────────────────────────────────────────────┘

┌── Per-post override (Pro only) ──────────────────────────────────┐
│  post meta: tts_pro_custom_css_selectors  (existing, unchanged)  │
│  value: {                                                        │
│    'tta__settings_use_own_css_selectors' => bool,                │  ← existing GATE
│    'tta__settings_css_selectors'                    => '…',      │
│    'tta__settings_exclude_content_by_css_selectors' => '…',      │
│    'tta__settings_exclude_tags'                     => […],      │
│    'tta__settings_exclude_texts'                    => […],      │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
```

### Three-tier cascade — mixed semantics

Implemented inside `TTA_Helper::tts_get_settings('settings', $post_id)`:

```
1. start with $result = global  (existing legacy keys)

2. PER-POST-TYPE — replace whole entry (Pro only, gate is include != '')
   $pt = get_post_type($post_id)
   $override = $per_type[$pt]
   if $override && $override['tta__settings_css_selectors'] !== '':
       foreach (4 css-selector fields):
           $result[field] = $override[field]   // even empty values apply

3. PER-POST — field-by-field merge (Pro only, existing logic)
   if $per_post['tta__settings_use_own_css_selectors'] === true:
       foreach (4 css-selector fields):
           if $per_post[field] non-empty:
               $result[field] = $per_post[field]
```

**Why the asymmetry between tiers 2 and 3:**

- Per-post **already exists** with the field-by-field merge + boolean
  toggle. Don't break it.
- Per-post-type is **new**. The boolean toggle is redundant when the
  include selector itself can be the gate. Cleaner UX, fewer fields.

---

## 3. UI

### 3.1 Dashboard "CSS Selectors" tab (existing, gains a Pick button)

The existing global-settings tab in the React dashboard. A single
**Pick visually ▸** button at the top of the section opens the step
rail on a sample post; the admin edits all four fields in the rail and
saves once. The text inputs below stay editable for admins who prefer
typing.

```
┌── Settings → CSS Selectors ───────────────────────────────────────┐
│                                                                   │
│  [ Pick visually with AtlasVoiceSelector ▸ ]                      │
│   Opens a sample post in a new tab — pick / drag in the rail and  │
│   click Save. All four fields below update at once.               │
│                                                                   │
│  Include Content By CSS Selectors                                 │
│  ┌──────────────────────────────────────────────┐                 │
│  │ #main-content                                │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                   │
│  Exclude Content By CSS Selectors                                 │
│  ┌──────────────────────────────────────────────┐                 │
│  │ .share-bar                                   │                 │
│  │ .related-posts                               │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                   │
│  Exclude HTML Tags To Speak                                       │
│  ┌──────────────────────────────────────────────┐                 │
│  │ blockquote|figure                            │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                   │
│  Exclude Texts To Speak                                           │
│  ┌──────────────────────────────────────────────┐                 │
│  │ Read more...|Advertisement                   │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Pick ▸ behaviour:**

1. Fetches a sample post URL via
   `GET /step-rail/sample-url?scope=global`.
2. Opens it in a new tab with `?atlasvoice_picker=1&scope=global`.
3. Step rail launches with all four steps editable. Header reads
   *"Editing rule for: Global"*.
4. Save writes the four fields back through the existing settings
   save endpoint (writes `tta_settings_data['settings'][<field>]` for
   each).
5. After save, the dashboard tab can refresh its inputs from the
   settings reader — or the admin manually reloads the page.

### 3.1.5 Pro section: per-post-type editor (in "Allow Listening For Post Type")

For Pro installs only, each enabled post type in the existing
"Allow Listening For Post Type" section grows a small editor block:

```
┌── Allow Listening For Post Type (Pro) ────────────────────────────┐
│                                                                   │
│  ☑  Post                                                          │
│      CSS rule:    [ Global / All  ▾ ]                             │
│                                                                   │
│  ☑  Page                                                          │
│      CSS rule:    [ Custom         ▾ ]                            │
│      ┌──────────────────────────────────────────────────────────┐ │
│      │ [ Pick visually with AtlasVoiceSelector ▸ ]              │ │
│      │  Opens a sample 'page' in a new tab.                     │ │
│      │                                                          │ │
│      │  Include Content By CSS Selectors                        │ │
│      │  ┌────────────────────────────────────────────────────┐  │ │
│      │  │ #page-body                                         │  │ │
│      │  └────────────────────────────────────────────────────┘  │ │
│      │  Exclude Content By CSS Selectors                        │ │
│      │  ┌────────────────────────────────────────────────────┐  │ │
│      │  │ .footer-cta                                        │  │ │
│      │  └────────────────────────────────────────────────────┘  │ │
│      │  Exclude HTML Tags To Speak                              │ │
│      │  ┌────────────────────────────────────────────────────┐  │ │
│      │  │ blockquote                                         │  │ │
│      │  └────────────────────────────────────────────────────┘  │ │
│      │  Exclude Texts To Speak                                  │ │
│      │  ┌────────────────────────────────────────────────────┐  │ │
│      │  │                                                    │  │ │
│      │  └────────────────────────────────────────────────────┘  │ │
│      └──────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ☑  Product (Pro pill — type registered but no per-type rule)     │
│      CSS rule:    [ Global / All  ▾ ]                             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Dropdown semantics:**

- **Global / All** (default) — no entry stored for this type in
  `tta__settings_atlasvoice_per_type_overrides`. The post type falls
  through to the global tier.
- **Custom** — expands the editor. Picker writes to
  `per_type[$post_type]`. Switching back to Global removes the entry
  (or sets the include selector to empty, which is the
  gate-off state).

**Pick visually behaviour for per-type:**

1. Fetches a sample post URL of *that* post type via
   `GET /step-rail/sample-url?post_type=<type>`.
2. Opens it with `?atlasvoice_picker=1&scope=post_type:<type>`.
3. Step rail launches with all four steps editable.
4. Save writes the four fields to
   `tta__settings_atlasvoice_per_type_overrides[<type>]`.

**Free vs Pro at this section:**

- Free hides this entire block — only sees the existing
  "Allow Listening For Post Type" checkboxes.
- Pro sees the dropdown + editor + Pick button per type.

### 3.2 Per-post override meta box (Pro, existing tab + a Pick button)

`CSSSelectorsForPosts.js` already exposes the four fields with a
"Use own CSS selectors for this post" toggle. Add a single
**Pick visually ▸** button at the top — identical UX to §3.1 but the
sample post is **this post** and save writes through the existing
`POST tta_pro/v1/css_selectors_for_posts` endpoint to
`tts_pro_custom_css_selectors`. All four fields update in one save.

```
┌── AtlasVoice — Custom rules for this post (Pro) ──────────────────┐
│                                                                   │
│  ☑ Use own CSS selectors for this post                            │
│                                                                   │
│  [ Pick visually with AtlasVoiceSelector ▸ ]                      │
│   Opens THIS post in a new tab. Pick / drag in the rail and click │
│   Save. All four fields below update at once.                     │
│                                                                   │
│  Include Content By CSS Selectors                                 │
│  ┌──────────────────────────────────────────────┐                 │
│  │ .my-recipe-body                              │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                   │
│  … (three more fields, no per-field Pick buttons) …               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 3.3 Step rail — trimmed

The scope radio (`global / post_type / language / post_type+language /
this post`) is removed. The rail opens **already scoped** based on the
URL parameter that launched it:

- `?atlasvoice_picker=1&scope=global`
- `?atlasvoice_picker=1&scope=post_type:post`     (Pro only)
- `?atlasvoice_picker=1&scope=post:152`           (Pro only)

Header reads:

> *Editing rule for: Global*
>
> *Editing rule for: Post type "post"*
>
> *Editing rule for: This post (#152)*

All four steps (Content region / Skip areas / Skip tags / Skip phrases)
remain interactive — the admin edits everything in one session and
clicks **Save** once to persist the whole bundle.

**On Free**, only the Content region step is editable. The three
exclude steps render with the existing `is-locked` CSS + `.av-pro-pill`
badge (already implemented). The Pick visually buttons on the Free
dashboard launch with `scope=global`; saving only updates
`tta__settings_css_selectors`. The Free build never sees
`scope=post_type:*` or `scope=post:N` URLs.

**Save targets** by scope:

- `scope=global` → existing settings save endpoint. Writes the four
  fields (or just the Content region on Free) into
  `tta_settings_data['settings']`.
- `scope=post_type:<slug>` → existing settings save endpoint. Writes
  to `tta__settings_atlasvoice_per_type_overrides[<slug>]`.
- `scope=post:N` → `POST tta_pro/v1/css_selectors_for_posts`. Writes
  to the post meta `tts_pro_custom_css_selectors`. Sets
  `tta__settings_use_own_css_selectors = true` so the existing
  `tts_get_settings($post_id)` cascade picks it up.

### 3.4 Wrapper opt-out

New checkbox in **Settings → Compatibility** (or wherever the existing
boolean flags live):

> *☑ Emit legacy `<div class="tts_content_wrapper_N">` wrapper around
> post content (turn off if your theme's layout breaks on it; comment
> markers are still emitted regardless)*

Default ON. Read-side: the Pro filter
`tts_button_with_content_callback` already gates wrapper emission on
the `tts_emit_legacy_wrapper` filter (default true) — wire this
checkbox to that filter.

---

## 4. What gets deleted

- `tta_atlasvoice_selectors` option write path — gone.
- `RuleResolver` class — gone (legacy `tts_get_settings` already
  implements the cascade).
- `PerPostRules` + `PerPostRulesMetaBox` — gone (existing
  `CSSSelectorsForPosts.js` covers the same surface).
- `_atlasvoice_post_rules` post meta — gone (existing
  `tts_pro_custom_css_selectors` covers the same need).
- `/wp-json/tta/v1/save-selector` REST route — gone.
- `/wp-json/tta/v1/post-rules` REST route — gone.
- Step rail's `ScopeRow` component / scope radio markup — gone.

## 5. What stays untouched

- Step rail's drag-to-include / drag-to-exclude / chip editor / verify-
  across-posts (D14) / Tier 1–4 extractor fallback — all read-side,
  unchanged.
- Comment-marker emission (Pro filter) — unchanged.
- Mode (staging/production), Snapshots, RegenGuard, ContentHash,
  SelectorHash — orthogonal, unchanged.
- `TTA_Helper::tts_get_settings` cascade logic — unchanged.

---

## 6. Free vs Pro split

| Feature | Free | Pro |
| ------- | ---- | --- |
| Wrapper + comment markers emission | ✓ (NEW for Free) | ✓ |
| Global selector (text input + Pick) | ✓ | ✓ |
| Global excludes (text input + Pick) | text input only | ✓ |
| Picker Content region step | ✓ | ✓ |
| Picker Skip-areas / Skip-tags / Skip-phrases steps | locked | ✓ |
| Per-post-type override (dropdown + editor + Pick) | — | ✓ |
| Per-post override (existing tab + Pick) | — | ✓ |
| Verify across posts | — | ✓ |
| Snapshots / Go Live | — | ✓ |

Pro differentiates on every per-scope override (per-type and per-post),
on the picker's exclude steps, and on the existing admin tooling
(Verify, Snapshots, Go Live). Free still gets a working visual picker
limited to the Content region — enough to make the legacy wrapper auto-
detection foolproof out of the box.

---

## 7. Cost & sequencing

Estimated **~1.5 focused days**. Atomic commits:

1. **D26.1** Step rail URL param parser — `?scope=global`,
   `?scope=post_type:<slug>`, `?scope=post:N`. Header read-out
   reflects the scope. Scope radio markup deleted; rail opens with
   all four steps interactive (or only Content region on Free).
2. **D26.2** Step rail save target switch — `scope=global` writes
   through the existing settings save endpoint, `scope=post_type:*`
   writes to `tta__settings_atlasvoice_per_type_overrides`,
   `scope=post:N` writes through
   `tta_pro/v1/css_selectors_for_posts`. Old `/save-selector` and
   `/post-rules` REST routes deleted.
3. **D26.3** Per-post-type cascade in
   `TTA_Helper::tts_get_settings('settings', $post_id)` — read
   `tta__settings_atlasvoice_per_type_overrides[$pt]`, gate on
   non-empty include, replace four fields when gate set.
4. **D26.4** Dashboard "CSS Selectors" tab — single **Pick
   visually** button at the top; URL builder + new-tab open.
5. **D26.5** Dashboard "Allow Listening For Post Type" — Pro
   section with per-type dropdown (Global / Custom), expanded
   editor, Pick button per type.
6. **D26.6** `CSSSelectorsForPosts.js` — single **Pick visually**
   button at the top; URL builder + new-tab open.
7. **D26.7** Free-side wrapper + marker emission (extends
   `TTA_Pro_Filters::tts_button_with_content_callback`'s logic to
   the Free filter chain). Wrapper opt-out checkbox in settings.
8. **D26.8** Default value of `tta__settings_css_selectors` in
   `TTA_Activator.php` changed from `''` to
   `[class*="tts_content_wrapper_"]`.
9. **D26.9** Cleanup. Delete `tta_atlasvoice_selectors` option write
   path, `RuleResolver`, `PerPostRules*`, `_atlasvoice_post_rules`
   cleanup. Revision log update.

---

## 8. Open questions

1. **Sample-post URL endpoint** — `/step-rail/sample-url` already
   exists and accepts a `scope` query. We can reuse it as-is for
   `scope=global` (returns any recent published post). For per-post,
   the post id is known so we just use that post's permalink — no
   sample needed. ✓ no work.

---

## 9. Decision

Approved 2026-05-01. D26.1–D26.9 shipped under commits `d0a01f8` + `facf304`.

---

## 10. v5 revision (2026-05-01) — accordion UI + Pro notices + extractor toggle removal

After D26 shipped, the user requested a UX restructure to make scopes
discoverable and the upgrade path visible on Free.

### 10.1 Decisions captured (2026-05-01 conversation)

| Question | Decision |
| -------- | -------- |
| Remove "Use AtlasVoice Extractor (Beta)" toggle from UI + storage? | **Yes.** Drop the checkbox in `AtlasVoiceSettings.js`, the `tta__settings_use_atlasvoice_extractor` key from `TTA_Activator.php` defaults, the `window.TTS.use_atlasvoice_extractor` line in `helpers.php`, and any remaining handler refs. The PHP gates were already neutralized in D26.9. |
| Settings UI shape | **Accordion per scope.** First item = Global (always shown, expanded by default). One additional item per enabled post type below it, **Pro only**, collapsed by default. |
| Per-scope content inside each accordion | The four legacy fields (Include, Exclude CSS, Exclude tags, Exclude texts) + an optional "Manual post (slug or post ID)" input + a Pick Visually button in the accordion header. |
| Where does "Allow Listening For Post Status" sit? | **After all scope accordions.** |
| Free + global excludes — locked or editable-but-ignored? | **Editable, ignored on save**, with a layered Pro notice (banner + pill + toast). Only the Include field saves on Free. |
| Manual post resolution | **At click time only** (no REST chatter while typing). Resolves by post ID first; if non-numeric, treats as slug and queries `wp/v2/posts?slug=`. |
| Per-post metabox accordion | **`<details>`** wrapper. Pick Visually button in the summary line. Saves to existing `tts_pro_custom_css_selectors`. |

### 10.2 Dashboard UI (final)

```
Settings → Allow Listening For Post Type:  [ post × ] [ page × ]

┌── ▼ Global                                  [ Pick Visually ▸ ] ─────────────┐
│                                                                              │
│   Manual post (optional):  ┌──────────────────────────┐                      │
│                            │ slug or post ID          │                      │
│                            └──────────────────────────┘                      │
│                                                                              │
│  ┌──────────────────────────── FREE ONLY ─────────────────────────────────┐  │
│  │ ⚡ Excludes are a Pro feature                                          │  │
│  │                                                                        │  │
│  │ You can type into all four fields below, but only Include Content By   │  │
│  │ CSS Selectors saves on Free. The other three are ignored until you     │  │
│  │ upgrade.    [ Upgrade to Pro → ]                                       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   Include Content By CSS Selectors                                           │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │ #main-content                                                          │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│   Exclude Content By CSS Selectors  [Pro]    ← pill on Free                  │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │ .share-bar                                                             │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│   Exclude HTML Tags To Speak  [Pro]                                          │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │ blockquote|figure                                                      │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│   Exclude Texts To Speak  [Pro]                                              │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │ Read more...|Advertisement                                             │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌── ▶ Post (Pro)                              [ Pick Visually ▸ ] ─────────────┐
└──────────────────────────────────────────────────────────────────────────────┘

┌── ▶ Page (Pro)                              [ Pick Visually ▸ ] ─────────────┐
└──────────────────────────────────────────────────────────────────────────────┘

Allow Listening For Post Status:  [ publish × ]
```

### 10.3 Per-post metabox UI (final)

```
<details>                                   ← native HTML, no React-bootstrap dep
  <summary>
    AtlasVoice — Custom rules for this post (Pro)
                                            [ Pick Visually ▸ ]
  </summary>

  ☑ Use Own CSS Selectors

  Include Content By CSS Selectors
  ┌────────────────────────────────────────┐
  │ .my-recipe-body                        │
  └────────────────────────────────────────┘

  Exclude Content By CSS Selectors
  …three more fields…
</details>
```

Pick Visually button uses `e.preventDefault(); e.stopPropagation();` so
the `<details>` doesn't toggle when the button is clicked.

### 10.4 Functional flow

**Global accordion**
- Pick Visually click resolves target URL: read manual-post input; if
  numeric, fetch `WP /posts/<id>`; if non-empty string, fetch
  `WP /posts?slug=<value>`; else hit `/tta/v1/step-rail/sample-url?scope=global`.
- Open in new tab with `?atlasvoice_picker=1&scope=global`.
- Picker save in the new tab → `/tta/v1/atlasvoice/save-rule` with
  `scope_kind=global` (D26.2, already shipped).
- Dashboard text-area edits go through the existing `handleChange` →
  `POST /tta/v1/settings`. Free strips the three exclude fields from the
  payload before send (with toast notification).

**Per-type accordion (Pro only)**
- Pick Visually click resolves target URL: same as global but with
  `?scope=post_type&post_type=<slug>` on the sample-url query, and
  `&scope=post_type:<slug>` on the picker URL.
- Picker save → `/tta/v1/atlasvoice/save-rule` with
  `scope_kind=post_type` (already shipped).
- Dashboard text-area edits go through a small per-type handler:
  reads-modifies-writes `settings.tta__settings_atlasvoice_per_type_overrides[<slug>][<field>]`.

**Per-post metabox**
- Pick Visually click opens the current post in a new tab with
  `?atlasvoice_picker=1&scope=post:<id>` (no manual input needed).
- Picker save → existing `/tta_pro/v1/css_selectors_for_posts` route
  (D26.2 wires this through the same `/atlasvoice/save-rule` endpoint
  on `scope=post`, which delegates to the post meta).
- Direct text-area edits in the metabox keep using the existing
  `CSSSelectorsForPosts.js` save flow.

### 10.5 Pro-notice layers (Free only, global accordion)

| Layer | Trigger | Content |
| ----- | ------- | ------- |
| Inline banner | Always visible at top of Global accordion body | "⚡ Excludes are a Pro feature. You can type into all four fields below, but only Include Content By CSS Selectors saves on Free. The other three are ignored until you upgrade. [Upgrade to Pro →]" |
| `[Pro]` pill | Always visible, next to each gated field's label | Hover tooltip: "Pro feature — value won't be saved on Free. [Upgrade]" |
| Toast on save | Only when admin had typed into a gated field | "Saved 1 of 4 fields. Three exclude fields were skipped — they need Pro. [Upgrade →]" |

### 10.6 Sequencing (D27.x atomic commits)

1. **D27.1** Plan v5 doc.
2. **D27.2** Remove "Use AtlasVoice Extractor (Beta)" — `AtlasVoiceSettings.js`, `TTA_Activator.php`, `helpers.php` inline, dead handler refs.
3. **D27.3** Settings.js — restructure into Accordion. Global expanded, per-type collapsed Pro-only.
4. **D27.4** Pro-notice layers — banner + pill + toast in the global accordion.
5. **D27.5** Per-type save handler — read-modify-write
   `tta__settings_atlasvoice_per_type_overrides`. Move "Allow Listening
   For Post Status" below the accordions.
6. **D27.6** Manual post resolver in Pick Visually click handler
   (id → `/wp/v2/posts/<id>`, slug → `/wp/v2/posts?slug=`).
7. **D27.7** Per-post metabox `<details>` accordion + Pick Visually
   button on the post-edit screen.
8. **D27.8** Production build + commit + push.
9. **D27.9** Live browser verification on dashboard + picker post + edit
   screen.

Estimated **~1 focused day** for D27.2–D27.7.


