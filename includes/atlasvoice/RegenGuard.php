<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice RegenGuard (TTS-238 v5 §5.1 / D1).
 *
 * Lazy cache-invalidation hook for the AtlasVoice pipeline. On every
 * singular front-end hit we ask three questions before doing any work:
 *
 *   1. Is the admin opted into the new extractor at all? (Layer 1)
 *   2. Are we in production mode? (Layer 2 — staging falls through to
 *      the legacy pipeline with zero interference.)
 *   3. Is this post actually dirty? (meta `_atlasvoice_regen_dirty`.)
 *
 * If any answer is "no" we return immediately. The hook is cheap:
 * two option reads (cached by WP) and one post-meta read. A fourth
 * guard — `tta_regen_lock_{post_id}` — coalesces concurrent hits so
 * two simultaneous visitors don't both trigger regen for the same
 * post. 30s is long enough to cover a TTS provider call while still
 * allowing retry if the first attempt dies.
 *
 * This is the D1 skeleton. The decision funnel in `rebuild_or_skip`
 * (content-hash short-circuit, queued regen) lands in D2. For now
 * the rebuild path is a stub that just clears the dirty flag so
 * the hook shell can be verified end-to-end without any side effects.
 *
 * Priority 5 is intentional: it runs *before* the legacy pipeline
 * calls `get_mp3_file_urls()` on its own template_redirect callbacks,
 * so by the time anyone asks for an MP3 URL the regen has either
 * started or been short-circuited.
 *
 * Free tier: `_atlasvoice_regen_dirty` is never written (no MP3 cache
 * to invalidate), so the meta read always returns empty and we exit
 * before doing any work. Layer 2 mode also defaults to `staging` for
 * Free, which short-circuits even sooner.
 */
class RegenGuard {

	/** Post meta key — one-shot dirty flag set by settings-save callbacks. */
	const META_DIRTY = '_atlasvoice_regen_dirty';

	/** Transient key pattern — per-post lock to coalesce regen storms. */
	const LOCK_PATTERN = 'tta_regen_lock_%d';

	/** Lock TTL — covers a TTS provider round-trip with headroom. */
	const LOCK_TTL = 30;

	/** Settings flag — Layer 1 opt-in. Same key used everywhere else. */
	const OPT_IN_KEY = 'tta__settings_use_atlasvoice_extractor';

	/** Settings flag — Layer 2 mode. `staging` (default) | `production`. */
	const MODE_KEY = 'tta__settings_atlasvoice_mode';

	/** Mode constants. Match the strings the Go Live dialog writes. */
	const MODE_STAGING    = 'staging';
	const MODE_PRODUCTION = 'production';

	/**
	 * Register the template_redirect hook. Idempotent — called from
	 * Bootstrap::register(), which has its own registered-once guard.
	 */
	public static function register() {
		add_action( 'template_redirect', array( __CLASS__, 'on_template_redirect' ), 5 );
	}

	/**
	 * Gate + dispatch. Every early-return is a design choice documented
	 * in the class docblock — don't inline conditionals just to save a
	 * line. Each guard has a specific failure mode we never want to hit
	 * on the visitor path.
	 *
	 * @return void
	 */
	public static function on_template_redirect() {
		if ( ! is_singular() ) {
			return;
		}
		if ( ! self::opt_in_on() ) {
			return;
		}
		if ( self::mode() !== self::MODE_PRODUCTION ) {
			// Staging: let the legacy pipeline handle playback
			// untouched. The new extractor still writes rules and
			// runs self-heal in the background (§4), but visitor
			// output stays on the old codepath until Go Live.
			return;
		}

		$post_id = (int) get_queried_object_id();
		if ( $post_id <= 0 ) {
			return;
		}

		$lock_key = sprintf( self::LOCK_PATTERN, $post_id );
		if ( get_transient( $lock_key ) ) {
			// Another visitor is already regenerating this post.
			// Fall through to whatever MP3 is on disk — it's either
			// fresh (from the previous pass) or will be ready for
			// the next visitor. Never block the current hit on it.
			return;
		}

		if ( ! get_post_meta( $post_id, self::META_DIRTY, true ) ) {
			// Content-hash already validated on a prior visit, or
			// the settings-save didn't flag this post as affected.
			// Nothing to do.
			return;
		}

		// Claim the lock *before* calling into rebuild_or_skip so a
		// concurrent request that arrives between the dirty-flag read
		// and the delete_post_meta below doesn't trigger a duplicate
		// regen. 30s TTL means a crashed worker auto-recovers on the
		// next hit instead of leaving the post permanently stuck.
		set_transient( $lock_key, 1, self::LOCK_TTL );

		self::rebuild_or_skip( $post_id );

		// Dirty flag cleared *after* rebuild_or_skip so that if the
		// decision funnel throws, the next visitor retries instead
		// of pretending the post is clean.
		delete_post_meta( $post_id, self::META_DIRTY );
	}

