<?php
/**
 * `wp atlasvoice credit`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Player\Credit;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes the line "Voiced by AtlasVoice" under the player.
 */
class Credit_Command {

	/**
	 * Shows whether the line is on, and whether visitors see it now.
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
	 *     $ wp atlasvoice credit get
	 *     credit: off
	 *     text: Voiced by AtlasVoice
	 *     visitors see it: no
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$credit = Credit::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $credit ) );

			return;
		}

		\WP_CLI::line( 'credit: ' . ( $credit['enabled'] ? 'on' : 'off' ) );
		\WP_CLI::line( 'text: ' . $credit['text'] );
		\WP_CLI::line( 'visitors see it: ' . ( $credit['showing'] ? 'yes' : 'no' ) );
	}

	/**
	 * Turns the line on or off.
	 *
	 * It is shown under the free natural-voice player only. Visitors see the
	 * change on their next page load.
	 *
	 * ## OPTIONS
	 *
	 * <on-or-off>
	 * : on shows the line, off hides it.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice credit set on
	 *     Success: Credit line saved.
	 *
	 * @param array $args       Positional arguments: on or off.
	 * @param array $assoc_args Flags (none).
	 */
	public function set( $args, $assoc_args ) {
		$saved = Credit::save( isset( $args[0] ) ? array( 'enabled' => $args[0] ) : array() );

		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Credit line saved.' );
	}
}
