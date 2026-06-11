# Plugin Check Report

**Plugin:** Text To Speech TTS Accessibility
**Generated at:** 2026-05-21 16:01:27


## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\admin\TTA_Admin.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 521 | 171 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$url'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 1198 | 45 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$docs_url'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 1204 | 45 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$compat_url'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 1210 | 45 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$integrations_url'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\api\AtlasVoice_Analytics.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 292 | 37 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |
| 293 | 28 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $prepared_query used in $wpdb->get_results()\n$prepared_query assigned unsafely at line 292. |  | ✅ |
| 293 | 41 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $prepared_query |  | ✅ |
| 715 | 31 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $query used in $wpdb->get_results()\n$query assigned unsafely at line 714. |  | ✅ |
| 715 | 60 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |
| 735 | 40 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $prev_query used in $wpdb->get_results()\n$prev_query assigned unsafely at line 734. |  | ✅ |
| 735 | 69 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $prev_query |  | ✅ |
| 776 | 25 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 777 | 25 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 780 | 25 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 783 | 25 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 786 | 25 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 790 | 29 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 793 | 27 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 798 | 25 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 801 | 29 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 829 | 28 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 830 | 28 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 920 | 25 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 921 | 25 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 1060 | 31 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $query used in $wpdb->get_results()\n$query assigned unsafely at line 1059. |  | ✅ |
| 1060 | 60 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |
| 1147 | 31 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $query used in $wpdb->get_results()\n$query assigned unsafely at line 1146. |  | ✅ |
| 1147 | 60 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |
| 1169 | 28 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 1170 | 36 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 1241 | 31 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $query used in $wpdb->get_results()\n$query assigned unsafely at line 1240. |  | ✅ |
| 1241 | 60 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |
| 1308 | 52 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 1504 | 45 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 1712 | 115 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$post['total_plays']'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 1825 | 31 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $query used in $wpdb->get_results()\n$query assigned unsafely at line 1824. |  | ✅ |
| 1825 | 60 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |
| 1841 | 55 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 1903 | 118 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found 'date'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 1903 | 118 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 2191 | 31 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $query used in $wpdb->get_results()\n$query assigned unsafely at line 2190. |  | ✅ |
| 2191 | 60 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\helpers.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 435 | 48 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$player_number'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 436 | 45 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$player_number'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 437 | 45 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found 'apply_filters'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 439 | 39 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$class'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 440 | 39 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$btn_style'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 442 | 41 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$custom_css'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 443 | 48 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$should_display_icon'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 444 | 39 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$content_read_time'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 445 | 34 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$post'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 448 | 42 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$use_old_player'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 475 | 32 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$title'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 476 | 36 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$file_name'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 477 | 31 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$date'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 478 | 35 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$language'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 479 | 32 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$voice'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 480 | 39 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$file_url_key'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 482 | 34 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$excerpt_sanitized'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 483 | 46 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found 'apply_filters'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 484 | 45 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found 'apply_filters'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 490 | 54 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found 'get_player_id'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 497 | 54 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found 'get_player_id'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |
| 1043 | 13 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Error_Handler.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 24 | 19 | ERROR | WordPress.WP.AlternativeFunctions.file_system_operations_fopen | File operations should use WP_Filesystem methods instead of direct PHP filesystem calls. Found: fopen(). |  | ✅ |
| 26 | 65 | ERROR | WordPress.Security.EscapeOutput.ExceptionNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$this'. | [Docs](https://developer.wordpress.org/apis/security/escaping/) | ✅ |
| 44 | 5 | ERROR | WordPress.WP.AlternativeFunctions.file_system_operations_mkdir | File operations should use WP_Filesystem methods instead of direct PHP filesystem calls. Found: mkdir(). |  | ✅ |
| 48 | 14 | ERROR | WordPress.WP.AlternativeFunctions.file_system_operations_fopen | File operations should use WP_Filesystem methods instead of direct PHP filesystem calls. Found: fopen(). |  | ✅ |
| 50 | 5 | ERROR | WordPress.WP.AlternativeFunctions.file_system_operations_fclose | File operations should use WP_Filesystem methods instead of direct PHP filesystem calls. Found: fclose(). |  | ✅ |
| 52 | 71 | ERROR | WordPress.Security.EscapeOutput.ExceptionNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$this'. | [Docs](https://developer.wordpress.org/apis/security/escaping/) | ✅ |
| 66 | 4 | ERROR | WordPress.WP.AlternativeFunctions.file_system_operations_fwrite | File operations should use WP_Filesystem methods instead of direct PHP filesystem calls. Found: fwrite(). |  | ✅ |
| 66 | 27 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 75 | 4 | ERROR | WordPress.WP.AlternativeFunctions.file_system_operations_fclose | File operations should use WP_Filesystem methods instead of direct PHP filesystem calls. Found: fclose(). |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Helper.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 886 | 13 | ERROR | WordPress.WP.AlternativeFunctions.file_system_operations_is_writable | File operations should use WP_Filesystem methods instead of direct PHP filesystem calls. Found: is_writable(). |  | ✅ |
| 958 | 19 | ERROR | WordPress.WP.AlternativeFunctions.curl_curl_init | Using cURL functions is highly discouraged. Use wp_remote_get() instead. |  | ✅ |
| 959 | 13 | ERROR | WordPress.WP.AlternativeFunctions.curl_curl_setopt | Using cURL functions is highly discouraged. Use wp_remote_get() instead. |  | ✅ |
| 960 | 13 | ERROR | WordPress.WP.AlternativeFunctions.curl_curl_setopt | Using cURL functions is highly discouraged. Use wp_remote_get() instead. |  | ✅ |
| 961 | 13 | ERROR | WordPress.WP.AlternativeFunctions.curl_curl_setopt | Using cURL functions is highly discouraged. Use wp_remote_get() instead. |  | ✅ |
| 962 | 13 | ERROR | WordPress.WP.AlternativeFunctions.curl_curl_setopt | Using cURL functions is highly discouraged. Use wp_remote_get() instead. |  | ✅ |
| 963 | 29 | ERROR | WordPress.WP.AlternativeFunctions.curl_curl_exec | Using cURL functions is highly discouraged. Use wp_remote_get() instead. |  | ✅ |
| 964 | 13 | ERROR | WordPress.WP.AlternativeFunctions.curl_curl_close | Using cURL functions is highly discouraged. Use wp_remote_get() instead. |  | ✅ |
| 986 | 26 | ERROR | WordPress.WP.AlternativeFunctions.parse_url_parse_url | parse_url() is discouraged because of inconsistency in the output across PHP versions; use wp_parse_url() instead. |  | ✅ |
| 1705 | 17 | ERROR | WordPress.DateTime.RestrictedFunctions.date_date | date() is affected by runtime timezone changes which can cause date/time to be incorrectly displayed. Use gmdate() instead. |  | ✅ |
| 2001 | 14 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$schema_markup'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\libs\AtlasAiDev\Insights.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 480 | 18 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$notice'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\admin\TTA_Dashboard_Widget.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 363 | 26 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Activator.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 455 | 26 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $query |  | ✅ |

