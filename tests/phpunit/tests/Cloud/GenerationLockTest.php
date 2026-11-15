<?php
/**
 * Tests for the run that holds a post while its audio is made, and for what
 * a visitor who waits for that run is told (TTS-347: "part 9 of 14").
 *
 * @package TTA
 */

use TTA\TTA_AtlasVoice_Service as Service;
use TTA\TTA_Generation_Lock as Lock;
use TTA\TTA_GTTS_Generation as Generation;

/**
 * @covers \TTA\TTA_Generation_Lock
 * @covers \TTA\TTA_GTTS_Generation
 */
class GenerationLockTest extends WP_UnitTestCase {

	/** @var int */
	private $post_id;

	/** @var string[] Addresses a request would have gone to. */
	private $sent = array();

	public function set_up() {
		parent::set_up();
		$this->post_id = self::factory()->post->create( array( 'post_title' => 'A long post' ) );
		$this->sent    = array();
		add_filter( 'pre_http_request', array( $this, 'refuse' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'refuse' ), 10 );
		remove_all_filters( 'tts_get_player_id' );
		delete_option( Service::OPTION );
		Lock::release( $this->post_id );
		\TTA\TTA_Cache::flush();
		parent::tear_down();
	}

	public function refuse( $pre, $args, $url ) {
		$this->sent[] = $url;

		return new WP_Error( 'test_offline', 'No network in this test.' );
	}

