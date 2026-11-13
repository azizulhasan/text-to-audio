<?php
/**
 * REST routes for the AI notice of the player (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Player\AI_Notice;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/ai-notice: read whether the player says its voice is
 * made by AI (GET) and change it (POST).
 */
class AI_Notice_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/ai-notice',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get the AI notice of the player', 'text-to-audio' ),
					'description'         => __( 'Returns whether a line next to the player tells listeners the voice is made by AI, its text, its position, and the default sentence.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change the AI notice of the player', 'text-to-audio' ),
					'description'         => __( 'Turns the AI notice on or off, or changes its text or position. Send only what should change. Visitors see the change on their next page load.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'enabled'  => array(
							'type'        => 'boolean',
							'description' => __( 'Show the notice next to the player.', 'text-to-audio' ),
						),
						'text'     => array(
							'type'        => 'string',
							'maxLength'   => AI_Notice::TEXT_LENGTH,
							'description' => __( 'The notice. Send an empty text to use the default sentence, which is shown in the language of the page.', 'text-to-audio' ),
						),
						'position' => array(
							'type'        => 'string',
							'enum'        => AI_Notice::POSITIONS,
							'description' => __( 'Where the notice sits: "before" is above the player, "after" is below it.', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the settings.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( AI_Notice::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with any of enabled, text, position.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array( 'enabled', 'text', 'position' ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( AI_Notice::save( $fields ) );
	}
}
