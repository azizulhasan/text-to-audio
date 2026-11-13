<?php
/**
 * Tests for the site's own voice providers: the service class, its REST
 * route and `wp atlasvoice providers` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Providers_Command;
use TTA\Voice\Providers;

/**
 * @covers \TTA\Voice\Providers
 * @covers \TTA_Api\Providers_Controller
 * @covers \TTA\CLI\Providers_Command
 */
class ProvidersTest extends WP_UnitTestCase {

	const SECRET = 'sk-proj-0123456789abcdefghijklmnopqrstuvwxyzABCD';

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		remove_all_filters( 'atlasvoice_own_providers' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_own_providers' );
		parent::tear_down();
	}

	private function report( array $state ) {
		add_filter(
			'atlasvoice_own_providers',
			static function () use ( $state ) {
				return $state;
			}
		);
	}

	private function by_id() {
		return array_column( Providers::get()['providers'], null, 'id' );
	}

	private function rest() {
		return rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/tta/v1/providers' ) );
	}

	public function test_the_free_plugin_alone_has_no_provider_code_and_says_so() {
		$data = Providers::get();

		$this->assertFalse( $data['available'] );
		$this->assertSame( array( 'google', 'openai', 'elevenlabs', 'gcs' ), wp_list_pluck( $data['providers'], 'id' ) );
		foreach ( $data['providers'] as $provider ) {
			$this->assertFalse( $provider['available'] );
			$this->assertFalse( $provider['connected'] );
			$this->assertSame( '', $provider['detail'] );
		}
	}

	public function test_voice_providers_and_storage_are_told_apart() {
		$providers = $this->by_id();

		$this->assertSame( 'voice', $providers['google']['kind'] );
		$this->assertSame( 'voice', $providers['openai']['kind'] );
		$this->assertSame( 'voice', $providers['elevenlabs']['kind'] );
		$this->assertSame( 'storage', $providers['gcs']['kind'] );
	}

	public function test_the_plugin_that_holds_a_provider_reports_its_state() {
		$this->report(
			array(
				'google' => array(
					'available' => true,
					'connected' => true,
					'detail'    => 'my-project-392416',
				),
				'openai' => array(
					'available' => true,
					'connected' => false,
				),
			)
		);

		$data      = Providers::get();
		$providers = array_column( $data['providers'], null, 'id' );

		$this->assertTrue( $data['available'] );
		$this->assertTrue( $providers['google']['connected'] );
		$this->assertSame( 'my-project-392416', $providers['google']['detail'] );
		$this->assertTrue( $providers['openai']['available'] );
		$this->assertFalse( $providers['openai']['connected'] );
		$this->assertFalse( $providers['elevenlabs']['available'] );
	}

	public function test_a_provider_without_code_on_the_site_is_never_shown_as_connected() {
		$this->report(
			array(
				'google' => array(
					'connected' => true,
					'detail'    => 'my-project',
				),
			)
		);

		$google = $this->by_id()['google'];

		$this->assertFalse( $google['connected'] );
		$this->assertSame( '', $google['detail'] );
	}

	/**
	 * @dataProvider leaked_details
	 */
	public function test_a_key_put_into_the_detail_line_by_mistake_is_dropped( $detail ) {
		$this->report(
			array(
				'openai' => array(
					'available' => true,
					'connected' => true,
					'detail'    => $detail,
				),
			)
		);

		$data = Providers::get();

		$this->assertSame( '', array_column( $data['providers'], null, 'id' )['openai']['detail'] );
		$this->assertStringNotContainsString( 'sk-proj', wp_json_encode( $data ) );
		$this->assertStringNotContainsString( 'PRIVATE KEY', wp_json_encode( $data ) );
	}

	public function leaked_details() {
		return array(
			'an api key'           => array( self::SECRET ),
			'a key in a sentence'  => array( 'Connected with ' . self::SECRET ),
			'a private key'        => array( '-----BEGIN PRIVATE KEY----- abc' ),
			'a list instead'       => array( array( self::SECRET ) ),
			'a long token'         => array( str_repeat( 'a1B2', 12 ) ),
		);
	}

	public function test_a_normal_detail_line_is_kept_plain_and_short() {
		$this->report(
			array(
				'google' => array(
					'available' => true,
					'connected' => true,
					'detail'    => '<b>voice@my-project.iam.gserviceaccount.com</b> ' . str_repeat( 'x y ', 60 ),
				),
			)
		);

		$detail = $this->by_id()['google']['detail'];

		$this->assertStringStartsWith( 'voice@my-project.iam.gserviceaccount.com', $detail );
		$this->assertStringNotContainsString( '<', $detail );
		$this->assertLessThanOrEqual( Providers::DETAIL_LENGTH, mb_strlen( $detail ) );
	}

	/**
	 * @dataProvider broken_reports
	 */
	public function test_a_filter_that_returns_rubbish_does_not_break_the_screen( $report ) {
		add_filter(
			'atlasvoice_own_providers',
			static function () use ( $report ) {
				return $report;
			}
		);

		$data = Providers::get();

		$this->assertCount( 4, $data['providers'] );
		$this->assertFalse( $data['available'] );
	}

	public function broken_reports() {
		return array(
			'null'             => array( null ),
			'a string'         => array( 'connected' ),
			'states as text'   => array( array( 'google' => 'yes' ) ),
			'unknown provider' => array( array( 'azure' => array( 'available' => true ) ) ),
		);
	}

	public function test_an_unknown_provider_from_a_filter_is_not_added() {
		$this->report(
			array(
				'azure' => array(
					'available' => true,
					'connected' => true,
					'detail'    => self::SECRET,
				),
			)
		);

		$this->assertSame( array( 'google', 'openai', 'elevenlabs', 'gcs' ), wp_list_pluck( Providers::get()['providers'], 'id' ) );
	}

	// The REST route.

	public function test_the_route_returns_the_providers() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Providers::get(), $response->get_data() );
	}

	public function test_the_route_only_reads_and_describes_itself() {
		$route = rest_get_server()->get_routes()['/tta/v1/providers'][0];

		$this->assertNotEmpty( $route['label'] );
		$this->assertStringContainsString( 'never returns a key', $route['description'] );
		$this->assertSame( array( 'GET' => true ), $route['methods'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_the_route( $role ) {
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

		$this->assertSame( Providers_Command::class, WP_CLI::$commands['atlasvoice providers'] );
	}

	public function test_the_command_prints_each_provider_and_its_state() {
		$this->report(
			array(
				'google' => array(
					'available' => true,
					'connected' => true,
					'detail'    => 'my-project',
				),
				'openai' => array( 'available' => true ),
			)
		);

		( new Providers_Command() )( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'Google Cloud Text-to-Speech: connected (my-project)', $lines );
		$this->assertContains( 'OpenAI: not connected', $lines );
		$this->assertContains( 'ElevenLabs: not on this site', $lines );
	}

	public function test_the_command_can_print_json_for_scripts() {
		( new Providers_Command() )( array(), array( 'format' => 'json' ) );

		$this->assertSame( Providers::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}
}
