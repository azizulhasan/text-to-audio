<?php
/**
 * Which voice reads the posts: the engine, the language, the voice.
 *
 * @package TTA
 */

namespace TTA\Voice;

use TTA\Settings\Settings_Store;
use TTA\TTA_AtlasVoice_Service;
use TTA\TTA_Cache;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves the voice choice.
 *
 * Nothing new is stored. The engine is the player number the classic
 * Customization screen saves (`tta_customize_settings` → buttonSettings →
 * id), and the language, voice, speed, volume and pitch are the fields the
 * classic Listening screen saves (`tta_listening_settings`), in the same
 * format. Both screens can be used on the same site.
 *
 * A save does what the classic screens do, in the same order: the language
 * and voice are stored before the engine, so an engine never starts with a
 * voice it cannot speak; and when the engine, language or voice changed,
 * the "audio file exists" marks of the posts are cleared, so each post gets
 * audio in the new voice the next time it is played.
 *
 * The admin screen (REST), `wp atlasvoice voice` and an MCP server all act
 * here.
 */
class Choice {

	const LISTENING_OPTION = 'tta_listening_settings';

	const CUSTOMIZE_OPTION = 'tta_customize_settings';

	/**
	 * Speed limits of the browser's speech engine.
	 */
	const RATE_MIN = 0.1;
	const RATE_MAX = 10;

	/**
	 * Pitch steps the plugin stores: lower, normal, higher.
	 */
	const PITCHES = array( 0, 1, 2 );

	/**
	 * The choice and what can be chosen.
	 *
	 * @return array {
	 *     player_id: int, language: string, voice: string, rate: float, volume: float, pitch: int,
	 *     connected: bool, natural_player_id: int, site_language: string,
	 *     players: array<int, array{id:int, name:string, pro:bool, stores_audio:bool}>
	 * }
	 */
	public static function get() {
		$listening = self::as_array( get_option( self::LISTENING_OPTION, array() ) );
		$players   = array();

		foreach ( (array) TTA_Helper::get_available_players() as $player ) {
			$player = (array) $player;
			if ( empty( $player['id'] ) ) {
				continue;
			}
			$players[] = array(
				'id'           => (int) $player['id'],
				'name'         => isset( $player['name'] ) ? sanitize_text_field( (string) $player['name'] ) : '',
				'pro'          => ! empty( $player['pro'] ),
				'stores_audio' => ! empty( $player['mp3'] ),
			);
		}

		return array(
			'player_id'         => (int) TTA_Helper::get_player_id(),
			'language'          => self::text( $listening, 'tta__listening_lang' ),
			'voice'             => self::text( $listening, 'tta__listening_voice' ),
			'rate'              => self::number( $listening, 'tta__listening_rate', 1.0, self::RATE_MIN, self::RATE_MAX ),
			'volume'            => self::number( $listening, 'tta__listening_volume', 1.0, 0, 1 ),
			'pitch'             => (int) self::number( $listening, 'tta__listening_pitch', 1, 0, 2 ),
			'connected'         => TTA_AtlasVoice_Service::is_connected(),
			'natural_player_id' => (int) TTA_AtlasVoice_Service::PLAYER_ID,
			// e.g. "en-GB": what a new site most likely wants to hear.
			'site_language'     => str_replace( '_', '-', (string) get_locale() ),
			'players'           => $players,
		);
	}

