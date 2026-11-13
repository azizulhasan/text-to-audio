import '@testing-library/jest-dom';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import AccountPlans from './AccountPlans';
import {
	formatPrice,
	getComparison,
	getProFeatures,
	safePlanLink,
	tierName,
} from './plans-data';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const CHECKOUT =
	'https://checkout.freemius.com/plugin/13388/plan/22449/licenses/';
const tier = ( sites, yearly, lifetime, popular = false ) => ( {
	id: String( sites ),
	sites,
	yearly,
	lifetime,
	popular,
	checkout: {
		yearly: CHECKOUT + sites + '/',
		lifetime: CHECKOUT + sites + '/?billing_cycle=lifetime',
	},
} );

/** The plans as the site's route returns them. */
const PLANS = {
	currency: 'USD',
	refund_days: 14,
	tiers: [
		tier( 1, 59, 199 ),
		tier( 5, 149, 249, true ),
		tier( 10, 199, 299 ),
	],
	links: {
		pricing:
			'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/?utm_source=text-to-audio&utm_medium=plugin_admin&utm_campaign=free_to_pro&utm_content=plans_tab',
		demo: 'https://atlasaidev.com/plugins/text-to-speech-pro/demo/?utm_content=plans_tab',
		refund: 'https://atlasaidev.com/refund-policy/',
	},
};

/**
 * A stand-in for the site's plans route.
 *
 * @param {Object|Function} answer The plans, or a function of the call number that returns
 *                                 { body, ok, status }.
 * @return {Object} { calls }.
 */
