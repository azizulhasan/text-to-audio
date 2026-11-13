<?php
/**
 * REST routes for the placement of the player (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Player\Placement;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/placement: read where the player sits and who gets it
 * (GET) and change it (POST).
 *
 * The classic `customize` and `settings` routes stay for the classic
 * screens; all of them read and write the same stored settings.
 */
class Placement_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		$roles = array(
			'type'  => 'array',
			'items' => array( 'type' => 'string' ),
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/placement',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get where the player sits and who gets it', 'text-to-audio' ),
					'description'         => __( 'Returns where the player sits in a post, where it docks while the reader scrolls, which user roles see it, which roles may download the audio, and the roles of this site.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change where the player sits and who gets it', 'text-to-audio' ),
					'description'         => __( 'Changes the position of the player, where it docks, who sees it or who may download the audio. Send only what should change. Visitors see the change on their next page load.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'position' => array(
							'type'        => 'string',
							'enum'        => Placement::POSITIONS,
							'description' => __( 'Where the player sits: before_content, after_content, or manual (only where a shortcode, block or widget adds it).', 'text-to-audio' ),
						),
						'dock'     => array(
							'type'        => 'string',
							'enum'        => Placement::DOCKS,
							'description' => __( 'Where the player docks once the reader scrolls past it: bottom_fixed (full width), bottom_right, bottom_left, sticky_top, or none to keep it in the text.', 'text-to-audio' ),
						),
						'show_to'  => $roles + array(
							'description' => __( 'Who sees the player: ["all"] for everyone, or a list of user roles of this site. With a list of roles, visitors who are not logged in do not see the player.', 'text-to-audio' ),
						),
						'download' => $roles + array(
							'description' => __( 'Who may download the audio file: ["all"] for everyone, or a list of user roles of this site. It applies to players that have a download button.', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the placement.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Placement::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with any of the placement settings.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array( 'position', 'dock', 'show_to', 'download' ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Placement::save( $fields ) );
	}
}
