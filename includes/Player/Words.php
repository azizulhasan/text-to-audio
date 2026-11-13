<?php
/**
 * The words, tooltips and icons on the buttons of the player.
 *
 * @package TTA
 */

namespace TTA\Player;

use TTA\Settings\Settings_Store;
use TTA\TTA_Cache;
use TTA\TTA_Helper;
use TTA\TTA_Player_Icons;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves what the button of the player says and shows.
 *
 * Nothing new is stored. The words, tooltips and icons are the map the
 * classic Customization screen saves in `tta__button_text_arr` → players →
 * player number → state → text / hover / icon, and "show the icon" is
 * `tta_settings_data` → tta__settings_display_btn_icon. Both screens can be
 * used on the same site.
 *
 * Only the players that read with the browser's voice (numbers 1 and 2)
 * have a button with words; the players that play an audio file have their
 * own controls. The list of those players comes from TTA_Player_Icons.
 *
 * The admin screen (REST), `wp atlasvoice words` and an MCP server all act
 * here (TTS-376).
 */
class Words {

	const OPTION = 'tta__button_text_arr';

	const SETTINGS_OPTION = 'tta_settings_data';

	/**
	 * The moments of the button, in the order a listener meets them.
	 */
	const STATES = array( 'listen', 'pause', 'resume', 'replay' );

	/**
	 * The longest word or tooltip. A button has to stay one line.
	 */
	const TEXT_LENGTH = 100;

	/**
	 * The words and what can be chosen.
	 *
	 * @return array {
	 *     show_icon: bool, player_id: int, applies: bool,
	 *     players: array<int, array<string, array{text:string, tooltip:string, icon:string}>>,
	 *     names: array<int, string>, defaults: array, icons: array<int, array{id:string, svg:string}>
	 * }
	 */
	public static function get() {
		$settings  = self::as_array( get_option( self::SETTINGS_OPTION, array() ) );
		$player_id = (int) TTA_Helper::get_player_id();
		$available = (array) TTA_Helper::get_available_players();
		$stored    = self::stored_players();
		$defaults  = TTA_Player_Icons::default_players();
		$players   = array();
		$names     = array();
		$fallback  = array();

		foreach ( $defaults as $id => $states ) {
			// A player that is not on this site (the second one belongs to Pro) is not shown.
			if ( ! isset( $available[ $id ] ) ) {
				continue;
			}
			$available_player = (array) $available[ $id ];
			$names[ $id ]     = isset( $available_player['name'] ) ? sanitize_text_field( (string) $available_player['name'] ) : '';
			$players[ $id ]   = self::for_screen( isset( $stored[ $id ] ) ? $stored[ $id ] : $states );
			$fallback[ $id ]  = self::for_screen( $states );
		}

		$icons = array();
		foreach ( TTA_Player_Icons::presets() as $id => $svg ) {
			$icons[] = array(
				'id'  => 'preset:' . $id,
				'svg' => $svg,
			);
		}

		return array(
			'show_icon' => ! empty( $settings['tta__settings_display_btn_icon'] ),
			'player_id' => $player_id,
			// False when the voice in use plays an audio file: its player has no button with words.
			'applies'   => isset( $players[ $player_id ] ),
			'players'   => $players,
			'names'     => $names,
			'defaults'  => $fallback,
			'icons'     => $icons,
		);
	}

	/**
	 * Saves the parts that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of: show_icon (bool), players (player number
	 *                      => state => any of text, tooltip, icon).
	 *
	 * @return array|\WP_Error The words after the save, or why nothing was saved.
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

		// Both values are prepared before either is stored, so a refusal leaves both untouched.
		$site = null;
		if ( array_key_exists( 'show_icon', $clean ) ) {
			$site = Settings_Store::prepare( self::SETTINGS_OPTION, (object) array( 'tta__settings_display_btn_icon' => $clean['show_icon'] ) );
			if ( is_wp_error( $site ) ) {
				return $site;
			}
		}

		if ( isset( $clean['players'] ) ) {
			$option  = get_option( self::OPTION );
			$option  = is_array( $option ) ? $option : array();
			$players = self::stored_players();

			foreach ( $clean['players'] as $id => $states ) {
				foreach ( $states as $state => $parts ) {
					$players[ $id ][ $state ] = array_replace( $players[ $id ][ $state ], $parts );
				}
			}

			// The flat words and anything else in the option stay as they are.
			$option['players'] = $players;
			update_option( self::OPTION, $option );
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
	 * @return array|\WP_Error The clean values, with the stored names (hover, not tooltip).
	 */
	public static function validate( array $fields ) {
		$clean = array();

		foreach ( $fields as $name => $value ) {
			if ( 'show_icon' === $name ) {
				$flag = self::to_bool( $value );
				if ( null === $flag ) {
					return self::invalid( $name, __( 'This must be on or off.', 'text-to-audio' ) );
				}
				$clean[ $name ] = $flag;
				continue;
			}

			if ( 'players' !== $name ) {
				return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}

			$players = self::clean_players( $value );
			if ( is_wp_error( $players ) ) {
				return self::invalid( $name, $players->get_error_message() );
			}
			if ( $players ) {
				$clean[ $name ] = $players;
			}
		}//end foreach

		return $clean;
	}

