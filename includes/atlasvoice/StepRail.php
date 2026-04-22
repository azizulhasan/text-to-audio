<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice step-rail shell (TTS-238 v5 §5.9 / D9).
 *
 * The step rail is the guided UI that walks an admin through the three
 * foundational decisions needed to extract audio content cleanly:
 *
 *   ① Scope — which layer of the precedence chain we're editing
 *              (global / post type / language / post type + language / post).
 *   ② Post type (+ language) — populated only when ① selects a scope that
 *              needs them. The list comes from REST `/step-rail/scopes`
 *              so registered CPTs + detected language plugins stay in sync.
 *   ③ Content region — the sandboxed iframe where the admin actually picks
 *              the CSS selector for the chosen scope. Loads a sample post
 *              with `?atlasvoice_iframe=1` + nonce, which flips the
 *              front-end into pick mode (admin bar suppressed, picker
 *              bundle auto-boots, postMessage bridge handshake).
 *
 * D9 delivers only the **shell**: the three rows, the iframe orchestration,
 * the pick-mode handshake, and the persistence glue. Rows ④⑤⑥ (rule-chip
 * editor, reject mode, Cmd/Ctrl+Z undo) are D10. The 5-second listen
 * sample + diff counter are D11. The Pro-lock overlays are D12.
 *
 * Integration surface:
 *
 *   - Loaded automatically on AtlasVoice dashboard screens and on
 *     `post` / `post-new` screens (same scope as the picker-loader stub,
 *     so `ttsLoadPicker()` is guaranteed to be reachable).
 *
 *   - `window.AtlasVoiceStepRail.open({ post_id, scope, post_type, language })`
 *     opens the rail with whichever fields the caller can provide —
 *     the meta-box "Pick…" button passes `{ post_id }` and `scope='post'`;
 *     the Rules table links pass `{ scope, post_type, language }`.
 *
 *   - `atlasvoice:steprail:closed` / `atlasvoice:steprail:saved` custom
 *     events let callers react without polling.
 *
 *   - On the front end, `?atlasvoice_iframe=1&_wpnonce=<rest nonce>` +
 *     `manage_options` gates activate pick mode. The nonce path prevents
 *     a logged-out visitor from ever seeing a picker bar even if they
 *     stumble onto a crafted URL.
 */
class StepRail {

	/** Script / style handle shared by the inline shell bundle. */
	const HANDLE = 'tta-atlasvoice-step-rail';

	/** Query var that flips the front end into iframe pick-mode. */
	const IFRAME_FLAG = 'atlasvoice_iframe';

	/** Per-request guard so multiple enqueue calls don't double-print. */
	private static $shell_enqueued = false;

	/** Per-request guard for iframe mode activation. */
	private static $iframe_active = false;

	/**
	 * Wire admin enqueue + footer shell + front-end iframe detection.
	 * Idempotent via Bootstrap::register()'s static flag.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ), 15 );
		add_action( 'admin_footer',          array( __CLASS__, 'render_shell' ),          50 );

		add_action( 'template_redirect',     array( __CLASS__, 'maybe_activate_iframe' ),   1 );
	}

	// -----------------------------------------------------------------
	// Admin-side: shell assets
	// -----------------------------------------------------------------

	/**
	 * Enqueue the inline shell CSS + JS on pages where the rail is
	 * reachable. Same scope as PickerLoader::emit_stub so the two
	 * stubs land together.
	 *
	 * @return void
	 */
	public static function enqueue_admin_assets() {
		if ( self::$shell_enqueued ) { return; }
		if ( ! self::should_load_admin() ) { return; }
		self::$shell_enqueued = true;

		// Inline-only handle — no external JS file yet. A dedicated
		// webpack entry (`src/step-rail/`) can land in a future
		// milestone without breaking this bootstrap.
		wp_register_script( self::HANDLE, '', array(), self::version(), true );
		wp_register_style(  self::HANDLE, false, array(), self::version() );

		wp_enqueue_script(  self::HANDLE );
		wp_enqueue_style(   self::HANDLE );

		wp_add_inline_style(  self::HANDLE, self::shell_css() );
		wp_add_inline_script( self::HANDLE, self::shell_bootstrap_js(), 'after' );
	}

