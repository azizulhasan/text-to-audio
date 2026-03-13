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

use TTA\TTA_Cache;
class AtlasVoice_Plugin_Compatibility {

	/*
 * Manage settings data
 */
	public function compatible_data( $request ) {
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'] );

			update_option( 'tta_compatible_data', $fields, false );

			$response['data'] = get_option( 'tta_compatible_data' );

			TTA_Cache::delete( 'all_settings' );

			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_compatible_data' );

			return rest_ensure_response( $response );
		}
	}
}