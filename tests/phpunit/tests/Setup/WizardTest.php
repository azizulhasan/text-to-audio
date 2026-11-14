<?php
/**
 * Tests for the first-run setup: the service class, its REST routes and
 * `wp atlasvoice setup` (TTS-347).
 *
 * @package TTA
 */

use TTA\AtlasVoice\Mode;
use TTA\CLI\Commands;
use TTA\CLI\Setup_Command;
use TTA\Setup\Wizard;

/**
 * @covers \TTA\Setup\Wizard
 * @covers \TTA_Api\Setup_Controller
 * @covers \TTA\CLI\Setup_Command
 */
class WizardTest extends WP_UnitTestCase {

	const SETTINGS = 'tta_settings_data';

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Wizard::FINISHED_OPTION );
		update_option(
			self::SETTINGS,
			(object) array(
				'tta__settings_allow_listening_for_post_types' => array( 'post' ),
				'tta__settings_enable_button_add'              => true,
			)
		);
		\TTA\TTA_Cache::flush();
		remove_all_filters( 'atlasvoice_setup_steps' );
		remove_all_actions( 'atlasvoice_setup_finished' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_setup_steps' );
		remove_all_actions( 'atlasvoice_setup_finished' );
		delete_option( Wizard::FINISHED_OPTION );
		delete_option( self::SETTINGS );
		\TTA\TTA_Cache::flush();
		parent::tear_down();
	}

	private function request( $method, $route, array $params = array() ) {
		$request = new WP_REST_Request( $method, $route );
		foreach ( $params as $name => $value ) {
			$request->set_param( $name, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	public function test_a_new_site_is_not_finished_and_is_in_staging() {
		$setup = Wizard::get();

		$this->assertFalse( $setup['finished'] );
		$this->assertSame( Mode::MODE_STAGING, $setup['mode'] );
		$this->assertSame( array( 'hear', 'where', 'voice', 'look', 'live' ), $setup['steps'] );
		$this->assertNull( $setup['sample'] );
	}

	public function test_the_sample_is_the_newest_published_post_as_plain_text() {
		self::factory()->post->create(
			array(
				'post_title' => 'Older',
				'post_date'  => '2026-01-01 10:00:00',
			)
		);
		$newest = self::factory()->post->create(
			array(
				'post_title'   => 'The <b>old</b> mill',
				'post_content' => "<p>It stood  by the river.</p>\n[gallery]<script>alert(1)</script>",
				'post_date'    => '2026-06-01 10:00:00',
			)
		);
		self::factory()->post->create(
			array(
				'post_title'  => 'A draft',
				'post_status' => 'draft',
				'post_date'   => '2026-07-01 10:00:00',
			)
		);

		$sample = Wizard::get()['sample'];

		$this->assertSame( $newest, $sample['id'] );
		$this->assertSame( 'The old mill', $sample['title'] );
		$this->assertSame( 'The old mill. It stood by the river.', $sample['text'] );
		$this->assertSame( get_permalink( $newest ), $sample['url'] );
		$this->assertNotSame( '', $sample['language'] );
	}

	public function test_the_sample_text_is_short() {
		self::factory()->post->create( array( 'post_content' => str_repeat( 'word ', 500 ) ) );

		$this->assertLessThanOrEqual( Wizard::SAMPLE_LENGTH, mb_strlen( Wizard::get()['sample']['text'] ) );
	}

	public function test_a_post_behind_a_password_is_never_the_sample() {
		self::factory()->post->create(
			array(
				'post_title'    => 'Secret',
				'post_password' => 'pass',
			)
		);

		$this->assertNull( Wizard::get()['sample'] );
	}

	public function test_the_sample_comes_from_the_content_types_that_get_a_player() {
		update_option( self::SETTINGS, (object) array( 'tta__settings_allow_listening_for_post_types' => array( 'page' ) ) );
		\TTA\TTA_Cache::flush();
		self::factory()->post->create( array( 'post_title' => 'A post' ) );
		$page = self::factory()->post->create(
			array(
				'post_title' => 'A page',
				'post_type'  => 'page',
			)
		);

		$this->assertSame( $page, Wizard::get()['sample']['id'] );
	}

	public function test_an_extension_can_add_steps_and_the_list_stays_clean() {
		add_filter(
			'atlasvoice_setup_steps',
			static function ( $steps ) {
				array_splice( $steps, 4, 0, array( 'mp3', 'MP3', '', 'look', '<b>report</b>' ) );

				return $steps;
			}
		);

		$this->assertSame( array( 'hear', 'where', 'voice', 'look', 'mp3', 'breportb', 'live' ), Wizard::steps() );
	}

	public function test_finish_marks_the_setup_and_keeps_the_mode_when_not_asked() {
		$setup = Wizard::finish();

		$this->assertTrue( $setup['finished'] );
		$this->assertTrue( (bool) get_option( Wizard::FINISHED_OPTION ) );
		$this->assertSame( Mode::MODE_STAGING, $setup['mode'] );
	}

	public function test_finish_can_go_live_and_can_go_back_to_staging() {
		$this->assertSame( Mode::MODE_PRODUCTION, Wizard::finish( true )['mode'] );
		$this->assertSame( Mode::MODE_PRODUCTION, Mode::get() );

		$this->assertSame( Mode::MODE_STAGING, Wizard::finish( false )['mode'] );
	}

	public function test_finish_changes_no_other_setting() {
		Wizard::finish( true );
		$stored = (array) get_option( self::SETTINGS );

		$this->assertSame( array( 'post' ), $stored['tta__settings_allow_listening_for_post_types'] );
		$this->assertTrue( $stored['tta__settings_enable_button_add'] );
		$this->assertSame(
			array( 'tta__settings_allow_listening_for_post_types', 'tta__settings_enable_button_add', Mode::MODE_KEY ),
			array_keys( $stored )
		);
	}

	public function test_the_mode_hook_fires_only_for_a_real_change() {
		$changes = 0;
		add_action(
			'atlasvoice_mode_changed',
			static function () use ( &$changes ) {
				$changes++;
			}
		);

		Wizard::finish( false );
		Wizard::finish();
		$this->assertSame( 0, $changes );

		Wizard::finish( true );
		Wizard::finish( true );
		$this->assertSame( 1, $changes );

		remove_all_actions( 'atlasvoice_mode_changed' );
	}

	public function test_finish_tells_extensions_with_the_mode() {
		$heard = array();
		add_action(
			'atlasvoice_setup_finished',
			static function ( $mode ) use ( &$heard ) {
				$heard[] = $mode;
			}
		);

		Wizard::finish( true );

		$this->assertSame( array( Mode::MODE_PRODUCTION ), $heard );
	}

	public function test_the_route_reads_the_setup() {
		$response = $this->request( 'GET', '/tta/v1/setup' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Wizard::get(), $response->get_data() );
		$this->assertFalse( (bool) get_option( Wizard::FINISHED_OPTION ) );
	}

	public function test_the_route_finishes_and_goes_live_only_when_asked() {
		$data = $this->request( 'POST', '/tta/v1/setup/finish' )->get_data();
		$this->assertTrue( $data['finished'] );
		$this->assertSame( Mode::MODE_STAGING, $data['mode'] );

		$data = $this->request( 'POST', '/tta/v1/setup/finish', array( 'go_live' => true ) )->get_data();
		$this->assertSame( Mode::MODE_PRODUCTION, $data['mode'] );

		$data = $this->request( 'POST', '/tta/v1/setup/finish', array( 'go_live' => false ) )->get_data();
		$this->assertSame( Mode::MODE_STAGING, $data['mode'] );
	}

	public function test_the_route_refuses_a_go_live_that_is_not_yes_or_no() {
		$response = $this->request( 'POST', '/tta/v1/setup/finish', array( 'go_live' => 'maybe' ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertFalse( (bool) get_option( Wizard::FINISHED_OPTION ) );
	}

	public function test_the_routes_are_for_administrators_only() {
		foreach ( array( self::factory()->user->create( array( 'role' => 'editor' ) ), 0 ) as $user ) {
			wp_set_current_user( $user );

			$this->assertContains( $this->request( 'GET', '/tta/v1/setup' )->get_status(), array( 401, 403 ) );
			$this->assertContains( $this->request( 'POST', '/tta/v1/setup/finish', array( 'go_live' => true ) )->get_status(), array( 401, 403 ) );
		}

		$this->assertFalse( (bool) get_option( Wizard::FINISHED_OPTION ) );
		$this->assertSame( Mode::MODE_STAGING, Mode::get() );
	}

	public function test_the_routes_describe_themselves_for_tools() {
		$routes = rest_get_server()->get_routes();

		foreach ( array( '/tta/v1/setup', '/tta/v1/setup/finish' ) as $route ) {
			$this->assertNotEmpty( $routes[ $route ][0]['label'], $route );
			$this->assertNotEmpty( $routes[ $route ][0]['description'], $route );
		}
		$this->assertNotEmpty( $routes['/tta/v1/setup/finish'][0]['args']['go_live']['description'] );
	}

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Setup_Command::class, WP_CLI::$commands['atlasvoice setup'] );
	}

	public function test_status_prints_where_the_setup_stands() {
		( new Setup_Command() )->status( array(), array() );
		$lines = wp_list_pluck( WP_CLI::$log, 1 );

		$this->assertSame( 'setup: not finished', $lines[0] );
		$this->assertSame( 'mode: staging', $lines[1] );
		$this->assertSame( 'steps: hear, where, voice, look, live', $lines[2] );
		$this->assertSame( 'sample post: none', $lines[4] );
	}

	public function test_status_prints_json_that_matches_the_service() {
		( new Setup_Command() )->status( array(), array( 'format' => 'json' ) );

		$this->assertSame( Wizard::get(), json_decode( WP_CLI::$log[0][1], true ) );
	}

	public function test_finish_from_the_command_goes_live_when_asked() {
		( new Setup_Command() )->finish( array(), array( 'go-live' => true ) );

		$this->assertSame( Mode::MODE_PRODUCTION, Mode::get() );
		$this->assertTrue( (bool) get_option( Wizard::FINISHED_OPTION ) );
		$this->assertStringContainsString( 'The site is live', end( WP_CLI::$log )[1] );
	}

	public function test_finish_from_the_command_keeps_staging_by_default() {
		( new Setup_Command() )->finish( array(), array() );

		$this->assertSame( Mode::MODE_STAGING, Mode::get() );
		$this->assertStringContainsString( 'in staging', end( WP_CLI::$log )[1] );
	}

	public function test_the_command_refuses_both_flags_and_changes_nothing() {
		try {
			( new Setup_Command() )->finish(
				array(),
				array(
					'go-live'         => true,
					'stay-in-staging' => true,
				)
			);
			$this->fail( 'The command should have stopped.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertStringContainsString( 'not both', $stop->getMessage() );
		}

		$this->assertFalse( (bool) get_option( Wizard::FINISHED_OPTION ) );
	}
}
