<?php
/**
 * REST routes for the privacy facts of AtlasVoice (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Site\Privacy;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/privacy: read what AtlasVoice keeps and shares (GET) and
 * turn sharing anonymous usage data on or off (POST).
 */
class Privacy_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/privacy',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get the privacy facts of AtlasVoice', 'text-to-audio' ),
					'description'         => __( 'Returns where the suggested privacy policy text is, where one person\'s data is exported or erased, how many listening records the site holds, and whether anonymous usage data is shared with AtlasAiDev.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Turn sharing anonymous usage data on or off', 'text-to-audio' ),
					'description'         => __( 'Changes whether AtlasVoice shares anonymous usage data (plugin settings, PHP and WordPress versions; no post content, no visitor data) with AtlasAiDev. On: the first report is sent now and then weekly. Off: nothing more is sent. Only the site owner should turn it on.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'usage_sharing' => array(
							'type'        => 'boolean',
							'description' => __( 'Share anonymous usage data with AtlasAiDev.', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the facts.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Privacy::get() );
	}

	/**
	 * Saves the choice.
	 *
	 * @param \WP_REST_Request $request Request with usage_sharing.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		if ( null !== $request->get_param( 'usage_sharing' ) ) {
			$fields['usage_sharing'] = $request->get_param( 'usage_sharing' );
		}

		return rest_ensure_response( Privacy::save( $fields ) );
	}
}
