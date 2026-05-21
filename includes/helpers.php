<?php

// Absolute path to the WordPress directory.
if (!defined('ABSPATH')) {
    die();
}

use TTA\TTA_Helper;

/**
 * Clean content like title/description.
 *
 * @param $text
 *
 * @return mixed|null
 */
function tta_clean_content($text)
{
    $quotationMarks = array(
        "'" => "\'",
        '"' => '\"',
        '&#8216;' => "\'",
        '&#8217;' => "\'",
        '&rsquo;' => "\'",
        '&lsquo;' => "\'",
        '&#8218;' => '',
        '&#8220;' => '\"',
        '&#8221;' => '\"',
        '&#8222;' => '\"',
        '&ldquo;' => '\"',
        '&rdquo;' => '\"',
        '&quot;' => '\"',
        // ADD these — actual Unicode characters (decoded by wp_strip_all_tags before replacements run)
        "\u{201C}" => '\"',  // " LEFT DOUBLE QUOTATION MARK
        "\u{201D}" => '\"',  // " RIGHT DOUBLE QUOTATION MARK
        "\u{2018}" => "\'",  // ' LEFT SINGLE QUOTATION MARK
        "\u{2019}" => "\'",  // ' RIGHT SINGLE QUOTATION MARK
        "\u{201A}" => "\'",  // ‚ SINGLE LOW-9 QUOTATION MARK
        "\u{201E}" => '\"',  // „ DOUBLE LOW-9 QUOTATION MARK
    );

    $otherMarks = array(
        '&auml;' => 'ä',
        '&Auml;' => 'Ä',
        '&ouml;' => 'ö',
        '&Ouml;' => 'Ö',
        '&uuml;' => 'ü',
        '&Uuml;' => 'Ü',
        '&szlig;' => 'ß',
        '&euro;' => '€',
        '&copy;' => '©',
        '&trade;' => '™',
        '&reg;' => '®',
        // TTS-235: Convert &nbsp; to a regular space instead of removing it.
        // Removing it joins words: "releasing&nbsp;nearly" became "releasingnearly".
        '&nbsp;' => ' ',
        '&mdash;' => '—',
        '&amp;' => '&',
        '&gt;' => 'greater than',
        '&lt;' => 'less than',
        '&#8211;' => '-',
        '&#8212;' => '—',
    );

    $text = apply_filters('tta_before_clean_content', $text);

    /**
     * TTS-239: Strip <figure>, <figcaption>, <aside> (with inner text) before
     * wp_strip_all_tags, which would otherwise keep caption/aside text and bake
     * it into generated audio for cloud providers (ChatGPT/GCTTS/ElevenLabs).
     */
    $text = preg_replace('#<(figure|figcaption|aside)\b[^>]*>.*?</\1>#is', '', $text);

    // TTS-235: Remove elements matching exclude CSS selectors before stripping tags.
    // When DOM reading is on, the JS path handles this via querySelectorAll().remove().
    // When DOM reading is off, we convert CSS selectors to regex and strip matching
    // elements from the HTML here. Supports .class, #id, and tag.class selectors.
    $text = TTA_Helper::strip_elements_by_css_selectors($text);

    // TTS-235: Add a space before tags only when preceded by a word character.
    // This prevents joining words when tags are stripped: "on<a>Kharg</a>" → "on Kharg"
    // But avoids adding space after punctuation: "diseases.</strong>" stays "diseases."
    $text = preg_replace('/(?<=\w)</', ' <', $text);

    $text = wp_strip_all_tags($text, true);

    // TTS-235: Ensure valid UTF-8 encoding after tag stripping.
    // Prevents multibyte characters (Hebrew, Arabic, etc.) from becoming corrupted (�).
    $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');

    $text = apply_filters('tta_after_clean_content', $text);

    // TTS-235: Convert Unicode special chars to ASCII equivalents.
    // wp_strip_all_tags decodes HTML entities (&#8211; → –, &nbsp; → \xC2\xA0),
    // so we must handle the actual Unicode characters here.
    $unicodeChars = array(
        "\u{2013}" => '-',  // – EN DASH
        "\u{2014}" => '-',  // — EM DASH
        "\u{2015}" => '-',  // ― HORIZONTAL BAR
        "\u{2012}" => '-',  // ‒ FIGURE DASH
        "\u{00A0}" => ' ',  // NON-BREAKING SPACE (decoded from &nbsp;)
    );
    $text = str_replace(array_keys($unicodeChars), array_values($unicodeChars), $text);

    $text = str_replace(array_keys($quotationMarks), array_values($quotationMarks), $text);
    $text = str_replace(array_keys($otherMarks), array_values($otherMarks), $text);


    $text = preg_replace('/\\\\{2,}"/', '\"', $text);
    $text = preg_replace("/\\\\{2,}'/", "\'", $text);

    $text = TTA_Helper::clean_string($text);

    return apply_filters('tta_clean_content', $text);

}

/**
 *
 */
function tta_should_add_delimiter($title, $delimiter)
{
    $delimiterArr = ['.', ',', '?', '!', '|', ';', ':', '¿', '¡', '،', '؟'];
    $end = substr($title, -1);
    if (in_array($end, $delimiterArr)) {
        return $title . ' ';
    }

    if (!$title) {
        return $title;
    }


    return $title . $delimiter . " ";

}


/**
 * @param $atts
 *
 * @param $is_block
 *
 */
