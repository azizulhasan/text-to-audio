# Plugin Check Report

**Plugin:** Text To Speech TTS Accessibility
**Generated at:** 2026-05-21 16:57:24


## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\admin\TTA_Dashboard_Widget.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 185 | 5 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COALESCE(SUM(play_count), 0) FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 194 | 1 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at \t\t\t\t\t FROM {$table_name}\r\n |  | ✅ |
| 214 | 1 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at \t\t\t\t FROM {$table_name}\r\n |  | ✅ |
| 239 | 5 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 246 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT analytics FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 264 | 5 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 278 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT post_id, analytics FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 325 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT COUNT(*) FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |
| 332 | 7 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;SELECT analytics FROM {$table_name} WHERE DATE(updated_at) = %s&quot; |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\api\AtlasVoice_Analytics.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 100 | 4 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable $table_name at &quot;SELECT * FROM $table_name WHERE user_id = %s AND post_id = %d&quot; |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Activator.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 297 | 4 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SHOW COLUMNS FROM {$table} LIKE %s&quot; |  | ✅ |
| 360 | 4 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SELECT id, analytics FROM {$table} WHERE id &gt; %d AND play_count = 0 ORDER BY id ASC LIMIT %d&quot; |  | ✅ |
| 452 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table_name} at &quot;ALTER TABLE \`{$table_name}\` ADD INDEX \`{$index_name}\` (\`{$column_name}\`)&quot; |  | ✅ |
| 452 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$index_name} at &quot;ALTER TABLE \`{$table_name}\` ADD INDEX \`{$index_name}\` (\`{$column_name}\`)&quot; |  | ✅ |
| 452 | 6 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$column_name} at &quot;ALTER TABLE \`{$table_name}\` ADD INDEX \`{$index_name}\` (\`{$column_name}\`)&quot; |  | ✅ |
| 452 | 21 | WARNING | WordPress.DB.DirectDatabaseQuery.SchemaChange | Attempting a database schema change is discouraged. |  | ✅ |

## `D:\laragon\www\seven\wp-content\plugins\text-to-audio\includes\TTA_Helper.php`

| Line | Column | Type | Code | Message | Docs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1760 | 17 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable $table at &quot;DELETE FROM $table WHERE meta_key = %s&quot; |  | ✅ |
