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
  // Read the new page HTML
  const newContent = fs.readFileSync('D:/xampp/htdocs/azizulhasan/tts/wp-content/plugins/text-to-audio/scripts/tts-pro-new-page.html', 'utf8');
  console.log('New page content length:', newContent.length, 'chars');

  // Update page ID 43 (Text to Speech Pro product page)
  console.log('\nUpdating Page 43 (Text to Speech Pro) with new content...');
  const result = await mcpCall(70, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/pages/43',
    method: 'POST',
    data: { content: newContent }
  });

  const text = result.result?.content?.[0]?.text;
  if (text) {
    try {
      const page = JSON.parse(text);
      console.log('SUCCESS! Page updated.');
      console.log('  Title:', page.title?.rendered || page.title?.raw);
      console.log('  Modified:', page.modified);
      console.log('  Status:', page.status);
      console.log('  Link:', page.link);
      console.log('  Content length:', (page.content?.rendered || page.content?.raw || '').length);
    } catch(e) {
      console.log('Response (not JSON):', text.substring(0, 500));
    }
  } else {
    console.log('Full result:', JSON.stringify(result).substring(0, 1000));
  }
}

main().catch(err => console.error('Error:', err.message));
