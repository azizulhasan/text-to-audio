<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice Step Rail — front-end content picker (TTS-238 v5 rebuilt).
 *
 * Renders two floating tabs on the actual post page when an admin visits:
 *
 *   LEFT  — "AtlasVoiceSelector" tab → 280 px sliding panel
 *           Step rail: scope → content region (include CSS) → excludes.
 *           Picker works directly on the live DOM (no iframe).
 *
 *   RIGHT — "Preview Content" tab → draggable overlay
 *           Shows extracted TTS text, updates on every rule change.
 *
 * Trigger: any singular post where the post type has listening enabled,
 * viewed by a user with manage_options. No manual activation needed.
 *
 * Dashboard convenience: plugin dashboard page has an "Open & Pick"
 * button that navigates to a post URL with ?atlasvoice_picker=1, which
 * auto-opens the left panel.
 */
class StepRail {

	const HANDLE      = 'tta-atlasvoice-step-rail';
	const AUTO_PARAM  = 'atlasvoice_picker';

	private static $registered   = false;
	private static $front_active = false;

	public static function register() {
		// Front-end: show picker tabs on eligible singular posts.
		add_action( 'template_redirect', array( __CLASS__, 'maybe_activate' ), 5 );

		// Admin dashboard: "Open & Pick" convenience URL builder.
		add_action( 'admin_footer', array( __CLASS__, 'maybe_render_dashboard_launcher' ), 99 );
	}

	// -----------------------------------------------------------------------
	// Front-end activation
	// -----------------------------------------------------------------------

