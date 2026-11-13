<?php
/**
 * `wp atlasvoice advanced`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Site\Advanced;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes the advanced settings, and clears the cache.
 */
class Advanced_Command {

	/**
	 * Shows the advanced switches.
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
	 *     $ wp atlasvoice advanced get
	 *     mode_bar: on
	 *     delete_on_uninstall: off
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$values = Advanced::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $values ) );

			return;
		}

		foreach ( $values as $name => $on ) {
			\WP_CLI::line( $name . ': ' . ( $on ? 'on' : 'off' ) );
		}
	}

	/**
	 * Turns advanced switches on or off. Give only what should change.
	 *
	 * ## OPTIONS
	 *
	 * [--<field>=<on-or-off>]
	 * : A switch and on or off. The switches are the names `wp atlasvoice
	 * advanced get` prints: mode_bar, post_toggle, picker, dashboard_widget,
	 * keep_reading, no_auto_play and delete_on_uninstall.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice advanced set --picker=on --dashboard_widget=off
	 *     Success: Saved.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args One flag per switch.
	 */
	public function set( $args, $assoc_args ) {
		$saved = Advanced::save( (array) $assoc_args );

		if ( is_wp_error( $saved ) ) {
			$data = $saved->get_error_data();

			\WP_CLI::error( ( isset( $data['field'] ) ? $data['field'] . ': ' : '' ) . $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Saved.' );
	}

	/**
	 * Clears what AtlasVoice keeps cached.
	 *
	 * No setting, statistic or audio file is removed.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice advanced clear-cache
	 *     Success: Cache cleared.
	 *
	 * @subcommand clear-cache
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags (none).
	 */
	public function clear_cache( $args, $assoc_args ) {
		Advanced::clear_cache();

		\WP_CLI::success( 'Cache cleared.' );
	}
}
