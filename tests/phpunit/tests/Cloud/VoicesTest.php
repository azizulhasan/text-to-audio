<?php
/**
 * Tests for the voices AtlasVoice Cloud offers (TTS-378): the service class,
 * its REST route and `wp atlasvoice cloud voices`.
 *
 * The service is stood in for; nothing leaves the test.
 *
 * @package TTA
 */

use TTA\CLI\Cloud_Command;
use TTA\Cloud\Cloud;
use TTA\Cloud\Voices;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Cloud\Voices
 * @covers \TTA_Api\Cloud_Voices_Controller
 * @covers \TTA\CLI\Cloud_Command
 */
class VoicesTest extends WP_UnitTestCase {

	/** @var array[] The requests that were made: url and headers. */
	private $calls = array();

	/** @var array|null Status and body of the next answer; null is "cannot be reached". */
	private $answer;

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		Cloud::reset();
		delete_option( Service::OPTION );
		$this->forget();
		$this->calls  = array();
		$this->answer = array( 200, $this->list() );
		add_filter( 'pre_http_request', array( $this, 'intercept' ), 10, 3 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'intercept' ), 10 );
		$this->forget();
		parent::tear_down();
	}

	/** Takes every kept list away. */
	private function forget() {
		global $wpdb;
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '\_transient\_" . Voices::CACHE . "%' OR option_name LIKE '\_transient\_timeout\_" . Voices::CACHE . "%'" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		wp_cache_flush();
	}

	public function intercept( $pre, $args, $url ) {
		$this->calls[] = array(
			'url'     => $url,
			'headers' => isset( $args['headers'] ) ? (array) $args['headers'] : array(),
		);

		if ( null === $this->answer ) {
			return new WP_Error( 'http_request_failed', 'Could not resolve host.' );
		}

		return array(
			'response' => array(
				'code'    => $this->answer[0],
				'message' => '',
			),
			'headers'  => new \WpOrg\Requests\Utility\CaseInsensitiveDictionary(
				array(
					'Content-Type' => 'application/json',
					'X-Request-Id' => 'req-0123456789',
				)
			),
			'body'     => wp_json_encode( $this->answer[1] ),
			'cookies'  => array(),
		);
	}

	private function list() {
		return array(
			'count'  => 2,
			'voices' => array(
				array(
					'id'     => 'gtts-en',
					'engine' => 'gtts',
					'lang'   => 'en',
					'name'   => 'English',
				),
				array(
					'id'     => 'gtts-en-uk',
					'engine' => 'gtts',
					'lang'   => 'en-uk',
					'name'   => 'English (United Kingdom)',
				),
			),
		);
	}

	private function rest( array $params = array() ) {
		$request = new WP_REST_Request( 'GET', '/tta/v1/cloud/voices' );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	// The service class.

	public function test_the_voices_are_what_the_service_lists() {
		$list = Voices::get();

		$this->assertSame( 'service', $list['source'] );
		$this->assertSame( 2, $list['count'] );
		$this->assertSame(
			array(
				'id'       => 'gtts-en-uk',
				'engine'   => 'gtts',
				'language' => 'en-uk',
				'name'     => 'English (United Kingdom)',
			),
			$list['voices'][1]
		);
		$this->assertSame( 'req-0123456789', $list['request_id'] );
		$this->assertSame( '', $list['error'] );
		$this->assertGreaterThan( 0, $list['fetched_at'] );
	}

	public function test_a_site_that_is_not_connected_can_read_them_and_no_key_is_sent() {
		Voices::get();

		$this->assertCount( 1, $this->calls );
		$this->assertStringEndsWith( '/v1/voices', $this->calls[0]['url'] );
		$this->assertArrayNotHasKey( 'Authorization', $this->calls[0]['headers'] );
	}

	public function test_a_connected_site_does_not_send_its_key_either() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value_0123456789',
			),
			false
		);
		Cloud::reset();

		Voices::get();

		$this->assertArrayNotHasKey( 'Authorization', $this->calls[0]['headers'] );
		$this->assertStringNotContainsString( 'av_live_secret', wp_json_encode( $this->calls ) );
	}

	public function test_the_language_and_the_engine_narrow_the_list() {
		$list = Voices::get( 'PT-BR', 'gtts' );

		$this->assertStringEndsWith( '/v1/voices?lang=pt-br&engine=gtts', $this->calls[0]['url'] );
		$this->assertSame( array( 'pt-br', 'gtts' ), array( $list['language'], $list['engine'] ) );
	}

	public function test_a_value_that_is_not_a_language_is_read_as_not_asked_for() {
		$list = Voices::get( 'en&engine=cloud', array( 'x' ) );

		$this->assertStringEndsWith( '/v1/voices', $this->calls[0]['url'] );
		$this->assertSame( array( '', '' ), array( $list['language'], $list['engine'] ) );
	}

	public function test_the_list_is_kept_so_a_screen_does_not_ask_on_every_load() {
		Voices::get( 'en' );
		Voices::get( 'en' );

		$this->assertCount( 1, $this->calls );
	}

	public function test_each_language_keeps_its_own_list() {
		Voices::get( 'en' );
		Voices::get( 'de' );
		Voices::get( 'en' );

		$this->assertCount( 2, $this->calls );
	}

	public function test_refresh_asks_the_service_again() {
		Voices::get( 'en' );
		Voices::get( 'en', '', true );

		$this->assertCount( 2, $this->calls );
	}

	public function test_nothing_in_the_answer_is_trusted() {
		$this->answer = array(
			200,
			array(
				'voices' => array(
					array(
						'id'     => '<script>alert(1)</script>gtts-en',
						'engine' => 'GTTS <b>',
						'lang'   => "en\n",
						'name'   => '<img src=x onerror=alert(1)>English',
					),
					array( 'engine' => 'gtts' ),
					'not a voice',
					array(
						'id'   => array( 'gtts-de' ),
						'name' => 'German',
					),
					array( 'id' => 'gtts-fr' ),
				),
			),
		);

		$list = Voices::get();

		$this->assertSame( 2, $list['count'], 'Only the entries with an id are kept.' );
		$this->assertStringNotContainsString( '<', wp_json_encode( $list['voices'] ) );
		$this->assertSame( 'gtts', $list['voices'][0]['engine'] );
		$this->assertSame( 'en', $list['voices'][0]['language'] );
		$this->assertSame(
			array(
				'id'       => 'gtts-fr',
				'engine'   => '',
				'language' => '',
				'name'     => 'gtts-fr',
			),
			$list['voices'][1],
			'A voice without a name is called by its id.'
		);
	}

	public function test_a_very_long_answer_is_cut_off() {
		$this->answer = array( 200, array( 'voices' => array_fill( 0, Voices::MAX_VOICES + 50, array( 'id' => 'v' ) ) ) );

		$this->assertSame( Voices::MAX_VOICES, Voices::get()['count'] );
	}

	/**
	 * @dataProvider answers_that_are_no_list
	 */
	public function test_an_answer_that_is_no_list_is_an_empty_list_that_says_so( $answer ) {
		$this->answer = $answer;

		$list = Voices::get();

		$this->assertSame( 'none', $list['source'] );
		$this->assertSame( array(), $list['voices'] );
		$this->assertSame( 0, $list['count'] );
	}

	public function answers_that_are_no_list() {
		return array(
			'the service cannot be reached' => array( null ),
			'the service is down'           => array( array( 503, array( 'error' => array( 'code' => 'service_unavailable' ) ) ) ),
			'no voices in the answer'       => array( array( 200, array( 'count' => 3 ) ) ),
			'voices that are not a list'    => array( array( 200, array( 'voices' => 'many' ) ) ),
		);
	}

	public function test_a_failure_says_why_and_is_kept_for_a_short_time_only() {
		$this->answer = array( 503, array( 'error' => array( 'code' => 'service_unavailable' ) ) );

		$list = Voices::get( 'en' );
		Voices::get( 'en' );

		$this->assertSame( 'service_unavailable', $list['error'] );
		$this->assertCount( 1, $this->calls, 'A screen that is reloaded does not ask again at once.' );
		$this->assertLessThan( Voices::CACHE_SECONDS, Voices::FAILURE_SECONDS );
	}

	public function test_reading_the_voices_changes_no_stored_setting() {
		update_option( 'tta_listening_settings', array( 'tta__listening_voice' => 'x' ) );
		$before = serialize( get_option( 'tta_listening_settings' ) );

		Voices::get( 'en' );

		$this->assertSame( $before, serialize( get_option( 'tta_listening_settings' ) ) );
		$this->assertFalse( get_option( Service::OPTION ) );
	}

	// The route.

	public function test_the_route_returns_the_voices() {
		$response = $this->rest( array( 'language' => 'en' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 2, $response->get_data()['count'] );
		$this->assertSame( 'en', $response->get_data()['language'] );
	}

	public function test_the_route_describes_itself_and_its_arguments() {
		$routes = rest_get_server()->get_routes()['/tta/v1/cloud/voices'];

		$this->assertCount( 1, $routes );
		$this->assertNotEmpty( $routes[0]['label'] );
		$this->assertNotEmpty( $routes[0]['description'] );
		foreach ( array( 'language', 'engine', 'refresh' ) as $name ) {
			$this->assertNotEmpty( $routes[0]['args'][ $name ]['description'], $name );
		}
		$this->assertSame( array( 'GET' => true ), $routes[0]['methods'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_the_route( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertSame( array(), $this->calls );
	}

	public function people_without_access() {
		return array(
			'a visitor'    => array( '' ),
			'a subscriber' => array( 'subscriber' ),
			'an editor'    => array( 'editor' ),
		);
	}

	// The command.

	public function test_the_command_can_print_json_for_scripts() {
		( new Cloud_Command() )->voices(
			array(),
			array(
				'language' => 'en',
				'format'   => 'json',
			)
		);

		$printed = json_decode( end( WP_CLI::$log )[1], true );

		$this->assertSame( 2, $printed['count'] );
		$this->assertSame( 'gtts-en', $printed['voices'][0]['id'] );
	}

	public function test_the_command_says_when_no_voice_matches() {
		$this->answer = array( 200, array( 'voices' => array() ) );

		( new Cloud_Command() )->voices( array(), array( 'language' => 'xx' ) );

		$this->assertSame( 'No voice matches.', end( WP_CLI::$log )[1] );
	}

	public function test_the_command_says_why_when_the_service_cannot_list_them() {
		$this->answer = null;

		try {
			( new Cloud_Command() )->voices( array(), array() );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'could not list its voices', WP_CLI::$log[0][1] );
	}
}
