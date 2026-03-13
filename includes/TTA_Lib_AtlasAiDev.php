<?php

namespace TTA;


/**
 * Class TTA_Lib_AtlasAiDev
 */
final class TTA_Lib_AtlasAiDev {

    /**
     * Singleton instance
     *
     * @var TTA_Lib_AtlasAiDev
     */
    protected static $instance;

    /**
     * @var AtlasAiDev\AppService\Client
     */
    protected $client = null;

    /**
     * @var AtlasAiDev\AppService\Insights
     */
    protected $insights = null;

    /**
     * Promotions Class Instance
     *
     * @var AtlasAiDev\AppService\Promotions
     */
    public $promotion = null;

    /**
     * Initialize
     *
     * @return TTA_Lib_AtlasAiDev
     */
    public static function instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Class constructor
     *
     * @return void
     * @since 1.0.0
     */
    public function init() {
        if ( ! class_exists( '\AtlasAiDev\AppService\Client' ) ) {
            /** @noinspection PhpIncludeInspection */
            require_once TTA_LIBS_PATH . 'AtlasAiDev/Client.php';
        }
        // Load Client
        $this->client = new \AtlasAiDev\AppService\Client( 'dec06622-980f-4674-8b08-72e23cc9e70f', TEXT_TO_AUDIO_PLUGIN_NAME, TEXT_TO_AUDIO_ROOT_FILE );
        // Load
        $this->insights  = $this->client->insights(); // Plugin Insights
        $this->promotion = $this->client->promotions(); // Promo offers

        $this->promotion->set_source( 'https://gist.githubusercontent.com/azizulhasan/afcc74f398b290e586f3a4578341b699/raw/text-to-speech-pro.json' );

        // Initialize
        $this->insightInit();
        $this->promotion->init();


        // Filter updater api data
        add_filter(
            'AtlasAiDev_' . $this->client->getSlug() . '_plugin_api_info',
            array(
                $this,
                '__plugin_api_info',
            ),
            10,
            1
        );
    }

    /**
     * Exclude License data from option dropdown
     *
     * @param $exclude
     *
     * @return array
     */
    public function __exclude_license_option( $exclude ) {
        $exclude[] = 'AtlasAiDev_%_manage_license';

        return $exclude;
    }

    /**
     * Cloning is forbidden.
     *
     * @since 1.0.2
     */
    public function __clone() {
        _doing_it_wrong( __FUNCTION__, esc_html__( 'Cloning is forbidden.', TEXT_TO_AUDIO_TEXT_DOMAIN ), '1.0.2' );
    }

    /**
     * Initialize Insights
     *
     * @return void
     */
    private function insightInit() {

        $projectSlug = $this->client->getSlug();
        add_filter( $projectSlug . '_what_tracked', array( $this, 'data_we_collect' ), 10, 1 );
        add_filter(
            "AtlasAiDev_{$projectSlug}_Support_Ticket_Recipient_Email",
            function () {
                return 'contact.atlasaidev@gmail.com';
            },
            10
        );
        add_filter(
            "AtlasAiDev_{$projectSlug}_Support_Ticket_Email_Template",
            array(
                $this,
                'supportTicketTemplate',
            ),
            10
        );
        add_filter(
            "AtlasAiDev_{$projectSlug}_Support_Request_Ajax_Success_Response",
            array(
                $this,
                'supportResponse',
            ),
            10
        );
        add_filter(
            "AtlasAiDev_{$projectSlug}_Support_Request_Ajax_Error_Response",
            array(
                $this,
                'supportErrorResponse',
            ),
            10
        );
        add_filter(
            "AtlasAiDev_{$projectSlug}_Support_Page_URL",
            function () {
                return 'https://atlasaidev.com/contact-us/';
            },
            10
        );

        // Enrich tracking payload with plugin-specific usage telemetry.
        add_filter( $projectSlug . '_tracker_data', array( $this, 'get_plugin_telemetry' ), 10, 1 );

        // Provide Freemius AJAX credentials to the AtlasAiDev deactivation JS.
        add_filter(
            "AtlasAiDev_{$projectSlug}_freemius_deactivation_data",
            function () {
                if ( function_exists( 'ttsp_fs' ) ) {
                    $fs = ttsp_fs();
                    return array(
                        'action'    => $fs->get_ajax_action( 'submit_uninstall_reason' ),
                        'security'  => $fs->get_ajax_security( 'submit_uninstall_reason' ),
                        'module_id' => $fs->get_id(),
                    );
                }
                return array();
            }
        );

        $this->insights->init();
    }

