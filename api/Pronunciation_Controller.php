<?php
/**
 * REST routes for the pronunciation rules (Voice › Pronunciation).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Pronunciation\Rules;

defined( 'ABSPATH' ) || exit;

/**
 * GET and POST tta/v1/pronunciation, POST tta/v1/pronunciation/preview.
 *
 * The routes hold no logic: they pass the request to Pronunciation\Rules,
 * which the admin screen and `wp atlasvoice pronunciation` use too. Each
 * route describes itself (label, description, typed arguments), so an API
 * client or an MCP server can use it without reading this file.
 *
 * The classic `text_alias` route stays for the classic screens.
 */
class Pronunciation_Controller {

	/**
	 * The longest sentence the preview accepts. It is a typing aid, not a
	 * way to process whole posts.
	 */
	const PREVIEW_MAX_LENGTH = 2000;

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		$rules_arg = array(
			'type'        => 'array',
			'description' => __( 'The full list of rules, in the order they are applied. It replaces the saved list.', 'text-to-audio' ),
			'items'       => array(
				'type'       => 'object',
				'properties' => array(
					'actual_text'      => array(
						'type'        => 'string',
						'description' => __( 'The word or phrase as it is written on the site. Whole words only.', 'text-to-audio' ),
						'required'    => true,
					),
					'to_read'          => array(
						'type'        => 'string',
						'description' => __( 'How the voice should say it.', 'text-to-audio' ),
					),
					'apply_to_numbers' => array(
						'type'        => 'boolean',
						'description' => __( 'When the word holds a number, also change the same pattern with other numbers (5k and 250k).', 'text-to-audio' ),
					),
				),
			),
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/pronunciation',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'label'               => __( 'List pronunciation rules', 'text-to-audio' ),
					'description'         => __( 'Returns the words AtlasVoice says differently, how many of them this site applies, and the limit (0 means no limit).', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'get_rules' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Save pronunciation rules', 'text-to-audio' ),
					'description'         => __( 'Replaces the list of words AtlasVoice says differently. Send every rule that should remain; a rule that is left out is removed.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save_rules' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => array(
						'rules' => array_merge( $rules_arg, array( 'required' => true ) ),
					),
				),
			)
		);

		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/pronunciation/preview',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'label'               => __( 'Preview pronunciation', 'text-to-audio' ),
				'description'         => __( 'Returns how a sentence will be read with the pronunciation rules. Nothing is saved. Send "rules" to try rules before saving them.', 'text-to-audio' ),
				'callback'            => array( __CLASS__, 'preview' ),
				'permission_callback' => array( Route_Access::class, 'admin' ),
				'args'                => array(
					'text'  => array(
						'type'        => 'string',
						'required'    => true,
						'maxLength'   => self::PREVIEW_MAX_LENGTH,
						'description' => __( 'The sentence to try.', 'text-to-audio' ),
					),
					'rules' => array_merge(
						$rules_arg,
						array( 'description' => __( 'Rules to try instead of the saved ones.', 'text-to-audio' ) )
					),
				),
			)
		);
	}

	/**
	 * What every answer about the rules looks like.
	 *
	 * @return array
	 */
	private static function state() {
		$rules = Rules::all();
		$max   = Rules::max_rules();

		return array(
			'rules'   => $rules,
			'max'     => $max,
			// How many of the saved rules are applied when audio is read.
			'applied' => $max > 0 ? min( $max, count( $rules ) ) : count( $rules ),
		);
	}

	/**
	 * Returns the saved rules.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_rules() {
		return rest_ensure_response( self::state() );
	}

	/**
	 * Replaces the saved rules.
	 *
	 * @param \WP_REST_Request $request Request with `rules`.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save_rules( $request ) {
		$saved = Rules::save( $request->get_param( 'rules' ) );

		return is_wp_error( $saved ) ? $saved : rest_ensure_response( self::state() );
	}

	/**
	 * Returns how a sentence will be read.
	 *
	 * @param \WP_REST_Request $request Request with `text` and, optionally, `rules`.
	 *
	 * @return \WP_REST_Response
	 */
	public static function preview( $request ) {
		$text  = sanitize_textarea_field( (string) $request->get_param( 'text' ) );
		$rules = $request->get_param( 'rules' );

		return rest_ensure_response(
			array(
				'text' => Rules::apply( $text, is_array( $rules ) ? $rules : null ),
			)
		);
	}
}
