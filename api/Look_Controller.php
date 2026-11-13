<?php
/**
 * REST routes for the look of the player (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Player\Look;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/look: read the colours, size, border and spacing of the
 * player (GET) and change them (POST).
 *
 * The classic `customize` route stays for the classic screen; both read and
 * write the same stored settings.
 */
class Look_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/look',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get how the player looks', 'text-to-audio' ),
					'description'         => __( 'Returns the colours of the player, its height, width, text size, border, corner radius and the space around it.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change how the player looks', 'text-to-audio' ),
					'description'         => __( 'Changes colours, sizes, the border or the space around the player. Send only what should change. Visitors see the change on their next page load.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => self::args(),
				),
			)
		);
	}

	/**
	 * The parts of the look as REST arguments, built from Look::fields().
	 *
	 * @return array
	 */
	public static function args() {
		$args = array();

		foreach ( Look::fields() as $name => $field ) {
			if ( 'color' === $field['type'] ) {
				$args[ $name ] = array(
					'type'        => 'string',
					'pattern'     => '^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$',
					'description' => $field['description'],
				);
				continue;
			}

			$args[ $name ] = array(
				'type'        => 'integer',
				'minimum'     => $field['min'],
				'maximum'     => $field['max'],
				'description' => $field['description'],
			);
		}

		return $args;
	}

	/**
	 * Returns the look.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Look::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with any part of the look.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array_keys( Look::fields() ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Look::save( $fields ) );
	}
}
