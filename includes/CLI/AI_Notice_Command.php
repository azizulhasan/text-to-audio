<?php
/**
 * `wp atlasvoice ai-notice`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Player\AI_Notice;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes the line that tells listeners the voice is made by AI.
 */
class AI_Notice_Command {

	/**
	 * Shows whether the notice is on, its text and its position.
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
	 *     $ wp atlasvoice ai-notice get
	 *     notice: off
	 *     text: This article is read by an AI-generated voice. (default)
	 *     position: after
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$notice = AI_Notice::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $notice ) );

			return;
		}

		\WP_CLI::line( 'notice: ' . ( $notice['enabled'] ? 'on' : 'off' ) );
		\WP_CLI::line( 'text: ' . ( '' !== $notice['text'] ? $notice['text'] : $notice['default_text'] . ' (default)' ) );
		\WP_CLI::line( 'position: ' . $notice['position'] );
	}

	/**
	 * Turns the notice on or off, or changes its text or position.
	 *
	 * Visitors see the change on their next page load.
	 *
	 * ## OPTIONS
	 *
	 * [<on-or-off>]
	 * : on shows the notice, off hides it.
	 *
	 * [--text=<text>]
	 * : The notice. Give an empty text to go back to the default sentence.
	 *
	 * [--position=<position>]
	 * : before (above the player) or after (below it).
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice ai-notice set on --position=before
	 *     Success: AI notice saved.
	 *
	 *     $ wp atlasvoice ai-notice set --text="Read by a synthetic voice."
	 *     Success: AI notice saved.
	 *
	 * @param array $args       Positional arguments: on or off.
	 * @param array $assoc_args Flags: text, position.
	 */
	public function set( $args, $assoc_args ) {
		$fields = array();

		if ( isset( $args[0] ) ) {
			$fields['enabled'] = $args[0];
		}
		foreach ( array( 'text', 'position' ) as $name ) {
			if ( isset( $assoc_args[ $name ] ) ) {
				$fields[ $name ] = (string) $assoc_args[ $name ];
			}
		}

		$saved = AI_Notice::save( $fields );

		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'AI notice saved.' );
	}
}
