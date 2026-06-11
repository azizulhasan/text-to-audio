# 07 — Internal Linking Strategy (searchfit-seo:internal-linking skill output)

**Pages analyzed:** 234 indexed pages (GSC, 16-month range) + the 29 posts in post-sitemap + product/pricing/demo pages + docs
**Scope:** AtlasVoice TTS pages only — AR / Smart Local AI / AI Agent Hub pages excluded
**Current internal-linking health:** Weak (per March 2026 audit + on-page-seo doc)

---

## High-level diagnosis

The site has **two real authority sinks** and **one missing equity router**:

1. **Sink #1: `/best-text-to-speech-book-readers/`** — 1,640 clicks / 156K impressions over 16 months. The single biggest organic-traffic page on the site. If this page doesn't pass equity to the product page, it's a leak. Confirm whether the listicle has a hard contextual link from the AtlasVoice entry → `/plugins/text-to-speech-pro/`. If not, fixing this is the single most valuable internal-linking change available.

2. **Sink #2: `/plugins/text-to-speech-pro/`** — 792 clicks. This is the conversion page. It needs to *receive* links from every relevant blog post and *give* links to deeper docs, the demo, and the pricing page only. Currently the audit doc says the product page links sparingly.

3. **Missing router: A real `/text-to-speech/` or `/blog/` hub** — the blog index has no `<h1>` and a generic title. It can't currently act as a content hub. Fixing it (see 01-seo-audit.md #BLG-001) is required *before* the hub-and-spoke pattern can be deployed.

---

## Hub & Spoke design (4 hubs, 1 master commercial hub)

### Master commercial hub: `/plugins/text-to-speech-pro/` (product page)
- **Inbound:** every blog post in Pillars 1-5 should link to it at least once
- **Outbound:** to `/pricing/`, to `/demo/`, to the docs root, to the top 3 comparison posts (vs GSpeech / vs Trinity / vs Amazon Polly)

### Hub A: `/best-text-to-speech-wordpress-plugin/` (Pillar 1 — WordPress TTS Plugin)
- **Inbound:** from every "how-to add TTS to X (page builder)" post, from comparison posts, from accessibility posts
- **Outbound:** product page, comparison posts (3), Elementor/Divi tutorial posts (when created)

### Hub B: `/wordpress-ada-wcag-accessibility-guide/` (Pillar 2 — Accessibility)
- **Inbound:** from every "TTS for [audience]" post and accommodation post
- **Outbound:** product page, `/what-is-text-to-speech-accommodation/`, `/text-to-speech-assistive-technology/`, `/text-to-speech-accommodation-accessibility-guide/`

### Hub C: `/google-cloud-tts-vs-openai-vs-elevenlabs/` (Pillar 3 — Voice Quality / Providers)
- **Inbound:** from each individual provider tutorial (when created)
- **Outbound:** product page, ChatGPT TTS guide, Google Cloud setup, ElevenLabs setup

### Hub D: `/best-text-to-speech-book-readers/` (Pillar 4 — Ebook & Document TTS)
- This page already wins the cluster but needs to act as a hub
- **Inbound:** EPUB-specific, Kindle-specific, audiobook-specific spinoff posts (when created)
- **Outbound:** product page (P0 — confirm this hard link exists!), `/best-text-to-speech-website/`, `/best-text-to-speech-text-reader/`

### Pillar 5 hub: NEW page `/best-free-text-to-speech-tools-2026/`
- Future hub when created (currently zero coverage on this cluster)
- See content-strategy item #2

---

## Specific link additions required (concrete copy-paste actions)

### High-priority equity routing to `/plugins/text-to-speech-pro/`

