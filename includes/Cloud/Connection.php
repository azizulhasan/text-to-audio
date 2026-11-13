<?php
/**
 * This site's connection to AtlasVoice Cloud: read it, connect, disconnect.
 *
 * @package TTA
 */

namespace TTA\Cloud;

use TTA\TTA_AtlasVoice_Service;
use TTA\TTA_Lib_AtlasAiDev;

defined( 'ABSPATH' ) || exit;

/**
 * The three things an owner can do with the connection, in one place.
 *
 * Connecting sends the site's address, its name and the owner's email to
 * AtlasVoice Cloud and stores the key it returns. That only happens after
 * the owner agreed in so many words: nothing is sent without `consent`
 * (WordPress.org guideline 7). The key never leaves the server; only its
 * first characters are shown.
 *
 * The admin screen (REST), `wp atlasvoice cloud` and an MCP server all act
 * here. The stored connection and the classic screen's route are unchanged:
 * both screens read and write the same option.
 */
class Connection {

	/**
	 * How the site is connected.
	 *
	 * @param bool $refresh Ask the service for the current state first (a key revoked in
	 *                      the dashboard then shows as disconnected at once).
	 *
	 * @return array {
	 *     connected: bool, pending_approval: bool, key_revoked: bool,
	 *     license_not_on_site: bool, license_seats_full: bool,
	 *     email: string, key_prefix: string, plan: string,
	 *     diagnostics: array{offer:bool, items:string[]},
	 *     links: array{terms:string, privacy:string, dashboard:string}
	 * }
	 */
	public static function state( $refresh = false ) {
		if ( $refresh && TTA_AtlasVoice_Service::is_connected() ) {
			TTA_AtlasVoice_Service::refresh_usage( true );
		}

		$state       = TTA_AtlasVoice_Service::public_state();
		$diagnostics = isset( $state['diagnostics'] ) && is_array( $state['diagnostics'] ) ? $state['diagnostics'] : array();
		$items       = array();

		foreach ( isset( $diagnostics['items'] ) ? (array) $diagnostics['items'] : array() as $item ) {
			if ( is_string( $item ) && '' !== $item ) {
				$items[] = sanitize_text_field( $item );
			}
		}

		return array(
			'connected'           => ! empty( $state['connected'] ),
			'pending_approval'    => ! empty( $state['pendingApproval'] ),
			'key_revoked'         => ! empty( $state['keyRevoked'] ),
			'license_not_on_site' => ! empty( $state['licenseNotOnSite'] ),
			'license_seats_full'  => ! empty( $state['licenseSeatsFull'] ),
			'email'               => sanitize_email( (string) $state['email'] ),
			'key_prefix'          => sanitize_text_field( (string) $state['keyPrefix'] ),
			'plan'                => sanitize_key( (string) $state['plan'] ),
			'diagnostics'         => array(
				'offer' => ! empty( $diagnostics['offer'] ),
				'items' => $items,
			),
			'links'               => array(
				'terms'     => esc_url_raw( (string) $state['termsUrl'] ),
				'privacy'   => esc_url_raw( (string) $state['privacyUrl'] ),
				'dashboard' => esc_url_raw( (string) $state['dashboardUrl'] ),
			),
		);
	}

	/**
	 * Connects the site, or moves it to another email.
	 *
	 * @param string $email             Where AtlasVoice may contact the owner about the service.
	 * @param bool   $consent           The owner agreed that post text is sent to make audio.
	 * @param bool   $takeover          Move a site that is registered to another email to this
	 *                                  one, by proving control of the site.
	 * @param bool   $share_diagnostics The owner also chose to share diagnostic data.
	 *
	 * @return array|\WP_Error The new state, or why it failed. The error data holds `status`
	 *                         and, for a site owned by another email, `owner_hint` and `takeover`.
	 */
	public static function connect( $email, $consent, $takeover = false, $share_diagnostics = false ) {
		if ( true !== $consent ) {
			return new \WP_Error(
				'consent_required',
				__( 'Tick the box to agree before connecting.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$result = $takeover
			? TTA_AtlasVoice_Service::takeover( (string) $email )
			: TTA_AtlasVoice_Service::connect( (string) $email );

		if ( is_wp_error( $result ) ) {
			return self::as_rest_error( $result );
		}

		// Optional, unticked by default: the same choice as the tracking
		// notice's "Allow", offered only while that notice would still ask.
		if ( $share_diagnostics && class_exists( TTA_Lib_AtlasAiDev::class ) && TTA_Lib_AtlasAiDev::instance()->can_offer_tracking() ) {
			TTA_Lib_AtlasAiDev::instance()->trackerOptIn();
		}

		return self::state();
	}

	/**
	 * Disconnects the site. The key is forgotten; audio already made stays
	 * and keeps playing.
	 *
	 * @return array The new state.
	 */
	public static function disconnect() {
		TTA_AtlasVoice_Service::disconnect();

		return self::state();
	}

	/**
	 * Gives a failure an HTTP status a client can act on, and keeps only the
	 * data a screen needs.
	 *
	 * @param \WP_Error $error The service class's error.
	 *
	 * @return \WP_Error
	 */
	private static function as_rest_error( \WP_Error $error ) {
		$code = sanitize_key( (string) $error->get_error_code() );
		$data = (array) $error->get_error_data();
		$from = isset( $data['status'] ) ? (int) $data['status'] : 0;

		if ( 'invalid_email' === $code ) {
			$status = 400;
		} elseif ( 'project_exists' === $code ) {
			$status = 409;
		} elseif ( $from >= 400 && $from < 500 ) {
			// The service refused: pass its verdict on.
			$status = $from;
		} else {
			// The service is down or could not be reached.
			$status = 503;
		}

		$clean = array( 'status' => $status );
		if ( isset( $data['owner_hint'] ) ) {
			$clean['owner_hint'] = sanitize_text_field( (string) $data['owner_hint'] );
			$clean['takeover']   = ! empty( $data['takeover'] );
		}

		return new \WP_Error( '' !== $code ? $code : 'service_unreachable', $error->get_error_message(), $clean );
	}
}
