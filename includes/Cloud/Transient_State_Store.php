<?php
/**
 * WordPress adapter of the AtlasVoice SDK: short-lived state in transients.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use AtlasVoice\Sdk\Contracts\State_Store;

defined( 'ABSPATH' ) || exit;

/**
 * Keeps the SDK's short-lived facts (is the service down?) in transients,
 * so they are shared by every request and use the site's object cache when
 * it has one. Nothing secret is stored.
 */
class Transient_State_Store implements State_Store {

	/**
	 * Reads a value.
	 *
	 * @param string $name Name of the value.
	 *
	 * @return array|null
	 */
	public function get( $name ) {
		$value = get_transient( $name );

		return is_array( $value ) ? $value : null;
	}

	/**
	 * Stores a value.
	 *
	 * @param string $name    Name of the value.
	 * @param array  $value   What to keep.
	 * @param int    $seconds How long to keep it.
	 */
	public function set( $name, array $value, $seconds ) {
		set_transient( $name, $value, max( 1, (int) $seconds ) );
	}

	/**
	 * Forgets a value.
	 *
	 * @param string $name Name of the value.
	 */
	public function delete( $name ) {
		delete_transient( $name );
	}
}
