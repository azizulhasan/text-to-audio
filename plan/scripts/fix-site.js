const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';

function makeRequest(body, sessionId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) };
    if (sessionId) headers['Mcp-Session-Id'] = sessionId;
    const req = https.request({ hostname: 'atlasaidev.com', path: '/wp-json/awfah_mcp/mcp', method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve({ json: JSON.parse(data), sid: res.headers['mcp-session-id'] }); } catch(e) { resolve({ raw: data.substring(0, 2000), sid: res.headers['mcp-session-id'] }); } });
    });
    req.on('error', reject); req.write(postData); req.end();
  });
}

async function main() {
  const init = await makeRequest({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'claude-code', version: '1.0' } } });
  const sid = init.sid;
  await makeRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid);
  await new Promise(r => setTimeout(r, 500));
  console.log('Session:', sid);

  // List all snippets to find the problematic ones
  console.log('Listing snippets...');
  const snippets = await makeRequest({ jsonrpc: '2.0', id: 10, method: 'tools/call', params: { name: 'awfah-rest-api-run-api-function', arguments: {
    method: 'GET',
    route: '/code-snippets/v1/snippets'
  }}}, sid);
  const text = snippets.json?.result?.content?.[0]?.text || JSON.stringify(snippets.json?.error || {});

  try {
    const list = JSON.parse(text);
    console.log('Total snippets:', list.length);
    list.forEach(s => {
      if (s.id >= 30) {
        console.log(`  ID ${s.id}: active=${s.active} name="${s.name}" error=${s.code_error}`);
      }
    });

    // Delete snippets 31 and 32 (the ones we created)
    for (const id of [31, 32]) {
      console.log(`Deleting snippet ${id}...`);
      const del = await makeRequest({ jsonrpc: '2.0', id: 20 + id, method: 'tools/call', params: { name: 'awfah-rest-api-run-api-function', arguments: {
        method: 'DELETE',
        route: `/code-snippets/v1/snippets/${id}`
      }}}, sid);
      const delText = del.json?.result?.content?.[0]?.text || JSON.stringify(del.json?.error || {});
      console.log(`  -> ${delText.substring(0, 200)}`);
    }
  } catch(e) {
    console.log('Snippets raw:', text.substring(0, 500));
  }

  // Now test if site is back
  await new Promise(r => setTimeout(r, 2000));
  console.log('\nTesting post 4173...');
  const post = await makeRequest({ jsonrpc: '2.0', id: 100, method: 'tools/call', params: { name: 'awfah-posts-wp-get-post', arguments: { id: 4173 } } }, sid);
  const postText = post.json?.result?.content?.[0]?.text || JSON.stringify(post.json?.error || {});
  try {
    const p = JSON.parse(postText);
    console.log(`Post 4173: status=${p.status} date=${p.date}`);
  } catch(e) {
    console.log('Post 4173 error:', postText.substring(0, 200));
  }
}

main().catch(console.error);
