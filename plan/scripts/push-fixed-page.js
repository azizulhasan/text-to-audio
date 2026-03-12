const https = require('https');
const fs = require('fs');
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
  // Read the original HTML file
  let content = fs.readFileSync('D:/xampp/htdocs/azizulhasan/tts/wp-content/plugins/text-to-audio/scripts/tts-pro-new-page.html', 'utf8');
  console.log('Original content length:', content.length, 'chars');
  console.log('Has <style> tag:', content.includes('<style>'));
  console.log('Has tts-hero class:', content.includes('tts-hero'));

  // Apply H1 fix directly on the source file content
  const oldH1 = 'Turn Your Content Into<br><span>Lifelike Audio</span> Instantly';
  const newH1 = 'Text to Speech Pro —<br><span>Lifelike Audio</span> for WordPress';

  if (content.includes(oldH1)) {
    content = content.replace(oldH1, newH1);
    console.log('✅ H1 keyword fix applied');
  } else {
    console.log('⚠️ H1 already fixed or not found');
  }

  // Also reinforce subtitle with keyword
  const oldSub = 'AtlasVoice Text to Speech Pro adds natural AI-powered audio narration to every page and post.';
  const newSub = 'AtlasVoice Text to Speech Pro is the most complete WordPress text to speech plugin. Add natural AI-powered audio narration to every page and post.';
  if (content.includes(oldSub)) {
    content = content.replace(oldSub, newSub);
    console.log('✅ Subtitle keyword reinforcement applied');
  }

  console.log('Final content length:', content.length, 'chars');
  console.log('Still has <style> tag:', content.includes('<style>'));

  // Push to Page 43
  console.log('\nPushing complete HTML with style tag to Page 43...');
  const result = await mcpCall(100, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/pages/43',
    method: 'POST',
    data: { content: content }
  });

  const text = result.result?.content?.[0]?.text;
  try {
    const page = JSON.parse(text);
    console.log('✅ Page updated successfully');
    console.log('  Modified:', page.modified);
    console.log('  Content length:', (page.content?.rendered || page.content?.raw || '').length);

    // Check if style tag survived
    const renderedContent = page.content?.rendered || page.content?.raw || '';
    console.log('  Has <style> in response:', renderedContent.includes('<style>'));
    console.log('  Has tts-hero in response:', renderedContent.includes('tts-hero'));

    // Show first 500 chars of rendered content
    console.log('  Content preview:', renderedContent.substring(0, 300));
  } catch(e) {
    console.log('Response:', text?.substring(0, 500));
  }
}

main().catch(err => console.error('Error:', err.message));
