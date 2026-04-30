# TTS-238 — Picker collapse to legacy keys (proposal v2)

**Status:** draft, not yet implemented
**Author conversation:** 2026-04-30
**Supersedes (partially):** TTS-238 v5 §13 D7 (Per-post-rules separate store), §13 D9–D11 (step-rail scope chooser)

---

## 1. Why

The new picker introduced a parallel rule store (`tta_atlasvoice_selectors`
option + `_atlasvoice_post_rules` post meta + `RuleResolver` precedence walk)
that **duplicates four mechanisms that already work** in the legacy plugin:

| Picker UI step | Legacy equivalent |
| -------------- | ----------------- |
| Content region | Include Content By CSS Selectors |
| Skip these areas | Exclude Content By CSS Selectors |
| Skip these tag types | Exclude HTML Tags To Speak |
| Skip these phrases | Exclude Texts To Speak |

The legacy engine (PHP `tta_clean_content` + the JS reader) already consumes
the legacy keys at runtime. Keeping a second store means two places where
the same data lives (drift risk), two save paths, a 5-way scope precedence
resolver to maintain, and Free vs Pro gating logic in two places.

**Greenfield — the new picker has not shipped to users.** No migration cost
to remove the parallel store.

---

## 2. Schema

Each legacy CSS-selector key becomes a **per-scope-keyed array**. Old
string values keep working — they're treated as `__global__`.

### 2.1 Scope key format

```
__global__               // site-wide fallback
post                     // post-type scope (any language)
post|lang:fr             // post-type + language scope
lang:fr                  // language-only scope
```

### 2.2 Settings store (one option per concern)

```php
tta__settings_atlasvoice_include_selectors = [
  '__global__'       => '#main-content',
  'post'             => '.entry-content',
  'post|lang:fr'     => '.contenu-article',
  'page'             => '#page-body',
  'product'          => 'div.product-summary',
];

tta__settings_atlasvoice_excl_css   = [ '__global__' => […], 'post' => […], 'post|lang:fr' => […], … ];
tta__settings_atlasvoice_excl_tags  = [ '__global__' => […], 'post' => […], … ];
tta__settings_atlasvoice_excl_texts = [ '__global__' => […], 'post' => […], … ];
```

Each option is an independent map. The resolver picks the **winning scope
key** based on the precedence walk in §3, then reads that scope's value
from each of the four options.

### 2.3 Per-post override (Pro only)

Reuses the existing meta key — greenfield, no rename:

```
post meta:  _atlasvoice_post_rules
value: [
  'selector'   => '…',
  'excl_css'   => […],
  'excl_texts' => […],
  'excl_tags'  => […],
]
```

### 2.4 Backward-compat reader

```php
$opt = get_option('tta__settings_atlasvoice_include_selectors', []);
if (is_string($opt))      { $opt = ['__global__' => $opt]; }
if (! is_array($opt))     { $opt = []; }
$global = $opt['__global__'] ?? '';
```

---

## 3. Resolver — cascade, no merge

**Per-post wins entirely. Else post-type+language. Else language. Else
post-type. Else global.** Each tier owns its own excludes; we do **not**
merge across tiers (per user direction 2026-04-30).

```
Tier 1 — _atlasvoice_post_rules            (Pro only)
Tier 2 — opt['<post_type>|lang:<lang>']    (when multilingual + lang set)
Tier 3 — opt['lang:<lang>']                (language-only fallback)
Tier 4 — opt['<post_type>']
Tier 5 — opt['__global__']                 (or string-form root)
```

The first tier with a **non-empty `selector`** wins. The rule returned to
the extractor is `{selector, excl_css, excl_texts, excl_tags}` from
**that tier alone** — no union with anything below. If a tier has a
selector but no excludes, that's the admin's intent: read everything,
exclude nothing at this scope.

Implementation: ~40-line `LegacyRuleReader::resolve($post_id)` static
helper; PHP-side. JS port mirrors it for the picker preview.

---

## 4. Dashboard UI

