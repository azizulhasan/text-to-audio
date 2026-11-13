import '@testing-library/jest-dom';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { HelpButton, HelpDrawer } from '../help/HelpDrawer';
import { renderWithApp } from '../test-utils';
import Drawer, { DrawerSection } from './Drawer';
import Header from './Header';
import { collectNotices } from './NoticesBell';
import Rail from './Rail';
import SaveBar from './SaveBar';
import StatusBar from './StatusBar';

expect.extend( toHaveNoViolations );

describe( 'Rail', () => {
	it( 'lists the destinations in order, with Setup until it is finished', () => {
		renderWithApp( <Rail open={ false } onClose={ () => {} } /> );

		const names = screen
			.getAllByRole( 'button' )
			.map( ( button ) => button.textContent );

		expect( names.slice( 0, 11 ) ).toEqual( [
			'Home',
			'Setup',
			'Voice',
			'Player',
			'What is read',
			'Audio library',
			'Insights',
			'SEO & AI Search',
			'Site health',
			'Account & plans',
			'Help',
		] );
	} );

	it( 'drops Setup once setup is finished', () => {
		renderWithApp( <Rail open={ false } onClose={ () => {} } />, {
			boot: { setupFinished: true },
		} );

		expect( screen.queryByRole( 'button', { name: 'Setup' } ) ).toBeNull();
	} );

	it( 'marks the current screen for assistive technology', () => {
		renderWithApp( <Rail open={ false } onClose={ () => {} } />, {
			hash: '#/voice/pronunciation',
		} );

		expect(
			screen.getByRole( 'button', { name: 'Voice' } )
		).toHaveAttribute( 'aria-current', 'page' );
		expect(
			screen.getByRole( 'button', { name: 'Player' } )
		).not.toHaveAttribute( 'aria-current' );
	} );

	it( 'opens a screen and closes the phone menu', async () => {
		const onClose = jest.fn();
		const { context } = renderWithApp(
			<Rail open={ true } onClose={ onClose } />
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Player' } )
		);

		expect( context.go ).toHaveBeenCalledWith( 'player' );
		expect( onClose ).toHaveBeenCalled();
	} );

	it( 'offers the upgrade in Free, as a link to Plans and nothing else', async () => {
		const { context } = renderWithApp(
			<Rail open={ false } onClose={ () => {} } />
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Upgrade to Pro' } )
		);

		expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
		expect( screen.getByText( 'You are on the Free plan' ) ).toBeVisible();
	} );

	it( 'shows no upgrade prompt when Pro is active', () => {
		renderWithApp( <Rail open={ false } onClose={ () => {} } />, {
			boot: { isPro: true, proVersion: '3.6.0' },
		} );

		expect(
			screen.queryByRole( 'button', { name: 'Upgrade to Pro' } )
		).toBeNull();
		expect( screen.getByText( '2.5.0 · Pro 3.6.0' ) ).toBeVisible();
	} );

	it( 'has no accessibility violations', async () => {
		const { container } = renderWithApp(
			<Rail open={ false } onClose={ () => {} } />
		);

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );

describe( 'Header', () => {
	it( 'names the screen and offers help', () => {
		renderWithApp( <Header onMenu={ () => {} } />, {
			hash: '#/voice/pronunciation',
		} );

		expect(
			screen.getByRole( 'heading', { level: 1, name: 'Voice' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'How to' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Notices' } )
		).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Help' } ) ).toBeVisible();
	} );

	it( 'opens the phone menu', async () => {
		const onMenu = jest.fn();
		renderWithApp( <Header onMenu={ onMenu } /> );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'AtlasVoice menu' } )
		);

		expect( onMenu ).toHaveBeenCalled();
	} );
} );

describe( 'Drawer', () => {
	const open = ( onClose = jest.fn() ) => {
		renderWithApp(
			<>
				<button>Opener</button>
				<Drawer
					title="Edit a word"
					kicker="Pronunciation"
					onClose={ onClose }
					footer={ <button>Save word</button> }
				>
					<DrawerSection title="Word">
						<input aria-label="Word" />
					</DrawerSection>
				</Drawer>
			</>
		);

		return onClose;
	};

	it( 'is a named modal dialog that takes focus', () => {
		open();

		const dialog = screen.getByRole( 'dialog', { name: 'Edit a word' } );

		expect( dialog ).toHaveAttribute( 'aria-modal', 'true' );
		expect( dialog ).toHaveFocus();
	} );

	it( 'closes with Esc, the Close button and a click on the dimmed page', async () => {
		const onClose = open();

		fireEvent.keyDown( document, { key: 'Escape' } );
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Close' } )
		);
		fireEvent.click(
			document.querySelector( '.atlasvoice-drawer-backdrop' )
		);

		expect( onClose ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'keeps Tab inside the drawer', () => {
		open();
		const close = screen.getByRole( 'button', { name: 'Close' } );
		const last = screen.getByRole( 'button', { name: 'Save word' } );

		last.focus();
		fireEvent.keyDown( document, { key: 'Tab' } );
		expect( close ).toHaveFocus();

		fireEvent.keyDown( document, { key: 'Tab', shiftKey: true } );
		expect( last ).toHaveFocus();
	} );

	it( 'has no accessibility violations', async () => {
		open();

		expect(
			await axe( document.querySelector( '.atlasvoice-drawer' ) )
		).toHaveNoViolations();
	} );
} );

describe( 'Help on every screen', () => {
	it( 'shows the steps and the guide for the current place', () => {
		renderWithApp(
			<HelpDrawer route="voice:pronunciation" onClose={ () => {} } />
		);

		expect(
			screen.getByRole( 'dialog', { name: 'Fix how a word is said' } )
		).toBeVisible();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 3 );

		const guide = screen.getByRole( 'link', { name: /Read the guide/ } );
		expect( guide ).toHaveAttribute(
			'href',
			'https://atlasaidev.com/docs/atlasvoice/pronunciation/'
		);
		expect( guide ).toHaveAttribute( 'target', '_blank' );
		expect( guide ).toHaveAttribute( 'rel', 'noreferrer' );
	} );

	it( 'hides the video row until a video is published', () => {
		renderWithApp( <HelpDrawer route="overview" onClose={ () => {} } /> );

		expect(
			screen.queryByRole( 'link', { name: /Watch the video/ } )
		).toBeNull();
	} );

	it( 'shows the video row with its length once it has an address', () => {
		const boot = {
			helpTopics: {
				overview: {
					title: 'Home',
					steps: [ 'A', 'B', 'C' ],
					docUrl: 'https://atlasaidev.com/docs/atlasvoice/home/',
					videoUrl: 'https://www.youtube.com/watch?v=abc',
					videoLength: '2:00',
				},
			},
		};
		renderWithApp( <HelpDrawer route="overview" onClose={ () => {} } />, {
			boot,
		} );

		expect(
			screen.getByRole( 'link', { name: /Watch the video · 2:00/ } )
		).toHaveAttribute( 'href', 'https://www.youtube.com/watch?v=abc' );
	} );

	it( 'never links to an address that is not a web page', () => {
		const boot = {
			helpTopics: {
				overview: {
					title: 'Home',
					steps: [ 'A' ],
					docUrl: 'javascript:alert(1)',
					videoUrl: 'data:text/html,x',
					videoLength: '1:00',
				},
			},
		};
		renderWithApp( <HelpDrawer route="overview" onClose={ () => {} } />, {
			boot,
		} );

		// The guide falls back to the docs home; the video row is not shown.
		expect(
			screen.getByRole( 'link', { name: /Read the guide/ } )
		).toHaveAttribute( 'href', 'https://atlasaidev.com/docs/atlasvoice/' );
		expect(
			screen.queryByRole( 'link', { name: /Watch the video/ } )
		).toBeNull();
	} );

	it( 'opens from the How to button for the screen you are on', () => {
		renderWithApp( <HelpButton />, { hash: '#/voice/pronunciation' } );

		fireEvent.click( screen.getByRole( 'button', { name: 'How to' } ) );

		expect(
			screen.getByRole( 'dialog', { name: 'Fix how a word is said' } )
		).toBeVisible();
	} );
} );

describe( 'StatusBar', () => {
	afterEach( () => {
		delete window.fetch;
	} );

	it( 'says in words whether visitors hear the posts', () => {
		renderWithApp( <StatusBar /> );
		expect(
			screen.getByText( 'Staging: only admins see the player' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox' ) ).not.toBeChecked();
	} );

	it( 'shows live when the site is live', () => {
		renderWithApp( <StatusBar />, { mode: 'production' } );

		expect(
			screen.getByText( 'Live: visitors hear your posts' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
	} );

	it( 'asks before going live and changes nothing until the answer is yes', async () => {
		window.fetch = jest.fn();
		const { context } = renderWithApp( <StatusBar /> );

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( context.confirm ).toHaveBeenCalledTimes( 1 );
		expect( context.confirm.mock.calls[ 0 ][ 0 ].title ).toBe(
			'Go live for visitors?'
		);
		expect( window.fetch ).not.toHaveBeenCalled();
		expect( context.setMode ).not.toHaveBeenCalled();
	} );

	it( 'goes live through the mode route after the yes', async () => {
		window.fetch = jest.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( { status: true, mode: 'production' } ),
		} );
		const { context } = renderWithApp( <StatusBar /> );

		await userEvent.click( screen.getByRole( 'checkbox' ) );
		await act( async () => {
			await context.confirm.mock.calls[ 0 ][ 0 ].onOk();
		} );

		const [ url, options ] = window.fetch.mock.calls[ 0 ];
		expect( url ).toBe( 'https://site.test/wp-json/tta/v1/mode' );
		expect( options.method ).toBe( 'POST' );
		expect( JSON.parse( options.body ) ).toEqual( {
			action: 'go-live',
			confirm: 'GO LIVE',
		} );
		expect( context.setMode ).toHaveBeenCalledWith( 'production' );
		expect( context.notify ).toHaveBeenCalled();
	} );

	it( 'asks before going back to staging and sends the revert', async () => {
		window.fetch = jest.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( { status: true, mode: 'staging' } ),
		} );
		const { context } = renderWithApp( <StatusBar />, {
			mode: 'production',
		} );

		await userEvent.click( screen.getByRole( 'checkbox' ) );
		expect( context.confirm.mock.calls[ 0 ][ 0 ].destructive ).toBe( true );
		await act( async () => {
			await context.confirm.mock.calls[ 0 ][ 0 ].onOk();
		} );

		expect( JSON.parse( window.fetch.mock.calls[ 0 ][ 1 ].body ) ).toEqual(
			{
				action: 'revert',
			}
		);
		expect( context.setMode ).toHaveBeenCalledWith( 'staging' );
	} );

	it( 'keeps the mode and says why when the site refuses', async () => {
		window.fetch = jest.fn().mockResolvedValue( {
			ok: false,
			status: 403,
			json: async () => ( { message: 'Not allowed.' } ),
		} );
		const { context } = renderWithApp( <StatusBar /> );

		await userEvent.click( screen.getByRole( 'checkbox' ) );
		await act( async () => {
			await context.confirm.mock.calls[ 0 ][ 0 ].onOk();
		} );

		expect( context.setMode ).not.toHaveBeenCalled();
		await waitFor( () =>
			expect( context.notify ).toHaveBeenCalledWith(
				'Could not change the mode: Not allowed.',
				'error'
			)
		);
	} );

	it( 'has no accessibility violations', async () => {
		const { container } = renderWithApp( <StatusBar /> );

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );

describe( 'SaveBar', () => {
	it( 'tells the frame about unsaved changes and enables Save', async () => {
		const onSave = jest.fn();
		const { context } = renderWithApp(
			<SaveBar dirty={ true } saving={ false } onSave={ onSave } />
		);

		expect( screen.getByText( 'Unsaved changes' ) ).toBeVisible();
		expect( context.setDirty ).toHaveBeenLastCalledWith( true );

		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( onSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'cannot save when nothing changed', () => {
		const { context } = renderWithApp(
			<SaveBar dirty={ false } saving={ false } onSave={ () => {} } />
		);

		expect( screen.getByText( 'All changes saved' ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();
		expect( context.setDirty ).toHaveBeenLastCalledWith( false );
	} );

	it( 'clears the unsaved state when the screen is left', () => {
		const { context, unmount } = renderWithApp(
			<SaveBar dirty={ true } saving={ false } onSave={ () => {} } />
		);

		unmount();

		expect( context.setDirty ).toHaveBeenLastCalledWith( false );
	} );
} );

describe( 'collectNotices', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'takes WordPress notices off the page, keeping the real elements', () => {
		document.body.innerHTML = `
			<div id="wpbody-content">
				<div class="notice notice-warning" id="other-plugin"><p>Clear the cache.</p><button class="notice-dismiss"></button></div>
				<div class="error" id="core"><p>Something failed.</p></div>
				<div class="notice hidden" id="hidden-one"></div>
				<div class="atlasvoice-page"><div class="updated" id="ours"><p>Saved.</p></div></div>
				<div class="wrap"><div class="notice" id="inside-another-screen"></div></div>
			</div>`;

		const found = collectNotices( document );

		expect( found.map( ( node ) => node.id ) ).toEqual( [
			'other-plugin',
			'core',
			'ours',
		] );
		// Moved, not copied: the dismiss button is the original one.
		expect( found[ 0 ].querySelector( '.notice-dismiss' ) ).not.toBeNull();
		expect( document.getElementById( 'other-plugin' ) ).toBeNull();
		// A hidden notice and a notice of another screen are left alone.
		expect( document.getElementById( 'hidden-one' ) ).not.toBeNull();
		expect(
			document.getElementById( 'inside-another-screen' )
		).not.toBeNull();
	} );
} );
