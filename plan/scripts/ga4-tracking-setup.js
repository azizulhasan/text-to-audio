const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';
const sessionId = 'e726a59a-7486-4fe1-9c14-d9689ede5ae4';

function mcpCall(id, toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0', id, method: 'tools/call',
      params: { name: toolName, arguments: args }
    });
    const options = {
      hostname: 'atlasaidev.com', path: '/wp-json/awfah_mcp/mcp', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Mcp-Session-Id': sessionId, 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = https.request(options, (res) => {
      let data = ''; res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data.substring(0, 500) }); } });
    });
    req.on('error', reject); req.write(postData); req.end();
  });
}

async function main() {
  // ============================================================
  // STEP 1: Create a site-wide GA4 tracking Code Snippet
  // This adds purchase event tracking for ALL Freemius checkout pages
  // ============================================================
  console.log('STEP 1: Creating GA4 Freemius Tracking Code Snippet...');

  const snippetCode = `<?php
/**
 * GA4 Purchase Event Tracking for Freemius Checkout
 * Tracks: begin_checkout, purchase, thank-you page conversion
 * Works on: /plugins/text-to-speech-pro/, /plugins/text-to-speech-pro/pricing/
 * GA4 Measurement ID: G-1M9023J8DN
 */
add_action('wp_footer', function() {
    // Only load on frontend, not admin
    if (is_admin()) return;
    ?>
    <script>
    (function() {
        'use strict';
        if (typeof gtag !== 'function') return;

        // ========== PLAN PRICE MAPPING ==========
        var plans = {
            // Pricing page buttons (Freemius SDK)
            'yearly_1':  { name: 'Starter Annual',        price: 59,  cycle: 'annual',   licenses: 1  },
            'yearly_5':  { name: 'Professional Annual',    price: 149, cycle: 'annual',   licenses: 5  },
            'yearly_10': { name: 'Enterprise Annual',      price: 199, cycle: 'annual',   licenses: 10 },
            'lifetime_1':  { name: 'Starter Lifetime',     price: 199, cycle: 'lifetime', licenses: 1  },
            'lifetime_5':  { name: 'Professional Lifetime', price: 249, cycle: 'lifetime', licenses: 5  },
            'lifetime_10': { name: 'Enterprise Lifetime',  price: 299, cycle: 'lifetime', licenses: 10 },
            // Product page buttons (custom HTML)
            'purchase-annual-1':   { name: 'Starter Annual',        price: 59,  cycle: 'annual',   licenses: 1  },
            'purchase-annual-5':   { name: 'Professional Annual',    price: 149, cycle: 'annual',   licenses: 5  },
            'purchase-annual-10':  { name: 'Enterprise Annual',      price: 199, cycle: 'annual',   licenses: 10 },
            'purchase-lifetime-1':  { name: 'Starter Lifetime',     price: 199, cycle: 'lifetime', licenses: 1  },
            'purchase-lifetime-5':  { name: 'Professional Lifetime', price: 249, cycle: 'lifetime', licenses: 5  },
            'purchase-lifetime-10': { name: 'Enterprise Lifetime',  price: 299, cycle: 'lifetime', licenses: 10 }
        };

        // Store the last clicked plan for purchase attribution
        var lastClickedPlan = null;

        // ========== EVENT 1: begin_checkout ==========
        // Fires when any "Buy Now" purchase button is clicked
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.purchase, [id^="yearly_"], [id^="lifetime_"], [id^="purchase-"]');
            if (!btn) return;

            var plan = plans[btn.id];
            if (!plan) return;

            lastClickedPlan = plan;

            // Store in sessionStorage for cross-page attribution
            try { sessionStorage.setItem('tta_checkout_plan', JSON.stringify(plan)); } catch(err) {}

            gtag('event', 'begin_checkout', {
                currency: 'USD',
                value: plan.price,
                items: [{
                    item_id: 'tts-pro-' + plan.cycle + '-' + plan.licenses,
                    item_name: 'AtlasVoice TTS Pro - ' + plan.name,
                    price: plan.price,
                    quantity: 1,
                    item_category: plan.cycle === 'lifetime' ? 'Lifetime' : 'Annual',
                    item_variant: plan.licenses + ' site(s)'
                }]
            });

            console.log('[GA4] begin_checkout:', plan.name, '$' + plan.price);
        });

        // ========== EVENT 2: purchase (via postMessage) ==========
        // Freemius checkout iframe sends postMessage on success
        window.addEventListener('message', function(e) {
            try {
                var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                if (!data) return;

                // Freemius sends various message types
                // Check for purchase/success indicators
                var isPurchase = false;
                var purchaseData = {};

                // Method 1: Freemius SDK format
                if (data.type === 'purchaseCompleted' || data.type === 'success') {
                    isPurchase = true;
                    purchaseData = data.data || data;
                }

                // Method 2: Check for purchase object in data
                if (data.purchase && data.purchase.id) {
                    isPurchase = true;
                    purchaseData = data;
                }

                // Method 3: Check for Freemius-specific fields
                if (data.plugin_id === '13388' || data.plan_id === '24893') {
                    isPurchase = true;
                    purchaseData = data;
                }

                if (!isPurchase) return;

                var purchase = purchaseData.purchase || {};
                var plan = lastClickedPlan || {};

                // Recover plan from sessionStorage if needed
                if (!plan.name) {
                    try {
                        plan = JSON.parse(sessionStorage.getItem('tta_checkout_plan') || '{}');
                    } catch(err) {}
                }

                var amount = parseFloat(purchase.initial_amount || purchase.gross || plan.price || 0);
                var currency = (purchase.currency || 'usd').toUpperCase();

                gtag('event', 'purchase', {
                    transaction_id: purchase.id ? 'fs_' + purchase.id : 'fs_' + Date.now(),
                    value: amount,
                    currency: currency,
                    tax: 0,
                    shipping: 0,
                    items: [{
                        item_id: 'tts-pro-' + (purchase.plan_id || plan.cycle || 'unknown'),
                        item_name: 'AtlasVoice TTS Pro' + (plan.name ? ' - ' + plan.name : ''),
                        price: amount,
                        quantity: 1,
                        item_category: (plan.cycle === 'lifetime' || purchase.billing_cycle === 'lifetime') ? 'Lifetime' : 'Annual'
                    }]
                });

                console.log('[GA4] purchase:', amount, currency);

                // Clean up
                try { sessionStorage.removeItem('tta_checkout_plan'); } catch(err) {}
            } catch(err) {
                // Silently ignore non-JSON messages
            }
        });

        // ========== EVENT 3: thank-you page conversion (backup) ==========
        // Fires when user lands on /thank-you/ after purchase
        if (window.location.pathname.indexOf('/thank-you') !== -1) {
            var plan = {};
            try {
                plan = JSON.parse(sessionStorage.getItem('tta_checkout_plan') || '{}');
            } catch(err) {}

            gtag('event', 'purchase', {
                transaction_id: 'fs_thankyou_' + Date.now(),
                value: plan.price || 0,
                currency: 'USD',
                items: [{
                    item_id: 'tts-pro-thankyou',
                    item_name: 'AtlasVoice TTS Pro' + (plan.name ? ' - ' + plan.name : ''),
                    price: plan.price || 0,
                    quantity: 1,
                    item_category: plan.cycle || 'unknown'
                }]
            });

            console.log('[GA4] purchase (thank-you page):', plan.name || 'unknown plan', '$' + (plan.price || 0));

            // Also fire a custom event for funnel analysis
            gtag('event', 'conversion', {
                send_to: 'G-1M9023J8DN',
                event_category: 'ecommerce',
                event_label: plan.name || 'AtlasVoice TTS Pro',
                value: plan.price || 0
            });

            // Clean up
            try { sessionStorage.removeItem('tta_checkout_plan'); } catch(err) {}
        }

        // ========== EVENT 4: view_item (pricing section visibility) ==========
        // Fires when pricing section scrolls into view
        var pricingObserved = false;
        var pricingSection = document.getElementById('pricing') || document.querySelector('.tts-pricing-grid, .fs-pricing-table');
        if (pricingSection && typeof IntersectionObserver !== 'undefined') {
            var observer = new IntersectionObserver(function(entries) {
                if (entries[0].isIntersecting && !pricingObserved) {
                    pricingObserved = true;
                    gtag('event', 'view_item_list', {
                        item_list_id: 'pricing_plans',
                        item_list_name: 'AtlasVoice TTS Pro Pricing',
                        items: [
                            { item_id: 'tts-pro-starter',      item_name: 'Starter',      price: 59  },
                            { item_id: 'tts-pro-professional',  item_name: 'Professional',  price: 149 },
                            { item_id: 'tts-pro-enterprise',    item_name: 'Enterprise',    price: 199 }
                        ]
                    });
                    console.log('[GA4] view_item_list: pricing section visible');
                    observer.disconnect();
                }
            }, { threshold: 0.3 });
            observer.observe(pricingSection);
        }

        console.log('[GA4] AtlasVoice purchase tracking initialized');
    })();
    </script>
    <?php
}, 9999);`;

  const result = await mcpCall(110, 'awfah-rest-api-run-api-function', {
    route: '/code-snippets/v1/snippets',
    method: 'POST',
    data: {
      name: 'GA4 Purchase Event Tracking (Freemius)',
      code: snippetCode,
      scope: 'global',
      priority: 10,
      active: true
    }
  });

  const text = result.result?.content?.[0]?.text;
  try {
    const snippet = JSON.parse(text);
    if (snippet.id) {
      console.log('✅ GA4 Tracking Code Snippet created (ID:', snippet.id + ')');
      console.log('   Status: ACTIVE (running on all frontend pages)');
      console.log('   Events tracked:');
      console.log('   - begin_checkout: when Buy Now buttons clicked');
      console.log('   - purchase: on Freemius checkout success (postMessage)');
      console.log('   - purchase: backup on /thank-you/ page visit');
      console.log('   - view_item_list: when pricing section scrolls into view');

      // NOTE: We keep this snippet ACTIVE (don't deactivate)
      console.log('\n   ⚠️  This snippet is kept ACTIVE for continuous tracking.');
    } else {
      console.log('Snippet creation issue:', text?.substring(0, 300));
    }
  } catch(e) {
    console.log('Response:', text?.substring(0, 500));
  }

  // ============================================================
  // STEP 2: Update Product Page JS to include GA4 in callbacks
  // ============================================================
  console.log('\nSTEP 2: Updating product page Freemius JS with GA4 events...');

  // Get current page 43 content
  const getResult = await mcpCall(111, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/pages/43',
    method: 'GET',
    data: {}
  });

  const pageText = getResult.result?.content?.[0]?.text;
  let page;
  try { page = JSON.parse(pageText); } catch(e) { console.log('Failed to get page:', pageText?.substring(0, 200)); return; }

  let content = page.content?.raw || page.content?.rendered || '';

  // Update purchaseCompleted callback to include GA4
  const oldPurchaseCompleted = "purchaseCompleted: function(response) {\n        console.log('Purchase completed:', response);\n      }";
  const newPurchaseCompleted = `purchaseCompleted: function(response) {
        console.log('Purchase completed:', response);
        // GA4 purchase event
        if (typeof gtag === 'function' && response && response.purchase) {
          gtag('event', 'purchase', {
            transaction_id: 'fs_' + (response.purchase.id || Date.now()),
            value: parseFloat(response.purchase.initial_amount || 0),
            currency: (response.purchase.currency || 'usd').toUpperCase(),
            items: [{
              item_id: 'tts-pro-' + (response.purchase.plan_id || ''),
              item_name: 'AtlasVoice TTS Pro',
              price: parseFloat(response.purchase.initial_amount || 0),
              quantity: 1
            }]
          });
          console.log('[GA4] purchase event fired:', response.purchase.initial_amount);
        }
      }`;

  if (content.includes(oldPurchaseCompleted)) {
    content = content.replace(oldPurchaseCompleted, newPurchaseCompleted);
    console.log('  ✅ purchaseCompleted callback updated with GA4 event');
  } else {
    console.log('  ⚠️ purchaseCompleted callback not found in expected format');
    // Try a more flexible match
    if (content.includes("console.log('Purchase completed:', response)")) {
      console.log('  Found purchase log, attempting flexible replacement...');
      content = content.replace(
        "console.log('Purchase completed:', response);",
        `console.log('Purchase completed:', response);
        // GA4 purchase event
        if (typeof gtag === 'function' && response && response.purchase) {
          gtag('event', 'purchase', {
            transaction_id: 'fs_' + (response.purchase.id || Date.now()),
            value: parseFloat(response.purchase.initial_amount || 0),
            currency: (response.purchase.currency || 'usd').toUpperCase(),
            items: [{
              item_id: 'tts-pro-' + (response.purchase.plan_id || ''),
              item_name: 'AtlasVoice TTS Pro',
              price: parseFloat(response.purchase.initial_amount || 0),
              quantity: 1
            }]
          });
          console.log('[GA4] purchase event fired');
        }`
      );
      console.log('  ✅ GA4 event added after purchase log');
    }
  }

  // Also add GA4 event before the thank-you redirect
  const oldSuccess = "window.location.href = 'https://atlasaidev.com/thank-you/';";
  const newSuccess = `// GA4 will also fire on /thank-you/ page via Code Snippet
        window.location.href = 'https://atlasaidev.com/thank-you/';`;

  if (content.includes(oldSuccess)) {
    content = content.replace(oldSuccess, newSuccess);
    console.log('  ✅ Success redirect comment added');
  }

  // Push updated content
  const updateResult = await mcpCall(112, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/pages/43',
    method: 'POST',
    data: { content: content }
  });

  const updateText = updateResult.result?.content?.[0]?.text;
  try {
    const updated = JSON.parse(updateText);
    console.log('  ✅ Product page updated (Modified:', updated.modified + ')');
  } catch(e) {
    console.log('  Update response:', updateText?.substring(0, 200));
  }

  console.log('\n=== GA4 PURCHASE TRACKING SETUP COMPLETE ===');
  console.log('');
  console.log('Summary:');
  console.log('  GA4 ID: G-1M9023J8DN');
  console.log('  Events:');
  console.log('    1. begin_checkout → Buy Now button clicks (all pages)');
  console.log('    2. purchase → Freemius postMessage (iframe callback)');
  console.log('    3. purchase → Product page purchaseCompleted callback');
  console.log('    4. purchase → /thank-you/ page backup');
  console.log('    5. view_item_list → Pricing section visibility');
  console.log('  Coverage:');
  console.log('    - /plugins/text-to-speech-pro/ (product page)');
  console.log('    - /plugins/text-to-speech-pro/pricing/ (pricing page)');
  console.log('    - /thank-you/ (post-purchase page)');
  console.log('    - Any other page with Freemius checkout');
}

main().catch(err => console.error('Error:', err.message));
