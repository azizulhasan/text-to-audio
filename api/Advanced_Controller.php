<?php
/**
 * REST routes for the advanced settings (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Site\Advanced;

defined( 'ABSPATH' ) || exit;

/**
 * The routes tta/v1/advanced (read and change the advanced switches) and
 * tta/v1/advanced/clear-cache (clear AtlasVoice's cache).
 *
 * The classic `settings` route stays for the classic screen; both read and
 * write the same stored settings.
 */
class Advanced_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		$args = array();
		foreach ( Advanced::fields() as $name => $field ) {
			$args[ $name ] = array(
				'type'        => 'boolean',
				'description' => $field['description'],
			);
		}

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/advanced',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get the advanced settings of AtlasVoice', 'text-to-audio' ),
					'description'         => __( 'Returns the advanced switches: what shows in the WordPress toolbar and dashboard, how the browser voice behaves when the listener changes tabs, and whether all data is deleted with the plugin.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change the advanced settings of AtlasVoice', 'text-to-audio' ),
					'description'         => __( 'Turns advanced switches on or off. Send only what should change.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => $args,
				),
			)
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/advanced/clear-cache',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'label'               => __( 'Clear the cache of AtlasVoice', 'text-to-audio' ),
				'description'         => __( 'Clears what AtlasVoice keeps cached, such as its settings and its lists of categories and content types. No setting, statistic or audio file is removed.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'clear_cache' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);
	}

	/**
	 * Returns the settings.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Advanced::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with any of the switches.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array_keys( Advanced::fields() ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Advanced::save( $fields ) );
	}

	/**
	 * Clears the cache.
	 *
	 * @return \WP_REST_Response
	 */
	public static function clear_cache() {
		return rest_ensure_response( Advanced::clear_cache() );
	}
}
