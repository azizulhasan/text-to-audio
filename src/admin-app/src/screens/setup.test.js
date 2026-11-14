import '@testing-library/jest-dom';
import {
	act,
	fireEvent,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { getScreenComponent } from './registry';
import Setup, { shownSteps, stepNames } from './Setup';

expect.extend( toHaveNoViolations );

const SAMPLE = {
	id: 12,
	title: 'The old mill',
	text: 'The old mill. It stood by the river.',
	url: 'https://example.com/the-old-mill/',
	language: 'en-GB',
};

/** What a new site answers on each route the wizard uses. */
const SITE = {
	setup: {
		finished: false,
		mode: 'staging',
		steps: [ 'hear', 'where', 'voice', 'look', 'live' ],
		voice: 'Default',
		stores_audio: false,
		sample: SAMPLE,
	},
	where: {
		post_types: [ 'post' ],
		choices: {
			post_types: [
				{ id: 'post', name: 'Posts' },
				{ id: 'page', name: 'Pages' },
			],
		},
	},
	look: { background: '#ffffff', text: '#000000', radius: 10, height: 50 },
	tracking: { count_plays: false, listener_location: false, posts: [] },
};

/**
 * A stand-in for the site. A POST merges what was sent into the route's
 * answer; finishing sets the mode that was asked for.
 *
 * @param {Object} overrides        Answers to replace, by route name.
 * @param {Object} options
 * @param {string} options.failPost Name of a route whose save is refused.
 * @param {string} options.failGet  Name of a route whose load is refused.
 * @return {Object} { sent }: every POST as [ route, body ].
 */
function fakeSite( overrides = {}, { failPost, failGet } = {} ) {
	const site = { sent: [], state: { ...SITE, ...overrides } };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );

	window.fetch = jest.fn( ( url, options = {} ) => {
		const path = String( url ).split( 'tta/v1/' )[ 1 ];
		const name = path.split( '/' )[ 0 ];

		if ( options.method === 'POST' ) {
			const body = JSON.parse( options.body );
			if ( failPost === name ) {
				return reply(
					{ message: 'The database is away.' },
					false,
					500
				);
			}
			site.sent.push( [ path, body ] );
			if ( path === 'setup/finish' ) {
				site.state.setup = {
					...site.state.setup,
					finished: true,
					mode: body.go_live ? 'production' : 'staging',
				};

				return reply( site.state.setup );
			}
			site.state[ name ] = { ...site.state[ name ], ...body };

			return reply( site.state[ name ] );
		}

		if ( failGet === name ) {
			return reply( { message: 'Not now.' }, false, 500 );
		}

		return reply( site.state[ name ] );
	} );

	return site;
}

/** A stand-in for the browser's own voice. */
function fakeVoice() {
	const voice = { spoken: [], cancel: jest.fn() };
	voice.speak = jest.fn( ( words ) => voice.spoken.push( words ) );
	window.speechSynthesis = voice;
	window.SpeechSynthesisUtterance = function Utterance( text ) {
		this.text = text;
	};

	return voice;
}

const next = () => screen.getByRole( 'button', { name: 'Continue' } );
const stepTitle = ( name ) => screen.findByRole( 'heading', { name } );

/**
 * Presses Continue until a step is open.
 *
 * @param {string} name The heading of the step to reach.
 */
async function goTo( name ) {
	const order = [
		'Here is your newest post, read aloud',
		'Where should people be able to listen?',
		'How should your posts sound?',
		'Make it look like your site',
		'Check it, then go live',
	];
	await stepTitle( order[ 0 ] );
	for ( let i = 0; i < order.indexOf( name ); i++ ) {
		await waitFor( () => expect( next() ).toBeEnabled() );
		fireEvent.click( next() );
		await stepTitle( order[ i + 1 ] );
	}
	await waitFor( () =>
		expect( screen.queryByText( 'Loading…' ) ).not.toBeInTheDocument()
	);
}

