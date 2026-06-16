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

## 4. What changed in the storage / class graph

> §4 was rewritten 2026-05-01 to record what actually shipped.
> The original v4 list (below, struck through) called for
> wholesale deletion of `RuleResolver` / `PerPostRules*` / the
> legacy REST routes. When v5 hit reality those classes turned
> out to be too entangled (SelectorHash, /active-rule REST,
> breadcrumb metabox UI) to remove without rewriting their
> callers. The smaller, safer move was to **refactor in place**
> so they all read the new collapsed storage instead of the dead
> `tta_atlasvoice_selectors` option. The picker→dashboard→runtime
> parity goal is met (verified live — see §13).

### 4.1 What actually shipped

> Note: this section was rewritten 2026-05-01 to record the
> initial v5 reality, then again 2026-05-02 after the §14 +
> §15 cleanup waves retired several items I had originally
> claimed would stay. The "kept" items below are accurate at
> the current HEAD; see §15.12 for the definitive surviving-
> files list.

  * **`tta_atlasvoice_selectors` option** — writer removed
    (D26.9), readers removed (D27.21 in `RuleResolver`, D27.12
    in `/step-rail/scope-rule`), JS reader's fallback removed
    (D27.41), data deleted on installs that ever stored it via
    the cleanup migration (D27.25). Fully retired.
  * **`RuleResolver`** — kept, repointed to the new storage
    (D27.21), output keys later renamed to canonical
    `tta__settings_*` (D27.42):
    - layer 1 = `tts_pro_custom_css_selectors` post meta, gated
      on `tta__settings_use_own_css_selectors`
    - layer 2 = `tta_settings_data['tta__settings_atlasvoice_per_type_overrides'][<slug>]`
    - layer 3 = flat `tta_settings_data['tta__settings_*']` keys
    Per-language and per-post-type+language layers retired.
    `breadcrumbs()` collapsed to the 3-layer view; the per-post
    crumb labels itself "(disabled)" when the meta has data but
    the master toggle is off.
  * **`PerPostRules`** — kept. Owns the per-post-meta storage
    layer that the resolver and Pro per-post API both consume.
  * **`PerPostRulesMetaBox`** — **deleted in D27.31.** The
    breadcrumb-table UI it added to the post-edit metabox was
    superseded by the React per-post accordion in
    `CSSSelectorsForPosts.js`.
  * **`_atlasvoice_post_rules` post meta** — dead data on
    installs that ever wrote it via the legacy `/post-rules`
    POST. Cleanup migration in `text-to-audio.php` (D27.25)
    strips it on every admin pageview in batches of 200 until
    fully drained.
  * **`/wp-json/tta/v1/save-selector` and `/post-rules` REST
    routes** — initially "kept registered, no longer called",
    then **deleted in D27.28** along with the heal log + boilerplate
    detector features they fed. JS callers in `tts-picker.js` and
    `AtlasVoiceHealLog.js` removed (or stubbed for the heal log,
    which is also gone).
  * **Step rail's `ScopeRow` / scope radio markup** — gone (D26.1).
    Scope is driven entirely by URL params now.

### 4.2 Original v4 deletion list (superseded)

> The list below was the v4 prediction. Refactor-in-place beat
> wholesale-delete in v5. Kept here so the audit trail stays
> intact.

  * ~~`tta_atlasvoice_selectors` option write path — gone.~~
    (Writes gone D26.9; readers + data fully retired by D27.41/D27.25.)
  * ~~`RuleResolver` class — gone.~~ Refactored to read the new
    storage (D27.21) and emit canonical keys (D27.42).
  * ~~`PerPostRules` + `PerPostRulesMetaBox` — gone.~~ `PerPostRules`
    kept (storage layer); `PerPostRulesMetaBox` deleted in D27.31.
  * ~~`_atlasvoice_post_rules` post meta — gone.~~ Cleanup migration
    in D27.25 strips it on admin pageviews until drained.
  * ~~`/wp-json/tta/v1/save-selector` REST route — gone.~~ Deleted
    in D27.28.
  * ~~`/wp-json/tta/v1/post-rules` REST route — gone.~~ Deleted
    in D27.28.
  * Step rail's `ScopeRow` component / scope radio markup — gone. ✓

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

