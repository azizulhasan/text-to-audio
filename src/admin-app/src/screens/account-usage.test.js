import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import {
	engineName,
	formatDay,
	formatNumber,
	licenceEndedText,
	usageLine,
	usageTone,
	usedPercent,
} from './account-format';
import AccountUsage from './AccountUsage';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const KEY = 'av_live_secret_key_value_0123456789';

/** The account as the site's route returns it for a connected Free site. */
const ACCOUNT = {
	connected: true,
	source: 'service',
	fetched_at: 1794560000,
	error: '',
	request_id: 'req-0123456789',
	project: {
		id: 37,
		platform: 'wordpress',
		domain: 'example.com',
		status: 'active',
		approval: 'approved',
	},
	plan: { slug: 'free', name: 'Free' },
	engines: [ 'gtts' ],
	usage: {
		chars_used: 1200,
		chars_limit: 100000,
		chars_remaining: 98800,
		resets_at: '2026-12-01T00:00:00Z',
	},
	limits: {
		requests_per_minute: 60,
		max_chars_per_request: 5000,
		daily_chars: null,
	},
	license: { attached: false, expires_at: '', checked_at: '', ended: null },
	links: {
		dashboard: 'https://app.atlasvoice.cloud/projects/37',
		upgrade: '',
	},
	connection: { email: 'owner@example.org', key_prefix: 'av_live_secr' },
};

const NOT_CONNECTED = {
	...ACCOUNT,
	connected: false,
	source: 'none',
	connection: { email: '', key_prefix: '' },
};

/**
 * A stand-in for the site's account route.
 *
 * @param {Object|Function} answer The account, or a function of the call number that returns
 *                                 { body, ok, status }.
 * @return {Object} { calls } with the addresses that were asked.
 */
function fakeSite( answer = ACCOUNT ) {
	const site = { calls: [] };

	window.fetch = jest.fn( ( url, options = {} ) => {
		site.calls.push( { url, method: options.method || 'GET' } );
		const reply =
			typeof answer === 'function'
				? answer( site.calls.length )
				: { body: answer };

		return Promise.resolve( {
			ok: reply.ok !== false,
			status: reply.status || 200,
			json: async () => reply.body,
		} );
	} );

	return site;
}

const account = ( changes ) => ( { ...ACCOUNT, ...changes } );

afterEach( () => {
	delete window.fetch;
} );

describe( 'Account numbers and words', () => {
	it.each( [
		[ { chars_used: 0, chars_limit: 100000 }, 0 ],
		[ { chars_used: 1200, chars_limit: 100000 }, 1 ],
		[ { chars_used: 80000, chars_limit: 100000 }, 80 ],
		[ { chars_used: 100000, chars_limit: 100000 }, 100 ],
		[ { chars_used: 140000, chars_limit: 100000 }, 100 ],
		[ { chars_used: 500, chars_limit: null }, null ],
		[ { chars_used: null, chars_limit: 100000 }, null ],
		[ { chars_used: 500, chars_limit: 0 }, null ],
		[ undefined, null ],
	] )( 'works out the share used for %j', ( usage, expected ) => {
		expect( usedPercent( usage ) ).toBe( expected );
	} );

	it.each( [
		[ null, 'ok' ],
		[ 0, 'ok' ],
		[ 79, 'ok' ],
		[ 80, 'warn' ],
		[ 99, 'warn' ],
		[ 100, 'err' ],
	] )( 'warns from 80%% and is red at 100%% (%s)', ( percent, tone ) => {
		expect( usageTone( percent ) ).toBe( tone );
	} );

	it( 'groups digits and shows a dash for an unknown number', () => {
		expect( formatNumber( 98800 ) ).toBe( ( 98800 ).toLocaleString() );
		expect( formatNumber( null ) ).toBe( '–' );
		expect( formatNumber( undefined ) ).toBe( '–' );
	} );

	it( 'shows the reset day and no words for something that is not a date', () => {
		expect( formatDay( '2026-12-01T00:00:00Z' ) ).toMatch( /1/ );
		expect( formatDay( '2026-12-01T00:00:00Z' ) ).toMatch( /Dec/i );
		expect( formatDay( '' ) ).toBe( '' );
		expect( formatDay( 'soon' ) ).toBe( '' );
		expect( formatDay( undefined ) ).toBe( '' );
	} );

	it( 'names the engines in words and keeps an unknown one as it is', () => {
		expect( engineName( 'gtts' ) ).toBe( 'Natural voice' );
		expect( engineName( 'cloud' ) ).toBe( 'Studio voices' );
		expect( engineName( 'kokoro' ) ).toBe( 'kokoro' );
		expect( engineName( 'constructor' ) ).toBe( 'constructor' );
	} );

	it.each( [
		'expired',
		'cancelled',
		'not_active_on_site',
		'no_free_site',
		'something_new',
	] )( 'says why a licence ended (%s)', ( reason ) => {
		expect( licenceEndedText( reason ) ).toMatch( /free allowance/ );
	} );

	it( 'says nothing under the meter below 80%, then warns, then explains', () => {
		expect( usageLine( null, '1 December' ) ).toBe( '' );
		expect( usageLine( 79, '1 December' ) ).toBe( '' );
		expect( usageLine( 85, '1 December' ) ).toMatch( /^85%/ );
		expect( usageLine( 100, '1 December' ) ).toMatch(
			/device voice until 1 December/
		);
		expect( usageLine( 100, '' ) ).toMatch( /until the allowance resets/ );
	} );
} );

