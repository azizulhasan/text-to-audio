import '@testing-library/jest-dom';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import {
	MIN_TEXT_CONTRAST,
	contrastRatio,
	onWhite,
	parseHex,
} from '../util/contrast';
import PlayerReadAlong from './PlayerReadAlong';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const DEFAULTS = {
	tta__highlight_enabled: false,
	tta__highlight_mode: 'sentence',
	tta__highlight_word_bg: '#a5abf0',
	tta__highlight_word_color: '#202124',
	tta__highlight_sentence_bg: '#e8e7fe',
	tta__highlight_dim_enabled: true,
	tta__highlight_dim_opacity: 0.7,
	tta__highlight_autoscroll: true,
	tta__selection_listen_enabled: false,
	tta__selection_announce: 'tip',
};

/**
 * A stand-in for the site's read-along route. A POST merges what was sent,
 * like Player\Read_Along::save() does.
 *
 * @param {Object} start            Stored settings.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the load.
 * @param {Object} options.failPost { status, message } to refuse the save.
 * @return {Object} { posts, stored }.
 */
function fakeSite( start = {}, { failGet, failPost } = {} ) {
	const site = { posts: [], stored: { ...DEFAULTS, ...start } };
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

		return failGet
			? reply( { message: failGet.message }, false, failGet.status )
			: reply( site.stored );
	} );

	return site;
}

const toggle = ( name ) =>
	fireEvent.click( screen.getByRole( 'checkbox', { name } ) );

afterEach( () => {
	delete window.fetch;
} );

describe( 'contrast', () => {
	it( 'reads short and long hex colours', () => {
		expect( parseHex( '#fff' ) ).toEqual( [ 255, 255, 255 ] );
		expect( parseHex( '#202124' ) ).toEqual( [ 32, 33, 36 ] );
	} );

	it.each( [ '', null, 'red', '#12', '#gggggg', 'javascript:alert(1)' ] )(
		'does not read %p as a colour',
		( value ) => {
			expect( parseHex( value ) ).toBeNull();
			expect( contrastRatio( value, '#ffffff' ) ).toBeNull();
		}
	);

	it( 'matches the WCAG reference values', () => {
		expect( contrastRatio( '#000000', '#ffffff' ) ).toBeCloseTo( 21, 1 );
		expect( contrastRatio( '#ffffff', '#ffffff' ) ).toBeCloseTo( 1, 5 );
		// The brand indigo on white, as documented in DESIGN.md: 6.17 to 1.
		expect( contrastRatio( '#ffffff', '#5646e5' ) ).toBeCloseTo( 6.17, 1 );
		// The order of the two colours does not matter.
		expect( contrastRatio( '#5646e5', '#ffffff' ) ).toBeCloseTo(
			contrastRatio( '#ffffff', '#5646e5' ),
			5
		);
	} );

	it( 'passes the default word colours', () => {
		expect( contrastRatio( '#202124', '#a5abf0' ) ).toBeGreaterThanOrEqual(
			MIN_TEXT_CONTRAST
		);
	} );
} );

describe( 'onWhite', () => {
	it( 'gives the colour a see-through colour has on a white page', () => {
		expect( onWhite( [ 0, 0, 0 ], 1 ) ).toBe( '#000000' );
		expect( onWhite( [ 0, 0, 0 ], 0 ) ).toBe( '#ffffff' );
		expect( onWhite( [ 60, 64, 67 ], 0.7 ) ).toBe( '#77797b' );
	} );
} );

