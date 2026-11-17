<?php
/**
 * Player 3 (AtlasVoice TTS) in Free runs the same server checks as Pro's
 * players: Text_Gate, Batch_Merger (run open + complete join) and Part_Claim.
 *
 * Integration test: needs a local WordPress with this Free plugin active and
 * Pro NOT active (the Free-only case). The voice service is never called (every
 * HTTP request is answered here). The player is switched to 3 and the service
 * connection is faked for the run, then both are put back; files, claims and
 * the draft post it creates are removed.
 *
 * Run from the WordPress root (some plugins load files relative to it):
 *   WP_LOAD=/path/to/wp-load.php php path/to/tests/player3-generation-checks-test.php
 * Not shipped: gulpfile.js excludes tests/ from the ZIP.
 */

$_SERVER['HTTP_HOST']   = $_SERVER['HTTP_HOST'] ?? 'localhost';
$_SERVER['REQUEST_URI'] = $_SERVER['REQUEST_URI'] ?? '/';
require getenv( 'WP_LOAD' ) ?: __DIR__ . '/../../../../wp-load.php';

use TTA\Audio\Batch_Merger;
use TTA\Audio\Part_Claim;
use TTA\Audio\Text_Gate;
use TTA\TTA_AtlasVoice_Service;
use TTA\TTA_GTTS_Generation;

if ( ! class_exists( Text_Gate::class ) || ! class_exists( TTA_GTTS_Generation::class ) ) {
	exit( "This Free build has no player 3 checks.\n" );
}
if ( function_exists( 'ttsp_fs' ) || class_exists( '\TTA_Pro\TTA_Pro_Service_Bridge', false ) ) {
	exit( "Run this with Pro inactive: it tests the Free-only case.\n" );
}

$passed = 0;
$failed = 0;

function check( $name, $expected, $actual ) {
	global $passed, $failed;
	if ( $expected === $actual ) {
		$passed++;
		return;
	}
	$failed++;
	echo "FAIL: {$name}\n  expected: " . var_export( $expected, true ) . "\n  actual:   " . var_export( $actual, true ) . "\n";
}

// ---- voice service mock -------------------------------------------------------
$service_calls = 0;
add_filter( 'pre_http_request', function ( $pre, $args, $url ) use ( &$service_calls ) {
	if ( false !== strpos( $url, '/v1/synthesize' ) ) {
		$service_calls++;
		$body = json_decode( $args['body'], true );
		if ( false !== strpos( (string) ( $body['text'] ?? '' ), '[[nothing]]' ) ) {
			return array( 'response' => array( 'code' => 422, 'message' => '' ), 'headers' => array( 'content-type' => 'application/json' ), 'cookies' => array(),
				'body' => wp_json_encode( array( 'error' => array( 'code' => 'nothing_to_speak', 'message' => 'Nothing to speak.' ) ) ) );
		}
		return array( 'response' => array( 'code' => 200, 'message' => 'OK' ), 'headers' => array( 'content-type' => 'audio/mpeg' ), 'cookies' => array(),
			'body' => str_repeat( "\xFF", 400 ) );
	}
	return new WP_Error( 'test_offline', 'No network in this test.' );
}, 10, 3 );

// ---- fixtures -----------------------------------------------------------------
$customize_before = get_option( 'tta_customize_settings' );
$service_before   = get_option( TTA_AtlasVoice_Service::OPTION, null );

$c = get_option( 'tta_customize_settings' );
if ( is_object( $c ) ) {
	$c->buttonSettings->id = 3;
} else {
	$c['buttonSettings']['id'] = 3;
}
update_option( 'tta_customize_settings', $c );
update_option( TTA_AtlasVoice_Service::OPTION, array_merge( (array) $service_before, array( 'consent' => true, 'api_key' => 'av_test_mock', 'key_prefix' => 'av_test', 'exhausted_until' => 0, 'pending_approval' => false ) ), false );
\TTA\TTA_Cache::flush();
wp_cache_flush();

