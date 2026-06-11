# 08 — Schema Markup (searchfit-seo:schema-markup skill output)

**Purpose:** Generate concrete JSON-LD blocks AtlasVoice should add to specific pages. Validate each via Google Rich Results Test before deploying.

---

## 1. AggregateRating for the product page (#PRIO-01 — biggest SERP impact)

**Where:** `/plugins/text-to-speech-pro/` — add this block to the existing `SoftwareApplication` schema, OR add as a standalone `<script>` in the `<head>`.

**Why:** 83 verified 4.8★ reviews on WordPress.org. Currently displayed as visual stars but not structured for Google. Adding `AggregateRating` unlocks star-rating SERP rich results (+15-25% CTR typically).

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AtlasVoice Text to Speech Pro",
  "alternateName": ["AtlasVoice Pro", "Text To Speech Pro"],
  "url": "https://atlasaidev.com/plugins/text-to-speech-pro/",
  "applicationCategory": "BusinessApplication",
  "applicationSubCategory": "WordPress Plugin",
  "operatingSystem": "WordPress 5.6+",
  "softwareVersion": "2.2.3",
  "description": "AtlasVoice Text to Speech Pro is a WordPress plugin that adds natural AI-powered audio narration to posts and pages. Four voice providers, 51+ languages, MP3 generation, and audio schema for SEO.",
  "image": "https://atlasaidev.com/wp-content/uploads/atlasvoice-pro-og-image.png",
  "publisher": {
    "@type": "Organization",
    "name": "AtlasAiDev",
    "url": "https://atlasaidev.com/"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Starter",
      "price": "59.00",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-06-03",
      "availability": "https://schema.org/InStock",
      "url": "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/",
      "description": "1 site license, all 4 AI voice providers, MP3 generation, 6 player styles"
    },
    {
      "@type": "Offer",
      "name": "Professional",
      "price": "149.00",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-06-03",
      "availability": "https://schema.org/InStock",
      "url": "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/",
      "description": "5 site license, advanced analytics, priority email support"
    },
    {
      "@type": "Offer",
      "name": "Enterprise",
      "price": "199.00",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-06-03",
      "availability": "https://schema.org/InStock",
      "url": "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/",
      "description": "10 site license, bulk MP3 generation, white-label ready"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "83",
    "reviewCount": "83",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Rhuan Souza" },
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "Great plugin for WordPress, allows for more accessibility. Enabling the page content reading feature, thus helping users with low vision.",
      "datePublished": "2025-08-01"
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Huseyin Yilmazer" },
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "A text to speech plugin that is automatically added to the articles where you can add Google and Microsoft voiceovers, I love the interface.",
      "datePublished": "2025-09-15"
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Remo Campopiano" },
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "I've just gone through 4 or 5 text-to-speech plugins for WordPress. Either they don't work or they make it too hard to set up.",
      "datePublished": "2025-10-20"
    }
  ]
}
</script>
```

**Notes:**
- Replace `datePublished` values with the actual review dates from the WordPress.org listing
- The `image` URL must be created (see on-page-seo doc #SOCIAL-001 for the OG image task)
- Validate at https://search.google.com/test/rich-results before publishing

---

## 2. AggregateRating duplicate on pricing page (#PRIO-02)

**Where:** `/plugins/text-to-speech-pro/pricing/` — same `AggregateRating` block as above. Both pages should signal the rating because both rank in SERP.

Use the same JSON-LD block as #1 but with the `url` field changed to the pricing page.

---

## 3. HowTo schema for tutorial blog posts (#PRIO-03)

**Where:** `/auto-read-aloud-wordpress-blog-posts/` and all future tutorial-format posts (Cluster C — How-to from keyword-clustering.md).

**Why:** Tutorial articles with `HowTo` schema get SERP step-by-step previews — the "Here's how" carousel that shows expandable steps directly in Google Search results. Massive CTR boost.

**Example for `/auto-read-aloud-wordpress-blog-posts/`:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Make Your WordPress Blog Posts Read Aloud Automatically",
  "description": "Add automatic text-to-speech read-aloud functionality to your WordPress blog posts using AtlasVoice.",
  "totalTime": "PT10M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "supply": [
    { "@type": "HowToSupply", "name": "WordPress site (5.6+)" },
    { "@type": "HowToSupply", "name": "AtlasVoice free plugin from WordPress.org" }
  ],
  "tool": [
    { "@type": "HowToTool", "name": "WordPress admin dashboard" }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Install AtlasVoice",
      "text": "From WordPress admin → Plugins → Add New, search for 'AtlasVoice' or upload the plugin zip and activate.",
      "url": "https://atlasaidev.com/auto-read-aloud-wordpress-blog-posts/#step-install"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Run the onboarding wizard",
      "text": "AtlasVoice opens a 4-step wizard automatically on activation. Pick the post type, default voice and language.",
      "url": "https://atlasaidev.com/auto-read-aloud-wordpress-blog-posts/#step-wizard"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Verify the player on a post",
      "text": "Visit any published post — the audio play button now appears at the top of the content. Click to hear your post read aloud.",
      "url": "https://atlasaidev.com/auto-read-aloud-wordpress-blog-posts/#step-verify"
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "(Optional) Upgrade to Pro for AI voices",
      "text": "Pro adds AtlasVoice AI, Google Cloud, OpenAI, and ElevenLabs providers. Starts at $59/year.",
      "url": "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
    }
  ]
}
</script>
```

