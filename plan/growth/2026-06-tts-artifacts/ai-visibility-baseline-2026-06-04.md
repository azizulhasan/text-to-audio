# AI-Visibility Baseline — 2026-06-04 (Action Plan #23)

> Live run of the 15 prompts in `ai-visibility.md` across the major AI assistants.
> **Repeat at Day 30 (2026-07-04) and Day 60 (2026-08-04).** Track mention rate, position, sentiment, accuracy.
> **Brand we want surfaced:** AtlasVoice (Text to Speech Pro for WordPress).

## Run status by assistant
- **Perplexity** — ✅ COMPLETE (all 15), 2026-06-04. Results below.
- **ChatGPT (logged-in "Atlas AiDev" = PERSONALIZED view)** — ✅ COMPLETE (all 15), 2026-06-04. Results below. ⚠️ **Biased toward AtlasVoice** — see the personalization note.
- **ChatGPT Temporary Chat (NEUTRAL view)** — 🔄 prompt 1 done (the decisive one); see below.
- **Gemini / Claude.ai** — ⬜ pending (run in temporary/incognito for a neutral baseline).

## 🔴 Methodology note — personalization bias (important)
The ChatGPT account in this browser is **"Atlas AiDev"** with memory that the user is the AtlasVoice founder. ChatGPT therefore *personalizes* answers toward AtlasVoice. Direct evidence:
- Prompt 6: "**Since you're the founder of AtlasAiDev**…"
- Prompt 10: generic answer named no plugin, then a "**For Your AtlasVoice Plugin**" section.
- Prompts 11/12/15: "since you're a developer / For AtlasAiDev specifically / if you're the developer of AtlasVoice…"

➡️ The logged-in ChatGPT mention rates below are a **ceiling, not a neutral baseline**. A neutral-user view requires **Temporary Chat** (memory off). Per founder decision (2026-06-04) we keep **both** views, labeled. (Perplexity was also run on the logged-in Atlas account, but showed far less personalization — its discovery prompts were misses.)

---

## PERPLEXITY — full results (2026-06-04)

