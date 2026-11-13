<?php
/**
 * PHPUnit bootstrap: loads the WordPress test library, then the plugin.
 *
 * @package TTA
 */

$atlasvoice_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $atlasvoice_tests_dir ) {
	$atlasvoice_tests_dir = __DIR__ . '/vendor/wp-phpunit/wp-phpunit';
}

if ( ! file_exists( $atlasvoice_tests_dir . '/includes/functions.php' ) ) {
	fwrite( STDERR, "The WordPress test library is missing. Run: composer install -d tests/phpunit\n" );
	exit( 1 );
}

putenv( 'WP_PHPUNIT__TESTS_CONFIG=' . __DIR__ . '/wp-tests-config.php' );
define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', __DIR__ . '/vendor/yoast/phpunit-polyfills' );

require_once $atlasvoice_tests_dir . '/includes/functions.php';

// Load the free plugin alone, the way a site without Pro runs it.
tests_add_filter(
	'muplugins_loaded',
	static function () {
		require dirname( __DIR__, 2 ) . '/text-to-audio.php';
	}
);

require $atlasvoice_tests_dir . '/includes/bootstrap.php';

// The CLI commands are tested against a stand-in for the WP-CLI runtime.
require_once __DIR__ . '/includes/wp-cli-stub.php';
