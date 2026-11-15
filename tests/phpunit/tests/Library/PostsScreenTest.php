<?php
/**
 * Tests for the "Audio" column of the WordPress Posts list (TTS-347).
 *
 * @package TTA
 */

use TTA\Cloud\Cloud;
use TTA\Cloud\Jobs;
use TTA\Library\Posts;
use TTA\Library\Posts_Screen;
use TTA\TTA_AtlasVoice_Service as Service;
use TTA_Admin\Admin_App;

/**
 * @covers \TTA\Library\Posts_Screen
 * @covers \TTA\Library\Posts::status_meta_query
 */
class PostsScreenTest extends WP_UnitTestCase {

	const SETTINGS = 'tta_settings_data';

	/** @var string[] The requests that tried to leave the site. */
	private $sent = array();

	public function set_up() {
		parent::set_up();
		Cloud::reset();
		if ( ! defined( 'ATLASVOICE_TESTING' ) ) {
			define( 'ATLASVOICE_TESTING', true );
		}
		update_option( self::SETTINGS, (object) array( 'tta__settings_allow_listening_for_post_types' => array( 'post' ) ) );
		update_option( 'tta_listening_settings', array( 'tta__listening_lang' => 'en' ) );
		delete_option( Service::OPTION );
		\TTA\TTA_Cache::flush();
		$this->use_player( 3 );
		$this->sent = array();
		add_filter( 'pre_http_request', array( $this, 'refuse' ), 10, 3 );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'refuse' ), 10 );
		remove_all_filters( 'tts_get_player_id' );
		remove_all_filters( 'atlasvoice_admin_ui' );
		remove_all_filters( 'wp_redirect' );
		delete_option( self::SETTINGS );
		delete_option( Service::OPTION );
		\TTA\TTA_Cache::flush();
		$_GET     = array();
		$_REQUEST = array();
		parent::tear_down();
	}

	public function refuse( $pre, $args, $url ) {
		$this->sent[] = $url;

		return new WP_Error( 'test_offline', 'No network in this test.' );
	}

	private function use_player( $player_id ) {
		remove_all_filters( 'tts_get_player_id' );
		add_filter(
			'tts_get_player_id',
			static function () use ( $player_id ) {
				return $player_id;
			}
		);
	}

	private function connect() {
		update_option(
			Service::OPTION,
			array(
				'consent' => true,
				'api_key' => 'av_live_secret_key_value_0123456789',
			),
			false
		);
	}

	private function post( array $more = array() ) {
		return get_post( self::factory()->post->create( array( 'post_title' => 'A post' ) + $more ) );
	}

	private function column( WP_Post $post ) {
		ob_start();
		Posts_Screen::render_column( Posts_Screen::COLUMN, $post->ID );

		return (string) ob_get_clean();
	}

	// ---- when it shows ---------------------------------------------------------

	public function test_the_column_is_for_the_new_admin_and_a_voice_that_stores_audio() {
		$new = static function () {
			return Admin_App::UI_NEW;
		};

		$this->assertFalse( Posts_Screen::is_active(), 'The classic admin keeps its own column.' );

		add_filter( 'atlasvoice_admin_ui', $new );
		$this->assertSame( Admin_App::is_enabled(), Posts_Screen::is_active() );

		$this->use_player( 1 );
		$this->assertFalse( Posts_Screen::is_active(), 'The browser voice stores nothing to describe.' );
	}

	public function test_the_column_stands_before_the_date() {
		$columns = Posts_Screen::add_column(
			array(
				'title' => 'Title',
				'date'  => 'Date',
			)
		);

		$this->assertSame( array( 'title', Posts_Screen::COLUMN, 'date' ), array_keys( $columns ) );
		$this->assertSame( 'Audio', $columns[ Posts_Screen::COLUMN ] );
		$this->assertArrayHasKey( Posts_Screen::COLUMN, Posts_Screen::add_column( array( 'title' => 'Title' ) ) );
	}

	// ---- what a post says ------------------------------------------------------

	public function test_a_post_without_audio_says_when_it_is_made() {
		$state = Posts_Screen::describe( $this->post() );

		$this->assertSame( array( 'missing', 'No audio yet', 'Made on the first play.' ), array( $state['status'], $state['label'], $state['note'] ) );
		$this->assertSame( '', $state['action'], 'Without jobs there is nothing to start from the list.' );
	}

	public function test_a_post_with_audio_is_ready() {
		$post = $this->post();
		update_post_meta( $post->ID, Posts::MARK, true );

		$state = Posts_Screen::describe( $post );

		$this->assertSame( array( 'ready', 'Ready', '', 'ok' ), array( $state['status'], $state['label'], $state['note'], $state['tone'] ) );
	}

	public function test_a_draft_says_that_audio_comes_from_the_published_page() {
		$state = Posts_Screen::describe( $this->post( array( 'post_status' => 'draft' ) ) );

		$this->assertSame( array( 'draft', 'Not published', '' ), array( $state['status'], $state['label'], $state['action'] ) );
	}

	public function test_a_switched_off_post_says_so_and_has_no_action() {
		$this->connect();
		$post = $this->post();
		update_post_meta( $post->ID, Jobs::OFF_META, '1' );

		$state = Posts_Screen::describe( $post );

		$this->assertSame( 'Switched off for this post.', $state['note'] );
		$this->assertSame( '', $state['action'] );
	}

	public function test_on_a_connected_site_each_state_has_its_action() {
		$this->connect();
		$post = $this->post();
		$this->assertSame( 'Make audio', Posts_Screen::describe( $post )['action'] );

		update_post_meta( $post->ID, Posts::MARK, true );
		$this->assertSame( 'Make again', Posts_Screen::describe( $post )['action'] );
	}

	public function test_someone_who_cannot_edit_the_post_gets_no_action() {
		$this->connect();
		$post = $this->post();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertSame( '', Posts_Screen::describe( $post )['action'] );
	}

	public function test_the_column_draws_the_state_and_its_line_escaped() {
		$post = $this->post();
		$html = $this->column( $post );

		$this->assertStringContainsString( '<span class="atlasvoice-list-chip">No audio yet</span>', $html );
		$this->assertStringContainsString( '<span class="atlasvoice-list-note">Made on the first play.</span>', $html );

		update_post_meta( $post->ID, Posts::MARK, true );
		$this->assertStringContainsString( 'atlasvoice-list-chip is-ok', $this->column( $post ) );

		ob_start();
		Posts_Screen::render_column( 'title', $post->ID );
		$this->assertSame( '', ob_get_clean(), 'Other columns are left alone.' );
	}

	// ---- the row action --------------------------------------------------------

	public function test_the_row_action_is_a_signed_link_for_this_post() {
		$this->connect();
		$post    = $this->post();
		$actions = Posts_Screen::row_action( array( 'edit' => 'Edit' ), $post );

		$this->assertArrayHasKey( 'atlasvoice_audio', $actions );
		$this->assertStringContainsString( '>Make audio</a>', $actions['atlasvoice_audio'] );
		$this->assertStringContainsString( 'action=' . Posts_Screen::MAKE_ACTION, $actions['atlasvoice_audio'] );
		$this->assertStringContainsString( 'post=' . $post->ID, $actions['atlasvoice_audio'] );
		$this->assertStringContainsString( '_wpnonce=', $actions['atlasvoice_audio'] );
		$this->assertStringContainsString( 'aria-label="Make audio for “A post”"', $actions['atlasvoice_audio'] );
	}

	public function test_a_kind_of_post_atlasvoice_does_not_run_for_gets_no_action() {
		$this->connect();
		$page = get_post( self::factory()->post->create( array( 'post_type' => 'page' ) ) );

		$this->assertSame( array( 'edit' => 'Edit' ), Posts_Screen::row_action( array( 'edit' => 'Edit' ), $page ) );
	}

	private function press( $post_id, $nonce = null ) {
		$went = '';
		add_filter(
			'wp_redirect',
			static function ( $location ) use ( &$went ) {
				$went = $location;

				return false;
			}
		);
		$_GET     = array(
			'post'     => (string) $post_id,
			'_wpnonce' => null === $nonce ? wp_create_nonce( Posts_Screen::MAKE_ACTION . '_' . $post_id ) : $nonce,
		);
		$_REQUEST = $_GET;
		Posts_Screen::handle_make();

		return $went;
	}

	public function test_a_press_asks_the_service_and_goes_back_to_the_list_with_what_happened() {
		$this->connect();
		$post = $this->post( array( 'post_content' => 'Some words to read aloud.' ) );

		$went = $this->press( $post->ID );

		$this->assertNotEmpty( $this->sent, 'The job was asked of the service.' );
		$this->assertStringContainsString( Posts_Screen::RESULT . '=refused', $went );
		$this->assertStringContainsString( 'atlasvoice_audio_post=' . $post->ID, $went );
		$this->assertStringNotContainsString( 'No+network', $went, 'Why it failed is not put in the address.' );
		$this->assertNotEmpty( get_transient( 'atlasvoice_audio_error_' . get_current_user_id() ) );
	}

	public function test_the_list_says_what_happened_once() {
		$post = $this->post();
		set_current_screen( 'edit-post' );
		set_transient( 'atlasvoice_audio_error_' . get_current_user_id(), 'The text is too long.', 60 );
		$_GET = array(
			Posts_Screen::RESULT    => 'refused',
			'atlasvoice_audio_post' => (string) $post->ID,
		);

		ob_start();
		Posts_Screen::render_result();
		$html = (string) ob_get_clean();

		$this->assertStringContainsString( 'notice-error', $html );
		$this->assertStringContainsString( 'The audio of “A post” was not started. The text is too long.', $html );
		$this->assertFalse( get_transient( 'atlasvoice_audio_error_' . get_current_user_id() ) );

		$_GET[ Posts_Screen::RESULT ] = 'started';
		ob_start();
		Posts_Screen::render_result();
		$this->assertStringContainsString( 'notice-success', (string) ob_get_clean() );
		set_current_screen( 'front' );
	}

	public function test_a_press_without_its_nonce_or_the_right_starts_nothing() {
		$this->connect();
		$post = $this->post( array( 'post_content' => 'Some words.' ) );

		try {
			$this->press( $post->ID, 'wrong' );
			$this->fail( 'It went on without a valid nonce.' );
		} catch ( WPDieException $stopped ) {
			unset( $stopped );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		try {
			$this->press( $post->ID );
			$this->fail( 'It went on without the right to edit the post.' );
		} catch ( WPDieException $stopped ) {
			unset( $stopped );
		}

		$this->assertSame( array(), $this->sent );
	}

	// ---- the filter ------------------------------------------------------------

	public function test_the_filter_offers_any_ready_and_none_yet() {
		ob_start();
		Posts_Screen::render_filter( 'post' );
		$html = (string) ob_get_clean();

		$this->assertStringContainsString( 'name="' . Posts_Screen::FILTER . '"', $html );
		foreach ( array( 'Audio: any', 'Audio: ready', 'Audio: none yet' ) as $label ) {
			$this->assertStringContainsString( '>' . $label . '</option>', $html );
		}
		$this->assertStringContainsString( '<label class="screen-reader-text" for="atlasvoice-audio-filter">', $html );

		ob_start();
		Posts_Screen::render_filter( 'page' );
		$this->assertSame( '', ob_get_clean(), 'A kind of post AtlasVoice does not run for has no filter.' );
	}

	public function test_the_filter_finds_the_posts_with_and_without_audio() {
		$with    = $this->post();
		$without = $this->post();
		update_post_meta( $with->ID, Posts::MARK, true );

		$ids = static function ( $status ) {
			$query = new WP_Query(
				array(
					'post_type'  => 'post',
					'fields'     => 'ids',
					'meta_query' => Posts::status_meta_query( $status ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				)
			);

			return array_map( 'intval', $query->posts );
		};

		$this->assertSame( array( $with->ID ), $ids( 'ready' ) );
		$this->assertSame( array( $without->ID ), $ids( 'missing' ) );
		$this->assertSame( array(), Posts::status_meta_query( 'making' ), 'Only what a query can find is offered.' );
		$this->assertSame( array(), Posts::status_meta_query( 'all' ) );
	}
}
