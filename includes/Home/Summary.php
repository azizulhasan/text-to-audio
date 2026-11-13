<?php
/**
 * What the Home screen shows: the state of AtlasVoice on this site.
 *
 * @package TTA
 */

namespace TTA\Home;

use TTA\AtlasVoice\Mode;
use TTA\TTA_AtlasVoice_Service;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * One read of the site's setup, in the words of the Home screen: who can
 * hear the posts, which voice reads them, where the player sits and what
 * is read.
 *
 * It reads saved settings only: no post count, no file check and no call to
 * another server, so Home opens fast on a site of any size. The admin
 * screen (REST), `wp atlasvoice status` and an MCP server all read it here.
 *
 * Nothing stored is changed, and no key is part of the answer.
 */
class Summary {

	/**
	 * User meta that remembers what a user closed on Home, and when.
	 */
	const DISMISSED_META = 'atlasvoice_dismissed';

	/**
	 * What a user may close.
	 */
	const DISMISSIBLE = array( 'pro_card' );

	/**
	 * How long a closed item stays closed, in seconds (30 days).
	 */
	const DISMISS_SECONDS = 2592000;

	/**
	 * The summary.
	 *
	 * @return array {
	 *     mode: 'production'|'staging', live: bool, setup_finished: bool, is_pro: bool,
	 *     voice: array{player_id:int, engine:string, stores_audio:bool, language:string, voice:string},
	 *     player: array{position:string, shown_to:string[]},
	 *     content: array{automatic:bool, post_types:string[]},
	 *     usage: array{connected:bool, chars_used:int|null, chars_limit:int|null},
	 *     links: array{visitor:string, demo:string},
	 *     hidden: string[]
	 * }
	 */
	public static function get() {
		$customize = self::settings( 'customize' );
		$button    = isset( $customize['buttonSettings'] ) ? (array) $customize['buttonSettings'] : array();
		$settings  = self::settings( 'settings' );
		$listening = self::settings( 'listening' );

		$player_id = (int) TTA_Helper::get_player_id();
		$players   = (array) TTA_Helper::get_available_players();
		$player    = isset( $players[ $player_id ] ) ? (array) $players[ $player_id ] : array();

		$types = array();
		foreach ( isset( $settings['tta__settings_allow_listening_for_post_types'] ) ? (array) $settings['tta__settings_allow_listening_for_post_types'] : array() as $type ) {
			if ( ! is_string( $type ) || '' === $type ) {
				continue;
			}
			$object  = get_post_type_object( $type );
			$types[] = ( $object && isset( $object->labels->name ) ) ? (string) $object->labels->name : $type;
		}

		$shown_to = array();
		foreach ( isset( $button['display_player_to'] ) ? (array) $button['display_player_to'] : array( 'all' ) as $who ) {
			if ( is_string( $who ) && '' !== $who ) {
				$shown_to[] = sanitize_key( $who );
			}
		}

		$mode = Mode::get();

		return array(
			'mode'           => $mode,
			'live'           => Mode::is_production(),
			'setup_finished' => (bool) get_option( 'tta_onboarding_completed' ),
			'is_pro'         => (bool) TTA_Helper::is_atlasvoice_addon_functional(),
			'voice'          => array(
				'player_id'    => $player_id,
				'engine'       => isset( $player['name'] ) ? sanitize_text_field( (string) $player['name'] ) : '',
				'stores_audio' => ! empty( $player['mp3'] ),
				'language'     => self::text( $listening, 'tta__listening_lang' ),
				'voice'        => self::voice_name( self::text( $listening, 'tta__listening_voice' ) ),
			),
			'player'         => array(
				'position' => isset( $button['button_position'] ) ? sanitize_key( (string) $button['button_position'] ) : 'before_content',
				'shown_to' => $shown_to ? $shown_to : array( 'all' ),
			),
			'content'        => array(
				'automatic'  => ! isset( $settings['tta__settings_enable_button_add'] ) || (bool) $settings['tta__settings_enable_button_add'],
				'post_types' => $types,
			),
			'usage'          => self::usage(),
			'links'          => array(
				// The newest post a visitor can read, to see the player as they do.
				'visitor' => esc_url_raw( (string) TTA_Helper::get_latest_post_preview_url() ),
				'demo'    => esc_url_raw( TTA_Helper::get_pro_url( 'admin', 'home_card', 'demo' ) ),
			),
			'hidden'         => self::hidden_for( get_current_user_id() ),
		);
	}

