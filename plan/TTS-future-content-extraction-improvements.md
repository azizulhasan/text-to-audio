# Future: Content Extraction System Improvements

**Status:** Planned (not yet scheduled)
**Date:** 2026-03-30
**Related:** TTS-232 (partial fixes already merged)

---

## 1. Current System Architecture

### Content Source Priority Chain

```
1. Per-post CSS selectors    (Pro only, post meta: tts_pro_custom_css_selectors)
2. Global CSS selectors      (Option: tta_settings_data → tta__settings_css_selectors)
3. .tts_content_wrapper_X    (Auto-button mode, created by tts_button_with_content filter)
4. Common theme selectors    (Added in TTS-232: .entry-content, [itemprop="articleBody"], etc.)
5. PHP-provided content      (Final fallback: window.TTS.contents[buttonId])
```

### Title Extraction Cascade (getTitleFromDOM)

```
.entry-title → .post-title → .elementor-heading-title → .page-title →
article h1 → .hentry h1 → .post h1 → h1
```

### Settings Storage

| Purpose | Key | Location |
|---------|-----|----------|
| Global settings | `tta_settings_data` | wp_options |
| ACF field selection | `tta_compatible_data` | wp_options |
| Per-post CSS selectors | `tts_pro_custom_css_selectors` | wp_postmeta |
| Listening/voice | `tta_listening_data` | wp_options |
| Customization | `tta_customize_settings` | wp_options |

### Selector Formats

- **Include/Exclude CSS selectors:** Newline-separated (`.entry-content\n.article-body`)
- **Tags:** Pipe-separated (`sub|sup|em|strong`)
- **Texts:** Pipe-separated (`Disclaimer|Advertisement|Related posts`)

---

## 2. Known Issues

### Issue A: Title Duplication

**Problem:** `addTitleAndSanitizeContent()` always prepends the title from `getTitleFromDOM()`. If the user's include CSS selector already contains the title element (e.g., `article` which includes `h1`), the title is read twice.

**Impact:** Affects users who add broad selectors like `article` or `.post`.

**Fix:** Before prepending title, check if the extracted DOM content already starts with the title text. If it does, skip prepending.

```javascript
// In addTitleAndSanitizeContent() — TTSProHelper.js line 232
let domText = (contentFromDom?.textContent || '').trim();
let titleAlreadyInContent = title && domText.toLowerCase().startsWith(title.toLowerCase().trim());

if (index == 0 && !titleAlreadyInContent && ttaShouldAddDelimiter(title)) {
    finalContent = title + "" + delimiter;
} else if (!titleAlreadyInContent) {
    finalContent = title + " ";
}
```

**Backwards compatible:** Yes — only skips title when it's already present.

---

### Issue B: ACF Content Not Affecting Reading Time

**Problem:** ACF field content is appended in JS via `getCompatiblePluginContent()` AFTER the PHP `readingTime` is calculated. So the player timer doesn't account for ACF content length.

**Already fixed in TTS-232:** `recalculateReadingTime()` is called at the end of `getContent()` after ACF content is appended. The reading time now reflects the full content including ACF fields.

---

### Issue C: Per-Post Selector Override is All-or-Nothing

**Problem:** When `tta__settings_use_own_css_selectors` is enabled on a post, ALL four settings (include, exclude, tags, texts) come from per-post meta. User can't override just one field while keeping global values for the rest.

**Fix:** In `TTA_Helper::tts_get_settings()`, merge per-post settings field-by-field instead of bulk override. Only override fields that have non-empty per-post values.

```php
// In TTA_Helper.php tts_get_settings() — line ~500
$css_fields = [
    'tta__settings_css_selectors',
    'tta__settings_exclude_content_by_css_selectors',
    'tta__settings_exclude_texts',
    'tta__settings_exclude_tags',
];

foreach ($css_fields as $field) {
    if (!empty($post_css_selectors[$field])) {
        $settings[$field] = $post_css_selectors[$field];
    }
    // If per-post field is empty, keep global value (current behavior overwrites with empty)
}
```

