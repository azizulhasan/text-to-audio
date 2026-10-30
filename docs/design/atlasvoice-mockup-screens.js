/*
 * AtlasVoice redesign mockup, part 2: every settings screen.
 * Voice, Pronunciation, Languages, Your own provider, AtlasVoice account,
 * Player, What is read, Audio library, Insights, SEO & AI Search, Health,
 * Versions, Advanced, Privacy, Plans, Licence, Documentation, More plugins.
 */
( function ( AV ) {
	const { h, Fragment, useState, useEffect, C, I, useApp } = AV;
	const { Button, Card, CardBody, CardHeader, Notice, SelectControl, TextControl, TextareaControl, ToggleControl, CheckboxControl, RangeControl, SearchControl, Spinner, FormToggle } = C;
	const { ItemGroup, Item, HStack, VStack, N, NM } = AV;
	const opt = ( list ) => list.map( ( x ) => ( Array.isArray( x ) ? { value: x[ 0 ], label: x[ 1 ] } : { value: x, label: x } ) );
	const tone = ( t ) => ( { ok: '#007f30', warn: '#926300', err: '#cc1818', info: '#006bd7' }[ t ] || '#757575' );
	const COLORS = [ { name: 'Teal', color: '#184c53' }, { name: 'Indigo', color: '#5646e5' }, { name: 'Ink', color: '#1e1e1e' }, { name: 'Cyan', color: '#0e7490' }, { name: 'Amber', color: '#b45309' }, { name: 'Rose', color: '#be185d' }, { name: 'White', color: '#ffffff' }, { name: 'Paper', color: '#f2f0ea' } ];
	const contrast = ( a, b ) => {
		const l = ( hx ) => { const c = hx.replace( '#', '' ); const r = [ 0, 2, 4 ].map( ( i ) => { const v = parseInt( c.substr( i, 2 ), 16 ) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow( ( v + 0.055 ) / 1.055, 2.4 ); } ); return 0.2126 * r[ 0 ] + 0.7152 * r[ 1 ] + 0.0722 * r[ 2 ]; };
		try { const x = l( a ), y = l( b ); return ( Math.max( x, y ) + 0.05 ) / ( Math.min( x, y ) + 0.05 ); } catch ( e ) { return 21; }
	};
	/* Shared live preview column (Voice and Player screens). */
	function Preview( { look, ai, which, setWhich, st, setSt, extra } ) {
		const ctx = useApp();
		const [ dark, setDark ] = useState( 'light' );
		const [ dev, setDev ] = useState( 'desktop' );
		const states = which === 'browser' ? [ [ 'idle', 'Ready' ], [ 'playing', 'Playing' ], [ 'paused', 'Paused' ], [ 'ended', 'Finished' ], [ 'blocked', 'Phone blocked' ] ] : [ [ 'idle', 'Ready' ], [ 'generating', 'Making' ], [ 'progressive', 'First part playing' ], [ 'joined', 'Joined someone’s job' ], [ 'playing', 'Playing' ], [ 'failed', 'Failed' ], [ 'fallback', 'Device-voice fallback' ], [ 'limit', 'Daily limit reached' ], [ 'outdated', 'Outdated (editors see)' ], [ 'quota', 'Used up' ] ];
		const state = states.some( ( s ) => s[ 0 ] === st ) ? st : 'idle';
		const docked = extra === 'dock';
		return h( 'aside', { className: 'atlasvoice-preview', 'aria-label': 'Live preview' },
			h( 'div', { className: 'atlasvoice-preview-head' }, h( 'b', null, 'Live preview' ), h( AV.Chip, { tone: 'info' }, 'Updates as you change settings' ) ),
			setWhich && h( SelectControl, { ...N, label: 'Player', value: which, onChange: setWhich, options: opt( [ [ 'browser', 'Browser voice' ], [ 'mp3', 'Natural voice (MP3)' ] ].concat( ctx.free ? [] : [ [ 'cloud', 'AtlasVoice Cloud' ] ] ) ) } ),
			h( SelectControl, { ...N, label: 'State', value: state, onChange: setSt, options: opt( states ) } ),
			h( HStack, { wrap: true }, h( AV.TG, { label: 'Site', hide: true, value: dark, onChange: setDark, options: [ [ 'light', 'Light site' ], [ 'dark', 'Dark site' ] ] } ), h( AV.TG, { label: 'Device', hide: true, value: dev, onChange: setDev, options: [ [ 'desktop', 'Desktop' ], [ 'phone', 'Phone' ] ] } ) ),
			h( AV.Site, { dark: dark === 'dark', phone: dev === 'phone' },
				docked ? h( 'div', { className: 'atlasvoice-player-slot' }, 'Space kept while the player is docked' ) : h( AV.Player, { form: which === 'browser' ? 'button' : 'bar', state, look: dev === 'phone' ? { ...look, width: 'full' } : look, ai, staging: ctx.mode === 'staging', voice: which === 'cloud' ? 'Sarah · AtlasVoice Cloud' : which === 'browser' ? 'Browser voice' : 'Emma · Natural voice', lang: which === 'cloud', credit: which === 'mp3' && ctx.free, onAct: ( a ) => { if ( a === 'play' || a === 'pause' ) setSt( a === 'play' ? 'playing' : 'paused' ); else if ( a === 'retry' ) setSt( 'generating' ); else ctx.notify( { speed: 'On your site this opens the speed menu: 0.5× to 2×.', download: 'On your site this downloads the MP3.', lang: 'On your site this switches the language of the audio.', undock: 'On your site this scrolls back to the player.', remake: 'Remake started: one job on the server, about 6,200 characters.' }[ a ] ); } } ),
				docked && h( 'div', { style: { display: 'flex', justifyContent: 'center' } }, h( AV.Player, { form: 'dock', look } ) ),
				extra === 'pop' && which === 'browser' && h( AV.PlayerPop ) ),
			extra === 'usage' && h( Card, null, h( CardBody, null, h( AV.Usage ) ) ),
			h( 'p', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, ctx.mode === 'staging' ? 'The yellow note is shown to you only, while you are in staging.' : 'Exactly what visitors see.', which === 'mp3' && ctx.free ? ' “Voiced by AtlasVoice” appears only when the free service asks for it.' : '' ) );
	}
	AV.Preview = Preview;

	/* ================================================================ voice */
	const CONN = {
		ok: [ 'success', 'Connected as rahima@example.com', 'Post text is sent only to make the audio, then deleted. The MP3 stays on your site.', [ 'Connection details' ] ],
		wait: [ 'warning', 'One step left: approve this site from your email', 'We sent a link to rahima@example.com. Until you approve, posts use the browser voice.', [ 'Send the email again' ] ],
		owned: [ 'warning', 'This site is connected to another AtlasVoice account', 'It belongs to ra••••@agency.com. If you own this site, move it to your email; we confirm it with a one-time check on your site.', [ 'Move this site to my email' ] ],
		revoked: [ 'error', 'This site was disconnected', 'Its key was revoked from the AtlasVoice dashboard, so posts use the browser voice. Audio already made keeps playing.', [ 'Connect again' ] ],
		seats: [ 'warning', 'Your Pro licence covers no more sites', 'So this site uses the free 100,000 characters a month. It becomes unlimited within an hour of freeing a site.', [ 'Manage your sites' ] ],
	};
	function ConnDrawer( { onClose } ) {
		const ctx = useApp();
		const [ email, setEmail ] = useState( ctx.free ? 'rahima@example.com' : 'admin@thereadingsite.com' );
		const [ help, setHelp ] = useState( true );
		const [ dirty, saved ] = AV.useDirty( { email, help } );
		return h( AV.Drawer, { title: 'Natural voice connection', kicker: 'AtlasVoice service · atlasvoice.cloud', onClose, footer: h( Fragment, null,
			h( Button, { variant: 'secondary', isDestructive: true, className: 'atlasvoice-footer-note', onClick: () => ctx.modal( { title: 'Disconnect the natural voice?', body: h( 'p', null, 'New audio uses the browser voice until you connect again. Audio already made keeps playing.' ), ok: 'Disconnect', destructive: true, onOk: () => { ctx.setConn( 'revoked' ); onClose(); ctx.notify( 'Disconnected. Posts use the browser voice.' ); } } ) }, 'Disconnect' ),
			h( Button, { variant: 'primary', disabled: ! dirty, onClick: () => { saved(); ctx.notify( 'Connection saved.' ); } }, 'Save' ) ) },
			! ctx.free && h( AV.DS, null, h( Notice, { status: 'info', isDismissible: false }, 'Pro connected this site automatically when the first audio was made, using the site admin email, and attached your licence. You can change the email or disconnect here.' ) ),
			h( AV.DS, null, h( VStack, { spacing: 4 },
				h( TextControl, { ...N, type: 'email', label: 'Email for usage notices', value: email, onChange: setEmail } ),
				h( AV.KV, { rows: [ [ 'Site key', h( 'span', { className: 'atlasvoice-mono' }, 'avk_live_3f2…9c1' ) ], [ 'Plan', ctx.free ? 'Free · 100,000 characters a month' : 'Pro · unlimited' ], [ 'Connected', '18 Oct 2026' ] ] } ),
				h( CheckboxControl, { ...NM, label: 'Send anonymous error reports to help improve AtlasVoice', checked: help, onChange: setHelp } ) ) ),
			h( AV.DS, { title: 'Your AtlasVoice dashboard' }, h( 'p', { className: 'atlasvoice-weak', style: { marginBottom: 8 } }, 'Invoices, all your sites and API keys live at app.atlasvoice.cloud.' ), h( Button, { variant: 'secondary', icon: h( I, { icon: 'external' } ), onClick: () => AV.ext( ctx.notify, 'app.atlasvoice.cloud' ) }, 'Open my AtlasVoice dashboard' ) ) );
	}
	function LangDrawer( { onClose } ) {
		return h( AV.Drawer, { title: 'What each language gets', onClose },
			h( AV.DS, null, h( AV.Table, { head: [ 'Language', 'Browser', 'Natural · free', 'Studio · Pro' ] },
				[ [ 'English', 1, 1, 1 ], [ 'Español', 1, 1, 1 ], [ 'Français', 1, 1, 1 ], [ 'Português (Brasil)', 1, 1, 1 ], [ 'Українська', 1, 0, 1 ], [ 'বাংলা', 1, 0, 1 ], [ 'Hrvatski', 1, 0, 1 ] ].map( ( r ) => h( 'tr', { key: r[ 0 ] }, h( 'td', null, r[ 0 ] ), r.slice( 1 ).map( ( v, i ) => h( 'td', { key: i }, v ? h( AV.Chip, { tone: 'ok' }, 'Yes' ) : h( AV.Chip, null, 'No' ) ) ) ) ) ) ),
			h( AV.DS, null, h( 'p', { className: 'atlasvoice-weak' }, 'Browser voices depend on the visitor’s device. “No” means the free natural voice reads that language with the closest voice it has.' ) ) );
	}
	AV.S.voice = function Voice() {
		const ctx = useApp();
		const { free, notify, scn } = ctx;
		const [ d, setD ] = useState( { engine: ctx.engine, voice: ctx.voice, rate: 1, pitch: 1, volume: 1, style: ctx.browserStyle, filter: 'all', q: '' } );
		const up = ( p ) => setD( ( x ) => ( { ...x, ...p } ) );
		const [ dirty, saved ] = AV.useDirty( { e: d.engine, v: d.voice, r: d.rate, p: d.pitch, vo: d.volume, s: d.style } );
		const [ drawer, setDrawer ] = useState( null );
		const [ favs, setFavs ] = useState( { bf_emma: true, sarah: true } );
		const [ st, setSt ] = useState( 'playing' );
		const engines = [
			{ id: 'atlas', title: 'Natural voice', badge: free && h( AV.Chip, { tone: 'info' }, 'Recommended' ), text: 'AtlasVoice TTS, saved as MP3. ' + ( free ? '100,000 characters a month free.' : 'Unlimited with Pro.' ), icon: 'audio' },
			{ id: 'browser', title: 'Browser voice', text: 'Free, no account. The voice changes from device to device.', icon: 'desktop' },
			! free && { id: 'cloud', title: 'AtlasVoice Cloud', badge: h( AV.Chip, { tone: 'ok' }, 'In your licence' ), text: '374 studio voices in 43 languages.', icon: 'cloud' },
			{ id: 'own', title: 'Your own provider', text: 'Google Cloud, OpenAI or ElevenLabs, billed by them.', icon: 'key' },
		].filter( Boolean );
		const groups = AV.VOICES[ d.engine ] || [];
		const conn = scn === 'new' && d.engine === 'atlas' ? 'none' : ctx.conn;
		const which = d.engine === 'browser' ? 'browser' : d.engine === 'cloud' ? 'cloud' : 'mp3';
		const pickVoice = ( id ) => { up( { voice: id } ); };
		return h( AV.Pane, { footer: h( AV.SaveBar, { dirty, onSave: () => { ctx.setEngine( d.engine ); ctx.setVoice( d.voice ); ctx.setBrowserStyle( d.style ); saved(); notify( 'Voice saved. New audio uses ' + AV.voiceName( d.voice ) + '. Audio already made keeps playing.' ); } } ) },
			h( 'div', { className: 'atlasvoice-withpreview' },
				h( AV.Scroll, { width: 860 },
					h( AV.Section, { title: 'What makes the sound', desc: 'You can switch at any time. Audio already made keeps playing.' }, h( AV.Tiles, { value: d.engine, onChange: ( v ) => up( { engine: v, voice: AV.VOICES[ v ][ 0 ][ 2 ][ 0 ][ 0 ] } ), options: engines } ) ),
					d.engine === 'atlas' && conn !== 'none' && h( 'div', { className: 'atlasvoice-section' },
						h( AV.MockBar, { label: 'connection state', value: ctx.conn, onChange: ctx.setConn, options: [ [ 'ok', 'Connected' ], [ 'wait', 'Waiting for email' ], [ 'owned', 'Another account' ], [ 'revoked', 'Key revoked' ] ].concat( free ? [] : [ [ 'seats', 'Licence full' ] ] ) } ),
						h( Notice, { status: CONN[ conn ][ 0 ], isDismissible: false, actions: [ { label: CONN[ conn ][ 3 ][ 0 ], onClick: () => conn === 'ok' ? setDrawer( 'conn' ) : conn === 'wait' ? notify( 'Sent again to rahima@example.com.' ) : conn === 'owned' ? ctx.modal( { title: 'Move this site to your email?', body: h( 'p', null, 'We place a one-time file on your site to confirm you own it, then move the site to rahima@example.com. Audio and settings are kept.' ), ok: 'Move it', onOk: () => { ctx.setConn( 'ok' ); notify( 'This site now belongs to rahima@example.com.' ); } } ) : conn === 'revoked' ? ( ctx.setConn( 'ok' ), notify( 'Connected again.' ) ) : AV.ext( notify, 'your sites on app.atlasvoice.cloud' ) } ] }, h( 'b', null, CONN[ conn ][ 1 ] + '. ' ), CONN[ conn ][ 2 ] ) ),
					d.engine === 'atlas' && conn === 'none' && h( 'div', { className: 'atlasvoice-section' }, h( ConnectCard ) ),
					d.engine === 'cloud' && h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: 'success', isDismissible: false, actions: [ { label: 'Connection details', onClick: () => setDrawer( 'conn' ) } ] }, h( 'b', null, 'Connected automatically with your Pro licence. ' ), 'Pro connected this site as admin@thereadingsite.com when the first audio was made; your licence lifts the monthly limit.' ) ),
					d.engine === 'own' && h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: ctx.providers.google ? 'success' : 'warning', isDismissible: false, actions: [ { label: 'Open Your own provider', onClick: () => ctx.go( 'providers' ) } ] }, ctx.providers.google ? 'Google Cloud is connected. Voices below come from your providers; they bill you directly.' : 'Connect a provider first. Until then, posts use the browser voice.' ) ),
					d.engine === 'browser' && ! free && h( 'div', { className: 'atlasvoice-section' }, h( AV.TG, { label: 'Button style', value: d.style, onChange: ( v ) => up( { style: v } ), options: [ [ 'simple', 'Simple button' ], [ 'pro', 'Pro player with progress bar' ] ] } ) ),
					h( AV.Section, { title: 'Voice', desc: 'Press play to hear the voice read your latest post.', end: h( 'div', { style: { width: 220 } }, h( SelectControl, { ...N, label: 'Language', value: 'en-GB', onChange: () => notify( 'Language changed for the mockup.' ), options: opt( [ [ 'en-GB', 'English (UK)' ], [ 'en-US', 'English (US)' ], [ 'es-ES', 'Español' ], [ 'fr-FR', 'Français' ], [ 'bn-BD', 'বাংলা' ] ].concat( d.engine === 'cloud' ? [ [ 'uk-UA', 'Українська · new' ] ] : [] ) ) } ) ) },
						h( HStack, { justify: 'flex-start', wrap: true, style: { marginBottom: 12 } },
							h( 'span', { className: 'atlasvoice-weak' }, 'English (UK) has:' ), h( AV.Chip, null, 'Browser voice' ), h( AV.Chip, { tone: 'ok' }, 'Natural · free' ), h( AV.Chip, { tone: 'brand' }, 'Studio · Pro' ), h( Button, { variant: 'link', onClick: () => setDrawer( 'langs' ) }, 'See every language' ) ),
						d.engine === 'cloud' && h( HStack, { justify: 'flex-start', wrap: true, style: { marginBottom: 12 } },
							h( AV.TG, { label: 'Show', hide: true, value: d.filter, onChange: ( v ) => up( { filter: v } ), options: [ [ 'all', 'All' ], [ '0', 'Natural' ], [ '1', 'Fast' ], [ '2', 'Higher quality' ], [ 'fav', '★ Favourites' ] ] } ),
							h( 'div', { style: { width: 200 } }, h( SearchControl, { ...NM, size: 'compact', value: d.q, onChange: ( v ) => up( { q: v } ), placeholder: 'Search 374 voices' } ) ) ),
						groups.map( ( g, gi ) => {
							if ( d.filter !== 'all' && d.filter !== 'fav' && d.filter !== String( gi ) ) return null;
							const vs = g[ 2 ].filter( ( v ) => ( d.filter !== 'fav' || favs[ v[ 0 ] ] ) && ( ! d.q || v[ 1 ].toLowerCase().includes( d.q.toLowerCase() ) ) );
							if ( ! vs.length ) return null;
							return h( 'div', { key: g[ 0 ], style: { marginBottom: 16 } }, h( 'p', { style: { marginBottom: 8 } }, h( 'b', null, g[ 0 ] ), ' ', h( 'span', { className: 'atlasvoice-weak' }, g[ 1 ] ) ),
								h( 'div', { className: 'atlasvoice-voices', role: 'radiogroup', 'aria-label': g[ 0 ] }, vs.map( ( v, vi ) => h( 'div', { key: v[ 0 ], className: 'atlasvoice-voice' + ( d.voice === v[ 0 ] ? ' is-on' : '' ) },
									h( 'button', { type: 'button', className: 'atlasvoice-voice-pick', role: 'radio', 'aria-checked': d.voice === v[ 0 ], onClick: () => pickVoice( v[ 0 ] ) },
									h( 'span', { className: 'atlasvoice-avatar', style: { background: [ '#5646e5', '#0e7490', '#b45309', '#7c4dff', '#027a48', '#be185d' ][ ( gi * 4 + vi ) % 6 ] } }, v[ 1 ][ 0 ] ),
									h( 'span', { className: 'atlasvoice-voice-text' }, h( 'b', null, v[ 1 ] ), h( 'small', null, v[ 2 ] ) ) ),
									h( Button, { size: 'small', icon: h( I, { icon: favs[ v[ 0 ] ] ? 'star-filled' : 'star-empty', size: 20 } ), label: ( favs[ v[ 0 ] ] ? 'Remove ' : 'Add ' ) + v[ 1 ] + ' to favourites', isPressed: !! favs[ v[ 0 ] ], onClick: ( e ) => { e.stopPropagation(); setFavs( { ...favs, [ v[ 0 ] ]: ! favs[ v[ 0 ] ] } ); } } ),
									h( Button, { size: 'small', variant: 'secondary', label: 'Play a sample of ' + v[ 1 ], onClick: ( e ) => { e.stopPropagation(); setSt( 'playing' ); notify( 'Playing ' + v[ 1 ] + ' reading the first paragraph.' ); } }, 'Play' ) ) ) ) );
						} ),
						free && h( AV.ProNote, null, '374 studio voices in 43 languages, included in the licence.' ) ),
					h( Card, null, h( C.PanelBody, { title: 'Speed' + ( d.engine === 'browser' ? ', pitch and volume' : '' ), initialOpen: false },
						h( VStack, { spacing: 4 },
							h( RangeControl, { ...NM, label: 'Speed', value: d.rate, min: 0.5, max: 2, step: 0.1, onChange: ( v ) => up( { rate: v } ) } ),
							d.engine === 'browser' && h( RangeControl, { ...NM, label: 'Pitch', value: d.pitch, min: 0, max: 2, step: 0.1, onChange: ( v ) => up( { pitch: v } ) } ),
							d.engine === 'browser' && h( RangeControl, { ...NM, label: 'Volume', value: d.volume, min: 0, max: 1, step: 0.1, onChange: ( v ) => up( { volume: v } ) } ) ) ) ) ),
				h( Preview, { look: ctx.look, ai: null, which, st, setSt, extra: d.engine !== 'browser' && d.engine !== 'own' && 'usage' } ) ),
			drawer === 'conn' && h( ConnDrawer, { onClose: () => setDrawer( null ) } ),
			drawer === 'langs' && h( LangDrawer, { onClose: () => setDrawer( null ) } ) );
	};
	function ConnectCard() {
		const ctx = useApp();
		const [ email, setEmail ] = useState( '' );
		const [ ok, setOk ] = useState( false );
		const [ busy, setBusy ] = useState( false );
		const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test( email ) && ok;
		return h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Connect the natural voice' ) ), h( CardBody, null, h( VStack, { spacing: 4 },
			h( TextControl, { ...N, type: 'email', label: 'Email for usage notices', value: email, onChange: setEmail } ),
			h( CheckboxControl, { ...NM, label: 'Send post text to AtlasVoice to make the audio', help: 'It is deleted right after; the MP3 is saved on your site. Nothing is sent until you press Connect.', checked: ok, onChange: setOk } ),
			h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'primary', disabled: ! valid, isBusy: busy, onClick: () => { setBusy( true ); setTimeout( () => { setBusy( false ); ctx.setConn( 'wait' ); ctx.setScn( 'live' ); ctx.notify( 'Connected. We sent a link to ' + email + '; posts use the natural voice right away.' ); }, 1200 ); } }, 'Connect' ),
				! valid && h( 'span', { className: 'atlasvoice-weak' }, ! /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test( email ) ? 'Add your email first' : 'Tick the box to continue' ),
				h( Button, { variant: 'link', onClick: () => AV.ext( ctx.notify, 'the AtlasVoice privacy policy' ) }, 'Privacy policy' ) ) ) ) );
	}

	/* -------------------------------------------------------- pronunciation */
	AV.S.pronunciation = function Pronunciation() {
		const ctx = useApp();
		const { free, aliases, setAliases, notify } = ctx;
		const [ edit, setEdit ] = useState( null );
		const [ txt, setTxt ] = useState( 'Our WP site reached 2026 readers in one week.' );
		const read = aliases.reduce( ( s, a ) => s.replace( new RegExp( '\\b' + a.from.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) + '\\b', 'gi' ), a.to ), txt );
		const full = free && aliases.length >= 1;
		return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 900 },
			h( AV.Section, { title: 'Words the voice should say differently', desc: 'Applies to every voice and language. Whole words only: “WP” changes “WP” and “wp”, never “WPML”.', end: ! full && h( Button, { variant: 'secondary', icon: h( I, { icon: 'plus' } ), onClick: () => setEdit( { id: 0, from: '', to: '', num: false } ) }, 'Add a word' ) },
				h( Card, null, aliases.length ? h( AV.Table, { head: [ 'On your site', 'Say it as', 'Numbers', '' ] }, aliases.map( ( a ) => h( 'tr', { key: a.id, className: 'is-clickable', tabIndex: 0, onClick: () => setEdit( a ), onKeyDown: ( e ) => e.key === 'Enter' && setEdit( a ) },
					h( 'td', null, h( 'span', { className: 'atlasvoice-cell-title' }, a.from ) ), h( 'td', { className: 'atlasvoice-cell-main' }, a.to ), h( 'td', null, /\d/.test( a.from ) ? ( a.num ? 'Similar numbers too' : 'This number only' ) : '—' ),
					h( 'td', { className: 'atlasvoice-td-end' }, h( Button, { variant: 'tertiary', size: 'compact', onClick: ( e ) => { e.stopPropagation(); setEdit( a ); } }, 'Edit' ) ) ) ) )
					: h( AV.Empty, { title: 'No words yet', action: h( Button, { variant: 'secondary', onClick: () => setEdit( { id: 0, from: '', to: '', num: false } ) }, 'Add a word' ) }, 'Add brand names or abbreviations the voice gets wrong.' ) ),
				full && h( 'div', { style: { marginTop: 12 } }, h( AV.ProNote, null, 'As many words as you need. Free keeps one.' ) ) ),
			h( AV.Section, { title: 'Try it', desc: 'Type a sentence to hear how it will be read.' },
				h( Card, null, h( CardBody, null, h( VStack, { spacing: 3 },
					h( TextareaControl, { ...NM, label: 'Sentence', hideLabelFromVision: true, value: txt, onChange: setTxt, rows: 2 } ),
					h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'primary', onClick: () => notify( 'Reading: “' + read + '”' ) }, 'Listen' ), h( 'span', { className: 'atlasvoice-weak' }, 'Read as: “' + read + '”' ) ) ) ) ) ),
			! free && h( Card, null, h( C.PanelBody, { title: 'For developers', initialOpen: false }, h( 'p', null, 'Add rules in code with the ', h( 'code', null, 'tts_text_aliases' ), ' filter. The same rules run on the server and in the player.' ) ) ) ),
			edit && h( AV.Drawer, { title: edit.id ? 'Edit “' + edit.from + '”' : 'Add a word', kicker: 'Pronunciation', onClose: () => setEdit( null ), footer: h( Fragment, null,
				edit.id ? h( Button, { variant: 'secondary', isDestructive: true, className: 'atlasvoice-footer-note', onClick: () => { setAliases( aliases.filter( ( x ) => x.id !== edit.id ) ); setEdit( null ); notify( 'Removed.' ); } }, 'Remove' ) : h( 'span', { className: 'atlasvoice-footer-note' } ),
				h( Button, { variant: 'tertiary', onClick: () => setEdit( null ) }, 'Cancel' ),
				h( Button, { variant: 'primary', disabled: ! edit.from.trim() || ! edit.to.trim(), onClick: () => { setAliases( edit.id ? aliases.map( ( x ) => ( x.id === edit.id ? edit : x ) ) : aliases.concat( { ...edit, id: Date.now() } ) ); setEdit( null ); notify( 'Saved. The voice now says “' + edit.to + '”.' ); } }, 'Save' ) ) },
				h( AV.DS, null, h( VStack, { spacing: 4 },
					h( TextControl, { ...N, label: 'On your site', value: edit.from, onChange: ( v ) => setEdit( { ...edit, from: v } ) } ),
					h( TextControl, { ...N, label: 'Say it as', value: edit.to, onChange: ( v ) => setEdit( { ...edit, to: v } ) } ),
					/\d/.test( edit.from ) && h( CheckboxControl, { ...NM, label: 'Similar numbers too', help: '“2026” also changes “2025” and “2027”.', checked: edit.num, onChange: ( v ) => setEdit( { ...edit, num: v } ) } ),
					h( Button, { variant: 'secondary', disabled: ! edit.to.trim(), onClick: () => notify( 'Reading: “' + edit.to + '”' ) }, 'Listen' ) ) ) ) );
	};

	/* ------------------------------------------------------------ languages */
	AV.S.languages = function Languages() {
		const ctx = useApp();
		const { free, notify, scn } = ctx;
		const [ map, setMap ] = useState( { 'en-GB': 'Sarah · natural', 'es-ES': scn === 'bad' ? '' : 'Lucía · natural', 'fr-FR': 'Denise · Google Cloud WaveNet', 'uk-UA': 'Olena · natural' } );
		const [ dirty, saved ] = AV.useDirty( map );
		const [ url, setUrl ] = useState( 'https://yoursite.com/es/molino-viejo/' );
		const [ chk, setChk ] = useState( 'idle' );
		const [ drawer, setDrawer ] = useState( false );
		return h( AV.Pane, { canvas: true, footer: ! free && h( AV.SaveBar, { dirty, onSave: () => { saved(); notify( 'Voices per language saved.' ); } } ) }, h( AV.Scroll, { width: 960 },
			h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: 'info', isDismissible: false, actions: [ { label: 'See what each language gets', onClick: () => setDrawer( true ) } ] }, 'We found ', h( 'b', null, 'Polylang' ), ' with 4 languages. AtlasVoice works out each page’s language for you.' ) ),
			! free ? h( AV.Section, { title: 'A voice for each language', desc: 'Posts are read in their own language. Codes match loosely: a voice for “es_ES” also covers “es”.' },
				h( Card, null, h( AV.Table, { head: [ 'Site language', 'Matched as', 'Voice', '' ] }, [ [ 'English (UK)', 'en-GB' ], [ 'Español', 'es-ES' ], [ 'Français', 'fr-FR' ], [ 'Українська', 'uk-UA' ] ].map( ( [ n, c ] ) => h( 'tr', { key: c },
					h( 'td', null, h( 'span', { className: 'atlasvoice-cell-title' }, n ) ), h( 'td', null, h( 'span', { className: 'atlasvoice-mono' }, c ) ),
					h( 'td', { className: 'atlasvoice-cell-main' }, h( SelectControl, { ...NM, label: 'Voice for ' + n, hideLabelFromVision: true, value: map[ c ], onChange: ( v ) => setMap( { ...map, [ c ]: v } ), options: [ { label: 'Choose a voice…', value: '' } ].concat( opt( [ map[ c ] || 'Lucía · natural', 'Sarah · natural', 'Pablo · natural', 'Denise · Google Cloud WaveNet', 'Olena · natural' ].filter( ( x, i, a ) => x && a.indexOf( x ) === i ) ) ) } ), ! map[ c ] && h( 'span', { style: { color: '#926300', fontSize: 12 } }, 'No voice: read with the English voice' ) ),
					h( 'td', { className: 'atlasvoice-td-end' }, h( Button, { variant: 'secondary', size: 'compact', disabled: ! map[ c ], onClick: () => notify( 'Playing ' + map[ c ] + '.' ) }, 'Play' ) ) ) ) ) ) )
				: h( 'div', { className: 'atlasvoice-section' }, h( Card, null, h( CardBody, null, h( VStack, { spacing: 3 }, h( 'b', null, 'Every post is read in English, the site language' ), h( 'span', { className: 'atlasvoice-weak' }, 'Posts in Español, Français and Українська are read with the English voice.' ), h( AV.ProNote, null, 'Read each post in its own language, with a voice per language.' ) ) ) ) ),
			h( AV.Section, { title: 'GTranslate', desc: 'Found on this site. Translates pages in the visitor’s browser.' },
				h( Card, null, h( ItemGroup, { isSeparated: true },
					h( AV.Row, { title: 'Browser voice', help: 'Follows the language the visitor picks.' }, h( AV.Chip, { tone: 'ok', dot: true }, 'Follows' ) ),
					h( AV.Row, { title: 'Natural and studio voices (MP3)', help: 'Read in your site language for now, because the translated text exists only in the visitor’s browser.' }, h( AV.Chip, { tone: 'warn', dot: true }, 'Site language only' ) ),
					! free && h( AV.Row, { title: 'Translated text for MP3 voices', help: 'Pro can translate the post text through AtlasAiDev’s translation proxy before reading it. Shown here so you can mention it in your privacy policy.' }, h( AV.Chip, { tone: 'info' }, 'To confirm' ) ) ) ) ),
			h( AV.Section, { title: 'Check a page', desc: 'See which language AtlasVoice picks, and why. You and our support see the same answer.' },
				h( Card, null, h( CardBody, null, h( VStack, { spacing: 4 },
					h( HStack, { alignment: 'bottom' }, h( 'div', { style: { flex: 1 } }, h( TextControl, { ...N, label: 'Page address', value: url, onChange: setUrl } ) ), h( Button, { variant: 'secondary', __next40pxDefaultSize: true, isBusy: chk === 'busy', disabled: ! url.trim(), onClick: () => { setChk( 'busy' ); setTimeout( () => setChk( 'done' ), 1000 ); } }, 'Check' ) ),
					chk === 'done' && h( AV.KV, { rows: [ [ 'Page language', h( Fragment, null, h( 'b', null, 'Español ' ), h( 'span', { className: 'atlasvoice-mono' }, 'es-ES' ) ) ], [ 'Found from', 'Polylang, the page’s own setting. The page’s <html lang> agrees.' ], [ 'Voice', free ? 'Emma · English, the site language' : ( map[ 'es-ES' ] || 'None yet: the English voice' ) ], [ 'Audio file', h( 'span', { className: 'atlasvoice-mono' }, 'molino-viejo-es.mp3' ) ] ] } ) ) ) ) ) ),
			drawer && h( LangDrawer, { onClose: () => setDrawer( false ) } ) );
	};

	/* ---------------------------------------------------- your own provider */
	const PROVIDERS = [ [ 'google', 'Google Cloud TTS', 'Word-by-word read-along. Free tier 1M characters a month.' ], [ 'openai', 'OpenAI (ChatGPT TTS)', '6 voices, follows speaking instructions.' ], [ 'eleven', 'ElevenLabs', 'Very natural, multilingual, cloned voices.' ] ];
	function ProviderDrawer( { id, onClose } ) {
		const ctx = useApp();
		const { notify } = ctx;
		const on = !! ctx.providers[ id ];
		const [ f, setF ] = useState( { key: '', model: 'tts-1', preset: 'news', inst: 'Speak like a calm local newsreader.', elModel: 'v2', fmt: '128', stab: 0.5, sim: 0.75, style: 0, speed: 1, boost: true, vid: '' } );
		const up = ( p ) => setF( ( x ) => ( { ...x, ...p } ) );
		const [ test, setTest ] = useState( 'idle' );
		const name = PROVIDERS.find( ( p ) => p[ 0 ] === id )[ 1 ];
		const save = () => { ctx.setProviders( { ...ctx.providers, [ id ]: true } ); onClose(); notify( name + ' connected. The key is stored on your site only.' ); };
		return h( AV.Drawer, { title: name, kicker: on ? 'Connected' : 'Not connected', onClose, footer: h( Fragment, null,
			on ? h( Button, { variant: 'secondary', isDestructive: true, className: 'atlasvoice-footer-note', onClick: () => ctx.modal( { title: 'Remove the ' + name + ' key?', body: h( 'p', null, 'The key is deleted from your site. New audio from this provider stops; audio already made keeps playing.' ), ok: 'Remove key', destructive: true, onOk: () => { ctx.setProviders( { ...ctx.providers, [ id ]: false } ); onClose(); notify( name + ' key removed.' ); } } ) }, 'Remove key' ) : h( 'span', { className: 'atlasvoice-footer-note' } ),
			h( Button, { variant: 'tertiary', onClick: onClose }, 'Cancel' ),
			h( Button, { variant: 'primary', disabled: ! on && test !== 'ok', onClick: save }, on ? 'Save' : 'Connect' ) ) },
			h( AV.DS, { title: id === 'google' ? 'Service key' : 'API key' }, h( VStack, { spacing: 3 },
				id === 'google'
					? h( Fragment, null, h( 'p', { className: 'atlasvoice-weak' }, on ? 'Stored encrypted in your database. Upload a new key to replace it.' : 'Upload the JSON key of a Google service account.' ),
						h( C.FormFileUpload, { accept: '.json', onChange: () => { setTest( 'busy' ); setTimeout( () => setTest( 'ok' ), 1200 ); }, render: ( { openFileDialog } ) => h( Button, { variant: 'secondary', icon: h( I, { icon: 'upload' } ), onClick: openFileDialog }, on ? 'Replace key' : 'Upload the JSON key' ) } ) )
					: h( HStack, { alignment: 'bottom' }, h( 'div', { style: { flex: 1 } }, h( TextControl, { ...N, type: 'password', label: 'API key', help: id === 'openai' ? 'From platform.openai.com → API keys.' : 'From elevenlabs.io → Profile → API key.', value: f.key, placeholder: on ? '•••••••• (saved)' : '', onChange: ( v ) => up( { key: v } ) } ) ),
						h( Button, { variant: 'secondary', __next40pxDefaultSize: true, disabled: f.key.length < 8, isBusy: test === 'busy', onClick: () => { setTest( 'busy' ); setTimeout( () => setTest( 'ok' ), 1000 ); } }, 'Test' ) ),
				test === 'ok' && h( Notice, { status: 'success', isDismissible: false }, 'The key works.' ),
				on && test === 'idle' && h( Button, { variant: 'link', onClick: () => notify( 'Connection test passed.' ) }, 'Test the connection again' ) ) ),
			id === 'openai' && h( AV.DS, { title: 'Model' }, h( VStack, { spacing: 4 },
				h( C.RadioControl, { label: 'Model', hideLabelFromVision: true, selected: f.model, onChange: ( v ) => up( { model: v } ), options: [ { label: 'TTS-1: fast, about $15 per 1M characters', value: 'tts-1' }, { label: 'TTS-1 HD: clearer, about $30 per 1M', value: 'tts-1-hd' }, { label: 'GPT-4o Mini TTS: follows instructions', value: 'gpt' } ] } ),
				f.model === 'gpt' && h( SelectControl, { ...N, label: 'How it should speak', value: f.preset, onChange: ( v ) => up( { preset: v } ), options: opt( [ [ 'native', 'Native speaker' ], [ 'news', 'Professional newsreader' ], [ 'story', 'Storyteller' ], [ 'slow', 'Slow and clear' ], [ 'own', 'My own instructions' ] ] ) } ),
				f.model === 'gpt' && f.preset === 'own' && h( TextareaControl, { ...NM, label: 'Instructions', value: f.inst, onChange: ( v ) => up( { inst: v } ) } ) ) ),
			id === 'eleven' && h( Fragment, null,
				on && h( AV.DS, { title: 'Usage' }, h( AV.KV, { rows: [ [ 'Plan', 'Creator' ], [ 'This month', '58,000 / 100,000 · resets 4 Nov' ] ] } ) ),
				h( AV.DS, { title: 'Voice settings' }, h( VStack, { spacing: 4 },
					h( SelectControl, { ...N, label: 'Model', value: f.elModel, onChange: ( v ) => up( { elModel: v } ), options: opt( [ [ 'v2', 'Multilingual v2' ], [ 't25', 'Turbo v2.5' ] ] ) } ),
					h( SelectControl, { ...N, label: 'Audio quality', value: f.fmt, onChange: ( v ) => up( { fmt: v } ), options: opt( [ [ '128', 'MP3 44.1 kHz · 128 kbps' ], [ '32', 'MP3 22 kHz · 32 kbps' ] ] ) } ),
					h( RangeControl, { ...NM, label: 'Stability', value: f.stab, min: 0, max: 1, step: 0.05, onChange: ( v ) => up( { stab: v } ) } ),
					h( RangeControl, { ...NM, label: 'Similarity', value: f.sim, min: 0, max: 1, step: 0.05, onChange: ( v ) => up( { sim: v } ) } ),
					h( RangeControl, { ...NM, label: 'Style', value: f.style, min: 0, max: 1, step: 0.05, onChange: ( v ) => up( { style: v } ) } ),
					h( RangeControl, { ...NM, label: 'Speed', value: f.speed, min: 0.7, max: 1.2, step: 0.05, onChange: ( v ) => up( { speed: v } ) } ),
					h( ToggleControl, { ...NM, label: 'Speaker boost', help: 'Makes the voice closer to the original speaker.', checked: f.boost, onChange: ( v ) => up( { boost: v } ) } ) ) ),
				h( AV.DS, { title: 'Use a voice by its ID' }, h( VStack, { spacing: 3 },
					h( HStack, { alignment: 'bottom' }, h( 'div', { style: { flex: 1 } }, h( TextControl, { ...N, label: 'ElevenLabs voice ID', className: 'atlasvoice-mono', value: f.vid, onChange: ( v ) => up( { vid: v } ) } ) ), h( Button, { variant: 'secondary', __next40pxDefaultSize: true, disabled: f.vid.length < 10, onClick: () => notify( 'Voice found: “Mill guide” (cloned).' ) }, 'Use' ) ),
					f.vid.length >= 10 && h( Notice, { status: 'warning', isDismissible: false, actions: [ { label: 'Turn on the AI notice', onClick: () => { onClose(); ctx.go( 'player:ai' ); } } ] }, h( 'b', null, 'This looks like a cloned or custom voice. ' ), 'Voices that reproduce a real person carry disclosure duties under the EU AI Act (Art. 50). Turn on the AI notice and check your position with your legal counsel.' ) ) ) ),
			id === 'google' && h( AV.DS, { title: 'How to create a Google service key' }, h( 'ol', { className: 'atlasvoice-list' },
				h( 'li', null, 'Open Google Cloud Console → IAM → Service accounts and create one.' ), h( 'li', null, 'Give it the role Cloud Text-to-Speech User, and Storage Admin only if you use Cloud Storage.' ), h( 'li', null, 'Create a JSON key and upload it here.' ), h( 'li', null, 'The PHP bcmath extension must be on; Health tells you if it isn’t.' ) ) ) );
	}
	AV.S.providers = function Providers( { sub } ) {
		const ctx = useApp();
		const { providers, notify } = ctx;
		const [ open, setOpen ] = useState( sub || null );
		const [ g, setG ] = useState( { gcs: true, bucket: 'reading-site-audio' } );
		const [ dirty, saved ] = AV.useDirty( g );
		const [ st, setSt ] = useState( 'idle' );
		return h( AV.Pane, { canvas: true, footer: providers.google && h( AV.SaveBar, { dirty, onSave: () => { saved(); notify( g.gcs ? 'Saved. New audio is copied to Cloud Storage.' : 'Saved. Files are copied back to your site first.' ); } } ) }, h( AV.Scroll, { width: 900 },
			h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: 'info', isDismissible: false }, 'You pay these providers directly for the characters they read. AtlasVoice charges nothing for them, in the free plugin and in Pro.' ) ),
			h( AV.Section, { title: 'Providers', desc: 'Click a provider to connect it or change its settings.' },
				h( Card, null, h( ItemGroup, { isSeparated: true }, PROVIDERS.map( ( [ id, n, d ] ) => h( Item, { key: id, onClick: () => setOpen( id ) }, h( HStack, { wrap: true },
					h( VStack, { spacing: 0, style: { flex: 1, minWidth: 200 } }, h( 'b', { style: { fontWeight: 500 } }, n ), h( 'span', { className: 'atlasvoice-weak' }, d ) ),
					h( HStack, { justify: 'flex-end', expanded: false }, providers[ id ] ? h( AV.Chip, { tone: 'ok', dot: true }, 'Connected' ) : h( AV.Chip, null, 'Not connected' ), h( I, { icon: 'chevron-right' } ) ) ) ) ) ) ) ),
			providers.google && h( AV.Section, { title: 'Keep a copy in Google Cloud Storage', desc: 'Your site keeps working if a local file is lost.' },
				h( Card, null, h( ItemGroup, { isSeparated: true },
					h( AV.Toggle, { label: 'Copy audio to Cloud Storage', help: 'Turning this off copies your files back to your site first.', checked: g.gcs, onChange: ( v ) => setG( { ...g, gcs: v } ) } ),
					g.gcs && h( Item, null, h( HStack, { alignment: 'bottom', wrap: true }, h( 'div', { style: { flex: 1, minWidth: 200 } }, h( TextControl, { ...N, label: 'Bucket name', help: 'Lowercase letters, numbers and dashes.', value: g.bucket, onChange: ( v ) => setG( { ...g, bucket: v.toLowerCase() } ) } ) ), h( Button, { variant: 'secondary', __next40pxDefaultSize: true, disabled: ! /^[a-z0-9-]{3,63}$/.test( g.bucket ), onClick: () => notify( 'This bucket already exists and belongs to you. It is ready.' ) }, 'Create bucket' ) ) ),
					g.gcs && h( AV.Row, { title: 'Storage access', help: st === 'ok' ? 'Uploads, reads and browser access (CORS) checked just now.' : 'Checks uploads, reads and browser access (CORS).' }, h( Button, { variant: 'secondary', isBusy: st === 'busy', onClick: () => { setSt( 'busy' ); setTimeout( () => { setSt( 'ok' ); notify( 'Storage access works.' ); }, 1200 ); } }, 'Test storage access' ) ) ) ) ) ),
			open && h( ProviderDrawer, { id: open, onClose: () => setOpen( null ) } ) );
	};

	/* ---------------------------------------------------- AtlasVoice account */
	AV.S.account = function Account() {
		const ctx = useApp();
		const { free, notify, scn } = ctx;
		const [ drawer, setDrawer ] = useState( false );
		const u = AV.usageOf( { ...ctx, engine: free ? 'atlas' : 'cloud' } );
		if ( scn === 'new' && free ) return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 700 }, h( Card, null, h( AV.Empty, { title: 'No AtlasVoice account connected yet', action: h( Button, { variant: 'primary', onClick: () => ctx.go( 'voice' ) }, 'Connect the natural voice' ) }, 'Connect the natural voice to see your plan, how many characters you have left this month and which posts used them.' ) ) ) );
		return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 1100 },
			h( 'div', { className: 'atlasvoice-grid is-2 atlasvoice-section' },
				h( Card, null, h( CardHeader, null, h( AV.H2, null, free ? 'Free plan' : 'Pro plan' ), free ? h( AV.Chip, { tone: 'info' }, 'Free' ) : h( AV.Pro ) ),
					h( CardBody, null, h( VStack, { spacing: 4 }, h( 'span', { className: 'atlasvoice-weak' }, free ? 'Natural voice · 100,000 characters a month' : 'Studio and natural voices · included in your Pro licence' ), h( AV.Usage, { label: 'This month' } ),
						h( AV.KV, { rows: [ [ 'Characters left', ( u.total - u.used ).toLocaleString( 'en' ) ], [ 'Resets', '1 November' ], [ 'Average post', 'about 6,000 characters' ] ] } ) ) ) ),
				h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Connection' ), h( AV.Chip, { tone: ctx.conn === 'ok' ? 'ok' : 'warn', dot: true }, ctx.conn === 'ok' ? 'Connected' : 'Needs attention' ) ),
					h( CardBody, null, h( VStack, { spacing: 4 }, h( AV.KV, { rows: [ [ 'Email', free ? 'rahima@example.com' : 'admin@thereadingsite.com · connected automatically' ], [ 'Site key', h( 'span', { className: 'atlasvoice-mono' }, 'avk_live_3f2…9c1' ) ] ] } ),
						h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'secondary', onClick: () => setDrawer( true ) }, 'Connection details' ), h( Button, { variant: 'tertiary', icon: h( I, { icon: 'external' } ), onClick: () => AV.ext( notify, 'app.atlasvoice.cloud' ) }, 'Open my AtlasVoice dashboard' ) ) ) ) ) ),
			h( AV.Section, { title: 'When the month’s characters run out' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Row, { title: 'Audio already made', help: 'Keeps playing as normal. Characters are only counted when new audio is made.' }, h( AV.Chip, { tone: 'ok' }, 'Unaffected' ) ),
				h( AV.Row, { title: 'New or changed posts', help: 'Use the browser voice until the allowance resets on 1 November. Visitors still hear the post.' }, h( AV.Chip, { tone: 'warn' }, 'Browser voice' ) ),
				h( AV.Row, { title: 'You are told', help: 'At 80% (with the run-out date), at 95% and at 100%, in Overview, the Notices bell and one admin notice.' }, h( AV.Chip, null, '3 warnings' ) ) ) ) ),
			h( 'div', { className: 'atlasvoice-grid is-2 atlasvoice-section' },
				h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Usage by month' ) ), h( CardBody, null, h( AV.Bars, { values: [ 41, 55, 62, 48, 71, u.pct ], from: 'May', to: 'Oct' } ) ) ),
				h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Posts that used the most characters' ) ), h( AV.Table, { head: [ 'Post', 'Characters', 'Languages' ] }, [ [ 'The history of the weir', '9,880', 'EN' ], [ 'Ten walks along the river', '7,920', free ? 'EN' : 'EN, ES' ], [ 'How we restored the old mill', '6,140', 'EN' ], [ 'Bread from the old mill flour', '3,310', 'EN' ] ].map( ( r ) => h( 'tr', { key: r[ 0 ] }, h( 'td', { className: 'atlasvoice-cell-main' }, r[ 0 ] ), h( 'td', null, r[ 1 ] ), h( 'td', null, r[ 2 ] ) ) ) ) ) ),
			free ? h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Need more?' ) ), h( ItemGroup, { isSeparated: true },
				h( AV.Row, { title: 'Upgrade to Pro', help: 'Unlimited natural voice, 374 studio voices in 43 languages, and audio for many posts at once.' }, h( Button, { variant: 'secondary', onClick: () => ctx.go( 'plans' ) }, 'See plans' ) ),
				h( AV.Row, { title: '“Voiced by AtlasVoice”', help: 'A small line under free natural-voice audio, only when the service asks for it. Pro removes it.' } ) ) )
				: h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Licence seats' ) ), h( ItemGroup, { isSeparated: true }, h( AV.Row, { title: 'This site uses 1 of your 5 sites', help: 'If the licence is full, the site falls back to the free 100,000 characters.' }, h( Button, { variant: 'secondary', onClick: () => AV.ext( notify, 'your sites on app.atlasvoice.cloud' ) }, 'Manage sites' ) ) ) ) ),
			drawer && h( ConnDrawer, { onClose: () => setDrawer( false ) } ) );
	};

	/* =============================================================== player */
	function IconDrawer( { which, onClose } ) {
		const ctx = useApp();
		const [ pick, setPick ] = useState( 'play' );
		const [ svg, setSvg ] = useState( '' );
		return h( AV.Drawer, { title: 'Icon: ' + which, kicker: 'Buttons & words', onClose, footer: h( Fragment, null, h( Button, { variant: 'tertiary', className: 'atlasvoice-footer-note', onClick: () => { onClose(); ctx.notify( 'Icon hidden for this state.' ); } }, 'No icon' ), h( Button, { variant: 'primary', onClick: () => { onClose(); ctx.notify( 'Icon saved.' ); } }, 'Use this icon' ) ) },
			h( AV.DS, { title: 'Presets' }, h( HStack, { justify: 'flex-start' }, [ 'play', 'pause', 'replay' ].map( ( g ) => h( Button, { key: g, variant: pick === g ? 'primary' : 'secondary', label: g, onClick: () => setPick( g ), style: { width: 44, justifyContent: 'center' } }, h( 'svg', { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'currentColor', 'aria-hidden': true }, h( 'path', { d: AV.G[ g ] } ) ) ) ) ) ),
			h( AV.DS, { title: 'Your own SVG' }, h( TextareaControl, { ...NM, label: 'SVG code', help: 'Paste an <svg> icon. Scripts and event attributes are removed when you save.', value: svg, onChange: setSvg, rows: 4 } ) ) );
	}
	AV.S.player = function Player( { sub } ) {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ tab, setTab ] = useState( sub || 'look' );
		const [ L, setL ] = useState( { ...ctx.look } );
		const [ ai, setAi ] = useState( { ...ctx.ai } );
		const [ p, setP ] = useState( { ...ctx.place } );
		const [ w, setW ] = useState( { ...ctx.words } );
		const [ r, setR ] = useState( { ...ctx.read } );
		const [ dirty, saved ] = AV.useDirty( { L, ai, p, w, r } );
		const [ which, setWhich ] = useState( ctx.engine === 'browser' ? 'browser' : ctx.engine === 'cloud' ? 'cloud' : 'mp3' );
		const [ st, setSt ] = useState( 'playing' );
		const [ drawer, setDrawer ] = useState( null );
		const upL = ( x ) => setL( ( o ) => ( { ...o, ...x } ) );
		const ratio = contrast( L.bg, L.fg );
		let body;
		if ( tab === 'look' ) {
			body = h( Fragment, null,
				h( AV.Section, { title: 'Style', desc: 'Start from a style, then fine-tune. Your current colours are kept as “Classic teal”.' },
					h( 'div', { className: 'atlasvoice-presets', role: 'radiogroup', 'aria-label': 'Style' }, AV.PRESETS.map( ( pr ) => h( 'button', { key: pr[ 0 ], className: 'atlasvoice-preset' + ( L.preset === pr[ 0 ] ? ' is-on' : '' ), role: 'radio', 'aria-checked': L.preset === pr[ 0 ], onClick: () => upL( { preset: pr[ 0 ], bg: pr[ 2 ], fg: pr[ 3 ] } ) }, h( 'span', { style: { background: pr[ 2 ] } } ), pr[ 1 ] ) ) ) ),
				h( Card, { className: 'atlasvoice-section' }, h( CardBody, null, h( VStack, { spacing: 5 },
					h( C.BaseControl, { ...NM, label: 'Background', id: 'av-bg' }, h( C.ColorPalette, { colors: COLORS, value: L.bg, onChange: ( v ) => v && upL( { bg: v, preset: 'custom' } ), clearable: false } ) ),
					h( C.BaseControl, { ...NM, label: 'Text and icons', id: 'av-fg', help: h( 'span', { style: { color: ratio >= 4.5 ? '#007f30' : '#cc1818' } }, 'Contrast ' + ratio.toFixed( 1 ) + ':1 · ' + ( ratio >= 4.5 ? 'easy to read' : 'too low, pick a darker or lighter text colour' ) ) }, h( C.ColorPalette, { colors: COLORS, value: L.fg, onChange: ( v ) => v && upL( { fg: v, preset: 'custom' } ), clearable: false } ) ),
					h( HStack, { wrap: true, alignment: 'top', spacing: 6, justify: 'flex-start' },
						h( AV.TG, { label: 'Shape', value: L.shape, onChange: ( v ) => upL( { shape: v } ), options: [ [ 'square', 'Square' ], [ 'rounded', 'Rounded' ], [ 'pill', 'Pill' ] ] } ),
						h( AV.TG, { label: 'Size', value: L.size, onChange: ( v ) => upL( { size: v } ), options: [ [ 's', 'Small' ], [ 'm', 'Medium' ], [ 'l', 'Large' ] ] } ),
						h( AV.TG, { label: 'Width', value: L.width, onChange: ( v ) => upL( { width: v } ), options: [ [ 'full', 'Full width' ], [ 'auto', 'Fit to content' ] ] } ) ),
					h( 'p', { className: 'atlasvoice-weak' }, 'On phones the player always uses the full width, so its controls never get cut off.' ) ) ) ),
				h( Card, null, h( C.PanelBody, { title: 'More style options', initialOpen: false }, h( VStack, { spacing: 5 },
					h( C.BaseControl, { ...NM, label: 'Hover background', id: 'av-hbg' }, h( C.ColorPalette, { colors: COLORS, value: L.hoverBg, onChange: ( v ) => upL( { hoverBg: v } ) } ) ),
					h( C.BaseControl, { ...NM, label: 'Hover text', id: 'av-htx' }, h( C.ColorPalette, { colors: COLORS, value: L.hoverFg, onChange: ( v ) => upL( { hoverFg: v } ) } ) ),
					h( 'div', { className: 'atlasvoice-grid is-3' },
						AV.UnitControl && h( AV.UnitControl, { __next40pxDefaultSize: true, label: 'Border width', value: L.border, units: [ { value: 'px', label: 'px' } ], onChange: ( v ) => upL( { border: v } ) } ),
						AV.UnitControl && h( AV.UnitControl, { __next40pxDefaultSize: true, label: 'Text size', value: L.fontSize, units: [ { value: 'px', label: 'px' } ], onChange: ( v ) => upL( { fontSize: v } ) } ),
						AV.UnitControl && h( AV.UnitControl, { __next40pxDefaultSize: true, label: 'Corner radius', value: L.radius, units: [ { value: 'px', label: 'px' } ], onChange: ( v ) => upL( { radius: v } ) } ) ),
					h( C.BaseControl, { ...NM, label: 'Border colour', id: 'av-bc' }, h( C.ColorPalette, { colors: COLORS, value: L.borderColor, onChange: ( v ) => upL( { borderColor: v } ) } ) ),
					AV.BoxControl && h( AV.BoxControl, { __next40pxDefaultSize: true, label: 'Space around the player', values: L.margin, units: [ { value: 'px', label: 'px' }, { value: '%', label: '%' } ], onChange: ( v ) => upL( { margin: v } ) } ),
					h( 'p', { className: 'atlasvoice-weak' }, 'Each side keeps the unit it was saved with. Need more? Add CSS in Appearance → Customize → Additional CSS; player classes start with .atlasvoice-player-.' ) ) ) ) );
		} else if ( tab === 'place' ) {
			body = h( Fragment, null,
				h( AV.Section, { title: 'Where it sits in the post' }, h( AV.Tiles, { value: p.pos, onChange: ( v ) => setP( { ...p, pos: v } ), options: [ { id: 'before', title: 'Before the content', text: 'Most people press play here' }, { id: 'after', title: 'After the content', text: 'For readers who finish first' }, { id: 'manual', title: 'Only where I add it', text: 'Shortcode, block or Elementor widget' } ] } ) ),
				h( AV.Section, { title: 'While scrolling', desc: 'When the reader scrolls past, the player docks to the edge of the screen. Its space in the article is kept, so the text never jumps.' }, h( AV.Tiles, { value: p.dock, onChange: ( v ) => setP( { ...p, dock: v } ), options: [ { id: 'bottom', title: 'Bottom, full width' }, { id: 'br', title: 'Bottom right' }, { id: 'bl', title: 'Bottom left' }, { id: 'top', title: 'Top of the screen' }, { id: 'none', title: 'Don’t follow' } ] } ) ),
				h( Card, null, h( CardBody, null, h( 'div', { className: 'atlasvoice-grid is-2' },
					h( SelectControl, { ...N, label: 'Show the player to', value: p.who, onChange: ( v ) => setP( { ...p, who: v } ), options: opt( [ [ 'all', 'Everyone' ], [ 'users', 'Logged-in users' ], [ 'subscriber', 'Subscribers' ], [ 'editor', 'Editors and above' ] ] ) } ),
					h( SelectControl, { ...N, label: 'Allow MP3 download for', help: 'Adds a download button to MP3 players.', value: p.dl, onChange: ( v ) => setP( { ...p, dl: v } ), options: opt( [ [ 'all', 'Everyone' ], [ 'users', 'Logged-in users' ], [ 'admins', 'Administrators only' ], [ 'none', 'Nobody' ] ] ) } ) ) ) ) );
		} else if ( tab === 'words' ) {
			const rows = [ [ 'listen', 'Before playing', 'play' ], [ 'pause', 'While playing', 'pause' ], [ 'resume', 'After pausing', 'play' ], [ 'replay', 'At the end', 'replay' ] ];
			body = h( Fragment, null,
				h( AV.Section, { title: 'Browser voice button', desc: 'What the player says. Leave a field empty to use the default in the visitor’s language.', end: h( Button, { variant: 'tertiary', onClick: () => { setW( { ...w, listen: 'Listen', pause: 'Pause', resume: 'Resume', replay: 'Replay' } ); notify( 'Words reset to the defaults. Save to keep them.' ); } }, 'Reset' ) },
					h( Card, null, h( AV.Table, { head: [ 'State', 'Icon', 'Text', 'Tooltip' ] }, rows.map( ( [ k, l, g ] ) => h( 'tr', { key: k },
						h( 'td', null, l ),
						h( 'td', null, h( Button, { variant: 'secondary', size: 'compact', label: 'Change the ' + l.toLowerCase() + ' icon', onClick: () => setDrawer( { kind: 'icon', which: l } ) }, h( 'svg', { viewBox: '0 0 24 24', width: 14, height: 14, fill: 'currentColor', 'aria-hidden': true }, h( 'path', { d: AV.G[ g ] } ) ) ) ),
						h( 'td', { className: 'atlasvoice-cell-main' }, h( TextControl, { ...NM, label: l + ' text', hideLabelFromVision: true, value: w[ k ], onChange: ( v ) => setW( { ...w, [ k ]: v } ) } ) ),
						h( 'td', null, h( Button, { variant: 'link', onClick: () => setDrawer( { kind: 'tip', which: l, key: k } ) }, '“' + ( w[ 'tip_' + k ] || w[ k ] + ' this article' ) + '”' ) ) ) ) ) ) ),
				h( Card, { className: 'atlasvoice-section' }, h( ItemGroup, { isSeparated: true },
					h( Item, null, h( TextControl, { ...N, label: 'Reading time text', help: 'Use %d where the minutes go, e.g. “Listen in %d min”.', value: w.time, onChange: ( v ) => setW( { ...w, time: v } ) } ) ),
					h( AV.Toggle, { label: 'Show the icon', checked: w.icon, onChange: ( v ) => setW( { ...w, icon: v } ) } ),
					h( AV.Toggle, { label: 'Show the settings gear', help: 'Browser voice only. Opens a small panel to change language, voice, speed and volume (see the preview).', checked: w.gear, onChange: ( v ) => setW( { ...w, gear: v } ) } ),
					h( AV.Toggle, { label: 'Remember the listener’s choices', help: 'Speed, pitch and mute carry over to the next post.', checked: w.mem, onChange: ( v ) => setW( { ...w, mem: v } ) } ) ) ),
				! free && h( AV.Section, { title: 'Pro player with progress bar', desc: 'The browser-voice player with a progress bar now has its own words.' }, h( Card, null, h( CardBody, null, h( 'div', { className: 'atlasvoice-grid is-2' }, h( TextControl, { ...N, label: 'Before playing', value: w.p2listen, onChange: ( v ) => setW( { ...w, p2listen: v } ) } ), h( TextControl, { ...N, label: 'While playing', value: w.p2pause, onChange: ( v ) => setW( { ...w, p2pause: v } ) } ) ) ) ) ) );
		} else if ( tab === 'read' ) {
			body = h( Fragment, null,
				h( AV.Section, { title: 'Highlight while reading', desc: 'Highlight the text as it is read, so listeners can follow. Off by default.' },
					h( Card, null, h( ItemGroup, { isSeparated: true },
						h( AV.Toggle, { label: 'Highlight while reading', checked: r.on, onChange: ( v ) => setR( { ...r, on: v } ) } ),
						r.on && h( Item, null, h( AV.TG, { label: 'What to highlight', value: r.mode, onChange: ( v ) => setR( { ...r, mode: v } ), options: [ [ 's', 'Sentence' ], [ 'w', 'Word' ], [ 'ws', 'Both' ] ] } ), h( 'p', { className: 'atlasvoice-weak', style: { marginTop: 8 } }, 'Word by word needs the browser voice, Google Cloud or ElevenLabs. Other voices highlight sentences.' ) ),
						r.on && h( Item, null, h( C.BaseControl, { ...NM, label: 'Sentence colour', id: 'av-sc' }, h( C.ColorPalette, { colors: [ { name: 'Lavender', color: '#e8e7fe' }, { name: 'Aqua', color: '#cffafe' }, { name: 'Yellow', color: '#fef3c7' } ], value: r.sentence, onChange: ( v ) => setR( { ...r, sentence: v } ) } ) ) ),
						r.on && r.mode !== 's' && h( Item, null, h( C.BaseControl, { ...NM, label: 'Word colour', id: 'av-wc' }, h( C.ColorPalette, { colors: [ { name: 'Periwinkle', color: '#a5abf0' }, { name: 'Amber', color: '#fcd34d' } ], value: r.word, onChange: ( v ) => setR( { ...r, word: v } ) } ) ) ),
						r.on && h( Item, null, h( ToggleControl, { ...NM, label: 'Fade the rest of the article', checked: r.dim, onChange: ( v ) => setR( { ...r, dim: v } ) } ), r.dim && h( 'div', { style: { marginTop: 12 } }, h( RangeControl, { ...NM, label: 'How much to fade', value: r.dimBy, min: 10, max: 90, step: 5, onChange: ( v ) => setR( { ...r, dimBy: v } ) } ) ) ),
						r.on && h( AV.Toggle, { label: 'Scroll to follow the reading', help: 'Stops following when the reader scrolls.', checked: r.follow, onChange: ( v ) => setR( { ...r, follow: v } ) } ) ) ) ),
				h( AV.Section, { title: 'Listen to a selection', desc: 'Readers select any text and press Listen.' },
					h( Card, null, h( ItemGroup, { isSeparated: true },
						h( AV.Toggle, { label: 'Allow listening to selected text', checked: r.sel, onChange: ( v ) => setR( { ...r, sel: v } ) } ),
						r.sel && h( Item, null, h( SelectControl, { ...N, label: 'Tell readers about it', value: r.ann, onChange: ( v ) => setR( { ...r, ann: v } ), options: opt( [ [ 'tip', 'A tip under the player' ], [ 'tab', 'A small side tab' ], [ 'both', 'Both' ], [ 'none', 'Don’t mention it' ] ] ) } ) ) ) ) ) );
		} else if ( tab === 'ai' ) {
			body = h( Fragment, null,
				h( AV.Section, { title: 'AI notice', desc: 'Tell listeners the voice is made by AI. Optional, and off until you turn it on. Some public-sector and health sites need it.' },
					h( Card, null, h( ItemGroup, { isSeparated: true },
						h( AV.Toggle, { label: 'Show the AI notice', help: 'Also read out to screen-reader users.', checked: ai.on, onChange: ( v ) => setAi( { ...ai, on: v } ) } ),
						ai.on && h( Item, null, h( TextControl, { ...N, label: 'Notice text', help: 'Shown in the visitor’s language. Translations included for 11 languages.', value: ai.text, onChange: ( v ) => setAi( { ...ai, text: v } ) } ) ),
						ai.on && h( Item, null, h( AV.TG, { label: 'Position', value: ai.pos, onChange: ( v ) => setAi( { ...ai, pos: v } ), options: [ [ 'before', 'Above the player' ], [ 'after', 'Below the player' ] ] } ) ) ) ) ),
				h( 'p', { className: 'atlasvoice-weak' }, 'This is information, not legal advice. Check your own obligations under the EU AI Act.' ) );
		} else {
			body = h( Fragment, null,
				h( AV.Section, { title: 'Shortcode', desc: 'Paste it where the player should appear: a page builder, a widget or a template.' },
					h( Card, null, h( CardBody, null, h( VStack, { spacing: 4 },
						h( 'div', { className: 'atlasvoice-address' }, h( 'div', { style: { flex: 1, minWidth: 0 } }, h( TextControl, { ...N, label: 'Shortcode', className: 'atlasvoice-mono', value: '[atlasvoice]', readOnly: true, onChange: () => {}, onFocus: ( e ) => e.target.select() } ) ), h( Button, { variant: 'secondary', __next40pxDefaultSize: true, icon: h( I, { icon: 'copy' } ), onClick: () => AV.copyText( notify, '[atlasvoice]', 'Shortcode' ) }, 'Copy' ) ),
						h( 'p', { className: 'atlasvoice-weak' }, 'The older [tta_listen_btn] keeps working. Use straight double quotes.' ) ) ),
						h( AV.Table, { label: 'Shortcode options', head: [ 'Option', 'What it does', 'Example' ] }, [ [ 'id', 'Reads another post', 'id="128"' ], [ 'text_to_read', 'Reads your own text instead', 'text_to_read="Welcome"' ], [ 'lang, voice', 'Language and voice for this player', 'lang="es-ES"' ], [ 'listen_text … replay_text', 'Button words (also pause, resume, start, stop)', 'listen_text="Hear it"' ], [ 'backgroundColor, color, width', 'Colours and width', 'backgroundColor="#184c53"' ], [ 'class', 'Adds your own CSS class', 'class="my-player"' ], [ 'position', 'Wraps content: player before or after it', '[atlasvoice position="after"]…[/atlasvoice]' ] ].map( ( x ) => h( 'tr', { key: x[ 0 ] }, h( 'td', null, h( 'span', { className: 'atlasvoice-mono' }, x[ 0 ] ) ), h( 'td', { className: 'atlasvoice-cell-main' }, x[ 1 ] ), h( 'td', null, h( 'span', { className: 'atlasvoice-mono' }, x[ 2 ] ) ) ) ) ) ) ),
				h( 'div', { className: 'atlasvoice-grid is-2' },
					h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Block' ) ), h( CardBody, null, h( 'p', { className: 'atlasvoice-weak' }, 'Add the “AtlasVoice player” block in the block editor. It uses this screen’s style; you can change colour and width for one post in the block settings.' ) ) ),
					h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Elementor widget' ), h( AV.Chip, { tone: 'info' }, 'New' ) ), h( CardBody, null, h( 'p', { className: 'atlasvoice-weak' }, 'Drag “AtlasVoice player” into any Elementor layout. It shows the real player in the editor and has the same options as the shortcode, because it is a thin wrapper around it.' ) ) ) ) );
		}
		const extra = tab === 'place' && p.dock !== 'none' ? 'dock' : tab === 'words' && w.gear ? 'pop' : null;
		return h( Fragment, null,
			h( AV.Pane, { tabs: [ [ 'look', 'Look' ], [ 'place', 'Placement' ], [ 'words', 'Buttons & words' ], [ 'read', 'Read-along' ], [ 'ai', 'AI notice' ], [ 'embed', 'Shortcode & block' ] ], tab, setTab: ( t ) => { setTab( t ); ctx.setRouteSilently( 'player:' + t ); }, footer: tab !== 'embed' && h( AV.SaveBar, { dirty, onSave: () => { ctx.setLook( L ); ctx.setAi( ai ); ctx.setPlace( p ); ctx.setWords( w ); ctx.setRead( r ); saved(); notify( 'Player saved. Visitors see the change on their next page load.' ); } } ) },
				h( 'div', { className: 'atlasvoice-withpreview' }, h( AV.Scroll, { width: 820 }, body ), h( Preview, { look: L, ai, which: which === 'cloud' && free ? 'mp3' : which, setWhich, st, setSt, extra } ) ) ),
			drawer && drawer.kind === 'icon' && h( IconDrawer, { which: drawer.which, onClose: () => setDrawer( null ) } ),
			drawer && drawer.kind === 'tip' && h( AV.Drawer, { title: 'Tooltip: ' + drawer.which, kicker: 'Buttons & words', onClose: () => setDrawer( null ), footer: h( Button, { variant: 'primary', onClick: () => setDrawer( null ) }, 'Done' ) },
				h( AV.DS, null, h( VStack, { spacing: 4 }, h( ToggleControl, { ...NM, label: 'Show a tooltip', help: 'Shown on hover and read by screen readers.', checked: w.tips !== false, onChange: ( v ) => setW( { ...w, tips: v } ) } ),
					h( TextControl, { ...N, label: 'Tooltip text', value: w[ 'tip_' + drawer.key ] || w[ drawer.key ] + ' this article', onChange: ( v ) => setW( { ...w, [ 'tip_' + drawer.key ]: v } ) } ) ) ) ) );
	};

	/* ========================================================= what is read */
	function RuleDrawer( { rule, onClose } ) {
		const ctx = useApp();
		const [ f, setF ] = useState( { sel: rule.sel, areas: [ '.share-bar', '.author-box' ], tags: [ 'figure', 'aside' ], phrases: [ 'Share this', 'Read more' ] } );
		const [ det, setDet ] = useState( 'idle' );
		return h( AV.Drawer, { title: rule.name, kicker: 'Page area rule · ' + rule.kind, onClose, footer: h( Fragment, null,
			h( Button, { variant: 'secondary', className: 'atlasvoice-footer-note', icon: h( I, { icon: 'seen' } ), onClick: () => { onClose(); ctx.openPicker(); } }, 'Pick it on a page' ),
			h( Button, { variant: 'tertiary', onClick: onClose }, 'Cancel' ), h( Button, { variant: 'primary', onClick: () => { onClose(); ctx.notify( 'Rule saved for ' + rule.name + '.' ); } }, 'Save rule' ) ) },
			h( AV.DS, { title: 'Read this part of the page' }, h( VStack, { spacing: 4 },
				h( TextControl, { ...N, label: 'Open the picker on', help: 'Newest post, or type a title, ID or address.', value: 'How we restored the old mill', onChange: () => {} } ),
				h( TextControl, { ...N, label: 'CSS selector', className: 'atlasvoice-mono', value: f.sel, onChange: ( v ) => setF( { ...f, sel: v } ), help: det === 'done' ? 'Found on 5 of 5 sample posts · about 640 words each' : 'The part of the page with the article text.' } ),
				h( HStack, { justify: 'flex-start' }, h( Button, { variant: 'secondary', isBusy: det === 'busy', onClick: () => { setDet( 'busy' ); setTimeout( () => { setDet( 'done' ); setF( { ...f, sel: 'article .entry-content' } ); }, 1100 ); } }, 'Detect automatically' ), det === 'done' && h( AV.Chip, { tone: 'ok', dot: true }, 'Works' ) ) ) ),
			! ctx.free ? h( AV.DS, { title: 'Skip parts of it' }, h( VStack, { spacing: 4 },
				h( C.FormTokenField, { ...NM, label: 'Areas (CSS selectors)', value: f.areas, onChange: ( v ) => setF( { ...f, areas: v } ) } ),
				h( C.FormTokenField, { ...NM, label: 'Element types', value: f.tags, suggestions: [ 'figure', 'aside', 'figcaption', 'blockquote', 'table', 'pre' ], onChange: ( v ) => setF( { ...f, tags: v } ) } ),
				h( C.FormTokenField, { ...NM, label: 'Phrases', value: f.phrases, onChange: ( v ) => setF( { ...f, phrases: v } ) } ) ) )
				: h( AV.DS, null, h( AV.ProNote, null, 'Skip share bars, captions and phrases such as “Read more”.' ) ) );
	}
	AV.S.content = function Content( { sub } ) {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ tab, setTab ] = useState( sub || 'where' );
		const [ f, setF ] = useState( { ...ctx.content } );
		const [ dirty, saved ] = AV.useDirty( f );
		const [ drawer, setDrawer ] = useState( null );
		const up = ( p ) => setF( ( x ) => ( { ...x, ...p } ) );
		const rules = [ { id: 'global', name: 'Whole site', kind: 'Default', sel: 'article .entry-content' } ].concat( free ? [] : [ { id: 'post', name: 'Posts', kind: 'Content type', sel: '' }, { id: 'product', name: 'Products', kind: 'Content type', sel: '.woocommerce-product-details__short-description' }, { id: 'one', name: '3 single posts', kind: 'Set on the page', sel: '#main .story' } ] );
		let body;
		if ( tab === 'where' ) {
			body = h( Fragment, null,
				h( AV.Section, { title: 'Add the player to', desc: 'Added automatically to these content types.' }, h( Card, null, h( ItemGroup, { isSeparated: true },
					h( AV.Toggle, { label: 'Add the player automatically', help: 'Off: the player appears only where you add the shortcode, block or Elementor widget.', checked: f.auto, onChange: ( v ) => up( { auto: v } ) } ),
					f.auto && h( Item, null, free
						? h( C.RadioControl, { label: 'Content type', selected: f.types[ 0 ], onChange: ( v ) => up( { types: [ v ] } ), options: opt( [ 'Posts', 'Pages', 'Products', 'Recipes' ] ) } )
						: h( VStack, { spacing: 2 }, h( 'b', { style: { fontWeight: 500 } }, 'Content types' ), [ 'Posts', 'Pages', 'Products', 'Recipes' ].map( ( t ) => h( CheckboxControl, { key: t, ...NM, label: t, checked: f.types.includes( t ), onChange: ( v ) => up( { types: v ? f.types.concat( t ) : f.types.filter( ( x ) => x !== t ) } ) } ) ) ) ),
					free && h( Item, null, h( AV.ProNote, null, 'A player on every content type at once, each with its own rules.' ) ) ) ) ),
				h( AV.Section, { title: 'Skip some posts', desc: free ? 'Free skips up to 5 single posts, 1 category and 1 tag.' : 'The player is not added to these.' }, h( Card, null, h( CardBody, null, h( VStack, { spacing: 4 },
					h( C.FormTokenField, { ...NM, label: 'Categories', value: f.cats, maxLength: free ? 1 : undefined, suggestions: [ 'Podcasts', 'News', 'Recipes', 'Events' ], onChange: ( v ) => up( { cats: v } ) } ),
					h( C.FormTokenField, { ...NM, label: 'Tags', value: f.tags, maxLength: free ? 1 : undefined, suggestions: [ 'sponsored', 'video', 'gallery' ], onChange: ( v ) => up( { tags: v } ) } ),
					h( C.FormTokenField, { ...NM, label: 'Single posts', help: 'Search by title. You can also hide the player from the toolbar while viewing a post.', value: f.posts, maxLength: free ? 5 : undefined, suggestions: AV.POSTS.map( ( x ) => x.title ), onChange: ( v ) => up( { posts: v } ) } ),
					h( SelectControl, { ...N, label: 'Post status', value: f.status, onChange: ( v ) => up( { status: v } ), options: opt( [ [ 'publish', 'Published' ], [ 'private', 'Published and private' ] ] ) } ) ) ) ) ) );
		} else if ( tab === 'text' ) {
			body = h( Fragment, null,
				h( AV.Section, { title: 'Read aloud' }, h( Card, null, h( ItemGroup, { isSeparated: true },
					h( AV.Toggle, { label: 'The post title', checked: f.title, onChange: ( v ) => up( { title: v } ) } ),
					h( AV.Toggle, { label: 'The excerpt', checked: f.excerpt, onChange: ( v ) => up( { excerpt: v } ) } ),
					h( AV.Row, { title: 'Text before and after the post', help: f.intro ? '“' + f.intro + '”' : 'Not set' }, h( Button, { variant: 'secondary', size: 'compact', onClick: () => setDrawer( 'intro' ) }, f.intro || f.outro ? 'Edit' : 'Add' ) ),
					! free && h( AV.Toggle, { label: 'Say numbers as words', help: '“1,284” becomes “one thousand two hundred eighty-four”.', checked: f.numbers, onChange: ( v ) => up( { numbers: v } ) } ) ) ) ),
				h( AV.Section, { title: 'Custom fields', desc: 'Read text from Advanced Custom Fields too.' }, h( Card, null, h( CardBody, null, h( VStack, { spacing: 4 },
					h( C.FormTokenField, { ...NM, label: 'Fields to read', help: free ? 'Free reads 1 field.' : 'Read after the title, in this order.', value: f.acf, maxLength: free ? 1 : undefined, suggestions: [ 'Recipe intro', 'Ingredients', 'Opening hours' ], onChange: ( v ) => up( { acf: v } ) } ),
					h( ToggleControl, { ...NM, label: 'Use my own reading order', help: 'Drag fields and the post content into the order they should be read.', checked: f.order, onChange: ( v ) => up( { order: v } ) } ),
					f.acf.includes( 'Recipe intro' ) && h( Notice, { status: 'warning', isDismissible: false }, '“Recipe intro” is also inside the post content, so it may be read twice.' ) ) ) ) ),
				h( Card, null, h( C.PanelBody, { title: 'Advanced', initialOpen: false }, h( VStack, { spacing: 4 },
					! free && h( ToggleControl, { ...NM, label: 'Read the page as the visitor sees it', help: 'For page builders or translation plugins that change the text after the page loads.', checked: f.dom, onChange: ( v ) => up( { dom: v } ) } ),
					h( ToggleControl, { ...NM, label: 'Add the content wrapper', help: 'Some older themes need it for highlighting. Leave it off on block themes.', checked: f.wrap, onChange: ( v ) => up( { wrap: v } ) } ),
					h( ToggleControl, { ...NM, label: 'Show audio status in the posts list', checked: f.status_col, onChange: ( v ) => up( { status_col: v } ) } ) ) ) ) );
		} else {
			body = h( Fragment, null,
				h( AV.Section, { title: 'Page areas', desc: 'Which part of the page is read aloud. Click a rule to change it.', end: ! free && h( Button, { variant: 'secondary', icon: h( I, { icon: 'plus' } ), onClick: () => setDrawer( { id: 'new', name: 'New rule', kind: 'Content type', sel: '' } ) }, 'Add a rule' ) },
					h( Card, null, h( AV.Table, { head: [ 'Applies to', 'Reads', 'Status' ] }, rules.map( ( r ) => h( 'tr', { key: r.id, className: 'is-clickable', tabIndex: 0, onClick: () => setDrawer( r ), onKeyDown: ( e ) => e.key === 'Enter' && setDrawer( r ) },
						h( 'td', null, h( 'span', { className: 'atlasvoice-cell-title' }, r.name ), h( 'span', { className: 'atlasvoice-cell-sub' }, r.kind ) ),
						h( 'td', { className: 'atlasvoice-cell-main' }, r.sel ? h( 'span', { className: 'atlasvoice-mono' }, r.sel ) : h( 'span', { className: 'atlasvoice-weak' }, 'Uses the whole-site rule' ) ),
						h( 'td', null, h( AV.Chip, { tone: 'ok', dot: true }, 'Works' ) ) ) ) ) ),
					free && h( 'div', { style: { marginTop: 12 } }, h( AV.ProNote, null, 'A rule per content type or per post, and skipping share bars, captions and phrases.' ) ) ) );
		}
		return h( Fragment, null,
			h( AV.Pane, { tabs: [ [ 'where', 'Where it appears' ], [ 'text', 'Text to read' ], [ 'areas', 'Page areas' ] ], tab, setTab: ( t ) => { setTab( t ); ctx.setRouteSilently( 'content:' + t ); }, canvas: true, footer: tab !== 'areas' && h( AV.SaveBar, { dirty, onSave: () => { ctx.setContent( f ); saved(); notify( 'Saved. Cached pages may show the old player until your cache clears.' ); } } ) },
				h( AV.Scroll, { width: 860 }, body ) ),
			drawer === 'intro' && h( AV.Drawer, { title: 'Text before and after the post', kicker: 'Text to read', onClose: () => setDrawer( null ), footer: h( Button, { variant: 'primary', onClick: () => setDrawer( null ) }, 'Done' ) },
				h( AV.DS, null, h( VStack, { spacing: 4 },
					h( TextareaControl, { ...NM, label: 'Before the post', value: f.intro, onChange: ( v ) => up( { intro: v } ) } ),
					h( TextareaControl, { ...NM, label: 'After the post', value: f.outro, onChange: ( v ) => up( { outro: v } ) } ),
					h( 'p', { className: 'atlasvoice-weak' }, 'Use {title} for the post title. Saved with the rest of this screen.' ) ) ) ),
			drawer && drawer.id && h( RuleDrawer, { rule: drawer, onClose: () => setDrawer( null ) } ) );
	};

	/* ======================================================== audio library */
	/* Audio Jobs (TTS-354): each post + language + voice + text is one server-side job.
	   The library, the editor panel, the posts list and the status bar read the same jobs. */
	function ReviewDrawer( { post, onClose } ) {
		const ctx = useApp();
		const [ c, setC ] = useState( 'ok' );
		const [ own, setOwn ] = useState( '' );
		const first = post.langs[ 0 ];
		return h( AV.Drawer, { title: post.title, kicker: post.type + ' #' + post.id + ' · English · ' + post.chars.toLocaleString( 'en' ) + ' characters', onClose, footer: h( Fragment, null,
			h( Button, { variant: 'tertiary', className: 'atlasvoice-footer-note', onClick: onClose }, 'Cancel' ),
			c === 'fix' ? h( Button, { variant: 'primary', onClick: () => { onClose(); ctx.openPicker(); } }, 'Open the picker' ) : h( Button, { variant: 'primary', disabled: c === 'own' && ! own.trim(), onClick: () => { ctx.makeAudio( [ post.id ], { only: ctx.free ? 'EN' : undefined, force: first.st === 'Ready' } ); ctx.notify( 'Audio job started on the server. You can close this page.' ); onClose(); } }, c === 'own' ? 'Save and make audio' : first.st === 'Ready' ? 'Remake audio' : 'Make audio' ) ) },
			h( AV.DS, { title: 'Audio per language' }, h( VStack, { spacing: 2 }, post.langs.filter( ( l, i ) => ! ctx.free || i === 0 ).map( ( l ) => h( 'div', { key: l.l, className: 'atlasvoice-langrow' }, h( 'span', { className: 'atlasvoice-lang' }, l.l ), h( AV.JobChip, { l } ), h( 'span', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, l.st === 'Failed' ? l.reason : l.made ? 'made ' + l.made : l.src ) ) ) ) ),
			first.src === 'Not checked' && h( AV.DS, null, h( Notice, { status: 'warning', isDismissible: false }, 'No page-area rule matched this post, so the whole page is read. Crossed-out text is probably not part of the article.' ) ),
			h( AV.DS, { title: 'What will be read' }, h( 'div', { className: 'atlasvoice-review' }, post.title + '. Wear old clothes and sturdy boots. We provide gloves, tea and cake. ', h( 'mark', null, 'Share this · Facebook · Email' ), ' Meet at the mill gate at 9am. ', h( 'mark', null, 'Read more: Ten walks along the river' ) ), h( 'p', { className: 'atlasvoice-weak', style: { marginTop: 8 } }, 'About ' + Math.round( post.chars / 900 ) + ' min · made in ' + AV.partsOf( post.chars ) + ' parts on the server' ) ),
			h( AV.DS, { title: 'Is this right?' }, h( VStack, { spacing: 3 },
				h( C.RadioControl, { label: 'Is this right?', hideLabelFromVision: true, selected: c, onChange: setC, options: [ { label: 'Looks right: make the audio from this text', value: 'ok' }, { label: 'Fix what is read: pick the article area on the live page', value: 'fix' }, { label: 'Use my own text: paste the exact text, saved with the post', value: 'own' } ] } ),
				c === 'own' && h( TextareaControl, { ...NM, label: 'Your own text', help: own.length.toLocaleString( 'en' ) + ' / 100,000 characters', value: own, onChange: setOwn, rows: 5 } ) ) ) );
	}
	/* The bulk queue (Pro): what will be made, what it costs, then the server does it. */
	function QueueDrawer( { ids, onClose } ) {
		const ctx = useApp();
		const [ retry, setRetry ] = useState( true );
		const work = ctx.posts.filter( ( p ) => ids === 'missing' || ids.includes( p.id ) ).map( ( p ) => [ p, p.langs.filter( ( l ) => l.st === 'Missing' || l.st === 'Outdated' || ( retry && l.st === 'Failed' ) ) ] ).filter( ( x ) => x[ 1 ].length );
		const jobs = work.reduce( ( a, x ) => a + x[ 1 ].length, 0 );
		const chars = work.reduce( ( a, [ p, ls ] ) => a + p.chars * ls.length, 0 );
		const count = ( st ) => work.reduce( ( a, x ) => a + x[ 1 ].filter( ( l ) => l.st === st ).length, 0 );
		const [ cost, costNote ] = AV.estimate( ctx, chars );
		const over = ctx.today + chars > ctx.audio.perDay;
		return h( AV.Drawer, { title: jobs ? 'Make audio for ' + work.length + ( work.length === 1 ? ' post' : ' posts' ) : 'Nothing to make', kicker: 'Queue', onClose, footer: h( Fragment, null,
			h( Button, { variant: 'tertiary', className: 'atlasvoice-footer-note', onClick: onClose }, 'Cancel' ),
			h( Button, { variant: 'primary', disabled: ! jobs, onClick: () => { ctx.makeAudio( work.map( ( x ) => x[ 0 ].id ), { retry } ); onClose(); ctx.notify( jobs + ' audio jobs queued. They run on your server, ' + ctx.audio.workers + ' posts at a time.' ); } }, 'Start · ' + jobs + ( jobs === 1 ? ' job' : ' jobs' ) ) ) },
			h( AV.DS, null, h( AV.Stats, { items: [ [ 'Characters', '~' + chars.toLocaleString( 'en' ) ], [ 'Estimated cost', cost, costNote ] ] } ) ),
			h( AV.DS, null, h( VStack, { spacing: 3 },
				h( 'p', null, jobs ? count( 'Missing' ) + ' missing, ' + count( 'Outdated' ) + ' outdated' + ( retry ? ' and ' + count( 'Failed' ) + ' failed' : '' ) + ', across ' + work.length + ' posts. Audio that is already up to date is skipped, so nothing is paid twice.' : 'Every selected post is already up to date.' ),
				h( CheckboxControl, { ...NM, label: 'Retry failed audio (finished parts are kept)', checked: retry, onChange: setRetry } ),
				over && h( Notice, { status: 'warning', isDismissible: false }, 'This goes past today’s limit of ' + ctx.audio.perDay.toLocaleString( 'en' ) + ' characters. The rest waits until tomorrow, or raise the limit in Settings.' ),
				h( Notice, { status: 'info', isDismissible: false }, 'Runs on your server, ' + ctx.audio.workers + ' posts at a time. You can close this page; progress shows here and in the status bar.' ) ) ),
			h( AV.DS, { title: 'In this queue' }, work.length ? h( AV.Table, { head: [ 'Post', 'Languages', 'Characters' ] }, work.map( ( [ p, ls ] ) => h( 'tr', { key: p.id }, h( 'td', { className: 'atlasvoice-cell-main' }, p.title ), h( 'td', null, ls.map( ( l ) => l.l ).join( ', ' ) ), h( 'td', null, ( p.chars * ls.length ).toLocaleString( 'en' ) ) ) ) ) : h( 'p', { className: 'atlasvoice-weak' }, 'Nothing to make.' ) ) );
	}
	function AudioSettings() {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ f, setF ] = useState( { ...ctx.audio } );
		const [ dirty, saved ] = AV.useDirty( f );
		const up = ( p ) => setF( ( x ) => ( { ...x, ...p } ) );
		const num = ( v ) => Math.max( 0, parseInt( String( v ).replace( /\D/g, '' ), 10 ) || 0 );
		return h( Fragment, null, h( AV.Scroll, { width: 960 },
			h( AV.Section, { title: 'When audio is made' }, h( AV.Tiles, { value: f.when, onChange: ( v ) => up( { when: v } ), options: [
				{ id: 'play', title: 'On the first play', badge: h( AV.Chip, { tone: 'brand' }, 'Recommended' ), text: 'Nothing is spent until someone listens. The first listener hears part 1 within seconds.' },
				{ id: 'publish', title: 'When a post is published', text: 'Made in the background after Publish or Update, so nobody waits. Costs more for posts nobody plays.' },
				{ id: 'manual', title: 'Only when an editor clicks', text: 'Full control. Posts without audio offer the device voice to visitors.' } ] } ) ),
			h( 'div', { className: 'atlasvoice-grid is-2 atlasvoice-section' },
				h( Card, null, h( CardHeader, null, h( AV.H2, null, 'When a post’s text changes' ) ), h( CardBody, null, h( VStack, { spacing: 3 },
					h( C.RadioControl, { label: 'When a post’s text changes', hideLabelFromVision: true, selected: f.change, onChange: ( v ) => up( { change: v } ), options: [ { label: 'Mark it Outdated, remake on the next play', value: 'mark' }, { label: 'Remake right away, in the background', value: 'now' }, { label: 'Keep the old audio; only editors see Outdated', value: 'keep' } ] } ),
					h( 'p', { className: 'atlasvoice-weak' }, 'Small fixes (spaces, punctuation-only changes) don’t count as a change. Visitors hear the old audio until the new one is ready.' ) ) ) ),
				h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Spending limits' ) ), h( CardBody, null, h( VStack, { spacing: 4 },
					h( 'div', { className: 'atlasvoice-grid is-2' },
						h( TextControl, { ...N, label: 'Characters per day', value: f.perDay.toLocaleString( 'en' ), onChange: ( v ) => up( { perDay: num( v ) } ) } ),
						h( TextControl, { ...N, label: 'Largest post (characters)', value: f.largest.toLocaleString( 'en' ), onChange: ( v ) => up( { largest: num( v ) } ) } ) ),
					h( CheckboxControl, { ...NM, label: 'Visitors may start audio for a language that has none yet', checked: f.visitorsStart, onChange: ( v ) => up( { visitorsStart: v } ) } ),
					h( 'p', { className: 'atlasvoice-weak' }, 'When a limit is reached, new jobs wait and visitors get the device voice. You get one email.' ) ) ) ),
				! free && h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Languages that can have audio' ) ), h( CardBody, null, h( VStack, { spacing: 3 },
					h( C.FormTokenField, { ...NM, label: 'Languages', value: f.langs, suggestions: [ 'English', 'Spanish', 'French', 'German', 'Ukrainian', 'Bengali' ], onChange: ( v ) => up( { langs: v } ) } ),
					h( 'p', { className: 'atlasvoice-weak' }, 'With GTranslate on 35 languages, only these get paid audio; the rest use the device voice.' ) ) ) ),
				h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Background work' ) ), h( CardBody, null, h( VStack, { spacing: 4 },
					h( HStack, { justify: 'flex-start' }, h( AV.Chip, { tone: 'ok', dot: true }, 'Running' ), h( 'span', null, 'With Action Scheduler (found in WooCommerce)' ) ),
					h( 'p', { className: 'atlasvoice-weak' }, 'Without it, WP-Cron is used. If cron is switched off on your host, listeners’ status checks finish the job one part at a time, so it still completes.' ),
					! free && h( 'div', { style: { maxWidth: 240 } }, h( SelectControl, { ...N, label: 'Jobs at the same time', value: String( f.workers ), onChange: ( v ) => up( { workers: +v } ), options: opt( [ [ '1', '1' ], [ '2', '2' ], [ '3', '3' ], [ '5', '5' ] ] ) } ) ) ) ) ) ),
			free && h( AV.ProNote, null, 'A voice and audio for every language, and making audio for many posts at once.' ) ),
			h( AV.SaveBar, { dirty, onSave: () => { ctx.setAudio( f ); saved(); notify( 'Audio settings saved.' ); } } ) );
	}
	AV.S.library = function Library( { sub } ) {
		const ctx = useApp();
		const { free, notify, engine, posts } = ctx;
		const [ tab, setTab ] = useState( free && sub === 'clean' ? 'all' : sub || 'all' );
		const [ q, setQ ] = useState( '' );
		const [ status, setStatus ] = useState( 'all' );
		const [ src, setSrc ] = useState( 'any' );
		const [ picked, setPicked ] = useState( [] );
		const [ open, setOpen ] = useState( null );
		const [ files, setFiles ] = useState( 37 );
		const [ scan, setScan ] = useState( 'done' );
		const [ age, setAge ] = useState( '1h' );
		const tabs = [ [ 'all', 'All posts' ] ].concat( free ? [] : [ [ 'clean', 'Clean up' ] ], [ [ 'settings', 'Settings' ] ] );
		const setT = ( t ) => { setTab( t ); ctx.setRouteSilently( 'library:' + t ); };
		if ( engine === 'browser' ) {
			return h( AV.Pane, { tabs, tab, setTab: setT }, h( AV.Scroll, null, h( AV.Empty, { title: 'No audio files with the browser voice', action: h( Button, { variant: 'primary', onClick: () => ctx.go( 'voice' ) }, 'Choose a voice' ) }, 'The browser voice reads each post live, so nothing is saved. Switch to the natural voice to keep an MP3 of every post.' ) ) );
		}
		if ( tab === 'settings' ) return h( AV.Pane, { tabs, tab, setTab: setT, canvas: true }, h( AudioSettings ) );
		if ( tab === 'clean' ) {
			return h( AV.Pane, { tabs, tab, setTab: setT, canvas: true }, h( AV.Scroll, { width: 860 },
				h( AV.Section, { title: 'Files nothing uses any more', desc: 'Left behind after a post was deleted or its voice changed. Parts of unfinished jobs are cleaned up by the server on their own.' },
					h( 'div', { className: 'atlasvoice-section' }, h( AV.Stats, { items: [ [ 'Unused files', String( files ) ], [ 'Space they take', files ? '142 MB' : '0 MB' ] ] } ) ),
					h( Card, null, h( CardBody, null, h( HStack, { alignment: 'bottom', wrap: true, justify: 'flex-start' },
						h( 'div', { style: { width: 260 } }, h( SelectControl, { ...N, label: 'Only files older than', value: age, onChange: setAge, options: opt( [ [ '1h', '1 hour (safe)' ], [ '10m', '10 minutes' ] ] ) } ) ),
						h( Button, { variant: 'secondary', __next40pxDefaultSize: true, isBusy: scan === 'busy', onClick: () => { setScan( 'busy' ); setTimeout( () => { setScan( 'done' ); notify( 'Scan finished: ' + files + ' unused files.' ); }, 1200 ); } }, 'Scan again' ),
						h( Button, { variant: 'primary', isDestructive: true, __next40pxDefaultSize: true, disabled: ! files, onClick: () => ctx.modal( { title: 'Delete ' + files + ' unused files?', typed: 'DELETE', body: h( 'p', null, 'They take 142 MB. No post uses them. This cannot be undone.' ), ok: 'Delete files', destructive: true, onOk: () => { setFiles( 0 ); notify( 'Deleted. 142 MB freed.' ); } } ) }, 'Delete ' + files + ' files…' ) ) ) ) ) ) );
		}
		const vis = ( p ) => p.langs.filter( ( l, i ) => ! free || i === 0 );
		const has = ( p, st ) => vis( p ).some( ( l ) => l.st === st );
		const counts = Object.fromEntries( [ 'Missing', 'Outdated', 'Failed', 'Making', 'Ready' ].map( ( st ) => [ st, posts.filter( ( p ) => has( p, st ) ).length ] ) );
		const rows = posts.filter( ( p ) => ( ! q || ( p.title + p.id ).toLowerCase().includes( q.toLowerCase() ) ) && ( status === 'all' || has( p, status ) ) && ( src === 'any' || vis( p ).some( ( l ) => l.src === src ) ) );
		const post = posts.find( ( p ) => p.id === open );
		const making = posts.reduce( ( a, p ) => a + vis( p ).filter( ( l ) => l.st === 'Making' ).length, 0 );
		return h( Fragment, null,
			h( AV.Pane, { tabs, tab, setTab: setT, tabsEnd: h( 'span', { className: 'atlasvoice-weak' }, { play: 'Audio is made on the first play.', publish: 'Audio is made when a post is published.', manual: 'Audio is made only when an editor clicks.' }[ ctx.audio.when ] + ' ', h( Button, { variant: 'link', onClick: () => setT( 'settings' ) }, 'Change' ) ) },
				h( 'div', { className: 'atlasvoice-toolbar' },
					h( AV.TG, { label: 'Audio status', hide: true, value: status, onChange: setStatus, options: [ [ 'all', 'All ' + posts.length ], [ 'Missing', 'Missing ' + counts.Missing ], [ 'Outdated', 'Outdated ' + counts.Outdated ], [ 'Failed', 'Failed ' + counts.Failed ], [ 'Making', 'Making ' + counts.Making ], [ 'Ready', 'Ready ' + counts.Ready ] ] } ),
					h( SearchControl, { ...NM, size: 'compact', value: q, onChange: setQ, placeholder: 'Title or ID' } ),
					h( SelectControl, { ...NM, size: 'compact', label: 'Text source', hideLabelFromVision: true, value: src, onChange: setSrc, options: opt( [ [ 'any', 'Any text source' ], [ 'Not checked', 'Not checked' ], [ 'Custom text', 'Custom text' ], [ 'Page area rule', 'Page area rule' ] ] ) } ),
					h( 'span', { className: 'atlasvoice-toolbar-end atlasvoice-weak' }, rows.length + ( rows.length === 1 ? ' post' : ' posts' ) ) ),
				making > 0 && h( 'div', { className: 'atlasvoice-bulkbar' }, h( C.Spinner ), h( 'b', null, 'Making audio on the server' ), h( 'span', { className: 'atlasvoice-weak' }, making + ( making === 1 ? ' job' : ' jobs' ) + ', ' + ctx.audio.workers + ' at a time · nobody has to keep a page open' ) ),
				! free && picked.length > 0 && h( 'div', { className: 'atlasvoice-bulkbar' }, h( 'b', null, picked.length + ' selected' ),
					h( Button, { variant: 'primary', size: 'compact', onClick: () => ctx.setQueue( picked ) }, 'Make audio…' ),
					h( Button, { variant: 'tertiary', size: 'compact', onClick: () => setPicked( [] ) }, 'Clear selection' ) ),
				free && h( 'div', { className: 'atlasvoice-pad-x', style: { paddingBottom: 8 } }, h( AV.ProNote, null, 'Make audio for many posts at once, in every language. Free makes it one post at a time from “Review text”.' ) ),
				h( 'div', { className: 'atlasvoice-scroll' }, rows.length ? h( AV.Table, { head: ( free ? [] : [ { w: 40, l: h( CheckboxControl, { ...NM, 'aria-label': 'Select all', checked: rows.length > 0 && rows.every( ( p ) => picked.includes( p.id ) ), onChange: ( v ) => setPicked( v ? rows.map( ( p ) => p.id ) : [] ) } ) } ] ).concat( [ 'Post', free ? 'Audio' : 'Languages · audio', 'Characters', '' ] ) },
					rows.map( ( p ) => h( 'tr', { key: p.id, className: 'is-clickable' + ( picked.includes( p.id ) ? ' is-selected' : '' ), tabIndex: 0, onClick: () => setOpen( p.id ), onKeyDown: ( e ) => e.key === 'Enter' && setOpen( p.id ) },
						! free && h( 'td', { onClick: ( e ) => e.stopPropagation() }, h( CheckboxControl, { ...NM, 'aria-label': 'Select ' + p.title, checked: picked.includes( p.id ), onChange: ( v ) => setPicked( v ? picked.concat( p.id ) : picked.filter( ( x ) => x !== p.id ) ) } ) ),
						h( 'td', { className: 'atlasvoice-cell-main' }, h( 'span', { className: 'atlasvoice-cell-title' }, p.title ), h( 'span', { className: 'atlasvoice-cell-sub' }, p.type + ' · #' + p.id ) ),
						h( 'td', null, vis( p ).map( ( l ) => h( 'div', { key: l.l, className: 'atlasvoice-langrow' }, h( 'span', { className: 'atlasvoice-lang' }, l.l ), h( AV.JobChip, { l } ), l.st === 'Making' && h( 'span', { className: 'atlasvoice-meter', style: { width: 60, display: 'inline-block' } }, h( 'i', { style: { width: ( 100 * l.part / l.total ) + '%' } } ) ), l.st !== 'Making' && h( 'span', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, l.st === 'Failed' ? 'no provider credit' : l.made ? l.made : l.src ) ) ) ),
						h( 'td', null, p.chars.toLocaleString( 'en' ) ),
						h( 'td', { className: 'atlasvoice-td-end' }, h( HStack, { justify: 'flex-end', expanded: false },
							has( p, 'Failed' ) && h( Button, { variant: 'secondary', size: 'compact', onClick: ( e ) => { e.stopPropagation(); ctx.makeAudio( [ p.id ] ); notify( 'Trying again. Finished parts are kept.' ); } }, 'Try again' ),
							h( Button, { variant: 'secondary', size: 'compact', onClick: ( e ) => { e.stopPropagation(); setOpen( p.id ); } }, 'Review text' ) ) ) ) ) )
					: h( AV.Empty, { title: 'No posts match', action: h( Button, { variant: 'secondary', onClick: () => { setQ( '' ); setStatus( 'all' ); setSrc( 'any' ); } }, 'Clear filters' ) }, 'Try another status or text source.' ) ),
				h( 'div', { className: 'atlasvoice-pager' }, h( 'span', null, 'Showing ' + rows.length + ' of 214' ), h( HStack, { expanded: false }, h( Button, { size: 'compact', variant: 'tertiary', disabled: true }, 'Previous' ), h( Button, { size: 'compact', variant: 'tertiary', onClick: () => notify( 'The real list pages by 50 from the server.' ) }, 'Next' ) ) ) ),
			post && h( ReviewDrawer, { post, onClose: () => setOpen( null ) } ),
			! free && ctx.queue && h( QueueDrawer, { ids: ctx.queue, onClose: () => ctx.setQueue( null ) } ) );
	};

	/* ============================================================ insights */
	function ReportDrawer( { onClose } ) {
		const ctx = useApp();
		const [ f, setF ] = useState( { on: true, freq: 'w', day: 'mon', time: '09:00', to: 'rahima@example.com' } );
		const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test( f.to );
		return h( AV.Drawer, { title: 'Email report', kicker: 'Insights', onClose, footer: h( Fragment, null,
			h( Button, { variant: 'secondary', className: 'atlasvoice-footer-note', disabled: ! ok, onClick: () => ctx.notify( 'Test report sent to ' + f.to + '.' ) }, 'Send a test' ),
			h( Button, { variant: 'primary', disabled: f.on && ! ok, onClick: () => { onClose(); ctx.notify( f.on ? 'Report scheduled. Next: Monday 27 Oct at 09:00.' : 'Report turned off.' ); } }, 'Save' ) ) },
			h( AV.DS, null, h( VStack, { spacing: 4 },
				h( ToggleControl, { ...NM, label: 'Send a listening report', checked: f.on, onChange: ( v ) => setF( { ...f, on: v } ) } ),
				f.on && h( AV.TG, { label: 'How often', value: f.freq, onChange: ( v ) => setF( { ...f, freq: v } ), options: [ [ 'd', 'Daily' ], [ 'w', 'Weekly' ], [ 'm', 'Monthly' ] ] } ),
				f.on && h( 'div', { className: 'atlasvoice-grid is-2' }, h( SelectControl, { ...N, label: 'Day', value: f.day, onChange: ( v ) => setF( { ...f, day: v } ), options: opt( [ [ 'mon', 'Monday' ], [ 'fri', 'Friday' ] ] ) } ), h( TextControl, { ...N, type: 'time', label: 'Time', value: f.time, onChange: ( v ) => setF( { ...f, time: v } ) } ) ),
				f.on && h( TextControl, { ...N, type: 'email', label: 'Send to', value: f.to, onChange: ( v ) => setF( { ...f, to: v } ), help: ok ? 'Next report: Monday 27 Oct at 09:00.' : 'Add a valid email address.' } ) ) ),
			h( AV.DS, null, h( Notice, { status: 'warning', isDismissible: false }, 'This is a local site: WordPress may not send email without an SMTP plugin.' ) ) );
	}
	AV.S.insights = function Insights( { sub } ) {
		const ctx = useApp();
		const { free, notify, scn } = ctx;
		const [ tab, setTab ] = useState( sub || 'overview' );
		const [ range, setRange ] = useState( '30' );
		const [ cmp, setCmp ] = useState( true );
		const [ drawer, setDrawer ] = useState( null );
		const [ q, setQ ] = useState( '' );
		const [ t, setT ] = useState( { on: ctx.analytics, geo: false, track: 'all' } );
		const [ dirty, saved ] = AV.useDirty( t );
		const tabs = [ [ 'overview', 'Overview' ], [ 'posts', 'Posts' ], [ 'listeners', 'Listeners' ], [ 'tracking', 'Tracking' ] ];
		const end = h( Fragment, null,
			h( CheckboxControl, { ...NM, label: 'Compare', checked: cmp, onChange: setCmp } ),
			h( SelectControl, { ...NM, size: 'compact', label: 'Date range', hideLabelFromVision: true, value: range, onChange: setRange, options: opt( [ [ '7', 'Last 7 days' ], [ '30', 'Last 30 days' ] ].concat( free ? [] : [ [ '90', 'Last 90 days' ], [ 'all', 'All time' ] ] ) ) } ),
			! free && h( C.Dropdown, { popoverProps: { placement: 'bottom-end' }, renderToggle: ( { onToggle } ) => h( Button, { variant: 'secondary', size: 'compact', icon: h( I, { icon: 'download', size: 20 } ), onClick: onToggle }, 'Export' ),
				renderContent: ( { onClose } ) => h( C.MenuGroup, null, h( C.MenuItem, { onClick: () => { onClose(); notify( 'insights-last-' + range + '-days.csv downloaded.' ); } }, 'CSV file' ), h( C.MenuItem, { onClick: () => { onClose(); notify( 'PDF report downloaded.' ); } }, 'PDF report' ) ) } ),
			! free && h( Button, { variant: 'secondary', size: 'compact', onClick: () => setDrawer( 'report' ) }, 'Email report' ) );
		const top = AV.POSTS.filter( ( p ) => p.plays ).sort( ( a, b ) => b.plays - a.plays );
		let body;
		if ( scn === 'new' && tab !== 'tracking' ) {
			body = h( Card, null, h( AV.Empty, { title: 'No plays yet', action: ctx.mode === 'staging' && h( Button, { variant: 'primary', onClick: () => ctx.askMode( 'live' ) }, 'Go live' ) }, 'Numbers appear here after you go live and visitors press play. Plays are counted on your own site, without cookies.' ) );
		} else if ( tab === 'overview' ) {
			body = h( Fragment, null,
				h( 'div', { className: 'atlasvoice-section' }, h( AV.Stats, { items: [ [ 'Plays', '4,920', cmp ? '+22% vs previous ' + range + ' days' : '' ], [ 'Listening time', '163 h', cmp ? '+15%' : '' ], [ 'Finished listening', '38%', cmp ? '−2%' : '' ], [ 'MP3 downloads', '89', cmp ? '+31%' : '' ] ] } ) ),
				h( 'div', { className: 'atlasvoice-grid is-2 atlasvoice-section' },
					h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Plays per day' ) ), h( CardBody, null, h( AV.Bars, { values: [ 22, 30, 26, 41, 38, 35, 52, 48, 44, 60, 57, 49, 63, 71, 66, 58, 74, 80, 69, 77, 88, 84, 79, 92, 98, 90, 100, 96, 89, 99 ].slice( range === '7' ? -7 : 0 ), from: range === '7' ? '20 Oct' : '27 Sep', to: '26 Oct' } ) ) ),
					h( Card, null, h( CardHeader, null, h( AV.H2, null, 'How far people listen' ) ), h( CardBody, null, h( AV.HBars, { rows: [ [ 'Started', 100 ], [ 'Reached 25%', 71 ], [ 'Reached 50%', 55 ], [ 'Reached 75%', 44 ], [ 'Finished', 38 ] ] } ) ) ) ),
				h( 'div', { className: 'atlasvoice-section' }, h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Most played posts' ), h( Button, { variant: 'link', onClick: () => setTab( 'posts' ) }, 'All posts' ) ),
					h( AV.Table, { head: [ 'Post', 'Plays', 'Finished' ] }, top.slice( 0, 5 ).map( ( p ) => h( 'tr', { key: p.id, className: 'is-clickable', tabIndex: 0, onClick: () => setDrawer( p ), onKeyDown: ( e ) => e.key === 'Enter' && setDrawer( p ) }, h( 'td', { className: 'atlasvoice-cell-main' }, p.title ), h( 'td', null, p.plays ), h( 'td', null, p.done + '%' ) ) ) ) ) ),
				free ? h( AV.ProNote, null, '90 days and all time, busiest hours, export and a scheduled email report. Free shows up to 30 days.' )
					: h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Busiest hours' ), h( 'span', { className: 'atlasvoice-weak' }, 'Local time' ) ), h( CardBody, null, h( 'div', { className: 'atlasvoice-heat', role: 'img', 'aria-label': 'Busiest on weekday evenings, 19:00 to 22:00' },
						[ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ].map( ( d, di ) => h( Fragment, { key: d }, h( 'span', null, d ), Array.from( { length: 24 }, ( _, hr ) => h( 'i', { key: hr, title: d + ' ' + hr + ':00', style: { opacity: Math.min( 1, Math.max( 0.06, Math.sin( ( hr - 6 ) / 24 * Math.PI * 2 ) * 0.5 + 0.5 - ( hr < 6 ? 0.4 : 0 ) + ( di > 4 ? 0.15 : 0 ) ) ) } } ) ) ) ) ) ) ) );
		} else if ( tab === 'posts' ) {
			const list = AV.POSTS.filter( ( p ) => ! q || ( p.title + p.id ).toLowerCase().includes( q.toLowerCase() ) );
			body = h( Card, null, h( 'div', { className: 'atlasvoice-toolbar' }, h( SearchControl, { ...NM, size: 'compact', value: q, onChange: setQ, placeholder: 'Find a post by title or ID' } ) ),
				h( AV.Table, { head: [ 'Post', 'Plays', 'Finished', 'Downloads', 'Average listen' ] }, list.map( ( p ) => h( 'tr', { key: p.id, className: 'is-clickable', tabIndex: 0, onClick: () => setDrawer( p ), onKeyDown: ( e ) => e.key === 'Enter' && setDrawer( p ) }, h( 'td', { className: 'atlasvoice-cell-main' }, p.title ), h( 'td', null, p.plays ), h( 'td', null, p.done + '%' ), h( 'td', null, p.dl ), h( 'td', null, p.plays ? '3:' + ( 10 + ( p.dl % 50 ) ) : '—' ) ) ) ) );
		} else if ( tab === 'listeners' ) {
			body = h( Fragment, null,
				h( 'div', { className: 'atlasvoice-section' }, h( AV.Stats, { items: [ [ 'New listeners', '1,912', '+19%' ], [ 'Returning listeners', '684', '+6%' ], [ 'Left before 10 seconds', '11%', '−3%' ] ] } ) ),
				h( 'div', { className: 'atlasvoice-grid is-3 atlasvoice-section' },
					h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Devices' ) ), h( CardBody, null, h( AV.HBars, { rows: [ [ 'Phone', 64 ], [ 'Desktop', 31 ], [ 'Tablet', 5 ] ] } ) ) ),
					h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Browsers' ) ), h( CardBody, null, h( AV.HBars, { rows: [ [ 'Chrome', 58 ], [ 'Safari', 27 ], [ 'Edge', 9 ], [ 'Other', 6 ] ] } ) ) ),
					h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Systems' ) ), h( CardBody, null, h( AV.HBars, { rows: [ [ 'Android', 41 ], [ 'iOS', 23 ], [ 'Windows', 25 ], [ 'macOS', 11 ] ] } ) ) ) ),
				h( Card, null, h( CardHeader, null, h( AV.H2, null, 'Countries and cities' ) ), h( CardBody, null, t.geo ? h( AV.HBars, { rows: [ [ 'United Kingdom', 48 ], [ 'Spain', 21 ], [ 'United States', 14 ] ] } ) : h( HStack, { wrap: true }, h( 'span', { className: 'atlasvoice-weak' }, 'Off on this site. When on, visitor IP addresses are sent to ip-api.com to look up the country.' ), h( Button, { variant: 'secondary', size: 'compact', onClick: () => setTab( 'tracking' ) }, 'Open Tracking' ) ) ) ) );
		} else {
			body = h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Toggle, { label: 'Count plays', help: 'Counted on your own site. When this is off, nothing about visitors is stored.', checked: t.on, onChange: ( v ) => setT( { ...t, on: v } ) } ),
				t.on && h( AV.Toggle, { label: 'Show listener country', help: 'When on, visitor IP addresses are sent to ip-api.com to look up the country. Mention it in your privacy policy.', checked: t.geo, onChange: ( v ) => setT( { ...t, geo: v } ) } ),
				t.on && h( Item, null, h( SelectControl, { ...N, label: 'Posts to track', help: free ? '' : 'Pro sets this to all posts when activated.', value: t.track, onChange: ( v ) => setT( { ...t, track: v } ), options: opt( [ [ 'all', 'All posts' ], [ 'some', 'Only posts I choose' ] ] ) } ), t.track === 'some' && h( 'div', { style: { marginTop: 12 } }, h( C.FormTokenField, { ...NM, label: 'Posts', value: [ 'How we restored the old mill' ], suggestions: AV.POSTS.map( ( p ) => p.title ), onChange: () => {} } ) ) ) ) );
		}
		return h( Fragment, null,
			h( AV.Pane, { tabs, tab, setTab: ( x ) => { setTab( x ); ctx.setRouteSilently( 'insights:' + x ); }, tabsEnd: tab !== 'tracking' && end, canvas: true, footer: tab === 'tracking' && h( AV.SaveBar, { dirty, onSave: () => { ctx.setAnalytics( t.on ); saved(); notify( t.on ? 'Tracking saved.' : 'Counting is off. Nothing about visitors is stored from now on.' ); } } ) }, h( AV.Scroll, { width: 1180 }, body ) ),
			drawer === 'report' && h( ReportDrawer, { onClose: () => setDrawer( null ) } ),
			drawer && drawer.id && h( AV.Drawer, { title: drawer.title, kicker: 'Last ' + range + ' days', onClose: () => setDrawer( null ), footer: h( Button, { variant: 'secondary', onClick: () => { setDrawer( null ); ctx.setView( 'editor' ); } }, 'Open in the editor' ) },
				h( AV.DS, null, h( AV.Stats, { items: [ [ 'Plays', String( drawer.plays ) ], [ 'Finished', drawer.done + '%' ], [ 'Downloads', String( drawer.dl ) ] ] } ) ),
				h( AV.DS, { title: 'How far people listen' }, h( AV.HBars, { rows: [ [ 'Started', 100 ], [ 'Reached 50%', Math.min( 99, drawer.done + 17 ) ], [ 'Finished', drawer.done ] ] } ) ),
				h( AV.DS, { title: 'Plays per day' }, h( AV.Bars, { values: [ 10, 22, 18, 30, 44, 38, 52, 61, 40, 33, 48, 70, 66, 59 ], from: '13 Oct', to: '26 Oct' } ) ) ) );
	};

	/* ================================================================== seo */
	AV.S.seo = function Seo() {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ f, setF ] = useState( { on: true, join: true, type: 'auto', crawler: true, name: 'Listen: {title}', desc: 'Audio version of {title}, read aloud.', speak: true, sel: '.entry-title\n.entry-content p:first-of-type' } );
		const [ dirty, saved ] = AV.useDirty( f );
		const up = ( p ) => setF( ( x ) => ( { ...x, ...p } ) );
		if ( free ) {
			return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 900 }, h( Card, null, h( CardBody, null, h( 'div', { className: 'atlasvoice-hero' },
				h( VStack, { spacing: 4, style: { flex: 1 } }, h( HStack, { justify: 'flex-start' }, h( AV.Pro ), h( 'b', null, 'Audio in search results and AI answers' ) ),
					h( 'p', null, 'AtlasVoice Pro describes each post’s MP3 to Google and AI assistants: an AudioObject with the real length, language and date, joined into your SEO plugin’s schema (Yoast, Rank Math, AIOSEO), Speakable sections for Google Assistant, and a plain MP3 link for crawlers that don’t run JavaScript.' ),
					h( 'ul', { className: 'atlasvoice-list' }, h( 'li', null, 'One description per page, never a second schema block' ), h( 'li', null, 'Measured audio length for every file' ), h( 'li', null, 'Test any post in Google’s Rich Results Test' ) ),
					h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'primary', onClick: () => ctx.go( 'plans' ) }, 'See plans' ), h( Button, { variant: 'secondary', onClick: () => AV.ext( notify, 'the Pro free trial page' ) }, 'Start a free trial' ) ) ),
				h( 'pre', { className: 'atlasvoice-code', style: { flex: 'none', maxWidth: 320 } }, '{\n  "@type": "AudioObject",\n  "name": "Listen: How we\n   restored the old mill",\n  "duration": "PT4M5S",\n  "inLanguage": "en-GB"\n}' ) ) ) ) ) );
		}
		return h( AV.Pane, { canvas: true, footer: h( AV.SaveBar, { dirty, onSave: () => { if ( f.speak && ! f.sel.trim() ) { notify( 'Add at least one CSS selector, or turn Speakable off.' ); return; } saved(); notify( 'SEO settings saved.' ); } } ) }, h( 'div', { className: 'atlasvoice-withpreview' },
			h( AV.Scroll, { width: 820 },
				h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: 'info', isDismissible: false }, h( 'b', null, 'Yoast SEO found: audio joins its schema. ' ), 'Each page keeps one description. With SEOPress or no SEO plugin, AtlasVoice prints its own small block. Nothing is added while this is off.' ) ),
				h( AV.Section, { title: 'Audio in search results' }, h( Card, null, h( ItemGroup, { isSeparated: true },
					h( AV.Toggle, { label: 'Add audio structured data', help: 'An AudioObject with the real length, language and date.', checked: f.on, onChange: ( v ) => up( { on: v } ) } ),
					f.on && h( AV.Toggle, { label: 'Join my SEO plugin’s schema', checked: f.join, onChange: ( v ) => up( { join: v } ) } ),
					f.on && h( Item, null, h( SelectControl, { ...N, label: 'Article type', value: f.type, onChange: ( v ) => up( { type: v } ), options: opt( [ [ 'auto', 'Automatic' ], [ 'Article', 'Article' ], [ 'BlogPosting', 'BlogPosting' ], [ 'NewsArticle', 'NewsArticle' ] ] ) } ) ),
					f.on && h( AV.Toggle, { label: 'Plain MP3 link for AI crawlers', help: 'For crawlers that don’t run JavaScript, such as GPTBot and ClaudeBot.', checked: f.crawler, onChange: ( v ) => up( { crawler: v } ) } ) ) ) ),
				f.on && h( AV.Section, { title: 'Audio name and description', desc: 'Use {title} for the post title.' }, h( Card, null, h( CardBody, null, h( VStack, { spacing: 4 }, h( TextControl, { ...N, label: 'Name', value: f.name, onChange: ( v ) => up( { name: v } ) } ), h( TextControl, { ...N, label: 'Description', value: f.desc, onChange: ( v ) => up( { desc: v } ) } ) ) ) ) ),
				f.on && h( AV.Section, { title: 'Speakable sections', desc: 'Tell Google Assistant which parts to read aloud.' }, h( Card, null, h( ItemGroup, { isSeparated: true },
					h( AV.Toggle, { label: 'Mark speakable sections', checked: f.speak, onChange: ( v ) => up( { speak: v } ) } ),
					f.speak && h( Item, null, h( TextareaControl, { ...NM, label: 'CSS selectors, one per line', className: 'atlasvoice-mono', value: f.sel, onChange: ( v ) => up( { sel: v } ), help: f.sel.trim() ? '' : 'Add at least one CSS selector, or turn Speakable off.' } ) ) ) ) ),
				h( AV.Section, { title: 'Audio length', desc: '182 of 214 posts have a measured length. 32 are waiting.' }, h( Card, null, h( CardBody, null, h( HStack, { wrap: true, justify: 'flex-start' },
					h( Button, { variant: 'secondary', onClick: () => notify( 'Measuring 32 files in the background.' ) }, 'Measure waiting files now' ),
					h( Button, { variant: 'secondary', icon: h( I, { icon: 'external' } ), onClick: () => AV.ext( notify, 'Google’s Rich Results Test for your newest post' ) }, 'Test in Google' ),
					h( Button, { variant: 'link', onClick: () => AV.ext( notify, 'the Schema.org validator' ) }, 'Schema.org validator' ) ) ) ) ) ),
			h( 'aside', { className: 'atlasvoice-preview' }, h( 'div', { className: 'atlasvoice-preview-head' }, h( 'b', null, 'What search engines get' ) ),
				h( 'pre', { className: 'atlasvoice-code' }, '{\n  "@type": "AudioObject",\n  "name": "' + f.name.replace( '{title}', 'How we restored the old mill' ) + '",\n  "description": "' + f.desc.replace( '{title}', 'How we restored the old mill' ) + '",\n  "duration": "PT4M5S",\n  "inLanguage": "en-GB",\n  "contentUrl": "…/old-mill.mp3",\n  "uploadDate": "2026-10-18"\n}' ),
				h( 'p', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, f.join ? 'Printed inside Yoast’s graph.' : 'Printed as its own block.' ) ) ) );
	};

	/* =========================================================== site health */
	const CHECKS = [ [ 'Player loads on your posts', 'Checked on 5 recent posts' ], [ 'Staging or live', null ], [ 'Voice connection and usage', null ], [ 'Caching and minify plugins', 'LiteSpeed Cache: our scripts are excluded' ], [ 'CDN headers', null ], [ 'Uploads folder can be written', 'wp-content/uploads' ], [ 'Translation plugins and voices', null ], [ 'Failed audio in the last 7 days', 'None' ], [ 'PHP and WordPress', 'PHP 8.2 · WordPress 7.1' ], [ 'AtlasVoice and Pro versions fit', '2.5.0 with Pro 3.6.0', 'pro' ], [ 'Google Cloud key readable', 'Stored encrypted', 'google' ], [ 'PHP bcmath extension', 'Needed by Google Cloud', 'google' ], [ 'Cloud Storage uploads', 'Bucket reachable, browser access set by AtlasVoice', 'google' ] ];
	AV.S.health = function Health( { sub } ) {
		const ctx = useApp();
		const { free, notify, scn } = ctx;
		const [ run, setRun ] = useState( 'old' );
		const [ cors, setCors ] = useState( sub === 'cors' );
		const issues = AV.issues( ctx );
		const val = ( c ) => {
			if ( c[ 0 ] === 'Staging or live' ) return [ ctx.mode === 'live' ? 'ok' : 'warn', ctx.mode === 'live' ? 'Live since 18 October' : 'Staging: visitors can’t hear your audio' ];
			if ( c[ 0 ] === 'Voice connection and usage' ) return [ scn === 'bad' ? 'err' : 'ok', ctx.engine === 'browser' ? 'Browser voice: nothing to connect' : 'Connected · ' + AV.usageOf( ctx ).pct + '% used' ];
			if ( c[ 0 ] === 'CDN headers' ) return [ scn === 'bad' ? 'err' : 'ok', scn === 'bad' ? '2 scripts blocked by Cloudflare' : 'No blocked scripts seen' ];
			if ( c[ 0 ] === 'Translation plugins and voices' ) return [ scn === 'bad' && ! free ? 'warn' : 'ok', free ? 'Polylang: read in the site language' : scn === 'bad' ? 'Polylang: Español has no voice' : 'Polylang: every language has a voice' ];
			return [ 'ok', c[ 1 ] ];
		};
		const list = CHECKS.filter( ( c ) => ( c[ 2 ] !== 'pro' || ! free ) && ( c[ 2 ] !== 'google' || ctx.providers.google ) );
		return h( Fragment, null,
			h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 900 },
				h( AV.Section, { title: issues.length ? 'Things that need you' : 'Nothing needs you', desc: run === 'busy' ? 'Checking…' : run === 'new' ? 'Checked just now.' : 'Checked today at 09:12. Takes about 10 seconds; nothing on your site changes.', end: h( Button, { variant: 'primary', isBusy: run === 'busy', disabled: run === 'busy', onClick: () => { setRun( 'busy' ); setTimeout( () => { setRun( 'new' ); notify( 'Health check finished: ' + ( list.length - issues.length ) + ' passed, ' + issues.length + ' need attention.' ); }, 1400 ); } }, run === 'busy' ? 'Checking…' : 'Check again' ) },
					h( Card, null, run === 'busy' ? h( CardBody, null, h( HStack, { justify: 'flex-start' }, h( Spinner ), h( 'span', null, 'Loading a post as a visitor and checking every plugin…' ) ) )
						: issues.length ? h( ItemGroup, { isSeparated: true }, issues.map( ( [ tn, t, d, b, fn ] ) => h( Item, { key: t }, h( 'div', { className: 'atlasvoice-issue' }, h( I, { icon: tn === 'err' ? 'error' : tn === 'info' ? 'info' : 'caution', style: { color: tone( tn ), flex: 'none' } } ), h( 'div', { className: 'atlasvoice-issue-text' }, h( 'b', null, t ), h( 'span', { className: 'atlasvoice-weak' }, d ) ), h( Button, { variant: 'secondary', size: 'compact', onClick: t.startsWith( 'Some visitors' ) ? () => setCors( true ) : fn }, b ) ) ) ) )
							: h( CardBody, null, h( 'p', { className: 'atlasvoice-weak' }, 'Your player loads, audio is being made, and no plugin is in the way.' ) ) ) ),
				h( AV.Section, { title: 'Everything we check' }, h( Card, null, h( ItemGroup, { isSeparated: true }, list.map( ( c ) => { const [ tn, d ] = val( c ); return h( Item, { key: c[ 0 ] }, h( HStack, { justify: 'flex-start', spacing: 3, alignment: 'top' }, h( I, { icon: tn === 'ok' ? 'check' : 'caution', style: { color: tone( tn ), flex: 'none' } } ), h( VStack, { spacing: 0 }, h( 'b', { style: { fontWeight: 500 } }, c[ 0 ] ), h( 'span', { className: 'atlasvoice-weak' }, d ) ) ) ); } ) ) ) ),
				h( AV.Section, { title: 'Plugins we work with', desc: 'We adjust to them automatically.' }, h( Card, null, h( AV.Table, { label: 'Plugins we work with', head: [ 'Plugin', 'What we do', 'Status' ] },
					[ [ 'WP Rocket', 'Excluded from delay and minify', 'ok', 'Works' ], [ 'Cloudflare', scn === 'bad' ? 'Missing Access-Control-Allow-Origin header on 2 scripts' : 'No problems seen', scn === 'bad' ? 'err' : 'ok', scn === 'bad' ? 'Fix needed' : 'Works' ], [ 'Autoptimize', 'Found, but not active', '', 'Installed, not active' ], [ 'W3 Total Cache', '—', '', 'Not installed' ], [ 'Polylang', '4 languages', 'ok', 'Works' ], [ 'Yoast SEO', free ? 'Nothing to do' : 'Audio joins Yoast’s schema', 'ok', 'Works' ], [ 'Elementor', 'AtlasVoice widget available', 'ok', 'Works' ], [ 'Advanced Custom Fields', 'Fields can be read aloud', 'ok', 'Works' ] ].map( ( r ) => h( 'tr', { key: r[ 0 ] }, h( 'td', null, h( 'span', { className: 'atlasvoice-cell-title' }, r[ 0 ] ) ), h( 'td', { className: 'atlasvoice-cell-main' }, r[ 1 ] ), h( 'td', null, h( AV.Chip, { tone: r[ 2 ], dot: true }, r[ 3 ] ) ) ) ) ) ) ) ) ),
			cors && h( AV.Drawer, { title: 'Fix the Cloudflare header', kicker: 'Health · about 2 minutes', onClose: () => setCors( false ), footer: h( Button, { variant: 'primary', onClick: () => { setCors( false ); ctx.setScn( 'live' ); notify( 'Checked again: the scripts load for every visitor now.' ); } }, 'I’ve done it, check again' ) },
				h( AV.DS, null, h( 'p', null, 'Your CDN serves AtlasVoice scripts without a header browsers need, so some visitors don’t get the player.' ) ),
				h( AV.DS, { title: 'Steps' }, h( 'ol', { className: 'atlasvoice-list' }, h( 'li', null, 'In Cloudflare, open Rules → Transform Rules → Modify Response Header.' ), h( 'li', null, 'Add Access-Control-Allow-Origin with your site address for /wp-content/plugins/text-to-audio/*.' ), h( 'li', null, 'Purge the Cloudflare cache.' ) ) ),
				h( AV.DS, { title: 'Apache or nginx instead' }, h( 'pre', { className: 'atlasvoice-code' }, '<FilesMatch "\\.(js|mp3)$">\n  Header set Access-Control-Allow-Origin "https://yoursite.com"\n</FilesMatch>' ), h( 'div', { style: { marginTop: 8 } }, h( Button, { variant: 'secondary', icon: h( I, { icon: 'copy' } ), onClick: () => AV.copyText( notify, 'Header set Access-Control-Allow-Origin', 'Snippet' ) }, 'Copy' ) ) ) ) );
	};

	AV.S.versions = function Versions() {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ what, setWhat ] = useState( 'both' );
		const [ pick, setPick ] = useState( 0 );
		const [ au, setAu ] = useState( { free: true, pro: true } );
		const [ plan, setPlan ] = useState( false );
		const V = [ [ free ? '2.4.0' : '2.4.0 + Pro 3.5.0', 'Safe', 'ok', 'Recommended · released 3 Nov' ], [ free ? '2.3.22' : '2.3.22 + Pro 3.4.16', 'Safe', 'ok', 'Released 24 Oct' ], [ free ? '2.3.12' : '2.3.12 + Pro 3.4.8', 'Works, with changes', 'warn', 'The natural voice isn’t in this version, so posts use the browser voice until you update.' ], [ '2.2.0', 'Blocked', 'err', 'Too old for your saved settings.' ] ];
		return h( Fragment, null, h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 860 },
			h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: 'info', isDismissible: false }, h( 'b', null, 'You are on AtlasVoice 2.5.0' + ( free ? '' : ' with Pro 3.6.0' ) + '. ' ), 'If something stopped working after an update, go back to an earlier version. Settings and audio files are kept.' ) ),
			! free && h( 'div', { className: 'atlasvoice-section' }, h( AV.TG, { label: 'What to roll back', value: what, onChange: setWhat, options: [ [ 'both', 'Both (recommended)' ], [ 'pro', 'Only AtlasVoice Pro' ], [ 'free', 'Only AtlasVoice' ] ] } ) ),
			h( AV.Section, { title: 'Choose a version', desc: 'Checked against this site: PHP 8.2, WordPress 7.1' + ( free ? '' : ', Pro licence active' ) + '.' }, h( Card, null, V.map( ( v, i ) => h( 'label', { key: v[ 0 ], className: 'atlasvoice-radio-row' + ( pick === i ? ' is-on' : '' ), style: v[ 2 ] === 'err' ? { cursor: 'not-allowed' } : null },
				h( 'input', { type: 'radio', name: 'atlasvoice-ver', checked: pick === i, disabled: v[ 2 ] === 'err', onChange: () => setPick( i ) } ),
				h( VStack, { spacing: 0, style: { flex: 1 } }, h( 'b', null, v[ 0 ] ), h( 'span', { className: 'atlasvoice-weak' }, v[ 3 ] ) ), h( AV.Chip, { tone: v[ 2 ], dot: true }, v[ 1 ] ) ) ) ) ),
			h( AV.Section, { title: 'Automatic updates' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Toggle, { label: 'AtlasVoice updates itself', help: 'WordPress installs new versions automatically.', checked: au.free, onChange: ( v ) => { setAu( { ...au, free: v } ); notify( v ? 'Automatic updates on.' : 'Automatic updates paused.' ); } } ),
				! free && h( AV.Toggle, { label: 'AtlasVoice Pro updates itself', checked: au.pro, onChange: ( v ) => { setAu( { ...au, pro: v } ); notify( v ? 'Pro updates itself.' : 'Pro automatic updates paused.' ); } } ) ) ) ),
			h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'primary', onClick: () => setPlan( true ) }, 'Roll back to ' + V[ pick ][ 0 ].split( ' ' )[ 0 ] + '…' ), h( 'span', { className: 'atlasvoice-weak' }, 'Not offered on sites run from Git or SVN, or when no older version exists.' ) ) ) ),
			plan && h( RollbackDrawer, { v: V[ pick ], what, onClose: () => setPlan( false ) } ) );
	};
	function RollbackDrawer( { v, what, onClose } ) {
		const ctx = useApp();
		const [ ok, setOk ] = useState( false );
		const [ step, setStep ] = useState( 0 );
		useEffect( () => { if ( step > 0 && step < 4 ) { const t = setTimeout( () => setStep( step + 1 ), 900 ); return () => clearTimeout( t ); } }, [ step ] );
		const steps = [ 'Checked this site', 'Downloaded ' + v[ 0 ].split( ' ' )[ 0 ], 'Replaced files', 'Done' ];
		return h( AV.Drawer, { title: step ? ( step < 4 ? 'Rolling back…' : 'Rolled back to ' + v[ 0 ] ) : 'Roll back to ' + v[ 0 ] + '?', kicker: 'Versions', onClose: () => step === 0 || step === 4 ? onClose() : null, footer: step === 0 ? h( Fragment, null, h( Button, { variant: 'tertiary', className: 'atlasvoice-footer-note', onClick: onClose }, 'Cancel' ), h( Button, { variant: 'primary', disabled: ! ok, onClick: () => setStep( 1 ) }, 'Roll back now' ) ) : step === 4 && h( Button, { variant: 'primary', onClick: () => { onClose(); ctx.notify( 'Rolled back. Clear your cache plugin, then check a post.' ); } }, 'Done' ) },
			step === 0 ? h( Fragment, null,
				h( AV.DS, { title: 'The plan' }, h( 'ul', { className: 'atlasvoice-list' }, ! ctx.free && what === 'both' && h( 'li', null, 'Pro goes back first, then AtlasVoice.' ), h( 'li', null, 'Settings and audio files are kept.' ), h( 'li', null, 'Takes about 20 seconds; the site keeps working.' ), v[ 2 ] === 'warn' && h( 'li', null, v[ 3 ] ) ) ),
				h( AV.DS, null, h( CheckboxControl, { ...NM, label: 'I understand settings added after this version are ignored until I update again', checked: ok, onChange: setOk } ) ) )
				: h( AV.DS, null, h( 'ol', { className: 'atlasvoice-steps', style: { padding: 0 } }, steps.map( ( s, i ) => h( 'li', { key: s }, h( 'span', { className: 'atlasvoice-step' + ( i < step ? ' is-done' : i === step ? ' is-current' : '' ) }, h( 'span', { className: 'atlasvoice-step-n' }, i < step ? '✓' : i + 1 ), s, i === step && step < 4 && h( Spinner ) ) ) ) ),
					step === 4 && h( Notice, { status: 'success', isDismissible: false }, 'Clear your cache plugin, then open a post to check the player.' ) ) );
	}

	AV.S.advanced = function Advanced() {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ f, setF ] = useState( { tb: true, hide: false, picker: true, widget: true, keep: false, nostop: false, del: false } );
		const [ dirty, saved ] = AV.useDirty( f );
		const up = ( p ) => setF( ( x ) => ( { ...x, ...p } ) );
		return h( AV.Pane, { canvas: true, footer: h( AV.SaveBar, { dirty, onSave: () => { saved(); notify( 'Advanced settings saved.' ); } } ) }, h( AV.Scroll, { width: 860 },
			h( AV.Section, { title: 'Toolbar and dashboard' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Toggle, { label: 'Show AtlasVoice in the toolbar', help: 'Staging or Live, with Go live and Pick content to read.', checked: f.tb, onChange: ( v ) => up( { tb: v } ) } ),
				h( AV.Toggle, { label: 'Show “Hide the player on this post” in the toolbar', checked: f.hide, onChange: ( v ) => up( { hide: v } ) } ),
				h( AV.Toggle, { label: 'Show the content picker button on posts', checked: f.picker, onChange: ( v ) => up( { picker: v } ) } ),
				h( AV.Toggle, { label: 'Show the AtlasVoice dashboard widget', help: 'Plays and listening time on the WordPress dashboard.', checked: f.widget, onChange: ( v ) => up( { widget: v } ) } ) ) ) ),
			h( AV.Section, { title: 'Browser voice playback' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Toggle, { label: 'Keep reading when the visitor switches tabs', checked: f.keep, onChange: ( v ) => up( { keep: v } ) } ),
				h( AV.Toggle, { label: 'Don’t start again when the visitor comes back to the tab', checked: f.nostop, onChange: ( v ) => up( { nostop: v } ) } ) ) ) ),
			h( AV.Section, { title: 'Maintenance' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Row, { title: 'Clear AtlasVoice cache', help: 'Use after changing your theme or caching plugin.' }, h( Button, { variant: 'secondary', onClick: () => notify( 'AtlasVoice cache cleared.' ) }, 'Clear cache' ) ),
				h( AV.Toggle, { label: 'Delete all AtlasVoice data when the plugin is deleted', help: 'Settings, statistics and audio files' + ( free ? '' : ', plus Pro’s keys, folder and schedules' ) + '. Off by default.', checked: f.del, onChange: ( v ) => up( { del: v } ) } ),
				h( AV.Row, { title: 'Run the setup wizard again', help: 'Starts from your current settings.' }, h( Button, { variant: 'secondary', onClick: () => { ctx.setSetup( ( s ) => ( { ...s, finished: false, done: [], current: 'hear' } ) ); ctx.go( 'setup' ); } }, 'Open setup' ) ) ) ) ) ) );
	};

	AV.S.privacy = function Privacy() {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ tel, setTel ] = useState( true );
		return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 860 },
			h( AV.Section, { title: 'Your privacy policy', desc: 'Suggested text is in Settings → Privacy.' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Row, { title: 'What AtlasVoice adds', help: 'Plays and listening time on your site; post text sent to make natural-voice audio; country lookup only if turned on' + ( free ? '.' : '; on-page translation for Pro MP3 voices (to confirm).' ) }, h( Button, { variant: 'secondary', onClick: () => notify( 'In the plugin this opens Settings → Privacy → Policy guide.' ) }, 'Open suggested text' ) ) ) ) ),
			h( AV.Section, { title: 'Visitor data' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Row, { title: 'Export or erase one person’s data', help: 'Use Tools → Export Personal Data or Erase Personal Data; “AtlasVoice Analytics Data” is included.' }, h( AV.Chip, { tone: 'ok', dot: true }, 'Connected' ) ),
				h( AV.Row, { title: 'Clear all listening statistics', help: 'Deletes plays and listening time. Settings and audio files stay.' }, h( Button, { variant: 'secondary', isDestructive: true, onClick: () => ctx.modal( { title: 'Clear all listening statistics?', typed: 'CLEAR', body: h( 'p', null, 'Plays, listening time and listener details are deleted for good. Settings and audio files stay.' ), ok: 'Clear statistics', destructive: true, onOk: () => notify( 'Listening statistics cleared.' ) } ) }, 'Clear statistics…' ) ) ) ) ),
			h( AV.Section, { title: 'For support' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Row, { title: 'Debug log', help: 'Errors AtlasVoice wrote in the last 7 days · 12 KB. Never contains keys or passwords.' }, h( Button, { variant: 'secondary', icon: h( I, { icon: 'download', size: 20 } ), onClick: () => notify( 'tts-debug.log downloaded.' ) }, 'Download log' ) ),
				h( AV.Toggle, { label: 'Share anonymous usage data with AtlasAiDev', help: 'Plugin list, PHP and WordPress versions, weekly. No post content, no visitor data. You chose this when you installed.', checked: tel, onChange: ( v ) => { setTel( v ); notify( v ? 'Thank you. Usage data is shared weekly.' : 'Stopped. Nothing more is sent.' ); } } ) ) ) ) ) );
	};

	/* ================================================================= help */
	AV.S.plans = function Plans() {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ bill, setBill ] = useState( 'y' );
		const plans = [ [ '1 site', '$59', '$149' ], [ '5 sites', '$119', '$299' ], [ '10 sites', '$179', '$449' ] ];
		const feats = [ [ '374 studio voices', 'AtlasVoice Cloud is included: 43 languages, no keys to set up.' ], [ 'Every content type', 'Players on posts, pages, products and custom types, each with its own rules.' ], [ 'Audio for many posts at once', 'Prepare audio for hundreds of posts, in every language, after checking the text.' ], [ 'A voice per language', 'WPML, Polylang, TranslatePress and GTranslate read each post in its own language.' ], [ 'Skip parts of the page', 'Leave out share bars, captions and phrases like “Read more”.' ], [ 'Audio in search', 'Audio structured data that joins Yoast, Rank Math or AIOSEO.' ], [ 'Deeper insights', '90 days and all time, busiest hours, export and email reports.' ] ];
		return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 1000 },
			! free && h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: 'success', isDismissible: false, actions: [ { label: 'Licence & account', onClick: () => ctx.go( 'licence' ) } ] }, h( 'b', null, 'Pro is active on this site. ' ), '5-site plan, used on 3 of 5 sites, renews 3 March 2027.' ) ),
			h( AV.Section, { title: free ? 'What AtlasVoice Pro adds' : 'What your Pro licence includes', desc: 'Everything in the free plugin stays free and works on its own. Your own provider keys are free in both.' },
				h( 'div', { className: 'atlasvoice-grid is-2' }, feats.map( ( f ) => h( Card, { key: f[ 0 ], size: 'small' }, h( CardBody, null, h( 'b', null, f[ 0 ] ), h( 'p', { className: 'atlasvoice-weak' }, f[ 1 ] ) ) ) ) ) ),
			h( AV.Section, { title: free ? 'Plans' : 'Upgrade or add sites', desc: 'Example prices for the mockup. 14-day money-back guarantee.', end: h( AV.TG, { label: 'Billing', hide: true, value: bill, onChange: setBill, options: [ [ 'y', 'Yearly' ], [ 'l', 'Lifetime' ] ] } ) },
				h( 'div', { className: 'atlasvoice-grid is-3' }, plans.map( ( p, i ) => h( Card, { key: p[ 0 ], className: i === 1 ? 'atlasvoice-card-best' : '' }, h( CardBody, null, h( VStack, { spacing: 3 },
					i === 1 ? h( AV.Chip, { tone: 'brand' }, 'Most popular' ) : h( 'span', { style: { height: 20 } } ), h( 'b', null, p[ 0 ] ), h( 'span', { className: 'atlasvoice-price' }, bill === 'y' ? p[ 1 ] : p[ 2 ], h( 'span', { className: 'atlasvoice-weak', style: { fontSize: 13, fontWeight: 400 } }, bill === 'y' ? ' / year' : ' once' ) ),
					h( Button, { className: 'atlasvoice-btn-full', variant: i === 1 ? 'primary' : 'secondary', onClick: () => AV.ext( notify, 'checkout for the ' + p[ 0 ] + ' plan' ) }, free ? 'Choose ' + p[ 0 ] : 'Switch to ' + p[ 0 ] ) ) ) ) ) ) ),
			h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'secondary', onClick: () => AV.ext( notify, 'the demo page with every Pro voice' ) }, 'Hear the Pro voices' ), h( Button, { variant: 'link', onClick: () => AV.ext( notify, 'the refund policy' ) }, 'Refund policy' ), h( Button, { variant: 'link', onClick: () => AV.ext( notify, 'the full Free and Pro comparison' ) }, 'Compare Free and Pro' ) ) ) );
	};
	AV.S.licence = function Licence() {
		const ctx = useApp();
		const { notify } = ctx;
		const [ key, setKey ] = useState( '' );
		const [ opt2, setOpt2 ] = useState( true );
		const st = { active: [ 'success', 'Active until 3 March 2027', 'Pro 5-site plan · used on 3 of 5 sites · renews automatically.' ], expired: [ 'warning', 'Expired on 3 March 2026', 'Pro features keep working, but updates and the studio voices stop. Renew to get them back.' ], none: [ 'warning', 'No licence activated', 'Paste your licence key to turn on Pro features and updates.' ] }[ ctx.lic ];
		return h( AV.Pane, { canvas: true, top: h( AV.MockBar, { label: 'licence state', value: ctx.lic, onChange: ctx.setLic, options: [ [ 'active', 'Active' ], [ 'expired', 'Expired' ], [ 'none', 'Not activated' ] ] } ) }, h( AV.Scroll, { width: 860 },
			h( 'div', { className: 'atlasvoice-section' }, h( Notice, { status: st[ 0 ], isDismissible: false, actions: ctx.lic === 'active' ? [ { label: 'Manage sites', onClick: () => AV.ext( notify, 'your Freemius account' ) } ] : ctx.lic === 'expired' ? [ { label: 'Renew licence', variant: 'primary', onClick: () => AV.ext( notify, 'licence renewal' ) } ] : [] }, h( 'b', null, 'Licence: ' + st[ 1 ] + '. ' ), st[ 2 ] ) ),
			ctx.lic === 'none' && h( 'div', { className: 'atlasvoice-section' }, h( Card, null, h( CardBody, null, h( HStack, { alignment: 'bottom' }, h( 'div', { style: { flex: 1 } }, h( TextControl, { ...N, label: 'Licence key', className: 'atlasvoice-mono', value: key, onChange: setKey } ) ), h( Button, { variant: 'primary', __next40pxDefaultSize: true, disabled: key.length < 10, onClick: () => { ctx.setLic( 'active' ); notify( 'Licence activated on this site.' ); } }, 'Activate' ) ) ) ) ),
			h( AV.Section, { title: 'Account', desc: 'Managed by Freemius, our licensing partner.' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Row, { title: 'Account email', help: 'rahima@example.com' }, h( Button, { variant: 'link', onClick: () => notify( 'In the plugin this opens the Freemius account page in wp-admin.' ) }, 'Account details' ) ),
				h( AV.Row, { title: 'Invoices and payment method' }, h( Button, { variant: 'link', onClick: () => AV.ext( notify, 'billing on Freemius' ) }, 'Open billing' ) ),
				h( AV.Toggle, { label: 'Share usage data with AtlasAiDev', help: 'You chose this when you activated Pro.', checked: opt2, onChange: setOpt2 } ) ) ) ),
			h( AV.Section, { title: 'Get help or earn' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				h( AV.Row, { title: 'Contact us', help: 'Questions about your licence or billing.' }, h( Button, { variant: 'secondary', onClick: () => notify( 'In the plugin this opens the Freemius contact form.' ) }, 'Contact form' ) ),
				h( AV.Row, { title: 'Affiliate programme', help: 'Earn a share of every sale you refer.' }, h( Button, { variant: 'secondary', onClick: () => notify( 'In the plugin this opens the Freemius affiliation page.' ) }, 'Join' ) ),
				h( AV.Row, { title: 'Deactivate the licence on this site', help: 'Frees a seat for another site. Pro features stop here.' }, h( Button, { variant: 'secondary', isDestructive: true, onClick: () => ctx.modal( { title: 'Deactivate the licence here?', body: h( 'p', null, 'This site stops using Pro features and frees one of your 5 sites. Audio files stay.' ), ok: 'Deactivate', destructive: true, onOk: () => { ctx.setLic( 'none' ); notify( 'Licence deactivated on this site.' ); } } ) }, 'Deactivate licence' ) ) ) ) ) ) );
	};
	const DOCS = {
		start: [ 'Get started', [ [ 'p', 'AtlasVoice adds a Listen button or player to your posts. Visitors press play and hear the post read aloud.' ], [ 'h3', 'Three steps' ], [ 'ol', [ 'Choose a voice in Voice.', 'Choose where the player appears in What is read.', 'Press Go live in the status bar.' ] ] ] ],
		missing: [ 'The player does not show on my posts', [ [ 'p', 'Most often the site is still in staging: only logged-in admins see the player. Check the status bar at the bottom.' ], [ 'h3', 'Still missing?' ], [ 'p', 'Open Health. It loads a post as a visitor and tells you which plugin or setting is in the way.' ] ] ],
		phones: [ 'The voice sounds different on phones', [ [ 'p', 'The browser voice uses each device’s own voices. Switch to the natural voice to sound the same everywhere.' ] ] ],
		skip: [ 'How do I skip the share buttons?', [ [ 'p', 'In What is read → Page areas, open the rule and pick the article text on the page. Pro can also skip share bars, captions and phrases.' ] ] ],
		own: [ 'Can I upload my own recording?', [ [ 'p', 'Yes. In the post editor, the AtlasVoice audio panel has Replace on each language row. It accepts any MP3.' ] ] ],
		dev: [ 'For developers', [ [ 'h3', 'Change what is read' ], [ 'p', 'tts_clean_content, tts_text_aliases, tts_pronunciation_text' ], [ 'h3', 'Show or hide the player' ], [ 'p', 'tta_should_load_button, tts_is_secondary_loop for post cards and widgets' ], [ 'h3', 'Pro player options' ], [ 'p', 'ttsProPlayerDesign, ttsProPlayerOptions, ttsProLink and tts_pro_player_customizations keep working with the new player.' ], [ 'h3', 'Scripts blocked by your server' ], [ 'p', 'Copy-paste fixes for Apache (.htaccess), nginx and Cloudflare, with a curl check.' ] ] ],
	};
	AV.S.docs = function Docs() {
		const ctx = useApp();
		const [ cur, setCur ] = useState( 'start' );
		const [ q, setQ ] = useState( '' );
		const keys = Object.keys( DOCS ).filter( ( k ) => ! q || JSON.stringify( DOCS[ k ] ).toLowerCase().includes( q.toLowerCase() ) );
		const doc = DOCS[ keys.includes( cur ) ? cur : keys[ 0 ] || 'start' ];
		return h( 'div', { className: 'atlasvoice-split' },
			h( 'div', { className: 'atlasvoice-split-side' }, h( 'div', { style: { padding: 12 } }, h( SearchControl, { ...NM, size: 'compact', value: q, onChange: setQ, placeholder: 'Search the help' } ) ),
				keys.map( ( k ) => h( 'button', { key: k, className: 'atlasvoice-side-row' + ( doc === DOCS[ k ] ? ' is-current' : '' ), onClick: () => setCur( k ) }, h( 'span', { className: 'atlasvoice-side-text' }, h( 'b', null, DOCS[ k ][ 0 ] ) ) ) ),
				h( 'div', { className: 'atlasvoice-side-group' }, 'Still stuck?' ),
				h( 'div', { style: { padding: '0 16px 16px' } }, h( 'p', { className: 'atlasvoice-weak', style: { marginBottom: 8 } }, 'We usually answer within one working day. Attach your health report and debug log; they contain no passwords or keys.' ), h( Button, { variant: 'primary', icon: h( I, { icon: 'external' } ), onClick: () => AV.ext( ctx.notify, 'the contact form on atlasaidev.com' ) }, 'Contact support' ) ) ),
			h( AV.Pane, null, h( AV.Scroll, null, h( 'article', { className: 'atlasvoice-article' }, h( 'h2', null, doc[ 0 ] ),
				doc[ 1 ].map( ( [ t, c ], i ) => t === 'ol' ? h( 'ol', { key: i }, c.map( ( x ) => h( 'li', { key: x }, x ) ) ) : h( t, { key: i }, c ) ),
				h( 'h3', null, 'Videos' ), h( ItemGroup, { isBordered: true, isSeparated: true }, [ [ 'Set up AtlasVoice in 3 minutes', '3:12' ], [ 'Choose what is read', '2:40' ] ].map( ( [ t, d ] ) => h( Item, { key: t, onClick: () => AV.ext( ctx.notify, 'the video on YouTube' ) }, h( HStack, null, h( 'span', null, t ), h( 'span', { className: 'atlasvoice-weak' }, d ) ) ) ) ) ) ) ) );
	};
	AV.S.more = function More() {
		const ctx = useApp();
		const [ inst, setInst ] = useState( {} );
		return h( AV.Pane, { canvas: true }, h( AV.Scroll, { width: 860 },
			h( AV.Section, { title: 'Other AtlasAiDev plugins', desc: 'Free on WordPress.org. The list is fetched when you open this screen.' }, h( Card, null, h( ItemGroup, { isSeparated: true },
				[ [ 'atlasar', 'AtlasAR', '3D models and AR try-on for WooCommerce' ], [ 'atlasmcp', 'AtlasMCP', 'Connect Claude, ChatGPT and Gemini to WordPress' ], [ 'slai', 'Smart Local AI', 'Private AI tools that run in the browser' ] ].map( ( [ id, n, d ] ) => h( AV.Row, { key: id, title: n, help: d }, inst[ id ] === 'done' ? h( AV.Chip, { tone: 'ok', dot: true }, 'Installed' ) : h( Button, { variant: 'secondary', isBusy: inst[ id ] === 'busy', onClick: () => { setInst( { ...inst, [ id ]: 'busy' } ); setTimeout( () => { setInst( ( s ) => ( { ...s, [ id ]: 'done' } ) ); ctx.notify( n + ' installed. Activate it in Plugins.' ); }, 1200 ); } }, 'Install' ) ) ) ) ) ) ) );
	};
}( window.AVM ) );
