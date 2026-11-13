<?php
/**
 * `wp atlasvoice embed`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Player\Embed;

defined( 'ABSPATH' ) || exit;

/**
 * Shows how to place a player by hand.
 */
class Embed_Command {

	/**
	 * Shows the shortcode, its options and the name of the block.
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
	 *     $ wp atlasvoice embed
	 *     shortcode: [atlasvoice]
	 *     id: Reads another post, by its number. Example: [atlasvoice id="128"]
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$embed = Embed::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $embed ) );

			return;
		}

		\WP_CLI::line( 'shortcode: ' . $embed['shortcode'] );
		\WP_CLI::line( 'older shortcode, still works: ' . $embed['legacy_shortcode'] );
		\WP_CLI::line( 'block: ' . $embed['block'] );
		foreach ( $embed['options'] as $option ) {
			\WP_CLI::line( $option['name'] . ': ' . $option['description'] . ' Example: ' . $option['example'] );
		}
	}
}
