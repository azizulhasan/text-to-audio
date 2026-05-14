# Plan: Smart Review Prompt + Fix Email Schedule + Move Email to Pro

## Context

Three tasks:
1. **Review Prompt**: Re-enable commented-out review notice in `TTA_Notices.php` (lines 339-380) with smart triggers — free users only, timing based on usage milestones. Existing users included.
2. **Email Schedule Bug**: Scheduled emails (daily/weekly/monthly) not firing. Timezone mismatch in `calculate_next_run_time()` — uses local time but `wp_schedule_event()` expects UTC. Test emails work fine.
3. **Move Email Sending to Pro**: `send_test_report`, `generate_and_send_report`, `build_report_email` and helpers are Pro features but currently in free plugin. Move to Pro; keep settings/schedule storage in free.

---

## Task 1: Smart Review Prompt (Free Plugin Only)

### Rules
- **Never show to Pro users** — `TTA_Helper::is_pro_active()` must be `false`
- **Per-admin tracking** — Each admin user sees/dismisses independently via `user_meta` (not site-wide `options`). The existing notice system already handles this with `tta_dismiss_{notice_id}` user meta.
- **4 buttons**: ⭐ Leave a Review / Remind Me Later / Already Done / Never Ask Again
- **Never re-ask** if "Already Done" or "Never Ask Again" clicked (stored in `user_meta`)
- **Remind Me Later** → re-show after 14 days (stored in `user_meta` via `tta_reshow_review`)

### Trigger Conditions (ALL must be true)
1. Current user is admin (`manage_options` capability)
2. Pro plugin is NOT active
3. Plugin activated **7+ days ago** (site-wide option: `tta_activated_at`)
4. At least one: wizard completed OR plugin active 14+ days (existing users)
5. Total plays ≥ 10 (reuse existing `get_cached_total_plays()`)
6. Current admin hasn't permanently dismissed (per-user `user_meta`)

### Files to Modify

#### `text-to-audio/includes/TTA_Activator.php`
- In `activate()`, store activation timestamp (only on first activation):
  ```php
  if ( ! get_option( 'tta_activated_at' ) ) {
      update_option( 'tta_activated_at', time(), false );
  }
  ```

#### `text-to-audio/includes/TTA_Notices.php` → `register_notices()`
- Uncomment review notice block (lines 339-380)
- Add `condition` callback checking all 4 trigger conditions
- Update message to be milestone-based with dynamic play count
- Change `reshow_after_days` from 30 → 14
- Backfill: if `tta_activated_at` missing but `tta_has_been_activated_before` is true, set to 30 days ago

---

## Task 2: Fix Email Schedule Cron (Timezone Bug)

### Root Cause
`calculate_next_run_time()` line 1524 in `AtlasVoice_Analytics.php`:
```php
$now = current_time( 'timestamp' );  // LOCAL time
$next_run = strtotime( "today {$hour}:{$minute}", $now );  // LOCAL timestamp
wp_schedule_event( $next_run, ... );  // Expects UTC!
```

### Fix
Replace with `DateTime` + `wp_timezone()` for proper DST-safe UTC conversion:
```php
$tz = wp_timezone();
$dt = new \DateTime( "today {$hour}:{$minute}", $tz );
// $dt->getTimestamp() returns UTC automatically
```

### File: `text-to-audio/api/AtlasVoice_Analytics.php` → `calculate_next_run_time()`

---

## Task 3: Move Email Sending to Pro Plugin

### What Stays in Free Plugin
| Function | File | Reason |
|---|---|---|
| `save_schedule_report()` | `AtlasVoice_Analytics.php` | Settings storage |
| `get_schedule_report()` | `AtlasVoice_Analytics.php` | Read settings for UI |
| `schedule_report_cron()` | `AtlasVoice_Analytics.php` | WP-Cron scheduling |
| `calculate_next_run_time()` | `AtlasVoice_Analytics.php` | Used by scheduler |
| Cron schedules filter | `text-to-audio.php` | Weekly/monthly intervals |

### What Moves to Pro Plugin
| Function | Reason |
|---|---|
| `send_test_report()` | Email sending = Pro |
| `generate_and_send_report()` | Email sending = Pro |
| `build_report_email()` | Email template = Pro |
| `aggregate_analytics_data()` | Only used by email |
| `check_email_capability()` | Only used by email |
| `calculate_date_range()` | Only used by email |

### New Pro File: `text-to-audio-pro/Includes/TTA_Pro_Report_Email.php`
- Namespace: `TTA_Pro` (auto-loaded via PSR-4: `TTA_Pro\ → Includes/`)
- Contains all moved methods
- Constructor receives analytics data from free plugin's DB table