## 11. v5 follow-ups (2026-05-01) — wire-format collapse, save/read parity

Discovered while testing D27.x: the picker save/read pipeline still
carried short-name parallel keys (`selector` / `excl_css` / `excl_tags`
/ `excl_texts`) on the wire and inside the picker JS, while storage
already used the canonical `tta__settings_*` names. That meant:

  * Saves landed in the right slot but the dashboard/picker reads
    looked at a different shape (dashboard saves option flat, picker
    save endpoint wrote nested under `settings`).
  * Per-type/per-post excludes were stored as arrays by the picker;
    React surfaced them via `array.toString()` → comma-separated
    display, even though storage was meant to be pipe-joined.
  * Phrases (excl_texts) were split on commas — fragmenting natural
    language like `"Hello, world"` into two chunks.
  * `/step-rail/scope-rule` reader was still pointing at the dead
    `tta_atlasvoice_selectors` option, so saves never reflected on
    re-open of the picker.
  * Per-post URL-pinned scope (`?scope=post:N`) bypassed the new
    reader and fell back through `RuleResolver`'s old store.

### 11.1 Decisions

  * Drop the parallel naming entirely. **One** key per concept, the
    canonical storage key, used everywhere admin-visible:
    storage option, REST request body, REST response, picker JS
    `state.selection.*`, DOM `data-*` attributes, and `CHIP_KINDS`.
  * Tags split on `[\s,;|]+` (single-word tokens). Texts split only
    on `[|\r\n]+` so commas inside phrases survive. CSS lines split
    on `[\r\n|]+`.
  * `tta_settings_data` is read through
    `json_decode(wp_json_encode(...), true)` because the dashboard
    POST stores the whole option as a json-decoded `stdClass`; raw
    `is_array()` checks against the option object would silently
    no-op the picker save.
  * Per-post UI is a styled accordion (closed by default), built on
    native `<details>`/`<summary>` with a hidden marker, custom
    chevron that rotates on open, header gradient, and the Pick
    Visually launcher fixed to the right of the summary line.
  * Pro plugin localize must resolve `post_id` reliably (was
    `\the_ID()` — echoes, returns null) and ship a `post_permalink`
    so the per-post Pick button can build the picker URL without
    extra REST calls.

### 11.2 Sequencing (D27.10–D27.18)

  * **D27.10** Picker save endpoint writes flat at the top level of
    `tta_settings_data` (not nested under `settings`). Stale-nested
    sub-keys are merged up + deleted on next save.
  * **D27.11** Dashboard save handler in `TTA_Api_Routes` normalizes
    `tta__settings_exclude_tags` / `_exclude_texts` to pipe-joined
    strings on save (global + per-type overrides).
  * **D27.12** `/step-rail/scope-rule` reader switched to read the
    canonical storage (flat `tta_settings_data` keys, plus the
    `tts_pro_custom_css_selectors` post meta for `scope=post`).
  * **D27.13** Picker save always stores pipe-strings (not arrays)
    for tags/texts, matching dashboard textarea read shape.
  * **D27.14** Pro per-post save endpoint
    (`TTA_Pro_Api_Routes::css_selectors_for_posts`) gets the same
    pipe normalization.
  * **D27.15** Picker initial-load uses `/scope-rule` for any
    URL-pinned scope (global / post_type / post), instead of
    bouncing through `/active-rule` and `RuleResolver`'s old store.
  * **D27.16** Per-post UI: closed by default, Pick Visually
    rendered whenever there's a `post_id` (drop redundant `isPro`
    gate — the metabox itself is Pro-mounted).
  * **D27.17** Full rename of `selector` / `excl_*` →
    `tta__settings_*` across REST contracts, picker JS state, DOM
    `data-*` attrs, `CHIP_KINDS`, save body, and read parsers.
  * **D27.18** Per-post styled accordion (custom summary, chevron,
    hidden native marker). Pro localize fixed: `post_id` from
    `$post->ID` / `$_GET['post']`, `post_permalink` populated.

### 11.4 D27.19 — Honor per-post master toggle

