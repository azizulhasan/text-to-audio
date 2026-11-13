<?php
/**
 * `wp atlasvoice mode`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA\AtlasVoice\Mode;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes whether visitors can hear the posts.
 *
 * In "staging" only administrators see the player; in "live" every visitor
 * does. It is the same switch as "Live for visitors" in the admin.
 */
class Mode_Command {

	/**
	 * Shows the mode: live or staging.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice mode get
	 *     staging
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags (none).
	 */
	public function get( $args, $assoc_args ) {
		\WP_CLI::line( Mode::is_production() ? 'live' : 'staging' );
	}

	/**
	 * Goes live for visitors, or back to staging.
	 *
	 * ## OPTIONS
	 *
	 * <mode>
	 * : The mode to switch to.
	 * ---
	 * options:
	 *   - live
	 *   - staging
	 * ---
	 *
	 * [--yes]
	 * : Go live without being asked to confirm.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice mode set live --yes
	 *     Success: AtlasVoice is live. Visitors can hear your posts.
	 *
	 *     $ wp atlasvoice mode set staging
	 *     Success: AtlasVoice is in staging. Only administrators see the player.
	 *
	 * @param array $args       Positional arguments: the mode.
	 * @param array $assoc_args Flags: yes.
	 */
	public function set( $args, $assoc_args ) {
		$mode = isset( $args[0] ) ? (string) $args[0] : '';

		if ( 'live' === $mode ) {
			// Going live shows the player to every visitor, so it asks first,
			// like the dialog in the admin does.
			\WP_CLI::confirm( 'Every visitor will see the player on the posts you chose. Go live?', $assoc_args );
			Mode::set( Mode::MODE_PRODUCTION );
			/** This action is documented in includes/atlasvoice/RestRoutes.php */
			do_action( 'atlasvoice_go_live', get_current_user_id() );
			\WP_CLI::success( 'AtlasVoice is live. Visitors can hear your posts.' );
			return;
		}

		if ( 'staging' === $mode ) {
			Mode::set( Mode::MODE_STAGING );
			/** This action is documented in includes/atlasvoice/RestRoutes.php */
			do_action( 'atlasvoice_reverted_to_staging', get_current_user_id() );
			\WP_CLI::success( 'AtlasVoice is in staging. Only administrators see the player.' );
			return;
		}

		\WP_CLI::error( 'Use "live" or "staging".' );
	}
}
