import '@testing-library/jest-dom';
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import PostPanel, {
	POLL_MS,
	audioWords,
	statusWords,
	whenWords,
} from './PostPanel';

expect.extend( toHaveNoViolations );

const BOOT = {
	restUrl: 'https://site.test/wp-json/',
	restNonce: 'nonce',
	postId: 161,
	appUrl: 'https://site.test/wp-admin/admin.php?page=text-to-audio',
};

/**
 * What tta/v1/post-panel/161 answers.
 *
 * @param {Object} audio   Parts of the audio to replace.
 * @param {Object} changes Other parts to replace.
 * @return {Object} The panel.
 */
function panelOf( audio = {}, changes = {} ) {
	return {
		post: { id: 161, published: true },
		player: { shown: true },
		audio: {
			kind: 'jobs',
			status: 'missing',
			when: 'play',
			can_make: true,
			reason: '',
			job: null,
			...audio,
		},
		listening: { counted: true, days: 30, plays: 412, listeners: 38 },
		shortcode: '[atlasvoice]',
		...changes,
	};
}

/**
 * A stand-in for the site.
 *
 * @param {Object} options
 * @param {Object} options.panel   What the panel route answers.
 * @param {Object} options.after   What a change answers (default: the panel).
 * @param {Object} options.fail    { status, message } to refuse a change.
 * @param {Object} options.failGet { status, message } to refuse the first read.
 * @return {Object} { calls, panel }.
 */
function fakeSite( { panel = panelOf(), after, fail, failGet } = {} ) {
	const site = { calls: [], panel, refuseGet: failGet };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( url, options = {} ) => {
		const method = options.method || 'GET';
		site.calls.push( {
			method,
			path: String( url ).split( 'wp-json/' )[ 1 ],
			body: options.body ? JSON.parse( options.body ) : undefined,
			nonce: options.headers && options.headers[ 'X-WP-Nonce' ],
		} );

		if ( method === 'GET' ) {
			if ( site.refuseGet ) {
				const refusal = site.refuseGet;
				site.refuseGet = null;

				return reply(
					{ message: refusal.message },
					false,
					refusal.status
				);
			}

			return reply( site.panel );
		}
		if ( fail ) {
			return reply( { message: fail.message }, false, fail.status );
		}
		if ( after ) {
			site.panel = after;
		}

		return reply( site.panel );
	} );

	return site;
}

/**
 * Draws the panel and waits until it has loaded.
 *
 * @param {Object} site Options of the stand-in site.
 * @param {Object} boot What the panel starts with.
 * @return {Promise<Object>} { site, container, rerender }.
 */
async function show( site = {}, boot = BOOT ) {
	const fake = fakeSite( site );
	const view = render( <PostPanel boot={ boot } /> );
	await screen.findByRole( 'button', { name: 'Audio' } );

	return { site: fake, ...view };
}

afterEach( () => {
	cleanup();
	jest.useRealTimers();
	delete window.fetch;
} );

describe( 'the words of the panel', () => {
	test( 'each state of the audio has a name', () => {
		expect(
			[ 'ready', 'outdated', 'making', 'failed', 'draft', 'missing' ].map(
				statusWords
			)
		).toEqual( [
			'Ready',
			'Outdated',
			'Being made',
			'Failed',
			'Draft',
			'No audio yet',
		] );
	} );

	test( 'it says when the site makes audio', () => {
		expect( whenWords( 'publish' ) ).toBe( 'right after you publish.' );
		expect( whenWords( 'play' ) ).toBe(
			'the first time someone plays it.'
		);
	} );

	test( 'a failed job says what the service said', () => {
		expect(
			audioWords( {
				kind: 'jobs',
				status: 'failed',
				job: { error: 'The text is too long.' },
			} )
		).toBe( 'The text is too long.' );
		expect(
			audioWords( { kind: 'jobs', status: 'failed', job: null } )
		).toBe( 'The last try did not finish.' );
	} );

	test( 'a job that runs says how far it is', () => {
		expect(
			audioWords( {
				kind: 'jobs',
				status: 'making',
				job: { parts_done: 3, parts: 6 },
			} )
		).toMatch( /^Part 3 of 6 is done\./ );
		expect(
			audioWords( {
				kind: 'jobs',
				status: 'making',
				job: { parts_done: 0, parts: 0 },
			} )
		).toMatch( /^Started\./ );
	} );
} );

