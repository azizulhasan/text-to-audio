<?php
/**
 * Curated SVG icon presets for the player button states.
 *
 * Single source of truth for the React icon picker (mirrored client-side
 * via state-presets.js) and for the front-end button rendering.
 *
 * Each entry is a stroke-based heroicons-style SVG with no inline fill so
 * the existing CSS can colour it via `currentColor` or via the `$color`
 * placeholder used by TTA_Admin::player_customizations.
 *
 * @package TTA
 */

namespace TTA;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class TTA_Player_Icons {

	/**
	 * Return the curated preset map: name => SVG markup.
	 *
	 * SVGs use `currentColor` so they inherit the button text colour. They
	 * also accept a `$color` placeholder (legacy compatibility with the
	 * existing player_customizations payload).
	 *
	 * @return array<string,string>
	 */
	public static function presets() {
		$c = '$color'; // placeholder for back-compat with TTA_Admin payload.
		return [
			'play'        => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' . $c . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4" fill="' . $c . '"/></svg>',
			'pause'       => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="' . $c . '" stroke="' . $c . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
			'stop'        => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="' . $c . '" stroke="' . $c . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
			'replay'      => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' . $c . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
			'headphones'  => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' . $c . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
			'ear'         => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' . $c . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/></svg>',
			'volume-up'   => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' . $c . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="' . $c . '"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
			'volume-mute' => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' . $c . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="' . $c . '"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
		];
	}

	/**
	 * Resolve an icon descriptor (e.g. "preset:play" or "custom:<svg>") to
	 * an SVG string. Unknown/empty descriptors return an empty string.
	 *
	 * @param string $icon
	 * @return string
	 */
	public static function resolve( $icon ) {
		if ( ! is_string( $icon ) || '' === $icon ) {
			return '';
		}
		if ( 0 === strpos( $icon, 'preset:' ) ) {
			$key      = substr( $icon, 7 );
			$presets  = self::presets();
			return $presets[ $key ] ?? '';
		}
		if ( 0 === strpos( $icon, 'custom:' ) ) {
			return self::sanitize_svg( substr( $icon, 7 ) );
		}
		// Raw SVG string fallback.
		return self::sanitize_svg( $icon );
	}

	/**
	 * Sanitize a user-supplied SVG using wp_kses with an SVG whitelist.
	 *
	 * @param string $svg
	 * @return string
	 */
	public static function sanitize_svg( $svg ) {
		if ( ! is_string( $svg ) || '' === trim( $svg ) ) {
			return '';
		}
		$allowed = [
			'svg'      => [
				'xmlns'       => true,
				'viewbox'     => true,
				'width'       => true,
				'height'      => true,
				'fill'        => true,
				'stroke'      => true,
				'stroke-width' => true,
				'class'       => true,
			],
			'g'        => [ 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'transform' => true, 'opacity' => true ],
			'path'     => [ 'd' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true, 'opacity' => true ],
			'circle'   => [ 'cx' => true, 'cy' => true, 'r' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ],
			'rect'     => [ 'x' => true, 'y' => true, 'width' => true, 'height' => true, 'rx' => true, 'ry' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ],
			'line'     => [ 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true ],
			'polyline' => [ 'points' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true ],
			'polygon'  => [ 'points' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ],
			'ellipse'  => [ 'cx' => true, 'cy' => true, 'rx' => true, 'ry' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ],
			'title'    => [],
		];
		return wp_kses( $svg, $allowed );
	}

	/**
	 * Default per-player state map used when option is empty.
	 *
	 * @return array<int, array<string, array{text:string, hover:string, icon:string}>>
	 */
	public static function default_players() {
		return [
			1 => self::default_state_set( __( 'Click to listen post.', 'text-to-audio' ) ),
			2 => self::default_state_set( __( 'Click to listen post.', 'text-to-audio' ) ),
		];
	}

	private static function default_state_set( $listen_hover ) {
		return [
			'listen' => [ 'text' => __( 'Listen', 'text-to-audio' ), 'hover' => $listen_hover, 'icon' => 'preset:play' ],
			'pause'  => [ 'text' => __( 'Pause', 'text-to-audio' ),  'hover' => __( 'Pause playback', 'text-to-audio' ), 'icon' => 'preset:pause' ],
			'resume' => [ 'text' => __( 'Resume', 'text-to-audio' ), 'hover' => __( 'Resume playback', 'text-to-audio' ), 'icon' => 'preset:play' ],
			'replay' => [ 'text' => __( 'Replay', 'text-to-audio' ), 'hover' => __( 'Click to listen post.', 'text-to-audio' ), 'icon' => 'preset:replay' ],
		];
	}

	/**
	 * Sanitize a per-player state map coming from the REST endpoint.
	 *
	 * @param mixed $players
	 * @return array
	 */
	public static function sanitize_players( $players ) {
		if ( ! is_array( $players ) ) {
			return [];
		}
		$out      = [];
		$defaults = self::default_players();
		foreach ( $players as $player_id => $states ) {
			$pid = (int) $player_id;
			if ( $pid < 1 || $pid > 2 ) { // phase 1 scope.
				continue;
			}
			if ( ! is_array( $states ) ) {
				continue;
			}
			$out[ $pid ] = [];
			$state_keys  = [ 'listen', 'pause', 'resume', 'replay' ];
			foreach ( $state_keys as $sk ) {
				$state             = $states[ $sk ] ?? [];
				$default_state     = $defaults[ $pid ][ $sk ];
				$out[ $pid ][ $sk ] = [
					'text'  => isset( $state['text'] ) ? sanitize_text_field( (string) $state['text'] ) : $default_state['text'],
					'hover' => isset( $state['hover'] ) ? sanitize_text_field( (string) $state['hover'] ) : $default_state['hover'],
					'icon'  => self::sanitize_icon_descriptor( $state['icon'] ?? $default_state['icon'] ),
				];
			}
		}
		return $out;
	}

	private static function sanitize_icon_descriptor( $icon ) {
		if ( ! is_string( $icon ) ) {
			return 'preset:play';
		}
		if ( 0 === strpos( $icon, 'preset:' ) ) {
			$key     = substr( $icon, 7 );
			$presets = self::presets();
			return isset( $presets[ $key ] ) ? $icon : 'preset:play';
		}
		if ( 0 === strpos( $icon, 'custom:' ) ) {
			$svg = self::sanitize_svg( substr( $icon, 7 ) );
			return $svg ? 'custom:' . $svg : 'preset:play';
		}
		return 'preset:play';
	}
}
