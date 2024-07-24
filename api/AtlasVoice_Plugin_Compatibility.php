<?php

namespace TTA_Api;
/**
 * This class is for getting all  data related to analytics  through api.
 * This is applied for tracker menu.
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/api
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */

use TTA\TTA_Activator;
use TTA\TTA_Helper;
class AtlasVoice_Plugin_Compatibility {

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function get_compatible_data1111( $request ) {

		$body = $request->get_body();
		$body = json_decode( $body, 1 );

		if ( isset( $body['post_id'], $body['analytics'] ) && count( $body['analytics'] ) ) {
			$post_id = $body['post_id'];
			//delete_post_meta( $post_id, 'atlasVoice_analytics' );
			$analytics = get_post_meta( $body['post_id'], 'atlasVoice_analytics' );
			if ( isset( $analytics[0] ) ) {
				$analytics = $analytics[0];
			}
			$merged_analytics = self::merge_analytics_arrays( $analytics, $body['analytics'] );
//			error_log( print_r( $merged_analytics, 1 ) );

			update_post_meta( $post_id, 'atlasVoice_analytics', $merged_analytics );

		}

		$response['status'] = true;
		$response['data']   = [];

		return rest_ensure_response( $response );
	}

	/*
 * Manage settings data
 */
	public function compatible_data( $request ) {
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'] );

			update_option( 'tta_compatible_data', $fields );

			$response['data'] = get_option( 'tta_compatible_data' );

			delete_transient( 'tts_all_settings' );

			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_compatible_data' );

			return rest_ensure_response( $response );
		}
	}
}