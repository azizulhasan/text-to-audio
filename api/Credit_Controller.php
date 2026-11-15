<?php
/**
 * REST routes for the credit line of the player (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Player\Credit;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/credit: read whether the player says "Voiced by
 * AtlasVoice" (GET) and change it (POST).
 */
class Credit_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/credit',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get the credit line of the player', 'text-to-audio' ),
					'description'         => __( 'Returns whether the line "Voiced by AtlasVoice" is turned on, its text, whether this site can show it, and whether visitors see it with the voice in use now. It is off unless the site owner turned it on.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change the credit line of the player', 'text-to-audio' ),
					'description'         => __( 'Turns the line "Voiced by AtlasVoice" under the free natural-voice player on or off. Visitors see the change on their next page load.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'enabled' => array(
							'type'        => 'boolean',
							'required'    => true,
							'description' => __( 'Show the line under the player.', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the setting.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Credit::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with enabled.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		return rest_ensure_response( Credit::save( array( 'enabled' => $request->get_param( 'enabled' ) ) ) );
	}
}
