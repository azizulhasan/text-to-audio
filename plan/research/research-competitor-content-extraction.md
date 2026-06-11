# Research: How TTS Plugins Extract Content

**Date:** 2026-04-03 (updated 2026-04-20)
**Plugins studied:** AtlasVoice, GSpeech, Mementor TTS, ResponsiveVoice, SpeechKit (BeyondWords), Trinity Audio

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

## 5. SpeechKit (BeyondWords)

**Installed via:** `wp plugin install speechkit` (v6.3.0)
**Location:** `wp-content/plugins/speechkit/`
**Approach:** Cloud-only. WordPress is a content *feeder* to the BeyondWords API — the audio player is a remote widget that renders audio generated server-side by BeyondWords.

**Content extraction** (`src/Component/Post/PostContentUtils.php`):

```php
// getPostBody($post) — builds the HTML payload sent to BeyondWords
// Gutenberg path:
$blocks = parse_blocks( $post->post_content );
$html   = '';
foreach ( $blocks as $block ) {
    // Skip blocks the editor marked `beyondwordsAudio: false`
    if ( isset( $block['attrs']['beyondwordsAudio'] ) && ! $block['attrs']['beyondwordsAudio'] ) {
        continue;
    }
    $html .= render_block( $block );
}

// Classic path:
$html = apply_filters( 'the_content', $post->post_content );
```

**Payload assembly** (`PostContentUtils::getContentParams()`):
```php
return wp_json_encode( [
    'title'        => get_the_title( $postId ),
    'summary'      => $summary,           // excerpt, optional, wrapped in <div data-beyondwords-summary>
    'body'         => $body,              // rendered HTML from above
    'image_url'    => $featured_image,
    'publish_date' => $published,
    'author'       => get_the_author_meta( 'display_name', $post->post_author ),
    'metadata'     => [ 'taxonomies' => ... ],
] );
```

The JSON is POSTed to BeyondWords' REST API on post save. BeyondWords renders HTML → audio on its servers, returns a `content_id`, and the WordPress side stores only that ID. The frontend player is a remote `<script>` widget (`/src/Core/Player/Renderer/Javascript.php`) that auto-prepends via `add_filter('the_content', ..., 1000000)`.

**Per-block exclusion in Gutenberg:**
```json
// Block attrs written by the BeyondWords editor sidebar
{ "attrs": { "beyondwordsAudio": false } }
```
This is the ONLY granular control — no CSS selectors, no tag/text exclusions, no per-site selector list.

**Excerpt handling:**
```php
// Option `beyondwords_prepend_excerpt` controls whether excerpt is sent as summary
$summary = wpautop( apply_filters( 'get_the_excerpt', $post->post_excerpt, $post ) );
$summary = '<div data-beyondwords-summary>' . $summary . '</div>';
```

**TTS engine:** BeyondWords cloud (SaaS) — aggregates Google Cloud, AWS Polly, Microsoft Azure, ElevenLabs voices. Requires active API key and project ID. No local/browser fallback.

**Strengths:**
- Uses `the_content` filter *and* Gutenberg `render_block` → Elementor/ACF-the-content/shortcodes render fully server-side before leaving WordPress.
- Per-block opt-out is a clean editor UX — users toggle a block in the sidebar instead of writing CSS.
- Title, excerpt, body, image, author, publish-date, taxonomies all sent as structured JSON fields → BeyondWords can assign different voices per section (title voice vs body voice).
- WPGraphQL support baked in for headless WP.

**Weaknesses:**
- **Zero control over page-builder body containers.** No CSS selector include/exclude — if Elementor/Divi Theme Builder bypasses `the_content`, BeyondWords sees empty body and has no escape hatch.
- Classic editor + non-block themes get no granular exclusion at all (no "skip sidebar" equivalent).
- Fully cloud-dependent — no offline/browser voices, no local MP3 generation.
- No ACF custom-fields support — anything outside `post_content`/excerpt is invisible.

---

## 6. Trinity Audio

**Installed via:** `wp plugin install trinity-audio` (v5.26.0)
**Location:** `wp-content/plugins/trinity-audio/`
**Approach:** Cloud-only (Amazon Polly via Trinity backend). Content is pre-cleaned in PHP using a custom `simple_html_dom` parser; a content hash is sent to Trinity's cloud so the backend knows whether to regenerate audio.

**Content extraction** (`inc/common.php` + `inc/text.php`):

```php
// inc/common.php — build the text the player/backend will use
$post_id = get_the_ID();
$title   = get_the_title( $post_id );
$content = get_post_field( 'post_content', $post_id );   // RAW, not filtered

$clean = trinity_get_clean_text( $title, $content, $whitelist_shortcodes );
```

Trinity deliberately uses `get_post_field()` — bypassing `the_content` — then walks the HTML with a bundled `simple_html_dom` library:

