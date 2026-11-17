<?php

namespace TTA;

use TTA\Audio\Batch_Merger;
use TTA\Audio\Part_Claim;
use TTA\Audio\Text_Gate;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-314: MP3 generation for player 3 (AtlasVoice TTS), batch by batch.
 *
 * The player sends a post's text in batches; each batch becomes a part file
 * (`{title}-{n}.mp3`) and the last one merges them into `{title}.mp3`, records
 * it in `tts_mp3_file_urls` and fires `atlasvoice_final_mp3_written`.
 *
 * The request and response shapes match the route Pro used before, so Pro's
 * player (and its Bulk MP3 page) calls this handler unchanged. Language is
 * whatever the caller sends; Free's player sends the site language, Pro may
 * send a per-post one. Nothing here is plan-specific.
 */
class TTA_GTTS_Generation {

	/**
	 * @param array $body Decoded request body.
	 * @return array Response in the `{status, data:{url, message, file_already_exists}}` shape.
	 */
	public static function handle( $body ) {
		if ( ! is_array( $body ) ) {
			return self::fail( 'invalid_body' );
		}

		// Only while the site is on player 3, so the route is never a generic
		// speech proxy for whoever holds a page nonce.
		if ( TTA_AtlasVoice_Service::PLAYER_ID !== (int) get_player_id() ) {
			return self::fail( 'player_not_active' );
		}

		// The same server checks as Pro's players (post, file name, folder, size).
		$body = Text_Gate::check( $body );
		if ( is_wp_error( $body ) ) {
			return self::fail( $body->get_error_code() );
		}
		$batch_no = (int) $body['batch_no'];

		$post_id = isset( $body['post_id'] ) ? absint( $body['post_id'] ) : 0;
		$post    = $post_id ? get_post( $post_id ) : null;

		// Audio is made for published content only; previews by editors of their
		// own drafts are the one exception.
		if ( ! $post || ( 'publish' !== $post->post_status && ! current_user_can( 'edit_post', $post_id ) ) ) {
			return self::fail( 'post_not_available' );
		}

		$user_id    = isset( $body['user_id'] ) ? sanitize_text_field( (string) $body['user_id'] ) : '';
		$content    = isset( $body['content'] ) ? trim( (string) $body['content'] ) : '';
		$title      = TTA_Audio_Storage::safe_name( isset( $body['title'] ) ? $body['title'] : '' );
		$temp_title = TTA_Audio_Storage::safe_name( isset( $body['temp_title'] ) ? $body['temp_title'] : '' );
		$date_path  = TTA_Audio_Storage::safe_date_path( isset( $body['path'] ) ? $body['path'] : '' );
		$is_last    = ! empty( $body['is_last_batch'] );
		$settings   = isset( $body['settings'] ) && is_array( $body['settings'] ) ? $body['settings'] : array();
		$language   = isset( $settings['language'] ) ? sanitize_text_field( (string) $settings['language'] ) : '';
		// The whole post's size, sent with its first batch (see synthesize()).
		$total      = isset( $body['total_chars'] ) ? absint( $body['total_chars'] ) : 0;

		if ( '' === $title || '' === $temp_title || '' === $content ) {
			return self::fail( 'missing_parameters' );
		}

		if ( '' === $language ) {
			$language = TTA_Helper::tts_normalize_language_code( get_locale() );
		}

		if ( mb_strlen( $content ) > TTA_AtlasVoice_Service::MAX_BATCH_CHARS ) {
			return self::fail( 'batch_too_long' );
		}

		$dir        = trailingslashit( TTA_AtlasVoice_Service::audio_dir() . $date_path );
		$dir_url    = trailingslashit( TTA_AtlasVoice_Service::audio_dir_url() . $date_path );
		$final_file = $dir . $title . '.mp3';

		// Regeneration (Bulk MP3 "regenerate") replaces the file: drop it on the
		// first batch so the rest of the run cannot mistake it for finished audio.
		// Only people who can edit the post (the Bulk MP3 screen): a visitor must
		// not be able to delete finished audio and spend the allowance again.
		$regenerate = ( ! empty( $body['is_regenerate_file'] ) || ! empty( $body['regenerate_file'] ) )
			&& current_user_can( 'edit_post', $post_id );
		if ( $regenerate && preg_match( '/-1$/', $temp_title ) && file_exists( $final_file ) ) {
			wp_delete_file( $final_file );
		}

		// Already made: stop batching and play it.
		if ( ! $regenerate && file_exists( $final_file ) && filesize( $final_file ) > 0 ) {
			TTA_Generation_Lock::release( $post_id );

			return self::ok( $dir_url . $title . '.mp3', '', true );
		}

		// Already made but not on disk (moved to Cloud Storage): play the stored copy.
		if ( ! $regenerate ) {
			$stored = TTA_Helper::atlasvoice_stored_audio_url(
				$post_id,
				isset( $settings['file_url_key'] ) && '' !== $settings['file_url_key']
					? sanitize_text_field( (string) $settings['file_url_key'] )
					: TTA_Helper::tts_get_file_url_key( $language )
			);
			if ( '' !== $stored ) {
				TTA_Generation_Lock::release( $post_id );

				return self::ok( $stored, '', true );
			}
		}

		if ( ! TTA_AtlasVoice_Service::is_connected() ) {
			/**
			 * Whether to connect to the service automatically with the admin email
			 * when a batch arrives on a site that never connected. Off in Free:
			 * the site owner must tick the consent box (wp.org Guideline 7). Pro
			 * turns it on for existing player 3 customers.
			 *
			 * @param bool $auto
			 */
			if ( ! apply_filters( 'atlasvoice_service_auto_connect', false ) ) {
				return self::fail( 'not_connected' );
			}
			$connected = TTA_AtlasVoice_Service::connect( get_option( 'admin_email' ) );
			if ( is_wp_error( $connected ) ) {
				return self::fail( 'not_connected' );
			}
		}

		// Another run is already generating this post (another visitor, or this
		// visitor's own earlier run): back off rather than paying twice for the
		// same audio. The player waits and then plays the finished file.
		if ( ! TTA_Generation_Lock::acquire( $post_id, $user_id, $batch_no ) ) {
			return self::ok( '', 'locked', false );
		}

		// A later batch whose run is gone would make a part nobody can join.
		if ( ! Batch_Merger::run_is_open( $dir, $title, $batch_no ) ) {
			return self::incomplete( $post_id, $final_file, $dir_url . $title . '.mp3' );
		}

		// One request per batch: a second one (another tab, the same visitor id)
		// waits and reuses the finished part instead of paying for it again.
		if ( ! Part_Claim::acquire( $dir, $temp_title ) ) {
			return self::ok( '', 'locked', false );
		}

		$result = TTA_AtlasVoice_Service::synthesize( $content, $language, 'post-' . $post_id, $total );

		// A batch that is only code or symbols has nothing to say: skip it and
		// keep going instead of failing the whole post.
		$skipped = ! $result['ok'] && 'nothing_to_speak' === $result['code'];

		if ( ! $result['ok'] && ! $skipped ) {
			TTA_Generation_Lock::release( $post_id );

			return self::fail( $result['code'] );
		}

		if ( $skipped ) {
			// Counts as present when the parts are joined, but adds no audio.
			Batch_Merger::mark_skipped( $dir, $temp_title );
			if ( ! $is_last ) {
				return self::ok( '', 'batch_skipped', false );
			}
		}

		if ( ! $skipped && ! TTA_Audio_Storage::put_contents( $dir . $temp_title . '.mp3', $result['audio'] ) ) {
			TTA_Generation_Lock::release( $post_id );

			return self::fail( 'not_writable' );
		}

		if ( ! $is_last ) {
			return self::ok( $dir_url . $temp_title . '.mp3', 'batch_stored', false );
		}

		// Join batches 1..N only when every one is there.
		$parts = Batch_Merger::merge( $dir, $title, $batch_no );
		if ( is_wp_error( $parts ) ) {
			if ( 'incomplete_audio' === $parts->get_error_code() ) {
				return self::incomplete( $post_id, $final_file, $dir_url . $title . '.mp3' );
			}
			TTA_Generation_Lock::release( $post_id );

			return self::fail( 'merge_failed' );
		}
		array_map( 'wp_delete_file', $parts );
		TTA_Generation_Lock::release( $post_id );
		$file_url = $dir_url . $title . '.mp3';

		$file_url_key = isset( $settings['file_url_key'] ) && '' !== $settings['file_url_key']
			? sanitize_text_field( (string) $settings['file_url_key'] )
			: TTA_Helper::tts_get_file_url_key( $language );

		/**
		 * The URL recorded for the finished file. Pro replaces it with a Cloud
		 * Storage URL when backups are on.
		 *
		 * @param string $file_url
		 * @param string $file_path
		 * @param int    $post_id
		 */
		$file_url = (string) apply_filters( 'atlasvoice_final_mp3_url', $file_url, $final_file, $post_id );

		TTA_Helper::atlasvoice_store_audio_url( $post_id, $file_url_key, $file_url );

		/** This action is documented in Pro's player 7 route (TTS-266). */
		do_action( 'atlasvoice_final_mp3_written', $final_file, $file_url, $post_id, $body );

		return self::ok( $file_url, 'completed', false );
	}

	/**
	 * A batch is missing, so nothing was joined. A complete file from an earlier
	 * run stays and is played; otherwise the player says the audio could not be
	 * made, and the next play only makes the missing batches.
	 *
	 * @param int    $post_id
	 * @param string $final_file
	 * @param string $final_url
	 * @return array
	 */
	private static function incomplete( $post_id, $final_file, $final_url ) {
		TTA_Generation_Lock::release( $post_id );

		if ( is_file( $final_file ) && filesize( $final_file ) > 0 ) {
			return self::ok( $final_url, '', true );
		}

		return self::fail( 'incomplete_audio' );
	}

	private static function ok( $url, $message, $exists ) {
		return array(
			'status' => true,
			'data'   => array( 'url' => $url, 'message' => $message, 'file_already_exists' => $exists ),
		);
	}

	private static function fail( $message ) {
		return array(
			'status' => false,
			'data'   => array( 'url' => '', 'message' => $message, 'file_already_exists' => false ),
		);
	}
}
