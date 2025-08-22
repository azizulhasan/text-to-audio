<?php

namespace TTA;


/**
 * Class TTA_Notices
 */
class TTA_Notices {

	private $active_plugin_name = '';
	private $plugin_features = [];

	private $analytics_features = [];

	public function __construct() {
		$this->notifications_load_hooks();
	}

	/**
	 * Load all Notifications hooks.
	 */
	public function notifications_load_hooks() {

		add_action( 'admin_init', [ $this, 'browser_support_notice' ] );
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once \ABSPATH . 'wp-admin/includes/plugin.php';
		}


		// if (!is_pro_active() && in_array(admin_url(basename($_SERVER['REQUEST_URI'])), [ admin_url('index.php') , admin_url('plugins.php'), admin_url('update-core.php'), \admin_url('plugin-install.php'), \admin_url('admin.php?page=text-to-audio')] ) )  {
		// if ( ! is_pro_active() ) {
			// add_action( 'admin_notices', [ $this, 'tta_free_promotion_notice' ] );
			// add_action( 'admin_notices', [ $this, 'tta_translation_request' ] );
		// }

		// if ( ! is_pro_active() || TTA_Helper::get_player_id() < 3 ) {
		// 	 add_action( 'admin_notices', [ $this, 'tta_feedback_notice' ] );
//			add_action( 'admin_notices', [ $this, 'tta_ar_vr_plugin_notice' ] );
		// }

		$plugins = [
			'gtranslate/gtranslate.php'                => [
				'callback' => 'plugin_compatible_notice_callback',
				'name'     => 'GTranslate',
			],
			'sitepress-multilingual-cms/sitepress.php' => [
				'callback' => 'plugin_compatible_notice_callback',
				'name'     => 'WPML Multilingual CMS',
			],
			'translatepress-multilingual/index.php' => [
				'callback' => 'plugin_compatible_notice_callback',
				'name'     => 'Translate Multilingual sites – TranslatePress',
			],
			'tts-multilingual'                         => [
				'callback' => 'plugin_compatible_notice_callback',
				'name'     => 'WPML Multilingual CMS, GTranslate, TranslatePress',
			],
		];

		$features_notice = [
			'Convert unlimited characters to MP3 in bulk.',
			'WPML, GTranslate, TranslatePress Plugins Support',
			'Works with ACF, SCF, and other popular plugins.',
			'Google Cloud Text-to-Speech & ChatGPT Text-to-Speech (usage fees apply)',
			'Live integration support + 14-day money-back guarantee (conditions apply).',
			'50+ languages support in pro version.',
			'Download the audio file for offline listening.',
			'Improved UI and Responsive of the button.',
			'Multiple Audio Player Support.',
			'Customizable content selection with CSS selectors',
			'Exclude content by categories, tags, IDs',
			'Unlimited Download MP3 files',
			'200+ Voices with Google Cloud Text To Speech',
			'Advance analytics & Text Aliases support.'
		];

		$this->analytics_features = [
			// __( "Number of times the player button was initiated" ),
			// __( "Number of times the play button was clicked" ),
			// __( "Number of times the pause button was clicked" ),
			// __( "Total time the player has played (in seconds)" ),
			__( "Number of times the player reached the end. 🔒" ),
			__( "Number of times the MP3 file downloaded. 🔒" ),
			__( "Percentage of times the play button was clicked after initiation. 🔒" ),
			__( "Percentage of times users listened till the end. 🔒" ),
			__( "Average listening time per play. 🔒" ),
			__( "Average number of pauses per play. 🔒" ),
		];


         if(!is_pro_active()){
			 foreach ( $plugins as $plugin_name =>  $data ){
			 	if(is_plugin_active($plugin_name )) {
			 		$this->active_plugin_name    = sprintf( '<b>%s</b>', $data['name'] );

			 		add_action( 'admin_notices', [ $this, $data['callback'] ] );
			 		break;
			 	}else if( $plugin_name == 'tts-multilingual') {
			 		$this->active_plugin_name    = sprintf( '<b>%s</b>', $data['name'] );
			 		add_action( 'admin_notices', [ $this, $data['callback'] ] );
			 	}
			 }
		
		 	// Display free version notice.
//             $i = rand(0, (count($features_notice) -1));
//             $feature1 = $features_notice[$i];
//             $i++;
//             $feature2 = isset($features_notice[$i]) ? $features_notice[$i] : $features_notice[0];
//	         $i++;
//             $feature3 = isset($features_notice[$i]) ? $features_notice[$i] : $features_notice[1];
//			 $i++;
//             $feature4 = isset($features_notice[$i]) ? $features_notice[$i] : $features_notice[2];
//			 $i++;
//             $feature5 = isset($features_notice[$i]) ? $features_notice[$i] : $features_notice[3];
//             array_push($this->plugin_features, "<strong>1. $feature1</strong>");
//             array_push($this->plugin_features, "<strong>2. $feature2</strong>");
//             array_push($this->plugin_features, "<strong>3. $feature3</strong>");
//			 array_push($this->plugin_features, "<strong>4. $feature4</strong>");
//			 array_push($this->plugin_features, "<strong>5. $feature5</strong>");

//	          add_action( 'admin_notices', [ $this, 'plugin_features_notice_callback' ] );
//		 	 add_action( 'admin_notices', [ $this, 'plugin_analytics_notice_callback' ] );
         }

		


