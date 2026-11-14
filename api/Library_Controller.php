<?php
/**
 * REST route for the audio library (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Library\Audio;
use TTA\Library\Posts;

defined( 'ABSPATH' ) || exit;

/**
 * The routes tta/v1/library (which posts have a stored audio file; it only
 * reads) and tta/v1/library/settings (when audio is made).
 */
class Library_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/library',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'List the posts and whether each has stored audio', 'text-to-audio' ),
				'description'         => __( 'Returns a page of the posts that get a player, each with whether its audio file is stored ("ready") or not yet ("missing"), and how many posts are in each state. "stores_audio" is false when the voice in use reads in the browser and saves no files. It changes nothing.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'read' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'status'   => array(
						'type'        => 'string',
						'enum'        => Posts::STATUSES,
						'default'     => 'all',
						'description' => __( 'Which posts: all, ready (audio stored) or missing (no audio yet).', 'text-to-audio' ),
					),
					'search'   => array(
						'type'        => 'string',
						'description' => __( 'Words to find in the title or content of a post.', 'text-to-audio' ),
					),
					'page'     => array(
						'type'        => 'integer',
						'minimum'     => 1,
						'default'     => 1,
						'description' => __( 'Which page of the list.', 'text-to-audio' ),
					),
					'per_page' => array(
						'type'        => 'integer',
						'minimum'     => 1,
						'maximum'     => Posts::PER_PAGE_MAX,
						'default'     => Posts::PER_PAGE,
						'description' => __( 'How many posts on a page.', 'text-to-audio' ),
					),
				),
			)
		);
	}

	/**
	 * Registers the routes of the setting. Called on rest_api_init.
	 */
	public static function register_settings_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/library/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'label'               => __( 'Read when audio is made', 'text-to-audio' ),
					'description'         => __( 'Returns when the audio of a post is made: "play" (the first play makes it, as always) or "publish" (it is made in the background when a post is published or changed), and whether background audio jobs can run on this site ("available"; "reason" is "voice" when the voice in use is not made by jobs, "not_connected" when the site is not connected to the AtlasVoice service). It changes nothing.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read_settings' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Choose when audio is made', 'text-to-audio' ),
					'description'         => __( 'Saves when the audio of a post is made. With "publish", publishing or changing a post sends its text to the AtlasVoice service in the background and the characters count against the site\'s allowance; with "play" nothing is sent until a visitor plays the post.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save_settings' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'when' => array(
							'type'        => 'string',
							'enum'        => array( Audio::WHEN_PLAY, Audio::WHEN_PUBLISH ),
							'description' => __( 'play: on the first play. publish: when a post is published or changed.', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns when audio is made.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read_settings() {
		return rest_ensure_response( Audio::get() );
	}

	/**
	 * Saves when audio is made.
	 *
	 * @param \WP_REST_Request $request Request with when.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save_settings( $request ) {
		$fields = array();
		if ( null !== $request->get_param( 'when' ) ) {
			$fields['when'] = $request->get_param( 'when' );
		}

		return rest_ensure_response( Audio::save( $fields ) );
	}

	/**
	 * Returns a page of the library.
	 *
	 * @param \WP_REST_Request $request Request with status, search, page, per_page.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function read( $request ) {
		return rest_ensure_response(
			Posts::get(
				array(
					'status'   => $request->get_param( 'status' ),
					'search'   => $request->get_param( 'search' ),
					'page'     => $request->get_param( 'page' ),
					'per_page' => $request->get_param( 'per_page' ),
				)
			)
		);
	}
}
