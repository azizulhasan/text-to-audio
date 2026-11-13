<?php
/**
 * WordPress adapter of the AtlasVoice SDK: the network.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use AtlasVoice\Sdk\Contracts\Http_Transport;
use AtlasVoice\Sdk\Request;
use AtlasVoice\Sdk\Response;

defined( 'ABSPATH' ) || exit;

/**
 * Sends the SDK's requests with WordPress's HTTP API, so a site's proxy,
 * certificates and `pre_http_request` filters apply as for any other request.
 */
class WP_Http_Transport implements Http_Transport {

	/**
	 * Sends the request.
	 *
	 * @param Request $request What to send.
	 *
	 * @return Response
	 */
	public function send( Request $request ) {
		$args = array(
			'method'  => $request->method,
			'timeout' => $request->timeout,
			'headers' => $request->headers,
		);

		if ( ! $request->follow_redirects ) {
			$args['redirection'] = 0;
		}

		if ( null !== $request->body ) {
			$args['body'] = $request->body;
		}

		$response = wp_remote_request( $request->url, $args );

		if ( is_wp_error( $response ) ) {
			return Response::failed( $response->get_error_message() );
		}

		$headers = wp_remote_retrieve_headers( $response );
		$headers = is_object( $headers ) && method_exists( $headers, 'getAll' ) ? $headers->getAll() : (array) $headers;

		return new Response(
			(int) wp_remote_retrieve_response_code( $response ),
			$headers,
			(string) wp_remote_retrieve_body( $response )
		);
	}
}
