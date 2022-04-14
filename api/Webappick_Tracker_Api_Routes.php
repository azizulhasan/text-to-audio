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
        $this->namespace = 'wps/'.$this->version;
        $this->rest_base  = '/accessories';
        $this->current_user = $current_user;
        add_action( 'rest_api_init', [$this, 'wps_accessories_register_routes'] );
    }

    /**
     * Register Routes
     */
    public function wps_accessories_register_routes() {
        // Register record route.
        register_rest_route(
            $this->namespace,
            $this->rest_base.'/record',
            array(
                array(
                    'methods'             => \WP_REST_Server::ALLMETHODS,
                    'callback'            => array( $this, 'wps_manage_record_data' ),
                    'permission_callback' => array( $this, 'get_route_access' ),
                    'args'                => array(),
                )
                
            )
        );
        // register listening route.
        register_rest_route(
            $this->namespace,
            $this->rest_base.'/listening',
            array(
                array(
                    'methods'             => \WP_REST_Server::ALLMETHODS,
                    'callback'            => array( $this, 'wps_manage_listening_data' ),
                    'permission_callback' => array( $this, 'get_route_access' ),
                    'args'                => array(),
                )
            )
        );

        // register customize route.
        register_rest_route(
            $this->namespace,
            $this->rest_base.'/customize',
            array(
                array(
                    'methods'             => \WP_REST_Server::ALLMETHODS,
                    'callback'            => array( $this, 'wps_manage_customize_data' ),
                    'permission_callback' => array( $this, 'get_route_access' ),
                    'args'                => array(),
                )
            )
        );

        // register settings route.
        register_rest_route(
            $this->namespace,
            $this->rest_base.'/settings',
            array(
                array(
                    'methods'             => \WP_REST_Server::ALLMETHODS,
                    'callback'            => array( $this, 'wps_manage_settings_data' ),
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
     * Manage record data.
     */
    public function wps_manage_record_data(  $request ) {
        // $retrieved_nonce = isset( $request['rest_nonce'] ) ? sanitize_text_field( wp_unslash( $request['rest_nonce'] ) ) : '';
        // if ( ! wp_verify_nonce( $retrieved_nonce, 'wp_rest' ) ) {
        //     die( 'Failed security check' );
        // }
        $response['status'] = true;
        // save data about recording.
	    if ( 'post' == $request['method'] ) {
		    $fields = json_decode($request['fields']);
            $listeningFields = get_option('wps_listening_settings');
            $listeningFields->wps__listening_lang = $fields->wps__recording__lang;
		    update_option('wps_record_settings', $fields);
            update_option('wps_listening_settings', $listeningFields);

            $response['data'] = get_option('wps_record_settings');

                
		    return rest_ensure_response( $response );
	    }
        
        // print_r(get_option('wps_listening_settings')->wps__listening_lang);

        $default_languages = array(
            'af' => 'Afrikaans',
            'ar' => 'العربية',
            'ary' => 'العربية المغربية',
            'as' => 'অসমীয়া',
            'azb' => 'گؤنئی آذربایجان',
            'az' => 'Azərbaycan dili',
            'bel' => 'Беларуская мова',
            'bg_BG' => 'Български',
            'bn_BD' => 'বাংলা',
            'bo' => 'བོད་ཡིག',
            'bs_BA' => 'Bosanski',
            'ca' => 'Català',
            'ceb' => 'Cebuano',
            'cs_CZ' => 'Čeština',
            'cy' => 'Cymraeg',
            'da_DK' => 'Dansk',
            'de_DE_formal' => 'Deutsch (Sie)',
            'de_DE' => 'Deutsch',
            'de_CH_informal' => 'Deutsch (Schweiz, Du)',
            'de_CH' => 'Deutsch (Schweiz)',
            'de_AT' => 'Deutsch (Österreich)',
            'dsb' => 'Dolnoserbšćina',
            'dzo' => 'རྫོང་ཁ',
            'el' => 'Ελληνικά',
            'en_CA' => 'English (Canada)',
            'en_NZ' => 'English (New Zealand)',
            'en_ZA' => 'English (South Africa)',
            'en_GB' => 'English (UK)',
            'en_AU' => 'English (Australia)',
            'eo' => 'Esperanto',
            'es_DO' => 'Español de República Dominicana',
            'es_CR' => 'Español de Costa Rica',
            'es_VE' => 'Español de Venezuela',
            'es_CO' => 'Español de Colombia',
            'es_CL' => 'Español de Chile',
            'es_UY' => 'Español de Uruguay',
            'es_PR' => 'Español de Puerto Rico',
            'es_ES' => 'Español',
            'es_GT' => 'Español de Guatemala',
            'es_PE' => 'Español de Perú',
            'es_MX' => 'Español de México',
            'es_EC' => 'Español de Ecuador',
            'es_AR' => 'Español de Argentina',
            'et' => 'Eesti',
            'eu' => 'Euskara',
            'fa_AF' => '(فارسی (افغانستان',
            'fa_IR' => 'فارسی',
            'fi' => 'Suomi',
            'fr_FR' => 'Français',
            'fr_CA' => 'Français du Canada',
            'fr_BE' => 'Français de Belgique',
            'fur' => 'Friulian',
            'gd' => 'Gàidhlig',
            'gl_ES' => 'Galego',
            'gu' => 'ગુજરાતી',
            'haz' => 'هزاره گی',
            'he_IL' => 'עִבְרִית',
            'hi_IN' => 'हिन्दी',
            'hr' => 'Hrvatski',
            'hsb' => 'Hornjoserbšćina',
            'hu_HU' => 'Magyar',
            'hy' => 'Հայերեն',
            'id_ID' => 'Bahasa Indonesia',
            'is_IS' => 'Íslenska',
            'it_IT' => 'Italiano',
            'ja' => '日本語',
            'jv_ID' => 'Basa Jawa',
            'ka_GE' => 'ქართული',
            'kab' => 'Taqbaylit',
            'kk' => 'Қазақ тілі',
            'km' => 'ភាសាខ្មែរ',
            'kn' => 'ಕನ್ನಡ',
            'ko_KR' => '한국어',
            'ckb' => 'كوردی‎',
            'lo' => 'ພາສາລາວ',
            'lt_LT' => 'Lietuvių kalba',
            'lv' => 'Latviešu valoda',
            'mk_MK' => 'Македонски јазик',
            'ml_IN' => 'മലയാളം',
            'mn' => 'Монгол',
            'mr' => 'मराठी',
            'ms_MY' => 'Bahasa Melayu',
            'my_MM' => 'ဗမာစာ',
            'nb_NO' => 'Norsk bokmål',
            'ne_NP' => 'नेपाली',
            'nl_NL_formal' => 'Nederlands (Formeel)',
            'nl_BE' => 'Nederlands (België)',
            'nl_NL' => 'Nederlands',
            'nn_NO' => 'Norsk nynorsk',
            'oci' => 'Occitan',
            'pa_IN' => 'ਪੰਜਾਬੀ',
            'pl_PL' => 'Polski',
            'ps' => 'پښتو',
            'pt_PT' => 'Português',
            'pt_PT_ao90' => 'Português (AO90)',
            'pt_AO' => 'Português de Angola',
            'pt_BR' => 'Português do Brasil',
            'rhg' => 'Ruáinga',
            'ro_RO' => 'Română',
            'ru_RU' => 'Русский',
            'sah' => 'Сахалыы',
            'snd' => 'سنڌي',
            'si_LK' => 'සිංහල',
            'sk_SK' => 'Slovenčina',
            'skr' => 'سرائیکی',
            'sl_SI' => 'Slovenščina',
            'sq' => 'Shqip',
            'sr_RS' => 'Српски језик',
            'sv_SE' => 'Svenska',
            'sw' => 'Kiswahili',
            'szl' => 'Ślōnskŏ gŏdka',
            'ta_IN' => 'தமிழ்',
            'ta_LK' => 'தமிழ்',
            'te' => 'తెలుగు',
            'th' => 'ไทย',
            'tl' => 'Tagalog',
            'tr_TR' => 'Türkçe',
            'tt_RU' => 'Татар теле',
            'tah' => 'Reo Tahiti',
            'ug_CN' => 'ئۇيغۇرچە',
            'uk' => 'Українська',
            'ur' => 'اردو',
            'uz_UZ' => 'O‘zbekcha',
            'vi' => 'Tiếng Việt',
            'zh_TW' => '繁體中文',
            'zh_HK' => '香港中文版	',
            'zh_CN' => '简体中文',
        );


        // get data about recording.
	    if ( 'get' == $request['method'] ) {

            $response['data'] = get_option('wps_record_settings');
		    return rest_ensure_response( $response );
	    }



    }

    /*
     * Manage listening data
     */
    public function wps_manage_listening_data($request){
        $response['status'] = true;
        // save data about recording.
	    if ( 'post' == $request['method'] ) {
		    $fields = json_decode($request['fields']);
            
		    update_option('wps_listening_settings', $fields);

            $response['data'] = get_option('wps_listening_settings');

		    return rest_ensure_response( $response );
	    }

        // get data about recording.
	    if ( 'get' == $request['method'] ) {

            $response['data'] = get_option('wps_listening_settings');
		    return rest_ensure_response( $response );
	    }
    }

        /*
     * Manage customize data
     */
    public function wps_manage_customize_data($request){
        $response['status'] = true;
        // save data about recording.
	    if ( 'post' == $request['method'] ) {
		    $fields = json_decode($request['fields']);
            
		    update_option('wps_customize_settings', $fields);

            $response['data'] = get_option('wps_customize_settings');

		    return rest_ensure_response( $response );
	    }

        // get data about recording.
	    if ( 'get' == $request['method'] ) {

            $response['data'] = get_option('wps_customize_settings');
		    return rest_ensure_response( $response );
	    }
    }

    /*
     * Manage settings data
     */
    public function wps_manage_settings_data($request){
        $response['status'] = true;
        // save data about recording.
	    if ( 'post' == $request['method'] ) {
		    $fields = json_decode($request['fields']);
            
		    update_option('wps_settings_data', $fields);

            $response['data'] = get_option('wps_settings_data');

		    return rest_ensure_response( $response );
	    }

        // get data about recording.
	    if ( 'get' == $request['method'] ) {

            $response['data'] = get_option('wps_settings_data');
		    return rest_ensure_response( $response );
	    }
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
