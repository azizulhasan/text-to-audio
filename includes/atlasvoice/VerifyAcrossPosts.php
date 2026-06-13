<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice "Verify across posts" sample picker (TTS-238 v5 §13 D14).
 *
 * Read-only helper used by the step-rail's "Test rule across N posts"
 * button and (later) by the Go Live dialog as a confidence check before
 * flipping the staging→production toggle.
 *
 * The picker itself only RESOLVES the sample list — given a scope, it
 * returns N random published posts matching the constraints, complete
 * with permalinks the client can load in hidden iframes. The actual
 * "does this selector match?" measurement happens client-side inside
 * each iframe (D14.2) so the answer reflects the live rendered DOM
 * exactly the way a visitor sees it, instead of a server-side
 * approximation that misses JS-injected content.
 *
 * Pure read: no option writes, no transients, safe to call during
 * `template_redirect`, from cron, or inside a REST handler.
 *
 * Mirrors RestRoutes::find_sample_post but returns a list (not a single
 * post id), uses `orderby=rand` so consecutive runs surface different
 * posts (catching brittle rules that only break on certain templates),
 * and excludes the post the admin is currently working from.
 */
class VerifyAcrossPosts {

	/**
	 * Allowed `orderby` values exposed through the REST API. Anything
	 * else falls back to 'rand' silently — the route validates too,
	 * but defending in depth means a hand-crafted call can't poke the
	 * underlying WP_Query with arbitrary SQL fragments.
	 */
	const ALLOWED_ORDERBY = array( 'rand', 'date_desc', 'date_asc' );

	/**
	 * Pick a random sample of published posts matching the given filters.
	 *
	 * @param string $post_type        Post type slug. '' for any public,
	 *                                 non-attachment type.
	 * @param string $language         Language code (WPML / Polylang lang
	 *                                 query-arg). '' for any language.
	 * @param int    $size             Sample size, clamped to [1, 20].
	 * @param int    $exclude_post_id  Post id to omit (typically the post
	 *                                 the admin is currently editing).
	 * @param string $orderby          One of self::ALLOWED_ORDERBY:
	 *                                 'rand' (default — random sample),
	 *                                 'date_desc' (newest first),
	 *                                 'date_asc' (oldest first).
	 * @return array<int, array{id:int,url:string,title:string,post_type:string,language:string}>
	 */
	public static function pick_sample_posts( $post_type, $language, $size = 3, $exclude_post_id = 0, $orderby = 'rand' ) {
		$size = max( 1, min( 20, (int) $size ) );

		// Map our public orderby tokens to actual WP_Query args. Random
		// stays random (catches brittle rules across templates); date
		// orderings let admins sanity-check against recent / legacy posts
		// when they want to reproduce a specific report.
		if ( ! in_array( $orderby, self::ALLOWED_ORDERBY, true ) ) {
			$orderby = 'rand';
		}
		$wp_orderby = 'rand';
		$wp_order   = 'DESC';
		if ( $orderby === 'date_desc' ) { $wp_orderby = 'date'; $wp_order = 'DESC'; }
		if ( $orderby === 'date_asc'  ) { $wp_orderby = 'date'; $wp_order = 'ASC';  }

		// TTS-238 — avoid post__not_in (flagged by the VIP performance
		// sniff for its NOT IN subquery). We only ever exclude the single
		// post the admin is picking on, so over-fetch by one and drop
		// that id in PHP after the query instead.
		$fetch = ( $exclude_post_id > 0 ) ? ( $size + 1 ) : $size;

		$args = array(
			'post_status'    => 'publish',
			'posts_per_page' => $fetch,
			'orderby'        => $wp_orderby,
			'order'          => $wp_order,
			'fields'         => 'ids',
			'no_found_rows'  => true,
			// Re-run multilingual plugin filters so `lang` below works.
			'suppress_filters' => false,
		);

		if ( (string) $post_type !== '' ) {
			$args['post_type'] = $post_type;
		} else {
			// "Any" means every public post type the user can voice — drop
			// attachments since they don't render the picker chrome.
			$tracked = get_post_types( array( 'public' => true ) );
			if ( is_array( $tracked ) && ! empty( $tracked ) ) {
				$args['post_type'] = array_values( array_filter( $tracked, function ( $slug ) {
					return $slug !== 'attachment';
				} ) );
			}
		}

		// WPML / Polylang activate via the `lang` query-arg. On non-
		// multilingual sites this is a no-op.
		if ( (string) $language !== '' ) {
			$args['lang'] = $language;
		}

		$ids = get_posts( $args );
		if ( ! is_array( $ids ) ) {
			return array();
		}

		// Drop the excluded post in PHP (replaces post__not_in), then
		// trim back to the requested sample size.
		if ( $exclude_post_id > 0 ) {
			$ids = array_values( array_filter( $ids, function ( $id ) use ( $exclude_post_id ) {
				return (int) $id !== (int) $exclude_post_id;
			} ) );
		}
		$ids = array_slice( $ids, 0, $size );

		$out = array();
		foreach ( $ids as $id ) {
			$url = get_permalink( $id );
			if ( ! $url ) { continue; }
			$out[] = array(
				'id'        => (int) $id,
				'url'       => esc_url_raw( $url ),
				'title'     => html_entity_decode( (string) get_the_title( $id ), ENT_QUOTES ),
				'post_type' => (string) get_post_type( $id ),
				'language'  => (string) $language,
			);
		}
		return $out;
	}
}
