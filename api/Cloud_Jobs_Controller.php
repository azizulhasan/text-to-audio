<?php
/**
 * REST routes for a post's audio job on AtlasVoice Cloud (TTS-378).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Cloud\Jobs;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/cloud/jobs: start the audio job of a post (POST), read
 * it (GET) and cancel it (DELETE).
 */
class Cloud_Jobs_Controller {

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
		$lang = array(
			'type'        => 'string',
			'default'     => '',
			'description' => __( 'The language code of the audio, for example "en". Empty uses the language saved on the Voice screen.', 'text-to-audio' ),
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/cloud/jobs',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get the audio job of a post', 'text-to-audio' ),
					'description'         => __( 'Returns how the audio job of a post is going: queued, running, done, failed or canceled, how many parts are made, and the address of the MP3 once it is stored on the site. It changes nothing.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'post_id'  => $post,
						'language' => $lang,
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Start the audio job of a post', 'text-to-audio' ),
					'description'         => __( 'Sends the text of a post to AtlasVoice Cloud to make its audio as one job. The characters count against the site\'s allowance. Asking again for the same post, language and text returns the same job and is not billed twice. The site then asks the service from WP-Cron and stores the finished MP3 in uploads. The site must be connected to AtlasVoice Cloud.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'start' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'post_id'  => $post,
						'language' => $lang,
					),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'label'               => __( 'Cancel the audio job of a post', 'text-to-audio' ),
					'description'         => __( 'Cancels the audio job of a post. Parts that are not made yet are never made or billed. A finished MP3 is kept.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'cancel' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'post_id'  => $post,
						'language' => $lang,
					),
				),
			)
		);
	}

	/**
	 * Returns the job.
	 *
	 * @param \WP_REST_Request $request Request with post_id and language.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function read( $request ) {
		$record = Jobs::status( (int) $request->get_param( 'post_id' ), (string) $request->get_param( 'language' ) );

		if ( ! $record ) {
			return new \WP_Error( 'job_not_found', __( 'This post has no audio job.', 'text-to-audio' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response( self::for_output( $record ) );
	}

	/**
	 * Starts the job.
	 *
	 * @param \WP_REST_Request $request Request with post_id and language.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function start( $request ) {
		$record = Jobs::start( (int) $request->get_param( 'post_id' ), (string) $request->get_param( 'language' ) );

		return is_wp_error( $record ) ? $record : rest_ensure_response( self::for_output( $record ) );
	}

	/**
	 * Cancels the job.
	 *
	 * @param \WP_REST_Request $request Request with post_id and language.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function cancel( $request ) {
		$record = Jobs::cancel( (int) $request->get_param( 'post_id' ), (string) $request->get_param( 'language' ) );

		return is_wp_error( $record ) ? $record : rest_ensure_response( self::for_output( $record ) );
	}

	/**
	 * What a client may see of a record: not the path on the server's disk,
	 * and not the key that guards against double billing.
	 *
	 * @param array $record The site's record of a job.
	 *
	 * @return array
	 */
	public static function for_output( array $record ) {
		unset( $record['file_path'], $record['key'] );

		return $record;
	}
}
