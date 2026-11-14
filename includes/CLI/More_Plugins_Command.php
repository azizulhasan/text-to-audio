<?php
/**
 * `wp atlasvoice more-plugins`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Help\More_Plugins;

defined( 'ABSPATH' ) || exit;

/**
 * Lists the other AtlasAiDev plugins.
 */
class More_Plugins_Command {

	/**
	 * Lists the other free AtlasAiDev plugins and whether each is on this site.
	 *
	 * It installs nothing. To install one: wp plugin install <slug>
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
	 *     $ wp atlasvoice more-plugins
	 *     smart-local-ai (not installed) Smart Local AI
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$list = More_Plugins::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $list ) );

			return;
		}

		foreach ( $list['plugins'] as $plugin ) {
			$state = 'not installed';
			if ( $plugin['active'] ) {
				$state = 'active';
			} elseif ( $plugin['installed'] ) {
				$state = 'installed';
			}

			\WP_CLI::line( $plugin['slug'] . ' (' . $state . ') ' . $plugin['name'] );
		}
	}
}
