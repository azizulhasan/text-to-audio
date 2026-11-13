import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';

import { getScreenComponent } from '../screens/registry';
import { renderWithApp } from '../test-utils';
import { KIT_VERSION, createKit, publishKit } from './kit';
import Slot, { getSlotFills, slotHook } from './Slot';

describe( 'the extension surface (window.atlasvoice.ui)', () => {
	it( 'is one frozen object with a version', () => {
		const kit = createKit();

		expect( kit.version ).toBe( KIT_VERSION );
		expect( Object.isFrozen( kit ) ).toBe( true );
		expect( Object.isFrozen( kit.parts ) ).toBe( true );
		expect( () => {
			'use strict';
			kit.parts.Pane = null;
		} ).toThrow();
	} );

	it( 'offers the layout parts, the slot, the context and the REST helper', () => {
		const kit = createKit();

		expect( Object.keys( kit ).sort() ).toEqual( [
			'Slot',
			'parts',
			'request',
			'useApp',
			'version',
		] );
		expect( Object.keys( kit.parts ).sort() ).toEqual( [
			'AppIcon',
			'Chip',
			'Count',
			'Drawer',
			'DrawerSection',
			'Empty',
			'Pane',
			'ProBadge',
			'SaveBar',
			'Scroll',
			'Section',
		] );
		for ( const part of Object.values( kit.parts ) ) {
			expect( typeof part ).toBe( 'function' );
		}
	} );

	it( 'is published once and cannot be replaced', () => {
		const root = {};

		const kit = publishKit( root );

		expect( root.atlasvoice.ui ).toBe( kit );
		expect( publishKit( root ) ).toBe( kit );
		expect( () => {
			'use strict';
			root.atlasvoice.ui = { version: 99 };
		} ).toThrow();
		expect( root.atlasvoice.ui ).toBe( kit );
	} );

	it( 'keeps what another script already put on window.atlasvoice', () => {
		const root = { atlasvoice: { player: 'kept' } };

		publishKit( root );

		expect( root.atlasvoice.player ).toBe( 'kept' );
		expect( root.atlasvoice.ui.version ).toBe( KIT_VERSION );
	} );

	it( 'sets no other global', () => {
		const root = {};

		publishKit( root );

		expect( Object.keys( root ) ).toEqual( [ 'atlasvoice' ] );
		expect( Object.keys( root.atlasvoice ) ).toEqual( [ 'ui' ] );
	} );
} );

describe( 'Slot', () => {
	const hook = slotHook( 'voice.engines' );

	afterEach( () => {
		// Unmount first: removing a filter re-renders a slot that is still on screen.
		cleanup();
		removeFilter( hook, 'test/pro' );
		removeFilter( hook, 'test/bad' );
	} );

	it( 'names its filter after the slot', () => {
		expect( hook ).toBe( 'atlasvoice.slot.voice.engines' );
	} );

	it( 'renders nothing at all without an extension', () => {
		const { container } = render( <Slot name="voice.engines" /> );

		// Free must not show a Pro form or a disabled Pro control.
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders what an extension adds, with the props of the screen', () => {
		addFilter( hook, 'test/pro', ( fills ) => [
			...fills,
			( { engine } ) => <p>Cloud tile, current engine: { engine }</p>,
		] );

		render(
			<Slot name="voice.engines" fillProps={ { engine: 'browser' } } />
		);

		expect(
			screen.getByText( 'Cloud tile, current engine: browser' )
		).toBeVisible();
	} );

	it( 'shows a fill that is added after the screen rendered', () => {
		render( <Slot name="voice.engines" /> );
		expect( screen.queryByText( 'Late tile' ) ).toBeNull();

		act( () => {
			addFilter( hook, 'test/pro', ( fills ) => [
				...fills,
				() => <p>Late tile</p>,
			] );
		} );
		expect( screen.getByText( 'Late tile' ) ).toBeVisible();

		act( () => {
			removeFilter( hook, 'test/pro' );
		} );
		expect( screen.queryByText( 'Late tile' ) ).toBeNull();
	} );

	it.each( [
		[ 'null', null ],
		[ 'a string', 'nope' ],
		[ 'an object', { a: 1 } ],
		[ 'a list with rubbish in it', [ 'text', 5, null ] ],
	] )( 'ignores a filter that returns %s', ( _name, value ) => {
		addFilter( hook, 'test/bad', () => value );

		expect( getSlotFills( 'voice.engines' ) ).toEqual( [] );
		const { container } = render( <Slot name="voice.engines" /> );
		expect( container ).toBeEmptyDOMElement();
	} );
} );

describe( 'an extension built only on the kit', () => {
	afterEach( () => {
		removeFilter( 'atlasvoice.screens', 'test/pro' );
	} );

	it( 'can add a screen that uses the parts and the app context', () => {
		const { parts, useApp } = createKit();

		const ProSeoScreen = () => {
			const { isPro } = useApp();

			return (
				<parts.Pane canvas>
					<parts.Scroll>
						<parts.Section title="Audio in search results">
							<parts.Chip tone="ok" dot>
								{ isPro ? 'Pro active' : 'Free' }
							</parts.Chip>
						</parts.Section>
					</parts.Scroll>
				</parts.Pane>
			);
		};

		addFilter( 'atlasvoice.screens', 'test/pro', ( screens ) => ( {
			...screens,
			seo: ProSeoScreen,
		} ) );

		const Screen = getScreenComponent( 'seo' );
		renderWithApp( <Screen />, { boot: { isPro: true } } );

		expect(
			screen.getByRole( 'heading', { name: 'Audio in search results' } )
		).toBeVisible();
		expect( screen.getByText( 'Pro active' ) ).toBeVisible();
	} );
} );
