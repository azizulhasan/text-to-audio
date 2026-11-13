import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { sameValue } from '../hooks/use-settings-form';
import { renderWithApp } from '../test-utils';
import PlayerWords, { iconName, stateLabel } from './PlayerWords';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const SVG = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>';
const ICONS = [
	'play',
	'pause',
	'stop',
	'replay',
	'headphones',
	'ear',
	'volume-up',
	'volume-mute',
].map( ( id ) => ( { id: 'preset:' + id, svg: SVG } ) );

const states = () => ( {
	listen: {
		text: 'Listen',
		tooltip: 'Click to listen post.',
		icon: 'preset:play',
	},
	pause: { text: 'Pause', tooltip: 'Pause playback', icon: 'preset:pause' },
	resume: {
		text: 'Resume',
		tooltip: 'Resume playback',
		icon: 'preset:play',
	},
	replay: {
		text: 'Replay',
		tooltip: 'Click to listen post.',
		icon: 'preset:replay',
	},
} );

/** The answer of a site with the free plugin and the browser voice. */
const FREE = {
	show_icon: true,
	player_id: 1,
	applies: true,
	players: { 1: states() },
	names: { 1: 'Default' },
	defaults: { 1: states() },
	icons: ICONS,
};

/** The answer of a site with Pro: a second browser-voice player. */
const PRO = {
	...FREE,
	players: { 1: states(), 2: states() },
	names: { 1: 'Default', 2: 'Default Pro' },
	defaults: { 1: states(), 2: states() },
};

/**
 * A stand-in for the site's words route. A POST replaces what was sent,
 * like the answer of Player\Words::save() shows it.
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
const ready = () =>
	screen.findByRole( 'heading', { name: 'Browser voice button' } );

/**
 * One state of a player's button.
 *
 * @param {string} label  The moment, e.g. "Before playing".
 * @param {number} player Which player, counted on the screen from 0.
 * @return {Object} Queries inside that state.
 */
function row( label, player = 0 ) {
	return within( screen.getAllByRole( 'group', { name: label } )[ player ] );
}

afterEach( () => {
	delete window.fetch;
} );

describe( 'comparing the words on screen with the saved ones', () => {
	it( 'treats two maps with the same content as the same', () => {
		expect( sameValue( { 1: states() }, { 1: states() } ) ).toBe( true );
	} );

	it( 'sees a changed word, a missing state and an extra state', () => {
		const changed = states();
		changed.listen.text = 'Hear it';
		const missing = states();
		delete missing.replay;

		expect( sameValue( states(), changed ) ).toBe( false );
		expect( sameValue( states(), missing ) ).toBe( false );
		expect( sameValue( missing, states() ) ).toBe( false );
		expect( sameValue( {}, null ) ).toBe( false );
		expect( sameValue( {}, [] ) ).toBe( false );
	} );
} );

describe( 'the words in words', () => {
	it( 'names each moment of the button', () => {
		expect( stateLabel( 'listen' ) ).toBe( 'Before playing' );
		expect( stateLabel( 'pause' ) ).toBe( 'While playing' );
		expect( stateLabel( 'resume' ) ).toBe( 'After pausing' );
		expect( stateLabel( 'replay' ) ).toBe( 'At the end' );
	} );

	it( 'names every icon the plugin ships, and survives a new one', () => {
		for ( const icon of ICONS ) {
			expect( iconName( icon.id ) ).not.toMatch( /preset:/ );
		}
		expect( iconName( 'custom' ) ).toBe( 'Your own icon' );
		expect( iconName( 'preset:rocket' ) ).toBe( 'rocket' );
	} );
} );