	/**
	 * The players, states and parts that were sent, checked.
	 *
	 * @param mixed $value Player number => state => parts.
	 *
	 * @return array|\WP_Error
	 */
	private static function clean_players( $value ) {
		if ( ! is_array( $value ) ) {
			return new \WP_Error( 'shape', __( 'The words must be given per player and per state.', 'text-to-audio' ) );
		}

		$known = TTA_Player_Icons::default_players();
		$clean = array();

		foreach ( $value as $id => $states ) {
			if ( ! is_numeric( $id ) || ! isset( $known[ (int) $id ] ) || ! is_array( $states ) ) {
				return new \WP_Error( 'player', __( 'This player has no button with words.', 'text-to-audio' ) );
			}

			foreach ( $states as $state => $parts ) {
				if ( ! in_array( $state, self::STATES, true ) || ! is_array( $parts ) ) {
					return new \WP_Error( 'state', __( 'The state must be listen, pause, resume or replay.', 'text-to-audio' ) );
				}

				foreach ( $parts as $part => $content ) {
					// "custom" is how get() names a drawing it does not send: keep the stored one.
					if ( 'icon' === $part && 'custom' === $content ) {
						continue;
					}
					$checked = self::clean_part( $part, $content );
					if ( is_wp_error( $checked ) ) {
						return $checked;
					}
					$clean[ (int) $id ][ $state ][ 'tooltip' === $part ? 'hover' : $part ] = $checked;
				}
			}
		}//end foreach

		return $clean;
	}

	/**
	 * One word, tooltip or icon, checked.
	 *
	 * @param mixed $part    text, tooltip or icon.
	 * @param mixed $content What was sent for it.
	 *
	 * @return string|\WP_Error
	 */
	private static function clean_part( $part, $content ) {
		if ( ! in_array( $part, array( 'text', 'tooltip', 'icon' ), true ) ) {
			return new \WP_Error( 'part', __( 'A state has a text, a tooltip and an icon.', 'text-to-audio' ) );
		}

		if ( ! is_string( $content ) ) {
			return new \WP_Error( 'type', __( 'A text, a tooltip and an icon must be text.', 'text-to-audio' ) );
		}

		if ( 'icon' !== $part ) {
			$text = sanitize_text_field( $content );
			if ( mb_strlen( $text ) > self::TEXT_LENGTH ) {
				return new \WP_Error(
					'long',
					sprintf(
						/* translators: %d: the largest number of characters. */
						__( 'A text or tooltip can be %d characters at most.', 'text-to-audio' ),
						self::TEXT_LENGTH
					)
				);
			}

			return $text;
		}

		if ( 0 === strpos( $content, 'preset:' ) && isset( TTA_Player_Icons::presets()[ substr( $content, 7 ) ] ) ) {
			return $content;
		}

		if ( 0 === strpos( $content, 'custom:' ) ) {
			// The same cleaner as the classic screen: only drawing elements survive.
			$svg = trim( TTA_Player_Icons::sanitize_svg( substr( $content, 7 ) ) );
			if ( 0 === stripos( $svg, '<svg' ) ) {
				return 'custom:' . $svg;
			}
		}

		return new \WP_Error( 'icon', __( 'This icon does not exist.', 'text-to-audio' ) );
	}

	/**
	 * The stored map of every player that has a button with words, complete:
	 * a missing player or state has its default.
	 *
	 * @return array<int, array<string, array{text:string, hover:string, icon:string}>>
	 */
	private static function stored_players() {
		$option  = get_option( self::OPTION );
		$stored  = is_array( $option ) && isset( $option['players'] ) && is_array( $option['players'] ) ? $option['players'] : array();
		$players = TTA_Player_Icons::default_players();

		// The classic cleaner fills in defaults and removes anything unsafe.
		foreach ( TTA_Player_Icons::sanitize_players( $stored ) as $id => $states ) {
			$players[ $id ] = $states;
		}

		return $players;
	}

	/**
	 * The states of one player with the names the screen uses.
	 *
	 * @param array $states state => text / hover / icon.
	 *
	 * @return array state => text / tooltip / icon.
	 */
	private static function for_screen( array $states ) {
		$out = array();

		foreach ( self::STATES as $state ) {
			$parts         = isset( $states[ $state ] ) && is_array( $states[ $state ] ) ? $states[ $state ] : array();
			$out[ $state ] = array(
				'text'    => isset( $parts['text'] ) ? (string) $parts['text'] : '',
				'tooltip' => isset( $parts['hover'] ) ? (string) $parts['hover'] : '',
				// A custom drawing is not sent to the screen, only the fact that there is one.
				'icon'    => isset( $parts['icon'] ) && 0 === strpos( (string) $parts['icon'], 'preset:' ) ? (string) $parts['icon'] : 'custom',
			);
		}

		return $out;
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
			'atlasvoice_invalid_words',
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