	/**
	 * Closes an item of Home for the current user, for 30 days.
	 *
	 * @param string $item One of DISMISSIBLE.
	 *
	 * @return true|\WP_Error
	 */
	public static function dismiss( $item ) {
		$item    = (string) $item;
		$user_id = get_current_user_id();

		if ( ! in_array( $item, self::DISMISSIBLE, true ) ) {
			return new \WP_Error(
				'atlasvoice_unknown_item',
				__( 'This cannot be hidden.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		if ( ! $user_id ) {
			return new \WP_Error(
				'atlasvoice_no_user',
				__( 'Log in to hide this.', 'text-to-audio' ),
				array( 'status' => 401 )
			);
		}

		$closed          = self::closed( $user_id );
		$closed[ $item ] = time();

		update_user_meta( $user_id, self::DISMISSED_META, $closed );

		return true;
	}

	/**
	 * What a user closed and that is still closed.
	 *
	 * @param int $user_id User id.
	 *
	 * @return string[]
	 */
	public static function hidden_for( $user_id ) {
		$hidden = array();

		foreach ( self::closed( (int) $user_id ) as $item => $when ) {
			if ( time() - $when < self::DISMISS_SECONDS ) {
				$hidden[] = $item;
			}
		}

		return $hidden;
	}

	/**
	 * The stored record of closed items, cleaned.
	 *
	 * @param int $user_id User id.
	 *
	 * @return array<string, int> Item => time it was closed.
	 */
	private static function closed( $user_id ) {
		$stored = $user_id ? get_user_meta( $user_id, self::DISMISSED_META, true ) : array();
		$closed = array();

		foreach ( is_array( $stored ) ? $stored : array() as $item => $when ) {
			if ( in_array( $item, self::DISMISSIBLE, true ) && is_numeric( $when ) ) {
				$closed[ $item ] = (int) $when;
			}
		}

		return $closed;
	}

	/**
	 * The natural-voice allowance as the site last stored it. No request is
	 * sent: Account & plans shows the service's own, current numbers.
	 *
	 * @return array{connected:bool, chars_used:int|null, chars_limit:int|null}
	 */
	private static function usage() {
		$connected = TTA_AtlasVoice_Service::is_connected();
		$state     = $connected ? TTA_AtlasVoice_Service::public_state() : array();
		$usage     = isset( $state['usage'] ) && is_array( $state['usage'] ) ? $state['usage'] : array();

		return array(
			'connected'   => $connected,
			'chars_used'  => isset( $usage['chars_used'] ) && is_numeric( $usage['chars_used'] ) ? max( 0, (int) $usage['chars_used'] ) : null,
			'chars_limit' => isset( $usage['chars_limit'] ) && is_numeric( $usage['chars_limit'] ) ? max( 0, (int) $usage['chars_limit'] ) : null,
		);
	}

	/**
	 * One group of saved settings as an array, whatever shape it was saved in.
	 *
	 * @param string $group 'customize', 'settings' or 'listening'.
	 *
	 * @return array
	 */
	private static function settings( $group ) {
		$value = TTA_Helper::tts_get_settings( $group );

		if ( is_object( $value ) ) {
			$value = get_object_vars( $value );
		}

		return is_array( $value ) ? $value : array();
	}

	/**
	 * A saved line of text.
	 *
	 * @param array  $settings A group of settings.
	 * @param string $key      Setting name.
	 *
	 * @return string
	 */
	private static function text( array $settings, $key ) {
		return isset( $settings[ $key ] ) && is_scalar( $settings[ $key ] ) ? sanitize_text_field( (string) $settings[ $key ] ) : '';
	}

	/**
	 * A voice name a person can read. Some engines save "id::name"; the
	 * name is the part to show.
	 *
	 * @param string $saved The saved voice.
	 *
	 * @return string
	 */
	private static function voice_name( $saved ) {
		$parts = explode( '::', $saved );
		$name  = trim( (string) end( $parts ) );

		return '' !== $name ? $name : $saved;
	}
}
