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
 * 
 */
function tta_should_add_dilimiter($title, $delimiter) {
    $dilimiterArr = ['.', ',', '?', '!', '|', ];
    $end = substr($title, -1);
    if(in_array($end, $dilimiterArr)){
        return $title. ' ';
    }

    return $title.$delimiter. " ";

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

    // set default value.
    $settings['tta__settings_allow_listening_for_post_types'] = isset($settings['tta__settings_allow_listening_for_post_types']) && is_array($settings['tta__settings_allow_listening_for_post_types']) ? $settings['tta__settings_allow_listening_for_post_types'] : ['post', 'page', 'product'];


    // echo "<pre>";
    if(!isset($settings['tta__settings_allow_listening_for_post_types']) 
    || count($settings['tta__settings_allow_listening_for_post_types']) === 0
    || !is_array($settings['tta__settings_allow_listening_for_post_types'])
    || !in_array(tts_post_type(), $settings['tta__settings_allow_listening_for_post_types'])
    ) {
        return;
    }


    // this is a pro feature to show button on blog main page with title and excerpt.
    if(is_home() || is_archive() ){
        return;
    }

    $display_icon = isset( $settings['tta__settings_display_btn_icon'] ) && $settings['tta__settings_display_btn_icon'] ? 'inline-block' : 'none';

    static $btn_no = 0;
    $btn_no++;

    $sentence_delimiter = isset($recording['tta__sentence_delimiter']) ? $recording['tta__sentence_delimiter'] : '. ';
    
    $title = tta_clean_content( get_the_title());
    $title = tta_should_add_dilimiter($title, $sentence_delimiter);

    $description = get_the_content();
    $description = tta_clean_content($description);
    $content     = apply_filters('tta__content_title', $title);
    $content    .= apply_filters('tta__content_description', $description);

    // Button listen text.
    $text_arr = get_button_text( $atts );
    // Speak Icon
    $speakIcon = "<div class='tta_button'>";
    $speakIcon .= apply_filters( 'tta__listening_button_icon', '<span class="dashicons dashicons-controls-play"></span> ');
    $speakIcon .= '<span> '. $text_arr['listen_text'] . '<span></div>';
    // Button style.
    if (isset($customize) && count($customize)) {
        if ($is_block) {
            $backgroundColor = isset($customize['backgroundColor']) ? $customize['backgroundColor'] : '#184c53';
            $color = isset($customize['color']) ? $customize['color'] : '#ffffff';
            $width = isset($customize['width']) ? $customize['width'] : '100';
            $btn_style = 'background-color:' . esc_attr($backgroundColor) . ' !important;color:' . esc_attr($color) . ' !important;width:' . esc_attr($width) . '%;border:0;display:block;border-radius:4px;text-decoration:none;cursor:pointer;';
        } else {
            $btn_style = 'background-color:' . esc_attr($customize['backgroundColor']) . ';color:' . esc_attr($customize['color']) . ';width:' . esc_attr($customize['width']) . '%;border:0;display:block;border-radius:4px;text-decoration:none;cursor:pointer;';
        }
    } else {
        $btn_style = 'background-color:#184c53;color:#ffffff;width:100%;border:0;display:block;border-radius:4px;text-decoration:none;cursor:pointer;';
    }
    //Custom Css
    $custom_css = '';
    if (isset($customize['custom_css']) && '' !== $customize['custom_css']) {
        $custom_css = esc_attr($customize['custom_css']);
    }

    // Custom class to button.
    $class = (isset($atts['class'])) && strlen($atts['class']) ? esc_attr($atts['class']) : "";

    // Listening button.
    $button = '<div class="tta_notice"></div><button id="tta__listent_content_' . $btn_no . '" class="tta__listent_content ' . esc_attr($class) . '" type="button"  title="Text To Audio:  Tap to listen post.">' . $speakIcon . ' </button>
<style>
#tta__listent_content_' . $btn_no .'.tta__listent_content{ ' . esc_attr($btn_style) . ' }
#tta__listent_content_' . $btn_no .'.tta__listent_content:hover{' . esc_attr($btn_style) . '}
#tta__listent_content_' . $btn_no .'.tta__listent_content .text-position{ position: absolute;padding-top: 2px; }
#tta__listent_content_' . $btn_no .'.tta__listent_content .dashicons{ display: ' . esc_attr( $display_icon ) . ';line-height:1;font-size:25px;height:25px;width:25px; }
' . $custom_css . '
</style>
<script>
    window.ttsContent = "'.$content.'"
    window.buttonId = '.$btn_no.'
    window.ttsListeningSettings = '.$listening.'
</script>';

    return apply_filters( 'tta__listening_button', $button );
}



/**
 * Get post type
 * 
 * @see 
 */

function tts_post_type() {
    global  $post;

    return $post->post_type;
}





/**
 * Get button text
 */
function get_button_text( $atts ) {
    $listen_text = (isset($atts['listen_text'])) && strlen($atts['listen_text']) ? esc_html__( sanitize_text_field( $atts['listen_text'] ) ) : __( "Listen", 'text-to-audio' );
    $pause_text = (isset($atts['pause_text'])) && strlen($atts['pause_text']) ? esc_html__( sanitize_text_field( $atts['pause_text'] ) ) : __( 'Pause', 'text-to-audio' );
    $resume_text = (isset($atts['resume_text'])) && strlen($atts['resume_text']) ? esc_html__( sanitize_text_field( $atts['resume_text'] ) ) : __( 'Resume', 'text-to-audio' );
    $replay_text = (isset($atts['replay_text'])) && strlen($atts['replay_text']) ? esc_html__( sanitize_text_field( $atts['replay_text'] ) ) : __( 'Replay', 'text-to-audio' );
    $start_text = (isset($atts['start_text'])) && strlen($atts['start_text']) ? esc_html__( sanitize_text_field( $atts['start_text'] ) ) : __( 'Start', 'text-to-audio' );
    $stop_text = (isset($atts['stop_text'])) && strlen($atts['stop_text']) ? esc_html__( sanitize_text_field( $atts['stop_text'] ) ) : __( 'Start', 'text-to-audio' );

    update_option( 'tta__button_text_arr', [
        'listen_text' => $listen_text,
        'pause_text' => $pause_text,
        'resume_text' => $resume_text,
        'replay_text' => $replay_text,
        'start_text' => $start_text,
        'stop_text' => $stop_text,
    ]);

    return apply_filters('tta__button_text_arr', get_option( 'tta__button_text_arr' ) );

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
            "<strong>" . esc_html('Text To Audio:') . "</strong>",
            "<strong>" . esc_html( $apis ) . "</strong>",
            "<a href='https://wordpress.org/plugins/text-to-audio/#how%20to%20fix%20firefox%20%20browser%20issue%3F' target='_blank'>" . esc_html__('enable', 'text-to-audio') . "</a>"
        );
    }

    return '';
}

$settings = (array) get_option( 'tta_settings_data');



if( isset( $settings['tta__settings_enable_button_add'] ) &&  $settings['tta__settings_enable_button_add'] ) {
    add_filter( 'the_content', 'add_listen_button' );
}

/**
 * Add listening button to every post by default.
 */
function add_listen_button( $content ) {
    ob_start();
    echo do_shortcode('[tta_listen_btn]');
    $button = ob_get_contents();
    ob_end_clean();

    return $button.$content;
}