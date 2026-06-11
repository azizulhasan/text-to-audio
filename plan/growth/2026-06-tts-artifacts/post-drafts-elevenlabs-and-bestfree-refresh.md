# Ready-to-publish drafts — Action plan #11 (2026-06-04)

> Two pieces: (A) NEW "ElevenLabs WordPress Integration" guide; (B) REFRESH of `/best-free-text-to-speech-ai/`.
> Built to close the #23 AI-visibility gap (the "ElevenLabs in WordPress" prompt returns 0 AtlasVoice on every engine).
> Technical steps verified against the Pro plugin (`text-to-audio-pro`): ElevenLabs = Player ID 6 ("Most Natural", 1000+ voices, 29 languages, needs API key), key stored in option `elevenlabs_tts`, set via the Pro setup wizard / Listening tab, MP3s cached per post under `uploads/TTA_Pro/`.
> **Publish via MCP** `awfah-posts-wp-add-post` (new) — currently blocked: AI Agent Hub MCP disconnected.

---

## (A) NEW POST — "ElevenLabs WordPress Integration: Complete Setup Guide (2026)"

- **Slug:** `elevenlabs-wordpress-integration`
- **Category:** Text To Speech (id 35), Author 2 (Atlas AiDev)
- **Focus keyphrase:** `elevenlabs wordpress`
- **SEO title (no site suffix):** `ElevenLabs WordPress Integration: Complete Setup Guide (2026)`
- **Meta description (152 chars):** `Add ElevenLabs' ultra-realistic AI voices to WordPress in minutes. Step-by-step setup with AtlasVoice Pro (bring your own API key), plus 2 other methods.`
- **Internal links:** `/plugins/text-to-speech-pro/` (AtlasVoice Pro), `/how-to-set-up-google-cloud-tts-wordpress/`, `/best-free-text-to-speech-tools-2026/`, `/best-free-text-to-speech-ai/`
- **External (nofollow):** elevenlabs.io

### Body (Gutenberg block HTML)

