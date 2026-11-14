import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import InsightsReport, {
	busiestHour,
	listeningTime,
	percentOf,
} from './InsightsReport';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const hours = () => {
	const list = new Array( 24 ).fill( 0 );
	list[ 14 ] = 9;
	list[ 20 ] = 4;

	return list;
};

/** A report with plays (TTA\Insights\Report), from the free plugin alone. */
const REPORT = {
	range: '30',
	from: '2026-10-15 00:00:00',
	counting: true,
	totals: {
		plays: 1200,
		seconds: 9000,
		finished: 300,
		downloads: 12,
		listeners: 640,
		new_listeners: 500,
		returning_listeners: 140,
	},
	progress: {
		started: 1200,
		quarter: 900,
		half: 600,
		three_quarters: 420,
		finished: 300,
	},
	posts: [
		{
			id: 12,
			title: 'The old mill',
			plays: 800,
			seconds: 6400,
			finished: 240,
		},
		{ id: 128, title: '', plays: 400, seconds: 2600, finished: 60 },
	],
	hours: hours(),
	breakdowns: {},
};

/** With the numbers a plugin such as Pro adds. */
const WITH_BREAKDOWNS = {
	...REPORT,
	breakdowns: {
		devices: [
			{ name: 'Mobile', count: 64 },
			{ name: 'Desktop', count: 36 },
		],
		countries: [ { name: 'Spain', count: 10 } ],
	},
};

const EMPTY = {
	...REPORT,
	totals: {
		plays: 0,
		seconds: 0,
		finished: 0,
		downloads: 0,
		listeners: 0,
		new_listeners: 0,
		returning_listeners: 0,
	},
	progress: {
		started: 0,
		quarter: 0,
		half: 0,
		three_quarters: 0,
		finished: 0,
	},
	posts: [],
	hours: new Array( 24 ).fill( 0 ),
};

/**
 * A stand-in for the site's report route.
 *
 * @param {Object} answer What it returns, or a function of the range.
 * @param {Object} fail   { status, message } to refuse the first load.
 * @return {Object} { urls }.
 */
function fakeSite( answer = REPORT, fail ) {
	const site = { urls: [] };
	let failed = false;

	window.fetch = jest.fn( ( url, options = {} ) => {
		site.urls.push( url );
		site.method = options.method || 'GET';
		if ( fail && ! failed ) {
			failed = true;

			return Promise.resolve( {
				ok: false,
				status: fail.status,
				json: async () => ( { message: fail.message } ),
			} );
		}

		const range = String( url ).split( 'range=' )[ 1 ];

		return Promise.resolve( {
			ok: true,
			status: 200,
			json: async () =>
				typeof answer === 'function'
					? answer( range )
					: { ...answer, range },
		} );
	} );

	return site;
}

const period = () => screen.findByRole( 'combobox', { name: 'Period' } );
const show = ( hash, options = {} ) =>
	renderWithApp( <InsightsReport />, { hash, ...options } );

afterEach( () => {
	delete window.fetch;
} );

describe( 'the numbers in words', () => {
	it( 'writes listening time in seconds, minutes, or hours and minutes', () => {
		expect( listeningTime( 40 ) ).toBe( '40 s' );
		expect( listeningTime( 300 ) ).toBe( '5 min' );
		expect( listeningTime( 7500 ) ).toBe( '2 h 5 min' );
		expect( listeningTime( 0 ) ).toBe( '0 s' );
		expect( listeningTime( undefined ) ).toBe( '0 s' );
		expect( listeningTime( -5 ) ).toBe( '0 s' );
	} );

	it( 'gives a part of a whole as a percentage, and 0 when there is no whole', () => {
		expect( percentOf( 300, 1200 ) ).toBe( 25 );
		expect( percentOf( 1, 3 ) ).toBe( 33 );
		expect( percentOf( 5, 0 ) ).toBe( 0 );
		expect( percentOf( 9, 3 ) ).toBe( 100 );
		expect( percentOf( undefined, 10 ) ).toBe( 0 );
	} );

	it( 'names the busiest hour, or says there were no plays', () => {
		expect( busiestHour( hours() ) ).toBe(
			'Busiest hour: 14:00 to 15:00 (UTC).'
		);
		expect( busiestHour( new Array( 24 ).fill( 0 ) ) ).toBe(
			'No plays in this period.'
		);
		expect( busiestHour( undefined ) ).toBe( 'No plays in this period.' );

		const lateNight = new Array( 24 ).fill( 0 );
		lateNight[ 23 ] = 2;
		expect( busiestHour( lateNight ) ).toBe(
			'Busiest hour: 23:00 to 00:00 (UTC).'
		);
	} );
} );

