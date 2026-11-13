<?php
/**
 * REST routes for where the player appears (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Content\Where;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/where: read which posts get a player (GET) and change
 * it (POST).
 *
 * The classic `settings` route stays for the classic screen; both read and
 * write the same stored settings.
 */
class Where_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		$list = array(
			'type'  => 'array',
			'items' => array( 'type' => 'string' ),
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/where',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get which posts get a player', 'text-to-audio' ),
					'description'         => __( 'Returns whether the player is added automatically, to which content types and post statuses, which categories, tags and single posts are skipped, and the content types, statuses, categories and tags of this site that can be chosen.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change which posts get a player', 'text-to-audio' ),
					'description'         => __( 'Changes where the player is added. Send only what should change; a list replaces the stored list. Visitors see the change on their next page load; a page cache may show the old page until it clears.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'automatic'       => array(
							'type'        => 'boolean',
							'description' => __( 'Add the player automatically. Off: it appears only where a shortcode or block adds it.', 'text-to-audio' ),
						),
						'post_types'      => $list + array(
							'description' => __( 'The content types that get a player, by slug, for example ["post","page"]. At least one.', 'text-to-audio' ),
						),
						'statuses'        => $list + array(
							'description' => __( 'The post statuses that get a player, by slug, for example ["publish"]. At least one.', 'text-to-audio' ),
						),
						'skip_categories' => $list + array(
							'description' => __( 'Categories whose posts get no player, by slug.', 'text-to-audio' ),
						),
						'skip_tags'       => $list + array(
							'description' => __( 'Tags whose posts get no player, by slug.', 'text-to-audio' ),
						),
						'skip_posts'      => array(
							'type'        => 'array',
							'items'       => array( 'type' => 'integer' ),
							'maxItems'    => Where::SKIP_POSTS_MAX,
							'description' => __( 'Single posts that get no player, by post number.', 'text-to-audio' ),
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
		return rest_ensure_response( Where::get() );
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

		foreach ( array_keys( Where::FIELDS ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Where::save( $fields ) );
	}
}
