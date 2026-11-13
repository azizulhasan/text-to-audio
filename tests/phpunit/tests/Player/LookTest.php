<?php
/**
 * Tests for the look of the player: the service class, its REST routes and
 * `wp atlasvoice look` (TTS-347).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Look_Command;
use TTA\Player\Look;

/**
 * @covers \TTA\Player\Look
 * @covers \TTA_Api\Look_Controller
 * @covers \TTA\CLI\Look_Command
 */
class LookTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Look::OPTION );
		\TTA\TTA_Cache::flush();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	private function stored() {
		return json_decode( wp_json_encode( get_option( Look::OPTION ) ), true );
	}

	/**
	 * What the classic Customization screen stores.
	 */
	private function classic( array $fields = array() ) {
		update_option(
			Look::OPTION,
			(object) array_replace(
				array(
					'backgroundColor'        => '#ffffff',
					'color'                  => '#000000',
					'hoverBackgroundColor'   => '#000000',
					'hoverTextColor'         => '#ffffff',
					'marginTop'              => '0',
					'marginBottom'           => '0',
					'marginLeft'             => '0',
					'marginRight'            => '0',
					'height'                 => '50',
					'border'                 => '2',
					'border_color'           => '#000000',
					'fontSize'               => '20',
					'borderRadius'           => '10',
					'width'                  => '100',
					'tta_play_btn_shortcode' => '[atlasvoice]',
					'buttonSettings'         => (object) array(
						'id'              => '3',
						'button_position' => 'after_content',
					),
				),
				$fields
			)
		);
	}

	private function rest( $method = 'GET', array $body = array() ) {
		$request = new WP_REST_Request( $method, '/tta/v1/look' );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_get_server()->dispatch( $request );
	}

	// The list of parts.

	public function test_every_part_names_its_stored_field_once() {
		$stored = wp_list_pluck( Look::fields(), 'stored' );

		$this->assertCount( 14, $stored );
		$this->assertSame( array_values( $stored ), array_values( array_unique( $stored ) ) );
	}

	public function test_every_part_describes_itself_and_has_a_default_inside_its_limits() {
		foreach ( Look::fields() as $name => $field ) {
			$this->assertNotEmpty( $field['description'], $name );
			if ( 'color' === $field['type'] ) {
				$this->assertSame( $field['default'], sanitize_hex_color( $field['default'] ), $name );
				continue;
			}
			$this->assertGreaterThanOrEqual( $field['min'], $field['default'], $name );
			$this->assertLessThanOrEqual( $field['max'], $field['default'], $name );
			$this->assertContains( $field['unit'], array( 'px', '%' ), $name );
		}
	}

	// Reading.

	public function test_a_site_that_never_saved_shows_what_the_player_draws() {
		$look = Look::get();

		// The same fallbacks as tta_get_button_content() in includes/helpers.php.
		$this->assertSame( '#184c53', $look['background'] );
		$this->assertSame( '#ffffff', $look['text'] );
		$this->assertSame( 100, $look['width'] );
		$this->assertSame( 50, $look['height'] );
		$this->assertSame( 0, $look['border'] );
		$this->assertSame( 4, $look['radius'] );
		$this->assertSame( 18, $look['font_size'] );
		$this->assertSame( 0, $look['margin_left'] );
	}

	public function test_it_reads_what_the_classic_screen_saved() {
		$this->classic(
			array(
				'backgroundColor' => '#5646E5',
				'height'          => '64',
				'marginTop'       => '12',
			)
		);

		$look = Look::get();

		$this->assertSame( '#5646e5', $look['background'] );
		$this->assertSame( '#000000', $look['text'] );
		$this->assertSame( 64, $look['height'] );
		$this->assertSame( 2, $look['border'] );
		$this->assertSame( 10, $look['radius'] );
		$this->assertSame( 20, $look['font_size'] );
		$this->assertSame( 12, $look['margin_top'] );
	}

	public function test_it_reads_settings_stored_as_an_array_and_numbers_stored_as_numbers() {
		update_option(
			Look::OPTION,
			array(
				'color'     => '#111',
				'marginTop' => 8,
				'width'     => 80,
			)
		);

		$look = Look::get();

		$this->assertSame( '#111', $look['text'] );
		$this->assertSame( 8, $look['margin_top'] );
		$this->assertSame( 80, $look['width'] );
	}

	/**
	 * @dataProvider stored_rubbish
	 */
	public function test_a_stored_value_that_cannot_be_used_reads_as_the_default_or_the_limit( $stored_name, $value, $name, $expected ) {
		$this->classic( array( $stored_name => $value ) );

		$this->assertSame( $expected, Look::get()[ $name ] );
	}

	public function stored_rubbish() {
		return array(
			'a colour name'     => array( 'backgroundColor', 'red', 'background', '#184c53' ),
			'markup as colour'  => array( 'color', '"><script>', 'text', '#ffffff' ),
			'a list as colour'  => array( 'border_color', array( '#fff' ), 'border_color', '#000000' ),
			'text as a number'  => array( 'height', 'tall', 'height', 50 ),
			'above the limit'   => array( 'width', '250', 'width', 100 ),
			'below the limit'   => array( 'fontSize', '0', 'font_size', 10 ),
			'a decimal'         => array( 'borderRadius', '7.6', 'radius', 8 ),
			'an empty value'    => array( 'border', '', 'border', 0 ),
		);
	}

	// Saving.

	public function test_a_save_writes_the_fields_the_classic_screen_reads_as_text() {
		$this->classic();

		$saved = Look::save(
			array(
				'background'  => '#184C53',
				'text'        => '#fff',
				'height'      => 44,
				'margin_left' => '16',
			)
		);

		$stored = get_option( Look::OPTION );
		$this->assertSame( '#184c53', $stored->{'backgroundColor'} );
		$this->assertSame( '#fff', $stored->color );
		$this->assertSame( '44', $stored->height );
		$this->assertSame( '16', $stored->{'marginLeft'} );
		$this->assertSame( 44, $saved['height'] );
		$this->assertSame( '#184c53', $saved['background'] );
	}

	public function test_a_save_keeps_every_other_stored_setting() {
		$this->classic();
		$before = $this->stored();

		Look::save( array( 'radius' => 0 ) );

		$before['borderRadius'] = '0';
		$this->assertSame( $before, $this->stored() );
	}

	public function test_the_option_keeps_the_shape_the_classic_screen_stores() {
		$this->classic();

		Look::save( array( 'border' => 1 ) );

		$stored = get_option( Look::OPTION );
		$this->assertIsObject( $stored );
		$this->assertIsObject( $stored->{'buttonSettings'} );
		$this->assertSame( '3', $stored->{'buttonSettings'}->id );
		$this->assertSame( '[atlasvoice]', $stored->tta_play_btn_shortcode );
	}

	public function test_a_save_on_a_site_with_nothing_stored_works() {
		$saved = Look::save( array( 'background' => '#1e1e1e' ) );

		$this->assertSame( '#1e1e1e', $saved['background'] );
		$this->assertSame( '#ffffff', $saved['text'] );
	}

	public function test_the_player_draws_what_was_saved() {
		$this->classic();
		Look::save(
			array(
				'background' => '#5646e5',
				'radius'     => 24,
				'width'      => 60,
			)
		);

		$customize = (array) \TTA\TTA_Helper::tts_get_settings( 'customize' );

		$this->assertSame( '#5646e5', $customize['backgroundColor'] );
		$this->assertSame( '24', $customize['borderRadius'] );
		$this->assertSame( '60', $customize['width'] );
	}

	/**
	 * @dataProvider wrong_values
	 */
	public function test_a_wrong_value_saves_nothing( $field, $value ) {
		$this->classic();
		$before = $this->stored();

		$result = Look::save(
			array(
				'height' => 44,
				$field   => $value,
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( sanitize_key( $field ), $result->get_error_data()['field'] );
		$this->assertSame( $before, $this->stored() );
	}

	public function wrong_values() {
		return array(
			'a colour name'       => array( 'background', 'red' ),
			'a colour with css'   => array( 'text', '#fff;background:url(x)' ),
			'an rgb colour'       => array( 'hover_text', 'rgb(0,0,0)' ),
			'a colour as a list'  => array( 'border_color', array( '#fff' ) ),
			'a number with a unit' => array( 'radius', '10px' ),
			'a decimal'           => array( 'font_size', 14.5 ),
			'below the limit'     => array( 'font_size', 2 ),
			'above the limit'     => array( 'width', 101 ),
			'a negative margin'   => array( 'margin_top', -5 ),
			'a number as a list'  => array( 'border', array( 1 ) ),
			'an unknown setting'  => array( 'custom_css', 'body{display:none}' ),
			'a stored field name' => array( 'backgroundColor', '#ffffff' ),
		);
	}

	public function test_custom_css_cannot_come_back_through_this_door() {
		// wp.org does not allow a plugin to store arbitrary CSS (TTS-249).
		$this->assertArrayNotHasKey( 'custom_css', Look::fields() );
		$this->assertNotContains( 'custom_css', wp_list_pluck( Look::fields(), 'stored' ) );
	}

	public function test_an_empty_save_is_refused() {
		$result = Look::save( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_nothing_to_save', $result->get_error_code() );
	}

	// The REST routes.

	public function test_get_returns_the_look() {
		$this->classic();

		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Look::get(), $response->get_data() );
	}

	public function test_post_saves_only_what_was_sent() {
		$this->classic();

		$response = $this->rest(
			'POST',
			array(
				'text'   => '#202124',
				'border' => 0,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '#202124', $response->get_data()['text'] );
		$this->assertSame( 0, $response->get_data()['border'] );
		$this->assertSame( '#ffffff', $this->stored()['backgroundColor'] );
		$this->assertSame( '50', $this->stored()['height'] );
	}

	/**
	 * @dataProvider refused_bodies
	 */
	public function test_post_refuses_values_outside_the_described_limits( array $body ) {
		$this->classic();
		$before = $this->stored();

		$this->assertSame( 400, $this->rest( 'POST', $body )->get_status() );
		$this->assertSame( $before, $this->stored() );
	}

	public function refused_bodies() {
		return array(
			'not a hex colour' => array( array( 'background' => 'javascript:alert(1)' ) ),
			'too wide'         => array( array( 'width' => 500 ) ),
			'too small'        => array( array( 'height' => 1 ) ),
		);
	}

	public function test_each_method_and_each_part_describes_itself() {
		$routes = rest_get_server()->get_routes()['/tta/v1/look'];

		$this->assertCount( 2, $routes );
		foreach ( $routes as $route ) {
			$this->assertNotEmpty( $route['label'] );
			$this->assertNotEmpty( $route['description'] );
		}
		$this->assertSame( array_keys( Look::fields() ), array_keys( $routes[1]['args'] ) );
		foreach ( $routes[1]['args'] as $name => $arg ) {
			$this->assertNotEmpty( $arg['description'], $name );
		}
		$this->assertSame( 100, $routes[1]['args']['width']['maximum'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_or_change_the_look( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
		$this->assertContains( $this->rest( 'POST', array( 'height' => 44 ) )->get_status(), array( 401, 403 ) );
		$this->assertFalse( get_option( Look::OPTION ) );
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

		$this->assertSame( Look_Command::class, WP_CLI::$commands['atlasvoice look'] );
	}

	public function test_get_prints_every_part_with_its_unit() {
		$this->classic();

		( new Look_Command() )->get( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );
		$this->assertCount( 14, $lines );
		$this->assertContains( 'background: #ffffff', $lines );
		$this->assertContains( 'height: 50px', $lines );
		$this->assertContains( 'width: 100%', $lines );
	}

	public function test_get_can_print_json_for_scripts() {
		( new Look_Command() )->get( array(), array( 'format' => 'json' ) );

		$this->assertSame( Look::get(), json_decode( end( WP_CLI::$log )[1], true ) );
	}

	public function test_set_saves_what_was_given() {
		$this->classic();

		( new Look_Command() )->set(
			array(),
			array(
				'background' => '#184c53',
				'radius'     => '0',
			)
		);

		$this->assertSame( array( 'success', 'Look saved.' ), end( WP_CLI::$log ) );
		$this->assertSame( '#184c53', Look::get()['background'] );
		$this->assertSame( 0, Look::get()['radius'] );
	}

	public function test_set_says_which_value_was_refused_and_why() {
		try {
			( new Look_Command() )->set( array(), array( 'width' => '400' ) );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			unset( $stop );
		}

		$this->assertSame( 'error', WP_CLI::$log[0][0] );
		$this->assertStringContainsString( 'width: This must be a whole number from 10 to 100.', WP_CLI::$log[0][1] );
	}
}