describe( 'Account & plans › Usage', () => {
	it( 'is the screen of the account:usage route', () => {
		expect( getScreenComponent( 'account:usage' ) ).toBeTruthy();
	} );

	it( 'reads the account from the site and changes nothing', async () => {
		const site = fakeSite();
		renderWithApp( <AccountUsage /> );

		await screen.findByText( /characters used/ );

		expect( site.calls ).toEqual( [
			{
				url: 'https://site.test/wp-json/tta/v1/cloud/account',
				method: 'GET',
			},
		] );
	} );

	it( 'shows a loading line first', async () => {
		fakeSite();
		renderWithApp( <AccountUsage /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Loading' );
		await screen.findByText( /characters used/ );
	} );

	it( 'shows the plan, the usage and when it resets', async () => {
		fakeSite();
		renderWithApp( <AccountUsage /> );

		expect(
			await screen.findByText(
				`${ ( 1200 ).toLocaleString() } of ${ ( 100000 ).toLocaleString() } characters used`
			)
		).toBeInTheDocument();
		expect( screen.getByText( 'Free' ) ).toBeInTheDocument();
		expect(
			screen.getByText( ( 98800 ).toLocaleString() )
		).toBeInTheDocument();
		expect( screen.getByText( 'Natural voice' ) ).toBeInTheDocument();

		const meter = screen.getByRole( 'progressbar' );
		expect( meter ).toHaveAttribute( 'value', '1' );
		expect( meter ).toHaveAccessibleName(
			'1% of this month’s characters used'
		);
		expect( meter ).toHaveClass( 'is-ok' );
	} );

	it( 'shows how the site is connected, with only the start of the key', async () => {
		fakeSite( account( { leaked: KEY } ) );
		const { container } = renderWithApp( <AccountUsage /> );

		expect(
			await screen.findByText( 'owner@example.org' )
		).toBeInTheDocument();
		expect( screen.getByText( 'av_live_secr…' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Connected' ) ).toBeInTheDocument();
		expect( container ).not.toHaveTextContent( KEY );
	} );

	it( 'links to the AtlasVoice dashboard in a new tab', async () => {
		fakeSite();
		renderWithApp( <AccountUsage /> );

		const link = await screen.findByRole( 'link', {
			name: /Open my AtlasVoice dashboard/,
		} );
		expect( link ).toHaveAttribute(
			'href',
			'https://app.atlasvoice.cloud/projects/37'
		);
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link.getAttribute( 'rel' ) ).toMatch( /noopener|noreferrer/ );
	} );

	it( 'shows no dashboard link when the site kept none', async () => {
		fakeSite( account( { links: { dashboard: '', upgrade: '' } } ) );
		renderWithApp( <AccountUsage /> );

		await screen.findByText( 'Connected' );
		expect(
			screen.queryByRole( 'link', { name: /dashboard/ } )
		).not.toBeInTheDocument();
	} );

	it( 'warns from 80% of the allowance', async () => {
		fakeSite(
			account( {
				usage: {
					...ACCOUNT.usage,
					chars_used: 85000,
					chars_remaining: 15000,
				},
			} )
		);
		renderWithApp( <AccountUsage /> );

		expect(
			await screen.findByText(
				'85% of this month’s characters are used.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'progressbar' ) ).toHaveClass( 'is-warn' );
	} );

	it( 'says what happens when the allowance is used up', async () => {
		fakeSite(
			account( {
				usage: {
					...ACCOUNT.usage,
					chars_used: 100000,
					chars_remaining: 0,
				},
			} )
		);
		renderWithApp( <AccountUsage /> );

		expect(
			await screen.findByText( /This month’s characters are used/ )
		).toBeInTheDocument();
		expect( screen.getByRole( 'progressbar' ) ).toHaveClass( 'is-err' );
	} );

	it( 'shows a plan without a limit without a meter or a run-out section', async () => {
		fakeSite(
			account( {
				plan: { slug: 'premium', name: 'Premium' },
				engines: [ 'gtts', 'cloud' ],
				usage: {
					chars_used: 12400,
					chars_limit: null,
					chars_remaining: null,
					resets_at: '',
				},
			} )
		);
		renderWithApp( <AccountUsage />, { boot: { isPro: true } } );

		expect(
			await screen.findByText( /This plan has no monthly limit/ )
		).toBeInTheDocument();
		expect( screen.getByText( 'Premium' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Natural voice, Studio voices' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'When the month’s characters run out' )
		).not.toBeInTheDocument();
	} );

	it( 'says so when the numbers are the ones the site last stored', async () => {
		fakeSite(
			account( {
				source: 'stored',
				error: 'service_unreachable',
				request_id: 'req-abc',
			} )
		);
		renderWithApp( <AccountUsage /> );

		expect(
			await screen.findByText( /did not answer just now/ )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Reference for support: req-abc' )
		).toBeInTheDocument();
	} );

	it( 'says when the site is waiting for approval', async () => {
		fakeSite(
			account( { project: { ...ACCOUNT.project, approval: 'pending' } } )
		);
		renderWithApp( <AccountUsage /> );

		expect(
			await screen.findByText( /waiting for approval\. The email/ )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Waiting for approval' )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Connected' ) ).not.toBeInTheDocument();
	} );

	it( 'says why a licence stopped giving Premium', async () => {
		fakeSite(
			account( {
				license: {
					...ACCOUNT.license,
					ended: { reason: 'expired', at: '2026-11-01T00:00:00Z' },
				},
			} )
		);
		renderWithApp( <AccountUsage /> );

		expect(
			await screen.findByText( /Your Pro licence has expired/ )
		).toBeInTheDocument();
	} );

	it( 'asks the service again on "Check again"', async () => {
		const site = fakeSite();
		renderWithApp( <AccountUsage /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Check again' } )
		);
		await act( async () => {} );

		expect( site.calls ).toHaveLength( 2 );
		expect( site.calls[ 1 ].url ).toBe(
			'https://site.test/wp-json/tta/v1/cloud/account?refresh=true'
		);
		expect( site.calls[ 1 ].method ).toBe( 'GET' );
	} );

	it( 'keeps the numbers on screen when a second check fails', async () => {
		fakeSite( ( call ) =>
			call === 1
				? { body: ACCOUNT }
				: {
						body: { message: 'Cookie check failed' },
						ok: false,
						status: 403,
				  }
		);
		renderWithApp( <AccountUsage /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Check again' } )
		);

		expect(
			await screen.findByText(
				'The account could not be checked again: Cookie check failed'
			)
		).toBeInTheDocument();
		expect( screen.getByText( 'owner@example.org' ) ).toBeInTheDocument();
	} );

	it( 'offers to try again when the account cannot be loaded', async () => {
		const site = fakeSite( ( call ) =>
			call === 1
				? {
						body: { message: 'Sorry, you are not allowed.' },
						ok: false,
						status: 403,
				  }
				: { body: ACCOUNT }
		);
		renderWithApp( <AccountUsage /> );

		// The notice is also announced to screen readers, so the words are
		// on the page twice: once to read and once to hear.
		expect(
			(
				await screen.findAllByText(
					'The account could not be loaded: Sorry, you are not allowed.'
				)
			).length
		).toBeGreaterThan( 0 );

		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect(
			await screen.findByText( 'owner@example.org' )
		).toBeInTheDocument();
		expect( site.calls ).toHaveLength( 2 );
	} );

	it( 'sends a site that is not connected to Voice', async () => {
		fakeSite( NOT_CONNECTED );
		const { context } = renderWithApp( <AccountUsage /> );

		expect(
			await screen.findByText( 'No AtlasVoice account connected yet' )
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Connect the natural voice' } )
		);

		expect( context.go ).toHaveBeenCalledWith( 'voice' );
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	} );

	describe( 'the way to Pro (wp.org guideline 5)', () => {
		it( 'shows one "See plans" button in Free, and it opens the Plans tab', async () => {
			fakeSite();
			const { context } = renderWithApp( <AccountUsage /> );

			await screen.findByText( 'Need more?' );
			const buttons = screen.getAllByRole( 'button', {
				name: 'See plans',
			} );
			expect( buttons ).toHaveLength( 1 );
			expect( buttons[ 0 ] ).not.toHaveClass( 'is-primary' );

			fireEvent.click( buttons[ 0 ] );
			expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
		} );

		it( 'has no Pro form and no disabled control in Free', async () => {
			fakeSite();
			const { container } = renderWithApp( <AccountUsage /> );
			await screen.findByText( 'Need more?' );

			expect(
				container.querySelectorAll(
					'input, select, textarea, [disabled], [aria-disabled="true"]'
				)
			).toHaveLength( 0 );
		} );

		it( 'shows no upgrade prompt when Pro is installed', async () => {
			fakeSite();
			renderWithApp( <AccountUsage />, { boot: { isPro: true } } );

			await screen.findByText( 'Connected' );
			expect(
				screen.queryByText( 'Need more?' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'See plans' } )
			).not.toBeInTheDocument();
		} );

		it( 'lets Pro add its own card through the slot, with the account', async () => {
			const fill = ( { account: given } ) => (
				<p>Licence card for plan { given.plan.slug }</p>
			);
			const add = ( fills ) => [ ...fills, fill ];
			addFilter( 'atlasvoice.slot.account.usage', 'test/pro', add );

			fakeSite();
			renderWithApp( <AccountUsage />, { boot: { isPro: true } } );

			expect(
				await screen.findByText( 'Licence card for plan free' )
			).toBeInTheDocument();

			cleanup();
			removeFilter( 'atlasvoice.slot.account.usage', 'test/pro' );
		} );
	} );

	it( 'has no accessibility violations in any state', async () => {
		fakeSite();
		const connected = renderWithApp( <AccountUsage /> );
		await screen.findByText( 'Connected' );
		expect( await axe( connected.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite(
			account( {
				source: 'stored',
				usage: {
					...ACCOUNT.usage,
					chars_used: 100000,
					chars_remaining: 0,
				},
			} )
		);
		const warned = renderWithApp( <AccountUsage /> );
		await screen.findByText( /did not answer just now/ );
		expect( await axe( warned.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite( NOT_CONNECTED );
		const empty = renderWithApp( <AccountUsage /> );
		await screen.findByText( 'No AtlasVoice account connected yet' );
		expect( await axe( empty.container ) ).toHaveNoViolations();
	} );
} );
