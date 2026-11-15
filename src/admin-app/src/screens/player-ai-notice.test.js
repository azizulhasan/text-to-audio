import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import PlayerAiNotice, { TEXT_LENGTH } from './PlayerAiNotice';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const DEFAULT_TEXT = 'This article is read by an AI-generated voice.';

/** What a site that never set the notice answers (TTA\Player\AI_Notice). */
const OFF = {
	enabled: false,
	text: '',
	position: 'after',
	default_text: DEFAULT_TEXT,
};

/** What a free site that never set the credit line answers (TTA\Player\Credit). */
const CREDIT_OFF = {
	enabled: false,
	text: 'Voiced by AtlasVoice',
	available: true,
	showing: false,
	// Not sent by the site: whether this stand-in site uses the natural voice.
	natural: true,
};

/**
 * A stand-in for the site's AI notice route. A POST merges what was sent,
 * like Player\AI_Notice::save() does.
 *
 * @param {Object} start              What the site has stored.
 * @param {Object} options
 * @param {Object} options.failGet    { status, message } to refuse the first load.
 * @param {Object} options.failPost   { status, message } to refuse the save.
 * @param {Object} options.credit     What the credit route answers (TTA\Player\Credit).
 * @param {Object} options.failCredit { status, message } to refuse the load of the credit line.
 * @return {Object} { posts, stored, gets, credit, creditPosts }.
 */
