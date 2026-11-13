<?php
/**
 * REST route for the shortcode and block reference (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Player\Embed;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/embed: how to place a player by hand. It only reads.
 */
class Embed_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/embed',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'How to place an AtlasVoice player by hand', 'text-to-audio' ),
				'description'         => __( 'Returns the shortcode that places a player in a post, a page builder or a template, every option the shortcode accepts with an example, and the name of the block. It changes nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);
	}

	/**
	 * Returns the reference.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Embed::get() );
	}
}
