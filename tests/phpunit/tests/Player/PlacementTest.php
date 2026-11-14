<?php
/**
 * Tests for the placement of the player: the service class, its REST
 * routes and `wp atlasvoice placement` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Placement_Command;
use TTA\Player\Placement;

/**
 * @covers \TTA\Player\Placement
 * @covers \TTA_Api\Placement_Controller
 * @covers \TTA\CLI\Placement_Command
 */
class PlacementTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Placement::CUSTOMIZE_OPTION );
		delete_option( Placement::SETTINGS_OPTION );
		remove_all_filters( 'atlasvoice_placement_download_available' );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_placement_download_available' );
		parent::tear_down();
	}

	private function stored( $option ) {
		return json_decode( wp_json_encode( get_option( $option ) ), true );
	}

	private function button() {
		$stored = $this->stored( Placement::CUSTOMIZE_OPTION );

		return isset( $stored['buttonSettings'] ) ? $stored['buttonSettings'] : array();
	}

	/**
	 * What the classic Customization screen stores.
	 */
	private function classic_customize( array $button = array() ) {
		update_option(
			Placement::CUSTOMIZE_OPTION,
			(object) array(
				'backgroundColor' => '#184c53',
				'custom_css'      => '.x > p { color: red; }',
				'buttonSettings'  => (object) array_replace(
					array(
						'id'                        => '1',
						'button_position'           => 'before_content',
						'float_position'            => 'bottom_fixed',
						'display_player_to'         => array( 'all' ),
						'who_can_download_mp3_file' => array( 'all' ),
						'generate_mp3_date_from'    => '2026-01-01',
					),
					$button
				),
			)
		);
	}

	/**
	 * What the classic Settings screen stores.
	 */
	private function classic_settings( array $settings = array() ) {
		update_option(
			Placement::SETTINGS_OPTION,
			(object) array_replace(
				array(
					'tta__settings_enable_button_add'                => true,
					'tta__settings_stop_floating_button'             => false,
					'tta__settings_allow_listening_for_post_types'   => array( 'post', 'page' ),
					'tta__settings_atlasvoice_mode'                  => 'live',
				),
				$settings
			)
		);
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/placement' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// Reading.

	public function test_a_new_site_has_the_player_before_the_content_for_everyone() {
		$placement = Placement::get();

		$this->assertSame( 'before_content', $placement['position'] );
		$this->assertSame( array( 'all' ), $placement['show_to'] );
		$this->assertSame( array( 'all' ), $placement['download'] );
		$this->assertFalse( $placement['download_available'] );
		$this->assertFalse( $placement['stores_audio'] );
	}

	public function test_it_reads_what_the_classic_screens_saved() {
		$this->classic_customize(
			array(
				'button_position'           => 'after_content',
				'float_position'            => 'sticky_top',
				'display_player_to'         => array( 'subscriber' ),
				'who_can_download_mp3_file' => array( 'editor', 'administrator' ),
			)
		);
		$this->classic_settings();

		$placement = Placement::get();

		$this->assertSame( 'after_content', $placement['position'] );
		$this->assertSame( 'sticky_top', $placement['dock'] );
		$this->assertSame( array( 'subscriber' ), $placement['show_to'] );
		$this->assertSame( array( 'editor', 'administrator' ), $placement['download'] );
	}

	public function test_it_reads_settings_stored_as_arrays_too() {
		update_option( Placement::CUSTOMIZE_OPTION, array( 'buttonSettings' => array( 'button_position' => 'after_content' ) ) );
		update_option( Placement::SETTINGS_OPTION, array( 'tta__settings_stop_floating_button' => true ) );

		$placement = Placement::get();

		$this->assertSame( 'after_content', $placement['position'] );
		$this->assertSame( 'none', $placement['dock'] );
	}

	public function test_adding_the_player_by_hand_only_is_the_manual_position() {
		$this->classic_customize( array( 'button_position' => 'after_content' ) );
		$this->classic_settings( array( 'tta__settings_enable_button_add' => false ) );

		$this->assertSame( 'manual', Placement::get()['position'] );
	}

	public function test_the_stop_floating_switch_is_no_dock() {
		$this->classic_customize();
		$this->classic_settings( array( 'tta__settings_stop_floating_button' => true ) );

		$this->assertSame( 'none', Placement::get()['dock'] );
	}

	/**
	 * The player script reads the corner the same way (text-to-audio-button.js).
	 *
	 * @dataProvider stored_corners
	 */
	public function test_the_corner_is_read_the_way_the_player_reads_it( array $button, $expected ) {
		update_option( Placement::CUSTOMIZE_OPTION, (object) array( 'buttonSettings' => (object) $button ) );

		$this->assertSame( $expected, Placement::get()['dock'] );
	}

	public function stored_corners() {
		return array(
			'its own field'                    => array( array( 'float_position' => 'bottom_left' ), 'bottom_left' ),
			'a removed placement'              => array( array( 'float_position' => 'bottom_center' ), 'bottom_fixed' ),
			'a site from before the split'     => array( array( 'button_position' => 'sticky_top' ), 'sticky_top' ),
			'before the split, removed corner' => array( array( 'button_position' => 'bottom_center' ), 'bottom_fixed' ),
			'nothing stored'                   => array( array( 'button_position' => 'before_content' ), 'bottom_right' ),
			'rubbish'                          => array( array( 'float_position' => array( 'x' ) ), 'bottom_right' ),
		);
	}

	public function test_a_corner_in_the_old_position_field_reads_as_before_the_content() {
		update_option( Placement::CUSTOMIZE_OPTION, (object) array( 'buttonSettings' => (object) array( 'button_position' => 'bottom_right' ) ) );

		$this->assertSame( 'before_content', Placement::get()['position'] );
	}

	/**
	 * @dataProvider stored_role_lists
	 */
	public function test_a_missing_or_empty_list_of_roles_means_everyone( $stored ) {
		$button = array( 'id' => '1' );
		if ( null !== $stored ) {
			$button['display_player_to'] = $stored;
		}
		update_option( Placement::CUSTOMIZE_OPTION, (object) array( 'buttonSettings' => (object) $button ) );

		$this->assertSame( array( 'all' ), Placement::get()['show_to'] );
	}

	public function stored_role_lists() {
		return array(
			'never saved'       => array( null ),
			'empty'             => array( array() ),
			'all with others'   => array( array( 'editor', 'all' ) ),
			'not a list of ids' => array( array( array( 'x' ), 7 ) ),
		);
	}

	public function test_it_lists_the_roles_of_this_site_with_everyone_first() {
		add_role( 'atlasvoice_member', 'Member' );

		$roles = Placement::get()['roles'];
		remove_role( 'atlasvoice_member' );

		$this->assertSame(
			array(
				'id'   => 'all',
				'name' => 'Everyone',
			),
			$roles[0]
		);
		$names = array_column( $roles, 'name', 'id' );
		$this->assertSame( 'Subscriber', $names['subscriber'] );
		$this->assertSame( 'Member', $names['atlasvoice_member'] );
	}

	public function test_the_download_button_exists_only_when_a_plugin_says_so() {
		$this->assertFalse( Placement::get()['download_available'] );

		add_filter( 'atlasvoice_placement_download_available', '__return_true' );

		$this->assertTrue( Placement::get()['download_available'] );
	}

	public function test_the_filter_is_told_whether_the_voice_stores_audio() {
		$seen = null;
		add_filter(
			'atlasvoice_placement_download_available',
			static function ( $available, $stores_audio ) use ( &$seen ) {
				$seen = $stores_audio;

				return $available;
			},
			10,
			2
		);

		Placement::get();

		$this->assertFalse( $seen );
	}

	// Saving.

	public function test_a_save_writes_the_fields_the_classic_screens_read() {
		$this->classic_customize();
		$this->classic_settings();

		$saved = Placement::save(
			array(
				'position' => 'after_content',
				'dock'     => 'bottom_left',
				'show_to'  => array( 'subscriber', 'editor' ),
				'download' => array( 'administrator' ),
			)
		);

		$button = $this->button();
		$this->assertSame( 'after_content', $button['button_position'] );
		$this->assertSame( 'bottom_left', $button['float_position'] );
		$this->assertSame( array( 'subscriber', 'editor' ), $button['display_player_to'] );
		$this->assertSame( array( 'administrator' ), $button['who_can_download_mp3_file'] );
		$this->assertSame( 'after_content', $saved['position'] );
		$this->assertSame( 'bottom_left', $saved['dock'] );
	}

	public function test_a_save_keeps_every_other_stored_setting() {
		$this->classic_customize();
		$this->classic_settings();
		$customize_before = $this->stored( Placement::CUSTOMIZE_OPTION );
		$settings_before  = $this->stored( Placement::SETTINGS_OPTION );

		Placement::save( array( 'position' => 'after_content' ) );

		$customize_before['buttonSettings']['button_position'] = 'after_content';
		$this->assertSame( $customize_before, $this->stored( Placement::CUSTOMIZE_OPTION ) );
		$this->assertSame( $settings_before, $this->stored( Placement::SETTINGS_OPTION ) );
	}

	public function test_the_options_keep_the_shape_the_classic_screens_store() {
		$this->classic_customize();
		$this->classic_settings();

		Placement::save(
			array(
				'position' => 'manual',
				'show_to'  => array( 'editor' ),
			)
		);

		$customize = get_option( Placement::CUSTOMIZE_OPTION );
		$this->assertIsObject( $customize );
		$this->assertIsObject( $customize->{'buttonSettings'} );
		$this->assertSame( '1', $customize->{'buttonSettings'}->id );
		$this->assertIsObject( get_option( Placement::SETTINGS_OPTION ) );
	}

	public function test_only_what_was_sent_changes() {
		$this->classic_customize( array( 'float_position' => 'sticky_top' ) );
		$this->classic_settings();

		Placement::save( array( 'show_to' => array( 'editor' ) ) );

		$button = $this->button();
		$this->assertSame( 'before_content', $button['button_position'] );
		$this->assertSame( 'sticky_top', $button['float_position'] );
		$this->assertSame( array( 'all' ), $button['who_can_download_mp3_file'] );
		$this->assertFalse( $this->stored( Placement::SETTINGS_OPTION )['tta__settings_stop_floating_button'] );
	}

	public function test_manual_turns_automatic_placement_off_and_keeps_the_position() {
		$this->classic_customize( array( 'button_position' => 'after_content' ) );
		$this->classic_settings();

		$saved = Placement::save( array( 'position' => 'manual' ) );

		$this->assertSame( 'manual', $saved['position'] );
		$this->assertFalse( $this->stored( Placement::SETTINGS_OPTION )['tta__settings_enable_button_add'] );
		$this->assertSame( 'after_content', $this->button()['button_position'] );
	}

	public function test_choosing_a_position_again_turns_automatic_placement_on() {
		$this->classic_customize();
		$this->classic_settings( array( 'tta__settings_enable_button_add' => false ) );

		$saved = Placement::save( array( 'position' => 'before_content' ) );

		$this->assertSame( 'before_content', $saved['position'] );
		$this->assertTrue( $this->stored( Placement::SETTINGS_OPTION )['tta__settings_enable_button_add'] );
	}

	public function test_no_dock_sets_the_stop_floating_switch_and_keeps_the_corner() {
		$this->classic_customize( array( 'float_position' => 'bottom_left' ) );
		$this->classic_settings();

		$saved = Placement::save( array( 'dock' => 'none' ) );

		$this->assertSame( 'none', $saved['dock'] );
		$this->assertTrue( $this->stored( Placement::SETTINGS_OPTION )['tta__settings_stop_floating_button'] );
		$this->assertSame( 'bottom_left', $this->button()['float_position'] );
	}

	public function test_choosing_a_corner_turns_docking_on_again() {
		$this->classic_customize();
		$this->classic_settings( array( 'tta__settings_stop_floating_button' => true ) );

		$saved = Placement::save( array( 'dock' => 'sticky_top' ) );

		$this->assertSame( 'sticky_top', $saved['dock'] );
		$this->assertFalse( $this->stored( Placement::SETTINGS_OPTION )['tta__settings_stop_floating_button'] );
		$this->assertSame( 'sticky_top', $this->button()['float_position'] );
	}

	public function test_a_save_does_not_change_staging_or_live() {
		$this->classic_customize();
		$this->classic_settings();

		Placement::save(
			array(
				'position' => 'manual',
				'dock'     => 'none',
			)
		);

		$settings = $this->stored( Placement::SETTINGS_OPTION );
		$this->assertSame( 'live', $settings['tta__settings_atlasvoice_mode'] );
		$this->assertSame( array( 'post', 'page' ), $settings['tta__settings_allow_listening_for_post_types'] );
	}

	public function test_everyone_with_other_roles_is_stored_as_everyone() {
		$saved = Placement::save( array( 'show_to' => array( 'editor', 'all', 'subscriber' ) ) );

		$this->assertSame( array( 'all' ), $saved['show_to'] );
		$this->assertSame( array( 'all' ), $this->button()['display_player_to'] );
	}

	public function test_a_role_named_twice_is_stored_once() {
		$saved = Placement::save( array( 'download' => array( 'editor', 'editor' ) ) );

		$this->assertSame( array( 'editor' ), $saved['download'] );
	}

	public function test_roles_can_be_given_as_text_separated_by_commas() {
		$saved = Placement::save( array( 'show_to' => 'subscriber, editor' ) );

		$this->assertSame( array( 'subscriber', 'editor' ), $saved['show_to'] );
	}

	public function test_the_player_follows_the_roles_that_were_saved() {
		$this->classic_customize();
		$this->classic_settings();
		Placement::save( array( 'show_to' => array( 'editor' ) ) );

		// True means "hide the player from this person".
		$this->assertTrue( \TTA\TTA_Helper::display_player_based_on_user_role() );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$this->assertFalse( \TTA\TTA_Helper::display_player_based_on_user_role() );

		wp_set_current_user( 0 );
		$this->assertTrue( \TTA\TTA_Helper::display_player_based_on_user_role() );
	}

	public function test_a_save_on_a_site_with_nothing_stored_works() {
		$saved = Placement::save(
			array(
				'position' => 'after_content',
				'dock'     => 'bottom_fixed',
			)
		);

		$this->assertSame( 'after_content', $saved['position'] );
		$this->assertSame( 'bottom_fixed', $saved['dock'] );
		$this->assertSame( array( 'all' ), $saved['show_to'] );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		$this->classic_customize();
		$this->classic_settings();
		$customize = $this->stored( Placement::CUSTOMIZE_OPTION );
		$settings  = $this->stored( Placement::SETTINGS_OPTION );

		$result = Placement::save(
			array(
				'position' => 'after_content',
				$field     => $value,
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( $customize, $this->stored( Placement::CUSTOMIZE_OPTION ) );
		$this->assertSame( $settings, $this->stored( Placement::SETTINGS_OPTION ) );
	}

	public function wrong_values() {
		return array(
			'an unknown position'  => array( 'position', 'bottom_right' ),
			'an unknown dock'      => array( 'dock', 'bottom_center' ),
			'a dock that is a list' => array( 'dock', array( 'none' ) ),
			'an unknown role'      => array( 'show_to', array( 'editor', 'wizard' ) ),
			'no role at all'       => array( 'show_to', array() ),
			'a role that is a list' => array( 'download', array( array( 'editor' ) ) ),
			'markup as a role'     => array( 'download', array( '<script>alert(1)</script>' ) ),
			'an unknown setting'   => array( 'colour', 'red' ),
		);
	}

	public function test_an_error_names_the_field_and_never_echoes_markup() {
		$result = Placement::save( array( 'show_to' => array( '<b>wizard</b>' ) ) );

		$this->assertSame( 'show_to', $result->get_error_data()['field'] );
		$this->assertStringNotContainsString( '<', $result->get_error_message() );
	}

	public function test_an_empty_save_is_refused() {
		$result = Placement::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// The REST routes.

	public function test_get_returns_the_placement() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Placement::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent() {
		$this->classic_customize();
		$this->classic_settings();

		$response = $this->rest( 'POST', array( 'dock' => 'none' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'none', $response->get_data()['dock'] );
		$this->assertSame( 'before_content', $response->get_data()['position'] );
		$this->assertTrue( $this->stored( Placement::SETTINGS_OPTION )['tta__settings_enable_button_add'] );
	}

	public function test_post_refuses_a_value_outside_the_described_choices() {
		$response = $this->rest( 'POST', array( 'position' => 'in_the_footer' ) );

		$this->assertSame( 400, $response->get_status() );
	}

	public function test_post_refuses_a_role_this_site_does_not_have() {
		$response = $this->rest( 'POST', array( 'show_to' => array( 'wizard' ) ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'atlasvoice_invalid_placement', $response->get_data()['code'] );
	}

	public function test_each_method_and_each_setting_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/placement'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		foreach ( array( 'position', 'dock', 'show_to', 'download' ) as $name ) {
			$this->assertNotEmpty( $routes[1]['args'][ $name ]['description'], $name );
		}
		$this->assertSame( Placement::POSITIONS, $routes[1]['args']['position']['enum'] );
		$this->assertSame( Placement::DOCKS, $routes[1]['args']['dock']['enum'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_the_placement( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'dock' => 'none' ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Placement::SETTINGS_OPTION ) );
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

		$this->assertSame( Placement_Command::class, WP_CLI::$commands['atlasvoice placement'] );
	}

	public function test_get_prints_the_placement() {
		$this->classic_customize( array( 'display_player_to' => array( 'subscriber', 'editor' ) ) );
		$this->classic_settings( array( 'tta__settings_stop_floating_button' => true ) );

		( new Placement_Command() )->get( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertContains( 'position: before_content', $lines );
		$this->assertContains( 'dock: none', $lines );
		$this->assertContains( 'show to: subscriber, editor', $lines );
		$this->assertContains( 'download: all', $lines );
	}

	public function test_get_can_print_json_for_scripts() {
		( new Placement_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Placement::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_set_saves_what_was_given() {
		$this->classic_customize();
		$this->classic_settings();

		( new Placement_Command() )->set(
			array(),
			array(
				'position' => 'after_content',
				'dock'     => 'none',
				'show-to'  => 'subscriber,editor',
			)
		);

		$placement = Placement::get();
		$this->assertSame( 'after_content', $placement['position'] );
		$this->assertSame( 'none', $placement['dock'] );
		$this->assertSame( array( 'subscriber', 'editor' ), $placement['show_to'] );
		$this->assertSame( array( 'all' ), $placement['download'] );
	}

	public function test_set_says_why_a_value_was_refused() {
		try {
			( new Placement_Command() )->set( array(), array( 'show-to' => 'wizard' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'wizard', WP_CLI::$log[0][1] );
	}

	// The period the posts must be published in.

	public function test_a_new_site_has_no_period() {
		$placement = Placement::get();

		$this->assertSame( '', $placement['date_from'] );
		$this->assertSame( '', $placement['date_to'] );
		$this->assertSame(
			array(
				'from' => '',
				'to'   => '',
			),
			Placement::date_range()
		);
	}

	public function test_it_reads_the_period_the_classic_screen_saved() {
		$this->classic_customize( array( 'generate_mp3_date_to' => '2026-06-30' ) );

		$placement = Placement::get();

		$this->assertSame( '2026-01-01', $placement['date_from'] );
		$this->assertSame( '2026-06-30', $placement['date_to'] );
	}

	public function test_a_stored_value_that_is_no_date_is_no_limit() {
		$this->classic_customize(
			array(
				'generate_mp3_date_from' => 'soon',
				'generate_mp3_date_to'   => array( '2026-06-30' ),
			)
		);

		$this->assertSame(
			array(
				'from' => '',
				'to'   => '',
			),
			Placement::date_range()
		);
	}

	public function test_a_period_is_stored_in_the_fields_the_player_reads() {
		$this->classic_customize();
		$this->classic_settings();

		$saved = Placement::save(
			array(
				'date_from' => '2026-02-01',
				'date_to'   => '2026-02-28',
			)
		);

		$this->assertSame( '2026-02-01', $saved['date_from'] );
		$this->assertSame( '2026-02-28', $this->button()['generate_mp3_date_to'] );
		$this->assertSame( '2026-02-01', $this->button()['generate_mp3_date_from'] );
		// The rest of what the classic screen stored is still there.
		$this->assertSame( array( 'all' ), $this->button()['who_can_download_mp3_file'] );
		$this->assertSame( '.x > p { color: red; }', $this->stored( Placement::CUSTOMIZE_OPTION )['custom_css'] );

		$inside  = (object) array( 'post_date' => '2026-02-28 23:10:00' );
		$outside = (object) array( 'post_date' => '2026-03-01 00:00:01' );
		$this->assertTrue( \TTA\TTA_Helper::display_player_based_on_date_range( $inside ) );
		$this->assertFalse( \TTA\TTA_Helper::display_player_based_on_date_range( $outside ) );
	}

	public function test_an_empty_date_removes_that_limit_and_keeps_the_other() {
		$this->classic_customize( array( 'generate_mp3_date_to' => '2026-06-30' ) );

		$saved = Placement::save( array( 'date_from' => '' ) );

		$this->assertSame( '', $saved['date_from'] );
		$this->assertSame( '2026-06-30', $saved['date_to'] );
		$this->assertSame( '', $this->button()['generate_mp3_date_from'] );
		$this->assertTrue( \TTA\TTA_Helper::display_player_based_on_date_range( (object) array( 'post_date' => '2020-01-01 08:00:00' ) ) );
	}

	/**
	 * @dataProvider wrong_dates
	 */
	public function test_a_value_that_is_no_day_of_the_calendar_saves_nothing( $value ) {
		$this->classic_customize();
		$before = $this->stored( Placement::CUSTOMIZE_OPTION );

		$result = Placement::save( array( 'date_to' => $value ) );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_invalid_placement', $result->get_error_code() );
		$this->assertSame( 'date_to', $result->get_error_data()['field'] );
		$this->assertSame( $before, $this->stored( Placement::CUSTOMIZE_OPTION ) );
	}

	public function wrong_dates() {
		return array(
			'another way of writing' => array( '01/02/2026' ),
			'a day that never comes' => array( '2026-02-30' ),
			'a date with a time'     => array( '2026-02-01 10:00:00' ),
			'a number'               => array( 20260201 ),
			'a list'                 => array( array( '2026-02-01' ) ),
			'markup'                 => array( '<b>2026</b>' ),
		);
	}

	public function test_a_period_that_ends_before_it_starts_is_refused() {
		$result = Placement::save(
			array(
				'date_from' => '2026-05-01',
				'date_to'   => '2026-04-30',
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 'date_to', $result->get_error_data()['field'] );
		$this->assertFalse( get_option( Placement::CUSTOMIZE_OPTION ) );
	}

	public function test_one_end_is_checked_against_the_stored_other_end() {
		// Stored: from 2026-01-01.
		$this->classic_customize();

		$result = Placement::save( array( 'date_to' => '2025-12-31' ) );

		$this->assertWPError( $result );
		$this->assertArrayNotHasKey( 'generate_mp3_date_to', $this->button() );

		// The same day at both ends is one day, and allowed.
		$this->assertSame( '2026-01-01', Placement::save( array( 'date_to' => '2026-01-01' ) )['date_to'] );
	}

	public function test_the_route_saves_and_describes_the_period() {
		$this->classic_customize();
		$this->classic_settings();

		$response = $this->rest( 'POST', array( 'date_to' => '2026-12-31' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '2026-12-31', $response->get_data()['date_to'] );
		$this->assertSame( '2026-01-01', $response->get_data()['date_from'] );

		$cleared = $this->rest( 'POST', array( 'date_from' => '' ) );
		$this->assertSame( 200, $cleared->get_status() );
		$this->assertSame( '', $cleared->get_data()['date_from'] );

		$refused = $this->rest( 'POST', array( 'date_from' => 'yesterday' ) );
		$this->assertSame( 400, $refused->get_status() );
		$this->assertSame( 'atlasvoice_invalid_placement', $refused->get_data()['code'] );

		$args = rest_get_server()->get_routes()['/tta/v1/placement'][1]['args'];
		foreach ( array( 'date_from', 'date_to' ) as $name ) {
			$this->assertSame( 'string', $args[ $name ]['type'] );
			$this->assertStringContainsString( 'YYYY-MM-DD', $args[ $name ]['description'] );
		}
	}

	public function test_the_command_prints_and_changes_the_period() {
		( new Placement_Command() )->get( array(), array() );
		$this->assertContains( 'posts published: any date', wp_list_pluck( WP_CLI::$log, 1 ) );

		WP_CLI::reset();
		( new Placement_Command() )->set( array(), array( 'date-from' => '2026-01-01' ) );
		( new Placement_Command() )->get( array(), array() );
		$this->assertContains( 'posts published: from 2026-01-01', wp_list_pluck( WP_CLI::$log, 1 ) );

		WP_CLI::reset();
		( new Placement_Command() )->set( array(), array( 'date-to' => '2026-03-31' ) );
		( new Placement_Command() )->get( array(), array() );
		$this->assertContains( 'posts published: 2026-01-01 to 2026-03-31', wp_list_pluck( WP_CLI::$log, 1 ) );

		// A flag given without a value means no limit.
		WP_CLI::reset();
		( new Placement_Command() )->set( array(), array( 'date-from' => true ) );
		( new Placement_Command() )->get( array(), array() );
		$this->assertContains( 'posts published: until 2026-03-31', wp_list_pluck( WP_CLI::$log, 1 ) );
	}
}
