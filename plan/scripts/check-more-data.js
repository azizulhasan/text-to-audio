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
  // Get all categories
  console.log('=== ALL CATEGORIES ===');
  const catResult = await mcpCall(1, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/categories?per_page=50&_fields=id,name,slug,count',
    method: 'GET'
  });
  const catText = catResult.result?.content?.[0]?.text;
  try {
    const data = JSON.parse(catText);
    const cats = data.results || data;
    if (Array.isArray(cats)) {
      cats.forEach(c => console.log(`  ID ${c.id}: "${c.name}" (slug: ${c.slug}, count: ${c.count})`));
    } else {
      console.log(JSON.stringify(data).substring(0, 500));
    }
  } catch(e) {
    console.log('Raw:', catText?.substring(0, 500));
  }

  // Get all media images (more)
  console.log('\n=== ALL MEDIA (50) ===');
  const mediaResult = await mcpCall(2, 'awfah-rest-api-run-api-function', {
    route: '/wp/v2/media?per_page=50&media_type=image&_fields=id,title,source_url',
    method: 'GET'
  });
  const mediaText = mediaResult.result?.content?.[0]?.text;
  try {
    const data = JSON.parse(mediaText);
    const media = data.results || data;
    if (Array.isArray(media)) {
      media.forEach(m => console.log(`  ID ${m.id}: "${m.title?.rendered}" — ${m.source_url}`));
    } else {
      console.log(JSON.stringify(data).substring(0, 500));
    }
  } catch(e) {
    console.log('Raw:', mediaText?.substring(0, 500));
  }

  // Check existing popular posts for their featured images
  console.log('\n=== POPULAR POSTS WITH FEATURED IMAGES ===');
  const slugs = ['best-text-to-speech-book-readers', 'how-to-add-text-to-speech-on-a-website', 'what-is-text-to-speech-accommodation'];
  for (const slug of slugs) {
    const result = await mcpCall(10, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts?slug=${slug}&_fields=id,title,featured_media,categories`,
      method: 'GET'
    });
    const text = result.result?.content?.[0]?.text;
    try {
      const data = JSON.parse(text);
      const posts = data.results || data;
      if (Array.isArray(posts) && posts.length > 0) {
        console.log(`  ${slug}: ID ${posts[0].id}, featured_media: ${posts[0].featured_media}, categories: [${posts[0].categories}]`);
      }
    } catch(e) {
      console.log(`  ${slug}: error`);
    }
  }
}

main().catch(err => console.error('Error:', err.message));
