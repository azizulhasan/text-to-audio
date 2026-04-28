# TTS-238 — Content Extraction Overhaul (Plan v5 — consolidation + step-rail UI + architecture reconciliation)

**Status:** Plan v5 — supersedes v4.2. Consolidates every point agreed across the mid-session conversation into a single coherent document: three-layer runtime architecture, hook-based isolation via the Strangler Fig pattern, content-hash short-circuit, lazy visitor-load MP3 invalidation, zero-click auto-detection as the primary flow, step-rail + iframe preview as the fallback UI, self-healing + boilerplate detection, six-hard-cases in-UI guidance, staging/production mode with admin-bar status dot + Go Live dialog, snapshot/rollback per scope, lazy picker bundle loading, Free vs Pro split (Free = browser `speechSynthesis`, Pro = MP3 with cost-sensitive regen), and the D1–D14 remaining-work roadmap. Adds **§14 Architecture reconciliation** covering the Option A refactor of §0.7 code into the isolated `includes/atlasvoice/` directory to restore the zero-existing-file-edits promise.

**Plan date:** 2026-04-21 (v5) · Supersedes [TTS-238-content-extraction-overhaul.md](TTS-238-content-extraction-overhaul.md) (v4.2)
**Branches:** `feature/TTS-238` in both `text-to-audio` (Free) and `text-to-audio-pro` (Pro)
**Jira:** https://atlasaidev.atlassian.net/browse/TTS-238
**Related:** [research-competitor-content-extraction.md](research-competitor-content-extraction.md) · [TTS-future-content-extraction-improvements.md](TTS-future-content-extraction-improvements.md) · v4.2 carries all §1–§20 detail; this v5 re-states the high-level commitments and the remaining-work roadmap in one place. Cross-reference the v4.2 file for tier-by-tier extraction mechanics (§4), REST contracts (§8), telemetry events (§14 in v4.2), builder/LMS grids (§15 in v4.2), and legacy-wrapper-div timeline.

**Shipping status at v5 draft time:**

| Milestone | State | Commit range |
|---|---|---|
| §19 Player init unification | ✅ Shipped 2.1.16 | (historical; see v4.2 §19) |
| PR-A Opt-in flag + Settings UI split | ✅ Shipped | `feature/TTS-238` |
| PR-B B1 confidence scorer | ✅ Shipped | `296f223` |
| PR-B B2 first-visit auto-save + low-confidence toast | ✅ Shipped | `08b295c` |
| PR-B B3+B4 diff preview + 5s listen sample | ✅ Shipped | `59d8151` |
| PR-C §0.7 C1a–C7a ticket-killers (self-heal, heal-log, cache-purge, boilerplate, language, auth-variants, mutation-observer) | ✅ Shipped, **isolation-pending refactor** — see §14 | `60448ba` through `1319529` |
| PR-C D9 (front-end floating step rail, live DOM picker) | ✅ Shipped | `feature/TTS-238` |
| PR-C D10 (chip editor, exclude-pick, undo, load-rules) | ✅ Shipped | `feature/TTS-238` |
| PR-C D11 (word-count badge, live preview panel) | ✅ Shipped | `feature/TTS-238` |
| PR-C D12 (Pro pill upsell, pointer-events guard) | ✅ Shipped | `feature/TTS-238` |
| PR-C D9–D12 bug fixes (2026-04-22) | ✅ Shipped | `feature/TTS-238` |
| PR-C save + scope-reload fixes (2026-04-22) | ✅ Shipped | `feature/TTS-238` |
| PR-C D13 (custom-field readers, dormant + opt-in filter) | ✅ Shipped | All 6 readers (ACF, MetaBox, Pods, JetEngine, Toolset, Carbon Fields) ship via PSR-4. Wired via dormant `atlasvoice_extra_field_text` filter; see `docs/atlasvoice-readers.md` |
| PR-C D14 (verify-across-posts dry run) | ✅ Shipped | `feature/TTS-238` (D14.1 server class + REST, D14.2 iframe runner, D14.3 UI) |
| PR-C D15–D20 (picker parity, drag-to-mark, dynamic ids, gate removal, SVG safety, builtin defaults, auto-exit) | ✅ Shipped | `feature/TTS-238` |
| PR-C D5 polish (Verify wired as Go Live soft-prereq) | ✅ Shipped | `feature/TTS-238` |
| PR-C D1–D8 (regen-guard, content-hash, selector-hash, mode, snapshots, per-post rules, picker loader) | ✅ Shipped | All classes registered via `Bootstrap::register()`; hooks active. D1 on `template_redirect`; D3 on `atlasvoice_mp3_generated`; D4/Mode on `admin_bar_menu`; D6/D7/D8 wired through Bootstrap. Smoke-test on production-mode flip still recommended on first live site. |

---

## 1. Core principles (the commitments that must survive every revision)

Every prior plan revision has lost one of these commitments at some point; this v5 pins them down so they cannot be dropped again. The D1–D14 roadmap in §13, the file layout in §14, the rollout in §15, and the acceptance criteria in §16 all exist to honour these principles simultaneously.

**P1 — Zero existing-file edits except top-of-function opt-in gates.** The legacy extraction pipeline (`TTSProHelper.js::getModifiedContent`, `helpers.php::tta_get_button_content`, `TTA_Pro_Filters.php::tts_button_with_content_callback`, `TTA_Pro_Helper::acf_plugin_content`) keeps a byte-identical code path when Layer 1 opt-in is OFF. The only edit allowed on a legacy function is a top-of-function `if ($opt_in) { try new path; return if succeeded }` short-circuit. The body underneath is untouched. Strangler Fig (Martin Fowler): the new system grows next to the old one until it can take over.

**P2 — Hook-based integration.** The new system plumbs in via WordPress actions/filters (`template_redirect`, `tts_should_add_content_wrapper`, `atlasvoice_pre_listen`, `atlasvoice_extractor_result`, etc.). No monkey-patching.

**P3 — Copy-with-rename, never share.** When the new system needs a method from the legacy code (sentence-delimiter split, HTML strip, text-before/after, settings wrappers, ACF reader), the method is **copied with a new name** into `includes/atlasvoice/lib.php` (prefix `atlasvoice_*`) or `includes/atlasvoice/Readers/*Reader.php` (namespace `TTA\AtlasVoice\*`). The original stays where it is. Dual-maintenance for one release window; the legacy copy is deleted together with the opt-in-OFF code path only after the new pipeline has been production-default for at least one minor version.

**P4 — Isolated directory + namespace.** All new PHP lives under `includes/atlasvoice/` with namespace `TTA\AtlasVoice\*`. All new JS lives under `src/extractor/` (engine) + `src/picker/` (step-rail UI). All new dashboard React components live under `src/dashboard/components/dashboard/atlasvoice/`. Deleting the directory + turning Layer 1 OFF = the system is gone with no footprint on the legacy code path.

**P5 — Three orthogonal layers.** Layer 1 (opt-in) → Layer 2 (mode = staging/production) → Layer 3 (rules). Each layer is independently togglable and has its own storage key. A user can opt in, stay in staging, and never write a rule — the engine runs with auto-detection alone. `opt-in ON + staging + zero rules` is a valid, safe state.

**P6 — Zero-click is the primary flow.** The scorer + first-visit auto-save + self-healer + boilerplate detector cover ≥85% of opt-ins with no UI surface visible beyond the Layer 1 toggle. Every mandatory UI step is a ticket vector, so no step is mandatory. The fallback UI (§4 step-rail + iframe preview) only opens when scoring confidence < 0.8 or when the user clicks "Advanced".

**P7 — Self-heal before asking the user.** If a saved selector stops matching (theme update, builder rebuild, cache skew), the engine silently re-scores. If the new candidate's confidence ≥ 0.8, the selector is replaced automatically and the heal is logged to a dashboard badge. The admin never sees a broken player; they see a "N posts auto-healed" badge they can click to review or revert. The docs page has the long-form explanation, but the first surface the admin hits is a resolved state, not an error.

**P8 — Cost-sensitive regeneration (Pro).** Pro's MP3 regeneration is driven by two optimisations: (a) content-hash short-circuit — `md5(extracted_text)` unchanged means the existing MP3 is still valid regardless of settings changes; and (b) lazy visitor-load invalidation — a settings change marks the post dirty but does not delete MP3s until the next real listener. A 500-post site that changes its exclude list pays regen cost only for posts actually listened to.

**P9 — Free never has MP3s; Free never has provider cost.** Free uses the browser `speechSynthesis` API at listen time. All MP3 regeneration, content-hash short-circuit, lazy-invalidation, cache-purge hints, and cost-surface UI live entirely in Pro. Free only stores the extracted-text hash for dry-run diff purposes.

**P10 — "Option X" staging keeps legacy serving visitors.** When Layer 2 = `staging`, the NEW pipeline writes rules and trains itself but legacy output is what visitors hear. Only when the admin flips Layer 2 = `production` (via the Go Live dialog with typed confirmation) does the new pipeline become authoritative. This makes the opt-in reversible with zero visitor impact.

**P11 — Rule chips everywhere.** Every rule (include selector, exclude selector, tag-type, text phrase) is rendered as a dismissible chip. Editing a rule does not re-launch a separate picker — the chip's `[edit]` affordance re-arms pick mode scoped to that row. Chips surface on the step rail, the post-edit meta box (Pro per-post scope), and the dashboard Rules table.

**P12 — Precedence breadcrumbs (Pro).** When multiple scopes apply (post overrides post type overrides global), the UI shows the active-rule chain at the top of the step rail: `Global (#main) › Post type: post (.entry-content) › This post (custom)`. Most-specific wins; parent scopes are shown greyed to remind admins why their post's player reads what it reads.

