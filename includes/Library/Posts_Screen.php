<?php
/**
 * The "Audio" column of the WordPress Posts list.
 *
 * @package TTA
 */

namespace TTA\Library;

use TTA\Cloud\Jobs;
use TTA\Editor\Post_Panel;
use TTA\TTA_Helper;
use TTA_Admin\Admin_App;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-347: on the Posts list each post says how its audio stands, with the
 * same words as the Audio library and the post editor: it reads the same
 * place (Posts::one()).
 *
 *  - a column "Audio": Ready, Outdated, Being made, Failed or No audio yet,
 *    with one line under it;
 *  - a row action "Make audio" / "Make again" / "Try again" on a site whose
 *    audio is made by jobs;
 *  - a filter: any, Ready, No audio yet.
 *
 * It is there while the new admin is in use and the voice stores audio
 * files. The older tick-or-cross column (TTA_Posts_List) then stands back,
 * so a post is not described twice. Nothing is stored.
 */
class Posts_Screen {

	const COLUMN = 'atlasvoice_audio';

	/** The filter's name in the address of the list. */
	const FILTER = 'atlasvoice_audio';

	/** The admin-post action of the row action. */
	const MAKE_ACTION = 'atlasvoice_make_post_audio';

	/** The name of what the list shows after a row action. */
	const RESULT = 'atlasvoice_audio_result';

	/**
	 * Hooks the list.
	 */
	public static function register() {
		add_action( 'init', array( __CLASS__, 'setup' ), 20 );
		add_action( 'admin_post_' . self::MAKE_ACTION, array( __CLASS__, 'handle_make' ) );
	}

	/**
	 * Whether the column is what the Posts list shows.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return Admin_App::is_enabled() && TTA_Helper::player_makes_mp3( (int) TTA_Helper::get_player_id() );
	}

	/**
	 * The kinds of post AtlasVoice runs for.
	 *
	 * @return string[]
	 */
	public static function post_types() {
		$settings = (array) TTA_Helper::tts_get_settings( 'settings' );
		$types    = isset( $settings['tta__settings_allow_listening_for_post_types'] ) ? array_filter( (array) $settings['tta__settings_allow_listening_for_post_types'] ) : array();

		return array_values( array_filter( array_map( 'sanitize_key', $types ), 'post_type_exists' ) );
	}

	/**
	 * Adds the column, the row action and the filter for each kind of post.
	 */
	public static function setup() {
		if ( ! is_admin() || ! self::is_active() ) {
			return;
		}

		foreach ( self::post_types() as $type ) {
			add_filter( "manage_{$type}_posts_columns", array( __CLASS__, 'add_column' ) );
			add_action( "manage_{$type}_posts_custom_column", array( __CLASS__, 'render_column' ), 10, 2 );
		}

		add_filter( 'post_row_actions', array( __CLASS__, 'row_action' ), 10, 2 );
		add_filter( 'page_row_actions', array( __CLASS__, 'row_action' ), 10, 2 );
		add_action( 'restrict_manage_posts', array( __CLASS__, 'render_filter' ) );
		add_action( 'pre_get_posts', array( __CLASS__, 'apply_filter' ) );
		add_action( 'admin_notices', array( __CLASS__, 'render_result' ) );
		add_action( 'admin_print_styles-edit.php', array( __CLASS__, 'render_style' ) );
	}

	/**
	 * Puts the column before the date.
	 *
	 * @param array $columns The list's columns.
	 *
	 * @return array
	 */
	public static function add_column( $columns ) {
		$with = array();

		foreach ( (array) $columns as $key => $label ) {
			if ( 'date' === $key ) {
				$with[ self::COLUMN ] = __( 'Audio', 'text-to-audio' );
			}
			$with[ $key ] = $label;
		}
		if ( ! isset( $with[ self::COLUMN ] ) ) {
			$with[ self::COLUMN ] = __( 'Audio', 'text-to-audio' );
		}

		return $with;
	}

