const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';
const sessionId = 'e726a59a-7486-4fe1-9c14-d9689ede5ae4';

function mcpCall(id, toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: id,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    });
    const options = {
      hostname: 'atlasaidev.com',
      path: '/wp-json/awfah_mcp/mcp',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    // Delete the temporary snippets (IDs 21, 22, 23)
    console.log('Cleaning up temporary Code Snippets...');
    for (const snippetId of [21, 22, 23]) {
      const result = await mcpCall(snippetId, 'awfah-rest-api-run-api-function', {
        route: '/code-snippets/v1/snippets/' + snippetId,
        method: 'DELETE',
        data: {}
      });
      const text = result.result?.content?.[0]?.text;
      console.log(`  Snippet ${snippetId}: ${text ? 'deleted' : 'error'}`);
    }

    // Final verification - all posts
    console.log('\n=== FINAL VERIFICATION: ALL UPDATED POSTS ===\n');
    const postIds = [3383, 2182, 3497, 3477, 3085, 1930, 3231, 3256, 3534, 3421, 3351, 3074, 3142];
    const postsUrl = `https://atlasaidev.com/wp-json/wp/v2/posts?include=${postIds.join(',')}&_fields=id,title,slug,yoast_head_json&per_page=20`;

    const posts = await new Promise((resolve, reject) => {
      https.get(postsUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    console.log('BLOG POSTS:');
    posts.forEach(p => {
      const title = p.title?.rendered?.replace(/&amp;/g, '&').replace(/&#8211;/g, '-');
      const seoTitle = p.yoast_head_json?.title || 'N/A';
      const desc = (p.yoast_head_json?.description || 'N/A').substring(0, 90);
      console.log(`  [${p.id}] ${title}`);
      console.log(`    SEO: ${seoTitle}`);
      console.log(`    Meta: ${desc}...`);
      console.log('');
    });

    // Verify pages
    console.log('\n=== FINAL VERIFICATION: ALL UPDATED PAGES ===\n');
    const pageIds = [40, 43, 44, 2755, 2115, 2673];
    const pagesUrl = `https://atlasaidev.com/wp-json/wp/v2/pages?include=${pageIds.join(',')}&_fields=id,title,slug,yoast_head_json&per_page=10`;

    const pages = await new Promise((resolve, reject) => {
      https.get(pagesUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    console.log('PAGES:');
    pages.forEach(p => {
      const title = p.title?.rendered?.replace(/&amp;/g, '&').replace(/&#8211;/g, '-');
      const seoTitle = p.yoast_head_json?.title || 'N/A';
      const desc = (p.yoast_head_json?.description || 'N/A').substring(0, 90);
      console.log(`  [${p.id}] ${title}`);
      console.log(`    SEO: ${seoTitle}`);
      console.log(`    Meta: ${desc}...`);
      console.log('');
    });

    console.log('=== CLEANUP AND VERIFICATION COMPLETE ===');
  } catch(err) {
    console.error('Error:', err.message);
  }
}

main();
