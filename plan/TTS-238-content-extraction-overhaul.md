# TTS-238 — Content Extraction Overhaul

**Status:** Plan v4 (three-layer architecture — opt-in / mode / rules — with hook-based integration, content-hash short-circuit, and lazy visitor-load invalidation). §19 Player init unification already shipped in 2.1.16 — see below. **PR-A (opt-in gating + UI split) shipped on the feature branch.** PR-B (picker wizard + lazy loading) and PR-C (Pro rules + staging/production + lazy regen) pending.
**Plan date:** 2026-04-17 · **Revised:** 2026-04-21 (v4: three-layer + cost-sensitivity + hook-based integration) · 2026-04-20 (v3: architectural collapse)
**Branches:** `feature/TTS-238` in both `text-to-audio` (free) and `text-to-audio-pro` (pro)
**Jira:** https://atlasaidev.atlassian.net/browse/TTS-238
**Related:** [research-competitor-content-extraction.md](research-competitor-content-extraction.md) · [TTS-future-content-extraction-improvements.md](TTS-future-content-extraction-improvements.md)

---

## 0. What changed in this revision (v4)

v4 does **not** revise the extraction engine — v3's "one JS engine + one dumb PHP fallback" still stands. v4 layers the **runtime control plane** on top: how the new system is turned on, how users pick their content area, when MP3s are regenerated, and how the new system stays out of the legacy path's way until a user explicitly opts in.

The v4 decisions, distilled:

### 0.1 Three-layer runtime architecture (new)

| Layer | Setting key | Values | Default | Who sees it |
|---|---|---|---|---|
| **1. Opt-in** | `tta__settings_use_atlasvoice_extractor` | `bool` | `false` | All users. When OFF the legacy extraction pipeline runs unchanged — zero new assets on the frontend, zero new UI beyond the toggle. |
| **2. Mode** | `tta__settings_atlasvoice_mode` | `staging` \| `production` | `staging` | Pro. **Staging** = new engine runs, MP3s are regenerated lazily per visitor, legacy output is still available as fallback ("Option X" dual-pipeline). **Production** = new engine is authoritative, legacy path is archived. |
| **3. Rules** | `tta__settings_atlasvoice_rules` | per-scope saved selectors | `{}` | Free = one global include selector. Pro = per-post-type + per-post overrides. Filled by the visual picker (§4.3) — users never write CSS. |

Each layer is independent and orthogonal: a user can opt in but stay in staging forever (the safest mode); Pro can flip the mode per site; rules accumulate from picker use regardless of mode.

### 0.2 Hook-based integration / maximum code isolation

Per the user's architectural directive, **no existing extraction file is edited** by the new system. The new pipeline plugs in via `template_redirect` and its own filters:

- New helpers live in **new files** (`src/extractor/…`, `src/picker/…`, `includes/AtlasVoice/…`). Any method the new system needs from the legacy code is **copied-with-rename**, not reused. This guarantees the legacy `getModifiedContent` / `TTA_Pro_Helper::acf_plugin_content` / `helpers.php::tta_get_button_content` call graphs stay byte-identical when opt-in is OFF.
- The only edits to existing files are **gates**: a short `if ($extractor_opt_in)` around script enqueue in `TTA_Admin.php`, an analogous gate around the admin-bar "Pick content area…" submenu, and one `if (tts.use_atlasvoice_extractor)` short-circuit at the top of `TTSProHelper.js::getModifiedContent` that delegates to the new engine and otherwise falls through to the untouched legacy body.
- Downstream integration with MP3 regeneration, block-opt-out, and custom-field append is done via new WordPress actions/filters fired from the `template_redirect` hook — not by monkey-patching existing functions.

This is a Strangler Fig pattern (Martin Fowler): the new system grows next to the old one until it can take over, then the old system is removed in a single PR. No dual-maintenance window.

### 0.3 Content-hash short-circuit + lazy visitor-load invalidation (Pro cost optimization)

v3 had fingerprints but still regenerated eagerly on `save_post` when the fingerprint changed. v4 adds two cost optimizations that matter only for **Pro** (AI voice providers cost per character; Free uses browser `speechSynthesis` and has no per-generation cost):

- **Content-hash short-circuit.** After the new extractor runs, compute `md5(extracted_text)`. If it matches the last-known `_tta_extracted_text_hash` for that post + settings, skip regen even if settings changed. Typical case: user toggles an unrelated setting like "Add post excerpt" on a post where the excerpt is empty — extracted text is identical, so the existing MP3 is still valid.
- **Lazy visitor-load invalidation.** On setting changes that *do* change the hash, v4 **does not** mass-delete MP3s upfront. Instead the dirty flag is written; the next visitor to each post triggers delete-then-regen for that post on first listen via `template_redirect`. A 500-post site doesn't pay 500× regen upfront — it pays only for the posts that are actually listened to.

Both optimizations are **invisible to Free**: Free has no MP3 cache, so there is nothing to short-circuit or lazily invalidate. Only Pro reads these fields.

### 0.4 Visual picker is a fallback UI, not a primary workflow (zero-click philosophy)

**Core principle:** every mandatory UI step is a new ticket vector. The goal is to eliminate user-facing decisions whenever the engine can make them. The 4-step wizard from earlier drafts is kept **only as the low-confidence fallback** — the common case is zero clicks.

**Happy path (expected ~85–90% of opt-ins, zero clicks):**

1. User turns Layer 1 opt-in ON.
2. First visitor (or admin preview) loads a post of each active post type.
3. The engine runs scoring (§4.5). If `confidence ≥ 0.8`, the selector is **auto-saved** silently to the per-CPT scope via first-visit auto-save (§4.4).
4. A non-blocking toast appears in the admin preview: *"Content area detected automatically for Posts. [▶ Listen sample] [Change]"*. Dismissible. Ignoring it is the right default.
5. Auto-detected excludes (nav-like children — see §0.7) are applied silently. Auto-detected boilerplate text excludes (cross-post substring analysis) are suggested as dismissible chips.

No picker. No wizard. No CSS.

**Low-confidence path (~10–15%, one click):**

When `confidence < 0.8` or auto-scoring has no clear winner (e.g. Oxygen Builder with generic class names), the toast changes to a prompt: *"We need your help picking the content area. [Pick visually]"*. Clicking opens the picker overlay. User points at the text, clicks "Use this", done. Everything else is auto-detected around the chosen container.

**Power-user / edge-case path (opt-in only):**

A collapsed **"Advanced refinement"** panel exposes, for users who need it:

- Scope override (`this post only` vs `this post type` vs `all post types`).
- Tag-exclude chip editor (`sub`, `sup`, `blockquote` suggested; custom accepted).
- Text-exclude chip editor (with "suggested from your site" chips populated by the boilerplate detector of §0.7).
- Per-post overrides (Pro).

This panel is **never shown by default** and the engine works without anyone opening it.

**What this means for PR-B scope:**

- PR-B does NOT build a 4-step wizard as a primary flow.
- PR-B builds: (1) the auto-detection toast, (2) the one-click picker fallback, (3) the collapsed Advanced panel, (4) the listen-sample button inside each.
- Settings.js hides the "Include Content By CSS Selectors" textarea when Layer 1 is ON (replaced by the auto-detect flow); the three legacy excludes stay visible because they still solve orthogonal skip-cruft cases.

### 0.5 Settings UI split (shipped in PR-A)

`src/dashboard/components/dashboard/settings/Settings.js` split into three files so the new system's UI can evolve independently of the legacy fields:

- `SettingsPrimitives.js` — shared `ToggleSwitch`, `SettingRow`, `ProLockIcon` components.
- `AtlasVoiceSettings.js` — opt-in toggle + picker launcher card (the picker card is gated on opt-in; PR-B will replace it with the wizard).
- `LegacyExtractionSettings.js` — the four pre-AtlasVoice CSS-based fields, mechanical lift, identical behavior.

### 0.6 Dropped from earlier thinking

Several ideas from mid-session brainstorming were dropped:

- **"Skip low-traffic posts" for lazy regen** — dropped because Free has no analytics surface that defines "low-traffic" consistently.
- **Differential voice cost optimization** (pick cheapest voice for bulk regen) — out of scope; not essential for v4.
- **Free cost-surface gating on migration dialog** — dropped; Free has no MP3 generation, so there is no cost surface to gate.

### 0.7 Runtime self-healing + auto-detection (the real ticket-killers)

Auto-picking once is not enough. The persistent ticket surface is sites where **a selector that worked yesterday stops working today** (theme update, builder rebuild changing auto-increment IDs, cache serving a different DOM variant). To close that gap, PR-C adds two runtime systems that run without user involvement:

**1. Self-healing selectors.** Every extraction attempt checks:

```
result = tryResolve(saved_selector)
if (!result || result.text.length < 40 || result.linkRatio > 0.6):
    // saved selector no longer produces usable content
    rescored = runScoringPass()
    if (rescored.confidence >= 0.8):
        saveSelector(scope, rescored.selector)    // silent heal
        emit telemetry: { event: 'selector_auto_healed', old, new }
        logToAdminBadge(post_id)
    else:
        fall through to tier 7 (PHP dumb fallback)  // site still works, degraded
```

No modal, no email, no blocking prompt. The admin sees a dashboard badge: *"3 posts auto-healed last 7 days. [Review]"*. Clicking opens a table that shows old → new selectors with listen samples for each, so the admin can revert a heal if it went wrong (one click per post).

**2. Boilerplate text auto-detection.** Runs as a daily WP-Cron job over the 20 most-recently-extracted posts (or all posts if < 20 exist). Finds text patterns that appear in > 50% of extracted bodies — these are almost always CTAs, share-button labels, related-post titles, or author-bio boilerplate that leaked through CSS exclusion. Surfaces them as **suggested text-exclude chips** in the Advanced panel and in the post-edit meta box:

```
"We noticed 'Share this post' appears on 87% of your posts.
 [Add as exclude] [Ignore]"
```

Users who never open Advanced see nothing. The suggestion list persists until actioned or dismissed. Dismissed patterns are remembered per-site (stored in `tta__atlasvoice_boilerplate_dismissed`).

**Why these two matter for ticket volume:** per the research in this thread, ~50% of the remaining tickets after a good wizard are caused by (a) saved selectors breaking after theme/builder updates and (b) boilerplate leakage the user doesn't know how to exclude. Both are solved by code, not UI.

### 0.8 PR breakdown (supersedes v3 Phase 1-4)

| PR | Scope | Status |
|---|---|---|
| **PR-A** | Opt-in flag plumbed end-to-end, engine + picker gated on opt-in, legacy path 100% unchanged when OFF, Settings.js UI split. | ✅ Shipped on `feature/TTS-238`. |
| **PR-B** | Confidence-scored resolver (B1), first-visit auto-save + low-confidence picker toast (B2), side-by-side diff preview with 5s listen sample (B3+B4). Lazy on-demand loading of picker/engine bundles deferred to PR-C. | ✅ Shipping on `feature/TTS-238`: B1 commit `296f223`, B2 commit `08b295c`, B3+B4 pending in-flight commit. |
| **PR-C** | Pro rules (per-post-type + per-post), staging/production mode toggle, content-hash short-circuit, lazy visitor-load MP3 invalidation, snapshot/rollback per scope, custom-field reader behind opt-in, lazy bundle loading (picker only fetched when dashboard button clicked / admin-bar item opened). | After PR-B. |

See §16 for the updated rollout table.

---

## 0 (historical). What changed in v3

The prior revision (v2) described a **three-layer architecture** — Layer A (PHP smart extraction with DOMDocument + XPath + Readability + scoring), Layer B (JS hardening), Layer C (diagnostics). Two weeks of follow-up conversation with the user and additional production incidents made it clear that the three-layer design was the wrong shape:

1. **Users never want the player to read anything they cannot see on the page** — except intro / outro, which are settings-driven and not part of post content. The DOM is the source of truth.
2. **Parallel PHP + JS extraction doubles the bug surface.** Every competitor that bypasses `the_content` (Trinity) is wrong, and every competitor that tries to reproduce a page-builder's final output server-side (Mementor, SpeechKit's classic path) gets edge-cased to death. Maintaining two systems in lockstep means every builder regression has to be fixed twice.
3. **The existing wrapper `<div class="tts_content_wrapper_X">` at [TTA_Pro_Filters.php:255](../../text-to-audio-pro/Includes/TTA_Pro_Filters.php) is itself a cause of regressions** — flexbox/grid direct-child rules, `:first-child` / `:nth-child` selectors, and a11y trees all treat a wrapper div as a new structural element. Confirmed customer incident.

v3 collapses the whole design to **one engine (JS, in the browser, reading the rendered page)** backed by **one dumb PHP fallback** (`get_the_content()` → `window.TTS.contents[buttonId]`). The wrapper div is replaced by HTML **comment markers** (`<!--atlasvoice:start:1-->` / `<!--atlasvoice:end:1-->`), the same mechanism WordPress core uses for `<!--more-->` and block delimiters. Non-technical users get **AtlasVoiceSelector** (SelectorGadget-based point-and-click picker) instead of a CSS selector textarea.

High-level changes from v2:

