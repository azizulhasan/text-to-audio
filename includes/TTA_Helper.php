<?php

namespace TTA;

use stdClass;

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
class TTA_Helper {

	public static function is_exluded_by_terms( $post_terms, $excluded_terms, $term_type = 'tag' ) {
		$terms      = [];
		$is_exclude = false;

		if ( is_array( $post_terms ) && is_array( $excluded_terms ) ) {
			foreach ( $post_terms as $term ) {
				array_push( $terms, $term->slug );
			}


			foreach ( $terms as $term ) {
				if ( in_array( $term, $excluded_terms ) ) {
					$is_exclude = true;
					break;
				}
			}
		}

		return apply_filters( 'tts_is_exluded_by_terms', $is_exclude, $term_type );
	}

	public static function should_load_button() {
		$should_load_button = false;
		global $post;
		// is_home() || is_archive() || is_front_page() || is_category()
		if ( \is_single() || \is_singular() ) {
			$should_load_button = true;
		}

		$settings = self::tts_get_settings( 'settings' );
		$ids      = [];
		if ( isset( $settings['tta__settings_exclude_post_ids'] ) && is_array( $settings['tta__settings_exclude_post_ids'] ) ) {
			$ids = $settings['tta__settings_exclude_post_ids'];
		}

		$excluded_tags = [];
		if ( isset( $settings['tta__settings_exclude_wp_tags'] ) && is_array( $settings['tta__settings_exclude_wp_tags'] ) ) {
			$excluded_tags = $settings['tta__settings_exclude_wp_tags'];
		}
		$post_tags = [];
		if ( isset( $post->ID ) ) {
			$post_tags = get_the_terms( $post->ID, 'post_tag' );
		}
		$is_exclude_by_tags = self::is_exluded_by_terms( $post_tags, $excluded_tags );


		$excluded_categories = [];
		if ( isset( $settings['tta__settings_exclude_categories'] ) && is_array( $settings['tta__settings_exclude_categories'] ) ) {
			$excluded_categories = $settings['tta__settings_exclude_categories'];
		}

		$post_categories = [];
		if ( isset( $post->ID ) ) {
			$post_categories = get_the_terms( $post->ID, 'category' );
		}
		$is_exclude_by_cagories = self::is_exluded_by_terms( $post_categories, $excluded_categories, 'category' );


		if ( ! function_exists( 'is_user_logged_in' ) ) {
			include_once WPINC . '/pluggable.php';
		}

		$tta__settings_allow_listening_for_posts_status = false;
		if ( isset( $settings['tta__settings_allow_listening_for_posts_status'] ) && $settings['tta__settings_allow_listening_for_posts_status'] ) {
			if ( ! in_array( self::tts_post_status(), $settings['tta__settings_allow_listening_for_posts_status'] ) ) {
				$tta__settings_allow_listening_for_posts_status = true;
			}
		}

		// Display player settings from customization menu
		$display_player_to = self::display_player_based_on_user_role();

		if (
			! isset( $settings['tta__settings_allow_listening_for_post_types'] )
			|| count( $settings['tta__settings_allow_listening_for_post_types'] ) === 0
			|| ! is_array( $settings['tta__settings_allow_listening_for_post_types'] )
			|| ! in_array( self::tts_post_type(), $settings['tta__settings_allow_listening_for_post_types'] )
			|| in_array( $post->ID, $ids )
			|| $is_exclude_by_tags
			|| $is_exclude_by_cagories
			|| $tta__settings_allow_listening_for_posts_status
			|| $display_player_to
		) {
			$should_load_button = false;
		}

		return apply_filters( 'tta_should_load_button', $should_load_button, $post );
	}


	/**
	 * Get post type
	 *
	 * @see
	 */

	public static function tts_post_type() {
		global $post;

		return isset( $post->post_type ) ? $post->post_type : '';
	}

	public static function tts_post_status() {
		global $post;

		return isset( $post->post_status ) ? $post->post_status : '';
	}


	/**
	 *
	 */
	public static function remove_shortcodes( $content ) {
		if ( $content === '' ) {
			return '';
		}

		// Covers all kinds of shortcodes
		$expression = '/\[\/*[a-zA-Z1-90_| -=\'"\{\}]*\/*\]/m';

		$content = preg_replace( $expression, '', $content );

		return strip_shortcodes( $content );
	}


