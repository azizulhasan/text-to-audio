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
class TTA_Activator {

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function activate( $renew_all_settings = false ) {
		/**
		 * Set activation redirect transient on first activation.
		 * This triggers a one-time redirect to the settings page.
		 */
		if ( ! get_option( 'tta_has_been_activated_before', false ) ) {
			set_transient( 'tta_activation_redirect', true, 60 );
			update_option( 'tta_has_been_activated_before', true, false );
		}

		// Store activation timestamp for smart review notice timing.
		if ( ! get_option( 'tta_activated_at' ) ) {
			update_option( 'tta_activated_at', time(), false );
		}

		/**
		 * Customization settings.
		 */
		if ( $renew_all_settings || ! get_option( 'tta_customize_settings' ) ) {
			update_option( 'tta_customize_settings', array
			(
				"backgroundColor"        => "#ffffff",
				"color"                  => "#000000",
				"hoverTextColor"         => "#000000",
				"width"                  => "100",
				'custom_css'             => '',
				'tta_play_btn_shortcode' => '[atlasvoice]',
				'buttonSettings'         => [
					'id'                         => 1,
					'button_position'            => 'before_content',
					'display_player_to'          => [ 'all' ],
					'who_can_download_mp3_file'  => [ 'all' ],
					'generate_mp3_date_from' => '',
					'generate_mp3_date_to'   => ''
				],
				'height'                 => '50',
				'border'                 => '2',
				'border_color'           => '#000000',
				'fontSize'               => '20',
				'borderRadius'           => '10',
                'marginTop'              => '0',
                'marginBottom'           => '0',
                'marginLeft'             => '0',
                'marginRight'            => '0',
			) );

		}

		/**
		 * Text To Audio settings.
		 */
		if ( $renew_all_settings || ! get_option( 'tta_settings_data' ) ) {
			update_option( 'tta_settings_data', array
			(
				'tta__settings_enable_button_add'                     => true,
				'tta__settings_apply_number_format'                   => false,
				"tta__settings_allow_listening_for_post_types"        => [ 'post' ],
				"tta__settings_allow_listening_for_posts_status"      => [ 'publish' ],
				'tta__settings_css_selectors'                         => '',
				'tta__settings_exclude_content_by_css_selectors'      => '',
				'tta__settings_exclude_texts'                         => [],
				'tta__settings_exclude_tags'                          => [],
				"tta__settings_display_btn_icon"                      => true,
				"tta__settings_exclude_post_ids"                      => [],
				'tta__settings_stop_auto_playing_after_switching_tab' => true,
				'tta__settings_stop_auto_pause_after_switching_tab'   => true,
				'tta__settings_stop_floating_button'                  => true,
				'tta__settings_exclude_categories'                    => [],
				'tta__settings_exclude_wp_tags'                       => [],
				'tta__settings_clear_cache'                           => [],
				'tta__settings_show_admin_bar_toggle'                 => true,
				'tta__settings_show_dashboard_widget'                 => true,
				'tta__settings_clear_all_cache'                       => true,
				'tta__settings_add_post_title_to_read'                => true,
				'tta__settings_add_post_excerpt_to_read'              => false,
				'tta__settings_text_after_content'					  => '',
				'tta__settings_text_before_content'					  => '',
				'tta__settings_read_content_from_dom'				  => true,
				'tta__settings_player_use_old_player'				  => false,
				'tta__settings_enable_tts_status'				      => true,
			) );
		}


		/**
		 * Listening settings.
		 * Auto-detect voice/language based on WordPress locale.
		 */
		if ( $renew_all_settings || ! get_option( 'tta_listening_settings' ) ) {
			$locale    = get_locale();
			$voice_map = array(
				'en_US' => array( 'Google US English', 'en-US' ),
				'en_GB' => array( 'Google UK English Female', 'en-GB' ),
				'en_AU' => array( 'Google UK English Female', 'en-GB' ),
				'fr_FR' => array( 'Google français', 'fr-FR' ),
				'de_DE' => array( 'Google Deutsch', 'de-DE' ),
				'es_ES' => array( 'Google español', 'es-ES' ),
				'it_IT' => array( 'Google italiano', 'it-IT' ),
				'pt_BR' => array( 'Google português do Brasil', 'pt-BR' ),
				'ja'    => array( 'Google 日本語', 'ja-JP' ),
				'ko_KR' => array( 'Google 한국의', 'ko-KR' ),
				'zh_CN' => array( 'Google 普通话（中国大陆）', 'zh-CN' ),
				'zh_TW' => array( 'Google 國語（臺灣）', 'zh-TW' ),
				'nl_NL' => array( 'Google Nederlands', 'nl-NL' ),
				'ru_RU' => array( 'Google русский', 'ru-RU' ),
				'hi_IN' => array( 'Google हिन्दी', 'hi-IN' ),
				'id_ID' => array( 'Google Bahasa Indonesia', 'id-ID' ),
				'pl_PL' => array( 'Google polski', 'pl-PL' ),
			);
			$voice_defaults = isset( $voice_map[ $locale ] ) ? $voice_map[ $locale ] : array( 'Google UK English Female', 'en-GB' );

			update_option( 'tta_listening_settings', array(
				'tta__listening_voice'  => $voice_defaults[0],
				'tta__listening_pitch'  => 1,
				'tta__listening_rate'   => 1,
				'tta__listening_volume' => 1,
				'tta__listening_lang'   => $voice_defaults[1],
			), false );
		}


		/**
		 * Recording settings.
		 */
		if ( $renew_all_settings || ! get_option( 'tta_record_settings' ) ) {
			update_option( 'tta_record_settings', array
			(
				"is_record_continously"   => true,
				"tta__recording__lang"    => "en-US",
				"tta__sentence_delimiter" => ".",
			), false );
		}


		// Button listen text.
		$listen_text = __( "Listen", 'text-to-audio' );
		$pause_text  = __( 'Pause', 'text-to-audio' );
		$resume_text = __( 'Resume', 'text-to-audio' );
		$replay_text = __( 'Replay', 'text-to-audio' );
		$start_text  = __( 'Start', 'text-to-audio' );
		$stop_text   = __( 'Stop', 'text-to-audio' );

		if ( $renew_all_settings || ! get_option( 'tta__button_text_arr' ) ) {
			update_option( 'tta__button_text_arr', [
				'listen_text' => $listen_text,
				'pause_text'  => $pause_text,
				'resume_text' => $resume_text,
				'replay_text' => $replay_text,
				'start_text'  => $start_text,
				'stop_text'   => $stop_text,
			] );
		}

//		if ( get_transient( 'tts_all_settings' ) ) {
//			\TTA_Cache::delete( 'all_settings' );
//		}

		/**
		 * analytics settings.
		 */
		if ( $renew_all_settings || ! get_option( 'tta_analytics_settings' ) ) {
			$latest_post_ids = get_posts( array(
				'posts_per_page' => 20,
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'fields'         => 'ids',
				'orderby'        => 'date',
				'order'          => 'DESC',
			) );

			update_option( 'tta_analytics_settings', array(
				"tts_enable_analytics"   => true,
				"tts_trackable_post_ids" => $latest_post_ids,
			), false );
		}


		self::create_analytics_table_if_not_exists();
		self::maybe_add_analytics_indexes();
	}