	/**
	 * Saves the parts of the choice that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of: player_id, language, voice, rate, volume, pitch.
	 *
	 * @return array|\WP_Error The choice after the save, or why nothing was saved.
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

		// 1. Language, voice and sound, in the fields the Listening screen stores.
		$map      = array(
			'language' => 'tta__listening_lang',
			'voice'    => 'tta__listening_voice',
			'rate'     => 'tta__listening_rate',
			'volume'   => 'tta__listening_volume',
			'pitch'    => 'tta__listening_pitch',
		);
		$incoming = array();
		foreach ( $map as $name => $stored_name ) {
			if ( array_key_exists( $name, $clean ) ) {
				// The classic form stores these as text; the player reads them that way.
				$incoming[ $stored_name ] = (string) $clean[ $name ];
			}
		}

		if ( $incoming ) {
			$listening = Settings_Store::prepare( self::LISTENING_OPTION, (object) $incoming );
			if ( is_wp_error( $listening ) ) {
				return $listening;
			}
			if ( TTA_Helper::is_listening_lang_or_voice_changed( $listening ) ) {
				TTA_Helper::delete_post_meta();
			}
			update_option( self::LISTENING_OPTION, $listening, false );
		}

		// 2. The engine, in the field the Customization screen stores.
		if ( array_key_exists( 'player_id', $clean ) && (int) TTA_Helper::get_player_id() !== $clean['player_id'] ) {
			$stored = self::as_array( get_option( self::CUSTOMIZE_OPTION, array() ) );
			$button = isset( $stored['buttonSettings'] ) ? self::as_array( $stored['buttonSettings'] ) : array();

			$button      += array(
				'button_position'           => 'before_content',
				'display_player_to'         => array( 'all' ),
				'who_can_download_mp3_file' => array( 'all' ),
			);
			$button['id'] = (string) $clean['player_id'];

			$customize = Settings_Store::prepare( self::CUSTOMIZE_OPTION, (object) array( 'buttonSettings' => (object) $button ) );
			if ( is_wp_error( $customize ) ) {
				return $customize;
			}
			if ( TTA_Helper::is_player_number_changed( $customize ) ) {
				TTA_Helper::delete_post_meta();
			}
			update_option( self::CUSTOMIZE_OPTION, $customize );
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
				case 'player_id':
					$id      = is_numeric( $value ) ? (int) $value : 0;
					$players = (array) TTA_Helper::get_available_players();
					if ( ! isset( $players[ $id ] ) ) {
						return self::invalid( $name, __( 'This voice engine is not available on this site.', 'text-to-audio' ) );
					}
					if ( (int) TTA_AtlasVoice_Service::PLAYER_ID === $id && ! TTA_AtlasVoice_Service::is_connected() ) {
						return new \WP_Error(
							'not_connected',
							__( 'Connect the natural voice first. Until then it cannot make audio.', 'text-to-audio' ),
							array( 'status' => 409 )
						);
					}
					$clean[ $name ] = $id;
					break;

				case 'language':
					// A language tag such as "en", "en-GB", "zh-yue" or "yue-hant-hk".
					if ( ! is_string( $value ) || ! preg_match( '/^[A-Za-z]{2,3}([-_][A-Za-z0-9]{2,8}){0,3}$/', $value ) ) {
						return self::invalid( $name, __( 'This is not a language code.', 'text-to-audio' ) );
					}
					$clean[ $name ] = $value;
					break;

				case 'voice':
					if ( ! is_string( $value ) || strlen( $value ) > 190 ) {
						return self::invalid( $name, __( 'This is not a voice name.', 'text-to-audio' ) );
					}
					$clean[ $name ] = sanitize_text_field( $value );
					break;

				case 'rate':
					if ( ! is_numeric( $value ) || $value < self::RATE_MIN || $value > self::RATE_MAX ) {
						return self::invalid( $name, __( 'The speed must be between 0.1 and 10.', 'text-to-audio' ) );
					}
					$clean[ $name ] = round( (float) $value, 1 );
					break;

				case 'volume':
					if ( ! is_numeric( $value ) || $value < 0 || $value > 1 ) {
						return self::invalid( $name, __( 'The volume must be between 0 and 1.', 'text-to-audio' ) );
					}
					$clean[ $name ] = round( (float) $value, 1 );
					break;

				case 'pitch':
					if ( ! is_numeric( $value ) || ! in_array( (int) $value, self::PITCHES, true ) || (float) (int) $value !== (float) $value ) {
						return self::invalid( $name, __( 'The pitch must be 0 (lower), 1 (normal) or 2 (higher).', 'text-to-audio' ) );
					}
					$clean[ $name ] = (int) $value;
					break;

				default:
					return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}//end switch
		}//end foreach

		return $clean;
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
			'atlasvoice_invalid_voice_setting',
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

	/**
	 * A stored line of text.
	 *
	 * @param array  $settings Stored settings.
	 * @param string $key      Setting name.
	 *
	 * @return string
	 */
	private static function text( array $settings, $key ) {
		return isset( $settings[ $key ] ) && is_scalar( $settings[ $key ] ) ? sanitize_text_field( (string) $settings[ $key ] ) : '';
	}

	/**
	 * A stored number, kept inside its limits.
	 *
	 * @param array     $settings Stored settings.
	 * @param string    $key      Setting name.
	 * @param float|int $fallback Value when nothing usable is stored.
	 * @param float|int $min      Smallest value.
	 * @param float|int $max      Largest value.
	 *
	 * @return float
	 */
	private static function number( array $settings, $key, $fallback, $min, $max ) {
		if ( ! isset( $settings[ $key ] ) || ! is_numeric( $settings[ $key ] ) ) {
			return (float) $fallback;
		}

		return (float) max( $min, min( $max, (float) $settings[ $key ] ) );
	}
}
