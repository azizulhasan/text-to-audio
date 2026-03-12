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

// Update H1 titles for posts that had year updates or significant title changes
// Use the update-post MCP tool which updates the WordPress post title (H1)
const titleUpdates = [
  { id: 3085, title: 'How to Use Text-to-Speech on Any Device (2026 Guide)' },
  { id: 1930, title: 'Best Text to Speech WordPress Plugin in 2026 (Free & Easy to Use)' },
  { id: 3231, title: '10 Best Free AI Text-to-Speech Tools in 2026 (With Realistic Voices)' },
  { id: 3256, title: '10 Best Text-to-Speech Text Readers for Every Need in 2026' },
  { id: 3497, title: '9 Best Text-to-Speech Book Readers in 2026 (Free and Paid)' },
  { id: 3534, title: 'Best Free Text-to-Speech Websites to Try in 2026' },
  { id: 3421, title: '3 Best Text-to-Speech Converters for Realistic Voice Output (2026)' },
];

async function main() {
  try {
    for (const update of titleUpdates) {
      console.log(`Updating post ${update.id} title to: ${update.title}`);
      const result = await mcpCall(update.id, 'awfah-posts-wp-update-post', {
        id: update.id,
        title: update.title
      });
      const text = result.result?.content?.[0]?.text;
      if (text) {
        try {
          const post = JSON.parse(text);
          console.log(`  -> Done. Modified: ${post.modified}`);
        } catch(e) {
          console.log(`  -> Response: ${text.substring(0, 200)}`);
        }
      } else {
        console.log(`  -> Result: ${JSON.stringify(result).substring(0, 200)}`);
      }
    }

    // Also update Yoast meta for the remaining posts (3534 and 3421)
    console.log('\nUpdating Yoast meta for remaining posts...');
    const phpCode = `
$updates = array(
    array(
        'id' => 3534,
        'title' => 'Best Free Text-to-Speech Websites to Try in 2026',
        'desc' => 'Looking for a free text to speech website? Here are 5 top picks with natural AI voices, perfect for reading, multitasking, or studying. No signup required.'
    ),
    array(
        'id' => 3421,
        'title' => '3 Best Text-to-Speech Converters for Realistic Voice Output (2026)',
        'desc' => 'Explore 3 of the best text-to-speech converters for natural voice output. Compare features, voice quality, and free tools built for modern content needs.'
    ),
    array(
        'id' => 3351,
        'title' => 'How to Add Text to Speech in Website: Complete Setup Guide (2026)',
        'desc' => 'Want to add text to speech to your website? This no-code guide shows you how to set up TTS on WordPress in under 5 minutes. Improve accessibility and engagement.'
    ),
    array(
        'id' => 3074,
        'title' => 'How Text-to-Speech Assistive Technology Supports Accessibility',
        'desc' => 'Learn how text-to-speech assistive technology supports people with disabilities. Explore key benefits, real-life use cases, and top tools that improve accessibility.'
    ),
    array(
        'id' => 3142,
        'title' => '15 Benefits of Text to Speech for Accessibility and User Experience',
        'desc' => 'Explore the top 15 benefits of text to speech for websites, schools, and businesses. See how TTS improves user experience, accessibility, and engagement.'
    ),
);

foreach ($updates as $update) {
    update_post_meta($update['id'], '_yoast_wpseo_title', $update['title']);
    update_post_meta($update['id'], '_yoast_wpseo_metadesc', $update['desc']);
}
error_log('Remaining SEO updates done');
`;

    const snippetResult = await mcpCall(100, 'awfah-rest-api-run-api-function', {
      route: '/code-snippets/v1/snippets',
      method: 'POST',
      data: {
        name: 'SEO Quick Wins - Remaining Posts Update (Run Once)',
        code: phpCode,
        scope: 'global',
        active: true,
        priority: 10
      }
    });

    const snippetText = snippetResult.result?.content?.[0]?.text;
    if (snippetText) {
      const snippet = JSON.parse(snippetText);
      console.log(`Snippet created: ID ${snippet.id}, Active: ${snippet.active}`);

      // Deactivate immediately
      await mcpCall(101, 'awfah-rest-api-run-api-function', {
        route: '/code-snippets/v1/snippets/' + snippet.id + '/deactivate',
        method: 'POST',
        data: {}
      });
      console.log('Snippet deactivated.');
    }

    console.log('\n=== ALL SEO UPDATES COMPLETE ===');
  } catch(err) {
    console.error('Error:', err.message);
  }
}

main();
