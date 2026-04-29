<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice — Readers integration glue (TTS-238 v5 D13).
 *
 * P1 isolation: helpers.php only emits a single
 * `atlasvoice_after_clean_content` filter. All AtlasVoice-side append
 * logic lives here. Deleting `includes/atlasvoice/` cleanly removes
 * the integration; the legacy filter call in helpers.php becomes a
 * no-op (returns its first arg unchanged when no listener attached).
 *
 * Two filters are involved:
 *
 *   - `atlasvoice_after_clean_content` (legacy emission point)
 *     Fires inside `tta_get_button_content()` after `tta_clean_content`.
 *     Args: ( string $content, WP_Post|int|string $post ).
 *
 *   - `atlasvoice_extra_field_text` (developer opt-in)
 *     Default empty array. Devs hook in to return text strings from
 *     custom-field plugins (ACF, MetaBox, Pods, JetEngine, Toolset,
 *     Carbon Fields) — see `docs/atlasvoice-readers.md` for the
 *     canonical opt-in snippet.
 *
 * The chain: legacy filter fires → `append_extras()` runs the dev
 * filter → if non-empty, joins the strings with the configured
 * sentence delimiter and appends to the content.
 *
 * Free + Pro: shipped on both, dormant on both — no behavior unless
 * a third party hooks `atlasvoice_extra_field_text`.
 */
class ReadersIntegration {

	/** Hook registration (idempotent — Bootstrap guards repeat calls). */
	public static function register() {
		add_filter( 'atlasvoice_after_clean_content', array( __CLASS__, 'append_extras' ), 10, 2 );
	}

	/**
	 * Filter callback. If any custom-field text is returned from the
	 * `atlasvoice_extra_field_text` filter, append it to the content
	 * separated by the configured sentence delimiter.
	 *
	 * @param string                 $content Cleaned content text.
	 * @param \WP_Post|int|string    $post    Post object or ID.
	 * @return string
	 */
	public static function append_extras( $content, $post ) {
		$post_id = self::resolve_post_id( $post );
		if ( $post_id <= 0 ) { return $content; }

		$extra_texts = apply_filters( 'atlasvoice_extra_field_text', array(), $post_id );
		if ( ! is_array( $extra_texts ) || empty( $extra_texts ) ) {
			return $content;
		}

		$cleaned = array_filter( array_map( function ( $t ) {
			return trim( wp_strip_all_tags( (string) $t ) );
		}, $extra_texts ) );
		if ( empty( $cleaned ) ) {
			return $content;
		}

		$delim = apply_filters( 'tts_sentence_delimiter', '. ' );
		return trim( (string) $content ) . $delim . implode( $delim, $cleaned );
	}

	/**
	 * Best-effort post-id resolution. helpers.php passes either a
	 * WP_Post object, an int ID, or '' depending on the caller path
	 * (shortcode, button render, MP3 backfill, …).
	 *
	 * @param mixed $post
	 * @return int
	 */
	private static function resolve_post_id( $post ) {
		if ( $post instanceof \WP_Post ) { return (int) $post->ID; }
		if ( is_numeric( $post ) )       { return (int) $post; }
		return 0;
	}
}
