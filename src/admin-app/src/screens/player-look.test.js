import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { MIN_TEXT_CONTRAST, contrastRatio } from '../util/contrast';
import PlayerLook, {
	LIMITS,
	SHAPES,
	SIZES,
	shapeOf,
	sizeOf,
	stylePresets,
} from './PlayerLook';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

/** What a site that never saved a look answers (TTA\Player\Look). */
const LOOK = {
	background: '#184c53',
	text: '#ffffff',
	hover_background: '#000000',
	hover_text: '#ffffff',
	border_color: '#000000',
	border: 0,
	radius: 4,
	height: 50,
	font_size: 18,
	width: 100,
	margin_top: 0,
	margin_bottom: 0,
	margin_left: 0,
	margin_right: 0,
};

/**
 * A stand-in for the site's look route. A POST merges what was sent, like
 * Player\Look::save() does.
 *
 * @param {Object} start            What the site has stored.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the first load.
 * @param {Object} options.failPost { status, message } to refuse the save.
 * @return {Object} { posts, stored, gets }.
 */
function fakeSite( start = {}, { failGet, failPost } = {} ) {
	const site = { posts: [], gets: 0, stored: { ...LOOK, ...start } };
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
const player = () =>
	screen.getByRole( 'img', { name: 'The player with this look' } );
const ready = () => screen.findByRole( 'button', { name: 'Indigo' } );

afterEach( () => {
	delete window.fetch;
} );

describe( 'the shortcuts', () => {
	it( 'offers only styles whose text can be read', () => {
		for ( const preset of stylePresets() ) {
			expect(
				contrastRatio( preset.text, preset.background )
			).toBeGreaterThanOrEqual( MIN_TEXT_CONTRAST );
		}
	} );

	it( 'keeps every shape and size inside the limits the site accepts', () => {
		for ( const radius of Object.values( SHAPES ) ) {
			expect( radius ).toBeGreaterThanOrEqual( LIMITS.radius[ 0 ] );
			expect( radius ).toBeLessThanOrEqual( LIMITS.radius[ 1 ] );
		}
		for ( const size of Object.values( SIZES ) ) {
			expect( size.height ).toBeGreaterThanOrEqual( LIMITS.height[ 0 ] );
			expect( size.height ).toBeLessThanOrEqual( LIMITS.height[ 1 ] );
			expect( size.font_size ).toBeGreaterThanOrEqual(
				LIMITS.font_size[ 0 ]
			);
		}
	} );

	it( 'names the shape of a corner radius', () => {
		expect( shapeOf( 0 ) ).toBe( 'square' );
		expect( shapeOf( 10 ) ).toBe( 'rounded' );
		expect( shapeOf( 100 ) ).toBe( 'pill' );
		expect( shapeOf( 4 ) ).toBe( 'custom' );
	} );

	it( 'names the size of a height and text size', () => {
		expect( sizeOf( { height: 40, font_size: 16 } ) ).toBe( 'small' );
		expect( sizeOf( { height: 50, font_size: 18 } ) ).toBe( 'medium' );
		expect( sizeOf( { height: 60, font_size: 22 } ) ).toBe( 'large' );
		expect( sizeOf( { height: 50, font_size: 20 } ) ).toBe( 'custom' );
	} );

	it( 'has limits for every number the site stores', () => {
		const numbers = Object.keys( LOOK ).filter(
			( name ) => typeof LOOK[ name ] === 'number'
		);

		expect( Object.keys( LIMITS ).sort() ).toEqual( numbers.sort() );
	} );
} );

describe( 'Player › Look', () => {
	it( 'is the screen of the player:look route', () => {
		expect( getScreenComponent( 'player:look' ) ).toBeTruthy();
	} );

	it( 'shows the look the site has stored, in the preview too', async () => {
		fakeSite( { background: '#5646e5', radius: 10, width: 80 } );
		renderWithApp( <PlayerLook /> );

		expect( await ready() ).toHaveAttribute( 'aria-pressed', 'true' );
		expect(
			screen.getByRole( 'button', { name: 'Classic teal' } )
		).toHaveAttribute( 'aria-pressed', 'false' );
		expect(
			screen.getByRole( 'radio', { name: 'Rounded' } )
		).toBeChecked();
		expect( player() ).toHaveStyle( {
			background: 'rgb(86, 70, 229)',
			width: '80%',
			borderRadius: '10px',
			height: '50px',
		} );
	} );

	it( 'writes nothing until Save, and then only what changed', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerLook /> );

		fireEvent.click( await ready() );
		expect( site.posts ).toHaveLength( 0 );
		expect( player() ).toHaveStyle( { background: 'rgb(86, 70, 229)' } );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		// The text colour of Indigo is the stored one, so it is not sent.
		await waitFor( () =>
			expect( site.posts ).toEqual( [ { background: '#5646e5' } ] )
		);
	} );

	it( 'a style sets the background and the text colour together', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerLook /> );
		await ready();

		fireEvent.click( screen.getByRole( 'button', { name: 'Paper' } ) );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [
				{ background: '#f2f0ea', text: '#1f2328' },
			] )
		);
	} );

	it( 'says when the visitors see the change', async () => {
		fakeSite();
		const { context } = renderWithApp( <PlayerLook /> );

		fireEvent.click( await ready() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Look saved. Visitors see the change on their next page load.'
			)
		);
	} );

	it( 'a shape sets the corner radius', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerLook /> );
		await ready();

		fireEvent.click( screen.getByRole( 'radio', { name: 'Pill' } ) );
		expect( player() ).toHaveStyle( { borderRadius: '100px' } );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { radius: 100 } ] )
		);
	} );

	it( 'a size sets the height and the text size', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerLook /> );
		await ready();

		fireEvent.click( screen.getByRole( 'radio', { name: 'Large' } ) );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { height: 60, font_size: 22 } ] )
		);
	} );

	it( 'shows "Custom" only for a radius or size that is not a shortcut', async () => {
		fakeSite( { radius: 4, height: 50, font_size: 18 } );
		renderWithApp( <PlayerLook /> );
		await ready();

		const shape = screen.getByRole( 'group', { name: 'Shape' } );
		const size = screen.getByRole( 'group', { name: 'Size' } );

		expect(
			within( shape ).getByRole( 'radio', { name: 'Custom' } )
		).toBeChecked();
		expect(
			within( size ).queryByRole( 'radio', { name: 'Custom' } )
		).not.toBeInTheDocument();
		expect(
			within( size ).getByRole( 'radio', { name: 'Medium' } )
		).toBeChecked();
	} );

	it( 'has nothing to save when a choice is put back', async () => {
		fakeSite( { radius: 10 } );
		renderWithApp( <PlayerLook /> );
		await ready();

		fireEvent.click( screen.getByRole( 'radio', { name: 'Square' } ) );
		expect( saveButton() ).toBeEnabled();

		fireEvent.click( screen.getByRole( 'radio', { name: 'Rounded' } ) );
		expect( saveButton() ).toBeDisabled();
	} );

	describe( 'text that can be read', () => {
		it( 'says the text is easy to read on a style', async () => {
			fakeSite();
			renderWithApp( <PlayerLook /> );
			await ready();

			expect( screen.getAllByText( 'Easy to read' ).length ).toBe( 2 );
		} );

		it( 'warns, in words and numbers, when the text is hard to read', async () => {
			fakeSite( { background: '#ffffff', text: '#cccccc' } );
			renderWithApp( <PlayerLook /> );
			await ready();

			expect( screen.getByText( 'Hard to read' ) ).toBeInTheDocument();
			expect(
				screen.getByText( /Contrast 1\.6 to 1\. Text needs at least/ )
			).toBeInTheDocument();
		} );

		it( 'checks the hover colours as well', async () => {
			fakeSite( { hover_background: '#ffffff', hover_text: '#eeeeee' } );
			renderWithApp( <PlayerLook /> );
			await ready();

			expect( screen.getByText( 'Hard to read' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'numbers', () => {
		const field = ( name ) => screen.getByRole( 'spinbutton', { name } );

		it( 'saves a number that was typed', async () => {
			const site = fakeSite();
			renderWithApp( <PlayerLook /> );
			await ready();

			fireEvent.change( field( 'Space above (px)' ), {
				target: { value: '24' },
			} );
			expect( player() ).toHaveStyle( { marginTop: '24px' } );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { margin_top: 24 } ] )
			);
		} );

		it( 'tells the browser the limits the site accepts', async () => {
			fakeSite();
			renderWithApp( <PlayerLook /> );
			await ready();

			const width = field( 'Width (% of the text column)' );
			expect( width ).toHaveAttribute( 'min', '10' );
			expect( width ).toHaveAttribute( 'max', '100' );
			expect( field( 'Border width (px)' ) ).toHaveAttribute(
				'max',
				'20'
			);
		} );

		it( 'keeps the last number when the field is emptied', async () => {
			fakeSite();
			renderWithApp( <PlayerLook /> );
			await ready();

			fireEvent.change( field( 'Height (px)' ), {
				target: { value: '' },
			} );

			expect( player() ).toHaveStyle( { height: '50px' } );
			expect( saveButton() ).toBeDisabled();
		} );

		it( 'has a field for every number of the look', async () => {
			fakeSite();
			renderWithApp( <PlayerLook /> );
			await ready();

			expect( screen.getAllByRole( 'spinbutton' ) ).toHaveLength(
				Object.keys( LIMITS ).length
			);
		} );
	} );

	it( 'shows the hover colours when the preview is pointed at or focused', async () => {
		fakeSite( { hover_background: '#1e1e1e', hover_text: '#f2f0ea' } );
		renderWithApp( <PlayerLook /> );
		await ready();

		fireEvent.mouseEnter( player() );
		expect( player() ).toHaveStyle( {
			background: 'rgb(30, 30, 30)',
			color: 'rgb(242, 240, 234)',
		} );

		fireEvent.mouseLeave( player() );
		expect( player() ).toHaveStyle( { background: 'rgb(24, 76, 83)' } );

		fireEvent.focus( player() );
		expect( player() ).toHaveStyle( { background: 'rgb(30, 30, 30)' } );
	} );

	it( 'is the same with and without Pro: no Pro line, no disabled control', async () => {
		fakeSite();
		const { container } = renderWithApp( <PlayerLook /> );
		await ready();

		expect(
			container.querySelectorAll( '.atlasvoice-pronote, .atlasvoice-pro' )
		).toHaveLength( 0 );
		expect(
			container.querySelectorAll(
				'input[disabled], [aria-disabled="true"]'
			)
		).toHaveLength( 0 );
	} );

	it( 'has no field for custom CSS (wp.org does not allow storing it)', async () => {
		fakeSite();
		const { container } = renderWithApp( <PlayerLook /> );
		await ready();

		expect( container.querySelectorAll( 'textarea' ) ).toHaveLength( 0 );
		expect(
			screen.getByText( /Appearance → Customize → Additional CSS/ )
		).toBeInTheDocument();
	} );

	it( 'says why a save was refused and keeps the choice on screen', async () => {
		fakeSite(
			{},
			{
				failPost: {
					status: 400,
					message: 'A colour must be a hex value.',
				},
			}
		);
		const { context } = renderWithApp( <PlayerLook /> );

		fireEvent.click( await ready() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: A colour must be a hex value.',
				'error'
			)
		);
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();
	} );

	it( 'offers to try again when the look cannot be loaded', async () => {
		const site = fakeSite(
			{},
			{ failGet: { status: 500, message: 'Server error' } }
		);
		renderWithApp( <PlayerLook /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await ready() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'has no accessibility violations', async () => {
		fakeSite( { radius: 4 } );
		const { container } = renderWithApp( <PlayerLook /> );
		await ready();

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
