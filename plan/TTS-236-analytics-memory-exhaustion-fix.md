# TTS-236: Analytics Memory Exhaustion Fix

## Background

**Reported by:** expose-news.com (6k–10k posts, active news site, ~50k+ analytics rows)

**Symptom:** HTTP 500 on admin requests. PHP fatal: `Allowed memory size of 805306368 bytes exhausted` (~768 MB).

**Crash path:** `TTA_Notices::__construct() → register_notices() → get_cached_total_plays() → query_total_plays()`

**Root cause:** `query_total_plays()` runs `SELECT analytics FROM wp_atlasvoice_analytics` and iterates every row in PHP to sum `$analytics['play']['count']`. The `analytics` column is `longtext` with PHP-serialized arrays (1–5 KB each). On large sites, loading the full column into PHP exhausts memory.

The same `SELECT *` + PHP-side aggregation pattern exists in `TTA_Dashboard_Widget::get_data()` and `AtlasVoice_Analytics::aggregated_insights()`. Notices crashed first; dashboard and analytics page will follow.

---

## Goals

1. Must work with existing users — no data loss, no breaking upgrades
2. No errors for existing users — migration runs in background, fallbacks prevent crashes during migration
3. Must not affect other plugins — all changes scoped to `TTA_*` classes and `tta_*` hooks
4. Ship all 3 phases in one release

---

## Phase 1 — Defensive Safety Net

### 1.1 — `query_total_plays()` row-count guard (`includes/TTA_Notices.php`)

- If `tta_total_plays_counter` option exists → return it (Phase 2 path)
- Otherwise check row count. If > 5000 (filterable) → return `tta_total_plays_fallback` and schedule background migration
- Only run the PHP scan on small tables

### 1.2 — Lazy `register_notices()` (`includes/TTA_Notices.php`)

- Move `register_notices()` out of `__construct()`
- Hook into `admin_init` priority 20
- Skip if `wp_doing_ajax() || wp_doing_cron() || REST_REQUEST` — notices only need to fire on HTML admin page loads
- Use `$notices_registered` flag to prevent double registration

### 1.3 — Skip when all notices dismissed (`includes/TTA_Notices.php`)

- `all_play_count_notices_dismissed()` — check review notice + all milestone IDs in `tta_milestones_reached`
- If all dismissed, short-circuit `get_cached_total_plays()` to return 0 (no query)
- Extend transient TTL from `HOUR_IN_SECONDS` to `DAY_IN_SECONDS`

### 1.4 — Same guard for dashboard widget (`admin/TTA_Dashboard_Widget.php`)

- Row-count check before the today-rows query
- Fallback: show placeholder text + link to full analytics page on large sites

---

## Phase 2 — Event-Driven Running Total

### 2.1 — Write-side counter (`api/AtlasVoice_Analytics.php`)

On every play write (insert or update):
- Compute delta = new count − old count
- Call `TTA_Helper::increment_total_plays_counter($delta)`

### 2.2 — Helper methods (`includes/TTA_Helper.php`)

```php
public static function increment_total_plays_counter( $delta )
public static function get_total_plays_counter()
public static function safe_large_query( $table, $callback, $fallback, $max_rows )
```

The increment uses direct SQL (`UPDATE ... SET option_value = CAST(option_value AS UNSIGNED) + %d`) for atomicity under concurrent writes. After update, invalidates the option cache and the notice transient.

### 2.3 — Chunked background migration (`includes/TTA_Activator.php`)

- `migrate_play_count_batch()` — reads 500 rows at a time via `WHERE id > $last_id ORDER BY id LIMIT 500`
- Stores `tta_play_count_migration_last_id` as cursor (resumes on failure)
- On each batch: unserialize analytics → extract play count → update `play_count` column + increment counter
- When done: reconciles counter with `SUM(play_count)`, sets `tta_play_count_migration_done = true`
- Schedules next batch via `wp_schedule_single_event` (30s delay)

