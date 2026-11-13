import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import ContentAreas, { isSelector, isTag } from './ContentAreas';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

/** What a site with the free plugin answers (TTA\Content\Areas). */
const FREE = {
	selector: '',
	skip_areas: [ '.atlasvoice_no_read' ],
	skip_tags: [ 'aside', 'figure' ],
	skip_phrases: [],
	types: [],
	types_applied: false,
};

/** With Pro and a rule for Pages. */
const PRO = {
	...FREE,
	selector: '.entry-content',
	types: [
		{
			post_type: 'page',
			name: 'Pages',
			selector: 'main .page-body',
			skip_areas: [ '.promo' ],
			skip_tags: [ 'figure' ],
			skip_phrases: [],
		},
	],
	types_applied: true,
};

/**
 * A stand-in for the site: the areas route (a POST merges what was sent)
 * and the route that names a post to open the picker on.
 *
 * @param {Object} start            What the site has stored.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the first load.
 * @param {Object} options.failPost { status, message } to refuse the save.
 * @param {Object} options.sample   What the picker route answers.
 * @return {Object} { posts, stored, gets, urls }.
 */
function fakeSite( start = FREE, { failGet, failPost, sample } = {} ) {
	const site = { posts: [], gets: 0, urls: [], stored: { ...start } };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( url, options = {} ) => {
		site.urls.push( url );
		if ( String( url ).includes( 'step-rail/sample-url' ) ) {
			return reply(
				sample || {
					url: 'https://site.test/a-post/?atlasvoice_picker=1',
				}
			);
		}

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
const selectorField = () =>
	screen.findByRole( 'textbox', {
		name: 'CSS selector of the article text',
	} );

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
	jest.restoreAllMocks();
} );

describe( 'what the site accepts', () => {
	it( 'takes real CSS selectors', () => {
		for ( const text of [
			'.entry-content',
			'#main > article .story',
			'div[data-role="text"]',
			'article:not(.promo) p',
		] ) {
			expect( isSelector( text ) ).toBe( true );
		}
	} );

	it( 'refuses markup, a rule block, two lines and nothing', () => {
		for ( const text of [
			'<script>',
			'.x{display:none}',
			'.a\n.b',
			'.a|.b',
			'',
			'   ',
			'a'.repeat( 2049 ),
		] ) {
			expect( isSelector( text ) ).toBe( false );
		}
	} );

	it( 'takes element names and nothing else as an element type', () => {
		expect( isTag( 'figure' ) ).toBe( true );
		expect( isTag( 'H2' ) ).toBe( true );
		expect( isTag( 'div.promo' ) ).toBe( false );
		expect( isTag( '<figure>' ) ).toBe( false );
		expect( isTag( '2col' ) ).toBe( false );
	} );
} );