	/**
	 * Extends wp_strip_all_tags to fix WP_Error object passing issue
	 *
	 * @param string | WP_Error $string
	 *
	 * @return string
	 * @since 4.5.10
	 * */
	public static function tts_strip_all_tags( $string ) {

		if ( $string instanceof \WP_Error ) {
			return '';
		}

		return wp_strip_all_tags( $string );
	}


	/**
	 * Get Output
	 *
	 * @param $output
	 * @param $outputTypes
	 *
	 * @return array|false|int|mixed|string|string[]|null
	 */
	public static function sazitize_content( $output, $should_clean_content = false, $content_type = '' ) {

		if ( $should_clean_content ) {
			$output = \tta_clean_content( $output );
			if ( $content_type === 'title' ) {
				$output = \tta_should_add_delimiter( $output, \apply_filters( 'tts_sentence_delimiter', '. ' ) );
			}
		}
		// Format Output According to output type
		$output = self::tts_strip_all_tags( html_entity_decode( $output ) );

		// Remove ShortCodes
		$output = self::remove_shortcodes( $output );

		/**
		 * Remove the url
		 * @see https://gist.github.com/madeinnordeste/e071857148084da94891
		 */
		$output = preg_replace( '/\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i', '', $output );


		return $output;
	}

	public static function get_compatible_plugins_data() {
		$compatible_plugins_data = [];

		$GTranslate = get_option( 'GTranslate' );
		/* var WPML_Language_Switcher $wpml_language_switcher */
		global $sitepress, $sitepress_settings, $wpdb, $wpml_language_switcher;
		$active_languages = [];
		if ( $sitepress ) {
			$active_languages = $sitepress->get_active_languages();
		}
		$acf_fields = [];
		if ( self::is_acf_active() ) {
			$acf_fields = self::get_all_acf_fields();
		}


		// Translatepress multilingual plugin.
		$trp_languages = [];
		if ( class_exists( 'TRP_Settings' ) ) {
			$TRP_languages = new \TRP_Settings();
			// Get the available languages
			$trp_languages = $TRP_languages->get_settings()['translation-languages'];
		}

		$datas = \apply_filters( 'tts_pro_plugins_data', [
			'gtranslate/gtranslate.php'                => [
				'type'       => 'class',
				'data'       => [ 'gt_options', 'gt_languages', 'gt_switcher_wrapper', 'gt_selector', ],
				//  'gt_selector',], // 'gt_white_content', 'gtranslate_wrapper'],
				'plugin'     => 'gtranslate',
				'GTranslate' => $GTranslate,
			],
			'sitepress-multilingual-cms/sitepress.php' => [
				'type'             => 'class',
				'data'             => [],
				'plugin'           => 'sitepress',
				'active_languages' => $active_languages,
			],
			'advanced-custom-fields/acf.php'           => [
				'type'   => 'class',
				'data'   => $acf_fields,
				'plugin' => 'acf',
			],
			'translatepress-multilingual/index.php'    => [
				'type'   => 'class',
				'data'   => $trp_languages,
				'plugin' => 'translatepress',
			]
		] );

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once \ABSPATH . 'wp-admin/includes/plugin.php';
		}

		foreach ( $datas as $plugin_name => $data ) {
			if ( is_plugin_active( $plugin_name ) ) {
				$compatible_plugins_data[ $plugin_name ] = $data;
			}
		}

