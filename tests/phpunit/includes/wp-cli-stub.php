<?php
/**
 * A stand-in for WP_CLI, so the plugin's commands can be unit tested without
 * the WP-CLI runtime. It records what a command printed instead of printing.
 *
 * @package TTA
 */

if ( class_exists( 'WP_CLI' ) ) {
	return;
}

/**
 * Thrown by the stub where the real WP_CLI::error() stops the process.
 */
class Atlasvoice_Cli_Stop extends Exception {}

// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound, PEAR.NamingConventions.ValidClassName.Invalid
class WP_CLI {

	/**
	 * Everything printed, as array( type, message ).
	 *
	 * @var array
	 */
	public static $log = array();

	/**
	 * Commands added, as name => class.
	 *
	 * @var array
	 */
	public static $commands = array();

	/**
	 * What confirm() answers when --yes is not given.
	 *
	 * @var bool
	 */
	public static $confirm_answer = true;

	public static function reset() {
		self::$log            = array();
		self::$commands       = array();
		self::$confirm_answer = true;
	}

	public static function line( $message = '' ) {
		self::$log[] = array( 'line', $message );
	}

	public static function success( $message ) {
		self::$log[] = array( 'success', $message );
	}

	public static function warning( $message ) {
		self::$log[] = array( 'warning', $message );
	}

	public static function error( $message ) {
		self::$log[] = array( 'error', $message );
		throw new Atlasvoice_Cli_Stop( $message );
	}

	public static function confirm( $question, $assoc_args = array() ) {
		if ( ! empty( $assoc_args['yes'] ) ) {
			return;
		}
		self::$log[] = array( 'confirm', $question );
		if ( ! self::$confirm_answer ) {
			throw new Atlasvoice_Cli_Stop( 'declined' );
		}
	}

	public static function add_command( $name, $command ) {
		self::$commands[ $name ] = $command;
	}
}
