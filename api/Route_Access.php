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

	/**
	 * Allows a visitor of the site whose page carries a wp_rest nonce. For
	 * what the player on a page does for its visitor (the first play of a
	 * post); the route itself decides what a visitor may ask for.
	 *
	 * @param \WP_REST_Request $request The request.
	 *
	 * @return true|\WP_Error
	 */
	public static function visitor( $request ) {
		$nonce = (string) $request->get_header( 'X-WP-Nonce' );

		if ( '' !== $nonce && wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return true;
		}

		return new \WP_Error(
			'rest_forbidden',
			__( 'Invalid or missing nonce.', 'text-to-audio' ),
			array( 'status' => 403 )
		);
	}

	/**
	 * Allows everyone who can edit the post the route names in `id`. For
	 * what belongs to one post (its audio, its player), not to the site.
	 *
	 * @param \WP_REST_Request $request Request with `id`.
	 *
	 * @return true|\WP_Error
	 */
	public static function post_editor( $request ) {
		$post_id = (int) $request['id'];

		if ( $post_id > 0 && get_post( $post_id ) && current_user_can( 'edit_post', $post_id ) ) {
			return true;
		}

		return new \WP_Error(
			'rest_forbidden',
			__( 'You do not have permission to do this.', 'text-to-audio' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
