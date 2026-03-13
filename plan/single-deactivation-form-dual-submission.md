# Plan: Single Deactivation Form with Dual Submission

## Context

The AtlasAiDev library and Freemius SDK both show deactivation feedback modals, creating a confusing multi-modal experience. We want ONE deactivation form (AtlasAiDev's) that sends data to BOTH trackers (AtlasAiDev + Freemius).

## UX Flow

```
Deactivate click
  → Rescue Modal (custom)
  → "Continue to Deactivate"
  → AtlasAiDev Modal:
      ┌─────────────────────────────────────────┐
      │ If you have a moment, please let us      │
      │ know why you are deactivating:           │
      │                                          │
      │ ┌──────────────────────────────────────┐ │
      │ │ Having trouble? Get help before you  │ │
      │ │ go.              [Open Support Ticket]│ │
      │ └──────────────────────────────────────┘ │
      │                                          │
      │ ○ I couldn't understand how to...        │
      │ ○ I found a better plugin                │
      │ ○ The plugin is great, but need feature  │
      │ ○ The plugin is not working              │
      │ ○ It's not what I was looking for        │
      │ ○ The plugin didn't work as expected     │
      │ ○ Temporary deactivation for debugging   │
      │ ○ Other                                  │
      │                                          │
      │ [I rather wouldn't say]                  │
      │           [Submit & Deactivate] [Cancel] │
      └─────────────────────────────────────────┘
  → Submit sends to: AtlasAiDev tracker + Freemius API
  → Plugin deactivates
```

## Changes

### 1. Replace overlay with inline banner in Insights.php (both plugins)

**Files:**
- `text-to-audio/libs/AtlasAiDev/Insights.php` (line ~1034)
- `text-to-audio-pro/Libs/AtlasAiDev/Insights.php` (line ~1034)

**What:** Remove the absolute-positioned `.response` overlay that blocks the reasons list. Replace with a non-blocking inline banner above the reasons.

**Before (overlay that blocks everything):**
```html
<div class="response" style="display: block;">
    <div class="wrapper">
        <p>In trouble? Please submit a support request.</p>
        <p>
            <a href="#" class="not-interested">Not Interested</a>
            <button class="open-ticket-form">Open Support Ticket</button>
        </p>
    </div>
</div>
```

**After (inline banner, reasons visible below):**
```html
<?php if ( $showSupportTicket ) { ?>
<div class="atlasaidev-support-banner">
    <span>Having trouble? Get help before you go.</span>
    <button class="button button-small button-primary open-ticket-form">Open Support Ticket</button>
</div>
<?php } ?>
```

**CSS for banner:**
```css
.atlasaidev-support-banner {
    background: #f0f6fc;
    border: 1px solid #c3d1e0;
    border-radius: 4px;
    padding: 10px 15px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
```

**Footer buttons:** Keep enabled (no `disabled` class) — current state is correct.

### 2. Disable Freemius deactivation feedback modal (both plugins)

**Files:**
- `text-to-audio-pro/text-to-audio-pro.php` — after `ttsp_fs()` init
- `text-to-audio/text-to-audio.php` — after `tts_fs()` init

**Code:**
```php
// Pro plugin
ttsp_fs()->add_filter('show_deactivation_feedback_form', '__return_false');

// Free plugin
tts_fs()->add_filter('show_deactivation_feedback_form', '__return_false');
```

### 3. Add Freemius parallel submission in AtlasAiDev JS

**Files:**
- `text-to-audio/libs/AtlasAiDev/Insights.php` — `deactivate_scripts()` JS
- `text-to-audio-pro/Libs/AtlasAiDev/Insights.php` — `deactivate_scripts()` JS

**Approach:** In the `_ajax()` JS function (line ~1135), after the AtlasAiDev submission fires, also POST to Freemius's AJAX handler.

**Reason ID mapping (AtlasAiDev → Freemius):**
```
could-not-understand    → 10  (REASON_COULDNT_MAKE_IT_WORK)
found-better-plugin     → 2   (REASON_FOUND_A_BETTER_PLUGIN)
not-have-that-feature   → 11  (REASON_GREAT_BUT_NEED_SPECIFIC_FEATURE)
is-not-working          → 12  (REASON_NOT_WORKING)
looking-for-other       → 13  (REASON_NOT_WHAT_I_WAS_LOOKING_FOR)
did-not-work-as-expected→ 14  (REASON_DIDNT_WORK_AS_EXPECTED)
debugging               → 15  (REASON_TEMPORARY_DEACTIVATION)
other                   → 7   (REASON_OTHER)
no-comment              → 7   (REASON_OTHER)
```

**JS code (added inside _ajax function):**
```javascript
// Send to Freemius in parallel (fire-and-forget, don't block deactivation)
if (window._fsDeactivationData) {
    $.ajax({
        url: ajaxurl,
        method: 'POST',
        data: {
            action: window._fsDeactivationData.action,
            security: window._fsDeactivationData.security,
            module_id: window._fsDeactivationData.module_id,
            reason_id: reasonMap[data.reason_id] || 7,
            reason_info: data.reason_info || '',
            is_anonymous: false
        }
    });
}
```

### 4. Provide Freemius data to AtlasAiDev JS via filter

**Problem:** `Insights.php` doesn't have access to the Freemius instance. Need to pass Freemius AJAX credentials into the JS output.

**Solution:** Add a filter in `deactivate_scripts()` to get Freemius data, then output it as a JS variable.

**In Insights.php `deactivate_scripts()`:**
```php
$freemius_data = apply_filters(
    'AtlasAiDev_' . $this->client->getSlug() . '_freemius_deactivation_data',
    array()
);
// Output as JS:
if (!empty($freemius_data)) {
    echo '<script>window._fsDeactivationData = ' . wp_json_encode($freemius_data) . ';</script>';
}
```

**In TTA_Pro_Lib_AtlasAiDev::insightInit() (Pro plugin):**
```php
add_filter('AtlasAiDev_' . $projectSlug . '_freemius_deactivation_data', function() {
    if (function_exists('ttsp_fs')) {
        $fs = ttsp_fs();
        return array(
            'action'    => $fs->get_ajax_action('submit_uninstall_reason'),
            'security'  => $fs->get_ajax_security('submit_uninstall_reason'),
            'module_id' => $fs->get_id(),
        );
    }
    return array();
});
```

**In TTA_Lib_AtlasAiDev::insightInit() (Free plugin):**
```php
add_filter('AtlasAiDev_' . $projectSlug . '_freemius_deactivation_data', function() {
    if (function_exists('tts_fs')) {
        $fs = tts_fs();
        return array(
            'action'    => $fs->get_ajax_action('submit_uninstall_reason'),
            'security'  => $fs->get_ajax_security('submit_uninstall_reason'),
            'module_id' => $fs->get_id(),
        );
    }
    return array();
});
```

## Implementation Order

1. Modify `Insights.php` (both): replace overlay with inline banner
2. Modify `Insights.php` (both): add Freemius data filter + JS output in `deactivate_scripts()`
3. Modify `Insights.php` (both): add parallel Freemius POST in `_ajax()` JS function
4. Disable Freemius deactivation modal in both plugin entry files
5. Hook the Freemius data filter in `TTA_Pro_Lib_AtlasAiDev` and `TTA_Lib_AtlasAiDev`
6. Test in browser — verify single modal, data to both trackers
7. Rebuild both plugins (`npx mix --production`)

## Files Modified

| File | Change |
|------|--------|
| `text-to-audio/libs/AtlasAiDev/Insights.php` | Inline banner + Freemius parallel JS |
| `text-to-audio-pro/Libs/AtlasAiDev/Insights.php` | Inline banner + Freemius parallel JS |
| `text-to-audio/includes/TTA_Lib_AtlasAiDev.php` | Hook Freemius data filter |
| `text-to-audio-pro/Includes/TTA_Pro_Lib_AtlasAiDev.php` | Hook Freemius data filter |
| `text-to-audio/text-to-audio.php` | Disable Freemius deactivation modal |
| `text-to-audio-pro/text-to-audio-pro.php` | Disable Freemius deactivation modal |

## Verification

1. Click Deactivate on Pro → Rescue Modal → Continue → AtlasAiDev modal with inline banner + reasons
2. Select reason → Submit & Deactivate → check browser Network tab: two AJAX requests (AtlasAiDev + Freemius)
3. No Freemius modal appears at any point
4. Same flow for free plugin
5. Support ticket form still accessible via banner button