function tta_get_button_content($atts, $is_block = false, $tag_content = '')
{
    
    static $player_number = 0;
    static $block_btn_no = 0;
    $player_number++;
    global $post;
    if(isset($atts['id']) && $atts['id']) {
        $post = get_post($atts['id']);
    }
    /**
     * TTS-168
     */
    if(is_admin()) {
        return;
    }

    // this is a pro feature to show button on blog main page with title and excerpt.
    if (!TTA_Helper::should_load_button($post, 'tta_get_button_content') || $block_btn_no > 0) {
        return;
    }

    $settings = TTA_Helper::tts_get_settings('settings');
    $customize = TTA_Helper::tts_get_settings('customize');

    if ($is_block) {
        $customize = TTA_Helper::get_block_css($atts, $customize);
        $block_btn_no++;
    }

    $date = TTA_Helper::get_post_date($post);
    $should_display_icon = isset($settings['tta__settings_display_btn_icon']) && $settings['tta__settings_display_btn_icon'] ? 'inline-block' : 'none';
    // TODO make it dynamic. now Recording it not available in UI.
    $sentence_delimiter =  apply_filters('tts_sentence_delimiter', '. ' );

    $get_content_from_dom = isset($settings['tta__settings_read_content_from_dom']) && $settings['tta__settings_read_content_from_dom'];

    $content = '';
    // Button listen text.
    if ($atts || has_filter('tta__button_text_arr')) {
        if (isset($atts['text_to_read']) && $atts['text_to_read']) {
            $content = tta_clean_content($atts['text_to_read']);
            $get_content_from_dom = false;
        }
    }

    if ($tag_content) {
        $content = tta_clean_content($tag_content);
        $get_content_from_dom = false;
    }

    $title = tta_clean_content($post->post_title);
    $title = tta_should_add_delimiter($title, $sentence_delimiter);
    $title = apply_filters('tta__content_title', $title, $post);
    $excerpt_sanitized = '';
    $text_before_content = '';
    $text_after_content = '';
    if(empty($content)) {
        if (isset($settings['tta__settings_add_post_excerpt_to_read']) && $settings['tta__settings_add_post_excerpt_to_read']) {
            /**
             * Version 1.9.15
             * When excerpt is empty is call this function wp_trim_excerpt
             * and then it take unlimited time. some time memory exhausted.
             * that is why this remove filter and backup then add it to
             * wp_filter object.
             */
            global $wp_filter;
            // Backup current filters
            $backup_filters = $wp_filter['get_the_excerpt'] ?? null;
            // Remove all filters
            remove_all_filters('get_the_excerpt');
            // Call excerpt without filters
            $excerpt = get_the_excerpt($post);
            // Restore filters
            if ( $backup_filters !== null ) {
                $wp_filter['get_the_excerpt'] = $backup_filters;
            }
            $excerpt_sanitized = tta_clean_content($excerpt);
            $excerpt_sanitized = tta_should_add_delimiter($excerpt_sanitized, $sentence_delimiter);
            $excerpt_sanitized = apply_filters('tta__content_excerpt', $excerpt_sanitized, $post);
        }

        $content = $title;
        if ($excerpt_sanitized) {
            $content .= $excerpt_sanitized;
        }

        $description = get_the_content(null, false, $post);
        $description_sanitized = $description;
        $content .= apply_filters('tta__content_description', $description_sanitized, $description, $post->ID, $post);


        $text_before_content = isset($settings['tta__settings_text_before_content']) && $settings['tta__settings_text_before_content'] ? $settings['tta__settings_text_before_content'] : '';
        $text_before_content = TTA_Helper::clean_content($text_before_content);
        $text_before_content = tta_should_add_delimiter($text_before_content, $sentence_delimiter);


        $text_after_content = isset($settings['tta__settings_text_after_content']) && $settings['tta__settings_text_after_content'] ? $settings['tta__settings_text_after_content'] : '';
        $text_after_content = TTA_Helper::clean_content($text_after_content);
        $text_after_content = tta_should_add_delimiter($text_after_content, $sentence_delimiter);


        // Append ACF/compatible plugin content to $content (before intro/outro).
        // This ensures ACF content is always in ttsCurrentContent regardless of DOM reading mode.
        $compatible_data = TTA_Helper::tts_get_settings('compatible');
        $compatible_content = apply_filters('tts_compatible_plugins_content', [], $compatible_data, $post);
        if (!empty($compatible_content)) {
            $acf_texts = [];
            if (isset($compatible_content['tts_acf_fields']) && is_array($compatible_content['tts_acf_fields'])) {
                foreach ($compatible_content['tts_acf_fields'] as $field_value) {
                    if (is_string($field_value) && !empty(trim($field_value))) {
                        $acf_texts[] = trim($field_value);
                    }
                }
            }
            if (!empty($acf_texts)) {
                $content .= ' ' . implode('. ', $acf_texts);
            }
        }

        // Pro plugin JS handles intro/outro in getContent() to ensure correct order:
        // intro + title + excerpt + body + ACF + outro
        // Free plugin reads ttsCurrentContent directly, so bake intro/outro into PHP content.
        if ( ! function_exists( 'is_pro_active' ) || ! is_pro_active() || get_player_id() == 1 ) {
            $content = $text_before_content . ' ' . $content;
            $content .= ' ' . $text_after_content;
        }
    }

    /**
     * Clean content, sanitize content. remove shortcode,
     * and then trim content.
     */

    $content = tta_clean_content($content);
    $content = TTA_Helper::sazitize_content($content);
    $content = TTA_Helper::clean_content($content);
    $content = trim($content);
    
    // Get content reading time.
    $content_read_time = apply_filters('tts_content_reading_time', 1, $content, $post);
    $text_arr = get_button_text($atts, $content_read_time);

    $use_old_player = isset($settings['tta__settings_player_use_old_player']) && $settings['tta__settings_player_use_old_player'];
    $use_old_player = apply_filters('tts_player_use_old_player', $use_old_player, $post);
    $justify_content_css = $use_old_player ?  ' center' : ' space-between' ;

    // Button style.
    $backgroundColor = isset($customize['backgroundColor']) ? $customize['backgroundColor'] : '#184c53';
    $color = isset($customize['color']) ? $customize['color'] : '#ffffff';
    $width = isset($customize['width']) ? $customize['width'] : '100';
    $height = isset($customize['height']) ? $customize['height'] . 'px' : '50px';
    $border = isset($customize['border']) ? $customize['border'] . 'px' : '0px';
    $border_color = isset($customize['border_color']) ? $customize['border_color'] : '#000000';
    $border_radius = isset($customize['borderRadius']) ? $customize['borderRadius'] . 'px' : '4px';
    $border = $border . ' solid ' . $border_color;
    $font_size = isset($customize['fontSize']) ? $customize['fontSize'] . 'px' : '18px';
    $margin_top = isset($customize['marginTop']) ? $customize['marginTop'] . 'px' : '0px';
    $margin_bottom = isset($customize['marginBottom']) ? $customize['marginBottom'] . 'px' : '0px';
    $margin_left = isset($customize['marginLeft']) ? $customize['marginLeft'] . '%' : '0%';
    $margin_right = isset($customize['marginRight']) ? $customize['marginRight'] . 'px' : '0px';
    if ($is_block) {
        $btn_style = 'background-color:' . esc_attr($backgroundColor) . ' !important;color:' . esc_attr($color) . ' !important;width:' . esc_attr($width) . '%;height:' . esc_attr($height) . ';font-size:' . esc_attr($font_size) . ';border:' . esc_attr($border) . ';display:flex;align-content:center;justify-content:'.$justify_content_css.';align-items:center;border-radius:' . esc_attr($border_radius) . ';text-decoration:none;cursor:pointer;margin-top:' . esc_attr($margin_top) . ';margin-bottom:' . esc_attr($margin_bottom) . ';margin-left:' . esc_attr($margin_left) . ';margin-right:' . esc_attr($margin_right) . ';';
    } else {
        $btn_style = 'background-color:' . esc_attr($backgroundColor) . ';color:' . esc_attr($color) . ';width:' . esc_attr($width) . '%;height:' . esc_attr($height) . ';font-size:' . esc_attr($font_size) . ';border:' . esc_attr($border) . ';display:flex;align-content:center;justify-content:'.$justify_content_css.';align-items:center;border-radius:' . esc_attr($border_radius) . ';text-decoration:none;cursor:pointer;margin-top:' . esc_attr($margin_top) . ';margin-bottom:' . esc_attr($margin_bottom) . ';margin-left:' . esc_attr($margin_left) . ';margin-right:' . esc_attr($margin_right) . ';';
    }

    //Custom Css
    $custom_css = '';
    if (isset($customize['custom_css']) && '' !== $customize['custom_css']) {
        $custom_css = esc_attr($customize['custom_css']);
        $custom_css = str_replace("\n", '', $custom_css);
    }
    $custom_css = compatibility_with_themes($custom_css, $customize, $player_number);
    // Custom class to button.
    $class = (isset($text_arr['class'])) && strlen($text_arr['class']) ? esc_attr($text_arr['class']) : "";
    $class .= (isset($atts['class'])) && strlen($atts['class']) ? esc_attr($atts['class']) : "";

    $button = "<tts-play-button data-id='$player_number' class='tts_play_button' role='region' aria-label='" . esc_attr__('Text to speech player', 'text-to-audio') . "'></tts-play-button>";


    // init button scripts
    $params = [
        'content'             => $content,
        'player_number'       => $player_number,
        'class'               => $class,
        'btn_style'           => $btn_style,
        'text_arr'            => $text_arr,
        'custom_css'          => $custom_css,
        'should_display_icon' => $should_display_icon,
        'title'               => $title,
        'date'                => $date,
        'content_read_time'   => $content_read_time,
        'atts'                => $atts,
        'post'                => $post,
        'excerpt_sanitized'   => $excerpt_sanitized,
        'text_before_content' => $text_before_content,
        'text_after_content'  => $text_after_content,
        'get_content_from_dom' => $get_content_from_dom,
        'use_old_player' => $use_old_player,
    ];

    do_action('tts_enqueue_button_scripts', $params);
    $data = apply_filters('tts__listening_button', $button, $player_number, $class, $post);

    // TTS-247: escape the filter output before returning so shortcode /
    // block / the_content callers can echo the result safely. Allow-list
    // covers our default markup (<tts-play-button>) plus the common HTML
    // surfaces a third-party filter might use (button, span, svg, img, a).
    $allowed = array(
        'tts-play-button' => array(
            'data-id'    => true,
            'class'      => true,
            'role'       => true,
            'aria-label' => true,
            'style'      => true,
        ),
        'button' => array(
            'class' => true, 'id' => true, 'style' => true, 'type' => true,
            'aria-label' => true, 'aria-pressed' => true, 'role' => true,
            'data-id' => true, 'data-state' => true, 'tabindex' => true,
        ),
        'span'   => array( 'class' => true, 'id' => true, 'style' => true, 'aria-hidden' => true ),
        'a'      => array( 'class' => true, 'id' => true, 'style' => true, 'href' => true, 'target' => true, 'rel' => true, 'aria-label' => true ),
        'img'    => array( 'class' => true, 'id' => true, 'style' => true, 'src' => true, 'alt' => true, 'width' => true, 'height' => true ),
        'svg'    => array( 'class' => true, 'xmlns' => true, 'viewbox' => true, 'width' => true, 'height' => true, 'fill' => true, 'stroke' => true, 'aria-hidden' => true ),
        'path'   => array( 'd' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ),
        'g'      => array( 'fill' => true, 'stroke' => true ),
        'div'    => array( 'class' => true, 'id' => true, 'style' => true ),
        'br'     => array(),
    );
    return wp_kses( (string) $data, $allowed );
}


