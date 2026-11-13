<?php
/**
 * Tests for which posts get a player: the service class, its REST routes
 * and `wp atlasvoice where` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Where_Command;
use TTA\Content\Where;

/**
 * @covers \TTA\Content\Where
 * @covers \TTA_Api\Where_Controller
 * @covers \TTA\CLI\Where_Command
 */
class WhereTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Where::OPTION );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	private function stored() {
		return json_decode( wp_json_encode( get_option( Where::OPTION ) ), true );
	}

	/**
	 * What the classic Settings screen stores.
	 */
	private function classic( array $settings = array() ) {
		update_option(
			Where::OPTION,
			(object) array_replace(
				array(
					'tta__settings_enable_button_add'                => true,
					'tta__settings_allow_listening_for_post_types'   => array( 'post' ),
					'tta__settings_allow_listening_for_posts_status' => array( 'publish' ),
					'tta__settings_exclude_post_ids'                 => array(),
					'tta__settings_exclude_categories'               => array(),
					'tta__settings_exclude_wp_tags'                  => array(),
					'tta__settings_atlasvoice_mode'                  => 'live',
					'tta__settings_exclude_tags'                     => 'aside|figure',
				),
				$settings
			)
		);
		\TTA\TTA_Cache::flush();
	}

	private function term( $taxonomy, $name ) {
		$term = self::factory()->term->create_and_get(
			array(
				'taxonomy' => $taxonomy,
				'name'     => $name,
			)
		);
		\TTA\TTA_Cache::flush();

		return $term->slug;
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/where' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Reading.

	public function test_a_site_that_never_saved_adds_the_player_automatically() {
		$where = Where::get();

		$this->assertTrue( $where['automatic'] );
		$this->assertSame( array(), $where['post_types'] );
		$this->assertSame( array(), $where['skip_posts'] );
	}

	public function test_it_reads_what_the_classic_screen_saved() {
		$post = self::factory()->post->create( array( 'post_title' => 'About <b>us</b>' ) );
		$this->classic(
			array(
				'tta__settings_enable_button_add'              => false,
				'tta__settings_allow_listening_for_post_types' => array( 'post', 'page' ),
				'tta__settings_exclude_categories'             => array( 'podcasts' ),
				'tta__settings_exclude_wp_tags'                => array( 'video' ),
				// The classic textarea stores numbers as text, sometimes with a space.
				'tta__settings_exclude_post_ids'               => array( (string) $post, ' 999999', '' ),
			)
		);

		$where = Where::get();

		$this->assertFalse( $where['automatic'] );
		$this->assertSame( array( 'post', 'page' ), $where['post_types'] );
		$this->assertSame( array( 'publish' ), $where['statuses'] );
		$this->assertSame( array( 'podcasts' ), $where['skip_categories'] );
		$this->assertSame( array( 'video' ), $where['skip_tags'] );
		$this->assertSame( array( $post, 999999 ), $where['skip_posts'] );
		$this->assertSame(
			array(
				array(
					'id'    => $post,
					'title' => 'About us',
				),
				array(
					'id'    => 999999,
					'title' => '',
				),
			),
			$where['skipped_posts']
		);
	}

	public function test_it_reads_settings_stored_as_an_array_or_broken() {
		update_option( Where::OPTION, array( 'tta__settings_allow_listening_for_post_types' => 'post' ) );

		$this->assertSame( array(), Where::get()['post_types'] );
	}

	public function test_it_lists_what_can_be_chosen_on_this_site() {
		$category = $this->term( 'category', 'Podcasts' );
		$tag      = $this->term( 'post_tag', 'Video' );
		// The pick list of categories holds the ones that have posts, as on the classic screen.
		self::factory()->post->create( array( 'post_category' => array( get_category_by_slug( $category )->term_id ) ) );
		\TTA\TTA_Cache::flush();

		$choices = Where::get()['choices'];

		$this->assertContains(
			array(
				'id'   => 'post',
				'name' => 'Posts',
			),
			$choices['post_types']
		);
		$this->assertContains( 'publish', wp_list_pluck( $choices['statuses'], 'id' ) );
		$this->assertSame( 'Podcasts', array_column( $choices['categories'], 'name', 'id' )[ $category ] );
		$this->assertSame( 'Video', array_column( $choices['tags'], 'name', 'id' )[ $tag ] );
	}

	// Saving.

	public function test_a_save_writes_the_fields_the_classic_screen_reads() {
		$this->classic();
		$category = $this->term( 'category', 'Podcasts' );
		$tag      = $this->term( 'post_tag', 'Video' );

		$saved = Where::save(
			array(
				'post_types'      => array( 'post', 'page' ),
				'skip_categories' => array( $category ),
				'skip_tags'       => array( $tag ),
				'skip_posts'      => array( 12, '128', 12 ),
			)
		);

		$stored = $this->stored();
		$this->assertSame( array( 'post', 'page' ), $stored['tta__settings_allow_listening_for_post_types'] );
		$this->assertSame( array( $category ), $stored['tta__settings_exclude_categories'] );
		$this->assertSame( array( $tag ), $stored['tta__settings_exclude_wp_tags'] );
		$this->assertSame( array( '12', '128' ), $stored['tta__settings_exclude_post_ids'] );
		$this->assertSame( array( 12, 128 ), $saved['skip_posts'] );
	}

	public function test_a_save_keeps_every_other_stored_setting_and_the_shape() {
		$this->classic();
		$before = $this->stored();

		Where::save( array( 'automatic' => false ) );

		$before['tta__settings_enable_button_add'] = false;
		$this->assertSame( $before, $this->stored() );
		$this->assertIsObject( get_option( Where::OPTION ) );
	}

	public function test_the_player_follows_what_was_saved() {
		$this->classic();
		$category = $this->term( 'category', 'Podcasts' );
		$inside   = self::factory()->post->create( array( 'post_category' => array( get_category_by_slug( $category )->term_id ) ) );
		$outside  = self::factory()->post->create();
		$page     = self::factory()->post->create( array( 'post_type' => 'page' ) );

		Where::save(
			array(
				'skip_categories' => array( $category ),
				'skip_posts'      => array( $outside ),
			)
		);

		$shown = function ( $id ) {
			$this->go_to( get_permalink( $id ) );
			$GLOBALS['post'] = get_post( $id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- the player reads the global post.
			add_filter( 'tts_show_player_in_staging', '__return_true' );

			return \TTA\TTA_Helper::should_load_button( $id, 'test', $reason ) ? 'shown' : $reason;
		};

		$this->assertStringContainsString( 'categor', (string) $shown( $inside ) );
		$this->assertNotSame( 'shown', $shown( $outside ) );
		$this->assertNotSame( 'shown', $shown( $page ) );

		Where::save(
			array(
				'post_types'      => array( 'post', 'page' ),
				'skip_categories' => array(),
				'skip_posts'      => array(),
			)
		);

		$this->assertSame( 'shown', $shown( $inside ) );
		$this->assertSame( 'shown', $shown( $outside ) );
		$this->assertSame( 'shown', $shown( $page ) );
	}

	public function test_lists_can_be_given_as_text_separated_by_commas() {
		$this->classic();

		$saved = Where::save(
			array(
				'post_types' => 'post, page',
				'skip_posts' => '12,128',
			)
		);

		$this->assertSame( array( 'post', 'page' ), $saved['post_types'] );
		$this->assertSame( array( 12, 128 ), $saved['skip_posts'] );
	}

	public function test_a_stored_slug_of_a_deleted_category_can_stay_in_the_list() {
		$this->classic( array( 'tta__settings_exclude_categories' => array( 'gone' ) ) );
		$category = $this->term( 'category', 'Podcasts' );

		$saved = Where::save( array( 'skip_categories' => array( 'gone', $category ) ) );

		$this->assertSame( array( 'gone', $category ), $saved['skip_categories'] );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		$this->classic();
		$before = $this->stored();

		$result = Where::save(
			array(
				'automatic' => false,
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
			'an unknown content type' => array( 'post_types', array( 'post', 'spaceship' ) ),
			'no content type'         => array( 'post_types', array() ),
			'no status'               => array( 'statuses', array() ),
			'an unknown status'       => array( 'statuses', array( 'vanished' ) ),
			'an unknown category'     => array( 'skip_categories', array( 'nope' ) ),
			'an unknown tag'          => array( 'skip_tags', array( '<script>' ) ),
			'a list in a list'        => array( 'skip_tags', array( array( 'x' ) ) ),
			'a post by its title'     => array( 'skip_posts', array( 'About us' ) ),
			'a negative post'         => array( 'skip_posts', array( -4 ) ),
			'post zero'               => array( 'skip_posts', array( 0 ) ),
			'too many posts'          => array( 'skip_posts', range( 1, 501 ) ),
			'a list as a number'      => array( 'post_types', 7 ),
			'automatic as a word'     => array( 'automatic', 'maybe' ),
			'an unknown setting'      => array( 'tta__settings_atlasvoice_mode', 'live' ),
		);
	}

	public function test_an_error_never_echoes_markup() {
		$result = Where::save( array( 'skip_tags' => array( '<b>x</b>' ) ) );

		$this->assertStringNotContainsString( '<', $result->get_error_message() );
	}

	public function test_an_empty_save_is_refused() {
		$result = Where::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// The REST routes.

	public function test_get_returns_the_settings() {
		$this->classic();

		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Where::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent() {
		$this->classic();

		$response = $this->rest( 'POST', array( 'skip_posts' => array( 12, 128 ) ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 12, 128 ), $response->get_data()['skip_posts'] );
		$this->assertSame( array( 'post' ), $response->get_data()['post_types'] );
		$this->assertTrue( $this->stored()['tta__settings_enable_button_add'] );
	}

	public function test_post_can_empty_a_skip_list() {
		$this->classic( array( 'tta__settings_exclude_post_ids' => array( '12' ) ) );

		$response = $this->rest( 'POST', array( 'skip_posts' => array() ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $this->stored()['tta__settings_exclude_post_ids'] );
	}

	public function test_post_refuses_a_wrong_value() {
		$this->classic();

		$this->assertSame( 400, $this->rest( 'POST', array( 'post_types' => array( 'spaceship' ) ) )->get_status() );
		$this->assertSame( 400, $this->rest( 'POST', array( 'skip_posts' => array( 'About us' ) ) )->get_status() );
	}

	public function test_each_method_and_each_setting_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/where'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertSame( array_keys( Where::FIELDS ), array_keys( $routes[1]['args'] ) );
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
		$this->assertContains( $this->rest( 'POST', array( 'automatic' => false ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Where::OPTION ) );
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

		$this->assertSame( Where_Command::class, WP_CLI::$commands['atlasvoice where'] );
	}

	public function test_get_prints_the_settings() {
		$this->classic( array( 'tta__settings_exclude_post_ids' => array( '12', '128' ) ) );

		( new Where_Command() )->get( array(), array() );

		$this->assertSame(
			array( 'automatic: on', 'content types: post', 'statuses: publish', 'skipped categories: none', 'skipped tags: none', 'skipped posts: 12, 128' ),
			wp_list_pluck( WP_CLI::$log, 1 )
		);
	}

	public function test_get_can_print_json_without_the_pick_lists() {
		( new Where_Command() )->get( array(), array( 'format' => 'json' ) );

		$printed = json_decode( end( WP_CLI::$log )[1], true );
		$this->assertArrayNotHasKey( 'choices', $printed );
		$this->assertTrue( $printed['automatic'] );
	}

	public function test_set_saves_what_was_given_and_none_empties_a_list() {
		$this->classic( array( 'tta__settings_exclude_post_ids' => array( '12' ) ) );

		( new Where_Command() )->set(
			array(),
			array(
				'post-types' => 'post,page',
				'skip-posts' => 'none',
				'automatic'  => 'off',
			)
		);

		$this->assertSame( array( 'success', 'Saved.' ), end( WP_CLI::$log ) );
		$where = Where::get();
		$this->assertSame( array( 'post', 'page' ), $where['post_types'] );
		$this->assertSame( array(), $where['skip_posts'] );
		$this->assertFalse( $where['automatic'] );
	}

	public function test_set_says_which_value_was_refused_and_why() {
		try {
			( new Where_Command() )->set( array(), array( 'post-types' => 'spaceship' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'post_types: This site has nothing called "spaceship"', WP_CLI::$log[0][1] );
	}
}