### 4.1 "Allow Listening For Post Type" section (extended)

Each enabled post type expands into a small editor block. Per-language
sub-rows only render when a multilingual plugin is active
(`LanguagePlugins::is_multilingual()`).

```
┌── Allow Listening For Post Type ───────────────────────────────────┐
│                                                                    │
│  ☑  Post                                                           │
│      ┌──────────────────────────────────────────────────────────┐  │
│      │ Default selector       .entry-content       [ Pick ▸ ]   │  │
│      │ Skip areas             .share-bar, .author  [ Edit ▸ ]   │  │
│      │ Skip tags              blockquote, figure   [ Edit ▸ ]   │  │
│      │ Skip phrases           "Read more"          [ Edit ▸ ]   │  │
│      │                                                          │  │
│      │ Per-language overrides   (WPML detected)                 │  │
│      │   en   uses Default                       [ Pick ▸ ]     │  │
│      │   fr   .contenu-article                   [ Pick ▸ ] [✕] │  │
│      │   de   uses Default                       [ Pick ▸ ]     │  │
│      └──────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ☑  Page                                                           │
│      ┌──────────────────────────────────────────────────────────┐  │
│      │ Default selector       #page-body           [ Pick ▸ ]   │  │
│      │ … (excludes rows) …                                      │  │
│      │ Per-language overrides   (none yet)                      │  │
│      └──────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ☐  Product   (post type not enabled)                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌── Global fallback ─────────────────────────────────────────────────┐
│ Applies to any post type without its own entry above.              │
│   Default selector       #main-content              [ Pick ▸ ]     │
│   Skip areas             .sidebar                   [ Edit ▸ ]     │
│   …                                                                │
└────────────────────────────────────────────────────────────────────┘

┌── Per-language only (no post type) ────────────────────────────────┐
│ Optional: rule that applies to all post types in this language     │
│ (when no post-type rule exists for that pair).                     │
│   en   uses Global                          [ Pick ▸ ]             │
│   fr   .article-body                        [ Pick ▸ ] [✕]         │
└────────────────────────────────────────────────────────────────────┘
```

**Rules of behaviour**

- "Pick ▸" launches the step rail in a new tab on a random post of that
  type (and language, when applicable). URL carries the scope context
  (`?atlasvoice_picker=1&scope=post_type:post|lang:fr`). Save writes back
  to that exact scope key in the four legacy options.
- "✕" clears the per-language override for that row, falling back to the
  post-type-default rule.
- Per-language sub-section is hidden when `LanguagePlugins::is_multilingual()`
  is false. The "Per-language only" block at the bottom is also hidden
  in that case.
- "Edit ▸" on excludes opens an inline editor (chip-style, same as the
  rail) without leaving the dashboard — for tweaks that don't need a
  visual pick.

### 4.2 Per-post override meta box (Pro only)

On the post-edit screen, a single button. No scope chooser, no inline
editor:

