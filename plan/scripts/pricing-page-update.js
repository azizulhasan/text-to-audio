const https = require('https');
const fs = require('fs');
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

// New sections to insert between pricing cards and money-back guarantee
const newSections = `
<!-- wp:html -->
<style>
.atl-pricing-features { max-width: 900px; margin: 60px auto 0; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.atl-pricing-features h2 { text-align: center; font-size: 32px; color: #1a1a2e; margin-bottom: 8px; }
.atl-pricing-features .atl-subtitle { text-align: center; color: #555; font-size: 17px; margin-bottom: 40px; }
.atl-social-proof { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; margin: 40px 0 50px; }
.atl-proof-item { text-align: center; }
.atl-proof-number { font-size: 36px; font-weight: 700; color: #2563eb; display: block; }
.atl-proof-label { font-size: 14px; color: #666; }
.atl-stars { color: #f59e0b; font-size: 20px; }

.atl-comparison-table { width: 100%; border-collapse: collapse; margin: 0 auto 40px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.atl-comparison-table th { background: #1a1a2e; color: #fff; padding: 14px 16px; font-size: 15px; text-align: left; }
.atl-comparison-table th:nth-child(2), .atl-comparison-table th:nth-child(3) { text-align: center; width: 100px; }
.atl-comparison-table td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; color: #333; }
.atl-comparison-table td:nth-child(2), .atl-comparison-table td:nth-child(3) { text-align: center; }
.atl-comparison-table tr:last-child td { border-bottom: none; }
.atl-comparison-table .atl-check { color: #22c55e; font-weight: bold; font-size: 18px; }
.atl-comparison-table .atl-cross { color: #ccc; font-size: 18px; }
.atl-comparison-table .atl-category { background: #f8fafc; font-weight: 600; color: #1a1a2e; font-size: 14px; }
.atl-comparison-table .atl-category td { border-bottom: 2px solid #e2e8f0; }
.atl-comparison-table .atl-highlight { background: #eff6ff; }

.atl-included-section { margin: 50px 0 0; }
.atl-included-section h3 { text-align: center; font-size: 24px; color: #1a1a2e; margin-bottom: 30px; }
.atl-included-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
.atl-included-item { display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: #f8fafc; border-radius: 8px; }
.atl-included-icon { font-size: 22px; flex-shrink: 0; }
.atl-included-text strong { display: block; color: #1a1a2e; margin-bottom: 2px; font-size: 15px; }
.atl-included-text span { color: #666; font-size: 13px; }

@media (max-width: 768px) {
  .atl-social-proof { gap: 20px; }
  .atl-proof-number { font-size: 28px; }
  .atl-comparison-table { font-size: 13px; }
  .atl-comparison-table th, .atl-comparison-table td { padding: 10px 8px; }
}
</style>

<div class="atl-pricing-features">

  <!-- Social Proof Bar -->
  <div class="atl-social-proof">
    <div class="atl-proof-item">
      <span class="atl-proof-number">315,000+</span>
      <span class="atl-proof-label">Downloads</span>
    </div>
    <div class="atl-proof-item">
      <span class="atl-proof-number"><span class="atl-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span></span>
      <span class="atl-proof-label">4.8/5 Rating (83 reviews)</span>
    </div>
    <div class="atl-proof-item">
      <span class="atl-proof-number">2,000+</span>
      <span class="atl-proof-label">Active Websites</span>
    </div>
    <div class="atl-proof-item">
      <span class="atl-proof-number">4</span>
      <span class="atl-proof-label">AI Voice Providers</span>
    </div>
  </div>

  <!-- Free vs Pro Comparison -->
  <h2>Free vs Pro — What You Get</h2>
  <p class="atl-subtitle">Every Pro plan includes ALL premium features. Plans only differ by number of sites.</p>

  <table class="atl-comparison-table">
    <thead>
      <tr>
        <th>Feature</th>
        <th>Free</th>
        <th>Pro</th>
      </tr>
    </thead>
    <tbody>
      <tr class="atl-category"><td colspan="3">Voice Providers</td></tr>
      <tr><td>Browser Voices (20-300+)</td><td class="atl-check">&#10003;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>AtlasVoice AI (63 languages, included free)</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>Google Cloud TTS (300+ voices, 90+ languages)</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>OpenAI / ChatGPT Voices (6 HD voices)</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>ElevenLabs TTS (100+ ultra-realistic voices)</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>

      <tr class="atl-category"><td colspan="3">Audio Generation</td></tr>
      <tr><td>Real-time browser playback</td><td class="atl-check">&#10003;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>MP3 file generation</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>Bulk MP3 for hundreds of posts</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>Downloadable MP3 for visitors</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>Google Cloud Storage backup</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>

      <tr class="atl-category"><td colspan="3">Player &amp; Customization</td></tr>
      <tr><td>Audio player with basic controls</td><td class="atl-check">&#10003;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>6 player styles (Default, Pro, Google, ChatGPT, ElevenLabs)</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>Floating / sticky player</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>Speed, pitch, and volume controls</td><td class="atl-check">&#10003;</td><td class="atl-check">&#10003;</td></tr>

      <tr class="atl-category"><td colspan="3">Content Control</td></tr>
      <tr><td>Shortcode &amp; Gutenberg block</td><td class="atl-check">&#10003;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>CSS selector targeting</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>Content splitting for long articles</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>Custom intro &amp; outro messages</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>Exclude specific text, tags, posts, categories</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>

      <tr class="atl-category"><td colspan="3">SEO &amp; Analytics</td></tr>
      <tr><td>Basic analytics</td><td class="atl-check">&#10003;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>Advanced analytics (funnels, heatmaps, segments)</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>Audio Schema markup (SEO rich results)</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>

      <tr class="atl-category"><td colspan="3">Developer &amp; Support</td></tr>
      <tr><td>Standard support</td><td class="atl-check">&#10003;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>Priority support (1-hour response)</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr><td>REST API &amp; 50+ hooks/filters</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
      <tr class="atl-highlight"><td>51+ language support with WPML &amp; GTranslate</td><td class="atl-cross">&#8212;</td><td class="atl-check">&#10003;</td></tr>
    </tbody>
  </table>

  <!-- What's Included in Every Pro Plan -->
  <div class="atl-included-section">
    <h3>What's Included in Every Pro Plan</h3>
    <div class="atl-included-grid">
      <div class="atl-included-item">
        <span class="atl-included-icon">&#127908;</span>
        <div class="atl-included-text">
          <strong>AtlasVoice AI Voices</strong>
          <span>63 languages, natural voices — included at no extra cost</span>
        </div>
      </div>
      <div class="atl-included-item">
        <span class="atl-included-icon">&#9729;&#65039;</span>
        <div class="atl-included-text">
          <strong>4 AI Voice Providers</strong>
          <span>Google Cloud, OpenAI, ElevenLabs + AtlasVoice built-in</span>
        </div>
      </div>
      <div class="atl-included-item">
        <span class="atl-included-icon">&#128190;</span>
        <div class="atl-included-text">
          <strong>Bulk MP3 Generation</strong>
          <span>Generate audio files for hundreds of posts automatically</span>
        </div>
      </div>
      <div class="atl-included-item">
        <span class="atl-included-icon">&#128200;</span>
        <div class="atl-included-text">
          <strong>Advanced Analytics</strong>
          <span>Engagement funnels, heatmaps, device tracking, peak hours</span>
        </div>
      </div>
      <div class="atl-included-item">
        <span class="atl-included-icon">&#128269;</span>
        <div class="atl-included-text">
          <strong>Audio Schema (SEO)</strong>
          <span>Rich results in Google Search with structured audio data</span>
        </div>
      </div>
      <div class="atl-included-item">
        <span class="atl-included-icon">&#128231;</span>
        <div class="atl-included-text">
          <strong>Priority Support</strong>
          <span>Get help within 1 hour from our engineering team</span>
        </div>
      </div>
    </div>
  </div>

</div>
<!-- /wp:html -->`;

