# TTS-238 — Content Extraction Overhaul

**Status:** Plan (not started coding)
**Date:** 2026-04-17
**Branches:** `feature/TTS-238` in both `text-to-audio` (free) and `text-to-audio-pro` (pro)
**Jira:** https://atlasaidev.atlassian.net/browse/TTS-238
**Related research:** [research-competitor-content-extraction.md](research-competitor-content-extraction.md), [TTS-future-content-extraction-improvements.md](TTS-future-content-extraction-improvements.md)

---

## 1. Problem statement (verbatim from support)

- "On single posts it reads the navigation and none of the post content." — disabledepisco.com user
- "It's only preloading. And it's reading HTML and image names etc." — voice-change user
- Several users could only be helped by trial-and-error CSS selector tweaking, ACF field picking, or by toggling **Read Content From Dom** off.
- One refund: Elementor + ACF + shortcode rendered from PHP code — no combination of settings worked.

The common pattern is: **the plugin picks the wrong DOM container and reads whatever happens to live there (nav, share buttons, image alts, raw shortcodes)**. Users have no easy way to know what the player is going to read until they hit play.

---

## 2. Root-cause map (proven on disabledepisco.com)

Live inspection on the failing URL confirmed:

- `window.TTS.contents[1]` already contains the correct 4536-char article (PHP path is fine).
- `tts_content_wrapper_1` exists with the correct text.
- Site is **Beaver Builder + UABB**: no `.entry-content`, no `<article>`, no `[itemprop="articleBody"]`, no `.wp-block-post-content`.
- `.fl-builder-content` is in the JS `COMMON_CONTENT_SELECTORS` list — but on this site that class is **also on the page `<header>`** (`fl-builder-content fl-builder-global-templates-locked`). `document.querySelector('.fl-builder-content')` returns the header → player reads navigation.

### 2.1 Failure surfaces in the current pipeline

| # | Surface | Why it fails |
|---|---|---|
| F1 | `getContentsFromDom` → `document.querySelector` (one match) at [TTSProHelper.js:622](../../text-to-audio-pro/Assets/js/TTSProHelper.js) and `:643` | Themes/builders re-use class names in nav/header. First match wins. |
| F2 | `COMMON_CONTENT_SELECTORS` is a flat list with no scoring | `.fl-builder-content`, `.elementor-section` etc. legitimately appear on nav/header containers. |
| F3 | `tts_content_wrapper_X` only exists when `tts_button_with_content` filter fires | Buttons inserted via direct PHP (`echo tta_get_button_content()`), via Elementor TTS widget, or in shortcode-only mode never get the wrapper. |
| F4 | Free PHP path uses `get_the_content(null, false, $post)` ([helpers.php:225](../includes/helpers.php)) | Does NOT run `the_content` filters → blocks, shortcodes, ACF-the-content rendering, Elementor inline output, etc. are skipped. Free users hear shortcode names or empty text. |
| F5 | Excludes are scoped *within* includes only | Users who never set includes can't exclude `nav`, `.sidebar`, etc. globally. |
| F6 | No "is this actually article content" sanity check | Whatever the selector matched is trusted blindly even if it's 30 chars of nav text. |
| F7 | No diagnostic visibility | User and support both have to open DevTools and guess to find why audio is wrong. |

### 2.2 Builder/theme matrix — what each ships and what breaks

