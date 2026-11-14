<?php
/**
 * `wp atlasvoice insights`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Insights\Report;

defined( 'ABSPATH' ) || exit;

/**
 * Shows how much the audio is listened to.
 */
class Insights_Command {

	/**
	 * Shows the listening numbers of a period.
	 *
	 * ## OPTIONS
	 *
	 * [--range=<range>]
	 * : The period.
	 * ---
	 * default: 30
	 * options:
	 *   - 7
	 *   - 30
	 *   - 90
	 *   - all
	 * ---
	 *
	 * [--format=<format>]
	 * : How to print it.
	 * ---
	 * default: list
	 * options:
	 *   - list
	 *   - json
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice insights --range=7
	 *     plays: 412
	 *     listening time: 5 h 12 min
	 *     finished: 148
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: range, format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$report = Report::get( isset( $assoc_args['range'] ) ? (string) $assoc_args['range'] : '30' );

		if ( is_wp_error( $report ) ) {
			\WP_CLI::error( $report->get_error_message() );

			return;
		}

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $report ) );

			return;
		}

		$totals  = $report['totals'];
		$minutes = (int) floor( $totals['seconds'] / 60 );

		if ( ! $report['counting'] ) {
			\WP_CLI::warning( 'Plays are not counted on this site (wp atlasvoice tracking set --count-plays=on).' );
		}
		\WP_CLI::line( 'plays: ' . $totals['plays'] );
		\WP_CLI::line( sprintf( 'listening time: %1$d h %2$d min', (int) floor( $minutes / 60 ), $minutes % 60 ) );
		\WP_CLI::line( 'finished: ' . $totals['finished'] );
		\WP_CLI::line( 'listeners: ' . $totals['listeners'] );
		foreach ( array_slice( $report['posts'], 0, 5 ) as $post ) {
			\WP_CLI::line( sprintf( 'post %1$d: %2$d plays (%3$s)', $post['id'], $post['plays'], '' !== $post['title'] ? $post['title'] : 'no title' ) );
		}
	}
}
