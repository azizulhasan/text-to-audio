<?php
/**
 * `wp atlasvoice versions`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Site\Versions;

defined( 'ABSPATH' ) || exit;

/**
 * Shows the versions of AtlasVoice and switches automatic updates.
 */
class Versions_Command {

	/**
	 * Shows the installed versions and the older ones, with whether each is
	 * safe for this site.
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
	 *     $ wp atlasvoice versions get
	 *     AtlasVoice 2.5.0 (updates itself: no)
	 *     free 2.4.0: safe
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$versions = Versions::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $versions ) );

			return;
		}

		foreach ( $versions['installed'] as $plugin ) {
			\WP_CLI::line( sprintf( '%1$s %2$s (updates itself: %3$s)', $plugin['label'], $plugin['version'], $plugin['auto_update'] ? 'yes' : 'no' ) );
		}
		foreach ( $versions['modes'] as $mode => $rows ) {
			foreach ( $rows as $row ) {
				$why = 'blocked' === $row['status'] && $row['blocks'] ? ' (' . $row['blocks'][0] . ')' : '';
				\WP_CLI::line( $mode . ' ' . $row['version'] . ': ' . $row['status'] . $why );
			}
		}
		foreach ( $versions['errors'] as $plugin => $message ) {
			\WP_CLI::warning( $plugin . ': ' . $message );
		}
	}

	/**
	 * Turns automatic updates of one plugin on or off.
	 *
	 * ## OPTIONS
	 *
	 * <plugin>
	 * : free (AtlasVoice) or pro (AtlasVoice Pro).
	 *
	 * <on-or-off>
	 * : on or off.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice versions auto-update free on
	 *     Success: AtlasVoice updates itself.
	 *
	 * @subcommand auto-update
	 *
	 * @param array $args       Positional arguments: plugin, on or off.
	 * @param array $assoc_args Flags (none).
	 */
	public function auto_update( $args, $assoc_args ) {
		$plugin = isset( $args[0] ) ? (string) $args[0] : '';
		$saved  = Versions::set_auto_update( $plugin, isset( $args[1] ) ? $args[1] : null );

		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );

			return;
		}

		$now = $saved['installed'][ $plugin ];
		\WP_CLI::success( $now['label'] . ( $now['auto_update'] ? ' updates itself.' : ' waits for you to update it.' ) );
	}
}
