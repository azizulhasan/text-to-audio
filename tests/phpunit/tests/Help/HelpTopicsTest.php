<?php
/**
 * Unit tests for TTA\Help\Help_Topics (TTS-347).
 *
 * @package TTA
 */

use TTA\Help\Help_Topics;

/**
 * @covers \TTA\Help\Help_Topics
 */
class HelpTopicsTest extends WP_UnitTestCase {

	/**
	 * Topics in the approved mockup (atlasvoice-help-topics.js).
	 */
	const TOPIC_COUNT = 39;

	public function test_has_every_topic_of_the_mockup() {
		$this->assertCount( self::TOPIC_COUNT, Help_Topics::all() );
	}

	public function test_every_topic_has_the_same_shape() {
		foreach ( Help_Topics::all() as $key => $topic ) {
			$this->assertSame( array( 'title', 'steps', 'docUrl', 'videoUrl', 'videoLength', 'pro' ), array_keys( $topic ), $key );
			$this->assertNotSame( '', $topic['title'], $key );
			$this->assertIsArray( $topic['steps'], $key );
			// Every topic in the mockup has exactly three steps; allow up to five.
			$this->assertGreaterThanOrEqual( 3, count( $topic['steps'] ), $key );
			$this->assertLessThanOrEqual( 5, count( $topic['steps'] ), $key );
			foreach ( $topic['steps'] as $step ) {
				$this->assertNotSame( '', $step, $key );
			}
			$this->assertStringStartsWith( Help_Topics::DOCS_BASE, $topic['docUrl'], $key );
			$this->assertStringEndsWith( '/', $topic['docUrl'], $key );
			$this->assertSame( '', $topic['videoUrl'], $key );
			$this->assertMatchesRegularExpression( '/^\d+:\d{2}$/', $topic['videoLength'], $key );
			$this->assertIsBool( $topic['pro'], $key );
		}
	}

	public function test_every_key_is_a_valid_route_id() {
		foreach ( array_keys( Help_Topics::all() ) as $key ) {
			$this->assertMatchesRegularExpression( '/^[a-z-]+(:[a-z0-9-]+)?(#[a-z0-9-]+)?$/', (string) $key );
		}
	}

	public function test_for_route_exact_match() {
		$topic = Help_Topics::for_route( 'voice:providers#gcs' );

		$this->assertSame( 'voice:providers#gcs', $topic['key'] );
		$this->assertSame( 'voice-cloud-storage', basename( rtrim( $topic['docUrl'], '/' ) ) );
	}

	public function test_for_route_unknown_section_falls_back_to_its_tab() {
		$this->assertSame( 'voice:pronunciation', Help_Topics::for_route( 'voice:pronunciation#nope' )['key'] );
	}

	public function test_for_route_unknown_tab_falls_back_to_its_screen() {
		$this->assertSame( 'library', Help_Topics::for_route( 'library:nope' )['key'] );
	}

	public function test_for_route_screen_without_its_own_topic_uses_its_first_tab() {
		// "voice" and "player" are only tabs, so their first tab is the answer, not Home.
		$this->assertSame( 'voice:voice', Help_Topics::for_route( 'voice:nope' )['key'] );
		$this->assertSame( 'voice:voice', Help_Topics::for_route( 'voice' )['key'] );
		$this->assertSame( 'player:look', Help_Topics::for_route( 'player' )['key'] );
	}

	public function test_for_route_unknown_route_returns_first_topic() {
		$topic = Help_Topics::for_route( 'nothing-here' );

		$this->assertSame( 'overview', $topic['key'] );
		$this->assertArrayHasKey( 'key', Help_Topics::for_route( '' ) );
	}

	public function test_filter_can_add_a_topic_and_change_a_url() {
		$callback = function ( $topics ) {
			$topics['custom']['title']      = 'Custom';
			$topics['overview']['videoUrl'] = 'https://example.com/video';
			return $topics;
		};
		add_filter( 'atlasvoice_help_topics', $callback );

		$topics = Help_Topics::all();
		$this->assertArrayHasKey( 'custom', $topics );
		$this->assertSame( 'https://example.com/video', Help_Topics::for_route( 'overview' )['videoUrl'] );
		$this->assertSame( 'Custom', Help_Topics::for_route( 'custom' )['title'] );

		remove_filter( 'atlasvoice_help_topics', $callback );
		$this->assertArrayNotHasKey( 'custom', Help_Topics::all() );
	}
}