async function main() {
  try {
    // Step 1: Get current pricing page content
    console.log('Fetching current pricing page content...');
    const getResult = await mcpCall(40, 'awfah-pages-wp-get-page', {
      id: 44,
      context: 'edit'
    });

    const getText = getResult.result?.content?.[0]?.text;
    if (!getText) {
      console.log('ERROR: Could not fetch page. Result:', JSON.stringify(getResult).substring(0, 500));
      return;
    }

    const page = JSON.parse(getText);
    let content = page.content?.raw;

    if (!content) {
      console.log('ERROR: No raw content found');
      return;
    }

    console.log('Original content length:', content.length, 'chars');

    // Step 2: Fix the "Pro-" typo
    const typoFixed = content.replace('AtlasVoice Pro- Powerful Text to Speech Pricing', 'AtlasVoice Pro — Powerful Text to Speech Pricing');
    if (typoFixed !== content) {
      console.log('Fixed "Pro-" typo -> "Pro —"');
      content = typoFixed;
    }

    // Step 3: Find injection point — between end of pricing cards and money-back guarantee
    // The pricing cards section ends with closing container blocks before the guarantee
    // We look for the pattern: closing of the main pricing container followed by the guarantee section
    const guaranteeStart = content.indexOf('Try AtlasVoice Pro Worry-Free');
    if (guaranteeStart === -1) {
      console.log('ERROR: Could not find guarantee section');
      return;
    }

    // Find the last closing block comment before the guarantee section
    // We need to go back from guaranteeStart to find a clean insertion point
    const beforeGuarantee = content.substring(0, guaranteeStart);
    const lastClosingBlock = beforeGuarantee.lastIndexOf('<!-- /wp:uagb/container -->');

    if (lastClosingBlock === -1) {
      console.log('ERROR: Could not find injection point');
      return;
    }

    // Find the end of that closing block (including the newline after it)
    const injectionPoint = lastClosingBlock + '<!-- /wp:uagb/container -->'.length;

    // Insert new sections
    const newContent = content.substring(0, injectionPoint) + '\n\n' + newSections + '\n\n' + content.substring(injectionPoint);

    console.log('New content length:', newContent.length, 'chars');
    console.log('Added', newContent.length - content.length, 'chars of new content');

    // Step 4: Update the page via MCP
    console.log('\nUpdating pricing page via MCP...');
    const updateResult = await mcpCall(41, 'awfah-rest-api-run-api-function', {
      route: '/wp/v2/pages/44',
      method: 'POST',
      data: {
        content: newContent
      }
    });

    const updateText = updateResult.result?.content?.[0]?.text;
    if (updateText) {
      try {
        const updated = JSON.parse(updateText);
        console.log('SUCCESS! Page updated.');
        console.log('Modified:', updated.modified);
        console.log('Page ID:', updated.id);
        console.log('Link:', updated.link);
      } catch(e) {
        console.log('Response:', updateText.substring(0, 500));
      }
    } else {
      console.log('Result:', JSON.stringify(updateResult).substring(0, 500));
    }

  } catch(err) {
    console.error('Error:', err.message, err.stack);
  }
}

main();
