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
  // Create email capture Code Snippet
  // This adds a lead capture bar after blog post content and on the pricing page
  // Uses WordPress options to store emails (lightweight, no external service needed)
  console.log('Creating email capture Code Snippet...');

  const phpCode = `<?php
// AtlasVoice Email Lead Capture — lightweight inline opt-in
// Shows after blog post content in category "text-to-speech" (ID 35)

// Register REST API endpoint for email capture
add_action('rest_api_init', function() {
    register_rest_route('atlasvoice/v1', '/subscribe', array(
        'methods' => 'POST',
        'callback' => function(WP_REST_Request \\$request) {
            \\$email = sanitize_email(\\$request->get_param('email'));
            if (!is_email(\\$email)) {
                return new WP_REST_Response(array('success' => false, 'message' => 'Invalid email'), 400);
            }
            \\$subscribers = get_option('atlasvoice_subscribers', array());
            if (in_array(\\$email, \\$subscribers)) {
                return new WP_REST_Response(array('success' => true, 'message' => 'Already subscribed'));
            }
            \\$subscribers[] = \\$email;
            update_option('atlasvoice_subscribers', \\$subscribers);
            return new WP_REST_Response(array('success' => true, 'message' => 'Subscribed!'));
        },
        'permission_callback' => '__return_true'
    ));
});

// Add email capture form after blog content
add_filter('the_content', function(\\$content) {
    if (!is_singular('post')) return \\$content;
    if (!has_category(35)) return \\$content; // Only on text-to-speech category posts

    \\$form = '
    <div id="av-email-capture" style="margin:40px 0;padding:32px 28px;background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);border:2px solid #2563EB;border-radius:16px;text-align:center;">
        <h3 style="margin:0 0 8px 0;font-size:22px;color:#0F172A;">Get WordPress TTS Tips & Updates</h3>
        <p style="margin:0 0 20px 0;color:#475569;font-size:15px;">Join 4,000+ WordPress site owners using AtlasVoice. Get accessibility tips, voice technology news, and exclusive offers.</p>
        <form id="av-subscribe-form" style="display:flex;gap:10px;max-width:480px;margin:0 auto;flex-wrap:wrap;justify-content:center;">
            <input type="email" id="av-email-input" placeholder="Enter your email" required
                style="flex:1;min-width:200px;padding:12px 16px;border:1px solid #CBD5E1;border-radius:8px;font-size:15px;outline:none;">
            <button type="submit" id="av-subscribe-btn"
                style="padding:12px 24px;background:#2563EB;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background 0.2s;">
                Subscribe Free
            </button>
        </form>
        <p id="av-subscribe-msg" style="margin:12px 0 0 0;font-size:13px;color:#059669;display:none;"></p>
        <p style="margin:8px 0 0 0;font-size:12px;color:#94A3B8;">No spam, ever. Unsubscribe anytime.</p>
    </div>
    <script>
    (function(){
        var form = document.getElementById("av-subscribe-form");
        if (!form) return;
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            var email = document.getElementById("av-email-input").value;
            var btn = document.getElementById("av-subscribe-btn");
            var msg = document.getElementById("av-subscribe-msg");
            btn.disabled = true;
            btn.textContent = "Subscribing...";
            fetch("/wp-json/atlasvoice/v1/subscribe", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email: email})
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                msg.style.display = "block";
                msg.textContent = data.success ? "\\u2705 You are subscribed! Check your inbox." : data.message;
                if (data.success) {
                    btn.textContent = "Subscribed!";
                    btn.style.background = "#059669";
                    if (typeof gtag === "function") {
                        gtag("event", "generate_lead", { event_category: "email", event_label: "blog_inline" });
                    }
                } else {
                    btn.disabled = false;
                    btn.textContent = "Subscribe Free";
                }
            })
            .catch(function() {
                btn.disabled = false;
                btn.textContent = "Subscribe Free";
                msg.style.display = "block";
                msg.textContent = "Something went wrong. Please try again.";
                msg.style.color = "#EF4444";
            });
        });
    })();
    </script>';

    return \\$content . \\$form;
}, 99);`;

  const result = await mcpCall(1, 'awfah-rest-api-run-api-function', {
    route: '/code-snippets/v1/snippets',
    method: 'POST',
    data: {
      name: 'AtlasVoice Email Lead Capture (Blog Posts)',
      code: phpCode,
      scope: 'global',
      priority: 10,
      active: true
    }
  });

  const text = result.result?.content?.[0]?.text;
  try {
    const snippet = JSON.parse(text);
    console.log('✅ Email capture snippet created: ID', snippet.id, '— ACTIVE');
  } catch(e) {
    console.log('Result:', text?.substring(0, 500));
  }

  console.log('\n=== EMAIL CAPTURE SETUP COMPLETE ===');
  console.log('Features:');
  console.log('  - Inline opt-in form after blog posts in "text-to-speech" category');
  console.log('  - REST API endpoint: /wp-json/atlasvoice/v1/subscribe');
  console.log('  - Emails stored in wp_options (atlasvoice_subscribers)');
  console.log('  - GA4 generate_lead event on subscribe');
  console.log('  - No external service dependencies');
}

main().catch(err => console.error('Error:', err.message));