**P13 — Lazy bundle loading.** The picker + step-rail + iframe-preview code is a separate JS bundle (`tts-picker.min.js`) that is NOT enqueued on page load. It is fetched on-demand when the Advanced panel opens, the admin-bar "Pick content area" link is clicked, or a low-confidence toast's "[Change]" is clicked. Users whose site the engine auto-handles (the happy path) pay no bandwidth for UI they never see.

**P14 — In-UI guidance, never a docs hunt.** The six hard cases (§7) are each surfaced at the exact point the admin hits the symptom — a badge, a toast, a chip, a radio in the meta box. The docs page has the long-form explanation for power users, but the primary guidance lives where the problem is visible.

**P15 — Freemius gating audit remains clean.** No new Free feature hidden behind premium checks. Pro features gated via `TTA_Helper::is_pro_active()` only. Freemius SDK init skipped when Pro is present (unchanged from today).

---

## 2. Three-layer runtime architecture

| Layer | Setting key | Values | Default | Who writes | Who reads |
|---|---|---|---|---|---|
| **1 · Opt-in** | `tta__settings_use_atlasvoice_extractor` | `bool` | `false` (existing) / `true` (fresh) | Settings toggle | Bootstrap + opt-in gates |
| **2 · Mode** (Pro) | `tta__settings_atlasvoice_mode` | `staging` \| `production` | `staging` | Go Live dialog | Regen-guard + admin-bar dot |
| **3 · Rules** | `tta_atlasvoice_rules` | scoped rule map | `{}` | Picker / meta box | Extractor + engine |

**Rules shape:**

```json
{
  "global":        { "include": ".entry-content",
                     "exclude": [],
                     "tag_excludes": [],
                     "text_excludes": [] },
  "cpt:post":      { "include": ".entry-content",
                     "exclude": [".share-btns", ".related"],
                     "tag_excludes": ["figure"],
                     "text_excludes": ["Share this post"] },
  "post:123":      { "include": ".custom-body",
                     "exclude": [],
                     "tag_excludes": [],
                     "text_excludes": [] },
  "cpt:post:es":   { "include": ".contenido", ... }
}
```

**Resolution order (most-specific wins):** `post:{id}:{lang}` → `post:{id}` → `cpt:{type}:{lang}` → `cpt:{type}` → `global:{lang}` → `global` → scoring.

**Layers are orthogonal.** A user can opt in (L1 ON), stay in staging (L2 = staging), and have zero saved rules (L3 = {}). The engine runs with default scoring + auto-detected excludes; visitors keep hearing the legacy output (Option X). This is the safest possible state and the one PR-C validates first.

**Per-post-meta storage (hook-based isolation):**

| Meta key | Who writes | Purpose |
|---|---|---|
| `_atlasvoice_selector_hash` | Picker save | Tags a cached MP3 with the rule fingerprint it was generated under. Mismatch with current fingerprint → mark dirty. |
| `_atlasvoice_content_hash` | Extractor on every run | `md5(extracted_text)` — powers the content-hash short-circuit. |
| `_atlasvoice_variant_pinned` | Auth-variants meta box | `auto` \| `logged_out` \| `logged_in` \| `both`. Drives bucket selection on first listen. |
| `_atlasvoice_regen_dirty` | Regen-guard on settings change | One-shot flag consumed on next visitor listen. |
| `_atlasvoice_snapshot_history` | Snapshot store (D6) | 5-deep history per scope for one-click revert. |

---

## 3. Hook-based isolation — `includes/atlasvoice/` directory layout

**Target layout (post-refactor, §14):**

```
includes/atlasvoice/
├── Bootstrap.php              [TTA\AtlasVoice\Bootstrap]     template_redirect pri 9
├── Rules.php                  [TTA\AtlasVoice\Rules]         Layer-3 resolve/write
├── RegenGuard.php             [TTA\AtlasVoice\RegenGuard]    template_redirect pri 5 (D1)
├── ContentHash.php            [TTA\AtlasVoice\ContentHash]   md5 short-circuit (D2)
├── SelectorHash.php           [TTA\AtlasVoice\SelectorHash]  fingerprint on save (D3)
├── Mode.php                   [TTA\AtlasVoice\Mode]          staging/production (D4)
├── Snapshots.php              [TTA\AtlasVoice\Snapshots]     5-deep history (D6)
├── SelfHealer.php             [TTA\AtlasVoice\SelfHealer]    re-score on match-fail
├── BoilerplateDetector.php    [TTA\AtlasVoice\Boilerplate]   daily WP-Cron
├── CachePurgeHints.php        [TTA\AtlasVoice\CachePurge]    deep-links per cache plugin
├── LanguagePlugins.php        [TTA\AtlasVoice\LanguagePlugins] WPML/Polylang/TP/GTranslate
├── AuthVariants.php           [TTA\AtlasVoice\AuthVariants]  logged-out vs logged-in buckets
├── AuthVariantsMetaBox.php    [TTA\AtlasVoice\AuthVariantsMetaBox] post-edit radio
├── VerifyAcrossPosts.php      [TTA\AtlasVoice\VerifyAcrossPosts] dry-run fleet (D14)
├── lib.php                    [function  atlasvoice_*]        copy-with-rename helpers
└── Readers/
    ├── ACFReader.php          [TTA\AtlasVoice\Readers\ACFReader]
    ├── MetaBoxReader.php
    ├── PodsReader.php
    ├── JetEngineReader.php
    ├── ToolsetReader.php
    └── CarbonFieldsReader.php
```

**Hook-registration pattern:**

```php
// text-to-audio.php — ONE line added (D0 already shipped):
\TTA\AtlasVoice\Bootstrap::register();

// Bootstrap.php — wires up every cross-cutting concern via add_action / add_filter:
public static function register() {
    if ( ! get_option('tta_settings_data')['tta__settings_use_atlasvoice_extractor'] ?? false ) return;
    \TTA\AtlasVoice\RegenGuard::register();              // template_redirect pri 5 (D1)
    \TTA\AtlasVoice\SelfHealer::register();              // atlasvoice_extractor_result filter
    \TTA\AtlasVoice\BoilerplateDetector::register();     // wp-cron
    \TTA\AtlasVoice\AuthVariants::register();            // post_content hash per-bucket
    \TTA\AtlasVoice\AuthVariantsMetaBox::register();     // tts_after_metabox_content
    \TTA\AtlasVoice\CachePurgeHints::register();         // save-selector REST response
    \TTA\AtlasVoice\LanguagePlugins::register();         // runtime detection
    \TTA\AtlasVoice\Mode::register();                    // admin-bar dot (D4)
}
```

**Zero existing-file edits** means: after refactor, `grep -r "AtlasVoice" admin/ api/ src/dashboard/ includes/TTA_Helper.php includes/TTA_Hooks.php` returns only call-sites that already exist as shipped opt-in gates. The core new system is self-contained under `includes/atlasvoice/`.

**Library file `lib.php`** carries the copy-with-rename helpers:

```php
// includes/atlasvoice/lib.php
function atlasvoice_sentence_delimiter() { /* copy of TTA\TTA_Helper::sentence_delimiter */ }
function atlasvoice_strip_tags_safely($html) { /* copy of tta_clean_content */ }
function atlasvoice_text_before_after($content, $post_id) { /* copy of helpers.php logic */ }
function atlasvoice_get_setting($key, $default = null) { /* thin wrapper */ }
function atlasvoice_is_pro_active() { /* thin wrapper */ }
function atlasvoice_current_language_code() { /* WPML/Polylang/TP/GTranslate detect */ }
```

Any change to the legacy equivalents ripples into `lib.php` only if the v5 behaviour needs to track upstream. The legacy copies stay in place byte-identical.

---

## 4. Zero-click happy path + step-rail fallback UI

### 4.1 Happy path (~85-90% of opt-ins, zero clicks)

1. User turns Layer 1 opt-in ON in Settings.
2. First visitor (or admin preview) loads a post of each active post type.
3. Engine runs scoring (v4.2 §4.5). If `confidence ≥ 0.8`, selector is **auto-saved** silently to the per-CPT scope via first-visit auto-save.
4. A non-blocking toast appears in the admin preview: *"Content area detected automatically for Posts. [▶ Listen sample] [Change]"*. Dismissible; ignoring it is correct.
5. Auto-detected excludes (nav-like descendants) are applied silently. Auto-detected boilerplate text excludes (cross-post substring analysis) are surfaced as dismissible suggestion chips.

No picker. No wizard. No CSS.

### 4.2 Low-confidence path (~10-15%, one click)

When `confidence < 0.8` or auto-scoring has no clear winner (e.g. Oxygen Builder with generic class names), the toast changes: *"We need your help picking the content area. [Pick visually]"*. Clicking triggers **D8 lazy picker bundle load** → opens the step-rail + iframe preview described in §4.4. User points at the text, clicks "Use this", done. Everything else is auto-detected around the chosen container.

### 4.3 Power-user / edge-case path (opt-in only)

A collapsed **"Advanced refinement"** panel in Settings exposes: scope override, tag-exclude chips, text-exclude chips (pre-filled by the boilerplate detector), per-post overrides (Pro). Never shown by default; the engine works without anyone opening it.

### 4.4 Step rail — front-end floating tabs on actual post page (D9 v5 rebuilt)

**Architecture decision (2026-04-22):** The original iframe-sandbox two-column admin workspace was replaced with two floating tabs that appear directly on the post page itself. No iframe, no sandboxed preview, no postMessage bridge. The picker operates on the live DOM.

