import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { getScreenComponent } from './registry';
import VoiceVoice, { looksLikeEmail } from './VoiceVoice';

expect.extend( toHaveNoViolations );

const KEY = 'av_live_secret_key_value_0123456789';

/** The connection of a site that never connected. */
const NOT_CONNECTED = {
	connected: false,
	pending_approval: false,
	key_revoked: false,
	license_not_on_site: false,
	license_seats_full: false,
	email: 'admin@site.test',
	key_prefix: '',
	plan: '',
	diagnostics: { offer: false, items: [] },
	links: {
		terms: 'https://atlasaidev.com/terms-and-conditions/',
		privacy: 'https://atlasaidev.com/privacy-policy/',
		dashboard: 'https://app.atlasvoice.cloud/',
	},
};

const CONNECTED = {
	...NOT_CONNECTED,
	connected: true,
	email: 'owner@example.org',
	key_prefix: 'av_live_secr',
	plan: 'free',
};

const VOICE = {
	player_id: 3,
	engine: 'AtlasVoice TTS',
	stores_audio: true,
	language: 'en-GB',
	voice: 'Emma',
};

/**
 * A stand-in for the site: the connection route and the Home summary.
 *
 * @param {Object}   start             The connection at the start.
 * @param {Object}   options
 * @param {Function} options.onConnect Receives the POST body; returns { body, ok, status }.
 * @param {Object}   options.failLoad  { status, message } to refuse the first load.
 * @param {boolean}  options.noSummary Refuse the Home summary.
 * @return {Object} { calls, state }.
 */
function fakeSite(
	start = NOT_CONNECTED,
	{ onConnect, failLoad, noSummary } = {}
) {
	const site = { calls: [], state: start };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );
	let failed = false;

	window.fetch = jest.fn( ( url, options = {} ) => {
		const method = options.method || 'GET';
		const body = options.body ? JSON.parse( options.body ) : undefined;
		site.calls.push( { url, method, body } );

		if ( url.includes( 'tta/v1/home' ) ) {
			return noSummary
				? reply( { message: 'nope' }, false, 500 )
				: reply( { voice: VOICE } );
		}

		if ( method === 'POST' ) {
			const answer = onConnect
				? onConnect( body )
				: { body: { ...CONNECTED, email: body.email } };
			if ( answer.ok !== false ) {
				site.state = answer.body;
			}

			return reply( answer.body, answer.ok !== false, answer.status );
		}

		if ( method === 'DELETE' ) {
			site.state = { ...NOT_CONNECTED, email: site.state.email };

			return reply( site.state );
		}

		if ( failLoad && ! failed ) {
			failed = true;

			return reply(
				{ message: failLoad.message },
				false,
				failLoad.status
			);
		}

		return reply( site.state );
	} );

	return site;
}

const posts = ( site ) => site.calls.filter( ( c ) => c.method === 'POST' );
const type = ( value ) =>
	fireEvent.change( screen.getByLabelText( 'Email for usage notices' ), {
		target: { value },
	} );
const agree = () =>
	fireEvent.click(
		screen.getByRole( 'checkbox', {
			name: 'Send post text to AtlasVoice to make the audio',
		} )
	);
const pressConnect = async () => {
	fireEvent.click( screen.getByRole( 'button', { name: 'Connect' } ) );
	await act( async () => {} );
};

afterEach( () => {
	delete window.fetch;
} );

describe( 'looksLikeEmail', () => {
	it.each( [
		[ 'owner@example.org', true ],
		[ '  owner@example.org  ', true ],
		[ 'owner@example', false ],
		[ 'owner example.org', false ],
		[ '@example.org', false ],
		[ '', false ],
	] )( 'judges %j', ( value, expected ) => {
		expect( looksLikeEmail( value ) ).toBe( expected );
	} );
} );

