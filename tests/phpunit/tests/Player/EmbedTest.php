<?php
/**
 * Tests for the shortcode and block reference: the service class, its REST
 * route and `wp atlasvoice embed` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Embed_Command;
use TTA\Player\Embed;

/**
 * @covers \TTA\Player\Embed
 * @covers \TTA_Api\Embed_Controller
 * @covers \TTA\CLI\Embed_Command
 */
class EmbedTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	private function rest() {
		return rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/tta/v1/embed' ) );
	}

	private function plugin_file( $path ) {
		return file_get_contents( dirname( __DIR__, 4 ) . '/' . $path );
	}

	public function test_both_shortcodes_it_names_are_registered_by_the_plugin() {
		$this->assertTrue( shortcode_exists( Embed::SHORTCODE ) );
		$this->assertTrue( shortcode_exists( Embed::LEGACY_SHORTCODE ) );
		$this->assertSame( '[atlasvoice]', Embed::get()['shortcode'] );
		$this->assertSame( '[tta_listen_btn]', Embed::get()['legacy_shortcode'] );
	}

	public function test_the_block_it_names_is_the_block_the_plugin_ships() {
		$this->assertStringContainsString( "title: '" . Embed::BLOCK . "'", $this->plugin_file( 'admin/js/blocks/customize-button/customize-button.js' ) );
	}

	/**
	 * A reference that lists an option the plugin ignores is worse than none.
	 */
	public function test_every_option_it_lists_is_one_the_plugin_reads() {
		$code = $this->plugin_file( 'includes/helpers.php' ) . $this->plugin_file( 'includes/TTA_Helper.php' ) . $this->plugin_file( 'text-to-audio.php' );

		foreach ( Embed::get()['options'] as $option ) {
			$name = $option['name'];
			$read = false !== strpos( $code, "\$atts['" . $name . "']" )
				|| false !== strpos( $code, "\$attr['" . $name . "']" )
				|| false !== strpos( $code, "'" . $name . "'" );

			$this->assertTrue( $read, $name );
		}
	}

	public function test_every_option_explains_itself_with_an_example_that_uses_it() {
		$options = Embed::get()['options'];

		$this->assertCount( 10, $options );
		foreach ( $options as $option ) {
			$this->assertNotEmpty( $option['description'], $option['name'] );
			$this->assertStringStartsWith( '[atlasvoice ', $option['example'] );
			$this->assertStringContainsString( $option['name'] . '="', $option['example'] );
		}
	}

	public function test_an_example_really_renders_a_player() {
		$post = self::factory()->post->create( array( 'post_content' => 'Some words to read aloud.' ) );
		$this->go_to( get_permalink( $post ) );

		$html = do_shortcode( '[atlasvoice text_to_read="Welcome to our shop."]' );

		$this->assertStringNotContainsString( '[atlasvoice', $html );
	}

	public function test_the_route_returns_the_reference_and_only_reads() {
		$response = $this->rest();
		$route    = rest_get_server()->get_routes()['/tta/v1/embed'][0];

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Embed::get(), $response->get_data() );
		$this->assertSame( array( 'GET' => true ), $route['methods'] );
		$this->assertNotEmpty( $route['label'] );
		$this->assertStringContainsString( 'changes nothing', $route['description'] );
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

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Embed_Command::class, WP_CLI::$commands['atlasvoice embed'] );
	}

	public function test_the_command_prints_the_shortcode_and_each_option() {
		( new Embed_Command() )( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'shortcode: [atlasvoice]', $lines );
		$this->assertContains( 'block: AtlasVoice', $lines );
		$this->assertContains( 'id: Reads another post, by its number. Example: [atlasvoice id="128"]', $lines );
		$this->assertCount( 13, $lines );
	}

	public function test_the_command_can_print_json_for_scripts() {
		( new Embed_Command() )( array(), array( 'format' => 'json' ) );

		$this->assertSame( Embed::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}
}
