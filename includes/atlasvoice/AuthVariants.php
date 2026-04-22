<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice Auth Variants (TTS-238 C6a, v5 §14.1 refactor).
 *
 * Ticket #3 of the §0.7 ticket-killer list — "logged-in vs logged-out DOM".
 * When the picked container contains members-only sections, price tiers
 * gated on login, commerce fields like "Add to cart" that render only for
 * authenticated users, or any other content that differs between auth
 * states, a single MP3 cache produces audio that's wrong for half the
 * audience. Visitors hit a listen button and hear sentences about a
 * "members-only tutorial" they cannot access, or miss the tutorial
 * entirely depending on which auth state the MP3 was first rendered in.
 *
 * This class owns the storage + plumbing for three things:
 *
 *   1. The per-post variant preference the admin can pin via the meta
 *      box (`logged_out` | `logged_in` | `both`). When `both`, the MP3
 *      store keys by auth-bucket so each audience gets its own audio.
 *
 *   2. Per-post samples of the extracted text hash reported by the
 *      frontend engine on each listen. A sample is { auth_bucket,
 *      text_hash, text_len, reported_at }. Samples are stored in a
 *      ring buffer of 10 per post so we can detect "this post's text
 *      reliably differs between auth states" without bloating the DB.
 *
 *   3. A detection verdict derived from the samples — either
 *      `same` (every bucket's hash matches), `differs` (buckets have
 *      meaningfully different text), or `unknown` (not enough samples).
 *      The meta-box uses this to default the radio and surface a
 *      contextual hint ("we detected extra content for logged-in users").
 *
 * Storage:
 *   - Per post: `_tta_mp3_variant` (`logged_out`|`logged_in`|`both`|'')
 *   - Per post: `_tta_atlasvoice_auth_samples` (JSON-safe array, max 10)
 *
 * Stateless: the class never runs its own hooks. It's a storage adapter
 * consumed by the REST route (C6a), the meta box (C6b), and the player
 * enqueue path (future integration with the MP3 cache key).
 *
 * Isolation note (P1/P4): namespace TTA\AtlasVoice — no cross-calls into
 * the legacy TTA\ namespace. Delete-safe.
 */
class AuthVariants {

	const META_VARIANT = '_tta_mp3_variant';
	const META_SAMPLES = '_tta_atlasvoice_auth_samples';

	const VARIANT_LOGGED_OUT = 'logged_out';
	const VARIANT_LOGGED_IN  = 'logged_in';
	const VARIANT_BOTH       = 'both';

	const MAX_SAMPLES = 10;
	// Reports are short fixed-size strings; cap to a sane upper bound so
	// we never store arbitrary attacker-controlled text in post meta.
	const MAX_HASH_LEN = 64;

	/**
	 * All valid variant values, including empty string (= unset).
	 *
	 * @return array<string>
	 */
	public static function valid_variants() {
		return array(
			'',
			self::VARIANT_LOGGED_OUT,
			self::VARIANT_LOGGED_IN,
			self::VARIANT_BOTH,
		);
	}

