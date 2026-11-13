<?php
/**
 * REST route for the site's own voice providers (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Voice\Providers;

defined( 'ABSPATH' ) || exit;

/**
 * GET tta/v1/providers: which outside providers the site can use with its
 * own account, and whether each is connected. Never a key.
 *
 * Read-only.
 */
class Providers_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/providers',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'AtlasVoice own providers', 'text-to-audio' ),
				'description'         => __( 'Shows which outside providers this site can use with its own account (Google Cloud Text-to-Speech, OpenAI, ElevenLabs, Google Cloud Storage) and whether each is connected. It never returns a key and changes nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);
	}

	/**
	 * Returns the providers.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Providers::get() );
	}
}
