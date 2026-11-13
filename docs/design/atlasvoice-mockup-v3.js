/*
 * AtlasVoice redesign mockup, version 3 additions (13 Nov 2026).
 *
 * What v3 changes over v2, and why:
 *  1. Ten destinations instead of nineteen, in the order people work:
 *     Set up (Voice, Player, What is read) · Every day (Audio library,
 *     Insights, SEO) · Look after (Site health, Account & plans, Help).
 *     The nine screens that left the menu are tabs of their group.
 *  2. Home shows the four-step journey: Voice, Player, What is read, Live.
 *  3. Existing sites get a welcome on update day, a "Where things moved"
 *     page and a way back to the classic screens.
 *  4. Leaving a screen with unsaved changes asks first.
 *  5. Colours are compact rows that open a palette, like the block editor.
 *  6. Catches up with the 2.4.0 beta: Test on your phone, "licence not
 *     activated on this site" (Freemius decides Premium), a screen for
 *     "can't reach the site's API", 380 voices.
 */
( function ( AV ) {
	const { h, Fragment, useState, C, I, useApp } = AV;
	const { Button, Card, CardBody, CardHeader, Notice, Modal, SearchControl } = C;
	const { ItemGroup, Item, HStack, VStack, NM } = AV;

	/* ------------------------------------------------------------ small parts */
	/* A colour as one row: name, swatch and value; the palette opens on click. */
	AV.ColorRow = ( { label, value, onChange, colors, note, bad } ) => h( HStack, { wrap: true, spacing: 3 },
		h( VStack, { spacing: 0, style: { flex: 1, minWidth: 150 } }, h( 'b', { style: { fontWeight: 500 } }, label ), note && h( 'span', { style: { fontSize: 12, color: bad ? '#cc1818' : '#007f30' } }, note ) ),
		h( C.Dropdown, { popoverProps: { placement: 'bottom-end' },
			renderToggle: ( { isOpen, onToggle } ) => h( Button, { variant: 'secondary', onClick: onToggle, 'aria-expanded': isOpen, 'aria-label': label + ', now ' + ( value || 'none' ) + '. Change colour' },
				h( C.ColorIndicator, { colorValue: value } ), h( 'span', { className: 'atlasvoice-mono', style: { marginLeft: 8 } }, value || 'None' ) ),
			renderContent: () => h( 'div', { style: { padding: 16, width: 260 } }, h( C.ColorPalette, { colors, value, onChange: ( v ) => v && onChange( v ), clearable: false } ) ) } ) );

	/* A stand-in QR code for "Test on your phone" (TTS-351). */
	AV.QR = () => {
		const n = 25, cells = [];
		const finder = ( x, y ) => ( x < 7 && y < 7 ) || ( x >= n - 7 && y < 7 ) || ( x < 7 && y >= n - 7 );
		const inFinder = ( x, y ) => { const fx = x < 7 ? x : x - ( n - 7 ), fy = y < 7 ? y : y - ( n - 7 ); return fx === 0 || fx === 6 || fy === 0 || fy === 6 || ( fx > 1 && fx < 5 && fy > 1 && fy < 5 ); };
		for ( let y = 0; y < n; y++ ) for ( let x = 0; x < n; x++ ) {
			const on = finder( x, y ) ? inFinder( x, y ) : ( ( x * 7 + y * 13 + x * y ) % 5 < 2 );
			if ( on ) cells.push( h( 'rect', { key: x + '-' + y, x, y, width: 1, height: 1 } ) );
		}
		return h( 'div', { style: { display: 'flex', justifyContent: 'center' } }, h( 'svg', { viewBox: '-2 -2 ' + ( n + 4 ) + ' ' + ( n + 4 ), width: 180, height: 180, role: 'img', 'aria-label': 'QR code that opens this post on your phone', style: { background: '#fff', border: '1px solid #dcdcde', borderRadius: 4 }, fill: '#1e1e1e' }, cells ) );
	};

	AV.COMPARE = [
		[ 'Natural voice (MP3)', '100,000 characters a month', 'Unlimited' ],
		[ 'Voices', 'Browser voices + 4 natural voices', '380 studio voices in 43 languages' ],
		[ 'Your own Google, OpenAI or ElevenLabs key', 'Yes', 'Yes' ],
		[ 'Where the player is added', 'One content type', 'Every content type, each with its own rules' ],
		[ 'Languages', 'The site language', 'A voice for each language' ],
		[ 'Making audio ahead of time', 'One post at a time', 'Many posts at once, in every language' ],
		[ 'Pronunciation words', '1', 'As many as you need' ],
		[ 'Skip share bars, captions and phrases', 'No', 'Yes' ],
		[ 'Insights', 'Last 30 days', 'All time, busiest hours, export, email report' ],
		[ 'Audio in search and AI answers', 'No', 'Yes' ],
		[ 'Support', 'WordPress.org forum', 'Email, one working day' ],
	];

	/* --------------------------------------------- Home: the four-step journey */
	AV.Journey = function Journey() {
		const ctx = useApp();
		const live = ctx.mode === 'live';
		const steps = [
			[ 'Voice', AV.voiceName( ctx.voice ) + ' · ' + AV.ENGINES[ ctx.engine ], true, () => ctx.go( 'voice' ) ],
			[ 'Player', ( AV.PRESETS.find( ( p ) => p[ 0 ] === ctx.look.preset ) || [ 0, 'Your own colours' ] )[ 1 ] + ', ' + { before: 'before the content', after: 'after the content', manual: 'where you add it' }[ ctx.place.pos ], true, () => ctx.go( 'player' ) ],
			[ 'What is read', ctx.content.auto ? ctx.content.types.join( ', ' ) : 'Only where you add it', true, () => ctx.go( 'content' ) ],
			[ live ? 'Live' : 'Go live', live ? 'Visitors hear your posts' : 'Only you can hear it now', live, () => ( live ? ctx.setView( 'front' ) : ctx.askMode( 'live' ) ) ],
		];
		return h( 'div', { className: 'atlasvoice-journey', role: 'list', 'aria-label': 'Your setup, step by step' }, steps.map( ( [ t, v, done, fn ], i ) => h( 'button', { key: t, type: 'button', role: 'listitem', className: 'atlasvoice-journey-step' + ( done ? ' is-done' : ' is-next' ), onClick: fn },
			h( 'span', { className: 'atlasvoice-step-n', 'aria-hidden': true }, done ? '✓' : i + 1 ),
			h( 'span', { className: 'atlasvoice-journey-text' }, h( 'b', null, t ), h( 'small', null, v ) ),
			h( 'span', { className: 'atlasvoice-journey-end' }, done ? 'Change' : 'Go live…' ) ) ) );
	};

	/* --------------------------------------------- groups: a screen with tabs */
	const P = { ...AV.S };
	function Group( { id, tabs, sub, special } ) {
		const ctx = useApp();
		const list = tabs.filter( ( t ) => ! t.pro || ! ctx.free );
		const sp = special && special[ sub ];
		const [ tab, setTabState ] = useState( sp ? sp[ 0 ] : list.some( ( t ) => t.id === sub ) ? sub : list[ 0 ].id );
		const [ inner ] = useState( sp ? sp[ 1 ] : undefined );
		const [ nonce, setNonce ] = useState( 0 );
		const change = ( t ) => {
			if ( t === tab ) return;
			const move = () => { AV.dirty.current = false; setTabState( t ); ctx.setRouteSilently( id + ':' + t ); };
			if ( AV.dirty.current ) {
				setNonce( ( n ) => n + 1 );
				ctx.modal( { title: 'Leave without saving?', body: h( 'p', null, 'You changed settings on this tab and have not saved them yet.' ), cancel: 'Keep editing', ok: 'Leave without saving', destructive: true, onOk: move } );
			} else move();
		};
		const cur = list.find( ( t ) => t.id === tab ) || list[ 0 ];
		return h( 'section', { className: 'atlasvoice-main atlasvoice-group' },
			h( 'div', { className: 'atlasvoice-tabs' }, h( 'div', { className: 'atlasvoice-tabs-scroll' },
				h( C.TabPanel, { tabs: list.map( ( t ) => ( { name: t.id, title: t.label } ) ), initialTabName: cur.id, onSelect: change, key: cur.id + nonce + ctx.free }, () => null ) ) ),
			h( 'div', { className: 'atlasvoice-group-body' }, h( cur.comp, { key: cur.id, sub: tab === cur.id ? inner : undefined } ) ) );
	}

	/* Where things moved: every old menu item and setting name, and its new home. */
	const MOVED_SCREENS = [ [ 'Settings', 'What is read', 'content' ], [ 'Settings (toolbar, dashboard widget, delete data)', 'Site health › Advanced', 'advanced' ], [ 'Integrations', 'Voice › Your own provider', 'providers' ], [ 'Customization', 'Player', 'player' ], [ 'Customization › Select Player', 'Voice', 'voice' ], [ 'Listening', 'Voice', 'voice' ], [ 'Highlight', 'Player › Read-along', 'player:read' ], [ 'Analytics', 'Insights', 'insights' ], [ 'SEO & AI Search', 'SEO & AI Search', 'seo' ], [ 'Compatibility', 'Site health', 'health' ], [ 'Aliases', 'Voice › Pronunciation', 'pronunciation' ], [ 'Maintenance', 'Audio library › Clean up', 'library:clean' ], [ 'Versions', 'Site health › Versions', 'versions' ], [ 'Docs', 'Help', 'docs' ], [ 'Our Plugins', 'Help › More plugins', 'more' ], [ 'Bulk MP3 Generate', 'Audio library', 'library' ], [ 'Pricing', 'Account & plans › Plans', 'plans' ], [ 'Account, Affiliation', 'Account & plans › Licence', 'licence' ], [ 'Staging / Go live buttons', 'The bar at the bottom of every screen', 'overview' ] ];
	function Moved() {
		const ctx = useApp();
		const [ q, setQ ] = useState( '' );
		const m = ( x ) => ! q || x.join( ' ' ).toLowerCase().includes( q.toLowerCase() );
		const settings = AV.IDX.filter( ( x ) => x[ 3 ] && ! ( ctx.free && x[ 4 ] && x[ 1 ] !== 'seo' ) ).map( ( x ) => [ x[ 3 ], x[ 2 ] + ' · ' + x[ 0 ], x[ 1 ] ] );
		const table = ( title, rows ) => rows.length > 0 && h( AV.Section, { title }, h( Card, null, h( AV.Table, { label: title, head: [ 'Before', 'Now', '' ] }, rows.map( ( r ) => h( 'tr', { key: r[ 0 ] + r[ 1 ] },
			h( 'td', null, r[ 0 ] ), h( 'td', { className: 'atlasvoice-cell-main' }, h( 'span', { className: 'atlasvoice-cell-title' }, r[ 1 ] ) ),
			h( 'td', { className: 'atlasvoice-td-end' }, h( Button, { variant: 'secondary', size: 'compact', onClick: () => ctx.go( r[ 2 ] ) }, 'Open' ) ) ) ) ) ) );
		const a = MOVED_SCREENS.filter( ( x ) => m( x ) && ! ( ctx.free && [ 'licence', 'library:clean' ].includes( x[ 2 ] ) ) ), b = settings.filter( m );
		return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 900 },
			h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: 'success', isDismissible: false }, h( 'b', null, 'Nothing you saved has changed. ' ), 'Your voice, player colours, audio files and statistics are exactly as they were. Only the screens are new.' ) ),
			h( 'div', { className: 'atlasvoice-section', style: { maxWidth: 360 } }, h( SearchControl, { ...NM, value: q, onChange: setQ, placeholder: 'Type an old name, for example “Aliases”' } ) ),
			table( 'Menu items', a ), table( 'Settings', b ),
			! a.length && ! b.length && h( AV.Empty, { title: 'Nothing matches “' + q + '”' }, 'Try the search box at the top of the screen; it also searches by old names.' ) ) );
	}

	AV.S.voice = ( { sub } ) => h( Group, { id: 'voice', sub, tabs: [ { id: 'voice', label: 'Voice', comp: P.voice }, { id: 'pronunciation', label: 'Pronunciation', comp: P.pronunciation }, { id: 'languages', label: 'Languages', comp: P.languages }, { id: 'providers', label: 'Your own provider', comp: P.providers } ] } );
	AV.S.site = ( { sub } ) => h( Group, { id: 'site', sub, special: { cors: [ 'health', 'cors' ] }, tabs: [ { id: 'health', label: 'Health', comp: P.health }, { id: 'versions', label: 'Versions', comp: P.versions }, { id: 'advanced', label: 'Advanced', comp: P.advanced }, { id: 'privacy', label: 'Privacy', comp: P.privacy } ] } );
	AV.S.account = function Account( { sub } ) {
		const { free } = useApp();
		return h( Group, { id: 'account', sub, tabs: [ { id: 'usage', label: 'Usage', comp: P.account }, { id: 'licence', label: 'Licence', comp: P.licence, pro: true }, { id: 'plans', label: free ? 'Plans & pricing' : 'Plans', comp: P.plans } ] } );
	};
	AV.S.help = ( { sub } ) => h( Group, { id: 'help', sub, tabs: [ { id: 'docs', label: 'Documentation', comp: P.docs }, { id: 'moved', label: 'Where things moved', comp: Moved }, { id: 'more', label: 'More plugins', comp: P.more } ] } );
	[ 'pronunciation', 'languages', 'providers', 'health', 'versions', 'advanced', 'privacy', 'licence', 'plans', 'docs', 'more' ].forEach( ( k ) => delete AV.S[ k ] );

	/* ------------------------------------------------------------------ shell */
	AV.SCREENS = [ [ 'overview', 'Home' ], [ 'setup', 'Set up AtlasVoice' ], [ 'voice', 'Voice' ], [ 'player', 'Player' ], [ 'content', 'What is read' ], [ 'library', 'Audio library' ], [ 'insights', 'Insights' ], [ 'seo', 'SEO & AI Search' ], [ 'site', 'Site health' ], [ 'account', 'Account & plans' ], [ 'help', 'Help' ] ];
	AV.TITLES = Object.fromEntries( AV.SCREENS );
	/* The search also offers the tabs, so nothing takes more than one step to find. */
	AV.SCREENS = AV.SCREENS.concat( [ [ 'pronunciation', 'Pronunciation' ], [ 'languages', 'Languages' ], [ 'providers', 'Your own provider' ], [ 'versions', 'Versions (roll back)' ], [ 'advanced', 'Advanced' ], [ 'privacy', 'Privacy' ], [ 'licence', 'Licence' ], [ 'plans', 'Plans & pricing' ], [ 'docs', 'Documentation' ], [ 'help:moved', 'Where things moved' ] ] );

	AV.Rail = function Rail( { open, setOpen } ) {
		const ctx = useApp();
		const { screen, go, free, setup, setupSteps } = ctx;
		const bad = AV.issues( ctx ).filter( ( x ) => x[ 0 ] === 'err' ).length;
		const NAV = [
			{ items: [ [ 'overview', 'Home', 'home' ], ! setup.finished && [ 'setup', 'Setup', 'check', { count: setup.done.length + '/' + setupSteps.length } ] ].filter( Boolean ) },
			{ group: 'Set up', items: [ [ 'voice', 'Voice', 'audio' ], [ 'player', 'Player', 'styles' ], [ 'content', 'What is read', 'post-content' ] ] },
			{ group: 'Every day', items: [ [ 'library', 'Audio library', 'media', { count: ctx.engine === 'browser' ? null : ( ctx.scn === 'new' ? '0' : '214' ) } ], [ 'insights', 'Insights', 'chart-bar' ], [ 'seo', 'SEO & AI Search', 'globe', { pro: true } ] ] },
			{ group: 'Look after', items: [ [ 'site', 'Site health', 'shield', { count: bad ? String( bad ) : null, tone: 'err' } ], [ 'account', 'Account & plans', 'receipt' ], [ 'help', 'Help', 'help' ] ] },
		];
		return h( Fragment, null,
			open && h( 'div', { className: 'atlasvoice-rail-backdrop', onClick: () => setOpen( false ) } ),
			h( 'aside', { className: 'atlasvoice-rail' + ( open ? ' is-open' : '' ) },
				h( 'div', { className: 'atlasvoice-rail-brand' },
					h( 'span', { className: 'atlasvoice-logo', style: { background: AV.BRAND } }, h( 'svg', { width: 32, height: 32, viewBox: '0 0 256 256', fill: 'none', strokeLinecap: 'round', 'aria-hidden': true }, h( 'path', { d: 'M66 198 128 62l62 136', stroke: '#fff', strokeWidth: 24, strokeLinejoin: 'round' } ), h( 'path', { d: 'M110 150v14M128 138v38M146 150v14', stroke: '#ff7853', strokeWidth: 11 } ) ) ),
					h( 'div', { className: 'atlasvoice-rail-label' }, h( 'b', null, 'AtlasVoice', ! free && h( Fragment, null, ' ', h( AV.Pro ) ) ), h( 'small', null, free ? 'Free 2.5.0' : '2.5.0 · Pro 3.6.0' ) ),
					open && h( Button, { className: 'atlasvoice-rail-close', icon: h( I, { icon: 'close' } ), label: 'Close menu', onClick: () => setOpen( false ) } ) ),
				h( 'nav', { className: 'atlasvoice-rail-nav', 'aria-label': 'AtlasVoice' },
					NAV.map( ( g, gi ) => h( Fragment, { key: gi },
						g.group && h( 'div', { className: 'atlasvoice-rail-group' }, h( 'span', { className: 'atlasvoice-rail-label' }, g.group ) ),
						g.items.map( ( [ id, label, icon, o = {} ] ) => h( Button, { key: id, className: 'atlasvoice-rail-item' + ( screen === id ? ' is-current' : '' ), title: label, 'aria-current': screen === id ? 'page' : undefined, onClick: () => { go( id ); setOpen( false ); } },
							h( I, { icon } ), h( 'span', { className: 'atlasvoice-rail-label' }, label ),
							h( 'span', { className: 'atlasvoice-rail-end atlasvoice-rail-label' }, o.count && h( AV.Count, { brand: o.tone !== 'err' }, o.count ), o.pro && free && h( AV.Pro ) ) ) ) ) ) ),
				h( 'div', { className: 'atlasvoice-rail-foot atlasvoice-rail-label' },
					free
						? h( Fragment, null, h( Button, { variant: 'secondary', className: 'atlasvoice-rail-upgrade', onClick: () => { go( 'plans' ); setOpen( false ); } }, 'Upgrade to Pro' ), h( 'span', { className: 'atlasvoice-weak' }, 'You are on the Free plan' ) )
						: h( Fragment, null, h( AV.Chip, { tone: ctx.lic === 'active' ? 'ok' : 'warn', dot: true }, ctx.lic === 'active' ? 'Licensed' : ctx.lic === 'expired' ? 'Expired' : 'Not activated' ), h( Button, { variant: 'link', onClick: () => go( 'licence' ) }, 'Licence' ) ) ) ) );
	};

	/* ------------------------------------------- update day for existing sites */
	AV.Welcome = function Welcome( { onClose } ) {
		const ctx = useApp();
		return h( Modal, { title: 'AtlasVoice has a new look', onRequestClose: onClose, size: 'medium' }, h( VStack, { spacing: 4 },
			h( Notice, { status: 'success', isDismissible: false }, h( 'b', null, 'Nothing you saved has changed. ' ), 'Your voice, player colours, audio files and statistics are exactly as they were, and your visitors see no difference.' ),
			h( 'ul', { className: 'atlasvoice-list' },
				h( 'li', null, 'The menu is shorter: Voice, Player and What is read to set up; Audio library and Insights for every day.' ),
				h( 'li', null, 'The search box at the top (Ctrl K) finds every setting, by its old name too.' ),
				h( 'li', null, 'Staging and Go live are now in the bar at the bottom of every screen.' ) ),
			h( 'div', { className: 'atlasvoice-modal-foot' },
				h( Button, { variant: 'link', onClick: () => { onClose(); ctx.go( 'advanced' ); } }, 'Use the classic screens for now' ),
				h( Button, { variant: 'secondary', onClick: () => { onClose(); ctx.go( 'help:moved' ); } }, 'Show me what moved' ),
				h( Button, { variant: 'primary', onClick: onClose }, 'Start using it' ) ) ) );
	};

	/* --------------------- the dashboard can't reach the site's REST API (TTS-361) */
	AV.ApiError = function ApiError() {
		const ctx = useApp();
		const [ busy, setBusy ] = useState( false );
		const causes = [
			[ 'Your permalinks are set to “Plain”', 'AtlasVoice now works with plain permalinks, but an old cached page may still call the wrong address.', 'Reload this page', () => { setBusy( true ); setTimeout( () => { setBusy( false ); ctx.notify( 'Still not reachable. Try the next step.' ); }, 1200 ); } ],
			[ 'The site address is http, but you are on https', 'WordPress Address and Site Address in Settings › General should both start with https.', 'Open Settings › General', () => ctx.notify( 'In the plugin this opens Settings › General.' ) ],
			[ 'A security plugin or the host blocks the REST API', 'Allow /wp-json/tta/v1/ for logged-in administrators.', 'Copy details for your host', () => AV.copyText( ctx.notify, 'GET /wp-json/tta/v1/settings → 403', 'Details' ) ],
		];
		return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 760 },
			h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: 'error', isDismissible: false }, h( 'b', null, 'AtlasVoice can’t load its settings. ' ), 'Your site is fine and visitors still hear your posts. Only this screen can’t reach your site’s API.' ) ),
			h( AV.Section, { title: 'Three things to check, most likely first', end: h( Button, { variant: 'primary', isBusy: busy, onClick: causes[ 0 ][ 3 ] }, 'Try again' ) },
				h( Card, null, h( ItemGroup, { isSeparated: true }, causes.map( ( [ t, d, b, fn ], i ) => h( Item, { key: t }, h( HStack, { wrap: true, alignment: 'top', spacing: 3 },
					h( 'span', { className: 'atlasvoice-step-n', 'aria-hidden': true }, i + 1 ),
					h( VStack, { spacing: 0, style: { flex: 1, minWidth: 220 } }, h( 'b', { style: { fontWeight: 500 } }, t ), h( 'span', { className: 'atlasvoice-weak' }, d ) ),
					h( Button, { variant: 'secondary', size: 'compact', onClick: fn }, b ) ) ) ) ) ) ),
			h( 'p', { className: 'atlasvoice-weak' }, 'Error for support: GET /wp-json/tta/v1/settings answered 403. ', h( Button, { variant: 'link', onClick: () => AV.ext( ctx.notify, 'the contact form on atlasaidev.com' ) }, 'Contact support' ) ) ) );
	};
	/* ---------------------------------------------- help on every screen (v3.1) */
	/* The topic for a route: the exact tab or step first, then its screen. */
	AV.helpFor = ( route ) => {
		const list = ( window.AVM_HELP || { topics: [] } ).topics;
		const r = String( route || '' );
		return list.find( ( t ) => t.key === r ) || list.find( ( t ) => t.key === r.split( '#' )[ 0 ] ) || list.find( ( t ) => t.key.split( ':' )[ 0 ] === r.split( ':' )[ 0 ] && ! t.key.includes( '#' ) ) || list[ 0 ];
	};
	AV.routeNow = () => ( location.hash || '#/overview' ).replace( /^#\/?/, '' ).replace( '/', ':' ) || 'overview';
	AV.HelpDrawer = function HelpDrawer( { route, onClose } ) {
		const ctx = useApp();
		const t = AV.helpFor( route );
		const url = window.AVM_HELP.base + t.doc + '/';
		return h( AV.Drawer, { title: t.t, kicker: 'How to', onClose, width: 420,
			footer: h( Fragment, null,
				h( Button, { variant: 'tertiary', onClick: () => { onClose(); ctx.go( 'help' ); } }, 'All guides' ),
				h( Button, { variant: 'secondary', icon: h( I, { icon: 'external' } ), onClick: () => AV.ext( ctx.notify, 'the contact form on atlasaidev.com' ) }, 'Contact support' ) ) },
			h( AV.DS, { title: 'Do it in ' + t.steps.length + ' steps' }, h( 'ol', { className: 'atlasvoice-help-steps' }, t.steps.map( ( s ) => h( 'li', { key: s }, s ) ) ) ),
			h( AV.DS, { title: 'Need more?' },
				h( 'div', { className: 'atlasvoice-help-links' },
					h( 'button', { type: 'button', className: 'atlasvoice-help-link', onClick: () => AV.ext( ctx.notify, 'the guide ' + url ) },
						h( I, { icon: 'page' } ), h( 'span', null, h( 'b', null, 'Read the guide' ), h( 'small', null, 'Every step with pictures. Opens atlasaidev.com in a new tab.' ) ), h( I, { icon: 'external', size: 16 } ) ),
					h( 'button', { type: 'button', className: 'atlasvoice-help-link', onClick: () => AV.ext( ctx.notify, 'the video on YouTube' ) },
						h( 'span', { className: 'atlasvoice-help-play', 'aria-hidden': true }, '▶' ), h( 'span', null, h( 'b', null, 'Watch the video · ' + t.vid ), h( 'small', null, 'The same steps on screen. Opens YouTube in a new tab.' ) ), h( I, { icon: 'external', size: 16 } ) ) ) ) );
	};
	/* In the header of every screen: opens the help for the screen, tab or setup step you are on. */
	AV.HelpButton = function HelpButton() {
		const [ route, setRoute ] = useState( null );
		return h( Fragment, null,
			h( Button, { variant: 'tertiary', className: 'atlasvoice-howto', onClick: () => setRoute( AV.routeNow() ), 'aria-haspopup': 'dialog' }, 'How to' ),
			route && h( AV.HelpDrawer, { route, onClose: () => setRoute( null ) } ) );
	};
	/* Next to a section title, when the section is a task of its own. */
	AV.HelpIcon = function HelpIcon( { topic } ) {
		const [ open, setOpen ] = useState( false );
		const t = AV.helpFor( topic );
		return h( Fragment, null,
			h( Button, { className: 'atlasvoice-help-icon', icon: h( I, { icon: 'help', size: 20 } ), label: 'How to: ' + t.t, showTooltip: true, onClick: () => setOpen( true ) } ),
			open && h( AV.HelpDrawer, { route: topic, onClose: () => setOpen( false ) } ) );
	};

	/* ------------------------------------------- upgrade to Pro, free only (v3.1) */
	/* Home, after setup is finished. One card, can be hidden for 30 days. Links only: no Pro form. */
	AV.ProCard = function ProCard() {
		const ctx = useApp();
		const [ hidden, setHidden ] = useState( false );
		if ( hidden ) return null;
		return h( 'div', { className: 'atlasvoice-section' }, h( 'div', { className: 'atlasvoice-procard' },
			h( 'div', { className: 'atlasvoice-procard-text' },
				h( 'h2', null, h( AV.Pro ), ' Do more with Pro' ),
				h( 'ul', null, h( 'li', null, '380 natural voices in 43 languages, with no monthly limit' ), h( 'li', null, 'Audio for all your posts at once, in every language' ), h( 'li', null, 'Full listening statistics and a weekly email report' ) ) ),
			h( 'div', { className: 'atlasvoice-procard-end' },
				h( Button, { variant: 'secondary', onClick: () => ctx.go( 'plans' ) }, 'See Pro plans' ),
				h( Button, { variant: 'link', onClick: () => AV.ext( ctx.notify, 'the demo page with every Pro voice' ) }, 'Hear the Pro voices' ),
				h( Button, { variant: 'tertiary', onClick: () => { setHidden( true ); ctx.notify( 'Hidden for 30 days. Plans stay under Account & plans.' ); } }, 'Not now' ) ) ) );
	};
}( window.AVM ) );