function fakeSite(
	start = {},
	{ failGet, failPost, credit = {}, failCredit } = {}
) {
	const site = {
		posts: [],
		gets: 0,
		stored: { ...OFF, ...start },
		credit: { ...CREDIT_OFF, ...credit },
		creditPosts: [],
		creditGets: 0,
	};
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( _url, options = {} ) => {
		if ( String( _url ).includes( 'credit' ) ) {
			if ( options.method === 'POST' ) {
				const sent = JSON.parse( options.body );
				site.creditPosts.push( sent );
				site.credit = {
					...site.credit,
					...sent,
					showing: !! sent.enabled && site.credit.natural,
				};

				return reply( site.credit );
			}
			site.creditGets++;
			if ( failCredit && site.creditGets === 1 ) {
				return reply(
					{ message: failCredit.message },
					false,
					failCredit.status
				);
			}

			return reply( site.credit );
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
const toggle = () =>
	screen.findByRole( 'checkbox', { name: 'Show the AI notice' } );
const preview = () =>
	within( screen.getByRole( 'complementary', { name: 'Preview' } ) );
const notice = ( container ) =>
	container.querySelector( '.atlasvoice-ai-notice-preview' );

afterEach( () => {
	delete window.fetch;
} );

describe( 'Player › AI notice', () => {
	it( 'is the screen of the player:ai route', () => {
		expect( getScreenComponent( 'player:ai' ) ).toBeTruthy();
	} );

	it( 'is off on a site that never set it, and shows only the switch', async () => {
		fakeSite();
		const { container } = renderWithApp( <PlayerAiNotice /> );

		expect( await toggle() ).not.toBeChecked();
		expect(
			screen.queryByRole( 'textbox', { name: 'Notice text' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'radio', { name: 'Above the player' } )
		).not.toBeInTheDocument();
		expect( notice( container ) ).toBeNull();
		expect(
			preview().getByText(
				'The notice is off, so the player shows without it.'
			)
		).toBeInTheDocument();
	} );

	it( 'writes nothing until Save, and then only what changed', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerAiNotice /> );

		fireEvent.click( await toggle() );
		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { enabled: true } ] )
		);
	} );

	it( 'says when the visitors see the change', async () => {
		fakeSite();
		const { context } = renderWithApp( <PlayerAiNotice /> );

		fireEvent.click( await toggle() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'AI notice saved. Visitors see the change on their next page load.'
			)
		);
	} );

	it( 'previews the default sentence below the player once it is on', async () => {
		fakeSite();
		const { container } = renderWithApp( <PlayerAiNotice /> );

		fireEvent.click( await toggle() );

		expect( notice( container ) ).toHaveTextContent( DEFAULT_TEXT );
		expect( notice( container ).previousElementSibling ).toHaveClass(
			'atlasvoice-preview-player'
		);
	} );

	it( 'shows the default sentence in grey while the text is empty', async () => {
		fakeSite( { enabled: true } );
		renderWithApp( <PlayerAiNotice /> );
		await toggle();

		const text = screen.getByRole( 'textbox', { name: 'Notice text' } );
		expect( text ).toHaveValue( '' );
		expect( text ).toHaveAttribute( 'placeholder', DEFAULT_TEXT );
		expect( text ).toHaveAttribute( 'maxlength', String( TEXT_LENGTH ) );
	} );

	it( 'previews and saves the owner’s own sentence', async () => {
		const site = fakeSite( { enabled: true } );
		const { container } = renderWithApp( <PlayerAiNotice /> );
		await toggle();

		fireEvent.change(
			screen.getByRole( 'textbox', { name: 'Notice text' } ),
			{ target: { value: 'Read by a synthetic voice.' } }
		);
		expect( notice( container ) ).toHaveTextContent(
			'Read by a synthetic voice.'
		);

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [
				{ text: 'Read by a synthetic voice.' },
			] )
		);
	} );

	it( 'moves the notice above the player', async () => {
		const site = fakeSite( { enabled: true } );
		const { container } = renderWithApp( <PlayerAiNotice /> );
		await toggle();

		fireEvent.click(
			screen.getByRole( 'radio', { name: 'Above the player' } )
		);

		expect( notice( container ).nextElementSibling ).toHaveClass(
			'atlasvoice-preview-player'
		);

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { position: 'before' } ] )
		);
	} );

	it( 'shows what the site has stored', async () => {
		fakeSite( {
			enabled: true,
			text: 'Read by a synthetic voice.',
			position: 'before',
		} );
		renderWithApp( <PlayerAiNotice /> );

		expect( await toggle() ).toBeChecked();
		expect(
			screen.getByRole( 'textbox', { name: 'Notice text' } )
		).toHaveValue( 'Read by a synthetic voice.' );
		expect(
			screen.getByRole( 'radio', { name: 'Above the player' } )
		).toBeChecked();
	} );

	it( 'has nothing to save when the switch is put back', async () => {
		fakeSite();
		renderWithApp( <PlayerAiNotice /> );

		const box = await toggle();
		fireEvent.click( box );
		expect( saveButton() ).toBeEnabled();

		fireEvent.click( box );
		expect( saveButton() ).toBeDisabled();
	} );

	it( 'says it is not legal advice', async () => {
		fakeSite();
		renderWithApp( <PlayerAiNotice /> );
		await toggle();

		expect(
			screen.getByText( /This is information, not legal advice\./ )
		).toBeInTheDocument();
	} );

	it( 'is the same with and without Pro: no Pro line, no disabled control', async () => {
		fakeSite( { enabled: true } );
		const { container } = renderWithApp( <PlayerAiNotice /> );
		await toggle();

		expect(
			container.querySelectorAll( '.atlasvoice-pronote, .atlasvoice-pro' )
		).toHaveLength( 0 );
		expect(
			container.querySelectorAll(
				'input[disabled], [aria-disabled="true"]'
			)
		).toHaveLength( 0 );
	} );

	it( 'says why a save was refused and keeps the choice on screen', async () => {
		fakeSite(
			{},
			{ failPost: { status: 400, message: 'This must be on or off.' } }
		);
		const { context } = renderWithApp( <PlayerAiNotice /> );

		fireEvent.click( await toggle() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: This must be on or off.',
				'error'
			)
		);
		expect( await toggle() ).toBeChecked();
	} );

	it( 'offers to try again when the notice cannot be loaded', async () => {
		const site = fakeSite(
			{},
			{ failGet: { status: 500, message: 'Server error' } }
		);
		renderWithApp( <PlayerAiNotice /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await toggle() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'has no accessibility violations, off and on', async () => {
		fakeSite();
		const off = renderWithApp( <PlayerAiNotice /> );
		await toggle();
		expect( await axe( off.container ) ).toHaveNoViolations();
		off.unmount();

		fakeSite( { enabled: true, position: 'before' } );
		const on = renderWithApp( <PlayerAiNotice /> );
		await toggle();
		expect( await axe( on.container ) ).toHaveNoViolations();
	} );
} );