**Backwards compatible:** Yes — users who set all fields get same behavior. Users who set only some fields get improved behavior (keep global for unset fields).

---

### Issue D: No Smart Builder/Theme Detection

**Problem:** Most users using Elementor, Divi, or other builders don't know they need to configure CSS selectors. The player reads nothing or only the title.

**Already partially fixed in TTS-232:** Added `COMMON_CONTENT_SELECTORS` fallback array with 12 common selectors. But this only runs when no wrapper AND no CSS selectors are configured.

**Enhancement:** Add more selectors and make the list filterable:

```javascript
// Additional selectors to add to COMMON_CONTENT_SELECTORS
'.elementor-widget-theme-post-content .elementor-widget-container',  // Already added
'.elementor .elementor-section-wrap',                                 // Elementor sections
'.et_pb_post_content',                                                // Already added
'.et_pb_section',                                                     // Divi sections
'.fl-post-content',                                                   // Already added
'.fl-builder-content',                                                // Beaver Builder
'.wp-block-post-content',                                             // Already added
'.theme-flavor .entry-content',                                       // Flavor theme (kn.nl customer)
'.content-area .site-main article',                                   // Twenty Twenty variants
'.gb-container',                                                      // GenerateBlocks
'.kadence-column',                                                    // Kadence
'.ast-article-single .entry-content',                                 // Astra
'.oceanwp-content-area .entry-content',                               // OceanWP
'.suki-content-area article .entry-content',                          // Suki
```

**Filter hook already exists:** `wp.hooks.applyFilters('ttsCommonContentSelectors', selectors)` — developers can add theme-specific selectors.

---

### Issue E: Title Cascade Missing Some Themes

**Enhancement:** Add more title selectors to `getTitleFromDOM()`:

```javascript
// Additional title selectors
'.wp-block-post-title',          // Full Site Editing themes
'.elementor-page-title',         // Elementor page title widget
'#genesis-title',                // Genesis framework
'.ast-single-post-title',       // Astra
'.kadence-title .entry-title',  // Kadence
'.oceanwp-single-title',        // OceanWP
```

**Backwards compatible:** Yes — cascading selectors, only used if earlier ones fail.

---

### Issue F: ACF Only Supports Text Fields

**Problem:** `TTA_Pro_Helper::acf_plugin_content()` at line 1263 checks `is_string($field['value'])`. This skips:
- WYSIWYG/textarea fields that return HTML strings (these actually work since HTML is a string)
- Repeater fields (returns array)
- Flexible content fields (returns array)

**Enhancement:** Add support for repeater fields by recursively extracting text values:

```php
if (is_string($field['value'])) {
    $data[$field_name] = wp_strip_all_tags($field['value']);
} elseif (is_array($field['value'])) {
    // Repeater/flexible content: flatten to text
    $texts = [];
    array_walk_recursive($field['value'], function($value) use (&$texts) {
        if (is_string($value) && !empty(trim($value))) {
            $texts[] = wp_strip_all_tags($value);
        }
    });
    if (!empty($texts)) {
        $data[$field_name] = implode('. ', $texts);
    }
}
```

**Backwards compatible:** Yes — current text fields work identically. New types get added support.

---

### Issue G: Other Meta/CPT Plugins Not Supported

**Problem:** Only ACF is officially supported. Pods, Meta Box, JetEngine, Toolset users have no built-in integration.

**Solution:** The `tts_pro_compatible_plugins_content` filter already exists. Document it:

```php
// Example for Meta Box plugin:
add_filter('tts_pro_compatible_plugins_content', function($data, $compatible_data, $post) {
    if (function_exists('rwmb_get_value')) {
        $value = rwmb_get_value('my_field', [], $post->ID);
        if (is_string($value)) {
            $data['meta_box_my_field'] = $value;
        }
    }
    return $data;
}, 10, 3);
```

