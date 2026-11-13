<?php
/**
 * REST routes for the read-along settings (Player › Read-along).
 *
 * @package TTA
 */

namespace TTA_Api;

use TTA\AtlasVoice\RestRoutes;
use TTA\Player\Read_Along;

defined( 'ABSPATH' ) || exit;

/**
 * GET and POST tta/v1/read-along.
 *
 * The routes hold no logic: they pass the request to Player\Read_Along,
 * which the admin screen and `wp atlasvoice read-along` use too. The field
 * names are the stored ones, so nothing has to be mapped anywhere.
 *
 * The classic `highlight` route stays for the classic screens.
 */
class Read_Along_Controller {

	/**
	 * Registers the routes. Called on rest_api_init.
	 */
	public static function register_routes() {
		register_rest_route(
			RestRoutes::NAMESPACE_PREFIX,
			'/read-along',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'label'               => __( 'Get read-along settings', 'text-to-audio' ),
					'description'         => __( 'Returns how AtlasVoice highlights the text while it is read, and whether readers can listen to a selection.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'get_settings' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Save read-along settings', 'text-to-audio' ),
					'description'         => __( 'Changes the read-along settings. Send only the settings to change; the others keep their saved value.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'save_settings' ),
					'permission_callback' => array( Route_Access::class, 'admin' ),
					'args'                => self::args(),
				),
			)
		);
	}

	/**
	 * The settings as REST arguments: one per stored key.
	 *
	 * @return array
	 */
	public static function args() {
		$color = array(
			'type'    => 'string',
			'pattern' => '^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$',
		);

		return array(
			'tta__highlight_enabled'        => array(
				'type'        => 'boolean',
				'description' => __( 'Highlight the text while it is read.', 'text-to-audio' ),
			),
			'tta__highlight_mode'           => array(
				'type'        => 'string',
				'enum'        => Read_Along::MODES,
				'description' => __( 'What to highlight: "sentence", "word", or "word_sentence" for both.', 'text-to-audio' ),
			),
			'tta__highlight_word_bg'        => array_merge( $color, array( 'description' => __( 'Background colour of the spoken word, as a hex colour.', 'text-to-audio' ) ) ),
			'tta__highlight_word_color'     => array_merge( $color, array( 'description' => __( 'Text colour of the spoken word, as a hex colour.', 'text-to-audio' ) ) ),
			'tta__highlight_sentence_bg'    => array_merge( $color, array( 'description' => __( 'Background colour of the spoken sentence, as a hex colour.', 'text-to-audio' ) ) ),
			'tta__highlight_dim_enabled'    => array(
				'type'        => 'boolean',
				'description' => __( 'Fade the rest of the article while reading.', 'text-to-audio' ),
			),
			'tta__highlight_dim_opacity'    => array(
				'type'        => 'number',
				'minimum'     => Read_Along::DIM_MIN,
				'maximum'     => Read_Along::DIM_MAX,
				'description' => __( 'How visible the faded text stays, from 0.1 (very faded) to 0.85.', 'text-to-audio' ),
			),
			'tta__highlight_autoscroll'     => array(
				'type'        => 'boolean',
				'description' => __( 'Scroll the page to follow the reading.', 'text-to-audio' ),
			),
			'tta__selection_listen_enabled' => array(
				'type'        => 'boolean',
				'description' => __( 'Let readers select text and listen to only that.', 'text-to-audio' ),
			),
			'tta__selection_announce'       => array(
				'type'        => 'string',
				'enum'        => Read_Along::ANNOUNCES,
				'description' => __( 'How readers learn about listening to a selection: "tip", "badge", "both" or "off".', 'text-to-audio' ),
			),
		);
	}

	/**
	 * Returns the saved settings.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_settings() {
		return rest_ensure_response( Read_Along::get() );
	}

	/**
	 * Saves the settings that were sent.
	 *
	 * @param \WP_REST_Request $request Request with some or all of the settings.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save_settings( $request ) {
		$fields = array();
		foreach ( array_keys( self::args() ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$fields[ $key ] = $request->get_param( $key );
			}
		}

		if ( ! $fields ) {
			return new \WP_Error(
				'atlasvoice_nothing_to_save',
				__( 'Nothing to save.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		return rest_ensure_response( Read_Along::save( $fields ) );
	}
}
