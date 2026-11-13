<?php
/**
 * Audio jobs on AtlasVoice Cloud, for one post at a time.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use AtlasVoice\Sdk\Client;
use AtlasVoice\Sdk\Result;
use TTA\TTA_AtlasVoice_Service;
use TTA\TTA_Audio_Storage;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Makes the audio of a whole post as one job on AtlasVoice Cloud.
 *
 * The service cuts the text into parts, makes them and joins them; the site
 * sends the text once, asks from WP-Cron how the job is going, and downloads
 * the finished MP3 into uploads. No page request waits for audio, and a
 * visitor's browser no longer has to send a post in batches.
 *
 * What this class guarantees:
 *  - a retry or a double click is never billed twice: the same post, language
 *    and text always send the same Idempotency-Key;
 *  - the file is downloaded only from the service's own file hosts, without
 *    the key and without following a redirect, and is stored only when its
 *    size and SHA-256 match what the service announced;
 *  - polling never runs inside a page request, and stops by itself.
 *
 * The existing way of making audio (one batch per request through
 * /v1/synthesize) is untouched and stays the default. This class is the new
 * path next to it; the players are switched over in TTS-354. Until then a
 * finished file is announced through the `atlasvoice_cloud_job_done` action.
 *
 * The admin (REST), `wp atlasvoice job` and an MCP server all act here.
 */
class Jobs {

	/**
	 * Post meta: language => what the site knows about that job.
	 */
	const META = '_atlasvoice_cloud_jobs';

	/**
	 * WP-Cron hook that asks the service about one job.
	 */
	const HOOK = 'atlasvoice_cloud_job_poll';

	/**
	 * Transient that keeps the service's file hosts.
	 */
	const HOSTS_CACHE = 'atlasvoice_cloud_file_hosts';

	/**
	 * Domain finished files may come from, beside the service's own host.
	 */
	const FILE_DOMAIN = '.atlasvoice.cloud';

	/**
	 * A job that is not finished after this long is given up, in seconds.
	 */
	const GIVE_UP_AFTER = 7200;

	/**
	 * How often a finished file is tried again when the download fails.
	 */
	const DOWNLOAD_TRIES = 5;

	/**
	 * Limits of the wait between two polls, in seconds.
	 */
	const MIN_WAIT = 2;
	const MAX_WAIT = 300;

	/**
	 * Starts the job of a post.
	 *
	 * @param int         $post_id  The post.
	 * @param string      $language Language code; the saved language when empty.
	 * @param string|null $text     The text to speak; the post's own text when null.
	 *
	 * @return array|\WP_Error What the site knows about the job, or why it was not started.
	 */
	public static function start( $post_id, $language = '', $text = null ) {
		$post_id = (int) $post_id;

		if ( ! get_post( $post_id ) ) {
			return self::error( 'invalid_post', __( 'This post does not exist.', 'text-to-audio' ), 404 );
		}

		if ( ! TTA_AtlasVoice_Service::is_connected() ) {
			return self::error( 'not_connected', __( 'Connect the natural voice first.', 'text-to-audio' ), 409 );
		}

		$language = self::language( $language );
		$text     = null === $text ? self::text_for_post( $post_id ) : trim( (string) $text );

		if ( '' === $text ) {
			return self::error( 'nothing_to_speak', __( 'This post has no text to read.', 'text-to-audio' ), 422 );
		}

		$ref = Client::job_ref( 'post:' . $post_id . ':' . $language );
		$key = Client::idempotency_key( $ref, $text );

		// The same text was already made into a file that is still here: nothing to do.
		$known = self::record( $post_id, $language );
		if ( $known && $known['key'] === $key && 'done' === $known['status'] && '' !== $known['file_path'] && is_file( $known['file_path'] ) ) {
			return $known;
		}

		$result = Cloud::client()->create_job(
			$text,
			$language,
			array(
				'ref'             => $ref,
				'idempotency_key' => $key,
			)
		);

		if ( ! $result->ok() || ! is_array( $result->data ) || empty( $result->data['job']['id'] ) ) {
			return self::creation_error( $result );
		}

		$record = self::from_job(
			(array) $result->data['job'],
			array(
				'key'        => $key,
				'ref'        => $ref,
				'created'    => time(),
				'request_id' => $result->request_id,
			)
		);
		self::save( $post_id, $language, $record );

		if ( 'done' === $record['status'] ) {
			// A replay of a job that was finished before.
			return self::finish( $post_id, $language, $record, (array) $result->data['job'] );
		}

		self::schedule( $post_id, $language, self::wait_from( $result ) );

		return $record;
	}

