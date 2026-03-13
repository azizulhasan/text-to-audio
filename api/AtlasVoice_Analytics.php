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
use TTA\TTA_Cache;
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
                if($key === 'device_info' ) {
                    $existing_analytics += $value;
                    continue;
                }

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
            if( isset( $new_analytics['device_info'] ) ) {
                $new_analytics += $new_analytics['device_info'];
                unset( $new_analytics['device_info'] );
            }

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

		$post_id         = $request->get_param( 'post_id' );
		$from_date         = $request->get_param( 'from_date' );
		$to_date         = $request->get_param( 'to_date' );
        if(!$to_date) {
            $to_date = current_time( 'mysql' );
        }
		$args['post_id']   = $post_id;
		$args['from_date'] = $from_date;
		$args['to_date']   = $to_date;

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
		$response['extra']   = [];

		return rest_ensure_response( $response );
	}

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function all_insights( $request ) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics'; // Replace with your table name
		$results    = $wpdb->get_results( "SELECT * FROM $table_name", ARRAY_A ); // ARRAY_A returns an associative array

		if ( ! empty( $results ) ) {
			foreach ( $results as &$result ) {
				if ( isset( $result['analytics'] ) ) {
					$result['analytics'] = maybe_unserialize( $result['analytics'] );
				}
			}
		}

		$response['status'] = true;
		$response['data']   = $results;

		return rest_ensure_response( $response );
	}

	/**
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function latest_posts( $request ) {

		$post_ids = [];
		if ( isset( $request['ids'] ) ) {
			$post_ids = json_decode( $request['ids'], true );
		}
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

		// Default query args
		$args = array(
			'orderby' => 'date',
			'order'   => 'DESC',
			'fields'  => 'ids',
		);

		// If post IDs are provided, fetch only those
		if ( ! empty( $post_ids ) && is_array( $post_ids ) ) {
			$args['post__in']    = $post_ids;
			$args['orderby']     = 'post__in'; // Maintain provided order
			$args['post_type']   = 'any';
			$args['post_status'] = 'any';
		} else {
			$args['numberposts'] = 100; // Fetch latest 100 posts if no IDs given
			$args['post_type']   = $post_types;
			$args['post_status'] = 'publish';
		}

		$query = new \WP_Query( $args );
		$posts = $query->posts;

		$post_data = array();
		if ( TTA_Helper::is_pro_active() && apply_filters( 'tts_track_all_ids_by_default', true ) && empty( $post_ids ) ) {
			$post_data['all'] = 'All Posts:: Track All Ids of post type ' . implode( ', ', $post_types );
		}

		foreach ( $posts as $post_id ) {
			$post_data[ $post_id ] = get_the_title( $post_id );
		}

		$response['status']    = true;
		$response['data']      = $post_data;
		$response['args']      = $args;
		$response['$post_ids'] = $post_ids;

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

		update_option( 'tta_analytics_settings', $body, false );

		$saved_data = get_option( 'tta_analytics_settings' );

		TTA_Cache::delete( 'all_settings' );


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

    /**
     * @param $request
     *
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function report( $request ) {
        $body = [];
        $body = $request->get_body();
        $body = json_decode( $body, true );
        $response['status'] = true;
        $response['data']   = $body;

        return rest_ensure_response( $response );
    }

    /**
     * Get geolocation data (city/country) based on client IP address.
     * Uses free IP geolocation API services.
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function get_geolocation( $request ) {
        $ip = $this->get_client_ip();
        // Don't process local IPs
        if ( $this->is_local_ip( $ip ) ) {
            return rest_ensure_response( array(
                'status'  => true,
                'data'    => array(
                    'city'    => 'Local',
                    'country' => 'Local',
                    'region'  => '',
                ),
            ) );
        }

        // Check transient cache first (cache for 24 hours)
        $cache_key = 'tts_geo_' . md5( $ip );
        $cached    = get_transient( $cache_key );

        if ( false !== $cached ) {
            return rest_ensure_response( array(
                'status' => true,
                'data'   => $cached,
            ) );
        }

        // Try ip-api.com first (free, no API key required, 45 requests/minute limit)
        $geo_data = $this->fetch_geolocation_ipapi( $ip );

        // Fallback to ipinfo.io if ip-api fails
        if ( ! $geo_data ) {
            $geo_data = $this->fetch_geolocation_ipinfo( $ip );
        }

        // Default values if all APIs fail
        if ( ! $geo_data ) {
            $geo_data = array(
                'city'    => 'Unknown',
                'country' => 'Unknown',
                'region'  => '',
            );
        }

        // Cache the result for 24 hours
        set_transient( $cache_key, $geo_data, DAY_IN_SECONDS );

        return rest_ensure_response( array(
            'status' => true,
            'data'   => $geo_data,
        ) );
    }

    private function get_client_ip() {
        $response = wp_safe_remote_get( 'https://icanhazip.com/' );
        if ( is_wp_error( $response ) ) {
            return '';
        }
        $ip = trim( wp_remote_retrieve_body( $response ) );
        if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
            return '';
        }

        return $ip;
    }

    /**
     * Check if IP is local/private
     *
     * @param string $ip
     * @return bool
     */
    private function is_local_ip( $ip ) {
        if ( empty( $ip ) ) {
            return true;
        }

        // Check for localhost
        if ( in_array( $ip, array( '127.0.0.1', '::1', 'localhost' ), true ) ) {
            return true;
        }

        // Check for private IP ranges
        return ! filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }

    /**
     * Fetch geolocation from ip-api.com
     *
     * @param string $ip
     * @return array|false
     */
    private function fetch_geolocation_ipapi( $ip ) {
        $url = "http://ip-api.com/json/{$ip}?fields=status,country,regionName,city";

        $response = wp_remote_get( $url, array(
            'timeout' => 20,
            'sslverify' => false,
        ) );

        if ( is_wp_error( $response ) ) {
            return false;
        }

        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( isset( $data['status'] ) && 'success' === $data['status'] ) {
            return array(
                'city'    => isset( $data['city'] ) ? $data['city'] : 'Unknown',
                'country' => isset( $data['country'] ) ? $data['country'] : 'Unknown',
                'region'  => isset( $data['regionName'] ) ? $data['regionName'] : '',
            );
        }

        return false;
    }

    /**
     * Fetch geolocation from ipinfo.io (fallback)
     *
     * @param string $ip
     * @return array|false
     */
    private function fetch_geolocation_ipinfo( $ip ) {
        $url = "https://ipinfo.io/{$ip}/json";

        $response = wp_remote_get( $url, array(
            'timeout' => 5,
        ) );

        if ( is_wp_error( $response ) ) {
            return false;
        }

        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( isset( $data['city'] ) || isset( $data['country'] ) ) {
            return array(
                'city'    => isset( $data['city'] ) ? $data['city'] : 'Unknown',
                'country' => isset( $data['country'] ) ? $data['country'] : 'Unknown',
                'region'  => isset( $data['region'] ) ? $data['region'] : '',
            );
        }

        return false;
    }

    /**
     * Get aggregated analytics data with date filtering
     * Supports: Yesterday, Last 7 Days, Last 30 Days, Last 90 Days, Custom
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function aggregated_insights( $request ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'atlasvoice_analytics';

        // Get date range parameter
        $date_range = $request->get_param( 'date_range' );
        $from_date  = $request->get_param( 'from_date' );
        $to_date    = $request->get_param( 'to_date' );

        // Calculate date range
        $dates = $this->calculate_date_range( $date_range, $from_date, $to_date );

        // Build query with date filtering
        $conditions = array();
        $values     = array();

        if ( $dates['from_date'] ) {
            $conditions[] = 'created_at >= %s';
            $values[]     = $dates['from_date'];
        }

        if ( $dates['to_date'] ) {
            $conditions[] = 'updated_at <= %s';
            $values[]     = $dates['to_date'];
        }

        $where_clause = '';
        if ( ! empty( $conditions ) ) {
            $where_clause = 'WHERE ' . implode( ' AND ', $conditions );
        }

        // Get all records within date range
        if ( ! empty( $values ) ) {
            $query   = "SELECT * FROM $table_name $where_clause";
            $results = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A );
        } else {
            $results = $wpdb->get_results( "SELECT * FROM $table_name", ARRAY_A );
        }

        // Aggregate the data
        $aggregated = $this->aggregate_analytics_data( $results );

        // Get previous period data for comparison (Pro only)
        $previous_aggregated = null;
        if ( TTA_Helper::is_pro_active() ) {
            $previous_dates = $this->get_previous_period_dates( $dates );
            if ( $previous_dates['from_date'] && $previous_dates['to_date'] ) {
                $prev_conditions = array(
                    'created_at >= %s',
                    'updated_at <= %s'
                );
                $prev_values = array( $previous_dates['from_date'], $previous_dates['to_date'] );
                $prev_where  = 'WHERE ' . implode( ' AND ', $prev_conditions );
                $prev_query  = "SELECT * FROM $table_name $prev_where";
                $prev_results = $wpdb->get_results( $wpdb->prepare( $prev_query, ...$prev_values ), ARRAY_A );
                $previous_aggregated = $this->aggregate_analytics_data( $prev_results );
            }
        }

        // Prepare raw results for client-side filtering (include created_at for date filtering)
        $raw_results = array();
        foreach ( $results as $result ) {
            $raw_results[] = array(
                'id'         => $result['id'],
                'user_id'    => $result['user_id'],
                'post_id'    => $result['post_id'],
                'analytics'  => maybe_unserialize( $result['analytics'] ),
                'created_at' => $result['created_at'],
                'updated_at' => $result['updated_at'],
            );
        }

        $response['status']      = true;
        $response['data']        = $aggregated;
        $response['previous']    = $previous_aggregated;
        $response['dates']       = $dates;
        $response['raw_results'] = $raw_results;

        return rest_ensure_response( $response );
    }

    /**
     * Calculate date range based on preset or custom dates
     *
     * @param string $date_range Preset date range
     * @param string $from_date  Custom from date
     * @param string $to_date    Custom to date
     * @return array
     */
    public function calculate_date_range( $date_range, $from_date = null, $to_date = null ) {
        $to   = current_time( 'mysql' );
        $from = null;

        switch ( $date_range ) {
            case 'Yesterday':
                $from = date( 'Y-m-d 00:00:00', strtotime( '-1 day' ) );
                $to   = date( 'Y-m-d 23:59:59', strtotime( '-1 day' ) );
                break;
            case 'Last 7 Days':
                $from = date( 'Y-m-d 00:00:00', strtotime( '-7 days' ) );
                break;
            case 'Last 30 Days':
                $from = date( 'Y-m-d 00:00:00', strtotime( '-30 days' ) );
                break;
            case 'Last 90 Days':
                $from = date( 'Y-m-d 00:00:00', strtotime( '-90 days' ) );
                break;
            case 'Custom':
                if ( $from_date ) {
                    $from = date( 'Y-m-d 00:00:00', strtotime( $from_date ) );
                }
                if ( $to_date ) {
                    $to = date( 'Y-m-d 23:59:59', strtotime( $to_date ) );
                }
                break;
            default:
                // Default to last 7 days
                $from = date( 'Y-m-d 00:00:00', strtotime( '-7 days' ) );
                $number = preg_replace('/[^0-9]/', '', $date_range);
                if(is_numeric($number)) {
                    $from = date( 'Y-m-d 00:00:00', strtotime(  '-'.$from_date. ' days' ) );
                }

                break;
        }

        return array(
            'from_date' => $from,
            'to_date'   => $to,
        );
    }

    /**
     * Get previous period dates for comparison
     *
     * @param array $current_dates
     * @return array
     */
    private function get_previous_period_dates( $current_dates ) {
        if ( ! $current_dates['from_date'] || ! $current_dates['to_date'] ) {
            return array( 'from_date' => null, 'to_date' => null );
        }

        $from_timestamp = strtotime( $current_dates['from_date'] );
        $to_timestamp   = strtotime( $current_dates['to_date'] );
        $period_length  = $to_timestamp - $from_timestamp;

        return array(
            'from_date' => date( 'Y-m-d H:i:s', $from_timestamp - $period_length - 1 ),
            'to_date'   => date( 'Y-m-d H:i:s', $from_timestamp - 1 ),
        );
    }

    /**
     * Aggregate analytics data from raw results
     *
     * @param array $results Raw analytics results
     * @return array
     */
    public function aggregate_analytics_data( $results ) {
        $aggregated = array(
            'summary' => array(
                'total_posts'        => 0,
                'total_users'        => 0,
                'total_init'         => 0,
                'total_play'         => 0,
                'total_pause'        => 0,
                'total_resume'       => 0,
                'total_end'          => 0,
                'total_time'         => 0,
                'total_download'     => 0,
                'total_25_percent'   => 0,
                'total_50_percent'   => 0,
                'total_75_percent'   => 0,
                'total_interactions' => 0,
            ),
            'os'        => array(),
            'device'    => array(),
            'browser'   => array(),
            'country'   => array(),
            'city'      => array(),
            'timezone'  => array(),
            'language'  => array(),
            'hourly'    => array(),
            'daily'     => array(),
            'posts'     => array(),
            'users'     => array(),
        );

        $unique_posts = array();
        $unique_users = array();

        foreach ( $results as $result ) {
            $analytics = maybe_unserialize( $result['analytics'] );
            if ( ! is_array( $analytics ) ) {
                continue;
            }

            // Track unique posts and users
            $unique_posts[ $result['post_id'] ] = true;
            $unique_users[ $result['user_id'] ] = true;

            // Process event counts
            $events = array( 'init', 'play', 'pause', 'resume', 'end', 'time', 'download', '25_percent', '50_percent', '75_percent' );
            foreach ( $events as $event ) {
                if ( isset( $analytics[ $event ]['count'] ) ) {
                    $aggregated['summary'][ 'total_' . $event ] += intval( $analytics[ $event ]['count'] );
                }
            }

            // Process device info (stored at top level of analytics)
            $device_fields = array(
                'platform' => 'os',
                'deviceType' => 'device',
                'browser' => 'browser',
                'country' => 'country',
                'city' => 'city',
                'timeZone' => 'timezone',
                'language' => 'language',
            );

            foreach ( $device_fields as $field => $category ) {
                if ( isset( $analytics[ $field ] ) ) {
                    $value = $analytics[ $field ];
                    // Handle both direct value and value in 'value' key
                    if ( is_array( $value ) && isset( $value['value'] ) ) {
                        $value = $value['value'];
                    }
                    if ( is_string( $value ) && ! empty( $value ) ) {
                        if ( ! isset( $aggregated[ $category ][ $value ] ) ) {
                            $aggregated[ $category ][ $value ] = 0;
                        }
                        $aggregated[ $category ][ $value ]++;
                    }
                }
            }

            // Track hourly distribution from timestamps
            if ( isset( $analytics['play']['timestamp'] ) ) {
                $hour = date( 'H', strtotime( $analytics['play']['timestamp'] ) );
                $day  = date( 'l', strtotime( $analytics['play']['timestamp'] ) );

                if ( ! isset( $aggregated['hourly'][ $hour ] ) ) {
                    $aggregated['hourly'][ $hour ] = 0;
                }
                $aggregated['hourly'][ $hour ]++;

                if ( ! isset( $aggregated['daily'][ $day ] ) ) {
                    $aggregated['daily'][ $day ] = 0;
                }
                $aggregated['daily'][ $day ]++;
            }

            // Track per-post statistics
            $post_id = $result['post_id'];
            if ( ! isset( $aggregated['posts'][ $post_id ] ) ) {
                $aggregated['posts'][ $post_id ] = array(
                    'post_id'      => $post_id,
                    'title'        => get_the_title( $post_id ),
                    'total_plays'  => 0,
                    'total_time'   => 0,
                    'total_end'    => 0,
                    'interactions' => 0,
                );
            }

            if ( isset( $analytics['play']['count'] ) ) {
                $aggregated['posts'][ $post_id ]['total_plays'] += intval( $analytics['play']['count'] );
            }
            if ( isset( $analytics['time']['count'] ) ) {
                $aggregated['posts'][ $post_id ]['total_time'] += intval( $analytics['time']['count'] );
            }
            if ( isset( $analytics['end']['count'] ) ) {
                $aggregated['posts'][ $post_id ]['total_end'] += intval( $analytics['end']['count'] );
            }

            // Calculate interactions for this record
            $record_interactions = 0;
            foreach ( array( 'init', 'play', 'pause', 'end', 'download' ) as $event ) {
                if ( isset( $analytics[ $event ]['count'] ) ) {
                    $record_interactions += intval( $analytics[ $event ]['count'] );
                }
            }
            $aggregated['posts'][ $post_id ]['interactions'] += $record_interactions;

            // Track unique vs returning users
            if ( ! isset( $aggregated['users'][ $result['user_id'] ] ) ) {
                $aggregated['users'][ $result['user_id'] ] = array(
                    'first_seen'  => $result['created_at'],
                    'last_seen'   => $result['updated_at'],
                    'visit_count' => 1,
                );
            } else {
                $aggregated['users'][ $result['user_id'] ]['visit_count']++;
                if ( $result['updated_at'] > $aggregated['users'][ $result['user_id'] ]['last_seen'] ) {
                    $aggregated['users'][ $result['user_id'] ]['last_seen'] = $result['updated_at'];
                }
            }
        }

        // Calculate totals
        $aggregated['summary']['total_posts'] = count( $unique_posts );
        $aggregated['summary']['total_users'] = count( $unique_users );
        $aggregated['summary']['total_interactions'] =
            $aggregated['summary']['total_init'] +
            $aggregated['summary']['total_play'] +
            $aggregated['summary']['total_pause'] +
            $aggregated['summary']['total_end'] +
            $aggregated['summary']['total_download'];

        // Calculate new vs returning users
        $new_users = 0;
        $returning_users = 0;
        foreach ( $aggregated['users'] as $user_data ) {
            if ( $user_data['visit_count'] > 1 || $user_data['first_seen'] !== $user_data['last_seen'] ) {
                $returning_users++;
            } else {
                $new_users++;
            }
        }
        $aggregated['segments'] = array(
            'new_users'       => $new_users,
            'returning_users' => $returning_users,
        );

        // Sort posts by interactions (descending) and limit to top 50
        uasort( $aggregated['posts'], function( $a, $b ) {
            return $b['interactions'] - $a['interactions'];
        });
        $aggregated['posts'] = array_slice( $aggregated['posts'], 0, 50, true );

        // Sort OS, device, browser, country by count
        arsort( $aggregated['os'] );
        arsort( $aggregated['device'] );
        arsort( $aggregated['browser'] );
        arsort( $aggregated['country'] );
        arsort( $aggregated['city'] );

        // Remove raw user data from response (keep only segments)
        unset( $aggregated['users'] );

        return $aggregated;
    }

    /**
     * Get trend data for charts (daily breakdown)
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function trend_data( $request ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'atlasvoice_analytics';

        $date_range = $request->get_param( 'date_range' );
        $from_date  = $request->get_param( 'from_date' );
        $to_date    = $request->get_param( 'to_date' );
        $dates      = $this->calculate_date_range( $date_range, $from_date, $to_date );

        $conditions = array();
        $values     = array();

        if ( $dates['from_date'] ) {
            $conditions[] = 'created_at >= %s';
            $values[]     = $dates['from_date'];
        }
        if ( $dates['to_date'] ) {
            $conditions[] = 'updated_at <= %s';
            $values[]     = $dates['to_date'];
        }

        $where_clause = '';
        if ( ! empty( $conditions ) ) {
            $where_clause = 'WHERE ' . implode( ' AND ', $conditions );
        }

        // Get data grouped by date
        if ( ! empty( $values ) ) {
            $query = "SELECT DATE(created_at) as date, analytics FROM $table_name $where_clause ORDER BY created_at ASC";
            $results = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A );
        } else {
            $results = $wpdb->get_results( "SELECT DATE(created_at) as date, analytics FROM $table_name ORDER BY created_at ASC", ARRAY_A );
        }

        // Aggregate by date
        $trend = array();
        foreach ( $results as $result ) {
            $date = $result['date'];
            $analytics = maybe_unserialize( $result['analytics'] );

            if ( ! isset( $trend[ $date ] ) ) {
                $trend[ $date ] = array(
                    'date'       => $date,
                    'plays'      => 0,
                    'time'       => 0,
                    'init'       => 0,
                    'end'        => 0,
                    'downloads'  => 0,
                );
            }

            if ( isset( $analytics['play']['count'] ) ) {
                $trend[ $date ]['plays'] += intval( $analytics['play']['count'] );
            }
            if ( isset( $analytics['time']['count'] ) ) {
                $trend[ $date ]['time'] += intval( $analytics['time']['count'] );
            }
            if ( isset( $analytics['init']['count'] ) ) {
                $trend[ $date ]['init'] += intval( $analytics['init']['count'] );
            }
            if ( isset( $analytics['end']['count'] ) ) {
                $trend[ $date ]['end'] += intval( $analytics['end']['count'] );
            }
            if ( isset( $analytics['download']['count'] ) ) {
                $trend[ $date ]['downloads'] += intval( $analytics['download']['count'] );
            }
        }

        $response['status'] = true;
        $response['data']   = array_values( $trend );
        $response['dates']  = $dates;

        return rest_ensure_response( $response );
    }

    /**
     * Get heatmap data for peak hours (Pro only)
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function heatmap_data( $request ) {
        if ( ! TTA_Helper::is_pro_active() ) {
            return rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'This feature requires Pro version.', 'text-to-audio' ),
            ) );
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'atlasvoice_analytics';

        $date_range = $request->get_param( 'date_range' );
        $from_date  = $request->get_param( 'from_date' );
        $to_date    = $request->get_param( 'to_date' );
        $dates      = $this->calculate_date_range( $date_range, $from_date, $to_date );

        $conditions = array();
        $values     = array();

        if ( $dates['from_date'] ) {
            $conditions[] = 'created_at >= %s';
            $values[]     = $dates['from_date'];
        }
        if ( $dates['to_date'] ) {
            $conditions[] = 'updated_at <= %s';
            $values[]     = $dates['to_date'];
        }

        $where_clause = '';
        if ( ! empty( $conditions ) ) {
            $where_clause = 'WHERE ' . implode( ' AND ', $conditions );
        }

        if ( ! empty( $values ) ) {
            $query = "SELECT created_at, analytics FROM $table_name $where_clause";
            $results = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A );
        } else {
            $results = $wpdb->get_results( "SELECT created_at, analytics FROM $table_name", ARRAY_A );
        }

        // Build heatmap matrix (7 days x 24 hours)
        $days = array( 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' );
        $heatmap = array();

        foreach ( $days as $day ) {
            $heatmap[ $day ] = array_fill( 0, 24, 0 );
        }

        foreach ( $results as $result ) {
            $analytics = maybe_unserialize( $result['analytics'] );

            // Use play timestamp if available, otherwise created_at
            $timestamp = $result['created_at'];
            if ( isset( $analytics['play']['timestamp'] ) ) {
                $timestamp = $analytics['play']['timestamp'];
            }

            $day_of_week = date( 'l', strtotime( $timestamp ) );
            $hour        = intval( date( 'H', strtotime( $timestamp ) ) );

            $play_count = isset( $analytics['play']['count'] ) ? intval( $analytics['play']['count'] ) : 1;
            $heatmap[ $day_of_week ][ $hour ] += $play_count;
        }

        // Find peak hour
        $peak_day  = '';
        $peak_hour = 0;
        $peak_value = 0;

        foreach ( $heatmap as $day => $hours ) {
            foreach ( $hours as $hour => $value ) {
                if ( $value > $peak_value ) {
                    $peak_value = $value;
                    $peak_day   = $day;
                    $peak_hour  = $hour;
                }
            }
        }

        $response['status'] = true;
        $response['data']   = $heatmap;
        $response['peak']   = array(
            'day'   => $peak_day,
            'hour'  => $peak_hour,
            'value' => $peak_value,
        );

        return rest_ensure_response( $response );
    }

    /**
     * Export analytics data as CSV (Pro only)
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function export_csv( $request ) {
        if ( ! TTA_Helper::is_pro_active() ) {
            return rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'This feature requires Pro version.', 'text-to-audio' ),
            ) );
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'atlasvoice_analytics';

        $date_range = $request->get_param( 'date_range' );
        $dates      = $this->calculate_date_range( $date_range );

        $conditions = array();
        $values     = array();

        if ( $dates['from_date'] ) {
            $conditions[] = 'created_at >= %s';
            $values[]     = $dates['from_date'];
        }
        if ( $dates['to_date'] ) {
            $conditions[] = 'updated_at <= %s';
            $values[]     = $dates['to_date'];
        }

        $where_clause = '';
        if ( ! empty( $conditions ) ) {
            $where_clause = 'WHERE ' . implode( ' AND ', $conditions );
        }

        if ( ! empty( $values ) ) {
            $query = "SELECT * FROM $table_name $where_clause ORDER BY created_at DESC";
            $results = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A );
        } else {
            $results = $wpdb->get_results( "SELECT * FROM $table_name ORDER BY created_at DESC", ARRAY_A );
        }

        // Build CSV data
        $csv_data = array();
        $csv_data[] = array(
            'Post ID',
            'Post Title',
            'User ID',
            'Init',
            'Play',
            'Pause',
            'End',
            'Time (seconds)',
            'Download',
            '25%',
            '50%',
            '75%',
            'Platform',
            'Device',
            'Browser',
            'Country',
            'City',
            'Region',
            'Created At',
            'Updated At',
        );

        foreach ( $results as $result ) {
            $analytics = maybe_unserialize( $result['analytics'] );

            $csv_data[] = array(
                $result['post_id'],
                get_the_title( $result['post_id'] ),
                $result['user_id'],
                isset( $analytics['init']['count'] ) ? $analytics['init']['count'] : 0,
                isset( $analytics['play']['count'] ) ? $analytics['play']['count'] : 0,
                isset( $analytics['pause']['count'] ) ? $analytics['pause']['count'] : 0,
                isset( $analytics['end']['count'] ) ? $analytics['end']['count'] : 0,
                isset( $analytics['time']['count'] ) ? $analytics['time']['count'] : 0,
                isset( $analytics['download']['count'] ) ? $analytics['download']['count'] : 0,
                isset( $analytics['25_percent']['count'] ) ? $analytics['25_percent']['count'] : 0,
                isset( $analytics['50_percent']['count'] ) ? $analytics['50_percent']['count'] : 0,
                isset( $analytics['75_percent']['count'] ) ? $analytics['75_percent']['count'] : 0,
                isset( $analytics['platform'] ) ? $analytics['platform'] : '',
                isset( $analytics['deviceType'] ) ? $analytics['deviceType'] : '',
                isset( $analytics['browser'] ) ? $analytics['browser'] : '',
                isset( $analytics['country'] ) ? $analytics['country'] : '',
                isset( $analytics['city'] ) ? $analytics['city'] : '',
                isset( $analytics['region'] ) ? $analytics['region'] : '',
                $result['created_at'],
                $result['updated_at'],
            );
        }

        // Generate CSV string
        $csv_string = '';
        foreach ( $csv_data as $row ) {
            $csv_string .= implode( ',', array_map( function( $field ) {
                return '"' . str_replace( '"', '""', $field ) . '"';
            }, $row ) ) . "\n";
        }

        $response['status']   = true;
        $response['data']     = base64_encode( $csv_string );
        $response['filename'] = 'tts-analytics-' . date( 'Y-m-d' ) . '.csv';

        return rest_ensure_response( $response );
    }

    /**
     * Check if WordPress can send emails
     * Tests the email configuration by checking common SMTP plugins and WordPress mail capability
     *
     * @return array Array with 'can_send' boolean and 'message' string
     */
    public function check_email_capability() {
        $result = array(
            'can_send'    => true,
            'message'     => '',
            'smtp_plugin' => null,
        );

        // Check for common SMTP plugins
        $smtp_plugins = array(
            'wp-mail-smtp/wp_mail_smtp.php'           => 'WP Mail SMTP',
            'easy-wp-smtp/easy-wp-smtp.php'           => 'Easy WP SMTP',
            'post-smtp/postman-smtp.php'              => 'Post SMTP',
            'smtp-mailer/main.php'                    => 'SMTP Mailer',
            'fluent-smtp/fluent-smtp.php'             => 'FluentSMTP',
            'mailgun/mailgun.php'                     => 'Mailgun',
            'sendgrid-email-delivery-simplified/wpsendgrid.php' => 'SendGrid',
        );

        $has_smtp_plugin = false;
        foreach ( $smtp_plugins as $plugin_file => $plugin_name ) {
            if ( is_plugin_active( $plugin_file ) ) {
                $has_smtp_plugin = true;
                $result['smtp_plugin'] = $plugin_name;
                break;
            }
        }

        // Check WP Mail SMTP specific configuration
        if ( is_plugin_active( 'wp-mail-smtp/wp_mail_smtp.php' ) ) {
            $wp_mail_smtp_options = get_option( 'wp_mail_smtp', array() );
            if ( empty( $wp_mail_smtp_options ) || ( isset( $wp_mail_smtp_options['mail']['mailer'] ) && 'mail' === $wp_mail_smtp_options['mail']['mailer'] ) ) {
                // Using default PHP mail which might not work
                $result['can_send'] = true; // Still allow but warn
                $result['message'] = __( 'WP Mail SMTP is using default PHP mail. Consider configuring an SMTP server for reliable email delivery.', 'text-to-audio' );
                return $result;
            }
        }

        // If no SMTP plugin found, check if hosting might block emails
        if ( ! $has_smtp_plugin ) {
            // Try to detect common hosting environments that block PHP mail
            $server_software = isset( $_SERVER['SERVER_SOFTWARE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['SERVER_SOFTWARE'] ) ) : '';

            // Check if we're on localhost (development environment)
            $site_url = get_site_url();
            if ( strpos( $site_url, 'localhost' ) !== false || strpos( $site_url, '127.0.0.1' ) !== false || strpos( $site_url, '.test' ) !== false || strpos( $site_url, '.local' ) !== false ) {
                $result['can_send'] = false;
                $result['message'] = __( 'Email sending may not work on localhost. Please install an SMTP plugin (like WP Mail SMTP) and configure it with a real email service (Gmail, SendGrid, Mailgun, etc.) for reliable email delivery.', 'text-to-audio' );
                return $result;
            }

            // General warning for no SMTP plugin
            $result['message'] = __( 'No SMTP plugin detected. Emails will be sent using PHP mail() which may be unreliable. Consider installing WP Mail SMTP for better deliverability.', 'text-to-audio' );
        }

        return $result;
    }

    /**
     * Save schedule report settings (Pro only)
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function save_schedule_report( $request ) {
        if ( ! TTA_Helper::is_pro_active() ) {
            return rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'This feature requires Pro version.', 'text-to-audio' ),
            ) );
        }

        $body = $request->get_body();
        $settings = json_decode( $body, true );

        if ( empty( $settings ) ) {
            return rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'Invalid settings data.', 'text-to-audio' ),
            ) );
        }

        // Validate and sanitize settings
        $sanitized = array(
            'enabled'            => isset( $settings['enabled'] ) ? (bool) $settings['enabled'] : false,
            'recipients'         => isset( $settings['recipients'] ) ? sanitize_text_field( $settings['recipients'] ) : '',
            'frequency'          => isset( $settings['frequency'] ) ? sanitize_text_field( $settings['frequency'] ) : 'weekly',
            'day'                => isset( $settings['day'] ) ? sanitize_text_field( $settings['day'] ) : 'monday',
            'time'               => isset( $settings['time'] ) ? sanitize_text_field( $settings['time'] ) : '09:00',
            'includeSummary'     => isset( $settings['includeSummary'] ) ? (bool) $settings['includeSummary'] : true,
            'includeTopPosts'    => isset( $settings['includeTopPosts'] ) ? (bool) $settings['includeTopPosts'] : true,
            'includeGeo'         => isset( $settings['includeGeo'] ) ? (bool) $settings['includeGeo'] : true,
            'includeTrend'       => isset( $settings['includeTrend'] ) ? (bool) $settings['includeTrend'] : true,
            'includeDevice'      => isset( $settings['includeDevice'] ) ? (bool) $settings['includeDevice'] : true,
            'includeFullDetails' => isset( $settings['includeFullDetails'] ) ? (bool) $settings['includeFullDetails'] : false,
        );

        // Validate email addresses
        if ( $sanitized['enabled'] && ! empty( $sanitized['recipients'] ) ) {
            $emails = array_map( 'trim', explode( ',', $sanitized['recipients'] ) );
            $valid_emails = array();
            foreach ( $emails as $email ) {
                if ( is_email( $email ) ) {
                    $valid_emails[] = $email;
                }
            }
            $sanitized['recipients'] = implode( ', ', $valid_emails );

            if ( empty( $valid_emails ) ) {
                return rest_ensure_response( array(
                    'status'  => false,
                    'message' => __( 'Please provide at least one valid email address.', 'text-to-audio' ),
                ) );
            }

            // Check email capability when enabling
            $email_check = $this->check_email_capability();
            if ( ! $email_check['can_send'] ) {
                return rest_ensure_response( array(
                    'status'  => false,
                    'message' => $email_check['message'],
                ) );
            }
        }

        // Save settings
        update_option( 'tta_schedule_report_settings', $sanitized, false );

        // Schedule or unschedule the cron event
        $this->schedule_report_cron( $sanitized );

        // Prepare response with warning if applicable
        $response = array(
            'status'  => true,
            'data'    => $sanitized,
            'message' => __( 'Schedule report settings saved successfully.', 'text-to-audio' ),
        );

        // Add warning about email delivery if no SMTP plugin
        if ( $sanitized['enabled'] && ! empty( $sanitized['recipients'] ) ) {
            $email_check = $this->check_email_capability();
            if ( ! empty( $email_check['message'] ) ) {
                $response['warning'] = $email_check['message'];
            }
            if ( $email_check['smtp_plugin'] ) {
                $response['smtp_plugin'] = $email_check['smtp_plugin'];
            }
        }

        return rest_ensure_response( $response );
    }

    /**
     * Get schedule report settings (Pro only)
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function get_schedule_report( $request ) {
        if ( ! TTA_Helper::is_pro_active() ) {
            return rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'This feature requires Pro version.', 'text-to-audio' ),
            ) );
        }

        $settings = get_option( 'tta_schedule_report_settings', array(
            'enabled'            => false,
            'recipients'         => '',
            'frequency'          => 'weekly',
            'day'                => 'monday',
            'time'               => '09:00',
            'includeSummary'     => true,
            'includeTopPosts'    => true,
            'includeGeo'         => true,
            'includeTrend'       => true,
            'includeDevice'      => true,
            'includeFullDetails' => false,
        ) );

        // Get next scheduled run time
        $next_run = wp_next_scheduled( 'tta_send_scheduled_report' );

        $response['status']   = true;
        $response['data']     = $settings;
        $response['next_run'] = $next_run ? date( 'Y-m-d H:i:s', $next_run ) : null;

        return rest_ensure_response( $response );
    }

    /**
     * Send test report email — delegated to Pro plugin.
     *
     * @deprecated 2.3.0 Use TTA_Pro\TTA_Pro_Report_Email::send_test_report() via tta_pro/v1/send_test_report route.
     */
    public function send_test_report( $request ) {
        return rest_ensure_response( array(
            'status'  => false,
            'message' => __( 'This feature requires Pro version. Please use the Pro API endpoint.', 'text-to-audio' ),
        ) );
    }

    /**
     * Schedule or unschedule the report cron event
     *
     * @param array $settings Schedule settings
     */
    private function schedule_report_cron( $settings ) {
        // Clear existing scheduled event
        $timestamp = wp_next_scheduled( 'tta_send_scheduled_report' );
        if ( $timestamp ) {
            wp_unschedule_event( $timestamp, 'tta_send_scheduled_report' );
        }

        // If not enabled, don't schedule
        if ( ! $settings['enabled'] ) {
            return;
        }

        // Calculate next run time based on settings
        $next_run = $this->calculate_next_run_time( $settings );

        // Schedule the event
        if ( $next_run ) {
            wp_schedule_event( $next_run, $settings['frequency'], 'tta_send_scheduled_report' );
        }
    }

    /**
     * Calculate the next run time based on schedule settings
     *
     * @param array $settings Schedule settings
     * @return int|false Unix timestamp or false on failure
     */
    private function calculate_next_run_time( $settings ) {
        $frequency = $settings['frequency'];
        $day       = $settings['day'];
        $time      = $settings['time'];

        // Parse time
        $time_parts = explode( ':', $time );
        $hour       = isset( $time_parts[0] ) ? intval( $time_parts[0] ) : 9;
        $minute     = isset( $time_parts[1] ) ? intval( $time_parts[1] ) : 0;

        // Use DateTime with site timezone for proper UTC conversion.
        // wp_schedule_event() expects UTC timestamps — DateTime::getTimestamp() always returns UTC.
        $tz  = wp_timezone();
        $now = new \DateTime( 'now', $tz );

        switch ( $frequency ) {
            case 'daily':
                $next = new \DateTime( "today {$hour}:{$minute}", $tz );
                if ( $next <= $now ) {
                    $next->modify( '+1 day' );
                }
                break;

            case 'weekly':
                $next = new \DateTime( "today {$hour}:{$minute}", $tz );
                // Find the next occurrence of the specified day.
                $target_day = ucfirst( strtolower( $day ) );
                $current_day = $now->format( 'l' );
                if ( strtolower( $current_day ) === strtolower( $day ) && $next > $now ) {
                    // Today is the day and time hasn't passed.
                } else {
                    $next = new \DateTime( "next {$target_day} {$hour}:{$minute}", $tz );
                }
                break;

            case 'monthly':
                // First day of this month at specified time.
                $next = new \DateTime( $now->format( 'Y-m-01' ) . " {$hour}:{$minute}", $tz );
                if ( $next <= $now ) {
                    // Move to first day of next month.
                    $next->modify( 'first day of next month' );
                    $next->setTime( $hour, $minute, 0 );
                }
                break;

            default:
                return false;
        }

        // getTimestamp() always returns UTC — exactly what wp_schedule_event() expects.
        return $next->getTimestamp();
    }

    /**
     * Generate and send report — delegated to Pro plugin.
     *
     * @deprecated 2.3.0 Use TTA_Pro\TTA_Pro_Report_Email::generate_and_send_report().
     */
    public function generate_and_send_report( $settings = null, $is_test = false ) {
        if ( class_exists( 'TTA_Pro\\TTA_Pro_Report_Email' ) ) {
            $reporter = new \TTA_Pro\TTA_Pro_Report_Email();
            return $reporter->generate_and_send_report( $settings, $is_test );
        }
        return false;
    }

    /**
     * Build the HTML email content for the report.
     *
     * @deprecated 2.3.0 Moved to TTA_Pro\TTA_Pro_Report_Email::build_report_email().
     */
    private function build_report_email( $data, $settings, $date_range, $is_test = false ) {
        $site_name = get_bloginfo( 'name' );
        $site_url  = get_bloginfo( 'url' );
        $summary   = $data['summary'];

        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title><?php echo esc_html( $site_name ); ?> - TTS Analytics Report</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { background: linear-gradient(135deg, #FF7853 0%, #FF9473 100%); color: white; padding: 32px 24px; text-align: center; }
                .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 600; }
                .header p { margin: 0; opacity: 0.9; font-size: 14px; }
                .content { padding: 24px; }
                .section { margin-bottom: 24px; }
                .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f3f4f6; }
                .stats-grid { display: flex; flex-wrap: wrap; gap: 12px; }
                .stat-card { flex: 1 1 calc(50% - 6px); min-width: 120px; background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; }
                .stat-value { font-size: 24px; font-weight: 700; color: #FF7853; }
                .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
                .post-list { list-style: none; padding: 0; margin: 0; }
                .post-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
                .post-item:last-child { border-bottom: none; }
                .post-title { font-weight: 500; color: #1f2937; }
                .post-plays { color: #6b7280; font-size: 14px; }
                .device-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
                .device-row:last-child { border-bottom: none; }
                .footer { background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
                .footer p { margin: 0; font-size: 12px; color: #6b7280; }
                .test-badge { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block; margin-bottom: 8px; }
                @media (max-width: 480px) { .stat-card { flex: 1 1 100%; } }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <?php if ( $is_test ) : ?>
                        <span class="test-badge"><?php esc_html_e( 'TEST REPORT', 'text-to-audio' ); ?></span>
                    <?php endif; ?>
                    <h1><?php echo esc_html( $site_name ); ?></h1>
                    <?php /* translators: %s: Date range for the analytics report */ ?>
                    <p><?php printf( esc_html__( 'TTS Analytics Report - %s', 'text-to-audio' ), esc_html( $date_range ) ); ?></p>
                </div>

                <div class="content">
                    <?php if ( $settings['includeSummary'] ) : ?>
                    <div class="section">
                        <h2 class="section-title"><?php esc_html_e( 'Summary', 'text-to-audio' ); ?></h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value"><?php echo number_format( $summary['total_play'] ); ?></div>
                                <div class="stat-label"><?php esc_html_e( 'Total Plays', 'text-to-audio' ); ?></div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value"><?php echo number_format( $summary['total_users'] ); ?></div>
                                <div class="stat-label"><?php esc_html_e( 'Unique Listeners', 'text-to-audio' ); ?></div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value"><?php echo number_format( $summary['total_end'] ); ?></div>
                                <div class="stat-label"><?php esc_html_e( 'Completions', 'text-to-audio' ); ?></div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value"><?php echo number_format( round( $summary['total_time'] / 60 ) ); ?></div>
                                <div class="stat-label"><?php esc_html_e( 'Minutes Played', 'text-to-audio' ); ?></div>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <?php if ( $settings['includeTopPosts'] && ! empty( $data['posts'] ) ) : ?>
                    <div class="section">
                        <h2 class="section-title"><?php esc_html_e( 'Top 10 Posts', 'text-to-audio' ); ?></h2>
                        <ul class="post-list">
                            <?php
                            $count = 0;
                            foreach ( $data['posts'] as $post ) :
                                if ( $count >= 10 ) break;
                                $count++;
                            ?>
                            <li class="post-item">
                                <span class="post-title"><?php echo esc_html( $post['title'] ?: 'Post #' . $post['post_id'] ); ?></span>
                                <?php /* translators: %d: Number of plays */ ?>
                                <span class="post-plays"><?php printf( esc_html__( '%d plays', 'text-to-audio' ), $post['total_plays'] ); ?></span>
                            </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>

                    <?php if ( $settings['includeDevice'] && ( ! empty( $data['device'] ) || ! empty( $data['browser'] ) ) ) : ?>
                    <div class="section">
                        <h2 class="section-title"><?php esc_html_e( 'Device & Browser Stats', 'text-to-audio' ); ?></h2>
                        <?php if ( ! empty( $data['device'] ) ) : ?>
                        <h3 style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;"><?php esc_html_e( 'Devices', 'text-to-audio' ); ?></h3>
                        <?php
                        $count = 0;
                        foreach ( $data['device'] as $device => $plays ) :
                            if ( $count >= 5 ) break;
                            $count++;
                        ?>
                        <div class="device-row">
                            <span><?php echo esc_html( ucfirst( $device ) ); ?></span>
                            <span><?php echo number_format( $plays ); ?></span>
                        </div>
                        <?php endforeach; ?>
                        <?php endif; ?>

                        <?php if ( ! empty( $data['browser'] ) ) : ?>
                        <h3 style="font-size: 14px; color: #6b7280; margin: 16px 0 8px 0;"><?php esc_html_e( 'Browsers', 'text-to-audio' ); ?></h3>
                        <?php
                        $count = 0;
                        foreach ( $data['browser'] as $browser => $plays ) :
                            if ( $count >= 5 ) break;
                            $count++;
                        ?>
                        <div class="device-row">
                            <span><?php echo esc_html( $browser ); ?></span>
                            <span><?php echo number_format( $plays ); ?></span>
                        </div>
                        <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>

                    <?php if ( $settings['includeGeo'] && ! empty( $data['country'] ) ) : ?>
                    <div class="section">
                        <h2 class="section-title"><?php esc_html_e( 'Geographic Distribution', 'text-to-audio' ); ?></h2>
                        <?php
                        $count = 0;
                        foreach ( $data['country'] as $country => $plays ) :
                            if ( $count >= 10 ) break;
                            $count++;
                        ?>
                        <div class="device-row">
                            <span><?php echo esc_html( $country ); ?></span>
                            <span><?php echo number_format( $plays ); ?></span>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>

                <div class="footer">
                    <?php /* translators: %s: Site name */ ?>
                    <p><?php printf( esc_html__( 'This report was generated by AtlasVoice on %s', 'text-to-audio' ), esc_html( $site_name ) ); ?></p>
                    <p style="margin-top: 8px;"><a href="<?php echo esc_url( admin_url( 'admin.php?page=tts-dashboard#/analytics' ) ); ?>"><?php esc_html_e( 'View full analytics dashboard', 'text-to-audio' ); ?></a></p>
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Export analytics data as PDF (Pro only)
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function export_pdf( $request ) {
        if ( ! TTA_Helper::is_pro_active() ) {
            return rest_ensure_response( array(
                'status'  => false,
                'message' => __( 'This feature requires Pro version.', 'text-to-audio' ),
            ) );
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'atlasvoice_analytics';

        $date_range = $request->get_param( 'date_range' );
        $from_date  = $request->get_param( 'from_date' );
        $to_date    = $request->get_param( 'to_date' );
        $dates      = $this->calculate_date_range( $date_range, $from_date, $to_date );

        $conditions = array();
        $values     = array();

        if ( $dates['from_date'] ) {
            $conditions[] = 'created_at >= %s';
            $values[]     = $dates['from_date'];
        }
        if ( $dates['to_date'] ) {
            $conditions[] = 'updated_at <= %s';
            $values[]     = $dates['to_date'];
        }

        $where_clause = '';
        if ( ! empty( $conditions ) ) {
            $where_clause = 'WHERE ' . implode( ' AND ', $conditions );
        }

        if ( ! empty( $values ) ) {
            $query = "SELECT * FROM $table_name $where_clause ORDER BY created_at DESC";
            $results = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A );
        } else {
            $results = $wpdb->get_results( "SELECT * FROM $table_name ORDER BY created_at DESC", ARRAY_A );
        }

        // Aggregate the data for summary
        $aggregated = $this->aggregate_analytics_data( $results );
        $summary = $aggregated['summary'];
        $site_name = get_bloginfo( 'name' );

        // Build HTML content for PDF
        $html_content = $this->build_pdf_html( $aggregated, $date_range, $results );

        // Return HTML content that will be converted to PDF on frontend
        $response['status']      = true;
        $response['data']        = base64_encode( $html_content );
        $response['filename']    = 'tts-analytics-' . date( 'Y-m-d' ) . '.pdf';
        $response['aggregated']  = $aggregated;
        $response['date_range']  = $date_range;
        $response['dates']       = $dates;

        return rest_ensure_response( $response );
    }

    /**
     * Build HTML content for PDF export
     *
     * @param array  $data       Aggregated analytics data
     * @param string $date_range Date range description
     * @param array  $results    Raw results for detailed table
     * @return string HTML content
     */
    private function build_pdf_html( $data, $date_range, $results ) {
        $site_name = get_bloginfo( 'name' );
        $summary = $data['summary'];

        ob_start();
        ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><?php echo esc_html( $site_name ); ?> - TTS Analytics Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #1f2937; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #FF7853; }
        .header h1 { font-size: 24px; color: #FF7853; margin-bottom: 5px; }
        .header p { color: #6b7280; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
        .summary-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }
        .summary-card { flex: 1 1 calc(25% - 15px); min-width: 120px; background: #f9fafb; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e5e7eb; }
        .summary-value { font-size: 20px; font-weight: 700; color: #FF7853; }
        .summary-label { font-size: 11px; color: #6b7280; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 11px; text-transform: uppercase; }
        td { font-size: 12px; color: #4b5563; }
        tr:nth-child(even) { background: #fafafa; }
        .two-col { display: flex; gap: 30px; }
        .two-col > div { flex: 1; }
        .bar-chart { margin-top: 10px; }
        .bar-item { display: flex; align-items: center; margin-bottom: 8px; }
        .bar-label { width: 100px; font-size: 11px; color: #4b5563; }
        .bar-container { flex: 1; height: 20px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; background: linear-gradient(90deg, #FF7853, #FF9473); border-radius: 4px; }
        .bar-value { width: 50px; text-align: right; font-size: 11px; color: #6b7280; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 10px; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1><?php echo esc_html( $site_name ); ?></h1>
        <?php /* translators: %s: Date range for the analytics report */ ?>
        <p><?php printf( esc_html__( 'TTS Analytics Report - %s', 'text-to-audio' ), esc_html( $date_range ) ); ?></p>
        <?php /* translators: %s: Generated date and time */ ?>
        <p style="font-size: 11px; margin-top: 5px;"><?php printf( esc_html__( 'Generated on %s', 'text-to-audio' ), date( 'F j, Y g:i A' ) ); ?></p>
    </div>

    <!-- Summary Section -->
    <div class="section">
        <h2 class="section-title"><?php esc_html_e( 'Summary Overview', 'text-to-audio' ); ?></h2>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value"><?php echo number_format( $summary['total_play'] ); ?></div>
                <div class="summary-label"><?php esc_html_e( 'Total Plays', 'text-to-audio' ); ?></div>
            </div>
            <div class="summary-card">
                <div class="summary-value"><?php echo number_format( $summary['total_users'] ); ?></div>
                <div class="summary-label"><?php esc_html_e( 'Unique Listeners', 'text-to-audio' ); ?></div>
            </div>
            <div class="summary-card">
                <div class="summary-value"><?php echo number_format( $summary['total_end'] ); ?></div>
                <div class="summary-label"><?php esc_html_e( 'Completions', 'text-to-audio' ); ?></div>
            </div>
            <div class="summary-card">
                <div class="summary-value"><?php echo number_format( round( $summary['total_time'] / 60 ) ); ?></div>
                <div class="summary-label"><?php esc_html_e( 'Minutes Played', 'text-to-audio' ); ?></div>
            </div>
            <div class="summary-card">
                <div class="summary-value"><?php echo number_format( $summary['total_init'] ); ?></div>
                <div class="summary-label"><?php esc_html_e( 'Initializations', 'text-to-audio' ); ?></div>
            </div>
            <div class="summary-card">
                <div class="summary-value"><?php echo number_format( $summary['total_pause'] ); ?></div>
                <div class="summary-label"><?php esc_html_e( 'Pauses', 'text-to-audio' ); ?></div>
            </div>
            <div class="summary-card">
                <div class="summary-value"><?php echo number_format( $summary['total_download'] ); ?></div>
                <div class="summary-label"><?php esc_html_e( 'Downloads', 'text-to-audio' ); ?></div>
            </div>
            <div class="summary-card">
                <div class="summary-value"><?php echo number_format( $summary['total_posts'] ); ?></div>
                <div class="summary-label"><?php esc_html_e( 'Posts Tracked', 'text-to-audio' ); ?></div>
            </div>
        </div>
    </div>

    <!-- Engagement Milestones -->
    <div class="section">
        <h2 class="section-title"><?php esc_html_e( 'Engagement Milestones', 'text-to-audio' ); ?></h2>
        <div class="bar-chart">
            <?php
            $milestones = array(
                '25%' => $summary['total_25_percent'],
                '50%' => $summary['total_50_percent'],
                '75%' => $summary['total_75_percent'],
                '100%' => $summary['total_end'],
            );
            $max_milestone = max( array_values( $milestones ) );
            foreach ( $milestones as $label => $value ) :
                $percentage = $max_milestone > 0 ? ( $value / $max_milestone ) * 100 : 0;
            ?>
            <div class="bar-item">
                <span class="bar-label"><?php echo esc_html( $label ); ?> <?php esc_html_e( 'Reached', 'text-to-audio' ); ?></span>
                <div class="bar-container">
                    <div class="bar-fill" style="width: <?php echo esc_attr( $percentage ); ?>%;"></div>
                </div>
                <span class="bar-value"><?php echo number_format( $value ); ?></span>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Device & Browser Stats -->
    <div class="section">
        <div class="two-col">
            <!-- Device Types -->
            <div>
                <h2 class="section-title"><?php esc_html_e( 'Device Types', 'text-to-audio' ); ?></h2>
                <table>
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Device', 'text-to-audio' ); ?></th>
                            <th><?php esc_html_e( 'Count', 'text-to-audio' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $count = 0;
                        foreach ( $data['device'] as $device => $plays ) :
                            if ( $count >= 10 ) break;
                            $count++;
                        ?>
                        <tr>
                            <td><?php echo esc_html( ucfirst( $device ) ); ?></td>
                            <td><?php echo number_format( $plays ); ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if ( empty( $data['device'] ) ) : ?>
                        <tr><td colspan="2"><?php esc_html_e( 'No data available', 'text-to-audio' ); ?></td></tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

            <!-- Browsers -->
            <div>
                <h2 class="section-title"><?php esc_html_e( 'Browsers', 'text-to-audio' ); ?></h2>
                <table>
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Browser', 'text-to-audio' ); ?></th>
                            <th><?php esc_html_e( 'Count', 'text-to-audio' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $count = 0;
                        foreach ( $data['browser'] as $browser => $plays ) :
                            if ( $count >= 10 ) break;
                            $count++;
                        ?>
                        <tr>
                            <td><?php echo esc_html( $browser ); ?></td>
                            <td><?php echo number_format( $plays ); ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if ( empty( $data['browser'] ) ) : ?>
                        <tr><td colspan="2"><?php esc_html_e( 'No data available', 'text-to-audio' ); ?></td></tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Operating Systems & Geographic Data -->
    <div class="section">
        <div class="two-col">
            <!-- Operating Systems -->
            <div>
                <h2 class="section-title"><?php esc_html_e( 'Operating Systems', 'text-to-audio' ); ?></h2>
                <table>
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'OS', 'text-to-audio' ); ?></th>
                            <th><?php esc_html_e( 'Count', 'text-to-audio' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $count = 0;
                        foreach ( $data['os'] as $os => $plays ) :
                            if ( $count >= 10 ) break;
                            $count++;
                        ?>
                        <tr>
                            <td><?php echo esc_html( $os ); ?></td>
                            <td><?php echo number_format( $plays ); ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if ( empty( $data['os'] ) ) : ?>
                        <tr><td colspan="2"><?php esc_html_e( 'No data available', 'text-to-audio' ); ?></td></tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

            <!-- Countries -->
            <div>
                <h2 class="section-title"><?php esc_html_e( 'Top Countries', 'text-to-audio' ); ?></h2>
                <table>
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Country', 'text-to-audio' ); ?></th>
                            <th><?php esc_html_e( 'Count', 'text-to-audio' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $count = 0;
                        foreach ( $data['country'] as $country => $plays ) :
                            if ( $count >= 10 ) break;
                            $count++;
                        ?>
                        <tr>
                            <td><?php echo esc_html( $country ); ?></td>
                            <td><?php echo number_format( $plays ); ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if ( empty( $data['country'] ) ) : ?>
                        <tr><td colspan="2"><?php esc_html_e( 'No data available', 'text-to-audio' ); ?></td></tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Top Posts -->
    <div class="section">
        <h2 class="section-title"><?php esc_html_e( 'Top 20 Posts by Interactions', 'text-to-audio' ); ?></h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">#</th>
                    <th><?php esc_html_e( 'Post Title', 'text-to-audio' ); ?></th>
                    <th style="width: 80px;"><?php esc_html_e( 'Plays', 'text-to-audio' ); ?></th>
                    <th style="width: 100px;"><?php esc_html_e( 'Time (sec)', 'text-to-audio' ); ?></th>
                    <th style="width: 100px;"><?php esc_html_e( 'Interactions', 'text-to-audio' ); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php
                $rank = 0;
                foreach ( $data['posts'] as $post ) :
                    if ( $rank >= 20 ) break;
                    $rank++;
                ?>
                <tr>
                    <td><?php echo esc_html( $rank ); ?></td>
                    <td><?php echo esc_html( $post['title'] ?: 'Post #' . $post['post_id'] ); ?></td>
                    <td><?php echo number_format( $post['total_plays'] ); ?></td>
                    <td><?php echo number_format( $post['total_time'] ); ?></td>
                    <td><?php echo number_format( $post['interactions'] ); ?></td>
                </tr>
                <?php endforeach; ?>
                <?php if ( empty( $data['posts'] ) ) : ?>
                <tr><td colspan="5"><?php esc_html_e( 'No data available', 'text-to-audio' ); ?></td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <div class="footer">
        <?php /* translators: %s: Site name */ ?>
        <p><?php printf( esc_html__( 'Generated by AtlasVoice for %s', 'text-to-audio' ), esc_html( $site_name ) ); ?></p>
        <p><?php echo esc_html( get_bloginfo( 'url' ) ); ?></p>
    </div>
</body>
</html>
        <?php
        return ob_get_clean();
    }

    /**
     * Get insights for specific post IDs with date filtering
     *
     * @param $request
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function filtered_insights( $request ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'atlasvoice_analytics';

        $post_ids   = $request->get_param( 'post_ids' );
        $date_range = $request->get_param( 'date_range' );
        $from_date  = $request->get_param( 'from_date' );
        $to_date    = $request->get_param( 'to_date' );

        $dates = $this->calculate_date_range( $date_range, $from_date, $to_date );

        $conditions = array();
        $values     = array();

        // Handle post_ids filter
        if ( ! empty( $post_ids ) ) {
            if ( is_string( $post_ids ) ) {
                $post_ids = json_decode( $post_ids, true );
            }
            if ( is_array( $post_ids ) && ! empty( $post_ids ) ) {
                $placeholders = implode( ',', array_fill( 0, count( $post_ids ), '%d' ) );
                $conditions[] = "post_id IN ($placeholders)";
                $values       = array_merge( $values, $post_ids );
            }
        }

        if ( $dates['from_date'] ) {
            $conditions[] = 'created_at >= %s';
            $values[]     = $dates['from_date'];
        }
        if ( $dates['to_date'] ) {
            $conditions[] = 'updated_at <= %s';
            $values[]     = $dates['to_date'];
        }

        $where_clause = '';
        if ( ! empty( $conditions ) ) {
            $where_clause = 'WHERE ' . implode( ' AND ', $conditions );
        }

        if ( ! empty( $values ) ) {
            $query   = "SELECT * FROM $table_name $where_clause ORDER BY updated_at DESC";
            $results = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A );
        } else {
            $results = $wpdb->get_results( "SELECT * FROM $table_name ORDER BY updated_at DESC", ARRAY_A );
        }

        // Process results
        $processed = array();
        foreach ( $results as $result ) {
            $result['analytics']  = maybe_unserialize( $result['analytics'] );
            $result['other_data'] = maybe_unserialize( $result['other_data'] );
            $result['post_title'] = get_the_title( $result['post_id'] );
            $processed[] = $result;
        }

        $response['status'] = true;
        $response['data']   = $processed;
        $response['dates']  = $dates;
        $response['count']  = count( $processed );

        return rest_ensure_response( $response );
    }
}