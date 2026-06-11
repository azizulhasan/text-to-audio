# Research: How TTS Plugins Extract Content

**Date:** 2026-04-03
**Plugins studied:** AtlasVoice, GSpeech, Mementor TTS, ResponsiveVoice

---

## 1. ResponsiveVoice Text To Speech

**Approach:** Pure PHP — simplest of all

**Content extraction:**
```php
// responsivevoice-text-to-speech.php:42-45
$content = get_the_content();
$content = apply_filters('responsivevoice_content_before_cleaning', $content);
$content = RV_clean_text($content);
$content = apply_filters('responsivevoice_content_after_cleaning', $content);
```

**Text cleaning** (`RV_clean_text()`, lines 172-227):
```php
// Strip shortcodes and HTML
$text = strip_shortcodes($text);
$text = strip_tags($text);

// Normalize quotes
$text = str_replace(array('&#8216;','&#8217;','&#8218;','&#8220;','&#8221;','&#8222;'),
                     array("\'","\'","","\"","\"","\""), $text);

// HTML entities to readable text
$text = str_replace('&nbsp;', ' ', $text);
$text = str_replace('&mdash;', '-', $text);
$text = str_replace('&copy;', '(c)', $text);
// ... more entity replacements

// Collapse whitespace
$text = preg_replace('/\s+/', ' ', $text);
```

**How content reaches the player** — embedded directly in onclick:
```php
// responsivevoice-text-to-speech.php:63-73
$button = '<p><button onclick="responsiveVoice.speak(\'' . esc_js($content) . '\', \'' . $voice . '\'' . $parameters . ');">
    🔊 ' . $buttontext . '
</button></p>';
```

**TTS engine:** External library from `https://code.responsivevoice.org/responsivevoice.js` — hybrid browser speech + cloud API with optional API key.

**Strengths:** Dead simple, zero failure points
**Weaknesses:** No title/excerpt separation, no CSS selectors, no builder support, no ACF, full text in HTML attribute

---

## 2. GSpeech

**Approach:** PHP marker injection + Cloud widget DOM extraction

**Step 1 — PHP injects metadata** (`gspeech_frontend.php:17-61`):
```php
// process_post_data() — hooked to the_content filter
$post_id = get_the_ID();
$title = get_the_title($post_id);
$categories = get_the_category($post_id);

// Inject hidden div with metadata
$content .= '<div class="gsp_post_data"
    data-post_type="' . get_post_type($post) . '"
    data-title="' . $title . '"
    data-home="' . home_url() . '"
    data-cat="' . $category_slug . '">
</div>';
```

**Step 2 — JS loads cloud widget** (`gspeech_front.js:36-116`):
```javascript
// Reads gsp_data_html element, validates via AJAX, loads external script
function loadCloudWidget() {
    var widget_id = gsp_data.getAttribute('data-w_id');
    var script = document.createElement('script');
    script.src = 'https://widget.gspeech.io/' + widget_id;
    document.head.appendChild(script);
}
```

**Step 3 — Cloud widget finds content via parent traversal** (from widget.gspeech.io):
```javascript
// Find the injected marker and go UP to parent — that's the content container
this.processContent = function() {
    if ($(".gsp_post_data").length) {
        $(".gsp_post_data").parent().addClass("gsp_dc");
    }
};

// Mark content elements with wrapper classes
$render_el_item.addClass("gsp_content_wrapper_set");
$render_el_item.addClass("gsp_block_wrp_" + block_id);
$render_el_item.parent('div').addClass("gsp_content_wrapper_wrp_set");
$render_el_item.parent('div').addClass("gsp_content_wrapper_parent_set");
```

**Step 4 — Content selectors from server config:**
```javascript
// Cloud widget receives config from GSpeech servers
var render_element = ssblock_item["render_element"];    // CSS selector
var content_selector = ssblock_item["content_selector"]; // content area
var render_pos = ssblock_item["render_pos"];             // position
```

**TTS engine:** GSpeech cloud API or Google Translate TTS (v2.x)

**Strengths:** Parent traversal technique is brilliant — finds content regardless of theme. Server-configured selectors.
**Weaknesses:** Requires internet, depends on external cloud widget, no offline support

---

## 3. Mementor Text-to-Speech TTS

**Approach:** PHP-side DOMDocument + XPath — most robust extraction

**Content rendering** (`class-mementor-tts-ajax.php:220-262`):
```php
// Render content through WordPress filters first
$rendered_content = apply_filters('the_content', $post->post_content);

// Then parse with DOMDocument
$content = $processor->get_content_from_html($rendered_content);
```

