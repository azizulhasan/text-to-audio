<?php
/**
 * `wp atlasvoice voice`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Voice\Choice;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes the voice that reads the posts.
 */
class Voice_Command {

	/**
	 * Shows the voice engine, the language and the voice in use.
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
	 *     $ wp atlasvoice voice get
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$choice = Choice::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $choice ) );

			return;
		}

		foreach ( $choice['players'] as $player ) {
			\WP_CLI::line(
				sprintf(
					'engine %1$d: %2$s%3$s',
					$player['id'],
					$player['name'],
					$player['id'] === $choice['player_id'] ? ' (in use)' : ''
				)
			);
		}
		\WP_CLI::line( 'language: ' . $choice['language'] );
		\WP_CLI::line( 'voice: ' . $choice['voice'] );
		\WP_CLI::line( 'speed: ' . $choice['rate'] );
		\WP_CLI::line( 'volume: ' . $choice['volume'] );
		\WP_CLI::line( 'pitch: ' . $choice['pitch'] );
	}

	/**
	 * Changes the voice. Give only what should change.
	 *
	 * When the engine, the language or the voice changes, each post gets
	 * audio in the new voice the next time it is played.
	 *
	 * ## OPTIONS
	 *
	 * [--player=<number>]
	 * : The voice engine: 1 is the browser voice, 3 the natural voice.
	 *
	 * [--language=<code>]
	 * : The language code, for example en-GB.
	 *
	 * [--voice=<name>]
	 * : The name of the voice.
	 *
	 * [--rate=<number>]
	 * : The speed of the browser voice, 0.1 to 10. 1 is normal.
	 *
	 * [--volume=<number>]
	 * : The volume of the browser voice, 0 to 1.
	 *
	 * [--pitch=<number>]
	 * : The pitch of the browser voice: 0 lower, 1 normal, 2 higher.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice voice set --language=en-GB --voice="Google UK English Female"
	 *     Success: Voice saved.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: player, language, voice, rate, volume, pitch.
	 */
	public function set( $args, $assoc_args ) {
		$names  = array(
			'player'   => 'player_id',
			'language' => 'language',
			'voice'    => 'voice',
			'rate'     => 'rate',
			'volume'   => 'volume',
			'pitch'    => 'pitch',
		);
		$fields = array();

		foreach ( $names as $flag => $name ) {
			if ( isset( $assoc_args[ $flag ] ) ) {
				$fields[ $name ] = $assoc_args[ $flag ];
			}
		}

		$saved = Choice::save( $fields );

		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Voice saved.' );
	}
}
