<?php
/**
 * Tests for the languages of the site: the service class, its REST route
 * and `wp atlasvoice languages` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Languages_Command;
use TTA\Voice\Languages;

/**
 * @covers \TTA\Voice\Languages
 * @covers \TTA_Api\Languages_Controller
 * @covers \TTA\CLI\Languages_Command
 */
class LanguagesTest extends WP_UnitTestCase {

	/**
	 * What the plugin's own detection should report in a test.
	 *
	 * @var array
	 */
	public $found = array();

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( 'tta_listening_settings' );
		\TTA\TTA_Cache::flush();
		$this->found = array();
		add_filter( 'tts_compatible_plugins_data', array( $this, 'detected' ), 99 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_filter( 'tts_compatible_plugins_data', array( $this, 'detected' ), 99 );
		parent::tear_down();
	}

	public function detected() {
		return $this->found;
	}

	private function rest() {
		return rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/tta/v1/languages' ) );
	}

	public function test_a_site_without_a_translation_plugin_has_one_language() {
		$languages = Languages::get();

		$this->assertSame( array( 'site_language', 'site_language_name', 'plugins' ), array_keys( $languages ) );
		$this->assertSame( 'en-US', $languages['site_language'] );
		$this->assertSame( array(), $languages['plugins'] );
	}

	public function test_the_language_is_the_one_saved_for_the_voice() {
		update_option( 'tta_listening_settings', (object) array( 'tta__listening_lang' => 'fr-FR' ) );
		\TTA\TTA_Cache::flush();

		$this->assertSame( 'fr-FR', Languages::get()['site_language'] );
	}

	public function test_the_language_has_a_name_a_person_can_read_when_the_server_knows_it() {
		update_option( 'tta_listening_settings', array( 'tta__listening_lang' => 'fr-FR' ) );
		\TTA\TTA_Cache::flush();

		$name = Languages::get()['site_language_name'];

		if ( class_exists( 'Locale' ) ) {
			$this->assertStringContainsStringIgnoringCase( 'French', $name );
		} else {
			$this->assertSame( 'fr-FR', $name );
		}
	}

	public function test_polylang_and_wpml_languages_are_listed_with_their_names() {
		$this->found = array(
			'polylang/polylang.php' => array(
				'plugin'           => 'polylang',
				'active_languages' => array(
					'en' => array(
						'english_name' => 'English',
						'locale'       => 'en_GB',
					),
					'es' => array(
						'english_name' => 'Español',
						'locale'       => 'es_ES',
					),
				),
			),
		);

		$plugins = Languages::get()['plugins'];

		$this->assertCount( 1, $plugins );
		$this->assertSame( 'polylang', $plugins[0]['id'] );
		$this->assertSame( 'Polylang', $plugins[0]['name'] );
		$this->assertSame( 'pages', $plugins[0]['kind'] );
		$this->assertSame(
			array(
				array(
					'code' => 'en',
					'name' => 'English',
				),
				array(
					'code' => 'es',
					'name' => 'Español',
				),
			),
			$plugins[0]['languages']
		);
	}

	public function test_gtranslate_is_marked_as_translating_in_the_browser() {
		$this->found = array(
			'gtranslate/gtranslate.php' => array(
				'plugin'            => 'gtranslate',
				'allowed_languages' => array( 'en', 'de', 'pt_BR' ),
			),
		);

		$plugin = Languages::get()['plugins'][0];

		$this->assertSame( 'GTranslate', $plugin['name'] );
		$this->assertSame( 'browser', $plugin['kind'] );
		$this->assertSame( array( 'en', 'de', 'pt-BR' ), wp_list_pluck( $plugin['languages'], 'code' ) );
	}

	public function test_translatepress_locales_are_listed() {
		$this->found = array(
			'translatepress-multilingual/index.php' => array(
				'plugin' => 'translatepress',
				'data'   => array( 'en_US', 'it_IT' ),
			),
		);

		$plugin = Languages::get()['plugins'][0];

		$this->assertSame( 'TranslatePress', $plugin['name'] );
		$this->assertSame( array( 'en-US', 'it-IT' ), wp_list_pluck( $plugin['languages'], 'code' ) );
	}

	public function test_a_plugin_that_is_not_a_translation_plugin_is_left_out() {
		$this->found = array(
			'advanced-custom-fields/acf.php' => array(
				'plugin' => 'acf',
				'data'   => array(),
			),
			'something/else.php'             => 'not an array',
		);

		$this->assertSame( array(), Languages::get()['plugins'] );
	}

	public function test_markup_in_a_language_name_is_removed_and_broken_entries_are_skipped() {
		$this->found = array(
			'sitepress-multilingual-cms/sitepress.php' => array(
				'plugin'           => 'sitepress',
				'active_languages' => array(
					'fr'  => array( 'display_name' => '<b>Français</b><script>x</script>' ),
					''    => array( 'display_name' => 'No code' ),
					'de'  => 'not details',
					'<i>' => array( 'english_name' => 'Markup code' ),
				),
			),
		);

		$languages = Languages::get()['plugins'][0]['languages'];

		$this->assertSame( 'fr', $languages[0]['code'] );
		$this->assertSame( 'Français', $languages[0]['name'] );
		$this->assertSame( 'de', $languages[1]['code'] );
		$this->assertStringNotContainsString( '<', wp_json_encode( $languages ) );
		$this->assertCount( 2, $languages );
	}

	public function test_a_very_long_list_is_cut() {
		$codes = array();
		for ( $i = 0; $i < 500; $i++ ) {
			$codes[] = 'l' . $i;
		}
		$this->found = array(
			'gtranslate/gtranslate.php' => array(
				'plugin'            => 'gtranslate',
				'allowed_languages' => $codes,
			),
		);

		$this->assertCount( 200, Languages::get()['plugins'][0]['languages'] );
	}

	// The REST route.

	public function test_the_route_returns_the_languages() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Languages::get(), $response->get_data() );
	}

	public function test_the_route_only_reads_and_describes_itself() {
		$route = rest_get_server()->get_routes()['/tta/v1/languages'][0];

		$this->assertNotEmpty( $route['label'] );
		$this->assertNotEmpty( $route['description'] );
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

		$this->assertSame( Languages_Command::class, WP_CLI::$commands['atlasvoice languages'] );
	}

	public function test_the_command_says_when_no_translation_plugin_is_found() {
		( new Languages_Command() )( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertStringStartsWith( 'posts are read in: en-US', $lines[0] );
		$this->assertSame( 'translation plugins: none found', $lines[1] );
	}

	public function test_the_command_lists_each_plugin_with_its_languages() {
		$this->found = array(
			'gtranslate/gtranslate.php' => array(
				'plugin'            => 'gtranslate',
				'allowed_languages' => array( 'en', 'de' ),
			),
		);

		( new Languages_Command() )( array(), array() );

		$this->assertSame( array( 'line', 'GTranslate (translates in the visitor\'s browser): en, de' ), end( WP_CLI::$log ) );
	}

	public function test_the_command_can_print_json_for_scripts() {
		( new Languages_Command() )( array(), array( 'format' => 'json' ) );

		$this->assertSame( Languages::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}
}
