import { __, sprintf } from '@wordpress/i18n';

import { MIN_TEXT_CONTRAST, contrastRatio } from '../util/contrast';
import { Chip } from './parts';

/**
 * Says, in words and numbers, whether text in one colour can be read
 * on a background in another. Shared by every screen that sets a text colour.
 *
 * @param {Object} props
 * @param {string} props.text       Text colour.
 * @param {string} props.background Background colour.
 * @return {*} The line, or nothing when a colour is not a hex value.
 */
export default function ContrastLine( { text, background } ) {
	const ratio = contrastRatio( text, background );
	if ( ratio === null ) {
		return null;
	}

	// Judged on the number that is shown, so the word and the number never disagree.
	const shown = Math.round( ratio * 10 ) / 10;
	const passes = shown >= MIN_TEXT_CONTRAST;

	return (
		<span role="status">
			<Chip tone={ passes ? 'ok' : 'warn' }>
				{ passes
					? __( 'Easy to read', 'text-to-audio' )
					: __( 'Hard to read', 'text-to-audio' ) }
			</Chip>{ ' ' }
			{ sprintf(
				/* translators: 1: a contrast ratio such as 7.2, 2: the smallest allowed ratio. */
				__(
					'Contrast %1$s to 1. Text needs at least %2$s to 1.',
					'text-to-audio'
				),
				shown.toFixed( 1 ),
				MIN_TEXT_CONTRAST
			) }
		</span>
	);
}
