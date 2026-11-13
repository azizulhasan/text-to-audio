/**
 * Finds the help topic for a place in the app.
 *
 * The same fallback as TTA\Help\Help_Topics::for_route(): the exact section,
 * then its tab, then its screen, then the screen's first tab, then the first
 * topic. A screen never opens an empty help drawer.
 *
 * @param {Object} topics Topics keyed by route id (boot.helpTopics).
 * @param {string} route  "screen", "screen:tab" or "screen:tab#section".
 * @return {Object|null} The topic with its `key`, or null when there are none.
 */
export function helpFor( topics, route ) {
	const keys = Object.keys( topics || {} );
	if ( ! keys.length ) {
		return null;
	}

	const id = String( route || '' );
	const noSection = id.split( '#' )[ 0 ];
	const screen = noSection.split( ':' )[ 0 ];

	const key =
		[ id, noSection, screen ].find( ( candidate ) =>
			Object.prototype.hasOwnProperty.call( topics, candidate )
		) ||
		keys.find(
			( candidate ) => screen && candidate.startsWith( screen + ':' )
		) ||
		keys[ 0 ];

	return { key, ...topics[ key ] };
}

/**
 * Only http(s) addresses are opened: the list can be changed by a filter.
 *
 * @param {string} url A URL from a topic.
 * @return {string} The URL, or an empty string when it is not a web address.
 */
export function safeLink( url ) {
	return /^https?:\/\//i.test( String( url || '' ) ) ? String( url ) : '';
}
