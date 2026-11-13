<?php
/**
 * The site's AtlasVoice Cloud account, as the service reports it.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use TTA\TTA_AtlasVoice_Service;

defined( 'ABSPATH' ) || exit;

/**
 * Reads the project's plan, engines, allowance, limits and licence state
 * from AtlasVoice Cloud, and keeps the answer for a few minutes.
 *
 * The service is the only one that decides the plan (TTS-378): this class
 * shows its answer and never works a plan out by itself. Everything in the
 * answer is cleaned before it is kept, because a response is data from
 * outside the site like any other.
 *
 * The admin screen (through REST), `wp atlasvoice account` and an MCP server
 * all read the account here.
 */
class Account {

	/**
	 * Transient that holds the cleaned answer.
	 */
	const CACHE = 'atlasvoice_cloud_account';

	/**
	 * How long an answer is kept, in seconds. The account changes rarely;
	 * a licence change clears it at once (see forget_on_change()).
	 */
	const CACHE_SECONDS = 300;

	/**
	 * How long a failure is kept, so a screen that is reloaded does not ask
	 * a service that just failed again and again.
	 */
	const FAILURE_SECONDS = 60;

	/**
	 * Hosts a link from the service may point to.
	 */
	const LINK_HOSTS = array( 'atlasvoice.cloud', 'atlasaidev.com' );

	/**
	 * Parts of the stored connection that change what the account says.
	 */
	const WATCHED = array( 'api_key', 'plan', 'license_attached', 'pending_approval' );

	/**
	 * The account.
	 *
	 * @param bool $refresh Ask the service now instead of using the kept answer.
	 *
	 * @return array {
	 *     connected: bool, source: 'service'|'stored'|'none', fetched_at: int,
	 *     error: string, request_id: string, project, plan, engines, usage,
	 *     limits, license, links
	 * }
	 */
	public static function get( $refresh = false ) {
		if ( ! TTA_AtlasVoice_Service::is_connected() ) {
			return self::shape( array( 'source' => 'none' ) );
		}

		if ( ! $refresh ) {
			$kept = get_transient( self::CACHE );
			if ( is_array( $kept ) ) {
				return self::shape( $kept );
			}
		}

		$result = Cloud::client()->account();

		if ( $result->ok() && is_array( $result->data ) ) {
			$account = self::clean( $result->data );

			$account['connected']  = true;
			$account['source']     = 'service';
			$account['fetched_at'] = time();
			$account['request_id'] = sanitize_text_field( $result->request_id );

			set_transient( self::CACHE, $account, self::CACHE_SECONDS );

			return self::shape( $account );
		}

		// The service could not answer (it is down, the key was refused, or it
		// is older than this route): show what the plugin last stored, and say
		// that this is what it is.
		$account = self::from_stored_state();

		$account['error']      = sanitize_key( $result->code() );
		$account['request_id'] = sanitize_text_field( $result->request_id );

		set_transient( self::CACHE, $account, self::FAILURE_SECONDS );

		return self::shape( $account );
	}

	/**
	 * Forgets the kept answer, so the next read asks the service.
	 */
	public static function forget() {
		delete_transient( self::CACHE );
	}

	/**
	 * Forgets the kept answer when the connection changed in a way that
	 * changes the account: another key, plan, licence or approval. Usage
	 * counters change after every audio file and must not clear it.
	 *
	 * Hooked on the update of the stored connection.
	 *
	 * @param mixed $old Stored connection before the change.
	 * @param mixed $new Stored connection after it.
	 */
	public static function forget_on_change( $old, $new ) {
		$old = is_array( $old ) ? $old : array();
		$new = is_array( $new ) ? $new : array();

		foreach ( self::WATCHED as $field ) {
			$before = isset( $old[ $field ] ) ? $old[ $field ] : null;
			$after  = isset( $new[ $field ] ) ? $new[ $field ] : null;

			if ( $before !== $after ) {
				self::forget();

				return;
			}
		}
	}

	/**
	 * Cleans the service's answer. Only known fields are kept, each in its
	 * own type; anything else in the answer is dropped.
	 *
	 * @param array $data The decoded answer.
	 *
	 * @return array
	 */
	private static function clean( array $data ) {
		$project = self::part( $data, 'project' );
		$plan    = self::part( $data, 'plan' );
		$limits  = self::part( $data, 'limits' );
		$license = self::part( $data, 'license' );
		$ended   = self::part( $license, 'ended' );
		$links   = self::part( $data, 'links' );

		$engines = array();
		if ( isset( $data['engines'] ) && is_array( $data['engines'] ) ) {
			foreach ( array_slice( $data['engines'], 0, 20 ) as $engine ) {
				if ( is_string( $engine ) && '' !== sanitize_key( $engine ) ) {
					$engines[] = sanitize_key( $engine );
				}
			}
		}

		return array(
			'project' => array(
				'id'       => isset( $project['id'] ) ? absint( $project['id'] ) : 0,
				'platform' => self::word( $project, 'platform' ),
				'domain'   => self::text( $project, 'domain' ),
				'status'   => self::word( $project, 'status' ),
				'approval' => self::word( $project, 'approval' ),
			),
			'plan'    => array(
				'slug' => self::word( $plan, 'slug' ),
				'name' => self::text( $plan, 'name' ),
			),
			'engines' => array_values( array_unique( $engines ) ),
			'usage'   => self::usage( self::part( $data, 'usage' ) ),
			'limits'  => array(
				'requests_per_minute'   => self::number( $limits, 'requests_per_minute' ),
				'max_chars_per_request' => self::number( $limits, 'max_chars_per_request' ),
				'daily_chars'           => self::number( $limits, 'daily_chars' ),
			),
			'license' => array(
				'attached'   => ! empty( $license['attached'] ),
				'expires_at' => self::text( $license, 'expires_at' ),
				'checked_at' => self::text( $license, 'checked_at' ),
				'ended'      => $ended ? array(
					'reason' => self::word( $ended, 'reason' ),
					'at'     => self::text( $ended, 'at' ),
				) : null,
			),
			'links'   => array(
				'dashboard' => self::link( $links, 'dashboard' ),
				'upgrade'   => self::link( $links, 'upgrade' ),
			),
		);
	}

