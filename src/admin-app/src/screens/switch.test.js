import '@testing-library/jest-dom';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { axe, toHaveNoViolations } from 'jest-axe';

import { resolveRoute } from '../routes';
import Welcome from '../shell/Welcome';
import { renderWithApp } from '../test-utils';
import HelpMoved from './HelpMoved';
import { filterMovedItems, getMovedItems } from './moved';
import { getScreenComponent } from './registry';
import SiteAdvanced from './SiteAdvanced';

expect.extend( toHaveNoViolations );

const answer = ( body, ok = true, status = 200 ) =>
	jest.fn().mockResolvedValue( { ok, status, json: async () => body } );

afterEach( () => {
	delete window.fetch;
} );

describe( 'Where things moved: the data', () => {
	const items = getMovedItems();

	it( 'lists the 19 classic menu items', () => {
		expect( items ).toHaveLength( 19 );
	} );

	it( 'sends every item to a place that exists', () => {
		for ( const item of items ) {
			const [ screenId, tab ] = item.route.split( ':' );
			const resolved = resolveRoute(
				'#/' + item.route.replace( ':', '/' ),
				true
			);

			expect( resolved.screen ).toBe( screenId );
			// A route without a tab opens the screen's first tab.
			expect( resolved.tab ).toBe( tab || resolved.tab );
		}
	} );

	it( 'leaves Pro-only homes out in Free', () => {
		const free = filterMovedItems( items, '', false );

		expect( free ).toHaveLength( 17 );
		expect( free.some( ( item ) => item.pro ) ).toBe( false );
		expect( filterMovedItems( items, '', true ) ).toHaveLength( 19 );
	} );

	it.each( [
		[ 'aliases', [ 'Aliases' ] ],
		[ '  ALIASES ', [ 'Aliases' ] ],
		[ 'pronunciation', [ 'Aliases' ] ],
		[
			'customization',
			[ 'Customization', 'Customization › Select Player' ],
		],
		[ 'zzz', [] ],
	] )( 'finds "%s" by old or new name', ( query, expected ) => {
		expect(
			filterMovedItems( items, query, true ).map(
				( item ) => item.before
			)
		).toEqual( expected );
	} );
} );

