/*
 * AtlasVoice redesign mockup, part 3: the views outside the AtlasVoice app.
 * Post editor (block and Classic Editor), the front end (every player state
 * plus the content picker), and WordPress screens (notices, toolbar, Plugins
 * rows, deactivation, dashboard widget, Network Admin).
 */
( function ( AV ) {
	const { h, Fragment, useState, useEffect, C, I, useApp } = AV;
	const { Button, Notice, ToggleControl, PanelBody, SelectControl, TextControl } = C;
	const { HStack, VStack, NM, N } = AV;

	/* ----------------------------------------------------------- editor */
	/* "AtlasVoice → Audio": one row per language, read from the same Audio Jobs
	   the Audio library shows (TTS-354). */
	const LANG_NAME = { EN: 'English (UK)', ES: 'Español' };
	function AudioPanel( { st } ) {
		const ctx = useApp();
		const { free, notify, engine } = ctx;
		const [ kept, setKept ] = useState( false );
		const [ when, setWhen ] = useState( 'site' );
		if ( engine === 'browser' || st === 'browser' ) return h( VStack, { spacing: 2 }, h( 'p', null, 'The browser voice reads this post live in the visitor’s browser, so there are no MP3 files to manage.' ), h( Button, { variant: 'link', onClick: () => { ctx.setView( 'app' ); ctx.go( 'voice' ); } }, 'Switch to the natural voice' ) );
		if ( st === 'draft' ) return h( 'p', null, 'Drafts never make audio. Audio is made from the published page, ' + { play: 'the first time someone plays it.', publish: 'right after you publish.', manual: 'when you click Make audio.' }[ ctx.audio.when ] );
		const post = ctx.posts.find( ( p ) => p.id === 120 );
		const langs = post.langs.filter( ( l, i ) => ! free || i === 0 );
		const en = langs[ 0 ];
		const voice = AV.voiceName( ctx.voice );
		const meta = ( l ) => {
			if ( l.st === 'Ready' ) return l.dur + ' · made ' + l.made + ' with ' + AV.ENGINES[ engine ] + ' · up to date';
			if ( l.st === 'Outdated' ) return l.dur + ' · made ' + l.made + ' · the text changed since';
			if ( l.st === 'Making' ) return ( l.reason || 'Started just now' ) + '. Runs on the server; nobody has to keep the page open.';
			if ( l.st === 'Failed' ) return l.reason;
			return 'Made ' + { play: 'the first time someone plays it', publish: 'when you publish or update', manual: 'only when you click Make audio' }[ ctx.audio.when ] + '.';
		};
		return h( VStack, { spacing: 3 },
			h( HStack, null, h( 'b', null, langs.filter( ( l ) => l.st === 'Ready' ).length + ' of ' + langs.length + ( langs.length === 1 ? ' language ready' : ' languages ready' ) ), h( AV.Chip, null, AV.ENGINES[ engine ] ) ),
			en.st === 'Outdated' && ! kept && h( Notice, { status: 'warning', isDismissible: false, actions: [ { label: 'Remake English · ~' + post.chars.toLocaleString( 'en' ) + ' characters', variant: 'primary', onClick: () => { ctx.makeAudio( [ 120 ], { only: 'EN' } ); notify( 'Remaking the English audio on the server. Visitors hear the old version until it is ready.' ); } }, { label: 'Keep', onClick: () => { setKept( true ); notify( 'Kept. Only editors see that it is outdated.' ); } } ] }, h( 'b', null, 'The text changed since the English audio was made. ' ), 'Visitors still hear the old version.' ),
			st === 'provider' && h( Notice, { status: 'warning', isDismissible: false, actions: [ { label: 'Connect it', onClick: () => { ctx.setView( 'app' ); ctx.go( 'providers' ); } } ] }, 'Google Cloud is not connected, so new audio cannot be made. Existing files still play.' ),
			langs.map( ( l ) => h( 'div', { key: l.l, className: 'atlasvoice-audio-row' },
				h( HStack, { alignment: 'top' }, h( 'span', { className: 'atlasvoice-lang' }, l.l ), h( VStack, { spacing: 0, style: { flex: 1, minWidth: 0 } }, h( 'b', null, ( LANG_NAME[ l.l ] || l.l ) + ' · ' + ( l.l === 'ES' ? 'Lucía' : voice ) ), h( 'span', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, meta( l ) ) ), h( AV.JobChip, { l } ) ),
				l.st === 'Making' && h( 'span', { className: 'atlasvoice-meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': l.total, 'aria-valuenow': l.part, 'aria-label': 'Part ' + l.part + ' of ' + l.total }, h( 'i', { style: { width: ( 100 * l.part / l.total ) + '%' } } ) ),
				( l.st === 'Ready' || l.st === 'Outdated' ) && h( HStack, { justify: 'flex-start' }, h( Button, { size: 'small', variant: 'secondary', onClick: () => notify( 'Playing the ' + ( LANG_NAME[ l.l ] || l.l ) + ' audio.' ) }, 'Play' ), h( 'span', { className: 'atlasvoice-mono atlasvoice-weak' }, l.dur ) ),
				h( HStack, { justify: 'flex-start', wrap: true },
					l.st === 'Failed' && h( Button, { size: 'small', variant: 'primary', onClick: () => { ctx.makeAudio( [ 120 ], { only: l.l } ); notify( 'Trying again. Finished parts are kept; only the rest is made.' ); } }, 'Try again (keeps finished parts)' ),
					l.st === 'Failed' && engine === 'own' && h( Button, { size: 'small', variant: 'link', onClick: () => AV.ext( notify, 'the provider’s billing page' ) }, 'Open billing' ),
					( l.st === 'Missing' ) && h( Button, { size: 'small', variant: 'secondary', onClick: () => { ctx.makeAudio( [ 120 ], { only: l.l } ); notify( 'Audio job started on the server.' ); } }, 'Make audio now' ),
					( l.st === 'Ready' ) && h( Button, { size: 'small', variant: 'tertiary', onClick: () => { ctx.makeAudio( [ 120 ], { only: l.l, force: true } ); notify( 'Remaking on the server. Visitors keep hearing the current file until the new one is ready.' ); } }, 'Remake' ),
					l.st !== 'Making' && h( C.FormFileUpload, { accept: 'audio/mpeg', onChange: () => { ctx.setPosts( ( ps ) => ps.map( ( p ) => ( p.id !== 120 ? p : { ...p, langs: p.langs.map( ( x ) => ( x.l === l.l ? { ...x, st: 'Ready', made: 'just now', dur: x.dur || '4:05', src: 'Your recording' } : x ) ) } ) ) ); notify( ( LANG_NAME[ l.l ] || l.l ) + ' audio replaced with your MP3.' ); }, render: ( { openFileDialog } ) => h( Button, { size: 'small', variant: 'tertiary', icon: h( I, { icon: 'upload', size: 18 } ), onClick: openFileDialog }, l.st === 'Missing' ? 'Upload' : 'Replace' ) } ),
					( l.st === 'Ready' || l.st === 'Outdated' ) && h( Button, { size: 'small', variant: 'tertiary', isDestructive: true, onClick: () => ctx.modal( { title: 'Delete the ' + ( LANG_NAME[ l.l ] || l.l ) + ' audio?', body: h( 'p', null, 'A new file is made the next time it is needed.' ), ok: 'Delete', destructive: true, onOk: () => { ctx.setPosts( ( ps ) => ps.map( ( p ) => ( p.id !== 120 ? p : { ...p, langs: p.langs.map( ( x ) => ( x.l === l.l ? { ...x, st: 'Missing', made: '', dur: '' } : x ) ) } ) ) ); notify( 'Deleted.' ); } } ) }, 'Delete' ) ) ) ),
			h( C.RadioControl, { label: 'When this post is published or updated', selected: when, onChange: ( v ) => { setWhen( v ); if ( v === 'now' ) { ctx.makeAudio( [ 120 ] ); notify( 'Making the audio now, in the background.' ); } else notify( v === 'never' ? 'This post will never make audio. Visitors get the device voice.' : 'This post follows the site setting.' ); }, options: [ { label: 'Make audio now, in the background', value: 'now' }, { label: 'Use the site setting (' + { play: 'on the first play', publish: 'when published', manual: 'when an editor clicks' }[ ctx.audio.when ] + ')', value: 'site' }, { label: 'Never for this post', value: 'never' } ] } ),
			h( PanelBody, { title: 'Other stored audio (1)', initialOpen: false }, h( HStack, null, h( 'span', { className: 'atlasvoice-lang' }, 'FR' ), h( 'span', { className: 'atlasvoice-weak', style: { flex: 1 } }, 'Not used by the current voice or language settings' ), h( Button, { size: 'small', variant: 'tertiary', isDestructive: true, onClick: () => notify( 'Unused French file deleted.' ) }, 'Delete' ) ) ),
			h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'link', onClick: () => ctx.openPicker() }, 'Review the text that is read' ), ! free && h( Button, { variant: 'link', onClick: () => { ctx.setView( 'app' ); ctx.go( 'library' ); } }, 'Open in the Audio library' ) ),
			h( 'p', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, 'Anyone who can edit this post can remake, replace or delete its audio.' + ( free ? ' Audio per language and making many posts at once come with AtlasVoice Pro.' : '' ) ) );
	}
	function PostPanels() {
		const ctx = useApp();
		const [ show, setShow ] = useState( true );
		return h( Fragment, null,
			h( PanelBody, { title: 'On this post', initialOpen: true }, h( VStack, { spacing: 3 },
				h( ToggleControl, { ...NM, label: 'Show the player on this post', checked: show, onChange: ( v ) => { setShow( v ); ctx.notify( v ? 'The player shows on this post again.' : 'Hidden on this post. Saved with the post.' ); } } ),
				h( Button, { variant: 'link', onClick: () => ctx.openPicker() }, 'Check what is read' ),
				! ctx.free && h( 'span', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, 'This post uses the “Posts” rule. ', h( Button, { variant: 'link', onClick: () => ctx.openPicker() }, 'Give it its own rule' ) ) ) ),
			h( PanelBody, { title: 'Listening, last 30 days', initialOpen: true }, h( HStack, { justify: 'flex-start', spacing: 6 }, h( VStack, { spacing: 0 }, h( 'b', { style: { fontSize: 20 } }, '412' ), h( 'span', { className: 'atlasvoice-weak' }, 'plays' ) ), h( VStack, { spacing: 0 }, h( 'b', { style: { fontSize: 20 } }, '52%' ), h( 'span', { className: 'atlasvoice-weak' }, 'finished' ) ) ) ),
			h( PanelBody, { title: 'Shortcode', initialOpen: false }, h( HStack, { alignment: 'bottom' }, h( 'div', { style: { flex: 1 } }, h( TextControl, { ...N, label: 'Shortcode', hideLabelFromVision: true, value: '[atlasvoice]', readOnly: true, onChange: () => {} } ) ), h( Button, { variant: 'secondary', __next40pxDefaultSize: true, onClick: () => AV.copyText( ctx.notify, '[atlasvoice]', 'Shortcode' ) }, 'Copy' ) ) ) );
	}
	AV.V.editor = function Editor() {
		const ctx = useApp();
		const [ type, setType ] = useState( 'block' );
		const [ st, setSt ] = useState( 'outdated' );
		const article = h( 'article', null, h( 'h1', null, 'How we restored the old mill' ), h( 'p', null, 'The wheel had not turned since 1962. When we opened the doors, the smell of flour and damp oak was still there, as if the millers had only stepped out for lunch.' ), h( 'p', null, 'We started with the roof. Forty-one slates were cracked, and the beam above the stones had a split you could fit a hand into.' ) );
		const bar = h( AV.MockBar, { label: 'editor and panel state', value: type + ':' + st, onChange: ( v ) => { const [ a, b ] = v.split( ':' ); setType( a ); setSt( b ); }, options: [ [ 'block:' + st, 'Block editor' ], [ 'classic:' + st, 'Classic Editor' ] ].concat( [ [ 'outdated', 'Outdated' ], [ 'ready', 'Ready' ], [ 'making', 'Making' ], [ 'failed', 'Failed' ], [ 'missing', 'Missing' ], [ 'draft', 'Draft' ], [ 'provider', 'Provider not connected' ], [ 'browser', 'Browser voice' ] ].map( ( [ k, l ] ) => [ type + ':' + k, l ] ) ) } );
		useEffect( () => {
			const map = { outdated: { st: 'Outdated', dur: '4:05', made: '21 Oct' }, ready: { st: 'Ready', dur: '4:05', made: '27 Oct' }, making: { st: 'Making', part: 6, total: 14, reason: 'Started by a visitor 2 min ago' }, failed: { st: 'Failed', part: 3, total: 6, reason: 'The voice provider has no credit left. Parts 1–3 are kept; only the rest will be made.' }, missing: { st: 'Missing', dur: '', made: '' } }[ st ];
			if ( map ) ctx.setPosts( ( ps ) => ps.map( ( p ) => ( p.id !== 120 ? p : { ...p, langs: p.langs.map( ( l, i ) => ( i ? l : { ...l, ...map } ) ) } ) ) );
		}, [ st ] );
		if ( type === 'classic' ) {
			return h( 'div', { className: 'atlasvoice-view' }, bar, h( 'div', { className: 'atlasvoice-classic' }, h( 'h1', null, 'Edit Post' ),
				h( 'div', { className: 'atlasvoice-classic-grid' },
					h( 'div', null, h( 'div', { className: 'atlasvoice-postbox' }, h( 'div', { style: { padding: 20, fontFamily: 'Georgia, serif', fontSize: 16, lineHeight: 1.7 } }, article ) ),
						h( 'div', { className: 'atlasvoice-postbox' }, h( 'h2', null, 'AtlasVoice' ), h( 'div', { style: { padding: 0 } }, h( PostPanels ) ) ) ),
					h( 'div', null, h( 'div', { className: 'atlasvoice-postbox' }, h( 'h2', null, 'Publish' ), h( 'div', null, h( Button, { variant: 'primary', onClick: () => ctx.notify( 'Post updated.' ) }, 'Update' ) ) ),
						h( 'div', { className: 'atlasvoice-postbox' }, h( 'h2', null, 'AtlasVoice · Audio' ), h( 'div', null, h( AudioPanel, { st, key: st } ) ) ) ) ) ) );
		}
		return h( 'div', { className: 'atlasvoice-editor', style: { gridTemplateRows: 'auto 60px minmax(0,1fr)' } }, bar,
			h( 'div', { className: 'atlasvoice-editor-top' }, h( 'span', { className: 'atlasvoice-logo', style: { background: '#1e1e1e' } }, h( 'b', { style: { color: '#fff' } }, 'W' ) ), h( 'div', { className: 'atlasvoice-doc' }, h( 'span', null, 'How we restored the old mill · Post' ) ), h( Button, { variant: 'primary', onClick: () => ctx.notify( 'Post updated.' ) }, 'Save' ), h( Button, { icon: h( I, { icon: 'drawer-right' } ), label: 'Settings', isPressed: true } ) ),
			h( 'div', { className: 'atlasvoice-editor-body' },
				h( 'div', { className: 'atlasvoice-editor-canvas' }, article ),
				h( 'aside', { className: 'atlasvoice-editor-side', 'aria-label': 'Post settings' },
					h( C.TabPanel, { tabs: [ { name: 'post', title: 'Post' }, { name: 'block', title: 'Block' }, { name: 'av', title: 'AtlasVoice' } ], initialTabName: 'av', onSelect: () => {} }, ( t ) => t.name === 'av'
						? h( C.Panel, null, h( PanelBody, { title: 'Audio', initialOpen: true }, h( AudioPanel, { st, key: st } ) ), h( PostPanels ) )
						: h( 'p', { className: 'atlasvoice-weak', style: { padding: 16 } }, 'WordPress’s own ' + t.title + ' settings.' ) ) ) ) );
	};

	/* --------------------------------------------------------- front end */
	function Picker( { onClose } ) {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ scope, setScope ] = useState( 'type' );
		const [ sel, setSel ] = useState( 'article .entry-content' );
		const [ n, setN ] = useState( 5 );
		const [ chk, setChk ] = useState( 'idle' );
		return h( 'aside', { className: 'atlasvoice-picker', 'aria-label': 'Pick what is read' },
			h( 'div', { className: 'atlasvoice-drawer-head' }, h( 'div', { style: { flex: 1 } }, h( 'div', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, 'Only you can see this panel' ), h( 'h2', null, 'What is read' ) ), h( Button, { icon: h( I, { icon: 'close' } ), label: 'Close the picker', onClick: onClose } ) ),
			h( 'div', { className: 'atlasvoice-drawer-body' },
				h( AV.DS, { title: '1. Applies to' }, free ? h( 'p', { className: 'atlasvoice-weak' }, 'The whole site.' ) : h( AV.TG, { label: 'Applies to', hide: true, value: scope, onChange: setScope, options: [ [ 'post', 'This post' ], [ 'type', 'All posts' ], [ 'site', 'Whole site' ] ] } ) ),
				h( AV.DS, { title: '2. Read this part' }, h( VStack, { spacing: 3 }, h( HStack, { justify: 'flex-start', wrap: true }, h( Button, { variant: 'primary', size: 'compact', onClick: () => { setSel( 'article .entry-content' ); notify( 'Click the article text on the page. Picked: article .entry-content' ); } }, 'Click to pick' ), h( Button, { variant: 'secondary', size: 'compact', onClick: () => notify( 'Drag over the text you want read.' ) }, 'Drag over text' ) ),
					h( TextControl, { ...N, label: 'CSS selector', className: 'atlasvoice-mono', value: sel, onChange: setSel } ) ) ),
				h( AV.DS, { title: '3. Skip parts of it' }, free ? h( AV.ProNote, null, 'Skip share bars, captions and phrases.' ) : h( 'div', { className: 'atlasvoice-chips' }, h( AV.Chip, null, '.share-bar' ), h( AV.Chip, null, 'figure' ), h( Button, { variant: 'link', onClick: () => notify( 'Click a part of the page to skip it.' ) }, 'Add' ) ) ),
				h( AV.DS, { title: '4. Check other posts' }, h( VStack, { spacing: 3 }, h( HStack, { alignment: 'bottom' }, h( 'div', { style: { width: 90 } }, AV.NumberControl ? h( AV.NumberControl, { __next40pxDefaultSize: true, label: 'How many', min: 1, max: 20, value: n, onChange: ( v ) => setN( Math.min( 20, Math.max( 1, +v || 1 ) ) ) } ) : null ), h( Button, { variant: 'secondary', __next40pxDefaultSize: true, isBusy: chk === 'busy', onClick: () => { setChk( 'busy' ); setTimeout( () => setChk( 'done' ), 1000 ); } }, 'Check' ) ),
					chk === 'done' && h( Notice, { status: 'success', isDismissible: false }, 'Found on ' + n + ' of ' + n + ' posts · about 640 words each.' ) ) ) ),
			h( 'div', { className: 'atlasvoice-footer' }, h( Button, { variant: 'tertiary', className: 'atlasvoice-footer-note', onClick: () => notify( 'Showing the text that will be read.' ) }, 'Show the text' ), h( Button, { variant: 'primary', onClick: () => { onClose(); notify( 'Saved for ' + ( free ? 'the whole site' : { post: 'this post', type: 'all posts', site: 'the whole site' }[ scope ] ) + '.' ); } }, 'Save' ) ) );
	}
	AV.V.front = function Front() {
		const ctx = useApp();
		const { look, free, notify } = ctx;
		const [ dark, setDark ] = useState( false );
		const [ live, setLive ] = useState( { form: ctx.engine === 'browser' ? 'button' : 'bar', state: 'idle' } );
		const R = ( label, el ) => h( 'div', { className: 'atlasvoice-staterow' }, h( 'span', null, label ), h( 'div', { style: { minWidth: 0 } }, el ) );
		const P = ( p ) => h( AV.Player, { look, ai: null, voice: 'Emma · Natural voice', onAct: ( a ) => notify( a === 'remake' ? 'Remake started: one job on the server, about 6,200 characters.' : 'This row shows one state of the player. The player at the top of the article really plays.' ), ...p } );
		return h( 'div', { className: 'atlasvoice-view' }, h( 'div', { className: 'atlasvoice-front' + ( dark ? ' is-dark' : '' ) },
			h( 'div', { className: 'atlasvoice-front-head' }, h( 'span', null, 'The Reading Site' ), h( 'span', { className: 'atlasvoice-sp' } ),
				h( AV.TG, { label: 'Theme', hide: true, value: dark ? 'd' : 'l', onChange: ( v ) => setDark( v === 'd' ), options: [ [ 'l', 'Light theme' ], [ 'd', 'Dark theme' ] ] } ),
				! ctx.picker && h( Button, { variant: 'secondary', onClick: () => ctx.openPicker() }, 'Open the content picker' ),
				h( Button, { variant: 'tertiary', onClick: () => ctx.setView( 'app' ) }, 'Back to AtlasVoice' ) ),
			h( 'div', { className: 'atlasvoice-front-body' },
				ctx.picker && h( Picker, { onClose: () => ctx.setPicker( false ) } ),
				h( 'div', { className: 'atlasvoice-front-article' + ( ctx.picker ? ' atlasvoice-read' : '' ) },
					h( 'span', { className: 'atlasvoice-site-meta' }, 'Stories · 18 October 2026 · 6 min read' ), h( 'h1', null, 'How we restored the old mill' ),
					h( AV.Player, { form: live.form, state: live.state, look, ai: ctx.ai, staging: ctx.mode === 'staging', voice: AV.voiceName( ctx.voice ) + ' · ' + AV.ENGINES[ ctx.engine ], credit: free && ctx.engine === 'atlas', onAct: ( a ) => ( a === 'play' || a === 'pause' ) ? setLive( { ...live, state: a === 'pause' ? 'paused' : 'playing' } ) : notify( { speed: 'Speed menu: 0.5× to 2×.', download: 'Downloading how-we-restored-the-old-mill.mp3.', lang: 'Switching the audio language.', retry: 'Trying again.' }[ a ] ) } ),
					h( 'div', { className: ctx.picker ? 'atlasvoice-picked' : '', style: { marginTop: 20 } }, h( 'p', null, 'The wheel had not turned since 1962. When we opened the doors, the smell of flour and damp oak was still there, as if the millers had only stepped out for lunch.' ), h( 'p', null, 'We started with the roof. Forty-one slates were cracked, and the beam above the stones had a split you could fit a hand into.' ) ),
					h( 'p', { className: ctx.picker && ! free ? 'atlasvoice-skipped' : '', style: { fontFamily: 'system-ui', fontSize: 13, marginTop: 14 } }, 'Share this · Facebook · Email' ),
					h( 'h2', null, 'Browser voice' ),
					R( 'Ready', P( { form: 'button', state: 'idle' } ) ), R( 'Playing', P( { form: 'button', state: 'playing' } ) ), R( 'Phone blocked the voice', P( { form: 'button', state: 'blocked' } ) ),
					R( 'Browser can’t speak', h( 'div', { className: 'atlasvoice-player-note' }, h( I, { icon: 'info' } ), 'This browser can’t read aloud. Try Chrome, Edge or Safari.' ) ),
					! free && R( 'Pro player with progress bar', P( { form: 'bar', state: 'playing', voice: 'Browser voice', download: false } ) ),
					R( 'Listener settings (gear)', h( AV.PlayerPop ) ),
					h( 'h2', null, 'Natural voice (MP3)' ),
					R( 'Ready (file already in the page)', P( { state: 'idle' } ) ), R( 'Making audio', P( { state: 'generating' } ) ), R( 'First press on a new post: part n of m, first part playing', P( { state: 'progressive' } ) ), R( 'Someone else pressed play first: joins the same job, pays nothing', P( { state: 'joined' } ) ), R( 'Playing', P( { state: 'playing' } ) ),
					R( 'Could not be made right now: device-voice fallback', P( { state: 'fallback' } ) ), R( 'Daily limit reached', P( { state: 'limit' } ) ), R( 'Outdated audio on the live page (editors only)', P( { state: 'outdated' } ) ),
					R( 'Characters used up', h( VStack, { spacing: 2 }, P( { state: 'quota' } ), h( 'span', { className: 'atlasvoice-site-meta' }, 'Visitors see only the browser voice button, with no message.' ) ) ),
					R( 'Admin, in staging', P( { state: 'idle', staging: true } ) ), R( 'With AI notice', P( { state: 'playing', ai: { on: true, text: AV.AI_TXT, pos: 'after' } } ) ),
					free && R( 'Free service credit', P( { state: 'idle', credit: true } ) ),
					! free && R( 'AtlasVoice Cloud', P( { state: 'playing', voice: 'Sarah · AtlasVoice Cloud', lang: true } ) ),
					h( 'h2', null, 'While scrolling' ),
					R( 'Space kept in the article', h( 'div', { className: 'atlasvoice-player-slot' }, 'The player is docked below. This space stays, so the text doesn’t jump.' ) ),
					h( 'h2', null, 'Read-along and selection' ),
					h( 'p', { className: 'atlasvoice-read' }, h( 'span', { className: 'is-dim' }, 'The wheel had not turned since 1962. ' ), h( 'span', { className: 'is-sentence' }, 'When we opened the doors, the smell of ', h( 'span', { className: 'is-word' }, 'flour' ), ' and damp oak was still there,' ), h( 'span', { className: 'is-dim' }, ' as if the millers had only stepped out for lunch.' ) ),
					h( 'p', { className: 'atlasvoice-read', style: { marginTop: 14 } }, 'We started with the roof. ', h( 'span', { className: 'is-selected' }, 'Forty-one slates were cracked' ), ' ', h( Button, { variant: 'primary', size: 'small', onClick: () => notify( 'Reading the selected text.' ) }, 'Listen' ), ' and the beam above the stones had a split.' ),
					R( 'Selection tip', h( 'div', { className: 'atlasvoice-player-note' }, h( I, { icon: 'info' } ), 'Tip: select any text in the article to listen to just that part.' ) ),
					h( 'div', { className: 'atlasvoice-dock-fixed' }, h( AV.Player, { form: 'dock', look, onAct: () => notify( 'Back to the player in the article.' ) } ) ) ) ) ) );
	};

	/* --------------------------------------------------- WordPress screens */
	function DeactivateModal( { pro, onClose } ) {
		const ctx = useApp();
		const [ step, setStep ] = useState( 1 );
		const [ why, setWhy ] = useState( '' );
		const [ more, setMore ] = useState( '' );
		if ( pro ) {
			return h( C.Modal, { title: 'Deactivate AtlasVoice Pro?', onRequestClose: onClose, size: 'medium' }, h( VStack, { spacing: 4 },
				h( 'p', null, 'The player was played 4,920 times this month on 182 posts.' ),
				h( 'ul', { className: 'atlasvoice-list' }, h( 'li', null, 'Posts using Pro voices fall back to the browser voice. MP3 files stay on your site.' ), h( 'li', null, 'Your licence seat is freed for another site.' ) ),
				h( 'div', { className: 'atlasvoice-modal-foot' }, h( Button, { variant: 'tertiary', onClick: onClose }, 'Cancel' ), h( Button, { variant: 'primary', isDestructive: true, onClick: () => { onClose(); ctx.notify( 'AtlasVoice Pro deactivated.' ); } }, 'Deactivate Pro' ) ) ) );
		}
		return h( C.Modal, { title: step === 1 ? 'Can we help first?' : 'Before you go, why are you leaving?', onRequestClose: onClose, size: 'medium' }, step === 1
			? h( VStack, { spacing: 4 }, h( 'p', { className: 'atlasvoice-weak' }, 'Most problems take two minutes to fix.' ),
				h( C.Card, null, h( AV.ItemGroup, { isSeparated: true },
					h( AV.Row, { title: 'It broke after an update' }, h( Button, { variant: 'link', onClick: () => { onClose(); ctx.setView( 'app' ); ctx.go( 'versions' ); } }, 'Roll back' ) ),
					h( AV.Row, { title: 'The player doesn’t show' }, h( Button, { variant: 'link', onClick: () => { onClose(); ctx.setView( 'app' ); ctx.go( 'health' ); } }, 'Run the health check' ) ),
					h( AV.Row, { title: 'The voice sounds robotic' }, h( Button, { variant: 'link', onClick: () => { onClose(); ctx.setView( 'app' ); ctx.go( 'voice' ); } }, 'Try the natural voice' ) ) ) ),
				h( 'div', { className: 'atlasvoice-modal-foot' }, h( Button, { variant: 'tertiary', onClick: onClose }, 'Cancel' ), h( Button, { variant: 'secondary', onClick: () => setStep( 2 ) }, 'No thanks, deactivate' ) ) )
			: h( VStack, { spacing: 4 }, h( C.RadioControl, { label: 'Reason (optional)', selected: why, onChange: setWhy, options: [ 'Voice sounds robotic', 'My language is missing', 'Doesn’t work on phones', 'Couldn’t find how to start', 'Player in the wrong place', 'Something else' ].map( ( x ) => ( { label: x, value: x } ) ) } ),
				why && h( C.TextareaControl, { ...NM, label: 'Tell us more, or ask for help (optional)', help: 'If you add your email, support replies within one working day.', value: more, onChange: setMore } ),
				h( 'div', { className: 'atlasvoice-modal-foot' }, h( Button, { variant: 'tertiary', onClick: () => { onClose(); ctx.notify( 'AtlasVoice deactivated.' ); } }, 'Skip and deactivate' ), h( Button, { variant: 'primary', onClick: () => { onClose(); ctx.notify( 'Thank you. AtlasVoice deactivated.' ); } }, 'Send and deactivate' ) ) ) );
	}
	/* Posts list: the Audio column and filter read the same jobs as the Audio library. */
	function PostsList() {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ bulk, setBulk ] = useState( '' );
		const [ filter, setFilter ] = useState( 'any' );
		const [ applied, setApplied ] = useState( 'any' );
		const [ picked, setPicked ] = useState( [] );
		const vis = ( p ) => p.langs.filter( ( l, i ) => ! free || i === 0 );
		const rows = ctx.posts.filter( ( p ) => applied === 'any' || vis( p ).some( ( l ) => l.st === applied ) );
		const lead = ( p ) => vis( p ).find( ( l ) => l.st !== 'Ready' ) || vis( p )[ 0 ];
		const note = ( l ) => {
			if ( l.st === 'Outdated' ) return 'Text changed after ' + l.made;
			if ( l.st === 'Failed' ) return 'No provider credit · Try again';
			if ( l.st === 'Missing' ) return { play: 'Made on the first play', publish: 'Made when published', manual: 'Made when an editor clicks' }[ ctx.audio.when ];
			if ( l.st === 'Making' ) return 'Part ' + l.part + ' of ' + l.total;
			return l.dur;
		};
		return h( Fragment, null,
			h( 'h2', null, 'Posts list: Audio column' ),
			h( 'p', null, 'The column and the filter read the jobs table, so they always agree with the Audio library and the editor.' + ( free ? ' Free makes audio one post at a time from the row action.' : '' ) ),
			h( HStack, { justify: 'flex-start', wrap: true, style: { marginBottom: 8 } },
				! free && h( 'div', { style: { width: 280 } }, h( C.SelectControl, { __nextHasNoMarginBottom: true, label: 'Bulk actions', hideLabelFromVision: true, value: bulk, onChange: setBulk, options: [ { label: 'Bulk actions', value: '' }, { label: 'AtlasVoice: make missing audio', value: 'missing' }, { label: 'AtlasVoice: remake outdated audio', value: 'outdated' } ] } ) ),
				! free && h( Button, { variant: 'secondary', disabled: ! bulk || ! picked.length, onClick: () => { ctx.setQueue( picked ); ctx.go( 'library' ); } }, 'Apply' ),
				h( 'div', { style: { width: 180 } }, h( C.SelectControl, { __nextHasNoMarginBottom: true, label: 'Audio filter', hideLabelFromVision: true, value: filter, onChange: setFilter, options: [ [ 'any', 'Audio: any' ], [ 'Missing', 'Missing' ], [ 'Outdated', 'Outdated' ], [ 'Failed', 'Failed' ], [ 'Making', 'Making' ], [ 'Ready', 'Ready' ] ].map( ( [ value, label ] ) => ( { value, label } ) ) } ) ),
				h( Button, { variant: 'secondary', onClick: () => setApplied( filter ) }, 'Filter' ) ),
			h( 'div', { className: 'atlasvoice-scroll-x' }, h( 'table', { className: 'atlasvoice-wptable' },
				h( 'thead', null, h( 'tr', null,
					! free && h( 'th', { style: { width: 28 } }, h( 'input', { type: 'checkbox', 'aria-label': 'Select all', checked: rows.length > 0 && rows.every( ( p ) => picked.includes( p.id ) ), onChange: ( e ) => setPicked( e.target.checked ? rows.map( ( p ) => p.id ) : [] ) } ) ),
					h( 'th', null, 'Title' ), h( 'th', null, 'Author' ), h( 'th', { style: { width: 280 } }, 'Audio' ), h( 'th', null, 'Date' ) ) ),
				h( 'tbody', null, rows.map( ( p ) => {
					const l = lead( p );
					const can = l.st === 'Outdated' || l.st === 'Failed' || l.st === 'Missing';
					return h( 'tr', { key: p.id },
						! free && h( 'td', null, h( 'input', { type: 'checkbox', 'aria-label': 'Select ' + p.title, checked: picked.includes( p.id ), onChange: ( e ) => setPicked( e.target.checked ? picked.concat( p.id ) : picked.filter( ( x ) => x !== p.id ) ) } ) ),
						h( 'td', null, h( 'b', { style: { color: '#2271b1' } }, p.title ), h( 'div', { className: 'atlasvoice-rowlinks' },
							h( Button, { variant: 'link', onClick: () => ctx.setView( 'editor' ) }, 'Edit' ),
							can && h( Button, { variant: 'link', onClick: () => { ctx.makeAudio( [ p.id ] ); notify( ( l.st === 'Missing' ? 'Making' : 'Remaking' ) + ' the audio for “' + p.title + '” on the server.' ); } }, l.st === 'Failed' ? 'Try again' : l.st === 'Missing' ? 'Make audio' : 'Remake audio' ) ) ),
						h( 'td', null, p.id % 2 ? 'editor' : 'admin' ),
						h( 'td', null,
							h( HStack, { justify: 'flex-start', wrap: true, spacing: 1 }, h( AV.JobChip, { l } ), ! free && vis( p ).length > 1 && h( 'span', { className: 'atlasvoice-weak', style: { fontSize: 12 } }, vis( p ).map( ( x ) => x.l + ( x.st === 'Ready' ? ' ✓' : '' ) ).join( ' · ' ) ) ),
							h( 'div', { className: 'atlasvoice-weak', style: { fontSize: 12, marginTop: 4, color: l.st === 'Failed' ? '#b32d2e' : undefined } }, note( l ) ) ),
						h( 'td', null, 'Published' ) );
				} ) ) ) ),
			! rows.length && h( 'p', { style: { marginTop: 8 } }, 'No posts match this filter.' ) );
	}
	AV.V.wp = function WpScreens() {
		const ctx = useApp();
		const { free, notify } = ctx;
		const [ dlg, setDlg ] = useState( null );
		const [ tb, setTb ] = useState( false );
		const go = ( id ) => { ctx.setView( 'app' ); ctx.go( id ); };
		return h( 'div', { className: 'atlasvoice-view' }, h( 'div', { className: 'atlasvoice-wp' },
			h( 'h2', null, 'Notices outside AtlasVoice' ),
			h( 'p', null, 'At most one AtlasVoice notice per screen, by priority: problem, staging, usage, update, setup, review, news. All dismissible. Inside AtlasVoice they move into the Notices bell. Old dismissals are kept.' ),
			! free && h( Notice, { status: 'error', isDismissible: false, actions: [ { label: 'Install AtlasVoice', variant: 'primary', onClick: () => notify( 'Installing AtlasVoice from WordPress.org.' ) } ] }, h( 'b', null, 'AtlasVoice Pro needs AtlasVoice to be active. ' ), 'Pro adds to the free plugin.' ),
			h( Notice, { status: 'error', actions: [ { label: 'Show me how', variant: 'primary', onClick: () => go( 'health:cors' ) } ] }, h( 'b', null, 'Some visitors can’t load the AtlasVoice player. ' ), 'Cloudflare is blocking 2 scripts. It takes about two minutes to fix.' ),
			h( Notice, { status: 'warning', actions: [ { label: 'Go live…', variant: 'primary', onClick: () => ctx.askMode( 'live' ) } ] }, h( 'b', null, 'AtlasVoice is in staging, so visitors can’t hear your audio yet. ' ), 'Admins only.' ),
			h( Notice, { status: 'warning', actions: [ { label: 'See usage and options', onClick: () => go( 'account' ) } ] }, h( 'b', null, '4% of your AtlasVoice characters left this month. ' ), 'New audio stops on about 27 October. Audio already made keeps playing.' ),
			h( Notice, { status: 'success', actions: [ { label: 'Roll back', onClick: () => go( 'versions' ) } ] }, h( 'b', null, 'AtlasVoice updated to 2.5.0. ' ), 'If something stopped working, go back to 2.4.0. Settings and audio files are kept.' ),
			free && h( Notice, { status: 'info', actions: [ { label: 'Set it up', variant: 'primary', onClick: () => go( 'voice' ) }, { label: 'Not now', onClick: () => notify( 'We’ll ask again in 30 days, at most 3 times.' ) } ] }, h( 'b', null, 'A natural voice for your posts, now free. ' ), 'Dashboard and Plugins screens only.' ),
			h( Notice, { status: 'info', actions: [ { label: 'Download Spanish', variant: 'primary', onClick: () => notify( 'Downloading… Downloaded, reloading.' ) } ] }, 'AtlasVoice is available in Español. Downloads only when you click.' ),
			h( 'h2', null, 'Toolbar' ),
			h( 'div', { style: { position: 'relative', display: 'inline-block' } }, h( 'button', { className: 'atlasvoice-tb', 'aria-expanded': tb, onClick: () => setTb( ! tb ) }, h( 'span', { className: 'atlasvoice-dot', style: { color: ctx.mode === 'live' ? '#68de7c' : '#f0c33c' } } ), 'AtlasVoice: ' + ( ctx.mode === 'live' ? 'Live' : 'Staging' ) ),
				tb && h( 'div', { className: 'atlasvoice-tbmenu' }, h( 'small', null, ctx.mode === 'live' ? 'Visitors hear your posts.' : 'Only you can see the player.' ),
					h( 'button', { onClick: () => { setTb( false ); ctx.askMode( ctx.mode === 'live' ? 'staging' : 'live' ); } }, ctx.mode === 'live' ? 'Back to staging…' : 'Go live…' ),
					h( 'button', { onClick: () => { setTb( false ); ctx.openPicker(); } }, 'Pick content to read' ),
					h( 'button', { onClick: () => { setTb( false ); notify( 'The player is hidden on this post.' ); } }, 'Hide the player on this post' ),
					h( 'button', { onClick: () => { setTb( false ); go( 'overview' ); } }, 'Open AtlasVoice' ) ) ),
			h( 'h2', null, 'Plugins screen' ),
			h( 'div', { className: 'atlasvoice-scroll-x' }, h( 'table', { className: 'atlasvoice-wptable' }, h( 'thead', null, h( 'tr', null, h( 'th', null, 'Plugin' ), h( 'th', null, 'Description' ) ) ), h( 'tbody', null,
				h( 'tr', null, h( 'td', null, h( 'b', null, 'Text To Speech TTS Accessibility' ), h( 'div', { className: 'atlasvoice-rowlinks' }, [ [ 'Settings', () => go( 'overview' ) ], [ 'Docs', () => go( 'docs' ) ], [ 'Roll back', () => go( 'versions' ) ], [ 'Deactivate', () => setDlg( 'free' ) ] ].map( ( [ l, fn ] ) => h( Button, { key: l, variant: 'link', isDestructive: l === 'Deactivate', onClick: fn }, l ) ) ) ), h( 'td', null, 'Adds a Listen button and audio player to your posts. Version 2.5.0' ) ),
				! free && h( 'tr', null, h( 'td', null, h( 'b', null, 'AtlasVoice Pro' ), h( 'div', { className: 'atlasvoice-rowlinks' }, [ [ 'Settings', () => go( 'overview' ) ], [ 'Licence', () => go( 'licence' ) ], [ 'Roll back', () => go( 'versions' ) ], [ 'Deactivate', () => setDlg( 'pro' ) ] ].map( ( [ l, fn ] ) => h( Button, { key: l, variant: 'link', isDestructive: l === 'Deactivate', onClick: fn }, l ) ) ) ), h( 'td', null, 'Studio voices, languages and audio for many posts. Version 3.6.0' ) ) ) ) ),
			h( PostsList ),
			h( 'h2', null, 'Dashboard widget' ),
			h( C.Card, { style: { maxWidth: 420 } }, h( C.CardHeader, null, h( AV.H2, null, 'AtlasVoice · Today' ) ), h( C.CardBody, null, h( VStack, { spacing: 3 }, h( HStack, { justify: 'flex-start', spacing: 6 }, h( VStack, { spacing: 0 }, h( 'b', { style: { fontSize: 20 } }, '184' ), h( 'span', { className: 'atlasvoice-weak' }, 'plays' ) ), h( VStack, { spacing: 0 }, h( 'b', { style: { fontSize: 20 } }, '6.1 h' ), h( 'span', { className: 'atlasvoice-weak' }, 'listening' ) ) ), h( Button, { variant: 'link', onClick: () => go( 'insights' ) }, 'Open Insights' ) ) ) ),
			h( 'h2', null, 'Network Admin' ),
			h( 'p', null, 'Network Admin only. Each site keeps its own mode and content rules.' ),
			h( 'div', { className: 'atlasvoice-scroll-x' }, h( 'table', { className: 'atlasvoice-wptable' }, h( 'thead', null, h( 'tr', null, [ 'Site', 'Mode', 'Voice', 'Set up', '' ].map( ( x ) => h( 'th', { key: x }, x ) ) ) ), h( 'tbody', null,
				[ [ 'The Reading Site', 'Live', 'Natural voice', true ], [ 'Mill Museum Shop', 'Staging', 'Browser voice', true ], [ 'Volunteers', 'Off', '—', false ], [ 'Archive', 'Live', 'AtlasVoice Cloud', true ] ].map( ( s ) => h( 'tr', { key: s[ 0 ] }, h( 'td', null, h( 'b', null, s[ 0 ] ) ), h( 'td', null, h( AV.Chip, { tone: s[ 1 ] === 'Live' ? 'ok' : s[ 1 ] === 'Staging' ? 'warn' : '', dot: true }, s[ 1 ] ) ), h( 'td', null, s[ 2 ] ), h( 'td', null, s[ 3 ] ? 'Yes' : 'No' ), h( 'td', null, h( Button, { variant: 'link', onClick: () => notify( 'In the plugin this opens AtlasVoice on ' + s[ 0 ] + '.' ) }, 'Open' ) ) ) ) ) ) ),
			h( 'p', { style: { marginTop: 16 } }, 'After activation, WordPress opens Setup once. Reactivating a site that is already set up opens Overview instead.' ),
			dlg && h( DeactivateModal, { pro: dlg === 'pro', onClose: () => setDlg( null ) } ) ) );
	};
}( window.AVM ) );
