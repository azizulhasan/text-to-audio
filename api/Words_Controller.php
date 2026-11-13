<?php
/**
 * REST routes for the words on the buttons of the player (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Player\Words;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/words: read the words, tooltips and icons of the player
 * button (GET) and change them (POST).
 *
 * The classic `customize` and `settings` routes stay for the classic
 * screens; all of them read and write the same stored settings.
 */
class Words_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/words',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get the words and icons of the player button', 'text-to-audio' ),
					'description'         => __( 'Returns the text, tooltip and icon of the player button in each state (listen, pause, resume, replay) per player, whether the icon is shown, the icons that can be chosen, and whether the voice in use has a button with words.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change the words and icons of the player button', 'text-to-audio' ),
					'description'         => __( 'Changes the text, tooltip or icon of a state of the player button, or whether the icon is shown. Send only what should change. Visitors see the change on their next page load.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'show_icon' => array(
							'type'        => 'boolean',
							'description' => __( 'Show the icon next to the text of the button.', 'text-to-audio' ),
						),
						'players'   => array(
							'type'        => 'object',
							'description' => __( 'The words per player: an object with the player number (1 is the browser voice button) as key, holding an object per state (listen, pause, resume, replay) with any of "text", "tooltip" and "icon". An icon is one of the ids in "icons" of the GET answer, for example "preset:headphones". Example: {"1":{"listen":{"text":"Listen to this article"}}}.', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the words.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Words::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with show_icon, players or both.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array( 'show_icon', 'players' ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Words::save( $fields ) );
	}
}
