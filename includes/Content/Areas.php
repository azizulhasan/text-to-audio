<?php
/**
 * Which part of a page is read aloud.
 *
 * @package TTA
 */

namespace TTA\Content;

use TTA\Settings\Settings_Store;
use TTA\TTA_Cache;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves the reading rule of the whole site, and lists the rules
 * of single content types.
 *
 * Nothing new is stored. The whole-site rule is four fields of
 * `tta_settings_data` that the on-page picker and the classic screen
 * already save, in the same format:
 *
 * - selector: tta__settings_css_selectors (one CSS selector; empty means
 *   the player finds the article text itself);
 * - skip_areas: tta__settings_exclude_content_by_css_selectors (CSS
 *   selectors, one per line);
 * - skip_tags: tta__settings_exclude_tags (element names joined by "|");
 * - skip_phrases: tta__settings_exclude_texts (texts joined by "|").
 *
 * The rules per content type live in
 * tta__settings_atlasvoice_per_type_overrides. They are set on a page with
 * the picker (the `atlasvoice/save-rule` route) and only listed here;
 * RuleResolver applies them when AtlasVoice Pro is active.
 *
 * The admin screen (REST), `wp atlasvoice areas` and an MCP server all act
 * here (TTS-376).
 */
class Areas {

	const OPTION = 'tta_settings_data';

	/**
	 * The stored field of each part of a rule.
	 */
	const FIELDS = array(
		'selector'     => 'tta__settings_css_selectors',
		'skip_areas'   => 'tta__settings_exclude_content_by_css_selectors',
		'skip_tags'    => 'tta__settings_exclude_tags',
		'skip_phrases' => 'tta__settings_exclude_texts',
	);

	const OVERRIDES = 'tta__settings_atlasvoice_per_type_overrides';

	/**
	 * The longest CSS selector (the same limit as the picker's route).
	 */
	const SELECTOR_LENGTH = 2048;

	/**
	 * The longest phrase, and the most items in one skip list.
	 */
	const PHRASE_LENGTH = 200;
	const LIST_MAX      = 100;

	/**
	 * The rules.
	 *
	 * @return array {
	 *     selector: string, skip_areas: string[], skip_tags: string[], skip_phrases: string[],
	 *     types: array<int, array{post_type:string, name:string, selector:string, skip_areas:string[], skip_tags:string[], skip_phrases:string[]}>,
	 *     types_applied: bool
	 * }
	 */
	public static function get() {
		$stored = self::stored();
		$names  = (array) TTA_Helper::get_post_types();
		$types  = array();

		$overrides = isset( $stored[ self::OVERRIDES ] ) && is_array( $stored[ self::OVERRIDES ] ) ? $stored[ self::OVERRIDES ] : array();
		foreach ( $overrides as $post_type => $bag ) {
			if ( ! is_string( $post_type ) || ! is_array( $bag ) ) {
				continue;
			}
			$types[] = array(
				'post_type' => sanitize_key( $post_type ),
				'name'      => isset( $names[ $post_type ] ) ? wp_strip_all_tags( (string) $names[ $post_type ] ) : sanitize_key( $post_type ),
			) + self::rule( $bag );
		}

		return self::rule( $stored ) + array(
			'types'         => $types,
			// The rules per content type are applied by Pro (RuleResolver); the free plugin keeps them stored.
			'types_applied' => TTA_Helper::is_pro_active(),
		);
	}

	/**
	 * Saves the parts of the whole-site rule that were sent; the rest stays.
	 *
	 * @param array $fields Any of: selector, skip_areas, skip_tags, skip_phrases.
	 *
	 * @return array|\WP_Error The rules after the save, or why nothing was saved.
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

		// The stored shapes of the picker and the classic screen.
		$incoming = array();
		foreach ( $clean as $name => $value ) {
			if ( 'skip_areas' === $name ) {
				$value = implode( "\n", $value );
			} elseif ( 'selector' !== $name ) {
				$value = implode( '|', $value );
			}
			$incoming[ self::FIELDS[ $name ] ] = $value;
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
	 * @return array|\WP_Error The clean values (a text, or lists).
	 */
	public static function validate( array $fields ) {
		$clean = array();

		foreach ( $fields as $name => $value ) {
			if ( ! is_string( $name ) || ! isset( self::FIELDS[ $name ] ) ) {
				return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}

			if ( 'selector' === $name ) {
				if ( ! is_string( $value ) || ! self::is_selector( trim( $value ), true ) ) {
					return self::invalid( $name, __( 'This is not a CSS selector.', 'text-to-audio' ) );
				}
				$clean[ $name ] = trim( $value );
				continue;
			}

			if ( is_string( $value ) ) {
				// A script gives a list as one text: lines, or "|" between items.
				$value = preg_split( '/[|\r\n]+/', $value );
			}
			if ( ! is_array( $value ) ) {
				return self::invalid( $name, __( 'This must be a list.', 'text-to-audio' ) );
			}

			$items = array();
			foreach ( $value as $item ) {
				$item = is_string( $item ) ? trim( $item ) : $item;
				if ( '' === $item ) {
					continue;
				}
				$checked = self::clean_item( $name, $item );
				if ( is_wp_error( $checked ) ) {
					return self::invalid( $name, $checked->get_error_message() );
				}
				$items[] = $checked;
			}

			$items = array_values( array_unique( $items ) );
			if ( count( $items ) > self::LIST_MAX ) {
				return self::invalid(
					$name,
					sprintf(
						/* translators: %d: the largest number of items. */
						__( 'A list can hold %d items at most.', 'text-to-audio' ),
						self::LIST_MAX
					)
				);
			}
			$clean[ $name ] = $items;
		}//end foreach

		return $clean;
	}

