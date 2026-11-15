<?php
/**
 * What the post editor shows about one post.
 *
 * @package TTA
 */

namespace TTA\Editor;

use TTA\Cloud\Jobs;
use TTA\Content\Where;
use TTA\Library\Audio;
use TTA\Library\Posts;
use TTA\TTA_Helper;
use TTA_Admin\Admin_App;
use TTA_Api\Route_Access;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-347: the "AtlasVoice" panel of the post editor: the audio of this post,
 * whether the player shows on it, how much it was listened to, and the
 * shortcode.
 *
 * Nothing new is stored. Hiding the player on a post adds the post to the
 * list the "What is read" screen keeps (`tta__settings_exclude_post_ids`);
 * making audio starts the same job the Audio library starts.
 *
 * Unlike the settings screens this is for everyone who can edit the post, so
 * its routes ask for that and not for "manage options". The admin screen
 * (REST: tta/v1/post-panel/<id>), `wp atlasvoice post` and an MCP server all
 * act here.
 */
class Post_Panel {

	const HANDLE = 'atlasvoice-editor-panel';

	/** The admin-post action of the toolbar's hide / show item. */
	const TOGGLE_ACTION = 'atlasvoice_post_player';

	/** How many days of listening are counted. */
	const DAYS = 30;

	/**
	 * True while this class itself asks whether AtlasVoice runs for the post.
	 *
	 * @var bool
	 */
	private static $asking = false;

