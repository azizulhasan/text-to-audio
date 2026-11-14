<?php
/**
 * REST route for the listening numbers (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Insights\Report;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/report: how much the audio is listened to in a period.
 * It only reads, and returns sums only: no single listener.
 *
 * The classic insights routes stay for the classic screen.
 */
class Report_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/report',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'Get how much the audio is listened to', 'text-to-audio' ),
				'description'         => __( 'Returns the listening numbers of a period: plays, listening time in seconds, finished plays, downloads, listeners, how far people listened, the most played posts, and plays per hour of the day. Sums only: no single listener is in the answer. It changes nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'range' => array(
						'type'        => 'string',
						'enum'        => Report::RANGES,
						'default'     => '30',
						'description' => __( 'The period: the last 7, 30 or 90 days, or "all" for everything.', 'text-to-audio' ),
					),
				),
			)
		);
	}

	/**
	 * Returns the report.
	 *
	 * @param \WP_REST_Request $request Request with range.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function read( $request ) {
		return rest_ensure_response( Report::get( $request->get_param( 'range' ) ) );
	}
}
