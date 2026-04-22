<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice rule snapshot ring buffer (TTS-238 v5 §5.6 / D6).
 *
 * Every time the rule set for a given scope changes — via the Step Rail
 * picker (D9), rule-chip editor (D10), per-post meta box (D7) or the
 * REST `/save-selector` endpoint — the incoming payload replaces what's
 * on disk, and the *old* payload lands here. Snapshots are the
 * one-click "undo" backbone for the whole AtlasVoice UI; the Rules
 * table exposes a `[History ▾]` dropdown per row that lists up to five
 * prior payloads, and one click swaps any of them back into production.
 *
 * Scope model (identical to the resolver walk in SelectorHash):
 *
 *   global                                    → key = "global"
 *   per_post_type[ post_type ]                → key = "pt:<post_type>"
 *   per_language[ lang ]                      → key = "lang:<lang>"
 *   per_post_type_per_language[ pt ][ lang ]  → key = "pt:<post_type>:lang:<lang>"
 *   per_post[ post_id ]                       → key = "post:<post_id>"
 *
 * Each scope carries its own 5-deep ring buffer so replacing the
 * global rules doesn't pollute a per-post-type scope's history.
 *
 * Storage:
 *   option `tta_atlasvoice_snapshots` = array(
 *     'pt:post'              => array( { ts, user_id, reason, rules, fingerprint }, ... up to 5 ),
 *     'pt:post:lang:fr'      => array( ... ),
 *     'post:174'             => array( ... ),
 *     'global'               => array( ... ),
 *   )
 *
 * Autoload is disabled because the payload can grow a few KB per scope
 * and we never read it on visitor page loads — only the Rules table
 * dashboard asks for it.
 *
 * Hook surface:
 *   - `atlasvoice_snapshot_taken` fires after each successful take(),
 *     so audit-log receivers can persist to an external SIEM.
 *   - `atlasvoice_snapshot_reverted` fires after revert() overwrites
 *     the live rule set, before cache buses — consumers can piggy-back
 *     CDN purges on this the same way they do for Go Live.
 *
 * Free tier: the UI affordance is Pro-only, but the backend accepts
 * snapshots from any scope. That way Free can ship the `take()` path
 * silently (so Pro can show meaningful history when a user upgrades
 * mid-workflow) without surfacing the `[History ▾]` dropdown.
 */
class Snapshots {

	/** Option key for the ring buffer store. */
	const OPTION_KEY = 'tta_atlasvoice_snapshots';

	/** Ring-buffer depth per scope — plan §5.6. */
	const RING_DEPTH = 5;

	/**
	 * Register REST routes and any cross-cutting hooks. Idempotent via
	 * Bootstrap::register()'s static guard.
	 *
	 * We auto-snapshot on `atlasvoice_rules_changed` so producers (the
	 * picker, the editor, the meta box) don't each have to remember to
	 * call take() explicitly — just fire the action and the history
	 * trail updates itself.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'atlasvoice_rules_changed', array( __CLASS__, 'on_rules_changed' ), 10, 3 );
	}

	/**
	 * Canonical scope-key builder. Keeping this in one place means the
	 * ring-buffer keys stay stable across the backend and the REST layer
	 * even if we later add new scope dimensions (e.g. per-role).
	 *
	 * @param array $scope {
	 *   @type string $type      One of: global | post_type | language | post_type_language | post.
	 *   @type string $post_type Post type slug (post_type + post_type_language).
	 *   @type string $language  Language code (language + post_type_language).
	 *   @type int    $post_id   Post id (post).
	 * }
	 * @return string
	 */
	public static function scope_key( $scope ) {
		if ( ! is_array( $scope ) ) {
			return 'global';
		}
		$type = isset( $scope['type'] ) ? (string) $scope['type'] : 'global';
		switch ( $type ) {
			case 'post':
				$pid = isset( $scope['post_id'] ) ? (int) $scope['post_id'] : 0;
				return $pid > 0 ? 'post:' . $pid : 'global';
			case 'post_type_language':
				$pt   = isset( $scope['post_type'] ) ? sanitize_key( (string) $scope['post_type'] ) : '';
				$lang = isset( $scope['language'] )  ? sanitize_key( (string) $scope['language'] )  : '';
				if ( $pt === '' || $lang === '' ) { return 'global'; }
				return 'pt:' . $pt . ':lang:' . $lang;
			case 'language':
				$lang = isset( $scope['language'] ) ? sanitize_key( (string) $scope['language'] ) : '';
				return $lang !== '' ? 'lang:' . $lang : 'global';
			case 'post_type':
				$pt = isset( $scope['post_type'] ) ? sanitize_key( (string) $scope['post_type'] ) : '';
				return $pt !== '' ? 'pt:' . $pt : 'global';
			case 'global':
			default:
				return 'global';
		}
	}

