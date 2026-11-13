<?php
/**
 * AtlasVoice SDK: where the client reports what it did.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk\Contracts;

/**
 * Receives one structured line per service call.
 *
 * The client only ever passes facts that are safe to store: the method, the
 * route, the status, the error code, the duration and the request id. It
 * never passes a key, a header or the text of a post.
 */
interface Logger {

	/**
	 * Records an event.
	 *
	 * @param string $level   'info' or 'error'.
	 * @param string $event   A short name, e.g. 'request'.
	 * @param array  $context Facts about the event.
	 */
	public function log( $level, $event, array $context );
}
