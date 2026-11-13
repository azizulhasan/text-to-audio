<?php
/**
 * AtlasVoice SDK: where the project key lives.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk\Contracts;

/**
 * Gives the client the project's secret key.
 *
 * The key is read every time it is needed and is never kept by the client,
 * so a key that was revoked or replaced is gone at once. The host stores it
 * where only server code can read it; it must never be sent to a browser.
 */
interface Key_Store {

	/**
	 * The secret key of this project, or an empty string when there is none.
	 *
	 * @return string
	 */
	public function get_key();
}
