<?php
/**
 * Tests for `wp atlasvoice pronunciation` (TTS-376).
 *
 * @package TTA
 */

use TTA\CLI\Commands;
use TTA\CLI\Pronunciation_Command;
use TTA\Pronunciation\Rules;

/**
 * @covers \TTA\CLI\Pronunciation_Command
 */
class PronunciationCommandTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		delete_option( Rules::OPTION );
		\TTA\TTA_Cache::flush();
		add_filter( 'atlasvoice_pronunciation_max_rules', '__return_zero' );
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_pronunciation_max_rules' );
		parent::tear_down();
	}

	private function last() {
		return end( WP_CLI::$log );
	}

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Pronunciation_Command::class, WP_CLI::$commands['atlasvoice pronunciation'] );
	}

	public function test_add_saves_a_rule_in_the_stored_shape() {
		( new Pronunciation_Command() )->add( array( 'WP', 'WordPress' ), array() );

		$this->assertEquals(
			array(
				(object) array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
			),
			get_option( Rules::OPTION )
		);
		$this->assertSame( 'success', $this->last()[0] );
	}

	public function test_add_with_numbers_sets_the_flag() {
		( new Pronunciation_Command() )->add( array( '5k', '5 thousand' ), array( 'numbers' => true ) );

		$this->assertTrue( Rules::all()[0]['apply_to_numbers'] );
	}

	public function test_add_for_a_listed_word_changes_it_instead_of_adding_a_second() {
		$command = new Pronunciation_Command();
		$command->add( array( 'WP', 'WordPress' ), array() );
		$command->add( array( 'km', 'kilometres' ), array() );

		$command->add( array( ' wp ', 'W P' ), array() );

		$rules = Rules::all();
		$this->assertCount( 2, $rules );
		$this->assertSame( 'W P', $rules[0]['to_read'] );
		$this->assertSame( 'km', $rules[1]['actual_text'], 'The order changed.' );
	}

	public function test_add_reports_the_limit_and_saves_nothing_more() {
		remove_all_filters( 'atlasvoice_pronunciation_max_rules' );
		$command = new Pronunciation_Command();
		$command->add( array( 'WP', 'WordPress' ), array() );

		try {
			$command->add( array( 'km', 'kilometres' ), array() );
			$this->fail( 'A second rule was accepted past the limit.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertSame( 'error', $this->last()[0] );
		}

		$this->assertCount( 1, Rules::all() );
	}

	public function test_remove_deletes_only_that_rule() {
		$command = new Pronunciation_Command();
		$command->add( array( 'WP', 'WordPress' ), array() );
		$command->add( array( 'km', 'kilometres' ), array() );

		$command->remove( array( 'wp' ), array() );

		$this->assertSame( array( 'km' ), array_column( Rules::all(), 'actual_text' ) );
		// The stored list has no gap in its keys.
		$this->assertSame( array( 0 ), array_keys( get_option( Rules::OPTION ) ) );
	}

	public function test_remove_of_an_unknown_word_is_an_error_and_changes_nothing() {
		$command = new Pronunciation_Command();
		$command->add( array( 'WP', 'WordPress' ), array() );

		try {
			$command->remove( array( 'nope' ), array() );
			$this->fail( 'Removing an unknown word did not fail.' );
		} catch ( Atlasvoice_Cli_Stop $stop ) {
			$this->assertCount( 1, Rules::all() );
		}
	}

	public function test_test_prints_how_the_sentence_is_read_and_saves_nothing() {
		$command = new Pronunciation_Command();
		$command->add( array( 'WP', 'WordPress' ), array() );
		$before = serialize( get_option( Rules::OPTION ) );

		$command->test( array( 'Our WP site uses WPML.' ), array() );

		$this->assertSame( array( 'line', 'Our WordPress site uses WPML.' ), $this->last() );
		$this->assertSame( $before, serialize( get_option( Rules::OPTION ) ) );
	}

	public function test_the_command_and_the_route_store_the_same_bytes() {
		( new Pronunciation_Command() )->add( array( '5k', '5 thousand' ), array( 'numbers' => true ) );
		$from_cli = serialize( get_option( Rules::OPTION ) );

		delete_option( Rules::OPTION );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		$request        = new WP_REST_Request( 'POST', '/tta/v1/pronunciation' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'rules' => array(
						array(
							'actual_text'      => '5k',
							'to_read'          => '5 thousand',
							'apply_to_numbers' => true,
						),
					),
				)
			)
		);
		rest_get_server()->dispatch( $request );

		$this->assertSame( $from_cli, serialize( get_option( Rules::OPTION ) ) );
	}
}
