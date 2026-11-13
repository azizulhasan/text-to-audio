<?php
/**
 * AtlasVoice SDK: stops calling a service that is down or asked for a pause.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk;

use AtlasVoice\Sdk\Contracts\State_Store;

/**
 * Protects the host and the service from each other.
 *
 * Without it, a service that is down makes every page that needs it wait
 * for a timeout, and a million hosts retrying at once keep it down. Two
 * rules:
 *  - back-off: when the service says "wait N seconds" (Retry-After on a 429
 *    or a 503), no call is sent before that time;
 *  - breaker: after several calls in a row found the service down, calls
 *    are paused for a short time, then one call is let through to test it.
 *
 * Only "the service is down" counts: an answer such as "quota exceeded" or
 * "invalid key" is the service working, and never pauses anything.
 */
final class Circuit_Breaker {

	/**
	 * Calls in a row that must fail before calls are paused.
	 */
	const FAILURES_TO_OPEN = 5;

	/**
	 * How long calls are paused after that, in seconds.
	 */
	const OPEN_SECONDS = 60;

	/**
	 * Failures older than this are forgotten, in seconds.
	 */
	const MEMORY_SECONDS = 600;

	/**
	 * The longest pause the service can ask for, in seconds. A wrong or
	 * hostile Retry-After must not switch a site off for a day.
	 */
	const MAX_WAIT = 900;

	/**
	 * Where the state is kept.
	 *
	 * @var State_Store
	 */
	private $store;

	/**
	 * Name of the state, one per service address.
	 *
	 * @var string
	 */
	private $name;

	/**
	 * Returns the current time; replaced in tests.
	 *
	 * @var callable
	 */
	private $clock;

	/**
	 * Builds a breaker for one service address.
	 *
	 * @param State_Store   $store Where the state is kept.
	 * @param string        $name  Name of the state.
	 * @param callable|null $clock Returns the time in seconds; time() when null.
	 */
	public function __construct( State_Store $store, $name, $clock = null ) {
		$this->store = $store;
		$this->name  = (string) $name;
		$this->clock = is_callable( $clock ) ? $clock : 'time';
	}

	/**
	 * How long calls are still paused.
	 *
	 * @return int Seconds; 0 when a call may be sent.
	 */
	public function seconds_to_wait() {
		$state = $this->state();

		return max( 0, $state['until'] - $this->now() );
	}

	/**
	 * Learns from the outcome of a call.
	 *
	 * @param Result $result The outcome.
	 */
	public function record( Result $result ) {
		$state = $this->state();
		$now   = $this->now();

		$asked = self::asked_to_wait( $result );
		$down  = ! $result->reached() || in_array( $result->status, array( 502, 503, 504 ), true );

		if ( ! $down && 0 === $asked ) {
			// The service answered: forget the failures, if there were any. The
			// usual case stores nothing, so a healthy site pays no write.
			if ( $state['failures'] > 0 || $state['until'] > 0 ) {
				$this->store->delete( $this->name );
			}

			return;
		}

		if ( $down ) {
			++$state['failures'];
			if ( $state['failures'] >= self::FAILURES_TO_OPEN ) {
				$state['until'] = max( $state['until'], $now + self::OPEN_SECONDS );
			}
		}

		if ( $asked > 0 ) {
			$state['until'] = max( $state['until'], $now + $asked );
		}

		$this->store->set( $this->name, $state, self::MEMORY_SECONDS + self::MAX_WAIT );
	}

	/**
	 * The pause the service asked for, if it asked for one.
	 *
	 * @param Result $result The outcome.
	 *
	 * @return int Seconds, at most MAX_WAIT; 0 when it did not ask.
	 */
	private static function asked_to_wait( Result $result ) {
		if ( 429 !== $result->status && 503 !== $result->status ) {
			return 0;
		}

		$value = $result->header( 'retry-after' );
		if ( ! is_string( $value ) || ! preg_match( '/^\d{1,6}$/', $value ) ) {
			return 0;
		}

		return min( self::MAX_WAIT, (int) $value );
	}

	/**
	 * The stored state, in a known shape whatever was stored.
	 *
	 * @return array { failures: int, until: int }
	 */
	private function state() {
		$stored = $this->store->get( $this->name );

		return array(
			'failures' => is_array( $stored ) && isset( $stored['failures'] ) ? max( 0, (int) $stored['failures'] ) : 0,
			'until'    => is_array( $stored ) && isset( $stored['until'] ) ? max( 0, (int) $stored['until'] ) : 0,
		);
	}

	/**
	 * The current time.
	 *
	 * @return int
	 */
	private function now() {
		return (int) call_user_func( $this->clock );
	}
}
