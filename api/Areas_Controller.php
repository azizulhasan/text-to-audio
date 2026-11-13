<?php
/**
 * REST routes for the part of a page that is read aloud (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Content\Areas;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/areas: read the reading rules (GET) and change the rule
 * of the whole site (POST).
 *
 * The rule of one content type or one post is set on a page with the
 * picker, through the existing `atlasvoice/save-rule` route.
 */
class Areas_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		$list = array(
			'type'     => 'array',
			'items'    => array( 'type' => 'string' ),
			'maxItems' => Areas::LIST_MAX,
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/areas',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get which part of a page is read aloud', 'text-to-audio' ),
					'description'         => __( 'Returns the reading rule of the whole site (the CSS selector of the article text, and the areas, element types and phrases that are skipped), the rules stored for single content types, and whether those are applied on this site.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change which part of a page is read aloud', 'text-to-audio' ),
					'description'         => __( 'Changes the reading rule of the whole site. Send only what should change; a list replaces the stored list. Posts whose audio is stored as a file keep their old audio until it is made again.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'selector'     => array(
							'type'        => 'string',
							'maxLength'   => Areas::SELECTOR_LENGTH,
							'description' => __( 'The CSS selector of the article text, for example ".entry-content". Empty lets the player find the text itself.', 'text-to-audio' ),
						),
						'skip_areas'   => $list + array(
							'description' => __( 'Parts inside the text that are not read, as CSS selectors, for example [".share-bar",".author-box"].', 'text-to-audio' ),
						),
						'skip_tags'    => $list + array(
							'description' => __( 'Element types that are not read, by name, for example ["figure","aside","table"].', 'text-to-audio' ),
						),
						'skip_phrases' => $list + array(
							'description' => __( 'Exact texts that are never read, for example ["Share this","Read more"].', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the rules.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Areas::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with any part of the rule.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array_keys( Areas::FIELDS ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Areas::save( $fields ) );
	}
}