	public static function maybe_activate() {
		if ( ! is_singular() ) { return; }
		if ( ! current_user_can( 'manage_options' ) ) { return; }

		// D26 — the picker now writes to legacy keys the extractor already
		// consumes; the opt-in flag (`tta__settings_use_atlasvoice_extractor`)
		// is gone. We also bypass the post-has-listening gate when the
		// admin explicitly arms the picker via `?atlasvoice_picker=1` so
		// the rail is reachable on any singular post even if its post type
		// isn't on the listening allow-list yet.
		$forced = isset( $_GET[ self::AUTO_PARAM ] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! $forced && ! self::post_has_listening( get_the_ID() ) ) { return; }

		self::$front_active = true;

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ), 20 );
		add_action( 'wp_footer',          array( __CLASS__, 'render_shell' ),   99 );
	}

	/**
	 * Check whether listening is enabled for this post's post type.
	 * Mirrors TTA_Helper::should_load_button() without the full helper dep.
	 */
	protected static function post_has_listening( $post_id ) {
		if ( ! $post_id ) { return false; }
		if ( class_exists( '\\TTA\\TTA_Helper' ) ) {
			return (bool) \TTA\TTA_Helper::should_load_button( $post_id );
		}
		// Fallback: trust that the post type is enabled.
		return true;
	}

	public static function enqueue_assets() {
		wp_register_script( self::HANDLE, '', array(), self::version(), true );
		wp_register_style(  self::HANDLE, false, array(), self::version() );
		wp_enqueue_script(  self::HANDLE );
		wp_enqueue_style(   self::HANDLE );
		wp_add_inline_style(  self::HANDLE, self::shell_css() );
		wp_add_inline_script( self::HANDLE, self::shell_js(), 'after' );
	}

	public static function render_shell() {
		if ( ! self::$front_active ) { return; }

		$post_id   = get_the_ID();
		$rest_base = esc_url_raw( rest_url( RestRoutes::NAMESPACE_PREFIX ) );
		$nonce     = wp_create_nonce( 'wp_rest' );
		$pro       = ( class_exists( '\\TTA\\AtlasVoice\\PerPostRules' ) && PerPostRules::available() ) ? '1' : '0';
		$auto_open = isset( $_GET[ self::AUTO_PARAM ] ) ? '1' : '0'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$settings     = class_exists( '\\TTA\\TTA_Helper' ) ? \TTA\TTA_Helper::tts_get_settings( 'settings' ) : array();
		$add_title    = ! empty( $settings['tta__settings_add_post_title_to_read'] )    ? '1' : '0';
		$add_excerpt  = ! empty( $settings['tta__settings_add_post_excerpt_to_read'] )  ? '1' : '0';
		$text_before  = isset( $settings['tta__settings_text_before_content'] ) ? (string) $settings['tta__settings_text_before_content'] : '';
		$text_after   = isset( $settings['tta__settings_text_after_content'] )  ? (string) $settings['tta__settings_text_after_content']  : '';
		$post_title   = $post_id ? get_the_title( $post_id ) : '';
		$post_excerpt = '';
		if ( $add_excerpt === '1' && $post_id ) {
			// Mirrors helpers.php: strip excerpt filters to avoid memory exhaustion.
			global $wp_filter;
			$_backup = $wp_filter['get_the_excerpt'] ?? null;
			remove_all_filters( 'get_the_excerpt' );
			$post_excerpt = get_the_excerpt( $post_id );
			if ( $_backup !== null ) { $wp_filter['get_the_excerpt'] = $_backup; }
			$post_excerpt = wp_strip_all_tags( $post_excerpt );
		}
		// Resolve the sentence delimiter after language-plugin filters have run.
		// Language plugins (WPML, Polylang, etc.) hook tts_sentence_delimiter to
		// return a locale-appropriate separator (e.g. '。' for Japanese).
		$delimiter = (string) apply_filters( 'tts_sentence_delimiter', '. ' );
		?>
		<div
			id="av-steprail-root"
			data-post-id="<?php echo esc_attr( $post_id ); ?>"
			data-rest="<?php echo esc_attr( $rest_base ); ?>"
			data-nonce="<?php echo esc_attr( $nonce ); ?>"
			data-pro="<?php echo esc_attr( $pro ); ?>"
			data-auto-open="<?php echo esc_attr( $auto_open ); ?>"
			data-add-title="<?php echo esc_attr( $add_title ); ?>"
			data-add-excerpt="<?php echo esc_attr( $add_excerpt ); ?>"
			data-text-before="<?php echo esc_attr( $text_before ); ?>"
			data-text-after="<?php echo esc_attr( $text_after ); ?>"
			data-post-title="<?php echo esc_attr( $post_title ); ?>"
			data-post-excerpt="<?php echo esc_attr( $post_excerpt ); ?>"
			data-delimiter="<?php echo esc_attr( $delimiter ); ?>"
			aria-hidden="true"
		>
			<!-- LEFT: floating tab -->
			<button
				type="button"
				class="av-tab av-tab--left"
				aria-expanded="false"
				aria-controls="av-rail-panel"
				title="<?php echo esc_attr__( 'AtlasVoice — pick content region', 'text-to-audio' ); ?>"
			><span><?php echo esc_html__( 'AtlasVoiceSelector', 'text-to-audio' ); ?></span></button>

			<!-- LEFT: sliding step rail panel -->
			<div id="av-rail-panel" class="av-rail-panel" role="dialog" aria-modal="false" aria-label="<?php echo esc_attr__( 'AtlasVoice content selector', 'text-to-audio' ); ?>" hidden>
				<div class="av-rail-panel__header">
					<span class="av-rail-panel__title"><?php echo esc_html__( 'Content Selector', 'text-to-audio' ); ?></span>
					<button type="button" class="av-rail-panel__close" aria-label="<?php echo esc_attr__( 'Close', 'text-to-audio' ); ?>">&times;</button>
				</div>

				<div class="av-rail-panel__body">
					<!-- Step ① Scope -->
					<section class="av-step" data-step="scope">
						<div class="av-step__head">
							<span class="av-step__num">&#9312;</span>
							<strong><?php echo esc_html__( 'Scope', 'text-to-audio' ); ?></strong>
						</div>
						<div class="av-step__body">
							<p class="av-scope-readout"><?php echo esc_html__( 'Loading…', 'text-to-audio' ); ?></p>
						</div>
					</section>

					<!-- Step ③ Content region (include) -->
					<section class="av-step" data-step="region">
						<div class="av-step__head">
							<span class="av-step__num">&#9313;</span>
							<strong><?php echo esc_html__( 'Content region', 'text-to-audio' ); ?></strong>
						</div>
						<div class="av-step__body">
							<p class="av-hint"><?php echo esc_html__( 'Click any element on the page to set its selector. Click again to deselect.', 'text-to-audio' ); ?></p>
							<div class="av-region-actions">
								<button type="button" class="av-btn av-btn--pick" data-state="idle">
									&#11040; <?php echo esc_html__( 'Pick element', 'text-to-audio' ); ?>
								</button>
								<button type="button" class="av-btn av-btn--select" data-state="idle" title="<?php echo esc_attr__( 'Drag across the page to mark the content region.', 'text-to-audio' ); ?>">
									&#9112; <?php echo esc_html__( 'Select to include', 'text-to-audio' ); ?>
								</button>
								<span class="av-word-count" hidden></span>
							</div>
							<div class="av-selector-display" hidden>
								<input type="text" class="av-selector-value av-selector-input" placeholder="<?php echo esc_attr__( 'e.g. div.entry-content', 'text-to-audio' ); ?>" />
								<button type="button" class="av-btn av-btn--clear-selector" title="<?php echo esc_attr__( 'Clear selector', 'text-to-audio' ); ?>">&times;</button>
							</div>
						</div>
					</section>

					<!-- Step ④ Skip areas (CSS excludes) — Pro -->
					<section class="av-step av-step--chips" data-step="excl_css" data-chip-kind="excl_css">
						<div class="av-step__head">
							<span class="av-step__num">&#9314;</span>
							<strong><?php echo esc_html__( 'Skip these areas', 'text-to-audio' ); ?></strong>
							<span class="av-pro-pill" hidden>Pro</span>
						</div>
						<div class="av-step__body">
							<p class="av-hint"><?php echo esc_html__( 'Elements matching these selectors are removed before reading (e.g. .sidebar, .share-bar).', 'text-to-audio' ); ?></p>
							<div class="av-chips" role="list"></div>
							<div class="av-chip-add">
								<button type="button" class="av-btn av-btn--pick-excl" data-kind="excl_css">
									&#11040; <?php echo esc_html__( 'Pick to exclude', 'text-to-audio' ); ?>
								</button>
								<button type="button" class="av-btn av-btn--select-excl" data-kind="excl_css" title="<?php echo esc_attr__( 'Drag across the page to mark areas to exclude.', 'text-to-audio' ); ?>">
									&#9112; <?php echo esc_html__( 'Select to exclude', 'text-to-audio' ); ?>
								</button>
								<span class="av-chip-sep"><?php echo esc_html__( 'or', 'text-to-audio' ); ?></span>
								<input type="text" class="av-chip-input" placeholder="<?php echo esc_attr__( 'Type selector…', 'text-to-audio' ); ?>" />
								<button type="button" class="av-btn av-btn--add-chip"><?php echo esc_html__( 'Add', 'text-to-audio' ); ?></button>
							</div>
						</div>
					</section>

					<!-- Step ⑤ Skip tags — Pro -->
					<section class="av-step av-step--chips" data-step="excl_tags" data-chip-kind="excl_tags">
						<div class="av-step__head">
							<span class="av-step__num">&#9315;</span>
							<strong><?php echo esc_html__( 'Skip these tag types', 'text-to-audio' ); ?></strong>
							<span class="av-pro-pill" hidden>Pro</span>
						</div>
						<div class="av-step__body">
							<p class="av-hint"><?php echo esc_html__( 'Elements with these tag names are skipped (e.g. aside, figure, blockquote).', 'text-to-audio' ); ?></p>
							<div class="av-tags-checkboxes"><?php echo self::render_common_tag_checkboxes(); ?></div>
							<div class="av-chips" role="list"></div>
							<div class="av-chip-add">
								<input type="text" class="av-chip-input" placeholder="<?php echo esc_attr__( 'Tag name (e.g. aside)…', 'text-to-audio' ); ?>" />
								<button type="button" class="av-btn av-btn--add-chip"><?php echo esc_html__( 'Add', 'text-to-audio' ); ?></button>
							</div>
						</div>
					</section>

					<!-- Step ⑥ Skip phrases — Pro -->
					<section class="av-step av-step--chips" data-step="excl_texts" data-chip-kind="excl_texts">
						<div class="av-step__head">
							<span class="av-step__num">&#9316;</span>
							<strong><?php echo esc_html__( 'Skip these phrases', 'text-to-audio' ); ?></strong>
							<span class="av-pro-pill" hidden>Pro</span>
						</div>
						<div class="av-step__body">
							<p class="av-hint"><?php echo esc_html__( 'Exact phrases stripped from the extracted text wherever they appear (e.g. "Share this", "Read more").', 'text-to-audio' ); ?></p>
							<div class="av-chips" role="list"></div>
							<div class="av-chip-add">
								<input type="text" class="av-chip-input" placeholder="<?php echo esc_attr__( 'Add phrase…', 'text-to-audio' ); ?>" />
								<button type="button" class="av-btn av-btn--add-chip"><?php echo esc_html__( 'Add', 'text-to-audio' ); ?></button>
							</div>
						</div>
					</section>

					<!-- Step ⑦ Verify across posts — D14 -->
					<section class="av-step" data-step="verify">
						<div class="av-step__head">
							<span class="av-step__num">&#9317;</span>
							<strong><?php echo esc_html__( 'Verify across posts', 'text-to-audio' ); ?></strong>
						</div>
						<div class="av-step__body">
							<p class="av-hint"><?php echo esc_html__( 'Run the saved rule against a few random posts in the same scope. Catches brittle selectors before visitors hit a bad page.', 'text-to-audio' ); ?></p>
							<div class="av-verify-actions">
								<button type="button" class="av-btn av-btn--verify">
									&#9654; <?php echo esc_html__( 'Test rule across', 'text-to-audio' ); ?>
									<input type="number" class="av-verify-size" min="1" max="20" step="1" value="3" aria-label="<?php echo esc_attr__( 'Sample size', 'text-to-audio' ); ?>" />
									<?php echo esc_html__( 'posts', 'text-to-audio' ); ?>
								</button>
								<label class="av-verify-orderby-label">
									<?php echo esc_html__( 'Order:', 'text-to-audio' ); ?>
									<select class="av-verify-orderby" aria-label="<?php echo esc_attr__( 'Sample order', 'text-to-audio' ); ?>">
										<option value="rand"      selected><?php echo esc_html__( 'Random',       'text-to-audio' ); ?></option>
										<option value="date_desc"          ><?php echo esc_html__( 'Newest first', 'text-to-audio' ); ?></option>
										<option value="date_asc"           ><?php echo esc_html__( 'Oldest first', 'text-to-audio' ); ?></option>
									</select>
								</label>
								<span class="av-verify-status" aria-live="polite"></span>
							</div>
							<div class="av-verify-results" hidden></div>
						</div>
					</section>
				</div><!-- /.av-rail-panel__body -->

				<div class="av-rail-panel__footer">
					<span class="av-status" aria-live="polite"></span>
					<button type="button" class="av-btn av-btn--save" disabled>
						<?php echo esc_html__( 'Save', 'text-to-audio' ); ?>
					</button>
				</div>
				<div class="av-resize-handle av-resize-handle--edge"></div>
				<div class="av-resize-handle av-resize-handle--bottom"></div>
			</div><!-- /#av-rail-panel -->

			<!-- RIGHT: floating tab -->
			<button
				type="button"
				class="av-tab av-tab--right"
				aria-expanded="false"
				aria-controls="av-preview-panel"
				title="<?php echo esc_attr__( 'Preview extracted TTS content', 'text-to-audio' ); ?>"
			><span><?php echo esc_html__( 'Preview Content', 'text-to-audio' ); ?></span></button>

			<!-- RIGHT: draggable preview overlay -->
			<div id="av-preview-panel" class="av-preview-panel" hidden>
				<div class="av-preview-panel__handle" title="<?php echo esc_attr__( 'Drag to move', 'text-to-audio' ); ?>">
					<span class="av-preview-panel__title"><?php echo esc_html__( 'Content Preview', 'text-to-audio' ); ?></span>
					<span class="av-preview-panel__meta"></span>
					<button type="button" class="av-preview-panel__close" aria-label="<?php echo esc_attr__( 'Close preview', 'text-to-audio' ); ?>">&times;</button>
				</div>
				<div class="av-preview-panel__body">
					<p class="av-preview-panel__empty"><?php echo esc_html__( 'Pick a content region first — the extracted text will appear here.', 'text-to-audio' ); ?></p>
				</div>
				<div class="av-resize-handle av-resize-handle--left-edge"></div>
				<div class="av-resize-handle av-resize-handle--bottom"></div>
			</div><!-- /#av-preview-panel -->
		</div><!-- /#av-steprail-root -->
		<?php
	}

	// -----------------------------------------------------------------------
	// Common tag checkboxes for excl_tags step
	// -----------------------------------------------------------------------

	protected static function render_common_tag_checkboxes() {
		$tags = array( 'aside', 'figure', 'blockquote', 'pre', 'code', 'table', 'form', 'nav', 'footer', 'header' );
		$out  = '';
		foreach ( $tags as $tag ) {
			$id   = 'av-tag-' . $tag;
			$out .= '<label class="av-tag-check" for="' . esc_attr( $id ) . '">'
				. '<input type="checkbox" id="' . esc_attr( $id ) . '" value="' . esc_attr( $tag ) . '" checked />'
				. ' <code>' . esc_html( $tag ) . '</code></label>';
		}
		return $out;
	}

	// -----------------------------------------------------------------------
	// Admin dashboard launcher
	// -----------------------------------------------------------------------

	public static function maybe_render_dashboard_launcher() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || strpos( (string) $screen->id, 'text-to-audio' ) === false ) { return; }
		?>
		<div id="av-dashboard-launcher" style="display:none;">
			<input type="url" id="av-launcher-url" placeholder="<?php echo esc_attr__( 'Paste post URL to open picker…', 'text-to-audio' ); ?>" style="width:320px;" />
			<button type="button" id="av-launcher-go" class="button button-primary"><?php echo esc_html__( 'Open &amp; Pick', 'text-to-audio' ); ?></button>
		</div>
		<script>
		(function(){
			var wrap = document.getElementById('av-dashboard-launcher');
			var inp  = document.getElementById('av-launcher-url');
			var btn  = document.getElementById('av-launcher-go');
			if (!wrap || !btn) { return; }
			// Expose so dashboard React can mount it in the right slot.
			window.avLauncherEl = wrap;
			btn.addEventListener('click', function(){
				var url = (inp.value || '').trim();
				if (!url) { return; }
				var sep = url.indexOf('?') >= 0 ? '&' : '?';
				window.open(url + sep + '<?php echo esc_js( self::AUTO_PARAM ); ?>=1', '_blank');
			});
		})();
		</script>
		<?php
	}

	// -----------------------------------------------------------------------
	// Inline JS
	// -----------------------------------------------------------------------

	protected static function shell_js() {
		$path = defined( 'TTA_PLUGIN_PATH' )
			? TTA_PLUGIN_PATH . 'includes/atlasvoice/step-rail.shell.js'
			: dirname( __FILE__ ) . '/step-rail.shell.js';
		return file_exists( $path ) ? file_get_contents( $path ) : '/* step-rail.shell.js not found */';
	}

	// -----------------------------------------------------------------------
	// CSS
	// -----------------------------------------------------------------------

	protected static function shell_css() {
		return '
/* AtlasVoice Step Rail — front-end floating UI */
#av-steprail-root *{box-sizing:border-box;}

/* ── Floating tabs ─────────────────────────────────────────── */
.av-tab{
  position:fixed;top:50%;transform:translateY(-50%);
  z-index:2147483640;
  display:flex;align-items:center;justify-content:center;
  writing-mode:vertical-lr;text-orientation:mixed;
  padding:14px 8px!important;
  background:#184c53!important;color:#fff!important;
  border:0!important;border-radius:0;
  font:600 12px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
  cursor:pointer!important;letter-spacing:.06em!important;
  text-transform:none!important;text-shadow:none!important;text-decoration:none!important;
  transition:background .15s,box-shadow .15s;
  box-shadow:0 2px 12px rgba(0,0,0,.25);
}
.av-tab:hover{background:#1d6370!important;color:#fff!important;}
.av-tab--left{
  left:0;
  border-radius:0 6px 6px 0;
  transform:translateY(-50%);
}
.av-tab--right{
  right:0;
  border-radius:6px 0 0 6px;
  writing-mode:vertical-rl;
}
.av-tab[aria-expanded="true"]{background:#0d3038;}

/* ── Left sliding panel ─────────────────────────────────────── */
.av-rail-panel{
  position:fixed;left:0;top:0;height:100vh;width:300px;
  z-index:2147483641;
  background:#fff;
  box-shadow:4px 0 24px rgba(0,0,0,.18);
  display:flex;flex-direction:column;
  transform:translateX(-100%);
  transition:transform .25s cubic-bezier(.4,0,.2,1);
  overflow:hidden;
}
.av-rail-panel:not([hidden]){transform:translateX(0);}
.av-rail-panel[hidden]{display:flex!important;transform:translateX(-100%);}

.av-rail-panel__header{
  padding:12px 14px;
  background:#184c53;color:#fff;
  display:flex;align-items:center;justify-content:space-between;
  flex:none;
}
.av-rail-panel__title{font:600 14px/1.3 inherit;}
.av-rail-panel__close{
  background:transparent!important;border:0!important;color:#fff!important;
  font-size:20px!important;line-height:1!important;
  cursor:pointer!important;padding:2px 8px!important;
  text-shadow:none!important;font-family:inherit!important;
}

.av-rail-panel__body{
  flex:1;overflow-y:auto;padding:12px;
  display:flex;flex-direction:column;gap:10px;
}
.av-rail-panel__footer{
  padding:10px 12px;
  border-top:1px solid #e5e7eb;
  background:#f9fafb;
  display:flex;align-items:center;gap:8px;flex:none;
}

/* ── Steps ──────────────────────────────────────────────────── */
.av-step{
  border:1px solid #e5e7eb;border-radius:8px;
  background:#f9fafb;padding:10px 12px;
}
.av-step.is-active{background:#fff;border-color:#184c53;box-shadow:0 2px 8px rgba(24,76,83,.08);}
.av-step.is-done{background:#f0f7ed;border-color:#00a32a;}
.av-step.is-locked{opacity:.6;}
.av-step__head{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.av-step__num{font-size:18px;color:#184c53;line-height:1;}
.av-step.is-done .av-step__num{color:#00a32a;}
.av-step__head strong{flex:1;font-size:13px;}
.av-hint{margin:0 0 8px;font-size:12px;color:#6b7280;}
.av-status{flex:1;font-size:12px;color:#4b5563;}

/* ── Scope pills ─────────────────────────────────────────────── */
.av-scope-readout{
  margin:0;font-size:13px;color:#1d2327;font-weight:500;
  background:#eaf3f4;border-left:3px solid #184c53;
  padding:6px 10px;border-radius:3px;
}
.av-scope-readout .av-scope-readout__hint{
  display:block;font-size:11px;color:#6b7280;font-weight:400;margin-top:2px;
}
.av-scope-group{display:flex;flex-wrap:wrap;gap:6px;}
.av-scope-group label{
  display:inline-flex;align-items:center;gap:5px;
  padding:3px 10px;border:1px solid #d1d5db;border-radius:999px;
  background:#fff;cursor:pointer;font-size:12px;
}
.av-scope-group label.is-checked{border-color:#184c53;background:#eaf3f4;}
.av-scope-group label.is-disabled{opacity:.45;cursor:not-allowed;}

/* ── Region ──────────────────────────────────────────────────── */
.av-region-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
.av-word-count{font-size:11px;color:#6b7280;font-style:italic;}
.av-selector-display{
  display:flex;align-items:center;gap:6px;
  padding:6px 10px;background:#f3f4f6;border-radius:6px;font-size:12px;
}
.av-selector-value{flex:1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;}
.av-selector-input{border:0;background:transparent;outline:none;min-width:0;padding:0;font-size:12px;color:inherit;width:100%;}
.av-selector-input:focus{outline:1px dashed #184c53;border-radius:2px;}
.av-btn--clear-selector{background:transparent!important;border:0!important;cursor:pointer!important;color:#6b7280!important;font-size:16px!important;padding:0 4px!important;flex-shrink:0;text-shadow:none!important;}
.av-btn--clear-selector:hover{color:#b91c1c!important;background:transparent!important;}

/* ── Chips ──────────────────────────────────────────────────── */
.av-chips{display:flex;flex-wrap:wrap;gap:5px;margin:5px 0;min-height:18px;}
.av-chip{
  display:inline-flex;align-items:center;gap:3px;
  padding:2px 4px 2px 8px;border-radius:999px;font-size:11px;
  background:#eef2ff;border:1px solid #c7d2fe;color:#312e81;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
}
[data-chip-kind="excl_texts"] .av-chip{background:#fef3c7;border-color:#fde68a;color:#78350f;font-family:inherit;}
[data-chip-kind="excl_tags"]  .av-chip{background:#ecfdf5;border-color:#a7f3d0;color:#065f46;}
.av-chip button{background:transparent!important;border:0!important;cursor:pointer!important;color:inherit!important;font-size:13px!important;padding:0 3px!important;line-height:1!important;text-shadow:none!important;}
.av-chip button:hover{color:#b91c1c!important;background:transparent!important;}
.av-chip-add{display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;}
.av-chip-add .av-chip-input{flex:1;min-width:80px;font-size:12px;padding:4px 6px;border:1px solid #d1d5db;border-radius:4px;}
.av-chip-sep{font-size:11px;color:#9ca3af;}

/* ── Tag checkboxes ─────────────────────────────────────────── */
.av-tags-checkboxes{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;}
.av-tag-check{display:inline-flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;}
.av-tag-check code{font-size:11px;background:#f3f4f6;padding:1px 4px;border-radius:3px;}

/* ── Pro pill ───────────────────────────────────────────────── */
.av-pro-pill{
  display:inline-block;font-size:10px;font-weight:700;
  letter-spacing:.04em;text-transform:uppercase;
  background:#7c3aed;color:#fff;border-radius:3px;
  padding:1px 6px;line-height:1.6;vertical-align:middle;
}
.av-pro-pill[hidden]{display:none !important;}

/* ── Buttons ────────────────────────────────────────────────── */
/* Theme-defensive: aggressive themes (Avada, Divi, etc.) ship rules
   like `button { color:#fff !important }` that bleed into our buttons
   and turn text white-on-white. Override the bleed-prone properties
   with !important so the rail UI stays legible across themes.
   The dark-bg variants below also use !important on color so they
   are not dragged back to the default by the rule above. */
.av-btn{
  font-size:12px!important;padding:5px 12px!important;
  border-radius:5px!important;border:1px solid #d1d5db!important;
  background:#fff!important;color:#111!important;
  cursor:pointer!important;display:inline-flex!important;
  align-items:center!important;gap:5px!important;
  transition:background .12s,border-color .12s;white-space:nowrap!important;
  text-transform:none!important;letter-spacing:0!important;
  text-shadow:none!important;font-family:inherit!important;
  font-weight:500!important;line-height:1.4!important;
  text-decoration:none!important;
}
.av-btn:hover{background:#f3f4f6!important;color:#111!important;}
.av-btn--save{
  background:#184c53!important;color:#fff!important;border-color:#184c53!important;
  margin-left:auto;font-size:13px!important;padding:6px 18px!important;
}
.av-btn--save:hover:not(:disabled){background:#1d6370!important;color:#fff!important;}
.av-btn--save:disabled{opacity:.45;cursor:not-allowed!important;}
.av-btn--pick.is-active,.av-btn--pick-excl.is-active,
.av-btn--select.is-active{
  background:#184c53!important;color:#fff!important;border-color:#184c53!important;
}
.av-btn--select-excl.is-active{
  background:#b91c1c!important;color:#fff!important;border-color:#b91c1c!important;
}
/* While drag-mode is on, hint at it via the page cursor. */
body.av-select-mode,
body.av-select-mode * {cursor:text!important;}
body.av-select-mode-excl,
body.av-select-mode-excl * {cursor:text!important;}

/* ── Right preview panel ────────────────────────────────────── */
.av-preview-panel{
  position:fixed;right:44px;top:80px;
  width:340px;max-height:70vh;
  z-index:2147483641;
  background:#fff;border-radius:10px;
  box-shadow:0 8px 32px rgba(0,0,0,.22);
  display:flex;flex-direction:column;
  overflow:hidden;
  user-select:none;
}
.av-preview-panel[hidden]{display:none!important;}
.av-preview-panel__handle{
  padding:10px 14px;
  background:#184c53;color:#fff;
  display:flex;align-items:center;gap:8px;
  cursor:grab;flex:none;
}
.av-preview-panel__handle:active{cursor:grabbing;}
.av-preview-panel__title{font:600 13px/1.3 inherit;flex:1;}
.av-preview-panel__meta{font-size:11px;color:rgba(255,255,255,.7);}
.av-preview-panel__close{
  background:transparent!important;border:0!important;color:#fff!important;
  font-size:18px!important;line-height:1!important;
  cursor:pointer!important;padding:0 4px!important;
  text-shadow:none!important;font-family:inherit!important;
}
.av-preview-panel__body{
  flex:1;overflow-y:auto;padding:14px;
  font-size:13px;line-height:1.65;color:#374151;
  user-select:text;
}
.av-preview-panel__empty{color:#9ca3af;font-style:italic;margin:0;}

/* ── Resize handles ─────────────────────────────────────────── */
.av-resize-handle{position:absolute;z-index:10;background:transparent;}
/* Right-edge handle — width resize (rail panel, left-anchored) */
.av-resize-handle--edge{
  top:0;right:0;bottom:0;
  width:5px;height:100%;
  cursor:ew-resize;
}
.av-resize-handle--edge:hover{background:rgba(24,76,83,.12);}
/* Left-edge handle — width resize (preview panel, right-anchored; expands leftward) */
.av-resize-handle--left-edge{
  top:0;left:0;right:auto;bottom:0;
  width:5px;height:100%;
  cursor:ew-resize;
}
.av-resize-handle--left-edge:hover{background:rgba(24,76,83,.12);}
/* Bottom-edge handle — height resize (preview panel) */
.av-resize-handle--bottom{
  left:0;right:0;bottom:0;
  width:100%;height:5px;
  cursor:ns-resize;
}
.av-resize-handle--bottom:hover{background:rgba(24,76,83,.12);}

/* ── Floating (dragged) panel state ────────────────────────── */
/* Once dragged, the panel is free-floating — no slide transition,
   no edge-anchor. Hidden state uses display:none instead of
   the transform-based off-screen trick. */
.av-panel--floating{transition:none!important;transform:none!important;}
.av-panel--floating[hidden]{display:none!important;}
/* Snap-to-edge hint while dragging near the close edge. Visual cue that
   releasing now will collapse the panel to its floating tab. */
.av-panel--snap-hint{
  outline:3px dashed #f59e0b!important;
  outline-offset:-3px!important;
  opacity:.78;
}
/* Make both panel headers feel grab-able */
.av-rail-panel__header{cursor:grab;}
.av-rail-panel__header:active{cursor:grabbing;}

/* ── Picker highlight on page elements ─────────────────────── */
.av-picker-hover{
  outline:2px solid #184c53!important;
  outline-offset:2px!important;
  cursor:crosshair!important;
}
.av-picker-selected{
  outline:3px solid #00a32a!important;
  outline-offset:2px!important;
  background:rgba(0,163,42,.06)!important;
}
.av-picker-exclude-hover{
  outline:2px solid #b91c1c!important;
  outline-offset:2px!important;
  cursor:crosshair!important;
}
.av-picker-excluded{
  outline:3px solid #b91c1c!important;
  outline-offset:2px!important;
  background:rgba(185,28,28,.06)!important;
}
/* Transient highlights shown WHILE the admin is dragging in select-mode.
   Lighter than the committed selected/excluded styles so they read as
   "preview, will commit on release". Removed on mouseup or on Esc. */
.av-picker-touch-include{
  outline:2px dashed #00a32a!important;
  outline-offset:2px!important;
  background:rgba(0,163,42,.04)!important;
}
.av-picker-touch-exclude{
  outline:2px dashed #b91c1c!important;
  outline-offset:2px!important;
  background:rgba(185,28,28,.04)!important;
}

/* ── Verify across posts (D14) ──────────────────────────────── */
.av-verify-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.av-verify-size{
  width:48px;font:inherit;padding:1px 4px;border:1px solid #d1d5db;
  border-radius:3px;background:#fff;text-align:center;
}
.av-verify-orderby-label{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#374151;}
.av-verify-orderby{
  font:inherit;padding:1px 4px;border:1px solid #d1d5db;
  border-radius:3px;background:#fff;font-size:12px;
}
.av-btn--verify.is-running{opacity:.6;cursor:progress;}
.av-verify-status{font-size:11px;color:#6b7280;}
.av-verify-results{
  margin-top:10px;border:1px solid #e5e7eb;border-radius:5px;overflow:hidden;
}
.av-verify-row{
  display:grid;grid-template-columns:18px 1fr auto;gap:8px;align-items:center;
  padding:6px 8px;font-size:12px;border-bottom:1px solid #f3f4f6;
}
.av-verify-row:last-child{border-bottom:0;}
.av-verify-row__icon{font-size:14px;line-height:1;}
.av-verify-row__icon.is-pass{color:#15803d;}
.av-verify-row__icon.is-fail{color:#b91c1c;}
.av-verify-row__title{
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#111;
}
.av-verify-row__title a{color:inherit;text-decoration:none;}
.av-verify-row__title a:hover{text-decoration:underline;}
.av-verify-row__count{color:#6b7280;font-variant-numeric:tabular-nums;}
.av-verify-summary{
  padding:6px 8px;background:#f9fafb;font-size:11px;color:#374151;
  border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;
}
';
	}

	protected static function version() {
		return defined( 'TEXT_TO_AUDIO_VERSION' ) ? (string) TEXT_TO_AUDIO_VERSION : '1.0.0';
	}
}
