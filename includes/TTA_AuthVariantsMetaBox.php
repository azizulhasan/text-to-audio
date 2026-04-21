<?php

namespace TTA;

/**
 * AtlasVoice Auth-Variant Meta Box row (TTS-238 C6b).
 *
 * Appends a small "Audio variant" section to the existing AtlasVoice meta
 * box in the post editor. Admins use it to pin which auth bucket this
 * post's MP3 should match:
 *
 *   ○ Auto (use detected)   — default. The engine picks per the verdict.
 *   ○ Logged-out readers    — always render the logged-out extraction.
 *   ○ Logged-in readers     — always render the logged-in extraction.
 *   ○ Both                  — cache two MP3s, serve the matching one.
 *
 * When the detector (TTA_AuthVariants::get_verdict) reports `differs`,
 * we surface an inline hint explaining that we detected extra/missing
 * content between buckets, so the admin understands why they might want
 * to switch from Auto to a pinned variant.
 *
 * Self-registering: the class hooks into `tts_after_metabox_content`
 * (already fired inside `TTA_Hooks::atlasVoice_meta_box()`) and into
 * `save_post` for persistence. No changes to TTA_Hooks needed.
 */
class TTA_AuthVariantsMetaBox {

	const NONCE_ACTION = 'tta_auth_variant_save';
	const NONCE_FIELD  = 'tta_auth_variant_nonce';
	const INPUT_NAME   = 'tta_auth_variant';

	/**
	 * Wire into WordPress. Safe to call on every request — the renderer
	 * is gated on current_screen being post-edit, and the saver is
	 * gated on $_POST containing our nonce.
	 */
	public static function register() {
		add_action( 'tts_after_metabox_content', array( __CLASS__, 'render' ), 20 );
		add_action( 'save_post', array( __CLASS__, 'save' ), 20, 1 );
	}

	/**
	 * Render the radio row. Reads the current pin + verdict from
	 * TTA_AuthVariants and escapes everything it prints.
	 */
	public static function render() {
		if ( ! class_exists( '\\TTA\\TTA_AuthVariants' ) ) { return; }
		$post_id = (int) get_the_ID();
		if ( $post_id <= 0 ) {
			// Fallback to $_GET['post'] — classic editor new-post screen.
			if ( isset( $_GET['post'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$post_id = (int) $_GET['post']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			}
		}
		if ( $post_id <= 0 ) { return; }

		$desc    = \TTA\TTA_AuthVariants::describe( $post_id );
		$current = isset( $desc['variant'] ) ? (string) $desc['variant'] : '';
		$verdict = isset( $desc['verdict'] ) ? (string) $desc['verdict'] : 'unknown';
		$samples = isset( $desc['samples'] ) ? (array) $desc['samples'] : array();

		// Count per-bucket samples for the admin-friendly summary.
		$count_lo = 0;
		$count_li = 0;
		foreach ( $samples as $s ) {
			if ( ! is_array( $s ) ) { continue; }
			$b = isset( $s['bucket'] ) ? (string) $s['bucket'] : '';
			if ( $b === \TTA\TTA_AuthVariants::VARIANT_LOGGED_OUT ) { $count_lo++; }
			elseif ( $b === \TTA\TTA_AuthVariants::VARIANT_LOGGED_IN ) { $count_li++; }
		}

		$verdict_hint = '';
		if ( $verdict === 'differs' ) {
			$verdict_hint = __(
				'Logged-in users see different content on this post. Consider pinning the variant below so visitors hear the right audio.',
				'text-to-audio'
			);
		} elseif ( $verdict === 'same' ) {
			$verdict_hint = __(
				'Content appears identical for logged-in and logged-out readers — Auto is the safe default.',
				'text-to-audio'
			);
		} else {
			$verdict_hint = __(
				'Not enough samples yet to compare auth states. Once visitors listen, we\'ll detect whether variants differ.',
				'text-to-audio'
			);
		}

		?>
		<div class="tta_auth_variant_row" style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
			<strong style="display:block;margin-bottom:4px;">
				<?php echo esc_html__( 'Audio variant (beta)', 'text-to-audio' ); ?>
			</strong>
			<small style="display:block;color:#555;margin-bottom:8px;">
				<?php echo esc_html( $verdict_hint ); ?>
			</small>
			<?php wp_nonce_field( self::NONCE_ACTION, self::NONCE_FIELD ); ?>
			<?php
			$options = array(
				''                                          => __( 'Auto (use detected)', 'text-to-audio' ),
				\TTA\TTA_AuthVariants::VARIANT_LOGGED_OUT   => __( 'Logged-out readers', 'text-to-audio' ),
				\TTA\TTA_AuthVariants::VARIANT_LOGGED_IN    => __( 'Logged-in readers', 'text-to-audio' ),
				\TTA\TTA_AuthVariants::VARIANT_BOTH         => __( 'Both (render two MP3s)', 'text-to-audio' ),
			);
			foreach ( $options as $value => $label ) {
				$id = 'tta_auth_variant_' . ( $value !== '' ? $value : 'auto' );
				?>
				<label style="display:block;margin:2px 0;font-weight:normal;">
					<input
						type="radio"
						name="<?php echo esc_attr( self::INPUT_NAME ); ?>"
						id="<?php echo esc_attr( $id ); ?>"
						value="<?php echo esc_attr( $value ); ?>"
						<?php checked( $current, $value ); ?>
					/>
					<?php echo esc_html( $label ); ?>
				</label>
				<?php
			}
			?>
			<small style="display:block;color:#888;margin-top:6px;">
				<?php
				/* translators: 1: logged-out sample count; 2: logged-in sample count. */
				echo esc_html( sprintf(
					__( 'Samples collected: %1$d logged-out, %2$d logged-in.', 'text-to-audio' ),
					$count_lo,
					$count_li
				) );
				?>
			</small>
		</div>
		<?php
	}

	/**
	 * Persist the submitted radio value. Follows WP's meta-box best
	 * practices: nonce verify, skip autosaves, cap check, validate
	 * against the allowed variant set.
	 *
	 * @param int $post_id
	 */
	public static function save( $post_id ) {
		if ( ! class_exists( '\\TTA\\TTA_AuthVariants' ) ) { return; }
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) { return; }

		// Early exits — each one is a standard WP meta-box guard.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) { return; }
		if ( ! isset( $_POST[ self::NONCE_FIELD ] ) ) { return; }
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ self::NONCE_FIELD ] ) ), self::NONCE_ACTION ) ) { return; }
		if ( ! current_user_can( 'edit_post', $post_id ) ) { return; }
		if ( wp_is_post_revision( $post_id ) ) { return; }

		$raw = isset( $_POST[ self::INPUT_NAME ] ) ? wp_unslash( $_POST[ self::INPUT_NAME ] ) : '';
		$val = is_string( $raw ) ? sanitize_key( $raw ) : '';
		// Empty string is meaningful — it clears the pin. set_variant
		// already validates against the allowed set; an invalid POST
		// (e.g. a malicious banana value) is simply ignored.
		\TTA\TTA_AuthVariants::set_variant( $post_id, $val );
	}
}