    /**
     * Generate Support Ticket Email Template
     *
     * @return string
     */
    public function supportTicketTemplate() {
        /** @noinspection HtmlUnknownTarget */
        $template  = sprintf( '<div style="margin: 10px auto;"><p>Website : <a href="__WEBSITE__">__WEBSITE__</a><br>Plugin : %s (v%s)</p></div>', $this->client->getName(), $this->client->getProjectVersion() );
        $template .= '<div style="margin: 10px auto;"><hr></div>';
        $template .= '<div style="margin: 10px auto;"><h3>__SUBJECT__</h3></div>';
        $template .= '<div style="margin: 10px auto;">__MESSAGE__</div>';
        $template .= '<div style="margin: 10px auto;"><hr></div>';
        $template .= sprintf(
            '<div style="margin: 50px auto 10px auto;"><p style="font-size: 12px;color: #009688">%s</p></div>',
            'Message Processed With AtlasAiDev Service Library (v.' . $this->client->getClientVersion() . ')'
        );

        return $template;
    }

    /**
     * Generate Support Ticket Ajax Response
     *
     * @return string
     */
    public function supportResponse() {
        $response        = '';
        $response       .= sprintf( '<h3>%s</h3>', esc_html__( 'Thank you -- Support Ticket Submitted.', TEXT_TO_AUDIO_TEXT_DOMAIN ) );
        $ticketSubmitted = esc_html__( 'Your ticket has been successfully submitted.', TEXT_TO_AUDIO_TEXT_DOMAIN );
        $twenty4Hours    = sprintf( '<strong>%s</strong>', esc_html__( '24 hours', TEXT_TO_AUDIO_TEXT_DOMAIN ) );
        /* translators: %s: Approx. time to response after ticket submission. */
        $notification = sprintf( esc_html__( 'You will receive an email notification from "contact.atlasaidev@gmail.com" in your inbox within %s.', TEXT_TO_AUDIO_TEXT_DOMAIN ), $twenty4Hours );
        $followUp     = esc_html__( 'Please Follow the email and AtlasAiDev Support Team will get back with you shortly.', TEXT_TO_AUDIO_TEXT_DOMAIN );
        $response    .= sprintf( '<p>%s %s %s</p>', $ticketSubmitted, $notification, $followUp );
        $docLink      = sprintf( '<a class="button button-primary" href="https://atlasaidev.helpscoutdocs.com/" target="_blank"><span class="dashicons dashicons-media-document" aria-hidden="true"></span> %s</a>', esc_html__( 'Documentation', TEXT_TO_AUDIO_TEXT_DOMAIN ) );
        $vidLink      = sprintf( '<a class="button button-primary" href="https://www.youtube.com/@atlasaidev" target="_blank"><span class="dashicons dashicons-video-alt3" aria-hidden="true"></span> %s</a>', esc_html__( 'Video Tutorials', TEXT_TO_AUDIO_TEXT_DOMAIN ) );
        $response    .= sprintf( '<p>%s %s</p>', $docLink, $vidLink );
        $response    .= '<br><br><br>';
        $toc          = sprintf( '<a href="https://atlasaidev.com/terms-and-conditions/" target="_blank">%s</a>', esc_html__( 'Terms & Conditions', TEXT_TO_AUDIO_TEXT_DOMAIN ) );
        $pp           = sprintf( '<a href="https://atlasaidev.com/privacy-policy/" target="_blank">%s</a>', esc_html__( 'Privacy Policy', TEXT_TO_AUDIO_TEXT_DOMAIN ) );
        /* translators: 1: Link to the Trams And Condition Page, 2: Link to the Privacy Policy Page */
        $policy    = sprintf( esc_html__( 'Please read our %1$s and %2$s', TEXT_TO_AUDIO_TEXT_DOMAIN ), $toc, $pp );
        $response .= sprintf( '<p style="font-size: 12px;">%s</p>', $policy );

        return $response;
    }

