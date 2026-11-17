<?php

namespace TTA\Audio;

use TTA\TTA_Audio_Storage;

defined( 'ABSPATH' ) || exit;

/**
 * Joins the batch files of one generation into the final MP3.
 *
 * Joining whatever "{title}-*.mp3" happened to exist let a run that lost
 * earlier batches (another visitor's join deleted them, or the voice service
 * failed one) save a file with missing text over a complete one. This joins
 * parts 1..N in order only when every one is there. Built for Pro 3.4.17
 * (TTS-355); Pro's TTA_Pro\Audio\Batch_Merger extends this class.
 *
 * Every read and write goes through WP_Filesystem (TTA_Audio_Storage).
 */
class Batch_Merger {

	/**
	 * Smallest batch file accepted as playable audio (an MPEG frame plus header).
	 */
	const MIN_PART_BYTES = 200;

	/**
	 * Extension of the marker a batch leaves when it had nothing to say (only
	 * symbols or code). It counts as present and adds no audio.
	 */
	const SKIP_EXTENSION = '.skip';

	/**
	 * May batch $batch_no be made now?
	 *
	 * Batches are sent in order by one run, so a later batch is only worth paying
	 * for while that run's batch 1 is still there. When it is gone, another run
	 * already joined the file (or batch 1 never succeeded) and making this batch
	 * would only produce a part nobody can join.
	 *
	 * @param string $dir      Folder with a trailing slash.
	 * @param string $title    Final file name without extension.
	 * @param int    $batch_no Batch number being requested.
	 * @return bool
	 */
	public static function run_is_open( $dir, $title, $batch_no ) {
		if ( (int) $batch_no <= 1 ) {
			return true;
		}

		return self::part_is_present( $dir . $title . '-1' );
	}

	/**
	 * Record that a batch had nothing to say, so the join does not wait for it.
	 *
	 * @param string $dir        Folder with a trailing slash.
	 * @param string $temp_title Batch file name without extension.
	 * @return bool
	 */
	public static function mark_skipped( $dir, $temp_title ) {
		return TTA_Audio_Storage::put_contents( $dir . $temp_title . self::SKIP_EXTENSION, '' );
	}

	/**
	 * List the batch files 1..$parts, in order.
	 *
	 * @param string $dir   Folder with a trailing slash.
	 * @param string $title Final file name without extension.
	 * @param int    $parts Number of batches the player sent (the last batch's number).
	 * @return array|\WP_Error {audio: string[], markers: string[]}, or 'incomplete_audio' with the missing numbers.
	 */
	public static function parts( $dir, $title, $parts ) {
		$audio   = array();
		$markers = array();
		$missing = array();

		for ( $n = 1; $n <= (int) $parts; $n++ ) {
			$base = $dir . $title . '-' . $n;
			if ( self::is_playable( $base . '.mp3' ) ) {
				$audio[] = $base . '.mp3';
			} elseif ( is_file( $base . self::SKIP_EXTENSION ) ) {
				$markers[] = $base . self::SKIP_EXTENSION;
			} else {
				$missing[] = $n;
			}
		}

		if ( ! $audio || $missing ) {
			return new \WP_Error( 'incomplete_audio', '', array( 'missing' => $missing ) );
		}

		return array( 'audio' => $audio, 'markers' => $markers );
	}

	/**
	 * Join batches 1..$parts into "{title}.mp3".
	 *
	 * Written to a temporary name and moved into place, so a listener never
	 * downloads half a file. When a batch is missing nothing is written and the
	 * batches that exist are kept, so the next run only makes the missing ones.
	 * The caller deletes the returned files once its own steps are done.
	 *
	 * @param string        $dir       Folder with a trailing slash.
	 * @param string        $title     Final file name without extension.
	 * @param int           $parts     Number of batches.
	 * @param callable|null $transform Optional step on the joined bytes before saving
	 *                                 (ElevenLabs rebuilds the Xing header here).
	 * @return string[]|\WP_Error The joined batch files and skip markers, or why nothing was written.
	 */
	public static function merge( $dir, $title, $parts, $transform = null ) {
		$found = self::parts( $dir, $title, $parts );
		if ( is_wp_error( $found ) ) {
			return $found;
		}

		$fs = TTA_Audio_Storage::filesystem();
		if ( ! $fs ) {
			return new \WP_Error( 'write_failed' );
		}

		$audio = '';
		foreach ( $found['audio'] as $file ) {
			$audio .= (string) $fs->get_contents( $file );
		}

		if ( is_callable( $transform ) ) {
			$audio = (string) call_user_func( $transform, $audio );
		}

		$final = $dir . $title . '.mp3';
		$temp  = $final . '.' . wp_generate_password( 8, false ) . '.tmp';

		if ( ! TTA_Audio_Storage::put_contents( $temp, $audio ) ) {
			return new \WP_Error( 'write_failed' );
		}

		if ( ! $fs->move( $temp, $final, true ) ) {
			wp_delete_file( $temp );

			return new \WP_Error( 'write_failed' );
		}

		return array_merge( $found['audio'], $found['markers'] );
	}

	/**
	 * Is batch 1 there, as audio or as a skip marker?
	 *
	 * @param string $base Batch path without extension.
	 * @return bool
	 */
	private static function part_is_present( $base ) {
		return self::is_playable( $base . '.mp3' ) || is_file( $base . self::SKIP_EXTENSION );
	}

	/**
	 * @param string $file
	 * @return bool
	 */
	private static function is_playable( $file ) {
		return is_file( $file ) && filesize( $file ) >= self::MIN_PART_BYTES;
	}
}
