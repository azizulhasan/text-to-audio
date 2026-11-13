<?php
/**
 * Where the player sits, whether it follows the reader, and who gets it.
 *
 * @package TTA
 */

namespace TTA\Player;

use TTA\Settings\Settings_Store;
use TTA\TTA_Cache;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves the placement of the player.
 *
 * Nothing new is stored. Each part is a field the classic screens already
 * save, in the same format, so both screens can be used on the same site:
 *
 * - position: `tta_customize_settings` → buttonSettings → button_position,
 *   and "only where I add it" is `tta_settings_data` →
 *   tta__settings_enable_button_add set to false;
 * - dock: buttonSettings → float_position, and "do not follow" is
 *   `tta_settings_data` → tta__settings_stop_floating_button set to true;
 * - show_to: buttonSettings → display_player_to (a list of roles, or "all");
 * - download: buttonSettings → who_can_download_mp3_file (the same).
 *
 * The admin screen (REST), `wp atlasvoice placement` and an MCP server all
 * act here (TTS-376).
 */
class Placement {

	const CUSTOMIZE_OPTION = 'tta_customize_settings';

	const SETTINGS_OPTION = 'tta_settings_data';

	/**
	 * Stands for "everyone" in a list of roles, as the classic screen stores it.
	 */
	const EVERYONE = 'all';

	/**
	 * The player is added only by a shortcode, a block or a widget.
	 */
	const MANUAL = 'manual';

	/**
	 * The player stays in the text and does not follow the reader.
	 */
	const NO_DOCK = 'none';

	const POSITIONS = array( 'before_content', 'after_content', self::MANUAL );

	const DOCKS = array( 'bottom_fixed', 'bottom_right', 'bottom_left', 'sticky_top', self::NO_DOCK );

	/**
	 * Placements that were removed, and the one that replaced each
	 * (the same list as the player script).
	 */
	const DOCK_ALIASES = array( 'bottom_center' => 'bottom_fixed' );

	/**
	 * The placement and what can be chosen.
	 *
	 * @return array {
	 *     position: string, dock: string, show_to: string[], download: string[],
	 *     download_available: bool, stores_audio: bool,
	 *     roles: array<int, array{id:string, name:string}>
	 * }
	 */
	public static function get() {
		$button   = self::button_settings();
		$settings = self::as_array( get_option( self::SETTINGS_OPTION, array() ) );

		$automatic = ! isset( $settings['tta__settings_enable_button_add'] ) || ! empty( $settings['tta__settings_enable_button_add'] );
		$position  = isset( $button['button_position'] ) && 'after_content' === $button['button_position'] ? 'after_content' : 'before_content';

		$roles = array();
		foreach ( self::role_names() as $id => $name ) {
			$roles[] = array(
				'id'   => $id,
				'name' => $name,
			);
		}

		$stores_audio = TTA_Helper::player_makes_mp3( TTA_Helper::get_player_id() );

		return array(
			'position'           => $automatic ? $position : self::MANUAL,
			'dock'               => empty( $settings['tta__settings_stop_floating_button'] ) ? self::dock_corner( $button ) : self::NO_DOCK,
			'show_to'            => self::stored_roles( $button, 'display_player_to' ),
			'download'           => self::stored_roles( $button, 'who_can_download_mp3_file' ),
			/**
			 * Filters whether the player on this site has a download button.
			 *
			 * The free players have none. The plugin that adds one (AtlasVoice
			 * Pro) answers true, and the screen then shows who may download.
			 *
			 * @param bool $available    Whether a download button exists.
			 * @param bool $stores_audio Whether the voice in use stores audio files.
			 */
			'download_available' => (bool) apply_filters( 'atlasvoice_placement_download_available', false, $stores_audio ),
			'stores_audio'       => $stores_audio,
			'roles'              => $roles,
		);
	}

