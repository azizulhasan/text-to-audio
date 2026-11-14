import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { getScreenComponent } from './registry';
import SiteVersions, { modeLabel, verdict } from './SiteVersions';

expect.extend( toHaveNoViolations );

const row = ( version, status, more = {} ) => ( {
	version,
	label: 'AtlasVoice ' + version,
	status,
	recommended: false,
	blocks: [],
	changes: [],
	notes: [],
	...more,
} );

/** What a site with the free plugin answers (TTA\Site\Versions). */
const FREE = {
	can_roll_back: true,
	installed: {
		free: {
			label: 'AtlasVoice',
			version: '2.5.0',
			auto_update: false,
			checkout: false,
		},
	},
	site: { php: '8.2', wordpress: '7.1', multisite: false },
	modes: {
		free: [
			row( '2.4.0', 'safe', { recommended: true } ),
			row( '2.3.12', 'changes', {
				changes: [ 'The natural voice is not in this version.' ],
			} ),
			row( '2.2.0', 'blocked', {
				blocks: [ 'Too old for your saved settings.' ],
			} ),
		],
	},
	errors: {},
};

/** With Pro: three lists and two plugins. */
const PRO = {
	...FREE,
	installed: {
		...FREE.installed,
		pro: {
			label: 'AtlasVoice Pro',
			version: '3.6.0',
			auto_update: true,
			checkout: false,
		},
	},
	modes: {
		both: [
			{
				...row( '2.4.0', 'safe' ),
				label: 'AtlasVoice 2.4.0 + Pro 3.5.0',
			},
		],
		pro: [ { ...row( '3.5.0', 'safe' ), label: 'AtlasVoice Pro 3.5.0' } ],
		free: FREE.modes.free,
	},
};

/**
 * A stand-in for the site: the versions route and the auto-update route.
 *
 * @param {Object} start            What the site answers.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the first load.
 * @param {Object} options.failPost { status, message } to refuse the switch.
 * @return {Object} { posts, gets }.
 */
