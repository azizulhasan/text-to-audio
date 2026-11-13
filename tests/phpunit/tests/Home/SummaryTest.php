<?php
/**
 * Tests for the Home screen's summary: the service class, its REST routes
 * and `wp atlasvoice status` (TTS-347).
 *
 * @package TTA
 */

use TTA\AtlasVoice\Mode;
use TTA\CLI\Commands;
use TTA\CLI\Status_Command;
use TTA\Home\Summary;
use TTA\TTA_AtlasVoice_Service as Service;

/**
 * @covers \TTA\Home\Summary
 * @covers \TTA_Api\Home_Controller
 * @covers \TTA\CLI\Status_Command
 */
class SummaryTest extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private $admin;

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		foreach ( array( 'tta_settings_data', 'tta_customize_settings', 'tta_listening_settings', 'tta_onboarding_completed', Service::OPTION ) as $option ) {
			delete_option( $option );
		}
		\TTA\TTA_Cache::flush();
		$this->admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->admin );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	private function rest( $method = 'GET', $route = '/tta/v1/home', array $body = array() ) {
		$request = new WP_REST_Request( $method, $route );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// The summary.

	public function test_a_new_site_has_safe_defaults_and_every_field() {
		$summary = Summary::get();

		$this->assertSame(
			array( 'mode', 'live', 'setup_finished', 'is_pro', 'voice', 'player', 'content', 'usage', 'links', 'hidden' ),
			array_keys( $summary )
		);
		$this->assertFalse( $summary['setup_finished'] );
		$this->assertSame( 1, $summary['voice']['player_id'] );
		$this->assertFalse( $summary['voice']['stores_audio'] );
		$this->assertSame( 'before_content', $summary['player']['position'] );
		$this->assertSame( array( 'all' ), $summary['player']['shown_to'] );
		$this->assertTrue( $summary['content']['automatic'] );
		$this->assertFalse( $summary['usage']['connected'] );
		$this->assertNull( $summary['usage']['chars_used'] );
		$this->assertSame( array(), $summary['hidden'] );
	}

	public function test_it_says_whether_visitors_can_hear_the_posts() {
		Mode::set( Mode::MODE_STAGING );
		$this->assertFalse( Summary::get()['live'] );
		$this->assertSame( Mode::MODE_STAGING, Summary::get()['mode'] );

		Mode::set( Mode::MODE_PRODUCTION );
		\TTA\TTA_Cache::flush();
		$this->assertTrue( Summary::get()['live'] );
		$this->assertSame( Mode::MODE_PRODUCTION, Summary::get()['mode'] );
	}

	public function test_it_reads_the_placement_and_the_content_types_from_the_saved_settings() {
		update_option(
			'tta_customize_settings',
			array(
				'buttonSettings' => array(
					'id'                => 1,
					'button_position'   => 'after_content',
					'display_player_to' => array( 'administrator', 'editor' ),
				),
			)
		);
		update_option(
			'tta_settings_data',
			array(
				'tta__settings_enable_button_add'              => false,
				'tta__settings_allow_listening_for_post_types' => array( 'post', 'page', 'gone_type' ),
			)
		);
		\TTA\TTA_Cache::flush();

		$summary = Summary::get();

		$this->assertSame( 'after_content', $summary['player']['position'] );
		$this->assertSame( array( 'administrator', 'editor' ), $summary['player']['shown_to'] );
		$this->assertFalse( $summary['content']['automatic'] );
		// Names a person knows; a type that no longer exists keeps its slug.
		$this->assertSame( array( 'Posts', 'Pages', 'gone_type' ), $summary['content']['post_types'] );
	}

	public function test_settings_saved_as_objects_are_read_the_same_way() {
		update_option(
			'tta_customize_settings',
			(object) array(
				'buttonSettings' => (object) array(
					'id'              => 1,
					'button_position' => 'after_content',
				),
			)
		);
		update_option( 'tta_listening_settings', (object) array( 'tta__listening_lang' => 'en-GB' ) );
		\TTA\TTA_Cache::flush();

		$summary = Summary::get();

		$this->assertSame( 'after_content', $summary['player']['position'] );
		$this->assertSame( 'en-GB', $summary['voice']['language'] );
	}

	/**
	 * @dataProvider saved_voices
	 */
	public function test_the_voice_is_shown_by_a_name_a_person_can_read( $saved, $shown ) {
		update_option(
			'tta_listening_settings',
			array(
				'tta__listening_lang'  => 'en',
				'tta__listening_voice' => $saved,
			)
		);
		\TTA\TTA_Cache::flush();

		$this->assertSame( $shown, Summary::get()['voice']['voice'] );
	}

	public function saved_voices() {
		return array(
			'id and name'    => array( 'uLJQMZhREaVyMzh22S1d::jephthah', 'jephthah' ),
			'a plain name'   => array( 'Google UK English Female', 'Google UK English Female' ),
			'nothing saved'  => array( '', '' ),
			'markup removed' => array( '<b>Emma</b>', 'Emma' ),
			'only the id'    => array( 'abc::', 'abc::' ),
		);
	}

	public function test_damaged_settings_do_not_break_home() {
		update_option( 'tta_customize_settings', 'broken' );
		update_option( 'tta_settings_data', array( 'tta__settings_allow_listening_for_post_types' => 'post' ) );
		update_option( 'tta_listening_settings', array( 'tta__listening_voice' => array( 'x' ) ) );
		\TTA\TTA_Cache::flush();

		$summary = Summary::get();

		$this->assertSame( 'before_content', $summary['player']['position'] );
		$this->assertSame( array( 'Posts' ), $summary['content']['post_types'] );
		$this->assertSame( '', $summary['voice']['voice'] );
	}

	public function test_the_visitor_link_is_the_newest_readable_post() {
		$post = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		self::factory()->post->create( array( 'post_status' => 'draft' ) );

		$this->assertSame( get_permalink( $post ), Summary::get()['links']['visitor'] );
	}

	public function test_the_demo_link_names_the_home_card() {
		$demo = Summary::get()['links']['demo'];

		$this->assertStringStartsWith( 'https://atlasaidev.com/plugins/text-to-speech-pro/demo/?', $demo );
		$this->assertStringContainsString( 'utm_content=home_card', $demo );
	}

	public function test_the_allowance_is_what_the_site_stored_and_no_request_is_sent() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value',
				'usage'   => array(
					'chars_used'  => 85000,
					'chars_limit' => 100000,
				),
			),
			false
		);
		$requests = 0;
		$count    = static function ( $pre ) use ( &$requests ) {
			++$requests;

			return $pre;
		};
		add_filter( 'pre_http_request', $count );

		$summary = Summary::get();

		remove_filter( 'pre_http_request', $count );

		$this->assertSame( 0, $requests, 'Home must open without waiting for another server.' );
		$this->assertTrue( $summary['usage']['connected'] );
		$this->assertSame( 85000, $summary['usage']['chars_used'] );
		$this->assertSame( 100000, $summary['usage']['chars_limit'] );
		$this->assertStringNotContainsString( 'av_live_secret_key_value', wp_json_encode( $summary ) );
	}

	// Hiding an item.

	public function test_a_user_can_hide_the_pro_card_for_30_days() {
		$this->assertTrue( Summary::dismiss( 'pro_card' ) );

		$this->assertSame( array( 'pro_card' ), Summary::get()['hidden'] );
	}

	public function test_the_card_comes_back_after_30_days() {
		update_user_meta( $this->admin, Summary::DISMISSED_META, array( 'pro_card' => time() - Summary::DISMISS_SECONDS - 60 ) );

		$this->assertSame( array(), Summary::get()['hidden'] );
	}

	public function test_hiding_is_per_user() {
		Summary::dismiss( 'pro_card' );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->assertSame( array(), Summary::get()['hidden'] );
	}

	public function test_only_known_items_can_be_hidden() {
		$result = Summary::dismiss( 'everything' );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_unknown_item', $result->get_error_code() );
		$this->assertSame( '', get_user_meta( $this->admin, Summary::DISMISSED_META, true ) );
	}

	public function test_a_damaged_record_of_hidden_items_is_read_as_empty() {
		update_user_meta(
			$this->admin,
			Summary::DISMISSED_META,
			array(
				'pro_card'   => 'yesterday',
				'<script>'   => time(),
				'other_item' => time(),
			)
		);

		$this->assertSame( array(), Summary::get()['hidden'] );
	}

	public function test_resetting_the_plugin_removes_what_users_hid() {
		Summary::dismiss( 'pro_card' );
		update_option( 'tta_admin_ui', 'new' );

		\TTA\TTA_Reset::wipe_plugin_data();
		wp_cache_flush();

		$this->assertSame( '', get_user_meta( $this->admin, Summary::DISMISSED_META, true ) );
		$this->assertFalse( get_option( 'tta_admin_ui' ) );
	}

	// The REST routes.

	public function test_the_route_returns_the_summary() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Summary::get(), $response->get_data() );
	}

	public function test_the_dismiss_route_hides_the_card_and_answers_what_is_hidden() {
		$response = $this->rest( 'POST', '/tta/v1/home/dismiss', array( 'item' => 'pro_card' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'hidden' => array( 'pro_card' ) ), $response->get_data() );
	}

	public function test_the_dismiss_route_refuses_an_unknown_item() {
		$this->assertSame( 400, $this->rest( 'POST', '/tta/v1/home/dismiss', array( 'item' => 'rail' ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', '/tta/v1/home/dismiss' )->get_status() );
	}

	public function test_the_routes_describe_themselves_for_tools_that_read_the_rest_index() {
		$routes = rest_get_server()->get_routes();

		$read = $routes['/tta/v1/home'][0];
		$this->assertNotEmpty( $read['label'] );
		$this->assertNotEmpty( $read['description'] );
		$this->assertSame( array( 'GET' => true ), $read['methods'] );

		$hide = $routes['/tta/v1/home/dismiss'][0];
		$this->assertNotEmpty( $hide['label'] );
		$this->assertNotEmpty( $hide['description'] );
		$this->assertSame( array( 'POST' => true ), $hide['methods'] );
		$this->assertSame( Summary::DISMISSIBLE, $hide['args']['item']['enum'] );
		$this->assertNotEmpty( $hide['args']['item']['description'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_use_the_routes( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', '/tta/v1/home/dismiss', array( 'item' => 'pro_card' ) )->get_status(), array( 401, 403 ) );
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

		$this->assertSame( Status_Command::class, WP_CLI::$commands['atlasvoice status'] );
	}

	public function test_the_command_prints_the_setup_in_words() {
		Mode::set( Mode::MODE_STAGING );

		( new Status_Command() )( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'mode: staging (only administrators see the player)', $lines );
		$this->assertContains( 'setup: not finished', $lines );
		$this->assertContains( 'player position: before_content', $lines );
		$this->assertContains( 'added: automatically', $lines );
	}

	public function test_the_command_can_print_json_for_scripts() {
		( new Status_Command() )( array(), array( 'format' => 'json' ) );

		$this->assertSame( Summary::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}
}
