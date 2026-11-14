<?php
/**
 * Tests for the privacy facts and the usage-sharing choice: the service
 * class, its REST routes and `wp atlasvoice privacy` (TTS-347).
 *
 * No test here lets a request leave the machine: every HTTP request is
 * answered by the test and counted.
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Privacy_Command;
use TTA\Site\Privacy;

/**
 * @covers \TTA\Site\Privacy
 * @covers \TTA_Api\Privacy_Controller
 * @covers \TTA\CLI\Privacy_Command
 */
class PrivacyTest extends WP_UnitTestCase {

	const OPTION = 'text-to-audio_allow_tracking';

	/**
	 * Addresses the plugin tried to reach.
	 *
	 * @var string[]
	 */
	private $requests = array();

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( self::OPTION );
		delete_option( 'text-to-audio_tracking_last_send' );
		$this->requests = array();
		add_filter( 'pre_http_request', array( $this, 'answer_request' ), 10, 3 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer_request' ), 10 );
		wp_clear_scheduled_hook( 'text-to-audio_tracker_send_event' );
		parent::tear_down();
	}

	/**
	 * Answers every HTTP request, so nothing is sent from a test.
	 */
	public function answer_request( $pre, $args, $url ) {
		$this->requests[] = (string) $url;

		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'headers'  => array(),
			'cookies'  => array(),
			'body'     => '{}',
		);
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/privacy' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	private function tracker_requests() {
		return array_values(
			array_filter(
				$this->requests,
				static function ( $url ) {
					return false !== strpos( $url, 'atlasaidev' );
				}
			)
		);
	}

	// Reading.

	public function test_it_says_where_the_policy_text_and_the_personal_data_tools_are() {
		$privacy = Privacy::get();

		$this->assertStringEndsWith( '/wp-admin/options-privacy.php?tab=policyguide', $privacy['policy_url'] );
		$this->assertStringEndsWith( '/wp-admin/export-personal-data.php', $privacy['export_url'] );
		$this->assertStringEndsWith( '/wp-admin/erase-personal-data.php', $privacy['erase_url'] );
	}

	public function test_the_plugin_registers_what_those_tools_and_the_guide_show() {
		$this->assertArrayHasKey( 'atlasvoice', apply_filters( 'wp_privacy_personal_data_exporters', array() ) );
		$this->assertArrayHasKey( 'atlasvoice', apply_filters( 'wp_privacy_personal_data_erasers', array() ) );
	}

	public function test_it_counts_the_listening_records() {
		global $wpdb;
		$table = $wpdb->prefix . Privacy::ANALYTICS_TABLE;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- a table of the test database.
		$exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $table ) ) ) === $table;

		$this->assertIsInt( Privacy::get()['listening_records'] );
		if ( ! $exists ) {
			$this->assertSame( 0, Privacy::get()['listening_records'] );
		}
	}

	public function test_a_new_site_shares_nothing() {
		$sharing = Privacy::get()['usage_sharing'];

		$this->assertTrue( $sharing['managed_here'] );
		$this->assertFalse( $sharing['allowed'] );
	}

	public function test_reading_sends_nothing() {
		Privacy::get();
		$this->rest();

		$this->assertSame( array(), $this->requests );
	}

	public function test_it_reads_the_choice_made_in_the_install_notice() {
		update_option( self::OPTION, 'yes', false );

		$this->assertTrue( Privacy::get()['usage_sharing']['allowed'] );
	}

	// Changing the choice.

	public function test_turning_it_on_stores_yes_and_schedules_the_weekly_report() {
		$saved = Privacy::save( array( 'usage_sharing' => true ) );

		$this->assertTrue( $saved['usage_sharing']['allowed'] );
		$this->assertSame( 'yes', get_option( self::OPTION ) );
		$this->assertNotFalse( wp_next_scheduled( 'text-to-audio_tracker_send_event' ) );
	}

	public function test_turning_it_off_stores_no_and_stops_the_weekly_report() {
		Privacy::save( array( 'usage_sharing' => true ) );
		$this->requests = array();

		$saved = Privacy::save( array( 'usage_sharing' => 'off' ) );

		$this->assertFalse( $saved['usage_sharing']['allowed'] );
		$this->assertSame( 'no', get_option( self::OPTION ) );
		$this->assertFalse( wp_next_scheduled( 'text-to-audio_tracker_send_event' ) );
		$this->assertSame( array(), $this->tracker_requests() );
	}

	public function test_saving_the_choice_it_already_has_sends_nothing_again() {
		Privacy::save( array( 'usage_sharing' => true ) );
		$this->requests = array();

		Privacy::save( array( 'usage_sharing' => true ) );

		$this->assertSame( array(), $this->tracker_requests() );
	}

	public function test_off_stays_off_without_any_request() {
		Privacy::save( array( 'usage_sharing' => false ) );

		$this->assertSame( array(), $this->requests );
		$this->assertFalse( Privacy::get()['usage_sharing']['allowed'] );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_changes_nothing( array $fields, $status ) {
		$result = Privacy::save( $fields );

		$this->assertWPError( $result );
		$this->assertSame( $status, $result->get_error_data()['status'] );
		$this->assertFalse( get_option( self::OPTION ) );
		$this->assertSame( array(), $this->requests );
	}

	public function wrong_values() {
		return array(
			'a word'             => array( array( 'usage_sharing' => 'maybe' ), 400 ),
			'a list'             => array( array( 'usage_sharing' => array( true ) ), 400 ),
			'nothing'            => array( array(), 400 ),
			'an unknown setting' => array( array( 'clear_statistics' => true ), 400 ),
			'two settings'       => array(
				array(
					'usage_sharing'     => true,
					'listening_records' => 0,
				),
				400,
			),
		);
	}

	// The REST routes.

	public function test_get_returns_the_facts() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Privacy::get(), $response->get_data() );
	}

	public function test_post_changes_the_choice() {
		$response = $this->rest( 'POST', array( 'usage_sharing' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['usage_sharing']['allowed'] );

		$response = $this->rest( 'POST', array( 'usage_sharing' => false ) );

		$this->assertFalse( $response->get_data()['usage_sharing']['allowed'] );
		$this->assertSame( 'no', get_option( self::OPTION ) );
	}

	public function test_post_refuses_a_value_that_is_not_on_or_off() {
		$this->assertSame( 400, $this->rest( 'POST', array( 'usage_sharing' => 'maybe' ) )->get_status() );
		$this->assertFalse( get_option( self::OPTION ) );
	}

	public function test_each_method_describes_itself_and_what_is_shared() {
		$routes = rest_get_server()->get_routes()['/tta/v1/privacy'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertStringContainsString( 'no post content, no visitor data', $routes[1]['description'] );
		$this->assertSame( 'boolean', $routes[1]['args']['usage_sharing']['type'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_it( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'usage_sharing' => true ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( self::OPTION ) );
		$this->assertSame( array(), $this->requests );
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

		$this->assertSame( Privacy_Command::class, WP_CLI::$commands['atlasvoice privacy'] );
	}

	public function test_get_prints_the_facts() {
		( new Privacy_Command() )->get( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'usage sharing: off', $lines );
		$this->assertCount( 3, $lines );
	}

	public function test_get_can_print_json_for_scripts() {
		( new Privacy_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Privacy::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_the_command_turns_sharing_off_and_on() {
		( new Privacy_Command() )->usage_sharing( array( 'on' ), array() );
		$this->assertSame( array( 'success', 'Usage sharing is on. A report is sent weekly.' ), end( WP_CLI::$log ) );

		( new Privacy_Command() )->usage_sharing( array( 'off' ), array() );
		$this->assertSame( array( 'success', 'Usage sharing is off. Nothing more is sent.' ), end( WP_CLI::$log ) );
		$this->assertSame( 'no', get_option( self::OPTION ) );
	}

	public function test_the_command_says_why_it_was_refused() {
		try {
			( new Privacy_Command() )->usage_sharing( array(), array() );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'on or off', WP_CLI::$log[0][1] );
	}
}
