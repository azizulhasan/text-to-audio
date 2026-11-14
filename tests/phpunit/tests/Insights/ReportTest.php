<?php
/**
 * Tests for the listening numbers: the service class, its REST route and
 * `wp atlasvoice insights` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Insights_Command;
use TTA\Insights\Report;
use TTA\Insights\Tracking;

/**
 * @covers \TTA\Insights\Report
 * @covers \TTA_Api\Report_Controller
 * @covers \TTA\CLI\Insights_Command
 */
class ReportTest extends WP_UnitTestCase {

	/**
	 * The table is made once, before the tests run inside their transactions.
	 */
	public static function wpSetUpBeforeClass() {
		global $wpdb;

		// Only ever in the test database.
		if ( false === strpos( DB_NAME, 'test' ) ) {
			throw new RuntimeException( 'These tests write to the analytics table and must run in a test database.' );
		}

		\TTA\TTA_Activator::create_analytics_table_if_not_exists();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared -- the test database, the prefix plus a constant.
		$wpdb->query( 'DELETE FROM ' . $wpdb->prefix . Report::TABLE );
	}

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Tracking::OPTION );
		remove_all_filters( 'tts_analytics_response' );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'tts_analytics_response' );
		\TTA\TTA_Cache::flush();
		parent::tear_down();
	}

	/**
	 * One listener's record for one post, as the player writes it.
	 */
	private function record( $listener, $post_id, array $counts, $days_ago = 1 ) {
		global $wpdb;

		$analytics = array();
		foreach ( $counts as $event => $count ) {
			$analytics[ $event ] = array(
				'count'     => $count,
				'timestamp' => gmdate( 'Y-m-d\T14:00:00.000\Z', time() - $days_ago * DAY_IN_SECONDS ),
			);
		}
		$when = gmdate( 'Y-m-d H:i:s', time() - $days_ago * DAY_IN_SECONDS );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- a row of the test database.
		$wpdb->insert(
			$wpdb->prefix . Report::TABLE,
			array(
				'user_id'    => $listener,
				'post_id'    => $post_id,
				'analytics'  => maybe_serialize( $analytics ),
				'created_at' => $when,
				'updated_at' => $when,
			),
			// Without this, WordPress stores a column named user_id as a number.
			array( '%s', '%d', '%s', '%s', '%s' )
		);
	}

	private function rest( array $query = array() ) {
		$request = new WP_REST_Request( 'GET', '/tta/v1/report' );
		$request->set_query_params( $query );

		return rest_get_server()->dispatch( $request );
	}

	// The numbers.

	public function test_a_site_without_plays_has_zeros_and_empty_lists() {
		$report = Report::get( '30' );

		$this->assertSame( 0, $report['totals']['plays'] );
		$this->assertSame( 0, $report['totals']['listeners'] );
		$this->assertSame( array(), $report['posts'] );
		$this->assertSame( array_fill( 0, 24, 0 ), $report['hours'] );
		$this->assertSame( array(), $report['breakdowns'] );
	}

	public function test_it_adds_up_plays_time_and_finished_plays() {
		$first  = self::factory()->post->create( array( 'post_title' => 'The old mill' ) );
		$second = self::factory()->post->create( array( 'post_title' => 'Spring <b>recipes</b>' ) );
		$this->record(
			'listener-a',
			$first,
			array(
				'play' => 3,
				'time' => 240,
				'end'  => 2,
			)
		);
		$this->record(
			'listener-b',
			$first,
			array(
				'play'       => 1,
				'time'       => 60,
				'50_percent' => 1,
			)
		);
		$this->record(
			'listener-a',
			$second,
			array(
				'play'     => 1,
				'time'     => 30,
				'download' => 1,
			)
		);

		$report = Report::get( '30' );

		$this->assertSame( 5, $report['totals']['plays'] );
		$this->assertSame( 330, $report['totals']['seconds'] );
		$this->assertSame( 2, $report['totals']['finished'] );
		$this->assertSame( 1, $report['totals']['downloads'] );
		$this->assertSame( 2, $report['totals']['listeners'] );
		$this->assertSame( 5, $report['progress']['started'] );
		$this->assertSame( 1, $report['progress']['half'] );
		$this->assertSame( 2, $report['progress']['finished'] );
	}

	public function test_the_posts_are_listed_most_played_first_with_plain_titles() {
		$quiet = self::factory()->post->create( array( 'post_title' => 'Quiet' ) );
		$loud  = self::factory()->post->create( array( 'post_title' => 'Loud <script>alert(1)</script>' ) );
		$this->record( 'a', $quiet, array( 'play' => 1 ) );
		$this->record(
			'a',
			$loud,
			array(
				'play' => 9,
				'time' => 500,
				'end'  => 4,
			)
		);

		$posts = Report::get( '30' )['posts'];

		$this->assertSame( array( $loud, $quiet ), wp_list_pluck( $posts, 'id' ) );
		$this->assertSame( 9, $posts[0]['plays'] );
		$this->assertSame( 500, $posts[0]['seconds'] );
		$this->assertSame( 4, $posts[0]['finished'] );
		$this->assertStringNotContainsString( '<', $posts[0]['title'] );
	}

	public function test_it_holds_no_single_listener() {
		$post = self::factory()->post->create();
		$this->record( 'fingerprint-8f3a2c', $post, array( 'play' => 2 ) );

		$json = wp_json_encode( Report::get( '30' ) );

		$this->assertStringNotContainsString( 'fingerprint-8f3a2c', $json );
		$this->assertStringNotContainsString( 'user_id', $json );
		$this->assertStringNotContainsString( 'raw_results', $json );
	}

	// Periods.

	public function test_a_period_leaves_out_what_is_older() {
		$post = self::factory()->post->create();
		$this->record( 'a', $post, array( 'play' => 1 ), 2 );
		$this->record( 'b', $post, array( 'play' => 10 ), 20 );
		$this->record( 'c', $post, array( 'play' => 100 ), 200 );

		$this->assertSame( 1, Report::get( '7' )['totals']['plays'] );
		$this->assertSame( 11, Report::get( '30' )['totals']['plays'] );
		$this->assertSame( 11, Report::get( '90' )['totals']['plays'] );
		$this->assertSame( 111, Report::get( 'all' )['totals']['plays'] );
	}

	/**
	 * @dataProvider wrong_ranges
	 */
	public function test_an_unknown_period_is_refused( $range ) {
		$result = Report::get( $range );

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
	}

	public function wrong_ranges() {
		return array(
			'another number' => array( '14' ),
			'a word'         => array( 'yesterday' ),
			'sql'            => array( "30'; DROP TABLE x; --" ),
			'a list'         => array( array( '30' ) ),
			'nothing'        => array( '' ),
		);
	}

	// Counting on or off.

	public function test_it_says_whether_plays_are_counted_even_from_a_kept_report() {
		$this->assertFalse( Report::get( '30' )['counting'] );

		Tracking::save( array( 'count_plays' => true ) );

		// The numbers are kept for two minutes; this switch is read fresh.
		$this->assertTrue( Report::get( '30' )['counting'] );
	}

	public function test_a_report_is_kept_for_a_short_while() {
		$post = self::factory()->post->create();
		$this->record( 'a', $post, array( 'play' => 1 ) );
		$this->assertSame( 1, Report::get( '30' )['totals']['plays'] );

		$this->record( 'b', $post, array( 'play' => 5 ) );
		$this->assertSame( 1, Report::get( '30' )['totals']['plays'] );

		\TTA\Site\Advanced::clear_cache();
		$this->assertSame( 6, Report::get( '30' )['totals']['plays'] );
	}

	// What another plugin adds.

	public function test_the_free_plugin_alone_has_no_device_or_country_numbers() {
		$post = self::factory()->post->create();
		$this->record( 'a', $post, array( 'play' => 1 ) );

		$this->assertSame( array(), Report::get( '30' )['breakdowns'] );
	}

	public function test_numbers_added_through_the_classic_filter_show_here_too() {
		add_filter(
			'tts_analytics_response',
			static function ( $response, $context ) {
				if ( 'aggregated_insights' === $context ) {
					$response['data']['device']  = array(
						'Mobile'  => 7,
						'Desktop' => 12,
						''        => 3,
					);
					$response['data']['country'] = array( '<b>Spain</b>' => array( 'count' => 4 ) );
				}

				return $response;
			},
			10,
			2
		);

		$breakdowns = Report::get( '30' )['breakdowns'];

		$this->assertSame(
			array(
				array(
					'name'  => 'Desktop',
					'count' => 12,
				),
				array(
					'name'  => 'Mobile',
					'count' => 7,
				),
			),
			$breakdowns['devices']
		);
		$this->assertSame( 'Spain', $breakdowns['countries'][0]['name'] );
		$this->assertArrayNotHasKey( 'browsers', $breakdowns );
	}

	public function test_a_filter_that_returns_rubbish_does_not_break_the_report() {
		add_filter( 'tts_analytics_response', '__return_null' );

		$report = Report::get( '30' );

		$this->assertSame( 0, $report['totals']['plays'] );
		$this->assertSame( array(), $report['posts'] );
	}

	// The REST route.

	public function test_the_route_returns_the_report_of_the_last_30_days_by_default() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '30', $response->get_data()['range'] );
	}

	public function test_the_route_takes_a_period_and_refuses_an_unknown_one() {
		$this->assertSame( 'all', $this->rest( array( 'range' => 'all' ) )->get_data()['range'] );
		$this->assertSame( 400, $this->rest( array( 'range' => '14' ) )->get_status() );
	}

	public function test_the_route_only_reads_and_describes_itself() {
		$route = rest_get_server()->get_routes()['/tta/v1/report'][0];

		$this->assertSame( array( 'GET' => true ), $route['methods'] );
		$this->assertNotEmpty( $route['label'] );
		$this->assertStringContainsString( 'no single listener', $route['description'] );
		$this->assertSame( Report::RANGES, $route['args']['range']['enum'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_the_report( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
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

		$this->assertSame( Insights_Command::class, WP_CLI::$commands['atlasvoice insights'] );
	}

	public function test_the_command_prints_the_totals_and_the_top_posts() {
		Tracking::save( array( 'count_plays' => true ) );
		$post = self::factory()->post->create( array( 'post_title' => 'The old mill' ) );
		$this->record(
			'a',
			$post,
			array(
				'play' => 3,
				'time' => 3900,
				'end'  => 1,
			)
		);

		( new Insights_Command() )( array(), array( 'range' => '7' ) );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'plays: 3', $lines );
		$this->assertContains( 'listening time: 1 h 5 min', $lines );
		$this->assertContains( 'finished: 1', $lines );
		$this->assertContains( 'post ' . $post . ': 3 plays (The old mill)', $lines );
	}

	public function test_the_command_warns_when_plays_are_not_counted() {
		( new Insights_Command() )( array(), array() );

		$this->assertSame( 'warning', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'not counted', WP_CLI::$log[0][1] );
	}

	public function test_the_command_can_print_json_for_scripts() {
		( new Insights_Command() )( array(), array( 'format' => 'json' ) );

		$printed = json_decode( end( WP_CLI::$log )[1], true );
		$this->assertSame( '30', $printed['range'] );
		$this->assertArrayHasKey( 'totals', $printed );
	}

	public function test_the_command_says_why_a_period_was_refused() {
		try {
			( new Insights_Command() )( array(), array( 'range' => '14' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( '7, 30, 90 or all', WP_CLI::$log[0][1] );
	}
}
