<?php

namespace TTA\AtlasVoice\Readers;

/**
 * Registry + dispatcher for all D13 custom-field readers (TTS-238 D13).
 *
 * Usage (called by the extractor engine after the main selector text
 * has been collected):
 *
 *   $extra = ReaderRegistry::read_all( $post_id );
 *   // $extra = [ 'Field A text', 'Field B text', ... ]
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
