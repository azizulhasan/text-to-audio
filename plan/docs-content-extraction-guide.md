# Content Extraction & CSS Selectors Guide

## How AtlasVoice Reads Your Content

AtlasVoice automatically detects and reads your post content. By default, no configuration is needed — the plugin finds the content area automatically for most WordPress themes and page builders.

For advanced control, you can configure exactly which parts of your page the player reads using CSS selectors.

### Default Behavior (No Configuration)

When no CSS selectors are configured, AtlasVoice uses this priority chain to find content:

1. Content wrapper (when "Add Button Automatically" is enabled)
2. Common theme content selectors (`.entry-content`, `[itemprop="articleBody"]`, etc.)
3. PHP-extracted post content (final fallback)

This works automatically with most WordPress themes including Astra, GeneratePress, OceanWP, Kadence, and block themes.

---

## Include Content By CSS Selectors (Pro)

Use this to tell AtlasVoice exactly which page areas to read.

### Format
One CSS selector per line:
```
.entry-content
.custom-field-area
```

### How It Works
- Each selector targets a specific DOM element on your page
- Content is read **top-to-bottom** in the order you list the selectors
- Only target post/page body content — do **not** include header, sidebar, or footer selectors
- If left empty, the plugin automatically detects the content area

### Common Selectors by Theme/Builder

| Theme/Builder | Content Selector |
|--------------|-----------------|
| Most WordPress themes | `.entry-content` |
| Elementor | `.elementor-widget-theme-post-content .elementor-widget-container` |
| Divi | `.et_pb_post_content` |
| Beaver Builder | `.fl-post-content` or `.fl-builder-content` |
| GeneratePress | `.entry-content` |
| Astra | `.entry-content` or `.ast-article-single .entry-content` |
| Kadence | `.entry-content` |
| OceanWP | `.entry-content` or `.oceanwp-content-area .entry-content` |
| Block themes (FSE) | `.wp-block-post-content` |
| Flavor/Flavor theme | `.td-post-content` |

### Tips
- Use your browser's DevTools (right-click > Inspect) to find the correct CSS selector for your theme
- If the title is inside your selector (e.g., you used `article`), AtlasVoice will automatically avoid reading it twice
- You can add multiple selectors to combine content from different page areas

---

## Exclude Content By CSS Selectors (Pro)

Remove specific elements **within** the included content areas.

### Format
One CSS selector per line:
```
.social-share
.related-posts
.author-bio
```

### How It Works
- These selectors are applied **within each "Include" selector** — not the whole page
- Matching elements are removed before the text is extracted
- Use this for widgets, CTAs, or sections you don't want read aloud

### Common Exclude Selectors
- `.social-share`, `.share-buttons` — social sharing widgets
- `.related-posts`, `.yarpp-related` — related posts sections
- `.author-bio`, `.author-box` — author information
- `.wp-caption-text`, `figcaption` — image captions
- `.toc`, `.table-of-contents` — table of contents
- `.ad-container`, `.advertisement` — ad blocks
- `.comments-area` — comments section
- `nav`, `aside` — navigation and sidebars (if inside content area)

You can also add the class `.atlasvoice_no_read` to any HTML element in your theme to exclude it from being read.

---

## Exclude HTML Tags To Speak (Pro)

Remove all instances of specific HTML tag types within the included content.

### Format
Pipe-separated tag names (no angle brackets):
```
sub|sup|blockquote|code|pre
```

### How It Works
- Tags are removed within each "Include" selector scope
- `script`, `style`, `figure`, and `figcaption` are **always excluded automatically**
- Only add tags you specifically want to skip

### Common Tags to Exclude
- `sub` — subscript text
- `sup` — superscript text (footnote markers)
- `blockquote` — quoted text
- `code`, `pre` — code snippets
- `caption` — table captions
- `nav` — navigation elements

---

## Exclude Texts To Speak (Pro)

Remove exact text patterns from the spoken content.

### Format
Pipe-separated text strings:
```
Read more...|Advertisement|Sponsored Content|Click here
```

### How It Works
- Applied **after** all CSS selector and tag exclusions
- Matches exact text strings (case-sensitive)
- Useful for removing repeated phrases, CTAs, or boilerplate text that appears in content

---

## ACF Fields Integration

AtlasVoice can read content from Advanced Custom Fields (ACF) alongside your main post content.

### How to Set Up
1. Go to **AtlasVoice > Compatibility**
2. Under "Add ACF Fields To Posts", select the fields you want read
3. Save

### How It Works
- Selected fields are read **after** the main article content
- Fields are read in the **order you select them**
- Supports text fields and repeater/flexible content fields
- If a field is already visible in your post content area, it may be read twice

### When to Use CSS Selectors Instead
If your ACF fields are rendered on the page by your theme template, use "Include Content By CSS Selectors" instead. This gives you control over the reading order and avoids potential duplication.

Use the ACF integration in Compatibility for fields that are:
- Not displayed on the front-end page
- Stored as metadata only
- Used programmatically by your theme

---

## Per-Post Overrides (Pro)

You can override global CSS selector settings on individual posts.

### How to Set Up
1. Edit a post in WordPress
2. Find the "AtlasVoice CSS Selectors" meta box
3. Enable "Use Own CSS Selectors"
4. Configure the selectors for this specific post
5. Save

### How It Works
- Per-post settings override global settings for that post only
- Only non-empty per-post fields override the global values
- Empty per-post fields keep the global setting
- Useful for posts with unique layouts or special content structures

---

## For Developers: Custom Plugin Integration

If you're a theme or plugin developer, you can add custom content to AtlasVoice using the `tts_pro_compatible_plugins_content` filter:

```php
add_filter( 'tts_pro_compatible_plugins_content', function( $data, $compatible_data, $post ) {
    // Example: Add content from Meta Box plugin
    if ( function_exists( 'rwmb_get_value' ) ) {
        $value = rwmb_get_value( 'my_custom_field', array(), $post->ID );
        if ( is_string( $value ) && ! empty( $value ) ) {
            $data['meta_box_my_field'] = wp_strip_all_tags( $value );
        }
    }
    return $data;
}, 10, 3 );
```

You can also customize the automatic content detection selectors using a JavaScript filter:

```javascript
wp.hooks.addFilter( 'ttsCommonContentSelectors', 'my-theme', function( selectors ) {
    // Add your theme's content selector at the beginning (highest priority)
    selectors.unshift( '.my-theme-content-area' );
    return selectors;
} );
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Player reads only the title | Content selector not found | Add your theme's content selector to "Include Content By CSS Selectors" |
| Content is read twice | Include selector captures the title element | Fixed automatically in latest version |
| Wrong reading order | Selectors listed in wrong order | Reorder your Include selectors (read top-to-bottom) |
| Player reads sidebar/footer | Selector is too broad | Use a more specific selector (e.g., `.entry-content` instead of `article`) |
| Reading time is wrong | Content was extracted differently than expected | Fixed automatically — reading time recalculates on the frontend |
| ACF field read twice | Field is visible on page AND selected in Compatibility | Remove from Compatibility, use CSS selectors instead |
