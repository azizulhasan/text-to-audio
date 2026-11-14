import '@testing-library/jest-dom';
import { fireEvent, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { BOOT, renderWithApp } from '../test-utils';
import HelpDocs, { findTopics, listTopics } from './HelpDocs';
import HelpMore from './HelpMore';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

const TOPICS = {
	overview: {
		title: 'Read your Home screen',
		steps: [ 'Look at the top line.', 'Click a step.', 'Read the cards.' ],
		docUrl: 'https://atlasaidev.com/docs/atlasvoice/home/',
		videoUrl: '',
		videoLength: '2:00',
		pro: false,
	},
	'voice:pronunciation': {
		title: 'Fix how a word is said',
		steps: [ 'Open Pronunciation.', 'Add the word.', 'Save.' ],
		docUrl: 'https://atlasaidev.com/docs/atlasvoice/pronunciation/',
		videoUrl: 'https://www.youtube.com/watch?v=abc',
		videoLength: '1:30',
		pro: false,
	},
	seo: {
		title: 'Describe your audio to search engines',
		steps: [ 'Open SEO.', 'Turn it on.', 'Save.' ],
		docUrl: 'javascript:alert(1)',
		videoUrl: '',
		videoLength: '2:10',
		pro: true,
	},
};

const docs = ( overrides = {} ) =>
	renderWithApp( <HelpDocs />, {
		hash: '#/help/docs',
		...overrides,
		boot: { helpTopics: TOPICS, ...( overrides.boot || {} ) },
	} );

describe( 'Help › Documentation', () => {
	beforeEach( () => {
		window.fetch = jest.fn();
	} );

	it( 'is the screen of the route help:docs', () => {
		expect( getScreenComponent( 'help:docs' ) ).toBeTruthy();
	} );

	it( 'lists the guides and opens the first one', () => {
		docs();

		const list = screen.getByRole( 'navigation', { name: 'Guides' } );
		expect( within( list ).getAllByRole( 'button' ) ).toHaveLength( 2 );
		expect(
			screen.getByRole( 'heading', { name: 'Read your Home screen' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Do it in 3 steps' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Click a step.' ) ).toBeInTheDocument();
	} );

	it( 'shows the guide that is picked, with its guide and video links', () => {
		docs();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Fix how a word is said' } )
		);

		expect(
			screen.getByRole( 'button', { name: 'Fix how a word is said' } )
		).toHaveAttribute( 'aria-current', 'true' );
		expect( screen.getByText( 'Add the word.' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'Read the guide' } )
		).toHaveAttribute( 'href', TOPICS[ 'voice:pronunciation' ].docUrl );
		const video = screen.getByRole( 'link', {
			name: 'Watch the video (1:30)',
		} );
		expect( video ).toHaveAttribute( 'target', '_blank' );
		expect( video ).toHaveAttribute( 'rel', 'noreferrer' );
	} );

	it( 'shows no video link for a guide without a video', () => {
		docs();

		expect(
			screen.queryByRole( 'link', { name: /Watch the video/ } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps Pro’s guides off a free site and shows them with Pro', () => {
		const free = docs();
		expect(
			screen.queryByRole( 'button', {
				name: 'Describe your audio to search engines',
			} )
		).not.toBeInTheDocument();
		free.unmount();

		docs( { boot: { isPro: true } } );
		expect(
			screen.getByRole( 'button', {
				name: 'Describe your audio to search engines',
			} )
		).toBeInTheDocument();
	} );

	it( 'opens only web addresses: a broken guide link falls back to the docs home', () => {
		docs( { boot: { isPro: true } } );

		fireEvent.click(
			screen.getByRole( 'button', {
				name: 'Describe your audio to search engines',
			} )
		);

		expect(
			screen.getByRole( 'link', { name: 'Read the guide' } )
		).toHaveAttribute( 'href', BOOT.docsUrl );
	} );

	it( 'finds a guide by a word of its title or its steps', () => {
		docs();
		const box = screen.getByRole( 'searchbox', {
			name: 'Search the help',
		} );

		fireEvent.change( box, { target: { value: 'add the WORD' } } );
		// The buttons of the list only: the search box has its own clear button.
		expect(
			within( screen.getAllByRole( 'list' )[ 0 ] ).getAllByRole(
				'button'
			)
		).toHaveLength( 1 );
		expect(
			screen.getByRole( 'heading', { name: 'Fix how a word is said' } )
		).toBeInTheDocument();

		fireEvent.change( box, { target: { value: 'zzz' } } );
		expect(
			screen.getByText( 'No guide matches this.' )
		).toBeInTheDocument();
	} );

	it( 'offers the contact form in a new tab', () => {
		docs();

		const link = screen.getByRole( 'link', { name: 'Contact support' } );
		expect( link ).toHaveAttribute( 'href', BOOT.supportUrl );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'points to the documentation when the site has no guides', () => {
		docs( { boot: { helpTopics: {} } } );

		expect( screen.getByText( 'No guides here yet' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'Open the documentation' } )
		).toHaveAttribute( 'href', BOOT.docsUrl );
	} );

	it( 'asks the site nothing', () => {
		docs();

		expect( window.fetch ).not.toHaveBeenCalled();
	} );

	it( 'lists and finds topics', () => {
		expect( listTopics( TOPICS, false ).map( ( t ) => t.key ) ).toEqual( [
			'overview',
			'voice:pronunciation',
		] );
		expect( listTopics( TOPICS, true ) ).toHaveLength( 3 );
		expect( listTopics( null, true ) ).toEqual( [] );
		expect( listTopics( { a: { steps: [] } }, true ) ).toEqual( [] );

		const list = listTopics( TOPICS, true );
		expect( findTopics( list, '  ' ) ).toHaveLength( 3 );
		expect( findTopics( list, 'home' ).map( ( t ) => t.key ) ).toEqual( [
			'overview',
		] );
	} );

	it( 'has no accessibility violations', async () => {
		const { container } = docs();

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );

/** What a site answers on tta/v1/more-plugins (TTA\Help\More_Plugins). */
const LIST = {
	can_install: true,
	list_url:
		'https://site.test/wp-admin/admin.php?page=atlasvoice-other-plugins',
	plugins: [
		{
			slug: 'ar-vr-3d-model-try-on',
			name: 'AtlasAR',
			description: '3D models and AR try-on.',
			installed: true,
			active: true,
			url: 'https://wordpress.org/plugins/ar-vr-3d-model-try-on/',
			install_url: 'https://site.test/wp-admin/plugin-install.php?s=ar',
		},
		{
			slug: 'smart-local-ai',
			name: 'Smart Local AI',
			description: 'Private AI tools.',
			installed: true,
			active: false,
			url: 'https://wordpress.org/plugins/smart-local-ai/',
			install_url: 'https://site.test/wp-admin/plugin-install.php?s=slai',
		},
		{
			slug: 'atlasmcp',
			name: 'AtlasMCP',
			description: 'Connect AI assistants.',
			installed: false,
			active: false,
			url: 'https://wordpress.org/plugins/atlasmcp/',
			install_url: 'https://site.test/wp-admin/plugin-install.php?s=mcp',
		},
	],
};

/**
 * A stand-in for the site's route.
 *
 * @param {Object} answer What it returns.
 * @param {Object} fail   { status, message } to refuse the first load.
 * @return {Object} { methods }.
 */
function fakeSite( answer = LIST, fail ) {
	const site = { methods: [] };
	let failed = false;

	window.fetch = jest.fn( ( _url, options = {} ) => {
		site.methods.push( options.method || 'GET' );
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

const row = async ( name ) =>
	( await screen.findByText( name ) ).closest( 'li' );

describe( 'Help › More plugins', () => {
	it( 'is the screen of the route help:more', () => {
		expect( getScreenComponent( 'help:more' ) ).toBeTruthy();
	} );

	it( 'shows each plugin with its state on this site', async () => {
		fakeSite();
		renderWithApp( <HelpMore />, { hash: '#/help/more' } );

		expect(
			within( await row( 'AtlasAR' ) ).getByText( 'Active' )
		).toBeInTheDocument();
		expect(
			within( await row( 'Smart Local AI' ) ).getByText( 'Installed' )
		).toBeInTheDocument();

		const install = within( await row( 'AtlasMCP' ) ).getByRole( 'link', {
			name: 'Install AtlasMCP',
		} );
		expect( install ).toHaveAttribute(
			'href',
			LIST.plugins[ 2 ].install_url
		);
		// A plugin that is here already has no Install link.
		expect(
			screen.queryByRole( 'link', { name: 'Install AtlasAR' } )
		).not.toBeInTheDocument();
	} );

	it( 'links every plugin to its WordPress.org page', async () => {
		fakeSite();
		renderWithApp( <HelpMore />, { hash: '#/help/more' } );

		expect(
			await screen.findByRole( 'link', {
				name: /AtlasMCP on WordPress\.org/,
			} )
		).toHaveAttribute( 'href', LIST.plugins[ 2 ].url );
	} );

	it( 'shows no Install link to someone who may not install', async () => {
		fakeSite( {
			...LIST,
			can_install: false,
			plugins: LIST.plugins.map( ( plugin ) => ( {
				...plugin,
				install_url: '',
			} ) ),
		} );
		renderWithApp( <HelpMore />, { hash: '#/help/more' } );

		await row( 'AtlasMCP' );
		expect(
			screen.queryByRole( 'link', { name: /^Install/ } )
		).not.toBeInTheDocument();
		expect(
			screen.getByText( /may not install plugins on this site/ )
		).toBeInTheDocument();
	} );

	it( 'opens the full page of the classic list', async () => {
		fakeSite();
		renderWithApp( <HelpMore />, { hash: '#/help/more' } );

		expect(
			await screen.findByRole( 'link', { name: 'See the full page' } )
		).toHaveAttribute( 'href', LIST.list_url );
	} );

	it( 'says so when the list is empty', async () => {
		fakeSite( { ...LIST, plugins: [] } );
		renderWithApp( <HelpMore />, { hash: '#/help/more' } );

		expect(
			await screen.findByText( 'Nothing to show' )
		).toBeInTheDocument();
	} );

	it( 'shows the site’s message when loading fails, and tries again', async () => {
		fakeSite( LIST, { status: 500, message: 'The database is away.' } );
		const { container } = renderWithApp( <HelpMore />, {
			hash: '#/help/more',
		} );

		expect(
			await within( container ).findByText(
				'The list could not be loaded: The database is away.'
			)
		).toBeInTheDocument();
		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect( await row( 'AtlasAR' ) ).toBeInTheDocument();
	} );

	it( 'only reads', async () => {
		const site = fakeSite();
		renderWithApp( <HelpMore />, { hash: '#/help/more' } );
		await row( 'AtlasAR' );

		expect( site.methods ).toEqual( [ 'GET' ] );
	} );

	it( 'has no accessibility violations', async () => {
		fakeSite();
		const { container } = renderWithApp( <HelpMore />, {
			hash: '#/help/more',
		} );
		await row( 'AtlasAR' );

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