	public static function create_analytics_table_if_not_exists() {

		if ( ! self::is_table_exists() ) {
			global $wpdb;
			$table_name = $wpdb->prefix . 'atlasvoice_analytics';

			$charset_collate = $wpdb->get_charset_collate();

			$sql = "CREATE TABLE $table_name (
	        id mediumint(9) NOT NULL AUTO_INCREMENT,
	        user_id VARCHAR(50) NOT NULL,
	        post_id bigint(20) NOT NULL,
	        analytics longtext NOT NULL,
	        other_data longtext DEFAULT NULL,
	        created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
	        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	        UNIQUE KEY id (id),
	        KEY idx_post_id (post_id),
	        KEY idx_created_at (created_at),
	        KEY idx_updated_at (updated_at)
	    ) $charset_collate;";

			require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
			dbDelta( $sql );
			update_option( 'atlasvoice_analytics_table_is_created', true, false );
		}

	}

	/**
	 * Add indexes to the analytics table for existing installations.
	 *
	 * Uses CREATE INDEX IF NOT EXISTS (MySQL 8.0+ / MariaDB 10.1.4+).
	 * Falls back silently on older versions where the index already exists.
	 *
	 * @since 2.2.0
	 */
	public static function maybe_add_analytics_indexes() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';

		if ( ! self::is_table_exists() ) {
			return;
		}

		// Check if indexes have already been added to avoid running on every activation.
		if ( get_option( 'tta_analytics_indexes_added', false ) ) {
			return;
		}

		// Retrieve existing indexes on the table.
		$existing_indexes = array();
		$index_results    = $wpdb->get_results( "SHOW INDEX FROM `{$table_name}`", ARRAY_A );
		if ( is_array( $index_results ) ) {
			foreach ( $index_results as $row ) {
				$existing_indexes[] = $row['Key_name'];
			}
		}

		$indexes_to_add = array(
			'idx_post_id'    => 'post_id',
			'idx_created_at' => 'created_at',
			'idx_updated_at' => 'updated_at',
		);

		foreach ( $indexes_to_add as $index_name => $column_name ) {
			if ( ! in_array( $index_name, $existing_indexes, true ) ) {
				$wpdb->query(
					"ALTER TABLE `{$table_name}` ADD INDEX `{$index_name}` (`{$column_name}`)"
				);
			}
		}

		update_option( 'tta_analytics_indexes_added', true, false );
	}

	private static function is_table_exists() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';
		$query      = $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $table_name ) );

		if ( ! $wpdb->get_var( $query ) == $table_name ) {
			return false;
		}

		return true;
	}


}
