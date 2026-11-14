import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { getScreenComponent } from './registry';
import SiteHealth, { statusWords } from './SiteHealth';

expect.extend( toHaveNoViolations );

const check = ( id, title, status, detail, route = '' ) => ( {
	id,
	title,
	status,
	detail,
	route,
} );

const PLUGINS = [
	{
		name: 'WP Rocket',
		active: true,
		detail: 'AtlasVoice scripts are kept out of its minify, defer and delay.',
	},
	{ name: 'Autoptimize', active: false, detail: 'Not active on this site.' },
];

/** A live site where everything is fine (TTA\Site\Health). */
const HEALTHY = {
	checked_at: 1794600000,
	needs_attention: 0,
	checks: [
		check(
			'mode',
			'Staging or live',
			'ok',
			'Live: visitors can hear the audio.',
			'overview'
		),
		check( 'voice', 'Voice', 'ok', 'In use: Default.', 'voice:voice' ),
		check(
			'placement',
			'Where the player appears',
			'info',
			'The player is not added automatically.',
			'content:where'
		),
		check(
			'cdn',
			'Scripts on a CDN',
			'ok',
			'No visitor’s browser reported a blocked script.'
		),
	],
	plugins: PLUGINS,
};

/** A site in staging whose CDN blocks a script. */
const TROUBLED = {
	...HEALTHY,
	needs_attention: 2,
	checks: [
		check(
			'mode',
			'Staging or live',
			'warn',
			'Staging: only administrators see the player.',
			'overview'
		),
		check( 'voice', 'Voice', 'ok', 'In use: Default.', 'voice:voice' ),
		check(
			'cdn',
			'Scripts on a CDN',
			'error',
			'A visitor’s browser blocked an AtlasVoice script served from cdn.example.com.'
		),
	],
};

/**
 * A stand-in for the site: the health route and the cdn-fixed route.
 *
 * @param {Object} start            What the site answers first.
 * @param {Object} options
 * @param {Object} options.next     What it answers from the second check on.
 * @param {Object} options.failGet  { status, message } to refuse the first check.
 * @param {Object} options.failPost { status, message } to refuse cdn-fixed.
 * @return {Object} { gets, posts }.
 */
function fakeSite( start = HEALTHY, { next, failGet, failPost } = {} ) {
	const site = { gets: 0, posts: [] };
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
			site.posts.push( url );

			return reply( next || HEALTHY );
		}

		site.gets++;
		if ( failGet && site.gets === 1 ) {
			return reply( { message: failGet.message }, false, failGet.status );
		}

		return reply( site.gets > 1 && next ? next : start );
	} );

	return site;
}

const ready = () =>
	screen.findByRole( 'heading', { name: 'Everything we check' } );
const section = ( name ) =>
	screen.getByRole( 'heading', { name } ).closest( 'section' );

afterEach( () => {
	delete window.fetch;
} );

describe( 'the words for a status', () => {
	it( 'has a word and a colour for each', () => {
		expect( statusWords( 'ok' ) ).toEqual( { tone: 'ok', label: 'Fine' } );
		expect( statusWords( 'info' ).tone ).toBe( 'info' );
		expect( statusWords( 'warn' ).tone ).toBe( 'warn' );
		expect( statusWords( 'error' ) ).toEqual( {
			tone: 'err',
			label: 'Problem',
		} );
	} );

	it( 'never shows a status it does not know as fine', () => {
		expect( statusWords( 'perfect' ).tone ).toBe( 'warn' );
		expect( statusWords( undefined ).label ).toBe( 'Check this' );
	} );
} );