```
┌── AtlasVoice — Listen rule for this post (Pro) ────────────┐
│                                                            │
│  Effective rule:   .entry-content   (post type "post")     │
│                                                            │
│  [ Pick custom selector for THIS post ▸ ]                  │
│  [ Reset to post-type rule ]                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- "Pick custom selector for THIS post" opens this post with
  `?atlasvoice_picker=1&scope=post:152`. Save writes the post meta
  `_atlasvoice_post_rules`.
- "Reset to post-type rule" deletes the meta — the post falls back to
  the post-type / language / global cascade.
- The "Effective rule" line is read-only, computed by
  `LegacyRuleReader::resolve($post_id)`. Helps the admin see what
  WOULD apply before they override.

### 4.3 Step rail — trimmed

Scope radio is gone. Rail opens with scope context already pinned via
URL parameter. Header reads:

> *Editing rule for: Post type "post" + language "fr"*

The four steps (Content region / Skip areas / Skip tags / Skip phrases)
behave the same as today. Save writes to whichever scope key the URL
parameter dictates.

### 4.4 Wrapper opt-out

New checkbox in settings:

> *☑ Emit legacy `<div class="tts_content_wrapper_N">` wrapper
> (turn off if your theme's layout breaks on it; comment markers
> are still emitted)*

Default ON.

---

## 5. What gets deleted

- `tta_atlasvoice_selectors` option — gone.
- `RuleResolver` class — replaced by `LegacyRuleReader`.
- `PerPostRules` + `PerPostRulesMetaBox` — replaced by the new minimal
  meta box; `_atlasvoice_post_rules` key reused.
- `/wp-json/tta/v1/save-selector` REST route — replaced by writes
  through the existing settings save endpoint + a new
  `/wp-json/tta/v1/post-rule` for per-post saves.
- `/wp-json/tta/v1/post-rules` REST route — same replacement.
- Step rail's `ScopeRow` component / scope radio markup.

## 6. What stays

- Step rail's drag-to-include / drag-to-exclude / chip editor / verify-
  across-posts (D14) / Tier 1–4 extractor fallback — all unchanged on
  the read side.
- Comment-marker emission (Pro filter) — unchanged.
- Mode (staging/production), Snapshots, RegenGuard, ContentHash,
  SelectorHash — orthogonal, unchanged.

---

## 7. Free vs Pro split

| Feature | Free | Pro |
| ------- | ---- | --- |
| Global selector + excludes | ✓ | ✓ |
| Per-post-type selector + excludes | ✓ | ✓ |
| Per-language selector + excludes | ✓ | ✓ |
| Per-post-type+language combos | ✓ | ✓ |
| Per-post override (`_atlasvoice_post_rules`) | — | ✓ |
| Verify across posts | — | ✓ |
| Snapshots / Go Live | — | ✓ |

Pro differentiator stays "per-post override + admin tooling around the
live mode flip."

---

## 8. Cost & sequencing

Estimated **~2 focused days**, atomic commits:

1. **D26.1** Schema + `LegacyRuleReader::resolve($post_id)`. Backward-compat
   string-form support. PHP-side only, no write changes yet.
2. **D26.2** JS port of the resolver in `step-rail.shell.js`. Picker
   preview consumes the new reader.
3. **D26.3** Picker save → legacy keys. Step rail save() and the REST
   handler write to `tta__settings_atlasvoice_*[scope_key]`.
4. **D26.4** Dashboard "Allow Listening For Post Type" extended UI —
   per-type editor blocks, per-language sub-rows when multilingual,
   global fallback block, language-only block.
5. **D26.5** Step rail scope chooser removed. Header reads scope from
   URL param.
6. **D26.6** Per-post meta box rewrite. Single "Pick custom selector"
   button + "Reset to post-type rule". Effective-rule read-out.
7. **D26.7** PHP extractor swap — `tta_clean_content` consumes
   `LegacyRuleReader` instead of `RuleResolver`. Old `RuleResolver`,
   `tta_atlasvoice_selectors` option write path, `PerPostRulesMetaBox`
   deletion.
8. **D26.8** Wrapper opt-out checkbox + smoke tests.
9. **D26.9** Plan doc + revision log update.

---

## 9. Decisions captured (2026-04-30)

| Question | Decision |
| -------- | -------- |
| Per-post meta key | **Reuse `_atlasvoice_post_rules`** (greenfield, no rename needed). |
| Excludes merging | **No merge** — winning tier owns its excludes outright. |
| Per-language UI | **Ship now**, not deferred. Schema and dashboard rows above. |

---

## 10. Open questions

1. **Settings export/import.** Existing tooling reads the flat
   `tta_settings_data` row. Does the new per-scope-keyed value
   roundtrip through the export/import path cleanly? Believed yes;
   verify before D26.4.
2. **Multilingual plugin coverage.** `LanguagePlugins::detect()` covers
   WPML / Polylang / TranslatePress / GTranslate. Anything else
   commonly seen on TTA installs that needs detection here?

---

## 11. Decision

Awaiting approval to proceed with D26.1.

