<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice per-post rules meta box row (TTS-238 v5 §5.7 / D7).
 *
 * Hooks into the existing AtlasVoice meta box via
 * `tts_after_metabox_content` (same action AuthVariantsMetaBox uses) so
 * we don't have to touch the legacy TTA_Hooks renderer. Adds:
 *
 *   - A "Rule scope" section header with precedence breadcrumbs. Each
 *     breadcrumb row shows the rule layer (post / post-type / language
 *     / post-type+language / global), its current selector value, and
 *     whether that row is the winner (green check) or is overridden by
 *     a higher-priority row (dimmed).
 *
 *   - A "Per-post selector override" text field (Pro only). Editors can
 *     type / paste a CSS selector that beats the rest of the chain.
 *
 *   - A "Clear override" checkbox that, when submitted, removes the
 *     per-post meta so the post inherits from the post-type layer again.
 *
 *   - An inline "Pro feature" pill + upsell copy on Free installs — the
 *     breadcrumbs are still visible so Free users understand the
 *     precedence model, but the override field is replaced with a
 *     locked-badge placeholder.
 *
 * Persistence is handed off to PerPostRules::set/clear so the dirty
 * bridge + snapshot wiring fire uniformly whether the write came from
 * the meta box, the REST layer, or a future migration script.
 *
 * Security:
 *   - nonce field `tta_atlasvoice_post_rules_nonce` on the form.
 *   - `edit_post` capability check on save.
 *   - selector sanitised in PerPostRules::sanitise; invalid inputs
 *     fall back to the empty-override shape rather than throwing.
 */
class PerPostRulesMetaBox {

	const NONCE_ACTION = 'tta_atlasvoice_post_rules_save';
	const NONCE_FIELD  = 'tta_atlasvoice_post_rules_nonce';

	const INPUT_SELECTOR = 'tta_atlasvoice_post_selector';
	const INPUT_CLEAR    = 'tta_atlasvoice_post_clear';

	/** Hook into the meta-box renderer + save_post. */
	public static function register() {
		add_action( 'tts_after_metabox_content', array( __CLASS__, 'render' ), 30 );
		add_action( 'save_post', array( __CLASS__, 'save' ), 20, 1 );
	}

