import '@testing-library/jest-dom';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { getScreenComponent } from './registry';
import VoiceProviders, { providerPurpose } from './VoiceProviders';

expect.extend( toHaveNoViolations );

const provider = ( id, name, kind, more = {} ) => ( {
	id,
	name,
	kind,
	available: false,
	connected: false,
	detail: '',
	...more,
} );

/** The answer of a site with the free plugin only. */
const FREE = {
	available: false,
	providers: [
		provider( 'google', 'Google Cloud Text-to-Speech', 'voice' ),
		provider( 'openai', 'OpenAI', 'voice' ),
		provider( 'elevenlabs', 'ElevenLabs', 'voice' ),
		provider( 'gcs', 'Google Cloud Storage', 'storage' ),
	],
};

/** The answer of a site with Pro: Google connected, the others not. */
const PRO = {
	available: true,
	providers: [
		provider( 'google', 'Google Cloud Text-to-Speech', 'voice', {
			available: true,
			connected: true,
			detail: 'my-project-392416',
		} ),
		provider( 'openai', 'OpenAI', 'voice', { available: true } ),
		provider( 'elevenlabs', 'ElevenLabs', 'voice', { available: true } ),
		provider( 'gcs', 'Google Cloud Storage', 'storage', {
			available: true,
		} ),
	],
};

/**
 * A stand-in for the site's providers route.
 *
 * @param {Object} answer What the route returns.
 * @param {Object} fail   { status, message } to refuse the first load.
 * @return {Object} { calls }.
 */
function fakeSite( answer = FREE, fail ) {
	const site = { calls: [] };
	let failed = false;

	window.fetch = jest.fn( ( url, options = {} ) => {
		site.calls.push( { url, method: options.method || 'GET' } );
		if ( fail && ! failed ) {
			failed = true;

			return Promise.resolve( {
				ok: false,
				status: fail.status,
				json: async () => ( { message: fail.message } ),
			} );
		}

		return Promise.resolve( {
			ok: true,
			status: 200,
			json: async () => answer,
		} );
	} );

	return site;
}

afterEach( () => {
	delete window.fetch;
} );

describe( 'what a provider is for', () => {
	it.each( [ 'google', 'openai', 'elevenlabs', 'gcs' ] )(
		'has a line for %s',
		( id ) => {
			expect( providerPurpose( id ) ).not.toBe( '' );
		}
	);

	it( 'has no line for a provider it does not know', () => {
		expect( providerPurpose( 'azure' ) ).toBe( '' );
		expect( providerPurpose( undefined ) ).toBe( '' );
	} );
} );

