<?php

namespace TTA;

// TTS-247: prevent direct file access (wp.org Plugin Check requirement).
defined( 'ABSPATH' ) || exit;

/**
 * One audio generation run per post at a time — for every MP3 player that
 * generates on first play (player 3 in Free, players 3-7 in Pro).
 *
 * A run is the sequence of batches one browser sends for a post (temp titles
 * "<title>-1", "<title>-2", …). The lock is keyed by post and remembers who
 * holds it and when it last moved:
 *
 *  - a NEW run (batch 1) waits while another run is active — even from the
 *    same visitor: the run a page starts on load and the one the play button
 *    starts both carry the same visitor id, and used to generate (and pay for)
 *    the same post twice;
 *  - the holder's later batches pass and keep the lock fresh;
 *  - a lock that has not moved for STALE_SECONDS belongs to an abandoned run
 *    (tab closed mid-way) and is taken over.
 *
 * A caller that gets "no" answers `locked`; the players already wait and
 * retry, then play the finished file.
 *
 * TTS-354: a post's audio is made one way at a time. While its audio job is
 * being made (Cloud\Jobs), a NEW batch run waits too: found on a live run,
 * where one page load started the job and another the batches, and the post
 * was billed twice. When the job is done the retry finds the stored file.
 */
final class TTA_Generation_Lock {

	/** Seconds without a batch after which a run counts as abandoned. */
	const STALE_SECONDS = 90;

	/** The largest number of parts a player is believed to have. */
	const MAX_PARTS = 1000;

	/**
	 * @param int $post_id
	 * @return string Transient key (shared by every player, one run per post).
	 */
	public static function key( $post_id ) {
		return 'mp3_generation_lock__post_id__' . absint( $post_id );
	}

	/**
	 * The batch number from a temp title ("My post-3" => 3); 1 when absent.
	 *
	 * @param string $temp_title
	 * @return int
	 */
	public static function batch_number( $temp_title ) {
		return preg_match( '/-(\d+)$/', (string) $temp_title, $m ) ? max( 1, (int) $m[1] ) : 1;
	}

	/**
	 * May this request generate its batch?
	 *
	 * @param int        $post_id
	 * @param string|int $user_id  The browser's visitor id (stable for a run).
	 * @param int        $batch_no 1 for the first batch of a run.
	 * @param int        $parts    TTS-347: how many batches the run has, when the
	 *                             player says so; a visitor who has to wait is
	 *                             then told how far it is (see progress()).
	 * @return bool False: another run is generating this post; answer `locked`.
	 */
	public static function acquire( $post_id, $user_id, $batch_no, $parts = 0 ) {
		$key  = self::key( $post_id );
		$lock = get_transient( $key );
		$now  = time();

		$active = is_array( $lock ) && isset( $lock['touched'] ) && ( $now - (int) $lock['touched'] ) < self::STALE_SECONDS;

		// A run that is already going finishes; only a new one waits for the job.
		if ( (int) $batch_no <= 1 && ! ( $active && (string) $lock['user_id'] === (string) $user_id ) && self::job_is_being_made( $post_id ) ) {
			return false;
		}

		if ( $active ) {
			if ( (int) $batch_no <= 1 || (string) $lock['user_id'] !== (string) $user_id ) {
				return false;
			}
		}

		// A later batch that does not say the number of parts keeps the one the run began with.
		$parts = absint( $parts );
		if ( ! $parts && $active && isset( $lock['parts'] ) ) {
			$parts = absint( $lock['parts'] );
		}

		set_transient(
			$key,
			array(
				'user_id' => (string) $user_id,
				'post_id' => absint( $post_id ),
				'touched' => $now,
				'part'    => max( 1, (int) $batch_no ),
				'parts'   => min( self::MAX_PARTS, $parts ),
			),
			5 * MINUTE_IN_SECONDS
		);

		return true;
	}

	/**
	 * TTS-347: how far the run that holds a post is, for a visitor who waits
	 * for it: "part 9 of 14".
	 *
	 * @param int $post_id The post.
	 * @return array{part:int, parts:int}|null Null when no run holds the post,
	 *                                          or when its player did not say how many parts it has.
	 */
	public static function progress( $post_id ) {
		$lock = get_transient( self::key( $post_id ) );

		if ( ! is_array( $lock ) || ! isset( $lock['touched'], $lock['part'], $lock['parts'] ) || ( time() - (int) $lock['touched'] ) >= self::STALE_SECONDS ) {
			return null;
		}

		$part  = absint( $lock['part'] );
		$parts = absint( $lock['parts'] );

		// One part has nothing to count, and a part past the last is not believed.
		return $parts > 1 && $part >= 1 && $part <= $parts
			? array(
				'part'  => $part,
				'parts' => $parts,
			)
			: null;
	}

	/**
	 * TTS-354: whether a batch run holds the post right now. An audio job is
	 * not started for it then: the run's audio is on its way already.
	 *
	 * @param int $post_id The post.
	 * @return bool
	 */
	public static function is_held( $post_id ) {
		$lock = get_transient( self::key( $post_id ) );

		return is_array( $lock ) && isset( $lock['touched'] ) && ( time() - (int) $lock['touched'] ) < self::STALE_SECONDS;
	}

	/**
	 * TTS-354: whether the post's audio job is being made and was heard of
	 * lately. A job nobody has heard of for a while does not hold the post.
	 *
	 * @param int $post_id The post.
	 * @return bool
	 */
	private static function job_is_being_made( $post_id ) {
		if ( ! class_exists( '\TTA\Cloud\Jobs' ) ) {
			return false;
		}

		$record = \TTA\Cloud\Jobs::status( absint( $post_id ) );

		return is_array( $record )
			&& in_array( $record['status'], array( 'queued', 'running', 'downloading' ), true )
			&& time() - (int) $record['updated'] <= \TTA\Cloud\Jobs::LOST_AFTER;
	}

	/**
	 * The run finished or failed: the next request may start a new one.
	 *
	 * @param int $post_id
	 */
	public static function release( $post_id ) {
		delete_transient( self::key( $post_id ) );
	}
}