```php
// inc/text.php — trinity_get_text_from_html()
$html = str_get_html( $content );

// Remove elements matching any user-configured "skip tag"
foreach ( $skip_tags as $tag ) {
    foreach ( $html->find( $tag ) as $el ) {
        $el->outertext = '';
    }
}

$text = $html->plaintext;     // strip to plaintext
$html->clear();
```

**Shortcode whitelist** (`inc/text.php`):
```php
// Non-whitelisted shortcodes are regex-stripped BEFORE do_shortcode runs
$content = preg_replace( '/\[(?!' . $whitelist_regex . ')[^\]]+\]/', '', $content );
$content = do_shortcode( $content );   // only whitelisted ones survive
```
User configures whitelist in settings (e.g. `vc_row, vc_column, su_heading`) so Visual Composer / Shortcodes Ultimate content can be kept.

**Hash-based versioning** (`inc/post-hashes.php`):
```php
// Three text variants are hashed and stored so Trinity backend knows when to regenerate
$hashes = [
    'title_content' => sha1( $title . ' ' . $cleaned ),
    'content_only'  => sha1( $cleaned ),
    'content_no_title' => sha1( $cleaned_without_title ),
];
update_post_meta( $post_id, 'trinity_audio_post_hashes', $hashes );
```

**Player injection** — hooks `the_content` at priority `99999` in `trinity.php`:
```php
add_filter( 'the_content', 'trinity_content_filter', 99999 );
```
Inside the filter it checks `in_the_loop()`, `is_singular()`, and the "Check for loop" option (`TRINITY_AUDIO_CHECK_FOR_LOOP`) — an explicit escape hatch for Divi / custom themes that don't call `the_loop()`.

**Config shipped to JS:**
```php
// inc/common.php — inline JS config read by the player
$config = [
    'cleanText'    => $title . ' ' . $cleaned,
    'headlineText' => $title,
    'articleText'  => $cleaned,          // content without title
    'metadata'     => [ 'author' => ..., 'pluginVersion' => ... ],
];
echo '<script>var TRINITY_TTS_WP_CONFIG = ' . wp_json_encode( $config ) . ';</script>';
```

**Content cleaning** (`inc/text.php`):
- Converts newlines / block-level breaks to custom pause markers (`BREAK_MACRO`, `BLOCK_MACRO`) so Polly gets intentional pauses.
- `html_entity_decode` → `strip_tags` → regex whitespace collapse.
- No CSS-selector exclusion — `skip_tags` is tag-name only (e.g. `blockquote`, `figure`, `pre`).

**TTS engine:** Amazon Polly via Trinity Audio cloud (freemium — ~5 articles/month free, paid tiers for more). No local/browser voices.

**Strengths:**
- **`simple_html_dom` parsing in PHP** — closer to what we want in Layer A of TTS-238. Robust against malformed markup, works without DOMDocument quirks.
- **Hash-based regeneration** — clean way to invalidate cloud audio only when content actually changed. Directly relevant to our MP3 cache fingerprint (`getContentSettingsFingerprint`).
- **Shortcode whitelist** — elegant middle ground: strip noisy shortcodes globally, keep builder ones selectively.
- **Pause/break macros** — injects intentional silence at block boundaries, gives Polly prosody hints. We don't do this.
- **"Check for loop" toggle** — pragmatic recognition that Divi / custom themes break `in_the_loop()`.

**Weaknesses:**
- **Bypasses `the_content` filter entirely.** Raw `post_content` → Gutenberg blocks, shortcodes (other than whitelisted), ACF-the-content, Elementor inline output, `do_blocks()`-rendered content all get dropped or mangled. Worse than our free plugin's current path.
- **Skip-tags is tag-name only**, no class/id selectors. Can't exclude `.sidebar`, `#ad-wrapper`, `[data-no-audio]`.
- **No per-post settings** (no per-post override, no per-post disable).
- **No excerpt support.** Only `title + post_content`.
- **No ACF / custom-fields support.**
- **Hash overhead for all posts** whether audio is enabled or not.

---

## Comparison Matrix

