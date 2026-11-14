/**
 * The search box in the header: find a screen, a setting or an action by
 * typing, and open it with Enter.
 *
 * Settings are found by their new name and by the name they had in the
 * classic screens ("Aliases" finds Pronunciation), from the same list as
 * Help › Where things moved.
 *
 * "/" puts the cursor in the box. Ctrl+K is left alone: it belongs to
 * WordPress's own command palette.
 *
 * The box is a combobox with a list (WAI-ARIA 1.2): the focus stays in the
 * input, the arrow keys move through the list, Enter opens, Escape closes.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';

import { useApp } from '../app-context';
import { SCREENS, getTabs } from '../routes';
import { getMovedItems } from '../screens/moved';
import useModeSwitch from './use-mode-switch';

const LIST_ID = 'atlasvoice-search-results';

/** How many results of each kind are shown. */
const MOST = { screens: 6, settings: 6, actions: 3 };

/**
 * What can be found, for this site.
 *
 * @param {Object}  site
 * @param {boolean} site.isPro         Whether Pro is active.
 * @param {boolean} site.setupFinished Whether the setup is finished.
 * @param {boolean} site.live          Whether visitors get the player.
 * @return {Object} { screens, settings, actions }: lists of { label, meta, words, route | action }.
 */
export function searchIndex( { isPro, setupFinished, live } ) {
	const screens = [];

	SCREENS.filter(
		( screen ) => screen.id !== 'setup' || ! setupFinished
	).forEach( ( screen ) => {
		screens.push( {
			label: screen.label,
			meta: __( 'Screen', 'text-to-audio' ),
			words: screen.label,
			route: screen.id,
		} );
		getTabs( screen, isPro ).forEach( ( tab ) => {
			screens.push( {
				label: sprintf(
					/* translators: 1: screen name, 2: tab name. */
					__( '%1$s › %2$s', 'text-to-audio' ),
					screen.label,
					tab.label
				),
				meta: __( 'Screen', 'text-to-audio' ),
				words: screen.label + ' ' + tab.label,
				route: screen.id + ':' + tab.id,
			} );
		} );
	} );

	const settings = getMovedItems()
		.filter( ( item ) => isPro || ! item.pro )
		.map( ( item ) => ( {
			label: item.now,
			meta: sprintf(
				/* translators: %s: the name a setting had in the classic screens. */
				__( 'Was “%s”', 'text-to-audio' ),
				item.before
			),
			words: item.now + ' ' + item.before,
			route: item.route,
		} ) );

	const actions = [
		{
			label: live
				? __( 'Back to staging', 'text-to-audio' )
				: __( 'Go live', 'text-to-audio' ),
			meta: __( 'Action', 'text-to-audio' ),
			words: live
				? __( 'Back to staging', 'text-to-audio' )
				: __( 'Go live', 'text-to-audio' ),
			action: 'mode',
		},
		{
			label: __( 'Run the health check', 'text-to-audio' ),
			meta: __( 'Action', 'text-to-audio' ),
			words: __( 'Run the health check', 'text-to-audio' ),
			route: 'site:health',
		},
		{
			label: __( 'Find where a setting moved', 'text-to-audio' ),
			meta: __( 'Action', 'text-to-audio' ),
			words: __( 'Find where a setting moved', 'text-to-audio' ),
			route: 'help:moved',
		},
	];

	return { screens, settings, actions };
}

/**
 * The results for what was typed, in groups.
 *
 * With nothing typed the box shows a few screens and the actions; settings
 * only show for a search, because there are many.
 *
 * @param {Object} index What can be found (searchIndex()).
 * @param {string} query What was typed.
 * @return {Array} [ { id, name, rows } ], without the empty groups.
 */
export function searchResults( index, query ) {
	const wanted = String( query || '' )
		.trim()
		.toLowerCase();
	const match = ( row ) =>
		! wanted || row.words.toLowerCase().includes( wanted );

	return [
		{
			id: 'screens',
			name: __( 'Screens', 'text-to-audio' ),
			rows: index.screens
				.filter( match )
				.slice( 0, wanted ? MOST.screens : 4 ),
		},
		{
			id: 'settings',
			name: __( 'Settings', 'text-to-audio' ),
			rows: wanted
				? index.settings.filter( match ).slice( 0, MOST.settings )
				: [],
		},
		{
			id: 'actions',
			name: __( 'Actions', 'text-to-audio' ),
			rows: index.actions.filter( match ).slice( 0, MOST.actions ),
		},
	].filter( ( group ) => group.rows.length );
}

/**
 * Whether a key press belongs to a field the user is typing in.
 *
 * @param {Element|null} target Where the key was pressed.
 * @return {boolean} True inside an input, a text area, a select or editable text.
 */
function isTyping( target ) {
	return (
		!! target &&
		( [ 'INPUT', 'TEXTAREA', 'SELECT' ].includes( target.tagName ) ||
			target.isContentEditable )
	);
}

/**
 * The search box.
 *
 * @return {*} The box and, while it is open, its results.
 */
