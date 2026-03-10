const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';

function makeRequest(body, sessionId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const headers = {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (sessionId) headers['Mcp-Session-Id'] = sessionId;
    const req = https.request({
      hostname: 'atlasaidev.com',
      path: '/wp-json/awfah_mcp/mcp',
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ json: JSON.parse(data), sid: res.headers['mcp-session-id'] }); }
        catch(e) { resolve({ raw: data.substring(0, 2000), sid: res.headers['mcp-session-id'] }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  // Initialize MCP session
  const init = await makeRequest({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'claude-code', version: '1.0' } }
  });
  const sid = init.sid;
  if (!sid) { console.log('Failed to init:', JSON.stringify(init).substring(0, 500)); return; }
  await makeRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid);
  await new Promise(r => setTimeout(r, 500));
  console.log('Session:', sid);

  // Check tools schemas
  const tools = await makeRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, sid);
  const imgTool = tools.json?.result?.tools?.find(t => t.name === 'awfah-content-generate-feature-image');
  console.log('\n=== Feature Image Tool Schema ===');
  console.log(JSON.stringify(imgTool?.inputSchema).substring(0, 800));

  // ============================================================
  // STEP 1: Reschedule the 4 posts starting from March 15
  // ============================================================
  console.log('\n=== RESCHEDULING POSTS ===\n');

  const schedule = [
    { id: 4173, date: '2026-03-15T09:00:00', name: 'AtlasVoice vs GSpeech' },
    { id: 4175, date: '2026-03-18T09:00:00', name: 'WordPress ADA/WCAG Guide' },
    { id: 4176, date: '2026-03-22T09:00:00', name: 'AtlasVoice vs Trinity Audio' },
    { id: 4177, date: '2026-03-25T09:00:00', name: 'ChatGPT TTS WordPress' },
  ];

  for (const s of schedule) {
    console.log(`Scheduling ${s.id} (${s.name}) for ${s.date}...`);
    const result = await makeRequest({
      jsonrpc: '2.0', id: 100 + s.id, method: 'tools/call',
      params: { name: 'awfah-posts-wp-update-post', arguments: { id: s.id, status: 'future' } }
    }, sid);
    const text = result.json?.result?.content?.[0]?.text || JSON.stringify(result.json?.error || {});
    try {
      const r = JSON.parse(text);
      console.log(`  -> status=${r.status} date=${r.date}`);
    } catch(e) {
      console.log(`  -> ${text.substring(0, 200)}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // ============================================================
  // STEP 2: Generate Featured Images
  // ============================================================
  console.log('\n=== GENERATING FEATURED IMAGES ===\n');

  const imageRequests = [
    { id: 4173, prompt: 'AtlasVoice vs GSpeech comparison WordPress text-to-speech plugins, two plugins side by side with comparison checkmarks, modern tech blog style, blue and green color scheme' },
    { id: 4175, prompt: 'WordPress website accessibility ADA WCAG compliance, inclusive web design with accessibility icons, person using screen reader, modern blue and teal color scheme' },
    { id: 4176, prompt: 'AtlasVoice vs Trinity Audio comparison WordPress TTS plugins, self-hosted vs cloud SaaS architecture diagram, modern tech comparison style, blue and orange' },
    { id: 4177, prompt: 'ChatGPT OpenAI text-to-speech on WordPress, AI voice waveform with OpenAI logo, WordPress dashboard with audio player, modern tech tutorial style, green and dark theme' },
  ];

  for (const img of imageRequests) {
    console.log(`Generating image for post ${img.id}...`);
    const result = await makeRequest({
      jsonrpc: '2.0', id: 200 + img.id, method: 'tools/call',
      params: { name: 'awfah-content-generate-feature-image', arguments: { post_id: img.id, prompt: img.prompt } }
    }, sid);
    const text = result.json?.result?.content?.[0]?.text || JSON.stringify(result.json?.error || {});
    console.log(`  -> ${text.substring(0, 300)}`);
    await new Promise(r => setTimeout(r, 5000)); // Wait longer for image generation
  }

  // Verify final state
  console.log('\n=== FINAL VERIFICATION ===\n');
  for (const s of schedule) {
    const post = await makeRequest({
      jsonrpc: '2.0', id: 300 + s.id, method: 'tools/call',
      params: { name: 'awfah-posts-wp-get-post', arguments: { id: s.id } }
    }, sid);
    const text = post.json?.result?.content?.[0]?.text || '';
    try {
      const p = JSON.parse(text);
      console.log(`Post ${s.id}: status=${p.status} date=${p.date} featured_media=${p.featured_media}`);
    } catch(e) {
      console.log(`Post ${s.id}: error`);
    }
  }
}

main().catch(console.error);
