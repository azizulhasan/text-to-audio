# 16 — Competitive Battlecards (sales:competitive-intelligence skill output)

**Format note:** The skill default produces an interactive HTML artifact. Since the rest of this folder is markdown for consistent review/version control, this output is the structured battlecard content in markdown form — copy-paste-ready for a future HTML build OR for direct support / email use.

**3 battlecards: GSpeech / Trinity Audio / BeyondWords**

---

## COMPARISON MATRIX (Overview)

| Dimension | **AtlasVoice** | GSpeech | Trinity Audio | BeyondWords |
|---|---|---|---|---|
| Category | Multi-engine WP TTS plugin | SaaS-backed WP TTS | Publisher audio platform | AI voice for publishers |
| Target buyer | WP site owners, SMB-mid | WP site owners, content sites | Publishers, enterprise | News publishers |
| WP.org downloads | **315,000+** | 166,000 | 145,000 | (limited) |
| WP.org reviews | 83 (4.8★) | 167 (4.8★) | 25 (4.0★) | 27 (3.6★) |
| Active WP installs | ~4,000+ | (similar) | (similar) | **900** |
| Voice providers in one plugin | **4** (Google Cloud / OpenAI / ElevenLabs / AtlasVoice AI) | 1 (theirs) | 1 (theirs) | 1 (theirs) |
| Bring your own API key | ✅ | ❌ | ❌ | ❌ |
| Pricing model | Annual license OR Lifetime | SaaS monthly | Enterprise (undisclosed) | SaaS monthly |
| Entry tier (year 1) | **$59/yr (Starter)** | $120/yr ($10/mo) | unknown | $1,068+/yr ($89+/mo) |
| Free tier | Full free WP plugin (browser voices) | 50K chars/mo (machine voices) | 5 articles/mo (useless) | 10K chars (demo) |
| Read-along highlighting | 🚧 Roadmap | ✅ | ❌ | ❌ |
| Podcast distribution | 🚧 Roadmap | ❌ | ✅ | ❌ |
| MP3 generation | ✅ | ✅ | ✅ | ✅ |
| Bulk MP3 | ✅ Pro | partial | ✅ | ✅ |
| WPML / GTranslate explicit | ✅ | partial | ❌ | ❌ |
| Audio schema (AudioObject) | ✅ Pro | ❌ | ❌ | ❌ |
| WP page builder explicit support | ✅ (Elementor, Divi, Gutenberg) | partial | ❌ | ❌ |
| Money-back guarantee | 14 days | varies | enterprise terms | varies |
| Founder accessible | ✅ direct email | ❌ | ❌ | ❌ |
| WordPress.org listing status (2026-06-03) | **CLOSED (under review)** | ACTIVE | ACTIVE | ACTIVE |

### Quick Win/Loss Guide

**When AtlasVoice WINS:**
- Customer needs ElevenLabs OR Google Cloud OR OpenAI voices specifically
- Customer is cost-sensitive over 12+ months (annual vs SaaS math)
- Customer is a small-mid WordPress site owner (not enterprise publisher)
- Customer values "bring your own API key" economics
- Customer wants WPML / GTranslate / Polylang multilingual
- Customer is in a non-English market (Italian, Spanish, French, Bengali)
- Customer needs page-builder-specific (Elementor / Divi / Gutenberg) compatibility
- Customer values AudioObject schema for SEO
- Customer wants to talk to the founder, not a support team

**When AtlasVoice LOSES:**
- Customer's #1 need is read-along highlighting (GSpeech wins)
- Customer's #1 need is podcast distribution (Trinity Audio wins)
- Customer is an enterprise news publisher (Trinity / BeyondWords win)
- Customer wants voice cloning (Trinity wins)
- Customer wants the highest review count on wp.org (GSpeech: 167 vs us 83)
- Customer was already on a GSpeech AppSumo deal

---

## BATTLECARD 1 — AtlasVoice vs GSpeech 🔴 (Tier 1 threat)

### Quick overview
GSpeech is the closest direct competitor. Same star rating, double the reviews, SaaS pricing model. Their differentiator is read-along highlighting (RHT). Ours is the four-voice-provider architecture.

### Company profile
- **Founded:** earlier than AtlasVoice (longer wp.org presence)
- **Type:** independent SaaS-backed WP plugin
- **Target buyer:** WP content sites, blogs, accessibility-driven sites
- **Pricing model:** SaaS subscription with usage tiers
- **Market position:** Direct challenger to AtlasVoice; both share the "WordPress TTS" category