describe( 'Player › Buttons & words', () => {
	it( 'is the screen of the player:words route', () => {
		expect( getScreenComponent( 'player:words' ) ).toBeTruthy();
	} );

	it( 'shows the words, tooltips and icons the site has stored', async () => {
		const stored = states();
		stored.listen = {
			text: 'Play article',
			tooltip: 'Hear this post',
			icon: 'preset:headphones',
		};
		fakeSite( { ...FREE, players: { 1: stored } } );
		renderWithApp( <PlayerWords /> );
		await ready();

		const listen = row( 'Before playing' );
		expect( listen.getByLabelText( 'Text' ) ).toHaveValue( 'Play article' );
		expect( listen.getByLabelText( 'Tooltip' ) ).toHaveValue(
			'Hear this post'
		);
		expect( listen.getByLabelText( 'Icon' ) ).toHaveValue(
			'preset:headphones'
		);
		expect( row( 'At the end' ).getByLabelText( 'Text' ) ).toHaveValue(
			'Replay'
		);
		expect(
			screen.getByRole( 'checkbox', { name: 'Show the icon' } )
		).toBeChecked();
	} );

	it( 'writes nothing until Save, and then the words with the change', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerWords /> );
		await ready();

		fireEvent.change( row( 'Before playing' ).getByLabelText( 'Text' ), {
			target: { value: 'Listen to this article' },
		} );
		expect( site.posts ).toHaveLength( 0 );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();

		fireEvent.click( saveButton() );

		await waitFor( () => expect( site.posts ).toHaveLength( 1 ) );
		const sent = site.posts[ 0 ];
		// Only the words are sent, not "show the icon", which did not change.
		expect( Object.keys( sent ) ).toEqual( [ 'players' ] );
		expect( sent.players[ 1 ].listen ).toEqual( {
			text: 'Listen to this article',
			tooltip: 'Click to listen post.',
			icon: 'preset:play',
		} );
		expect( sent.players[ 1 ].pause ).toEqual( states().pause );
	} );

	it( 'says when the visitors see the change', async () => {
		fakeSite();
		const { context } = renderWithApp( <PlayerWords /> );
		await ready();

		fireEvent.click(
			screen.getByRole( 'checkbox', { name: 'Show the icon' } )
		);
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Words saved. Visitors see the change on their next page load.'
			)
		);
	} );

	it( 'saves "show the icon" alone when only that changed', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerWords /> );
		await ready();

		fireEvent.click(
			screen.getByRole( 'checkbox', { name: 'Show the icon' } )
		);
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { show_icon: false } ] )
		);
	} );

	it( 'has nothing to save when a word is typed back', async () => {
		fakeSite();
		renderWithApp( <PlayerWords /> );
		await ready();

		const field = row( 'While playing' ).getByLabelText( 'Text' );
		fireEvent.change( field, { target: { value: 'Hold' } } );
		expect( saveButton() ).toBeEnabled();

		fireEvent.change( field, { target: { value: 'Pause' } } );
		expect( saveButton() ).toBeDisabled();
	} );

	it( 'offers every icon of the plugin by name, and saves the one chosen', async () => {
		const site = fakeSite();
		renderWithApp( <PlayerWords /> );
		await ready();

		const icon = row( 'Before playing' ).getByLabelText( 'Icon' );
		expect(
			within( icon )
				.getAllByRole( 'option' )
				.map( ( option ) => option.textContent )
		).toEqual( [
			'Play',
			'Pause',
			'Stop',
			'Replay',
			'Headphones',
			'Ear',
			'Speaker',
			'Speaker, muted',
		] );

		fireEvent.change( icon, { target: { value: 'preset:headphones' } } );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts[ 0 ].players[ 1 ].listen.icon ).toBe(
				'preset:headphones'
			)
		);
	} );

	it( 'keeps an icon drawn on the classic screen until another is chosen', async () => {
		const stored = states();
		stored.listen.icon = 'custom';
		const site = fakeSite( { ...FREE, players: { 1: stored } } );
		renderWithApp( <PlayerWords /> );
		await ready();

		const listen = row( 'Before playing' );
		expect( listen.getByLabelText( 'Icon' ) ).toHaveValue( 'custom' );
		expect(
			within( listen.getByLabelText( 'Icon' ) ).getByRole( 'option', {
				name: 'Your own icon',
			} )
		).toBeInTheDocument();
		// Other states do not offer it: there is no drawing to keep.
		expect(
			within(
				row( 'While playing' ).getByLabelText( 'Icon' )
			).queryByRole( 'option', { name: 'Your own icon' } )
		).not.toBeInTheDocument();

		fireEvent.change( listen.getByLabelText( 'Text' ), {
			target: { value: 'Hear it' },
		} );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts[ 0 ].players[ 1 ].listen.icon ).toBe( 'custom' )
		);
	} );

	it( 'shows the default word while a text is empty', async () => {
		const stored = states();
		stored.listen.text = '';
		fakeSite( { ...FREE, players: { 1: stored } } );
		renderWithApp( <PlayerWords /> );
		await ready();

		expect(
			row( 'Before playing' ).getByLabelText( 'Text' )
		).toHaveAttribute( 'placeholder', 'Listen' );
	} );

	it( 'stops a word at the length the site accepts', async () => {
		fakeSite();
		renderWithApp( <PlayerWords /> );
		await ready();

		expect(
			row( 'Before playing' ).getByLabelText( 'Text' )
		).toHaveAttribute( 'maxlength', '100' );
		expect(
			row( 'Before playing' ).getByLabelText( 'Tooltip' )
		).toHaveAttribute( 'maxlength', '100' );
	} );

	it( 'resets a player to the default words, and writes only on Save', async () => {
		const stored = states();
		stored.listen.text = 'Hear it';
		stored.replay.icon = 'preset:ear';
		const site = fakeSite( { ...FREE, players: { 1: stored } } );
		renderWithApp( <PlayerWords /> );
		await ready();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Reset to the defaults' } )
		);

		expect( row( 'Before playing' ).getByLabelText( 'Text' ) ).toHaveValue(
			'Listen'
		);
		expect( site.posts ).toHaveLength( 0 );

		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( site.posts ).toEqual( [ { players: { 1: states() } } ] )
		);
	} );

	describe( 'the players of the site', () => {
		it( 'shows one button on a site without Pro, and nothing about Pro', async () => {
			fakeSite();
			const { container } = renderWithApp( <PlayerWords /> );
			await ready();

			expect(
				screen.getAllByRole( 'group', { name: 'Before playing' } )
			).toHaveLength( 1 );
			expect(
				container.querySelectorAll(
					'.atlasvoice-pronote, .atlasvoice-pro, input[disabled], select[disabled]'
				)
			).toHaveLength( 0 );
		} );

		it( 'shows the second player the site lists, with its own words', async () => {
			const site = fakeSite( PRO );
			renderWithApp( <PlayerWords />, { boot: { isPro: true } } );
			await ready();

			expect(
				screen.getByRole( 'heading', { name: 'Player: Default Pro' } )
			).toBeInTheDocument();

			fireEvent.change(
				row( 'Before playing', 1 ).getByLabelText( 'Text' ),
				{ target: { value: 'Play' } }
			);
			fireEvent.click( saveButton() );

			await waitFor( () => expect( site.posts ).toHaveLength( 1 ) );
			expect( site.posts[ 0 ].players[ 2 ].listen.text ).toBe( 'Play' );
			expect( site.posts[ 0 ].players[ 1 ].listen.text ).toBe( 'Listen' );
		} );
	} );

	describe( 'when the voice in use plays an audio file', () => {
		// The notice is also spoken through a live region that outlives a
		// test, so these look inside the screen only.
		const notice = ( container ) =>
			container.querySelector( '.components-notice' );

		it( 'says the words show with the browser voice, and opens Voice', async () => {
			fakeSite( { ...FREE, player_id: 3, applies: false } );
			const { container, context } = renderWithApp( <PlayerWords /> );
			await ready();

			expect( notice( container ) ).toHaveTextContent(
				/its player has its own controls/
			);

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Open Voice' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'voice:voice' );
		} );

		it( 'says nothing when the browser voice is in use', async () => {
			fakeSite();
			const { container } = renderWithApp( <PlayerWords /> );
			await ready();

			expect( notice( container ) ).toBeNull();
		} );
	} );

	it( 'says why a save was refused and keeps the words on screen', async () => {
		fakeSite( FREE, {
			failPost: { status: 400, message: 'This icon does not exist.' },
		} );
		const { context } = renderWithApp( <PlayerWords /> );
		await ready();

		fireEvent.change( row( 'Before playing' ).getByLabelText( 'Text' ), {
			target: { value: 'Hear it' },
		} );
		fireEvent.click( saveButton() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: This icon does not exist.',
				'error'
			)
		);
		expect( row( 'Before playing' ).getByLabelText( 'Text' ) ).toHaveValue(
			'Hear it'
		);
	} );

	it( 'offers to try again when the words cannot be loaded', async () => {
		const site = fakeSite( FREE, {
			failGet: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <PlayerWords /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await ready() ).toBeInTheDocument();
		expect( site.gets ).toBe( 2 );
	} );

	it( 'survives an answer without players or icons', async () => {
		fakeSite( { show_icon: false, applies: true } );
		renderWithApp( <PlayerWords /> );

		expect(
			await screen.findByRole( 'checkbox', { name: 'Show the icon' } )
		).not.toBeChecked();
	} );

	it( 'has no accessibility violations with one player and with two', async () => {
		fakeSite( { ...FREE, applies: false } );
		const free = renderWithApp( <PlayerWords /> );
		await ready();
		expect( await axe( free.container ) ).toHaveNoViolations();
		free.unmount();

		fakeSite( PRO );
		const pro = renderWithApp( <PlayerWords />, { boot: { isPro: true } } );
		await ready();
		expect( await axe( pro.container ) ).toHaveNoViolations();
	} );
} );
