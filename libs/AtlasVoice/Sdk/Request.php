<?php
/**
 * AtlasVoice SDK: one HTTP request.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk;

/**
 * What the client asks a transport to send. A plain value: nothing in it
 * changes after it is built.
 */
final class Request {

	/**
	 * HTTP method, upper case.
	 *
	 * @var string
	 */
	public $method;

	/**
	 * Full address, always on the configured service host.
	 *
	 * @var string
	 */
	public $url;

	/**
	 * Header name => value.
	 *
	 * @var array<string, string>
	 */
	public $headers;

	/**
	 * Request body, or null when there is none.
	 *
	 * @var string|null
	 */
	public $body;

	/**
	 * Seconds to wait for the whole answer.
	 *
	 * @var int
	 */
	public $timeout;

	/**
	 * Whether the transport may follow a redirect. False for a file
	 * download: its address was checked, and a redirect would lead to an
	 * address that was not.
	 *
	 * @var bool
	 */
	public $follow_redirects;

	/**
	 * Builds the request.
	 *
	 * @param string      $method           HTTP method.
	 * @param string      $url              Full address.
	 * @param array       $headers          Header name => value.
	 * @param string|null $body             Body, or null.
	 * @param int         $timeout          Seconds.
	 * @param bool        $follow_redirects Whether a redirect may be followed.
	 */
	public function __construct( $method, $url, array $headers, $body, $timeout, $follow_redirects = true ) {
		$this->method           = strtoupper( (string) $method );
		$this->url              = (string) $url;
		$this->headers          = $headers;
		$this->body             = null === $body ? null : (string) $body;
		$this->timeout          = (int) $timeout;
		$this->follow_redirects = (bool) $follow_redirects;
	}
}