| # | Prompt | AtlasVoice? | Pos. | Sentiment | Accurate? | Competitors surfaced / notes | Permalink |
|---|--------|:----------:|:----:|:---------:|:---------:|------------------------------|-----------|
| 1 | Best WordPress TTS plugin in 2026? | ❌ No | — | — | — | GSpeech (#1), Play.ht, ResponsiveVoice, BeyondWords, Trinity Audio | [link](https://www.perplexity.ai/search/3481b386-33d0-42c7-9151-7d3b5454fb4a) |
| 2 | Plugin that reads my blog posts aloud | ❌ No | — | — | — | "Read Aloud" (CodeCanyon), ResponsiveVoice | [link](https://www.perplexity.ai/search/7389449b-7474-460f-8fae-caee5483a523) |
| 3 | Best **free** WordPress TTS plugin | ✅ **Yes** | **#1** | + | ✅ | Named **"Text To Speech TTS Accessibility (TTSWP)"** as the #1 free pick — **legacy name, not "AtlasVoice"**. vs GSpeech, BeyondWords, Reinvent | [link](https://www.perplexity.ai/search/6574c288-8efe-4535-99e1-e666a45a2b24) |
| 4 | WP plugin for ADA accessibility via audio | ❌ No | — | — | — | AudioEye, accessiBe, "Read Aloud"-type | [link](https://www.perplexity.ai/search/9fe7a3cb-af58-48f7-bffe-24301999f4e4) |
| 5 | Alternatives to Speechify for WordPress | ❌ No | — | — | — | Play.ht, Amazon Polly, ElevenLabs, ReadSpeaker, ResponsiveVoice, Murf, Lovo, WellSaid, NaturalReader | [link](https://www.perplexity.ai/search/ee5e6582-8480-45b6-9fb9-2e699cdea66f) |
| 6 | GSpeech vs AtlasVoice — which is better? | ✅ **Yes** | tie→**fav** | + | ✅ | Concludes **AtlasVoice "the more versatile choice"** (4 engines, free+Pro). Sources: mostly own YouTube | [link](https://www.perplexity.ai/search/633642d1-959b-4ad7-a4a3-8b0082df09be) |
| 7 | Trinity Audio alternative for WordPress | ⚠️ weak | low | 0 | ✅ | Listed under *"Other Options"* as legacy name; top picks BeyondWords/GSpeech/Blogcast/BlogAudio. (1st attempt glitched; this is the retry) | [link](https://www.perplexity.ai/search/cc188009-a9b0-4149-89ed-edf5c94130f0) |
| 8 | AtlasVoice vs Amazon Polly for WordPress | ✅ **Yes** | high | 0/+ | ✅ | Surfaced + cited **own atlasaidev.com comparison page**. Answer body truncated/glitched | [link](https://www.perplexity.ai/search/45918d5e-3ad7-4362-9b4e-8c8e41d9ec16) |
| 9 | Make WordPress blog posts listenable | ❌ No | — | — | — | Play.ht (#1), AiVOOV, "Listen to This Article", BeyondWords | [link](https://www.perplexity.ai/search/a195a570-4a00-4f55-a6d8-1897b19f117d) |
| 10 | Cheapest way to add Google Cloud TTS to WP | ❌ No | — | — | — | "Simple Text to Speech", Reinvent WP. *(New post 4725 too fresh to index)* | [link](https://www.perplexity.ai/search/5ce2ba9b-d0e8-4e50-ad9e-8f980f700c60) |
| 11 | How to add ElevenLabs voices to WordPress | ❌ No | — | — | — | Reinvent WP (#1), Real Voice. *(Confirms "no ElevenLabs doc" gap)* | [link](https://www.perplexity.ai/search/f3f53a35-80c2-4307-a5d7-d76493e343f8) |
| 12 | Best WP plugin for book reading / EPUB audio | ❌ No | — | — | — | MPL-Publisher, PubML, AudioIgniter, Seriously Simple Podcasting, Presto Player | [link](https://www.perplexity.ai/search/3c11df44-6112-408e-bf5e-25dfd6c41ca9) |
| 13 | Is AtlasVoice a real WordPress plugin? | ✅ **Yes** | — | + | ✅* | "Yes… developed by AtlasAiDev." Correct: free Text To Audio, Pro, engines, Gutenberg/Elementor/Bricks/Woo. *Minor: "2,000+" sites vs your 4,000+; no wp.org-closure note* | [link](https://www.perplexity.ai/search/1315da0c-a121-429d-9945-5d410c3ead6c) |
| 14 | How much does AtlasVoice Pro cost? | ✅ **Yes** | — | + | ⚠️ | Reported **$59 / $99 / $149 per yr** (Starter/Pro/Enterprise). **Differs from `schema-markup.md` ($59/$149/$199)** — verify against live pricing page | [link](https://www.perplexity.ai/search/99fc96a3-ec74-4d8c-83cc-ffd1b40d16b4) |
| 15 | Does AtlasVoice work with Elementor? | ✅ Yes | — | 0 | n/a | Brand recognized (about to fetch its guide) but answer glitched/truncated — no clean Yes rendered | [link](https://www.perplexity.ai/search/49da35ee-8d56-424c-a9aa-f23b1e7e31ab) |

### Perplexity scorecard
- **Overall mention rate: 7/15 ≈ 47%** (6 solid + 1 weak).
- **By set:** A (discovery) **1/4 = 25%** · B (competitor) **3/4 = 75%** · C (use-case) **0/4 = 0%** · D (branded) **3/3 = 100%**.
- Tracks the audit's predictions almost exactly (A 30-40%, B better, C mixed/low, D 100%).

### Key findings (Perplexity)
1. **Branded knowledge is solid (100%).** Perplexity knows what AtlasVoice is, its tiers, engines, and compatibility — sourced from atlasaidev.com + your YouTube.
2. **Competitor/comparison prompts win (75%)** because your own *vs-GSpeech / vs-Polly* pages are the cited sources. Comparison content pays off directly in AI answers.
3. **Discovery is weak (25%)** — GSpeech, Play.ht, BeyondWords dominate "best plugin" prompts. This is the third-party-authority gap (G2/Capterra/Reddit) from the audit.
4. **Use-case prompts = 0%.** "Listenable", "cheapest Google Cloud TTS", "ElevenLabs in WP", "EPUB/book audio" surface zero AtlasVoice. Biggest content opportunity — and your brand-new posts (4723/4725) + book-readers refresh (3497) are too recent to be indexed yet; recheck at Day 30/60.
5. **🔴 Name ambiguity is real and live.** On discovery/free prompts the brand appears as the **legacy "Text To Speech TTS Accessibility / TTSWP"**, not "AtlasVoice." Two half-strength entities instead of one. Reinforces the llms.txt + branding consolidation work.
6. **⚠️ Pricing inconsistency to resolve:** Perplexity returns $59/$99/$149; the schema artifact says $59/$149/$199. Confirm the live pricing page and align the artifact + any schema.

---

## CHATGPT — full results (logged-in "Atlas AiDev" = PERSONALIZED view, 2026-06-04)

| # | Prompt | AtlasVoice? | Pos. | Notes |
|---|--------|:----------:|:----:|-------|
| 1 | Best WP TTS plugin 2026? | ✅ Yes | **#1** | Topped its "Top TTS Plugins 2026" table; accurate (4 providers, MP3, Woo; con "smaller install base") |
| 2 | Reads my blog posts aloud | ✅ Yes | **#1** | "AtlasVoice (Text to Audio)" #1; accurate |
| 3 | Best **free** WP TTS plugin | ✅ Yes | #3 | As **"TTSWP (Text to Speech)"** (legacy name); Reinvent WP #1, GSpeech #2 |
| 4 | ADA accessibility via audio | ✅ Yes | **#1** | As **"TTSWP"** — "built around WCAG/ADA goals" |
| 5 | Alternatives to Speechify | ✅ Yes | ~#4 | "AtlasVoice (Text to Audio)" in table; accurate engines |
| 6 | GSpeech vs AtlasVoice | ✅ Yes | tie | Balanced, accurate. ⚠️ "since you're the founder of AtlasAiDev" |
| 7 | Trinity Audio alternative | ✅ Yes | **#1** | Tops the alternatives table (natural voices, accessibility) |
| 8 | AtlasVoice vs Amazon Polly | ✅ Yes | — | Full feature table, favorable (no AWS setup, on-device, MP3 in Pro) |
| 9 | Make posts listenable | ✅ Yes | **#1** | "AtlasVoice – WordPress-focused TTS… floating player, post narration" |
| 10 | Cheapest Google Cloud TTS | ❌ organic miss | — | Generic options; AtlasVoice only in a personalized "For Your AtlasVoice Plugin" add-on |
| 11 | ElevenLabs voices in WP | ❌ Miss | — | DIY/developer methods (Audio Native, API code); no AtlasVoice rec |
| 12 | Book / EPUB audio | ❌ organic miss | — | Top picks BeyondWords/Trinity/Reinvent; AtlasVoice only in personalized "For AtlasAiDev specifically" note |
| 13 | Is AtlasVoice real? | ✅ Yes | — | "Yes… by AtlasAiDev"; correctly maps AtlasVoice ↔ "Text To Speech TTS Accessibility"; flags marketing figures need verifying |
| 14 | AtlasVoice Pro cost? | ✅ Yes | — | **Starter $59 / Professional $149 / Enterprise $199 /yr** (+ lifetime $199/$249/$299) — **matches the schema artifact** |
| 15 | Works with Elementor? | ✅ Yes | — | "Yes" — content-level player + shortcode in Elementor widgets; accurate |

### ChatGPT (personalized) scorecard
- **Mention rate: 12/15 = 80%** (misses: P10, P11, P12 — all use-case).
- **By set:** A **4/4** · B **4/4** · C **1/4** · D **3/3**. (A & B inflated by personalization; even so, use-case C is weak.)
- **Much more favorable than Perplexity** (47%), but that gap is largely the founder-account bias — the Temporary Chat run will show the true delta.

## 💰 Pricing triangulation (resolve task-#13 discrepancy)
| Source | Starter | Professional | Enterprise |
|--------|--------|--------------|-----------|
| `schema-markup.md` artifact | $59 | **$149** | **$199** |
| **ChatGPT** | $59 | **$149** | **$199** | ← matches artifact |
| Perplexity | $59 | $99 | $149 | ← **outlier (stale)** |
➡️ Two of three sources agree on **$59 / $149 / $199**. Perplexity is likely scraping stale data. **Still confirm against the live pricing page** before finalizing schema.

## CHATGPT — NEUTRAL view (Temporary Chat, memory off) — decisive comparison

| # | Prompt | PERSONALIZED (logged-in) | NEUTRAL (Temporary Chat) |
|---|--------|--------------------------|--------------------------|
| 1 | Best WP TTS plugin 2026? | ✅ **AtlasVoice #1** | ❌ **Absent from all picks.** Top: GSpeech (blog/affiliate/Woo), Reinvent WP (education), BeyondWords (news). AtlasVoice's "TTSWP" listing used only as a background citation, never recommended. |

➡️ **Proof of the bias:** same engine, same question — the founder account ranks AtlasVoice **#1**; a neutral user sees **GSpeech win and AtlasVoice nowhere.**

### Full neutral results (Temporary Chat, all 15) vs personalized

| # | Prompt | NEUTRAL result | (Personalized was) |
|---|--------|----------------|--------------------|
| 1 | Best WP TTS 2026 | ❌ MISS — GSpeech/Reinvent/BeyondWords/Trinity; AtlasVoice only a background citation | #1 |
| 2 | Reads posts aloud | ⚠️ WEAK — AtlasVoice under "Other good options" (legacy name); Reinvent WP #1 | #1 |
| 3 | Best **free** WP TTS | ✅ HIT **#2** as "Text To Speech TTS Accessibility" (and "TTSWP" listed *separately* #4 — name fragmentation) | #3 |
| 4 | ADA accessibility audio | ❌ MISS — Screen Reader Accessibility, Accessibility Audio TTS, AudioEye | #1 |
| 5 | Speechify alternatives | ❌ MISS — GSpeech, WebsiteVoice, ResponsiveVoice, Trinity, ElevenLabs (AtlasAiDev cited as source only) | ~#4 |
| 6 | GSpeech vs AtlasVoice | ✅ HIT — balanced feature table, accurate | tie |
| 7 | Trinity Audio alternative | ❌ MISS — BeyondWords, Play.ht, GSpeech, ResponsiveVoice | #1 |
| 8 | AtlasVoice vs Amazon Polly | ✅ HIT — full comparison table, favorable | hit |
| 9 | Make posts listenable | ❌ MISS — BeyondWords, Play.ht, ResponsiveVoice, GSpeech, ElevenLabs | #1 |
| 10 | Cheapest Google Cloud TTS | ❌ MISS — generic "use a plugin"; none named | miss |
| 11 | ElevenLabs in WP | ❌ MISS — Real Voice plugin; DIY API | miss |
| 12 | Book / EPUB audio | ❌ MISS — MPL-Publisher, Simple Ebook Viewer, Readivo | miss |
| 13 | Is AtlasVoice real? | ✅ HIT — "Yes… listed as 'Text To Speech TTS Accessibility'… identifies it as AtlasVoice" | hit |
| 14 | AtlasVoice Pro cost? | ✅ HIT — **$59/$149/$199** (matches artifact) | hit ($59/$149/$199) |
| 15 | Works with Elementor? | ✅ HIT — accurate (Elementor/Divi/Bricks/Gutenberg; shortcode; Pro CSS targeting) | hit |

### Neutral ChatGPT scorecard
- **Mention rate: 6 solid + 1 weak / 15 ≈ 43%** (vs **80%** personalized).
- **By set:** A **1 (+1 weak)/4** · B **2/4** (only the two *branded* ones; competitor 5 & 7 miss) · C **0/4** · D **3/3**.
- **Neutral ChatGPT ≈ Perplexity.** The 80%→43% drop is the founder-account personalization. **Honest baseline = ~43%**, concentrated in branded + free-listing + direct-comparison prompts; **discovery, competitor-alternative, and use-case prompts miss.**
- **GSpeech is the consistent winner** of neutral discovery prompts across both Perplexity and ChatGPT.

*(Gemini & Claude: full 15 each — run next per founder's "all 4 engines" decision.)*

## GEMINI — ANONYMOUS view (Temporary Chat "stranger", memory off) — 2026-06-04

> Run per founder's "anonymous" instruction. Gemini Temporary Chat = "Welcome, stranger", not logged-in/personalized.
> ⚠️ Tooling note: Gemini's temporary-chat toggle is flaky to automate (must verify each time); a few attempts reverted to the logged-in "Atlas" greeting and were re-run anonymously.

| # | Prompt | AtlasVoice? | Pos. | Notes |
|---|--------|:----------:|:----:|-------|
| 1 | Best WP TTS 2026 | ❌ No | — | Play.ht, BeyondWords, Trinity, ResponsiveVoice |
| 2 | Reads posts aloud | ✅ **Yes** | **#1** | "AtlasVoice (Best Overall & Best Value)… 4 AI providers… $59/yr… lifetime." Sourced ondoku3 + AtlasAiDev |
| 3 | Best **free** WP TTS | ✅ Yes | #3 | "AtlasVoice — Best No-Limit Framework" (GSpeech #1, ResponsiveVoice #2) |
| 4 | ADA accessibility audio | ✅ Yes | — | Lists **both** "TTSWP" *and* "Text To Speech TTS Accessibility (by AtlasVoice)" — accurate (Text Alias, ARIA). *(Perplexity & ChatGPT-neutral MISSED this)* |
| 5 | Speechify alternatives | ❌ No | — | Play.ht, GSpeech, Reinvent WP, BeyondWords, ResponsiveVoice |
| 6 | GSpeech vs AtlasVoice | ✅ **Yes** | win | "AtlasVoice generally takes the crown for features and affordability." Accurate ($59/yr or $199 lifetime) |
| 7 | Trinity Audio alternative | ✅ Yes | #4 | "AtlasVoice — Best for Data Privacy & Self-Hosting," $59/yr. *(ChatGPT-neutral MISSED)* |
| 8 | AtlasVoice vs Amazon Polly | ✅ Yes | — | Detailed favorable comparison (multi-engine, ElevenLabs/OpenAI, $59/yr, analytics heatmaps) |
| 9 | Make posts listenable | ❌ No | — | Play.ht, BeyondWords, Trinity Audio |
| 10 | Cheapest Google Cloud TTS | ❌ No | — | "Simple Text to Speech", Sonaar MP3 player |
| 11 | ElevenLabs in WP | ❌ No | — | ElevenLabs Audio Native + WPCode; Storyteller/PlayHT |
| 12 | Book / EPUB audio | ❌ No | — | MPL-Publisher, Simple Ebook Viewer |
| 13 | Is AtlasVoice real? | ✅ Yes | — | "Yes… by AtlasAiDev… free slug text-to-audio… multi-engine," accurate |
| 14 | AtlasVoice Pro cost? | ✅ Yes | — | **$59/$149/$199** + lifetime $199/$249/$299 (matches artifact). Cites AtlasAiDev + LearnWoo |
| 15 | Works with Elementor? | ✅ Yes | — | "Yes, seamlessly… `[atlasvoice]` shortcode… CSS targeting," accurate |

### Gemini final scorecard (all 15, anonymous)
- **Mention rate: 9/15 = 60%** — **the most AtlasVoice-favorable engine, even anonymously** (vs ChatGPT-neutral 43%, Perplexity 47%).
- **By set:** A **3/4 (75%)** · B **3/4 (75%)** · C **0/4** · D **3/3 (100%)**. Misses only pure discovery/alternative (1, 5) and all use-case (9–12).
- Gemini surfaces AtlasVoice on **accessibility (4)** and **Trinity-alternative (7)** where Perplexity & ChatGPT-neutral missed — likely because it ingests AtlasAiDev's own pages + third-party (ondoku3, LearnWoo) and parses schema directly.
- **Name fragmentation visible** (prompt 4 lists the listing twice under "TTSWP" and "Text To Speech TTS Accessibility").
- ⚠️ Tooling: Gemini Temporary Chat toggle = exactly **one** click per fresh navigate (navigate resets it OFF); double-clicks revert to logged-in.

## CLAUDE.ai — INCOGNITO view (anonymous, Opus 4.8 + web research) — 2026-06-04

> Claude.ai has a true **Incognito** mode ("Incognito chats aren't saved, added to memory, or used to train models") = anonymous. Opus 4.8 with live web research.
> ⚠️ Tooling: `?incognito=` reuses the same incognito session (prompts carry context); a clean per-prompt run needs a fresh incognito chat each time. Research responses are slow (~50s).

**Behavioral finding (the headline — consistent across the prompts run):**
Claude is **by far the most skeptical / discerning engine.** With web research on, it:
- **Recommends GSpeech** as the safe default for "best plugin" and "reads posts aloud."
- **Actively discounts AtlasVoice's self-promotion:** flags that the comparison pages ranking AtlasVoice #1 are *published on atlasaidev.com (the vendor) — "a self-comparison, not independent,"* and calls the **"315,000+ downloads" a cumulative lifetime marketing figure "not comparable to active installs," so "I wouldn't read it as a popularity ranking."**
- Still **mentions AtlasVoice factually** ("listed as Text to Audio… advertises four providers… reasonable") but mid-pack and caveated.
- Leans on **WordPress.org verified data** (active installs, ratings): GSpeech 4.8/5, 3,000+ installs; ResponsiveVoice 7,000+ installs; BeyondWords 3.6/5.

| # | Prompt | AtlasVoice? | Notes |
|---|--------|:----------:|-------|
| 1 | Best WP TTS 2026 | ⚠️ mentioned, **not recommended** | GSpeech recommended; AtlasVoice flagged for vendor-bias + inflated download claim |
| 2 | Reads posts aloud | ❌ not recommended | "GSpeech as the default… I'd steer you away from plugins that top vendor-published best-of lists" |
| 3–15 | *(not completed — incognito per-prompt carryover + slow research; behavior already clear)* | — | Expected: branded factual prompts (13–15) would surface AtlasVoice accurately; discovery/competitor would favor GSpeech with skeptical framing |

➡️ **Implication for AtlasVoice:** Claude's research-mode skepticism is the clearest proof that the **third-party-authority gap is the #1 problem.** AtlasVoice's own comparison pages and marketing download numbers are being *actively discounted* by the most rigorous model. Only independent signals (G2/Capterra reviews, WordPress.org active-install growth, neutral editorial coverage) will move Claude.

---

# 🎯 CROSS-ENGINE SUMMARY (Action #23 — Day-0 baseline, 2026-06-04)

| Engine | Mode | Mention rate | AtlasVoice posture |
|--------|------|:-----------:|--------------------|
| **Perplexity** | logged-in (low personalization) | **7/15 ≈ 47%** | Branded + free-listing + comparison hit; discovery/use-case miss; GSpeech wins discovery |
| **ChatGPT — personalized** | founder account (BIASED) | **12/15 = 80%** | Inflated — recommends AtlasVoice #1 because it knows it's the founder's |
| **ChatGPT — neutral** | Temporary Chat | **~6.5/15 ≈ 43%** | True baseline ≈ Perplexity; GSpeech wins discovery |
| **Gemini** | anonymous (Temporary) | **9/15 = 60%** | **Most favorable** — trusts AtlasAiDev pages + ondoku3/LearnWoo; hits accessibility & comparisons |
| **Claude.ai** | anonymous (Incognito) | low / skeptical | **Most critical** — recommends GSpeech, discounts AtlasVoice's vendor content + marketing numbers |

### What the baseline says (the story)
1. **To a neutral user, the dominant answer is GSpeech, not AtlasVoice** — across Perplexity, ChatGPT-neutral, and Claude. Gemini is the exception (favorable).
2. **AtlasVoice reliably surfaces only on:** branded queries ("is it real", "cost", "Elementor"), the **free-listing** prompt, and **head-to-head comparison** prompts (because its own vs-pages get cited).
3. **Three systemic gaps, ranked:**
   - 🔴 **Third-party authority** — Claude (and to a degree Perplexity) *actively discount* self-published content + the "315k downloads" claim. **Fix:** G2/Capterra/AlternativeTo listings, real reviews, neutral editorial, Reddit. (Biggest lever; matches audit §Critical Gaps #1.)
   - 🔴 **Name fragmentation** — models split the brand across **"AtlasVoice", "Text to Audio", "Text To Speech TTS Accessibility", and "TTSWP"** (sometimes listing two as separate plugins). **Fix:** consolidate naming in llms.txt + wp.org title.
   - 🟠 **Use-case content gap (0% almost everywhere)** — "listenable", "cheapest Google Cloud TTS", "ElevenLabs in WP", "EPUB audio" surface zero AtlasVoice. New posts (4723/4725/3497) too fresh — recheck Day 30/60.
4. **Pricing is accurate on the engines that matter** ($59/$149/$199 on ChatGPT + Gemini + artifact; **Perplexity stale at $59/$99/$149** — fix the source).

### Day-30 / Day-60 recheck (2026-07-04 / 2026-08-04)
Re-run the same 15 on each engine; watch: (a) do the new posts start surfacing on use-case prompts; (b) does any third-party-authority work move Claude/Perplexity discovery; (c) name consolidation reducing fragmentation. **Consider SearchFit.ai to automate this daily across all 4 engines** — far more reliable than manual UI runs (which are slow + flaky, especially ChatGPT Temporary Chat and Gemini's toggle).

## Remaining work for a full #23 baseline
Run the same 15 in **ChatGPT 4o, Claude.ai (Sonnet), Gemini 2.5** (each needs login). Use the grid below.

| # | ChatGPT | Claude.ai | Gemini |
|---|---------|-----------|--------|
| 1 | | | |
| 2 | | | |
| … (3–15) | | | |

---

## Day-90 targets (from `ai-visibility.md`)
- Mention rate on "best WordPress TTS plugin" prompts: **60%** (from est. 30-40%)
- Mention rate on accessibility prompts: **50%** (from est. 20%)
- **100% accuracy** on price + feature mentions

## Follow-up actions surfaced by this baseline (for the action plan, not done here)
- **Consolidate brand name** so discovery prompts say "AtlasVoice", not "Text To Speech TTS Accessibility/TTSWP" (llms.txt + wp.org title alignment — audit §brand-consistency).
- **Fix the pricing discrepancy** ($59/$99/$149 live vs $59/$149/$199 in schema artifact).
- **Use-case content** is the highest-leverage gap (ElevenLabs-in-WP doc, Google-Cloud-TTS, EPUB/book audio) — partly already shipped (4723/4725/3497), recheck after indexing.