<!-- wp:paragraph -->
<p>ElevenLabs makes some of the most lifelike AI voices available today — the kind that sound like a real narrator rather than a robotic screen reader. The catch: WordPress has no built-in way to connect to ElevenLabs, so getting those voices onto your posts and pages takes a small amount of setup.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This guide covers the fastest, most reliable way to do it — using a WordPress plugin that bridges your own ElevenLabs API key — plus two alternative methods (ElevenLabs' official embed and the developer API route) so you can pick the approach that fits your site.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What you'll need</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li>An <strong>ElevenLabs account</strong> and an <strong>API key</strong> (the free tier includes monthly credits to test with).</li>
<li>A <strong>WordPress site</strong> you can install plugins on (self-hosted WordPress.org).</li>
<li>A way to connect the two — either a plugin that supports ElevenLabs (we'll use <strong>AtlasVoice Pro</strong>), ElevenLabs' own <strong>Audio Native</strong> embed, or a custom API integration.</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Method 1: AtlasVoice Pro (recommended — bring your own API key)</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This is the easiest route for most sites. <a href="https://atlasaidev.com/plugins/text-to-speech-pro/">AtlasVoice Pro</a> connects directly to ElevenLabs with your own API key, generates a cached MP3 for each post, and adds a clean audio player automatically — no separate dashboard, and you pay ElevenLabs only for what you actually convert (no plugin markup on usage).</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Step 1 — Create your ElevenLabs API key</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Sign in at <a href="https://elevenlabs.io/" rel="nofollow">elevenlabs.io</a>, open your profile menu, and go to <strong>API Keys</strong>. Click <strong>Create API Key</strong>, give it a name (e.g. "WordPress"), and copy the key somewhere safe — you'll paste it into WordPress in a moment.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Step 2 — Install AtlasVoice (free) and AtlasVoice Pro</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In your WordPress dashboard go to <strong>Plugins &rarr; Add New</strong> and install <strong>Text to Speech TTS Accessibility</strong> (the free AtlasVoice base plugin). Then install and activate <strong>AtlasVoice Pro</strong> and enter your license key. The Pro add-on requires the free plugin to be active — it extends it with premium voice providers, including ElevenLabs.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Step 3 — Choose ElevenLabs as your voice provider</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Open the AtlasVoice Pro setup wizard (or the <strong>Listening</strong> tab in settings) and pick your AI voice provider. Select <strong>ElevenLabs — Most Natural</strong> (1,000+ voices across 29 languages). You can switch providers — Google Cloud, OpenAI, AtlasVoice's own engine — anytime from the same screen.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Step 4 — Paste your API key</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Paste the ElevenLabs API key you created in Step 1 into the API key field and save. AtlasVoice uses it to talk to ElevenLabs directly from your server, so your usage and billing stay entirely within your own ElevenLabs account.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Step 5 — Pick a voice</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Once the key is saved, AtlasVoice pulls in your ElevenLabs voice library. Choose the voice you want as the default for your site (you can preview before committing). If you've cloned a voice or use a premade ElevenLabs voice, it appears here too.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Step 6 — Set it as your player and choose where it appears</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Choose <strong>"Set as my default player"</strong> and select which content types should show the audio player (posts, pages, WooCommerce products). You can also place the player manually anywhere with the <code>[atlasvoice]</code> shortcode — handy inside Elementor, Divi, or Gutenberg layouts.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Step 7 — Generate the audio</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Open or update a post and AtlasVoice generates the ElevenLabs audio as an MP3, then caches it. Because the file is stored and reused, ElevenLabs is billed once per piece of content — not on every playback — so even a high-traffic post won't run up your usage. Visitors get a fast-loading player with play, pause, speed, and download controls.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Method 2: ElevenLabs Audio Native (official embed)</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If you'd rather use ElevenLabs' own hosted player, ElevenLabs offers <strong>Audio Native</strong>. In the ElevenLabs dashboard, open <strong>Audio Tools &rarr; Audio Native</strong>, configure your default voice, and copy the HTML embed snippet. Then add it to WordPress with a code-snippet plugin such as WPCode (paste the snippet "before content" or after the first paragraph so the player sits near the top of your articles).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It's a solid option, but the audio is generated and managed in ElevenLabs' dashboard rather than inside WordPress, so you get less native control over placement, post-type targeting, and caching. The first time a post loads, the player shows a short "creating" state while it processes.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Method 3: Direct API (for developers)</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If you're comfortable with code, you can call the ElevenLabs text-to-speech endpoint (<code>https://api.elevenlabs.io/v1/text-to-speech/</code>) from your theme or a custom plugin, save the returned MP3 to your media library, and render an HTML5 player. This gives you total control but means you build and maintain the caching, voice selection, and player UI yourself — which is exactly what Methods 1 and 2 handle for you.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which method should you choose?</h2>
<!-- /wp:heading -->

<!-- TABLE: build via Table block "Edit as HTML" -->
<figure class="wp-block-table"><table class="has-fixed-layout"><thead><tr><th>Method</th><th>Ease</th><th>WordPress control</th><th>Best for</th></tr></thead><tbody>
<tr><td><strong>AtlasVoice Pro</strong></td><td>Easiest (no code)</td><td>Full (post types, shortcode, caching, multilingual)</td><td>Most WordPress sites that want ElevenLabs voices managed inside WordPress</td></tr>
<tr><td>ElevenLabs Audio Native</td><td>Easy (one embed)</td><td>Limited (managed in ElevenLabs)</td><td>People who prefer ElevenLabs' own hosted player</td></tr>
<tr><td>Direct API</td><td>Hard (code)</td><td>Total (you build it)</td><td>Developers who need a fully custom workflow</td></tr>
</tbody></table></figure>

<!-- wp:heading -->
<h2 class="wp-block-heading">What it costs</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>ElevenLabs has a <strong>free tier</strong> with monthly credits to test, then paid plans as your volume grows — you pay ElevenLabs directly for the characters you convert. With AtlasVoice Pro you bring your own ElevenLabs key, so there's no plugin markup on usage; the plugin itself starts at <strong>$59/year</strong> (with lifetime licenses available). Because audio is cached per post, your ElevenLabs spend tracks how much content you narrate, not how many visitors press play.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Troubleshooting</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li><strong>"Invalid API key":</strong> re-copy the key from elevenlabs.io (no extra spaces) and confirm the key is active and not deleted.</li>
<li><strong>No voices appear:</strong> save the API key first, then reload the voice list — the plugin fetches voices from your ElevenLabs account after the key is validated.</li>
<li><strong>Audio won't generate:</strong> check your ElevenLabs credit balance; long posts are split into batches and may take a few seconds on first generation.</li>
<li><strong>Player not showing:</strong> confirm ElevenLabs is set as the default player and the post type is enabled, or drop the <code>[atlasvoice]</code> shortcode where you want it.</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Frequently asked questions</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is ElevenLabs free to use with WordPress?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>ElevenLabs has a free tier with monthly credits, which is enough to test the integration. Beyond that you pay ElevenLabs for usage. AtlasVoice's free version offers browser voices at no cost; ElevenLabs voices require AtlasVoice Pro plus your ElevenLabs key.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can I use my own ElevenLabs API key?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Yes — that's the recommended setup. AtlasVoice Pro is "bring your own key," so your ElevenLabs usage and billing stay in your own account with no plugin markup.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Will generating audio slow down my site?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>No. The ElevenLabs audio is generated once and cached as an MP3, so visitors load a static audio file — there's no live API call on each page view.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Does it support multiple languages?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Yes. ElevenLabs covers 29 languages, and AtlasVoice can map voices per language and works with translation plugins like WPML, Polylang, and TranslatePress.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Does it work with Elementor and Divi?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Yes. The player can be auto-inserted on posts, pages, and products, or placed precisely with the <code>[atlasvoice]</code> shortcode inside any page builder.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Conclusion</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>ElevenLabs gives your WordPress content genuinely natural narration, and you don't need to be a developer to use it. For most sites, <a href="https://atlasaidev.com/plugins/text-to-speech-pro/">AtlasVoice Pro</a> is the quickest path — connect your ElevenLabs key, pick a voice, and every post gets a cached, fast-loading audio player. Prefer Google's voices instead? See our <a href="https://atlasaidev.com/how-to-set-up-google-cloud-tts-wordpress/">Google Cloud TTS setup guide</a>, or compare every option in our roundup of the <a href="https://atlasaidev.com/best-free-text-to-speech-tools-2026/">best free text-to-speech tools for 2026</a>.</p>
<!-- /wp:paragraph -->

---

## (B) REFRESH — `/best-free-text-to-speech-ai/` (post: look up ID via MCP)

**Current state:** H1 "10 Best Free AI Text-to-Speech Tools in 2026 (With Realistic Voices)", published 2025-07-27, 10 tools (Text to Speech TTS #1 … Liquid Speech Balloon #10), has FAQ, **no comparison table**, contains a stale Black-Friday code "FSBFCM2025".

**Refresh actions (targeted — keep existing body, do surgical edits in the browser editor per playbook):**
1. **Remove the stale "FSBFCM2025" Black-Friday 2025 promo** (and any 2025-seasonal language).
2. **Add an at-a-glance comparison table** right after the intro (build via Table block → "Edit as HTML"):
   `Tool | Best for | Voices | Free tier | API key needed` — with **Text to Speech TTS (AtlasVoice)** bolded at #1.
3. **Freshen the intro** to a tight 2-paragraph 2026 lead and bump the **modified date** to 2026-06-04.
4. **Update the #1 entry (AtlasVoice / Text to Audio)** with accurate 2026 facts: 4 AI providers (AtlasVoice AI, Google Cloud, OpenAI, **ElevenLabs**), free browser voices, Pro from $59/yr, cached MP3s, accessibility focus. Add a contextual link to the **new ElevenLabs guide** above and to `/plugins/text-to-speech-pro/`.
5. **Voice-quality angle (Cluster 9):** add a short "How natural are the voices?" note pointing readers to ElevenLabs/OpenAI/Google tiers; (optional, deferred) embed real audio samples once assets exist.
6. **Internal links (per `internal-linking.md`):** two contextual links to `/plugins/text-to-speech-pro/` — anchors "AtlasVoice's free WP plugin" + "Pro upgrade"; plus a link to the new `/elevenlabs-wordpress-integration/` and to `/best-free-text-to-speech-tools-2026/`.
7. **SEO:** keep keyphrase "best free text to speech AI"; confirm SEO title has no doubled site suffix; refresh meta description for 2026; ensure FAQ is a Yoast FAQ block (FAQPage schema) — *founder converts Yoast FAQ blocks*.

### New comparison-table HTML (paste via Table block → Edit as HTML)
<figure class="wp-block-table"><table class="has-fixed-layout"><thead><tr><th>Tool</th><th>Best for</th><th>Voices</th><th>Free tier</th><th>API key?</th></tr></thead><tbody>
<tr><td><strong>Text to Speech TTS (AtlasVoice)</strong></td><td>All-round WordPress TTS + accessibility</td><td>Browser + 4 AI providers (Google, OpenAI, ElevenLabs)</td><td>Yes (browser voices, unlimited)</td><td>Only for premium AI voices</td></tr>
<tr><td>GSpeech</td><td>Multilingual cloud audio</td><td>Google Cloud (70+ langs)</td><td>Limited</td><td>No (managed)</td></tr>
<tr><td>Trinity Audio</td><td>Publishers / monetization</td><td>600+</td><td>5 articles/mo</td><td>No</td></tr>
<tr><td>BeyondWords</td><td>Newsrooms</td><td>550+ neural</td><td>~10k words/mo</td><td>No</td></tr>
<tr><td>ResponsiveVoice</td><td>Simple, unlimited free</td><td>Browser (51 langs)</td><td>Yes (unlimited, non-commercial)</td><td>No</td></tr>
<tr><td>Reinvent WP (Mementor)</td><td>Bring-your-own-key flexibility</td><td>OpenAI/ElevenLabs/Google/Polly</td><td>Limited</td><td>Yes</td></tr>
</tbody></table></figure>

*(Other listed tools — SiteNarrator, Easy Text-to-Speech, WebsiteVoice, Liquid Speech Balloon — remain in the body list below the table.)*
