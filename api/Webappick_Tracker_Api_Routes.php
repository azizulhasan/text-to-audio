<?php
namespace WebappickTracker_Api;
/**
 * This class is for getting all plugin's data  through api.
 * This is applied for tracker menu.
 * @since      1.0.0
 * @package    Webappick_Tracker
 * @subpackage Webappick_Tracker/api
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class Webappick_Tracker_Api_Routes   {

    protected $namespace;
    protected $rest_base;
    protected  $woocommerce;
    protected  $version;
    public $current_user;

    public function __construct($current_user = null) {
        $this->version = 'v1';
        $this->namespace = 'webappick_tracker/'.$this->version;
        $this->rest_base  = '/tracker';
        $this->current_user = $current_user;
        add_action( 'rest_api_init', [$this, 'webappick_tracker_register_routes'] );
    }

    /**
     * Register Routes
     */
    public function webappick_tracker_register_routes() {
        // Register settings route.
        register_rest_route(
            $this->namespace,
            $this->rest_base.'/all',
            array(
                array(
                    'methods'             => \WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_all_plugins_data' ),
                    'permission_callback' => array( $this, 'get_route_access' ),
                    'args'                => array(),
                ),
                array(
                    'methods'             => \WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'search_plugin_data' ),
                    'permission_callback' => array( $this, 'get_route_access' ),
                    'args'                => array(),
                )
            )
        );
        // Get single product details.
        register_rest_route(
            $this->namespace,
            $this->rest_base.'/details',
            array(
                array(
                    'methods'             => \WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'get_single_product_details' ),
                    'permission_callback' => array( $this, 'get_route_access' ),
                    'args'                => array(),
                )
            )
        );


    }

    /**
     * @param $request
     * @return mixed
     * Get searched plugin data
     */
    public function search_plugin_data($request){

        $where = '';
        // if Email is given.
        if( isset($request['arguments'][3]['name']) && '' != $request['arguments'][3]['name'] && filter_var($request['arguments'][3]['value'], FILTER_VALIDATE_EMAIL)) {
           // print_r($request['arguments'][3]['value']);
            $where .= "admin_email='".$request['arguments'][3]['value']."'";
        }
        // if site URL is given.
        if( isset($request['arguments'][3]['name']) && '' != $request['arguments'][3]['value'] && filter_var( $request['arguments'][3]['value'], FILTER_VALIDATE_URL)){

            $where .= "url='".$request['arguments'][3]['value']."'";
        }
        // if Plugin name is selected.
        if( isset($request['arguments'][2]['name']) && '' != $request['arguments'][2]['value'] ){

            if('' == $where){
                $where .= "plugin='".$request['arguments'][2]['value']."'";
//                $where .= "plugin='Woocommerce Product Feed'";
            }else{
                $where .= " AND plugin='".$request['arguments'][2]['value']."'";
            }
        }

        // if Date range is  selected.
        if(
        isset($request['arguments'][0]['name'])
        && isset($request['arguments'][1]['name'])
        && '' != $request['arguments'][0]['value']
        && '' != $request['arguments'][1]['value']
        ){
            if('' == $where){
                $where .= "created_at BETWEEN '".$request['arguments'][0]['value']." 00:00:00' AND '".$request['arguments'][1]['value']." 23:59:59'";
            }else{
                $where .= " AND created_at BETWEEN '".$request['arguments'][0]['value']." 00:00:00' AND '".$request['arguments'][1]['value']." 23:59:59'";
            }
        }

        if(strlen($where) > 6){
            global $wpdb;
            $response = $wpdb->get_results("SELECT id ,created_at, plugin, site, url, first_name, last_name, admin_email FROM plugin_tracking WHERE ${where}  GROUP BY url  ORDER BY id DESC LIMIT 100", 'ARRAY_A');
        }else{
            global $wpdb;
            $response = $wpdb->get_results("SELECT id ,created_at, plugin, site, url, first_name, last_name, admin_email FROM plugin_tracking  GROUP BY url  ORDER BY id DESC LIMIT 100", 'ARRAY_A');
        }

        return rest_ensure_response( $response );
    }

    /**
     * Get all plugins data.
     */
    public function get_all_plugins_data(  $request ) {
//        check_ajax_referer( 'wp_rest', 'rest_nonce');
//        if ( ! wp_verify_nonce( $retrieved_nonce, 'wp_rest' ) ) {
//            wp_send_json(['data'=> 'Nonce is not verified']);
//            wp_die();
//        }

        global $wpdb;
        $response = $wpdb->get_results("SELECT id ,created_at, plugin, site, url, first_name, last_name, admin_email FROM plugin_tracking GROUP BY url ORDER BY id DESC LIMIT 100", 'ARRAY_A');

        return rest_ensure_response( $response );

    }

    /*
     * Get single product details
     */
    public function get_single_product_details($request){
        $response = '';
        if(isset($request['arguments']) && '' != $request['arguments']){

            $tracking_id = $request['arguments'];
            global $wpdb;
            $response = $wpdb->get_results("SELECT id , tracking_id, log, created_at FROM plugin_tracking_details WHERE tracking_id='".$tracking_id."' ", 'ARRAY_A');

        }

        return rest_ensure_response( $response );
    }


    /*
     * Get route access if request is valid.
     */

    public  function get_route_access(){

        if ( in_array( 'administrator', (array) $this->current_user->roles )  ) {
            return true;
        }
    }
}
