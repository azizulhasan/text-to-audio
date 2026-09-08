/**
 * TTS-266 — the AtlasVoice post metabox, rebuilt on @wordpress/components.
 *
 * Lives in Free because player 7 is a free player that writes its own audio;
 * Pro extends it through filters instead of shipping a second copy.
 *
 * Replaces the hand-rolled panel (three full-width #184c53 banners, a multi-select
 * listing raw URLs, and two delete buttons side by side) with the admin's own
 * controls. Only the brand colours carry over — see Assets/css/atlasvoice-metabox.css.
 *
 * Mounts into #atlasvoice-metabox-root, which the Free metabox renders inside the
 * existing metabox, so this works identically in the block editor, the classic
 * editor and the WooCommerce product screen: `wp-element` and `wp-components` are
 * core-registered scripts, not block-editor-only. The one thing the classic editor
 * does not load for us is the components stylesheet, which the PHP enqueues.
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
	useCallback,
} from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	Notice,
	Panel,
	PanelBody,
	Spinner,
} from '@wordpress/components';

const data = window.atlasVoiceMetabox || {};
const i18n = ( window.wp && window.wp.i18n ) || {};
const __ = i18n.__ || ( ( s ) => s );
const _n = i18n._n || ( ( s, p, n ) => ( n === 1 ? s : p ) );
const sprintf = i18n.sprintf || ( ( s ) => s );

const TEXT_DOMAIN = 'text-to-audio';

/**
 * Seconds to "10:07".
 */
function formatDuration( seconds ) {
	const total = Math.max( 0, Math.round( seconds ) );

	return `${ Math.floor( total / 60 ) }:${ String( total % 60 ).padStart( 2, '0' ) }`;
}

async function postJSON( endpoint, body ) {
	const response = await fetch( data.apiURL + endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=UTF-8',
			'X-WP-Nonce': data.restNonce,
		},
		body: JSON.stringify( body ),
	} );

	return response.json();
}

/**
 * One generated file: hear it, see what it is, delete it.
 */
function FileRow( { file, selected, onToggle, onDelete, busy } ) {
	const audioRef = useRef( null );
	const [ playing, setPlaying ] = useState( false );

	const togglePlay = useCallback( () => {
		const audio = audioRef.current;
		if ( ! audio ) {
			return;
		}
		if ( audio.paused ) {
			audio.play();
		} else {
			audio.pause();
		}
	}, [] );

	const classes = [ 'av-row' ];
	if ( selected ) {
		classes.push( 'is-selected' );
	}
	if ( ! file.exists ) {
		classes.push( 'is-missing' );
	}

	const meta = file.exists
		? [
				file.duration ? formatDuration( file.duration ) : null,
				file.sizeText || null,
				file.dateText || null,
				file.remote ? __( 'stored off-site', TEXT_DOMAIN ) : null,
		  ]
				.filter( Boolean )
				.join( ' · ' )
		: el(
				'span',
				{ className: 'av-missing' },
				__( 'File is missing from the server', TEXT_DOMAIN )
		  );

	return el(
		'div',
		{ className: classes.join( ' ' ) },

		el( CheckboxControl, {
			checked: selected,
			onChange: onToggle,
			disabled: busy,
			label: '',
			'aria-label': sprintf(
				/* translators: %s: language and voice of the audio file. */
				__( 'Select %s', TEXT_DOMAIN ),
				file.label
			),
		} ),

		el(
			'button',
			{
				type: 'button',
				className: 'av-play',
				onClick: togglePlay,
				disabled: ! file.exists,
				'aria-label': sprintf(
					playing
						? /* translators: %s: language and voice of the audio file. */
						  __( 'Pause %s', TEXT_DOMAIN )
						: /* translators: %s: language and voice of the audio file. */
						  __( 'Play %s', TEXT_DOMAIN ),
					file.label
				),
			},
			el( 'span', {
				className:
					'dashicons dashicons-controls-' + ( playing ? 'pause' : 'play' ),
				'aria-hidden': 'true',
			} )
		),

		el(
			'div',
			{ className: 'av-row-main' },
			el(
				'span',
				{ className: 'av-row-name' },
				file.label,
				file.engine
					? el( 'span', { className: 'av-engine' }, file.engine )
					: null
			),
			el( 'span', { className: 'av-row-meta' }, meta ),
			el(
				'span',
				{ className: 'av-row-file', title: file.fileName },
				file.fileName
			)
		),

		el(
			Button,
			{
				variant: 'link',
				className: 'av-delete-link',
				onClick: onDelete,
				disabled: busy,
			},
			__( 'Delete', TEXT_DOMAIN )
		),

		file.exists
			? el( 'audio', {
					ref: audioRef,
					src: file.url,
					preload: 'none',
					style: { display: 'none' },
					onPlay: () => setPlaying( true ),
					onPause: () => setPlaying( false ),
					onEnded: () => setPlaying( false ),
			  } )
			: null
	);
}

