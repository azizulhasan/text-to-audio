import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import InsightsTracking from './InsightsTracking';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

/** What a site that counts plays for every post answers (TTA\Insights\Tracking). */
const ON = { count_plays: true, listener_location: false, posts: [ 'all' ] };

/**
 * A stand-in for the site's tracking route. A POST merges what was sent.
 *
 * @param {Object} start            What the site has stored.
 * @param {Object} options
 * @param {Object} options.failGet  { status, message } to refuse the first load.
 * @param {Object} options.failPost { status, message } to refuse the save.
 * @return {Object} { posts, gets }.
 */
function fakeSite( start = ON, { failGet, failPost } = {} ) {
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
const countPlays = () =>
	screen.findByRole( 'checkbox', { name: 'Count plays' } );
const location = () =>
	screen.getByRole( 'checkbox', {
		name: 'Show the country and city of listeners',
	} );

afterEach( () => {
	delete window.fetch;
} );

describe( 'Insights › Tracking', () => {
	it( 'is the screen of the insights:tracking route', () => {
		expect( getScreenComponent( 'insights:tracking' ) ).toBeTruthy();
	} );

	it( 'shows what the site has stored', async () => {
		fakeSite();
		renderWithApp( <InsightsTracking /> );

		expect( await countPlays() ).toBeChecked();
		expect(
			screen.getByRole( 'radio', { name: 'All posts' } )
		).toBeChecked();
		expect( location() ).not.toBeChecked();
	} );

	it( 'shows only the switch while counting is off', async () => {
		fakeSite( { count_plays: false, listener_location: false, posts: [] } );
		renderWithApp( <InsightsTracking /> );

		expect( await countPlays() ).not.toBeChecked();
		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', {
				name: 'Show the country and city of listeners',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'writes nothing until Save, and then only what changed', async () => {
		const site = fakeSite();
		renderWithApp( <InsightsTracking /> );

		fireEvent.click( await countPlays() );
		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { count_plays: false } ] )
		);
	} );

	it( 'says it was saved', async () => {
		fakeSite();
		const { context } = renderWithApp( <InsightsTracking /> );

		fireEvent.click( await countPlays() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith( 'Tracking saved.' )
		);
	} );

	it( 'says plays are counted on the site itself, without cookies', async () => {
		fakeSite();
		renderWithApp( <InsightsTracking /> );
		await countPlays();

		expect(
			screen.getByText( /counted on your own site, without cookies/ )
		).toBeInTheDocument();
	} );

	describe( 'the country of a listener', () => {
		it( 'says before it is turned on that IP addresses leave the site', async () => {
			fakeSite();
			renderWithApp( <InsightsTracking /> );
			await countPlays();

			expect(
				screen.getByText(
					/the IP address of a visitor who presses play is sent to a lookup service outside your site/
				)
			).toBeInTheDocument();
		} );

		it( 'reminds about the privacy policy once it is on, and saves only on Save', async () => {
			const site = fakeSite();
			renderWithApp( <InsightsTracking /> );
			await countPlays();

			fireEvent.click( location() );

			expect(
				screen.getAllByText( /Say in your privacy policy/ ).length
			).toBeGreaterThan( 0 );
			expect( site.posts ).toHaveLength( 0 );

			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { listener_location: true } ] )
			);
		} );

		it( 'can be turned off again', async () => {
			const site = fakeSite( { ...ON, listener_location: true } );
			renderWithApp( <InsightsTracking /> );
			await countPlays();

			fireEvent.click( location() );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { listener_location: false } ] )
			);
		} );
	} );

	describe( 'which posts are tracked', () => {
		it( 'tracks chosen posts by number, as numbers', async () => {
			const site = fakeSite();
			renderWithApp( <InsightsTracking /> );
			await countPlays();

			fireEvent.click(
				screen.getByRole( 'radio', { name: 'Only posts I choose' } )
			);
			const input = screen.getByRole( 'combobox', {
				name: 'Posts, by number',
			} );
			fireEvent.change( input, { target: { value: '128' } } );
			fireEvent.keyDown( input, {
				key: 'Enter',
				code: 'Enter',
				keyCode: 13,
			} );
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { posts: [ 128 ] } ] )
			);
		} );

		it( 'cannot be saved with no post chosen, and says why', async () => {
			const site = fakeSite();
			renderWithApp( <InsightsTracking /> );
			await countPlays();

			fireEvent.click(
				screen.getByRole( 'radio', { name: 'Only posts I choose' } )
			);

			expect(
				screen.getByText(
					'Choose at least one post, or choose All posts.'
				)
			).toBeInTheDocument();
			expect( saveButton() ).toBeDisabled();
			expect( site.posts ).toHaveLength( 0 );
		} );

		it( 'shows the posts a site already chose', async () => {
			fakeSite( { ...ON, posts: [ 12, 128 ] } );
			renderWithApp( <InsightsTracking /> );
			await countPlays();

			expect(
				screen.getByRole( 'radio', { name: 'Only posts I choose' } )
			).toBeChecked();
			expect( screen.getByText( '12' ) ).toBeInTheDocument();
			expect( screen.getByText( '128' ) ).toBeInTheDocument();
		} );

		it( 'goes back to all posts', async () => {
			const site = fakeSite( { ...ON, posts: [ 12 ] } );
			renderWithApp( <InsightsTracking /> );
			await countPlays();

			fireEvent.click(
				screen.getByRole( 'radio', { name: 'All posts' } )
			);
			fireEvent.click( saveButton() );

			await waitFor( () =>
				expect( site.posts ).toEqual( [ { posts: [ 'all' ] } ] )
			);
		} );
	} );

	it( 'is the same with and without Pro: no Pro line, no disabled control', async () => {
		fakeSite();
		const { container } = renderWithApp( <InsightsTracking /> );
		await countPlays();

		expect(
			container.querySelectorAll(
				'.atlasvoice-pronote, .atlasvoice-pro, input[disabled], [aria-disabled="true"]'
			)
		).toHaveLength( 0 );
	} );

	it( 'says why a save was refused and keeps the choice on screen', async () => {
		fakeSite( ON, {
			failPost: { status: 400, message: 'This must be on or off.' },
		} );
		const { context } = renderWithApp( <InsightsTracking /> );

		fireEvent.click( await countPlays() );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: This must be on or off.',
				'error'
			)
		);
		expect( await countPlays() ).not.toBeChecked();
	} );

	it( 'offers to try again when the settings cannot be loaded', async () => {
		const site = fakeSite( ON, {
			failGet: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <InsightsTracking /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await countPlays() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'has no accessibility violations, with the lookup on and posts chosen', async () => {
		fakeSite( {
			count_plays: true,
			listener_location: true,
			posts: [ 12 ],
		} );
		const { container } = renderWithApp( <InsightsTracking /> );
		await countPlays();

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
