<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice Mode + admin-bar status indicator (TTS-238 v5 §5.4 / D4).
 *
 * The AtlasVoice pipeline runs in one of two modes:
 *
 *   - staging    — new extractor writes rules and self-heals in the
 *                  background, but visitor output stays on the legacy
 *                  pipeline. Safe to toggle at any time. This is the
 *                  default for fresh installs and all Free tiers.
 *   - production — extracted text + fingerprint drive MP3 invalidation
 *                  and the player reads from the new rule-resolved body.
 *                  Entering production is gated by the D5 Go Live
 *                  dialog to prevent accidental visitor-side regressions.
 *
 * This class is the canonical source of truth for which mode the site
 * is in. Other features (RegenGuard, SelectorHash, upcoming D5's
 * Snapshots) read through `Mode::get()` / `Mode::is_production()` rather
 * than re-deriving from the raw option so a future schema change stays
 * local to this file.
 *
 * The admin-bar node renders three states for site admins:
 *
 *   - grey   "AtlasVoice: off"        — Layer 1 opt-in disabled
 *   - yellow "AtlasVoice: staging"    — opted in, staging mode
 *   - green  "AtlasVoice: production" — opted in, production mode
 *
 * Clicking the node navigates to the plugin settings page where the
 * admin can flip the opt-in or trigger the Go Live dialog (D5).
 *
 * Settings storage (same row as RegenGuard / ContentHash so the three
 * read a single option cache):
 *   - `tta__settings_use_atlasvoice_extractor` — Layer 1 opt-in (bool).
 *   - `tta__settings_atlasvoice_mode`          — 'staging'|'production'.
 *
 * Both keys live inside `tta_settings_data` (flat), surfaced through
 * `TTA_Helper::tts_get_settings('')['settings']` (nested wrapper).
 *
 * Free tier: the opt-in is present in the Free UI but mode is locked
 * to staging — the "Go Live" button is a Pro-only affordance and the
 * dot never turns green on Free installs.
 */
class Mode {

	/** Settings row key — Layer 1 opt-in flag. */
	const OPT_IN_KEY = 'tta__settings_use_atlasvoice_extractor';

	/** Settings row key — Layer 2 mode flag. */
	const MODE_KEY = 'tta__settings_atlasvoice_mode';

	/** Mode constants — string values match what the Go Live dialog writes. */
	const MODE_STAGING    = 'staging';
	const MODE_PRODUCTION = 'production';

	/** Admin-bar node id. Namespaced to avoid colliding with legacy nodes. */
	const BAR_NODE_ID = 'atlasvoice-mode';

	/**
	 * Register admin-bar + inline style hooks. Idempotent — Bootstrap
	 * guards repeat calls.
	 */
	public static function register() {
		add_action( 'admin_bar_menu',   array( __CLASS__, 'render_bar_node' ), 80 );
		add_action( 'wp_head',          array( __CLASS__, 'render_inline_style' ), 8 );
		add_action( 'admin_head',       array( __CLASS__, 'render_inline_style' ), 8 );
		add_action( 'wp_footer',        array( __CLASS__, 'render_inline_script' ), 99 );
		add_action( 'admin_footer',     array( __CLASS__, 'render_inline_script' ), 99 );
	}

	/**
	 * Canonical opt-in reader. Returns true iff Layer 1 is enabled.
	 *
	 * @return bool
	 */
	public static function is_opted_in() {
		// D26 — the picker now writes to the legacy keys (Free + Pro share
		// the same storage), so we no longer require an admin opt-in for
		// the AtlasVoice subsystem to consider itself active. Mode is
		// always considered opted-in; what visitors actually hear is
		// gated by Mode::get() (staging vs production).
		return true;
	}

	/**
	 * Canonical mode reader. Defaults to `staging` so fresh installs
	 * and Free tiers never accidentally expose the new pipeline to
	 * visitors until the admin explicitly Goes Live.
	 *
	 * @return string MODE_STAGING | MODE_PRODUCTION
	 */
	public static function get() {
		$row  = self::settings_row();
		$mode = isset( $row[ self::MODE_KEY ] ) ? (string) $row[ self::MODE_KEY ] : self::MODE_STAGING;
		return ( $mode === self::MODE_PRODUCTION ) ? self::MODE_PRODUCTION : self::MODE_STAGING;
	}

