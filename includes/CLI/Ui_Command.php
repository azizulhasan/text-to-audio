<?php
/**
 * `wp atlasvoice ui`.
 *
 * @package TTA
 */

namespace TTA\CLI;

use TTA_Admin\Admin_App;

defined( 'ABSPATH' ) || exit;

/**
 * Shows or changes which AtlasVoice admin screens the site uses.
 *
 * Both sets of screens read and write the same settings, so switching never
 * changes a setting.
 */
class Ui_Command {

	/**
	 * Shows which admin screens the site uses.
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice ui get
	 *     classic
	 *
	 * @param array $args       Positional arguments (none).
	 * @param array $assoc_args Flags (none).
	 */
	public function get( $args, $assoc_args ) {
		\WP_CLI::line( Admin_App::get_ui() );
	}

	/**
	 * Chooses the admin screens.
	 *
	 * ## OPTIONS
	 *
	 * <ui>
	 * : The screens to show.
	 * ---
	 * options:
	 *   - new
	 *   - classic
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     $ wp atlasvoice ui set classic
	 *     Success: AtlasVoice now shows the classic screens.
	 *
	 * @param array $args       Positional arguments: the UI.
	 * @param array $assoc_args Flags (none).
	 */
	public function set( $args, $assoc_args ) {
		$ui = isset( $args[0] ) ? (string) $args[0] : '';

		if ( ! Admin_App::set_ui( $ui ) ) {
			\WP_CLI::error( 'Use "new" or "classic".' );
		}

		if ( Admin_App::UI_NEW === $ui && ! Admin_App::is_enabled() ) {
			// Saved, but something else keeps the classic screens on: say which.
			\WP_CLI::warning(
				Admin_App::pro_is_ready()
					? 'Saved, but the new screens are not built in this copy of the plugin, so the classic screens are shown.'
					: 'Saved, but the active AtlasVoice Pro is too old for the new screens, so the classic screens are shown. Update AtlasVoice Pro.'
			);
			return;
		}

		\WP_CLI::success( sprintf( 'AtlasVoice now shows the %s screens.', $ui ) );
	}
}
