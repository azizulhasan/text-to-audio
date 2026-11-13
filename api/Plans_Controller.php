<?php
/**
 * REST route for the AtlasVoice Pro plans (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\Account\Plans;
use TTA\AtlasVoice\RestRoutes;

defined( 'ABSPATH' ) || exit;

/**
 * GET tta/v1/plans: the Pro plans with their prices and the links to buy,
 * compare, hear a demo and read the refund policy.
 *
 * Read-only. It sells nothing and changes nothing.
 */
class Plans_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/plans',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'AtlasVoice Pro plans', 'text-to-audio' ),
				'description'         => __( 'Lists the AtlasVoice Pro plans: how many sites each covers, the yearly and lifetime price in US dollars, the checkout links, and links to the pricing page, the demo and the refund policy. It changes nothing and buys nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);
	}

	/**
	 * Returns the plans.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Plans::all() );
	}
}
