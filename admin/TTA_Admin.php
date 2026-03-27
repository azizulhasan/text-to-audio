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

        if (!function_exists('is_plugin_active')) {
            include ABSPATH . 'wp-admin/includes/plugin.php';
        }

        if (!function_exists('wp_is_mobile')) {
            include_once ABSPATH . 'wp-includes/vars.php';
        }

        if (!function_exists('wp_create_nonce')) {
            include_once ABSPATH . 'wp-includes/pluggable.php';
        }

        $settings = TTA_Helper::tts_get_settings();

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

        ];
    }

    public function load_script_as_tag($tag, $handle, $src)
    {
        if (!in_array($handle, ['text-to-audio-button', 'TextToSpeech', 'AtlasVoiceAnalytics'])) {
            return $tag;
        }

        $tag = '<script  type="module" src="' . esc_url($src) . '"  ></script>';

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


    public function atlasaidev_plugins($menu_slug = 'atlasvoice-other-plugins') {
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
            // Determine installed and active plugin statuses.
            $atlas_basenames = array(
                'text-to-audio' => 'text-to-audio/text-to-audio.php',
                'ar-vr-3d-model-try-on' => 'ar-vr-3d-model-try-on/ar-vr-3d-model-try-on.php',
                'ai-workflow-automation-ai-agent-hub' => 'ai-workflow-automation-ai-agent-hub/ai-workflow-automation-ai-agent-hub.php',
            );
            if (!function_exists('get_plugins')) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }
            $all_plugins = array_keys(get_plugins());
            $active_plugins = (array)get_option('active_plugins', array());

            $installed_slugs = array();
            $active_slugs = array();
            $activate_urls = array();
            foreach ($atlas_basenames as $slug => $basename) {
                if (in_array($basename, $all_plugins, true)) {
                    $installed_slugs[] = $slug;
                    // Build activate URL for installed-but-not-active plugins.
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

            wp_localize_script('atlas-plugins', 'atlasPluginsData', array(
                'current_plugin_slug' => 'text-to-audio',
                'installed_plugins' => $installed_slugs,
                'active_plugins' => $active_slugs,
                'activate_urls' => (object)$activate_urls,
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
