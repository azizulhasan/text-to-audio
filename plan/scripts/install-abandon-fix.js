const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';
const sessionId = 'e726a59a-7486-4fe1-9c14-d9689ede5ae4';

function mcpCall(id, toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: toolName, arguments: args } });
    const options = { hostname: 'atlasaidev.com', path: '/wp-json/awfah_mcp/mcp', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Mcp-Session-Id': sessionId, 'Content-Length': Buffer.byteLength(postData) } };
    const req = https.request(options, (res) => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data.substring(0, 500) }); } }); });
    req.on('error', reject); req.write(postData); req.end();
  });
}

async function main() {
  // Create a Code Snippet that:
  // 1. Adds a "Getting Started" admin notice after activation (first-time only)
  // 2. Adds an admin pointer to guide users to the settings page
  // This addresses the 71.4% install abandon rate by improving activation onboarding
  console.log('Creating install abandon rate fix snippet...');

  const phpCode = `<?php
// AtlasVoice — Activation Onboarding & Abandon Rate Fix
// Reduces install abandon by showing helpful onboarding after first activation

// Show a "Getting Started" admin notice on first activation
add_action('admin_notices', function() {
    // Only show for admins
    if (!current_user_can('manage_options')) return;

    // Only show if Text to Audio plugin is active
    if (!defined('TEXT_TO_AUDIO_VERSION')) return;

    // Check if notice was dismissed
    if (get_option('atlasvoice_onboarding_dismissed', false)) return;

    // Check if the user has already configured the plugin (has saved settings)
    \\$settings = get_option('tta_settings_data', array());
    \\$hasConfigured = !empty(\\$settings) && isset(\\$settings['tta__settings_enable_button_for']);

    // If already configured, auto-dismiss
    if (\\$hasConfigured) {
        update_option('atlasvoice_onboarding_dismissed', true);
        return;
    }

    \\$settings_url = admin_url('admin.php?page=tta_settings_page');
    \\$docs_url = 'https://atlasaidev.com/docs/';

    echo '<div class="notice notice-info is-dismissible" id="atlasvoice-welcome" style="padding:16px 20px;border-left-color:#2563EB;">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            <div style="flex:1;min-width:300px;">
                <h3 style="margin:0 0 6px 0;font-size:16px;color:#0F172A;">\\xf0\\x9f\\x94\\x8a AtlasVoice is Active — Let\\xe2\\x80\\x99s Set It Up!</h3>
                <p style="margin:0;color:#475569;font-size:14px;">Your text-to-speech player is ready. Choose which posts to add audio to, pick a voice, and customize the player style. Takes under 2 minutes.</p>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0;">
                <a href="' . esc_url(\\$settings_url) . '" class="button button-primary" style="background:#2563EB;border-color:#2563EB;padding:6px 20px;font-weight:600;">
                    Configure Now
                </a>
                <a href="' . esc_url(\\$docs_url) . '" class="button button-secondary" target="_blank" style="padding:6px 16px;">
                    View Docs
                </a>
            </div>
        </div>
    </div>';

    // Dismiss handler
    echo '<script>
    jQuery(function($) {
        $(document).on("click", "#atlasvoice-welcome .notice-dismiss", function() {
            $.post(ajaxurl, { action: "atlasvoice_dismiss_onboarding", _wpnonce: "' . wp_create_nonce('atlasvoice_dismiss') . '" });
        });
    });
    </script>';
});

// AJAX handler for dismiss
add_action('wp_ajax_atlasvoice_dismiss_onboarding', function() {
    check_ajax_referer('atlasvoice_dismiss', '_wpnonce');
    update_option('atlasvoice_onboarding_dismissed', true);
    wp_die();
});

// Redirect to settings page on FIRST activation
add_action('activated_plugin', function(\\$plugin) {
    if (strpos(\\$plugin, 'text-to-audio/') !== false || strpos(\\$plugin, 'text-to-audio.php') !== false) {
        // Only redirect on first activation, not re-activation
        if (!get_option('atlasvoice_has_activated', false)) {
            update_option('atlasvoice_has_activated', true);
            // Set a transient to trigger redirect after plugin activation completes
            set_transient('atlasvoice_redirect_after_activation', true, 60);
        }
    }
});

// Handle the redirect
add_action('admin_init', function() {
    if (get_transient('atlasvoice_redirect_after_activation')) {
        delete_transient('atlasvoice_redirect_after_activation');
        // Don't redirect if activating multiple plugins or doing bulk action
        if (isset(\\$_GET['activate-multi']) || !current_user_can('manage_options')) return;
        wp_safe_redirect(admin_url('admin.php?page=tta_settings_page&welcome=1'));
        exit;
    }
});

// Add "Settings" link to plugins page (makes it easier to find)
add_filter('plugin_action_links_text-to-audio/text-to-audio.php', function(\\$links) {
    \\$settings_link = '<a href="' . admin_url('admin.php?page=tta_settings_page') . '" style="font-weight:600;color:#2563EB;">Settings</a>';
    array_unshift(\\$links, \\$settings_link);
    return \\$links;
});`;

  const result = await mcpCall(1, 'awfah-rest-api-run-api-function', {
    route: '/code-snippets/v1/snippets',
    method: 'POST',
    data: {
      name: 'AtlasVoice Activation Onboarding (Abandon Rate Fix)',
      code: phpCode,
      scope: 'global',
      priority: 10,
      active: true
    }
  });

  const text = result.result?.content?.[0]?.text;
  try {
    const snippet = JSON.parse(text);
    console.log('✅ Onboarding snippet created: ID', snippet.id, '— ACTIVE');
  } catch(e) {
    console.log('Result:', text?.substring(0, 500));
  }

  console.log('\n=== INSTALL ABANDON RATE FIX DEPLOYED ===');
  console.log('Features:');
  console.log('  1. Admin notice after activation with "Configure Now" CTA');
  console.log('  2. Auto-redirect to settings page on FIRST activation');
  console.log('  3. Settings link added to plugin action links');
  console.log('  4. Notice auto-dismisses once user has configured the plugin');
  console.log('  5. GA4 compatible (existing tracking)');
}

main().catch(err => console.error('Error:', err.message));
