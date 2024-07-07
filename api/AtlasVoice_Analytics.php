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

use TTA\TTA_Helper;

class AtlasVoice_Analytics {

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function track( $request ) {

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

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function insights( $request ) {
		$post_id = $request->get_param( 'id' );

		$insights = [];
		if ( $post_id ) {
			$insights = get_post_meta( $post_id, 'atlasVoice_analytics' );
		}

		if ( isset( $insights[0] ) ) {
			$insights = $insights[0];
		}

		$response['status'] = true;
		$response['data']   = $insights;

		return rest_ensure_response( $response );
	}

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function all_insights( $request ) {
		$post_id = $request->get_param( 'id' );

		$insights = [];
		if ( $post_id ) {
			$insights = get_post_meta( $post_id, 'atlasVoice_analytics' );
		}

		if ( isset( $insights[0] ) ) {
			$insights = $insights[0];
		}

		$response['status'] = true;
		$response['data']   = $insights;

		return rest_ensure_response( $response );
	}

	public function latest_100_posts( $request ) {

		$settings = TTA_Helper::tts_get_settings( 'settings' );
		if ( isset( $settings['tta__settings_allow_listening_for_post_types'] ) && count( $settings['tta__settings_allow_listening_for_post_types'] ) ) {
			if ( ! TTA_Helper::is_pro_active() ) {
				$post_types[] = $settings['tta__settings_allow_listening_for_post_types'][0];
			} else {
				$post_types = $settings['tta__settings_allow_listening_for_post_types'];
			}
		}
		if ( empty( $post_types ) ) {
			$post_types = array( 'post' );
		}
		$args = array(
			'numberposts' => 100,
			'post_status' => 'publish',
			'post_type'   => $post_types,
			'orderby'     => 'date',
			'order'       => 'DESC',
			'fields'      => 'ids',
		);

		$query = new \WP_Query( $args );
		$posts = $query->posts;

		$post_data = array();

		foreach ( $posts as $post_id ) {
			$post_data[ $post_id ] = get_the_title( $post_id );
		}
		$response['status'] = true;
		$response['data']   = $post_data;

		return rest_ensure_response( $response );
	}


	/**
	 * @param $array1
	 * @param $array2
	 *
	 * @return array
	 */
	private static function merge_analytics_arrays( $array1, $array2 ) {
		$merged = [];

		// Merge keys from both arrays
		$all_keys = array_unique( array_merge( array_keys( $array1 ), array_keys( $array2 ) ) );

		foreach ( $all_keys as $key ) {
			if ( isset( $array1[ $key ] ) && isset( $array2[ $key ] ) ) {
				// If the key exists in both arrays, sum the counts
				$merged[ $key ]['count'] = $array1[ $key ]['count'] + $array2[ $key ]['count'];
			} elseif ( isset( $array1[ $key ] ) ) {
				// If the key only exists in the first array, use its value
				$merged[ $key ] = $array1[ $key ];
			} elseif ( isset( $array2[ $key ] ) ) {
				// If the key only exists in the second array, use its value
				$merged[ $key ] = $array2[ $key ];
			}
		}

		return $merged;
	}
}