describe( 'Site health › Health', () => {
	it( 'is the screen of the site:health route', () => {
		expect( getScreenComponent( 'site:health' ) ).toBeTruthy();
	} );

	it( 'only reads when it opens', async () => {
		const site = fakeSite();
		renderWithApp( <SiteHealth /> );
		await ready();

		expect( site.gets ).toBe( 1 );
		expect( site.posts ).toHaveLength( 0 );
	} );

	it( 'says nothing needs you on a healthy site', async () => {
		fakeSite();
		renderWithApp( <SiteHealth /> );
		await ready();

		expect(
			screen.getByRole( 'heading', { name: 'Nothing needs you' } )
		).toBeInTheDocument();
		expect(
			within( section( 'Nothing needs you' ) ).queryAllByRole(
				'listitem'
			)
		).toHaveLength( 0 );
	} );

	it( 'does not count something that is only good to know as a problem', async () => {
		fakeSite();
		renderWithApp( <SiteHealth /> );
		await ready();

		// It is in the full list, with its own word, and not among the things that need the owner.
		expect(
			within( section( 'Everything we check' ) ).getByText(
				'Good to know'
			)
		).toBeInTheDocument();
	} );

	it( 'lists every check with its status and its sentence', async () => {
		fakeSite();
		renderWithApp( <SiteHealth /> );
		await ready();

		const items = within( section( 'Everything we check' ) ).getAllByRole(
			'listitem'
		);
		expect( items ).toHaveLength( 4 );
		expect(
			within( items[ 0 ] ).getByText(
				'Live: visitors can hear the audio.'
			)
		).toBeInTheDocument();
		expect( within( items[ 0 ] ).getByText( 'Fine' ) ).toBeInTheDocument();
		// The full list is for reading: the way to fix something is in the first list.
		expect(
			within( section( 'Everything we check' ) ).queryByRole( 'button' )
		).not.toBeInTheDocument();
	} );

	describe( 'on a site with problems', () => {
		it( 'puts warnings and problems first, each with a way on', async () => {
			fakeSite( TROUBLED );
			const { context } = renderWithApp( <SiteHealth /> );
			await ready();

			const items = within(
				section( 'Things that need you' )
			).getAllByRole( 'listitem' );
			expect( items ).toHaveLength( 2 );
			expect(
				within( items[ 0 ] ).getByText( 'Check this' )
			).toBeInTheDocument();
			expect(
				within( items[ 1 ] ).getByText( 'Problem' )
			).toBeInTheDocument();

			fireEvent.click(
				within( items[ 0 ] ).getByRole( 'button', { name: 'Open' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'overview' );
		} );

		it( 'forgets a blocked-script report after the owner fixed the CDN', async () => {
			const site = fakeSite( TROUBLED, { next: HEALTHY } );
			const { context } = renderWithApp( <SiteHealth /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'button', {
					name: 'I fixed it, check again',
				} )
			);

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					'https://site.test/wp-json/tta/v1/health/cdn-fixed',
				] )
			);
			expect(
				await screen.findByRole( 'heading', {
					name: 'Nothing needs you',
				} )
			).toBeInTheDocument();
			expect( context.notify ).toHaveBeenCalledWith(
				'Noted. If a visitor still meets the problem, it shows here again.'
			);
		} );

		it( 'says why when the site refuses to forget it', async () => {
			fakeSite( TROUBLED, {
				failPost: { status: 403, message: 'Not allowed.' },
			} );
			const { context } = renderWithApp( <SiteHealth /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'button', {
					name: 'I fixed it, check again',
				} )
			);

			await waitFor( () =>
				expect( context.notify ).toHaveBeenCalledWith(
					'Not changed: Not allowed.',
					'error'
				)
			);
			expect(
				screen.getByRole( 'heading', { name: 'Things that need you' } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Check again', () => {
		it( 'checks again and says how many things need you', async () => {
			const site = fakeSite( HEALTHY, { next: TROUBLED } );
			const { context } = renderWithApp( <SiteHealth /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Check again' } )
			);

			expect(
				await screen.findByRole( 'heading', {
					name: 'Things that need you',
				} )
			).toBeInTheDocument();
			expect( site.gets ).toBe( 2 );
			expect( context.notify ).toHaveBeenCalledWith(
				'Checked: 2 things need you.'
			);
		} );

		it( 'says so when nothing needs you', async () => {
			fakeSite();
			const { context } = renderWithApp( <SiteHealth /> );
			await ready();

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Check again' } )
			);

			await waitFor( () =>
				expect( context.notify ).toHaveBeenCalledWith(
					'Checked: nothing needs you.'
				)
			);
		} );

		it( 'says nothing when the screen only opens', async () => {
			fakeSite( TROUBLED );
			const { context } = renderWithApp( <SiteHealth /> );
			await ready();

			expect( context.notify ).not.toHaveBeenCalled();
		} );
	} );

	it( 'lists the caching plugins and whether each is active', async () => {
		fakeSite();
		renderWithApp( <SiteHealth /> );
		await ready();

		const rows = within( screen.getByRole( 'table' ) ).getAllByRole(
			'row'
		);
		expect( rows ).toHaveLength( 3 );
		expect( within( rows[ 1 ] ).getByText( 'Works' ) ).toBeInTheDocument();
		expect(
			within( rows[ 2 ] ).getByText( 'Not active' )
		).toBeInTheDocument();
	} );

	it( 'has nothing about buying Pro and no disabled control', async () => {
		fakeSite( TROUBLED );
		const { container } = renderWithApp( <SiteHealth /> );
		await ready();

		expect(
			container.querySelectorAll(
				'.atlasvoice-pronote, .atlasvoice-pro, [disabled], [aria-disabled="true"]'
			)
		).toHaveLength( 0 );
	} );

	it( 'offers to try again when the checks cannot be run', async () => {
		const site = fakeSite( HEALTHY, {
			failGet: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <SiteHealth /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await ready() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'survives an answer without checks or plugins', async () => {
		fakeSite( { needs_attention: 0 } );
		renderWithApp( <SiteHealth /> );

		expect( await ready() ).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { name: 'Nothing needs you' } )
		).toBeInTheDocument();
	} );

	it( 'has no accessibility violations, healthy and with problems', async () => {
		fakeSite();
		const healthy = renderWithApp( <SiteHealth /> );
		await ready();
		expect( await axe( healthy.container ) ).toHaveNoViolations();
		healthy.unmount();

		fakeSite( TROUBLED );
		const troubled = renderWithApp( <SiteHealth /> );
		await ready();
		expect( await axe( troubled.container ) ).toHaveNoViolations();
	} );
} );
