<?php
/**
 * The voices AtlasVoice Cloud offers, as the service lists them.
 *
 * @package TTA
 */

namespace TTA\Cloud;

defined( 'ABSPATH' ) || exit;

/**
 * Reads the list of voices from AtlasVoice Cloud and keeps the answer.
 *
 * The service is the one that knows which voices exist (TTS-378): this
 * class shows its answer and adds none. The list is public on the service,
 * so the project key is not sent and a site that is not connected can read
 * it too. Everything in the answer is cleaned before it is kept, because a
 * response is data from outside the site like any other.
 *
 * The admin (through REST), `wp atlasvoice cloud voices` and an MCP server
 * all read the voices here. Nothing in the plugin's own lists or stored
 * settings is changed by it.
 */
class Voices {

	/**
	 * Start of the transient that holds a cleaned answer; one per language
	 * and engine asked for.
	 */
	const CACHE = 'atlasvoice_cloud_voices_';

	/**
	 * How long a list is kept, in seconds. Voices are added rarely.
	 */
	const CACHE_SECONDS = 43200;

	/**
	 * How long a failure is kept, so a screen that is reloaded does not ask
	 * a service that just failed again and again.
	 */
	const FAILURE_SECONDS = 60;

	/**
	 * The most voices that are kept from one answer.
	 */
	const MAX_VOICES = 2000;

	/**
	 * What a voice can say beside its id, engine, language and name.
	 */
	const DETAILS = array( 'locale', 'gender', 'model' );

	/**
	 * The voices.
	 *
	 * @param string $language Only voices of this language, e.g. "en" or "pt-br". Empty: every language.
	 * @param string $engine   Only voices of this engine, e.g. "gtts". Empty: every engine.
	 * @param bool   $refresh  Ask the service now instead of using the kept answer.
	 *
	 * @return array {
	 *     voices: array<int, array{id:string, engine:string, language:string, name:string, locale?:string, gender?:string, model?:string}>,
	 *     count: int, language: string, engine: string, source: 'service'|'none',
	 *     fetched_at: int, error: string, request_id: string
	 * }
	 */
	public static function get( $language = '', $engine = '', $refresh = false ) {
		$language = self::word( $language );
		$engine   = self::word( $engine );
		$key      = self::CACHE . md5( $language . '|' . $engine );

		if ( ! $refresh ) {
			$kept = get_transient( $key );
			if ( is_array( $kept ) ) {
				return self::shape( $kept, $language, $engine );
			}
		}

		$result = Cloud::client()->voices( $language, $engine );

		if ( $result->ok() && is_array( $result->data ) && isset( $result->data['voices'] ) && is_array( $result->data['voices'] ) ) {
			$answer = array(
				'voices'     => self::clean( $result->data['voices'] ),
				'source'     => 'service',
				'fetched_at' => time(),
				'request_id' => sanitize_text_field( $result->request_id ),
			);

			set_transient( $key, $answer, self::CACHE_SECONDS );

			/**
			 * Fires when the service's list of voices was read anew (not from
			 * the kept answer). An extension that ships its own list of an
			 * engine's voices learns here which ones the service added.
			 *
			 * @param array  $voices   The cleaned voices.
			 * @param string $language The language asked for, or ''.
			 * @param string $engine   The engine asked for, or ''.
			 */
			do_action( 'atlasvoice_cloud_voices_read', $answer['voices'], $language, $engine );

			return self::shape( $answer, $language, $engine );
		}//end if

		// The service could not answer: an empty list that says why. The
		// plugin's own lists are what its screens fall back on.
		$answer = array(
			'source'     => 'none',
			'error'      => sanitize_key( $result->code() ),
			'request_id' => sanitize_text_field( $result->request_id ),
		);

		set_transient( $key, $answer, self::FAILURE_SECONDS );

		return self::shape( $answer, $language, $engine );
	}

	/**
	 * A language or engine as the service takes it: letters, digits, "-"
	 * and "_" only, in lower case. Anything else is "not asked for".
	 *
	 * @param mixed $value What was asked for.
	 *
	 * @return string
	 */
	private static function word( $value ) {
		$value = is_scalar( $value ) ? strtolower( trim( (string) $value ) ) : '';

		return 1 === preg_match( '/^[a-z0-9_-]{1,35}$/', $value ) ? $value : '';
	}

	/**
	 * Keeps the voices that have an id, with text fields only.
	 *
	 * @param array $voices The service's list.
	 *
	 * @return array<int, array{id:string, engine:string, language:string, name:string}>
	 */
	private static function clean( array $voices ) {
		$clean = array();

		foreach ( array_slice( $voices, 0, self::MAX_VOICES ) as $voice ) {
			if ( ! is_array( $voice ) || ! isset( $voice['id'] ) || ! is_scalar( $voice['id'] ) ) {
				continue;
			}

			$id = sanitize_text_field( (string) $voice['id'] );
			if ( '' === $id ) {
				continue;
			}

			$entry = array(
				'id'       => $id,
				'engine'   => isset( $voice['engine'] ) && is_scalar( $voice['engine'] ) ? sanitize_key( sanitize_text_field( (string) $voice['engine'] ) ) : '',
				'language' => isset( $voice['lang'] ) && is_scalar( $voice['lang'] ) ? sanitize_text_field( (string) $voice['lang'] ) : '',
				'name'     => isset( $voice['name'] ) && is_scalar( $voice['name'] ) ? sanitize_text_field( (string) $voice['name'] ) : $id,
			);

			// What some engines say beside it (the AtlasVoice Cloud voices do):
			// the locale a voice is listed under, its gender and its model.
			// Kept only when the service gave it, so a plain voice stays as it was.
			foreach ( self::DETAILS as $detail ) {
				if ( isset( $voice[ $detail ] ) && is_scalar( $voice[ $detail ] ) ) {
					$value = sanitize_text_field( (string) $voice[ $detail ] );
					if ( '' !== $value ) {
						$entry[ $detail ] = 'locale' === $detail ? $value : sanitize_key( $value );
					}
				}
			}

			$clean[] = $entry;
		}//end foreach

		return $clean;
	}

	/**
	 * The answer with every part present, whatever was kept.
	 *
	 * @param array  $answer   What was kept or just read.
	 * @param string $language The language asked for.
	 * @param string $engine   The engine asked for.
	 *
	 * @return array
	 */
	private static function shape( array $answer, $language, $engine ) {
		$voices = isset( $answer['voices'] ) && is_array( $answer['voices'] ) ? array_values( $answer['voices'] ) : array();

		return array(
			'voices'     => $voices,
			'count'      => count( $voices ),
			'language'   => $language,
			'engine'     => $engine,
			'source'     => isset( $answer['source'] ) && 'service' === $answer['source'] ? 'service' : 'none',
			'fetched_at' => isset( $answer['fetched_at'] ) ? (int) $answer['fetched_at'] : 0,
			'error'      => isset( $answer['error'] ) ? (string) $answer['error'] : '',
			'request_id' => isset( $answer['request_id'] ) ? (string) $answer['request_id'] : '',
		);
	}
}
