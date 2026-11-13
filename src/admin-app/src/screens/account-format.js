/**
 * Small helpers that turn the account's numbers and dates into words.
 * Kept apart from the screen so each rule can be tested on its own.
 */
import { __, sprintf } from '@wordpress/i18n';

/** From this share of the allowance on, the screen warns. */
export const WARN_AT = 80;

/**
 * How much of the allowance is used.
 *
 * @param {Object} usage `usage` of the account.
 * @return {number|null} 0 to 100, or null when the plan has no limit or the numbers are missing.
 */
export function usedPercent( usage ) {
	const used = usage?.chars_used;
	const limit = usage?.chars_limit;

	if ( typeof used !== 'number' || typeof limit !== 'number' || limit <= 0 ) {
		return null;
	}

	return Math.min( 100, Math.max( 0, Math.round( ( used / limit ) * 100 ) ) );
}

/**
 * The tone of the meter and its chip.
 *
 * @param {number|null} percent Result of usedPercent().
 * @return {string} ok | warn | err.
 */
export function usageTone( percent ) {
	if ( percent === null || percent < WARN_AT ) {
		return 'ok';
	}

	return percent >= 100 ? 'err' : 'warn';
}

/**
 * A whole number with the reader's digit grouping; a dash when unknown.
 *
 * @param {number|null} value The number.
 * @return {string} e.g. "98,800".
 */
export function formatNumber( value ) {
	return typeof value === 'number' ? value.toLocaleString() : '–';
}

/**
 * A day and month in the reader's language, from the service's ISO date.
 *
 * @param {string} iso e.g. "2026-12-01T00:00:00Z".
 * @return {string} e.g. "1 December", or an empty string when it is not a date.
 */
export function formatDay( iso ) {
	const date = iso ? new Date( iso ) : null;

	if ( ! date || Number.isNaN( date.getTime() ) ) {
		return '';
	}

	return date.toLocaleDateString( undefined, {
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC',
	} );
}

/**
 * The name of a voice engine in words a site owner knows.
 *
 * @param {string} engine The service's engine id.
 * @return {string} A readable name; an unknown id is shown as it is.
 */
export function engineName( engine ) {
	const names = {
		gtts: __( 'Natural voice', 'text-to-audio' ),
		cloud: __( 'Studio voices', 'text-to-audio' ),
	};

	return Object.prototype.hasOwnProperty.call( names, engine )
		? names[ engine ]
		: String( engine );
}

/**
 * Why a licence stopped giving Premium, in a sentence.
 *
 * @param {string} reason The service's reason word.
 * @return {string} The sentence.
 */
export function licenceEndedText( reason ) {
	switch ( reason ) {
		case 'expired':
			return __(
				'Your Pro licence has expired, so this site is on the free allowance.',
				'text-to-audio'
			);
		case 'cancelled':
			return __(
				'Your Pro licence was cancelled, so this site is on the free allowance.',
				'text-to-audio'
			);
		case 'not_active_on_site':
			return __(
				'Your Pro licence is not activated on this site, so this site is on the free allowance.',
				'text-to-audio'
			);
		case 'no_free_site':
			return __(
				'Every site of your Pro licence is in use, so this site is on the free allowance.',
				'text-to-audio'
			);
		default:
			return __(
				'Your Pro licence no longer covers this site, so it is on the free allowance.',
				'text-to-audio'
			);
	}
}

/**
 * The line under the meter.
 *
 * @param {number|null} percent Result of usedPercent().
 * @param {string}      resets  Result of formatDay() for the reset date.
 * @return {string} The sentence, or an empty string below the warning level.
 */
export function usageLine( percent, resets ) {
	if ( percent === null || percent < WARN_AT ) {
		return '';
	}

	if ( percent >= 100 ) {
		return resets
			? sprintf(
					/* translators: %s: a date such as "1 December". */
					__(
						'This month’s characters are used. New audio uses the device voice until %s. Audio already made keeps playing.',
						'text-to-audio'
					),
					resets
			  )
			: __(
					'This month’s characters are used. New audio uses the device voice until the allowance resets. Audio already made keeps playing.',
					'text-to-audio'
			  );
	}

	return sprintf(
		/* translators: %d: a percentage, e.g. 85. */
		__( '%d%% of this month’s characters are used.', 'text-to-audio' ),
		percent
	);
}
