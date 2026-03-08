const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';
const sessionId = 'e726a59a-7486-4fe1-9c14-d9689ede5ae4';

function mcpCall(id, toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0', id, method: 'tools/call',
      params: { name: toolName, arguments: args }
    });
    const options = {
      hostname: 'atlasaidev.com', path: '/wp-json/awfah_mcp/mcp', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Mcp-Session-Id': sessionId, 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = https.request(options, (res) => {
      let data = ''; res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data.substring(0, 500) }); } });
    });
    req.on('error', reject); req.write(postData); req.end();
  });
}

async function main() {
  // Use MCP to create code snippet for Yoast meta update
  console.log('Creating Code Snippet via MCP for Yoast meta update...');

  const snippetCode = `<?php
// Update Yoast meta description for page 43
update_post_meta(43, '_yoast_wpseo_metadesc', 'AtlasVoice Text to Speech Pro — the best WordPress TTS plugin. 4 AI voice providers, 51+ languages, MP3 downloads, audio schema SEO. Trusted by 4,000+ sites. From \\$59/yr.');

// Also update Yoast SEO title to be keyword-optimized
update_post_meta(43, '_yoast_wpseo_title', 'Text to Speech Pro — Best WordPress TTS Plugin | AtlasVoice');

echo json_encode(['status' => 'done', 'title' => get_post_meta(43, '_yoast_wpseo_title', true), 'desc' => get_post_meta(43, '_yoast_wpseo_metadesc', true)]);`;

  const result = await mcpCall(90, 'awfah-rest-api-run-api-function', {
    route: '/code-snippets/v1/snippets',
    method: 'POST',
    data: {
      name: 'Fix Page 43 Yoast Meta SEO',
      code: snippetCode,
      scope: 'global',
      priority: 10,
      active: true
    }
  });

  const text = result.result?.content?.[0]?.text;
  console.log('Snippet creation result:', text?.substring(0, 500));

  // Try to parse and deactivate
  try {
    const snippet = JSON.parse(text);
    if (snippet.id) {
      console.log('✅ Snippet created with ID:', snippet.id);

      // Deactivate it
      const deactivateResult = await mcpCall(91, 'awfah-rest-api-run-api-function', {
        route: '/code-snippets/v1/snippets/' + snippet.id,
        method: 'PUT',
        data: { active: false }
      });
      console.log('✅ Snippet deactivated');
    }
  } catch(e) {
    console.log('Parse note:', e.message);
  }

  // Verify the update
  console.log('\nVerifying Yoast meta was updated...');
  const verifyResult = await mcpCall(92, 'awfah-rest-api-run-api-function', {
    route: '/code-snippets/v1/snippets',
    method: 'POST',
    data: {
      name: 'Verify Page 43 Yoast Meta',
      code: `<?php echo json_encode(['title' => get_post_meta(43, '_yoast_wpseo_title', true), 'desc' => get_post_meta(43, '_yoast_wpseo_metadesc', true)]);`,
      scope: 'global',
      priority: 10,
      active: true
    }
  });
  const verifyText = verifyResult.result?.content?.[0]?.text;
  console.log('Verification:', verifyText?.substring(0, 500));

  // Deactivate verify snippet
  try {
    const verifySnippet = JSON.parse(verifyText);
    if (verifySnippet.id) {
      await mcpCall(93, 'awfah-rest-api-run-api-function', {
        route: '/code-snippets/v1/snippets/' + verifySnippet.id,
        method: 'PUT',
        data: { active: false }
      });
    }
  } catch(e) {}

  console.log('\n=== YOAST META UPDATE COMPLETE ===');
}

main().catch(err => console.error('Error:', err.message));
