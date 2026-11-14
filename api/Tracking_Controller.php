<?php
/**
 * REST routes for the tracking settings (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Insights\Tracking;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/tracking: read whether plays are counted (GET) and
 * change it (POST).
 *
 * The classic analytics-settings routes stay for the classic screen; all
 * of them read and write the same stored settings.
 */
class Tracking_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/tracking',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get whether plays are counted', 'text-to-audio' ),
					'description'         => __( 'Returns whether plays are counted on this site, whether the country of a listener is looked up, and which posts are tracked.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change whether plays are counted', 'text-to-audio' ),
					'description'         => __( 'Changes the tracking settings. Send only what should change. Plays are counted on the site itself. Turning "listener_location" on sends visitor IP addresses to a lookup service, so only the site owner should turn it on, and the privacy policy should say so.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'count_plays'       => array(
							'type'        => 'boolean',
							'description' => __( 'Count plays and listening time. Off: nothing about visitors is stored.', 'text-to-audio' ),
						),
						'listener_location' => array(
							'type'        => 'boolean',
							'description' => __( 'Look up the country and city of a listener from the IP address, with a lookup service outside this site.', 'text-to-audio' ),
						),
						'posts'             => array(
							'type'        => 'array',
							'items'       => array( 'type' => array( 'string', 'integer' ) ),
							'maxItems'    => Tracking::POSTS_MAX,
							'description' => __( 'The posts to track: ["all"] for every post, or a list of post numbers.', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the settings.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Tracking::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with any of the settings.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array_keys( Tracking::FIELDS ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Tracking::save( $fields ) );
	}
}