| Builder / theme family | Body container in DOM | What's wrong with current detection |
|---|---|---|
| **Beaver Builder** | `.fl-post-content`, `.fl-builder-content` | `.fl-builder-content` also wraps header/templates. Picks header. |
| **Elementor** | `.elementor-widget-theme-post-content .elementor-widget-container`, also raw `.elementor-section` | Posts using the "Theme Builder" template don't render via `the_content` → no wrapper. Common selector matches an empty container in some templates. |
| **Divi** | `.et_pb_post_content`, `.et_pb_section` (body sections), `.entry-content` | Divi Builder body bypasses `the_content` filter. ACF-driven modules skipped server-side. |
| **WPBakery (Visual Composer)** | `.vc_row`, `.wpb_wrapper`, theme's `.entry-content` | Body is many sibling rows — no single container. Picks first `.vc_row` (often a hero with no text). |
| **Oxygen Builder** | `.ct-section`, `[id^="div_block-"]`, NO `.entry-content` | Oxygen disables WP theme output. Common selector list misses it entirely. |
| **Bricks Builder** | `.brxe-section`, `.brxe-container`, `[data-bricks-element]` | Same as Oxygen — bypasses theme. |
| **Avada / Fusion** | `.fusion-text`, `.fusion-fullwidth`, `.post-content` | Body is split across many `.fusion-text` blocks. First match is usually the title/hero. |
| **GenerateBlocks** | `.gb-container` | Class is generic — appears on header containers too. |
| **Kadence Blocks** | `.kadence-column`, `.entry-content` | OK with `.entry-content` if theme outputs it. |
| **FSE block themes (Twenty Twenty-*+)** | `.wp-block-post-content` | OK in most cases, but inner blocks inject `.wp-block-group` with no semantic class. |
| **Astra / OceanWP / GeneratePress / Suki** | `.entry-content` | Usually fine, but ACF fields outside the_content still missing. |

The pattern: **no single CSS-selector list can solve this**. We need a **content-scoring** approach: pick the container with the most article-like text after subtracting nav/header/footer/aside.

---

## 3. Solution architecture — three layers

The strategy: **make the default zero-config path bulletproof so non-technical users never touch settings; keep every existing override working unchanged for technical users**.

```
┌───────────────────────────────────────────────────────────┐
│ Layer A — PHP server-side smart extraction (free + pro)   │
│  Renders the_content filters + DOMDocument + scoring      │
│  → window.TTS.contents[buttonId] is always correct        │
├───────────────────────────────────────────────────────────┤
│ Layer B — JS DOM extraction hardening (pro)               │
│  querySelectorAll, scoring, button-parent traversal,      │
│  PHP-content sanity-check fallback                        │
├───────────────────────────────────────────────────────────┤
│ Layer C — Diagnostics & UX (free + pro)                   │
│  "Test what player reads" preview, "Diagnose URL" tool,   │
│  auto-suggest selectors, inline help text                 │
└───────────────────────────────────────────────────────────┘
```

---

## 4. Layer A — PHP smart extraction (free + pro)

### 4.1 New extractor class

`includes/TTA_Content_Extractor.php` — new class.

```
TTA\TTA_Content_Extractor
  ::extract( WP_Post $post, array $settings ): string
```

Pipeline:

1. **Render through filters**:
   ```php
   $html = apply_filters('the_content', $post->post_content);
   $html = apply_filters('tta_extractor_html_before_parse', $html, $post);
   ```
   This fixes F4 — Elementor, Divi shortcode-rendered widgets, blocks, ACF-the-content, builder do_blocks output all become real HTML before we look at it.

2. **Build DOM with safe encoding**:
   ```php
   $doc = new DOMDocument();
   libxml_use_internal_errors(true);
   $doc->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_NOERROR | LIBXML_NOWARNING);
   libxml_clear_errors();
   $xpath = new DOMXPath($doc);
   ```

3. **Apply user includes (CSS-to-XPath)** — if `tta__settings_css_selectors` non-empty:
   - Convert each selector via a tiny built-in CSS→XPath translator (handle `.class`, `#id`, `tag`, `tag.class`, descendant combinator, `[attr=value]`).
   - For unsupported pseudo-selectors → log + skip with a warning visible in the diagnose tool.
   - `querySelectorAll`-equivalent: collect ALL matches, not just first.

4. **Apply scoring if no includes** (zero-config path):
   - Build a candidate list: every element that's NOT inside `nav`, `header`, `footer`, `aside`, `[role=navigation]`, `[role=banner]`, `[role=contentinfo]`, `.menu`, `.sidebar`, `.widget`, `.comments-area`, exclude selectors.
   - Score = `text_length * (text_length / (descendant_element_count + 1))` (text density × size).
   - Boost score 2× if element matches a known content selector (Astra/Elementor/Divi/etc list).
   - Penalize 0.5× if element contains >5 links and link-text-ratio > 50% (nav-ish).
   - Pick top scoring container; if it's contained inside another candidate, pick the parent if its score is within 80%.