add_action('tts_enqueue_button_scripts', 'tts_enqueue_button_scripts', 10, 1);

/**
 * Enqueue button scripts
 */
function tts_enqueue_button_scripts($params)
{
    // enqueue footer script
    add_action('wp_print_footer_scripts', function () use ($params) {
        extract($params);
        $original_title = trim($title);
        $temp_title = trim(get_the_title($post));
        $temp_title = tta_clean_content($temp_title);

        // Get plugin all settings and pass it to TTS javascript Object.
        $plugin_all_settings = TTA_Helper::tts_get_settings('', $post->ID);

        if (isset($atts['lang']) && $atts['lang'] && isset($plugin_all_settings['listening']['tta__listening_lang']) && $atts['lang'] != $plugin_all_settings['listening']['tta__listening_lang']) {
            $plugin_all_settings['listening']['tta__listening_lang'] = $atts['lang'];
        }

        if (isset($atts['voice']) && $atts['voice'] && isset($plugin_all_settings['listening']['tta__listening_voice']) && $atts['voice'] != $plugin_all_settings['listening']['tta__listening_voice']) {
            $plugin_all_settings['listening']['tta__listening_voice'] = $atts['voice'];
        }


        if (apply_filters('tts_ignore_match_80_percent', false) && tts_text_match_80_percent($original_title, $temp_title)) {
            get_enqueued_js_object($params, $plugin_all_settings);
        } else {
            get_enqueued_js_object($params, $plugin_all_settings);
        }
    });
}

