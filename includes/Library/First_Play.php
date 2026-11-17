<?php
/**
 * The first play of a post that has no audio yet: an audio job makes it.
 *
 * @package TTA
 */

namespace TTA\Library;

use TTA\Cloud\Jobs;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Starts, joins and follows the audio job of a post for the visitor who
 * pressed Listen (TTS-354).
 *
 * Before, the visitor's browser sent the post in batches and joined them;
 * closing the tab left half a file behind. Now the service makes the whole
 * file as one job: the browser asks once, then asks how far it is, and plays
 * the file when it is there. A second visitor joins the same job and pays
 * nothing.
 *
 * Existing sites first:
 * - A post that has audio plays it. Nothing is made again, and file names,
 *   addresses and meta are the ones the job engine already writes.
 * - The text is the one the player on the page reads, as before: what the
 *   site chose to be read aloud does not change with the way it is made.
 * - When jobs cannot be used (an older service, a busy or unreachable one,
 *   an engine the service has no jobs for, a page in another language than
 *   the site's, a text too long for one job) the answer is "fallback": the
 *   player then makes the audio batch by batch, exactly as before.
 * - Only a refusal that the old way would get too (the allowance is used up,
 *   the site is not approved, audio is switched off for the post) is a
 *   failure; the player reads such a post with the device's voice.
 *
 * Nothing here runs while a page is built: both calls are requests the
 * player makes after the visitor pressed Listen.
 */
class First_Play {

	/** The states a player acts on. */
	const READY    = 'ready';
	const MAKING   = 'making';
	const FALLBACK = 'fallback';
	const FAILED   = 'failed';

	/** The longest text one job takes (the service's limit). */
	const MAX_CHARS = 200000;

	/** Seconds between two questions to the service about one job, however many visitors wait. */
	const ASK_GAP = 2;

	/** How long a player waits before it asks again, in milliseconds. */
	const WAIT_MS = 2500;

	/** Seconds one question to the service (and the download of a finished file) may hold the others off. */
	const LOCK_SECONDS = 90;

	/**
	 * Why a job could not be used although audio can still be made the
	 * usual way: the service has no jobs (yet), is busy or cannot be reached,
	 * or lost the job.
	 */
	const FALLBACK_CODES = array(
		'jobs_unavailable',
		'service_unreachable',
		'service_unavailable',
		'unknown_engine',
		'queue_full',
		'job_not_found',
		'job_refused',
		'engine_failed',
		'timed_out',
		'file_expired',
		'file_missing',
		'file_unverified',
		'file_corrupt',
		'download_failed',
		'not_writable',
	);

	/**
	 * Starts the job of a post, or joins the one that is being made.
	 *
	 * @param int    $post_id  The post.
	 * @param string $text     The text the player on the page reads.
	 * @param string $file_key The key the player would store this page's audio under, when it says so.
	 *
	 * @return array{state: string, url: string, part: int, parts: int, wait_ms: int, code: string}
	 */
	public static function start( $post_id, $text, $file_key = '' ) {
		$post_id = (int) $post_id;
		$early   = self::before_a_job( $post_id, $file_key );
		if ( $early ) {
			return $early;
		}

		// Somebody else pressed Listen first: the same job, nothing more is sent or paid.
		$record = Jobs::status( $post_id );
		if ( $record && self::is_being_made( $record ) && ! self::is_lost( $record ) ) {
			return self::from_record( $post_id, $record );
		}

		$text = is_string( $text ) ? trim( $text ) : '';

		/**
		 * Filters the text of a first play before it becomes a job. An
		 * extension that checks what a visitor's browser sends (that it is
		 * the post's own text) returns a WP_Error to refuse it.
		 *
		 * @param string|\WP_Error $text    The text the player sent.
		 * @param int              $post_id The post.
		 */
		$text = apply_filters( 'atlasvoice_first_play_text', $text, $post_id );
		if ( is_wp_error( $text ) ) {
			return self::answer( self::FAILED, array( 'code' => sanitize_key( $text->get_error_code() ) ) );
		}
		$text = is_string( $text ) ? trim( $text ) : '';

		if ( '' === $text ) {
			return self::answer( self::FAILED, array( 'code' => 'empty' ) );
		}
		// The batches have no such limit: a very long post is made the usual way.
		if ( mb_strlen( $text ) > self::MAX_CHARS ) {
			return self::answer( self::FALLBACK, array( 'code' => 'text_too_long' ) );
		}

		$started = Jobs::start( $post_id, '', $text );

		if ( is_wp_error( $started ) ) {
			$data   = $started->get_error_data();
			$status = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 0;
			$code   = sanitize_key( $started->get_error_code() );

			// Whatever a broken service calls its trouble, the usual way is tried.
			return $status >= 500 ? self::answer( self::FALLBACK, array( 'code' => $code ) ) : self::refused( $code );
		}

		return self::from_record( $post_id, $started );
	}

	/**
	 * How far the job of a post is. Asks the service when nobody did in the
	 * last moments, and stores the file when the job is finished.
	 *
	 * @param int    $post_id  The post.
	 * @param string $file_key The key the player would store this page's audio under, when it says so.
	 *
	 * @return array{state: string, url: string, part: int, parts: int, wait_ms: int, code: string}
	 */
	public static function status( $post_id, $file_key = '' ) {
		$post_id = (int) $post_id;
		$early   = self::before_a_job( $post_id, $file_key );
		if ( $early ) {
			return $early;
		}

		$record = Jobs::status( $post_id );
		if ( ! $record ) {
			// No job and no audio: the player starts one, or makes it the usual way.
			return self::answer( self::FALLBACK, array( 'code' => 'no_job' ) );
		}

		if ( self::is_being_made( $record ) && time() - $record['updated'] >= self::ASK_GAP ) {
			$record = self::ask( $post_id, $record );
		}

		return self::from_record( $post_id, $record );
	}

	/**
	 * What is settled without a job: a post that cannot have audio, a voice
	 * jobs are not for, a page in another language, audio that is there.
	 *
	 * @param int    $post_id  The post.
	 * @param string $file_key The player's file key, or ''.
	 *
	 * @return array|null An answer, or null when a job is the way.
	 */
	private static function before_a_job( $post_id, $file_key ) {
		$post = get_post( $post_id );

		// Audio is made for published content; an editor may preview a draft of their own.
		if ( ! $post || '' !== (string) $post->post_password || ( 'publish' !== $post->post_status && ! current_user_can( 'edit_post', $post_id ) ) ) {
			return self::answer( self::FAILED, array( 'code' => 'post_not_available' ) );
		}

		// Another voice, or a site that is not connected: the player's usual way decides.
		if ( ! Audio::availability()['available'] ) {
			return self::answer( self::FALLBACK, array( 'code' => 'no_jobs_for_this_voice' ) );
		}

		$key  = self::file_key( $post_id );
		$sent = is_string( $file_key ) ? trim( $file_key ) : '';

		// A page shown in another language or voice than the site's own (a
		// translation plugin): a job would make the site's, so the usual way makes this one.
		if ( '' === $key || ( '' !== $sent && strtolower( $sent ) !== strtolower( $key ) ) ) {
			return self::answer( self::FALLBACK, array( 'code' => 'other_language' ) );
		}

		$url = TTA_Helper::atlasvoice_stored_audio_url( $post_id, $key );
		if ( '' !== $url ) {
			return self::answer( self::READY, array( 'url' => $url ) );
		}

		if ( Jobs::is_off( $post_id ) ) {
			return self::answer( self::FAILED, array( 'code' => 'audio_off_for_post' ) );
		}

		return null;
	}

	/**
	 * The key a job's file of this post is recorded under: the same key
	 * Library\Audio uses when the job is done.
	 *
	 * @param int $post_id The post.
	 *
	 * @return string
	 */
	public static function file_key( $post_id ) {
		$listening = (array) TTA_Helper::tts_get_settings( 'listening' );
		$language  = isset( $listening['tta__listening_lang'] ) && is_string( $listening['tta__listening_lang'] ) ? $listening['tta__listening_lang'] : '';
		if ( '' === $language ) {
			$language = (string) TTA_Helper::tts_normalize_language_code( get_locale() );
		}

		/** This filter is documented in includes/Library/Audio.php. */
		return (string) apply_filters( 'atlasvoice_cloud_job_file_key', TTA_Helper::tts_get_file_url_key( $language ), (int) $post_id, $language );
	}

	/**
	 * Asks the service about a job, one asker at a time: many visitors can
	 * wait for the same post, and a finished file is downloaded once.
	 *
	 * @param int   $post_id The post.
	 * @param array $record  The record before the question.
	 *
	 * @return array The record after it.
	 */
	private static function ask( $post_id, array $record ) {
		$lock = 'atlasvoice_first_play_' . $post_id;

		if ( get_transient( $lock ) ) {
			return $record;
		}
		set_transient( $lock, 1, self::LOCK_SECONDS );

		Jobs::poll( $post_id, self::language() );

		delete_transient( $lock );

		$after = Jobs::status( $post_id );

		return $after ? $after : $record;
	}

	/**
	 * The language a job of the site is made in (the saved one).
	 *
	 * @return string
	 */
	private static function language() {
		$listening = (array) TTA_Helper::tts_get_settings( 'listening' );
		$language  = isset( $listening['tta__listening_lang'] ) && is_string( $listening['tta__listening_lang'] ) ? trim( $listening['tta__listening_lang'] ) : '';
		if ( '' === $language ) {
			$language = (string) TTA_Helper::tts_normalize_language_code( get_locale() );
		}

		return preg_match( Jobs::LANGUAGE_CODE, $language ) ? $language : 'en';
	}

	/**
	 * @param array $record A job's record.
	 *
	 * @return bool Whether the job is still on its way.
	 */
	private static function is_being_made( array $record ) {
		return in_array( $record['status'], array( 'queued', 'running', 'downloading' ), true );
	}

	/**
	 * A job nobody has heard of for a long time is not joined: a new start
	 * asks the service, which answers with the same job when it still runs.
	 *
	 * @param array $record A job's record.
	 *
	 * @return bool
	 */
	private static function is_lost( array $record ) {
		return time() - (int) $record['updated'] > Jobs::LOST_AFTER;
	}

	/**
	 * The answer for a job's record.
	 *
	 * @param int   $post_id The post.
	 * @param array $record  The record.
	 *
	 * @return array
	 */
	private static function from_record( $post_id, array $record ) {
		if ( self::is_being_made( $record ) ) {
			$parts = max( 0, (int) $record['parts'] );
			// The part that is being made now: the ones before it are done.
			$part = $parts > 0 ? min( $parts, max( 0, (int) $record['parts_done'] ) + 1 ) : 0;

			return self::answer(
				self::MAKING,
				array(
					'part'    => $part,
					'parts'   => $parts,
					'wait_ms' => self::WAIT_MS,
				)
			);
		}

		if ( 'done' === $record['status'] ) {
			$url = TTA_Helper::atlasvoice_stored_audio_url( $post_id, self::file_key( $post_id ) );

			// Finished, but the file did not become this voice's audio (the voice was changed meanwhile).
			return '' !== $url ? self::answer( self::READY, array( 'url' => $url ) ) : self::answer( self::FALLBACK, array( 'code' => 'not_attached' ) );
		}

		return self::refused( '' !== $record['error'] ? sanitize_key( $record['error'] ) : 'job_' . sanitize_key( $record['status'] ) );
	}

	/**
	 * The answer for a refusal: the usual way when it can still make the
	 * audio, a failure when it could not either.
	 *
	 * @param string $code Why.
	 *
	 * @return array
	 */
	private static function refused( $code ) {
		return self::answer( in_array( $code, self::FALLBACK_CODES, true ) ? self::FALLBACK : self::FAILED, array( 'code' => $code ) );
	}

	/**
	 * An answer with every part present.
	 *
	 * @param string $state One of the states.
	 * @param array  $more  url, part, parts, wait_ms, code.
	 *
	 * @return array
	 */
	private static function answer( $state, array $more = array() ) {
		return array_merge(
			array(
				'state'   => $state,
				'url'     => '',
				'part'    => 0,
				'parts'   => 0,
				'wait_ms' => 0,
				'code'    => '',
			),
			$more
		);
	}
}