	/**
	 * Return the admin-pinned variant for a post, or '' when unset.
	 *
	 * @param int $post_id
	 * @return string
	 */
	public static function get_variant( $post_id ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return ''; }
		$v = (string) get_post_meta( $post_id, self::META_VARIANT, true );
		return in_array( $v, self::valid_variants(), true ) ? $v : '';
	}

	/**
	 * Persist the admin-pinned variant for a post. Clearing via ''.
	 *
	 * @param int    $post_id
	 * @param string $variant
	 * @return bool
	 */
	public static function set_variant( $post_id, $variant ) {
		$post_id = (int) $post_id;
		$variant = (string) $variant;
		if ( $post_id <= 0 ) { return false; }
		if ( ! in_array( $variant, self::valid_variants(), true ) ) {
			return false;
		}
		if ( $variant === '' ) {
			delete_post_meta( $post_id, self::META_VARIANT );
		} else {
			update_post_meta( $post_id, self::META_VARIANT, $variant );
		}
		return true;
	}

	/**
	 * Record a sample reported by the frontend engine. Each sample is
	 * a tuple (auth_bucket, text_hash, text_len, reported_at). Samples
	 * are de-duplicated per-bucket by text_hash — if the engine keeps
	 * reporting the same hash for logged_out users we don't need to
	 * keep multiple rows, just bump the reported_at. Ring-buffer
	 * truncation keeps the meta size bounded.
	 *
	 * @param int    $post_id
	 * @param bool   $is_logged_in
	 * @param string $text_hash    Short hash/fingerprint of extracted text.
	 * @param int    $text_len     Character count of extracted text.
	 * @return array The updated samples list (newest last).
	 */
	public static function record_sample( $post_id, $is_logged_in, $text_hash, $text_len ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return array(); }
		$text_hash = substr( preg_replace( '/[^A-Za-z0-9:_\-]/', '', (string) $text_hash ), 0, self::MAX_HASH_LEN );
		$text_len  = max( 0, (int) $text_len );
		if ( $text_hash === '' ) { return self::get_samples( $post_id ); }

		$bucket = $is_logged_in ? self::VARIANT_LOGGED_IN : self::VARIANT_LOGGED_OUT;

		$samples = self::get_samples( $post_id );
		$now     = time();

		// De-dupe: if this (bucket, hash) tuple already exists, just
		// update its reported_at in place.
		$found = false;
		foreach ( $samples as $idx => $s ) {
			if ( ! is_array( $s ) ) { continue; }
			if ( ( $s['bucket'] ?? '' ) === $bucket && ( $s['text_hash'] ?? '' ) === $text_hash ) {
				$samples[ $idx ]['reported_at'] = $now;
				$samples[ $idx ]['text_len']    = $text_len;
				$found = true;
				break;
			}
		}
		if ( ! $found ) {
			$samples[] = array(
				'bucket'      => $bucket,
				'text_hash'   => $text_hash,
				'text_len'    => $text_len,
				'reported_at' => $now,
			);
			if ( count( $samples ) > self::MAX_SAMPLES ) {
				$samples = array_slice( $samples, -self::MAX_SAMPLES );
			}
		}

		update_post_meta( $post_id, self::META_SAMPLES, $samples );
		return $samples;
	}

	/**
	 * Read the stored samples (always an array).
	 *
	 * @param int $post_id
	 * @return array<int,array{bucket:string,text_hash:string,text_len:int,reported_at:int}>
	 */
	public static function get_samples( $post_id ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return array(); }
		$s = get_post_meta( $post_id, self::META_SAMPLES, true );
		return is_array( $s ) ? array_values( $s ) : array();
	}

	/**
	 * Collapse the stored samples into a verdict:
	 *
	 *   'same'    — we have at least one sample from each of the two
	 *               buckets and their hashes match. No variant needed.
	 *   'differs' — at least one logged_out hash and at least one
	 *               logged_in hash disagree. The meta-box should
	 *               default to `both` and surface a hint.
	 *   'unknown' — only one bucket has reported, or nothing reported.
	 *               Don't overwrite the admin's preference.
	 *
	 * Verdicts are conservative. We only say "differs" when we are
	 * sure — the penalty for a false "differs" is storing two MP3s
	 * when one would do, and the penalty for a false "same" is audio
	 * wrong for half the users. We err toward `unknown`.
	 *
	 * @param int $post_id
	 * @return array{verdict:string,logged_out_hashes:array,logged_in_hashes:array}
	 */
	public static function get_verdict( $post_id ) {
		$samples = self::get_samples( $post_id );
		$lo = array();
		$li = array();
		foreach ( $samples as $s ) {
			if ( ! is_array( $s ) ) { continue; }
			$h = isset( $s['text_hash'] ) ? (string) $s['text_hash'] : '';
			if ( $h === '' ) { continue; }
			if ( ( $s['bucket'] ?? '' ) === self::VARIANT_LOGGED_OUT ) {
				$lo[ $h ] = true;
			} elseif ( ( $s['bucket'] ?? '' ) === self::VARIANT_LOGGED_IN ) {
				$li[ $h ] = true;
			}
		}

		$verdict = 'unknown';
		if ( ! empty( $lo ) && ! empty( $li ) ) {
			// If the two sets share *any* hash the content is stable
			// across auth states on at least some page loads — we
			// treat that as "same" because an MP3 that matches one
			// bucket will match the other in practice. Only when the
			// two sets are fully disjoint do we flag differs.
			$intersection = array_intersect_key( $lo, $li );
			$verdict = ! empty( $intersection ) ? 'same' : 'differs';
		}

		return array(
			'verdict'          => $verdict,
			'logged_out_hashes' => array_keys( $lo ),
			'logged_in_hashes'  => array_keys( $li ),
		);
	}

	/**
	 * Convenience: collapse get_variant + get_verdict into one payload
	 * for the REST + meta-box consumers. Never throws.
	 *
	 * @param int $post_id
	 * @return array
	 */
	public static function describe( $post_id ) {
		$post_id = (int) $post_id;
		$verdict = self::get_verdict( $post_id );
		return array(
			'post_id'  => $post_id,
			'variant'  => self::get_variant( $post_id ),
			'verdict'  => $verdict['verdict'],
			'samples'  => self::get_samples( $post_id ),
		);
	}
}
