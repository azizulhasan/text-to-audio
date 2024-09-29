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
class TTA_Hooks {

	private static $excludable_js_arr = [];
	private static $excludable_js_string = '';
	private static $excludable_css_arr = [];

	public function __construct() {
		// TODO it should work with new functionality
		add_action( 'add_meta_boxes', array( $this, 'add_custom_meta_box' ) );

		// Update hook
		add_action( 'upgrader_process_complete', [ $this, 'update_tts_default_data' ], 10, 2 );

		self::$excludable_js_arr = apply_filters( 'tts_excludable_js_arr', [
			'TextToSpeech.min.js',
			'text-to-audio-button.min.js',
			'text-to-audio-dashboard-ui.min.js',
			'AtlasVoiceAnalytics.min.js',
			'AtlasVoicePlayerInsights.min.js',
			'tts_button_settings',
			'tts_button_settings_1',
			'tts_button_settings_2',
			'tts_button_settings_3',
			'tts_button_settings_4',
			'NoSleep.min.js'
		] );

		$strings = implode( ',', self::$excludable_js_arr );

		self::$excludable_js_string = apply_filters( 'tts_excludable_js_string', $strings );

		// Autoptimize Plugin
		add_filter( 'autoptimize_filter_js_exclude', [ $this, 'autoptimize_filter_js_exclude_callback' ] );

		// LiteSpeed Cache
		add_filter( 'litespeed_optimize_js_excludes', [ $this, 'cache_exclude_js_text_to_speech' ] );

		// WP Rocket
		add_filter( 'rocket_exclude_js', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'rocket_minify_excluded_external_js', [ $this, 'cache_exclude_js_text_to_speech' ] );

		// WP Rocket inline script exclusions
		add_filter( 'rocket_defer_inline_exclusions', [ $this, 'rocket_defer_inline_exclusions_callback' ], 1000, 1 );
		add_filter( 'rocket_exclude_defer_js', [ $this, 'rocket_defer_inline_exclusions_callback' ], 1000, 1 );
		add_filter( 'rocket_excluded_inline_js_content', [
			$this,
			'rocket_defer_inline_exclusions_callback'
		], 1000, 1 );

		// W3 Total Cache
		add_filter( 'w3tc_minify_js_do_tag_minification', [
			$this,
			'w3tc_minify_js_do_tag_minification_callback'
		], 10, 3 );

		// WP Optimize
		add_filter( 'wp-optimize-minify-default-exclusions', [ $this, 'cache_exclude_js_text_to_speech' ], 10, 1 );

		// Siteground SG Optimize
		add_filter( 'sgo_js_minify_exclude', [ $this, 'sgo_js_minify_exclude_callback' ], 10, 1 );
		add_filter( 'sgo_javascript_combine_exclude', [ $this, 'sgo_js_minify_exclude_callback' ], 10, 1 );
		add_filter( 'sgo_javascript_combine_excluded_external_paths', [
			$this,
			'sgo_js_minify_exclude_callback'
		], 10, 1 );

		add_filter( 'tta_before_clean_content', [ $this, 'tta_before_clean_content_callback' ], 10 );

		add_filter( 'tta_after_clean_content', [ $this, 'tta_after_clean_content_callback' ], 10 );

		add_filter( 'tta__content_description', [ $this, 'tta__content_description_callback' ], 99, 4 );


		add_filter( 'tta_clean_content', [ $this, 'tta_clean_content_callback' ], 99 );


		self::$excludable_css_arr = apply_filters( 'tts_excludable_css_arr', [
			'plyr.min.css',
			'text-to-audio-pro.css',
		] );

		// WP Rocket
		add_filter( 'rocket_exclude_css', [ $this, 'cache_exclude_css_text_to_speech' ] );

	}

	/**
	 * @param $excluded_css_files
	 *
	 * @return mixed
	 */
	public function cache_exclude_css_text_to_speech( $excluded_css_files ) {
		$new_arr = self::$excludable_css_arr;
		if ( is_array( $excluded_css_files ) ) {
			$new_arr = array_merge( $excluded_css_files, self::$excludable_css_arr );
		}

		return $new_arr;
	}