| Feature | ResponsiveVoice | GSpeech | Mementor TTS | SpeechKit | Trinity Audio | AtlasVoice |
|---------|----------------|---------|-------------|-----------|---------------|------------|
| Content source | `get_the_content()` | Cloud widget DOM | PHP DOMDocument + XPath | Gutenberg `render_block` + `the_content` | Raw `post_content` + simple_html_dom | PHP + JS DOM |
| Runs `the_content` filter | Yes (via `get_the_content()`? no — raw) | N/A (cloud) | Yes | Yes (classic path) | **No** | Partial (planned in TTS-238) |
| CSS selectors | None | Cloud config | PHP XPath | None | None (tag-name skip only) | JS querySelector |
| Title handling | Not separate | Data attribute | Separate with author/date | Separate JSON field | Separate variant | Separate + dedup |
| Excerpt | Not handled | Not separate | Optional | Optional (`beyondwords_prepend_excerpt`) | Not supported | Optional |
| ACF support | No | No | No | No | No | Yes (native) |
| Exclude selectors | No | No | Yes (XPath) | No | No | Yes (JS) |
| Exclude tags | No | No | No | No | Yes (`skip_tags`) | Yes |
| Exclude texts | No | No | No | No | No | Yes |
| Per-post overrides | No | No | No | Per-block `beyondwordsAudio` | No | Yes |
| Builder support | Shortcodes only | Cloud auto-detect | Fusion Builder dedicated | Gutenberg block-aware | Shortcode whitelist + "loop" toggle | Common selectors + config |
| Content deduplication | No | No | Yes (substring) | No | No | Yes (title dedup) |
| Content hashing / invalidation | No | No | No | Content ID per post | **sha1 per variant** | Session fingerprint (JS) |
| TTS engines | ResponsiveVoice (browser+cloud) | GSpeech/Google cloud | ElevenLabs only | BeyondWords SaaS (Google/AWS/Azure/ElevenLabs) | Amazon Polly (via Trinity cloud) | Browser + Google + ChatGPT + ElevenLabs |
| Offline | Partial | No | No | No | No | Yes |
| Reading time | No | No | No | No | No | Yes (PHP + JS) |
| Multilingual | No | No | No | Voice-per-section | No | Yes (WPML, GTranslate, TranslatePress, Polylang) |
| Cache system | No | No | Database | Cloud `content_id` | Post meta hashes | Session storage + fingerprint |
| Intro/outro | No | No | Yes | No | Pause/break macros | Yes |
| Complexity | Low | Medium | High | Medium | Medium | High |

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

### Adopt from SpeechKit: Gutenberg block-level opt-out
Per-block `beyondwordsAudio: false` is a cleaner editor UX than CSS-selector excludes for the Gutenberg path. In our Pro plugin we could add a block-inspector toggle and persist it on `block.attrs.ttsAudio`. Then Layer A's extractor skips those blocks in `parse_blocks()` before rendering. No new settings page, no selector guessing.

### Adopt from SpeechKit: Structured content payload
SpeechKit sends `{ title, summary, body, image_url, author, publish_date, metadata }` as discrete fields, not a concatenated string. This lets the cloud engine apply different voices / prosody per section. Useful for our Pro ChatGPT + ElevenLabs players — currently we hand them one giant string.

### Adopt from Trinity Audio: Content hash for regeneration
Trinity stores per-post sha1 hashes and uses them to decide whether cloud audio must be regenerated. We already have a JS-side `getContentSettingsFingerprint`, but nothing on the PHP side. A PHP fingerprint stored in post meta (title + extracted body + settings) would let Bulk MP3 skip unchanged posts and correctly invalidate stale MP3s after content edits.

### Adopt from Trinity Audio: Shortcode whitelist
Instead of either `strip_shortcodes()` or `do_shortcode()` wholesale, let users whitelist a small set (`vc_row, su_heading, fusion_text, …`). Cheap to implement as a comma-separated setting and solves the "shortcode name gets read aloud" complaint without forcing full rendering of every plugin's shortcodes.

### Avoid Trinity Audio's mistake: Never bypass `the_content`
Trinity reads raw `post_content` via `get_post_field()` and loses every builder's output. This is exactly the F4 failure mode in TTS-238. Layer A must always run `apply_filters('the_content', …)` first — the opposite of Trinity's choice.

---

## Verdict: Which is Best?

**For feature completeness:** AtlasVoice — no other plugin comes close in features (ACF, multilingual, 4 TTS engines, per-post overrides, offline support)

**For content extraction reliability:** Mementor TTS — PHP DOMDocument + XPath is the most robust, works regardless of JS

**For auto-detection simplicity:** GSpeech — parent traversal from injected marker finds content automatically

**For overall simplicity:** ResponsiveVoice — `get_the_content()` and done, but with minimal features

**Best overall approach would combine:** AtlasVoice features + GSpeech parent traversal + Mementor DOMDocument fallback + SpeechKit's Gutenberg block-level opt-out and structured payload + Trinity's per-post content hash (while explicitly avoiding its bypass of `the_content`).

---

## Update log

- **2026-04-20** — Added sections for SpeechKit (BeyondWords v6.3.0) and Trinity Audio (v5.26.0). Both plugins installed via `wp plugin install` into the local WP (`wp-content/plugins/speechkit`, `wp-content/plugins/trinity-audio`). Matrix extended with two new columns and a "Runs `the_content` filter" row (Trinity's single biggest weakness). Recommendations section extended with 5 new items (block-level opt-out, structured payload, PHP content hash, shortcode whitelist, and an explicit anti-pattern callout to never bypass `the_content`).
