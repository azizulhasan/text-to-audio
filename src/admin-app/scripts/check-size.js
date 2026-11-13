/**
 * Bundle budget (TTS-372): fails when the built app grows past its limits.
 *
 * The admin must stay light: the first file every screen loads has one limit,
 * and each lazily loaded screen has another. Sizes are the minified files on
 * disk, which is what a site downloads before compression.
 */
const fs = require( 'fs' );
const path = require( 'path' );

const BUILD_DIR = path.resolve( __dirname, '../../../build/admin-app' );
const KB = 1024;
const LIMITS = {
	entryJs: 150 * KB,
	chunkJs: 80 * KB,
	css: 60 * KB,
};

if ( ! fs.existsSync( BUILD_DIR ) ) {
	console.error( `No build found at ${ BUILD_DIR }. Run "npm run build" first.` );
	process.exit( 1 );
}

const failures = [];

for ( const file of fs.readdirSync( BUILD_DIR ) ) {
	const size = fs.statSync( path.join( BUILD_DIR, file ) ).size;
	let limit = null;

	if ( file === 'index.js' ) {
		limit = LIMITS.entryJs;
	} else if ( file.endsWith( '.js' ) ) {
		limit = LIMITS.chunkJs;
	} else if ( file.endsWith( '.css' ) ) {
		limit = LIMITS.css;
	}

	if ( limit === null ) {
		continue;
	}

	const line = `${ file }: ${ ( size / KB ).toFixed( 1 ) } KB of ${ limit / KB } KB`;
	console.log( line );

	if ( size > limit ) {
		failures.push( line );
	}
}

if ( failures.length ) {
	console.error( `\nOver budget:\n${ failures.join( '\n' ) }` );
	process.exit( 1 );
}
