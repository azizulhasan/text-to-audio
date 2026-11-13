<?php
/**
 * Which text of a post is read aloud.
 *
 * @package TTA
 */

namespace TTA\Content;

use TTA\Settings\Settings_Store;
use TTA\TTA_Cache;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves what is read aloud besides the post content: the title,
 * the excerpt, a sentence before and after, and a few advanced switches.
 *
 * Nothing new is stored. Each part is a field of `tta_settings_data` that
 * the classic Settings screen already saves, in the same format, so both
 * screens can be used on the same site. fields() is the one list of those
 * parts: the REST route, `wp atlasvoice text` and the checks are built
 * from it.
 *
 * Two parts ("numbers" and "as_seen") only have an effect with a player
 * that applies them, which today is AtlasVoice Pro. That plugin says so
 * through the `atlasvoice_text_extras` filter; the screen then shows them.
 *
 * The admin screen (REST), WP-CLI and an MCP server all act here (TTS-376).
 */
class Text {

	const OPTION = 'tta_settings_data';

	/**
	 * The longest sentence before or after the post.
	 */
	const TEXT_LENGTH = 1000;

	/**
	 * Every part.
	 *
	 * The default of a part is what the player does when the site never
	 * saved it, so the screen shows what visitors hear.
	 *
	 * @return array<string, array{stored:string, type:string, default:mixed, extra?:bool, description:string}>
	 */
	public static function fields() {
		return array(
			'title'         => array(
				'stored'      => 'tta__settings_add_post_title_to_read',
				'type'        => 'bool',
				'default'     => true,
				'description' => __( 'Read the title of the post before its content.', 'text-to-audio' ),
			),
			'excerpt'       => array(
				'stored'      => 'tta__settings_add_post_excerpt_to_read',
				'type'        => 'bool',
				'default'     => false,
				'description' => __( 'Read the excerpt of the post after the title.', 'text-to-audio' ),
			),
			'intro'         => array(
				'stored'      => 'tta__settings_text_before_content',
				'type'        => 'text',
				'default'     => '',
				'description' => __( 'A sentence read before every post. Empty reads nothing extra.', 'text-to-audio' ),
			),
			'outro'         => array(
				'stored'      => 'tta__settings_text_after_content',
				'type'        => 'text',
				'default'     => '',
				'description' => __( 'A sentence read after every post. Empty reads nothing extra.', 'text-to-audio' ),
			),
			'numbers'       => array(
				'stored'      => 'tta__settings_apply_number_format',
				'type'        => 'bool',
				'default'     => false,
				'extra'       => true,
				'description' => __( 'Say numbers as words. It needs a player that applies it; see "extras_available".', 'text-to-audio' ),
			),
			'as_seen'       => array(
				'stored'      => 'tta__settings_read_content_from_dom',
				'type'        => 'bool',
				'default'     => false,
				'extra'       => true,
				'description' => __( 'Read the page as the visitor sees it, for page builders or translation plugins that change the text after the page loads. It needs a player that applies it; see "extras_available".', 'text-to-audio' ),
			),
			'wrapper'       => array(
				'stored'      => 'tta__settings_emit_legacy_wrapper',
				'type'        => 'bool',
				'default'     => true,
				'description' => __( 'Wrap the post content in an extra element that marks what is read. Turn it off only when it breaks the layout of the theme.', 'text-to-audio' ),
			),
			'status_column' => array(
				'stored'      => 'tta__settings_enable_tts_status',
				'type'        => 'bool',
				'default'     => false,
				'description' => __( 'Show an audio status column in the list of posts in the admin.', 'text-to-audio' ),
			),
		);
	}

	/**
	 * The settings.
	 *
	 * @return array<string, bool|string> Each part of fields(), plus extras_available.
	 */
	public static function get() {
		$stored = get_option( self::OPTION, array() );
		$stored = is_object( $stored ) ? get_object_vars( $stored ) : ( is_array( $stored ) ? $stored : array() );
		$text   = array();

		foreach ( self::fields() as $name => $field ) {
			$has = array_key_exists( $field['stored'], $stored );

			if ( 'bool' === $field['type'] ) {
				$text[ $name ] = $has ? ! empty( $stored[ $field['stored'] ] ) : $field['default'];
			} else {
				$text[ $name ] = $has && is_string( $stored[ $field['stored'] ] ) ? sanitize_textarea_field( $stored[ $field['stored'] ] ) : $field['default'];
			}
		}

		/**
		 * Filters whether a player on this site applies "numbers" and "as_seen".
		 *
		 * @param bool $available False in the free plugin: its players do not apply them.
		 */
		$text['extras_available'] = (bool) apply_filters( 'atlasvoice_text_extras', false );

		return $text;
	}

	/**
	 * Saves the parts that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of the parts of fields().
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

		$all      = self::fields();
		$incoming = array();
		foreach ( $clean as $name => $value ) {
			$incoming[ $all[ $name ]['stored'] ] = $value;
		}

		$settings = Settings_Store::prepare( self::OPTION, (object) $incoming );
		if ( is_wp_error( $settings ) ) {
			return $settings;
		}

		update_option( self::OPTION, $settings );
		TTA_Cache::delete( 'all_settings' );

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
		$all   = self::fields();
		$clean = array();

		foreach ( $fields as $name => $value ) {
			if ( ! is_string( $name ) || ! isset( $all[ $name ] ) ) {
				return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}

			if ( 'bool' === $all[ $name ]['type'] ) {
				$flag = self::to_bool( $value );
				if ( null === $flag ) {
					return self::invalid( $name, __( 'This must be on or off.', 'text-to-audio' ) );
				}
				$clean[ $name ] = $flag;
				continue;
			}

			if ( ! is_string( $value ) ) {
				return self::invalid( $name, __( 'This must be text.', 'text-to-audio' ) );
			}

			// It is spoken, never shown: plain text only.
			$text = sanitize_textarea_field( $value );
			if ( mb_strlen( $text ) > self::TEXT_LENGTH ) {
				return self::invalid(
					$name,
					sprintf(
						/* translators: %d: the largest number of characters. */
						__( 'This text can be %d characters at most.', 'text-to-audio' ),
						self::TEXT_LENGTH
					)
				);
			}
			$clean[ $name ] = $text;
		}//end foreach

		return $clean;
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
			'atlasvoice_invalid_text_setting',
			$message,
			array(
				'status' => 400,
				'field'  => sanitize_key( $field ),
			)
		);
	}
}
