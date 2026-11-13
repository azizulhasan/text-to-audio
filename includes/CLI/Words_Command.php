<?php
/**
 * `wp atlasvoice words`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Player\Words;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes the words, tooltips and icons of the player button.
 */
class Words_Command {

	/**
	 * Shows the text, tooltip and icon of each state of the button.
	 *
	 * ## OPTIONS
	 *
	 * [--format=<format>]
	 * : How to print it.
	 * ---
	 * default: list
	 * options:
	 *   - list
	 *   - json
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice words get
	 *     show icon: on
	 *     player 1 listen: "Listen" | tooltip "Click to listen post." | icon preset:play
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function get( $args, $assoc_args ) {
		$words = Words::get();

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			// The drawings of the icons are for the screen; a script needs their ids.
			$words['icons'] = wp_list_pluck( $words['icons'], 'id' );
			\WP_CLI::line( (string) wp_json_encode( $words ) );

			return;
		}

		\WP_CLI::line( 'show icon: ' . ( $words['show_icon'] ? 'on' : 'off' ) );
		foreach ( $words['players'] as $id => $states ) {
			foreach ( $states as $state => $parts ) {
				\WP_CLI::line( sprintf( 'player %1$d %2$s: "%3$s" | tooltip "%4$s" | icon %5$s', $id, $state, $parts['text'], $parts['tooltip'], $parts['icon'] ) );
			}
		}
	}

	/**
	 * Changes one state of the button, or whether the icon is shown.
	 *
	 * Visitors see the change on their next page load.
	 *
	 * ## OPTIONS
	 *
	 * [<state>]
	 * : The state to change: listen, pause, resume or replay.
	 *
	 * [--player=<number>]
	 * : The player the words belong to. 1 is the browser voice button.
	 * ---
	 * default: 1
	 * ---
	 *
	 * [--text=<text>]
	 * : The word on the button.
	 *
	 * [--tooltip=<text>]
	 * : The text shown on hover and read by screen readers.
	 *
	 * [--icon=<icon>]
	 * : The icon: play, pause, stop, replay, headphones, ear, volume-up or
	 * volume-mute.
	 *
	 * [--show-icon=<on-or-off>]
	 * : Show the icon next to the text: on or off.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice words set listen --text="Listen to this article" --icon=headphones
	 *     Success: Words saved.
	 *
	 *     $ wp atlasvoice words set --show-icon=off
	 *     Success: Words saved.
	 *
	 * @param array $args       Positional arguments: the state.
	 * @param array $assoc_args Flags: player, text, tooltip, icon, show-icon.
	 */
	public function set( $args, $assoc_args ) {
		$fields = array();
		$parts  = array();

		foreach ( array( 'text', 'tooltip' ) as $part ) {
			if ( isset( $assoc_args[ $part ] ) ) {
				$parts[ $part ] = (string) $assoc_args[ $part ];
			}
		}
		if ( isset( $assoc_args['icon'] ) ) {
			$icon          = (string) $assoc_args['icon'];
			$parts['icon'] = false === strpos( $icon, ':' ) ? 'preset:' . $icon : $icon;
		}

		if ( $parts ) {
			if ( empty( $args[0] ) ) {
				\WP_CLI::error( 'Say which state to change: listen, pause, resume or replay.' );

				return;
			}
			$player            = isset( $assoc_args['player'] ) ? $assoc_args['player'] : 1;
			$fields['players'] = array( $player => array( (string) $args[0] => $parts ) );
		}

		if ( isset( $assoc_args['show-icon'] ) ) {
			$fields['show_icon'] = $assoc_args['show-icon'];
		}

		$saved = Words::save( $fields );

		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );

			return;
		}

		\WP_CLI::success( 'Words saved.' );
	}
}