describe( 'Player › Read-along', () => {
	it( 'is the screen of the player:read route', () => {
		expect( getScreenComponent( 'player:read' ) ).toBeTruthy();
	} );

	it( 'shows a loading state, then the saved settings', async () => {
		fakeSite( {
			tta__highlight_enabled: true,
			tta__highlight_mode: 'word',
		} );
		renderWithApp( <PlayerReadAlong /> );

		expect( screen.getByText( 'Loading…' ) ).toBeVisible();

		expect(
			await screen.findByRole( 'checkbox', {
				name: 'Highlight while reading',
			} )
		).toBeChecked();
		expect( screen.getByRole( 'radio', { name: 'Word' } ) ).toBeChecked();
	} );

	it( 'says why and offers Try again when the settings cannot be loaded', async () => {
		fakeSite( {}, { failGet: { status: 403, message: 'Blocked.' } } );
		renderWithApp( <PlayerReadAlong /> );

		expect(
			(
				await screen.findAllByText(
					'The read-along settings could not be loaded: Blocked.'
				)
			).length
		).toBeGreaterThan( 0 );

		fakeSite();
		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect(
			await screen.findByRole( 'checkbox', {
				name: 'Highlight while reading',
			} )
		).toBeVisible();
	} );

	it( 'shows the other highlight settings only when highlighting is on', async () => {
		fakeSite();
		renderWithApp( <PlayerReadAlong /> );
		await screen.findByRole( 'checkbox', {
			name: 'Highlight while reading',
		} );

		expect(
			screen.queryByRole( 'radio', { name: 'Sentence' } )
		).toBeNull();

		toggle( 'Highlight while reading' );

		expect(
			screen.getByRole( 'radio', { name: 'Sentence' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Fade the rest of the article',
			} )
		).toBeChecked();
	} );

	it( 'shows the colours that the chosen mode uses, and no others', async () => {
		fakeSite( { tta__highlight_enabled: true } );
		renderWithApp( <PlayerReadAlong /> );
		await screen.findByRole( 'radio', { name: 'Sentence' } );

		expect( screen.getByText( 'Sentence colour' ) ).toBeVisible();
		expect( screen.queryByText( 'Word colour' ) ).toBeNull();

		fireEvent.click( screen.getByRole( 'radio', { name: 'Word' } ) );
		expect( screen.queryByText( 'Sentence colour' ) ).toBeNull();
		expect( screen.getByText( 'Word colour' ) ).toBeVisible();
		expect( screen.getByText( 'Word text colour' ) ).toBeVisible();

		fireEvent.click( screen.getByRole( 'radio', { name: 'Both' } ) );
		expect( screen.getByText( 'Sentence colour' ) ).toBeVisible();
		expect( screen.getByText( 'Word colour' ) ).toBeVisible();
	} );

	it( 'sends only what changed, and nothing before Save', async () => {
		const site = fakeSite();
		const { context } = renderWithApp( <PlayerReadAlong /> );
		await screen.findByRole( 'checkbox', {
			name: 'Highlight while reading',
		} );

		const save = screen.getByRole( 'button', { name: 'Save' } );
		expect( save ).toBeDisabled();
		expect( screen.getByText( 'All changes saved' ) ).toBeVisible();

		toggle( 'Highlight while reading' );
		fireEvent.click( screen.getByRole( 'radio', { name: 'Both' } ) );

		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeVisible();
		expect( context.setDirty ).toHaveBeenLastCalledWith( true );

		await act( async () => {
			fireEvent.click( save );
		} );

		expect( site.posts ).toEqual( [
			{
				tta__highlight_enabled: true,
				tta__highlight_mode: 'word_sentence',
			},
		] );
		expect( context.notify ).toHaveBeenCalledWith(
			'Read-along saved. Visitors see the change on their next page load.'
		);
		expect( screen.getByText( 'All changes saved' ) ).toBeVisible();
		expect( context.setDirty ).toHaveBeenLastCalledWith( false );
	} );

	it( 'is not unsaved any more when a change is put back', async () => {
		fakeSite();
		renderWithApp( <PlayerReadAlong /> );
		await screen.findByRole( 'checkbox', {
			name: 'Highlight while reading',
		} );

		toggle( 'Highlight while reading' );
		toggle( 'Highlight while reading' );

		expect( screen.getByText( 'All changes saved' ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();
	} );

	it( 'stores the fade as a number from 0.1 to 0.85', async () => {
		const site = fakeSite( { tta__highlight_enabled: true } );
		renderWithApp( <PlayerReadAlong /> );
		const slider = await screen.findByRole( 'slider' );

		expect( slider ).toHaveValue( '70' );
		expect( slider ).toHaveAttribute( 'min', '10' );
		expect( slider ).toHaveAttribute( 'max', '85' );

		fireEvent.change( slider, { target: { value: '40' } } );
		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		} );

		expect( site.posts ).toEqual( [ { tta__highlight_dim_opacity: 0.4 } ] );
	} );

	it( 'keeps the changes on screen and says why when the save is refused', async () => {
		fakeSite( {}, { failPost: { status: 403, message: 'Not allowed.' } } );
		const { context } = renderWithApp( <PlayerReadAlong /> );
		await screen.findByRole( 'checkbox', {
			name: 'Highlight while reading',
		} );

		toggle( 'Highlight while reading' );
		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		} );

		expect( context.notify ).toHaveBeenCalledWith(
			'Not saved: Not allowed.',
			'error'
		);
		expect(
			screen.getByRole( 'checkbox', { name: 'Highlight while reading' } )
		).toBeChecked();
		expect( screen.getByText( 'Unsaved changes' ) ).toBeVisible();
	} );

	it( 'offers "Tell readers about it" only when listening to a selection is on', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerReadAlong /> );
		await screen.findByRole( 'checkbox', {
			name: 'Allow listening to selected text',
		} );

		expect( screen.queryByRole( 'combobox' ) ).toBeNull();

		toggle( 'Allow listening to selected text' );
		fireEvent.change( screen.getByRole( 'combobox' ), {
			target: { value: 'badge' },
		} );
		await act( async () => {
			fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		} );

		// The stored words: tip, badge, both, off.
		expect( site.posts ).toEqual( [
			{
				tta__selection_listen_enabled: true,
				tta__selection_announce: 'badge',
			},
		] );
		expect(
			within( screen.getByRole( 'combobox' ) )
				.getAllByRole( 'option' )
				.map( ( option ) => option.value )
		).toEqual( [ 'tip', 'badge', 'both', 'off' ] );
	} );

	describe( 'the preview', () => {
		const sentence = () =>
			document.querySelector( '.atlasvoice-preview-sentence' );
		const word = () => document.querySelector( '.atlasvoice-preview-word' );

		it( 'shows nothing highlighted while highlighting is off', async () => {
			fakeSite();
			renderWithApp( <PlayerReadAlong /> );
			await screen.findByRole( 'checkbox', {
				name: 'Highlight while reading',
			} );

			expect( sentence() ).not.toHaveAttribute( 'style' );
			expect( word() ).not.toHaveAttribute( 'style' );
			expect(
				screen.getByText(
					'Highlighting is off, so the text stays as it is.'
				)
			).toBeVisible();
		} );

		it( 'follows the settings before they are saved', async () => {
			const site = fakeSite( {
				tta__highlight_enabled: true,
				tta__highlight_mode: 'word_sentence',
				tta__highlight_sentence_bg: '#fef3c7',
				tta__highlight_word_bg: '#fcd34d',
				tta__highlight_word_color: '#000000',
			} );
			renderWithApp( <PlayerReadAlong /> );
			await screen.findByRole( 'radio', { name: 'Both' } );

			expect( sentence() ).toHaveStyle( { background: '#fef3c7' } );
			expect( word() ).toHaveStyle( {
				background: '#fcd34d',
				color: '#000000',
			} );

			fireEvent.click(
				screen.getByRole( 'radio', { name: 'Sentence' } )
			);

			expect( word().style.background ).toBe( '' );
			expect( site.posts ).toHaveLength( 0 );
		} );
	} );

	describe( 'the contrast line', () => {
		it( 'says the default word colours are easy to read', async () => {
			fakeSite( {
				tta__highlight_enabled: true,
				tta__highlight_mode: 'word',
			} );
			renderWithApp( <PlayerReadAlong /> );

			// The word colours pass. The default fade (70%) is 4.4 to 1 on a
			// white page, just under 4.5, and the screen says so.
			expect( await screen.findAllByText( 'Easy to read' ) ).toHaveLength(
				1
			);
			expect( screen.getByText( /Contrast 7\.4 to 1\./ ) ).toBeVisible();
			expect( screen.getByText( /Contrast 4\.4 to 1\./ ) ).toBeVisible();
		} );

		it( 'warns, in words and with the ratio, when the word cannot be read', async () => {
			fakeSite( {
				tta__highlight_enabled: true,
				tta__highlight_mode: 'word',
				tta__highlight_word_bg: '#fcd34d',
				tta__highlight_word_color: '#ffffff',
			} );
			renderWithApp( <PlayerReadAlong /> );

			// One line for the word, one for the faded text: both fail here.
			expect( await screen.findAllByText( 'Hard to read' ) ).toHaveLength(
				2
			);
			expect(
				screen.getAllByText( /Text needs at least 4\.5 to 1\./ )
			).toHaveLength( 2 );
		} );
	} );

	it( 'warns when the faded text becomes hard to read, and not when it is readable', async () => {
		// Sentence mode: the only contrast line on screen is the one for the fade.
		fakeSite( { tta__highlight_enabled: true } );
		renderWithApp( <PlayerReadAlong /> );
		const slider = await screen.findByRole( 'slider' );

		fireEvent.change( slider, { target: { value: '40' } } );
		expect( screen.getByText( 'Hard to read' ) ).toBeVisible();

		fireEvent.change( slider, { target: { value: '85' } } );
		expect( screen.queryByText( 'Hard to read' ) ).toBeNull();
		expect( screen.getByText( 'Easy to read' ) ).toBeVisible();
	} );

	it( 'names each colour button with what it is for and its value', async () => {
		fakeSite( { tta__highlight_enabled: true } );
		renderWithApp( <PlayerReadAlong /> );

		expect(
			await screen.findByRole( 'button', {
				name: 'Sentence colour: #e8e7fe. Change',
			} )
		).toBeVisible();
	} );

	it( 'has no accessibility violations, off and on', async () => {
		fakeSite();
		const { container } = renderWithApp( <PlayerReadAlong /> );
		await screen.findByRole( 'checkbox', {
			name: 'Highlight while reading',
		} );

		expect( await axe( container ) ).toHaveNoViolations();

		toggle( 'Highlight while reading' );
		fireEvent.click( screen.getByRole( 'radio', { name: 'Both' } ) );
		toggle( 'Allow listening to selected text' );

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