describe( 'the AtlasVoice panel of the post editor', () => {
	test( 'it reads this post from the site, with the nonce', async () => {
		const { site } = await show();

		expect( site.calls ).toEqual( [
			{
				method: 'GET',
				path: 'tta/v1/post-panel/161',
				body: undefined,
				nonce: 'nonce',
			},
		] );
	} );

	test( 'a post without audio can have it made now, and it says what that costs', async () => {
		const { site } = await show( {
			after: panelOf( {
				status: 'making',
				can_make: false,
				job: { parts_done: 0, parts: 0, error: '' },
			} ),
		} );

		expect( screen.getByText( 'No audio yet' ) ).toBeInTheDocument();
		expect(
			screen.getByText( /sent to the AtlasVoice service/ )
		).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Make audio now' } )
		);

		expect( await screen.findByText( 'Being made' ) ).toBeInTheDocument();
		expect( site.calls[ 1 ] ).toMatchObject( {
			method: 'POST',
			path: 'tta/v1/post-panel/161/audio',
		} );
		expect(
			screen.getAllByText( /^Started\. Visitors hear the audio/ ).length
		).toBeGreaterThan( 0 );
		// While it is made there is nothing to press.
		expect(
			screen.queryByRole( 'button', { name: 'Make audio now' } )
		).toBeNull();
	} );

	test( 'a job that could not start says why', async () => {
		await show( {
			fail: { status: 409, message: 'The text is too long.' },
		} );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Make audio now' } )
		);

		expect(
			( await screen.findAllByText( 'The text is too long.' ) ).length
		).toBeGreaterThan( 0 );
		expect( screen.getByText( 'No audio yet' ) ).toBeInTheDocument();
	} );

	test.each( [
		[ 'ready', 'Make again', 'The audio is up to date with the text.' ],
		[
			'outdated',
			'Make again',
			'The text changed since the audio was made. Visitors still hear the old version.',
		],
		[ 'failed', 'Try again', 'The last try did not finish.' ],
	] )( 'audio that is %s offers “%s”', async ( status, label, words ) => {
		await show( { panel: panelOf( { status } ) } );

		expect( screen.getByRole( 'button', { name: label } ) ).toBeEnabled();
		expect( screen.getByText( words ) ).toBeInTheDocument();
	} );

	test( 'while the audio is made the site is asked again, and it stops when it is ready', async () => {
		jest.useFakeTimers();
		const site = fakeSite( {
			panel: panelOf( {
				status: 'making',
				can_make: false,
				job: { parts_done: 1, parts: 4, error: '' },
			} ),
		} );
		render( <PostPanel boot={ BOOT } /> );
		await act( async () => {} );
		expect(
			screen.getByText( /^Part 1 of 4 is done\./ )
		).toBeInTheDocument();

		site.panel = panelOf( { status: 'ready' } );
		await act( async () => {
			jest.advanceTimersByTime( POLL_MS );
		} );
		await act( async () => {} );

		expect( screen.getByText( 'Ready' ) ).toBeInTheDocument();
		const asked = site.calls.length;
		await act( async () => {
			jest.advanceTimersByTime( POLL_MS * 3 );
		} );
		expect( site.calls.length ).toBe( asked );
	} );

	test( 'the word that it started goes away when the audio is ready', async () => {
		jest.useFakeTimers();
		const site = fakeSite( {
			after: panelOf( {
				status: 'making',
				can_make: false,
				job: { parts_done: 0, parts: 2, error: '' },
			} ),
		} );
		render( <PostPanel boot={ BOOT } /> );
		await act( async () => {} );
		await act( async () => {
			fireEvent.click(
				screen.getByRole( 'button', { name: 'Make audio now' } )
			);
		} );
		expect(
			screen.getAllByText( /^Started\. Visitors hear/ ).length
		).toBeGreaterThan( 0 );

		site.panel = panelOf( { status: 'ready' } );
		await act( async () => {
			jest.advanceTimersByTime( POLL_MS );
		} );
		await act( async () => {} );

		expect( screen.getByText( 'Ready' ) ).toBeInTheDocument();
		expect(
			document.querySelector( '.components-notice' )
		).not.toBeInTheDocument();
	} );

	test( 'a draft says that audio comes from the published page', async () => {
		await show( {
			panel: panelOf(
				{ status: 'draft', can_make: false, when: 'publish' },
				{ post: { id: 161, published: false } }
			),
		} );

		expect(
			screen.getByText(
				'Drafts never make audio. Audio is made from the published page, right after you publish.'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /audio now/ } )
		).toBeNull();
	} );

	test( 'the browser voice has no files and no state', async () => {
		await show( {
			panel: panelOf( { kind: 'browser', status: '', can_make: false } ),
		} );

		expect(
			screen.getByText( /reads this post live/ )
		).toBeInTheDocument();
		expect( screen.queryByText( 'No audio yet' ) ).toBeNull();
		expect(
			screen.getByRole( 'link', { name: 'Change the voice' } )
		).toHaveAttribute( 'href', BOOT.appUrl + '#/voice' );
	} );

	test( 'a voice that makes its audio on the first play has nothing to start here', async () => {
		await show( {
			panel: panelOf( {
				kind: 'files',
				status: 'missing',
				can_make: false,
			} ),
		} );

		expect(
			screen.getByText(
				'The audio of this post is made the first time someone plays it.'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /audio now/ } )
		).toBeNull();
	} );

	test( 'the player is hidden on this post and shown again', async () => {
		const { site } = await show( {
			after: panelOf( {}, { player: { shown: false } } ),
		} );
		const toggle = screen.getByLabelText( 'Show the player on this post' );
		expect( toggle ).toBeChecked();

		fireEvent.click( toggle );

		await waitFor( () => expect( toggle ).not.toBeChecked() );
		expect( site.calls[ 1 ] ).toEqual( {
			method: 'POST',
			path: 'tta/v1/post-panel/161/player',
			body: { shown: false },
			nonce: 'nonce',
		} );
		expect(
			screen.getAllByText( 'The player is hidden on this post.' ).length
		).toBeGreaterThan( 0 );
		expect(
			screen.getByText( 'The player is hidden on this post only.' )
		).toBeInTheDocument();
	} );

	test( 'a change that was refused says why and keeps the switch', async () => {
		await show( { fail: { status: 403, message: 'You cannot do this.' } } );
		const toggle = screen.getByLabelText( 'Show the player on this post' );

		fireEvent.click( toggle );

		expect(
			( await screen.findAllByText( 'You cannot do this.' ) ).length
		).toBeGreaterThan( 0 );
		expect( toggle ).toBeChecked();
	} );

	test( 'it shows the listening of the last 30 days', async () => {
		await show();

		expect(
			screen.getByRole( 'button', { name: 'Listening, last 30 days' } )
		).toBeInTheDocument();
		expect( screen.getByText( '412' ) ).toBeInTheDocument();
		expect( screen.getByText( 'plays' ) ).toBeInTheDocument();
		expect( screen.getByText( '38' ) ).toBeInTheDocument();
		expect( screen.getByText( 'listeners' ) ).toBeInTheDocument();
	} );

	test( 'a site that does not count listening says so', async () => {
		await show( {
			panel: panelOf(
				{},
				{
					listening: {
						counted: false,
						days: 30,
						plays: 0,
						listeners: 0,
					},
				}
			),
		} );

		expect(
			screen.getByText( 'Listening is not counted on this site.' )
		).toBeInTheDocument();
	} );

	test( 'the shortcode can be copied', async () => {
		const writeText = jest.fn( () => Promise.resolve() );
		Object.defineProperty( window.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		await show();

		fireEvent.click( screen.getByRole( 'button', { name: 'Shortcode' } ) );
		expect( screen.getByLabelText( 'Shortcode' ) ).toHaveValue(
			'[atlasvoice]'
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () =>
			expect( writeText ).toHaveBeenCalledWith( '[atlasvoice]' )
		);
		expect(
			( await screen.findAllByText( 'Shortcode copied.' ) ).length
		).toBeGreaterThan( 0 );
	} );

	test( 'someone who cannot open the settings gets no links to them', async () => {
		await show( {}, { ...BOOT, appUrl: '' } );

		expect( screen.queryAllByRole( 'link' ) ).toHaveLength( 0 );
	} );

	test( 'an administrator gets links to the screens behind each part', async () => {
		await show();

		expect(
			screen.getByRole( 'link', { name: 'Open the Audio library' } )
		).toHaveAttribute( 'href', BOOT.appUrl + '#/library' );
		expect(
			screen.getByRole( 'link', { name: 'Check what is read' } )
		).toHaveAttribute( 'href', BOOT.appUrl + '#/content' );
		expect(
			screen.getByRole( 'link', { name: 'Open Insights' } )
		).toHaveAttribute( 'href', BOOT.appUrl + '#/insights' );
	} );

	test( 'it reads the post again after the post was saved', async () => {
		const { site, rerender } = await show();

		rerender( <PostPanel boot={ BOOT } refresh={ 1 } /> );

		await waitFor( () => expect( site.calls ).toHaveLength( 2 ) );
		expect( site.calls[ 1 ].method ).toBe( 'GET' );
	} );

	test( 'a panel that cannot be loaded says why and can be tried again', async () => {
		fakeSite( { failGet: { status: 500, message: 'The site is busy.' } } );
		render( <PostPanel boot={ BOOT } /> );

		expect(
			(
				await screen.findAllByText(
					'AtlasVoice could not be loaded for this post: The site is busy.'
				)
			).length
		).toBeGreaterThan( 0 );
		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect(
			await screen.findByRole( 'button', { name: 'Audio' } )
		).toBeInTheDocument();
	} );

	test( 'the panel has no accessibility problems', async () => {
		const { container } = await show();

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
