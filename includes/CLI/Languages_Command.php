<?php
/**
 * `wp atlasvoice languages`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Voice\Languages;

defined( 'ABSPATH' ) || exit;

/**
 * Shows the languages of the site.
 */
class Languages_Command {

	/**
	 * Shows the language the posts are read in and the translation plugins found.
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
	 *     $ wp atlasvoice languages
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$languages = Languages::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $languages ) );

			return;
		}

		\WP_CLI::line( 'posts are read in: ' . $languages['site_language'] . ' (' . $languages['site_language_name'] . ')' );

		if ( ! $languages['plugins'] ) {
			\WP_CLI::line( 'translation plugins: none found' );

			return;
		}

		foreach ( $languages['plugins'] as $plugin ) {
			\WP_CLI::line(
				sprintf(
					'%1$s (%2$s): %3$s',
					$plugin['name'],
					'browser' === $plugin['kind'] ? 'translates in the visitor\'s browser' : 'translated pages on the server',
					implode( ', ', wp_list_pluck( $plugin['languages'], 'code' ) )
				)
			);
		}
	}
}