5. **Apply excludes** (within picked container):
   - `tta__settings_exclude_content_by_css_selectors` — remove matching nodes.
   - `tta__settings_exclude_tags` — strip these tag types (script/style/figure/figcaption are always added).
   - Default global hidden-element strip: `[aria-hidden="true"]`, `[hidden]`, `style*="display:none"`, `.screen-reader-text`, `.sr-only`.

6. **Extract text**:
   - Walk DOM, append `textContent` per block-level element with sentence delimiter.
   - Skip text inside excluded tags.
   - Decode entities, normalize whitespace.

7. **Apply text excludes**: pipe-separated `tta__settings_exclude_texts`.

8. **Title prepend with dedup**: same logic the JS layer already uses.

9. **Append ACF / compatible plugin content** (already handled by `tts_compatible_plugins_content` filter at [helpers.php:242](../includes/helpers.php)).

10. **Intro/outro** for free player only (matches existing rule).

### 4.2 Wire into `tta_get_button_content`

Replace the current content build at [helpers.php:189-263](../includes/helpers.php) with:

```php
$use_smart = TTA_Helper::should_use_smart_extraction($post, $settings);
if ($use_smart) {
    $content = TTA_Content_Extractor::extract($post, $settings);
} else {
    // existing get_the_content() + concat path — unchanged
}
```

`should_use_smart_extraction` returns the value of new setting `tta__settings_php_smart_extraction` with these defaults:
- New installs: **on**.
- Upgrading installs: **off** (preserves current text → preserves MP3 cache).
- Pro: respected if Pro is active.
- Filterable: `apply_filters('tts_use_smart_extraction', $bool, $post)`.

### 4.3 Migration

In `TTA_Init` (or wherever activation runs):

```php
// On fresh install: enable smart extraction by default.
// On upgrade: leave it off so existing audio cache stays valid.
$existing_settings = get_option('tta_settings_data');
if ($existing_settings === false) {
    // Fresh install
    $defaults['tta__settings_php_smart_extraction'] = true;
} else {
    // Upgrading install — explicit off, user can opt-in
    if (!isset($existing_settings['tta__settings_php_smart_extraction'])) {
        $existing_settings['tta__settings_php_smart_extraction'] = false;
        update_option('tta_settings_data', $existing_settings);
    }
}
```

Add a one-click banner in the dashboard for upgrading users: *"Try the new smart content extraction engine — it solves most 'reads wrong content' issues automatically. Switching may regenerate your audio cache. [Switch on] [Learn more]"*

### 4.4 Backward compatibility checklist

- [ ] All existing settings keys unchanged (`tta__settings_css_selectors`, `..._exclude_*`, etc.).
- [ ] `tta_clean_content`, `TTA_Helper::sazitize_content`, `clean_content`, `clean_string` still run on the final string.
- [ ] `tta__content_title`, `tta__content_excerpt`, `tta__content_description` filters still fire.
- [ ] `tts_compatible_plugins_content` still fires for ACF.
- [ ] Free intro/outro still baked into `$content` for player_id 1.
- [ ] When smart extraction is OFF, code path is the legacy path verbatim.

---

## 5. Layer B — JS DOM extraction hardening (pro)

Goal: when `tta__settings_read_content_from_dom` is on AND no user CSS selectors are set, never read junk.

### 5.1 Replace `getContentFromCommonSelectors` with scored selection

In `TTSProHelper.js`:

```js
const findBestContentContainer = (htmlSelectors, tts, buttonId) => {
    // 1. Build candidate list from COMMON_CONTENT_SELECTORS *and* button parent traversal.
    const candidates = new Set();

    // 1a. All common selector matches (querySelectorAll, not querySelector)
    COMMON_CONTENT_SELECTORS.forEach(sel => {
        if (isSelectorValid(sel)) {
            document.querySelectorAll(sel).forEach(el => candidates.add(el));
        }
    });

    // 1b. GSpeech-style parent traversal from the actual button
    const button = document.querySelector(`tts-play-button[data-id="${buttonId}"], .tts__listent_content[data-id="${buttonId}"]`);
    if (button) {
        let parent = button.parentElement;
        while (parent && parent !== document.body) {
            candidates.add(parent);
            parent = parent.parentElement;
        }
    }

    // 2. Score each candidate
    const scored = [...candidates]
        .filter(el => !el.closest('nav, header, footer, aside, [role=navigation], [role=banner], [role=contentinfo], .menu, .sidebar, .widget, .comments-area'))
        .map(el => {
            const text = (el.innerText || '').trim();
            const links = el.querySelectorAll('a');
            const linkText = [...links].map(a => a.innerText).join('').length;
            const linkRatio = text.length ? linkText / text.length : 1;
            const density = text.length / (el.querySelectorAll('*').length + 1);
            let score = text.length * density;
            if (linkRatio > 0.5) score *= 0.3;            // probably nav
            if (matchesKnownContentSelector(el)) score *= 2;
            return { el, score, len: text.length };
        })
        .filter(c => c.len > 80)                          // ignore tiny containers
        .sort((a, b) => b.score - a.score);

    return scored[0]?.el || null;
};
```

