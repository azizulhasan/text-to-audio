<?php

namespace TTA;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-320: WordPress's own plugin upgrader, pointed at an older package.
 *
 * Mirrors core's bulk update (Plugin_Upgrader::bulk_upgrade): the plugin is not
 * deactivated, the site is in maintenance mode for the few seconds of the
 * swap, and on WordPress 6.3+ the current files are kept aside and restored
 * if anything fails. Loaded only by TTA_Rollback::install_package(), after
 * class-wp-upgrader.php.
 */
class TTA_Rollback_Upgrader extends \Plugin_Upgrader {

	/** @var string SHA-256 the package must match ('' = not checked). */
	private $expected_sha256 = '';

	/** @var string Plugin basename being rolled back. */
	private $plugin = '';

	/**
	 * @param string $plugin Plugin basename.
	 * @param string $url    Package URL.
	 * @param string $sha256 Expected SHA-256 of the ZIP, when the source knows it.
	 * @return true|\WP_Error|false
	 */
	public function roll_back( $plugin, $url, $sha256 = '' ) {
		$this->init();
		$this->upgrade_strings();
		$this->expected_sha256 = strtolower( $sha256 );
		$this->plugin          = $plugin;

		add_filter( 'upgrader_clear_destination', array( $this, 'delete_old_plugin' ), 10, 4 );
		add_filter( 'upgrader_source_selection', array( $this, 'keep_folder_name' ), 5, 3 );
		add_filter( 'upgrader_source_selection', array( $this, 'check_package' ) );

		$this->maintenance_mode( true );

		$this->run( array(
			'package'           => $url,
			'destination'       => WP_PLUGIN_DIR,
			'clear_destination' => true,
			'clear_working'     => true,
			'is_multi'          => true,
			'hook_extra'        => array(
				'plugin'      => $plugin,
				'type'        => 'plugin',
				'action'      => 'update',
				// Kept aside and put back if the swap fails (WordPress 6.3+).
				'temp_backup' => array(
					'slug' => dirname( $plugin ),
					'src'  => WP_PLUGIN_DIR,
					'dir'  => 'plugins',
				),
			),
		) );

		$this->maintenance_mode( false );

		remove_filter( 'upgrader_source_selection', array( $this, 'check_package' ) );
		remove_filter( 'upgrader_source_selection', array( $this, 'keep_folder_name' ), 5 );
		remove_filter( 'upgrader_clear_destination', array( $this, 'delete_old_plugin' ) );

		wp_clean_plugins_cache( true );

		/** This action is documented in wp-admin/includes/class-wp-upgrader.php */
		do_action( 'upgrader_process_complete', $this, array(
			'action'  => 'update',
			'type'    => 'plugin',
			'plugins' => array( $plugin ),
		) );

		if ( is_wp_error( $this->result ) ) {
			return $this->result;
		}

		return $this->result ? true : false;
	}

	/**
	 * Unpack into the folder the plugin is installed in. A package may name its
	 * folder differently (Freemius ZIPs use the product's premium slug); left
	 * alone, the old version would land next to the installed one as a second
	 * copy instead of replacing it.
	 *
	 * @param string|\WP_Error $source
	 * @param string           $remote_source
	 * @param \WP_Upgrader     $upgrader
	 * @return string|\WP_Error
	 */
	public function keep_folder_name( $source, $remote_source, $upgrader ) {
		global $wp_filesystem;

		if ( $upgrader !== $this || is_wp_error( $source ) || '' === $this->plugin ) {
			return $source;
		}

		$wanted = dirname( $this->plugin );
		if ( basename( untrailingslashit( $source ) ) === $wanted ) {
			return $source;
		}

		$renamed = trailingslashit( dirname( untrailingslashit( $source ) ) ) . $wanted;
		if ( ! $wp_filesystem->move( untrailingslashit( $source ), $renamed, true ) ) {
			return new \WP_Error( 'rollback_folder', __( 'The downloaded plugin could not be prepared, so nothing was changed.', 'text-to-audio' ) );
		}

		return trailingslashit( $renamed );
	}

	/**
	 * Download with WordPress.org signature checks, and check the SHA-256 the
	 * source gave, before anything is unpacked.
	 *
	 * @param string $package
	 * @param bool   $check_signatures
	 * @param array  $hook_extra
	 * @return string|\WP_Error Path to the downloaded file.
	 */
	public function download_package( $package, $check_signatures = false, $hook_extra = array() ) {
		$file = parent::download_package( $package, true, $hook_extra );

		if ( is_wp_error( $file ) || '' === $this->expected_sha256 ) {
			return $file;
		}

		if ( ! hash_equals( $this->expected_sha256, (string) hash_file( 'sha256', $file ) ) ) {
			wp_delete_file( $file );

			return new \WP_Error( 'rollback_checksum', __( 'The downloaded file did not match its checksum, so nothing was changed.', 'text-to-audio' ) );
		}

		return $file;
	}
}
