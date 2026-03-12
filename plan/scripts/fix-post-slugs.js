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
  // Fix slugs to be shorter and SEO-friendly
  const slugFixes = [
    { id: 4154, slug: 'google-cloud-tts-vs-openai-vs-elevenlabs' },
    { id: 4155, slug: 'text-to-speech-accommodation-accessibility-guide' },
    { id: 4156, slug: 'how-to-add-text-to-speech-to-website' }
  ];

  for (const fix of slugFixes) {
    const result = await mcpCall(fix.id, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${fix.id}`,
      method: 'POST',
      data: { slug: fix.slug }
    });

    const text = result.result?.content?.[0]?.text;
    try {
      const post = JSON.parse(text);
      console.log(`✅ Post ${fix.id} slug updated: ${post.link}`);
    } catch(e) {
      console.log(`Post ${fix.id} slug result:`, text?.substring(0, 300));
    }
  }
}

main().catch(err => console.error('Error:', err.message));
