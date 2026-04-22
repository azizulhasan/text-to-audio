<?php

namespace TTA\AtlasVoice\Readers;

/**
 * MetaBox / Meta Box (rwmb_*) reader (TTS-238 D13).
 *
 * Iterates every registered meta box that belongs to the post's type,
 * then reads text-like field values via `rwmb_get_value()`.
 *
 * Supported field types:
 *   text, textarea, wysiwyg, url, email, number, date, datetime, time.
 *
 * Requires: Meta Box 4.15+ (meta-box.io).
 * Detection: `function_exists('rwmb_get_value')` + `class_exists('RWMB_Core')`.
 */
class MetaBoxReader implements ReaderInterface {

	const TEXT_TYPES = array(
		'text', 'textarea', 'wysiwyg', 'url', 'email',
		'number', 'date', 'datetime', 'time',
	);

	public static function is_available(): bool {
		return class_exists( 'RWMB_Core' ) && function_exists( 'rwmb_get_value' );
	}

	public function plugin_label(): string {
		return 'Meta Box';
	}

	public function read( int $post_id, array $options = [] ): array {
		if ( ! self::is_available() ) { return array(); }

		$allowlist  = isset( $options['field_names'] ) && is_array( $options['field_names'] )
			? $options['field_names'] : array();
		$max_fields = isset( $options['max_fields'] ) ? (int) $options['max_fields'] : 50;

		// `rwmb_get_registry('meta_box')` lists registered meta boxes.
		// Fall back to the global $rwmb object on very old versions.
		$meta_boxes = array();
		try {
			$registry   = \MetaBox\Support\Arr::get( $GLOBALS, 'rwmb' ) ?? null;
			$meta_boxes = function_exists( 'rwmb_get_registry' )
				? rwmb_get_registry( 'meta_box' )->all()
				: ( is_object( $registry ) && isset( $registry->meta_boxes ) ? $registry->meta_boxes : array() );
		} catch ( \Throwable $e ) {
			return array();
		}

		$post_type = get_post_type( $post_id );
		$texts     = array();

		foreach ( $meta_boxes as $mb ) {
			if ( count( $texts ) >= $max_fields ) { break; }
			// Filter by post type if the meta box declares one.
			$mb_types = is_object( $mb ) ? ( $mb->post_types ?? array() ) : ( $mb['post_types'] ?? array() );
			if ( ! empty( $mb_types ) && ! in_array( $post_type, (array) $mb_types, true ) ) { continue; }

			$fields = is_object( $mb ) ? ( $mb->fields ?? array() ) : ( $mb['fields'] ?? array() );
			foreach ( $fields as $field ) {
				if ( count( $texts ) >= $max_fields ) { break; }
				$ftype = is_object( $field ) ? ( $field->type ?? '' ) : ( $field['type'] ?? '' );
				$fname = is_object( $field ) ? ( $field->id ?? '' ) : ( $field['id'] ?? '' );
				if ( ! $fname || ! in_array( $ftype, self::TEXT_TYPES, true ) ) { continue; }
				if ( ! empty( $allowlist ) && ! in_array( $fname, $allowlist, true ) ) { continue; }

				try {
					$val = rwmb_get_value( $fname, array(), $post_id );
				} catch ( \Throwable $e ) {
					continue;
				}

				if ( $val === null || $val === false || $val === '' ) { continue; }
				$text = wp_strip_all_tags( (string) $val );
				if ( $text !== '' ) { $texts[] = $text; }
			}
		}

		return $texts;
	}
}
