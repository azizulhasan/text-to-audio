<?php
/**
 * Tests for "at most one AtlasVoice notice per screen, by priority" (TTS-347).
 *
 * @package TTA
 */

use TTA\TTA_Notices;
use TTA_Admin\Admin_App;

/**
 * @covers \TTA\TTA_Notices::display_notices
 * @covers \TTA\TTA_Notices::priority_of
 * @covers \TTA\TTA_Notices::notices_by_priority
 * @covers \TTA\TTA_Notices::one_at_a_time
 */
class NoticesOneAtATimeTest extends WP_UnitTestCase {

	/** @var array The notices the site really registered, put back after each test. */
	private $real;

	/** @var ReflectionProperty */
	private $list;

	public function set_up() {
		parent::set_up();
		$this->list = new ReflectionProperty( TTA_Notices::class, 'notices' );
		$this->list->setAccessible( true );
		$this->real = $this->list->getValue( TTA_Notices::instance() );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		set_current_screen( 'dashboard' );
	}

	public function tear_down() {
		$this->list->setValue( TTA_Notices::instance(), $this->real );
		remove_all_filters( 'atlasvoice_admin_ui' );
		remove_all_filters( 'atlasvoice_notice_priority' );
		$_GET = array();
		set_current_screen( 'front' );
		parent::tear_down();
	}

	/**
	 * Registers notices that print their own id, or nothing.
	 *
	 * @param array $notices id => whether it has something to say (or an array of arguments).
	 */
	private function register( array $notices ) {
		$this->list->setValue( TTA_Notices::instance(), array() );

		foreach ( $notices as $id => $more ) {
			$says = is_array( $more ) ? true : $more;
			TTA_Notices::instance()->register_notice(
				array(
					'id'              => $id,
					'dismissible'     => false,
					'render_callback' => static function ( $notice_id ) use ( $says ) {
						if ( $says ) {
							echo '[' . esc_html( $notice_id ) . ']';
						}
					},
				) + ( is_array( $more ) ? $more : array() )
			);
		}
	}

	private function shown() {
		ob_start();
		TTA_Notices::instance()->display_notices();

		return (string) ob_get_clean();
	}

	/** Turns the new admin on; false when its build is not there. */
	private function new_admin() {
		add_filter(
			'atlasvoice_admin_ui',
			static function () {
				return Admin_App::UI_NEW;
			}
		);

		return Admin_App::is_enabled();
	}

	// ---- the kinds -------------------------------------------------------------

	public function test_each_known_notice_has_its_kind() {
		$kinds = array(
			'cors_cdn_issue'            => 'problem',
			'browser_support'           => 'problem',
			'pro_update_required'       => 'problem',
			'staging_sitewide'          => 'staging',
			'atlasvoice_usage_low_2026' => 'usage',
			'features'                  => 'update',
			'atlasvoice_updated_2_5_0'  => 'update',
			'translation'               => 'update',
			'onboarding'                => 'setup',
			'atlasvoice_tts_intro'      => 'setup',
			'review'                    => 'review',
			'something_new'             => 'news',
		);

		foreach ( $kinds as $id => $kind ) {
			$this->assertSame( $kind, TTA_Notices::priority_of( $id ), $id );
		}
	}

	public function test_a_notice_can_name_its_own_kind_and_a_wrong_kind_is_news() {
		$this->assertSame( 'problem', TTA_Notices::priority_of( 'mine', array( 'priority' => 'problem' ) ) );
		$this->assertSame( 'news', TTA_Notices::priority_of( 'mine', array( 'priority' => 'loudest' ) ) );

		add_filter(
			'atlasvoice_notice_priority',
			static function ( $kind, $id ) {
				return 'mine' === $id ? 'usage' : $kind;
			},
			10,
			2
		);
		$this->assertSame( 'usage', TTA_Notices::priority_of( 'mine' ) );
	}

	public function test_notices_are_ordered_by_kind_then_by_registration() {
		$this->register(
			array(
				'review'           => true,
				'second_news'      => true,
				'staging_sitewide' => true,
				'cors_cdn_issue'   => true,
				'onboarding'       => true,
				'browser_support'  => true,
			)
		);

		$this->assertSame(
			array( 'cors_cdn_issue', 'browser_support', 'staging_sitewide', 'onboarding', 'review', 'second_news' ),
			array_keys( TTA_Notices::instance()->notices_by_priority() )
		);
	}

	// ---- what a screen shows ---------------------------------------------------

	public function test_the_classic_admin_shows_every_notice_as_before() {
		$this->register(
			array(
				'review'         => true,
				'cors_cdn_issue' => true,
			)
		);

		$this->assertFalse( TTA_Notices::one_at_a_time() );
		$this->assertSame( '[review][cors_cdn_issue]', $this->shown() );
	}

	public function test_with_the_new_admin_a_screen_gets_the_most_pressing_notice_only() {
		if ( ! $this->new_admin() ) {
			$this->markTestSkipped( 'The new admin is not built here.' );
		}
		$this->register(
			array(
				'review'           => true,
				'staging_sitewide' => true,
				'cors_cdn_issue'   => true,
			)
		);

		$this->assertSame( '[cors_cdn_issue]', $this->shown() );
	}

	public function test_a_notice_with_nothing_to_say_gives_its_turn_to_the_next_kind() {
		if ( ! $this->new_admin() ) {
			$this->markTestSkipped( 'The new admin is not built here.' );
		}
		$this->register(
			array(
				'cors_cdn_issue'   => false,
				'staging_sitewide' => false,
				'review'           => true,
				'second_news'      => true,
			)
		);

		$this->assertSame( '[review]', $this->shown() );
	}

	public function test_a_notice_that_is_not_shown_is_not_counted_as_shown() {
		if ( ! $this->new_admin() ) {
			$this->markTestSkipped( 'The new admin is not built here.' );
		}
		$this->register(
			array(
				'cors_cdn_issue' => true,
				'once_only'      => array( 'show_once' => true ),
			)
		);

		$this->shown();

		$this->assertEmpty( get_user_meta( get_current_user_id(), 'tta_shown_once_only', true ), 'It keeps its one showing for later.' );
	}

	public function test_no_notice_at_all_prints_nothing() {
		if ( ! $this->new_admin() ) {
			$this->markTestSkipped( 'The new admin is not built here.' );
		}
		$this->register( array( 'review' => false ) );

		$this->assertSame( '', $this->shown() );
	}

	public function test_on_atlasvoices_own_page_every_notice_is_printed_for_the_bell() {
		if ( ! $this->new_admin() ) {
			$this->markTestSkipped( 'The new admin is not built here.' );
		}
		$_GET['page'] = 'text-to-audio';
		$this->register(
			array(
				'review'         => true,
				'cors_cdn_issue' => true,
			)
		);

		$this->assertFalse( TTA_Notices::one_at_a_time() );
		$this->assertSame( '[review][cors_cdn_issue]', $this->shown() );
	}
}
