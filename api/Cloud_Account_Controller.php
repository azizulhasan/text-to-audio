<?php
/**
 * REST route for the site's AtlasVoice Cloud account (TTS-378).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Cloud\Account;

defined( 'ABSPATH' ) || exit;

/**
 * GET tta/v1/cloud/account: the plan, engines, allowance, limits and
 * licence state of this site, as AtlasVoice Cloud reports them.
 *
 * Read-only. The project key is never part of the answer.
 */
class Cloud_Account_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/cloud/account',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'AtlasVoice Cloud account', 'text-to-audio' ),
				'description'         => __( 'Shows this site\'s AtlasVoice Cloud account: whether it is connected, its plan, the voice engines it may use, how many characters are used and left, its limits and its licence state. It changes nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'refresh' => array(
						'type'        => 'boolean',
						'default'     => false,
						'description' => __( 'Ask AtlasVoice Cloud now instead of using the answer kept for a few minutes.', 'text-to-audio' ),
					),
				),
			)
		);
	}

	/**
	 * Returns the account.
	 *
	 * @param \WP_REST_Request $request Request with the optional `refresh` flag.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read( $request ) {
		return rest_ensure_response( Account::get( (bool) $request->get_param( 'refresh' ) ) );
	}
}
