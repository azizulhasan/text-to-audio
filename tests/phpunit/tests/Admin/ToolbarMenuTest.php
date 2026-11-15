<?php
/**
 * Tests for the AtlasVoice menu of the WordPress toolbar (TTS-347): the line
 * that says what the mode means, and "Hide the player on this post".
 *
 * @package TTA
 */

use TTA\AtlasVoice\Mode;
use TTA\Content\Where;
use TTA\Editor\Post_Panel;

/**
 * @covers \TTA\AtlasVoice\Mode::render_bar_node
 * @covers \TTA\Editor\Post_Panel::toolbar_toggle
 * @covers \TTA\Editor\Post_Panel::handle_toolbar_toggle
 */
class ToolbarMenuTest extends WP_UnitTestCase {

	const SETTINGS = 'tta_settings_data';

	public function set_up() {
		parent::set_up();
		require_once ABSPATH . WPINC . '/class-wp-admin-bar.php';
		if ( ! defined( 'ATLASVOICE_TESTING' ) ) {
			define( 'ATLASVOICE_TESTING', true );
		}
		update_option(
			self::SETTINGS,
			(object) array(
				'tta__settings_allow_listening_for_post_types' => array( 'post' ),
				'tta__settings_exclude_post_ids'               => array(),
				'tta__settings_show_mode_bar'                  => true,
			)
		);
		\TTA\TTA_Cache::flush();
		add_filter( 'tts_show_atlasvoice_mode_bar', '__return_true' );
		add_filter( 'atlasvoice_show_bar_when_off', '__return_true' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	public function tear_down() {
		remove_filter( 'tts_show_atlasvoice_mode_bar', '__return_true' );
		remove_filter( 'atlasvoice_show_bar_when_off', '__return_true' );
		remove_all_filters( 'wp_redirect' );
		delete_option( self::SETTINGS );
		\TTA\TTA_Cache::flush();
		$_GET = array();
		parent::tear_down();
	}

	/**
	 * The items of the AtlasVoice menu: id suffix => title.
	 */
	private function menu() {
		$bar = new WP_Admin_Bar();
		Mode::render_bar_node( $bar );
		$items = array();
		foreach ( (array) $bar->get_nodes() as $node ) {
			if ( Mode::BAR_NODE_ID === $node->parent ) {
				$items[ substr( $node->id, strlen( Mode::BAR_NODE_ID ) + 1 ) ] = $node;
			}
		}

		return $items;
	}

	private function hidden() {
		return array_map( 'intval', (array) Where::get()['skip_posts'] );
	}

	public function test_the_menu_ends_with_open_atlasvoice() {
		$menu = $this->menu();

		$this->assertArrayHasKey( 'settings', $menu );
		$this->assertSame( 'Open AtlasVoice', $menu['settings']->title );
	}

	public function test_the_menu_says_what_the_mode_means_and_names_the_switch_the_new_way() {
		$menu = $this->menu();

		if ( isset( $menu['go-live'] ) ) {
			$this->assertSame( 'Only you can see the player.', $menu['note']->title );
			$this->assertSame( 'Go live…', $menu['go-live']->title );
		} elseif ( isset( $menu['revert'] ) ) {
			$this->assertSame( 'Visitors hear your posts.', $menu['note']->title );
			$this->assertSame( 'Back to staging…', $menu['revert']->title );
		} else {
			$this->assertArrayNotHasKey( 'note', $menu, 'A site with AtlasVoice off has no mode to explain.' );
		}
		if ( isset( $menu['note'] ) ) {
			$this->assertEmpty( $menu['note']->href, 'The line is words, not a link.' );
		}
	}

	public function test_on_a_post_the_menu_offers_to_hide_the_player_there() {
		$post_id = self::factory()->post->create();
		$this->go_to( get_permalink( $post_id ) );

		$menu = $this->menu();

		$this->assertSame( 'Hide the player on this post', $menu['post-player']->title );
		$this->assertStringContainsString( 'action=' . Post_Panel::TOGGLE_ACTION, $menu['post-player']->href );
		$this->assertStringContainsString( 'post=' . $post_id, $menu['post-player']->href );
		$this->assertStringContainsString( 'shown=0', $menu['post-player']->href );
		$this->assertStringContainsString( '_wpnonce=', $menu['post-player']->href );
	}

	public function test_on_a_post_where_it_is_hidden_the_menu_offers_to_show_it() {
		$post_id = self::factory()->post->create();
		Post_Panel::show_player( $post_id, false );
		$this->go_to( get_permalink( $post_id ) );

		$menu = $this->menu();

		$this->assertSame( 'Show the player on this post', $menu['post-player']->title );
		$this->assertStringContainsString( 'shown=1', $menu['post-player']->href );
	}

	public function test_where_no_single_post_is_open_there_is_no_such_item() {
		$this->go_to( home_url( '/' ) );

		$this->assertArrayNotHasKey( 'post-player', $this->menu() );
		$this->assertNull( Post_Panel::toolbar_toggle() );
	}

	public function test_someone_who_cannot_edit_the_post_gets_no_such_item() {
		$post_id = self::factory()->post->create();
		$this->go_to( get_permalink( $post_id ) );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertNull( Post_Panel::toolbar_toggle() );
	}

	public function test_a_press_hides_the_player_and_goes_back_to_the_page() {
		$post_id = self::factory()->post->create();
		$back    = get_permalink( $post_id );
		$went    = '';
		add_filter(
			'wp_redirect',
			static function ( $location ) use ( &$went ) {
				$went = $location;

				return false;
			}
		);
		$_GET = array(
			'post'     => (string) $post_id,
			'shown'    => '0',
			'back'     => rawurlencode( $back ),
			'_wpnonce' => wp_create_nonce( Post_Panel::TOGGLE_ACTION . '_' . $post_id ),
		);
		$_REQUEST = $_GET;

		Post_Panel::handle_toolbar_toggle();

		$this->assertSame( array( $post_id ), $this->hidden() );
		$this->assertSame( $back, $went );
	}

	public function test_a_press_never_leaves_the_site() {
		$post_id = self::factory()->post->create();
		$went    = '';
		add_filter(
			'wp_redirect',
			static function ( $location ) use ( &$went ) {
				$went = $location;

				return false;
			}
		);
		$_GET = array(
			'post'     => (string) $post_id,
			'shown'    => '0',
			'back'     => rawurlencode( 'https://evil.example/phish' ),
			'_wpnonce' => wp_create_nonce( Post_Panel::TOGGLE_ACTION . '_' . $post_id ),
		);
		$_REQUEST = $_GET;

		Post_Panel::handle_toolbar_toggle();

		$this->assertStringNotContainsString( 'evil.example', $went );
	}

	public function test_a_press_without_its_nonce_changes_nothing() {
		$post_id  = self::factory()->post->create();
		$_GET     = array(
			'post'     => (string) $post_id,
			'shown'    => '0',
			'_wpnonce' => 'wrong',
		);
		$_REQUEST = $_GET;

		try {
			Post_Panel::handle_toolbar_toggle();
			$this->fail( 'It went on without a valid nonce.' );
		} catch ( WPDieException $stopped ) {
			unset( $stopped );
		}

		$this->assertSame( array(), $this->hidden() );
	}

	public function test_a_press_by_someone_who_cannot_edit_the_post_changes_nothing() {
		$post_id = self::factory()->post->create();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$_GET     = array(
			'post'     => (string) $post_id,
			'shown'    => '0',
			'_wpnonce' => wp_create_nonce( Post_Panel::TOGGLE_ACTION . '_' . $post_id ),
		);
		$_REQUEST = $_GET;

		try {
			Post_Panel::handle_toolbar_toggle();
			$this->fail( 'It went on without the right to edit the post.' );
		} catch ( WPDieException $stopped ) {
			unset( $stopped );
		}

		$this->assertSame( array(), $this->hidden() );
	}
}
