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
  await makeRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid);
  await new Promise(r => setTimeout(r, 500));
  console.log('Session:', sid);

  // Yoast SEO meta for all 4 posts
  const yoastMeta = [
    {
      id: 4173,
      title: 'AtlasVoice vs GSpeech: Complete Feature & Price Comparison (2026)',
      desc: 'Compare AtlasVoice vs GSpeech side by side: pricing ($59/yr vs $120-$1,560/yr), voice quality (4 AI providers vs 1), setup, free tier, and more. See which WordPress TTS plugin wins.',
      keyword: 'atlasvoice vs gspeech'
    },
    {
      id: 4175,
      title: 'WordPress ADA & WCAG Accessibility Compliance Guide (2026)',
      desc: 'Complete WordPress accessibility guide for 2026. Learn ADA compliance requirements, WCAG 2.1 Level AA checklist, text-to-speech for accessibility, and tools to avoid lawsuits.',
      keyword: 'wordpress accessibility guide'
    },
    {
      id: 4176,
      title: 'AtlasVoice vs Trinity Audio: Self-Hosted vs SaaS TTS Compared (2026)',
      desc: 'AtlasVoice vs Trinity Audio head-to-head comparison. Self-hosted ($59/yr) vs SaaS (5 articles/mo free). Compare pricing, AI voices, features, and vendor lock-in risk.',
      keyword: 'atlasvoice vs trinity audio'
    },
    {
      id: 4177,
      title: 'How to Use ChatGPT TTS (OpenAI Text-to-Speech) on WordPress (2026)',
      desc: 'Step-by-step guide to using OpenAI ChatGPT TTS voices on WordPress. Learn 3 methods: AtlasVoice plugin (easiest), direct API, and JavaScript. HD voices from $15/1M chars.',
      keyword: 'chatgpt tts wordpress'
    }
  ];

  // Create a Code Snippet to set Yoast meta (will run once on front-end load)
  let phpLines = [];
  for (const meta of yoastMeta) {
    // Escape single quotes in values
    const title = meta.title.replace(/'/g, "\\'");
    const desc = meta.desc.replace(/'/g, "\\'");
    const keyword = meta.keyword.replace(/'/g, "\\'");
    phpLines.push(`update_post_meta(${meta.id}, '_yoast_wpseo_title', '${title}');`);
    phpLines.push(`update_post_meta(${meta.id}, '_yoast_wpseo_metadesc', '${desc}');`);
    phpLines.push(`update_post_meta(${meta.id}, '_yoast_wpseo_focuskw', '${keyword}');`);
  }
  // Auto-deactivate after running
  phpLines.push("// Self-deactivate");
  phpLines.push("$snippet_id = 0;");
  phpLines.push("if (class_exists('Code_Snippets\\Plugin')) {");
  phpLines.push("  // Just set the meta, don't worry about self-deactivation");
  phpLines.push("}");

  const phpCode = phpLines.join('\n');
  console.log('PHP code length:', phpCode.length);

  // Create the snippet
  console.log('Creating Yoast meta snippet...');
  const create = await makeRequest({
    jsonrpc: '2.0', id: 10, method: 'tools/call',
    params: {
      name: 'awfah-rest-api-run-api-function',
      arguments: {
        method: 'POST',
        route: '/code-snippets/v1/snippets',
        data: {
          name: 'Set Yoast Meta for New Posts - Mar 10',
          code: phpCode,
          scope: 'front-end',
          active: true,
          priority: 1
        }
      }
    }
  }, sid);

  const createText = create.json?.result?.content?.[0]?.text || JSON.stringify(create.json?.error || {});
  let snippetId;
  try {
    const d = JSON.parse(createText);
    snippetId = d.id;
    console.log('Snippet ID:', snippetId, 'active:', d.active);
  } catch(e) {
    console.log('Create result:', createText.substring(0, 300));
  }

  if (snippetId) {
    // Trigger by loading the front-end
    console.log('Triggering snippet by loading site...');
    await new Promise((resolve) => {
      https.get('https://atlasaidev.com/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('  Site loaded, status:', res.statusCode);
          resolve();
        });
      }).on('error', (e) => {
        console.log('  Load error:', e.message);
        resolve();
      });
    });

    await new Promise(r => setTimeout(r, 2000));

    // Deactivate and delete the snippet
    console.log('Deactivating snippet...');
    await makeRequest({
      jsonrpc: '2.0', id: 20, method: 'tools/call',
      params: {
        name: 'awfah-rest-api-run-api-function',
        arguments: {
          method: 'POST',
          route: '/code-snippets/v1/snippets/' + snippetId,
          data: { active: false }
        }
      }
    }, sid);

    console.log('Deleting snippet...');
    await makeRequest({
      jsonrpc: '2.0', id: 21, method: 'tools/call',
      params: {
        name: 'awfah-rest-api-run-api-function',
        arguments: {
          method: 'DELETE',
          route: '/code-snippets/v1/snippets/' + snippetId
        }
      }
    }, sid);
    console.log('Snippet cleaned up.');

    // Verify Yoast meta was set
    console.log('\nVerifying Yoast meta...');
    for (const meta of yoastMeta) {
      const post = await makeRequest({
        jsonrpc: '2.0', id: 100 + meta.id, method: 'tools/call',
        params: {
          name: 'awfah-posts-wp-get-post',
          arguments: { id: meta.id, context: 'edit' }
        }
      }, sid);
      const text = post.json?.result?.content?.[0]?.text || '';
      try {
        const p = JSON.parse(text);
        const yoastTitle = p.yoast_head_json?.title || p.meta?._yoast_wpseo_title || 'N/A';
        console.log(`  Post ${meta.id}: yoast_title="${yoastTitle}"`);
      } catch(e) {
        console.log(`  Post ${meta.id}: could not verify`);
      }
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
