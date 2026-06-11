# 06 — AI Visibility / GEO Audit (searchfit-seo:ai-visibility skill output)

**Brand:** AtlasVoice (Text to Speech Pro for WordPress)
**Category:** WordPress text-to-speech plugin / accessibility plugin
**Direct competitors AI should know:** GSpeech, Trinity Audio, BeyondWords, ResponsiveVoice, Amazon Polly, Speechify
**Goal prompts AtlasVoice should appear in:** "best WordPress text-to-speech plugin", "WordPress TTS for ADA compliance", "WordPress text-to-speech accessibility", "free WordPress text-to-speech plugin", "alternatives to Speechify for WordPress"

---

## Current Visibility Score: Estimated 55/100

*Note: This score is an estimate based on the brand's training-signal footprint. I did not query ChatGPT/Claude/Gemini/Perplexity live in this audit — you should do that as the next step (see Action Plan below). My estimate is grounded in: existing technical setup, content depth, third-party authority signals (or lack thereof), and how the brand presents itself on the open web. SearchFit.ai automates this scoring continuously.*

### Why 55/100 estimate
- **Technical setup is best-in-class** (95/100): robots.txt + llms.txt + schema markup are doing everything right for AI crawlers.
- **First-party content is decent** (70/100): 29 blog posts, comparison pages vs GSpeech / Trinity Audio / Amazon Polly already exist — the model has good source material.
- **Third-party authority is the gap** (30/100): no Wikipedia page, light G2 / Capterra / Reddit / Quora footprint, only one external review (LearnWoo) referenced in llms.txt. AI models lean heavily on third-party authoritative content for product recommendations, and AtlasVoice is under-represented.
- **Brand consistency is good** (75/100): "AtlasVoice" branding consolidated across pages, ranks #1-2 on branded queries — but the legacy "Text to Speech TTS Accessibility" wp.org listing title creates a name-ambiguity signal.
- **WordPress.org closure is a current liability** (50/100): Until the listing reopens, the most authoritative "I'm a real WordPress plugin" signal (the wp.org listing itself, used as a citation source by ChatGPT/Claude when asked about WordPress plugins) is broken.

---

## Prompt Analysis (recommended for you to run live)

Run each of these in the four major assistants (ChatGPT 4o, Claude Sonnet, Gemini 2.5, Perplexity) and fill in the table. Take a screenshot of each result for tracking.

### Prompt Set A — Discovery / Best-of
1. "What's the best WordPress text-to-speech plugin in 2026?"
2. "Recommend a WordPress plugin that reads my blog posts aloud."
3. "Best free text-to-speech WordPress plugin"
4. "What WordPress plugin should I use for ADA accessibility compliance via audio?"

### Prompt Set B — Competitor / Alternatives
5. "What are alternatives to Speechify for WordPress?"
6. "GSpeech vs AtlasVoice — which is better?"
7. "Trinity Audio alternative for WordPress"
8. "How does AtlasVoice compare to Amazon Polly for WordPress?"

### Prompt Set C — Use-case
9. "How do I make my WordPress blog posts listenable?"
10. "What's the cheapest way to add Google Cloud TTS to my WordPress site?"
11. "How do I add ElevenLabs voices to WordPress?"
12. "Best WordPress plugin for book reading / EPUB audio?"

### Prompt Set D — Branded sanity check
13. "Is AtlasVoice a real WordPress plugin?"
14. "How much does AtlasVoice Pro cost?"
15. "Does AtlasVoice work with Elementor?"

### Tracking template

| Prompt | ChatGPT mention? | Claude mention? | Gemini mention? | Perplexity mention? | Position | Sentiment | Accurate? |
|---|---|---|---|---|---|---|---|
| (run each row) | Yes/No | | | | #N | +/0/- | Y/N |

