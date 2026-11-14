<?php
/**
 * `wp atlasvoice tracking`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Insights\Tracking;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes whether plays are counted.
 */
class Tracking_Command {

	/**
	 * Shows the tracking settings.
	 *
	 * ## OPTIONS
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
	 *     $ wp atlasvoice tracking get
	 *     count plays: on
	 *     listener location: off
	 *     posts: all
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$tracking = Tracking::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $tracking ) );

			return;
		}

		\WP_CLI::line( 'count plays: ' . ( $tracking['count_plays'] ? 'on' : 'off' ) );
		\WP_CLI::line( 'listener location: ' . ( $tracking['listener_location'] ? 'on' : 'off' ) );
		\WP_CLI::line( 'posts: ' . ( $tracking['posts'] ? implode( ', ', $tracking['posts'] ) : 'none' ) );
	}

	/**
	 * Changes the tracking settings. Give only what should change.
	 *
	 * ## OPTIONS
	 *
	 * [--count-plays=<on-or-off>]
	 * : Count plays and listening time.
	 *
	 * [--listener-location=<on-or-off>]
	 * : Look up the country of a listener. On sends visitor IP addresses to
	 * a lookup service outside this site.
	 *
	 * [--posts=<posts>]
	 * : all, or post numbers separated by commas.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice tracking set --count-plays=on --posts=all
	 *     Success: Tracking saved.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: count-plays, listener-location, posts.
	 */
	public function set( $args, $assoc_args ) {
		$fields = array();

		foreach ( array_keys( Tracking::FIELDS ) as $name ) {
			$flag = str_replace( '_', '-', $name );
			if ( isset( $assoc_args[ $flag ] ) ) {
				$fields[ $name ] = (string) $assoc_args[ $flag ];
			}
		}

		$saved = Tracking::save( $fields );

		if ( is_wp_error( $saved ) ) {
			$data = $saved->get_error_data();

			\WP_CLI::error( ( isset( $data['field'] ) ? $data['field'] . ': ' : '' ) . $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Tracking saved.' );
	}
}
