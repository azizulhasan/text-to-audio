/**
 * Turns the saved setup into the short lines Home shows.
 * Kept apart from the screen so each rule can be tested on its own.
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Where the player sits, in words.
 *
 * @param {string} position The saved position.
 * @return {string} e.g. "Before the content".
 */
export function positionWords( position ) {
	switch ( position ) {
		case 'before_content':
			return __( 'Before the content', 'text-to-audio' );
		case 'after_content':
			return __( 'After the content', 'text-to-audio' );
		default:
			return __( 'Where you placed it', 'text-to-audio' );
	}
}

/**
 * Who sees the player, in words.
 *
 * @param {string[]} shownTo The saved audience.
 * @return {string} e.g. "shown to everyone".
 */
export function audienceWords( shownTo ) {
	const list = Array.isArray( shownTo ) ? shownTo : [];

	return list.length === 0 || list.includes( 'all' )
		? __( 'shown to everyone', 'text-to-audio' )
		: __( 'shown to some user roles', 'text-to-audio' );
}

/**
 * The voice that reads the posts, in one line.
 *
 * @param {Object} voice `voice` of the summary.
 * @return {string} e.g. "Emma · AtlasVoice TTS".
 */
export function voiceWords( voice ) {
	const parts = [ voice?.voice, voice?.engine ].filter(
		( part ) => typeof part === 'string' && part !== ''
	);

	return parts.length
		? parts.join( ' · ' )
		: __( 'Not chosen yet', 'text-to-audio' );
}

/**
 * What is read, in one line.
 *
 * @param {Object} content `content` of the summary.
 * @return {string} e.g. "Posts, Pages".
 */
export function contentWords( content ) {
	if ( content && content.automatic === false ) {
		return __( 'Only where you add the player', 'text-to-audio' );
	}

	const types = Array.isArray( content?.post_types )
		? content.post_types.filter(
				( type ) => typeof type === 'string' && type !== ''
		  )
		: [];

	return types.length
		? types.join( ', ' )
		: __( 'Nothing chosen yet', 'text-to-audio' );
}

/**
 * The sentence after "Right now, …".
 *
 * @param {boolean} live    Whether visitors can hear the posts.
 * @param {Object}  summary The summary.
 * @return {string} The sentence.
 */
export function modeDetail( live, summary ) {
	if ( ! live ) {
		return __(
			'You are in staging, so only logged-in administrators see the player.',
			'text-to-audio'
		);
	}

	return sprintf(
		/* translators: 1: content types such as "Posts, Pages", 2: who sees the player, e.g. "shown to everyone". */
		__( 'On %1$s, %2$s.', 'text-to-audio' ),
		contentWords( summary?.content ),
		audienceWords( summary?.player?.shown_to )
	);
}

/**
 * An address that may be opened from Home: http or https only.
 *
 * @param {string} url The address.
 * @return {string} The address, or an empty string.
 */
export function safeWebLink( url ) {
	try {
		const parsed = new URL( String( url ) );

		return [ 'https:', 'http:' ].includes( parsed.protocol )
			? parsed.href
			: '';
	} catch ( error ) {
		return '';
	}
}
