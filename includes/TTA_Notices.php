<?php

namespace TTA;

/**
 * Data-Driven Admin Notice System
 *
 * Reusable admin notice system with per-user dismissal, timed re-show,
 * version-based resets, and backward compatibility with legacy meta keys.
 *
 * @since      2.2.0
 * @package    TTA
 * @subpackage TTA/includes
 */

defined( 'ABSPATH' ) || exit;

class TTA_Notices {

	/**
	 * Singleton instance.
	 *
	 * @var TTA_Notices
	 */
	private static $instance = null;

	/**
	 * Registered notices.
	 *
	 * @var array
	 */
	private $notices = array();

	/**
	 * Get singleton instance.
	 *
	 * @return TTA_Notices
	 */
	public static function instance() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor — hooks and register all notices.
	 */
	private function __construct() {
		add_action( 'admin_notices', array( $this, 'display_notices' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_ajax_tta_dismiss_notice', array( $this, 'ajax_dismiss_notice' ) );
		add_action( 'wp_ajax_tta_dismiss_milestone', array( $this, 'ajax_dismiss_milestone' ) );
		add_action( 'wp_ajax_tta_track_notice_action', array( $this, 'ajax_track_notice_action' ) );

		// Backward compat: keep old AJAX action name working.
		add_action( 'wp_ajax_tta_hide_notice', array( $this, 'ajax_dismiss_notice_legacy' ) );
		add_action( 'wp_ajax_tta_download_translations', array( $this, 'ajax_download_translations' ) );

		$this->register_notices();
	}

	/**
	 * Enqueue notice scripts.
	 */
	public function enqueue_scripts() {
		if ( empty( $this->notices ) ) {
			return;
		}

		wp_enqueue_script(
			'tta-admin-notice',
			TTA_PLUGIN_URL . 'admin/js/tta-admin-notice.js',
			array( 'jquery' ),
			TEXT_TO_AUDIO_VERSION,
			true
		);

		wp_localize_script(
			'tta-admin-notice',
			'ttaNoticeData',
			array(
				'ajaxurl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'tta_notice_nonce' ),
				'isRtl'   => function_exists( 'tta_is_rtl' ) && tta_is_rtl() ? '1' : '0',
			)
		);
	}

	// =========================================================================
	// Registration
	// =========================================================================

	/**
	 * Get all registered notices.
	 *
	 * @return array
	 */
	public function get_notices() {
		return $this->notices;
	}

	/**
	 * Register a new notice.
	 *
	 * @param array $args Notice configuration.
	 * @return bool
	 */
	public function register_notice( $args ) {
		$defaults = array(
			'id'                    => '',
			'title'                 => '',
			'message'               => '',
			'type'                  => 'info',
			'icon'                  => '',
			'dismissible'           => true,
			'show_once'             => false,
			'reshow_after_days'     => 0,
			'condition'             => null,
			'screens'               => array(),
			'buttons'               => array(),
			'footer_text'           => '',
			'track_clicks'          => false,
			'max_clicks'            => 0,
			'click_action'          => null,
			'message_callback'      => null,
			'auto_dismiss_condition' => null,
			'render_callback'       => null,
			'legacy_dismiss_meta'   => '',
			'legacy_option_key'     => '',
			'version'               => '',
			'version_option'        => '',
		);

		$notice = wp_parse_args( $args, $defaults );

		if ( empty( $notice['id'] ) ) {
			return false;
		}

		$this->notices[ $notice['id'] ] = $notice;
		return true;
	}

	/**
	 * Register all plugin notices.
	 */
	private function register_notices() {

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		// ── 1. Browser Support (render_callback — client-side JS check) ──
		$this->register_notice( array(
			'id'              => 'browser_support',
			'title'           => '',
			'dismissible'     => false,
			'render_callback' => array( $this, 'render_browser_support' ),
		) );

		// ── 2. Onboarding (auto_dismiss_condition) ──
		$this->register_notice( array(
			'id'                    => 'onboarding',
			'title'                 => '🔊 ' . __( 'AtlasVoice is Active — Let\'s Set It Up!', 'text-to-audio' ),
			'message'               => __( 'Your text-to-speech player is ready. Choose which posts to add audio to, pick a voice, and customize the player style. Takes under 2 minutes.', 'text-to-audio' ),
			'type'                  => 'info',
			'dismissible'           => true,
			'condition'             => function() {
				return current_user_can( 'manage_options' );
			},
			'auto_dismiss_condition' => array( $this, 'check_onboarding_auto_dismiss' ),
			'buttons'               => array(
				array(
					'text' => __( 'Configure Now', 'text-to-audio' ),
					'url'  => admin_url( 'admin.php?page=text-to-audio' ),
					'type' => 'primary',
				),
				array(
					'text'    => __( 'View Docs', 'text-to-audio' ),
					'url'     => 'https://atlasaidev.com/docs/',
					'type'    => 'secondary',
					'new_tab' => true,
				),
			),
			'legacy_dismiss_meta' => 'tta_onboarding_notice_dismissed',
		) );

		// ── 3. Translation Request ──
		$this->register_notice( array(
			'id'                  => 'translation',
			'title'               => sprintf( '<h3>%s</h3>', sprintf( '<b>%s</b>', esc_html__( 'AtlasVoice', 'text-to-audio' ) ) ),
			'message_callback'    => array( $this, 'get_translation_message' ),
			'type'                => 'info',
			'dismissible'         => true,
			'reshow_after_days'   => 30,
			'buttons'             => array(
				array(
					'text'    => __( 'Translate Here', 'text-to-audio' ),
					'url'     => 'https://translate.wordpress.org/projects/wp-plugins/text-to-audio/',
					'type'    => 'primary',
					'new_tab' => true,
				),
			),
			'legacy_dismiss_meta' => 'tta_translation_notice_dismissed',
			'legacy_option_key'   => 'tta_translation_notice_next_show_time',
			'version'             => 'dec_26',
			'version_option'      => 'tts_is_displayed_force_notice_december_26',
		) );

		// ── 4. Voice & Language Mismatch (free only) ──
		$this->register_notice( array(
			'id'                  => 'voice_language_mismatch',
			'title'               => '<h3>' . esc_html__( 'AtlasVoice: Voice & Language Compatibility', 'text-to-audio' ) . '</h3>',
			'message'             => '<p>' . esc_html__( 'The free version uses the browser\'s built-in speechSynthesis API. Voice and language support varies by browser and device, so some combinations may not work as expected. The Pro version uses server-side audio generation for consistent results across all browsers.', 'text-to-audio' ) . '</p><p><a href="https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis#browser_compatibility" target="_blank">' . esc_html__( 'Check browser compatibility', 'text-to-audio' ) . ' &rarr;</a></p>',
			'type'                => 'info',
			'dismissible'         => true,
			'reshow_after_days'   => 90,
			'condition'           => function() {
				return ! is_pro_active();
			},
			'buttons'             => array(
				array(
					'text'    => __( 'Learn About Pro', 'text-to-audio' ),
					'url'     => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
					'type'    => 'secondary',
					'new_tab' => true,
				),
			),
			'legacy_dismiss_meta' => 'tts_plugin_voice_and_language_mismatch_dismissed',
			'legacy_option_key'   => 'tts_plugin_voice_and_language_mismatch_next_show_time',
		) );

		// ── 5. Pro Features (free only, random features) ──
		$this->register_notice( array(
			'id'                  => 'features',
			'title'               => sprintf( '<h3>%s ' . esc_html__( 'Features', 'text-to-audio' ) . '</h3>', sprintf( '<b>%s</b>', esc_html__( 'AtlasVoice Pro', 'text-to-audio' ) ) ),
			'message_callback'    => array( $this, 'get_features_message' ),
			'type'                => 'info',
			'dismissible'         => true,
			'reshow_after_days'   => 90,
			'condition'           => function() {
				return ! is_pro_active();
			},
			'buttons'             => array(
				array(
					'text'    => __( 'View Pro Features', 'text-to-audio' ),
					'url'     => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
					'type'    => 'secondary',
					'new_tab' => true,
				),
			),
			'legacy_dismiss_meta' => 'tts_plugin_features_notice_dismissed',
			'legacy_option_key'   => 'tts_plugin_features_notice_next_show_time',
			'version'             => '2',
			'version_option'      => 'plugin_features_notice_2',
		) );

		// ── 6. Promotion / Sale (commented out — uncomment to activate) ──
		// $this->register_notice( array(
		// 	'id'                  => 'promotion',
		// 	'title'               => '',
		// 	'dismissible'         => true,
		// 	'condition'           => function() {
		// 		return ! is_pro_active();
		// 	},
		// 	'render_callback'     => array( $this, 'render_promotion_notice' ),
		// 	'legacy_dismiss_meta' => 'tta_promotion_new_year_26_notice_dismissed',
		// ) );

		// ── 7. AR/VR Plugin Cross-Promo (commented out) ──
		// $this->register_notice( array(
		// 	'id'                  => 'ar_vr_plugin',
		// 	'title'               => '<h1 style="color:red">' . esc_html__( 'Introducing 3D Model Viewer & AR for WordPress — Free & Powerful!', 'text-to-audio' ) . '</h1>',
		// 	'message'             => esc_html__( 'New from AtlasAiDev! Supercharge your WooCommerce store with our free AR/VR Plugin — let customers try products in real-world spaces using 3D & Augmented Reality, no app needed!', 'text-to-audio' ),
		// 	'type'                => 'info',
		// 	'icon'                => '🚀',
		// 	'dismissible'         => true,
		// 	'reshow_after_days'   => 30,
		// 	'buttons'             => array(
		// 		array(
		// 			'text'    => __( 'Install 3D Model Viewer', 'text-to-audio' ),
		// 			'url'     => admin_url( 'plugin-install.php?tab=plugin-information&plugin=ar-vr-3d-model-try-on&TB_iframe=true&width=772&height=500' ),
		// 			'type'    => 'primary',
		// 		),
		// 		array(
		// 			'text'    => __( 'Try It Now', 'text-to-audio' ),
		// 			'url'     => 'https://wordpress.org/plugins/ar-vr-3d-model-try-on/?preview=1',
		// 			'type'    => 'primary',
		// 			'new_tab' => true,
		// 		),
		// 		array(
		// 			'text'    => __( 'Real World Demo', 'text-to-audio' ),
		// 			'url'     => 'https://wpaugmentedreality.com/shop/',
		// 			'type'    => 'primary',
		// 			'new_tab' => true,
		// 		),
		// 		array(
		// 			'text'    => __( 'How To Use', 'text-to-audio' ),
		// 			'url'     => 'https://wordpress.org/plugins/ar-vr-3d-model-try-on/',
		// 			'type'    => 'primary',
		// 			'new_tab' => true,
		// 		),
		// 	),
		// 	'legacy_dismiss_meta' => 'tta_ar_vr_plugin_notice_dismissed',
		// 	'legacy_option_key'   => 'tta_ar_vr_plugin_notice_next_show_time',
		// 	'version'             => '1',
		// 	'version_option'      => 'tts_is_displayed_ar_vr_plugin_notice',
		// ) );

		// ── 8. Plugin Compatible (commented out) ──
		// $this->register_notice( array(
		// 	'id'                  => 'compatible',
		// 	'title'               => sprintf( '<h3>%s</h3>', sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS', 'text-to-audio' ) ) ),
		// 	'message'             => sprintf(
		// 		esc_html__( '%1$s plugin is compatible with %2$s.', 'text-to-audio' ),
		// 		sprintf( '<b>%s</b>', esc_html__( 'WPML Multilingual CMS, GTranslate, TranslatePress', 'text-to-audio' ) ),
		// 		sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS Pro', 'text-to-audio' ) )
		// 	) . ' <a href="https://atlasaidev.com/plugins/text-to-speech-pro/" target="_blank" style="color:blue">' . esc_html__( 'Learn more', 'text-to-audio' ) . '</a>',
		// 	'type'                => 'info',
		// 	'dismissible'         => true,
		// 	'reshow_after_days'   => 30,
		// 	'condition'           => function() {
		// 		return ! is_pro_active();
		// 	},
		// 	'buttons'             => array(
		// 		array(
		// 			'text'    => __( 'Buy Now', 'text-to-audio' ),
		// 			'url'     => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
		// 			'type'    => 'primary',
		// 			'new_tab' => true,
		// 		),
		// 	),
		// 	'legacy_dismiss_meta' => 'tts_plugin_compatible_notice_dismissed',
		// 	'legacy_option_key'   => 'tts_plugin_compatible_notice_next_show_time',
		// 	'version'             => 'aug_25',
		// 	'version_option'      => 'wpml_and_gtranslate_notice_displayed_aug_25',
		// ) );

		// ── 9. Smart Review Prompt ──
		// Backfill activation timestamp for existing users.
		if ( ! get_option( 'tta_activated_at' ) && get_option( 'tta_has_been_activated_before', false ) ) {
			update_option( 'tta_activated_at', time() - ( DAY_IN_SECONDS * 30 ), false );
		}

		$total_plays    = $this->get_cached_total_plays();
		$activated_at   = (int) get_option( 'tta_activated_at', 0 );
		$days_active    = $activated_at ? ( time() - $activated_at ) / DAY_IN_SECONDS : 0;
		$wizard_done    = (bool) get_option( 'tta_onboarding_completed', false );

		// Build dynamic message with play count.
		$review_message = sprintf(
			/* translators: %1$s: emoji, %2$s: play count, %3$s: plugin name */
			__( '%1$s Your audio player has reached %2$s plays! If you\'re enjoying %3$s, would you consider leaving a quick review? It really helps us improve and reach more users.', 'text-to-audio' ),
			'<span style="font-size: 16px;">🎉</span>',
			'<strong>' . number_format_i18n( $total_plays ) . '</strong>',
			'<strong>' . esc_html__( 'AtlasVoice', 'text-to-audio' ) . '</strong>'
		);

		$this->register_notice( array(
			'id'                  => 'review',
			'title'               => sprintf( '<h3>%s</h3>', esc_html__( 'AtlasVoice — Your Listeners Love It!', 'text-to-audio' ) ),
			'message'             => $review_message,
			'type'                => 'info',
			'dismissible'         => true,
			'reshow_after_days'   => 30,
			'condition'           => function() use ( $total_plays, $days_active, $wizard_done ) {
				// 1. Must be an admin.
				if ( ! current_user_can( 'manage_options' ) ) {
					return false;
				}
				// 2. Never show to Pro users.
				if ( TTA_Helper::is_pro_active() ) {
					return false;
				}
				// 3. Must be active for at least 7 days.
				if ( $days_active < 7 ) {
					return false;
				}
				// 4. Wizard completed OR active for 14+ days (existing users).
				if ( ! $wizard_done && $days_active < 14 ) {
					return false;
				}
				// 5. Must have at least 100 plays.
				if ( $total_plays < 100 ) {
					return false;
				}
				return true;
			},
			'buttons'             => array(
				array(
					'text'   => __( '⭐ Leave a Review', 'text-to-audio' ),
					'type'   => 'primary',
					'action' => 'given',
					'track'  => true,
				),
				array(
					'text'   => __( 'Remind Me Later', 'text-to-audio' ),
					'type'   => 'secondary',
					'action' => 'later',
					'track'  => true,
				),
				array(
					'text'   => __( 'Already Done!', 'text-to-audio' ),
					'type'   => 'secondary',
					'action' => 'done',
					'track'  => true,
				),
				array(
					'text'   => __( 'Never Ask Again', 'text-to-audio' ),
					'type'   => 'secondary',
					'action' => 'never',
					'track'  => true,
				),
			),
			'click_action'        => array( $this, 'handle_review_action' ),
			'legacy_dismiss_meta' => 'tta_review_notice_dismissed',
			'legacy_option_key'   => 'tta_review_notice_next_show_time',
		) );

		// ── 10. Feedback (commented out) ──
		// $this->register_notice( array(
		// 	'id'                  => 'feedback',
		// 	'title'               => sprintf( '<h3>%s</h3>', sprintf( '<b>%s</b>', esc_html__( 'Asking Feedback For Text To Speech TTS', 'text-to-audio' ) ) ),
		// 	'message'             => sprintf(
		// 		esc_html__( '%1$s We are looking for your feedback to improve the product, and we would really appreciate it if you drop us a quick feedback. Your opinion matters a lot to us. It helps us to get better. Thanks for using Text To Speech.', 'text-to-audio' ),
		// 		'<span style="font-size: 16px;">&#128516;</span>'
		// 	),
		// 	'type'                => 'info',
		// 	'dismissible'         => true,
		// 	'reshow_after_days'   => 30,
		// 	'buttons'             => array(
		// 		array(
		// 			'text'   => __( 'Give Feedback Now', 'text-to-audio' ),
		// 			'type'   => 'primary',
		// 			'action' => 'given',
		// 			'track'  => true,
		// 		),
		// 		array(
		// 			'text'   => __( 'Remind Me Later', 'text-to-audio' ),
		// 			'type'   => 'secondary',
		// 			'action' => 'later',
		// 			'track'  => true,
		// 		),
		// 		array(
		// 			'text'   => __( 'Already Done!', 'text-to-audio' ),
		// 			'type'   => 'secondary',
		// 			'action' => 'done',
		// 			'track'  => true,
		// 		),
		// 		array(
		// 			'text'   => __( 'Never Ask Again', 'text-to-audio' ),
		// 			'type'   => 'secondary',
		// 			'action' => 'never',
		// 			'track'  => true,
		// 		),
		// 	),
		// 	'click_action'        => array( $this, 'handle_feedback_action' ),
		// 	'legacy_dismiss_meta' => 'tta_feedback_notice_dismissed',
		// 	'legacy_option_key'   => 'tta_feedback_notice_next_show_time',
		// ) );

		// ── 11. Setup Support (commented out) ──
		// $this->register_notice( array(
		// 	'id'                  => 'setup',
		// 	'title'               => '<h1><strong>' . esc_html__( 'Text To Speech TTS Plugin Support', 'text-to-audio' ) . '</strong></h1>',
		// 	'message'             => esc_html__( 'Do you need support for setup of Text To Speech TTS plugin? We will give you support as soon as possible.', 'text-to-audio' ),
		// 	'type'                => 'info',
		// 	'dismissible'         => true,
		// 	'reshow_after_days'   => 30,
		// 	'buttons'             => array(
		// 		array(
		// 			'text'    => __( 'Get Support', 'text-to-audio' ),
		// 			'url'     => 'https://atlasaidev.com/contact-us/',
		// 			'type'    => 'primary',
		// 			'new_tab' => true,
		// 		),
		// 	),
		// 	'legacy_dismiss_meta' => 'tts_setup_notice_dismissed',
		// 	'legacy_option_key'   => 'tts_setup_notice_next_show_time',
		// ) );

		// ── 12. Analytics Features (commented out) ──
		// $this->register_notice( array(
		// 	'id'                  => 'analytics',
		// 	'title'               => '<h3>' . esc_html__( 'Enhance Your Content with Text To Speech: Now Featuring Detailed Post Analytics!', 'text-to-audio' ) . '</h3>',
		// 	'message_callback'    => array( $this, 'get_analytics_message' ),
		// 	'type'                => 'info',
		// 	'dismissible'         => true,
		// 	'reshow_after_days'   => 30,
		// 	'condition'           => function() {
		// 		return ! is_pro_active();
		// 	},
		// 	'buttons'             => array(
		// 		array(
		// 			'text'    => __( 'Unlock The Premium Features', 'text-to-audio' ),
		// 			'url'     => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
		// 			'type'    => 'primary',
		// 			'new_tab' => true,
		// 		),
		// 	),
		// 	'legacy_dismiss_meta' => 'tts_plugin_analytics_notice_dismissed',
		// 	'legacy_option_key'   => 'tts_plugin_analytics_notice_next_show_time',
		// ) );

		// ── 13. Usage Milestone Celebrations ──
		$this->register_milestone_notices();

		// ── 14. Translation Download ──
		$this->register_translation_download_notice();
	}

	// =========================================================================
	// Display Pipeline
	// =========================================================================

	/**
	 * Display all active notices.
	 */
	public function display_notices() {
		foreach ( $this->notices as $notice_id => $notice ) {
			$this->display_notice( $notice_id, $notice );
		}
	}

	/**
	 * Display a single notice through the full pipeline.
	 *
	 * @param string $notice_id Notice ID.
	 * @param array  $notice    Notice configuration.
	 */
	private function display_notice( $notice_id, $notice ) {

		// 1. Condition check.
		if ( is_callable( $notice['condition'] ) && ! call_user_func( $notice['condition'] ) ) {
			return;
		}

		// 2. Auto-dismiss condition.
		if ( is_callable( $notice['auto_dismiss_condition'] ) && call_user_func( $notice['auto_dismiss_condition'] ) ) {
			$user_id = get_current_user_id();
			update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );
			// Also write legacy key for consistency.
			if ( ! empty( $notice['legacy_dismiss_meta'] ) ) {
				update_user_meta( $user_id, $notice['legacy_dismiss_meta'], true );
			}
			return;
		}

		// 3. Screen check.
		if ( ! empty( $notice['screens'] ) && ! $this->is_current_screen( $notice['screens'] ) ) {
			return;
		}

		// 4. Version reset check.
		if ( ! empty( $notice['version'] ) && ! empty( $notice['version_option'] ) ) {
			$stored_version = get_option( $notice['version_option'], '' );
			if ( $stored_version !== $notice['version'] && ! empty( $stored_version ) ) {
				// Version changed — reset dismiss state for all users of this notice.
				$user_id = get_current_user_id();
				delete_user_meta( $user_id, 'tta_dismiss_' . $notice_id );
				if ( ! empty( $notice['legacy_dismiss_meta'] ) ) {
					delete_user_meta( $user_id, $notice['legacy_dismiss_meta'] );
				}
				if ( ! empty( $notice['legacy_option_key'] ) ) {
					delete_option( $notice['legacy_option_key'] );
				}
			}
			// Ensure version flag is set.
			if ( empty( $stored_version ) || $stored_version !== $notice['version'] ) {
				update_option( $notice['version_option'], $notice['version'], false );
			}
		}

		// 5. Dismissed check.
		if ( $notice['dismissible'] && $this->is_dismissed( $notice_id, $notice ) ) {
			return;
		}

		// 6. Show-once check.
		if ( $notice['show_once'] ) {
			$user_id = get_current_user_id();
			$shown   = get_user_meta( $user_id, 'tta_shown_' . $notice_id, true );
			if ( $shown ) {
				return;
			}
			update_user_meta( $user_id, 'tta_shown_' . $notice_id, true );
		}

		// 7. Click tracking limit check.
		$total_clicks = 0;
		$user_clicked = false;
		if ( $notice['track_clicks'] ) {
			$total_clicks = (int) get_option( 'tta_clicks_' . $notice_id, 0 );
			$user_clicked = get_user_meta( get_current_user_id(), 'tta_clicked_' . $notice_id, true );

			if ( $notice['max_clicks'] > 0 && $total_clicks >= $notice['max_clicks'] ) {
				return;
			}
		}

		// 8. Dynamic message via callback.
		if ( is_callable( $notice['message_callback'] ) ) {
			$notice['message'] = call_user_func( $notice['message_callback'] );
		}

		// 9. Render — custom or standard.
		if ( is_callable( $notice['render_callback'] ) ) {
			call_user_func( $notice['render_callback'], $notice_id, $notice );
		} else {
			$this->render_notice( $notice_id, $notice, $total_clicks, $user_clicked );
		}
	}

	// =========================================================================
	// Rendering
	// =========================================================================

	/**
	 * Render a standard notice HTML.
	 *
	 * @param string $notice_id    Notice ID.
	 * @param array  $notice       Notice configuration.
	 * @param int    $total_clicks Total clicks count.
	 * @param bool   $user_clicked Whether current user already clicked.
	 */
	private function render_notice( $notice_id, $notice, $total_clicks = 0, $user_clicked = false ) {

		$type_colors = array(
			'info'    => '#2563EB',
			'success' => '#00a32a',
			'warning' => '#ffc107',
			'error'   => '#dc3545',
		);

		$border_color      = isset( $type_colors[ $notice['type'] ] ) ? $type_colors[ $notice['type'] ] : $type_colors['info'];
		$dismissible_class = $notice['dismissible'] ? 'is-dismissible' : '';
		$rtl_dir           = function_exists( 'tta_is_rtl' ) && tta_is_rtl() ? 'ltr' : 'auto';

		?>
		<div class="notice notice-<?php echo esc_attr( $notice['type'] ); ?> <?php echo esc_attr( $dismissible_class ); ?> tta-admin-notice"
		     data-notice-id="<?php echo esc_attr( $notice_id ); ?>"
		     dir="<?php echo esc_attr( $rtl_dir ); ?>"
		     style="position: relative; border-left-color: <?php echo esc_attr( $border_color ); ?>; padding: 20px;">

			<?php if ( $notice['dismissible'] ) : ?>
			<button type="button" class="notice-dismiss tta-notice-dismiss" data-notice-id="<?php echo esc_attr( $notice_id ); ?>">
				<span class="screen-reader-text"><?php esc_html_e( 'Dismiss this notice.', 'text-to-audio' ); ?></span>
			</button>
			<?php endif; ?>

			<div style="display: flex; align-items: center; gap: 20px;">
				<?php if ( ! empty( $notice['icon'] ) ) : ?>
				<div style="flex-shrink: 0;">
					<span style="font-size: 48px;"><?php echo esc_html( $notice['icon'] ); ?></span>
				</div>
				<?php endif; ?>

				<div style="flex-grow: 1;">
					<?php if ( ! empty( $notice['title'] ) ) : ?>
					<div style="margin: 0 0 10px 0;">
						<?php echo wp_kses_post( $notice['title'] ); ?>
					</div>
					<?php endif; ?>

					<?php if ( ! empty( $notice['message'] ) ) : ?>
					<div style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
						<div class="tta-review-notice-logo"></div>
						<?php echo wp_kses_post( $notice['message'] ); ?>
					</div>
					<?php endif; ?>

					<?php if ( $user_clicked ) : ?>
					<div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; padding: 10px 15px; margin-bottom: 10px;">
						<strong style="color: #0c5460;"><?php esc_html_e( 'You have already responded to this notice.', 'text-to-audio' ); ?></strong>
					</div>
					<?php endif; ?>

					<?php if ( ! empty( $notice['buttons'] ) ) : ?>
					<div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
						<?php foreach ( $notice['buttons'] as $button ) : ?>
							<?php echo $this->render_button( $notice_id, $button, $border_color ); // phpcs:ignore ?>
						<?php endforeach; ?>
					</div>
					<?php endif; ?>

					<?php if ( ! empty( $notice['footer_text'] ) ) : ?>
					<p style="margin: 12px 0 0 0; font-size: 12px; color: #666; line-height: 1.5;">
						<?php echo wp_kses_post( $notice['footer_text'] ); ?>
					</p>
					<?php endif; ?>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Render a single button.
	 *
	 * @param string $notice_id    Notice ID.
	 * @param array  $button       Button configuration.
	 * @param string $border_color The notice border color.
	 * @return string Button HTML.
	 */
	private function render_button( $notice_id, $button, $border_color ) {
		$btn_defaults = array(
			'text'             => __( 'Click Here', 'text-to-audio' ),
			'url'              => '#',
			'type'             => 'primary',
			'icon'             => '',
			'action'           => '',
			'track'            => false,
			'new_tab'          => false,
			'dismiss_on_click' => false,
		);

		$btn = wp_parse_args( $button, $btn_defaults );

		$btn_class = $btn['type'] === 'primary' ? 'button-primary' : 'button-secondary';
		$btn_style = $btn['type'] === 'primary'
			? 'background: ' . esc_attr( $border_color ) . '; border-color: ' . esc_attr( $border_color ) . '; padding: 8px 20px; height: auto; font-size: 14px;'
			: 'padding: 8px 20px; height: auto; font-size: 14px;';

		$data_attrs = '';
		$css_class  = 'button ' . esc_attr( $btn_class );

		if ( ! empty( $btn['action'] ) ) {
			// AJAX action button.
			$css_class  .= ' tta-notice-action-btn';
			$data_attrs .= ' data-action="' . esc_attr( $btn['action'] ) . '"';
			if ( $btn['track'] ) {
				$data_attrs .= ' data-track="true"';
			}
		} elseif ( $btn['url'] && $btn['url'] !== '#' ) {
			// URL button.
			$css_class .= ' tta-notice-url-btn';
			if ( $btn['dismiss_on_click'] ) {
				$data_attrs .= ' data-dismiss-on-click="true"';
			}
			if ( $btn['new_tab'] ) {
				$data_attrs .= ' data-new-tab="true"';
			}
		}

		ob_start();
		?>
		<a href="<?php echo esc_url( $btn['url'] ); ?>"
		   class="<?php echo esc_attr( $css_class ); ?>"
		   data-notice-id="<?php echo esc_attr( $notice_id ); ?>"
		   <?php echo $data_attrs; // phpcs:ignore ?>
		   style="<?php echo esc_attr( $btn_style ); ?>"
		   <?php echo ( ! empty( $btn['action'] ) || ! $btn['new_tab'] ) ? '' : 'target="_blank"'; ?>>
			<?php if ( ! empty( $btn['icon'] ) ) : ?>
			<span class="dashicons dashicons-<?php echo esc_attr( $btn['icon'] ); ?>" style="margin-top: 3px;"></span>
			<?php endif; ?>
			<?php echo esc_html( $btn['text'] ); ?>
		</a>
		<?php
		return ob_get_clean();
	}

	// =========================================================================
	// Dismissal Logic
	// =========================================================================

	/**
	 * Check if a notice is dismissed for the current user.
	 *
	 * Handles backward compatibility with legacy meta keys and timed re-show.
	 *
	 * @param string $notice_id Notice ID.
	 * @param array  $notice    Notice configuration.
	 * @return bool
	 */
	private function is_dismissed( $notice_id, $notice ) {
		$user_id = get_current_user_id();

		// 1. Check legacy meta key first (backward compatibility).
		if ( ! empty( $notice['legacy_dismiss_meta'] ) ) {
			$legacy_dismissed = get_user_meta( $user_id, $notice['legacy_dismiss_meta'], true );
			if ( $legacy_dismissed ) {
				// Migrate: also set new standardized key.
				update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );

				// If timed re-show, check if cooldown expired.
				if ( $notice['reshow_after_days'] > 0 && ! empty( $notice['legacy_option_key'] ) ) {
					$next_timestamp = get_option( $notice['legacy_option_key'] );
					if ( ! empty( $next_timestamp ) && time() > $next_timestamp ) {
						// Cooldown expired — clear dismiss to re-show.
						delete_user_meta( $user_id, 'tta_dismiss_' . $notice_id );
						delete_user_meta( $user_id, $notice['legacy_dismiss_meta'] );
						return false;
					}
				}
				return true;
			}
		}

		// 2. Check new standardized key.
		$dismissed = get_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );
		if ( $dismissed ) {
			// If timed re-show, check cooldown.
			if ( $notice['reshow_after_days'] > 0 ) {
				$reshow_key     = 'tta_reshow_' . $notice_id;
				$next_timestamp = get_option( $reshow_key );
				// Also check legacy option key.
				if ( empty( $next_timestamp ) && ! empty( $notice['legacy_option_key'] ) ) {
					$next_timestamp = get_option( $notice['legacy_option_key'] );
				}
				if ( ! empty( $next_timestamp ) && time() > $next_timestamp ) {
					// Cooldown expired — clear dismiss.
					delete_user_meta( $user_id, 'tta_dismiss_' . $notice_id );
					if ( ! empty( $notice['legacy_dismiss_meta'] ) ) {
						delete_user_meta( $user_id, $notice['legacy_dismiss_meta'] );
					}
					return false;
				}
			}
			return true;
		}

		// 3. Check legacy option key for timed re-show (no dismiss meta set but cooldown active).
		if ( ! empty( $notice['legacy_option_key'] ) ) {
			$next_timestamp = get_option( $notice['legacy_option_key'] );
			if ( ! empty( $next_timestamp ) && is_numeric( $next_timestamp ) && time() <= $next_timestamp ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if current screen matches.
	 *
	 * @param array $screens Screen IDs.
	 * @return bool
	 */
	private function is_current_screen( $screens ) {
		$screen = get_current_screen();
		if ( ! $screen ) {
			return false;
		}
		return in_array( $screen->id, $screens, true );
	}

	// =========================================================================
	// AJAX Handlers
	// =========================================================================

	/**
	 * AJAX handler for dismissing notices (new system).
	 */
	public function ajax_dismiss_notice() {
		check_ajax_referer( 'tta_notice_nonce', 'nonce' );

		$notice_id = isset( $_POST['notice_id'] ) ? sanitize_text_field( wp_unslash( $_POST['notice_id'] ) ) : '';

		if ( empty( $notice_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid notice ID.', 'text-to-audio' ) ) );
		}

		$user_id = get_current_user_id();
		$notice  = isset( $this->notices[ $notice_id ] ) ? $this->notices[ $notice_id ] : null;

		// Save new standardized dismiss key.
		update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );

		// Also save legacy meta key for backward compatibility.
		if ( $notice && ! empty( $notice['legacy_dismiss_meta'] ) ) {
			update_user_meta( $user_id, $notice['legacy_dismiss_meta'], true );
		}

		// Save timed re-show option if configured.
		if ( $notice && $notice['reshow_after_days'] > 0 ) {
			$next_time = time() + ( DAY_IN_SECONDS * $notice['reshow_after_days'] );
			update_option( 'tta_reshow_' . $notice_id, $next_time, false );

			// Also save to legacy option key.
			if ( ! empty( $notice['legacy_option_key'] ) ) {
				update_option( $notice['legacy_option_key'], $next_time, false );
			}
		}

		wp_send_json_success( array( 'message' => __( 'Notice dismissed.', 'text-to-audio' ) ) );
	}

	/**
	 * Legacy AJAX handler — maps old `tta_hide_notice` action to new system.
	 *
	 * This maintains backward compatibility with any cached admin pages
	 * that still use the old inline JS sending `which` parameter.
	 */
	public function ajax_dismiss_notice_legacy() {
		check_ajax_referer( 'tta_notice_nonce' );

		// Map old 'which' values to new notice IDs.
		$legacy_map = array(
			'onboarding'                  => 'onboarding',
			'translate'                   => 'translation',
			'voice_and_language'          => 'voice_language_mismatch',
			'features'                    => 'features',
			'promotion_black_friday_close' => 'promotion',
			'ar_vr_plugin'                => 'ar_vr_plugin',
			'compitable'                  => 'compatible',
			'rating'                      => 'review',
			'feedback'                    => 'feedback',
			'setup'                       => 'setup',
			'analytics'                   => 'analytics',
			'writable'                    => 'writable',
		);

		$which = isset( $_REQUEST['which'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['which'] ) ) : '';

		if ( empty( $which ) || ! isset( $legacy_map[ $which ] ) ) {
			wp_send_json_error( __( 'Invalid Request.', 'text-to-audio' ) );
			wp_die();
		}

		// Inject mapped notice_id and call new handler.
		$_POST['notice_id'] = $legacy_map[ $which ];
		$_POST['nonce']     = wp_create_nonce( 'tta_notice_nonce' );
		$this->ajax_dismiss_notice();
	}

	/**
	 * AJAX handler for notice action tracking.
	 */
	public function ajax_track_notice_action() {
		check_ajax_referer( 'tta_notice_nonce', 'nonce' );

		$notice_id   = isset( $_POST['notice_id'] ) ? sanitize_text_field( wp_unslash( $_POST['notice_id'] ) ) : '';
		$action_name = isset( $_POST['action_name'] ) ? sanitize_text_field( wp_unslash( $_POST['action_name'] ) ) : '';

		if ( empty( $notice_id ) || ! isset( $this->notices[ $notice_id ] ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid notice ID.', 'text-to-audio' ) ) );
		}

		$notice  = $this->notices[ $notice_id ];
		$user_id = get_current_user_id();
		$user    = wp_get_current_user();

		// Track click if enabled.
		if ( $notice['track_clicks'] ) {
			$total_clicks = (int) get_option( 'tta_clicks_' . $notice_id, 0 );

			if ( $notice['max_clicks'] > 0 && $total_clicks >= $notice['max_clicks'] ) {
				wp_send_json_error( array( 'message' => __( 'This action is no longer available.', 'text-to-audio' ) ) );
			}

			$already_clicked = get_user_meta( $user_id, 'tta_clicked_' . $notice_id, true );

			if ( ! $already_clicked ) {
				update_option( 'tta_clicks_' . $notice_id, $total_clicks + 1, false );
				update_user_meta( $user_id, 'tta_clicked_' . $notice_id, true );
			}
		}

		// Execute custom action callback.
		if ( is_callable( $notice['click_action'] ) ) {
			$result = call_user_func( $notice['click_action'], $notice_id, $action_name, $user );

			if ( is_wp_error( $result ) ) {
				wp_send_json_error( array( 'message' => $result->get_error_message() ) );
			}

			if ( is_array( $result ) ) {
				wp_send_json_success( $result );
			}
		}

		wp_send_json_success( array(
			'message' => __( 'Action tracked.', 'text-to-audio' ),
			'dismiss' => true,
		) );
	}

	// =========================================================================
	// Render Callbacks (registered via render_callback parameter)
	// =========================================================================

	/**
	 * Render browser support check (client-side script).
	 *
	 * @param string $notice_id Notice ID.
	 * @param array  $notice    Notice configuration.
	 */
	public function render_browser_support( $notice_id, $notice ) {
		?>
		<script>
			(function() {
				'use strict';
				if ( ! ( 'speechSynthesis' in window || 'webkitSpeechSynthesis' in window ) ) {
					var notice = document.createElement('div');
					notice.className = 'notice notice-warning tta-admin-notice';
					notice.setAttribute('data-notice-id', '<?php echo esc_js( $notice_id ); ?>');
					notice.style.padding = '12px 20px';
					notice.innerHTML = '<p><strong><?php echo esc_js( __( 'AtlasVoice:', 'text-to-audio' ) ); ?></strong> ' +
						'<?php echo esc_js( __( 'This browser does not support the speechSynthesis API. Please use Chrome, Firefox, Safari, Samsung, Edge, or Opera. The Pro version works in all browsers.', 'text-to-audio' ) ); ?></p>';
					var wpbody = document.querySelector('.wrap') || document.querySelector('#wpbody-content');
					if ( wpbody ) {
						wpbody.insertBefore(notice, wpbody.firstChild);
					}
				}
			})();
		</script>
		<?php
	}

	/**
	 * Render promotion / sale banner.
	 *
	 * @param string $notice_id Notice ID.
	 * @param array  $notice    Notice configuration.
	 */
	public function render_promotion_notice( $notice_id, $notice ) {
		$rtl_dir = function_exists( 'tta_is_rtl' ) && tta_is_rtl() ? 'ltr' : 'auto';

		// Check dismissed.
		if ( $this->is_dismissed( $notice_id, $notice ) ) {
			return;
		}
		?>
		<div class="notice notice-info is-dismissible tta-admin-notice"
		     data-notice-id="<?php echo esc_attr( $notice_id ); ?>"
		     dir="<?php echo esc_attr( $rtl_dir ); ?>"
		     style="line-height: 1.5; padding: 20px;">

			<button type="button" class="notice-dismiss tta-notice-dismiss" data-notice-id="<?php echo esc_attr( $notice_id ); ?>">
				<span class="screen-reader-text"><?php esc_html_e( 'Dismiss this notice.', 'text-to-audio' ); ?></span>
			</button>

			<h3 style="margin: 0 0 8px 0;">
				<?php esc_html_e( 'AtlasVoice Pro — Limited-Time Discount', 'text-to-audio' ); ?>
			</h3>
			<p style="margin: 0 0 12px 0; font-size: 14px;">
				<?php esc_html_e( 'Save 30% on AtlasVoice Pro with the coupon code below.', 'text-to-audio' ); ?>
			</p>
			<p style="margin: 0 0 12px 0;">
				<code style="font-size: 14px; padding: 4px 8px;">ATLASNEWYEAR26</code>
			</p>
			<p>
				<a href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/?utm_source=plugin&utm_medium=user_dashboard&utm_campaign=new_year_26"
				   class="button button-primary tta-notice-url-btn" data-notice-id="<?php echo esc_attr( $notice_id ); ?>" data-dismiss-on-click="true" data-new-tab="true"
				   target="_blank"><?php esc_html_e( 'View Pricing', 'text-to-audio' ); ?></a>
			</p>
		</div>
		<?php
	}

	// =========================================================================
	// Message Callbacks (registered via message_callback parameter)
	// =========================================================================

	/**
	 * Get translation request message with current locale language.
	 *
	 * @return string
	 */
	public function get_translation_message() {
		$languages = function_exists( 'tta_get_default_languages' ) ? tta_get_default_languages() : array();
		global $locale;

		$language        = isset( $languages[ $locale ] ) ? $languages[ $locale ] : __( 'your local language', 'text-to-audio' );
		$language_string = ' in <b>' . esc_html( $language ) . '</b>.';
		$contact_link    = '<a href="https://atlasaidev.com/contact-us/" target="_blank" style="color:blue">' . esc_html__( 'here', 'text-to-audio' ) . '</a>';
		$plugin_name     = sprintf( '<b>%s</b>', esc_html__( 'AtlasVoice', 'text-to-audio' ) );

		return sprintf(
			/* translators: 1: Language string, 2: Contact link, 3: Plugin name */
			esc_html__( 'We are seeking contributors to help translate this plugin into %1$s. If you\'re interested in assisting, we\'d love to hear from you! Please reach out to us %2$s, and we\'ll provide all the necessary guidance. Thank you for choosing %3$s.', 'text-to-audio' ),
			$language_string,
			$contact_link,
			$plugin_name
		);
	}

	/**
	 * Get random pro features message.
	 *
	 * @return string
	 */
	public function get_features_message() {
		$features = array(
			__( 'Convert unlimited characters to MP3 in bulk.', 'text-to-audio' ),
			__( 'WPML, GTranslate, TranslatePress Plugins Support', 'text-to-audio' ),
			__( 'Works with ACF, SCF, and other popular plugins.', 'text-to-audio' ),
			__( 'Google Cloud Text-to-Speech & ChatGPT Text-to-Speech (usage fees apply)', 'text-to-audio' ),
			__( 'Live integration support + 14-day money-back guarantee (conditions apply).', 'text-to-audio' ),
			__( '50+ languages support in pro version.', 'text-to-audio' ),
			__( 'Download the audio file for offline listening.', 'text-to-audio' ),
			__( 'Improved UI and Responsive of the button.', 'text-to-audio' ),
			__( 'Multiple Audio Player Support.', 'text-to-audio' ),
			__( 'Customizable content selection with CSS selectors', 'text-to-audio' ),
			__( 'Exclude content by categories, tags, IDs', 'text-to-audio' ),
			__( 'Unlimited Download MP3 files', 'text-to-audio' ),
			__( '200+ Voices with Google Cloud TTS', 'text-to-audio' ),
			__( 'Advance analytics & Text Aliases support.', 'text-to-audio' ),
		);

		// Pick 5 random features.
		$start = wp_rand( 0, count( $features ) - 1 );
		$selected = array();
		for ( $i = 0; $i < 5; $i++ ) {
			$idx        = ( $start + $i ) % count( $features );
			$selected[] = '<strong>' . ( $i + 1 ) . '. ' . $features[ $idx ] . '</strong>';
		}

		return implode( '<br/>', $selected );
	}

	/**
	 * Get analytics features message.
	 *
	 * @return string
	 */
	public function get_analytics_message() {
		$features = array(
			__( 'Number of times the MP3 file downloaded.', 'text-to-audio' ),
			__( 'Number of times the player reached the end.', 'text-to-audio' ),
			__( 'Percentage of times the play button was clicked after initiation.', 'text-to-audio' ),
			__( 'Percentage of times users listened till the end.', 'text-to-audio' ),
			__( 'Average listening time per play.', 'text-to-audio' ),
			__( 'Average number of pauses per play.', 'text-to-audio' ),
		);

		return implode( ' <br/>', $features );
	}

	// =========================================================================
	// Click Action Callbacks (registered via click_action parameter)
	// =========================================================================

	/**
	 * Handle review notice button actions.
	 *
	 * @param string   $notice_id   Notice ID.
	 * @param string   $action_name Action name (given, later, done, never).
	 * @param \WP_User $user        Current user.
	 * @return array
	 */
	public function handle_review_action( $notice_id, $action_name, $user ) {
		$user_id = $user->ID;
		$result  = array( 'dismiss' => true );

		switch ( $action_name ) {
			case 'given':
				update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );
				update_user_meta( $user_id, 'tta_review_notice_dismissed', true );
				update_option( 'tta_review_notice_next_show_time', 0, false );
				$result['redirect_url'] = 'https://wordpress.org/support/plugin/text-to-audio/reviews/?rate=5#new-post';
				break;

			case 'later':
				update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );
				update_user_meta( $user_id, 'tta_review_notice_dismissed', true );
				$next_time = time() + ( DAY_IN_SECONDS * 14 );
				update_option( 'tta_review_notice_next_show_time', $next_time, false );
				update_option( 'tta_reshow_' . $notice_id, $next_time, false );
				break;

			case 'done':
			case 'never':
				update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );
				update_user_meta( $user_id, 'tta_review_notice_dismissed', true );
				update_option( 'tta_review_notice_next_show_time', 0, false );
				break;
		}

		return $result;
	}

	/**
	 * Handle feedback notice button actions.
	 *
	 * @param string   $notice_id   Notice ID.
	 * @param string   $action_name Action name (given, later, done, never).
	 * @param \WP_User $user        Current user.
	 * @return array
	 */
	public function handle_feedback_action( $notice_id, $action_name, $user ) {
		$user_id = $user->ID;
		$result  = array( 'dismiss' => true );

		switch ( $action_name ) {
			case 'given':
				update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );
				update_user_meta( $user_id, 'tta_feedback_notice_dismissed', true );
				update_option( 'tta_feedback_notice_next_show_time', 0, false );
				$result['redirect_url'] = 'https://atlasaidev.com/contact-us/';
				break;

			case 'later':
				update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );
				update_user_meta( $user_id, 'tta_feedback_notice_dismissed', true );
				$next_time = time() + ( DAY_IN_SECONDS * 30 );
				update_option( 'tta_feedback_notice_next_show_time', $next_time, false );
				update_option( 'tta_reshow_' . $notice_id, $next_time, false );
				break;

			case 'done':
			case 'never':
				update_user_meta( $user_id, 'tta_dismiss_' . $notice_id, true );
				update_user_meta( $user_id, 'tta_feedback_notice_dismissed', true );
				update_option( 'tta_feedback_notice_next_show_time', 0, false );
				break;
		}

