const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';
const sessionId = 'e726a59a-7486-4fe1-9c14-d9689ede5ae4';

function mcpCall(id, toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: toolName, arguments: args } });
    const options = { hostname: 'atlasaidev.com', path: '/wp-json/awfah_mcp/mcp', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Mcp-Session-Id': sessionId, 'Content-Length': Buffer.byteLength(postData) } };
    const req = https.request(options, (res) => { let data = ''; res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data.substring(0, 500) }); } }); });
    req.on('error', reject); req.write(postData); req.end();
  });
}

async function main() {
  // Get current pricing page content
  const result = await mcpCall(60, 'awfah-pages-wp-get-page', { id: 44, context: 'edit' });
  const text = result.result?.content?.[0]?.text;
  const page = JSON.parse(text);
  let content = page.content?.raw;

  // Fix: 2,000+ → 4,000+
  const fixed = content.replace('2,000+', '4,000+');
  if (fixed !== content) {
    console.log('Fixed: 2,000+ -> 4,000+ Active Websites');

    const updateResult = await mcpCall(61, 'awfah-rest-api-run-api-function', {
      route: '/wp/v2/pages/44',
      method: 'POST',
      data: { content: fixed }
    });
    const updateText = updateResult.result?.content?.[0]?.text;
    const updated = JSON.parse(updateText);
    console.log('Pricing page updated. Modified:', updated.modified);
  } else {
    console.log('No change needed (2,000+ not found)');
  }
}

main().catch(err => console.error('Error:', err.message));
