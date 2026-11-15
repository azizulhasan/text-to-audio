<?php
/**
 * `wp atlasvoice post`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Editor\Post_Panel;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-347: what AtlasVoice knows about one post, and whether the player
 * shows on it. The same as the "AtlasVoice" panel of the post editor and the
 * REST routes (tta/v1/post-panel/<id>): all go through Post_Panel. Making a
 * post's audio is `wp atlasvoice job create <id>`.
 */
class Post_Command {

	/**
	 * Shows the audio, the player and the listening of one post.
	 *
	 * ## OPTIONS
	 *
	 * <id>
	 * : The post.
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
	 *     $ wp atlasvoice post status 161
	 *     player: shown
	 *     audio: ready
	 *     plays in the last 30 days: 412 (38 listeners)
	 *     shortcode: [atlasvoice]
	 *
	 * @param array $args       Positional arguments: the post.
	 * @param array $assoc_args Flags: format.
	 */
	public function status( $args, $assoc_args ) {
		$panel = Post_Panel::get( isset( $args[0] ) ? (int) $args[0] : 0 );
		if ( is_wp_error( $panel ) ) {
			\WP_CLI::error( $panel->get_error_message() );

			return;
		}

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $panel ) );

			return;
		}

		$audio = $panel['audio']['status'];
		if ( 'browser' === $panel['audio']['kind'] ) {
			$audio = 'read live in the browser, no files';
		}

		\WP_CLI::line( 'player: ' . ( $panel['player']['shown'] ? 'shown' : 'hidden' ) );
		\WP_CLI::line( 'audio: ' . $audio . ( $panel['audio']['off'] ? ' (switched off for this post)' : '' ) );
		\WP_CLI::line(
			$panel['listening']['counted']
				? sprintf( 'plays in the last %1$d days: %2$d (%3$d listeners, %4$d%% finished)', $panel['listening']['days'], $panel['listening']['plays'], $panel['listening']['listeners'], $panel['listening']['finished'] )
				: 'listening is not counted on this site'
		);
		\WP_CLI::line( 'shortcode: ' . $panel['shortcode'] );
	}

	/**
	 * Shows the player on one post.
	 *
	 * ## OPTIONS
	 *
	 * <id>
	 * : The post.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice post show 161
	 *     Success: The player shows on post 161.
	 *
	 * @param array $args Positional arguments: the post.
	 */
	public function show( $args ) {
		$this->set( $args, true );
	}

	/**
	 * Hides the player on one post.
	 *
	 * ## OPTIONS
	 *
	 * <id>
	 * : The post.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice post hide 161
	 *     Success: The player is hidden on post 161.
	 *
	 * @param array $args Positional arguments: the post.
	 */
	public function hide( $args ) {
		$this->set( $args, false );
	}

	/**
	 * Switches audio off for one post: no audio is made for it, not on
	 * publish, not on the first play and not in a run for all posts.
	 *
	 * ## OPTIONS
	 *
	 * <id>
	 * : The post.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice post never 161
	 *     Success: No audio is made for post 161.
	 *
	 * @param array $args Positional arguments: the post.
	 */
	public function never( $args ) {
		$this->audio( $args, true );
	}

	/**
	 * Lets one post follow the site's audio setting again.
	 *
	 * ## OPTIONS
	 *
	 * <id>
	 * : The post.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice post follow 161
	 *     Success: Post 161 follows the site setting again.
	 *
	 * @param array $args Positional arguments: the post.
	 */
	public function follow( $args ) {
		$this->audio( $args, false );
	}

	/**
	 * Saves the audio choice and says how it ended.
	 *
	 * @param array $args Positional arguments: the post.
	 * @param bool  $off  Whether audio is switched off.
	 */
	private function audio( $args, $off ) {
		$id    = isset( $args[0] ) ? (int) $args[0] : 0;
		$panel = Post_Panel::audio_off( $id, $off );

		if ( is_wp_error( $panel ) ) {
			\WP_CLI::error( $panel->get_error_message() );

			return;
		}

		\WP_CLI::success( sprintf( $off ? 'No audio is made for post %d.' : 'Post %d follows the site setting again.', $id ) );
	}

	/**
	 * Saves and says how it ended.
	 *
	 * @param array $args  Positional arguments: the post.
	 * @param bool  $shown Whether the player shows.
	 */
	private function set( $args, $shown ) {
		$id    = isset( $args[0] ) ? (int) $args[0] : 0;
		$panel = Post_Panel::show_player( $id, $shown );

		if ( is_wp_error( $panel ) ) {
			\WP_CLI::error( $panel->get_error_message() );

			return;
		}

		\WP_CLI::success( sprintf( $shown ? 'The player shows on post %d.' : 'The player is hidden on post %d.', $id ) );
	}
}
