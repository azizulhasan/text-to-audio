import { BRAND_COLOR, getThemeProvider } from './theme';

describe( 'theme', () => {
	it( 'uses the approved Voice Indigo', () => {
		expect( BRAND_COLOR ).toBe( '#5646e5' );
	} );

	it( 'finds ThemeProvider where WordPress has it (7.0+)', () => {
		const ThemeProvider = () => null;

		expect( getThemeProvider( { wp: { theme: { ThemeProvider } } } ) ).toBe(
			ThemeProvider
		);
	} );

	it.each( [
		[ 'no wp global', {} ],
		[ 'wp without theme (WordPress 6.6)', { wp: {} } ],
		[ 'theme without ThemeProvider', { wp: { theme: {} } } ],
		[
			'something that is not a component',
			{ wp: { theme: { ThemeProvider: 'x' } } },
		],
	] )( 'returns null with %s', ( _name, root ) => {
		expect( getThemeProvider( root ) ).toBeNull();
	} );
} );
