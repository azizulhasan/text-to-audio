<?php
/**
 * Which posts have a stored audio file.
 *
 * @package TTA
 */

namespace TTA\Library;

use TTA\Cloud\Jobs;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * The audio library: the posts that get a player, and for each whether its
 * audio file is stored.
 *
 * It only reads, and it reads what the players already write: the post
 * meta `tts_is_mp3_file_url_exists`, set when a post's audio file is saved
 * and removed when the voice changes. Nothing new is stored.
 *
 * A post whose audio is being made by a job (TTA\Cloud\Jobs, TTS-354) says
 * so: "making" with how many parts are done, or "failed" with the reason.
 *
 * A post that was changed after its audio was made is "outdated". That is
 * read from the fingerprint the plugin already keeps beside each file
 * (`_atlasvoice_audio_hashes`, TTS-312); a file from before that fingerprint
 * existed is "ready", because nothing says otherwise.
 *
 * A voice that reads in the browser stores no files, so there is no
 * library for it; get() says so with `stores_audio`.
 *
 * The admin screen (REST), `wp atlasvoice library` and an MCP server all
 * read this (TTS-376).
 */
class Posts {

	/**
	 * The mark a player puts on a post whose audio file is stored.
	 */
	const MARK = 'tts_is_mp3_file_url_exists';

	/**
	 * Post meta: file key => the fingerprint of the text a file was made from.
	 */
	const FINGERPRINTS = '_atlasvoice_audio_hashes';

	const STATUSES = array( 'all', 'ready', 'missing' );

	const PER_PAGE     = 20;
	const PER_PAGE_MAX = 50;

