<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice Boilerplate Detector (TTS-238 C3a, v5 §14.1 refactor).
 *
 * Finds sentence-level text that repeats across posts on the site —
 * "Subscribe to our newsletter", "Related articles", "Share this on
 * Facebook", etc. These are the #1 complaint from TTS users: the player
 * reads the same nav/promo copy at the end of every article.
 *
 * Design philosophy:
 *   - Zero-touch: runs nightly via WP-Cron, no admin action required.
 *   - Cheap: samples N most-recent posts per post-type (default 20),
 *     tokenises their rendered content into sentence fragments, counts
 *     how often each fragment recurs, and flags anything that appears in
 *     >= SAMPLE_THRESHOLD of sampled posts (default 30 %).
 *   - Conservative: only flags fragments >= 30 chars (so we don't
 *     surface common stopword sentences like "I agree." or "Read more.").
 *   - Storage-bounded: capped at 50 suggestions per run, stored with
 *     autoload=false so it doesn't bloat every WP request.
 *
 * The detector never mutates content. It only writes to the
 * `tta_atlasvoice_boilerplate_suggestions` option. The dashboard reads
 * that option via REST (C3b) and lets the admin pick which fragments to
 * exclude from the player (C3c).
 *
 * Isolation note (P1/P4): this class has no dependency on the legacy
 * TTA\ namespace; it writes to an option + registers one cron hook. The
 * whole module can be deleted with zero legacy-side impact.
 */
class BoilerplateDetector {

	const OPTION_KEY        = 'tta_atlasvoice_boilerplate_suggestions';
	const CRON_HOOK         = 'tta_atlasvoice_detect_boilerplate';
	const SAMPLE_SIZE       = 20;     // posts per post-type
	const MIN_FRAGMENT_LEN  = 30;     // characters
	const MAX_FRAGMENT_LEN  = 400;    // skip whole-paragraph matches — almost always false positive
	const SAMPLE_THRESHOLD  = 0.30;   // appears in >= 30 % of sampled posts
	const MAX_SUGGESTIONS   = 50;

