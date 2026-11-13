import '@testing-library/jest-dom';
import {
	cleanup,
	fireEvent,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { sameValue } from '../hooks/use-settings-form';
import { renderWithApp } from '../test-utils';
import PlayerPlacement, {
	dockOptions,
	positionOptions,
} from './PlayerPlacement';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const ROLES = [
	{ id: 'all', name: 'Everyone' },
	{ id: 'administrator', name: 'Administrator' },
	{ id: 'editor', name: 'Editor' },
	{ id: 'subscriber', name: 'Subscriber' },
];

/** The answer of a site with the free plugin only, as installed. */
const FREE = {
	position: 'before_content',
	dock: 'bottom_fixed',
	show_to: [ 'all' ],
	download: [ 'all' ],
	download_available: false,
	stores_audio: false,
	roles: ROLES,
};

/** The answer of a site with Pro and a voice that stores audio files. */
const PRO = { ...FREE, download_available: true, stores_audio: true };

/**
 * A stand-in for the site's placement route. A POST merges what was sent,
 * like Player\Placement::save() does.
 *
 * @param {Object} start            What the site has stored.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the first load.
 * @param {Object} options.failPost { status, message } to refuse the save.
 * @return {Object} { posts, stored, gets }.
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

/**
 * The part of the screen that asks who gets something.
 *
 * @param {string} label The question, e.g. "Show the player to".
 * @return {Object} Queries inside that radio group's form.
 */
function who( label ) {
	return within(
		screen
			.getByRole( 'group', { name: label } )
			.closest( '.atlasvoice-form' )
	);
}

afterEach( () => {
	delete window.fetch;
} );

describe( 'comparing a value on screen with the saved one', () => {
	it( 'treats two lists with the same items as the same', () => {
		expect( sameValue( [ 'editor' ], [ 'editor' ] ) ).toBe( true );
		expect( sameValue( [], [] ) ).toBe( true );
	} );

	it( 'sees a different item, length or order', () => {
		expect( sameValue( [ 'editor' ], [ 'author' ] ) ).toBe( false );
		expect( sameValue( [ 'editor' ], [ 'editor', 'author' ] ) ).toBe(
			false
		);
		expect( sameValue( [ 'a', 'b' ], [ 'b', 'a' ] ) ).toBe( false );
	} );

	it( 'compares plain values exactly', () => {
		expect( sameValue( 'none', 'none' ) ).toBe( true );
		expect( sameValue( 1, '1' ) ).toBe( false );
		expect( sameValue( [ 'all' ], 'all' ) ).toBe( false );
	} );
} );

describe( 'the choices in words', () => {
	it( 'offers the three positions the site stores', () => {
		expect( positionOptions().map( ( option ) => option.id ) ).toEqual( [
			'before_content',
			'after_content',
			'manual',
		] );
	} );

	it( 'offers the four docks of the player and no dock', () => {
		expect( dockOptions().map( ( option ) => option.id ) ).toEqual( [
			'bottom_fixed',
			'bottom_right',
			'bottom_left',
			'sticky_top',
			'none',
		] );
	} );

	it( 'explains every choice', () => {
		for ( const option of [ ...positionOptions(), ...dockOptions() ] ) {
			expect( option.title ).not.toBe( '' );
			expect( option.text ).not.toBe( '' );
		}
	} );
} );

describe( 'Player › Placement', () => {
	it( 'is the screen of the player:place route', () => {
		expect( getScreenComponent( 'player:place' ) ).toBeTruthy();
	} );

	it( 'shows what the site has stored', async () => {
		fakeSite( { ...FREE, position: 'after_content', dock: 'none' } );
		renderWithApp( <PlayerPlacement /> );

		expect(
			await screen.findByRole( 'radio', { name: 'After the content' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'radio', { name: 'Don’t follow' } )
		).toBeChecked();
		expect(
			who( 'Show the player to' ).getByRole( 'radio', {
				name: 'Everyone',
			} )
		).toBeChecked();
	} );

	it( 'writes nothing until Save, and then only what changed', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerPlacement /> );

		fireEvent.click(
			await screen.findByRole( 'radio', { name: 'After the content' } )
		);
		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { position: 'after_content' } ] )
		);
	} );

	it( 'says when the visitors see the change', async () => {
		fakeSite();
		const { context } = renderWithApp( <PlayerPlacement /> );

		fireEvent.click(
			await screen.findByRole( 'radio', { name: 'Bottom right' } )
		);
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Placement saved. Visitors see the change on their next page load.'
			)
		);
	} );

	it( 'has nothing to save when a choice is put back', async () => {
		fakeSite();
		renderWithApp( <PlayerPlacement /> );

		fireEvent.click(
			await screen.findByRole( 'radio', { name: 'Only where I add it' } )
		);
		expect( saveButton() ).toBeEnabled();

		fireEvent.click(
			screen.getByRole( 'radio', { name: 'Before the content' } )
		);
		expect( saveButton() ).toBeDisabled();
		expect( screen.getByText( 'All changes saved' ) ).toBeInTheDocument();
	} );

	describe( 'who sees the player', () => {
		it( 'shows no list of roles while everyone sees it', async () => {
			fakeSite();
			renderWithApp( <PlayerPlacement /> );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		} );

		it( 'lists the roles of the site, without "Everyone"', async () => {
			fakeSite();
			renderWithApp( <PlayerPlacement /> );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			fireEvent.click(
				who( 'Show the player to' ).getByRole( 'radio', {
					name: 'Only logged-in people with these roles',
				} )
			);

			expect(
				screen
					.getAllByRole( 'checkbox' )
					.map( ( box ) => box.labels[ 0 ].textContent )
			).toEqual( [ 'Administrator', 'Editor', 'Subscriber' ] );
		} );

		it( 'cannot be saved with no role ticked, and says why', async () => {
			const site = fakeSite();
			renderWithApp( <PlayerPlacement /> );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			fireEvent.click(
				who( 'Show the player to' ).getByRole( 'radio', {
					name: 'Only logged-in people with these roles',
				} )
			);

			expect(
				screen.getByText(
					'Choose at least one role, or choose Everyone.'
				)
			).toBeInTheDocument();
			expect( saveButton() ).toBeDisabled();
			expect( site.posts ).toHaveLength( 0 );
		} );

		it( 'saves the ticked roles and says who is left out', async () => {
			const site = fakeSite();
			renderWithApp( <PlayerPlacement /> );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			fireEvent.click(
				who( 'Show the player to' ).getByRole( 'radio', {
					name: 'Only logged-in people with these roles',
				} )
			);
			fireEvent.click(
				screen.getByRole( 'checkbox', { name: 'Subscriber' } )
			);
			fireEvent.click(
				screen.getByRole( 'checkbox', { name: 'Editor' } )
			);

			expect(
				screen.getByText(
					'Visitors who are not logged in do not see the player.'
				)
			).toBeInTheDocument();

			fireEvent.click( saveButton() );

			// In the order of the site's roles, whatever the order of the clicks.
			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ show_to: [ 'editor', 'subscriber' ] },
				] )
			);
		} );

		it( 'shows the roles a site already chose, ticked', async () => {
			fakeSite( { ...FREE, show_to: [ 'editor' ] } );
			renderWithApp( <PlayerPlacement /> );

			expect(
				await screen.findByRole( 'checkbox', { name: 'Editor' } )
			).toBeChecked();
			expect(
				screen.getByRole( 'checkbox', { name: 'Subscriber' } )
			).not.toBeChecked();
		} );

		it( 'sees no change when a role is ticked and unticked again', async () => {
			fakeSite( { ...FREE, show_to: [ 'editor' ] } );
			renderWithApp( <PlayerPlacement /> );

			const box = await screen.findByRole( 'checkbox', {
				name: 'Subscriber',
			} );
			fireEvent.click( box );
			expect( saveButton() ).toBeEnabled();

			fireEvent.click( box );
			expect( saveButton() ).toBeDisabled();
		} );

		it( 'goes back to everyone', async () => {
			const site = fakeSite( { ...FREE, show_to: [ 'editor' ] } );
			renderWithApp( <PlayerPlacement /> );
			await screen.findByRole( 'checkbox', { name: 'Editor' } );

			fireEvent.click(
				who( 'Show the player to' ).getByRole( 'radio', {
					name: 'Everyone',
				} )
			);
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { show_to: [ 'all' ] } ] )
			);
		} );
	} );

	describe( 'audio download', () => {
		it( 'asks who may download when the player has a download button', async () => {
			const site = fakeSite( PRO );
			renderWithApp( <PlayerPlacement />, { boot: { isPro: true } } );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			fireEvent.click(
				who( 'Allow audio download for' ).getByRole( 'radio', {
					name: 'Only logged-in people with these roles',
				} )
			);
			fireEvent.click(
				screen.getByRole( 'checkbox', { name: 'Administrator' } )
			);
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ download: [ 'administrator' ] },
				] )
			);
		} );

		it( 'cannot be saved with no download role ticked', async () => {
			fakeSite( PRO );
			renderWithApp( <PlayerPlacement />, { boot: { isPro: true } } );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			fireEvent.click(
				who( 'Allow audio download for' ).getByRole( 'radio', {
					name: 'Only logged-in people with these roles',
				} )
			);

			expect( saveButton() ).toBeDisabled();
		} );

		it( 'says why there is nothing to download with a browser voice (Pro)', async () => {
			fakeSite( FREE );
			const { container } = renderWithApp( <PlayerPlacement />, {
				boot: { isPro: true },
			} );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			expect(
				screen.getByText(
					/stores no file, so there is nothing to download/
				)
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'group', {
					name: 'Allow audio download for',
				} )
			).not.toBeInTheDocument();
			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 0 );
		} );
	} );

	describe( 'in the free plugin (wp.org guideline 5)', () => {
		it( 'has no download control, only one line about Pro that opens the Plans tab', async () => {
			fakeSite();
			const { container, context } = renderWithApp( <PlayerPlacement /> );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			expect(
				screen.queryByRole( 'group', {
					name: 'Allow audio download for',
				} )
			).not.toBeInTheDocument();
			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 1 );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'See Pro' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
		} );

		it( 'has no disabled control: every choice on the screen works without Pro', async () => {
			fakeSite();
			const { container } = renderWithApp( <PlayerPlacement /> );
			await screen.findByRole( 'radio', { name: 'Before the content' } );

			expect(
				container.querySelectorAll(
					'input[disabled], select[disabled], [aria-disabled="true"]'
				)
			).toHaveLength( 0 );
		} );
	} );

	it( 'says why a save was refused and keeps the choice on screen', async () => {
		fakeSite( FREE, {
			failPost: {
				status: 400,
				message: 'This site has no role called "x".',
			},
		} );
		const { context } = renderWithApp( <PlayerPlacement /> );

		fireEvent.click(
			await screen.findByRole( 'radio', { name: 'Top of the screen' } )
		);
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: This site has no role called "x".',
				'error'
			)
		);
		expect(
			screen.getByRole( 'radio', { name: 'Top of the screen' } )
		).toBeChecked();
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();
	} );

	it( 'offers to try again when the placement cannot be loaded', async () => {
		const site = fakeSite( FREE, {
			failGet: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <PlayerPlacement /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect(
			await screen.findByRole( 'radio', { name: 'Before the content' } )
		).toBeChecked();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'survives an answer without roles or lists', async () => {
		fakeSite( { position: 'manual', dock: 'none' } );
		renderWithApp( <PlayerPlacement /> );

		expect(
			await screen.findByRole( 'radio', { name: 'Only where I add it' } )
		).toBeChecked();
	} );

	it( 'groups each choice under a name a screen reader announces', async () => {
		fakeSite( PRO );
		renderWithApp( <PlayerPlacement />, { boot: { isPro: true } } );
		await screen.findByRole( 'radio', { name: 'Before the content' } );

		expect(
			within(
				screen.getByRole( 'group', {
					name: 'Where it sits in the post',
				} )
			).getAllByRole( 'radio' )
		).toHaveLength( 3 );
		expect(
			within(
				screen.getByRole( 'group', { name: 'While scrolling' } )
			).getAllByRole( 'radio' )
		).toHaveLength( 5 );
		expect(
			screen.getByRole( 'radio', { name: 'Bottom, full width' } )
		).toHaveAccessibleDescription( 'A bar along the bottom edge.' );
	} );

	it( 'has no accessibility violations with and without Pro', async () => {
		fakeSite( { ...FREE, show_to: [ 'editor' ] } );
		const free = renderWithApp( <PlayerPlacement /> );
		await screen.findByRole( 'checkbox', { name: 'Editor' } );
		expect( await axe( free.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite( { ...PRO, download: [ 'administrator' ] } );
		const pro = renderWithApp( <PlayerPlacement />, {
			boot: { isPro: true },
		} );
		await screen.findByRole( 'checkbox', { name: 'Administrator' } );
		expect( await axe( pro.container ) ).toHaveNoViolations();
	} );
} );