    /**
     * Set Error Response Message For Support Ticket Request
     *
     * @return string
     */
    public function supportErrorResponse() {
        return sprintf(
            '<div class="mui-error"><p>%s</p><p>%s</p><br><br><p style="font-size: 12px;">%s</p></div>',
            esc_html__( 'Something Went Wrong. Please Try The Support Ticket Form On Our Website.', TEXT_TO_AUDIO_TEXT_DOMAIN ),
            sprintf( '<a class="button button-primary" href="https://atlasaidev.com/contact-us/" target="_blank">%s</a>', esc_html__( 'Get Support', TEXT_TO_AUDIO_TEXT_DOMAIN ) ),
            esc_html__( 'Support Ticket form will open in new tab in 5 seconds.', TEXT_TO_AUDIO_TEXT_DOMAIN )
        );
    }

    /**
     * Set Data Collection description for the tracker
     *
     * @param $data
     *
     * @return array
     */
    public function data_we_collect( $data ) {
        $data = array_merge(
            $data,
            array(
                esc_html__( 'Site name, language and url.', TEXT_TO_AUDIO_TEXT_DOMAIN ),
                esc_html__( 'Number of active and inactive plugins.', TEXT_TO_AUDIO_TEXT_DOMAIN ),
                esc_html__( 'Your name and email address.', TEXT_TO_AUDIO_TEXT_DOMAIN ),
                esc_html__( 'Which text-to-speech engine and voice settings are selected.', TEXT_TO_AUDIO_TEXT_DOMAIN ),
                esc_html__( 'Feature usage flags (analytics, aliases, download, CSS selectors — no content data).', TEXT_TO_AUDIO_TEXT_DOMAIN ),
            )
        );

        return $data;
    }

    /**
     * Enrich tracking payload with plugin-specific usage telemetry.
     *
     * All fields are opt-in (user must allow tracking) and contain no personal
     * or content data — only anonymized counts, boolean flags, and setting values.
     *
     * @param array $data Existing tracking data from AtlasAiDev Insights.
     *
     * @return array
     */
    public function get_plugin_telemetry( $data ) {
        $settings   = (array) get_option( 'tta_settings_data', array() );
        $customize  = (array) get_option( 'tta_customize_settings', array() );
        $listening  = (array) get_option( 'tta_listening_settings', array() );
        $analytics  = (array) get_option( 'tta_analytics_settings', array() );
        $aliases    = (array) get_option( 'tts_text_aliases', array() );
        $btn        = isset( $customize['buttonSettings'] ) ? (array) $customize['buttonSettings'] : array();

        /*
         * ─── Group 1: Core Engagement ────────────────────────────────────
         * "Is the plugin actually working for users?"
         *
         * Business benefit: Identifies silent failures (installed but never
         * used) and measures real adoption depth. If av_has_audio_plays is
         * false for most sites, the onboarding or default config is broken.
         */
        $player_id = 1; // Default free browser TTS.
        if ( function_exists( 'get_player_id' ) ) {
            $player_id = get_player_id();
        }

        // Which TTS engine is active (1=free default, 2=Pro Browser, 3=GTTS,
        // 4=Google Cloud, 5=OpenAI, 6=ElevenLabs). Reveals provider popularity.
        $data['av_player_id'] = (int) $player_id;

        // Whether any listening event has been recorded. Detects "installed but
        // never used" — the most important signal for onboarding improvements.
        $data['av_has_audio_plays'] = ! empty( $analytics['tts_enable_analytics'] );

        // Count of post types where the button is enabled. Measures content coverage.
        $post_types = isset( $settings['tta__settings_allow_listening_for_post_types'] )
            ? (array) $settings['tta__settings_allow_listening_for_post_types']
            : array();
        $data['av_total_posts_with_btn'] = count( $post_types );

        // Whether the analytics dashboard is turned on. Measures analytics feature adoption.
        $data['av_analytics_enabled'] = ! empty( $analytics['tts_enable_analytics'] );

        /*
         * ─── Group 2: Feature Adoption ───────────────────────────────────
         * "Which features matter?"
         *
         * Business benefit: Drives roadmap prioritization. If 80% of sites
         * use aliases, invest in a better alias UI. If nobody uses CSS
         * selectors, don't spend time improving that feature.
         */

        // Comma-separated list of enabled post types (e.g. "post,page,product").
        // Shows which content types use TTS — helps target documentation and demos.
        $data['av_enabled_post_types'] = implode( ',', $post_types );

        // Button placement preference. Reveals whether users prefer above or below content.
        $data['av_button_position'] = isset( $btn['button_position'] ) ? $btn['button_position'] : 'after_content';

        // Whether text aliases (pronunciation corrections) are configured.
        // Measures how many users need custom pronunciation — drives alias UX investment.
        $data['av_has_aliases'] = ! empty( $aliases );

        // Whether custom CSS selectors are set for content targeting.
        // Measures advanced usage — high adoption means the default content
        // detection needs improvement.
        $data['av_uses_css_selectors'] = ! empty( $settings['tta__settings_css_selectors'] );

        // Whether any exclude rules are set (excluded posts, categories, or tags).
        // High adoption means users need granular control over where TTS appears.
        $has_excluded_posts = ! empty( $settings['tta__settings_exclude_post_ids'] );
        $has_excluded_cats  = ! empty( $settings['tta__settings_exclude_categories'] );
        $has_excluded_tags  = ! empty( $settings['tta__settings_exclude_wp_tags'] );
        $data['av_uses_exclude_rules'] = $has_excluded_posts || $has_excluded_cats || $has_excluded_tags;

        // "Read content from DOM" setting. When true, content is parsed client-side
        // instead of server-side. Affects compatibility with page builders.
        $data['av_reads_from_dom'] = ! empty( $settings['tta__settings_read_content_from_dom'] );

        // "Add post title to read" setting. Measures whether users want the title
        // included in audio playback.
        $data['av_includes_title'] = ! empty( $settings['tta__settings_add_post_title_to_read'] );

        // Whether MP3 download is allowed for visitors. Measures demand for
        // downloadable audio — influences Pro upsell and feature gating.
        $download_roles = isset( $btn['who_can_download_mp3_file'] ) ? (array) $btn['who_can_download_mp3_file'] : array();
        $data['av_download_enabled'] = ! empty( $download_roles );

        // Whether custom CSS is added to the button. High adoption means
        // the default button design doesn't meet user needs.
        $data['av_has_custom_css'] = ! empty( $customize['custom_css'] );

        // Whether the onboarding setup wizard was completed. Low completion
        // rate signals the wizard is too long or confusing.
        $data['av_onboarding_completed'] = (bool) get_option( 'tta_onboarding_completed', false );

        return $data;
    }

