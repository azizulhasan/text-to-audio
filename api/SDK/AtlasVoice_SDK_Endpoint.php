<?php
/**
 * AtlasVoice SDK REST Endpoint
 *
 * Provides a cross-domain analytics tracking endpoint for the AtlasVoice JS SDK.
 * When the SDK runs on an external site (abc.com) and the WP plugin is active on
 * another site (xyz.com), this endpoint receives analytics data via WP Application
 * Password authentication.
 *
 * @package    TTA
 * @subpackage TTA/api/SDK
 * @since      1.0.0
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */

namespace TTA_SDK;

use TTA_Api\AtlasVoice_Analytics;

class AtlasVoice_SDK_Endpoint {

	/**
	 * REST API namespace.
	 *
	 * @var string
	 */
	private $namespace = 'atlasvoice-sdk/v1';

	/**
	 * Analytics handler — reuses existing AtlasVoice_Analytics class.
	 *
	 * @var AtlasVoice_Analytics
	 */
	private $analytics;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->analytics = new AtlasVoice_Analytics();
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
		add_filter( 'rest_pre_serve_request', [ $this, 'add_cors_headers' ], 10, 4 );

		// Handle CORS preflight OPTIONS requests
		add_action( 'rest_api_init', function () {
			remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
		}, 15 );
	}

	/**
	 * Register REST routes.
	 */
	public function register_routes() {
		// POST /atlasvoice-sdk/v1/track — receive analytics from external SDK
		register_rest_route(
			$this->namespace,
			'/track',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this->analytics, 'track' ),
					'permission_callback' => array( $this, 'check_sdk_permission' ),
					'args'                => array(
						'user_id'   => array(
                            'type'        => array( 'integer', 'string' ),
							'description' => 'User ID or fingerprint hash',
							'required'    => true,
						),
						'post_id'   => array(
							'type'        => array( 'integer', 'string' ),
							'description' => 'Post ID on the WP site',
							'required'    => true,
						),
						'analytics' => array(
							'type'        => 'object',
							'description' => 'Analytics event data (play, pause, resume, end, time, device_info)',
							'required'    => true,
						),
						'other_data' => array(
							'type'        => 'object',
							'description' => 'Additional data',
							'required'    => false,
						),
					),
				),
				// Handle CORS preflight
				array(
					'methods'             => 'OPTIONS',
					'callback'            => function () {
						return new \WP_REST_Response( null, 204 );
					},
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * Permission check for SDK endpoints.
	 *
	 * Uses WordPress Application Passwords (built-in since WP 5.6).
	 * Cross-domain requests cannot use nonce-based auth (nonces are tied to
	 * logged-in sessions). The SDK sends `Authorization: Basic base64(username:app_password)`
	 * header. WP automatically authenticates this for REST API requests.
	 *
	 * The endpoint verifies the authenticated user has 'read' capability.
	 *
	 * @param \WP_REST_Request $request
	 *
	 * @return true|\WP_Error
	 */
	public function check_sdk_permission( $request ) {
		// WP Application Password auth is handled automatically by WP core.
		// After WP processes the Authorization header, the user is logged in.
		if ( ! is_user_logged_in() || ! current_user_can( 'read' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Authentication required. Use WordPress Application Password.', 'text-to-audio' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	/**
	 * Add CORS headers for cross-domain SDK requests.
	 *
	 * Allowed origins can be customized via the 'atlasvoice_sdk_allowed_origins' filter.
	 *
	 * @param bool              $served
	 * @param \WP_REST_Response $result
	 * @param \WP_REST_Request  $request
	 * @param \WP_REST_Server   $server
	 *
	 * @return bool
	 */
	public function add_cors_headers( $served, $result, $request, $server ) {
		$route = $request->get_route();

		// Only add CORS headers for our SDK namespace
		if ( strpos( $route, '/' . $this->namespace ) !== 0 ) {
			return $served;
		}

		$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? sanitize_url( $_SERVER['HTTP_ORIGIN'] ) : '*';

		/**
		 * Filter allowed origins for SDK CORS.
		 *
		 * @param array $allowed_origins Array of allowed origin URLs. Use ['*'] for all origins.
		 */
		$allowed_origins = apply_filters( 'atlasvoice_sdk_allowed_origins', array( '*' ) );

		$allow = false;
		if ( in_array( '*', $allowed_origins, true ) ) {
			$allow = true;
			$origin = '*';
		} elseif ( in_array( $origin, $allowed_origins, true ) ) {
			$allow = true;
		}

		if ( $allow ) {
			header( 'Access-Control-Allow-Origin: ' . $origin );
			header( 'Access-Control-Allow-Methods: POST, OPTIONS' );
			header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce' );
			header( 'Access-Control-Allow-Credentials: true' );
			header( 'Access-Control-Max-Age: 86400' );
		}

		return $served;
	}
}
