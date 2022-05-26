<?php
namespace WPSpeech_Api;

/**
 * This class is for getting all plugin's data  through api.
 * This is applied for tracker menu.
 * @since      1.0.0
 * @package    WP_Speech
 * @subpackage WP_Speech/api
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class WP_Speech_Api_Routes
{

    protected $namespace;
    protected $rest_base;
    protected $woocommerce;
    protected $version;
    public $current_user;

    public function __construct($current_user = null)
    {
        $this->version = 'v1';
        $this->namespace = 'wps/' . $this->version;
        $this->rest_base = '/speech';
        $this->current_user = $current_user;
        add_action('rest_api_init', [$this, 'wps_speech_register_routes']);
    }

    /**
     * Register Routes
     */
    public function wps_speech_register_routes()
    {
        // Register record route.
        register_rest_route(
            $this->namespace,
            $this->rest_base . '/record',
            array(
                array(
                    'methods' => \WP_REST_Server::ALLMETHODS,
                    'callback' => array($this, 'wps_manage_record_data'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),

            )
        );
        // register listening route.
        register_rest_route(
            $this->namespace,
            $this->rest_base . '/listening',
            array(
                array(
                    'methods' => \WP_REST_Server::ALLMETHODS,
                    'callback' => array($this, 'wps_manage_listening_data'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        // register customize route.
        register_rest_route(
            $this->namespace,
            $this->rest_base . '/customize',
            array(
                array(
                    'methods' => \WP_REST_Server::ALLMETHODS,
                    'callback' => array($this, 'wps_manage_customize_data'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        // register settings route.
        register_rest_route(
            $this->namespace,
            $this->rest_base . '/settings',
            array(
                array(
                    'methods' => \WP_REST_Server::ALLMETHODS,
                    'callback' => array($this, 'wps_manage_settings_data'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

    }
    /**
     * Manage record data.
     */
    public function wps_manage_record_data($request)
    {
        // $retrieved_nonce = isset( $request['rest_nonce'] ) ? sanitize_text_field( wp_unslash( $request['rest_nonce'] ) ) : '';
        // if ( ! wp_verify_nonce( $retrieved_nonce, 'wp_rest' ) ) {
        //     die( 'Failed security check' );
        // }
        $response['status'] = true;
        // save data about recording.
        if ('post' == $request['method']) {

            $fields = json_decode($request['fields']);
            $listeningFields = get_option('wps_listening_settings');
            if ( is_array( $listeningFields ) ){
                $listeningFields['wps__listening_lang'] = $fields->wps__recording__lang;
            }else{
                $listeningFields->wps__listening_lang = $fields->wps__recording__lang;
            }
            
            update_option('wps_record_settings', $fields);
            update_option('wps_listening_settings', $listeningFields);

            $response['data'] = get_option('wps_record_settings');

            return rest_ensure_response($response);
        }

        // get data about recording.
        if ('get' == $request['method']) {

            $response['data'] = get_option('wps_record_settings');
            return rest_ensure_response($response);
        }
    }

    /*
     * Manage listening data
     */
    public function wps_manage_listening_data($request)
    {
        $response['status'] = true;
        // save data about recording.
        if ('post' == $request['method']) {
            $fields = json_decode($request['fields']);

            update_option('wps_listening_settings', $fields);

            $response['data'] = get_option('wps_listening_settings');

            return rest_ensure_response($response);
        }

        // get data about recording.
        if ('get' == $request['method']) {

            $response['data'] = get_option('wps_listening_settings');

            return rest_ensure_response($response);
        }
    }

    /*
     * Manage customize data
     */
    public function wps_manage_customize_data($request)
    {
        $response['status'] = true;
        // save data about recording.
        if ('post' == $request['method']) {
            $fields = json_decode($request['fields']);

            update_option('wps_customize_settings', $fields);

            $response['data'] = get_option('wps_customize_settings');

            return rest_ensure_response($response);
        }

        // get data about recording.
        if ('get' == $request['method']) {

            $response['data'] = get_option('wps_customize_settings');
            return rest_ensure_response($response);
        }
    }

    /*
     * Manage settings data
     */
    public function wps_manage_settings_data($request)
    {
        $response['status'] = true;
        // save data about recording.
        if ('post' == $request['method']) {
            $fields = json_decode($request['fields']);

            update_option('wps_settings_data', $fields);

            $response['data'] = get_option('wps_settings_data');

            return rest_ensure_response($response);
        }

        // get data about recording.
        if ('get' == $request['method']) {

            $response['data'] = get_option('wps_settings_data');
            return rest_ensure_response($response);
        }
    }

    /*
     * Get route access if request is valid.
     */

    public function get_route_access()
    {

        return true;
        
    }
}
