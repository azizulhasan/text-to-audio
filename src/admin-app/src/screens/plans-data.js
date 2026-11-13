/**
 * The words of the Plans tab: what Pro adds, and Free and Pro side by side.
 *
 * Only claims the plugin itself can stand behind are listed, without counts
 * of voices or languages: those numbers change with the service and belong
 * on the pricing page, which the tab links to.
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * What Pro adds, as short cards.
 *
 * @return {Array} [ title, sentence ] pairs.
 */
export function getProFeatures() {
	return [
		[
			__( 'Studio voices', 'text-to-audio' ),
			__(
				'AtlasVoice Cloud voices are included in your licence, with no keys to set up.',
				'text-to-audio'
			),
		],
		[
			__( 'Unlimited natural voice', 'text-to-audio' ),
			__(
				'No monthly character limit on the natural voice.',
				'text-to-audio'
			),
		],
		[
			__( 'Every content type', 'text-to-audio' ),
			__(
				'Players on posts, pages, products and custom types, each with its own rules.',
				'text-to-audio'
			),
		],
		[
			__( 'Audio for many posts at once', 'text-to-audio' ),
			__(
				'Prepare the audio of many posts in one go instead of one by one.',
				'text-to-audio'
			),
		],
		[
			__( 'A voice per language', 'text-to-audio' ),
			__(
				'WPML, Polylang, TranslatePress and GTranslate read each post in its own language.',
				'text-to-audio'
			),
		],
		[
			__( 'Skip parts of the page', 'text-to-audio' ),
			__(
				'Leave out share bars, captions and other parts you choose.',
				'text-to-audio'
			),
		],
		[
			__( 'Audio in search', 'text-to-audio' ),
			__(
				'Audio structured data for search engines and AI answers.',
				'text-to-audio'
			),
		],
		[
			__( 'Deeper insights', 'text-to-audio' ),
			__(
				'More listening statistics, export and email reports.',
				'text-to-audio'
			),
		],
	];
}

/**
 * Free and Pro side by side.
 *
 * @return {Array} [ what, in Free, in Pro ] rows.
 */
export function getComparison() {
	const yes = __( 'Yes', 'text-to-audio' );
	const no = __( 'No', 'text-to-audio' );

	return [
		[
			__( 'Browser voice', 'text-to-audio' ),
			__( 'Unlimited', 'text-to-audio' ),
			__( 'Unlimited', 'text-to-audio' ),
		],
		[
			__( 'Natural voice (MP3)', 'text-to-audio' ),
			__( '100,000 characters a month', 'text-to-audio' ),
			__( 'Unlimited', 'text-to-audio' ),
		],
		[ __( 'Studio voices (AtlasVoice Cloud)', 'text-to-audio' ), no, yes ],
		[
			__( 'Your own Google, OpenAI or ElevenLabs key', 'text-to-audio' ),
			yes,
			yes,
		],
		[
			__( 'Where the player is added', 'text-to-audio' ),
			__( 'One content type', 'text-to-audio' ),
			__( 'Every content type', 'text-to-audio' ),
		],
		[
			__( 'Languages', 'text-to-audio' ),
			__( 'The site language', 'text-to-audio' ),
			__( 'A voice for each language', 'text-to-audio' ),
		],
		[
			__( 'Making audio ahead of time', 'text-to-audio' ),
			__( 'One post at a time', 'text-to-audio' ),
			__( 'Many posts at once', 'text-to-audio' ),
		],
		[
			__( 'Pronunciation words', 'text-to-audio' ),
			'1',
			__( 'As many as you need', 'text-to-audio' ),
		],
		[ __( 'Skip parts of the page', 'text-to-audio' ), no, yes ],
		[ __( 'Audio in search and AI answers', 'text-to-audio' ), no, yes ],
		[
			__( 'Support', 'text-to-audio' ),
			__( 'WordPress.org forum', 'text-to-audio' ),
			__( 'Email', 'text-to-audio' ),
		],
	];
}

/**
 * "1 site", "5 sites".
 *
 * @param {number} sites How many sites the plan covers.
 * @return {string} The plan's name.
 */
export function tierName( sites ) {
	return sprintf(
		/* translators: %d: a number of websites. */
		_n( '%d site', '%d sites', sites, 'text-to-audio' ),
		sites
	);
}

/**
 * A price in US dollars, the currency the plans are sold in.
 *
 * @param {number} amount Whole dollars.
 * @return {string} e.g. "$149".
 */
export function formatPrice( amount ) {
	return '$' + Number( amount ).toLocaleString( 'en-US' );
}

/**
 * Whether an address may be opened from the Plans tab: https, on our own
 * site or on the checkout. The site already checks this; the screen checks
 * again because the address ends up in a link.
 *
 * @param {string} url The address.
 * @return {string} The address, or an empty string.
 */
export function safePlanLink( url ) {
	try {
		const parsed = new URL( String( url ) );
		const host = parsed.hostname.toLowerCase();
		const ours = [ 'atlasaidev.com', 'checkout.freemius.com' ].some(
			( allowed ) => host === allowed || host.endsWith( '.' + allowed )
		);

		return parsed.protocol === 'https:' && ours ? parsed.href : '';
	} catch ( error ) {
		return '';
	}
}
