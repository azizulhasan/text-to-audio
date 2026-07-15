# Install → Uninstall Lifetime Analysis — July 2026

> Source: `plan/data/tracker-2026-07-11/` — `tracking.csv` (5,614 consented installs, Sep 2023 →
> Jul 2026) joined to `uninstall-reasons.csv` (14,851 rows) on **email + plugin**, earliest install
> to first subsequent uninstall. 3,175 unique install identities → **1,399 matched churn pairs**.

## 1. Headline: the product loses users in the first HOUR

| Lifetime before uninstall | Share of churners |
|---|---|
| **Same day (<24h)** | **63.7%** |
| ↳ of those, **within 1 hour** | **80.9%** (721 users = **51.5% of ALL matched churn**) |
| 1–2 days | 8.6% |
| 3–7 days | 9.1% |
| 8–30 days | 5.8% |
| 31–90 days | 4.6% |
| 91–365 days | 6.9% |
| >365 days | 1.3% |

**Median lifetime: same-day. Half of all churn happens within ~60 minutes of install.**
This is not a retention problem — it's a **first-run problem**: install → try → fail to reach
value → gone before lunch.

## 2. Same-day churners leave for different reasons than long-term users

| Reason | Same-day churners | 8+ day churners |
|---|---|---|
| could-not-understand | **8.5%** | 5.0% |
| is-not-working | **5.2%** | (below top-6) |
| debugging | 10.4% | **18.8%** |
| looking-for-other | — | **4.6%** |

Early leavers say *"I couldn't understand it / it didn't work"* — a setup/first-run failure.
Late leavers are doing site maintenance ("debugging") or shopping around. **The fixable cohort is
the first-hour one.**

## 3. Rebrand-era signal (mildly positive)

| Era | Matched pairs | Same-day share |
|---|---|---|
| "Text To Speech TTS" rows | 1,315 | 64.2% |
| "AtlasVoice" rows (recent) | 78 | **57.7%** |

The AtlasVoice-era same-day churn is ~6.5 points lower — consistent with the onboarding wizard
helping, but 58% first-day loss is still the dominant leak.

## 4. Churn-rate proxy

**44.1%** of tracked installs have a later uninstall-with-feedback record; the remaining ~56% are
still active or left silently. Treat 44% as a *lower bound* on churn and the shape (not the level)
as the reliable signal.

## 5. What this changes (ranked)

1. **The first 60 minutes IS the product.** The single highest-leverage retention work is
   time-to-first-played-audio: after activation, the user should hear their own content spoken in
   under a minute — ideally an auto-demo on the settings page ("here's your latest post, press
   play") rather than configuration first. Measure it: emit a `first_play` onboarding event and
   track install→first-play conversion.
2. **Triage the first-run failure modes** from the churn-reason analysis (player not visible on
   the page, mobile not working, robotic default voice with no preview) — these are exactly what a
   first-hour leaver hits.
3. **Onboarding wizard: measure, don't assume.** The AtlasVoice-era improvement suggests it helps;
   the `tta_onboarding_events` data (`/onboarding-event` route) can show *where* in the wizard
   first-hour leavers stop.
4. **Don't over-invest in win-back/late-retention** — only ~12% of churn happens after day 30.
   The money is all at the front door. (Consistent with: churned users must not be emailed anyway.)

## 6. Method + caveats
Join key = lowercased `admin_email` + `plugin`; earliest install per key; first uninstall ≥ install
date; negative-lifetime pairs (uninstall records predating the tracked install, e.g. Freemius-era
installs) excluded. Tracker-era installs only (id ≥ 26635). Non-TTS products have too few pairs
(≤2 each) to read. "Text To Speech TTS" vs "AtlasVoice" is the same product across the rebrand.
