# Plugin Check Report

**Plugin:** Text To Speech TTS Accessibility
**Generated at:** 2026-05-21 16:27:45


## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\admin\TTA_Admin.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 238 | 23 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 238 | 66 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 239 | 23 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 239 | 57 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 326 | 33 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 326 | 75 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 367 | 49 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 367 | 91 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 393 | 9 | WARNING | WordPress.WP.EnqueuedResourceParameters.NotInFooter | In footer ($in_footer) is not set explicitly wp_register_script; It is recommended to load scripts in the footer. Please set this value to \`true\` to load it in the footer, or explicitly \`false\` if it should be loaded in the header. |  | ✅ |
| 497 | 24 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 497 | 46 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 520 | 20 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 540 | 33 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 540 | 63 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 832 | 20 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 832 | 42 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\admin\TTA_Dashboard_Widget.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 183 | 32 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_var() |  | ✅ |
| 183 | 34 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 183 | 34 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 184 | 5 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COALESCE(SUM(play_count), 0) FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 190 | 19 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_row() |  | ✅ |
| 190 | 24 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 190 | 24 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 192 | 1 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at \t\t\t\t\t FROM {$table_name}\r\n |  | ✅ |
| 209 | 26 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_results() |  | ✅ |
| 209 | 28 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 209 | 28 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 211 | 1 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at \t\t\t\t FROM {$table_name}\r\n |  | ✅ |
| 234 | 36 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_var() |  | ✅ |
| 234 | 38 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 234 | 38 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 235 | 5 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 240 | 26 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_results() |  | ✅ |
| 240 | 31 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 240 | 31 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 241 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT analytics FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 257 | 36 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_var() |  | ✅ |
| 257 | 38 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 257 | 38 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 258 | 5 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 270 | 26 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_results() |  | ✅ |
| 270 | 31 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 270 | 31 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 271 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT post_id, analytics FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 316 | 35 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_var() |  | ✅ |
| 316 | 40 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 316 | 40 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 317 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 322 | 25 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_results() |  | ✅ |
| 322 | 33 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 322 | 33 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 323 | 7 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT analytics FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\admin\TTA_Posts_List.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 183 | 33 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 183 | 83 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 183 | 83 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_GET[&#039;atlasvoice_filter&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 221 | 20 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 221 | 57 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 225 | 39 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 225 | 39 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_GET[&#039;atlasvoice_filter&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 302 | 20 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 302 | 57 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 306 | 39 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 306 | 39 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_GET[&#039;atlasvoice_filter&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\api\AtlasVoice_Analytics.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 98 | 27 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 98 | 27 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 98 | 28 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_row()\n$table_name assigned unsafely at line 95. |  | ✅ |
| 99 | 4 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable $table_name at &quot;SELECT * FROM $table_name WHERE user_id = %s AND post_id = %d&quot; |  | ✅ |
| 146 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 146 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 186 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 299 | 28 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $prepared_query used in $wpdb-&gt;get_results()\n$prepared_query assigned unsafely at line 297. |  | ✅ |
| 322 | 23 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 322 | 23 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 322 | 24 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_results()\n$table_name assigned unsafely at line 321. |  | ✅ |
| 322 | 37 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable $table_name at &quot;SELECT * FROM $table_name&quot; |  | ✅ |
| 725 | 31 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $query used in $wpdb-&gt;get_results()\n$query assigned unsafely at line 723. |  | ✅ |
| 728 | 31 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_results()\n$table_name assigned unsafely at line 689. |  | ✅ |
| 747 | 40 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $prev_query used in $wpdb-&gt;get_results()\n$prev_query assigned unsafely at line 745. |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Activator.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 253 | 11 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;query() |  | ✅ |
| 253 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 253 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 253 | 18 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable $table_name at &quot;ALTER TABLE $table_name ADD COLUMN play_count INT UNSIGNED NOT NULL DEFAULT 0&quot; |  | ✅ |
| 253 | 27 | WARNING | WordPress.DB.DirectDatabaseQuery.SchemaChange | Attempting a database schema change is discouraged. |  | ✅ |
| 254 | 11 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;query() |  | ✅ |
| 254 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 254 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 254 | 18 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable $table_name at &quot;ALTER TABLE $table_name ADD INDEX idx_play_count (play_count)&quot; |  | ✅ |
| 254 | 27 | WARNING | WordPress.DB.DirectDatabaseQuery.SchemaChange | Attempting a database schema change is discouraged. |  | ✅ |
| 293 | 19 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 293 | 19 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 293 | 20 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table used in $wpdb-&gt;get_results()\n$table assigned unsafely at line 280. |  | ✅ |
| 294 | 4 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SHOW COLUMNS FROM {$table} LIKE %s&quot; |  | ✅ |
| 328 | 31 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table used in $wpdb-&gt;get_var()\n$table assigned unsafely at line 314. |  | ✅ |
| 328 | 36 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 328 | 36 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 328 | 40 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SELECT COUNT(*) FROM {$table}&quot; |  | ✅ |
| 331 | 22 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table used in $wpdb-&gt;get_col()\n$table assigned unsafely at line 314. |  | ✅ |
| 331 | 30 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 331 | 30 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 331 | 31 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SELECT analytics FROM {$table}&quot; |  | ✅ |
| 353 | 17 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 353 | 17 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 353 | 18 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table used in $wpdb-&gt;get_results()\n$table assigned unsafely at line 314. |  | ✅ |
| 354 | 4 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SELECT id, analytics FROM {$table} WHERE id &gt; %d AND play_count = 0 ORDER BY id ASC LIMIT %d&quot; |  | ✅ |
| 361 | 26 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table used in $wpdb-&gt;get_var()\n$table assigned unsafely at line 314. |  | ✅ |
| 361 | 28 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 361 | 28 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 361 | 35 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SELECT COALESCE(SUM(play_count), 0) FROM {$table}&quot; |  | ✅ |
| 378 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 378 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 426 | 29 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 426 | 29 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 426 | 30 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_results()\n$table_name assigned unsafely at line 413. |  | ✅ |
| 426 | 43 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SHOW INDEX FROM \`{$table_name}\`&quot; |  | ✅ |
| 441 | 12 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;query()\n$table_name assigned unsafely at line 413. |  | ✅ |
| 441 | 17 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 441 | 17 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 442 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;ALTER TABLE \`{$table_name}\` ADD INDEX \`{$index_name}\` (\`{$column_name}\`)&quot; |  | ✅ |
| 442 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$index_name} at &quot;ALTER TABLE \`{$table_name}\` ADD INDEX \`{$index_name}\` (\`{$column_name}\`)&quot; |  | ✅ |
| 442 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$column_name} at &quot;ALTER TABLE \`{$table_name}\` ADD INDEX \`{$index_name}\` (\`{$column_name}\`)&quot; |  | ✅ |
| 442 | 21 | WARNING | WordPress.DB.DirectDatabaseQuery.SchemaChange | Attempting a database schema change is discouraged. |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Helper.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 47 | 19 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 47 | 19 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 58 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 110 | 24 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 110 | 24 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 110 | 31 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table used in $wpdb-&gt;get_var() |  | ✅ |
| 110 | 40 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SELECT COUNT(*) FROM {$table}&quot; |  | ✅ |
| 1754 | 20 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 1754 | 20 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 1756 | 17 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable $table at &quot;DELETE FROM $table WHERE meta_key = %s&quot; |  | ✅ |
| 1817 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.InputNotValidated | Detected usage of a possibly undefined superglobal array index: $_SERVER[&#039;HTTP_USER_AGENT&#039;]. Check that the array index exists before using it. |  | ✅ |
| 1817 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;HTTP_USER_AGENT&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 1817 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.InputNotSanitized | Detected usage of a non-sanitized input variable: $_SERVER[&#039;HTTP_USER_AGENT&#039;] |  | ✅ |
| 1846 | 23 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[$key] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 1846 | 23 | WARNING | WordPress.Security.ValidatedSanitizedInput.InputNotSanitized | Detected usage of a non-sanitized input variable: $_SERVER[$key] |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Notices.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1453 | 25 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 1453 | 25 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 1471 | 26 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_var()\n$table_name assigned unsafely at line 1450. |  | ✅ |
| 1471 | 28 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 1471 | 28 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 1471 | 35 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COALESCE(SUM(play_count), 0) FROM {$table_name}&quot; |  | ✅ |
| 1480 | 28 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 1480 | 28 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 1480 | 29 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_var()\n$table_name assigned unsafely at line 1450. |  | ✅ |
| 1480 | 38 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COUNT(*) FROM {$table_name}&quot; |  | ✅ |
| 1493 | 18 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 1493 | 18 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 1493 | 19 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;get_col()\n$table_name assigned unsafely at line 1450. |  | ✅ |
| 1493 | 28 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT analytics FROM {$table_name}&quot; |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Reset.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 76 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 76 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 77 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 77 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 81 | 16 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table_name used in $wpdb-&gt;query()\n$table_name assigned unsafely at line 80. |  | ✅ |
| 81 | 23 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;DROP TABLE IF EXISTS {$table_name}&quot; |  | ✅ |
| 90 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 90 | 13 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 97 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 97 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 98 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 98 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |
| 99 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  | ✅ |
| 99 | 9 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\libs\AtlasAiDev\Insights.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 594 | 136 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;SERVER_SOFTWARE&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 823 | 115 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;reason_id&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 824 | 90 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;reason_info&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 835 | 83 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;SERVER_SOFTWARE&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 874 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;name&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 875 | 30 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;email&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 876 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;subject&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 877 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;website&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 878 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;message&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 885 | 27 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;name&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 886 | 22 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;email&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 890 | 27 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;name&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 891 | 27 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;email&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 909 | 68 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;subject&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 1434 | 29 | WARNING | WordPress.Security.ValidatedSanitizedInput.InputNotValidated | Detected usage of a possibly undefined superglobal array index: $_SERVER[&#039;REQUEST_URI&#039;]. Check that the array index exists before using it. |  | ✅ |
| 1434 | 29 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;REQUEST_URI&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 1434 | 29 | WARNING | WordPress.Security.ValidatedSanitizedInput.InputNotSanitized | Detected usage of a non-sanitized input variable: $_SERVER[&#039;REQUEST_URI&#039;] |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\libs\AtlasAiDev\Promotions.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 356 | 43 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;_wpnonce&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |
| 358 | 91 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_REQUEST[&#039;hash&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\text-to-audio.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 316 | 17 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 316 | 56 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 317 | 19 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 317 | 58 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |
| 330 | 20 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  | ✅ |

## `README.txt`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | WARNING | readme_parser_warnings_trimmed_section_description | The "Description" section is too long and was truncated. A maximum of 2500 characters is supported. |  | ✅ |
