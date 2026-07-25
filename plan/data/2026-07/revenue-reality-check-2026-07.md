# Revenue Reality Check — July 2026 (deep research on real business data)

> Synthesis of the July 11, 2026 data pull ([data-pull-2026-07-11.md](data-pull-2026-07-11.md)).
> Purpose: test the strategy's assumptions (see `plan/opus-4.8/strategy/` + `plan/fable-5/strategy/`)
> against actual Freemius/GSC/GA4/Mailchimp numbers, and rank what to do next by measured impact.

## 1. The one-sentence truth

**AtlasAiDev is a one-product company: AtlasVoice Pro is 99.3% of lifetime revenue ($58.5K of $58.9K)
and ~$917 of $951 MRR — and that product's revenue has stopped growing (TTM −3%) while its
search-traffic funnel has been cut roughly in half since late 2025.**

## 2. Strategy assumptions — confirmed or corrected

| Assumption (from strategy docs) | Verdict | Evidence |
|---|---|---|
| "AtlasVoice = revenue engine" | ✅ **Understated** — it's not the engine, it's the whole vehicle | 99.3% of lifetime gross; 177 of 183 subs |
| "Connector = strategic flagship" | ⚠️ Strategic yes, commercial **not yet** — 1 subscriber, $10.75 MRR | Freemius product dashboard |
| "Smart Local AI = differentiator" | ⚠️ Zero commercial validation — $0 ever, Freemius setup unfinished (8/9) | Product dashboard |
| "Zero-click is hitting the funnel" | ✅ Confirmed on your own site | atlasaidev clicks −60–75% from Aug-2025 peak; informational queries = 7.8K impressions → 17 clicks |
| "Transactional/branded search survives" | ✅ Strongly confirmed | `atlasvoice` 31% CTR pos 3.1; pricing page = #1 GA page |
| "Sales/Conversion is the biggest gap role" (Fable) vs "AI/ML first" (Opus) | ✅ **Data sides with Sales/Conversion first** | See §3 — funnel leaks are measured and fixable; meanwhile 3 of 4 products earn ~nothing |

## 3. The measured funnel (AtlasVoice, monthly approximations)

```
Google impressions ~150K/mo → ~150 site clicks/mo (0.7% CTR)          ← collapsed layer
GA: ~750 users/mo → ~200 pricing-page views/mo                        ← surprisingly strong intent
Freemius: ~7–10 new 1st payments/mo ($9.8K TTM 1st payments ÷ $108)   ← conversion layer
MRR $917 · renewals $5.1K/yr · one-time $9.4K/yr (−9.8% — shrinking)
```

Leak analysis:
1. **Top of funnel halved** (search clicks), yet **pricing-page traffic is the #1 page** — the visitors
   who still arrive are high-intent. The funnel problem is *volume*, not intent quality.
2. **One-time (lifetime) purchases are the shrinking segment** (−9.8%); subscriptions are stable/growing
   slightly (renewals +4%). Recurring is holding the business up.
3. **Email is an underused asset**: 3.2K engaged list, 19–20% opens — but ~0.2–0.8% clicks, and no
   store connection means you can't even see what email earns. (Note: the list is telemetry-sourced —
   emails collected with consent at install via the AtlasAiDev tracker library → track.atlasaidev.com
   + Mailchimp — so audience hygiene rules differ from a normal newsletter list; churned/uninstalled
   users are off-limits.)

## 4. What the data says to do (ranked by measured impact ÷ effort)

1. ~~Ship the Pro Win-Back automation~~ **WITHDRAWN (founder correction, Jul 11):** the "Churned
   Users" audience = people who **unsubscribed or uninstalled** — they must NOT be emailed (consent +
   deliverability). The draft staying unlaunched is correct. Compliant alternative: win-back belongs
   **in-plugin** (deactivation-feedback flow, renewal-save offers to *active* subscribers), not email.
2. **Connect Freemius→Mailchimp revenue attribution** ("Connect store"). You cannot optimize email you
   can't measure. *Effort: hours.*
3. **Double down on branded/product search + the pricing page.** `atlasvoice` converts at 31% CTR and
   pricing is your top page — strengthen the pricing page (social proof, comparison table, objection
   handling) and the demo→pricing path. This is conversion work on your strongest measured asset. *Days.*
4. **Stop writing informational SEO content for traffic.** 7,842 impressions → 17 clicks on "best text
   to speech" is the zero-click era measured on your own site. Write only what supports citations
   (structured data, docs) and product-intent pages. *Saves time rather than costs it.*
5. **Finish Smart Local AI's Freemius setup (8/9) and launch the AtlasAR Convert-to-Pro automation** —
   two products currently have no functioning monetization pipeline at all. *Hours each.*
6. **Treat Connector revenue as a 2026 H2 bet, not a current business.** 1 subscriber says the strategic
   flagship needs the WP 7.0-alignment rebuild (and the license-stub fix) before marketing spend.
7. **Interesting new signal — AI agents are already visiting**: machine-generated queries (MDN compat
   strings, `claude mcp add`, PHP errors) are landing on your docs. Being *citable to AIs* is not
   hypothetical for you; it's already a traffic source. Structured data + docs quality directly feed it.

## 5. Corrections to the strategy docs

- The four-products platform strategy stands, but its *financial* framing must change: the AtlasAI Core
  / cross-product work is funded entirely by AtlasVoice. **Protecting AtlasVoice revenue is protecting
  the runway** — it outranks all new-product work in priority conflicts.
- "Bundle pricing" (roadmap P5) is premature: three of four products have ≤5 customers. Bundles need
  second-product traction first.
- The wp.org-review/marketing worklist should explicitly pivot: reviews & branded presence (which feed
  the 31%-CTR branded funnel) beat blog content (which feeds the dead informational funnel).

## 6. Watch list (re-pull monthly)

- MRR (floor: $950) · 1st payments/mo · pricing-page views · branded-query clicks · in-plugin
  deactivation-feedback/renewal-save results once built · Connector subscriber count after rebuild.
