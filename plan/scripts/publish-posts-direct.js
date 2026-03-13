const https = require('https');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F0bGFzYWlkZXYuY29tIiwiaWF0IjoxNzcyODY0MzY1LCJleHAiOjE3NzU0NTYzNjUsInVzZXJfaWQiOjIsImp0aSI6IjgyWVJsejI4N2IzZThJR2xnb1VLQUFpOWRabmo1U0F5In0.T7-8CPzRAzt6AlYKZYXYyZHKrFJFpx01H-4_6eP5o7g';

function wpRestCall(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const options = {
      hostname: 'atlasaidev.com',
      path: '/wp-json' + path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      }
    };
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data.substring(0, 1000), statusCode: res.statusCode }); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  // Test: get current server time
  console.log('Testing REST API...');
  const test = await wpRestCall('GET', '/wp/v2/posts/4173?_fields=id,status,date,slug,link');
  console.log('Post 4173:', JSON.stringify(test).substring(0, 300));

  // Update each post with current date and publish status
  const now = '2026-03-10T05:50:00';
  const posts = [4173, 4175, 4176, 4177];

  for (const id of posts) {
    console.log(`\nPublishing post ${id}...`);
    const result = await wpRestCall('POST', `/wp/v2/posts/${id}`, {
      status: 'publish',
      date: now
    });
    console.log(`  -> status=${result.status} slug=${result.slug} link=${result.link}`);
    if (result.code) console.log(`  -> error: ${result.code} ${result.message}`);
  }
}

main().catch(console.error);