describe( 'Where things moved: the screen', () => {
	it( 'says first that nothing saved has changed', () => {
		renderWithApp( <HelpMoved /> );

		expect(
			screen.getByText( 'Nothing you saved has changed.' )
		).toBeVisible();
	} );

	it( 'filters as you type and opens the new home', () => {
		const { context } = renderWithApp( <HelpMoved />, {
			boot: { isPro: true },
		} );

		fireEvent.change( screen.getByRole( 'searchbox' ), {
			target: { value: 'Highlight' },
		} );

		expect( screen.getAllByRole( 'row' ) ).toHaveLength( 2 ); // header + 1
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Open Player › Read-along' } )
		);
		expect( context.go ).toHaveBeenCalledWith( 'player:read' );
	} );

	it( 'gives one sentence and one action when nothing matches', () => {
		renderWithApp( <HelpMoved /> );
		const box = screen.getByRole( 'searchbox' );

		fireEvent.change( box, { target: { value: 'zzz' } } );
		expect( screen.getByText( 'Nothing matches “zzz”' ) ).toBeVisible();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Show every item' } )
		);
		expect( screen.getAllByRole( 'row' ).length ).toBeGreaterThan( 10 );
	} );

	it( 'shows what was typed as text, never as markup', () => {
		renderWithApp( <HelpMoved /> );

		fireEvent.change( screen.getByRole( 'searchbox' ), {
			target: { value: '<img src=x onerror=alert(1)>' },
		} );

		expect( document.querySelector( 'img[src="x"]' ) ).toBeNull();
		expect(
			screen.getByText( 'Nothing matches “<img src=x onerror=alert(1)>”' )
		).toBeVisible();
	} );

	it( 'has no accessibility violations', async () => {
		const { container } = renderWithApp( <HelpMoved /> );

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );

describe( 'Site health › Advanced: back to the classic screens', () => {
	const assign = jest.fn();
	const realLocation = window.location;

	beforeEach( () => {
		assign.mockClear();
		delete window.location;
		window.location = { ...realLocation, assign };
	} );

	afterEach( () => {
		window.location = realLocation;
	} );

	it( 'saves the choice and reloads into the classic screens', async () => {
		window.fetch = answer( {
			ui: 'classic',
			url: 'https://site.test/wp-admin/admin.php?page=text-to-audio',
		} );
		renderWithApp( <SiteAdvanced />, { hash: '#/site/advanced' } );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Use the classic screens' } )
		);

		await waitFor( () => expect( assign ).toHaveBeenCalled() );
		const [ url, options ] = window.fetch.mock.calls[ 0 ];
		expect( url ).toBe( 'https://site.test/wp-json/tta/v1/admin-ui' );
		expect( options.method ).toBe( 'POST' );
		expect( JSON.parse( options.body ) ).toEqual( { ui: 'classic' } );
		expect( options.headers[ 'X-WP-Nonce' ] ).toBe( 'n0nce' );
		expect( assign ).toHaveBeenCalledWith(
			'https://site.test/wp-admin/admin.php?page=text-to-audio'
		);
	} );

	it( 'stays and says why when the site refuses', async () => {
		window.fetch = answer( { message: 'Not allowed.' }, false, 403 );
		const { context } = renderWithApp( <SiteAdvanced />, {
			hash: '#/site/advanced',
		} );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Use the classic screens' } )
		);

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not allowed.',
				'error'
			)
		);
		expect( assign ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'button', { name: 'Use the classic screens' } )
		).toBeEnabled();
	} );

	it( 'links the settings that are not moved yet to the classic screens', () => {
		renderWithApp( <SiteAdvanced />, { hash: '#/site/advanced' } );

		expect(
			screen.getByRole( 'link', {
				name: 'Open these settings in the classic screens',
			} )
		).toHaveAttribute(
			'href',
			'https://site.test/wp-admin/admin.php?page=text-to-audio&atlasvoice_ui=classic#/'
		);
	} );

	it( 'has no accessibility violations', async () => {
		const { container } = renderWithApp( <SiteAdvanced />, {
			hash: '#/site/advanced',
		} );

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );

describe( 'Update-day welcome', () => {
	it( 'is not shown to a new install or after it was seen', () => {
		renderWithApp( <Welcome />, { boot: { showWelcome: false } } );

		expect( screen.queryByRole( 'dialog' ) ).toBeNull();
	} );

	it( 'says nothing saved has changed and offers three ways on', () => {
		renderWithApp( <Welcome />, { boot: { showWelcome: true } } );

		expect(
			screen.getByRole( 'dialog', { name: 'AtlasVoice has a new look' } )
		).toBeVisible();
		expect(
			screen.getByText( 'Nothing you saved has changed.' )
		).toBeVisible();
		for ( const name of [
			'Use the classic screens for now',
			'Show me what moved',
			'Start using it',
		] ) {
			expect( screen.getByRole( 'button', { name } ) ).toBeVisible();
		}
	} );

	it.each( [
		[ 'Start using it', null ],
		[ 'Show me what moved', 'help:moved' ],
		[ 'Use the classic screens for now', 'site:advanced' ],
	] )( '"%s" closes it for good and goes to %s', async ( name, route ) => {
		window.fetch = answer( { showWelcome: false } );
		const { context } = renderWithApp( <Welcome />, {
			boot: { showWelcome: true },
		} );

		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name } ) );
		} );

		expect( screen.queryByRole( 'dialog' ) ).toBeNull();
		expect( JSON.parse( window.fetch.mock.calls[ 0 ][ 1 ].body ) ).toEqual(
			{
				welcome: 'seen',
			}
		);
		expect( context.go.mock.calls ).toEqual( route ? [ [ route ] ] : [] );
	} );

	it( 'still closes when the site cannot be reached', async () => {
		window.fetch = jest.fn().mockRejectedValue( new Error( 'offline' ) );
		renderWithApp( <Welcome />, { boot: { showWelcome: true } } );

		await act( async () => {
			fireEvent.click(
				screen.getByRole( 'button', { name: 'Start using it' } )
			);
		} );

		expect( screen.queryByRole( 'dialog' ) ).toBeNull();
	} );
} );

describe( 'screen registry', () => {
	it( 'knows the rebuilt screens and nothing else', () => {
		expect( getScreenComponent( 'site:advanced' ) ).toBeTruthy();
		expect( getScreenComponent( 'help:moved' ) ).toBeTruthy();
		// A screen that is not rebuilt yet (Voice › Voice, then Audio
		// library › All posts, were the example here until they were built).
		expect( getScreenComponent( 'library:settings' ) ).toBeNull();
		expect( getScreenComponent( '__proto__' ) ).toBeNull();
		expect( getScreenComponent( 'constructor' ) ).toBeNull();
	} );

	it( 'lets Pro add a screen through the atlasvoice.screens filter', () => {
		const ProScreen = () => null;
		addFilter( 'atlasvoice.screens', 'test/pro', ( screens ) => ( {
			...screens,
			seo: ProScreen,
		} ) );

		expect( getScreenComponent( 'seo' ) ).toBe( ProScreen );
		// The free screens are still there.
		expect( getScreenComponent( 'help:moved' ) ).toBeTruthy();

		removeFilter( 'atlasvoice.screens', 'test/pro' );
		expect( getScreenComponent( 'seo' ) ).toBeNull();
	} );

	it( 'falls back to the placeholder when a filter returns rubbish', () => {
		addFilter( 'atlasvoice.screens', 'test/bad', () => null );

		expect( getScreenComponent( 'help:moved' ) ).toBeNull();

		removeFilter( 'atlasvoice.screens', 'test/bad' );
	} );
} );
