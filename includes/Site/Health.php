<?php
/**
 * What could keep visitors from hearing the audio, checked on this site.
 *
 * @package TTA
 */

namespace TTA\Site;

use TTA\AtlasVoice\Mode;
use TTA\TTA_AtlasVoice_Service;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * The health checks.
 *
 * Every check reads something the site already knows (a setting, a folder,
 * a constant another plugin defines, a problem a visitor's browser
 * reported). None of them loads a page, calls a service or changes
 * anything, so the list can be asked for as often as wanted.
 *
 * Other plugins add their own checks through `atlasvoice_health_checks`
 * (AtlasVoice Pro: its licence, its voice providers).
 *
 * The admin screen (REST), `wp atlasvoice health` and an MCP server all
 * read this list (TTS-376).
 */
class Health {

	/**
	 * A problem a visitor's browser reported about a script on a CDN
	 * (written by the `cors-alert` route).
	 */
	const CDN_OPTION = 'tta_cors_detected';

	const STATUSES = array( 'ok', 'info', 'warn', 'error' );

	/**
	 * The checks and the plugins AtlasVoice adjusts to.
	 *
	 * @return array {
	 *     checked_at: int,
	 *     needs_attention: int,
	 *     checks: array<int, array{id:string, title:string, status:string, detail:string, route:string}>,
	 *     plugins: array<int, array{name:string, active:bool, detail:string}>
	 * }
	 */
	public static function get() {
		$checks = array(
			self::mode(),
			self::voice(),
			self::placement(),
			self::uploads(),
			self::cdn(),
			self::environment(),
		);

		/**
		 * Filters the health checks, so another plugin can add its own.
		 *
		 * @param array[] $checks Each: id, title, status (ok, info, warn or error), detail, route.
		 */
		$checks = self::clean( apply_filters( 'atlasvoice_health_checks', $checks ) );

		return array(
			'checked_at'      => time(),
			'needs_attention' => count(
				array_filter(
					$checks,
					static function ( $check ) {
						return in_array( $check['status'], array( 'warn', 'error' ), true );
					}
				)
			),
			'checks'          => $checks,
			'plugins'         => self::plugins(),
		);
	}

	/**
	 * Forgets the script problem a visitor's browser reported, after the
	 * owner fixed the CDN. If the problem is still there, the next visitor
	 * who meets it reports it again.
	 *
	 * @return array The checks after it.
	 */
	public static function forget_cdn_problem() {
		delete_option( self::CDN_OPTION );

		return self::get();
	}

	/**
	 * Staging or live.
	 *
	 * @return array
	 */
	private static function mode() {
		$live = Mode::is_production();

		return self::check(
			'mode',
			__( 'Staging or live', 'text-to-audio' ),
			$live ? 'ok' : 'warn',
			$live
				? __( 'Live: visitors can hear the audio.', 'text-to-audio' )
				: __( 'Staging: only administrators see the player. Go live when you are ready.', 'text-to-audio' ),
			'overview'
		);
	}

	/**
	 * The voice in use can make audio.
	 *
	 * @return array
	 */
	private static function voice() {
		$player_id = (int) TTA_Helper::get_player_id();
		$players   = (array) TTA_Helper::get_available_players();
		$name      = isset( $players[ $player_id ]['name'] ) ? sanitize_text_field( (string) $players[ $player_id ]['name'] ) : (string) $player_id;

		if ( (int) TTA_AtlasVoice_Service::PLAYER_ID === $player_id && ! TTA_AtlasVoice_Service::is_connected() ) {
			return self::check(
				'voice',
				__( 'Voice', 'text-to-audio' ),
				'error',
				__( 'The natural voice is chosen but this site is not connected, so no audio can be made.', 'text-to-audio' ),
				'voice:voice'
			);
		}

		return self::check(
			'voice',
			__( 'Voice', 'text-to-audio' ),
			'ok',
			sprintf(
				/* translators: %s: name of the voice engine, e.g. "Default". */
				__( 'In use: %s.', 'text-to-audio' ),
				$name
			),
			'voice:voice'
		);
	}

	/**
	 * The player is added somewhere.
	 *
	 * @return array
	 */
	private static function placement() {
		$settings = (array) TTA_Helper::tts_get_settings( 'settings' );
		$types    = isset( $settings['tta__settings_allow_listening_for_post_types'] ) ? array_filter( (array) $settings['tta__settings_allow_listening_for_post_types'] ) : array();
		$title    = __( 'Where the player appears', 'text-to-audio' );

		if ( ! $types ) {
			return self::check( 'placement', $title, 'error', __( 'No content type is chosen, so no post gets a player.', 'text-to-audio' ), 'content:where' );
		}

		if ( isset( $settings['tta__settings_enable_button_add'] ) && empty( $settings['tta__settings_enable_button_add'] ) ) {
			return self::check( 'placement', $title, 'info', __( 'The player is not added automatically. It shows only where a shortcode or block adds it.', 'text-to-audio' ), 'content:where' );
		}

		return self::check(
			'placement',
			$title,
			'ok',
			sprintf(
				/* translators: %s: content types, e.g. "post, page". */
				__( 'Added automatically to: %s.', 'text-to-audio' ),
				implode( ', ', array_map( 'sanitize_key', $types ) )
			),
			'content:where'
		);
	}

