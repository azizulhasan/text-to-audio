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
        if(\is_single() ){
            $should_load_button = true;
        }

        return apply_filters('tta_should_load_button', $should_load_button);
    }
}