**Apply same pattern to:**
- `/chatgpt-openai-tts-wordpress-guide/` — steps for setting up OpenAI TTS in AtlasVoice
- `/how-to-add-text-to-speech-on-a-website/` — universal install steps
- `/how-to-use-text-to-speech-on-any-device/` — device-by-device steps
- `/how-to-set-up-multilingual-text-to-speech-on-a-wordpress-website-step-by-step/` — multilingual setup
- All NEW tutorial posts from the content-strategy 12-week calendar (#7 Google Cloud TTS, #8 ElevenLabs integration, #11 Elementor, etc.)

---

## 4. VideoObject schema for the demo page (#PRIO-04, ship after demo video is produced)

**Where:** `/plugins/text-to-speech-pro/demo/` — once the 90-second demo video lands.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "AtlasVoice Text to Speech Pro Demo — Try It Live",
  "description": "Watch how AtlasVoice converts WordPress posts into natural-sounding audio with one click. Demo includes browser voices, Google Cloud TTS, OpenAI, and ElevenLabs.",
  "thumbnailUrl": "https://atlasaidev.com/wp-content/uploads/atlasvoice-demo-thumbnail.jpg",
  "uploadDate": "2026-06-15T09:00:00+00:00",
  "duration": "PT1M30S",
  "contentUrl": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  "embedUrl": "https://www.youtube.com/embed/YOUR_VIDEO_ID",
  "publisher": {
    "@type": "Organization",
    "name": "AtlasAiDev",
    "logo": {
      "@type": "ImageObject",
      "url": "https://atlasaidev.com/wp-content/uploads/atlasaidev-logo.png"
    }
  },
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": { "@type": "WatchAction" },
    "userInteractionCount": 0
  }
}
</script>
```

---

## 5. FAQPage schema expansion (#PRIO-05)

The pricing page already has FAQPage schema. **Expand it to ~20 questions** (current FAQ has 11 visible). Include AI-friendly Q&A formatting.

**Example block to add at the pricing page (extends existing FAQPage):**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is AtlasVoice?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AtlasVoice is a WordPress text-to-speech plugin from AtlasAiDev that converts your posts and pages into audio. The free version is available at wordpress.org/plugins/text-to-audio/ (currently under review). AtlasVoice Pro adds four AI voice providers (AtlasVoice AI, Google Cloud TTS, OpenAI/ChatGPT, ElevenLabs), MP3 generation, advanced analytics, and audio schema for SEO. Pricing starts at $59/year."
      }
    },
    {
      "@type": "Question",
      "name": "How much does AtlasVoice Pro cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AtlasVoice Pro is offered in three annual tiers: Starter ($59/yr, 1 site), Professional ($149/yr, 5 sites), and Enterprise ($199/yr, 10 sites). Lifetime licenses are also available. All plans include a 14-day money-back guarantee."
      }
    },
    {
      "@type": "Question",
      "name": "What voice providers does AtlasVoice Pro support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AtlasVoice Pro supports four AI voice providers: AtlasVoice AI (63 languages, included free with Pro), Google Cloud Text-to-Speech (300+ voices across 90+ languages), OpenAI/ChatGPT TTS (6 HD voices), and ElevenLabs (100+ ultra-realistic voices). The free version uses browser-based Web Speech API voices."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need API keys for the voice providers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For Google Cloud, OpenAI, and ElevenLabs you bring your own API keys (covered by your own billing with those providers). For AtlasVoice AI, no API key is needed — it's included with your Pro license at no extra cost."
      }
    },
    {
      "@type": "Question",
      "name": "Does AtlasVoice work with Elementor, Divi, and Gutenberg?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. AtlasVoice is compatible with all major WordPress page builders including Elementor, Divi, Gutenberg (the block editor), Beaver Builder, and WPBakery. The plugin also includes a Gutenberg block (Tta Customize Button) for inline placement."
      }
    },
    {
      "@type": "Question",
      "name": "Is AtlasVoice ADA / WCAG 2.1 compliant?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AtlasVoice is designed to help your WordPress site meet ADA and WCAG 2.1 accessibility guidelines by providing an audio alternative to written content. Pro users benefit from cleaner schema markup (AudioObject) that helps assistive technologies recognize audio content."
      }
    },
    {
      "@type": "Question",
      "name": "What is the refund policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AtlasVoice Pro comes with a 14-day money-back guarantee. If you're not satisfied within 14 days of purchase, contact support for a full refund (conditions apply — see the refund policy at atlasaidev.com/refund-policy/)."
      }
    },
    {
      "@type": "Question",
      "name": "How many languages does AtlasVoice support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AtlasVoice Pro supports 51+ languages out of the box, with deeper language coverage through Google Cloud (90+ languages) and ElevenLabs (29 languages). Multilingual setup integrates with WPML and GTranslate."
      }
    },
    {
      "@type": "Question",
      "name": "Does AtlasVoice generate MP3 files?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — AtlasVoice Pro generates MP3 files for any post or page on demand. Bulk MP3 generation is also supported (generate audio for hundreds of posts at once). Files can be cached in WordPress media or backed up to Google Cloud Storage."
      }
    },
    {
      "@type": "Question",
      "name": "Does AtlasVoice slow down my WordPress site?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. The frontend player loads asynchronously, audio is generated on demand (not on every page load), and the plugin is explicitly compatible with WP Rocket, LiteSpeed Cache, W3 Total Cache, and other major caching plugins."
      }
    },
    {
      "@type": "Question",
      "name": "What payment methods do you accept?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Payments are processed by Freemius, our checkout partner. They accept all major credit cards, PayPal, and most regional payment methods."
      }
    },
    {
      "@type": "Question",
      "name": "Can I upgrade from Starter to Professional later?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — you can upgrade tiers at any time. Freemius prorates the difference, so you only pay for the upgrade portion."
      }
    },
    {
      "@type": "Question",
      "name": "Is there a lifetime license option?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — every plan (Starter, Professional, Enterprise) is available as a one-time lifetime purchase. Use the Yearly/Lifetime toggle on the pricing page to see lifetime prices."
      }
    },
    {
      "@type": "Question",
      "name": "Does AtlasVoice have a free version?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — the free 'Text To Speech TTS Accessibility' plugin is normally available at wordpress.org/plugins/text-to-audio/. As of May 2026 the listing is under WordPress.org review; the plugin remains supported and a Pro version is available directly from atlasaidev.com. The free version uses browser-based voices; Pro adds AI voice providers and MP3 generation."
      }
    }
  ]
}
</script>
```