		if ( ! is_pro_active() && version_compare( TEXT_TO_AUDIO_VERSION, TEXT_TO_AUDIO_VERSION, '>=' ) ) {
			add_action( 'admin_notices', [ $this, 'tts_setup_notice' ] );
		}

//		add_action( 'admin_notices', [ $this, 'tta_review_notice' ] );


//		add_action('wp_ajax_tta_save_review_notice', [ $this, 'tta_save_review_notice' ] );
		// add_action('wp_ajax_tta_save_feedback_notice', [ $this, 'tta_save_feedback_notice' ] );
		add_action( 'wp_ajax_tta_hide_notice', [ $this, 'tta_hide_notice' ] );
	}

	public function browser_support_notice() {
		$nonce = wp_create_nonce( 'tta_notice_nonce' );
		add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {

			?>
            <script>
                (function ($) {
                    "use strict";
                    $(window)
                        .on('load', function (e) {
                            if ('speechSynthesis' in window || 'webkitSpeechSynthesis' in window) {
                            } else {
                                if (wp.ajax) {
                                } else {
                                    alert('This browser don\'t support speechSynthesis API. Please use one of these browser to use Text To Speech Free.  Chrome, FireFox, Safari, Samsung, Edge, Opera. On our Pro version there is no issue releated to browser.')
                                }
                            }
                        });
                })(jQuery)
            </script><?php
		} );
	}

	public function plugin_compatible_notice_callback() {
		if(is_pro_active()){
			return;
		}
		$wpml_and_gtranslate_notice_displaid = \get_option( 'wpml_and_gtranslate_notice_displayed_aug_25', false );
		if ( ! $wpml_and_gtranslate_notice_displaid ) {
			delete_option( 'tta_plugin_compatible_notice_next_show_time' );
			delete_user_meta( \get_current_user_id(), 'tta_plugin_compatible_notice_dismissed' );
			update_option( 'tta_plugin_compatible_notice_next_show_time', 12 );
			\update_option( 'wpml_and_gtranslate_notice_displayed_aug_25', true );
		}

		$pluginName    = sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		$ProPluginName = sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS Pro', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );

		$has_notice              = false;
		$user_id                 = get_current_user_id();
		$next_timestamp          = get_option( 'tta_plugin_compatible_notice_next_show_time' );
		$review_notice_dismissed = get_user_meta( $user_id, 'tta_plugin_compatible_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );
		if ( ! empty( $next_timestamp ) ) {
			if ( ( time() > $next_timestamp ) ) {
				$show_notice = true;
			} else {
				$show_notice = false;
			}
		} else {
			if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
				$show_notice = false;
			} else {
				$show_notice = true;
			}
		}
		// translation Notice.
		if ( $show_notice ) {
			$has_notice = true;
			$learn_more = '<a href="https://atlasaidev.com/plugins/text-to-speech-pro/" target="_blank" style="color:blue">Learn more</a>'

			?>
            <div class="tta-notice notice notice-info is-dismissible" dir="<?php echo tta_is_rtl() ? 'ltr' : 'auto' ?>"
                 data-which="compitable" data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <p><?php
					printf(
						esc_html__( '%6$s %2$s %3$s %4$s plugin is compitable with  %5$s . %7$s', \TEXT_TO_AUDIO_TEXT_DOMAIN ),
						$pluginName, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'<div class="tta-review-notice-logo"></div>',
						'<br/>',
						$this->active_plugin_name, //phpcs:ignore
						$ProPluginName, //phpcs:ignore
						"<h3>$pluginName</h3>", //phpcs:ignore
						"$learn_more" //phpcs:ignore
					);
					?></p>
                <p>
                    <a class="button button-primary" data-response="compitable"
                       href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                       target="_blank"><?php esc_html_e( 'Buy Now', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                </p>
            </div>

			<?php
		}

		if ( true == $has_notice ) {
			add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
				?>
                <script>
                    (function ($) {
                        "use strict";
                        $(document)
                            .on('click', '.tta-notice a.button', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                let self = $(this);
                                self.closest(".tta-notice").slideUp(200, 'linear');

                                let tta_notice = self.closest('.tta-notice'), which = tta_notice.attr('data-which');
                                console.log(which)

                                if (wp.ajax) {
                                    wp.ajax.post('tta_hide_notice', {
                                        _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                        which: which
                                    });
                                }
                                let notice = self.attr('data-response');

                                if ('compitable' === notice) {
                                    window.open('http://atlasaidev.com/text-to-speech-pro/', '_blank');
                                }
                            })

                            .on('click', '.tta-notice .notice-dismiss', function (e) {
                                e.preventDefault();

                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), tta_notice = self.closest('.tta-notice'),
                                    which = tta_notice.attr('data-which');
                                if (wp.ajax) {
                                    wp.ajax.post('tta_hide_notice', {
                                        _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                        which: which
                                    });
                                }
                            });

						<?php if ( tta_is_rtl() ) { ?>
                        setTimeout(function () {
                            $('.notice-dismiss').css('left', '97%');
                        }, 100)
						<?php } ?>
                    })(jQuery)
                </script><?php
			}, 99 );
		}
	}

	public function plugin_analytics_notice_callback() {

//        delete_option('tta_plugin_analytics_notice_next_show_time');
//        delete_user_meta(\get_current_user_id(), 'tta_plugin_analytics_notice_dismissed');
//        update_option('tta_plugin_analytics_notice_next_show_time', 12);


		$pluginName = sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );

		$has_notice              = false;
		$user_id                 = get_current_user_id();
		$next_timestamp          = get_option( 'tta_plugin_analytics_notice_next_show_time' );
		$review_notice_dismissed = get_user_meta( $user_id, 'tta_plugin_analytics_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );
		if ( ! empty( $next_timestamp ) ) {
			if ( ( time() > $next_timestamp ) ) {
				$show_notice = true;
			} else {
				$show_notice = false;
			}
		} else {
			if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
				$show_notice = false;
			} else {
				$show_notice = true;
			}
		}
		// translation Notice.
		if ( $show_notice ) {
			$has_notice = true;
			$learn_more = '<a href="https://atlasaidev.com/plugins/text-to-speech-pro/" target="_blank" style="color:blue">Unlock The Premium Features</a>';
			$learn_more = '';

			?>
            <div class="tta-notice notice notice-info is-dismissible" dir="<?php echo tta_is_rtl() ? 'ltr' : 'auto' ?>"
                 data-which="analytics" data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <p><?php
					printf(
						esc_html__( '%6$s %2$s %3$s %4$s', \TEXT_TO_AUDIO_TEXT_DOMAIN ),
						$pluginName, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'<div class="tta-review-notice-logo"></div>',
						'<br/><li/>',
						implode( ' <li/> ', $this->analytics_features ), //phpcs:ignore
						$pluginName, //phpcs:ignore
						"<h3>Enhance Your Content with Text To Speech: Now Featuring Detailed Post Analytics!</h3>", //phpcs:ignore
						"$learn_more" //phpcs:ignore
					);
					?></p>
				<?php
				if ( ! is_pro_active() ) { ?>
                    <a class="button button-primary" data-response="analytics"
                       href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                       target="_blank"><?php esc_html_e( 'Unlock The Premium Features', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a></p>
				<?php } ?>
            </div>

			<?php
		}

		if ( true == $has_notice ) {
			add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
				?>
                <script>
                    (function ($) {
                        "use strict";
                        $(document)
                            .on('click', '.tta-notice a.button', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                let self = $(this);
                                self.closest(".tta-notice").slideUp(200, 'linear');

                                let tta_notice = self.closest('.tta-notice'), which = tta_notice.attr('data-which');
                                console.log(which)

                                if (wp.ajax) {
                                    wp.ajax.post('tta_hide_notice', {
                                        _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                        which: which
                                    });
                                }
                                let notice = self.attr('data-response');

                                if ('analytics' === notice) {
                                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/', '_blank');
                                }
                            })

                            .on('click', '.tta-notice .notice-dismiss', function (e) {
                                e.preventDefault();

                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), tta_notice = self.closest('.tta-notice'),
                                    which = tta_notice.attr('data-which');
                                if (wp.ajax) {
                                    wp.ajax.post('tta_hide_notice', {
                                        _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                        which: which
                                    });
                                }
                            });

						<?php if ( tta_is_rtl() ) { ?>
                        setTimeout(function () {
                            $('.notice-dismiss').css('left', '97%');
                        }, 100)
						<?php } ?>
                    })(jQuery)
                </script><?php
			}, 99 );
		}
	}

	public function plugin_features_notice_callback() {
		if(!is_pro_active()){
			return;
		}
		$plugin_features_notice_displayed = \get_option( 'plugin_features_notice_1', false );
		if ( ! $plugin_features_notice_displayed ) {
			delete_option( 'tta_plugin_features_notice_next_show_time' );
			delete_user_meta( \get_current_user_id(), 'tta_plugin_features_notice_dismissed' );
			update_option( 'tta_plugin_features_notice_next_show_time', 12 );
			\update_option( 'plugin_features_notice_1', true );
		}

		$pluginName    = sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		$ProPluginName = sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS Pro', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );

		$has_notice              = false;
		$user_id                 = get_current_user_id();
		$next_timestamp          = get_option( 'tta_plugin_features_notice_next_show_time' );
		$review_notice_dismissed = get_user_meta( $user_id, 'tta_plugin_features_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );
		if ( ! empty( $next_timestamp ) ) {
			if ( ( time() > $next_timestamp ) ) {
				$show_notice = true;
			} else {
				$show_notice = false;
			}
		} else {
			if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
				$show_notice = false;
			} else {
				$show_notice = true;
			}
		}
		// translation Notice.
		if ( $show_notice ) {
			$has_notice = true;
			$learn_more = '<a href="https://atlasaidev.com/plugins/text-to-speech-pro/" target="_blank" style="color:blue">See more features</a>'

			?>
            <div class="tta-notice notice notice-info is-dismissible" dir="<?php echo tta_is_rtl() ? 'ltr' : 'auto' ?>"
                 data-which="features" data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <p><?php
					printf(
						esc_html__( '%6$s %2$s %3$s %4$s', \TEXT_TO_AUDIO_TEXT_DOMAIN ),
						$pluginName, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'<div class="tta-review-notice-logo"></div>',
						'<br/>',
						implode( ' <br/> ', $this->plugin_features ), //phpcs:ignore
						$ProPluginName, //phpcs:ignore
						"<h3>$ProPluginName Features</h3>", //phpcs:ignore
						"$learn_more" //phpcs:ignore
					);
					?></p>
                <p>
                    <a class="button button-primary" data-response="features"
                       href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                       target="_blank"><?php esc_html_e( 'Sea More Features', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                </p>
            </div>

			<?php
		}

		if ( true == $has_notice ) {
			add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
				?>
                <script>
                    (function ($) {
                        "use strict";
                        $(document)
                            .on('click', '.tta-notice a.button', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                let self = $(this);
                                self.closest(".tta-notice").slideUp(200, 'linear');

                                let tta_notice = self.closest('.tta-notice'), which = tta_notice.attr('data-which');
                                console.log(which)

                                if (wp.ajax) {
                                    wp.ajax.post('tta_hide_notice', {
                                        _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                        which: which
                                    });
                                }
                                let notice = self.attr('data-response');

                                if ('features' === notice) {
                                    window.open('http://atlasaidev.com/text-to-speech-pro/', '_blank');
                                }
                            })

                            .on('click', '.tta-notice .notice-dismiss', function (e) {
                                e.preventDefault();

                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), tta_notice = self.closest('.tta-notice'),
                                    which = tta_notice.attr('data-which');
                                if (wp.ajax) {
                                    wp.ajax.post('tta_hide_notice', {
                                        _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                        which: which
                                    });
                                }
                            });

						<?php if ( tta_is_rtl() ) { ?>
                        setTimeout(function () {
                            $('.notice-dismiss').css('left', '97%');
                        }, 100)
						<?php } ?>
                    })(jQuery)
                </script><?php
			}, 99 );
		}
	}


	/**
	 * Translation notice action.
	 */
	public function tta_translation_request() {

        delete_option('tts_is_displayed_force_notice_december_24');
		if ( ! get_option( 'tts_is_displayed_force_notice_december_24' ) ) {
			delete_option( 'tta_translation_notice_next_show_time' );
			delete_user_meta( '1', 'tta_translation_notice_dismissed' );
			update_option( 'tta_translation_notice_next_show_time', 12 );

			update_option( 'tts_is_displayed_force_notice_december_24', true );
		}

		$pluginName              = sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		$has_notice              = false;
		$user_id                 = get_current_user_id();
		$next_timestamp          = get_option( 'tta_translation_notice_next_show_time' );
		$review_notice_dismissed = get_user_meta( $user_id, 'tta_translation_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );
		if ( ! empty( $next_timestamp ) ) {
			if ( ( time() > $next_timestamp ) ) {
				$show_notice = true;
			} else {
				$show_notice = false;
			}
		} else {
			if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
				$show_notice = false;
			} else {
				$show_notice = true;
			}
		}
		// translation Notice.
		if ( $show_notice ) {
			$has_notice = true;
			$languages  = tta_get_default_languages();
			global $locale;

			$language        = isset ( $languages[ $locale ] ) ? $languages[ $locale ] : "your local language";
			$language_string = $language ? ' in <b>' . $language . '</b>.' : '';
			$contact_link    = '<a href="http://atlasaidev.com/contact-us/" target="_blank" style="color:blue">here</a>'
			?>
            <div class="tta-notice notice notice-info is-dismissible" dir="<?php echo tta_is_rtl() ? 'ltr' : 'auto' ?>"
                 data-which="translate" data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <p><?php
					printf(
						esc_html__( '%6$s %2$s  We are seeking contributors to help translate this plugin into %4$s. If you’re interested in assisting, we’d love to hear from you! Please reach out to us %5$s, and we’ll provide all the necessary guidance.. %3$s Thank you for choosing %1$s.', \TEXT_TO_AUDIO_TEXT_DOMAIN ),
						$pluginName, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'<div class="tta-review-notice-logo"></div>',
						'<br/>',
						$language_string, //phpcs:ignore
						$contact_link, //phpcs:ignore
						"<h3>$pluginName</h3>" //phpcs:ignore
					);
					?></p>
                <p>
                    <a class="button button-primary" data-response="translate" href="#"
                       target="_blank"><?php esc_html_e( 'Translate Here', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                </p>
            </div>

			<?php
		}

		if ( true == $has_notice ) {
			add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
				?>
                <script>
                    (function ($) {
                        "use strict";
                        $(document)
                            .on('click', '.tta-notice a.button', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                let self = $(this);
                                self.closest(".tta-notice").slideUp(200, 'linear');

                                let tta_notice = self.closest('.tta-notice'), which = tta_notice.attr('data-which');
                                console.log(which)
                                if (wp.ajax) {
                                    wp.ajax.post('tta_hide_notice', {
                                        _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                        which: which
                                    });
                                }
                                let notice = self.attr('data-response');

                                if ('translate' === notice) {
                                    window.open('https://translate.wordpress.org/projects/wp-plugins/text-to-audio/', '_blank');
                                }
                            })

                            .on('click', '.tta-notice .notice-dismiss', function (e) {
                                e.preventDefault();

                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), tta_notice = self.closest('.tta-notice'),
                                    which = tta_notice.attr('data-which');
                                console.log(which)
                                wp.ajax.post('tta_hide_notice', {
                                    _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                    which: which
                                });
                            });

						<?php if ( tta_is_rtl() ) { ?>
                        setTimeout(function () {
                            $('.notice-dismiss').css('left', '97%');
                        }, 100)
						<?php } ?>
                    })(jQuery)
                </script><?php
			}, 99 );
		}
	}

	/**
	 * Ar_Vr_Plugin notice
	 */
	public function tta_ar_vr_plugin_notice() {

		// delete_option( 'tts_is_displayed_ar_vr_plugin_notice' );
		if ( ! get_option( 'tts_is_displayed_ar_vr_plugin_notice' ) ) {
			delete_option( 'tta_ar_vr_plugin_notice_next_show_time' );
			delete_user_meta( '1', 'tta_ar_vr_plugin_notice_dismissed' );
			update_option( 'tta_ar_vr_plugin_notice_next_show_time', 12 );

			update_option( 'tts_is_displayed_ar_vr_plugin_notice', true );
		}

		$pluginName              = sprintf( '%s', esc_html__( 'AtlasVoice Text To Speech TTS', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		$has_notice              = false;
		$user_id                 = get_current_user_id();
		$next_timestamp          = get_option( 'tta_ar_vr_plugin_notice_next_show_time' );
		$review_notice_dismissed = get_user_meta( $user_id, 'tta_ar_vr_plugin_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );
		if ( ! empty( $next_timestamp ) ) {
			if ( ( time() > $next_timestamp ) ) {
				$show_notice = true;
			} else {
				$show_notice = false;
			}
		} else {
			if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
				$show_notice = false;
			} else {
				$show_notice = true;
			}
		}
		// translation Notice.
		if ( $show_notice ) {
			$has_notice = true;
			$languages  = tta_get_default_languages();
			global $locale;
			$language        = isset ( $languages[ $locale ] ) ? $languages[ $locale ] : "";
			$language_string = $language ? ' in <b>' . $language . '</b>.' : '.';
			$contact_link    = '<a href="https://atlasaidev.com/docs/text-to-speech/usage-setup/fix-for-chrome-130-speechsynthesis-speak-not-working/?utm_source=client&utm_medium=tts_plugin&utm_campaign=speechSysnthesis" target="_blank" style="color:blue">here</a>'
			?>
            <div class="tta-notice notice notice-info is-dismissible" dir="<?php echo tta_is_rtl() ? 'ltr' : 'auto' ?>"
                 data-which="ar_vr_plugin" data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <p><?php
					printf(
						esc_html__( '%4$s %2$s %3$s New from AtlasAiDev! Supercharge your WooCommerce store with our free AR/VR Plugin – let customers try products in real-world spaces using 3D & Augmented Reality, no app needed!', \TEXT_TO_AUDIO_TEXT_DOMAIN ),
						$pluginName, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'<div class="tta-review-notice-logo"></div>',
						'<br/>',
						"<h1 style='color:red'>🚀 Introducing 3D Model Viewer & AR for WordPress – Free & Powerful!</h1>", //phpcs:ignore
					);
					?></p>
                <p>
					<?php
					$install_url = admin_url('plugin-install.php?tab=plugin-information&plugin=ar-vr-3d-model-try-on&TB_iframe=true&width=772&height=500');
					?>
					<a class="button button-primary thickbox" data-response="ar_vr_install"
					 href="<?php echo esc_url($install_url); ?>">Install 3D Model Viewer</a>
                    <a class="button button-primary" data-response="ar_vr_plugin"
                       href="#"
                       target="_blank"><?php esc_html_e( 'Try It Now', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-primary" data-response="ar_vr_demo"
                       href="https://wpaugmentedreality.com/shop/"
                       target="_blank"><?php esc_html_e( 'Real World Demo', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-primary" data-response="ar_vr_how_it_works"
                       href="https://wordpress.org/plugins/ar-vr-3d-model-try-on/"
                       target="_blank"><?php esc_html_e( 'How To Use', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-primary" data-response="ar_vr_download"
                       href="https://downloads.wordpress.org/plugin/ar-vr-3d-model-try-on.zip"
                       target="_blank"><?php esc_html_e( 'Download', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-primary" data-response="ar_vr_contact"
                       href="https://wpaugmentedreality.com/contact-us/"
                       target="_blank"><?php esc_html_e( 'Contact Us', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>

                </p>
            </div>

			<?php
		}

		if ( true == $has_notice ) {
			add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
				?>
                <script>
                    (function ($) {
                        "use strict";
                        $(document)
                            .on('click', '.tta-notice a.button', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                let self = $(this);
                                // self.closest(".tta-notice").slideUp(200, 'linear');
                                //let tta_notice = self.closest('.tta-notice'), which = tta_notice.attr('data-which');
                                //console.log(which)
                                //if (wp.ajax) {
                                //    wp.ajax.post('tta_hide_notice', {
                                //        _wpnonce: '<?php //echo esc_attr( $nonce ); ?>//',
                                //        which: which
                                //    });
                                //}
                                let notice = self.attr('data-response');

                                if ('ar_vr_plugin' === notice) {
                                    window.open('https://wordpress.org/plugins/ar-vr-3d-model-try-on/?preview=1', '_blank');
                                }

                                if ('ar_vr_demo' === notice) {
                                    window.open('https://wpaugmentedreality.com/shop/', '_blank');
                                }

                                if ('ar_vr_download' === notice) {
                                    window.open('https://downloads.wordpress.org/plugin/ar-vr-3d-model-try-on.zip', '_blank');
                                }

                                if ('ar_vr_contact' === notice) {
                                    window.open('https://wpaugmentedreality.com/contact-us/', '_blank');
                                }

                                if ('ar_vr_how_it_works' === notice) {
                                    window.open('https://wordpress.org/plugins/ar-vr-3d-model-try-on/', '_blank');
                                }
                            })

                            .on('click', '.tta-notice .notice-dismiss', function (e) {
                                e.preventDefault();

                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), tta_notice = self.closest('.tta-notice'),
                                    which = tta_notice.attr('data-which');
                                console.log(which)
                                wp.ajax.post('tta_hide_notice', {
                                    _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                    which: which
                                });
                            });

						<?php if ( tta_is_rtl() ) { ?>
                        setTimeout(function () {
                            $('.notice-dismiss').css('left', '97%');
                        }, 100)
						<?php } ?>
                    })(jQuery)
                </script><?php
			}, 99 );
		}
	}

	/**
	 * Review notice action.
	 */
	public function tta_review_notice() {

//             delete_option('tta_review_notice_next_show_time');
//             delete_user_meta('1', 'tta_review_notice_dismissed');
//          update_option('tta_review_notice_next_show_time', 12);

		$pluginName              = sprintf( '<b>%s</b>', esc_html__( 'Text To Speech TTS', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		$has_notice              = false;
		$user_id                 = get_current_user_id();
		$next_timestamp          = get_option( 'tta_review_notice_next_show_time' );
		$review_notice_dismissed = get_user_meta( $user_id, 'tta_review_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );

		if ( ! empty( $next_timestamp ) ) {
			if ( ( time() > $next_timestamp ) ) {
				$show_notice = true;
			} else {
				$show_notice = false;
			}
		} else {
			if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
				$show_notice = false;
			} else {
				$show_notice = true;
			}
		}
		// Review Notice.
		if ( $show_notice ) {
			$has_notice = true;
			?>
            <div class="tta-notice notice notice-info is-dismissible" style="line-height:1.5;" data-which="rating"
                 data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <p><?php
					printf(
					/* translators: 1: plugin name,2: Slightly Smiling Face (Emoji), 3: line break 'br' tag */
						esc_html__( '%5$s %3$s %2$s We have spent countless hours developing this free plugin for you, and we would really appreciate it if you drop us a quick rating. Your opinion matters a lot to us.%4$s It helps us to get better. Thanks for using %1$s.', \TEXT_TO_AUDIO_TEXT_DOMAIN ),
						$pluginName, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'<span style="font-size: 16px;">&#128516</span>',
						'<div class="tta-review-notice-logo"></div>',
						'<br>',
						"<h3>$pluginName</h3>" //phpcs:ignore
					);
					?></p>
                <p>
                    <a class="button button-primary" data-response="given" href="#"
                       target="_blank"><?php esc_html_e( 'Review Now', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-secondary" data-response="later"
                       href="#"><?php esc_html_e( 'Remind Me Later', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-secondary" data-response="done" href="#"
                       target="_blank"><?php esc_html_e( 'Already Done!', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-secondary" data-response="never"
                       href="#"><?php esc_html_e( 'Never Ask Again', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                </p>
            </div>
			<?php
		}

		if ( true === $has_notice ) {
			add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
				?>
                <script>
                    (function ($) {
                        "use strict";
                        $(document)
                            .on('click', '.tta-notice a.button', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), notice = self.attr('data-response');
                                if ('given' === notice) {
                                    window.open('https://wordpress.org/support/plugin/text-to-audio/reviews/?rate=5#new-post', '_blank');
                                }
                                console.log(self)
                                self.closest(".tta-notice").slideUp(200, 'linear');
                                wp.ajax.post('tta_save_review_notice', {
                                    _ajax_nonce: '<?php echo esc_attr( $nonce ); ?>',
                                    notice: notice
                                });
                            })
                            .on('click', '.tta-notice .notice-dismiss', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), tta_notice = self.closest('.tta-notice'),
                                    which = tta_notice.attr('data-which');
                                wp.ajax.post('tta_hide_notice', {
                                    _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                    which: which
                                });
                            });
                    })(jQuery)
                </script><?php
			}, 99 );
		}

	}


	/**
	 * Upload folder is writable notice.
	 */
	public function tts_setup_notice() {

//		 delete_option('tts_setup_notice_next_show_time');
//		 delete_user_meta('1', 'tts_setup_notice_dismissed');
//        update_option('tts_setup_notice_next_show_time', 12);

		$has_notice              = false;
		$user_id                 = get_current_user_id();
		$next_timestamp          = get_option( 'tts_setup_notice_next_show_time' );
		$review_notice_dismissed = get_user_meta( $user_id, 'tts_setup_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );
		if ( ! empty( $next_timestamp ) ) {
			if ( ( time() > $next_timestamp ) ) {
				$show_notice = true;
			} else {
				$show_notice = false;
			}
		} else {
			if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
				$show_notice = false;
			} else {
				$show_notice = true;
			}
		}
		// writable Notice.
		if ( $show_notice ) {
			$has_notice = true;
			?>
            <div class="tta-notice notice notice-info is-dismissible" dir="<?php echo tta_is_rtl() ? 'ltr' : 'auto' ?>"
                 data-which="setup" data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <p><?php
					printf(
						esc_html__( '%2$s  %1$s  %1$s  Do you need support for setup of Text To Speech TTS plugin. We willll give you support as soon as possible.', TEXT_TO_AUDIO_TEXT_DOMAIN ),
						'<div class="tta-review-notice-logo"></div>',
						"<h1><strong>Text To Speech TTS Plugin Support</strong></h1>", //phpcs:ignore
					);
					?></p>
                <p>
                    <a class="button button-primary" href="https://atlasaidev.com/contact-us/"
                       target="_blank"><?php esc_html_e( 'Get Support', TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                </p>
            </div>

			<?php
		}

		if ( true === $has_notice ) {
			add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
				?>
                <script>
                    (function ($) {
                        "use strict";
                        $(document)
                            .on('click', '.tta-notice a.button', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                let self = $(this);
                                self.closest(".tta-notice").slideUp(200, 'linear');

                                let tts_notice = self.closest('.tta-notice'), which = tts_notice.attr('data-which');

                                wp?.ajax?.post('tta_hide_notice', {
                                    _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                    which: which
                                });

                                window.open('https://atlasaidev.com/contact-us/')

                            })

                            .on('click', '.tta-notice .notice-dismiss', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), tts_notice = self.closest('.tta-notice'),
                                    which = tts_notice.attr('data-which');
                                wp.ajax.post('tta_hide_notice', {
                                    _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                    which: which
                                });
                            });

						<?php if ( tta_is_rtl() ) { ?>
                        setTimeout(function () {
                            $('.notice-dismiss').css('left', '97%');
                        }, 100)
						<?php } ?>
                    })(jQuery)
                </script><?php
			}, 99 );
		}
	}


	/**
	 * Feedback notice action.
	 */
	public function tta_feedback_notice() {

		//     delete_option('tta_feedback_notice_next_show_time');
		//     delete_user_meta('1', 'tta_feedback_notice_dismissed');
		//  update_option('tta_feedback_notice_next_show_time', 12);

		$pluginName              = sprintf( '<b>%s</b>', esc_html__( 'Asking Feedback For Text To Speech TTS', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		$has_notice              = false;
		$user_id                 = get_current_user_id();
		$next_timestamp          = get_option( 'tta_feedback_notice_next_show_time' );
		$review_notice_dismissed = get_user_meta( $user_id, 'tta_feedback_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );

		if ( ! empty( $next_timestamp ) ) {
			if ( ( time() > $next_timestamp ) ) {
				$show_notice = true;
			} else {
				$show_notice = false;
			}
		} else {
			if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
				$show_notice = false;
			} else {
				$show_notice = true;
			}
		}
		// Feedback Notice.
		if ( $show_notice ) {
			$has_notice = true;
			?>
            <div class="tta-notice notice notice-info is-dismissible" style="line-height:1.5;" data-which="feedback"
                 data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <p><?php
					printf(
					/* translators: 1: plugin name,2: Slightly Smiling Face (Emoji), 3: line break 'br' tag */
						esc_html__( '%5$s %3$s %2$s We are looking your feedback to improve the product, and we would really appreciate it if you drop us a quick feedback. Your opinion matters a lot to us.%4$s It helps us to get better. Thanks for using Text To Speech.', \TEXT_TO_AUDIO_TEXT_DOMAIN ),
						$pluginName, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'<span style="font-size: 16px;">&#128516</span>',
						'<div class="tta-review-notice-logo"></div>',
						'<br>',
						"<h3>$pluginName</h3>" //phpcs:ignore
					);
					?></p>
                <p>
                    <a class="button button-primary" data-response="given" href="#"
                       target="_blank"><?php esc_html_e( 'Give Feedback Now', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-secondary" data-response="later"
                       href="#"><?php esc_html_e( 'Remind Me Later', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-secondary" data-response="done" href="#"
                       target="_blank"><?php esc_html_e( 'Already Done!', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                    <a class="button button-secondary" data-response="never"
                       href="#"><?php esc_html_e( 'Never Ask Again', \TEXT_TO_AUDIO_TEXT_DOMAIN ); ?></a>
                </p>
            </div>
			<?php
		}

		if ( true === $has_notice ) {
			add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
				?>
                <script>
                    (function ($) {
                        "use strict";
                        $(document)
                            .on('click', '.tta-notice a.button', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), notice = self.attr('data-response');
                                if ('given' === notice) {
                                    window.open('https://atlasaidev.com/contact-us/', '_blank');
                                }
                                console.log(self)
                                self.closest(".tta-notice").slideUp(200, 'linear');
                                wp.ajax.post('tta_save_feedback_notice', {
                                    _ajax_nonce: '<?php echo esc_attr( $nonce ); ?>',
                                    notice: notice
                                });
                            })
                            .on('click', '.tta-notice .notice-dismiss', function (e) {
                                e.preventDefault();
                                // noinspection ES6ConvertVarToLetConst
                                var self = $(this), tta_notice = self.closest('.tta-notice'),
                                    which = tta_notice.attr('data-which');
                                wp.ajax.post('tta_hide_notice', {
                                    _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                    which: which
                                });
                            });
                    })(jQuery)
                </script><?php
			}, 99 );
		}

	}


	/**
	 * Black friday implementation.
	 */
	public function tta_free_promotion_notice() {


		$pluginName              = sprintf( '<b>%s</b>', esc_html( 'Text To Speech: 🔥 Black Friday & Cyber Monday Sale - 40% OFF!' ) );
		$user_id                 = get_current_user_id();
		$review_notice_dismissed = get_user_meta( $user_id, 'tta_promotion_black_friday_24_notice_dismissed', true );
		$nonce                   = wp_create_nonce( 'tta_notice_nonce' );

		delete_user_meta( $user_id, 'tta_promotion_black_friday_24_notice_dismissed' );

		if ( isset( $review_notice_dismissed ) && ! empty( $review_notice_dismissed ) ) {
			$show_notice = false;
		} else {
			$show_notice = true;
		}

		if ( $show_notice ) {
			?>
            <div class="tta-promotion-notice notice notice-info is-dismissible price_update" style="line-height:1.5;"
                 data-which="promotion_black_friday_close" data-nonce="<?php echo esc_attr( $nonce ); ?>">
                <div id="black-friday-banner"
                     style="background-color: #ffcc00; color: #333; text-align: center; padding: 5px; font-family: Arial, sans-serif; position: sticky; top: 0; width: 100%; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <h2 style="margin: 0; font-size: 24px; font-weight: bold;">Text To Speech🔥 Holiday Deals & New Year
                        Offer Sale - 40% OFF! 🔥</h2>
                    <p style="margin: 10px 0; font-size: 16px;">Get 40% off on AtlasVoice Pro in all package. Use the
                        coupon code below and save big!</p>
                    <p style="margin: 10px 0; font-size: 18px; font-weight: bold;">Offer Ends In: <span id="countdown"
                                                                                                        style="color: #d9534f;"></span>
                    </p>
                    <button id="copy-coupon-btn"
                            style="background-color: #333; color: #fff; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px;"
                            onclick="copyCouponCode()">Copy Coupon Code: <strong>FSBFCM2024</strong></button>
                </div>
                <p>
                    <a data-which="promotion_black_friday_close" class="button button-primary tta-promotion-notice"
                       href="#"
                       target="_blank">Upgrade Now</a>
                </p>
            </div>
			<?php

			if ( $show_notice ) {
				add_action( 'admin_print_footer_scripts', function () use ( $nonce ) {
					?>
                    <script>
                        (function ($) {
                            "use strict";
                            $(document)
                                .on('click', '.tta-promotion-notice .notice-dismiss', function (e) {
                                    e.preventDefault();
                                    // noinspection ES6ConvertVarToLetConst
                                    var self = $(this), tta_notice = self.closest('.tta-promotion-notice'),
                                        which = tta_notice.attr('data-which');
                                    console.log(tta_notice.attr('data-which'))
                                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/?utm_source=plugin&utm_medium=user_dashboard&utm_campaign=black_friday_24', '_blank');
                                    if (wp.ajax) {
                                        wp.ajax.post('tta_hide_notice', {
                                            _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                            which: which
                                        });
                                    }
                                })
                                .on('click', '.tta-promotion-notice', function (e) {
                                    e.preventDefault();
                                    // noinspection ES6ConvertVarToLetConst
                                    var self = $(this), tta_notice = self.closest('.tta-promotion-notice'),
                                        which = tta_notice.attr('data-which');
                                    console.log(tta_notice.attr('data-which'))
                                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/?utm_source=plugin&utm_medium=user_dashboard&utm_campaign=black_friday_24', '_blank');
                                    if (wp.ajax) {
                                        wp.ajax.post('tta_hide_notice', {
                                            _wpnonce: '<?php echo esc_attr( $nonce ); ?>',
                                            which: which
                                        });
                                    }
                                });
                        })(jQuery)

                        // Countdown Timer Logic
                        function updateCountdown() {
                            const offerEndDate = new Date("January 5, 2025 23:59:59").getTime();
                            const now = new Date().getTime();
                            const timeLeft = offerEndDate - now;

                            if (timeLeft < 0) {
                                document.getElementById("black-friday-banner").innerHTML =
                                    "<h2 style='color: #d9534f;'>🎉 Holiday Deals & New Year Offer Has Ended!</h2>";
                                return;
                            }

                            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

                            document.getElementById("countdown").innerText =
                                `${days}d ${hours}h ${minutes}m ${seconds}s`;
                        }

                        // Update countdown every second
                        setInterval(updateCountdown, 1000);
                        // Initialize the countdown
                        updateCountdown();

                        // Copy Coupon Code Logic
                        function copyCouponCode() {
                            navigator.clipboard.writeText("FSBFCM2024").then(() => {
                                alert("Coupon code copied to clipboard!");
                            }).catch(err => {
                                console.error("Failed to copy text: ", err);
                            });
                        }
                    </script><?php
				}, 99 );
			}
		}

	}

	/**
	 * Show Review request admin notice
	 * @return string
	 */
	public function tta_save_review_notice() {
		check_ajax_referer( 'tta_notice_nonce' );
		$user_id = get_current_user_id();
		update_option( 'review_test', 'review' );
		$review_actions = [ 'later', 'never', 'done', 'given' ];
		if ( isset( $_POST['notice'] ) && ! empty( $_POST['notice'] ) && in_array( $_POST['notice'], $review_actions ) ) {
			$value = [
				'review_notice' => sanitize_text_field( $_POST['notice'] ), //phpcs:ignore
				'updated_at'    => time(),
			];
			if ( 'never' === $_POST['notice'] || 'done' === $_POST['notice'] || 'given' === $_POST['notice'] ) {

				add_user_meta( $user_id, 'tta_review_notice_dismissed', true, true );

				update_option( 'tta_review_notice_next_show_time', 0 );

			} elseif ( 'later' == $_POST['notice'] ) {

				add_user_meta( $user_id, 'tta_review_notice_dismissed', true, true );

				update_option( 'tta_review_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
			}
			update_option( 'tta_review_notice', $value );
			wp_send_json_success( $value );
			wp_die();
		}
		wp_send_json_error( esc_html__( 'Invalid Request.', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		wp_die();
	}

	/**
	 * Show Review request admin notice
	 * @return string
	 */
	public function tta_save_feedback_notice() {
		check_ajax_referer( 'tta_notice_nonce' );
		$user_id        = get_current_user_id();
		$review_actions = [ 'later', 'never', 'done', 'given' ];
		if ( isset( $_POST['notice'] ) && ! empty( $_POST['notice'] ) && in_array( $_POST['notice'], $review_actions ) ) {
			$value = [
				'review_notice' => sanitize_text_field( $_POST['notice'] ), //phpcs:ignore
				'updated_at'    => time(),
			];
			if ( 'never' === $_POST['notice'] || 'done' === $_POST['notice'] || 'given' === $_POST['notice'] ) {

				add_user_meta( $user_id, 'tta_feedback_notice_dismissed', true, true );

				update_option( 'tta_feedback_notice_next_show_time', 0 );

			} elseif ( 'later' == $_POST['notice'] ) {

				add_user_meta( $user_id, 'tta_feedback_notice_dismissed', true, true );

				update_option( 'tta_feedback_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
			}
			update_option( 'tta_feedback_notice', $value );
			wp_send_json_success( $value );
			wp_die();
		}
		wp_send_json_error( esc_html__( 'Invalid Request.', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		wp_die();
	}


	/**
	 * Ajax Action For Hiding Compatibility Notices
	 */
	public function tta_hide_notice() {
		check_ajax_referer( 'tta_notice_nonce' );

		$notices = [
			'compitable',
			'rating',
			'translate',
			'promotion_black_friday_close',
			'features',
			'feedback',
			'setup',
			'analytics',
			'ar_vr_plugin'
		];
		if ( isset( $_REQUEST['which'] ) && ! empty( $_REQUEST['which'] ) && in_array( $_REQUEST['which'], $notices ) ) {
			$user_id = get_current_user_id();

			if ( 'rating' == $_REQUEST['which'] ) {
				$updated_user_meta = update_user_meta( $user_id, 'tta_review_notice_dismissed', true, true );
				update_option( 'tta_review_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
			} elseif ( 'translate' == $_REQUEST['which'] ) {
				update_option( 'tta_translation_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
				$updated_user_meta = update_user_meta( $user_id, 'tta_translation_notice_dismissed', true, true );
			} elseif ( 'writable' == $_REQUEST['which'] ) {
				update_option( 'tta_folder_writable_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
				$updated_user_meta = update_user_meta( $user_id, 'tta_folder_writable_notice_dismissed', true, true );
			} elseif ( 'promotion_black_friday_close' == $_REQUEST['which'] ) {
				$updated_user_meta = update_user_meta( $user_id, 'tta_promotion_black_friday_24_notice_dismissed', true, true );
			} elseif ( 'compitable' == $_REQUEST['which'] ) {
				update_option( 'tta_plugin_compatible_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
				$updated_user_meta = update_user_meta( $user_id, 'tta_plugin_compatible_notice_dismissed', true, true );
			} elseif ( 'features' == $_REQUEST['which'] ) {
				update_option( 'tta_plugin_features_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
				$updated_user_meta = update_user_meta( $user_id, 'tta_plugin_features_notice_dismissed', true, true );
			} elseif ( 'feedback' == $_REQUEST['which'] ) {
				$updated_user_meta = update_user_meta( $user_id, 'tta_feedback_notice_dismissed', true, true );
				update_option( 'tta_feedback_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
			} elseif ( 'setup' == $_REQUEST['which'] ) {
				update_option( 'tts_setup_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
				$updated_user_meta = update_user_meta( $user_id, 'tts_setup_notice_dismissed', true );
			} elseif ( 'analytics' == $_REQUEST['which'] ) {
				update_option( 'tta_plugin_analytics_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
				$updated_user_meta = update_user_meta( $user_id, 'tta_plugin_analytics_notice_dismissed', true, true );
			} elseif ( 'ar_vr_plugin' == $_REQUEST['which'] ) {
				update_option( 'tta_ar_vr_plugin_notice_next_show_time', time() + ( DAY_IN_SECONDS * 30 ) );
				$updated_user_meta = update_user_meta( $user_id, 'tta_ar_vr_plugin_notice_dismissed', true, true );
			}

			if ( isset( $updated_user_meta ) && $updated_user_meta ) {
				wp_send_json_success( esc_html__( 'Request Successful.', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
			} else {
				wp_send_json_error( esc_html__( 'Something is wrong.', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
			}
			wp_die();
		}

		wp_send_json_error( esc_html__( 'Invalid Request.', \TEXT_TO_AUDIO_TEXT_DOMAIN ) );
		wp_die();
	}

}