## `admin/TTA_Admin.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | missing_direct_file_access_protection | PHP file should prevent direct access. Add a check like: if ( ! defined( 'ABSPATH' ) ) exit; | [Docs](https://developer.wordpress.org/plugins/wordpress-org/common-issues/#direct-file-access) | ✅ |

## `admin/TTA_Dashboard_Widget.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | missing_direct_file_access_protection | PHP file should prevent direct access. Add a check like: if ( ! defined( 'ABSPATH' ) ) exit; | [Docs](https://developer.wordpress.org/plugins/wordpress-org/common-issues/#direct-file-access) | ✅ |

## `admin/TTA_Posts_List.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | missing_direct_file_access_protection | PHP file should prevent direct access. Add a check like: if ( ! defined( 'ABSPATH' ) ) exit; | [Docs](https://developer.wordpress.org/plugins/wordpress-org/common-issues/#direct-file-access) | ✅ |

## `api/TTA_Api_Routes.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | missing_direct_file_access_protection | PHP file should prevent direct access. Add a check like: if ( ! defined( 'ABSPATH' ) ) exit; | [Docs](https://developer.wordpress.org/plugins/wordpress-org/common-issues/#direct-file-access) | ✅ |

## `includes/TTA.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | missing_direct_file_access_protection | PHP file should prevent direct access. Add a check like: if ( ! defined( 'ABSPATH' ) ) exit; | [Docs](https://developer.wordpress.org/plugins/wordpress-org/common-issues/#direct-file-access) | ✅ |

## `includes/TTA_Hooks.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | missing_direct_file_access_protection | PHP file should prevent direct access. Add a check like: if ( ! defined( 'ABSPATH' ) ) exit; | [Docs](https://developer.wordpress.org/plugins/wordpress-org/common-issues/#direct-file-access) | ✅ |

## `includes/TTA_Lib_AtlasAiDev.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | missing_direct_file_access_protection | PHP file should prevent direct access. Add a check like: if ( ! defined( 'ABSPATH' ) ) exit; | [Docs](https://developer.wordpress.org/plugins/wordpress-org/common-issues/#direct-file-access) | ✅ |

## `includes/TTA_Loader.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | missing_direct_file_access_protection | PHP file should prevent direct access. Add a check like: if ( ! defined( 'ABSPATH' ) ) exit; | [Docs](https://developer.wordpress.org/plugins/wordpress-org/common-issues/#direct-file-access) | ✅ |
