import '@testing-library/jest-dom';
import {
	act,
	cleanup,
	fireEvent,
	screen,
	within,
} from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { axe, toHaveNoViolations } from 'jest-axe';

import StatusBar from '../shell/StatusBar';
import { renderWithApp } from '../test-utils';
import Home from './Home';
import {
	audienceWords,
	contentWords,
	modeDetail,
	positionWords,
	safeWebLink,
	voiceWords,
} from './home-words';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

/** The summary as the site's route returns it: Free, staging, setup finished. */
const SUMMARY = {
	mode: 'staging',
	live: false,
	setup_finished: true,
	is_pro: false,
	voice: {
		player_id: 3,
		engine: 'AtlasVoice TTS',
		stores_audio: true,
		language: 'en-GB',
		voice: 'Emma',
	},
	player: { position: 'before_content', shown_to: [ 'all' ] },
	content: { automatic: true, post_types: [ 'Posts', 'Pages' ] },
	usage: { connected: true, chars_used: 85000, chars_limit: 100000 },
	links: {
		visitor: 'https://site.test/the-old-mill/',
		demo: 'https://atlasaidev.com/plugins/text-to-speech-pro/demo/?utm_content=home_card',
	},
	hidden: [],
};

const summary = ( changes ) => ( { ...SUMMARY, ...changes } );

/**
 * A stand-in for the site: the home route, the dismiss route and the mode route.
 *
 * @param {Object} answer         What GET tta/v1/home returns.
 * @param {Object} options
 * @param {Object} options.fail   { status, message } to refuse the load, once.
 * @param {Object} options.noSave { status, message } to refuse the dismiss.
 * @return {Object} { calls }.
 */
function fakeSite( answer = SUMMARY, { fail, noSave } = {} ) {
	const site = { calls: [] };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );
	let failed = false;

	window.fetch = jest.fn( ( url, options = {} ) => {
		const method = options.method || 'GET';
		const body = options.body ? JSON.parse( options.body ) : undefined;
		site.calls.push( { url, method, body } );

		if ( url.endsWith( 'tta/v1/home/dismiss' ) ) {
			return noSave
				? reply( { message: noSave.message }, false, noSave.status )
				: reply( { hidden: [ 'pro_card' ] } );
		}
		if ( url.endsWith( 'tta/v1/mode' ) ) {
			return reply( {
				mode: body.action === 'go-live' ? 'production' : 'staging',
			} );
		}
		if ( fail && ! failed ) {
			failed = true;
			return reply( { message: fail.message }, false, fail.status );
		}

		return reply( answer );
	} );

	return site;
}

afterEach( () => {
	delete window.fetch;
} );

describe( 'The words of Home', () => {
	it( 'says where the player sits', () => {
		expect( positionWords( 'before_content' ) ).toBe(
			'Before the content'
		);
		expect( positionWords( 'after_content' ) ).toBe( 'After the content' );
		expect( positionWords( 'something_new' ) ).toBe(
			'Where you placed it'
		);
		expect( positionWords( undefined ) ).toBe( 'Where you placed it' );
	} );

	it( 'says who sees the player', () => {
		expect( audienceWords( [ 'all' ] ) ).toBe( 'shown to everyone' );
		expect( audienceWords( [] ) ).toBe( 'shown to everyone' );
		expect( audienceWords( undefined ) ).toBe( 'shown to everyone' );
		expect( audienceWords( [ 'administrator' ] ) ).toBe(
			'shown to some user roles'
		);
	} );

	it( 'names the voice and its engine, or says it is not chosen', () => {
		expect( voiceWords( SUMMARY.voice ) ).toBe( 'Emma · AtlasVoice TTS' );
		expect( voiceWords( { voice: '', engine: 'Default' } ) ).toBe(
			'Default'
		);
		expect( voiceWords( { voice: '', engine: '' } ) ).toBe(
			'Not chosen yet'
		);
		expect( voiceWords( undefined ) ).toBe( 'Not chosen yet' );
	} );

	it( 'says what is read', () => {
		expect( contentWords( SUMMARY.content ) ).toBe( 'Posts, Pages' );
		expect(
			contentWords( { automatic: false, post_types: [ 'Posts' ] } )
		).toBe( 'Only where you add the player' );
		expect( contentWords( { automatic: true, post_types: [] } ) ).toBe(
			'Nothing chosen yet'
		);
		expect( contentWords( undefined ) ).toBe( 'Nothing chosen yet' );
	} );

	it( 'explains the mode', () => {
		expect( modeDetail( false, SUMMARY ) ).toMatch(
			/only logged-in administrators/
		);
		expect( modeDetail( true, SUMMARY ) ).toBe(
			'On Posts, Pages, shown to everyone.'
		);
	} );

	it.each( [
		[ 'https://site.test/a-post/', true ],
		[ 'http://localhost/tts/a-post/', true ],
		// eslint-disable-next-line no-script-url
		[ 'javascript:alert(1)', false ],
		[ 'data:text/html,<script>1</script>', false ],
		[ '/a-post/', false ],
		[ '', false ],
		[ undefined, false ],
	] )( 'opens only web addresses (%s)', ( url, allowed ) => {
		expect( safeWebLink( url ) !== '' ).toBe( allowed );
	} );
} );

