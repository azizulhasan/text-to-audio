<?php
/**
 * The AtlasVoice Pro plans and the links that lead to them.
 *
 * @package TTA
 */

namespace TTA\Account;

use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * One place for what the Plans tab shows: the Pro plans with their prices,
 * and the links to buy, compare, hear a demo and read the refund policy.
 *
 * The prices mirror the Freemius plan (plugin 13388, plan 22449): yearly and
 * lifetime, for 1, 5 and 10 sites; no monthly plan and no trial. Freemius is
 * where a price is set; a price that changes there is changed here in the
 * same release. The admin screen, `wp atlasvoice plans` and the REST route
 * all read this class, so they can never disagree.
 *
 * Only links and text: the free plugin sells nothing and unlocks nothing
 * (WordPress.org guideline 5). Buying happens on Freemius' checkout page.
 */
class Plans {

	/**
	 * Where a plan is bought. The number of sites and a slash are added.
	 */
	const CHECKOUT_BASE = 'https://checkout.freemius.com/plugin/13388/plan/22449/licenses/';

	const REFUND_URL = 'https://atlasaidev.com/refund-policy/';

	/**
	 * Days of the money-back guarantee.
	 */
	const REFUND_DAYS = 14;

	/**
	 * Hosts a filtered link may point to. A link is printed in the admin and
	 * opened by the owner, so a filter cannot send it anywhere else.
	 */
	const LINK_HOSTS = array( 'atlasaidev.com', 'checkout.freemius.com' );

	/**
	 * The plans, the links and the guarantee.
	 *
	 * @return array {
	 *     currency: string, refund_days: int,
	 *     tiers: array<int, array{id:string, sites:int, yearly:int, lifetime:int, popular:bool, checkout:array{yearly:string, lifetime:string}}>,
	 *     links: array{pricing:string, demo:string, refund:string}
	 * }
	 */
	public static function all() {
		$tiers = array();

		foreach ( self::prices() as $sites => $price ) {
			$tiers[] = array(
				'id'       => (string) $sites,
				'sites'    => (int) $sites,
				'yearly'   => (int) $price[0],
				'lifetime' => (int) $price[1],
				'popular'  => 5 === $sites,
				'checkout' => array(
					'yearly'   => self::CHECKOUT_BASE . $sites . '/',
					'lifetime' => self::CHECKOUT_BASE . $sites . '/?billing_cycle=lifetime',
				),
			);
		}

		$plans = array(
			'currency'    => 'USD',
			'refund_days' => self::REFUND_DAYS,
			'tiers'       => $tiers,
			'links'       => array(
				'pricing' => TTA_Helper::get_pro_url( 'admin', 'plans_tab', 'pricing' ),
				'demo'    => TTA_Helper::get_pro_url( 'admin', 'plans_tab', 'demo' ),
				'refund'  => self::REFUND_URL,
			),
		);

		/**
		 * Filters the plans shown on the Plans tab (for a dated offer, for example).
		 *
		 * @param array $plans See Plans::all().
		 */
		$filtered = apply_filters( 'atlasvoice_plans', $plans );

		return self::clean( is_array( $filtered ) ? $filtered : $plans, $plans );
	}

	/**
	 * Sites => yearly price, lifetime price, in US dollars.
	 *
	 * @return array<int, int[]>
	 */
	private static function prices() {
		return array(
			1  => array( 59, 199 ),
			5  => array( 149, 249 ),
			10 => array( 199, 299 ),
		);
	}

	/**
	 * Keeps the shape and the safety of the data after a filter touched it.
	 *
	 * @param array $plans    The filtered data.
	 * @param array $original The data before the filter.
	 *
	 * @return array
	 */
	private static function clean( array $plans, array $original ) {
		$tiers = array();

		foreach ( isset( $plans['tiers'] ) && is_array( $plans['tiers'] ) ? $plans['tiers'] : array() as $tier ) {
			if ( ! is_array( $tier ) || empty( $tier['sites'] ) || ! isset( $tier['yearly'], $tier['lifetime'] ) ) {
				continue;
			}

			$checkout = isset( $tier['checkout'] ) && is_array( $tier['checkout'] ) ? $tier['checkout'] : array();

			$tiers[] = array(
				'id'       => sanitize_key( isset( $tier['id'] ) ? (string) $tier['id'] : (string) $tier['sites'] ),
				'sites'    => absint( $tier['sites'] ),
				'yearly'   => absint( $tier['yearly'] ),
				'lifetime' => absint( $tier['lifetime'] ),
				'popular'  => ! empty( $tier['popular'] ),
				'checkout' => array(
					'yearly'   => self::link( isset( $checkout['yearly'] ) ? $checkout['yearly'] : '' ),
					'lifetime' => self::link( isset( $checkout['lifetime'] ) ? $checkout['lifetime'] : '' ),
				),
			);
		}

		$links = isset( $plans['links'] ) && is_array( $plans['links'] ) ? $plans['links'] : array();

		return array(
			'currency'    => 'USD',
			'refund_days' => isset( $plans['refund_days'] ) ? absint( $plans['refund_days'] ) : $original['refund_days'],
			'tiers'       => $tiers,
			'links'       => array(
				'pricing' => self::link( isset( $links['pricing'] ) ? $links['pricing'] : '' ),
				'demo'    => self::link( isset( $links['demo'] ) ? $links['demo'] : '' ),
				'refund'  => self::link( isset( $links['refund'] ) ? $links['refund'] : '' ),
			),
		);
	}

	/**
	 * A link, kept only when it is https and on one of our own hosts.
	 *
	 * @param mixed $url The address.
	 *
	 * @return string The address, or an empty string.
	 */
	private static function link( $url ) {
		if ( ! is_string( $url ) ) {
			return '';
		}

		$url  = esc_url_raw( $url, array( 'https' ) );
		$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );

		foreach ( self::LINK_HOSTS as $allowed ) {
			if ( $host === $allowed || substr( $host, -strlen( '.' . $allowed ) ) === '.' . $allowed ) {
				return $url;
			}
		}

		return '';
	}
}
