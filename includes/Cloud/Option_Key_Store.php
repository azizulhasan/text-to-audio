<?php
/**
 * WordPress adapter of the AtlasVoice SDK: the project key.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use AtlasVoice\Sdk\Contracts\Key_Store;

defined( 'ABSPATH' ) || exit;

/**
 * Reads the site's key from where the plugin has always kept it: the
 * `api_key` field of the `tta_atlasvoice_service` option. Nothing about the
 * stored data changes.
 *
 * The option is not autoloaded and is only read on the server; the key is
 * never added to data that is printed for a browser.
 */
class Option_Key_Store implements Key_Store {

	/**
	 * Option that holds the service state.
	 *
	 * @var string
	 */
	private $option;

	/**
	 * Builds the store.
	 *
	 * @param string $option Option name.
	 */
	public function __construct( $option ) {
		$this->option = (string) $option;
	}

	/**
	 * The key, or an empty string when the site has none.
	 *
	 * @return string
	 */
	public function get_key() {
		$state = get_option( $this->option, array() );

		return is_array( $state ) && isset( $state['api_key'] ) && is_string( $state['api_key'] ) ? $state['api_key'] : '';
	}
}