	/**
	 * Wire up the nightly cron. Called once from the AtlasVoice bootstrap.
	 * Safe to call repeatedly — wp_next_scheduled gate prevents duplicates.
	 */
	public static function register_cron() {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			// Randomise start time slightly so we don't thundering-herd
			// with other plugin crons. 01:00 local time + 0-59 min jitter.
			$offset = wp_rand( 0, 3540 );
			wp_schedule_event( strtotime( 'tomorrow 01:00' ) + $offset, 'daily', self::CRON_HOOK );
		}
		add_action( self::CRON_HOOK, array( __CLASS__, 'run' ) );
	}

	/**
	 * Remove the cron job — called from deactivation.
	 */
	public static function unregister_cron() {
		$ts = wp_next_scheduled( self::CRON_HOOK );
		if ( $ts ) {
			wp_unschedule_event( $ts, self::CRON_HOOK );
		}
	}

	/**
	 * Main detection pass. Safe to call manually (admin debug, unit
	 * tests) — idempotent and bounded.
	 *
	 * Flow:
	 *   1. Collect the post types the plugin is configured to speak.
	 *   2. For each, query the most-recent SAMPLE_SIZE published posts.
	 *   3. Tokenise rendered content → sentence fragments.
	 *   4. Count fragment frequency across sampled posts (per-post, so a
	 *      fragment appearing 5 times in one post still counts as 1).
	 *   5. Keep fragments with frequency >= SAMPLE_THRESHOLD.
	 *   6. Sort by frequency desc, truncate, write option.
	 *
	 * @return array The suggestion list that was written.
	 */
	public static function run() {
		$post_types = self::get_target_post_types();
		if ( empty( $post_types ) ) { $post_types = array( 'post' ); }

		// post_fragment_count[fragment] = number of DISTINCT posts it appears in
		$post_fragment_count = array();
		$sample_total        = 0;
		$example_posts       = array(); // fragment → [post_ids]

		foreach ( $post_types as $pt ) {
			$query = new \WP_Query( array(
				'post_type'      => $pt,
				'post_status'    => 'publish',
				'posts_per_page' => self::SAMPLE_SIZE,
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
				'fields'         => 'ids',
			) );
			if ( empty( $query->posts ) ) { continue; }

			foreach ( $query->posts as $pid ) {
				$sample_total++;
				$post        = get_post( $pid );
				if ( ! $post ) { continue; }
				$raw         = (string) $post->post_content;
				$rendered    = apply_filters( 'the_content', $raw );
				$text        = wp_strip_all_tags( $rendered, true );
				$fragments   = self::tokenise( $text );
				$seen_in_post = array();
				foreach ( $fragments as $frag ) {
					if ( isset( $seen_in_post[ $frag ] ) ) { continue; }
					$seen_in_post[ $frag ] = true;
					if ( ! isset( $post_fragment_count[ $frag ] ) ) {
						$post_fragment_count[ $frag ] = 0;
						$example_posts[ $frag ] = array();
					}
					$post_fragment_count[ $frag ]++;
					if ( count( $example_posts[ $frag ] ) < 3 ) {
						$example_posts[ $frag ][] = $pid;
					}
				}
			}
		}

		if ( $sample_total < 3 ) {
			// Not enough data to detect anything. Wipe any stale value so
			// the dashboard doesn't show outdated suggestions.
			update_option( self::OPTION_KEY, array(
				'generated_at' => time(),
				'sample_size'  => $sample_total,
				'suggestions'  => array(),
			), false );
			return array();
		}

		$threshold = max( 2, (int) ceil( $sample_total * self::SAMPLE_THRESHOLD ) );
		$suggestions = array();
		foreach ( $post_fragment_count as $frag => $count ) {
			if ( $count >= $threshold ) {
				$suggestions[] = array(
					'text'          => $frag,
					'post_count'    => $count,
					'sample_total'  => $sample_total,
					'frequency'     => round( $count / $sample_total, 3 ),
					'example_posts' => $example_posts[ $frag ],
				);
			}
		}

		usort( $suggestions, function ( $a, $b ) {
			if ( $a['post_count'] === $b['post_count'] ) {
				return strlen( $b['text'] ) - strlen( $a['text'] );
			}
			return $b['post_count'] - $a['post_count'];
		} );
		if ( count( $suggestions ) > self::MAX_SUGGESTIONS ) {
			$suggestions = array_slice( $suggestions, 0, self::MAX_SUGGESTIONS );
		}

		update_option( self::OPTION_KEY, array(
			'generated_at' => time(),
			'sample_size'  => $sample_total,
			'post_types'   => array_values( $post_types ),
			'suggestions'  => $suggestions,
		), false );

		return $suggestions;
	}

	/**
	 * Read the stored suggestions. Returns the raw option value so the
	 * REST layer can return sample_size / generated_at alongside the list.
	 */
	public static function get_cached() {
		$stored = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $stored ) ) { $stored = array(); }
		if ( ! isset( $stored['suggestions'] ) ) { $stored['suggestions'] = array(); }
		if ( ! isset( $stored['generated_at'] ) ) { $stored['generated_at'] = 0; }
		if ( ! isset( $stored['sample_size'] ) )  { $stored['sample_size']  = 0; }
		return $stored;
	}

	/**
	 * Which post types should we scan? Prefer the plugin's configured
	 * list; fall back to 'post' when the plugin hasn't been configured.
	 */
	private static function get_target_post_types() {
		$settings = get_option( 'tta_settings_data', array() );
		if ( is_array( $settings ) && ! empty( $settings['post_types'] ) ) {
			$pts = (array) $settings['post_types'];
			// Sanity-filter: only real, public post types.
			$pts = array_filter( $pts, function ( $pt ) {
				return post_type_exists( $pt ) && is_post_type_viewable( $pt );
			} );
			if ( ! empty( $pts ) ) { return array_values( $pts ); }
		}
		return array( 'post' );
	}

	/**
	 * Split plain text into sentence-ish fragments of allowed length.
	 * Splits on .!?\n — not perfect but boilerplate is usually self-
	 * contained sentences, so the naive approach works well enough.
	 *
	 * Post-processes each fragment to:
	 *   - Collapse whitespace
	 *   - Lowercase for matching (stored trimmed)
	 *   - Skip too-short / too-long fragments
	 *   - Skip URL-only / navigation-y fragments
	 *
	 * @param string $text
	 * @return array<string>
	 */
	private static function tokenise( $text ) {
		$text = (string) $text;
		if ( $text === '' ) { return array(); }
		// Normalise unicode whitespace + common ligatures.
		$text = preg_replace( '/\s+/u', ' ', $text );
		$parts = preg_split( '/(?<=[\.!?])\s+/u', $text );
		if ( ! is_array( $parts ) ) { return array(); }

		$out = array();
		foreach ( $parts as $p ) {
			$p = trim( $p );
			$len = mb_strlen( $p );
			if ( $len < self::MIN_FRAGMENT_LEN || $len > self::MAX_FRAGMENT_LEN ) { continue; }
			// Skip URL-only fragments.
			if ( preg_match( '~^https?://\S+$~i', $p ) ) { continue; }
			// Normalise for grouping — collapse to lowercase so "Subscribe now"
			// and "subscribe now" match.
			$key = mb_strtolower( $p );
			$out[] = $key;
		}
		return $out;
	}
}
