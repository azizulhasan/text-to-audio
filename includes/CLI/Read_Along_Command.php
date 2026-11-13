<?php
/**
 * `wp atlasvoice read-along`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Player\Read_Along;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes how the text is highlighted while it is read.
 *
 * The same settings as Player › Read-along in the admin. The names are the
 * stored ones, without the `tta__` prefix: `highlight_enabled`,
 * `highlight_mode`, `highlight_word_bg`, `highlight_word_color`,
 * `highlight_sentence_bg`, `highlight_dim_enabled`, `highlight_dim_opacity`,
 * `highlight_autoscroll`, `selection_listen_enabled`, `selection_announce`.
 */
class Read_Along_Command {

	const PREFIX = 'tta__';

	/**
	 * Shows the read-along settings.
	 *
	 * ## OPTIONS
	 *
	 * [--format=<format>]
	 * : How to print them.
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - json
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice read-along get
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$rows = array();
		foreach ( Read_Along::get() as $key => $value ) {
			$rows[] = array(
				'setting' => substr( $key, strlen( self::PREFIX ) ),
				'value'   => is_bool( $value ) ? ( $value ? 'on' : 'off' ) : $value,
			);
		}

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( wp_json_encode( Read_Along::get() ) );
			return;
		}

		\WP_CLI\Utils\format_items( 'table', $rows, array( 'setting', 'value' ) );
	}

	/**
	 * Changes one read-along setting. The others keep their value.
	 *
	 * ## OPTIONS
	 *
	 * <setting>
	 * : The setting, e.g. highlight_enabled or highlight_mode.
	 *
	 * <value>
	 * : The new value. Switches take on or off; colours take a hex colour.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice read-along set highlight_enabled on
	 *     Success: highlight_enabled is now on.
	 *
	 *     $ wp atlasvoice read-along set highlight_mode word_sentence
	 *
	 * @param array $args       Positional arguments: setting, value.
	 * @param array $assoc_args Flags (none).
	 */
	public function set( $args, $assoc_args ) {
		list( $setting, $value ) = array_pad( array_map( 'strval', $args ), 2, '' );

		$key      = self::PREFIX . $setting;
		$defaults = Read_Along::defaults();

		if ( ! array_key_exists( $key, $defaults ) ) {
			\WP_CLI::error(
				sprintf(
					'Unknown setting "%1$s". Use one of: %2$s.',
					$setting,
					implode( ', ', array_map( array( __CLASS__, 'short_name' ), array_keys( $defaults ) ) )
				)
			);
		}

		// A value that is not allowed is refused, and nothing is saved.
		$valid = Read_Along::validate( array( $key => $value ) );
		if ( is_wp_error( $valid ) ) {
			\WP_CLI::error( sprintf( '"%1$s" is not allowed for %2$s.', $value, $setting ) );
		}

		$saved = Read_Along::save( array( $key => $value ) );
		$shown = is_bool( $saved[ $key ] ) ? ( $saved[ $key ] ? 'on' : 'off' ) : (string) $saved[ $key ];

		\WP_CLI::success( sprintf( '%1$s is now %2$s.', $setting, $shown ) );
	}

	/**
	 * A stored key without its prefix.
	 *
	 * @param string $key Stored key.
	 *
	 * @return string
	 */
	private static function short_name( $key ) {
		return substr( $key, strlen( self::PREFIX ) );
	}
}