function get_enqueued_js_object($params, $plugin_all_settings)
{
    extract($params);

    $language = TTA_Helper::tts_site_language($plugin_all_settings);
    $voice = TTA_Helper::tts_get_voice($plugin_all_settings);
    $language_and_voice = TTA_Helper::get_player_language_and_player_voice($language, $voice, $plugin_all_settings, $post);
    $language = $language_and_voice['language'];
    $voice = $language_and_voice['voice'];
    $file_url_key = TTA_Helper::tts_get_file_url_key($language, $voice);
    $file_name = TTA_Helper::tts_file_name($title, $language, $voice, $post->ID, $post);
    $mp3_file_urls = TTA_Helper::get_mp3_file_urls($file_url_key, $post, $date, $file_name);
    $compatible_data = TTA_Helper::tts_get_settings('compatible');
    $compatible_content = apply_filters('tts_compatible_plugins_content', [], $compatible_data, $post);

    // TTS-247: close the output buffer with ob_get_clean() at the end of this
    // function (was leaking on ob_get_contents alone, which the wp.org review
    // flagged as an unclosed ob_start).
    ob_start();
    ?>
    <!-- AtlasVoice Settings  -->
    <script id='tts_button_settings_<?php echo $player_number; ?>'>
        var ttsCurrentButtonNo = <?php echo $player_number; ?>;
        var ttsCurrentContent = "<?php echo apply_filters('atlasvoice_player_content', $content, $post, $language, $voice, $player_number); ?>";
        var ttsListening = <?php echo json_encode($plugin_all_settings['listening']); ?>;
        var ttsCSSClass = "<?php echo $class; ?>";
        var ttsBtnStyle = "<?php echo $btn_style; ?>";
        var ttsTextArr = <?php echo json_encode($text_arr); ?>;
        var ttsCustomCSS = "<?php print($custom_css); ?>";
        var ttsShouldDisplayIcon = "<?php echo $should_display_icon; ?>";
        var readingTime = "<?php echo $content_read_time; ?>";
        var postId = "<?php echo $post->ID; ?>";
        var fileURLs = <?php echo json_encode($mp3_file_urls); ?>;
        var get_content_from_dom = <?php echo json_encode($get_content_from_dom); ?>;
        var use_old_player = "<?php echo $use_old_player; ?>";



        var ttsSettings = {
            listening: ttsListening,
            cssClass: ttsCSSClass,
            btnStyle: ttsBtnStyle,
            textArr: ttsTextArr,
            customCSS: ttsCustomCSS,
            shouldDisplayIcon: ttsShouldDisplayIcon,
            readingTime: readingTime,
            postId: postId,
            fileURLs: fileURLs,
            get_content_from_dom:get_content_from_dom,
            use_old_player:use_old_player
        };


        // Override global ttsObj.settings.settings with per-post aware settings.
        // ttsObj is built in TTA_Admin.__construct() without post ID (global only).
        // This inline script runs after post context is available, so per-post CSS selector overrides are included.
        if (window.ttsObj && window.ttsObj.settings) {
            window.ttsObj.settings.settings = <?php echo json_encode(isset($plugin_all_settings['settings']) ? $plugin_all_settings['settings'] : new \stdClass()); ?>;
        }

        var dateTitle = {
            title: "<?php echo $title; ?>",
            file_name: "<?php echo $file_name; ?>",
            date: "<?php echo $date; ?>",
            language: "<?php echo $language; ?>",
            voice: "<?php echo $voice; ?>",
            file_url_key: "<?php echo $file_url_key; ?>",
            compatible_contents: <?php echo json_encode($compatible_content); ?>,
            excerpt: "<?php echo $excerpt_sanitized; ?>",
            text_before_content: "<?php echo apply_filters('atlasvoice__text_before_content', $text_before_content, $post, $language, $voice, $player_number); ?>",
            text_after_content: "<?php echo apply_filters('atlasvoice__text_after_content', $text_after_content, $post, $language, $voice, $player_number); ?>",
        }

        if (window.hasOwnProperty('TTS')) { // add content if a page have multiple button
            window.TTS.contents[ttsCurrentButtonNo] = ttsCurrentContent;
            window.TTS.extra[ttsCurrentButtonNo] = dateTitle;
            window.TTS.extra.player_id = "<?php echo get_player_id(); ?>";
        } else { // add content for the if a page have one button
            window.TTS = {}
            window.TTS.contents = {}
            window.TTS.contents[ttsCurrentButtonNo] = ttsCurrentContent;
            window.TTS.extra = {}
            window.TTS.extra[ttsCurrentButtonNo] = dateTitle;
            window.TTS.extra.player_id = "<?php echo get_player_id(); ?>";
        }

        // add settings
        if (!window.TTS.hasOwnProperty('settings')) {
            window.TTS.settings = ttsSettings
        }
    </script>
    <?php
    // Audio schema is now output via wp_head hook (TTA_Helper::output_audio_schema_head)
    // TTS-247: ob_get_clean() closes + returns the buffer in one step.
    return (string) ob_get_clean();
}


