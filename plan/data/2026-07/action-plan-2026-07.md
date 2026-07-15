# Action Plan — July 2026 (data-driven)

> Built from the July 2026 data pull + 5 analyses + revenue reality-check (`plan/data/2026-07/`).
> Priorities reflect **measured impact**, not guesses. Update the Status column as work progresses:
> `☐ todo` · `🔄 in progress` · `✅ done` · `✋ decided-no`.

## The one-line thesis the data gives us

> **The first hour after install decides both the sale and the loss.** 51% of churn happens within
> 60 minutes; 54% of buyers pay the same day; median purchase lag ≈ 5 hours. Almost every P0/P1
> below attacks that hour — everything else feeds or protects it.

## Priority key

- **P0 — this week** (time-sensitive; value decays daily)
- **P1 — this month** (the activation-hour package + direct revenue)
- **P2 — this quarter** (high value, not urgent)
- **P3 — later / standing rules**

## Status table

| # | Pri | Action | Why (source) | Effort | Status |
|---|-----|--------|--------------|--------|--------|
| 1 | **P0** | **Identify the July install-surge source** (wp.org download stats, referrers, "text to speech" directory ranking) and protect/amplify it | ~70 new installs/day since Jul 5, 83% brand-new users; worth ~$75–80/day gross at 2025 conversion (install-trend, conversion) | hours | ☐ todo |
| 2 | **P1** | **First-play experience:** after activation, user hears their own latest post in <1 minute (auto-demo on settings page, before any configuration) | 51% of churn in first hour; early leavers say "could-not-understand" (lifetime, churn) | days | ☐ todo |
| 3 | **P1** | **Instrument `first_play` event** → track install→first-play conversion as the #1 product metric | can't improve the activation hour without measuring it (lifetime) | hours | ☐ todo |
| 4 | **P1** | **Voice preview without signup/payment** — sample premium voices in player/settings | "robotic voice + can't sample AI voices" = named churn; buyers decide same-day (churn, conversion) | days | ☐ todo |
| 5 | **P1** | **Mobile QA sweep** — player on iOS Safari + Android Chrome (Web Speech quirks) | #1 concrete reliability complaint cluster (churn) | days | ☐ todo |
| 6 | **P1** | **Fix title-only extraction bug** — player reads only title despite body selected (reported Jul 11) | live bug, TTS-238 family (churn) | ticket | ☐ todo |
| 7 | **P1** | **Add Elementor smoke-test to the release checklist** | Elementor = 41% of user base, currently untested per release (user-stack) | hours (process) | ☐ todo |
| 8 | **P1** | **Strengthen pricing page** — social proof, comparison table, objection handling; demo→pricing path | pricing page = #1 GA page; 92.6% of buyers come outside tracked free usage (reality-check, conversion) | days | ☐ todo |
| 9 | **P2** | **Onboarding-wizard funnel analysis** — use `tta_onboarding_events` to find where first-hour leavers stop | AtlasVoice-era same-day churn 6.5pts better → wizard helps; find the drop-off step (lifetime) | hours | ☐ todo |
| 10 | **P2** | **Patchstack listing check** — confirm fixed status is public + changelog note | cited as an uninstall reason (churn) | hours | ☐ todo |
| 11 | **P2** | **Soften truncation-upsell copy** — disclose the free limit up front | reads as bait-and-switch to users (churn) | hours | ☐ todo |
| 12 | **P2** | **ElevenLabs BYO-key pricing decision** (founder call: cheaper BYO tier vs status quo) | named churn cause ×2; churns technical users who already pay ElevenLabs (churn) | decision | ☐ todo |
| 13 | **P2** | **Add GTranslate to compatibility matrix** — test page-translation vs voice language | GTranslate = 14% of sites, 5× Polylang; likely hidden "wrong language" bug source (user-stack) | days | ☐ todo |
| 14 | **P2** | **Connect Freemius→Mailchimp store attribution** ("Connect store") | email revenue currently unmeasurable (reality-check) | hours | ☐ todo |
| 15 | **P2** | **Finish Smart Local AI Freemius setup (8/9)** | product has NO working monetization pipeline; $0 lifetime (reality-check) | hours | ☐ todo |
| 16 | **P2** | **Fix Connector license stub** (`License_Manager::is_valid()` returns `true`) before further Connector investment | Pro features currently unenforced (connector contract) | ticket | ☐ todo |
| 17 | **P2** | **pt_BR first** — verify pt-BR voice quality + translation completeness | Brazil = #2 market (7.2%); ~50% of base non-English (user-stack) | days | ☐ todo |
| 18 | **P3** | **Investigate the June-2024 install cliff** (changelog vs wp.org downloads: consent change? ranking loss?) | −65% installs in 2 months, never recovered (install-trend) | hours | ☐ todo |
| 19 | **P3** | **Shift content strategy: citations over traffic** — structured data, entity/docs quality; stop writing informational posts for clicks | 7,842 impressions → 17 clicks on "best text to speech"; AI agents already hitting docs (reality-check) | ongoing | ☐ todo |
| 20 | **P3** | **Multilingual architecture refactor stays prioritized** (with GTranslate first, per #13) | language gaps = named churn; validated by data (churn, user-stack) | epic | ☐ todo |

## Standing rules (no status — just don't violate)

- **Don't raise min PHP above 7.4** — 20% of users still on 7.4 (user-stack).
- **Keep Classic Editor / shortcode paths first-class** — 34.5% of users aren't on Gutenberg (user-stack).
- **Never email churned/uninstalled audiences** — consent + deliverability (telemetry pipeline rule).
- **Never regress the LiteSpeed cache exclusions** — protects ~29% of users (user-stack).
- **Next tracker pull is incremental only** — tracking id > 37124, uninstall id > 15087, subscribers id > 32 (watermark).
- **Avada-class compat issues = fix-on-report**, not proactive (0.7% of users; Elementor first).

## Suggested sequencing (solo-founder realistic)

1. **Week 1:** #1 (surge source — decays daily) + #3 (first_play event — tiny) + #7 (checklist change) + #10/#11 (cheap goodwill).
2. **Weeks 2–4:** the activation package — #2, #4, #6, then #5; #8 in parallel on marketing days.
3. **Quarter:** #9, #12–#17 as capacity allows; #12 is a decision, not code — schedule 30 minutes and decide.
4. **Backlog:** P3 items; review this table monthly against fresh MRR/install numbers.
