import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { choiceLabels } from '../shell/TokenChoice';
import { renderWithApp } from '../test-utils';
import ContentWhere, { isPostNumber } from './ContentWhere';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const CHOICES = {
	post_types: [
		{ id: 'post', name: 'Posts' },
		{ id: 'page', name: 'Pages' },
		{ id: 'product', name: 'Products' },
	],
	statuses: [
		{ id: 'publish', name: 'Published' },
		{ id: 'private', name: 'Private' },
		{ id: 'draft', name: 'Draft' },
	],
	categories: [
		{ id: 'podcasts', name: 'Podcasts' },
		{ id: 'news', name: 'News' },
	],
	tags: [
		{ id: 'video', name: 'Video' },
		{ id: 'sponsored', name: 'Sponsored' },
	],
};

/** What a new site answers (TTA\Content\Where). */
const WHERE = {
	automatic: true,
	post_types: [ 'post' ],
	statuses: [ 'publish' ],
	skip_categories: [],
	skip_tags: [],
	skip_posts: [],
	skipped_posts: [],
	choices: CHOICES,
};

/**
 * A stand-in for the site's route. A POST merges what was sent.
 *
 * @param {Object} start            What the site has stored.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the first load.
 * @param {Object} options.failPost { status, message } to refuse the save.
 * @return {Object} { posts, stored, gets }.
 */
