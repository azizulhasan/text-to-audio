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

}