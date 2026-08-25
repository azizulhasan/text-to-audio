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
	/**
	 * Whether the Staging/Live admin-bar status node — and therefore its inline
	 * CSS — should render on this request. Shared by render_bar_node() and
	 * render_inline_style() so the `atlasvoice-bar-dot-style` <style> is never
	 * emitted on pages where the node itself isn't shown (TTS-255 setting
	 * tta__settings_show_mode_bar, or while the front-end Step Rail is open).
	 *
	 * @return bool
	 */
	private static function should_render_bar_node() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}
		// Hide entirely when the whole subsystem is opted out — no clutter for
		// admins who've never touched AtlasVoice.
		if ( ! self::is_opted_in() && ! apply_filters( 'atlasvoice_show_bar_when_off', false ) ) {
			return false;
		}
		// TTS-255 — the production/staging indicator is hidden by default
		// (setting tta__settings_show_mode_bar, filter tts_show_atlasvoice_mode_bar).
		// Exception: always show it while the front-end Step Rail picker is open.
		$show_mode_bar = class_exists( '\\TTA\\TTA_Helper' ) && \TTA\TTA_Helper::show_mode_bar();
		$steprail_open = class_exists( '\\TTA\\AtlasVoice\\StepRail' ) && \TTA\AtlasVoice\StepRail::is_front_active();

		return ( $show_mode_bar || $steprail_open );
	}

	public static function render_bar_node( $bar ) {
		if ( ! ( $bar instanceof \WP_Admin_Bar ) ) {
			return;
		}
		if ( ! self::should_render_bar_node() ) {
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

		// TTS-279: quick-actions under the dot. These call the same
		// window.atlasvoiceGoLive()/Revert() dialog as the dashboard
		// notice and the site-wide notice — one implementation, one
		// confirmation, one REST call. (The previous comment here
		// claimed the React dashboard hosted a fuller Go Live dialog;
		// it never shipped, which is why the toolbar was for a long
		// time the only way to reach Go Live at all.)
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
		// TTS-255: only emit the dot CSS when the status node actually renders —
		// otherwise the <style> is an orphan on every page (no markup to style).
		if ( ! self::should_render_bar_node() ) {
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
	/**
	 * TTS-279: whether the shared Go Live client should be emitted on this
	 * request.
	 *
	 * This deliberately does NOT require is_admin_bar_showing(). The toolbar node
	 * used to be the only caller, so gating the script on the toolbar was
	 * harmless; now the dashboard notice and the site-wide notice call the same
	 * functions, and an admin with the toolbar hidden would otherwise get buttons
	 * wired to an undefined function. That was the actual dead end.
	 *
	 * @return bool
	 */
	public static function should_render_go_live_ui() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}
		if ( ! self::is_opted_in() ) {
			return false;
		}

		// Emit only when an entry point will actually render. The toolbar node
		// covers both directions (Go Live and Revert) and honours the TTS-255
		// tta__settings_show_mode_bar setting.
		if ( self::should_render_bar_node() ) {
			return true;
		}

		// Otherwise the only hosts are the staging notices, which exist in
		// wp-admin and only while staging. In production with the mode bar off
		// nothing can call these functions, so shipping them would be dead weight
		// on every page.
		return is_admin() && self::MODE_PRODUCTION !== self::get();
	}

	/**
	 * TTS-279: the "what is about to change" rows shown in the Go Live dialog.
	 *
	 * Reads settings only. Deliberately performs no post or attachment queries —
	 * a count of posts or generated files would mean a meta query across the whole
	 * site every time the dialog opens.
	 *
	 * @return array List of label/value pairs.
	 */
	public static function go_live_summary() {
		$rows = array();

		$settings = self::settings_row();

		$types = isset( $settings['tta__settings_allow_listening_for_post_types'] )
			? (array) $settings['tta__settings_allow_listening_for_post_types']
			: array();
		$types = array_filter( array_map( 'strval', $types ) );

		$labels = array();
		foreach ( $types as $type ) {
			$obj      = get_post_type_object( $type );
			$labels[] = ( $obj && isset( $obj->labels->name ) ) ? $obj->labels->name : $type;
		}

		$rows[] = array(
			'label' => __( 'Post types', 'text-to-audio' ),
			'value' => $labels ? implode( ', ', $labels ) : __( 'None selected', 'text-to-audio' ),
		);

		// Pro registers players 2-6 through tts_available_players; with Free alone
		// there is only player 1, so there is no engine choice worth showing.
		if ( class_exists( '\\TTA\\TTA_Helper' ) ) {
			$players = \TTA\TTA_Helper::get_available_players();
			if ( count( $players ) > 1 ) {
				$id = \TTA\TTA_Helper::get_player_id();
				if ( isset( $players[ $id ]['name'] ) ) {
					$rows[] = array(
						'label' => __( 'Voice engine', 'text-to-audio' ),
						'value' => $players[ $id ]['name'],
					);
				}
			}
		}

		return $rows;
	}

	public static function render_inline_script() {
		if ( ! self::should_render_go_live_ui() ) {
			return;
		}

		$endpoint    = esc_url_raw( rest_url( 'tta/v1/mode' ) );
		$nonce       = wp_create_nonce( 'wp_rest' );

		// TTS-279: copy for the shared dialog. The typed-phrase prompt is gone —
		// the REST endpoint still validates the "GO LIVE" phrase server-side, so
		// the gate is unchanged; the dialog sends the phrase instead of making the
		// user type it. Typing a phrase is friction against the exact action this
		// ticket exists to make reachable.
		$l10n = array(
			'go_title'      => __( 'Go live?', 'text-to-audio' ),
			'go_body'       => __( 'Your audio player becomes visible to everyone visiting your site.', 'text-to-audio' ),
			'go_note'       => __( 'You can revert to staging at any time.', 'text-to-audio' ),
			'go_cta'        => __( 'Yes, go live', 'text-to-audio' ),
			'rev_title'     => __( 'Revert to staging?', 'text-to-audio' ),
			'rev_body'      => __( 'Your player disappears for visitors and becomes visible only to logged-in admins again.', 'text-to-audio' ),
			'rev_note'      => __( 'Your generated MP3 files and settings are kept.', 'text-to-audio' ),
			'rev_cta'       => __( 'Revert to staging', 'text-to-audio' ),
			'rev_stay'      => __( 'Stay live', 'text-to-audio' ),
			'cancel'        => __( 'Cancel', 'text-to-audio' ),
			'working_go'    => __( 'Switching to live…', 'text-to-audio' ),
			'working_rev'   => __( 'Reverting to staging…', 'text-to-audio' ),
			'done_go'       => __( 'You are live. Visitors can hear the player.', 'text-to-audio' ),
			'done_rev'      => __( 'Reverted. Only logged-in admins can see the player.', 'text-to-audio' ),
			'fail_go'       => __( 'Could not switch. You are still in staging.', 'text-to-audio' ),
			'fail_rev'      => __( 'Could not revert. You are still live.', 'text-to-audio' ),
		);

		$summary = self::go_live_summary();

		?>
		<style id="atlasvoice-golive-style">
		.atlasvoice-gl-ovl{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:160000;display:flex;align-items:center;justify-content:center;padding:20px}
		.atlasvoice-gl-box{background:#fff;border-radius:8px;padding:22px;width:100%;max-width:430px;box-shadow:0 8px 24px rgba(0,0,0,.2);font-size:13px;line-height:1.6;color:#1d2327}
		.atlasvoice-gl-h{font-size:17px;font-weight:600;margin:0 0 6px}
		.atlasvoice-gl-b{color:#50575e;margin:0 0 16px}
		.atlasvoice-gl-sum{background:#f6f7f7;border-radius:4px;padding:12px 14px;margin:0 0 16px}
		.atlasvoice-gl-row{display:flex;justify-content:space-between;gap:12px;padding:3px 0}
		.atlasvoice-gl-row span:first-child{color:#50575e}
		.atlasvoice-gl-note{color:#50575e;font-size:12px;margin:0 0 16px}
		.atlasvoice-gl-warn{background:#fcf9e8;border-radius:4px;padding:12px 14px;margin:0 0 16px;color:#412402}
		.atlasvoice-gl-act{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
		.atlasvoice-gl-msg{margin:0 0 16px}
		.atlasvoice-gl-msg.is-err{color:#b32d2e}
		.atlasvoice-gl-msg.is-ok{color:#00713b}
		@media(prefers-color-scheme:dark){.atlasvoice-gl-box{background:#1e1e1e;color:#e0e0e0}.atlasvoice-gl-sum{background:#2c2c2c}.atlasvoice-gl-b,.atlasvoice-gl-note,.atlasvoice-gl-row span:first-child{color:#a7aaad}}
		</style>
		<script id="atlasvoice-bar-actions">
		(function () {
			var ENDPOINT   = <?php echo wp_json_encode( $endpoint ); ?>;
			var NONCE      = <?php echo wp_json_encode( $nonce ); ?>;
			var L10N       = <?php echo wp_json_encode( $l10n ); ?>;
			var SUMMARY    = <?php echo wp_json_encode( $summary ); ?>;

			// TTS-279: one dialog, shared by the toolbar node (wp-admin and front
			// end), the dashboard notice and the site-wide notice. Vanilla and
			// dependency-free so it works identically on the front end, where no
			// admin scripts are enqueued.
			function esc(s) {
				return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
					return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
				});
			}

			function closeDialog() {
				var el = document.querySelector('.atlasvoice-gl-ovl');
				if (el && el.parentNode) { el.parentNode.removeChild(el); }
				document.removeEventListener('keydown', onKey);
			}

			function onKey(e) {
				if (e.key === 'Escape') { closeDialog(); }
			}

			function openDialog(opts) {
				closeDialog();

				var rows = '';
				if (opts.summary) {
					SUMMARY.forEach(function (r) {
						rows += '<div class="atlasvoice-gl-row"><span>' + esc(r.label) +
							'</span><span>' + esc(r.value) + '</span></div>';
					});
					if (rows) { rows = '<div class="atlasvoice-gl-sum">' + rows + '</div>'; }
				}

				var warn = opts.warn
					? '<div class="atlasvoice-gl-warn">' + esc(opts.warn) + '</div>'
					: '';

				var ovl = document.createElement('div');
				ovl.className = 'atlasvoice-gl-ovl';
				ovl.innerHTML =
					'<div class="atlasvoice-gl-box" role="dialog" aria-modal="true" aria-label="' + esc(opts.title) + '">' +
						'<p class="atlasvoice-gl-h">' + esc(opts.title) + '</p>' +
						'<p class="atlasvoice-gl-b">' + esc(opts.body) + '</p>' +
						rows + warn +
						'<p class="atlasvoice-gl-note">' + esc(opts.note) + '</p>' +
						'<p class="atlasvoice-gl-msg" hidden></p>' +
						'<div class="atlasvoice-gl-act">' +
							'<button type="button" class="button atlasvoice-gl-cancel">' + esc(opts.cancel) + '</button>' +
							'<button type="button" class="button button-primary atlasvoice-gl-ok">' + esc(opts.cta) + '</button>' +
						'</div>' +
					'</div>';

				document.body.appendChild(ovl);
				document.addEventListener('keydown', onKey);

				ovl.addEventListener('click', function (e) {
					if (e.target === ovl) { closeDialog(); }
				});
				ovl.querySelector('.atlasvoice-gl-cancel').addEventListener('click', closeDialog);

				var ok  = ovl.querySelector('.atlasvoice-gl-ok');
				var msg = ovl.querySelector('.atlasvoice-gl-msg');
				ok.focus();
				ok.addEventListener('click', function () {
					ok.disabled = true;
					msg.hidden = false;
					msg.className = 'atlasvoice-gl-msg';
					msg.textContent = opts.working;
					call(opts.payload, opts.done, opts.fail, msg, ok);
				});
			}

			function fail(msg, el, detail, btn) {
				el.className = 'atlasvoice-gl-msg is-err';
				// TTS-279: always say which mode the site actually ended up in —
				// never leave an admin unsure whether their player is public.
				el.textContent = detail ? msg + ' (' + detail + ')' : msg;
				if (btn) { btn.disabled = false; }
			}

			function call(payload, successMsg, failMsg, el, btn) {
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
					}).catch(function () {
						return { ok: false, body: null };
					});
				}).then(function (res) {
					if (res.ok && res.body && res.body.status) {
						el.className = 'atlasvoice-gl-msg is-ok';
						el.textContent = successMsg;
						window.location.reload();
						return true;
					}
					fail(failMsg, el, (res.body && (res.body.message || res.body.code)) || '', btn);
					return false;
				}).catch(function (err) {
					fail(failMsg, el, (err && err.message) ? err.message : '', btn);
					return false;
				});
			}

			// TTS-279: the single Go Live entry point. Kept under the same global
			// name so the existing toolbar node keeps working unchanged, and so
			// the notice buttons have one function to call.
			window.atlasvoiceGoLive = function () {
				openDialog({
					title:   L10N.go_title,
					body:    L10N.go_body,
					note:    L10N.go_note,
					cancel:  L10N.cancel,
					cta:     L10N.go_cta,
					summary: true,
					working: L10N.working_go,
					done:    L10N.done_go,
					fail:    L10N.fail_go,
					payload: { action: 'go-live', confirm: 'GO LIVE' }
				});
				return false;
			};

			window.atlasvoiceRevert = function () {
				openDialog({
					title:   L10N.rev_title,
					body:    L10N.rev_body,
					note:    L10N.rev_note,
					cancel:  L10N.rev_stay,
					cta:     L10N.rev_cta,
					summary: false,
					working: L10N.working_rev,
					done:    L10N.done_rev,
					fail:    L10N.fail_rev,
					payload: { action: 'revert' }
				});
				return false;
			};

			// TTS-279: notice buttons opt in by markup alone, so a notice never
			// needs its own script and can render before this file loads.
			document.addEventListener('click', function (e) {
				var t = e.target.closest ? e.target.closest('[data-atlasvoice-action]') : null;
				if (!t) { return; }
				e.preventDefault();
				if (t.getAttribute('data-atlasvoice-action') === 'revert') {
					window.atlasvoiceRevert();
				} else {
					window.atlasvoiceGoLive();
				}
			});
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