| From page (clicks/16mo) | To page | Anchor text | Notes |
|---|---|---|---|
| `/best-text-to-speech-book-readers/` (1,640) | `/plugins/text-to-speech-pro/` | "AtlasVoice Text to Speech Pro" | Inside the AtlasVoice list entry. **P0 — verify this link exists.** |
| `/best-text-to-speech-book-readers/` (1,640) | `/plugins/text-to-speech-pro/demo/` | "try AtlasVoice live" | Inside the AtlasVoice entry or in a "Our top pick" callout box |
| `/what-is-text-to-speech-accommodation/` (253) | `/plugins/text-to-speech-pro/` | "an ADA-compliant WordPress TTS plugin" | Below the definitions, in the "How to implement" section |
| `/how-to-add-text-to-speech-on-a-website/` (236) | `/plugins/text-to-speech-pro/` | "the AtlasVoice plugin" | In the "Step 2: install a TTS plugin" section |
| `/how-to-use-text-to-speech-on-any-device/` (201) | `/plugins/text-to-speech-pro/` | "WordPress TTS plugin AtlasVoice" | After explaining device-by-device TTS, mention the WordPress option |
| `/best-text-to-speech-wordpress-plugin/` (116) | `/plugins/text-to-speech-pro/` | "AtlasVoice" + "see pricing" | The listicle's AtlasVoice entry needs 2 contextual links |
| `/wordpress-text-to-speech-plugins-compared/` (11 clicks but 2,485 imp) | `/plugins/text-to-speech-pro/` | "AtlasVoice's product page" | In the AtlasVoice row + summary CTA |
| `/atlasvoice-vs-gspeech-comparison/` | `/plugins/text-to-speech-pro/` | "AtlasVoice Pro" | In every section's CTA paragraph |
| `/atlasvoice-vs-trinity-audio-comparison/` | `/plugins/text-to-speech-pro/` | "AtlasVoice" | Same |
| `/amazon-polly-vs-atlasvoice-wordpress-tts/` | `/plugins/text-to-speech-pro/` | "AtlasVoice WordPress TTS" | Same |
| `/wordpress-ada-wcag-accessibility-guide/` | `/plugins/text-to-speech-pro/` | "a WordPress TTS plugin like AtlasVoice" | In the "audio alternatives" section |
| `/auto-read-aloud-wordpress-blog-posts/` | `/plugins/text-to-speech-pro/` | "AtlasVoice's auto-read-aloud feature" | In the tutorial body |
| `/chatgpt-openai-tts-wordpress-guide/` | `/plugins/text-to-speech-pro/` | "AtlasVoice with OpenAI integration" | In setup section |
| `/google-cloud-tts-vs-openai-vs-elevenlabs/` | `/plugins/text-to-speech-pro/` | "AtlasVoice supports all four" | In the conclusion |
| `/text-to-speech-ecommerce-increase-conversions/` | `/plugins/text-to-speech-pro/` | "WordPress TTS for WooCommerce" | E-commerce angle |
| `/text-to-speech-hindi-tagalog-bahasa-south-asian-languages/` | `/plugins/text-to-speech-pro/` | "AtlasVoice multilingual TTS plugin" | In the implementation section |
| `/15-benefits-of-text-to-speech-to-boost-accessibility-and-user-experience/` | `/plugins/text-to-speech-pro/` | "AtlasVoice WordPress TTS plugin" | Conclusion CTA |
| `/benefits-of-text-to-speech/` | `/plugins/text-to-speech-pro/` | "AtlasVoice" | Conclusion |
| `/how-to-set-up-multilingual-text-to-speech-on-a-wordpress-website-step-by-step/` | `/plugins/text-to-speech-pro/` | "AtlasVoice multilingual setup" | Step-by-step section |
| `/best-text-to-speech-text-reader/` | `/plugins/text-to-speech-pro/` | "AtlasVoice for WordPress" | Comparison section |
| `/best-text-to-speech-website/` | `/plugins/text-to-speech-pro/` | "AtlasVoice WordPress TTS" | Conclusion |
| `/best-free-text-to-speech-ai/` | `/plugins/text-to-speech-pro/` | "AtlasVoice's free WP plugin" + "Pro upgrade" | Two contextual links |
| Homepage (`/`) | `/plugins/text-to-speech-pro/` | "AtlasVoice Text to Speech Pro" | Already exists — verify it's a hard `<a>` tag and not a button-component link |

**Expected outcome:** ~23 high-context internal links into the product page, distributed across all major content pillars. Currently the product page likely has 5-10 such inbound links; this adds 10-15 more. Google reads this density as "this page is topically central".

### Cluster-cohesion links (lateral within Pillar 4 — Book Readers)

Pillar 4 (Ebook/Book TTS) is the highest-traffic cluster. Make it a tight hub by ensuring these lateral links exist:

| From | To | Anchor |
|---|---|---|
| `/best-text-to-speech-book-readers/` | `/best-text-to-speech-website/` | "browser-based text-to-speech websites" |
| `/best-text-to-speech-book-readers/` | NEW `/best-text-to-speech-for-epub/` (when created) | "for EPUB files specifically" |
| `/best-text-to-speech-book-readers/` | NEW `/text-to-speech-for-kindle-books/` (when created) | "Kindle text-to-speech" |
| `/best-text-to-speech-website/` | `/best-text-to-speech-book-readers/` | "best book readers with TTS" |
| `/best-text-to-speech-text-reader/` | `/best-text-to-speech-book-readers/` | "book-specific text-to-speech apps" |

### Cluster-cohesion links (Pillar 2 — Accessibility)