	/**
	 * Pull the `settings.settings` sub-map that the legacy plugin writes
	 * through `tts_get_settings('')`. Centralised so opt_in_on() and
	 * mode() share a single settings-load path — cheap to call twice
	 * because WP's option cache + the helper's own static cache make
	 * repeat calls free.
	 *
	 * The storage layout is intentionally quirky: `tta_settings_data`
	 * itself is a FLAT map of every setting row, but `tts_get_settings`
	 * wraps it in a nested shape { listening, settings, recording,
	 * customize, ... } for readability when consumed by React. The
	 * checkbox rows we care about live under the inner `settings` key.
	 *
	 * @return array
	 */
	protected static function settings_row() {
		if ( ! class_exists( '\\TTA\\TTA_Helper' ) ) {
			return array();
		}
		$all = \TTA\TTA_Helper::tts_get_settings( '', 0 );
		if ( is_object( $all ) ) {
			$all = (array) $all;
		}
		$row = isset( $all['settings'] ) ? $all['settings'] : array();
		if ( is_object( $row ) ) {
			$row = (array) $row;
		}
		return is_array( $row ) ? $row : array();
	}

	/**
	 * Layer 1 opt-in check. Split out so D4's mode check can share the
	 * settings-load path, and so tests can mock it independently.
	 *
	 * @return bool
	 */
	public static function opt_in_on() {
		$row = self::settings_row();
		return ! empty( $row[ self::OPT_IN_KEY ] );
	}

	/**
	 * Layer 2 mode getter. Defaults to `staging` so Free sites and
	 * fresh Pro installs never accidentally hit production until the
	 * admin explicitly Goes Live (D5).
	 *
	 * @return string MODE_STAGING | MODE_PRODUCTION
	 */
	public static function mode() {
		$row  = self::settings_row();
		$mode = isset( $row[ self::MODE_KEY ] ) ? (string) $row[ self::MODE_KEY ] : self::MODE_STAGING;
		return ( $mode === self::MODE_PRODUCTION ) ? self::MODE_PRODUCTION : self::MODE_STAGING;
	}

	/**
	 * Decision funnel. Delegates to ContentHash for the short-circuit
	 * compute, then emits one of three actions the rest of the pipeline
	 * can hang MP3-delete / regen-queue / selector-hash-retag callbacks
	 * from. Deliberately does NOT touch the MP3 cache itself — that's
	 * wired by D3 (SelectorHash) for the retag path and the existing
	 * Pro regen queue for the regen path.
	 *
	 * @param int $post_id
	 * @return void
	 */
	protected static function rebuild_or_skip( $post_id ) {
		/**
		 * Fires when the regen-guard decides a post needs (re-)evaluation.
		 * Observational — consumers that merely want to know a dirty
		 * post was visited can listen without pulling in the heavy-weight
		 * rebuild logic.
		 *
		 * @param int $post_id
		 */
		do_action( 'atlasvoice_regen_guard_fired', $post_id );

		if ( ! class_exists( '\\TTA\\AtlasVoice\\ContentHash' ) ) {
			// ContentHash isn't available (shouldn't happen post-D2,
			// but belt-and-braces). Fall through and let the legacy
			// pipeline regenerate on its own schedule.
			return;
		}

		$decision = ContentHash::short_circuit_or_dirty( $post_id );
		switch ( $decision['decision'] ) {
			case ContentHash::DECISION_SKIP:
				/**
				 * Fires when the content hash matches — the MP3 on disk
				 * is still valid, just needs its selector-hash retagged
				 * to reflect the new rule fingerprint (D3 wires this).
				 *
				 * @param int   $post_id
				 * @param array $decision
				 */
				do_action( 'atlasvoice_regen_skip', $post_id, $decision );
				break;

			case ContentHash::DECISION_REGEN:
				/**
				 * Fires when the content hash differs — the caller
				 * (existing Pro regen queue) should delete the stale
				 * MP3 and enqueue a new synthesis. ContentHash has
				 * already written the new `_atlasvoice_content_hash`.
				 *
				 * @param int   $post_id
				 * @param array $decision
				 */
				do_action( 'atlasvoice_regen_required', $post_id, $decision );
				break;

			case ContentHash::DECISION_UNKNOWN:
			default:
				/**
				 * Extractor couldn't produce text (post deleted, password
				 * protected, etc.). Safer to regen on the next successful
				 * hit than to mask the problem silently.
				 *
				 * @param int   $post_id
				 * @param array $decision
				 */
				do_action( 'atlasvoice_regen_unknown', $post_id, $decision );
				break;
		}
	}
}