	/**
	 * Asks the service about a job and acts on the answer. Runs from WP-Cron,
	 * never inside a page request.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language Language code.
	 */
	public static function poll( $post_id, $language ) {
		$post_id  = (int) $post_id;
		$language = (string) $language;
		$record   = self::record( $post_id, $language );

		// This check replaces any that is still planned (a check can also be
		// asked for by hand); it plans the next one itself when one is needed.
		wp_clear_scheduled_hook( self::HOOK, array( $post_id, $language ) );

		if ( ! $record || ! in_array( $record['status'], array( 'queued', 'running', 'downloading' ), true ) ) {
			return;
		}

		if ( time() - $record['created'] > self::GIVE_UP_AFTER ) {
			self::save( $post_id, $language, self::failed( $record, 'timed_out' ) );

			return;
		}

		$result = Cloud::client()->get_job( $record['id'] );

		if ( ! $result->ok() || ! is_array( $result->data ) || ! isset( $result->data['job'] ) || ! is_array( $result->data['job'] ) ) {
			if ( 404 === $result->status ) {
				// The job is gone on the service: asking again cannot bring it back.
				self::save( $post_id, $language, self::failed( $record, 'job_not_found' ) );

				return;
			}

			// The service is busy or cannot be reached: ask again later.
			self::schedule( $post_id, $language, max( 30, $result->retry_after( self::MAX_WAIT ) ) );

			return;
		}

		$job    = $result->data['job'];
		$record = self::from_job( $job, $record );

		if ( 'done' === $record['status'] ) {
			self::finish( $post_id, $language, $record, $job );

			return;
		}

		self::save( $post_id, $language, $record );

		if ( in_array( $record['status'], array( 'queued', 'running' ), true ) ) {
			self::schedule( $post_id, $language, self::wait_from( $result ) );
		}
	}

	/**
	 * What the site knows about the job of a post in one language.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language Language code; the saved language when empty.
	 *
	 * @return array|null The record, or null when there is no job.
	 */
	public static function status( $post_id, $language = '' ) {
		return self::record( (int) $post_id, self::language( $language ) );
	}

	/**
	 * Cancels the job of a post. Parts that are not made yet are never made
	 * or billed; a finished file is kept.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language Language code; the saved language when empty.
	 *
	 * @return array|\WP_Error The record after the cancel.
	 */
	public static function cancel( $post_id, $language = '' ) {
		$post_id  = (int) $post_id;
		$language = self::language( $language );
		$record   = self::record( $post_id, $language );

		if ( ! $record ) {
			return self::error( 'job_not_found', __( 'This post has no audio job.', 'text-to-audio' ), 404 );
		}

		wp_clear_scheduled_hook( self::HOOK, array( $post_id, $language ) );

		if ( in_array( $record['status'], array( 'queued', 'running' ), true ) ) {
			$result = Cloud::client()->cancel_job( $record['id'] );

			if ( ! $result->ok() && 404 !== $result->status ) {
				return self::error(
					'' !== $result->code() ? sanitize_key( $result->code() ) : 'service_unreachable',
					__( 'The job could not be cancelled just now. Please try again.', 'text-to-audio' ),
					$result->reached() ? $result->status : 503
				);
			}

			$record['status']  = 'canceled';
			$record['error']   = 'job_canceled';
			$record['updated'] = time();
			self::save( $post_id, $language, $record );
		}

		return $record;
	}

	/**
	 * The text of a post as the plugin reads it: the title, then the content
	 * without markup.
	 *
	 * @param int $post_id The post.
	 *
	 * @return string
	 */
	public static function text_for_post( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return '';
		}

		$settings = (array) TTA_Helper::tts_get_settings( 'settings' );
		$parts    = array();

		if ( ! isset( $settings['tta__settings_add_post_title_to_read'] ) || $settings['tta__settings_add_post_title_to_read'] ) {
			$parts[] = get_the_title( $post );
		}
		$parts[] = $post->post_content;

		$text = function_exists( 'tta_clean_content' )
			? (string) tta_clean_content( implode( '. ', array_filter( $parts ) ) )
			: wp_strip_all_tags( implode( '. ', array_filter( $parts ) ), true );