describe( 'Voice › Voice', () => {
	it( 'is the screen of the voice:voice route', () => {
		expect( getScreenComponent( 'voice:voice' ) ).toBeTruthy();
	} );

	it( 'asks the site for the current connection and the current voice', async () => {
		const site = fakeSite();
		renderWithApp( <VoiceVoice /> );

		await screen.findByText( 'Connect the natural voice' );

		expect( site.calls.map( ( c ) => c.method + ' ' + c.url ) ).toEqual( [
			'GET https://site.test/wp-json/tta/v1/cloud/connection?refresh=true',
			'GET https://site.test/wp-json/tta/v1/home',
		] );
	} );

	describe( 'the voice in use', () => {
		it( 'shows the engine, the language, the voice and where the audio lives', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );

			expect(
				await screen.findByText( 'AtlasVoice TTS' )
			).toBeInTheDocument();
			expect( screen.getByText( 'en-GB' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Emma' ) ).toBeInTheDocument();
			expect(
				screen.getByText( 'Saved as MP3 files on your site' )
			).toBeInTheDocument();
		} );

		it( 'links to the classic screen to change it, and says so', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );

			const link = await screen.findByRole( 'link', {
				name: 'Change the voice',
			} );
			expect( link ).toHaveAttribute(
				'href',
				'https://site.test/wp-admin/admin.php?page=text-to-audio&atlasvoice_ui=classic#/listening'
			);
			expect(
				screen.getByText( /This opens the classic screen/ )
			).toBeInTheDocument();
		} );

		it( 'still works when the voice cannot be read', async () => {
			fakeSite( NOT_CONNECTED, { noSummary: true } );
			renderWithApp( <VoiceVoice /> );

			expect(
				await screen.findByText(
					'The current voice could not be read just now.'
				)
			).toBeInTheDocument();
			expect(
				screen.getByText( 'Connect the natural voice' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'connecting (WordPress.org guideline 7)', () => {
		it( 'starts with the box unticked and the site’s email filled in', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			expect(
				screen.getByLabelText( 'Email for usage notices' )
			).toHaveValue( 'admin@site.test' );
			expect(
				screen.getByRole( 'checkbox', {
					name: 'Send post text to AtlasVoice to make the audio',
				} )
			).not.toBeChecked();
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'Tick the box to continue.'
			);
		} );

		it( 'says exactly what is sent, before anything is sent', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );

			expect(
				await screen.findByText(
					/Your site address, its name and this email are sent to AtlasVoice Cloud when you press Connect\..*Nothing is sent before you press Connect\./
				)
			).toBeInTheDocument();
		} );

		it( 'sends nothing while the box is not ticked', async () => {
			const site = fakeSite();
			renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			await pressConnect();

			expect( posts( site ) ).toHaveLength( 0 );
		} );

		it( 'sends nothing without a usable email, and says what is missing', async () => {
			const site = fakeSite();
			renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			type( 'owner' );
			agree();
			await pressConnect();

			expect( posts( site ) ).toHaveLength( 0 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'Add your email first.'
			);
		} );

		it( 'connects after the email and the tick, and sends consent', async () => {
			const site = fakeSite();
			const { context } = renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			type( ' owner@example.org ' );
			agree();
			await pressConnect();

			expect( posts( site ) ).toEqual( [
				{
					url: 'https://site.test/wp-json/tta/v1/cloud/connection',
					method: 'POST',
					body: {
						email: 'owner@example.org',
						consent: true,
						takeover: false,
						share_diagnostics: false,
					},
				},
			] );
			expect(
				await screen.findByText( 'Connected' )
			).toBeInTheDocument();
			expect( context.notify ).toHaveBeenCalledWith(
				'Connected. New audio uses the natural voice.'
			);
		} );

		it( 'offers the diagnostics choice only when the site offers it, unticked', async () => {
			const site = fakeSite( {
				...NOT_CONNECTED,
				diagnostics: {
					offer: true,
					items: [ 'Server environment', 'Active plugins' ],
				},
			} );
			renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			const share = screen.getByRole( 'checkbox', {
				name: /sharing diagnostic data \(optional\)/,
			} );
			expect( share ).not.toBeChecked();
			expect(
				screen.getByText(
					'What is shared: Server environment; Active plugins'
				)
			).toBeInTheDocument();

			agree();
			fireEvent.click( share );
			await pressConnect();

			expect( posts( site )[ 0 ].body.share_diagnostics ).toBe( true );
		} );

		it( 'shows no diagnostics choice when the site does not offer it', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			expect(
				screen.queryByRole( 'checkbox', { name: /diagnostic/ } )
			).not.toBeInTheDocument();
		} );

		it( 'links to the privacy policy and the terms', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );

			expect(
				await screen.findByRole( 'link', { name: /Privacy policy/ } )
			).toHaveAttribute( 'href', NOT_CONNECTED.links.privacy );
			expect(
				screen.getByRole( 'link', { name: /Terms/ } )
			).toHaveAttribute( 'href', NOT_CONNECTED.links.terms );
		} );

		it( 'says why when the site refuses, and keeps the form', async () => {
			fakeSite( NOT_CONNECTED, {
				onConnect: () => ( {
					body: {
						code: 'service_unreachable',
						message: 'The AtlasVoice service could not be reached.',
						data: { status: 503 },
					},
					ok: false,
					status: 503,
				} ),
			} );
			renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			agree();
			await pressConnect();

			expect(
				(
					await screen.findAllByText(
						'Could not connect: The AtlasVoice service could not be reached.'
					)
				).length
			).toBeGreaterThan( 0 );
			expect(
				screen.getByRole( 'button', { name: 'Connect' } )
			).toBeInTheDocument();
		} );

		it( 'says when the site now waits for approval', async () => {
			fakeSite( NOT_CONNECTED, {
				onConnect: ( body ) => ( {
					body: {
						...CONNECTED,
						email: body.email,
						pending_approval: true,
					},
				} ),
			} );
			const { context } = renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			agree();
			await pressConnect();

			expect(
				await screen.findByText(
					'One step left: this site waits for approval.'
				)
			).toBeInTheDocument();
			expect(
				screen.getByText( 'Waiting for approval' )
			).toBeInTheDocument();
			expect( context.notify ).toHaveBeenCalledWith(
				'Connected. This site now waits for approval.'
			);
		} );
	} );

	describe( 'a site that belongs to another email', () => {
		const owned = ( takeover = true ) => ( {
			onConnect: ( body ) =>
				body.takeover
					? { body: { ...CONNECTED, email: body.email } }
					: {
							body: {
								code: 'project_exists',
								message:
									'This site is already connected to another account.',
								data: {
									status: 409,
									owner_hint: 'ra••••@agency.com',
									takeover,
								},
							},
							ok: false,
							status: 409,
					  },
		} );

		it( 'says who owns it and asks before moving it', async () => {
			const site = fakeSite( NOT_CONNECTED, owned() );
			const { context } = renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			type( 'owner@example.org' );
			agree();
			await pressConnect();

			expect(
				(
					await screen.findAllByText(
						/It belongs to ra••••@agency\.com\./
					)
				).length
			).toBeGreaterThan( 0 );

			fireEvent.click(
				screen.getByRole( 'button', {
					name: 'Move this site to my email',
				} )
			);

			expect( posts( site ) ).toHaveLength( 1 );
			const question = context.confirm.mock.calls[ 0 ][ 0 ];
			expect( question.title ).toBe( 'Move this site to your email?' );
			expect( question.body ).toMatch( /owner@example\.org/ );

			await act( async () => {
				await question.onOk();
			} );

			expect( posts( site )[ 1 ].body ).toEqual( {
				email: 'owner@example.org',
				consent: true,
				takeover: true,
				share_diagnostics: false,
			} );
			expect(
				await screen.findByText( 'Connected' )
			).toBeInTheDocument();
		} );

		it( 'offers no move when the service says it cannot be moved', async () => {
			fakeSite( NOT_CONNECTED, owned( false ) );
			renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			agree();
			await pressConnect();

			await screen.findAllByText( /It belongs to/ );
			expect(
				screen.queryByRole( 'button', {
					name: 'Move this site to my email',
				} )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'a connected site', () => {
		it( 'shows the email and only the start of the key', async () => {
			fakeSite( { ...CONNECTED, leaked: KEY } );
			const { container } = renderWithApp( <VoiceVoice /> );

			expect(
				await screen.findByText( 'owner@example.org' )
			).toBeInTheDocument();
			expect( screen.getByText( 'av_live_secr…' ) ).toBeInTheDocument();
			expect( container ).not.toHaveTextContent( KEY );
			expect(
				screen.queryByRole( 'button', { name: 'Connect' } )
			).not.toBeInTheDocument();
		} );

		it( 'leads to the plan and usage', async () => {
			fakeSite( CONNECTED );
			const { context } = renderWithApp( <VoiceVoice /> );

			fireEvent.click(
				await screen.findByRole( 'button', {
					name: 'See plan and usage',
				} )
			);

			expect( context.go ).toHaveBeenCalledWith( 'account:usage' );
		} );

		it( 'asks before disconnecting, and disconnects only after yes', async () => {
			const site = fakeSite( CONNECTED );
			const { context } = renderWithApp( <VoiceVoice /> );

			fireEvent.click(
				await screen.findByRole( 'button', { name: 'Disconnect' } )
			);

			expect(
				site.calls.filter( ( c ) => c.method === 'DELETE' )
			).toHaveLength( 0 );
			const question = context.confirm.mock.calls[ 0 ][ 0 ];
			expect( question.title ).toBe( 'Disconnect the natural voice?' );
			expect( question.destructive ).toBe( true );

			await act( async () => {
				await question.onOk();
			} );

			expect(
				site.calls.filter( ( c ) => c.method === 'DELETE' )
			).toHaveLength( 1 );
			expect(
				await screen.findByText( 'Connect the natural voice' )
			).toBeInTheDocument();
			expect( context.notify ).toHaveBeenCalledWith(
				'Disconnected. Audio already made keeps playing.'
			);
		} );

		it( 'says when the Pro licence is not activated on this site', async () => {
			fakeSite( { ...CONNECTED, license_not_on_site: true } );
			const { context } = renderWithApp( <VoiceVoice />, {
				boot: { isPro: true },
			} );

			expect(
				(
					await screen.findAllByText(
						/is not activated on this site yet/
					)
				).length
			).toBeGreaterThan( 0 );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Open Licence' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'account:licence' );
		} );

		it( 'says when every site of the licence is in use', async () => {
			fakeSite( { ...CONNECTED, license_seats_full: true } );
			renderWithApp( <VoiceVoice /> );

			expect(
				(
					await screen.findAllByText(
						/Every site of your AtlasVoice Pro licence is in use/
					)
				).length
			).toBeGreaterThan( 0 );
		} );
	} );

	it( 'says when the key was revoked, and offers to connect again', async () => {
		fakeSite( { ...NOT_CONNECTED, key_revoked: true } );
		renderWithApp( <VoiceVoice /> );

		expect(
			await screen.findByText( 'This site was disconnected.' )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Connect' } )
		).toBeInTheDocument();
	} );

	it( 'offers to try again when the screen cannot be loaded', async () => {
		fakeSite( NOT_CONNECTED, {
			failLoad: { status: 500, message: 'Server error' },
		} );
		renderWithApp( <VoiceVoice /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect(
			await screen.findByText( 'Connect the natural voice' )
		).toBeInTheDocument();
	} );

	it( 'has no accessibility violations before and after connecting', async () => {
		fakeSite();
		const before = renderWithApp( <VoiceVoice /> );
		await screen.findByText( 'Connect the natural voice' );
		expect( await axe( before.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite( { ...CONNECTED, pending_approval: true } );
		const after = renderWithApp( <VoiceVoice /> );
		await screen.findByText( 'Waiting for approval' );
		expect( await axe( after.container ) ).toHaveNoViolations();
	}, 20000 ); // Two accessibility scans in one test: slow on a busy machine.
} );