function tts_text_match_80_percent($text1, $text2)
{
    // Tokenize the input texts into words
    $words1 = explode(" ", $text1);
    $words2 = explode(" ", $text2);

    // Convert the arrays of words into sets for faster comparison
    $set1 = array_unique($words1);
    $set2 = array_unique($words2);

    // Calculate the intersection and union of the two sets
    $intersection = count(array_intersect($set1, $set2));
    $union = count($set1) + count($set2) - $intersection;

    // Calculate the Jaccard similarity coefficient
    $jaccardSimilarity = $intersection / $union;

    // If the similarity is at least 80%, return true; otherwise, return false
    if ($jaccardSimilarity >= 0.8) {
        return true;
    } else {
        return false;
    }
}


/**
 * Get button text
 */
function get_button_text($atts, $content_read_time)
{
    $saved_texts = get_option('tta__button_text_arr');
    if (!$saved_texts) {
        $saved_texts = set_initial_button_texts($content_read_time);
    }

    // Per-player overrides take precedence when present (TTS-241).
    $player_id = (int) get_player_id();
    if ($player_id < 1) {
        $player_id = 1;
    }
    $player_states = isset($saved_texts['players'][$player_id]) && is_array($saved_texts['players'][$player_id])
        ? $saved_texts['players'][$player_id]
        : [];

    // TTS-247: the translated defaults below are now passed as literal __()
    // calls at this call site (instead of `'Listen'` strings being translated
    // inside get_text_value()). This is required so that makepot / wp-cli can
    // extract the strings — the WP.org review flagged the previous design as
    // a gettext-with-variables violation. See TTA_Helper::get_text_value().
    $resolve = function ($state, $flat_key, $fallback) use ($atts, $saved_texts, $player_states) {
        if (!empty($player_states[$state]['text'])) {
            return $player_states[$state]['text'];
        }
        return TTA_Helper::get_text_value($atts, $saved_texts, $flat_key, $fallback);
    };

    $listen_text = $resolve('listen', 'listen_text', __( 'Listen', 'text-to-audio' ));
    $pause_text  = $resolve('pause',  'pause_text',  __( 'Pause',  'text-to-audio' ));
    $resume_text = $resolve('resume', 'resume_text', __( 'Resume', 'text-to-audio' ));
    $replay_text = $resolve('replay', 'replay_text', __( 'Replay', 'text-to-audio' ));
    $start_text  = TTA_Helper::get_text_value($atts, $saved_texts, 'start_text', __( 'Start', 'text-to-audio' ));
    $stop_text   = TTA_Helper::get_text_value($atts, $saved_texts, 'stop_text',  __( 'Stop',  'text-to-audio' ));

    $text_arr = [
        'listen_text' => $listen_text,
        'pause_text' => $pause_text,
        'resume_text' => $resume_text,
        'replay_text' => $replay_text,
        'start_text' => $start_text,
        'stop_text' => $stop_text,
        // Hover titles per state (resolved per-player; falls back to flat keys).
        'listen_hover_title' => $player_states['listen']['hover'] ?? ($saved_texts['listen_hover_title'] ?? ''),
        'pause_hover_title'  => $player_states['pause']['hover']  ?? ($saved_texts['pause_hover_title']  ?? ''),
        'resume_hover_title' => $player_states['resume']['hover'] ?? ($saved_texts['resume_hover_title'] ?? ''),
        'replay_hover_title' => $player_states['replay']['hover'] ?? ($saved_texts['replay_hover_title'] ?? ''),
        // Pass through the full per-player map so the JS layer can read it directly.
        'players' => isset($saved_texts['players']) && is_array($saved_texts['players']) ? $saved_texts['players'] : [],
    ];


    $customize_settings = (array)TTA_Helper::tts_get_settings('customize');
    $text_arr = get_text_array_from_shortcode($customize_settings, $text_arr);

    $text_arr = apply_filters('tta__button_text_arr', $text_arr, $atts, $content_read_time);

    update_option('tta__button_text_arr', $text_arr);


    return $text_arr;
}


