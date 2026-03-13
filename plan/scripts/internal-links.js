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

// Internal link block to append to existing posts
const relatedPostsBlock = (links) => {
  const items = links.map(l => `<li><a href="${l.url}">${l.text}</a></li>`).join('\n');
  return `

<!-- wp:heading -->
<h2>Related Articles</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
${items}
</ul>
<!-- /wp:list -->`;
};

async function main() {
  // Step 1: Get the top existing blog posts that need internal links
  const slugsToCheck = [
    'best-text-to-speech-book-readers',
    'how-to-add-text-to-speech-on-a-website',
    'what-is-text-to-speech-accommodation',
    'how-to-use-text-to-speech-on-any-device',
    'best-text-to-speech-wordpress-plugin'
  ];

  console.log('Step 1: Fetching existing blog posts...');

  for (const slug of slugsToCheck) {
    const result = await mcpCall(100, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts?slug=${slug}&_fields=id,slug,title,link`,
      method: 'GET'
    });

    const text = result.result?.content?.[0]?.text;
    try {
      const posts = JSON.parse(text);
      if (posts.length > 0) {
        console.log(`  Found: ID ${posts[0].id} — ${posts[0].slug} — ${posts[0].link}`);
      } else {
        // Try pages
        const pageResult = await mcpCall(101, 'awfah-rest-api-run-api-function', {
          route: `/wp/v2/pages?slug=${slug}&_fields=id,slug,title,link`,
          method: 'GET'
        });
        const pageText = pageResult.result?.content?.[0]?.text;
        const pages = JSON.parse(pageText);
        if (pages.length > 0) {
          console.log(`  Found (page): ID ${pages[0].id} — ${pages[0].slug} — ${pages[0].link}`);
        } else {
          console.log(`  NOT FOUND: ${slug}`);
        }
      }
    } catch(e) {
      console.log(`  Error for ${slug}:`, text?.substring(0, 200));
    }
  }

  // Step 2: Add "Related Articles" section to each existing high-traffic post
  console.log('\nStep 2: Adding internal links to existing posts...');

  // New posts we created:
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

  // Links to add to each existing post (cross-link strategy)
  const linkSets = [
    {
      slug: 'best-text-to-speech-book-readers',
      description: 'Book readers page (top traffic)',
      links: [
        newPosts.aiComparison,
        newPosts.accessibility,
        newPosts.comparison,
        newPosts.howToAdd,
        newPosts.product
      ]
    },
    {
      slug: 'how-to-add-text-to-speech-on-a-website',
      description: 'How to add TTS page',
      links: [
        newPosts.aiComparison,
        newPosts.accessibility,
        newPosts.comparison,
        newPosts.bookReaders,
        newPosts.product
      ]
    },
    {
      slug: 'what-is-text-to-speech-accommodation',
      description: 'TTS accommodation page',
      links: [
        newPosts.howToAdd,
        newPosts.aiComparison,
        newPosts.comparison,
        newPosts.bookReaders,
        newPosts.product
      ]
    },
    {
      slug: 'how-to-use-text-to-speech-on-any-device',
      description: 'How to use TTS page (90K impressions)',
      links: [
        newPosts.aiComparison,
        newPosts.accessibility,
        newPosts.comparison,
        newPosts.howToAdd,
        newPosts.product
      ]
    },
    {
      slug: 'best-text-to-speech-wordpress-plugin',
      description: 'Best WP TTS plugin page',
      links: [
        newPosts.aiComparison,
        newPosts.howToAdd,
        newPosts.accessibility,
        newPosts.comparison,
        newPosts.product
      ]
    }
  ];

  for (const linkSet of linkSets) {
    console.log(`\n  Processing: ${linkSet.description} (${linkSet.slug})...`);

    // Get post ID and content
    const getResult = await mcpCall(200, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts?slug=${linkSet.slug}&_fields=id,content`,
      method: 'GET'
    });

    const getText = getResult.result?.content?.[0]?.text;
    let post;
    try {
      const posts = JSON.parse(getText);
      if (posts.length === 0) {
        console.log('    NOT FOUND as post, skipping...');
        continue;
      }
      post = posts[0];
    } catch(e) {
      console.log('    Error fetching:', getText?.substring(0, 200));
      continue;
    }

    const existingContent = post.content?.rendered || post.content?.raw || '';

    // Check if "Related Articles" already exists
    if (existingContent.includes('Related Articles') || existingContent.includes('related-articles')) {
      console.log('    Already has "Related Articles" section, skipping...');
      continue;
    }

    // Add related posts block to the end
    const appendContent = relatedPostsBlock(linkSet.links);

    // Use the REST API to append content
    const updateResult = await mcpCall(201, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${post.id}`,
      method: 'POST',
      data: { content: existingContent + appendContent }
    });

    const updateText = updateResult.result?.content?.[0]?.text;
    try {
      const updated = JSON.parse(updateText);
      console.log('    ✅ Internal links added to post ID', updated.id);
    } catch(e) {
      console.log('    Update result:', updateText?.substring(0, 200));
    }
  }

  // Step 3: Also add internal links to the NEW blog posts (cross-link them to each other)
  console.log('\n\nStep 3: Cross-linking new posts to each other...');

  const newPostUpdates = [
    {
      id: 4154, // AI voice comparison
      description: 'AI voice comparison post',
      links: [
        newPosts.comparison,
        newPosts.accessibility,
        newPosts.howToAdd,
        newPosts.existingBestPlugin,
        newPosts.bookReaders
      ]
    },
    {
      id: 4155, // Accessibility guide
      description: 'Accessibility guide post',
      links: [
        newPosts.comparison,
        newPosts.aiComparison,
        newPosts.howToAdd,
        newPosts.existingAccommodation,
        newPosts.bookReaders
      ]
    },
    {
      id: 4156, // How to add TTS
      description: 'How to add TTS post',
      links: [
        newPosts.comparison,
        newPosts.aiComparison,
        newPosts.accessibility,
        newPosts.existingHowToAdd,
        newPosts.bookReaders
      ]
    },
    {
      id: 4160, // Comparison post
      description: 'Comparison post',
      links: [
        newPosts.aiComparison,
        newPosts.howToAdd,
        newPosts.accessibility,
        newPosts.existingBestPlugin,
        newPosts.bookReaders
      ]
    }
  ];

  for (const update of newPostUpdates) {
    console.log(`  Processing: ${update.description} (ID ${update.id})...`);

    const getResult = await mcpCall(300, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${update.id}?_fields=id,content`,
      method: 'GET'
    });

    const getText = getResult.result?.content?.[0]?.text;
    let post;
    try {
      post = JSON.parse(getText);
    } catch(e) {
      console.log('    Error fetching:', getText?.substring(0, 200));
      continue;
    }

    const existingContent = post.content?.rendered || post.content?.raw || '';

    if (existingContent.includes('Related Articles')) {
      console.log('    Already has "Related Articles" section, skipping...');
      continue;
    }

    const appendContent = relatedPostsBlock(update.links);

    const updateResult = await mcpCall(301, 'awfah-rest-api-run-api-function', {
      route: `/wp/v2/posts/${update.id}`,
      method: 'POST',
      data: { content: existingContent + appendContent }
    });

    const updateText = updateResult.result?.content?.[0]?.text;
    try {
      const updated = JSON.parse(updateText);
      console.log('    ✅ Internal links added to post ID', updated.id);
    } catch(e) {
      console.log('    Update result:', updateText?.substring(0, 200));
    }
  }

  console.log('\n=== INTERNAL LINKING COMPLETE ===');
}

main().catch(err => console.error('Error:', err.message));
