import '@testing-library/jest-dom';
import {
	act,
	fireEvent,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import LibraryAll from './LibraryAll';
import { REFRESH_EVERY, failureWords } from './library-audio';

expect.extend( toHaveNoViolations );

const post = ( id, title, status, job = null ) => ( {
	id,
	title,
	status,
	job,
	modified: '2026-11-01T10:57:52+00:00',
	view_url: 'https://example.com/?p=' + id,
	edit_url: 'https://example.com/wp-admin/post.php?post=' + id,
} );

/** A site whose audio is made by jobs, with one post of each kind. */
const LIBRARY = {
	stores_audio: true,
	voice: 'AtlasVoice TTS',
	counts: { all: 4, ready: 1, missing: 3 },
	jobs: { available: true, reason: '' },
	status: 'all',
	search: '',
	page: 1,
	pages: 1,
	total: 4,
	posts: [
		post( 1, 'Ready post', 'ready' ),
		post( 2, 'Missing post', 'missing' ),
		post( 3, 'Making post', 'making', {
			status: 'running',
			parts_done: 2,
			parts: 5,
			error: '',
		} ),
		post( 4, 'Failed post', 'failed', {
			status: 'failed',
			parts_done: 0,
			parts: 0,
			error: 'quota_exceeded',
		} ),
	],
};

/**
 * A stand-in for the site: the library list and the jobs route.
 *
 * @param {Object} library         What the list returns; replace `site.library` to change it.
 * @param {Object} options
 * @param {Object} options.failJob { status, message } to refuse a job request.
 * @return {Object} { jobs, gets, library }.
 */
function fakeSite( library = LIBRARY, { failJob } = {} ) {
	const site = { jobs: [], gets: 0, library };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( url, options = {} ) => {
		if ( String( url ).includes( 'cloud/jobs' ) ) {
			if ( failJob ) {
				return reply(
					{ message: failJob.message },
					false,
					failJob.status
				);
			}
			site.jobs.push( [ options.method, JSON.parse( options.body ) ] );

			return reply( { status: 'queued' } );
		}
		site.gets++;

		return reply( site.library );
	} );

	return site;
}

const row = async ( title ) =>
	(
		await screen.findByRole( 'rowheader', { name: new RegExp( title ) } )
	).closest( 'tr' );