	/**
	 * Render the (hidden) DOM shell once per admin page in the
	 * admin_footer slot. The shell is inert until JS flips
	 * `.is-open` on the outer container.
	 *
	 * @return void
	 */
	public static function render_shell() {
		if ( ! self::should_load_admin() ) { return; }

		// Namespace is `tts/v1` (see RestRoutes::NAMESPACE_PREFIX).
		$rest_base = esc_url_raw( rest_url( RestRoutes::NAMESPACE_PREFIX ) );
		$nonce     = wp_create_nonce( 'wp_rest' );
		$pro       = ( class_exists( '\\TTA\\AtlasVoice\\PerPostRules' ) && PerPostRules::available() ) ? '1' : '0';

		?>
		<div
			id="atlasvoice-step-rail"
			class="atlasvoice-step-rail"
			data-rest="<?php echo esc_attr( $rest_base ); ?>"
			data-nonce="<?php echo esc_attr( $nonce ); ?>"
			data-iframe-flag="<?php echo esc_attr( self::IFRAME_FLAG ); ?>"
			data-pro="<?php echo esc_attr( $pro ); ?>"
			role="dialog"
			aria-modal="true"
			aria-hidden="true"
			aria-labelledby="atlasvoice-step-rail-title"
			hidden
		>
			<div class="atlasvoice-step-rail__backdrop" data-close="1"></div>
			<div class="atlasvoice-step-rail__panel" role="document">
				<header class="atlasvoice-step-rail__header">
					<h2 id="atlasvoice-step-rail-title">
						<?php echo esc_html__( 'AtlasVoice — Pick content region', 'text-to-audio' ); ?>
					</h2>
					<button
						type="button"
						class="atlasvoice-step-rail__close"
						data-close="1"
						aria-label="<?php echo esc_attr__( 'Close step rail', 'text-to-audio' ); ?>"
					>&times;</button>
				</header>

				<ol class="atlasvoice-step-rail__rows" aria-live="polite">
					<li class="atlasvoice-step-rail__row is-active" data-row="scope">
						<span class="atlasvoice-step-rail__bullet">&#9312;</span>
						<div class="atlasvoice-step-rail__row-body">
							<strong><?php echo esc_html__( 'Scope', 'text-to-audio' ); ?></strong>
							<p class="atlasvoice-step-rail__hint">
								<?php echo esc_html__( 'Which layer should this selector apply to? Higher rows beat lower rows.', 'text-to-audio' ); ?>
							</p>
							<div
								class="atlasvoice-step-rail__scope-group"
								role="radiogroup"
								aria-label="<?php echo esc_attr__( 'Selector scope', 'text-to-audio' ); ?>"
							></div>
						</div>
					</li>

					<li class="atlasvoice-step-rail__row" data-row="target">
						<span class="atlasvoice-step-rail__bullet">&#9313;</span>
						<div class="atlasvoice-step-rail__row-body">
							<strong><?php echo esc_html__( 'Post type &amp; language', 'text-to-audio' ); ?></strong>
							<p class="atlasvoice-step-rail__hint">
								<?php echo esc_html__( 'Used to locate a representative sample post for the region picker.', 'text-to-audio' ); ?>
							</p>
							<div class="atlasvoice-step-rail__target-fields"></div>
						</div>
					</li>

					<li class="atlasvoice-step-rail__row" data-row="region">
						<span class="atlasvoice-step-rail__bullet">&#9314;</span>
						<div class="atlasvoice-step-rail__row-body">
							<strong><?php echo esc_html__( 'Content region', 'text-to-audio' ); ?></strong>
							<p class="atlasvoice-step-rail__hint">
								<?php echo esc_html__( 'Click any element in the preview to learn a stable selector for it.', 'text-to-audio' ); ?>
							</p>
							<div class="atlasvoice-step-rail__mode-toggle">
								<label><input type="radio" name="av-pick-mode" value="pick" checked /> <?php echo esc_html__( 'Pick content', 'text-to-audio' ); ?></label>
								<label><input type="radio" name="av-pick-mode" value="reject" /> <?php echo esc_html__( 'Reject (add to CSS excludes)', 'text-to-audio' ); ?></label>
								<span class="atlasvoice-step-rail__mode-hint"><?php echo esc_html__( 'Tip: Alt-click in the preview to reject without flipping modes.', 'text-to-audio' ); ?></span>
							</div>
							<div class="atlasvoice-step-rail__iframe-wrap">
								<iframe
									class="atlasvoice-step-rail__iframe"
									title="<?php echo esc_attr__( 'Sample post sandbox', 'text-to-audio' ); ?>"
									sandbox="allow-scripts allow-same-origin allow-forms"
								></iframe>
								<div class="atlasvoice-step-rail__iframe-empty">
									<?php echo esc_html__( 'Pick a scope and target above, then the sandbox loads a sample post.', 'text-to-audio' ); ?>
								</div>
								<div class="atlasvoice-step-rail__picked">
									<label>
										<?php echo esc_html__( 'Selector', 'text-to-audio' ); ?>
										<input type="text" class="atlasvoice-step-rail__selector-input" />
									</label>
								</div>
							</div>
						</div>
					</li>

					<li class="atlasvoice-step-rail__row atlasvoice-step-rail__row--chips" data-row="excl_css" data-chip-kind="excl_css">
						<span class="atlasvoice-step-rail__bullet">&#9315;</span>
						<div class="atlasvoice-step-rail__row-body">
							<strong><?php echo esc_html__( 'CSS excludes', 'text-to-audio' ); ?></strong>
							<p class="atlasvoice-step-rail__hint">
								<?php echo esc_html__( 'Elements matching these selectors are stripped before reading (e.g. .related-posts, nav.share).', 'text-to-audio' ); ?>
							</p>
							<div class="atlasvoice-step-rail__chips" role="list"></div>
							<form class="atlasvoice-step-rail__chip-add">
								<input type="text" placeholder="<?php echo esc_attr__( 'Add CSS selector…', 'text-to-audio' ); ?>" />
								<button type="submit" class="button"><?php echo esc_html__( 'Add', 'text-to-audio' ); ?></button>
							</form>
						</div>
					</li>

					<li class="atlasvoice-step-rail__row atlasvoice-step-rail__row--chips" data-row="excl_texts" data-chip-kind="excl_texts">
						<span class="atlasvoice-step-rail__bullet">&#9316;</span>
						<div class="atlasvoice-step-rail__row-body">
							<strong><?php echo esc_html__( 'Text excludes', 'text-to-audio' ); ?></strong>
							<p class="atlasvoice-step-rail__hint">
								<?php echo esc_html__( 'Any paragraph containing one of these substrings is skipped (e.g. "Share this article", "Read more").', 'text-to-audio' ); ?>
							</p>
							<div class="atlasvoice-step-rail__chips" role="list"></div>
							<form class="atlasvoice-step-rail__chip-add">
								<input type="text" placeholder="<?php echo esc_attr__( 'Add text substring…', 'text-to-audio' ); ?>" />
								<button type="submit" class="button"><?php echo esc_html__( 'Add', 'text-to-audio' ); ?></button>
							</form>
						</div>
					</li>

					<li class="atlasvoice-step-rail__row atlasvoice-step-rail__row--chips" data-row="excl_tags" data-chip-kind="excl_tags">
						<span class="atlasvoice-step-rail__bullet">&#9317;</span>
						<div class="atlasvoice-step-rail__row-body">
							<strong><?php echo esc_html__( 'Tag excludes', 'text-to-audio' ); ?></strong>
							<p class="atlasvoice-step-rail__hint">
								<?php echo esc_html__( 'Any element with this tag name is skipped (e.g. aside, footer, form).', 'text-to-audio' ); ?>
							</p>
							<div class="atlasvoice-step-rail__chips" role="list"></div>
							<form class="atlasvoice-step-rail__chip-add">
								<input type="text" placeholder="<?php echo esc_attr__( 'Add tag name…', 'text-to-audio' ); ?>" />
								<button type="submit" class="button"><?php echo esc_html__( 'Add', 'text-to-audio' ); ?></button>
							</form>
						</div>
					</li>
				</ol>

				<footer class="atlasvoice-step-rail__footer">
					<span class="atlasvoice-step-rail__status" aria-live="polite"></span>
					<span class="atlasvoice-step-rail__spacer"></span>
					<button type="button" class="button atlasvoice-step-rail__cancel" data-close="1">
						<?php echo esc_html__( 'Cancel', 'text-to-audio' ); ?>
					</button>
					<button
						type="button"
						class="button button-primary atlasvoice-step-rail__save"
						disabled
					>
						<?php echo esc_html__( 'Save selector', 'text-to-audio' ); ?>
					</button>
				</footer>
			</div>
		</div>
		<?php
	}

