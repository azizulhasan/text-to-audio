<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice ContentHash short-circuit (TTS-238 v5 §5.2 / D2).
 *
 * This is the money-saver. A settings change (exclude CSS, text replace,
 * boilerplate toggle, post-excerpt on/off, etc.) always bumps the rule
 * fingerprint, but it does not always change the text a visitor will
 * actually hear. If `md5(extracted_text)` matches the hash we stored
 * last time we generated an MP3, the MP3 on disk is still correct and
 * we can skip the TTS provider call entirely — which costs real money
 * per character at ChatGPT TTS, ElevenLabs, Google Cloud TTS, etc.
 *
 * Short-circuitable cases (from plan §5.2):
 *   - "Add post excerpt" toggled on a post with empty excerpt.
 *   - CSS exclusion added that doesn't match any element in this post.
 *   - Text-exclude phrase added that doesn't appear in this post.
 *   - Include selector added that matches the same body the scorer
 *     would have picked anyway.
 *
 * Storage (post meta):
 *   `_atlasvoice_content_hash` — md5 of the last extracted text. Written
 *                                alongside MP3 generation (by D3's
 *                                SelectorHash) and by the skip path
 *                                here when the hash didn't change.
 *
 * Hook shape:
 *   short_circuit_or_dirty( $post_id ) returns `self::DECISION_SKIP` or
 *   `self::DECISION_REGEN`. D1's RegenGuard::rebuild_or_skip delegates
 *   to this function in production mode.
 *
 * Extraction path selection: the JS engine owns the canonical DOM-aware
 * extractor, but the guard runs server-side on template_redirect where
 * there's no DOM. We use a three-step resolution:
 *
 *   1. Check if the JS engine has pre-seeded the text via the
 *      `atlasvoice_extractor_result` filter (populated by a background
 *      fetch from a prior visit). This is the common case after the
 *      first visitor has warmed the meta.
 *   2. Fall back to the legacy extraction via TTA_Helper methods —
 *      same logic the MP3 generator used before v5, just with the
 *      AtlasVoice pipeline wrapper.
 *   3. If both fail, return DECISION_REGEN — safer to regenerate than
 *      to silently skip with a stale hash.
 *
 * Free tier: never reached. Free has no MP3 cache, so RegenGuard's mode
 * check short-circuits before we get here.
 */
class ContentHash {

	/** Post meta key — md5 of the last extracted body that was synthesised. */
	const META_CONTENT_HASH = '_atlasvoice_content_hash';

	/** Decision: MP3 on disk is still valid, bail out before the TTS call. */
	const DECISION_SKIP = 'skip';

	/** Decision: text differs, stale MP3 must be deleted and regen queued. */
	const DECISION_REGEN = 'regen';

	/** Decision: extractor couldn't produce text — treat as regen (safest). */
	const DECISION_UNKNOWN = 'unknown';

	/**
	 * Compute the decision for a single post. Pure function — reads
	 * post meta + extracts text + compares — does NOT write anything
	 * itself except the new content hash when it's different. MP3
	 * deletion / regen queueing is the caller's responsibility so we
	 * stay unit-testable and don't accidentally wipe files from a
	 * background cron context.
	 *
	 * @param int $post_id
	 * @return array {
	 *   @type string $decision  DECISION_SKIP | DECISION_REGEN | DECISION_UNKNOWN
	 *   @type string $new_hash  The freshly computed md5 (empty on UNKNOWN).
	 *   @type string $old_hash  The previously stored md5 (empty if never set).
	 *   @type int    $text_len  Character count of the extracted body.
	 *   @type string $source    Which extraction path produced the text.
	 * }
	 */
	public static function short_circuit_or_dirty( $post_id ) {
		$post_id = (int) $post_id;
		$result  = array(
			'decision' => self::DECISION_UNKNOWN,
			'new_hash' => '',
			'old_hash' => (string) get_post_meta( $post_id, self::META_CONTENT_HASH, true ),
			'text_len' => 0,
			'source'   => '',
		);

		if ( $post_id <= 0 ) {
			return $result;
		}

		$extracted          = self::extract_text( $post_id );
		$result['source']   = $extracted['source'];
		$result['text_len'] = strlen( $extracted['text'] );

		// If the extractor couldn't produce any text at all, the caller
		// must treat it as UNKNOWN (regen-safe) — we can't prove the
		// MP3 is still correct without comparable input.
		if ( $extracted['text'] === '' ) {
			return $result;
		}

		$new_hash          = md5( $extracted['text'] );
		$result['new_hash'] = $new_hash;

		if ( $new_hash === $result['old_hash'] && $result['old_hash'] !== '' ) {
			$result['decision'] = self::DECISION_SKIP;
			return $result;
		}

		// Hash differs (or was never set). Caller should regenerate.
		// We write the new hash here so that even if regen fails the
		// next visitor sees the updated fingerprint and re-queues
		// instead of looping on the same stale comparison.
		update_post_meta( $post_id, self::META_CONTENT_HASH, $new_hash );
		$result['decision'] = self::DECISION_REGEN;
		return $result;
	}

