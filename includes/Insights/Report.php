<?php
/**
 * How much the audio is listened to.
 *
 * @package TTA
 */

namespace TTA\Insights;

use TTA\TTA_Cache;
use TTA_Api\AtlasVoice_Analytics;

defined( 'ABSPATH' ) || exit;

/**
 * The listening numbers of a period, as totals and short lists.
 *
 * It adds no counting of its own. The rows are the ones the player writes
 * to the `atlasvoice_analytics` table, and they are added up by the same
 * code as the classic Analytics screen (AtlasVoice_Analytics), passed
 * through the same `tts_analytics_response` filter, so a plugin that adds
 * device, browser or country numbers there (AtlasVoice Pro) adds them here.
 *
 * What comes out holds no single listener: no row, no browser identifier,
 * only sums. The admin screen (REST), `wp atlasvoice insights` and an MCP
 * server all read it (TTS-376).
 */
class Report {

	/**
	 * The table the player writes its counts to.
	 */
	const TABLE = 'atlasvoice_analytics';

	/**
	 * The periods: a number of days, or everything.
	 */
	const RANGES = array( '7', '30', '90', 'all' );

	/**
	 * How many posts the list holds.
	 */
	const POSTS = 50;

	/**
	 * How long a report is kept, in seconds. Adding up every row on each
	 * click would be slow on a busy site; two minutes old is fresh enough.
	 */
	const KEEP = 120;

	/**
	 * The report of a period.
	 *
	 * @param string $range One of RANGES.
	 *
	 * @return array|\WP_Error {
	 *     range: string, from: string, counting: bool,
	 *     totals: array<string, int>, progress: array<string, int>,
	 *     posts: array<int, array{id:int, title:string, plays:int, seconds:int, finished:int}>,
	 *     hours: int[], breakdowns: array<string, array<int, array{name:string, count:int}>>
	 * }
	 */
	public static function get( $range = '30' ) {
		$range = is_scalar( $range ) ? (string) $range : '';
		if ( ! in_array( $range, self::RANGES, true ) ) {
			return new \WP_Error(
				'atlasvoice_invalid_range',
				__( 'The period must be 7, 30, 90 or all.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$key    = 'insights_report_' . $range;
		$cached = TTA_Cache::get( $key );
		if ( is_array( $cached ) && isset( $cached['totals'] ) ) {
			// Whether plays are counted is a setting, so it is never served from the cache.
			$cached['counting'] = Tracking::get()['count_plays'];

			return $cached;
		}

		$from   = 'all' === $range ? '' : gmdate( 'Y-m-d 00:00:00', time() - (int) $range * DAY_IN_SECONDS );
		$rows   = self::rows( $from );
		$totals = new AtlasVoice_Analytics();
		$data   = $totals->aggregate_analytics_data( $rows );
		$dates  = array(
			'from_date' => '' !== $from ? $from : null,
			'to_date'   => current_time( 'mysql' ),
		);

		// The same extension point as the classic screen's numbers.
		$response = (array) apply_filters(
			'tts_analytics_response',
			array(
				'status'      => true,
				'data'        => $data,
				'dates'       => $dates,
				'raw_results' => array(),
			),
			'aggregated_insights',
			$dates,
			$rows
		);
		$data     = isset( $response['data'] ) && is_array( $response['data'] ) ? $response['data'] : $data;
		$summary  = isset( $data['summary'] ) && is_array( $data['summary'] ) ? $data['summary'] : array();
		$segments = isset( $data['segments'] ) && is_array( $data['segments'] ) ? $data['segments'] : array();

		$report = array(
			'range'      => $range,
			'from'       => $from,
			'counting'   => Tracking::get()['count_plays'],
			'totals'     => array(
				'plays'               => self::number( $summary, 'total_play' ),
				'seconds'             => self::number( $summary, 'total_time' ),
				'finished'            => self::number( $summary, 'total_end' ),
				'downloads'           => self::number( $summary, 'total_download' ),
				'listeners'           => self::number( $summary, 'total_users' ),
				'new_listeners'       => self::number( $segments, 'new_users' ),
				'returning_listeners' => self::number( $segments, 'returning_users' ),
			),
			// How far people listened: how many plays reached each point.
			'progress'   => array(
				'started'        => self::number( $summary, 'total_play' ),
				'quarter'        => self::number( $summary, 'total_25_percent' ),
				'half'           => self::number( $summary, 'total_50_percent' ),
				'three_quarters' => self::number( $summary, 'total_75_percent' ),
				'finished'       => self::number( $summary, 'total_end' ),
			),
			'posts'      => self::posts( isset( $data['posts'] ) ? $data['posts'] : array() ),
			'hours'      => self::hours( isset( $data['hourly'] ) ? $data['hourly'] : array() ),
			'breakdowns' => array(),
		);

		foreach ( array(
			'devices'   => 'device',
			'browsers'  => 'browser',
			'systems'   => 'os',
			'countries' => 'country',
		) as $name => $source ) {
			$list = self::breakdown( isset( $data[ $source ] ) ? $data[ $source ] : array() );
			// Only the breakdowns something on this site fills in are part of the report.
			if ( $list ) {
				$report['breakdowns'][ $name ] = $list;
			}
		}

		TTA_Cache::set( $key, $report, self::KEEP );

		return $report;
	}

	/**
	 * The rows of a period.
	 *
	 * @param string $from A MySQL date, or empty for everything.
	 *
	 * @return array[]
	 */
	private static function rows( $from ) {
		global $wpdb;

		$table = $wpdb->prefix . self::TABLE;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- the plugin's own table; the result is kept for two minutes above.
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $table ) ) ) !== $table ) {
			return array();
		}