| Topic | v2 | v3 |
|---|---|---|
| Extraction engine | PHP DOMDocument + JS fallback | **JS only**; PHP is a dumb last-resort fallback |
| `TTA\TTA_Content_Extractor` PHP class | New class, ~800 LOC | **Dropped** |
| `fivefilters/readability.php` vendoring | Required (~40 KB) | **Dropped** |
| CSS-to-XPath translator | Hand-rolled 3 KB subset | **Dropped** |
| libxml / XXE hardening | Required | **Dropped** (no HTML parsed PHP-side) |
| `tts_content_wrapper_X` div | Primary signal | **Deprecated**; replaced by `<!--atlasvoice:start:X-->` comment markers |
| Layer-A filter surface (`tta_extractor_*`) | 8 new filters | **Dropped**; smaller JS-side surface instead |
| Selector storage | Global + per-post only | **Global + per-post-type + per-post** (Pro); per-post-type is new |
| First-time setup | Implicit | **First-visit auto-save** of scored selector, per post type |
| Manual override for non-tech users | Textarea of CSS | **AtlasVoiceSelector** (point-and-click) |
| `BUILDER_BODY_SELECTORS` | 10 builders | 10 builders + WooCommerce + 5 LMS plugins |
| Gutenberg block opt-out | Kept | **Kept** (works the same in JS-only model) |
| MP3 regeneration policy | Kept (manual / auto / ask) | **Kept**, fingerprint now derived from JS-reported extracted text |
| Dry-run diff | Kept | **Kept**, now compares legacy wrapper-div path vs comment-markers path |
| CPT / custom-field plugin readers | Always appended | **Opt-in only** (user's "never read anything not on the UI" constraint) |
| Diagnose URL (Pro) | Kept | Kept |

Everything else (inline help, docs page, Free vs Pro split, backward compatibility, security, performance, observability, testing matrix, §19 player-init unification) is adapted to the JS-only model but preserved in spirit.

---

## 1. Problem statement (verbatim from support)

- "On single posts it reads the navigation and none of the post content." — disabledepisco.com user.
- "It's only preloading. And it's reading HTML and image names etc." — voice-change user.
- Multiple tickets resolved only by trial-and-error CSS selector tweaking, ACF field picking, or by toggling **Read Content From Dom** off.
- One refund: Elementor + ACF + shortcode rendered from PHP template code — no combination of settings worked.
- **New incident (2026-04-18):** customer site with a CSS grid layout using `grid-template-rows: auto 1fr auto` on the immediate children of the post container. The injected `<div class="tts_content_wrapper_1">` became an unexpected grid child, broke the layout, and pushed the footer up. Disabling auto-button resolved the visual regression but disabled audio. Rollback shipped via `tts_should_add_content_wrapper` filter — but that filter existed only because we already knew the wrapper was fragile.

The common pattern is two-fold:

1. **The plugin picks the wrong DOM container** and reads whatever happens to live there (nav, share buttons, image alts, raw shortcodes).
2. **The plugin's own wrapper element interferes with host-site CSS**, so even when extraction is correct, the visual result can break.

Users have no easy way to know what the player is going to read until they hit play, and no easy way to fix extraction when it goes wrong without writing CSS selectors.

---

## 2. Root-cause map

Live inspection on disabledepisco.com confirmed:

- `window.TTS.contents[1]` already contains the correct 4536-char article (PHP path is fine).
- `tts_content_wrapper_1` exists with the correct text.
- Site is **Beaver Builder + UABB**: no `.entry-content`, no `<article>`, no `[itemprop="articleBody"]`, no `.wp-block-post-content`.
- `.fl-builder-content` is in the JS `COMMON_CONTENT_SELECTORS` list — but on this site that class is **also on the page `<header>`**. `document.querySelector('.fl-builder-content')` returns the header → player reads navigation.

### 2.1 Failure surfaces in the current pipeline

| # | Surface | Why it fails | Evidence | Addressed in v3 |
|---|---|---|---|---|
| F1 | `getContentsFromDom` uses `document.querySelector` (first match) | Themes/builders re-use class names on nav/header. First match wins. | [TTSProHelper.js:628](../../text-to-audio-pro/Assets/js/TTSProHelper.js) | §4.5 scoring over `querySelectorAll`. |
| F2 | `COMMON_CONTENT_SELECTORS` is a flat unscored list | `.fl-builder-content`, `.elementor-section` legitimately appear on header/nav containers. | [TTSProHelper.js:671](../../text-to-audio-pro/Assets/js/TTSProHelper.js) | §4.5 scoring + expanded `BUILDER_BODY_SELECTORS`. |
| F3 | `tts_content_wrapper_X` only exists when `tts_button_with_content` filter fires | Buttons emitted via direct PHP `echo tta_get_button_content()`, Elementor TTS widget, or shortcode-only mode never get the wrapper. | [TTA_Pro_Filters.php:244-255](../../text-to-audio-pro/Includes/TTA_Pro_Filters.php) | §4.2 comment markers emitted at the same site; AND scoring handles the shortcode-only case. |
| F4 | Free PHP path uses raw `get_the_content(null, false, $post)` | Skips `the_content` filters → blocks, shortcodes, ACF-the-content, Elementor server-rendered output are all ignored. Free users hear shortcode names or empty text. | [helpers.php:232](../includes/helpers.php) | §4.7 — PHP fallback is only used when JS extraction fails entirely. The JS path already sees the rendered DOM, so this failure mode moves from "common" to "last-resort only". |
| F5 | Excludes are scoped within includes only | Users who never set includes can't exclude `nav`, `.sidebar`, etc. globally. | [TTSProHelper.js:537-563](../../text-to-audio-pro/Assets/js/TTSProHelper.js) | §4.5 default exclude closure (`nav,header,footer,aside,…`) runs unconditionally in the scorer. |
| F6 | No "is this actually article content" sanity check | Whatever the selector matched is trusted blindly, even if it's 30 chars of nav text. | — | §4.5 min-text-length filter + link-ratio penalty; §4.4 confidence threshold triggers picker. |
| F7 | No diagnostic visibility | User and support both have to open DevTools and guess. | — | §8 Preview audio text + AtlasVoiceSelector highlight. |
| F8 | Raw `get_the_content` vs `the_content` — the `tta__content_description` filter at [TTA_Hooks.php:39,511-553](../includes/TTA_Hooks.php) consumes raw content but no step re-renders it. | Same class as F4. | — | Same as F4. |
| F9 | REST listing paths hit `tta_get_button_content()` on `GET /wp/v2/posts` when the Pro REST preview renders. | Heavy extraction on list pages — perf regression risk. | — | §13 — PHP path stays dumb; no heavy work. Admin list table never calls the JS engine. |
| F10 | AMP canonical and Reader mode strip dynamic attrs — `.tts_content_wrapper_X` is removed by AMP sanitizer. | Wrapper-based path silently degrades on AMP pages. | | §4.2 — comment markers are preserved by AMP sanitizer (AMP spec explicitly preserves comments). |
| F11 | Language-switch timing — Polylang/WPML switches the post language on `init`, but `tta_get_button_content` is often evaluated earlier inside a shortcode/widget on `wp`. Title/excerpt can mismatch body. | | | §11 — JS reads the translated DOM; language mismatches disappear for the body. Intro/outro remain PHP-bound and follow the PHP locale (acceptable). |
| F12 | Intro/outro double-injection — `helpers.php:267-270` bakes intro/outro into `$content` for free; Pro's `getContent()` also baked intro/outro pre-TTS-232 for player_id 1. | [helpers.php:267](../includes/helpers.php) | | §4.7 — intro/outro remain PHP-side for player 1; Pro handles in JS. No overlap because JS engine reads DOM body only, not the PHP string for player ≥3. |
| F13 | CPT archives — `should_load_button()` passes for archive loop items, so Bulk MP3 invokes extractor for each. | [TTA_Helper.php:147-236](../includes/TTA_Helper.php) | | §4.4 — per-post-type storage means each archive item resolves to the same saved selector; no re-scoring per item. |
| F14 | Shortcode-rendered ACF — `[acf field="x"]` inside `post_content` renders through `the_content`, but `tta__content_description_callback` also appends ACF fields when free is active. Double-read risk. | [TTA_Hooks.php:511-546](../includes/TTA_Hooks.php) | | §7 — CPT/custom-field append is **opt-in only** and does substring dedup before appending. |
| F15 | Elementor dynamic tags — `{{dynamic:acf:foo}}` resolves only during `elementor/frontend/the_content`, not on raw `get_the_content`. Invisible to the old free path. | | | §4.7 — PHP fallback's invisibility no longer matters; JS sees the rendered value. |
| F16 | No block-level opt-out — SpeechKit ships `attrs.beyondwordsAudio=false`. We have no equivalent. | [PostContentUtils.php:183-223](../../speechkit/src/Component/Post/PostContentUtils.php) | | §4.6 — Gutenberg block toggle persists `attrs.ttsAudio` and emits `data-tts-audio="false"` via `useBlockProps`; JS engine skips those nodes. |
| F17 **(new v3)** | Wrapper div breaks host-site CSS — flex/grid direct-child rules, `:first-child`/`:nth-child`, a11y trees. | 2026-04-18 incident report. | | §4.2 — replaced by HTML comment markers, which are invisible to CSS, layout, and a11y. |
| F18 **(new v3)** | Non-technical users cannot write CSS selectors. The plugin assumes DevTools familiarity. | Support ticket log 2025-11 → 2026-04; recurring theme. | | §4.3 — AtlasVoiceSelector (SelectorGadget-based) with admin-bar entry point. |
| F19 **(new v3)** | Per-post-type differences in page builders — a site may use Elementor for posts and Divi for products. Single global selector forces one to fail. | | | §4.4 — per-post-type selector storage (Pro). |

### 2.2 Builder / theme matrix — what each ships and what breaks

| Builder / theme family | Body container in DOM | Current detection failure |
|---|---|---|
| Beaver Builder | `.fl-post-content`, `.fl-builder-content` | `.fl-builder-content` also wraps header/templates. Picks header. |
| Elementor | `.elementor-widget-theme-post-content .elementor-widget-container`, `.elementor-section` | Theme Builder posts don't hit `the_content` → no wrapper. Common selector matches empty container. |
| Divi | `.et_pb_post_content`, `.et_pb_section`, `.entry-content` | Divi Builder body bypasses `the_content`. ACF-driven modules skipped server-side. |
| WPBakery (Visual Composer) | `.vc_row`, `.wpb_wrapper`, theme's `.entry-content` | Body is many sibling rows — no single container. Picks first `.vc_row` (often hero). |
| Oxygen Builder | `.ct-section`, `[id^="div_block-"]`, no `.entry-content` | Oxygen disables WP theme output. Common selector list misses entirely. |
| Bricks Builder | `.brxe-section`, `.brxe-container`, `[data-bricks-element]` | Same as Oxygen. |
| Avada / Fusion | `.fusion-text`, `.fusion-fullwidth`, `.post-content` | Body is split across many `.fusion-text` blocks. First match is usually hero. |
| GenerateBlocks | `.gb-container` | Class is generic — appears on header containers too. |
| Kadence Blocks | `.kadence-column`, `.entry-content` | OK if theme outputs `.entry-content`. |
| FSE block themes | `.wp-block-post-content` | Mostly OK; inner blocks inject `.wp-block-group` with no semantic class. |
| Astra / OceanWP / GeneratePress / Suki | `.entry-content` | Usually fine, but ACF fields outside `the_content` still missing. |
| **WooCommerce product** | `.woocommerce-Tabs-panel--description`, `.product .summary`, `.woocommerce-product-details__short-description` | No dedicated selector list today → falls back to scoring; scoring frequently picks price box. |
| **LearnDash** | `.learndash-wrapper .ld-tabs-content`, `.ld-lesson-content`, `.ld-topic-content` | Lesson content is nested inside tabs; default selectors miss. |
| **TutorLMS** | `.tutor-course-content`, `.tutor-lesson-content`, `.tutor-quiz-content` | Same nesting issue. |
| **LifterLMS** | `.llms-lesson-content`, `.llms-course-description`, `.llms-quiz-wrapper` | Same. |
| **MemberPress Courses** | `.mepr-single-course-content`, `.mepr-page-content` | Same. |
| **BuddyBoss LMS** | `.bb-lms-content`, `.bb-course-content` | Same. |

The pattern from v2 still holds — no single CSS-selector list solves this. The v3 fix is **scoring + per-post-type selector storage + AtlasVoiceSelector** so the user's first-time choice becomes site-specific memory.

---

## 3. Architecture — one engine, one fallback

```
                              ┌─────────────────────────────────────────────┐
                              │              rendered HTML DOM              │
                              │ (what the user actually sees in the browser)│
                              └──────────────────────┬──────────────────────┘
                                                     │
                                                     ▼
          ┌──────────────────────────────────────────────────────────────────────────┐
          │                  JS extraction engine (single source of truth)           │
          │                                                                          │
          │  Resolution order (§4.1):                                                │
          │    1. <!--atlasvoice:start:X--> / <!--atlasvoice:end:X-->   comment-marker walk        │
          │    2. Pro per-post override selector                (post meta)          │
          │    3. Per-post-type saved selector                   (option)            │
          │    4. Global saved selector                          (option)            │
          │    5. Scoring + button-parent traversal              (auto-pick)         │
          │    6. BUILDER_BODY_SELECTORS common map              (builders+LMS)      │
          │    7. PHP dumb fallback: window.TTS.contents[X]      (last resort)       │
          │                                                                          │
          │  On every success, report the picked selector + text length + fingerprint│
          │  back to PHP via POST /tts/v1/extraction-report                          │
          └──────────────────────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
                              ┌─────────────────────────────────────────────┐
                              │       PHP side — minimal, boring, stable    │
                              │                                             │
                              │  • get_the_content() string for fallback    │
                              │  • intro / outro concatenation              │
                              │  • comment-marker emission (§4.2)           │
                              │  • fingerprint storage + regen policy (§5)  │
                              │  • per-post-type selector storage (§4.4)    │
                              │  • REST endpoints for picker / preview      │
                              └─────────────────────────────────────────────┘
```

**Contracts:**

| Side | Entry | Returns | Notes |
|---|---|---|---|
| JS | `ttsExtractContent(buttonId, opts)` | `{ text, selectorChosen, tier, wordCount, fingerprint, elapsedMs }` | `tier` is one of `comment`, `override`, `per_cpt`, `global`, `scoring`, `common`, `php_fallback`. |
| PHP (fallback only) | `tta_get_button_content()` — existing function at [helpers.php:145](../includes/helpers.php) | `string $content` baked into `window.TTS.contents[buttonId]` | **Unchanged behaviour.** No DOMDocument, no Readability, no scoring. Only the comment-marker emission is new. |
| PHP (REST) | `POST /tts/v1/save-selector` / `POST /tts/v1/extraction-report` / `POST /tts/v1/preview-text` | JSON | §8. |

The PHP side knows nothing about HTML parsing. The JS engine knows nothing about intro/outro or fingerprint comparison (it only reports what it found). Each side does one job.

### 3.1 Runtime control plane (v4)

On top of the extraction engine, v4 adds three runtime layers that decide **whether** and **how** the engine runs. The engine itself is unchanged; these layers are pure gates.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Opt-in (tta__settings_use_atlasvoice_extractor)                │
│   OFF  → engine, picker, markers, new UI ALL dormant.                   │
│          Legacy pipeline runs byte-identical to 2.1.17.                 │
│   ON   → engine assets loaded; picker available; markers emitted.       │
└─────────────────────────────────────────────────────────────────────────┘
                                  │ (only if ON)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Mode (tta__settings_atlasvoice_mode)                           │
│   staging    → new engine runs, writes MP3s, keeps legacy output        │
│                available as diff baseline. Safe default.                │
│   production → new engine is sole source of truth. Legacy code path     │
│                is bypassed at the TTSProHelper.js opt-in gate.          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Rules (tta__settings_atlasvoice_rules)                         │
│   { scope: { include: selector, exclude: [selectors],                   │
│              tag_excludes: [tag|tag], text_excludes: [text|text] } }    │
│   Free  → single entry, scope='global'.                                 │
│   Pro   → multiple entries, scopes=['global', 'cpt:post',               │
│           'cpt:product', 'post:123', …]. Resolution: most-specific wins.│
│   Filled exclusively by the visual picker (§4.3). No textarea fallback  │
│   for Include when opt-in ON.                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Layers are orthogonal:** opt-in ON + staging + zero rules is a valid state (the engine runs with default scoring). Layer 3 only refines what Layer 2 already decided to run.

**Integration via `template_redirect` (hook-based, zero existing-file edits):**

The v4 runtime is plumbed by a new `AtlasVoice\Bootstrap` class registered on `template_redirect` priority 9. It inspects Layer 1; if OFF, it does nothing (the class simply returns). If ON, it:

1. Enqueues `tts-extractor-engine.min.js` and (for logged-in editors) `tts-picker.min.js`.
2. Fires the `atlasvoice_pre_listen` action on a visitor's first listen for a post, which computes the content hash and short-circuits or lazily invalidates the MP3 (§5, §6).
3. Registers the `atlasvoice_extractor_result` filter that `TTSProHelper.js::getModifiedContent` consumes via the opt-in gate.

Existing files (`TTSProHelper.js`, `helpers.php`, `TTA_Pro_Filters.php`, `TTA_Pro_Helper.php`) receive **at most** a single opt-in gate — a top-of-function `if (tts.use_atlasvoice_extractor) { try new path; return if succeeded; }` short-circuit. The body of those functions is untouched.

Any method the new system needs from existing code is **copied with rename** into the new module (e.g. `TTA_Pro_Helper::acf_plugin_content` → `AtlasVoice\Readers\ACFReader::read`). Never shared. This isolates the new system's evolution from the legacy path completely.

---

## 4. JS extraction engine

### 4.1 Resolution order (7 priority tiers)

```js
/**
 * Runs exactly once per buttonId per page load. Memoised.
 *
 * @param {string|number} buttonId
 * @param {Object}        opts    { mode: 'live'|'preview', postType?: string }
 * @returns {Promise<{text, selectorChosen, tier, wordCount, fingerprint, elapsedMs}>}
 */
async function ttsExtractContent(buttonId, opts = {}) {
    const t0 = performance.now();
    const cfg = window.TTS || {};
    const postType = opts.postType || cfg.postType || 'post';

    // Tier 1 — comment markers
    const walked = ttsWalkBetweenCommentMarkers(buttonId);
    if (walked) return finish(walked, 'comment');

    // Tier 2 — Pro per-post override
    const proOverride = cfg.perPost?.[buttonId]?.selector;
    if (proOverride) {
        const el = document.querySelector(proOverride);
        if (el && hasMeaningfulText(el)) return finish(el, 'override', proOverride);
    }

    // Tier 3 — per-post-type saved selector (Pro)
    const perCpt = cfg.autoSelectorByCpt?.[postType];
    if (perCpt) {
        const el = document.querySelector(perCpt);
        if (el && hasMeaningfulText(el)) return finish(el, 'per_cpt', perCpt);
    }

    // Tier 4 — global saved selector (Free default; Pro fallback)
    const global = cfg.autoSelector;
    if (global) {
        const el = document.querySelector(global);
        if (el && hasMeaningfulText(el)) return finish(el, 'global', global);
    }

    // Tier 5 — scoring + button-parent traversal
    const scored = ttsScoreAndPick(buttonId);
    if (scored && scored.confidence >= SCORING_CONFIDENCE_MIN) {
        // First-visit auto-save (§4.4)
        if (!global && !perCpt && cfg.canSaveAutoSelector) {
            await ttsRestPost('tts/v1/save-selector', {
                post_type: postType, selector: scored.selector, auto: true,
            });
        }
        return finish(scored.el, 'scoring', scored.selector);
    }

    // Tier 6 — BUILDER_BODY_SELECTORS common list
    const builderMatch = ttsTryBuilderBodySelectors();
    if (builderMatch) return finish(builderMatch.el, 'common', builderMatch.selector);

    // Tier 7 — PHP dumb fallback
    const phpText = cfg.contents?.[buttonId] || '';
    return { text: phpText, selectorChosen: null, tier: 'php_fallback',
             wordCount: wordCount(phpText), fingerprint: sha1(phpText),
             elapsedMs: performance.now() - t0 };

    function finish(elOrText, tier, selector = null) {
        const text = typeof elOrText === 'string' ? elOrText : readText(elOrText);
        return { text, selectorChosen: selector, tier,
                 wordCount: wordCount(text), fingerprint: sha1(text),
                 elapsedMs: performance.now() - t0 };
    }
}
```

`SCORING_CONFIDENCE_MIN = 0.55` — tuned from the existing `tta_extractor_score` target. When scoring confidence falls below `0.35`, AtlasVoiceSelector auto-opens (§4.3).

Every tier except 1, 2 and 7 triggers a `POST /tts/v1/extraction-report` with `{ post_id, tier, selector, word_count, fingerprint, elapsed_ms }` so PHP knows the current fingerprint and telemetry can track tier usage.

### 4.2 Comment-marker wrapper

**Format:**

```html
<!--atlasvoice:start:1-->
<p>…original post content, untouched by any wrapper…</p>
<p>More content.</p>
<!--atlasvoice:end:1-->
```

**Why comments:**

- Browsers preserve comments in the DOM tree as `Node.COMMENT_NODE` children. They are invisible to CSS, layout, flexbox/grid siblings, `:first-child` / `:nth-child`, screen readers, and the a11y tree.
- This is the same mechanism WordPress core uses for `<!--more-->` ([WordPress source: wp-includes/formatting.php](https://developer.wordpress.org/reference/functions/get_extended/)), block delimiters like `<!-- wp:paragraph -->`, and the Classic Editor teaser cut.
- AMP's sanitizer preserves HTML comments by spec.
- Zero backward-compat risk versus any element-based wrapper — no div, no custom element, no `display: contents` hacks.

**Emission site:** [text-to-audio-pro/Includes/TTA_Pro_Filters.php:244-270](../../text-to-audio-pro/Includes/TTA_Pro_Filters.php) — the `tts_button_with_content_callback` method. Today it writes:

```php
echo '<div class="tts_content_wrapper_' . $btn_no . '" >' . $content . '</div>';
```

After v3 (Phase 1 — dual-emit):

```php
$start = '<!--atlasvoice:start:' . intval( $btn_no ) . '-->';
$end   = '<!--atlasvoice:end:' . intval( $btn_no ) . '-->';

if ( apply_filters( 'tts_should_add_content_wrapper', true, $content, $btn_no, $post ) ) {
    // Dual-emit for one minor version: comment markers AND legacy div.
    // The legacy div is removed in Phase 4.
    echo $start;
    if ( apply_filters( 'tts_emit_legacy_wrapper', true, $btn_no, $post ) ) {
        echo '<div class="tts_content_wrapper_' . intval( $btn_no ) . '" >' . $content . '</div>';
    } else {
        echo $content;
    }
    echo $end;
} else {
    echo $content;
}
```

After v3 (Phase 4 — comments only):

```php
if ( apply_filters( 'tts_should_add_content_wrapper', true, $content, $btn_no, $post ) ) {
    echo '<!--atlasvoice:start:' . intval( $btn_no ) . '-->';
    echo $content;
    echo '<!--atlasvoice:end:' . intval( $btn_no ) . '-->';
} else {
    echo $content;
}
```

**JS walk:**

```js
function ttsWalkBetweenCommentMarkers(buttonId) {
    const startText = 'atlasvoice:start:' + String(buttonId);
    const endText   = 'atlasvoice:end:' + String(buttonId);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
    let start = null, end = null;
    while (walker.nextNode()) {
        const c = walker.currentNode;
        if (!start && c.nodeValue.trim() === startText) { start = c; continue; }
        if (start && c.nodeValue.trim() === endText)    { end = c;   break;    }
    }
    if (!start || !end) return null;

    // Collect every node strictly between start and end, walking forward in tree order.
    // The start and end comments may be siblings OR at different depths inside a common
    // ancestor (if the wrapper was wrapped by a caching plugin wrapper). We walk by
    // "following node in document order" until we hit the end comment.
    const collected = [];
    let node = start.nextSibling;
    while (node && node !== end) {
        if (!isAncestorOf(node, end)) collected.push(node);
        node = nextNodeInTreeOrder(node, end);
    }
    return buildSyntheticFragmentText(collected);
}
```

**Caching / optimiser plugins:** many minify + re-assemble HTML. We tested Autoptimize, LiteSpeed Cache, WP Rocket, W3TC, SG Optimizer — all preserve HTML comments by default. None of them strip arbitrary comments; they only strip whitespace-only comments or vendor-injected marker comments with specific patterns. `<!--tts:…-->` is safe.

**Back-compat dual-output:** the legacy `<div class="tts_content_wrapper_X">` continues to be emitted during Phase 1–3. JS tier 5 (scoring) still finds it and scores it first because it matches the `tts_content_wrapper_*` selector. Phase 4 drops the div; we keep the comment markers only.

**Deprecation timeline:**

| Phase | Version | `<!--atlasvoice:start:X-->` | `<div class="tts_content_wrapper_X">` |
|---|---|---|---|
| 1 | TBD (2.2.x) | emitted, primary tier | still emitted, matched by tier 5 scoring |
| 2 | TBD (2.3.x) | emitted, primary tier | still emitted, deprecation notice in Docs tab |
| 3 | TBD (2.4.x) | emitted, primary tier | emitted only if `tts_emit_legacy_wrapper` filter returns `true` (new default: `false`) |
| 4 | TBD (2.5.x) | emitted, only tier | removed from code |

### 4.3 AtlasVoiceSelector (visual picker)

**Product name:** "AtlasVoiceSelector" — the user-facing name for every surface (admin bar, meta box, dashboard, docs, telemetry event copy). The internal technical noun "picker" / "visual picker" is retained in code comments, file names, and developer-facing docs for shorthand. All user-visible strings use "AtlasVoiceSelector".

**Adopted baseline: SelectorGadget** ([cantino/selectorgadget](https://github.com/cantino/selectorgadget), MIT). SelectorGadget is the proven, battle-tested open-source Chrome extension that has solved "generate a minimal CSS selector by point-and-click" since 2009. Its algorithm is exactly what a non-technical user needs:

1. User clicks a target element → **green** → generate a minimal CSS selector for it.
2. Everything the selector currently matches is highlighted **yellow**.
3. Click a yellow element to **reject** it → **red** → selector narrows to exclude.
4. Click an un-highlighted element to **include** it → yellow → selector widens.
5. Iteration converges on a selector that matches exactly the wanted set.

License: MIT. We **port the core algorithm** (not vendor the Chrome extension code verbatim — it depends on the extension runtime). The port is ~400 lines of vanilla JS.

**Modifications for our plugin:**

| SelectorGadget (generic) | Our picker (content-area-specific) |
|---|---|
| Single-click to select any DOM element | Single-click optimised for "this is the article body" — one click = done for 90% of non-tech users |
| User iteratively adds/rejects until selector matches | Advanced "refine" mode hidden behind a toggle — surfaced only if scoring suggests multiple candidates |
| No bias toward any DOM region | Suppresses hover highlight on `nav, header, footer, aside, [role=navigation], [role=banner], [role=contentinfo]` — picker only offers content-like containers |
| No confidence hint | Pre-scores candidates before picker launches; the best-scoring candidate is **pre-highlighted** with a "use this" affordance. User can accept in one click, or click a different element to override |
| Always manual | Runs automatically in "silent auto-save" mode on first visit; only falls back to UI when scoring confidence is low |
| Returns whatever selector iteration produced | Post-processed through our stability filter (see algorithm below) — rejects volatile auto-IDs like `#post-12345`, `.brxe-oqhsde`, `#elementor-element-1a2b3c` |

**UX flow (simplified for non-tech users):**

1. User opens any post on the frontend while logged in as admin.
2. An **"AtlasVoiceSelector"** button appears in the admin bar.
3. Click → overlay appears. Scoring has already pre-selected the best candidate with a green outline and a floating panel titled **"AtlasVoiceSelector"**: *"This looks like your article body (~1,200 words). Use this? [Yes, save] [Pick different] [Refine]"*.
4. **Yes, save** → SelectorGadget-style stable selector computed for the green element → saved. Done.
5. **Pick different** → hover highlights content-eligible candidates in blue; click one to make it the new green candidate.
6. **Refine** (advanced) → full SelectorGadget iteration: yellow (matched), click to red (reject), click unhighlighted to widen. For technical users who want pixel-perfect selectors.
7. Save issues `POST /tts/v1/save-selector { post_type, selector, scope: 'per_cpt'|'global' }`.
8. Reload — the player now uses the saved selector.

**Entry points:**

- Admin bar: `admin_bar_menu` at priority 100 registers an **"AtlasVoiceSelector"** node when `current_user_can('manage_options')` and `!is_admin()`. Points to `?tts_picker=1#tts-picker`.
- Post edit meta box (classic): an **"Open AtlasVoiceSelector on the frontend"** link opens the single-post view in a new tab with `?tts_picker=1&post=ID` so the picker pre-scopes to this post's DOM.
- Gutenberg editor: `PluginDocumentSettingPanel` with the same link.
- Dashboard Settings tab: per-post-type row with **"Open AtlasVoiceSelector"** button that opens a recent post of that type with `?tts_picker=1&post_type=X`.

**Stable-selector algorithm** (runs in JS on the clicked element `el`):

```js
/**
 * Returns the most-stable CSS selector for `el` that resolves to exactly that element
 * (i.e. document.querySelectorAll(selector).length === 1 AND [0] === el).
 *
 * Precedence:
 *   1. #id   — if present and unique on the page
 *   2. [data-*="…"]   — stable data attributes (not auto-generated)
 *   3. Unique .class chain from el up to nearest meaningful ancestor
 *   4. nth-of-type fallback from the nearest stable ancestor
 *
 * Rejected because fragile: auto-generated IDs containing digits-only suffixes
 * (e.g. #post-12345), autogenerated Elementor IDs (`#elementor-element-*`), and
 * page-builder instance classes (e.g. `.brxe-oqhsde`).
 */
function ttsComputeStableSelector(el) {
    // 1. id
    if (el.id && !AUTO_ID_PATTERN.test(el.id)) {
        const sel = '#' + CSS.escape(el.id);
        if (document.querySelectorAll(sel).length === 1) return sel;
    }
    // 2. stable data attributes
    for (const attr of ['data-tts-target', 'data-content-area', 'data-post-content', 'itemprop']) {
        const val = el.getAttribute(attr);
        if (val) {
            const sel = `[${attr}="${CSS.escape(val)}"]`;
            if (document.querySelectorAll(sel).length === 1) return sel;
        }
    }
    // 3. unique class chain
    const uniqueClass = [...el.classList].find((c) => !AUTO_CLASS_PATTERN.test(c)
        && document.querySelectorAll('.' + CSS.escape(c)).length === 1);
    if (uniqueClass) return '.' + CSS.escape(uniqueClass);

    // 4. nth-of-type fallback from nearest stable ancestor
    return ttsBuildStructuralSelector(el);
}
```

`AUTO_ID_PATTERN = /^[a-z-]*-?\d{4,}$/i` — matches `post-12345`, `comment-98765`, `elementor-element-1a2b3c4d`.
`AUTO_CLASS_PATTERN = /^(brxe-[a-z0-9]+|e-con-\w+|elementor-element-\w+)$/`.

This mirrors SelectorGadget's and Chrome DevTools' "Copy Selector" behaviour, with our additional rejection filters for page-builder volatile IDs.

**Porting notes from SelectorGadget source:**

- Upstream files of interest: [`lib/dom.js`](https://github.com/cantino/selectorgadget/blob/master/lib/dom.js), [`lib/prediction_helper.js`](https://github.com/cantino/selectorgadget/blob/master/lib/prediction_helper.js), [`lib/interface.js`](https://github.com/cantino/selectorgadget/blob/master/lib/interface.js).
- We keep: the candidate-generation logic (combine classes, ancestor paths, tag+class combinations), the inclusion/rejection state machine, the "simplest selector that matches the positive set and excludes the negative set" search.
- We drop: the jQuery dependency (rewrite to vanilla DOM), the floating toolbar's generic UI (replaced by our Picker panel described above), the export-to-clipboard flow.
- We add: hover suppression over `nav/header/footer/aside`, pre-scored initial candidate, `ttsComputeStableSelector()` post-filter.
- License preservation: MIT header retained at the top of `src/picker/tts-picker.js`, attribution line in our docs page.

**Overlay implementation:**

- Bundle: `src/picker/tts-picker.js` → `admin/js/build/tts-picker.min.js`.
- Injected only when `?tts_picker=1` query param is present AND `current_user_can('manage_options')`.
- Pointer events: the overlay itself has `pointer-events: none`; we track `mousemove` on `document` and read `elementFromPoint(event.clientX, event.clientY)`.
- Escape key or page-background click cancels.
- Respects `prefers-reduced-motion`: highlight outline uses a solid border instead of an animated glow.

**REST save:**

```
POST /tts/v1/save-selector
Body: { post_type: 'post', selector: '.entry-content > .post__body', scope: 'per_cpt' | 'global', auto?: bool }
Auth: manage_options
Response: { ok: true, stored_at: 'global' | 'per_cpt' }
```

Storage (§4.4 below). `auto: true` is set by the first-visit auto-save; manual picker saves omit the flag.

### 4.4 Per-post-type selector storage

| Tier | Storage key | Scope | Value | Writable from |
|---|---|---|---|---|
| Global (Free default, Pro fallback) | `tta_settings_data.tta__settings_auto_selector` | option | `".entry-content"` | Settings tab, AtlasVoiceSelector "Save globally", first-visit auto-save |
| Per-post-type (Pro only) | `tta_settings_data.tta__settings_auto_selector_by_cpt` | option | `{"post":".entry-content","product":".woocommerce-Tabs-panel--description"}` | Settings tab, AtlasVoiceSelector "Save for this post type" |
| Per-post override (**existing**, Pro) | `tts_pro_custom_css_selectors` | post meta | existing shape | Per-post meta box, [TTA_Pro_Api_Routes.php:1795](../../text-to-audio-pro/Api/TTA_Pro_Api_Routes.php) |
| Per-post override flag (**existing**, Pro) | `tta__settings_use_own_css_selectors` | post meta | `0` or `1` | Per-post meta box |

**Resolution at runtime (JS):** in the exact order listed in §4.1 tiers 2→3→4.

**Migration:**

- No existing install has `tta__settings_auto_selector` or `tta__settings_auto_selector_by_cpt`. Both fields are initialised as empty strings / empty arrays on upgrade.
- First visit to any post on a post-type with no saved per-CPT or global selector runs scoring (tier 5) and, if `confidence ≥ 0.55`, auto-saves the winning selector to:
  - Free: the global key.
  - Pro: the per-CPT key for the current post's `post_type`.
- Users can always overwrite via AtlasVoiceSelector or the Settings tab.

**First-visit auto-save gate:** the JS engine issues `POST /tts/v1/save-selector` only when the server-issued `cfg.canSaveAutoSelector === true`. PHP sets that flag only when:

- `current_user_can('manage_options')` AND
- no saved selector exists at the relevant scope AND
- a 24-hour transient `tta_first_visit_lock_{post_type}` is not held (prevents concurrent writes from multiple tabs).

After the save, PHP sets the lock transient and refreshes the page-level config. No user prompt, no banner — the user sees nothing unless confidence is low.

**Low-confidence path:** when scoring returns `confidence < 0.35`, the first-visit flow *does not* auto-save. Instead, if the user is an admin, a dismissable toast appears: *"AtlasVoice isn't sure which part of this page is the article. [Open AtlasVoiceSelector] [Configure later]"*. The **[Open AtlasVoiceSelector]** link is the admin-bar entry point.

### 4.5 Scoring + button-parent traversal

Candidates are gathered from:

1. `document.querySelectorAll` over every selector string in `BUILDER_BODY_SELECTORS` flattened.
2. The button's ancestor chain — walk up from `tts-play-button[data-id="X"]` or `.tts__listent_content[data-id="X"]` until `<body>`, adding each ancestor to the candidate set.
3. Top-level children of `<main>`, `[role=main]`, `#primary`, `#content`, `#main`.

Duplicates are deduped by identity.

**Scoring formula** (ported from v2's Layer-A scoring but running in JS, against the already-rendered DOM):

```js
/**
 * Let T = trim(el.innerText).length,  E = el.querySelectorAll('*').length,
 *     L = sum(a.innerText.length for a in el.querySelectorAll('a')),
 *     LR = L / max(T, 1).
 */
function scoreCandidate(el) {
    const text = (el.innerText || '').trim();
    const T = text.length;
    if (T < 80) return 0;
    if (el.closest(EXCLUDE_ANCESTORS)) return 0;

    const E = el.querySelectorAll('*').length;
    const links = el.querySelectorAll('a');
    const L = [...links].reduce((s, a) => s + (a.innerText || '').length, 0);
    const LR = T ? L / T : 1;
    const density = T / (E + 1);
    let s = T * density;

    if (LR > 0.5)                         s *= 0.3;  // nav-ish
    if (matchesBuilderKnown(el))          s *= 2.0;  // Elementor/Divi/etc.
    if (el.matches('[itemprop=articleBody]')) s *= 1.5;
    if (/(^|\s)entry-content(\s|$)/.test(el.className)) s *= 1.5;
    return s;
}

const EXCLUDE_ANCESTORS =
    'nav,header,footer,aside,' +
    '[role=navigation],[role=banner],[role=contentinfo],' +
    '.menu,.sidebar,.widget,.comments-area,' +
    '.social-share,.related-posts,.yarpp-related,' +
    '.woocommerce-tabs .woocommerce-Tabs-panel--additional_information'; // skip attribute tab
```

Confidence = `winner_score / (winner_score + second_score)` clamped to `[0, 1]`. Tiers:

- `≥ 0.65` → confident; save silently on first visit.
- `0.35 ≤ c < 0.65` → usable; save with `auto=true` flag (§4.4).
- `< 0.35` → low; offer AtlasVoiceSelector toast.

**`BUILDER_BODY_SELECTORS` (expanded v3):**

```js
const BUILDER_BODY_SELECTORS = {
    // Page builders
    beaver:     '.fl-post-content, article .fl-rich-text',
    elementor:  '.elementor-widget-theme-post-content .elementor-widget-container, ' +
                '[data-elementor-type="single-post"] .elementor-widget-container',
    divi:       '.et_pb_post_content, .et-l--body .et_pb_text_inner',
    wpbakery:   'article .wpb_wrapper, .vc_row .wpb_text_column',
    oxygen:     '#main-content, [data-id="main_content"]',
    bricks:     '.brxe-post-content, [data-builder-type="bricks-single-post"]',
    avada:      'article .post-content, .fusion-text',
    fse:        '.wp-block-post-content',
    generic:    '.entry-content, [itemprop=articleBody], .post-content, .article-content',

    // Commerce
    woocommerce: '.woocommerce-Tabs-panel--description, ' +
                 '.woocommerce-product-details__short-description, ' +
                 '.product .summary',

    // LMS
    learndash:   '.learndash-wrapper .ld-tabs-content, ' +
                 '.ld-item-content, .ld-lesson-content, .ld-topic-content',
    tutorlms:    '.tutor-course-content, .tutor-lesson-content, ' +
                 '.tutor-quiz-content, .tutor-single-course-content',
    lifterlms:   '.llms-lesson-content, .llms-course-description, .llms-quiz-wrapper',
    memberpress: '.mepr-single-course-content, .mepr-page-content',
    buddyboss:   '.bb-lms-content, .bb-course-content',
};
```

Filterable: `wp.hooks.applyFilters('ttsBuilderBodySelectors', BUILDER_BODY_SELECTORS, { postType })`.

### 4.6 Gutenberg block-level opt-out (`data-tts-audio="false"`)

Carried over from v2; adapted to the JS-only model.

**Block editor plugin:** `src/block-editor/tts-block-opt-out.js` → `admin/js/build/tts-block-opt-out.min.js`. Registered for every block type via `blocks.registerBlockType` filter. Adds:

1. A `ttsAudio` boolean attribute (default `true`).
2. An `InspectorControls` toggle labelled *"Read this block in AtlasVoice audio"*.
3. A `blocks.getSaveElement` filter that emits `data-tts-audio="false"` on the block's save element when `attrs.ttsAudio === false` — implemented via `useBlockProps.save()` in dynamic blocks, and via the filter for static ones.

```js
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';

addFilter('blocks.registerBlockType', 'tta/add-tts-audio-attr', (settings) => ({
    ...settings,
    attributes: { ...settings.attributes, ttsAudio: { type: 'boolean', default: true } },
}));

const withToggle = createHigherOrderComponent((BlockEdit) => (props) => (
    <>
        <BlockEdit {...props} />
        <InspectorControls>
            <PanelBody title={__('AtlasVoice', 'text-to-audio')} initialOpen={false}>
                <ToggleControl
                    label={__('Read this block aloud', 'text-to-audio')}
                    checked={props.attributes.ttsAudio !== false}
                    onChange={(v) => props.setAttributes({ ttsAudio: v })}
                    help={__('Turn off to skip this block when generating speech.', 'text-to-audio')}
                />
            </PanelBody>
        </InspectorControls>
    </>
), 'withTtsAudioToggle');

addFilter('editor.BlockEdit', 'tta/add-toggle', withToggle);

addFilter('blocks.getSaveContent.extraProps',
    'tta/emit-data-attr',
    (extra, blockType, attrs) => (attrs.ttsAudio === false
        ? { ...extra, 'data-tts-audio': 'false' }
        : extra));
```

**JS engine skip logic:** during text collection from the chosen container, any descendant with `[data-tts-audio="false"]` is dropped:

```js
function readText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('[data-tts-audio="false"]').forEach((n) => n.remove());
    clone.querySelectorAll('script,style,figure,figcaption,iframe,video,audio,object,embed,canvas,svg')
         .forEach((n) => n.remove());
    return (clone.innerText || '').trim();
}
```

**Classic editor / page builders:** the meta-box (Gutenberg-only) approach is insufficient when the site uses Classic or a builder. Opt-out in those environments is handled by exclude CSS selectors (existing mechanism — `tta__settings_exclude_content_by_css_selectors`) plus AtlasVoiceSelector's eventual per-page dark-list (future work, §21).

### 4.7 PHP dumb fallback

Remains **unchanged** from today's code at [helpers.php:189-263](../includes/helpers.php). Specifically:

- `get_the_content(null, false, $post)` — raw post content. Yes, this misses builder output; yes, that is fine because JS tiers 1–6 will almost always succeed on builder sites.
- `tta_clean_content()` — strips tags, normalises entities, handles RTL / UTF-8.
- Title + excerpt concatenation.
- ACF / compatible-plugin content append (only when user has opted in — §7).
- Intro / outro concatenation for free users and for player_id 1.

The only new wiring is at [helpers.php:232-234](../includes/helpers.php) — after building `$description`, we also call:

```php
$fingerprint = TTA_Helper::compute_content_fingerprint( $post->ID, $content, $settings );
// stash for window.TTS.contents_fingerprint
```

(See §6.)

**When is the PHP fallback actually read?** Only when the JS engine's tier 1–6 all fail — rare. On Beaver, Elementor, Divi, etc., tier 1 (comment markers) will succeed whenever the button was rendered via the `tts_button_with_content` filter path, which is the default auto-button mode. Shortcode-only mode without the wrapper call site will fall through to tier 5 scoring — which usually succeeds. Tier 7 is the floor, not the ceiling.

### 4.8 JS filter surface (`@wordpress/hooks`)

Minimal — four hooks, all filterable from either free or pro:

| Hook | Type | Args | Purpose |
|---|---|---|---|
| `ttsResolveSelector` | filter | `(selector, { buttonId, postType, tier })` | Developer override of the chosen selector before extraction runs. Return a new selector string or `false` to skip the tier. |
| `ttsBeforeExtract` | filter | `(el, { buttonId, tier })` | Mutate the cloned DOM element before text is read. Typical use: remove a custom widget. |
| `ttsAfterExtract` | filter | `(text, { buttonId, tier, selector })` | Mutate the extracted text string. Typical use: replace pronunciation aliases. |
| `ttsBuilderBodySelectors` | filter | `(map, { postType })` | Per-post-type extension of the builder/LMS selector map. |

Documented in `plan/docs-content-extraction-guide.md` and in the Docs tab bundle.

---

## 5. MP3 regeneration policy

**Scope clarification (v4):** this section is **Pro-only**. Free uses the browser `speechSynthesis` API at listen time and has no MP3 cache; regeneration as a concept does not apply. Every key in this section is read only when `TTA_Helper::is_pro_active()` returns true.

Carried over from v2 with one adjustment: the fingerprint source is now the **JS-reported extracted text**, not a PHP-side DOMDocument result.

New setting `tta__settings_mp3_regeneration_mode`:

| Value | Default for | Behaviour |
|---|---|---|
| `manual` | Existing installs | Fingerprint stored, never auto-deletes. Dashboard shows a "Stale audio (N)" badge and per-post "Regenerate" action. |
| `auto` | Fresh installs | On `save_post` / `rest_after_insert_{type}` / `edit_attachment`, if stored fingerprint differs, queue MP3 delete. Next frontend visit regenerates. |
| `ask` | — | Editor JS confirm on publish/update: *"Post content changed. Regenerate audio for this post? [Yes] [No]"*. |

### 5.1 Fingerprint source (v3 change)

The PHP side can no longer compute a body fingerprint because it no longer parses HTML. Instead:

1. On every JS extraction, the engine reports `{ post_id, fingerprint }` to `POST /tts/v1/extraction-report`.
2. PHP stores the reported fingerprint in `_tta_content_fingerprint` post meta, along with a timestamp and the selector that was used.
3. On `save_post`, PHP computes a **settings fingerprint** (includes, excludes, intro/outro, builder selectors, language) and combines it with the last-known JS body fingerprint to get the regeneration fingerprint.
4. If that combined fingerprint differs from `_tta_last_mp3_fingerprint[player_id]`, the `auto` mode queues a regen.

This inverts v2: in v2, the PHP extractor produced the fingerprint at save-time. In v3, the fingerprint is eventually-consistent — PHP updates it whenever a frontend client visits the post and reports back. On first save of a brand-new post, PHP has no fingerprint yet, so `auto` mode queues a pre-regen on first visit instead of on save.

Trade-off accepted: in `auto` mode a brand-new post whose content JS hasn't inspected yet will regenerate on first listener visit rather than on save. This is acceptable because MP3 generation is already lazy on first listen, and the feature is opt-in for existing users.

### 5.2 Hook points

| WordPress action | Fingerprint recompute | Regeneration trigger |
|---|---|---|
| `save_post_{post_type}` (priority 20) | ✔ (settings portion) | `auto`: if combined differs, delete stale MP3. `ask`: show modal. |
| `rest_after_insert_{type}` | ✔ | Same. REST save path. |
| `edited_post_meta` for ACF-registered keys | ✔ | Same. |
| Bulk Edit / Quick Edit | ✔ (batched) | Always `auto` (cannot prompt). |
| `POST /tts/v1/extraction-report` | ✔ (body portion) | Passive — updates stored body fingerprint. |

### 5.3 Storage keys

| Key | Scope | Value |
|---|---|---|
| `_tta_content_fingerprint` | post meta | JSON `{ body, settings, combined, updated_at, selector, tier }` |
| `_tta_last_mp3_fingerprint` | post meta | JSON `{ "3": "…", "4": "…" }` — per player_id |
| `_tta_force_regen` | post meta | One-shot boolean consumed on next extraction report. |
| `tta_regen_queue` | option | Array of post IDs with stale audio in `manual` mode. |

### 5.4 Editor parity

- Gutenberg autosave fires `rest_after_insert_*` with `post_status=auto-draft`. Guard: skip regeneration for non-published statuses.
- Classic `save_post` fires twice (autosave + save). `static` guard dedupes per-request.
- Bulk / Quick Edit: always `auto` — no per-post modal surface.
- `ask` mode only shows modal when `get_current_screen()->base === 'post'` and combined fingerprint changed.

### 5.5 Content-hash short-circuit (v4)

Even in `auto` mode, v4 does **not** immediately call "regen" when the combined fingerprint changes. It first compares `md5(current_extracted_text)` against the stored `_tta_extracted_text_hash`:

```
on settings change that flips combined fingerprint:
    new_hash = md5(run_extractor_on_stored_sample_or_queued_visitor_load())
    if new_hash == post_meta('_tta_extracted_text_hash'):
        // output text is identical — MP3 is still valid
        update post_meta('_tta_last_mp3_fingerprint', new combined)   // resync
        skip regen
    else:
        mark post as dirty (not delete yet — see §5.6)
```

Typical short-circuit cases:
- User toggles "Add post excerpt" on a post whose excerpt is empty.
- User adds a CSS exclusion that doesn't match any element in this post.
- User adds a text pattern to the "Exclude Texts" list that doesn't appear in this post.
- User adds an include selector that matches the same body the scorer would have auto-picked.

In each case, the extracted text is byte-identical and the existing MP3 is still the correct output. Skipping regen saves the per-character API cost of whichever voice provider is configured (ChatGPT TTS, ElevenLabs, Google Cloud TTS, gTTS-Pro).

### 5.6 Lazy visitor-load invalidation (v4)

When the hash *does* change, v4 **does not** immediately delete all affected MP3s. It marks the post dirty and defers the delete+regen until a real visitor loads the post:

```
settings change detected on save (admin):
    for each affected_post:
        post_meta('_tta_regen_dirty', true)
        // NO file deletion here

template_redirect on frontend visit:
    if post_meta('_tta_regen_dirty') && is_singular():
        on atlasvoice_pre_listen action (fires when listener actually clicks Play):
            delete_stale_mp3(post_id, player_id)
            queue regen (existing path)
            delete post_meta('_tta_regen_dirty')
```

**Why lazy:** a 500-post site that changes its "Exclude Content By CSS Selectors" setting should not pay 500× regen cost upfront. The bill should scale with actual listener demand. Posts no one listens to never cost anything.

**Bulk MP3 interaction:** the admin's "Bulk MP3" generator treats `_tta_regen_dirty = true` the same as "never generated" — it regenerates during the bulk run. So admins who want to pre-warm the cache after a settings change can click Bulk MP3 once; admins who prefer pay-per-play can skip it entirely.

**Free users:** `_tta_regen_dirty` is never written because Free does not generate MP3s. The entire lazy-invalidation path is a Pro code branch.

---

## 6. Content-hash fingerprint

### 6.1 Algorithm

```
body_hash     = sha1( js_reported_extracted_text )
settings_hash = sha1( json_encode([
    'include'    => tta__settings_css_selectors,
    'exclude'    => tta__settings_exclude_content_by_css_selectors,
    'tags'       => tta__settings_exclude_tags,
    'texts'      => tta__settings_exclude_texts,
    'before'     => tta__settings_text_before_content,
    'after'      => tta__settings_text_after_content,
    'auto_sel'   => tta__settings_auto_selector,
    'per_cpt'    => tta__settings_auto_selector_by_cpt,
    'lang'       => current_language(),
    'custom_f'   => opted_in_custom_field_keys,
    'block_opts' => block_optout_signature_per_post,
]) )
combined      = sha1( body_hash . '|' . settings_hash )
```

Algorithm selection: prefer `hash('xxh3', $input)` when available (PHP 8.1+ with xxhash enabled); fall back to `sha1()` otherwise. Algorithm name stored alongside so collisions across algorithm versions are prevented.

### 6.2 Exposure to JS

```js
window.TTS.contents_fingerprint = { "1": "a1b2c3…", "2": "d4e5f6…" };
window.TTS.contents             = { "1": "Title.\n\nBody…" };          // PHP fallback
window.TTS.autoSelector         = ".entry-content";                    // tier 4
window.TTS.autoSelectorByCpt    = { "post": ".entry-content", "product": "…" };
window.TTS.perPost              = { "1": { selector: ".foo" } };
window.TTS.canSaveAutoSelector  = true;
window.TTS.postType             = "post";
```

### 6.3 Bulk MP3 skip-unchanged

`src/dashboard/bulk-mp3-file-ui.js` gains a "Skip unchanged posts" filter (default on). The generator reads `_tta_content_fingerprint.combined` and `_tta_last_mp3_fingerprint[player_id]`; if equal, skip. Telemetry event `bulk_mp3_skipped` fires per skip.

For posts that have never been extracted (no `_tta_content_fingerprint`), Bulk MP3 falls back to the legacy "always regenerate" path for that post — one-time cost, cleared on next listener visit.

---

## 7. CPT / custom-field plugin handling (opt-in only)

v3 re-scopes this path. In v2 it was always-on: selected ACF fields appended to body text. In v3, the **default is OFF** because the user's stated constraint is *"never read anything not on the UI, except intro and outro."* Most custom fields ARE already in the rendered DOM (ACF the-content shortcode, Elementor dynamic tags, template partials). JS tiers 1–6 already read them.

**When is custom-field append needed?** Only for fields:

1. That the site's theme/template does not render into the DOM at all.
2. That the user wants to be read anyway (private metadata, author bio fields kept admin-only, lesson prerequisites, etc.).

This is the "hidden-field" case. It's rare. Users who want it have to opt into each field explicitly.

### 7.1 UI

Compatibility tab (existing) gets:

- A header text: *"Custom fields are read only when you explicitly select them below. AtlasVoice already reads everything visible on your page — select fields here only for hidden metadata you want spoken aloud."*
- A per-plugin section (ACF, Meta Box, Pods, JetEngine, Toolset, Carbon Fields, SCF, CPT UI).
- For each enabled section, a list of fields the plugin knows about, with a checkbox.
- Drag-sort ordering within and across plugins (new: `tta_compatible_data.tts_field_order`).

### 7.2 Readers

Each reader is a static method on a new class `TTA\TTA_Custom_Field_Reader`, registered via `tts_compatible_plugins_content` at priority 20. (ACF pro callback already runs at 99 in [TTA_Pro_Helper.php:1287](../../text-to-audio-pro/Includes/TTA_Pro_Helper.php).)

Readers (all gated by `function_exists` / `class_exists`):

- **ACF / ACF Pro** — `get_field_objects($post_id)`. Whitelist of readable types: the existing [`TTA_Pro_Helper::$acf_text_field_types` at line 1271](../../text-to-audio-pro/Includes/TTA_Pro_Helper.php) promoted to free. Recursion into repeater / flex_content / group / clone via `array_walk_recursive`. Captions for image/gallery/file. Relationship / post_object / taxonomy skipped by default.
- **Meta Box** — `rwmb_get_registry('field')->get_by_object_type('post')` + `rwmb_get_value`. See spec in v2 §7.3 — unchanged.
- **Pods** — `pods($type, $id)->display($slug)`.
- **JetEngine** — `jet_engine()->meta_boxes->get_meta_boxes_for('post', $post_type)` + `get_post_meta`.
- **Toolset Types** — `types_render_field($slug, [...])`.
- **Carbon Fields** — `carbon_get_post_meta($post_id, $slug)`.
- **SCF** — shares ACF API, same reader falls through.
- **WooCommerce** — `product->get_description()` + `product->get_short_description()` + attribute text. Skipped by default because the WooCommerce selector in `BUILDER_BODY_SELECTORS` already captures this from the DOM.
- **LearnDash / TutorLMS / LifterLMS / MemberPress** — lesson/course content. Same rationale as WooCommerce: usually already rendered; opt-in covers hidden metadata (prerequisites, drip-feed notes).

### 7.3 Substring dedup (F14 guard)

Before appending any custom-field value to the PHP fallback string, the reader compares against the JS-reported extracted text (when available, via `_tta_content_fingerprint.body_sample` — a stored 512-byte sample of the last-known body). If the field's first 80 chars appear inside the body sample, the field is skipped with diagnostic `{ cpt_already_in_body: field_name }`.

This ensures that even when users over-select fields, we don't double-read.

### 7.4 Ordering

`tta_compatible_data.tts_field_order = [ 'acf/subtitle', 'mb/author_bio', 'acf/pull_quote', 'pods/summary' ]`. Compatibility tab drag-sorts it.

### 7.5 JS side

The JS engine itself does **not** call custom-field readers. Custom-field content lives only in `window.TTS.contents[buttonId]` (the PHP string) and is used only if:

- JS engine tier 7 (PHP fallback) fires, OR
- Pro's player concatenates intro + extracted body + custom fields + outro explicitly via `window.TTS.extra[buttonId].compatible_contents` (existing Pro behaviour, unchanged).

---

## 8. Diagnostics UX

### 8.1 Preview audio text

Free (basic): meta-box button "Preview audio text". Opens a modal showing the final text the player will read, word count, and which tier / selector was used. Rendered via `POST /tts/v1/preview-text`.

Pro (enhanced): same modal, additionally shows `alternatives[]` (top-3 candidates from scoring), `suggested_exclusions[]` (selectors whose `innerText` was disproportionately long / link-heavy), and `language_detected`.

### 8.2 Diagnose URL (Pro)

Meta-box and Settings tab button "Diagnose URL". User pastes a URL from the same origin; Pro calls `POST /tts/v1/diagnose`. Server fetches the URL via `wp_remote_get` (SSRF-guarded — host must match `home_url()` host), injects a marker comment into the response HTML, and returns the rendered HTML. Pro opens the URL in an `<iframe sandbox>` inside the modal, runs the JS engine inside the iframe, and reports the tier outcome back.

### 8.3 Dry-run preview diff

**Mandatory** before flipping any user from "current extraction" to "new extraction" (comment markers + scoring + picker). The user clicks "Try smart extraction" in the dashboard banner; modal opens → calls `POST /tts/v1/dry-run-scan { post_types, batch, per_batch }`.

Server iterates posts, renders each twice:

1. **Old path** — emulate the pre-v3 JS engine: `tts_content_wrapper_X` → `COMMON_CONTENT_SELECTORS` → `window.TTS.contents`.
2. **New path** — simulate tier 1 (comment markers present) → scoring → `BUILDER_BODY_SELECTORS`.

For each post, returns `{ id, title, old_wc, new_wc, old_fp, new_fp, changed }`. Client paginates until `done: true`, shows summary + per-post side-by-side diff. Pro shows estimated cloud-voice cost delta.

Rejection path leaves the flag OFF; no MP3s regenerate.

### 8.4 Inline help text

Implemented per TTS-future §4.1 — three React files:

- `src/dashboard/components/dashboard/settings/Settings.js` — global CSS selector + new per-CPT picker rows.
- `src/dashboard/css-selectors/CSSSelectorsForPosts.js` — per-post.
- `src/dashboard/components/dashboard/compatibility/Compatibility.js` — custom fields.

New helper text for the auto-selector / per-CPT fields:

> *"AtlasVoice detects your site's content area automatically. Use this field only if you want to pin a specific CSS selector for this post type. Or click [Pick visually] to point-and-click the area on your site."*

### 8.5 Docs page

`src/dashboard/components/dashboard/docs/Docs.js` gains a new section "How content extraction works" covering:

- The 7-tier resolution order.
- The comment-marker wrapper and why it's invisible.
- The AtlasVoiceSelector workflow.
- Per-CPT selectors (Pro).
- Custom-field opt-in semantics.
- Troubleshooting: "player reads only the title" → scoring confidence low → open AtlasVoiceSelector.

**v4 addition — "When the player reads the wrong thing" troubleshooting tree.** Mirrors §11.1 exactly. Six guided flows, each with screenshots and a one-line "try this first" action:

1. *"My saved selector worked yesterday but doesn't now"* → explain self-heal badge + how to revert a bad heal.
2. *"The player misses content that appears after the page loads"* → explain `data-atlasvoice-wait-for` opt-in; show where to add it (theme template / functions.php snippet).
3. *"Logged-in users hear something different"* → explain MP3 variant keying; show the post-edit radio.
4. *"I changed the selector but listeners hear the old content"* → cache purge: deep-links to LiteSpeed / WP Rocket / W3TC / SG Optimizer + manual steps.
5. *"The player misses text inside tabs or accordions"* → explain why clones work, what to do if theme strips `display:none` text via JS.
6. *"My Spanish / French / etc. posts extract wrongly"* → explain per-language keying; show the "Pick for Spanish" CTA.

Each flow is also linked from the exact in-UI surface that detects the symptom (§11.1 last column), so users don't have to hunt for it.

---

## 9. Free vs Pro split (locked)

| Feature | Free | Pro | Notes |
|---|:-:|:-:|---|
| **v4 Layer 1 — Opt-in toggle** | ✅ | ✅ | `tta__settings_use_atlasvoice_extractor`. When OFF legacy is untouched. |
| **v4 Layer 2 — Staging / Production mode** | — | ✅ | `tta__settings_atlasvoice_mode`. Free stays in staging semantics implicitly. |
| **v4 Layer 3 — Rules (scoped)** | ✅ global only | ✅ global + per-CPT + per-post | Free = 1 entry; Pro = N entries, most-specific wins. |
| **v4 Picker wizard (scope → include → exclude → refine)** | ✅ 2 steps | ✅ 4 steps | Free locked to "this post only" scope + 1 include; Pro gets full wizard with tag/text chips and listen sample. |
| JS extraction engine (tiers 1-6) | ✅ | ✅ | Same code path both tiers. |
| Comment-marker wrapper (`<!--atlasvoice:start:X-->`) | ✅ | ✅ | |
| Legacy `<div class="tts_content_wrapper_X">` dual-emit (Phases 1-3) | ✅ | ✅ | Removed in Phase 4. |
| PHP dumb fallback (`window.TTS.contents[X]`) | ✅ | ✅ | |
| `BUILDER_BODY_SELECTORS` map (15 builders + commerce + LMS) | ✅ | ✅ | |
| Global auto-selector storage | ✅ | ✅ | Free uses this as only storage; Pro as fallback. |
| Per-post-type selector storage | — | ✅ | Pro-only new storage key. |
| Per-post override (existing) | — | ✅ | Existing `tts_pro_custom_css_selectors` + flag. |
| AtlasVoiceSelector (admin-bar + meta box) | ✅ | ✅ | Same bundle both tiers. |
| First-visit auto-save | ✅ | ✅ | |
| Gutenberg block-level opt-out | ✅ | ✅ | |
| Preview audio text (basic) | ✅ | — | |
| Preview audio text (alternatives + suggested excludes) | — | ✅ | |
| Diagnose URL | — | ✅ | Same-origin, manage_options. |
| Dry-run preview diff | ✅ | ✅ | |
| MP3 regeneration modes (manual / auto / ask) | — | ✅ | Free uses browser `speechSynthesis` — no MP3 to regenerate. |
| Content fingerprint | ✅ (extractor hash only) | ✅ (full) | Free stores extracted-text hash for dry-run diff; Pro uses it for MP3 short-circuit. |
| Content-hash short-circuit (v4) | — | ✅ | Skips regen when extracted text is byte-identical. Pro-only cost optimization. |
| Lazy visitor-load MP3 invalidation (v4) | — | ✅ | Dirty-flag now, delete+regen on first listen. Pro-only. |
| Bulk MP3 skip-unchanged | — | ✅ | Free has no Bulk MP3 surface. |
| Custom-field readers (opt-in) | ✅ hook + ACF UI | ✅ full UI | |
| Auto-suggest selectors | — | ✅ | Surfaces scoring alternatives. |
| Inline help text | ✅ basic | ✅ extended | |
| Docs page | ✅ | ✅ | Same docs both tiers. |
| Multi-language (WPML/Polylang/TranslatePress/GTranslate) | ✅ partial | ✅ | Free benefits because JS reads the translated DOM. |
| Multiple players (id ≥ 2) | — | ✅ | Unchanged. |

### 9.1 Why this split is fair

1. Free finally reads the right content with zero config (scoring + first-visit auto-save).
2. Free gets AtlasVoiceSelector — the non-tech-user unlock.
3. Pro gets per-CPT storage, Diagnose URL, enhanced preview, per-post override — the admin/diagnostic layer that justifies upgrade.
4. No existing customer loses a feature. Smart extraction is opt-in for upgrades via dry-run.

---

## 10. Backward compatibility & migration

### 10.1 Settings keys — none renamed, several added

| Key | Location | Change in v3 |
|---|---|---|
| `tta_settings_data.tta__settings_css_selectors` | option | Unchanged. Still honoured by JS engine as a global include selector (applied inside the chosen container). |
| `tta_settings_data.tta__settings_exclude_content_by_css_selectors` | option | Unchanged. |
| `tta_settings_data.tta__settings_exclude_tags` | option | Unchanged. |
| `tta_settings_data.tta__settings_exclude_texts` | option | Unchanged. |
| `tta_settings_data.tta__settings_read_content_from_dom` | option | Unchanged. |
| `tta_settings_data.tta__settings_text_before_content` / `_after_content` | option | Unchanged. |
| `tta_settings_data.tta__settings_add_post_title_to_read` | option | Unchanged. |
| `tta_settings_data.tta__settings_add_post_excerpt_to_read` | option | Unchanged. |
| `tta_settings_data.tta__settings_allow_listening_for_post_types` | option | Unchanged. |
| `tta_compatible_data.tts_acf_fields` | option | Unchanged. |
| `tta_compatible_data.tts_acf_custom_order` | option | Unchanged. |
| `tts_pro_custom_css_selectors` | post meta | Unchanged (Pro). |
| `tta__settings_use_own_css_selectors` | post meta | Unchanged (Pro). |
| **NEW** `tta_settings_data.tta__settings_auto_selector` | option | Global auto-detected selector. Free default. Empty on upgrade; populated by first-visit auto-save. |
| **NEW** `tta_settings_data.tta__settings_auto_selector_by_cpt` | option | Pro only. `{ post_type → selector }` map. |
| **NEW** `tta_settings_data.tta__settings_mp3_regeneration_mode` | option | `manual` for upgrade, `auto` for fresh. |
| **NEW** `tta_settings_data.tta__settings_new_extraction_opt_in` | option | Boolean. `true` for fresh installs; `false` for upgrades until user completes dry-run. Gates tier 5 scoring — upgrading users fall through directly to tier 7 (PHP) until they opt in. |
| **NEW** `tta_compatible_data.tts_field_order` | option | Cross-plugin ordered array. |
| **NEW** `_tta_content_fingerprint` | post meta | JSON `{ body, settings, combined, … }`. |
| **NEW** `_tta_last_mp3_fingerprint` | post meta | JSON per player_id. |
| **NEW** `_tta_force_regen` | post meta | One-shot flag. |

### 10.2 Legacy path preservation

For users who never opt in:

- Comment markers are emitted (Phase 1) alongside the legacy div. JS engine tier 1 picks the markers; tier 5 scoring is **not** run (gated by `tta__settings_new_extraction_opt_in`). Extraction outcome is identical to pre-v3 for the common case, because the comment markers surround exactly the same content that the legacy div surrounded.
- Edge cases where tier 1 finds markers but the old wrapper div path would have found something else (e.g. a broad include selector across multiple DOM regions) are caught by the dry-run diff — the user sees them before flipping the opt-in flag.

One-click rollback: toggle `tta__settings_new_extraction_opt_in` OFF. All MP3s preserved, no regen queued.

### 10.3 Legacy wrapper div timeline

| Phase | Version | `<!--atlasvoice:start:X-->` | `<div class="tts_content_wrapper_X">` |
|---|---|---|---|
| 1 | 2.2.x | emitted | emitted |
| 2 | 2.3.x | emitted | emitted, deprecation notice in Docs |
| 3 | 2.4.x | emitted | emitted only if `tts_emit_legacy_wrapper` returns `true` |
| 4 | 2.5.x | emitted | removed |

### 10.4 Cross-version skew

| Free | Pro | Behaviour |
|---|---|---|
| 2.1.17 | 2.1.17 | Current — unchanged. |
| 2.2.x (JS engine, opt-out default) | 2.1.17 | Free JS engine runs tier 1 (comment markers present) → tier 7 (PHP fallback). Pro side sees same `window.TTS.contents` string as before. Safe. |
| 2.2.x (opt-in ON) | 2.1.17 | Free JS runs full tier 1-7. Pro's own `getContentsFromDom` still runs and re-applies its include/exclude logic on top — acceptable because both paths start from the same DOM. |
| 2.1.17 | 2.2.x | Pro JS gains `findBestContentContainer` hardening; free side is legacy. `window.TTS.contents` is legacy PHP string — still a strict improvement over prior JS path. |
| 2.2.x | 2.2.x | Full new pipeline. |

### 10.5 Freemius gating audit

No new Free feature hidden behind Freemius premium checks. Pro features gated via `TTA_Helper::is_pro_active()` only.

---

## 11. Edge cases & environments

| Environment | Behaviour |
|---|---|
| **AMP (canonical + reader)** | AMP sanitizer preserves HTML comments by spec. Tier 1 still works. Reader mode disables non-AMP JS; free falls through to tier 7 (PHP). |
| **Headless / WPGraphQL** | JS engine only runs in a browser DOM. Headless clients call `POST /tts/v1/preview-text` and get the PHP-fallback text. GraphQL resolver is future work. |
| **Multisite** | Options are per-site. Per-CPT storage is per-site, per-CPT. |
| **Password-protected / private posts** | `post_password_required()` → JS engine skipped; PHP returns excerpt only + "content protected" label (filterable). |
| **Polylang** | JS reads translated DOM. PHP fallback uses `pll_current_language()`. |
| **WPML** | Same — translated DOM, PHP uses `wpml_current_language`. |
| **TranslatePress** | Server-side translations run inside `the_content` → the rendered DOM is already translated. |
| **GTranslate (cookie)** | Client-side translation — JS engine sees translated text. Biggest v3 win: previous PHP-only extraction could not see GTranslate output; now it's automatic. |
| **Custom Post Types (WooCommerce, LearnDash, Tribe, LifterLMS, MemberPress)** | Covered by existing `tta__settings_allow_listening_for_post_types` + per-CPT selector storage. `BUILDER_BODY_SELECTORS` has dedicated entries. |
| **Embedded `<iframe>` / `<video>` / `<audio>`** | Default exclude tag list extended to include `iframe, video, audio, object, embed, canvas, svg` (filterable via `ttsBeforeExtract`). |
| **UTF-8 / emoji / RTL** | JS reads `innerText` (already decoded). Sent to TTS backends via existing pipeline. |
| **Infinite-scroll / lazy DOM** | Tier 1 walks from comment start to comment end at extraction-start time. If content hasn't loaded yet, we retry after a 250ms idle window, bounded by 1.5s total. |
| **Single-page app theme** | `ttsExtractContent` is re-runnable; the Pro player re-extracts on `popstate` / custom route-change events. |

### 11.1 The "six hard cases" — self-heal + in-UI guidance (v4)

Six situations were called out as the realistic residual ticket surface even after zero-click auto-detection. Each is mitigated by a combination of **runtime self-healing** (§0.7) and **in-UI guidance** surfaced at the exact spot the user hits the symptom — never in a separate docs page they'd have to find.

| # | Case | Automatic mitigation | In-UI guidance surface | Where guidance lives |
|---|---|---|---|---|
| 1 | **Theme/builder DOM change** — saved `.fl-builder-content-1234` stops matching after Beaver Builder rebuilds. | Self-healing selector (§0.8) re-scores silently on first match-failure. Dashboard badge lists healed posts for one-click revert. | On the **Settings → AtlasVoice** panel: green/orange status pill *"Selector status: Healthy / Auto-healed N posts last 7 days — [Review]"*. On post-edit meta box: *"Selector last verified: Apr 18. [Re-verify now]"* button. | §8.4 inline help + badge in `AtlasVoiceSettings.js` + meta-box row (PR-C). |
| 2 | **AJAX-loaded content** — reviews, comments, related posts appear after initial DOM. | Engine retries extraction once after a 250ms idle window (bounded 1.5s total). For persistently-late content, a `data-atlasvoice-wait-for="selector"` opt-in attribute on the container tells the engine to observe for mutations up to 3s. | When scoring confidence is borderline AND `IntersectionObserver` detects mutations inside the picked container post-extraction, toast: *"Some content loads after the page — listen sample may be incomplete. [Learn how to fix]"*. Link opens a modal, not an external docs page. | New `src/dashboard/components/dashboard/docs/guidance-ajax.js` inline modal (PR-C). |
| 3 | **Logged-in vs logged-out DOM** — members-only sections, price visibility, hidden fields. | Extractor runs once per cache bucket (logged-out/logged-in). MP3s are keyed by the same buckets via a new `_tta_mp3_variant` post meta when logged-in-only content is detected in the picked container. | Post-edit meta box row: *"Logged-in users see extra content on this post. Read: [logged-out version] (default) / [logged-in version] / [both separately]."* Radio, saved per post. | Meta-box row + guidance tooltip (PR-C). |
| 4 | **CDN / page cache** — picker learns against uncached output; visitor hits stale HTML. | Comment markers survive caching (plain-text HTML comments are rarely stripped). Self-healer catches stale-cache match-failures and re-scores. | On first save of a selector, banner: *"If you use a CDN or full-page cache, purge it now so your next listeners get the updated content. [Purge in LiteSpeed] [Purge in WP Rocket] [Manual steps]"*. Detects active cache plugin and shows its purge link. | New `AtlasVoice\CachePurgeHints.php` registered with PR-C; existing `TTA_Hooks.php` already lists supported cache plugins. |
| 5 | **Tabs / accordions / collapsed regions** — picker sees only the visible panel. | Engine reads `innerText` on the full chosen container — `display:none` children are included only if their text content is non-empty in the live DOM. For `aria-hidden="true"` / `hidden` attributes, extracted; for CSS-only `display:none`, DOM text is still in the tree. The chosen container is `cloneNode(true)` before extraction so collapsed content is not missed. | If the picked container has descendants with `[aria-expanded="false"]` or `.collapsed` classes, picker shows chip: *"Includes N tab panels — [preview all] / [exclude hidden]"*. | Picker toolbar addendum (PR-B). |
| 6 | **Multi-language sites** — picker done in English, Spanish DOM different after TranslatePress/Polylang. | Selector storage is keyed per-language when WPML / Polylang / TranslatePress / GTranslate is active. First-visit auto-save runs once per `(post_type, language_code)`. Fallback: if no selector for current language, try `global` → `per_cpt` language-agnostic keys. | When a multi-language plugin is detected, Settings shows: *"Multi-language detected. Selectors are saved separately per language. [Pick for Spanish now]"* if Spanish has no saved selector yet. | `AtlasVoiceSettings.js` addendum (PR-C); detection hook lives in `AtlasVoice\LanguagePlugins.php`. |

**Philosophy:** guidance is co-located with the symptom (not buried in a docs page). The user never has to know the jargon "saved selector" — they see "3 posts auto-healed" as a simple badge, click it if curious, revert if wrong. The Docs page (§8.5) keeps the long-form explanation for power users who want the full picture.

### 11.2 Edge cases that remain explicitly out of scope

Even with self-heal + in-UI guidance, these produce extraction surprises and users will need to hand-tune. Each is called out with its escape hatch:

- **A/B tested content** (Google Optimize, LaunchDarkly cookie-driven variants): extractor reads whatever variant the extractor's page load happened to get. Escape: lock extraction to the control variant via `ttsBeforeExtract` JS filter.
- **Highly dynamic SPAs** (Vue/React hydration of post content): engine re-extracts on `popstate` but won't catch framework-internal route changes. Escape: expose `window.ttsReExtract()` for themes to call.
- **Shadow DOM encapsulated content** (web components): engine cannot pierce shadow roots by default. Escape: opt-in via `data-atlasvoice-shadow="true"` on the host element.
- **Custom fonts replaced as icons** (Font Awesome ligatures that render as icons but contain real text like "facebook" in the DOM): default text-exclude list extended to include common icon-font Unicode private-use ranges.

---

## 12. Security

| Threat | Mitigation | Code anchor |
|---|---|---|
| **SSRF** via `/diagnose` | Host must equal `wp_parse_url(home_url())['host']`; `manage_options` cap; rate-limit 10/5min via `TTA_Cache` transient; cookies cleared on `wp_remote_get`. | §8.2 |
| **Nonce / capability on REST routes** | Existing `get_route_access()` at [TTA_Api_Routes.php](../api/TTA_Api_Routes.php) + per-route cap override. All new routes gated. | §15 |
| **Never reflect extracted text unescaped** | Preview modal renders text inside `<pre>` using `esc_html()` (PHP) and `textContent` (JS). Diff view uses DOM text nodes, not `innerHTML`. | §8.1 |
| **Block attribute persistence** | `ttsAudio` persisted via core block-editor auto-save; no custom REST route, no sanitization bypass. Server validates `bool` when read. | §4.6 |
| **AtlasVoiceSelector XSS** | Selector strings sanitised server-side via `sanitize_text_field` + a selector-character whitelist (`[A-Za-z0-9_\-\[\]="'.,:()>+~*\s]`). Rejected selectors return 400. | §4.3 |
| **First-visit auto-save flood** | 24h transient `tta_first_visit_lock_{post_type}`. Subsequent saves require manual picker click. | §4.4 |
| **Comment-marker injection** | The `$btn_no` interpolated into markers is always `intval()`-cast before output. Content between markers is the same `$content` that the button filter already controlled. | §4.2 |

**Not required in v3:** XXE hardening, libxml flags, css-to-xpath translator — all dropped because PHP no longer parses HTML.

---

## 13. Performance

Targets:

- **P50 ≤ 50 ms** JS extraction on a 5,000-word post (Chrome 120 on mid-range laptop, no throttle).
- **P95 ≤ 150 ms** for the same.

Strategy:

- Tier 1 (comment markers) is O(n) walk of comment nodes — typically < 1 ms for any reasonable post.
- Tier 5 (scoring) runs once per page load; result memoised per `buttonId`.
- Tier 5 bounded to 64 candidates max (dedup + closest-to-button preference).
- `readText()` clones the node once and mutates the clone; never touches the live DOM.
- No MutationObserver in tier 5; if the DOM changes later, the caller re-invokes `ttsExtractContent`.
- PHP side does **not** run extractor on admin list tables or REST listing endpoints. `TTA_Admin\TTA_Posts_List` reads only `_tta_content_fingerprint` for badge state.
- Bulk MP3 path batches fingerprint comparisons only; no JS engine involvement (runs server-side and skips unchanged).

---

## 14. Observability

Piggybacks on existing AtlasAiDev telemetry (`TTA\TTA_Lib_AtlasAiDev`). No new consent surface.

New events:

| Event key | Payload | When |
|---|---|---|
| `extractor_path_used` | `{ tier: 'comment'\|'override'\|'per_cpt'\|'global'\|'scoring'\|'common'\|'php_fallback' }` | Every `ttsExtractContent` call. |
| `extractor_ms` | `{ elapsed_ms, tier, word_count }` | Same. |
| `picker_used` | `{ scope: 'per_cpt'\|'global', auto: bool, post_type, confidence }` | On AtlasVoiceSelector save. |
| `regeneration_mode` | `{ mode: 'manual'\|'auto'\|'ask' }` | On setting save. |
| `cpt_plugin_detected` | `{ plugin: 'acf'\|'metabox'\|'pods'\|… }` | Once per request on first custom-field reader run. |
| `custom_fields_plugin_detected` | Alias — differentiates plugin presence from reader activation. | |
| `block_optout_used` | `{ post_id, blocks_skipped }` | Per extractor run when count > 0. |
| `bulk_mp3_skipped` | `{ post_id, reason: "fingerprint_match" }` | Per skip. |
| `comment_marker_missing` | `{ post_id }` | When tier 1 attempted but start/end not found — signals a builder that strips comments. |
| `low_confidence_toast_shown` | `{ post_type, confidence }` | When scoring confidence < 0.35 and picker toast displayed. |

All events rate-limited client-side and gated by existing telemetry consent flag.

---

## 15. Testing matrix

### 15.1 Builder × mode grid

For each builder/theme below, test: (a) auto-button mode, (b) shortcode `[atlasvoice]` in body, (c) PHP `echo do_shortcode('[atlasvoice]')` in template, (d) `[atlasvoice text_to_read="…"]` explicit text, (e) post with custom-field values not in `the_content`.

| Builder / theme | Auto | Shortcode | PHP echo | Explicit | + Custom fields |
|---|:-:|:-:|:-:|:-:|:-:|
| Twenty Twenty-Four (FSE) | | | | | |
| Astra + Gutenberg | | | | | |
| GeneratePress + GenerateBlocks | | | | | |
| Kadence + Kadence Blocks | | | | | |
| OceanWP | | | | | |
| Elementor (free) | | | | | |
| Elementor Pro Theme Builder | | | | | |
| Divi Builder | | | | | |
| Beaver Builder + Beaver Themer | | | | | |
| WPBakery | | | | | |
| Oxygen Builder | | | | | |
| Bricks Builder | | | | | |
| Avada / Fusion Builder | | | | | |
| disabledepisco.com (live BB) | | | | | |
| TranslatePress / WPML / Polylang switched | | | | | |
| GTranslate cookie-translated | | | | | |

### 15.2 Commerce / LMS grid

| Plugin | Product/Lesson listing | Single item detail | Tabs / nested content | Custom fields |
|---|:-:|:-:|:-:|:-:|
| WooCommerce | | | | |
| LearnDash | | | | |
| TutorLMS | | | | |
| LifterLMS | | | | |
| MemberPress Courses | | | | |
| BuddyBoss LMS | | | | |

### 15.3 CPT / custom-field plugin grid

| Plugin | Simple text | Repeater / FlexContent | Group / Clone | Captions | Relationship (opt-in) |
|---|:-:|:-:|:-:|:-:|:-:|
| ACF free | | | n/a | | n/a |
| ACF Pro | | | | | |
| Meta Box | | | n/a | | n/a |
| Pods | | | n/a | n/a | n/a |
| JetEngine | | | n/a | | n/a |
| Toolset | | n/a | n/a | | n/a |
| Carbon Fields | | | | n/a | n/a |
| SCF | | | n/a | | n/a |

### 15.4 Regeneration-mode grid

| Mode | Gutenberg save | Classic save | Bulk Edit | Quick Edit | REST POST |
|---|:-:|:-:|:-:|:-:|:-:|
| `manual` | | | | | |
| `auto` | | | | | |
| `ask` (shows modal) | | | ⚠ always auto | ⚠ always auto | ⚠ always auto |

### 15.5 Automated tests

- `tests/Unit/TTA_Fingerprint_Test.php` — settings fingerprint determinism across locales / algorithms.
- `tests/Unit/TTA_Custom_Field_Reader_Test.php` — each reader against fixture values with substring-dedup fixture.
- `tests/Unit/TTA_Rest_Routes_Test.php` — `save-selector`, `extraction-report`, `preview-text`, `diagnose`, `dry-run-scan` auth + validation.
- **Playwright**
  - AtlasVoiceSelector: open, hover, click, save, reload, verify correct container is read.
  - Comment-marker walk: verify tier 1 selection on Elementor / Beaver / Divi fixture pages.
  - Block-level opt-out: toggle in Gutenberg, verify `data-tts-audio="false"` in rendered DOM, verify JS skips the node.
  - Dry-run diff: 50-post corpus, verify `changed + unchanged + errored === total`.
- Manual QA script — opt-in banner flow in `qa/TTS-238/opt-in-banner.md`.

---

## 16. Rollout — PR-based (v4)

v4 replaces v3's Phase 1-4 cadence with three independent PRs. Each PR is independently shippable; the system works (with reduced functionality) if the later PRs never land.

| PR | Status | Scope | Free version | Pro version |
|---|---|---|---|---|
| **PR-A — Opt-in gating + UI split** | ✅ **Shipped on `feature/TTS-238`** | Layer 1 toggle plumbed end-to-end. Engine + picker assets + admin-bar entry gated on opt-in. Legacy pipeline byte-identical when OFF. `TTSProHelper.js::getModifiedContent` gains a single opt-in short-circuit that delegates to `window.AtlasVoiceExtractor.getContentForPlayer` when ON. Settings UI split into `SettingsPrimitives.js` / `AtlasVoiceSettings.js` / `LegacyExtractionSettings.js`. Comment-marker dual-emit in Pro filter. Picker button on dashboard + admin bar. | 2.2.0 (TBD) | 2.2.0 (TBD) |
| **PR-B — Auto-detection toast + fallback picker + lazy loading** | Next | **Primary flow is zero clicks (§0.4):** scorer + first-visit auto-save + auto-detected excludes + non-blocking toast with listen sample. **Fallback flow (low-confidence only):** one-click picker overlay. **Advanced panel (collapsed by default):** scope override, tag/text exclude chips, per-post overrides. Dry-run diff modal vs legacy output. Lazy on-demand bundle loading (picker + engine bundles only fetched when the auto-detect toast or Advanced panel is opened — no page-load cost for users whose site the engine auto-handles). Block-opt-out toggle in Gutenberg inspector. Preview audio text modal (Free basic, Pro enhanced). | 2.3.0 (TBD) | 2.3.0 (TBD) |
| **PR-C — Pro rules + staging/production + lazy regen + self-heal** | After PR-B | Layer 2 mode toggle (staging / production). Layer 3 rules promoted to per-CPT + per-post scopes (Pro). Content-hash short-circuit (§5.5). Lazy visitor-load MP3 invalidation via `template_redirect` (§5.6). Snapshot/rollback per scope (one click reverts a rule to the previous saved value). Custom-field reader behind opt-in (§7), with `AtlasVoice\Readers\*Reader::read` copy-with-rename from existing `TTA_Pro_Helper::acf_plugin_content`. Diagnose URL (Pro). **NEW v4.1 ticket-killers (§0.7, §11.1):** (a) self-healing selectors with dashboard "N posts auto-healed" badge and one-click revert; (b) boilerplate text auto-detection via daily WP-Cron with suggested-chip UI; (c) cache-purge hints on selector save (detects active cache plugin and deep-links to its purge UI); (d) per-language selector keying for WPML/Polylang/TranslatePress/GTranslate; (e) logged-in/logged-out MP3 variant keying; (f) AJAX-late-content mutation-observer opt-in via `data-atlasvoice-wait-for`. | 2.4.0 (TBD) | 2.4.0 (TBD) |
| **Post-PR-C** | Deferred | Remove legacy `<div class="tts_content_wrapper_X">`. Tune `BUILDER_BODY_SELECTORS` and scoring weights from telemetry. Default opt-in = true for fresh installs. | 2.5.0 (TBD) | 2.5.0 (TBD) |

**Safety invariants across all three PRs:**

1. Opt-in OFF (the default for every existing user) → zero new frontend assets, zero new DOM markers, zero behavioral change from 2.1.17. Verified in PR-A via manual QA in Chrome.
2. No edits to the body of existing extraction functions — only top-of-function opt-in gates. Verified by `git diff` review on PR-A.
3. MP3 files on disk are only deleted inside the `template_redirect` lazy-regen path, never upfront from settings saves. Free never triggers deletion because Free has no MP3s.
4. Every rollback is one toggle: flip Layer 1 OFF → legacy runs on next page load. No MP3 cache is touched by toggling layers; it becomes stale but remains the same bytes it was before.

---

## 17. File-level change list

### 17.1 Free plugin (`text-to-audio`)

| File | Line anchor | Change | New? |
|---|---|---|---|
| `includes/TTA_Helper.php` | ~500 (settings) | `get_default_extractor_settings()`, `get_auto_selector()`, `get_auto_selector_by_cpt()`, `compute_content_fingerprint()`, `is_fresh_install()`. | — |
| `includes/helpers.php` | [L189-263](../includes/helpers.php) | Leave extraction logic intact (PHP fallback). Add fingerprint computation after `$content` built; stash into `window.TTS.contents_fingerprint[btn]`. Emit `<!--atlasvoice:start:X-->` / `<!--atlasvoice:end:X-->` markers **around** auto-button output (Phase 1 dual-emit) via `tts_button_with_content` filter — this is free-side when pro is absent. | — |
| `includes/TTA_Hooks.php` | [L81-97](../includes/TTA_Hooks.php) | Add new bundles to `$excludable_js_arr`: `tts-block-opt-out.min.js`, `tts-regen-confirm.min.js`, `tts-picker.min.js`, `tts-extractor-engine.min.js`, `tts-preview-modal.min.js`. | — |
| `includes/TTA_Hooks.php` | [L511-553](../includes/TTA_Hooks.php) | `tta__content_description_callback` — substring-dedup guard for custom fields (F14). | — |
| `includes/TTA_Custom_Field_Reader.php` | — | **NEW.** Static readers for ACF / Meta Box / Pods / JetEngine / Toolset / Carbon Fields / SCF. Gated by `function_exists` / `class_exists`. | ✅ |
| `includes/TTA_Fingerprint.php` | — | **NEW.** `compute()`, `compare()`, `store()`, `load()`, `queue_regen()`. | ✅ |
| `includes/TTA_Block_OptOut.php` | — | **NEW.** Reads `attrs.ttsAudio` when listing blocks; serialises to JSON for fingerprint input. | ✅ |
| `text-to-audio.php` | L559-565 (activation) | Seed `tta__settings_new_extraction_opt_in = true` on fresh install only; `false` on upgrade. Seed `tta__settings_mp3_regeneration_mode = 'auto'` fresh, `'manual'` upgrade. | — |
| `api/TTA_Api_Routes.php` | after L80 | Register `POST /save-selector`, `POST /extraction-report`, `POST /preview-text`, `POST /dry-run-scan`, `POST /block-opt-out`. | — |
| `src/extractor/tts-extractor-engine.js` | — | **NEW.** `ttsExtractContent`, `ttsWalkBetweenCommentMarkers`, `ttsScoreAndPick`, `ttsTryBuilderBodySelectors`, `BUILDER_BODY_SELECTORS`. Exposes `window.ttsExtractContent`. | ✅ |
| `src/picker/tts-picker.js` | — | **NEW.** AtlasVoiceSelector overlay (SelectorGadget port), stable-selector algorithm, admin-bar wiring, REST save. | ✅ |
| `src/block-editor/tts-block-opt-out.js` | — | **NEW.** Block inspector toggle. | ✅ |
| `src/editor/tts-regen-confirm.js` | — | **NEW.** `ask` mode confirm modal. | ✅ |
| `src/dashboard/components/dashboard/settings/Settings.js` | — | **PR-A (shipped):** Split extraction UI out into sub-components. Removed inline opt-in toggle + 4 legacy extraction `<Row>` blocks; renders `<AtlasVoiceSettings>` + `<LegacyExtractionSettings>` instead. PR-B will add inline diff modal trigger. | — |
| `src/dashboard/components/dashboard/settings/SettingsPrimitives.js` | — | **NEW (PR-A shipped).** Shared UI primitives (`ToggleSwitch`, `SettingRow`, `ProLockIcon`) shared between the new and legacy settings sub-components. | ✅ |
| `src/dashboard/components/dashboard/settings/AtlasVoiceSettings.js` | — | **NEW (PR-A shipped).** Layer 1 opt-in toggle + picker launcher card. PR-B will replace the launcher card with the stepwise wizard modal. | ✅ |
| `src/dashboard/components/dashboard/settings/LegacyExtractionSettings.js` | — | **NEW (PR-A shipped).** The four pre-AtlasVoice CSS-based extraction fields, mechanical lift from Settings.js. Zero behavioral change. PR-B will hide the "Include Content By CSS Selectors" textarea when Layer 1 is ON (replaced by picker); the three legacy excludes stay visible because they solve an orthogonal problem. | ✅ |
| `includes/AtlasVoice/Bootstrap.php` | — | **NEW (PR-C).** Registered on `template_redirect` priority 9. Inspects Layer 1; when ON, fires `atlasvoice_pre_listen` on visitor's first listen and triggers lazy-regen (§5.6). Zero existing-file edits required to wire this up. | ✅ |
| `includes/AtlasVoice/Rules.php` | — | **NEW (PR-C).** Reader/writer for Layer 3 scoped rules. `resolve($post_id, $post_type)` returns the most-specific rule (post → cpt → global). | ✅ |
| `includes/AtlasVoice/ContentHash.php` | — | **NEW (PR-C).** `md5_of_extracted_text()`, `short_circuit_or_dirty()`. Writes `_tta_extracted_text_hash` and `_tta_regen_dirty` post meta. | ✅ |
| `includes/AtlasVoice/Readers/ACFReader.php` (+ MetaBox, Pods, JetEngine, Toolset, CarbonFields) | — | **NEW (PR-C).** Copy-with-rename from existing `TTA_Pro_Helper::acf_plugin_content` and friends. No shared code with the legacy path. | ✅ |
| `includes/AtlasVoice/SelfHealer.php` | — | **NEW (PR-C, v4.1).** Runs on every extractor invocation; detects match-failures of saved selectors, rescores, saves the new selector, logs the heal event for the dashboard badge. Supports one-click revert via a stored 5-deep history per scope. | ✅ |
| `includes/AtlasVoice/BoilerplateDetector.php` | — | **NEW (PR-C, v4.1).** WP-Cron daily job. Cross-post substring analysis across the last 20 extracted bodies; surfaces 3+ char phrases appearing in > 50% of posts as suggested text-exclude chips. Respects `tta__atlasvoice_boilerplate_dismissed`. | ✅ |
| `includes/AtlasVoice/CachePurgeHints.php` | — | **NEW (PR-C, v4.1).** On selector save, detects active cache plugin (LiteSpeed / WP Rocket / W3TC / SG Optimizer / Autoptimize) and returns the deep-link to that plugin's purge UI + step-by-step for manual purge. Reuses the detection already in `TTA_Hooks.php`. | ✅ |
| `includes/AtlasVoice/LanguagePlugins.php` | — | **NEW (PR-C, v4.1).** Detects WPML / Polylang / TranslatePress / GTranslate. Keys selector storage as `{scope}:{lang_code}`. Exposes `current_language_code()` to JS. | ✅ |
| `includes/AtlasVoice/AuthVariants.php` | — | **NEW (PR-C, v4.1).** Tags MP3 storage with `_tta_mp3_variant` (`logged_out` / `logged_in` / `both`) when the picked container yields meaningfully different text between auth states. Meta-box radio lets admin pin a variant per post. | ✅ |
| `src/extractor/tts-extractor-engine.js` (v4.1 addendum) | — | Adds `data-atlasvoice-wait-for` mutation-observer opt-in (3s bounded) for AJAX-late content; exposes `window.ttsReExtract()` for SPA themes. | — |
| `src/dashboard/components/dashboard/compatibility/Compatibility.js` | — | Drag-sort field order + opt-in header text. | — |
| `src/dashboard/components/dashboard/docs/Docs.js` | — | New section "How content extraction works". | — |
| `src/dashboard/components/dashboard/dry-run/DryRunModal.js` | — | **NEW.** Dry-run diff UI. | ✅ |
| `src/dashboard/components/dashboard/preview/PreviewModal.js` | — | **NEW.** Preview audio text modal. | ✅ |
| `src/dashboard/css-selectors/CSSSelectorsForPosts.js` | — | Preview button + helper text. | — |
| `webpack.mix.js` | [L14-25](../webpack.mix.js) | Add new JS bundles. See 17.3. | — |
| `gulpfile.js` | `productionSrc` | Include `src/extractor/`, `src/picker/`, `src/block-editor/`, `src/editor/` as watched sources (built outputs go in existing `admin/js/build/`). | — |
| `tests/Unit/TTA_Fingerprint_Test.php` | — | **NEW.** | ✅ |
| `tests/Unit/TTA_Custom_Field_Reader_Test.php` | — | **NEW.** | ✅ |
| `tests/Unit/TTA_Rest_Routes_Test.php` | — | **NEW.** | ✅ |

### 17.2 Pro plugin (`text-to-audio-pro`)

| File | Line anchor | Change |
|---|---|---|
| `Includes/TTA_Pro_Filters.php` | [L244-270](../../text-to-audio-pro/Includes/TTA_Pro_Filters.php) | `tts_button_with_content_callback` — emit `<!--atlasvoice:start:$btn_no-->` / `<!--atlasvoice:end:$btn_no-->` around content. Keep legacy div under `tts_emit_legacy_wrapper` filter (Phase 1-3), remove in Phase 4. |
| `Assets/js/TTSProHelper.js` | [L609-665](../../text-to-audio-pro/Assets/js/TTSProHelper.js) | **PR-A (shipped):** top-of-`getModifiedContent` opt-in short-circuit — if `tts.use_atlasvoice_extractor` and `window.AtlasVoiceExtractor` present, delegate to `getContentForPlayer(opts)` and return if it succeeds; otherwise fall through to the **unmodified** legacy body. The legacy path stays byte-identical. Do NOT replace `getContentsFromDom`'s body — it continues to serve opt-in-OFF users. |
| `Assets/js/TTSProHelper.js` | [L1119-1140](../../text-to-audio-pro/Assets/js/TTSProHelper.js) | Extend `getContentSettingsFingerprint` to include `window.TTS.contents_fingerprint[buttonId]` as `phpHash` (already in v2 plan — carried forward). |
| `Assets/js/plyr.js` | [L250](../../text-to-audio-pro/Assets/js/plyr.js) | `document.querySelector('.tts_content_wrapper_' + buttonId)` — replace with a helper that prefers comment-marker walk, falls back to the old selector. |
| `Assets/js/compatibality/plugins/TTSGtranslate.js` | [L310, L417](../../text-to-audio-pro/Assets/js/compatibality/plugins/TTSGtranslate.js) | Same helper switch. |
| `Includes/TTA_Pro_Helper.php` | [L1287-1350](../../text-to-audio-pro/Includes/TTA_Pro_Helper.php) | `acf_plugin_content` — gated by user opt-in; add recursion into repeater/flex/group/clone; F14 substring dedup. |
| `Api/TTA_Pro_Api_Routes.php` | [L1795](../../text-to-audio-pro/Api/TTA_Pro_Api_Routes.php) | Register `POST /tts/v1/diagnose` (Pro-only, SSRF-guarded). Register `POST /tts/v1/save-selector` for Pro tier (writes per-CPT). |
| `Assets/js/editor/tts-preview-panel.js` | — | **NEW.** Pro-enhanced preview panel (alternatives + suggestions). |

### 17.3 Build-system mandatory pairings

Every new JS bundle must appear in BOTH `webpack.mix.js` AND `TTA_Hooks::$excludable_js_arr` at [TTA_Hooks.php:81-97](../includes/TTA_Hooks.php).

Bundles added in Phase 1-3:

| `webpack.mix.js` entry | Build output | Added to `$excludable_js_arr` |
|---|---|---|
| `mix.js('src/extractor/tts-extractor-engine.js', 'admin/js/build/tts-extractor-engine.min.js')` | `tts-extractor-engine.min.js` | ✅ |
| `mix.js('src/picker/tts-picker.js', 'admin/js/build/tts-picker.min.js')` | `tts-picker.min.js` | ✅ |
| `mix.js('src/block-editor/tts-block-opt-out.js', 'admin/js/build/tts-block-opt-out.min.js').react()` | `tts-block-opt-out.min.js` | ✅ |
| `mix.js('src/editor/tts-regen-confirm.js', 'admin/js/build/tts-regen-confirm.min.js').react()` | `tts-regen-confirm.min.js` | ✅ |
| `mix.js('src/dashboard/components/dashboard/preview/PreviewModal.js', …)` | rolled into `text-to-audio-dashboard-ui.min.js` | already excluded |
| `mix.js('src/dashboard/components/dashboard/dry-run/DryRunModal.js', …)` | rolled into `text-to-audio-dashboard-ui.min.js` | already excluded |
| (Pro) `Assets/js/editor/tts-preview-panel.js` | Pro build pipeline | Pro contributes via `tts_excludable_js_arr` filter |

---

## 18. Acceptance criteria

1. **disabledepisco.com test page** reads the article body, not the navigation, with zero user configuration. Tier used = `comment` or `scoring`; never `common` or `php_fallback`.
2. **Elementor theme-builder post with ACF fields** reads title + body + any ACF values already rendered into DOM. No shortcode names. No missing content.
3. **Existing user with custom CSS selectors** sees identical output and identical MP3 cache after upgrade (opt-in flag stays OFF until dry-run confirmed).
4. **Comment markers survive** caching plugins Autoptimize, LiteSpeed Cache, WP Rocket, W3TC, SG Optimizer (covered by existing exclusion list).
5. **Legacy div removal** in Phase 4 does not regress any site that passed Phase 3 — verified by re-running §15.1 matrix with `tts_emit_legacy_wrapper` filter returning `false`.
6. **AtlasVoiceSelector** successfully pins the content area on all 15 builders in §15.1 without manual CSS; saved selector reloads into tier 3 / tier 4.
7. **Per-CPT storage (Pro)** correctly separates selector for `post` vs `product` vs `lesson` on a multi-CPT site.
8. **First-visit auto-save** writes a selector to the correct scope and never double-writes (24h transient lock).
9. **Preview audio text modal** shows the exact text the player will speak, in <100ms for 5k-word post.
10. **Diagnose URL (Pro)** returns a usable report for any same-origin URL (400 on cross-origin, 403 on insufficient caps).
11. **Dry-run diff** correctly previews 100% of changed posts for a 500-post corpus (`changed + unchanged + errored === total`).
12. **All 3 regeneration modes** verified in Gutenberg + Classic + Bulk + Quick + REST save paths per §15.4.
13. **No regression on `tta_listening_data` analytics** — counts and payload shape unchanged in `POST /listening`.
14. **Block opt-out survives** synced patterns and reusable blocks; flipping the toggle changes fingerprint; MP3 regenerates next run.
15. **AMP canonical** comment-marker walk succeeds (verified in §15.1 row for AMP plugin active).
16. **Custom-field opt-in** — a site with ACF fields rendered in-body does NOT double-read them; dedup guard catches the collision.
17. **PHP dumb fallback** produces byte-identical string to pre-v3 for the same post + settings (except intro/outro whitespace) when tier 7 is reached.
18. **No new external PHP dep** in the free plugin ZIP (no Readability, no CSS-to-XPath vendor, no DOMDocument wrapper).
19. **P50 ≤ 50ms** JS extraction measured on a 5k-word real post (`extractor_ms` telemetry median).
20. **Telemetry `extractor_path_used` distribution** — after 30 days in Phase 3, `comment` ≥ 80%, `php_fallback` ≤ 2%.
21. **(v4.1) Zero-click opt-in rate** — of users who turn Layer 1 ON, at least **85%** never need to open the picker (measured via `picker_opened=false && opt_in=true` telemetry bucket at 30d post-enable).
22. **(v4.1) Self-heal coverage** — on a corpus of 200 sites with simulated theme/builder updates, ≥ **70%** of broken selectors are silently healed without manual admin intervention; remaining ≤ 30% fall back to tier 7 PHP without user-visible errors.
23. **(v4.1) Support ticket reduction target** — **80–90%** reduction in "player reads wrong content" tickets in the 90 days following PR-C vs the 90 days preceding PR-A (baseline captured in the TTS-238 Jira epic). Zero is not a target; 80–90% is.
24. **(v4.1) In-UI guidance attach rate** — the six hard-case flows (§11.1) are linked from at least one admin UI surface each, validated by click-through telemetry > 0 for each flow within 30 days of PR-C release.

---

## 19 (historical). Player init method unification (Pattern A)

**Status:** ✅ Implemented in `feature/TTS-238`. Shipped in 2.1.16. **Do not re-plan.** This section is preserved verbatim from v2 for historical record.

### 19.1 Goal

Collapse all four `init_*` methods on `TextToSpeechProPlayer` (players 3/4/5/6) to a single contract:

```
async init_X(shouldReturnURL = false, shouldAddLoader = false, changeLoaderText = true)
→ if shouldReturnURL: return result.data.url
→ else: call this.#setUpPlayer(result.data.url, 1)
```

Removes the asymmetry where `init_gctts` had a different first param (`shouldReplacePreviousPlayer`) and never returned a URL — which is why Bulk MP3 for Google Cloud TTS (player 4) silently produced no eye icon in the accordion.

### 19.2 Changes shipped

**File:** [text-to-audio-pro/Assets/js/plyr.js](../../text-to-audio-pro/Assets/js/plyr.js)

1. **`init_gctts` signature** — first param renamed `shouldReplacePreviousPlayer` → `shouldReturnURL`; gate updated to `if (!this.#shouldStartFileGenerating() && !shouldReturnURL)`; URL-return branch added at the end mirroring `init_gtts`.
2. **Lock-retry inside `init_gctts`** — now forwards `shouldReturnURL` so the retry path also returns the URL when the caller wanted it.
3. **`'waiting'` event handler** (only the live one; the duplicate inside `#setUpPlayer_old` was deleted — see #5). All 4 branches now `await` the URL and do an in-place `<source src>` swap:
   ```js
   if (ttsObjPro.player_id == 3)      url = await playClass.init_gtts(true, true);
   else if (ttsObjPro.player_id == 4) url = await playClass.init_gctts(true, true);
   else if (ttsObjPro.player_id == 5) url = await playClass.init_chat_gpt(true, true);
   else if (ttsObjPro.player_id == 6) url = await playClass.init_elevenlabs(true, true);
   ```
   Also fixed a copy-paste bug where player 5 was calling `init_elevenlabs` instead of `init_chat_gpt`.
4. **Frontend initial-setup calls** at [:133, :174, :209](../../text-to-audio-pro/Assets/js/plyr.js:133) — `this.init_gctts()` with no args, default `false` → internal `#setUpPlayer` path preserved. No change.
5. **`#setUpPlayer_old` removed** — 190-line dead method with zero callers deleted.

**File:** [text-to-audio/src/dashboard/bulk-mp3-file/generate-bulk-mp3-file.js](../src/dashboard/bulk-mp3-file/generate-bulk-mp3-file.js)

6. **Bulk call for player 4** — simplified to `init_gctts(1)`, matching the shape used for players 3/5/6. All four branches now share the identical `init_X(1)` pattern.

### 19.3 Risks to validate in release testing

| Risk | Test |
|---|---|
| Player 4 `'waiting'` recovery loses duration/metadata after in-place `source.src` swap (was previously full player rebuild via `#setUpPlayer`) | Post with >30s audio across multiple batches → pause mid-playback → resume → confirm seek bar updates and playback continues seamlessly |
| Player 5 / 6 `'waiting'` behavior change (were fire-and-forget before) | Same test on ChatGPT and ElevenLabs posts |
| Plyr version differences in source-swap handling | Verify across browsers and major theme/caching-plugin combinations |
| Analytics `trackPlay` event count regression | Check analytics dashboard for ±1 playCount per listen session |
| Lock-retry semantics for bulk | Trigger locked state on gctts in bulk → confirm retry completes and accordion eye icon appears |

### 19.4 Acceptance criteria

- Bulk MP3 accordion eye icon appears for all 4 players (3, 4, 5, 6).
- Frontend `'waiting'` recovers playback without blank player or lost duration for all 4 players.
- No regression in initial-load MP3 generation for any player.
- No regression in lock-retry path (`result.data.message === 'locked'` branch).

---

## 20. Open questions / future work

- **Per-page dark-list** — element-level "don't read this" inside AtlasVoiceSelector (shift-click to mark, persisted in post meta). Currently the only per-page exclusion is the Gutenberg block toggle, which doesn't help builder sites.
- **WPGraphQL resolver** for `/preview-text` so headless sites can integrate.
- **4th regeneration mode `schedule`** — "regenerate nightly for posts with stale fingerprints" via WP-Cron.
- **Tier 1 robustness against HTML minifiers that strip non-standard comments** — none do today, but document a Site Health check that warns if comment markers are missing on a production post.
- **Structured-content payload (SpeechKit parity)** for Pro cloud voices: send `{ title, summary, body, custom_fields }` discretely so Pro engines can apply per-section voice / prosody.
- **Pause/break macro injection (Trinity parity)** for Pro cloud voices on sentence/paragraph boundaries.
- **Telemetry-driven `BUILDER_BODY_SELECTORS` refinement** — once Phase 4 reaches 1,000+ sites, mine `extractor_path_used=scoring` + saved selectors to surface the next cohort of builder entries.
- **AtlasVoiceSelector multi-select** — some layouts (WPBakery) have no single container; user may want to point-and-click multiple rows. Defer to Phase 5.
- **Shortcode whitelist UI** (Trinity-style) — currently covered by tier 1 tier of rendered DOM; keep as option only until a ticket demands it.
- **Custom-field reader for Meta Box / Pods / JetEngine / Toolset / Carbon Fields** — all specced, all `function_exists`-gated, but not UX-integrated in Phase 3. Promote to full Compatibility-tab UI in Phase 4+.

---

## Revision log

### 2026-04-21 — v4.1 addendum (this revision)

Focus: **shift effort from UI to code** to avoid trading old tickets for new ones. Key changes:

- **§0.4 rewritten.** The 4-step wizard from the first v4 draft is demoted to a **low-confidence fallback**. Happy path is zero clicks: engine auto-picks, auto-excludes, auto-detects boilerplate. Wizard appears only when scoring confidence < 0.8. Advanced panel is always collapsed by default.
- **§0.7 added — self-healing + boilerplate auto-detection.** Saved selectors that stop matching are silently re-scored; admins see a "N posts auto-healed" dashboard badge with one-click revert. Daily WP-Cron job surfaces cross-post boilerplate text as dismissible chips.
- **§11.1 added — "six hard cases".** Explicit playbook for theme/builder DOM change, AJAX-late content, logged-in vs logged-out DOM, CDN/cache staleness, tabs/accordions, multi-language. Each case has (a) automatic mitigation and (b) in-UI guidance co-located with the symptom — never buried in a separate docs page. Docs page (§8.5) still carries the long-form explanation for power users.
- **§11.2 added — explicitly-out-of-scope cases** (A/B tests, shadow DOM, hydration, icon fonts) with their escape hatches documented.
- **PR-C scope expanded** to include 6 new ticket-killers: self-healer, boilerplate detector, cache purge hints, language plugin keying, auth variants, AJAX mutation-observer opt-in. §16 and §17.1 updated accordingly.
- **§18 acceptance criteria 21-24 added** — zero-click opt-in rate ≥ 85%, self-heal coverage ≥ 70%, 80-90% ticket reduction target (not zero), in-UI guidance attach rate validated.
- **Philosophy clarified**: every mandatory UI step is a new ticket vector; user-facing decisions are minimized; the wizard exists so users who need it can find it, not so the happy-path user has to walk through it.

### 2026-04-21 — v4 revision

- **Three-layer runtime control plane added** (§0.1, §3.1). Layer 1 opt-in (`tta__settings_use_atlasvoice_extractor`), Layer 2 mode (`tta__settings_atlasvoice_mode` = `staging` | `production`; Pro-only), Layer 3 scoped rules (`tta__settings_atlasvoice_rules` = global | per-CPT | per-post; Pro-only scopes). Layers are orthogonal and independently togglable. v3's "new_extraction_opt_in" key is the same idea as Layer 1 and is unified under the v4 name.
- **Hook-based integration / max code isolation directive** (§0.2, §3.1). New system plumbs in via a `template_redirect`-registered `AtlasVoice\Bootstrap`. No existing extraction function body is rewritten — only top-of-function opt-in gates are added. Methods the new system needs from existing code are **copied-with-rename** into `AtlasVoice\Readers\*Reader` rather than shared. Strangler Fig pattern.
- **Content-hash short-circuit** (§0.3, §5.5). When settings change but extracted text is byte-identical (e.g. user adds an exclusion that doesn't match anything in this post), Pro skips MP3 regen and resyncs the combined fingerprint. Saves per-character API cost on ChatGPT TTS / ElevenLabs / Google Cloud TTS / gTTS-Pro.
- **Lazy visitor-load MP3 invalidation** (§0.3, §5.6). On hash-changing settings changes, Pro does not mass-delete MP3s upfront. Posts are marked `_tta_regen_dirty`; delete+regen happens on first visitor listen via `template_redirect`. A 500-post site pays only for posts that are actually listened to. Admins can still trigger pre-warm via the existing Bulk MP3 surface.
- **Free = no MP3 clarification** (§0.3, §5 scope note, §9 table). Free uses browser `speechSynthesis` at listen time and has no MP3 cache. All MP3 regeneration, content-hash short-circuit, and lazy-invalidation logic is a Pro-only code branch. Free only stores the extracted-text hash for dry-run diff purposes.
- **Picker promoted to stepwise wizard** (§0.4). PR-B turns the current single button into a 4-step wizard (scope → include → exclude → refine) with chip UI and 5s listen sample. Free gets a 2-step subset (current-post scope + one include); Pro gets the full flow with tag/text excludes as chips instead of textareas.
- **Settings.js UI split shipped in PR-A** (§0.5, §17.1). Split into `SettingsPrimitives.js` (shared ToggleSwitch/SettingRow/ProLockIcon), `AtlasVoiceSettings.js` (Layer 1 + picker launcher), `LegacyExtractionSettings.js` (four pre-AtlasVoice CSS fields). The two sub-components can evolve independently; legacy fields stay visible when opt-in is ON because the three Excludes solve an orthogonal "skip cruft inside an already-correct include" problem.
- **Rollout re-phased from Phase 1-4 to PR-A / PR-B / PR-C** (§16). PR-A (opt-in + UI split) shipped on the feature branch. PR-B adds the wizard + lazy bundle loading. PR-C adds Pro rules, staging/production mode, content-hash short-circuit, and lazy regen. Legacy wrapper div removal is deferred to post-PR-C.
- **Dropped from mid-session brainstorming** (§0.6): "skip low-traffic posts for lazy regen" (Free has no analytics surface to define low-traffic); "differential voice cost per-post" (not essential for v4); "Free cost-surface gating on migration dialog" (Free has no cost surface).
- **§17 file list updated** to mark PR-A additions (✅ shipped) and PR-C `AtlasVoice\*` classes (✅ new). `TTSProHelper.js` change in §17.2 restated as "top-of-function opt-in short-circuit" rather than "replace getContentsFromDom body" — the legacy body stays byte-identical for opt-in-OFF users.
- **v3 extraction engine (tiers 1-7, comment markers, scoring, BUILDER_BODY_SELECTORS, AtlasVoiceSelector) carried forward unchanged.** v4 does not revise the engine; it wraps it in a control plane.

### 2026-04-20 — v3 rewrite

- **Architectural collapse.** Three-layer design (Layer A PHP smart extractor, Layer B JS, Layer C diagnostics) replaced by a single JS engine with a dumb PHP fallback. Dropped: `TTA\TTA_Content_Extractor`, `fivefilters/readability.php` vendoring, CSS-to-XPath translator, PHP libxml/XXE hardening, and the `tta_extractor_*` filter surface. Rationale: one engine reads the rendered DOM (source of truth), matches the user's "never read anything not on the UI, except intro/outro" constraint, halves the code surface, and eliminates the parallel-system bug class.
- **Wrapper change.** Replaced `<div class="tts_content_wrapper_X">` with HTML comment markers (`<!--atlasvoice:start:X-->` / `<!--atlasvoice:end:X-->`) emitted at the same call site in [TTA_Pro_Filters.php:244-270](../../text-to-audio-pro/Includes/TTA_Pro_Filters.php). Dual-emit for Phases 1-3, legacy div removed in Phase 4. Comments are invisible to CSS, layout, flex/grid, `:nth-child`, a11y, and AMP sanitizer.
- **AtlasVoiceSelector (visual picker).** New `src/picker/tts-picker.js` bundle providing point-and-click content-area selection for non-technical users. Admin-bar entry, meta-box entry, dashboard entry. **Based on a port of SelectorGadget ([cantino/selectorgadget](https://github.com/cantino/selectorgadget), MIT)** — its proven include/reject iteration algorithm is the baseline; we modify for content-area intent (suppress hover over nav/header/footer/aside, pre-score the best candidate for one-click accept, surface advanced refine mode only on demand, post-filter the resulting selector through our `ttsComputeStableSelector` to reject page-builder volatile IDs). MIT attribution retained in the bundle header and docs page.
- **Per-post-type selector storage.** New `tta_settings_data.tta__settings_auto_selector` (Free default) and `tta__settings_auto_selector_by_cpt` (Pro). First-visit auto-save runs scoring silently on fresh post types. Low-confidence case surfaces the picker toast.
- **`BUILDER_BODY_SELECTORS` expanded.** Added WooCommerce, LearnDash, TutorLMS, LifterLMS, MemberPress Courses, BuddyBoss LMS — on top of the 10 builders from v2.
- **F17, F18, F19 added to root-cause map** — wrapper-div CSS interference, non-tech users cannot write CSS, per-post-type differences.
- **Resolution order now 7 tiers** (comment / override / per_cpt / global / scoring / common / php_fallback) with an explicit confidence-driven picker fallback.
- **CPT / custom-field plugin handling reclassified as opt-in** per user's "only read UI" constraint. Default behaviour is to read only what's in the DOM; custom fields append only when user explicitly selects them AND substring-dedup confirms they aren't already rendered.
- **Fingerprint source inverted** — PHP no longer computes body fingerprint (no HTML parsing). Instead, JS engine reports the fingerprint via `POST /tts/v1/extraction-report`; PHP stores it and combines with settings fingerprint for regeneration comparison.
- **Dry-run diff redirected** — compares old path (legacy wrapper + common-selector list) vs new path (comment markers + scoring + per-CPT selector).
- **Rollout re-phased** — Phase 1 comment-marker dual-emit, Phase 2 scoring + picker + per-CPT + block opt-out, Phase 3 regen policy + fingerprint + dry-run + preview + Diagnose, Phase 4 legacy-div removal + telemetry-driven tuning.
- **Security simplified** — XXE, libxml, css-to-xpath mitigations dropped. New mitigations: SSRF guard on `/diagnose` retained, comment-marker injection (intval-cast `$btn_no`), first-visit auto-save flood (24h transient lock), visual-picker selector-character whitelist.
- **Performance re-targeted** — P50 ≤ 50 ms (JS) instead of P50 ≤ 150 ms (PHP). Faster because no DOMDocument, no XPath.
- **Observability events renamed** to match the new tier nomenclature: `extractor_path_used` with `tier` enum, `picker_used`, `comment_marker_missing`, `low_confidence_toast_shown`.
- **Testing matrix gets a commerce/LMS grid** on top of the existing 15-builder grid.
- **File-level change list simplified** — no PHP extractor class, no Readability vendor dir, no XPath translator. Three new JS bundles (`tts-extractor-engine`, `tts-picker`, `tts-block-opt-out`), all wired into BOTH `webpack.mix.js` and `TTA_Hooks::$excludable_js_arr`.
- **§19 Player init unification** preserved verbatim as historical record.

### 2026-04-17 — v2 (superseded)

Initial three-layer plan. Kept as Git history. Superseded by v3 above; do not re-read or reinstate without a new architectural decision.
