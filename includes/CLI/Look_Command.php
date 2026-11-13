<?php
/**
 * `wp atlasvoice look`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Player\Look;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes how the player looks.
 */
class Look_Command {

	/**
	 * Shows the colours, sizes, border and spacing of the player.
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
	 *     $ wp atlasvoice look get
	 *     background: #184c53
	 *     text: #ffffff
	 *     height: 50px
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$look = Look::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $look ) );

			return;
		}

		foreach ( Look::fields() as $name => $field ) {
			\WP_CLI::line( $name . ': ' . $look[ $name ] . ( isset( $field['unit'] ) ? $field['unit'] : '' ) );
		}
	}

	/**
	 * Changes the look. Give only what should change.
	 *
	 * Visitors see the change on their next page load.
	 *
	 * ## OPTIONS
	 *
	 * [--<field>=<value>]
	 * : A part of the look and its new value. The parts are the names
	 * `wp atlasvoice look get` prints: colours as hex values (background,
	 * text, hover_background, hover_text, border_color) and whole numbers
	 * without a unit (border, radius, height, font_size, width, margin_top,
	 * margin_bottom, margin_left, margin_right).
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice look set --background=#184c53 --text=#ffffff
	 *     Success: Look saved.
	 *
	 *     $ wp atlasvoice look set --radius=0 --height=44
	 *     Success: Look saved.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args One flag per part of the look.
	 */
	public function set( $args, $assoc_args ) {
		$saved = Look::save( (array) $assoc_args );

		if ( is_wp_error( $saved ) ) {
			$data = $saved->get_error_data();

			\WP_CLI::error( ( isset( $data['field'] ) ? $data['field'] . ': ' : '' ) . $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Look saved.' );
	}
}
