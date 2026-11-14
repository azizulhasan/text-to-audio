/**
 * Whether a text is a post number.
 *
 * @param {string} text What was typed.
 * @return {boolean} True for a whole number above zero.
 */
export function isPostNumber( text ) {
	return /^[1-9]\d{0,9}$/.test( String( text ).trim() );
}
