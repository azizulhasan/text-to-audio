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
import { getScreenComponent } from './registry';
import VoicePronunciation from './VoicePronunciation';

expect.extend( toHaveNoViolations );

const WP = { actual_text: 'WP', to_read: 'WordPress', apply_to_numbers: false };
const KM = {
	actual_text: 'km',
	to_read: 'kilometres',
	apply_to_numbers: false,
};
const K5 = { actual_text: '5k', to_read: '5 thousand', apply_to_numbers: true };

/**
 * A stand-in for the site: answers the three pronunciation routes and keeps
 * the calls, so a test can check what the screen sent.
 *
 * @param {Object} start        First state: { rules, max }.
 * @param {Object} options
 * @param {Object} options.fail Route => { status, message } to refuse.
 * @return {Object} { calls, state }.
 */
function fakeSite( start, { fail = {} } = {} ) {
	const site = { calls: [], state: { ...start } };
	const applied = () =>
		site.state.max > 0
			? Math.min( site.state.max, site.state.rules.length )
			: site.state.rules.length;
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( url, options = {} ) => {
		const method = options.method || 'GET';
		const route = url.replace( 'https://site.test/wp-json/', '' );
		const data = options.body ? JSON.parse( options.body ) : null;
		const key = method + ' ' + route;
		site.calls.push( { method, route, data } );

		if ( fail[ key ] ) {
			return reply(
				{ message: fail[ key ].message },
				false,
				fail[ key ].status
			);
		}
		if ( route === 'tta/v1/pronunciation/preview' ) {
			return reply( { text: 'READ: ' + data.text } );
		}
		if ( method === 'POST' ) {
			site.state.rules = data.rules.map( ( rule ) => ( {
				apply_to_numbers: false,
				...rule,
			} ) );
		}

		return reply( { ...site.state, applied: applied() } );
	} );

	return site;
}

const lastSave = ( site ) =>
	site.calls
		.filter(
			( call ) =>
				call.method === 'POST' && call.route === 'tta/v1/pronunciation'
		)
		.pop();

const type = ( label, value ) =>
	fireEvent.change( screen.getByLabelText( label ), { target: { value } } );

afterEach( () => {
	delete window.fetch;
	delete window.speechSynthesis;
	delete window.SpeechSynthesisUtterance;
	jest.useRealTimers();
} );

