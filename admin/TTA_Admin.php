<?php

namespace TTA_Admin;

// TTS-247: prevent direct file access (wp.org Plugin Check requirement).
defined( 'ABSPATH' ) || exit;

use TTA\TTA_Helper;
use TTA\TTA_Cache;
use TTA\TTA_i18n;

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    TTA
 * @subpackage TTA/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    TTA
 * @subpackage TTA/admin
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class TTA_Admin
{

    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string $plugin_name The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string $version The current version of this plugin.
     */
    private $version;

    /**
     * Plugin's localize data.
     *
     * @since    1.3.14
     * @access   private
     * @var      string $localize_data Plugin's localize data.
     */
    public $localize_data;

    /**
     * Initialize the class and set its properties.
     *
     * @param string $plugin_name The name of this plugin.
     * @param string $version The version of this plugin.
     *
     * @since    1.0.0
     */
    public function __construct($plugin_name, $version)
    {

        $this->plugin_name = $plugin_name;
        $this->version = $version;
        add_filter('script_loader_tag', [$this, 'load_script_as_tag'], 10, 3);
        add_action('wp_ajax_atlas_plugins_refresh', array($this, 'ajax_refresh_plugins'));

        // TTS-249 (A1): one-time Custom CSS → Additional CSS migration. Runs on
        // admin_init as a fallback for already-installed sites whose update path
        // doesn't fire the activation/upgrader hook (e.g. wp.org auto-update).
        // Self-guards via the tta_custom_css_migrated option, so it's a single
        // option read after the first run.
        add_action('admin_init', array('\\TTA\\TTA_Activator', 'migrate_custom_css_to_additional_css'));

        // TTS-247: switched plain include to require_once per wp.org guideline.
        if (!function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        if (!function_exists('wp_is_mobile')) {
            include_once ABSPATH . 'wp-includes/vars.php';
        }

        if (!function_exists('wp_create_nonce')) {
            include_once ABSPATH . 'wp-includes/pluggable.php';
        }
        global $post;
        $post_id = ($post && isset($post->ID)) ? $post->ID : 0;
        $settings = TTA_Helper::tts_get_settings('', $post_id);


        $color = '#ffffff';
        if (isset($settings['customize']['color'])) {
            $color = $settings['customize']['color'];
        }

        $rest_api_url = esc_url_raw(home_url() . '/wp-json/');
        if (TTA_Cache::get('tts_rest_api_url')) {
            $rest_api_url = TTA_Cache::get('tts_rest_api_url');
        }

        $this->localize_data = [
            'json_url' => $rest_api_url,
            'admin_url' => admin_url('/'),
            'buttonTextArr' => get_option('tta__button_text_arr'),
            'ajax_url' => admin_url('admin-ajax.php'),
            'api_url' => $rest_api_url,
            'api_namespace' => 'tta',
            'api_version' => 'v1',
            // TTS-247: resolve plugin URL via plugin_dir_url/__FILE__ instead of
            // hardcoding the slug -- breaks when the folder is renamed/symlinked.
            'image_url' => plugins_url( 'admin/images', TEXT_TO_AUDIO_ROOT_FILE ),
            'plugin_url' => untrailingslashit( plugin_dir_url( TEXT_TO_AUDIO_ROOT_FILE ) ),
            'nonce' => wp_create_nonce(TEXT_TO_AUDIO_NONCE),
            'plugin_name' => TEXT_TO_AUDIO_PLUGIN_NAME,
            'rest_nonce' => wp_create_nonce('wp_rest'),
            'VERSION' => is_atlasvoice_addon_functional() ? get_option('TTA_PRO_VERSION') : TEXT_TO_AUDIO_VERSION,
            'is_logged_in' => is_user_logged_in(),
            'user_id' => get_current_user_id(),
            'is_dashboard' => is_admin(),
            // TTS-250: new key; 'is_pro_active' kept as a backward-compatible alias.
            'is_atlasvoice_addon_functional' => is_atlasvoice_addon_functional(),
            'is_pro_active' => is_atlasvoice_addon_functional(),
            // TTS-247: data-driven capability map. Free ships an empty array;
            // companion plugins (Pro) declare which premium features are
            // available by hooking `tts_capabilities`. The React dashboard shows
            // a premium control only when its capability key is present here —
            // it never branches on is_atlasvoice_addon_functional() for feature gating.
            // Default empty; resolved lazily in enqueue_scripts() after Pro's
            // `tts_capabilities` filter is registered (see note there).
            'capabilities' => array(),
            'is_admin_page' => is_admin(),
            "player_id" => get_player_id(),
            // TTS-249: the players this site can actually deliver. Free = player 1
            // only; Pro adds 2-6 via the `tts_available_players` filter. The React
            // customize UI renders the selector from this list (no locked options).
            'availablePlayers' => array_values( TTA_Helper::get_available_players() ),
            "is_folder_writable" => TTA_Helper::is_audio_folder_writable(),
            'compatible' => TTA_Helper::get_compatible_plugins_data(),
            'gctts_is_authenticated' => get_player_id() == '4',
            'settings' => $settings,
            'player_customizations' => apply_filters('tts_player_customizations', $this->build_player_customizations()),
            'is_mobile' => wp_is_mobile(),
            'current_plugin_slug' => 'text-to-audio',
            'detected_caching_plugins' => TTA_Helper::get_detected_caching_plugins(),
            'latest_post_preview_url'  => '', // populated lazily in enqueue to avoid early get_permalink() call

        ];
    }

    /**
     * Build the per-player icon map (TTS-241).
     *
     * Reads from the saved option `tta__button_text_arr.players[id].<state>.icon`,
     * resolves preset/custom descriptors to actual SVG markup, and falls back
     * to factory defaults when nothing is saved. Only ids 1 and 2 (the
     * speechSynthesis players) are populated in phase 1.
     *
     * @return array<string,array<string,string>>
     */
    public function build_player_customizations()
    {
        $saved   = get_option('tta__button_text_arr');
        $players = is_array($saved) && isset($saved['players']) && is_array($saved['players'])
            ? $saved['players']
            : \TTA\TTA_Player_Icons::default_players();

        $defaults = \TTA\TTA_Player_Icons::default_players();
        $out      = [];
        // TTS-249 (T2): Free emits icon maps for player 1 only. Player 2
        // (Default Pro) is premium — Pro appends its id-2 map via the
        // tts_player_customizations filter, so no player-2 data ships in free.
        foreach ([1] as $pid) {
            $states = $players[$pid] ?? $defaults[$pid];
            $out[(string) $pid] = [
                'play'   => \TTA\TTA_Player_Icons::resolve($states['listen']['icon'] ?? 'preset:play'),
                'pause'  => \TTA\TTA_Player_Icons::resolve($states['pause']['icon']  ?? 'preset:pause'),
                'resume' => \TTA\TTA_Player_Icons::resolve($states['resume']['icon'] ?? 'preset:play'),
                'replay' => \TTA\TTA_Player_Icons::resolve($states['replay']['icon'] ?? 'preset:replay'),
            ];
        }
        return $out;
    }

    public function load_script_as_tag($tag, $handle, $src)
    {
        if (!in_array($handle, ['text-to-audio-button', 'TextToSpeech', 'AtlasVoiceAnalytics'])) {
            return $tag;
        }

        // Intentionally NOT emitting `type="module"`.
        //
        // Module scripts are always fetched in CORS mode per the HTML spec, so
        // the CDN response must carry `Access-Control-Allow-Origin`. When users
        // serve these bundles through a CDN (WP Rocket CDN, BunnyCDN, KeyCDN,
        // etc.) that doesn't add that header, module loading fails silently —
        // the player breaks with only a console CORS message.
        //
        // Our source uses `import`/`export`, but Laravel Mix (webpack) bundles
        // everything into a single self-contained IIFE at build time, so there
        // is no runtime module graph for the browser to resolve. Classic
        // script semantics work identically without the CORS requirement.
        //
        // Only re-enable if the bundle starts relying on top-level await,
        // `import.meta`, or native cross-file ES module resolution.
        // $tag = '<script  type="module" src="' . esc_url($src) . '"  ></script>';

        return $tag;

    }

    /**
     * Register the stylesheets for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_styles()
    {
        if (TTA_Helper::is_text_to_audio_page()) {
            wp_enqueue_style('text-to-audio-dashboard', plugin_dir_url(__FILE__) . 'css/text-to-audio-dashboard.css', [], $this->version, 'all');
        }
    }

    /**
     * Register the JavaScript for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts()
    {

        /**
         * Looad wp-speeh script
         */

        // TTS-247: switched plain include to require_once per wp.org guideline.
        if (!function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Populate latest_post_preview_url lazily here (not in constructor)
        // because get_permalink() needs $wp_rewrite which isn't available during plugins_loaded.
        if ( empty( $this->localize_data['latest_post_preview_url'] ) ) {
            $this->localize_data['latest_post_preview_url'] = TTA_Helper::get_latest_post_preview_url();
        }

        // TTS-249: recompute the player registry + current id lazily. The
        // constructor runs on plugins_loaded — BEFORE Pro registers its
        // `tts_available_players` filter on `init` — so the constructor-time value
        // only ever contains player 1. Recomputing here (admin_enqueue_scripts)
        // picks up Pro's players when Pro is active.
        $this->localize_data['availablePlayers'] = array_values( TTA_Helper::get_available_players() );
        $this->localize_data['player_id']         = get_player_id();

        // TTS-247: same lazy-recompute reason as availablePlayers above — the
        // constructor builds localize_data on plugins_loaded, before Pro
        // registers `tts_capabilities` on `init`, so a constructor-time value is
        // always empty. Resolve it here (admin_enqueue_scripts) so the React
        // dashboard's data-driven gates see Pro's capabilities when Pro is active.
        $this->localize_data['capabilities'] = (array) apply_filters( 'tts_capabilities', array() );

        do_action('tta_enqueue_pro_dashboard_scripts');

        // Welcome wizard (separate bundle, only on first activation).
        // Read-only routing check on admin page; no state mutation, no nonce required.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $is_wizard_page = is_admin()
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            && isset( $_REQUEST['page'] ) && 'text-to-audio' === $_REQUEST['page']
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            && isset( $_REQUEST['welcome'] ) && '1' === $_REQUEST['welcome']
            && ( ! get_option( 'tta_onboarding_completed' ) || ( TTA_Helper::is_atlasvoice_addon_functional() && ! get_option( 'tta_pro_onboarding_completed' ) ) );
        if ( $is_wizard_page ) {
            $post_types      = get_post_types( array( 'public' => true ), 'objects' );
            $post_types_data = array();
            foreach ( $post_types as $pt ) {
                if ( 'attachment' === $pt->name ) {
                    continue;
                }
                $counts            = wp_count_posts( $pt->name );
                $post_types_data[] = array(
                    'slug'  => $pt->name,
                    'label' => $pt->label,
                    'count' => isset( $counts->publish ) ? (int) $counts->publish : 0,
                );
            }

            $current_settings = get_option( 'tta_settings_data', array() );
            // Settings may be stored as stdClass (from json_decode), cast to array.
            if ( is_object( $current_settings ) ) {
                $current_settings = (array) $current_settings;
            }
            // Fetch recent posts for ALL public post types (keyed by slug).
            // StepAnalytics filters client-side by the post type selected in Step 1.
            $recent_posts_by_type = array();
            $first_post_url       = home_url();
            foreach ( $post_types_data as $pt_data ) {
                $pt_slug  = $pt_data['slug'];
                $pt_posts = get_posts( array(
                    'numberposts' => 20,
                    'post_status' => 'publish',
                    'post_type'   => $pt_slug,
                    'orderby'     => 'date',
                    'order'       => 'DESC',
                ) );
                $recent_posts_by_type[ $pt_slug ] = array();
                foreach ( $pt_posts as $rp ) {
                    $recent_posts_by_type[ $pt_slug ][] = array(
                        'id'    => $rp->ID,
                        'title' => $rp->post_title,
                    );
                }
            }
            // Get latest post URL from the currently selected (or default) post type.
            $default_type    = isset( $current_settings['tta__settings_allow_listening_for_post_types'][0] )
                ? $current_settings['tta__settings_allow_listening_for_post_types'][0]
                : 'post';
            $latest_post_url = home_url();
            if ( ! empty( $recent_posts_by_type[ $default_type ] ) ) {
                $latest_post_url = get_permalink( $recent_posts_by_type[ $default_type ][0]['id'] );
            }

            wp_register_script(
                'tts-welcome-wizard',
                plugin_dir_url( __FILE__ ) . 'js/build/tts-welcome-wizard.min.js',
                array( 'wp-element', 'wp-i18n' ),
                $this->version,
                true
            );

            wp_localize_script( 'tts-welcome-wizard', 'ttsWizardData', array(
                'post_types'        => $post_types_data,
                'recent_posts_by_type' => $recent_posts_by_type,
                'current_settings'  => $current_settings,
                'current_customize' => get_option( 'tta_customize_settings', array() ),
                'current_listening' => get_option( 'tta_listening_settings', array() ),
                'latest_post_url'   => $latest_post_url,
                // TTS-250: new key; 'is_pro_active' kept as a backward-compatible alias.
                'is_atlasvoice_addon_functional' => TTA_Helper::is_atlasvoice_addon_functional(),
                'is_pro_active'     => TTA_Helper::is_atlasvoice_addon_functional(),
                'is_pro_wizard'     => TTA_Helper::is_atlasvoice_addon_functional() && ! get_option( 'tta_pro_onboarding_completed' ),
                'nonce'             => wp_create_nonce( 'wp_rest' ),
                'api_url'           => esc_url_raw( rest_url( 'tta/v1/' ) ),
                'pro_url'           => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
                'dashboard_url'     => admin_url( 'admin.php?page=text-to-audio' ),
                'site_locale'       => get_locale(),
                // TTS-247: use plugin_dir_url so renamed/symlinked installs work.
                'plugin_url'        => untrailingslashit( plugin_dir_url( TEXT_TO_AUDIO_ROOT_FILE ) ),
            ) );

            wp_enqueue_script( 'tts-welcome-wizard' );
            wp_set_script_translations(
                'tts-welcome-wizard',
                'text-to-audio',
                plugin_dir_path( dirname( __FILE__ ) ) . 'languages'
            );
            return; // Don't load dashboard scripts when wizard is active.
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- admin page-name read for asset enqueue, no state mutation
        if (is_admin() && isset($_REQUEST['page']) && ('text-to-audio' == $_REQUEST['page'])) {
            /* Load react js */
            wp_enqueue_style('tts-bootstrap', plugin_dir_url(__FILE__) . 'css/bootstrap.css', [], $this->version, 'all');
            wp_enqueue_script('TextToSpeech', plugin_dir_url(__FILE__) . 'js/build/TextToSpeech.min.js', array('wp-hooks',), $this->version, true);
            wp_localize_script('TextToSpeech', 'ttsObj', $this->localize_data);
            // TTS-250: the shared React dashboard reads the `ttsObjPro` global for
            // pro-context checks (the is_pro_active gate that loads the Listening
            // language list, multilingual `compatible` detection, customize preview).
            // Provide a reliable base on the free dashboard so this UI works whether
            // or not a Pro script localizes ttsObjPro on this page; Pro overrides it
            // with its own data when its scripts load. This was previously supplied
            // by the Pro player demo bundle, which was removed in TTS-249.
            wp_localize_script('TextToSpeech', 'ttsObjPro', $this->localize_data);
            // Register dashboard UI script (following i18n best practices)
            wp_register_script(
                'text-to-audio-dashboard-ui',
                plugin_dir_url(__FILE__) . 'js/build/text-to-audio-dashboard-ui.min.js',
                array('TextToSpeech', 'wp-element', 'wp-i18n'),
                $this->version,
                true
            );

            wp_localize_script('text-to-audio-dashboard-ui', 'tta_obj', $this->localize_data);
            wp_enqueue_script('text-to-audio-dashboard-ui');
            wp_set_script_translations(
                'text-to-audio-dashboard-ui',
                'text-to-audio',
                plugin_dir_path(dirname(__FILE__)) . 'languages'
            );
            wp_enqueue_style('dashicons');

        }


        // TTS-250: the per-post insights script calls the `/insights` REST route,
        // so only load it on a post-edit screen where TTS is actually enabled for
        // this post (should_load_button() == true). Previously it loaded on every
        // post.php / post-new.php screen — for any post type, including ones where
        // the player is never shown — firing a needless /insights request. The
        // dashboard analytics page (page=text-to-audio) still loads it.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- admin page-name read for asset enqueue, no state mutation
        if ((TTA_Helper::is_edit_page() && TTA_Helper::should_load_button()) || (isset($_REQUEST['page']) && ('text-to-audio' == $_REQUEST['page']))) {
            // TTS-247: ship Chart.js locally instead of jsDelivr CDN (wp.org Guideline 8 — no remote assets).
            wp_enqueue_script('AtlasVoice_chart', plugin_dir_url(__FILE__) . 'js/vendor/chart.umd.min.js', [], '4.4.7', true);
            wp_enqueue_script('AtlasVoicePlayerInsights', plugin_dir_url(__FILE__) . 'js/build/AtlasVoicePlayerInsights.min.js', array(
                'wp-hooks',
                'wp-i18n',
                'AtlasVoice_chart'
            ), $this->version, true);
            wp_localize_script('AtlasVoicePlayerInsights', 'ttsObj', $this->localize_data);
            wp_set_script_translations('AtlasVoicePlayerInsights', 'text-to-audio', plugin_dir_path(dirname(__FILE__)) . 'languages');
        }

        if (TTA_Helper::is_edit_page()) {
            wp_enqueue_script('AtlasVoiceCopyShortcode', plugin_dir_url(__FILE__) . 'js/AtlasVoiceCopyShortcode.js', array('wp-hooks', 'wp-i18n'), $this->version, true);
            wp_set_script_translations('AtlasVoiceCopyShortcode', 'text-to-audio', plugin_dir_path(dirname(__FILE__)) . 'languages');
        }

    }

    /**
     * Register the block and enqueue scripts.
     * Following WordPress i18n best practices for block editor.
     */
    public function engueue_block_scripts()
    {
        // Register the block script
        wp_register_script(
            'tta-blocks',
            plugin_dir_url(dirname(__FILE__)) . 'build/blocks.js',
            array('wp-blocks', 'wp-element', 'wp-i18n', 'wp-block-editor'),
            filemtime(plugin_dir_path(dirname(__FILE__)) . 'build/blocks.js'),
            true
        );

        // Localize script data
        wp_localize_script('tta-blocks', 'ttaBlocks', $this->localize_data);

        // Register the block type
        register_block_type('tta/customize-button', array(
            'api_version' => 2,
            'editor_script' => 'tta-blocks',
            'render_callback' => [$this, 'render_button'],
        ));

        wp_set_script_translations(
            'tta-blocks',
            'text-to-audio',
            plugin_dir_path(dirname(__FILE__)) . 'languages'
        );
    }

    /**
     * @param $customize button.
     *
     * @return string
     */
    public function render_button($customize)
    {
        // TTS-247: escape happens inside tta_get_button_content (wp_kses
        // with a small allow-list around the tts__listening_button output).
        return tta_get_button_content($customize, true);
    }

    /**
     * Enqueue wp speech file
     *
     */
    public function enqueue_TTA()
    {

        if (!TTA_Helper::should_load_button()) {
            return;
        }

        $player_id = get_player_id();

        // TTS-249: refresh the localized id/registry at render time (constructor
        // ran before Pro's init filter — see enqueue_scripts note).
        $this->localize_data['player_id']        = $player_id;
        $this->localize_data['availablePlayers'] = array_values( TTA_Helper::get_available_players() );

        $dependencies = ['wp-hooks'];
        if (wp_is_mobile()) {
            if ($player_id > 1) {
                $dependencies[] = 'tts-no-sleep';
            } else {
                $dependencies = array(
                    'wp-hooks',
                    'wp-shortcode'
                );
            }
            wp_enqueue_script('tts-no-sleep', plugin_dir_url(__FILE__) . 'js/build/NoSleep.min.js', array(), $this->version, true);
        } else {
            $dependencies = array(
                'wp-hooks',
                'wp-shortcode'
            );
        }

        // TTS-247: ship countries-and-timezones locally instead of jsDelivr CDN (wp.org Guideline 8).
        wp_enqueue_script('atlasvoice-timezone', plugin_dir_url(__FILE__) . 'js/vendor/countries-and-timezones.min.js', [], '3.9.0', true);
        array_push($dependencies, 'atlasvoice-timezone');
        if ($player_id > 1) {
            wp_enqueue_script('TextToSpeech', plugin_dir_url(__FILE__) . 'js/build/TextToSpeech.min.js', $dependencies, $this->version, true);
            wp_localize_script('TextToSpeech', 'ttsObj', $this->localize_data);
        } else if ($player_id == 1) {
            wp_enqueue_script('text-to-audio-button', plugin_dir_url(__FILE__) . 'js/build/text-to-audio-button.min.js', $dependencies, $this->version, true);
            wp_localize_script('text-to-audio-button', 'ttsObj', $this->localize_data);
            // TTS-249 (I2): player 1 renders in the light DOM, so its CSS is a
            // proper enqueued stylesheet (not a JS-injected <style> tag). The
            // dynamic per-button values (colours/size/border/margins + hover &
            // icon custom properties, all from the global customize settings)
            // are attached to the same handle via wp_add_inline_style() — WP
            // renders them in the document <head>, not as an inline style="".
            wp_enqueue_style('text-to-audio-button', plugin_dir_url(__FILE__) . 'css/text-to-audio-button.css', [], $this->version, 'all');
            if (function_exists('tta_get_player_button_inline_css')) {
                wp_add_inline_style('text-to-audio-button', tta_get_player_button_inline_css());
            }
        }
    }

    /**
     * Add Menu and Submenu page
     */

    public function TTA_menu()
    {
        add_menu_page(
            __('AtlasVoice', 'text-to-audio'),
            __('AtlasVoice', 'text-to-audio'),
            'manage_options',
            TEXT_TO_AUDIO_TEXT_DOMAIN,
            array($this, "TTA_settings"),
            'dashicons-controls-volumeon',
            // TTS-247: moved off slot 20 (core Pages) to 80 — sits between
            // Tools and Settings, still top-level and discoverable, no
            // conflict with WP's core admin hierarchy.
            80
        );
        add_submenu_page(TEXT_TO_AUDIO_TEXT_DOMAIN, __('AtlasVoice', 'text-to-audio'), __('AtlasVoice', 'text-to-audio'), 'manage_options', TEXT_TO_AUDIO_TEXT_DOMAIN, array(
            $this,
            "TTA_settings"
        ), 21);


        if (get_player_id() > 2) {
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- admin page-name read, no state mutation
            if (!empty($_REQUEST['page']) && $_REQUEST['page'] == 'bulk-mp3-generate') {
                wp_enqueue_style('tts-bootstrap', plugin_dir_url(__FILE__) . 'css/bootstrap.css', [], $this->version, 'all');
            }
            // Register a new admin page under "Bulk MP3 Generate" menu
            add_submenu_page(
                'text-to-audio',         // Page title
                'Bulk MP3 Generate',               // Menu title
                'Bulk MP3 Generate',            // Capability
                'manage_options',         // Menu slug
                'bulk-mp3-generate',   // Icon (optional)
                [$this, 'bulk_mp3_generate'],
                33, // Position (optional)
            );
        }

        $this->atlasaidev_plugins();
    }

    // Callback function to display the content of the page
    public function bulk_mp3_generate()
    {
        echo '<h1>AtlasVoice Pro : Bulk MP3 File Generate</h1>';

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- admin route check for which view to render
        if (!empty($_REQUEST['atlasvoice_mp3_file'])) {
            echo '<div id="atlasvoice_generate_bulk_mp3_file"></div>';
        } else {
            $url = admin_url('edit.php');
            echo '<p>No post ID found. Please select multiple posts from the post page. And apply <strong>AtlasVoice Generate MP3 File</strong> bulk action. <a href="' . esc_url( $url ) . '">Go to Posts Page</a></p>';
            echo 'How it works? <a style="text-decoration:none;color:red" target="_blank" href="https://www.youtube.com/watch?v=HFoqlkPCP80"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 576 512" fill="currentColor" style="vertical-align:-0.125em"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg></a>';
        }

    }

    /**
     * Atlas Plugins page callback.
     */
    public function atlas_plugins_page()
    {
        // TTS-247: emit an <h1> + .wp-header-end anchor so WordPress relocates any
        // admin notices to sit beneath the heading instead of overlapping the
        // JS-rendered hero. The screen-reader-only h1 keeps the visual hero intact.
        echo '<div class="wrap">';
        echo '<h1 class="screen-reader-text">' . esc_html__( 'AtlasAiDev Plugins', 'text-to-audio' ) . '</h1>';
        echo '<hr class="wp-header-end">';
        echo '<div id="atlas_plugins_container"></div>';
        echo '</div>';
    }

    public function TTA_settings()
    {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- admin route check, no state mutation
        $show_wizard = ( isset( $_GET['welcome'] ) && '1' === $_GET['welcome'] )
            && ( ! get_option( 'tta_onboarding_completed' ) || ( TTA_Helper::is_atlasvoice_addon_functional() && ! get_option( 'tta_pro_onboarding_completed' ) ) );
        if ( $show_wizard ) {
            echo "<div class='wpwrap'><div id='tts_welcome_wizard'></div></div>";
            return;
        }
        echo "<div class='wpwrap'><div id='tts_dashboard_ui'></div></div>";
    }


    /**
     * Remote URL for the plugins.json file.
     */
    const ATLAS_PLUGINS_REMOTE_URL = 'https://raw.githubusercontent.com/atlasaidev/plugins/main/plugins.json';

    /**
     * Transient key for cached plugin data.
     */
    const ATLAS_PLUGINS_TRANSIENT = 'atlas_plugins_remote_data';

    /**
     * Transient key for WP.org plugin info cache.
     */
    // _v2 suffix invalidates pre-existing caches that don't carry the
    // `name` field added by the wporg-canonical-title fix.
    const ATLAS_PLUGINS_WPORG_TRANSIENT = 'atlas_plugins_wporg_info_v2';

    /**
     * Cache duration in seconds (24 hours).
     */
    const ATLAS_PLUGINS_CACHE_TTL = 86400;

    /**
     * Fetch plugin data from GitHub with transient caching.
     *
     * @return array List of plugin objects.
     */
    public static function get_atlas_plugins() {
        $cached = get_transient(self::ATLAS_PLUGINS_TRANSIENT);
        if (false !== $cached && is_array($cached)) {
            return self::apply_name_overrides($cached);
        }

        // TTS-247: defence-in-depth — never hit GitHub from the front-end or
        // an unauthenticated context. Callers gate this to the AtlasAiDev
        // plugins admin screen + a manual refresh AJAX; this is the safety net.
        if (!is_admin() || !current_user_can('manage_options')) {
            return self::apply_name_overrides(self::get_fallback_plugins());
        }

        $response = wp_remote_get(self::ATLAS_PLUGINS_REMOTE_URL, array(
            'timeout' => 10,
            'headers' => array('Accept' => 'application/json'),
        ));

        if (!is_wp_error($response) && 200 === wp_remote_retrieve_response_code($response)) {
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            if (is_array($data) && !empty($data)) {
                set_transient(self::ATLAS_PLUGINS_TRANSIENT, $data, self::ATLAS_PLUGINS_CACHE_TTL);
                return self::apply_name_overrides($data);
            }
        }

        // Fallback: hardcoded plugin data.
        return self::apply_name_overrides(self::get_fallback_plugins());
    }

    /**
     * Override the `name` field for specific slugs with the new brand-name
     * fallback titles.
     *
     * The JS card renderer prefers `wporg_info[slug].name` (the canonical
     * WP.org title) when present, so this override only surfaces when
     * WP.org returns no name for a slug — exactly the "if somehow it
     * misses" path. Rename slugs on WP.org in due course; this map exists
     * so the AtlasAiDev branding stays consistent in the meantime.
     *
     * @param array $plugins
     * @return array
     */
    private static function apply_name_overrides($plugins) {
        $overrides = array(
            'ai-workflow-automation-ai-agent-hub' => 'AI Workflow Automation – AtlasAI',
            'smart-local-ai'                       => 'Smart Local AI – AtlasML',
        );
        if (!is_array($plugins)) {
            return $plugins;
        }
        foreach ($plugins as &$p) {
            if (is_array($p) && isset($p['slug']) && isset($overrides[$p['slug']])) {
                $p['name'] = $overrides[$p['slug']];
            }
        }
        unset($p);
        return $plugins;
    }

    /**
     * Hardcoded fallback plugin data in case remote fetch fails.
     *
     * @return array
     */
    private static function get_fallback_plugins() {
        return array(
            array(
                'name'          => 'Text To Speech TTS – AtlasVoice',
                'slug'          => 'text-to-audio',
                'basename'      => 'text-to-audio/text-to-audio.php',
                'icon'          => 'https://ps.w.org/text-to-audio/assets/icon-256x256.gif',
                'learnMoreUrl'  => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
                'proBasenames'  => array(
                    'text-to-speech-pro/text-to-audio-pro.php',
                    'text-to-speech-pro-premium/text-to-audio-pro.php',
                    'text-to-audio-pro/text-to-audio-pro.php',
                    'text-to-audio-pro-premium/text-to-audio-pro.php',
                ),
                'proUrl'        => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
                'configureSlug' => 'text-to-audio',
                'isNew'         => false,
                'complementary' => array('ai-workflow-automation-ai-agent-hub', 'smart-local-ai'),
                'priority'      => 1,
                'description'   => 'The most user-friendly Text-to-Speech accessibility plugin for WordPress. Automatically adds an audio player with no API required.',
                'features'      => array(
                    'Unlimited text-to-speech conversion',
                    '80+ languages, 20-300+ voices',
                    'Customizable player design',
                    'Shortcode support with flexible attributes',
                    'Custom Post Type & ACF compatibility',
                    'No external API required (browser SpeechSynthesis)',
                    'Multilingual support (WPML, GTranslate)',
                    'Analytics & engagement tracking',
                ),
            ),
            array(
                'name'          => '3D Model Viewer – AtlasAR',
                'slug'          => 'ar-vr-3d-model-try-on',
                'basename'      => 'ar-vr-3d-model-try-on/ar-vr-3d-model-try-on.php',
                'icon'          => 'https://ps.w.org/ar-vr-3d-model-try-on/assets/icon-256x256.gif',
                'learnMoreUrl'  => 'https://wpaugmentedreality.com/pricing/',
                'proBasenames'  => array(
                    'ar-vr-3d-model-try-on-pro/ar-vr-3d-model-try-on-premium.php',
                    'ar-vr-3d-model-try-on-premium/ar-vr-3d-model-try-on-premium.php',
                ),
                'proUrl'        => 'https://wpaugmentedreality.com/pricing/',
                'configureSlug' => 'ar-vr-3d-model-try-on',
                'isNew'         => false,
                'complementary' => array('text-to-audio', 'smart-local-ai'),
                'priority'      => 2,
                'description'   => 'Display interactive 3D models and augmented reality on your WordPress & WooCommerce site for enhanced product visualization.',
                'features'      => array(
                    'Interactive 3D model display',
                    'Augmented Reality (AR) support',
                    'WordPress & WooCommerce integration',
                    'Mobile-optimized viewing',
                    'Customizable display options',
                    'Reduces return rates with realistic visualization',
                    'Easy product page embedding',
                ),
            ),
            array(
                'name'          => 'AI Workflow Automation – AtlasAgent',
                'slug'          => 'ai-workflow-automation-ai-agent-hub',
                'basename'      => 'ai-workflow-automation-ai-agent-hub/ai-workflow-automation-ai-agent-hub.php',
                'icon'          => 'https://ps.w.org/ai-workflow-automation-ai-agent-hub/assets/icon-256x256.gif',
                'learnMoreUrl'  => 'https://wordpress.org/plugins/ai-workflow-automation-ai-agent-hub/',
                'proBasenames'  => array(
                    'ai-workflow-automation-ai-agent-hub-pro/ai-workflow-automation-ai-agent-hub-pro.php',
                ),
                'proUrl'        => 'https://atlasaidev.com/ai-agent-hub-pro/',
                'configureSlug' => 'ai-workflow-automation-ai-agent-hub',
                'isNew'         => false,
                'complementary' => array('text-to-audio', 'smart-local-ai'),
                'priority'      => 1,
                'description'   => 'Transform WordPress into an AI-powered control center with 70+ abilities, MCP server support, and workflow builder.',
                'features'      => array(
                    '70+ abilities across 9 modules',
                    'Built-in MCP Server (JSON-RPC 2.0)',
                    'JWT authentication',
                    'Drag-and-drop workflow builder',
                    'Multi-provider AI support (OpenAI, Gemini, Claude)',
                    'WooCommerce AI Store Manager',
                    'Post editor AI integration',
                ),
            ),
            array(
                'name'          => 'Smart Local AI – AtlasAI',
                'slug'          => 'smart-local-ai',
                'basename'      => 'smart-local-ai/smart-local-ai.php',
                'icon'          => 'https://ps.w.org/smart-local-ai/assets/icon-256x256.png',
                'learnMoreUrl'  => 'https://atlasaidev.com/smart-local-ai-pro/',
                'proBasenames'  => array(
                    'smart-local-ai-pro/smart-local-ai-pro.php',
                ),
                'proUrl'        => 'https://atlasaidev.com/smart-local-ai-pro/',
                'configureSlug' => 'smart-local-ai',
                'isNew'         => true,
                'complementary' => array('ai-workflow-automation-ai-agent-hub', 'text-to-audio'),
                'priority'      => 1,
                'description'   => 'Browser-based private AI tools for WordPress. Semantic related posts, personalized recommendations, and automatic alt text generation — all running on-device with zero cloud costs.',
                'features'      => array(
                    'RelevantFlow: Semantic content recommendations',
                    'PersonaFlow: Personalized recommendations based on visitor behavior',
                    'AltGenius: Automatic alt text generation for images',
                    'Zero cost — no API keys or subscriptions needed',
                    'Privacy by architecture — all AI runs in-browser',
                    'WebGPU + WASM hardware-accelerated inference',
                    'Works with any post type including WooCommerce products',
                    'GDPR compliant — no external data transmission',
                ),
            ),
        );
    }

    /**
     * Fetch WP.org plugin info (rating, installs) for all atlas plugins.
     *
     * @param array $plugins List of plugin data from get_atlas_plugins().
     * @return array Keyed by slug: { rating, num_ratings, active_installs }
     */
    public static function get_wporg_info($plugins) {
        $cached = get_transient(self::ATLAS_PLUGINS_WPORG_TRANSIENT);
        if (false !== $cached && is_array($cached)) {
            return $cached;
        }

        $info = array();
        foreach ($plugins as $plugin) {
            $slug = $plugin['slug'];
            $url  = 'https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=' . urlencode($slug) . '&request[fields][active_installs]=1&request[fields][rating]=1&request[fields][num_ratings]=1&request[fields][sections]=0&request[fields][description]=0';
            $response = wp_remote_get($url, array('timeout' => 5));
            if (!is_wp_error($response) && 200 === wp_remote_retrieve_response_code($response)) {
                $data = json_decode(wp_remote_retrieve_body($response), true);
                if (is_array($data) && !empty($data['slug'])) {
                    $info[$slug] = array(
                        // Canonical title from WP.org (e.g. "AR/VR 3D Model Viewer / Try-On" instead
                        // of the locally-curated "Text To Speech TTS – AtlasVoice" style names).
                        'name'            => isset($data['name']) ? wp_strip_all_tags( html_entity_decode( $data['name'] ) ) : '',
                        'rating'          => isset($data['rating']) ? (int) $data['rating'] : 0,
                        'num_ratings'     => isset($data['num_ratings']) ? (int) $data['num_ratings'] : 0,
                        'active_installs' => isset($data['active_installs']) ? (int) $data['active_installs'] : 0,
                    );
                }
            }
            if (!isset($info[$slug])) {
                $info[$slug] = array('name' => '', 'rating' => 0, 'num_ratings' => 0, 'active_installs' => 0);
            }
        }

        set_transient(self::ATLAS_PLUGINS_WPORG_TRANSIENT, $info, self::ATLAS_PLUGINS_CACHE_TTL);
        return $info;
    }

    /**
     * Detect which plugins have their Pro version installed or active.
     *
     * @param array $plugins     List of plugin data from get_atlas_plugins().
     * @param array $all_plugins All installed plugin basenames.
     * @param array $active_plugins Active plugin basenames.
     * @return array { pro_installed: string[], pro_active: string[] }
     */
    public static function detect_pro_status($plugins, $all_plugins, $active_plugins) {
        $pro_installed = array();
        $pro_active    = array();

        foreach ($plugins as $plugin) {
            $slug = $plugin['slug'];
            if (empty($plugin['proBasenames']) || !is_array($plugin['proBasenames'])) {
                continue;
            }
            foreach ($plugin['proBasenames'] as $pro_basename) {
                if (in_array($pro_basename, $all_plugins, true)) {
                    $pro_installed[] = $slug;
                    if (in_array($pro_basename, $active_plugins, true)) {
                        $pro_active[] = $slug;
                    }
                    break; // Found one match, no need to check other basenames.
                }
            }
        }

        return array(
            'pro_installed' => array_unique($pro_installed),
            'pro_active'    => array_unique($pro_active),
        );
    }

    public function atlasaidev_plugins($menu_slug = 'atlasvoice-other-plugins', $plugin_slug = 'text-to-audio') {
        // TTS-247: the remote catalog fetch (get_atlas_plugins -> github raw)
        // only runs when the user explicitly opens this admin page, and the
        // user sees a disclosure notice on entry. Documented in readme's
        // "External services" section.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- admin page-name read for current-screen check
        if (!empty($_REQUEST['page']) && $_REQUEST['page'] === $menu_slug) {
            add_action('admin_notices', function () {
                // TTS-247: the surrounding "Other AtlasAiDev Plugins" page has a
                // dark hero card that bleeds into the default .notice text
                // colour; inline styles guarantee readable contrast.
                printf(
                    '<div class="notice notice-info" style="background:#fff;border-left-color:#2271b1;color:#1d2327;"><p style="color:#1d2327;margin:8px 0;font-size:13px;line-height:1.5;"><strong style="color:#1d2327;">%s</strong> %s</p></div>',
                    esc_html__(
                        'Heads up:',
                        'text-to-audio'
                    ),
                    esc_html__(
                        'this page fetches the latest AtlasAiDev plugin list from a public GitHub file. No site or user data is sent — see "External services" in the readme for details.',
                        'text-to-audio'
                    )
                );
            });

            wp_enqueue_script(
                'atlas-plugins',
                plugin_dir_url(__FILE__) . 'js/atlas-plugins.js',
                array('wp-i18n', 'updates'),
                $this->version,
                true
            );
            wp_set_script_translations(
                'atlas-plugins',
                'text-to-audio',
                plugin_dir_path(dirname(__FILE__)) . 'languages'
            );

            // Fetch plugin list from remote (cached).
            $atlas_plugins = self::get_atlas_plugins();

            // Build basenames map dynamically from remote data.
            $atlas_basenames = array();
            foreach ($atlas_plugins as $plugin) {
                if (!empty($plugin['slug']) && !empty($plugin['basename'])) {
                    $atlas_basenames[$plugin['slug']] = $plugin['basename'];
                }
            }

            // Determine installed and active plugin statuses.
            if (!function_exists('get_plugins')) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }
            $all_plugins    = array_keys(get_plugins());
            $active_plugins = (array) get_option('active_plugins', array());

            $installed_slugs = array();
            $active_slugs    = array();
            $activate_urls   = array();
            foreach ($atlas_basenames as $slug => $basename) {
                if (in_array($basename, $all_plugins, true)) {
                    $installed_slugs[] = $slug;
                    if (!in_array($basename, $active_plugins, true)) {
                        $activate_urls[$slug] = html_entity_decode(wp_nonce_url(
                            admin_url('plugins.php?action=activate&plugin=' . urlencode($basename)),
                            'activate-plugin_' . $basename
                        ));
                    }
                }
                if (in_array($basename, $active_plugins, true)) {
                    $active_slugs[] = $slug;
                }
            }

            // Fetch WP.org info (ratings, installs) — cached.
            $wporg_info = self::get_wporg_info($atlas_plugins);

            // Detect Pro plugin install/active status.
            $pro_status = self::detect_pro_status($atlas_plugins, $all_plugins, $active_plugins);

            // Find the current plugin's display name for the banner.
            $current_plugin_name = '';
            foreach ($atlas_plugins as $p) {
                if (!empty($p['slug']) && $p['slug'] === $plugin_slug) {
                    $current_plugin_name = $p['name'];
                    break;
                }
            }

            wp_localize_script('atlas-plugins', 'atlasPluginsData', array(
                'current_plugin_slug' => $plugin_slug,
                'current_plugin_name' => $current_plugin_name,
                'plugins'             => $atlas_plugins,
                'installed_plugins'   => $installed_slugs,
                'active_plugins'      => $active_slugs,
                'activate_urls'       => (object) $activate_urls,
                'wporg_info'          => (object) $wporg_info,
                'pro_installed'       => $pro_status['pro_installed'],
                'pro_active'          => $pro_status['pro_active'],
                'admin_url'           => admin_url(),
                'ajax_url'            => admin_url('admin-ajax.php'),
                'refresh_nonce'       => wp_create_nonce('atlas_plugins_refresh'),
            ));
        }
        add_submenu_page(
            TEXT_TO_AUDIO_TEXT_DOMAIN,
            __('Plugins', 'text-to-audio'),
            __('Plugins', 'text-to-audio'),
            'manage_options',
            $menu_slug,
            array($this, 'atlas_plugins_page'),
            34
        );
    }

    /**
     * AJAX handler to refresh plugin data from remote.
     */
    public function ajax_refresh_plugins() {
        check_ajax_referer('atlas_plugins_refresh', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized', 403);
        }

        // Delete cached data and re-fetch.
        delete_transient(self::ATLAS_PLUGINS_TRANSIENT);
        delete_transient(self::ATLAS_PLUGINS_WPORG_TRANSIENT);
        $plugins    = self::get_atlas_plugins();
        $wporg_info = self::get_wporg_info($plugins);

        wp_send_json_success(array(
            'plugins'    => $plugins,
            'wporg_info' => $wporg_info,
        ));
    }

    /**
     * Add AtlasVoice quick-toggle item to the WordPress admin bar on front-end singular pages.
     *
     * @param \WP_Admin_Bar $admin_bar The WP_Admin_Bar instance.
     *
     * @since 2.2.0
     */
    public function add_admin_bar_toggle( $admin_bar ) {
        if ( is_admin() || ! is_singular() || ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
            return;
        }

        global $post;
        if ( ! $post ) {
            return;
        }

        $settings   = TTA_Helper::tts_get_settings( 'settings' );

        // Check if admin bar toggle is disabled in settings.
        $show_toggle = isset( $settings['tta__settings_show_admin_bar_toggle'] ) ? $settings['tta__settings_show_admin_bar_toggle'] : true;
        if ( ! $show_toggle ) {
            return;
        }
        $post_types = isset( $settings['tta__settings_allow_listening_for_post_types'] ) ? (array) $settings['tta__settings_allow_listening_for_post_types'] : [];

        if ( empty( $post_types ) || ! in_array( $post->post_type, $post_types, true ) ) {
            return;
        }

        $excluded_ids = isset( $settings['tta__settings_exclude_post_ids'] ) ? (array) $settings['tta__settings_exclude_post_ids'] : [];
        $is_active    = ! in_array( (string) $post->ID, $excluded_ids, true ) && ! in_array( (int) $post->ID, $excluded_ids, true );

        $label = $is_active
            ? __( 'AtlasVoice: On', 'text-to-audio' )
            : __( 'AtlasVoice: Off', 'text-to-audio' );

        $admin_bar->add_node( [
            'id'    => 'tta-audio-toggle',
            'title' => '<span class="ab-icon dashicons dashicons-megaphone"></span>'
                     . '<span class="tta-ab-indicator ' . ( $is_active ? 'tta-ab-on' : 'tta-ab-off' ) . '"></span> '
                     . esc_html( $label ),
            'href'  => '#',
            'meta'  => [
                'class' => 'tta-admin-bar-toggle',
                'title' => __( 'Toggle AtlasVoice audio player for this post', 'text-to-audio' ),
            ],
        ] );
    }

    /**
     * TTS-240: Print inline CORS detector on front-end so CDN-blocked script
     * loads get reported back to WordPress. Runs before our bundles so the
     * listener exists even if our first bundle is what CORS blocks.
     *
     * @since 2.1.16
     */
    public function enqueue_cors_detector() {
        if ( is_admin() ) { return; }
        if ( ! TTA_Helper::should_load_button() ) { return; }
        if ( ! TTA_Helper::is_cdn_likely_active() ) { return; }

        $endpoint  = esc_url_raw( rest_url( 'tta/v1/cors-alert' ) );
        $site_host = wp_parse_url( home_url(), PHP_URL_HOST );
        if ( ! $site_host || ! $endpoint ) { return; }

        // TTS-249 (I3): enqueued instead of an inline <script>. Registered with
        // no deps + in <head> (priority 1 on wp_enqueue_scripts) so the error
        // listener exists before our other bundles can be CORS-blocked.
        wp_enqueue_script(
            'tta-cors-detector',
            plugin_dir_url( __FILE__ ) . 'js/tta-cors-detector.js',
            array(),
            $this->version,
            false
        );
        wp_localize_script( 'tta-cors-detector', 'ttaCorsDetector', array(
            'endpoint' => $endpoint,
            'siteHost' => $site_host,
        ) );
    }

    /**
     * TTS-249 (I3): enqueue the admin-bar toggle CSS + JS as proper assets
     * (front-end, logged-in admins). Replaces the former inline <style>/<script>
     * printed on wp_head/wp_footer. Dynamic values (post id, ajax url, nonce,
     * on/off labels) are passed via wp_localize_script.
     *
     * @since 2.2.0
     */
    public function enqueue_admin_bar_assets() {
        if ( is_admin() || ! is_admin_bar_showing() || ! is_singular() || ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $settings    = TTA_Helper::tts_get_settings( 'settings' );
        $show_toggle = isset( $settings['tta__settings_show_admin_bar_toggle'] ) ? $settings['tta__settings_show_admin_bar_toggle'] : true;
        if ( ! $show_toggle ) {
            return;
        }

        global $post;
        if ( ! $post ) {
            return;
        }

        wp_enqueue_style(
            'tta-admin-bar',
            plugin_dir_url( __FILE__ ) . 'css/tta-admin-bar.css',
            array(),
            $this->version,
            'all'
        );
        wp_enqueue_script(
            'tta-admin-bar',
            plugin_dir_url( __FILE__ ) . 'js/tta-admin-bar.js',
            array(),
            $this->version,
            true
        );
        wp_localize_script( 'tta-admin-bar', 'ttaAdminBar', array(
            'postId'   => (int) $post->ID,
            'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'tta_toggle_audio_nonce' ),
            'onLabel'  => __( 'AtlasVoice: On', 'text-to-audio' ),
            'offLabel' => __( 'AtlasVoice: Off', 'text-to-audio' ),
        ) );
    }

    /**
     * Render a "Need Help?" rescue modal on the plugins.php page.
     *
     * Intercepts the first deactivation click for text-to-audio and shows
     * quick-fix links; a second click after "Continue to Deactivate"
     * proceeds to WP's normal deactivation flow.
     *
     * @since 2.2.0
     */
    public function render_deactivation_rescue_modal() {
        global $pagenow;
        if ( 'plugins.php' !== $pagenow ) {
            return;
        }

        $admin_url    = admin_url( 'admin.php?page=text-to-audio' );
        $docs_url     = esc_url( $admin_url . '#/faq' );
        $compat_url   = esc_url( $admin_url . '#/compatibility' );
        $integrations_url = esc_url( $admin_url . '#/integrations' );
        $support_url  = 'https://atlasaidev.com/contact-us/';
        ?>
        <div id="tta-rescue-modal-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:100100;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:8px;max-width:480px;width:90%;padding:28px 32px;box-shadow:0 4px 24px rgba(0,0,0,.25);position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#1d2327;">
                    <?php echo esc_html__( 'Having trouble? We can help!', 'text-to-audio' ); ?>
                </h2>
                <p style="margin:0 0 16px;color:#50575e;font-size:14px;">
                    <?php echo esc_html__( 'Many issues can be fixed in under 2 minutes:', 'text-to-audio' ); ?>
                </p>
                <ul style="margin:0 0 20px;padding:0;list-style:none;">
                    <li style="margin-bottom:10px;font-size:14px;color:#1d2327;">
                        <?php echo esc_html__( 'Voice not working', 'text-to-audio' ); ?> &rarr;
                        <a href="<?php echo esc_url( $docs_url ); ?>" style="color:#2271b1;text-decoration:none;font-weight:500;">
                            <?php echo esc_html__( 'Quick Fix Guide', 'text-to-audio' ); ?>
                        </a>
                    </li>
                    <li style="margin-bottom:10px;font-size:14px;color:#1d2327;">
                        <?php echo esc_html__( 'Player not showing', 'text-to-audio' ); ?> &rarr;
                        <a href="<?php echo esc_url( $compat_url ); ?>" style="color:#2271b1;text-decoration:none;font-weight:500;">
                            <?php echo esc_html__( 'Troubleshoot', 'text-to-audio' ); ?>
                        </a>
                    </li>
                    <li style="margin-bottom:10px;font-size:14px;color:#1d2327;">
                        <?php echo esc_html__( 'Need better voices', 'text-to-audio' ); ?> &rarr;
                        <a href="<?php echo esc_url( $integrations_url ); ?>" style="color:#2271b1;text-decoration:none;font-weight:500;">
                            <?php echo esc_html__( 'See AI Voices', 'text-to-audio' ); ?>
                        </a>
                    </li>
                </ul>
                <div style="display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap;">
                    <a href="<?php echo esc_url( $support_url ); ?>" target="_blank" rel="noopener noreferrer"
                       class="button button-primary"
                       style="text-decoration:none;">
                        <?php echo esc_html__( 'Contact Support', 'text-to-audio' ); ?>
                    </a>
                    <button id="tta-rescue-continue-deactivate" class="button" type="button">
                        <?php echo esc_html__( 'Continue to Deactivate', 'text-to-audio' ); ?> &rarr;
                    </button>
                </div>
            </div>
        </div>
        <?php
        // TTS-249 (I3): the modal behaviour lives in the enqueued
        // tta-deactivation-rescue.js (see enqueue_deactivation_rescue_assets),
        // not an inline <script>.
    }

    /**
     * TTS-249 (I3): enqueue the deactivation-rescue modal JS on plugins.php.
     *
     * @param string $hook Current admin page hook.
     */
    public function enqueue_deactivation_rescue_assets( $hook ) {
        if ( 'plugins.php' !== $hook ) {
            return;
        }
        wp_enqueue_script(
            'tta-deactivation-rescue',
            plugin_dir_url( __FILE__ ) . 'js/tta-deactivation-rescue.js',
            array(),
            $this->version,
            true
        );
    }

    /**
     * AJAX handler to toggle audio player on/off for a specific post.
     *
     * @since 2.2.0
     */
    public static function ajax_toggle_audio() {
        check_ajax_referer( 'tta_toggle_audio_nonce' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( [ 'message' => __( 'Permission denied.', 'text-to-audio' ) ] );
        }

        $post_id = isset( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : 0;
        if ( ! $post_id || ! get_post( $post_id ) ) {
            wp_send_json_error( [ 'message' => __( 'Invalid post.', 'text-to-audio' ) ] );
        }

        $settings     = get_option( 'tta_settings_data', [] );
        if ( is_object( $settings ) ) {
            $settings = (array) $settings;
        }
        $excluded_ids = isset( $settings['tta__settings_exclude_post_ids'] ) ? (array) $settings['tta__settings_exclude_post_ids'] : [];

        // Check if post ID is currently excluded (compare as strings since stored values may be strings).
        $found_key = false;
        foreach ( $excluded_ids as $key => $id ) {
            if ( (int) $id === $post_id ) {
                $found_key = $key;
                break;
            }
        }

        if ( false !== $found_key ) {
            // Currently excluded -- remove to turn ON.
            unset( $excluded_ids[ $found_key ] );
            $excluded_ids = array_values( $excluded_ids );
            $is_active    = true;
        } else {
            // Currently active -- add to turn OFF.
            $excluded_ids[] = (string) $post_id;
            $is_active      = false;
        }

        $settings['tta__settings_exclude_post_ids'] = $excluded_ids;
        update_option( 'tta_settings_data', $settings );

        // Invalidate the settings cache so the change takes effect immediately.
        $cache_key = TTA_Cache::get_key( 'tts_get_settings' );
        TTA_Cache::delete( $cache_key );

        wp_send_json_success( [ 'is_active' => $is_active, 'post_id' => $post_id ] );
    }

}
