<?php
/**
 * REST routes for the first-run setup (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Setup\Wizard;

defined( 'ABSPATH' ) || exit;

/**
 * The routes tta/v1/setup (read) and tta/v1/setup/finish (end the setup).
 */
class Setup_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/setup',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'Read where the setup stands', 'text-to-audio' ),
				'description'         => __( 'Returns whether the first-run setup is finished, its steps in order, the mode (staging: only administrators get the player; production: every visitor does), the voice in use, and the newest published post to try the player on (title, the first words as plain text, address, language). It changes nothing. Takes no parameters.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(),
			)
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/setup/finish',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'label'               => __( 'Finish the setup', 'text-to-audio' ),
				'description'         => __( 'Marks the first-run setup as finished and returns where it stands. With "go_live" true, every visitor gets the player from now on; with false the site stays in staging, where only administrators get it; without it the mode is not changed. No other setting is changed.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'finish' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'go_live' => array(
						'type'        => 'boolean',
						'description' => __( 'True: visitors get the player now. False: stay in staging. Leave out to keep the mode.', 'text-to-audio' ),
					),
				),
			)
		);
	}

	/**
	 * Returns where the setup stands.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Wizard::get() );
	}

	/**
	 * Ends the setup.
	 *
	 * @param \WP_REST_Request $request Request with an optional go_live.
	 *
	 * @return \WP_REST_Response
	 */
	public static function finish( $request ) {
		$go_live = $request->get_param( 'go_live' );

		return rest_ensure_response( Wizard::finish( null === $go_live ? null : rest_sanitize_boolean( $go_live ) ) );
	}
}