### 5.2 Sanity-check fallback

After extraction, compare to PHP content:

```js
const phpContent = window?.TTS?.contents?.[buttonId] || '';
if (extracted.length < phpContent.length * 0.5) {
    // DOM extraction is suspicious — fall back to PHP content
    extracted = phpContent;
}
```

This fixes the "reads navigation" case as a hard guarantee. Layer A makes `phpContent` reliable; Layer B uses it as safety net.

### 5.3 Include selectors → `querySelectorAll`

[TTSProHelper.js:622](../../text-to-audio-pro/Assets/js/TTSProHelper.js):

```js
// before:
let currentHTMLDOM = document.querySelector(currentSelector);
// after:
const matches = document.querySelectorAll(currentSelector);
matches.forEach((el, idx) => {
    const cloned = el.cloneNode(true);
    const c = getContentFromHTMLDOM(cloned, htmlSelectors, tts, buttonId, idx);
    // concat with delimiter (existing logic)
});
```

This fixes F1.

### 5.4 Builder-aware selector boosts

Add filterable helper `matchesKnownContentSelector(el)` that returns true for the canonical body selector of each detected builder:

```js
const BUILDER_BODY_SELECTORS = {
  beaver:    '.fl-post-content, article .fl-rich-text',
  elementor: '.elementor-widget-theme-post-content .elementor-widget-container, [data-elementor-type="single-post"] .elementor-widget-container',
  divi:      '.et_pb_post_content, .et-l--body .et_pb_text_inner',
  wpbakery:  'article .wpb_wrapper, .vc_row .wpb_text_column',
  oxygen:    '#main-content, [data-id="main_content"]',
  bricks:    '.brxe-post-content, [data-builder-type="bricks-single-post"]',
  avada:     'article .post-content, .fusion-text',
  fse:       '.wp-block-post-content',
  generic:   '.entry-content, [itemprop=articleBody], .post-content, .article-content',
};
```

Each builder is a separate candidate set so we never re-introduce the F2 collision with `.fl-builder-content`-on-header.

### 5.5 Backward compatibility

- All hooks preserved: `ttsProGetContentFromDOM`, `ttsCommonContentSelectors`, `tts_before_dom_content_extract`, `ttsTitleSelectors`.
- Behaviour change is silent — only kicks in when current path returns junk; in that case the fallback to PHP content is what was already supposed to happen.
- Setting `tta__settings_read_content_from_dom` keeps current default for existing users; new users default to **off** (Layer A handles it server-side).

---

## 6. Layer C — Diagnostics & UX (free + pro)

### 6.1 "Test what the player will read" — per-post meta box

In the existing TTS meta box on the post edit screen, add a button **"Preview audio text"** that:

1. POSTs to `/wp-json/tts/v1/preview-text?post_id=123`.
2. Server runs `TTA_Content_Extractor::extract()` on the post.
3. Returns: `{ container_selector, container_score, word_count, text, excluded_count, acf_fields_found, builder_detected }`.
4. Modal shows the actual text the user will hear, with a green/yellow/red confidence badge.

User sees immediately: "Player will read 1,247 words from `.fl-post-content`. Excluded: nav, share buttons, image captions. ACF fields included: subtitle, author_bio."

If wrong, modal shows top-3 alternative containers with one-click "Use this instead" → writes to per-post or global include selector.

### 6.2 "Diagnose URL" — Compatibility tab