		return \apply_filters( 'tts_compatible_plugins_data', $compatible_plugins_data, \get_plugins() );
	}

	public static function get_language_code_from_url( $url ) {
		$arr           = explode( 'lang', $url );
		$language_code = end( $arr );
		if ( self::get_player_id() != 4 ) {
			$language_code = str_replace( '__', '', $language_code );
		}
		$language_code = explode( '.', $language_code )[0];
		$language_code = \str_replace( '_', '-', $language_code );
		if ( self::get_player_id() == 4 ) {
			$language_code = substr( $language_code, 2 );
		}

		return $language_code;
	}


	public static function tts_site_language( $plugin_all_settings ) {

		$default_language = '';
		if ( isset( $plugin_all_settings['listening']['tta__listening_lang'] ) ) {
			// TODO: Match with multilinguage UI and default language.
			$default_language = $plugin_all_settings['listening']['tta__listening_lang'];
			// $default_language = str_replace(['-', ' '], '_', $default_language);
		}

		return apply_filters( 'tts_site_language', $default_language );
	}

	public static function tts_get_file_url_key( $language, $voice ) {
		$file_url_key = $language;
		if ( get_player_id() == 4 && $voice ) {
			$file_url_key .= '--voice--' . $voice;
		}

		return apply_filters( 'tts_get_file_url_key', $file_url_key, $language, $voice );
	}

	public static function tts_get_voice( $plugin_all_settings ) {
		// TODO: Match with multilingual UI and default voice.
		$default_voice = '';
		if ( isset( $plugin_all_settings['listening']['tta__listening_voice'] ) && get_player_id() == 4 ) {
			$default_voice = $plugin_all_settings['listening']['tta__listening_voice'];
		}

		$voice = apply_filters( 'tts_get_voice', $default_voice );

		$voice = str_replace( [ ' ', '(', ')', '%20' ], '_', $voice );

		return $voice;
	}

	public static function tts_file_name( $title, $selectedLang, $voice = '', $post_id = '' ) {

		if ( ! $title ) {
			$title = 'Demo Content';
		}
		global $post;
		if ( ! $post_id && $post ) { // TODO: must add post ID to file name.
			$post_id = $post->ID;
		}

		$lang_code = explode( '-', str_replace( [ '_', ' ' ], '-', $selectedLang ) );

		if ( array_shift( $lang_code ) == 'en' ) {
			$title .= "__lang__" . $selectedLang;
			$title = str_replace( [ ' ', '-' ], '_', $title );
			$title = preg_replace( "/[^\p{L}a-z0-9_-]/ui", "", $title );
		} else {
			$md5_hash = md5( $title );
			$title    = $md5_hash . '__lang__' . $selectedLang;
		}

		if ( get_player_id() == 4 && $voice ) {
			$voice = str_replace( [ ' ', '(', ')', '%20' ], '_', $voice );

			$title .= '__voice__' . $voice;
		}

		return apply_filters( 'tts_file_name', $title, $selectedLang, $voice, $post );
	}

	public static function handle_old_url( $post, $new_urls, $old_url ) {
		$associative_urls = [];
		if ( isset( $new_urls[0] ) ) {
			$associative_urls = $new_urls[0];
		} else {
			$associative_urls = $new_urls;
		}

		if ( $old_url ) {
			$language_code = self::get_language_code_from_url( $old_url );
			if ( ! array_key_exists( $language_code, $associative_urls ) ) {
				$associative_urls[ $language_code ] = $old_url;
				update_post_meta( $post->ID, 'tts_mp3_file_urls', $associative_urls );
				delete_post_meta( $post->ID, 'tts_mp3_file_url' );
			}
		}

		return $associative_urls;
	}

	private static function set_tts_transient( $all_settings_keys ) {
		foreach ( $all_settings_keys as $identifier => $settings_key ) {
			$settings                         = get_option( $settings_key );
			$settings                         = ! $settings ? false : (array) $settings;
			$all_settings_data[ $identifier ] = $settings;
		}

		set_transient( 'tts_all_settings', $all_settings_data );

		return $all_settings_data;
	}

	/**
	 * @param $identifier
	 * @param $post_id
	 *
	 * @return mixed|null
	 */
	public static function tts_get_settings( $identifier = '', $post_id = '' ) {
		$all_settings_data = [];
		$all_settings_keys = [
			'listening'  => 'tta_listening_settings',
			'settings'   => 'tta_settings_data',
			'recording'  => 'tta_record_settings',
			'customize'  => 'tta_customize_settings',
			'analytics'  => 'tta_analytics_settings',
			'compatible' => 'tta_compatible_data',
			'aliases'    => 'tts_text_aliases',
		];
		$cached_settings   = get_transient( 'tts_all_settings' );
		if ( ! $cached_settings ) {
			$all_settings_data = self::set_tts_transient( $all_settings_keys );
		} else {

			foreach ( $all_settings_keys as $identifier_key => $settings_key ) {
				if ( ! isset( $cached_settings[ $identifier_key ] ) ) {
					$cached_settings = self::set_tts_transient( $all_settings_keys );
					break;
				}
			}

			$all_settings_data = $cached_settings;
		}

		if ( $post_id ) {
			$post_css_selectors = get_post_meta( $post_id, 'tts_pro_custom_css_selectors' );
			if ( isset( $post_css_selectors[0] ) ) {
				$post_css_selectors = json_decode( json_encode( $post_css_selectors[0] ), true );
			}


			if ( ! empty( $post_css_selectors ) && isset( $post_css_selectors['tta__settings_use_own_css_selectors'] ) && $post_css_selectors['tta__settings_use_own_css_selectors'] ) {

				if ( self::check_all_properties_are_empty( $post_css_selectors ) ) {
					$settings                                                   = $all_settings_data['settings'];
					$settings['tta__settings_css_selectors']                    = $post_css_selectors['tta__settings_css_selectors'];
					$settings['tta__settings_exclude_content_by_css_selectors'] = $post_css_selectors['tta__settings_exclude_content_by_css_selectors'];
					$settings['tta__settings_exclude_texts']                    = $post_css_selectors['tta__settings_exclude_texts'];
					$settings['tta__settings_exclude_tags']                     = $post_css_selectors['tta__settings_exclude_tags'];

					$all_settings_data['settings'] = $settings;
				}
			}

		}


		if ( $identifier ) {
			$specified_identifier_data = isset( $all_settings_data[ $identifier ] ) ? $all_settings_data[ $identifier ] : $all_settings_data;
			$all_settings_data         = $specified_identifier_data;
		}


		global $post;

		return \apply_filters( 'tts_get_settings', $all_settings_data, $post );
	}

	/**
	 * Check if all properties in an array are empty.
	 *
	 * @param array $array The array to check.
	 *
	 * @return bool True if any property is not empty, false if all properties are empty.
	 */
	public static function check_all_properties_are_empty( $array ) {
		// Iterate over each property in the array
		foreach ( $array as $key => $value ) {
			// Check if the property value is not empty
			if ( ! empty( $value ) ) {
				return true; // Return true if any property is not empty
			}
		}

		return false; // Return false if all properties are empty
	}

	public static function get_mp3_file_urls_old( $post = '' ) { // TODO: when google cloud TTS is applied. the mp3 file path will be different.
		if ( ! $post ) {
			global $post;
		}


		// update_post_meta($post->ID, 'tts_mp3_file_urls', []);

		$mp3_file_urls = get_post_meta( $post->ID, 'tts_mp3_file_urls' );
		$old_url       = get_post_meta( $post->ID, 'tts_mp3_file_url', true );

		if ( self::is_pro_active() && $old_url ) {
			$mp3_file_urls = self::handle_old_url( $post, $mp3_file_urls, $old_url );
		}

		if ( isset( $mp3_file_urls[0] ) ) {
			$mp3_file_urls = $mp3_file_urls[0];
		}
		$final_mp3_file_ulrs = [];
		$should_update_urls  = \false;
		foreach ( $mp3_file_urls as $language_code => $url ) {
			$file_headers = @get_headers( $url );

			if ( self::is_pro_active() ) {
				$full_path = self::get_path_from_url( $url );
				if ( file_exists( $full_path ) && filesize( $full_path ) == 0 ) {
					$should_update_urls = true;
					continue;
				}
			}

			if ( ! $file_headers || strpos( $file_headers[0], 'Not Found' ) !== false ) {
				$should_update_urls = true;
			} else {
				$final_mp3_file_ulrs[ $language_code ] = $url;
			}
		}

		if ( $should_update_urls || empty( $final_mp3_file_ulrs ) ) {
			update_post_meta( $post->ID, 'tts_mp3_file_urls', $final_mp3_file_ulrs );
		}

		if ( $should_update_urls || empty( $final_mp3_file_ulrs ) ) {
			update_post_meta( $post->ID, 'tts_mp3_file_urls', $final_mp3_file_ulrs );
		}

		return \apply_filters( 'tts_mp3_file_urls', $final_mp3_file_ulrs, $post );
	}

	public static function get_mp3_file_urls( $file_url_key, $post = '', $date = '', $file_name = '' ) {

		if ( ! $post ) {

			global $post;
		}

		if ( ! is_pro_active() ) {
			return [];
		}

		$date = get_the_date( 'Y/m/d', $post );

		$mp3_file_urls = get_post_meta( $post->ID, 'tts_mp3_file_urls' );


		$old_url = get_post_meta( $post->ID, 'tts_mp3_file_url', true );

		if ( $old_url ) {

			$mp3_file_urls = self::handle_old_url( $post, $mp3_file_urls, $old_url );
		}

		if ( isset( $mp3_file_urls[0] ) ) {

			$mp3_file_urls = $mp3_file_urls[0];
		}

		$final_mp3_file_ulrs = [];

		$should_update_urls = false;

		foreach ( $mp3_file_urls as $language_code => $url ) {

			if ( self::is_file_url_not_exists_and_is_file_empty( $url, $date, $file_name ) ) {

				$should_update_urls = true;
			} else {

				// Generate new singed url or backup only current post applicable url.
				if ( get_option( 'tts_is_backup_mp3_file' ) == 'true' && strtolower( $language_code ) == strtolower( $file_url_key ) ) {
					// previously generated mp3 file to 'TTA_Pro' folder but not backup to Google Cloud Storage.
					// $url = 'http://localhost/azizulhasan/tts/wp-content/uploads/TTA_Pro/gtts/2024/04/21/Hello_world__lang__en_us.mp3';
					$gcs_url = '';
					if ( strpos( $url, 'TTA_Pro' ) !== false ) {
						$full_path = self::get_path_from_url( $url );
						$gcs_url   = apply_filters( 'tts_upload_previous_file_to_gcs_and_get_new_url', $url, $full_path, $post, $language_code );
						if ( $gcs_url ) {
							$url = $gcs_url;
						}
					}

					if ( self::is_signed_url_expired( $url ) ) {
						// Get new signed url
						$gcs_new_signed_url = apply_filters( 'tts_get_gcs_new_signed_url', $url, $post );
						if ( $gcs_new_signed_url ) {
							$url = $gcs_new_signed_url;
						}
					}
				} elseif ( get_option( 'tts_is_backup_mp3_file' ) == 'false' && strtolower( $language_code ) == strtolower( $file_url_key ) && strpos( $url, 'https://storage.googleapis.com' ) !== false ) {
					$should_update_urls = true;
					continue;
				}


				$final_mp3_file_ulrs[ $language_code ] = $url;
			}
		}


		if ( $should_update_urls || empty( $final_mp3_file_ulrs ) ) {
			update_post_meta( $post->ID, 'tts_mp3_file_urls', $final_mp3_file_ulrs );
		}


		return \apply_filters( 'tts_mp3_file_urls', $final_mp3_file_ulrs, $post, $mp3_file_urls );
	}

	/**
	 * @param $url
	 *
	 * @return string
	 */
	public static function get_path_from_url( $url ) {
		$audio_dir     = TTA_PRO_GTTS_DIR;
		$audio_dir_url = TTA_PRO_GTTS_DIR_URL;

		if ( get_player_id() == 4 ) {
			$audio_dir     = TTA_PRO_AUDIO_DIR;
			$audio_dir_url = TTA_PRO_AUDIO_DIR_URL;
		}

		$log_data = apply_filters( 'tts_get_path_from_url', array(
			'url'  => $url,
			'path' => $audio_dir,
		) );


		// Extract the relative path from the full URL
		$relative_path = str_replace( $audio_dir_url, '', $log_data['url'] );

		// Construct the full path
		return rtrim( $log_data['path'], '/' ) . '/' . $relative_path;
	}


	/**
	 * Is plugin active
	 */
	public static function is_pro_active() {
		return is_pro_active();
	}

	public static function is_audio_folder_writable() {
		$upload_dir = wp_upload_dir();
		$base_dir   = $upload_dir['basedir'];

		if ( is_writable( $base_dir ) ) {
			return true;
		}

		return false;
	}

	public static function get_player_id() {
		$customize_settings                   = (array) TTA_Helper::tts_get_settings( 'customize' );
		$customize_settings['buttonSettings'] = isset( $customize_settings['buttonSettings'] ) ? (array) $customize_settings['buttonSettings'] : [ 'id' => 1 ];
		$player_id                            = isset( $customize_settings['buttonSettings']['id'] ) ? $customize_settings['buttonSettings']['id'] : 1;

		if ( ! self::is_pro_license_active() && $player_id > 1 ) {
			$player_id = 1;
		}

		return apply_filters( 'tts_get_player_id', $player_id, $customize_settings );
	}

	/**
	 * Is pro license active
	 */
	public static function is_pro_license_active() {
		if ( self::is_pro_active() ) {
			return apply_filters( 'tts_is_pro_license_active', false );
		}

		return false;
	}

	public static function set_default_settings() {
		$settings = (array) get_option( 'tta_settings_data' );
		if ( ! isset( $settings['tta__settings_enable_button_add'] ) ) {
			TTA_Activator::activate( true );
		}
	}

	public static function is_file_url_not_exists_and_is_file_empty( $url, $date, $file_name ) {
		$file_headers = @get_headers( $url );

		if ( ! $file_headers && function_exists( 'curl_init' ) ) {
			$ch = curl_init();
			curl_setopt( $ch, CURLOPT_URL, $url );
			curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
			curl_setopt( $ch, CURLOPT_HEADER, true );
			$file_headers = curl_exec( $ch );
			curl_close( $ch );
		}

		if ( isset( $file_headers[0] ) ) {
			$file_headers = $file_headers[0];
		}

		// If file backup is not enabled then check if file exists and file has content.
		if ( ! get_option( 'tts_is_backup_mp3_file' ) ) {
			$full_path = self::get_path_from_url( $url );
			if ( ! file_exists( $full_path ) || ( file_exists( $full_path ) && filesize( $full_path ) == 0 ) ) {
				return true;
			}
		}

		if ( ! $file_headers || strpos( $file_headers, 'Not Found' ) !== false ) {
			return true;
		}

		// Check if the file is exist in proper folder also check if the file name is same?
		if ( $date && $file_name ) {
			$url_file_name = explode( $date, $url );
			$url_file_name = isset( $url_file_name[1] ) ? trim( $url_file_name[1], "/\\" ) : false;

			if ( ! $url_file_name ) {
				return true;
			}

			if ( apply_filters( 'tts_should_match_filename_with_post_title', false ) ) {
				$url_file_basename     = explode( '__lang__', $url_file_name );
				$url_file_basename     = isset( $url_file_basename[0] ) ? trim( $url_file_basename[0] ) : false;
				$current_post_basename = explode( '__lang__', $file_name );
				$current_post_basename = isset( $current_post_basename[0] ) ? trim( $current_post_basename[0] ) : false;
				if ( ! is_string( $url_file_basename ) || ! is_string( $current_post_basename ) || $url_file_basename != $current_post_basename ) {
					return true;
				}
			}

		}


		return false;
	}

	/**
	 * Function to check if a signed URL has expired.
	 */
	public static function is_signed_url_expired( $signedUrl ) {
		// Parse the URL to get the query string
		$urlComponents = parse_url( $signedUrl );
		parse_str( $urlComponents['query'], $queryParameters );

		// Convert the expiration time to a Unix timestamp
		$expirationTimestamp = strtotime( $queryParameters['X-Goog-Date'] ) + $queryParameters['X-Goog-Expires'];


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
	public static function get_all_categories() {

		if ( ! function_exists( 'get_categories' ) ) {
			require_once ABSPATH . 'wp-includes/category.php';
		}

		// Fetch all categories.
		$categories = get_categories();
		// Initialize an empty array to hold the formatted categories.
		$formatted_categories = array();

		// Loop through each category and format the output.
		foreach ( $categories as $category ) {
			$formatted_categories[ $category->slug ] = $category->name;
		}

		return apply_filters( 'tts_get_all_categories', $formatted_categories );
	}

	/**
	 * Get all tags in a specific format.
	 *
	 * @return array An associative array with tag slugs as keys and tag names as values.
	 */
	public static function get_all_tags() {
		if ( ! function_exists( 'get_tags' ) ) {
			require_once ABSPATH . 'wp-includes/category.php';
		}
		// Fetch all tags.
		$tags = get_tags( array(
			'hide_empty' => false
		) );

		// Initialize an empty array to hold the formatted tags.
		$formatted_tags = array();

		// Loop through each tag and format the output.
		foreach ( $tags as $tag ) {
			$formatted_tags[ $tag->slug ] = $tag->name;
		}

		return apply_filters( 'get_all_tags', $formatted_tags );

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
	public static function clean_string( $inputString ) {
		$delimiter = \apply_filters( 'tts_sentence_delimiter', '.' );
		// Remove double delimiters separated by space
//		$spaceSeparatedDoubleDelimiterPattern = '/' . preg_quote( $delimiter ) . '\s+' . preg_quote( $delimiter ) . '/';
//		$cleanedString                        = preg_replace( $spaceSeparatedDoubleDelimiterPattern, $delimiter, $inputString );

		// Remove double delimiters (without space separation)
//		$doubleDelimiterPattern = '/' . preg_quote( $delimiter ) . '{2,}/';
//		$cleanedString          = preg_replace( $doubleDelimiterPattern, $delimiter, $cleanedString );

		// Remove extra spaces (more than one space)
		$cleanedString = preg_replace( '/\s{2,}/', ' ', $inputString );

		// Remove spaces before the delimiter and ensure one space after
		$spaceAroundDelimiterPattern = '/\s*' . preg_quote( $delimiter ) . '\s*/';
//		$cleanedString               = preg_replace( $spaceAroundDelimiterPattern, $delimiter . ' ', $inputString );

		// Remove extra newlines (more than one newline)
		$cleanedString = preg_replace( '/\n{2,}/', "\n", $cleanedString );

		// Trim leading and trailing whitespace
		$cleanedString = trim( $cleanedString );

		return $cleanedString;
	}


	public static function get_player_language_and_player_voice( $language, $voice, $plugin_all_settings, $post ) {
		return apply_filters( 'tts_player_language_and_player_voice', [
			'language' => $language,
			'voice'    => $voice
		], $plugin_all_settings, $post );
	}

	public static function is_edit_page() {
		global $pagenow;

		// Check if we are in the admin area and on the edit post/page screen
		if ( is_admin() ) {
			if ( $pagenow === 'post.php' || $pagenow === 'post-new.php' ) {
				return true;
			}
		}

		return false;
	}

	public static function is_text_to_audio_page() {
		// Ensure we are in the admin area
		if ( is_admin() ) {
			// Get the current screen object
			$screen = get_current_screen();
			// Check if we are on the "text-to-audio" page
			if ( $screen && $screen->id === 'toplevel_page_text-to-audio' ) {
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
	public static function get_text_value( $atts, $saved_texts, $key, $default, $text_domain ) {
		if ( isset( $atts[ $key ] ) && strlen( $atts[ $key ] ) ) {
			return esc_html( sanitize_text_field( $atts[ $key ] ) );
		} elseif ( isset( $saved_texts[ $key ] ) ) {
			return esc_html( sanitize_text_field( $saved_texts[ $key ] ) );
		} else {
			return __( $default, $text_domain );
		}
	}

	private static function get_all_acf_fields() {
		// Get all field groups
		$field_groups   = acf_get_field_groups();
		$all_acf_fields = [];
		if ( $field_groups ) {
			// Loop through each field group
			foreach ( $field_groups as $field_group ) {
				// Get all fields for the current field group
				$fields = acf_get_fields( $field_group['key'] );
				if ( $fields ) {
					// Loop through each field
					foreach ( $fields as $field ) {
						$all_acf_fields[ $field['name'] ] = $field['name'] . '::' . $field['label'];
					}
				}
			}
		}

		return $all_acf_fields;
	}

	public static function is_acf_active() {
		return function_exists( 'acf' );
	}

	public static function all_post_status() {
		$post_statuses = get_post_stati( [ 'show_in_admin_status_list' => true ], 'objects' );
		$status_array  = [];

		foreach ( $post_statuses as $status ) {
			$status_array[ $status->name ] = $status->label;
		}


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
	private static function display_player_based_on_user_role() {
		// Retrieve customization settings for the player
		$customize         = (array) self::tts_get_settings( 'customize' );
		$display_player_to = false;

		// Check if button settings exist
		if ( isset( $customize['buttonSettings'] ) ) {
			// Get current user and their roles
			$user      = wp_get_current_user();
			$user_role = ! empty( $user->roles ) ? $user->roles : [];

			// Safely retrieve button settings, avoid key error
			$button_settings         = (array) $customize['buttonSettings'];
			$display_player_to_roles = isset( $button_settings['display_player_to'] )
				? (array) $button_settings['display_player_to']
				: [];

			// If user roles are restricted and the 'all' role is not allowed
			if ( ! empty( $user_role ) && ! in_array( 'all', $display_player_to_roles ) ) {
				$has_any_role = false;
				// Check if the user has any of the allowed roles
				foreach ( $display_player_to_roles as $role ) {
					if ( in_array( $role, $user_role ) ) {
						$has_any_role = true;
						break; // Stop checking once a matching role is found
					}
				}

				// If no matching role is found, prevent player display
				if ( ! $has_any_role ) {
					$display_player_to = true;
				}
			} else {
				$display_player_to = true;
			}

			// If 'all' is included in the allowed roles display player.
			// or this "who_can_download_mp3_file" not exists to support already installed plugins.
			if ( in_array( 'all', $display_player_to_roles )
			     || ! isset( $button_settings['display_player_to'] )
			     || empty( $button_settings['display_player_to'] )
			 ) {
				$display_player_to = false;
			}
		}

		return $display_player_to;
	}


}
