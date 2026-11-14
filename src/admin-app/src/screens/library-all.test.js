import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import LibraryAll, { shortDate } from './LibraryAll';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const POSTS = [
	{
		id: 12,
		title: 'The old mill',
		status: 'ready',
		modified: '2026-11-01T10:57:52+00:00',
		view_url: 'https://example.com/the-old-mill/',
		edit_url: 'https://example.com/wp-admin/post.php?post=12&action=edit',
	},
	{
		id: 15,
		title: '',
		status: 'missing',
		modified: '2026-10-30T10:57:48+00:00',
		view_url: 'https://example.com/?p=15',
		edit_url: 'https://example.com/wp-admin/post.php?post=15&action=edit',
	},
];

/** What a site with a voice that stores MP3 files answers (TTA\Library\Posts). */
const LIBRARY = {
	stores_audio: true,
	voice: 'AtlasVoice TTS',
	counts: { all: 40, ready: 28, missing: 12 },
	status: 'all',
	search: '',
	page: 1,
	pages: 2,
	total: 40,
	posts: POSTS,
};

/**
 * A stand-in for the site's library route. It answers with the status,
 * search and page that were asked for.
 *
 * @param {Object} answer What it returns.
 * @param {Object} fail   { status, message } to refuse the first load.
 * @return {Object} { asked }: the query of every request.
 */
function fakeSite( answer = LIBRARY, fail ) {
	const site = { asked: [], methods: [] };
	let failed = false;

	window.fetch = jest.fn( ( url, options = {} ) => {
		const query = Object.fromEntries(
			new URL( url, 'https://example.com' ).searchParams
		);
		site.asked.push( query );
		site.methods.push( options.method || 'GET' );
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
			json: async () => ( {
				...answer,
				status: query.status,
				search: query.search,
				page: Number( query.page ),
			} ),
		} );
	} );

	return site;
}

const lastAsked = ( site ) => site.asked[ site.asked.length - 1 ];

