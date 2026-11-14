<?php
/**
 * The installed versions, the older ones a site can go back to, and
 * automatic updates.
 *
 * @package TTA
 */

namespace TTA\Site;

use TTA\TTA_Rollback;

defined( 'ABSPATH' ) || exit;

/**
 * What the Versions screen shows, and the automatic-update switch.
 *
 * It adds no logic of its own: TTA_Rollback already decides which versions
 * exist and whether each is safe for this site, and already switches
 * WordPress' automatic updates. This class gives that to the admin screen
 * (REST), `wp atlasvoice versions` and an MCP server in one shape (TTS-376).
 *
 * Going back to an older version replaces the plugin's files. That step is
 * not offered here: it stays on the classic Versions screen, where the
 * person at the keyboard confirms it.
 */
class Versions {

	/**
	 * The versions.
	 *
	 * @return array {
	 *     can_roll_back: bool,
	 *     installed: array<string, array{label:string, version:string, auto_update:bool, checkout:bool}>,
	 *     site: array{php:string, wordpress:string, multisite:bool},
	 *     modes: array<string, array<int, array{version:string, label:string, status:string, recommended:bool, blocks:string[], changes:string[], notes:string[]}>>,
	 *     errors: array<string, string>
	 * }
	 */
	public static function get() {
		$plan      = TTA_Rollback::plan();
		$checkouts = isset( $plan['vcs'] ) ? (array) $plan['vcs'] : array();
		$installed = array();
		$modes     = array();

		foreach ( (array) $plan['installed'] as $id => $plugin ) {
			$installed[ $id ] = array(
				'label'       => (string) $plugin['label'],
				'version'     => (string) $plugin['version'],
				'auto_update' => ! empty( $plugin['autoUpdate'] ),
				// A Git or SVN checkout: replacing the folder would delete the repository.
				'checkout'    => in_array( $id, $checkouts, true ),
			);
		}

		foreach ( (array) $plan['modes'] as $mode => $rows ) {
			$modes[ $mode ] = array();
			foreach ( (array) $rows as $row ) {
				$modes[ $mode ][] = array(
					'version'     => (string) $row['version'],
					'label'       => (string) $row['label'],
					// safe, changes (works, with something to know) or blocked.
					'status'      => (string) $row['status'],
					'recommended' => ! empty( $row['recommended'] ),
					'blocks'      => self::texts( isset( $row['blocks'] ) ? $row['blocks'] : array() ),
					'changes'     => self::texts( isset( $row['changes'] ) ? $row['changes'] : array() ),
					'notes'       => self::texts( isset( $row['notes'] ) ? $row['notes'] : array() ),
				);
			}
		}

		return array(
			'can_roll_back' => TTA_Rollback::is_available(),
			'installed'     => $installed,
			'site'          => $plan['site'],
			'modes'         => $modes,
			// Why the list of versions of a plugin could not be read (no network, for example).
			'errors'        => array_map( 'strval', isset( $plan['errors'] ) ? (array) $plan['errors'] : array() ),
		);
	}

	/**
	 * Turns WordPress' automatic updates on or off for one of the plugins.
	 *
	 * @param string $plugin The plugin: "free", or "pro" when it is installed.
	 * @param mixed  $on     On or off.
	 *
	 * @return array|\WP_Error The versions after the change, or why nothing changed.
	 */
	public static function set_auto_update( $plugin, $on ) {
		// The same permission WordPress asks for on its own Plugins screen.
		if ( ! current_user_can( 'update_plugins' ) ) {
			return new \WP_Error(
				'atlasvoice_cannot_update_plugins',
				__( 'You cannot change plugin updates on this site.', 'text-to-audio' ),
				array( 'status' => 403 )
			);
		}

		$sources = TTA_Rollback::sources();
		if ( ! is_string( $plugin ) || ! isset( $sources[ $plugin ] ) ) {
			return new \WP_Error(
				'atlasvoice_unknown_plugin',
				__( 'That plugin is not installed.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$flag = self::to_bool( $on );
		if ( null === $flag ) {
			return new \WP_Error(
				'atlasvoice_invalid_auto_update',
				__( 'This must be on or off.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		TTA_Rollback::set_auto_update( $sources[ $plugin ]->plugin_file(), $flag );

		return self::get();
	}

	/**
	 * Plain lines of text from the plan (a block there is a text with a fix).
	 *
	 * @param mixed $items Texts, or arrays with a "text".
	 *
	 * @return string[]
	 */
	private static function texts( $items ) {
		$texts = array();

		foreach ( (array) $items as $item ) {
			$text = is_array( $item ) && isset( $item['text'] ) ? $item['text'] : $item;
			if ( is_string( $text ) && '' !== $text ) {
				$texts[] = wp_strip_all_tags( $text );
			}
		}

		return $texts;
	}

	/**
	 * On or off, from the forms a script or a screen sends.
	 *
	 * @param mixed $value What was sent.
	 *
	 * @return bool|null Null when it is neither.
	 */
	private static function to_bool( $value ) {
		if ( is_bool( $value ) ) {
			return $value;
		}

		$text = is_scalar( $value ) ? strtolower( trim( (string) $value ) ) : '';

		if ( in_array( $text, array( '1', 'true', 'on', 'yes' ), true ) ) {
			return true;
		}

		return in_array( $text, array( '0', 'false', 'off', 'no' ), true ) ? false : null;
	}
}