	/**
	 * What the plugin last stored about the connection, in the same shape.
	 *
	 * @return array
	 */
	private static function from_stored_state() {
		$state = TTA_AtlasVoice_Service::public_state();
		$plan  = isset( $state['plan'] ) ? sanitize_key( (string) $state['plan'] ) : '';

		return array(
			'connected'  => true,
			'source'     => 'stored',
			'fetched_at' => 0,
			'project'    => array(
				'approval' => ! empty( $state['pendingApproval'] ) ? 'pending' : '',
			),
			'plan'       => array(
				'slug' => $plan,
				'name' => '',
			),
			'usage'      => self::usage( isset( $state['usage'] ) && is_array( $state['usage'] ) ? $state['usage'] : array() ),
			'license'    => array(
				'attached' => TTA_AtlasVoice_Service::has_license_attached(),
			),
			'links'      => array(
				'dashboard' => esc_url_raw( (string) $state['dashboardUrl'] ),
			),
		);
	}

	/**
	 * Fills every field, so a caller never has to test whether one exists.
	 *
	 * @param array $account A cleaned or partial account.
	 *
	 * @return array
	 */
	private static function shape( array $account ) {
		$defaults = array(
			'connected'  => false,
			'source'     => 'none',
			'fetched_at' => 0,
			'error'      => '',
			'request_id' => '',
			'project'    => array(
				'id'       => 0,
				'platform' => '',
				'domain'   => '',
				'status'   => '',
				'approval' => '',
			),
			'plan'       => array(
				'slug' => '',
				'name' => '',
			),
			'engines'    => array(),
			'usage'      => self::usage( array() ),
			'limits'     => array(
				'requests_per_minute'   => null,
				'max_chars_per_request' => null,
				'daily_chars'           => null,
			),
			'license'    => array(
				'attached'   => false,
				'expires_at' => '',
				'checked_at' => '',
				'ended'      => null,
			),
			'links'      => array(
				'dashboard' => '',
				'upgrade'   => '',
			),
		);

		foreach ( $defaults as $name => $default ) {
			if ( ! array_key_exists( $name, $account ) ) {
				$account[ $name ] = $default;
			} elseif ( is_array( $default ) && $default && ! wp_is_numeric_array( $default ) ) {
				$account[ $name ] = array_merge( $default, is_array( $account[ $name ] ) ? $account[ $name ] : array() );
			}
		}

		return array_intersect_key( $account, $defaults );
	}

	/**
	 * The allowance, as whole numbers.
	 *
	 * @param array $usage The usage object of the service.
	 *
	 * @return array
	 */
	private static function usage( array $usage ) {
		return array(
			'chars_used'      => self::number( $usage, 'chars_used' ),
			'chars_limit'     => self::number( $usage, 'chars_limit' ),
			'chars_remaining' => self::number( $usage, 'chars_remaining' ),
			'resets_at'       => self::text( $usage, 'resets_at' ),
		);
	}

	/**
	 * One object of the answer, or an empty array.
	 *
	 * @param array  $data The answer, or a part of it.
	 * @param string $name Field name.
	 *
	 * @return array
	 */
	private static function part( array $data, $name ) {
		return isset( $data[ $name ] ) && is_array( $data[ $name ] ) ? $data[ $name ] : array();
	}

	/**
	 * A machine word such as "premium" or "approved".
	 *
	 * @param array  $data A part of the answer.
	 * @param string $name Field name.
	 *
	 * @return string
	 */
	private static function word( array $data, $name ) {
		return isset( $data[ $name ] ) && is_scalar( $data[ $name ] ) ? sanitize_key( (string) $data[ $name ] ) : '';
	}

	/**
	 * A short line of text, such as a plan name or a date.
	 *
	 * @param array  $data A part of the answer.
	 * @param string $name Field name.
	 *
	 * @return string
	 */
	private static function text( array $data, $name ) {
		if ( ! isset( $data[ $name ] ) || ! is_scalar( $data[ $name ] ) ) {
			return '';
		}

		return mb_substr( sanitize_text_field( (string) $data[ $name ] ), 0, 190 );
	}

	/**
	 * A whole number that is zero or more, or null when the service gave
	 * none (null means "no limit" for a limit).
	 *
	 * @param array  $data A part of the answer.
	 * @param string $name Field name.
	 *
	 * @return int|null
	 */
	private static function number( array $data, $name ) {
		return isset( $data[ $name ] ) && is_numeric( $data[ $name ] ) ? max( 0, (int) $data[ $name ] ) : null;
	}

	/**
	 * A link, kept only when it is an https address on one of our own
	 * domains. A link is printed in the admin, so one the service did not
	 * mean to send must not get there.
	 *
	 * @param array  $data The links of the answer.
	 * @param string $name Field name.
	 *
	 * @return string The address, or an empty string.
	 */
	private static function link( array $data, $name ) {
		if ( ! isset( $data[ $name ] ) || ! is_string( $data[ $name ] ) ) {
			return '';
		}

		$url  = esc_url_raw( $data[ $name ], array( 'https' ) );
		$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );

		foreach ( self::LINK_HOSTS as $allowed ) {
			if ( $host === $allowed || substr( $host, -strlen( '.' . $allowed ) ) === '.' . $allowed ) {
				return $url;
			}
		}

		return '';
	}
}