function get_text_array_from_shortcode($customize_settings, $text_arr)
{
    $shortcode = '[atlasvoice]';
    if (isset($customize_settings['tta_play_btn_shortcode']) && $customize_settings['tta_play_btn_shortcode']) {
        $shortcode = $customize_settings['tta_play_btn_shortcode'];
    }

    // Define the pattern for matching attributes and their values
    $pattern = '/\b(\w+)="([^"]*)"/';

    // Match all attribute-value pairs
    preg_match_all($pattern, $shortcode, $matches, PREG_SET_ORDER);

    // Create an associative array to store attribute values
    $attributes = array();

    // Iterate through matches and populate the array
    foreach ($matches as $match) {
        $attributes[$match[1]] = $match[2];
    }

    foreach ($attributes as $key => $value) {
        if (isset($attributes[$key]) && $attributes[$key]) {
            $text = sanitize_text_field($value);
            $text = esc_html($text);
            if ($text) {
                $text_arr[$key] = $text;
            }
        }
    }


    return $text_arr;

}

/**
 * Compatible with Payment forms, Buy now buttons and Invoicing System | GetPaid
 *
 * @see https://wordpress.org/plugins/invoicing/
 */
$display_button_priority = apply_filters('tta_display_button_priority', 999);

add_filter('the_content', 'add_listen_button', $display_button_priority);


/**
 * Add listening button to every post by default.
 */
function add_listen_button($content)
{
    static $button_no = 0;
    $button_no++;
    global $post;
    if (!TTA_Helper::should_load_button($post) ) {
       return $content;
    }
    TTA_Helper::set_default_settings();
    $button = '';
    $settings = TTA_Helper::tts_get_settings('settings');
    $customize = TTA_Helper::tts_get_settings('customize');
    if (isset($customize['buttonSettings'])) {
        $button_settings = (array)$customize['buttonSettings'];
    } else {
        $button_settings = [
            'button_position' => 'before_content',
            'id' => 1
        ];
    }


    if (isset($settings['tta__settings_enable_button_add']) && $settings['tta__settings_enable_button_add']) {
        // TODO: write functionality if current page is home page where content is excerpt.
        // if(is_single()) {
        //     add_filter( 'the_content', 'add_listen_button' );
        // }
        // elseif(did_filter( 'the_excerpt' )){
        //     add_filter( 'the_excerpt', 'add_listen_button' , 9999 );
        // }
        $reduce_enqueue = apply_filters('tts_reduce_enqueue', ['reduce_enqueue_status' => false, 'button_no' => 1]);
        if (
            isset($reduce_enqueue['button_no'])
            && isset($reduce_enqueue['reduce_enqueue_status'])
            && $reduce_enqueue['reduce_enqueue_status']
            && $reduce_enqueue['button_no'] > 0
        ) {
            if ($button_no == $reduce_enqueue['button_no'] && isset($post->post_content) && !(has_shortcode($post->post_content, 'tta_listen_btn') || has_shortcode($post->post_content, 'atlasvoice'))) {
                // TTS-247: tta_get_button_content() now wp_kses-escapes its
                // own output around the tts__listening_button filter point.
                $button = tta_get_button_content('');
            }
        } else {
            if (!TTA_Helper::tts_has_shortcode($post)) {
                $button = tta_get_button_content('');
            }
        }
    }
    $button_position = 'before_content';
    if (isset($button_settings['button_position'])) {
        $button_position = $button_settings['button_position'];
    }
    $final_content = $button . $content;
    if ($button_position == 'after_content') {
        $final_content = $content . $button;
    }

    return apply_filters('tts_button_with_content', $final_content, $button, $content, $button_position, $post);

}


function get_used_shortcodes($content)
{
    global $shortcode_tags;
    if (false === strpos($content, '[')) {
        return array();
    }
    if (empty($shortcode_tags) || !is_array($shortcode_tags)) {
        return array();
    }
    // Find all registered tag names in $content.
    preg_match_all('@\[([^<>&/\[\]\x00-\x20=]++)@', $content, $matches);
    $tagnames = array_intersect(array_keys($shortcode_tags), $matches[1]);

    return $tagnames;
}

/**
 * Is pro license active
 */
function is_pro_license_active()
{
    if (is_pro_active()) {
        return true;
    }

    return false;
}

