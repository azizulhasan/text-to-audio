<?php

namespace TTA_Admin;

// TTS-247: prevent direct file access (wp.org Plugin Check requirement).
defined( 'ABSPATH' ) || exit;

use TTA\TTA_Helper;

/**
 * Posts List Customization for Text-to-Audio Plugin
 *
 * Adds custom column and filters to WordPress posts list page
 * to show audio generation status.
 *
 * @link       http://azizulhasan.com
 * @since      2.2.0
 *
 * @package    TTA
 * @subpackage TTA/admin
 */

/**
 * Posts List Customization Class
 *
 * This class handles:
 * - Adding "AtlasVoice" column to posts list
 * - Adding filter dropdown for audio generation status
 * - Filtering posts based on audio availability
 *
 * @since      2.2.0
 * @package    TTA
 * @subpackage TTA/admin
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class TTA_Posts_List
{

    /**
     * Initialize the class and set up hooks
     *
     * @since 2.2.0
     */
    public function __construct()
    {
        // Add hooks for all post types
        add_action('init', array($this, 'setup_hooks'));
    }

    /**
     * Setup hooks for all enabled post types
     *
     * @since 2.2.0
     */
    public function setup_hooks()
    {
        $settings = TTA_Helper::tts_get_settings('settings');
        $tts_status = isset($settings['tta__settings_enable_tts_status'])
            ? $settings['tta__settings_enable_tts_status']
            : false;
        if (!$tts_status) {
            return false;
        }
        $post_types = isset($settings['tta__settings_allow_listening_for_post_types'])
            ? $settings['tta__settings_allow_listening_for_post_types']
            : array('post');

        if (!is_array($post_types) || empty($post_types)) {
            $post_types = array('post');
        }

        foreach ($post_types as $post_type) {
            // Add custom column
            add_filter("manage_{$post_type}_posts_columns", array($this, 'add_atlasvoice_column'));
            add_action("manage_{$post_type}_posts_custom_column", array($this, 'render_atlasvoice_column'), 10, 2);

            // Make column sortable (optional)
            add_filter("manage_edit-{$post_type}_sortable_columns", array($this, 'make_atlasvoice_column_sortable'));

            // Add filter dropdown
            add_action('restrict_manage_posts', array($this, 'add_audio_filter_dropdown'));

            // Handle filter query
            add_filter('parse_query', array($this, 'filter_posts_by_audio_status'));
        }

        // TTS-249 (I3): enqueue the column styles as a proper stylesheet
        // (was an inline <style> on admin_head).
        add_action('admin_enqueue_scripts', array($this, 'add_admin_styles'));
    }

    /**
     * Add AtlasVoice column before Date column
     *
     * @param array $columns Existing columns
     * @return array Modified columns
     * @since 2.2.0
     */
    public function add_atlasvoice_column($columns)
    {
        $new_columns = array();

        foreach ($columns as $key => $value) {
            if ($key === 'date') {
                // Add AtlasVoice column before date
                $new_columns['atlasvoice'] = 'AtlasVoice';
            }
            $new_columns[$key] = $value;
        }

        return $new_columns;
    }

    /**
     * Render AtlasVoice column content
     *
     * @param string $column_name Column name
     * @param int $post_id Post ID
     * @since 2.2.0
     */
    public function render_atlasvoice_column($column_name, $post_id)
    {
        if ($column_name !== 'atlasvoice') {
            return;
        }

        $post = get_post($post_id);
        $player_id = get_player_id();
        $has_audio = false;
        $tooltip = '';

        if ($player_id > 2) {
            // Pro version with MP3 generation
            $has_audio = $this->has_mp3_file($post);
            $tooltip = $has_audio ? 'MP3 file generated' : 'MP3 file not generated';
        } else {
            // Free version or player ID ≤ 2 (browser TTS)
            $has_audio = $this->has_tts_enabled($post);
            $tooltip = $has_audio ? 'TTS enabled for this post' : 'TTS not enabled for this post';
        }

        $icon_class = $has_audio ? 'dashicons-yes-alt' : 'dashicons-dismiss';
        $icon_color = $has_audio ? '#46b450' : '#dc3232';

        echo sprintf(
            '<span class="dashicons %s" style="color: %s; font-size: 20px;" title="%s"></span>',
            esc_attr($icon_class),
            esc_attr($icon_color),
            esc_attr($tooltip)
        );
    }

    /**
     * Make AtlasVoice column sortable
     *
     * @param array $columns Sortable columns
     * @return array Modified sortable columns
     * @since 2.2.0
     */
    public function make_atlasvoice_column_sortable($columns)
    {
        $columns['atlasvoice'] = 'atlasvoice';
        return $columns;
    }

    /**
     * Add filter dropdown to posts list page
     *
     * @param string $post_type Current post type
     * @since 2.2.0
     */
    public function add_audio_filter_dropdown($post_type)
    {
        // Check if this post type is enabled for TTS
        $settings = TTA_Helper::tts_get_settings('settings');
        $enabled_post_types = isset($settings['tta__settings_allow_listening_for_post_types'])
            ? $settings['tta__settings_allow_listening_for_post_types']
            : array('post');

        if (!in_array($post_type, $enabled_post_types)) {
            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only GET filter on posts list, no state mutation
        $current_filter = isset($_GET['atlasvoice_filter']) ? sanitize_text_field( wp_unslash( $_GET['atlasvoice_filter'] ) ) : '';
        $player_id = get_player_id();

        // Determine filter label based on player ID
        $filter_label = $player_id > 2 ? __('Audio Status', 'text-to-audio') : __('TTS Status', 'text-to-audio');
        $option_all = __('All Posts', 'text-to-audio');
        $option_with = $player_id > 2 ? __('Audio Generated', 'text-to-audio') : __('TTS Enabled', 'text-to-audio');
        $option_without = $player_id > 2 ? __('Audio Not Generated', 'text-to-audio') : __('TTS Not Enabled', 'text-to-audio');

        ?>
        <select name="atlasvoice_filter" id="atlasvoice_filter">
            <option value=""><?php echo esc_html($filter_label); ?></option>
            <option value="with_audio" <?php selected($current_filter, 'with_audio'); ?>>
                <?php echo esc_html($option_with); ?>
            </option>
            <option value="without_audio" <?php selected($current_filter, 'without_audio'); ?>>
                <?php echo esc_html($option_without); ?>
            </option>
        </select>
        <?php
    }

    /**
     * Filter posts based on audio generation status
     *
     * @param WP_Query $query The WordPress query object
     * @since 2.2.0
     */
    public function filter_posts_by_audio_status($query)
    {
        global $pagenow;

        // Only apply on admin posts list page and main query
        if (!is_admin() || $pagenow !== 'edit.php' || !$query->is_main_query()) {
            return;
        }

        // Check if filter is applied
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only GET filter on posts list
        if (!isset($_GET['atlasvoice_filter']) || empty($_GET['atlasvoice_filter'])) {
            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only GET filter on posts list
        $filter = sanitize_text_field( wp_unslash( $_GET['atlasvoice_filter'] ) );

        if (!in_array($filter, array('with_audio', 'without_audio'))) {
            return;
        }

        $player_id = get_player_id();

        if ($player_id > 2) {
            // For MP3 files, use meta query (much more efficient)
            $this->filter_by_mp3_status($query, $filter);
        } else {
            // For TTS enabled, we need to check post by post (but paginated)
            // We'll handle this differently - don't filter at query level
            // Instead, we'll use a custom approach
            add_filter('posts_clauses', array($this, 'modify_posts_clauses_for_tts'), 10, 2);
        }
    }

    /**
     * Filter by MP3 status using meta query (efficient)
     *
     * @param WP_Query $query WordPress query object
     * @param string $filter Filter type
     * @since 2.2.0
     */
    private function filter_by_mp3_status($query, $filter)
    {
        // Get the plugin settings
        $plugin_all_settings = TTA_Helper::tts_get_settings();
        $language = TTA_Helper::tts_site_language($plugin_all_settings);
        $voice = TTA_Helper::tts_get_voice($plugin_all_settings);

        // Get the file URL key for current language/voice
        $file_url_key = TTA_Helper::tts_get_file_url_key($language, $voice);

        $meta_query = $query->get('meta_query') ?: array();

        if ($filter === 'with_audio') {
            // Posts WITH MP3 files for the specific file_url_key
            // We need to search within the serialized array for the key
            $meta_query[] = array(
                'key' => 'tts_mp3_file_urls',
                'value' => sprintf('s:%d:"%s";', strlen($file_url_key), $file_url_key),
                'compare' => 'LIKE'
            );
        } else {
            // Posts WITHOUT MP3 files for the specific file_url_key
            $meta_query[] = array(
                'relation' => 'OR',
                array(
                    'key' => 'tts_mp3_file_urls',
                    'compare' => 'NOT EXISTS'
                ),
                array(
                    'key' => 'tts_mp3_file_urls',
                    'value' => sprintf('s:%d:"%s";', strlen($file_url_key), $file_url_key),
                    'compare' => 'NOT LIKE'
                )
            );
        }

        $query->set('meta_query', $meta_query);
    }

    /**
     * Modify posts clauses for TTS filtering (for player <= 2)
     *
     * @param array $clauses SQL clauses
     * @param WP_Query $query WordPress query object
     * @return array Modified clauses
     * @since 2.2.0
     */
    public function modify_posts_clauses_for_tts($clauses, $query)
    {
        global $wpdb;

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only GET filter on posts list
        if (!isset($_GET['atlasvoice_filter']) || empty($_GET['atlasvoice_filter'])) {
            return $clauses;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only GET filter on posts list
        $filter = sanitize_text_field( wp_unslash( $_GET['atlasvoice_filter'] ) );
        $settings = TTA_Helper::tts_get_settings('settings');

        // Check if automatic player is enabled
        $auto_player_enabled = isset($settings['tta__settings_enable_button_add'])
            && $settings['tta__settings_enable_button_add'] == true;

        if ($auto_player_enabled) {
            // If auto player is enabled, all posts of enabled post types have TTS
            // The filter is already working based on post type, no need to modify clauses
            // Just use should_load_button logic which checks exclusions
            return $clauses;
        } else {
            // If auto player is disabled, check for shortcode in post content
            if ($filter === 'with_audio') {
                // Posts WITH shortcode
                $clauses['where'] .= $wpdb->prepare(
                    " AND {$wpdb->posts}.post_content LIKE %s",
                    '%[atlasvoice%'
                );
            } else {
                // Posts WITHOUT shortcode
                $clauses['where'] .= $wpdb->prepare(
                    " AND {$wpdb->posts}.post_content NOT LIKE %s",
                    '%[atlasvoice%'
                );
            }
        }

        return $clauses;
    }

    /**
     * Check if post has MP3 file generated
     *
     * @param WP_Post $post Post object
     * @return bool True if MP3 exists, false otherwise
     * @since 2.2.0
     */
    private function has_mp3_file($post)
    {
        if (!$post) {
            return false;
        }

        // TTS-250: MP3 generation is a Pro-only feature (only players 3-6 produce
        // an audio file). The detection logic was removed from the free plugin and
        // now lives in AtlasVoice Pro, which registers the `tts_post_has_mp3`
        // filter. With Pro absent there is no listener, so this is always false —
        // no Pro/license check and no premium code in the free plugin.
        return (bool) apply_filters('tts_post_has_mp3', false, $post);
    }

    /**
     * Check if post has TTS enabled
     *
     * @param WP_Post $post Post object
     * @return bool True if TTS is enabled, false otherwise
     * @since 2.2.0
     */
    private function has_tts_enabled($post)
    {
        if (!$post) {
            return false;
        }

        $settings = TTA_Helper::tts_get_settings('settings');

        // Check if post type is enabled for TTS
        $enabled_post_types = isset($settings['tta__settings_allow_listening_for_post_types'])
            ? $settings['tta__settings_allow_listening_for_post_types']
            : array();

        if (!in_array($post->post_type, $enabled_post_types)) {
            return false;
        }

        // Check if automatic player is enabled
        $auto_player_enabled = isset($settings['tta__settings_enable_button_add'])
            && $settings['tta__settings_enable_button_add'] == true;

        if ($auto_player_enabled) {
            // If auto player is enabled, check using should_load_button
            // which considers exclusions (IDs, tags, categories, etc.)
            return true;
        } else {
            // If auto player is disabled, check for shortcode in content
            if (has_shortcode($post->post_content, 'atlasvoice') || has_shortcode($post->post_content, 'tta_listen_btn')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Add admin styles for the column
     *
     * @since 2.2.0
     */
    public function add_admin_styles()
    {
        global $pagenow;

        if ($pagenow !== 'edit.php') {
            return;
        }

        // TTS-249 (I3): enqueued stylesheet instead of an inline <style> tag.
        wp_enqueue_style(
            'tta-posts-list',
            plugin_dir_url(dirname(__FILE__)) . 'admin/css/minify/tta-posts-list.min.css',
            array(),
            defined('TEXT_TO_AUDIO_VERSION') ? TEXT_TO_AUDIO_VERSION : false,
            'all'
        );
    }
}
