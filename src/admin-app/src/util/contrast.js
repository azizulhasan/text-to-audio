/**
 * Colour contrast, as WCAG defines it. AtlasVoice is an accessibility
 * product: where the owner picks a text colour and a background, the screen
 * says whether visitors can read it.
 */

/** The smallest ratio WCAG 2.2 AA allows for normal text. */
export const MIN_TEXT_CONTRAST = 4.5;

/**
 * Reads "#abc" or "#aabbcc".
 *
 * @param {string} hex A hex colour.
 * @return {number[]|null} [ r, g, b ] from 0 to 255, or null when it is not a hex colour.
 */
export function parseHex( hex ) {
	const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(
		String( hex || '' ).trim()
	);
	if ( ! match ) {
		return null;
	}

	const digits =
		match[ 1 ].length === 3
			? match[ 1 ].replace( /./g, ( digit ) => digit + digit )
			: match[ 1 ];

	return [ 0, 2, 4 ].map( ( start ) =>
		parseInt( digits.slice( start, start + 2 ), 16 )
	);
}

/**
 * Relative luminance of a colour (WCAG 2.x).
 *
 * @param {number[]} rgb [ r, g, b ] from 0 to 255.
 * @return {number} From 0 (black) to 1 (white).
 */
function luminance( rgb ) {
	const [ r, g, b ] = rgb.map( ( channel ) => {
		const value = channel / 255;

		return value <= 0.03928
			? value / 12.92
			: Math.pow( ( value + 0.055 ) / 1.055, 2.4 );
	} );

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The contrast ratio of two colours.
 *
 * @param {string} first  A hex colour.
 * @param {string} second A hex colour.
 * @return {number|null} From 1 to 21, or null when either is not a hex colour.
 */
export function contrastRatio( first, second ) {
	const a = parseHex( first );
	const b = parseHex( second );
	if ( ! a || ! b ) {
		return null;
	}

	const [ light, dark ] = [ luminance( a ), luminance( b ) ].sort(
		( x, y ) => y - x
	);

	return ( light + 0.05 ) / ( dark + 0.05 );
}