REST endpoint `tts/v1/diagnose`:
- Accepts `{ url }`.
- Validates: parsed host == `wp_parse_url(home_url())['host']`.
- Validates: `current_user_can('manage_options')`.
- `wp_remote_get($url)` with timeout 15s.
- Run extractor on the response body.
- Return same shape as 6.1.

UI: textarea for URL, "Diagnose" button, result panel. Used by support (you) to instantly see what's happening on the user's URL without DevTools.

### 6.3 Auto-suggest selectors

If `TTA_Content_Extractor::extract()` confidence is below threshold, store `top_3_alternatives` and surface them in the meta box and Settings page as: *"AtlasVoice picked `.X` but isn't fully confident. These containers might also work: `.Y`, `.Z`. [Use .Y] [Use .Z]"*.

### 6.4 Inline help text

Implement the inline helpers from [TTS-future-content-extraction-improvements.md §4.1](TTS-future-content-extraction-improvements.md):
- `Settings.js` (global)
- `CSSSelectorsForPosts.js` (per-post)
- `Compatibility.js` (ACF)

Add a new info card at the top of Settings → CSS Selectors block:

> **Most users don't need to touch these.** AtlasVoice automatically detects the article container on 95%+ of WordPress sites. Use these fields only if the **Preview** above shows the wrong text.

---

## 7. File-level change list

### Free plugin (`text-to-audio`)

| File | Change |
|---|---|
| `includes/TTA_Content_Extractor.php` | **NEW.** PHP DOMDocument extractor. |
| `includes/TTA_Helper.php` | Add `should_use_smart_extraction()`, `get_default_extractor_settings()`, `css_selector_to_xpath()` helper. |
| `includes/helpers.php` | Branch `tta_get_button_content` to use new extractor when enabled. |
| `includes/TTA_Init.php` (or activation hook file) | Migration: set `php_smart_extraction = true` for fresh installs, `false` for upgrades. |
| `api/TTA_Api_Routes.php` | Add `POST /preview-text`, `POST /diagnose`. |
| `src/dashboard/components/dashboard/settings/Settings.js` | Add toggle for new extractor + inline help. |
| `src/dashboard/components/dashboard/compatibility/Compatibility.js` | "Diagnose URL" panel + ACF helper text. |
| `src/dashboard/components/dashboard/docs/Docs.js` | New section "How content extraction works" + per-builder guide. |
| `src/dashboard/css-selectors/CSSSelectorsForPosts.js` | "Preview audio text" button + helper text. |
| `admin/TTA_Admin_Meta_Box.php` (if exists, else create) | Render Preview button in classic + Gutenberg post edit. |

### Pro plugin (`text-to-audio-pro`)

| File | Change |
|---|---|
| `Assets/js/TTSProHelper.js` | Replace `getContentFromCommonSelectors` with `findBestContentContainer`; switch include selectors to `querySelectorAll`; add PHP-content sanity fallback; add builder-aware selector map. |
| `Assets/js/TTSProHelper.js` | Add `BUILDER_BODY_SELECTORS` and `matchesKnownContentSelector` helpers. |
| `Includes/TTA_Pro_Filters.php` | `tts_button_with_content_callback` — keep wrapper (back-compat) but no longer relied on as primary signal. |
| `Includes/TTA_Pro_Helper.php` | Forward Preview/Diagnose REST endpoints to the free extractor (Pro can override to inject its own filters). |
| `webpack.mix.js` build | Rebuild bundles. |

### Build system

| File | Change |
|---|---|
| `webpack.mix.js` (free) | No change unless we add a new dashboard bundle. |
| `gulpfile.js` (free) | No change. |

---

## 8. Backward compatibility matrix

| Existing user setup | Result after upgrade |
|---|---|
| Default settings, free | Same text as before (smart extraction OFF on upgrade). MP3 cache preserved. |
| Default settings, pro, DOM reading on | JS hardening kicks in only when current code returns < 50% of PHP content; otherwise identical. |
| Custom include CSS selectors | All current behaviour preserved. Now reads ALL matches, not just first — slight improvement for users who deliberately listed multiple selectors. |
| Custom exclude CSS selectors | Identical. |
| Per-post selector overrides (Pro) | Identical. |
| ACF compatibility configured | Identical. |
| Custom theme with `.entry-content` | Identical. |
| Beaver/Divi/Elementor/Oxygen/Bricks | Improved: scored selection or PHP smart extraction (after opt-in or fresh install). |