```
Post page (singular, listening-enabled, admin logged in)
│
├── LEFT: fixed "AtlasVoiceSelector" vertical tab  ──► slides open 300px panel
│   ┌─────────────────────────────────────┐
│   │ ① Scope                             │
│   │   ○ Global  ○ Post type  ● This post│
│   │ ② Content region                    │
│   │   [⊙ Pick element]  ~320 words      │
│   │   ✔ .entry-content  [×]             │
│   │ ④ Skip these areas         🔒 Pro   │
│   │   [⊙ Pick to exclude]  or [input]  │
│   │   .sidebar × .share × [+ Add]       │
│   │ ⑤ Skip these tag types     🔒 Pro   │
│   │   ☐aside ☐figure ☐blockquote …     │
│   │ ⑥ Skip these phrases       🔒 Pro   │
│   │   [input]  [+ Add]                  │
│   │ ─────────────────────────────────── │
│   │ Saved ✓            [Save]           │
│   └─────────────────────────────────────┘
│
└── RIGHT: fixed "Preview Content" vertical tab ──► draggable overlay
    ┌──────────────────────────────────────┐
    │ ≡ Content Preview   ~280 words  [×] │
    │ ──────────────────────────────────── │
    │  Lorem ipsum paragraph text …        │
    │  Another paragraph …                 │
    └──────────────────────────────────────┘
```

**Trigger:** `template_redirect` checks `is_singular()` + `current_user_can('manage_options')` + `post_has_listening()`. No admin activation needed — tabs appear automatically on every eligible post when an admin is logged in.

**Dashboard convenience:** plugin dashboard page emits an "Open & Pick" launcher in `admin_footer`. Admin pastes a post URL → clicks "Open & Pick" → page opens in new tab with `?atlasvoice_picker=1` → left panel auto-opens.

**Step rail mechanics:**

- **① Scope** — radio pills: `Global` / `Post type` / `Language` / `Post type + language` / `This post`. On open, the active winning scope is pre-selected via `/step-rail/active-rule` (see Init section below). **Changing scope** calls `loadRulesForScope()` → `GET /step-rail/scope-rule?post_id=N&scope=X` which reads the saved rule at exactly that scope (no precedence walk) and repopulates selector, chips, and checkboxes. If nothing is saved at that scope, fields reset to defaults. `state.postType` / `state.postLang` are cached from the initial `/active-rule` response so post_type and language are correctly passed even after scope switches that cleared them.
- **② Content region** — `[⊙ Pick element]` button arms the live DOM picker. Hover element → teal ring (`.av-picker-hover`). Click → green ring (`.av-picker-selected`), selector auto-generated + shown in an **editable `<input>`** (not read-only `<code>`). User can type a selector manually; the input triggers live preview on change. Click same element again → deselects. Word-count badge (`~N words`) updates immediately. On init, the selector field is auto-filled from the active extraction system (`detectActiveSelector()`) if no saved rule exists.
- **④ Skip these areas** (Pro) — CSS-exclude chips. `[⊙ Pick to exclude]` arms exclude-picker mode: hover → red ring (`.av-picker-exclude-hover`), click → dark-red ring (`.av-picker-excluded`) + chip added with nth-child–qualified selector so sibling elements are not over-excluded. Text input fallback. Each chip has `[×]` remove.
- **⑤ Skip these tag types** (Pro) — checkbox row (`aside`, `figure`, `blockquote`, `pre`, `code`, `table`, `form`, `nav`, `footer`, `header`) synced bidirectionally with chips. **All checkboxes default to checked.** Checking a box adds chip; removing chip unchecks box.
- **⑥ Skip these phrases** (Pro) — string chip editor. Type phrase → `[Add]`. Phrases are stripped from extracted text using `String.split(phrase).join('')` (text-level replacement, not line filtering), so partial phrases within a paragraph are also removed. Each chip has `[×]` remove.
- **Save** — `POST /tta/v1/atlasvoice/post-rules` (post scope) or `POST /tta/v1/atlasvoice/save-selector` (other scopes). Always sends all three `excl_css`, `excl_texts`, `excl_tags` arrays regardless of whether they are empty — empty array explicitly clears previously saved exclusions. Button stays enabled after save so admin can keep editing.

**Picker mechanics (live DOM, no iframe):**

- `mouseover` / `mouseout` listeners on `document` (capture phase) add/remove highlight classes.
- `click` listener (capture phase) calls `e.preventDefault() + e.stopPropagation()` to intercept link navigation during pick mode.
- `isRailElement()` guard skips any click/hover on `#av-steprail-root` so the panel itself is never accidentally picked.
- CSS selector generated by `generateSelector()`: tries `#id` first → unique `tag.class` → parent-context path with **`:nth-child(N)` suffix** when the class is not globally unique. The nth-child guard ensures that clicking the 3rd `<p>` inside a container produces `div.entry-content > p:nth-child(3)` rather than a selector that matches all siblings.
- `generateExcludeSelector(el)` uses the same nth-child + parent-context logic so excluded elements are precisely scoped, not over-broad (avoids producing bare `p` when a `<p>` inside `<figure>` is excluded).
- Undo stack (`Cmd/Ctrl+Z`) — 20 entries deep, restores picker highlights on pop.
- `Escape` key cancels pick mode without changes.

**Preview panel mechanics — selector-presence two-state model:**

**State A — "no selector set" (initial when no rule exists):**
Shows `extractFromActiveSystem()` unfiltered. Mirrors the extractor engine tier order:
1. Comment markers (`<!--atlasvoice:start:1-->` … `<!--atlasvoice:end:1-->`) — new AtlasVoice system active.
2. Legacy wrapper (`.tts_content_wrapper_1`) — old system active, no saved AtlasVoice rules.
Source label shown in meta bar: "AtlasVoice markers" / "Legacy wrapper".

**State B — "selector is set" (rule loaded or user picked one):**
Always uses `extractWithRules()` regardless of whether the user has made edits. Clones `document.querySelector(selector)`, removes excluded CSS elements + excl_tags elements + text phrases (via `split/join`), renders as `<p>` lines. Source label: "Active rules" (when loaded from server) or "Rule preview" (when user is actively editing). Word count + source label update in real time on every chip add/remove.

The distinction is purely **selector presence**: if `state.selection.selector` is non-empty, always apply rules. This ensures tag exclusions (⑤) are reflected immediately without needing to make any additional edit.

- Draggable by its header bar (`mousedown` → `mousemove` on document → `mouseup`).
- **Resizable** via right-edge handle (width) and bottom-edge handle (height). Rail panel has right-edge handle (width only). Both use `makeResizable(panel, handle, {dir})`.
- Word count shown in panel meta bar (`~N words`).

**Init — load existing rules via active-rule endpoint:**

On `init()` the JS fires `GET /tta/v1/atlasvoice/step-rail/active-rule?post_id=N`. This endpoint runs `RuleResolver::resolve($post_id)` — the full precedence walk (per-post → post_type_language → language → post_type → global) — and returns the **winning** rule. When the user changes the scope radio, the JS fires `GET /tta/v1/atlasvoice/step-rail/scope-rule?post_id=N&scope=X` — this reads the rule at **exactly that scope** (no precedence walk) and repopulates the UI for that scope. Both endpoints share the same `{ selector, excl_set, excl_css, excl_texts, excl_tags }` response shape. The active-rule response also returns `post_type` and `language` which are cached as `state.postType` / `state.postLang`.

Example active-rule response:

```json
{
  "scope":     "global",
  "selector":  "div.tts_content_wrapper_1",
  "post_type": "post",
  "language":  "",
  "excl_css":    [],
  "excl_texts":  [],
  "excl_tags":   []
}
```

The JS restores `state.selection.scope`, `selector`, `post_type`, `language`, and `excl_*`. It caches `resp.post_type` and `resp.language` into `state.postType` / `state.postLang` so scope-change lookups always have the post's correct context. Calls `renderScopeRow()`, `updateSelectorDisplay()`, `renderAllChips()`, `syncTagCheckboxes()`. `excl_set=true` → restore excl_* for **any** scope (including global/post_type/language — all now stored in array format). `excl_set=false` → legacy string-only entry; JS keeps pre-checked checkbox defaults from the HTML.

If the endpoint returns no selector (no rule exists for any scope), `autoFillActiveSelector()` runs instead: walks the DOM via `detectActiveSelector()` — TreeWalker scans for `<!--atlasvoice:start:1-->` comment to find the AtlasVoice content parent, falls back to `.tts_content_wrapper_1` — and pre-fills the Content Region input without adding a user-edit.

Status bar on load: `"Active rule loaded (global)."` / `"Content region auto-detected: …"`.

**Pro gate:** chip steps (④ ⑤ ⑥) get `is-locked` CSS class (`opacity:0.6; pointer-events:none`) + `.av-pro-pill` shown when Free. Pick-to-exclude button blocks at JS level too.

**Mobile:** desktop-only (floating tabs are `position:fixed` at `z-index:2147483640`).

**Rule chips everywhere** (P11) — same chip UX on step rail, post-edit meta box (Pro per-post), and dashboard Rules table.

**Verify-across-posts** (D14, Pro) — a `Test on 3 random posts` button runs saved rules against 3 random posts of the active scope and summarises match/extracted-char counts. Catches fragile selectors before Go Live.

---

## 5. Content-hash short-circuit + lazy visitor-load invalidation (Pro)

### 5.1 Regen-guard hook (D1)

A new `TTA\AtlasVoice\RegenGuard` class registers on `template_redirect` at **priority 5** — before the legacy `get_mp3_file_urls` pathway runs. On every singular front-end hit:

