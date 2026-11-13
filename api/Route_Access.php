<?php
/**
 * Shared permission checks for new REST routes.
 *
 * @package TTA
 */

namespace TTA_Api;

defined( 'ABSPATH' ) || exit;

/**
 * One permission callback for every admin-only route added from TTS-347 on.
 *
 * It checks the capability and nothing else, on purpose:
 *
 * - In a browser, WordPress itself rejects a cookie-authenticated request
 *   without a valid `X-WP-Nonce` (the user becomes "logged out" before this
 *   runs), so cross-site request forgery is already covered.
 * - An application password, OAuth, WP-CLI or an MCP server (AtlasMCP)
 *   authenticates without a browser cookie and has no nonce to send. A second,
 *   hand-written nonce check would lock those out without adding safety.
 *
 * The older routes keep their own callbacks; nothing about them changes.
 */
class Route_Access {

	/**
	 * Allows administrators of this site.
	 *
	 * @return true|\WP_Error
	 */
	public static function admin() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new \WP_Error(
			'rest_forbidden',
			__( 'You do not have permission to do this.', 'text-to-audio' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