function AudioSection( { files, setFiles, notify, busy, setBusy } ) {
	const [ selected, setSelected ] = useState( [] );

	const toggle = ( key ) =>
		setSelected( ( current ) =>
			current.includes( key )
				? current.filter( ( k ) => k !== key )
				: current.concat( key )
		);

	const allChecked = files.length > 0 && selected.length === files.length;
	const toggleAll = () =>
		setSelected( allChecked ? [] : files.map( ( file ) => file.key ) );

	const remove = async ( keys ) => {
		if ( ! keys.length ) {
			return;
		}

		const deletingAll = keys.length === files.length && files.length > 1;
		const message = deletingAll
			? __(
					'Delete every audio file for this post? This cannot be undone.',
					TEXT_DOMAIN
			  )
			: sprintf(
					/* translators: %s: comma-separated list of languages and voices. */
					__( 'Delete the audio for %s? This cannot be undone.', TEXT_DOMAIN ),
					files
						.filter( ( file ) => keys.includes( file.key ) )
						.map( ( file ) => file.label )
						.join( ', ' )
			  );

		if ( ! window.confirm( message ) ) {
			return;
		}

		setBusy( true );

		const result = await postJSON( 'delete_mp3_file', {
			post_id: data.postId,
			path: data.path,
			language_keys: keys,
			delete_all: keys.length === files.length,
		} );

		setBusy( false );

		if ( ! result || ! result.status ) {
			notify( {
				type: 'error',
				text:
					( result && result.message ) ||
					__( 'The audio could not be deleted.', TEXT_DOMAIN ),
			} );
			return;
		}

		setFiles( files.filter( ( file ) => ! keys.includes( file.key ) ) );
		setSelected( [] );
		notify( {
			type: 'success',
			text: sprintf(
				/* translators: %d: number of audio files deleted. */
				_n( '%d audio file deleted.', '%d audio files deleted.', keys.length, TEXT_DOMAIN ),
				keys.length
			),
		} );
	};

	if ( ! files.length ) {
		return el(
			'div',
			{ className: 'av-empty' },
			el(
				'p',
				null,
				// Player 7 makes its audio on demand; the Pro players are generated
				// deliberately, so promising them "on first play" would be wrong.
				data.canGenerate
					? __( 'No audio has been generated for this post yet.', TEXT_DOMAIN )
					: __(
							'No audio yet. It is generated the first time someone presses play on this post.',
							TEXT_DOMAIN
					  )
			),
			data.canGenerate
				? el(
						Button,
						{ variant: 'primary', href: data.generateUrl, target: '_blank' },
						__( 'Generate it now', TEXT_DOMAIN )
				  )
				: null
		);
	}

	const totalBytes = files.reduce( ( sum, file ) => sum + ( file.size || 0 ), 0 );

	return el(
		Fragment,
		null,

		el(
			'div',
			{ className: 'av-list' },

			el(
				'div',
				{ className: 'av-list-head' },
				el( CheckboxControl, {
					checked: allChecked,
					onChange: toggleAll,
					disabled: busy,
					label: __( 'Select all', TEXT_DOMAIN ),
				} ),
				el(
					'span',
					null,
					sprintf(
						/* translators: %d: number of audio files stored for this post. */
						_n( '%d file', '%d files', files.length, TEXT_DOMAIN ),
						files.length
					) +
						( totalBytes
							? ' · ' + ( totalBytes / 1048576 ).toFixed( 1 ) + ' MB'
							: '' )
				)
			),

			files.map( ( file ) =>
				el( FileRow, {
					key: file.key,
					file,
					busy,
					selected: selected.includes( file.key ),
					onToggle: () => toggle( file.key ),
					onDelete: () => remove( [ file.key ] ),
				} )
			)
		),

		// Pro players can generate another language or replace what is there, so the
		// action stays available once files exist — the old panel offered it too,
		// and hiding it behind the empty state would have lost that.
		data.canGenerate
			? el(
					'p',
					{ className: 'av-list-foot' },
					el(
						Button,
						{ variant: 'secondary', href: data.generateUrl, target: '_blank' },
						__( 'Generate another language', TEXT_DOMAIN )
					)
			  )
			: null,

		selected.length
			? el(
					'div',
					{ className: 'av-selbar' },
					el(
						'span',
						null,
						sprintf(
							/* translators: %d: number of audio files ticked. */
							_n(
								'%d file selected',
								'%d files selected',
								selected.length,
								TEXT_DOMAIN
							),
							selected.length
						)
					),
					el(
						'span',
						{ className: 'av-selbar-actions' },
						el(
							Button,
							{
								variant: 'link',
								onClick: () => setSelected( [] ),
								disabled: busy,
							},
							__( 'Clear', TEXT_DOMAIN )
						),
						el(
							Button,
							{
								variant: 'primary',
								className: 'av-destructive',
								onClick: () => remove( selected ),
								disabled: busy,
							},
							__( 'Delete selected', TEXT_DOMAIN )
						)
					)
			  )
			: null
	);
}

