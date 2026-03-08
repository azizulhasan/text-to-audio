const https = require('https');
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
  // Get categories
  console.log('=== CATEGORIES ===');
  const catResult = await mcpCall(1, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/categories?per_page=50',
    method: 'GET'
  });
  const catText = catResult.result?.content?.[0]?.text;
  try {
    const cats = JSON.parse(catText);
    cats.forEach(c => console.log(`  ID ${c.id}: ${c.name} (slug: ${c.slug}, count: ${c.count})`));
  } catch(e) {
    console.log('Categories result:', catText?.substring(0, 500));
  }

  // Get media library to find available images
  console.log('\n=== RECENT MEDIA (last 20) ===');
  const mediaResult = await mcpCall(2, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/media?per_page=20&_fields=id,title,source_url,media_type',
    method: 'GET'
  });
  const mediaText = mediaResult.result?.content?.[0]?.text;
  try {
    const media = JSON.parse(mediaText);
    media.forEach(m => console.log(`  ID ${m.id}: ${m.title?.rendered} — ${m.source_url}`));
  } catch(e) {
    console.log('Media result:', mediaText?.substring(0, 500));
  }

  // Check what categories existing popular posts use
  console.log('\n=== EXISTING POST CATEGORIES ===');
  const existingResult = await mcpCall(3, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/posts?per_page=10&_fields=id,title,categories,featured_media&orderby=date&order=desc',
    method: 'GET'
  });
  const existingText = existingResult.result?.content?.[0]?.text;
  try {
    const posts = JSON.parse(existingText);
    posts.forEach(p => console.log(`  ID ${p.id}: "${p.title?.rendered}" — categories: [${p.categories}] — featured_media: ${p.featured_media}`));
  } catch(e) {
    console.log('Posts result:', existingText?.substring(0, 500));
  }
}

main().catch(err => console.error('Error:', err.message));
