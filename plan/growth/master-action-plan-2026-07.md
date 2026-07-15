# MASTER ACTION PLAN — AtlasAiDev (July 2026)

> **THE single source of truth.** Merges and supersedes: the June growth plans
> (`2026-06-tts-action-plan.md` + `2026-06-fable5/…`), the data-driven plan
> (`plan/data/2026-07/action-plan-2026-07.md`), and the strategy work (`plan/opus-4.8/`,
> `plan/fable-5/`). Those files stay as reference; **status is tracked only here.**
> Status legend: `☐ todo` · `🔄 in progress` · `✅ done` · `✋ decided-no` · `⏸ deferred`.

---

## 1. Where your time goes (the founder question)

Time is divided by **measured importance, not fairness**. Of a ~40-hour work week:

| Product / area | Share | ≈ Hours/wk | Why (evidence) |
|---|---|---|---|
| **AtlasVoice** (product + growth + support) | **~70%** | ~28h | 99.3% of revenue ($58.5K lifetime, $917 MRR); live install surge; renewal decay must be stopped |
| **AtlasAI Connector** | **~20%** | ~8h | Strategic flagship: trending category, WP 7.0 Abilities/MCP window open NOW, quarterly core-AI releases = commoditization clock |
| **AtlasAR + Smart Local AI** | **~5%** | ~2h | Maintenance + support only. AR = $23 MRR; SLAI = $0. One-time setup tasks below, then dormant until AtlasVoice stabilizes |
| **Founder/strategy time** | **~5%** | ~2h | Weekly review of this table; pricing decisions; nothing else |

Weekly rhythm (from the roles-automation plan): **4 protected mornings** = deep work on the P0/P1
items below · **1 admin afternoon** = batch-review all drafts/support/marketing · **1 planning hour**
= update this table. Interruption, not workload, is the enemy.

---

## 2. P0 — THIS WEEK (value decays daily)

| # | Action | Origin / evidence | Effort | Status |
|---|--------|-------------------|--------|--------|
| 1 | **Identify + protect the July install-surge source** (wp.org stats, referrers, directory ranking for "text to speech") | Data: ~70 installs/day since Jul 5, 83% new; ≈$75–80/day at 2025 conversion | hours | ☐ todo |
| 2 | **Launch the renewal-rescue program** (F2): pre-renewal email at day −30/−7 with value recap + renewal discount ladder; save-offer on cancel | June-Fable: renewal ≈32% ⇒ MRR halves in ~10 months — the single biggest revenue leak | 1–2 days | ☐ todo |
| 3 | **Wire Mailchimp↔Freemius purchase attribution** ("Connect store") | June #1 ("non-negotiable prerequisite") + Data #14 — email revenue is unmeasurable today | hours | ☐ todo |
| 4 | **Verify lapsed listings:** G2 (submitted Jun 5, "1–2 days", never verified) + submit AlternativeTo (unblocked since Jun 12, copy ready in artifacts) | June: both lapsed | hours | ☐ todo |

## 3. P1 — THIS MONTH: the AtlasVoice activation-hour package

*Rationale: 51% of churn happens <1h after install; 54% of buyers pay same-day. The first hour is
the business.*

| # | Action | Origin / evidence | Effort | Status |
|---|--------|-------------------|--------|--------|
| 5 | **First-play experience:** user hears their own latest post in <60s after activation (auto-demo before configuration) | Data (lifetime); June abandon-plan Phase 2 (wizard Phase 1 ✅ shipped) | days | ☐ todo |
| 6 | **Instrument `first_play` event** → install→first-play = the #1 product metric | Data | hours | ☐ todo |
| 7 | **Voice preview without signup** (sample premium voices in player/settings) | Data (churn): "no option to sample the alleged fantastic AI voices" | days | ☐ todo |
| 8 | **Mobile QA sweep** (iOS Safari / Android Chrome player) | Data: #1 concrete reliability complaint | days | ☐ todo |
| 9 | **Fix title-only extraction bug** (reported Jul 11, live) | Data (churn) | ticket | ☐ todo |
| 10 | **Elementor smoke-test added to release checklist** | Data: 41% of users; untested per release | hours | ☐ todo |
| 11 | **Pricing page strengthening** + **demo video/interactive playground** on /demo (4,896 views, no video; spec ready in `product-demo-video-and-interactive-demo.md`) | Data: pricing = #1 GA page, 92.6% of buyers arrive outside free-plugin funnel; June #25/F9 | 2–3 days | ☐ todo |
| 12 | **Lifetime-upgrade offer — DECIDE then ship or kill** (cash now vs MRR; Fable flagged the conflict with MRR targets) | June #2; founder decision | decision + day | ☐ todo |
| 13 | **In-plugin announcement channel** (admin notice feed you control — reopen/rebrand/updates) | June F6; also survives wp.org dependence | day | ☐ todo |

## 4. P1 — THIS MONTH: AtlasAI Connector (the 20% lane)

| # | Action | Origin / evidence | Effort | Status |
|---|--------|-------------------|--------|--------|
| 14 | **Fix the license stub** (`License_Manager::is_valid()` returns `true` — Pro unenforced) | Contracts (opus/fable): business risk before any marketing | ticket | ☐ todo |
| 15 | **Rebuild alignment with WP 7.0 core** (native Abilities API / AI Client / MCP adapter; stay ABOVE the commoditized plumbing — vertical workflows, RBAC, Woo intelligence) | Strategy: core ships AI quarterly; 7.1 lands Aug 19 | epic — start now | ☐ todo |
| 16 | **Ship ONE vertical showcase workflow** (e.g. Support-Desk recipes stub → working demo) + wp.org listing copy refresh around it | Strategy (feature-first); Connector has 1 paying user — needs a reason to buy | week | ☐ todo |

