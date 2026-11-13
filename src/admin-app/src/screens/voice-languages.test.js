import '@testing-library/jest-dom';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import { getScreenComponent } from './registry';
import VoiceLanguages, {
	languageNames,
	otherLanguages,
} from './VoiceLanguages';

expect.extend( toHaveNoViolations );

const ONE_LANGUAGE = {
	site_language: 'en-GB',
	site_language_name: 'English (United Kingdom)',
	plugins: [],
};

const POLYLANG = {
	id: 'polylang',
	name: 'Polylang',
	kind: 'pages',
	languages: [
		{ code: 'en', name: 'English' },
		{ code: 'es', name: 'Español' },
		{ code: 'fr', name: 'Français' },
	],
};

const GTRANSLATE = {
	id: 'gtranslate',
	name: 'GTranslate',
	kind: 'browser',
	languages: [
		{ code: 'en', name: 'en' },
		{ code: 'de', name: 'de' },
	],
};

const withPlugins = ( ...plugins ) => ( { ...ONE_LANGUAGE, plugins } );

/**
 * A stand-in for the site's languages route.
 *
 * @param {Object} answer What the route returns.
 * @param {Object} fail   { status, message } to refuse the first load.
 * @return {Object} { calls }.
 */
function fakeSite( answer = ONE_LANGUAGE, fail ) {
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

describe( 'the words of the Languages tab', () => {
	it( 'names languages in one line, by name or by code', () => {
		expect(
			languageNames( [
				{ code: 'en', name: 'English' },
				{ code: 'de', name: '' },
				{ code: '', name: '' },
				null,
			] )
		).toBe( 'English, de' );
		expect( languageNames( undefined ) ).toBe( '' );
	} );

	it( 'finds the languages other than the site language, each once', () => {
		expect( otherLanguages( [ POLYLANG ], 'en-GB' ) ).toEqual( [
			{ code: 'es', name: 'Español' },
			{ code: 'fr', name: 'Français' },
		] );
		expect( otherLanguages( [ POLYLANG, POLYLANG ], 'fr' ) ).toHaveLength(
			2
		);
	} );

	it( 'does not count languages that exist only in the visitor’s browser', () => {
		expect( otherLanguages( [ GTRANSLATE ], 'en-GB' ) ).toEqual( [] );
	} );

	it( 'copes with missing data', () => {
		expect( otherLanguages( undefined, 'en' ) ).toEqual( [] );
		expect( otherLanguages( [ null, { kind: 'pages' } ], '' ) ).toEqual(
			[]
		);
	} );
} );

describe( 'Voice › Languages', () => {
	it( 'is the screen of the voice:languages route', () => {
		expect( getScreenComponent( 'voice:languages' ) ).toBeTruthy();
	} );

	it( 'reads the languages from the site and changes nothing', async () => {
		const site = fakeSite();
		renderWithApp( <VoiceLanguages /> );

		await screen.findByText( /Every post is read in/ );

		expect( site.calls ).toEqual( [
			{
				url: 'https://site.test/wp-json/tta/v1/languages',
				method: 'GET',
			},
		] );
	} );

	it( 'says a site without a translation plugin has one language', async () => {
		fakeSite();
		renderWithApp( <VoiceLanguages /> );

		// Wait for the screen itself first: the words of a notice are also
		// kept in the screen-reader announcer, which outlives a test.
		expect(
			await screen.findByText(
				'Every post is read in English (United Kingdom).'
			)
		).toBeInTheDocument();
		expect(
			screen.getAllByText(
				'No translation plugin was found on this site, so it has one language.'
			).length
		).toBeGreaterThan( 0 );
	} );

	it( 'leads to the Voice tab to change the language', async () => {
		fakeSite();
		const { context } = renderWithApp( <VoiceLanguages /> );

		fireEvent.click(
			await screen.findByRole( 'button', {
				name: 'Change the language',
			} )
		);

		expect( context.go ).toHaveBeenCalledWith( 'voice' );
	} );

	it( 'names the translation plugin and its languages', async () => {
		fakeSite( withPlugins( POLYLANG ) );
		renderWithApp( <VoiceLanguages /> );

		expect(
			(
				await screen.findAllByText(
					'Translation plugins found on this site: Polylang.'
				)
			).length
		).toBeGreaterThan( 0 );
		expect(
			screen.getByRole( 'heading', { name: 'Polylang' } )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'English, Español, Français' )
		).toBeInTheDocument();
	} );

	it( 'says honestly which posts are read with the site voice', async () => {
		fakeSite( withPlugins( POLYLANG ) );
		renderWithApp( <VoiceLanguages /> );

		expect(
			await screen.findByText(
				'Posts in Español, Français are read with the English (United Kingdom) voice.'
			)
		).toBeInTheDocument();
	} );

	it( 'explains what a browser translator means for each kind of voice', async () => {
		fakeSite( withPlugins( GTRANSLATE ) );
		renderWithApp( <VoiceLanguages /> );

		expect(
			await screen.findByRole( 'heading', { name: 'GTranslate' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Follows' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site language only' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( /are read with the/ )
		).not.toBeInTheDocument();
	} );

	describe( 'the way to Pro (wp.org guideline 5)', () => {
		it( 'shows one line about Pro when translated pages exist, and it opens the Plans tab', async () => {
			fakeSite( withPlugins( POLYLANG, GTRANSLATE ) );
			const { container, context } = renderWithApp( <VoiceLanguages /> );

			await screen.findByText(
				'Read each post in its own language, with a voice per language.'
			);
			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 1 );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'See Pro' } )
			);
			expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
		} );

		it( 'shows no line about Pro on a site with one language', async () => {
			fakeSite();
			const { container } = renderWithApp( <VoiceLanguages /> );
			await screen.findByText( /Every post is read in/ );

			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 0 );
		} );

		it( 'is text and links only in Free: no form, nothing disabled', async () => {
			fakeSite( withPlugins( POLYLANG ) );
			const { container } = renderWithApp( <VoiceLanguages /> );
			await screen.findByText( /Every post is read in/ );

			expect(
				container.querySelectorAll(
					'form, input, select, textarea, [disabled], [aria-disabled="true"]'
				)
			).toHaveLength( 0 );
		} );

		it( 'shows no line about Pro when Pro is installed, and links to the classic screen', async () => {
			fakeSite( withPlugins( POLYLANG ) );
			const { container } = renderWithApp( <VoiceLanguages />, {
				boot: { isPro: true },
			} );

			const link = await screen.findByRole( 'link', {
				name: 'Set a voice per language on the classic screen',
			} );
			expect( link ).toHaveAttribute(
				'href',
				'https://site.test/wp-admin/admin.php?page=text-to-audio&atlasvoice_ui=classic#/listening'
			);
			expect(
				container.querySelectorAll( '.atlasvoice-pronote' )
			).toHaveLength( 0 );
		} );

		it( 'gives the place to Pro’s own table when Pro fills the slot', async () => {
			const fill = ( { data } ) => (
				<p>Voice table for { data.plugins.length } plugin</p>
			);
			const add = ( fills ) => [ ...fills, fill ];
			addFilter( 'atlasvoice.slot.voice.languages', 'test/pro', add );

			fakeSite( withPlugins( POLYLANG ) );
			renderWithApp( <VoiceLanguages />, { boot: { isPro: true } } );

			expect(
				await screen.findByText( 'Voice table for 1 plugin' )
			).toBeInTheDocument();
			expect(
				screen.queryByText( /Every post is read in/ )
			).not.toBeInTheDocument();

			cleanup();
			removeFilter( 'atlasvoice.slot.voice.languages', 'test/pro' );
		} );
	} );

	it( 'says so when a translation plugin has no languages yet', async () => {
		fakeSite( withPlugins( { ...POLYLANG, languages: [] } ) );
		renderWithApp( <VoiceLanguages /> );

		expect(
			await screen.findByText( 'No languages are set up in it yet.' )
		).toBeInTheDocument();
	} );

	it( 'offers to try again when the languages cannot be loaded', async () => {
		const site = fakeSite( ONE_LANGUAGE, {
			status: 500,
			message: 'Server error',
		} );
		renderWithApp( <VoiceLanguages /> );

		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Try again' } )
		);

		expect(
			await screen.findByText( /Every post is read in/ )
		).toBeInTheDocument();
		expect( site.calls ).toHaveLength( 2 );
	} );

	it( 'has no accessibility violations with and without translation plugins', async () => {
		fakeSite();
		const one = renderWithApp( <VoiceLanguages /> );
		await screen.findByText( /Every post is read in/ );
		expect( await axe( one.container ) ).toHaveNoViolations();
		cleanup();

		fakeSite( withPlugins( POLYLANG, GTRANSLATE ) );
		const many = renderWithApp( <VoiceLanguages /> );
		await screen.findByRole( 'heading', { name: 'GTranslate' } );
		expect( await axe( many.container ) ).toHaveNoViolations();
	} );
} );
