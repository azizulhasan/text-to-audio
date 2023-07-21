<?php
namespace TTA_Api;


use \Google\Client;
use \Google\Service\Texttospeech;
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

    public function __construct() {
        $this->version = 'v1';
        $this->namespace = 'tta/' . $this->version;
        add_action('rest_api_init', [$this, 'tta_speech_register_routes']);
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
                    'methods' => \WP_REST_Server::ALLMETHODS,
                    'callback' => array($this, 'tta_manage_record_data'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),

            )
        );
        // register listening route.
        register_rest_route(
            $this->namespace,
            '/listening',
            array(
                array(
                    'methods' => \WP_REST_Server::ALLMETHODS,
                    'callback' => array($this, 'tta_manage_listening_data'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        // register customize route.
        register_rest_route(
            $this->namespace,
            '/customize',
            array(
                array(
                    'methods' => \WP_REST_Server::ALLMETHODS,
                    'callback' => array($this, 'tta_manage_customize_data'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        // register settings route.
        register_rest_route(
            $this->namespace,
            '/settings',
            array(
                array(
                    'methods' => \WP_REST_Server::ALLMETHODS,
                    'callback' => array($this, 'tta_manage_settings_data'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        // register settings route.
        register_rest_route(
            $this->namespace,
            '/browser',
            array(
                array(
                    'methods' => \WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'tta_browser_settings'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        // file upload
        register_rest_route(
            $this->namespace,
            '/upload_file',
            array(
                array(
                    'methods' => \WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'tta_upload_file'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        // Get auth file path
        register_rest_route(
            $this->namespace,
            '/get_auth_file',
            array(
                array(
                    'methods' => \WP_REST_Server::READABLE,
                    'callback' => array($this, 'tta_get_auth_file'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        // Get auth file path
        register_rest_route(
            $this->namespace,
            '/authenticate',
            array(
                array(
                    'methods' => \WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'tta_authenticate'),
                    'permission_callback' => array($this, 'get_route_access'),
                    'args' => array(),
                ),
            )
        );

        
        

    }
    /**
     * Manage record data.
     */
    public function tta_manage_record_data($request) {
        // $retrieved_nonce = isset( $request['rest_nonce'] ) ? sanitize_text_field( wp_unslash( $request['rest_nonce'] ) ) : '';
        // if ( ! wp_verify_nonce( $retrieved_nonce, 'wp_rest' ) ) {
        //     die( 'Failed security check' );
        // }
        $response['status'] = true;
        // save data about recording.
        if ('post' == $request['method']) {

            $fields = json_decode($request['fields']);
            $listeningFields = get_option('tta_listening_settings');
            if (is_array($listeningFields)) {
                $listeningFields['tta__listening_lang'] = $fields->tta__recording__lang;
            } else {
                $listeningFields->tta__listening_lang = $fields->tta__recording__lang;
            }

            update_option('tta_record_settings', $fields);
            update_option('tta_listening_settings', $listeningFields);

            $response['data'] = get_option('tta_record_settings');

            return rest_ensure_response($response);
        }

        // get data about recording.
        if ('get' == $request['method']) {

            $response['data'] = get_option('tta_record_settings');
            return rest_ensure_response($response);
        }
    }

    /*
     * Manage listening data
     */
    public function tta_manage_listening_data($request) {
        $response['status'] = true;
        // save data about recording.
        if ('post' == $request['method']) {
            $fields = json_decode($request['fields']);

            update_option('tta_listening_settings', $fields);

            $response['data'] = get_option('tta_listening_settings');

            return rest_ensure_response($response);
        }

        // get data about recording.
        if ('get' == $request['method']) {

            $response['data'] = get_option('tta_listening_settings');

            return rest_ensure_response($response);
        }
    }

    /*
     * Manage customize data
     */
    public function tta_manage_customize_data($request) {
        $response['status'] = true;
        // save data about recording.
        if ('post' == $request['method']) {
            $fields = json_decode($request['fields']);

            update_option('tta_customize_settings', $fields);

            $response['data'] = get_option('tta_customize_settings');

            return rest_ensure_response($response);
        }

        // get data about recording.
        if ('get' == $request['method']) {

            $response['data'] = get_option('tta_customize_settings');
            return rest_ensure_response($response);
        }
    }

    /*
     * Manage settings data
     */
    public function tta_manage_settings_data($request) {
        $response['status'] = true;
        // save data about recording.
        if ('post' == $request['method']) {
            $fields = json_decode($request['fields']);

            update_option('tta_settings_data', $fields);

            $response['data'] = get_option('tta_settings_data');

            return rest_ensure_response($response);
        }

        // get data about recording.
        if ('get' == $request['method']) {

            $response['data'] = get_option('tta_settings_data');
            return rest_ensure_response($response);
        }
    }
    /**
     * @param WP_REST_Request
     *
     * @return WP_Rest_Response;
     */
    public function tta_browser_settings($request) {

        $browser = isset($request['browserName']) ? $request['browserName'] : "Mozilla";
        $SpeechRecognition = isset($request['SpeechRecognition']) ? $request['SpeechRecognition'] : "undefined";
        $speechSynthesis = isset($request['speechSynthesis']) ? $request['speechSynthesis'] : "undefined";
        update_option('tta_current_browser_info', [
            'browser' => $browser,
            'SpeechRecognition' => $SpeechRecognition,
            'speechSynthesis' => $speechSynthesis,
        ]);

        return rest_ensure_response(get_option('tta_current_browser_info'));
    }


    public function tta_upload_file($request) {

        $extension = pathinfo($_FILES['auth_file']['name'], PATHINFO_EXTENSION);

	    $new_name = 'tts_auth_file_'. time() . '.' . $extension;

        update_option('tts_auth_file_name' , $new_name);

        $is_uploaded = move_uploaded_file($_FILES['auth_file']['tmp_name'], \TTA_PRO_AUDIO_DIR . $new_name);

        return \rest_ensure_response([
            'file_name' => $new_name,
            'status' => $is_uploaded
        ]);
    }


    public function tta_get_auth_file() {
        $file_name = \get_option('tts_auth_file_name', '');
        return  \rest_ensure_response([
            'file' => TTA_PRO_AUDIO_DIR . $file_name,
        ]);
    }

    public function tta_authenticate($request) {
session_start();
        $body = \json_decode( $request->get_body(), true);
        $redirect_uri =  \admin_url('admin.php?page=text-to-audio');
        $client = new Client();
        $client->setAuthConfig( $body['file']);
        $client->addScope(Texttospeech::CLOUD_PLATFORM);
        $client->setRedirectUri($redirect_uri);
        $client->setAccessType('offline');        // offline access
        $client->setIncludeGrantedScopes(true);   // incremental auth


        if (! isset($_GET['code'])) {
        $auth_url = $client->createAuthUrl();
        // header('Location: ' . filter_var($auth_url, FILTER_SANITIZE_URL));
        }
        

        return \rest_ensure_response([
            $auth_url,
            $redirect_uri,
            \json_decode(file_get_contents($body['file'])),
        ]);
    }

    /*
     * Get route access if request is valid.
     */

    public function get_route_access() {

        return true;

    }
}