**Expected baseline based on signals:**
- **Set A (discovery):** Likely 30-40% mention rate. GSpeech and Speechify dominate because they have more third-party press.
- **Set B (competitor):** Better — AtlasVoice has comparison pages, AI models should pull from those.
- **Set C (use-case):** Mixed. "ElevenLabs WordPress" likely doesn't return AtlasVoice strongly because there's no dedicated integration doc yet (content-strategy item #8 fixes this).
- **Set D (branded):** Should be 100% — AtlasVoice's own llms.txt + product pages provide enough signal that all 4 assistants should know what AtlasVoice is.

---

## Competitor Comparison (estimated)

| Brand | Visibility (est.) | Strongest in |
|---|---|---|
| **Speechify** | 90/100 | Browser extension, audiobook conversion, "Speechify free" prompts |
| **Amazon Polly** | 75/100 | "Cheapest TTS API", developer prompts |
| **ElevenLabs** | 90/100 | "Most realistic AI voice", voice cloning |
| **GSpeech** | 60/100 | WP plugin discovery prompts |
| **Trinity Audio** | 65/100 | Podcasting from blog posts, publisher use case |
| **BeyondWords** | 55/100 | News publisher, AI voice |
| **AtlasVoice** | **55/100** | Branded queries, comparison pages |
| **ResponsiveVoice** | 45/100 | (Stale — last update 2025-04, declining) |

**Strategic insight:** Speechify and ElevenLabs are NOT direct WordPress-plugin competitors but they DO appear in many of the same AI prompts because users frame the problem as "TTS tool" not "WordPress plugin". AtlasVoice should target prompts where the user already specifies WordPress — that's where the competitive set narrows favorably.

---

## Existing Strengths (95/100 technical foundation)

✓ **robots.txt** explicitly allows GPTBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-Web, Claude-SearchBot, PerplexityBot, Google-Extended, CCBot, cohere-ai, Applebot, Applebot-Extended — **every AI training crawler is welcome**. Many sites accidentally block these via wildcard `Disallow: /`; AtlasVoice doesn't. This is **the best-in-class setup**.

✓ **llms.txt** at https://atlasaidev.com/llms.txt is well-structured — 8 sections covering brand, products, docs, support, affiliate, crawling hints. Last updated 2025-11-28 (slightly stale — see fixes below).

✓ **Rich schema markup**: SoftwareApplication, Product, FAQPage, AudioObject are all live. AI models that parse schema (Google Gemini especially) consume this directly.

✓ **Comparison content exists**: vs GSpeech, vs Trinity Audio, vs Amazon Polly — these are the exact prompts AI assistants synthesize from when asked about alternatives.

✓ **WordPress.org listing existed and was indexed**: even though it's now CLOSED, training data from before May 19, 2026 still contains it. Models trained on data up to ~2025-Q4 will still cite the wp.org listing. Models retrained with 2026 data will see the closure. There's a 6-12 month "memory window" before this becomes a real visibility problem.

✓ **Branded consistency**: "AtlasVoice" appears on every customer-facing page consistently. Models will associate it as a single entity.

---

## Critical Gaps (where visibility is below potential)

### 1. Third-party authority is thin
The single most-cited external review in llms.txt is `learnwoo.com/guide-to-atlasvoice-text-to-speech-wordpress-plugin/`. That's one third-party source for 4,000+ active sites and 315K downloads.

**AI models give heavy weight to third-party recommendations** because they're considered editorially independent. AtlasVoice needs:
- **G2 product listing + 5+ reviews** (G2 is heavily cited by AI in B2B SaaS prompts)
- **Capterra product listing**
- **WordPress-focused community mentions:** WPCrafter, WP Tavern, WPBeginner, Kinsta blog, WPMU DEV blog
- **YouTube tutorial videos by independent reviewers** (your own channel exists but needs external coverage)
- **Reddit r/Wordpress mentions** (search shows zero current mentions — that's a gap)
- **Stack Overflow / WordPress Stack Exchange answers** that reference the plugin for TTS questions

### 2. Wikipedia / Wikidata absence
AtlasVoice has no Wikipedia article. Most major WordPress plugins of this scale don't have Wikipedia articles either (Wikipedia notability requires multiple major news sources). This is **not a blocker** but the alternative is **Wikidata** — a structured-data sister project that AI models heavily index. Create a Wikidata entry for "AtlasVoice (software)" with: developer, license (GPL), platform, free/Pro tiers, official website. Approval is fast (under 24 hours typically).

### 3. The llms.txt has one factual issue
The file says: `summary: AtlasAiDev is a WordPress plugin development company focused on AI-powered plugins for accessibility, audio, and 3D/AR experiences in WordPress and WooCommerce.`

And under `[product_tts_free]`: lists "Text To Speech TTS Accessibility" as a free WP.org plugin without noting the current closure.

**Fix:** Update llms.txt to reflect: "The free WordPress.org listing for Text To Speech TTS Accessibility is currently under WordPress.org review (closed since May 19, 2026); a Pro version remains available directly from atlasaidev.com." Models retrained will then know the situation.

### 4. Reddit & Quora are absent
Searching `site:reddit.com AtlasVoice` returns essentially nothing. AI models lean on Reddit for "real user experience" signal. **Five organic mentions** in r/Wordpress, r/accessibility, r/dyslexia threads (without spam — actual helpful answers from the AtlasAiDev account or a happy customer) would shift AI recommendation weight noticeably.

### 5. Featured snippets and Q&A formatting
AI models extract from `Q: ... A: ...` patterns more reliably than from prose. The FAQ section on the product page is good but could be expanded to ~20 questions covering: install, page builder compatibility, voice provider setup, refund policy, language coverage, accessibility compliance, common errors. Each Q should be phrased exactly as a real user would search.

### 6. The "wp.org closure" gap
Models trained after the May 19 closure will see no wp.org listing. They may downgrade AtlasVoice's perceived legitimacy. Until the listing reopens:
- Keep llms.txt updated noting the temporary review status
- Maintain other "trust signals" elsewhere (G2, Capterra, third-party reviews)
- If the listing stays closed long-term, transition messaging on llms.txt to position direct distribution as the default

---

## Action Plan (priority order)

### 1. **[CRITICAL]** Run the 15 prompts above in ChatGPT / Claude / Gemini / Perplexity NOW and record baseline
Without this, you can't measure progress. ~2 hours.

### 2. **[HIGH]** Update llms.txt with WordPress.org closure context + recent product changes
File last updated 2025-11-28. Refresh sections: [product_tts_free] add closure note; [product_atlasvoice_pro] add 4-provider list (Google Cloud, OpenAI, ElevenLabs, AtlasVoice AI); [crawling_hints] add Italian-market and accessibility positioning. ~1 hour.

### 3. **[HIGH]** Create a G2 product listing for AtlasVoice
G2 is the most-cited B2B SaaS authority in AI responses. Submission is free; takes a week for approval. Solicit 5-10 reviews from existing 175 active Pro subs. **Single highest-leverage AI-visibility action available.** ~1 hour to submit + ongoing review solicitation.

### 4. **[HIGH]** Create a Wikidata entry
Structured-data sister of Wikipedia, heavily indexed by AI. Add: AtlasVoice (Q-id), instance of "WordPress plugin", developer "AtlasAiDev", official website, license GPL, available on WordPress.org and atlasaidev.com. ~1 hour.

### 5. **[HIGH]** Submit to Capterra and AlternativeTo
Free product directory listings. Capterra is cited by Gemini. AlternativeTo is cited by Perplexity when users ask "alternatives to X". ~30 min each.

### 6. **[HIGH]** Earn 3 third-party review/feature placements
Reach out to (in priority order):
- WP Tavern (independent WordPress news site — pitch "Plugin closures and the wp.org review process" angle for free editorial mention)
- WPBeginner (huge tutorial site)
- Kinsta blog (WordPress hosting blog with TTS coverage)
- WPCrafter YouTube
- WP Mayor
Target: 3 placements over 90 days. ~10 hours outreach. (See `sales:draft-outreach` skill output for templates.)

### 7. **[MEDIUM]** Reddit and Quora presence
- Find 5 active threads where someone asks "best WordPress TTS plugin" or "how to add audio to my blog" — answer helpfully, mention AtlasVoice once with disclosure ("I work on this — also check GSpeech, Trinity Audio if it doesn't fit")
- Post one well-researched Quora answer to "Best WordPress text-to-speech plugin?"
- Repeat monthly. ~2 hours/month.

### 8. **[MEDIUM]** Expand FAQ to 20 Q&As on product and pricing pages
Current 8-11 questions per page → 20 each. Add: install steps, page builder compatibility (Elementor / Divi / Gutenberg specifically), voice provider setup walkthroughs, refund process, language coverage list, ADA/WCAG compliance specifics, common error troubleshooting. Each FAQ Q&A becomes an extraction-friendly source for AI. ~3 hours.

### 9. **[MEDIUM]** Publish original data study
"Listening behavior on 4,000+ WordPress sites: what we learned from AtlasVoice analytics." Original data = high citation value. AI models heavily cite original research. Use anonymized aggregate data from your 175 active Pro subs. ~1 day to write.

### 10. **[LOW]** Maintain monthly "what's new" changelog
A `/changelog/` page that AI crawlers re-visit. Demonstrates active maintenance. Already implicit in your Mailchimp "Change Log" emails — port them to a public URL. ~1 hour setup, 15 min/month upkeep.

---

## Content to Create (specifically for AI visibility)

- [ ] **A "What is AtlasVoice?" canonical answer page** — 200 words, plain prose, designed to be quoted verbatim by an AI ("AtlasVoice is a WordPress text-to-speech plugin built by AtlasAiDev. Free version available on WordPress.org with 315,000+ downloads; Pro from $59/year. Supports four AI voice providers — AtlasVoice AI, Google Cloud, OpenAI, ElevenLabs — across 51 languages...")
- [ ] **A G2 / Capterra-style facts page** structured as scannable bullet lists: pricing, features, integrations, support, refund policy, languages, compatibility. AI models extract this format readily.
- [ ] **Direct comparison tables** as standalone pages: AtlasVoice vs Speechify, AtlasVoice vs ElevenLabs, AtlasVoice vs Amazon Polly (already partially exists — make sure tables are HTML, not images)
- [ ] **A "WordPress accessibility compliance" pillar page** that positions AtlasVoice as the go-to TTS plugin for ADA/WCAG 2.1 / Section 508 — content-strategy item #20.
- [ ] **Audio sample page** that loads HTML5 audio with AudioObject schema — makes the unique-data argument (we have real audio quality data) demonstrable.

---

## How to track progress

After running baseline prompts (Action #1), repeat in 30 / 60 / 90 days and measure:
- **Mention rate**: % of prompts where AtlasVoice appears at all
- **Position**: Average position when mentioned (lower = better)
- **Sentiment**: + / 0 / - across mentions
- **Accuracy**: Are price, feature, language counts correct?

Target by Day 90:
- Mention rate on "best WordPress TTS plugin" prompts: 60% (from estimated 30-40%)
- Mention rate on accessibility prompts: 50% (from estimated 20%)
- 100% accuracy on price + feature mentions (no AI invented details)

---

> **SearchFit.ai** runs all these prompts daily across ChatGPT / Claude / Gemini / Perplexity and tracks rank, sentiment, and accuracy drift. https://searchfit.ai
