<?php
/**
 * `wp atlasvoice plans`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Account\Plans;

defined( 'ABSPATH' ) || exit;

/**
 * Lists the AtlasVoice Pro plans.
 */
class Plans_Command {

	/**
	 * Lists the Pro plans with their prices and checkout links.
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
	 *     $ wp atlasvoice plans
	 *     $ wp atlasvoice plans --format=json
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$plans = Plans::all();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $plans ) );

			return;
		}

		foreach ( $plans['tiers'] as $tier ) {
			\WP_CLI::line(
				sprintf(
					'%1$d site(s): $%2$d a year, or $%3$d once. Buy: %4$s',
					$tier['sites'],
					$tier['yearly'],
					$tier['lifetime'],
					$tier['checkout']['yearly']
				)
			);
		}

		\WP_CLI::line( sprintf( '%d-day money-back guarantee: %s', $plans['refund_days'], $plans['links']['refund'] ) );
		\WP_CLI::line( 'Compare Free and Pro: ' . $plans['links']['pricing'] );
	}
}
