<?php

namespace TTA;

// TTS-247: prevent direct file access (wp.org Plugin Check requirement).
defined( 'ABSPATH' ) || exit;

/**
 * TTS-342 — self-describing REST routes.
 *
 * AI connectors (e.g. an MCP server that turns REST routes into abilities)
 * build their tool from a route's `description` and each arg's `type`,
 * `description`, `enum`, `default`, `format` and `required`. These builders
 * add that metadata WITHOUT changing how a request is handled: an arg built by
 * doc_arg() carries 'sanitize_callback' => null, which stops WordPress from
 * adding its default type check (rest_parse_request_arg), so a route that
 * accepted a request before still accepts it.
 *
 * Generic on purpose (no premium code): Pro extends it for its own routes.
 */
class TTA_Rest_Schema {

	/**
	 * A documented, NOT enforced, route argument.
	 *
	 * @param string $type        JSON Schema type: string, integer, number, boolean, array or object.
	 * @param string $description What the value means, its format and an example.
	 * @param array  $extra       Optional enum, format, items. Never 'required' => true
	 *                            or 'default': WordPress enforces/applies both even
	 *                            without a sanitize callback. Write "Required:" or
	 *                            "Defaults to …" in the description instead.
	 * @return array
	 */
	public static function doc_arg( $type, $description, array $extra = array() ) {
		return array_merge(
			array(
				'type'              => $type,
				'description'       => $description,
				'required'          => false,
				// Documentation only: keep request handling exactly as before.
				'sanitize_callback' => null,
			),
			$extra
		);
	}

	/**
	 * Args of the dashboard's settings "envelope": `method` picks read or save,
	 * `fields` carries the whole settings object as a JSON string.
	 *
	 * @param string $what   What the route stores, e.g. "the listening settings".
	 * @param string $fields What the JSON object contains (its main keys).
	 * @return array
	 */
	public static function envelope_args( $what, $fields ) {
		return array(
			'method' => self::doc_arg(
				'string',
				sprintf(
					/* translators: %s: what the route stores, e.g. "the listening settings". */
					__( 'Action to run: "get" returns %s, "post" saves the "fields" value and returns the saved result.', 'text-to-audio' ),
					$what
				),
				array( 'enum' => array( 'get', 'post' ) )
			),
			'fields' => self::doc_arg(
				'string',
				sprintf(
					/* translators: %s: description of the JSON object's keys. */
					__( 'Only for method "post": a JSON-encoded object that replaces the stored value. %s Send the full object returned by "get" with your changes applied.', 'text-to-audio' ),
					$fields
				)
			),
		);
	}

	/**
	 * Add descriptions to args that are already declared (and possibly
	 * validated) without touching their type, required flag or callbacks.
	 *
	 * @param array $args         Declared args.
	 * @param array $descriptions Arg name => description.
	 * @return array
	 */
	public static function describe( array $args, array $descriptions ) {
		foreach ( $descriptions as $name => $description ) {
			if ( isset( $args[ $name ] ) && is_array( $args[ $name ] ) && empty( $args[ $name ]['description'] ) ) {
				$args[ $name ]['description'] = $description;
			}
		}

		return $args;
	}
}
