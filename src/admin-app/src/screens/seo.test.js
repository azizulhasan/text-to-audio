import '@testing-library/jest-dom';
import { fireEvent, screen } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { axe, toHaveNoViolations } from 'jest-axe';

import { renderWithApp } from '../test-utils';
import Seo from './Seo';
import { getScreenComponent } from './registry';

expect.extend( toHaveNoViolations );

describe( 'SEO & AI Search (free)', () => {
	beforeEach( () => {
		window.fetch = jest.fn();
	} );

	it( 'is the screen of the route seo', () => {
		expect( getScreenComponent( 'seo' ) ).toBeTruthy();
	} );

	it( 'says what Pro adds and opens the plans', () => {
		const { context } = renderWithApp( <Seo />, { hash: '#/seo' } );

		expect(
			screen.getByRole( 'heading', {
				name: /Audio in search results and AI answers/,
			} )
		).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
		expect(
			screen.getByText( /"@type": "AudioObject"/ )
		).toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'See plans' } ) );
		expect( context.go ).toHaveBeenCalledWith( 'account:plans' );
	} );

	it( 'holds no setting and no locked control (wp.org guideline 5)', () => {
		const { container } = renderWithApp( <Seo />, { hash: '#/seo' } );

		expect(
			container.querySelectorAll( 'input, select, textarea' )
		).toHaveLength( 0 );
		expect( container.querySelectorAll( '[disabled]' ) ).toHaveLength( 0 );
		expect( screen.getAllByRole( 'button' ) ).toHaveLength( 1 );
	} );

	it( 'asks the site nothing', () => {
		renderWithApp( <Seo />, { hash: '#/seo' } );

		expect( window.fetch ).not.toHaveBeenCalled();
	} );

	it( 'keeps the settings in reach with a Pro that has no new screen yet', () => {
		renderWithApp( <Seo />, { hash: '#/seo', boot: { isPro: true } } );

		expect(
			screen.queryByRole( 'button', { name: 'See plans' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'link', {
				name: 'Open it in the classic screens',
			} )
		).toHaveAttribute( 'href', expect.stringMatching( /#\/seo$/ ) );
	} );

	it( 'gives way to the screen Pro brings', () => {
		const ProSeo = () => null;
		addFilter( 'atlasvoice.screens', 'test/seo', ( screens ) => ( {
			...screens,
			seo: ProSeo,
		} ) );

		expect( getScreenComponent( 'seo' ) ).toBe( ProSeo );

		removeFilter( 'atlasvoice.screens', 'test/seo' );
		expect( getScreenComponent( 'seo' ) ).not.toBe( ProSeo );
	} );

	it( 'has no accessibility violations', async () => {
		const { container } = renderWithApp( <Seo />, { hash: '#/seo' } );

		expect( await axe( container ) ).toHaveNoViolations();
	} );
} );
