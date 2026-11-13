import {
	BROWSER_PLAYER,
	closestLanguage,
	fieldsForEngine,
	languagesOf,
	naturalLanguages,
	naturalSpeaks,
	readBrowserVoices,
	voiceForLanguage,
} from './voice-options';

const VOICES = [
	{ name: 'Samantha', lang: 'en-US' },
	{ name: 'Daniel', lang: 'en-GB' },
	{ name: 'Thomas', lang: 'fr-FR' },
	{ name: 'Amelie', lang: 'fr-FR' },
];
const NATURAL = 3;
const current = ( changes ) => ( {
	language: '',
	voice: '',
	site_language: 'en-US',
	natural_player_id: NATURAL,
	...changes,
} );

describe( 'the voices of the browser', () => {
	it( 'reads them as plain objects, each once', () => {
		const synth = {
			getVoices: () => [
				{ name: 'Samantha', lang: 'en-US', localService: true },
				{ name: 'Samantha', lang: 'en-US' },
				{ name: '', lang: 'en-US' },
				{ name: 'No language' },
				null,
			],
		};

		expect( readBrowserVoices( synth ) ).toEqual( [
			{ name: 'Samantha', lang: 'en-US' },
		] );
	} );

	it.each( [
		[ undefined ],
		[ null ],
		[ {} ],
		[ { getVoices: () => null } ],
	] )( 'gives an empty list for a browser without voices (%j)', ( synth ) => {
		expect( readBrowserVoices( synth ) ).toEqual( [] );
	} );

	it( 'lists their languages sorted, each once', () => {
		expect( languagesOf( VOICES ) ).toEqual( [
			'en-GB',
			'en-US',
			'fr-FR',
		] );
	} );
} );

describe( 'the closest language', () => {
	const available = [ 'en-GB', 'en-US', 'fr-FR' ];

	it.each( [
		[ 'en-US', 'en-US' ],
		[ 'en_us', 'en-US' ],
		[ 'fr', 'fr-FR' ],
		[ 'fr-CA', 'fr-FR' ],
		[ 'en', 'en-GB' ],
		[ 'bn-BD', 'en-GB' ],
		[ '', 'en-GB' ],
		[ undefined, 'en-GB' ],
	] )( 'for %j is %s', ( wanted, expected ) => {
		expect( closestLanguage( wanted, available ) ).toBe( expected );
	} );

	it( 'is empty when the browser has no language at all', () => {
		expect( closestLanguage( 'en', [] ) ).toBe( '' );
	} );
} );

describe( 'the natural voice', () => {
	it( 'lists its languages by name, sorted', () => {
		const list = naturalLanguages();
		const labels = list.map( ( item ) => item.label );

		expect( list.length ).toBeGreaterThan( 40 );
		expect( labels ).toEqual(
			[ ...labels ].sort( ( a, b ) => a.localeCompare( b ) )
		);
		expect( list ).toContainEqual( { value: 'en', label: 'English' } );
	} );

	it( 'knows what it speaks, and is not fooled by built-in names', () => {
		expect( naturalSpeaks( 'en' ) ).toBe( true );
		expect( naturalSpeaks( 'en-US' ) ).toBe( false );
		expect( naturalSpeaks( 'constructor' ) ).toBe( false );
		expect( naturalSpeaks( '' ) ).toBe( false );
	} );
} );

describe( 'what changes with the engine', () => {
	it( 'gives the natural voice a language it speaks', () => {
		expect(
			fieldsForEngine( NATURAL, current( { language: 'en-US' } ), VOICES )
		).toEqual( { language: 'en-us' } );
		expect(
			fieldsForEngine( NATURAL, current( { language: 'fr-FR' } ), VOICES )
		).toEqual( { language: 'fr' } );
	} );

	it( 'uses the site language when nothing was chosen yet', () => {
		expect(
			fieldsForEngine(
				NATURAL,
				current( { site_language: 'de-DE' } ),
				VOICES
			)
		).toEqual( { language: 'de' } );
	} );

	it( 'leaves a language the natural voice already speaks', () => {
		expect(
			fieldsForEngine( NATURAL, current( { language: 'fr' } ), VOICES )
		).toEqual( {} );
	} );

	it( 'gives the browser voice a language and a voice this browser has', () => {
		expect(
			fieldsForEngine(
				BROWSER_PLAYER,
				current( { language: 'fr' } ),
				VOICES
			)
		).toEqual( { language: 'fr-FR', voice: 'Thomas' } );
	} );

	it( 'leaves a browser voice that is still there', () => {
		expect(
			fieldsForEngine(
				BROWSER_PLAYER,
				current( { language: 'en-GB', voice: 'Daniel' } ),
				VOICES
			)
		).toEqual( {} );
	} );

	it( 'changes nothing when the browser has no voices to offer', () => {
		expect(
			fieldsForEngine( BROWSER_PLAYER, current( { language: 'fr' } ), [] )
		).toEqual( {} );
	} );

	it( 'changes nothing for another engine', () => {
		expect(
			fieldsForEngine( 6, current( { language: 'en' } ), VOICES )
		).toEqual( {} );
	} );
} );

describe( 'the voice after a language change', () => {
	it( 'keeps the voice when it speaks the new language', () => {
		expect( voiceForLanguage( 'fr-FR', 'Amelie', VOICES ) ).toBe(
			'Amelie'
		);
	} );

	it( 'takes the first voice of the new language otherwise', () => {
		expect( voiceForLanguage( 'fr-FR', 'Samantha', VOICES ) ).toBe(
			'Thomas'
		);
	} );

	it( 'is empty when no voice speaks the language', () => {
		expect( voiceForLanguage( 'bn-BD', 'Samantha', VOICES ) ).toBe( '' );
	} );
} );