describe( 'Setup', () => {
	afterEach( () => {
		delete window.speechSynthesis;
		delete window.SpeechSynthesisUtterance;
	} );

	it( 'is the screen of the route setup', () => {
		expect( getScreenComponent( 'setup' ) ).toBeTruthy();
	} );

	it( 'opens on the first step and lists every step', async () => {
		fakeSite();
		fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );

		await stepTitle( 'Here is your newest post, read aloud' );
		expect( screen.getByText( 'Step 1 of 5' ) ).toBeInTheDocument();

		const steps = screen.getByRole( 'navigation', {
			name: 'Setup steps',
		} );
		expect(
			within( steps )
				.getAllByRole( 'button' )
				.map( ( button ) => button.textContent )
		).toEqual( [
			'1Hear it',
			'2Where',
			'3Voice',
			'4Look',
			'5Check and go live',
		] );
		expect(
			within( steps ).getByRole( 'button', { name: /Hear it/ } )
		).toHaveAttribute( 'aria-current', 'step' );
		// A later step opens with Continue only, never by a jump.
		expect(
			within( steps ).getByRole( 'button', { name: /Look/ } )
		).toBeDisabled();
	} );

	it( 'reads the newest post with the browser’s own voice, in the site’s language', async () => {
		const site = fakeSite();
		const voice = fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Play my newest post' } )
		);

		expect( voice.spoken ).toHaveLength( 1 );
		expect( voice.spoken[ 0 ].text ).toBe( SAMPLE.text );
		expect( voice.spoken[ 0 ].lang ).toBe( 'en-GB' );
		expect(
			screen.getByRole( 'button', { name: 'Stop' } )
		).toBeInTheDocument();

		act( () => voice.spoken[ 0 ].onend() );
		expect(
			screen.getByRole( 'button', { name: 'Play it again' } )
		).toBeInTheDocument();
		// Nothing left the site.
		expect( site.sent ).toEqual( [] );
	} );

	it( 'stops the voice when the step is left', async () => {
		fakeSite();
		const voice = fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Play my newest post' } )
		);
		voice.cancel.mockClear();
		fireEvent.click( next() );

		await stepTitle( 'Where should people be able to listen?' );
		expect( voice.cancel ).toHaveBeenCalled();
	} );

	it( 'lets a browser without a voice continue', async () => {
		fakeSite();
		const { container } = renderWithApp( <Setup />, { hash: '#/setup' } );

		await stepTitle( 'Here is your newest post, read aloud' );
		// A notice is also read out, so look inside the screen only.
		expect( container ).toHaveTextContent(
			'This browser has no built-in voice'
		);
		expect(
			screen.queryByRole( 'button', { name: 'Play my newest post' } )
		).not.toBeInTheDocument();
		expect( next() ).toBeEnabled();
	} );

	it( 'says so when the site has no post yet, and continues', async () => {
		fakeSite( { setup: { ...SITE.setup, sample: null } } );
		fakeVoice();
		const { container } = renderWithApp( <Setup />, { hash: '#/setup' } );

		await stepTitle( 'Here is your newest post, read aloud' );
		expect( container ).toHaveTextContent(
			'There is no published post to read yet.'
		);
		expect( next() ).toBeEnabled();
	} );

	it( 'saves the chosen content types when Continue is pressed, not before', async () => {
		const site = fakeSite();
		fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Where should people be able to listen?' );

		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Pages' } ) );
		expect( site.sent ).toEqual( [] );

		fireEvent.click( next() );
		await stepTitle( 'How should your posts sound?' );

		expect( site.sent ).toEqual( [
			[ 'where', { post_types: [ 'post', 'page' ] } ],
		] );
	} );

	it( 'sends nothing for a step that was not changed', async () => {
		const site = fakeSite();
		fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );

		await goTo( 'Make it look like your site' );

		expect( site.sent ).toEqual( [] );
	} );

	it( 'does not continue without a content type, and says why', async () => {
		const site = fakeSite();
		fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Where should people be able to listen?' );

		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Posts' } ) );

		expect( next() ).toBeDisabled();
		expect(
			screen.getByText( 'Choose at least one content type' )
		).toBeInTheDocument();
		expect( site.sent ).toEqual( [] );
	} );

	it( 'shows the voice in use and opens Voice to change it', async () => {
		fakeSite();
		fakeVoice();
		const { context } = renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'How should your posts sound?' );

		expect( screen.getByText( 'Default' ) ).toBeInTheDocument();
		expect(
			screen.getByText( /It reads in the visitor’s browser/ )
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Choose another voice' } )
		);
		expect( context.go ).toHaveBeenCalledWith( 'voice:voice' );
	} );

	it( 'saves the style and the shape, and nothing else of the look', async () => {
		const site = fakeSite();
		fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Make it look like your site' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Indigo' } ) );
		expect(
			screen.getByRole( 'button', { name: 'Indigo' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
		fireEvent.click( screen.getByRole( 'radio', { name: 'Pill' } ) );
		fireEvent.click( next() );
		await stepTitle( 'Check it, then go live' );

		expect( site.sent ).toEqual( [
			[ 'look', { background: '#5646e5', text: '#ffffff', radius: 100 } ],
		] );
	} );

	it( 'goes back without saving and keeps what was chosen', async () => {
		const site = fakeSite();
		fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Where should people be able to listen?' );

		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Pages' } ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'Back' } ) );
		await stepTitle( 'Here is your newest post, read aloud' );
		expect( site.sent ).toEqual( [] );

		fireEvent.click( next() );
		await stepTitle( 'Where should people be able to listen?' );
		expect(
			screen.getByRole( 'checkbox', { name: 'Pages' } )
		).toBeChecked();
	} );

	it( 'stays in staging unless going live is chosen', async () => {
		const site = fakeSite();
		fakeVoice();
		const { context } = renderWithApp( <Setup />, {
			hash: '#/setup',
			setSetupFinished: jest.fn(),
		} );
		await goTo( 'Check it, then go live' );

		expect(
			screen.getByRole( 'radio', { name: /Stay in staging/ } )
		).toBeChecked();
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Finish setup' } )
		);

		await stepTitle( 'You are set up, still in staging' );
		expect( site.sent ).toEqual( [
			[ 'setup/finish', { go_live: false } ],
		] );
		expect( context.setMode ).toHaveBeenCalledWith( 'staging' );
		expect( context.setSetupFinished ).toHaveBeenCalledWith( true );
	} );

	it( 'goes live and turns counting on when that is chosen', async () => {
		const site = fakeSite();
		fakeVoice();
		const { context } = renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Check it, then go live' );

		fireEvent.click(
			screen.getByRole( 'checkbox', { name: 'Count plays' } )
		);
		fireEvent.click( screen.getByRole( 'radio', { name: /Go live/ } ) );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Finish setup' } )
		);

		await stepTitle( 'You are live' );
		expect( site.sent ).toEqual( [
			[ 'tracking', { count_plays: true } ],
			[ 'setup/finish', { go_live: true } ],
		] );
		expect( context.setMode ).toHaveBeenCalledWith( 'production' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Go to Home' } ) );
		expect( context.go ).toHaveBeenCalledWith( 'overview' );
	} );

	it( 'opens the newest post in a new tab to check it', async () => {
		fakeSite();
		fakeVoice();
		renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Check it, then go live' );

		const link = screen.getByRole( 'link', { name: 'Open and listen' } );
		expect( link ).toHaveAttribute( 'href', SAMPLE.url );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noreferrer' );
	} );

	it( 'stays on the step and shows the site’s message when a save fails', async () => {
		const site = fakeSite( {}, { failPost: 'where' } );
		fakeVoice();
		const { context } = renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Where should people be able to listen?' );

		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Pages' } ) );
		fireEvent.click( next() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'This step was not saved: The database is away.',
				'error'
			)
		);
		expect(
			screen.getByRole( 'heading', {
				name: 'Where should people be able to listen?',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'checkbox', { name: 'Pages' } )
		).toBeChecked();
		expect( site.sent ).toEqual( [] );
	} );

	it( 'does not finish when ending the setup fails', async () => {
		fakeSite( {}, { failPost: 'setup' } );
		fakeVoice();
		const { context } = renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Check it, then go live' );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Finish setup' } )
		);

		await waitFor( () => expect( context.notify ).toHaveBeenCalled() );
		expect( context.setMode ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'heading', { name: 'Check it, then go live' } )
		).toBeInTheDocument();
	} );

	it( 'lets a step that cannot be loaded be skipped', async () => {
		const site = fakeSite( {}, { failGet: 'look' } );
		fakeVoice();
		const { container } = renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Make it look like your site' );

		expect( container ).toHaveTextContent(
			'This step could not be loaded: Not now.'
		);
		fireEvent.click( next() );

		await stepTitle( 'Check it, then go live' );
		expect( site.sent ).toEqual( [] );
	} );

	it( 'shows the site’s message when the setup cannot be loaded, and tries again', async () => {
		fakeSite( {}, { failGet: 'setup' } );
		fakeVoice();
		const { container } = renderWithApp( <Setup />, { hash: '#/setup' } );

		await waitFor( () =>
			expect( container ).toHaveTextContent(
				'The setup could not be loaded: Not now.'
			)
		);

		fakeSite();
		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		await stepTitle( 'Here is your newest post, read aloud' );
	} );

	it( 'shows a step an extension brought, and leaves out one nobody draws', () => {
		expect( shownSteps( [ 'hear', 'mp3', 'live' ] ) ).toEqual( [
			'hear',
			'live',
		] );

		addFilter(
			'atlasvoice.slot.setup.step.mp3',
			'test/setup',
			( fills ) => [ ...fills, () => null ]
		);
		expect( shownSteps( [ 'hear', 'mp3', 'live' ] ) ).toEqual( [
			'hear',
			'mp3',
			'live',
		] );
		removeFilter( 'atlasvoice.slot.setup.step.mp3', 'test/setup' );

		expect( shownSteps( null ) ).toEqual( [] );
		expect( Object.keys( stepNames() ) ).toEqual( [
			'hear',
			'where',
			'voice',
			'look',
			'live',
		] );
	} );

	it( 'runs a step an extension brought: its name, its reason to wait and its save', async () => {
		const site = fakeSite( {
			setup: { ...SITE.setup, steps: [ 'hear', 'extra', 'live' ] },
		} );
		fakeVoice();
		const saved = jest.fn( () => Promise.resolve() );
		const Extra = ( { setup, onSave, setBlocked } ) => (
			<div>
				<p>Extra part for { setup.voice }</p>
				<button onClick={ () => setBlocked( 'Fill the extra box' ) }>
					Block
				</button>
				<button
					onClick={ () => {
						setBlocked( '' );
						onSave( saved );
					} }
				>
					Ready
				</button>
			</div>
		);
		addFilter(
			'atlasvoice.slot.setup.step.extra',
			'test/extra',
			( fills ) => [ ...fills, Extra ]
		);
		addFilter( 'atlasvoice.setupStepNames', 'test/extra', ( names ) => ( {
			...names,
			extra: 'Extra step',
			hear: 'Renamed by an extension',
		} ) );

		const { unmount } = renderWithApp( <Setup />, { hash: '#/setup' } );
		await stepTitle( 'Here is your newest post, read aloud' );
		// A built-in step keeps its own name.
		expect(
			screen.getByRole( 'button', { name: /Hear it/ } )
		).toBeInTheDocument();
		fireEvent.click( next() );

		await stepTitle( 'Extra step' );
		expect(
			screen.getByText( 'Extra part for Default' )
		).toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'Block' } ) );
		expect( next() ).toBeDisabled();
		expect( screen.getByText( 'Fill the extra box' ) ).toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'Ready' } ) );
		fireEvent.click( next() );

		await stepTitle( 'Check it, then go live' );
		expect( saved ).toHaveBeenCalledTimes( 1 );

		// What that step asked for does not reach the next step.
		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: 'Finish setup' } )
			).toBeEnabled()
		);
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Finish setup' } )
		);
		await stepTitle( 'You are set up, still in staging' );
		expect( saved ).toHaveBeenCalledTimes( 1 );
		expect( site.sent ).toEqual( [
			[ 'setup/finish', { go_live: false } ],
		] );

		// The screen goes first: a slot redraws when its filter is removed.
		unmount();
		removeFilter( 'atlasvoice.slot.setup.step.extra', 'test/extra' );
		removeFilter( 'atlasvoice.setupStepNames', 'test/extra' );
	} );

	it( 'stays on the step of an extension when its save fails', async () => {
		fakeSite( {
			setup: { ...SITE.setup, steps: [ 'hear', 'extra', 'live' ] },
		} );
		fakeVoice();
		const Extra = ( { onSave } ) => (
			<button
				onClick={ () =>
					onSave( () => Promise.reject( new Error( 'No email.' ) ) )
				}
			>
				Ready
			</button>
		);
		addFilter(
			'atlasvoice.slot.setup.step.extra',
			'test/fail',
			( fills ) => [ ...fills, Extra ]
		);

		const { context, unmount } = renderWithApp( <Setup />, {
			hash: '#/setup',
		} );
		await stepTitle( 'Here is your newest post, read aloud' );
		fireEvent.click( next() );
		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Ready' } )
		);
		fireEvent.click( next() );

		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'This step was not saved: No email.',
				'error'
			)
		);
		expect(
			screen.getByRole( 'button', { name: 'Ready' } )
		).toBeInTheDocument();

		unmount();
		removeFilter( 'atlasvoice.slot.setup.step.extra', 'test/fail' );
	} );

	it( 'ignores step names that are not a map', () => {
		addFilter( 'atlasvoice.setupStepNames', 'test/bad', () => 'broken' );

		expect( stepNames().hear ).toBe( 'Hear it' );

		removeFilter( 'atlasvoice.setupStepNames', 'test/bad' );
	} );

	it( 'has no accessibility violations on a form step and at the end', async () => {
		fakeSite();
		fakeVoice();
		const { container } = renderWithApp( <Setup />, { hash: '#/setup' } );
		await goTo( 'Make it look like your site' );
		expect( await axe( container ) ).toHaveNoViolations();

		fireEvent.click( next() );
		await stepTitle( 'Check it, then go live' );
		await waitFor( () =>
			expect( screen.queryByText( 'Loading…' ) ).not.toBeInTheDocument()
		);
		expect( await axe( container ) ).toHaveNoViolations();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Finish setup' } )
		);
		await stepTitle( 'You are set up, still in staging' );
		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
