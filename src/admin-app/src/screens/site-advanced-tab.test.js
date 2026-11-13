import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { getScreenComponent } from './registry';
import SiteAdvancedTab from './SiteAdvancedTab';

expect.extend( toHaveNoViolations );

/** What a site that never saved them answers (TTA\Site\Advanced). */
const DEFAULTS = {
	mode_bar: true,
	post_toggle: false,
	picker: false,
	dashboard_widget: true,
	keep_reading: true,
	no_auto_play: true,
	delete_on_uninstall: false,
};

/**
 * A stand-in for the site: the advanced route (a POST merges what was
 * sent) and the clear-cache route.
 *
 * @param {Object} start             What the site has stored.
 * @param {Object} options
 * @param {Object} options.failGet   { status, message } to refuse the first load.
 * @param {Object} options.failPost  { status, message } to refuse the save.
 * @param {Object} options.failClear { status, message } to refuse clearing.
 * @return {Object} { posts, cleared, gets }.
 */
function fakeSite( start = {}, { failGet, failPost, failClear } = {} ) {
	const site = {
		posts: [],
		cleared: 0,
		gets: 0,
		stored: { ...DEFAULTS, ...start },
	};
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( url, options = {} ) => {
		if ( String( url ).endsWith( '/clear-cache' ) ) {
			if ( failClear ) {
				return reply(
					{ message: failClear.message },
					false,
					failClear.status
				);
			}
			site.cleared++;

			return reply( { cleared: true } );
		}

		if ( options.method === 'POST' ) {
			if ( failPost ) {
				return reply(
					{ message: failPost.message },
					false,
					failPost.status
				);
			}
			const sent = JSON.parse( options.body );
			site.posts.push( sent );
			site.stored = { ...site.stored, ...sent };

			return reply( site.stored );
		}

		site.gets++;
		if ( failGet && site.gets === 1 ) {
			return reply( { message: failGet.message }, false, failGet.status );
		}

		return reply( site.stored );
	} );

	return site;
}

const saveButton = () => screen.getByRole( 'button', { name: 'Save' } );
const box = ( name ) => screen.getByRole( 'checkbox', { name } );
const ready = () =>
	screen.findByRole( 'checkbox', { name: 'Staging or Live in the toolbar' } );

afterEach( () => {
	delete window.fetch;
} );

