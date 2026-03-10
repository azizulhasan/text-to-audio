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

  // Check the run-api-function tool schema
  const tools = await makeRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, sid);
  const apiTool = tools.json?.result?.tools?.find(t => t.name === 'awfah-rest-api-run-api-function');
  console.log('API tool schema:', JSON.stringify(apiTool?.inputSchema).substring(0, 800));
}

main().catch(console.error);
