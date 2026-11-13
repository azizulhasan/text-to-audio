<?php
/**
 * REST routes for this site's connection to AtlasVoice Cloud (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Cloud\Connection;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/cloud/connection: read the connection (GET), connect
 * (POST), disconnect (DELETE). The project key is never part of an answer.
 *
 * The classic `atlasvoice-service` routes stay for the classic screens;
 * both act on the same stored connection.
 */
class Cloud_Connection_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/cloud/connection',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'AtlasVoice Cloud connection', 'text-to-audio' ),
					'description'         => __( 'Shows whether this site is connected to AtlasVoice Cloud, the email it is connected with, the first characters of its key, its plan, and whether it waits for approval or was disconnected. It changes nothing.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'refresh' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Ask AtlasVoice Cloud for the current state first.', 'text-to-audio' ),
						),
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Connect to AtlasVoice Cloud', 'text-to-audio' ),
					'description'         => __( 'Connects this site to AtlasVoice Cloud for the natural voice. It sends the site address, the site name and the email to AtlasVoice Cloud and stores the key it returns. From then on, the text of a post is sent to make its audio. Only call it when the site owner has agreed to that: "consent" must be true.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'connect' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'email'             => array(
							'type'        => 'string',
							'format'      => 'email',
							'required'    => true,
							'description' => __( 'Where AtlasVoice may contact the site owner about the service.', 'text-to-audio' ),
						),
						'consent'           => array(
							'type'        => 'boolean',
							'required'    => true,
							'description' => __( 'Must be true: the site owner agrees that post text is sent to AtlasVoice Cloud to make the audio.', 'text-to-audio' ),
						),
						'takeover'          => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Move a site that is registered to another email to this email. AtlasVoice Cloud checks a one-time code on this site first, so the site must be reachable from the internet.', 'text-to-audio' ),
						),
						'share_diagnostics' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Also share diagnostic data with AtlasAiDev. Only when the site owner chose this.', 'text-to-audio' ),
						),
					),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'label'               => __( 'Disconnect from AtlasVoice Cloud', 'text-to-audio' ),
					'description'         => __( 'Disconnects this site from AtlasVoice Cloud and forgets its key. New audio then uses the browser voice. Audio that is already made is kept and keeps playing.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'disconnect' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
			)
		);
	}

	/**
	 * Returns the connection.
	 *
	 * @param \WP_REST_Request $request Request with the optional `refresh` flag.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read( $request ) {
		return rest_ensure_response( Connection::state( (bool) $request->get_param( 'refresh' ) ) );
	}

	/**
	 * Connects the site.
	 *
	 * @param \WP_REST_Request $request Request with email, consent, takeover, share_diagnostics.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function connect( $request ) {
		return rest_ensure_response(
			Connection::connect(
				(string) $request->get_param( 'email' ),
				true === $request->get_param( 'consent' ),
				(bool) $request->get_param( 'takeover' ),
				(bool) $request->get_param( 'share_diagnostics' )
			)
		);
	}

	/**
	 * Disconnects the site.
	 *
	 * @return \WP_REST_Response
	 */
	public static function disconnect() {
		return rest_ensure_response( Connection::disconnect() );
	}
}
