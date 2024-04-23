<?php

namespace TTA;

use ParagonIE\Sodium\Core\Curve25519\Fe;

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

	public static function should_load_button() {
		$should_load_button = false;
		global $post;
		// is_home() || is_archive() || is_front_page() || is_category()
		if(\is_single() || \is_singular() ){
			$should_load_button = true;
		}

		$settings = self::tts_get_settings('settings');
		$ids = [];
		if(isset($settings['tta__settings_exclude_post_ids']) && is_array($settings['tta__settings_exclude_post_ids'])) {
			$ids = $settings['tta__settings_exclude_post_ids'];
		}
		if(!function_exists('is_user_logged_in')) {
			include_once WPINC . '/pluggable.php';
		}
		
		$should_display_button_based_on_user_logged_user = true;
		if(isset($settings['tta__settings_display_button_if_user_logged_in']) && $settings['tta__settings_display_button_if_user_logged_in'] ) {
			if(!is_user_logged_in()) {
				$should_display_button_based_on_user_logged_user = false;
			}
		}

		if(!isset($settings['tta__settings_allow_listening_for_post_types'])
		   || count($settings['tta__settings_allow_listening_for_post_types']) === 0
		   || !is_array($settings['tta__settings_allow_listening_for_post_types'])
		   || !in_array(self::tts_post_type(), $settings['tta__settings_allow_listening_for_post_types'])
		   || in_array($post->ID, $ids)
		   || !$should_display_button_based_on_user_logged_user

		) {
			$should_load_button = false;
		}

		return apply_filters('tta_should_load_button', $should_load_button);
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

	public static function  get_compatible_plugins_data() {
		$compatible_plugins_data = [];
		$datas = [
			'gtranslate/gtranslate.php' => [
				'type' => 'class',
				'data' => [ 'gt_options', 'gt_languages','gt_switcher_wrapper', 'gt_selector', ],//  'gt_selector',], // 'gt_white_content', 'gtranslate_wrapper'],
				'plugin' => 'gtranslate'
			],
			'sitepress-multilingual-cms/sitepress.php' => [
				'type' => 'class',
				'data' => [ ],
				'plugin' => 'sitepress'
			],
		];

		if(!function_exists('is_plugin_active')) {
			require_once \ABSPATH . 'wp-admin/includes/plugin.php';
		}

		foreach ( $datas as $plugin_name =>  $data ){
			if(is_plugin_active($plugin_name )) {
				$compatible_plugins_data[ $plugin_name ] = $data;
			}
		}

		return \apply_filters('tts_compatible_plugins_data', $compatible_plugins_data, \get_plugins());
	}

	// public static function get_language_code_from_url($url) {
	// 	$arr = explode('lang', $url);
	// 	$language_code = end($arr);
	// 	$language_code = str_replace('__', '',$language_code);
	// 	$language_code = explode('.', $language_code)[0];
	// 	$language_code = \str_replace('_', '-', $language_code);

	// 	return $language_code;
	// }

	public static function get_language_code_from_url( $url ) {
		$arr           = explode( 'lang', $url );
		$language_code = end( $arr );
		if(self::get_player_id() != 4 ) {
			$language_code = str_replace( '__', '', $language_code );
		}
		$language_code = explode( '.', $language_code )[0];
		$language_code = \str_replace( '_', '-', $language_code );
		if(self::get_player_id() == 4 ) {
			$language_code = substr($language_code, 2);
		}
		return $language_code;
	}


	public static function tts_site_language($plugin_all_settings) {
		// TODO: Match with multilinguage UI and default language.
		$default_language = $plugin_all_settings['listening']['tta__listening_lang'];
		// $default_language = str_replace(['-', ' '], '_', $default_language);
		$default_language = strtolower($default_language);

		return apply_filters('tts_site_language', $default_language);
	}

	public static function tts_get_file_url_key($language, $voice) {
		$file_url_key = $language;
		if(get_player_id() == 4 && $voice) {
			$voice = strtolower($voice);
			$file_url_key .= '--voice--'.$voice;
		}

		return $file_url_key;
	}

	public static function tts_get_voice( $plugin_all_settings ) {
		// TODO: Match with multilingual UI and default voice.
		$default_voice = '';
		if ( isset( $plugin_all_settings['listening']['tta__listening_voice'] ) && get_player_id() == 4 ) {
			$default_voice = $plugin_all_settings['listening']['tta__listening_voice'];
		}

		return apply_filters( 'tts_get_voice', $default_voice );
	}

	public static function tts_file_name( $title, $selectedLang, $voice = '' ) {

		if ( ! $title ) {
			$title = 'Demo Content';
		}

		$lang_code = explode( '-', str_replace( [ '_', ' ' ], '-', $selectedLang ) );

		if ( array_shift( $lang_code ) == 'en' ) {
			$title .= "__lang__" . strtolower( $selectedLang );
			$title = str_replace( [ ' ', '-' ], '_', $title );
			$title = preg_replace( "/[^\p{L}a-z0-9_-]/ui", "", $title );
		} else {
			$md5_hash = md5( $title );
			$title    = $md5_hash . '_' . time() . '__lang__' . $selectedLang;
		}

		if(get_player_id() == 4 && $voice ) {
			$voice = strtolower( $voice );
			$title .= '__voice__'.$voice;
		}

		return $title;
	}

	public static function handle_old_url($post, $new_urls, $old_url) {
		$associative_urls = [];
		if(isset($new_urls[0])) {
			$associative_urls = $new_urls[0];
		}else{
			$associative_urls = $new_urls;
		}

		if($old_url) {
			$language_code = self::get_language_code_from_url($old_url);
			if(!array_key_exists($language_code, $associative_urls)) {
				$associative_urls[$language_code] = $old_url;
				update_post_meta($post->ID, 'tts_mp3_file_urls', $associative_urls);
				delete_post_meta($post->ID, 'tts_mp3_file_url');
			}
		}

		return $associative_urls;

	}

	public static function tts_get_settings($identifier = '') {

		$all_settings_data = [];
		$cached_settings = get_transient('tts_all_settings');
		if(!$cached_settings) {
			$all_settings = [
				'tta_listening_settings' => 'listening',
				'tta_settings_data' => 'settings',
				'tta_record_settings' => 'recording',
				'tta_customize_settings' => 'customize',
			];

			foreach($all_settings as $settings_key => $identifier) {
				$settings = get_option($settings_key);
				$settings = ! $settings ? false : (array) $settings ;
				$all_settings_data[$identifier] = $settings;
			}

			set_transient('tts_all_settings', $all_settings_data);

		}else{
			$all_settings_data = $cached_settings;
		}

		if($identifier) {
			$specified_identifier_data = isset($all_settings_data[$identifier]) ? $all_settings_data[$identifier] : $all_settings_data;
			$all_settings_data = $specified_identifier_data;
		}
		global $post;

		return \apply_filters('tts_get_settings', $all_settings_data, $post);
	}

	public static function get_mp3_file_urls_old($post = '') {// TODO: when google cloud TTS is applied. the mp3 file path will be different.
		if(!$post) {
			global $post;
		}




		$mp3_file_urls = get_post_meta($post->ID, 'tts_mp3_file_urls');
		$old_url = get_post_meta($post->ID, 'tts_mp3_file_url', true);

		if(is_pro_active() && $old_url) {
			$mp3_file_urls = self::handle_old_url($post, $mp3_file_urls, $old_url);
		}

		if(isset($mp3_file_urls[0])) {
			$mp3_file_urls = $mp3_file_urls[0];
		}
		$final_mp3_file_ulrs = [];
		$should_update_urls = \false;
		foreach($mp3_file_urls as $language_code =>  $url ) {
			$file_headers = @get_headers($url);

			if(self::is_pro_active()) {
				$full_path = self::get_path_from_url($url);
				if( file_exists($full_path) && filesize($full_path) == 0) {
					$should_update_urls = true;
					continue;
				}
			}

			if(!$file_headers || strpos( $file_headers[0], 'Not Found')  !== false ) {
				$should_update_urls = true;
			} else {
				$final_mp3_file_ulrs[$language_code] = $url;
			}
		}

		if ( $should_update_urls || empty( $final_mp3_file_ulrs ) ) {
			update_post_meta( $post->ID, 'tts_mp3_file_urls', $final_mp3_file_ulrs );
		}

		if( $should_update_urls || empty( $final_mp3_file_ulrs ) ) {
			update_post_meta($post->ID, 'tts_mp3_file_urls', $final_mp3_file_ulrs);
		}

		return \apply_filters('tts_mp3_file_urls', $final_mp3_file_ulrs, $post);
	}

	public static function get_mp3_file_urls($post = '') {// TODO: when google cloud TTS is applied. the mp3 file path will be different.

		if(!$post) {

			global $post;

		}



		$mp3_file_urls = get_post_meta($post->ID, 'tts_mp3_file_urls');

		$old_url = get_post_meta($post->ID, 'tts_mp3_file_url', true);



		if(is_pro_active() && $old_url) {

			$mp3_file_urls = self::handle_old_url($post, $mp3_file_urls, $old_url);

		}



		if(isset($mp3_file_urls[0])) {

			$mp3_file_urls = $mp3_file_urls[0];

		}

		$final_mp3_file_ulrs = [];

		$should_update_urls = \false;

		foreach($mp3_file_urls as $language_code =>  $url ) {

			$file_headers = @get_headers($url);


			if (!$file_headers && function_exists('curl_init')) {
				$ch = curl_init();
				curl_setopt($ch, CURLOPT_URL, $url);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
				curl_setopt($ch, CURLOPT_HEADER, true);
				$file_headers = curl_exec($ch);
				curl_close($ch);
			}

			if(isset($file_headers[0])) {
				$file_headers = $file_headers[0];
			}

			if(self::is_pro_active()) {

				$full_path = self::get_path_from_url($url);



				if( !file_exists($full_path) || (file_exists($full_path) && filesize($full_path) == 0) ) {

					$should_update_urls = true;

					continue;

				}

			}

			if(!$file_headers || strpos($file_headers, 'Not Found')  !== false ) {

				$should_update_urls = true;

			} else {

				$final_mp3_file_ulrs[$language_code] = $url;

			}

		}


		if( $should_update_urls || empty( $final_mp3_file_ulrs ) ) {

			// update_post_meta($post->ID, 'tts_mp3_file_urls', $final_mp3_file_ulrs);

		}



		return \apply_filters('tts_mp3_file_urls', $final_mp3_file_ulrs, $post);

	}

	/**
	 * @param $url
	 *
	 * @return string
	 */
	public static function get_path_from_url($url) {
		$audio_dir = TTA_PRO_GTTS_DIR;
		$replaceable_string = '/wp-content/uploads/TTA_Pro/gtts/';
		if(get_player_id() == 4){
			$audio_dir = TTA_PRO_AUDIO_DIR;
			$replaceable_string = '/wp-content/uploads/TTA_Pro/';
		}

		$log_data = array(
			'url' => $url,
			'path' => $audio_dir,
			'home_url' => home_url(),
		);
		// Extract the relative path from the full URL
		$relative_path = str_replace($log_data['home_url'] . $replaceable_string, '', $log_data['url']);

		// Construct the full path
		return  rtrim($log_data['path'], '/') . '/' . $relative_path;
	}


	/**
	 * Is plugin active
	 */
	public static function is_pro_active() {

		if(!function_exists('is_plugin_active') ){
			include_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$status = is_plugin_active('text-to-speech-pro/text-to-audio-pro.php');

		if($status) return true;

		$status = is_plugin_active('text-to-speech-pro-premium/text-to-audio-pro.php');

		if($status) return true;


		return is_plugin_active('text-to-audio-pro/text-to-audio-pro.php');
	}

	public static function is_audio_folder_writable() {
		$upload_dir             = wp_upload_dir();
		$base_dir               = $upload_dir['basedir'];

		if ( is_writable( $base_dir ) ) {
			return true;
		}
		return false;
	}

	public static function get_player_id() {
		$customize_settings = (array) TTA_Helper::tts_get_settings('customize');
		$customize_settings['buttonSettings'] = isset( $customize_settings['buttonSettings'] ) ? (array) $customize_settings['buttonSettings'] : [ 'id' => 1];
		$player_id = isset($customize_settings['buttonSettings']['id']) ? $customize_settings['buttonSettings']['id'] : 1;

		if(!self::is_pro_license_active() && $player_id >  1) {
			$player_id = 1;
		}

		return apply_filters('tts_get_player_id', $player_id, $customize_settings);
	}

	/**
	 * Is pro license active
	 */
	public static function is_pro_license_active() {
		if(self::is_pro_active()){
			return apply_filters('tts_is_pro_license_active', false);
		}

		return false;
	}


}