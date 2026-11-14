<?php
/**
 * REST route for the other AtlasAiDev plugins (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Help\More_Plugins;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/more-plugins. It only reads, and it fetches nothing.
 */
class More_Plugins_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/more-plugins',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'List the other AtlasAiDev plugins', 'text-to-audio' ),
				'description'         => __( 'Returns the other free AtlasAiDev plugins with a name, a one-line description, whether each is installed and active on this site, its WordPress.org page, and the address of the WordPress installer for it. It changes nothing, installs nothing and fetches nothing from another site. Takes no parameters.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(),
			)
		);
	}

	/**
	 * Returns the list.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( More_Plugins::get() );
	}
}
