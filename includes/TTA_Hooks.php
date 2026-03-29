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
	private static $excludable_css_string = '';

	public function __construct() {
		// TODO it should work with new functionality
		add_action( 'add_meta_boxes', array( $this, 'add_custom_meta_box' ) );
		// Update hook
		add_action( 'upgrader_process_complete', [ $this, 'update_tts_default_data' ], 10, 2 );

		add_filter( 'tta_before_clean_content', [ $this, 'tta_before_clean_content_callback' ], 10 );
		add_filter( 'tta_after_clean_content', [ $this, 'tta_after_clean_content_callback' ], 10 );
		add_filter( 'tta__content_description', [ $this, 'tta__content_description_callback' ], 99, 4 );
		add_filter( 'tta_clean_content', [ $this, 'tta_clean_content_callback' ], 99 );

		// Cache data update.
		// Hook into category create, update, and delete actions
		add_action( 'create_category', [ 'TTA\TTA_Cache', 'update_cached_categories' ] );
		add_action( 'edit_category', [ 'TTA\TTA_Cache', 'update_cached_categories' ] );
		add_action( 'delete_category', [ 'TTA\TTA_Cache', 'update_cached_categories' ] );
		// Hook into tag create, update, and delete actions
		add_action( 'create_post_tag', [ 'TTA\TTA_Cache', 'update_cached_tags' ] );
		add_action( 'edit_post_tag', [ 'TTA\TTA_Cache', 'update_cached_tags' ] );
		add_action( 'delete_post_tag', [ 'TTA\TTA_Cache', 'update_cached_tags' ] );

		// Hook to update cache when any post is created or updated
		add_action( 'save_post', [ 'TTA\TTA_Cache', 'update_post_type_cache' ] );

		// Hook to update cache when any post is deleted
		add_action( 'delete_post', [ 'TTA\TTA_Cache', 'update_post_type_cache' ] );

		// Hook after any plugin is activated
		add_action( 'activated_plugin', [ $this, 'clear_necessary_cache' ], 10, 2 );

		// Hook after any plugin is deactivated
		add_action( 'deactivated_plugin', [ $this, 'clear_necessary_cache' ], 10, 2 );

		add_filter( 'tta__content_title', [ $this, 'tta__content_title_callback' ], 9999, 2 );

		// Cache/optimization plugin compatibility — single source for free + pro.
		$this->init_cache_compatibility();
	}

	/**
	 * Register exclusion filters for all known cache/optimization plugins.
	 *
	 * Pro plugin extends the exclusion arrays via 'tts_excludable_js_arr'
	 * and 'tts_excludable_css_arr' filters — no cache filters in Pro.
	 *
	 * @since 2.2.1
	 */
	private function init_cache_compatibility() {
		// ----- Build exclusion arrays (extensible by Pro via add_filter) -----

		self::$excludable_js_arr = apply_filters( 'tts_excludable_js_arr', [
			'TextToSpeech.min.js',
			'text-to-audio-button.min.js',
			'text-to-audio-dashboard-ui.min.js',
			'text-to-audio-pro-button.min.js',
			'tts-welcome-wizard.min.js',
			'tts-bulk-mp3-file.min.js',
			'tts-css-selectors.min.js',
			'AtlasVoiceAnalytics.min.js',
			'AtlasVoicePlayerInsights.min.js',
			'tts_button_settings',
			'tts_button_settings_1',
			'tts_button_settings_2',
			'tts_button_settings_3',
			'tts_button_settings_4',
			'NoSleep.min.js',
		] );

		self::$excludable_js_string = apply_filters(
			'tts_excludable_js_string',
			implode( ',', self::$excludable_js_arr )
		);

		self::$excludable_css_arr = apply_filters( 'tts_excludable_css_arr', [
			'plyr.min.css',
			'text-to-audio-pro.css',
		] );

		self::$excludable_css_string = apply_filters(
			'tts_excludable_css_string',
			implode( ',', self::$excludable_css_arr )
		);

		// ----- LiteSpeed Cache -----
		// @see https://docs.litespeedtech.com/lscache/lscwp/api/
		add_filter( 'litespeed_optimize_js_excludes', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'litespeed_optimize_css_excludes', [ $this, 'cache_exclude_css_text_to_speech' ] );
		add_filter( 'litespeed_optm_js_defer_exc', [ $this, 'cache_exclude_js_text_to_speech' ] );

		// ----- WP Rocket -----
		// @see https://docs.wp-rocket.me/
		add_filter( 'rocket_exclude_js', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'rocket_minify_excluded_external_js', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'rocket_delay_js_exclusions', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'rocket_exclude_defer_js', [ $this, 'rocket_defer_inline_exclusions_callback' ], 1000, 1 );
		add_filter( 'rocket_defer_inline_exclusions', [ $this, 'rocket_defer_inline_exclusions_callback' ], 1000, 1 );
		add_filter( 'rocket_excluded_inline_js_content', [ $this, 'rocket_defer_inline_exclusions_callback' ], 1000, 1 );
		add_filter( 'rocket_exclude_css', [ $this, 'cache_exclude_css_text_to_speech' ] );

		// ----- Autoptimize -----
		// @see https://wordpress.org/plugins/autoptimize/
		add_filter( 'autoptimize_filter_js_exclude', [ $this, 'autoptimize_filter_js_exclude_callback' ] );
		add_filter( 'autoptimize_filter_css_exclude', [ $this, 'autoptimize_filter_css_exclude_callback' ] );

		// ----- W3 Total Cache -----
		// @see https://wordpress.org/plugins/w3-total-cache/
		add_filter( 'w3tc_minify_js_do_tag_minification', [ $this, 'w3tc_minify_js_do_tag_minification_callback' ], 10, 3 );

		// ----- WP-Optimize -----
		// @see https://wordpress.org/plugins/wp-optimize/
		add_filter( 'wp-optimize-minify-default-exclusions', [ $this, 'cache_exclude_js_text_to_speech' ], 10, 1 );

		// ----- SiteGround SG Optimizer -----
		// @see https://www.siteground.com/tutorials/wordpress/speed-optimizer/custom-filters/
		add_filter( 'sgo_js_minify_exclude', [ $this, 'sgo_js_minify_exclude_callback' ], 10, 1 );
		add_filter( 'sgo_javascript_combine_exclude', [ $this, 'sgo_js_minify_exclude_callback' ], 10, 1 );
		add_filter( 'sgo_javascript_combine_excluded_external_paths', [ $this, 'sgo_js_minify_exclude_callback' ], 10, 1 );
		add_filter( 'sgo_js_async_exclude', [ $this, 'sgo_js_minify_exclude_callback' ], 10, 1 );
		add_filter( 'sgo_css_minify_exclude', [ $this, 'sgo_css_minify_exclude_callback' ], 10, 1 );
		add_filter( 'sgo_css_combine_exclude', [ $this, 'sgo_css_minify_exclude_callback' ], 10, 1 );

		// ----- Perfmatters -----
		// @see https://perfmatters.io/docs/filters/
		add_filter( 'perfmatters_minify_js_exclusions', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'perfmatters_defer_js_exclusions', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'perfmatters_delay_js_exclusions', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'perfmatters_minify_css_exclusions', [ $this, 'cache_exclude_css_text_to_speech' ] );

		// ----- Flying Press -----
		// @see https://docs.flyingpress.com/
		add_filter( 'flying_press_delay_js_exclude', [ $this, 'cache_exclude_js_text_to_speech' ] );
		add_filter( 'flying_press_defer_js_exclude', [ $this, 'cache_exclude_js_text_to_speech' ] );
	}

	/**
	 * Exclude JS files from cache/optimization (array-based).
	 * Used by: LiteSpeed, WP Rocket, WP-Optimize, Perfmatters, Flying Press.
	 *
	 * @param array|mixed $excluded_js_files Existing exclusions.
	 *
	 * @return array Merged exclusions.
	 */
	public function cache_exclude_js_text_to_speech( $excluded_js_files ) {
		if ( is_array( $excluded_js_files ) ) {
			return array_merge( $excluded_js_files, self::$excludable_js_arr );
		}

		return self::$excludable_js_arr;
	}

	/**
	 * Exclude CSS files from cache/optimization (array-based).
	 * Used by: LiteSpeed, WP Rocket, Perfmatters.
	 *
	 * @param array|mixed $excluded_css_files Existing exclusions.
	 *
	 * @return array Merged exclusions.
	 */
	public function cache_exclude_css_text_to_speech( $excluded_css_files ) {
		if ( is_array( $excluded_css_files ) ) {
			return array_merge( $excluded_css_files, self::$excludable_css_arr );
		}

		return self::$excludable_css_arr;
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
					TTA_Cache::delete( 'tts_rest_api_url' );
					TTA_Activator::create_analytics_table_if_not_exists();
					break;
				}
			}
		}

		if ( $options['type'] == 'plugin' ) {
			TTA_Cache::update_transient_during_plugins_crud();
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
		$plugin_name = __( 'AtlasVoice', 'text-to-audio' );
		if ( \is_pro_active() ) {
			$plugin_name = __( 'AtlasVoice Pro', 'text-to-audio' );
		}

		// TODO: make UI for this to display matabox widget.
		if ( TTA_Helper::should_load_button() || apply_filters( 'atlas_voice_display_metabox', false ) ) {
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


	}

	/**
	 * Add meta box for record, re-record, listen content with loud.
	 */
	public function atlasVoice_meta_box() {

		$customize = (array) get_option( 'tta_customize_settings' );

		// Button style.
		if ( isset( $customize ) && count( $customize ) ) {
			$btn_style = 'background-color:#184c53;color:#fff;border:0;border-radius:3px;';
		}
		$short_code = '[atlasvoice]';
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
	 * Autoptimize JS exclusion (comma-separated string).
	 *
	 * @param string $excluded_js_files Existing comma-separated exclusions.
	 *
	 * @return string
	 */
	public function autoptimize_filter_js_exclude_callback( $excluded_js_files ) {
		$excluded_js_files .= ', ' . self::$excludable_js_string;

		return $excluded_js_files;
	}

	/**
	 * Autoptimize CSS exclusion (comma-separated string).
	 *
	 * @param string $excluded_css_files Existing comma-separated exclusions.
	 *
	 * @return string
	 */
	public function autoptimize_filter_css_exclude_callback( $excluded_css_files ) {
		$excluded_css_files .= ', ' . self::$excludable_css_string;

		return $excluded_css_files;
	}

	/**
	 * WP Rocket inline script exclusions (array-based).
	 *
	 * @param array|mixed $excluded_patterns Existing exclusions.
	 *
	 * @return array Merged exclusions.
	 */
	public function rocket_defer_inline_exclusions_callback( $excluded_patterns ) {
		if ( is_array( $excluded_patterns ) ) {
			return array_merge( $excluded_patterns, self::$excludable_js_arr );
		}

		return self::$excludable_js_arr;
	}

	/**
	 * W3 Total Cache — skip minification for our JS files.
	 *
	 * @param bool   $do_tag_minification Whether to minify.
	 * @param string $script_tag          The script tag.
	 * @param string $file                The file path.
	 *
	 * @return bool|mixed
	 */
	public function w3tc_minify_js_do_tag_minification_callback( $do_tag_minification, $script_tag, $file ) {
		$basename = basename( $file );
		if ( in_array( $basename, self::$excludable_js_arr ) ) {
			return false;
		}

		return $do_tag_minification;
	}

	/**
	 * SG Optimizer JS exclusion (handle-based).
	 *
	 * @param array|mixed $excluded_js Existing exclusions.
	 *
	 * @return array|mixed
	 */
	public function sgo_js_minify_exclude_callback( $excluded_js ) {
		if ( ! is_array( $excluded_js ) ) {
			return $excluded_js;
		}

		return array_merge( $excluded_js, self::$excludable_js_arr );
	}

	/**
	 * SG Optimizer CSS exclusion (handle-based).
	 *
	 * @param array|mixed $excluded_css Existing exclusions.
	 *
	 * @return array|mixed
	 */
	public function sgo_css_minify_exclude_callback( $excluded_css ) {
		if ( ! is_array( $excluded_css ) ) {
			return $excluded_css;
		}

		return array_merge( $excluded_css, self::$excludable_css_arr );
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

    public function clear_necessary_cache($plugin, $network) {
		    TTA_Cache::update_transient_during_plugins_crud();
    }

	public function tta__content_title_callback($title, $post) {
		$settings = TTA_Helper::tts_get_settings( 'settings' );

		if(isset($settings['tta__settings_add_post_title_to_read']) && !$settings['tta__settings_add_post_title_to_read'] ) {
			$title = '';
		}

		return $title;
	}

}

new TTA_Hooks();