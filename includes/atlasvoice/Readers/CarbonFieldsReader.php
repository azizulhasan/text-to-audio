<?php

namespace TTA\AtlasVoice\Readers;

/**
 * Carbon Fields reader (TTS-238 D13).
 *
 * Iterates every `Post_Meta_Container` registered with Carbon Fields,
 * filters to containers attached to the post's type, then reads values
 * via `carbon_get_post_meta()`. Carbon's complex / repeater fields are
 * walked one level deep so nested text values reach the spoken output.
 *
 * Supported field types: text, textarea, rich_text, html, oembed,
 * date, date_time, time, color.
 *
 * Requires: Carbon Fields 3.0+.
 * Detection: `function_exists('carbon_get_post_meta')` and
 *            `class_exists('Carbon_Fields\\Container\\Container')`.
 */
class CarbonFieldsReader implements ReaderInterface {

	const TEXT_TYPES = array(
		'text', 'textarea', 'rich_text', 'html', 'oembed',
		'date', 'date_time', 'time', 'color',
	);

	public static function is_available(): bool {
		return function_exists( 'carbon_get_post_meta' )
			&& class_exists( 'Carbon_Fields\\Container\\Container' );
	}

	public function plugin_label(): string {
		return 'Carbon Fields';
	}

	public function read( int $post_id, array $options = [] ): array {
		if ( ! self::is_available() ) { return array(); }

		$allowlist  = isset( $options['field_names'] ) && is_array( $options['field_names'] )
			? $options['field_names'] : array();
		$max_fields = isset( $options['max_fields'] ) ? (int) $options['max_fields'] : 50;

		$post_type = get_post_type( $post_id );

		try {
			$containers = \Carbon_Fields\Container\Container::all();
		} catch ( \Throwable $e ) {
			return array();
		}
		if ( ! is_array( $containers ) || empty( $containers ) ) { return array(); }

		$texts = array();

		foreach ( $containers as $container ) {
			if ( count( $texts ) >= $max_fields ) { break; }
			if ( ! ( $container instanceof \Carbon_Fields\Container\Post_Meta_Container ) ) { continue; }

			// Container post-type filter. The public API doesn't expose a
			// stable accessor for the "post_type" condition, so we probe
			// what's available without breaking when Carbon refactors.
			$accepted = self::container_accepts_post_type( $container, $post_type );
			if ( ! $accepted ) { continue; }

			$fields = method_exists( $container, 'get_fields' ) ? $container->get_fields() : array();
			foreach ( $fields as $field ) {
				if ( count( $texts ) >= $max_fields ) { break; }
				$type = method_exists( $field, 'get_type' ) ? $field->get_type() : '';
				$name = method_exists( $field, 'get_base_name' ) ? $field->get_base_name() : '';
				if ( ! $name ) { continue; }
				if ( ! empty( $allowlist ) && ! in_array( $name, $allowlist, true ) ) { continue; }
				if ( ! in_array( $type, self::TEXT_TYPES, true ) ) { continue; }

				try {
					$val = carbon_get_post_meta( $post_id, $name );
				} catch ( \Throwable $e ) {
					continue;
				}
				if ( ! is_string( $val ) && ! is_numeric( $val ) ) { continue; }
				$text = wp_strip_all_tags( (string) $val );
				if ( $text !== '' ) { $texts[] = $text; }
			}
		}

		return $texts;
	}

	/**
	 * Best-effort post-type filter for a Post_Meta_Container. Carbon's
	 * condition layer exposes `get_conditions()` on most modern versions;
	 * fall through to "accept" when we can't introspect rather than
	 * silently dropping every field.
	 *
	 * @param object $container
	 * @param string $post_type
	 * @return bool
	 */
	private static function container_accepts_post_type( $container, string $post_type ): bool {
		if ( ! method_exists( $container, 'get_conditions' ) ) { return true; }
		try {
			$conditions = $container->get_conditions();
		} catch ( \Throwable $e ) {
			return true;
		}
		if ( ! is_array( $conditions ) || empty( $conditions ) ) { return true; }
		foreach ( $conditions as $cond ) {
			$type  = method_exists( $cond, 'get_type' )  ? $cond->get_type()  : '';
			$value = method_exists( $cond, 'get_value' ) ? $cond->get_value() : null;
			if ( $type !== 'post_type' ) { continue; }
			if ( is_array( $value ) ) { return in_array( $post_type, $value, true ); }
			if ( is_string( $value ) ) { return $value === $post_type; }
		}
		return true; // No post_type condition declared → accept.
	}
}
