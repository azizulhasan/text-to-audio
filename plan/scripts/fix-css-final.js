const https = require('https');
const fs = require('fs');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';
const sessionId = 'e726a59a-7486-4fe1-9c14-d9689ede5ae4';

function mcpCall(id, toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: toolName, arguments: args } });
    const options = { hostname: 'atlasaidev.com', path: '/wp-json/awfah_mcp/mcp', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Mcp-Session-Id': sessionId, 'Content-Length': Buffer.byteLength(postData) } };
    const req = https.request(options, (res) => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data.substring(0, 500) }); } }); });
    req.on('error', reject); req.write(postData); req.end();
  });
}

async function main() {
  // Read from the PLAN folder location
  let content = fs.readFileSync('D:/xampp/htdocs/azizulhasan/tts/wp-content/plugins/text-to-audio/plan/scripts/tts-pro-new-page.html', 'utf8');

  // Apply H1 keyword fix
  content = content.replace(
    'Turn Your Content Into<br><span>Lifelike Audio</span> Instantly',
    'Text to Speech Pro —<br><span>Lifelike Audio</span> for WordPress'
  );

  // Apply subtitle keyword reinforcement
  content = content.replace(
    'AtlasVoice Text to Speech Pro adds natural AI-powered audio narration to every page and post.',
    'AtlasVoice Text to Speech Pro is the most complete WordPress text to speech plugin. Add natural AI-powered audio narration to every page and post.'
  );

  // Add GA4 tracking in purchaseCompleted callback
  content = content.replace(
    "console.log('Purchase completed:', response);",
    `console.log('Purchase completed:', response);
        // GA4 purchase event
        if (typeof gtag === 'function' && response && response.purchase) {
          gtag('event', 'purchase', {
            transaction_id: 'fs_' + (response.purchase.id || Date.now()),
            value: parseFloat(response.purchase.initial_amount || 0),
            currency: (response.purchase.currency || 'usd').toUpperCase(),
            items: [{ item_id: 'tts-pro', item_name: 'AtlasVoice TTS Pro', price: parseFloat(response.purchase.initial_amount || 0), quantity: 1 }]
          });
        }`
  );

  console.log('Content length:', content.length, 'Has <style>:', content.includes('<style>'));

  const result = await mcpCall(120, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/pages/43', method: 'POST', data: { content: content }
  });

  const text = result.result?.content?.[0]?.text;
  try {
    const page = JSON.parse(text);
    console.log('✅ Page 43 re-pushed with CSS + H1 + GA4');
    console.log('  Has <style>:', (page.content?.rendered || '').includes('<style>'));
    console.log('  Modified:', page.modified);
  } catch(e) { console.log('Response:', text?.substring(0, 300)); }
}

main().catch(err => console.error('Error:', err.message));
