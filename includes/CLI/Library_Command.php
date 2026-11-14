<?php
/**
 * `wp atlasvoice library`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Library\Posts;

defined( 'ABSPATH' ) || exit;

/**
 * Lists the posts and whether each has stored audio.
 */
class Library_Command {

	/**
	 * Lists the posts that get a player, with whether the audio is stored.
	 *
	 * ## OPTIONS
	 *
	 * [--status=<status>]
	 * : Which posts.
	 * ---
	 * default: all
	 * options:
	 *   - all
	 *   - ready
	 *   - missing
	 * ---
	 *
	 * [--search=<words>]
	 * : Words to find in a post.
	 *
	 * [--page=<number>]
	 * : Which page of the list.
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
	 *     $ wp atlasvoice library --status=missing
	 *     12 of 40 posts have no audio yet.
	 *     128 missing The old mill
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: status, search, page, format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$library = Posts::get(
			array(
				'status' => isset( $assoc_args['status'] ) ? (string) $assoc_args['status'] : 'all',
				'search' => isset( $assoc_args['search'] ) ? (string) $assoc_args['search'] : '',
				'page'   => isset( $assoc_args['page'] ) ? $assoc_args['page'] : 1,
			)
		);

		if ( is_wp_error( $library ) ) {
			\WP_CLI::error( $library->get_error_message() );

			return;
		}

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $library ) );

			return;
		}

		if ( ! $library['stores_audio'] ) {
			\WP_CLI::line( 'The voice in use reads in the browser and stores no audio files.' );

			return;
		}

		\WP_CLI::line( sprintf( '%1$d of %2$d posts have no audio yet.', $library['counts']['missing'], $library['counts']['all'] ) );
		foreach ( $library['posts'] as $post ) {
			\WP_CLI::line( $post['id'] . ' ' . $post['status'] . ' ' . $post['title'] );
		}
		if ( $library['pages'] > $library['page'] ) {
			\WP_CLI::line( sprintf( 'Page %1$d of %2$d. Use --page for more.', $library['page'], $library['pages'] ) );
		}
	}
}
