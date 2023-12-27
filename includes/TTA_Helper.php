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
class TTA_Helper { 

    public static function should_load_button() {
        $should_load_button = false;
        // is_home() || is_archive() || is_front_page() || is_category()
        if(\is_single() || is_singular() ){
            $should_load_button = true;
        }
        $settings = tts_get_settings('settings');
        if(!isset($settings['tta__settings_allow_listening_for_post_types']) 
        || count($settings['tta__settings_allow_listening_for_post_types']) === 0
        || !is_array($settings['tta__settings_allow_listening_for_post_types'])
        || !in_array(self::tts_post_type(), $settings['tta__settings_allow_listening_for_post_types'])
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
        global  $post;
        return isset($post->post_type) ? $post->post_type : '';
    }


        /**
     * 
     */
    public static function remove_shortcodes( $content ) {
		if ( $content === '' ) {
			return '';
		}

		// $content = do_shortcode( $content );

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
	public static function sazitize_content( $output ) {

        // Format Output According to output type
        $output = self::tts_strip_all_tags( html_entity_decode( $output ) );

        // Remove ShortCodes
        $output = self::remove_shortcodes( $output );
        
        /**
         * Remove the url
         * @see https://gist.github.com/madeinnordeste/e071857148084da94891
         */
        $output = preg_replace('/\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i', '', $output);
		

		return $output;
	}

}