If a user opts into the new engine and dislikes the result, toggling it off restores the legacy path bit-for-bit.

---

## 9. Testing matrix

For each builder/theme below, test: (a) auto-button mode, (b) shortcode `[atlasvoice]` in body, (c) PHP `echo do_shortcode('[atlasvoice]')` in template, (d) `[atlasvoice text_to_read="…"]` explicit text, (e) post with ACF fields not in the_content.

| Builder / theme | Auto button | Shortcode | PHP echo | Explicit text | + ACF |
|---|:---:|:---:|:---:|:---:|:---:|
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
| disabledepisco.com (live BB site) | | | | | |
| TranslatePress / WPML / Polylang switched language | | | | | |
| GTranslate cookie-translated | | | | | |

Each cell: ✔ extracts correct text, ✗ regression, ⚠ partial.

Add automated PHP tests (`tests/Unit/TTA_Content_Extractor_Test.php`) using fixture HTML files from each builder.

---

## 10. Rollout plan

1. **Phase 1 — Pro JS hardening** (Layer B + sanity fallback). Ship in next pro release as silent improvement. No new settings.
2. **Phase 2 — PHP smart extractor** (Layer A). Setting added, default off for upgrades, on for new installs. Free + pro.
3. **Phase 3 — Diagnostics** (Layer C). Preview meta box, Diagnose URL, inline help text, docs page. Free + pro.
4. **Phase 4 — Upgrade-user opt-in banner**. After 2 weeks of phase 2 stability, surface "Try the new engine" banner with one-click toggle.

Each phase is independently shippable in this single feature branch — phases can be merged in order without coupling.

---

## 11. Open / future work (not in this ticket)

- Replace ad-hoc CSS-to-XPath translator with `symfony/css-selector` if the size cost is acceptable in free.
- Add Mozilla Readability port for PHP as opt-in extractor for "auto" mode on truly unknown themes.
- Per-post meta cache for extracted container selector (skip scoring on subsequent loads).
- Telemetry: opt-in anonymized signal of "which builder detected" + "did fallback fire" so we can prioritize selector list updates.

---

## 12. Free vs Pro feature split

**Guiding rules**

- Free must solve the **"player reads wrong content"** complaint with zero configuration. If we hide the basic fix behind Pro, users churn before they ever consider upgrading.
- Pro is the **power-tools tier**: per-post overrides, JS DOM extraction, advanced diagnostics, builder-specific maps surfaced as suggestions.
- No existing Pro feature loses functionality. No existing free behaviour breaks.

