<?php

namespace TTA;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-320: one plugin that can be rolled back, and where its older versions
 * come from.
 *
 * Free registers its WordPress.org source; Pro extends this class with its
 * own source (versions from the AtlasVoice service) and registers its own
 * admin-ajax action, so Free itself never downloads Pro's code.
 */
abstract class TTA_Rollback_Source {

	/**
	 * @return string 'free' or 'pro'.
	 */
	abstract public function id();

	/**
	 * @return string Name shown to the site owner.
	 */
	abstract public function label();

	/**
	 * @return string Plugin basename, e.g. text-to-audio/text-to-audio.php.
	 */
	abstract public function plugin_file();

	/**
	 * @return string The installed version.
	 */
	abstract public function installed_version();

	/**
	 * Older versions that can be installed, newest first, without the
	 * installed one. Called only when the Versions screen asks (never while
	 * an admin page renders); implementations cache the result.
	 *
	 * @return string[]|\WP_Error
	 */
	abstract public function available_versions();

	/**
	 * Where to download a version, asked for only when the owner presses
	 * Roll back.
	 *
	 * @param string $version
	 * @return array{url:string, sha256?:string}|\WP_Error
	 */
	abstract public function package( $version );

	/**
	 * The admin-ajax action that rolls this plugin back. admin-ajax (like
	 * core's own plugin updates) runs in wp-admin, where Pro's licensing SDK
	 * is loaded; a REST request is not wp-admin.
	 *
	 * @return string
	 */
	abstract public function ajax_action();

	/**
	 * What this build knows about older releases: per version, the lowest
	 * partner version it works with ('min_partner'), the highest PHP it was
	 * tested on ('php_max'), the release that fixed a security problem in it
	 * ('security_fixed_in'), and the partner release shipped with it
	 * ('partner'). The installed plugin is always the newest, so it knows
	 * about every version it can go back to.
	 *
	 * @return array<string, array>
	 */
	public function releases() {
		return array();
	}

	/**
	 * Can versions be downloaded right now (e.g. Pro needs an active licence)?
	 *
	 * @return true|string True, or why not.
	 */
	public function can_download() {
		return true;
	}

	/**
	 * Things that still work but change visibly when going back to $version
	 * (the site owner must confirm them).
	 *
	 * @param string $version
	 * @return string[]
	 */
	public function changes( $version ) {
		return array();
	}

	/**
	 * Lowest partner version $version works with, from its release history.
	 *
	 * @param string $version
	 * @return string '' when unknown (no limit).
	 */
	public function min_partner( $version ) {
		$releases = $this->releases();

		return isset( $releases[ $version ]['min_partner'] ) ? (string) $releases[ $version ]['min_partner'] : $this->default_min_partner( $version );
	}

	/**
	 * Lowest partner version for a version with no entry of its own (e.g. the
	 * installed one).
	 *
	 * @param string $version
	 * @return string
	 */
	protected function default_min_partner( $version ) {
		return '';
	}

	/**
	 * The partner release shipped with $version, if known.
	 *
	 * @param string $version
	 * @return string
	 */
	public function partner_of( $version ) {
		$releases = $this->releases();

		return isset( $releases[ $version ]['partner'] ) ? (string) $releases[ $version ]['partner'] : '';
	}

	/**
	 * @param string $version
	 * @return array{php_max:string, security_fixed_in:string}
	 */
	public function release_facts( $version ) {
		$releases = $this->releases();
		$facts    = isset( $releases[ $version ] ) ? $releases[ $version ] : array();

		return array(
			'php_max'           => isset( $facts['php_max'] ) ? (string) $facts['php_max'] : '',
			'security_fixed_in' => isset( $facts['security_fixed_in'] ) ? (string) $facts['security_fixed_in'] : '',
		);
	}

	/**
	 * Replace this plugin's files with $version. Shared by every source, so
	 * Pro rolls itself back with exactly the same safeguards as Free.
	 *
	 * @param string $version
	 * @return true|\WP_Error
	 */
	public function install( $version ) {
		$package = $this->package( $version );
		if ( is_wp_error( $package ) ) {
			return $package;
		}

		return TTA_Rollback::install_package( $this->plugin_file(), $package );
	}
}
