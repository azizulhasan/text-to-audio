<?php
/**
 * WordPress adapter of the AtlasVoice SDK: logging.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use AtlasVoice\Sdk\Contracts\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Passes each service call on to the site.
 *
 * Every call fires the `atlasvoice_cloud_request` action with safe facts
 * (route, status, code, duration, request id), so a monitoring plugin or a
 * few lines in a site's own code can count failures or raise an alert. When
 * the plugin's debug mode is on, the same line is written to the PHP error
 * log, so a support request can be matched to the service's log by its id.
 *
 * No key, header or post text ever reaches this class.
 */
class Request_Log implements Logger {

	/**
	 * Records one call.
	 *
	 * @param string $level   'info' or 'error'.
	 * @param string $event   Event name.
	 * @param array  $context Facts about the call.
	 */
	public function log( $level, $event, array $context ) {
		/**
		 * Fires after each call to the AtlasVoice service.
		 *
		 * @param array  $context method, route, status, code, reached, ms, request_id.
		 * @param string $level   'info' or 'error'.
		 */
		do_action( 'atlasvoice_cloud_request', $context, $level );

		if ( defined( 'TTA_DEBUG_MODE' ) && TTA_DEBUG_MODE ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- only in the plugin's debug mode, with no secret in the line.
			error_log( 'AtlasVoice ' . $level . ' ' . $event . ' ' . wp_json_encode( $context ) );
		}
	}
}