	/**
	 * How the audio of a post stands, for the column and the row action.
	 *
	 * @param \WP_Post $post The post.
	 *
	 * @return array{status:string, label:string, note:string, tone:string, action:string}
	 *               action: the words of the row action, '' when there is none.
	 */
	public static function describe( \WP_Post $post ) {
		if ( 'publish' !== $post->post_status ) {
			return array(
				'status' => 'draft',
				'label'  => __( 'Not published', 'text-to-audio' ),
				'note'   => __( 'Audio is made from the published page.', 'text-to-audio' ),
				'tone'   => '',
				'action' => '',
			);
		}

		$one    = Posts::one( $post );
		$status = $one['status'];
		$job    = $one['job'];
		$audio  = Audio::get();
		$off    = Jobs::is_off( $post->ID );

		$labels = array(
			'ready'    => array( __( 'Ready', 'text-to-audio' ), 'ok' ),
			'outdated' => array( __( 'Outdated', 'text-to-audio' ), 'warn' ),
			'making'   => array( __( 'Being made', 'text-to-audio' ), 'warn' ),
			'failed'   => array( __( 'Failed', 'text-to-audio' ), 'err' ),
			'missing'  => array( __( 'No audio yet', 'text-to-audio' ), '' ),
		);
		$label  = isset( $labels[ $status ] ) ? $labels[ $status ] : $labels['missing'];

		$note = '';
		if ( 'outdated' === $status ) {
			$note = __( 'The text changed since it was made.', 'text-to-audio' );
		} elseif ( 'making' === $status ) {
			$note = $job && $job['parts'] > 0
				/* translators: 1: parts that are finished, 2: all parts. */
				? sprintf( __( 'Part %1$d of %2$d', 'text-to-audio' ), (int) $job['parts_done'], (int) $job['parts'] )
				: __( 'Started', 'text-to-audio' );
		} elseif ( 'failed' === $status ) {
			$note = $job && '' !== (string) $job['error'] ? (string) $job['error'] : __( 'The last try did not finish.', 'text-to-audio' );
		} elseif ( 'missing' === $status ) {
			if ( $off ) {
				$note = __( 'Switched off for this post.', 'text-to-audio' );
			} elseif ( $audio['available'] && 'publish' === $audio['when'] ) {
				$note = __( 'Made when published.', 'text-to-audio' );
			} else {
				$note = __( 'Made on the first play.', 'text-to-audio' );
			}
		}

		$action = '';
		if ( $audio['available'] && ! $off && 'making' !== $status && current_user_can( 'edit_post', $post->ID ) ) {
			$action = __( 'Make audio', 'text-to-audio' );
			if ( 'failed' === $status ) {
				$action = __( 'Try again', 'text-to-audio' );
			} elseif ( 'ready' === $status || 'outdated' === $status ) {
				$action = __( 'Make again', 'text-to-audio' );
			}
		}

		return array(
			'status' => $status,
			'label'  => $label[0],
			'note'   => sanitize_text_field( $note ),
			'tone'   => $label[1],
			'action' => $action,
		);
	}

	/**
	 * Draws the column of one post.
	 *
	 * @param string $column  The column.
	 * @param int    $post_id The post.
	 */
	public static function render_column( $column, $post_id ) {
		if ( self::COLUMN !== $column ) {
			return;
		}

		$post = get_post( (int) $post_id );
		if ( ! $post ) {
			return;
		}

		$state = self::describe( $post );

		printf(
			'<span class="atlasvoice-list-chip%1$s">%2$s</span>%3$s',
			'' !== $state['tone'] ? ' is-' . esc_attr( $state['tone'] ) : '',
			esc_html( $state['label'] ),
			'' !== $state['note'] ? '<span class="atlasvoice-list-note">' . esc_html( $state['note'] ) . '</span>' : ''
		);
	}

	/**
	 * Adds "Make audio" to the row of a post that can have it made.
	 *
	 * @param array    $actions The row's actions.
	 * @param \WP_Post $post    The post.
	 *
	 * @return array
	 */
	public static function row_action( $actions, $post ) {
		if ( ! $post instanceof \WP_Post || ! in_array( $post->post_type, self::post_types(), true ) ) {
			return $actions;
		}

		$state = self::describe( $post );
		if ( '' === $state['action'] ) {
			return $actions;
		}

		$url = wp_nonce_url(
			add_query_arg(
				array(
					'action' => self::MAKE_ACTION,
					'post'   => (int) $post->ID,
				),
				admin_url( 'admin-post.php' )
			),
			self::MAKE_ACTION . '_' . $post->ID
		);

		$actions['atlasvoice_audio'] = sprintf(
			'<a href="%1$s" aria-label="%2$s">%3$s</a>',
			esc_url( $url ),
			/* translators: 1: what is done, e.g. "Make audio", 2: the title of a post. */
			esc_attr( sprintf( __( '%1$s for “%2$s”', 'text-to-audio' ), $state['action'], TTA_Helper::atlasvoice_plain_title( $post ) ) ),
			esc_html( $state['action'] )
		);

		return $actions;
	}