	/**
	 * Append a snapshot to the given scope's ring. Any entry beyond
	 * RING_DEPTH is shifted off the front so the total for each scope
	 * stays bounded regardless of how chatty the editor is.
	 *
	 * `rules` is the payload that was *previously* live for this scope.
	 * Callers should grab the old payload before writing their new one
	 * so the ring stores "what it used to be", matching the mental model
	 * of an undo stack. Snapshots can also be taken post-write if the
	 * caller wants a forward-compatible audit trail — it's the same
	 * shape either way.
	 *
	 * @param array $scope See scope_key().
	 * @param array $rules The rule payload to snapshot.
	 * @param array $meta {
	 *   @type string $reason      Short label (e.g. 'picker-save', 'heal', 'revert').
	 *   @type int    $user_id     Defaults to get_current_user_id().
	 *   @type string $fingerprint Optional selector-hash of the snapshot.
	 * }
	 * @return array The full ring array for this scope after the write.
	 */
	public static function take( $scope, $rules, $meta = array() ) {
		$key = self::scope_key( $scope );

		$all = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $all ) ) { $all = array(); }
		if ( ! isset( $all[ $key ] ) || ! is_array( $all[ $key ] ) ) {
			$all[ $key ] = array();
		}

		$entry = array(
			'ts'          => time(),
			'user_id'     => isset( $meta['user_id'] ) ? (int) $meta['user_id'] : get_current_user_id(),
			'reason'      => isset( $meta['reason'] ) ? sanitize_key( (string) $meta['reason'] ) : 'manual',
			'fingerprint' => isset( $meta['fingerprint'] ) ? (string) $meta['fingerprint'] : '',
			'rules'       => is_array( $rules ) ? $rules : array(),
		);

		// Dedup — if the top-of-stack entry is byte-identical to what
		// we're about to push, don't — it's almost certainly a
		// double-save from a React effect re-running. Compare on the
		// rule payload only; ts/user_id always differ.
		if ( ! empty( $all[ $key ] ) ) {
			$top = $all[ $key ][ count( $all[ $key ] ) - 1 ];
			if ( isset( $top['rules'] ) && self::rules_equal( $top['rules'], $entry['rules'] ) ) {
				return $all[ $key ];
			}
		}

		$all[ $key ][] = $entry;
		if ( count( $all[ $key ] ) > self::RING_DEPTH ) {
			$all[ $key ] = array_slice( $all[ $key ], -self::RING_DEPTH );
		}

		update_option( self::OPTION_KEY, $all, false );

		/**
		 * Fires after a snapshot is appended to the ring. Useful for
		 * external audit logs and for invalidating a dashboard-side
		 * cached history dropdown.
		 *
		 * @param string $key   Scope key.
		 * @param array  $entry The freshly appended snapshot.
		 */
		do_action( 'atlasvoice_snapshot_taken', $key, $entry );

		return $all[ $key ];
	}

	/**
	 * List the ring for a scope in reverse-chrono order (newest first),
	 * which is the order the `[History ▾]` dropdown displays it.
	 *
	 * Each entry carries its ring index so the dashboard can round-trip
	 * a revert call without hand-rolling a lookup — the index is
	 * counted from oldest so rev-chrono display is just an iteration
	 * direction, not a different id space.
	 *
	 * @param array $scope See scope_key().
	 * @return array
	 */
	public static function listing( $scope ) {
		$key = self::scope_key( $scope );
		$all = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $all ) || ! isset( $all[ $key ] ) || ! is_array( $all[ $key ] ) ) {
			return array();
		}

		$out = array();
		$n   = count( $all[ $key ] );
		for ( $i = $n - 1; $i >= 0; $i-- ) {
			$row = $all[ $key ][ $i ];
			if ( ! is_array( $row ) ) { continue; }
			$out[] = array(
				'index'       => $i,
				'ts'          => isset( $row['ts'] ) ? (int) $row['ts'] : 0,
				'user_id'     => isset( $row['user_id'] ) ? (int) $row['user_id'] : 0,
				'reason'      => isset( $row['reason'] ) ? (string) $row['reason'] : 'manual',
				'fingerprint' => isset( $row['fingerprint'] ) ? (string) $row['fingerprint'] : '',
				'rules'       => isset( $row['rules'] ) && is_array( $row['rules'] ) ? $row['rules'] : array(),
			);
		}
		return $out;
	}

	/**
	 * Restore a specific snapshot. Does NOT bus the live rule store —
	 * that's the responsibility of the scope-specific writer (selectors
	 * option, per-post meta, etc.) because each scope has its own
	 * storage location. This method returns the rule payload and fires
	 * a `atlasvoice_snapshot_reverted` action carrying everything the
	 * writer needs.
	 *
	 * Before returning we take a fresh snapshot of whatever was live,
	 * so the revert itself becomes undoable — classic redo semantics.
	 * Without this step a user can't hop back to the state they had
	 * just a moment ago.
	 *
	 * @param array $scope See scope_key().
	 * @param int   $index Ring-array index (0 = oldest, newest = count-1).
	 * @param array $current_rules Optional — the currently-live payload,
	 *                             snapshot first so revert is undoable.
	 * @return array|\WP_Error The restored rule payload, or WP_Error.
	 */
	public static function revert( $scope, $index, $current_rules = null ) {
		$key = self::scope_key( $scope );
		$all = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $all ) || ! isset( $all[ $key ] ) || ! is_array( $all[ $key ] ) ) {
			return new \WP_Error(
				'no_snapshots',
				__( 'No snapshots available for this scope.', 'text-to-audio' ),
				array( 'status' => 404 )
			);
		}
		$index = (int) $index;
		if ( $index < 0 || $index >= count( $all[ $key ] ) ) {
			return new \WP_Error(
				'bad_snapshot_index',
				__( 'Snapshot index out of range.', 'text-to-audio' ),
				array( 'status' => 404 )
			);
		}

		$entry = $all[ $key ][ $index ];
		$payload = isset( $entry['rules'] ) && is_array( $entry['rules'] ) ? $entry['rules'] : array();

		// Capture the pre-revert state before handing the payload back.
		// Silent if $current_rules wasn't provided — some callers may
		// not have a snapshot-worthy representation to pass.
		if ( is_array( $current_rules ) ) {
			self::take( $scope, $current_rules, array( 'reason' => 'pre-revert' ) );
		}

		/**
		 * Fires when a snapshot is being restored. Listeners should use
		 * this to invalidate their own caches — the rule payload is
		 * about to be re-applied by the scope's writer.
		 *
		 * @param string $scope_key
		 * @param int    $index
		 * @param array  $rules     Payload being restored.
		 */
		do_action( 'atlasvoice_snapshot_reverted', $key, $index, $payload );

		return $payload;
	}

	/**
	 * Listener for the generic `atlasvoice_rules_changed` action. Every
	 * rule writer in the subsystem fires this action with the previous
	 * rule payload attached so snapshots happen transparently. Writers
	 * that want richer metadata can call Snapshots::take() directly —
	 * this listener is the fallback for "something changed, remember
	 * where we were".
	 *
	 * @param array $scope       See scope_key().
	 * @param array $old_rules   Payload that was live before the change.
	 * @param array $meta        Optional reason/fingerprint/user overrides.
	 * @return void
	 */
	public static function on_rules_changed( $scope, $old_rules = array(), $meta = array() ) {
		if ( ! is_array( $old_rules ) || empty( $old_rules ) ) {
			return;
		}
		self::take( $scope, $old_rules, is_array( $meta ) ? $meta : array() );
	}

	/**
	 * Cheap structural equality for rule payloads. json-encode is the
	 * smallest-code way to compare nested arrays stably; the cost is
	 * irrelevant here because take() runs maybe once per admin save,
	 * not per visitor hit.
	 *
	 * @param array $a
	 * @param array $b
	 * @return bool
	 */
	protected static function rules_equal( $a, $b ) {
		if ( ! is_array( $a ) || ! is_array( $b ) ) {
			return $a === $b;
		}
		return wp_json_encode( $a ) === wp_json_encode( $b );
	}
}