	/**
	 * Three-step extraction: filter → legacy helper → empty.
	 * Exposed as its own method so the boilerplate detector and
	 * the MP3 generator can share the same code path without
	 * coupling to RegenGuard.
	 *
	 * @param int $post_id
	 * @return array { text: string, source: string }
	 */
	public static function extract_text( $post_id ) {
		// 1. Filter-provided text (JS engine background-fetched, or a
		//    Pro reader class like ACF/MetaBox/etc. from D13).
		/**
		 * Filter the extracted body text for a post before hashing.
		 *
		 * Callbacks receive an empty string and should return the final
		 * plain-text body a TTS engine would synthesise. Return empty
		 * string to defer to legacy helpers.
		 *
		 * @param string $text
		 * @param int    $post_id
		 */
		$filtered = (string) apply_filters( 'atlasvoice_extractor_result', '', $post_id );
		if ( $filtered !== '' ) {
			return array( 'text' => $filtered, 'source' => 'filter' );
		}

		// 2. Legacy helper — tta_clean_content() runs the same wp_kses /
		//    excerpt / shortcode pipeline the MP3 generator already uses.
		//    Load the post on demand so this method is safe to call from
		//    cron contexts where `global $post` isn't set.
		$post = get_post( $post_id );
		if ( ! $post || $post->post_status !== 'publish' ) {
			return array( 'text' => '', 'source' => 'none' );
		}

		$content = self::legacy_extract( $post );
		if ( $content !== '' ) {
			return array( 'text' => $content, 'source' => 'legacy' );
		}

		return array( 'text' => '', 'source' => 'none' );
	}

	/**
	 * Minimal legacy extractor — title + content + optional excerpt,
	 * stripped through the same `tta_clean_content` filter the MP3
	 * pipeline uses. No DOM, no scoring; this is purely a byte-equal
	 * hash input. Deliberate subset of the full extractor because the
	 * hash just needs to be stable across calls, not identical to
	 * what the JS engine produces — if they disagree that's also an
	 * invalidation signal and the caller regenerates.
	 *
	 * @param \WP_Post $post
	 * @return string
	 */
	protected static function legacy_extract( $post ) {
		$parts = array();

		// Title — mirrors the `tta__settings_add_post_title_to_read` toggle.
		$settings = array();
		if ( class_exists( '\\TTA\\TTA_Helper' ) ) {
			$all = \TTA\TTA_Helper::tts_get_settings( '', $post->ID );
			if ( is_array( $all ) && isset( $all['settings'] ) ) {
				$settings = is_object( $all['settings'] ) ? (array) $all['settings'] : (array) $all['settings'];
			}
		}
		if ( ! empty( $settings['tta__settings_add_post_title_to_read'] ) ) {
			$parts[] = (string) $post->post_title;
		}

		// Excerpt (only when the toggle is on AND the post actually has one).
		if ( ! empty( $settings['tta__settings_add_post_excerpt_to_read'] )
		     && trim( (string) $post->post_excerpt ) !== '' ) {
			$parts[] = (string) $post->post_excerpt;
		}

		// Body — run through the existing filter chain the player uses so
		// shortcode expansion, excluded phrases, and alias substitutions
		// produce the same output we'd have hashed before v5 landed.
		$body = (string) $post->post_content;
		if ( function_exists( 'tta_clean_content' ) ) {
			$body = tta_clean_content( $body, $post->ID );
		} else {
			$body = wp_strip_all_tags( $body );
		}
		$parts[] = $body;

		$joined = trim( implode( ' ', array_filter( $parts, 'strlen' ) ) );

		// Collapse whitespace so trivial formatting changes don't bust
		// the hash. This is the same normalisation the JS engine does
		// after DOM extraction.
		$joined = preg_replace( '/\s+/u', ' ', $joined );
		return (string) $joined;
	}
}