	/**
	 * Mode writer. Called from D5's Go Live REST handler and from
	 * admin tooling that needs to revert to staging after a live
	 * incident. Writes through the same `tta_settings_data` option
	 * the rest of the plugin uses, and busts the helper's cache so
	 * the next `settings_row()` read picks up the change.
	 *
	 * @param string $mode
	 * @return bool True on write, false on invalid input.
	 */
	public static function set( $mode ) {
		$mode = ( $mode === self::MODE_PRODUCTION ) ? self::MODE_PRODUCTION : self::MODE_STAGING;
		$opt  = get_option( 'tta_settings_data', array() );
		// TTS-247 — the dashboard saves tta_settings_data via json_decode(),
		// so it is frequently a stdClass, not an array. Casting an object to
		// array() here would WIPE every other setting and write only the mode
		// key. Normalise object -> array (deep) so all existing settings are
		// preserved on Go Live / revert.
		if ( is_object( $opt ) ) {
			$opt = json_decode( wp_json_encode( $opt ), true );
		}
		if ( ! is_array( $opt ) ) {
			$opt = array();
		}
		$opt[ self::MODE_KEY ] = $mode;
		update_option( 'tta_settings_data', $opt );
		self::bust_cache();

		/**
		 * Fires after the AtlasVoice mode changes. Consumers can use this
		 * to flush MP3 CDN caches, broadcast to multisite, or log the
		 * promotion for audit trails.
		 *
		 * @param string $mode     New mode.
		 * @param string $old_mode Previous mode (computed by refetching
		 *                        the settings row before this write —
		 *                        read from the inner closure below).
		 */
		do_action( 'atlasvoice_mode_changed', $mode );
		return true;
	}

	/**
	 * Convenience — true iff the pipeline should drive visitor output.
	 * RegenGuard and future visitor-side integrations key off this
	 * rather than reading the string directly.
	 *
	 * @return bool
	 */
	public static function is_production() {
		return self::is_opted_in() && self::get() === self::MODE_PRODUCTION;
	}

	/**
	 * Three-state status label used by the admin bar and by REST
	 * responses that need to surface mode to the React dashboard.
	 *
	 * @return array { state: 'off'|'staging'|'production', color: hex, label: string }
	 */
	public static function status() {
		if ( ! self::is_opted_in() ) {
			return array(
				'state' => 'off',
				'color' => '#8c8f94',
				'label' => __( 'AtlasVoice: off', 'text-to-audio' ),
			);
		}
		if ( self::get() === self::MODE_PRODUCTION ) {
			return array(
				'state' => 'production',
				'color' => '#00a32a',
				'label' => __( 'AtlasVoice: production', 'text-to-audio' ),
			);
		}
		return array(
			'state' => 'staging',
			'color' => '#dba617',
			'label' => __( 'AtlasVoice: staging', 'text-to-audio' ),
		);
	}

