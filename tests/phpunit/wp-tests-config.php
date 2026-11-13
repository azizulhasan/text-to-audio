<?php
/**
 * Configuration for the WordPress test library.
 *
 * Every value can be set with an environment variable, so the same file works
 * on a developer's machine and in CI. No password is kept in this file.
 *
 * @package TTA
 */

// The plugin sits in <WordPress>/wp-content/plugins/text-to-audio/tests/phpunit.
$atlasvoice_tests_abspath = getenv( 'WP_TESTS_ABSPATH' );
if ( ! $atlasvoice_tests_abspath ) {
	$atlasvoice_tests_abspath = dirname( __DIR__, 5 ) . '/';
}
define( 'ABSPATH', rtrim( str_replace( '\\', '/', $atlasvoice_tests_abspath ), '/' ) . '/' );

$atlasvoice_tests_db = getenv( 'WP_TESTS_DB_NAME' );
if ( ! $atlasvoice_tests_db ) {
	$atlasvoice_tests_db = 'tts_test';
}

// The test library drops every table in this database. Refuse anything that
// is not clearly a test database, so a wrong setting can never touch a site.
if ( '_test' !== substr( $atlasvoice_tests_db, -5 ) ) {
	fwrite( STDERR, "Refusing to run: the test database name must end in \"_test\" (got \"{$atlasvoice_tests_db}\").\n" );
	exit( 1 );
}

define( 'DB_NAME', $atlasvoice_tests_db );
define( 'DB_USER', getenv( 'WP_TESTS_DB_USER' ) ? getenv( 'WP_TESTS_DB_USER' ) : 'root' );
define( 'DB_PASSWORD', getenv( 'WP_TESTS_DB_PASSWORD' ) ? getenv( 'WP_TESTS_DB_PASSWORD' ) : '' );
define( 'DB_HOST', getenv( 'WP_TESTS_DB_HOST' ) ? getenv( 'WP_TESTS_DB_HOST' ) : 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

$table_prefix = 'wptests_'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'AtlasVoice tests' );
define( 'WP_PHP_BINARY', 'php' );
define( 'WP_DEBUG', true );