$published = get_posts( array( 'post_status' => 'publish', 'post_type' => 'post', 'numberposts' => 1 ) );
if ( ! $published ) {
	exit( "Needs one published post.\n" );
}
$post  = $published[0];
$draft = wp_insert_post( array( 'post_title' => 'Player 3 checks draft', 'post_status' => 'draft', 'post_type' => 'post' ) );

wp_set_current_user( 0 ); // a visitor, as on the front end

// The finished file is recorded on the post. Each scenario starts with no
// stored audio; the post's real records are put back once, at the end.
$meta_keys   = array( 'tts_mp3_file_urls', 'tts_is_mp3_file_url_exists' );
$meta_before = array();
foreach ( $meta_keys as $key ) {
	$meta_before[ $key ] = metadata_exists( 'post', $post->ID, $key ) ? get_post_meta( $post->ID, $key, true ) : null;
}
$clear_meta   = function () use ( $post, $meta_keys ) {
	foreach ( $meta_keys as $key ) {
		delete_post_meta( $post->ID, $key );
	}
};
$restore_meta = function () use ( $post, $meta_keys, $meta_before ) {
	foreach ( $meta_keys as $key ) {
		null === $meta_before[ $key ] ? delete_post_meta( $post->ID, $key ) : update_post_meta( $post->ID, $key, $meta_before[ $key ] );
	}
};

$title = $post->ID . '__lang__en__player3test';
$dir   = trailingslashit( TTA_AtlasVoice_Service::audio_dir() . \TTA\TTA_Helper::get_post_date( $post ) );
$clean = function () use ( $dir, $title, $post, $clear_meta ) {
	$clear_meta();
	foreach ( (array) glob( $dir . $title . '*' ) as $file ) {
		wp_delete_file( $file );
	}
	for ( $n = 1; $n <= 9; $n++ ) {
		Part_Claim::release( $dir, $title . '-' . $n );
	}
	\TTA\TTA_Generation_Lock::release( $post->ID );
};
$batch = function ( $n, $last, $extra = array() ) use ( $post, $title ) {
	return array_merge( array(
		'post_id'       => $post->ID,
		'user_id'       => 'visitor-a',
		'title'         => $title,
		'temp_title'    => $title . '-' . $n,
		'content'       => 'Batch ' . $n . ' text.',
		'path'          => '../../evil',
		'is_last_batch' => $last,
		'settings'      => array( 'language' => 'en' ),
	), $extra );
};
$call = function ( array $body ) {
	$res = TTA_GTTS_Generation::handle( $body );

	return isset( $res['data']['message'] ) ? $res['data']['message'] : '';
};

