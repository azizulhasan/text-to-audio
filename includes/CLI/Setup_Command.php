<?php
/**
 * `wp atlasvoice setup`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Setup\Wizard;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or ends the first-run setup.
 */
class Setup_Command {

	/**
	 * Shows where the setup stands.
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
	 *     $ wp atlasvoice setup status
	 *     setup: not finished
	 *     mode: staging
	 *     steps: hear, where, voice, look, live
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function status( $args, $assoc_args ) {
		$setup = Wizard::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $setup ) );

			return;
		}

		\WP_CLI::line( 'setup: ' . ( $setup['finished'] ? 'finished' : 'not finished' ) );
		\WP_CLI::line( 'mode: ' . $setup['mode'] );
		\WP_CLI::line( 'steps: ' . implode( ', ', $setup['steps'] ) );
		\WP_CLI::line( 'voice: ' . $setup['voice'] );
		\WP_CLI::line( 'sample post: ' . ( $setup['sample'] ? $setup['sample']['id'] . ' ' . $setup['sample']['title'] : 'none' ) );
	}

	/**
	 * Marks the setup as finished.
	 *
	 * ## OPTIONS
	 *
	 * [--go-live]
	 * : Every visitor gets the player from now on.
	 *
	 * [--stay-in-staging]
	 * : Only administrators get the player.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice setup finish --go-live
	 *     Success: Setup finished. The site is live: visitors get the player.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: go-live, stay-in-staging.
	 */
	public function finish( $args, $assoc_args ) {
		$live    = ! empty( $assoc_args['go-live'] );
		$staging = ! empty( $assoc_args['stay-in-staging'] );

		if ( $live && $staging ) {
			\WP_CLI::error( 'Give --go-live or --stay-in-staging, not both.' );

			return;
		}

		$go_live = null;
		if ( $live ) {
			$go_live = true;
		} elseif ( $staging ) {
			$go_live = false;
		}

		$setup = Wizard::finish( $go_live );

		\WP_CLI::success(
			'production' === $setup['mode']
				? 'Setup finished. The site is live: visitors get the player.'
				: 'Setup finished. The site is in staging: only administrators get the player.'
		);
	}
}