**DOMDocument extraction** (`class-mementor-tts-processor.php:1311-1597`):
```php
function get_content_from_html($html) {
    $doc = new DOMDocument();
    @$doc->loadHTML('<?xml encoding="UTF-8">' . $html);
    $xpath = new DOMXPath($doc);

    // Try CSS selectors first
    $default_selectors = '.post-content, .wp-block-post-content, .page-content';
    $excluded = '#ad-wrapper, .sidebar, .comments, .advertisement, .mementor-tts-player-container';

    // Query with XPath
    $nodes = $xpath->query($css_to_xpath($selectors));

    // Fallback: extract all text elements
    if (empty($content)) {
        $nodes = $xpath->query('//p | //h1 | //h2 | //h3 | //h4 | //h5 | //h6 | //li');
    }

    // Deduplication — remove substring duplicates
    $seen_texts = [];
    foreach ($extracted as $text) {
        $is_duplicate = false;
        foreach ($seen_texts as $seen) {
            if (strpos($seen, $text) !== false) {
                $is_duplicate = true;
                break;
            }
        }
        if (!$is_duplicate) {
            $seen_texts[] = $text;
        }
    }

    return implode(' -- ', $seen_texts);
}
```

**Fusion Builder (Avada) special handling** (`processor.php:1316-1439`):
```php
// Detect Fusion Builder
if (strpos($html, 'fusion-text') !== false || strpos($html, 'fusion-fullwidth') !== false) {
    // Extract from fusion-text containers specifically
    $nodes = $xpath->query('//div[contains(@class, "fusion-text")]//p |
                           //div[contains(@class, "fusion-text")]//h1 |
                           //div[contains(@class, "fusion-text")]//h2');
}
```

**Content assembly order** (`class-mementor-tts-ajax.php:175-282`):
```php
$full_text = '';

// 1. Custom intro
$full_text .= get_option('mementor_tts_text_before') . ' -- ';

// 2. Title (with optional author + date)
if (get_option('mementor_tts_include_title', true)) {
    $full_text .= $post->post_title;
    if (get_option('mementor_tts_include_author')) {
        $full_text .= ' -- ' . get_the_author();
    }
}

// 3. Excerpt
if (get_option('mementor_tts_include_excerpt', false)) {
    $full_text .= ' -- ' . wp_strip_all_tags(get_the_excerpt($post));
}

// 4. Body content (from DOMDocument)
$full_text .= ' -- ' . $body_content;

// 5. Custom outro
$full_text .= ' -- ' . get_option('mementor_tts_text_after');
```

**TTS engine:** ElevenLabs API only — server-side generation, stores MP3 in database

**Strengths:** PHP DOMDocument is the most reliable extraction — works regardless of JS, handles all builders server-side. Substring deduplication prevents double-reading.
**Weaknesses:** ElevenLabs only, no browser speech, no ACF support, no per-post selector overrides

---

## 4. AtlasVoice (Our Plugin)

**Approach:** PHP extraction + JS DOM extraction with multiple fallbacks

**PHP content extraction** (`helpers.php:102-284`):
```php
// Build content from post
$content = $title;
$content .= $excerpt_sanitized;
$content .= apply_filters('tta__content_description', $description, $post->ID, $post);

// ACF fields appended
$compatible_content = apply_filters('tts_compatible_plugins_content', [], $compatible_data, $post);
// ... append ACF values

// Intro/outro for free users
if (!is_pro_active()) {
    $content = $text_before_content . ' ' . $content;
    $content .= ' ' . $text_after_content;
}
```

**JS DOM extraction** (`TTSProHelper.js:530-573`):
```javascript
// Priority chain:
// 1. User-configured CSS selectors
if (selectorKeys.includes('tta__settings_css_selectors')) {
    for (let selector of includeSelectors) {
        let el = document.querySelector(selector);
        if (el) {
            contentFromDom += getContentFromHTMLDOM(el.cloneNode(true), excludeSelectors);
        }
    }
}
// 2. tts_content_wrapper_X (auto-button mode)
else {
    let wrapper = document.querySelector('.tts_content_wrapper_' + buttonId);
    if (wrapper) {
        contentFromDom = getContentFromHTMLDOM(wrapper.cloneNode(true), excludeSelectors);
    }
    // 3. Common theme selectors fallback
    else {
        contentFromDom = getContentFromCommonSelectors(excludeSelectors);
    }
}

// Common selectors list
const COMMON_CONTENT_SELECTORS = [
    '.entry-content',
    'article .entry-content',
    '.post-content',
    '[itemprop="articleBody"]',
    '.elementor-widget-theme-post-content .elementor-widget-container',
    '.et_pb_post_content',
    '.fl-post-content',
    '.wp-block-post-content',
    // ... more selectors
];
```

