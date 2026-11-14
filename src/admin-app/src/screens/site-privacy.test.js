import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { getScreenComponent } from './registry';
import SitePrivacy from './SitePrivacy';

expect.extend( toHaveNoViolations );

/** What a site with the free plugin answers (TTA\Site\Privacy). */
const FREE = {
	policy_url:
		'https://site.test/wp-admin/options-privacy.php?tab=policyguide',
	export_url: 'https://site.test/wp-admin/export-personal-data.php',
	erase_url: 'https://site.test/wp-admin/erase-personal-data.php',
	listening_records: 1284,
	usage_sharing: { managed_here: true, allowed: false },
};

/** With Pro: Pro manages the choice. */
const PRO = {
	...FREE,
	usage_sharing: { managed_here: false, allowed: false },
};

/**
 * A stand-in for the site's privacy route. A POST changes the choice.
 *
 * @param {Object} start            What the site answers.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the first load.
 * @param {Object} options.failPost { status, message } to refuse the change.
 * @return {Object} { posts, gets }.
 */
function fakeSite( start = FREE, { failGet, failPost } = {} ) {
	const site = { posts: [], gets: 0, stored: { ...start } };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( _url, options = {} ) => {
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
			site.stored = {
				...site.stored,
				usage_sharing: {
					managed_here: true,
					allowed: sent.usage_sharing,
				},
			};

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

const ready = () =>
	screen.findByRole( 'heading', { name: 'Your privacy policy' } );
const toggle = () =>
	screen.getByRole( 'checkbox', {
		name: 'Share anonymous usage data with AtlasAiDev',
	} );

afterEach( () => {
	delete window.fetch;
} );

describe( 'Site health › Privacy', () => {
	it( 'is the screen of the site:privacy route', () => {
		expect( getScreenComponent( 'site:privacy' ) ).toBeTruthy();
	} );

	it( 'only reads when it opens', async () => {
		const site = fakeSite();
		renderWithApp( <SitePrivacy /> );
		await ready();

		expect( site.gets ).toBe( 1 );
		expect( site.posts ).toHaveLength( 0 );
	} );

	it( 'links to the suggested policy text and to WordPress’ own data tools', async () => {
		fakeSite();
		renderWithApp( <SitePrivacy /> );
		await ready();

		expect(
			screen.getByRole( 'link', { name: 'Open the suggested text' } )
		).toHaveAttribute( 'href', FREE.policy_url );
		expect(
			screen.getByRole( 'link', { name: 'Export personal data' } )
		).toHaveAttribute( 'href', FREE.export_url );
		expect(
			screen.getByRole( 'link', { name: 'Erase personal data' } )
		).toHaveAttribute( 'href', FREE.erase_url );
	} );

	it( 'says how many listening records the site holds', async () => {
		fakeSite();
		renderWithApp( <SitePrivacy /> );
		await ready();

		expect(
			screen.getByText( 'This site holds 1,284 listening records.' )
		).toBeInTheDocument();
	} );

	it( 'says "record" for one', async () => {
		fakeSite( { ...FREE, listening_records: 1 } );
		renderWithApp( <SitePrivacy /> );
		await ready();

		expect(
			screen.getByText( 'This site holds 1 listening record.' )
		).toBeInTheDocument();
	} );

	it( 'says no visitor data goes to AtlasAiDev', async () => {
		fakeSite();
		renderWithApp( <SitePrivacy /> );
		await ready();

		expect(
			screen.getByText(
				'Nothing about your visitors is sent to AtlasAiDev.'
			)
		).toBeInTheDocument();
	} );

	describe( 'sharing anonymous usage data', () => {
		it( 'is off until the owner turns it on, and says what would be sent', async () => {
			fakeSite();
			renderWithApp( <SitePrivacy /> );
			await ready();

			expect( toggle() ).not.toBeChecked();
			expect(
				screen.getByText( /No post content and no visitor data\./ )
			).toBeInTheDocument();
		} );

		it( 'turns on at once and thanks the owner', async () => {
			const site = fakeSite();
			const { context } = renderWithApp( <SitePrivacy /> );
			await ready();

			fireEvent.click( toggle() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { usage_sharing: true } ] )
			);
			await waitFor( () => expect( toggle() ).toBeChecked() );
			expect( context.notify ).toHaveBeenCalledWith(
				'Thank you. Anonymous usage data is shared weekly.'
			);
		} );

		it( 'turns off at once and says nothing more is sent', async () => {
			const site = fakeSite( {
				...FREE,
				usage_sharing: { managed_here: true, allowed: true },
			} );
			const { context } = renderWithApp( <SitePrivacy /> );
			await ready();

			expect( toggle() ).toBeChecked();
			fireEvent.click( toggle() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { usage_sharing: false } ] )
			);
			await waitFor( () => expect( toggle() ).not.toBeChecked() );
			expect( context.notify ).toHaveBeenCalledWith(
				'Stopped. Nothing more is sent.'
			);
		} );

		it( 'stays as it was and says why when the site refuses', async () => {
			fakeSite( FREE, {
				failPost: { status: 403, message: 'Not allowed.' },
			} );
			const { context } = renderWithApp( <SitePrivacy /> );
			await ready();

			fireEvent.click( toggle() );

			await waitFor( () =>
				expect( context.notify ).toHaveBeenCalledWith(
					'Not changed: Not allowed.',
					'error'
				)
			);
			expect( toggle() ).not.toBeChecked();
		} );

		it( 'shows no switch when Pro manages the choice, and says so', async () => {
			fakeSite( PRO );
			renderWithApp( <SitePrivacy />, { boot: { isPro: true } } );
			await ready();

			expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
			expect(
				screen.getByText( /The free plugin sends nothing\./ )
			).toBeInTheDocument();
		} );
	} );

	it( 'has no disabled control and nothing about buying Pro', async () => {
		fakeSite();
		const { container } = renderWithApp( <SitePrivacy /> );
		await ready();

		expect(
			container.querySelectorAll(
				'.atlasvoice-pronote, .atlasvoice-pro, input[disabled], [aria-disabled="true"]'
			)
		).toHaveLength( 0 );
	} );

	it( 'offers to try again when the details cannot be loaded', async () => {
		const site = fakeSite( FREE, {
			failGet: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <SitePrivacy /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await ready() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'survives an answer without the sharing part', async () => {
		fakeSite( { policy_url: FREE.policy_url } );
		renderWithApp( <SitePrivacy /> );

		expect( await ready() ).toBeInTheDocument();
		expect(
			screen.getByText( 'This site holds 0 listening records.' )
		).toBeInTheDocument();
	} );

	it( 'has no accessibility violations with and without Pro', async () => {
		fakeSite();
		const free = renderWithApp( <SitePrivacy /> );
		await ready();
		expect( await axe( free.container ) ).toHaveNoViolations();
		free.unmount();

		fakeSite( PRO );
		const pro = renderWithApp( <SitePrivacy />, { boot: { isPro: true } } );
		await ready();
		expect( await axe( pro.container ) ).toHaveNoViolations();
	} );
} );
