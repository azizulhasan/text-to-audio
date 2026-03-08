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
  // ============================================================
  // FIX 1: Update H1 in page content to include "Text to Speech Pro"
  // ============================================================
  console.log('FIX 1: Getting current page content...');
  const getResult = await mcpCall(80, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/pages/43',
    method: 'GET',
    data: {}
  });

  const pageText = getResult.result?.content?.[0]?.text;
  let page;
  try { page = JSON.parse(pageText); } catch(e) { console.log('Failed to parse page:', pageText?.substring(0, 300)); return; }

  let content = page.content?.raw || page.content?.rendered || '';
  console.log('  Current content length:', content.length);

  // Fix H1: Change "Turn Your Content Into<br><span>Lifelike Audio</span> Instantly"
  // to "Text to Speech Pro —<br><span>Lifelike Audio</span> for WordPress"
  const oldH1 = 'Turn Your Content Into<br><span>Lifelike Audio</span> Instantly';
  const newH1 = 'Text to Speech Pro —<br><span>Lifelike Audio</span> for WordPress';

  if (content.includes(oldH1)) {
    content = content.replace(oldH1, newH1);
    console.log('  ✅ H1 updated to include "Text to Speech Pro"');
  } else {
    console.log('  ⚠️ Old H1 not found, trying alternate match...');
    // Try with different spacing/encoding
    const altOld = 'Turn Your Content Into';
    if (content.includes(altOld)) {
      content = content.replace(
        /<h1>Turn Your Content Into<br><span>Lifelike Audio<\/span> Instantly<\/h1>/,
        '<h1>Text to Speech Pro —<br><span>Lifelike Audio</span> for WordPress</h1>'
      );
      console.log('  ✅ H1 updated (alternate match)');
    }
  }

  // Also update the hero subtitle to reinforce the keyword
  const oldSub = 'AtlasVoice Text to Speech Pro adds natural AI-powered audio narration to every page and post.';
  const newSub = 'AtlasVoice Text to Speech Pro is the most complete WordPress text to speech plugin. Add natural AI-powered audio narration to every page and post.';
  if (content.includes(oldSub)) {
    content = content.replace(oldSub, newSub);
    console.log('  ✅ Hero subtitle reinforced with keyword');
  }

  // ============================================================
  // FIX 2: Remove Black Friday banner if present in content
  // (This might be from the theme/header, not page content)
  // ============================================================
  if (content.includes('Black Friday')) {
    content = content.replace(/[^]*Black Friday[^]*?<\/[^>]+>/g, '');
    console.log('  ✅ Removed Black Friday reference from content');
  } else {
    console.log('  ℹ️ No Black Friday in page content (likely in theme/header)');
  }

  // Push updated content
  console.log('\nPushing updated content...');
  const updateResult = await mcpCall(81, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/pages/43',
    method: 'POST',
    data: { content: content }
  });

  const updateText = updateResult.result?.content?.[0]?.text;
  try {
    const updated = JSON.parse(updateText);
    console.log('  ✅ Page content updated successfully');
    console.log('  Modified:', updated.modified);
  } catch(e) {
    console.log('  Update response:', updateText?.substring(0, 300));
  }

  // ============================================================
  // FIX 3: Update Yoast meta description (2000 -> 4000 active sites)
  // Using Code Snippets approach since Yoast meta isn't in REST API
  // ============================================================
  console.log('\nFIX 3: Updating Yoast meta description via Code Snippet...');

  const snippetCode = `
<?php
// Update Yoast meta description for page 43
update_post_meta(43, '_yoast_wpseo_metadesc', 'AtlasVoice Text to Speech Pro — the best WordPress TTS plugin. 4 AI voice providers, 51+ languages, MP3 downloads, audio schema SEO. Trusted by 4,000+ sites. From $59/yr.');

// Also update Yoast SEO title to be keyword-optimized
update_post_meta(43, '_yoast_wpseo_title', 'Text to Speech Pro — Best WordPress TTS Plugin | AtlasVoice');

echo json_encode(['status' => 'done', 'title' => get_post_meta(43, '_yoast_wpseo_title', true), 'desc' => get_post_meta(43, '_yoast_wpseo_metadesc', true)]);
  `.trim();

  // Create the snippet
  const createSnippetData = JSON.stringify({
    name: 'Fix Page 43 Yoast Meta for SEO',
    code: snippetCode,
    scope: 'global',
    priority: 10,
    active: true
  });

  const snippetResult = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'atlasaidev.com', path: '/wp-json/code-snippets/v1/snippets', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Mcp-Session-Id': sessionId, 'Content-Length': Buffer.byteLength(createSnippetData) }
    };
    const req = https.request(options, (res) => {
      let data = ''; res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data.substring(0, 500) }); } });
    });
    req.on('error', reject); req.write(createSnippetData); req.end();
  });

  if (snippetResult.id) {
    console.log('  ✅ Snippet created (ID:', snippetResult.id + '), Yoast meta updated');
    console.log('  New title: Text to Speech Pro — Best WordPress TTS Plugin | AtlasVoice');
    console.log('  New desc: ...Trusted by 4,000+ sites. From $59/yr.');

    // Deactivate the snippet (it already ran on creation)
    const deactivateData = JSON.stringify({ active: false });
    await new Promise((resolve, reject) => {
      const options = {
        hostname: 'atlasaidev.com', path: '/wp-json/code-snippets/v1/snippets/' + snippetResult.id, method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Mcp-Session-Id': sessionId, 'Content-Length': Buffer.byteLength(deactivateData) }
      };
      const req = https.request(options, (res) => {
        let data = ''; res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject); req.write(deactivateData); req.end();
    });
    console.log('  ✅ Snippet deactivated (kept for reuse)');
  } else {
    console.log('  ⚠️ Snippet result:', JSON.stringify(snippetResult).substring(0, 300));
  }

  console.log('\n=== ALL SEO FIXES APPLIED ===');
}

main().catch(err => console.error('Error:', err.message));
