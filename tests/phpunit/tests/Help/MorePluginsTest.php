<?php
/**
 * Tests for the list of the other AtlasAiDev plugins: the service class,
 * its REST route and `wp atlasvoice more-plugins` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\More_Plugins_Command;
use TTA\Help\More_Plugins;

/**
 * @covers \TTA\Help\More_Plugins
 * @covers \TTA_Api\More_Plugins_Controller
 * @covers \TTA\CLI\More_Plugins_Command
 */
class MorePluginsTest extends WP_UnitTestCase {

	/**
	 * Every request to another site made while a test runs.
	 *
	 * @var string[]
	 */
	private $fetched = array();

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		$this->fetched = array();
		delete_transient( \TTA_Admin\TTA_Admin::ATLAS_PLUGINS_TRANSIENT );
		add_filter( 'pre_http_request', array( $this, 'note_fetch' ), 10, 3 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'note_fetch' ), 10 );
		delete_transient( \TTA_Admin\TTA_Admin::ATLAS_PLUGINS_TRANSIENT );
		parent::tear_down();
	}

	/**
	 * Notes a request and answers it, so no test ever reaches the network.
	 */
	public function note_fetch( $pre, $args, $url ) {
		$this->fetched[] = $url;

		return new WP_Error( 'test_offline', 'No network in this test.' );
	}

	private function request() {
		return rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/tta/v1/more-plugins' ) );
	}

	public function test_it_lists_the_other_plugins_and_never_this_one() {
		$slugs = wp_list_pluck( More_Plugins::get()['plugins'], 'slug' );

		$this->assertContains( 'smart-local-ai', $slugs );
		$this->assertContains( 'ar-vr-3d-model-try-on', $slugs );
		$this->assertNotContains( 'text-to-audio', $slugs );
	}

	public function test_every_plugin_has_the_same_shape() {
		foreach ( More_Plugins::get()['plugins'] as $plugin ) {
			$this->assertSame( array( 'slug', 'name', 'description', 'installed', 'active', 'url', 'install_url' ), array_keys( $plugin ) );
			$this->assertNotSame( '', $plugin['name'] );
			$this->assertIsBool( $plugin['installed'] );
			$this->assertIsBool( $plugin['active'] );
			$this->assertSame( 'https://wordpress.org/plugins/' . $plugin['slug'] . '/', $plugin['url'] );
		}
	}

	public function test_reading_fetches_nothing_from_another_site() {
		More_Plugins::get();
		$this->request();
		( new More_Plugins_Command() )( array(), array() );

		$this->assertSame( array(), $this->fetched );
	}

	public function test_installed_follows_the_plugin_files_on_this_site() {
		foreach ( \TTA_Admin\TTA_Admin::get_atlas_plugins() as $plugin ) {
			if ( 'text-to-audio' === $plugin['slug'] ) {
				continue;
			}
			$rows = wp_list_pluck( More_Plugins::get()['plugins'], 'installed', 'slug' );

			$this->assertSame( file_exists( WP_PLUGIN_DIR . '/' . $plugin['basename'] ), $rows[ $plugin['slug'] ], $plugin['slug'] );
		}
	}

	public function test_active_follows_the_active_plugins() {
		$first = \TTA_Admin\TTA_Admin::get_atlas_plugins()[1];
		$this->assertFalse( wp_list_pluck( More_Plugins::get()['plugins'], 'active', 'slug' )[ $first['slug'] ] );

		update_option( 'active_plugins', array_merge( (array) get_option( 'active_plugins', array() ), array( $first['basename'] ) ) );

		$this->assertTrue( wp_list_pluck( More_Plugins::get()['plugins'], 'active', 'slug' )[ $first['slug'] ] );
	}

	public function test_the_installer_link_is_only_for_who_may_install() {
		// On a single site an administrator may install plugins.
		$plugin = More_Plugins::get()['plugins'][0];
		$this->assertTrue( More_Plugins::get()['can_install'] );
		$this->assertStringContainsString( 'plugin-install.php', $plugin['install_url'] );
		$this->assertStringContainsString( 's=' . $plugin['slug'], $plugin['install_url'] );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$list = More_Plugins::get();

		$this->assertFalse( $list['can_install'] );
		$this->assertSame( '', $list['plugins'][0]['install_url'] );
	}

	public function test_a_saved_list_is_cleaned_before_it_is_shown() {
		set_transient(
			\TTA_Admin\TTA_Admin::ATLAS_PLUGINS_TRANSIENT,
			array(
				array(
					'slug'        => 'Some-Plugin<script>',
					'name'        => 'Some <b>plugin</b>',
					'description' => "A line\nwith a break",
					'basename'    => 'some-plugin/some-plugin.php',
				),
				array( 'slug' => 'no-name' ),
				array( 'name' => 'No slug' ),
				array(
					'slug' => 'text-to-audio',
					'name' => 'This plugin',
				),
			)
		);

		$plugins = More_Plugins::get()['plugins'];

		$this->assertCount( 1, $plugins );
		$this->assertSame( 'some-pluginscript', $plugins[0]['slug'] );
		$this->assertSame( 'Some plugin', $plugins[0]['name'] );
		$this->assertSame( 'A line with a break', $plugins[0]['description'] );
		$this->assertFalse( $plugins[0]['installed'] );
	}

	public function test_it_points_to_the_full_list_page() {
		$this->assertStringContainsString( 'page=atlasvoice-other-plugins', More_Plugins::get()['list_url'] );
	}

	public function test_the_route_returns_the_list() {
		$response = $this->request();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( More_Plugins::get(), $response->get_data() );
	}

	public function test_the_route_is_for_administrators_only() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$this->assertContains( $this->request()->get_status(), array( 401, 403 ) );

		wp_set_current_user( 0 );
		$this->assertContains( $this->request()->get_status(), array( 401, 403 ) );
	}

	public function test_the_route_describes_itself_for_tools() {
		$routes = rest_get_server()->get_routes();
		$route  = $routes['/tta/v1/more-plugins'][0];

		$this->assertNotEmpty( $route['label'] );
		$this->assertNotEmpty( $route['description'] );
	}

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( More_Plugins_Command::class, WP_CLI::$commands['atlasvoice more-plugins'] );
	}

	public function test_the_command_prints_each_plugin_with_its_state() {
		( new More_Plugins_Command() )( array(), array() );
		$lines = wp_list_pluck( WP_CLI::$log, 1 );

		$this->assertCount( count( More_Plugins::get()['plugins'] ), $lines );
		$this->assertMatchesRegularExpression( '/^ar-vr-3d-model-try-on \((not installed|installed)\) \S/', $lines[0] );
	}

	public function test_the_command_prints_json_that_matches_the_service() {
		( new More_Plugins_Command() )( array(), array( 'format' => 'json' ) );

		$this->assertSame( More_Plugins::get(), json_decode( WP_CLI::$log[0][1], true ) );
	}
}
