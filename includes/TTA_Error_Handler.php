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

		// Open the log file for appending
		$this->handle = fopen( $this->log_file, 'a' );
		if ( ! $this->handle ) {
			throw new \Exception( "Unable to open log file: " . $this->log_file );
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
			// Create the directory if it does not exist
			$dir = dirname( $this->log_file );
			if ( ! file_exists( $dir ) ) {
				mkdir( $dir, 0755, true );
			}

			// Create the file
			$handle = fopen( $this->log_file, 'w' );
			if ( $handle ) {
				fclose( $handle );
			} else {
				throw new \Exception( "Failed to create log file: " . $this->log_file );
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
			fwrite( $this->handle, date( 'Y-m-d H:i:s' ) . " - " . $message . "\n" );
		}
	}

	/**
	 * Destructor to close the file handle
	 */
	public function __destruct() {
		if ( $this->handle ) {
			fclose( $this->handle );
		}
	}

}