describe( 'Home', () => {
	it( 'is the screen of the overview route', () => {
		expect( getScreenComponent( 'overview' ) ).toBeTruthy();
	} );

	it( 'reads one summary from the site and nothing else', async () => {
		const site = fakeSite();
		renderWithApp( <Home /> );

		await screen.findByText( 'Right now, only you can hear it.' );

		expect( site.calls ).toEqual( [
			{
				url: 'https://site.test/wp-json/tta/v1/home',
				method: 'GET',
				body: undefined,
			},
		] );
	} );

	describe( 'who can hear it', () => {
		it( 'says so in staging and offers to go live as the main button', async () => {
			fakeSite();
			const { container } = renderWithApp( <Home /> );

			expect(
				await screen.findByText( /only logged-in administrators/ )
			).toBeInTheDocument();

			const primary = container.querySelectorAll( '.is-primary' );
			expect( primary ).toHaveLength( 1 );
			expect( primary[ 0 ] ).toHaveTextContent( 'Go live…' );
		} );

		it( 'asks before going live, with the same question as the status bar', async () => {
			fakeSite();
			const { context } = renderWithApp(
				<>
					<Home />
					<StatusBar />
				</>
			);
			await screen.findByText( 'Right now, only you can hear it.' );

			fireEvent.click(
				screen.getAllByRole( 'button', { name: 'Go live…' } )[ 0 ]
			);
			fireEvent.click( screen.getByRole( 'checkbox' ) );

			expect( context.confirm ).toHaveBeenCalledTimes( 2 );
			const [ fromHome ] = context.confirm.mock.calls[ 0 ];
			const [ fromBar ] = context.confirm.mock.calls[ 1 ];
			expect( fromHome.title ).toBe( 'Go live for visitors?' );
			expect( fromHome.title ).toBe( fromBar.title );
			expect( fromHome.body ).toBe( fromBar.body );
			expect( window.fetch ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'goes live only after the owner says yes', async () => {
			const site = fakeSite();
			const { context } = renderWithApp( <Home /> );
			await screen.findByText( 'Right now, only you can hear it.' );

			fireEvent.click(
				screen.getAllByRole( 'button', { name: 'Go live…' } )[ 0 ]
			);
			expect( site.calls ).toHaveLength( 1 );

			await act( async () => {
				await context.confirm.mock.calls[ 0 ][ 0 ].onOk();
			} );

			expect( site.calls[ 1 ] ).toEqual( {
				url: 'https://site.test/wp-json/tta/v1/mode',
				method: 'POST',
				body: { action: 'go-live', confirm: 'GO LIVE' },
			} );
			expect( context.setMode ).toHaveBeenCalledWith( 'production' );
			expect( context.notify ).toHaveBeenCalledWith(
				'AtlasVoice is live. Visitors can hear your posts.'
			);
		} );

		it( 'says who hears it when the site is live, without a go-live button', async () => {
			fakeSite( summary( { mode: 'production', live: true } ) );
			const { context } = renderWithApp( <Home />, {
				mode: 'production',
			} );

			expect(
				await screen.findByText( 'Right now, everyone can hear it.' )
			).toBeInTheDocument();
			expect(
				screen.getByText( 'On Posts, Pages, shown to everyone.' )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Go live…' } )
			).not.toBeInTheDocument();

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Change who sees it' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'player:place' );
		} );

		it( 'follows the app when the mode changes elsewhere, not the first answer', async () => {
			fakeSite();
			renderWithApp( <Home />, { mode: 'production' } );

			expect(
				await screen.findByText( 'Right now, everyone can hear it.' )
			).toBeInTheDocument();
		} );

		it( 'links to the newest post in a new tab', async () => {
			fakeSite();
			renderWithApp( <Home /> );

			const link = await screen.findByRole( 'link', {
				name: /Open your newest post/,
			} );
			expect( link ).toHaveAttribute(
				'href',
				'https://site.test/the-old-mill/'
			);
			expect( link ).toHaveAttribute( 'target', '_blank' );
		} );

		it( 'renders no link for an address that is not a web address', async () => {
			fakeSite(
				summary( {
					links: {
						// eslint-disable-next-line no-script-url
						visitor: 'javascript:alert(1)',
						// eslint-disable-next-line no-script-url
						demo: 'javascript:alert(2)',
					},
				} )
			);
			const { container } = renderWithApp( <Home /> );
			await screen.findByText( 'Right now, only you can hear it.' );

			expect( container.querySelectorAll( 'a' ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'the setup, step by step', () => {
		it( 'shows the four steps with their current values', async () => {
			fakeSite();
			renderWithApp( <Home /> );

			const list = await screen.findByRole( 'list', {
				name: 'Your setup, step by step',
			} );
			const steps = within( list ).getAllByRole( 'button' );

			expect( steps ).toHaveLength( 4 );
			expect( steps[ 0 ] ).toHaveTextContent( 'Voice' );
			expect( steps[ 0 ] ).toHaveTextContent( 'Emma · AtlasVoice TTS' );
			expect( steps[ 1 ] ).toHaveTextContent( 'Before the content' );
			expect( steps[ 2 ] ).toHaveTextContent( 'Posts, Pages' );
			expect( steps[ 3 ] ).toHaveTextContent(
				'Only you can hear it now'
			);
			expect( steps[ 3 ] ).toHaveClass( 'is-next' );
		} );

		it.each( [
			[ 0, 'voice' ],
			[ 1, 'player' ],
			[ 2, 'content' ],
		] )( 'opens the screen of step %i', async ( index, route ) => {
			fakeSite();
			const { context } = renderWithApp( <Home /> );
			const list = await screen.findByRole( 'list', {
				name: 'Your setup, step by step',
			} );

			fireEvent.click( within( list ).getAllByRole( 'button' )[ index ] );

			expect( context.go ).toHaveBeenCalledWith( route );
		} );

		it( 'asks to go live from the last step', async () => {
			fakeSite();
			const { context } = renderWithApp( <Home /> );
			const list = await screen.findByRole( 'list', {
				name: 'Your setup, step by step',
			} );

			fireEvent.click( within( list ).getAllByRole( 'button' )[ 3 ] );

			expect( context.confirm.mock.calls[ 0 ][ 0 ].title ).toBe(
				'Go live for visitors?'
			);
		} );

		it( 'marks the last step done when the site is live', async () => {
			fakeSite( summary( { mode: 'production', live: true } ) );
			renderWithApp( <Home />, { mode: 'production' } );
			const list = await screen.findByRole( 'list', {
				name: 'Your setup, step by step',
			} );
			const last = within( list ).getAllByRole( 'button' )[ 3 ];

			expect( last ).toHaveClass( 'is-done' );
			expect( last ).toHaveTextContent( 'Visitors hear your posts' );
		} );
	} );

	describe( 'a site that has not finished setup', () => {
		const unfinished = summary( { setup_finished: false } );

		it( 'offers to continue setup as the one main button, instead of the steps', async () => {
			fakeSite( unfinished );
			const { container, context } = renderWithApp( <Home /> );

			await screen.findByText( 'Finish setting up' );
			expect(
				screen.queryByRole( 'list', {
					name: 'Your setup, step by step',
				} )
			).not.toBeInTheDocument();

			const primary = container.querySelectorAll( '.is-primary' );
			expect( primary ).toHaveLength( 1 );
			expect( primary[ 0 ] ).toHaveTextContent( 'Continue setup' );

			fireEvent.click( primary[ 0 ] );
			expect( context.go ).toHaveBeenCalledWith( 'setup' );
		} );

		it( 'shows no upgrade prompt before setup is done', async () => {
			fakeSite( unfinished );
			renderWithApp( <Home /> );
			await screen.findByText( 'Finish setting up' );

			expect(
				screen.queryByText( 'Do more with Pro' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'the Pro card (wp.org guidelines 5 and 11)', () => {
		it( 'shows one card in Free after setup, with a secondary button to the Plans tab', async () => {
			fakeSite();
			const { context } = renderWithApp( <Home /> );

			await screen.findByRole( 'heading', { name: /Do more with Pro/ } );
			const button = screen.getByRole( 'button', {
				name: 'See Pro plans',
			} );
			expect( button ).not.toHaveClass( 'is-primary' );

			fireEvent.click( button );
			expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
			expect(
				screen.getByRole( 'link', { name: /Hear the Pro voices/ } )
			).toHaveAttribute( 'href', SUMMARY.links.demo );
		} );

		it( 'is text and links only: no form and nothing disabled', async () => {
			fakeSite();
			const { container } = renderWithApp( <Home /> );
			await screen.findByRole( 'heading', { name: /Do more with Pro/ } );

			expect(
				container.querySelectorAll(
					'form, input, select, textarea, [disabled], [aria-disabled="true"]'
				)
			).toHaveLength( 0 );
		} );

		it( 'hides at once on "Not now" and tells the site', async () => {
			const site = fakeSite();
			renderWithApp( <Home /> );
			await screen.findByRole( 'heading', { name: /Do more with Pro/ } );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Not now' } )
			);
			expect(
				screen.queryByText( 'Do more with Pro' )
			).not.toBeInTheDocument();

			await act( async () => {} );
			expect( site.calls[ 1 ] ).toEqual( {
				url: 'https://site.test/wp-json/tta/v1/home/dismiss',
				method: 'POST',
				body: { item: 'pro_card' },
			} );
		} );

		it( 'stays hidden and says so when that could not be saved', async () => {
			fakeSite( SUMMARY, {
				noSave: { status: 500, message: 'Database error' },
			} );
			const { context } = renderWithApp( <Home /> );
			await screen.findByRole( 'heading', { name: /Do more with Pro/ } );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Not now' } )
			);
			await act( async () => {} );

			expect(
				screen.queryByText( 'Do more with Pro' )
			).not.toBeInTheDocument();
			expect( context.notify ).toHaveBeenCalledWith(
				'The card is hidden for now, but that could not be saved: Database error',
				'error'
			);
		} );

		it( 'is not shown to a user who closed it', async () => {
			fakeSite( summary( { hidden: [ 'pro_card' ] } ) );
			renderWithApp( <Home /> );
			await screen.findByText( 'Right now, only you can hear it.' );

			expect(
				screen.queryByText( 'Do more with Pro' )
			).not.toBeInTheDocument();
		} );

		it( 'is never shown when Pro is installed', async () => {
			fakeSite( summary( { is_pro: true } ) );
			renderWithApp( <Home />, { boot: { isPro: true } } );
			await screen.findByText( 'Right now, only you can hear it.' );

			expect(
				screen.queryByText( 'Do more with Pro' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'See Pro plans' } )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'the natural-voice allowance', () => {
		it( 'shows what the site stored, with a way to the Usage tab', async () => {
			fakeSite();
			const { context } = renderWithApp( <Home /> );

			expect(
				await screen.findByText(
					`${ ( 85000 ).toLocaleString() } of ${ ( 100000 ).toLocaleString() } characters used`
				)
			).toBeInTheDocument();
			const meter = screen.getByRole( 'progressbar' );
			expect( meter ).toHaveAttribute( 'value', '85' );
			expect( meter ).toHaveClass( 'is-warn' );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'See usage' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'account:usage' );
		} );

		it.each( [
			[
				'not connected',
				{ connected: false, chars_used: null, chars_limit: null },
			],
			[
				'no limit',
				{ connected: true, chars_used: 500, chars_limit: null },
			],
		] )( 'shows no meter for a site that is %s', async ( _name, usage ) => {
			fakeSite( summary( { usage } ) );
			renderWithApp( <Home /> );
			await screen.findByText( 'Right now, only you can hear it.' );

			expect(
				screen.queryByRole( 'progressbar' )
			).not.toBeInTheDocument();
		} );
	} );

	it.each( [
		[ 'Read pages too', 'content' ],
		[ 'Fix how a word is said', 'voice:pronunciation' ],
		[ 'Follow along while listening', 'player:read' ],
	] )( 'offers "%s" as a next step', async ( name, route ) => {
		fakeSite();
		const { context } = renderWithApp( <Home /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: new RegExp( name ) } )
		);

		expect( context.go ).toHaveBeenCalledWith( route );
	} );

	it( 'lets Pro and later screens add a card through the slot', async () => {
		const fill = ( { summary: given } ) => (
			<p>Extra card, engine { given.voice.engine }</p>
		);
		const add = ( fills ) => [ ...fills, fill ];
		addFilter( 'atlasvoice.slot.home', 'test/pro', add );

		fakeSite();
		renderWithApp( <Home /> );

		expect(
			await screen.findByText( 'Extra card, engine AtlasVoice TTS' )
		).toBeInTheDocument();

		cleanup();
		removeFilter( 'atlasvoice.slot.home', 'test/pro' );
	} );

	it( 'offers to try again when Home cannot be loaded', async () => {
		const site = fakeSite( SUMMARY, {
			fail: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <Home /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect(
			await screen.findByText( 'Right now, only you can hear it.' )
		).toBeInTheDocument();
		expect( site.calls ).toHaveLength( 2 );
	} );

	it( 'has no accessibility violations in staging, live and before setup', async () => {
		fakeSite();
		const staging = renderWithApp( <Home /> );
		await screen.findByText( 'Right now, only you can hear it.' );
		expect( await axe( staging.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite( summary( { mode: 'production', live: true } ) );
		const live = renderWithApp( <Home />, { mode: 'production' } );
		await screen.findByText( 'Right now, everyone can hear it.' );
		expect( await axe( live.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite( summary( { setup_finished: false } ) );
		const fresh = renderWithApp( <Home /> );
		await screen.findByText( 'Finish setting up' );
		expect( await axe( fresh.container ) ).toHaveNoViolations();
	}, 20000 ); // Three accessibility scans in one test: slow on a busy machine.
} );
