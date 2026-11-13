<?php
/**
 * REST route for the classic/new admin switch (TTS-374).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA_Admin\Admin_App;

defined( 'ABSPATH' ) || exit;

/**
 * POST tta/v1/admin-ui: saves which admin UI the site shows, and records
 * that the update-day welcome was closed.
 *
 * It only stores one of two words or a "seen" flag. No setting of the site is
 * read or changed, which is what makes switching back and forth safe.
 */
class Admin_Ui_Controller {

	/**
	 * Registers the route. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/admin-ui',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				// The label and description name this route for tools that read
				// the REST index, such as an MCP server (AtlasMCP).
				'label'               => __( 'AtlasVoice admin screens', 'text-to-audio' ),
				'description'         => __( 'Chooses whether the AtlasVoice admin shows the new screens or the classic screens, and can mark the one-time "new look" welcome as seen. It never changes a setting of the site.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'save' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'ui'      => array(
						'type'        => 'string',
						'enum'        => array( Admin_App::UI_NEW, Admin_App::UI_CLASSIC ),
						'description' => __( 'Which admin screens to show: "new" or "classic".', 'text-to-audio' ),
					),
					'welcome' => array(
						'type'        => 'string',
						'enum'        => array( 'seen' ),
						'description' => __( 'Send "seen" to stop showing the one-time welcome.', 'text-to-audio' ),
					),
				),
			)
		);
	}

	/**
	 * Saves the choice.
	 *
	 * @param \WP_REST_Request $request Request with `ui` and/or `welcome`.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$ui      = $request->get_param( 'ui' );
		$welcome = $request->get_param( 'welcome' );

		if ( null === $ui && null === $welcome ) {
			return new \WP_Error(
				'atlasvoice_nothing_to_save',
				__( 'Nothing to save.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		if ( null !== $ui && ! Admin_App::set_ui( $ui ) ) {
			return new \WP_Error(
				'atlasvoice_invalid_ui',
				__( 'Unknown admin screen choice.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		if ( 'seen' === $welcome ) {
			Admin_App::mark_welcome_seen();
		}

		return rest_ensure_response(
			array(
				'ui'          => Admin_App::get_ui(),
				'showWelcome' => Admin_App::welcome_pending(),
				// Where the browser should go now, for the screen that asked.
				'url'         => esc_url_raw( admin_url( 'admin.php?page=text-to-audio' ) ),
			)
		);
	}
}
