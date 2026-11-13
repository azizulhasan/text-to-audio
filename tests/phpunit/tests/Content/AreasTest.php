<?php
/**
 * Tests for the part of a page that is read aloud: the service class, its
 * REST routes and `wp atlasvoice areas` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Areas_Command;
use TTA\CLI\Commands;
use TTA\Content\Areas;

/**
 * @covers \TTA\Content\Areas
 * @covers \TTA_Api\Areas_Controller
 * @covers \TTA\CLI\Areas_Command
 */
class AreasTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Areas::OPTION );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	private function stored() {
		return json_decode( wp_json_encode( get_option( Areas::OPTION ) ), true );
	}

	/**
	 * What the picker and the classic screen store.
	 */
	private function classic( array $settings = array() ) {
		update_option(
			Areas::OPTION,
			(object) array_replace(
				array(
					'tta__settings_css_selectors'      => '.entry-content',
					'tta__settings_exclude_content_by_css_selectors' => ".share-bar\n.author-box",
					'tta__settings_exclude_tags'       => 'aside|figure|table',
					'tta__settings_exclude_texts'      => 'Share this|Read more',
					'tta__settings_atlasvoice_per_type_overrides' => array(),
					'tta__settings_atlasvoice_mode'    => 'live',
					'tta__settings_exclude_categories' => array( 'podcasts' ),
				),
				$settings
			)
		);
		\TTA\TTA_Cache::flush();
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/areas' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Reading.

	public function test_a_site_that_never_set_a_rule_lets_the_player_find_the_text() {
		$areas = Areas::get();

		$this->assertSame( '', $areas['selector'] );
		$this->assertSame( array(), $areas['skip_areas'] );
		$this->assertSame( array(), $areas['skip_tags'] );
		$this->assertSame( array(), $areas['skip_phrases'] );
		$this->assertSame( array(), $areas['types'] );
		$this->assertFalse( $areas['types_applied'] );
	}

	public function test_it_reads_the_stored_rule_as_a_text_and_lists() {
		$this->classic();

		$areas = Areas::get();

		$this->assertSame( '.entry-content', $areas['selector'] );
		$this->assertSame( array( '.share-bar', '.author-box' ), $areas['skip_areas'] );
		$this->assertSame( array( 'aside', 'figure', 'table' ), $areas['skip_tags'] );
		$this->assertSame( array( 'Share this', 'Read more' ), $areas['skip_phrases'] );
	}

	public function test_it_reads_the_rule_the_same_way_the_player_does() {
		$this->classic(
			array(
				'tta__settings_exclude_content_by_css_selectors' => ".share-bar\r\n\r\n .author-box |.toc",
				'tta__settings_exclude_tags'  => 'aside, figure;table  nav',
				'tta__settings_exclude_texts' => array( 'Share this', ' Read more ' ),
			)
		);
		$post = self::factory()->post->create();

		$areas    = Areas::get();
		$resolved = \TTA\AtlasVoice\RuleResolver::resolve( $post );

		$this->assertSame( $resolved['tta__settings_exclude_content_by_css_selectors'], $areas['skip_areas'] );
		$this->assertSame( $resolved['tta__settings_exclude_tags'], $areas['skip_tags'] );
		$this->assertSame( $resolved['tta__settings_exclude_texts'], $areas['skip_phrases'] );
		$this->assertSame( $resolved['tta__settings_css_selectors'], $areas['selector'] );
	}

	public function test_it_lists_the_rules_of_single_content_types() {
		$this->classic(
			array(
				'tta__settings_atlasvoice_per_type_overrides' => array(
					'page'    => array(
						'tta__settings_css_selectors' => 'main .page-body',
						'tta__settings_exclude_tags'  => 'figure',
					),
					'gone'    => array( 'tta__settings_css_selectors' => '.x' ),
					'product' => 'broken',
				),
			)
		);

		$types = Areas::get()['types'];

		$this->assertCount( 2, $types );
		$this->assertSame( 'page', $types[0]['post_type'] );
		$this->assertSame( 'Pages', $types[0]['name'] );
		$this->assertSame( 'main .page-body', $types[0]['selector'] );
		$this->assertSame( array( 'figure' ), $types[0]['skip_tags'] );
		// A content type that no longer exists is shown by its slug.
		$this->assertSame( 'gone', $types[1]['name'] );
	}

	public function test_markup_in_a_stored_rule_is_not_sent_to_the_screen() {
		$this->classic( array( 'tta__settings_exclude_texts' => 'Share <script>alert(1)</script>this' ) );

		$this->assertStringNotContainsString( '<', wp_json_encode( Areas::get() ) );
	}

	// Saving.

	public function test_a_save_writes_the_shapes_the_picker_and_the_player_use() {
		$this->classic();

		$saved = Areas::save(
			array(
				'selector'     => ' article .story ',
				'skip_areas'   => array( '.share-bar', '#comments > .intro' ),
				'skip_tags'    => array( 'Figure', 'aside' ),
				'skip_phrases' => array( 'Share this', 'Read more, here' ),
			)
		);

		$stored = $this->stored();
		$this->assertSame( 'article .story', $stored['tta__settings_css_selectors'] );
		$this->assertSame( ".share-bar\n#comments > .intro", $stored['tta__settings_exclude_content_by_css_selectors'] );
		$this->assertSame( 'figure|aside', $stored['tta__settings_exclude_tags'] );
		$this->assertSame( 'Share this|Read more, here', $stored['tta__settings_exclude_texts'] );
		$this->assertSame( array( '.share-bar', '#comments > .intro' ), $saved['skip_areas'] );
	}

	public function test_a_save_keeps_every_other_stored_setting_and_the_shape() {
		$this->classic();
		$before = $this->stored();

		Areas::save( array( 'skip_phrases' => array( 'Advertisement' ) ) );

		$before['tta__settings_exclude_texts'] = 'Advertisement';
		$this->assertSame( $before, $this->stored() );
		$this->assertIsObject( get_option( Areas::OPTION ) );
	}

	public function test_the_player_applies_the_rule_that_was_saved() {
		$this->classic();
		$post = self::factory()->post->create();

		Areas::save(
			array(
				'selector'   => '#main .story',
				'skip_areas' => array( '.promo' ),
			)
		);

		$resolved = \TTA\AtlasVoice\RuleResolver::resolve( $post );

		$this->assertSame( '#main .story', $resolved['tta__settings_css_selectors'] );
		$this->assertSame( array( '.promo' ), $resolved['tta__settings_exclude_content_by_css_selectors'] );
		$this->assertSame( array( 'aside', 'figure', 'table' ), $resolved['tta__settings_exclude_tags'] );
	}

	public function test_an_empty_selector_and_empty_lists_can_be_saved() {
		$this->classic();

		$saved = Areas::save(
			array(
				'selector'   => '',
				'skip_areas' => array(),
				'skip_tags'  => array( '', '  ' ),
			)
		);

		$this->assertSame( '', $saved['selector'] );
		$this->assertSame( array(), $saved['skip_areas'] );
		$this->assertSame( '', $this->stored()['tta__settings_exclude_tags'] );
	}

	public function test_lists_can_be_given_as_one_text() {
		$this->classic();

		$saved = Areas::save( array( 'skip_tags' => 'figure|aside|figure' ) );

		$this->assertSame( array( 'figure', 'aside' ), $saved['skip_tags'] );
	}

	public function test_the_rules_of_content_types_are_not_touched() {
		$overrides = array( 'page' => array( 'tta__settings_css_selectors' => 'main .page-body' ) );
		$this->classic( array( 'tta__settings_atlasvoice_per_type_overrides' => $overrides ) );

		Areas::save( array( 'selector' => '.story' ) );

		$this->assertSame( $overrides, $this->stored()['tta__settings_atlasvoice_per_type_overrides'] );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		$this->classic();
		$before = $this->stored();

		$result = Areas::save(
			array(
				'skip_tags' => array( 'nav' ),
				$field      => $value,
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( sanitize_key( $field ), $result->get_error_data()['field'] );
		$this->assertSame( $before, $this->stored() );
	}

	public function wrong_values() {
		return array(
			'markup as a selector'    => array( 'selector', '<script>alert(1)</script>' ),
			'a css rule as a selector' => array( 'selector', '.x{display:none}' ),
			'two lines as a selector' => array( 'selector', ".a\n.b" ),
			'a selector too long'     => array( 'selector', str_repeat( 'a', 2049 ) ),
			'a selector as a list'    => array( 'selector', array( '.a' ) ),
			'markup as an area'       => array( 'skip_areas', array( '.a', '<b>' ) ),
			'a tag with markup'       => array( 'skip_tags', array( '<figure>' ) ),
			'a tag with a class'      => array( 'skip_tags', array( 'div.promo' ) ),
			'a phrase too long'       => array( 'skip_phrases', array( str_repeat( 'a', 201 ) ) ),
			'a phrase as a list'      => array( 'skip_phrases', array( array( 'x' ) ) ),
			'a list as a number'      => array( 'skip_areas', 7 ),
			'too many items'          => array( 'skip_phrases', array_map( 'strval', range( 1, 101 ) ) ),
			'a content type rule'     => array( 'types', array() ),
			'an unknown setting'      => array( 'tta__settings_atlasvoice_mode', 'live' ),
		);
	}

	public function test_markup_in_a_phrase_is_removed() {
		$this->classic();

		$saved = Areas::save( array( 'skip_phrases' => array( '<b>Share this</b>' ) ) );

		$this->assertSame( array( 'Share this' ), $saved['skip_phrases'] );
	}

	public function test_an_empty_save_is_refused() {
		$result = Areas::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// The REST routes.

	public function test_get_returns_the_rules() {
		$this->classic();

		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Areas::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent_and_can_empty_a_list() {
		$this->classic();

		$response = $this->rest(
			'POST',
			array(
				'selector'     => '.story',
				'skip_phrases' => array(),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '.story', $response->get_data()['selector'] );
		$this->assertSame( array(), $response->get_data()['skip_phrases'] );
		$this->assertSame( 'aside|figure|table', $this->stored()['tta__settings_exclude_tags'] );
	}

	public function test_post_refuses_a_wrong_value() {
		$this->classic();

		$this->assertSame( 400, $this->rest( 'POST', array( 'selector' => '.x{}' ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'skip_tags' => array( 'div.promo' ) ) )->get_status() );
		$this->assertSame( '.entry-content', $this->stored()['tta__settings_css_selectors'] );
	}

	public function test_each_method_and_each_part_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/areas'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertSame( array_keys( Areas::FIELDS ), array_keys( $routes[1]['args'] ) );
		foreach ( $routes[1]['args'] as $name => $arg ) {
			$this->assertNotEmpty( $arg['description'], $name );
		}
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_it( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'selector' => '.x' ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Areas::OPTION ) );
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

		$this->assertSame( Areas_Command::class, WP_CLI::$commands['atlasvoice areas'] );
	}

	public function test_get_prints_the_rule() {
		$this->classic(
			array(
				'tta__settings_atlasvoice_per_type_overrides' => array( 'page' => array( 'tta__settings_css_selectors' => 'main' ) ),
			)
		);

		( new Areas_Command() )->get( array(), array() );

		$this->assertSame(
			array(
				'whole site: reads .entry-content',
				'skipped areas: .share-bar, .author-box',
				'skipped element types: aside, figure, table',
				'skipped phrases: Share this, Read more',
				'page: reads main (stored, not applied on this site)',
			),
			wp_list_pluck( WP_CLI::$log, 1 )
		);
	}

	public function test_get_can_print_json_for_scripts() {
		( new Areas_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Areas::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_set_saves_what_was_given_and_none_empties() {
		$this->classic();

		( new Areas_Command() )->set(
			array(),
			array(
				'selector'     => 'none',
				'skip-areas'   => '.promo|.ad',
				'skip-phrases' => 'none',
			)
		);

		$this->assertSame( array( 'success', 'Saved.' ), end( WP_CLI::$log ) );
		$areas = Areas::get();
		$this->assertSame( '', $areas['selector'] );
		$this->assertSame( array( '.promo', '.ad' ), $areas['skip_areas'] );
		$this->assertSame( array(), $areas['skip_phrases'] );
	}

	public function test_set_says_which_value_was_refused_and_why() {
		try {
			( new Areas_Command() )->set( array(), array( 'skip-tags' => 'div.promo' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'skip_tags: An element type is a name', WP_CLI::$log[0][1] );
	}
}
