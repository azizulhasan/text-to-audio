<?php

namespace TTA\AtlasVoice\Readers;

/**
 * Advanced Custom Fields (ACF / ACF Pro) reader (TTS-238 D13).
 *
 * Walks every field group attached to the post and collects values
 * from text-like field types: text, textarea, wysiwyg, url, email,
 * number, range, date_picker, date_time_picker, time_picker, and the
 * flexible-content / repeater sub-fields of those same types.
 *
 * Requires: Advanced Custom Fields 5.0+ (free or Pro).
 * Detection: `function_exists('acf_get_field_groups')`.
 */
class AcfReader implements ReaderInterface {

	/** ACF field types whose values are meaningful as spoken text. */
	const TEXT_TYPES = array(
		'text', 'textarea', 'wysiwyg', 'url', 'email',
		'number', 'range', 'date_picker', 'date_time_picker', 'time_picker',
	);

	public static function is_available(): bool {
		return function_exists( 'acf_get_field_groups' ) && function_exists( 'get_field' );
	}

	public function plugin_label(): string {
		return 'Advanced Custom Fields';
	}

	public function read( int $post_id, array $options = [] ): array {
		if ( ! self::is_available() ) { return array(); }

		$allowlist  = isset( $options['field_names'] ) && is_array( $options['field_names'] )
			? $options['field_names'] : array();
		$max_fields = isset( $options['max_fields'] ) ? (int) $options['max_fields'] : 50;

		$groups = acf_get_field_groups( array( 'post_id' => $post_id ) );
		if ( ! is_array( $groups ) || empty( $groups ) ) { return array(); }

		$texts = array();

		foreach ( $groups as $group ) {
			if ( count( $texts ) >= $max_fields ) { break; }
			$fields = acf_get_fields( $group );
			if ( ! is_array( $fields ) ) { continue; }
			foreach ( $fields as $field ) {
				if ( count( $texts ) >= $max_fields ) { break; }
				$this->collect_field( $field, $post_id, $allowlist, $texts );
			}
		}

		return $texts;
	}

	/**
	 * Recursively collect text values from a field and its sub-fields
	 * (repeater, flexible_content, group).
	 *
	 * @param array  $field
	 * @param int    $post_id
	 * @param array  $allowlist
	 * @param array  &$out
	 * @param string $prefix   Dot-notation key path for nested fields.
	 */
	private function collect_field( array $field, int $post_id, array $allowlist, array &$out, string $prefix = '' ): void {
		$key  = $prefix ? $prefix . '.' . $field['name'] : $field['name'];
		$type = $field['type'] ?? '';

		if ( ! empty( $allowlist ) && ! in_array( $field['name'], $allowlist, true ) && ! in_array( $key, $allowlist, true ) ) {
			// Even if this field is filtered out, its children might match.
			// Fall through to sub-field recursion below.
		} elseif ( in_array( $type, self::TEXT_TYPES, true ) ) {
			$val = get_field( $field['name'], $post_id );
			if ( $val !== null && $val !== false && $val !== '' ) {
				$text = wp_strip_all_tags( (string) $val );
				if ( $text !== '' ) { $out[] = $text; }
			}
		}

		// Recurse into composite field types.
		if ( in_array( $type, array( 'repeater', 'group' ), true ) ) {
			$sub_fields = $field['sub_fields'] ?? array();
			$rows       = get_field( $field['name'], $post_id );
			if ( is_array( $rows ) && $type === 'repeater' ) {
				foreach ( $rows as $row ) {
					foreach ( $sub_fields as $sf ) {
						$sv = $row[ $sf['name'] ] ?? null;
						if ( $sv !== null && in_array( $sf['type'], self::TEXT_TYPES, true ) ) {
							$text = wp_strip_all_tags( (string) $sv );
							if ( $text !== '' ) { $out[] = $text; }
						}
					}
				}
			} elseif ( is_array( $rows ) && $type === 'group' ) {
				foreach ( $sub_fields as $sf ) {
					if ( in_array( $sf['type'], self::TEXT_TYPES, true ) ) {
						$sv   = $rows[ $sf['name'] ] ?? null;
						$text = $sv !== null ? wp_strip_all_tags( (string) $sv ) : '';
						if ( $text !== '' ) { $out[] = $text; }
					}
				}
			}
		} elseif ( $type === 'flexible_content' ) {
			$layouts = get_field( $field['name'], $post_id );
			if ( is_array( $layouts ) ) {
				foreach ( $layouts as $layout ) {
					foreach ( $field['layouts'] ?? array() as $l ) {
						if ( ( $l['name'] ?? '' ) !== ( $layout['acf_fc_layout'] ?? '' ) ) { continue; }
						foreach ( $l['sub_fields'] ?? array() as $sf ) {
							if ( in_array( $sf['type'], self::TEXT_TYPES, true ) ) {
								$sv   = $layout[ $sf['name'] ] ?? null;
								$text = $sv !== null ? wp_strip_all_tags( (string) $sv ) : '';
								if ( $text !== '' ) { $out[] = $text; }
							}
						}
					}
				}
			}
		}
	}
}
