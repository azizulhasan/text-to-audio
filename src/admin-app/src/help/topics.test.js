import { helpFor, safeLink } from './topics';

const topics = {
	overview: { title: 'Home' },
	'voice:voice': { title: 'Choose your voice' },
	'voice:providers': { title: 'Connect a provider' },
	'voice:providers#gcs': { title: 'Cloud storage' },
	library: { title: 'Library' },
};

describe( 'helpFor', () => {
	it.each( [
		[ 'voice:providers#gcs', 'voice:providers#gcs' ],
		[ 'voice:providers#unknown', 'voice:providers' ],
		[ 'library:settings', 'library' ],
		[ 'voice:languages', 'voice:voice' ],
		[ 'voice', 'voice:voice' ],
		[ 'nothing', 'overview' ],
		[ '', 'overview' ],
		[ '__proto__', 'overview' ],
	] )( 'finds the topic for %s (%s)', ( route, key ) => {
		expect( helpFor( topics, route ).key ).toBe( key );
	} );

	it( 'returns null when there are no topics', () => {
		expect( helpFor( {}, 'voice' ) ).toBeNull();
		expect( helpFor( undefined, 'voice' ) ).toBeNull();
	} );
} );

describe( 'safeLink', () => {
	it( 'keeps web addresses', () => {
		expect(
			safeLink( 'https://atlasaidev.com/docs/atlasvoice/home/' )
		).toBe( 'https://atlasaidev.com/docs/atlasvoice/home/' );
	} );

	it.each( [
		'',
		null,
		undefined,
		'javascript:alert(1)',
		'data:text/html,x',
		'//evil.test',
	] )( 'drops %p', ( url ) => {
		expect( safeLink( url ) ).toBe( '' );
	} );
} );
