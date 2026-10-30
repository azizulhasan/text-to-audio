/*
 * AtlasVoice redesign mockup, part 4: state, routing and the app root.
 *
 * Routes are hash routes, as in today's dashboard. Every old route keeps
 * working and lands on its new home: #/customize opens Player, #/aliases
 * opens Pronunciation, and so on (see OLD below and DESIGN.md).
 */
( function ( AV ) {
	const { h, Fragment, useState, useEffect, C, I } = AV;
	const { Button, Modal, SnackbarList, TextControl } = C;
	const { VStack } = AV;

	const OLD = { '': 'overview', customize: 'player', listening: 'voice', integrations: 'providers', highlight: 'player:read', analytics: 'insights', seo: 'seo', compatibility: 'health', aliases: 'pronunciation', maintenance: 'library:clean', versions: 'versions', faq: 'docs', plugins: 'more' };
	const parse = () => {
		const raw = location.hash.replace( /^#\/?/, '' ).split( '?' )[ 0 ];
		if ( OLD[ raw ] !== undefined && ! AV.TITLES[ raw ] ) return OLD[ raw ];
		const [ s, sub ] = raw.split( '/' );
		return AV.TITLES[ s ] ? s + ( sub ? ':' + sub : '' ) : 'overview';
	};

	function GlobalModal( { m, onClose } ) {
		const [ typed, setTyped ] = useState( '' );
		const blocked = m.typed && typed !== m.typed;
		return h( Modal, { title: m.title, onRequestClose: onClose, size: 'medium' }, h( VStack, { spacing: 4 },
			m.body,
			m.typed && h( TextControl, { ...AV.N, label: 'Type ' + m.typed + ' to confirm', value: typed, onChange: setTyped, autoComplete: 'off' } ),
			h( 'div', { className: 'atlasvoice-modal-foot' }, m.onOk && h( Button, { variant: 'tertiary', onClick: onClose }, 'Cancel' ), h( Button, { variant: m.destructive ? 'primary' : 'primary', isDestructive: m.destructive, disabled: blocked, onClick: () => { onClose(); m.onOk && m.onOk(); } }, m.ok || 'OK' ) ) ) );
	}
	function useWidth() {
		const [ w, setW ] = useState( window.innerWidth );
		useEffect( () => { const f = () => setW( window.innerWidth ); window.addEventListener( 'resize', f ); return () => window.removeEventListener( 'resize', f ); }, [] );
		return w;
	}

	function App( { plan, scn0 } ) {
		const params = new URLSearchParams( location.search );
		const free = plan === 'free';
		const [ scn, setScn ] = useState( scn0 );
		const fresh = scn === 'new';
		const [ view, setViewState ] = useState( params.get( 'view' ) || 'app' );
		const [ route, setRoute ] = useState( parse );
		/* Pro-only places do not exist in free: their links land on the free home. */
		const freeRoute = { licence: 'plans', 'library:clean': 'library' };
		const [ screen, sub ] = ( free && freeRoute[ route ] || route ).split( ':' );
		const [ snacks, setSnacks ] = useState( [] );
		const [ dialog, setDialog ] = useState( null );
		const [ railOpen, setRailOpen ] = useState( false );
		const [ picker, setPicker ] = useState( false );
		const [ mode, setMode ] = useState( fresh ? 'staging' : 'live' );
		const [ engine, setEngine ] = useState( fresh ? 'browser' : free ? 'atlas' : 'cloud' );
		const [ voice, setVoice ] = useState( fresh ? 'gb' : free ? 'bf_emma' : 'sarah' );
		const [ browserStyle, setBrowserStyle ] = useState( 'simple' );
		const [ conn, setConn ] = useState( 'ok' );
		const [ lic, setLic ] = useState( 'active' );
		const [ analytics, setAnalytics ] = useState( true );
		const [ look, setLook ] = useState( { preset: 'classic', bg: '#184c53', fg: '#ffffff', shape: 'rounded', size: 'm', width: 'full', hoverBg: '#000000', hoverFg: '#ffffff', border: '0px', borderColor: '#000000', fontSize: '18px', radius: '12px', margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' } } );
		const [ ai, setAi ] = useState( { on: false, text: AV.AI_TXT, pos: 'after' } );
		const [ place, setPlace ] = useState( { pos: 'before', dock: 'bottom', who: 'all', dl: 'all' } );
		const [ words, setWords ] = useState( { listen: 'Listen', pause: 'Pause', resume: 'Resume', replay: 'Replay', time: 'Listen in %d min', icon: true, gear: true, mem: true, p2listen: 'Listen', p2pause: 'Pause' } );
		const [ read, setRead ] = useState( { on: false, mode: 's', sentence: '#e8e7fe', word: '#a5abf0', dim: true, dimBy: 70, follow: true, sel: false, ann: 'tip' } );
		const [ content, setContent ] = useState( { auto: true, types: free ? [ 'Posts' ] : [ 'Posts', 'Pages', 'Products' ], cats: [ 'Podcasts' ], tags: [], posts: [ 'Spring newsletter' ], status: 'publish', title: true, excerpt: false, intro: 'You are listening to The Reading Site.', outro: '', numbers: true, acf: [ 'Recipe intro' ], order: false, dom: false, wrap: true, status_col: true } );
		const [ providers, setProviders ] = useState( { google: ! free, openai: false, eleven: ! free } );
		const [ aliases, setAliases ] = useState( [ { id: 1, from: 'WP', to: 'WordPress', num: false } ].concat( free ? [] : [ { id: 2, from: 'AtlasVoice', to: 'Atlas Voice', num: false }, { id: 3, from: '2026', to: 'twenty twenty-six', num: true }, { id: 4, from: 'km', to: 'kilometres', num: false } ] ) );
		const [ notices, setNotices ] = useState( [ fresh && { id: 'staging' }, scn === 'bad' && free && { id: 'usage' }, { id: 'update' }, { id: 'lang' }, ! fresh && { id: 'review' }, { id: 'other' } ].filter( Boolean ) );
		const setupSteps = [ [ 'hear', 'Hear it' ], [ 'where', 'Where' ], [ 'voice', 'Voice' ], [ 'look', 'Look' ], ! free && [ 'mp3', 'Audio files', true ], ! free && [ 'report', 'Reports', true ], [ 'live', 'Check and go live' ], [ 'done', 'Done' ] ].filter( Boolean ).map( ( [ id, label ] ) => ( { id, label } ) );
		const [ setup, setSetup ] = useState( { current: 'hear', done: fresh ? [] : setupSteps.map( ( s ) => s.id ), finished: ! fresh, draft: { heard: false, types: [ 'Posts' ], engine: free ? 'atlas' : 'cloud', email: '', consent: false, provider: 'google', key: '', keyOk: false, preset: 'classic', shape: 'rounded', dl: 'all', from: '', to: '', report: true, freq: 'w', reportTo: 'rahima@example.com', checked: false, count: true, golive: 'live' } } );
		/* Audio Jobs (TTS-354): shared by the Audio library, the editor panel, the
		   posts list and the status bar, so they always agree. */
		const [ posts, setPosts ] = useState( () => ( fresh ? AV.freshPosts() : AV.POSTS ) );
		const [ queue, setQueue ] = useState( null );
		const [ today, setToday ] = useState( fresh ? 0 : 38400 );
		const [ audio, setAudio ] = useState( { when: 'play', change: 'mark', perDay: 200000, largest: 60000, visitorsStart: true, langs: [ 'English', 'Spanish', 'French' ], workers: 3 } );
		/* Make a post's audio: one job per language that needs it; finished parts are kept on a retry. */
		const makeAudio = ( ids, opts = {} ) => setPosts( ( list ) => list.map( ( p ) => ( ! ids.includes( p.id ) ? p : { ...p, langs: p.langs.map( ( l, i ) => {
			if ( free && i ) return l;
			if ( opts.only && opts.only !== l.l ) return l;
			const need = l.st === 'Missing' || l.st === 'Outdated' || ( l.st === 'Failed' && opts.retry !== false ) || opts.force;
			if ( ! need || l.st === 'Making' ) return l;
			return { ...l, st: 'Making', total: AV.partsOf( p.chars ), part: l.st === 'Failed' ? l.part : 0, reason: opts.why || 'Started by you just now', src: l.src === 'Not checked' ? 'Page area rule' : l.src };
		} ) } ) ) );
		useEffect( () => {
			const t = setInterval( () => setPosts( ( list ) => {
				let slots = audio.workers, gained = 0, changed = false;
				const next = list.map( ( p ) => {
					if ( ! p.langs.some( ( l ) => l.st === 'Making' ) ) return p;
					if ( slots <= 0 ) return p;
					slots--;
					changed = true;
					return { ...p, langs: p.langs.map( ( l ) => {
						if ( l.st !== 'Making' ) return l;
						gained += 1400;
						return l.part + 1 >= l.total ? { ...l, st: 'Ready', part: 0, total: 0, made: 'just now', dur: Math.max( 1, Math.round( p.chars / 900 ) ) + ':' + String( p.chars % 60 ).padStart( 2, '0' ), reason: '' } : { ...l, part: l.part + 1 };
					} ) };
				} );
				if ( gained ) setToday( ( x ) => x + gained );
				return changed ? next : list;
			} ), 700 );
			return () => clearInterval( t );
		}, [ audio.workers ] );
		const width = useWidth();
		const usage = scn === 'bad' ? 96 : fresh ? 0 : 23;

		const notify = ( content2 ) => setSnacks( ( s ) => s.slice( -2 ).concat( { id: Date.now() + Math.random(), content: content2 } ) );
		const writeUrl = ( r, v ) => { const u = new URL( location ); u.hash = '/' + r.replace( ':', '/' ); if ( v && v !== 'app' ) u.searchParams.set( 'view', v ); else u.searchParams.delete( 'view' ); try { history.replaceState( null, '', u ); } catch ( e ) {} };
		const go = ( id ) => { setRoute( id ); setRailOpen( false ); writeUrl( id, 'app' ); setViewState( 'app' ); };
		const setRouteSilently = ( id ) => writeUrl( id, view );
		const setView = ( v ) => { setViewState( v ); if ( v !== 'front' ) setPicker( false ); writeUrl( route, v ); const s = document.getElementById( 'mock-view' ); if ( s ) s.value = v; };
		const openPicker = () => { setPicker( true ); setView( 'front' ); setPicker( true ); };
		const askMode = ( target ) => setDialog( target === 'live'
			? { title: 'Go live?', body: h( Fragment, null, h( 'p', null, 'Everyone who visits your site will see and hear the player.' ), h( AV.KV, { rows: [ [ 'Shown on', content.types.join( ', ' ) ], [ 'Voice', AV.voiceName( voice ) + ' · ' + AV.ENGINES[ engine ] ], [ 'Shown to', place.who === 'all' ? 'Everyone' : 'Some user roles' ] ] } ) ), ok: 'Go live', onOk: () => { setMode( 'live' ); setNotices( ( n ) => n.filter( ( x ) => x.id !== 'staging' ) ); notify( 'You’re live. Visitors can hear your posts.' ); } }
			: { title: 'Go back to staging?', body: h( Fragment, null, h( 'p', null, 'The player disappears for visitors. Only logged-in admins can see it.' ), h( 'p', { className: 'atlasvoice-weak' }, 'Your audio files and settings are kept.' ) ), ok: 'Back to staging', destructive: true, onOk: () => { setMode( 'staging' ); notify( 'Back in staging. Only admins see the player.' ); } } );

		useEffect( () => {
			const f = () => { setRoute( parse() ); };
			window.addEventListener( 'hashchange', f );
			const sel = document.getElementById( 'mock-view' );
			const onSel = () => setView( sel.value );
			sel && ( sel.value = view, sel.addEventListener( 'change', onSel ) );
			return () => { window.removeEventListener( 'hashchange', f ); sel && sel.removeEventListener( 'change', onSel ); };
		}, [ route ] );

		const ctx = { screen, go, free, notify, modal: setDialog, scn, setScn, mode, setMode, askMode, engine, setEngine, voice, setVoice, browserStyle, setBrowserStyle, conn, setConn, usage, lic, setLic, analytics, setAnalytics, look, setLook, ai, setAi, place, setPlace, words, setWords, read, setRead, content, setContent, providers, setProviders, aliases, setAliases, notices, setNotices, setup, setSetup, setupSteps, setView, openPicker, picker, setPicker, setRouteSilently, posts, setPosts, makeAudio, today, audio, setAudio, queue, setQueue };
		const issues = AV.issues( ctx );
		const actions = {
			overview: mode === 'staging' ? h( Button, { variant: 'primary', onClick: () => askMode( 'live' ) }, 'Go live…' ) : h( Button, { variant: 'secondary', icon: h( I, { icon: 'seen', size: 20 } ), onClick: () => setView( 'front' ) }, 'View as a visitor' ),
			player: h( Button, { variant: 'secondary', icon: h( I, { icon: 'seen', size: 20 } ), onClick: () => setView( 'front' ) }, 'View as a visitor' ),
			content: h( Button, { variant: 'primary', onClick: openPicker }, 'Pick on a page' ),
			library: ! free && engine !== 'browser' && h( Button, { variant: 'primary', onClick: () => setQueue( 'missing' ) }, 'Make missing audio' ),
		};
		const chips = {
			overview: h( AV.Chip, { tone: mode === 'live' ? 'ok' : 'warn', dot: true }, mode === 'live' ? 'Live' : 'Staging' ),
			health: issues.length > 0 && h( AV.Chip, { tone: issues.some( ( x ) => x[ 0 ] === 'err' ) ? 'err' : 'warn' }, issues.length + ( issues.length === 1 ? ' thing needs you' : ' things need you' ) ),
			seo: free && h( AV.Pro ),
		};
		let inner;
		if ( view === 'app' ) {
			const Screen = AV.S[ screen ] || AV.S.overview;
			inner = h( 'div', { className: 'atlasvoice-root' + ( width < 1280 && width >= 782 ? ' is-compact-rail' : '' ) },
				h( AV.Rail, { open: railOpen, setOpen: setRailOpen } ),
				h( AV.Header, { actions: actions[ screen ], chip: chips[ screen ], onMenu: () => setRailOpen( true ), narrow: width < 960 } ),
				h( 'div', { className: 'atlasvoice-work' }, h( Screen, { key: route + free + scn, sub } ) ),
				h( AV.StatusBar ),
				dialog && h( GlobalModal, { m: dialog, onClose: () => setDialog( null ) } ),
				h( 'div', { className: 'atlasvoice-snackbars' }, h( SnackbarList, { notices: snacks, onRemove: ( id ) => setSnacks( ( s ) => s.filter( ( x ) => x.id !== id ) ) } ) ) );
		} else {
			const V = AV.V[ view ] || AV.V.front;
			inner = h( 'div', { className: 'atlasvoice-root is-view' },
				h( V, { key: view + free } ),
				dialog && h( GlobalModal, { m: dialog, onClose: () => setDialog( null ) } ),
				h( 'div', { className: 'atlasvoice-snackbars' }, h( SnackbarList, { notices: snacks, onRemove: ( id ) => setSnacks( ( s ) => s.filter( ( x ) => x.id !== id ) ) } ) ) );
		}
		const app = h( AV.Ctx.Provider, { value: ctx }, inner );
		return AV.ThemeProvider ? h( AV.ThemeProvider, { color: { primary: AV.BRAND } }, app ) : app;
	}

	/* The Mockup and Site switches restart the app in place (no page reload),
	   so the mockup also works inside a sandboxed frame such as a shared Artifact. */
	function Root() {
		const p = new URLSearchParams( location.search );
		const [ s, setS ] = useState( { plan: p.get( 'plan' ) || 'pro', scn: p.get( 'scn' ) || 'live' } );
		useEffect( () => {
			const els = [ [ 'mock-plan', 'plan' ], [ 'mock-scn', 'scn' ] ].map( ( [ id, key ] ) => {
				const sel = document.getElementById( id );
				sel.value = s[ key ];
				const fn = () => setS( ( o ) => {
					const n = { ...o, [ key ]: sel.value };
					try { const u = new URL( location ); u.searchParams.set( key, sel.value ); history.replaceState( null, '', u ); } catch ( e ) {}
					return n;
				} );
				sel.addEventListener( 'change', fn );
				return () => sel.removeEventListener( 'change', fn );
			} );
			return () => els.forEach( ( off ) => off() );
		}, [] );
		return h( App, { key: s.plan + s.scn, plan: s.plan, scn0: s.scn } );
	}
	wp.domReady( () => {
		wp.element.createRoot( document.getElementById( 'atlasvoice-app' ) ).render( h( Root ) );
	} );
}( window.AVM ) );
