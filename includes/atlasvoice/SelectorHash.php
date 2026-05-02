<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice SelectorHash tag (TTS-238 v5 §5.3 / D3).
 *
 * Tags every MP3 the Pro synthesis pipeline generates with a fingerprint
 * of the exact rule set that produced it. On a future visit, the
 * RegenGuard compares the post's current fingerprint against the tag;
 * if they differ we know settings have changed since generation and
 * decide whether to invalidate (ContentHash differs → regen) or just
 * retag (ContentHash matches → SKIP + overwrite tag).
 *
 * Fingerprint shape (plan §5.3): `sha1( json_encode( $fingerprint_data ) )`
 * where `$fingerprint_data` is:
 *   {
 *     rules:       resolved rule array for this post
 *                  (global + per-post-type + per-language + per-post
 *                  after the precedence walk),
 *     lang:        language code at synthesis time (empty on monolingual
 *                  sites, WPML/Polylang code otherwise),
 *     provider:    int player_id that synthesised this MP3, because
 *                  switching TTS providers bumps the fingerprint too,
 *   }
 *
 *   (D27.31: `auth_bucket` field was retired with AuthVariants.)
 *
 * Why sha1 and not md5? md5 is reserved for ContentHash — keeping the
 * two at different hash functions makes it obvious in logs / debugger
 * which one you're looking at, and avoids any risk of an accidental
 * comparison between the two (different algorithms can't collide).
 *
 * Storage:
 *   post meta `_atlasvoice_selector_hash` — string. Never array.
 *
 * Hook surface:
 *   - Writes via `atlasvoice_mp3_generated` action emitted by Pro after
 *     a successful synthesis (Pro plugin is responsible for raising
 *     this hook from init_gtts / init_gctts / init_chat_gpt /
 *     init_elevenlabs / etc. completion callbacks).
 *   - Writes via `atlasvoice_regen_skip` action emitted by RegenGuard
 *     when the ContentHash matches — we overwrite the old fingerprint
 *     with the current one so the MP3 is "adopted" into the new ruleset.
 *
 * Free tier: MP3 generation doesn't happen in Free, so
 * `atlasvoice_mp3_generated` never fires. This class is effectively
 * dormant on Free installs — the register() method is safe to call
 * regardless.
 */
class SelectorHash {

	/** Post meta key for the fingerprint tag. */
	const META_SELECTOR_HASH = '_atlasvoice_selector_hash';

	/**
	 * Register hook listeners. Idempotent — Bootstrap::register() has
	 * its own static guard.
	 */
	public static function register() {
		add_action( 'atlasvoice_mp3_generated', array( __CLASS__, 'on_mp3_generated' ), 10, 3 );
		add_action( 'atlasvoice_regen_skip',    array( __CLASS__, 'on_regen_skip' ),    10, 2 );
	}

	/**
	 * Callback for Pro's post-synthesis hook. Tags the post with the
	 * fingerprint that was actually used. Accepts either a pre-computed
	 * fingerprint string (preferred — Pro knows best what rules it
	 * resolved) or a raw fingerprint-data array which we'll hash here.
	 *
	 * @param int          $post_id
	 * @param int          $player_id  TTS provider id (1=browser, 2=gtts, ...).
	 * @param array|string $fingerprint Either the sha1 string or the
	 *                                  pre-hash array. Strings longer
	 *                                  than 64 chars are rejected as
	 *                                  a safety check — the hash is
	 *                                  always 40.
	 */
	public static function on_mp3_generated( $post_id, $player_id = 0, $fingerprint = '' ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) {
			return;
		}

		$hash = self::normalise_fingerprint( $fingerprint, $player_id );
		if ( $hash === '' ) {
			return;
		}

		self::tag( $post_id, $player_id, $hash );
	}

	/**
	 * Callback for RegenGuard's SKIP branch. Adopts the current
	 * fingerprint onto the existing MP3 so the next settings change
	 * that *does* differ won't trigger a spurious regen because the
	 * old tag was frozen at the previous fingerprint.
	 *
	 * Receives the ContentHash decision array which has its own
	 * fingerprint-input rules (no explicit fingerprint field yet — D4+
	 * will populate it once the rules table lands). For D3 we
	 * re-compute from the settings snapshot so the retag is meaningful
	 * even before D4 wires a proper fingerprint through the decision.
	 *
	 * @param int   $post_id
	 * @param array $decision ContentHash::short_circuit_or_dirty() output.
	 */
	public static function on_regen_skip( $post_id, $decision = array() ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) {
			return;
		}

		$fingerprint = self::build_fingerprint( $post_id, 0 );
		self::tag( $post_id, 0, $fingerprint );
	}

	/**
	 * Public setter — writes the tag atomically. Exposed so admin
	 * tooling (manual cache-invalidate, migration scripts) can retag
	 * without going through a hook.
	 *
	 * @param int    $post_id
	 * @param int    $player_id  Informational — not part of the tag
	 *                           itself when the fingerprint was
	 *                           pre-computed. Stored in a sidecar
	 *                           meta for later inspection.
	 * @param string $hash       sha1 fingerprint string.
	 * @return bool              True on write, false on invalid input.
	 */
	public static function tag( $post_id, $player_id, $hash ) {
		$post_id = (int) $post_id;
		$hash    = (string) $hash;
		if ( $post_id <= 0 || $hash === '' ) {
			return false;
		}
		// Defensive length cap — anything past sha1's 40 chars is a bug.
		if ( strlen( $hash ) > 64 ) {
			return false;
		}
		update_post_meta( $post_id, self::META_SELECTOR_HASH, $hash );
		if ( (int) $player_id > 0 ) {
			update_post_meta( $post_id, self::META_SELECTOR_HASH . '_player', (int) $player_id );
		}
		return true;
	}

	/**
	 * Read the stored tag. Returns empty string if never tagged.
	 *
	 * @param int $post_id
	 * @return string
	 */
	public static function get( $post_id ) {
		return (string) get_post_meta( (int) $post_id, self::META_SELECTOR_HASH, true );
	}

	/**
	 * Compute the canonical fingerprint for a post under the current
	 * settings + language + auth-variant state. Called by on_regen_skip
	 * and exposed so Pro's synthesis pipeline can pass the result
	 * through `atlasvoice_mp3_generated` without duplicating the
	 * fingerprint-input logic.
	 *
	 * @param int $post_id
	 * @param int $player_id
	 * @return string sha1 hex string (40 chars).
	 */
	public static function build_fingerprint( $post_id, $player_id = 0 ) {
		$post_id = (int) $post_id;
		// TTS-238 D27.31 — `auth_bucket` retired with AuthVariants. The
		// fingerprint no longer includes the logged-in/out variant key;
		// existing MP3 cache entries on installs that ever pinned a
		// variant will get a single fingerprint change, which is fine —
		// they just regenerate once on next request.
		$input = array(
			'rules'    => self::resolve_rules( $post_id ),
			'lang'     => self::current_language_code(),
			'provider' => (int) $player_id,
		);
		return sha1( wp_json_encode( $input ) );
	}

	/**
	 * Pull the resolved rule array for the fingerprint input. D3
	 * started at "global + per-post-type"; D7 adds the per-post
	 * override layer via RuleResolver::resolve(), which walks the
	 * full precedence stack so changing a per-post selector bumps
	 * the fingerprint the same way changing the global one does.
	 *
	 * @param int $post_id
	 * @return array
	 */
	protected static function resolve_rules( $post_id ) {
		$rules     = array();
		$post_type = (string) get_post_type( $post_id );

		// TTS-238 D27.26 — fingerprint inputs read the new collapsed
		// storage. RuleResolver gives us the resolved (post→type→global)
		// rule + a snapshot of the per-post override, both of which are
		// already pulling from `tta_settings_data` + `tts_pro_custom_css_selectors`
		// after D27.21. We also stamp the per-type override and global
		// flat keys directly so the hash bumps when an admin edits a
		// scope that doesn't currently win.
		if ( class_exists( '\\TTA\\AtlasVoice\\RuleResolver' ) ) {
			$resolved                       = RuleResolver::resolve( $post_id );
			$rules['selector_effective']    = isset( $resolved['selector'] ) ? (string) $resolved['selector'] : '';
			$rules['selector_effective_on'] = isset( $resolved['selector_source'] ) ? (string) $resolved['selector_source'] : 'none';
			if ( isset( $resolved['post_override'] ) && is_array( $resolved['post_override'] ) ) {
				$rules['post_override'] = $resolved['post_override'];
			}
		}

		$opt_raw = get_option( 'tta_settings_data', array() );
		$opt     = json_decode( wp_json_encode( $opt_raw ), true );
		if ( ! is_array( $opt ) ) { $opt = array(); }
		if ( isset( $opt['settings'] ) && is_array( $opt['settings'] ) ) {
			foreach ( $opt['settings'] as $k => $v ) {
				if ( ! array_key_exists( $k, $opt ) ) { $opt[ $k ] = $v; }
			}
		}
		$per_pt = isset( $opt['tta__settings_atlasvoice_per_type_overrides'] ) && is_array( $opt['tta__settings_atlasvoice_per_type_overrides'] )
			? $opt['tta__settings_atlasvoice_per_type_overrides']
			: array();

		$rules['selector_global']    = isset( $opt['tta__settings_css_selectors'] ) ? (string) $opt['tta__settings_css_selectors'] : '';
		$rules['selector_post_type'] = ( $post_type !== '' && isset( $per_pt[ $post_type ] ) && is_array( $per_pt[ $post_type ] ) )
			? $per_pt[ $post_type ]
			: array();
		// Per-language layers retired by D26 collapse — emit empty
		// arrays so callers expecting these keys don't blow up.
		$rules['selectors_per_language'] = array();
		$rules['selectors_per_pt_lang']  = array();

		// Settings-level excludes — same keys the JS engine keys off.
		if ( class_exists( '\\TTA\\TTA_Helper' ) ) {
			$all      = \TTA\TTA_Helper::tts_get_settings( '', $post_id );
			$settings = isset( $all['settings'] ) ? (array) $all['settings'] : array();
			$rules['excl_css']       = isset( $settings['tta__settings_exclude_content_by_css_selectors'] )
				? (string) $settings['tta__settings_exclude_content_by_css_selectors']
				: '';
			$rules['excl_texts']     = isset( $settings['tta__settings_exclude_texts'] )
				? self::normalise_list( $settings['tta__settings_exclude_texts'] )
				: array();
			$rules['excl_tags']      = isset( $settings['tta__settings_exclude_tags'] )
				? self::normalise_list( $settings['tta__settings_exclude_tags'] )
				: array();
			$rules['add_title']      = ! empty( $settings['tta__settings_add_post_title_to_read'] );
			$rules['add_excerpt']    = ! empty( $settings['tta__settings_add_post_excerpt_to_read'] );
			$rules['text_before']    = isset( $settings['tta__settings_text_before_content'] )
				? (string) $settings['tta__settings_text_before_content']
				: '';
			$rules['text_after']     = isset( $settings['tta__settings_text_after_content'] )
				? (string) $settings['tta__settings_text_after_content']
				: '';
		}

		return $rules;
	}

	/**
	 * Coerce a comma-string-or-array exclude list into a sorted array.
	 * Sorting guarantees the fingerprint is stable across list-order
	 * changes the admin might accidentally introduce by drag-reordering
	 * chips in the picker UI.
	 *
	 * @param mixed $val
	 * @return array
	 */
	protected static function normalise_list( $val ) {
		if ( is_array( $val ) ) {
			$list = array_map( 'strval', $val );
		} else {
			$list = array_filter( array_map( 'trim', explode( ',', (string) $val ) ), 'strlen' );
		}
		sort( $list );
		return array_values( $list );
	}

	/**
	 * Defer to LanguagePlugins when available, otherwise empty string.
	 *
	 * @return string
	 */
	protected static function current_language_code() {
		if ( class_exists( '\\TTA\\AtlasVoice\\LanguagePlugins' ) ) {
			return (string) LanguagePlugins::current_language_code();
		}
		return '';
	}

	/**
	 * Accept either a pre-hashed string or a raw array; return the
	 * canonical tag string. Arrays are hashed via the same
	 * `sha1(json_encode(...))` shape as build_fingerprint, minus the
	 * implicit settings-snapshot wrapper so callers can pass a bare
	 * payload when they want full control.
	 *
	 * @param array|string $fingerprint
	 * @param int          $player_id
	 * @return string
	 */
	protected static function normalise_fingerprint( $fingerprint, $player_id = 0 ) {
		if ( is_string( $fingerprint ) && $fingerprint !== '' ) {
			return $fingerprint;
		}
		if ( is_array( $fingerprint ) && ! empty( $fingerprint ) ) {
			return sha1( wp_json_encode( $fingerprint ) );
		}
		return '';
	}
}
