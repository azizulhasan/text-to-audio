<?php
/**
 * Pronunciation rules: words the voice should say differently.
 *
 * @package TTA
 */

namespace TTA\Pronunciation;

use TTA\TTA_Cache;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * The one place that reads, checks and stores the pronunciation rules.
 *
 * The admin screen, the REST routes and `wp atlasvoice pronunciation` all
 * call this class, so they can never disagree (TTS-376).
 *
 * Nothing stored changes: the option is still `tts_text_aliases`, a list of
 * objects with `actual_text`, `to_read` and, only when ticked,
 * `apply_to_numbers`. The matching itself stays in
 * TTA_Helper::replace_alias(), the plugin's single matcher.
 */
class Rules {

	const OPTION = 'tts_text_aliases';

	/**
	 * The saved rules, each as an array with the three keys always present.
	 *
	 * @return array[] List of { actual_text, to_read, apply_to_numbers }.
	 */
	public static function all() {
		$rules = array();

		foreach ( (array) get_option( self::OPTION, array() ) as $rule ) {
			$rule = (array) $rule;
			if ( ! isset( $rule['actual_text'] ) || '' === (string) $rule['actual_text'] ) {
				continue;
			}

			$rules[] = array(
				'actual_text'      => (string) $rule['actual_text'],
				'to_read'          => isset( $rule['to_read'] ) ? (string) $rule['to_read'] : '',
				'apply_to_numbers' => ! empty( $rule['apply_to_numbers'] ),
			);
		}

		return $rules;
	}

	/**
	 * How many saved rules the plugin applies. 0 means no limit.
	 *
	 * The free plugin applies one saved rule (unchanged). An add-on that
	 * applies more says so through the filter; this class never asks whether
	 * an add-on is installed.
	 *
	 * @return int
	 */
	public static function max_rules() {
		/**
		 * Filters how many saved pronunciation rules are applied and can be added.
		 *
		 * @param int $max 1 by default; 0 for no limit.
		 */
		return max( 0, (int) apply_filters( 'atlasvoice_pronunciation_max_rules', 1 ) );
	}

	/**
	 * Cleans rules that came from outside (a request, the command line).
	 *
	 * The same cleaning the classic `text_alias` route has always done: plain
	 * text only, trimmed, a rule without a word is dropped, and
	 * `apply_to_numbers` is kept only when it is on, so old rules stay
	 * byte-identical when they are saved again.
	 *
	 * @param mixed $raw A list of arrays or objects.
	 *
	 * @return object[] Rules in the stored shape.
	 */
	public static function sanitize( $raw ) {
		$rules = array();

		foreach ( (array) $raw as $rule ) {
			if ( ! is_array( $rule ) && ! is_object( $rule ) ) {
				continue;
			}

			$rule        = (array) $rule;
			$actual_text = isset( $rule['actual_text'] ) && is_scalar( $rule['actual_text'] ) ? trim( sanitize_text_field( (string) $rule['actual_text'] ) ) : '';
			$to_read     = isset( $rule['to_read'] ) && is_scalar( $rule['to_read'] ) ? trim( sanitize_text_field( (string) $rule['to_read'] ) ) : '';

			if ( '' === $actual_text ) {
				continue;
			}

			$row = array(
				'actual_text' => $actual_text,
				'to_read'     => $to_read,
			);
			if ( ! empty( $rule['apply_to_numbers'] ) ) {
				$row['apply_to_numbers'] = true;
			}

			$rules[] = (object) $row;
		}//end foreach

		return $rules;
	}

	/**
	 * Stores rules as they are given, after cleaning. Used by the classic
	 * route, which has never checked the limit on the server.
	 *
	 * @param mixed $raw A list of arrays or objects.
	 *
	 * @return array[] The saved rules, as all() returns them.
	 */
	public static function store( $raw ) {
		update_option( self::OPTION, self::sanitize( $raw ), false );
		TTA_Cache::delete( 'all_settings' );

		return self::all();
	}

	/**
	 * Replaces the saved rules, for the new screen, the route and the CLI.
	 *
	 * It refuses a list that grows past the limit. A list that is already
	 * longer (rules saved while an add-on was active) can still be saved and
	 * shortened: nothing the owner saved is ever removed for them.
	 *
	 * @param mixed $raw A list of arrays or objects.
	 *
	 * @return array[]|\WP_Error The saved rules, or why they were refused.
	 */
	public static function save( $raw ) {
		if ( ! is_array( $raw ) ) {
			return new \WP_Error(
				'atlasvoice_invalid_rules',
				__( 'The pronunciation rules must be a list.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$rules = self::sanitize( $raw );
		$seen  = array();
		foreach ( $rules as $rule ) {
			$key = function_exists( 'mb_strtolower' ) ? mb_strtolower( $rule->actual_text ) : strtolower( $rule->actual_text );
			if ( isset( $seen[ $key ] ) ) {
				return new \WP_Error(
					'atlasvoice_duplicate_rule',
					/* translators: %s: a word or phrase. */
					sprintf( __( '“%s” is in the list twice.', 'text-to-audio' ), $rule->actual_text ),
					array( 'status' => 400 )
				);
			}
			$seen[ $key ] = true;
		}

		$max = self::max_rules();
		if ( $max > 0 && count( $rules ) > max( $max, count( self::all() ) ) ) {
			return new \WP_Error(
				'atlasvoice_rule_limit',
				sprintf(
					/* translators: %d: number of rules. */
					_n( 'This site keeps %d pronunciation rule.', 'This site keeps %d pronunciation rules.', $max, 'text-to-audio' ),
					$max
				),
				array( 'status' => 400 )
			);
		}

		return self::store( $rules );
	}

	/**
	 * The rules the plugin applies to a text: the saved ones up to the
	 * limit, then whatever code added through the `tts_text_aliases` filter.
	 *
	 * @param string     $text  The text the rules are for (passed to the filter).
	 * @param array|null $rules Rules to use instead of the saved ones, for a preview.
	 *
	 * @return array[]
	 */
	public static function active( $text = '', $rules = null ) {
		$saved = null === $rules ? self::all() : array_map(
			static function ( $rule ) {
				return (array) $rule;
			},
			self::sanitize( $rules )
		);

		$max = self::max_rules();
		if ( $max > 0 ) {
			$saved = array_slice( $saved, 0, $max );
		}

		/** This filter is documented in includes/TTA_Hooks.php */
		return (array) apply_filters( 'tts_text_aliases', $saved, $text );
	}

	/**
	 * How a text will be read: the active rules applied with the plugin's one matcher.
	 *
	 * @param string     $text  A sentence.
	 * @param array|null $rules Rules to try instead of the saved ones.
	 *
	 * @return string
	 */
	public static function apply( $text, $rules = null ) {
		$text   = (string) $text;
		$active = self::active( $text, $rules );

		foreach ( $active as $rule ) {
			$rule = (array) $rule;
			if ( isset( $rule['actual_text'], $rule['to_read'] ) ) {
				$text = TTA_Helper::replace_alias( $text, $rule['actual_text'], $rule['to_read'], ! empty( $rule['apply_to_numbers'] ) );
			}
		}

		/** This filter is documented in includes/TTA_Hooks.php */
		return (string) apply_filters( 'tts_pronunciation_text', $text, $active );
	}
}
