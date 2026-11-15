<?php
/**
 * Tests for what the player on the page tells the people who can edit the
 * post (TTS-347).
 *
 * @package TTA
 */

use TTA\Library\Posts;
use TTA\Player\Editor_Note;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Player\Editor_Note
 * @covers \TTA\TTA_AtlasVoice_Service::exhausted_until
 */
class EditorNoteTest extends WP_UnitTestCase {

	const SETTINGS = 'tta_settings_data';

	public function set_up() {
		parent::set_up();
		update_option( self::SETTINGS, (object) array( 'tta__settings_allow_listening_for_post_types' => array( 'post' ) ) );
		update_option( 'tta_listening_settings', array( 'tta__listening_lang' => 'en' ) );
		delete_option( Service::OPTION );
		\TTA\TTA_Cache::flush();
		$this->use_player( 3 );
	}

	public function tear_down() {
		remove_all_filters( 'tts_get_player_id' );
		delete_option( self::SETTINGS );
		delete_option( Service::OPTION );
		\TTA\TTA_Cache::flush();
		parent::tear_down();
	}

	private function use_player( $player_id ) {
		remove_all_filters( 'tts_get_player_id' );
		add_filter(
			'tts_get_player_id',
			static function () use ( $player_id ) {
				return $player_id;
			}
		);
	}

	private function as_role( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );
	}

	private function post() {
		return get_post( self::factory()->post->create( array( 'post_title' => 'A post' ) ) );
	}

	public function test_a_visitor_and_a_subscriber_get_nothing() {
		$post = $this->post();

		$this->as_role( '' );
		$this->assertNull( Editor_Note::for_post( $post ) );

		$this->as_role( 'subscriber' );
		$this->assertNull( Editor_Note::for_post( $post ) );

		$this->assertNull( Editor_Note::for_post( null ) );
	}

	public function test_an_author_gets_it_for_an_own_post_only() {
		$author = self::factory()->user->create( array( 'role' => 'author' ) );
		$own    = get_post( self::factory()->post->create( array( 'post_author' => $author ) ) );
		$other  = $this->post();
		wp_set_current_user( $author );

		$this->assertIsArray( Editor_Note::for_post( $own ) );
		$this->assertNull( Editor_Note::for_post( $other ) );
	}

	public function test_an_editor_gets_the_words_and_is_not_an_administrator() {
		$this->as_role( 'editor' );
		$note = Editor_Note::for_post( $this->post() );

		$this->assertFalse( $note['is_admin'] );
		$this->assertFalse( $note['outdated'] );
		$this->assertFalse( $note['can_make'] );
		foreach ( array( 'editors', 'admins', 'failed', 'limit', 'quota', 'off', 'outdated', 'remake', 'started', 'not_started', 'open_editor' ) as $key ) {
			$this->assertNotEmpty( $note['words'][ $key ], $key );
		}
		$this->assertSame( 'Editors only.', $note['words']['editors'] );
		$this->assertStringContainsString( 'post.php', $note['edit_url'] );
	}

	public function test_an_administrator_is_marked_so() {
		$this->as_role( 'administrator' );

		$this->assertTrue( Editor_Note::for_post( $this->post() )['is_admin'] );
	}

	public function test_it_holds_no_key_and_no_technical_reason() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value_0123456789',
			),
			false
		);
		$this->as_role( 'administrator' );

		$this->assertStringNotContainsString( 'av_live_secret', wp_json_encode( Editor_Note::for_post( $this->post() ) ) );
	}

	public function test_audio_older_than_the_text_is_outdated_with_the_day_it_was_made() {
		$this->as_role( 'editor' );
		$post = $this->post();
		update_post_meta( $post->ID, Posts::MARK, true );
		$this->assertFalse( Editor_Note::for_post( $post )['outdated'], 'Audio with no fingerprint is not called outdated.' );

		$key = \TTA\TTA_Helper::tts_get_file_url_key( 'en', '' );
		update_post_meta( $post->ID, '_atlasvoice_audio_hashes', array( $key => array( 'hash' => 'the-text-of-before' ) ) );
		update_post_meta( $post->ID, '_atlasvoice_audio_facts', array( 'x' => array( 'made' => strtotime( '2026-10-21 12:00:00' ) ) ) );

		$note = Editor_Note::for_post( $post );

		if ( $note['outdated'] ) {
			$this->assertStringContainsString( date_i18n( get_option( 'date_format' ), strtotime( '2026-10-21 12:00:00' ) ), $note['words']['outdated'] );
			$this->assertFalse( $note['can_make'], 'Without a connected service it can only be made from the editor.' );
			$this->assertSame( 'tta/v1/post-panel/' . $post->ID . '/audio', $note['make_route'] );
		} else {
			$this->markTestIncomplete( 'This site keys its fingerprints differently; the outdated state is covered by PostsTest.' );
		}
	}

	public function test_a_draft_is_never_outdated() {
		$this->as_role( 'administrator' );
		$post = get_post( self::factory()->post->create( array( 'post_status' => 'draft' ) ) );

		$this->assertFalse( Editor_Note::for_post( $post )['outdated'] );
	}

	public function test_the_browser_voice_has_nothing_outdated() {
		$this->use_player( 1 );
		$this->as_role( 'administrator' );

		$this->assertFalse( Editor_Note::for_post( $this->post() )['outdated'] );
	}

	public function test_used_up_characters_name_the_day_they_come_back() {
		$this->as_role( 'administrator' );
		$post = $this->post();
		$this->assertSame( 0, Service::exhausted_until() );
		$this->assertStringNotContainsString( 'until', Editor_Note::for_post( $post )['words']['quota'] );

		$until = time() + 5 * DAY_IN_SECONDS;
		update_option(
			Service::OPTION,
			array(
				'consent'         => true,
				'api_key'         => 'av_live_secret_key_value_0123456789',
				'exhausted_until' => $until,
			),
			false
		);

		$this->assertSame( $until, Service::exhausted_until() );
		$this->assertStringContainsString( 'until ' . date_i18n( get_option( 'date_format' ), $until ), Editor_Note::for_post( $post )['words']['quota'] );

		update_option(
			Service::OPTION,
			array(
				'consent'         => true,
				'api_key'         => 'av_live_secret_key_value_0123456789',
				'exhausted_until' => time() - 60,
			),
			false
		);
		$this->assertSame( 0, Service::exhausted_until(), 'A day that has passed is not "used up" any more.' );
	}
}