try {
	check( 'player 3 is active', 3, (int) get_player_id() );

	// Text_Gate refusals: nothing reaches the service.
	$clean();
	check( 'traversal in title refused', 'invalid_title', $call( $batch( 1, false, array( 'title' => '../x', 'temp_title' => '../x-1' ) ) ) );
	check( 'title of another post refused', 'invalid_title', $call( $batch( 1, false, array( 'title' => 'zz-other-post', 'temp_title' => 'zz-other-post-1' ) ) ) );
	check( 'batch name not {title}-{n} refused', 'invalid_title', $call( $batch( 1, false, array( 'temp_title' => $title . '-x' ) ) ) );
	check( 'draft post refused for a visitor', 'invalid_post', $call( $batch( 1, false, array( 'post_id' => $draft, 'title' => $draft . '__lang__en', 'temp_title' => $draft . '__lang__en-1' ) ) ) );
	check( 'oversized batch refused', 'content_too_long', $call( $batch( 1, false, array( 'content' => str_repeat( 'a', Text_Gate::MAX_BATCH_CHARS + 1 ) ) ) ) );
	check( 'no service call for refused requests', 0, $service_calls );

	// Run not open: batch 2 without batch 1 is not made.
	$clean();
	check( 'batch 2 without batch 1 is not made', 'incomplete_audio', $call( $batch( 2, true ) ) );
	check( '… and the service is not called', 0, $service_calls );
	check( '… and no final file is written', false, file_exists( $dir . $title . '.mp3' ) );

	// Part_Claim: a batch another request is making answers "locked".
	$clean();
	check( 'claim taken for batch 1', true, Part_Claim::acquire( $dir, $title . '-1' ) );
	check( 'claimed batch answers locked', 'locked', $call( $batch( 1, false ) ) );
	check( '… without a service call', 0, $service_calls );
	Part_Claim::release( $dir, $title . '-1' );
	\TTA\TTA_Generation_Lock::release( $post->ID );

	// A complete run: folder comes from the post, batches joined in order, parts removed.
	$clean();
	check( 'batch 1 stored', 'batch_stored', $call( $batch( 1, false ) ) );
	check( 'batch 1 written under the post date folder (not the request path)', true, is_file( $dir . $title . '-1.mp3' ) );
	check( 'last batch completes', 'completed', $call( $batch( 2, true ) ) );
	check( 'final MP3 written', 800, file_exists( $dir . $title . '.mp3' ) ? filesize( $dir . $title . '.mp3' ) : 0 );
	check( 'batch parts removed after the join', array(), glob( $dir . $title . '-*' ) );
	check( 'service called once per batch', 2, $service_calls );
	check( 'nothing written outside the audio folder', false, file_exists( TTA_AtlasVoice_Service::audio_dir() . '../../evil' ) );

	// Already made: answered from disk, no new synthesis.
	check( 'existing final file is returned', '', $call( $batch( 1, false ) ) );
	check( '… without a service call', 2, $service_calls );

	// Missing middle batch: the join refuses and keeps batch 1 for the next run.
	$clean();
	$call( $batch( 1, false ) );
	check( 'join with batch 2 missing is refused', 'incomplete_audio', $call( $batch( 3, true ) ) );
	check( '… and writes no final file', false, file_exists( $dir . $title . '.mp3' ) );
	check( '… and keeps batch 1 for the next run', true, is_file( $dir . $title . '-1.mp3' ) );

	// A batch with nothing to say counts as present and adds no audio.
	$clean();
	$calls_before = $service_calls;
	$call( $batch( 1, false ) );
	check( 'a symbols-only batch is skipped', 'batch_skipped', $call( $batch( 2, false, array( 'content' => '[[nothing]]' ) ) ) );
	check( 'the skipped batch leaves a marker', true, is_file( $dir . $title . '-2' . Batch_Merger::SKIP_EXTENSION ) );
	check( 'the run still completes', 'completed', $call( $batch( 3, true ) ) );
	check( 'final MP3 is batches 1 and 3 only', 800, file_exists( $dir . $title . '.mp3' ) ? filesize( $dir . $title . '.mp3' ) : 0 );
	check( 'parts and markers removed after the join', array(), glob( $dir . $title . '-*' ) );
	check( 'service called for all three batches', 3, $service_calls - $calls_before );

	// Part_Claim unit: one winner, release, stale claims taken over.
	$clean();
	check( 'first claim wins', true, Part_Claim::acquire( $dir, $title . '-7' ) );
	check( 'second claim on the same batch loses', false, Part_Claim::acquire( $dir, $title . '-7' ) );
	Part_Claim::release( $dir, $title . '-7' );
	check( 'claim is free again after release', true, Part_Claim::acquire( $dir, $title . '-7' ) );
	global $wpdb;
	$wpdb->update( $wpdb->options, array( 'option_value' => (string) ( time() - Part_Claim::TTL - 5 ) ), array( 'option_name' => Part_Claim::option_name( $dir, $title . '-7' ) ) );
	check( 'stale claim is taken over', true, Part_Claim::acquire( $dir, $title . '-7' ) );
} finally {
	$clean();
	$restore_meta();
	wp_delete_post( $draft, true );
	update_option( 'tta_customize_settings', $customize_before );
	null === $service_before ? delete_option( TTA_AtlasVoice_Service::OPTION ) : update_option( TTA_AtlasVoice_Service::OPTION, $service_before, false );
	\TTA\TTA_Cache::flush();
	wp_cache_flush();
}

echo "\n{$passed} passed, {$failed} failed\n";
exit( $failed ? 1 : 0 );
