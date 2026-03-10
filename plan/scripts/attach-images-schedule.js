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
  const init = await makeRequest({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'claude-code', version: '1.0' } }
  });
  const sid = init.sid;
  if (!sid) { console.log('Failed:', JSON.stringify(init).substring(0, 500)); return; }
  await makeRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid);
  await new Promise(r => setTimeout(r, 500));
  console.log('Session:', sid);

  // ============================================================
  // STEP 1: Attach featured images to posts
  // ============================================================
  console.log('\n=== ATTACHING FEATURED IMAGES ===\n');

  const attachments = [
    { postId: 4173, imageId: 4183, name: 'AtlasVoice vs GSpeech' },
    { postId: 4175, imageId: 4184, name: 'WordPress ADA/WCAG Guide' },
    { postId: 4176, imageId: 4185, name: 'AtlasVoice vs Trinity Audio' },
    { postId: 4177, imageId: 4186, name: 'ChatGPT TTS WordPress' },
  ];

  for (const a of attachments) {
    console.log(`Attaching image ${a.imageId} to post ${a.postId} (${a.name})...`);
    const result = await makeRequest({
      jsonrpc: '2.0', id: 100 + a.postId, method: 'tools/call',
      params: { name: 'awfah-posts-wp-update-post', arguments: { id: a.postId, featured_media: a.imageId } }
    }, sid);
    const text = result.json?.result?.content?.[0]?.text || JSON.stringify(result.json?.error || {});
    try {
      const r = JSON.parse(text);
      console.log(`  -> featured_media=${r.featured_media}`);
    } catch(e) {
      console.log(`  -> ${text.substring(0, 200)}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // ============================================================
  // STEP 2: Use Code Snippet to schedule all 4 posts to future dates
  // ============================================================
  console.log('\n=== SCHEDULING POSTS VIA CODE SNIPPET ===\n');

  const phpCode = [
    "$schedule = array(",
    "  array('id' => 4173, 'date' => '2026-03-15 09:00:00', 'gmt' => '2026-03-15 09:00:00'),",
    "  array('id' => 4175, 'date' => '2026-03-18 09:00:00', 'gmt' => '2026-03-18 09:00:00'),",
    "  array('id' => 4176, 'date' => '2026-03-22 09:00:00', 'gmt' => '2026-03-22 09:00:00'),",
    "  array('id' => 4177, 'date' => '2026-03-25 09:00:00', 'gmt' => '2026-03-25 09:00:00'),",
    ");",
    "global $wpdb;",
    "foreach ($schedule as $s) {",
    "  $wpdb->update($wpdb->posts, array(",
    "    'post_status' => 'future',",
    "    'post_date' => $s['date'],",
    "    'post_date_gmt' => $s['gmt'],",
    "  ), array('ID' => $s['id']));",
    "  clean_post_cache($s['id']);",
    "  wp_schedule_single_event(strtotime($s['gmt']), 'publish_future_post', array($s['id']));",
    "}",
  ].join('\n');

  // Create snippet
  const create = await makeRequest({
    jsonrpc: '2.0', id: 200, method: 'tools/call',
    params: { name: 'awfah-rest-api-run-api-function', arguments: {
      method: 'POST',
      route: '/code-snippets/v1/snippets',
      data: { name: 'Schedule Posts Mar 15-25 TEMP', code: phpCode, scope: 'front-end', active: true, priority: 1 }
    }}
  }, sid);
  const createText = create.json?.result?.content?.[0]?.text || JSON.stringify(create.json?.error || {});
  let snippetId;
  try {
    const d = JSON.parse(createText);
    snippetId = d.id;
    console.log('Snippet ID:', snippetId, 'active:', d.active);
  } catch(e) {
    console.log('Create:', createText.substring(0, 300));
  }

  if (snippetId) {
    // Trigger by loading front-end
    console.log('Triggering snippet...');
    await new Promise((resolve) => {
      https.get('https://atlasaidev.com/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => { console.log('  Loaded, status:', res.statusCode); resolve(); });
      }).on('error', (e) => { console.log('  Error:', e.message); resolve(); });
    });

    await new Promise(r => setTimeout(r, 2000));

    // Deactivate and delete
    console.log('Cleaning up snippet...');
    await makeRequest({
      jsonrpc: '2.0', id: 201, method: 'tools/call',
      params: { name: 'awfah-rest-api-run-api-function', arguments: {
        method: 'POST', route: '/code-snippets/v1/snippets/' + snippetId, data: { active: false }
      }}
    }, sid);
    await makeRequest({
      jsonrpc: '2.0', id: 202, method: 'tools/call',
      params: { name: 'awfah-rest-api-run-api-function', arguments: {
        method: 'DELETE', route: '/code-snippets/v1/snippets/' + snippetId
      }}
    }, sid);
    console.log('Snippet cleaned up.');
  }

  // ============================================================
  // STEP 3: Verify final state
  // ============================================================
  console.log('\n=== FINAL VERIFICATION ===\n');
  for (const a of attachments) {
    const post = await makeRequest({
      jsonrpc: '2.0', id: 300 + a.postId, method: 'tools/call',
      params: { name: 'awfah-posts-wp-get-post', arguments: { id: a.postId } }
    }, sid);
    const text = post.json?.result?.content?.[0]?.text || '';
    try {
      const p = JSON.parse(text);
      console.log(`Post ${a.postId} (${a.name}): status=${p.status} date=${p.date} featured_media=${p.featured_media}`);
    } catch(e) {
      console.log(`Post ${a.postId}: verify error`);
    }
  }
}

main().catch(console.error);
