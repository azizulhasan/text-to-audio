<?php
/**
 * Tests for the Pro plans: the data class, its REST route, its WP-CLI
 * command and the boot data of the admin app (TTS-347).
 *
 * @package TTA
 */

use TTA\Account\Plans;
use TTA\CLI\Commands;
use TTA\CLI\Plans_Command;
use TTA_Admin\Admin_App;

/**
 * @covers \TTA\Account\Plans
 * @covers \TTA_Api\Plans_Controller
 * @covers \TTA\CLI\Plans_Command
 */
class PlansTest extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		WP_CLI::reset();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down() {
		remove_all_filters( 'atlasvoice_plans' );
		parent::tear_down();
	}

	private function rest() {
		return rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/tta/v1/plans' ) );
	}

	// The data.

	public function test_the_plans_are_the_three_freemius_plans_with_their_prices() {
		$tiers = Plans::all()['tiers'];

		$this->assertSame( array( 1, 5, 10 ), wp_list_pluck( $tiers, 'sites' ) );
		$this->assertSame( array( 59, 149, 199 ), wp_list_pluck( $tiers, 'yearly' ) );
		$this->assertSame( array( 199, 249, 299 ), wp_list_pluck( $tiers, 'lifetime' ) );
		$this->assertSame( array( false, true, false ), wp_list_pluck( $tiers, 'popular' ) );
	}

	public function test_the_prices_are_the_ones_the_classic_pricing_page_shows() {
		// Until the classic screens go (2.7) both pages are shipped, and a
		// visitor must never see two prices for one plan.
		$classic = file_get_contents( dirname( __DIR__, 4 ) . '/admin/js/pricing/index.js' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file of the plugin itself.

		foreach ( Plans::all()['tiers'] as $tier ) {
			$this->assertStringContainsString(
				sprintf( 'annual: %d, lifetime: %d, licenses: %d', $tier['yearly'], $tier['lifetime'], $tier['sites'] ),
				$classic
			);
		}
		$this->assertStringContainsString( Plans::CHECKOUT_BASE, $classic );
	}

	public function test_each_plan_has_a_yearly_and_a_lifetime_checkout_link_on_freemius() {
		foreach ( Plans::all()['tiers'] as $tier ) {
			$this->assertSame( 'https://checkout.freemius.com/plugin/13388/plan/22449/licenses/' . $tier['sites'] . '/', $tier['checkout']['yearly'] );
			$this->assertSame( $tier['checkout']['yearly'] . '?billing_cycle=lifetime', $tier['checkout']['lifetime'] );
		}
	}

	public function test_the_links_carry_the_campaign_and_name_the_plans_tab() {
		$links = Plans::all()['links'];

		$this->assertStringStartsWith( 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/?', $links['pricing'] );
		$this->assertStringStartsWith( 'https://atlasaidev.com/plugins/text-to-speech-pro/demo/?', $links['demo'] );
		foreach ( array( $links['pricing'], $links['demo'] ) as $link ) {
			$this->assertStringContainsString( 'utm_source=text-to-audio', $link );
			$this->assertStringContainsString( 'utm_medium=plugin_admin', $link );
			$this->assertStringContainsString( 'utm_campaign=free_to_pro', $link );
			$this->assertStringContainsString( 'utm_content=plans_tab', $link );
		}
		$this->assertSame( 'https://atlasaidev.com/refund-policy/', $links['refund'] );
		$this->assertSame( 14, Plans::all()['refund_days'] );
	}

	// The filter.

	public function test_an_offer_can_change_a_price_through_the_filter() {
		add_filter(
			'atlasvoice_plans',
			static function ( $plans ) {
				$plans['tiers'][0]['yearly'] = 49;

				return $plans;
			}
		);

		$this->assertSame( 49, Plans::all()['tiers'][0]['yearly'] );
	}

	public function test_a_filter_cannot_send_a_link_to_another_site() {
		add_filter(
			'atlasvoice_plans',
			static function ( $plans ) {
				$plans['links']['pricing']               = 'https://evil.example/pricing';
				$plans['links']['demo']                  = 'javascript:alert(1)';
				$plans['links']['refund']                = 'http://atlasaidev.com/refund-policy/';
				$plans['tiers'][0]['checkout']['yearly'] = 'https://checkout.freemius.com.evil.example/x';
				$plans['tiers'][1]['checkout']           = 'not an array';

				return $plans;
			}
		);

		$plans = Plans::all();

		$this->assertSame( '', $plans['links']['pricing'] );
		$this->assertSame( '', $plans['links']['demo'] );
		$this->assertSame( '', $plans['links']['refund'] );
		$this->assertSame( '', $plans['tiers'][0]['checkout']['yearly'] );
		$this->assertSame( '', $plans['tiers'][1]['checkout']['yearly'] );
	}

	/**
	 * @dataProvider broken_filter_results
	 */
	public function test_a_filter_that_returns_rubbish_does_not_break_the_screen( $result ) {
		add_filter(
			'atlasvoice_plans',
			static function () use ( $result ) {
				return $result;
			}
		);

		$plans = Plans::all();

		$this->assertIsArray( $plans['tiers'] );
		$this->assertArrayHasKey( 'pricing', $plans['links'] );
		$this->assertSame( 'USD', $plans['currency'] );
	}

	public function broken_filter_results() {
		return array(
			'null'             => array( null ),
			'a string'         => array( 'plans' ),
			'an empty array'   => array( array() ),
			'tiers not a list' => array( array( 'tiers' => 'three' ) ),
			'a tier of text'   => array( array( 'tiers' => array( 'one site', array( 'sites' => 0 ) ) ) ),
		);
	}

	public function test_text_in_a_filtered_price_becomes_a_number() {
		add_filter(
			'atlasvoice_plans',
			static function ( $plans ) {
				$plans['tiers'][0]['yearly'] = '<b>59</b>';
				$plans['tiers'][0]['id']     = '<script>';

				return $plans;
			}
		);

		$tier = Plans::all()['tiers'][0];

		$this->assertIsInt( $tier['yearly'] );
		$this->assertStringNotContainsString( '<', $tier['id'] );
	}

	// The REST route.

	public function test_the_route_returns_the_plans() {
		$response = $this->rest();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Plans::all(), $response->get_data() );
	}

	public function test_the_route_only_reads_and_describes_itself() {
		$route = rest_get_server()->get_routes()['/tta/v1/plans'][0];

		$this->assertNotEmpty( $route['label'] );
		$this->assertNotEmpty( $route['description'] );
		$this->assertSame( array( 'GET' => true ), $route['methods'] );
	}

	/**
	 * @dataProvider people_without_access
	 */
	public function test_only_an_administrator_can_read_the_route( $role ) {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$this->assertContains( $this->rest()->get_status(), array( 401, 403 ) );
	}

	public function people_without_access() {
		return array(
			'a visitor'    => array( '' ),
			'a subscriber' => array( 'subscriber' ),
			'an editor'    => array( 'editor' ),
		);
	}

	// The admin app.

	public function test_the_plans_are_not_printed_on_every_admin_screen() {
		// The Plans tab asks the route when it is opened; the other screens
		// do not carry the plans in their page source.
		$this->assertArrayNotHasKey( 'plans', Admin_App::boot_data() );
	}

	// The command.

	public function test_the_command_is_registered() {
		Commands::register();

		$this->assertSame( Plans_Command::class, WP_CLI::$commands['atlasvoice plans'] );
	}

	public function test_the_command_lists_each_plan_with_its_prices_and_link() {
		( new Plans_Command() )( array(), array() );

		$lines = wp_list_pluck( WP_CLI::$log, 1 );

		$this->assertSame( '5 site(s): $149 a year, or $249 once. Buy: https://checkout.freemius.com/plugin/13388/plan/22449/licenses/5/', $lines[1] );
		$this->assertCount( 5, $lines );
		$this->assertStringStartsWith( '14-day money-back guarantee: ', $lines[3] );
	}

	public function test_the_command_can_print_json_for_scripts() {
		( new Plans_Command() )( array(), array( 'format' => 'json' ) );

		$this->assertSame( Plans::all(), json_decode( end( WP_CLI::$log )[1], true ) );
	}
}
