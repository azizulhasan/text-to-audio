<?php
/**
 * REST routes of the Home screen (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Home\Summary;

defined( 'ABSPATH' ) || exit;

/**
 * GET tta/v1/home: the state of AtlasVoice on this site, in one read.
 * POST tta/v1/home/dismiss: hides one item of Home for the current user.
 */
class Home_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/home',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'AtlasVoice status', 'text-to-audio' ),
				'description'         => __( 'Shows how AtlasVoice is set up on this site: whether visitors can hear the posts (live) or only administrators (staging), whether setup is finished, which voice engine, language and voice read the posts, where the player is placed and who sees it, and which content types are read. It reads saved settings only and changes nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/home/dismiss',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'label'               => __( 'Hide an item of the AtlasVoice Home screen', 'text-to-audio' ),
				'description'         => __( 'Hides one item of the Home screen for the current user for 30 days. It changes no setting of the site.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'dismiss' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'item' => array(
						'type'        => 'string',
						'required'    => true,
						'enum'        => Summary::DISMISSIBLE,
						'description' => __( 'What to hide: "pro_card" is the card about AtlasVoice Pro.', 'text-to-audio' ),
					),
				),
			)
		);
	}

	/**
	 * Returns the summary.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Summary::get() );
	}

	/**
	 * Hides an item for the current user.
	 *
	 * @param \WP_REST_Request $request Request with `item`.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function dismiss( $request ) {
		$done = Summary::dismiss( (string) $request->get_param( 'item' ) );

		if ( is_wp_error( $done ) ) {
			return $done;
		}

		return rest_ensure_response( array( 'hidden' => Summary::hidden_for( get_current_user_id() ) ) );
	}
}
