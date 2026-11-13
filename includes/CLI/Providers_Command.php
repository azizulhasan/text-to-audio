<?php
/**
 * `wp atlasvoice providers`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Voice\Providers;

defined( 'ABSPATH' ) || exit;

/**
 * Shows the site's own voice providers.
 */
class Providers_Command {

	/**
	 * Shows which outside providers are connected with the site's own account.
	 * A key is never printed.
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
	 *     $ wp atlasvoice providers
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$data = Providers::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $data ) );

			return;
		}

		foreach ( $data['providers'] as $provider ) {
			if ( ! $provider['available'] ) {
				$state = 'not on this site';
			} else {
				$state = $provider['connected'] ? 'connected' : 'not connected';
			}

			\WP_CLI::line( $provider['name'] . ': ' . $state . ( '' !== $provider['detail'] ? ' (' . $provider['detail'] . ')' : '' ) );
		}
	}
}
