# Install-Trend Analysis — July 2026

> Source: `plan/data/tracker-2026-07-11/tracking.csv` — 5,532 consented installs of the TTS product
> ("Text To Speech TTS" + "AtlasVoice" rows, same plugin across the rebrand), Sep 2023 → Jul 11 2026.
> Caveat: this counts **opted-in** installs only — a floor, not the wp.org install number; trend
> shape is the reliable signal, not absolute level.

## 1. The trend in one view (monthly consented installs)

| Era | Rate | Note |
|---|---|---|
| Sep 2023 – May 2024 | **~250–360/mo** | strong acquisition era |
| **Jun–Jul 2024** | 139 → 89 | **the cliff: −65% in two months** |
| Aug 2024 – Apr 2025 | ~75–130/mo | trough, mild H1-2025 recovery (~100–160) |
| May 2025 – Feb 2026 | ~60–130/mo, sliding | slow decline to ~60–65/mo |
| Mar–Jun 2026 | 60–83/mo | rebrand era, flat-low |
| **Jul 1–11, 2026** | **433 in 11 days** | **~20× June's daily rate — see §3** |

Uninstall-feedback volume declined in parallel (454/mo Jun 2025 → 236/mo Jun 2026) — the whole
funnel was shrinking together until this month.

## 2. Rebrand timeline (measured)

First install reporting as **"AtlasVoice": March 15, 2026**. By April 2026, ~80% of new installs
carry the new name; July is ~2/3 AtlasVoice (mixed-version base still updating).

## 3. ⭐ The July 2026 surge is REAL and NEW — identify its source now

- Daily installs: ~4–6/day (Jul 1–3) → **43 (Jul 4-5) → 54 → 72 → 65 → 75 → 72/day** sustained.
- **328 of 394 July emails (83%) had never been seen in the tracker before** — this is genuinely
  new-user acquisition, not an update/re-consent artifact.
- Timing rules out our releases: the surge began **July 4–5**, before 2.3.4 (Jul 10) and 2.3.5
  (Jul 14). It coincides with the early-July impressions uptick visible in Search Console.
- Other products got a spillover bump in July too (Connector's first 6 tracked installs, TTS Pro
  17, AtlasAR 7) — consistent with a discovery/visibility event lifting the whole account.

**Action (time-sensitive):** find the source this week — wp.org download-stats chart, referral
headers, plugin-directory ranking for "text to speech" — and protect/amplify it. And remember the
lifetime analysis: **51% of churn happens in the first hour** — at ~70 installs/day, every day the
first-run experience stays unfixed, ~35 users/day from this surge evaporate.

## 4. The June 2024 cliff — open question for the founder

Installs fell from 253 (May 2024) to 89 (Jul 2024) and never recovered. Candidate explanations to
check against history: (a) a release that changed the consent/opt-in flow (tracked-install floor
drops without real installs dropping), (b) wp.org search-ranking loss, (c) Freemius-era changes.
Worth correlating with the 2024 changelog + wp.org download stats — if (b), the current July surge
may be the mirror event (ranking regained).

## 5. Other products (2026, tracked installs — for scale)

AtlasAR ~1–7/mo · TTS Pro 3–17/mo · Smart Local AI ~1/mo · Connector: first installs July (6).
All pre-scale; the TTS product remains the only meaningful acquisition engine (consistent with
revenue: 99.3% AtlasVoice).

## 6. Bottom line

> Acquisition declined for two years (with a still-unexplained 2024 cliff), the rebrand landed
> March 2026 — and in the last week something started driving **~70 genuinely new installs/day**.
> Finding and feeding that source, while fixing the first-hour experience it pours into, is the
> highest-leverage growth work available right now.