function fakeSite( answer = PLANS ) {
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

afterEach( () => {
	delete window.fetch;
} );

describe( 'The words and numbers of the Plans tab', () => {
	it( 'names a plan by its number of sites', () => {
		expect( tierName( 1 ) ).toBe( '1 site' );
		expect( tierName( 5 ) ).toBe( '5 sites' );
	} );

	it( 'writes a price in dollars', () => {
		expect( formatPrice( 59 ) ).toBe( '$59' );
		expect( formatPrice( 1299 ) ).toBe( '$1,299' );
	} );

	it.each( [
		[ 'https://atlasaidev.com/pricing/', true ],
		[ 'https://www.atlasaidev.com/pricing/', true ],
		[ CHECKOUT + '5/', true ],
		[ 'http://atlasaidev.com/pricing/', false ],
		[ 'https://atlasaidev.com.evil.example/', false ],
		[ 'https://evilatlasaidev.com/', false ],
		[ 'https://atlasaidev.com@evil.example/', false ],
		// eslint-disable-next-line no-script-url
		[ 'javascript:alert(1)', false ],
		[ '/wp-admin/', false ],
		[ '', false ],
		[ undefined, false ],
	] )( 'opens only our own https addresses (%s)', ( url, allowed ) => {
		expect( safePlanLink( url ) !== '' ).toBe( allowed );
	} );

	it( 'compares Free and Pro without promising what Free does not do', () => {
		const rows = getComparison();

		expect( rows.length ).toBeGreaterThan( 8 );
		for ( const row of rows ) {
			expect( row ).toHaveLength( 3 );
			expect( row.every( ( cell ) => cell !== '' ) ).toBe( true );
		}
		// Your own provider keys are free in both (owner's decision, 2026-10-26).
		const own = rows.find( ( row ) => /own Google/.test( row[ 0 ] ) );
		expect( own.slice( 1 ) ).toEqual( [ 'Yes', 'Yes' ] );
	} );

	it( 'states no count of voices or languages that could go out of date', () => {
		const words = JSON.stringify( [ getComparison(), getProFeatures() ] );

		expect( words ).not.toMatch(
			/\d+\s*\+?\s*(studio )?(voices|languages)/i
		);
	} );
} );

describe( 'Account & plans › Plans', () => {
	it( 'is the screen of the account:plans route', () => {
		expect( getScreenComponent( 'account:plans' ) ).toBeTruthy();
	} );

	it( 'reads the plans from the site and changes nothing', async () => {
		const site = fakeSite();
		renderWithApp( <AccountPlans /> );

		await screen.findByRole( 'heading', { name: '5 sites' } );

		expect( site.calls ).toEqual( [
			{ url: 'https://site.test/wp-json/tta/v1/plans', method: 'GET' },
		] );
	} );

	it( 'shows the three plans with their yearly prices first', async () => {
		fakeSite();
		renderWithApp( <AccountPlans /> );

		await screen.findByRole( 'heading', { name: '1 site' } );

		expect( screen.getByText( '$59' ) ).toBeInTheDocument();
		expect( screen.getByText( '$149' ) ).toBeInTheDocument();
		expect( screen.getByText( '$199' ) ).toBeInTheDocument();
		expect( screen.getAllByText( '/ year' ) ).toHaveLength( 3 );
		expect( screen.getByText( 'Most popular' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Yearly' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );

	it( 'switches every price and every link to lifetime', async () => {
		fakeSite();
		renderWithApp( <AccountPlans /> );
		await screen.findByRole( 'heading', { name: '1 site' } );

		fireEvent.click( screen.getByRole( 'button', { name: 'Lifetime' } ) );

		expect( screen.getByText( '$249' ) ).toBeInTheDocument();
		expect( screen.getByText( '$299' ) ).toBeInTheDocument();
		expect( screen.getAllByText( 'once' ) ).toHaveLength( 3 );
		expect( screen.queryByText( '/ year' ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: /Choose 5 sites/ } )
		).toHaveAttribute( 'href', CHECKOUT + '5/?billing_cycle=lifetime' );
		expect(
			screen.getByRole( 'button', { name: 'Lifetime' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );

	it( 'opens the checkout of each plan in a new tab, safely', async () => {
		fakeSite();
		renderWithApp( <AccountPlans /> );
		await screen.findByRole( 'heading', { name: '1 site' } );

		for ( const sites of [ 1, 5, 10 ] ) {
			const link = screen.getByRole( 'link', {
				name: new RegExp(
					`Choose ${ sites } sites?.*opens the checkout in a new tab`
				),
			} );
			expect( link ).toHaveAttribute( 'href', CHECKOUT + sites + '/' );
			expect( link ).toHaveAttribute( 'target', '_blank' );
			expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		}
	} );

	it( 'has one primary button: the most popular plan', async () => {
		fakeSite();
		const { container } = renderWithApp( <AccountPlans /> );
		await screen.findByRole( 'heading', { name: '1 site' } );

		const primary = container.querySelectorAll( '.is-primary' );
		expect( primary ).toHaveLength( 1 );
		expect( primary[ 0 ] ).toHaveTextContent( 'Choose 5 sites' );
	} );

	it( 'compares Free and Pro in a table with row and column headers', async () => {
		fakeSite();
		renderWithApp( <AccountPlans /> );

		const table = await screen.findByRole( 'table', {
			name: 'Free and Pro compared',
		} );
		expect(
			within( table ).getByRole( 'columnheader', { name: 'Free' } )
		).toBeInTheDocument();
		expect(
			within( table ).getByRole( 'columnheader', { name: 'Pro' } )
		).toBeInTheDocument();
		expect(
			within( table ).getByRole( 'rowheader', {
				name: 'Natural voice (MP3)',
			} )
		).toBeInTheDocument();
		expect( within( table ).getAllByRole( 'row' ) ).toHaveLength(
			getComparison().length + 1
		);
	} );

	it( 'states the guarantee and who bills the provider voices', async () => {
		fakeSite();
		renderWithApp( <AccountPlans /> );

		expect(
			await screen.findByText(
				/14-day money-back guarantee; conditions apply\..*billed by that provider/
			)
		).toBeInTheDocument();
	} );

	it( 'links to the full comparison, the demo and the refund policy', async () => {
		fakeSite();
		renderWithApp( <AccountPlans /> );
		await screen.findByRole( 'heading', { name: '1 site' } );

		expect(
			screen.getByRole( 'link', { name: /Compare Free and Pro in full/ } )
		).toHaveAttribute( 'href', PLANS.links.pricing );
		expect(
			screen.getByRole( 'link', { name: /Hear the Pro voices/ } )
		).toHaveAttribute( 'href', PLANS.links.demo );
		expect(
			screen.getByRole( 'link', { name: /Refund policy/ } )
		).toHaveAttribute( 'href', PLANS.links.refund );
	} );

	it( 'never renders an address that is not ours', async () => {
		fakeSite( {
			...PLANS,
			tiers: [
				{
					...tier( 1, 59, 199 ),
					checkout: {
						yearly: 'https://evil.example/pay',
						// eslint-disable-next-line no-script-url
						lifetime: 'javascript:alert(1)',
					},
				},
			],
			links: {
				pricing: 'https://evil.example/pricing',
				demo: 'http://atlasaidev.com/demo',
				refund: PLANS.links.refund,
			},
		} );
		const { container } = renderWithApp( <AccountPlans /> );
		await screen.findByRole( 'heading', { name: '1 site' } );

		const hrefs = Array.from( container.querySelectorAll( 'a' ) ).map(
			( a ) => a.getAttribute( 'href' )
		);
		expect( hrefs ).toEqual( [ PLANS.links.refund ] );
		expect( screen.getByText( '$59' ) ).toBeInTheDocument();
	} );

	it( 'is made of links and text only: no form, nothing disabled (wp.org guideline 5)', async () => {
		fakeSite();
		const { container } = renderWithApp( <AccountPlans /> );
		await screen.findByRole( 'heading', { name: '1 site' } );

		expect(
			container.querySelectorAll(
				'form, input, select, textarea, [disabled], [aria-disabled="true"]'
			)
		).toHaveLength( 0 );
	} );

	it( 'still shows what Pro adds when the prices cannot be loaded, and can try again', async () => {
		const site = fakeSite( ( call ) =>
			call === 1
				? { body: { message: 'Bad gateway' }, ok: false, status: 502 }
				: { body: PLANS }
		);
		renderWithApp( <AccountPlans /> );

		await screen.findByRole( 'button', { name: 'Try again' } );
		expect( screen.getByText( 'Studio voices' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'table', { name: 'Free and Pro compared' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: '5 sites' } )
		).not.toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect(
			await screen.findByRole( 'heading', { name: '5 sites' } )
		).toBeInTheDocument();
		expect( site.calls ).toHaveLength( 2 );
	} );

	it( 'survives an answer without plans', async () => {
		fakeSite( { tiers: 'none', links: null } );
		renderWithApp( <AccountPlans /> );

		expect(
			await screen.findByText( 'Studio voices' )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Plans' ) ).not.toBeInTheDocument();
	} );

	describe( 'when Pro is installed', () => {
		it( 'says so and shows no price and no "Choose" button', async () => {
			fakeSite();
			renderWithApp( <AccountPlans />, { boot: { isPro: true } } );

			expect(
				await screen.findByText(
					'AtlasVoice Pro is installed on this site.'
				)
			).toBeInTheDocument();
			expect(
				screen.getByText( 'What AtlasVoice Pro includes' )
			).toBeInTheDocument();
			await screen.findByRole( 'link', {
				name: /See all plans and add sites/,
			} );
			expect( screen.queryByText( '$149' ) ).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'link', { name: /Choose/ } )
			).not.toBeInTheDocument();
		} );

		it( 'lets Pro add its licence summary through the slot', async () => {
			const fill = ( { plans } ) => (
				<p>Licence summary, { plans ? plans.tiers.length : 0 } plans</p>
			);
			const add = ( fills ) => [ ...fills, fill ];
			addFilter( 'atlasvoice.slot.account.plans', 'test/pro', add );

			fakeSite();
			renderWithApp( <AccountPlans />, { boot: { isPro: true } } );

			expect(
				await screen.findByText( 'Licence summary, 3 plans' )
			).toBeInTheDocument();

			cleanup();
			removeFilter( 'atlasvoice.slot.account.plans', 'test/pro' );
		} );
	} );

	it( 'has no accessibility violations in Free, in lifetime and with Pro', async () => {
		fakeSite();
		const free = renderWithApp( <AccountPlans /> );
		await screen.findByRole( 'heading', { name: '1 site' } );
		expect( await axe( free.container ) ).toHaveNoViolations();

		fireEvent.click( screen.getByRole( 'button', { name: 'Lifetime' } ) );
		expect( await axe( free.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite();
		const pro = renderWithApp( <AccountPlans />, {
			boot: { isPro: true },
		} );
		await screen.findByRole( 'link', {
			name: /See all plans and add sites/,
		} );
		expect( await axe( pro.container ) ).toHaveNoViolations();
	}, 20000 ); // Three accessibility scans in one test: slow on a busy machine.
} );