function fakeSite( start = FREE, { failGet, failPost } = {} ) {
	const site = { posts: [], gets: 0, stored: start };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( url, options = {} ) => {
		if ( options.method === 'POST' ) {
			if ( failPost ) {
				return reply(
					{ message: failPost.message },
					false,
					failPost.status
				);
			}
			const sent = JSON.parse( options.body );
			site.posts.push( { url, ...sent } );
			site.stored = {
				...site.stored,
				installed: {
					...site.stored.installed,
					[ sent.plugin ]: {
						...site.stored.installed[ sent.plugin ],
						auto_update: sent.on,
					},
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

const ready = () => screen.findByRole( 'heading', { name: 'Older versions' } );

afterEach( () => {
	delete window.fetch;
} );

describe( 'the words for a version', () => {
	it( 'has a verdict in words and a colour for each status', () => {
		expect( verdict( 'safe' ) ).toEqual( { tone: 'ok', label: 'Safe' } );
		expect( verdict( 'changes' ).tone ).toBe( 'warn' );
		expect( verdict( 'blocked' ) ).toEqual( {
			tone: 'err',
			label: 'Not possible',
		} );
		// A status this screen does not know is never shown as safe.
		expect( verdict( 'new-status' ).tone ).toBe( 'err' );
	} );

	it( 'names each list', () => {
		expect( modeLabel( 'both' ) ).toMatch( /Both plugins together/ );
		expect( modeLabel( 'pro' ) ).toBe( 'Only AtlasVoice Pro' );
		expect( modeLabel( 'free' ) ).toBe( 'Only AtlasVoice' );
	} );
} );

describe( 'Site health › Versions', () => {
	it( 'is the screen of the site:versions route', () => {
		expect( getScreenComponent( 'site:versions' ) ).toBeTruthy();
	} );

	it( 'only reads when it opens', async () => {
		const site = fakeSite();
		renderWithApp( <SiteVersions /> );
		await ready();

		expect( site.gets ).toBe( 1 );
		expect( site.posts ).toHaveLength( 0 );
	} );

	it( 'says which version is installed and what it was checked against', async () => {
		fakeSite();
		renderWithApp( <SiteVersions /> );
		await ready();

		expect(
			screen.getAllByText( 'You are on AtlasVoice 2.5.0.' ).length
		).toBeGreaterThan( 0 );
		expect(
			screen.getByText(
				'Checked against this site: PHP 8.2, WordPress 7.1.'
			)
		).toBeInTheDocument();
	} );

	it( 'lists the older versions with a verdict and the reason', async () => {
		fakeSite();
		renderWithApp( <SiteVersions /> );
		await ready();

		const items = screen.getAllByRole( 'listitem' );
		expect( items ).toHaveLength( 3 );
		expect( within( items[ 0 ] ).getByText( 'Safe' ) ).toBeInTheDocument();
		expect(
			within( items[ 0 ] ).getByText(
				'The newest version that is safe for this site.'
			)
		).toBeInTheDocument();
		expect(
			within( items[ 1 ] ).getByText( 'Works, with changes' )
		).toBeInTheDocument();
		expect(
			within( items[ 1 ] ).getByText(
				'The natural voice is not in this version.'
			)
		).toBeInTheDocument();
		expect(
			within( items[ 2 ] ).getByText( 'Not possible' )
		).toBeInTheDocument();
		expect(
			within( items[ 2 ] ).getByText( 'Too old for your saved settings.' )
		).toBeInTheDocument();
	} );

	it( 'says so when there is no older version', async () => {
		fakeSite( { ...FREE, modes: { free: [] } } );
		renderWithApp( <SiteVersions /> );
		await ready();

		expect(
			screen.getByText( 'There is no older version to go back to.' )
		).toBeInTheDocument();
	} );

	it( 'says why the list could not be read, and can check again', async () => {
		const site = fakeSite( {
			...FREE,
			modes: { free: [] },
			errors: { free: 'WordPress.org could not be reached.' },
		} );
		const { container } = renderWithApp( <SiteVersions /> );
		await ready();

		expect(
			container.querySelector( '.components-notice.is-warning' )
		).toHaveTextContent( 'WordPress.org could not be reached.' );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Check again' } )
		);

		await waitFor( () => expect( site.gets ).toBe( 2 ) );
	} );

	describe( 'going back', () => {
		it( 'opens the classic Versions screen, where it is confirmed', async () => {
			const site = fakeSite();
			renderWithApp( <SiteVersions /> );
			await ready();

			expect(
				screen.getByRole( 'link', {
					name: 'Go back to an older version…',
				} )
			).toHaveAttribute(
				'href',
				'https://site.test/wp-admin/admin.php?page=text-to-audio&atlasvoice_ui=classic#/versions'
			);
			// Nothing on this screen replaces plugin files.
			expect( site.posts ).toHaveLength( 0 );
		} );

		it( 'is not offered to someone who may not update plugins, and says why', async () => {
			fakeSite( { ...FREE, can_roll_back: false } );
			renderWithApp( <SiteVersions /> );
			await ready();

			expect(
				screen.queryByRole( 'link', {
					name: 'Go back to an older version…',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.getByText( /your account may not update plugins/ )
			).toBeInTheDocument();
		} );

		it( 'is not offered on a Git or SVN checkout, and says why', async () => {
			fakeSite( {
				...FREE,
				installed: {
					free: { ...FREE.installed.free, checkout: true },
				},
			} );
			renderWithApp( <SiteVersions /> );
			await ready();

			expect(
				screen.queryByRole( 'link', {
					name: 'Go back to an older version…',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.getByText( /would delete the repository/ )
			).toBeInTheDocument();
		} );
	} );

	describe( 'automatic updates', () => {
		it( 'shows the switch of the plugin as the site has it', async () => {
			fakeSite();
			renderWithApp( <SiteVersions /> );
			await ready();

			expect(
				screen.getByRole( 'checkbox', {
					name: 'AtlasVoice updates itself',
				} )
			).not.toBeChecked();
		} );

		it( 'switches at once and says so', async () => {
			const site = fakeSite();
			const { context } = renderWithApp( <SiteVersions /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'checkbox', {
					name: 'AtlasVoice updates itself',
				} )
			);

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{
						url: 'https://site.test/wp-json/tta/v1/versions/auto-update',
						plugin: 'free',
						on: true,
					},
				] )
			);
			await waitFor( () =>
				expect(
					screen.getByRole( 'checkbox', {
						name: 'AtlasVoice updates itself',
					} )
				).toBeChecked()
			);
			expect( context.notify ).toHaveBeenCalledWith(
				'Automatic updates are on.'
			);
		} );

		it( 'stays as it was and says why when the site refuses', async () => {
			fakeSite( FREE, {
				failPost: {
					status: 403,
					message: 'You cannot change plugin updates on this site.',
				},
			} );
			const { context } = renderWithApp( <SiteVersions /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'checkbox', {
					name: 'AtlasVoice updates itself',
				} )
			);

			await waitFor( () =>
				expect( context.notify ).toHaveBeenCalledWith(
					'Not changed: You cannot change plugin updates on this site.',
					'error'
				)
			);
			expect(
				screen.getByRole( 'checkbox', {
					name: 'AtlasVoice updates itself',
				} )
			).not.toBeChecked();
		} );
	} );

	describe( 'with Pro', () => {
		it( 'names both plugins and has a switch for each', async () => {
			const site = fakeSite( PRO );
			renderWithApp( <SiteVersions />, { boot: { isPro: true } } );
			await ready();

			expect(
				screen.getAllByText(
					'You are on AtlasVoice 2.5.0, AtlasVoice Pro 3.6.0.'
				).length
			).toBeGreaterThan( 0 );
			expect(
				screen.getByRole( 'checkbox', {
					name: 'AtlasVoice Pro updates itself',
				} )
			).toBeChecked();

			fireEvent.click(
				screen.getByRole( 'checkbox', {
					name: 'AtlasVoice Pro updates itself',
				} )
			);

			await waitFor( () =>
				expect( site.posts[ 0 ] ).toMatchObject( {
					plugin: 'pro',
					on: false,
				} )
			);
		} );

		it( 'shows the list for both plugins first, and the other lists on choice', async () => {
			fakeSite( PRO );
			renderWithApp( <SiteVersions />, { boot: { isPro: true } } );
			await ready();

			expect(
				screen.getByRole( 'radio', {
					name: 'Both plugins together (recommended)',
				} )
			).toBeChecked();
			expect(
				screen.getByText( 'AtlasVoice 2.4.0 + Pro 3.5.0' )
			).toBeInTheDocument();

			fireEvent.click(
				screen.getByRole( 'radio', { name: 'Only AtlasVoice Pro' } )
			);

			expect(
				screen.getByText( 'AtlasVoice Pro 3.5.0' )
			).toBeInTheDocument();
			expect(
				screen.queryByText( 'AtlasVoice 2.4.0 + Pro 3.5.0' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'shows no choice of list on a site with the free plugin only', async () => {
		fakeSite();
		const { container } = renderWithApp( <SiteVersions /> );
		await ready();

		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
		expect(
			container.querySelectorAll( '.atlasvoice-pronote, .atlasvoice-pro' )
		).toHaveLength( 0 );
	} );

	it( 'offers to try again when the versions cannot be loaded', async () => {
		const site = fakeSite( FREE, {
			failGet: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <SiteVersions /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await ready() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'survives an answer without plugins or lists', async () => {
		fakeSite( { can_roll_back: false } );
		renderWithApp( <SiteVersions /> );

		expect( await ready() ).toBeInTheDocument();
		expect(
			screen.getByText( 'There is no older version to go back to.' )
		).toBeInTheDocument();
	} );

	it( 'has no accessibility violations with and without Pro', async () => {
		fakeSite();
		const free = renderWithApp( <SiteVersions /> );
		await ready();
		expect( await axe( free.container ) ).toHaveNoViolations();
		free.unmount();

		fakeSite( PRO );
		const pro = renderWithApp( <SiteVersions />, {
			boot: { isPro: true },
		} );
		await ready();
		expect( await axe( pro.container ) ).toHaveNoViolations();
	} );
} );
