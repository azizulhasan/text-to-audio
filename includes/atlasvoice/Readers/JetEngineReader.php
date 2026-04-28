<?php

namespace TTA\AtlasVoice\Readers;

/**
 * JetEngine (Crocoblock) reader (TTS-238 D13).
 *
 * Reads JetEngine post-meta fields registered for the post's type.
 * Field definitions live in the `jet_engine_meta_boxes` option;
 * values are stored in standard post meta keyed by the field name.
 *
 * Supported field types: text, textarea, wysiwyg, number, date,
 * datetime-local, time, html.
 *
 * Requires: JetEngine 3.0+.
 * Detection: `function_exists('jet_engine')` or `class_exists('Jet_Engine')`.
 */
class JetEngineReader implements ReaderInterface {

	const TEXT_TYPES = array(
		'text', 'textarea', 'wysiwyg', 'number', 'date',
		'datetime-local', 'time', 'html',
	);

	public static function is_available(): bool {
		return function_exists( 'jet_engine' ) || class_exists( 'Jet_Engine' );
	}

	public function plugin_label(): string {
		return 'JetEngine';
	}

	public function read( int $post_id, array $options = [] ): array {
		if ( ! self::is_available() ) { return array(); }

		$allowlist  = isset( $options['field_names'] ) && is_array( $options['field_names'] )
			? $options['field_names'] : array();
		$max_fields = isset( $options['max_fields'] ) ? (int) $options['max_fields'] : 50;

		$post_type = get_post_type( $post_id );
		if ( ! $post_type ) { return array(); }

		// Two paths: prefer the live registry (handles version drift), fall
		// back to the raw option when the runtime API has moved between
		// JetEngine releases.
		$boxes = array();
		try {
			if ( function_exists( 'jet_engine' ) ) {
				$je = jet_engine();
				if ( $je && isset( $je->meta_boxes ) && is_object( $je->meta_boxes ) && method_exists( $je->meta_boxes, 'get_meta_boxes_for_object_by_visibility' ) ) {
					$boxes = (array) $je->meta_boxes->get_meta_boxes_for_object_by_visibility( $post_type );
				}
			}
		} catch ( \Throwable $e ) {
			$boxes = array();
		}
		if ( empty( $boxes ) ) {
			$boxes = (array) get_option( 'jet_engine_meta_boxes', array() );
		}

		$texts = array();

		foreach ( $boxes as $box ) {
			if ( count( $texts ) >= $max_fields ) { break; }
			// Box → args → allowed_post_types is the typical shape, but
			// older versions kept it flat. Support both.
			$args        = $box['args']        ?? $box;
			$allowed     = $args['allowed_post_types'] ?? ( $box['allowed_post_types'] ?? array() );
			if ( ! empty( $allowed ) && ! in_array( $post_type, (array) $allowed, true ) ) { continue; }

			$fields = $box['meta_fields'] ?? ( $args['meta_fields'] ?? array() );
			foreach ( (array) $fields as $field ) {
				if ( count( $texts ) >= $max_fields ) { break; }
				$type = $field['type'] ?? '';
				$name = $field['name'] ?? '';
				if ( ! $name || ! in_array( $type, self::TEXT_TYPES, true ) ) { continue; }
				if ( ! empty( $allowlist ) && ! in_array( $name, $allowlist, true ) ) { continue; }

				$val = get_post_meta( $post_id, $name, true );
				if ( $val === '' || $val === null || $val === false ) { continue; }
				$text = wp_strip_all_tags( (string) $val );
				if ( $text !== '' ) { $texts[] = $text; }
			}
		}

		return $texts;
	}
}