**Action:** Add this documentation to the Docs/FAQ tab in the dashboard, and create a knowledge base article.

---

## 3. Implementation Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| Done | B: ACF reading time | TTS-232 | High |
| Done | D: Common selectors fallback | TTS-232 | High |
| P1 | A: Title duplication | Small (5 lines) | Medium — affects broad CSS selector users |
| P1 | E: More title selectors | Small (10 lines) | Medium — better builder/theme support |
| P2 | C: Per-post selector merging | Medium | Low — Pro users only |
| P2 | F: ACF repeater support | Medium | Medium — ACF Pro users |
| P3 | G: CPT plugin docs | Docs only | Low — helps developers |
| P3 | D+: More common selectors | Small | Low — covered by manual CSS config |

---

## 4. UI Hints + Documentation Plan

### Issue H: Add Inline Helper Text to CSS Selector Fields

**Problem:** Users don't understand what each field does, what format to use, or how the fields relate to each other. This leads to misconfiguration (e.g., adding sidebar selectors to "Include", not knowing excludes are scoped within includes).

**Applies to:** Settings page (global) + CSSSelectorsForPosts (per-post) — same fields in both.

#### 4.1 Inline Helper Text (under each field)

**Include Content By CSS Selectors**
```
Current placeholder: "Multiple selector will be multiline."
```
**Proposed helper text:**
```
Add CSS selectors for the content areas the player should read.
One selector per line. Only target post/page body content — do not include header, sidebar, or footer.
Examples: .entry-content, .post-content, [itemprop="articleBody"]
If left empty, the player automatically detects the content area.
```

**Exclude Content By CSS Selectors**
```
Current placeholder: "Exclude content by CSS selectors"
```
**Proposed helper text:**
```
Remove specific elements from the content areas above.
One selector per line. These are applied within each "Include" selector — not the whole page.
Examples: .social-share, .related-posts, .author-bio, .wp-caption-text
```

**Exclude HTML Tags To Speak**
```
Current placeholder: "Multiple Tags Will Be Pipe(|) Separated."
```
**Proposed helper text:**
```
HTML tags to skip when reading content. Pipe-separated.
These are removed within each "Include" selector scope.
script, style, figure, and figcaption are always excluded automatically.
Example: sub|sup|caption|blockquote
```

**Exclude Texts To Speak**
```
Current placeholder: "Multiple Texts Will Be Pipe(|) Separated."
```
**Proposed helper text:**
```
Exact text patterns to remove from the spoken content. Pipe-separated.
Applied after all CSS/tag exclusions.
Example: Read more...|Advertisement|Sponsored Content|Click here
```

**Add ACF Fields To Posts** (Compatibility tab)
```
Current: No helper text
```
**Proposed helper text:**
```
Selected fields are read after the main article content, in the order you select them.
If a field is already visible in your post content area, it may be read twice.
For visible fields, use "Include Content By CSS Selectors" in Settings instead to control reading order.
```

#### 4.2 Files to Modify

| File | Fields |
|------|--------|
| `src/dashboard/components/dashboard/settings/Settings.js` | All 4 CSS selector fields (global) |
| `src/dashboard/css-selectors/CSSSelectorsForPosts.js` | All 4 CSS selector fields (per-post) |
| `src/dashboard/components/dashboard/compatibility/Compatibility.js` | ACF fields helper text |

#### 4.3 Implementation Notes

- Use `<Form.Text className="text-muted">` under each `<Form.Control>` for helper text
- Wrap helper text in `__()` for translation
- Keep existing placeholders — helper text goes below the field, not inside it
- Use the existing YouTube/info icon pattern to link to full documentation

---

### Issue I: Full Documentation Page

**Where:** AtlasVoice website knowledge base + Docs tab in dashboard

#### 4.4 Documentation Structure

