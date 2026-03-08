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
  // Search for the post about "how to add text to speech on a website"
  const result = await mcpCall(1, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/posts?search=how+to+add+text+to+speech&_fields=id,slug,link,title&per_page=5',
    method: 'GET'
  });
  const text = result.result?.content?.[0]?.text;
  try {
    const data = JSON.parse(text);
    const posts = data.results || data;
    if (Array.isArray(posts)) {
      posts.forEach(p => console.log(`ID ${p.id}: slug="${p.slug}" link="${p.link}" title="${p.title?.rendered}"`));
    }
  } catch(e) {
    console.log('Error:', text?.substring(0, 300));
  }

  // Also try pages
  const pageResult = await mcpCall(2, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/pages?search=how+to+add+text+to+speech&_fields=id,slug,link,title&per_page=5',
    method: 'GET'
  });
  const pageText = pageResult.result?.content?.[0]?.text;
  try {
    const data = JSON.parse(pageText);
    const pages = data.results || data;
    if (Array.isArray(pages)) {
      pages.forEach(p => console.log(`PAGE ID ${p.id}: slug="${p.slug}" link="${p.link}" title="${p.title?.rendered}"`));
    }
  } catch(e) {
    console.log('Pages error:', pageText?.substring(0, 300));
  }
}

main().catch(err => console.error('Error:', err.message));