	/**
	 * Hooks the routes and the editor.
	 */
	public static function register() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue' ) );
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_box' ), 20 );
		add_filter( 'atlasvoice_render_audio_panel', array( __CLASS__, 'replaces_audio_box' ), 99 );
		add_action( 'admin_post_' . self::TOGGLE_ACTION, array( __CLASS__, 'handle_toolbar_toggle' ) );
	}

	/**
	 * The toolbar's "Hide / Show the player on this post": the address to
	 * press and what the post has now. For the post that is open on the
	 * site or in the editor, when the user can edit it.
	 *
	 * @return array{shown:bool, url:string}|null Null where there is no such post.
	 */
	public static function toolbar_toggle() {
		$post_id = 0;

		if ( is_admin() ) {
			$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
			if ( $screen && 'post' === $screen->base && get_post() ) {
				$post_id = (int) get_post()->ID;
			}
		} elseif ( is_singular() ) {
			$post_id = (int) get_queried_object_id();
		}

		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return null;
		}

		$shown = ! in_array( $post_id, self::hidden(), true );
		$back  = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';

		return array(
			'shown' => $shown,
			'url'   => wp_nonce_url(
				add_query_arg(
					array(
						'action' => self::TOGGLE_ACTION,
						'post'   => $post_id,
						// What a press does: the opposite of what is there now.
						'shown'  => $shown ? '0' : '1',
						'back'   => rawurlencode( $back ),
					),
					admin_url( 'admin-post.php' )
				),
				self::TOGGLE_ACTION . '_' . $post_id
			),
		);
	}

	/**
	 * Handles a press of the toolbar item, then goes back to the page.
	 */
	public static function handle_toolbar_toggle() {
		$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;

		check_admin_referer( self::TOGGLE_ACTION . '_' . $post_id );

		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'text-to-audio' ), '', array( 'response' => 403 ) );
		}

		self::show_player( $post_id, isset( $_GET['shown'] ) && '1' === $_GET['shown'] );

		$back = isset( $_GET['back'] ) ? esc_url_raw( rawurldecode( wp_unslash( $_GET['back'] ) ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitised by esc_url_raw.
		// Only back to this site: wp_safe_redirect() refuses any other host.
		wp_safe_redirect( '' !== $back ? $back : (string) get_permalink( $post_id ) );
		if ( ! defined( 'ATLASVOICE_TESTING' ) ) {
			exit;
		}
	}

	/**
	 * Whether the panel is what the editor shows: the new admin is in use
	 * and the panel's script is built.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return Admin_App::is_enabled() && is_readable( self::build_path( 'editor.asset.php' ) );
	}

	/**
	 * The panel holds the rows of the post's audio files, so the separate
	 * "AtlasVoice audio" box is not shown beside it.
	 *
	 * @param bool $show Whether the "AtlasVoice audio" box shows.
	 *
	 * @return bool
	 */
	public static function replaces_audio_box( $show ) {
		return self::$asking || ! self::is_active() ? $show : false;
	}

	/**
	 * What the panel shows for a post.
	 *
	 * @param int $post_id The post.
	 *
	 * @return array|\WP_Error {
	 *     post: array{id:int, published:bool},
	 *     player: array{shown:bool},
	 *     audio: array{kind:string, status:string, when:string, can_make:bool, reason:string, job:array|null, off:bool},
	 *     files: array|null, files_key: string,
	 *     listening: array{counted:bool, days:int, plays:int, listeners:int, finished:int},
	 *     shortcode: string
	 * }
	 *
	 * audio.kind is "browser" (read live, no files), "jobs" (made by an audio
	 * job) or "files" (made by the player the first time it is played).
	 * audio.status is draft, ready, outdated, making, failed or missing.
	 */
	public static function get( $post_id ) {
		$post = get_post( (int) $post_id );
		if ( ! $post ) {
			return new \WP_Error( 'atlasvoice_no_post', __( 'This post does not exist.', 'text-to-audio' ), array( 'status' => 404 ) );
		}

		$published = 'publish' === $post->post_status;
		$jobs      = Audio::get();
		$stores    = TTA_Helper::player_makes_mp3( (int) TTA_Helper::get_player_id() );
		$one       = $stores && $published ? Posts::one( $post ) : array(
			'status' => '',
			'job'    => null,
		);

		$kind = 'browser';
		if ( $stores ) {
			$kind = $jobs['available'] ? 'jobs' : 'files';
		}
		$status = '';
		if ( $stores ) {
			$status = $published ? $one['status'] : 'draft';
		}

		$off   = Jobs::is_off( $post->ID );
		$files = $stores ? TTA_Helper::atlasvoice_panel_state( $post ) : null;

		$customize = (array) get_option( 'tta_customize_settings' );
		$shortcode = isset( $customize['tta_play_btn_shortcode'] ) && is_string( $customize['tta_play_btn_shortcode'] ) && '' !== $customize['tta_play_btn_shortcode'] ? $customize['tta_play_btn_shortcode'] : '[atlasvoice]';

		return array(
			'post'      => array(
				'id'        => (int) $post->ID,
				'published' => $published,
			),
			'player'    => array(
				'shown' => ! in_array( (int) $post->ID, self::hidden(), true ),
			),
			'audio'     => array(
				'kind'     => $kind,
				'status'   => $status,
				'when'     => $jobs['when'],
				'can_make' => 'jobs' === $kind && $published && 'making' !== $status && ! $off,
				'reason'   => $jobs['reason'],
				'job'      => $one['job'],
				'off'      => $off,
				// What a visitor gets while it is off: '' (as usual), 'browser' or 'none'.
				'visitors' => Audio::visitors_get( (int) $post->ID ),
			),
			// The rows of the post's audio files, as the "AtlasVoice audio" box builds them.
			'files'     => $files,
			'files_key' => $files ? md5( (string) wp_json_encode( $files ) ) : '',
			'listening' => self::listening( (int) $post->ID ),
			'shortcode' => sanitize_text_field( $shortcode ),
		);
	}

	/**
	 * Shows or hides the player on one post.
	 *
	 * @param int  $post_id The post.
	 * @param bool $shown   Whether the player shows.
	 *
	 * @return array|\WP_Error The panel after the save.
	 */
	public static function show_player( $post_id, $shown ) {
		$post = get_post( (int) $post_id );
		if ( ! $post ) {
			return new \WP_Error( 'atlasvoice_no_post', __( 'This post does not exist.', 'text-to-audio' ), array( 'status' => 404 ) );
		}

		$hidden = array_values( array_diff( self::hidden(), array( (int) $post->ID ) ) );
		if ( ! $shown ) {
			$hidden[] = (int) $post->ID;
		}

		$saved = Where::save( array( 'skip_posts' => $hidden ) );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		return self::get( $post->ID );
	}

	/**
	 * Switches audio off for one post ("never for this post"), or lets it
	 * follow the site again. Audio that is stored already keeps playing.
	 *
	 * @param int  $post_id The post.
	 * @param bool $off     True: no audio is made for this post.
	 *
	 * @return array|\WP_Error The panel after the save.
	 */
	public static function audio_off( $post_id, $off ) {
		$post = get_post( (int) $post_id );
		if ( ! $post ) {
			return new \WP_Error( 'atlasvoice_no_post', __( 'This post does not exist.', 'text-to-audio' ), array( 'status' => 404 ) );
		}

		if ( $off ) {
			update_post_meta( $post->ID, Jobs::OFF_META, '1' );
		} else {
			delete_post_meta( $post->ID, Jobs::OFF_META );
		}

		return self::get( $post->ID );
	}

	/**
	 * Starts the audio job of one post.
	 *
	 * @param int $post_id The post.
	 *
	 * @return array|\WP_Error The panel after the start, or why nothing was started.
	 */
	public static function make_audio( $post_id ) {
		$panel = self::get( $post_id );
		if ( is_wp_error( $panel ) ) {
			return $panel;
		}

		if ( 'jobs' !== $panel['audio']['kind'] ) {
			return new \WP_Error(
				'atlasvoice_audio_not_by_job',
				'not_connected' === $panel['audio']['reason']
					? __( 'This site is not connected to AtlasVoice, so audio cannot be made here.', 'text-to-audio' )
					: __( 'The voice in use does not make its audio in the background. It is made when the post is played.', 'text-to-audio' ),
				array( 'status' => 409 )
			);
		}
		if ( $panel['audio']['off'] ) {
			return new \WP_Error( 'atlasvoice_audio_off', __( 'Audio is switched off for this post. Let it follow the site setting first.', 'text-to-audio' ), array( 'status' => 409 ) );
		}
		if ( ! $panel['post']['published'] ) {
			return new \WP_Error( 'atlasvoice_post_not_published', __( 'Audio is made from the published page. Publish the post first.', 'text-to-audio' ), array( 'status' => 409 ) );
		}
		if ( 'making' === $panel['audio']['status'] ) {
			return new \WP_Error( 'atlasvoice_audio_being_made', __( 'The audio of this post is being made already.', 'text-to-audio' ), array( 'status' => 409 ) );
		}

		$started = Jobs::start( (int) $post_id );
		if ( is_wp_error( $started ) ) {
			return $started;
		}

		return self::get( $post_id );
	}

	/**
	 * The routes. Each asks that the user can edit the post.
	 */
	public static function register_routes() {
		$access = array( Route_Access::class, 'post_editor' );
		$id     = array(
			'type'        => 'integer',
			'required'    => true,
			'description' => __( 'The post.', 'text-to-audio' ),
		);

		register_rest_route(
			'tta/v1',
			'/post-panel/(?P<id>\d+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'label'               => __( 'Get what AtlasVoice knows about one post', 'text-to-audio' ),
					'description'         => __( 'Returns, for one post: the state of its audio (ready, outdated, making, failed, missing or draft, and whether it can be made now), whether the player shows on it, its plays and listeners of the last 30 days, and the shortcode. For anyone who can edit the post.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'rest_get' ),
					'permission_callback' => $access,
					'args'                => array( 'id' => $id ),
				),
			)
		);

		register_rest_route(
			'tta/v1',
			'/post-panel/(?P<id>\d+)/player',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Show or hide the player on one post', 'text-to-audio' ),
					'description'         => __( 'Shows the player on this post (shown: true) or hides it (shown: false). Other posts are not touched. For anyone who can edit the post.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'rest_player' ),
					'permission_callback' => $access,
					'args'                => array(
						'id'    => $id,
						'shown' => array(
							'type'        => 'boolean',
							'required'    => true,
							'description' => __( 'true shows the player on this post, false hides it.', 'text-to-audio' ),
						),
					),
				),
			)
		);

		register_rest_route(
			'tta/v1',
			'/post-panel/(?P<id>\d+)/audio-off',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Never make audio for one post, or follow the site again', 'text-to-audio' ),
					'description'         => __( 'With off: true no audio is made for this post: not on publish, not on the first play, not in a run for all posts and not by a click. With off: false the post follows the site setting again. Audio that is stored already keeps playing. For anyone who can edit the post.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'rest_audio_off' ),
					'permission_callback' => $access,
					'args'                => array(
						'id'  => $id,
						'off' => array(
							'type'        => 'boolean',
							'required'    => true,
							'description' => __( 'true switches audio off for this post, false lets it follow the site setting.', 'text-to-audio' ),
						),
					),
				),
			)
		);

		register_rest_route(
			'tta/v1',
			'/post-panel/(?P<id>\d+)/audio',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'label'               => __( 'Make the audio of one post now', 'text-to-audio' ),
					'description'         => __( 'Starts an audio job for this published post: its text is sent to the AtlasVoice service and its characters count against the site\'s allowance. It runs in the background; read the post panel again to follow it. For anyone who can edit the post.', 'text-to-audio' ),
					'callback'            => array( __CLASS__, 'rest_audio' ),
					'permission_callback' => $access,
					'args'                => array( 'id' => $id ),
				),
			)
		);
	}

	/**
	 * POST: switch audio off for the post, or on again.
	 *
	 * @param \WP_REST_Request $request Request with `id` and `off`.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_audio_off( $request ) {
		return rest_ensure_response( self::audio_off( (int) $request['id'], (bool) $request->get_param( 'off' ) ) );
	}

	/**
	 * GET: the panel.
	 *
	 * @param \WP_REST_Request $request Request with `id`.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_get( $request ) {
		return rest_ensure_response( self::get( (int) $request['id'] ) );
	}

	/**
	 * POST: show or hide the player.
	 *
	 * @param \WP_REST_Request $request Request with `id` and `shown`.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_player( $request ) {
		return rest_ensure_response( self::show_player( (int) $request['id'], (bool) $request->get_param( 'shown' ) ) );
	}

	/**
	 * POST: make the audio.
	 *
	 * @param \WP_REST_Request $request Request with `id`.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_audio( $request ) {
		return rest_ensure_response( self::make_audio( (int) $request['id'] ) );
	}

	/**
	 * Whether the panel belongs on the screen that is open: the new admin is
	 * in use, AtlasVoice runs for this kind of post, and the user can edit it.
	 *
	 * @return int The post, or 0.
	 */
	public static function post_on_screen() {
		if ( ! self::is_active() ) {
			return 0;
		}

		// The same answer the "AtlasVoice audio" box got before this panel took its place.
		self::$asking = true;
		$runs         = TTA_Helper::atlasvoice_show_audio_panel();
		self::$asking = false;
		if ( ! $runs ) {
			return 0;
		}

		$post = get_post();
		if ( ! $post || ! current_user_can( 'edit_post', $post->ID ) ) {
			return 0;
		}

		return (int) $post->ID;
	}

	/**
	 * Classic Editor: a box for the panel. The block editor has its own
	 * sidebar, so the box is not shown there.
	 */
	public static function add_box() {
		if ( ! self::post_on_screen() ) {
			return;
		}

		add_meta_box(
			'atlasvoice-post-panel',
			__( 'AtlasVoice', 'text-to-audio' ),
			array( __CLASS__, 'render_box' ),
			null,
			'side',
			'default',
			array( '__back_compat_meta_box' => true )
		);

		$screen = get_current_screen();
		if ( $screen && ! $screen->is_block_editor() ) {
			self::enqueue();
		}
	}

	/**
	 * The place the panel is drawn in, in the Classic Editor.
	 */
	public static function render_box() {
		echo '<div id="atlasvoice-post-panel-root"></div>';
	}

	/**
	 * Loads the panel's script with what it needs to start.
	 */
	public static function enqueue() {
		$post_id = self::post_on_screen();
		if ( ! $post_id || wp_script_is( self::HANDLE, 'enqueued' ) ) {
			return;
		}

		$asset   = require self::build_path( 'editor.asset.php' );
		$version = isset( $asset['version'] ) ? $asset['version'] : TEXT_TO_AUDIO_VERSION;

		$deps    = isset( $asset['dependencies'] ) ? (array) $asset['dependencies'] : array();

		// The block editor's own parts are read from the page, so they must be there first.
		foreach ( array( 'wp-plugins', 'wp-edit-post', 'wp-editor', 'wp-data' ) as $handle ) {
			if ( doing_action( 'enqueue_block_editor_assets' ) && wp_script_is( $handle, 'registered' ) ) {
				$deps[] = $handle;
			}
		}

		wp_enqueue_script( self::HANDLE, self::build_url( 'editor.js' ), array_values( array_unique( $deps ) ), $version, true );
		wp_set_script_translations( self::HANDLE, 'text-to-audio' );
		wp_add_inline_script(
			self::HANDLE,
			'window.atlasvoiceEditorBoot = ' . wp_json_encode(
				array(
					'restUrl'   => esc_url_raw( rest_url() ),
					'restNonce' => wp_create_nonce( 'wp_rest' ),
					'postId'    => $post_id,
					// Links to the settings screens are for those who can open them.
					'appUrl'    => current_user_can( 'manage_options' ) ? esc_url_raw( admin_url( 'admin.php?page=text-to-audio' ) ) : '',
				)
			) . ';',
			'before'
		);

		// The rows of the audio files are the "AtlasVoice audio" box's own part; it starts from this.
		wp_add_inline_script(
			self::HANDLE,
			'window.atlasVoiceMetabox = ' . wp_json_encode(
				array(
					'state'     => TTA_Helper::atlasvoice_panel_state( get_post( $post_id ) ),
					'apiURL'    => esc_url_raw( rest_url() ) . 'tta/v1/',
					'restNonce' => wp_create_nonce( 'wp_rest' ),
				)
			) . ';',
			'before'
		);

		wp_enqueue_style( 'dashicons' );
		wp_enqueue_style( 'atlasvoice-audio-panel', TTA_PLUGIN_URL . 'admin/css/atlasvoice-audio-panel.css', array( 'wp-components' ), TEXT_TO_AUDIO_VERSION );
		if ( is_readable( self::build_path( 'editor.css' ) ) ) {
			wp_enqueue_style( self::HANDLE, self::build_url( 'editor.css' ), array( 'wp-components' ), $version );
		}
	}

	/**
	 * The posts the player is hidden on.
	 *
	 * @return int[]
	 */
	private static function hidden() {
		$where = Where::get();

		return array_map( 'intval', isset( $where['skip_posts'] ) ? (array) $where['skip_posts'] : array() );
	}

	/**
	 * How much a post was listened to in the last days.
	 *
	 * @param int $post_id The post.
	 *
	 * @return array{counted:bool, days:int, plays:int, listeners:int}
	 */
	private static function listening( $post_id ) {
		global $wpdb;

		$settings = get_option( 'tta_analytics_settings', array() );
		$settings = is_object( $settings ) ? get_object_vars( $settings ) : (array) $settings;
		$counted  = ! empty( $settings['tts_enable_analytics'] ) && 'false' !== $settings['tts_enable_analytics'];
		$numbers  = null;

		if ( $counted ) {
			$table = $wpdb->prefix . 'atlasvoice_analytics';
			$quiet = $wpdb->suppress_errors( true );
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- the plugin's own table; a small count for one post.
			$numbers = $wpdb->get_row(
				$wpdb->prepare(
					// A listener's row holds what the player counted; "end" is in it once the audio was heard to the end.
					"SELECT COUNT(*) AS listeners, COALESCE(SUM(analytics LIKE %s OR analytics LIKE %s), 0) AS finished, COALESCE(SUM(play_count), 0) AS plays FROM {$table} WHERE post_id = %d AND updated_at >= %s",
					'%' . $wpdb->esc_like( 's:3:"end";a:' ) . '%',
					'%' . $wpdb->esc_like( '"end":{' ) . '%',
					$post_id,
					gmdate( 'Y-m-d H:i:s', time() - self::DAYS * DAY_IN_SECONDS )
				)
			);
			// phpcs:enable
			$wpdb->suppress_errors( $quiet );
		}

		$listeners = $numbers ? (int) $numbers->listeners : 0;

		return array(
			'counted'   => $counted,
			'days'      => self::DAYS,
			'plays'     => $numbers ? (int) $numbers->plays : 0,
			'listeners' => $listeners,
			// The share of listeners who heard it to the end, in percent.
			'finished'  => $listeners > 0 ? (int) round( 100 * (int) $numbers->finished / $listeners ) : 0,
		);
	}

	/**
	 * A file of the built admin app.
	 *
	 * @param string $file File name.
	 *
	 * @return string Path.
	 */
	private static function build_path( $file ) {
		return TTA_PLUGIN_PATH . 'build/admin-app/' . $file;
	}

	/**
	 * A file of the built admin app, as a URL.
	 *
	 * @param string $file File name.
	 *
	 * @return string URL.
	 */
	private static function build_url( $file ) {
		return TTA_PLUGIN_URL . 'build/admin-app/' . $file;
	}
}
