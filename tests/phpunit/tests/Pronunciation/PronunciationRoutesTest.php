<?php
/**
 * REST tests for tta/v1/pronunciation and the classic tta/v1/text_alias route.
 *
 * @package TTA
 */

use TTA\Pronunciation\Rules;

/**
 * @covers \TTA_Api\Pronunciation_Controller
 */
class PronunciationRoutesTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
		delete_option( Rules::OPTION );
		\TTA\TTA_Cache::flush();
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_pronunciation_max_rules' );
		parent::tear_down();
	}

	private function call( $method, $route, array $params = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1' . $route );
		if ( 'GET' !== $method ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	private function rule( $word, $say, $numbers = false ) {
		$rule = array(
			'actual_text' => $word,
			'to_read'     => $say,
		);
		if ( $numbers ) {
			$rule['apply_to_numbers'] = true;
		}

		return $rule;
	}

	public function test_routes_describe_themselves_for_api_clients_and_mcp() {
		$routes = rest_get_server()->get_routes();

		foreach ( array( '/tta/v1/pronunciation', '/tta/v1/pronunciation/preview' ) as $route ) {
			$this->assertArrayHasKey( $route, $routes );
			foreach ( $routes[ $route ] as $endpoint ) {
				$this->assertNotEmpty( $endpoint['label'], "$route has no label." );
				$this->assertNotEmpty( $endpoint['description'], "$route has no description." );
				foreach ( $endpoint['args'] as $name => $arg ) {
					$this->assertNotEmpty( $arg['type'], "$route: $name has no type." );
					$this->assertNotEmpty( $arg['description'], "$route: $name has no description." );
				}
			}
		}
	}

	public function test_get_returns_the_rules_the_limit_and_how_many_apply() {
		update_option(
			Rules::OPTION,
			array(
				(object) $this->rule( 'WP', 'WordPress' ),
				(object) $this->rule( 'km', 'kilometres' ),
			)
		);

		$data = $this->call( 'GET', '/pronunciation' )->get_data();

		$this->assertCount( 2, $data['rules'] );
		$this->assertSame( 1, $data['max'] );
		$this->assertSame( 1, $data['applied'] );
		$this->assertSame( 'WP', $data['rules'][0]['actual_text'] );
		$this->assertFalse( $data['rules'][0]['apply_to_numbers'] );
	}

	public function test_post_saves_and_answers_with_the_new_state() {
		$response = $this->call( 'POST', '/pronunciation', array( 'rules' => array( $this->rule( ' WP ', 'WordPress' ) ) ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'WP', $response->get_data()['rules'][0]['actual_text'] );
		$this->assertEquals( array( (object) $this->rule( 'WP', 'WordPress' ) ), get_option( Rules::OPTION ) );
	}

	public function test_post_past_the_limit_is_a_400_and_saves_nothing() {
		$response = $this->call(
			'POST',
			'/pronunciation',
			array( 'rules' => array( $this->rule( 'WP', 'WordPress' ), $this->rule( 'km', 'kilometres' ) ) )
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'atlasvoice_rule_limit', $response->get_data()['code'] );
		$this->assertFalse( get_option( Rules::OPTION ) );
	}

	/**
	 * @dataProvider bad_bodies
	 */
	public function test_a_malformed_body_is_refused( $body ) {
		update_option( Rules::OPTION, array( (object) $this->rule( 'WP', 'WordPress' ) ) );

		$response = $this->call( 'POST', '/pronunciation', $body );

		$this->assertSame( 400, $response->get_status() );
		$this->assertCount( 1, Rules::all() );
	}

	public function bad_bodies() {
		return array(
			'no rules key'       => array( array() ),
			'rules is a string'  => array( array( 'rules' => 'WP=WordPress' ) ),
			'a rule is a string' => array( array( 'rules' => array( 'WP' ) ) ),
			'word is a number'   => array(
				array(
					'rules' => array(
						array(
							'actual_text' => 5,
							'to_read'     => 'five',
						),
					),
				),
			),
			'flag is a string'   => array(
				array(
					'rules' => array(
						array(
							'actual_text'      => 'a',
							'to_read'          => 'b',
							'apply_to_numbers' => 'maybe',
						),
					),
				),
			),
		);
	}

	public function test_markup_is_stored_as_plain_text() {
		$this->call( 'POST', '/pronunciation', array( 'rules' => array( $this->rule( '<b>WP</b>', 'Word<script>alert(1)</script>Press' ) ) ) );

		$rule = Rules::all()[0];
		$this->assertSame( 'WP', $rule['actual_text'] );
		$this->assertSame( 'WordPress', $rule['to_read'] );
	}

	public function test_only_administrators_can_read_save_or_preview() {
		update_option( Rules::OPTION, array( (object) $this->rule( 'WP', 'WordPress' ) ) );

		foreach ( array( 0, self::factory()->user->create( array( 'role' => 'editor' ) ) ) as $user_id ) {
			wp_set_current_user( $user_id );

			$this->assertContains( $this->call( 'GET', '/pronunciation' )->get_status(), array( 401, 403 ) );
			$this->assertContains( $this->call( 'POST', '/pronunciation', array( 'rules' => array() ) )->get_status(), array( 401, 403 ) );
			$this->assertContains( $this->call( 'POST', '/pronunciation/preview', array( 'text' => 'WP' ) )->get_status(), array( 401, 403 ) );
		}

		$this->assertCount( 1, Rules::all() );
	}

	public function test_preview_uses_the_saved_rules_and_saves_nothing() {
		update_option( Rules::OPTION, array( (object) $this->rule( 'WP', 'WordPress' ) ) );
		$before = serialize( get_option( Rules::OPTION ) );

		$response = $this->call( 'POST', '/pronunciation/preview', array( 'text' => 'Our WP site uses WPML.' ) );

		$this->assertSame( 'Our WordPress site uses WPML.', $response->get_data()['text'] );
		$this->assertSame( $before, serialize( get_option( Rules::OPTION ) ) );
	}

	public function test_preview_can_try_unsaved_rules() {
		$response = $this->call(
			'POST',
			'/pronunciation/preview',
			array(
				'text'  => 'A 5k budget and a 250k budget.',
				'rules' => array( $this->rule( '5k', '5 thousand', true ) ),
			)
		);

		$this->assertSame( 'A 5 thousand budget and a 250 thousand budget.', $response->get_data()['text'] );
		$this->assertFalse( get_option( Rules::OPTION ) );
	}

	public function test_preview_refuses_a_missing_or_very_long_text() {
		$this->assertSame( 400, $this->call( 'POST', '/pronunciation/preview', array() )->get_status() );
		$this->assertSame( 400, $this->call( 'POST', '/pronunciation/preview', array( 'text' => str_repeat( 'a', 2001 ) ) )->get_status() );
	}

	public function test_preview_returns_text_without_markup() {
		$response = $this->call( 'POST', '/pronunciation/preview', array( 'text' => 'Hi <script>alert(1)</script>there' ) );

		$this->assertStringNotContainsString( '<script', $response->get_data()['text'] );
	}

	public function test_classic_route_stores_exactly_what_it_always_did() {
		$request = new WP_REST_Request( 'POST', '/tta/v1/text_alias' );
		$request->set_param( 'method', 'post' );
		$request->set_param(
			'aliases',
			wp_json_encode(
				array(
					$this->rule( ' WP ', 'WordPress' ),
					$this->rule( '250k', '250 thousand', true ),
					$this->rule( '', 'dropped' ),
					// The classic route has never checked a limit on the server.
					$this->rule( 'km', 'kilometres' ),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$expected = array(
			(object) $this->rule( 'WP', 'WordPress' ),
			(object) $this->rule( '250k', '250 thousand', true ),
			(object) $this->rule( 'km', 'kilometres' ),
		);
		$this->assertSame( 200, $response->get_status() );
		$this->assertEquals( $expected, get_option( Rules::OPTION ) );
		$this->assertEquals( $expected, $response->get_data()['data'] );
		$this->assertTrue( $response->get_data()['status'] );
	}

	public function test_classic_and_new_routes_store_the_same_bytes() {
		add_filter( 'atlasvoice_pronunciation_max_rules', '__return_zero' );
		$rules = array( $this->rule( 'WP', 'WordPress' ), $this->rule( '5k', '5 thousand', true ) );

		$classic = new WP_REST_Request( 'POST', '/tta/v1/text_alias' );
		$classic->set_param( 'method', 'post' );
		$classic->set_param( 'aliases', wp_json_encode( $rules ) );
		rest_get_server()->dispatch( $classic );
		$from_classic = serialize( get_option( Rules::OPTION ) );

		delete_option( Rules::OPTION );
		$this->call( 'POST', '/pronunciation', array( 'rules' => $rules ) );

		$this->assertSame( $from_classic, serialize( get_option( Rules::OPTION ) ) );
	}
}
