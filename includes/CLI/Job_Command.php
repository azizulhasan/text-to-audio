<?php
/**
 * `wp atlasvoice job`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Cloud\Jobs;

defined( 'ABSPATH' ) || exit;

/**
 * Makes the audio of a post as one job on AtlasVoice Cloud.
 */
class Job_Command {

	/**
	 * Starts the audio job of a post.
	 *
	 * The text of the post is sent to AtlasVoice Cloud and counts against the
	 * site's allowance. The same post, language and text are never billed twice.
	 *
	 * ## OPTIONS
	 *
	 * <post_id>
	 * : The id of the post.
	 *
	 * [--language=<code>]
	 * : The language code of the audio. Default: the language saved for the voice.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice job create 161
	 *     Success: Job 0b9d3c1e started (queued). Check it with: wp atlasvoice job status 161
	 *
	 * @param array $args       Positional arguments: the post id.
	 * @param array $assoc_args Flags: language.
	 */
	public function create( $args, $assoc_args ) {
		$record = Jobs::start( self::post_id( $args ), self::language( $assoc_args ) );

		if ( is_wp_error( $record ) ) {
			\WP_CLI::error( $record->get_error_message() );

			return;
		}

		if ( 'done' === $record['status'] ) {
			\WP_CLI::success( 'The audio is ready: ' . $record['file_url'] );

			return;
		}

		\WP_CLI::success( sprintf( 'Job %1$s started (%2$s). Check it with: wp atlasvoice job status %3$d', substr( $record['id'], 0, 8 ), $record['status'], self::post_id( $args ) ) );
	}

	/**
	 * Shows how the audio job of a post is going.
	 *
	 * ## OPTIONS
	 *
	 * <post_id>
	 * : The id of the post.
	 *
	 * [--language=<code>]
	 * : The language code of the audio.
	 *
	 * [--check]
	 * : Ask AtlasVoice Cloud now instead of waiting for WP-Cron.
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
	 *     $ wp atlasvoice job status 161 --check
	 *
	 * @param array $args       Positional arguments: the post id.
	 * @param array $assoc_args Flags: language, check, format.
	 */
	public function status( $args, $assoc_args ) {
		$post_id  = self::post_id( $args );
		$language = self::language( $assoc_args );

		if ( ! empty( $assoc_args['check'] ) ) {
			$known = Jobs::status( $post_id, $language );
			if ( $known ) {
				Jobs::poll( $post_id, self::language_of( $post_id, $language ) );
			}
		}

		$record = Jobs::status( $post_id, $language );

		if ( ! $record ) {
			\WP_CLI::line( 'This post has no audio job.' );

			return;
		}

		$record = \TTA_Api\Cloud_Jobs_Controller::for_output( $record );

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $record ) );

			return;
		}

		\WP_CLI::line( 'job: ' . $record['id'] );
		\WP_CLI::line( 'status: ' . $record['status'] . ( '' !== $record['error'] ? ' (' . $record['error'] . ')' : '' ) );
		\WP_CLI::line( 'parts: ' . $record['parts_done'] . ' of ' . $record['parts'] );
		\WP_CLI::line( 'characters: ' . $record['chars'] . ', billed: ' . $record['billed'] );
		if ( '' !== $record['file_url'] ) {
			\WP_CLI::line( 'file: ' . $record['file_url'] );
		}
	}

	/**
	 * Cancels the audio job of a post. A finished MP3 is kept.
	 *
	 * ## OPTIONS
	 *
	 * <post_id>
	 * : The id of the post.
	 *
	 * [--language=<code>]
	 * : The language code of the audio.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice job cancel 161
	 *     Success: The job is canceled.
	 *
	 * @param array $args       Positional arguments: the post id.
	 * @param array $assoc_args Flags: language.
	 */
	public function cancel( $args, $assoc_args ) {
		$record = Jobs::cancel( self::post_id( $args ), self::language( $assoc_args ) );

		if ( is_wp_error( $record ) ) {
			\WP_CLI::error( $record->get_error_message() );

			return;
		}

		\WP_CLI::success( 'canceled' === $record['status'] ? 'The job is canceled.' : 'The job was already finished (' . $record['status'] . '); nothing was canceled.' );
	}

	/**
	 * The post id from the arguments.
	 *
	 * @param array $args Positional arguments.
	 *
	 * @return int
	 */
	private static function post_id( $args ) {
		return isset( $args[0] ) ? (int) $args[0] : 0;
	}

	/**
	 * The language flag, or an empty string.
	 *
	 * @param array $assoc_args Flags.
	 *
	 * @return string
	 */
	private static function language( $assoc_args ) {
		return isset( $assoc_args['language'] ) ? (string) $assoc_args['language'] : '';
	}

	/**
	 * The language the job of a post is stored under.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language The language flag, or empty.
	 *
	 * @return string
	 */
	private static function language_of( $post_id, $language ) {
		if ( '' !== $language ) {
			return $language;
		}

		$all = get_post_meta( $post_id, Jobs::META, true );

		return is_array( $all ) && $all ? (string) array_key_first( $all ) : '';
	}
}