describe( 'Player › AI notice › credit line', () => {
	const creditToggle = () =>
		screen.findByRole( 'checkbox', {
			name: 'Show “Voiced by AtlasVoice” under the player',
		} );
	const line = ( container ) =>
		container.querySelector( '.atlasvoice-credit-preview' );

	it( 'is off on a site that never turned it on', async () => {
		fakeSite();
		const { container } = renderWithApp( <PlayerAiNotice /> );

		expect( await creditToggle() ).not.toBeChecked();
		expect( line( container ) ).toBeNull();
	} );

	it( 'says it is plain text without a link, under the natural-voice player only', async () => {
		fakeSite();
		renderWithApp( <PlayerAiNotice /> );

		await creditToggle();
		expect(
			screen.getByText(
				'Plain text without a link, under the natural-voice player only.'
			)
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'Say under the player that AtlasVoice made the voice. Optional, and off until you turn it on.'
			)
		).toBeInTheDocument();
	} );

	it( 'writes nothing until Save, and then only to the credit route', async () => {
		const site = fakeSite();
		const { container, context } = renderWithApp( <PlayerAiNotice /> );

		fireEvent.click( await creditToggle() );
		expect( site.creditPosts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();
		expect( line( container ) ).toHaveTextContent( 'Voiced by AtlasVoice' );

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.creditPosts ).toEqual( [ { enabled: true } ] )
		);
		expect( site.posts ).toHaveLength( 0 );
		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Credit line saved. Visitors see the change on their next page load.'
			)
		);
		expect( context.notify ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'can be turned off again', async () => {
		const site = fakeSite(
			{},
			{ credit: { enabled: true, showing: true } }
		);
		const { container } = renderWithApp( <PlayerAiNotice /> );

		expect( await creditToggle() ).toBeChecked();
		expect( line( container ) ).toBeInTheDocument();

		fireEvent.click( await creditToggle() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.creditPosts ).toEqual( [ { enabled: false } ] )
		);
		await waitFor( () => expect( line( container ) ).toBeNull() );
	} );

	it( 'saves the AI notice and the credit line with one Save', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerAiNotice /> );

		fireEvent.click( await toggle() );
		fireEvent.click( await creditToggle() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { enabled: true } ] )
		);
		await waitFor( () =>
			expect( site.creditPosts ).toEqual( [ { enabled: true } ] )
		);
	} );

	it( 'sits right under the player in the preview, over the AI notice', async () => {
		fakeSite(
			{ enabled: true },
			{ credit: { enabled: true, showing: true } }
		);
		const { container } = renderWithApp( <PlayerAiNotice /> );

		await creditToggle();
		const credit = line( container );
		expect( credit.previousElementSibling ).toHaveClass(
			'atlasvoice-preview-player'
		);
		expect( credit.nextElementSibling ).toBe( notice( container ) );
	} );

	it( 'says when the site does not use the natural voice', async () => {
		fakeSite(
			{},
			{ credit: { enabled: true, showing: false, natural: false } }
		);
		renderWithApp( <PlayerAiNotice /> );

		expect( await creditToggle() ).toBeChecked();
		expect(
			screen.getByText(
				'Your site does not use the natural voice now, so visitors do not see the line.'
			)
		).toBeInTheDocument();
	} );

	it( 'is not offered where an extension renders the player', async () => {
		fakeSite( {}, { credit: { available: false } } );
		const { container } = renderWithApp( <PlayerAiNotice /> );

		await toggle();
		await waitFor( () =>
			expect( window.fetch ).toHaveBeenCalledTimes( 2 )
		);
		expect(
			screen.queryByRole( 'checkbox', {
				name: 'Show “Voiced by AtlasVoice” under the player',
			} )
		).not.toBeInTheDocument();
		expect( screen.queryByText( 'Credit line' ) ).not.toBeInTheDocument();
		expect( line( container ) ).toBeNull();
	} );

	it( 'says why when it cannot be loaded, and the AI notice still works', async () => {
		fakeSite(
			{},
			{ failCredit: { status: 500, message: 'The site is busy.' } }
		);
		renderWithApp( <PlayerAiNotice /> );

		expect( await toggle() ).not.toBeChecked();
		expect(
			(
				await screen.findAllByText(
					'The credit line could not be loaded: The site is busy.'
				)
			).length
		).toBeGreaterThan( 0 );

		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect( await creditToggle() ).not.toBeChecked();
	} );

	it( 'has no accessibility violations with the line on', async () => {
		fakeSite( {}, { credit: { enabled: true, showing: true } } );
		const { container } = renderWithApp( <PlayerAiNotice /> );

		await creditToggle();
		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
