<?php

/**
 * If classic editor is active then on new-post and edit post
 * activate recording  for blog content.
 */
function tta_clean_content($text) {
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
        '&nbsp;' => '',
        '&mdash;' => '—',
        '&amp;' => '&',
        '&gt;' => 'greater than',
        '&lt;' => 'less than',
        '&#8211;' => '-',
        '&#8212;' => '—',
    );

    $text = strip_shortcodes($text);
    $text = wp_strip_all_tags($text, true);

    $text = str_replace(array_keys($quotationMarks), array_values($quotationMarks), $text);
    $text = str_replace(array_keys($otherMarks), array_values($otherMarks), $text);

    // CF 16-Oct-19: We want to make sure no quotes are over-escaped (if somebody writes \" it will get substituted as \\",
    // which will escape the slash instead of the quotation mark. We don't merge them in one regex because neither mark
    // can _always_ be substituted with the other without changing the meaning of the sentence for the TTS engine.
    // Note: backspaces need to be doubled. The first regex (\\\\{2,}") means: match two or more \ followed by "
    $text = preg_replace('/\\\\{2,}"/', '\"', $text);
    $text = preg_replace("/\\\\{2,}'/", "\'", $text);

    $text = preg_replace('/\s+/', ' ', trim($text)); // Get rid of /n and /s in the string.

    return $text;
}

/**
 * @param $atts
 *
 * @param $is_block
 *
 * @return string
 */
function tta_get_button_content($atts, $is_block = false) {

    $listening = (array) get_option('tta_listening_settings');
    $listening = json_encode($listening);
    if ($is_block) {
        $customize = $atts;
    } else {
        $customize = (array) get_option('tta_customize_settings');
    }
    $settings = (array) get_option('tta_settings_data');
    $recording = (array) get_option('tta_record_settings');

    //Apply short code for only single page.
    if (isset($settings['tta__settings_display_btn_in_single_page']) && $settings['tta__settings_display_btn_in_single_page'] == 1 && !is_single()) {
        return;
    }

    static $btn_no = 0;
    $btn_no++;

    $sentence_delimiter = isset($recording['tta__sentence_delimiter']) ? $recording['tta__sentence_delimiter'] : '. ';
    $title = get_the_title() . $sentence_delimiter . " ";

    $description = get_the_content();
    $description = apply_filters('tta__content_before_cleaning', $description);
    $description = tta_clean_content($description);
    $description = apply_filters('tta__content_after_cleaning', $description);
    $content     = apply_filters('tta__content_title', $title);
    $content    .= apply_filters('tta__content_description', $description);

    // Button listen text.
    $listen_text = apply_filters('tta__listen_text', (isset($atts['listen_text'])) && strlen($atts['listen_text']) ? esc_html__($atts['listen_text']) : "Listen" );
    $pause_text = apply_filters('tta__pause_text', (isset($atts['pause_text'])) && strlen($atts['pause_text']) ? esc_html__($atts['pause_text']) : "Pause" );
    $resume_text = apply_filters('tta__resume_text', (isset($atts['resume_text'])) && strlen($atts['resume_text']) ? esc_html__($atts['resume_text']) : "Resume" );
    $replay_text = apply_filters('tta__replay_text', (isset($atts['replay_text'])) && strlen($atts['replay_text']) ? esc_html__($atts['replay_text']) : "Replay" );

    update_option( 'tta_button_text_arr', [
        'listen_text' => $listen_text,
        'pause_text' => $pause_text,
        'resume_text' => $resume_text,
        'replay_text' => $replay_text,
    ]);

    // Speak Icon
    $speakIcon = apply_filters( 'tta__listening_button_icon', '<span class="dashicons dashicons-controls-play"></span> ') . $listen_text;
    // Button style.
    if (isset($customize) && count($customize)) {
        if ($is_block) {
            $backgroundColor = isset($customize['backgroundColor']) ? $customize['backgroundColor'] : '#184c53';
            $color = isset($customize['color']) ? $customize['color'] : '#ffffff';
            $width = isset($customize['width']) ? $customize['width'] : '100';
            $btn_style = 'background-color:' . esc_attr($backgroundColor) . ' !important;color:' . esc_attr($color) . ' !important;width:' . esc_attr($width) . '%;border:0;display:block;';
        } else {
            $btn_style = 'background-color:' . esc_attr($customize['backgroundColor']) . ';color:' . esc_attr($customize['color']) . ';width:' . esc_attr($customize['width']) . '%;border:0;display:block;';
        }
    } else {
        $btn_style = 'background-color:#184c53;color:#ffffff;width:100%;border:0;display:block;';
    }
    //Custom Css
    $custom_css = '';
    if (isset($customize['custom_css']) && '' !== $customize['custom_css']) {
        $custom_css = esc_attr($customize['custom_css']);
    }

    // Custom class to button.
    $class = (isset($atts['class'])) && strlen($atts['class']) ? esc_attr($atts['class']) : "";

    // Listening button.
    $button = '<div class="tta_notice" style="display:none;"></div><button id="tta__listent_content_' . $btn_no . '" class="tta__listent_content ' . esc_attr($class) . '" type="button"  title="Text To Audio:  Tap to listen post.">' . $speakIcon . ' </button>
<style>
button.tta__listent_content{ ' . esc_attr($btn_style) . ' }
button.tta__listent_content:hover{' . esc_attr($btn_style) . '}
button.tta__listent_content .dashicons{ line-height: 1.5; }
' . $custom_css . '
</style>
<script>
    tta__listent_content_' . $btn_no . '.onclick = function() {
        ttaListenCotentInFrontend("' . $content . '", "tta__listent_content_' . $btn_no . '",  ' . $listening . ' );
    };
</script>';

    

    return apply_filters( 'tta__listening_button', $button );
}

/**
 * Admin notice
 *
 * When browser doesn'nt support SpeechRecognition/speechSynthesis.
 *
 * @since 1.0.0
 */
function tta_api_missing() {
    $browser = get_option('tta_current_browser_info', []);

    $apis = '';

    if (isset($browser['SpeechRecognition']) && 'undefined' == $browser['SpeechRecognition']) {
        $apis .= 'SpeechRecognition';
    }
    if (isset($browser['speechSynthesis']) && 'undefined' == $browser['speechSynthesis']) {
        $apis .= $apis ? ', speechSynthesis' : 'speechSynthesis';
    }
    if ($apis) {
        return sprintf(
            /* translators: 1: Plugin name 2: SpeechRecognition  3: link to doc*/
            esc_html__('%1$s Please enable %2$s. Click here to %3$s.', 'text-to-audio'),
            "<strong>" . esc_html__('Text To Audio:', 'text-to-audio') . "</strong>",
            "<strong>" . esc_html($apis, 'text-to-audio') . "</strong>",
            "<a href='https://wordpress.org/plugins/text-to-audio/#how%20to%20fix%20firefox%20%20browser%20issue%3F' target='_blank'>" . esc_html__('enable', 'text-to-audio') . "</a>"
        );
    }

    return '';
}
