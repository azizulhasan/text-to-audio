<?php

namespace TTA\AtlasVoice\Readers;

/**
 * Contract every custom-field reader must satisfy (TTS-238 D13).
 *
 * A reader probes its plugin's presence, queries all text-like fields
 * attached to a post, and returns them as a flat list of labelled
 * strings so the extractor engine can append them to the picked
 * selector's content.
 */
interface ReaderInterface {

	/**
	 * Is the plugin this reader targets active on the current install?
	 * Called before `read()` so the ReaderRegistry can skip inactive
	 * readers without instantiation overhead.
	 *
	 * @return bool
	 */
	public static function is_available(): bool;

	/**
	 * Extract text-like custom-field values for a post.
	 *
	 * @param int   $post_id   WordPress post ID.
	 * @param array $options   Optional hints: 'field_names' (allowlist), 'max_fields'.
	 * @return array           Flat list of strings — one per text-like field.
	 *                         Empty array if no fields or plugin not active.
	 */
	public function read( int $post_id, array $options = [] ): array;

	/**
	 * Human-readable name of the plugin this reader targets. Used in
	 * debug output and the D14 verify-across-posts summary.
	 *
	 * @return string
	 */
	public function plugin_label(): string;
}
