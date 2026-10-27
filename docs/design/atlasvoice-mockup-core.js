/*
 * AtlasVoice redesign mockup, part 1: shared helpers, data, the app frame,
 * the front-end player renderer, Overview and Setup.
 *
 * Built from real @wordpress/components loaded from the local site, on the
 * same system as the AtlasMCP mockup. Every control works against in-page
 * state. Free/Pro rule (WordPress.org guideline 5): the free view never
 * renders a Pro form or a disabled Pro control. A Pro feature shows up only
 * as a description page or one dashed "PRO · what it adds · See Pro" line.
 */
( function () {
	const { createElement: h, Fragment, useState, useEffect, useRef, createContext, useContext } = wp.element;
	const C = wp.components;
	const AV = ( window.AVM = { h, Fragment, useState, useEffect, useRef, C, S: {}, V: {} } );
	const exp = ( name ) => C[ name ] || C[ '__experimental' + name ];
	Object.assign( AV, {
		ItemGroup: exp( 'ItemGroup' ), Item: exp( 'Item' ), HStack: exp( 'HStack' ), VStack: exp( 'VStack' ),
		TGC: exp( 'ToggleGroupControl' ), TGO: exp( 'ToggleGroupControlOption' ),
		BoxControl: exp( 'BoxControl' ), UnitControl: exp( 'UnitControl' ), NumberControl: exp( 'NumberControl' ),
		ThemeProvider: wp.theme && wp.theme.ThemeProvider,
	} );
	const { Button, Card, CardBody, CardHeader, Notice, Dropdown, MenuGroup, MenuItem, FormToggle } = C;
	const { ItemGroup, Item, HStack, VStack } = AV;

	AV.BRAND = '#5646e5';
	AV.N = { __nextHasNoMarginBottom: true, __next40pxDefaultSize: true };
	AV.NM = { __nextHasNoMarginBottom: true };
	const ICONS = window.ATLASVOICE_ICONS;

	/* The block editor's own line icons (@wordpress/icons), 24px grid. */
	function I( { icon, size = 24, style } ) {
		if ( icon === 'circle' ) return h( 'svg', { viewBox: '0 0 24 24', width: size, height: size, style, 'aria-hidden': true }, h( 'circle', { cx: 12, cy: 12, r: 7, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 } ) );
		if ( icon === 'menu' ) return h( 'svg', { viewBox: '0 0 24 24', width: size, height: size, style, 'aria-hidden': true, fill: 'currentColor' }, h( 'path', { d: 'M5 5v1.5h14V5H5zm0 7.8h14v-1.5H5v1.5zM5 19h14v-1.5H5V19z' } ) );
		const d = ICONS[ icon ] || ICONS.help;
		return h( 'svg', { viewBox: d[ 0 ], width: size, height: size, style, fill: 'currentColor', 'aria-hidden': true, focusable: false },
			d[ 1 ].map( ( p, i ) => h( 'path', { key: i, d: p, fillRule: d[ 2 ] ? 'evenodd' : undefined, clipRule: d[ 2 ] ? 'evenodd' : undefined } ) ) );
	}
	AV.I = I;
	/* Player glyphs: the front-end player's own, not wp-admin icons. */
	AV.G = {
		play: 'M7 4.5v15l13-7.5z', pause: 'M6 4.5h4v15H6zM14 4.5h4v15h-4z', replay: 'M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z',
	};
	const Glyph = ( { g } ) => h( 'svg', { viewBox: '0 0 24 24', 'aria-hidden': true }, h( 'path', { d: AV.G[ g ] } ) );
	AV.Glyph = Glyph;

	/* ------------------------------------------------------------- context */
	AV.Ctx = createContext( null );
	const useApp = ( AV.useApp = () => useContext( AV.Ctx ) );

	/* ------------------------------------------------------------- helpers */
	AV.Chip = ( { tone, dot, children } ) => h( 'span', { className: 'atlasvoice-chip' + ( tone ? ' is-' + tone : '' ) }, dot && h( 'span', { className: 'atlasvoice-dot' } ), children );
	AV.Pro = () => h( 'span', { className: 'atlasvoice-pro' }, 'PRO' );
	AV.Count = ( { brand, children } ) => h( 'span', { className: 'atlasvoice-count' + ( brand ? ' is-brand' : '' ) }, children );
	AV.KV = ( { rows } ) => h( 'dl', { className: 'atlasvoice-kv' }, rows.map( ( [ k, v ], i ) => h( Fragment, { key: i }, h( 'dt', null, k ), h( 'dd', null, v ) ) ) );
	AV.H2 = ( { children } ) => h( 'h2', { className: 'atlasvoice-card-title' }, children );
	AV.Section = ( { title, desc, end, children } ) => h( 'section', { className: 'atlasvoice-section' },
		h( 'div', { className: 'atlasvoice-section-head' }, h( 'div', null, h( 'h2', null, title ), desc && h( 'p', null, desc ) ), end && h( 'div', { className: 'atlasvoice-section-end' }, end ) ), children );
	AV.Stats = ( { items } ) => h( Card, { size: 'small' }, h( 'div', { className: 'atlasvoice-stats', style: { '--atlasvoice-cols': items.length } },
		items.map( ( [ label, value, note, color ], i ) => h( 'div', { className: 'atlasvoice-stat', key: i }, h( 'span', null, label ), h( 'b', { style: color ? { color } : null }, value ), note && h( 'small', null, note ) ) ) ) );
	AV.Bars = ( { values, from, to } ) => h( Fragment, null,
		h( 'div', { className: 'atlasvoice-bars' }, values.map( ( v, i ) => h( 'i', { key: i, title: String( v ), style: { height: Math.max( 2, v ) + '%' } } ) ) ),
		h( 'div', { className: 'atlasvoice-bars-axis' }, h( 'span', null, from ), h( 'span', null, to ) ) );
	AV.HBars = ( { rows } ) => h( 'div', null, rows.map( ( [ l, v ] ) => h( 'div', { className: 'atlasvoice-hbar', key: l }, h( 'span', null, l ), h( 'span', { className: 'atlasvoice-meter' }, h( 'i', { style: { width: v + '%' } } ) ), h( 'b', null, v + '%' ) ) ) );
	AV.Empty = ( { title, children, action } ) => h( 'div', { className: 'atlasvoice-empty' }, h( 'b', null, title ), h( 'p', null, children ), action && h( 'div', { style: { marginTop: 12 } }, action ) );
	/* One-line pointer to a Pro feature: text and a link, never a disabled control. */
	AV.ProNote = ( { children } ) => {
		const { go } = useApp();
		return h( 'p', { className: 'atlasvoice-pronote' }, h( AV.Pro ), h( 'span', null, children ), h( Button, { variant: 'link', onClick: () => go( 'plans' ) }, 'See Pro' ) );
	};
	AV.copyText = ( notify, text, what ) => {
		try { navigator.clipboard && navigator.clipboard.writeText( text ); } catch ( e ) {}
		notify( what + ' copied.' );
	};
	AV.useDirty = ( value ) => {
		const [ base, setBase ] = useState( () => JSON.stringify( value ) );
		return [ JSON.stringify( value ) !== base, () => setBase( JSON.stringify( value ) ) ];
	};
	/* Sticky footer of a form pane: what changed, and the one Save button. */
	AV.SaveBar = ( { dirty, onSave, label, children } ) => h( 'div', { className: 'atlasvoice-footer' },
		h( 'span', { className: 'atlasvoice-footer-note' }, h( I, { icon: dirty ? 'pencil' : 'check', size: 20 } ), dirty ? 'Unsaved changes' : 'All changes saved' ),
		children,
		h( Button, { variant: 'primary', disabled: ! dirty, onClick: onSave }, label || 'Save' ) );
	AV.ext = ( notify, what ) => notify( 'In the plugin this opens ' + what + ' in a new tab.' );
	/* A labelled row inside a Card: title + help on the left, a control on the right. */
	AV.Row = ( { title, help, children } ) => h( Item, null, h( HStack, { alignment: 'center', wrap: true, spacing: 3 },
		h( VStack, { spacing: 0, style: { flex: 1, minWidth: 200 } }, h( 'b', { style: { fontWeight: 500 } }, title ), help && h( 'span', { className: 'atlasvoice-weak' }, help ) ),
		children && h( 'div', { style: { flex: 'none', maxWidth: '100%' } }, children ) ) );
	/* A ToggleControl row (label + help), the WordPress way. */
	AV.Toggle = ( { label, help, checked, onChange } ) => h( Item, null, h( C.ToggleControl, { ...AV.NM, label, help, checked, onChange } ) );
	AV.Tiles = ( { value, onChange, options, cols = 3, multi } ) => h( 'div', { className: 'atlasvoice-grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(' + ( cols === 2 ? 260 : 190 ) + 'px,1fr))' }, role: multi ? 'group' : 'radiogroup' },
		options.map( ( o ) => {
			const on = multi ? value.includes( o.id ) : value === o.id;
			return h( 'button', { key: o.id, className: 'atlasvoice-tile' + ( on ? ' is-on' : '' ), role: multi ? 'checkbox' : 'radio', 'aria-checked': on, onClick: () => onChange( multi ? ( on ? value.filter( ( x ) => x !== o.id ) : value.concat( o.id ) ) : o.id ) },
				o.icon && h( 'span', { className: 'atlasvoice-tile-icon' }, h( I, { icon: o.icon } ) ),
				h( 'span', { style: { flex: 1, minWidth: 0 } }, h( 'b', null, o.title, o.badge && h( Fragment, null, ' ', o.badge ) ), o.text && h( 'p', null, o.text ) ),
				on && h( I, { icon: 'check', style: { color: AV.BRAND, flex: 'none' } } ) );
		} ) );
	AV.TG = ( { label, hide, value, onChange, options } ) => h( 'div', { className: 'atlasvoice-scroll-x' }, h( AV.TGC, { ...AV.NM, __next40pxDefaultSize: true, isAdaptiveWidth: true, isBlock: false, label, hideLabelFromVision: hide, value, onChange },
		options.map( ( [ v, l ] ) => h( AV.TGO, { key: v, value: v, label: l } ) ) ) );

	/* Right-side drawer, the pattern of the AtlasMCP "Edit prompt" panel. */
	AV.Drawer = function Drawer( { title, kicker, onClose, children, footer, width } ) {
		const ref = useRef();
		useEffect( () => {
			ref.current && ref.current.focus();
			const k = ( e ) => { if ( e.key === 'Escape' && ! document.querySelector( '.components-modal__screen-overlay' ) ) onClose(); };
			document.addEventListener( 'keydown', k );
			return () => document.removeEventListener( 'keydown', k );
		}, [] );
		return h( Fragment, null,
			h( 'div', { className: 'atlasvoice-drawer-backdrop', onClick: onClose, 'aria-hidden': true } ),
			h( 'aside', { className: 'atlasvoice-drawer', role: 'dialog', 'aria-modal': true, 'aria-label': title, tabIndex: -1, ref, style: width ? { '--atlasvoice-drawer-w': width + 'px' } : null },
				h( 'div', { className: 'atlasvoice-drawer-head' },
					h( 'div', { style: { flex: 1, minWidth: 0 } }, kicker && h( 'div', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, kicker ), h( 'h2', null, title ) ),
					h( Button, { icon: h( I, { icon: 'close' } ), label: 'Close', onClick: onClose } ) ),
				h( 'div', { className: 'atlasvoice-drawer-body' }, children ),
				footer && h( 'div', { className: 'atlasvoice-footer' }, footer ) ) );
	};
	AV.DS = ( { title, end, children } ) => h( 'div', { className: 'atlasvoice-drawer-section' }, title && h( 'div', { className: 'atlasvoice-drawer-sechead' }, h( 'h3', null, title ), end ), children );

	/* Main pane with optional real TabPanel tabs and a footer. */
	AV.Pane = function Pane( { tabs, tab, setTab, tabsEnd, canvas, footer, top, children } ) {
		return h( 'section', { className: 'atlasvoice-main' + ( canvas ? ' is-canvas' : '' ) },
			top,
			tabs && h( 'div', { className: 'atlasvoice-tabs' },
				h( 'div', { className: 'atlasvoice-tabs-scroll' }, h( C.TabPanel, { tabs: tabs.map( ( [ name, title ] ) => ( { name, title } ) ), initialTabName: tab, onSelect: setTab, key: tabs.map( ( t ) => t[ 0 ] ).join() + tab }, () => null ) ),
				tabsEnd && h( 'div', { className: 'atlasvoice-tabs-end' }, tabsEnd ) ),
			children,
			footer );
	};
	AV.Scroll = ( { pad = true, width, children } ) => h( 'div', { className: 'atlasvoice-scroll' }, pad ? h( 'div', { className: 'atlasvoice-pad', style: width ? { maxWidth: width } : null }, children ) : children );
	AV.Table = ( { head, children, label } ) => h( 'div', { className: 'atlasvoice-table-wrap', tabIndex: 0, role: 'region', 'aria-label': label || 'Table' }, h( 'table', { className: 'atlasvoice-table' }, h( 'thead', null, h( 'tr', null, head.map( ( t, i ) => h( 'th', { key: i, style: t && t.w ? { width: t.w } : null }, t && t.l !== undefined ? t.l : t ) ) ) ), h( 'tbody', null, children ) ) );
	/* Mockup-only switch row (states you could not otherwise see). Yellow, labelled. */
	AV.MockBar = ( { label, value, onChange, options } ) => h( 'div', { className: 'atlasvoice-mockbar' }, h( 'b', null, 'Mockup only: ' + label ),
		options.map( ( [ v, l ] ) => h( Button, { key: v, size: 'small', variant: v === value ? 'primary' : 'secondary', onClick: () => onChange( v ) }, l ) ) );

	/* ------------------------------------------------------------- data */
	/* Audio Jobs (TTS-354): one server-side job per post + language + voice + text.
	   st: Ready | Outdated | Missing | Failed | Making. Making carries part / total. */
	const L = ( l, st, o = {} ) => ( { l, st, src: 'Page area rule', dur: '', made: '', part: 0, total: 0, reason: '', ...o } );
	AV.POSTS = [
		{ id: 120, title: 'How we restored the old mill', type: 'Post', chars: 6210, langs: [ L( 'EN', 'Outdated', { dur: '4:05', made: '21 Oct' } ), L( 'ES', 'Ready', { dur: '4:22', made: '22 Oct', src: 'Last spoken text' } ) ], plays: 412, done: 52, dl: 38 },
		{ id: 121, title: 'Ten walks along the river', type: 'Post', chars: 9880, langs: [ L( 'EN', 'Ready', { dur: '6:12', made: '12 Oct' } ), L( 'ES', 'Missing' ) ], plays: 288, done: 41, dl: 21 },
		{ id: 122, title: 'Bread from the old mill flour', type: 'Recipe', chars: 18513, langs: [ L( 'EN', 'Making', { part: 9, total: 14, src: 'Custom text', reason: 'Started by a visitor 2 min ago' } ), L( 'ES', 'Ready', { dur: '9:40', made: '20 Oct' } ) ], plays: 154, done: 35, dl: 9 },
		{ id: 123, title: 'Visiting hours and prices', type: 'Page', chars: 3120, langs: [ L( 'EN', 'Outdated', { dur: '1:48', made: '9 Oct', src: 'Not checked' } ) ], plays: 96, done: 28, dl: 4 },
		{ id: 124, title: 'Volunteer day: what to bring', type: 'Post', chars: 4402, langs: [ L( 'EN', 'Missing', { src: 'Not checked' } ), L( 'ES', 'Missing', { src: 'Not checked' } ) ], plays: 0, done: 0, dl: 0 },
		{ id: 125, title: 'Spring newsletter', type: 'Post', chars: 7744, langs: [ L( 'EN', 'Failed', { part: 3, total: 6, reason: 'The voice provider has no credit left. Parts 1–3 are kept; only the rest will be made.' } ) ], plays: 0, done: 0, dl: 0 },
		{ id: 126, title: 'The history of the weir', type: 'Post', chars: 7744, langs: [ L( 'EN', 'Ready', { dur: '5:31', made: '3 Oct' } ), L( 'ES', 'Outdated', { dur: '5:58', made: '3 Oct' } ) ], plays: 201, done: 63, dl: 17 },
	];
	AV.freshPosts = () => AV.POSTS.map( ( p ) => ( { ...p, langs: p.langs.map( ( l ) => L( l.l, 'Missing', { src: 'Not checked' } ) ) } ) );
	AV.JOB_TONE = { Ready: 'ok', Outdated: 'warn', Missing: '', Failed: 'err', Making: 'info' };
	AV.jobLabel = ( l ) => ( l.st === 'Making' ? ( l.part ? 'Making · ' + l.part + ' of ' + l.total : 'Waiting in the queue' ) : l.st === 'Failed' ? 'Failed' : l.st );
	AV.JobChip = ( { l } ) => h( AV.Chip, { tone: AV.JOB_TONE[ l.st ], dot: true }, AV.jobLabel( l ) );
	AV.partsOf = ( chars ) => Math.max( 1, Math.ceil( chars / 1400 ) );
	/* Characters and cost of a set of jobs, in the words the owner pays in. */
	AV.estimate = ( ctx, chars ) => {
		if ( ctx.engine === 'own' ) return [ '~$' + ( chars * 15 / 1e6 ).toFixed( 2 ), 'OpenAI tts-1, billed by OpenAI' ];
		if ( ctx.engine === 'cloud' ) return [ 'Included', 'AtlasVoice Cloud, in your Pro licence' ];
		return ctx.free ? [ chars.toLocaleString( 'en' ) + ' of your allowance', '100,000 characters a month free' ] : [ 'Included', 'Natural voice, unlimited with Pro' ];
	};
	AV.VOICES = {
		atlas: [ [ 'Natural voices', 'AtlasVoice TTS, saved as MP3.', [ [ 'bf_emma', 'Emma', 'Warm · British' ], [ 'bm_george', 'George', 'Steady · British' ], [ 'bf_isabella', 'Isabella', 'Bright · British' ], [ 'bm_lewis', 'Lewis', 'Relaxed · British' ] ] ] ],
		browser: [ [ 'Depends on the visitor’s device', 'Each browser has its own voices. These are on Chrome for Windows.', [ [ 'gb', 'Google UK English Female', 'Chrome' ], [ 'ms', 'Microsoft Sonia Online', 'Edge' ], [ 'dn', 'Daniel', 'Safari' ] ] ] ],
		cloud: [ [ 'Natural', 'Recommended. The most human-sounding.', [ [ 'sarah', 'Sarah', 'Warm' ], [ 'james', 'James', 'Calm' ], [ 'lily', 'Lily', 'Bright' ], [ 'robert', 'Robert', 'Deep' ] ] ], [ 'Fast', 'Ready in seconds. Good for long archives.', [ [ 'amy', 'Amy', 'Clear' ], [ 'ryan', 'Ryan', 'Neutral' ] ] ], [ 'Higher quality', 'Slower to make. Best for short, important posts.', [ [ 'heart', 'Heart', 'Expressive' ] ] ] ],
		own: [ [ 'Google Cloud', 'Billed by Google. Word-by-word read-along.', [ [ 'w1', 'en-GB-Wavenet-A', 'WaveNet' ], [ 'w2', 'en-GB-Neural2-B', 'Neural2' ] ] ], [ 'ElevenLabs', 'Billed by ElevenLabs.', [ [ 'rachel', 'Rachel', 'Multilingual v2' ] ] ] ],
	};
	AV.ENGINES = { atlas: 'Natural voice', browser: 'Browser voice', cloud: 'AtlasVoice Cloud', own: 'Your own provider' };
	AV.voiceName = ( id ) => { for ( const k in AV.VOICES ) for ( const g of AV.VOICES[ k ] ) for ( const v of g[ 2 ] ) if ( v[ 0 ] === id ) return v[ 1 ]; return 'Emma'; };
	AV.PRESETS = [ [ 'classic', 'Classic teal', '#184c53', '#ffffff' ], [ 'indigo', 'Indigo', '#5646e5', '#ffffff' ], [ 'ink', 'Ink', '#1e1e1e', '#ffffff' ], [ 'paper', 'Paper', '#f2f0ea', '#1f2328' ], [ 'theme', 'Match my theme', '#2b6cb0', '#ffffff' ] ];
	AV.AI_TXT = 'This article is read by an AI-generated voice.';

	/* ---------------------------------------------- front-end player family */
	const H = [ 38, 62, 48, 80, 55, 90, 70, 44, 66, 84, 52, 73, 95, 60, 42, 77, 58, 88, 49, 68, 81, 57, 46, 92, 63, 71, 50, 86, 59, 40, 75, 65, 83, 54, 47, 79, 61, 91, 53, 69 ];
	const Wave = ( { played, n = 40 } ) => h( 'div', { className: 'atlasvoice-player-wave', role: 'slider', 'aria-label': 'Seek', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round( 100 * played / n ) },
		Array.from( { length: n }, ( _, i ) => h( 'i', { key: i, className: i < played ? 'is-played' : '', style: { height: H[ i % H.length ] + '%' } } ) ) );
	/* form: button | bar | dock. state: idle playing paused ended blocked generating progressive failed quota */
	AV.Player = function Player( { form = 'bar', state = 'idle', look = {}, voice = 'Emma · Natural voice', staging, ai, credit, lang, download = true, onAct } ) {
		const st = { '--p-bg': look.bg || '#184c53', '--p-fg': look.fg || '#fff', '--p-radius': { square: '4px', pill: '999px' }[ look.shape ] || '12px', '--p-h': { s: '44px', l: '60px' }[ look.size ] || '52px' };
		const act = ( what ) => onAct && onAct( what );
		const note = ai && ai.on && h( 'div', { className: 'atlasvoice-player-note' }, h( I, { icon: 'info' } ), ai.text || AV.AI_TXT );
		const adm = staging && h( 'div', { className: 'atlasvoice-player-admin', role: 'note' }, h( 'b', null, 'Staging.' ), 'Only you can see this player. Visitors see it after you go live.' );
		const wrap = ( inner ) => h( 'div', { className: 'atlasvoice-player' + ( form === 'button' || look.width === 'auto' ? ' is-auto' : '' ), style: st },
			ai && ai.pos === 'before' && note, inner, ai && ai.pos !== 'before' && note, adm, credit && h( 'div', { className: 'atlasvoice-player-credit' }, 'Voiced by AtlasVoice' ) );
		if ( state === 'quota' ) {
			return h( 'div', { className: 'atlasvoice-player is-auto', style: st },
				h( 'button', { className: 'atlasvoice-player-btn', onClick: () => act( 'play' ) }, h( 'span', { className: 'atlasvoice-player-icon' }, h( Glyph, { g: 'play' } ) ), 'Listen ', h( 'small', null, '4 min' ) ),
				h( 'div', { className: 'atlasvoice-player-admin', style: { background: '#fcf0f1', borderColor: '#f3a59d', color: '#7a1d16' } }, h( 'b', null, 'Admins only.' ), 'This month’s natural-voice characters are used up, so this post uses the browser voice until 1 November.' ) );
		}
		/* Audio Jobs: visitors never see a technical error; they get the device voice.
		   The reason is shown to editors only. */
		if ( state === 'fallback' || state === 'limit' ) {
			return h( 'div', { className: 'atlasvoice-player is-auto', style: st },
				h( 'button', { className: 'atlasvoice-player-btn', onClick: () => act( 'play' ) }, h( 'span', { className: 'atlasvoice-player-icon' }, h( Glyph, { g: 'play' } ) ), 'Listen with your device’s voice' ),
				h( 'div', { className: 'atlasvoice-player-admin' }, h( 'b', null, 'Editors only.' ), state === 'limit' ? 'Today’s character limit is reached. New audio waits until tomorrow or until you raise the limit; posts with audio play as usual.' : 'This audio could not be made right now: the voice provider has no credit. The reason is in the editor and the Audio library.' ) );
		}
		if ( form === 'button' ) {
			const lab = { playing: 'Pause', paused: 'Resume', ended: 'Replay', blocked: 'Tap again to listen' }[ state ] || 'Listen';
			const g = state === 'playing' ? 'pause' : state === 'ended' ? 'replay' : 'play';
			return wrap( h( Fragment, null,
				h( 'button', { className: 'atlasvoice-player-btn', 'aria-label': lab + ' this article', onClick: () => act( state === 'playing' ? 'pause' : 'play' ) }, h( 'span', { className: 'atlasvoice-player-icon' }, h( Glyph, { g } ) ), lab, state === 'idle' && h( 'small', null, ' 4 min' ), ( state === 'playing' || state === 'paused' ) && h( 'small', null, ' 1:24' ) ),
				state === 'blocked' && h( 'div', { className: 'atlasvoice-player-note' }, h( I, { icon: 'info' } ), 'Your phone needs one more tap to start the voice.' ) ) );
		}
		if ( form === 'dock' ) {
			return h( 'div', { className: 'atlasvoice-player-dock', style: st },
				h( 'button', { className: 'atlasvoice-player-play', 'aria-label': 'Pause', onClick: () => act( 'pause' ) }, h( Glyph, { g: 'pause' } ) ), h( Wave, { played: 12, n: 24 } ),
				h( 'span', { className: 'atlasvoice-player-time' }, '1:24' ), h( 'span', { className: 'atlasvoice-player-tools' }, h( 'button', { 'aria-label': 'Back to the player in the article', onClick: () => act( 'undock' ) }, h( I, { icon: 'close' } ) ) ) );
		}
		let play, mid, tools;
		if ( state === 'generating' ) {
			play = h( 'button', { className: 'atlasvoice-player-play', disabled: true, 'aria-label': 'Preparing audio' }, h( 'span', { className: 'atlasvoice-spin' } ) );
			mid = h( 'div', { className: 'atlasvoice-player-mid' }, h( 'div', { className: 'atlasvoice-player-title', role: 'status' }, 'Making the audio on the server · part 2 of 5' ), h( 'div', { className: 'atlasvoice-player-meter' }, h( 'span' ) ) );
			tools = h( 'span', { className: 'atlasvoice-player-time' }, '40%' );
		} else if ( state === 'failed' ) {
			play = h( 'button', { className: 'atlasvoice-player-play', disabled: true, 'aria-label': 'Play' }, h( Glyph, { g: 'play' } ) );
			mid = h( 'div', { className: 'atlasvoice-player-mid' }, h( 'div', { className: 'atlasvoice-player-fail', role: 'alert' }, h( I, { icon: 'caution', size: 18 } ), 'This audio could not be made right now.' ) );
			tools = h( 'span', { className: 'atlasvoice-player-tools' }, h( 'button', { onClick: () => act( 'retry' ) }, 'Try again' ) );
		} else {
			const playing = state === 'playing' || state === 'progressive';
			const pl = { playing: 14, paused: 14, progressive: 5, ended: 40, joined: 0 }[ state ] || 0;
			const status = { progressive: 'Getting the audio ready · part 6 of 14. The first part is playing now.', joined: 'This audio is being prepared · part 9 of 14. You can start with the first parts now.' }[ state ];
			play = h( 'button', { className: 'atlasvoice-player-play', 'aria-label': playing ? 'Pause' : 'Play', onClick: () => act( playing ? 'pause' : 'play' ) }, h( Glyph, { g: playing ? 'pause' : state === 'ended' ? 'replay' : 'play' } ) );
			mid = h( 'div', { className: 'atlasvoice-player-mid' },
				status ? h( 'div', { className: 'atlasvoice-player-title', role: 'status' }, status ) : h( 'div', { className: 'atlasvoice-player-title' }, 'Listen to this article ', h( 'span', { style: { fontWeight: 400 } }, '· ' + voice ) ),
				h( Wave, { played: pl } ) );
			tools = h( 'span', { className: 'atlasvoice-player-tools' },
				h( 'span', { className: 'atlasvoice-player-time' }, { idle: '4:05', playing: '1:24 / 4:05', paused: '1:24 / 4:05', progressive: '0:31', ended: '4:05', joined: 'ready soon', outdated: '4:05' }[ state ] ),
				h( 'button', { 'aria-label': 'Playback speed 1 times', onClick: () => act( 'speed' ) }, '1×' ),
				download && state !== 'progressive' && h( 'button', { 'aria-label': 'Download MP3', onClick: () => act( 'download' ) }, h( I, { icon: 'download' } ) ),
				lang && h( 'button', { 'aria-label': 'Language: English', onClick: () => act( 'lang' ) }, 'EN' ) );
		}
		const bar = h( 'div', { className: 'atlasvoice-player-bar' }, play, mid, tools );
		if ( state === 'outdated' ) {
			return wrap( h( Fragment, null, bar, h( 'div', { className: 'atlasvoice-player-admin' }, h( 'b', null, 'Editors only.' ), 'Visitors hear the version from 21 Oct; the text changed since. ', h( 'button', { type: 'button', onClick: () => act( 'remake' ), style: { border: 0, background: 'none', padding: 0, font: 'inherit', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' } }, 'Remake now (~6,200 characters)' ) ) ) );
		}
		return wrap( bar );
	};
	/* The small listener-settings panel the browser-voice gear opens (TTS-296). */
	AV.PlayerPop = () => h( 'div', { className: 'atlasvoice-player-pop', role: 'dialog', 'aria-label': 'Player settings' },
		h( 'b', null, 'Player settings' ),
		h( C.SelectControl, { ...AV.N, label: 'Language', value: 'en-GB', options: [ { label: 'English (United Kingdom)', value: 'en-GB' } ], onChange: () => {} } ),
		h( C.SelectControl, { ...AV.N, label: 'Voice', value: 'gb', options: [ { label: 'Google UK English Female', value: 'gb' } ], onChange: () => {} } ),
		h( C.RangeControl, { ...AV.NM, label: 'Speed', value: 1.25, min: 0.5, max: 2, step: 0.25, onChange: () => {} } ),
		h( C.RangeControl, { ...AV.NM, label: 'Volume', value: 80, min: 0, max: 100, onChange: () => {} } ) );
	AV.Site = ( { children, dark, phone, url = 'yoursite.com/old-mill' } ) => h( 'div', { className: 'atlasvoice-site' + ( phone ? ' is-phone' : '' ) },
		h( 'div', { className: 'atlasvoice-site-bar' }, h( 'i' ), h( 'i' ), h( 'i' ), h( 'span', null, url ) ),
		h( 'div', { className: 'atlasvoice-site-page' + ( dark ? ' is-dark' : '' ) }, h( 'h3', null, 'How we restored the old mill' ), h( 'span', { className: 'atlasvoice-site-meta' }, 'By Rahima · 6 min read' ), children,
			h( 'p', null, 'The wheel had not turned since 1962. When we opened the doors, the smell of flour and damp oak was still there.' ) ) );

	/* Characters this month (AtlasVoice service). */
	AV.usageOf = ( ctx ) => {
		const cloud = ! ctx.free && ctx.engine === 'cloud';
		const total = cloud ? 2000000 : 100000;
		const pct = cloud ? Math.round( ctx.usage / 6 ) : ctx.usage;
		return { cloud, total, pct, used: Math.round( total * pct / 100 ), name: cloud ? 'AtlasVoice Cloud' : 'Natural voice' };
	};
	AV.Usage = ( { label } ) => {
		const ctx = useApp();
		const u = AV.usageOf( ctx );
		const tone = u.pct >= 95 ? 'is-bad' : u.pct >= 80 ? 'is-warn' : '';
		const line = u.pct >= 95 ? 'New audio stops on about 27 Oct. Audio already made keeps playing.' : u.pct >= 80 ? 'At this pace you run out on about 29 Oct.' : 'Resets on 1 November. Audio already made never counts again.';
		return h( 'div', { className: 'atlasvoice-usage ' + tone },
			h( 'div', { className: 'atlasvoice-usage-row' }, h( 'span', null, label || u.name + ' this month' ), h( 'b', null, u.used.toLocaleString( 'en' ) + ' / ' + u.total.toLocaleString( 'en' ) ) ),
			h( 'span', { className: 'atlasvoice-meter' }, h( 'i', { style: { width: Math.max( u.pct, 1 ) + '%' } } ) ),
			h( 'span', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, line + ( u.pct >= 80 ? ' (' + u.pct + '% used)' : '' ) ) );
	};

	/* Things that need the owner: one list for Overview, Health, the bell. */
	AV.issues = ( ctx ) => {
		const l = [];
		if ( ctx.mode === 'staging' ) l.push( [ 'warn', 'Visitors can’t hear your audio yet', 'You are in staging. Only logged-in admins see the player.', 'Go live…', () => ctx.askMode( 'live' ) ] );
		if ( ctx.engine === 'browser' && ctx.free ) l.push( [ 'info', 'A natural voice is now free', 'The browser voice changes from device to device. The natural voice sounds the same everywhere, with 100,000 characters a month free.', 'Hear it first', () => ctx.go( 'voice:voice' ) ] );
		if ( ctx.scn === 'bad' ) {
			l.push( [ 'err', 'Some visitors can’t load the player', 'Cloudflare is blocking 2 AtlasVoice scripts because a header is missing. Seen on 14 visits today.', 'Show me how', () => ctx.go( 'health:cors' ) ] );
			if ( AV.usageOf( ctx ).pct >= 95 && ctx.engine !== 'browser' ) l.push( [ 'err', ( 100 - AV.usageOf( ctx ).pct ) + '% of this month’s characters left', 'New audio stops on about 27 October. Audio already made keeps playing.', 'See usage', () => ctx.go( 'account' ) ] );
			if ( ! ctx.free ) l.push( [ 'warn', 'Español has no voice', 'Polylang added Español. Posts in Español are read with the English voice.', 'Choose a voice', () => ctx.go( 'languages' ) ] );
		}
		return l;
	};

	/* ================================================================ shell */
	AV.SCREENS = [
		[ 'overview', 'Overview' ], [ 'setup', 'Set up AtlasVoice' ], [ 'voice', 'Voice' ], [ 'pronunciation', 'Pronunciation' ], [ 'languages', 'Languages' ], [ 'providers', 'Your own provider' ], [ 'account', 'AtlasVoice account' ],
		[ 'player', 'Player' ], [ 'content', 'What is read' ], [ 'library', 'Audio library' ], [ 'insights', 'Insights' ], [ 'seo', 'SEO & AI Search' ],
		[ 'health', 'Health' ], [ 'versions', 'Versions' ], [ 'advanced', 'Advanced' ], [ 'privacy', 'Privacy' ], [ 'plans', 'Plans & pricing' ], [ 'licence', 'Licence & account' ], [ 'docs', 'Documentation' ], [ 'more', 'More plugins' ],
	];
	AV.TITLES = Object.fromEntries( AV.SCREENS );

	AV.Rail = function Rail( { open, setOpen } ) {
		const ctx = useApp();
		const { screen, go, free, setup, setupSteps, notify } = ctx;
		const bad = AV.issues( ctx ).filter( ( x ) => x[ 0 ] === 'err' ).length;
		const NAV = [
			{ items: [ [ 'overview', 'Overview', 'home' ], ! setup.finished && [ 'setup', 'Setup', 'check', { count: setup.done.length + '/' + setupSteps.length } ] ].filter( Boolean ) },
			{ group: 'Voice', items: [ [ 'voice', 'Voice', 'audio' ], [ 'pronunciation', 'Pronunciation', 'paragraph' ], [ 'languages', 'Languages', 'language' ], [ 'providers', 'Your own provider', 'key' ], [ 'account', 'AtlasVoice account', 'cloud' ] ] },
			{ group: 'On your site', items: [ [ 'player', 'Player', 'styles' ], [ 'content', 'What is read', 'post-content' ], [ 'library', 'Audio library', 'media', { count: ctx.engine === 'browser' ? null : ( ctx.scn === 'new' ? '0' : '214' ) } ] ] },
			{ group: 'Results', items: [ [ 'insights', 'Insights', 'chart-bar' ], [ 'seo', 'SEO & AI Search', 'globe', { pro: true } ] ] },
			{ group: 'Site health', items: [ [ 'health', 'Health', 'shield', { count: bad ? String( bad ) : null, tone: 'err' } ], [ 'versions', 'Versions', 'backup' ], [ 'advanced', 'Advanced', 'cog' ], [ 'privacy', 'Privacy', 'lock' ] ] },
			{ group: 'Help', items: [ ! free && [ 'licence', 'Licence & account', 'receipt' ], [ 'plans', free ? 'Plans & pricing' : 'Plans', 'currency-dollar' ], [ 'docs', 'Documentation', 'page' ], [ 'more', 'More plugins', 'plugins' ] ].filter( Boolean ) },
		];
		return h( Fragment, null,
			open && h( 'div', { className: 'atlasvoice-rail-backdrop', onClick: () => setOpen( false ) } ),
			h( 'aside', { className: 'atlasvoice-rail' + ( open ? ' is-open' : '' ) },
				h( 'div', { className: 'atlasvoice-rail-brand' },
					h( 'span', { className: 'atlasvoice-logo', style: { background: AV.BRAND } }, h( 'svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' }, h( 'path', { d: 'M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4' } ) ) ),
					h( 'div', { className: 'atlasvoice-rail-label' }, h( 'b', null, 'AtlasVoice', ! free && h( Fragment, null, ' ', h( AV.Pro ) ) ), h( 'small', null, free ? 'Free 2.5.0' : '2.5.0 · Pro 3.6.0' ) ),
					open && h( Button, { className: 'atlasvoice-rail-close', icon: h( I, { icon: 'close' } ), label: 'Close menu', onClick: () => setOpen( false ) } ) ),
				h( 'nav', { className: 'atlasvoice-rail-nav', 'aria-label': 'AtlasVoice' },
					NAV.map( ( g, gi ) => h( Fragment, { key: gi },
						g.group && h( 'div', { className: 'atlasvoice-rail-group' }, h( 'span', { className: 'atlasvoice-rail-label' }, g.group ) ),
						g.items.map( ( [ id, label, icon, o = {} ] ) => h( Button, {
							key: id, className: 'atlasvoice-rail-item' + ( screen === id ? ' is-current' : '' ), title: label,
							'aria-current': screen === id ? 'page' : undefined,
							onClick: () => { go( id ); setOpen( false ); },
						},
						h( I, { icon } ), h( 'span', { className: 'atlasvoice-rail-label' }, label ),
						h( 'span', { className: 'atlasvoice-rail-end atlasvoice-rail-label' },
							o.count && h( AV.Count, { brand: o.tone !== 'err' }, o.count ),
							o.pro && free && h( AV.Pro ) ) ) ) ) ) ),
				h( 'div', { className: 'atlasvoice-rail-foot atlasvoice-rail-label' },
					free
						? h( Fragment, null, h( 'span', { className: 'atlasvoice-weak' }, 'Free plan' ), h( Button, { variant: 'link', onClick: () => go( 'plans' ) }, 'Compare plans' ) )
						: h( Fragment, null, h( AV.Chip, { tone: ctx.lic === 'active' ? 'ok' : 'warn', dot: true }, ctx.lic === 'active' ? 'Licensed' : ctx.lic === 'expired' ? 'Expired' : 'Not activated' ), h( 'span', { className: 'atlasvoice-weak' }, '5 sites, renews Mar 2027' ) ) ) ) );
	};

	/* Settings index: new names plus the old screen labels, so people who
	   know the old screens still find everything. */
	AV.IDX = [
		[ 'Voice engine (which player)', 'voice:voice', 'Voice', 'Select Player' ], [ 'Voice and language', 'voice:voice', 'Voice', 'Voice Language, Voice to speak' ], [ 'Speed, pitch and volume', 'voice:voice', 'Voice', 'Voice Speed / Pitch / Volume' ],
		[ 'Pronunciation (word replacements)', 'pronunciation', 'Pronunciation', 'Aliases' ], [ 'A voice per language', 'languages', 'Languages', 'Language Mapping' ], [ 'Check a page’s language', 'languages', 'Languages', 'Language diagnostics' ],
		[ 'Google Cloud, OpenAI, ElevenLabs keys', 'providers', 'Your own provider', 'Integrations' ], [ 'Keep a copy in Google Cloud Storage', 'providers', 'Your own provider', 'Store MP3 Files To Google Cloud Storage' ],
		[ 'Characters left this month', 'account', 'AtlasVoice account', 'AtlasVoice TTS usage' ],
		[ 'Player colours and style', 'player:look', 'Player, Look', 'Background Color, Text Color' ], [ 'Hover colours, border, text size', 'player:look', 'Player, Look', 'Hover BG Color, Border, Font Size' ], [ 'Space around the player', 'player:look', 'Player, Look', 'Margin Size (Px)' ],
		[ 'Where the player sits', 'player:place', 'Player, Placement', 'Select Button Position' ], [ 'While scrolling (docked player)', 'player:place', 'Player, Placement', 'Floating Position' ], [ 'Who sees the player', 'player:place', 'Player, Placement', 'Display Player To' ], [ 'Allow MP3 download', 'player:place', 'Player, Placement', 'Who Can Download MP3 File' ],
		[ 'Listen, Pause, Resume, Replay words', 'player:words', 'Player, Buttons & words', 'Button Texts & Icons' ], [ 'Highlight while reading', 'player:read', 'Player, Read-along', 'Highlight' ], [ 'Listen to selected text', 'player:read', 'Player, Read-along', 'Listen to selected text' ], [ 'AI voice notice', 'player:ai', 'Player, AI notice', '' ], [ 'Shortcode, block and Elementor widget', 'player:embed', 'Player, Shortcode & block', 'Short Code' ],
		[ 'Content types with a player', 'content:where', 'What is read, Where it appears', 'Allow Listening For Post Type' ], [ 'Skip categories, tags or posts', 'content:where', 'What is read, Where it appears', 'Exclude Categories / Tags / Posts By IDs' ], [ 'Read the title or excerpt', 'content:text', 'What is read, Text to read', 'Add Post Title / Excerpt To Read' ], [ 'Text before and after the post', 'content:text', 'What is read, Text to read', 'Add Text Before / After Content' ], [ 'Custom fields (ACF)', 'content:text', 'What is read, Text to read', 'Add ACF Fields To Posts' ], [ 'Which part of the page is read', 'content:areas', 'What is read, Page areas', 'Include Content By CSS Selectors' ],
		[ 'Make audio ahead of time', 'library', 'Audio library', 'Bulk MP3 Generate' ], [ 'When audio is made', 'library:settings', 'Audio library, Settings', 'Generate MP3 on publish' ], [ 'Daily character limit', 'library:settings', 'Audio library, Settings', '' ], [ 'When a post’s text changes', 'library:settings', 'Audio library, Settings', 'Regenerate MP3' ], [ 'Background work (Action Scheduler, WP-Cron)', 'library:settings', 'Audio library, Settings', '' ], [ 'Failed or outdated audio', 'library', 'Audio library', 'MP3 status' ], [ 'Delete unused audio files', 'library:clean', 'Audio library, Clean up', 'Maintenance', true ],
		[ 'Count plays', 'insights:tracking', 'Insights, Tracking', 'Analytics on/off' ], [ 'Listener country', 'insights:tracking', 'Insights, Tracking', 'Show listener location' ], [ 'Email report', 'insights', 'Insights', 'Schedule Report', true ],
		[ 'Audio structured data', 'seo', 'SEO & AI Search', 'SEO & AI Search', true ], [ 'Roll back to an earlier version', 'versions', 'Versions', 'Versions' ], [ 'Plugins we work with', 'health', 'Health', 'Compatibility' ], [ 'Toolbar items and dashboard widget', 'advanced', 'Advanced', 'Show Staging / Live indicator' ], [ 'Delete all data when deleting the plugin', 'advanced', 'Advanced', 'Delete all data on uninstall' ], [ 'Run the setup wizard again', 'advanced', 'Advanced', 'Run Setup Wizard' ], [ 'Clear listening statistics', 'privacy', 'Privacy', '' ],
	];
	AV.Search = function Search( { compact } ) {
		const ctx = useApp();
		const { go, free } = ctx;
		const [ q, setQ ] = useState( '' );
		const [ open, setOpen ] = useState( false );
		const [ active, setActive ] = useState( 0 );
		const [ expanded, setExpanded ] = useState( false );
		const input = useRef();
		const focus = () => { setExpanded( true ); setOpen( true ); setTimeout( () => input.current && input.current.focus(), 0 ); };
		useEffect( () => {
			const onKey = ( e ) => {
				if ( ( e.ctrlKey || e.metaKey ) && e.key.toLowerCase() === 'k' ) { e.preventDefault(); focus(); }
				const tag = document.activeElement && document.activeElement.tagName;
				if ( e.key === '/' && ! [ 'INPUT', 'TEXTAREA', 'SELECT' ].includes( tag ) && ! document.activeElement.isContentEditable ) { e.preventDefault(); focus(); }
			};
			document.addEventListener( 'keydown', onKey );
			return () => document.removeEventListener( 'keydown', onKey );
		}, [] );
		const s = q.trim().toLowerCase();
		const m = ( t ) => ! s || t.toLowerCase().includes( s );
		const scr = AV.SCREENS.filter( ( [ id ] ) => ! ( free && id === 'licence' ) && ! ( ctx.setup.finished && id === 'setup' ) );
		const actions = [ [ ctx.mode === 'live' ? 'Back to staging' : 'Go live', () => ctx.askMode( ctx.mode === 'live' ? 'staging' : 'live' ) ], [ 'View as a visitor', () => ctx.setView( 'front' ) ], [ 'Pick what is read on a page', () => ctx.openPicker() ], [ 'Run the health check', () => go( 'health' ) ] ];
		const groups = [
			[ 'Screens', scr.filter( ( x ) => m( x[ 1 ] ) ).slice( 0, s ? 6 : 4 ).map( ( x ) => ( { label: x[ 1 ], meta: 'Screen', run: () => go( x[ 0 ] ) } ) ) ],
			[ 'Settings', s ? AV.IDX.filter( ( x ) => ! ( free && x[ 4 ] && x[ 1 ] !== 'seo' ) && ( m( x[ 0 ] ) || m( x[ 3 ] ) ) ).slice( 0, 6 ).map( ( x ) => ( { label: x[ 0 ], meta: x[ 2 ] + ( x[ 3 ] && s && x[ 3 ].toLowerCase().includes( s ) && ! x[ 0 ].toLowerCase().includes( s ) ? ' · was “' + x[ 3 ] + '”' : '' ), run: () => go( x[ 1 ] ) } ) ) : [] ],
			[ 'Actions', actions.filter( ( x ) => m( x[ 0 ] ) ).slice( 0, s ? 4 : 2 ).map( ( x ) => ( { label: x[ 0 ], meta: 'Action', run: x[ 1 ] } ) ) ],
		].filter( ( g ) => g[ 1 ].length );
		const flat = groups.flatMap( ( g ) => g[ 1 ] );
		const pick = ( r ) => { r.run(); setOpen( false ); setQ( '' ); setExpanded( false ); input.current && input.current.blur(); };
		let n = -1;
		if ( compact && ! expanded ) return h( Button, { icon: h( I, { icon: 'search' } ), label: 'Search (Ctrl K)', onClick: focus } );
		return h( 'div', { className: 'atlasvoice-search' + ( compact ? ' is-floating' : '' ) },
			h( 'div', { className: 'atlasvoice-search-box' },
				h( I, { icon: 'search', size: 20, style: { color: '#757575', flex: 'none' } } ),
				h( 'input', {
					ref: input, value: q, placeholder: 'Search screens, settings and actions', 'aria-label': 'Search AtlasVoice', role: 'combobox', 'aria-expanded': open, 'aria-controls': 'atlasvoice-search-results',
					onFocus: () => setOpen( true ), onBlur: () => setTimeout( () => { setOpen( false ); setExpanded( false ); }, 150 ),
					onChange: ( e ) => { setQ( e.target.value ); setActive( 0 ); setOpen( true ); },
					onKeyDown: ( e ) => {
						if ( e.key === 'ArrowDown' ) { e.preventDefault(); setActive( ( a ) => Math.min( a + 1, flat.length - 1 ) ); }
						if ( e.key === 'ArrowUp' ) { e.preventDefault(); setActive( ( a ) => Math.max( a - 1, 0 ) ); }
						if ( e.key === 'Enter' && flat[ active ] ) pick( flat[ active ] );
						if ( e.key === 'Escape' ) { setOpen( false ); e.target.blur(); }
					},
				} ),
				h( 'span', { className: 'atlasvoice-kbd' }, 'Ctrl K' ) ),
			open && h( 'div', { className: 'atlasvoice-search-results', role: 'listbox', id: 'atlasvoice-search-results' },
				flat.length ? groups.map( ( [ name, rows ] ) => h( Fragment, { key: name },
					h( 'div', { className: 'atlasvoice-search-group' }, name ),
					rows.map( ( r ) => { n++; const i = n; return h( 'button', { key: name + r.label, role: 'option', 'aria-selected': i === active, className: 'atlasvoice-search-hit' + ( i === active ? ' is-active' : '' ), onMouseDown: ( e ) => e.preventDefault(), onClick: () => pick( r ), onMouseEnter: () => setActive( i ) }, h( 'span', null, r.label ), h( 'small', null, r.meta ) ); } ) ) )
					: h( 'div', { className: 'atlasvoice-empty', style: { padding: 24 } }, 'Nothing matches “' + q + '”. Old setting names work too, for example “Aliases”.' ),
				h( 'div', { className: 'atlasvoice-search-foot' }, h( 'span', null, '↑↓ move' ), h( 'span', null, 'Enter open' ), h( 'span', null, 'Esc close' ), h( 'span', { className: 'atlasvoice-search-foot-end' }, 'Also in the WordPress command palette' ) ) ) );
	};

	AV.Header = function Header( { actions, chip, onMenu, narrow } ) {
		const ctx = useApp();
		const { screen, go, notices, setNotices, notify } = ctx;
		const drop = ( id ) => setNotices( notices.filter( ( n ) => n.id !== id ) );
		const NOTICE = {
			staging: ( n ) => h( Notice, { key: n.id, status: 'warning', onRemove: () => drop( n.id ), actions: [ { label: 'Go live…', variant: 'primary', onClick: () => ctx.askMode( 'live' ) } ] }, h( 'b', null, 'AtlasVoice is in staging. ' ), 'Visitors can’t hear your audio yet.' ),
			usage: ( n ) => h( Notice, { key: n.id, status: 'error', onRemove: () => drop( n.id ), actions: [ { label: 'See usage', onClick: () => go( 'account' ) } ] }, h( 'b', null, '4% of your characters left this month. ' ), 'New audio stops on about 27 October.' ),
			update: ( n ) => h( Notice, { key: n.id, status: 'info', onRemove: () => drop( n.id ), actions: [ { label: 'What’s new', onClick: () => ctx.modal( { title: 'What’s new in 2.5.0', body: h( 'ul', { className: 'atlasvoice-list' }, h( 'li', null, 'A new home for every setting, with search.' ), h( 'li', null, 'Audio starts in seconds: the first part plays while the rest is prepared.' ), h( 'li', null, 'Undo an update from Versions.' ) ), ok: 'Got it' } ) }, { label: 'Roll back', onClick: () => go( 'versions' ) } ] }, h( 'b', null, 'AtlasVoice updated to 2.5.0. ' ), 'If something stopped working, go back to 2.4.0.' ),
			lang: ( n ) => h( Notice, { key: n.id, status: 'info', onRemove: () => drop( n.id ), actions: [ { label: 'Download Spanish', onClick: () => { drop( n.id ); notify( 'Spanish downloaded. The AtlasVoice screens reload in Spanish.' ); } } ] }, 'AtlasVoice is available in Español. Downloads only when you click.' ),
			review: ( n ) => h( Notice, { key: n.id, status: 'success', onRemove: () => drop( n.id ), actions: [ { label: 'Leave a review', variant: 'primary', onClick: () => { drop( n.id ); AV.ext( notify, 'the WordPress.org review page' ); } }, { label: 'Not now', onClick: () => { drop( n.id ); notify( 'We’ll ask again in two weeks.' ); } } ] }, 'AtlasVoice has read your posts 1,000 times. A quick review helps other site owners find it.' ),
			other: ( n ) => h( Notice, { key: n.id, status: 'warning', onRemove: () => drop( n.id ) }, h( 'b', null, 'From another plugin: ' ), 'WP Rocket: one or more plugins have been enabled or disabled, clear the cache.' ),
		};
		return h( 'header', { className: 'atlasvoice-header' },
			h( 'div', { className: 'atlasvoice-header-title' },
				h( Button, { className: 'atlasvoice-menu-btn', icon: h( I, { icon: 'menu' } ), label: 'AtlasVoice menu', onClick: onMenu } ),
				h( 'h1', null, AV.TITLES[ screen ] ), chip ),
			h( 'div', { className: 'atlasvoice-header-search' }, h( AV.Search, { compact: narrow } ) ),
			h( 'div', { className: 'atlasvoice-header-end' },
				h( 'span', { className: 'atlasvoice-header-actions' }, actions ),
				h( Dropdown, {
					popoverProps: { placement: 'bottom-end' },
					renderToggle: ( { isOpen, onToggle } ) => h( Button, { icon: h( I, { icon: 'bell' } ), label: 'Notices', onClick: onToggle, 'aria-expanded': isOpen, showTooltip: true }, notices.length > 0 && h( AV.Count, { brand: true }, notices.length ) ),
					renderContent: () => h( 'div', { className: 'atlasvoice-notices' },
						notices.length ? h( VStack, { spacing: 2 }, notices.map( ( n ) => NOTICE[ n.id ]( n ) ),
							h( 'p', { className: 'atlasvoice-weak', style: { fontSize: 12, padding: '4px 4px 0' } }, 'On AtlasVoice screens, notices from WordPress and other plugins are moved here, never hidden.' ) )
							: h( AV.Empty, { title: 'No notices' }, 'You’re all caught up.' ) ),
				} ),
				h( Dropdown, {
					popoverProps: { placement: 'bottom-end' },
					renderToggle: ( { onToggle } ) => h( Button, { icon: h( I, { icon: 'help' } ), label: 'Help', onClick: onToggle, showTooltip: true } ),
					renderContent: ( { onClose } ) => h( MenuGroup, null,
						h( MenuItem, { onClick: () => { go( 'docs' ); onClose(); } }, 'Documentation' ),
						h( MenuItem, { info: 'Ctrl K, /, Esc', onClick: () => { onClose(); ctx.modal( { title: 'Keyboard shortcuts', body: h( AV.KV, { rows: [ [ 'Ctrl K or /', 'Search AtlasVoice' ], [ '↑ ↓ and Enter', 'Move through and open results' ], [ 'Esc', 'Close a panel or the search' ] ] } ), ok: 'Close' } ); } }, 'Keyboard shortcuts' ),
						h( MenuItem, { onClick: () => { onClose(); ctx.setView( 'front' ); } }, 'View as a visitor' ),
						h( MenuItem, { icon: h( I, { icon: 'external' } ), onClick: () => { onClose(); AV.ext( notify, 'the demo page with every voice' ); } }, 'Hear every voice (demo)' ),
						h( MenuItem, { icon: h( I, { icon: 'external' } ), onClick: () => { onClose(); AV.ext( notify, 'the contact form on atlasaidev.com' ); } }, 'Contact support' ) ),
				} ) ) );
	};

	AV.StatusBar = function StatusBar() {
		const ctx = useApp();
		const { mode, free, engine, voice, scn } = ctx;
		const u = AV.usageOf( ctx );
		const live = mode === 'live';
		return h( 'footer', { className: 'atlasvoice-status' },
			h( 'span', { className: 'atlasvoice-status-item', style: { color: live ? '#007f30' : '#926300' } }, h( 'span', { className: 'atlasvoice-dot' } ), live ? 'Live: visitors hear your posts' : 'Staging: only admins see the player' ),
			h( 'span', { className: 'atlasvoice-status-item atlasvoice-hide-sm' }, AV.voiceName( voice ) + ' · ' + AV.ENGINES[ engine ] ),
			engine !== 'browser' && engine !== 'own' && h( 'span', { className: 'atlasvoice-status-item atlasvoice-hide-md' }, h( 'span', { className: 'atlasvoice-meter' + ( u.pct >= 95 ? ' is-bad' : u.pct >= 80 ? ' is-warn' : '' ) }, h( 'i', { style: { width: Math.max( u.pct, 2 ) + '%' } } ) ), u.pct + '% of this month’s characters' ),
			engine !== 'browser' && h( Button, { variant: 'link', className: 'atlasvoice-status-item atlasvoice-hide-sm', onClick: () => ctx.go( 'library' ) }, ( () => { const n = ctx.posts.reduce( ( a, p ) => a + p.langs.filter( ( l ) => l.st === 'Making' ).length, 0 ); return n ? n + ( n === 1 ? ' audio job running' : ' audio jobs running' ) : 'No audio jobs running'; } )() ),
			engine !== 'browser' && h( 'span', { className: 'atlasvoice-status-item atlasvoice-hide-lg' }, 'Today: ' + ctx.today.toLocaleString( 'en' ) + ' of ' + ctx.audio.perDay.toLocaleString( 'en' ) + ' characters' ),
			h( 'span', { className: 'atlasvoice-status-item atlasvoice-hide-lg' }, scn === 'new' ? 'No audio yet' : '182 of 214 posts have audio' ),
			h( 'span', { className: 'atlasvoice-status-item atlasvoice-hide-lg' }, free ? 'Free 2.5.0' : 'Pro licensed' ),
			h( 'span', { className: 'atlasvoice-status-end' }, h( 'label', { htmlFor: 'atlasvoice-live' }, 'Live for visitors' ),
				h( FormToggle, { id: 'atlasvoice-live', checked: live, onChange: () => ctx.askMode( live ? 'staging' : 'live' ) } ) ) );
	};

	/* =============================================================== screens */
	AV.S.overview = function Overview() {
		const ctx = useApp();
		const { go, free, setup, setupSteps, mode, engine, scn, look, notify } = ctx;
		const issues = AV.issues( ctx );
		const fresh = scn === 'new';
		const next = setupSteps.find( ( s ) => ! setup.done.includes( s.id ) );
		const live = mode === 'live';
		return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 1180 },
			h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: live ? 'success' : 'warning', isDismissible: false, actions: live ? [ { label: 'View as a visitor', onClick: () => ctx.setView( 'front' ) }, { label: 'Change who sees it', onClick: () => go( 'player:place' ) } ] : [ { label: 'Go live…', variant: 'primary', onClick: () => ctx.askMode( 'live' ) }, { label: 'View as a visitor', onClick: () => ctx.setView( 'front' ) } ] },
				h( 'b', null, live ? 'Right now, everyone can hear it. ' : 'Right now, only you can hear it. ' ), live ? 'On Posts' + ( free ? '' : ', Pages and Products' ) + ' · shown to everyone · except posts in Podcasts · download allowed for everyone.' : 'You are in staging, so only logged-in admins see the player.' ) ),
			! fresh && h( 'div', { className: 'atlasvoice-section' }, h( AV.Stats, { items: [ [ 'Plays, last 7 days', '1,284', '+18% on the week before', '#007f30' ], [ 'Listening time', '41 h', '+9%' ], [ 'Finished listening', '38%', '−2%' ], [ 'Posts with audio', '182 of 214', '32 still need audio' ] ] } ) ),
			h( 'div', { className: 'atlasvoice-grid is-2 atlasvoice-section' },
				! setup.finished ? h( Card, null,
					h( CardHeader, null, h( AV.H2, null, 'Finish setting up' ), h( 'span', { className: 'atlasvoice-weak' }, setup.done.length + ' of ' + setupSteps.length + ' steps' ) ),
					h( CardBody, { size: 'small' }, h( 'div', { className: 'atlasvoice-meter' }, h( 'i', { style: { width: ( 100 * setup.done.length / setupSteps.length ) + '%' } } ) ) ),
					h( ItemGroup, { isSeparated: true }, setupSteps.map( ( s ) => h( Item, { key: s.id, onClick: () => go( 'setup:' + s.id ) }, h( HStack, null,
						h( HStack, { justify: 'flex-start', spacing: 3 }, h( I, { icon: setup.done.includes( s.id ) ? 'check' : 'circle', size: 20, style: { color: setup.done.includes( s.id ) ? '#007f30' : '#949494' } } ), h( 'span', null, s.label ) ),
						next && next.id === s.id && h( AV.Chip, { tone: 'brand' }, 'Next' ) ) ) ) ) )
					: h( Card, null,
						h( CardHeader, null, h( AV.H2, null, issues.length ? 'Needs your attention' : 'Everything is working' ), issues.length ? h( AV.Count, null, issues.length ) : h( AV.Chip, { tone: 'ok', dot: true }, 'All good' ) ),
						issues.length ? h( ItemGroup, { isSeparated: true }, issues.map( ( [ tone, t, d, b, fn ] ) => h( Item, { key: t }, h( 'div', { className: 'atlasvoice-issue' },
							h( I, { icon: tone === 'err' ? 'error' : tone === 'info' ? 'info' : 'caution', style: { color: { err: '#cc1818', warn: '#926300', info: '#006bd7' }[ tone ], flex: 'none' } } ),
							h( 'div', { className: 'atlasvoice-issue-text' }, h( 'b', null, t ), h( 'span', { className: 'atlasvoice-weak' }, d ) ), h( Button, { variant: 'secondary', size: 'compact', onClick: fn }, b ) ) ) ) )
							: h( ItemGroup, { isSeparated: true },
								h( Item, { onClick: () => go( 'voice' ) }, h( HStack, null, h( 'span', null, 'Voice: ' + AV.voiceName( ctx.voice ) + ' · ' + AV.ENGINES[ engine ] ), h( I, { icon: 'chevron-right' } ) ) ),
								h( Item, { onClick: () => go( 'content' ) }, h( HStack, null, h( 'span', null, 'Shown on Posts' + ( free ? '' : ', Pages, Products' ) ), h( I, { icon: 'chevron-right' } ) ) ),
								h( Item, { onClick: () => go( 'health' ) }, h( HStack, null, h( 'span', null, 'Last check today 09:12, no problems found' ), h( I, { icon: 'chevron-right' } ) ) ) ) ),
				h( Card, null,
					h( CardHeader, null, h( AV.H2, null, 'Your player' ), h( Button, { variant: 'tertiary', size: 'compact', onClick: () => go( 'player' ) }, 'Change look' ) ),
					h( CardBody, null, h( VStack, { spacing: 3 },
						h( AV.Player, { form: engine === 'browser' ? 'button' : 'bar', state: 'playing', look, voice: AV.voiceName( ctx.voice ) + ' · ' + AV.ENGINES[ engine ], staging: mode === 'staging', ai: ctx.ai, onAct: ( a ) => notify( a === 'pause' ? 'Paused. On your site this pauses the audio.' : 'On your site this ' + ( a === 'download' ? 'downloads the MP3.' : 'changes the speed.' ) ) } ),
						engine !== 'browser' && engine !== 'own' && h( AV.Usage ) ) ) ) ),
			free && engine === 'browser' && h( 'div', { className: 'atlasvoice-section' }, h( Card, null, h( CardBody, null, h( HStack, { wrap: true },
				h( VStack, { spacing: 1, style: { flex: 1, minWidth: 240 } }, h( HStack, { justify: 'flex-start' }, h( AV.Chip, { tone: 'info' }, 'New · free' ), h( 'b', null, 'A natural voice for your posts' ) ), h( 'span', { className: 'atlasvoice-weak' }, 'The same voice on every phone and browser, saved as an MP3 on your site. 100,000 characters a month free.' ) ),
				h( HStack, { justify: 'flex-start', expanded: false }, h( Button, { variant: 'secondary', onClick: () => notify( 'Playing a sample of Emma reading your newest post.' ) }, 'Hear it first' ), h( Button, { variant: 'primary', onClick: () => go( 'voice' ) }, 'Switch to it' ) ) ) ) ) ),
			h( 'div', { className: 'atlasvoice-grid is-2 atlasvoice-section' },
				fresh ? h( Card, null, h( CardHeader, null, h( AV.H2, null, 'What you can do next' ) ), h( ItemGroup, { isSeparated: true },
					[ [ 'Read pages too', 'Add the player to pages, products or any content type.', 'content' ], [ 'Fix how a word is said', 'For brand names and abbreviations.', 'pronunciation' ], [ 'Follow along while listening', 'Highlight each sentence as it is read.', 'player:read' ] ].map( ( [ t, d, to ] ) => h( Item, { key: t, onClick: () => go( to ) }, h( HStack, null, h( VStack, { spacing: 0 }, h( 'b', { style: { fontWeight: 500 } }, t ), h( 'span', { className: 'atlasvoice-weak' }, d ) ), h( I, { icon: 'chevron-right' } ) ) ) ) ) )
					: h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Plays per day' ), h( Button, { variant: 'link', onClick: () => go( 'insights' ) }, 'Open Insights' ) ), h( CardBody, null, h( AV.Bars, { values: [ 22, 30, 26, 41, 38, 35, 52, 48, 44, 60, 57, 49, 63, 71, 66, 58, 74, 80, 69, 77, 88, 84, 79, 92, 98, 90, 100, 96, 89, 99 ], from: '27 Sep', to: '26 Oct' } ) ) ),
				h( Card, null, h( CardHeader, null, h( AV.H2, null, 'What’s new in 2.5' ), h( Button, { variant: 'link', onClick: () => AV.ext( notify, 'the changelog on WordPress.org' ) }, 'Full changelog' ) ), h( ItemGroup, { isSeparated: true },
					h( AV.Row, { title: 'Every setting has a new home', help: 'Search with Ctrl K. Old names such as “Aliases” still find it.' } ),
					h( AV.Row, { title: 'Audio starts in seconds', help: 'The first part plays while the rest is prepared.' } ),
					h( AV.Row, { title: 'Undo an update', help: 'Go back to an earlier version from Versions.' }, h( Button, { variant: 'secondary', size: 'compact', onClick: () => go( 'versions' ) }, 'Open' ) ),
					h( AV.Row, { title: 'Tell listeners it’s an AI voice', help: 'An optional line with the player, in their language.' }, h( Button, { variant: 'secondary', size: 'compact', onClick: () => go( 'player:ai' ) }, 'Open' ) ) ) ) ),
			free && h( Card, null, h( CardBody, null, h( HStack, { wrap: true },
				h( VStack, { spacing: 1, style: { flex: 1, minWidth: 240 } }, h( HStack, { justify: 'flex-start' }, h( AV.Pro ), h( 'b', null, 'More with AtlasVoice Pro' ) ), h( 'span', { className: 'atlasvoice-weak' }, '374 studio voices in 43 languages, every content type, a voice per language, audio for many posts at once, audio in search and deeper insights.' ) ),
				h( Button, { variant: 'secondary', onClick: () => go( 'plans' ) }, 'Compare plans' ) ) ) ) ) );
	};

	/* --------------------------------------------------------------- setup */
	const StepHead = ( { n, of, title, desc } ) => h( 'div', { className: 'atlasvoice-stephead' }, h( 'p', { className: 'atlasvoice-weak' }, 'Step ' + n + ' of ' + of ), h( 'h2', null, title ), desc && h( 'p', { className: 'atlasvoice-weak' }, desc ) );
	AV.S.setup = function Setup( { sub } ) {
		const ctx = useApp();
		const { go, free, setup, setSetup, setupSteps, notify, look } = ctx;
		const idx = Math.max( 0, setupSteps.findIndex( ( s ) => s.id === ( sub || setup.current ) ) );
		const step = setupSteps[ idx ];
		const [ d, setD ] = useState( setup.draft );
		const up = ( p ) => setD( ( x ) => ( { ...x, ...p } ) );
		const [ heardState, setHeardState ] = useState( d.heard ? 'done' : 'idle' );
		const [ keyTest, setKeyTest ] = useState( d.keyOk ? 'ok' : 'idle' );
		const mail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
		const valid = {
			hear: d.heard,
			where: d.types.length > 0,
			voice: d.engine === 'browser' || ( d.engine === 'atlas' && mail.test( d.email ) && d.consent ) || d.engine === 'cloud' || ( d.engine === 'own' && d.keyOk ),
			look: !! d.preset,
			mp3: true,
			report: ! d.report || mail.test( d.reportTo ),
			live: d.checked,
			done: true,
		}[ step.id ];
		const blocked = {
			hear: 'Press play to hear your post first',
			where: 'Choose at least one content type',
			voice: d.engine === 'atlas' ? ( ! mail.test( d.email ) ? 'Add your email' : 'Tick the consent box' ) : 'Save and test the key first',
			report: 'Add an email address, or turn the report off',
			live: 'Open a post and listen first',
		}[ step.id ];
		const goTo = ( i ) => { setSetup( ( s ) => ( { ...s, current: setupSteps[ i ].id, draft: d } ) ); go( 'setup:' + setupSteps[ i ].id ); };
		const finish = ( id ) => setSetup( ( s ) => ( { ...s, draft: d, done: s.done.includes( id ) ? s.done : s.done.concat( id ) } ) );
		const cont = () => {
			finish( step.id );
			if ( step.id === 'voice' ) { ctx.setEngine( d.engine ); if ( d.engine === 'atlas' ) ctx.setConn( 'wait' ); notify( d.engine === 'atlas' ? 'Natural voice connected. We sent a link to ' + d.email + '; you don’t have to wait for it.' : 'Voice saved.' ); }
			if ( step.id === 'look' ) { const p = AV.PRESETS.find( ( x ) => x[ 0 ] === d.preset ); ctx.setLook( { ...look, preset: d.preset, bg: p[ 2 ], fg: p[ 3 ], shape: d.shape } ); notify( 'Player style saved.' ); }
			if ( step.id === 'where' ) notify( 'Saved. The player is added to ' + d.types.join( ', ' ) + '.' );
			if ( step.id === 'done' ) { setSetup( ( s ) => ( { ...s, finished: true, done: setupSteps.map( ( x ) => x.id ) } ) ); go( 'overview' ); return; }
			goTo( idx + 1 );
		};
		const playIt = () => { setHeardState( 'playing' ); setTimeout( () => { setHeardState( 'done' ); up( { heard: true } ); }, 1800 ); };
		let body;
		if ( step.id === 'hear' ) {
			body = h( Fragment, null, h( StepHead, { n: idx + 1, of: setupSteps.length, title: 'Here is your newest post, read aloud', desc: 'Press play. This is how visitors will hear “How we restored the old mill” in your site language, English (UK).' } ),
				h( Card, null, h( CardBody, null, h( VStack, { spacing: 3 },
					h( AV.Player, { form: 'bar', state: heardState === 'playing' ? 'playing' : heardState === 'done' ? 'ended' : 'idle', look, voice: free ? 'Google UK English · browser voice' : 'Sarah · AtlasVoice Cloud', onAct: playIt } ),
					heardState === 'done' ? h( Notice, { status: 'success', isDismissible: false }, 'That’s it. Next, choose where the player appears.' ) : h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'primary', isBusy: heardState === 'playing', onClick: playIt }, heardState === 'playing' ? 'Playing…' : 'Play my newest post' ), h( Button, { variant: 'link', onClick: () => AV.ext( notify, 'the demo page with every voice' ) }, 'Hear every voice on the demo page' ) ) ) ) ),
				h( 'p', { className: 'atlasvoice-weak', style: { marginTop: 12 } }, 'Nothing is sent anywhere yet. This uses the voice built into your browser' + ( free ? '.' : ', or your Pro licence.' ) ) );
		} else if ( step.id === 'where' ) {
			body = h( Fragment, null, h( StepHead, { n: idx + 1, of: setupSteps.length, title: 'Where should people be able to listen?', desc: free ? 'Choose one. You can still place the player anywhere with the shortcode, block or Elementor widget.' : 'Choose as many as you like.' } ),
				h( AV.Tiles, { multi: ! free, value: free ? d.types[ 0 ] : d.types, onChange: ( v ) => up( { types: free ? [ v ] : v } ), options: [ { id: 'Posts', title: 'Posts', text: '182 published', icon: 'post' }, { id: 'Pages', title: 'Pages', text: '24 published', icon: 'page' }, { id: 'Products', title: 'Products', text: '8 published', icon: 'store' } ] } ),
				free && h( 'div', { style: { marginTop: 16 } }, h( AV.ProNote, null, 'A player on every content type at once.' ) ) );
		} else if ( step.id === 'voice' ) {
			const opts = free
				? [ { id: 'atlas', title: 'Natural voice', badge: h( AV.Chip, { tone: 'info' }, 'Recommended' ), text: 'Sounds the same on every device. Saved as MP3. 100,000 characters a month free.', icon: 'audio' }, { id: 'browser', title: 'Browser voice', text: 'No account. The sound depends on each visitor’s device.', icon: 'desktop' }, { id: 'own', title: 'Your own provider', text: 'Google Cloud, OpenAI or ElevenLabs. Billed by them.', icon: 'key' } ]
				: [ { id: 'cloud', title: 'AtlasVoice Cloud', badge: h( AV.Chip, { tone: 'ok' }, 'In your licence' ), text: '374 studio voices, saved as MP3. Nothing to set up.', icon: 'cloud' }, { id: 'atlas', title: 'Natural voice', text: 'AtlasVoice TTS, unlimited with Pro.', icon: 'audio' }, { id: 'own', title: 'Your own provider', text: 'Google Cloud, OpenAI or ElevenLabs. Billed by them.', icon: 'key' } ];
			body = h( Fragment, null, h( StepHead, { n: idx + 1, of: setupSteps.length, title: 'How should your posts sound?' } ),
				h( AV.Tiles, { value: d.engine, onChange: ( v ) => up( { engine: v } ), options: opts } ),
				h( 'div', { style: { marginTop: 16 } }, h( Card, null, h( CardBody, null, h( VStack, { spacing: 4 },
					d.engine === 'atlas' && h( Fragment, null,
						h( C.TextControl, { ...AV.N, type: 'email', label: 'Your email', help: 'For usage notices only.', value: d.email, onChange: ( v ) => up( { email: v } ) } ),
						h( C.CheckboxControl, { ...AV.NM, label: 'Send post text to AtlasVoice to make the audio', help: 'It is deleted right after; the MP3 is saved on your site. We connect when you press Continue.', checked: d.consent, onChange: ( v ) => up( { consent: v } ) } ) ),
					d.engine === 'own' && h( Fragment, null,
						h( C.SelectControl, { ...AV.N, label: 'Provider', value: d.provider, options: [ { label: 'Google Cloud', value: 'google' }, { label: 'OpenAI', value: 'openai' }, { label: 'ElevenLabs', value: 'eleven' } ], onChange: ( v ) => { up( { provider: v, keyOk: false } ); setKeyTest( 'idle' ); } } ),
						d.provider === 'google' ? h( C.FormFileUpload, { accept: '.json', onChange: () => { setKeyTest( 'busy' ); setTimeout( () => { setKeyTest( 'ok' ); up( { keyOk: true } ); }, 1200 ); }, render: ( { openFileDialog } ) => h( Button, { variant: 'secondary', icon: h( I, { icon: 'upload' } ), onClick: openFileDialog }, 'Upload the JSON key file' ) } )
							: h( HStack, { alignment: 'bottom' }, h( 'div', { style: { flex: 1 } }, h( C.TextControl, { ...AV.N, type: 'password', label: ( d.provider === 'openai' ? 'OpenAI' : 'ElevenLabs' ) + ' API key', value: d.key, onChange: ( v ) => up( { key: v } ) } ) ),
								h( Button, { variant: 'secondary', __next40pxDefaultSize: true, disabled: d.key.length < 8, isBusy: keyTest === 'busy', onClick: () => { setKeyTest( 'busy' ); setTimeout( () => { setKeyTest( 'ok' ); up( { keyOk: true } ); }, 1200 ); } }, 'Save and test' ) ),
						keyTest === 'ok' && h( Notice, { status: 'success', isDismissible: false }, 'Connected. The key works.' ) ),
					d.engine === 'browser' && h( 'p', { className: 'atlasvoice-weak' }, 'Nothing to set up. You can switch to the natural voice at any time.' ),
					d.engine === 'cloud' && h( Notice, { status: 'success', isDismissible: false }, 'Your Pro licence connects this site automatically as admin@thereadingsite.com when the first audio is made.' ),
					h( 'div', { className: 'atlasvoice-grid is-2' },
						h( C.SelectControl, { ...AV.N, label: 'Language', value: 'en-GB', options: [ { label: 'English (UK), from your site', value: 'en-GB' } ], onChange: () => {} } ),
						h( HStack, { alignment: 'bottom' }, h( 'div', { style: { flex: 1 } }, h( C.SelectControl, { ...AV.N, label: 'Voice', value: 'v', options: [ { label: d.engine === 'cloud' ? 'Sarah · natural' : d.engine === 'browser' ? 'Google UK English Female' : 'Emma', value: 'v' } ], onChange: () => {} } ) ), h( Button, { variant: 'secondary', __next40pxDefaultSize: true, onClick: () => notify( 'Playing a short sample.' ) }, 'Preview' ) ) ),
					! free && h( Notice, { status: 'info', isDismissible: false, actions: [ { label: 'Set up languages after setup', onClick: () => notify( 'Noted. Languages opens when setup is done.' ) } ] }, 'Polylang found: your site has 4 languages. You can give each its own voice.' ) ) ) ) ) );
		} else if ( step.id === 'look' ) {
			body = h( Fragment, null, h( StepHead, { n: idx + 1, of: setupSteps.length, title: 'Make it look like your site', desc: 'Pick a style. Fine-tune it later in Player.' } ),
				h( 'div', { className: 'atlasvoice-presets', role: 'radiogroup', 'aria-label': 'Style' }, AV.PRESETS.map( ( p ) => h( 'button', { key: p[ 0 ], className: 'atlasvoice-preset' + ( d.preset === p[ 0 ] ? ' is-on' : '' ), role: 'radio', 'aria-checked': d.preset === p[ 0 ], onClick: () => up( { preset: p[ 0 ] } ) }, h( 'span', { style: { background: p[ 2 ] } } ), p[ 1 ] ) ) ),
				h( 'div', { style: { marginTop: 16 } }, h( AV.TG, { label: 'Shape', value: d.shape, onChange: ( v ) => up( { shape: v } ), options: [ [ 'square', 'Square' ], [ 'rounded', 'Rounded' ], [ 'pill', 'Pill' ] ] } ) ),
				h( 'div', { style: { marginTop: 16 } }, h( AV.Site, null, h( AV.Player, { form: 'bar', state: 'idle', look: { bg: AV.PRESETS.find( ( x ) => x[ 0 ] === d.preset )[ 2 ], fg: AV.PRESETS.find( ( x ) => x[ 0 ] === d.preset )[ 3 ], shape: d.shape } } ) ) ) );
		} else if ( step.id === 'mp3' ) {
			body = h( Fragment, null, h( StepHead, { n: idx + 1, of: setupSteps.length, title: 'Audio files', desc: 'Pro saves every post as an MP3. Choose who can download it.' } ),
				h( Card, null, h( CardBody, null, h( VStack, { spacing: 4 },
					h( C.RadioControl, { label: 'Allow MP3 download for', selected: d.dl, options: [ { label: 'Everyone', value: 'all' }, { label: 'Logged-in users', value: 'users' }, { label: 'Administrators only', value: 'admins' }, { label: 'Nobody', value: 'none' } ], onChange: ( v ) => up( { dl: v } ) } ),
					h( 'div', { className: 'atlasvoice-grid is-2' }, h( C.TextControl, { ...AV.N, type: 'date', label: 'Make audio for posts published from', value: d.from, onChange: ( v ) => up( { from: v } ) } ), h( C.TextControl, { ...AV.N, type: 'date', label: 'Until', value: d.to, onChange: ( v ) => up( { to: v } ) } ) ),
					h( 'p', { className: 'atlasvoice-weak' }, 'Leave the dates empty for all posts. You can check the text first in the Audio library.' ) ) ) ) );
		} else if ( step.id === 'report' ) {
			body = h( Fragment, null, h( StepHead, { n: idx + 1, of: setupSteps.length, title: 'Get a listening report by email?' } ),
				h( Card, null, h( CardBody, null, h( VStack, { spacing: 4 },
					h( C.ToggleControl, { ...AV.NM, label: 'Email me a report', help: 'Plays, top posts and listening time.', checked: d.report, onChange: ( v ) => up( { report: v } ) } ),
					d.report && h( AV.TG, { label: 'How often', value: d.freq, onChange: ( v ) => up( { freq: v } ), options: [ [ 'w', 'Weekly' ], [ 'm', 'Monthly' ] ] } ),
					d.report && h( C.TextControl, { ...AV.N, type: 'email', label: 'Send to', value: d.reportTo, onChange: ( v ) => up( { reportTo: v } ) } ) ) ) ) );
		} else if ( step.id === 'live' ) {
			body = h( Fragment, null, h( StepHead, { n: idx + 1, of: setupSteps.length, title: 'Check it, then go live', desc: 'Right now only you can see the player. Open a post, listen, and check the right text is read.' } ),
				h( Card, null, h( ItemGroup, { isSeparated: true },
					h( AV.Row, { title: 'Open a post and listen', help: d.checked ? 'Checked “How we restored the old mill”.' : '“How we restored the old mill”' }, d.checked ? h( AV.Chip, { tone: 'ok', dot: true }, 'Checked' ) : h( Button, { variant: 'secondary', icon: h( I, { icon: 'seen' } ), onClick: () => { up( { checked: true } ); notify( 'In the plugin this opens the post in a new tab. Marked as checked.' ); } }, 'Open and listen' ) ),
					h( AV.Toggle, { label: 'Count plays', help: 'Counted on your own site. No cookies.', checked: d.count, onChange: ( v ) => up( { count: v } ) } ) ) ),
				h( 'div', { style: { marginTop: 16 } }, h( C.RadioControl, { label: 'When you continue', selected: d.golive, options: [ { label: 'Go live: visitors hear your posts now', value: 'live' }, { label: 'Stay in staging: only admins see the player', value: 'staging' } ], onChange: ( v ) => up( { golive: v } ) } ) ) );
		} else {
			body = h( Fragment, null, h( StepHead, { n: idx + 1, of: setupSteps.length, title: d.golive === 'live' ? 'You’re live' : 'You’re set up, still in staging', desc: d.golive === 'live' ? 'Visitors can hear your posts now.' : 'Only you can hear the player until you go live.' } ),
				h( Card, null, h( CardBody, null, h( AV.KV, { rows: [ [ 'Where', d.types.join( ', ' ) ], [ 'Voice', AV.ENGINES[ d.engine ] ], [ 'Style', AV.PRESETS.find( ( x ) => x[ 0 ] === d.preset )[ 1 ] + ', ' + d.shape ], [ 'Counting plays', d.count ? 'On' : 'Off' ] ].concat( free ? [] : [ [ 'MP3 download', { all: 'Everyone', users: 'Logged-in users', admins: 'Administrators only', none: 'Nobody' }[ d.dl ] ], [ 'Report', d.report ? ( d.freq === 'w' ? 'Weekly to ' : 'Monthly to ' ) + d.reportTo : 'Off' ] ] ) } ) ) ),
				h( 'div', { className: 'atlasvoice-grid is-2', style: { marginTop: 16 } },
					h( 'button', { className: 'atlasvoice-tile', onClick: () => ctx.setView( 'front' ) }, h( 'span', { className: 'atlasvoice-tile-icon' }, h( I, { icon: 'seen' } ) ), h( 'span', null, h( 'b', null, 'See the player on your site' ), h( 'p', null, 'Opens your newest post' ) ) ),
					h( 'button', { className: 'atlasvoice-tile', onClick: () => cont() }, h( 'span', { className: 'atlasvoice-tile-icon' }, h( I, { icon: 'home' } ) ), h( 'span', null, h( 'b', null, 'Go to Overview' ), h( 'p', null, 'Health, plays and every setting' ) ) ) ),
				h( 'div', { style: { marginTop: 16 } }, h( Notice, { status: 'info', isDismissible: false, actions: [ { label: 'Leave a review', onClick: () => AV.ext( notify, 'the WordPress.org review page' ) } ] }, 'Enjoying AtlasVoice? A quick review helps other site owners find it.' ) ) );
		}
		const onCont = () => {
			if ( step.id === 'live' ) { ctx.setMode( d.golive ); ctx.setAnalytics( d.count ); notify( d.golive === 'live' ? 'You’re live. Visitors can hear your posts.' : 'Saved. You stay in staging.' ); }
			cont();
		};
		return h( 'div', { className: 'atlasvoice-split' },
			h( 'div', { className: 'atlasvoice-split-side atlasvoice-steps-side' }, h( 'ol', { className: 'atlasvoice-steps' },
				setupSteps.map( ( s, i ) => {
					const done = setup.done.includes( s.id );
					const reach = done || i <= setup.done.length;
					return h( 'li', { key: s.id }, h( 'button', { className: 'atlasvoice-step' + ( i === idx ? ' is-current' : '' ) + ( done ? ' is-done' : '' ), disabled: ! reach, onClick: () => goTo( i ), 'aria-current': i === idx ? 'step' : undefined },
						h( 'span', { className: 'atlasvoice-step-n' }, done ? '✓' : i + 1 ), h( 'span', { className: 'atlasvoice-step-label' }, s.label ), s.pro && h( AV.Pro ) ) );
				} ) ),
				h( 'p', { className: 'atlasvoice-weak atlasvoice-steps-note' }, 'Opens once after you activate. Each step saves when you continue; leave any time and pick up here.' ) ),
			h( AV.Pane, { canvas: true, footer: h( 'div', { className: 'atlasvoice-footer' },
				h( Button, { variant: 'tertiary', className: 'atlasvoice-footer-note', onClick: () => ctx.modal( { title: 'Skip setup?', body: h( 'p', null, 'Nothing is lost. Overview keeps a “Finish setting up” card until you come back.' ), ok: 'Skip for now', onOk: () => go( 'overview' ) } ) }, 'Skip setup' ),
				! valid && blocked && h( 'span', { className: 'atlasvoice-weak atlasvoice-hide-sm' }, blocked ),
				h( Button, { variant: 'secondary', disabled: idx === 0, onClick: () => goTo( idx - 1 ) }, 'Back' ),
				h( Button, { variant: 'primary', disabled: ! valid, onClick: onCont, 'aria-describedby': ! valid ? 'atlasvoice-why' : undefined }, step.id === 'done' ? 'Go to Overview' : step.id === 'live' ? ( d.golive === 'live' ? 'Go live and finish' : 'Finish in staging' ) : 'Continue' ),
				! valid && blocked && h( 'span', { id: 'atlasvoice-why', className: 'screen-reader-text', style: { position: 'absolute', left: -9999 } }, blocked ) ) },
				h( AV.Scroll, { width: 780 }, body ) ) );
	};
}() );
