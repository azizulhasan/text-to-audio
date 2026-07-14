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
				"hoverBackgroundColor"   => "#000000",
				"hoverTextColor"         => "#ffffff",
				"width"                  => "100",
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
				// D26.8 — default selector points at the legacy wrapper class
				// emitted by Pro and (post-D26.7) Free, so a fresh install
				// extracts content out of the box without admin config.
				'tta__settings_css_selectors'                         => '[class*="tts_content_wrapper_"]',
				'tta__settings_exclude_content_by_css_selectors'      => '',
				'tta__settings_exclude_texts'                         => [],
				// TTS-238 D27.34 — default-skip these tag types out of the
				// box. Mirrors the picker's pre-checked checkbox set so a
				// fresh install never reads aside / figure / blockquote /
				// script / style aloud. Pipe-joined string to match the
				// canonical storage shape.
				'tta__settings_exclude_tags'                          => 'aside|figure|blockquote|pre|code|table|form|nav|footer|header|script|style',
				// D26.7 — wrapper opt-out flag. Default ON so the new default
				// selector above keeps working; admins on themes that break
				// on the wrapper can flip this off.
				'tta__settings_emit_legacy_wrapper'                   => true,
				'tta__settings_atlasvoice_per_type_overrides'         => [],
				"tta__settings_display_btn_icon"                      => true,
				"tta__settings_exclude_post_ids"                      => [],
				'tta__settings_stop_auto_playing_after_switching_tab' => true,
				'tta__settings_stop_auto_pause_after_switching_tab'   => true,
				'tta__settings_stop_floating_button'                  => true,
				'tta__settings_exclude_categories'                    => [],
				'tta__settings_exclude_wp_tags'                       => [],
				'tta__settings_clear_cache'                           => [],
				// TTS-255 — per-post player toggle in the admin bar ("Toggle
				// AtlasVoice audio player for this post"). OFF by default;
				// filter: tts_show_post_player_toggle.
				'tta__settings_show_admin_bar_toggle'                 => false,
				// TTS-255 — front-end on-page selector (Step Rail). OFF by
				// default; even when on it renders only via ?atlasvoice_picker=1,
				// never on a plain post URL. Filter: tts_enable_steprail.
				'tta__settings_enable_steprail'                       => false,
				// TTS-255 — admin-bar AtlasVoice production/staging indicator.
				// TTS-258: ON by default (still shown while the Step Rail UI is
				// open). Filter: tts_show_atlasvoice_mode_bar.
				'tta__settings_show_mode_bar'                         => true,
				'tta__settings_show_dashboard_widget'                 => true,
				'tta__settings_clear_all_cache'                       => true,
				'tta__settings_add_post_title_to_read'                => true,
				'tta__settings_add_post_excerpt_to_read'              => false,
				'tta__settings_text_after_content'					  => '',
				'tta__settings_text_before_content'					  => '',
				'tta__settings_read_content_from_dom'				  => true,
				'tta__settings_enable_tts_status'				      => true,
				// TTS-247 — fresh installs start in STAGING. Nothing
				// auto-generates or shows to visitors until the admin
				// verifies content via the step-rail picker and clicks
				// "Go Live". Existing installs are grandfathered to
				// 'production' by TTA_Activator::maybe_set_default_mode()
				// so their live players / MP3s never disappear on upgrade.
				'tta__settings_atlasvoice_mode'                       => 'staging',
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
			update_option( 'tta_analytics_settings', array(
				"tts_enable_analytics"       => true,
				// TTS-250: track every post by default (the "all" sentinel). The
				// free plugin used to default to the latest 20 posts and could
				// not track more — an artificial cap on a shipped feature
				// (wp.org Guideline 5). Free now honours "all".
				"tts_trackable_post_ids"     => array( 'all' ),
				// TTS-247: third-party IP geolocation (ip-api / ipinfo /
				// icanhazip) is opt-in per wp.org Guideline 7; default off.
				"tts_show_listener_location" => false,
			), false );
		}


		/**
		 * TTS-256 — read-along highlight settings (speechSynthesis players 1 & 2).
		 */
		if ( $renew_all_settings || ! get_option( 'tta_highlight_settings' ) ) {
			update_option( 'tta_highlight_settings', array(
				'tta__highlight_enabled'     => false,
				// Default to sentence — works with any voice/browser. Word-level
				// modes need a local voice that fires speechSynthesis boundaries.
				'tta__highlight_mode'        => 'sentence', // sentence | word | word_sentence
				'tta__highlight_word_bg'     => '#ffd54f',
				'tta__highlight_word_color'  => '#202124',
				'tta__highlight_sentence_bg' => '#fff3b0',
				'tta__highlight_dim_enabled' => true,
				'tta__highlight_dim_opacity' => 0.7, // a11y: keep dimmed text near 4.5:1

				'tta__highlight_autoscroll'  => true,
			), false );
		}

		self::create_analytics_table_if_not_exists();
		self::maybe_add_analytics_indexes();
	}

	/**
	 * TTS-247 — one-time backward-compat migration for the staging/live mode.
	 *
	 * The staging gate (TTA_Helper::should_load_button) hides the visitor
	 * player and blocks MP3 generation whenever the mode is not 'production'.
	 * Mode::get() defaults to 'staging' when the key is absent — so without
	 * this migration, EXISTING sites would lose their live player and stop
	 * generating audio the moment they upgrade.
	 *
	 * Rule: if the mode key is missing on an install that already has saved
	 * settings, it is an upgrade of a working site → grandfather it to
	 * 'production' so nothing changes for current users. Brand-new installs
	 * never reach this branch because TTA_Activator::activate() already wrote
	 * 'staging' into the default settings at activation time.
	 *
	 * Runs on every load but is a single guarded option read after the first
	 * pass (the `tta_mode_default_migrated` flag). Hooked early (plugins_loaded)
	 * so it lands before should_load_button runs on the same request — no
	 * visitor-facing regression window.
	 *
	 * @return void
	 */
	public static function maybe_set_default_mode() {
		if ( get_option( 'tta_mode_default_migrated' ) ) {
			return;
		}

		$opt = get_option( 'tta_settings_data' );
		// The dashboard stores tta_settings_data as a stdClass (json_decode),
		// so guard for both shapes — an is_array()-only check would skip the
		// grandfather on every real site and leave existing users stuck in
		// staging (no player). Normalise object -> array first.
		if ( is_object( $opt ) ) {
			$opt = json_decode( wp_json_encode( $opt ), true );
		}
		if ( is_array( $opt ) && ! array_key_exists( 'tta__settings_atlasvoice_mode', $opt ) ) {
			$opt['tta__settings_atlasvoice_mode'] = 'production';
			update_option( 'tta_settings_data', $opt );
			if ( class_exists( '\\TTA\\TTA_Cache' ) ) {
				\TTA\TTA_Cache::delete( 'all_settings' );
			}
		}

		update_option( 'tta_mode_default_migrated', true, false );
	}


	public static function create_analytics_table_if_not_exists() {

		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';
		$charset_collate = $wpdb->get_charset_collate();

		// TTS-236: Table schema now includes play_count column + index.
		// dbDelta will ADD the column to existing tables without dropping data.
		$sql = "CREATE TABLE $table_name (
	        id mediumint(9) NOT NULL AUTO_INCREMENT,
	        user_id VARCHAR(50) NOT NULL,
	        post_id bigint(20) NOT NULL,
	        analytics longtext NOT NULL,
	        other_data longtext DEFAULT NULL,
	        play_count int unsigned NOT NULL DEFAULT 0,
	        created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
	        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	        UNIQUE KEY id (id),
	        KEY idx_post_id (post_id),
	        KEY idx_created_at (created_at),
	        KEY idx_updated_at (updated_at),
	        KEY idx_play_count (play_count)
	    ) $charset_collate;";

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql );
		update_option( 'atlasvoice_analytics_table_is_created', true, false );

		// TTS-236: dbDelta is inconsistent about adding columns to existing tables.
		// As a safety net, explicitly ALTER the table to add play_count if missing.
		// Also add the index.
		if ( ! self::play_count_column_exists( true ) ) {
			// Suppress errors — we'll re-check below.
			$wpdb->hide_errors();
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$wpdb->query( "ALTER TABLE $table_name ADD COLUMN play_count INT UNSIGNED NOT NULL DEFAULT 0" );
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$wpdb->query( "ALTER TABLE $table_name ADD INDEX idx_play_count (play_count)" );
			$wpdb->show_errors();
			// Bust the cache so the next check re-reads from the DB.
			self::play_count_column_exists( true );
		}

		// TTS-236: Schedule background migration to populate play_count column
		// for existing rows (only if not already done).
		if ( ! get_option( 'tta_play_count_migration_done' ) ) {
			if ( ! wp_next_scheduled( 'tta_migrate_play_count_column' ) ) {
				wp_schedule_single_event( time() + 60, 'tta_migrate_play_count_column' );
			}
		}

		// TTS-249 (A1): migrate any previously-saved Custom CSS to WP core's
		// Additional CSS (the raw Custom CSS field was removed).
		self::migrate_custom_css_to_additional_css();
	}

	/**
	 * TTS-249 (A1): one-time migration of the removed Custom CSS field.
	 *
	 * The Customize tab no longer exposes a raw Custom CSS textarea (wp.org no
	 * longer permits persisting arbitrary CSS). Any value a site already saved in
	 * `tta_customize_settings['custom_css']` is appended, once, to the active
	 * theme's Additional CSS (Appearance → Customize → Additional CSS) via WP
	 * core's sanctioned, sanitized store — so existing users don't lose styling.
	 * The Free player now renders in the light DOM, so that CSS reaches it.
	 *
	 * The original option value is preserved in the DB (not deleted) as a backup;
	 * it is simply no longer read or echoed by the plugin.
	 */
	public static function migrate_custom_css_to_additional_css() {
		// Run once per site.
		if ( get_option( 'tta_custom_css_migrated' ) ) {
			return;
		}

		$customize = get_option( 'tta_customize_settings' );
		// Settings can be stored as an object (json_decode) or array; normalise.
		$saved_css = '';
		if ( is_object( $customize ) && isset( $customize->custom_css ) ) {
			$saved_css = (string) $customize->custom_css;
		} elseif ( is_array( $customize ) && isset( $customize['custom_css'] ) ) {
			$saved_css = (string) $customize['custom_css'];
		}

		$saved_css = trim( $saved_css );

		if ( '' !== $saved_css && function_exists( 'wp_update_custom_css_post' ) ) {
			$existing = (string) wp_get_custom_css();
			$marker   = "\n\n/* Migrated from AtlasVoice Custom CSS (v2.2.2) */\n";

			// Avoid duplicating the migrated block if this somehow runs twice.
			if ( false === strpos( $existing, trim( $marker ) ) ) {
				wp_update_custom_css_post( $existing . $marker . $saved_css );
			}
		}

		// Flag set regardless of whether there was CSS, so we never re-scan.
		update_option( 'tta_custom_css_migrated', true, false );
	}

	/**
	 * TTS-236: Check if the play_count column exists in the analytics table.
	 *
	 * Uses a per-request cache. Pass $refresh=true to force a re-check
	 * (e.g., after dbDelta has run).
	 *
	 * @param bool $refresh Force a fresh SHOW COLUMNS query.
	 * @return bool
	 */
	public static function play_count_column_exists( $refresh = false ) {
		global $wpdb;
		$table = $wpdb->prefix . 'atlasvoice_analytics';

		// Use a static cache per-request to avoid repeated SHOW COLUMNS queries.
		static $exists = null;
		if ( $exists !== null && ! $refresh ) {
			return $exists;
		}

		if ( ! self::is_table_exists() ) {
			$exists = false;
			return false;
		}

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
		$column = $wpdb->get_results( $wpdb->prepare(
			"SHOW COLUMNS FROM {$table} LIKE %s",
			'play_count'
		) );
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
		$exists = ! empty( $column );
		return $exists;
	}

	/**
	 * TTS-236: Run one batch of the play_count migration.
	 *
	 * Reads 500 rows at a time via WHERE id > $last_id (index-based pagination).
	 * For each row: unserialize analytics, extract play.count, update the
	 * play_count column, increment the running counter.
	 *
	 * Scheduled via WP-Cron. Each batch schedules the next until done.
	 *
	 * @return void
	 */
	public static function migrate_play_count_batch() {
		global $wpdb;
		$table = $wpdb->prefix . 'atlasvoice_analytics';

		if ( ! self::is_table_exists() ) {
			update_option( 'tta_play_count_migration_done', true, false );
			return;
		}

		// If the column doesn't exist, try to create it once more via dbDelta + ALTER.
		if ( ! self::play_count_column_exists() ) {
			self::create_analytics_table_if_not_exists();
			// Re-check (force refresh — the static cache may have stale false).
			if ( ! self::play_count_column_exists( true ) ) {
				// Migration impossible without the column. Still populate the
				// counter via PHP scan (guarded by size).
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$row_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" );
				$max_rows  = (int) apply_filters( 'tta_total_plays_scan_row_limit', 5000 );
				if ( $row_count <= $max_rows ) {
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
					$rows  = $wpdb->get_col( "SELECT analytics FROM {$table}" );
					$total = 0;
					if ( $rows ) {
						foreach ( $rows as $raw ) {
							$data = maybe_unserialize( $raw );
							if ( is_array( $data ) && isset( $data['play']['count'] ) ) {
								$total += (int) $data['play']['count'];
							}
						}
					}
					update_option( 'tta_total_plays_counter', $total, false );
					update_option( 'tta_total_plays_fallback', $total, false );
				}
				update_option( 'tta_play_count_migration_done', true, false );
				return;
			}
		}

		$last_id    = (int) get_option( 'tta_play_count_migration_last_id', 0 );
		$batch_size = (int) apply_filters( 'tta_play_count_migration_batch_size', 500 );

		// Read next chunk by ID (not OFFSET — OFFSET is O(N) on large tables).
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
		$rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT id, analytics FROM {$table} WHERE id > %d AND play_count = 0 ORDER BY id ASC LIMIT %d",
			$last_id,
			$batch_size
		) );
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter

		if ( empty( $rows ) ) {
			// Done. Reconcile the running counter with the column sum.
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$total = (int) $wpdb->get_var( "SELECT COALESCE(SUM(play_count), 0) FROM {$table}" );
			update_option( 'tta_total_plays_counter', $total, false );
			update_option( 'tta_total_plays_fallback', $total, false );
			update_option( 'tta_play_count_migration_done', true, false );
			delete_option( 'tta_play_count_migration_last_id' );
			delete_transient( 'tta_milestone_total_plays' );
			return;
		}

		$batch_total     = 0;
		$max_id_in_batch = $last_id;
		foreach ( $rows as $row ) {
			$data  = maybe_unserialize( $row->analytics );
			$count = ( is_array( $data ) && isset( $data['play']['count'] ) )
				? (int) $data['play']['count']
				: 0;

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->update(
				$table,
				array( 'play_count' => $count ),
				array( 'id' => $row->id ),
				array( '%d' ),
				array( '%d' )
			);

			$batch_total += $count;
			$max_id_in_batch = max( $max_id_in_batch, (int) $row->id );
		}

		update_option( 'tta_play_count_migration_last_id', $max_id_in_batch, false );

		// Increment the running counter by this batch's total.
		if ( class_exists( '\\TTA\\TTA_Helper' ) && $batch_total > 0 ) {
			TTA_Helper::increment_total_plays_counter( $batch_total );
		}

		// Schedule the next batch.
		if ( ! wp_next_scheduled( 'tta_migrate_play_count_column' ) ) {
			wp_schedule_single_event( time() + 30, 'tta_migrate_play_count_column' );
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
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
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
				// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$wpdb->query(
					"ALTER TABLE `{$table_name}` ADD INDEX `{$index_name}` (`{$column_name}`)"
				);
				// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,PluginCheck.Security.DirectDB.UnescapedDBParameter
			}
		}

		update_option( 'tta_analytics_indexes_added', true, false );
	}

	private static function is_table_exists() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange
		if ( ! $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $table_name ) ) ) == $table_name ) {
			return false;
		}

		return true;
	}


}
