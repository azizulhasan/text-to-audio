<?php
/**
 * Audio made by jobs, and when it is made.
 *
 * @package TTA
 */

namespace TTA\Library;

use TTA\Cloud\Jobs;
use TTA\TTA_AtlasVoice_Service;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Connects the audio jobs (TTA\Cloud\Jobs) to the player (TTS-354).
 *
 * A job makes the MP3 of a whole post on the AtlasVoice service and stores
 * it on the site. This class does the two things the job runner leaves open:
 *
 *  - when a job is finished, the file becomes the post's audio: it is
 *    recorded in the same post meta, under the same key, as a file made the
 *    usual way (`tts_mp3_file_urls`), so the player needs no change;
 *  - it holds the one setting about jobs: when audio is made. The default,
 *    "play", is what every site does today (the first play makes the file,
 *    batch by batch). "publish" starts a job in the background when a post
 *    is published or changed. Nothing changes on a site that never opens
 *    this setting.
 *
 * A job is never started inside a page request: publishing only plans a
 * WP-Cron event.
 *
 * The admin screen (REST), `wp atlasvoice audio` and an MCP server all use
 * this (TTS-376).
 */
class Audio {

	/**
	 * The option that holds when audio is made. New in 2.5.0.
	 */
	const OPTION = 'tta_audio_settings';

	const WHEN_PLAY    = 'play';
	const WHEN_PUBLISH = 'publish';

	/**
	 * WP-Cron hook that starts the job of one post.
	 */
	const START_HOOK = 'atlasvoice_cloud_job_start';

	/**
	 * How long after a save the job starts, in seconds. A second save in
	 * that time replaces the plan, so one job is made for a burst of saves.
	 */
	const START_DELAY = 20;

	/**
	 * Hooks. Called once when the plugin loads.
	 */
	public static function register() {
		add_action( 'atlasvoice_cloud_job_done', array( __CLASS__, 'attach' ), 10, 4 );
		add_action( 'transition_post_status', array( __CLASS__, 'on_status' ), 10, 3 );
		add_action( self::START_HOOK, array( __CLASS__, 'start_planned' ), 10, 1 );
	}

	/**
	 * Whether jobs can make this site's audio, and why not when they cannot.
	 *
	 * @return array{available: bool, reason: string} reason: '', 'voice' or 'not_connected'.
	 */
	public static function availability() {
		/**
		 * Filters the players whose audio a job can make. The free plugin's
		 * natural voice is one; an extension adds its own.
		 *
		 * @param int[] $players Player ids.
		 */
		$players = array_map( 'intval', (array) apply_filters( 'atlasvoice_job_players', array( TTA_AtlasVoice_Service::PLAYER_ID ) ) );

		if ( ! in_array( (int) TTA_Helper::get_player_id(), $players, true ) ) {
			return array(
				'available' => false,
				'reason'    => 'voice',
			);
		}

		if ( ! TTA_AtlasVoice_Service::is_connected() ) {
			return array(
				'available' => false,
				'reason'    => 'not_connected',
			);
		}

		return array(
			'available' => true,
			'reason'    => '',
		);
	}

	/**
	 * The setting, with whether jobs can run.
	 *
	 * @return array{when: string, available: bool, reason: string}
	 */
	public static function get() {
		return array( 'when' => self::when() ) + self::availability();
	}

	/**
	 * When audio is made, as it is stored.
	 *
	 * @return string play or publish.
	 */
	public static function when() {
		$stored = get_option( self::OPTION, array() );

		return is_array( $stored ) && isset( $stored['when'] ) && self::WHEN_PUBLISH === $stored['when'] ? self::WHEN_PUBLISH : self::WHEN_PLAY;
	}

