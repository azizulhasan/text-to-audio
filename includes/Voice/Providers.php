<?php
/**
 * The voice providers a site can use with its own account.
 *
 * @package TTA
 */

namespace TTA\Voice;

defined( 'ABSPATH' ) || exit;

/**
 * Says which outside providers the site can use with its own keys (Google
 * Cloud, OpenAI, ElevenLabs, and Google Cloud Storage for the files), and
 * whether each is connected.
 *
 * The free plugin holds no provider code today: the engines and the key
 * settings are in AtlasVoice Pro, which reports their state through the
 * `atlasvoice_own_providers` filter. This class only shows that state.
 *
 * A key is never part of the answer. Whatever a filter returns, only the
 * known providers are kept, each with a yes/no and one short line of text.
 *
 * The admin screen (REST), `wp atlasvoice providers` and an MCP server all
 * read it here.
 */
class Providers {

	/**
	 * The longest "detail" line that is kept. Long enough for an email
	 * address or a project name, too short to be mistaken for a place to
	 * put a credential.
	 */
	const DETAIL_LENGTH = 100;

	/**
	 * The providers and their state.
	 *
	 * @return array {
	 *     available: bool,
	 *     providers: array<int, array{id:string, name:string, kind:string, connected:bool, detail:string}>
	 * }
	 */
	public static function get() {
		$known = self::known();

		/**
		 * Filters the state of the site's own voice providers. The code that
		 * holds a provider's settings sets `connected` and may add one short
		 * `detail` line (an account email, a project name). Never a key.
		 *
		 * @param array $providers Provider id => { available: bool, connected: bool, detail: string }.
		 */
		$reported = apply_filters( 'atlasvoice_own_providers', array() );
		$reported = is_array( $reported ) ? $reported : array();

		$providers = array();
		$available = false;

		foreach ( $known as $id => $provider ) {
			$state = isset( $reported[ $id ] ) && is_array( $reported[ $id ] ) ? $reported[ $id ] : array();

			$has_code  = ! empty( $state['available'] );
			$available = $available || $has_code;

			$providers[] = array(
				'id'        => $id,
				'name'      => $provider['name'],
				'kind'      => $provider['kind'],
				'available' => $has_code,
				// A provider without code on this site cannot be connected.
				'connected' => $has_code && ! empty( $state['connected'] ),
				'detail'    => $has_code ? self::detail( isset( $state['detail'] ) ? $state['detail'] : '' ) : '',
			);
		}

		return array(
			'available' => $available,
			'providers' => $providers,
		);
	}

	/**
	 * The providers the plugin family supports.
	 *
	 * @return array<string, array{name:string, kind:string}>
	 */
	private static function known() {
		return array(
			'google'     => array(
				'name' => 'Google Cloud Text-to-Speech',
				'kind' => 'voice',
			),
			'openai'     => array(
				'name' => 'OpenAI',
				'kind' => 'voice',
			),
			'elevenlabs' => array(
				'name' => 'ElevenLabs',
				'kind' => 'voice',
			),
			'gcs'        => array(
				'name' => 'Google Cloud Storage',
				'kind' => 'storage',
			),
		);
	}

	/**
	 * One short, plain line. Anything that looks like a credential is
	 * dropped: a long unbroken run of key characters has no place here.
	 *
	 * @param mixed $value What a filter returned.
	 *
	 * @return string
	 */
	private static function detail( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$value = sanitize_text_field( $value );

		if ( preg_match( '/[A-Za-z0-9_\-]{32,}/', $value ) || false !== stripos( $value, 'PRIVATE KEY' ) ) {
			return '';
		}

		return mb_substr( $value, 0, self::DETAIL_LENGTH );
	}
}
