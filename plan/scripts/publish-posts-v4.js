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

  // Use the WordPress REST API (wp/v2/posts/{id}) to update each post
  const now = new Date().toISOString();
  const posts = [
    { id: 4173, name: 'AtlasVoice vs GSpeech' },
    { id: 4175, name: 'WordPress ADA/WCAG Guide' },
    { id: 4176, name: 'AtlasVoice vs Trinity Audio' },
    { id: 4177, name: 'ChatGPT TTS WordPress' }
  ];

  for (const p of posts) {
    console.log(`Publishing ${p.id} (${p.name})...`);
    const result = await makeRequest({ jsonrpc: '2.0', id: p.id, method: 'tools/call', params: { name: 'awfah-rest-api-run-api-function', arguments: {
      method: 'POST',
      route: `/wp/v2/posts/${p.id}`,
      data: { status: 'publish', date: now }
    }}}, sid);
    const text = result.json?.result?.content?.[0]?.text || JSON.stringify(result.json?.error || {});
    try {
      const r = JSON.parse(text);
      console.log(`  -> status=${r.status} slug=${r.slug} link=${r.link}`);
    } catch(e) {
      console.log(`  -> ${text.substring(0, 200)}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(console.error);
