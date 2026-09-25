<?php

namespace TTA;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-320: AtlasVoice's own older versions, from WordPress.org.
 *
 * The list comes from the WordPress.org plugin API when the Versions screen
 * asks for it; the ZIP comes from downloads.wordpress.org when the owner
 * presses Roll back. Nothing else is ever downloaded.
 */
class TTA_Rollback_Source_WordPress_Org extends TTA_Rollback_Source {

	const SLUG = 'text-to-audio';

	const CACHE = 'tta_rollback_versions_free';

	/** Every AtlasVoice 2.3.x release needs at least this Pro (TTA_REQUIRED_PRO_VERSION). */
	const MIN_PRO = '3.3.1';

	/**
	 * Older releases this build knows about. Add a line per release: the Pro
	 * version shipped with it, and anything that makes going back to it unsafe
	 * (php_max, security_fixed_in).
	 */
	const RELEASES = array(
		'2.3.16' => array( 'partner' => '3.4.11' ),
		'2.3.15' => array( 'partner' => '3.4.10' ),
		'2.3.14' => array( 'partner' => '3.4.10' ),
		'2.3.13' => array( 'partner' => '3.4.9' ),
		'2.3.12' => array( 'partner' => '3.4.8' ),
		'2.3.11' => array( 'partner' => '3.4.8' ),
		'2.3.10' => array( 'partner' => '3.4.7' ),
		'2.3.9'  => array( 'partner' => '3.4.7' ),
	);

	public function id() {
		return 'free';
	}

	public function label() {
		return __( 'AtlasVoice', 'text-to-audio' );
	}

	public function plugin_file() {
		return plugin_basename( TEXT_TO_AUDIO_ROOT_FILE );
	}

	public function installed_version() {
		return TEXT_TO_AUDIO_VERSION;
	}

	public function ajax_action() {
		return 'tta_rollback_run';
	}

	public function releases() {
		$releases = array();
		foreach ( self::RELEASES as $version => $facts ) {
			$releases[ $version ] = array_merge( array( 'min_partner' => self::MIN_PRO ), $facts );
		}

		return $releases;
	}

	/**
	 * AtlasVoice TTS (player 3) arrived with the Versions screen; an older
	 * version reads posts with the browser voice instead.
	 *
	 * @param string $version
	 * @return string[]
	 */
	public function changes( $version ) {
		if ( version_compare( $version, TTA_Rollback::INTRODUCED_IN, '<' ) && TTA_AtlasVoice_Service::PLAYER_ID === (int) get_player_id() ) {
			return array( __( 'Your posts play AtlasVoice TTS, which this version does not have. After going back, visitors hear the browser voice. Your account, key and MP3 files are kept, and AtlasVoice TTS returns when you update.', 'text-to-audio' ) );
		}

		return array();
	}

	protected function default_min_partner( $version ) {
		return defined( 'TTA_REQUIRED_PRO_VERSION' ) ? TTA_REQUIRED_PRO_VERSION : self::MIN_PRO;
	}

	/**
	 * Versions listed on WordPress.org, newest first, cached for 12 hours.
	 *
	 * @return string[]|\WP_Error
	 */
	public function available_versions() {
		$cached = get_site_transient( self::CACHE );
		if ( is_array( $cached ) ) {
			return $this->older_than_installed( array_keys( $cached ) );
		}

		$response = wp_remote_get(
			add_query_arg(
				array(
					'action'             => 'plugin_information',
					'slug'               => self::SLUG,
					'fields[versions]'   => 1,
					'fields[sections]'   => 0,
				),
				'https://api.wordpress.org/plugins/info/1.2/'
			),
			array( 'timeout' => 5 )
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return new \WP_Error( 'versions_unreachable', __( 'WordPress.org could not be reached. Please try again in a few minutes.', 'text-to-audio' ) );
		}

		$data     = json_decode( wp_remote_retrieve_body( $response ), true );
		$versions = array();
		if ( is_array( $data ) && isset( $data['versions'] ) && is_array( $data['versions'] ) ) {
			foreach ( $data['versions'] as $version => $url ) {
				if ( TTA_Rollback::is_version( $version ) && is_string( $url ) ) {
					$versions[ $version ] = $url;
				}
			}
		}

		if ( ! $versions ) {
			return new \WP_Error( 'versions_unreachable', __( 'WordPress.org did not return any versions. Please try again later.', 'text-to-audio' ) );
		}

		set_site_transient( self::CACHE, $versions, 12 * HOUR_IN_SECONDS );

		return $this->older_than_installed( array_keys( $versions ) );
	}

	/**
	 * The download URL for $version, only ever on downloads.wordpress.org.
	 *
	 * @param string $version
	 * @return array{url:string}|\WP_Error
	 */
	public function package( $version ) {
		if ( ! in_array( $version, (array) $this->available_versions(), true ) ) {
			return new \WP_Error( 'unknown_version', __( 'That version is not available.', 'text-to-audio' ) );
		}

		return array( 'url' => 'https://downloads.wordpress.org/plugin/' . self::SLUG . '.' . $version . '.zip' );
	}

	/**
	 * @param string[] $versions
	 * @return string[] Older than the installed version, newest first.
	 */
	private function older_than_installed( array $versions ) {
		$installed = $this->installed_version();
		$versions  = array_values( array_filter( $versions, static function ( $version ) use ( $installed ) {
			return version_compare( $version, $installed, '<' );
		} ) );
		usort( $versions, static function ( $a, $b ) {
			return version_compare( $b, $a );
		} );

		return $versions;
	}
}
