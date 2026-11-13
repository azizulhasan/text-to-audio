<?php
/**
 * REST routes for the voice choice (TTS-347).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Voice\Choice;

defined( 'ABSPATH' ) || exit;

/**
 * The route tta/v1/voice: read the voice that reads the posts (GET) and
 * change it (POST).
 *
 * The classic `listening` and `customize` routes stay for the classic
 * screens; all of them read and write the same stored settings.
 */
class Voice_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/voice',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					// The label and description name this route for tools that read
					// the REST index, such as an MCP server (AtlasMCP).
					'label'               => __( 'Get the voice that reads the posts', 'text-to-audio' ),
					'description'         => __( 'Returns which voice engine reads the posts, the language, the voice, the speed, volume and pitch, the voice engines available on this site, and whether the natural voice is connected.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'read' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Change the voice that reads the posts', 'text-to-audio' ),
					'description'         => __( 'Changes the voice engine, the language, the voice, the speed, the volume or the pitch. Send only what should change. When the engine, the language or the voice changes, each post gets audio in the new voice the next time it is played. The natural voice engine can be chosen only when the site is connected to AtlasVoice Cloud.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'player_id' => array(
							'type'        => 'integer',
							'description' => __( 'The voice engine, by its number in "players" of the GET answer: 1 is the browser voice, 3 the natural voice (AtlasVoice TTS).', 'text-to-audio' ),
						),
						'language'  => array(
							'type'        => 'string',
							'description' => __( 'The language code, for example "en-GB" for the browser voice or "en" for the natural voice.', 'text-to-audio' ),
						),
						'voice'     => array(
							'type'        => 'string',
							'description' => __( 'The name of the voice, as the engine names it. The natural voice has one voice per language, so it needs none.', 'text-to-audio' ),
						),
						'rate'      => array(
							'type'        => 'number',
							'minimum'     => Choice::RATE_MIN,
							'maximum'     => Choice::RATE_MAX,
							'description' => __( 'The speed of the browser voice: 1 is normal, 0.5 half speed, 2 double speed.', 'text-to-audio' ),
						),
						'volume'    => array(
							'type'        => 'number',
							'minimum'     => 0,
							'maximum'     => 1,
							'description' => __( 'The volume of the browser voice, from 0 (silent) to 1 (full).', 'text-to-audio' ),
						),
						'pitch'     => array(
							'type'        => 'integer',
							'enum'        => Choice::PITCHES,
							'description' => __( 'The pitch of the browser voice: 0 lower, 1 normal, 2 higher.', 'text-to-audio' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the choice.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read() {
		return rest_ensure_response( Choice::get() );
	}

	/**
	 * Saves what was sent.
	 *
	 * @param \WP_REST_Request $request Request with any of the voice settings.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save( $request ) {
		$fields = array();

		foreach ( array( 'player_id', 'language', 'voice', 'rate', 'volume', 'pitch' ) as $name ) {
			if ( null !== $request->get_param( $name ) ) {
				$fields[ $name ] = $request->get_param( $name );
			}
		}

		return rest_ensure_response( Choice::save( $fields ) );
	}
}
