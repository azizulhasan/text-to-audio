import { useEffect, useState } from '@wordpress/element';
import { addAction, applyFilters, removeAction } from '@wordpress/hooks';

const NAMESPACE = 'atlasvoice/slots';

/**
 * The filter that fills a slot.
 *
 * @param {string} name Slot name, e.g. "voice.engines".
 * @return {string} The hook name, e.g. "atlasvoice.slot.voice.engines".
 */
export function slotHook( name ) {
	return 'atlasvoice.slot.' + name;
}

/**
 * The components an extension added to a slot.
 *
 * A filter that returns something else than a list is ignored: a broken
 * extension must never take the screen down with it.
 *
 * @param {string} name Slot name.
 * @return {Function[]} Components, in the order they were added.
 */
export function getSlotFills( name ) {
	const fills = applyFilters( slotHook( name ), [] );

	return Array.isArray( fills )
		? fills.filter( ( fill ) => typeof fill === 'function' )
		: [];
}

/**
 * A place in a free screen where an extension (AtlasVoice Pro) can render its
 * own rows, cards or tabs. The free plugin ships the place, never the Pro
 * part: with no extension the slot renders nothing at all, so Free shows no
 * Pro form and no disabled Pro control (wp.org guideline 5).
 *
 * It re-renders when a filter is added or removed, so it does not matter
 * whether the extension's script runs before or after the app.
 *
 * @param {Object} props
 * @param {string} props.name      Slot name.
 * @param {Object} props.fillProps Props passed to every fill.
 * @return {*} The fills, or nothing.
 */
export default function Slot( { name, fillProps } ) {
	const [ , setVersion ] = useState( 0 );

	useEffect( () => {
		const hook = slotHook( name );
		const id = NAMESPACE + '/' + name + '/' + Math.random().toString( 36 );
		const refresh = ( changed ) => {
			if ( changed === hook ) {
				setVersion( ( version ) => version + 1 );
			}
		};

		addAction( 'hookAdded', id, refresh );
		addAction( 'hookRemoved', id, refresh );

		return () => {
			removeAction( 'hookAdded', id );
			removeAction( 'hookRemoved', id );
		};
	}, [ name ] );

	return getSlotFills( name ).map( ( Fill, index ) => (
		// The fills of a slot are a fixed list per render; their position is their identity.
		// eslint-disable-next-line react/no-array-index-key
		<Fill key={ index } { ...fillProps } />
	) );
}
