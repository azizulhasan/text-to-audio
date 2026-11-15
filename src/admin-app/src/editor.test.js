import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';

import { BlockPanel, mount } from './editor';

const BOOT = {
	restUrl: 'https://site.test/wp-json/',
	restNonce: 'nonce',
	postId: 161,
	appUrl: '',
};

const PANEL = {
	post: { id: 161, published: true },
	player: { shown: true },
	audio: {
		kind: 'browser',
		status: '',
		when: 'play',
		can_make: false,
		reason: 'voice',
		job: null,
	},
	listening: { counted: false, days: 30, plays: 0, listeners: 0 },
	shortcode: '[atlasvoice]',
};

beforeEach( () => {
	window.fetch = jest.fn( () =>
		Promise.resolve( { ok: true, status: 200, json: async () => PANEL } )
	);
} );

afterEach( () => {
	cleanup();
	document.body.innerHTML = '';
	delete window.fetch;
} );

describe( 'where the AtlasVoice panel is put', () => {
	test( 'nowhere without a post', () => {
		expect( mount( undefined, {} ) ).toBe( '' );
		expect( mount( { postId: 0 }, {} ) ).toBe( '' );
		expect( window.fetch ).not.toHaveBeenCalled();
	} );

	test( 'in the Classic Editor it is drawn in its box', async () => {
		document.body.innerHTML = '<div id="atlasvoice-post-panel-root"></div>';
		const registerPlugin = jest.fn();

		let where;
		await act( async () => {
			where = mount( BOOT, { plugins: { registerPlugin } } );
		} );

		expect( where ).toBe( 'box' );
		expect( registerPlugin ).not.toHaveBeenCalled();
		expect(
			await screen.findByRole( 'button', { name: 'Audio' } )
		).toBeInTheDocument();
	} );

	test.each( [
		[ 'wp.editor (WordPress 6.6 and later)', 'editor' ],
		[ 'wp.editPost (before 6.6)', 'editPost' ],
	] )(
		'in the block editor it is a sidebar from %s',
		async ( name, part ) => {
			const registerPlugin = jest.fn();
			const PluginSidebar = ( { title, children } ) => (
				<aside aria-label={ title }>{ children }</aside>
			);
			const PluginSidebarMoreMenuItem = ( { children } ) => (
				<span>{ children }</span>
			);

			const where = mount( BOOT, {
				plugins: { registerPlugin },
				[ part ]: { PluginSidebar, PluginSidebarMoreMenuItem },
			} );

			expect( where ).toBe( 'sidebar' );
			expect( registerPlugin ).toHaveBeenCalledTimes( 1 );
			expect( registerPlugin.mock.calls[ 0 ][ 0 ] ).toBe( 'atlasvoice' );

			const Plugin = registerPlugin.mock.calls[ 0 ][ 1 ].render;
			render( <Plugin /> );
			expect( screen.getByLabelText( 'AtlasVoice' ) ).toBeInTheDocument();
			expect(
				await screen.findByRole( 'button', { name: 'Audio' } )
			).toBeInTheDocument();
		}
	);

	test( 'an editor without a place for sidebars gets nothing, and nothing breaks', () => {
		expect( mount( BOOT, {} ) ).toBe( '' );
		expect( mount( BOOT, undefined ) ).toBe( '' );
		expect( mount( BOOT, { editor: {}, plugins: {} } ) ).toBe( '' );
	} );
} );

describe( 'the panel in the block editor', () => {
	test( 'it reads the post again when a save has ended, not after an autosave', async () => {
		let listener = () => {};
		const state = { saving: false, autosaving: false };
		const data = {
			subscribe: ( callback ) => {
				listener = callback;

				return () => {};
			},
			select: () => ( {
				isSavingPost: () => state.saving,
				isAutosavingPost: () => state.autosaving,
			} ),
		};
		render( <BlockPanel boot={ BOOT } data={ data } /> );
		await screen.findByRole( 'button', { name: 'Audio' } );
		expect( window.fetch ).toHaveBeenCalledTimes( 1 );

		const change = async ( saving, autosaving = false ) => {
			state.saving = saving;
			state.autosaving = autosaving;
			await act( async () => listener() );
		};

		await change( true, true );
		await change( false );
		expect( window.fetch ).toHaveBeenCalledTimes( 1 );

		await change( true );
		await change( false );
		expect( window.fetch ).toHaveBeenCalledTimes( 2 );
	} );

	test( 'it works without the page’s data', async () => {
		render( <BlockPanel boot={ BOOT } data={ undefined } /> );

		expect(
			await screen.findByRole( 'button', { name: 'Audio' } )
		).toBeInTheDocument();
	} );
} );
