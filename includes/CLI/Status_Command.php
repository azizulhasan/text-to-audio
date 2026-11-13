<?php
/**
 * `wp atlasvoice status`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Home\Summary;

defined( 'ABSPATH' ) || exit;

/**
 * Shows how AtlasVoice is set up on this site.
 */
class Status_Command {

	/**
	 * Shows who can hear the posts, which voice reads them, where the player
	 * sits and what is read. The same facts as the Home screen.
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
	 *     $ wp atlasvoice status
	 *     $ wp atlasvoice status --format=json
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$summary = Summary::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $summary ) );

			return;
		}

		$rows = array(
			'mode'            => $summary['live'] ? 'live (visitors hear the posts)' : 'staging (only administrators see the player)',
			'setup'           => $summary['setup_finished'] ? 'finished' : 'not finished',
			'voice engine'    => $summary['voice']['engine'],
			'language'        => $summary['voice']['language'],
			'voice'           => $summary['voice']['voice'],
			'stores audio'    => $summary['voice']['stores_audio'] ? 'yes (MP3 files)' : 'no (read in the browser)',
			'player position' => $summary['player']['position'],
			'shown to'        => implode( ', ', $summary['player']['shown_to'] ),
			'added'           => $summary['content']['automatic'] ? 'automatically' : 'only where you add it',
			'content types'   => implode( ', ', $summary['content']['post_types'] ),
		);

		foreach ( $rows as $name => $value ) {
			\WP_CLI::line( $name . ': ' . $value );
		}
	}
}
