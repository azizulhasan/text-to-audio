<?php
/**
 * REST routes for the first play of a post without audio (TTS-354).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Library\First_Play;

defined( 'ABSPATH' ) || exit;

/**
 * tta/v1/audio/first-play: the player on a page asks for the audio of its
 * post to be made as one job (POST), then how far it is (GET).
 *
 * Called by visitors, so it needs the page's wp_rest nonce instead of a
 * login, like the batch route it takes over from. What it may do is
 * decided in First_Play: only a published post, only while the site makes
 * its audio with a voice jobs are for, and never a second job for a post
 * that is being made.
 */
class First_Play_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		$post = array(
			'type'        => 'integer',
			'required'    => true,
			'minimum'     => 1,
			'description' => __( 'The id of the post.', 'text-to-audio' ),
		);
		$key  = array(
			'type'        => 'string',
			'default'     => '',
			'maxLength'   => 200,
			'description' => __( 'The key the player stores this page\'s audio under (language, or language and voice). When it is not the key of the site\'s own language and voice, the answer is "fallback".', 'text-to-audio' ),
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/audio/first-play',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'How far the audio of a post is', 'text-to-audio' ),
					'description'         => __( 'Returns the state of a post\'s audio for the player on its page: "ready" with the address of the MP3, "making" with the part that is being made and how many there are, "fallback" (make it batch by batch, the usual way) or "failed" with a reason. While the audio is made it asks AtlasVoice Cloud at most every two seconds, and stores the MP3 on the site when the job is finished. Needs the page\'s wp_rest nonce.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'status' ),
					'permission_callback' => array( Route_Access::class, 'visitor' ),
					'args'                => array(
						'post_id'      => $post,
						'file_url_key' => $key,
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Make the audio of a post on its first play', 'text-to-audio' ),
					'description'         => __( 'Starts the audio job of a published post that has no audio yet, with the text the player on its page reads, or joins the job that is already being made. The characters count against the site\'s allowance once; joining costs nothing. Returns the same states as the GET. Needs the page\'s wp_rest nonce.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'start' ),
					'permission_callback' => array( Route_Access::class, 'visitor' ),
					'args'                => array(
						'post_id'      => $post,
						'file_url_key' => $key,
						'content'      => array(
							'type'        => 'string',
							'required'    => true,
							'description' => __( 'The text the player reads, at most 200,000 characters. A longer text gets "fallback".', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns how far the audio is.
	 *
	 * @param \WP_REST_Request $request Request with post_id and, optionally, file_url_key.
	 *
	 * @return \WP_REST_Response
	 */
	public static function status( $request ) {
		// A notice printed by a host with display_errors on must not break the JSON the player reads.
		ob_start();
		$answer = First_Play::status( (int) $request->get_param( 'post_id' ), (string) $request->get_param( 'file_url_key' ) );
		ob_end_clean();

		return rest_ensure_response( $answer );
	}

	/**
	 * Starts or joins the job.
	 *
	 * @param \WP_REST_Request $request Request with post_id, content and, optionally, file_url_key.
	 *
	 * @return \WP_REST_Response
	 */
	public static function start( $request ) {
		ob_start();
		$answer = First_Play::start(
			(int) $request->get_param( 'post_id' ),
			(string) $request->get_param( 'content' ),
			(string) $request->get_param( 'file_url_key' )
		);
		ob_end_clean();

		return rest_ensure_response( $answer );
	}
}
