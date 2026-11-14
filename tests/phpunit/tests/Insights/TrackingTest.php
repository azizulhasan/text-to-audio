<?php
/**
 * Tests for the tracking settings: the service class, its REST routes and
 * `wp atlasvoice tracking` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Tracking_Command;
use TTA\Insights\Tracking;

/**
 * @covers \TTA\Insights\Tracking
 * @covers \TTA_Api\Tracking_Controller
 * @covers \TTA\CLI\Tracking_Command
 */
class TrackingTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Tracking::OPTION );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	private function stored() {
		return json_decode( wp_json_encode( get_option( Tracking::OPTION ) ), true );
	}

	/**
	 * What the classic Analytics screen stores.
	 */
	private function classic( array $settings = array() ) {
		update_option(
			Tracking::OPTION,
			(object) array_replace(
				array(
					'tts_enable_analytics'   => true,
					'tts_trackable_post_ids' => array( 'all' ),
					'some_other_field'       => 'kept',
				),
				$settings
			),
			false
		);
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/tracking' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Reading.

	public function test_a_site_that_never_saved_counts_nothing() {
		$this->assertSame(
			array(
				'count_plays'       => false,
				'listener_location' => false,
				'posts'             => array(),
			),
			Tracking::get()
		);
	}

	public function test_it_reads_what_the_classic_screen_saved() {
		$this->classic(
			array(
				'tts_show_listener_location' => true,
				// The classic screen stores post numbers as text.
				'tts_trackable_post_ids'     => array( '12', '128', '12', '' ),
			)
		);

		$tracking = Tracking::get();

		$this->assertTrue( $tracking['count_plays'] );
		$this->assertTrue( $tracking['listener_location'] );
		$this->assertSame( array( 12, 128 ), $tracking['posts'] );
	}

	public function test_all_with_other_posts_reads_as_all() {
		$this->classic( array( 'tts_trackable_post_ids' => array( '12', 'all' ) ) );

		$this->assertSame( array( 'all' ), Tracking::get()['posts'] );
	}

	public function test_the_location_lookup_is_off_unless_the_owner_turned_it_on() {
		$this->classic();

		$this->assertFalse( Tracking::get()['listener_location'] );
	}

	// Saving.

	public function test_a_save_writes_the_fields_the_classic_screen_reads() {
		$this->classic();

		$saved = Tracking::save(
			array(
				'count_plays' => false,
				'posts'       => array( 12, '128', 12 ),
			)
		);

		$stored = $this->stored();
		$this->assertFalse( $stored['tts_enable_analytics'] );
		$this->assertSame( array( '12', '128' ), $stored['tts_trackable_post_ids'] );
		$this->assertSame( array( 12, 128 ), $saved['posts'] );
	}

	public function test_a_save_keeps_every_other_stored_setting_and_the_shape() {
		$this->classic();
		$before = $this->stored();

		Tracking::save( array( 'listener_location' => true ) );

		$before['tts_show_listener_location'] = true;
		$this->assertSame( $before, $this->stored() );
		$this->assertIsObject( get_option( Tracking::OPTION ) );
	}

	public function test_the_location_lookup_follows_the_switch_that_was_saved() {
		$this->classic();
		$enabled = new ReflectionMethod( \TTA_Api\AtlasVoice_Analytics::class, 'is_geolocation_enabled' );
		$enabled->setAccessible( true );

		$this->assertFalse( $enabled->invoke( null ) );

		Tracking::save( array( 'listener_location' => true ) );
		$this->assertTrue( $enabled->invoke( null ) );

		Tracking::save( array( 'listener_location' => 'off' ) );
		$this->assertFalse( $enabled->invoke( null ) );
	}

	public function test_all_with_other_posts_is_stored_as_all() {
		$saved = Tracking::save( array( 'posts' => array( 12, 'all', 128 ) ) );

		$this->assertSame( array( 'all' ), $saved['posts'] );
		$this->assertSame( array( 'all' ), $this->stored()['tts_trackable_post_ids'] );
	}

	public function test_posts_can_be_given_as_text_separated_by_commas() {
		$this->assertSame( array( 12, 128 ), Tracking::save( array( 'posts' => '12, 128' ) )['posts'] );
		$this->assertSame( array( 'all' ), Tracking::save( array( 'posts' => 'all' ) )['posts'] );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		$this->classic();
		$before = $this->stored();

		$result = Tracking::save(
			array(
				'count_plays' => false,
				$field        => $value,
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( sanitize_key( $field ), $result->get_error_data()['field'] );
		$this->assertSame( $before, $this->stored() );
	}

	public function wrong_values() {
		return array(
			'a switch as a word'  => array( 'listener_location', 'maybe' ),
			'a switch as a list'  => array( 'count_plays', array( true ) ),
			'no post at all'      => array( 'posts', array() ),
			'a post by its title' => array( 'posts', array( 'About us' ) ),
			'post zero'           => array( 'posts', array( 0 ) ),
			'a negative post'     => array( 'posts', array( -3 ) ),
			'a post as a list'    => array( 'posts', array( array( 12 ) ) ),
			'too many posts'      => array( 'posts', range( 1, 1001 ) ),
			'posts as a number'   => array( 'posts', 12 ),
			'an unknown setting'  => array( 'tts_enable_analytics', true ),
		);
	}

	public function test_an_empty_save_is_refused() {
		$result = Tracking::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// The REST routes.

	public function test_get_returns_the_settings() {
		$this->classic();

		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Tracking::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent_and_can_turn_counting_off() {
		$this->classic();

		$response = $this->rest( 'POST', array( 'count_plays' => false ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['count_plays'] );
		$this->assertSame( array( 'all' ), $response->get_data()['posts'] );
	}

	public function test_post_takes_all_or_post_numbers() {
		$this->classic();

		$this->assertSame( array( 12, 128 ), $this->rest( 'POST', array( 'posts' => array( 12, 128 ) ) )->get_data()['posts'] );
		$this->assertSame( array( 'all' ), $this->rest( 'POST', array( 'posts' => array( 'all' ) ) )->get_data()['posts'] );
		$this->assertSame( 400, $this->rest( 'POST', array( 'posts' => array( 'About us' ) ) )->get_status() );
	}

	public function test_each_method_describes_itself_and_what_the_lookup_sends() {
		$routes = rest_get_server()->get_routes()['/tta/v1/tracking'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertStringContainsString( 'visitor IP addresses', $routes[1]['description'] );
		$this->assertSame( array_keys( Tracking::FIELDS ), array_keys( $routes[1]['args'] ) );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_it( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'listener_location' => true ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Tracking::OPTION ) );
	}

	public function people_without_access() {
		return array(
			'a visitor'    => array( '' ),
			'a subscriber' => array( 'subscriber' ),
			'an editor'    => array( 'editor' ),
		);
	}

	// The command.

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Tracking_Command::class, WP_CLI::$commands['atlasvoice tracking'] );
	}

	public function test_get_prints_the_settings() {
		$this->classic();

		( new Tracking_Command() )->get( array(), array() );

		$this->assertSame(
			array( 'count plays: on', 'listener location: off', 'posts: all' ),
			wp_list_pluck( WP_CLI::$log, 1 )
		);
	}

	public function test_get_can_print_json_for_scripts() {
		( new Tracking_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Tracking::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_set_saves_what_was_given() {
		$this->classic();

		( new Tracking_Command() )->set(
			array(),
			array(
				'count-plays' => 'off',
				'posts'       => '12,128',
			)
		);

		$this->assertSame( array( 'success', 'Tracking saved.' ), end( WP_CLI::$log ) );
		$this->assertFalse( Tracking::get()['count_plays'] );
		$this->assertSame( array( 12, 128 ), Tracking::get()['posts'] );
	}

	public function test_set_says_which_value_was_refused_and_why() {
		try {
			( new Tracking_Command() )->set( array(), array( 'posts' => 'About us' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'posts: A post is given by its number', WP_CLI::$log[0][1] );
	}
}
