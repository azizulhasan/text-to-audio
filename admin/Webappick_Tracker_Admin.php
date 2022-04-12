<?php
namespace WebappickTracker_Admin;
/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://webappick.com
 * @since      1.0.0
 *
 * @package    Webappick_Tracker
 * @subpackage Webappick_Tracker/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Webappick_Tracker
 * @subpackage Webappick_Tracker/admin
 * @author     WebAppick <shoroar@webappick.com>
 */
class Webappick_Tracker_Admin {

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

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Webappick_Tracker_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Webappick_Tracker_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */
        if( isset($_REQUEST['page']) && ( 'webappick-tracker-react' == $_REQUEST['page'] || 'webappick-tracker' == $_REQUEST['page'] ) ) {

            /* Code Highlight for development */
            wp_enqueue_style('vs2015', plugin_dir_url(__FILE__) . 'css/libs/vs2015.css', array(), $this->version, 'all');

            /* Feature icon css*/
            wp_enqueue_style('Feather-icon', plugin_dir_url(__FILE__) . 'fonts/feather/feather.css', array(), $this->version, 'all');
            wp_enqueue_style('PrimeIcon-icon', plugin_dir_url(__FILE__) . 'fonts/primeicons/primeicons.css', array(), $this->version, 'all');

            /* DatePicker css*/
            wp_enqueue_style('Datepicker-styles', plugin_dir_url(__FILE__) . 'css/libs/flatpickr.min.css', array(), $this->version, 'all');

            /* Quill css*/
            wp_enqueue_style('quill-styles', plugin_dir_url(__FILE__) . 'css/libs/quill.core.css', array(), $this->version, 'all');

            /* Quill theme css*/
            wp_enqueue_style('quill-theme-styles', plugin_dir_url(__FILE__) . 'css/libs/quill.snow.css', array(), $this->version, 'all');

            /* Selectize css*/
            wp_enqueue_style('select-styles', plugin_dir_url(__FILE__) . 'css/libs/selectize.default.css', array(), $this->version, 'all');

            /* Pickr Classic theme css*/
            wp_enqueue_style('Pickr-styles', plugin_dir_url(__FILE__) . 'css/libs/classic.min.css', array(), $this->version, 'all');

            /* Default styles css*/
            wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/webappick-tracker-admin.css', array(), $this->version, 'all');

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

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Webappick_Tracker_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Webappick_Tracker_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */
        if( isset($_REQUEST['page']) && ( 'webappick-tracker-react' == $_REQUEST['page'] || 'webappick-tracker' == $_REQUEST['page'] ) ) {
		/* Bootstrap JS */
		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/libs/bootstrap.bundle.min.js', array( 'jquery' ), $this->version, true );

        /* List JS*/
        wp_enqueue_script( 'list-js', plugin_dir_url( __FILE__ ) . 'js/libs/list.min.js', array( 'jquery' ), $this->version, true );

		/* Date Picker JS*/
		wp_enqueue_script( 'datepicker-js', plugin_dir_url( __FILE__ ) . 'js/libs/flatpickr.min.js', array( 'jquery' ), $this->version, true );

		/* Quill JS*/
		wp_enqueue_script( 'quill-js', plugin_dir_url( __FILE__ ) . 'js/libs/quill.min.js', array( 'jquery' ), $this->version, true );

		/* Mask JS*/
		wp_enqueue_script( 'mask-js', plugin_dir_url( __FILE__ ) . 'js/libs/jquery.mask.min.js', array( 'jquery' ), $this->version, true );

		/* Seletize JS*/
		wp_enqueue_script( 'seletize-js', plugin_dir_url( __FILE__ ) . 'js/libs/selectize.min.js', array( 'jquery' ), $this->version, true );

        /* Pickr JS*/
        wp_enqueue_script( 'pickr-js', plugin_dir_url( __FILE__ ) . 'js/libs/pickr.min.js', array( 'jquery' ), $this->version, true );

        /* Pickr es5 JS*/
        wp_enqueue_script( 'pickr-es5-js', plugin_dir_url( __FILE__ ) . 'js/libs/pickr.es5.min.js', array( 'jquery' ), $this->version, true );

        /* Pickr es5 JS*/
        wp_enqueue_script( 'highlight-js', plugin_dir_url( __FILE__ ) . 'js/libs/highlight.pack.min.js', array( 'jquery' ), $this->version, true );

		/* Default JS*/
		wp_enqueue_script( 'webappick-tracker-js', plugin_dir_url( __FILE__ ) . 'js/webappick-tracker-admin.js', array( 'jquery' ), $this->version, true );



        

        /* Load react js */
        wp_enqueue_script( 'webappick-tracker-react', plugin_dir_url( __FILE__ ) . 'js/webappick-tracker-react.js', array(  ), $this->version, true );
            wp_localize_script($this->plugin_name , 'wp_access', [
                'admin_url' => admin_url('/'),
                'ajax_url' => admin_url('admin-ajax.php'),
                 'api_url' => esc_url_raw( rest_url() ),
                'image_url' => WP_PLUGIN_URL.'/wp-accessories/admin/images',
                'plugin_url' => WP_PLUGIN_URL.'/wp-accessories',
                'nonce' => wp_create_nonce(WEBAPPICK_TRACKER_NONCE),
                'rest_nonce' => wp_create_nonce('wp_rest'),
                'server' => $_SERVER,
                'url' => $_SERVER['REQUEST_URI'],
                'post_types'=> get_post_types(),
            ]);
        
        }
        
        /**
         * Looad wp-speeh script
         *  */ 
        wp_enqueue_script('wpa-axios', 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js', array() , $this->version, true);

        wp_enqueue_script( 'wpa-speach', plugin_dir_url( __FILE__ ) . 'js/wp-accessories.js', array(  ), $this->version, true );



	}
    /**
     * Add Menu and Submenu page
     */

    public function webappick_tracker_menus_sections() {
        add_menu_page(
            __('WebAppick Tracker vue', 'webappick-tracker-react'),
            __('WebAppick Tracker vue', 'webappick-tracker-react'),
            'manage_options',
            'webappick-tracker-react',
            array($this, "webappick_tracker_vue_layout"),
            'dashicons-admin-settings',
            null
        );

        add_menu_page(
            __('WebAppick Tracker', 'webappick-Tracker'),
            __('WebAppick Tracker', 'webappick-tracker'),
            'manage_options',
            'webappick-tracker',
            array($this, "webappick_tracker_main_layout"),
            'dashicons-admin-settings',
            null
        );


    }

    /**
     * Webappick main menu page callback
     */
    public function webappick_tracker_main_layout() {
        include_once dirname(__FILE__) . '/partials/webappick-tracker-admin-display.php';
    }

    /**
     * Webappick main menu page callback
     */
    public function webappick_tracker_vue_layout() {
        echo "<div class='wpwrap'><div id='app'></div></div>";
    }

}
