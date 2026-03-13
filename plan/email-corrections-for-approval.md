# Email Corrections — For Approval

> **Important Note about Mailing Address:** Mailchimp REQUIRES a physical mailing address in all emails — this is a CAN-SPAM legal requirement. You cannot fully remove it. However, you can change it in Mailchimp's **Audience > Settings > Required email footer content** to something more generic like "AtlasAiDev, Dhaka, Bangladesh" (city + country only) or use a PO Box.

### 🔍 Deep Research Corrections (Mar 9, 2026)

After reviewing the plugin admin UI at localhost, the official Pro features page (atlasaidev.com/plugins/text-to-speech-pro/), and the documentation site (atlasaidev.com/docs/), the following corrections were applied:

1. **Email 2, Tip 1 — Path fixed**: "AtlasVoice > Settings > Text Aliases" → **"Text To Speech > Aliases"** (Aliases is its own tab in the sidebar, NOT under Settings — confirmed from admin UI)
2. **Email 4, Comparison Table — Added missing rows**: "Gutenberg Block & Shortcode" (both Free & Pro), "Audio intros & outros" (both Free & Pro)
3. **Email 4, Comparison Table — AtlasVoice AI**: Confirmed Pro-only (—/✓). Note: website comparison table incorrectly shows it as both — owner will correct the website.
4. **Email 4, Comparison Table — Audio intros & outros**: Confirmed Free feature (✓/✓). Note: website incorrectly shows it as Pro-only — owner will correct the website.

---

## EMAIL 1 — Welcome (Day 0)

**Subject:** Your website just got a voice
**Preview:** Here's how AtlasVoice makes your content accessible to everyone
**Button CTA:** Read the Documentation →
**Button URL:** `https://atlasaidev.com/docs/?utm_source=mailchimp&utm_medium=email&utm_campaign=convert-to-pro&utm_content=email1-welcome`

### Changes from current version:
1. Replaced "Get started in 60 seconds: Install AtlasVoice..." section with tips for existing users
2. Button changed from "Learn More About AtlasVoice →" to "Read the Documentation →"
3. Button URL changed from wordpress.org to atlasaidev.com/docs/
4. Signature changed from "Azizul Hasan / Founder, AtlasAiDev" to "The AtlasAiDev Team"

### HTML Body Content:

```html
<h1>Welcome to AtlasVoice!</h1>
<p>Hi *|FNAME|*,</p>
<p>Thanks for joining the AtlasVoice community!</p>
<p>You're now part of a growing network of website owners who are making their content accessible to everyone — including the 2.2 billion people worldwide with visual impairments.</p>

<h2>What is AtlasVoice?</h2>
<p>AtlasVoice (Text to Speech TTS) adds a play button to your WordPress posts and pages. Visitors click it, and your content is read aloud — instantly, in 18+ languages.</p>
<p>No APIs. No per-word billing. Just install and it works.</p>

<h2>Make sure you're getting the most out of AtlasVoice:</h2>
<ul>
<li><strong>Set up post type</strong> — Go to Text To Speech &gt; Settings select your post type. default is 'post'</li>
<li><strong>Customize the player</strong> — Go to Text To Speech &gt; Customize to change button colors, width, and position to match your theme.</li>
<li><strong>Select Language and voice</strong> — Go to Text To Speech &gt; Listening then select language, voice etc.</li>
<li><strong>Check your analytics</strong> — Your dashboard shows play counts and engagement data so you know which posts your audience listens to most.</li>
<li><strong>Try different voices</strong> — The free version uses your browser's built-in Web Speech API, so the available voices vary by browser and device (Microsoft Edge offers the widest selection with 300+ voices, while other browsers may have fewer). Want consistent, high-quality voices everywhere? AtlasVoice Pro includes AI-powered voices.</li>
</ul>

<p>Reply to this email if you have any questions — we read every one.</p>

<p>Cheers,<br><strong>The AtlasAiDev Team</strong></p>
```

---

## EMAIL 2 — Quick Tips (Day 3)

**Subject:** 3 things most AtlasVoice users miss
**Preview:** Quick tips to get more out of your text-to-speech setup
**Button CTA:** Read More on Our Blog →
**Button URL:** `https://atlasaidev.com/blog/?utm_source=mailchimp&utm_medium=email&utm_campaign=convert-to-pro&utm_content=email2-tips`

