<?php
/**
 * The first-run setup.
 *
 * @package TTA
 */

namespace TTA\Setup;

use TTA\AtlasVoice\Mode;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * What the setup screen needs that no other service gives: whether setup is
 * finished, its steps, the newest post to try the player on, and the one
 * action that ends it.
 *
 * The steps themselves save through the services of their own screens
 * (Where it appears, Look, Tracking), so the wizard stores nothing of its
 * own. Finishing writes the flag the classic wizard wrote
 * (`tta_onboarding_completed`) and, when asked, the mode.
 *
 * The admin screen (REST), `wp atlasvoice setup` and an MCP server all use
 * this (TTS-376).
 */
class Wizard {

	/**
	 * The option the classic wizard marked when it was finished. Kept.
	 */
	const FINISHED_OPTION = 'tta_onboarding_completed';

	/**
	 * How much of the sample post is handed out to be read aloud.
	 */
	const SAMPLE_LENGTH = 400;

	/**
	 * Where setup stands.
	 *
	 * @return array {
	 *     finished: bool, mode: string (staging|production), steps: string[],
	 *     voice: string, stores_audio: bool,
	 *     sample: array{id:int, title:string, text:string, url:string, language:string}|null
	 * }
	 */
	public static function get() {
		$player_id = (int) TTA_Helper::get_player_id();
		$players   = (array) TTA_Helper::get_available_players();

		return array(
			'finished'     => (bool) get_option( self::FINISHED_OPTION ),
			'mode'         => Mode::get(),
			'steps'        => self::steps(),
			'voice'        => isset( $players[ $player_id ]['name'] ) ? sanitize_text_field( (string) $players[ $player_id ]['name'] ) : '',
			'stores_audio' => TTA_Helper::player_makes_mp3( $player_id ),
			'sample'       => self::sample(),
		);
	}

	/**
	 * The steps, in order.
	 *
	 * @return string[]
	 */
	public static function steps() {
		$steps = array( 'hear', 'where', 'voice', 'look', 'live' );

		/**
		 * Filters the steps of the setup. An extension (AtlasVoice Pro) adds
		 * its own between them and brings the screen part for each.
		 *
		 * @param string[] $steps Step ids, in order.
		 */
		$steps = (array) apply_filters( 'atlasvoice_setup_steps', $steps );

		return array_values( array_unique( array_filter( array_map( 'sanitize_key', $steps ) ) ) );
	}

	/**
	 * Ends the setup.
	 *
	 * @param bool|null $go_live True: visitors get the player now. False: stay in
	 *                           staging. Null: leave the mode as it is.
	 *
	 * @return array The same as get(), after the change.
	 */
	public static function finish( $go_live = null ) {
		if ( null !== $go_live ) {
			$wanted = $go_live ? Mode::MODE_PRODUCTION : Mode::MODE_STAGING;
			// Only a real change is written, so the mode hooks do not fire for nothing.
			if ( Mode::get() !== $wanted ) {
				Mode::set( $wanted );
			}
		}

		update_option( self::FINISHED_OPTION, true, false );

		/**
		 * Fires when the setup is finished.
		 *
		 * @param string $mode The mode after it: staging or production.
		 */
		do_action( 'atlasvoice_setup_finished', Mode::get() );

		return self::get();
	}

	/**
	 * The newest published post that gets a player, to try the player on.
	 *
	 * @return array|null Null when the site has no published post yet.
	 */
	private static function sample() {
		$settings = (array) TTA_Helper::tts_get_settings( 'settings' );
		$types    = isset( $settings['tta__settings_allow_listening_for_post_types'] ) ? (array) $settings['tta__settings_allow_listening_for_post_types'] : array();
		$types    = array_values( array_filter( array_map( 'sanitize_key', $types ), 'post_type_exists' ) );

		$posts = get_posts(
			array(
				'post_type'           => $types ? $types : array( 'post' ),
				'post_status'         => 'publish',
				'posts_per_page'      => 1,
				'orderby'             => 'date',
				'order'               => 'DESC',
				// A post behind a password is never read out in wp-admin.
				'has_password'        => false,
				'ignore_sticky_posts' => true,
				'no_found_rows'       => true,
			)
		);

		if ( ! $posts ) {
			return null;
		}

		$post  = $posts[0];
		$title = TTA_Helper::atlasvoice_plain_title( $post );
		$body  = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( strip_shortcodes( (string) $post->post_content ) ) ) );
		$text  = trim( $title . '. ' . $body );

		if ( function_exists( 'mb_substr' ) ) {
			$text = mb_substr( $text, 0, self::SAMPLE_LENGTH );
		} else {
			$text = substr( $text, 0, self::SAMPLE_LENGTH );
		}

		return array(
			'id'       => (int) $post->ID,
			'title'    => $title,
			'text'     => $text,
			'url'      => (string) get_permalink( $post ),
			'language' => (string) get_bloginfo( 'language' ),
		);
	}
}
