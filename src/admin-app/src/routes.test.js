import {
	CLASSIC_ROUTES,
	SCREENS,
	SHORT_ROUTES,
	getScreen,
	getTabs,
	resolveRoute,
	toHash,
} from './routes';

describe( 'route table', () => {
	it( 'has the approved destinations in rail order', () => {
		expect( SCREENS.map( ( screen ) => screen.id ) ).toEqual( [
			'overview',
			'setup',
			'voice',
			'player',
			'content',
			'library',
			'insights',
			'seo',
			'site',
			'account',
			'help',
		] );
	} );

	it( 'has 33 pages with Pro: 3 screens without tabs and 30 tabs', () => {
		const tabs = SCREENS.reduce(
			( count, screen ) => count + getTabs( screen, true ).length,
			0
		);
		const plain = SCREENS.filter( ( screen ) => ! screen.tabs ).length;

		expect( tabs ).toBe( 30 );
		expect( plain ).toBe( 3 );
	} );

	it( 'hides Pro-only tabs in Free', () => {
		expect(
			getTabs( getScreen( 'account' ), false ).map( ( tab ) => tab.id )
		).toEqual( [ 'usage', 'plans' ] );
		expect(
			getTabs( getScreen( 'library' ), false ).map( ( tab ) => tab.id )
		).toEqual( [ 'all', 'settings' ] );
	} );

	it( 'points every alias at a place that exists', () => {
		const targets = [
			...Object.values( CLASSIC_ROUTES ),
			...Object.values( SHORT_ROUTES ),
		];

		for ( const target of targets ) {
			expect( resolveRoute( toHash( target ), true ).id ).toBe(
				resolveRoute( toHash( target ), true ).tab
					? resolveRoute( toHash( target ), true ).id
					: target
			);
			expect( getScreen( target.split( ':' )[ 0 ] ) ).toBeDefined();
		}
	} );
} );

describe( 'resolveRoute', () => {
	it.each( [
		[ '', 'overview' ],
		[ '#/', 'overview' ],
		[ '#/overview', 'overview' ],
		[ '#/voice', 'voice:voice' ],
		[ '#/voice/pronunciation', 'voice:pronunciation' ],
		[ '#/player', 'player:look' ],
		[ '#/player/read', 'player:read' ],
		[ '#/seo', 'seo' ],
		[ '#/setup', 'setup' ],
		[ '#/VOICE/Languages', 'voice:languages' ],
		[ '#/voice/languages/', 'voice:languages' ],
		[ '#/voice/languages?from=notice', 'voice:languages' ],
	] )( 'opens %s as %s', ( hash, id ) => {
		expect( resolveRoute( hash, true ).id ).toBe( id );
	} );

	// Every address of the classic dashboard (DESIGN.md, "Old URL keeps working").
	it.each( [
		[ '#/customize', 'player:look' ],
		[ '#/listening', 'voice:voice' ],
		[ '#/listening?setup=atlasvoice-tts', 'voice:voice' ],
		[ '#/integrations', 'voice:providers' ],
		[ '#/highlight', 'player:read' ],
		[ '#/analytics', 'insights:overview' ],
		[ '#/seo', 'seo' ],
		[ '#/compatibility', 'site:health' ],
		[ '#/aliases', 'voice:pronunciation' ],
		[ '#/maintenance', 'library:clean' ],
		[ '#/versions', 'site:versions' ],
		[ '#/faq', 'help:docs' ],
		[ '#/plugins', 'help:more' ],
		// The classic router ran without the slash too.
		[ '#customize', 'player:look' ],
		[ '#aliases', 'voice:pronunciation' ],
	] )( 'keeps the classic address %s working (%s)', ( hash, id ) => {
		expect( resolveRoute( hash, true ).id ).toBe( id );
	} );

	it.each( [
		[ '#/plans', 'account:plans' ],
		[ '#/licence', 'account:licence' ],
		[ '#/docs', 'help:docs' ],
		[ '#/moved', 'help:moved' ],
		[ '#/advanced', 'site:advanced' ],
	] )( 'opens the short address %s as %s', ( hash, id ) => {
		expect( resolveRoute( hash, true ).id ).toBe( id );
	} );

	it( 'sends Pro-only places to their Free home', () => {
		expect( resolveRoute( '#/account/licence', false ).id ).toBe(
			'account:plans'
		);
		expect( resolveRoute( '#/licence', false ).id ).toBe( 'account:plans' );
		expect( resolveRoute( '#/maintenance', false ).id ).toBe(
			'library:all'
		);
		expect( resolveRoute( '#/library/clean', true ).id ).toBe(
			'library:clean'
		);
	} );

	it.each( [
		[ '#/nope', 'overview' ],
		[ '#/voice/nope', 'voice:voice' ],
		[ '#/seo/extra', 'seo' ],
		[ '#/../../etc/passwd', 'overview' ],
		[ '#/<script>alert(1)</script>', 'overview' ],
		[ '#/__proto__', 'overview' ],
		[ '#/constructor', 'overview' ],
	] )( 'never opens an unknown place: %s -> %s', ( hash, id ) => {
		expect( resolveRoute( hash, true ).id ).toBe( id );
	} );

	it( 'gives the screen and the tab separately', () => {
		expect( resolveRoute( '#/site/versions', true ) ).toEqual( {
			screen: 'site',
			tab: 'versions',
			id: 'site:versions',
		} );
		expect( resolveRoute( '#/seo', true ) ).toEqual( {
			screen: 'seo',
			tab: null,
			id: 'seo',
		} );
	} );
} );

describe( 'toHash', () => {
	it( 'writes the address for a route id', () => {
		expect( toHash( 'voice:pronunciation' ) ).toBe(
			'#/voice/pronunciation'
		);
		expect( toHash( 'overview' ) ).toBe( '#/overview' );
	} );
} );
