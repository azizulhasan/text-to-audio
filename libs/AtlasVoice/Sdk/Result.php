<?php
/**
 * AtlasVoice SDK: the outcome of one service call.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk;

/**
 * What a caller gets from the client: whether the call worked, the data,
 * and, when it did not, a stable error code to act on.
 *
 * The SDK never returns a sentence for people. Each platform turns `error`
 * into a message in its own language.
 */
final class Result {

	/**
	 * HTTP status, or 0 when the service could not be reached.
	 *
	 * @var int
	 */
	public $status;

	/**
	 * Decoded JSON, or the raw bytes of an audio answer, or null.
	 *
	 * @var mixed
	 */
	public $data;

	/**
	 * Error code from the service (see Error_Codes), or an empty string.
	 *
	 * @var string
	 */
	public $error;

	/**
	 * The service's own message for the error, as plain text, or an empty string.
	 *
	 * @var string
	 */
	public $message;

	/**
	 * Response header name (lower case) => value.
	 *
	 * @var array<string, string>
	 */
	public $headers;

	/**
	 * Why the service could not be reached, or an empty string.
	 *
	 * @var string
	 */
	public $transport_error;

	/**
	 * The id sent with this call, to find it in the logs of both sides.
	 *
	 * @var string
	 */
	public $request_id;

	/**
	 * Builds a result.
	 *
	 * @param int    $status          HTTP status.
	 * @param mixed  $data            Decoded JSON, raw bytes or null.
	 * @param string $error           Error code.
	 * @param string $message         Service message.
	 * @param array  $headers         Response headers, lower-case names.
	 * @param string $transport_error Why no answer came.
	 * @param string $request_id      Id of the call.
	 */
	public function __construct( $status, $data, $error, $message, array $headers, $transport_error, $request_id ) {
		$this->status          = (int) $status;
		$this->data            = $data;
		$this->error           = (string) $error;
		$this->message         = (string) $message;
		$this->headers         = $headers;
		$this->transport_error = (string) $transport_error;
		$this->request_id      = (string) $request_id;
	}

	/**
	 * Whether the service answered with a success status.
	 *
	 * @return bool
	 */
	public function ok() {
		return $this->status >= 200 && $this->status < 300;
	}

	/**
	 * Whether the service was reached at all.
	 *
	 * @return bool
	 */
	public function reached() {
		return $this->status > 0;
	}

	/**
	 * The code to act on: the service's code, or UNREACHABLE when there is none.
	 *
	 * @return string An empty string for a successful call.
	 */
	public function code() {
		if ( $this->ok() ) {
			return '';
		}

		return '' !== $this->error ? $this->error : Error_Codes::UNREACHABLE;
	}

	/**
	 * Whether waiting and trying again later can help (the service is busy
	 * or down), as opposed to an answer that will be the same next time.
	 *
	 * @return bool
	 */
	public function is_temporary() {
		return ! $this->reached() || in_array( $this->error, Error_Codes::TEMPORARY, true ) || $this->status >= 500;
	}

	/**
	 * One response header.
	 *
	 * @param string $name Header name, any case.
	 *
	 * @return string An empty string when the header is absent.
	 */
	public function header( $name ) {
		$name = strtolower( (string) $name );

		return isset( $this->headers[ $name ] ) ? $this->headers[ $name ] : '';
	}
}
