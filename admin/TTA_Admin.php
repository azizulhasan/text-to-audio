<?php

namespace TTA_Admin;

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

        if (!function_exists('is_plugin_active')) {
            include ABSPATH . 'wp-admin/includes/plugin.php';
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
            'image_url' => WP_PLUGIN_URL . '/text-to-audio/admin/images',
            'plugin_url' => WP_PLUGIN_URL . '/text-to-audio',
            'nonce' => wp_create_nonce(TEXT_TO_AUDIO_NONCE),
            'plugin_name' => TEXT_TO_AUDIO_PLUGIN_NAME,
            'rest_nonce' => wp_create_nonce('wp_rest'),
            'VERSION' => is_pro_active() ? get_option('TTA_PRO_VERSION') : TEXT_TO_AUDIO_VERSION,
            'is_logged_in' => is_user_logged_in(),
            'user_id' => get_current_user_id(),
            'is_dashboard' => is_admin(),
            'is_pro_active' => is_pro_active(),
            'is_pro_license_active' => is_pro_active(),
            'is_admin_page' => is_admin(),
            "player_id" => get_player_id(),
            "is_folder_writable" => TTA_Helper::is_audio_folder_writable(),
            'compatible' => TTA_Helper::get_compatible_plugins_data(),
            'gctts_is_authenticated' => get_player_id() == '4',
            'settings' => $settings,
            'player_customizations' => apply_filters('tts_player_customizations', [
                '1' => [
                    'play' => "<svg width='15px' height='15px'   xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 8'><polygon fill='$color' points='0 0 0 8 7 4'/></svg>",
                    'pause' => "<svg width='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><g id='SVGRepo_bgCarrier' stroke-width='1.5'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'> <path opacity='0.1' d='M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z' fill='none'></path> <path d='M14 9L14 15' stroke='$color' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'></path> <path d='M10 9L10 15' stroke='$color' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'></path> <path d='M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z' stroke='$color' stroke-width='2'></path> </g></svg>",
                    'replay' => "<svg width='20px' height='20px' viewBox='0 0 24.00 24.00' fill='none' xmlns='http://www.w3.org/2000/svg' stroke='$color' stroke-width='1'><g id='SVGRepo_bgCarrier' stroke-width='0'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'> <path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.82902 13.1103 4.96967 12.9697C5.11032 12.829 5.30109 12.75 5.5 12.75C5.69891 12.75 5.88968 12.829 6.03033 12.9697C6.17098 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.58723 15.7489 7.21905 16.6945C7.85087 17.6401 8.74889 18.3771 9.79957 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.35087 15.1945 8.71905C14.2489 8.08723 13.1372 7.75 12 7.75H9.5C9.30109 7.75 9.11032 7.67098 8.96967 7.53033C8.82902 7.38968 8.75 7.19891 8.75 7C8.75 6.80109 8.82902 6.61032 8.96967 6.46967C9.11032 6.32902 9.30109 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.01384 17.1265 8.37348C18.4862 9.73311 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='$color'></path> <path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53003C8.32955 7.38941 8.25066 7.19878 8.25066 7.00003C8.25066 6.80128 8.32955 6.61066 8.47 6.47003L11.47 3.47003C11.5387 3.39634 11.6215 3.33724 11.7135 3.29625C11.8055 3.25526 11.9048 3.23322 12.0055 3.23144C12.1062 3.22966 12.2062 3.24819 12.2996 3.28591C12.393 3.32363 12.4778 3.37977 12.549 3.45099C12.6203 3.52221 12.6764 3.60705 12.7141 3.70043C12.7518 3.79382 12.7704 3.89385 12.7686 3.99455C12.7668 4.09526 12.7448 4.19457 12.7038 4.28657C12.6628 4.37857 12.6037 4.46137 12.53 4.53003L10.06 7.00003L12.53 9.47003C12.6704 9.61066 12.7493 9.80128 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='$color'></path> </g></svg>",
                    'resume' => "<svg width='20px' height='20px' viewBox='0 0 24.00 24.00' fill='none' xmlns='http://www.w3.org/2000/svg' stroke='$color' stroke-width='1'><g id='SVGRepo_bgCarrier' stroke-width='0'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'> <path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.82902 13.1103 4.96967 12.9697C5.11032 12.829 5.30109 12.75 5.5 12.75C5.69891 12.75 5.88968 12.829 6.03033 12.9697C6.17098 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.58723 15.7489 7.21905 16.6945C7.85087 17.6401 8.74889 18.3771 9.79957 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.35087 15.1945 8.71905C14.2489 8.08723 13.1372 7.75 12 7.75H9.5C9.30109 7.75 9.11032 7.67098 8.96967 7.53033C8.82902 7.38968 8.75 7.19891 8.75 7C8.75 6.80109 8.82902 6.61032 8.96967 6.46967C9.11032 6.32902 9.30109 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.01384 17.1265 8.37348C18.4862 9.73311 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='$color'></path> <path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53003C8.32955 7.38941 8.25066 7.19878 8.25066 7.00003C8.25066 6.80128 8.32955 6.61066 8.47 6.47003L11.47 3.47003C11.5387 3.39634 11.6215 3.33724 11.7135 3.29625C11.8055 3.25526 11.9048 3.23322 12.0055 3.23144C12.1062 3.22966 12.2062 3.24819 12.2996 3.28591C12.393 3.32363 12.4778 3.37977 12.549 3.45099C12.6203 3.52221 12.6764 3.60705 12.7141 3.70043C12.7518 3.79382 12.7704 3.89385 12.7686 3.99455C12.7668 4.09526 12.7448 4.19457 12.7038 4.28657C12.6628 4.37857 12.6037 4.46137 12.53 4.53003L10.06 7.00003L12.53 9.47003C12.6704 9.61066 12.7493 9.80128 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='$color'></path> </g></svg>",
                ]
            ]),
            'is_mobile' => wp_is_mobile(),
            'current_plugin_slug' => 'text-to-audio',
            'detected_caching_plugins' => TTA_Helper::get_detected_caching_plugins(),
            'latest_post_preview_url'  => '', // populated lazily in enqueue to avoid early get_permalink() call
            // TTS-238: AtlasVoiceSelector storage — engine uses this to resolve Tier 2 selector.
            'atlasvoice_selectors' => get_option('tta_atlasvoice_selectors', [ 'global' => '', 'per_post_type' => [] ]),
            // TTS-238: Opt-in flag. When false (default), the new JS extractor stays dormant
            // and the legacy extraction path runs unchanged. `$settings` here is the
            // nested map returned by `tts_get_settings('')`, so the `tta_settings_data`
            // flags live under the 'settings' sub-key.
            'use_atlasvoice_extractor' => ! empty( $settings['settings']['tta__settings_use_atlasvoice_extractor'] ),

            // TTS-238 PR-B: First-visit auto-detect needs the current post type and
            // the viewer's capability to decide whether to silently save a scored
            // selector. Only admins (manage_options) can hit /save-selector, so we
            // lift that check into the bundle to avoid a speculative 403.
            //
            // `current_post_type` is populated lazily in enqueue_scripts() because
            // `is_singular()` must not be called before the main query runs (WP
            // throws _doing_it_wrong for that). The constructor on plugins_loaded
            // is too early. Same pattern as `latest_post_preview_url` below.
            'can_save_selector' => current_user_can( 'manage_options' ),
            'current_post_type' => '',

        ];
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

        if (!function_exists('is_plugin_active')) {
            include ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Populate latest_post_preview_url lazily here (not in constructor)
        // because get_permalink() needs $wp_rewrite which isn't available during plugins_loaded.
        if ( empty( $this->localize_data['latest_post_preview_url'] ) ) {
            $this->localize_data['latest_post_preview_url'] = TTA_Helper::get_latest_post_preview_url();
        }

        // TTS-238 PR-B: Populate current_post_type lazily — is_singular() must
        // not be called before the main query runs (WP _doing_it_wrong). By the
        // time wp_enqueue_scripts fires, the main query is resolved so this is
        // safe. Used by the engine + picker bundles to key the auto-detected
        // selector to the right CPT.
        if ( empty( $this->localize_data['current_post_type'] ) ) {
            if ( function_exists( 'is_singular' ) && did_action( 'wp' ) && is_singular() ) {
                $this->localize_data['current_post_type'] = (string) get_post_type();
            }
        }

        do_action('tta_enqueue_pro_dashboard_scripts');

        // Welcome wizard (separate bundle, only on first activation).
        $is_wizard_page = is_admin()
            && isset( $_REQUEST['page'] ) && 'text-to-audio' === $_REQUEST['page']
            && isset( $_REQUEST['welcome'] ) && '1' === $_REQUEST['welcome']
            && ( ! get_option( 'tta_onboarding_completed' ) || ( TTA_Helper::is_pro_active() && ! get_option( 'tta_pro_onboarding_completed' ) ) );
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
                'is_pro_active'     => TTA_Helper::is_pro_active(),
                'is_pro_wizard'     => TTA_Helper::is_pro_active() && ! get_option( 'tta_pro_onboarding_completed' ),
                'nonce'             => wp_create_nonce( 'wp_rest' ),
                'api_url'           => esc_url_raw( rest_url( 'tta/v1/' ) ),
                'pro_url'           => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
                'dashboard_url'     => admin_url( 'admin.php?page=text-to-audio' ),
                'site_locale'       => get_locale(),
                'plugin_url'        => WP_PLUGIN_URL . '/text-to-audio',
            ) );

            wp_enqueue_script( 'tts-welcome-wizard' );
            wp_set_script_translations(
                'tts-welcome-wizard',
                'text-to-audio',
                plugin_dir_path( dirname( __FILE__ ) ) . 'languages'
            );
            return; // Don't load dashboard scripts when wizard is active.
        }

        if (is_admin() && isset($_REQUEST['page']) && ('text-to-audio' == $_REQUEST['page'])) {
            /* Load react js */
            wp_enqueue_style('tts-bootstrap', plugin_dir_url(__FILE__) . 'css/bootstrap.css', [], $this->version, 'all');
            wp_enqueue_script('TextToSpeech', plugin_dir_url(__FILE__) . 'js/build/TextToSpeech.min.js', array('wp-hooks',), $this->version, true);
            wp_localize_script('TextToSpeech', 'ttsObj', $this->localize_data);
            // Register dashboard UI script (following i18n best practices)
            wp_register_script(
                'text-to-audio-dashboard-ui',
                plugin_dir_url(__FILE__) . 'js/build/text-to-audio-dashboard-ui.min.js',
                array('TextToSpeech', 'wp-element', 'wp-i18n'),
                $this->version,
                true
            );

            wp_localize_script('text-to-audio-dashboard-ui', 'tta_obj', $this->localize_data);
            wp_localize_script('text-to-audio-dashboard-ui', 'ttsTR', TTA_i18n::get_default_labels());
            wp_enqueue_script('text-to-audio-dashboard-ui');
            wp_set_script_translations(
                'text-to-audio-dashboard-ui',
                'text-to-audio',
                plugin_dir_path(dirname(__FILE__)) . 'languages'
            );
            wp_enqueue_style('dashicons');

            // Player 2
            wp_enqueue_style('text-to-audio-pro-demo', plugin_dir_url(__FILE__) . 'demos/player2/text-to-audio-pro-demo.css', [], $this->version, 'all');
            wp_enqueue_script('TextToSpeechProDemo', plugin_dir_url(__FILE__) . 'demos/player2/js/TextToSpeechProDemo.min.js', array(
                'wp-hooks',
                'TextToSpeech'
            ), $this->version, true);
            wp_localize_script('TextToSpeechProDemo', 'ttsObjPro', $this->localize_data);

            // Player 3
            wp_enqueue_style('tts-pro-demo-plyr', plugin_dir_url(__FILE__) . 'demos/player3/css/plyr-demo.min.css', [], $this->version, 'all');
            wp_enqueue_script('text-to-audio-plyr-demo-lib', plugin_dir_url(__FILE__) . 'demos/player3/js/build/plyr-demo.lib.min.js', array('wp-hooks'), $this->version, true);
            wp_enqueue_script('text-to-audio-demo-plyr', plugin_dir_url(__FILE__) . 'demos/player3/js/build/plyr-demo.min.js', array(), $this->version, true);
            wp_localize_script('text-to-audio-demo-plyr', 'ttsObj', $this->localize_data);

        }

        if (is_admin() && isset($GLOBALS['pagenow']) && $GLOBALS['pagenow'] === 'plugins.php') {
            $object = ob_start();
            ?>
            <script>
                window.document.addEventListener('DOMContentLoaded', function () {
                    /**
                     * If free version then remove the opt-in link from plugin link.
                     * Also remove the deactivation modal by freemius. So that
                     * AtlasAiDev tracking software works properly.
                     */
                    // if(isProActive && document.querySelector('.opt-in-or-opt-out.text-to-audio')) {
                    //     document.querySelector('.opt-in-or-opt-out.text-to-audio').style.display = 'none';
                    // }

                    if (document.querySelector('[data-plugin="text-to-audio/text-to-audio.php"]')) {
                        var moduleIdElement = document.querySelector('i.fs-module-id[data-module-id="13388"]');
                        if (moduleIdElement) {
                            moduleIdElement.parentNode.removeChild(moduleIdElement);
                        }
                    }
                })
            </script>

            <?php
            $object = ob_get_contents();
            echo $object;
        }

        if (TTA_Helper::is_edit_page() || isset($_REQUEST['page']) && ('text-to-audio' == $_REQUEST['page'])) {
            wp_enqueue_script('AtlasVoice_chart', 'https://cdn.jsdelivr.net/npm/chart.js', [], $this->version, true);
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
            filemtime(plugin_dir_path(dirname(__FILE__)) . 'build/blocks.js')
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

        // TTS-238 PR-B: Populate current_post_type lazily here too — this is
        // the frontend entry (hooked to wp_enqueue_scripts). The constructor
        // runs on plugins_loaded which is too early for is_singular(), and
        // the admin-side enqueue_scripts() does not fire on frontend hits,
        // so without this second call ttsObj.current_post_type would stay
        // empty on the live post and the first-visit auto-detect could not
        // key saved selectors to the right CPT.
        if ( empty( $this->localize_data['current_post_type'] ) ) {
            if ( function_exists( 'is_singular' ) && did_action( 'wp' ) && is_singular() ) {
                $this->localize_data['current_post_type'] = (string) get_post_type();
            }
        }

        $player_id = get_player_id();

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

        wp_enqueue_script('atlasvoice-timezone', 'https://cdn.jsdelivr.net/npm/countries-and-timezones/dist/index.min.js', [], $this->version, true);
        array_push($dependencies, 'atlasvoice-timezone');

        // TTS-238: AtlasVoice extractor engine + visual picker.
        // Both are gated on the opt-in setting. When opt-in is OFF (default)
        // neither asset is enqueued — legacy extraction runs as before with
        // zero new JS loaded on the page.
        // Engine: loads on every page that has the player (used by getContent).
        // Picker: loads only for logged-in users with edit capability (admin UI).
        $extractor_opt_in = ! empty( $this->localize_data['use_atlasvoice_extractor'] );
        if ( $extractor_opt_in ) {
            wp_enqueue_script('tts-extractor-engine', plugin_dir_url(__FILE__) . 'js/build/tts-extractor-engine.min.js', [], $this->version, true);
            array_push($dependencies, 'tts-extractor-engine');

            if (is_user_logged_in() && current_user_can('edit_posts')) {
                wp_enqueue_script('tts-picker', plugin_dir_url(__FILE__) . 'js/build/tts-picker.min.js', [], $this->version, true);
            }
        }

        if ($player_id > 1) {
            wp_enqueue_script('TextToSpeech', plugin_dir_url(__FILE__) . 'js/build/TextToSpeech.min.js', $dependencies, $this->version, true);
            wp_localize_script('TextToSpeech', 'ttsObj', $this->localize_data);
        } else if ($player_id == 1) {
            wp_enqueue_script('text-to-audio-button', plugin_dir_url(__FILE__) . 'js/build/text-to-audio-button.min.js', $dependencies, $this->version, true);
            wp_localize_script('text-to-audio-button', 'ttsObj', $this->localize_data);
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
            20
        );
        add_submenu_page(TEXT_TO_AUDIO_TEXT_DOMAIN, __('AtlasVoice', 'text-to-audio'), __('AtlasVoice', 'text-to-audio'), 'manage_options', TEXT_TO_AUDIO_TEXT_DOMAIN, array(
            $this,
            "TTA_settings"
        ), 21);


        if (get_player_id() > 2) {
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

        if (!empty($_REQUEST['atlasvoice_mp3_file'])) {
            echo '<div id="atlasvoice_generate_bulk_mp3_file"></div>';
        } else {
            $url = admin_url('edit.php');
            echo '<p>No post ID found. Please select multiple posts from the post page. And apply <strong>AtlasVoice Generate MP3 File</strong> bulk action. <a href="' . $url . '">Go to Posts Page</a></p>';
            echo 'How it works? <a style="text-decoration:none;color:red" target="_blank" href="https://www.youtube.com/watch?v=HFoqlkPCP80"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 576 512" fill="currentColor" style="vertical-align:-0.125em"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg></a>';
        }

    }

    /**
     * Atlas Plugins page callback.
     */
    public function atlas_plugins_page()
    {
        echo '<div class="wrap"><div id="atlas_plugins_container"></div></div>';
    }

    public function TTA_settings()
    {
        $show_wizard = ( isset( $_GET['welcome'] ) && '1' === $_GET['welcome'] )
            && ( ! get_option( 'tta_onboarding_completed' ) || ( TTA_Helper::is_pro_active() && ! get_option( 'tta_pro_onboarding_completed' ) ) );
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
    const ATLAS_PLUGINS_WPORG_TRANSIENT = 'atlas_plugins_wporg_info';

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
            return $cached;
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
                return $data;
            }
        }

        // Fallback: hardcoded plugin data.
        return self::get_fallback_plugins();
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
                        'rating'          => isset($data['rating']) ? (int) $data['rating'] : 0,
                        'num_ratings'     => isset($data['num_ratings']) ? (int) $data['num_ratings'] : 0,
                        'active_installs' => isset($data['active_installs']) ? (int) $data['active_installs'] : 0,
                    );
                }
            }
            if (!isset($info[$slug])) {
                $info[$slug] = array('rating' => 0, 'num_ratings' => 0, 'active_installs' => 0);
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
        // Atlas Plugins submenu
        if (!empty($_REQUEST['page']) && $_REQUEST['page'] === $menu_slug) {
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

        // TTS-238: AtlasVoiceSelector launcher — opens the visual content picker
        // on the front-end so admins can point at the right region.
        // Gated on opt-in: the picker only saves selectors that the new engine
        // consumes, so it has nothing to do while the legacy pipeline is active.
        $all_settings = TTA_Helper::tts_get_settings( '' );
        $extractor_opt_in = ! empty( $all_settings['settings']['tta__settings_use_atlasvoice_extractor'] );
        if ( $extractor_opt_in ) {
            $admin_bar->add_node( [
                'parent' => 'tta-audio-toggle',
                'id'     => 'tta-atlasvoice-picker',
                'title'  => esc_html__( 'Pick content area…', 'text-to-audio' ),
                'href'   => '#',
                'meta'   => [
                    'class' => 'tta-atlasvoice-picker',
                    'title' => __( 'Visually select which region AtlasVoice should read on this post type', 'text-to-audio' ),
                ],
            ] );
        }
    }

    /**
     * TTS-240: Print inline CORS detector on front-end so CDN-blocked script
     * loads get reported back to WordPress. Runs before our bundles so the
     * listener exists even if our first bundle is what CORS blocks.
     *
     * @since 2.1.16
     */
    public function print_cors_detector_script() {
        if ( is_admin() ) { return; }
        if ( ! TTA_Helper::should_load_button() ) { return; }
        if ( ! TTA_Helper::is_cdn_likely_active() ) { return; }

        $endpoint  = esc_url_raw( rest_url( 'tta/v1/cors-alert' ) );
        $site_host = wp_parse_url( home_url(), PHP_URL_HOST );
        if ( ! $site_host || ! $endpoint ) { return; }
        ?>
        <script data-cfasync="false" id="tta-cors-detector">
        (function () {
            var endpoint = <?php echo wp_json_encode( $endpoint ); ?>;
            var siteHost = <?php echo wp_json_encode( $site_host ); ?>;
            var reported = false;
            window.addEventListener('error', function (e) {
                if (reported || !e || !e.target || e.target.tagName !== 'SCRIPT') return;
                var src = e.target.src || '';
                if (!/\/plugins\/text-to-(audio|speech)/.test(src)) return;
                var host = '';
                try { host = new URL(src).host; } catch (_) { return; }
                if (!host || host === siteHost) return;
                // A script 'error' event + our plugin-path + cross-origin host is
                // already strong proof of a CORS/CDN load failure. The previous
                // HEAD verification was itself CORS-blocked (no ACAO on the CDN
                // response), which suppressed the beacon on the exact failure
                // mode we need to detect. Send directly; server re-validates and
                // rate-limits to 1 alert/hour.
                reported = true;
                var payload = JSON.stringify({ url: src });
                if (navigator.sendBeacon) {
                    var blob = new Blob([payload], { type: 'application/json' });
                    navigator.sendBeacon(endpoint, blob);
                } else {
                    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function(){});
                }
            }, true);
        })();
        </script>
        <?php
    }

    /**
     * Print inline CSS for the admin bar AtlasVoice toggle (front-end only).
     *
     * @since 2.2.0
     */
    public function admin_bar_inline_css() {
        if ( is_admin() || ! is_admin_bar_showing() || ! is_singular() || ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $settings    = TTA_Helper::tts_get_settings( 'settings' );
        $show_toggle = isset( $settings['tta__settings_show_admin_bar_toggle'] ) ? $settings['tta__settings_show_admin_bar_toggle'] : true;
        if ( ! $show_toggle ) {
            return;
        }
        ?>
        <style id="tta-admin-bar-toggle-css">
            #wp-admin-bar-tta-audio-toggle .ab-icon.dashicons {
                font-family: dashicons !important;
                font-size: 20px !important;
                line-height: 1 !important;
                position: relative;
                top: 3px;
                margin-right: 2px;
            }
            .tta-ab-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 4px;
                vertical-align: middle;
            }
            .tta-ab-indicator.tta-ab-on {
                background-color: #46b450;
            }
            .tta-ab-indicator.tta-ab-off {
                background-color: #dc3232;
            }
            #wp-admin-bar-tta-audio-toggle a.ab-item {
                cursor: pointer;
            }
        </style>
        <?php
    }

    /**
     * Print inline JS for the admin bar AtlasVoice AJAX toggle (front-end only).
     *
     * @since 2.2.0
     */
    public function admin_bar_inline_js() {
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
        ?>
        <script id="tta-admin-bar-toggle-js">
        (function(){
            var node = document.getElementById('wp-admin-bar-tta-audio-toggle');
            if (!node) return;

            var link = node.querySelector('a.ab-item');
            if (!link) return;

            link.addEventListener('click', function(e){
                e.preventDefault();

                var data = new FormData();
                data.append('action', 'tta_toggle_audio');
                data.append('post_id', <?php echo (int) $post->ID; ?>);
                data.append('_ajax_nonce', '<?php echo esc_js( wp_create_nonce( 'tta_toggle_audio_nonce' ) ); ?>');

                fetch('<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>', {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: data
                })
                .then(function(r){ return r.json(); })
                .then(function(resp){
                    if (!resp.success) return;

                    var indicator = node.querySelector('.tta-ab-indicator');
                    var textNode  = link.lastChild;

                    if (resp.data.is_active) {
                        indicator.className = 'tta-ab-indicator tta-ab-on';
                        textNode.textContent = ' <?php echo esc_js( __( 'AtlasVoice: On', 'text-to-audio' ) ); ?>';
                    } else {
                        indicator.className = 'tta-ab-indicator tta-ab-off';
                        textNode.textContent = ' <?php echo esc_js( __( 'AtlasVoice: Off', 'text-to-audio' ) ); ?>';
                    }
                });
            });

            // TTS-238: AtlasVoiceSelector launcher — start the visual picker.
            function startAtlasVoicePicker(){
                if (!window.AtlasVoiceSelector) {
                    alert('<?php echo esc_js( __( 'AtlasVoiceSelector not loaded on this page. Make sure the player is enabled for this post type.', 'text-to-audio' ) ); ?>');
                    return;
                }
                window.AtlasVoiceSelector.start({
                    postType: '<?php echo esc_js( $post->post_type ); ?>',
                    onSave: function(result){
                        if (result && result.selector) {
                            alert('<?php echo esc_js( __( 'Saved selector:', 'text-to-audio' ) ); ?> ' + result.selector);
                        }
                    }
                });
            }

            var pickerNode = document.getElementById('wp-admin-bar-tta-atlasvoice-picker');
            if (pickerNode) {
                var pickerLink = pickerNode.querySelector('a.ab-item');
                if (pickerLink) {
                    pickerLink.addEventListener('click', function(e){
                        e.preventDefault();
                        startAtlasVoicePicker();
                    });
                }
            }

            // Auto-launch when the dashboard opened this post with ?atlasvoice-picker=1.
            try {
                var qs = new URLSearchParams(window.location.search);
                if (qs.get('atlasvoice-picker') === '1') {
                    // Wait a tick so the extractor/picker bundles have finished loading.
                    setTimeout(startAtlasVoicePicker, 300);
                }
            } catch (_) { /* IE — ignore */ }
        })();
        </script>
        <?php
    }

    /**
     * Render a "Need Help?" rescue modal on the plugins.php page.
     *
     * Intercepts the deactivation click for text-to-audio and shows
     * quick-fix links before passing through to the Freemius modal.
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
                        <a href="<?php echo $docs_url; ?>" style="color:#2271b1;text-decoration:none;font-weight:500;">
                            <?php echo esc_html__( 'Quick Fix Guide', 'text-to-audio' ); ?>
                        </a>
                    </li>
                    <li style="margin-bottom:10px;font-size:14px;color:#1d2327;">
                        <?php echo esc_html__( 'Player not showing', 'text-to-audio' ); ?> &rarr;
                        <a href="<?php echo $compat_url; ?>" style="color:#2271b1;text-decoration:none;font-weight:500;">
                            <?php echo esc_html__( 'Troubleshoot', 'text-to-audio' ); ?>
                        </a>
                    </li>
                    <li style="margin-bottom:10px;font-size:14px;color:#1d2327;">
                        <?php echo esc_html__( 'Need better voices', 'text-to-audio' ); ?> &rarr;
                        <a href="<?php echo $integrations_url; ?>" style="color:#2271b1;text-decoration:none;font-weight:500;">
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
        <script>
        (function(){
            document.addEventListener('DOMContentLoaded', function(){
                var pluginRow = document.querySelector('tr[data-plugin="text-to-audio/text-to-audio.php"]');
                if (!pluginRow) return;

                var deactivateLink = pluginRow.querySelector('.deactivate a');
                if (!deactivateLink) return;

                var overlay   = document.getElementById('tta-rescue-modal-overlay');
                var continueBtn = document.getElementById('tta-rescue-continue-deactivate');
                if (!overlay || !continueBtn) return;

                var originalHref = deactivateLink.getAttribute('href');
                var rescueShown = false;

                function rescueHandler(e) {
                    if (rescueShown) return; // Already shown once, let other handlers (Freemius/AtlasAiDev) take over.
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    overlay.style.display = 'flex';
                }

                deactivateLink.addEventListener('click', rescueHandler, true);

                // Close modal when clicking the overlay background.
                overlay.addEventListener('click', function(e){
                    if (e.target === overlay) {
                        overlay.style.display = 'none';
                    }
                });

                // Close on Escape key.
                document.addEventListener('keydown', function(e){
                    if (e.key === 'Escape' && overlay.style.display === 'flex') {
                        overlay.style.display = 'none';
                    }
                });

                // "Continue to Deactivate" — hide rescue modal, re-click so Freemius/AtlasAiDev can intercept.
                continueBtn.addEventListener('click', function(){
                    overlay.style.display = 'none';
                    rescueShown = true;
                    deactivateLink.removeEventListener('click', rescueHandler, true);
                    deactivateLink.click();
                });
            });
        })();
        </script>
        <?php
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