function UploadSection( { notify, busy, setBusy } ) {
	const [ copied, setCopied ] = useState( false );

	const copyName = async () => {
		try {
			await window.navigator.clipboard.writeText( data.expectedName );
			setCopied( true );
			window.setTimeout( () => setCopied( false ), 1600 );
		} catch ( error ) {
			notify( {
				type: 'error',
				text: __(
					'Your browser blocked the copy. Select the name and copy it by hand.',
					TEXT_DOMAIN
				),
			} );
		}
	};

	const upload = async ( event ) => {
		const file = event.target.files && event.target.files[ 0 ];
		if ( ! file ) {
			return;
		}

		if ( data.postStatus !== 'publish' ) {
			notify( {
				type: 'error',
				text: __( 'Publish the post before uploading audio for it.', TEXT_DOMAIN ),
			} );
			return;
		}

		if ( file.type !== 'audio/mpeg' ) {
			notify( {
				type: 'error',
				text: __( 'That is not an MP3 file.', TEXT_DOMAIN ),
			} );
			return;
		}

		// The server reads the language (and voice) back out of the file name, so a
		// name that does not carry them cannot be matched to a player. Same regex the
		// previous upload script used, so the route sees exactly what it always did.
		const match = file.name.match(
			/^(.+)__lang__([a-zA-Z-_]+)(?:__voice__([a-zA-Z0-9-_]+))?\.mp3$/
		);

		if ( ! match ) {
			notify( {
				type: 'error',
				text: sprintf(
					/* translators: %s: required file name pattern. */
					__( 'Rename the file first — it has to be %s', TEXT_DOMAIN ),
					data.fileFormat
				),
			} );
			return;
		}

		// Whether the name must carry a voice comes from the name the panel itself
		// recommends, not from the player id — see the note in TTA_Admin.
		if ( data.requiresVoice && ! match[ 3 ] ) {
			notify( {
				type: 'error',
				text: __(
					'This player needs the voice in the file name too.',
					TEXT_DOMAIN
				),
			} );
			return;
		}

		const form = new FormData();
		form.append( 'file', file );
		form.append( 'post_id', data.postId );
		form.append( 'path', data.path );

		setBusy( true );

		try {
			const response = await fetch( data.apiURL + 'upload_mp3_file', {
				method: 'POST',
				body: form,
				headers: { 'X-WP-Nonce': data.restNonce },
			} );
			const result = await response.json();

			// The route answers 200 with { status: false, message } for a refusal —
			// checking response.ok alone reported "Uploaded" for every rejection.
			notify(
				response.ok && result && result.status
					? {
							type: 'success',
							text: __(
								'Uploaded. Reload the post to see it in the list.',
								TEXT_DOMAIN
							),
					  }
					: {
							type: 'error',
							text:
								( result && result.message ) ||
								__( 'The upload failed.', TEXT_DOMAIN ),
					  }
			);
		} catch ( error ) {
			notify( {
				type: 'error',
				text: __( 'The upload could not be sent.', TEXT_DOMAIN ),
			} );
		}

		setBusy( false );
		event.target.value = '';
	};

	return el(
		Fragment,
		null,
		el(
			'p',
			{ className: 'av-section-title' },
			__( 'Name the file exactly this', TEXT_DOMAIN )
		),
		el(
			'div',
			{ className: 'av-name-row' },
			el( 'code', null, data.expectedName ),
			el(
				Button,
				{ variant: 'secondary', onClick: copyName },
				copied ? __( 'Copied', TEXT_DOMAIN ) : __( 'Copy', TEXT_DOMAIN )
			)
		),
		el(
			'p',
			{ className: 'av-hint' },
			sprintf(
				/* translators: %s: file name pattern, e.g. {file_name}__lang__{language}.mp3 */
				__(
					'The pattern is %s — AtlasVoice reads the language back out of the name to match it to the right voice.',
					TEXT_DOMAIN
				),
				data.fileFormat
			)
		),
		el(
			'p',
			{ style: { marginBottom: 0 } },
			el( 'input', {
				type: 'file',
				accept: 'audio/mpeg',
				onChange: upload,
				disabled: busy,
			} )
		)
	);
}

function Metabox() {
	const [ files, setFiles ] = useState( data.files || [] );
	const [ notice, setNotice ] = useState( null );
	const [ busy, setBusy ] = useState( false );

	return el(
		Fragment,
		null,

		notice
			? el(
					Notice,
					{
						status: notice.type,
						onRemove: () => setNotice( null ),
						isDismissible: true,
					},
					notice.text
			  )
			: null,

		el(
			'p',
			{ className: 'av-section-title' },
			__( 'Audio for this post', TEXT_DOMAIN )
		),

		el( AudioSection, {
			files,
			setFiles,
			notify: setNotice,
			busy,
			setBusy,
		} ),

		busy
			? el(
					'p',
					{ className: 'av-busy' },
					el( Spinner, null ),
					' ' + __( 'Working…', TEXT_DOMAIN )
			  )
			: null,

		el(
			Panel,
			{ className: 'av-fold' },
			el(
				PanelBody,
				{
					title: __( 'Replace with your own recording', TEXT_DOMAIN ),
					initialOpen: false,
				},
				el( UploadSection, { notify: setNotice, busy, setBusy } )
			)
		)
	);
}

const root = document.getElementById( 'atlasvoice-metabox-root' );
if ( root ) {
	render( el( Metabox, null ), root );
}
