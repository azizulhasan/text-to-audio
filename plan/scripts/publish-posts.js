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

  // Create a Code Snippet to publish all 4 posts with current date
  const phpCode = `$post_ids = array(4173, 4175, 4176, 4177);
$now = current_time('mysql');
$now_gmt = current_time('mysql', 1);
$results = array();
foreach ($post_ids as $post_id) {
    wp_update_post(array(
        'ID' => $post_id,
        'post_status' => 'publish',
        'post_date' => $now,
        'post_date_gmt' => $now_gmt,
    ));
    $post = get_post($post_id);
    $results[] = array('id' => $post_id, 'status' => $post->post_status, 'slug' => $post->post_name);
}
return $results;`;

  console.log('Creating snippet to publish posts...');
  const createSnippet = await makeRequest({ jsonrpc: '2.0', id: 10, method: 'tools/call', params: { name: 'awfah-rest-api-run-api-function', arguments: {
    method: 'POST',
    route: '/code-snippets/v1/snippets',
    body: JSON.stringify({
      name: 'Publish blog posts - March 10',
      code: phpCode,
      scope: 'global',
      active: false
    })
  }}}, sid);
  const snippetText = createSnippet.json?.result?.content?.[0]?.text || JSON.stringify(createSnippet.json?.error || {});
  console.log('Create snippet result:', snippetText.substring(0, 400));

  // Get the snippet ID and execute it
  let snippetId;
  try {
    const snippetData = JSON.parse(snippetText);
    snippetId = snippetData.id;
    console.log('Snippet ID:', snippetId);
  } catch(e) {
    console.log('Could not parse snippet ID, trying alternative approach...');
  }

  if (snippetId) {
    // Activate the snippet to run it
    console.log('Activating snippet to execute...');
    const activate = await makeRequest({ jsonrpc: '2.0', id: 11, method: 'tools/call', params: { name: 'awfah-rest-api-run-api-function', arguments: {
      method: 'POST',
      route: `/code-snippets/v1/snippets/${snippetId}`,
      body: JSON.stringify({ active: true })
    }}}, sid);
    const activateText = activate.json?.result?.content?.[0]?.text || JSON.stringify(activate.json?.error || {});
    console.log('Activate result:', activateText.substring(0, 400));

    await new Promise(r => setTimeout(r, 2000));

    // Deactivate and delete the snippet
    console.log('Deactivating snippet...');
    await makeRequest({ jsonrpc: '2.0', id: 12, method: 'tools/call', params: { name: 'awfah-rest-api-run-api-function', arguments: {
      method: 'POST',
      route: `/code-snippets/v1/snippets/${snippetId}`,
      body: JSON.stringify({ active: false })
    }}}, sid);

    // Verify posts are published
    console.log('\nVerifying post statuses...');
    for (const id of [4173, 4175, 4176, 4177]) {
      const post = await makeRequest({ jsonrpc: '2.0', id: id, method: 'tools/call', params: { name: 'awfah-posts-wp-get-post', arguments: { id: id } } }, sid);
      const text = post.json?.result?.content?.[0]?.text || '';
      try {
        const p = JSON.parse(text);
        console.log(`  Post ${id}: status=${p.status} slug=${p.slug} link=${p.link}`);
      } catch(e) {
        console.log(`  Post ${id}: ${text.substring(0, 100)}`);
      }
    }
  }
}

main().catch(console.error);