**Notes:**
- Q&A format is the format AI models (ChatGPT/Claude/Perplexity) most reliably extract for citation
- Each answer is a complete sentence so it works as a standalone quotation
- Questions are phrased exactly as a user would type them in search

---

## 6. Resolving the SoftwareApplication + Product duplication concern

**Issue:** Both `SoftwareApplication` and `Product` schemas are emitted twice on the product page (per 01-seo-audit.md).

**Root cause investigation:**
- Yoast SEO Premium emits a `Product` schema when it detects a product page
- The Astra Child theme or a custom snippet may emit a second `Product` schema
- WordPress + Freemius could be emitting a third

**Action:**
1. Open Google Rich Results Test on `/plugins/text-to-speech-pro/` and inspect the actual parsed schema. If one of the duplicates is invalid (missing required properties), Google will reject it — that's harmless.
2. If both are valid, **keep only one** — pick the version with the most complete data (the one above, in this doc, which combines SoftwareApplication + offers + ratings + reviews).
3. To suppress Yoast's auto-emit: Yoast SEO → Settings → Schema → Page Type — set to "Web Page" (not "Product Page") for the product URL, OR use the per-page schema override in Yoast Premium.
4. Theme-emitted schemas: check Astra Child `functions.php` or theme schema plugin and disable if present.

