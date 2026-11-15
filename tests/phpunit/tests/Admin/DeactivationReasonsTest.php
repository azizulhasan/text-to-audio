<?php
/**
 * Tests for the reasons on the form that asks why the plugin is deactivated
 * (TTS-347): the list of the approved design.
 *
 * @package TTA
 */

use AtlasAiDev\AppService\Insights;

/**
 * @covers \AtlasAiDev\AppService\Insights
 */
class DeactivationReasonsTest extends WP_UnitTestCase {

	const SLUG = 'text-to-audio';

	public function tear_down() {
		remove_all_filters( self::SLUG . '_extra_uninstall_reasons' );
		parent::tear_down();
	}

	/**
	 * The reasons, as the form gets them. The form's class is made without
	 * its start-up, so nothing is hooked and nothing is sent.
	 */
	private function reasons() {
		$class    = new ReflectionClass( Insights::class );
		$insights = $class->newInstanceWithoutConstructor();

		$client = $class->getProperty( 'client' );
		$client->setAccessible( true );
		$client->setValue(
			$insights,
			new class() {
				// phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- the name the form's class calls.
				public function getSlug() {
					return DeactivationReasonsTest::SLUG;
				}
			}
		);

		$method = $class->getMethod( '__get_uninstall_reasons' );
		$method->setAccessible( true );

		return $method->invoke( $insights );
	}

	public function test_the_reasons_are_the_six_of_the_approved_design_in_its_order() {
		$this->assertSame(
			array(
				'Voice sounds robotic',
				'My language is missing',
				'Doesn’t work on phones',
				'Couldn’t find how to start',
				'Player in the wrong place',
				'Something else',
			),
			wp_list_pluck( $this->reasons(), 'text' )
		);
	}

	public function test_each_reason_has_an_id_the_tracker_can_file_it_under() {
		$ids = wp_list_pluck( $this->reasons(), 'id' );

		$this->assertSame(
			array( 'voice-robotic', 'language-missing', 'not-on-phones', 'could-not-understand', 'player-wrong-place', 'other' ),
			$ids
		);
		foreach ( $ids as $id ) {
			$this->assertMatchesRegularExpression( '/^[a-z]+(-[a-z]+)*$/', $id );
		}
		$this->assertSame( $ids, array_unique( $ids ) );
	}

	public function test_the_two_reasons_that_mean_what_they_always_meant_keep_their_id() {
		$by_id = wp_list_pluck( $this->reasons(), 'text', 'id' );

		$this->assertSame( 'Couldn’t find how to start', $by_id['could-not-understand'] );
		$this->assertSame( 'Something else', $by_id['other'] );
	}

	public function test_the_ids_the_form_sends_by_itself_are_not_taken_by_a_reason() {
		// "none" (nothing chosen) and "no-comment" (Skip and deactivate) are sent by the form's script.
		$this->assertSame( array(), array_intersect( array( 'none', 'no-comment' ), wp_list_pluck( $this->reasons(), 'id' ) ) );
	}

	public function test_every_reason_can_be_explained_or_used_to_ask_for_help() {
		foreach ( $this->reasons() as $reason ) {
			$this->assertSame( 'textarea', $reason['type'], $reason['id'] );
			$this->assertSame( 'Tell us more, or ask for help (optional)', $reason['placeholder'], $reason['id'] );
		}
	}

	public function test_every_reason_has_what_the_form_prints() {
		foreach ( $this->reasons() as $reason ) {
			$this->assertSame( array( 'id', 'text', 'type', 'placeholder' ), array_keys( $reason ) );
		}
	}

	public function test_a_reason_an_extension_adds_still_comes_before_something_else() {
		add_filter(
			self::SLUG . '_extra_uninstall_reasons',
			static function () {
				return array(
					array(
						'id'          => 'too-expensive',
						'text'        => 'Too expensive',
						'type'        => '',
						'placeholder' => '',
					),
				);
			}
		);

		$ids = wp_list_pluck( $this->reasons(), 'id' );

		$this->assertCount( 7, $ids );
		$this->assertSame( array( 'too-expensive', 'other' ), array_slice( $ids, -2 ) );
	}

	public function test_the_form_asks_with_the_approved_words() {
		$source = file_get_contents( dirname( __DIR__, 4 ) . '/libs/AtlasAiDev/Insights.php' );

		foreach ( array( 'Before you go, why are you leaving?', 'Skip and deactivate', 'Send and deactivate' ) as $words ) {
			$this->assertStringContainsString( $words, $source );
		}
	}
}
