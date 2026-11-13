<?php
/**
 * `wp atlasvoice account`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\Cloud\Account;

defined( 'ABSPATH' ) || exit;

/**
 * Shows this site's AtlasVoice Cloud account.
 */
class Account_Command {

	/**
	 * Shows the plan, engines, allowance and licence state of this site.
	 *
	 * ## OPTIONS
	 *
	 * [--refresh]
	 * : Ask AtlasVoice Cloud now instead of using the answer kept for a few minutes.
	 *
	 * [--format=<format>]
	 * : How to print it.
	 * ---
	 * default: list
	 * options:
	 *   - list
	 *   - json
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice account
	 *     $ wp atlasvoice account --refresh --format=json
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags: refresh, format.
	 */
	public function __invoke( $args, $assoc_args ) {
		$account = Account::get( ! empty( $assoc_args['refresh'] ) );

		if ( isset( $assoc_args['format'] ) && 'json' === $assoc_args['format'] ) {
			\WP_CLI::line( (string) wp_json_encode( $account ) );

			return;
		}

		if ( ! $account['connected'] ) {
			\WP_CLI::line( 'This site is not connected to AtlasVoice Cloud.' );

			return;
		}

		if ( 'stored' === $account['source'] ) {
			\WP_CLI::warning( sprintf( 'AtlasVoice Cloud did not answer (%s). Showing what this site last stored.', '' !== $account['error'] ? $account['error'] : 'no answer' ) );
		}

		$rows = array(
			array(
				'field' => 'plan',
				'value' => '' !== $account['plan']['name'] ? $account['plan']['name'] : $account['plan']['slug'],
			),
			array(
				'field' => 'approval',
				'value' => $account['project']['approval'],
			),
			array(
				'field' => 'engines',
				'value' => implode( ', ', $account['engines'] ),
			),
			array(
				'field' => 'characters used',
				'value' => self::number( $account['usage']['chars_used'] ),
			),
			array(
				'field' => 'characters left',
				'value' => self::number( $account['usage']['chars_remaining'] ),
			),
			array(
				'field' => 'allowance resets',
				'value' => $account['usage']['resets_at'],
			),
			array(
				'field' => 'licence attached',
				'value' => $account['license']['attached'] ? 'yes' : 'no',
			),
			array(
				'field' => 'licence ended',
				'value' => $account['license']['ended'] ? $account['license']['ended']['reason'] : '',
			),
			array(
				'field' => 'request id',
				'value' => $account['request_id'],
			),
		);

		foreach ( $rows as $row ) {
			\WP_CLI::line( $row['field'] . ': ' . $row['value'] );
		}
	}

	/**
	 * A number for the table; an absent one is "no limit".
	 *
	 * @param int|null $value The number.
	 *
	 * @return string
	 */
	private static function number( $value ) {
		return null === $value ? '-' : (string) $value;
	}
}
