<?php

namespace TTA\AtlasVoice\Readers;

/**
 * Toolset Types reader (TTS-238 D13).
 *
 * Walks every Toolset Types custom field registered on the install,
 * filters to ones attached to the post's type, and pulls values from
 * `wpcf-{slug}` post meta keys (Toolset's storage convention).
 *
 * Supported field types: textfield, textarea, wysiwyg, email, url,
 * phone, numeric, date.
 *
 * Requires: Toolset Types 3.0+.
 * Detection: `function_exists('wpcf_admin_fields_get_fields')`.
 */
class ToolsetReader implements ReaderInterface {

	const TEXT_TYPES = array(
		'textfield', 'textarea', 'wysiwyg', 'email', 'url',
		'phone', 'numeric', 'date',
	);

	public static function is_available(): bool {
		return function_exists( 'wpcf_admin_fields_get_fields' )
			|| function_exists( 'types_render_field' );
	}

	public function plugin_label(): string {
		return 'Toolset Types';
	}

	public function read( int $post_id, array $options = [] ): array {
		if ( ! function_exists( 'wpcf_admin_fields_get_fields' ) ) {
			// types_render_field is present without the admin helper on
			// frontend-only installs — degrade gracefully.
			return array();
		}

		$allowlist  = isset( $options['field_names'] ) && is_array( $options['field_names'] )
			? $options['field_names'] : array();
		$max_fields = isset( $options['max_fields'] ) ? (int) $options['max_fields'] : 50;

		$post_type = get_post_type( $post_id );

		try {
			$fields = wpcf_admin_fields_get_fields();
		} catch ( \Throwable $e ) {
			return array();
		}
		if ( ! is_array( $fields ) || empty( $fields ) ) { return array(); }

		$texts = array();

		foreach ( $fields as $field ) {
			if ( count( $texts ) >= $max_fields ) { break; }
			$type = $field['type'] ?? '';
			$slug = $field['slug'] ?? ( $field['id'] ?? '' );
			if ( ! $slug || ! in_array( $type, self::TEXT_TYPES, true ) ) { continue; }
			if ( ! empty( $allowlist ) && ! in_array( $slug, $allowlist, true ) ) { continue; }

			// Toolset can scope a field to specific post types via
			// `data.post_type`. When present, honour it.
			$scoped = $field['data']['post_type'] ?? array();
			if ( ! empty( $scoped ) && is_array( $scoped ) && ! in_array( $post_type, $scoped, true ) ) {
				continue;
			}

			$val = get_post_meta( $post_id, 'wpcf-' . $slug, true );
			if ( $val === '' || $val === null || $val === false ) { continue; }
			$text = wp_strip_all_tags( (string) $val );
			if ( $text !== '' ) { $texts[] = $text; }
		}

		return $texts;
	}
}