	/**
	 * Saves when audio is made.
	 *
	 * @param array $fields Any of: when (play, publish).
	 *
	 * @return array|\WP_Error The setting after the save, or why nothing was saved.
	 */
	public static function save( array $fields ) {
		if ( ! array_key_exists( 'when', $fields ) ) {
			return self::get();
		}

		if ( ! is_string( $fields['when'] ) || ! in_array( $fields['when'], array( self::WHEN_PLAY, self::WHEN_PUBLISH ), true ) ) {
			return new \WP_Error(
				'atlasvoice_invalid_when',
				__( 'Choose "play" (audio is made on the first play) or "publish" (audio is made when a post is published).', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		update_option( self::OPTION, array( 'when' => $fields['when'] ), false );

		return self::get();
	}

	/**
	 * Makes the file of a finished job the post's audio.
	 *
	 * @param int    $post_id  The post.
	 * @param string $language Language code of the audio.
	 * @param string $file_url Public address of the MP3.
	 * @param array  $record   The site's record of the job.
	 */
	public static function attach( $post_id, $language, $file_url, $record ) {
		$post_id  = (int) $post_id;
		$file_url = is_string( $file_url ) ? $file_url : '';
		$path     = is_array( $record ) && isset( $record['file_path'] ) ? (string) $record['file_path'] : '';

		// The voice was changed while the job ran: its file is not this voice's audio.
		if ( '' === $file_url || ! get_post( $post_id ) || ! self::availability()['available'] ) {
			return;
		}

		/**
		 * Filters the key a job's file is recorded under. By default the key of
		 * the language, the same a file made on first play gets.
		 *
		 * @param string $key      File key.
		 * @param int    $post_id  The post.
		 * @param string $language Language code.
		 */
		$key = (string) apply_filters( 'atlasvoice_cloud_job_file_key', TTA_Helper::tts_get_file_url_key( (string) $language ), $post_id, (string) $language );
		if ( '' === $key ) {
			return;
		}

		/** This filter is documented in includes/TTA_GTTS_Generation.php. */
		$file_url = (string) apply_filters( 'atlasvoice_final_mp3_url', $file_url, $path, $post_id );

		TTA_Helper::atlasvoice_store_audio_url( $post_id, $key, $file_url );

		/** This action is documented in includes/TTA_GTTS_Generation.php. */
		do_action(
			'atlasvoice_final_mp3_written',
			$path,
			$file_url,
			$post_id,
			array(
				'source'   => 'job',
				'language' => (string) $language,
			)
		);
	}

	/**
	 * Plans the job of a post that was published or changed, when audio is
	 * made on publish. Nothing is sent from here.
	 *
	 * @param string   $new_status The post's status now.
	 * @param string   $old_status Its status before.
	 * @param \WP_Post $post       The post.
	 */
	public static function on_status( $new_status, $old_status, $post ) {
		if ( 'publish' !== $new_status || ! $post instanceof \WP_Post || ! self::makes_on_publish( $post ) ) {
			return;
		}

		$args = array( (int) $post->ID );

		wp_clear_scheduled_hook( self::START_HOOK, $args );
		wp_schedule_single_event( time() + self::START_DELAY, self::START_HOOK, $args );
	}

	/**
	 * Starts the job that was planned for a post. Runs from WP-Cron.
	 *
	 * @param int $post_id The post.
	 */
	public static function start_planned( $post_id ) {
		$post = get_post( (int) $post_id );

		// What was true when it was planned may not be true any more.
		if ( ! $post || 'publish' !== $post->post_status || ! self::makes_on_publish( $post ) ) {
			return;
		}

		Jobs::start( (int) $post->ID );
	}

	/**
	 * Whether a published post gets its audio from a job without a click.
	 *
	 * @param \WP_Post $post The post.
	 *
	 * @return bool
	 */
	private static function makes_on_publish( \WP_Post $post ) {
		// The cheap question first: a site that makes audio on first play (every
		// site, until it chooses otherwise) does no more work than this on a save.
		if ( self::WHEN_PUBLISH !== self::when() ) {
			return false;
		}

		if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) || '' !== (string) $post->post_password ) {
			return false;
		}

		if ( ! self::availability()['available'] ) {
			return false;
		}

		$settings = (array) TTA_Helper::tts_get_settings( 'settings' );
		$types    = isset( $settings['tta__settings_allow_listening_for_post_types'] ) ? (array) $settings['tta__settings_allow_listening_for_post_types'] : array();

		return in_array( $post->post_type, $types, true );
	}
}