**Title deduplication** (`TTSProHelper.js:231-244`):
```javascript
let domText = (domContent || '').trim();
let titleAlreadyInContent = title && domText.toLowerCase().startsWith(title.toLowerCase().trim());

if (titleAlreadyInContent) {
    finalContent = ''; // Skip title — already in DOM content
} else {
    finalContent = title + delimiter;
}
```

**Cache fingerprint** (`TTSProHelper.js:1048-1062`):
```javascript
const getContentSettingsFingerprint = (tts, buttonId) => {
    return JSON.stringify({
        before: tts?.extra?.[buttonId]?.text_before_content ?? '',
        after: tts?.extra?.[buttonId]?.text_after_content ?? '',
        include: ttsObj.settings?.settings?.tta__settings_css_selectors ?? '',
        exclude: ttsObj.settings?.settings?.tta__settings_exclude_content_by_css_selectors ?? '',
        tags: ttsObj.settings?.settings?.tta__settings_exclude_tags ?? '',
        texts: ttsObj.settings?.settings?.tta__settings_exclude_texts ?? '',
        acf: tts?.extra?.[buttonId]?.compatible_contents ?? {},
    });
};
```

**TTS engine:** Browser speech synthesis + Google Cloud TTS + ChatGPT TTS + ElevenLabs

**Strengths:** Most features (ACF, multilingual, per-post overrides, 4 TTS engines, offline). Cache fingerprint for smart invalidation.
**Weaknesses:** Complex content extraction with many paths — more failure points than simpler approaches

---

## Comparison Matrix

| Feature | ResponsiveVoice | GSpeech | Mementor TTS | AtlasVoice |
|---------|----------------|---------|-------------|------------|
| Content source | `get_the_content()` | Cloud widget DOM | PHP DOMDocument + XPath | PHP + JS DOM |
| CSS selectors | None | Cloud config | PHP XPath | JS querySelector |
| Title handling | Not separate | Data attribute | Separate with author/date | Separate + dedup |
| Excerpt | Not handled | Not separate | Optional | Optional |
| ACF support | No | No | No | Yes (native) |
| Exclude selectors | No | No | Yes (XPath) | Yes (JS) |
| Exclude tags | No | No | No | Yes |
| Exclude texts | No | No | No | Yes |
| Per-post overrides | No | No | No | Yes |
| Builder support | Shortcodes only | Cloud auto-detect | Fusion Builder dedicated | Common selectors + config |
| Content deduplication | No | No | Yes (substring) | Yes (title dedup) |
| TTS engines | ResponsiveVoice (browser+cloud) | GSpeech/Google cloud | ElevenLabs only | Browser + Google + ChatGPT + ElevenLabs |
| Offline | Partial | No | No | Yes |
| Reading time | No | No | No | Yes (PHP + JS) |
| Multilingual | No | No | No | Yes (WPML, GTranslate, TranslatePress, Polylang) |
| Cache system | No | No | Database | Session storage + fingerprint |
| Intro/outro | No | No | Yes | Yes |
| Complexity | Low | Medium | High | High |

---

## Recommendations for AtlasVoice

### Adopt from GSpeech: Parent traversal technique
Instead of maintaining a list of common selectors, find our own button element and traverse UP to the content container:
```javascript
let button = document.querySelector('.tts__listent_content[data-id="' + buttonId + '"]');
let contentContainer = button?.closest('.entry-content, article, [itemprop="articleBody"]')
                      || button?.parentElement;
```
This automatically works with any theme because we find content from inside out.

### Adopt from Mementor: PHP DOMDocument as option
Consider adding server-side DOMDocument extraction as a fallback. This would make `ttsCurrentContent` always contain the full article, eliminating JS DOM extraction failures:
```php
$rendered = apply_filters('the_content', $post->post_content);
$doc = new DOMDocument();
@$doc->loadHTML($rendered);
$xpath = new DOMXPath($doc);
$nodes = $xpath->query('//p | //h1 | //h2 | //h3 | //h4 | //h5 | //h6 | //li');
```

### Keep from ResponsiveVoice: Simplicity principle
The simpler the extraction, the fewer bugs. Consider reducing the number of content paths in `getContent()` from 3 (non-DOM, cached, DOM) to a cleaner pipeline.

---

## Verdict: Which is Best?

**For feature completeness:** AtlasVoice — no other plugin comes close in features (ACF, multilingual, 4 TTS engines, per-post overrides, offline support)

**For content extraction reliability:** Mementor TTS — PHP DOMDocument + XPath is the most robust, works regardless of JS

**For auto-detection simplicity:** GSpeech — parent traversal from injected marker finds content automatically

**For overall simplicity:** ResponsiveVoice — `get_the_content()` and done, but with minimal features

**Best overall approach would combine:** AtlasVoice features + GSpeech parent traversal + Mementor DOMDocument fallback