	/**
	 * Render the admin-bar status node. Only visible to users who can
	 * manage plugin options — keeping it off the toolbar for
	 * subscribers / editors on multi-role sites.
	 *
	 * @param \WP_Admin_Bar $bar
	 * @return void
	 */
	public static function render_bar_node( $bar ) {
		if ( ! ( $bar instanceof \WP_Admin_Bar ) ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		// Hide the node entirely when the whole subsystem is opted out —
		// no clutter for admins who've never touched AtlasVoice.
		if ( ! self::is_opted_in() && ! apply_filters( 'atlasvoice_show_bar_when_off', false ) ) {
			return;
		}

		// TTS-255 — the production/staging indicator is hidden by default
		// (setting tta__settings_show_mode_bar, filter
		// tts_show_atlasvoice_mode_bar). Exception: always show it while the
		// front-end Step Rail picker is open, so the admin can see the mode
		// they would be going live from.
		$show_mode_bar = class_exists( '\\TTA\\TTA_Helper' ) && \TTA\TTA_Helper::show_mode_bar();
		$steprail_open = class_exists( '\\TTA\\AtlasVoice\\StepRail' ) && \TTA\AtlasVoice\StepRail::is_front_active();
		if ( ! $show_mode_bar && ! $steprail_open ) {
			return;
		}

		$status = self::status();
		$title  = sprintf(
			'<span class="atlasvoice-bar-dot" style="background:%s"></span><span class="atlasvoice-bar-label">%s</span>',
			esc_attr( $status['color'] ),
			esc_html( $status['label'] )
		);

		$bar->add_node( array(
			'id'    => self::BAR_NODE_ID,
			'title' => $title,
			'href'  => admin_url( 'admin.php?page=text-to-audio' ),
			'meta'  => array(
				'title' => $status['label'],
				'class' => 'atlasvoice-bar-node atlasvoice-bar-state-' . $status['state'],
			),
		) );

		// D5 quick-actions under the dot. The React dashboard at
		// `admin.php?page=text-to-audio` hosts the full-fat Go Live
		// dialog with typed-confirmation UI, rule-diff preview and
		// live Verify run; these submenu entries are the emergency
		// short-paths an admin can fire from anywhere on the site
		// when they don't have time to navigate there first.
		if ( $status['state'] === 'staging' ) {
			$bar->add_node( array(
				'parent' => self::BAR_NODE_ID,
				'id'     => self::BAR_NODE_ID . '-go-live',
				'title'  => esc_html__( 'Go Live…', 'text-to-audio' ),
				'href'   => '#atlasvoice-go-live',
				'meta'   => array(
					'onclick' => 'return window.atlasvoiceGoLive && window.atlasvoiceGoLive();',
					'title'   => esc_attr__( 'Switch AtlasVoice to production (requires typed confirmation).', 'text-to-audio' ),
				),
			) );
		}

		if ( $status['state'] === 'production' ) {
			$bar->add_node( array(
				'parent' => self::BAR_NODE_ID,
				'id'     => self::BAR_NODE_ID . '-revert',
				'title'  => esc_html__( 'Revert to staging', 'text-to-audio' ),
				'href'   => '#atlasvoice-revert',
				'meta'   => array(
					'onclick' => 'return window.atlasvoiceRevert && window.atlasvoiceRevert();',
					'title'   => esc_attr__( 'Drop AtlasVoice back to staging and let the legacy pipeline serve visitors.', 'text-to-audio' ),
				),
			) );
		}

		// Settings shortcut — identical on every state so admins always
		// have a one-click route to the full dashboard.
		$bar->add_node( array(
			'parent' => self::BAR_NODE_ID,
			'id'     => self::BAR_NODE_ID . '-settings',
			'title'  => esc_html__( 'Open AtlasVoice settings', 'text-to-audio' ),
			'href'   => admin_url( 'admin.php?page=text-to-audio' ),
		) );
	}

	/**
	 * Inline CSS for the bar dot. Scoped to `#wpadminbar` so it never
	 * leaks into the dashboard. Tiny enough to inline — avoiding a
	 * separate stylesheet keeps the critical-path small and means
	 * this module doesn't need an enqueue dance.
	 *
	 * @return void
	 */
	public static function render_inline_style() {
		if ( ! is_admin_bar_showing() ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		echo '<style id="atlasvoice-bar-dot-style">'
			. '#wpadminbar .atlasvoice-bar-node .atlasvoice-bar-dot{'
			. 'display:inline-block;width:8px;height:8px;border-radius:50%;'
			. 'margin:0 6px 0 2px;vertical-align:middle;'
			. 'box-shadow:0 0 0 1px rgba(255,255,255,.25) inset;'
			. '}'
			. '#wpadminbar .atlasvoice-bar-node .atlasvoice-bar-label{'
			. 'vertical-align:middle;'
			. '}'
			. '</style>';
	}

	/**
	 * Emit the Go Live / revert client code inline. Attached to both
	 * front-end and admin footers so the toolbar submenu works on any
	 * page the admin is viewing.
	 *
	 * Uses the core REST nonce + wp-json base so we don't need to
	 * enqueue a full script module — the two actions are a handful of
	 * bytes and the prompt()/confirm() primitives keep the UI layer
	 * zero-dep. The React dashboard can replace this with a proper
	 * modal later; the REST endpoint is already the canonical gate,
	 * so we don't lose safety by using prompt() here.
	 *
	 * @return void
	 */
	public static function render_inline_script() {
		if ( ! is_admin_bar_showing() ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( ! self::is_opted_in() ) {
			return;
		}

		$endpoint    = esc_url_raw( rest_url( 'tta/v1/mode' ) );
		$nonce       = wp_create_nonce( 'wp_rest' );

		$l10n = array(
			'prompt'        => __( 'Type GO LIVE (in capitals) to switch AtlasVoice to production. This drives visitor audio through the new extractor.', 'text-to-audio' ),
			'revert'        => __( 'Revert AtlasVoice to staging? Visitor audio will switch back to the legacy pipeline on the next page load.', 'text-to-audio' ),
			'mismatch'      => __( 'Confirmation phrase did not match. No changes made.', 'text-to-audio' ),
			'done_go'       => __( 'AtlasVoice is now live. This page will reload.', 'text-to-audio' ),
			'done_rev'      => __( 'AtlasVoice reverted to staging. This page will reload.', 'text-to-audio' ),
			'fail'          => __( 'AtlasVoice mode change failed: ', 'text-to-audio' ),
		);

		?>
		<script id="atlasvoice-bar-actions">
		(function () {
			var ENDPOINT   = <?php echo wp_json_encode( $endpoint ); ?>;
			var NONCE      = <?php echo wp_json_encode( $nonce ); ?>;
			var L10N       = <?php echo wp_json_encode( $l10n ); ?>;

			function call(payload, successMsg) {
				return fetch(ENDPOINT, {
					method: 'POST',
					credentials: 'same-origin',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': NONCE
					},
					body: JSON.stringify(payload)
				}).then(function (r) {
					return r.json().then(function (body) {
						return { ok: r.ok, body: body };
					});
				}).then(function (res) {
					if (res.ok && res.body && res.body.status) {
						window.alert(successMsg);
						window.location.reload();
						return true;
					}
					var msg = (res.body && (res.body.message || res.body.code)) || 'unknown error';
					window.alert(L10N.fail + msg);
					return false;
				}).catch(function (err) {
					window.alert(L10N.fail + (err && err.message ? err.message : err));
					return false;
				});
			}

			// D5 — typed-confirm Go Live. Prompt for the phrase, POST to the
			// REST gate, then auto-reload on success so the admin doesn't have
			// to refresh manually to see the production state. The REST
			// endpoint re-validates the "GO LIVE" phrase server-side, so the
			// client-side check here is just for a friendly mismatch message.
			window.atlasvoiceGoLive = function () {
				var answer = window.prompt(L10N.prompt, '');
				if (answer === null) { return false; }
				if (answer !== 'GO LIVE') {
					window.alert(L10N.mismatch);
					return false;
				}
				call({ action: 'go-live', confirm: 'GO LIVE' }, L10N.done_go);
				return false;
			};

			window.atlasvoiceRevert = function () {
				if (!window.confirm(L10N.revert)) { return false; }
				call({ action: 'revert' }, L10N.done_rev);
				return false;
			};
		})();
		</script>
		<?php
	}

	/**
	 * Shared settings reader. Mirrors RegenGuard::settings_row() but
	 * lives here because Mode is the canonical accessor for the
	 * opt-in + mode keys. RegenGuard keeps its own copy so the two
	 * classes stay independently testable — both ultimately hit the
	 * same WP option cache so there's no cost to the duplication.
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
	 * Invalidate TTA_Cache after a settings write so the very next
	 * Mode::get() call observes the new value without waiting for the
	 * transient to naturally expire. Silent no-op when the cache
	 * class isn't available (e.g. during uninstall).
	 *
	 * @return void
	 */
	protected static function bust_cache() {
		if ( class_exists( '\\TTA\\TTA_Cache' ) ) {
			$key = \TTA\TTA_Cache::get_key( 'tts_get_settings' );
			\TTA\TTA_Cache::delete( $key );
		}
	}
}
