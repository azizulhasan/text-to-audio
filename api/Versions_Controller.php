<?php
/**
 * REST routes for the versions of AtlasVoice (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Site\Versions;

defined( 'ABSPATH' ) || exit;

/**
 * The routes tta/v1/versions (read the installed and the older versions)
 * and tta/v1/versions/auto-update (switch automatic updates).
 *
 * No route here replaces plugin files: going back to an older version stays
 * on the classic Versions screen.
 */
class Versions_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/versions',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'Get the versions of AtlasVoice', 'text-to-audio' ),
				'description'         => __( 'Returns the installed version of AtlasVoice (and of AtlasVoice Pro), whether each updates itself, and the older versions with whether each is safe for this site, works with changes, or is blocked and why. It changes nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
			)
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/versions/auto-update',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'label'               => __( 'Turn automatic updates of AtlasVoice on or off', 'text-to-audio' ),
				'description'         => __( 'Changes whether WordPress installs new versions of AtlasVoice, or of AtlasVoice Pro, by itself. It is the same switch as "Enable auto-updates" on the Plugins screen.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'auto_update' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'plugin' => array(
						'type'        => 'string',
						'required'    => true,
						'enum'        => array( 'free', 'pro' ),
						'description' => __( 'Which plugin: "free" is AtlasVoice, "pro" is AtlasVoice Pro.', 'text-to-audio' ),
					),
					'on'     => array(
						'type'        => 'boolean',
						'required'    => true,
						'description' => __( 'True: the plugin updates itself. False: it waits for a person.', 'text-to-audio' ),
					),
				),
			)
		);
	}

	/**
	 * Returns the versions.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Versions::get() );
	}

	/**
	 * Switches automatic updates.
	 *
	 * @param \WP_REST_Request $request Request with plugin and on.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function auto_update( $request ) {
		return rest_ensure_response( Versions::set_auto_update( $request->get_param( 'plugin' ), $request->get_param( 'on' ) ) );
	}
}
