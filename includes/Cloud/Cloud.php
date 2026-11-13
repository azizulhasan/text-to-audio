<?php
/**
 * WordPress adapter of the AtlasVoice SDK: the factory.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use AtlasVoice\Sdk\Circuit_Breaker;
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
	 * Start of the transient that remembers a service is down.
	 */
	const STATE_PREFIX = 'atlasvoice_cloud_state_';

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
		return self::client_for( TTA_AtlasVoice_Service::base_url() );
	}

	/**
	 * A client for another address of the AtlasVoice service (the voice
	 * engines run on their own host).
	 *
	 * The project key is sent to this address, so it must be one the plugin
	 * or the site's owner configured — never one taken from a request, a
	 * response or stored content.
	 *
	 * @param string $base_url Address of the service, e.g. "https://voice.atlasvoice.cloud".
	 *
	 * @return Client
	 */
	public static function client_for( $base_url ) {
		$base_url = (string) $base_url;

		if ( ! isset( self::$clients[ $base_url ] ) ) {
			$host = 'wordpress/' . ( defined( 'TEXT_TO_AUDIO_VERSION' ) ? TEXT_TO_AUDIO_VERSION : '0' );

			try {
				// Plain http is accepted only for an address the site's owner set on
				// purpose: the wp-config.php constant or the service-address filter.
				$config = new Config( $base_url, $host, defined( 'TTA_ATLASVOICE_SERVICE_URL' ) || has_filter( 'atlasvoice_service_url' ) );
			} catch ( \InvalidArgumentException $e ) {
				// An address that is not a web address must not take the site down:
				// say so to the developer and use the live service.
				_doing_it_wrong( 'TTA\Cloud\Cloud::client', esc_html( $e->getMessage() ), '2.5.0' );
				$config = new Config( self::LIVE_URL, $host );
			}

			/**
			 * Whether calls are paused while the service is down or asks for a
			 * pause. On by default; a developer can turn it off while testing.
			 *
			 * @param bool   $enabled  Default true.
			 * @param string $base_url Address of the service.
			 */
			$guarded = (bool) apply_filters( 'atlasvoice_cloud_circuit_breaker', true, $config->base_url );

			self::$clients[ $base_url ] = new Client(
				$config,
				new WP_Http_Transport(),
				new Option_Key_Store( TTA_AtlasVoice_Service::OPTION ),
				new Request_Log(),
				$guarded ? new Circuit_Breaker( new Transient_State_Store(), self::STATE_PREFIX . md5( $config->base_url ) ) : null
			);
		}//end if

		return self::$clients[ $base_url ];
	}

	/**
	 * Forgets the clients built in this request. For tests.
	 */
	public static function reset() {
		self::$clients = array();
	}
}