## 5. P2 — THIS QUARTER

| # | Action | Origin / evidence | Effort | Status |
|---|--------|-------------------|--------|--------|
| 17 | Onboarding-wizard funnel analysis (`tta_onboarding_events`: where do first-hour leavers stop?) | Data | hours | ☐ todo |
| 18 | Patchstack listing check + changelog note | Data (churn: cited in uninstalls) | hours | ☐ todo |
| 19 | Soften free-version truncation-upsell copy | Data (churn: reads as bait) | hours | ☐ todo |
| 20 | **ElevenLabs BYO-key pricing decision** (cheaper BYO tier vs status quo) | Data (churn ×2) + June lifetime-offer overlap — decide both in one pricing session | 30-min decision | ☐ todo |
| 21 | GTranslate compatibility testing (translated page vs voice language) | Data: GTranslate = 14% of sites, 5× Polylang | days | ☐ todo |
| 22 | Newsletter #1 to the consented Mailchimp list + 7-email post-purchase nurture (copy ready in `email-sequences.md`) | June #12/#15; only AFTER #3 attribution so results are measurable | day | ☐ todo |
| 23 | Internal-link injections (23-link hub/spoke map ready in `internal-linking.md`) | June #21; cheap SEO that survives zero-click | hours | ☐ todo |
| 24 | AI-visibility re-check (baseline Jun 4: Perplexity 47%, Gemini 60%, Claude skeptical; recheck was due Jul 4 — lapsed) + fix the stale-pricing scrape (AI engines cite old $59/$99/$149) | June #23 + artifacts | hours | ☐ todo |
| 25 | Publish competitive battlecards as comparison pages (drafts ready) | June #30; feeds citations + pricing page | day | ☐ todo |
| 26 | Finish Smart Local AI Freemius setup (8/9) — then dormant | Data: $0 lifetime, no monetization pipe | hours | ☐ todo |
| 27 | pt_BR voice + translation quality pass | Data: Brazil = #2 market (7.2%) | days | ☐ todo |
| 28 | YouTuber/editorial outreach (drafts ready in `outreach-emails.md`, `outreach-wpbuilds-pluginsatoz.md`) — personalize + send | June #17/#18; citations-era distribution | hours/wk | ☐ todo |

## 6. P3 — LATER / BACKLOG

| # | Action | Origin | Status |
|---|--------|--------|--------|
| 29 | June-2024 install-cliff investigation (changelog vs wp.org downloads) | Data | ☐ todo |
| 30 | Multilingual architecture refactor (GTranslate first, then Polylang/WPML) | Data + roadmap | ☐ todo |
| 31 | "Ask & Listen" cross-product slice (SLAI retrieves → LLM composes → AtlasVoice speaks) → extract AtlasAI core from it | Strategy (fable) — after Connector rebuild proves the ability layer | ☐ todo |
| 32 | Applied-AI skills block (RAG/embeddings/evals/agents — 2h/wk learning inside Connector work, not a course) | Strategy: career direction | ☐ todo |
| 33 | AI-visibility content: extraction-friendly docs, entity/schema depth (replaces traffic-SEO posting) | Strategy + data | 🔁 recurring |

## 7. Explicitly DROPPED (decided — don't re-litigate)

| Item | From | Why dropped |
|---|---|---|
| Win-back emails to segments B/C/D (11K+ ex-users) — and effectively A too | June/March plans | No consent (harvested admin emails); founder rule: never email churned/uninstalled. Win-back happens **in-plugin** only |
| Paid search ($450 budget) | June #8 | Organic surge is delivering ~70 installs/day free; revisit only if surge dies |
| Informational SEO posts for traffic | June #20/#28 (partly) | Measured: 7,842 impressions → 17 clicks. Only citation-bait/docs content (item 33) |
| Per-tool screenshots, ItemList schema, audio samples on posts | June content-log deferrals | Cosmetic; below the value line while activation hour is unfixed |
| Equal time across 4 products | (implicit habit) | Revenue: 99.3 / 0.4 / 0.3 / 0.0 — §1 allocation instead |
| Building a shared AtlasAI core library FIRST | opus-4.8 roadmap | Sequencing decision: feature-first (item 31), extract core from working code |

## 8. Already DONE (carried over from June — verified evidence)

✅ 7 P0 SEO defects (Jun 3–4, alt-text partial) · ✅ 3 posts published + 1 refresh (4723/4725/4739/3231)
· ✅ AggregateRating/Review schema live (18/19 valid) · ✅ AI-visibility baseline (Jun 4) · ✅ GSC/robots
cleanup + GA4 review + Merchant Center (Jun 5) · ✅ G2 submitted (verify = item 4) · ✅ Onboarding wizard
Phase 1 shipped · ✅ March audit: 42/56 tasks done · ✅ July: data pull + 5 analyses + this merge.

## 9. Scoreboard (update monthly)

| Metric | Baseline (Jul 2026) | Target (Oct 2026) |
|---|---|---|
| MRR | $950.66 | ≥ $1,100 (renewal-rescue + surge conversion) |
| Renewal rate | ~32% | ≥ 45% |
| Install→first-play | unmeasured | measured, then ≥ 60% |
| Same-day churn share | 63.7% | ≤ 50% |
| Installs/day (consented) | ~70 (surge) / ~2–5 (pre-surge) | surge source identified & held ≥ 30/day |
| Connector paying users | 1 | ≥ 10 |
| Free→Pro conversion (tracked) | 1.17% (1.87% best-year) | ≥ 2% |