describe( 'Audio library › All posts', () => {
	it( 'is the screen of the route library:all', () => {
		expect( getScreenComponent( 'library:all' ) ).toBeTruthy();
	} );

	it( 'lists each post with whether its audio is stored', async () => {
		fakeSite();
		renderWithApp( <LibraryAll /> );

		const ready = (
			await screen.findByRole( 'rowheader', { name: /The old mill/ } )
		).closest( 'tr' );
		expect( within( ready ).getByText( 'Ready' ) ).toBeInTheDocument();
		expect( within( ready ).getByText( '#12' ) ).toBeInTheDocument();

		// A post without a title is named by its number.
		const missing = screen
			.getByRole( 'rowheader', { name: /Post 15/ } )
			.closest( 'tr' );
		expect(
			within( missing ).getByText( 'No audio yet' )
		).toBeInTheDocument();
	} );

	it( 'names the voice the files belong to', async () => {
		fakeSite();
		renderWithApp( <LibraryAll /> );

		expect(
			await screen.findByText( /voice in use \(AtlasVoice TTS\)/ )
		).toBeInTheDocument();
	} );

	it( 'links each post to its page and to its editor', async () => {
		fakeSite();
		renderWithApp( <LibraryAll /> );

		expect(
			await screen.findByRole( 'link', { name: /View “The old mill”/ } )
		).toHaveAttribute( 'href', POSTS[ 0 ].view_url );
		expect(
			screen.getByRole( 'link', { name: 'Edit “The old mill”' } )
		).toHaveAttribute( 'href', POSTS[ 0 ].edit_url );
	} );

	it( 'shows how many posts are in each state', async () => {
		fakeSite();
		renderWithApp( <LibraryAll /> );

		const filters = await screen.findByRole( 'group', {
			name: 'Audio status',
		} );
		expect(
			within( filters ).getByRole( 'button', { name: 'All 40' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
		expect(
			within( filters ).getByRole( 'button', { name: 'Ready 28' } )
		).toHaveAttribute( 'aria-pressed', 'false' );
		expect(
			within( filters ).getByRole( 'button', {
				name: 'No audio yet 12',
			} )
		).toBeInTheDocument();
	} );

	it( 'asks for the chosen status, from the first page', async () => {
		const site = fakeSite();
		renderWithApp( <LibraryAll /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Next' } )
		);
		await waitFor( () => expect( lastAsked( site ).page ).toBe( '2' ) );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'No audio yet 12' } )
		);

		await waitFor( () =>
			expect( lastAsked( site ) ).toEqual( {
				status: 'missing',
				search: '',
				page: '1',
			} )
		);
		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: 'No audio yet 12' } )
			).toHaveAttribute( 'aria-pressed', 'true' )
		);
	} );

	it( 'searches a moment after the typing stops, not on every key', async () => {
		const site = fakeSite();
		renderWithApp( <LibraryAll /> );
		const box = await screen.findByRole( 'searchbox', {
			name: 'Find a post',
		} );
		const before = site.asked.length;

		fireEvent.change( box, { target: { value: 'm' } } );
		fireEvent.change( box, { target: { value: 'mi' } } );
		fireEvent.change( box, { target: { value: ' mill ' } } );

		await waitFor( () =>
			expect( lastAsked( site ).search ).toBe( 'mill' )
		);
		expect( site.asked.length ).toBe( before + 1 );
	} );

	it( 'moves between the pages and says which one is open', async () => {
		const site = fakeSite();
		renderWithApp( <LibraryAll /> );

		expect(
			await screen.findByText( 'Page 1 of 2, 40 posts' )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Previous' } )
		).toBeDisabled();

		fireEvent.click( screen.getByRole( 'button', { name: 'Next' } ) );

		expect(
			await screen.findByText( 'Page 2 of 2, 40 posts' )
		).toBeInTheDocument();
		expect( lastAsked( site ).page ).toBe( '2' );
		expect( screen.getByRole( 'button', { name: 'Next' } ) ).toBeDisabled();
	} );

	it( 'shows no pager for a single page', async () => {
		fakeSite( { ...LIBRARY, pages: 1, total: 2 } );
		renderWithApp( <LibraryAll /> );

		await screen.findByRole( 'rowheader', { name: /The old mill/ } );
		expect(
			screen.queryByRole( 'button', { name: 'Next' } )
		).not.toBeInTheDocument();
	} );

	it( 'says so when the browser voice stores no files, and opens Voice', async () => {
		fakeSite( {
			...LIBRARY,
			stores_audio: false,
			voice: 'Default',
			posts: [],
		} );
		const { context } = renderWithApp( <LibraryAll /> );

		expect(
			await screen.findByText( 'No audio files with the browser voice' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Choose a voice' } )
		);
		expect( context.go ).toHaveBeenCalledWith( 'voice:voice' );
	} );

	it( 'offers to clear the filters when nothing matches', async () => {
		const site = fakeSite( { ...LIBRARY, posts: [], pages: 0, total: 0 } );
		renderWithApp( <LibraryAll /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Ready 28' } )
		);
		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Clear filters' } )
		);

		await waitFor( () => expect( lastAsked( site ).status ).toBe( 'all' ) );
	} );

	it( 'points to Where it appears when no post gets a player', async () => {
		fakeSite( {
			...LIBRARY,
			counts: { all: 0, ready: 0, missing: 0 },
			posts: [],
			pages: 0,
			total: 0,
		} );
		const { context } = renderWithApp( <LibraryAll /> );

		fireEvent.click(
			await screen.findByRole( 'button', {
				name: 'Choose where it appears',
			} )
		);
		expect( context.go ).toHaveBeenCalledWith( 'content:where' );
	} );

	it( 'shows the site’s message when loading fails, and tries again', async () => {
		fakeSite( LIBRARY, { status: 500, message: 'The database is away.' } );
		const { container } = renderWithApp( <LibraryAll /> );

		// The message is also read out, so look inside the screen only.
		expect(
			await within( container ).findByText(
				'The library could not be loaded: The database is away.'
			)
		).toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect(
			await screen.findByRole( 'rowheader', { name: /The old mill/ } )
		).toBeInTheDocument();
	} );

	it( 'only reads: it never sends a change', async () => {
		const site = fakeSite();
		renderWithApp( <LibraryAll /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Next' } )
		);
		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Ready 28' } )
		);
		await waitFor( () =>
			expect( lastAsked( site ).status ).toBe( 'ready' )
		);

		expect( new Set( site.methods ) ).toEqual( new Set( [ 'GET' ] ) );
	} );

	it( 'tells a Free site in one line what Pro adds, with no locked control', async () => {
		fakeSite();
		const { context } = renderWithApp( <LibraryAll /> );

		expect(
			await screen.findByText(
				/many posts at once is part of AtlasVoice Pro/
			)
		).toBeInTheDocument();
		// Only the pager may be disabled (first page: Previous).
		expect(
			screen
				.getAllByRole( 'button' )
				.filter( ( button ) => button.disabled )
				.map( ( button ) => button.textContent )
		).toEqual( [ 'Previous' ] );

		fireEvent.click( screen.getByRole( 'button', { name: /See/ } ) );
		expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
	} );

	it( 'shows no Pro line when Pro is active', async () => {
		fakeSite();
		renderWithApp( <LibraryAll />, { boot: { isPro: true } } );

		await screen.findByRole( 'rowheader', { name: /The old mill/ } );
		expect(
			screen.queryByText( /is part of AtlasVoice Pro/ )
		).not.toBeInTheDocument();
	} );

	it( 'writes a date in short form and nothing for a broken one', () => {
		expect( shortDate( '2026-11-01T10:57:52+00:00' ) ).toMatch( /2026/ );
		expect( shortDate( 'not a date' ) ).toBe( '' );
	} );

	it( 'has no accessibility violations, with posts and without files', async () => {
		fakeSite();
		const { container, unmount } = renderWithApp( <LibraryAll /> );
		await screen.findByRole( 'rowheader', { name: /The old mill/ } );
		expect( await axe( container ) ).toHaveNoViolations();
		unmount();

		fakeSite( { ...LIBRARY, stores_audio: false, posts: [] } );
		const empty = renderWithApp( <LibraryAll /> );
		await screen.findByText( 'No audio files with the browser voice' );
		expect( await axe( empty.container ) ).toHaveNoViolations();
	} );
} );