describe( 'Audio library › making audio', () => {
	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'says what the audio of each post is doing, in words', async () => {
		fakeSite();
		renderWithApp( <LibraryAll /> );

		expect(
			within( await row( 'Ready post' ) ).getByText( 'Ready' )
		).toBeInTheDocument();
		expect(
			within( await row( 'Missing post' ) ).getByText( 'No audio yet' )
		).toBeInTheDocument();

		const making = await row( 'Making post' );
		expect( within( making ).getByText( 'Making' ) ).toBeInTheDocument();
		expect(
			within( making ).getByText( '2 of 5 parts' )
		).toBeInTheDocument();

		const failed = await row( 'Failed post' );
		expect( within( failed ).getByText( 'Failed' ) ).toBeInTheDocument();
		expect(
			within( failed ).getByText(
				'This month’s characters are not enough for this post.'
			)
		).toBeInTheDocument();
	} );

	it( 'offers the one action that fits each post', async () => {
		fakeSite();
		renderWithApp( <LibraryAll /> );

		expect(
			within( await row( 'Ready post' ) ).queryByRole( 'button' )
		).not.toBeInTheDocument();
		expect(
			within( await row( 'Missing post' ) ).getByRole( 'button', {
				name: 'Make the audio of “Missing post”',
			} )
		).toHaveTextContent( 'Make audio' );
		expect(
			within( await row( 'Making post' ) ).getByRole( 'button', {
				name: 'Cancel the audio of “Making post”',
			} )
		).toBeInTheDocument();
		expect(
			within( await row( 'Failed post' ) ).getByRole( 'button', {
				name: 'Try the audio of “Failed post” again',
			} )
		).toHaveTextContent( 'Try again' );
	} );

	it( 'starts the job of one post and then shows how far it is', async () => {
		const site = fakeSite();
		const { context } = renderWithApp( <LibraryAll /> );
		const button = within( await row( 'Missing post' ) ).getByRole(
			'button'
		);

		site.library = {
			...LIBRARY,
			posts: LIBRARY.posts.map( ( item ) =>
				item.id === 2
					? post( 2, 'Missing post', 'making', {
							status: 'queued',
							parts_done: 0,
							parts: 0,
							error: '',
					  } )
					: item
			),
		};
		fireEvent.click( button );

		await waitFor( () =>
			expect( site.jobs ).toEqual( [ [ 'POST', { post_id: 2 } ] ] )
		);
		expect(
			await within( await row( 'Missing post' ) ).findByText( 'Making' )
		).toBeInTheDocument();
		expect( context.notify ).toHaveBeenCalledWith(
			'The audio is being made. You can leave this screen.'
		);
	} );

	it( 'cancels a job', async () => {
		const site = fakeSite();
		const { context } = renderWithApp( <LibraryAll /> );

		fireEvent.click(
			within( await row( 'Making post' ) ).getByRole( 'button' )
		);

		await waitFor( () =>
			expect( site.jobs ).toEqual( [ [ 'DELETE', { post_id: 3 } ] ] )
		);
		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith( 'Cancelled.' )
		);
	} );

	it( 'shows the site’s reason when a job cannot start', async () => {
		fakeSite( LIBRARY, {
			failJob: {
				status: 402,
				message:
					'This month’s characters are not enough for this post.',
			},
		} );
		const { context } = renderWithApp( <LibraryAll /> );

		fireEvent.click(
			within( await row( 'Missing post' ) ).getByRole( 'button' )
		);

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'This month’s characters are not enough for this post.',
				'error'
			)
		);
		// The button can be pressed again.
		await waitFor( () =>
			expect(
				within( screen.getByRole( 'table' ) ).getByRole( 'button', {
					name: 'Make the audio of “Missing post”',
				} )
			).toBeEnabled()
		);
	} );

	it( 'follows audio in the making and stops when nothing is made any more', async () => {
		jest.useFakeTimers();
		const site = fakeSite();
		renderWithApp( <LibraryAll /> );
		await act( async () => {
			await Promise.resolve();
			await Promise.resolve();
			await Promise.resolve();
		} );
		expect( site.gets ).toBe( 1 );

		// The job finishes on the site meanwhile.
		site.library = {
			...LIBRARY,
			posts: LIBRARY.posts.map( ( item ) =>
				item.id === 3 ? post( 3, 'Making post', 'ready' ) : item
			),
		};
		await act( async () => {
			jest.advanceTimersByTime( REFRESH_EVERY );
			await Promise.resolve();
			await Promise.resolve();
			await Promise.resolve();
		} );
		expect( site.gets ).toBe( 2 );
		expect( screen.queryByText( 'Making' ) ).not.toBeInTheDocument();

		await act( async () => {
			jest.advanceTimersByTime( REFRESH_EVERY * 3 );
			await Promise.resolve();
		} );
		expect( site.gets ).toBe( 2 );
	} );

	it( 'offers no action where jobs cannot make the audio', async () => {
		fakeSite( { ...LIBRARY, jobs: { available: false, reason: 'voice' } } );
		renderWithApp( <LibraryAll /> );

		const table = within(
			( await row( 'Missing post' ) ).closest( 'table' )
		);
		expect( table.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'works with a site that says nothing about jobs', async () => {
		const { jobs, ...older } = LIBRARY;
		fakeSite( older );
		renderWithApp( <LibraryAll /> );

		expect( jobs ).toBeTruthy();
		const table = within(
			( await row( 'Missing post' ) ).closest( 'table' )
		);
		expect( table.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'puts every reason of a failure into words', () => {
		[
			'quota_exceeded',
			'daily_cap_reached',
			'text_too_long',
			'timed_out',
			'download_failed',
			'not_writable',
		].forEach( ( code ) =>
			expect( failureWords( code ) ).not.toBe(
				failureWords( 'something_new' )
			)
		);
		expect( failureWords( 'constructor' ) ).toBe(
			'The audio could not be made. Try again.'
		);
		expect( failureWords( undefined ) ).toBe(
			'The audio could not be made. Try again.'
		);
	} );

	it( 'has no accessibility violations with every kind of post', async () => {
		fakeSite();
		const { container } = renderWithApp( <LibraryAll /> );
		await row( 'Failed post' );

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