	/**
	 * Upgrader process complete.
	 *
	 * @param \WP_Upgrader $upgrader_object
	 * @param array $hook_extra
	 *
	 * @see \WP_Upgrader::run() (wp-admin/includes/class-wp-upgrader.php)
	 * @see https://wordpress.stackexchange.com/questions/144870/wordpress-update-plugin-hook-action-since-3-9
	 */
	public function update_settings_data( \WP_Upgrader $upgrader_object, $hook_extra ) {
		// get current plugin version. ( https://wordpress.stackexchange.com/a/18270/41315 )
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		}
		// https://developer.wordpress.org/reference/functions/get_plugin_data/
		$plugin_data    = get_plugin_data( TEXT_TO_AUDIO_ROOT_FILE );
		$plugin_version = ( $plugin_data['Version'] ?? 'unknown.version' );
		unset( $plugin_data );

		if (
			is_array( $hook_extra ) &&
			array_key_exists( 'action', $hook_extra ) &&
			$hook_extra['action'] == 'update'
		) {
			if (
				array_key_exists( 'type', $hook_extra ) &&
				$hook_extra['type'] == 'plugin'
			) {
				// if updated the plugins.
				$this_plugin         = plugin_basename( TEXT_TO_AUDIO_ROOT_FILE );
				$this_plugin_updated = false;
				if ( array_key_exists( 'plugins', $hook_extra ) ) {
					// if bulk plugin update (in update page)
					foreach ( $hook_extra['plugins'] as $each_plugin ) {
						if ( $each_plugin === $this_plugin ) {
							$this_plugin_updated = true;
							break;
						}
					}// endforeach;
					unset( $each_plugin );
				} elseif ( array_key_exists( 'plugin', $hook_extra ) ) {
					// if normal plugin update or via auto update.
					if ( $this_plugin === $hook_extra['plugin'] ) {
						$this_plugin_updated = true;
					}
				}
				if ( $this_plugin_updated === true ) {
					// if this plugin is just updated.
					// do your task here.
					// DON'T process anything from new version of code here, because it will work on old version of the plugin.
					// please read again!! the code run here is not new (just updated) version but the version before that.

					//

					$settings = (array) get_option( 'tta_settings_data', [] );
					$data     = (object) array_merge( $settings, array(
						'tta__settings_enable_button_add'              => true,
						"tta__settings_allow_listening_for_post_types" => [ 'post' ],
						"tta__settings_display_btn_icon"               => '',
					) );

					update_option( 'tta_settings_data', $data );
				}
			} elseif (
				array_key_exists( 'type', $hook_extra ) &&
				$hook_extra['type'] == 'theme'
			) {
				// if updated the themes.
				// same as plugin, the bulk theme update will be set the name in $hook_extra['themes'] as 'theme1', 'theme2'.
				// normal update or via auto update will be set the name in $hook_extra['theme'] as 'theme1'.
			}
		}// endif; $hook_extra
	}

	/**
	 * Upgrader process complete.
	 *
	 * @param \WP_Upgrader $upgrader_object
	 * @param array $hook_extra
	 *
	 * @see \WP_Upgrader::run() (wp-admin/includes/class-wp-upgrader.php)
	 * @see https://wordpress.stackexchange.com/questions/144870/wordpress-update-plugin-hook-action-since-3-9
	 */
	public function update_tts_default_data( $upgrader_object, $options ) {
		$text_to_audio = 'text-to-audio';
		// If an update has taken place and the updated type is plugins and the plugins element exists
		if ( $options['action'] == 'update' && $options['type'] == 'plugin' && isset( $options['plugins'] ) ) {
			foreach ( $options['plugins'] as $plugin ) {
				// Check to ensure it's my plugin
				if ( $plugin == $text_to_audio ) {
					TTA_Activator::create_analytics_table_if_not_exists();
					delete_transient( 'tts_all_settings' );
					break;
				}
			}
		}

	}

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function activate() {
		// do something here
	}

	/**
	 * Register MetaBox to add PDF Download Button
	 */
	public function add_custom_meta_box() {
		$plugin_name = 'Text To Speech TTS';
		if ( \is_pro_active() ) {
			$plugin_name = 'Text To Speech Pro';
		}
		add_meta_box(
			'atlasVoice-meta-box',
			$plugin_name,
			array(
				$this,
				'atlasVoice_meta_box',
			),
			get_current_screen()->post_type,
			'advanced',
			'high',
			null
		);

	}

	/**
	 * Add meta box for record, re-record, listen content with loud.
	 */
	public function atlasVoice_meta_box() {

		// $listening = (array) get_option('tta_listening_settings');
		// $listening = json_encode($listening);
		$customize = (array) get_option( 'tta_customize_settings' );
		// $button_text_arr =  apply_filters( 'tta__button_text_arr', get_option( 'tta__button_text_arr') );

		// Button style.
		if ( isset( $customize ) && count( $customize ) ) {
			$btn_style = 'background-color:#184c53;color:#fff;border:0;border-radius:3px;';
		}
		$short_code = '[tta_listen_btn]';
		if ( isset( $customize['tta_play_btn_shortcode'] ) && '' != $customize['tta_play_btn_shortcode'] ) {
			$short_code = $customize['tta_play_btn_shortcode'];
		}
		\do_action( 'tts_before_metabox_content' );
		?>
        <div class="tta_metabox">

            <input
                    type="text"
                    name="tta_play_btn_shortcode"
                    id="tta_play_btn_shortcode"
                    value="<?php echo esc_attr( $short_code ) ?>"
                    title="Short code"
            />

            <!-- Copy Button -->
            <button type="button" id="tta_play_btn_shortcode_copy_button"
                    style='<?php echo esc_attr( $btn_style ); ?>;cursor: copy;margin-top:10px;padding:6px;'>
                <span class="dashicons dashicons-admin-page"></span>
            </button>
            <div id="atlasVoice_analytics"></div>
        </div>
		<?php
		\do_action( 'tts_after_metabox_content' );
	}


	/**
	 * Autoptimize Plugin
	 *
	 * @param $excluded_js_files
	 *
	 * @return string
	 * @see: https://wordpress.org/plugins/autoptimize/
	 */
	public function autoptimize_filter_js_exclude_callback( $excluded_js_files ) {

		$excluded_js_files .= ', ' . self::$excludable_js_string;

		return $excluded_js_files;
	}

	/**
	 * @param $excluded_js_files
	 *
	 * @return mixed
	 *
	 * @see: https://wordpress.org/plugins/litespeed-cache/
	 * @see: https://wordpress.org/plugins/wp-optimize/
	 */
	public function cache_exclude_js_text_to_speech( $excluded_js_files ) {
		$new_arr = [];
		if ( is_array( $excluded_js_files ) ) {
			$new_arr = array_merge( $excluded_js_files, self::$excludable_js_arr );
		} else {
			$new_arr = self::$excludable_js_arr;
		}

		return $new_arr;
	}

	/**
	 * WP Rocket inline script exclusions
	 *
	 * @param $excluded_patterns
	 *
	 * @return string[]
	 */
	public function rocket_defer_inline_exclusions_callback( $excluded_patterns ) {
		$new_arr = [];
		if ( is_array( $excluded_patterns ) ) {
			$new_arr = array_merge( $excluded_patterns, self::$excludable_js_arr );
		} else {
			$new_arr = self::$excludable_js_arr;
		}

		return $new_arr;

	}


	/**
	 * @param $do_tag_minification
	 * @param $script_tag
	 * @param $file
	 *
	 * @return false|mixed
	 *
	 * @see: https://wordpress.org/plugins/w3-total-cache/
	 */
	public function w3tc_minify_js_do_tag_minification_callback( $do_tag_minification, $script_tag, $file ) {
		$basename = basename( $file );
		if ( in_array( $basename, self::$excludable_js_arr ) ) {
			return false;
		}

		return $do_tag_minification;
	}

	/**
	 * @param $excluded_js
	 *
	 * @return array|mixed
	 * @see: https://wordpress.org/plugins/sg-cachepress/
	 */
	public function sgo_js_minify_exclude_callback( $excluded_js ) {
		if ( ! is_array( $excluded_js ) ) {
			return $excluded_js;
		}

		global $wp_scripts;
		$registered_handles = array_keys( $wp_scripts->registered );
		// foreach($registered_handles as $handle) {
		//     error_log(print_r($handle,1));
		// 	if(in_array($handle, self::$excludable_js_arr)) {
		// 		$excluded_js[] = $handle;
		// 	}

		// }

		return $excluded_js;
	}


	public function test() {

	}

	/**
	 * Add a delimiter after specific tags in the HTML string.
	 *
	 * @param string $htmlString The input HTML string.
	 * @param array $tags The array of tags to add delimiter after.
	 * @param string $delimiter The delimiter to add.
	 *
	 * @return string The modified HTML string.
	 */
	public function tta_before_clean_content_callback( $htmlString ) {
		$tags      = apply_filters( 'tts_delimiter_addable_tags', [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ] );
		$delimiter = \apply_filters( 'tts_sentence_delimiter', '.' );
		// Iterate through each tag
		foreach ( $tags as $tag ) {
			// Create a regex pattern to match the closing tag
			$pattern = sprintf( '/(<\/\s*%s\s*>)(?!\s*%s)/i', $tag, preg_quote( $delimiter, '/' ) );

			// Replace each closing tag with the tag followed by the delimiter if it doesn't already have it
			$htmlString = preg_replace( $pattern, '$1' . $delimiter, $htmlString );
		}

		return apply_filters( 'tta_pro_before_clean_content', $htmlString );
	}

	/**
	 * removing only the last delimiter in a sequence of two or more delimiters (with or without spaces between them),
	 * while preserving the first one and ensuring a space after it
	 *
	 * @return string The modified HTML string.
	 */
	public function tta_after_clean_content_callback( $content ) {
//        second one
		// Define the delimiters
		$delimiters = [ '\.', ',', '\?', '!', '\|', ';', ':', '¿', '¡', '،', '؟' ];

		// Build a regular expression pattern to match multiple delimiters (with or without spaces) and keep only the first one
		$pattern = '/([' . implode( '', $delimiters ) . '])\s*([' . implode( '', $delimiters ) . '])+(\s*)/';

		// Replace the matched pattern with the first delimiter and ensure there is a space after it
		return preg_replace( $pattern, '$1 ', $content );
	}


	public function tta__content_description_callback( $description_sanitized, $description, $post_id, $post ) {
		// ACF plugin compatible.
		$compatible_data = TTA_Helper::tts_get_settings( 'compatible' );
		if ( TTA_Helper::is_acf_active() && ! TTA_Helper::is_pro_active() && isset( $compatible_data['tts_acf_fields'] ) && count( $compatible_data['tts_acf_fields'] ) ) {
			$selected_acf_fields = $compatible_data['tts_acf_fields'];

			$fields = get_field_objects( $post_id );

			// Check if there are any fields
			if ( $fields && $selected_acf_fields ) {
				// Display the fields
				$counter = 0;
				foreach ( $fields as $field_name => $field ) {
					if ( in_array( $field_name, $selected_acf_fields ) ) {
						if ( is_string( $field['value'] ) ) {
							$description_sanitized .= ' ' . $field['value'];
							$counter ++;
						}
					}
					if ( $counter > 0 ) {
						break;
					}
				}
			}
		}

		if ( ! TTA_Helper::is_pro_active() && ! empty( $compatible_data ) && count( $compatible_data ) ) {
			$description_sanitized = $this->tta_clean_content_callback( $description_sanitized );
		}

		return $description_sanitized;
	}

	public function tta_clean_content_callback( $content_sanitized ) {
		// Aliases
		$alias_data = (array) TTA_Helper::tts_get_settings( 'aliases' );
		if ( ! TTA_Helper::is_pro_active() && ! empty( $alias_data ) && count( $alias_data ) ) {
			$counter = 0;
			foreach ( $alias_data as $index => $alias ) {
				$alias = (array) $alias;
				if ( isset( $alias['actual_text'] ) && isset( $alias['to_read'] ) ) {
					$content_sanitized = str_replace( $alias['actual_text'], $alias['to_read'], $content_sanitized );
					$counter ++;
				}
				if ( $counter > 0 ) {
					break;
				}
			}
		}

		return $content_sanitized;
	}

}

new TTA_Hooks();