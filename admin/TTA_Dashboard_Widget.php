<?php

namespace TTA_Admin;

// TTS-247: prevent direct file access (wp.org Plugin Check requirement).
defined( 'ABSPATH' ) || exit;

use TTA\TTA_Helper;

/**
 * Dashboard Widget for AtlasVoice Quick Stats.
 *
 * Displays play/view counts and a 7-day mini bar chart
 * on the WordPress admin dashboard.
 *
 * @since 2.2.0
 */
class TTA_Dashboard_Widget {

	/**
	 * Transient key for cached widget data.
	 */
	const CACHE_KEY = 'atlasvoice_widget_data';

	/**
	 * Cache duration in seconds (5 minutes).
	 */
	const CACHE_TTL = 300;

	/**
	 * Register the dashboard widget hook.
	 */
	public function __construct() {
		add_action( 'wp_dashboard_setup', [ $this, 'register_widget' ] );
	}

	/**
	 * Register the dashboard widget.
	 */
	public function register_widget() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$settings     = TTA_Helper::tts_get_settings( 'settings' );
		$show_widget  = isset( $settings['tta__settings_show_dashboard_widget'] ) ? $settings['tta__settings_show_dashboard_widget'] : true;
		if ( ! $show_widget ) {
			return;
		}

		wp_add_dashboard_widget(
			'atlasvoice_quick_stats',
			__( 'AtlasVoice — Quick Stats', 'text-to-audio' ),
			[ $this, 'render' ]
		);
	}

	/**
	 * Render the widget HTML.
	 */
	public function render() {
		if ( ! $this->table_exists() ) {
			echo '<p>' . esc_html__( 'Analytics data is not available yet. Start using the player to see stats here.', 'text-to-audio' ) . '</p>';
			return;
		}

		$data    = $this->get_data();
		// TTS-250: $is_pro is used ONLY to decide whether to show the optional
		// "Upgrade to Pro" pointer at the bottom (an allowed up-sell under
		// Guideline 5/11). It no longer gates any statistic — every stat below is
		// computed and shown for all users.
		$is_pro  = TTA_Helper::is_atlasvoice_addon_functional();

		$plays_today    = $data['plays_today'];
		$views_today    = $data['views_today'];
		$chart_data     = $data['chart']; // array of 7 items: [ ['label'=>'Mon','plays'=>X], ... ]
		$max_plays      = max( 1, max( array_column( $chart_data, 'plays' ) ) );

		$listen_minutes = isset( $data['listen_seconds_today'] ) ? round( $data['listen_seconds_today'] / 60 ) : 0;
		$top_post_title = isset( $data['top_post_title'] ) ? $data['top_post_title'] : '';

		?>
		<div style="margin:0 -12px;">
			<!-- Stat cards -->
			<div style="display:flex;gap:12px;margin-bottom:16px;padding:0 12px;">
				<div style="flex:1;background:#f6f7f7;border-radius:4px;padding:14px 16px;text-align:center;">
					<div style="font-size:28px;font-weight:600;color:#2271b1;line-height:1.2;"><?php echo esc_html( number_format_i18n( $plays_today ) ); ?></div>
					<div style="font-size:12px;color:#50575e;margin-top:4px;"><?php echo esc_html__( 'Plays Today', 'text-to-audio' ); ?></div>
				</div>
				<div style="flex:1;background:#f6f7f7;border-radius:4px;padding:14px 16px;text-align:center;">
					<div style="font-size:28px;font-weight:600;color:#2271b1;line-height:1.2;"><?php echo esc_html( number_format_i18n( $views_today ) ); ?></div>
					<div style="font-size:12px;color:#50575e;margin-top:4px;"><?php echo esc_html__( 'Views Today', 'text-to-audio' ); ?></div>
				</div>
					<div style="flex:1;background:#f6f7f7;border-radius:4px;padding:14px 16px;text-align:center;">
						<div style="font-size:28px;font-weight:600;color:#2271b1;line-height:1.2;"><?php echo esc_html( number_format_i18n( $listen_minutes ) ); ?></div>
						<div style="font-size:12px;color:#50575e;margin-top:4px;"><?php echo esc_html__( 'Min Listened', 'text-to-audio' ); ?></div>
					</div>
			</div>

			<?php if ( $top_post_title ) : ?>
				<div style="padding:0 12px;margin-bottom:16px;">
					<div style="font-size:12px;color:#50575e;margin-bottom:2px;"><?php echo esc_html__( 'Top Post Today', 'text-to-audio' ); ?></div>
					<div style="font-size:13px;font-weight:500;color:#1d2327;"><?php echo esc_html( $top_post_title ); ?></div>
				</div>
			<?php endif; ?>

			<!-- 7-day bar chart -->
			<div style="padding:0 12px;margin-bottom:12px;">
				<div style="font-size:12px;color:#50575e;margin-bottom:8px;"><?php echo esc_html__( 'Last 7 Days', 'text-to-audio' ); ?></div>
				<div style="display:flex;align-items:flex-end;gap:6px;height:60px;">
					<?php foreach ( $chart_data as $day ) :
						$pct = ( $day['plays'] / $max_plays ) * 100;
						$bar_height = max( 4, round( $pct * 0.6 ) ); // min 4px so empty days are visible
					?>
						<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">
							<div style="width:100%;background:#2271b1;border-radius:2px 2px 0 0;height:<?php echo esc_attr( $bar_height ); ?>px;" title="<?php echo esc_attr( $day['plays'] . ' ' . __( 'plays', 'text-to-audio' ) ); ?>"></div>
						</div>
					<?php endforeach; ?>
				</div>
				<div style="display:flex;gap:6px;margin-top:4px;">
					<?php foreach ( $chart_data as $day ) : ?>
						<div style="flex:1;text-align:center;font-size:10px;color:#50575e;"><?php echo esc_html( $day['label'] ); ?></div>
					<?php endforeach; ?>
				</div>
			</div>

			<!-- Links -->
			<div style="display:flex;gap:16px;padding:0 12px;margin-bottom:4px;">
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=text-to-audio#/analytics' ) ); ?>" style="font-size:13px;">
					<?php echo esc_html__( 'View Analytics', 'text-to-audio' ); ?>
				</a>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=text-to-audio#/customize' ) ); ?>" style="font-size:13px;">
					<?php echo esc_html__( 'Customize Player', 'text-to-audio' ); ?>
				</a>
			</div>

			<?php if ( ! $is_pro ) : ?>
				<div style="padding:8px 12px 0;border-top:1px solid #dcdcde;margin-top:8px;">
					<p style="font-size:12px;color:#50575e;margin:0;">
						<?php
						printf(
							/* translators: %s: link to Pro pricing page */
							esc_html__( 'Unlock device, browser & location analytics, CSV/PDF export, and scheduled email reports — %s', 'text-to-audio' ),
							'<a href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/" target="_blank">' . esc_html__( 'Upgrade to Pro', 'text-to-audio' ) . '</a>'
						);
						?>
					</p>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Get widget data, cached in a transient.
	 *
	 * @return array
	 */
	private function get_data() {
		$cached = get_transient( self::CACHE_KEY );
		// Only use cache if it has meaningful data (not all zeros).
		if ( false !== $cached && ( $cached['plays_today'] > 0 || $cached['views_today'] > 0 ) ) {
			return $cached;
		}

		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';
		$today      = current_time( 'Y-m-d' );

		$plays_today          = 0;
		$views_today          = 0;
		$listen_seconds_today = 0;
		$top_post_title       = '';
		$chart                = [];

		// TTS-236: Prefer DB-side aggregation via the indexed play_count column.
		// Falls back to the old PHP scan only on small tables where it's safe.
		$has_play_count_column = class_exists( '\\TTA\\TTA_Activator' )
			&& \TTA\TTA_Activator::play_count_column_exists();

		if ( $has_play_count_column ) {
			// Plays today — one query, one value, zero PHP memory.
			// {$table_name} is internal whitelisted (wpdb prefix + 'atlasvoice_analytics'); user-input flows through %s/%d placeholders.
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$plays_today = (int) $wpdb->get_var( $wpdb->prepare(
				"SELECT COALESCE(SUM(play_count), 0) FROM {$table_name} WHERE DATE(updated_at) = %s",
				$today
			) );
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter

			// TTS-250: Top post today — computed for ALL users (no Pro gate). DB-side GROUP BY.
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$top = $wpdb->get_row( $wpdb->prepare(
				"SELECT post_id, SUM(play_count) AS total_plays
				 FROM {$table_name}
				 WHERE DATE(updated_at) = %s
				 GROUP BY post_id
				 ORDER BY total_plays DESC
				 LIMIT 1",
				$today
			) );
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			if ( $top && $top->total_plays > 0 ) {
				$top_post_title = get_the_title( (int) $top->post_id );
				if ( empty( $top_post_title ) ) {
					$top_post_title = '#' . (int) $top->post_id;
				}
			}

			// 7-day chart — one query, GROUP BY date.
			$chart_start = gmdate( 'Y-m-d', strtotime( '-6 days', strtotime( current_time( 'Y-m-d' ) ) ) );
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$chart_rows  = $wpdb->get_results( $wpdb->prepare(
				"SELECT DATE(updated_at) AS day, SUM(play_count) AS plays
				 FROM {$table_name}
				 WHERE DATE(updated_at) >= %s
				 GROUP BY DATE(updated_at)
				 ORDER BY day ASC",
				$chart_start
			) );
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$chart_map = [];
			if ( $chart_rows ) {
				foreach ( $chart_rows as $r ) {
					$chart_map[ $r->day ] = (int) $r->plays;
				}
			}
			for ( $i = 6; $i >= 0; $i-- ) {
				$date  = gmdate( 'Y-m-d', strtotime( "-{$i} days", strtotime( current_time( 'Y-m-d' ) ) ) );
				$label = date_i18n( 'D', strtotime( $date ) );
				$chart[] = [
					'label' => $label,
					'plays' => isset( $chart_map[ $date ] ) ? (int) $chart_map[ $date ] : 0,
				];
			}

			// views_today and listen_seconds_today are still in the serialized column.
			// Guard with a row-count check to prevent memory exhaustion.
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$today_row_count = (int) $wpdb->get_var( $wpdb->prepare(
				"SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s",
				$today
			) );
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$max_rows = (int) apply_filters( 'tta_dashboard_widget_row_limit', 5000 );
			if ( $today_row_count <= $max_rows ) {
				// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$today_rows = $wpdb->get_results( $wpdb->prepare(
					"SELECT analytics FROM {$table_name} WHERE DATE(updated_at) = %s",
					$today
				) );
				// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
				if ( $today_rows ) {
					foreach ( $today_rows as $row ) {
						$analytics = maybe_unserialize( $row->analytics );
						if ( ! is_array( $analytics ) ) {
							continue;
						}
						$views_today          += isset( $analytics['init']['count'] ) ? (int) $analytics['init']['count'] : 0;
						$listen_seconds_today += isset( $analytics['time']['count'] ) ? (int) $analytics['time']['count'] : 0;
					}
				}
			}
		} else {
			// TTS-236: Fallback for pre-migration tables — row-count guarded PHP scan.
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$today_row_count = (int) $wpdb->get_var( $wpdb->prepare(
				"SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s",
				$today
			) );
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
			$max_rows = (int) apply_filters( 'tta_dashboard_widget_row_limit', 5000 );

			if ( $today_row_count > $max_rows ) {
				// Too many rows — skip the scan to prevent memory exhaustion.
				// Schedule migration so the column becomes available next time.
				if ( ! wp_next_scheduled( 'tta_migrate_play_count_column' ) ) {
					wp_schedule_single_event( time() + 60, 'tta_migrate_play_count_column' );
				}
			} else {
				// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$today_rows = $wpdb->get_results( $wpdb->prepare(
					"SELECT post_id, analytics FROM {$table_name} WHERE DATE(updated_at) = %s",
					$today
				) );
				// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter

				$post_plays = [];

				if ( $today_rows ) {
					foreach ( $today_rows as $row ) {
						$analytics = maybe_unserialize( $row->analytics );
						if ( ! is_array( $analytics ) ) {
							continue;
						}

						$play_count = isset( $analytics['play']['count'] ) ? (int) $analytics['play']['count'] : 0;
						$init_count = isset( $analytics['init']['count'] ) ? (int) $analytics['init']['count'] : 0;
						$time_count = isset( $analytics['time']['count'] ) ? (int) $analytics['time']['count'] : 0;

						$plays_today          += $play_count;
						$views_today          += $init_count;
						$listen_seconds_today += $time_count;

						$pid = (int) $row->post_id;
						if ( ! isset( $post_plays[ $pid ] ) ) {
							$post_plays[ $pid ] = 0;
						}
						$post_plays[ $pid ] += $play_count;
					}
				}

				if ( ! empty( $post_plays ) ) {
					arsort( $post_plays );
					$top_post_id    = key( $post_plays );
					$top_post_title = get_the_title( $top_post_id );
					if ( empty( $top_post_title ) ) {
						$top_post_title = '#' . $top_post_id;
					}
				}
			}

			// 7-day chart (old path) — skip on large tables.
			for ( $i = 6; $i >= 0; $i-- ) {
				$date  = gmdate( 'Y-m-d', strtotime( "-{$i} days", strtotime( current_time( 'Y-m-d' ) ) ) );
				$label = date_i18n( 'D', strtotime( $date ) );

				$day_plays = 0;
				// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$day_row_count = (int) $wpdb->get_var( $wpdb->prepare(
					"SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s",
					$date
				) );
				// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter

				if ( $day_row_count <= $max_rows ) {
					// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
					$day_rows = $wpdb->get_results( $wpdb->prepare(
						"SELECT analytics FROM {$table_name} WHERE DATE(updated_at) = %s",
						$date
					) );
					// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
					if ( $day_rows ) {
						foreach ( $day_rows as $row ) {
							$analytics = maybe_unserialize( $row->analytics );
							if ( is_array( $analytics ) && isset( $analytics['play']['count'] ) ) {
								$day_plays += (int) $analytics['play']['count'];
							}
						}
					}
				}

				$chart[] = [
					'label' => $label,
					'plays' => $day_plays,
				];
			}
		}

		$data = [
			'plays_today'          => $plays_today,
			'views_today'          => $views_today,
			'listen_seconds_today' => $listen_seconds_today,
			'top_post_title'       => $top_post_title,
			'chart'                => $chart,
		];

		set_transient( self::CACHE_KEY, $data, self::CACHE_TTL );

		return $data;
	}

	/**
	 * Check if the analytics table exists.
	 *
	 * @return bool
	 */
	private function table_exists() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';
		// $query is pre-prepared on the prior line; phpcs misses the chained prepare().
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange
		return $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $table_name ) ) ) === $table_name;
	}
}
