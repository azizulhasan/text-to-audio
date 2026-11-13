<?php
/**
 * `wp atlasvoice where`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Content\Where;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes which posts get a player.
 */
class Where_Command {

	/**
	 * Shows where the player is added and what is skipped.
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
	 *     $ wp atlasvoice where get
	 *     automatic: on
	 *     content types: post
	 *     statuses: publish
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$where = Where::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			// The pick lists are for the screen; a script asks WordPress for them.
			unset( $where['choices'] );
			\WP_CLI::line( (string) wp_json_encode( $where ) );

			return;
		}

		$none = static function ( array $items ) {
			return $items ? implode( ', ', $items ) : 'none';
		};

		\WP_CLI::line( 'automatic: ' . ( $where['automatic'] ? 'on' : 'off' ) );
		\WP_CLI::line( 'content types: ' . $none( $where['post_types'] ) );
		\WP_CLI::line( 'statuses: ' . $none( $where['statuses'] ) );
		\WP_CLI::line( 'skipped categories: ' . $none( $where['skip_categories'] ) );
		\WP_CLI::line( 'skipped tags: ' . $none( $where['skip_tags'] ) );
		\WP_CLI::line( 'skipped posts: ' . $none( $where['skip_posts'] ) );
	}

	/**
	 * Changes where the player is added. Give only what should change.
	 *
	 * A list replaces the stored list. Give "none" to empty a skip list.
	 *
	 * ## OPTIONS
	 *
	 * [--automatic=<on-or-off>]
	 * : Add the player automatically: on or off.
	 *
	 * [--post-types=<slugs>]
	 * : Content types that get a player, separated by commas.
	 *
	 * [--statuses=<slugs>]
	 * : Post statuses that get a player, separated by commas.
	 *
	 * [--skip-categories=<slugs>]
	 * : Categories whose posts get no player.
	 *
	 * [--skip-tags=<slugs>]
	 * : Tags whose posts get no player.
	 *
	 * [--skip-posts=<numbers>]
	 * : Single posts that get no player, by post number.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice where set --post-types=post,page
	 *     Success: Saved.
	 *
	 *     $ wp atlasvoice where set --skip-categories=podcasts --skip-posts=12,128
	 *     Success: Saved.
	 *
	 *     $ wp atlasvoice where set --skip-tags=none
	 *     Success: Saved.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args One flag per part.
	 */
	public function set( $args, $assoc_args ) {
		$fields = array();

		foreach ( array_keys( Where::FIELDS ) as $name ) {
			$flag = str_replace( '_', '-', $name );
			if ( ! isset( $assoc_args[ $flag ] ) ) {
				continue;
			}
			$value           = (string) $assoc_args[ $flag ];
			$fields[ $name ] = 'automatic' !== $name && 'none' === strtolower( trim( $value ) ) ? array() : $value;
		}

		$saved = Where::save( $fields );

		if ( is_wp_error( $saved ) ) {
			$data = $saved->get_error_data();

			\WP_CLI::error( ( isset( $data['field'] ) ? $data['field'] . ': ' : '' ) . $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Saved.' );
	}
}
