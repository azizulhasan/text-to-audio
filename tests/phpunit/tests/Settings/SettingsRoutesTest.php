<?php
/**
 * REST tests: the settings routes merge on save (TTS-370).
 *
 * Each route is called the way the dashboard calls it: `method=post` and the
 * payload as a JSON string, so the route name and the request shape are
 * pinned as well.
 *
 * @package TTA
 */

class SettingsRoutesTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		// Routes are registered on rest_api_init; a fresh server picks them up.
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
		\TTA\TTA_Cache::flush();
	}

	/**
	 * Calls a settings route like the dashboard does.
	 */
	private function save( $route, $payload, $param = 'fields' ) {
		$request = new WP_REST_Request( 'POST', '/tta/v1' . $route );
		$request->set_param( 'method', 'post' );
		$request->set_param( $param, is_string( $payload ) ? $payload : wp_json_encode( $payload ) );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Map-type settings routes and the option each one stores.
	 */
	public function map_routes() {
		return array(
			'customize'     => array( '/customize', 'tta_customize_settings', 'fields' ),
			'settings'      => array( '/settings', 'tta_settings_data', 'fields' ),
			'settings-data' => array( '/settings-data', 'tta_settings_data', 'fields' ),
			'listening'     => array( '/listening', 'tta_listening_settings', 'fields' ),
			'compatible'    => array( '/compatible_data', 'tta_compatible_data', 'fields' ),
			'analytics'     => array( '/save_analytics_settings', 'tta_analytics_settings', 'analytics' ),
		);
	}

	/**
	 * @dataProvider map_routes
	 */
	public function test_partial_save_keeps_the_other_fields( $route, $option, $param ) {
		update_option( $option, (object) array( 'kept_field' => 'stays', 'changed_field' => 'old' ) );

		$response = $this->save( $route, array( 'changed_field' => 'new' ), $param );

		$this->assertSame( 200, $response->get_status() );
		$stored = (array) get_option( $option );
		$this->assertSame( 'stays', $stored['kept_field'], 'A field that was not sent was wiped.' );
		$this->assertSame( 'new', $stored['changed_field'] );
	}

	/**
	 * @dataProvider map_routes
	 */
	public function test_full_save_stores_the_payload_as_an_object_like_before( $route, $option, $param ) {
		update_option( $option, (object) array( 'a' => 'old' ) );
		$payload = array( 'a' => 'new', 'list' => array( 'post', 'page' ), 'nested' => array( 'id' => 1 ) );

		$this->save( $route, $payload, $param );

		$stored = get_option( $option );
		$this->assertIsObject( $stored, 'The stored type changed.' );
		$this->assertSame( wp_json_encode( $payload ), wp_json_encode( $stored ) );
	}

	/**
	 * @dataProvider map_routes
	 */
	public function test_broken_json_is_refused_and_the_option_survives( $route, $option, $param ) {
		update_option( $option, (object) array( 'a' => 'safe' ) );

		$response = $this->save( $route, '{not json', $param );

		$this->assertSame( 400, $response->get_status() );
		$this->assertEquals( (object) array( 'a' => 'safe' ), get_option( $option ) );
	}

	/**
	 * @dataProvider map_routes
	 */
	public function test_visitors_and_subscribers_cannot_save( $route, $option, $param ) {
		update_option( $option, (object) array( 'a' => 'safe' ) );

		wp_set_current_user( 0 );
		$this->assertContains( $this->save( $route, array( 'a' => 'hacked' ), $param )->get_status(), array( 401, 403 ) );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$this->assertContains( $this->save( $route, array( 'a' => 'hacked' ), $param )->get_status(), array( 401, 403 ) );

		$this->assertEquals( (object) array( 'a' => 'safe' ), get_option( $option ) );
	}

	public function test_settings_save_without_the_mode_keeps_the_site_live() {
		update_option( 'tta_settings_data', (object) array( 'tta__settings_atlasvoice_mode' => 'production', 'x' => 1 ) );

		$this->save( '/settings-data', array( 'x' => 2 ) );

		$this->assertSame( 'production', get_option( 'tta_settings_data' )->tta__settings_atlasvoice_mode );
	}

	public function test_settings_stored_as_an_array_by_the_picker_are_kept() {
		// includes/atlasvoice/RestRoutes.php writes this option as an array.
		update_option( 'tta_settings_data', array( 'picker_rule' => array( 'scope' => 'post' ), 'x' => 1 ) );

		$this->save( '/settings-data', array( 'x' => 2 ) );

		$stored = (array) get_option( 'tta_settings_data' );
		$this->assertSame( array( 'scope' => 'post' ), (array) $stored['picker_rule'] );
		$this->assertSame( 2, $stored['x'] );
	}

	public function test_exclude_fields_are_still_normalised() {
		$this->save(
			'/settings-data',
			array(
				'tta__settings_exclude_tags'  => 'h1, h2  figure',
				'tta__settings_exclude_texts' => "Read more|Share this\nSubscribe",
			)
		);

		$stored = get_option( 'tta_settings_data' );
		$this->assertSame( 'h1|h2|figure', $stored->tta__settings_exclude_tags );
		$this->assertSame( 'Read more|Share this|Subscribe', $stored->tta__settings_exclude_texts );
	}

	public function test_wizard_flag_is_read_from_the_request_only() {
		// The flag was stored inside the option by an earlier wizard run.
		update_option( 'tta_settings_data', (object) array( 'tta_onboarding_completed' => true ) );
		delete_option( 'tta_onboarding_completed' );

		$this->save( '/settings-data', array( 'x' => 1 ) );
		$this->assertFalse( get_option( 'tta_onboarding_completed' ), 'A normal save marked the wizard as finished.' );

		$this->save( '/settings-data', array( 'tta_onboarding_completed' => true ) );
		$this->assertTrue( (bool) get_option( 'tta_onboarding_completed' ) );
	}

	public function test_customize_save_without_the_player_does_not_reset_audio_meta() {
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, 'tts_is_mp3_file_url_exists', '1' );
		update_option( 'tta_customize_settings', (object) array( 'buttonSettings' => (object) array( 'id' => 3 ), 'color' => 'a' ) );
		\TTA\TTA_Cache::flush();

		// A tab that only knows about the colour.
		$this->save( '/customize', array( 'color' => 'b' ) );

		$this->assertSame( '1', get_post_meta( $post_id, 'tts_is_mp3_file_url_exists', true ), 'A partial save was read as a player change.' );
		$this->assertEquals( 3, get_option( 'tta_customize_settings' )->buttonSettings->id );
	}

	public function test_customize_player_change_still_resets_audio_meta() {
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, 'tts_is_mp3_file_url_exists', '1' );
		update_option( 'tta_customize_settings', (object) array( 'buttonSettings' => (object) array( 'id' => 3 ) ) );
		\TTA\TTA_Cache::flush();

		$this->save( '/customize', array( 'buttonSettings' => array( 'id' => 1 ) ) );

		$this->assertSame( '', get_post_meta( $post_id, 'tts_is_mp3_file_url_exists', true ) );
	}

	public function test_customize_button_texts_are_not_stored_in_the_customize_option() {
		$this->save( '/customize', array( 'color' => 'a', 'button_texts' => array( 'players' => array() ) ) );

		$this->assertObjectNotHasProperty( 'button_texts', get_option( 'tta_customize_settings' ) );
	}

	public function test_highlight_partial_save_keeps_saved_values_not_defaults() {
		update_option(
			'tta_highlight_settings',
			array(
				'tta__highlight_enabled' => true,
				'tta__highlight_mode'    => 'word',
				'tta__highlight_word_bg' => '#112233',
			)
		);

		$this->save( '/highlight', array( 'tta__highlight_autoscroll' => true ) );

		$stored = get_option( 'tta_highlight_settings' );
		$this->assertTrue( $stored['tta__highlight_enabled'] );
		$this->assertSame( 'word', $stored['tta__highlight_mode'] );
		$this->assertSame( '#112233', $stored['tta__highlight_word_bg'] );
		$this->assertTrue( $stored['tta__highlight_autoscroll'] );
	}

	public function test_highlight_still_rejects_bad_values() {
		$this->save(
			'/highlight',
			array(
				'tta__highlight_mode'        => 'evil',
				'tta__highlight_word_bg'     => 'javascript:alert(1)',
				'tta__highlight_dim_opacity' => 99,
			)
		);

		$stored = get_option( 'tta_highlight_settings' );
		$this->assertSame( 'sentence', $stored['tta__highlight_mode'] );
		$this->assertSame( '#a5abf0', $stored['tta__highlight_word_bg'] );
		$this->assertSame( 0.85, $stored['tta__highlight_dim_opacity'] );
	}

	public function test_restricted_admin_cannot_store_a_script_through_a_route() {
		add_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10, 2 );

		$this->save( '/customize', array( 'custom_text' => '<script>alert(1)</script>Listen' ) );

		remove_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10 );

		$this->assertStringNotContainsString( '<script', get_option( 'tta_customize_settings' )->custom_text );
	}

	/**
	 * Takes the unfiltered_html capability away, as on a multisite network.
	 */
	public function deny_unfiltered_html( $caps, $cap ) {
		if ( 'unfiltered_html' === $cap ) {
			$caps[] = 'do_not_allow';
		}

		return $caps;
	}
}
