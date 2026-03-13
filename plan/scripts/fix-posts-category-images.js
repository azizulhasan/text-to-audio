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
  // Fix all 4 new posts: category + featured image
  const fixes = [
    {
      id: 4154,
      title: 'Google Cloud TTS vs OpenAI vs ElevenLabs (AI Voice Comparison)',
      categories: [35], // text-to-speech category
      featured_media: 4111 // text-to-speech-pro-plugin.webp - best general TTS image
    },
    {
      id: 4155,
      title: 'Text to Speech Accommodation (Accessibility Guide)',
      categories: [35],
      featured_media: 3834 // "15 Benefits of Text to Speech" - good for accessibility article
    },
    {
      id: 4156,
      title: 'How to Add Text to Speech to Any Website',
      categories: [35],
      featured_media: 3791 // "How to add text to speech in website" - perfect match!
    },
    {
      id: 4160,
      title: 'Best WordPress TTS Plugin Comparison',
      categories: [35],
      featured_media: 3796 // "Best Text to Speech WordPress Plugin" - perfect match!
    }
  ];

  for (const fix of fixes) {
    console.log(`Fixing post ${fix.id}: ${fix.title}...`);

    const result = await mcpCall(fix.id, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${fix.id}`,
      method: 'POST',
      data: {
        categories: fix.categories,
        featured_media: fix.featured_media
      }
    });

    const text = result.result?.content?.[0]?.text;
    try {
      const post = JSON.parse(text);
      console.log(`  ✅ Updated: categories=[${post.categories}], featured_media=${post.featured_media}`);
    } catch(e) {
      console.log(`  Result:`, text?.substring(0, 300));
    }
  }

  console.log('\n=== ALL 4 POSTS FIXED: Category + Featured Image ===');
}

main().catch(err => console.error('Error:', err.message));
