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

const CHOICE = {
	player_id: 1,
	language: '',
	voice: '',
	rate: 1,
	volume: 1,
	pitch: 1,
	connected: false,
	natural_player_id: 3,
	site_language: 'en-US',
	players: [
		{ id: 1, name: 'Default', pro: false, stores_audio: false },
		{ id: 3, name: 'AtlasVoice TTS', pro: false, stores_audio: true },
	],
};

/**
 * A stand-in for the site: the connection route and the voice route.
 *
 * @param {Object}   start             The connection at the start.
 * @param {Object}   options
 * @param {Function} options.onConnect Receives the POST body; returns { body, ok, status }.
 * @param {Object}   options.failLoad  { status, message } to refuse the first load.
 * @param {Object}   options.choice    The voice choice at the start.
 * @param {boolean}  options.noChoice  Refuse the voice route.
 * @return {Object} { calls, state }.
 */
function fakeSite(
	start = NOT_CONNECTED,
	{ onConnect, failLoad, choice = CHOICE, noChoice } = {}
) {
	const site = { calls: [], state: start, choice };
	const reply = ( body, ok = true, status = 200 ) =>
		Promise.resolve( { ok, status, json: async () => body } );
	let failed = false;

	window.fetch = jest.fn( ( url, options = {} ) => {
		const method = options.method || 'GET';
		const body = options.body ? JSON.parse( options.body ) : undefined;
		site.calls.push( { url, method, body } );

		if ( url.includes( 'tta/v1/voice' ) ) {
			if ( noChoice ) {
				return reply( { message: 'nope' }, false, 500 );
			}
			if ( method === 'POST' ) {
				site.choice = { ...site.choice, ...body };
			}

			return reply( site.choice );
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

const posts = ( site ) =>
	site.calls.filter(
		( c ) => c.method === 'POST' && c.url.includes( 'cloud/connection' )
	);
const voicePosts = ( site ) =>
	site.calls.filter(
		( c ) => c.method === 'POST' && c.url.includes( 'tta/v1/voice' )
	);
const save = async () => {
	fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await act( async () => {} );
};
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
	delete window.speechSynthesis;
	delete window.SpeechSynthesisUtterance;
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

		expect(
			site.calls.map( ( c ) => c.method + ' ' + c.url ).sort()
		).toEqual( [
			'GET https://site.test/wp-json/tta/v1/cloud/connection?refresh=true',
			'GET https://site.test/wp-json/tta/v1/voice',
		] );
	} );

	describe( 'what makes the sound', () => {
		const browserVoices = [
			{ name: 'Samantha', lang: 'en-US' },
			{ name: 'Daniel', lang: 'en-GB' },
			{ name: 'Thomas', lang: 'fr-FR' },
			{ name: 'Amelie', lang: 'fr-FR' },
		];
		const giveBrowserVoices = () => {
			window.speechSynthesis = {
				getVoices: () => browserVoices,
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				cancel: jest.fn(),
				speak: jest.fn(),
			};
			window.SpeechSynthesisUtterance = function ( text ) {
				this.text = text;
			};
		};

		it( 'offers the browser voice and the natural voice, and marks the one in use', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );

			expect(
				await screen.findByRole( 'radio', { name: /Browser voice/ } )
			).toBeChecked();
			expect(
				screen.getByRole( 'radio', { name: /Natural voice/ } )
			).not.toBeChecked();
			expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 2 );
		} );

		it( 'does not let the natural voice be chosen before the site is connected', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );

			const natural = await screen.findByRole( 'radio', {
				name: /Natural voice/,
			} );
			expect( natural ).toBeDisabled();
			expect( natural ).toHaveAccessibleDescription(
				/Connect it below to choose it\./
			);
		} );

		it( 'follows the connection made on this screen, not the first answer', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );
			await screen.findByText( 'Connect the natural voice' );

			agree();
			await pressConnect();

			expect(
				await screen.findByRole( 'radio', { name: /Natural voice/ } )
			).toBeEnabled();
		} );

		it( 'writes nothing until Save is pressed', async () => {
			giveBrowserVoices();
			const site = fakeSite();
			renderWithApp( <VoiceVoice /> );

			fireEvent.change( await screen.findByLabelText( 'Language' ), {
				target: { value: 'fr-FR' },
			} );

			expect( voicePosts( site ) ).toHaveLength( 0 );
			expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();
		} );

		it( 'chooses a voice of the new language with the language, and saves both', async () => {
			giveBrowserVoices();
			const site = fakeSite( NOT_CONNECTED, {
				choice: { ...CHOICE, language: 'en-US', voice: 'Samantha' },
			} );
			renderWithApp( <VoiceVoice /> );

			fireEvent.change( await screen.findByLabelText( 'Language' ), {
				target: { value: 'fr-FR' },
			} );
			expect( screen.getByLabelText( 'Voice' ) ).toHaveValue( 'Thomas' );

			fireEvent.change( screen.getByLabelText( 'Voice' ), {
				target: { value: 'Amelie' },
			} );
			await save();

			expect( voicePosts( site ) ).toHaveLength( 1 );
			expect( voicePosts( site )[ 0 ].body ).toEqual( {
				language: 'fr-FR',
				voice: 'Amelie',
			} );
			expect(
				await screen.findByText( 'All changes saved' )
			).toBeInTheDocument();
		} );

		it( 'keeps a saved voice on the list when this browser does not have it', async () => {
			giveBrowserVoices();
			fakeSite( NOT_CONNECTED, {
				choice: {
					...CHOICE,
					language: 'bn-BD',
					voice: 'A phone-only voice',
				},
			} );
			renderWithApp( <VoiceVoice /> );

			expect( await screen.findByLabelText( 'Language' ) ).toHaveValue(
				'bn-BD'
			);
			expect( screen.getByLabelText( 'Voice' ) ).toHaveValue(
				'A phone-only voice'
			);
			expect(
				screen.getByText( 'All changes saved' )
			).toBeInTheDocument();
		} );

		it( 'saves the speed, the volume and the pitch of the browser voice', async () => {
			giveBrowserVoices();
			const site = fakeSite( NOT_CONNECTED, {
				choice: { ...CHOICE, language: 'en-US', voice: 'Samantha' },
			} );
			renderWithApp( <VoiceVoice /> );

			fireEvent.change( await screen.findByLabelText( 'Pitch' ), {
				target: { value: '2' },
			} );
			fireEvent.change(
				screen.getByRole( 'spinbutton', { name: 'Speed' } ),
				{ target: { value: '1.5' } }
			);
			await save();

			expect( voicePosts( site )[ 0 ].body ).toEqual( {
				pitch: 2,
				rate: 1.5,
			} );
		} );

		it( 'plays a sample with the voice on screen', async () => {
			giveBrowserVoices();
			fakeSite( NOT_CONNECTED, {
				choice: { ...CHOICE, language: 'en-GB', voice: 'Daniel' },
			} );
			renderWithApp( <VoiceVoice /> );

			fireEvent.click(
				await screen.findByRole( 'button', { name: 'Play a sample' } )
			);

			expect( window.speechSynthesis.cancel ).toHaveBeenCalled();
			const spoken = window.speechSynthesis.speak.mock.calls[ 0 ][ 0 ];
			expect( spoken.voice ).toEqual( { name: 'Daniel', lang: 'en-GB' } );
			expect( spoken.lang ).toBe( 'en-GB' );
			expect( spoken.rate ).toBe( 1 );
		} );

		it( 'says so when the browser offers no voices', async () => {
			fakeSite();
			renderWithApp( <VoiceVoice /> );

			expect(
				await screen.findByText( /This browser offers no voices/ )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Play a sample' } )
			).not.toBeInTheDocument();
		} );

		it( 'gives the natural voice a language it can speak when it is chosen', async () => {
			giveBrowserVoices();
			const site = fakeSite( CONNECTED, {
				choice: {
					...CHOICE,
					connected: true,
					language: 'en-US',
					voice: 'Samantha',
				},
			} );
			renderWithApp( <VoiceVoice /> );

			fireEvent.click(
				await screen.findByRole( 'radio', { name: /Natural voice/ } )
			);
			expect( screen.getByLabelText( 'Language' ) ).toHaveValue(
				'en-us'
			);
			expect(
				screen.queryByLabelText( 'Voice' )
			).not.toBeInTheDocument();

			await save();

			expect( voicePosts( site )[ 0 ].body ).toEqual( {
				player_id: 3,
				language: 'en-us',
			} );
		} );

		it( 'lists the languages of the natural voice by name', async () => {
			fakeSite( CONNECTED, {
				choice: { ...CHOICE, player_id: 3, language: 'fr' },
			} );
			renderWithApp( <VoiceVoice /> );

			const language = await screen.findByLabelText( 'Language' );
			expect( language ).toHaveValue( 'fr' );
			expect(
				screen.getByRole( 'option', { name: 'French' } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'option', { name: 'English' } )
			).toBeInTheDocument();
		} );

		it( 'gives the browser voice a voice it has when it is chosen again', async () => {
			giveBrowserVoices();
			const site = fakeSite( CONNECTED, {
				choice: { ...CHOICE, player_id: 3, language: 'fr' },
			} );
			renderWithApp( <VoiceVoice /> );

			fireEvent.click(
				await screen.findByRole( 'radio', { name: /Browser voice/ } )
			);
			expect( screen.getByLabelText( 'Language' ) ).toHaveValue(
				'fr-FR'
			);
			expect( screen.getByLabelText( 'Voice' ) ).toHaveValue( 'Thomas' );

			await save();

			expect( voicePosts( site )[ 0 ].body ).toEqual( {
				player_id: 1,
				language: 'fr-FR',
				voice: 'Thomas',
			} );
		} );

		it( 'names a Pro engine that is in use and links to the classic screen for its voices', async () => {
			fakeSite( CONNECTED, {
				choice: {
					...CHOICE,
					player_id: 6,
					language: 'en',
					voice: 'uLJQ::jephthah',
					players: [
						...CHOICE.players,
						{
							id: 6,
							name: 'ElevenLabs TTS',
							pro: true,
							stores_audio: true,
						},
						{
							id: 7,
							name: 'AtlasVoice Cloud',
							pro: true,
							stores_audio: true,
						},
					],
				},
			} );
			renderWithApp( <VoiceVoice />, { boot: { isPro: true } } );

			expect(
				await screen.findByRole( 'radio', { name: /ElevenLabs TTS/ } )
			).toBeChecked();
			// Only the Pro engine in use is listed, not every Pro engine.
			expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 3 );

			// Trying another engine does not take the Pro engine off the
			// list: the owner can go back to it without leaving the screen.
			fireEvent.click(
				screen.getByRole( 'radio', { name: /Browser voice/ } )
			);
			fireEvent.click(
				screen.getByRole( 'radio', { name: /ElevenLabs TTS/ } )
			);
			expect(
				screen.getByRole( 'radio', { name: /ElevenLabs TTS/ } )
			).toBeChecked();
			expect( screen.getByText( 'jephthah' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'link', {
					name: 'Change the voice on the classic screen',
				} )
			).toHaveAttribute(
				'href',
				'https://site.test/wp-admin/admin.php?page=text-to-audio&atlasvoice_ui=classic#/listening'
			);
		} );

		it( 'shows why a save was refused and keeps the change on screen', async () => {
			giveBrowserVoices();
			const site = fakeSite( NOT_CONNECTED, {
				choice: { ...CHOICE, language: 'en-US', voice: 'Samantha' },
			} );
			const { context } = renderWithApp( <VoiceVoice /> );
			fireEvent.change( await screen.findByLabelText( 'Pitch' ), {
				target: { value: '0' },
			} );

			const real = window.fetch;
			window.fetch = jest.fn( ( url, options = {} ) =>
				options.method === 'POST'
					? Promise.resolve( {
							ok: false,
							status: 400,
							json: async () => ( {
								message: 'The pitch must be 0, 1 or 2.',
							} ),
					  } )
					: real( url, options )
			);
			await save();

			expect( context.notify ).toHaveBeenCalledWith(
				'Not saved: The pitch must be 0, 1 or 2.',
				'error'
			);
			expect( screen.getByLabelText( 'Pitch' ) ).toHaveValue( '0' );
			expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();
			expect( voicePosts( site ) ).toHaveLength( 0 );
		} );

		it( 'still shows the connection when the voice cannot be loaded', async () => {
			fakeSite( NOT_CONNECTED, { noChoice: true } );
			renderWithApp( <VoiceVoice /> );

			expect(
				(
					await screen.findAllByText(
						'The voice could not be loaded: nope'
					)
				).length
			).toBeGreaterThan( 0 );
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
			expect(
				screen.getByText( 'Tick the box to continue.' )
			).toHaveAttribute( 'role', 'status' );
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
			expect(
				screen.getByText( 'Add your email first.' )
			).toHaveAttribute( 'role', 'status' );
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
				await screen.findByRole( 'heading', {
					name: 'Natural voice connection',
				} )
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
				await screen.findByRole( 'heading', {
					name: 'Natural voice connection',
				} )
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

describe( 'Voice: the natural voice tile while the site waits for approval', () => {
	it( 'does not say Connected before the site is approved', async () => {
		fakeSite( { ...CONNECTED, pending_approval: true } );
		renderWithApp( <VoiceVoice /> );
		await screen.findByText( 'Waiting for approval' );

		const tile = screen
			.getByRole( 'radio', { name: /Natural voice/ } )
			.closest( '.atlasvoice-tile' );
		expect( tile ).toHaveTextContent( 'Not approved yet' );
		expect( tile ).not.toHaveTextContent( 'Connected' );
	} );

	it( 'says Connected once the site is approved', async () => {
		fakeSite( CONNECTED );
		renderWithApp( <VoiceVoice /> );
		await screen.findByText( 'Natural voice connection' );

		const tile = screen
			.getByRole( 'radio', { name: /Natural voice/ } )
			.closest( '.atlasvoice-tile' );
		expect( tile ).toHaveTextContent( 'Connected' );
		expect( tile ).not.toHaveTextContent( 'Not approved yet' );
	} );
} );
