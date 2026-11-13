<?php
/**
 * AtlasVoice SDK: how the client reaches the network.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk\Contracts;

use AtlasVoice\Sdk\Request;
use AtlasVoice\Sdk\Response;

/**
 * Sends one HTTP request and returns the answer.
 *
 * The host platform implements this with its own HTTP functions (WordPress:
 * wp_remote_request). The implementation must keep TLS certificate checks on
 * and must not follow a redirect to another host.
 */
interface Http_Transport {

	/**
	 * Sends the request.
	 *
	 * It never throws for a network problem: it returns Response::failed()
	 * with the reason, so the client has one way to handle every outcome.
	 *
	 * @param Request $request What to send.
	 *
	 * @return Response
	 */
	public function send( Request $request );
}