### Changes to Free Plugin

#### `text-to-audio/api/AtlasVoice_Analytics.php`
- Remove: `send_test_report()`, `generate_and_send_report()`, `build_report_email()`, `aggregate_analytics_data()`, `check_email_capability()`, `calculate_date_range()`
- Keep: `save_schedule_report()`, `get_schedule_report()`, `schedule_report_cron()`, `calculate_next_run_time()`

#### `text-to-audio/api/TTA_Api_Routes.php`
- Remove `send_test_report` route registration (lines 411-423)
- Remove from nonce-exempt list (line 922)

#### `text-to-audio/text-to-audio.php` (line 446)
- Update cron hook to call Pro class:
  ```php
  add_action('tta_send_scheduled_report', function () {
      if ( class_exists('TTA_Pro\\TTA_Pro_Report_Email') ) {
          $reporter = new \TTA_Pro\TTA_Pro_Report_Email();
          $reporter->generate_and_send_report();
      }
  });
  ```

### Changes to Pro Plugin

#### `text-to-audio-pro/Includes/TTA_Pro_Report_Email.php` (NEW)
- All email sending methods moved here
- Public method: `generate_and_send_report( $settings = null, $is_test = false )`
- Public method: `send_test_report( $request )` (REST callback)

#### `text-to-audio-pro/Api/TTA_Pro_Api_Routes.php`
- Add route: `POST tta_pro/v1/send_test_report` → admin-only permission
- Add to admin routes list in `get_route_access()`

#### `text-to-audio/src/dashboard/components/dashboard/analitics/ExportSection.js`
- Update test email API URL: `tta/v1/send_test_report` → `tta_pro/v1/send_test_report`

---

## Implementation Order
1. `TTA_Activator.php` — add `tta_activated_at`
2. `TTA_Notices.php` — uncomment + upgrade review notice with smart conditions
3. `AtlasVoice_Analytics.php` — fix timezone in `calculate_next_run_time()`
4. Create `TTA_Pro_Report_Email.php` — move email methods from free
5. Update free plugin: remove email methods, update cron hook, remove route
6. Update Pro routes: add `send_test_report`
7. Update `ExportSection.js` — change API URL
8. Build free: `npx mix --production`
9. Build pro: `npx mix --production`
10. Test all scenarios

## Verification

### Review Prompt Testing
1. **Free user, 8+ days, 10+ plays, wizard done** → notice appears ✅
2. **Pro active** → notice never appears ❌
3. **Fresh install (< 7 days)** → no notice ❌
4. **0 plays** → no notice ❌
5. **"Already Done" clicked** → never shows again
6. **"Remind Later" clicked** → shows after 14 days
7. **Existing user (no wizard, 15+ days, 10+ plays)** → notice appears ✅

### Email Schedule Testing
1. Set daily schedule → verify `wp_next_scheduled()` returns correct UTC
2. Manually trigger cron → verify email sent via Pro class
3. Test with different WP timezone settings

### Email Architecture Testing
1. Pro active + test email via `tta_pro/v1/send_test_report` → works ✅
2. Pro deactivated → test email route not available ✅
3. Scheduled cron with Pro → sends email ✅
4. Scheduled cron without Pro → silently skips (`class_exists` check) ✅

---

## Browser Testing Plan

### Email Testing (via browser at localhost:6060)
1. Navigate to plugin dashboard → Analytics → Export/Schedule section
2. Set recipient: `atlasaidev@gmail.com`
3. **Test email**: Click "Send Test Report" → verify email arrives in Gmail inbox (https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox)
4. **Scheduled email**: Set daily schedule at a time ~2 minutes from now → wait for cron to fire → verify email arrives in Gmail
5. Verify both test and scheduled emails are sent via Pro plugin routes

### Review Prompt Testing (via browser at localhost:6060)
Test all scenarios by manipulating WP options directly:
1. **Scenario: All conditions met** — Set `tta_activated_at` to 8 days ago, ensure `tta_onboarding_completed` = true, ensure ≥10 plays, deactivate Pro → reload admin → verify review notice appears
2. **Scenario: Pro active** — Activate Pro plugin → reload admin → verify NO review notice
3. **Scenario: Fresh install** — Set `tta_activated_at` to now → reload → verify NO notice
4. **Scenario: Zero plays** — Clear analytics → reload → verify NO notice
5. **Scenario: Click "Leave a Review"** — Click button → verify redirect to wordpress.org review page → verify notice doesn't reappear
6. **Scenario: Click "Remind Me Later"** — Click → verify notice dismissed → set `tta_reshow_review` to past → reload → verify notice reappears
7. **Scenario: Click "Never Ask Again"** — Click → verify notice permanently gone
