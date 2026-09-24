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
 */
final class TTA_Generation_Lock {

	/** Seconds without a batch after which a run counts as abandoned. */
	const STALE_SECONDS = 90;

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
	 * @return bool False: another run is generating this post; answer `locked`.
	 */
	public static function acquire( $post_id, $user_id, $batch_no ) {
		$key  = self::key( $post_id );
		$lock = get_transient( $key );
		$now  = time();

		$active = is_array( $lock ) && isset( $lock['touched'] ) && ( $now - (int) $lock['touched'] ) < self::STALE_SECONDS;

		if ( $active ) {
			if ( (int) $batch_no <= 1 || (string) $lock['user_id'] !== (string) $user_id ) {
				return false;
			}
		}

		set_transient(
			$key,
			array(
				'user_id' => (string) $user_id,
				'post_id' => absint( $post_id ),
				'touched' => $now,
			),
			5 * MINUTE_IN_SECONDS
		);

		return true;
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