| Feature | Free | Pro | Notes |
|---|:---:|:---:|---|
| **Layer A — PHP DOMDocument smart extraction (auto-detect article container)** | ✅ | ✅ | Core fix — must be in free. Pro inherits and extends with per-post overrides. |
| Renders `apply_filters('the_content')` before parsing | ✅ | ✅ | Fixes Elementor/Divi/blocks/ACF-the-content for free users. |
| Container scoring (text density, link ratio, nav/header exclusion) | ✅ | ✅ | Same algorithm both tiers. |
| Built-in builder-aware selector boost map (Beaver/Divi/Elementor/Oxygen/Bricks/WPBakery/Avada/FSE) | ✅ | ✅ | Bundled list, identical in both. |
| `tts_use_smart_extraction` filter | ✅ | ✅ | Developer hook. |
| Setting: `tta__settings_php_smart_extraction` toggle | ✅ | ✅ | New install: ON. Upgrade: OFF (preserves cache). |
| Migration banner: "Try the new engine" | ✅ | ✅ | Same UI, both tiers. |
| **Global** include / exclude / tag / text fields | ✅ | ✅ | Already existing free feature, extractor honours them. |
| **Layer B — JS DOM extraction hardening** (`querySelectorAll`, scored selection, button-parent traversal) | ❌ | ✅ | Free has no JS DOM path (player_id=1 reads `ttsCurrentContent` directly). |
| JS sanity-check fallback (DOM extraction < 50% of PHP → use PHP content) | ❌ | ✅ | Pro-only because there's no JS extraction in free. |
| `BUILDER_BODY_SELECTORS` JS map + boost | ❌ | ✅ | JS-side counterpart of the PHP map. |
| Setting: `tta__settings_read_content_from_dom` | ❌ | ✅ | Already Pro behaviour today. New default: OFF for new installs (Layer A handles it). |
| **Per-post CSS selector overrides** (`tts_pro_custom_css_selectors`) | ❌ | ✅ | Existing Pro feature, unchanged. |
| **Per-post `tta__settings_use_own_css_selectors` toggle** | ❌ | ✅ | Existing Pro feature, unchanged. |
| Per-post smart-extraction override (force on/off per post) | ❌ | ✅ | New Pro extension of the toggle. |
| **Layer C — "Preview audio text" in post edit screen** | ✅ basic | ✅ enhanced | Free: shows the exact text. Pro: also shows confidence score, top-3 alt containers, one-click "Use this selector". |
| REST endpoint `POST /preview-text` | ✅ | ✅ | Free returns `{ text, word_count }`. Pro additionally returns `{ container_selector, score, alternatives, builder_detected }`. |
| **"Diagnose URL" tool in dashboard** | ❌ | ✅ | Pro feature — advanced support tool. Justifies upgrade for site owners with multi-page issues. |
| REST endpoint `POST /diagnose` | ❌ | ✅ | Pro-only; `current_user_can('manage_options')` + same-origin guard. |
| **Auto-suggest selectors** (top-3 alternatives in meta box / Settings) | ❌ | ✅ | Requires the scoring metadata exposed only in Pro preview response. |
| **Inline help text** under CSS selector fields | ✅ basic | ✅ extended | Free: short one-liner per field. Pro: examples per builder, tooltip with browser DevTools guide link. |
| **ACF / compatible plugin content** (`tts_compatible_plugins_content` filter) | ✅ filter only | ✅ ACF UI + integration | Existing split. Free has the hook, Pro has the dashboard UI to pick fields. |
| ACF repeater / flexible content recursion | ❌ | ✅ | Existing future-work item, lives in Pro. |
| `tts_content_wrapper_X` div injection | ❌ | ✅ | Existing Pro behaviour via `tts_button_with_content_callback`. Kept for back-compat; no longer the primary signal. |
| **Default extractor** (legacy `get_the_content()` concatenation) | ✅ | ✅ | Stays as the OFF-state implementation in both tiers. |
| **Documentation page** ("How content extraction works" + per-builder guide) | ✅ | ✅ | Same docs accessible from both dashboards. |
| Multi-language (WPML/Polylang/TranslatePress/GTranslate) handling | ❌ | ✅ | Existing Pro JS feature unchanged; PHP extractor in free does not switch language by cookie. |
| Multiple players (player_id ≥ 2) | ❌ | ✅ | Unchanged. Layer A and Layer B both work with multiple players in Pro. |

### Why this split is fair

1. **Free users finally get a working player without configuration.** That solves the complaint and the refund risk. The PHP extractor is bundled with PHP — no extra cost to ship in free.
2. **Pro users get the diagnostic & override layer.** Preview enhancements, Diagnose URL, auto-suggest, per-post overrides, JS DOM hardening, multi-language — these are the "I have a complex site and need control" workflow that justifies paying.
3. **Support workload drops in both tiers.** Free users self-serve via Preview. Pro users (and you) self-serve via Diagnose URL.
4. **No existing customer loses anything.** Smart extraction is opt-in for upgrades; legacy code path is preserved as the OFF state.

---

## 13. Acceptance criteria

- disabledepisco.com test page reads the article body, not the navigation, with no user configuration.
- Elementor theme-builder post with ACF fields reads title + body + ACF, no missing content, no shortcode names.
- Existing user with custom CSS selectors sees identical output and identical MP3 cache after upgrade.
- "Preview audio text" in post edit screen shows the exact text the player will speak, in <500 ms.
- "Diagnose URL" returns a usable report for any URL on the user's own domain.
- All 15 builder/theme combinations in §9 pass auto-button + shortcode + PHP-echo cases.
- No new external dependencies in free plugin.
