<?php
/**
 * `wp atlasvoice placement`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Player\Placement;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes where the player sits and who gets it.
 */
class Placement_Command {

	/**
	 * Shows where the player sits, where it docks, and who sees it.
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
	 *     $ wp atlasvoice placement get
	 *     position: before_content
	 *     dock: bottom_fixed
	 *     show to: all
	 *     download: all
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$placement = Placement::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $placement ) );

			return;
		}

		\WP_CLI::line( 'position: ' . $placement['position'] );
		\WP_CLI::line( 'dock: ' . $placement['dock'] );
		\WP_CLI::line( 'show to: ' . implode( ', ', $placement['show_to'] ) );
		\WP_CLI::line( 'download: ' . implode( ', ', $placement['download'] ) );
	}

	/**
	 * Changes the placement. Give only what should change.
	 *
	 * Visitors see the change on their next page load.
	 *
	 * ## OPTIONS
	 *
	 * [--position=<position>]
	 * : before_content, after_content, or manual (only where a shortcode,
	 * block or widget adds the player).
	 *
	 * [--dock=<dock>]
	 * : Where the player docks while the reader scrolls: bottom_fixed,
	 * bottom_right, bottom_left, sticky_top, or none.
	 *
	 * [--show-to=<roles>]
	 * : Who sees the player: all, or user roles separated by commas.
	 *
	 * [--download=<roles>]
	 * : Who may download the audio: all, or user roles separated by commas.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice placement set --position=after_content --dock=none
	 *     Success: Placement saved.
	 *
	 *     $ wp atlasvoice placement set --show-to=subscriber,editor
	 *     Success: Placement saved.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: position, dock, show-to, download.
	 */
	public function set( $args, $assoc_args ) {
		$names  = array(
			'position' => 'position',
			'dock'     => 'dock',
			'show-to'  => 'show_to',
			'download' => 'download',
		);
		$fields = array();

		foreach ( $names as $flag => $name ) {
			if ( isset( $assoc_args[ $flag ] ) ) {
				$fields[ $name ] = $assoc_args[ $flag ];
			}
		}

		$saved = Placement::save( $fields );

		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Placement saved.' );
	}
}
