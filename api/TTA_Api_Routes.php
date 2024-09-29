<?php

namespace TTA_Api;
/**
 * This class is for getting all plugin's data  through api.
 * This is applied for tracker menu.
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/api
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class TTA_Api_Routes {

	protected $namespace;
	protected $woocommerce;
	protected $version;
	protected $analytics;
	protected $compatibility;

	public function __construct() {
		$this->version       = 'v1';
		$this->namespace     = 'tta/' . $this->version;
		$this->analytics     = new AtlasVoice_Analytics();
		$this->compatibility = new AtlasVoice_Plugin_Compatibility();
		add_action( 'rest_api_init', [ $this, 'tta_speech_register_routes' ] );
	}

	/**
	 * Register Routes
	 */
	public function tta_speech_register_routes() {
		// Register record route.
		register_rest_route(
			$this->namespace,
			'/record',
			array(
				array(
					'methods'             => \WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'tta_manage_record_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),

			)
		);
		// register listening route.
		register_rest_route(
			$this->namespace,
			'/listening',
			array(
				array(
					'methods'             => \WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'tta_manage_listening_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register customize route.
		register_rest_route(
			$this->namespace,
			'/customize',
			array(
				array(
					'methods'             => \WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'tta_manage_customize_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register settings route.
		register_rest_route(
			$this->namespace,
			'/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'tta_manage_settings_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register settings route.
		register_rest_route(
			$this->namespace,
			'/browser',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'tta_browser_settings' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register track route.
		register_rest_route(
			$this->namespace,
			'/track',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'track' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register insights for single post route.
		register_rest_route(
			$this->namespace,
			'/insights/(?P<id>\d+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'insights' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register insights all post route.
		register_rest_route(
			$this->namespace,
			'/insights',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this->analytics, 'all_insights' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register insights all post route.
		register_rest_route(
			$this->namespace,
			'/latest_posts',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'latest_posts' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register save_trackable_ids route.
		register_rest_route(
			$this->namespace,
			'/save_analytics_settings',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'save_analytics_settings' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register get_trackable_ids route.
		register_rest_route(
			$this->namespace,
			'/get_analytics_settings',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'get_analytics_settings' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register get_trackable_ids route.
		register_rest_route(
			$this->namespace,
			'/compatible_data',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->compatibility, 'compatible_data' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);

		// register text_alias route.
		register_rest_route(
			$this->namespace,
			'/text_alias',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'text_alias' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);


		// register text_alias route.
		register_rest_route(
			$this->namespace,
			'/get_all_user_roles',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_all_user_roles' ),
					'permission_callback' => array( $this, 'get_route_access' ),
					'args'                => array(),
				),
			)
		);


	}

	/**
	 * Manage record data.
	 */
	public function tta_manage_record_data( $request ) {
		// $retrieved_nonce = isset( $request['rest_nonce'] ) ? sanitize_text_field( wp_unslash( $request['rest_nonce'] ) ) : '';
		// if ( ! wp_verify_nonce( $retrieved_nonce, 'wp_rest' ) ) {
		//     die( 'Failed security check' );
		// }
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {

			$fields          = json_decode( $request['fields'] );
			$listeningFields = get_option( 'tta_listening_settings' );
			if ( is_array( $listeningFields ) ) {
				$listeningFields['tta__listening_lang'] = $fields->tta__recording__lang;
			} else {
				$listeningFields->tta__listening_lang = $fields->tta__recording__lang;
			}

			update_option( 'tta_record_settings', $fields );
			update_option( 'tta_listening_settings', $listeningFields );

			$response['data'] = get_option( 'tta_record_settings' );

			delete_transient( 'tts_all_settings' );

			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_record_settings' );

			return rest_ensure_response( $response );
		}
	}

	/*
	 * Manage listening data
	 */
	public function tta_manage_listening_data( $request ) {
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'] );

			update_option( 'tta_listening_settings', $fields );

			$response['data'] = get_option( 'tta_listening_settings' );
			delete_transient( 'tts_all_settings' );

			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_listening_settings' );

			return rest_ensure_response( $response );
		}
	}

	/*
	 * Manage customize data
	 */
	public function tta_manage_customize_data( $request ) {
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'] );

			update_option( 'tta_customize_settings', $fields );

			$response['data'] = get_option( 'tta_customize_settings' );

			delete_transient( 'tts_all_settings' );

			delete_transient( 'tts_cached_player_id' );

			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_customize_settings' );

			return rest_ensure_response( $response );
		}
	}

	/*
	 * Manage settings data
	 */
	public function tta_manage_settings_data( $request ) {
		$response['status'] = true;
		// save data about recording.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['fields'] );

			update_option( 'tta_settings_data', $fields );

			$response['data'] = get_option( 'tta_settings_data' );

			delete_transient( 'tts_all_settings' );

			return rest_ensure_response( $response );
		}

		// get data about recording.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tta_settings_data' );

			return rest_ensure_response( $response );
		}
	}

	/**
	 * @param WP_REST_Request
	 *
	 * @return WP_Rest_Response;
	 */
	public function tta_browser_settings( $request ) {

		$browser           = isset( $request['browserName'] ) ? $request['browserName'] : "Mozilla";
		$SpeechRecognition = isset( $request['SpeechRecognition'] ) ? $request['SpeechRecognition'] : "undefined";
		$speechSynthesis   = isset( $request['speechSynthesis'] ) ? $request['speechSynthesis'] : "undefined";
		update_option( 'tta_current_browser_info', [
			'browser'           => $browser,
			'SpeechRecognition' => $SpeechRecognition,
			'speechSynthesis'   => $speechSynthesis,
		] );

		return rest_ensure_response( get_option( 'tta_current_browser_info' ) );
	}

	public function text_alias( $request ) {
		$response['status'] = true;
		// save data.
		if ( 'post' == $request['method'] ) {
			$fields = json_decode( $request['aliases'] );

			update_option( 'tts_text_aliases', $fields );

			$response['data'] = get_option( 'tts_text_aliases' );

			delete_transient( 'tts_all_settings' );

			return rest_ensure_response( $response );
		}

		// get data.
		if ( 'get' == $request['method'] ) {

			$response['data'] = get_option( 'tts_text_aliases' );

			return rest_ensure_response( $response );
		}
	}

	public function get_all_user_roles($request) {
		// Access the global $wp_roles object
		if (!isset($wp_roles)) {
			global $wp_roles;
		}

		// Get all roles
		$all_roles = $wp_roles->roles;

		$user_roles = [];
		$user_roles['all'] = 'All';

		// Output all roles
		foreach ($all_roles as $role_key => $role_data) {
			$user_roles[$role_key]  = $role_data['name'];
		}

		$response['status'] = true;

		$response['data'] = $user_roles;

		return rest_ensure_response( $response );
	}


	/*
	 * Get route access if request is valid.
	 */
	public function get_route_access() {
		if ( ! isset( $_SERVER['HTTP_X_WP_NONCE'] ) || ! $_SERVER['HTTP_X_WP_NONCE'] || ! wp_verify_nonce( $_SERVER['HTTP_X_WP_NONCE'], 'wp_rest' ) ) {
			return apply_filters( 'tts_rest_route_access', false );
		}

		return apply_filters( 'tts_rest_route_access', true );
	}
}
