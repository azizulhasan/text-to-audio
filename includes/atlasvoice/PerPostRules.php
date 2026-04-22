<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice per-post rule overrides (TTS-238 v5 §5.7 / D7).
 *
 * Stores Pro-only per-post rule overrides that sit at the top of the
 * RuleResolver precedence stack. An editor with `edit_post` capability
 * on a post can pin a specific selector (or a full rule payload in a
 * later milestone) that beats the post-type / language / global layers.
 *
 * Storage:
 *   post meta `_atlasvoice_post_rules` — array, never scalar. Typical
 *   shape (expanded in D10):
 *     {
 *       selector:      '#custom-readout',   // required when override
 *                                            // is present; empty string
 *                                            // means "no override set".
 *       excl_css:      '',                  // future: per-post CSS excludes
 *       excl_texts:    [],                  // future: per-post text excludes
 *       add_title:     null,                // null → defer to global
 *       add_excerpt:   null,
 *       text_before:   '',
 *       text_after:    '',
 *       ts:            unix timestamp of last write.
 *       user_id:       last editor.
 *     }
 *
 * Hook surface:
 *   - Writes fire `atlasvoice_rules_changed` so the Snapshots ring
 *     picks up the previous payload automatically.
 *   - Writes also fire `atlasvoice_regen_dirty_set` so visible regen
 *     (RegenGuard) re-evaluates on the next visitor hit.
 *
 * Free tier: `available()` returns false unless Pro is active, so the
 * meta is never read/written on Free. The class still ships in Free
 * because D7 runs through the Pro-plugin detector rather than
 * conditionally requiring the file — keeps the autoload graph flat.
 */
class PerPostRules {

	/** Post meta key for the override payload. */
	const META_KEY = '_atlasvoice_post_rules';

	/** Post meta key for RegenGuard's dirty-flag. Redeclared here to
	 *  avoid a cross-class constant dependency in the hot path. */
	const META_DIRTY = '_atlasvoice_regen_dirty';

	/**
	 * Wire up REST routes and the change → dirty bridge. Idempotent
	 * via Bootstrap::register()'s static guard.
	 *
	 * @return void
	 */
	public static function register() {
		// Invalidate the post's MP3 whenever its override changes so
		// RegenGuard re-runs on the next visitor hit. We listen on our
		// own side-effect action rather than post meta hooks so callers
		// that bypass the REST layer (e.g. migration scripts) still get
		// the dirty-bit wiring.
		add_action( 'atlasvoice_post_rules_changed', array( __CLASS__, 'mark_dirty' ), 10, 2 );
	}