describe( 'Insights', () => {
	it( 'is the screen of the overview, posts and listeners routes', () => {
		expect( getScreenComponent( 'insights:overview' ) ).toBeTruthy();
		expect( getScreenComponent( 'insights:posts' ) ).toBe(
			getScreenComponent( 'insights:overview' )
		);
		expect( getScreenComponent( 'insights:listeners' ) ).toBe(
			getScreenComponent( 'insights:overview' )
		);
	} );

	it( 'only reads, and asks for the last 30 days first', async () => {
		const site = fakeSite();
		show( '#/insights/overview' );
		await period();

		await waitFor( () =>
			expect( site.urls ).toEqual( [
				'https://site.test/wp-json/tta/v1/report?range=30',
			] )
		);
		expect( site.method ).toBe( 'GET' );
	} );

	it( 'asks again when another period is chosen', async () => {
		const site = fakeSite();
		show( '#/insights/overview' );

		fireEvent.change( await period(), { target: { value: '7' } } );

		await waitFor( () =>
			expect( site.urls ).toContain(
				'https://site.test/wp-json/tta/v1/report?range=7'
			)
		);

		// Put back, so the next test starts from 30 days again.
		fireEvent.change( await period(), { target: { value: '30' } } );
		await waitFor( () => expect( site.urls ).toHaveLength( 3 ) );
	} );

	describe( 'Overview', () => {
		it( 'shows plays, listening time, how many finished and listeners', async () => {
			fakeSite();
			show( '#/insights/overview' );

			expect( await screen.findByText( '1,200' ) ).toBeInTheDocument();
			expect( screen.getByText( '2 h 30 min' ) ).toBeInTheDocument();
			expect(
				screen.getByText( '300 plays to the end' )
			).toBeInTheDocument();
			expect( screen.getByText( '640' ) ).toBeInTheDocument();
		} );

		it( 'shows how far people listened, as a share of the plays', async () => {
			fakeSite();
			show( '#/insights/overview' );
			await screen.findByText( '1,200' );

			expect(
				screen.getByRole( 'progressbar', { name: 'Started' } )
			).toHaveValue( 100 );
			expect(
				screen.getByRole( 'progressbar', { name: 'Reached 50%' } )
			).toHaveValue( 50 );
			expect(
				screen.getByRole( 'progressbar', { name: 'Finished' } )
			).toHaveValue( 25 );
		} );

		it( 'says the busiest hour in words, for people who cannot see the bars', async () => {
			fakeSite();
			show( '#/insights/overview' );
			await screen.findByText( '1,200' );

			expect(
				screen.getByRole( 'img', {
					name: 'Busiest hour: 14:00 to 15:00 (UTC).',
				} )
			).toBeInTheDocument();
			expect(
				screen.getByText( 'Busiest hour: 14:00 to 15:00 (UTC).' )
			).toBeInTheDocument();
		} );

		it( 'lists the most played posts and opens the full list', async () => {
			fakeSite();
			const { context } = show( '#/insights/overview' );
			await screen.findByText( '1,200' );

			const rows = within( screen.getByRole( 'table' ) ).getAllByRole(
				'row'
			);
			expect( rows ).toHaveLength( 3 );
			expect(
				within( rows[ 1 ] ).getByRole( 'rowheader', {
					name: 'The old mill',
				} )
			).toBeInTheDocument();
			expect(
				within( rows[ 1 ] ).getByText( '30%' )
			).toBeInTheDocument();
			// A post without a title is shown by its number.
			expect(
				within( rows[ 2 ] ).getByRole( 'rowheader', {
					name: 'Post 128',
				} )
			).toBeInTheDocument();

			fireEvent.click(
				screen.getByRole( 'button', { name: 'All posts' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'insights:posts' );
		} );
	} );

	describe( 'Posts', () => {
		it( 'lists every post with its listening time and average', async () => {
			fakeSite();
			show( '#/insights/posts' );

			const table = await screen.findByRole( 'table' );
			const row = within( table ).getByRole( 'rowheader', {
				name: 'The old mill',
			} ).parentElement;
			expect( within( row ).getByText( '800' ) ).toBeInTheDocument();
			expect(
				within( row ).getByText( '1 h 46 min' )
			).toBeInTheDocument();
			expect( within( row ).getByText( '8 s' ) ).toBeInTheDocument();
		} );

		it( 'finds a post by its title or its number', async () => {
			fakeSite();
			show( '#/insights/posts' );
			await screen.findByRole( 'table' );

			const search = screen.getByRole( 'searchbox', {
				name: 'Find a post',
			} );
			fireEvent.change( search, { target: { value: 'MILL' } } );
			expect(
				within( screen.getByRole( 'table' ) ).getAllByRole( 'row' )
			).toHaveLength( 2 );

			fireEvent.change( search, { target: { value: '128' } } );
			expect(
				screen.getByRole( 'rowheader', { name: 'Post 128' } )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'rowheader', { name: 'The old mill' } )
			).not.toBeInTheDocument();
		} );

		it( 'says so when no played post matches', async () => {
			fakeSite();
			show( '#/insights/posts' );
			await screen.findByRole( 'table' );

			fireEvent.change(
				screen.getByRole( 'searchbox', { name: 'Find a post' } ),
				{ target: { value: 'zzz' } }
			);

			expect(
				screen.getByText( 'No played post matches this.' )
			).toBeInTheDocument();
			expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Listeners', () => {
		it( 'shows new and returning listeners', async () => {
			fakeSite();
			show( '#/insights/listeners' );

			expect( await screen.findByText( '500' ) ).toBeInTheDocument();
			expect( screen.getByText( '140' ) ).toBeInTheDocument();
		} );

		it( 'shows the breakdowns the report has, as shares', async () => {
			fakeSite( WITH_BREAKDOWNS );
			show( '#/insights/listeners', { boot: { isPro: true } } );
			await screen.findByText( '500' );

			expect(
				screen.getByRole( 'heading', { name: 'Devices' } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'progressbar', { name: 'Mobile' } )
			).toHaveValue( 64 );
			expect(
				screen.getByRole( 'heading', { name: 'Countries' } )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'heading', { name: 'Browsers' } )
			).not.toBeInTheDocument();
		} );

		it( 'in the free plugin shows one line about Pro instead, that opens the Plans tab', async () => {
			fakeSite();
			const { container, context } = show( '#/insights/listeners' );
			await screen.findByText( '500' );

			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 1 );
			expect(
				container.querySelectorAll(
					'input[disabled], [aria-disabled="true"]'
				)
			).toHaveLength( 0 );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'See Pro' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
		} );

		it( 'with Pro and no such numbers yet, says so without a Pro line', async () => {
			fakeSite();
			const { container } = show( '#/insights/listeners', {
				boot: { isPro: true },
			} );
			await screen.findByText( '500' );

			expect(
				screen.getByText(
					/no device, browser or country numbers for this period yet/
				)
			).toBeInTheDocument();
			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 0 );
		} );

		it( 'says what a listener is', async () => {
			fakeSite();
			show( '#/insights/listeners' );
			await screen.findByText( '500' );

			expect(
				screen.getByText( /not a name, an email or an IP address/ )
			).toBeInTheDocument();
		} );
	} );

	describe( 'without plays', () => {
		it( 'says numbers appear after visitors press play', async () => {
			fakeSite( EMPTY );
			show( '#/insights/overview' );

			expect(
				await screen.findByText( 'No plays in this period' )
			).toBeInTheDocument();
			expect(
				screen.getByText( /after visitors press play/ )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Open Tracking' } )
			).not.toBeInTheDocument();
		} );

		it( 'says counting is off and opens Tracking when that is why', async () => {
			fakeSite( { ...EMPTY, counting: false } );
			const { context } = show( '#/insights/overview' );

			fireEvent.click(
				await screen.findByRole( 'button', { name: 'Open Tracking' } )
			);

			expect(
				screen.getByText( /Plays are not counted on this site/ )
			).toBeInTheDocument();
			expect( context.go ).toHaveBeenCalledWith( 'insights:tracking' );
		} );
	} );

	it( 'warns that the numbers stopped growing when counting was turned off', async () => {
		fakeSite( { ...REPORT, counting: false } );
		const { container } = show( '#/insights/overview' );
		await screen.findByText( '1,200' );

		expect(
			container.querySelector( '.components-notice.is-warning' )
		).toHaveTextContent(
			'Counting is off, so these numbers stopped growing.'
		);
	} );

	it( 'offers to try again when the numbers cannot be loaded', async () => {
		const site = fakeSite( REPORT, {
			status: 500,
			message: 'Server error',
		} );
		show( '#/insights/overview' );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await screen.findByText( '1,200' ) ).toBeInTheDocument();
		expect( site.urls ).toHaveLength( 2 );
	} );

	it( 'has no accessibility violations in any of the three views', async () => {
		for ( const hash of [
			'#/insights/overview',
			'#/insights/posts',
			'#/insights/listeners',
		] ) {
			fakeSite( WITH_BREAKDOWNS );
			const view = show( hash, { boot: { isPro: true } } );
			await period();
			await waitFor( () =>
				expect(
					view.container.querySelector( '.atlasvoice-loading' )
				).toBeNull()
			);
			expect( await axe( view.container ) ).toHaveNoViolations();
			view.unmount();
		}
	} );
} );
