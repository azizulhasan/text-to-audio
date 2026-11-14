<?php
/**
 * Which posts have a stored audio file.
 *
 * @package TTA
 */

namespace TTA\Library;

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
	 *     posts: array<int, array{id:int, title:string, status:string, modified:string, view_url:string, edit_url:string}>
	 * }
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

		foreach ( $query->posts as $post ) {
			$report['posts'][] = array(
				'id'       => (int) $post->ID,
				'title'    => wp_strip_all_tags( get_the_title( $post ) ),
				'status'   => get_post_meta( $post->ID, self::MARK, true ) ? 'ready' : 'missing',
				'modified' => mysql2date( 'c', $post->post_modified_gmt, false ),
				'view_url' => (string) get_permalink( $post ),
				'edit_url' => (string) get_edit_post_link( $post->ID, 'raw' ),
			);
		}

		return $report;
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