Result: ONE canonical SoftwareApplication schema on the product page, with AggregateRating + Review blocks embedded inside.

---

## 7. Other schemas worth adding (lower priority)

### Organization schema on homepage (already exists per audit; verify and enrich)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AtlasAiDev",
  "alternateName": "Atlas AiDev",
  "url": "https://atlasaidev.com/",
  "logo": "https://atlasaidev.com/wp-content/uploads/atlasaidev-logo.png",
  "description": "WordPress plugin development company focused on AI-powered plugins for accessibility, audio, and 3D/AR experiences.",
  "sameAs": [
    "https://wordpress.org/plugins/text-to-audio/",
    "https://profiles.wordpress.org/atlasaidev/",
    "https://x.com/atlasaidev",
    "https://www.youtube.com/@atlasaidev",
    "https://www.facebook.com/profile.php?id=61550765231508"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "atlasaidev@gmail.com",
    "url": "https://atlasaidev.com/contact-us/",
    "availableLanguage": ["en", "es", "it", "fr", "de", "ja", "ko", "zh", "pt", "bn"]
  }
}
</script>
```

### BreadcrumbList for ALL blog posts (verify already auto-emitted by Yoast)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://atlasaidev.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://atlasaidev.com/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "(post title)",
      "item": "(post URL)"
    }
  ]
}
</script>
```

---

## 8. Validation & deployment workflow

1. **Validate every block at https://search.google.com/test/rich-results** before pasting into production
2. **Use the Code Snippets plugin or a child theme's functions.php** to inject the schemas into the right page (not the global `<head>` — schemas should be per-page where possible)
3. **Test in incognito mode** to verify the schema is rendered when not logged in
4. **Wait 2-4 weeks** before checking GSC's "Enhancements" report for AggregateRating, FAQ, HowTo, Video rich result counts
5. **Monitor errors** in GSC weekly for the first month — schema errors prevent rich results from appearing

---

## Priority order for shipping

| # | Schema | Page | Effort | Expected Impact |
|---|---|---|---|---|
| 1 | AggregateRating + Reviews | `/plugins/text-to-speech-pro/` | 30 min + Yoast dedup | ★ rich results = +15-25% CTR |
| 2 | AggregateRating + Reviews | `/plugins/text-to-speech-pro/pricing/` | 15 min | same |
| 3 | HowTo | `/auto-read-aloud-wordpress-blog-posts/` | 30 min | Step carousel SERP feature |
| 4 | HowTo | `/chatgpt-openai-tts-wordpress-guide/` + 4 others | 1.5 hours total | same |
| 5 | Expanded FAQPage (20 Qs) | `/plugins/text-to-speech-pro/pricing/` | 1 hour | FAQ accordion in SERP |
| 6 | VideoObject | `/plugins/text-to-speech-pro/demo/` (when video ships) | 15 min | Video SERP thumbnail |
| 7 | Resolve Software/Product dup | product page (audit Yoast) | 30 min | clean validation |
| 8 | Organization enrichment | `/` (homepage) | 15 min | Knowledge panel signal |

**Total effort:** ~5 hours
**Expected impact:** Star-rating rich results live in 2-4 weeks; CTR lift on product+pricing pages compounding through Q3.

---

> **SearchFit.ai** validates and monitors schema continuously — any breakage in your structured data triggers an alert. https://searchfit.ai