`tta__settings_use_own_css_selectors` is the master switch for the
per-post layer. When the admin turns it off:

  * `/step-rail/scope-rule?scope=post` returns the same empty
    payload it would return for an unsaved post — picker doesn't
    load and re-edit a draft that won't apply at runtime.
  * The Pick Visually button on the per-post accordion summary is
    disabled with a tooltip ("Enable 'Use Own CSS Selectors' to
    edit this post's rule") so admins don't open a picker URL that
    won't reflect their save.

Saving from the picker (scope=post) re-flips the toggle to true —
saving means the admin wants the per-post rule active.

### 11.5 D27.20 — Pro bundle sync

The Pro plugin enqueues `tts-css-selectors.min.js` from the Free
plugin's path **only when `TTA_DEBUG_MODE` is on**; otherwise it
loads its own copy at
`text-to-audio-pro/Assets/js/build/`. The release pipeline used to
sync only `text-to-audio-pro-button.min.js` via the `copyProButton`
gulp task. Added `tts-css-selectors.min.js` (and its LICENSE.txt)
to that task so the per-post metabox bundle stays in sync.

### 11.3 Verified live (2026-05-01)

Save → reload renders correctly for all three scopes on
`http://localhost/tts/mcp-10-simple-daily-habits-for-better-health-and-wellness/`:

  * `?scope=global` — include selector, all 10 default tag
    checkboxes.
  * `?scope=post_type:post` — include + 1 exclude-CSS chip + 4 tag
    checkboxes (`aside, blockquote, table, footer`) + phrase chip
    with period preserved.
  * `?scope=post:175` — include + 2 exclude-CSS chips + 4 tag
    checkboxes + a multi-clause phrase chip with **internal commas
    preserved** (regression that originally split the phrase into
    two chunks).

## 12. D27.21–D27.22 — Runtime resolver + no-scope-URL parity

The wire-format collapse in §11 left one gap: while the picker UI
read from the new storage (via `/step-rail/scope-rule`), the
**runtime extractor** still resolved rules through `RuleResolver`,
which was reading the dead `tta_atlasvoice_selectors` option. So
on a post that had a per-type rule saved through the dashboard,
the picker showed the new rule but the player at page render time
applied a different (stale) rule from the legacy store.

D27.21 closes the gap. D27.22 fixes a related UX bug: opening the
picker on a post URL with no `?scope=…` was defaulting to
`scope=post` on Pro and fast-pathing through `/scope-rule?scope=post`
— which returns empty when the per-post toggle is off, even when a
per-type rule is winning at runtime.

### 12.1 D27.21 — RuleResolver repointed

  * `RuleResolver::resolve()` rewritten to walk the new 3-layer
    cascade against the live storage:
    - per-post → `tts_pro_custom_css_selectors` post meta, gated
      on `tta__settings_use_own_css_selectors`
    - per-post-type → `tta_settings_data['tta__settings_atlasvoice_per_type_overrides'][<slug>]`
    - global → flat `tta_settings_data['tta__settings_*']` keys
  * `settings_to_entry()` helper added: converts a flat
    `{tta__settings_*: ...}` bag into the resolver's internal
    `{selector, excl_css[], excl_texts[], excl_tags[]}` shape with
    the same pipe / newline / whitespace splitting rules as the
    picker reader (tags split aggressively, texts only on pipe /
    newline so commas inside phrases survive).
  * `load_post_rules()` reads `tts_pro_custom_css_selectors` and
    surfaces the master `use_own` flag the resolver now gates on.
  * `breadcrumbs()` collapsed to 3 layers. Per-post crumb label
    flips to "This post (override, disabled)" when the meta has
    data but the master toggle is OFF — the metabox UI now
    explains why a saved rule isn't winning.

`SelectorHash::resolve_rules` and the `/active-rule` REST handler
both consume `RuleResolver::resolve()`, so they inherit the new
storage automatically. No call-site changes needed.

### 12.2 D27.22 — Picker no-scope-URL falls back to the live winner

  * `state.scopeFromUrl` flag added: true only when the URL
    actually contained `?scope=…`. The Pro/Free default fallback
    no longer counts as "URL pinned".
  * `loadExistingRules()` only fast-paths through `/scope-rule`
    when `state.scopeFromUrl` is true. Otherwise it goes through
    `/active-rule` (the precedence walk) so the picker UI shows
    whatever is winning at runtime.
  * After `/active-rule` lands, the picker syncs `state.scope` to
    the resolved layer. Now the readout label, the chips on
    screen, and the eventual Save target all agree on one scope.

## 13. Final parity verification

After D27.21 + D27.22 (commits `919f8c6` + `f9cdbe0`), opening
`http://localhost/tts/mcp-10-simple-daily-habits-for-better-health-and-wellness/?atlasvoice_picker=1`
on post 175 (per-post toggle OFF, per-type rule saved):

| Layer | Selector | Match |
|---|---|---|
| `/step-rail/scope-rule?scope=post_type` | `div.elementor-element-242e3e0d` | source of truth |
| `/step-rail/active-rule` (RuleResolver, runtime) | `div.elementor-element-242e3e0d` | ✓ |
| Picker readout | `Editing rule for: Post type "post"` | ✓ |
| Picker include chip | `div.elementor-element-242e3e0d` | ✓ |
| Picker chips: exclude CSS / tags / phrase | matches per-type override | ✓ |

Toggle test:

  * `tta__settings_use_own_css_selectors = true` →
    `/active-rule` resolves to source `post`.
  * `tta__settings_use_own_css_selectors = false` →
    `/active-rule` falls through to source `post_type`.

Picker UI = REST `/active-rule` = REST `/scope-rule` = runtime
extractor. Single source of truth.

## 14. D27.23–D27.33 — runtime parity tail + dead-code retirement

After §13 declared parity, an audit caught a remaining gap and a
large amount of dormant infrastructure that the v5 collapse made
unreachable. This section records the work that landed on this
branch beyond the originally-planned checkpoints.

### 14.1 D27.23 — JS extractor migrated to new storage

The browser-side `tts-extractor-engine.js` was still walking the
retired `tts.atlasvoice_selectors` localized store for its Tier 2
saved-selector resolution. PHP was on the new storage, JS was not.
Closed by:

  * `LocalizeData::inject_lazy()` now ships a server-resolved
    `tta_obj.atlasvoice_resolved_rule = { selector, source,
    excl_css[], excl_texts[], excl_tags[] }` computed via
    `RuleResolver::resolve()` against the canonical storage.
  * `tts-extractor-engine.js::resolveRuleEntry` prefers that
    pre-resolved field. The legacy store walk stays as a back-compat
    fallback for older bundles or contexts where the lazy localize
    didn't run.

### 14.2 D27.24 — `/save-selector` + `/post-rules` repointed (later deleted)

The two legacy REST routes were repointed at the new canonical
storage instead of being deregistered (judgment call I rolled back
in D27.28 after the user pushed for full deletion).

### 14.3 D27.25 — One-shot upgrade-cleanup migration

`text-to-audio.php` admin_init: deletes the dead options /
post meta in batches and unschedules retired crons. Marker
`tta_d27_legacy_cleanup_done` blocks re-runs once the queue
drains. Targets accumulated across D27.25–D27.31:

  * `tta_atlasvoice_selectors` option (D27.21)
  * `tta_atlasvoice_heal_log` option (D27.28)
  * `tta_atlasvoice_boilerplate_suggestions` option (D27.28)
  * `tta_atlasvoice_snapshots` option (D27.29)
  * `_atlasvoice_post_rules` post meta (D27.21)
  * `_tta_mp3_variant` post meta (D27.31)
  * `_tta_atlasvoice_auth_samples` post meta (D27.31)
  * `tta_atlasvoice_detect_boilerplate` cron hook unscheduled
    (D27.28)

### 14.4 D27.26 — SelectorHash fingerprint inputs from new storage

(Subsequently obsolete: SelectorHash itself was retired in D27.33.)

### 14.5 D27.27 — `/step-rail/scopes` endpoint retired

The endpoint fed the scope-radio markup that the v5 picker
collapse retired (scope is URL-pinned now). Endpoint + handler +
the JS shell's `restFetch('/step-rail/scopes')` call + the
`renderScopeRow()` function + `SCOPE_OPTIONS` constant all
removed. (Commit `bdc9475`.)

### 14.6 D27.28 — `/save-selector` + `/post-rules` actually deregistered; heal log + boilerplate detector retired

The previous "repoint" left the routes alive in the public REST
surface. This commit physically deletes the registrations + the
handlers + every consumer in-tree, and at the same time retires
two features the auto-save / heal flow used to feed:

  * **Heal log** — UI component (`AtlasVoiceHealLog.js`) deleted;
    `/heal-log` route + `get_heal_log()` handler removed; option
    `tta_atlasvoice_heal_log` queued for cleanup.
  * **Detected boilerplate (beta)** — UI component
    (`AtlasVoiceBoilerplate.js`), `BoilerplateDetector` class +
    nightly cron, and the three `/boilerplate-*` REST routes all
    deleted.
  * `tts-picker.js::persistSelector()` reduced to a no-op stub so
    straggler callers resolve cleanly.
  * `AtlasVoiceSettings.js` (the wrapper) deleted; `Settings.js`
    drops the import + render site.

(Commit `dc07862`.)

### 14.7 D27.29 — Rule-snapshot ring buffer retired

Audit confirmed `Snapshots` was infrastructure waiting for a
consumer that never landed: no JS callers in either plugin, no
`atlasvoice_rules_changed` emitters, no readers of
`tta_atlasvoice_snapshots` option. Removed:

  * `Snapshots.php` class file deleted; `Bootstrap` registration
    removed.
  * `/snapshots` route + `get_snapshots()` + `post_snapshots()` +
    `scope_from_request()` helper deleted.
  * `do_action('atlasvoice_rules_changed', …)` emits in
    `PerPostRules::set/clear` removed (no remaining listeners).
  * Option queued for cleanup.

(Commit `b94d2f2`.)

### 14.8 D27.30 — Tier 1 dead-code retirement

Mechanical-delete batch — REST routes with no in-tree consumers
and class files that were never registered:

  * `/language-context` route + handler — no JS callers.
  * `/mode` (GET + POST) routes + `get_mode()` + `post_mode()`
    handlers — dashboard never surfaced a Go-Live UI; `Mode::set()`
    became permanently unreachable.
  * `AuthVariantsMetaBox.php` — orphan file, never registered.
  * `CachePurgeHints.php` — zero callers.
  * Stale `/auth-variant` reference dropped from class docblock.

Documented public-extension `do_action` emits left intact
(`atlasvoice_mode_changed`, `regen_*`, etc.) — emit-only with no
in-tree subscribers but documented API surface for third parties.

(Commit `c293a27`.)

### 14.9 D27.31 — Tier 2: AuthVariants + PerPostRulesMetaBox

  * **`AuthVariants`** — per-post auth-variant pin + 10-deep
    sample ring, used by `SelectorHash` for cache fingerprinting.
    Variant-aware MP3 caching never shipped end-to-end (no UI, no
    Pro consumer). Class file deleted; SelectorHash
    `auth_bucket` field + `current_auth_bucket()` helper dropped.
  * **`PerPostRulesMetaBox`** — added a redundant breadcrumb table
    to the post-edit metabox. Superseded by the React per-post
    accordion (`CSSSelectorsForPosts.js`). Deleted.
  * Cleanup migration extended to strip `_tta_mp3_variant` and
    `_tta_atlasvoice_auth_samples` meta in batches.
  * `Mode` class kept per user direction — `is_opted_in() / get()
    / status()` still consulted by `RegenGuard` and `PickerLoader`
    until those are retired in D27.33.

(Commit `b8a1be9`.)

### 14.10 D27.32 — D13 Readers integration retired

The eight reader files in `includes/atlasvoice/Readers/` plus
`ReadersIntegration.php` were dormant-by-design (the
`ReaderRegistry` docblock said so explicitly). Project decision
to read what visitors see in the DOM superseded the out-of-DOM
custom-field reader path. Eight files + the glue all deleted.

`apply_filters('atlasvoice_after_clean_content', ...)` emit in
`helpers.php` kept as a public extension point.

(Commit `1469292`.)

### 14.11 D27.33 — Tier 3: SelectorHash + RegenGuard + ContentHash + LanguagePlugins

Pro-side audit confirmed zero references to any of these classes,
the `atlasvoice_mp3_generated` / `atlasvoice_regen_skip` actions,
or the `_atlasvoice_selector_hash` post meta. The entire
D3/D4/D7/D8 fingerprint-and-regen pipeline was speculative
infrastructure that never connected to Pro's MP3 synthesis flow.

  * **`SelectorHash`** — fingerprint generator for an MP3 cache
    invalidator that no consumer existed for. Class file deleted.
  * **`RegenGuard`** — visitor-request gate firing actions nobody
    subscribed to. Class file deleted.
  * **`ContentHash`** — content-based fingerprint, only used by
    the two above. Class file deleted.
  * **`LanguagePlugins`** — WPML/Polylang detection. Per-language
    scopes were retired in D26 collapse; the remaining `lang`
    field in `SelectorHash` fingerprint became dead with that
    class. Multilingual sites lose the per-language `lang` value
    in `tta_obj` — acceptable per user direction. Class file
    deleted; downstream callers in `LocalizeData`, `RuleResolver`,
    and `RestRoutes` stripped of the `LanguagePlugins::*` calls.

`Mode` class still alive but its consumers (`PickerLoader::is_opted_in`
gate, etc.) were also untangled in this commit so deleting Mode
later is a one-file delete rather than a cascade.

(Commit `ac61b73`.)

### 14.12 Net result

> Stale snapshot — see **§15.12** for the current surviving-files
> map. After §14 closed at D27.33 the directory had 9 PHP files;
> `PerPostRulesMetaBox` was already gone (retired in §14's D27.31
> commit) but the count below counted it incorrectly. §15's
> picker-UX work (D27.34–D27.43) didn't add or remove any class
> files; the live count is now 8 PHP files + `step-rail.shell.js`.

`includes/atlasvoice/` directory at the start of this branch:
~22 PHP class files + a `Readers/` subdirectory of 8 reader
implementations. The directory now contains only what powers
the live picker, the resolver it feeds, and the per-post storage
layer.

The migration in `text-to-audio.php` will keep draining stale data
on every admin pageview until `tta_d27_legacy_cleanup_done` is
set; long-tail installs that ever stored AtlasVoice rules
get cleaned automatically without an explicit upgrade prompt.

## 15. D27.34–D27.43 — picker UX hardening + extractor parity

After §14's dead-code retirement closed the bulk of the cleanup,
the next round addressed three things in parallel: (a) picker UI
defaults that surfaced bad selectors on Elementor/Gutenberg sites,
(b) the runtime extractor still using short-name keys instead of
the canonical `tta__settings_*` set everything else had moved to,
and (c) one more REST endpoint that turned out to be redundant
once the resolved rule was on the localize bag.

### 15.1 D27.34 — `script` + `style` join the default skip-tag set

The picker's step ④ "Skip these tag types" shipped with ten
default-checked tags but never `<script>` / `<style>`. Their text
content (JS source, CSS rules) is meaningless to a listener so
they're always-skip candidates.

  * `StepRail.php::render_common_tag_checkboxes()` — list extended to twelve.
  * `TTA_Activator.php` — `tta__settings_exclude_tags` default
    seeded with the same twelve pipe-joined, so a fresh install
    excludes them at runtime without requiring the admin to open
    the picker first. Was an empty array before.

(Commit `caacc55`.)

### 15.2 D27.35 — Picker selector-stability layer

When an admin clicked an Elementor widget the picker generated
selectors like `div.elementor-element-242e3e0d` — per-instance
hash classes that change every page render and never match on
other posts. Fix is in `step-rail.shell.js`:

  * `findContentWrapper(el)` walks ancestors looking for
    `tts_content_wrapper_<N>`; the strongest stability hook
    because Free + Pro both emit it.
  * `DYNAMIC_CLASS_PATTERNS` blocks `^elementor-element-<hash>`,
    `^e-con-<hash>`, `^wp-block-*-<n>`, `^css-<hash>`, `^id-<hash>`,
    and any 8+ hex segment delimited by `_`/`-`.
  * `STABLE_CLASS_RANK` ranks well-known theme content classes
    (entry-content > post-content > article-content > main-content
    > site-content > content) ahead of arbitrary stable classes.
    No Elementor widget classes in the rank per project decision.
  * `generateSelector()` runs all three (wrapper preference, then
    dynamic-class filter, then ranked stable class).
    `generateExcludeSelector()` inherits the dynamic-class filter
    only — exclude rules are scoped inside the content clone, so
    escalating to the wrapper would delete the entire content
    region.

(Commit `ce210b8`.)

### 15.3 D27.36 — Drag-exclude routes through `generateExcludeSelector`

`selectorsFromTouched()` was always calling `generateSelector()`
per touched element, including for `select-excl` (drag-exclude)
mode. After D27.35 introduced the wrapper-preference pass in
`generateSelector`, drag-excluding a region produced a rule that
deleted the entire content wrapper. Fixed by branching on
`state.pickMode === 'select-excl'` and using
`generateExcludeSelector` instead.

(Commit `ce210b8`.)

### 15.4 D27.37 — Content region readout looks like an input

The Content region's selector readout was styled as a flat grey
text pill (`.av-selector-display`) with a transparent inner field.
Now reuses the same `av-chip-input` visual treatment as Step
④/⑤/⑥'s chip-add inputs — proper border, white background,
monospace font. `.av-chip-input` rule unscoped from `.av-chip-add`
so the styling applies wherever the class is used.

(Commit `ce210b8`.)

### 15.5 D27.38 — "Emit Content Wrapper" toggle in Settings

`tta__settings_emit_legacy_wrapper` was wired in `helpers.php`
(Free) and `TTA_Pro_Filters.php` (Pro) since D26.7 but never had
a UI. Added a new `<SettingRow>` after "Enable TTS Status" in
`Settings.js`. Default ON; admins on themes that break on the
wrapper div can flip it off, which makes the picker's
wrapper-preference pass fall through to the dynamic-class
blocklist + theme content classes.

(Commit `ce210b8`.)

### 15.6 D27.39 — `findContentWrapper` extracts the actual N

D27.35 returned `[class*="tts_content_wrapper_"]` (substring
match — every wrapper on the page). When pages render multiple
shortcode instances the admin couldn't target one specifically.
Now extracts the actual N from the matched ancestor's class and
returns `div.tts_content_wrapper_<N>`. Walking up parentElement
guarantees the picker pulls the wrapper the clicked element
actually sits inside — clicking inside `_2` returns
`div.tts_content_wrapper_2`, not `_1`.

(Commit `ce210b8`.)

### 15.7 D27.40 — Extractor tier reorder: saved selector beats markers

`tts-extractor-engine.js::resolveContent` had Tier 1 = comment
markers, Tier 2 = saved selector. When an admin saved a specific
selector like `div.elementor-element p:nth-of-type(3)` the marker
tier still won and read the entire bracketed wrapper, ignoring
the explicit choice. Reordered:

```
1. Saved selector  (admin's explicit pick)
2. Comment markers (atlasvoice:start:N / :end:N)
3. Legacy `.tts_content_wrapper_<N>`
4. Schema / ARIA
5. Builder body selectors
6. Generic article / .entry-content / main article
7. PHP-baked ttsCurrentContent
```

Saved-selector exclusions are still applied to the matched node
before text extraction.

(Commit `9578525`.)

### 15.8 D27.41 — Extractor + LocalizeData payload use canonical keys

The wire/storage/picker layers had been on `tta__settings_*`
canonical keys since D27.17, but the runtime extractor's internal
rule object still used the legacy short names (`selector`,
`excl_css`, `excl_texts`, `excl_tags`). The PHP→JS transport
that feeds the engine (`atlasvoice_resolved_rule`) used the same
short names.

  * `tts-extractor-engine.js` — `normaliseRuleEntry` /
    `resolveRuleEntry` / `applyExclusions` /
    `applyTextExclusions` / `resolveSavedSelector` all rewritten
    to read/emit canonical keys. `normaliseRuleEntry` accepts
    legacy short-name input as a back-compat (older
    `atlasvoice_selectors` payloads still flow through) but
    emits canonical only.
  * `LocalizeData::inject_lazy` ships `atlasvoice_resolved_rule`
    with canonical keys.

End state: anywhere you inspect the rule shape — picker state,
REST body, storage, localized data, runtime engine — you see only
`tta__settings_*` keys.

(Commit `389f7d0`.)

### 15.9 D27.42 — `RuleResolver::resolve()` output canonical-keyed

Same rename, server side. `RuleResolver::resolve()` was returning
`{ selector: ..., excl_css: ..., excl_texts: ..., excl_tags: ... }`
to its callers (`LocalizeData`, `RestRoutes`'s `/active-rule`
handler — about to retire in D27.43). Now returns the canonical
keys directly. `selector_source` / `excl_set` / `post_type` /
`language` / `selector_store` / `post_override` are runtime
metadata (not storage keys) and keep their existing names.

  * `RuleResolver::settings_to_entry()` returns canonical entry
    shape; `breadcrumbs()` reads canonical from the store
    snapshot.
  * `LocalizeData::inject_lazy` updated to read canonical from
    resolver output.
  * Dead helpers `entry_sel()` / `entry_excl()` removed (zero
    callers since D27.21).

(Commit `389f7d0`.)

### 15.10 D27.43 — `/step-rail/active-rule` retired

The picker's `loadExistingRules()` was calling
`/step-rail/active-rule` to get the resolver's answer, but
`atlasvoice_resolved_rule` already ships that exact payload via
`LocalizeData::inject_lazy`. One round-trip per picker open for
data already on the page.

  * `LocalizeData::inject_lazy` payload extended with
    `post_type` / `language` / `excl_set` so it's a complete
    drop-in for the old REST response.
  * `step-rail.shell.js::loadExistingRules()` rewritten to read
    `ttsObj.atlasvoice_resolved_rule` synchronously. The
    URL-pinned-scope branch (D27.15) is unchanged — it still
    uses `/step-rail/scope-rule` because it asks for the rule
    at one specific scope, not the resolver's winner.
  * `RestRoutes.php` — `/step-rail/active-rule` route registration
    + `get_step_rail_active_rule()` handler deleted. Class-level
    route list updated.
  * Class-level state docs updated: `state.postType` /
    `state.postLang` are now noted as cached from
    `atlasvoice_resolved_rule` (was "from /active-rule on init").

(Commit `389f7d0`.)

### 15.11 Side-edit on Pro plugin (no D number)

Concurrent with D27.41–D27.43, `TTSProHelper.js::getModifiedContent`
had its `window.AtlasVoiceExtractor.getContentForPlayer()`
short-circuit removed. The short-circuit was opt-in gated on
`tts.use_atlasvoice_extractor`, a flag retired back in D26.9 (now
hard-coded `true` in `LocalizeData::inject`). With the flag always
true, the short-circuit was effectively always-on for any install
loading the extractor bundle, which competed with Pro's own
content pipeline. Pro now stays on its existing path.

(Pro commit `341824157`.)

### 15.12 Updated surviving-files map

After Tier 1/2/3 retirements and §15's runtime-parity work,
`includes/atlasvoice/` contains 8 PHP class files plus
`step-rail.shell.js`:

  * `Bootstrap.php`
  * `LocalizeData.php`
  * `Mode.php`
  * `PerPostRules.php`
  * `PickerLoader.php`
  * `RestRoutes.php`
  * `RuleResolver.php`
  * `StepRail.php`
  * `VerifyAcrossPosts.php`
  * `step-rail.shell.js`

(§14.12's earlier 9-file count was stale — `PerPostRulesMetaBox`
went away in D27.31; that's reflected here.)

REST surface still registered:

  * `POST /atlasvoice/save-rule`
  * `GET  /step-rail/scope-rule`
  * `GET  /step-rail/sample-url`
  * `GET|POST /step-rail/verify-sample`

Everything else listed in earlier §10/§12 docblocks is retired.