		/**
		 * Filters the text sent to AtlasVoice Cloud for a post's audio job.
		 *
		 * @param string $text    The text.
		 * @param int    $post_id The post.
		 */
		return trim( (string) apply_filters( 'atlasvoice_cloud_job_text', $text, (int) $post_id ) );
	}

	/**
	 * The hosts a finished file may be downloaded from, beside the service's
	 * own host. The service publishes them; the site keeps only those on our
	 * own domain, so an answer can never point a download somewhere else.
	 *
	 * @return string[]
	 */
	public static function file_hosts() {
		$hosts = get_transient( self::HOSTS_CACHE );

		if ( ! is_array( $hosts ) ) {
			$hosts  = array();
			$health = Cloud::client()->health();

			if ( $health->ok() && is_array( $health->data ) && isset( $health->data['file_hosts'] ) && is_array( $health->data['file_hosts'] ) ) {
				foreach ( array_slice( $health->data['file_hosts'], 0, 10 ) as $host ) {
					$host = is_string( $host ) ? strtolower( $host ) : '';
					if ( preg_match( '/^[a-z0-9.-]{1,253}$/', $host ) && substr( $host, -strlen( self::FILE_DOMAIN ) ) === self::FILE_DOMAIN ) {
						$hosts[] = $host;
					}
				}
			}

			// An answer is kept for half a day; a failure only for a few minutes.
			set_transient( self::HOSTS_CACHE, $hosts, $health->ok() ? 12 * HOUR_IN_SECONDS : 5 * MINUTE_IN_SECONDS );
		}

		/**
		 * Filters the hosts a finished job file may be downloaded from, beside
		 * the service's own host. An entry that starts with a dot allows every
		 * host under that domain.
		 *
		 * @param string[] $hosts Hosts.
		 */
		return array_values( array_filter( (array) apply_filters( 'atlasvoice_cloud_file_hosts', $hosts ), 'is_string' ) );
	}

	/**
	 * Downloads, checks and stores the file of a finished job.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language Language code.
	 * @param array  $record   The site's record of the job.
	 * @param array  $job      The job as the service returned it.
	 *
	 * @return array The record after the attempt.
	 */
	private static function finish( $post_id, $language, array $record, array $job ) {
		$file = isset( $job['file'] ) && is_array( $job['file'] ) ? $job['file'] : array();

		if ( empty( $file['url'] ) || ! is_string( $file['url'] ) ) {
			// Finished, but the service no longer keeps the file.
			$record = self::failed( $record, ! empty( $job['file_expired'] ) ? 'file_expired' : 'file_missing' );
			self::save( $post_id, $language, $record );

			return $record;
		}

		$sha256 = isset( $file['sha256'] ) && is_string( $file['sha256'] ) ? strtolower( $file['sha256'] ) : '';
		if ( ! preg_match( '/^[0-9a-f]{64}$/', $sha256 ) ) {
			// Without a checksum the file cannot be checked, so it is not stored.
			$record = self::failed( $record, 'file_unverified' );
			self::save( $post_id, $language, $record );

			return $record;
		}

		$download = Cloud::client()->download( $file['url'], self::file_hosts(), 120 );
		$bytes    = $download->ok() && is_string( $download->data ) ? $download->data : '';
		$expected = isset( $file['bytes'] ) && is_numeric( $file['bytes'] ) ? (int) $file['bytes'] : -1;

		$intact = '' !== $bytes
			&& ( $expected < 0 || strlen( $bytes ) === $expected )
			&& hash_equals( $sha256, hash( 'sha256', $bytes ) );

		if ( ! $intact ) {
			++$record['download_tries'];

			if ( $download->reached() && '' !== $bytes ) {
				// The file arrived and is not the announced one: never store it.
				$record = self::failed( $record, 'file_corrupt' );
			} elseif ( $record['download_tries'] >= self::DOWNLOAD_TRIES ) {
				$record = self::failed( $record, 'download_failed' );
			} else {
				$record['status']  = 'downloading';
				$record['updated'] = time();
				self::schedule( $post_id, $language, 30 );
			}
			self::save( $post_id, $language, $record );

			return $record;
		}

		$name = 'post-' . $post_id . '-' . sanitize_file_name( strtolower( $language ) ) . '-' . substr( $sha256, 0, 12 ) . '.mp3';
		$path = TTA_AtlasVoice_Service::audio_dir() . 'jobs/' . $name;

		if ( ! TTA_Audio_Storage::put_contents( $path, $bytes ) ) {
			$record = self::failed( $record, 'not_writable' );
			self::save( $post_id, $language, $record );

			return $record;
		}

		$record['status']    = 'done';
		$record['error']     = '';
		$record['file_path'] = $path;
		$record['file_url']  = TTA_AtlasVoice_Service::audio_dir_url() . 'jobs/' . $name;
		$record['bytes']     = strlen( $bytes );
		$record['updated']   = time();
		self::save( $post_id, $language, $record );

		/**
		 * Fires when the audio of a post was made by a job and stored on the site.
		 *
		 * @param int    $post_id  The post.
		 * @param string $language Language code.
		 * @param string $file_url Public address of the MP3.
		 * @param array  $record   The site's record of the job.
		 */
		do_action( 'atlasvoice_cloud_job_done', $post_id, $language, $record['file_url'], $record );

		return $record;
	}

	/**
	 * Turns a refused creation into an error a caller can act on.
	 *
	 * @param Result $result The service's answer.
	 *
	 * @return \WP_Error
	 */
	private static function creation_error( Result $result ) {
		$code = sanitize_key( $result->code() );

		if ( 404 === $result->status ) {
			// A service from before audio jobs. The usual way of making audio
			// (batch by batch) keeps working; the caller falls back to it.
			return self::error( 'jobs_unavailable', __( 'This AtlasVoice service has no audio jobs yet. Audio is made the usual way.', 'text-to-audio' ), 501 );
		}

		if ( ! $result->reached() ) {
			return self::error( 'service_unreachable', __( 'The AtlasVoice service could not be reached. Please try again in a few minutes.', 'text-to-audio' ), 503 );
		}

		$messages = array(
			'quota_exceeded'    => __( 'This month’s characters are not enough for this post.', 'text-to-audio' ),
			'daily_cap_reached' => __( 'Today’s limit is reached. Try again tomorrow.', 'text-to-audio' ),
			'too_many_jobs'     => __( 'Too many audio jobs are running. This one can be started again in a moment.', 'text-to-audio' ),
			'queue_full'        => __( 'The AtlasVoice service is busy. Please try again in a minute.', 'text-to-audio' ),
			'text_too_long'     => __( 'This post is too long for one audio job.', 'text-to-audio' ),
			'nothing_to_speak'  => __( 'This post has no text to read.', 'text-to-audio' ),
			'approval_required' => __( 'This site waits for approval, so it cannot make audio yet.', 'text-to-audio' ),
		);

		$error = self::error(
			'' !== $code ? $code : 'job_refused',
			isset( $messages[ $code ] ) ? $messages[ $code ] : __( 'The AtlasVoice service could not start this audio job.', 'text-to-audio' ),
			$result->status >= 400 ? $result->status : 502
		);

		$wait = $result->retry_after( self::MAX_WAIT );
		if ( $wait > 0 ) {
			$error->add_data(
				array(
					'status'      => $result->status,
					'retry_after' => $wait,
				)
			);
		}

		return $error;
	}

	/**
	 * The site's record of a job, from the service's job object. Only known
	 * fields are kept, each in its own type.
	 *
	 * @param array $job  The job as the service returned it.
	 * @param array $keep What the site already knows (key, ref, created, …).
	 *
	 * @return array
	 */
	private static function from_job( array $job, array $keep ) {
		$record = array_merge( self::blank(), $keep );
		$status = isset( $job['status'] ) && is_string( $job['status'] ) ? $job['status'] : '';

		$record['id']         = isset( $job['id'] ) && is_string( $job['id'] ) && preg_match( '/^[A-Za-z0-9-]{1,128}$/', $job['id'] ) ? $job['id'] : $record['id'];
		$record['status']     = in_array( $status, array( 'queued', 'running', 'done', 'failed', 'canceled' ), true ) ? $status : 'failed';
		$record['parts_done'] = isset( $job['parts_done'] ) ? absint( $job['parts_done'] ) : 0;
		$record['parts']      = isset( $job['parts_total'] ) ? absint( $job['parts_total'] ) : 0;
		$record['chars']      = isset( $job['chars'] ) ? absint( $job['chars'] ) : 0;
		$record['billed']     = isset( $job['billed_chars'] ) ? absint( $job['billed_chars'] ) : 0;
		$record['error']      = isset( $job['error']['code'] ) && is_string( $job['error']['code'] ) ? sanitize_key( $job['error']['code'] ) : '';
		$record['updated']    = time();

		return $record;
	}

	/**
	 * An empty record.
	 *
	 * @return array
	 */
	private static function blank() {
		return array(
			'id'             => '',
			'status'         => '',
			'key'            => '',
			'ref'            => '',
			'parts_done'     => 0,
			'parts'          => 0,
			'chars'          => 0,
			'billed'         => 0,
			'error'          => '',
			'file_url'       => '',
			'file_path'      => '',
			'bytes'          => 0,
			'download_tries' => 0,
			'request_id'     => '',
			'created'        => 0,
			'updated'        => 0,
		);
	}

	/**
	 * Marks a record as failed.
	 *
	 * @param array  $record The record.
	 * @param string $code   Why.
	 *
	 * @return array
	 */
	private static function failed( array $record, $code ) {
		$record['status']  = 'failed';
		$record['error']   = (string) $code;
		$record['updated'] = time();

		return $record;
	}

	/**
	 * Reads the stored record of one language, in a known shape.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language Language code.
	 *
	 * @return array|null
	 */
	private static function record( $post_id, $language ) {
		$all = get_post_meta( $post_id, self::META, true );

		if ( ! is_array( $all ) || ! isset( $all[ $language ] ) || ! is_array( $all[ $language ] ) || empty( $all[ $language ]['id'] ) ) {
			return null;
		}

		$record = array_merge( self::blank(), array_intersect_key( $all[ $language ], self::blank() ) );

		foreach ( array( 'parts_done', 'parts', 'chars', 'billed', 'bytes', 'download_tries', 'created', 'updated' ) as $number ) {
			$record[ $number ] = (int) $record[ $number ];
		}
		foreach ( array( 'id', 'status', 'key', 'ref', 'error', 'file_url', 'file_path', 'request_id' ) as $text ) {
			$record[ $text ] = is_string( $record[ $text ] ) ? $record[ $text ] : '';
		}

		return $record;
	}

	/**
	 * Stores the record of one language.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language Language code.
	 * @param array  $record   The record.
	 */
	private static function save( $post_id, $language, array $record ) {
		$all = get_post_meta( $post_id, self::META, true );
		$all = is_array( $all ) ? $all : array();

		$all[ $language ] = $record;

		update_post_meta( $post_id, self::META, $all );
	}

	/**
	 * Plans the next poll, once.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language Language code.
	 * @param int    $seconds  How long to wait.
	 */
	private static function schedule( $post_id, $language, $seconds ) {
		$args = array( (int) $post_id, (string) $language );

		wp_clear_scheduled_hook( self::HOOK, $args );
		wp_schedule_single_event( time() + max( self::MIN_WAIT, min( self::MAX_WAIT, (int) $seconds ) ), self::HOOK, $args );
	}

	/**
	 * How long the service asked to wait before the next poll.
	 *
	 * @param Result $result The service's answer.
	 *
	 * @return int Seconds.
	 */
	private static function wait_from( Result $result ) {
		$ms = is_array( $result->data ) && isset( $result->data['poll_after_ms'] ) && is_numeric( $result->data['poll_after_ms'] )
			? (int) $result->data['poll_after_ms']
			: 0;

		return $ms > 0 ? (int) ceil( $ms / 1000 ) : max( 5, $result->retry_after( self::MAX_WAIT ) );
	}

	/**
	 * The language of a job: the given one, or the saved language of the site.
	 *
	 * @param string $language Language code, or empty.
	 *
	 * @return string
	 */
	private static function language( $language ) {
		$language = is_string( $language ) ? trim( $language ) : '';

		if ( '' === $language ) {
			$listening = (array) TTA_Helper::tts_get_settings( 'listening' );
			$language  = isset( $listening['tta__listening_lang'] ) && is_string( $listening['tta__listening_lang'] ) ? $listening['tta__listening_lang'] : '';
		}
		if ( '' === $language ) {
			$language = (string) TTA_Helper::tts_normalize_language_code( get_locale() );
		}

		// A language code only: it becomes part of a reference and of a file name.
		return preg_match( '/^[A-Za-z]{2,3}([-_][A-Za-z0-9]{2,8}){0,3}$/', $language ) ? $language : 'en';
	}

	/**
	 * An error with an HTTP status.
	 *
	 * @param string $code    Machine word.
	 * @param string $message Sentence for a person.
	 * @param int    $status  HTTP status.
	 *
	 * @return \WP_Error
	 */
	private static function error( $code, $message, $status ) {
		return new \WP_Error( $code, $message, array( 'status' => (int) $status ) );
	}
}
