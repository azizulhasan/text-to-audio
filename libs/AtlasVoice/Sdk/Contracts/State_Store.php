<?php
/**
 * AtlasVoice SDK: a small store for short-lived facts.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk\Contracts;

/**
 * Keeps a small value for a short time, shared by every request of the host
 * (in WordPress: a transient). The client uses it to remember that the
 * service is down, so the next page does not wait for it again.
 *
 * Nothing secret is ever stored here.
 */
interface State_Store {

	/**
	 * Reads a value.
	 *
	 * @param string $name Name of the value.
	 *
	 * @return array|null The stored array, or null when there is none.
	 */
	public function get( $name );

	/**
	 * Stores a value.
	 *
	 * @param string $name    Name of the value.
	 * @param array  $value   What to keep.
	 * @param int    $seconds How long to keep it.
	 */
	public function set( $name, array $value, $seconds );

	/**
	 * Forgets a value.
	 *
	 * @param string $name Name of the value.
	 */
	public function delete( $name );
}