describe( 'Voice › Pronunciation', () => {
	it( 'is the screen of the voice:pronunciation route', () => {
		expect( getScreenComponent( 'voice:pronunciation' ) ).toBeTruthy();
	} );

	it( 'shows a loading state, then the saved rules', async () => {
		fakeSite( { rules: [ WP, K5 ], max: 0 } );
		renderWithApp( <VoicePronunciation /> );

		expect( screen.getByText( 'Loading…' ) ).toBeVisible();

		const table = await screen.findByRole( 'table' );
		const rows = within( table ).getAllByRole( 'row' );
		expect( rows ).toHaveLength( 3 );
		expect( rows[ 1 ] ).toHaveTextContent( 'WP' );
		expect( rows[ 1 ] ).toHaveTextContent( 'WordPress' );
		expect( rows[ 1 ] ).toHaveTextContent( '—' );
		expect( rows[ 2 ] ).toHaveTextContent( 'Similar numbers too' );
	} );

	it( 'gives one sentence and one action when there are no rules', async () => {
		fakeSite( { rules: [], max: 1 } );
		renderWithApp( <VoicePronunciation /> );

		expect( await screen.findByText( 'No words yet' ) ).toBeVisible();
		expect(
			screen.getAllByRole( 'button', { name: 'Add a word' } ).length
		).toBeGreaterThan( 0 );
	} );

	it( 'says why and offers Try again when the site cannot be reached', async () => {
		const site = fakeSite(
			{ rules: [ WP ], max: 1 },
			{
				fail: {
					'GET tta/v1/pronunciation': {
						status: 403,
						message: 'Blocked.',
					},
				},
			}
		);
		renderWithApp( <VoicePronunciation /> );

		// The notice is on screen and is also announced to screen readers.
		expect(
			(
				await screen.findAllByText(
					'The pronunciation rules could not be loaded: Blocked.'
				)
			).length
		).toBeGreaterThan( 0 );

		// The site answers again.
		fakeSite( { rules: [ WP ], max: 1 } );
		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect( await screen.findByRole( 'table' ) ).toBeVisible();
		expect( site.calls ).toHaveLength( 1 );
	} );

	it( 'adds a word through the drawer and saves the whole list', async () => {
		const site = fakeSite( { rules: [ WP ], max: 0 } );
		const { context } = renderWithApp( <VoicePronunciation /> );
		await screen.findByRole( 'table' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Add a word' } ) );
		const save = screen.getByRole( 'button', { name: 'Save' } );
		expect( save ).toBeDisabled();

		type( 'On your site', '  km ' );
		type( 'Say it as', ' kilometres ' );
		await act( async () => {
			fireEvent.click( save );
		} );

		expect( lastSave( site ).data.rules ).toEqual( [
			WP,
			{
				actual_text: 'km',
				to_read: 'kilometres',
				apply_to_numbers: false,
			},
		] );
		expect( screen.queryByRole( 'dialog' ) ).toBeNull();
		expect( context.notify ).toHaveBeenCalledWith(
			'Saved. The voice now says “kilometres”.'
		);
		expect(
			within( screen.getByRole( 'table' ) ).getAllByRole( 'row' )
		).toHaveLength( 3 );
	} );

	it( 'offers "Similar numbers too" only for a word with a number', async () => {
		const site = fakeSite( { rules: [], max: 0 } );
		renderWithApp( <VoicePronunciation /> );
		await screen.findByText( 'No words yet' );
		fireEvent.click(
			screen.getAllByRole( 'button', { name: 'Add a word' } )[ 0 ]
		);

		type( 'On your site', 'WP' );
		expect( screen.queryByLabelText( 'Similar numbers too' ) ).toBeNull();

		type( 'On your site', '5k' );
		fireEvent.click( screen.getByLabelText( 'Similar numbers too' ) );
		type( 'Say it as', '5 thousand' );
		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		} );

		expect( lastSave( site ).data.rules ).toEqual( [ K5 ] );
	} );

	it( 'drops the numbers flag when the number is removed from the word', async () => {
		const site = fakeSite( { rules: [ K5 ], max: 0 } );
		renderWithApp( <VoicePronunciation /> );
		await screen.findByRole( 'table' );
		fireEvent.click( screen.getByRole( 'button', { name: 'Edit “5k”' } ) );

		type( 'On your site', 'k' );
		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		} );

		expect( lastSave( site ).data.rules[ 0 ].apply_to_numbers ).toBe(
			false
		);
	} );

	it( 'edits a rule in place and keeps the order', async () => {
		const site = fakeSite( { rules: [ WP, KM ], max: 0 } );
		renderWithApp( <VoicePronunciation /> );
		await screen.findByRole( 'table' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Edit “WP”' } ) );
		expect(
			screen.getByRole( 'dialog', { name: 'Edit “WP”' } )
		).toBeVisible();
		type( 'Say it as', 'W P' );
		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		} );

		expect(
			lastSave( site ).data.rules.map( ( rule ) => rule.to_read )
		).toEqual( [ 'W P', 'kilometres' ] );
	} );

	it( 'removes only the rule that is open', async () => {
		const site = fakeSite( { rules: [ WP, KM ], max: 0 } );
		const { context } = renderWithApp( <VoicePronunciation /> );
		await screen.findByRole( 'table' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Edit “WP”' } ) );
		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name: 'Remove' } ) );
		} );

		expect( lastSave( site ).data.rules ).toEqual( [ KM ] );
		expect( context.notify ).toHaveBeenCalledWith( 'Removed.' );
	} );

	it( 'closes without saving on Cancel', async () => {
		const site = fakeSite( { rules: [ WP ], max: 0 } );
		renderWithApp( <VoicePronunciation /> );
		await screen.findByRole( 'table' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Edit “WP”' } ) );
		type( 'Say it as', 'changed' );
		fireEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( screen.queryByRole( 'dialog' ) ).toBeNull();
		expect( lastSave( site ) ).toBeUndefined();
		expect( screen.getByRole( 'table' ) ).toHaveTextContent( 'WordPress' );
	} );

	it( 'keeps the drawer open and says why when the site refuses the save', async () => {
		fakeSite(
			{ rules: [ WP ], max: 0 },
			{
				fail: {
					'POST tta/v1/pronunciation': {
						status: 400,
						message: '“WP” is in the list twice.',
					},
				},
			}
		);
		const { context } = renderWithApp( <VoicePronunciation /> );
		await screen.findByRole( 'table' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Add a word' } ) );
		type( 'On your site', 'wp' );
		type( 'Say it as', 'W P' );
		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		} );

		expect( context.notify ).toHaveBeenCalledWith(
			'“WP” is in the list twice.',
			'error'
		);
		expect( screen.getByRole( 'dialog' ) ).toBeVisible();
		expect( screen.getByLabelText( 'On your site' ) ).toHaveValue( 'wp' );
	} );

	describe( 'the free limit', () => {
		it( 'shows one dashed Pro line instead of the Add button, and no Pro form', async () => {
			fakeSite( { rules: [ WP ], max: 1 } );
			const { context } = renderWithApp( <VoicePronunciation /> );
			await screen.findByRole( 'table' );

			expect(
				screen.queryByRole( 'button', { name: 'Add a word' } )
			).toBeNull();
			expect(
				screen.getByText( 'As many words as you need. Free keeps 1.' )
			).toBeVisible();
			expect(
				document.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 1 );
			// Nothing disabled is shown to sell Pro.
			expect( document.querySelectorAll( '[disabled]' ) ).toHaveLength(
				0
			);

			fireEvent.click(
				screen.getByRole( 'button', { name: 'See Pro' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
		} );

		it( 'still lets the one rule be edited and removed', async () => {
			fakeSite( { rules: [ WP ], max: 1 } );
			renderWithApp( <VoicePronunciation /> );
			await screen.findByRole( 'table' );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Edit “WP”' } )
			);

			expect(
				screen.getByRole( 'button', { name: 'Remove' } )
			).toBeEnabled();
		} );

		it( 'marks, in words, rules that are saved but not used', async () => {
			// Saved while an add-on was active; this site applies one.
			fakeSite( { rules: [ WP, KM ], max: 1 } );
			renderWithApp( <VoicePronunciation /> );
			const rows = within(
				await screen.findByRole( 'table' )
			).getAllByRole( 'row' );

			expect( rows[ 1 ] ).not.toHaveTextContent( 'Not used' );
			expect( rows[ 2 ] ).toHaveTextContent( 'Not used' );
		} );

		it( 'shows no Pro line when there is no limit', async () => {
			fakeSite( { rules: [ WP, KM ], max: 0 } );
			renderWithApp( <VoicePronunciation />, { boot: { isPro: true } } );
			await screen.findByRole( 'table' );

			expect(
				document.querySelector( '.atlasvoice-pronote' )
			).toBeNull();
			expect(
				screen.getByRole( 'button', { name: 'Add a word' } )
			).toBeVisible();
		} );
	} );

	describe( 'Try it', () => {
		it( 'asks the site how the sentence is read, a moment after typing', async () => {
			jest.useFakeTimers();
			const site = fakeSite( { rules: [ WP ], max: 0 } );
			renderWithApp( <VoicePronunciation /> );
			await act( async () => {
				await jest.runOnlyPendingTimersAsync();
			} );

			type( 'Sentence', 'Our WP site' );
			type( 'Sentence', 'Our WP site is fast' );
			await act( async () => {
				await jest.advanceTimersByTimeAsync( 500 );
			} );

			const previews = site.calls.filter(
				( call ) => call.route === 'tta/v1/pronunciation/preview'
			);
			// One request for the final text, not one per keystroke.
			expect( previews[ previews.length - 1 ].data ).toEqual( {
				text: 'Our WP site is fast',
			} );
			expect(
				previews.filter( ( call ) => call.data.text === 'Our WP site' )
			).toHaveLength( 0 );
			expect(
				screen.getByText( 'Read as: “READ: Our WP site is fast”' )
			).toBeVisible();
		} );

		it( 'reads the sentence aloud with the browser voice', async () => {
			const speakNow = jest.fn();
			window.speechSynthesis = { cancel: jest.fn(), speak: speakNow };
			window.SpeechSynthesisUtterance = function Utterance( text ) {
				this.text = text;
			};
			fakeSite( { rules: [ WP ], max: 0 } );
			renderWithApp( <VoicePronunciation /> );
			await screen.findByRole( 'table' );
			await screen.findByText( /^Read as:/ );

			fireEvent.click( screen.getByRole( 'button', { name: 'Listen' } ) );

			expect( speakNow ).toHaveBeenCalledTimes( 1 );
			expect( speakNow.mock.calls[ 0 ][ 0 ].text ).toMatch( /^READ: / );
		} );

		it( 'says so when the browser cannot speak', async () => {
			fakeSite( { rules: [ WP ], max: 0 } );
			const { context } = renderWithApp( <VoicePronunciation /> );
			await screen.findByRole( 'table' );

			fireEvent.click( screen.getByRole( 'button', { name: 'Listen' } ) );

			expect( context.notify ).toHaveBeenCalledWith(
				'This browser cannot read text aloud.',
				'error'
			);
		} );
	} );

	it( 'shows a rule as text, never as markup', async () => {
		fakeSite( {
			rules: [
				{
					actual_text: '<img src=x onerror=alert(1)>',
					to_read: '<b>bold</b>',
					apply_to_numbers: false,
				},
			],
			max: 0,
		} );
		renderWithApp( <VoicePronunciation /> );
		const table = await screen.findByRole( 'table' );

		expect( table.querySelector( 'img' ) ).toBeNull();
		expect( table.querySelector( 'b' ) ).toBeNull();
		expect( table ).toHaveTextContent( '<b>bold</b>' );
	} );

	it( 'has no accessibility violations, with the table and with the drawer', async () => {
		fakeSite( { rules: [ WP, K5 ], max: 1 } );
		const { container } = renderWithApp( <VoicePronunciation /> );
		await screen.findByRole( 'table' );
		// Let the "Read as" request finish, so nothing updates after the test.
		await screen.findByText( /^Read as:/ );

		expect( await axe( container ) ).toHaveNoViolations();

		fireEvent.click( screen.getByRole( 'button', { name: 'Edit “5k”' } ) );
		await waitFor( () =>
			expect( screen.getByRole( 'dialog' ) ).toBeVisible()
		);
		expect(
			await axe( document.querySelector( '.atlasvoice-drawer' ) )
		).toHaveNoViolations();
	} );
} );
