<?php
/**
 * REST routes for the text that is read aloud (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Content\Text;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/text: read which text of a post is read aloud (GET) and
 * change it (POST).
 *
 * The classic `settings` route stays for the classic screen; both read and
 * write the same stored settings.
 */
class Text_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/text',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get which text of a post is read aloud', 'text-to-audio' ),
					'description'         => __( 'Returns whether the title and the excerpt are read, the sentence read before and after every post, and the advanced reading switches. "extras_available" says whether a player on this site applies "numbers" and "as_seen".', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change which text of a post is read aloud', 'text-to-audio' ),
					'description'         => __( 'Changes what is read besides the post content. Send only what should change. Posts whose audio is stored as a file keep their old audio until it is made again.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => self::args(),
				),
			)
		);
	}

	/**
	 * The parts as REST arguments, built from Text::fields().
	 *
	 * @return array
	 */
	public static function args() {
		$args = array();

		foreach ( Text::fields() as $name => $field ) {
			$args[ $name ] = 'bool' === $field['type']
				? array(
					'type'        => 'boolean',
					'description' => $field['description'],
				)
				: array(
					'type'        => 'string',
					'maxLength'   => Text::TEXT_LENGTH,
					'description' => $field['description'],
				);
		}

		return $args;
	}

	/**
	 * Returns the settings.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Text::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with any of the parts.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array_keys( Text::fields() ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Text::save( $fields ) );
	}
}