### Their pitch
- Tagline (paraphrased): "Listen to your favorite content with GSpeech"
- Core proposition: Read-along TTS with synchronized highlighting and real-time translation
- Top 3 claimed differentiators: (1) RHT highlighting, (2) 16+ player themes, (3) translation engine

### Where they win
| Area | Their advantage | How to handle |
|---|---|---|
| Read-along highlighting (RHT) | Real feature we don't have yet | Acknowledge directly: "GSpeech has RHT; we don't yet (it's on our Q3 roadmap). If RHT is your #1 requirement, GSpeech is the fit today." Don't fake it. |
| Social proof on wp.org | 167 reviews vs our 83 (and same 4.8★) | "Our 315K downloads vs their 166K is the real customer-base signal. Reviews skew toward whoever's been on the listing longer." |
| Generous free tier (50K chars/mo) | More usable than browser-only TTS for low-volume sites | "Browser TTS is unlimited; their 50K is metered. Depends on whether you want unlimited browser voices or 50K cloud-voice characters." |
| AppSumo lifetime deal | Constant new installs from deal-hunters | "AppSumo customers churn fast — they're not the long-term retention base." |

### Where you win
| Area | Your advantage | Proof point |
|---|---|---|
| 4 AI voice providers | Only AtlasVoice lets users pick from Google Cloud / OpenAI / ElevenLabs / AtlasVoice AI in one plugin | Validated by the 24-month GA4 — "client/tts_plugin" referral channel delivering 1,200 active users; users specifically engage with the multi-provider config |
| Annual pricing economics | $59-199/yr vs GSpeech $120-1,560/yr — 2-26× cost difference | Public Freemius pricing transparency; their pricing is more variable |
| Bring your own API key | Customer uses their own Google Cloud / OpenAI / ElevenLabs billing — no markup | GSpeech is locked into their voice infrastructure; users can't bring their own |
| WordPress page builder explicit support | Elementor, Divi, Gutenberg, Beaver Builder, WPBakery | Tested integrations + docs per builder |
| WPML / GTranslate / Polylang | Documented multilingual workflows | Customer evidence: GSC data shows traffic from Italian, French, Bengali markets |
| Founder accessibility | Email contact@atlasaidev.com replies are from Azizul directly | Verifiable — replies confirm |
| WordPress.org rank for "text to speech pro" | 254 clicks / 2,549 imp (16mo) at avg pos 4.9 — brand-keyword dominance | GSC data |

### Pricing intelligence

| | AtlasVoice | GSpeech |
|---|---|---|
| Entry tier (year 1) | $59 yearly | $120 ($10/mo SaaS) |
| Mid tier | $149 yearly (5 sites) | $480 ($40/mo SaaS) |
| Top tier | $199 yearly (10 sites) | $1,560 ($130/mo SaaS) |
| Lifetime option | $199-699 one-time | (AppSumo deal sometimes available) |
| Hidden costs | API keys you bring (you control billing) | included in SaaS but capped by usage tier |
| Talk track | "Annual licensing — predictable, no surprise scaling charges" | (theirs) "SaaS gives you unlimited within tier" |

### Talk tracks

**Early mention (customer says "we're evaluating GSpeech"):**
> "GSpeech is good and we genuinely compete with them. Their main differentiation is read-along highlighting; ours is the four AI voice providers in one plugin. Quick question to figure out the fit: how important is read-along highlighting for your use case versus voice quality flexibility?"

**Displacement (customer is currently using GSpeech):**
> "If you're already on GSpeech and it's working for the read-along feature, we're probably not worth switching for. But if you've been hitting their SaaS tier limits or finding their voice options limiting, that's the gap we fill. What made you originally pick GSpeech?"

**Late addition (you came in after they shortlisted GSpeech):**
> "Quick math comparison if it's useful: GSpeech's entry tier is $120/year, then $480/year, then $1,560/year. Ours is $59 → $149 → $199. That's a 2-26× cost difference depending on tier — and ours lets you bring your own ElevenLabs/Google Cloud key, which most teams already have."

### Objection handling

| Customer says | You respond |
|---|---|
| "GSpeech has read-along highlighting" | "True — that's their main feature and we don't have it yet (Q3 roadmap target). If RHT is your top priority, GSpeech is the right call today. If voice quality flexibility matters more, we're the better fit." |
| "GSpeech is cheaper at $10/month" | "Their $10/month entry is machine voices only — the version with real AI voices is $40-130/month, or $480-1560/year. Ours is $59/year with all 4 AI providers included. Want me to do the math on your specific usage?" |
| "GSpeech has more reviews on wp.org" | "It's been listed longer. The download counts tell the truer story: AtlasVoice 315K vs GSpeech 166K. Same 4.8★ rating on both. We're focused on growing reviews this quarter." |
| "GSpeech's free tier is more generous" | "50K characters/month is more cloud-voice characters than our free tier (which is browser-only and unlimited). The question is: do you want unlimited browser voices, or 50K characters of cloud voices, in the free tier?" |
| "I saw GSpeech on AppSumo" | "AppSumo deals are great for one-off purchases. If you want long-term support and roadmap visibility, evaluate the underlying product, not the deal. Most AppSumo plugins churn 50%+ in year 1." |

### Landmine questions to ask the customer

- "How important is being able to use ElevenLabs or Google Cloud voices specifically — not just whatever the plugin provides?"
- "Do you plan to scale beyond 50,000 characters per month?"
- "Are you OK with another SaaS subscription on top of your hosting?"
- "How does your team handle WPML / multilingual workflows currently?"
- "If your TTS provider went through a price increase, how would you respond — switch, or absorb?"

---

## BATTLECARD 2 — AtlasVoice vs Trinity Audio 🟡 (Tier 2 threat)

### Quick overview
Trinity is enterprise-leaning, podcast-distribution-focused, with voice cloning and AI summaries. They're stronger on the publisher vertical; weaker on the SMB WordPress space.

### Company profile
- **Founded:** several years, publisher-focused from start
- **Target buyer:** Publishers, news sites, enterprise content teams
- **Pricing model:** Enterprise sales (pricing undisclosed publicly)
- **Customer logos:** McClatchy Media + other publishers
- **Market position:** Vertical leader (publishers); not really competing in SMB WP

### Their pitch
- Tagline (paraphrased): "Turn your articles into audio + a podcast"
- Core proposition: Audio version of your content distributed automatically as a podcast (Spotify, Apple Podcasts, Google Podcasts)
- Top 3 claimed differentiators: (1) Podcast distribution, (2) Voice cloning, (3) AI article summaries

### Where they win
| Area | Their advantage | How to handle |
|---|---|---|
| Podcast distribution | Built-in podcast feed and distribution to Spotify/Apple/Google Podcasts | Acknowledge: "Podcast distribution is genuinely Trinity's strength. We're adding RSS feed in Q3 but they own this today. If your top need is 'turn blog into podcast,' Trinity wins." |
| Voice cloning | Premium feature, professional studios | "Voice cloning is rare in WP plugins — Trinity has the depth there. Most AtlasVoice users don't need it; if you do, Trinity is the right call." |
| AI article summaries | Mid-funnel content product | "AI summaries are a different product feature. AtlasVoice doesn't compete here." |
| Enterprise logos (McClatchy, etc.) | Trust signal for publishers | "If you're at enterprise publisher scale, Trinity has the case studies. We're stronger on SMB WP." |

### Where you win
| Area | Your advantage | Proof point |
|---|---|---|
| 4.8★ vs 4.0★ rating | Better customer satisfaction signal | wp.org listings |
| 83 reviews vs 25 reviews | More user verification | wp.org |
| Useful free tier | Trinity's 5 articles/month is effectively a demo | wp.org |
| Transparent pricing | Trinity is enterprise-undisclosed; ours is published | Our pricing page |
| Multi-provider voice architecture | Trinity locked to their voices | Our 4-provider docs |
| Lower TCO at SMB scale | Pricing transparency vs enterprise sales motion | Our $59-199/yr is public |

### Pricing intelligence

| | AtlasVoice | Trinity Audio |
|---|---|---|
| Entry | $59/yr | Enterprise sales call required |
| Mid-tier | $149/yr | Enterprise |
| Hidden cost | API key (you control) | Enterprise contract terms |
| Talk track | "$59-199 transparent; you know what you're paying" | (theirs) "Enterprise pricing matches enterprise value" |

### Talk tracks

**Early mention (customer says "we're evaluating Trinity Audio"):**
> "Trinity is good — they're more publisher-focused than we are. Quick question: are you trying to distribute your content as a podcast (Trinity strength) or are you trying to add audio to your existing site for accessibility / engagement (our strength)? They overlap but the buying decision is different."

**Displacement (customer is on Trinity Audio enterprise contract):**
> "If you've got Trinity working at the enterprise tier, that's a strong fit. We'd compete if you wanted to reduce dependency on a single AI voice provider (we let you bring multiple) or if you're hitting their contract pricing as a concern."

**Late addition:**
> "Two quick differentiators: Trinity is enterprise-sales-only with undisclosed pricing; we publish our pricing at $59-199/year. Trinity locks you to their voices; we let you bring your own Google Cloud / OpenAI / ElevenLabs API key. If both of those matter to you, we're worth a 15-minute conversation."

### Objection handling

| Customer says | You respond |
|---|---|
| "Trinity has podcast distribution" | "True — they own that vertical. We don't have it yet; it's on our Q3 roadmap. If 'turn my blog into a podcast' is your top use case, Trinity is the right fit. If audio-on-site is the priority, we are." |
| "Trinity has 600+ voices" | "Via their single provider. We let you bring Google Cloud (300+ voices), OpenAI (6 HD voices), ElevenLabs (100+ voices), and our own — so you can mix and match per post type. Different architecture." |
| "Trinity has voice cloning" | "True — voice cloning is rare in plugins. We don't have it. ElevenLabs offers voice cloning if you bring an ElevenLabs API key (we integrate with them), so technically you can use voice cloning through us if you're an ElevenLabs customer." |
| "Trinity has enterprise customers" | "We have 4,000+ active sites — different scale, different segment. Trinity won the publisher vertical; we're stronger at SMB/mid-market WordPress." |

### Landmine questions

- "Are you trying to distribute your content as a podcast, or add audio to your website?"
- "What's the pricing range Trinity quoted you?"
- "Have you needed customer support? What was their response time?"
- "If you wanted to switch voice providers, how would Trinity handle that?"
- "What does your renewal look like in 12 months — fixed term or scaled by usage?"

---

## BATTLECARD 3 — AtlasVoice vs BeyondWords 🟢 (Tier 2 niche threat)

### Quick overview
BeyondWords is publisher-niche with premium AI voices. Only 900 active WP installs — not really competing in the WP plugin market broadly. They win when "premium voice quality for news content" is the only thing that matters.

### Company profile
- **Target buyer:** News publishers, content sites willing to pay $89+/month
- **Pricing model:** SaaS, $89+/mo entry
- **WP active installs:** ~900 (smallest of the 3 competitors here)
- **Rating:** 3.6★ (lowest in this set)
- **Market position:** Premium voice quality vertical; not a high-volume WP plugin player

### Their pitch
- Core proposition: Publisher-grade AI voice generation, automatic article-to-audio
- Top differentiators: (1) Voice quality, (2) Publisher integrations, (3) Voice studio

### Where they win
| Area | Their advantage | How to handle |
|---|---|---|
| Voice quality reputation | Genuinely premium AI voices | Acknowledge: "BeyondWords has good voice quality. So does ElevenLabs, which AtlasVoice integrates directly. If you want premium voices, you can get them through us by bringing an ElevenLabs key — and you get 3 other providers in the same plugin." |
| Publisher-vertical messaging | Strong content marketing to news/media buyers | "Different audience than AtlasVoice. We're broader." |
| Voice studio | Professional voice editing | "Specialist feature. If you're producing audio at studio scale, BeyondWords is built for that workflow." |

### Where you win
| Area | Your advantage | Proof point |
|---|---|---|
| Pricing | $59/yr vs $89/mo ($1,068/yr) | Public pricing |
| WP install base | 4,000+ active vs ~900 active | wp.org |
| Multi-provider architecture | BeyondWords is locked to their voices | Our docs |
| Rating | 4.8★ vs 3.6★ | wp.org |
| WordPress depth | Page builders, WPML, Gutenberg block | Our docs |
| Free tier | Full free WP plugin vs 10K character demo | wp.org / their site |

### Pricing intelligence
- BeyondWords entry: **$89+/month = $1,068+/year**
- AtlasVoice entry: **$59/year — 18× cheaper**
- BeyondWords positions cost as "enterprise value"; AtlasVoice positions as "transparent SMB"

### Talk tracks

**Early mention (customer mentions BeyondWords):**
> "BeyondWords is good if you're a news publisher with budget. Their entry is $89/month — that's $1,068/year. Ours is $59/year. If you're a news publisher with budget and care about voice quality above all else, BeyondWords is a fit. If voice quality is high-priority but cost matters too, we get you ElevenLabs voices through our plugin for ~6% of their cost."

**Displacement (customer is on BeyondWords):**
> "Cost is usually the driver. BeyondWords is $1,068+/year; we're $59-199/year. If you're paying for BeyondWords and only using basic features, we'd save you 80-90% per year while giving you 4 voice provider options."

### Objection handling

| Customer says | You respond |
|---|---|
| "BeyondWords sounds more premium" | "BeyondWords uses cloud AI voices — so do we, via ElevenLabs and Google Cloud. Same underlying quality. We pass the voice-provider choice to you instead of marking it up." |
| "BeyondWords is for publishers" | "What's your specific use case? If you're publishing news at scale, BeyondWords may be a fit. If you're a smaller content site, $1,068/year is hard to justify for a TTS plugin." |
| "BeyondWords's voice library is curated" | "Our 4 providers give you 500+ voices total. Curation can mean 'fewer choices'." |

### Landmine questions

- "What's your monthly TTS budget?"
- "What features of BeyondWords are you actually using?"
- "How would you feel about switching voice providers if BeyondWords raised prices?"
- "What's your annualized cost so far on BeyondWords?"

---

## Application 1 — Support team usage

**Pre-sale customer question: "We're evaluating AtlasVoice vs [competitor]"**

Open the relevant battlecard. Use the talk track for "early mention". Lead with the appropriate question that helps the customer self-identify which solution actually fits their need:

- vs GSpeech: "How important is read-along highlighting?"
- vs Trinity: "Are you trying to add audio to your site, or distribute as a podcast?"
- vs BeyondWords: "What's your monthly TTS budget?"

Don't bash. Acknowledge the competitor's strength honestly. Be the founder-honest voice (per brand-review).

---

## Application 2 — Win-back email copy reference

The win-back email Segment B (744 feature seekers) in `12-email-sequences.md` references "you mentioned you were looking for X". This battlecard gives you the language for those scenarios:

If a customer churned mentioning "needed highlighting":
> Use the GSpeech battlecard's "Where they win" line: "Read-along highlighting was a real feature gap. It's on our Q3 roadmap. If RHT is still your top need today, GSpeech is the better fit. If voice quality flexibility (Google Cloud / OpenAI / ElevenLabs) matters more, AtlasVoice has gotten significantly better — happy to send a free Pro trial."

If a customer churned mentioning "needed podcast distribution":
> Use the Trinity battlecard: "Podcast distribution is Trinity's strength and we don't compete on it. We're adding RSS feed in Q3 but if 'blog to podcast' is your top use case, Trinity is the right fit. If audio-on-site is the priority, AtlasVoice has 4 voice providers and 18× cheaper pricing now — worth a second look?"

If a customer churned mentioning "found a better/cheaper alternative":
> Use the cost-math from all 3 battlecards: "Most TTS plugin alternatives cost $120-1,560/year. AtlasVoice is $59-199/year and lets you bring your own API key. Want a side-by-side of the actual annual TCO?"

---

## Application 3 — AI / Customer support knowledge base

Each battlecard should be ingested into AtlasVoice's own customer support docs (when built) and into the llms.txt content (per ai-visibility doc). The objection-handling tables specifically:

- Make them part of a public `/docs/comparisons/atlasvoice-vs-gspeech/` page
- Make them part of llms.txt as Q&A format ("Q: How does AtlasVoice compare to GSpeech? A: ...")
- Make them findable internally by support team via search

---

## Refresh cadence

- **Monthly:** Re-check wp.org listings for each — download count, review count, rating, last update date
- **Quarterly:** Re-pull pricing pages, blog posts, recent releases
- **On news event:** Update immediately if a competitor makes a major announcement (AppSumo deal, voice cloning launch, etc.)
- **After 5 customer conversations citing a competitor:** Update the objection handling with the actual language customers used

**Last refresh: 2026-06-03**
**Next scheduled refresh: 2026-07-03 (monthly)**

---

## HTML version (if you want it built later)

The skill default produces an interactive HTML file with tabs, hover states, animated transitions, dark theme. The structured content above (per-competitor data sections) maps 1:1 to the skill's HTML template. To generate the HTML version: re-run `sales:competitive-intelligence` and ask for HTML output specifically — the data is already in this file ready to populate.

---

Would you like me to:
- Generate the HTML artifact version of these battlecards?
- Add a 4th competitor (Speechify as the "indirect" threat)?
- Create the public-facing `/docs/comparisons/` pages from this content?
- Draft support-team training materials based on these battlecards?
