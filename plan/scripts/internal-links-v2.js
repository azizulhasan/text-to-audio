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

function parseResponse(result) {
  const text = result.result?.content?.[0]?.text;
  if (!text) return null;
  const data = JSON.parse(text);
  // Handle both direct array and {results: [...]} wrapper
  if (data.results) return data.results;
  return data;
}

const relatedPostsBlock = (links) => {
  const items = links.map(l => `<li><a href="${l.url}">${l.text}</a></li>`).join('\n');
  return `\n\n<!-- wp:heading -->
<h2>Related Articles</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
${items}
</ul>
<!-- /wp:list -->`;
};

async function main() {
  // New post URLs
  const newPosts = {
    aiComparison: { url: 'https://atlasaidev.com/google-cloud-tts-vs-openai-vs-elevenlabs/', text: 'Google Cloud TTS vs OpenAI vs ElevenLabs: Complete AI Voice Comparison' },
    accessibility: { url: 'https://atlasaidev.com/text-to-speech-accommodation-accessibility-guide/', text: 'Text to Speech Accommodation: WCAG & ADA Accessibility Guide' },
    howToAdd: { url: 'https://atlasaidev.com/how-to-add-text-to-speech-to-website/', text: 'How to Add Text to Speech to Any Website: 5 Methods Explained' },
    comparison: { url: 'https://atlasaidev.com/wordpress-text-to-speech-plugins-compared/', text: 'Best WordPress Text to Speech Plugin: 6 Top Plugins Compared' },
    product: { url: 'https://atlasaidev.com/plugins/text-to-speech-pro/', text: 'AtlasVoice Text to Speech Pro — Try Free' },
    bookReaders: { url: 'https://atlasaidev.com/best-text-to-speech-book-readers/', text: 'Best Text to Speech Book Readers' },
    existingAccommodation: { url: 'https://atlasaidev.com/what-is-text-to-speech-accommodation/', text: 'What Is Text to Speech Accommodation?' },
    existingHowToAdd: { url: 'https://atlasaidev.com/how-to-add-text-to-speech-on-a-website/', text: 'How to Add Text to Speech on a Website' },
    existingHowToUse: { url: 'https://atlasaidev.com/how-to-use-text-to-speech-on-any-device/', text: 'How to Use Text to Speech on Any Device' },
    existingBestPlugin: { url: 'https://atlasaidev.com/best-text-to-speech-wordpress-plugin/', text: 'Best Text to Speech WordPress Plugin' }
  };

  // Step 1: Find existing post IDs by slug
  console.log('Step 1: Finding existing post IDs...');
  const slugToId = {};
  const slugs = [
    'best-text-to-speech-book-readers',
    'how-to-add-text-to-speech-on-a-website',
    'what-is-text-to-speech-accommodation',
    'how-to-use-text-to-speech-on-any-device',
    'best-text-to-speech-wordpress-plugin'
  ];

  for (const slug of slugs) {
    const result = await mcpCall(100, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts?slug=${slug}`,
      method: 'GET'
    });
    const posts = parseResponse(result);
    if (Array.isArray(posts) && posts.length > 0) {
      slugToId[slug] = posts[0].id;
      console.log(`  Found: ${slug} -> ID ${posts[0].id}`);
    } else {
      console.log(`  Not found: ${slug}`);
    }
  }

  // Step 2: Add internal links to existing high-traffic posts
  console.log('\nStep 2: Adding internal links to existing posts...');

  const existingPostLinks = [
    {
      slug: 'best-text-to-speech-book-readers',
      description: 'Book readers page (top traffic)',
      links: [newPosts.comparison, newPosts.aiComparison, newPosts.accessibility, newPosts.howToAdd, newPosts.product]
    },
    {
      slug: 'how-to-add-text-to-speech-on-a-website',
      description: 'How to add TTS page',
      links: [newPosts.comparison, newPosts.aiComparison, newPosts.accessibility, newPosts.bookReaders, newPosts.product]
    },
    {
      slug: 'what-is-text-to-speech-accommodation',
      description: 'TTS accommodation page',
      links: [newPosts.comparison, newPosts.howToAdd, newPosts.aiComparison, newPosts.bookReaders, newPosts.product]
    },
    {
      slug: 'how-to-use-text-to-speech-on-any-device',
      description: 'How to use TTS (90K impressions)',
      links: [newPosts.comparison, newPosts.aiComparison, newPosts.accessibility, newPosts.howToAdd, newPosts.product]
    },
    {
      slug: 'best-text-to-speech-wordpress-plugin',
      description: 'Best WP TTS plugin page',
      links: [newPosts.comparison, newPosts.aiComparison, newPosts.howToAdd, newPosts.accessibility, newPosts.product]
    }
  ];

  for (const item of existingPostLinks) {
    const postId = slugToId[item.slug];
    if (!postId) {
      console.log(`  Skipping ${item.slug} — not found`);
      continue;
    }

    console.log(`\n  Processing: ${item.description} (ID ${postId})...`);

    // Get existing content
    const getResult = await mcpCall(200, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${postId}`,
      method: 'GET'
    });
    const post = parseResponse(getResult);
    if (!post) {
      console.log('    Could not fetch post content');
      continue;
    }

    const existingContent = post.content?.rendered || post.content?.raw || '';

    if (existingContent.includes('Related Articles')) {
      console.log('    Already has "Related Articles" section, skipping');
      continue;
    }

    // Append related posts block
    const updatedContent = existingContent + relatedPostsBlock(item.links);

    const updateResult = await mcpCall(201, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${postId}`,
      method: 'POST',
      data: { content: updatedContent }
    });
    const updated = parseResponse(updateResult);
    if (updated?.id) {
      console.log(`    ✅ Internal links added to post ${updated.id}`);
    } else {
      console.log('    Update result:', JSON.stringify(updated)?.substring(0, 200));
    }
  }

  // Step 3: Add internal links to NEW posts
  console.log('\n\nStep 3: Cross-linking new posts...');

  const newPostUpdates = [
    { id: 4154, desc: 'AI voice comparison', links: [newPosts.comparison, newPosts.accessibility, newPosts.howToAdd, newPosts.existingBestPlugin, newPosts.bookReaders] },
    { id: 4155, desc: 'Accessibility guide', links: [newPosts.comparison, newPosts.aiComparison, newPosts.howToAdd, newPosts.existingAccommodation, newPosts.bookReaders] },
    { id: 4156, desc: 'How to add TTS', links: [newPosts.comparison, newPosts.aiComparison, newPosts.accessibility, newPosts.existingHowToAdd, newPosts.bookReaders] },
    { id: 4160, desc: 'Comparison post', links: [newPosts.aiComparison, newPosts.howToAdd, newPosts.accessibility, newPosts.existingBestPlugin, newPosts.bookReaders] }
  ];

  for (const item of newPostUpdates) {
    console.log(`  Processing: ${item.desc} (ID ${item.id})...`);

    const getResult = await mcpCall(300, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${item.id}`,
      method: 'GET'
    });
    const post = parseResponse(getResult);
    if (!post) {
      console.log('    Could not fetch');
      continue;
    }

    const existingContent = post.content?.rendered || post.content?.raw || '';
    if (existingContent.includes('Related Articles')) {
      console.log('    Already has Related Articles, skipping');
      continue;
    }

    const updatedContent = existingContent + relatedPostsBlock(item.links);

    const updateResult = await mcpCall(301, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${item.id}`,
      method: 'POST',
      data: { content: updatedContent }
    });
    const updated = parseResponse(updateResult);
    if (updated?.id) {
      console.log(`    ✅ Internal links added to post ${updated.id}`);
    } else {
      console.log('    Result:', JSON.stringify(updated)?.substring(0, 200));
    }
  }

  console.log('\n=== INTERNAL LINKING COMPLETE ===');
}

main().catch(err => console.error('Error:', err.message));
