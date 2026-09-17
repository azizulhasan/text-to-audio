/**
 * TTS-312 — the "AtlasVoice audio" panel in the post editor sidebar.
 *
 * One panel for every player, in the block and the classic editor. Everything it
 * shows comes from TTA_Helper::atlasvoice_panel_state() (Free), which Pro extends
 * through PHP filters; the delete and replace routes return the same state, so the
 * panel never rebuilds it here. Browser-side extensions use the wp.hooks points:
 *
 *   atlasvoice.audioPanel.state    filter  the state before it is drawn
 *   atlasvoice.audioPanel.changed  action  after a delete or replace succeeded
 *
 * Written with createElement rather than JSX on purpose. JSX would compile to
 * `React.createElement` and pull this plugin's own React 17 out of node_modules,
 * which would then run hooks against a different React instance than the one
 * behind wp.element — the classic "invalid hook call" breakage. Reading the
 * externalised wp globals keeps exactly one React on the page.
 */

import {
	createElement as el,
	Fragment,
	render,
	useState,
	useRef,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { Button, Spinner } from '@wordpress/components';

const boot = window.atlasVoiceMetabox || {};
const i18n = ( window.wp && window.wp.i18n ) || {};
const hooks = window.wp && window.wp.hooks;
const __ = i18n.__ || ( ( s ) => s );
const _n = i18n._n || ( ( s, p, n ) => ( n === 1 ? s : p ) );
const sprintf =
	i18n.sprintf ||
	( ( format, ...args ) => {
		let i = 0;
		return format.replace( /%(\d+\$)?[sd]/g, () => String( args[ i++ ] ) );
	} );

const TEXT_DOMAIN = 'text-to-audio';

const STATUS_LABEL = {
	ready: __( 'Ready', TEXT_DOMAIN ),
	outdated: __( 'Outdated', TEXT_DOMAIN ),
	missing: __( 'No file', TEXT_DOMAIN ),
	gone: __( 'Missing', TEXT_DOMAIN ),
};

const hasFile = ( row ) => row.status === 'ready' || row.status === 'outdated';

function formatTime( seconds ) {
	const total = Number.isFinite( seconds ) ? Math.max( 0, Math.floor( seconds ) ) : 0;

	return `${ Math.floor( total / 60 ) }:${ String( total % 60 ).padStart( 2, '0' ) }`;
}

function filterState( state ) {
	return hooks ? hooks.applyFilters( 'atlasvoice.audioPanel.state', state ) : state;
}

async function request( endpoint, options ) {
	const response = await fetch( boot.apiURL + endpoint, {
		method: 'POST',
		credentials: 'same-origin',
		...options,
		headers: { 'X-WP-Nonce': boot.restNonce, ...( options.headers || {} ) },
	} );

	return response.json();
}

/**
 * The small teal player on a row. One <audio> element is shared by the whole
 * panel, so starting one row stops the other.
 */
function MiniPlayer( { row, playback, onToggle } ) {
	const active = playback.key === row.storedKey;
	const duration = active && playback.duration ? playback.duration : row.duration;
	const current = active ? playback.current : 0;
	const width = duration ? Math.min( 100, ( current / duration ) * 100 ) : 0;
	const playing = active && playback.playing;

	return el(
		'div',
		{ className: 'av-mini' },
		el(
			'button',
			{
				type: 'button',
				className: 'av-mini__pp',
				onClick: () => onToggle( row ),
				'aria-label': playing
					? sprintf( __( 'Pause the %s audio', TEXT_DOMAIN ), row.name )
					: sprintf( __( 'Play the %s audio', TEXT_DOMAIN ), row.name ),
			},
			el( 'span', {
				className: `dashicons dashicons-controls-${ playing ? 'pause' : 'play' }`,
				'aria-hidden': 'true',
			} )
		),
		el(
			'div',
			{ className: 'av-mini__track', 'aria-hidden': 'true' },
			el( 'i', { style: { width: `${ width }%` } } )
		),
		el(
			'span',
			{ className: 'av-mini__time' },
			`${ formatTime( current ) } / ${ duration ? formatTime( duration ) : '–:––' }`
		)
	);
}

function Row( { row, state, playback, busyKey, onToggle, onReplace, onDelete } ) {
	const fileInput = useRef( null );
	const busy = '' !== busyKey && ( busyKey === row.storedKey || busyKey === row.key );

	let meta;
	if ( row.status === 'gone' ) {
		meta = __( 'The file is no longer on the server', TEXT_DOMAIN );
	} else if ( row.status === 'missing' ) {
		meta = [ row.voiceLabel, __( 'No file yet', TEXT_DOMAIN ) ].filter( Boolean ).join( ' · ' );
	} else {
		meta = [ row.voiceLabel, row.sizeText, row.dateText ].filter( Boolean ).join( ' · ' );
	}

	const replaceButton = row.canReplace
		? el(
				Button,
				{
					variant: 'tertiary',
					size: 'small',
					className: 'av-btn',
					disabled: !! busyKey,
					onClick: () => fileInput.current && fileInput.current.click(),
				},
				row.status === 'missing' ? __( 'Upload', TEXT_DOMAIN ) : __( 'Replace', TEXT_DOMAIN )
		  )
		: null;

	const deleteButton = el(
		Button,
		{
			variant: 'tertiary',
			size: 'small',
			isDestructive: true,
			className: 'av-btn',
			disabled: !! busyKey,
			onClick: () => onDelete( row ),
		},
		row.status === 'gone' ? __( 'Remove', TEXT_DOMAIN ) : __( 'Delete', TEXT_DOMAIN )
	);

	let actions;
	if ( hasFile( row ) ) {
		actions = [ el( MiniPlayer, { key: 'p', row, playback, onToggle } ), replaceButton, deleteButton ];
	} else if ( row.status === 'gone' ) {
		actions = [
			el(
				'p',
				{ key: 'h', className: 'av-hint av-hint--full' },
				state.canGenerate
					? __( 'Play the post or use Bulk MP3 to make it again.', TEXT_DOMAIN )
					: __( 'Play the post to make it again.', TEXT_DOMAIN )
			),
			replaceButton,
			deleteButton,
		];
	} else {
		actions = [
			el(
				'p',
				{ key: 'h', className: 'av-hint av-hint--full' },
				state.canGenerate
					? __( 'Generate it in Bulk MP3 or by playing the post.', TEXT_DOMAIN )
					: __( 'Created the first time someone plays the post.', TEXT_DOMAIN )
			),
			replaceButton,
		];
	}

	return el(
		'li',
		{ className: `av-row av-row--${ row.status }` },
		el(
			'div',
			{ className: 'av-row__head' },
			el(
				'div',
				{ className: 'av-row__lang' },
				el( 'span', { className: 'av-code' }, row.code ),
				el( 'span', { className: 'av-row__name' }, row.name ),
				row.thisPost ? el( 'span', { className: 'av-badge' }, __( 'This post', TEXT_DOMAIN ) ) : null,
				row.storageLabel
					? el( 'span', { className: 'av-badge av-badge--storage' }, row.storageLabel )
					: null
			),
			el(
				'span',
				{ className: `av-status av-status--${ row.status }` },
				STATUS_LABEL[ row.status ] || row.status
			)
		),
		meta ? el( 'div', { className: 'av-row__meta' }, meta ) : null,
		! row.expected
			? el(
					'p',
					{ className: 'av-hint' },
					__( 'Not used by the current player or language settings.', TEXT_DOMAIN )
			  )
			: null,
		el(
			'div',
			{ className: 'av-row__actions' },
			busy ? el( Spinner, { key: 's' } ) : null,
			...actions.filter( Boolean )
		),
		row.canReplace
			? el( 'input', {
					ref: fileInput,
					type: 'file',
					accept: '.mp3,audio/mpeg',
					className: 'av-file',
					tabIndex: -1,
					'aria-hidden': 'true',
					onChange: ( event ) => {
						const file = event.target.files && event.target.files[ 0 ];
						event.target.value = '';
						if ( file ) {
							onReplace( row, file );
						}
					},
			  } )
			: null
	);
}

function Panel() {
	const [ state, setState ] = useState( () => filterState( boot.state || {} ) );
	const [ message, setMessage ] = useState( null );
	const [ busyKey, setBusyKey ] = useState( '' );
	const [ playback, setPlayback ] = useState( { key: '', playing: false, current: 0, duration: 0 } );
	const audio = useRef( null );

	useEffect( () => {
		const player = new window.Audio();
		player.preload = 'none';
		const sync = () =>
			setPlayback( ( prev ) => ( {
				...prev,
				playing: ! player.paused,
				current: player.currentTime || 0,
				duration: Number.isFinite( player.duration ) ? player.duration : prev.duration,
			} ) );
		[ 'play', 'pause', 'timeupdate', 'loadedmetadata', 'ended' ].forEach( ( type ) =>
			player.addEventListener( type, sync )
		);
		player.addEventListener( 'error', () => {
			setPlayback( { key: '', playing: false, current: 0, duration: 0 } );
			setMessage( { type: 'error', text: __( 'That audio file could not be played.', TEXT_DOMAIN ) } );
		} );
		audio.current = player;

		return () => player.pause();
	}, [] );

	const toggle = useCallback(
		( row ) => {
			const player = audio.current;
			if ( ! player ) {
				return;
			}
			if ( playback.key === row.storedKey ) {
				if ( player.paused ) {
					player.play().catch( () => {} );
				} else {
					player.pause();
				}
				return;
			}
			player.pause();
			player.src = row.url;
			setPlayback( { key: row.storedKey, playing: false, current: 0, duration: row.duration || 0 } );
			player.play().catch( () => {} );
		},
		[ playback.key ]
	);

	const applyResult = ( result, successText ) => {
		if ( result && result.status && result.state ) {
			setState( filterState( result.state ) );
			setMessage( { type: 'success', text: successText } );
			if ( hooks ) {
				hooks.doAction( 'atlasvoice.audioPanel.changed', result.state );
			}
			return;
		}
		setMessage( {
			type: 'error',
			text: ( result && result.message ) || __( 'Something went wrong. Reload the page and try again.', TEXT_DOMAIN ),
		} );
	};

	const onDelete = async ( row ) => {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( sprintf( __( 'Delete the %s audio? This cannot be undone.', TEXT_DOMAIN ), row.name ) ) ) {
			return;
		}
		if ( playback.key === row.storedKey && audio.current ) {
			audio.current.pause();
			setPlayback( { key: '', playing: false, current: 0, duration: 0 } );
		}
		setBusyKey( row.storedKey );
		try {
			const result = await request( 'delete_mp3_file', {
				headers: { 'Content-Type': 'application/json; charset=UTF-8' },
				body: JSON.stringify( { post_id: state.postId, language_keys: [ row.storedKey ] } ),
			} );
			applyResult( result, sprintf( __( 'Deleted the %s audio.', TEXT_DOMAIN ), row.name ) );
		} catch ( e ) {
			applyResult( null );
		}
		setBusyKey( '' );
	};

	const onReplace = async ( row, file ) => {
		const form = new window.FormData();
		form.append( 'post_id', state.postId );
		form.append( 'key', row.key );
		form.append( 'file', file );
		setBusyKey( row.storedKey || row.key );
		try {
			const result = await request( 'upload_mp3_file', { body: form } );
			applyResult( result, sprintf( __( 'Saved your recording as the %s audio.', TEXT_DOMAIN ), row.name ) );
		} catch ( e ) {
			applyResult( null );
		}
		setBusyKey( '' );
	};

	const rows = Array.isArray( state.rows ) ? state.rows : [];
	const expected = rows.filter( ( row ) => row.expected );
	const others = rows.filter( ( row ) => ! row.expected );
	const ready = expected.filter( ( row ) => row.status === 'ready' ).length;
	const hasStoredFile = rows.some( ( row ) => row.status !== 'missing' );

	const rowProps = { state, playback, busyKey, onToggle: toggle, onReplace, onDelete };

	const children = [];

	if ( message ) {
		children.push(
			el(
				'div',
				{ key: 'msg', className: `av-notice av-notice--${ message.type }`, role: 'status' },
				el( 'span', null, message.text ),
				el(
					'button',
					{
						type: 'button',
						className: 'av-notice__close',
						onClick: () => setMessage( null ),
						'aria-label': __( 'Dismiss', TEXT_DOMAIN ),
					},
					'×'
				)
			)
		);
	}

	( state.notices || [] ).forEach( ( notice, index ) =>
		children.push(
			el(
				'div',
				{ key: `n${ index }`, className: `av-notice av-notice--${ notice.type || 'info' }` },
				el(
					'span',
					null,
					notice.text,
					notice.link
						? el(
								Fragment,
								null,
								' ',
								el( 'a', { href: notice.link.url }, notice.link.label )
						  )
						: null
				)
			)
		)
	);

	if ( ! state.makesMp3 ) {
		children.push(
			el(
				'div',
				{ key: 'browser', className: 'av-notice av-notice--muted' },
				el(
					'span',
					null,
					el( 'b', null, state.playerName ),
					' ',
					__( 'reads the post live in the visitor’s browser, so there are no MP3 files to manage.', TEXT_DOMAIN )
				)
			),
			el(
				'p',
				{ key: 'switch', className: 'av-hint' },
				__( 'Switch to an MP3 player in AtlasVoice → Customize to create audio files.', TEXT_DOMAIN )
			)
		);
	} else if ( ! state.isPublished && ! hasStoredFile ) {
		children.push(
			el(
				'div',
				{ key: 'head', className: 'av-head' },
				el( 'b', null, __( 'No audio yet', TEXT_DOMAIN ) ),
				el( 'span', { className: 'av-badge' }, state.playerName )
			),
			el(
				'div',
				{ key: 'draft', className: 'av-notice av-notice--muted' },
				el(
					'span',
					null,
					state.canGenerate
						? __( 'Audio is made from the published page. Publish the post, then play it or generate it in Bulk MP3.', TEXT_DOMAIN )
						: __( 'Audio is made from the published page. Publish the post, then play it.', TEXT_DOMAIN )
				)
			)
		);
	} else {
		children.push(
			el(
				'div',
				{ key: 'head', className: 'av-head' },
				el(
					'span',
					null,
					el( 'b', null, sprintf( __( '%1$d of %2$d', TEXT_DOMAIN ), ready, expected.length ) ),
					' ',
					_n( 'file ready', 'languages ready', expected.length, TEXT_DOMAIN )
				),
				el( 'span', { className: 'av-badge' }, state.playerName )
			),
			el(
				'ul',
				{ key: 'list', className: 'av-list' },
				expected.map( ( row ) => el( Row, { key: row.key, row, ...rowProps } ) )
			)
		);

		expected
			.filter( ( row ) => row.status === 'outdated' )
			.forEach( ( row ) =>
				children.push(
					el(
						'div',
						{ key: `o${ row.key }`, className: 'av-notice av-notice--warning' },
						el(
							'span',
							null,
							sprintf( __( '%s audio was made before the last content change.', TEXT_DOMAIN ), row.name )
						)
					)
				)
			);
	}

	if ( others.length ) {
		children.push(
			el( 'p', { key: 'others-title', className: 'av-subhead' }, __( 'Other stored audio', TEXT_DOMAIN ) ),
			el(
				'ul',
				{ key: 'others', className: 'av-list' },
				others.map( ( row ) => el( Row, { key: row.storedKey, row, ...rowProps } ) )
			)
		);
	}

	( state.notes || [] ).forEach( ( note, index ) =>
		children.push( el( 'p', { key: `note${ index }`, className: 'av-hint' }, note ) )
	);

	if ( rows.some( ( row ) => row.canReplace ) && state.makesMp3 && ( state.isPublished || hasStoredFile ) ) {
		children.push(
			el(
				'p',
				{ key: 'replace', className: 'av-hint' },
				__( 'Replace accepts any MP3 and saves it for that row’s language.', TEXT_DOMAIN )
			)
		);
	}

	// Bulk MP3 only processes published posts, so a draft gets the notice alone.
	if ( state.canGenerate && state.generateUrl && state.isPublished ) {
		children.push(
			el(
				'div',
				{ key: 'bulk', className: 'av-card' },
				el(
					'span',
					null,
					expected.length > 1
						? __( 'Check the text that will be read, then generate every language.', TEXT_DOMAIN )
						: __( 'Check the text that will be read, then generate the file.', TEXT_DOMAIN )
				),
				el(
					Button,
					{ variant: 'primary', href: state.generateUrl, target: '_blank', className: 'av-card__button' },
					__( 'Generate in Bulk MP3', TEXT_DOMAIN )
				)
			)
		);
	}

	return el( 'div', { className: 'av-panel' }, ...children );
}

const root = document.getElementById( 'atlasvoice-metabox-root' );
if ( root ) {
	render( el( Panel, null ), root );
}