```php
public static function on_template_redirect() {
    if ( ! is_singular() )                                    return;
    if ( ! self::opt_in_on() )                                return;
    if ( self::mode() !== 'production' )                      return;     // staging → fall through
    $post_id = (int) get_queried_object_id();
    if ( get_transient( "tta_regen_lock_{$post_id}" ) )       return;     // 30s lock
    if ( ! get_post_meta( $post_id, '_atlasvoice_regen_dirty', true ) ) return;
    set_transient( "tta_regen_lock_{$post_id}", 1, 30 );
    self::rebuild_or_skip( $post_id );
    delete_post_meta( $post_id, '_atlasvoice_regen_dirty' );
}
```

`rebuild_or_skip` is the decision funnel:

1. Run the new extractor on the live DOM (via `atlasvoice_extractor_result` filter consumed by the JS engine's out-of-band fetch; or via a synchronous PHP fallback when headless).
2. Compute `new_hash = md5(extracted_text)`.
3. Compare with `get_post_meta( $post_id, '_atlasvoice_content_hash', true )`.
4. **If equal:** update `_atlasvoice_selector_hash` to reflect the current rule fingerprint and SKIP regen. The MP3 on disk is still correct (P8).
5. **If differ:** delete stale MP3 + queue regen via existing Pro path. Write new `_atlasvoice_content_hash`.

### 5.2 Content-hash short-circuit cases (D2)

Skippable cases — the settings fingerprint changed but extracted text is byte-identical:

- User toggled "Add post excerpt" on a post with empty excerpt.
- User added a CSS exclusion that doesn't match any element in this post.
- User added a text-exclude phrase that doesn't appear in this post.
- User added an include selector that matches the same body the scorer would have auto-picked.

In every case the MP3 is still valid. Skipping saves per-character API cost on ChatGPT TTS / ElevenLabs / Google Cloud TTS / gTTS-Pro.

### 5.3 Selector-hash on MP3 generate (D3)

Whenever Pro generates an MP3, `TTA\AtlasVoice\SelectorHash::tag( $post_id, $player_id, $rule_fingerprint )` writes `_atlasvoice_selector_hash` on the post. `rule_fingerprint` is `sha1(json_encode(resolved_rules + lang + auth_bucket))`. This is the tag that the regen-guard compares against.

### 5.4 Lazy visitor-load invalidation

On setting changes that *do* change the hash, v5 **does not** mass-delete MP3s upfront. It sets `_atlasvoice_regen_dirty = 1` on every affected post. Next visitor listen triggers the regen-guard; posts no visitor lands on pay nothing. A 500-post site pays regen cost only for posts actually listened to.

Bulk MP3 interaction: admins who want to pre-warm the cache click Bulk MP3 — it treats `_atlasvoice_regen_dirty = true` the same as "never generated" and regenerates during the bulk run. Pay-per-play admins can skip.

Free: `_atlasvoice_regen_dirty` is never written because Free has no MP3 cache.

---

## 6. Self-healing + boilerplate auto-detection (shipped, refactor-pending)

### 6.1 Self-healing selectors (C1a–C2c, shipped)

Every extraction attempt:

```
result = tryResolve(saved_selector)
if (!result || result.text.length < 40 || result.linkRatio > 0.6):
    rescored = runScoringPass()
    if (rescored.confidence >= 0.8):
        saveSelector(scope, rescored.selector)       // silent heal
        emit event: selector_auto_healed
        append to tta_atlasvoice_heal_log            // 50-row ring buffer
    else:
        fall through to tier 7 (PHP dumb fallback)   // site still works, degraded
```

No modal, no email, no blocking prompt. Dashboard badge: *"N posts auto-healed last 7 days. [Review]"* → table of old → new selectors with listen samples + one-click revert (reason=`revert` is recorded in heal-log for audit).

### 6.2 Boilerplate text auto-detection (C3a–C3c, shipped)

Daily WP-Cron job over the 20 most-recently-extracted posts (or all posts if < 20 exist). Finds text patterns appearing in > 50% of extracted bodies — CTAs, share-button labels, related-post titles, author-bio boilerplate leaked through CSS exclusion. Surfaces as suggested text-exclude chips in the Advanced panel and post-edit meta box:

> *"We noticed 'Share this post' appears on 87% of your posts. [Add as exclude] [Ignore]"*

Dismissed patterns are remembered per-site in `tta__atlasvoice_boilerplate_dismissed`.

### 6.3 Cache-purge hints (C4a–C4b, shipped)

On selector save, detects active cache plugin (LiteSpeed / WP Rocket / W3TC / SG Optimizer / Autoptimize) and returns deep-link to that plugin's purge UI + step-by-step manual steps. Reuses the detection already in `TTA_Hooks.php`.

### 6.4 Language-plugin keying (C5a–C5b, shipped)

Detects WPML / Polylang / TranslatePress / GTranslate. Keys selector storage as `{scope}:{lang_code}`. Exposes `current_language_code()` to JS. First-visit auto-save runs once per `(post_type, language_code)`. Fallback: if no selector for current language, try `global` → `per_cpt` language-agnostic keys.

### 6.5 Auth-variants MP3 keying (C6a–C6c, shipped)

Tags MP3 storage with `_atlasvoice_mp3_variant` (`logged_out` / `logged_in` / `both`) when the picked container yields meaningfully different text between auth states. Post-edit meta-box radio (`Auto` / `Logged-out` / `Logged-in` / `Both`) lets admin pin a variant per post. Engine reports auth-samples to detect `differs`/`same`/`unknown` verdicts.

### 6.6 Async-content mutation observer (C7a, shipped)

Engine adds `data-atlasvoice-wait-for` mutation-observer opt-in (3s bounded) for AJAX-late content; exposes `window.ttsReExtract()` for SPA themes to call on route change.

---

## 7. Six hard cases — in-UI guidance co-located with symptom

| # | Case | Automatic mitigation | In-UI guidance surface |
|---|---|---|---|
| 1 | **Theme/builder DOM change** | Self-healer re-scores silently. | Dashboard badge `Selector status: Healthy / Auto-healed N posts last 7 days — [Review]`. Meta-box row `Selector last verified: Apr 18. [Re-verify now]`. |
| 2 | **AJAX-loaded content** | Engine retries once after 250ms idle (bounded 1.5s). `data-atlasvoice-wait-for` opt-in gives 3s mutation-observer window. | Toast when mutations detected post-extraction: *"Some content loads after the page — listen sample may be incomplete. [Learn how to fix]"*. Opens inline modal, not external docs. |
| 3 | **Logged-in vs logged-out DOM** | Extractor runs once per cache bucket. MP3s keyed by auth bucket via `_atlasvoice_mp3_variant`. | Post-edit meta-box row `Logged-in users see extra content on this post. Read: [logged-out version] (default) / [logged-in version] / [both separately]`. |
| 4 | **CDN / page cache skew** | Comment markers survive cache. Self-healer catches stale-cache match-failures and re-scores. | On first selector save, banner: *"If you use a CDN or full-page cache, purge it now so your next listeners get the updated content. [Purge in LiteSpeed] [Purge in WP Rocket] [Manual steps]"*. |
| 5 | **Tabs / accordions / collapsed regions** | Container cloned via `cloneNode(true)` before text extraction — `display:none` children included. `[aria-expanded=false]` detection. | Picker toolbar chip: *"Includes N tab panels — [preview all] / [exclude hidden]"*. |
| 6 | **Multi-language sites** | Selector storage keyed per-language. First-visit auto-save runs once per `(post_type, language_code)`. | Settings shows: *"Multi-language detected. Selectors are saved separately per language. [Pick for Spanish now]"*. |

**Philosophy (P14):** guidance lives where the symptom is visible; docs page carries the long-form.

---

## 8. Staging / Production + admin-bar dot + Go Live dialog

### 8.1 Admin-bar status dot (D4)

A coloured dot in the admin bar, visible to `manage_options`, shows at-a-glance state:

| Dot | State | Tooltip |
|---|---|---|
| Grey | Opt-in OFF | *AtlasVoice: disabled — using legacy extraction* |
| Yellow | Opt-in ON, mode = staging | *AtlasVoice: staging — training on real traffic, visitors still hear legacy* |
| Green | Opt-in ON, mode = production | *AtlasVoice: live — new pipeline is authoritative* |

Clicking opens the Settings → AtlasVoice panel focus-scrolled to the mode section.

### 8.2 Go Live dialog (D5)

Flipping Layer 2 `staging → production` opens a blocking confirmation modal (typed confirmation to prevent reflex clicks):

```
┌─ Ready to go live? ─────────────────────────────────────┐
│                                                         │
│ Switching to Production will make AtlasVoice the        │
│ authoritative source for MP3 audio on your site.        │
│                                                         │
│ What happens next:                                      │
│  • Visitors start hearing the new extraction pipeline.  │
│  • Existing MP3s remain cached (no regen storm).        │
│  • Stale MP3s regenerate lazily on first listen.        │
│  • You can revert to Staging any time (one click).      │
│                                                         │
│ Type GO LIVE to confirm: [____________]   [Cancel] [Go] │
└─────────────────────────────────────────────────────────┘
```

The reverse flip (`production → staging`) is a single-click toggle with no typed confirmation, because reverting to legacy is the safe direction.

### 8.3 Option X staging semantics

In staging, the new pipeline writes rules and trains itself (scorer runs, boilerplate detector runs, self-healer logs events), but **visitor playback still uses the legacy output**. Only when the admin flips to production does the regen-guard (§5.1) start intercepting `template_redirect` and swapping MP3s. This guarantees zero visitor impact during evaluation.

---

## 9. Snapshot / rollback per scope (D6)

`TTA\AtlasVoice\Snapshots` writes a 5-deep ring-buffer of rule history per scope on every save:

```json
"snapshot_history": {
  "cpt:post": [
    {"ts": 1745280000, "rules": {...prev-prev...}, "actor": "user:1"},
    {"ts": 1745281200, "rules": {...prev...},      "actor": "healer"},
    {"ts": 1745282400, "rules": {...current...},   "actor": "user:1"}
  ]
}
```

Every scope row in the dashboard Rules table has a `[History ▾]` dropdown — click any row → "Revert to this" → one REST call → active rules swap to the snapshot. The revert itself becomes a new entry at the top of the ring buffer (with `reason: revert`), so the history never shrinks.

Self-healer writes its "before" state as a snapshot entry with `actor: healer`, which is what powers the one-click revert already shipped in C2b.

---

## 10. Lazy picker bundle loading (D8)

**Baseline today:** `tts-picker.min.js` and the step-rail React chunk are bundled into `text-to-audio-dashboard-ui.min.js` and enqueued on every admin page. D8 breaks this out:

1. `webpack.mix.js` compiles `src/picker/tts-picker.js` → `admin/js/build/tts-picker.min.js` as a separate bundle.
2. `admin/TTA_Admin.php` **does NOT** `wp_enqueue_script` the picker at page load. Instead it registers the script + localize data under a lazy handle and emits a `window.ttsLoadPicker()` stub.
3. On-demand triggers:
   - Admin-bar "Pick content area" click → `ttsLoadPicker()` → dynamically-injected `<script>` tag → initialises the overlay.
   - Low-confidence toast "[Change]" click → same.
   - Advanced panel open → same.
4. Users whose site the engine auto-handles (happy path, ≥85% of opt-ins) never download the picker bundle (P13).

Bundle size budget: picker + step-rail chunk ≤ 80 kB gzipped so first-load impact when it is fetched is negligible.

---

## 11. Free vs Pro split

| Feature | Free | Pro | Notes |
|---|:-:|:-:|---|
| Layer 1 opt-in | ✅ | ✅ | `tta__settings_use_atlasvoice_extractor`. |
| Layer 2 staging/production mode | — | ✅ | Free stays in implicit staging (visitors always hear legacy). |
| Layer 3 rules: global | ✅ | ✅ | Single entry, scope='global'. |
| Layer 3 rules: per-CPT | — | ✅ | |
| Layer 3 rules: per-post override | — | ✅ | Existing `tts_pro_custom_css_selectors` storage. |
| JS extraction engine (tiers 1–6) | ✅ | ✅ | Same code path. |
| Comment-marker wrapper | ✅ | ✅ | |
| BUILDER_BODY_SELECTORS | ✅ | ✅ | |
| First-visit auto-save | ✅ | ✅ | |
| Auto-detect excludes (nav-like children) | ✅ | ✅ | |
| Boilerplate text auto-detect | ✅ | ✅ | Free gets suggestions in Advanced panel; Pro gets meta-box surface too. |
| Self-healing selectors | ✅ | ✅ | |
| Heal-log + one-click revert | ✅ | ✅ | |
| Cache-purge hints | ✅ | ✅ | |
| Language-plugin keying | ✅ | ✅ | |
| Auth-variants detection | ✅ | ✅ | |
| Auth-variants MP3 bucketing | — | ✅ | Free has no MP3 cache to bucket. |
| AtlasVoiceSelector (floating tabs, live DOM picker) | ✅ scope + include | ✅ full | Two fixed tabs on post page. Left = 300px sliding panel (①②④⑤⑥+Save). Right = draggable preview overlay. Live DOM picker (no iframe). Free locked to ①②; Pro unlocks ④⑤⑥. Dashboard "Open & Pick" launcher. |
| MP3 generation | — | ✅ | Free uses `speechSynthesis` at listen time. |
| Content-hash short-circuit | — | ✅ | |
| Lazy visitor-load MP3 invalidation | — | ✅ | |
| Snapshot / rollback per scope | — | ✅ | Free has single global scope; snapshot UI degenerate. |
| Staging / production admin-bar dot | — | ✅ | |
| Go Live dialog + typed confirmation | — | ✅ | |
| Bulk MP3 skip-unchanged | — | ✅ | Free has no Bulk MP3. |
| Custom-field readers (opt-in) | ✅ ACF basic | ✅ full | Free = ACF only via existing free reader; Pro = ACF+MB+Pods+JetEngine+Toolset+CarbonFields. |
| Diagnose URL | — | ✅ | |
| Verify across posts (3-post fleet) | — | ✅ | |
| Preview audio text (basic) | ✅ | — | |
| Preview audio text (alternatives) | — | ✅ | |
| Dry-run preview diff | ✅ | ✅ | |
| Inline help + Docs page | ✅ | ✅ | Same both tiers. |

### 11.1 Why this split is fair

1. Free finally reads the right content with zero config (scoring + first-visit auto-save + self-heal).
2. Free gets the step-rail picker for the non-tech-user unlock, with scope + include.
3. Pro gets the cost-sensitive regen layer, staging/production mode, per-CPT + per-post rules, tag/text chip editors, verify-across-posts, diagnose URL — the admin/diagnostic surface that justifies upgrade.
4. No existing customer loses a feature. Smart extraction is opt-in for upgrades via dry-run.

---

## 12. Storage keys — full catalogue (v5)

| Key | Location | Scope | Since |
|---|---|---|---|
| `tta__settings_use_atlasvoice_extractor` | `tta_settings_data` option | L1 | PR-A |
| `tta__settings_atlasvoice_mode` | `tta_settings_data` option | L2 (Pro) | D4 |
| `tta_atlasvoice_rules` | option | L3 | PR-C |
| `tta__atlasvoice_boilerplate_dismissed` | option | suggestion memory | C3c |
| `tta_atlasvoice_heal_log` | option | 50-row ring buffer | C1c |
| `tta_regen_lock_{post_id}` | transient, 30s | regen coalescing | D1 |
| `tta_first_visit_lock_{post_type}_{lang}` | transient, 24h | first-visit flood guard | PR-B B2 |
| `_atlasvoice_content_hash` | post meta | content-hash short-circuit | D2 |
| `_atlasvoice_selector_hash` | post meta | MP3 rule-fingerprint tag | D3 |
| `_atlasvoice_variant_pinned` | post meta | auth-variant pin | C6b |
| `_atlasvoice_regen_dirty` | post meta | lazy-invalidation flag | D1 |
| `_atlasvoice_snapshot_history` | post meta (per scope, serialised) | 5-deep history | D6 |
| `_atlasvoice_mp3_variant` | post meta | MP3 keyed by auth bucket | C6a |
| `_tta_content_fingerprint` | post meta | v4.2 §6 (unchanged) | v3 |
| `_tta_last_mp3_fingerprint` | post meta | v4.2 §5 (unchanged) | v3 |
| `_tta_force_regen` | post meta | v4.2 §5 one-shot | v3 |

---

## 13. D1–D14 implementation roadmap

Each Dn is one atomic commit on `feature/TTS-238` in both the Free and Pro branches (where applicable). Prefix commits `TTS-238 Dn:` so they are traceable.

| # | Commit | Scope | Free / Pro |
|---|---|---|---|
| **D1** | **Regen-guard skeleton** | `TTA\AtlasVoice\RegenGuard` registers on `template_redirect` priority 5. Guards: `is_singular()`, opt-in ON, mode=`production`, no 30s lock, dirty-flag set. Does nothing yet — just the hook shell + transient lock. | Pro |
| **D2** | **Content-hash short-circuit** | `TTA\AtlasVoice\ContentHash::short_circuit_or_dirty()` runs the extractor (via JS engine fetch or synchronous PHP read), computes `md5`, compares against `_atlasvoice_content_hash`. Returns `skip` / `regen`. Wired into D1's `rebuild_or_skip`. | Pro |
| **D3** | **Selector-hash on MP3 generate** | `TTA\AtlasVoice\SelectorHash::tag()` writes `_atlasvoice_selector_hash` whenever Pro generates an MP3. Hooks existing Pro generation pipeline via an `atlasvoice_mp3_generated` action added at Pro's `init_gtts` / `init_gctts` / `init_chat_gpt` / `init_elevenlabs` completion. | Pro |
| **D4** | **Staging / production option + admin-bar dot** | Adds `tta__settings_atlasvoice_mode` to Settings; renders the admin-bar dot (grey/yellow/green). Dot click deep-links to Settings → AtlasVoice mode row. | Pro |
| **D5** | **Go Live dialog + typed confirmation** | Modal component with `GO LIVE` typed-confirmation. REST `POST /tts/v1/atlasvoice-mode` writes the new value; reverse flip has no typed confirmation. Telemetry event `atlasvoice_mode_flipped`. | Pro |
| **D6** | **Snapshot store + one-click revert** | `TTA\AtlasVoice\Snapshots` writes 5-deep ring buffer on every rule save. Dashboard Rules table grows a `[History ▾]` per row + revert REST route. Heal-log already uses this indirectly (C2b). | Pro |
| **D7** | **Per-post meta-box rule scope** | Post-edit meta-box adds `Pick content area for THIS post` button + chip editor. Saves to `post:{id}` scope of `tta_atlasvoice_rules`. Shows precedence breadcrumbs (P12). | Pro |
| **D8** | **Lazy picker bundle loader** | Separate webpack bundle `tts-picker.min.js`. `admin/TTA_Admin.php` registers but does NOT enqueue; emits `window.ttsLoadPicker()` stub. All three triggers (admin-bar, toast `[Change]`, Advanced panel) route through the stub. | Free + Pro |
| **D9** | **Front-end floating step rail (v5 rebuilt)** | ~~iframe sandbox~~ replaced with two `position:fixed` floating tabs on the actual post page. Left tab → 300px sliding panel (scope ① + content region ② + chip steps ④⑤⑥ + Save). Right tab → draggable content preview overlay. Live DOM picker: hover highlight → click select/deselect. `StepRail.php` hooks `wp_footer` (not `admin_footer`). `step-rail.shell.js` rewritten as framework-free IIFE. Dashboard `admin_footer` emits "Open & Pick" URL builder (`?atlasvoice_picker=1` auto-opens left panel). | Free + Pro |
| **D10** | **Rule chip editor + exclude-pick mode** | Chip rows ④ ⑤ ⑥. Exclude-pick arms a separate DOM picker mode (red ring on hover/click → adds CSS-exclude chip with nth-child specificity). Tag checkboxes all pre-checked; sync bidirectionally with excl_tags chips. Undo stack `Cmd/Ctrl+Z` (20 deep, restores picker highlights). Load-existing-rules on init via `GET /step-rail/active-rule?post_id=N` (RuleResolver precedence walk — restores scope + selector + chips for the active rule across all scopes). Content Region shown as editable `<input>` (not read-only code). | Pro (Free shows locked rows) |
| **D11** | **Word-count badge + live content preview** | `~N words` badge in region row updates on selector change. Right-panel preview: selector-presence two-state model — no selector → `extractFromActiveSystem()` unfiltered; selector set → always `extractWithRules()` (applies tag/CSS/phrase excludes). Both panels resizable via edge handles (right edge = width, bottom edge = height). Phrases excluded via `split/join` text-level replacement. Updates on every chip add/remove. (Listen 5s sample removed — not useful.) | Free + Pro |
| **D12** | **Pro lock rows + Pro pill upsell** | Free sees chip steps with `is-locked` CSS + `.av-pro-pill` badge in each step header. Picker-to-exclude button blocked at JS level. Pointer-events guard via CSS so locked inputs are non-interactive. | Free |
| **D13** | **Custom-field reader classes (dormant + opt-in filter)** | `TTA\AtlasVoice\Readers\{ACF,MetaBox,Pods,JetEngine,Toolset,CarbonFields}Reader` + `ReaderInterface` + `ReaderRegistry`. **Dormant by default** — all six classes ship and load via PSR-4, but `ReaderRegistry::read_all()` returns nothing into the extractor unless a developer opts in via the `atlasvoice_extra_field_text` filter (declared inside `tta_clean_content()` in `includes/helpers.php`). The planned Compatibility-tab drag-sort UI was **deliberately not built**. Rationale: the matured step-rail (D9–D11, D15, D16) already lets admins pick any rendered field via click-pick or drag-to-include, and the project's guiding principle is "voice what visitors actually see." Reading aloud invisible / unrendered custom-field values would override editorial decisions made elsewhere. The opt-in filter is the canonical escape hatch for headless pipelines / server-side warmers — full snippet + rationale in `docs/atlasvoice-readers.md`. | Free + Pro (dormant on both) |
| **D14** | **Verify-across-posts dry run** | `TTA\AtlasVoice\VerifyAcrossPosts` runs saved rules against 3 random posts in a hidden iframe fleet, summarises match/extracted-char counts per post. Button on step rail + Go Live dialog prerequisite for nervous admins. | Pro |
| **D15** | **Live picker editing + extractor/highlight parity** | Skip-area chips become inline-editable (click chip text → input; Enter/blur commit, Escape revert); live highlight + preview update on every keystroke. Chip Add field previews the candidate selector (red highlight + preview) as user types, reverting on blur. Content Region input re-applies green highlight on every keystroke. On panel reload `av-picker-excluded` highlights are restored from saved `excl_css`. Extractor parity fix: `extractWithRules()` resolves `excl_css` against the live DOM (marks matches with `data-av-excl-match`) *before* cloning, then removes marked nodes from the clone — so positional pseudos (`:nth-of-type`, `:nth-child`) no longer drift when multiple selectors are applied sequentially. CSS `.av-pro-pill[hidden]{display:none!important;}` guards against theme specificity overriding the `hidden` attribute. | Free + Pro |
| **D16** | **Drag-to-mark (select-to-include / select-to-exclude)** | Two new mode buttons next to the existing click-pickers. `⇲ Select to include` and `⇲ Select to exclude` arm a drag-mode that turns a native text Selection into element-level picks. Loose snap (any element the range intersects); topmost-dedupe collapses parent+descendant pairs. Multi-element results emit a comma-listed selector. Live dashed `av-picker-touch-*` highlights paint the touched set on `selectionchange` — true WYSIWYG. Exclude mode also drops strict ancestors of both range endpoints (so the wrapper isn't pulled in when the drag is contained inside it); include mode keeps the topmost-only behaviour so dragging across all of a wrapper's children produces the wrapper, not a 24-element comma-list. Brittle-scope warning shown when a multi-element selector lands under a scope broader than per-post / per-post-type. Storage shape unchanged — the gesture commits a CSS string through the same path Add does. Sub-commits D16.1 (UI scaffolding), D16.2 (engine), D16.3 (live preview + commit + warning), D16.4 (drop ancestor-of-endpoints in exclude mode), D16.5 (strip `av-picker-touch-*` before selector generation), D16.6 (scope ancestor-drop to exclude only). | Free + Pro |
| **D17** | **Dynamic button-id support for marker / wrapper lookups** | `findAtlasVoiceMarkerIds()` walks comment nodes once and returns every `atlasvoice:start:N` id present, sorted; `findLegacyWrappers()` returns elements matching `.tts_content_wrapper_N` for any N. Callers (`extractFromCommentMarkers`, `extractFromActiveSystem`, `detectActiveSelector`) iterate the present ids until one yields content, and the legacy-wrapper tier emits a selector containing the actual class name (e.g. `.tts_content_wrapper_3`) instead of always `_1`. Pages with multiple Listen buttons (each emitting its own marker pair and wrapper) now work correctly. | Free + Pro |
| **D18** | **Drop `state.rightOpen` gates; preview body always live** | The right-panel preview's `if (!state.rightOpen) return;` guard inside `updatePreview()` was a micro-optimisation that left a real bug: opening the panel after async rule loading could surface a stale or never-populated body. The body element is in the DOM whether the panel is hidden or visible, so writing to it when closed is harmless. Removing the gate makes the panel "always ready" — opening is just a CSS reveal of already-prepared content. The matching `if (state.rightOpen) updatePreview()` guards at the three call sites (`loadRulesForScope`, `autoFillActiveSelector`, `loadExistingRules`) become redundant and are stripped. | Free + Pro |
| **D19** | **SVG-safe class strip + built-in extractor defaults** | Two related fixes to `extractWithRules`. (1) The pass that strips picker classes from the clone called `.replace` on each node's `.className`. SVG elements expose `.className` as an `SVGAnimatedString` (object), not a string — calling `.replace` on that throws and aborts `updatePreview` before it ever writes to the body. Fixed to use `getAttribute('class')` / `setAttribute('class', cleaned)` so HTML and SVG nodes both work; remove the attribute when the cleaned value is empty. (2) Built-in extractor defaults always applied: `BUILTIN_EXCL_TAGS = ['script', 'style']` mirrors the legacy `wp_strip_all_tags($text, true)`; `BUILTIN_EXCL_CSS = [ '[id^="tts__listent_content_"]', '.tts__listent_content', '#tts_button_should_float', '[class*="tts__custom-position_"]' ]` strips the plugin's own player chrome so the listen button never ends up read aloud. Each runs in its own try/catch so a malformed selector can't take down the extractor. | Free + Pro |
| **D20** | **Select-to-exclude auto-exits on commit** | D16.3 kept select-excl mode active after each commit so admins could chain exclusions. Side effect: `body.av-select-mode-excl`'s CSS (`cursor:text!important` on body and every descendant) made the cursor look like text-selection mode even when hovering rail buttons (e.g. Save). Match include-mode behaviour instead — one click arms, one drag commits and exits; second exclusion requires a second button click. Predictable, removes the global cursor weirdness. | Free + Pro |

### 13.1 Ordering rationale

- **D1 → D2 → D3** form the regen-cost-optimisation chain. Land first because they are the Pro-value spine of PR-C and they unlock the rest of the rollout — without short-circuit + dirty-flag, lazy-invalidation is unsafe.
- **D4 → D5** land together because the admin-bar dot is meaningless without a Go Live affordance for flipping the state it visualises.
- **D6** lands mid-PR because snapshot history is needed before per-post rules (D7) to make the per-post panel safe to experiment on.
- **D7** uses D6's snapshots and D1's regen-guard.
- **D8 → D9 → D10 → D11** form the UI stack; each builds on the previous. D8 is a build-system change only (no visible UI), which is why it's first in the UI sub-sequence.
- **D12** lands with D10 since that's when row-level locks become relevant.
- **D13 → D14** are additive and can ship independently after the main sequence.

### 13.2 Commit message template

```
TTS-238 Dn: <short-imperative>

<one paragraph of context + rationale — why this change exists and which
principle it serves (P1 isolation / P6 zero-click / P8 cost-sensitive etc).>

Files:
  + includes/atlasvoice/…  (new)
  ~ src/dashboard/…         (modified, opt-in gate only where applicable)
```

No co-author line per user preference.

---

## 14. Architecture reconciliation — Option A refactor of shipped §0.7 code

**Problem statement.** The PR-C §0.7 ticket-killers (C1a–C7a, commits `60448ba` through `1319529`) shipped to the `feature/TTS-238` branch with a layout that contradicts P1–P4:

- New classes landed in `includes/` root with `TTA_` prefix under existing `TTA\` namespace (e.g. `includes/TTA_SelfHealer.php`, `includes/TTA_AuthVariants.php`), not in isolated `includes/atlasvoice/` with `TTA\AtlasVoice\*`.
- Existing files were modified beyond "top-of-function opt-in gate" (P1 violation):
  - `admin/TTA_Admin.php` — localise-data additions (`current_post_id`, `atlasvoice_language_code`, `current_post_type`, `can_save_selector`).
  - `api/TTA_Api_Routes.php` — routes `/heal-log`, `/boilerplate-suggestions`, `/boilerplate-exclude`, `/language-context`, `/auth-variant`, and additions to `/save-selector`.
  - `text-to-audio.php` — bootstrap registrations for BoilerplateDetector cron + AuthVariants meta box.
  - `src/extractor/tts-extractor-engine.js` — `reportAuthSample`, mutation observer for `data-atlasvoice-wait-for`, language-aware selector resolver.
  - `src/picker/tts-picker.js` — language param to persistSelector.
  - `src/dashboard/components/dashboard/settings/AtlasVoiceSettings.js` — boilerplate + heal-log panels.

**Choice ratified.** Option A (refactor code to match plan) — the hook-based isolation architecture is load-bearing; without it, the Strangler Fig pattern breaks and there's no way to rip out the new system cleanly if it needs to be rolled back. Option B (amend plan to accept current layout) was rejected in mid-session review.

### 14.1 Refactor mapping

| Current location | Target location | Current class/namespace | Target class/namespace |
|---|---|---|---|
| `includes/TTA_SelfHealer.php` | `includes/atlasvoice/SelfHealer.php` | `TTA\TTA_SelfHealer` | `TTA\AtlasVoice\SelfHealer` |
| `includes/TTA_BoilerplateDetector.php` | `includes/atlasvoice/BoilerplateDetector.php` | `TTA\TTA_BoilerplateDetector` | `TTA\AtlasVoice\BoilerplateDetector` |
| `includes/TTA_CachePurgeHints.php` | `includes/atlasvoice/CachePurgeHints.php` | `TTA\TTA_CachePurgeHints` | `TTA\AtlasVoice\CachePurgeHints` |
| `includes/TTA_LanguagePlugins.php` | `includes/atlasvoice/LanguagePlugins.php` | `TTA\TTA_LanguagePlugins` | `TTA\AtlasVoice\LanguagePlugins` |
| `includes/TTA_AuthVariants.php` | `includes/atlasvoice/AuthVariants.php` | `TTA\TTA_AuthVariants` | `TTA\AtlasVoice\AuthVariants` |
| `includes/TTA_AuthVariantsMetaBox.php` | `includes/atlasvoice/AuthVariantsMetaBox.php` | `TTA\TTA_AuthVariantsMetaBox` | `TTA\AtlasVoice\AuthVariantsMetaBox` |

**PSR-4 autoload:** `composer.json` gets a new mapping `"TTA\\AtlasVoice\\": "includes/atlasvoice/"`. Autoload regenerated via `composer dump-autoload -o`. Existing `TTA\` → `includes/` mapping is unchanged.

### 14.2 Existing-file edit reversal

The edits to `admin/TTA_Admin.php`, `api/TTA_Api_Routes.php`, `text-to-audio.php`, `src/extractor/tts-extractor-engine.js`, `src/picker/tts-picker.js`, and `src/dashboard/components/dashboard/settings/AtlasVoiceSettings.js` are kept **only if they conform to the P1 opt-in-gate rule.** The audit for each file:

| File | Current edit | P1 verdict | Action |
|---|---|---|---|
| `admin/TTA_Admin.php` | 4 new localise-data fields + lazy-populate hooks | ❌ Not a gate; surface additions | Move into `includes/atlasvoice/Bootstrap.php` via a new `atlasvoice_localize_data` filter that `TTA_Admin.php` consumes in one line. The `TTA_Admin.php` edit becomes a single `apply_filters('atlasvoice_localize_data', $localize_data)`. |
| `api/TTA_Api_Routes.php` | 5 new routes + `/save-selector` additions | ❌ Not a gate | Move route registrations into a new `includes/atlasvoice/RestRoutes.php` that registers on `rest_api_init` independently. The `TTA_Api_Routes.php` file reverts to byte-identical. |
| `text-to-audio.php` | 2 bootstrap registrations | ✅ Already isolated to one `Bootstrap::register()` line (acceptable). | Keep — consolidate the 2 registrations into a single `\TTA\AtlasVoice\Bootstrap::register();` line, which internally wires everything. |
| `src/extractor/tts-extractor-engine.js` | 3 new features | ⚠️ Engine is a new file (not a legacy edit). | Accept — the extractor engine is itself a new AtlasVoice module; the "edits" are internal evolution. |
| `src/picker/tts-picker.js` | 1 param addition | ⚠️ Same — new file. | Accept. |
| `src/dashboard/components/dashboard/settings/AtlasVoiceSettings.js` | Imports AtlasVoiceBoilerplate + HealLog | ⚠️ Same — new file. | Accept. |

**Result:** after §14 refactor, `git diff` between `feature/TTS-238` tip and the point where PR-A shipped shows only:
- One line added to `text-to-audio.php` (Bootstrap registration).
- One filter call added to `admin/TTA_Admin.php` (`apply_filters('atlasvoice_localize_data', $localize_data)`).
- One filter call added to `TTSProHelper.js` (the opt-in gate, already in PR-A).
- One filter call added to `TTA_Pro_Filters.php` (comment-marker wrapper, already in PR-A).

Everything else is contained in `includes/atlasvoice/`, `src/extractor/`, `src/picker/`, and `src/dashboard/components/dashboard/atlasvoice/` (post-refactor target for the dashboard panels).

### 14.3 Refactor sequencing (D0 commits, before D1 resumes)

| # | Commit | Action |
|---|---|---|
| **D0a** | `TTS-238 D0a: move shipped §0.7 classes into includes/atlasvoice/` | `git mv` the six classes; rename namespace declarations; update `composer.json` autoload; regenerate autoload. |
| **D0b** | `TTS-238 D0b: extract AtlasVoice REST routes into dedicated registrar` | Create `includes/atlasvoice/RestRoutes.php`; move route definitions; revert `api/TTA_Api_Routes.php` to its pre-§0.7 state. |
| **D0c** | `TTS-238 D0c: consolidate AtlasVoice bootstrap behind a single register() call` | Replace the 2 individual registrations in `text-to-audio.php` with one `\TTA\AtlasVoice\Bootstrap::register()`. |
| **D0d** | `TTS-238 D0d: localise-data extension via atlasvoice_localize_data filter` | Revert `admin/TTA_Admin.php` localise-data edits; add one `apply_filters` line; wire the fields from `Bootstrap.php`. |
| **D0e** | `TTS-238 D0e: verification — diff audit passes` | Run the diff audit, confirm only the four whitelisted edits remain in legacy files, append audit log to plan. |

D0a–D0e must land before D1. They are the prerequisite for the hook-based-isolation promise to hold for the remaining D1–D14 work.

---

## 15. Rollout — PR-based (v5, extends v4.2 §16)

| PR | Status | Scope | Target versions |
|---|---|---|---|
| **PR-A — Opt-in gating + UI split** | ✅ Shipped | Layer 1 toggle, engine/picker gated, legacy byte-identical when OFF, Settings UI split. | 2.2.0 |
| **PR-B — Auto-detection toast + fallback picker + lazy loading** | ✅ Shipped | Scorer, first-visit auto-save, low-confidence toast, diff preview, 5s listen. | 2.3.0 |
| **PR-C.1 — §0.7 ticket-killers** | ✅ Shipped, **isolation-pending** | Self-heal, heal-log, cache-purge, boilerplate, language, auth-variants, mutation-observer. | 2.4.0-alpha |
| **PR-C.2 — D0 isolation refactor** | ⏳ Next | §14 refactor: move §0.7 classes into `includes/atlasvoice/`; extract REST routes; revert legacy-file edits. | 2.4.0-beta |
| **PR-C.3 — D1–D6 regen cost + snapshots + mode toggle** | ⏳ After D0 | Regen-guard, content-hash short-circuit, selector-hash on MP3 generate, staging/production mode, Go Live dialog, snapshots. | 2.4.0 |
| **PR-C.4 — D7–D14 step-rail UI + lazy bundle + readers + verify** | ⏳ After D6 | Per-post meta box, lazy picker loader, step rail, chip editor, diff counter, Pro locks, custom-field readers, verify-across-posts. | 2.4.0 |
| **Post-PR-C** | Deferred | Remove legacy `<div class="tts_content_wrapper_X">`. Tune scoring from telemetry. Default opt-in=true for fresh installs. | 2.5.0 |

**Safety invariants across every PR:**

1. Opt-in OFF (every existing user's default) → zero new frontend assets beyond the toggle itself, zero new DOM markers, zero behavioural change from 2.1.17.
2. No edits to the body of existing extraction functions — only top-of-function opt-in gates. Verified by diff audit (D0e).
3. MP3 files on disk are only deleted inside the `template_redirect` lazy-regen path (D1), never upfront from settings saves. Free never triggers deletion because Free has no MP3s.
4. Every rollback is one toggle: flip Layer 1 OFF → legacy runs on next page load. No MP3 cache is touched by toggling layers.
5. Flipping Layer 2 production → staging is a single click, never requires typed confirmation. Reverting to legacy is always the safe direction.

---

## 16. Acceptance criteria (v5 superset)

All v4.2 §18 criteria 1–24 carry forward. v5 adds:

25. **(v5) Isolation audit** — after D0e, `git diff` against the post-PR-A baseline shows no changes to legacy extraction function bodies (only top-of-function opt-in gates + filter hooks). Automated check: a CI script greps `includes/TTA_Helper.php`, `includes/helpers.php`, `api/TTA_Api_Routes.php`, `admin/TTA_Admin.php`, Pro's `TTSProHelper.js`, Pro's `TTA_Pro_Filters.php`, Pro's `TTA_Pro_Helper.php` for "AtlasVoice" mentions; mention count must be ≤ 5 per file (target gates + filter calls only).
26. **(v5) Directory-delete recovery** — deleting `includes/atlasvoice/`, `src/extractor/`, `src/picker/`, `src/dashboard/components/dashboard/atlasvoice/` and turning Layer 1 OFF produces a plugin that behaves byte-identical to 2.1.17. Verified via integration test on a staging install.
27. **(v5) Regen-guard coalescing** — concurrent visitor hits on the same stale post within a 30-second window trigger at most one MP3 regeneration. Verified by transient-lock integration test.
28. **(v5) Content-hash short-circuit hit-rate** — on a 50-post corpus where the admin adds an exclude selector that matches nothing, ≥ 95% of posts short-circuit (no regen) on first visitor hit after the setting change.
29. **(v5) Lazy picker bundle** — on a fresh admin page load with opt-in ON and no picker interaction, `tts-picker.min.js` is not in the network waterfall. Only loads on admin-bar / toast / Advanced click.
30. **(v5) Staging stays silent for visitors** — with opt-in ON and mode = staging, visitor `GET /post/x` returns MP3 bytes byte-identical to pre-opt-in MP3. Verified by SHA-256 comparison.
31. **(v5) Go Live typed confirmation** — submitting the Go Live dialog without typing `GO LIVE` exactly returns a client-side validation error and no REST call fires.
32. **(v5) Snapshot integrity** — after 10 consecutive saves on the same scope, the history array contains exactly 5 entries with chronologically correct timestamps; reverting to entry 3 makes entry 3's rules active and entry 3's reverted-to state becomes a new #11 in a fresh 5-window.

---

## 17. Open questions / future work (v5)

Unchanged from v4.2 §20:

- Per-page dark-list (shift-click shadow-list inside the step-rail iframe).
- WPGraphQL resolver for `/preview-text`.
- 4th regeneration mode `schedule` (nightly WP-Cron for stale fingerprints).
- Site Health check for comment-marker strippers.
- Structured-content payload for Pro cloud voices (`{ title, summary, body, custom_fields }`).
- Pause/break macro injection.
- Telemetry-driven `BUILDER_BODY_SELECTORS` refinement.
- AtlasVoiceSelector multi-select for WPBakery-style row stacks.
- Shortcode whitelist UI (Trinity-style).
- Compatibility-tab UI for MetaBox / Pods / JetEngine / Toolset / Carbon Fields full-surface.

New to v5:

- **Telemetry event `atlasvoice_short_circuit_hit`** with `{ post_id, scope, setting_changed, extracted_chars }` so we can measure P8 cost savings in production.
- **A/B harness for Go Live copy** — measure typed-confirmation abandonment vs a single-click version once the first 100 Pro admins ship production.
- **Rules table bulk edit** — "apply this include to all CPTs without their own rule" one-shot action for admins migrating from legacy.

---

## 18. Revision log

### 2026-04-28 — D13 finalised (Readers ship dormant + opt-in filter)

- Added the four missing reader classes (`PodsReader`, `JetEngineReader`, `ToolsetReader`, `CarbonFieldsReader`) so all six classes named in the plan exist and are loadable.
- Decided **not** to wire `ReaderRegistry::read_all()` into the extractor by default and **not** to build the Compatibility-tab drag-sort UI. The step-rail (D9–D11, D15, D16) already exposes any rendered field through click-pick / drag-to-include, and the project's commitment is to voice what visitors actually see; reading aloud unrendered field values would silently override theme decisions.
- Added the opt-in filter `atlasvoice_extra_field_text` inside `tta_clean_content()` (helpers.php). Defaults to an empty array, so it's a no-op until a developer hooks in. Two-line snippet to enable site-wide is documented in the new `docs/atlasvoice-readers.md` developer guide, alongside per-reader configuration (allowlist + max_fields) and the rationale for shipping the readers dormant.
- Updated the §13 D13 row + the `ReaderRegistry` class docblock to point at the new doc so future maintainers don't try to "finish" the wire-up without re-reading the design rationale.

### 2026-04-28 — D14, D5 polish (verify-across-posts shipped + Go Live soft-prereq)

- Added `VerifyAcrossPosts.php` + `/step-rail/verify-sample` REST route (D14.1), the hidden-iframe runner in `step-rail.shell.js` (D14.2), and the rail step-⑦ "Verify across posts" button + results table (D14.3).
- Wired the D14 dry run into D5's Go Live flow as a **soft prereq**: clicking "Go Live" now first asks whether to open a sample post in a new tab so the admin can verify rules before the typed-confirmation prompt. Cancel / no-sample paths fall through silently to the existing typed prompt.
- Hotfix: switched the verify-prompt body from PHP single-quoted `\n\n` (literal) to `implode("\n", …)` so real newlines reach `window.confirm`. Also corrected the REST namespace in the inline script from the accidental `tts/v1` to the canonical `tta/v1`.

### 2026-04-28 — D16–D20 (drag-to-mark + extractor hardening)

- Added §13 rows D16–D20 covering: drag-to-mark gesture (D16, six sub-commits), dynamic button-id support across marker/wrapper lookups (D17), removal of the `state.rightOpen` early-return that left the preview body stale (D18), SVG-safe class strip + built-in extractor defaults for `<script>`/`<style>` and the plugin's own player chrome (D19), and select-to-exclude auto-exit so the body text-cursor class clears on commit (D20).
- D19 root-caused a TypeError that had been silently aborting `updatePreview()` whenever `div.entry-content` (or any picked region) contained an SVG icon — the picker would appear to "do nothing" on open.

### 2026-04-23 — D15 (picker parity patch)

- Added **D15** to §13 roadmap: inline chip editing, live-on-keystroke highlight/preview updates, and extractor/highlight parity fix.
- Root cause fixed: running `excl_css` selectors against a detached clone caused positional pseudos (`:nth-of-type`, `:nth-child`) to drift after each removal, so the preview stripped a different paragraph than the one highlighted red on the page. Now selectors resolve against the live DOM (via a one-shot `data-av-excl-match` attribute) before cloning.
- Verified in-browser against a 25-paragraph post with three `:nth-of-type` excludes: old code removed paragraphs 2/5/9, new code correctly removes 2/4/7 — matching the red highlight 1:1.

### 2026-04-21 — v5 (this revision)

Consolidates every point from the mid-session conversation into a single coherent document that supersedes v4.2. Key additions and realignments:

- **§1 Core principles (P1–P15)** — the commitments that must survive every revision. Each subsequent section exists to honour a subset of these principles simultaneously.
- **§3 Hook-based isolation + directory layout** — the target `includes/atlasvoice/` layout and the copy-with-rename `lib.php` helper strategy.
- **§13 D1–D14 implementation roadmap** — each step is an atomic commit with named file/class scope and a commit-message template.
- **§14 Architecture reconciliation** — audit of the shipped §0.7 code against P1–P4 with an Option A refactor plan (D0a–D0e) to restore hook-based isolation before D1 begins.
- **§15 Rollout re-sequenced** — PR-C split into four sub-PRs (ticket-killers shipped; refactor, regen-cost, UI) to isolate the architecture-reconciliation work from the remaining feature work.
- **§16 Acceptance criteria 25–32** — isolation audit, directory-delete recovery, regen-guard coalescing, short-circuit hit-rate, lazy-picker bundle verification, staging silence, typed-confirmation validation, snapshot integrity.
- **v4.2 §19 Player init unification** — remains valid; cross-reference the v4.2 file.
- **v4.2 §4 extraction-engine tier mechanics** — remain valid; cross-reference the v4.2 file. v5 does not revise the engine.
- **v4.2 §5–§6 MP3 regen + fingerprint mechanics** — incorporated into v5 §5 with the content-hash short-circuit and lazy-invalidation commitments reiterated.
- **v4.2 §7 custom-field opt-in** — unchanged; D13 implements the readers under `includes/atlasvoice/Readers/`.
- **v4.2 §8 diagnostics UX** — unchanged; preview modal + diagnose URL + dry-run diff carry forward.
- **v4.2 §9 Free vs Pro split** — restated in v5 §11 with the cost-sensitive rows made explicit.
- **v4.2 §10 backward-compatibility + storage-key migration** — carries forward; v5 §12 consolidates the full storage-key catalogue.
- **v4.2 §11 edge cases + §11.1 six hard cases** — v5 §7 is a restatement; the case-by-case in-UI guidance commitments are unchanged.
- **v4.2 §12–§14 security / performance / observability** — unchanged.
- **v4.2 §15 testing matrix** — unchanged; referenced from v5 §16 criteria.
- **v4.2 §17 file-level change list** — superseded by v5 §3 directory layout (post-refactor) and v5 §14 refactor mapping (legacy-to-target paths).
- **v4.2 §20 open questions** — carried forward with v5 additions.

### Pre-v5 history

See [TTS-238-content-extraction-overhaul.md](TTS-238-content-extraction-overhaul.md) for the complete v2 → v3 → v4 → v4.1 → v4.2 revision log. v5 does not rewrite the v4.2 file; it sits alongside it as the authoritative successor and cross-references v4.2 for mechanics detail.