	/**
	 * Saves the parts that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of: position, dock, show_to, download.
	 *
	 * @return array|\WP_Error The placement after the save, or why nothing was saved.
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

		$button   = array();
		$settings = array();

		if ( isset( $clean['position'] ) ) {
			$settings['tta__settings_enable_button_add'] = self::MANUAL !== $clean['position'];
			if ( self::MANUAL !== $clean['position'] ) {
				$button['button_position'] = $clean['position'];
			}
		}

		if ( isset( $clean['dock'] ) ) {
			// The stored switch means "stop following", so true turns it off.
			$settings['tta__settings_stop_floating_button'] = self::NO_DOCK === $clean['dock'];
			if ( self::NO_DOCK !== $clean['dock'] ) {
				$button['float_position'] = $clean['dock'];
			}
		}

		if ( isset( $clean['show_to'] ) ) {
			$button['display_player_to'] = $clean['show_to'];
		}

		if ( isset( $clean['download'] ) ) {
			$button['who_can_download_mp3_file'] = $clean['download'];
		}

		// Both values are prepared before either is stored, so a refusal leaves both untouched.
		$customize = null;
		if ( $button ) {
			// The store replaces a nested value whole, so the other button settings are kept here.
			$merged    = array_replace( self::button_settings(), $button );
			$customize = Settings_Store::prepare( self::CUSTOMIZE_OPTION, (object) array( 'buttonSettings' => (object) $merged ) );
			if ( is_wp_error( $customize ) ) {
				return $customize;
			}
		}

		$site = null;
		if ( $settings ) {
			$site = Settings_Store::prepare( self::SETTINGS_OPTION, (object) $settings );
			if ( is_wp_error( $site ) ) {
				return $site;
			}
		}

		if ( null !== $customize ) {
			update_option( self::CUSTOMIZE_OPTION, $customize );
		}
		if ( null !== $site ) {
			update_option( self::SETTINGS_OPTION, $site );
		}

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
		$clean = array();

		foreach ( $fields as $name => $value ) {
			switch ( $name ) {
				case 'position':
					if ( ! in_array( $value, self::POSITIONS, true ) ) {
						return self::invalid( $name, __( 'The position must be before_content, after_content or manual.', 'text-to-audio' ) );
					}
					$clean[ $name ] = $value;
					break;

				case 'dock':
					if ( ! in_array( $value, self::DOCKS, true ) ) {
						return self::invalid( $name, __( 'The dock must be bottom_fixed, bottom_right, bottom_left, sticky_top or none.', 'text-to-audio' ) );
					}
					$clean[ $name ] = $value;
					break;

				case 'show_to':
				case 'download':
					$roles = self::clean_roles( $value );
					if ( is_wp_error( $roles ) ) {
						return self::invalid( $name, $roles->get_error_message() );
					}
					$clean[ $name ] = $roles;
					break;

				default:
					return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}//end switch
		}//end foreach

		return $clean;
	}

	/**
	 * The roles of this site by id, with "everyone" first.
	 *
	 * @return array<string, string>
	 */
	public static function role_names() {
		$names = array( self::EVERYONE => __( 'Everyone', 'text-to-audio' ) );

		foreach ( wp_roles()->get_names() as $id => $name ) {
			$names[ (string) $id ] = translate_user_role( $name );
		}

		return $names;
	}

	/**
	 * A list of roles as it is stored: "all" alone, or roles of this site.
	 *
	 * @param mixed $value A list of role ids, or one id.
	 *
	 * @return string[]|\WP_Error
	 */
	private static function clean_roles( $value ) {
		if ( is_string( $value ) ) {
			$value = array_filter( array_map( 'trim', explode( ',', $value ) ), 'strlen' );
		}

		if ( ! is_array( $value ) || ! $value ) {
			return new \WP_Error( 'empty', __( 'Choose everyone or at least one role.', 'text-to-audio' ) );
		}

		$known = self::role_names();
		$roles = array();

		foreach ( $value as $role ) {
			if ( ! is_string( $role ) || ! isset( $known[ $role ] ) ) {
				return new \WP_Error(
					'unknown',
					sprintf(
						/* translators: %s: what was sent as a user role. */
						__( 'This site has no role called "%s".', 'text-to-audio' ),
						is_scalar( $role ) ? sanitize_text_field( (string) $role ) : '?'
					)
				);
			}
			$roles[] = $role;
		}

		// Everyone includes every role, so the list is stored as "all" alone.
		return in_array( self::EVERYONE, $roles, true ) ? array( self::EVERYONE ) : array_values( array_unique( $roles ) );
	}

	/**
	 * The stored list of roles of one field. A site that never saved the
	 * field, or saved it empty, shows to everyone (as the player does).
	 *
	 * @param array  $button The stored button settings.
	 * @param string $key    Field name.
	 *
	 * @return string[]
	 */
	private static function stored_roles( array $button, $key ) {
		$roles = array();

		foreach ( isset( $button[ $key ] ) ? (array) $button[ $key ] : array() as $role ) {
			if ( is_string( $role ) && '' !== $role ) {
				$roles[] = sanitize_key( $role );
			}
		}

		return ! $roles || in_array( self::EVERYONE, $roles, true ) ? array( self::EVERYONE ) : array_values( array_unique( $roles ) );
	}

	/**
	 * The corner the player docks to, read the way the player script reads
	 * it: a removed placement maps to its replacement, and a site from before
	 * the dock had its own field keeps the corner stored in button_position,
	 * or bottom right.
	 *
	 * @param array $button The stored button settings.
	 *
	 * @return string
	 */
	private static function dock_corner( array $button ) {
		$corners = array_diff( self::DOCKS, array( self::NO_DOCK ) );

		foreach ( array( 'float_position', 'button_position' ) as $key ) {
			$value = isset( $button[ $key ] ) && is_string( $button[ $key ] ) ? $button[ $key ] : '';
			$value = isset( self::DOCK_ALIASES[ $value ] ) ? self::DOCK_ALIASES[ $value ] : $value;
			if ( in_array( $value, $corners, true ) ) {
				return $value;
			}
		}

		return 'bottom_right';
	}

	/**
	 * The stored button settings as an array.
	 *
	 * @return array
	 */
	private static function button_settings() {
		$stored = self::as_array( get_option( self::CUSTOMIZE_OPTION, array() ) );

		return isset( $stored['buttonSettings'] ) ? self::as_array( $stored['buttonSettings'] ) : array();
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
			'atlasvoice_invalid_placement',
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