	/**
	 * Audio files can be written.
	 *
	 * @return array
	 */
	private static function uploads() {
		$uploads = wp_upload_dir( null, false );
		$title   = __( 'Uploads folder', 'text-to-audio' );

		if ( ! empty( $uploads['error'] ) || empty( $uploads['basedir'] ) || ! wp_is_writable( $uploads['basedir'] ) ) {
			return self::check( 'uploads', $title, 'error', __( 'WordPress cannot write to the uploads folder, so audio files cannot be saved. Ask your host to make it writable.', 'text-to-audio' ), '' );
		}

		return self::check( 'uploads', $title, 'ok', __( 'Can be written, so audio files can be saved.', 'text-to-audio' ), '' );
	}

	/**
	 * No visitor's browser blocked a script served from a CDN.
	 *
	 * @return array
	 */
	private static function cdn() {
		$problem = get_option( self::CDN_OPTION );
		$title   = __( 'Scripts on a CDN', 'text-to-audio' );

		if ( is_array( $problem ) && ! empty( $problem['url'] ) ) {
			$host = isset( $problem['script_host'] ) ? sanitize_text_field( (string) $problem['script_host'] ) : '';

			return self::check(
				'cdn',
				$title,
				'error',
				sprintf(
					/* translators: %s: a host name, e.g. cdn.example.com. */
					__( 'A visitor\'s browser blocked an AtlasVoice script served from %s, because that server does not send the Access-Control-Allow-Origin header. Some visitors get no player.', 'text-to-audio' ),
					'' !== $host ? $host : __( 'your CDN', 'text-to-audio' )
				),
				''
			);
		}

		return self::check( 'cdn', $title, 'ok', __( 'No visitor\'s browser reported a blocked script.', 'text-to-audio' ), '' );
	}

	/**
	 * PHP and WordPress.
	 *
	 * @return array
	 */
	private static function environment() {
		return self::check(
			'environment',
			__( 'PHP and WordPress', 'text-to-audio' ),
			'ok',
			sprintf(
				/* translators: 1: PHP version, 2: WordPress version. */
				__( 'PHP %1$s, WordPress %2$s.', 'text-to-audio' ),
				PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION,
				get_bloginfo( 'version' )
			),
			''
		);
	}

	/**
	 * The caching and optimising plugins AtlasVoice adjusts to (TTA_Hooks
	 * keeps its scripts out of their minify, defer and delay), and whether
	 * each is active on this site.
	 *
	 * @return array<int, array{name:string, active:bool, detail:string}>
	 */
	private static function plugins() {
		$known = array(
			'WP Rocket'       => defined( 'WP_ROCKET_VERSION' ),
			'LiteSpeed Cache' => defined( 'LSCWP_V' ),
			'Autoptimize'     => defined( 'AUTOPTIMIZE_PLUGIN_VERSION' ) || class_exists( 'autoptimizeMain', false ),
			'W3 Total Cache'  => defined( 'W3TC' ),
			'WP-Optimize'     => defined( 'WPO_VERSION' ) || class_exists( 'WP_Optimize', false ),
			'Speed Optimizer' => defined( 'SiteGround_Optimizer\VERSION' ),
			'Perfmatters'     => defined( 'PERFMATTERS_VERSION' ),
			'FlyingPress'     => defined( 'FLYING_PRESS_VERSION' ),
		);

		$plugins = array();
		foreach ( $known as $name => $active ) {
			$plugins[] = array(
				'name'   => $name,
				'active' => (bool) $active,
				'detail' => $active
					? __( 'AtlasVoice scripts are kept out of its minify, defer and delay.', 'text-to-audio' )
					: __( 'Not active on this site.', 'text-to-audio' ),
			);
		}

		return $plugins;
	}

	/**
	 * One check.
	 *
	 * @param string $id     Short name.
	 * @param string $title  What is checked.
	 * @param string $status ok, info, warn or error.
	 * @param string $detail What was found.
	 * @param string $route  The screen that fixes it, e.g. "voice:voice", or empty.
	 *
	 * @return array
	 */
	private static function check( $id, $title, $status, $detail, $route ) {
		return compact( 'id', 'title', 'status', 'detail', 'route' );
	}

	/**
	 * Checks as plain data, whatever a filter returned.
	 *
	 * @param mixed $checks The filtered list.
	 *
	 * @return array[]
	 */
	private static function clean( $checks ) {
		$clean = array();

		foreach ( is_array( $checks ) ? $checks : array() as $check ) {
			if ( ! is_array( $check ) || empty( $check['id'] ) || empty( $check['title'] ) ) {
				continue;
			}
			$clean[] = self::check(
				sanitize_key( (string) $check['id'] ),
				wp_strip_all_tags( (string) $check['title'] ),
				// A status this list does not know is shown as a warning, never as fine.
				isset( $check['status'] ) && in_array( $check['status'], self::STATUSES, true ) ? $check['status'] : 'warn',
				isset( $check['detail'] ) ? wp_strip_all_tags( (string) $check['detail'] ) : '',
				isset( $check['route'] ) && is_string( $check['route'] ) && preg_match( '/^[a-z]+(:[a-z]+)?$/', $check['route'] ) ? $check['route'] : ''
			);
		}

		return $clean;
	}
}
