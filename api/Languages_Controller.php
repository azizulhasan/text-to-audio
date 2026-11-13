<?php
/**
 * REST route for the languages of the site (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Voice\Languages;

defined( 'ABSPATH' ) || exit;

/**
 * GET tta/v1/languages: the language the posts are read in, and the
 * translation plugins of the site with the languages they add.
 *
 * Read-only.
 */
class Languages_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/languages',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'AtlasVoice languages', 'text-to-audio' ),
				'description'         => __( 'Shows the language the posts are read in, and the translation plugins found on the site (WPML, Polylang, TranslatePress, GTranslate) with the languages each adds and whether it translates on the server or in the visitor\'s browser. It changes nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);
	}

	/**
	 * Returns the languages.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Languages::get() );
	}
}