### Changes from current version:
1. Tip 1 replaced (was "Position player above the fold" which is default behavior) → now about Text Alias feature
2. Tip 1 path corrected: "Text To Speech > Aliases" (confirmed from admin UI — Aliases is its own tab, not under Settings)
3. Tip 3 replaced (was "Mention it in your content" which is too technical) → now about checking analytics
4. Tip 2 kept but slightly adjusted
5. P.S. corrected — player colors/speed/voice ARE free features. P.S. now upsells actual Pro-only features (AI voices, MP3 generation)
6. Button URL changed from Freemius pricing to blog
7. Signature changed to company name

### HTML Body Content:

```html
<h1>3 Things Most Users Miss</h1>
<p>Hi *|FNAME|*,</p>
<p>Most people set up AtlasVoice and think "done." But there are a few easy tweaks that make a big difference:</p>

<h2>Tip 1: Use the Text Alias feature</h2>
<p>Got abbreviations, acronyms, or technical terms on your site? The Text Alias feature lets you replace them with proper spoken equivalents. For example, "Dr." becomes "Doctor" and "WCAG" becomes "Web Content Accessibility Guidelines." Your audio will sound much more natural. Find it under Text To Speech &gt; Aliases.</p>

<h2>Tip 2: Use it on your top-performing posts first</h2>
<p>Check your Google Analytics — find your top 10 posts by traffic. Those are the ones where audio adds the most value. More visitors = more listeners = more engagement.</p>

<h2>Tip 3: Check your analytics dashboard</h2>
<p>AtlasVoice tracks play counts and engagement right inside your WordPress dashboard. Check which posts get the most plays — you might be surprised. Use this data to decide where to focus your content efforts.</p>

<h2>Bonus: The accessibility angle</h2>
<p>If your site serves any public audience (government, education, healthcare, non-profit), text-to-speech isn't just nice to have — it's an accessibility requirement in many countries. AtlasVoice helps you comply with WCAG 2.1 guidelines.</p>

<p>Try these tips this week and see the difference.</p>

<p>Best,<br><strong>The AtlasAiDev Team</strong></p>

<p>P.S. The free version uses browser voices (Web Speech API), which sound different depending on your visitors' browser and device. AtlasVoice Pro gives you 4 AI voice providers — including AtlasVoice AI (63 languages, no extra charge) plus Google Cloud, OpenAI, and ElevenLabs. Pro also unlocks MP3 file generation for your entire archive.</p>
```

---

## EMAIL 3 — Accessibility Story (Day 7)

**Subject:** 15% of your visitors can't read your content
**Preview:** How text-to-speech helps you reach the audience you're missing
**Button CTA:** Read More on Our Blog →
**Button URL:** `https://atlasaidev.com/blog/?utm_source=mailchimp&utm_medium=email&utm_campaign=convert-to-pro&utm_content=email3-accessibility`
**Social links:** Facebook: https://www.facebook.com/AtlasAiDev | X: https://x.com/atlasaidev

### Changes from current version:
1. Broken image needs to be removed or replaced with an SVG
2. Button URL changed from Freemius pricing to blog
3. Signature changed from "Azizul" to "The AtlasAiDev Team"
4. Social media links to be set to correct URLs

### HTML Body Content:

```html
<h1>Your Content Deserves to Be Heard</h1>
<p>Hi *|FNAME|*,</p>
<p>Here's a number that surprised us:</p>
<p><strong>15% of the global population has some form of disability</strong> — that's over 1 billion people. Many of them rely on assistive technology to consume web content.</p>
<p>When you add text-to-speech to your site, you're not just adding a feature. You're opening a door.</p>

<h2>Real impact AtlasVoice users are seeing:</h2>
<ul>
<li><strong>+23% average time on page</strong> — listeners stay longer than readers</li>
<li><strong>-18% bounce rate</strong> — audio keeps people engaged</li>
<li><strong>+40% content consumption on mobile</strong> — people listen while multitasking</li>
</ul>

<h2>Who benefits most:</h2>
<ul>
<li>Blog readers who prefer audio (commuters, gym-goers, multitaskers)</li>
<li>Users with dyslexia or visual impairments</li>
<li>Non-native speakers who understand better when they hear + read simultaneously</li>
<li>Older adults who find small text difficult</li>
</ul>

<p>Your content is valuable. Don't let accessibility be the reason someone can't consume it.</p>

<p><strong>One question for you:</strong> Are you getting the most out of AtlasVoice on your site? Reply and tell us your URL — we'll take a look and share a quick tip.</p>

<p>Talk soon,<br><strong>The AtlasAiDev Team</strong></p>
```

