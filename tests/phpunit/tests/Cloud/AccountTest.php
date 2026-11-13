<?php
/**
 * Tests for the site's AtlasVoice Cloud account: the service class, its
 * REST route and its WP-CLI command (TTS-378).
 *
 * @package TTA
 */

use TTA\CLI\Account_Command;
use TTA\CLI\Commands;
use TTA\Cloud\Account;
use TTA\Cloud\Cloud;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Cloud\Account
 * @covers \TTA_Api\Cloud_Account_Controller
 * @covers \TTA\CLI\Account_Command
 */
class AccountTest extends WP_UnitTestCase {

	const KEY = 'av_live_secret_key_value_0123456789';

	/**
	 * Addresses WordPress was asked to call.
	 *
	 * @var string[]
	 */
	private $calls = array();

	/**
	 * What to answer: status and body.
	 *
	 * @var array
	 */
	private $answer;

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		Cloud::reset();
		delete_transient( Account::CACHE );
		update_option(
			Service::OPTION,
			array(
				'consent'    => true,
				'api_key'    => self::KEY,
				'key_prefix' => 'av_live_secr',
				'plan'       => 'free',
			),
			false
		);
		$this->calls  = array();
		$this->answer = array( 200, $this->account() );
		add_filter( 'pre_http_request', array( $this, 'intercept' ), 10, 3 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'intercept' ), 10 );
		parent::tear_down();
	}

	public function intercept( $pre, $args, $url ) {
		$this->calls[] = $url;

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

	private function account() {
		return array(
			'project' => array(
				'id'       => 37,
				'platform' => 'wordpress',
				'domain'   => 'example.com',
				'status'   => 'active',
				'approval' => 'approved',
			),
			'plan'    => array(
				'slug' => 'premium',
				'name' => 'Premium',
			),
			'engines' => array( 'gtts', 'cloud' ),
			'usage'   => array(
				'chars_used'      => 1200,
				'chars_limit'     => 100000,
				'chars_remaining' => 98800,
				'resets_at'       => '2026-12-01T00:00:00Z',
			),
			'limits'  => array(
				'requests_per_minute'   => 60,
				'max_chars_per_request' => 5000,
				'daily_chars'           => null,
			),
			'license' => array(
				'attached'   => true,
				'id'         => '2050938',
				'expires_at' => '2027-03-12T00:00:00Z',
				'checked_at' => '2026-11-13T08:00:00Z',
				'ended'      => null,
			),
			'links'   => array(
				'dashboard' => 'https://app.atlasvoice.cloud/projects/37',
				'upgrade'   => 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/',
			),
		);
	}

	private function rest( array $params = array() ) {
		$request = new WP_REST_Request( 'GET', '/tta/v1/cloud/account' );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	// The service class.

	public function test_a_site_that_is_not_connected_asks_nothing() {
		delete_option( Service::OPTION );

		$account = Account::get();

		$this->assertFalse( $account['connected'] );
		$this->assertSame( 'none', $account['source'] );
		$this->assertSame( array(), $this->calls );
	}

	public function test_the_account_is_what_the_service_says() {
		$account = Account::get();

		$this->assertSame( array( 'https://api.atlasvoice.cloud/v1/account' ), $this->calls );
		$this->assertTrue( $account['connected'] );
		$this->assertSame( 'service', $account['source'] );
		$this->assertSame( 'premium', $account['plan']['slug'] );
		$this->assertSame( 'Premium', $account['plan']['name'] );
		$this->assertSame( array( 'gtts', 'cloud' ), $account['engines'] );
		$this->assertSame( 98800, $account['usage']['chars_remaining'] );
		$this->assertSame( 60, $account['limits']['requests_per_minute'] );
		$this->assertNull( $account['limits']['daily_chars'], 'No daily limit stays "no limit", not zero.' );
		$this->assertTrue( $account['license']['attached'] );
		$this->assertNull( $account['license']['ended'] );
		$this->assertSame( 'https://app.atlasvoice.cloud/projects/37', $account['links']['dashboard'] );
		$this->assertSame( 'req-0123456789', $account['request_id'] );
	}

	public function test_the_answer_is_kept_so_a_screen_does_not_ask_on_every_load() {
		Account::get();
		Account::get();
		Account::get();

		$this->assertCount( 1, $this->calls );
	}

	public function test_refresh_asks_the_service_again() {
		Account::get();
		Account::get( true );

		$this->assertCount( 2, $this->calls );
	}

	public function test_the_key_and_the_licence_id_are_never_in_the_account() {
		$account = wp_json_encode( array( Account::get(), get_transient( Account::CACHE ) ) );

		$this->assertStringNotContainsString( self::KEY, $account );
		$this->assertStringNotContainsString( '2050938', $account );
	}

	public function test_a_licence_that_ended_says_why() {
		$this->answer[1]['license']['ended'] = array(
			'reason' => 'expired',
			'at'     => '2026-11-01T00:00:00Z',
		);

		$account = Account::get();

		$this->assertSame( 'expired', $account['license']['ended']['reason'] );
	}

	public function test_nothing_in_the_answer_is_trusted() {
		$this->answer[1] = array(
			'project' => array(
				'id'       => '37; DROP TABLE',
				'approval' => '<script>alert(1)</script>',
			),
			'plan'    => array(
				'slug' => array( 'premium' ),
				'name' => '<b onmouseover=alert(1)>Premium</b>',
			),
			'engines' => array( 'gtts', array( 'x' ), '<img>', 7, 'gtts' ),
			'usage'   => 'lots',
			'limits'  => array( 'requests_per_minute' => -5 ),
			'license' => array(
				'attached' => 'yes',
				'ended'    => 'expired',
			),
			'links'   => array(
				'dashboard' => 'javascript:alert(1)',
				'upgrade'   => 'https://evil.example/atlasvoice.cloud',
			),
			'extra'   => array( 'api_key' => 'leak' ),
		);

		$account = Account::get();

		$this->assertSame( 37, $account['project']['id'] );
		$this->assertStringNotContainsString( '<', $account['project']['approval'] );
		$this->assertSame( '', $account['plan']['slug'] );
		$this->assertSame( 'Premium', $account['plan']['name'] );
		$this->assertSame( array( 'gtts', 'img' ), $account['engines'] );
		$this->assertNull( $account['usage']['chars_used'] );
		$this->assertSame( 0, $account['limits']['requests_per_minute'] );
		$this->assertNull( $account['license']['ended'] );
		$this->assertSame( '', $account['links']['dashboard'] );
		$this->assertSame( '', $account['links']['upgrade'] );
		$this->assertArrayNotHasKey( 'extra', $account );
	}

	/**
	 * @dataProvider links
	 */
	public function test_a_link_is_kept_only_on_our_own_domains_over_https( $url, $kept ) {
		$this->answer[1]['links']['dashboard'] = $url;

		$this->assertSame( $kept ? $url : '', Account::get()['links']['dashboard'] );
	}

	public function links() {
		return array(
			'the dashboard'       => array( 'https://app.atlasvoice.cloud/projects/37', true ),
			'the bare domain'     => array( 'https://atlasvoice.cloud/pricing', true ),
			'our site'            => array( 'https://atlasaidev.com/pricing/', true ),
			'plain http'          => array( 'http://app.atlasvoice.cloud/projects/37', false ),
			'a look-alike domain' => array( 'https://atlasvoice.cloud.evil.example/', false ),
			'a suffix trick'      => array( 'https://evilatlasvoice.cloud/', false ),
			'user info trick'     => array( 'https://atlasvoice.cloud@evil.example/', false ),
		);
	}

	public function test_a_service_that_is_down_shows_what_the_site_last_stored() {
		$this->answer = null;

		$account = Account::get();

		$this->assertTrue( $account['connected'] );
		$this->assertSame( 'stored', $account['source'] );
		$this->assertSame( 'free', $account['plan']['slug'] );
		$this->assertSame( 'service_unreachable', $account['error'] );
		$this->assertNotSame( '', $account['request_id'] );
	}

	public function test_an_older_service_without_the_route_falls_back_to_the_stored_state() {
		$this->answer = array( 404, array( 'error' => array( 'code' => 'not_found' ) ) );

		$account = Account::get();

		$this->assertSame( 'stored', $account['source'] );
		$this->assertSame( 'not_found', $account['error'] );
	}

	public function test_a_failure_is_kept_for_a_short_time_only() {
		$this->answer = null;
		Account::get();
		Account::get();

		$this->assertCount( 1, $this->calls, 'A reloaded screen does not ask a failing service again at once.' );

		$timeout = (int) get_option( '_transient_timeout_' . Account::CACHE );
		$this->assertLessThanOrEqual( time() + Account::FAILURE_SECONDS, $timeout );
	}

	// How the site is connected.

	public function test_the_account_says_how_the_site_is_connected_without_the_key() {
		$state          = get_option( Service::OPTION );
		$state['email'] = 'owner@example.org';
		update_option( Service::OPTION, $state, false );

		$account = Account::get();

		$this->assertSame( 'owner@example.org', $account['connection']['email'] );
		$this->assertSame( 'av_live_secr', $account['connection']['key_prefix'] );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( $account ) );
	}

	public function test_the_connection_is_read_from_the_site_not_from_the_kept_answer() {
		Account::get();

		$kept                             = get_transient( Account::CACHE );
		$kept['connection']['key_prefix'] = 'planted';
		set_transient( Account::CACHE, $kept, 60 );

		$this->assertSame( 'av_live_secr', Account::get()['connection']['key_prefix'] );
	}

	public function test_a_site_that_is_not_connected_has_an_empty_connection() {
		delete_option( Service::OPTION );

		$this->assertSame(
			array(
				'email'      => '',
				'key_prefix' => '',
			),
			Account::get()['connection']
		);
	}

	// Staying up to date.

	public function test_a_licence_change_clears_the_kept_answer() {
		Account::get();

		$state                     = get_option( Service::OPTION );
		$state['license_attached'] = true;
		update_option( Service::OPTION, $state, false );

		$this->assertFalse( get_transient( Account::CACHE ) );
	}

	public function test_a_new_key_clears_the_kept_answer() {
		Account::get();

		$state            = get_option( Service::OPTION );
		$state['api_key'] = 'av_live_another_key';
		update_option( Service::OPTION, $state, false );

		$this->assertFalse( get_transient( Account::CACHE ) );
	}

	public function test_a_usage_update_does_not_clear_it() {
		Account::get();

		$state             = get_option( Service::OPTION );
		$state['usage']    = array( 'chars_used' => 5000 );
		$state['usage_at'] = time();
		update_option( Service::OPTION, $state, false );

		$this->assertIsArray( get_transient( Account::CACHE ) );
	}

	// The REST route.

	public function test_the_route_returns_the_account() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'premium', $response->get_data()['plan']['slug'] );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( $response->get_data() ) );
	}

	public function test_the_route_can_ask_for_a_fresh_answer() {
		$this->rest();
		$this->rest( array( 'refresh' => 'true' ) );

		$this->assertCount( 2, $this->calls );
	}

	public function test_the_route_describes_itself_for_tools_that_read_the_rest_index() {
		$routes = rest_get_server()->get_routes();
		$route  = $routes['/tta/v1/cloud/account'][0];

		$this->assertNotEmpty( $route['label'] );
		$this->assertNotEmpty( $route['description'] );
		$this->assertSame( 'boolean', $route['args']['refresh']['type'] );
		$this->assertNotEmpty( $route['args']['refresh']['description'] );
		$this->assertArrayHasKey( 'GET', $route['methods'] );
		$this->assertCount( 1, $route['methods'], 'The route only reads.' );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_the_account( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertSame( array(), $this->calls );
	}

	public function people_without_access() {
		return array(
			'a visitor'    => array( '' ),
			'a subscriber' => array( 'subscriber' ),
			'an author'    => array( 'author' ),
			'an editor'    => array( 'editor' ),
		);
	}

	// The command.

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Account_Command::class, WP_CLI::$commands['atlasvoice account'] );
	}

	public function test_the_command_prints_the_account() {
		( new Account_Command() )( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'plan: Premium', $lines );
		$this->assertContains( 'engines: gtts, cloud', $lines );
		$this->assertContains( 'characters left: 98800', $lines );
		$this->assertContains( 'licence attached: yes', $lines );
		$this->assertStringNotContainsString( self::KEY, wp_json_encode( WP_CLI::$log ) );
	}

	public function test_the_command_can_print_json_for_scripts() {
		( new Account_Command() )( array(), array( 'format' => 'json' ) );

		$printed = json_decode( end( WP_CLI::$log )[1], true );
		$this->assertSame( 'premium', $printed['plan']['slug'] );
	}

	public function test_the_command_says_when_the_site_is_not_connected() {
		delete_option( Service::OPTION );

		( new Account_Command() )( array(), array() );

		$this->assertSame( array( 'line', 'This site is not connected to AtlasVoice Cloud.' ), end( WP_CLI::$log ) );
	}

	public function test_the_command_warns_when_it_shows_stored_data() {
		$this->answer = null;

		( new Account_Command() )( array(), array( 'refresh' => true ) );

		$this->assertSame( 'warning', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'service_unreachable', WP_CLI::$log[0][1] );
	}
}