```
# Content Extraction & CSS Selectors Guide

## How AtlasVoice Reads Your Content
- Automatic detection (default — no config needed)
- Custom CSS selectors (for advanced control)
- Per-post override (Pro feature)

## Include Content By CSS Selectors
- What it does
- Format: one selector per line
- How to find the right selector (browser DevTools guide)
- Common selectors by theme/builder:
  | Theme/Builder | Content Selector |
  |--------------|-----------------|
  | Most WP themes | .entry-content |
  | Elementor | .elementor-widget-theme-post-content .elementor-widget-container |
  | Divi | .et_pb_post_content |
  | Beaver Builder | .fl-post-content |
  | GeneratePress | .entry-content |
  | Astra | .entry-content |
  | Kadence | .entry-content |
  | OceanWP | .entry-content |
  | Block themes (FSE) | .wp-block-post-content |
  | Flavor/Flavor theme | .td-post-content |
- Reading order: selectors are read top-to-bottom as listed
- Title handling: if your selector includes the title, it won't be duplicated (after Issue A fix)

## Exclude Content By CSS Selectors
- What it does: removes elements WITHIN each include selector
- NOT applied to the whole page — only within included content
- Format: one selector per line
- Common exclude selectors:
  - .social-share, .share-buttons — social sharing widgets
  - .related-posts, .yarpp-related — related posts sections
  - .author-bio, .author-box — author information
  - .wp-caption-text, figcaption — image captions
  - .toc, .table-of-contents — table of contents
  - .ad-container, .advertisement — ad blocks
  - .comments-area — comments section
  - nav, aside — navigation and sidebars (if inside content area)

## Exclude HTML Tags To Speak
- What it does: removes HTML tag types within included content
- Format: pipe-separated tag names (no angle brackets)
- Always excluded automatically: script, style, figure, figcaption
- Common tags to exclude: sub, sup, caption, blockquote, code, pre

## Exclude Texts To Speak
- What it does: removes exact text patterns from the final spoken text
- Format: pipe-separated text strings
- Applied AFTER all CSS/tag exclusions
- Use for: disclaimers, CTAs, repeated phrases, navigation text
- Example: Read more...|Advertisement|Sponsored Content

## ACF Fields Integration
- For fields VISIBLE on the page: use Include CSS Selectors instead (better reading order)
- For fields NOT displayed on page: select in Compatibility tab (appended at end)
- Currently supports text fields only

## Per-Post Overrides (Pro)
- Enable "Use Own CSS Selectors" on individual posts
- Overrides global settings for that post only
- Useful for posts with unique layouts

## Troubleshooting
- Player reads only the title → content selector not found, add Include CSS selector
- Content read twice → your Include selector captures the title, wait for title dedup fix
- Wrong reading order → reorder your Include selectors (read top-to-bottom)
- Player reads sidebar/footer → your selector is too broad, use a more specific one
- Reading time wrong → fixed in latest version (recalculated on frontend)
```

#### 4.5 Dashboard Docs Tab

Add a section in `src/dashboard/components/dashboard/docs/` that links to the full documentation page. Add quick-reference cards for the most common scenarios.

---

## 5. Testing Matrix for Any Changes

| Scenario | Expected Behavior |
|----------|-------------------|
| No config, auto-button ON | Wrapper div, full content, correct time |
| No config, shortcode only | Common selector fallback, full content, correct time |
| Global CSS selectors set | Uses those selectors, excludes work |
| Per-post CSS selectors set | Overrides global, per-post selectors used |
| ACF fields selected | ACF content appended, reading time includes ACF |
| Elementor post | Auto-detected via `.elementor-widget-theme-post-content` |
| Divi post | Auto-detected via `.et_pb_post_content` |
| Standard WP theme | Auto-detected via `.entry-content` |
| Block theme (FSE) | Auto-detected via `.wp-block-post-content` |
| Title inside include selector | Title NOT duplicated |
| Shortcode with `text_to_read` attribute | Uses explicit text, ignores DOM |
| Very long article | Reading time > 1 minute, progress bar accurate |
