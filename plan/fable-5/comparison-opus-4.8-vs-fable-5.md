# Opus 4.8 vs Fable 5 — Session Deliverables Comparison

> **Date:** July 11, 2026 · Same session, same original prompts, same repo access.
> Opus 4.8 output: `plan/opus-4.8/` · Fable 5 output: `plan/fable-5/`.
> Fable 5's strategy doc used **fresh, independently-retrieved web research**; the other Fable docs
> reused the session's grounded inputs (greps, boundary explorations) since those are code facts.
> Honesty caveat: Fable wrote second, in the same conversation — not a blind test. Divergences below
> are genuine disagreements, not manufactured contrast.

---

## 1. Verdict at a glance

| Deliverable | Facts | Analysis | Recommendation |
|---|---|---|---|
| Roles automation plan | same | **differs** — cadence vs classification | same buckets |
| Gap roles | same | — | **differs** — priority #1 |
| 4 free↔Pro contracts | identical (code facts) | **differs** — organization | same rules |
| AI/ML roadmap | same | **differs — biggest split** | **differs** — sequencing |
| Core connection + revenue | same | mostly same | differs on provider layer |
| Industry strategy | **Fable found more** | converges | converges (sharper urgency) |

**Overall:** on *facts*, the models agree everywhere. The real differences are **three judgment calls**
(§3) and **research retrieval breadth** (§4).

---

## 2. Where they fully converge (signal, not filler)

- **The industry verdict** — both, independently: WordPress is losing the trivial-site inflow, not its
  base; the old generic-plugin model is dying; **adapt in place; become an applied-AI product engineer,
  NOT a data scientist**; same four product roles (Connector flagship, AtlasVoice revenue engine, SLAI
  differentiator, AtlasAR vertical bet). Two models + two research passes → one strategy. High confidence.
- **The contract facts** — same option keys, same filters, same flagged issues (AtlasAR's stray `tts_`
  prefix; Connector's license stub; SLAI's build-output dependency). Code is code.
- **The role buckets** — same 14 roles, same automate/delegate/template/human-only assignments.

---

## 3. The three genuine judgment splits

### 3.1 Roadmap sequencing — the most consequential
- **Opus:** build the **shared AtlasAI Core first** (unified provider + embeddings), then everything
  compounds on it. "The single highest-leverage item."
- **Fable:** **ship one cross-product feature first** ("Ask & Listen": SLAI retrieves → LLM composes →
  AtlasVoice speaks), then *extract* the core from working code — and **don't build a provider layer at
  all** because WP 7.0 core already ships one (with 7.1 improving it in August).
- **Nature of the split:** platform-first vs product-first for a solo founder. Opus optimizes leverage;
  Fable optimizes risk + time-to-revenue-signal and leans harder on core's plumbing.

### 3.2 Gap-role priority
- **Opus:** **AI/ML Engineer #1** (the tagline demands it), Sales #2.
- **Fable:** **Sales/Conversion #1** (fastest cash from four already-shipped products funds everything),
  AI/ML #2 run in parallel.
- **Nature of the split:** vision-led vs cash-flow-led ordering of the same two items.

### 3.3 Posture toward WordPress 7.0/7.1 core AI
- **Opus:** validation — "ride core's infrastructure."
- **Fable:** validation **plus a deadline** — core AI improves *quarterly* (7.1 beta July 15, release
  Aug 19), so the Connector's current connect-and-expose value proposition has a commoditization clock;
  align with core by 7.1, and fix the non-enforcing license stub before investing further.

Minor stylistic split: Fable's roles plan adds an *operating rhythm* (batch reviews, protected
mornings) arguing interruption—not workload—is the real 14-role problem; Fable's contracts lead with
risk-ranking derived from actual bug history rather than category listings.

---

## 4. Research comparison (the user's hypothesis: would fresh retrieval differ?)

**Answer: the core numbers matched; the fresh pass found real additional findings.**

| Finding | Opus round | Fable round |
|---|---|---|
| Market share July 2026 | 41.9%, accelerating | same — **numbers agree across both passes** |
| Elementor | −30% / ~100 staff, AI-driven | same + **Wix cut 20% a month earlier** (industry-wide reset) |
| Zero-click | 60%+ zero-click | 🆕 **80%+** by 2026 counts; publisher Google traffic **−⅓ in 2025**; 🆕 **74% informational vs 31% transactional** split → informational = citation play, product pages still convert |
| Core AI | WP 7.0 shipped Abilities/AI Client/MCP | 🆕 **7.1 dated: beta Jul 15, release Aug 19**, AI a named focus — quarterly cadence confirmed |
| Plugin market | AI plugins fastest-growing category | 🆕 **~700 submissions/week (~5× 2024), AI-generated "ghost plugin" flood, declining commercial plugin sales** → directory discovery dying; trust/track-record is the new moat |
| Ecosystem consensus | — | 🆕 explicit **niching consensus**: generic stagnates, sharply-positioned wins |
| Perspective | WP ~42% of web | 🆕 still **~9× nearest competitor** (Shopify 5.2%) |

**Strategic deltas produced by the fresh findings:**
1. **Trust as moat** — the AI-slop plugin flood makes a 12-year track record + maintained reviews a
   *selling asset*, not just hygiene. (New to the strategy; wasn't in the Opus version.)
2. **Transactional survives zero-click** — AtlasVoice/AtlasAR buyers arrive via product-intent searches
   (~31% zero-click), so their funnels are far healthier than the scary headline numbers imply.
3. **Urgency is quarterly** — 7.1 in ~5 weeks makes "align the Connector with core" a dated deadline,
   not a direction.

---

## 5. Bottom line for the founder

- **Where both models agree, act with confidence** — the strategy (adapt in place, applied-AI engineer,
  four product roles) is now double-confirmed on independent research passes.
- **The one decision only you can make** is §3.1: platform-first (Opus) vs feature-first-extract-core
  (Fable). Everything else downstream is compatible with either.
- **The fresh research argues for speed**: whichever sequencing you pick, the first visible move should
  land before/around WP 7.1 (Aug 19, 2026).
