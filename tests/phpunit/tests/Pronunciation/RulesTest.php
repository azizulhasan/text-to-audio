<?php
/**
 * Tests for TTA\Pronunciation\Rules (TTS-347, Voice › Pronunciation).
 *
 * @package TTA
 */

use TTA\Pronunciation\Rules;

/**
 * @covers \TTA\Pronunciation\Rules
 */
class RulesTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		delete_option( Rules::OPTION );
		\TTA\TTA_Cache::flush();
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_pronunciation_max_rules' );
		remove_all_filters( 'tts_text_aliases' );
		remove_all_filters( 'tts_pronunciation_text' );
		parent::tear_down();
	}

	private function no_limit() {
		add_filter( 'atlasvoice_pronunciation_max_rules', '__return_zero' );
	}

	public function test_stored_shape_is_unchanged() {
		$this->no_limit();

		Rules::save(
			array(
				array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
				array(
					'actual_text'      => '5k',
					'to_read'          => '5 thousand',
					'apply_to_numbers' => true,
				),
			)
		);

		// A list of objects; apply_to_numbers is present only when it is on.
		$this->assertEquals(
			array(
				(object) array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
				(object) array(
					'actual_text'      => '5k',
					'to_read'          => '5 thousand',
					'apply_to_numbers' => true,
				),
			),
			get_option( Rules::OPTION )
		);
	}

	public function test_old_rules_are_byte_identical_after_saving_them_again() {
		$this->no_limit();
		$old = array(
			(object) array(
				'actual_text' => 'WP',
				'to_read'     => 'WordPress',
			),
			(object) array(
				'actual_text'      => '250k',
				'to_read'          => '250 thousand',
				'apply_to_numbers' => true,
			),
		);
		update_option( Rules::OPTION, $old, false );
		$before = serialize( get_option( Rules::OPTION ) );

		Rules::save( Rules::all() );

		$this->assertSame( $before, serialize( get_option( Rules::OPTION ) ) );
	}

	public function test_all_reads_arrays_and_objects_and_skips_broken_rows() {
		update_option(
			Rules::OPTION,
			array(
				(object) array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
				array(
					'actual_text' => 'km',
					'to_read'     => 'kilometres',
				),
				(object) array( 'to_read' => 'no word' ),
				'not a rule',
			)
		);

		$this->assertSame(
			array(
				array(
					'actual_text'      => 'WP',
					'to_read'          => 'WordPress',
					'apply_to_numbers' => false,
				),
				array(
					'actual_text'      => 'km',
					'to_read'          => 'kilometres',
					'apply_to_numbers' => false,
				),
			),
			Rules::all()
		);
	}

	public function test_input_is_cleaned_to_plain_trimmed_text() {
		$rules = Rules::sanitize(
			array(
				array(
					'actual_text' => '  <b>WP</b> ',
					'to_read'     => "Word<script>alert(1)</script>Press\n",
				),
				array(
					'actual_text' => '   ',
					'to_read'     => 'dropped: no word',
				),
				array(
					'actual_text' => array( 'x' ),
					'to_read'     => 'dropped: not text',
				),
				'dropped: not a rule',
			)
		);

		$this->assertCount( 1, $rules );
		$this->assertSame( 'WP', $rules[0]->actual_text );
		$this->assertSame( 'WordPress', $rules[0]->to_read );
	}

	public function test_free_keeps_one_rule_and_refuses_a_second() {
		$this->assertSame( 1, Rules::max_rules() );

		$this->assertNotWPError(
			Rules::save(
				array(
					array(
						'actual_text' => 'WP',
						'to_read'     => 'WordPress',
					),
				)
			)
		);

		$result = Rules::save(
			array(
				array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
				array(
					'actual_text' => 'km',
					'to_read'     => 'kilometres',
				),
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_rule_limit', $result->get_error_code() );
		$this->assertCount( 1, Rules::all(), 'A refused save changed the stored rules.' );
	}

	public function test_rules_saved_with_an_add_on_are_never_removed_for_the_owner() {
		// Three rules were saved while an add-on was active; it is gone now.
		update_option(
			Rules::OPTION,
			array(
				(object) array(
					'actual_text' => 'a',
					'to_read'     => '1',
				),
				(object) array(
					'actual_text' => 'b',
					'to_read'     => '2',
				),
				(object) array(
					'actual_text' => 'c',
					'to_read'     => '3',
				),
			)
		);

		// Editing one of them keeps all three.
		$rules               = Rules::all();
		$rules[1]['to_read'] = 'two';
		$this->assertCount( 3, Rules::save( $rules ) );

		// Shortening is allowed; growing is not.
		$this->assertCount( 2, Rules::save( array_slice( Rules::all(), 0, 2 ) ) );
		$this->assertWPError(
			Rules::save(
				array_merge(
					Rules::all(),
					array(
						array(
							'actual_text' => 'd',
							'to_read'     => '4',
						),
					)
				)
			)
		);
	}

	public function test_an_add_on_lifts_the_limit_through_the_filter() {
		$this->no_limit();

		$saved = Rules::save(
			array(
				array(
					'actual_text' => 'a',
					'to_read'     => '1',
				),
				array(
					'actual_text' => 'b',
					'to_read'     => '2',
				),
				array(
					'actual_text' => 'c',
					'to_read'     => '3',
				),
			)
		);

		$this->assertCount( 3, $saved );
		$this->assertCount( 3, Rules::active() );
	}

	public function test_the_same_word_twice_is_refused() {
		$this->no_limit();

		$result = Rules::save(
			array(
				array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
				array(
					'actual_text' => 'wp',
					'to_read'     => 'W P',
				),
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 'atlasvoice_duplicate_rule', $result->get_error_code() );
	}

	public function test_something_that_is_not_a_list_is_refused() {
		foreach ( array( null, 'text', 5, new stdClass() ) as $value ) {
			$this->assertWPError( Rules::save( $value ) );
		}
	}

	public function test_an_empty_list_removes_every_rule() {
		Rules::save(
			array(
				array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
			)
		);

		$this->assertSame( array(), Rules::save( array() ) );
		$this->assertSame( array(), get_option( Rules::OPTION ) );
	}

	public function test_apply_changes_whole_words_only() {
		Rules::save(
			array(
				array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
			)
		);

		$this->assertSame( 'Our WordPress site uses WPML.', Rules::apply( 'Our WP site uses WPML.' ) );
	}

	public function test_apply_uses_only_the_rules_within_the_limit() {
		update_option(
			Rules::OPTION,
			array(
				(object) array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
				(object) array(
					'actual_text' => 'km',
					'to_read'     => 'kilometres',
				),
			)
		);

		$this->assertSame( 'WordPress, 5 km', Rules::apply( 'WP, 5 km' ) );

		$this->no_limit();
		$this->assertSame( 'WordPress, 5 kilometres', Rules::apply( 'WP, 5 km' ) );
	}

	public function test_apply_can_try_rules_that_are_not_saved() {
		$text = Rules::apply(
			'A 5k budget and a 250k budget.',
			array(
				array(
					'actual_text'      => '5k',
					'to_read'          => '5 thousand',
					'apply_to_numbers' => true,
				),
			)
		);

		$this->assertSame( 'A 5 thousand budget and a 250 thousand budget.', $text );
		$this->assertSame( array(), Rules::all(), 'A preview saved something.' );
	}

	public function test_rules_added_in_code_still_apply() {
		add_filter(
			'tts_text_aliases',
			static function ( $rules ) {
				$rules[] = array(
					'actual_text' => 'km',
					'to_read'     => 'kilometres',
				);

				return $rules;
			}
		);

		$this->assertSame( '5 kilometres', Rules::apply( '5 km' ) );
	}

	public function test_saving_clears_the_settings_cache() {
		// Prime the cache with no rules, then save one.
		\TTA\TTA_Helper::tts_get_settings( 'aliases' );

		Rules::save(
			array(
				array(
					'actual_text' => 'WP',
					'to_read'     => 'WordPress',
				),
			)
		);

		$cached = (array) \TTA\TTA_Helper::tts_get_settings( 'aliases' );
		$this->assertCount( 1, $cached );
	}
}