    /**
     * Get Tracker Data Collection Description Array
     *
     * @return array
     */
    public function get_data_collection_description() {
        return $this->insights->get_data_collection_description();
    }

    /**
     * Add Missing Info for plugin details after fetching through api
     *
     * @param $data
     *
     * @return array
     */
    public function __plugin_api_info( $data ) {
        // house keeping
        if ( isset( $data['homepage'], $data['author'] ) && false === strpos( $data['author'], '<a' ) ) {
            /** @noinspection HtmlUnknownTarget */
            $data['author'] = sprintf( '<a href="%s">%s</a>', $data['homepage'], $data['author'] );
        }
        if ( ! isset( $data['contributors'] ) ) {
            $data['contributors'] = array(
                'hasanazizul' => array(
                    'profile'      => 'https://atlasaidev.com/',
                    'avatar'       => 'https://en.gravatar.com/userimage/227637086/c835cfe932588050eec49c4e0d0e017b.jpeg',
                    'display_name' => 'Azizul Hasan',
                ),
            );
        }
        $sections = array( 'description', 'installation', 'faq', 'screenshots', 'changelog', 'reviews', 'other_notes' );
        foreach ( $sections as $section ) {
            if ( isset( $data['sections'][ $section ] ) && empty( $data['sections'][ $section ] ) ) {
                unset( $data['sections'][ $section ] );
            }
        }

        return $data;
    }

    /**
     * Update Tracker OptIn
     *
     * @param bool $override optional. ignore last send datetime settings if true.
     *
     * @see Insights::send_tracking_data()
     * @return void
     */
    public function trackerOptIn( $override = false ) {
        $this->insights->optIn( $override );
    }

    /**
     * Update Tracker OptOut
     *
     * @return void
     */
    public function trackerOptOut() {
        $this->insights->optOut();
    }

    /**
     * Check if tracking is enable
     *
     * @return bool
     */
    public function is_tracking_allowed() {
        return $this->insights->is_tracking_allowed();
    }

}