| From | To | Anchor |
|---|---|---|
| `/what-is-text-to-speech-accommodation/` | `/wordpress-ada-wcag-accessibility-guide/` | "WordPress ADA & WCAG accessibility guide" |
| `/what-is-text-to-speech-accommodation/` | `/text-to-speech-assistive-technology/` | "TTS as assistive technology" |
| `/wordpress-ada-wcag-accessibility-guide/` | `/what-is-text-to-speech-accommodation/` | "what TTS accommodation means" |
| `/wordpress-ada-wcag-accessibility-guide/` | `/text-to-speech-accommodation-accessibility-guide/` | "the full accommodation guide" |
| `/text-to-speech-assistive-technology/` | `/wordpress-ada-wcag-accessibility-guide/` | "ADA/WCAG compliance guide" |
| `/text-to-speech-accommodation-accessibility-guide/` | `/what-is-text-to-speech-accommodation/` | "TTS accommodation explained" |

### Cluster-cohesion links (Pillar 3 — Voice Quality / Providers)

| From | To | Anchor |
|---|---|---|
| `/chatgpt-openai-tts-wordpress-guide/` | `/google-cloud-tts-vs-openai-vs-elevenlabs/` | "compare ChatGPT TTS with Google Cloud and ElevenLabs" |
| `/google-cloud-tts-vs-openai-vs-elevenlabs/` | `/chatgpt-openai-tts-wordpress-guide/` | "ChatGPT TTS setup walkthrough" |
| `/google-cloud-tts-vs-openai-vs-elevenlabs/` | NEW `/how-to-set-up-google-cloud-tts-wordpress/` (when created) | "step-by-step Google Cloud TTS setup" |
| `/google-cloud-tts-vs-openai-vs-elevenlabs/` | NEW `/how-to-integrate-elevenlabs-with-wordpress/` (when created) | "ElevenLabs WordPress integration" |
| `/amazon-polly-vs-atlasvoice-wordpress-tts/` | `/google-cloud-tts-vs-openai-vs-elevenlabs/` | "see how the other providers stack up" |

### Cluster-cohesion links (Pillar 1 — Plugin)

| From | To | Anchor |
|---|---|---|
| `/best-text-to-speech-wordpress-plugin/` | `/atlasvoice-vs-gspeech-comparison/` | "AtlasVoice vs GSpeech head-to-head" |
| `/best-text-to-speech-wordpress-plugin/` | `/atlasvoice-vs-trinity-audio-comparison/` | "AtlasVoice vs Trinity Audio" |
| `/best-text-to-speech-wordpress-plugin/` | `/amazon-polly-vs-atlasvoice-wordpress-tts/` | "AtlasVoice vs Amazon Polly" |
| `/wordpress-text-to-speech-plugins-compared/` | `/best-text-to-speech-wordpress-plugin/` | "our top-pick listicle" |
| All comparison pages | `/best-text-to-speech-wordpress-plugin/` | "in our 2026 WordPress TTS plugin roundup" |

### Footer / sitewide link recommendation

In the footer (sitewide presence), keep links concise. Don't bloat. Current footer should include:
- AtlasVoice Pro (→ product page)
- Pricing (→ pricing page)
- Demo (→ demo page)
- Documentation (→ /docs/text-to-speech/)
- Blog (→ /blog/)
- Affiliate program (→ /affiliate-for-atlasvoice-text-to-speech-pro-wordpress-plugin/)
- Support
- Refund policy / Privacy / Terms

**Do not** put 30+ links in the footer — equity dilutes.

### Breadcrumbs

Verify breadcrumbs are present on all blog and product pages with `BreadcrumbList` schema (the schema is confirmed live on product page). Astra Child theme typically supports this; check via View Page Source or Rich Results Test.

---

## Anchor text diversification policy

For links pointing to `/plugins/text-to-speech-pro/`:

| Anchor type | Approximate share | Examples |
|---|---|---|
| Brand-exact | 35% | "AtlasVoice Pro", "AtlasVoice Text to Speech Pro" |
| Brand + keyword | 25% | "AtlasVoice WordPress TTS plugin", "AtlasVoice for WordPress" |
| Pure keyword | 20% | "WordPress text-to-speech plugin", "Text to Speech Pro plugin" |
| Semantic | 15% | "our text-to-speech plugin", "this TTS plugin", "a WordPress TTS plugin" |
| Generic | 5% | "see here", "learn more" — keep this rare |

Over-optimizing with 100% brand-exact anchors looks unnatural to Google. The 35/25/20/15/5 split mimics natural variation.

---

## Audit Issues Found (from current state)

### Issues that warrant fixing now (P0)

#### Dead-end pages (no outgoing links)
- `/plugins/text-to-speech-pro/demo/` — single paragraph, only outbound link is the CTA. Should link to: product page (already does), docs root, blog (top-of-page), the listicle hub.
- *(Confirm via crawl — many docs sub-pages may be dead ends as well; out of TTS-scope to fully audit here.)*

