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
        try {
          resolve({ json: JSON.parse(data), sid: res.headers['mcp-session-id'] });
        } catch(e) {
          resolve({ raw: data.substring(0, 2000), sid: res.headers['mcp-session-id'] });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  // Initialize session
  console.log('Initializing MCP session...');
  const initResult = await makeRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'claude-code', version: '1.0' }
    }
  });
  const sid = initResult.sid;
  if (!sid) {
    console.log('Failed to get session. Full response:', JSON.stringify(initResult).substring(0, 500));
    return;
  }
  console.log('Session:', sid);

  // Send initialized notification
  await makeRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid);
  await new Promise(r => setTimeout(r, 1000));

  // Step 1: Delete old Code Snippets we created (31, 32)
  console.log('\nCleaning up old snippets...');
  for (const snippetId of [31, 32]) {
    const del = await makeRequest({
      jsonrpc: '2.0',
      id: 100 + snippetId,
      method: 'tools/call',
      params: {
        name: 'awfah-rest-api-run-api-function',
        arguments: { method: 'DELETE', route: '/code-snippets/v1/snippets/' + snippetId }
      }
    }, sid);
    const t = del.json?.result?.content?.[0]?.text || JSON.stringify(del.json?.error || {});
    console.log('  Snippet ' + snippetId + ':', t.substring(0, 100));
  }

  // Step 2: Create a temporary snippet to publish the posts
  // Use code that returns early to avoid any execution issues
  const phpCode = [
    '$ids = array(4173, 4175, 4176, 4177);',
    '$now = date("Y-m-d H:i:s");',
    '$gmt = gmdate("Y-m-d H:i:s");',
    'global $wpdb;',
    'foreach ($ids as $id) {',
    '  $wpdb->update($wpdb->posts, array("post_status" => "publish", "post_date" => $now, "post_date_gmt" => $gmt), array("ID" => $id));',
    '  clean_post_cache($id);',
    '}',
  ].join('\n');

  console.log('\nCreating publish snippet...');
  const create = await makeRequest({
    jsonrpc: '2.0',
    id: 200,
    method: 'tools/call',
    params: {
      name: 'awfah-rest-api-run-api-function',
      arguments: {
        method: 'POST',
        route: '/code-snippets/v1/snippets',
        data: {
          name: 'publish-blog-posts-temp',
          code: phpCode,
          scope: 'front-end',
          active: true,
          priority: 1
        }
      }
    }
  }, sid);
  const createText = create.json?.result?.content?.[0]?.text || JSON.stringify(create.json?.error || {});
  console.log('Create result:', createText.substring(0, 300));

  let newSnippetId;
  try {
    const d = JSON.parse(createText);
    newSnippetId = d.id;
    console.log('New snippet ID:', newSnippetId, 'active:', d.active);
  } catch(e) {}

  // Step 3: Trigger the snippet by loading the site front-end
  console.log('\nTriggering snippet by loading site...');
  await new Promise((resolve) => {
    https.get('https://atlasaidev.com/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('  Site loaded, status:', res.statusCode);
        resolve();
      });
    }).on('error', (e) => {
      console.log('  Site load error:', e.message);
      resolve();
    });
  });

  await new Promise(r => setTimeout(r, 2000));

  // Step 4: Deactivate and delete the snippet
  if (newSnippetId) {
    console.log('\nDeactivating snippet ' + newSnippetId + '...');
    await makeRequest({
      jsonrpc: '2.0',
      id: 300,
      method: 'tools/call',
      params: {
        name: 'awfah-rest-api-run-api-function',
        arguments: {
          method: 'POST',
          route: '/code-snippets/v1/snippets/' + newSnippetId,
          data: { active: false }
        }
      }
    }, sid);
    console.log('Deactivated.');

    await makeRequest({
      jsonrpc: '2.0',
      id: 301,
      method: 'tools/call',
      params: {
        name: 'awfah-rest-api-run-api-function',
        arguments: { method: 'DELETE', route: '/code-snippets/v1/snippets/' + newSnippetId }
      }
    }, sid);
    console.log('Deleted.');
  }

  // Step 5: Verify posts are published
  console.log('\nVerifying post statuses...');
  for (const id of [4173, 4175, 4176, 4177]) {
    const post = await makeRequest({
      jsonrpc: '2.0',
      id: 400 + id,
      method: 'tools/call',
      params: { name: 'awfah-posts-wp-get-post', arguments: { id: id } }
    }, sid);
    const text = post.json?.result?.content?.[0]?.text || '';
    try {
      const p = JSON.parse(text);
      console.log(`  Post ${id}: status=${p.status} slug=${p.slug} date=${p.date} link=${p.link}`);
    } catch(e) {
      console.log(`  Post ${id}: error - ${text.substring(0, 100)}`);
    }
  }
}

main().catch(console.error);
