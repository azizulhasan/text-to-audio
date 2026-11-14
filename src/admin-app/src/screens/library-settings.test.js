import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import LibrarySettings from './LibrarySettings';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

/** What a site with the natural voice connected answers (TTA\Library\Audio). */
const SAVED = { when: 'play', available: true, reason: '' };

/**
 * A stand-in for the site's route. A POST merges what was sent.
 *
 * @param {Object} start            What the site has stored.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the first load.
 * @param {Object} options.failPost { status, message } to refuse the save.
 * @return {Object} { posts, gets }.
 */
function fakeSite( start = SAVED, { failGet, failPost } = {} ) {
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
const onPlay = () =>
	screen.findByRole( 'radio', { name: 'On the first play' } );
const onPublish = () =>
	screen.getByRole( 'radio', { name: 'When a post is published' } );

describe( 'Audio library › Settings', () => {
	it( 'is the screen of the route library:settings', () => {
		expect( getScreenComponent( 'library:settings' ) ).toBeTruthy();
	} );

	it( 'shows the first play as the choice of a site that never chose', async () => {
		fakeSite();
		renderWithApp( <LibrarySettings />, { hash: '#/library/settings' } );

		expect( await onPlay() ).toBeChecked();
		expect( onPublish() ).not.toBeChecked();
		expect( saveButton() ).toBeDisabled();
	} );

	it( 'says that publishing sends text before the choice is saved', async () => {
		const site = fakeSite();
		const { container } = renderWithApp( <LibrarySettings />, {
			hash: '#/library/settings',
		} );
		await onPlay();

		expect( container ).not.toHaveTextContent(
			'is sent to the AtlasVoice service'
		);
		fireEvent.click( onPublish() );

		expect( container ).toHaveTextContent(
			'the text of every post you publish or change is sent to the AtlasVoice service'
		);
		expect( container ).toHaveTextContent(
			'counts against your characters'
		);
		expect( site.posts ).toEqual( [] );
	} );

	it( 'saves only the choice, when Save is pressed', async () => {
		const site = fakeSite();
		const { context } = renderWithApp( <LibrarySettings />, {
			hash: '#/library/settings',
		} );
		await onPlay();

		fireEvent.click( onPublish() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { when: 'publish' } ] )
		);
		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Audio settings saved.'
			)
		);
		await waitFor( () => expect( saveButton() ).toBeDisabled() );
	} );

	it( 'can go back to the first play', async () => {
		const site = fakeSite( { ...SAVED, when: 'publish' } );
		renderWithApp( <LibrarySettings />, { hash: '#/library/settings' } );

		fireEvent.click( await onPlay() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { when: 'play' } ] )
		);
	} );

	it( 'says what is needed when the site is not connected to the service', async () => {
		fakeSite( { when: 'play', available: false, reason: 'not_connected' } );
		const { container, context } = renderWithApp( <LibrarySettings />, {
			hash: '#/library/settings',
		} );
		await onPlay();

		expect( container ).toHaveTextContent(
			'needs this site to be connected to the AtlasVoice service'
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Open Voice' } ) );
		expect( context.go ).toHaveBeenCalledWith( 'voice:voice' );
	} );

	it( 'says so when the voice in use is not made in the background', async () => {
		fakeSite( { when: 'play', available: false, reason: 'voice' } );
		const { container } = renderWithApp( <LibrarySettings />, {
			hash: '#/library/settings',
		} );
		await onPlay();

		expect( container ).toHaveTextContent(
			'works with the voices of the AtlasVoice service'
		);
	} );

	it( 'opens All posts to make the audio of one post', async () => {
		fakeSite();
		const { context } = renderWithApp( <LibrarySettings />, {
			hash: '#/library/settings',
		} );
		await onPlay();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Open All posts' } )
		);
		expect( context.go ).toHaveBeenCalledWith( 'library:all' );
	} );

	it( 'keeps the choice and shows the site’s message when the save fails', async () => {
		fakeSite( SAVED, {
			failPost: { status: 500, message: 'The database is away.' },
		} );
		const { context } = renderWithApp( <LibrarySettings />, {
			hash: '#/library/settings',
		} );
		await onPlay();

		fireEvent.click( onPublish() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				expect.stringContaining( 'The database is away.' ),
				'error'
			)
		);
		expect( onPublish() ).toBeChecked();
		expect( saveButton() ).toBeEnabled();
	} );

	it( 'shows the site’s message when loading fails, and tries again', async () => {
		fakeSite( SAVED, {
			failGet: { status: 403, message: 'You are not allowed.' },
		} );
		const { container } = renderWithApp( <LibrarySettings />, {
			hash: '#/library/settings',
		} );

		await waitFor( () =>
			expect( container ).toHaveTextContent(
				'The audio settings could not be loaded: You are not allowed.'
			)
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect( await onPlay() ).toBeChecked();
	} );

	it( 'has no accessibility violations', async () => {
		fakeSite();
		const { container } = renderWithApp( <LibrarySettings />, {
			hash: '#/library/settings',
		} );
		await onPlay();
		fireEvent.click( onPublish() );

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