	/**
	 * One item of a skip list, checked.
	 *
	 * @param string $name The list: skip_areas, skip_tags or skip_phrases.
	 * @param mixed  $item What was sent.
	 *
	 * @return string|\WP_Error
	 */
	private static function clean_item( $name, $item ) {
		if ( ! is_string( $item ) ) {
			return new \WP_Error( 'type', __( 'Every item of a list must be text.', 'text-to-audio' ) );
		}

		if ( 'skip_areas' === $name ) {
			return self::is_selector( $item, false ) ? $item : new \WP_Error( 'selector', __( 'An area is given by a CSS selector, for example .share-bar.', 'text-to-audio' ) );
		}

		if ( 'skip_tags' === $name ) {
			$tag = strtolower( $item );

			// The same rule as the picker's route: an element name, nothing else.
			return strlen( $tag ) <= 32 && preg_match( '/^[a-z][a-z0-9]*$/', $tag )
				? $tag
				: new \WP_Error( 'tag', __( 'An element type is a name such as figure, aside or table.', 'text-to-audio' ) );
		}

		$phrase = sanitize_text_field( $item );
		if ( '' === $phrase || mb_strlen( $phrase ) > self::PHRASE_LENGTH ) {
			return new \WP_Error(
				'phrase',
				sprintf(
					/* translators: %d: the largest number of characters. */
					__( 'A phrase can be %d characters at most.', 'text-to-audio' ),
					self::PHRASE_LENGTH
				)
			);
		}

		return $phrase;
	}

	/**
	 * Whether a text can be a CSS selector. It is given to the browser's
	 * querySelector, never printed as CSS, so this only keeps out what is
	 * plainly not a selector: markup, a rule block, a line break.
	 *
	 * @param string $selector What was sent.
	 * @param bool   $or_empty Whether no selector at all is allowed.
	 *
	 * @return bool
	 */
	private static function is_selector( $selector, $or_empty ) {
		if ( '' === $selector ) {
			return $or_empty;
		}

		return strlen( $selector ) <= self::SELECTOR_LENGTH && ! preg_match( '/[<{}\r\n|]/', $selector );
	}

	/**
	 * The four parts of a rule from a stored bag, as a text and lists. The
	 * splitting follows RuleResolver::settings_to_entry(), so the screen
	 * shows what the player applies.
	 *
	 * @param array $bag Stored settings, or the stored rule of one content type.
	 *
	 * @return array{selector:string, skip_areas:string[], skip_tags:string[], skip_phrases:string[]}
	 */
	private static function rule( array $bag ) {
		$split = static function ( $value, $pattern ) {
			$parts = is_array( $value ) ? $value : preg_split( $pattern, is_scalar( $value ) ? (string) $value : '' );
			$out   = array();
			foreach ( (array) $parts as $part ) {
				$part = is_string( $part ) ? trim( wp_strip_all_tags( $part ) ) : '';
				if ( '' !== $part ) {
					$out[] = $part;
				}
			}

			return array_values( array_unique( $out ) );
		};
		$field = static function ( $name ) use ( $bag ) {
			return isset( $bag[ self::FIELDS[ $name ] ] ) ? $bag[ self::FIELDS[ $name ] ] : '';
		};

		return array(
			'selector'     => is_string( $field( 'selector' ) ) ? trim( wp_strip_all_tags( $field( 'selector' ) ) ) : '',
			'skip_areas'   => $split( $field( 'skip_areas' ), '/[\r\n|]+/' ),
			'skip_tags'    => $split( $field( 'skip_tags' ), '/[\s,;|]+/' ),
			'skip_phrases' => $split( $field( 'skip_phrases' ), '/[|\r\n]+/' ),
		);
	}

	/**
	 * The stored settings as a plain array, nested values too.
	 *
	 * @return array
	 */
	private static function stored() {
		$stored = json_decode( (string) wp_json_encode( get_option( self::OPTION, array() ) ), true );

		return is_array( $stored ) ? $stored : array();
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
			'atlasvoice_invalid_area',
			$message,
			array(
				'status' => 400,
				'field'  => sanitize_key( $field ),
			)
		);
	}
}
