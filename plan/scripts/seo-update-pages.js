const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';
const sessionId = 'e726a59a-7486-4fe1-9c14-d9689ede5ae4';

function mcpCall(id, toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: id,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    });
    const options = {
      hostname: 'atlasaidev.com',
      path: '/wp-json/awfah_mcp/mcp',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// PHP code to update Yoast SEO meta for KEY PAGES
const phpCode = `
$updates = array(
    // Page 40 - HOMEPAGE - Currently too generic
    array(
        'id' => 40,
        'title' => 'AtlasAiDev - Text to Speech WordPress Plugin by AtlasVoice',
        'desc' => 'AtlasAiDev builds AtlasVoice, the top-rated text-to-speech WordPress plugin. Add natural AI voices to your site in minutes. Trusted by 2,000+ websites worldwide.'
    ),
    // Page 43 - PRODUCT PAGE (/text-to-speech-pro/) - 27,769 GSC impressions
    array(
        'id' => 43,
        'title' => 'AtlasVoice Text to Speech Pro - Best WordPress TTS Plugin',
        'desc' => 'AtlasVoice Text to Speech Pro adds natural AI voices to your WordPress site. Google Cloud, OpenAI, and ElevenLabs voices. Free version available. Trusted by 2,000+ sites.'
    ),
    // Page 44 - PRICING PAGE - #1 most visited (15,945 GA views)
    array(
        'id' => 44,
        'title' => 'AtlasVoice Text to Speech Pro Pricing - Plans from \\$59/year',
        'desc' => 'AtlasVoice TTS Pro pricing starts at \\$59/year. Choose from 1-site, 5-site, or unlimited plans. Google Cloud, OpenAI, and ElevenLabs voices included. 14-day refund guarantee.'
    ),
    // Page 2755 - DEMO PAGE - 4,896 GA views, high interest
    array(
        'id' => 2755,
        'title' => 'AtlasVoice Text to Speech Pro Demo - Try It Live',
        'desc' => 'Try the AtlasVoice text-to-speech demo live. Hear Google Cloud, OpenAI, and ElevenLabs voices on a real WordPress page. No signup needed.'
    ),
    // Page 2115 - DOCS PAGE - 5,102 GA views
    array(
        'id' => 2115,
        'title' => 'AtlasVoice Text to Speech Pro Documentation and Setup Guide',
        'desc' => 'Complete documentation for AtlasVoice Text to Speech Pro. Setup guides, API configuration, troubleshooting, and FAQs for the WordPress TTS plugin.'
    ),
    // Page 2673 - PLUGINS PAGE
    array(
        'id' => 2673,
        'title' => 'AtlasAiDev WordPress Plugins - AI-Powered Tools for Your Site',
        'desc' => 'Explore AI-powered WordPress plugins by AtlasAiDev. Text-to-speech, 3D model viewer, AI workflow automation, and more. Built for performance and accessibility.'
    ),
);

$results = array();
foreach ($updates as $update) {
    update_post_meta($update['id'], '_yoast_wpseo_title', $update['title']);
    update_post_meta($update['id'], '_yoast_wpseo_metadesc', $update['desc']);
    $results[] = 'Updated page ' . $update['id'];
}
error_log('Page SEO Update: ' . implode(' | ', $results));
`;

async function main() {
  try {
    // Step 1: Create and activate the code snippet
    console.log('Creating Code Snippet for Page SEO updates...');
    const result = await mcpCall(20, 'awfah-rest-api-run-api-function', {
      route: '/code-snippets/v1/snippets',
      method: 'POST',
      data: {
        name: 'SEO Quick Wins - Page Meta Update (Run Once)',
        code: phpCode,
        scope: 'global',
        active: true,
        priority: 10
      }
    });

    const text = result.result?.content?.[0]?.text;
    if (text) {
      try {
        const snippet = JSON.parse(text);
        console.log('Snippet created! ID:', snippet.id);
        console.log('Active:', snippet.active);

        // Step 2: Deactivate immediately
        if (snippet.id) {
          console.log('Deactivating snippet...');
          await mcpCall(21, 'awfah-rest-api-run-api-function', {
            route: '/code-snippets/v1/snippets/' + snippet.id + '/deactivate',
            method: 'POST',
            data: {}
          });
          console.log('Deactivated.');
        }
      } catch(e) {
        console.log('Response:', text.substring(0, 500));
      }
    } else {
      console.log('Result:', JSON.stringify(result, null, 2).substring(0, 500));
    }

    // Step 3: Verify updates
    console.log('\n--- Verifying Page Updates ---');
    const verifyUrl = 'https://atlasaidev.com/wp-json/wp/v2/pages?include=40,43,44,2755,2115,2673&_fields=id,yoast_head_json&per_page=10';
    const pages = await new Promise((resolve, reject) => {
      https.get(verifyUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    pages.forEach(p => {
      console.log(`Page ${p.id}: ${p.yoast_head_json?.title || 'N/A'}`);
      console.log(`  Desc: ${(p.yoast_head_json?.description || 'N/A').substring(0, 80)}...`);
    });

  } catch(err) {
    console.error('Error:', err.message);
  }
}

main();