	/**
	 * A page of the library.
	 *
	 * @param array $args Any of: status (all, ready, missing), search, page, per_page.
	 *
	 * @return array|\WP_Error {
	 *     stores_audio: bool, voice: string,
	 *     counts: array{all:int, ready:int, missing:int},
	 *     status: string, search: string, page: int, pages: int, total: int,
	 *     jobs: array{available:bool, reason:string},
	 *     posts: array<int, array{id:int, title:string, status:string, job:array|null, modified:string, view_url:string, edit_url:string}>
	 * }
	 *
	 * A post's status is ready, outdated, making, failed or missing. An
	 * outdated post is counted and filtered as ready: its file is stored.
	 */
	public static function get( array $args = array() ) {
		$status = isset( $args['status'] ) ? $args['status'] : 'all';
		if ( ! is_string( $status ) || ! in_array( $status, self::STATUSES, true ) ) {
			return new \WP_Error(
				'atlasvoice_invalid_status',
				__( 'The status must be all, ready or missing.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$search    = isset( $args['search'] ) && is_scalar( $args['search'] ) ? sanitize_text_field( (string) $args['search'] ) : '';
		$page      = isset( $args['page'] ) && is_numeric( $args['page'] ) ? max( 1, (int) $args['page'] ) : 1;
		$per_page  = isset( $args['per_page'] ) && is_numeric( $args['per_page'] ) ? (int) $args['per_page'] : self::PER_PAGE;
		$per_page  = max( 1, min( self::PER_PAGE_MAX, $per_page ) );
		$player_id = (int) TTA_Helper::get_player_id();
		$players   = (array) TTA_Helper::get_available_players();

		$report = array(
			'stores_audio' => TTA_Helper::player_makes_mp3( $player_id ),
			'voice'        => isset( $players[ $player_id ]['name'] ) ? sanitize_text_field( (string) $players[ $player_id ]['name'] ) : '',
			'counts'       => array(
				'all'     => 0,
				'ready'   => 0,
				'missing' => 0,
			),
			// Whether "Make audio" can start a job on this site, and why not.
			'jobs'         => Audio::availability(),
			'status'       => $status,
			'search'       => $search,
			'page'         => $page,
			'pages'        => 0,
			'total'        => 0,
			'posts'        => array(),
		);

		// A voice that reads in the browser saves nothing, so there is nothing to list.
		if ( ! $report['stores_audio'] ) {
			return $report;
		}

		$report['counts']['all']     = self::count( 'all' );
		$report['counts']['ready']   = self::count( 'ready' );
		$report['counts']['missing'] = max( 0, $report['counts']['all'] - $report['counts']['ready'] );

		$query = new \WP_Query(
			self::query_args( $status ) + array(
				'posts_per_page' => $per_page,
				'paged'          => $page,
				's'              => $search,
				'orderby'        => 'modified',
				'order'          => 'DESC',
			)
		);

		$report['total'] = (int) $query->found_posts;
		$report['pages'] = (int) $query->max_num_pages;

		$settings = TTA_Helper::tts_get_settings();

		foreach ( $query->posts as $post ) {
			$report['posts'][] = array(
				'id'       => (int) $post->ID,
				'title'    => wp_strip_all_tags( get_the_title( $post ) ),
				'status'   => self::status_of( $post, $settings ),
				'job'      => self::job_of( (int) $post->ID ),
				'modified' => mysql2date( 'c', $post->post_modified_gmt, false ),
				'view_url' => (string) get_permalink( $post ),
				'edit_url' => (string) get_edit_post_link( $post->ID, 'raw' ),
			);
		}

		return $report;
	}

	/**
	 * The audio status of one post: its file, or what its job says.
	 *
	 * @param \WP_Post $post     The post.
	 * @param mixed    $settings The plugin's settings, read once for the page.
	 *
	 * @return string ready, outdated, making, failed or missing.
	 */
	private static function status_of( \WP_Post $post, $settings ) {
		$post_id = (int) $post->ID;
		$job     = Jobs::status( $post_id );
		$status  = $job ? $job['status'] : '';

		// A job that runs now says more than the file of before.
		if ( in_array( $status, array( 'queued', 'running', 'downloading' ), true ) ) {
			return 'making';
		}
		if ( get_post_meta( $post_id, self::MARK, true ) ) {
			// A new try that failed says more than "outdated": it says why.
			if ( self::is_outdated( $post, $settings ) ) {
				return 'failed' === $status ? 'failed' : 'outdated';
			}

			return 'ready';
		}

		return 'failed' === $status ? 'failed' : 'missing';
	}

	/**
	 * Whether a post was changed after the audio of the voice in use was made.
	 *
	 * @param \WP_Post $post     The post.
	 * @param mixed    $settings The plugin's settings.
	 *
	 * @return bool False when no fingerprint is kept for that file.
	 */
	private static function is_outdated( \WP_Post $post, $settings ) {
		$records = get_post_meta( $post->ID, self::FINGERPRINTS, true );
		if ( ! is_array( $records ) || ! $records ) {
			return false;
		}

		// The file the player would use for this post, as the post editor's audio box works it out.
		$resolved = (array) TTA_Helper::get_player_language_and_player_voice(
			TTA_Helper::tts_site_language( $settings ),
			TTA_Helper::tts_get_voice( $settings ),
			$settings,
			$post
		);
		$key      = strtolower(
			(string) TTA_Helper::tts_get_file_url_key(
				isset( $resolved['language'] ) ? (string) $resolved['language'] : '',
				isset( $resolved['voice'] ) ? (string) $resolved['voice'] : ''
			)
		);

		return isset( $records[ $key ]['hash'] )
			&& is_string( $records[ $key ]['hash'] )
			&& TTA_Helper::atlasvoice_content_hash( $post ) !== $records[ $key ]['hash'];
	}

	/**
	 * The posts that get a player and have no stored audio, lowest number first.
	 *
	 * For work that goes through many posts in steps (making their audio): the
	 * caller passes the last number it handled and gets the next ones, however
	 * many posts the site has.
	 *
	 * @param int $after Only posts with a higher number than this.
	 * @param int $limit How many, 1 to 50.
	 *
	 * @return int[] Post numbers. Empty when the voice in use stores no files.
	 */
	public static function missing_ids( $after = 0, $limit = self::PER_PAGE ) {
		if ( ! TTA_Helper::player_makes_mp3( (int) TTA_Helper::get_player_id() ) ) {
			return array();
		}

		$after = max( 0, (int) $after );
		$where = static function ( $sql ) use ( $after ) {
			global $wpdb;

			return $sql . $wpdb->prepare( " AND {$wpdb->posts}.ID > %d", $after );
		};

		add_filter( 'posts_where', $where );
		$query = new \WP_Query(
			self::query_args( 'missing' ) + array(
				'posts_per_page'         => max( 1, min( self::PER_PAGE_MAX, (int) $limit ) ),
				'fields'                 => 'ids',
				'orderby'                => 'ID',
				'order'                  => 'ASC',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
			)
		);
		remove_filter( 'posts_where', $where );

		return array_map( 'intval', $query->posts );
	}

	/**
	 * How many posts that get a player have no stored audio.
	 *
	 * @return int Zero when the voice in use stores no files.
	 */
	public static function missing_count() {
		if ( ! TTA_Helper::player_makes_mp3( (int) TTA_Helper::get_player_id() ) ) {
			return 0;
		}

		return max( 0, self::count( 'all' ) - self::count( 'ready' ) );
	}

	/**
	 * What the screens need of a post's job. Never its key or its file path.
	 *
	 * @param int $post_id The post.
	 *
	 * @return array{status:string, parts_done:int, parts:int, error:string}|null Null without a job.
	 */
	private static function job_of( $post_id ) {
		$job = Jobs::status( $post_id );

		if ( ! $job ) {
			return null;
		}

		return array(
			'status'     => $job['status'],
			'parts_done' => $job['parts_done'],
			'parts'      => $job['parts'],
			'error'      => $job['error'],
		);
	}

	/**
	 * How many posts have a status.
	 *
	 * @param string $status all or ready.
	 *
	 * @return int
	 */
	private static function count( $status ) {
		$query = new \WP_Query(
			self::query_args( $status ) + array(
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);

		return (int) $query->found_posts;
	}

	/**
	 * The query of the posts that get a player, narrowed to a status.
	 *
	 * @param string $status all, ready or missing.
	 *
	 * @return array WP_Query arguments.
	 */
	private static function query_args( $status ) {
		$settings = (array) TTA_Helper::tts_get_settings( 'settings' );
		$types    = isset( $settings['tta__settings_allow_listening_for_post_types'] ) ? array_filter( (array) $settings['tta__settings_allow_listening_for_post_types'] ) : array();

		$args = array(
			// A type that is not registered any more is left out; no type at all lists nothing.
			'post_type'              => $types ? array_values( array_filter( array_map( 'sanitize_key', $types ), 'post_type_exists' ) ) : array( 'atlasvoice-none' ),
			'post_status'            => 'publish',
			'ignore_sticky_posts'    => true,
			'update_post_term_cache' => false,
		);
		if ( ! $args['post_type'] ) {
			$args['post_type'] = array( 'atlasvoice-none' );
		}

		$filter = self::status_filter( $status );
		if ( $filter ) {
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- one page of the admin's own list.
			$args['meta_query'] = $filter;
		}

		return $args;
	}

	/**
	 * The meta query that narrows the posts to a status.
	 *
	 * @param string $status all, ready or missing.
	 *
	 * @return array A meta query, empty for all.
	 */
	private static function status_filter( $status ) {
		if ( 'ready' === $status ) {
			return array(
				array(
					'key'     => self::MARK,
					'value'   => array( '', '0' ),
					'compare' => 'NOT IN',
				),
			);
		}

		if ( 'missing' === $status ) {
			return array(
				'relation' => 'OR',
				array(
					'key'     => self::MARK,
					'compare' => 'NOT EXISTS',
				),
				array(
					'key'     => self::MARK,
					'value'   => array( '', '0' ),
					'compare' => 'IN',
				),
			);
		}

		return array();
	}
}