function tta_get_default_languages()
{
    return array(
        'af' => 'Afrikaans',
        'ar' => 'العربية',
        'ary' => 'العربية المغربية',
        'as' => 'অসমীয়া',
        'azb' => 'گؤنئی آذربایجان',
        'az' => 'Azərbaycan dili',
        'bel' => 'Беларуская мова',
        'bg_BG' => 'Български',
        'bn_BD' => 'বাংলা',
        'bo' => 'བོད་ཡིག',
        'bs_BA' => 'Bosanski',
        'ca' => 'Català',
        'ceb' => 'Cebuano',
        'cs_CZ' => 'Čeština',
        'cy' => 'Cymraeg',
        'da_DK' => 'Dansk',
        'de_DE_formal' => 'Deutsch (Sie)',
        'de_DE' => 'Deutsch',
        'de_CH_informal' => 'Deutsch (Schweiz, Du)',
        'de_CH' => 'Deutsch (Schweiz)',
        'de_AT' => 'Deutsch (Österreich)',
        'dsb' => 'Dolnoserbšćina',
        'dzo' => 'རྫོང་ཁ',
        'el' => 'Ελληνικά',
        'en_CA' => 'English (Canada)',
        'en_NZ' => 'English (New Zealand)',
        'en_ZA' => 'English (South Africa)',
        'en_GB' => 'English (UK)',
        'en_AU' => 'English (Australia)',
        'eo' => 'Esperanto',
        'es_DO' => 'Español de República Dominicana',
        'es_CR' => 'Español de Costa Rica',
        'es_VE' => 'Español de Venezuela',
        'es_CO' => 'Español de Colombia',
        'es_CL' => 'Español de Chile',
        'es_UY' => 'Español de Uruguay',
        'es_PR' => 'Español de Puerto Rico',
        'es_ES' => 'Español',
        'es_GT' => 'Español de Guatemala',
        'es_PE' => 'Español de Perú',
        'es_MX' => 'Español de México',
        'es_EC' => 'Español de Ecuador',
        'es_AR' => 'Español de Argentina',
        'et' => 'Eesti',
        'eu' => 'Euskara',
        'fa_AF' => '(فارسی (افغانستان',
        'fa_IR' => 'فارسی',
        'fi' => 'Suomi',
        'fr_FR' => 'Français',
        'fr_CA' => 'Français du Canada',
        'fr_BE' => 'Français de Belgique',
        'fur' => 'Friulian',
        'gd' => 'Gàidhlig',
        'gl_ES' => 'Galego',
        'gu' => 'ગુજરાતી',
        'haz' => 'هزاره گی',
        'he_IL' => 'עִבְרִית',
        'hi_IN' => 'हिन्दी',
        'hr' => 'Hrvatski',
        'hsb' => 'Hornjoserbšćina',
        'hu_HU' => 'Magyar',
        'hy' => 'Հայերեն',
        'id_ID' => 'Bahasa Indonesia',
        'is_IS' => 'Íslenska',
        'it_IT' => 'Italiano',
        'ja' => '日本語',
        'jv_ID' => 'Basa Jawa',
        'ka_GE' => 'ქართული',
        'kab' => 'Taqbaylit',
        'kk' => 'Қазақ тілі',
        'km' => 'ភាសាខ្មែរ',
        'kn' => 'ಕನ್ನಡ',
        'ko_KR' => '한국어',
        'ckb' => 'كوردی‎',
        'lo' => 'ພາສາລາວ',
        'lt_LT' => 'Lietuvių kalba',
        'lv' => 'Latviešu valoda',
        'mk_MK' => 'Македонски јазик',
        'ml_IN' => 'മലയാളം',
        'mn' => 'Монгол',
        'mr' => 'मराठी',
        'ms_MY' => 'Bahasa Melayu',
        'my_MM' => 'ဗမာစာ',
        'nb_NO' => 'Norsk bokmål',
        'ne_NP' => 'नेपाली',
        'nl_NL_formal' => 'Nederlands (Formeel)',
        'nl_BE' => 'Nederlands (België)',
        'nl_NL' => 'Nederlands',
        'nn_NO' => 'Norsk nynorsk',
        'oci' => 'Occitan',
        'pa_IN' => 'ਪੰਜਾਬੀ',
        'pl_PL' => 'Polski',
        'ps' => 'پښتو',
        'pt_PT' => 'Português',
        'pt_PT_ao90' => 'Português (AO90)',
        'pt_AO' => 'Português de Angola',
        'pt_BR' => 'Português do Brasil',
        'rhg' => 'Ruáinga',
        'ro_RO' => 'Română',
        'ru_RU' => 'Русский',
        'sah' => 'Сахалыы',
        'snd' => 'سنڌي',
        'si_LK' => 'සිංහල',
        'sk_SK' => 'Slovenčina',
        'skr' => 'سرائیکی',
        'sl_SI' => 'Slovenščina',
        'sq' => 'Shqip',
        'sr_RS' => 'Српски језик',
        'sv_SE' => 'Svenska',
        'sw' => 'Kiswahili',
        'szl' => 'Ślōnskŏ gŏdka',
        'ta_IN' => 'தமிழ்',
        'ta_LK' => 'தமிழ்',
        'te' => 'తెలుగు',
        'th' => 'ไทย',
        'tl' => 'Tagalog',
        'tr_TR' => 'Türkçe',
        'tt_RU' => 'Татар теле',
        'tah' => 'Reo Tahiti',
        'ug_CN' => 'ئۇيغۇرچە',
        'uk' => 'Українська',
        'ur' => 'اردو',
        'uz_UZ' => 'O‘zbekcha',
        'vi' => 'Tiếng Việt',
        'zh_TW' => '繁體中文',
        'zh_HK' => '香港中文版	',
        'zh_CN' => '简体中文',
    );
}

