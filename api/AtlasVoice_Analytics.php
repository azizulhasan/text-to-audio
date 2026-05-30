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
	 * TTS-247: opt-in gate for third-party IP geolocation lookups
	 * (icanhazip / ip-api / ipinfo). The toggle lives under the Analytics
	 * tab (next to `tts_enable_analytics`) and is saved by
	 * save_analytics_settings() into the `tta_analytics_settings` option.
	 */
	private static function is_geolocation_enabled() {
		$settings = (array) get_option( 'tta_analytics_settings' );
		return ! empty( $settings['tts_show_listener_location'] );
	}

	/**
	 * TTS-247: defensive guard so analytics reads never query a missing table.
	 * After a data reset the `atlasvoice_analytics` table is dropped; the dashboard
	 * still calls aggregated_insights/trend_data on load. Without this check those
	 * queries spam "Table doesn't exist" DB errors. Returns false when absent so
	 * callers can fall back to empty results.
	 *
	 * @return bool
	 */
	private function analytics_table_exists() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange
		return (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $table_name ) ) );
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

		// TTS-236: Server-side dedup safety net. If the same payload arrives
		// from the same user/post within a 2-second window, ignore the duplicate.
		// This protects against any JS-side bug that might still cause duplicate
		// fetch/sendBeacon calls on page unload (multi-listener leak, racing
		// fetch + beacon, single-page-app navigation, etc).
		$dedup_hash = md5( $user_id . '|' . $post_id . '|' . wp_json_encode( $new_analytics ) );
		$dedup_key  = 'tta_track_dedup_' . $dedup_hash;
		if ( get_transient( $dedup_key ) ) {
			return rest_ensure_response( array(
				'status' => true,
				'data'   => array( 'deduped' => true ),
			) );
		}
		set_transient( $dedup_key, 1, 2 );

		if ( ! get_option( 'atlasvoice_analytics_table_is_created' ) ) {
			TTA_Activator::create_analytics_table_if_not_exists();
		}

		global $wpdb;
		$table_name = $wpdb->prefix . 'atlasvoice_analytics';

		// Check if an entry exists
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
		$existing_entry = $wpdb->get_row( $wpdb->prepare(
			"SELECT * FROM $table_name WHERE user_id = %s AND post_id = %d",
			$user_id,
			$post_id
		) );
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter

		if ( $existing_entry ) {
			// Unserialize the existing analytics data
			$existing_analytics = maybe_unserialize( $existing_entry->analytics );

			// TTS-236: Capture old play count before merge so we can compute delta.
			$old_play_count = ( is_array( $existing_analytics ) && isset( $existing_analytics['play']['count'] ) )
				? (int) $existing_analytics['play']['count']
				: 0;

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

			// TTS-236: New play count after merge.
			$new_play_count = ( is_array( $existing_analytics ) && isset( $existing_analytics['play']['count'] ) )
				? (int) $existing_analytics['play']['count']
				: 0;

			// TTS-236: Build update args. Include play_count column only if it exists.
			$update_data   = array(
				'analytics'  => maybe_serialize( $existing_analytics ),
				'other_data' => maybe_serialize( $other_data ),
				'updated_at' => current_time( 'mysql' ),
			);
			$update_format = array( '%s', '%s', '%s' );
			if ( class_exists( '\\TTA\\TTA_Activator' ) && TTA_Activator::play_count_column_exists() ) {
				$update_data['play_count'] = $new_play_count;
				$update_format[]           = '%d';
			}

			// Update the entry
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->update(
				$table_name,
				$update_data,
				array( 'id' => $existing_entry->id ),
				$update_format,
				array( '%d' )
			);

			// TTS-236: Increment running total by the delta.
			$delta = $new_play_count - $old_play_count;
			if ( $delta > 0 && class_exists( '\\TTA\\TTA_Helper' ) ) {
				TTA_Helper::increment_total_plays_counter( $delta );
			}
		} else {
			// Create a new entry
            if( isset( $new_analytics['device_info'] ) ) {
                $new_analytics += $new_analytics['device_info'];
                unset( $new_analytics['device_info'] );
            }

			// TTS-236: New play count for insert.
			$new_play_count = isset( $new_analytics['play']['count'] )
				? (int) $new_analytics['play']['count']
				: 0;

			// TTS-236: Build insert args. Include play_count column only if it exists.
			$insert_data   = array(
				'user_id'    => $user_id,
				'post_id'    => $post_id,
				'analytics'  => maybe_serialize( $new_analytics ),
				'other_data' => maybe_serialize( $other_data ),
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			);
			$insert_format = array( '%s', '%d', '%s', '%s', '%s', '%s' );
			if ( class_exists( '\\TTA\\TTA_Activator' ) && TTA_Activator::play_count_column_exists() ) {
				$insert_data['play_count'] = $new_play_count;
				$insert_format[]           = '%d';
			}

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
            $wpdb->insert(
				$table_name,
				$insert_data,
				$insert_format
			);

			// TTS-236: Increment running total by the full new count.
			if ( $new_play_count > 0 && class_exists( '\\TTA\\TTA_Helper' ) ) {
				TTA_Helper::increment_total_plays_counter( $new_play_count );
			}
		}

		$response['status'] = true;
		$response['data']   = [];

		return rest_ensure_response( $response );

	}

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

		// TTS-247: $table_name is `$wpdb->prefix . 'atlasvoice_analytics'`
		// (server-controlled, set at class init), $where_clause is built only
		// from our own conditions; the user-controlled values go through
		// $wpdb->prepare() placeholders below.
		$query          = "SELECT * FROM $table_name $where_clause";
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
		$prepared_query = $wpdb->prepare( $query, ...$values );
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
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
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
		$results    = $wpdb->get_results( "SELECT * FROM $table_name", ARRAY_A );

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

		// TTS-247: use every configured post type — no is_pro_active() cap.
		// The previous code limited free sites to the first configured post type,
		// which the wp.org review flagged as trialware (limiting a built-in
		// feature). Free now honours the full configured list.
		if ( isset( $settings['tta__settings_allow_listening_for_post_types'] ) && count( $settings['tta__settings_allow_listening_for_post_types'] ) ) {
			$post_types = $settings['tta__settings_allow_listening_for_post_types'];
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

		// TTS-247: the "All Posts" auto-track entry is a companion-plugin (Pro)
		// convenience. Free no longer branches on is_pro_active(); a companion
		// plugin prepends the entry by hooking tts_analytics_post_list. When
		// nothing hooks it, the list contains only individually-selectable posts.
		$post_data = (array) apply_filters( 'tts_analytics_post_list', $post_data, $post_types, $post_ids );

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

		// TTS-247: the "track all" sentinel is a companion-plugin (Pro)
		// convenience injected via tts_trackable_post_ids — no is_pro_active()
		// branch in Free. Free returns the saved list untouched when nothing hooks.
		if ( isset( $body['tts_trackable_post_ids'] ) ) {
			$body['tts_trackable_post_ids'] = (array) apply_filters( 'tts_trackable_post_ids', $body['tts_trackable_post_ids'] );
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

    public function get_geolocation( $request ) {
        // TTS-247: geolocation is opt-in (wp.org Guideline 7). When the
        // setting is off (default), no remote calls to icanhazip / ip-api
        // / ipinfo happen and the endpoint returns a neutral "Unknown"
        // response. UI toggle: Settings tab; readme documents the services.
        if ( ! self::is_geolocation_enabled() ) {
            return rest_ensure_response( array(
                'status' => true,
                'data'   => array(
                    'city'    => 'Unknown',
                    'country' => 'Unknown',
                    'region'  => '',
                ),
            ) );
        }

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
        // TTS-247: bail if the opt-in switch is off; no icanhazip call.
        if ( ! self::is_geolocation_enabled() ) {
            return '';
        }
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
        // TTS-247: bail if the opt-in switch is off.
        if ( ! self::is_geolocation_enabled() ) {
            return false;
        }
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
        // TTS-247: bail if the opt-in switch is off.
        if ( ! self::is_geolocation_enabled() ) {
            return false;
        }
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

        // TTS-247: $table_name is server-controlled (wpdb prefix +
        // 'atlasvoice_analytics'). User-controlled values flow through
        // $wpdb->prepare() placeholders. Direct DB + NoCaching are
        // intentional for analytics reads (must reflect the latest write).
        // TTS-247: skip the query when the table is missing (e.g. just after a
        // data reset) so we don't emit "Table doesn't exist" DB errors.
        if ( ! $this->analytics_table_exists() ) {
            $results = array();
        } elseif ( ! empty( $values ) ) {
            $query   = "SELECT * FROM $table_name $where_clause";
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
            $results = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A );
        } else {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
            $results = $wpdb->get_results( "SELECT * FROM $table_name", ARRAY_A );
        }

        // Aggregate the data
        $aggregated = $this->aggregate_analytics_data( $results );

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
        $response['dates']       = $dates;
        $response['raw_results'] = $raw_results;

        // TTS-247: premium enrichment (e.g. previous-period comparison) is added
        // by companion plugins hooking tts_analytics_response. Free computes only
        // base data and never branches on is_pro_active(); the frontend renders a
        // section only when its data slice is present.
        return rest_ensure_response( $this->filter_analytics_response( $response, 'aggregated_insights', $dates, $results ) );
    }

    /**
     * TTS-247: single extension point for premium analytics enrichment.
     * Free returns the base response unchanged when nothing hooks the filter.
     *
     * @param array  $response The base response array.
     * @param string $context  Which analytics endpoint produced it.
     * @param array  $dates    The resolved from/to date range.
     * @param array  $results  The raw DB rows for the current period.
     * @return array
     */
    private function filter_analytics_response( $response, $context, $dates = array(), $results = array() ) {
        return (array) apply_filters( 'tts_analytics_response', $response, $context, $dates, $results );
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
                $from = gmdate( 'Y-m-d 00:00:00', strtotime( '-1 day' ) );
                $to   = gmdate( 'Y-m-d 23:59:59', strtotime( '-1 day' ) );
                break;
            case 'Last 7 Days':
                $from = gmdate( 'Y-m-d 00:00:00', strtotime( '-7 days' ) );
                break;
            case 'Last 30 Days':
                $from = gmdate( 'Y-m-d 00:00:00', strtotime( '-30 days' ) );
                break;
            case 'Last 90 Days':
                $from = gmdate( 'Y-m-d 00:00:00', strtotime( '-90 days' ) );
                break;
            case 'Custom':
                if ( $from_date ) {
                    $from = gmdate( 'Y-m-d 00:00:00', strtotime( $from_date ) );
                }
                if ( $to_date ) {
                    $to = gmdate( 'Y-m-d 23:59:59', strtotime( $to_date ) );
                }
                break;
            default:
                // Default to last 7 days
                $from = gmdate( 'Y-m-d 00:00:00', strtotime( '-7 days' ) );
                $number = preg_replace('/[^0-9]/', '', (string) ( $date_range ?? '' ));
                if(is_numeric($number)) {
                    $from = gmdate( 'Y-m-d 00:00:00', strtotime(  '-'.$from_date. ' days' ) );
                }

                break;
        }

        return array(
            'from_date' => $from,
            'to_date'   => $to,
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

            // Process device info (stored at top level of analytics).
            // TTS-247/2.2.2: the audience breakdowns (OS, device, browser,
            // country, city) are a premium feature — Free no longer aggregates
            // them here. The Pro plugin computes and injects them into the
            // aggregated_insights response by hooking tts_analytics_response
            // (see TTA_Pro_AtlasVoice_Analytics::inject_premium_analytics).
            $device_fields = array(
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
                $hour = gmdate( 'H', strtotime( $analytics['play']['timestamp'] ) );
                $day  = gmdate( 'l', strtotime( $analytics['play']['timestamp'] ) );

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

        // TTS-247/2.2.2: os/device/browser/country/city are populated by Pro
        // (injected into aggregated_insights), so Free leaves them empty here.
        // Pro sorts its own injected breakdowns.

        // Remove raw user data from response (keep only segments)
        unset( $aggregated['users'] );

        return $aggregated;
    }

    /**
     * NOTE: trend_data() was moved to the Pro plugin in 2.2.2. The Playing
     * Trend Analysis chart is now a premium feature — Free no longer computes
     * or exposes this data (the free dashboard shows the locked "Upgrade to
     * Pro" card). The handler now lives in Pro's TTA_Pro_AtlasVoice_Analytics,
     * registered under tta_pro/v1/trend_data. (Same pattern as heatmap_data.)
     */


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
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
            $results = $wpdb->get_results( $wpdb->prepare( $query, ...$values ), ARRAY_A );
        } else {
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter
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

        return rest_ensure_response( $this->filter_analytics_response( $response, 'filtered_insights', $dates, $results ) );
    }
}