import { buildUrl, request } from './api';

describe( 'buildUrl', () => {
	it( 'joins the root and the route', () => {
		expect( buildUrl( 'https://a.test/wp-json/', 'tta/v1/mode' ) ).toBe(
			'https://a.test/wp-json/tta/v1/mode'
		);
		expect( buildUrl( 'https://a.test/wp-json/', '/tta/v1/mode' ) ).toBe(
			'https://a.test/wp-json/tta/v1/mode'
		);
	} );

	it( 'adds query arguments with "?" on pretty permalinks', () => {
		expect(
			buildUrl( 'https://a.test/wp-json/', 'tta/v1/x', { page: 2 } )
		).toBe( 'https://a.test/wp-json/tta/v1/x?page=2' );
	} );

	it( 'adds query arguments with "&" on plain permalinks', () => {
		expect(
			buildUrl( 'https://a.test/index.php?rest_route=/', 'tta/v1/x', {
				page: 2,
			} )
		).toBe( 'https://a.test/index.php?rest_route=/tta/v1/x&page=2' );
	} );
} );

describe( 'request', () => {
	const boot = { restUrl: 'https://a.test/wp-json/', restNonce: 'n0nce' };

	afterEach( () => {
		delete window.fetch;
	} );

	it( 'sends the nonce and the JSON body', async () => {
		window.fetch = jest.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( { status: true } ),
		} );

		const result = await request( boot, 'tta/v1/mode', {
			method: 'POST',
			data: { action: 'revert' },
		} );

		expect( result ).toEqual( { status: true } );
		const [ url, options ] = window.fetch.mock.calls[ 0 ];
		expect( url ).toBe( 'https://a.test/wp-json/tta/v1/mode' );
		expect( options.headers[ 'X-WP-Nonce' ] ).toBe( 'n0nce' );
		expect( options.body ).toBe( '{"action":"revert"}' );
		expect( options.credentials ).toBe( 'same-origin' );
	} );

	it( 'rejects with the server message and status', async () => {
		window.fetch = jest.fn().mockResolvedValue( {
			ok: false,
			status: 403,
			json: async () => ( { code: 'rest_forbidden', message: 'No.' } ),
		} );

		await expect( request( boot, 'tta/v1/mode' ) ).rejects.toMatchObject( {
			message: 'No.',
			status: 403,
			code: 'rest_forbidden',
		} );
	} );

	it( 'rejects with the status when the answer is not JSON', async () => {
		window.fetch = jest.fn().mockResolvedValue( {
			ok: false,
			status: 502,
			json: async () => {
				throw new Error( 'not json' );
			},
		} );

		await expect( request( boot, 'tta/v1/mode' ) ).rejects.toMatchObject( {
			message: 'HTTP 502',
			status: 502,
		} );
	} );
} );
