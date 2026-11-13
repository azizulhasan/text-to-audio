<?php
/**
 * AtlasVoice SDK: how a client is set up.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk;

/**
 * The settings of one client: which service it talks to and how it names
 * itself. Checked when it is built, so a wrong address fails at once and not
 * in the middle of a request.
 */
final class Config {

	/**
	 * Service address without a trailing slash, e.g. https://api.atlasvoice.cloud.
	 *
	 * @var string
	 */
	public $base_url;

	/**
	 * The host platform and its version, e.g. "wordpress/2.5.0".
	 *
	 * @var string
	 */
	public $host;

	/**
	 * Builds the settings.
	 *
	 * The service is only reached over HTTPS. Plain HTTP is accepted for a
	 * loopback address (a developer's own machine), or when the host passes
	 * `$allow_insecure` because the site's owner set a development address
	 * on purpose.
	 *
	 * @param string $base_url       Service address.
	 * @param string $host           Host platform and version, e.g. "wordpress/2.5.0".
	 * @param bool   $allow_insecure Accept an http:// address that is not loopback.
	 *
	 * @throws \InvalidArgumentException When the address is not a usable web address.
	 */
	public function __construct( $base_url, $host, $allow_insecure = false ) {
		$base_url = rtrim( trim( (string) $base_url ), '/' );
		$parts    = parse_url( $base_url ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url -- the SDK has no WordPress function in it.

		if ( ! is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
			throw new \InvalidArgumentException( 'The AtlasVoice service address is not a web address.' );
		}

		if ( isset( $parts['user'] ) || isset( $parts['pass'] ) || isset( $parts['query'] ) || isset( $parts['fragment'] ) ) {
			throw new \InvalidArgumentException( 'The AtlasVoice service address must be a plain address.' );
		}

		$scheme   = strtolower( $parts['scheme'] );
		$loopback = in_array( strtolower( $parts['host'] ), array( 'localhost', '127.0.0.1', '[::1]' ), true );

		if ( 'https' !== $scheme && ! ( 'http' === $scheme && ( $loopback || $allow_insecure ) ) ) {
			throw new \InvalidArgumentException( 'The AtlasVoice service must be reached over HTTPS.' );
		}

		$this->base_url = $base_url;
		// A header value: one line, no control characters.
		$this->host = preg_replace( '/[^\x20-\x7E]/', '', (string) $host );
	}

	/**
	 * How the client names itself to the service.
	 *
	 * @return string e.g. "wordpress/2.5.0 sdk/0.1.0".
	 */
	public function client_name() {
		return trim( $this->host . ' sdk/' . Client::VERSION );
	}
}
