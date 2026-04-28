<?php

namespace TTA\AtlasVoice\Readers;

/**
 * Pods Framework reader (TTS-238 D13).
 *
 * For the post's pod (matched by post type), iterates the registered
 * fields and pulls values via the Pods public API. Falls back to the
 * raw `get_post_meta()` value if the Pods display layer fails so
 * we never lose readable text to a renderer error.
 *
 * Supported field types: text, paragraph, wysiwyg, email, phone,
 * website, slug, code, date, datetime, time, number, currency.
 *
 * Requires: Pods 2.7+.
 * Detection: `function_exists('pods')` and `class_exists('Pods')`.
 */
class PodsReader implements ReaderInterface {

	const TEXT_TYPES = array(
		'text', 'paragraph', 'wysiwyg', 'email', 'phone', 'website',
		'slug', 'code', 'date', 'datetime', 'time', 'number', 'currency',
	);

	public static function is_available(): bool {
		return function_exists( 'pods' ) && class_exists( 'Pods' );
	}

	public function plugin_label(): string {
		return 'Pods';
	}

	public function read( int $post_id, array $options = [] ): array {
		if ( ! self::is_available() ) { return array(); }

		$allowlist  = isset( $options['field_names'] ) && is_array( $options['field_names'] )
			? $options['field_names'] : array();
		$max_fields = isset( $options['max_fields'] ) ? (int) $options['max_fields'] : 50;

		$post_type = get_post_type( $post_id );
		if ( ! $post_type ) { return array(); }

		try {
			$pod = pods( $post_type, $post_id );
		} catch ( \Throwable $e ) {
			return array();
		}
		if ( ! $pod || ! is_object( $pod ) || ! method_exists( $pod, 'valid' ) || ! $pod->valid() ) {
			return array();
		}

		$fields = method_exists( $pod, 'fields' ) ? $pod->fields() : array();
		if ( ! is_array( $fields ) || empty( $fields ) ) { return array(); }

		$texts = array();

		foreach ( $fields as $name => $field ) {
			if ( count( $texts ) >= $max_fields ) { break; }
			$type = is_array( $field ) ? ( $field['type'] ?? '' ) : '';
			if ( ! in_array( $type, self::TEXT_TYPES, true ) ) { continue; }
			if ( ! empty( $allowlist ) && ! in_array( $name, $allowlist, true ) ) { continue; }

			$val = '';
			try {
				// `display()` runs Pods's filters/formatters; richer than raw.
				if ( method_exists( $pod, 'display' ) ) {
					$val = (string) $pod->display( $name );
				}
			} catch ( \Throwable $e ) {
				$val = '';
			}

			// Belt-and-braces fallback to raw post meta in case display()
			// silently returned empty for a permission-gated field.
			if ( $val === '' ) {
				$raw = get_post_meta( $post_id, $name, true );
				if ( is_string( $raw ) || is_numeric( $raw ) ) {
					$val = (string) $raw;
				}
			}

			if ( $val === '' ) { continue; }
			$text = wp_strip_all_tags( $val );
			if ( $text !== '' ) { $texts[] = $text; }
		}

		return $texts;
	}
}