describe( 'Site health › Advanced', () => {
	it( 'is the screen of the site:advanced route', () => {
		expect( getScreenComponent( 'site:advanced' ) ).toBeTruthy();
	} );

	it( 'shows what the site has stored', async () => {
		fakeSite( { picker: true, dashboard_widget: false } );
		renderWithApp( <SiteAdvancedTab /> );

		expect( await ready() ).toBeChecked();
		expect( box( 'On-page content picker' ) ).toBeChecked();
		expect(
			box( 'Quick stats on the WordPress dashboard' )
		).not.toBeChecked();
		expect(
			box( 'Delete all AtlasVoice data with the plugin' )
		).not.toBeChecked();
	} );

	it( 'writes nothing until Save, and then only what changed', async () => {
		const site = fakeSite();
		renderWithApp( <SiteAdvancedTab /> );
		await ready();

		fireEvent.click( box( 'On-page content picker' ) );
		fireEvent.click( box( 'Keep reading in another tab' ) );
		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [
				{ picker: true, keep_reading: false },
			] )
		);
	} );

	it( 'says it was saved', async () => {
		fakeSite();
		const { context } = renderWithApp( <SiteAdvancedTab /> );

		fireEvent.click( await ready() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Advanced settings saved.'
			)
		);
	} );

	describe( 'deleting data with the plugin', () => {
		it( 'is off, with no warning, on a site that never set it', async () => {
			fakeSite();
			renderWithApp( <SiteAdvancedTab /> );
			await ready();

			expect(
				screen.queryByText( /It cannot be undone/ )
			).not.toBeInTheDocument();
		} );

		it( 'warns before it is saved, and saves only on Save', async () => {
			const site = fakeSite();
			renderWithApp( <SiteAdvancedTab /> );
			await ready();

			fireEvent.click(
				box( 'Delete all AtlasVoice data with the plugin' )
			);

			expect(
				screen.getAllByText(
					/remove every setting, statistic and audio file/
				).length
			).toBeGreaterThan( 0 );
			expect( site.posts ).toHaveLength( 0 );

			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ delete_on_uninstall: true },
				] )
			);
		} );
	} );

	describe( 'clearing the cache', () => {
		it( 'clears at once, without Save, and says nothing saved was removed', async () => {
			const site = fakeSite();
			const { context } = renderWithApp( <SiteAdvancedTab /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'button', {
					name: 'Clear the AtlasVoice cache',
				} )
			);

			await waitFor( () => expect( site.cleared ).toBe( 1 ) );
			expect( context.notify ).toHaveBeenCalledWith(
				'Cache cleared. Nothing you saved was removed.'
			);
			expect( site.posts ).toHaveLength( 0 );
			expect( saveButton() ).toBeDisabled();
		} );

		it( 'sends a POST with the nonce to the clear-cache route', async () => {
			fakeSite();
			renderWithApp( <SiteAdvancedTab /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'button', {
					name: 'Clear the AtlasVoice cache',
				} )
			);

			await waitFor( () =>
				expect(
					window.fetch.mock.calls.some(
						( [ url, options ] ) =>
							url ===
								'https://site.test/wp-json/tta/v1/advanced/clear-cache' &&
							options.method === 'POST' &&
							options.headers[ 'X-WP-Nonce' ] === 'n0nce'
					)
				).toBe( true )
			);
		} );

		it( 'says why when the site refuses', async () => {
			fakeSite(
				{},
				{ failClear: { status: 403, message: 'Not allowed.' } }
			);
			const { context } = renderWithApp( <SiteAdvancedTab /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'button', {
					name: 'Clear the AtlasVoice cache',
				} )
			);

			await waitFor( () =>
				expect( context.notify ).toHaveBeenCalledWith(
					'The cache was not cleared: Not allowed.',
					'error'
				)
			);
		} );
	} );

	describe( 'the way back to the classic screens', () => {
		it( 'is under the settings', async () => {
			fakeSite();
			renderWithApp( <SiteAdvancedTab />, { hash: '#/site/advanced' } );
			await ready();

			expect(
				screen.getByRole( 'button', {
					name: 'Use the classic screens',
				} )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'link', {
					name: 'Open these settings in the classic screens',
				} )
			).toHaveAttribute(
				'href',
				'https://site.test/wp-admin/admin.php?page=text-to-audio&atlasvoice_ui=classic#/'
			);
		} );

		it( 'still works when the settings cannot be loaded', async () => {
			const site = fakeSite(
				{},
				{ failGet: { status: 500, message: 'Server error' } }
			);
			renderWithApp( <SiteAdvancedTab />, { hash: '#/site/advanced' } );

			expect(
				await screen.findByRole( 'button', {
					name: 'Use the classic screens',
				} )
			).toBeInTheDocument();

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Try again' } )
			);

			expect( await ready() ).toBeInTheDocument();
			expect( site.gets ).toBe( 2 );
		} );
	} );

	it( 'is the same with and without Pro: no Pro line, no disabled control', async () => {
		fakeSite();
		const { container } = renderWithApp( <SiteAdvancedTab /> );
		await ready();

		expect(
			container.querySelectorAll(
				'.atlasvoice-pronote, .atlasvoice-pro, input[disabled], [aria-disabled="true"]'
			)
		).toHaveLength( 0 );
	} );

	it( 'says why a save was refused and keeps the choice on screen', async () => {
		fakeSite(
			{},
			{ failPost: { status: 400, message: 'This must be on or off.' } }
		);
		const { context } = renderWithApp( <SiteAdvancedTab /> );
		await ready();

		fireEvent.click( box( 'On-page content picker' ) );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: This must be on or off.',
				'error'
			)
		);
		expect( box( 'On-page content picker' ) ).toBeChecked();
	} );

	it( 'has no accessibility violations, with the warning showing', async () => {
		fakeSite( { delete_on_uninstall: true } );
		const { container } = renderWithApp( <SiteAdvancedTab />, {
			hash: '#/site/advanced',
		} );
		await ready();

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