	/**
	 * Render the row. Reads the post id defensively so this works in
	 * both the classic editor (where `get_the_ID()` is populated) and
	 * the "add new" transition where it isn't.
	 */
	public static function render() {
		if ( ! class_exists( '\\TTA\\AtlasVoice\\RuleResolver' ) ) { return; }

		$post_id = (int) get_the_ID();
		if ( $post_id <= 0 && isset( $_GET['post'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$post_id = (int) $_GET['post']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}
		if ( $post_id <= 0 ) { return; }

		$crumbs    = RuleResolver::breadcrumbs( $post_id );
		$available = class_exists( '\\TTA\\AtlasVoice\\PerPostRules' ) && PerPostRules::available();
		$override  = $available ? PerPostRules::get( $post_id ) : array();
		$current   = isset( $override['selector'] ) ? (string) $override['selector'] : '';

		?>
		<div class="tta_atlasvoice_rule_scope_row" style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
			<strong style="display:block;margin-bottom:4px;">
				<?php echo esc_html__( 'Rule scope', 'text-to-audio' ); ?>
				<?php if ( ! $available ) : ?>
					<span
						class="tta_av_pro_pill"
						style="background:#2271b1;color:#fff;font-size:10px;padding:1px 6px;border-radius:999px;vertical-align:middle;margin-left:4px;"
					><?php echo esc_html__( 'Pro', 'text-to-audio' ); ?></span>
				<?php endif; ?>
			</strong>
			<small style="display:block;color:#555;margin-bottom:8px;">
				<?php echo esc_html__(
					'Shows which rule layer drives audio extraction for this post. Higher rows beat lower rows.',
					'text-to-audio'
				); ?>
			</small>

			<?php wp_nonce_field( self::NONCE_ACTION, self::NONCE_FIELD ); ?>

			<ol class="tta_av_breadcrumbs" style="margin:0 0 10px 0;padding:0;list-style:none;">
				<?php foreach ( $crumbs as $c ) :
					$applies    = ! empty( $c['applies'] );
					$overridden = ! empty( $c['overridden'] );
					$selector   = (string) $c['selector'];
					$label      = (string) $c['label'];
					$style      = 'padding:4px 6px;border-left:3px solid ';
					$style     .= $applies ? '#00a32a' : ( $overridden ? '#c7c7c7' : '#dcdcde' );
					$style     .= ';margin:2px 0;background:' . ( $applies ? '#f0f7ed' : '#fafafa' ) . ';';
					$style     .= $overridden ? 'opacity:0.65;text-decoration:line-through #c7c7c7;' : '';
				?>
					<li style="<?php echo esc_attr( $style ); ?>">
						<span style="font-weight:<?php echo $applies ? '600' : '400'; ?>;">
							<?php echo esc_html( $label ); ?>
						</span>
						<?php if ( $selector !== '' ) : ?>
							<code style="margin-left:6px;background:transparent;"><?php echo esc_html( $selector ); ?></code>
						<?php else : ?>
							<em style="color:#999;margin-left:6px;"><?php echo esc_html__( '(unset)', 'text-to-audio' ); ?></em>
						<?php endif; ?>
						<?php if ( $applies ) : ?>
							<span style="float:right;color:#00a32a;" title="<?php echo esc_attr__( 'Active rule', 'text-to-audio' ); ?>">&#10003;</span>
						<?php elseif ( $overridden ) : ?>
							<span style="float:right;color:#888;" title="<?php echo esc_attr__( 'Overridden by a higher-priority rule', 'text-to-audio' ); ?>">&#8964;</span>
						<?php endif; ?>
					</li>
				<?php endforeach; ?>
			</ol>

			<?php if ( $available ) : ?>
				<label for="<?php echo esc_attr( self::INPUT_SELECTOR ); ?>" style="display:block;margin-top:8px;font-weight:600;">
					<?php echo esc_html__( 'Per-post selector override', 'text-to-audio' ); ?>
				</label>
				<input
					type="text"
					id="<?php echo esc_attr( self::INPUT_SELECTOR ); ?>"
					name="<?php echo esc_attr( self::INPUT_SELECTOR ); ?>"
					value="<?php echo esc_attr( $current ); ?>"
					placeholder="<?php echo esc_attr__( 'e.g. .entry-content, #story-body', 'text-to-audio' ); ?>"
					style="width:100%;margin-top:4px;"
				/>
				<label style="display:block;margin-top:6px;font-weight:normal;color:#555;">
					<input type="checkbox" name="<?php echo esc_attr( self::INPUT_CLEAR ); ?>" value="1" />
					<?php echo esc_html__( 'Clear per-post override (inherit from higher layers)', 'text-to-audio' ); ?>
				</label>
			<?php else : ?>
				<div
					class="tta_av_pro_upsell"
					style="padding:8px;background:#fafafa;border:1px dashed #dcdcde;border-radius:4px;color:#555;"
				>
					<?php echo esc_html__(
						'Upgrade to Pro to set a per-post selector override that beats the global and post-type layers.',
						'text-to-audio'
					); ?>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Persist the submitted override / clear. Standard WP guards
	 * (nonce, autosave, cap). Only fires the PerPostRules write when
	 * Pro is active — Free installs can't produce a save payload in
	 * the first place because the field isn't rendered.
	 *
	 * @param int $post_id
	 */
	public static function save( $post_id ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return; }
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) { return; }
		if ( ! isset( $_POST[ self::NONCE_FIELD ] ) ) { return; }
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ self::NONCE_FIELD ] ) ), self::NONCE_ACTION ) ) { return; }
		if ( ! current_user_can( 'edit_post', $post_id ) ) { return; }
		if ( wp_is_post_revision( $post_id ) ) { return; }
		if ( ! class_exists( '\\TTA\\AtlasVoice\\PerPostRules' ) ) { return; }
		if ( ! PerPostRules::available() ) { return; }

		if ( ! empty( $_POST[ self::INPUT_CLEAR ] ) ) {
			PerPostRules::clear( $post_id );
			return;
		}

		$raw = isset( $_POST[ self::INPUT_SELECTOR ] )
			? wp_unslash( $_POST[ self::INPUT_SELECTOR ] )
			: '';
		$raw = is_string( $raw ) ? trim( $raw ) : '';
		if ( $raw === '' ) {
			// Empty submission with the clear checkbox unchecked is a
			// no-op — we don't want a blur event to silently wipe
			// the override. Admins must explicitly check "Clear".
			return;
		}
		PerPostRules::set( $post_id, array( 'selector' => $raw ) );
	}
}