		if ( '' === $from ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- the table name is the prefix plus a constant.
			return (array) $wpdb->get_results( "SELECT * FROM {$table}", ARRAY_A );
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- the table name is the prefix plus a constant.
		return (array) $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$table} WHERE created_at >= %s", $from ), ARRAY_A );
	}

	/**
	 * The posts, most played first.
	 *
	 * @param mixed $posts The posts of the summed data.
	 *
	 * @return array<int, array{id:int, title:string, plays:int, seconds:int, finished:int}>
	 */
	private static function posts( $posts ) {
		$list = array();

		foreach ( is_array( $posts ) ? $posts : array() as $post ) {
			if ( ! is_array( $post ) || empty( $post['post_id'] ) ) {
				continue;
			}
			$list[] = array(
				'id'       => absint( $post['post_id'] ),
				'title'    => isset( $post['title'] ) ? wp_strip_all_tags( (string) $post['title'] ) : '',
				'plays'    => self::number( $post, 'total_plays' ),
				'seconds'  => self::number( $post, 'total_time' ),
				'finished' => self::number( $post, 'total_end' ),
			);
		}

		usort(
			$list,
			static function ( $a, $b ) {
				return $b['plays'] === $a['plays'] ? $b['seconds'] - $a['seconds'] : $b['plays'] - $a['plays'];
			}
		);

		return array_slice( $list, 0, self::POSTS );
	}

	/**
	 * Plays per hour of the day, 0 to 23 (UTC, as the player records them).
	 *
	 * @param mixed $hourly Hour ("00" to "23") => count.
	 *
	 * @return int[] 24 numbers.
	 */
	private static function hours( $hourly ) {
		$hours = array_fill( 0, 24, 0 );

		foreach ( is_array( $hourly ) ? $hourly : array() as $hour => $count ) {
			$hour = (int) $hour;
			if ( $hour >= 0 && $hour <= 23 ) {
				$hours[ $hour ] += max( 0, (int) $count );
			}
		}

		return $hours;
	}

	/**
	 * A name => count map as a list, largest first.
	 *
	 * @param mixed $map Name => count, or name => array with a count.
	 *
	 * @return array<int, array{name:string, count:int}>
	 */
	private static function breakdown( $map ) {
		$list = array();

		foreach ( is_array( $map ) ? $map : array() as $name => $count ) {
			$count = is_array( $count ) && isset( $count['count'] ) ? $count['count'] : $count;
			if ( is_string( $name ) && '' !== $name && is_numeric( $count ) && (int) $count > 0 ) {
				$list[] = array(
					'name'  => wp_strip_all_tags( $name ),
					'count' => (int) $count,
				);
			}
		}

		usort(
			$list,
			static function ( $a, $b ) {
				return $b['count'] - $a['count'];
			}
		);

		return array_slice( $list, 0, 10 );
	}

	/**
	 * A count from summed data, never below zero.
	 *
	 * @param array  $data Summed data.
	 * @param string $key  Which count.
	 *
	 * @return int
	 */
	private static function number( array $data, $key ) {
		return isset( $data[ $key ] ) && is_numeric( $data[ $key ] ) ? max( 0, (int) $data[ $key ] ) : 0;
	}
}
