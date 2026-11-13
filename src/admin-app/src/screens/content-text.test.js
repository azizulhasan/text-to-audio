import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import ContentText, { TEXT_LENGTH } from './ContentText';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

/** What a site with the free plugin answers (TTA\Content\Text). */
const FREE = {
	title: true,
	excerpt: false,
	intro: '',
	outro: '',
	numbers: false,
	as_seen: false,
	wrapper: true,
	status_column: false,
	extras_available: false,
};

/** With a player that applies the two extra switches (Pro). */
const PRO = { ...FREE, extras_available: true };

/**
 * A stand-in for the site's route. A POST merges what was sent.
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
const box = ( name ) => screen.getByRole( 'checkbox', { name } );
const ready = () => screen.findByRole( 'checkbox', { name: 'The post title' } );

afterEach( () => {
	delete window.fetch;
} );

describe( 'What is read › Text to read', () => {
	it( 'is the screen of the content:text route', () => {
		expect( getScreenComponent( 'content:text' ) ).toBeTruthy();
	} );

	it( 'shows what the site has stored', async () => {
		fakeSite( {
			...FREE,
			title: false,
			excerpt: true,
			intro: 'Welcome.',
			status_column: true,
		} );
		renderWithApp( <ContentText /> );

		expect( await ready() ).not.toBeChecked();
		expect( box( 'The excerpt' ) ).toBeChecked();
		expect(
			screen.getByRole( 'textbox', { name: 'Read before every post' } )
		).toHaveValue( 'Welcome.' );
		expect(
			box( 'Audio status column in the list of posts' )
		).toBeChecked();
		expect(
			box( 'Mark the post content with an extra wrapper' )
		).toBeChecked();
	} );

	it( 'writes nothing until Save, and then only what changed', async () => {
		const site = fakeSite();
		renderWithApp( <ContentText /> );
		await ready();

		fireEvent.click( box( 'The excerpt' ) );
		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { excerpt: true } ] )
		);
	} );

	it( 'says stored audio keeps its old text until it is made again', async () => {
		fakeSite();
		const { context } = renderWithApp( <ContentText /> );

		fireEvent.click( await ready() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Saved. Posts with a stored audio file keep their old audio until it is made again.'
			)
		);
	} );

	it( 'saves the sentences read before and after every post', async () => {
		const site = fakeSite();
		renderWithApp( <ContentText /> );
		await ready();

		fireEvent.change(
			screen.getByRole( 'textbox', { name: 'Read before every post' } ),
			{ target: { value: 'You are listening to Hearth and Grain.' } }
		);
		fireEvent.change(
			screen.getByRole( 'textbox', { name: 'Read after every post' } ),
			{ target: { value: 'Thanks for listening.' } }
		);
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [
				{
					intro: 'You are listening to Hearth and Grain.',
					outro: 'Thanks for listening.',
				},
			] )
		);
	} );

	it( 'stops a sentence at the length the site accepts', async () => {
		fakeSite();
		renderWithApp( <ContentText /> );
		await ready();

		expect(
			screen.getByRole( 'textbox', { name: 'Read before every post' } )
		).toHaveAttribute( 'maxlength', String( TEXT_LENGTH ) );
	} );

	it( 'has nothing to save when a sentence is typed and removed again', async () => {
		fakeSite();
		renderWithApp( <ContentText /> );
		await ready();

		const intro = screen.getByRole( 'textbox', {
			name: 'Read before every post',
		} );
		fireEvent.change( intro, { target: { value: 'Welcome.' } } );
		expect( saveButton() ).toBeEnabled();

		fireEvent.change( intro, { target: { value: '' } } );
		expect( saveButton() ).toBeDisabled();
	} );

	it( 'saves the advanced switches', async () => {
		const site = fakeSite();
		renderWithApp( <ContentText /> );
		await ready();

		fireEvent.click( box( 'Mark the post content with an extra wrapper' ) );
		fireEvent.click( box( 'Audio status column in the list of posts' ) );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [
				{ wrapper: false, status_column: true },
			] )
		);
	} );

	describe( 'with a player that applies the extras (Pro)', () => {
		it( 'shows and saves "numbers as words" and "as the visitor sees it"', async () => {
			const site = fakeSite( PRO );
			const { container } = renderWithApp( <ContentText />, {
				boot: { isPro: true },
			} );
			await ready();

			fireEvent.click( box( 'Say numbers as words' ) );
			fireEvent.click( box( 'Read the page as the visitor sees it' ) );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ numbers: true, as_seen: true },
				] )
			);
			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 0 );
		} );
	} );

	describe( 'in the free plugin (wp.org guideline 5)', () => {
		it( 'leaves the two extras out and shows one line about Pro', async () => {
			fakeSite();
			const { container, context } = renderWithApp( <ContentText /> );
			await ready();

			expect(
				screen.queryByRole( 'checkbox', {
					name: 'Say numbers as words',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'checkbox', {
					name: 'Read the page as the visitor sees it',
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

		it( 'has no disabled control', async () => {
			fakeSite();
			const { container } = renderWithApp( <ContentText /> );
			await ready();

			expect(
				container.querySelectorAll(
					'input[disabled], textarea[disabled], [aria-disabled="true"]'
				)
			).toHaveLength( 0 );
		} );
	} );

	it( 'says why a save was refused and keeps the choice on screen', async () => {
		fakeSite( FREE, {
			failPost: { status: 400, message: 'This must be text.' },
		} );
		const { context } = renderWithApp( <ContentText /> );
		await ready();

		fireEvent.click( box( 'The excerpt' ) );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: This must be text.',
				'error'
			)
		);
		expect( box( 'The excerpt' ) ).toBeChecked();
	} );

	it( 'offers to try again when the settings cannot be loaded', async () => {
		const site = fakeSite( FREE, {
			failGet: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <ContentText /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await ready() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'survives an answer without sentences', async () => {
		fakeSite( { title: true } );
		renderWithApp( <ContentText /> );

		expect( await ready() ).toBeChecked();
		expect(
			screen.getByRole( 'textbox', { name: 'Read before every post' } )
		).toHaveValue( '' );
	} );

	it( 'has no accessibility violations with and without Pro', async () => {
		fakeSite();
		const free = renderWithApp( <ContentText /> );
		await ready();
		expect( await axe( free.container ) ).toHaveNoViolations();
		free.unmount();

		fakeSite( PRO );
		const pro = renderWithApp( <ContentText />, {
			boot: { isPro: true },
		} );
		await ready();
		expect( await axe( pro.container ) ).toHaveNoViolations();
	} );
} );