describe( 'What is read › Page areas', () => {
	it( 'is the screen of the content:areas route', () => {
		expect( getScreenComponent( 'content:areas' ) ).toBeTruthy();
	} );

	it( 'shows the rule the site has stored', async () => {
		fakeSite( PRO );
		renderWithApp( <ContentAreas />, { boot: { isPro: true } } );

		expect( await selectorField() ).toHaveValue( '.entry-content' );
		expect( screen.getByText( '.atlasvoice_no_read' ) ).toBeInTheDocument();
		expect( screen.getByText( 'aside' ) ).toBeInTheDocument();
	} );

	it( 'writes nothing until Save, and then only what changed', async () => {
		const site = fakeSite();
		renderWithApp( <ContentAreas /> );

		fireEvent.change( await selectorField(), {
			target: { value: '.entry-content' },
		} );
		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { selector: '.entry-content' } ] )
		);
	} );

	it( 'says stored audio keeps its old text until it is made again', async () => {
		fakeSite();
		const { context } = renderWithApp( <ContentAreas /> );

		fireEvent.change( await selectorField(), {
			target: { value: '.story' },
		} );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Saved. Posts with a stored audio file keep their old audio until it is made again.'
			)
		);
	} );

	it( 'cannot save a selector that is not one, and says how to write it', async () => {
		const site = fakeSite();
		renderWithApp( <ContentAreas /> );

		fireEvent.change( await selectorField(), {
			target: { value: '.x{display:none}' },
		} );

		expect(
			screen.getByText(
				'This is not a CSS selector. Use one line, without < { } or |.'
			)
		).toBeInTheDocument();
		expect( saveButton() ).toBeDisabled();
		expect( site.posts ).toHaveLength( 0 );
	} );

	it( 'can remove the selector, so the player finds the text itself', async () => {
		const site = fakeSite( PRO );
		renderWithApp( <ContentAreas />, { boot: { isPro: true } } );

		fireEvent.change( await selectorField(), { target: { value: '' } } );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { selector: '' } ] )
		);
	} );

	describe( 'skipping parts', () => {
		it( 'adds an area by its selector', async () => {
			const site = fakeSite();
			renderWithApp( <ContentAreas /> );
			await selectorField();

			addToken( 'Areas (CSS selectors)', '.share-bar' );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ skip_areas: [ '.atlasvoice_no_read', '.share-bar' ] },
				] )
			);
		} );

		it( 'does not take markup as an area', async () => {
			fakeSite();
			renderWithApp( <ContentAreas /> );
			await selectorField();

			addToken( 'Areas (CSS selectors)', '<b>' );

			expect( saveButton() ).toBeDisabled();
		} );

		it( 'adds an element type in small letters', async () => {
			const site = fakeSite();
			renderWithApp( <ContentAreas /> );
			await selectorField();

			addToken( 'Element types', 'TABLE' );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ skip_tags: [ 'aside', 'figure', 'table' ] },
				] )
			);
		} );

		it( 'does not take a class as an element type', async () => {
			fakeSite();
			renderWithApp( <ContentAreas /> );
			await selectorField();

			addToken( 'Element types', 'div.promo' );

			expect( saveButton() ).toBeDisabled();
		} );

		it( 'adds phrases one per line, commas and all', async () => {
			const site = fakeSite();
			renderWithApp( <ContentAreas /> );
			await selectorField();

			fireEvent.change(
				screen.getByRole( 'textbox', {
					name: 'Phrases, one per line',
				} ),
				{ target: { value: 'Read more, here\nShare this' } }
			);
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [
					{ skip_phrases: [ 'Read more, here', 'Share this' ] },
				] )
			);
		} );

		it( 'has nothing to save when the phrases are typed and removed again', async () => {
			fakeSite();
			renderWithApp( <ContentAreas /> );
			await selectorField();

			const phrases = screen.getByRole( 'textbox', {
				name: 'Phrases, one per line',
			} );
			fireEvent.change( phrases, { target: { value: 'Share this' } } );
			expect( saveButton() ).toBeEnabled();

			fireEvent.change( phrases, { target: { value: '' } } );
			expect( saveButton() ).toBeDisabled();
		} );
	} );

	describe( 'Pick it on a page', () => {
		it( 'opens the picker on the post the site names, in a new tab', async () => {
			const open = jest
				.spyOn( window, 'open' )
				.mockImplementation( () => null );
			const site = fakeSite();
			renderWithApp( <ContentAreas /> );
			await selectorField();

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Pick it on a page' } )
			);

			await waitFor( () =>
				expect( open ).toHaveBeenCalledWith(
					'https://site.test/a-post/?atlasvoice_picker=1',
					'_blank',
					'noopener'
				)
			);
			expect( site.urls ).toContain(
				'https://site.test/wp-json/tta/v1/step-rail/sample-url?scope=global'
			);
			expect( site.posts ).toHaveLength( 0 );
		} );

		it( 'says why when there is no post to open it on', async () => {
			const open = jest
				.spyOn( window, 'open' )
				.mockImplementation( () => null );
			fakeSite( FREE, {
				sample: {
					url: '',
					reason: 'No matching published post found.',
				},
			} );
			const { context } = renderWithApp( <ContentAreas /> );
			await selectorField();

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Pick it on a page' } )
			);

			await waitFor( () =>
				expect( context.notify ).toHaveBeenCalledWith(
					'No matching published post found.',
					'error'
				)
			);
			expect( open ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'rules for one content type', () => {
		it( 'lists them with what they read and skip (Pro)', async () => {
			fakeSite( PRO );
			const { container } = renderWithApp( <ContentAreas />, {
				boot: { isPro: true },
			} );
			await selectorField();

			const row = within( screen.getByRole( 'table' ) ).getByRole(
				'rowheader',
				{ name: 'Pages' }
			).parentElement;
			expect(
				within( row ).getByText( 'main .page-body' )
			).toBeInTheDocument();
			expect(
				within( row ).getByText( '.promo, figure' )
			).toBeInTheDocument();
			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 0 );
		} );

		it( 'shows no table when there is none', async () => {
			fakeSite( { ...PRO, types: [] } );
			renderWithApp( <ContentAreas />, { boot: { isPro: true } } );
			await selectorField();

			expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
		} );

		it( 'says stored rules are not applied on a site without Pro', async () => {
			fakeSite( { ...PRO, types_applied: false } );
			renderWithApp( <ContentAreas /> );
			await selectorField();

			expect(
				screen.getByText( /stored but not applied on this site/ )
			).toBeInTheDocument();
		} );
	} );

	describe( 'in the free plugin (wp.org guideline 5)', () => {
		it( 'has the whole-site rule working, and one line about Pro', async () => {
			fakeSite();
			const { container, context } = renderWithApp( <ContentAreas /> );
			await selectorField();

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
	} );

	it( 'says why a save was refused and keeps the rule on screen', async () => {
		fakeSite( FREE, {
			failPost: { status: 400, message: 'This is not a CSS selector.' },
		} );
		const { context } = renderWithApp( <ContentAreas /> );

		fireEvent.change( await selectorField(), {
			target: { value: '.story' },
		} );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: This is not a CSS selector.',
				'error'
			)
		);
		expect( await selectorField() ).toHaveValue( '.story' );
	} );

	it( 'offers to try again when the rules cannot be loaded', async () => {
		const site = fakeSite( FREE, {
			failGet: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <ContentAreas /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await selectorField() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'survives an answer without lists', async () => {
		fakeSite( { selector: null, types_applied: true } );
		renderWithApp( <ContentAreas /> );

		expect( await selectorField() ).toHaveValue( '' );
	} );

	it( 'has no accessibility violations with and without Pro', async () => {
		fakeSite();
		const free = renderWithApp( <ContentAreas /> );
		await selectorField();
		expect( await axe( free.container ) ).toHaveNoViolations();
		free.unmount();

		fakeSite( PRO );
		const pro = renderWithApp( <ContentAreas />, {
			boot: { isPro: true },
		} );
		await selectorField();
		expect( await axe( pro.container ) ).toHaveNoViolations();
	} );
} );