export default function Search() {
	const { boot, isPro, go, setupFinished } = useApp();
	const { live, ask } = useModeSwitch();
	const [ query, setQuery ] = useState( '' );
	const [ open, setOpen ] = useState( false );
	const [ active, setActive ] = useState( 0 );
	const input = useRef( null );

	useEffect( () => {
		const onKey = ( event ) => {
			if (
				event.key === '/' &&
				! event.ctrlKey &&
				! event.metaKey &&
				! event.altKey &&
				! isTyping( event.target )
			) {
				event.preventDefault();
				if ( input.current ) {
					input.current.focus();
				}
			}
		};
		document.addEventListener( 'keydown', onKey );

		return () => document.removeEventListener( 'keydown', onKey );
	}, [] );

	const finished = setupFinished ?? !! boot.setupFinished;
	const index = useMemo(
		() => searchIndex( { isPro, setupFinished: finished, live } ),
		[ isPro, finished, live ]
	);
	const groups = searchResults( index, query );
	const rows = groups.flatMap( ( group ) => group.rows );
	const current = Math.min( active, Math.max( 0, rows.length - 1 ) );

	const close = () => {
		setOpen( false );
		setQuery( '' );
		setActive( 0 );
	};

	const pick = ( row ) => {
		close();
		if ( input.current ) {
			input.current.blur();
		}
		if ( row.action === 'mode' ) {
			ask();
		} else {
			go( row.route );
		}
	};

	const onKeyDown = ( event ) => {
		if ( event.key === 'ArrowDown' ) {
			event.preventDefault();
			setOpen( true );
			setActive( Math.min( current + 1, rows.length - 1 ) );
		} else if ( event.key === 'ArrowUp' ) {
			event.preventDefault();
			setActive( Math.max( current - 1, 0 ) );
		} else if ( event.key === 'Enter' && open && rows[ current ] ) {
			event.preventDefault();
			pick( rows[ current ] );
		} else if ( event.key === 'Escape' ) {
			close();
			event.target.blur();
		}
	};

	let position = -1;

	return (
		<div className="atlasvoice-search">
			<input
				ref={ input }
				type="search"
				className="atlasvoice-search-input"
				role="combobox"
				aria-label={ __( 'Search AtlasVoice', 'text-to-audio' ) }
				aria-expanded={ open }
				aria-controls={ LIST_ID }
				aria-autocomplete="list"
				aria-activedescendant={
					open && rows.length ? LIST_ID + '-' + current : undefined
				}
				autoComplete="off"
				placeholder={ __(
					'Search screens, settings and actions',
					'text-to-audio'
				) }
				value={ query }
				onChange={ ( event ) => {
					setQuery( event.target.value );
					setActive( 0 );
					setOpen( true );
				} }
				onFocus={ () => setOpen( true ) }
				onBlur={ close }
				onKeyDown={ onKeyDown }
			/>
			<kbd className="atlasvoice-search-key" aria-hidden="true">
				/
			</kbd>
			{ open && (
				<div
					className="atlasvoice-search-results"
					id={ LIST_ID }
					role="listbox"
					aria-label={ __( 'Search results', 'text-to-audio' ) }
				>
					{ groups.map( ( group ) => (
						<div
							key={ group.id }
							role="group"
							aria-labelledby={ LIST_ID + '-' + group.id }
						>
							<div
								className="atlasvoice-search-group"
								id={ LIST_ID + '-' + group.id }
							>
								{ group.name }
							</div>
							{ group.rows.map( ( row ) => {
								position++;
								const at = position;

								return (
									// The focus stays in the input (aria-activedescendant), so the
									// option itself takes the mouse only.
									// eslint-disable-next-line jsx-a11y/click-events-have-key-events
									<div
										key={ row.label + row.meta }
										id={ LIST_ID + '-' + at }
										role="option"
										aria-selected={ at === current }
										tabIndex={ -1 }
										className={
											'atlasvoice-search-hit' +
											( at === current
												? ' is-active'
												: '' )
										}
										// Keeps the focus in the input, so the click is not lost to a blur.
										onMouseDown={ ( event ) =>
											event.preventDefault()
										}
										onMouseEnter={ () => setActive( at ) }
										onClick={ () => pick( row ) }
									>
										<span>{ row.label }</span>
										<small>{ row.meta }</small>
									</div>
								);
							} ) }
						</div>
					) ) }
					{ ! rows.length && (
						<p className="atlasvoice-search-none" role="status">
							{ sprintf(
								/* translators: %s: what was typed in the search box. */
								__(
									'Nothing matches “%s”. Old setting names work too, for example “Aliases”.',
									'text-to-audio'
								),
								query.trim()
							) }
						</p>
					) }
					<div className="atlasvoice-search-foot" aria-hidden="true">
						<span>{ __( '↑↓ move', 'text-to-audio' ) }</span>
						<span>{ __( 'Enter open', 'text-to-audio' ) }</span>
						<span>{ __( 'Esc close', 'text-to-audio' ) }</span>
					</div>
				</div>
			) }
		</div>
	);
}
