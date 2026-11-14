import '@testing-library/jest-dom';
import { fireEvent, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import Header from './Header';
import Search, { searchIndex, searchResults } from './Search';

expect.extend( toHaveNoViolations );

const box = () => screen.getByRole( 'combobox', { name: 'Search AtlasVoice' } );
const options = () =>
	screen.queryAllByRole( 'option' ).map( ( option ) => option.textContent );
const type = ( text ) => fireEvent.change( box(), { target: { value: text } } );

describe( 'Search', () => {
	it( 'sits in the header', () => {
		renderWithApp( <Header onMenu={ () => {} } /> );

		expect( box() ).toBeInTheDocument();
	} );

	it( 'is closed until it is used', () => {
		renderWithApp( <Search /> );

		expect( box() ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
	} );

	it( 'shows a few screens and the actions when it is opened', () => {
		renderWithApp( <Search /> );

		fireEvent.focus( box() );

		expect( box() ).toHaveAttribute( 'aria-expanded', 'true' );
		const list = screen.getByRole( 'listbox', { name: 'Search results' } );
		expect(
			within( list ).getByRole( 'group', { name: 'Screens' } )
		).toBeInTheDocument();
		expect(
			within( list ).getByRole( 'group', { name: 'Actions' } )
		).toBeInTheDocument();
		// Settings are many: they show for a search only.
		expect(
			within( list ).queryByRole( 'group', { name: 'Settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'finds a screen and opens it with Enter', () => {
		const { context } = renderWithApp( <Search /> );

		type( 'pronun' );
		expect( options()[ 0 ] ).toBe( 'Voice › PronunciationScreen' );
		fireEvent.keyDown( box(), { key: 'Enter' } );

		expect( context.go ).toHaveBeenCalledWith( 'voice:pronunciation' );
		// The box is empty and closed again.
		expect( box() ).toHaveValue( '' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
	} );

	it( 'finds a setting by the name it had in the classic screens', () => {
		const { context } = renderWithApp( <Search /> );

		type( 'integrations' );

		const hit = screen.getByRole( 'option', {
			name: /Voice › Your own provider/,
		} );
		expect( hit ).toHaveTextContent( 'Was “Integrations”' );
		fireEvent.click( hit );
		expect( context.go ).toHaveBeenCalledWith( 'voice:providers' );
	} );

	it( 'moves through the results with the arrow keys', () => {
		const { context } = renderWithApp( <Search /> );
		type( 'voice' );
		const first = screen.getAllByRole( 'option' )[ 0 ];
		const second = screen.getAllByRole( 'option' )[ 1 ];

		expect( first ).toHaveAttribute( 'aria-selected', 'true' );
		expect( box() ).toHaveAttribute( 'aria-activedescendant', first.id );

		fireEvent.keyDown( box(), { key: 'ArrowDown' } );
		expect( second ).toHaveAttribute( 'aria-selected', 'true' );
		expect( box() ).toHaveAttribute( 'aria-activedescendant', second.id );

		fireEvent.keyDown( box(), { key: 'ArrowUp' } );
		fireEvent.keyDown( box(), { key: 'ArrowUp' } );
		expect( first ).toHaveAttribute( 'aria-selected', 'true' );

		fireEvent.keyDown( box(), { key: 'ArrowDown' } );
		fireEvent.keyDown( box(), { key: 'Enter' } );
		expect( context.go ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not move past the last result', () => {
		renderWithApp( <Search /> );
		type( 'pronunciation' );
		const count = screen.getAllByRole( 'option' ).length;

		for ( let i = 0; i < count + 3; i++ ) {
			fireEvent.keyDown( box(), { key: 'ArrowDown' } );
		}

		expect( screen.getAllByRole( 'option' )[ count - 1 ] ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );

	it( 'closes and empties with Escape', () => {
		renderWithApp( <Search /> );
		type( 'voice' );

		fireEvent.keyDown( box(), { key: 'Escape' } );

		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		expect( box() ).toHaveValue( '' );
	} );

	it( 'says so when nothing matches, and Enter does nothing', () => {
		const { context } = renderWithApp( <Search /> );

		type( 'zzzz' );
		fireEvent.keyDown( box(), { key: 'Enter' } );

		expect(
			screen.getByText(
				/Nothing matches “zzzz”\. Old setting names work too/
			)
		).toBeInTheDocument();
		expect( context.go ).not.toHaveBeenCalled();
	} );

	it( 'asks before it goes live', () => {
		const { context } = renderWithApp( <Search /> );

		type( 'go live' );
		fireEvent.click(
			screen.getByRole( 'option', { name: 'Go live Action' } )
		);

		expect( context.confirm ).toHaveBeenCalledTimes( 1 );
		expect( context.confirm.mock.calls[ 0 ][ 0 ].title ).toBe(
			'Go live for visitors?'
		);
		expect( context.go ).not.toHaveBeenCalled();
	} );

	it( 'offers to go back to staging on a live site', () => {
		renderWithApp( <Search />, { mode: 'production' } );

		fireEvent.focus( box() );

		expect(
			screen.getByRole( 'option', { name: /Back to staging/ } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'option', { name: /Go live/ } )
		).not.toBeInTheDocument();
	} );

	it( 'takes the cursor with "/" but not while the user is typing elsewhere', () => {
		renderWithApp(
			<>
				<input aria-label="Another field" />
				<Search />
			</>
		);

		fireEvent.keyDown( screen.getByLabelText( 'Another field' ), {
			key: '/',
		} );
		expect( box() ).not.toHaveFocus();

		fireEvent.keyDown( document.body, { key: '/' } );
		expect( box() ).toHaveFocus();
	} );

	it( 'leaves Ctrl+K to WordPress', () => {
		renderWithApp( <Search /> );

		const event = new window.KeyboardEvent( 'keydown', {
			key: 'k',
			ctrlKey: true,
			bubbles: true,
			cancelable: true,
		} );
		document.body.dispatchEvent( event );

		expect( event.defaultPrevented ).toBe( false );
		expect( box() ).not.toHaveFocus();
	} );

	it( 'lists Pro’s tabs with Pro only', () => {
		const words = ( isPro ) =>
			searchIndex( {
				isPro,
				setupFinished: true,
				live: false,
			} ).screens.map( ( row ) => row.route );

		expect( words( false ) ).not.toContain( 'account:licence' );
		expect( words( true ) ).toContain( 'account:licence' );
	} );

	it( 'lists Setup until the setup is finished', () => {
		const routes = ( setupFinished ) =>
			searchIndex( {
				isPro: false,
				setupFinished,
				live: false,
			} ).screens.map( ( row ) => row.route );

		expect( routes( false ) ).toContain( 'setup' );
		expect( routes( true ) ).not.toContain( 'setup' );
	} );

	it( 'gives results in groups, with limits, and ignores case and spaces', () => {
		const index = searchIndex( {
			isPro: true,
			setupFinished: true,
			live: false,
		} );

		const none = searchResults( index, '   ' );
		expect( none.map( ( group ) => group.id ) ).toEqual( [
			'screens',
			'actions',
		] );
		expect( none[ 0 ].rows ).toHaveLength( 4 );

		const many = searchResults( index, ' E ' );
		many.forEach( ( group ) =>
			expect( group.rows.length ).toBeLessThanOrEqual( 6 )
		);

		expect( searchResults( index, 'HEALTH' )[ 0 ].rows[ 0 ].route ).toBe(
			'site'
		);
		expect( searchResults( index, 'zzzz' ) ).toEqual( [] );
		expect( searchResults( index, null ).length ).toBe( 2 );
	} );

	it( 'has no accessibility violations, closed and open', async () => {
		const { container } = renderWithApp( <Search /> );
		expect( await axe( container ) ).toHaveNoViolations();

		type( 'voice' );
		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
