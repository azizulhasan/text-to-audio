<?php
/**
 * `wp atlasvoice privacy`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Site\Privacy;

defined( 'ABSPATH' ) || exit;

/**
 * Shows what AtlasVoice keeps and shares, and changes usage sharing.
 */
class Privacy_Command {

	/**
	 * Shows the privacy facts.
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
	 *     $ wp atlasvoice privacy get
	 *     listening records: 240
	 *     usage sharing: off
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$privacy = Privacy::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $privacy ) );

			return;
		}

		$sharing = $privacy['usage_sharing'];

		\WP_CLI::line( 'listening records: ' . $privacy['listening_records'] );
		\WP_CLI::line( 'usage sharing: ' . ( $sharing['managed_here'] ? ( $sharing['allowed'] ? 'on' : 'off' ) : 'managed by AtlasVoice Pro' ) );
		\WP_CLI::line( 'suggested privacy policy text: ' . $privacy['policy_url'] );
	}

	/**
	 * Turns sharing anonymous usage data with AtlasAiDev on or off.
	 *
	 * On sends the first report now and then weekly. Off stops it at once.
	 *
	 * ## OPTIONS
	 *
	 * <on-or-off>
	 * : on or off.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice privacy usage-sharing off
	 *     Success: Usage sharing is off. Nothing more is sent.
	 *
	 * @subcommand usage-sharing
	 *
	 * @param array $args       Positional arguments: on or off.
	 * @param array $assoc_args Flags (none).
	 */
	public function usage_sharing( $args, $assoc_args ) {
		$saved = Privacy::save( array( 'usage_sharing' => isset( $args[0] ) ? $args[0] : null ) );

		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( $saved['usage_sharing']['allowed'] ? 'Usage sharing is on. A report is sent weekly.' : 'Usage sharing is off. Nothing more is sent.' );
	}
}
