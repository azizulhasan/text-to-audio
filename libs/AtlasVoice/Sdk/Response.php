<?php
/**
 * AtlasVoice SDK: one HTTP answer.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk;

/**
 * What a transport gives back: an answer from the service, or the reason
 * no answer came.
 */
final class Response {

	/**
	 * HTTP status, or 0 when the service could not be reached.
	 *
	 * @var int
	 */
	public $status;

	/**
	 * Header name (lower case) => value.
	 *
	 * @var array<string, string>
	 */
	public $headers;

	/**
	 * Raw body.
	 *
	 * @var string
	 */
	public $body;

	/**
	 * Why the service could not be reached, or an empty string.
	 *
	 * @var string
	 */
	public $transport_error;

	/**
	 * Builds an answer.
	 *
	 * @param int    $status          HTTP status.
	 * @param array  $headers         Header name => value, any case.
	 * @param string $body            Raw body.
	 * @param string $transport_error Why no answer came, if none did.
	 */
	public function __construct( $status, array $headers, $body, $transport_error = '' ) {
		$this->status          = (int) $status;
		$this->headers         = array();
		$this->body            = (string) $body;
		$this->transport_error = (string) $transport_error;

		// Header names are case-insensitive; one spelling makes lookups reliable.
		foreach ( $headers as $name => $value ) {
			$this->headers[ strtolower( (string) $name ) ] = is_array( $value ) ? implode( ', ', $value ) : (string) $value;
		}
	}

	/**
	 * An answer for "the service could not be reached".
	 *
	 * @param string $reason What the network layer reported.
	 *
	 * @return Response
	 */
	public static function failed( $reason ) {
		return new self( 0, array(), '', (string) $reason );
	}
}