### Cron registration (`text-to-audio.php`)

```php
add_action( 'tta_migrate_play_count_column', array( '\TTA\TTA_Activator', 'migrate_play_count_batch' ) );
```

---

## Phase 3 — Indexed Column + Query Rewrite

### 3.1 — Add `play_count` column via `dbDelta` (`includes/TTA_Activator.php`)

```sql
play_count int unsigned NOT NULL DEFAULT 0,
KEY idx_play_count (play_count)
```

`dbDelta` only adds missing columns — won't drop anything. Old rows default to 0 until migration populates them.

### 3.2 — Write the column on insert/update (`api/AtlasVoice_Analytics.php`)

Add `play_count` to `$wpdb->insert()` and `$wpdb->update()` arg arrays. Only if column exists (check via `play_count_column_exists()`).

### 3.3 — Rewrite `query_total_plays()` fallthrough chain

```
Counter (O(1)) → SUM(play_count) via index → guarded PHP scan → fallback option
```

### 3.4 — Rewrite dashboard widget (`admin/TTA_Dashboard_Widget.php`)

Replace `SELECT post_id, analytics FROM ... WHERE DATE(updated_at) = %s` with:
```sql
SELECT COALESCE(SUM(play_count), 0) FROM ... WHERE DATE(updated_at) = %s
SELECT post_id, SUM(play_count) AS t FROM ... GROUP BY post_id ORDER BY t DESC LIMIT 1
SELECT DATE(updated_at) AS day, SUM(play_count) AS plays FROM ... GROUP BY DATE(updated_at)
```

Keep `views_today` and `listen_seconds_today` via row-count-guarded fallback for now (out of scope for TTS-236).

### 3.5 — Audit `AtlasVoice_Analytics.php` for `SELECT *`

- `insights()` (line ~221) — add row limit + explicit columns
- `aggregated_insights()` (lines ~617, 620) — use `SUM(play_count)` where possible, `LIMIT` for raw rows

---

## Backward Compatibility Layers (Fail-Safe Fallthrough)

```
1. Counter (tta_total_plays_counter option)          ← O(1) read
   ↓ (if null)
2. SUM(play_count) via indexed column                 ← O(rows) DB-side
   ↓ (if column doesn't exist)
3. Row-count-guarded PHP scan                         ← only on small tables
   ↓ (if too big)
4. tta_total_plays_fallback (last known value)        ← always safe
```

Every path ends in a safe, non-crashing state.

---

## File Change Summary

| File | Phase | Change |
|------|-------|--------|
| `includes/TTA_Notices.php` | 1.1, 1.2, 1.3, 3.3 | Row-count guard, lazy registration, dismiss skip, column-based query |
| `includes/TTA_Helper.php` | 2.2, 3.6 | Counter helpers, `safe_large_query()` |
| `includes/TTA_Activator.php` | 2.3, 3.1 | Migration batch, column check, updated `CREATE TABLE` |
| `api/AtlasVoice_Analytics.php` | 2.1, 3.2, 3.5 | Counter increment, `play_count` writes, `SELECT *` audit |
| `admin/TTA_Dashboard_Widget.php` | 1.4, 3.4 | Guard + rewrite queries to `SUM(play_count) GROUP BY` |
| `text-to-audio.php` | 2.3 | Register cron hook, schedule on upgrade |

**New options:**
- `tta_total_plays_counter` (int)
- `tta_total_plays_fallback` (int)
- `tta_play_count_migration_last_id` (int)
- `tta_play_count_migration_done` (bool)

**New cron hook:** `tta_migrate_play_count_column`

**New filters:** `tta_total_plays_scan_row_limit` (default 5000), `tta_play_count_migration_batch_size` (default 500)

---

## Safety Analysis

