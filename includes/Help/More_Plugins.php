<?php
/**
 * The other AtlasAiDev plugins.
 *
 * @package TTA
 */

namespace TTA\Help;

use TTA_Admin\TTA_Admin;

defined( 'ABSPATH' ) || exit;

/**
 * The other free AtlasAiDev plugins, with whether each is on this site.
 *
 * Reading this fetches nothing. The names and descriptions come from the
 * list the plugin carries (or from the copy the classic "Other plugins"
 * page saved earlier): TTA_Admin::get_atlas_plugins() only goes to the
 * network from that admin page, which tells the user so first. Installing
 * is left to WordPress's own Plugins screen.
 *
 * The admin screen (REST), `wp atlasvoice more-plugins` and an MCP server
 * all read this (TTS-376).
 */
class More_Plugins {

	/**
	 * This plugin: never listed among the others.
	 */
	const OWN_SLUG = 'text-to-audio';

	/**
	 * The list.
	 *
	 * @return array {
	 *     can_install: bool, list_url: string,
	 *     plugins: array<int, array{slug:string, name:string, description:string, installed:bool, active:bool, url:string, install_url:string}>
	 * }
	 */
	public static function get() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$installed   = array_keys( (array) get_plugins() );
		$can_install = current_user_can( 'install_plugins' );
		$plugins     = array();

		foreach ( (array) TTA_Admin::get_atlas_plugins() as $plugin ) {
			$row = self::row( (array) $plugin, $installed, $can_install );
			if ( $row ) {
				$plugins[] = $row;
			}
		}

		return array(
			'can_install' => $can_install,
			'list_url'    => admin_url( 'admin.php?page=atlasvoice-other-plugins' ),
			'plugins'     => $plugins,
		);
	}

	/**
	 * One plugin as the screens show it.
	 *
	 * @param array    $plugin      A plugin of the list.
	 * @param string[] $installed   The plugin files on this site.
	 * @param bool     $can_install Whether the user may install plugins.
	 *
	 * @return array|null The row, or null for this plugin itself and for a broken entry.
	 */
	private static function row( array $plugin, array $installed, $can_install ) {
		$slug = isset( $plugin['slug'] ) ? sanitize_key( $plugin['slug'] ) : '';
		if ( '' === $slug || self::OWN_SLUG === $slug || empty( $plugin['name'] ) ) {
			return null;
		}

		$basename = isset( $plugin['basename'] ) ? (string) $plugin['basename'] : '';

		return array(
			'slug'        => $slug,
			'name'        => sanitize_text_field( (string) $plugin['name'] ),
			'description' => isset( $plugin['description'] ) ? sanitize_text_field( (string) $plugin['description'] ) : '',
			'installed'   => '' !== $basename && in_array( $basename, $installed, true ),
			'active'      => '' !== $basename && is_plugin_active( $basename ),
			'url'         => 'https://wordpress.org/plugins/' . $slug . '/',
			// WordPress's own installer, found by the plugin's slug. Empty for a user who may not install.
			'install_url' => $can_install ? add_query_arg(
				array(
					's'    => $slug,
					'tab'  => 'search',
					'type' => 'term',
				),
				self_admin_url( 'plugin-install.php' )
			) : '',
		);
	}
}
