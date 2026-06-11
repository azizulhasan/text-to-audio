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

    /**
     * TTS-236: Atomically increment the running total plays counter.
     *
     * Used as the source of truth for notices/dashboards instead of scanning
     * the analytics table. Uses direct SQL for atomicity under concurrent writes.
     *
     * @param int $delta Number of new plays to add to the total.
     * @return void
     */
    public static function increment_total_plays_counter( $delta ) {
        $delta = (int) $delta;
        if ( $delta <= 0 ) {
            return;
        }

        global $wpdb;
        $option_name = 'tta_total_plays_counter';

        // Check if the option exists.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT option_id FROM {$wpdb->options} WHERE option_name = %s LIMIT 1",
            $option_name
        ) );

        if ( $exists === null ) {
            // First write — initialize. Migration will reconcile later.
            add_option( $option_name, (string) $delta, '', 'no' );
        } else {
            // Atomic increment via direct SQL. This is safe under concurrent writes
            // because MySQL guarantees atomicity of a single UPDATE statement.
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $wpdb->query( $wpdb->prepare(
                "UPDATE {$wpdb->options} SET option_value = CAST(option_value AS UNSIGNED) + %d WHERE option_name = %s",
                $delta,
                $option_name
            ) );
            // Bust the WP object cache so get_option() reads the fresh value.
            wp_cache_delete( $option_name, 'options' );
            wp_cache_delete( 'alloptions', 'options' );
        }

        // Invalidate the notice transient so the next admin load sees the fresh value.
        delete_transient( 'tta_milestone_total_plays' );
    }

    /**
     * TTS-236: Read the current running total plays counter.
     *
     * @return int|null Counter value, or null if not initialized yet.
     */
    public static function get_total_plays_counter() {
        $value = get_option( 'tta_total_plays_counter', null );
        if ( $value === null || $value === false ) {
            return null;
        }
        return (int) $value;
    }

    /**
     * TTS-236: Run a potentially-expensive query with memory and row-count guards.
     *
     * If the table is larger than $max_rows, or PHP is already using > 50% of its
     * memory limit, returns $fallback instead of running $callback.
     *
     * @param string   $table    Full table name (with prefix).
     * @param callable $callback Function that runs the actual query.
     * @param mixed    $fallback Value to return if guards trip.
     * @param int      $max_rows Maximum row count allowed before skipping.
     * @return mixed
     */
    public static function safe_large_query( $table, $callback, $fallback = null, $max_rows = 10000 ) {
        global $wpdb;

        // Memory guard — don't start if we're already at 50% of the limit.
        $limit_raw = ini_get( 'memory_limit' );
        if ( $limit_raw && function_exists( 'wp_convert_hr_to_bytes' ) ) {
            $limit_bytes = wp_convert_hr_to_bytes( $limit_raw );
            if ( $limit_bytes > 0 && memory_get_usage( true ) > ( $limit_bytes * 0.5 ) ) {
                return $fallback;
            }
        }

        // Row-count guard.
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
        $count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" );
        if ( $count > $max_rows ) {
            return $fallback;
        }

        try {
            return $callback();
        } catch ( \Throwable $e ) {
            // TTS-247: log only when WP_DEBUG is on; production sites stay quiet.
            if ( defined( 'WP_DEBUG' ) && WP_DEBUG && function_exists( 'error_log' ) ) {
                // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
                error_log( 'TTA safe_large_query failed: ' . $e->getMessage() );
            }
            return $fallback;
        }
    }

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

        // Polylang multilingual plugin.
        $polylang_languages = array();
        if ( function_exists( 'pll_languages_list' ) ) {
            $pll_langs = pll_languages_list( array( 'fields' => '' ) );
            if ( is_array( $pll_langs ) ) {
                foreach ( $pll_langs as $lang ) {
                    $polylang_languages[ $lang->slug ] = array(
                        'english_name' => $lang->name,
                        'locale'       => $lang->locale,
                    );
                }
            }
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
            ],
            'polylang/polylang.php' => array(
                'type'             => 'class',
                'data'             => array(),
                'plugin'           => 'polylang',
                'active_languages' => $polylang_languages,
            ),
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
        if (!$title && $post) {
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

        // Player 3 (gTTS): truncate long filenames to avoid ENAMETOOLONG error on Linux (255 byte limit).
        // Keep first 100 chars + md5 hash for uniqueness.
        if (get_player_id() == 3 && strlen($title) > 200) {
            $hash = md5($title);
            $title = substr($title, 0, 100) . '_' . $hash;
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

                    // Merge field-by-field: only override if per-post value is non-empty.
                    // This allows users to override just one field while keeping global values for the rest.
                    $css_fields = array(
                        'tta__settings_css_selectors',
                        'tta__settings_exclude_content_by_css_selectors',
                        'tta__settings_exclude_texts',
                        'tta__settings_exclude_tags',
                    );

                    foreach ( $css_fields as $field ) {
                        if ( isset( $post_css_selectors[ $field ] ) && ! empty( $post_css_selectors[ $field ] ) ) {
                            $settings[ $field ] = $post_css_selectors[ $field ];
                        }
                    }

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

    /**
     * TTS-250: MP3 file URLs are a Pro-only feature — the free browser-
     * SpeechSynthesis player produces no audio file. The resolver (post-meta
     * read, GCS backup, signed-URL refresh) was removed from the free plugin and
     * now lives in AtlasVoice Pro, which registers the `tts_mp3_file_urls` filter.
     * With Pro absent there is no listener, so this returns an empty array — there
     * is no Pro/license check and no premium code in the free plugin.
     *
     * @param string      $file_url_key Language/voice file key.
     * @param int|WP_Post  $post         Post (defaults to global).
     * @param string      $date         Optional date.
     * @param string      $file_name    Optional file name.
     * @return array
     */
    public static function get_mp3_file_urls($file_url_key, $post = '', $date = '', $file_name = '')
    {
        if (!$post) {
            global $post;
        }
        return (array) apply_filters('tts_mp3_file_urls', array(), $post, $file_url_key, $date, $file_name);
    }

    /**
     * TTS-239: Append a `?v={filemtime}` cache-busting query to local MP3 URLs
     * so CDNs (e.g. Cloudflare) re-fetch when the plugin regenerates the file
     * at the same path. Without this, Cloudflare can serve a stale edge-cached
     * copy for up to a year (origin Cache-Control: max-age=31536000), producing
     * the symptom where the in-page player and the file-manager download differ.
     * Remote URLs (GCS signed URLs and anything outside wp-uploads) pass through
     * unchanged since they manage their own cache/expiry.
     *
     * @param mixed $urls
     *
     * @return mixed
     */
    public static function append_cache_buster_to_urls($urls)
    {
        if (!is_array($urls) || empty($urls)) {
            return $urls;
        }
        $upload  = wp_upload_dir();
        $baseurl = isset($upload['baseurl']) ? $upload['baseurl'] : '';
        $basedir = isset($upload['basedir']) ? $upload['basedir'] : '';
        if (!$baseurl || !$basedir) {
            return $urls;
        }
        foreach ($urls as $key => $url) {
            if (!is_string($url) || !$url) {
                continue;
            }
            if (strpos($url, 'storage.googleapis.com') !== false) {
                continue;
            }
            if (strpos($url, $baseurl) !== 0) {
                continue;
            }
            $clean_url = strtok($url, '?');
            $path      = str_replace($baseurl, $basedir, $clean_url);
            if (!file_exists($path)) {
                continue;
            }
            $mtime = @filemtime($path);
            if (!$mtime) {
                continue;
            }
            $sep        = (strpos($url, '?') !== false) ? '&' : '?';
            $urls[$key] = $url . $sep . 'v=' . $mtime;
        }
        return $urls;
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
     * TTS-250: Whether the AtlasVoice companion add-on plugin is active
     * (presence check, not a license gate). Renamed from is_pro_active().
     */
    public static function is_atlasvoice_addon_functional()
    {
        return is_atlasvoice_addon_functional();
    }

    /**
     * @deprecated TTS-250 Use is_atlasvoice_addon_functional(). Backward-compatible alias.
     */
    public static function is_pro_active()
    {
        return self::is_atlasvoice_addon_functional();
    }

    public static function is_audio_folder_writable()
    {
        $upload_dir = wp_upload_dir();
        $base_dir = $upload_dir['basedir'];

        if (wp_is_writable($base_dir)) {
            return true;
        }

        return false;
    }

    public static function get_player_id()
    {
        return get_player_id();
    }

    /**
     * TTS-249: registry of players the site can actually deliver.
     *
     * Free ships only player 1 (browser speechSynthesis). Pro registers ids 2-6
     * via the `tts_available_players` filter. This is a capability registry — NOT
     * a license gate — used to (a) populate the player selector and (b) let
     * get_player_id() fall back to 1 when a saved id has no implementation present
     * (e.g. Pro was deactivated). Keys are player ids.
     *
     * @return array<int,array>
     */
    public static function get_available_players()
    {
        $players = array(
            1 => array(
                'id'     => 1,
                'name'   => __( 'Default', 'text-to-audio' ),
                'object' => 'TextToSpeech',
                'pro'    => false,
            ),
        );

        return (array) apply_filters( 'tts_available_players', $players );
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

        // TTS-247: prefer wp_remote_head() over raw get_headers/curl (Plugin
        // Check guideline -- core HTTP API handles timeouts, SSL, redirects).
        $response = wp_remote_head( $url, array( 'timeout' => 5, 'redirection' => 3 ) );
        if ( is_wp_error( $response ) ) {
            return true; // treat as missing
        }
        $code = (int) wp_remote_retrieve_response_code( $response );
        return ( 404 === $code || $code === 0 );
    }

    /**
     * Function to check if a signed URL has expired.
     */
    public static function is_signed_url_expired($signedUrl)
    {
        // Parse the URL to get the query string
        $urlComponents = wp_parse_url($signedUrl);
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
    /**
     * TTS-235: Strip HTML elements matching the exclude CSS selectors setting.
     * Supports .class, #id, and tag.class selectors.
     * Uses balanced tag matching to correctly handle nested elements of the same tag type.
     * Works in the PHP path (DOM reading off) to match JS behavior (DOM reading on).
     *
     * @param string $html The HTML content to process.
     * @return string The HTML with matching elements removed.
     */
    public static function strip_elements_by_css_selectors($html)
    {
        $settings = self::tts_get_settings('settings');
        $selectors_raw = isset($settings['tta__settings_exclude_content_by_css_selectors'])
            ? $settings['tta__settings_exclude_content_by_css_selectors']
            : '';

        if (empty($selectors_raw)) {
            return $html;
        }

        // Split by newline — selectors are newline-separated in the setting.
        $selectors = preg_split('/[\r\n]+/', $selectors_raw);

        foreach ($selectors as $selector) {
            $selector = trim($selector);
            if (empty($selector)) {
                continue;
            }

            $attr_pattern = '';

            if (strpos($selector, '#') === 0) {
                // ID selector: #some-id
                $id = preg_quote(substr($selector, 1), '/');
                $attr_pattern = 'id=["\'][^"\']*' . $id . '[^"\']*["\']';
            } elseif (strpos($selector, '.') !== false) {
                // Class selector: .some-class or tag.some-class
                $parts = explode('.', $selector, 2);
                $class = preg_quote($parts[1], '/');
                $attr_pattern = 'class=["\'][^"\']*' . $class . '[^"\']*["\']';
            }

            if ($attr_pattern) {
                $html = self::remove_elements_by_attribute($html, $attr_pattern);
            }
        }

        return $html;
    }

    /**
     * TTS-235: Remove all HTML elements whose opening tag matches the given attribute pattern.
     * Handles nested tags by counting open/close pairs to find the correct closing tag.
     *
     * @param string $html            The HTML string.
     * @param string $attr_pattern    Regex pattern to match the attribute (e.g., class="...").
     * @return string The HTML with matched elements removed.
     */
    private static function remove_elements_by_attribute($html, $attr_pattern)
    {
        // Find all opening tags that match the attribute pattern.
        // We process from last to first so that removing content doesn't shift positions
        // of earlier matches.
        $open_pattern = '/<([a-z][a-z0-9]*)\b[^>]*' . $attr_pattern . '[^>]*>/is';
        $matches = [];
        preg_match_all($open_pattern, $html, $matches, PREG_OFFSET_CAPTURE | PREG_SET_ORDER);

        // Process in reverse order to maintain correct offsets.
        $matches = array_reverse($matches);

        foreach ($matches as $match) {
            $tag_name  = strtolower($match[1][0]); // The tag name (e.g., "div")
            $start_pos = $match[0][1];              // Position of the opening tag
            $open_tag  = $match[0][0];              // Full opening tag string

            // Self-closing tags — just remove the tag itself.
            if (preg_match('/\/\s*>$/', $open_tag)) {
                $html = substr_replace($html, '', $start_pos, strlen($open_tag));
                continue;
            }

            // Walk forward from after the opening tag, counting nested open/close of same tag.
            $search_start = $start_pos + strlen($open_tag);
            $depth = 1;
            $pos = $search_start;

            while ($depth > 0 && $pos < strlen($html)) {
                // Find next opening or closing tag of the same name.
                $next_open  = stripos($html, '<' . $tag_name, $pos);
                $next_close = stripos($html, '</' . $tag_name, $pos);

                if ($next_close === false) {
                    // No closing tag found — malformed HTML, stop.
                    break;
                }

                if ($next_open !== false && $next_open < $next_close) {
                    // Check it's actually an opening tag (not a different tag starting with same letters)
                    $char_after = isset($html[$next_open + strlen($tag_name) + 1]) ? $html[$next_open + strlen($tag_name) + 1] : '';
                    if ($char_after === ' ' || $char_after === '>' || $char_after === '/' || $char_after === "\n" || $char_after === "\r" || $char_after === "\t") {
                        $depth++;
                    }
                    $pos = $next_open + 1;
                } else {
                    $depth--;
                    if ($depth === 0) {
                        // Found the matching closing tag. Find its end (after ">").
                        $close_end = strpos($html, '>', $next_close);
                        if ($close_end !== false) {
                            $close_end++; // Include the ">"
                            $html = substr_replace($html, '', $start_pos, $close_end - $start_pos);
                        }
                        break;
                    }
                    $pos = $next_close + 1;
                }
            }
        }

        return $html;
    }

    public static function clean_string($inputString)
    {
        $delimiter = \apply_filters('tts_sentence_delimiter', '.');

        // TTS-235: Ensure valid UTF-8 before applying Unicode-aware regex.
        // Invalid byte sequences cause preg_replace with /u flag to return null.
        if (!$inputString) {
            return '';
        }
        $cleanedString = mb_convert_encoding($inputString, 'UTF-8', 'UTF-8');

        // TTS-235: Remove non-speech special characters that TTS engines cannot pronounce.
        // These are visual formatting symbols (e.g., "§ Footnotes §") that produce
        // gibberish or errors in audio output. The /u flag ensures multibyte chars
        // (Hebrew, Arabic, etc.) are treated as whole characters, not individual bytes.
        $cleanedString = preg_replace('/[§†‡※♦♣♠♥◆●■▲►☆★]+/u', '', $cleanedString);

        // TTS-235: Remove multiple consecutive delimiters with optional spaces between them.
        // Handles patterns like "..", ".?" etc. Uses /u flag for multibyte delimiter chars.
        $delimiterChars = preg_quote('.', '/') . preg_quote(',', '/') . preg_quote('?', '/') . '!'
            . preg_quote('|', '/') . ';:' . preg_quote('¿', '/') . preg_quote('¡', '/')
            . preg_quote('،', '/') . preg_quote('؟', '/');
        $cleanedString = preg_replace(
            '/([' . $delimiterChars . '])\s*[' . $delimiterChars . ']+\s*/u',
            '$1 ',
            $cleanedString
        );

        // TTS-235: Remove visual spacer dots — standalone dots separated by spaces that
        // authors use as section dividers (e.g., '. . . Matthew 8:17. . .').
        // These cause TTS to say "dot dot" or produce awkward pauses.
        // Process from longest pattern to shortest to avoid partial matches.
        $cleanedString = preg_replace('/\s+\.\s+\.\s+\.\s+/', ' ', $cleanedString);  // ". . . "
        $cleanedString = preg_replace('/\s+\.\s+\.\s+/', ' ', $cleanedString);        // ". . "
        $cleanedString = preg_replace('/\s+\.\s+(?=[A-Z])/', ' ', $cleanedString);    // ". " before capital

        // TTS-235: Remove dot after closing quote+dot: ."." or ." . → ."
        $cleanedString = preg_replace('/([.!?])(["\'""])\s*\.\s*/', '$1$2 ', $cleanedString);

        // TTS-235: Remove standalone dot before a letter (visual separator, not sentence ender):
        // " .American" → " American"
        $cleanedString = preg_replace('/\s+\.(?=[A-Za-z])/', ' ', $cleanedString);

        // TTS-235: Remove space before punctuation caused by tag stripping.
        // "diseases ." → "diseases.", "suffering ," → "suffering,"
        $cleanedString = preg_replace('/\s+([.,!?;:])/', '$1', $cleanedString);

        // Remove extra spaces (more than one space)
        $cleanedString = preg_replace('/\s{2,}/', ' ', $cleanedString);

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
     * TTS-247: dropped the `$text_domain` parameter and the internal `__($default,
     * $text_domain)` call. The WP.org review (HelpScout #293) flagged that call
     * because both arguments were variables, which prevents gettext-extraction
     * tools (makepot, wp-cli) from discovering the translatable strings. Callers
     * now pass an already-translated literal default (e.g. `__('Listen',
     * 'text-to-audio')`) so the extractor sees the string and domain literally
     * at the call site. This helper just decides which of (attr override / saved
     * setting / default) to return — no translation here.
     *
     * @param array  $atts        The attributes array.
     * @param array  $saved_texts The saved texts array.
     * @param string $key         The key to look for in both arrays.
     * @param string $default     The default (already-translated) text if neither
     *                            $atts nor $saved_texts has the value.
     *
     * @return string The final text value.
     */
    public static function get_text_value($atts, $saved_texts, $key, $default)
    {
        if (isset($atts[$key]) && strlen($atts[$key])) {
            return esc_html(sanitize_text_field($atts[$key]));
        } elseif (isset($saved_texts[$key])) {
            return esc_html(sanitize_text_field($saved_texts[$key]));
        }
        return $default;
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
                    // Skip fields with empty name
                    if ( empty( $field['name'] ) ) {
                        continue;
                    }
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
        $date = gmdate('Y/m/d', strtotime($post_date));

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

        // TTS-247: guard missing keys — after a data reset the customize option
        // is gone, so buttonSettings may be unset (caused an "undefined array key" warning).
        $previous_data['buttonSettings'] = isset( $previous_data['buttonSettings'] ) ? (array) $previous_data['buttonSettings'] : array();
        $current_data['buttonSettings']  = isset( $current_data['buttonSettings'] ) ? (array) $current_data['buttonSettings'] : array();

        $previous_player_id = isset($previous_data['buttonSettings']['id']) ? $previous_data['buttonSettings']['id'] : 1;
        $current_player_id = isset($current_data['buttonSettings']['id']) ? $current_data['buttonSettings']['id'] : 1;

        return  $previous_player_id == $current_player_id ? false : true;
    }

    public static function delete_post_meta($meta_key = 'tts_is_mp3_file_url_exists')
    {
        global $wpdb;

        $table = $wpdb->postmeta;

        // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM $table WHERE meta_key = %s",
                $meta_key
            )
        );
        // phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching


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
        $user_agent = isset( $_SERVER['HTTP_USER_AGENT'] )
            ? strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) )
            : '';

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
                $ip = sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) );

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
     * TTS-240: Is a CDN/optimizer likely active on this site?
     *
     * Used to gate the front-end CORS detector — no point running it on
     * sites that don't have a CDN rewriting asset URLs. Filterable for
     * hosts/plugins we don't detect natively.
     *
     * @since 2.1.16
     * @return bool
     */
    public static function is_cdn_likely_active() {
        if ( ! function_exists( 'is_plugin_active' ) ) {
            include_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $triggers = array(
            defined( 'WP_ROCKET_VERSION' ),
            defined( 'LSCWP_V' ),
            defined( 'W3TC' ),
            defined( 'AUTOPTIMIZE_PLUGIN_VERSION' ),
            \is_plugin_active( 'wp-rocket/wp-rocket.php' ),
            \is_plugin_active( 'cloudflare/cloudflare.php' ),
            \is_plugin_active( 'bunnycdn/bunnycdn.php' ),
            \is_plugin_active( 'cdn-enabler/cdn-enabler.php' ),
            \is_plugin_active( 'sg-cachepress/sg-cachepress.php' ),
            \is_plugin_active( 'litespeed-cache/litespeed-cache.php' ),
            \is_plugin_active( 'w3-total-cache/w3-total-cache.php' ),
            \is_plugin_active( 'wp-optimize/wp-optimize.php' ),
        );

        $active = in_array( true, $triggers, true );

        return (bool) apply_filters( 'tts_is_cdn_active', $active );
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