	/** The site makes its audio with the natural voice and is connected. */
	private function natural_voice() {
		add_filter(
			'tts_get_player_id',
			static function () {
				return Service::PLAYER_ID;
			},
			9999
		);
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value_0123456789',
			),
			false
		);
	}

	private function batch( $visitor, $number, array $more = array() ) {
		return Generation::handle(
			$more + array(
				'post_id'    => $this->post_id,
				'user_id'    => $visitor,
				'title'      => 'a-long-post',
				'temp_title' => 'a-long-post-' . $number,
				'content'    => 'Some words to read aloud.',
				'settings'   => array( 'language' => 'en' ),
			)
		);
	}

	// ---- the lock, as it always was ---------------------------------------------

	public function test_one_run_holds_a_post_and_its_later_batches_pass() {
		$this->assertTrue( Lock::acquire( $this->post_id, 'first', 1 ) );
		$this->assertTrue( Lock::acquire( $this->post_id, 'first', 2 ) );
		$this->assertFalse( Lock::acquire( $this->post_id, 'second', 1 ) );
		$this->assertFalse( Lock::acquire( $this->post_id, 'first', 1 ), 'The holder\'s own second run waits too.' );

		Lock::release( $this->post_id );

		$this->assertTrue( Lock::acquire( $this->post_id, 'second', 1 ) );
	}

	public function test_a_caller_that_names_no_number_of_parts_works_as_before() {
		$this->assertTrue( Lock::acquire( $this->post_id, 'first', 1 ) );
		$this->assertNull( Lock::progress( $this->post_id ), 'Nothing to count: no part count is told.' );
	}

	// ---- how far the run is ------------------------------------------------------

	public function test_no_run_no_progress() {
		$this->assertNull( Lock::progress( $this->post_id ) );
	}

	public function test_the_lock_says_which_part_the_run_is_at() {
		Lock::acquire( $this->post_id, 'first', 1, 14 );
		$this->assertSame(
			array(
				'part'  => 1,
				'parts' => 14,
			),
			Lock::progress( $this->post_id )
		);

		Lock::acquire( $this->post_id, 'first', 9, 14 );
		$this->assertSame( 9, Lock::progress( $this->post_id )['part'] );
	}

	public function test_a_later_batch_that_names_no_number_keeps_the_one_the_run_began_with() {
		Lock::acquire( $this->post_id, 'first', 1, 14 );
		Lock::acquire( $this->post_id, 'first', 2 );

		$this->assertSame(
			array(
				'part'  => 2,
				'parts' => 14,
			),
			Lock::progress( $this->post_id )
		);
	}

	public function test_a_visitor_who_is_refused_does_not_change_what_the_run_says() {
		Lock::acquire( $this->post_id, 'first', 3, 14 );

		$this->assertFalse( Lock::acquire( $this->post_id, 'second', 1, 99 ) );
		$this->assertSame(
			array(
				'part'  => 3,
				'parts' => 14,
			),
			Lock::progress( $this->post_id )
		);
	}

	/**
	 * @dataProvider counts_that_say_nothing
	 */
	public function test_a_count_that_says_nothing_is_not_told( $part, $parts ) {
		Lock::acquire( $this->post_id, 'first', $part, $parts );

		$this->assertNull( Lock::progress( $this->post_id ) );
	}

	public function counts_that_say_nothing() {
		return array(
			'one part'                 => array( 1, 1 ),
			'no count'                 => array( 3, 0 ),
			'a part past the last one' => array( 6, 5 ),
		);
	}

	public function test_a_number_of_parts_nobody_would_believe_is_cut_off() {
		Lock::acquire( $this->post_id, 'first', 1, 5000000 );

		$this->assertSame( Lock::MAX_PARTS, Lock::progress( $this->post_id )['parts'] );
	}

	public function test_a_run_that_stopped_moving_is_not_told_as_progress() {
		Lock::acquire( $this->post_id, 'first', 3, 14 );
		$lock            = get_transient( Lock::key( $this->post_id ) );
		$lock['touched'] = time() - Lock::STALE_SECONDS - 1;
		set_transient( Lock::key( $this->post_id ), $lock, 5 * MINUTE_IN_SECONDS );

		$this->assertNull( Lock::progress( $this->post_id ) );
	}

	public function test_a_lock_stored_by_an_older_version_has_no_progress() {
		set_transient(
			Lock::key( $this->post_id ),
			array(
				'user_id' => 'first',
				'post_id' => $this->post_id,
				'touched' => time(),
			),
			5 * MINUTE_IN_SECONDS
		);

		$this->assertNull( Lock::progress( $this->post_id ) );
		$this->assertFalse( Lock::acquire( $this->post_id, 'second', 1, 4 ), 'It still holds the post.' );
		$this->assertTrue( Lock::acquire( $this->post_id, 'first', 2, 4 ), 'And its holder goes on, now counted.' );
		$this->assertSame( 2, Lock::progress( $this->post_id )['part'] );
	}

	public function test_a_finished_run_has_no_progress() {
		Lock::acquire( $this->post_id, 'first', 3, 14 );
		Lock::release( $this->post_id );

		$this->assertNull( Lock::progress( $this->post_id ) );
	}

	// ---- what the visitor who waits is answered ---------------------------------

	public function test_a_visitor_who_waits_is_told_which_part_the_other_run_is_at() {
		$this->natural_voice();
		Lock::acquire( $this->post_id, 'first', 9, 14 );

		$answer = $this->batch( 'second', 1, array( 'total_parts' => 14 ) );

		$this->assertTrue( $answer['status'] );
		$this->assertSame(
			array(
				'url'                 => '',
				'message'             => 'locked',
				'file_already_exists' => false,
				'part'                => 9,
				'parts'               => 14,
			),
			$answer['data']
		);
		$this->assertSame( array(), $this->sent, 'Waiting costs nothing: the service is not asked.' );
	}

	public function test_without_a_count_the_answer_is_the_one_older_players_know() {
		$this->natural_voice();
		Lock::acquire( $this->post_id, 'first', 3 );

		$this->assertSame(
			array(
				'url'                 => '',
				'message'             => 'locked',
				'file_already_exists' => false,
			),
			$this->batch( 'second', 1 )['data']
		);
	}

	public function test_the_run_tells_the_lock_how_many_parts_it_has() {
		$this->natural_voice();

		// The service cannot be reached in this test; the batch still took the lock first.
		$this->batch( 'first', 1, array( 'total_parts' => 6 ) );
		Lock::acquire( $this->post_id, 'first', 2, 6 );

		$answer = $this->batch( 'second', 1, array( 'total_parts' => 6 ) );

		$this->assertSame( 'locked', $answer['data']['message'] );
		$this->assertSame( array( 2, 6 ), array( $answer['data']['part'], $answer['data']['parts'] ) );
	}

	public function test_the_route_describes_the_number_of_parts() {
		global $wp_rest_server;
		$wp_rest_server = null;
		$routes         = rest_get_server()->get_routes()['/tta/v1/gtts'];
		$args           = array();
		foreach ( $routes as $route ) {
			$args += (array) $route['args'];
		}

		$this->assertArrayHasKey( 'total_parts', $args );
		$this->assertNotEmpty( $args['total_parts']['description'] );
	}
}