	/**
	 * Is the per-post layer available on this install? Used by
	 * RuleResolver to skip meta reads entirely on Free so non-Pro
	 * sites stay single-digit-ms on every resolve.
	 *
	 * @return bool
	 */
	public static function available() {
		if ( function_exists( '\\is_pro_active' ) ) {
			return (bool) \is_pro_active();
		}
		// Fallback detection — mirrors TTA_Helper::is_pro_active() when
		// the helper hasn't loaded yet (e.g. during uninstall).
		$candidates = array(
			'text-to-speech-pro/text-to-speech-pro.php',
			'text-to-speech-pro-premium/text-to-speech-pro-premium.php',
			'text-to-audio-pro/text-to-audio-pro.php',
			'text-to-audio-pro-premium/text-to-audio-pro-premium.php',
		);
		foreach ( $candidates as $rel ) {
			if ( function_exists( 'is_plugin_active' ) && is_plugin_active( $rel ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Read the override payload. Returns the canonical empty-override
	 * shape (empty strings, null toggles, empty arrays) when nothing
	 * is stored, so consumers don't have to isset-check every field.
	 *
	 * @param int $post_id
	 * @return array
	 */
	public static function get( $post_id ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return self::empty_payload(); }
		$raw = get_post_meta( $post_id, self::META_KEY, true );
		if ( ! is_array( $raw ) ) { return self::empty_payload(); }
		return array_merge( self::empty_payload(), $raw );
	}

	/**
	 * Write the override payload. Merges against the canonical empty
	 * shape so partial updates from the UI don't silently drop fields.
	 * Snapshots the previous payload via `atlasvoice_rules_changed` and
	 * fires `atlasvoice_post_rules_changed` for the dirty bridge.
	 *
	 * @param int   $post_id
	 * @param array $rules
	 * @return array The merged payload as stored.
	 */
	public static function set( $post_id, $rules ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return self::empty_payload(); }

		$prev  = self::get( $post_id );
		$clean = self::sanitise( is_array( $rules ) ? $rules : array() );
		$clean['ts']      = time();
		$clean['user_id'] = get_current_user_id();

		update_post_meta( $post_id, self::META_KEY, $clean );

		// Snapshot the previous payload so the editor can undo via the
		// Rules table [History ▾] dropdown.
		do_action(
			'atlasvoice_rules_changed',
			array( 'type' => 'post', 'post_id' => $post_id ),
			$prev,
			array( 'reason' => 'per-post-edit' )
		);

		/**
		 * Fires after a per-post override is written. Payload includes
		 * old and new for diff renderers.
		 *
		 * @param int   $post_id
		 * @param array $new
		 * @param array $old
		 */
		do_action( 'atlasvoice_post_rules_changed', $post_id, $clean, $prev );

		return $clean;
	}

	/**
	 * Remove the override entirely. Equivalent to "revert to inherited"
	 * in the meta-box UI. Still snapshots first so admins can undo.
	 *
	 * @param int $post_id
	 * @return bool
	 */
	public static function clear( $post_id ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return false; }

		$prev = self::get( $post_id );
		delete_post_meta( $post_id, self::META_KEY );

		do_action(
			'atlasvoice_rules_changed',
			array( 'type' => 'post', 'post_id' => $post_id ),
			$prev,
			array( 'reason' => 'per-post-clear' )
		);
		do_action( 'atlasvoice_post_rules_changed', $post_id, self::empty_payload(), $prev );
		return true;
	}

	/**
	 * Flip RegenGuard's dirty flag for the post. Hooked from our own
	 * change action so the dirty bridge is opt-in and testable.
	 *
	 * @param int   $post_id
	 * @param array $new
	 * @return void
	 */
	public static function mark_dirty( $post_id, $new ) {
		update_post_meta( (int) $post_id, self::META_DIRTY, 1 );
	}

	/**
	 * Canonical empty-override payload. Kept as a single source so
	 * get() + set() + the REST layer all agree on the field list.
	 *
	 * @return array
	 */
	public static function empty_payload() {
		return array(
			'selector'     => '',
			// D10 flipped excl_css from scalar → array so the step-rail
			// chip editor has a natural home. Legacy payloads that still
			// store a comma-string are coerced on read by sanitise().
			'excl_css'     => array(),
			'excl_texts'   => array(),
			'excl_tags'    => array(),
			'add_title'    => null,
			'add_excerpt'  => null,
			'text_before'  => '',
			'text_after'   => '',
			'ts'           => 0,
			'user_id'      => 0,
		);
	}

	/**
	 * Sanitise an incoming payload. Anything unrecognised is dropped
	 * rather than preserved — the override meta is not a bag for
	 * arbitrary admin data, and future schema fields add themselves
	 * here explicitly.
	 *
	 * @param array $raw
	 * @return array
	 */
	protected static function sanitise( $raw ) {
		$out = self::empty_payload();

		if ( isset( $raw['selector'] ) ) {
			$s = trim( (string) $raw['selector'] );
			// Same character guard save_selector uses — CSS-ish only.
			if ( $s !== '' && strlen( $s ) <= 512
				 && preg_match( '#^[A-Za-z0-9_\-\s\.\#\[\]\=\"\'\>\,\:\(\)\*\^\$\|\\\\]+$#', $s ) ) {
				$out['selector'] = $s;
			}
		}
		if ( isset( $raw['excl_css'] ) ) {
			// Post-D10 chip payload ships an array; legacy callers / old
			// stored data still send a comma-string. Normalise to an array
			// of trimmed, non-empty strings either way.
			if ( is_array( $raw['excl_css'] ) ) {
				$list = array_map( 'strval', $raw['excl_css'] );
			} else {
				$list = array_map( 'trim', explode( ',', (string) $raw['excl_css'] ) );
			}
			$list = array_values( array_filter( $list, 'strlen' ) );
			// Cap each selector at 512 chars (matches the JS validator)
			// so a runaway paste can't blow the meta row size limit.
			foreach ( $list as $i => $s ) {
				if ( strlen( $s ) > 512 ) { $list[ $i ] = substr( $s, 0, 512 ); }
			}
			$out['excl_css'] = $list;
		}
		if ( isset( $raw['excl_texts'] ) && is_array( $raw['excl_texts'] ) ) {
			$out['excl_texts'] = array_values( array_filter( array_map( 'strval', $raw['excl_texts'] ), 'strlen' ) );
		}
		if ( isset( $raw['excl_tags'] ) && is_array( $raw['excl_tags'] ) ) {
			// Tag names are HTML-ish: lowercase, alphanumeric only. Strip
			// optional surrounding angle-brackets (<form> → form) so both
			// the JS chip-input path and REST callers that pass raw tag
			// strings produce the same normalised result.
			$out['excl_tags'] = array_values( array_filter(
				array_map( function ( $t ) {
					$t = strtolower( trim( (string) $t ) );
					$t = ltrim( $t, '<' );
					$t = rtrim( $t, '>' );
					$t = trim( $t );
					return preg_match( '/^[a-z][a-z0-9]*$/', $t ) ? $t : '';
				}, $raw['excl_tags'] ),
				'strlen'
			) );
		}
		if ( array_key_exists( 'add_title', $raw ) ) {
			$out['add_title'] = is_null( $raw['add_title'] ) ? null : (bool) $raw['add_title'];
		}
		if ( array_key_exists( 'add_excerpt', $raw ) ) {
			$out['add_excerpt'] = is_null( $raw['add_excerpt'] ) ? null : (bool) $raw['add_excerpt'];
		}
		if ( isset( $raw['text_before'] ) ) {
			$out['text_before'] = (string) $raw['text_before'];
		}
		if ( isset( $raw['text_after'] ) ) {
			$out['text_after'] = (string) $raw['text_after'];
		}
		return $out;
	}
}
