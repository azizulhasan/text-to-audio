<?php
/**
 * Unit tests for TTA\Settings\Settings_Store (TTS-370).
 *
 * @package TTA
 */

use TTA\Settings\Settings_Store;

/**
 * @covers \TTA\Settings\Settings_Store
 */
class SettingsStoreTest extends WP_UnitTestCase {

	const OPTION = 'tta_test_store_option';

	public function set_up() {
		parent::set_up();
		// An administrator on a single site may save unfiltered HTML.
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	public function test_partial_payload_keeps_fields_that_were_not_sent() {
		update_option( self::OPTION, (object) array( 'color' => '#184c53', 'width' => '100' ) );

		$value = Settings_Store::prepare( self::OPTION, (object) array( 'width' => '80' ) );

		$this->assertEquals( (object) array( 'color' => '#184c53', 'width' => '80' ), $value );
	}

	public function test_full_payload_gives_exactly_what_a_replace_stored() {
		update_option( self::OPTION, (object) array( 'a' => 1, 'b' => array( 'x', 'y' ) ) );
		$payload = json_decode( '{"a":2,"b":["z"],"c":{"id":3}}' );

		$value = Settings_Store::prepare( self::OPTION, $payload );

		$this->assertEquals( $payload, $value );
		$this->assertSame( wp_json_encode( $payload ), wp_json_encode( $value ) );
	}

	public function test_nested_values_are_replaced_whole_not_merged() {
		update_option( self::OPTION, (object) array( 'post_types' => array( 'post', 'page' ) ) );

		$value = Settings_Store::prepare( self::OPTION, (object) array( 'post_types' => array( 'post' ) ) );

		$this->assertSame( array( 'post' ), $value->post_types );
	}

	public function test_result_keeps_the_type_of_the_payload() {
		// Stored as an array (the content picker), sent as an object (the dashboard).
		update_option( self::OPTION, array( 'a' => 1 ) );
		$this->assertIsObject( Settings_Store::prepare( self::OPTION, (object) array( 'b' => 2 ) ) );

		// Stored as an object, sent as an array.
		update_option( self::OPTION, (object) array( 'a' => 1 ) );
		$value = Settings_Store::prepare( self::OPTION, array( 'b' => 2 ) );
		$this->assertIsArray( $value );
		$this->assertSame( array( 'a' => 1, 'b' => 2 ), $value );
	}

	public function test_empty_payload_changes_nothing() {
		update_option( self::OPTION, (object) array( 'a' => 1 ) );

		$this->assertEquals( (object) array( 'a' => 1 ), Settings_Store::prepare( self::OPTION, new stdClass() ) );
	}

	public function test_false_and_empty_values_that_were_sent_still_win() {
		update_option( self::OPTION, (object) array( 'enabled' => true, 'text' => 'Listen' ) );

		$value = Settings_Store::prepare( self::OPTION, (object) array( 'enabled' => false, 'text' => '' ) );

		$this->assertFalse( $value->enabled );
		$this->assertSame( '', $value->text );
	}

	public function test_numeric_keys_are_not_renumbered() {
		update_option( self::OPTION, array( 3 => 'three', 7 => 'seven' ) );

		$this->assertSame( array( 3 => 'three', 7 => 'SEVEN' ), Settings_Store::prepare( self::OPTION, array( 7 => 'SEVEN' ) ) );
	}

	/**
	 * @dataProvider invalid_payloads
	 */
	public function test_invalid_payload_is_refused_and_nothing_is_lost( $payload ) {
		update_option( self::OPTION, (object) array( 'a' => 1 ) );

		$result = Settings_Store::prepare( self::OPTION, $payload );

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertEquals( (object) array( 'a' => 1 ), get_option( self::OPTION ) );
	}

	public function invalid_payloads() {
		return array(
			'broken JSON decodes to null' => array( null ),
			'a string'                    => array( 'text' ),
			'a number'                    => array( 5 ),
			'a boolean'                   => array( true ),
		);
	}

	public function test_missing_option_is_treated_as_empty() {
		delete_option( self::OPTION );

		$this->assertEquals( (object) array( 'a' => 1 ), Settings_Store::prepare( self::OPTION, (object) array( 'a' => 1 ) ) );
	}

	public function test_user_with_unfiltered_html_is_stored_byte_for_byte() {
		$payload = (object) array( 'intro' => '<script>alert(1)</script><b>Hi</b>' );

		$value = Settings_Store::prepare( self::OPTION, $payload );

		$this->assertSame( '<script>alert(1)</script><b>Hi</b>', $value->intro );
	}

	public function test_user_without_unfiltered_html_cannot_store_a_script() {
		add_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10, 2 );

		$payload = (object) array(
			'intro'  => '<script>alert(1)</script><b>Hi</b>',
			'nested' => (object) array( 'list' => array( '<img src=x onerror=alert(1)>' ) ),
		);
		$value   = Settings_Store::prepare( self::OPTION, $payload );

		remove_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10 );

		$this->assertStringNotContainsString( '<script', $value->intro );
		$this->assertStringContainsString( '<b>Hi</b>', $value->intro );
		$this->assertStringNotContainsString( 'onerror', $value->nested->list[0] );
		// The caller's object must not be changed.
		$this->assertStringContainsString( '<script', $payload->intro );
	}

	public function test_css_selectors_survive_for_users_without_unfiltered_html() {
		add_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10, 2 );

		$value = Settings_Store::prepare( self::OPTION, (object) array( 'selector' => 'article > p, .a + .b', 'n' => 5, 'on' => true ) );

		remove_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10 );

		$this->assertSame( 'article > p, .a + .b', $value->selector );
		$this->assertSame( 5, $value->n );
		$this->assertTrue( $value->on );
	}

	public function test_stored_fields_are_not_filtered_when_another_user_saves() {
		// A super admin saved markup; a later save by a restricted user must not strip it.
		update_option( self::OPTION, (object) array( 'intro' => '<iframe src="https://example.org"></iframe>' ) );
		add_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10, 2 );

		$value = Settings_Store::prepare( self::OPTION, (object) array( 'width' => '80' ) );

		remove_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10 );

		$this->assertSame( '<iframe src="https://example.org"></iframe>', $value->intro );
	}

	public function test_filter_can_adjust_the_value_before_it_is_stored() {
		$seen = array();
		$hook = static function ( $value, $option, $incoming, $stored ) use ( &$seen ) {
			$seen         = compact( 'option', 'incoming', 'stored' );
			$value->added = 'by-filter';

			return $value;
		};
		update_option( self::OPTION, (object) array( 'a' => 1 ) );
		add_filter( 'atlasvoice_settings_before_save', $hook, 10, 4 );

		$value = Settings_Store::prepare( self::OPTION, (object) array( 'b' => 2 ) );

		remove_filter( 'atlasvoice_settings_before_save', $hook, 10 );

		$this->assertSame( 'by-filter', $value->added );
		$this->assertSame( self::OPTION, $seen['option'] );
		$this->assertEquals( (object) array( 'b' => 2 ), $seen['incoming'] );
		$this->assertEquals( (object) array( 'a' => 1 ), $seen['stored'] );
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
