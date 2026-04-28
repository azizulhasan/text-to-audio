<?php

namespace TTA\AtlasVoice\Readers;

/**
 * Registry + dispatcher for all D13 custom-field readers (TTS-238 D13).
 *
 * --- DORMANT BY DESIGN ----------------------------------------------
 *
 * As of 2026-04-28 (D13 finalisation) this registry is intentionally
 * NOT wired into the extractor. The step-rail (D9–D11, D15, D16) lets
 * admins pick any rendered custom-field value through the same DOM
 * picker they use for body content, and the project commits to
 * voicing what visitors actually see — reading aloud unrendered field
 * values would silently override editorial decisions made by the
 * theme. A separate "always voice every ACF field" pipeline competes
 * with that promise, so the readers ship loadable but unused.
 *
 * The classes remain available for developers who genuinely need an
 * out-of-DOM read (headless pipelines, server-side warmers). The
 * canonical opt-in path is the `atlasvoice_extra_field_text` filter
 * (declared in `helpers.php::tta_clean_content`); plug into it and
 * return `ReaderRegistry::read_all( $post_id )` to enable readers
 * site-wide. Full snippet + rationale in `docs/atlasvoice-readers.md`.
 *
 * Direct usage (when you only want readers in one specific code path):
 *
 *   $extra = ReaderRegistry::read_all( $post_id );
 *   // $extra = [ 'Field A text', 'Field B text', ... ]
 *
 * If you're considering wiring this into core extraction by default,
 * re-read v5 plan §13 D13 and §18 revision log entry (2026-04-28)
 * before doing so — the dormancy is a deliberate design choice, not
 * an oversight.
 *
 * --------------------------------------------------------------------
 *
 * Readers are registered in order of specificity — more opinionated
 * plugins (ACF, MetaBox) before generic ones (Pods, JetEngine, etc.).
 * The first reader whose `is_available()` returns true wins per plugin
 * category; multiple readers can contribute if multiple plugins coexist.
 */
class ReaderRegistry {

	/**
	 * Fully-qualified class names of every available reader, in
	 * priority order. Adding a new reader is a one-liner here.
	 *
	 * @var string[]
	 */
	private static $reader_classes = array(
		AcfReader::class,
		MetaBoxReader::class,
		PodsReader::class,
		JetEngineReader::class,
		ToolsetReader::class,
		CarbonFieldsReader::class,
	);

	/**
	 * Run every active reader and merge their results into a single
	 * flat list of text strings, de-duped and filtered for emptiness.
	 *
	 * @param int   $post_id
	 * @param array $options  Forwarded to each reader's `read()`.
	 * @return string[]
	 */
	public static function read_all( int $post_id, array $options = [] ): array {
		$texts = array();

		foreach ( self::$reader_classes as $class ) {
			if ( ! class_exists( $class ) ) { continue; }
			if ( ! $class::is_available() ) { continue; }

			try {
				$reader  = new $class();
				$results = $reader->read( $post_id, $options );
			} catch ( \Throwable $e ) {
				// Never let a broken reader bring down extraction.
				continue;
			}

			foreach ( $results as $text ) {
				$text = trim( (string) $text );
				if ( $text !== '' ) { $texts[] = $text; }
			}
		}

		// De-dupe while preserving order.
		return array_values( array_unique( $texts ) );
	}

	/**
	 * Return an array of [ 'label' => string, 'available' => bool ]
	 * describing every registered reader. Used by the D14 verify report
	 * and the admin "compatibility" tab.
	 *
	 * @return array[]
	 */
	public static function describe(): array {
		$out = array();
		foreach ( self::$reader_classes as $class ) {
			if ( ! class_exists( $class ) ) { continue; }
			$out[] = array(
				'class'     => $class,
				'label'     => ( new $class() )->plugin_label(),
				'available' => $class::is_available(),
			);
		}
		return $out;
	}
}
