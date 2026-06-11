<?php

namespace TTA;

class TTA_Error_Handler {
	private $log_file;
	private $handle;

	/**
	 * @throws \Exception
	 */
	public function __construct( $message = '', $log_file_path = '' ) {

		$upload_dir     = wp_upload_dir();
		$base_dir       = $upload_dir['basedir'];
		$this->log_file = apply_filters( 'tts_log_file_path', $base_dir . '/tts-debug.log' );
		if ( $log_file_path ) {
			$this->log_file = $log_file_path;
		}
		// Ensure the log file exists
		$this->ensurel_file_is_exists();

		// TTS-247: direct fopen() is required here -- WP_Filesystem can't be
		// used in an error-handler context (it needs credentials and the WP
		// admin bootstrap, neither of which is guaranteed when an error fires).
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
		$this->handle = fopen( $this->log_file, 'a' );
		if ( ! $this->handle ) {
			throw new \Exception( "Unable to open log file: " . esc_html( $this->log_file ) );
		}

		$this->log( $message );
	}


	/**
	 * Function to ensure the file exists
	 *
	 * @throws \Exception
	 */
	private function ensurel_file_is_exists() {
		// Check if the file does not exist
		if ( ! file_exists( $this->log_file ) ) {
			// Create the directory if it does not exist (wp_mkdir_p handles
			// recursion + parents correctly and is the wp.org-preferred API).
			$dir = dirname( $this->log_file );
			if ( ! file_exists( $dir ) ) {
				wp_mkdir_p( $dir );
			}

			// TTS-247: direct fopen/fclose for log-file creation (same
			// reasoning as the constructor -- WP_Filesystem is unavailable
			// in an error-handler context).
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
			$handle = fopen( $this->log_file, 'w' );
			if ( $handle ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
				fclose( $handle );
			} else {
				throw new \Exception( "Failed to create log file: " . esc_html( $this->log_file ) );
			}
		}
	}

	/**
	 * Function to log errors
	 *
	 * @param $message
	 *
	 * @return void
	 */
	public function log( $message ) {
		if ( $this->handle ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
			fwrite( $this->handle, gmdate( 'Y-m-d H:i:s' ) . " - " . $message . "\n" );
		}
	}

	/**
	 * Destructor to close the file handle
	 */
	public function __destruct() {
		if ( $this->handle ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
			fclose( $this->handle );
		}
	}

}