<?php

namespace TTA;

/**
 * Fired during plugin activation
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    TTA
 * @subpackage TTA/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/includes
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class TTA_Helper
{

    public static function is_exluded_by_terms($post_terms, $excluded_terms, $term_type = 'tag')
    {
        $terms = [];
        $is_exclude = false;

        if (is_array($post_terms) && is_array($excluded_terms)) {
            foreach ($post_terms as $term) {
                array_push($terms, $term->slug);
            }


            foreach ($terms as $term) {
                if (in_array($term, $excluded_terms)) {
                    $is_exclude = true;
                    break;
                }
            }
        }

        return apply_filters('tts_is_exluded_by_terms', $is_exclude, $term_type);
    }

    public static function should_load_button($current_post = '', $called_from = 'default')
    {
        $should_load_button = false;
        if(!$current_post) {
            global $post;
            $current_post = $post;
        }
        // is_home() || is_archive() || is_front_page() || is_category()
        if (\is_single($current_post) || apply_filters('tts_force_check_is_singular', is_singular() , $current_post)) {
            $should_load_button = true;
        }

        $settings = self::tts_get_settings('settings');
        $ids = [];
        if (isset($settings['tta__settings_exclude_post_ids']) && is_array($settings['tta__settings_exclude_post_ids'])) {
            $ids = $settings['tta__settings_exclude_post_ids'];
        }

        $excluded_tags = [];
        if (isset($settings['tta__settings_exclude_wp_tags']) && is_array($settings['tta__settings_exclude_wp_tags'])) {
            $excluded_tags = $settings['tta__settings_exclude_wp_tags'];
        }
        $post_tags = [];
        if (isset($current_post->ID)) {
            $post_tags = get_the_terms($current_post->ID, 'post_tag');
        }
        $is_exclude_by_tags = self::is_exluded_by_terms($post_tags, $excluded_tags);


        $excluded_categories = [];
        if (isset($settings['tta__settings_exclude_categories']) && is_array($settings['tta__settings_exclude_categories'])) {
            $excluded_categories = $settings['tta__settings_exclude_categories'];
        }

        $post_categories = [];
        if (isset($current_post->ID)) {
            $post_categories = get_the_terms($current_post->ID, 'category');
        }
        $is_exclude_by_cagories = self::is_exluded_by_terms($post_categories, $excluded_categories, 'category');


        if (!function_exists('is_user_logged_in')) {
            include_once WPINC . '/pluggable.php';
        }

        $tta__settings_allow_listening_for_posts_status = false;
        if (isset($settings['tta__settings_allow_listening_for_posts_status']) && $settings['tta__settings_allow_listening_for_posts_status']) {
            if (!in_array(self::tts_post_status(), $settings['tta__settings_allow_listening_for_posts_status'])) {
                $tta__settings_allow_listening_for_posts_status = true;
            }
        }

        // Display player settings from customization menu
        $display_player_to = self::display_player_based_on_user_role();
        $display_player_based_on_date_range = self::display_player_based_on_date_range($current_post);

        if (
            !isset($settings['tta__settings_allow_listening_for_post_types'])
            || count($settings['tta__settings_allow_listening_for_post_types']) === 0
            || !is_array($settings['tta__settings_allow_listening_for_post_types'])
            || !in_array(self::tts_post_type(), $settings['tta__settings_allow_listening_for_post_types'])
            || in_array($current_post->ID, $ids)
            || $is_exclude_by_tags
            || $is_exclude_by_cagories
            || $tta__settings_allow_listening_for_posts_status
            || $display_player_to
            || !$display_player_based_on_date_range
        ) {
            $should_load_button = false;
        }

        if (TTA_Helper::is_edit_page()) {
            $should_load_button = true;
            if (
                !isset($settings['tta__settings_allow_listening_for_post_types'])
                || count($settings['tta__settings_allow_listening_for_post_types']) === 0
                || !is_array($settings['tta__settings_allow_listening_for_post_types'])
                || !in_array(self::tts_post_type(), $settings['tta__settings_allow_listening_for_post_types'])
                || in_array($current_post->ID, $ids)
                || $is_exclude_by_tags
                || $is_exclude_by_cagories
                || $tta__settings_allow_listening_for_posts_status
                || $display_player_to
                || !$display_player_based_on_date_range
            ) {
                $should_load_button = false;
            }
        }

        return apply_filters('tta_should_load_button', $should_load_button, $current_post);
    }


    /**
     * Get post type
     *
     * @see
     */

    public static function tts_post_type()
    {
        global $post;

        return isset($post->post_type) ? $post->post_type : '';
    }

    public static function tts_post_status()
    {
        global $post;

        return isset($post->post_status) ? $post->post_status : '';
    }


    /**
     *
     */
    public static function remove_shortcodes($content)
    {
        if ($content === '') {
            return '';
        }

        // Covers all kinds of shortcodes
        $expression = '/\[\/*[a-zA-Z1-90_| -=\'"\{\}]*\/*\]/m';
        $content = preg_replace($expression, '', $content);


        return strip_shortcodes($content);
    }


    /**
     * Extends wp_strip_all_tags to fix WP_Error object passing issue
     *
     * @param string | WP_Error $string
     *
     * @return string
     * @since 4.5.10
     * */
    public static function tts_strip_all_tags($string)
    {

        if ($string instanceof \WP_Error) {
            return '';
        }

        return wp_strip_all_tags($string);
    }


    /**
     * Get Output
     *
     * @param $output
     * @param $outputTypes
     *
     * @return array|false|int|mixed|string|string[]|null
     */
    public static function sazitize_content($output, $should_clean_content = false, $content_type = '')
    {

        if ($should_clean_content) {
            $output = \tta_clean_content($output);
            if ($content_type === 'title') {
                $output = \tta_should_add_delimiter($output, \apply_filters('tts_sentence_delimiter', '. '));
            }
        }
        // Format Output According to output type
        $output = self::tts_strip_all_tags(html_entity_decode($output));

        // Remove ShortCodes
        $output = self::remove_shortcodes($output);

        /**
         * Remove the url
         * @see https://gist.github.com/madeinnordeste/e071857148084da94891
         */
        $output = preg_replace('/\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i', '', $output);


        return $output;
    }

    public static function get_compatible_plugins_data()
    {
        $compatible_plugins_data = [];

        $GTranslate = get_option('GTranslate');
        $allowed_languages = [];
        $gtranslate_data = [];
        if (!empty($GTranslate) && isset($GTranslate['widget_look'], $GTranslate['incl_langs'], $GTranslate['fincl_langs'])) {
            if ($GTranslate['widget_look'] == 'float' or $GTranslate['widget_look'] == 'flags' or $GTranslate['widget_look'] == 'float' or $GTranslate['widget_look'] == 'dropdown_with_flags' or $GTranslate['widget_look'] == 'flags_name' or $GTranslate['widget_look'] == 'flags_code' or $GTranslate['widget_look'] == 'popup') {
                $allowed_languages = $GTranslate['fincl_langs'];
            } elseif ($GTranslate['widget_look'] == 'flags_dropdown') {
                $allowed_languages = array_values(array_unique(array_merge($GTranslate['fincl_langs'], $GTranslate['incl_langs'])));
            } else {
                $allowed_languages = $GTranslate['incl_langs'];
            }

            if (isset($GTranslate['wrapper_selector']) && $GTranslate['wrapper_selector']) {
                array_push($gtranslate_data, $GTranslate['wrapper_selector']);
            } else {
                $gtranslate_data = [
                    '.gt_options',
                    '.gt_languages',
                    '.gt_switcher_wrapper',
                    '.gt_selector',
                    '.gtranslate_wrapper',
                    '.gtranslate-dropdown'
                ];
            }
        }

        /* var WPML_Language_Switcher $wpml_language_switcher */
        global $sitepress, $sitepress_settings, $wpdb, $wpml_language_switcher;
        $active_languages = [];
        if ($sitepress) {
            $active_languages = $sitepress->get_active_languages();
        }

        $acf_fields = [];
        // TODO: moved to api instead of init. because it giving error. Because it's is calling too early.

        // Translatepress multilingual plugin.
        $trp_languages = [];
        if (class_exists('TRP_Settings')) {
            $TRP_languages = new \TRP_Settings();
            // Get the available languages
            $trp_settings = $TRP_languages->get_settings();
            $trp_languages = ( is_array( $trp_settings ) && isset( $trp_settings['translation-languages'] ) ) ? $trp_settings['translation-languages'] : [];
        }

        $datas = \apply_filters('tts_pro_plugins_data', [
            'gtranslate/gtranslate.php' => [
                'type' => 'class',
                'data' => $gtranslate_data,
                //  'gt_selector',], // 'gt_white_content', 'gtranslate_wrapper'],
                'plugin' => 'gtranslate',
                'allowed_languages' => $allowed_languages,
                'enterprise_version' => isset($GTranslate['enterprise_version']) ? $GTranslate['enterprise_version'] : '',
                'pro_version' => isset($GTranslate['pro_version']) ? $GTranslate['pro_version'] : '',
            ],
            'sitepress-multilingual-cms/sitepress.php' => [
                'type' => 'class',
                'data' => [],
                'plugin' => 'sitepress',
                'active_languages' => $active_languages,
            ],
            'advanced-custom-fields/acf.php' => [
                'type' => 'class',
                'data' => $acf_fields,
                'plugin' => 'acf',
            ],
            'advanced-custom-fields-pro/acf.php' => [
                'type' => 'class',
                'data' => $acf_fields,
                'plugin' => 'acf',
            ],
            'translatepress-multilingual/index.php' => [
                'type' => 'class',
                'data' => $trp_languages,
                'plugin' => 'translatepress',
            ]
        ]);

        if (!function_exists('is_plugin_active')) {
            require_once \ABSPATH . 'wp-admin/includes/plugin.php';
        }

        foreach ($datas as $plugin_name => $data) {
            if (is_plugin_active($plugin_name)) {
                $compatible_plugins_data[$plugin_name] = $data;
            }
        }


        return \apply_filters('tts_compatible_plugins_data', $compatible_plugins_data, TTA_Cache::all_plugins());
    }

    public static function get_language_code_from_url($url)
    {
        $arr = explode('lang', $url);
        $language_code = end($arr);
        if (self::get_player_id() != 4) {
            $language_code = str_replace('__', '', $language_code);
        }
        $language_code = explode('.', $language_code)[0];
        $language_code = \str_replace('_', '-', $language_code);
        if (self::get_player_id() == 4) {
            $language_code = substr($language_code, 2);
        }

        return $language_code;
    }


    public static function tts_site_language($plugin_all_settings)
    {

        $default_language = '';
        if (isset($plugin_all_settings['listening']['tta__listening_lang'])) {
            $default_language = $plugin_all_settings['listening']['tta__listening_lang'];
            // $default_language = str_replace(['-', ' '], '_', $default_language);
        }

        return apply_filters('tts_site_language', $default_language);
    }

    public static function tts_get_file_url_key($language, $voice = '')
    {
        $file_url_key = $language;
        if ((get_player_id() > 3) && $voice) {
            // For ElevenLabs (player 6), voice is "voice_id::FirstName" — use only FirstName.
            $voice_for_key = $voice;
            if (get_player_id() == 6 && strpos($voice, '::') !== false) {
                $voice_for_key = explode('::', $voice)[1];
            }
            $file_url_key .= '--voice--' . $voice_for_key;
        }

        return apply_filters('tts_get_file_url_key', $file_url_key, $language, $voice);
    }

    public static function tts_get_voice($plugin_all_settings)
    {
        $default_voice = '';
        if (isset($plugin_all_settings['listening']['tta__listening_voice']) && (get_player_id() == 4 || get_player_id() == 5 || get_player_id() == 6)) {
            $default_voice = $plugin_all_settings['listening']['tta__listening_voice'];
        }

        $voice = apply_filters('tts_get_voice', $default_voice);

        $voice = str_replace([' ', '(', ')', '%20'], '_', $voice);

        return $voice;
    }

    public static function tts_file_name($title, $selectedLang, $voice = '', $post_id = '', $post = '')
    {
        if(!$post) {
            global $post;
        }
        /**
         * When title is not added to readble content by UI
         * option of settings page. Then post title of the post
         * will be the file name.
         */
        if (!$title) {
            $title = $post->post_title;
        }
        /**
         * TTS-191
         * When title is empty file name will be post id
         */
        if (!$post_id && $post) { // TODO: must add post ID to file name.
            $post_id = $post->ID;
        }

        if(!$title) {
            $title = $post_id;
        }

        $title = trim($title);

        $lang_code = explode('-', str_replace(['_', ' '], '-', $selectedLang));

        if (array_shift($lang_code) == 'en') {
            $title .= "__lang__" . $selectedLang;
            $title = str_replace([' ', '-'], '_', $title);
            $title = preg_replace("/[^\p{L}a-z0-9_-]/ui", "", $title);
        } else {
            $md5_hash = md5($title);
            $title = $md5_hash . '__lang__' . $selectedLang;
        }

        if ((get_player_id() == 4 || get_player_id() == 5 || get_player_id() == 6) && $voice) {
            // For ElevenLabs (player 6), voice is "voice_id::FirstName" — use only FirstName.
            $voice_for_name = $voice;
            if (get_player_id() == 6 && strpos($voice, '::') !== false) {
                $voice_for_name = explode('::', $voice)[1];
            }
            $voice_for_name = str_replace([' ', '(', ')', '%20'], '_', $voice_for_name);

            $title .= '__voice__' . $voice_for_name;
        }

        return apply_filters('tts_file_name', $title, $selectedLang, $voice, $post);
    }


    /**
     * @param $all_settings_keys
     *
     * @return array
     */
    private static function set_tts_transient($all_settings_keys)
    {
        $all_settings_data = [];
        foreach ($all_settings_keys as $identifier => $settings_key) {
            $settings = get_option($settings_key);
            $settings = !$settings ? false : (array)$settings;
            $all_settings_data[$identifier] = $settings;
        }
        $cache_key = TTA_Cache::get_key('tts_get_settings');
        TTA_Cache::set($cache_key, $all_settings_data);

        return $all_settings_data;
    }

    /**
     * @param $identifier
     * @param $post_id
     *
     * @return mixed|null
     */
    public static function tts_get_settings($identifier = '', $post_id = '')
    {
        $all_settings_data = [];
        $all_settings_keys = [
            'listening' => 'tta_listening_settings',
            'settings' => 'tta_settings_data',
            'recording' => 'tta_record_settings',
            'customize' => 'tta_customize_settings',
            'analytics' => 'tta_analytics_settings',
            'compatible' => 'tta_compatible_data',
            'aliases' => 'tts_text_aliases',
        ];
        $cache_key = TTA_Cache::get_key('tts_get_settings');
        $cached_settings = TTA_Cache::get($cache_key);
        if (!$cached_settings) {
            $all_settings_data = self::set_tts_transient($all_settings_keys);
        } else {

            foreach ($all_settings_keys as $identifier_key => $settings_key) {
                if (!isset($cached_settings[$identifier_key])) {
                    $cached_settings = self::set_tts_transient($all_settings_keys);
                    break;
                }
            }

            $all_settings_data = $cached_settings;
        }

        if ($post_id) {
            $post_css_selectors = get_post_meta($post_id, 'tts_pro_custom_css_selectors');
            if (isset($post_css_selectors[0])) {
                $post_css_selectors = json_decode(json_encode($post_css_selectors[0]), true);
            }


            if (!empty($post_css_selectors) && isset($post_css_selectors['tta__settings_use_own_css_selectors']) && $post_css_selectors['tta__settings_use_own_css_selectors']) {

                if (self::check_all_properties_are_empty($post_css_selectors)) {
                    $settings = $all_settings_data['settings'];
                    $settings['tta__settings_css_selectors'] = $post_css_selectors['tta__settings_css_selectors'];
                    $settings['tta__settings_exclude_content_by_css_selectors'] = $post_css_selectors['tta__settings_exclude_content_by_css_selectors'];
                    $settings['tta__settings_exclude_texts'] = $post_css_selectors['tta__settings_exclude_texts'];
                    $settings['tta__settings_exclude_tags'] = $post_css_selectors['tta__settings_exclude_tags'];

                    $all_settings_data['settings'] = $settings;
                }
            }

        }


        if ($identifier) {
            $specified_identifier_data = isset($all_settings_data[$identifier]) ? $all_settings_data[$identifier] : $all_settings_data;
            $all_settings_data = $specified_identifier_data;
        }

        global $post;

        return \apply_filters('tts_get_settings', $all_settings_data, $post);
    }

    /**
     * Check if all properties in an array are empty.
     *
     * @param array $array The array to check.
     *
     * @return bool True if any property is not empty, false if all properties are empty.
     */
    public static function check_all_properties_are_empty($array)
    {
        // Iterate over each property in the array
        foreach ($array as $key => $value) {
            // Check if the property value is not empty
            if (!empty($value)) {
                return true; // Return true if any property is not empty
            }
        }

        return false; // Return false if all properties are empty
    }

    public static function get_mp3_file_urls($file_url_key, $post = '', $date = '', $file_name = '')
    {

        if (!$post) {

            global $post;
        }
        if (!is_pro_active() || self::get_player_id() < 3) {
            return [];
        }

        $date = TTA_Helper::get_post_date($post);


        $mp3_file_urls = get_post_meta($post->ID, 'tts_mp3_file_urls');
        if (isset($mp3_file_urls[0])) {
            $mp3_file_urls = $mp3_file_urls[0];
        }
        $final_mp3_file_ulrs = $mp3_file_urls;
        $should_update_urls = false;
        /**
         * front count to empty function used.
         * TTS-195: eric.corbett2@gmail.com TTA_Helper.php:556 issue fixed
         */
        if (get_post_meta($post->ID, 'tts_is_mp3_file_url_exists', true) && !empty($final_mp3_file_ulrs)) {
            return apply_filters('tts_mp3_file_urls', $final_mp3_file_ulrs, $post, $mp3_file_urls);
        }

        if (isset($mp3_file_urls[$file_url_key]) && $mp3_file_urls[$file_url_key]) {
            $url = $mp3_file_urls[$file_url_key];
            $language_code = $file_url_key;
            if (self::is_file_url_not_exists_and_is_file_empty($url, $date, $file_name)) {
                $should_update_urls = true;
                unset($final_mp3_file_ulrs[$file_url_key]);
                update_post_meta($post->ID, 'tts_is_mp3_file_url_exists', false);
            } else {
                // Generate new singed url or backup only current post applicable url.
                if (get_option('tts_is_backup_mp3_file') == 'true' && strtolower($language_code) == strtolower($file_url_key)) {
                    // previously generated mp3 file to 'TTA_Pro' folder but not backup to Google Cloud Storage.
                    // $url = 'http://localhost/azizulhasan/tts/wp-content/uploads/TTA_Pro/gtts/2024/04/21/Hello_world__lang__en_us.mp3';
                    $gcs_url = '';
                    if (strpos($url, 'TTA_Pro') !== false) {
                        $full_path = self::get_path_from_url($url);

                        $gcs_url = apply_filters('tts_upload_previous_file_to_gcs_and_get_new_url', $url, $full_path, $post, $language_code);
                        if ($gcs_url) {
                            $url = $gcs_url;
                        }
                    }

                    if (self::is_signed_url_expired($url)) {
                        // Get new signed url
                        $gcs_new_signed_url = apply_filters('tts_get_gcs_new_signed_url', $url, $post, $language_code);
                        if ($gcs_new_signed_url) {
                            $url = $gcs_new_signed_url;
                        }
                    }
                } elseif (get_option('tts_is_backup_mp3_file') == 'false' && strtolower($language_code) == strtolower($file_url_key) && strpos($url, 'https://storage.googleapis.com') !== false) {
                    $should_update_urls = true;
                }

                $final_mp3_file_ulrs[$language_code] = $url;
                update_post_meta($post->ID, 'tts_is_mp3_file_url_exists', true);
            }
        }

        //TODO: don't remove this loop, setup a settings if needed to check oll url or single url.
//		foreach ( $mp3_file_urls as $language_code => $url ) {
//
//			if ( self::is_file_url_not_exists_and_is_file_empty( $url, $date, $file_name ) ) {
//
//				$should_update_urls = true;
//			} else {
//				// Generate new singed url or backup only current post applicable url.
//				if ( get_option( 'tts_is_backup_mp3_file' ) == 'true' && strtolower( $language_code ) == strtolower( $file_url_key ) ) {
//					// previously generated mp3 file to 'TTA_Pro' folder but not backup to Google Cloud Storage.
//					// $url = 'http://localhost/azizulhasan/tts/wp-content/uploads/TTA_Pro/gtts/2024/04/21/Hello_world__lang__en_us.mp3';
//					$gcs_url = '';
//					if ( strpos( $url, 'TTA_Pro' ) !== false ) {
//						$full_path = self::get_path_from_url( $url );
//						$gcs_url   = apply_filters( 'tts_upload_previous_file_to_gcs_and_get_new_url', $url, $full_path, $post, $language_code );
//						if ( $gcs_url ) {
//							$url = $gcs_url;
//						}
//					}
//
//					if ( self::is_signed_url_expired( $url ) ) {
//						// Get new signed url
//						$gcs_new_signed_url = apply_filters( 'tts_get_gcs_new_signed_url', $url, $post );
//						if ( $gcs_new_signed_url ) {
//							$url = $gcs_new_signed_url;
//						}
//					}
//				} elseif ( get_option( 'tts_is_backup_mp3_file' ) == 'false' && strtolower( $language_code ) == strtolower( $file_url_key ) && strpos( $url, 'https://storage.googleapis.com' ) !== false ) {
//					$should_update_urls = true;
//					continue;
//				}
//
//
//				$final_mp3_file_ulrs[ $language_code ] = $url;
//			}
//		}

        if ($should_update_urls
            || empty($final_mp3_file_ulrs)
        ) {
            update_post_meta($post->ID, 'tts_mp3_file_urls', $final_mp3_file_ulrs);
        }

        return apply_filters('tts_mp3_file_urls', $final_mp3_file_ulrs, $post, $mp3_file_urls);
    }

    /**
     * @param $url
     *
     * @return string
     */
    public static function get_path_from_url($url)
    {
        $audio_dir = TTA_PRO_GTTS_DIR;
        $audio_dir_url = TTA_PRO_GTTS_DIR_URL;
        $player_id = self::get_player_id();

        if ($player_id == 4) {

            if (strpos($url, 'gtts') !== false) {
                $url = str_replace('gtts/', '', $url);
            }

            if (strpos($url, 'chat_gpt_tts') !== false) {
                $url = str_replace('chat_gpt_tts/', '', $url);
            }

            $audio_dir = TTA_PRO_AUDIO_DIR;
            $audio_dir_url = TTA_PRO_AUDIO_DIR_URL;
        }

        if ($player_id == 5) {
            $audio_dir = TTA_PRO_CHAT_GPT_TTS_DIR;
            $audio_dir_url = TTA_PRO_CHAT_GPT_TTS_DIR_URL;
        }


        $log_data = apply_filters('tts_get_path_from_url', array(
            'url' => $url,
            'path' => $audio_dir,
        ));


        // Extract the relative path from the full URL
        $relative_path = str_replace($audio_dir_url, '', $log_data['url']);

        // Construct the full path
        return rtrim($log_data['path'], '/') . '/' . $relative_path;
    }


    /**
     * Is plugin active
     */
    public static function is_pro_active()
    {
        return is_pro_active();
    }

    public static function is_audio_folder_writable()
    {
        $upload_dir = wp_upload_dir();
        $base_dir = $upload_dir['basedir'];

        if (is_writable($base_dir)) {
            return true;
        }

        return false;
    }

    public static function get_player_id()
    {
        return get_player_id();
    }

    /**
     * Is pro license active
     */
    public static function is_pro_license_active()
    {
        if (self::is_pro_active()) {
            return apply_filters('tts_is_pro_license_active', false);
        }

        return false;
    }

    public static function set_default_settings()
    {
        $settings = (array)get_option('tta_settings_data');
        if (!isset($settings['tta__settings_enable_button_add'])) {
            TTA_Activator::activate(true);
        }
    }

    public static function is_file_url_not_exists_and_is_file_empty($url, $date, $file_name)
    {

        // If file backup is not enabled then check if file exists and file has content.
        $backup_status = (int) get_option('tts_is_backup_mp3_file', false);

        /**
         * TTS-184
         */
        if (!$backup_status) {
            $full_path = self::get_path_from_url($url);
            if (file_exists($full_path) || (file_exists($full_path) && filesize($full_path) > 0)) {
                // Check if the file is exist in proper folder also check if the file name is same?
                if ($date && $file_name) {
                    $url_file_name = explode($date, $url);
                    $url_file_name = isset($url_file_name[1]) ? trim($url_file_name[1], "/\\") : false;

                    if (!$url_file_name) {
                        return true;
                    }

                    // TODO: create documentation for this filter.
                    if (apply_filters('tts_should_match_filename_with_post_title', false,  $file_name, $date, $url)) {
                        $url_file_basename = explode('__lang__', $url_file_name);
                        $url_file_basename = isset($url_file_basename[0]) ? trim($url_file_basename[0]) : false;
                        $current_post_basename = explode('__lang__', $file_name);
                        $current_post_basename = isset($current_post_basename[0]) ? trim($current_post_basename[0]) : false;
                        if (!is_string($url_file_basename) || !is_string($current_post_basename) || $url_file_basename != $current_post_basename) {
                            return true;
                        }
                    }
                }

                return false;
            }
        }

        $file_headers = @get_headers($url);

        if (!$file_headers && function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_NOBODY, true); // fetch headers only, no body
            curl_setopt($ch, CURLOPT_HEADER, true);
            $file_headers = curl_exec($ch);
            curl_close($ch);
        }
                

        if (isset($file_headers[0])) {
            $file_headers = $file_headers[0];
        }

        if (!$file_headers || strpos($file_headers, 'Not Found') !== false) {
            return true;
        }


        return false;
    }

    /**
     * Function to check if a signed URL has expired.
     */
    public static function is_signed_url_expired($signedUrl)
    {
        // Parse the URL to get the query string
        $urlComponents = parse_url($signedUrl);
        if(!isset($urlComponents['query'])) {
            return false;
        }
        parse_str($urlComponents['query'], $queryParameters);

        if(!isset($queryParameters['X-Goog-Date']) || !isset($queryParameters['X-Goog-Expires'])) {
            return false;
        }

        // Convert the expiration time to a Unix timestamp
        $expirationTimestamp = strtotime($queryParameters['X-Goog-Date']) + $queryParameters['X-Goog-Expires'];


        // Get the current Unix timestamp
        $currentTimestamp = time();

        // Compare the expiration time with the current time
        return $expirationTimestamp < $currentTimestamp;
    }


    /**
     * Get all categories in a specific format.
     *
     * @return array An associative array with category slugs as keys and category names as values.
     */
    public static function get_all_categories()
    {

        $cache_key = TTA_Cache::get_key('get_all_categories');
        $cache_value = TTA_Cache::get($cache_key);
        if ($cache_value) {
            return $cache_value;
        }

        if (!function_exists('get_categories')) {
            require_once ABSPATH . 'wp-includes/category.php';
        }

        // Fetch all categories.
        $categories = get_categories();
        // Initialize an empty array to hold the formatted categories.
        $formatted_categories = array();

        // Loop through each category and format the output.
        foreach ($categories as $category) {
            $formatted_categories[$category->slug] = $category->name;
        }
        /**
         * TTS-174
         */
        $formatted_categories += self::tts_get_all_wc_categories($formatted_categories);

        $formatted_categories = apply_filters('tts_get_all_categories', $formatted_categories);

        TTA_Cache::set($cache_key, $formatted_categories);


        return $formatted_categories;
    }

    /**
     * Get all tags in a specific format.
     *
     * @return array An associative array with tag slugs as keys and tag names as values.
     */
    public static function get_all_tags()
    {

        $cache_key = TTA_Cache::get_key('get_all_tags');
        $cache_value = TTA_Cache::get($cache_key);
        if ($cache_value) {
            return $cache_value;
        }

        if (!function_exists('get_tags')) {
            require_once ABSPATH . 'wp-includes/category.php';
        }
        // Fetch all tags.
        $tags = get_tags(array(
            'hide_empty' => false
        ));

        // Initialize an empty array to hold the formatted tags.
        $formatted_tags = array();

        // Loop through each tag and format the output.
        foreach ($tags as $tag) {
            $formatted_tags[$tag->slug] = $tag->name;
        }

        /**
         * TTS-174
         */
        $formatted_tags += self::tts_get_all_wc_tags($formatted_tags);

        $formatted_tags = apply_filters('tts_get_all_tags', $formatted_tags);

        TTA_Cache::set($cache_key, $formatted_tags);

        return $formatted_tags;

    }

    private static function tts_get_all_wc_categories($formatted_categories) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return $formatted_categories;
        }
        $terms = get_terms([
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ]);


        $categories = [];
        if (!is_wp_error($terms)) {
            foreach ($terms as $term) {
                $categories[$term->slug] = $term->name;
            }
        }

        return $formatted_categories + $categories;
    }

    private static function tts_get_all_wc_tags($formatted_tags) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return $formatted_tags;
        }
        $terms = get_terms([
            'taxonomy' => 'product_tag',
            'hide_empty' => false,
        ]);

        $tags = [];
        if (!is_wp_error($terms)) {
            foreach ($terms as $term) {
                $tags[$term->slug] = $term->name;
            }
        }

        return $formatted_tags + $tags;
    }

    /**
     * Cleans up the input string by removing double delimiters,
     * extra spaces, and extra newlines.
     *
     * @param string $inputString The input string to process.
     * @param string $delimiter The delimiter to check for doubles.
     *
     * @return string The cleaned-up string.
     */
    public static function clean_string($inputString)
    {
        $delimiter = \apply_filters('tts_sentence_delimiter', '.');
        // Remove double delimiters separated by space
//		$spaceSeparatedDoubleDelimiterPattern = '/' . preg_quote( $delimiter ) . '\s+' . preg_quote( $delimiter ) . '/';
//		$cleanedString                        = preg_replace( $spaceSeparatedDoubleDelimiterPattern, $delimiter, $inputString );

        // Remove double delimiters (without space separation)
//		$doubleDelimiterPattern = '/' . preg_quote( $delimiter ) . '{2,}/';
//		$cleanedString          = preg_replace( $doubleDelimiterPattern, $delimiter, $cleanedString );

        // Remove extra spaces (more than one space)
        $cleanedString = preg_replace('/\s{2,}/', ' ', $inputString);

        // Remove spaces before the delimiter and ensure one space after
        $spaceAroundDelimiterPattern = '/\s*' . preg_quote($delimiter) . '\s*/';
//		$cleanedString               = preg_replace( $spaceAroundDelimiterPattern, $delimiter . ' ', $inputString );

        // Remove extra newlines (more than one newline)
        $cleanedString = preg_replace('/\n{2,}/', "\n", $cleanedString);

        // Trim leading and trailing whitespace
        $cleanedString = trim($cleanedString);

        return $cleanedString;
    }


    public static function get_player_language_and_player_voice($language, $voice, $plugin_all_settings, $post)
    {
        return apply_filters('tts_player_language_and_player_voice', [
            'language' => $language,
            'voice' => $voice
        ], $plugin_all_settings, $post);
    }

    public static function is_edit_page()
    {
        global $pagenow;

        // Check if we are in the admin area and on the edit post/page screen
        if (is_admin()) {
            if ($pagenow === 'post.php' || $pagenow === 'post-new.php') {
                return true;
            }
        }

        return false;
    }

    public static function is_text_to_audio_page()
    {
        // Ensure we are in the admin area
        if (is_admin()) {
            // Get the current screen object
            $screen = get_current_screen();
            // Check if we are on the "text-to-audio" page
            if ($screen && $screen->id === 'toplevel_page_text-to-audio') {
                return true;
            }

            return false;
        }
    }

    /**
     * Get the text value based on the given attributes and saved texts.
     *
     * @param array $atts The attributes array.
     * @param array $saved_texts The saved texts array.
     * @param string $key The key to look for in both arrays.
     * @param string $default The default text if neither $atts nor $saved_texts has the value.
     * @param string $text_domain The text domain for translation.
     *
     * @return string The final text value.
     */
    public static function get_text_value($atts, $saved_texts, $key, $default, $text_domain)
    {
        if (isset($atts[$key]) && strlen($atts[$key])) {
            return esc_html(sanitize_text_field($atts[$key]));
        } elseif (isset($saved_texts[$key])) {
            return esc_html(sanitize_text_field($saved_texts[$key]));
        } else {
            return __($default, $text_domain);
        }
    }

    /**
     * Get all ACF fields including subfields.
     *
     * @return array An associative array of all ACF fields with field names as keys and "name::label" as values.
     */
    public static function get_all_acf_fields()
    {
        // Ensure the ACF API is loaded
        if (!function_exists('acf_get_field_groups') || !function_exists('acf_get_fields')) {
            return [];
        }

        // Get all field groups
        $field_groups = acf_get_field_groups();
        $all_acf_fields = [];

        if ($field_groups) {
            foreach ($field_groups as $field_group) {
                // Attempt to get fields for the current field group
                $fields = acf_get_fields($field_group);
                foreach ($fields as $field) {
                    // Add the field to the result array
                    $all_acf_fields[$field['name']] = $field['name'] . '::' . $field['label'];

                    // Check if the field has subfields and process them recursively
//					if (isset($field['sub_fields']) && is_array($field['sub_fields'])) {
//						self::process_acf_fields($field['sub_fields'], $all_acf_fields);
//					}
                }

//				if (is_array($fields)) {
//					// Process fields recursively
//					self::process_acf_fields($fields, $all_acf_fields);
//				}
            }
        }

        return $all_acf_fields;
    }

    /**
     * Recursive helper function to process ACF fields and subfields.
     *
     * @param array $fields List of fields to process.
     * @param array &$all_acf_fields Reference to the result array.
     */
    public static function process_acf_fields($fields, &$all_acf_fields)
    {
        foreach ($fields as $field) {
            // Add the field to the result array
            $all_acf_fields[$field['name']] = $field['name'] . '::' . $field['label'];

            // Check if the field has subfields and process them recursively
            if (isset($field['sub_fields']) && is_array($field['sub_fields'])) {
                self::process_acf_fields($field['sub_fields'], $all_acf_fields);
            }
        }
    }

    public static function is_acf_active()
    {

        $pro_plugins = [
            'advanced-custom-fields/acf.php',
            'advanced-custom-fields-pro/acf.php',
            'advanced-custom-fields-pro/acf-pro.php'
        ];

        $status = false;

        foreach ($pro_plugins as $plugin) {
            if (is_plugin_active($plugin)) {
                $status = true;
                break; // Exit loop as soon as one active plugin is found
            }
        }


        return $status;
    }

    public static function all_post_status()
    {

        $cache_key = TTA_Cache::get_key('all_post_status');
        $cache_value = TTA_Cache::get($cache_key);
        if ($cache_value) {
            return $cache_value;
        }

        $post_statuses = get_post_stati(['show_in_admin_status_list' => true], 'objects');
        $status_array = [];

        foreach ($post_statuses as $status) {
            $status_array[$status->name] = $status->label;
        }

        TTA_Cache::set($cache_key, $status_array);

        return $status_array;
    }

    /**
     * Retrieves and displays player settings based on user roles and customization options.
     *
     * This function checks if the current user has permission to view the player button
     * based on the settings retrieved from the customization menu. It first loads the
     * settings for the player button, and then verifies whether the user belongs to
     * one of the allowed roles. If no roles are specified, it defaults to displaying
     * the player button to all users.
     *
     * @return bool True if the player button should be displayed, false otherwise.
     */
    public static function display_player_based_on_user_role()
    {
        // Retrieve customization settings for the player
        $customize = (array)self::tts_get_settings('customize');
        $display_player_to = false;

        // Check if button settings exist
        if (isset($customize['buttonSettings'])) {
            // Get current user and their roles
            $user = wp_get_current_user();
            $user_role = !empty($user->roles) ? $user->roles : [];

            // Safely retrieve button settings, avoid key error
            $button_settings = (array)$customize['buttonSettings'];
            $display_player_to_roles = isset($button_settings['display_player_to'])
                ? (array)$button_settings['display_player_to']
                : [];

            // If user roles are restricted and the 'all' role is not allowed
            if (!empty($user_role) && !in_array('all', $display_player_to_roles)) {
                $has_any_role = false;
                // Check if the user has any of the allowed roles
                foreach ($display_player_to_roles as $role) {
                    if (in_array($role, $user_role)) {
                        $has_any_role = true;
                        break; // Stop checking once a matching role is found
                    }
                }

                // If no matching role is found, prevent player display
                if (!$has_any_role) {
                    $display_player_to = true;
                }
            } else {
                $display_player_to = true;
            }

            // If 'all' is included in the allowed roles display player.
            // or this "who_can_download_mp3_file" not exists to support already installed plugins.
            if (in_array('all', $display_player_to_roles)
                || !isset($button_settings['display_player_to'])
                || empty($button_settings['display_player_to'])
            ) {
                $display_player_to = false;
            }
        }

        return $display_player_to;
    }

    public static function get_post_types()
    {
        $cache_key = TTA_Cache::get_key('get_post_types');
        $cache_value = TTA_Cache::get($cache_key);
        if ($cache_value) {
            return apply_filters('tts_get_post_types', $cache_value);
        }
        $post_types = get_post_types(array(
            'public' => 1, // Only get public post types
        ), 'array');

        $post_types_arr = [];

        foreach ($post_types as $post_type) {
            $post_types_arr[$post_type->name] = $post_type->label;
        }

        TTA_Cache::set($cache_key, $post_types_arr);

        return apply_filters('tts_get_post_types', $post_types_arr);
    }


    /**
     * Retrieves and applies custom CSS styles for a block.
     *
     * This function takes in attributes and existing customization settings,
     * then determines the final values for background color, text color, and width.
     * If attributes are provided, they override existing customization settings;
     * otherwise, defaults are applied.
     *
     * @param array $atts Attributes passed to the block (e.g., background color, text color, width).
     * @param array $customize Existing customization settings.
     *
     * @return array Filtered array of CSS styles for the block.
     */
    public static function get_block_css($atts, $customize)
    {
        if (isset($atts['backgroundColor'])) {
            $customize['backgroundColor'] = $atts['backgroundColor'];
        } elseif (isset($customize['backgroundColor'])) {
            $customize['backgroundColor'] = $customize['backgroundColor'];
        } else {
            $customize['backgroundColor'] = '#184c53';
        }

        if (isset($atts['color'])) {
            $customize['color'] = $atts['color'];
        } elseif (isset($customize['color'])) {
            $customize['color'] = $customize['color'];
        } else {
            $customize['color'] = '#ffffff';
        }

        if (isset($atts['width'])) {
            $customize['width'] = $atts['width'];
        } elseif (isset($customize['width'])) {
            $customize['width'] = $customize['width'];
        } else {
            $customize['width'] = '100';
        }

        return apply_filters('get_block_css', $customize);
    }


    /**
     * Determines whether the player should generate an MP3 file based on a date range.
     *
     * This function retrieves the customization settings, checks if the button settings contain
     * the `generate_mp3_date_from` and `generate_mp3_date_to` values, and determines whether
     * the current date falls within the specified date range.
     *
     * @param object $post post object.
     *
     * @return bool True if the MP3 should be generated based on the date range, false otherwise.
     */
    public static function display_player_based_on_date_range($post)
    {
        // Retrieve customization settings for the player
        $customize = (array)self::tts_get_settings('customize');
        $should_generate_mp3 = false;

        // Check if button settings exist
        if (isset($customize['buttonSettings']) && isset($post->post_date)) {
            // Safely retrieve button settings, avoiding key errors
            $button_settings = (array)$customize['buttonSettings'];

            $generate_mp3_date_from = isset($button_settings['generate_mp3_date_from'])
                ? (string)$button_settings['generate_mp3_date_from']
                : '';

            $generate_mp3_date_to = isset($button_settings['generate_mp3_date_to'])
                ? (string)$button_settings['generate_mp3_date_to']
                : '';

            // Get the current date in YYYY-MM-DD format
            $post_date = explode(' ', $post->post_date);
            if (isset($post_date[0])) {
                $post_date = $post_date[0];
            }
            // Validate date format (ensure correct YYYY-MM-DD format)
            if (self::validate_date($generate_mp3_date_from) && self::validate_date($generate_mp3_date_to)) {
                // Check if the post date falls within the date range
                if ($post_date >= $generate_mp3_date_from && $post_date <= $generate_mp3_date_to) {
                    $should_generate_mp3 = true;
                }
            }

            if (empty($generate_mp3_date_to) && self::validate_date($generate_mp3_date_from)) {
                // Check if the post date is greater or equal to date_from
                if ($post_date >= $generate_mp3_date_from) {
                    $should_generate_mp3 = true;
                }
            }

            if (empty($generate_mp3_date_from) && self::validate_date($generate_mp3_date_to)) {
                // Check if the post date is less or equal to  date_to
                if ($post_date <= $generate_mp3_date_to) {
                    $should_generate_mp3 = true;
                }
            }


            // both value are empty then return true
            if (empty($generate_mp3_date_from) && empty($generate_mp3_date_to)) {
                $should_generate_mp3 = true;
            }

        }

        return $should_generate_mp3;
    }

    /**
     * Validates a date string to ensure it follows the YYYY-MM-DD format.
     *
     * @param string $date The date string to validate.
     *
     * @return bool True if valid, false otherwise.
     */
    private static function validate_date($date)
    {
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1;
    }


    public static function get_post_date($post)
    {
        $post_date = get_post_field('post_date', $post->ID);
        $date = date('Y/m/d', strtotime($post_date));

        return $date;
    }

    public static function is_listening_lang_or_voice_changed($current_data)
    {
        $previous_data = get_option('tta_listening_settings');


        if ( !is_object($previous_data) ) {
            $previous_data = (object) $previous_data;
        }

        if ( !is_object($current_data) ) {
            $current_data = (object) $current_data;
        }

        $keys_to_check = [
            'tta__listening_lang',
            'tta__listening_voice',
            'tta__available_currentPlayerVoices',
            'tta__currentPlayerLanguages',
        ];

        foreach ($keys_to_check as $key) {
            if (!property_exists($previous_data, $key) || !property_exists($current_data, $key)) {
                return true; // key missing in one of the datasets
            }

            $prev_value = $previous_data->$key;
            $curr_value = $current_data->$key;

            // Use json_encode for deep comparison of arrays/objects
            if (json_encode($prev_value) !== json_encode($curr_value)) {
                return true; // Value changed
            }
        }

        return false; // No changes detected
    }

    public static function is_player_number_changed($current_data)
    {
        $current_data = (array)$current_data;
        $previous_data = (array)TTA_Helper::tts_get_settings('customize');

        $previous_data['buttonSettings'] = (array) $previous_data['buttonSettings'];
        $current_data['buttonSettings'] = (array) $current_data['buttonSettings'];

        $previous_player_id = isset($previous_data['buttonSettings']['id']) ? $previous_data['buttonSettings']['id'] : 1;
        $current_player_id = isset($current_data['buttonSettings']['id']) ? $current_data['buttonSettings']['id'] : 1;

        return  $previous_player_id == $current_player_id ? false : true;
    }

    public static function delete_post_meta($meta_key = 'tts_is_mp3_file_url_exists')
    {
        global $wpdb;

        $table = $wpdb->postmeta;

        $deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM $table WHERE meta_key = %s",
                $meta_key
            )
        );


        return $deleted;
    }

    public static function clean_content($content) {

        $content = wp_strip_all_tags($content, true);

        $content = preg_replace('/\\\\{2,}"/', '\"', $content);

        $content = preg_replace("/\\\\{2,}'/", "\'", $content);

        $content = self::clean_string($content);

        $content = self::remove_js_and_css_from_content($content);

        return $content;
    }

    public static function  delete_duplicate_post_ids_if_have( $post_id ){
        $duplicate_post_ids = get_option('tts_duplicate_post_ids', array());
        if(in_array($post_id, $duplicate_post_ids)) {
            // Search for the index
            $key = array_search($post_id, $duplicate_post_ids);

            if(is_numeric($key)) {
                unset($duplicate_post_ids[$key]);

                update_option('tts_duplicate_post_ids', $duplicate_post_ids, false);

                update_post_meta( $post_id, 'tts_mp3_file_urls', [] );
            };
        }
    }

    public static function remove_js_and_css_from_content($content) {
        // Remove <script>...</script>
        $content = preg_replace('#<script\b[^>]*>(.*?)</script>#is', '', $content);
    
        // Remove <style>...</style>
        $content = preg_replace('#<style\b[^>]*>(.*?)</style>#is', '', $content);
    
        // Remove external CSS <link rel="stylesheet">
        $content = preg_replace('#<link\b[^>]*rel=["\']stylesheet["\'][^>]*>#i', '', $content);
    
        // Remove external JS <script src="..."></script>
        $content = preg_replace('#<script\b[^>]*src=["\'].*?["\'][^>]*></script>#i', '', $content);
    
        return $content;
    }
    
    public static function tts_has_shortcode($post) {
        return isset($post->post_content) && (has_shortcode($post->post_content, 'tta_listen_btn') || has_shortcode($post->post_content, 'atlasvoice'));
    }

    public  static  function detect_browser() {
        $user_agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

        $browser = 'unknown';
        if (strpos($user_agent, 'firefox') !== false) {
            $browser = 'firefox';
        } elseif (strpos($user_agent, 'chrome') !== false) {
            $browser = 'chrome';
        } elseif (strpos($user_agent, 'safari') !== false) {
            $browser = 'safari';
        } elseif (strpos($user_agent, 'edge') !== false) {
            $browser = 'edge';
        } elseif (strpos($user_agent, 'opr') !== false || strpos($user_agent, 'opera') !== false) {
            $browser = 'opera';
        }

        return $browser;
    }

    public static  function get_user_ip_address() {
        $ip_keys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ];

        foreach ( $ip_keys as $key ) {
            if ( ! empty( $_SERVER[ $key ] ) ) {
                $ip = $_SERVER[ $key ];

                // Handle multiple IPs (e.g. "116.206.88.143, 10.0.0.1")
                if ( strpos( $ip, ',' ) !== false ) {
                    $ip = explode( ',', $ip )[0];
                }

                return sanitize_text_field( trim( $ip ) );
            }
        }

        return 'UNKNOWN';
    }

    /**
     * Output AudioObject JSON-LD schema markup in wp_head for the current post.
     *
     * Hooked to wp_head at priority 99. Only outputs on singular posts/pages
     * where the audio player is enabled.
     *
     * @since 2.2.0
     * @return void
     */
    public static function output_audio_schema_head()
    {
        if (!is_singular()) {
            return;
        }

        global $post;
        if (!$post || !self::should_load_button($post, 'audio_schema')) {
            return;
        }

        // Allow disabling schema output entirely
        if (!apply_filters('tts_enable_audio_schema_markup', true, $post)) {
            return;
        }

        $post_title = get_the_title($post);
        $post_url   = get_permalink($post);

        // Determine contentUrl: use MP3 if available (Pro), otherwise fall back to post URL (browser TTS)
        $content_url     = $post_url;
        $encoding_format = '';

        if (is_pro_active()) {
            $settings  = self::tts_get_settings('', $post->ID);
            $language  = self::tts_site_language($settings);
            $voice     = self::tts_get_voice($settings);
            $lang_voice = self::get_player_language_and_player_voice($language, $voice, $settings, $post);
            $language  = $lang_voice['language'];
            $voice     = $lang_voice['voice'];
            $file_url_key = self::tts_get_file_url_key($language, $voice);

            $mp3_file_urls = get_post_meta($post->ID, 'tts_mp3_file_urls');
            if (isset($mp3_file_urls[0])) {
                $mp3_file_urls = $mp3_file_urls[0];
            }
            if (!empty($mp3_file_urls) && isset($mp3_file_urls[$file_url_key]) && $mp3_file_urls[$file_url_key]) {
                $content_url     = $mp3_file_urls[$file_url_key];
                $encoding_format = 'audio/mpeg';
            }
        }

        // Estimate duration from word count at 150 wpm, format as ISO 8601 (PT5M30S)
        $content       = get_the_content(null, false, $post);
        $content       = wp_strip_all_tags($content);
        $word_count    = str_word_count($content);
        $total_seconds = ($word_count > 0) ? intval(ceil(($word_count / 150) * 60)) : 0;
        $minutes       = intval(floor($total_seconds / 60));
        $seconds       = $total_seconds % 60;
        $duration      = 'PT';
        if ($minutes > 0) {
            $duration .= $minutes . 'M';
        }
        if ($seconds > 0 || $minutes === 0) {
            $duration .= $seconds . 'S';
        }

        // Build schema data array
        $schema_data = [
            '@context'            => 'https://schema.org',
            '@type'               => 'AudioObject',
            'name'                => 'Listen to: ' . $post_title,
            'description'         => 'Audio version of ' . $post_title,
            'contentUrl'          => esc_url($content_url),
            'duration'            => $duration,
            'inLanguage'          => get_locale(),
            'isAccessibleForFree' => true,
            'uploadDate'          => get_the_date('c', $post->ID),
            'associatedArticle'   => [
                '@type'    => 'Article',
                'headline' => $post_title,
                'url'      => esc_url($post_url),
            ],
        ];

        if (!empty($encoding_format)) {
            $schema_data['encodingFormat'] = $encoding_format;
        }

        // Add author information
        $post_author = get_the_author_meta('display_name', $post->post_author);
        if (!empty($post_author)) {
            $schema_data['author'] = [
                '@type' => 'Person',
                'name'  => $post_author,
            ];
        }

        // Add publisher information
        $site_name = get_bloginfo('name');
        if (!empty($site_name)) {
            $schema_data['publisher'] = [
                '@type' => 'Organization',
                'name'  => $site_name,
            ];
        }

        /**
         * Filter the AudioObject schema data before JSON-LD output.
         *
         * @since 2.2.0
         * @param array   $schema_data The schema data array.
         * @param WP_Post $post        The current post object.
         */
        $schema_data = apply_filters('tta_audio_schema', $schema_data, $post);

        // Legacy filter for backward compatibility
        $schema_data = apply_filters('tts_audio_schema_data', $schema_data, [], $post);

        // Generate JSON-LD markup
        $json = wp_json_encode($schema_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $schema_markup = "<!-- Text To Audio Schema -->\n<script type=\"application/ld+json\">\n" . $json . "\n</script>\n";

        // Allow filtering of final schema markup
        $schema_markup = apply_filters('tts_audio_schema_markup', $schema_markup, $schema_data, [], $post);

        echo $schema_markup;
    }

    /**
     * Generate AudioObject JSON-LD schema markup string.
     *
     * @deprecated 2.2.0 Use TTA_Helper::output_audio_schema_head() instead.
     *             Schema is now output via the wp_head hook automatically.
     * @param array $params Legacy parameters (no longer used).
     * @return string Empty string. Schema is output via wp_head hook.
     */
    public static function generate_audio_schema($params = [])
    {
        // Schema is now output via wp_head hook to avoid duplicate markup.
        return '';
    }

    /**
     * Detect caching/optimization plugins and their compatibility status.
     *
     * Returns an array of known caching plugins with:
     *  - name: Human-readable plugin name
     *  - slug: Plugin directory slug
     *  - installed: Whether the plugin is installed
     *  - active: Whether the plugin is currently active
     *  - handled: Whether TTA_Hooks has JS exclusion filters for it
     *
     * @since 2.2.0
     * @return array
     */
    public static function get_detected_caching_plugins() {
        if ( ! function_exists( 'is_plugin_active' ) ) {
            include_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        if ( ! function_exists( 'get_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $all_plugins = array_keys( get_plugins() );

        $known_plugins = [
            [
                'name'     => __( 'Autoptimize', 'text-to-audio' ),
                'slug'     => 'autoptimize',
                'basename' => 'autoptimize/autoptimize.php',
                'handled'  => true,
            ],
            [
                'name'     => __( 'LiteSpeed Cache', 'text-to-audio' ),
                'slug'     => 'litespeed-cache',
                'basename' => 'litespeed-cache/litespeed-cache.php',
                'handled'  => true,
            ],
            [
                'name'     => __( 'WP Rocket', 'text-to-audio' ),
                'slug'     => 'wp-rocket',
                'basename' => 'wp-rocket/wp-rocket.php',
                'handled'  => true,
            ],
            [
                'name'     => __( 'W3 Total Cache', 'text-to-audio' ),
                'slug'     => 'w3-total-cache',
                'basename' => 'w3-total-cache/w3-total-cache.php',
                'handled'  => true,
            ],
            [
                'name'     => __( 'WP-Optimize', 'text-to-audio' ),
                'slug'     => 'wp-optimize',
                'basename' => 'wp-optimize/wp-optimize.php',
                'handled'  => true,
            ],
            [
                'name'     => __( 'SG Optimizer', 'text-to-audio' ),
                'slug'     => 'sg-cachepress',
                'basename' => 'sg-cachepress/sg-cachepress.php',
                'handled'  => true,
            ],
        ];

        $result = [];
        foreach ( $known_plugins as $plugin ) {
            $installed = in_array( $plugin['basename'], $all_plugins, true );
            $active    = $installed && \is_plugin_active( $plugin['basename'] );

            $result[] = [
                'name'      => $plugin['name'],
                'slug'      => $plugin['slug'],
                'installed' => $installed,
                'active'    => $active,
                'handled'   => $plugin['handled'],
            ];
        }

        return $result;
    }

    /**
     * Get the URL of the most recently published post for the enabled post types.
     *
     * @since 2.2.0
     * @return string The permalink of the most recent post, or home_url() as fallback.
     */
    public static function get_latest_post_preview_url() {
        $settings   = self::tts_get_settings( 'settings' );
        $post_types = isset( $settings['tta__settings_allow_listening_for_post_types'] )
            ? (array) $settings['tta__settings_allow_listening_for_post_types']
            : [ 'post' ];

        if ( empty( $post_types ) ) {
            $post_types = [ 'post' ];
        }

        $recent = get_posts( [
            'numberposts' => 1,
            'post_status' => 'publish',
            'post_type'   => $post_types,
            'orderby'     => 'date',
            'order'       => 'DESC',
        ] );

        if ( ! empty( $recent ) ) {
            return get_permalink( $recent[0]->ID );
        }

        return home_url();
    }
}