		return $result;
	}

	// =========================================================================
	// Auto-Dismiss Condition Callbacks
	// =========================================================================

	// =========================================================================
	// Usage Milestone Celebrations
	// =========================================================================

	/**
	 * Milestone definitions: threshold => notice config.
	 *
	 * @return array
	 */
	private function get_milestones() {
		return array(
			100   => array(
				'id'      => 'milestone_100',
				'message' => __( '100 plays! Your accessibility efforts are paying off. Your visitors love listening.', 'text-to-audio' ),
			),
			500   => array(
				'id'      => 'milestone_500',
				'message' => __( '500 plays! Your audio content is making a real difference for your audience.', 'text-to-audio' ),
			),
			1000  => array(
				'id'      => 'milestone_1000',
				'message' => __( '1,000 plays! You\'re making a real impact with audio content.', 'text-to-audio' ),
			),
			5000  => array(
				'id'      => 'milestone_5000',
				'message' => __( '5,000 plays! Your content is reaching thousands of listeners. Amazing!', 'text-to-audio' ),
			),
			10000 => array(
				'id'      => 'milestone_10000',
				'message' => __( '10,000 plays! You\'re a true audio content champion. Incredible milestone!', 'text-to-audio' ),
			),
		);
	}

	/**
	 * Register milestone notices.
	 *
	 * Only registers the next unreached milestone to ensure max 1 is visible.
	 */
	private function register_milestone_notices() {
		$milestones      = $this->get_milestones();
		$reached         = (array) get_option( 'tta_milestones_reached', array() );
		$total_plays     = $this->get_cached_total_plays();
		$analytics_title = __( 'AtlasVoice', 'text-to-audio' );

		// Find the next unreached milestone that qualifies.
		foreach ( $milestones as $threshold => $config ) {
			if ( in_array( $config['id'], $reached, true ) ) {
				continue;
			}

			if ( $total_plays >= $threshold ) {
				// Register only this one milestone notice (max 1 at a time).
				$milestone_id = $config['id'];
				$message      = $config['message'];

				$this->register_notice( array(
					'id'          => $milestone_id,
					'title'       => '<h3>' . esc_html( $analytics_title ) . '</h3>',
					'message'     => '<p>' . esc_html( $message ) . '</p>',
					'type'        => 'success',
					'icon'        => '',
					'dismissible' => true,
					'condition'   => function() {
						return current_user_can( 'manage_options' );
					},
					'buttons'     => array(
						array(
							'text' => __( 'View Analytics', 'text-to-audio' ),
							'url'  => admin_url( 'admin.php?page=text-to-audio#/analytics' ),
							'type' => 'primary',
						),
					),
				) );

				// Only show one milestone at a time.
				break;
			}
		}
	}

	/**
	 * Get total play count with 1-hour transient cache.
	 *
	 * @return int
	 */
	private function get_cached_total_plays() {
		$cache_key = 'tta_milestone_total_plays';
		$cached    = get_transient( $cache_key );

		if ( false !== $cached ) {
			return (int) $cached;
		}

		$total = $this->query_total_plays();
		set_transient( $cache_key, $total, HOUR_IN_SECONDS );

		return $total;
	}

	/**
	 * Query total plays from the atlasvoice_analytics table.
	 *
	 * The analytics column stores serialized arrays with play.count values.
	 *
	 * @return int
	 */
	private function query_total_plays() {
		global $wpdb;

		$table_name = $wpdb->prefix . 'atlasvoice_analytics';

		// Check if table exists.
		$table_exists = $wpdb->get_var(
			$wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $table_name ) )
		);

		if ( $table_exists !== $table_name ) {
			return 0;
		}

		// The analytics column stores serialized data; we need to unserialize
		// and sum play counts in PHP (same approach as TTA_Dashboard_Widget).
		$rows = $wpdb->get_col(
			"SELECT analytics FROM {$table_name}"
		);

		$total = 0;
		if ( $rows ) {
			foreach ( $rows as $raw ) {
				$analytics = maybe_unserialize( $raw );
				if ( is_array( $analytics ) && isset( $analytics['play']['count'] ) ) {
					$total += (int) $analytics['play']['count'];
				}
			}
		}

		return $total;
	}

	/**
	 * AJAX handler for dismissing milestone notices.
	 *
	 * Adds the milestone ID to the tta_milestones_reached option
	 * in addition to the standard per-user dismiss behavior.
	 */
	public function ajax_dismiss_milestone() {
		check_ajax_referer( 'tta_notice_nonce', 'nonce' );

		$milestone_id = isset( $_POST['milestone_id'] ) ? sanitize_text_field( wp_unslash( $_POST['milestone_id'] ) ) : '';

		if ( empty( $milestone_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid milestone ID.', 'text-to-audio' ) ) );
		}

		// Add to global milestones reached list.
		$reached = (array) get_option( 'tta_milestones_reached', array() );
		if ( ! in_array( $milestone_id, $reached, true ) ) {
			$reached[] = $milestone_id;
			update_option( 'tta_milestones_reached', $reached, false );
		}

		// Also set per-user dismiss meta (standard notice system).
		$user_id = get_current_user_id();
		update_user_meta( $user_id, 'tta_dismiss_' . $milestone_id, true );

		wp_send_json_success( array( 'message' => __( 'Milestone dismissed.', 'text-to-audio' ) ) );
	}

	/**
	 * Check if user has customized the plugin (auto-dismiss onboarding).
	 *
	 * @return bool True to auto-dismiss.
	 */
	public function check_onboarding_auto_dismiss() {
		$settings  = (array) get_option( 'tta_settings_data', array() );
		$listening = (array) get_option( 'tta_listening_settings', array() );

		// Check if user changed post types from default ['post'].
		if ( ! empty( $settings['tta__settings_allow_listening_for_post_types'] )
			&& $settings['tta__settings_allow_listening_for_post_types'] !== array( 'post' ) ) {
			return true;
		}

		// Check if user changed voice from default.
		if ( ! empty( $listening['tta__listening_voice'] )
			&& $listening['tta__listening_voice'] !== 'Google UK English Female' ) {
			return true;
		}

		return false;
	}

	// =========================================================================
	// Translation Download Notice
	// =========================================================================

	/**
	 * Register a notice prompting users to download translations for their locale.
	 *
	 * Only shows on the plugin settings page when the current locale has
	 * translations available on GitHub but not yet downloaded locally.
	 */
	private function register_translation_download_notice() {
		$locale = get_locale();

		// English doesn't need translation files.
		if ( 'en_US' === $locale ) {
			return;
		}

		// Check against hardcoded available locales — no API call needed.
		if ( ! TTA_Translation_Downloader::is_locale_available( $locale ) ) {
			return;
		}

		// Check if translation files already exist locally.
		$languages_dir = TTA_PLUGIN_PATH . 'languages/';
		$mo_file       = $languages_dir . 'text-to-audio-' . $locale . '.mo';
		if ( file_exists( $mo_file ) ) {
			return;
		}

		$this->register_notice( array(
			'id'              => 'translation_download',
			'type'            => 'info',
			'dismissible'     => true,
			'screens'         => array( 'toplevel_page_text-to-audio' ),
			'condition'       => function () {
				return current_user_can( 'manage_options' );
			},
			'render_callback' => array( $this, 'render_translation_download_notice' ),
		) );
	}

	/**
	 * Render the translation download notice with a download button.
	 *
	 * @param array $notice The notice configuration.
	 */
	/**
	 * Get human-readable label for a locale.
	 *
	 * @param string $locale The locale code.
	 *
	 * @return string The locale label.
	 */
	private function get_locale_label( $locale ) {
		$labels = array(
			'es_ES' => 'Español (España)',
			'it_IT' => 'Italiano',
			'pt_PT' => 'Português (Portugal)',
			'pt_BR' => 'Português (Brasil)',
			'ja'    => '日本語',
			'ko_KR' => '한국어',
			'zh_CN' => '中文 (简体)',
			'fr_FR' => 'Français',
			'de_DE' => 'Deutsch',
			'nl_NL' => 'Nederlands',
		);

		return isset( $labels[ $locale ] ) ? $labels[ $locale ] : $locale;
	}

	public function render_translation_download_notice( $notice ) {
		$locale       = get_locale();
		$locale_label = $this->get_locale_label( $locale );
		?>
		<div class="notice notice-info is-dismissible tta-notice" data-notice-id="translation_download" style="padding: 15px 20px; border-left-color: #2271b1;">
			<div style="display: flex; align-items: center; gap: 15px;">
				<span style="font-size: 32px;">🌐</span>
				<div style="flex: 1;">
					<h3 style="margin: 0 0 5px;">
						<?php esc_html_e( 'AtlasVoice — Translation Available', 'text-to-audio' ); ?>
					</h3>
					<p style="margin: 0 0 10px; font-size: 14px;">
						<?php
						printf(
							/* translators: %s: language name with locale code */
							esc_html__( 'Your site language is set to %s. A translation pack is available for AtlasVoice. Click the button below to download and activate it.', 'text-to-audio' ),
							'<strong>' . esc_html( $locale_label ) . ' (' . esc_html( $locale ) . ')</strong>'
						);
						?>
					</p>
					<button type="button" class="button button-primary" id="tta-download-translations" data-locale="<?php echo esc_attr( $locale ); ?>">
						<?php
						printf(
							/* translators: %s: language name */
							esc_html__( 'Download %s Translation', 'text-to-audio' ),
							esc_html( $locale_label )
						);
						?>
					</button>
					<span id="tta-download-status" style="margin-left: 10px; display: none;"></span>
				</div>
			</div>
		</div>
		<script>
		(function($) {
			$('#tta-download-translations').on('click', function(e) {
				e.preventDefault();
				var $btn    = $(this);
				var $status = $('#tta-download-status');
				var locale  = $btn.data('locale');

				$btn.prop('disabled', true).text('<?php esc_html_e( 'Downloading...', 'text-to-audio' ); ?>');
				$status.show().html('<span class="spinner is-active" style="float: none; margin: 0;"></span>');

				$.ajax({
					url: ttaNoticeData.ajaxurl,
					type: 'POST',
					data: {
						action: 'tta_download_translations',
						locale: locale,
						nonce: ttaNoticeData.nonce
					},
					success: function(response) {
						if (response.success) {
							$status.html('<span style="color: #00a32a; font-weight: 600;">&#10003; <?php esc_html_e( 'Downloaded! Reloading...', 'text-to-audio' ); ?></span>');
							$btn.text('<?php esc_html_e( 'Downloaded!', 'text-to-audio' ); ?>');
							setTimeout(function() {
								window.location.reload();
							}, 1000);
						} else {
							$status.html('<span style="color: #d63638;">' + response.data.message + '</span>');
							$btn.prop('disabled', false).text('<?php esc_html_e( 'Retry Download', 'text-to-audio' ); ?>');
						}
					},
					error: function() {
						$status.html('<span style="color: #d63638;"><?php esc_html_e( 'Network error. Please try again.', 'text-to-audio' ); ?></span>');
						$btn.prop('disabled', false).text('<?php esc_html_e( 'Retry Download', 'text-to-audio' ); ?>');
					}
				});
			});
		})(jQuery);
		</script>
		<?php
	}

	/**
	 * AJAX handler: download translation files for the requested locale.
	 */
	public function ajax_download_translations() {
		check_ajax_referer( 'tta_notice_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'text-to-audio' ) ) );
		}

		$locale = isset( $_POST['locale'] ) ? sanitize_text_field( wp_unslash( $_POST['locale'] ) ) : '';

		if ( empty( $locale ) || 'en_US' === $locale ) {
			wp_send_json_error( array( 'message' => __( 'Invalid locale.', 'text-to-audio' ) ) );
		}

		$result = TTA_Translation_Downloader::download_locale( $locale );

		if ( $result ) {
			// Clear the file list cache.
			TTA_Cache::delete( 'translation_files_' . $locale );

			wp_send_json_success( array(
				'message' => sprintf(
					/* translators: %s: locale code */
					__( 'Translation files for %s downloaded successfully.', 'text-to-audio' ),
					$locale
				),
			) );
		} else {
			wp_send_json_error( array(
				'message' => __( 'Failed to download translation files. Please try again later.', 'text-to-audio' ),
			) );
		}
	}
}
