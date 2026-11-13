<?php
/**
 * The optional line that tells listeners the voice is made by AI.
 *
 * @package TTA
 */

namespace TTA\Player;

defined( 'ABSPATH' ) || exit;

/**
 * Reads, saves and prints the AI notice.
 *
 * It is off until the site owner turns it on, so a site that updates sees
 * no change. The settings are one small option of their own
 * (`tta_ai_notice_settings`); no other stored setting is touched.
 *
 * The notice is plain text next to the player, so screen readers read it
 * in order with the rest of the page. An empty text means "the default
 * sentence", which is shown in the language of the page being viewed.
 *
 * The admin screen (REST), `wp atlasvoice ai-notice` and an MCP server all
 * act here (TTS-376). The player markup asks html() for the line.
 */
class AI_Notice {

	const OPTION = 'tta_ai_notice_settings';

	const POSITIONS = array( 'before', 'after' );

	/**
	 * The longest notice. It is one line under or over the player.
	 */
	const TEXT_LENGTH = 200;

	/**
	 * The sentence used while the owner has not written one.
	 *
	 * @return string
	 */
	public static function default_text() {
		return __( 'This article is read by an AI-generated voice.', 'text-to-audio' );
	}

	/**
	 * The settings.
	 *
	 * @return array{enabled:bool, text:string, position:string, default_text:string}
	 */
	public static function get() {
		$stored = get_option( self::OPTION, array() );
		$stored = is_object( $stored ) ? get_object_vars( $stored ) : (array) $stored;

		$text     = isset( $stored['text'] ) && is_string( $stored['text'] ) ? sanitize_text_field( $stored['text'] ) : '';
		$position = isset( $stored['position'] ) && in_array( $stored['position'], self::POSITIONS, true ) ? $stored['position'] : 'after';

		return array(
			'enabled'      => ! empty( $stored['enabled'] ),
			'text'         => $text,
			'position'     => $position,
			'default_text' => self::default_text(),
		);
	}

	/**
	 * Saves the parts that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of: enabled, text, position.
	 *
	 * @return array|\WP_Error The settings after the save, or why nothing was saved.
	 */
	public static function save( array $fields ) {
		$clean = self::validate( $fields );
		if ( is_wp_error( $clean ) ) {
			return $clean;
		}

		if ( ! $clean ) {
			return new \WP_Error(
				'atlasvoice_nothing_to_save',
				__( 'Nothing to save.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$current = self::get();
		unset( $current['default_text'] );

		update_option( self::OPTION, array_replace( $current, $clean ) );

		return self::get();
	}

	/**
	 * Checks what was sent. Unknown names are an error, so a typing mistake
	 * in a script is noticed instead of silently ignored.
	 *
	 * @param array $fields What was sent.
	 *
	 * @return array|\WP_Error The clean values.
	 */
	public static function validate( array $fields ) {
		$clean = array();

		foreach ( $fields as $name => $value ) {
			switch ( $name ) {
				case 'enabled':
					$flag = self::to_bool( $value );
					if ( null === $flag ) {
						return self::invalid( $name, __( 'This must be on or off.', 'text-to-audio' ) );
					}
					$clean[ $name ] = $flag;
					break;

				case 'text':
					if ( ! is_string( $value ) ) {
						return self::invalid( $name, __( 'The notice must be text.', 'text-to-audio' ) );
					}
					$text = sanitize_text_field( $value );
					if ( mb_strlen( $text ) > self::TEXT_LENGTH ) {
						return self::invalid(
							$name,
							sprintf(
								/* translators: %d: the largest number of characters. */
								__( 'The notice can be %d characters at most.', 'text-to-audio' ),
								self::TEXT_LENGTH
							)
						);
					}
					// The default sentence is stored as "no text", so it stays translated.
					$clean[ $name ] = self::default_text() === $text ? '' : $text;
					break;

				case 'position':
					if ( ! in_array( $value, self::POSITIONS, true ) ) {
						return self::invalid( $name, __( 'The position must be before or after.', 'text-to-audio' ) );
					}
					$clean[ $name ] = $value;
					break;

				default:
					return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}//end switch
		}//end foreach

		return $clean;
	}

	/**
	 * Puts the notice above or below the markup of a player.
	 *
	 * @param string $player The markup of one player.
	 *
	 * @return string The markup, with the notice when it is turned on.
	 */
	public static function add_to( $player ) {
		$settings = self::get();
		if ( ! $settings['enabled'] ) {
			return $player;
		}

		$text = '' !== $settings['text'] ? $settings['text'] : $settings['default_text'];

		/**
		 * Filters the text of the AI notice, for example to say it per post type.
		 * An empty text prints no notice.
		 *
		 * @param string $text     The notice.
		 * @param array  $settings enabled, text, position, default_text.
		 */
		$text = (string) apply_filters( 'atlasvoice_ai_notice_text', $text, $settings );
		if ( '' === trim( $text ) ) {
			return $player;
		}

		// A div and inline style only: the player markup is filtered to a short list of tags.
		$notice = '<div class="atlasvoice-ai-notice" style="margin:6px 0;font-size:13px;line-height:1.4;opacity:.8;">' . esc_html( $text ) . '</div>';

		return 'before' === $settings['position'] ? $notice . $player : $player . $notice;
	}

	/**
	 * On or off, from the forms a script or a screen sends.
	 *
	 * @param mixed $value What was sent.
	 *
	 * @return bool|null Null when it is neither.
	 */
	private static function to_bool( $value ) {
		if ( is_bool( $value ) ) {
			return $value;
		}

		$text = is_scalar( $value ) ? strtolower( trim( (string) $value ) ) : '';

		if ( in_array( $text, array( '1', 'true', 'on', 'yes' ), true ) ) {
			return true;
		}

		return in_array( $text, array( '0', 'false', 'off', 'no' ), true ) ? false : null;
	}

	/**
	 * An error for one field.
	 *
	 * @param string $field   Field name.
	 * @param string $message What is wrong.
	 *
	 * @return \WP_Error
	 */
	private static function invalid( $field, $message ) {
		return new \WP_Error(
			'atlasvoice_invalid_ai_notice',
			$message,
			array(
				'status' => 400,
				'field'  => sanitize_key( $field ),
			)
		);
	}
}
