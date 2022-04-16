<?php
namespace WPSpeech_Admin;
/**
 * The admin-specific functionality of the plugin.
 *
 * @link       http://azizulhasan.com
 * @since      1.0.0
 *
 * @package    WP_Speech
 * @subpackage WP_Speech/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    WP_Speech
 * @subpackage WP_Speech/admin
 * @author     WebAppick <shoroar@webappick.com>
 */
class WP_Speech_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $plugin_name       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;

	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {

        if( isset($_REQUEST['page']) && ( 'wp-speech' == $_REQUEST['page']  ) ) {

            // /* Selectize css*/
            // wp_enqueue_style('select-styles', plugin_dir_url(__FILE__) . 'css/libs/selectize.default.css', array(), $this->version, 'all');


            /* Default styles css*/
            // wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/webappick-tracker-admin.css', array(), $this->version, 'all');

            /* Dashicons */
            wp_enqueue_style('dashicons');
        }

	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {


        // if( isset($_REQUEST['page']) && ( 'wp-speech' == $_REQUEST['page']  ) ) {

            // /* List JS*/
            wp_enqueue_script( 'list-js', plugin_dir_url( __FILE__ ) . 'js/libs/list.min.js', array( 'jquery' ), $this->version, true );

            // /* Seletize JS*/
            // wp_enqueue_script( 'seletize-js', plugin_dir_url( __FILE__ ) . 'js/libs/selectize.min.js', array( 'jquery' ), $this->version, true );


            /* Default JS*/
            // wp_enqueue_script( 'webappick-tracker-js', plugin_dir_url( __FILE__ ) . 'js/webappick-tracker-admin.js', array( 'jquery' ), $this->version, true );



        

            /* Load react js */
            wp_enqueue_script( 'wp-speech-react', plugin_dir_url( __FILE__ ) . 'js/wp-speech-react.js', array(  ), $this->version, true );
            wp_localize_script('wp-speech-react' , 'wp_access', [
                'admin_url' => admin_url('/'),
                'ajax_url' => admin_url('admin-ajax.php'),
                 'api_url' => esc_url_raw( rest_url() ),
                'image_url' => WP_PLUGIN_URL.'/wp-speech/admin/images',
                'plugin_url' => WP_PLUGIN_URL.'/wp-speech',
                'nonce' => wp_create_nonce(WP_Speech_NONCE),
                'rest_nonce' => wp_create_nonce('wp_rest'),
                'server' => $_SERVER,
                'url' => $_SERVER['REQUEST_URI'],
                'post_types'=> get_post_types(),
            ]);

             /**
         * Looad wp-speeh script
        */ 
        wp_enqueue_script( 'wp-speech', plugin_dir_url( __FILE__ ) . 'js/wp-speech.js', array(  ), $this->version, true );
	}

    /**
     * Enqueue wp speech file
     * 
     */
    public function enqueue_wp_speech(){

        wp_enqueue_script( 'wp-speech', plugin_dir_url( __FILE__ ) . 'js/wp-speech.js', array(  ), $this->version, true );

    }



    /**
     * Add Menu and Submenu page
     */

    public function wp_speech_menu() {
        add_menu_page(
            __('WP Speech', 'wp-speech'),
            __('WP Speech', 'wp-speech'),
            'manage_options',
            'wp-speech',
            array($this, "wp_speech_settings"),
            'dashicons-admin-settings',
            null
        );
    }

    /**
     * Webappick main menu page callback
     */
    public function wp_speech_settings() {
        echo "<div class='wpwrap'><div id='app'></div></div>";
    }

}
