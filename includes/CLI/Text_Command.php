<?php
/**
 * `wp atlasvoice text`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Content\Text;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes which text of a post is read aloud.
 */
class Text_Command {

	/**
	 * Shows what is read besides the post content.
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
	 *     $ wp atlasvoice text get
	 *     title: on
	 *     excerpt: off
	 *     intro:
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$text = Text::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $text ) );

			return;
		}

		foreach ( Text::fields() as $name => $field ) {
			$value = 'bool' === $field['type'] ? ( $text[ $name ] ? 'on' : 'off' ) : $text[ $name ];
			\WP_CLI::line( rtrim( $name . ': ' . $value ) );
		}
	}

	/**
	 * Changes what is read. Give only what should change.
	 *
	 * ## OPTIONS
	 *
	 * [--<field>=<value>]
	 * : A part and its new value. The parts are the names `wp atlasvoice
	 * text get` prints: on or off for title, excerpt, numbers, as_seen,
	 * wrapper and status_column; a sentence for intro and outro (give an
	 * empty text to remove it).
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice text set --excerpt=on --intro="You are listening to Hearth and Grain."
	 *     Success: Saved.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args One flag per part.
	 */
	public function set( $args, $assoc_args ) {
		$saved = Text::save( (array) $assoc_args );

		if ( is_wp_error( $saved ) ) {
			$data = $saved->get_error_data();

			\WP_CLI::error( ( isset( $data['field'] ) ? $data['field'] . ': ' : '' ) . $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Saved.' );
	}
}
