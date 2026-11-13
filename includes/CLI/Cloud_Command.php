<?php
/**
 * `wp atlasvoice cloud`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Cloud\Connection;

defined( 'ABSPATH' ) || exit;

/**
 * Shows, makes or ends this site's connection to AtlasVoice Cloud.
 */
class Cloud_Command {

	/**
	 * Shows whether this site is connected to AtlasVoice Cloud.
	 *
	 * ## OPTIONS
	 *
	 * [--refresh]
	 * : Ask AtlasVoice Cloud for the current state first.
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
	 *     $ wp atlasvoice cloud status
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: refresh, format.
	 */
	public function status( $args, $assoc_args ) {
		$state = Connection::state( ! empty( $assoc_args['refresh'] ) );

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $state ) );

			return;
		}

		if ( ! $state['connected'] ) {
			\WP_CLI::line( $state['key_revoked'] ? 'Not connected: the key was revoked in the AtlasVoice dashboard.' : 'Not connected.' );

			return;
		}

		\WP_CLI::line( 'connected: yes' . ( $state['pending_approval'] ? ' (waiting for approval)' : '' ) );
		\WP_CLI::line( 'email: ' . $state['email'] );
		\WP_CLI::line( 'site key: ' . $state['key_prefix'] . '...' );
		\WP_CLI::line( 'plan: ' . $state['plan'] );
	}

	/**
	 * Connects this site to AtlasVoice Cloud for the natural voice.
	 *
	 * The site address, the site name and the email are sent to AtlasVoice
	 * Cloud. From then on, the text of a post is sent to make its audio; it is
	 * deleted afterwards and the MP3 is saved on this site.
	 *
	 * ## OPTIONS
	 *
	 * --email=<email>
	 * : Where AtlasVoice may contact you about the service.
	 *
	 * --agree
	 * : You agree that post text is sent to AtlasVoice Cloud to make the audio. Required.
	 *
	 * [--takeover]
	 * : Move a site that is registered to another email to this one.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice cloud connect --email=owner@example.org --agree
	 *     Success: Connected to AtlasVoice Cloud as owner@example.org.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: email, agree, takeover.
	 */
	public function connect( $args, $assoc_args ) {
		if ( empty( $assoc_args['agree'] ) ) {
			\WP_CLI::error( 'Nothing was sent. Add --agree to say that post text may be sent to AtlasVoice Cloud to make the audio.' );

			return;
		}

		$state = Connection::connect(
			isset( $assoc_args['email'] ) ? (string) $assoc_args['email'] : '',
			true,
			! empty( $assoc_args['takeover'] )
		);

		if ( is_wp_error( $state ) ) {
			$data = (array) $state->get_error_data();
			$hint = ! empty( $data['takeover'] ) ? ' Add --takeover to move this site to your email.' : '';

			\WP_CLI::error( $state->get_error_message() . $hint );

			return;
		}

		if ( $state['pending_approval'] ) {
			\WP_CLI::success( 'Connected. This site waits for approval by the owner of the AtlasVoice account of ' . $state['email'] . '.' );

			return;
		}

		\WP_CLI::success( 'Connected to AtlasVoice Cloud as ' . $state['email'] . '.' );
	}

	/**
	 * Disconnects this site from AtlasVoice Cloud.
	 *
	 * New audio then uses the browser voice. Audio already made is kept.
	 *
	 * ## OPTIONS
	 *
	 * [--yes]
	 * : Disconnect without being asked to confirm.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice cloud disconnect --yes
	 *     Success: Disconnected. Audio already made keeps playing.
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: yes.
	 */
	public function disconnect( $args, $assoc_args ) {
		\WP_CLI::confirm( 'New audio will use the browser voice until you connect again. Disconnect?', $assoc_args );

		Connection::disconnect();

		\WP_CLI::success( 'Disconnected. Audio already made keeps playing.' );
	}
}
