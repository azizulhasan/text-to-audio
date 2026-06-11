# 12 — Email Sequences (marketing:email-sequence skill output)

**Three sequences for AtlasVoice. Brand voice:** Azizul Hasan, founder. Direct, warm, no SaaS marketing-speak. Sender: contact@atlasaidev.com.

**Platform:** Mailchimp Standard (audience "AtlasVoice", list 903621, us2 region).

**Prerequisite:** Mailchimp ↔ Freemius e-commerce attribution must be wired BEFORE these go live (Mailchimp "order rate" is 0% today — can't measure conversion until tracking is fixed).

---

# SEQUENCE 1 — Win-back (12,475 contacts, 4 segment branches)

**Goal:** Reactivate 2-3% of ex-users (250-375 reinstalls), with ~5-10% of those converting to Pro.
**Total expected reactivations:** 250-375 reinstalls + ~15-30 Pro conversions = ~$900-$1,800 in immediate Pro revenue + Mailchimp list growth.

## Sequence Overview Table — Segment A (715 bug reporters, sent first)

| # | Subject Line | Purpose | Timing | Primary CTA | Condition |
|---|---|---|---|---|---|
| 1 | We fixed what you reported in AtlasVoice | Acknowledge their bug + show specific fixes | Day 0 | Reinstall AtlasVoice | None — entire segment |
| 2 | Still skeptical? Here's the proof | Address lingering doubt + specific changelog | Day 5 | See changelog | Only if no click on Email 1 |
| 3 | 25% off if you give us another try | Last incentivized push | Day 12 | Claim 25% off Pro | Only if no click on Emails 1 or 2 |

---

## EMAIL A1 — "We fixed what you reported" (Day 0)

**Subject line options:**
- A: "We fixed the issues you reported in AtlasVoice" (49 chars)
- B: "You uninstalled AtlasVoice — but it's different now" (53 chars)
- C: "Re: AtlasVoice — the bugs are gone" (35 chars)

**Recommended:** A (direct, specific)

**Preview text:** "Plus a 25% discount if you want to try us again." (47 chars)

**Purpose:** Open the conversation with humility, reference the specific reason they left, give them proof, and ask honestly.

**Body:**

```
Hi *|FNAME|fallback="there"|*,

A while back you installed AtlasVoice on *|SITE|fallback="your WordPress site"|* and deactivated it because it wasn't working the way you expected. You took the time to leave us a reason. That meant a lot.

I want you to know — we listened.

Since you left, we've shipped:

✓ A 4-step onboarding wizard so you hear the player working in under 60 seconds
✓ Compatibility fixes for Astra, GeneratePress, Elementor, Divi, and the top caching plugins (LiteSpeed, WP Rocket, W3 Total Cache, Autoptimize)
✓ Stability fixes for PHP 7.4 through 8.3
✓ Better error reporting so you know when something fails (and how to fix it)
✓ Native compatibility with WPML, GTranslate, and Polylang for multilingual sites

I'm not going to pretend everything is perfect. But the issue you flagged is almost certainly resolved — and if it isn't, just reply to this email. I read every response.

If you want to give AtlasVoice another try:

[Download AtlasVoice Free →]

And if you want premium AI voices (Google Cloud, OpenAI, ElevenLabs), there's a discount waiting for you in email #3 — but try the free version first.

Either way — thanks for the original feedback.

Cheers,
Azizul
Founder, AtlasAiDev
```

**Primary CTA:** `Download AtlasVoice Free` → atlasaidev.com/temporarily-delisted-on-wp-org-download-direct/ (or wp.org link when reopened)

**Personalization tokens:** `*|FNAME|*`, `*|SITE|*` (the URL they originally installed on, from the tracker DB)

**Segment notes:** Only send to contacts with reason_id IN ("is-not-working", "did-not-work-as-expected", "suddenly-stopped"); created_at within last 18 months.

---

## EMAIL A2 — "Still skeptical? Here's the proof" (Day 5)

**Subject:** "Want to see what changed?" (29 chars)
**Preview:** "Quick changelog from the last 6 months on AtlasVoice."

**Purpose:** Address the lingering doubt of "I've heard 'we fixed it' before" with specific, scannable proof.

**Body:**

```
Hi *|FNAME|fallback="there"|*,

Last week I sent you a note about the bug fixes in AtlasVoice. If you skipped it, here's the short version: we've been busy.

Specific things shipped since you left:

→ Onboarding wizard — 60 seconds from install to first audio
→ 4 AI voice providers — AtlasVoice AI (free with Pro, 63 languages), Google Cloud, OpenAI/ChatGPT, ElevenLabs
→ Bulk MP3 generation for entire sites
→ Audio schema markup for SEO (rich audio results in Google)
→ Floating/sticky audio player
→ CSS selector targeting
→ 6 player styles + multilingual support

Most of those didn't exist when you installed the original free version.

If you're not ready to test it on your site, the demo page is here:

[Try the Live Demo →]

(No signup. Just hear it work.)

— Azizul

P.S. If you've moved on to a different solution, I'd appreciate one reply telling me what you picked and why. That feedback is more valuable than a reactivation.
```

**Primary CTA:** `Try the Live Demo` → /plugins/text-to-speech-pro/demo/

**Segment notes:** Send only to A1 non-clickers (Mailchimp condition: opened-or-not-opened doesn't matter; "did not click" is the trigger).

---

## EMAIL A3 — "25% off — last try" (Day 12)

**Subject:** "Last note from us — 25% off if you reactivate" (45 chars)
**Preview:** "And if not, that's OK too. I won't email again."

**Purpose:** Last incentivized push. Frame as final attempt — both honest and respectful.

**Body:**

```
Hi *|FNAME|fallback="there"|*,

This is the last email I'll send about AtlasVoice. Either it's a fit for *|SITE|fallback="your site"|* or it isn't — I won't keep nudging.

If you want to give it a try, here's a 25% discount on AtlasVoice Pro:

Coupon code: WELCOMEBACK25
Valid for 14 days
Works on Yearly and Lifetime plans

[Claim 25% Off AtlasVoice Pro →]

That brings Pro down to:
- Starter: $44.25/yr (1 site)
- Professional: $111.75/yr (5 sites)
- Enterprise: $149.25/yr (10 sites)

And there's still a 14-day money-back guarantee on top.

If you reactivate and it doesn't work — reply to this email and I'll personally refund you. Not Freemius, me.

If you don't, no hard feelings. Thanks for trying us originally.

Best,
Azizul
Founder, AtlasAiDev

P.S. If you'd ever want to talk about what we should build next — I'm at contact@atlasaidev.com.
```

**Primary CTA:** `Claim 25% Off AtlasVoice Pro` → pricing page with `?coupon=WELCOMEBACK25` or Freemius checkout URL with the code applied

**Segment notes:** Send only to A2 non-clickers (or A1 non-clickers if A2 was skipped due to deliverability).

**Setup requirement:** Create coupon `WELCOMEBACK25` in Freemius before sending. 25% off, applicable to yearly + lifetime, 14-day expiration from creation.

---

## Segment B (744 feature seekers) — Same 3-email cadence, different content

### EMAIL B1 — "AtlasVoice now has what you asked for"

**Subject:** "AtlasVoice now has the features you wanted"

**Body opening:**
```
Hi *|FNAME|fallback="there"|*,

A while back you uninstalled AtlasVoice from *|SITE|fallback="your site"|* and mentioned it was missing features you needed.

Since then, we've added a lot:

✓ 4 AI voice providers in one plugin (Google Cloud, OpenAI/ChatGPT, ElevenLabs, AtlasVoice AI)
✓ MP3 file generation + bulk MP3 for hundreds of posts
✓ Visitor MP3 downloads
✓ Audio schema markup (SEO rich results)
✓ Floating/sticky player
✓ CSS selector targeting + content control
✓ 6 player styles
✓ WPML / GTranslate / Polylang support
✓ 51+ languages
✓ Advanced analytics (heatmaps, peak hours, completion rates)

Was the one you needed in this list?

If yes:

[See AtlasVoice Pro Features →]

If we still don't have what you need — reply and tell me. We're shipping new things every month.

Cheers,
Azizul
```

**Primary CTA:** `See AtlasVoice Pro Features` → /plugins/text-to-speech-pro/

### EMAIL B2 — "What we're shipping next" (Day 5)
Brief — share the public roadmap (built in campaign-plan step 6). Subject: "What we're shipping in AtlasVoice next"

### EMAIL B3 — Same 25% off as Segment A3, slightly different lead-in

---

## Segment C (8,585 silent churn) — Lighter touch, 2 emails only

**Why fewer:** Silent churn is the largest segment and lowest signal. Mass volume risks deliverability damage. Two short emails sent in batches of 1,000/week over 9 weeks.

### EMAIL C1 — "AtlasVoice has changed"

**Subject:** "It's been a while — quick update on AtlasVoice" (44 chars)
**Preview:** "What we've shipped + why you might want to take a second look."

**Body:** Short. Lead with one stat ("we shipped 47 updates since you left"), bullet 5 highlights, two CTAs (free demo + 20% off).

### EMAIL C2 — 20% off coupon (Day 10, only to C1 non-clickers)
Use coupon `COMEBACK20`, 7-day expiration.

---

## Segment D (1,741 debug-only) — 1 email only

**Why one:** These users installed AtlasVoice to test/debug a WordPress issue, not to use it. Low intent.

### EMAIL D1 — "Done testing? Here's why 4,000+ sites kept it"

**Subject:** "Done testing AtlasVoice? Here's what real users do with it"

**Body:** Lead with the use cases (accessibility, audio for blog posts, audiobook conversion, ADA compliance). Soft CTA to product page. No discount.

---

## Win-back Sequence Flow Diagram

```
[Trigger: Mailchimp segment match]
         |
         v
    Identify reason_id
         |
   +-----+------+--------+--------+
   |     |      |        |        |
   v     v      v        v        v
  A1    B1     C1       D1      (other reasons — skip)
  (Day0) (Day0) (Day0)  (Day0)
   |      |      |
   v      v      v
   Clicked CTA? ----- Yes -----> [EXIT: Conversion]
   |      |      |
   No     No     No
   |      |      v
   v      v    C2 (Day10, 20% off)
  A2    B2      |
  (Day5)(Day5)  Clicked?
   |      |     |
   v      v     +- Yes -> [EXIT: Conversion]
   Clicked?     |
   |    |       v
   Yes  No   [EXIT: Sequence complete]
   |    |
   v    v
[EXIT] A3 (Day12, 25% off)
       B3 (Day12, 25% off)
        |
        v
   Clicked? Yes -> [EXIT: Conversion]
        |
        No
        v
   [EXIT: Sequence complete, suppress for 12 months]
```

---

## Win-back branching logic
- **Exit on Pro purchase** (any Mailchimp contact whose email matches a new Freemius purchase exits all win-back paths immediately)
- **Exit on free reinstall** (track via Mailchimp UTM-tagged links → Freemius `installs` API)
- **Suppress if active in another sequence** (e.g., already in the Convert-to-Pro journey)
- **Suppress if unsubscribed**
- **Re-entry**: contacts cannot re-enter the win-back sequence for 12 months
- **Send pacing**: 1,000 contacts/week per segment (avoid deliverability damage); high-engagement segments (A: 715) can send all at once

## Win-back A/B test recommendations
1. **A1 subject line A vs B vs C** — "We fixed the issues you reported" vs "You uninstalled AtlasVoice — but it's different now" vs "Re: AtlasVoice — the bugs are gone". Split 33/33/33. Measure open rate.
2. **A3 coupon — 25% vs lifetime upgrade vs free 1-month trial** — Split 50/50 on first 100 recipients. Measure click-through + conversion.
3. **C1 send time — Tuesday 9am vs Thursday 4pm**. Split 50/50. Measure open rate.

## Win-back metrics to track
- **Per-email**: open rate, click rate, unsubscribe rate
- **Per-segment**: total reactivations / total emailed
- **Sequence-wide**: time-to-reactivation; Pro conversion rate from reactivated free users
- **Review cadence**: weekly for first month, then biweekly

**Benchmark targets (Mailchimp Win-back):**
- A: open 25-30% / CTR 4-7% / reactivation 4-7% (highest intent)
- B: open 20-25% / CTR 3-6% / reactivation 3-5%
- C: open 15-20% / CTR 2-4% / reactivation 1-2%
- D: open 12-18% / CTR 1-3% / reactivation 0.5-1%

---

# SEQUENCE 2 — Post-Purchase Nurture (new Pro subs)

**Goal:** Retain new Pro subs through their first 30 days. Eliminate the 32% renewal rate (currently 68% don't renew). Increase yearly→lifetime upgrade rate.

**Trigger:** New Freemius Pro purchase (yearly OR lifetime).
**Length:** 7 emails over 30 days.

## Sequence Overview Table

| # | Subject Line | Purpose | Timing | Primary CTA |
|---|---|---|---|---|
| 1 | Welcome to AtlasVoice Pro 🎙 | Welcome, set expectation | Hour 0 | Run setup wizard |
| 2 | Have you connected a voice provider? | Activate first AI voice | Day 2 | Connect Google Cloud |
| 3 | This is the one feature that pays for AtlasVoice Pro | Highlight bulk MP3 generation | Day 5 | Try bulk MP3 |
| 4 | Three readers wrote in this week | Share use cases | Day 10 | Read case studies |
| 5 | Quick check — how's it going? | Solicit feedback | Day 14 | Reply or rate us |
| 6 | The trick to ranking on Google with audio | Audio schema for SEO | Day 21 | Enable audio schema |
| 7 | What's coming next in AtlasVoice Pro | Roadmap + lifetime upgrade nudge | Day 30 | Upgrade to lifetime |

---

## EMAIL P1 — Welcome (Hour 0)

**Subject:** "Welcome to AtlasVoice Pro 🎙" (28 chars)
**Preview:** "Here's how to get the most out of your first 24 hours."

**Body:**

```
*|FNAME|fallback="Hi"|*,

You just upgraded to AtlasVoice Pro. Thanks for trusting us.

Quick orientation — the most important thing to do in your first 24 hours:

1. Log into WordPress → AtlasVoice → run the Pro setup wizard
2. Connect at least one AI voice provider (Google Cloud, OpenAI, or ElevenLabs)
   → Or just enable AtlasVoice AI (no API key needed; 63 languages included)
3. Pick a player style that matches your site

That's it. Audio will start working immediately on every post.

[Run Setup Wizard →]

If you hit any issue in the next 24 hours — just reply to this email. I check it personally, not a support inbox.

Cheers,
Azizul

P.S. Save this email. It has my direct address.
```

**Primary CTA:** `Run Setup Wizard` → /wp-admin/admin.php?page=text-to-audio

## EMAIL P2 — First Voice (Day 2)

**Subject:** "Have you connected a voice provider yet?"
**Preview:** "If not, here's why it's worth 5 minutes."

**Body:** Short. Confirm if they've connected a voice (via Freemius webhook or by polling — or just ask). Walk through Google Cloud setup in 5 steps. Link to `/how-to-set-up-google-cloud-tts-wordpress/` (NEW post per content-strategy item #7).

## EMAIL P3 — Bulk MP3 (Day 5)

**Subject:** "This is the one feature that pays for AtlasVoice Pro"
**Preview:** "Generate audio for hundreds of posts in one click."

**Body:** Lead with the time-saving math (per-post @ 5 sec × 100 posts = 500 sec, vs hours manually). Walk through bulk MP3 generation.

## EMAIL P4 — Use Cases (Day 10)

**Subject:** "Three readers wrote in this week"
**Preview:** "How they're using AtlasVoice — ideas you might steal."

**Body:** Three short, real use cases (anonymized): a food blogger generating audio for recipes, an e-commerce store reading product descriptions, an accessibility consultant deploying on 20 client sites. Link to /atlasvoice-customer-stories/ (NEW per content-strategy item #24).

## EMAIL P5 — Check-in (Day 14)

**Subject:** "Quick check — how's AtlasVoice working out?"
**Preview:** "Just hit reply. I'm listening."

**Body:** Short. One-question survey (NPS-style scale 1-10). Reply directly to email or click link. Goal: detect frustration BEFORE they churn.

## EMAIL P6 — Audio Schema for SEO (Day 21)

**Subject:** "The trick to ranking on Google with audio"
**Preview:** "Pro adds AudioObject schema — here's why it matters."

**Body:** Explain that AtlasVoice Pro auto-adds AudioObject schema to every page with audio. Show how this triggers rich audio SERP results. Link to enable + verify.

## EMAIL P7 — Roadmap + Lifetime Upgrade (Day 30)

**Subject:** "What's shipping next in AtlasVoice Pro"
**Preview:** "Plus an exclusive 30-day-customer perk."

**Body:** Share the public roadmap (per campaign-plan item P1). At the bottom, soft-offer lifetime upgrade with credit for the yearly:

```
You've had AtlasVoice Pro for 30 days. If you're loving it and want to lock in the price forever:

We'll credit your remaining yearly subscription against a lifetime license. So instead of $199 for Starter Lifetime, it's $140 — and you'll never pay annually again.

[Upgrade to Lifetime (Save $59) →]

This offer is in your portal for 14 days.
```

---

## Post-purchase suppression rules
- **Suppress** if customer has filed a support ticket in last 72 hours (don't email during active support)
- **Suppress** if customer requested refund (different journey applies)
- **Branching**: if customer is "Lifetime" tier from day 1, skip Email P7 (no upgrade to push)

## Post-purchase A/B test recommendations
1. **P1 subject line emoji vs no-emoji** — "Welcome to AtlasVoice Pro 🎙" vs "Welcome to AtlasVoice Pro"
2. **P3 timing — Day 5 vs Day 7** for the bulk-MP3 email
3. **P7 lifetime upgrade — yearly-credit vs flat 15% off** — which converts better

---

# SEQUENCE 3 — Monthly Newsletter Template

**Goal:** Maintain a regular cadence for the 3,193 list. Build a real engagement loop and click-through pattern (from 0.23% to 2%+).

**Trigger:** 1st Tuesday of every month, 9am Eastern.
**Audience:** Entire AtlasVoice list (suppress: in another active sequence; unsubscribed; recently emailed within 5 days).

## Template structure (~600 words / 4-minute read)

```
Subject: AtlasVoice {Month} Roundup — what's new in {Month}
Preview: New features, a tip you'll wish you knew sooner, and one reader's story.

Hi *|FNAME|fallback="there"|*,

Here's what's new in AtlasVoice this month:

📦 SHIPPED
{1-3 bullet points of newly-released features with linked changelog}

🎯 TIP OF THE MONTH
{1 actionable tip — e.g., "Did you know you can exclude WooCommerce product short descriptions from being read aloud? Add the CSS selector .woocommerce-product-details__short-description to the exclusion list."}

🎙 READER STORY
{1 short paragraph from a real user — solicited via email P5 from the post-purchase nurture}

🌍 IN THE COMMUNITY
{Optional: links to relevant new blog posts, industry news, ADA news}

🚀 COMING NEXT
{Public roadmap link + 1-2 highlights}

That's it for {month}. As always — reply if you want to chat or have feedback.

Cheers,
Azizul
Founder, AtlasAiDev

[Read all updates on our changelog →]
```

**Recommended cadence rules:**
- Always Tuesday 9am Eastern (best WordPress audience open time per industry data)
- Skip if no substantive update that month (don't pad)
- Cap length at 600 words

**Newsletter A/B tests:**
1. Send time: Tuesday 9am vs Wednesday 11am (alternate months)
2. Subject format: "AtlasVoice {Month} Roundup" vs "What's new in AtlasVoice — {Month}"

**Newsletter metrics:**
- Open rate target: 25%
- Click rate target: 3-5%
- Unsubscribe rate: < 0.5%
- Best-performing section: track via UTM tags in each link

---

## Mailchimp setup checklist (for all 3 sequences)

1. **Wire Mailchimp ↔ Freemius e-commerce attribution** — non-negotiable; without this, all metrics here are unmeasurable.
2. **Create Mailchimp tags**:
   - `winback-segment-a-bug` (715 contacts)
   - `winback-segment-b-features` (744)
   - `winback-segment-c-silent` (8,585)
   - `winback-segment-d-debug` (1,741)
   - `customer-pro-new` (post-purchase trigger)
   - `customer-pro-lifetime` (skip upgrade email)
3. **Create Freemius coupons** before scheduling sends:
   - `WELCOMEBACK25` (25% off, 14-day, yearly+lifetime)
   - `COMEBACK20` (20% off, 7-day, yearly only)
4. **Set up customer journey** for each sequence in Mailchimp Standard's Customer Journey Builder.
5. **Test sends** to a test list of 5 internal addresses before any external batch.
6. **First go-live**: Segment A (715 contacts) Week 2 of campaign plan. Monitor for 48 hours. If unsubscribe rate < 2%, proceed to Segment B and C.
7. **Suppression list maintenance**: any contact who unsubscribes goes to a permanent suppression list. Any contact who has a deliverability bounce gets paused.
8. **Post-purchase nurture** triggers automatically on every new Freemius webhook. Backfill the 175 existing Pro subs with the welcome email (P1 only) as a one-time send so they catch up.
9. **Monthly newsletter**: create the first send as a working template, schedule monthly send 1 month out, refresh content monthly.

---

## Expected aggregate impact (Day 90)

| Metric | Before | After |
|---|---|---|
| Active automations | 1 | 4 |
| Broadcasts sent | 3 ever | 11 ever (including monthly newsletters) |
| Mailchimp list size | 3,193 | 4,500 (net + win-back reactivations + lead-magnet captures) |
| Mailchimp open rate | 19.62% | 23-25% |
| Mailchimp click rate | 0.23% | 2-3% |
| Mailchimp order rate | 0% (broken) | tracked, even if low |
| Win-back reactivations | 0 | 250-375 (free reinstalls) |
| Win-back Pro conversions | 0 | 15-25 |
| New Pro subscriber retention at 30 days | unknown | tracked + improving |

---

Would you like me to:
- Draft the actual coupon-code creation Freemius API calls?
- Write more variations for the C1 silent-churn subject line?
- Build the lifetime-upgrade math sheet for email P7?
- Design a separate referral-program sequence for happy Pro subscribers?
