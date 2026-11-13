<?php
/**
 * WordPress adapter of the AtlasVoice SDK: the factory.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use AtlasVoice\Sdk\Client;
use AtlasVoice\Sdk\Config;
use TTA\TTA_AtlasVoice_Service;

defined( 'ABSPATH' ) || exit;

/**
 * Gives the plugin its client of AtlasVoice Cloud.
 *
 * The plugin is one adapter of the service (TTS-378): the client itself is
 * platform-free (libs/AtlasVoice/Sdk); this folder holds what WordPress
 * adds to it — how to send a request, where the key lives, where to log.
 * Every part of the plugin that talks to the service gets its client here,
 * so there is one place to change how that happens.
 */
class Cloud {

	/**
	 * The live service, used when a configured address is unusable.
	 */
	const LIVE_URL = 'https://api.atlasvoice.cloud';

	/**
	 * Clients by service address, built once per request.
	 *
	 * @var Client[]
	 */
	private static $clients = array();

	/**
	 * The client for this site.
	 *
	 * @return Client
	 */
	public static function client() {
		$base_url = TTA_AtlasVoice_Service::base_url();

		if ( ! isset( self::$clients[ $base_url ] ) ) {
			$host = 'wordpress/' . ( defined( 'TEXT_TO_AUDIO_VERSION' ) ? TEXT_TO_AUDIO_VERSION : '0' );

			try {
				// Plain http is accepted only for an address the site's owner set on
				// purpose: the wp-config.php constant or the service-address filter.
				$config = new Config( $base_url, $host, defined( 'TTA_ATLASVOICE_SERVICE_URL' ) || has_filter( 'atlasvoice_service_url' ) );
			} catch ( \InvalidArgumentException $e ) {
				// An address that is not a web address must not take the site down:
				// say so to the developer and use the live service.
				_doing_it_wrong( __METHOD__, esc_html( $e->getMessage() ), '2.5.0' );
				$config = new Config( self::LIVE_URL, $host );
			}

			self::$clients[ $base_url ] = new Client(
				$config,
				new WP_Http_Transport(),
				new Option_Key_Store( TTA_AtlasVoice_Service::OPTION ),
				new Request_Log()
			);
		}//end if

		return self::$clients[ $base_url ];
	}
}
