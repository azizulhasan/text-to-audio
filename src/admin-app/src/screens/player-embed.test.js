import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import PlayerEmbed, { copyText } from './PlayerEmbed';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

/** What the site answers (TTA\Player\Embed), shortened to three options. */
const EMBED = {
	shortcode: '[atlasvoice]',
	legacy_shortcode: '[tta_listen_btn]',
	block: 'AtlasVoice',
	options: [
		{
			name: 'id',
			description: 'Reads another post, by its number.',
			example: '[atlasvoice id="128"]',
		},
		{
			name: 'lang',
			description: 'The language of this player.',
			example: '[atlasvoice lang="es-ES"]',
		},
		{
			name: 'class',
			description: 'Adds your own CSS class to the player.',
			example: '[atlasvoice class="my-player"]',
		},
	],
};

/**
 * A stand-in for the site's embed route.
 *
 * @param {Object} answer What the route returns.
 * @param {Object} fail   { status, message } to refuse the first load.
 * @return {Object} { calls }.
 */
function fakeSite( answer = EMBED, fail ) {
	const site = { calls: [] };
	let failed = false;

	window.fetch = jest.fn( ( url, options = {} ) => {
		site.calls.push( { url, method: options.method || 'GET' } );
		if ( fail && ! failed ) {
			failed = true;

			return Promise.resolve( {
				ok: false,
				status: fail.status,
				json: async () => ( { message: fail.message } ),
			} );
		}

		return Promise.resolve( {
			ok: true,
			status: 200,
			json: async () => answer,
		} );
	} );

	return site;
}

/**
 * Gives the page a clipboard, or one that refuses.
 *
 * @param {boolean} works Whether writing succeeds.
 * @return {Function} The mock that receives the text.
 */
function clipboard( works = true ) {
	const writeText = jest.fn( () =>
		works ? Promise.resolve() : Promise.reject( new Error( 'denied' ) )
	);
	Object.defineProperty( window.navigator, 'clipboard', {
		configurable: true,
		value: { writeText },
	} );

	return writeText;
}

const ready = () => screen.findByRole( 'heading', { name: 'Shortcode' } );

afterEach( () => {
	delete window.fetch;
	delete window.navigator.clipboard;
} );

describe( 'copying a text', () => {
	it( 'says yes when the browser took it', async () => {
		const writeText = clipboard();

		expect( await copyText( '[atlasvoice]' ) ).toBe( true );
		expect( writeText ).toHaveBeenCalledWith( '[atlasvoice]' );
	} );

	it( 'says no when the browser refuses or has no clipboard', async () => {
		clipboard( false );
		expect( await copyText( 'x' ) ).toBe( false );

		delete window.navigator.clipboard;
		expect( await copyText( 'x' ) ).toBe( false );
	} );
} );

describe( 'Player › Shortcode & block', () => {
	it( 'is the screen of the player:embed route', () => {
		expect( getScreenComponent( 'player:embed' ) ).toBeTruthy();
	} );

	it( 'reads the reference from the site and changes nothing', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerEmbed /> );
		await ready();

		expect( site.calls ).toEqual( [
			{ url: 'https://site.test/wp-json/tta/v1/embed', method: 'GET' },
		] );
	} );

	it( 'shows the shortcode and says the older one keeps working', async () => {
		fakeSite();
		renderWithApp( <PlayerEmbed /> );
		await ready();

		expect( screen.getByText( '[atlasvoice]' ) ).toBeInTheDocument();
		expect(
			screen.getByText( /The older \[tta_listen_btn\] keeps working\./ )
		).toBeInTheDocument();
	} );

	it( 'copies the shortcode and says so', async () => {
		const writeText = clipboard();
		fakeSite();
		const { context } = renderWithApp( <PlayerEmbed /> );
		await ready();

		fireEvent.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith( 'Shortcode copied.' )
		);
		expect( writeText ).toHaveBeenCalledWith( '[atlasvoice]' );
	} );

	it( 'says what to do when the browser does not allow copying', async () => {
		clipboard( false );
		fakeSite();
		const { context } = renderWithApp( <PlayerEmbed /> );
		await ready();

		fireEvent.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Could not copy. Select the shortcode and copy it by hand.',
				'error'
			)
		);
	} );

	it( 'lists every option the site names, with what it does and an example', async () => {
		fakeSite();
		renderWithApp( <PlayerEmbed /> );
		await ready();

		const rows = within( screen.getByRole( 'table' ) ).getAllByRole(
			'row'
		);
		expect( rows ).toHaveLength( 4 );
		expect(
			within( rows[ 1 ] ).getByRole( 'rowheader', { name: 'id' } )
		).toBeInTheDocument();
		expect(
			within( rows[ 1 ] ).getByText(
				'Reads another post, by its number.'
			)
		).toBeInTheDocument();
		expect(
			within( rows[ 2 ] ).getByText( '[atlasvoice lang="es-ES"]' )
		).toBeInTheDocument();
	} );

	it( 'names the block the site ships', async () => {
		fakeSite();
		renderWithApp( <PlayerEmbed /> );
		await ready();

		expect(
			screen.getByText( /add the “AtlasVoice” block/ )
		).toBeInTheDocument();
	} );

	it( 'is a reference: no Save, no field, nothing about Pro', async () => {
		fakeSite();
		const { container } = renderWithApp( <PlayerEmbed /> );
		await ready();

		expect(
			screen.queryByRole( 'button', { name: 'Save' } )
		).not.toBeInTheDocument();
		expect(
			container.querySelectorAll(
				'input, select, textarea, .atlasvoice-pronote, .atlasvoice-pro'
			)
		).toHaveLength( 0 );
	} );

	it( 'offers to try again when the reference cannot be loaded', async () => {
		const site = fakeSite( EMBED, {
			status: 500,
			message: 'Server error',
		} );
		renderWithApp( <PlayerEmbed /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await ready() ).toBeInTheDocument();
		expect( site.calls ).toHaveLength( 2 );
	} );

	it( 'survives an answer without options', async () => {
		fakeSite( { shortcode: '[atlasvoice]', options: 'none' } );
		renderWithApp( <PlayerEmbed /> );

		expect( await ready() ).toBeInTheDocument();
		expect( screen.getAllByRole( 'row' ) ).toHaveLength( 1 );
	} );

	it( 'has no accessibility violations', async () => {
		fakeSite();
		const { container } = renderWithApp( <PlayerEmbed /> );
		await ready();

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
