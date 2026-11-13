<?php
/**
 * `wp atlasvoice pronunciation`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Pronunciation\Rules;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the words AtlasVoice says differently.
 *
 * The same rules as Voice › Pronunciation in the admin: whole words only, for
 * every voice and language.
 */
class Pronunciation_Command {

	/**
	 * Lists the rules.
	 *
	 * ## OPTIONS
	 *
	 * [--format=<format>]
	 * : How to print the list.
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - json
	 *   - csv
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice pronunciation list
	 *     +-------------+-----------+------------------+
	 *     | actual_text | to_read   | apply_to_numbers |
	 *     +-------------+-----------+------------------+
	 *     | WP          | WordPress | no               |
	 *     +-------------+-----------+------------------+
	 *
	 * @subcommand list
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: format.
	 */
	public function list_( $args, $assoc_args ) {
		$format = isset( $assoc_args['format'] ) ? (string) $assoc_args['format'] : 'table';
		$rules  = Rules::all();

		if ( 'json' !== $format ) {
			foreach ( $rules as $index => $rule ) {
				$rules[ $index ]['apply_to_numbers'] = $rule['apply_to_numbers'] ? 'yes' : 'no';
			}
		}

		\WP_CLI\Utils\format_items( $format, $rules, array( 'actual_text', 'to_read', 'apply_to_numbers' ) );
	}

	/**
	 * Adds a rule, or changes the rule for a word that is already listed.
	 *
	 * ## OPTIONS
	 *
	 * <word>
	 * : The word or phrase as it is written on the site.
	 *
	 * <say>
	 * : How the voice should say it.
	 *
	 * [--numbers]
	 * : Also change the same pattern with other numbers (5k and 250k).
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice pronunciation add WP WordPress
	 *     Success: The voice now says "WordPress" for "WP".
	 *
	 *     $ wp atlasvoice pronunciation add 5k "5 thousand" --numbers
	 *
	 * @param array $args       Positional arguments: word, say.
	 * @param array $assoc_args Flags: numbers.
	 */
	public function add( $args, $assoc_args ) {
		list( $word, $say ) = array_pad( array_map( 'strval', $args ), 2, '' );

		$new = array(
			'actual_text'      => $word,
			'to_read'          => $say,
			'apply_to_numbers' => ! empty( $assoc_args['numbers'] ),
		);

		$rules    = Rules::all();
		$position = self::find( $rules, $word );
		if ( null === $position ) {
			$rules[] = $new;
		} else {
			$rules[ $position ] = $new;
		}

		$saved = Rules::save( $rules );
		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );
		}

		\WP_CLI::success( sprintf( 'The voice now says "%1$s" for "%2$s".', $say, trim( $word ) ) );
	}

	/**
	 * Removes the rule for a word.
	 *
	 * ## OPTIONS
	 *
	 * <word>
	 * : The word or phrase of the rule to remove.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice pronunciation remove WP
	 *     Success: Removed the rule for "WP".
	 *
	 * @param array $args       Positional arguments: word.
	 * @param array $assoc_args Flags (none).
	 */
	public function remove( $args, $assoc_args ) {
		$word     = isset( $args[0] ) ? (string) $args[0] : '';
		$rules    = Rules::all();
		$position = self::find( $rules, $word );

		if ( null === $position ) {
			\WP_CLI::error( sprintf( 'There is no rule for "%s".', $word ) );
		}

		unset( $rules[ $position ] );

		$saved = Rules::save( array_values( $rules ) );
		if ( is_wp_error( $saved ) ) {
			\WP_CLI::error( $saved->get_error_message() );
		}

		\WP_CLI::success( sprintf( 'Removed the rule for "%s".', $word ) );
	}

	/**
	 * Shows how a sentence will be read. Nothing is saved.
	 *
	 * ## OPTIONS
	 *
	 * <sentence>
	 * : The sentence to try.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice pronunciation test "Our WP site"
	 *     Our WordPress site
	 *
	 * @param array $args       Positional arguments: sentence.
	 * @param array $assoc_args Flags (none).
	 */
	public function test( $args, $assoc_args ) {
		\WP_CLI::line( Rules::apply( isset( $args[0] ) ? (string) $args[0] : '' ) );
	}

	/**
	 * Finds the rule for a word, ignoring case and outer spaces.
	 *
	 * @param array[] $rules Rules from Rules::all().
	 * @param string  $word  The word to look for.
	 *
	 * @return int|null Its position, or null.
	 */
	private static function find( array $rules, $word ) {
		$needle = self::fold( $word );

		foreach ( $rules as $position => $rule ) {
			if ( self::fold( $rule['actual_text'] ) === $needle ) {
				return $position;
			}
		}

		return null;
	}

	/**
	 * Lower-cases and trims a word for comparison.
	 *
	 * @param string $text A word.
	 *
	 * @return string
	 */
	private static function fold( $text ) {
		$text = trim( (string) $text );

		return function_exists( 'mb_strtolower' ) ? mb_strtolower( $text ) : strtolower( $text );
	}
}
