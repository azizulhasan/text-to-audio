<?php
/**
 * `wp atlasvoice areas`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Content\Areas;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes which part of a page is read aloud.
 */
class Areas_Command {

	/**
	 * Shows the reading rule of the whole site and of single content types.
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
	 *     $ wp atlasvoice areas get
	 *     whole site: reads .entry-content
	 *     skipped areas: .share-bar
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$areas = Areas::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $areas ) );

			return;
		}

		$none = static function ( array $items ) {
			return $items ? implode( ', ', $items ) : 'none';
		};

		\WP_CLI::line( 'whole site: reads ' . ( '' !== $areas['selector'] ? $areas['selector'] : 'the text the player finds itself' ) );
		\WP_CLI::line( 'skipped areas: ' . $none( $areas['skip_areas'] ) );
		\WP_CLI::line( 'skipped element types: ' . $none( $areas['skip_tags'] ) );
		\WP_CLI::line( 'skipped phrases: ' . $none( $areas['skip_phrases'] ) );
		foreach ( $areas['types'] as $type ) {
			\WP_CLI::line( $type['post_type'] . ': reads ' . ( '' !== $type['selector'] ? $type['selector'] : 'the whole-site rule' ) . ( $areas['types_applied'] ? '' : ' (stored, not applied on this site)' ) );
		}
	}

	/**
	 * Changes the reading rule of the whole site. Give only what should change.
	 *
	 * A list replaces the stored list. Separate items with "|". Give "none"
	 * to empty a list or to remove the selector.
	 *
	 * ## OPTIONS
	 *
	 * [--selector=<css>]
	 * : The CSS selector of the article text.
	 *
	 * [--skip-areas=<selectors>]
	 * : Parts inside the text that are not read, as CSS selectors.
	 *
	 * [--skip-tags=<names>]
	 * : Element types that are not read, for example figure|aside.
	 *
	 * [--skip-phrases=<texts>]
	 * : Exact texts that are never read.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice areas set --selector=".entry-content" --skip-areas=".share-bar|.author-box"
	 *     Success: Saved.
	 *
	 *     $ wp atlasvoice areas set --skip-phrases=none
	 *     Success: Saved.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args One flag per part of the rule.
	 */
	public function set( $args, $assoc_args ) {
		$fields = array();

		foreach ( array_keys( Areas::FIELDS ) as $name ) {
			$flag = str_replace( '_', '-', $name );
			if ( ! isset( $assoc_args[ $flag ] ) ) {
				continue;
			}
			$value = (string) $assoc_args[ $flag ];
			if ( 'none' === strtolower( trim( $value ) ) ) {
				$value = 'selector' === $name ? '' : array();
			}
			$fields[ $name ] = $value;
		}

		$saved = Areas::save( $fields );

		if ( is_wp_error( $saved ) ) {
			$data = $saved->get_error_data();

			\WP_CLI::error( ( isset( $data['field'] ) ? $data['field'] . ': ' : '' ) . $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Saved.' );
	}
}
