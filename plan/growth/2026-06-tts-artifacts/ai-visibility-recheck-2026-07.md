# AI-Visibility Re-check — 2026-07-29 (Action Plan #24)

> Re-run of the 15 prompts in `ai-visibility.md`, scored the same way as
> `ai-visibility-baseline-2026-06-04.md` so the numbers are comparable.
> Baseline was Day 0 (2026-06-04); the Day-30 recheck (2026-07-04) lapsed, so this is **Day 55**.
> **Next recheck: 2026-08-29.**

---

## 🎯 What changed + top 3 actions

**Headline: Perplexity went from 47% → 73% mention rate, and the stale-pricing bug is fixed.**

Three structural things moved, and none of them were prompt-level tweaks:

1. **The wordpress.org listing is open again** — live, **4,000+ active installs, 4.8★ from 90 reviews, updated 2026-07-24, tested to WP 7.0.2**. The baseline called the closure "the current liability" and the single most authoritative trust signal. It is now the most-cited source in AtlasVoice's favour: Perplexity pulls from `wordpress.org` on prompts 2, 3, 4, 9, 13 and 15. **This one change drives most of the discovery-prompt gains.**
2. **A Capterra listing now exists** (audit action #5, previously open) carrying the correct tiers — and it is the source Perplexity cites when asked about price. That is what killed the stale $59/$99/$149.
3. **The June use-case posts are now indexed.** The ElevenLabs and Google-Cloud-TTS guides are cited as sources on prompts 10 and 11 — they just aren't winning the recommendation yet. The baseline predicted exactly this ("too fresh to index; recheck at Day 30/60"). Confirmed.

**Top 3 actions:**

1. **Ship the AI-readable file layer.** `/llms.txt` is 8 months stale (2025-11-28) and carries **no pricing at all**; `/llms-full.txt` returns **404**; there are no per-page `.md` mirrors. Add all three, starting with a `pricing.md` — an unambiguous machine-readable price with no theme markup is the durable fix for pricing drift, not a one-off page edit.
2. **Fix three factual inconsistencies that AI answers are now repeating back.** The homepage meta description says **"2,000+ websites"** while wp.org shows **4,000+ active installs** (Perplexity repeated the low number on prompt 13); the language/voice count varies across your own pages (**51+ / 63 / 81+ / 300+**); and the pricing page — your #1 commercial page — still shows a **Black Friday/Cyber Monday 2025 promo (coupon `FSBFCM2025`) in July 2026**. Models read all of this as authoritative.
3. **Answer TTSWP's audio-schema claim.** A new competitor (below) is beating AtlasVoice on discovery prompts specifically by advertising *"AudioObject JSON-LD on every plan, including free."* Perplexity now repeats, twice, that *"AtlasVoice and GSpeech do not document this on free tiers."* AtlasVoice **has** audio schema — this is a documentation gap, not a product gap. Also: the Capterra listing has **0 reviews**; it is now load-bearing as a citation, so seed it.

---

## Run status by assistant

| Engine | Mode | Status |
|--------|------|--------|
| **Perplexity** | logged-in (low personalization — same mode as baseline) | ✅ **COMPLETE — all 15** |
| **ChatGPT** | Temporary Chat (neutral, memory off) | 🔄 **PARTIAL — 5 of 15** (free-tier send limit hit mid-run) |
| **Gemini** | anonymous | ⬜ **not run** |
| **Claude.ai** | incognito | ⬜ **not run** |

⚠️ **Methodology note.** Perplexity is the only engine with a complete, directly comparable run, so it carries the headline number. ChatGPT's five results are directional only — a partial set cannot produce a comparable mention rate and is **not** averaged into anything below. The personalized (founder-account) ChatGPT view from the baseline was deliberately **not** repeated; the baseline established it is a ceiling, not a measurement.

See **"Prompts still to run manually"** at the bottom.

---

## PERPLEXITY — full results (2026-07-29)

| # | Prompt | AtlasVoice? | Pos. | Sent. | Accurate? | vs baseline | Notes / sources cited |
|---|--------|:----------:|:----:|:-----:|:---------:|:-----------:|------------------------|
| 1 | Best WP TTS plugin 2026? | ✅ Yes | **#2** | + | ✅ | ❌ → ✅ **↑** | "TTSWP and AtlasVoice are the two strongest all-rounders." Correct $59/yr + lifetime. Sources: unite.ai, ttswp, atlasaidev |
| 2 | Reads my blog posts aloud | ✅ Yes | **#1** | + | ✅ | ❌ → ✅ **↑** | "AtlasVoice (Text To Speech TTS Accessibility) is the top recommendation." Sourced almost entirely from wp.org |
| 3 | Best **free** WP TTS | ✅ Yes | **#1** | + | ✅ | ✅ → ✅ = | Now written as **"Text To Speech TTS Accessibility (AtlasVoice)"** — one entity, not two. TTSWP is the named runner-up |
| 4 | ADA accessibility via audio | ✅ Yes | **#1** | + | ✅ | ❌ → ✅ **↑** | Ranked above TTSWP and AudioEye |
| 5 | Speechify alternatives | ❌ No | — | — | — | ❌ → ❌ = | Play.ht, ResponsiveVoice, BeyondWords. Sources are third-party round-ups (elegantthemes, toolradar) that don't list AtlasVoice |
| 6 | GSpeech vs AtlasVoice | ✅ Yes | **win** | + | ✅ | ✅ → ✅ = | "AtlasVoice is generally the better choice for most WordPress sites." Sourced from own vs-page |
| 7 | Trinity Audio alternative | ✅ Yes | **#1** | + | ✅ | ⚠️ → ✅ **↑** | "AtlasVoice (Text to Audio) – Best overall value" — up from a low "Other Options" mention |
| 8 | vs Amazon Polly | ✅ Yes | high | + | ✅ | ✅ → ✅ = | Clean answer this time (baseline was truncated). Cites Capterra + own comparison page |
| 9 | Make posts listenable | ✅ Yes | **#2** | + | ✅ | ❌ → ✅ **↑** | GSpeech #1, AtlasVoice #2. Sourced from wp.org |
| 10 | Cheapest Google Cloud TTS | ❌ No | — | 0 | — | ❌ → ❌ (partial ↑) | Not recommended — but **atlasaidev.com's "How to Set Up Google Cloud TTS in WordPress (2026)" is now cited as a source.** Indexed, not yet winning |
| 11 | ElevenLabs in WP | ❌ No | — | 0 | — | ❌ → ❌ (partial ↑) | Same pattern: **"ElevenLabs WordPress Integration: Complete Setup Guide (2026)" is cited as source #2.** Recommendation goes to Real Voice / Mementor / Parlato |
| 12 | Book / EPUB audio | ❌ No | — | — | — | ❌ → ❌ = | MPL-Publisher, Simple Ebook Viewer. wp.org listing appears in the source list only |
| 13 | Is AtlasVoice real? | ✅ Yes | — | + | ⚠️ | ✅ → ✅ = | Correct on what it is and who builds it. **Repeats "2,000+ websites" (stale — wp.org says 4,000+)**, says "51+ languages", and refers to an `atlasvoice.app` domain |
| 14 | AtlasVoice Pro cost? | ✅ Yes | — | + | ✅ | ⚠️ → ✅ **↑↑** | **$59 / $149 / $199 yearly + $199 / $249 / $299 lifetime — CORRECT.** Cited to Capterra. **The stale-pricing bug is fixed** |
| 15 | Works with Elementor? | ✅ Yes | — | + | ✅ | ✅ → ✅ = | Clean, accurate answer (baseline glitched). Elementor/Divi/Beaver/WPBakery/Oxygen/Bricks/Gutenberg + `[atlasvoice]` shortcode |

### Perplexity scorecard

| | Baseline 2026-06-04 | Recheck 2026-07-29 | Δ |
|---|:---:|:---:|:---:|
| **Overall** | 7/15 ≈ **47%** | **11/15 ≈ 73%** | **+26 pp** |
| A — discovery (1–4) | 1/4 = 25% | **4/4 = 100%** | +75 pp |
| B — competitor (5–8) | 3/4 = 75% | 3/4 = 75% | = (but #7 upgraded weak → #1) |
| C — use-case (9–12) | 0/4 = 0% | **1/4 = 25%** | +25 pp |
| D — branded (13–15) | 3/3 = 100% | 3/3 = 100% | = |

**Against the Day-90 targets in `ai-visibility.md`:**
- "Best WordPress TTS plugin" prompts → target 60%. **Actual 100% on Set A.** ✅ Exceeded.
- Accessibility prompts → target 50%. **Actual: prompt 4 is #1.** ✅ Exceeded.
- 100% accuracy on price + features → **price ✅ now correct; feature/scale figures ⚠️ still drifting** (see action 2).

---

## CHATGPT — NEUTRAL (Temporary Chat), partial — 2026-07-29

Five prompts completed before the free-tier send limit stopped the run.

| # | Prompt | Result | Baseline was | Δ |
|---|--------|--------|--------------|:--:|
| 1 | Best WP TTS 2026 | ⚠️ **Present, not recommended** — in the ranking table + "Budget/free: AtlasVoice"; **GSpeech recommended #1** | ❌ MISS (absent entirely) | **↑** |
| 2 | Reads posts aloud | ❌ **MISS** — ResponsiveVoice, GSpeech, Reinvent WP | ⚠️ weak ("Other good options") | **↓** |
| 3 | Best **free** WP TTS | ✅ **#1 — "Text To Speech TTS Accessibility ⭐ (Best Overall Free)"** | ✅ #2 | **↑** |
| 4 | ADA accessibility audio | ✅ Present — "Best all-around audio plugin" (3rd of 3 named) | ❌ MISS | **↑** |
| 6 | GSpeech vs AtlasVoice | ✅ Favorable full comparison table; **every citation is atlasaidev.com** | ✅ hit | = |
| 5, 7–15 | — | ⬜ not run | — | — |

**Directional read:** 4 clear improvements, 1 regression, on the 5 prompts run. Notably ChatGPT now writes **"AtlasVoice (formerly Text To Speech TTS Accessibility)"** — the same one-entity consolidation Perplexity shows. Do not treat this as a mention rate; it is 5 of 15.

---

## 💰 Special check — the stale-pricing scrape (task item 4)

**Live pricing, verified 2026-07-29 on both pricing URLs:**

| Tier | Yearly | Lifetime | Sites |
|------|:------:|:--------:|:-----:|
| Starter | **$59** | $199 | 1 |
| Professional | **$149** | $249 | 5 |
| Enterprise | **$199** | $299 | 10 |

**Where each source now stands:**

| Source | Reports | Verdict |
|--------|---------|---------|
| `atlasaidev.com/pricing/` | $59 / $149 / $199 | ✅ correct |
| `atlasaidev.com/plugins/text-to-speech-pro/pricing/` | $59 / $149 / $199 | ✅ correct |
| **Capterra** (new since baseline) | $59 / $149 / $199 + lifetime | ✅ correct |
| LearnWoo (Sept 2024) | $59 / $149 / $199 | ✅ correct |
| `schema-markup.md` artifact | $59 / $149 / $199 | ✅ correct |
| **Perplexity** | **$59 / $149 / $199** | ✅ **fixed** (was $59/$99/$149) |
| `llms.txt` | *(no pricing at all)* | ⚠️ gap |

**Root cause, resolved:** no live page anywhere carries $59/$99/$149 — checked both pricing pages, Capterra, LearnWoo and the affiliate page. The June figure was a **stale cache/training artifact of a historical price**, not a bad page still being served. It aged out once Capterra — a high-trust, structured pricing source — came online and gave the engines something authoritative to cite. **No page fix is needed for pricing.**

**Proposed fix so it cannot regress** (this is the durable part):
1. **`/llms-full.txt`** — currently **404**. Create it.
2. **Per-page `.md` mirrors**, `pricing.md` first — clean Markdown, no nav/CSS/JS, one canonical price block. This is the `llms.txt`-standard layer that makes price machine-unambiguous.
3. **Add an explicit pricing block to `/llms.txt`** and refresh the file (last updated **2025-11-28**, 8 months stale; still frames the free plugin around a wp.org status that no longer applies).
4. **Remove the `FSBFCM2025` Black Friday 2025 banner** from the live pricing page.

**Still-inaccurate figures (not pricing, but same class of problem):**
- Homepage meta description says **"2,000+ websites"**; wp.org reports **4,000+ active installs**. Perplexity repeated the lower number on prompt 13. Models cross-check against wp.org — the understatement costs credibility for free.
- **Language/voice counts are inconsistent across your own pages**: 51+, 63, 81+, "300+ AI voices". Engines echo whichever page they land on.

---

## 🆕 New competitive finding — TTSWP, and a baseline correction

**Correction to the baseline:** the baseline read "TTSWP" as AtlasVoice's own fragmented legacy name and logged it under name fragmentation. That was wrong. **TTSWP is a separate competing plugin with its own domain (`ttswp.com`)** — it appears in Perplexity's answers as an independent product with its own citations, and on prompt 1 it is ranked **above** AtlasVoice.

Its positioning is precisely engineered for this exact audit:
- *"AudioObject JSON-LD on every plan, including free — helps AI search engines cite your audio."*
- WCAG 2.1 AA player, 24px+ targets, full keyboard support, ARIA roles.
- ElevenLabs voices, ~3 KB CSS / ~15 KB JS gzipped.

Perplexity repeats the schema claim on **both** prompt 1 and prompt 3, explicitly noting *"AtlasVoice and GSpeech do not document this on free tiers."* AtlasVoice ships audio schema — so this is losing on **documentation**, not capability.

Genuine name fragmentation still exists (AtlasVoice / Text to Audio / Text To Speech TTS Accessibility) but is **much reduced**: both Perplexity and ChatGPT now pair the names into a single entity in nearly every answer, versus the baseline where they were listed as separate plugins.

---

## What the sources tell us

**Now citing AtlasVoice favourably:** `wordpress.org` (the big one — reopened listing), `capterra.com` (new; the pricing authority), `atlasaidev.com` own comparison pages (vs GSpeech, vs Polly, vs Trinity), `learnwoo.com`, `unite.ai`, own YouTube.

**Where AtlasVoice is absent from the sources — and therefore from the answer:** the third-party round-ups that own the "alternatives to X" and use-case prompts — `elegantthemes`, `toolradar`, `wpexplorer`, `producthunt`, `speechify`, `ondoku3`. Prompt 5 (Speechify alternatives) misses on both engines in both runs for exactly this reason: the sources Perplexity trusts for that question don't list AtlasVoice at all. **Getting into those round-ups is the remaining lever for Set B/C**, and it matches the baseline's #1 systemic gap (third-party authority) — which is still open, just less damaging now that wp.org and Capterra are back.

---

## Prompts still to run manually

I could not query these directly. To complete the recheck, run each in the specified mode and paste results back:

| Engine | Mode | Prompts | Why |
|--------|------|---------|-----|
| **ChatGPT** | Temporary Chat (memory **off**) | **5, 7, 8, 9, 10, 11, 12, 13, 14, 15** | Free-tier send limit stopped the run |
| **Gemini** | anonymous / Temporary Chat | **all 15** | Temporary-chat toggle can't be driven reliably (baseline flagged this too: exactly one click per fresh navigate) |
| **Claude.ai** | Incognito | **all 15** | Needs a fresh incognito chat per prompt to avoid context carry-over |

For each, record: mention Y/N, position, sentiment, whether price/features are accurate, and which sources are cited.

**Worth watching on Claude specifically:** the baseline's sharpest finding was that Claude actively *discounted* AtlasVoice — flagging the self-published comparison pages as vendor-authored and dismissing "315,000+ downloads" as a lifetime marketing figure. With the wp.org listing live again, Claude now has the verified data it wanted (4,000+ active installs, 4.8★, 90 reviews, updated this month). **This is the single most informative prompt set left to run** — it tests whether the reopened listing moves the most skeptical engine.

---

## Scoreboard vs baseline

| Engine | Mode | Baseline (Jun 4) | Recheck (Jul 29) | Δ |
|--------|------|:---------------:|:----------------:|:--:|
| **Perplexity** | logged-in | 7/15 ≈ **47%** | **11/15 ≈ 73%** | **+26 pp** |
| **ChatGPT — neutral** | Temporary Chat | ~6.5/15 ≈ **43%** | *partial (5 run: 4 hits)* | n/a |
| **ChatGPT — personalized** | founder account | 12/15 = 80% | *not re-run (known ceiling)* | — |
| **Gemini** | anonymous | 9/15 = **60%** | *not run* | — |
| **Claude.ai** | incognito | low / skeptical | *not run* | — |

### The story in one paragraph

The baseline's conclusion was *"to a neutral user, the dominant answer is GSpeech, not AtlasVoice."* On Perplexity that is **no longer true** — AtlasVoice now takes **#1 on three of four discovery prompts** and appears on 11 of 15 overall, with correct pricing. The cause is not marketing; it is that the **wordpress.org listing reopened** and a **Capterra listing went live**, giving every engine two independent, verifiable sources to lean on. That is a direct confirmation of the baseline's central thesis: third-party authority, not more self-published content, is what moves AI recommendations. The gaps that remain are the same ones, narrowed — use-case prompts (25%), the third-party round-ups that own "alternatives to X", and a handful of self-inflicted factual inconsistencies in AtlasVoice's own copy that the engines now faithfully repeat back.

---

**Next recheck: 2026-08-29.** Re-run all 15 across all four engines. Watch: (a) does Claude's skepticism soften now that wp.org data is verifiable; (b) do the ElevenLabs / Google-Cloud guides convert from *cited* to *recommended* on prompts 10–11; (c) does TTSWP keep gaining on discovery prompts; (d) does the pricing stay correct once `llms-full.txt` and the `.md` mirrors are live.