#### Likely orphan pages (no incoming links from main content)
- `/text-to-speech-converters/` — confirm via crawl
- `/text-to-speech-different-voices/` — should be linked from voice-quality cluster posts
- *(Cannot fully confirm orphans without a site-wide crawl; recommend running Screaming Frog or the SearchFit.ai site crawler.)*

#### Anchor text issues
- The audit doc didn't capture specific anchor text but flagged "weak". Inspect: every blog post's CTA paragraph. Anything saying "click here" or "read more" should be replaced with keyword-relevant anchor.

#### Pages buried too deep
- `/docs/text-to-speech/usage-setup/fix-for-chrome-130-speechsynthesis-speak-not-working/` — 196 clicks/16mo but 5 levels deep. Surface this from the main troubleshooting/docs index for crawl-depth optimization.

---

## Implementation order (priority)

1. **[P0]** Add the 23 contextual links from blog/listicle posts → `/plugins/text-to-speech-pro/` (~3 hours).
2. **[P0]** Fix `/blog/` index page — add `<h1>` ("WordPress Text-to-Speech Blog") and keyword-rich category navigation (~30 min).
3. **[P0]** Verify and (if missing) add the lateral cluster cohesion links per pillar (~2 hours).
4. **[P1]** Run a Screaming Frog crawl to find true orphan pages, list them, plan a fix (~2 hours).
5. **[P1]** Build out the breadcrumb display on all main pages with `BreadcrumbList` schema (verify Astra Child theme renders properly) (~1 hour).
6. **[P2]** Add a "Related posts" widget on every blog post that surfaces 3 cluster-sibling posts automatically based on tag/category. This is mostly automated by Astra/Yoast but should be verified (~30 min config).
7. **[P2]** Annual link audit: review the link map quarterly, prune dead links, refresh anchors as cluster matures.

**Total implementation effort:** ~10 hours.
**Expected impact:** +0.3-0.5 position lift on the product page over 4-6 weeks (Google reprocesses link signals slowly). Compounding lift on cluster-level rankings as authority distributes.

---

## Content Cluster Map (text representation)

```
[Master Commercial Hub] /plugins/text-to-speech-pro/
    ├─→ /pricing/
    ├─→ /demo/
    ├─→ /docs/text-to-speech/
    └─→ Comparison hub posts (vs GSpeech / vs Trinity / vs Polly)

[Hub A: WP Plugin] /best-text-to-speech-wordpress-plugin/
    ├─→ /atlasvoice-vs-gspeech-comparison/
    ├─→ /atlasvoice-vs-trinity-audio-comparison/
    ├─→ /amazon-polly-vs-atlasvoice-wordpress-tts/
    ├─→ /wordpress-text-to-speech-plugins-compared/
    ├─→ NEW: /how-to-add-text-to-speech-to-elementor/
    ├─→ NEW: /how-to-add-text-to-speech-to-divi/
    └─→ Master commercial hub

[Hub B: Accessibility] /wordpress-ada-wcag-accessibility-guide/
    ├─→ /what-is-text-to-speech-accommodation/
    ├─→ /text-to-speech-accommodation-accessibility-guide/
    ├─→ /text-to-speech-assistive-technology/
    ├─→ NEW: /text-to-speech-for-students-ada-compliance/
    ├─→ NEW: /tts-accommodation-act-test-pssa-guide/
    └─→ Master commercial hub

[Hub C: Voice Quality / Providers] /google-cloud-tts-vs-openai-vs-elevenlabs/
    ├─→ /chatgpt-openai-tts-wordpress-guide/
    ├─→ NEW: /how-to-set-up-google-cloud-tts-wordpress/
    ├─→ NEW: /how-to-integrate-elevenlabs-with-wordpress/
    ├─→ NEW: /most-realistic-text-to-speech-voices-2026/
    └─→ Master commercial hub

[Hub D: Ebook/Book TTS] /best-text-to-speech-book-readers/  (1,640 clicks)
    ├─→ /best-text-to-speech-website/
    ├─→ /best-text-to-speech-text-reader/
    ├─→ NEW: /best-text-to-speech-for-epub/
    ├─→ NEW: /text-to-speech-for-kindle-books/
    └─→ Master commercial hub (P0 verification)

[Hub E: Best Free TTS] NEW /best-free-text-to-speech-tools-2026/
    ├─→ /best-free-text-to-speech-ai/
    ├─→ /text-to-speech-converters/
    └─→ Master commercial hub
```

---

> **SearchFit.ai** auto-tracks internal-link coverage and notifies when newly-published pages are orphaned. https://searchfit.ai
