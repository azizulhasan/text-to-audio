/**
 * Talks to the site's REST API.
 *
 * The address comes from PHP (TTA_Cache::get_rest_api_url()), not from
 * WordPress's default root: it is right on sites with plain permalinks and on
 * multilingual sites that put a language in the URL (TTS-308, TTS-361).
 */

/**
 * Builds the full address of a route.
 *
 * @param {string} restUrl REST root, ending in "/wp-json/" or "?rest_route=/".
 * @param {string} path    Route, e.g. "tta/v1/mode".
 * @param {Object} query   Query arguments.
 * @return {string} The address.
 */
export function buildUrl( restUrl, path, query = {} ) {
	const url = String( restUrl ) + String( path ).replace( /^\/+/, '' );
	const args = new URLSearchParams( query ).toString();

	if ( ! args ) {
		return url;
	}

	// With plain permalinks the root already has a "?".
	return url + ( url.includes( '?' ) ? '&' : '?' ) + args;
}

/**
 * Sends a request and returns the decoded answer.
 *
 * A failed request rejects with an Error whose message is the one the server
 * sent, so screens can show it as it is.
 *
 * @param {Object} boot           Boot data (restUrl, restNonce).
 * @param {string} path           Route, e.g. "tta/v1/mode".
 * @param {Object} options
 * @param {string} options.method HTTP method. Default GET.
 * @param {Object} options.data   JSON body for POST and friends.
 * @param {Object} options.query  Query arguments.
 * @return {Promise<*>} The decoded response.
 */
export async function request(
	boot,
	path,
	{ method = 'GET', data, query } = {}
) {
	const response = await window.fetch(
		buildUrl( boot.restUrl, path, query ),
		{
			method,
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': boot.restNonce,
				...( data ? { 'Content-Type': 'application/json' } : {} ),
			},
			body: data ? JSON.stringify( data ) : undefined,
		}
	);

	let body = null;
	try {
		body = await response.json();
	} catch ( error ) {
		// Not JSON: a firewall page or a PHP error. Handled below by the status.
	}

	if ( ! response.ok ) {
		const failure = new Error(
			body?.message || `HTTP ${ response.status }`
		);
		failure.status = response.status;
		failure.code = body?.code;
		// What the site added to its refusal, e.g. who owns a site that is already connected.
		failure.data = body?.data;
		throw failure;
	}

	return body;
}