	/**
	 * Starts the audio of the post whose row action was pressed, then goes
	 * back to the list with what happened.
	 */
	public static function handle_make() {
		$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;

		check_admin_referer( self::MAKE_ACTION . '_' . $post_id );

		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'text-to-audio' ), '', array( 'response' => 403 ) );
		}

		$result = Post_Panel::make_audio( $post_id );
		$back   = wp_get_referer();
		$back   = $back ? remove_query_arg( array( self::RESULT, 'atlasvoice_audio_post' ), $back ) : admin_url( 'edit.php?post_type=' . get_post_type( $post_id ) );

		// What went wrong is kept for a minute for this user, not put in the address.
		if ( is_wp_error( $result ) ) {
			set_transient( 'atlasvoice_audio_error_' . get_current_user_id(), $result->get_error_message(), MINUTE_IN_SECONDS );
		}

		wp_safe_redirect(
			add_query_arg(
				array(
					self::RESULT            => is_wp_error( $result ) ? 'refused' : 'started',
					'atlasvoice_audio_post' => $post_id,
				),
				$back
			)
		);
		if ( ! defined( 'ATLASVOICE_TESTING' ) ) {
			exit;
		}
	}

	/**
	 * Says on the list what a row action did.
	 */
	public static function render_result() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- only shows a message about what was done.
		if ( ! $screen || 'edit' !== $screen->base || empty( $_GET[ self::RESULT ] ) ) {
			return;
		}

		$result = sanitize_key( wp_unslash( $_GET[ self::RESULT ] ) );
		$post   = isset( $_GET['atlasvoice_audio_post'] ) ? get_post( absint( $_GET['atlasvoice_audio_post'] ) ) : null;
		// phpcs:enable
		$title = $post ? TTA_Helper::atlasvoice_plain_title( $post ) : '';

		if ( 'started' === $result ) {
			printf(
				'<div class="notice notice-success is-dismissible"><p>%s</p></div>',
				/* translators: %s: the title of a post. */
				esc_html( sprintf( __( 'The audio of “%s” is being made. It runs on the server; the list shows it when you load it again.', 'text-to-audio' ), $title ) )
			);

			return;
		}

		$key = 'atlasvoice_audio_error_' . get_current_user_id();
		$why = (string) get_transient( $key );
		delete_transient( $key );

		printf(
			'<div class="notice notice-error is-dismissible"><p>%s</p></div>',
			/* translators: 1: the title of a post, 2: why. */
			esc_html( sprintf( __( 'The audio of “%1$s” was not started. %2$s', 'text-to-audio' ), $title, $why ) )
		);
	}

	/**
	 * The filter above the list.
	 *
	 * @param string $post_type The kind of post the list shows.
	 */
	public static function render_filter( $post_type ) {
		if ( ! in_array( $post_type, self::post_types(), true ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- a filter of a list, it changes nothing.
		$current = isset( $_GET[ self::FILTER ] ) ? sanitize_key( wp_unslash( $_GET[ self::FILTER ] ) ) : '';
		$options = array(
			''        => __( 'Audio: any', 'text-to-audio' ),
			'ready'   => __( 'Audio: ready', 'text-to-audio' ),
			'missing' => __( 'Audio: none yet', 'text-to-audio' ),
			'making'  => __( 'Audio: being made', 'text-to-audio' ),
			'failed'  => __( 'Audio: failed', 'text-to-audio' ),
		);

		echo '<label class="screen-reader-text" for="atlasvoice-audio-filter">' . esc_html__( 'Filter by audio', 'text-to-audio' ) . '</label>';
		echo '<select name="' . esc_attr( self::FILTER ) . '" id="atlasvoice-audio-filter">';
		foreach ( $options as $value => $label ) {
			printf( '<option value="%1$s"%2$s>%3$s</option>', esc_attr( $value ), selected( $current, $value, false ), esc_html( $label ) );
		}
		echo '</select>';
	}

	/**
	 * Narrows the list to the posts with, or without, stored audio.
	 *
	 * @param \WP_Query $query The list's query.
	 */
	public static function apply_filter( $query ) {
		global $pagenow;

		if ( ! is_admin() || 'edit.php' !== $pagenow || ! $query instanceof \WP_Query || ! $query->is_main_query() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- a filter of a list, it changes nothing.
		$status = isset( $_GET[ self::FILTER ] ) ? sanitize_key( wp_unslash( $_GET[ self::FILTER ] ) ) : '';
		// "Being made" and "failed" are in a post's job, which a query cannot
		// read: the posts are found first and the list is narrowed to them.
		if ( in_array( $status, array( 'making', 'failed' ), true ) ) {
			$ids = Posts::ids_with_job_status( $status );
			$query->set( 'post__in', $ids ? $ids : array( 0 ) );

			return;
		}

		$filter = in_array( $status, array( 'ready', 'missing' ), true ) ? Posts::status_meta_query( $status ) : array();
		if ( ! $filter ) {
			return;
		}

		$existing = $query->get( 'meta_query' );
		// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- the admin's own list, one page.
		$query->set(
			'meta_query',
			$existing ? array(
				'relation' => 'AND',
				$existing,
				$filter,
			) : $filter
		);
	}

	/**
	 * The look of the column: the chip and the line under it.
	 */
	public static function render_style() {
		echo '<style id="atlasvoice-posts-list">'
			. '.column-' . esc_attr( self::COLUMN ) . '{width:170px;}'
			. '.atlasvoice-list-chip{display:inline-block;padding:1px 8px;border-radius:2px;background:#f0f0f0;color:#1e1e1e;font-size:12px;line-height:20px;}'
			. '.atlasvoice-list-chip.is-ok{background:#edfaef;color:#005c12;}'
			. '.atlasvoice-list-chip.is-warn{background:#fcf9e8;color:#614200;}'
			. '.atlasvoice-list-chip.is-err{background:#fcf0f1;color:#8a2424;}'
			. '.atlasvoice-list-note{display:block;margin-top:4px;color:#646970;font-size:12px;}'
			. '</style>';
	}
}
