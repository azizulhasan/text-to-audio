<?php
/**
 * `wp atlasvoice health`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Site\Health;

defined( 'ABSPATH' ) || exit;

/**
 * Checks what could keep visitors from hearing the audio.
 */
class Health_Command {

	/**
	 * Runs the health checks.
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
	 *     $ wp atlasvoice health check
	 *     [warn] Staging or live: Staging: only administrators see the player.
	 *     [ok] Voice: In use: Default.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function check( $args, $assoc_args ) {
		$health = Health::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $health ) );

			return;
		}

		foreach ( $health['checks'] as $check ) {
			\WP_CLI::line( '[' . $check['status'] . '] ' . $check['title'] . ': ' . $check['detail'] );
		}
		foreach ( $health['plugins'] as $plugin ) {
			if ( $plugin['active'] ) {
				\WP_CLI::line( '[plugin] ' . $plugin['name'] . ': ' . $plugin['detail'] );
			}
		}
		\WP_CLI::line( $health['needs_attention'] ? $health['needs_attention'] . ' need attention.' : 'Nothing needs attention.' );
	}

	/**
	 * Forgets the blocked-script problem after the CDN was fixed.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice health cdn-fixed
	 *     Success: Forgotten. A visitor who still meets the problem reports it again.
	 *
	 * @subcommand cdn-fixed
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags (none).
	 */
	public function cdn_fixed( $args, $assoc_args ) {
		Health::forget_cdn_problem();

		\WP_CLI::success( 'Forgotten. A visitor who still meets the problem reports it again.' );
	}
}
