# Churn-Reason Analysis — July 2026

> Source: `plan/data/tracker-2026-07-11/uninstall-reasons.csv` — **14,851** deactivation-feedback
> rows (all-time, all AtlasAiDev plugins), `reason_id` + free text parsed from the serialized
> `details` field. 4,331 rows fall in the last 12 months; **1,147 rows carry a substantive
> free-text comment** (the rest chose nothing or "I rather wouldn't say").

## 1. The headline numbers

| Reason | All-time | Last 12 mo | Read as |
|---|---|---|---|
| none (skipped form) | 35.9% | 36.6% | no signal |
| other | 15.1% | 14.8% | ~half carry free text (the useful part) |
| no-comment ("I rather wouldn't say") | 15.0% | 16.0% | no signal |
| **debugging** | 12.8% | 13.3% | **temporary deactivation, not churn** — exclude |
| could-not-understand | 4.8% | 4.4% | onboarding/UX failure |
| looking-for-other | 4.8% | 4.8% | churn to market |
| did-not-work-as-expected | 4.0% | 3.6% | product gap |
| is-not-working | 3.6% | 2.7% | reliability |
| found-better-plugin | 2.8% | 2.7% | churn to competitor |
| not-have-that-feature | 1.2% | 1.1% | feature gap |

Two structural facts: (1) **~2/3 of leavers give no usable signal** and ~13% are just debugging —
so real, explained churn is the ~1,150 commented rows; (2) the distribution is **stable across
years** — churn causes are chronic, not a recent regression.

## 2. What the 1,147 real comments say (keyword clusters, whole corpus)

| Theme | Mentions | What it actually looks like |
|---|---|---|
| Not working / error | 128 | Generic breakage + a distinct **mobile cluster** |
| **Language / accent / pronunciation** | 108 | "not vietnamese voice" · TTS providers blocked in Russia · multilingual sites stuck with one language |
| Switched / competitor / DIY | 76 | VoxAI · "I develop my own plugin" · "proper one" |
| Button/player placement | 68 | Can't put the player where they want / player not visible |
| **Mobile** | 46 | "Not working on mobile" repeatedly, Oct–Nov 2025 spike |
| Price / cost | 38 | Mostly free-vs-pro friction, see §3 |
| Autoplay / UX controls | 34 | pause/stop/skip behavior |
| Voice quality (robotic) | 32 | "Sounds like a Windows machine from 1990" |
| Theme/plugin conflict | 19 | "it messes up the CSS!" (Avada-class, TTS-260/261 family) |

## 3. The five findings that matter

1. **Mobile reliability is the #1 concrete reliability complaint.** A visible run of
   "not working on mobile / phone" comments (Oct 2025 →). Web Speech API behavior on
   iOS/Android is the likely culprit. No strategy doc currently prioritizes mobile QA.
2. **The default-voice experience loses users before Pro can win them.** Pattern:
   free browser voice sounds robotic → user can't *hear* the premium voices without paying/signing
   up → uninstall. Direct quote: *"no option to sample the alleged fantastic AI voices without
   paying."* A no-signup voice **preview** on the player/settings would attack this directly.
3. **BYO-ElevenLabs-key resentment is a named churn cause.** Twice, explicitly: *"Don't want to
   pay for pro to make elevenlabs work, which I already pay for"* and *"Won't pay for using my own
   Elevenlabs voice, so I develop my own plugin."* Pricing decision to revisit: a cheaper
   "bring-your-own-key" tier vs. losing these users entirely.
4. **Multilingual is a churn cause, not just a roadmap item.** Missing languages (Vietnamese…),
   region-blocked providers (Russia), and per-language limitations on multilingual sites all appear.
   This validates prioritizing `TTS-future-multilingual-architecture-refactor`.
5. **Two reputation landmines showed up:**
   - A **Patchstack vulnerability listing** was cited as an uninstall reason (Sep 2025) — make sure
     the fixed status is reflected on Patchstack and communicated.
   - The **free-version truncation upsell** reads as a dark pattern to users: *"It doesn't read all
     the text, then I see an advertisement saying the paid version fixes it… that is crazy."*
     Worth softening the copy so the limit is disclosed up front rather than felt as a bait.

Also live **right now**: a July 11, 2026 comment reports the player *"stuck only reading the
title"* despite body content selected — a current extraction bug (TTS-238 family) worth a ticket.

## 4. Ranked actions (impact ÷ effort)

1. **Mobile QA sweep** of the player (iOS Safari, Android Chrome; Web Speech quirks) → fixes the
   top reliability cluster.
2. **Voice preview without signup** (sample premium voices in-player or on settings) → converts
   instead of churning the "robotic voice" cohort.
3. **File the title-only extraction bug** from the 2026-07-11 comment; reproduce against current
   `develop`.
4. **Patchstack status check + changelog note** → removes a standing uninstall trigger.
5. **Pricing review of the ElevenLabs BYO-key gate** → founder decision; data says it churns
   technically-savvy users who already pay ElevenLabs.
6. **Soften the truncation-upsell copy** → cheap goodwill fix.
7. Keep multilingual refactor prioritized (validated by real churn, not just strategy).

## 5. Method note
`reason_id` extracted by regex from serialized PHP; free text length-decoded from `reason_info`.
Full comment corpus (timestamped, per plugin) staged in the session scratchpad; themes are keyword
counts and overlap (one comment can hit two themes). "AtlasVoice" vs "Text To Speech TTS" naming
in rows reflects the rebrand era, same product.
