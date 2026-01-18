<?php
namespace TTA;
/**
 * Define the internationalization functionality
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    TTA
 * @subpackage TTA/includes
 */

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/includes
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class TTA_i18n {

    /**
     * Load the plugin text domain for translation.
     *
     * @since    1.0.0
     */
    public function load_plugin_textdomain() {

        $plugin_rel_path = dirname(dirname(plugin_basename(__FILE__))) . '/languages/';
//        error_log(print_r($plugin_rel_path, true));
//        load_plugin_textdomain(
//            'text-to-audio',
//            false,
//            $plugin_rel_path
//        );

    }
    public static function get_default_labels(): array
    {
        return [
            'common' => [
                'save' => __( 'Save', 'text-to-audio' ),
            ],
            'aliases' => [
                'title' => __( 'Text to Speech Aliases', 'text-to-audio' ),
                'add_new_row' => __( 'Add New Row', 'text-to-audio' ),
                'actual_text' => __( 'Actual Text', 'text-to-audio' ),
                'to_read' => __( 'To Read', 'text-to-audio' ),
                'all_fields_required' => __( 'All fields must be filled!', 'text-to-audio' ),
                'successfully_saved' => __( 'Successfully Saved.', 'text-to-audio' ),
                'more_than_one_alias_pro' => __( 'More than 1 alias is available in the pro version. Please', 'text-to-audio' ),
                'buy_pro_version' => __( 'Buy Pro version', 'text-to-audio' ),
                'click_to_know_how_it_works' => __( 'Click To Know How It Works?', 'text-to-audio' ),
            ]
        ];
    }

}
