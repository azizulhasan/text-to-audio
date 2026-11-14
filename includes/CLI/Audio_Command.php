<?php
/**
 * `wp atlasvoice audio`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Library\Audio;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes when audio is made.
 *
 * To make the audio of one post now: wp atlasvoice job create <post-id>
 */
class Audio_Command {

	/**
	 * Shows when audio is made and whether audio jobs can run.
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
	 *     $ wp atlasvoice audio get
	 *     audio is made: on the first play
	 *     audio jobs: can run
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$setting = Audio::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $setting ) );

			return;
		}

		$reasons = array(
			''              => 'can run',
			'voice'         => 'cannot run: the voice in use is not made by jobs',
			'not_connected' => 'cannot run: this site is not connected to the AtlasVoice service',
		);

		\WP_CLI::line( 'audio is made: ' . ( Audio::WHEN_PUBLISH === $setting['when'] ? 'when a post is published' : 'on the first play' ) );
		\WP_CLI::line( 'audio jobs: ' . ( isset( $reasons[ $setting['reason'] ] ) ? $reasons[ $setting['reason'] ] : 'cannot run' ) );
	}

	/**
	 * Changes when audio is made.
	 *
	 * ## OPTIONS
	 *
	 * --when=<when>
	 * : play: on the first play, as always. publish: in the background when
	 * a post is published or changed; its text is sent to the AtlasVoice
	 * service and counts against the site's allowance.
	 * ---
	 * options:
	 *   - play
	 *   - publish
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice audio set --when=publish
	 *     Success: Audio is made when a post is published.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: when.
	 */
	public function set( $args, $assoc_args ) {
		$saved = Audio::save( array( 'when' => isset( $assoc_args['when'] ) ? (string) $assoc_args['when'] : '' ) );

		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( Audio::WHEN_PUBLISH === $saved['when'] ? 'Audio is made when a post is published.' : 'Audio is made on the first play.' );

		if ( Audio::WHEN_PUBLISH === $saved['when'] && ! $saved['available'] ) {
			\WP_CLI::warning( 'Audio jobs cannot run on this site yet, so nothing is made until they can. See: wp atlasvoice audio get' );
		}
	}
}
