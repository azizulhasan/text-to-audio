<?php
/**
 * WP-CLI commands of AtlasVoice.
 *
 * @package TTA
 */

namespace TTA\CLI;

defined( 'ABSPATH' ) || exit;

/**
 * Registers `wp atlasvoice ...`.
 *
 * Rule (TTS-376): what an admin can do on a screen can also be done from the
 * command line and by an MCP server. A feature therefore lives in a PHP class
 * that the REST route, the WP-CLI command and the screen all call; none of
 * them holds logic of its own. A new feature adds its command to the list in
 * register(), and Pro adds its own through the `atlasvoice_cli_commands` filter.
 */
class Commands {

	/**
	 * When the commands are registered: on `init`, after the plugins that add
	 * commands have started.
	 *
	 * AtlasVoice Pro starts on `init` (priority 10) and adds its commands there.
	 * Registering on `plugins_loaded` came before that, so `wp atlasvoice bulk`
	 * and `wp atlasvoice seo` never existed in a real terminal (found with the
	 * real wp program on 2026-11-15; the tests only asked the filter).
	 */
	const PRIORITY = 20;

	/**
	 * Plans the registration. Called once when WP-CLI is running.
	 */
	public static function plan() {
		add_action( 'init', array( __CLASS__, 'register' ), self::PRIORITY );
	}

	/**
	 * Registers every command. Called only when WP-CLI is running.
	 */
	public static function register() {
		$commands = array(
			'atlasvoice ui'            => Ui_Command::class,
			'atlasvoice mode'          => Mode_Command::class,
			'atlasvoice pronunciation' => Pronunciation_Command::class,
			'atlasvoice read-along'    => Read_Along_Command::class,
			'atlasvoice account'       => Account_Command::class,
			'atlasvoice plans'         => Plans_Command::class,
			'atlasvoice status'        => Status_Command::class,
			'atlasvoice cloud'         => Cloud_Command::class,
			'atlasvoice voice'         => Voice_Command::class,
			'atlasvoice job'           => Job_Command::class,
			'atlasvoice languages'     => Languages_Command::class,
			'atlasvoice providers'     => Providers_Command::class,
			'atlasvoice placement'     => Placement_Command::class,
			'atlasvoice look'          => Look_Command::class,
			'atlasvoice words'         => Words_Command::class,
			'atlasvoice ai-notice'     => AI_Notice_Command::class,
			'atlasvoice credit'        => Credit_Command::class,
			'atlasvoice embed'         => Embed_Command::class,
			'atlasvoice where'         => Where_Command::class,
			'atlasvoice text'          => Text_Command::class,
			'atlasvoice areas'         => Areas_Command::class,
			'atlasvoice advanced'      => Advanced_Command::class,
			'atlasvoice privacy'       => Privacy_Command::class,
			'atlasvoice versions'      => Versions_Command::class,
			'atlasvoice health'        => Health_Command::class,
			'atlasvoice tracking'      => Tracking_Command::class,
			'atlasvoice insights'      => Insights_Command::class,
			'atlasvoice library'       => Library_Command::class,
			'atlasvoice audio'         => Audio_Command::class,
			'atlasvoice post'          => Post_Command::class,
			'atlasvoice more-plugins'  => More_Plugins_Command::class,
			'atlasvoice setup'         => Setup_Command::class,
		);

		/**
		 * Filters the WP-CLI commands of AtlasVoice.
		 *
		 * @param array<string, string> $commands Command name => class name.
		 */
		$commands = (array) apply_filters( 'atlasvoice_cli_commands', $commands );

		foreach ( $commands as $name => $class ) {
			if ( is_string( $name ) && is_string( $class ) && class_exists( $class ) ) {
				\WP_CLI::add_command( $name, $class );
			}
		}
	}
}
