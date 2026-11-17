<?php
/**
 * REST route for the voices AtlasVoice Cloud offers (TTS-378).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Cloud\Voices;

defined( 'ABSPATH' ) || exit;

/**
 * GET tta/v1/cloud/voices: the voices of AtlasVoice Cloud, as the service
 * lists them, optionally for one language or one engine.
 *
 * Read-only. The project key is not sent for it.
 */
class Cloud_Voices_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/cloud/voices',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'AtlasVoice Cloud voices', 'text-to-audio' ),
				'description'         => __( 'Lists the voices AtlasVoice Cloud offers, as the service reports them: each voice\'s id, engine, language and name. It can be narrowed to one language or one engine. It changes nothing; the list is kept for a few hours.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'language' => array(
						'type'        => 'string',
						'default'     => '',
						'maxLength'   => 35,
						'description' => __( 'Only voices of this language, for example "en" or "pt-br". Empty lists every language.', 'text-to-audio' ),
					),
					'engine'   => array(
						'type'        => 'string',
						'default'     => '',
						'maxLength'   => 35,
						'description' => __( 'Only voices of this engine, for example "gtts". Empty lists every engine.', 'text-to-audio' ),
					),
					'refresh'  => array(
						'type'        => 'boolean',
						'default'     => false,
						'description' => __( 'Ask AtlasVoice Cloud now instead of using the list kept for a few hours.', 'text-to-audio' ),
					),
				),
			)
		);
	}

	/**
	 * Returns the voices.
	 *
	 * @param \WP_REST_Request $request Request with the optional language, engine and refresh.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read( $request ) {
		return rest_ensure_response(
			Voices::get(
				(string) $request->get_param( 'language' ),
				(string) $request->get_param( 'engine' ),
				(bool) $request->get_param( 'refresh' )
			)
		);
	}
}