	/**
	 * Inline CSS for the shell. Scoped under `.atlasvoice-step-rail`
	 * so it can't leak into admin screens that don't open the rail.
	 *
	 * @return string
	 */
	protected static function shell_css() {
		return '
			.atlasvoice-step-rail[hidden]{display:none!important;}
			.atlasvoice-step-rail{position:fixed;inset:0;z-index:100050;}
			.atlasvoice-step-rail__backdrop{position:absolute;inset:0;background:rgba(15,23,42,0.55);}
			.atlasvoice-step-rail__panel{position:absolute;inset:4vh 4vw;background:#fff;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,0.35);display:flex;flex-direction:column;overflow:hidden;}
			.atlasvoice-step-rail__header{padding:14px 20px;background:#184c53;color:#fff;display:flex;align-items:center;justify-content:space-between;}
			.atlasvoice-step-rail__header h2{margin:0;color:#fff;font-size:16px;line-height:1.3;}
			.atlasvoice-step-rail__close{background:transparent;color:#fff;border:0;font-size:22px;line-height:1;cursor:pointer;padding:4px 10px;}
			.atlasvoice-step-rail__rows{list-style:none;margin:0;padding:16px 20px;overflow:auto;flex:1;}
			.atlasvoice-step-rail__row{display:flex;gap:14px;padding:14px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;margin-bottom:12px;transition:box-shadow 0.15s;}
			.atlasvoice-step-rail__row.is-active{background:#fff;border-color:#184c53;box-shadow:0 2px 8px rgba(24,76,83,0.08);}
			.atlasvoice-step-rail__row.is-done{background:#f0f7ed;border-color:#00a32a;}
			.atlasvoice-step-rail__row.is-disabled{opacity:0.55;}
			.atlasvoice-step-rail__bullet{font-size:20px;line-height:1;width:26px;text-align:center;color:#184c53;flex:none;}
			.atlasvoice-step-rail__row.is-done .atlasvoice-step-rail__bullet{color:#00a32a;}
			.atlasvoice-step-rail__row-body{flex:1;min-width:0;}
			.atlasvoice-step-rail__row-body strong{display:block;margin-bottom:2px;}
			.atlasvoice-step-rail__hint{margin:0 0 8px;color:#4b5563;font-size:12px;}
			.atlasvoice-step-rail__scope-group{display:flex;flex-wrap:wrap;gap:8px;}
			.atlasvoice-step-rail__scope-group label{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid #d1d5db;border-radius:999px;background:#fff;cursor:pointer;font-size:13px;}
			.atlasvoice-step-rail__scope-group label.is-checked{border-color:#184c53;background:#eaf3f4;}
			.atlasvoice-step-rail__target-fields{display:flex;flex-wrap:wrap;gap:12px;}
			.atlasvoice-step-rail__target-fields label{display:flex;flex-direction:column;font-size:12px;color:#4b5563;gap:4px;}
			.atlasvoice-step-rail__target-fields select{min-width:180px;}
			.atlasvoice-step-rail__iframe-wrap{position:relative;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;background:#f3f4f6;min-height:260px;}
			.atlasvoice-step-rail__iframe{display:none;width:100%;height:52vh;border:0;background:#fff;}
			.atlasvoice-step-rail__iframe-wrap.is-live .atlasvoice-step-rail__iframe{display:block;}
			.atlasvoice-step-rail__iframe-wrap.is-live .atlasvoice-step-rail__iframe-empty{display:none;}
			.atlasvoice-step-rail__iframe-empty{padding:48px 24px;text-align:center;color:#6b7280;font-size:13px;}
			.atlasvoice-step-rail__picked{padding:10px 12px;background:#fff;border-top:1px solid #e5e7eb;}
			.atlasvoice-step-rail__picked label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#374151;}
			.atlasvoice-step-rail__selector-input{width:100%;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;}
			.atlasvoice-step-rail__footer{padding:12px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;display:flex;align-items:center;gap:10px;}
			.atlasvoice-step-rail__status{flex:1;font-size:12px;color:#4b5563;}
			.atlasvoice-step-rail__spacer{flex:1;}
			.atlasvoice-step-rail__mode-toggle{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:6px 0 10px;font-size:12px;color:#374151;}
			.atlasvoice-step-rail__mode-toggle label{display:inline-flex;align-items:center;gap:4px;}
			.atlasvoice-step-rail__mode-hint{color:#6b7280;font-style:italic;margin-left:auto;}
			.atlasvoice-step-rail__iframe-wrap.is-reject-mode{outline:2px dashed #b91c1c;outline-offset:-2px;}
			.atlasvoice-step-rail__row--chips.is-locked{opacity:0.6;pointer-events:none;}
			.atlasvoice-step-rail__chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;min-height:22px;}
			.atlasvoice-step-rail__chip{display:inline-flex;align-items:center;gap:4px;padding:3px 4px 3px 10px;border-radius:999px;background:#eef2ff;border:1px solid #c7d2fe;font-size:12px;color:#312e81;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
			.atlasvoice-step-rail__row[data-chip-kind="excl_texts"] .atlasvoice-step-rail__chip{background:#fef3c7;border-color:#fde68a;color:#78350f;font-family:inherit;}
			.atlasvoice-step-rail__row[data-chip-kind="excl_tags"]  .atlasvoice-step-rail__chip{background:#ecfdf5;border-color:#a7f3d0;color:#065f46;}
			.atlasvoice-step-rail__chip button{background:transparent;border:0;cursor:pointer;color:inherit;font-size:14px;line-height:1;padding:0 4px;}
			.atlasvoice-step-rail__chip button:hover{color:#b91c1c;}
			.atlasvoice-step-rail__chip-add{display:flex;gap:6px;margin-top:4px;}
			.atlasvoice-step-rail__chip-add input{flex:1;font-family:inherit;font-size:13px;}
			.atlasvoice-step-rail__undo-hint{font-size:11px;color:#6b7280;padding-left:10px;}
		';
	}

	/**
	 * Inline JS bootstrap. Exposes `window.AtlasVoiceStepRail` with
	 * `open / close` + event names. Intentionally framework-free so
	 * the rail works in both the React dashboard and the classic
	 * post-edit meta box.
	 *
	 * @return string
	 */
	protected static function shell_bootstrap_js() {
		return file_get_contents( self::shell_js_path() );
	}

	/**
	 * Absolute filesystem path to the shell JS template. Split into a
	 * file so Git diffs stay readable and we don't have to escape
	 * every brace in a PHP heredoc.
	 *
	 * @return string
	 */
	protected static function shell_js_path() {
		if ( defined( 'TTA_PLUGIN_PATH' ) ) {
			return TTA_PLUGIN_PATH . 'includes/atlasvoice/step-rail.shell.js';
		}
		return dirname( __FILE__ ) . '/step-rail.shell.js';
	}

	// -----------------------------------------------------------------
	// Front-end: iframe pick-mode
	// -----------------------------------------------------------------

	/**
	 * When `?atlasvoice_iframe=1` is on the URL AND the caller has a
	 * valid admin nonce AND they can `manage_options`, flip the front
	 * end into pick mode: hide admin bar, preload extractor + picker,
	 * emit the postMessage bridge + pick banner.
	 *
	 * The three-gate guard (flag + cap + nonce) means a hostile link
	 * can't put a logged-out visitor into pick mode, and it can't
	 * even put a lower-privilege user (author/editor) into pick mode
	 * since the rail is a `manage_options` tool.
	 *
	 * @return void
	 */
	public static function maybe_activate_iframe() {
		if ( empty( $_GET[ self::IFRAME_FLAG ] ) ) { return; } // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! is_singular() ) { return; }
		if ( ! current_user_can( 'manage_options' ) ) { return; }

		$nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) { return; }

		self::$iframe_active = true;
		show_admin_bar( false );

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'iframe_enqueue' ), 5 );
		add_action( 'wp_head',            array( __CLASS__, 'iframe_style' ),   1 );
		add_action( 'wp_footer',          array( __CLASS__, 'iframe_footer' ), 99 );
	}

	/**
	 * Force-register extractor + picker so `ttsLoadPicker()` can pull
	 * the bundle. On the front-end the PickerLoader's `emit_stub` is
	 * gated on `is_singular()` + opt-in, so the iframe-mode gate
	 * guarantees the stub is already present when this runs.
	 *
	 * @return void
	 */
	public static function iframe_enqueue() {
		// Nothing to do here right now — PickerLoader already emits
		// the lazy stub on singular views. Method kept so future
		// eager preload (e.g. `<link rel="preload">`) slots in here.
	}

	/**
	 * Emit iframe-specific CSS: pull the theme chrome tight against
	 * the viewport so the sandbox doesn't waste vertical space on
	 * sticky headers / cookie banners that visitors see but admins
	 * don't need while picking.
	 *
	 * @return void
	 */
	public static function iframe_style() {
		if ( ! self::$iframe_active ) { return; }
		?>
		<style id="atlasvoice-iframe-mode">
			html, body { background:#fff !important; }
			#wpadminbar { display:none !important; }
			html { margin-top:0 !important; }
			body { padding-top:40px !important; }
			.atlasvoice-iframe-banner {
				position:fixed; top:0; left:0; right:0; z-index:2147483646;
				height:40px; background:#184c53; color:#fff;
				display:flex; align-items:center; padding:0 14px;
				font:600 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
				box-shadow:0 2px 6px rgba(0,0,0,.15);
			}
			.atlasvoice-iframe-banner .av-dot{
				width:8px; height:8px; border-radius:50%;
				background:#facc15; margin-right:8px; flex:none;
				animation:av-pulse 1.4s infinite;
			}
			@keyframes av-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
		</style>
		<?php
	}

	/**
	 * Emit the iframe-mode footer glue: the pick banner + the
	 * postMessage bridge. The bridge translates parent commands
	 * (`pick:start`, `pick:cancel`) into picker API calls and
	 * relays the picker's selector result back to the parent.
	 *
	 * @return void
	 */
	public static function iframe_footer() {
		if ( ! self::$iframe_active ) { return; }
		$origin = esc_js( self::expected_parent_origin() );
		?>
		<div class="atlasvoice-iframe-banner" role="status">
			<span class="av-dot" aria-hidden="true"></span>
			<span><?php echo esc_html__( 'AtlasVoice pick mode — click an element in the page to learn its selector.', 'text-to-audio' ); ?></span>
		</div>
		<script>
		(function(w,d){
			var PARENT_ORIGIN = '<?php echo $origin; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>';
			function send(type, payload){
				try { w.parent.postMessage({ source:'atlasvoice-iframe', type:type, payload:payload||{} }, PARENT_ORIGIN || '*'); } catch(e){}
			}

			// D10 — Alt-click shortcut. Skips the picker API entirely
			// and sends a reject-flavoured selector straight to the
			// parent, so power users can build their exclude list
			// without flipping the pick/reject radio every time.
			// Walks up the DOM one level if the target is a text
			// node to keep selectors stable.
			function altClickSelector(target){
				if (!target) { return ''; }
				if (target.nodeType && target.nodeType !== 1) { target = target.parentElement; }
				if (!target) { return ''; }
				var pickApi = w.AtlasVoiceSelector;
				if (pickApi && typeof pickApi.computeStableSelector === 'function') {
					try { return pickApi.computeStableSelector(target) || ''; } catch(e) {}
				}
				// Framework-free fallback if the picker bundle never
				// exposed computeStableSelector (shouldn't happen
				// post-D8 but keep us useful if it does).
				if (target.id) { return '#' + target.id; }
				var parts = [];
				var el = target;
				while (el && el.nodeType === 1 && parts.length < 4) {
					var tag = el.tagName.toLowerCase();
					if (el.className && typeof el.className === 'string') {
						tag += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
					}
					parts.unshift(tag);
					el = el.parentElement;
				}
				return parts.join(' > ');
			}
			d.addEventListener('click', function(e){
				if (!e.altKey) { return; }
				var altSel = altClickSelector(e.target);
				if (!altSel) { return; }
				e.preventDefault();
				e.stopPropagation();
				send('pick:reject', { selector: altSel });
			}, true);

			function booted(api){
				send('ready', { hasApi: !!api });
				w.addEventListener('message', function(e){
					if (PARENT_ORIGIN && e.origin !== PARENT_ORIGIN) { return; }
					var m = e.data || {};
					if (!m || m.source !== 'atlasvoice-parent') { return; }
					if (m.type === 'pick:start' && api && api.start) {
						api.start(function(result){
							send('pick:selected', result || {});
						});
					}
					if (m.type === 'pick:cancel' && api && api.stop) {
						api.stop();
					}
				});
			}
			function boot(){
				if (typeof w.ttsLoadPicker !== 'function') { send('error', { code:'picker-stub-missing' }); return; }
				w.ttsLoadPicker().then(booted).catch(function(err){ send('error', { code:'picker-load-failed', message:String(err) }); });
			}
			if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', boot); }
			else { boot(); }
		})(window, document);
		</script>
		<?php
	}

	// -----------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------

	/**
	 * Deciding whether to load the admin shell. Mirrors
	 * PickerLoader::emit_on_admin so the two boot together.
	 *
	 * @return bool
	 */
	protected static function should_load_admin() {
		if ( wp_doing_ajax() ) { return false; }
		if ( defined( 'DOING_CRON' ) && DOING_CRON ) { return false; }
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) { return false; }
		if ( ! function_exists( 'get_current_screen' ) ) { return false; }
		$screen = get_current_screen();
		if ( ! $screen instanceof \WP_Screen ) { return false; }
		if ( $screen->base === 'post' ) { return true; }
		if ( strpos( (string) $screen->id, 'text-to-audio' ) !== false ) { return true; }
		return false;
	}

	/**
	 * Version string for cache-busting the inline bundles.
	 *
	 * @return string
	 */
	protected static function version() {
		return defined( 'TEXT_TO_AUDIO_VERSION' ) ? (string) TEXT_TO_AUDIO_VERSION : '1.0.0';
	}

	/**
	 * Expected origin of the parent window. The iframe trusts
	 * messages only from the site's own `home_url()` — same-origin
	 * by design, but we pin it explicitly so a future proxy / CDN
	 * host mismatch can't inject fake pick commands.
	 *
	 * @return string
	 */
	protected static function expected_parent_origin() {
		$url  = home_url();
		$host = wp_parse_url( $url, PHP_URL_HOST );
		if ( ! $host ) { return ''; }
		$scheme = wp_parse_url( $url, PHP_URL_SCHEME );
		$scheme = $scheme ? $scheme : ( is_ssl() ? 'https' : 'http' );
		$port   = wp_parse_url( $url, PHP_URL_PORT );
		return $scheme . '://' . $host . ( $port ? ':' . $port : '' );
	}

	/**
	 * Is the current front-end request in iframe pick mode? Used by
	 * tests + by the front-end iframe_footer callback to avoid
	 * double-initialising the bridge on non-iframe views.
	 *
	 * @return bool
	 */
	public static function is_iframe_active() {
		return (bool) self::$iframe_active;
	}
}
