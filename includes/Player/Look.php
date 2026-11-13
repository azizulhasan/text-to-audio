<?php
/**
 * How the player looks: its colours, size, border and the space around it.
 *
 * @package TTA
 */

namespace TTA\Player;

use TTA\Settings\Settings_Store;
use TTA\TTA_Cache;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves the look of the player.
 *
 * Nothing new is stored. Each part is a field of `tta_customize_settings`
 * that the classic Customization screen already saves, in the same format
 * (a hex colour, or a number as text without its unit), so both screens can
 * be used on the same site. fields() is the one list of those parts: the
 * REST route, `wp atlasvoice look` and the checks are all built from it.
 *
 * The admin screen (REST), WP-CLI and an MCP server all act here (TTS-376).
 */
class Look {

	const OPTION = 'tta_customize_settings';

	/**
	 * Every part of the look.
	 *
	 * The default of a part is what the player draws when the site never
	 * saved it (includes/helpers.php), so the screen shows what visitors see.
	 *
	 * @return array<string, array{stored:string, type:string, default:mixed, min?:int, max?:int, unit?:string, description:string}>
	 */
	public static function fields() {
		return array(
			'background'       => array(
				'stored'      => 'backgroundColor',
				'type'        => 'color',
				'default'     => '#184c53',
				'description' => __( 'Background colour of the player, as a hex colour.', 'text-to-audio' ),
			),
			'text'             => array(
				'stored'      => 'color',
				'type'        => 'color',
				'default'     => '#ffffff',
				'description' => __( 'Colour of the text and icons, as a hex colour.', 'text-to-audio' ),
			),
			'hover_background' => array(
				'stored'      => 'hoverBackgroundColor',
				'type'        => 'color',
				'default'     => '#000000',
				'description' => __( 'Background colour while the pointer is on the player, as a hex colour.', 'text-to-audio' ),
			),
			'hover_text'       => array(
				'stored'      => 'hoverTextColor',
				'type'        => 'color',
				'default'     => '#ffffff',
				'description' => __( 'Colour of the text and icons while the pointer is on the player, as a hex colour.', 'text-to-audio' ),
			),
			'border_color'     => array(
				'stored'      => 'border_color',
				'type'        => 'color',
				'default'     => '#000000',
				'description' => __( 'Colour of the border, as a hex colour.', 'text-to-audio' ),
			),
			'border'           => array(
				'stored'      => 'border',
				'type'        => 'number',
				'default'     => 0,
				'min'         => 0,
				'max'         => 20,
				'unit'        => 'px',
				'description' => __( 'Width of the border in pixels. 0 is no border.', 'text-to-audio' ),
			),
			'radius'           => array(
				'stored'      => 'borderRadius',
				'type'        => 'number',
				'default'     => 4,
				'min'         => 0,
				'max'         => 200,
				'unit'        => 'px',
				'description' => __( 'How round the corners are, in pixels. 0 is square.', 'text-to-audio' ),
			),
			'height'           => array(
				'stored'      => 'height',
				'type'        => 'number',
				'default'     => 50,
				'min'         => 24,
				'max'         => 200,
				'unit'        => 'px',
				'description' => __( 'Height of the player in pixels.', 'text-to-audio' ),
			),
			'font_size'        => array(
				'stored'      => 'fontSize',
				'type'        => 'number',
				'default'     => 18,
				'min'         => 10,
				'max'         => 100,
				'unit'        => 'px',
				'description' => __( 'Size of the text in pixels.', 'text-to-audio' ),
			),
			'width'            => array(
				'stored'      => 'width',
				'type'        => 'number',
				'default'     => 100,
				'min'         => 10,
				'max'         => 100,
				'unit'        => '%',
				'description' => __( 'Width of the player, as a percentage of the text column.', 'text-to-audio' ),
			),
			'margin_top'       => self::margin( 'marginTop', __( 'Space above the player in pixels.', 'text-to-audio' ) ),
			'margin_bottom'    => self::margin( 'marginBottom', __( 'Space below the player in pixels.', 'text-to-audio' ) ),
			'margin_left'      => self::margin( 'marginLeft', __( 'Space to the left of the player in pixels.', 'text-to-audio' ) ),
			'margin_right'     => self::margin( 'marginRight', __( 'Space to the right of the player in pixels.', 'text-to-audio' ) ),
		);
	}

	/**
	 * The look of the player.
	 *
	 * @return array<string, string|int> Each part of fields(), as a hex colour or a whole number.
	 */
	public static function get() {
		$stored = self::as_array( get_option( self::OPTION, array() ) );
		$look   = array();

		foreach ( self::fields() as $name => $field ) {
			$value = isset( $stored[ $field['stored'] ] ) ? $stored[ $field['stored'] ] : null;

			if ( 'color' === $field['type'] ) {
				$color         = is_string( $value ) ? sanitize_hex_color( $value ) : '';
				$look[ $name ] = $color ? strtolower( $color ) : $field['default'];
			} else {
				$look[ $name ] = is_numeric( $value ) ? (int) max( $field['min'], min( $field['max'], round( (float) $value ) ) ) : $field['default'];
			}
		}

		return $look;
	}

	/**
	 * Saves the parts that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of the parts of fields().
	 *
	 * @return array|\WP_Error The look after the save, or why nothing was saved.
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
			// The classic form stores every part as text; the player reads it that way.
			$incoming[ $all[ $name ]['stored'] ] = (string) $value;
		}

		$customize = Settings_Store::prepare( self::OPTION, (object) $incoming );
		if ( is_wp_error( $customize ) ) {
			return $customize;
		}

		update_option( self::OPTION, $customize );
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

			$field = $all[ $name ];

			if ( 'color' === $field['type'] ) {
				$color = is_string( $value ) ? sanitize_hex_color( trim( $value ) ) : '';
				if ( ! $color ) {
					return self::invalid( $name, __( 'A colour must be a hex value such as #184c53.', 'text-to-audio' ) );
				}
				$clean[ $name ] = strtolower( $color );
				continue;
			}

			$whole = is_numeric( $value ) && (float) (int) $value === (float) $value;
			if ( ! $whole || (int) $value < $field['min'] || (int) $value > $field['max'] ) {
				return self::invalid(
					$name,
					sprintf(
						/* translators: 1: smallest allowed number, 2: largest allowed number. */
						__( 'This must be a whole number from %1$d to %2$d.', 'text-to-audio' ),
						$field['min'],
						$field['max']
					)
				);
			}
			$clean[ $name ] = (int) $value;
		}//end foreach

		return $clean;
	}

	/**
	 * One side of the space around the player.
	 *
	 * @param string $stored      Stored field name.
	 * @param string $description What the side is.
	 *
	 * @return array
	 */
	private static function margin( $stored, $description ) {
		return array(
			'stored'      => $stored,
			'type'        => 'number',
			'default'     => 0,
			'min'         => 0,
			'max'         => 200,
			'unit'        => 'px',
			'description' => $description,
		);
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
			'atlasvoice_invalid_look',
			$message,
			array(
				'status' => 400,
				'field'  => sanitize_key( $field ),
			)
		);
	}

	/**
	 * A stored value as an array, whatever shape it was saved in.
	 *
	 * @param mixed $value Stored value.
	 *
	 * @return array
	 */
	private static function as_array( $value ) {
		if ( is_object( $value ) ) {
			$value = get_object_vars( $value );
		}

		return is_array( $value ) ? $value : array();
	}
}
