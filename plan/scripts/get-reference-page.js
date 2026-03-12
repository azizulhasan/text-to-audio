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
  // Get AI Agent Hub Pro page (ID 4125) as reference
  const result = await mcpCall(50, 'awfah-pages-wp-get-page', { id: 4125, context: 'edit' });
  const text = result.result?.content?.[0]?.text;
  if (text) {
    const page = JSON.parse(text);
    const content = page.content?.raw || '';
    console.log('AI Agent Hub Pro page - content length:', content.length);
    fs.writeFileSync('D:/xampp/htdocs/azizulhasan/tts/wp-content/plugins/text-to-audio/scripts/ai-agent-hub-pro-reference.html', content);
    console.log('Saved to ai-agent-hub-pro-reference.html');

    // Extract text content for structure analysis
    const textParts = content.match(/>([^<]{3,})</g);
    if (textParts) {
      console.log('\n=== PAGE STRUCTURE (Text Content) ===');
      textParts.forEach(t => {
        const cleaned = t.replace(/^>/, '').replace(/<$/, '').trim();
        if (cleaned.length > 3 && !/^[\s\n]+$/.test(cleaned) && !/^\{/.test(cleaned)) {
          console.log('- ' + cleaned.substring(0, 120));
        }
      });
    }
  }

  // Also get the current text-to-speech-pro page (ID 43)
  const result2 = await mcpCall(51, 'awfah-pages-wp-get-page', { id: 43, context: 'edit' });
  const text2 = result2.result?.content?.[0]?.text;
  if (text2) {
    const page2 = JSON.parse(text2);
    const content2 = page2.content?.raw || '';
    console.log('\n\nText to Speech Pro page - content length:', content2.length);
    fs.writeFileSync('D:/xampp/htdocs/azizulhasan/tts/wp-content/plugins/text-to-audio/scripts/tts-pro-current.html', content2);
    console.log('Saved to tts-pro-current.html');

    const textParts2 = content2.match(/>([^<]{3,})</g);
    if (textParts2) {
      console.log('\n=== CURRENT TTS PRO PAGE STRUCTURE ===');
      textParts2.forEach(t => {
        const cleaned = t.replace(/^>/, '').replace(/<$/, '').trim();
        if (cleaned.length > 3 && !/^[\s\n]+$/.test(cleaned) && !/^\{/.test(cleaned)) {
          console.log('- ' + cleaned.substring(0, 120));
        }
      });
    }
  }
}

main().catch(err => console.error('Error:', err.message));