function fakeSite( start = {}, { failGet, failPost } = {} ) {
	const site = { posts: [], gets: 0, stored: { ...WHERE, ...start } };
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
const ready = () =>
	screen.findByRole( 'checkbox', { name: 'Add the player automatically' } );

/**
 * Types a token into a token field and presses Enter.
 *
 * @param {string} label The label of the field.
 * @param {string} text  What to type.
 */
function addToken( label, text ) {
	const input = screen.getByRole( 'combobox', { name: label } );
	fireEvent.change( input, { target: { value: text } } );
	fireEvent.keyDown( input, { key: 'Enter', code: 'Enter', keyCode: 13 } );
}

afterEach( () => {
	delete window.fetch;
} );

describe( 'a post number', () => {
	it( 'is a whole number above zero', () => {
		expect( isPostNumber( '128' ) ).toBe( true );
		expect( isPostNumber( ' 7 ' ) ).toBe( true );
	} );

	it( 'is not a title, a zero, a negative or a decimal', () => {
		for ( const text of [ 'About us', '0', '-4', '1.5', '', '12a' ] ) {
			expect( isPostNumber( text ) ).toBe( false );
		}
	} );
} );

describe( 'what a choice is called', () => {
	it( 'is its name, and maps back to its id whatever the capitals', () => {
		const { labelOf, idOf } = choiceLabels( CHOICES.categories );

		expect( labelOf( 'podcasts' ) ).toBe( 'Podcasts' );
		expect( idOf( 'podcasts' ) ).toBe( 'podcasts' );
		expect( idOf( ' PODCASTS ' ) ).toBe( 'podcasts' );
		expect( idOf( 'Nope' ) ).toBeNull();
	} );

	it( 'tells two choices with the same name apart', () => {
		const { labelOf, idOf } = choiceLabels( [
			{ id: 'news', name: 'News' },
			{ id: 'news-2', name: 'News' },
		] );

		expect( labelOf( 'news-2' ) ).toBe( 'News (news-2)' );
		expect( idOf( 'News (news-2)' ) ).toBe( 'news-2' );
	} );

	it( 'shows a stored id that is no longer in the list as itself', () => {
		expect( choiceLabels( CHOICES.tags ).labelOf( 'gone' ) ).toBe( 'gone' );
	} );
} );

describe( 'What is read › Where it appears', () => {
	it( 'is the screen of the content:where route', () => {
		expect( getScreenComponent( 'content:where' ) ).toBeTruthy();
	} );

	it( 'shows what the site has stored', async () => {
		fakeSite( {
			post_types: [ 'post', 'product' ],
			skip_categories: [ 'podcasts' ],
			skip_posts: [ 12, 128 ],
			skipped_posts: [
				{ id: 12, title: 'About us' },
				{ id: 128, title: '' },
			],
		} );
		renderWithApp( <ContentWhere /> );

		expect( await ready() ).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Posts' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Pages' } )
		).not.toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Products' } )
		).toBeChecked();
		expect( screen.getByText( 'Podcasts' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Published' ) ).toBeInTheDocument();
		// A skipped post shows its title where the site knows it.
		expect( screen.getByText( '12: About us' ) ).toBeInTheDocument();
		expect( screen.queryByText( /^128:/ ) ).not.toBeInTheDocument();
	} );

	it( 'writes nothing until Save, and then only what changed', async () => {
		const site = fakeSite();
		renderWithApp( <ContentWhere /> );
		await ready();

		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Pages' } ) );
		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [
				{ post_types: [ 'post', 'page' ] },
			] )
		);
	} );

	it( 'says a page cache may show the old page', async () => {
		fakeSite();
		const { context } = renderWithApp( <ContentWhere /> );

		fireEvent.click( await ready() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Saved. Cached pages may show the old page until your cache clears.'
			)
		);
	} );

	it( 'turns automatic placement off', async () => {
		const site = fakeSite();
		renderWithApp( <ContentWhere /> );

		fireEvent.click( await ready() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { automatic: false } ] )
		);
	} );

	it( 'keeps content types in the order of the site, whatever the order of the clicks', async () => {
		const site = fakeSite();
		renderWithApp( <ContentWhere /> );
		await ready();

		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Products' } ) );
		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Pages' } ) );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [
				{ post_types: [ 'post', 'page', 'product' ] },
			] )
		);
	} );

	it( 'cannot be saved without a content type, and says why', async () => {
		const site = fakeSite();
		renderWithApp( <ContentWhere /> );
		await ready();

		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Posts' } ) );

		expect(
			screen.getByText( 'Choose at least one content type.' )
		).toBeInTheDocument();
		expect( saveButton() ).toBeDisabled();
		expect( site.posts ).toHaveLength( 0 );
	} );

	it( 'has nothing to save when a box is ticked and unticked again', async () => {
		fakeSite();
		renderWithApp( <ContentWhere /> );
		await ready();

		const pages = screen.getByRole( 'checkbox', { name: 'Pages' } );
		fireEvent.click( pages );
		expect( saveButton() ).toBeEnabled();

		fireEvent.click( pages );
		expect( saveButton() ).toBeDisabled();
	} );

	describe( 'skipping posts', () => {
		it( 'skips a category chosen by its name, and stores its slug', async () => {
			const site = fakeSite();
			renderWithApp( <ContentWhere /> );
			await ready();

			addToken( 'Categories', 'Podcasts' );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ skip_categories: [ 'podcasts' ] },
				] )
			);
		} );

		it( 'does not take a category the site does not have', async () => {
			const site = fakeSite();
			renderWithApp( <ContentWhere /> );
			await ready();

			addToken( 'Categories', 'Spaceships' );

			expect( saveButton() ).toBeDisabled();
			expect( site.posts ).toHaveLength( 0 );
		} );

		it( 'skips a tag', async () => {
			const site = fakeSite();
			renderWithApp( <ContentWhere /> );
			await ready();

			addToken( 'Tags', 'video' );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { skip_tags: [ 'video' ] } ] )
			);
		} );

		it( 'skips single posts by number, as numbers', async () => {
			const site = fakeSite( { skip_posts: [ 12 ] } );
			renderWithApp( <ContentWhere /> );
			await ready();

			addToken( 'Single posts, by number', '128' );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { skip_posts: [ 12, 128 ] } ] )
			);
		} );

		it( 'does not take a title as a post number', async () => {
			fakeSite();
			renderWithApp( <ContentWhere /> );
			await ready();

			addToken( 'Single posts, by number', 'About us' );

			expect( saveButton() ).toBeDisabled();
		} );

		it( 'keeps a stored category that was deleted since, shown by its slug', async () => {
			const site = fakeSite( { skip_categories: [ 'gone' ] } );
			renderWithApp( <ContentWhere /> );
			await ready();

			expect( screen.getByText( 'gone' ) ).toBeInTheDocument();

			addToken( 'Categories', 'News' );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ skip_categories: [ 'gone', 'news' ] },
				] )
			);
		} );
	} );

	it( 'adds a second status', async () => {
		const site = fakeSite();
		renderWithApp( <ContentWhere /> );
		await ready();

		addToken( 'Post statuses', 'Private' );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [
				{ statuses: [ 'publish', 'private' ] },
			] )
		);
	} );

	it( 'is the same with and without Pro: no limit, no Pro line, no disabled control', async () => {
		fakeSite();
		const { container } = renderWithApp( <ContentWhere /> );
		await ready();

		expect(
			container.querySelectorAll(
				'.atlasvoice-pronote, .atlasvoice-pro, input[disabled], [aria-disabled="true"]'
			)
		).toHaveLength( 0 );
	} );

	it( 'says why a save was refused and keeps the choice on screen', async () => {
		fakeSite(
			{},
			{ failPost: { status: 400, message: 'Choose at least one.' } }
		);
		const { context } = renderWithApp( <ContentWhere /> );
		await ready();

		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Pages' } ) );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: Choose at least one.',
				'error'
			)
		);
		expect(
			screen.getByRole( 'checkbox', { name: 'Pages' } )
		).toBeChecked();
	} );

	it( 'offers to try again when the settings cannot be loaded', async () => {
		const site = fakeSite(
			{},
			{ failGet: { status: 500, message: 'Server error' } }
		);
		renderWithApp( <ContentWhere /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await ready() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'survives an answer without lists or choices', async () => {
		fakeSite( {
			post_types: null,
			statuses: 'publish',
			skip_posts: undefined,
			choices: null,
		} );
		renderWithApp( <ContentWhere /> );

		expect( await ready() ).toBeChecked();
	} );

	it( 'has no accessibility violations', async () => {
		fakeSite( {
			skip_categories: [ 'podcasts' ],
			skip_posts: [ 12 ],
			skipped_posts: [ { id: 12, title: 'About us' } ],
		} );
		const { container } = renderWithApp( <ContentWhere /> );
		await ready();

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