describe( 'Voice › Your own provider', () => {
	it( 'is the screen of the voice:providers route', () => {
		expect( getScreenComponent( 'voice:providers' ) ).toBeTruthy();
	} );

	it( 'reads the providers from the site and changes nothing', async () => {
		const site = fakeSite();
		renderWithApp( <VoiceProviders /> );

		await screen.findByText( 'OpenAI' );

		expect( site.calls ).toEqual( [
			{
				url: 'https://site.test/wp-json/tta/v1/providers',
				method: 'GET',
			},
		] );
	} );

	it( 'says who bills for these voices', async () => {
		fakeSite();
		renderWithApp( <VoiceProviders /> );

		expect(
			await screen.findByText(
				/the provider bills you for what you use\. AtlasVoice charges nothing extra/
			)
		).toBeInTheDocument();
	} );

	it( 'lists the voice providers and the storage apart', async () => {
		fakeSite( PRO );
		renderWithApp( <VoiceProviders /> );

		const voices = (
			await screen.findByRole( 'heading', {
				name: 'Voices from your own account',
			} )
		).closest( 'section' );
		expect( within( voices ).getAllByRole( 'listitem' ) ).toHaveLength( 3 );

		const storage = screen
			.getByRole( 'heading', { name: 'Where the audio is kept' } )
			.closest( 'section' );
		expect( within( storage ).getAllByRole( 'listitem' ) ).toHaveLength(
			1
		);
		expect(
			within( storage ).getByText( 'Google Cloud Storage' )
		).toBeInTheDocument();
	} );

	describe( 'with Pro', () => {
		it( 'shows which providers are connected and names the account', async () => {
			fakeSite( PRO );
			renderWithApp( <VoiceProviders />, { boot: { isPro: true } } );

			await screen.findByText( 'OpenAI' );

			expect( screen.getAllByText( 'Connected' ) ).toHaveLength( 1 );
			expect( screen.getAllByText( 'Not connected' ) ).toHaveLength( 3 );
			expect(
				screen.getByText( /Account: my-project-392416\./ )
			).toBeInTheDocument();
		} );

		it( 'opens the classic screen to connect or change a provider', async () => {
			fakeSite( PRO );
			renderWithApp( <VoiceProviders />, { boot: { isPro: true } } );

			expect(
				await screen.findByRole( 'link', {
					name: 'Connect or change a provider on the classic screen',
				} )
			).toHaveAttribute(
				'href',
				'https://site.test/wp-admin/admin.php?page=text-to-audio&atlasvoice_ui=classic#/integrations'
			);
		} );

		it( 'shows no line about Pro', async () => {
			fakeSite( PRO );
			const { container } = renderWithApp( <VoiceProviders />, {
				boot: { isPro: true },
			} );
			await screen.findByText( 'OpenAI' );

			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 0 );
		} );

		it( 'has no field a key could be typed into or read from', async () => {
			fakeSite( PRO );
			const { container } = renderWithApp( <VoiceProviders />, {
				boot: { isPro: true },
			} );
			await screen.findByText( 'OpenAI' );

			expect(
				container.querySelectorAll( 'input, textarea, select' )
			).toHaveLength( 0 );
		} );

		it( 'gives a place to Pro’s own key forms', async () => {
			const fill = ( { data } ) => (
				<p>Key forms for { data.providers.length } providers</p>
			);
			const add = ( fills ) => [ ...fills, fill ];
			addFilter( 'atlasvoice.slot.voice.providers', 'test/pro', add );

			fakeSite( PRO );
			renderWithApp( <VoiceProviders />, { boot: { isPro: true } } );

			expect(
				await screen.findByText( 'Key forms for 4 providers' )
			).toBeInTheDocument();

			cleanup();
			removeFilter( 'atlasvoice.slot.voice.providers', 'test/pro' );
		} );
	} );

	describe( 'in the free plugin (wp.org guideline 5)', () => {
		it( 'shows no connection state for providers that are not on the site', async () => {
			fakeSite();
			renderWithApp( <VoiceProviders /> );
			await screen.findByText( 'OpenAI' );

			expect( screen.queryByText( 'Connected' ) ).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'Not connected' )
			).not.toBeInTheDocument();
		} );

		it( 'shows one line about Pro, and it opens the Plans tab', async () => {
			fakeSite();
			const { container, context } = renderWithApp( <VoiceProviders /> );
			await screen.findByText( 'OpenAI' );

			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 1 );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'See Pro' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
		} );

		it( 'is text and links only: no form, no disabled control, no link to a classic form', async () => {
			fakeSite();
			const { container } = renderWithApp( <VoiceProviders /> );
			await screen.findByText( 'OpenAI' );

			expect(
				container.querySelectorAll(
					'form, input, select, textarea, [disabled], [aria-disabled="true"], a'
				)
			).toHaveLength( 0 );
		} );
	} );

	it( 'offers to try again when the providers cannot be loaded', async () => {
		const site = fakeSite( FREE, { status: 500, message: 'Server error' } );
		renderWithApp( <VoiceProviders /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect( await screen.findByText( 'OpenAI' ) ).toBeInTheDocument();
		expect( site.calls ).toHaveLength( 2 );
	} );

	it( 'survives an answer without providers', async () => {
		fakeSite( { available: false, providers: 'none' } );
		renderWithApp( <VoiceProviders /> );

		expect(
			await screen.findByRole( 'heading', {
				name: 'Voices from your own account',
			} )
		).toBeInTheDocument();
	} );

	it( 'has no accessibility violations with and without Pro', async () => {
		fakeSite();
		const free = renderWithApp( <VoiceProviders /> );
		await screen.findByText( 'OpenAI' );
		expect( await axe( free.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite( PRO );
		const pro = renderWithApp( <VoiceProviders />, {
			boot: { isPro: true },
		} );
		await screen.findByText( 'OpenAI' );
		expect( await axe( pro.container ) ).toHaveNoViolations();
	} );
} );
