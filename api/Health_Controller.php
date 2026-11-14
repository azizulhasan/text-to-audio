<?php
/**
 * REST routes for the health checks (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Site\Health;

defined( 'ABSPATH' ) || exit;

/**
 * The routes tta/v1/health (read the checks) and tta/v1/health/cdn-fixed
 * (forget a script problem after the CDN was fixed).
 */
class Health_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/health',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'Check the health of AtlasVoice on this site', 'text-to-audio' ),
				'description'         => __( 'Returns what could keep visitors from hearing the audio: staging or live, the voice in use, where the player appears, whether the uploads folder can be written, a blocked script on a CDN, PHP and WordPress versions, and the caching plugins AtlasVoice adjusts to. Each check has a status (ok, info, warn or error) and a sentence. It changes nothing and calls no other server.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/health/cdn-fixed',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'label'               => __( 'Say that the CDN was fixed', 'text-to-audio' ),
				'description'         => __( 'Forgets the blocked-script problem a visitor\'s browser reported, after the CDN was changed to send the Access-Control-Allow-Origin header. If the problem is still there, the next visitor who meets it reports it again.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'cdn_fixed' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);
	}

	/**
	 * Returns the checks.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Health::get() );
	}

	/**
	 * Forgets the CDN problem.
	 *
	 * @return \WP_REST_Response
	 */
	public static function cdn_fixed() {
		return rest_ensure_response( Health::forget_cdn_problem() );
	}
}
