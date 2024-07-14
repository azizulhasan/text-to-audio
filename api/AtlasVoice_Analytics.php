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

class AtlasVoice_Analytics {

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function track_old( $request ) {

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

	public function track( $request ) {

		$body          = $request->get_body();
		$body          = json_decode( $body, 1 );
		$user_id       = isset( $body['user_id'] ) ? $body['user_id'] : '';
		$post_id       = isset( $body['post_id'] ) ? $body['post_id'] : '';
		$new_analytics = isset( $body['analytics'] ) ? $body['analytics'] : [];
		$other_data    = isset( $body['other_data'] ) ? $body['other_data'] : null;

		if ( ! $post_id || ! $user_id || empty( $new_analytics ) ) {
			$response['status'] = false;
			$response['data']   = [];

			return rest_ensure_response( $response );
		}

		if ( ! get_option( 'atlasvoice_analytics_table_is_created' ) ) {
			TTA_Activator::create_analytics_table_if_not_exists();
		}

		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';

		// Check if an entry exists
		$existing_entry = $wpdb->get_row( $wpdb->prepare(
			"SELECT * FROM $table_name WHERE user_id = %s AND post_id = %d",
			$user_id,
			$post_id
		) );

		if ( $existing_entry ) {
			// Unserialize the existing analytics data
			$existing_analytics = maybe_unserialize( $existing_entry->analytics );
			// Sum the existing and new analytics data
			foreach ( $new_analytics as $key => $value ) {
				if ( isset( $existing_analytics[ $key ] ) ) {
					$existing_analytics[ $key ]['count']     += $value['count'];
					$existing_analytics[ $key ]['timestamp'] = $value['timestamp'];
				} else {
					$existing_analytics[ $key ] = $value;
				}
			}

			// Update the entry
			$wpdb->update(
				$table_name,
				array(
					'analytics'  => maybe_serialize( $existing_analytics ),
					'other_data' => maybe_serialize( $other_data ),
					'updated_at' => current_time( 'mysql' ),
				),
				array( 'id' => $existing_entry->id ),
				array( '%s', '%s', '%s' ),
				array( '%d' )
			);
		} else {
			// Create a new entry
			$wpdb->insert(
				$table_name,
				array(
					'user_id'    => $user_id,
					'post_id'    => $post_id,
					'analytics'  => maybe_serialize( $new_analytics ),
					'other_data' => maybe_serialize( $other_data ),
					'created_at' => current_time( 'mysql' ),
					'updated_at' => current_time( 'mysql' ),
				),
				array( '%s', '%d', '%s', '%s', '%s', '%s' )
			);
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
	public function insights_old( $request ) {
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
	public function insights( $request ) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';

		$post_id         = $request->get_param( 'id' );
		$args['post_id'] = $post_id;
		$defaults        = array(
			'user_id'   => null,
			'post_id'   => null,
			'from_date' => null,
			'to_date'   => current_time( 'mysql' ), // Default to today if 'to_date' is not provided
		);

		$args       = wp_parse_args( $args, $defaults );
		$conditions = array();
		$values     = array();

		if ( $args['user_id'] ) {
			$conditions[] = 'user_id = %s';
			$values[]     = $args['user_id'];
		}

		if ( $args['post_id'] ) {
			$conditions[] = 'post_id = %d';
			$values[]     = $args['post_id'];
		}

		if ( ! $args['post_id'] ) {
			$response['status']  = false;
			$response['data']    = [];
			$response['message'] = __( 'Post ID or User ID is missing', 'text-to-audio' );

			return rest_ensure_response( $response );
		}


		if ( $args['from_date'] && $args['to_date'] ) {

			$conditions[] = 'created_at >= %s';
			$values[]     = $args['from_date'];

			$conditions[] = 'updated_at <= %s';
			$values[]     = $args['to_date'];
		}

		$where_clause = '';
		if ( ! empty( $conditions ) ) {
			$where_clause = 'WHERE ' . implode( ' AND ', $conditions );
		}

		$query          = "SELECT * FROM $table_name $where_clause";
		$prepared_query = $wpdb->prepare( $query, ...$values );
		$results        = $wpdb->get_results( $prepared_query );
		$total_results  = [];
		foreach ( $results as $result ) {
			$result->analytics  = maybe_unserialize( $result->analytics );
			$result->other_data = maybe_unserialize( $result->other_data );
			$total_results[]    = $result;
		}

		$response['status'] = true;
		$response['data']   = $total_results;

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

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function latest_posts( $request ) {

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
		if ( TTA_Helper::is_pro_active() && apply_filters( 'tts_track_all_ids_by_default', true ) ) {
			$post_data['all'] = 'All Posts:: Track All Ids of post type ' . implode( ', ', $post_types );
		}
		foreach ( $posts as $post_id ) {
			$post_data[ $post_id ] = get_the_title( $post_id );
		}


		$response['status'] = true;
		$response['data']   = $post_data;

		return rest_ensure_response( $response );
	}

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function save_analytics_settings( $request ) {
		$body = [];
		if ( isset( $request['analytics'] ) ) {
			$body = json_decode( $request['analytics'] );
		} else {
			$response['status'] = false;
			$response['data']   = [];

			return rest_ensure_response( $response );
		}

		update_option( 'tta_analytics_settings', $body );

		$saved_data = get_option( 'tta_analytics_settings' );

		delete_transient( 'tts_all_settings' );


		$response['status'] = true;
		$response['data']   = $saved_data;

		return rest_ensure_response( $response );
	}

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function get_analytics_settings( $request ) {
		$body = [];
		$body = (array) get_option( 'tta_analytics_settings' );

		if ( TTA_Helper::is_pro_active() && apply_filters( 'tts_track_all_ids_by_default', true ) && isset( $body['tts_trackable_post_ids'] ) && ! in_array( 'all', $body['tts_trackable_post_ids'] ) ) {
			array_push( $body['tts_trackable_post_ids'], 'all' );
		}

		$response['status'] = true;
		$response['data']   = $body;

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