// Define rtl
function tta_is_rtl()
{
    global $locale;
    if (false !== strpos($locale, 'ar')
        || false !== strpos($locale, 'he')
        || false !== strpos($locale, 'he_IL')
        || false !== strpos($locale, 'ur')
    ) {
        $rtl = true;
    } else {
        $rtl = false;
    }

    return $rtl;
}


function compatibility_with_themes($custom_css, $customize, $player_number = 1)
{

    if (false !== strpos(get_option('stylesheet'), 'twenty')) {
        $selector = '';
        for ($i = 1; $i <= $player_number; $i++) {
            $comma = '';
            if ($i > 1 && $i < $player_number) {
                $comma = ', ';
            }
            $selector .= '#tts__listent_content_' . $i . '.tts__listent_content, #tts__listent_content_' . $i . '.tts__listent_content:hover'. $comma;
        }
        $custom_css .= $selector . '  {max-width:650px;';
        if (
            (isset($customize['marginLeft']) && $customize['marginLeft'] == '0'
                && isset($customize['marginRight']) && $customize['marginRight'] == '0'
                && isset($customize['marginTop']) && $customize['marginTop'] == '0'
                && isset($customize['marginBottom']) && $customize['marginBottom'] == '0'
            )
            ||
            (!isset($customize['marginLeft']) )
        ) {
            $custom_css .= 'margin:auto;}';
        }else{
            $custom_css .= '}';
        }
    }

    return $custom_css;
}

function set_initial_button_texts($content_read_time)
{
    if (!get_option('tta__button_text_arr')) {

        // Button listen text.
        $listen_text = __("Listen", 'text-to-audio');
        $pause_text = __('Pause', 'text-to-audio');
        $resume_text = __('Resume', 'text-to-audio');
        $replay_text = __('Replay', 'text-to-audio');
        $start_text = __('Start', 'text-to-audio');
        $stop_text = __('Stop', 'text-to-audio');

        update_option('tta__button_text_arr', [
            'listen_text' => $listen_text,
            'pause_text' => $pause_text,
            'resume_text' => $resume_text,
            'replay_text' => $replay_text,
            'start_text' => $start_text,
            'stop_text' => $stop_text,
            'players' => \TTA\TTA_Player_Icons::default_players(),
        ]);

    }

    return apply_filters('tts_initial_button_texts', [
        'listen_text' => $listen_text,
        'pause_text' => $pause_text,
        'resume_text' => $resume_text,
        'replay_text' => $replay_text,
        'start_text' => $start_text,
        'stop_text' => $stop_text,
    ], $content_read_time);
}


function get_player_id()
{

    $customize_settings = (array)TTA_Helper::tts_get_settings('customize');
    $customize_settings['buttonSettings'] = isset($customize_settings['buttonSettings']) ? (array)$customize_settings['buttonSettings'] : [
        'id' => 1,
        'button_position' => 'before_content',
        'display_player_to' => ['all'],
        'who_can_download_mp3_file' => ['all'],
    ];


    $player_id = isset($customize_settings['buttonSettings']['id']) ? $customize_settings['buttonSettings']['id'] : 1;

    if (!is_pro_license_active() && $player_id > 1) {
        $player_id = 1;
    }


    $player_id = apply_filters('tts_get_player_id', $player_id);

    return $player_id;


}

/**
 * Is plugin active
 */
function is_pro_active()
{

    if (!function_exists('is_plugin_active')) {
        include_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    $pro_plugins = [
        'text-to-speech-pro/text-to-audio-pro.php',
        'text-to-speech-pro-premium/text-to-audio-pro.php',
        'text-to-audio-pro/text-to-audio-pro.php',
        'text-to-audio-pro-premium/text-to-audio-pro.php',
    ];

    $status = false;

    foreach ($pro_plugins as $plugin) {
        if (is_plugin_active($plugin)) {
            $status = true;
            break; // Exit loop as soon as one active plugin is found
        }
    }

    $status = apply_filters('tts_is_pro_active', $status);


    return $status;


}

/**
 * Write debug logs for Text-to-Audio plugin.
 *
 * @param string $message  The log message.
 */
function tts_debug( $message ) {
    // TTS-247: write to uploads/text-to-audio/ instead of wp-content/debug.log.
    // wp.org guideline forbids writing into the plugin folder or hijacking
    // core's debug.log; create the per-plugin folder lazily under wp_upload_dir().
    $upload = wp_upload_dir();
    if ( ! empty( $upload['error'] ) ) {
        return;
    }
    $dir = trailingslashit( $upload['basedir'] ) . 'text-to-audio';
    if ( ! file_exists( $dir ) ) {
        wp_mkdir_p( $dir );
        @file_put_contents( $dir . '/index.php', "<?php\n// Silence is golden.\n" );
    }
    $log_file = $dir . '/debug.log';

    $time = date( 'Y-m-d H:i:s' );
    $formatted_message = "[$time] [atlasvoice] " . print_r( $message, true ) . PHP_EOL;

    file_put_contents( $log_file, $formatted_message, FILE_APPEND | LOCK_EX );
}

