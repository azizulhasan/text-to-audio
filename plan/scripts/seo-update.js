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

// PHP code to batch-update Yoast SEO meta
const phpCode = `
$updates = array(
    // Post 3383 - Fix DUPLICATE SEO title
    array(
        'id' => 3383,
        'title' => 'How Does Text to Speech Work? A Complete Guide With Examples',
        'desc' => 'How does text to speech work? Learn the full process behind TTS technology, from text analysis to natural audio output, with tools and real examples.'
    ),
    // Post 2182 - Fix DUPLICATE SEO title
    array(
        'id' => 2182,
        'title' => 'How to Add Text to Speech Plugin for WordPress (Free Setup Guide)',
        'desc' => 'Learn how to add text to speech plugin for WordPress site without coding. This beginner guide covers plugins, setup steps, and tips to boost accessibility.'
    ),
    // Post 3497 - Fix terrible meta (biggest traffic page - 165K impressions)
    array(
        'id' => 3497,
        'title' => '9 Best Text-to-Speech Book Readers in 2026 (Free and Paid)',
        'desc' => 'Compare the 9 best text-to-speech book readers for audiobook lovers, students, and busy readers. Includes free options, real voice samples, and setup tips.'
    ),
    // Post 3477 - Fix weak meta (46K impressions, 0.6% CTR)
    array(
        'id' => 3477,
        'title' => 'What Is Text-to-Speech Accommodation? Benefits, Examples and Tools',
        'desc' => 'Text-to-speech accommodation helps students with disabilities access content. Learn what it is, who qualifies, how to request it, and the best TTS tools for schools.'
    ),
    // Post 3085 - BIGGEST opportunity (90K impressions, 0.2% CTR!)
    array(
        'id' => 3085,
        'title' => 'How to Use Text-to-Speech on Any Device: Step-by-Step (2026)',
        'desc' => 'Learn how to use text-to-speech on iPhone, Android, Windows, Mac, and Chromebook. Free built-in options plus the best TTS apps and plugins for every device.'
    ),
    // Post 1930 - Update year and improve meta (11.8K impressions)
    array(
        'id' => 1930,
        'title' => 'Best Text to Speech WordPress Plugin in 2026 (Free and Easy to Use)',
        'desc' => 'Compare the top 8 text-to-speech WordPress plugins side by side. Find the best free TTS plugin to convert your posts into natural-sounding audio instantly.'
    ),
    // Post 3231 - Update year
    array(
        'id' => 3231,
        'title' => '10 Best Free AI Text-to-Speech Tools in 2026 (Realistic Voices)',
        'desc' => 'Looking for the best free AI text to speech tools? These 10 options offer realistic voices, zero-cost access, and work great for students, creators, and accessibility.'
    ),
    // Post 3256 - Update year
    array(
        'id' => 3256,
        'title' => '10 Best Text-to-Speech Text Readers for Every Need in 2026',
        'desc' => 'Here are the 10 best text-to-speech text readers to easily convert written material into spoken words. Compare features, voices, and pricing.'
    ),
);

$results = array();
foreach ($updates as $update) {
    update_post_meta($update['id'], '_yoast_wpseo_title', $update['title']);
    update_post_meta($update['id'], '_yoast_wpseo_metadesc', $update['desc']);
    $results[] = 'Updated post ' . $update['id'];
}
error_log('SEO Batch Update: ' . implode(' | ', $results));
`;

async function main() {
  try {
    // Step 1: Create and activate the code snippet
    console.log('Creating Code Snippet for Yoast SEO batch update...');
    const result = await mcpCall(10, 'awfah-rest-api-run-api-function', {
      route: '/code-snippets/v1/snippets',
      method: 'POST',
      data: {
        name: 'SEO Quick Wins - Batch Yoast Meta Update (Run Once)',
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
        console.log('Name:', snippet.name);
        console.log('Active:', snippet.active);

        // Step 2: Deactivate the snippet immediately (it already ran)
        if (snippet.id) {
          console.log('\nDeactivating snippet (already executed)...');
          const deactivateResult = await mcpCall(11, 'awfah-rest-api-run-api-function', {
            route: '/code-snippets/v1/snippets/' + snippet.id + '/deactivate',
            method: 'POST',
            data: {}
          });
          const deactText = deactivateResult.result?.content?.[0]?.text;
          console.log('Deactivated:', deactText ? deactText.substring(0, 200) : 'done');
        }
      } catch(e) {
        console.log('Response:', text.substring(0, 1000));
      }
    } else {
      console.log('Full result:', JSON.stringify(result, null, 2).substring(0, 1000));
    }

    // Step 3: Verify the updates
    console.log('\n--- Verifying Updates ---');
    const verifyResult = await mcpCall(12, 'awfah-rest-api-run-api-function', {
      route: '/wp/v2/posts',
      method: 'GET',
      data: {
        include: '3383,2182,3497,3477,3085,1930,3231,3256',
        _fields: 'id,yoast_head_json',
        per_page: 10
      }
    });
    const verifyText = verifyResult.result?.content?.[0]?.text;
    if (verifyText) {
      const posts = JSON.parse(verifyText);
      posts.forEach(p => {
        console.log(`Post ${p.id}: ${p.yoast_head_json?.title || 'N/A'}`);
      });
    }
  } catch(err) {
    console.error('Error:', err.message);
  }
}

main();
