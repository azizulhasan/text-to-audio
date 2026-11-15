<?php
/**
 * Tests for the content picker on the live page: the panel an administrator
 * gets to pick what is read (TTS-347, the approved "What is read" panel).
 *
 * @package TTA
 */

use TTA\AtlasVoice\StepRail;

/**
 * @covers \TTA\AtlasVoice\StepRail::render_shell
 */
class PickerPanelTest extends WP_UnitTestCase {

	/**
	 * The panel's markup for a post.
	 */
	private function panel() {
		$active = new ReflectionProperty( StepRail::class, 'front_active' );
		$active->setAccessible( true );
		$active->setValue( null, true );

		$post_id = self::factory()->post->create( array( 'post_title' => 'A post' ) );
		$this->go_to( get_permalink( $post_id ) );
		setup_postdata( $GLOBALS['post'] = get_post( $post_id ) ); // phpcs:ignore

		ob_start();
		StepRail::render_shell();
		$html = (string) ob_get_clean();

		$active->setValue( null, false );

		return $html;
	}

	public function test_nothing_is_drawn_while_the_picker_is_not_open_for_this_page() {
		ob_start();
		StepRail::render_shell();

		$this->assertSame( '', ob_get_clean() );
	}

	public function test_the_panel_says_what_it_is_and_who_sees_it() {
		$html = $this->panel();

		$this->assertStringContainsString( 'Only you can see this panel', $html );
		$this->assertStringContainsString( 'What is read', $html );
		$this->assertStringNotContainsString( 'AtlasVoiceSelector', $html );
		$this->assertStringNotContainsString( 'Content Selector', $html );
	}

	public function test_it_has_the_four_steps_of_the_design_in_order() {
		$html  = $this->panel();
		$steps = array( 'Applies to', 'Read this part', 'Skip parts of it', 'Check other posts' );
		$last  = -1;

		foreach ( $steps as $index => $name ) {
			$at = strpos( $html, '<span class="av-step__num">' . ( $index + 1 ) . '.</span>' );
			$this->assertNotFalse( $at, 'Step ' . ( $index + 1 ) . ' is numbered.' );
			$this->assertGreaterThan( $last, $at );
			$this->assertNotFalse( strpos( $html, '>' . $name . '<', $at ), $name );
			$last = $at;
		}

		$this->assertSame( 4, substr_count( $html, 'class="av-step__num"' ), 'No fifth or sixth step.' );
	}

	public function test_the_part_to_read_is_picked_by_a_click_a_drag_or_a_selector() {
		$html = $this->panel();

		$this->assertStringContainsString( 'Click to pick', $html );
		$this->assertStringContainsString( 'Drag over text', $html );
		$this->assertMatchesRegularExpression( '/<label[^>]+for="av-selector-input"[^>]*>CSS selector<\/label>/', $html );
		$this->assertStringContainsString( 'id="av-selector-input"', $html );
	}

	public function test_other_posts_are_checked_with_a_number_and_one_button() {
		$html = $this->panel();

		$this->assertStringContainsString( 'How many', $html );
		$this->assertMatchesRegularExpression( '/<input type="number" class="av-verify-size" min="1" max="20"/', $html );
		$this->assertMatchesRegularExpression( '/<button type="button" class="av-btn av-btn--verify">Check<\/button>/', $html );
		// The number is a field of its own, not a field inside the button.
		$this->assertDoesNotMatchRegularExpression( '/<button[^>]*av-btn--verify[^>]*>[^<]*<input/', $html );
	}

	public function test_the_text_that_is_read_can_be_shown_from_the_panel() {
		$html = $this->panel();

		$this->assertMatchesRegularExpression( '/<button type="button" class="av-btn av-btn--show-text"[^>]*aria-controls="av-preview-panel"[^>]*>Show the text<\/button>/', $html );
		$this->assertStringContainsString( 'av-btn--save', $html );
	}

	public function test_the_words_of_the_script_are_given_translated() {
		$html = $this->panel();
		$this->assertSame( 1, preg_match( '/data-words="([^"]*)"/', $html, $found ) );
		$words = json_decode( html_entity_decode( $found[1], ENT_QUOTES ), true );

		$this->assertSame( 'This post', $words['thisPost'] );
		$this->assertSame( 'All posts', $words['allOfType'] );
		$this->assertSame( 'Whole site', $words['wholeSite'] );
		$this->assertSame( 'Found on %1$d of %2$d posts · about %3$d words each.', $words['found'] );
		foreach ( array( 'freeScope', 'notFound', 'checking', 'pickFirst', 'noPosts', 'checkFail', 'words', 'showText', 'hideText' ) as $key ) {
			$this->assertNotEmpty( $words[ $key ], $key );
		}
	}

	public function test_without_pro_skipping_is_one_line_and_no_control() {
		if ( function_exists( 'is_pro_active' ) && is_pro_active() ) {
			$this->markTestSkipped( 'Pro is active here.' );
		}
		$html = $this->panel();
		$at   = strpos( $html, 'data-step="pro-cta"' );
		$end  = strpos( $html, '</section>', $at );
		$part = substr( $html, $at, $end - $at );

		$this->assertStringContainsString( 'Skip share bars, captions and phrases.', $part );
		$this->assertStringContainsString( 'See Pro', $part );
		// wp.org guideline 5: no control of a Pro feature in the free plugin.
		$this->assertSame( 0, preg_match( '/<(input|select|textarea|button)\b/', $part ) );
		$this->assertStringNotContainsString( 'data-chip-kind', $html );
	}
}