---

## EMAIL 4 — Free vs Pro (Day 12)

**Subject:** Free vs Pro — here's what you're leaving on the table
**Preview:** Side-by-side comparison of what Pro unlocks for your site
**Button CTA:** See Pro Pricing →
**Button URL:** `https://atlasaidev.com/plugins/text-to-speech-pro/pricing/?utm_source=mailchimp&utm_medium=email&utm_campaign=convert-to-pro&utm_content=email4-free-vs-pro`

### Changes from current version:
1. Removed "Remove AtlasVoice branding" (doesn't exist)
2. Removed "Custom player colors & styling" from Pro-only (it's already in Free)
3. Updated comparison table with ACCURATE Free vs Pro features from official pricing page
4. AtlasVoice AI confirmed as Pro-only (website comparison table is wrong — owner will fix)
5. Added missing features: Gutenberg Block & Shortcode (both), Audio intros & outros (both — it's a free feature)
6. Updated feature descriptions to match actual Pro features
7. Button URL changed from Freemius to atlasaidev.com pricing page
8. Pricing in P.S. updated: $59/year = $4.92/month (actual Starter plan price)

### HTML Body Content:

```html
<h1>Free vs Pro — What You're Missing</h1>
<p>Hi *|FNAME|*,</p>
<p>The free version of AtlasVoice gets the job done. But if you're serious about engagement, conversions, and accessibility — here's what Pro adds:</p>

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
<tr style="background-color:#f0f0f0;"><th>Feature</th><th>Free</th><th>Pro</th></tr>
<tr><td>Browser voices (Web Speech API)**</td><td style="text-align:center;">&#10003;</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Player customization (colors, width)</td><td style="text-align:center;">&#10003;</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Speed, pitch &amp; volume controls</td><td style="text-align:center;">&#10003;</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Gutenberg Block &amp; Shortcode</td><td style="text-align:center;">&#10003;</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Basic analytics</td><td style="text-align:center;">&#10003;</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>AI Voices (Google Cloud, OpenAI, ElevenLabs)*</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>AtlasVoice AI (63 languages, no extra charge)</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>MP3 file generation &amp; bulk MP3</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Downloadable MP3 for visitors</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>6 player styles + floating/sticky player</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>CSS selector targeting</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Audio intros &amp; outros</td><td style="text-align:center;">&#10003;</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Advanced analytics (funnels, heatmaps)</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Audio Schema markup (SEO rich results)</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>WPML, GTranslate &amp; TranslatePress support</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
<tr><td>Priority support (1-hour response)</td><td style="text-align:center;">—</td><td style="text-align:center;">&#10003;</td></tr>
</table>

<p style="font-size:13px;color:#666;">*Google Cloud, OpenAI, and ElevenLabs charge their own API usage fees. AtlasVoice AI is included free with Pro — no extra charge.<br>**Browser voices use the Web Speech API and behave differently across browsers and devices. AI voices provide a consistent experience for all visitors.</p>

<h2>Why Pro users love it:</h2>
<ul>
<li><strong>4 AI Voice Providers</strong> — Choose from Google Cloud (300+ voices), OpenAI (6 HD voices), and ElevenLabs (100+ ultra-realistic voices) — usage fees charged by each provider. Plus AtlasVoice AI covering 63 languages with no extra charge included in your Pro plan.</li>
<li><strong>MP3 Generation &amp; Downloads</strong> — Generate MP3 files for your posts and let visitors download audio versions. Convert your entire archive in bulk with one click.</li>
<li><strong>Floating / Sticky Player</strong> — A player that stays visible as visitors scroll. Choose from 6 different player styles to match your brand.</li>
<li><strong>CSS Selector Targeting</strong> — Control exactly which content gets read aloud. Skip navigation, sidebars, ads — only read the content that matters.</li>
<li><strong>Audio Schema for SEO</strong> — Get rich results in Google Search with structured audio data. Boost your site's visibility.</li>
</ul>

<p>Best,<br><strong>The AtlasAiDev Team</strong></p>

<p>P.S. Pro starts at just $59/year for 1 site — that's $4.92/month. Less than a coffee for a feature that makes your entire site accessible with AI-powered voices.</p>
```

---

## EMAIL 5 — Final Offer (Day 18)

**Subject:** A little thank you from AtlasVoice
**Preview:** Exclusive discount for our community — limited time
**Button CTA:** Upgrade to Pro Now →
**Button URL:** `https://atlasaidev.com/plugins/text-to-speech-pro/pricing/?utm_source=mailchimp&utm_medium=email&utm_campaign=convert-to-pro&utm_content=email5-final-offer`

### Changes from current version:
1. Features updated to match ACTUAL Pro features from pricing page
2. Pricing corrected: $59/year → $53.10/year with ATLASTTS10P (10% off) = $4.43/month
3. Button URL changed from Freemius to atlasaidev.com pricing page
4. Signature kept as "Azizul Hasan, Founder" → changed to "The AtlasAiDev Team"

### HTML Body Content:

```html
<h1>A Thank You &amp; a Special Offer</h1>
<p>Hi *|FNAME|*,</p>
<p>You've been part of the AtlasVoice community for a couple of weeks now, and we wanted to say thanks.</p>
<p>Whether you've been using the free plugin every day or still exploring what's possible — we appreciate you being here.</p>
<p>To show our gratitude, we'd like to offer you something special:</p>

<hr>
<h2 style="text-align:center;">10% OFF AtlasVoice Pro</h2>
<p style="text-align:center;font-size:20px;"><strong>Use code ATLASTTS10P at checkout</strong></p>
<hr>

<h2>What you'll unlock immediately:</h2>
<ul>
<li>4 AI voice providers — Google Cloud (300+ voices), OpenAI (6 HD voices), ElevenLabs (100+ voices)* &amp; AtlasVoice AI (63 languages, included free)</li>
<li>MP3 file generation &amp; bulk MP3 for your entire archive</li>
<li>Downloadable MP3 for visitors</li>
<li>6 player styles + floating/sticky player</li>
<li>CSS selector targeting — control what gets read aloud</li>
<li>Advanced analytics with funnels and heatmaps</li>
<li>Audio Schema markup for SEO rich results</li>
<li>WPML, GTranslate &amp; TranslatePress multilingual support</li>
<li>Priority support with 1-hour response time</li>
</ul>

<p style="font-size:13px;color:#666;">*Google Cloud, OpenAI, and ElevenLabs charge their own API usage fees. AtlasVoice AI is included free with Pro — no extra charge.</p>

<h2>The math:</h2>
<ul>
<li>Pro Starter plan (1 site): <s>$59/year</s> &rarr; <strong>$53.10/year</strong> with ATLASTTS10P</li>
<li>That's <strong>$4.43/month</strong> — less than a single coffee</li>
<li>Covers unlimited posts on one site</li>
</ul>

<p>Your visitors deserve accessible content. Your site deserves a professional audio experience.</p>
<p>This is an exclusive offer for our community members. The code won't last forever.</p>

<p>Cheers,<br><strong>The AtlasAiDev Team</strong></p>

<p>P.S. If you have any questions before upgrading, just reply to this email. We're here to help.</p>
```

---

## CROSS-EMAIL CHANGES (Apply to All)

1. **Mailing address**: Cannot be fully removed (CAN-SPAM requirement). Change in Mailchimp Audience Settings to minimal: "AtlasAiDev, Dhaka, Bangladesh"
2. **All signatures**: Changed from "Azizul Hasan" / "Azizul" to "The AtlasAiDev Team"
3. **Social media links** (Email 3 footer): Facebook: https://www.facebook.com/AtlasAiDev | X: https://x.com/atlasaidev
4. **Email 3 broken image**: Remove the empty image block OR create/upload an SVG
5. **Email 4 broken image**: Same — remove empty image block OR create/upload an SVG
6. **Button styling**: Make consistent across all 5 emails (same color)