| Concern | Mitigation |
|---------|-----------|
| Counter missing on upgrade | Falls through to column → guarded scan → fallback |
| Column missing on old tables | `play_count_column_exists()` check, falls through to scan |
| Migration not yet run | Phase 1 guard prevents scan crash; counter updates on each new play |
| `dbDelta` ALTER fails | Column check protects all SQL; system still works without it |
| Concurrent writes race condition | Direct SQL `UPDATE ... option_value + delta` is atomic in MySQL |
| Counter drifts from sum over time | Migration reconciles; Phase 1 fallback path recomputes if counter null |
| Plugin deactivated mid-migration | Cursor persisted in `wp_options`, resumes on reactivation |
| Table doesn't exist | `is_table_exists()` check first everywhere, returns 0 |

**What won't be affected:**
- `analytics` and `other_data` serialized columns untouched
- REST API response shape unchanged
- JS dashboard continues to query same endpoints
- Pro plugin benefits automatically from new column
- All options/hooks prefixed `tta_*`

---

## Browser Test Plan

**Base URL:** `http://localhost:6060/azizulhasan/tts/wp-admin/admin.php?page=text-to-audio`

### Test 1 — Upgrade path (no errors for existing users)
- Load admin page, confirm no 500/WSOD
- Check browser DevTools Network tab (all 200s)
- Check PHP error log for fatals/warnings

### Test 2 — Migration runs
- Trigger cron manually
- Confirm `tta_play_count_migration_last_id` advances
- Confirm `tta_play_count_migration_done` becomes true
- Confirm `tta_total_plays_counter == SUM(play_count)`

### Test 3 — New plays update counter
- Note counter value
- Play a post on front-end
- Counter should increase by 1 after the analytics POST

### Test 4 — Notice system still works
- Reset notices (delete `tta_milestones_reached`, user meta)
- Set counter to 500
- Reload admin page, expect `milestone_500` notice
- Dismiss, set counter to 1000, expect `milestone_1000`

### Test 5 — Row-count guard
- Filter `tta_total_plays_scan_row_limit` → 5
- Delete counter + column values + migration flag
- Reload admin page — expect no crash
- Cron schedules migration, counter populates

### Test 6 — Dashboard widget
- Visit main WP dashboard
- AtlasVoice widget shows correct plays today, 7-day chart
- Values match `SELECT SUM(play_count) ... WHERE DATE(updated_at) = CURDATE()`

### Test 7 — Analytics page
- Visit text-to-audio admin page → analytics tab
- Charts render, REST calls return 200, no console errors

### Test 8 — Other plugins unaffected
- WooCommerce admin pages load
- Other plugins' admin notices still render
- Front-end TTS button still works
- `wp cron test` passes

### Test 9 — Error log
- Tail `D:/xampp/php/logs/php_error_log` after running tests 1-8
- Expect no new fatals/warnings/notices

---

## Rollback Plan

1. **Soft disable:** `add_filter('pre_option_tta_total_plays_counter', '__return_null');` → forces fallthrough to Phase 1 guard
2. **Reset:** `wp option delete tta_total_plays_counter tta_total_plays_fallback tta_play_count_migration_last_id tta_play_count_migration_done`
3. **Full revert:** Revert the plugin version. The `play_count` column stays (harmless). New options are orphaned (harmless). Cron hook becomes dead letter (harmless).

**No data is lost in any rollback** — we never modify the existing `analytics` serialized column.

---

## Acceptance Criteria

- [ ] No memory exhaustion on sites with 100k+ analytics rows
- [ ] No crashes on admin page load after upgrade
- [ ] Existing milestone notices fire at correct thresholds
- [ ] Dashboard widget shows today's plays correctly
- [ ] Analytics dashboard page numbers match expectations
- [ ] No regressions in other plugins
- [ ] No new PHP errors/warnings
- [ ] Migration completes for 50k-row table within 10 minutes
- [ ] Counter is within ±1 of `SUM(play_count)` at all times
