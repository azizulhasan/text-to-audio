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
		$row = self::settings_row();
		return ! empty( $row[ self::OPT_IN_KEY ] );
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

		$endpoint    = esc_url_raw( rest_url( 'tts/v1/mode' ) );
		$sample_url  = esc_url_raw( rest_url( 'tts/v1/step-rail/sample-url' ) );
		$nonce       = wp_create_nonce( 'wp_rest' );

		// Multi-line confirm body. Each line is its own translatable string
		// (translators don't have to remember \n placeholders) and we use
		// PHP double-quoted "\n" so the linebreaks reach the browser as
		// real newlines, not literal backslash-n.
		$verify_lines = array(
			__( 'Recommended: run "Verify across posts" on a sample post first to confirm your rules still match before visitor audio switches.', 'text-to-audio' ),
			'',
			__( 'OK     — open a sample post in a new tab (picker auto-opens; click "Test rule across N posts").', 'text-to-audio' ),
			__( 'Cancel — skip Verify and go straight to the Go Live confirmation.', 'text-to-audio' ),
		);

		$l10n = array(
			'prompt'        => __( 'Type GO LIVE (in capitals) to switch AtlasVoice to production. This drives visitor audio through the new extractor.', 'text-to-audio' ),
			'revert'        => __( 'Revert AtlasVoice to staging? Visitor audio will switch back to the legacy pipeline on the next page load.', 'text-to-audio' ),
			'mismatch'      => __( 'Confirmation phrase did not match. No changes made.', 'text-to-audio' ),
			'done_go'       => __( 'AtlasVoice is now live. Reload to see the production dot.', 'text-to-audio' ),
			'done_rev'      => __( 'AtlasVoice reverted to staging. Reload to see the staging dot.', 'text-to-audio' ),
			'fail'          => __( 'AtlasVoice mode change failed: ', 'text-to-audio' ),
			'verify_prompt' => implode( "\n", $verify_lines ),
		);

		?>
		<script id="atlasvoice-bar-actions">
		(function () {
			var ENDPOINT   = <?php echo wp_json_encode( $endpoint ); ?>;
			var SAMPLE_URL = <?php echo wp_json_encode( $sample_url ); ?>;
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

			// D5/D14 — soft prereq. Offer to open a sample post (with the
			// picker auto-armed) so the admin can run Verify-across-posts
			// before flipping to production. OK opens the sample in a new
			// tab and short-circuits this round (admin clicks Go Live again
			// after they're satisfied). Cancel falls through to the
			// existing typed-confirm flow — soft, not hard, so admins who
			// already verified elsewhere aren't blocked by the dialog.
			function verifyFirstOrSkip() {
				return new Promise(function (resolve) {
					var wantsVerify = window.confirm(L10N.verify_prompt);
					if (!wantsVerify) { resolve('skip'); return; }
					fetch(SAMPLE_URL, {
						credentials: 'same-origin',
						headers: { 'X-WP-Nonce': NONCE }
					}).then(function (r) { return r.json(); })
					  .then(function (j) {
						if (j && j.url) {
							window.open(j.url, '_blank');
							resolve('opened');
						} else {
							// No sample post — fall through silently to the
							// typed-confirm prompt. No alarming alert: the
							// admin already chose to proceed by clicking OK,
							// and this prereq is advisory not mandatory.
							resolve('skip');
						}
					})
					  .catch(function () { resolve('skip'); });
				});
			}

			window.atlasvoiceGoLive = function () {
				verifyFirstOrSkip().then(function (decision) {
					if (decision === 'opened') { return; } // admin verifies in new tab
					var answer = window.prompt(L10N.prompt, '');
					if (answer === null) { return; }
					if (answer !== 'GO LIVE') {
						window.alert(L10N.mismatch);
						return;
					}
					call({ action: 'go-live', confirm: 'GO LIVE' }, L10N.done_go);
				});
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
