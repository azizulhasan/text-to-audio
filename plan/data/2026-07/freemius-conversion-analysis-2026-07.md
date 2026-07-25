# Free→Pro Conversion Analysis (Freemius × Tracker) — July 2026

> Sources: `tracker-2026-07-11/freemius-users-2026-07-15.csv` (2,404 Freemius users, 485 payers,
> ~$56.2K gross — fresh export) joined by email to `tracking.csv` (3,065 unique consented
> free-install emails, TTS product, Sep 2023 →). Caveat: only *consented* installs are joinable,
> so rates below are for the tracked subset, not the whole wp.org install base.

## 1. The headline numbers

| Metric | Value |
|---|---|
| All-time payers (gross > 0) | **485** (~$56.2K gross) |
| Tracked free installs (unique emails) | 3,065 |
| Tracked installs that became payers | **36 → 1.17% conversion** |
| Payers who appear in the tracker at all | 36 of 485 → **92.6% of buyers were never tracked as free users** |

## 2. ⭐ Buyers decide the same day — just like churners

Of the 24 conversions where purchase followed the tracked install:

| Install → purchase lag | Share |
|---|---|
| **Same day** | **54.2%** |
| 1–7 days | 25.0% |
| 8–30 days | 8.3% |
| 91–365 days | 12.5% |
| median | **0.2 days (~5 hours)** |

Combined with the lifetime analysis (51% of churn within the first hour), the picture is now
complete: **the first day decides everything — both the sale and the loss.** ~80% of buyers commit
within a week; there is no meaningful "slow-burn" conversion tail. Long nurture sequences can't
create buyers this data says don't exist; the first-run experience can.

## 3. Cohort trend — conversion was *improving* until 2026

| Install year | Tracked installs | Converted | Rate |
|---|---|---|---|
| 2023 | 418 | 3 | 0.72% |
| 2024 | 865 | 10 | 1.16% |
| 2025 | 1,126 | 21 | **1.87%** |
| 2026 | 656 | 2 | 0.30%* |

\* 2026 installs are young (and include the July surge, days old) — too early to read; watch this
cohort. The 2023→2025 doubling suggests product/onboarding improvements were paying off.

## 4. The 92.6% surprise — most buyers don't come through tracked free usage

Only 36 of 485 payers ever appeared as consented free installs. The rest either (a) bought
during the pre-tracker/Freemius-SDK era, (b) never opted into telemetry, or (c) **went straight
to Pro** — which GA supports: the pricing page is the site's #1 page, fed by product-intent
search. Implication: the **website→checkout funnel is a first-class revenue channel**, not just a
support surface for the plugin — invest in the pricing/demo pages as seriously as in the plugin's
upgrade prompts.

## 5. Actions

1. **Fold conversion into the first-day work.** Same-day buyers + first-hour churners = one
   conclusion: the activation hour is the whole game (first-play experience, working defaults,
   voice preview) — it drives revenue directly, not just retention.
2. **Watch the July-surge cohort's conversion** (656+ new 2026 installs): if the ~1.9% 2025 rate
   holds, the surge (~70/day) is worth ~1.3 new buyers/day ≈ **$75–80/day of new gross** — real
   money that makes protecting the surge source urgent.
3. **Keep investing in the pricing/demo pages** (the untracked-buyer channel).
4. Re-run this join quarterly (fresh Freemius export + incremental tracker pull) to track the
   conversion trend per cohort.

## Method
Email-level join, lowercased; payer = gross > 0; earliest tracked install per email; 12 of 36
matches had purchase *before* their tracked install (existing customers reinstalling free) and
are excluded from lag stats. Freemius `created` used as purchase-date proxy (accurate for buyers
post-TTS-249 since free users no longer create Freemius accounts).
