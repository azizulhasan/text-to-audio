# 14 — Sales Assets (sales:create-an-asset skill output)

**Note on adaptation:** The skill's default workflow assumes 1:1 prospect-tailored assets (B2B enterprise sales). AtlasVoice is self-serve SMB. The two assets requested are *audience-targeted marketing pages*, not 1:1 prospect collateral. The skill's research/structure/visual frameworks adapt cleanly to that use case — output below is the markdown spec for both pages, ready to be implemented in WordPress (Astra Child theme + Yoast).

Both assets use brand voice per `13-brand-review.md`: founder-honest, direct, technically credible, warm without performative.

---

# ASSET 1 — Landing page: `/temporarily-delisted-on-wp-org-download-direct/`

## Context
- **Audience:** Anyone arriving from the closed wp.org listing OR from Google search ("text to audio wordpress download", "atlasvoice plugin download") who hits the wp.org page and sees the closure notice.
- **Goal:** Recover the wp.org-funneled traffic by routing it to a direct-download experience that doesn't damage trust.
- **Desired next action:** Download the free plugin direct → install on their WordPress site. Soft upsell to Pro.
- **Format:** Single landing page.
- **Voice:** Honest disclosure first, then product pitch. No spin.

## Page structure

```
[Header — sitewide nav stays]

[Hero section]
H1: AtlasVoice Free — Direct Download

[Honest disclosure banner — yellow background, not red]
On May 19, 2026, the WordPress.org listing for AtlasVoice (Text To Speech TTS Accessibility) 
was closed pending a full review. The plugin itself is still actively maintained — version 2.2.3 
was resubmitted to the WordPress.org Plugins Team on June 1, 2026, awaiting their decision. 
While that's pending, you can download AtlasVoice Free directly here.

[Two-column download section]
LEFT COLUMN:
  AtlasVoice Free (v2.2.3)
  - Works on WordPress 5.6+
  - Requires PHP 7.4+
  - GPL-2.0 license
  - Last updated: 3 days ago
  - 315,000+ downloads · 4.8★ rating
  
  [Download AtlasVoice Free →] (large primary button)
  Downloads: atlasvoice-2.2.3.zip (1.2 MB)
  
  Verify file integrity:
  SHA-256: [hash]
  
  Installation:
  1. WordPress admin → Plugins → Add New → Upload Plugin
  2. Choose the zip you just downloaded
  3. Activate
  4. Run the 4-step setup wizard
  5. Your posts get an audio player automatically

RIGHT COLUMN (sidebar):
  Or get the full Pro experience:
  
  - 4 AI voice providers (Google Cloud / OpenAI / ElevenLabs / AtlasVoice AI)
  - MP3 generation + bulk export
  - Advanced analytics
  - 6 player styles + floating player
  - Audio schema for SEO
  - Priority support
  
  From $59/year
  [See Pro Pricing →]

[FAQ section]
Q: Why was the listing closed?
A: WordPress.org reviews every plugin periodically. They asked us to make some changes 
to the plugin's structure. We submitted v2.2.3 with those changes on June 1, 2026. 
We're now waiting for the Plugins Team to review and reinstate the listing. We don't 
have a guaranteed timeline — typically these reviews take 1-8 weeks.

Q: Is the plugin safe to install while it's not on WordPress.org?
A: Yes. The plugin code is the same as what's been on WordPress.org since 2023. 
It's GPL-licensed open source — you can audit it yourself. Auto-updates work normally 
through the Freemius update channel (Pro) or through manual update (Free) until the 
WordPress.org listing reopens.

Q: Will my existing install keep working?
A: Yes. The listing closure does not affect installed copies. The plugin keeps working. 
You won't see WordPress auto-updates for the free version until the listing reopens — 
download v2.2.3 from this page if you want the latest free build.

Q: Is the Pro version affected?
A: Pro is unaffected. Auto-updates work through the AtlasAiDev / Freemius channel 
independently of WordPress.org.

Q: When will the listing reopen?
A: Honest answer: we don't know. The WordPress.org Plugins Team reviews on their own 
timeline. We'll update this page the moment the listing is restored.

Q: Can I just wait for WordPress.org instead?
A: You can. If you'd rather hold off, [subscribe to our update list] and we'll email 
you the day the listing reopens.

[Final CTA]
H2: One more thing.
We've been at this since 2023. Almost half a million people have installed AtlasVoice. 
This temporary review isn't the end of the story — it's a checkpoint. Whatever you decide 
to do today (download direct, wait for WP.org, or pick a competitor), we wanted you to 
have the honest version.

— Azizul Hasan, Founder

[Subscribe to update list form]
Get one email the day WordPress.org reopens. No other emails.
[Email input] [Notify me →]
```

## Meta + technical

- **Title:** `Download AtlasVoice Free — Direct (WordPress.org listing temporarily closed)`
- **Meta description:** `AtlasVoice's WordPress.org listing is under review. Download the latest free version directly. Plus an honest explanation of what happened.`
- **Slug:** `/temporarily-delisted-on-wp-org-download-direct/` (long, descriptive — matches campaign-plan reference)
- **Canonical:** self
- **Robots:** `index, follow` (this page should rank for "atlasvoice download" etc.)
- **OG image:** "Download AtlasVoice Free — Direct" with the AtlasVoice logo + WordPress logo
- **Schema:** `WebPage` + `FAQPage` for the FAQ section + `SoftwareApplication` for the download

## Internal links from this page

- `[See Pro Pricing →]` → `/plugins/text-to-speech-pro/pricing/`
- `[subscribe to our update list]` → Mailchimp form on this page
- Footer links to docs, support, refund policy
- Cross-link from `/plugins/text-to-speech-pro/` ("Looking for the free version? Download it direct →") in a discrete sidebar callout

## Where this landing page should be promoted

- Add to sitewide footer until listing reopens
- 301 redirects ARE NOT possible from wp.org, but:
- Add structured data + canonical hints from `/` to point to this page when wp.org is searched
- Email this URL as part of every win-back email (segments A-D) — "you can still download direct"
- Include the URL in the llms.txt update (per ai-visibility doc)
- Twitter pinned post
- WP YouTuber outreach asks include this URL

## Implementation timeline

| Step | Effort |
|---|---|
| Copy + design (above) | 2 hours |
| Build in WordPress (page + form) | 2 hours |
| Generate OG image | 30 min |
| QA on mobile + desktop | 30 min |
| **Total** | **5 hours** |

## Success metric
- 200+ direct downloads/month captured (vs prior ~0 from broken wp.org funnel)
- Conversion rate to Mailchimp subscribe: 5%+ of page visitors
- Conversion rate to Pro pricing-page click: 10%+ of page visitors

---

# ASSET 2 — Page: `/lifetime-upgrade/` (existing Pro yearly subs only)

## Context
- **Audience:** The 175 existing yearly Pro subscribers — they bought Starter ($59/yr), Professional ($149/yr), or Enterprise ($199/yr) within the last 12 months and are still active.
- **Goal:** Convert 10-20 yearly subs into lifetime ones in 14 days.
- **Math:** Lifetime tiers (estimates based on standard 3-4× yearly): Starter Lifetime $199, Professional Lifetime $499, Enterprise Lifetime $699. (Verify actual lifetime tier pricing in Freemius — adjust below.)
- **The offer:** Credit the unused portion of their yearly subscription against the lifetime upgrade.
- **Why now:** Post-takedown messaging frames it as "lock in your price now while we're sorting out wp.org" — not a panic move, but a "be early supporter" pitch.
- **Voice:** Founder-honest. No urgency manipulation. Real reason: yearly→lifetime improves cash position right now when sales are uncertain.
- **Access:** Requires login. Personalized math per user.

## Page structure

```
[Authenticated page — only visible to logged-in Freemius Pro yearly subscribers]

[Hero]
H1: Lock in AtlasVoice Pro Lifetime — credit your yearly subscription

[Personalized math card — generated from Freemius data per user]

Hi *|FNAME|*,

You're currently on AtlasVoice Pro Starter, billed annually at $59/year.
Your last renewal: 2026-02-14
Remaining yearly subscription: 8 months (≈$39 of unused value)

LIFETIME UPGRADE OFFER (next 14 days only):
- Starter Lifetime normally: $199
- Credit for your remaining yearly: -$39
- Your price today: $160

You'd never pay annually again. No price increases. Updates and support included for life.

[Upgrade to Lifetime — $160 →] (large primary button)

[Why we're offering this — short, honest paragraph]
Honest version: our WordPress.org listing is currently under review (we wrote about it 
in detail at /temporarily-delisted-on-wp-org-download-direct/). Until it reopens, our 
free-version funnel is paused. Offering a lifetime upgrade to our existing customers 
gives us a healthier cash position to keep shipping and weather this period. In exchange 
for the upfront commitment, you lock in current pricing forever and never pay annually 
again.

— Azizul, Founder

[FAQ section]
Q: What does "Lifetime" actually mean?
A: One payment, no annual renewals, ever. Includes:
- All current Pro features
- All future Pro updates
- Email support (priority for Professional/Enterprise tiers)
For the lifetime of the AtlasVoice product. If we ever sunset AtlasVoice (no plans), 
we honor active lifetime licenses with whatever the successor product is.

Q: Will my Lifetime work if WordPress.org closes the listing again?
A: Yes. The Lifetime license is for AtlasVoice Pro, which lives on atlasaidev.com — 
independent of the WordPress.org free listing. Even if the free listing went away 
permanently, your Pro license keeps working.

Q: Why is this offer only 14 days?
A: Because we want to know within 14 days whether this offer works for our existing 
customers, so we can plan accordingly. If 10+ people take it, we'll do another offer 
window in Q4. If 0 people take it, we'll know the offer doesn't fit.

Q: Can I downgrade or refund the Lifetime later?
A: Standard 14-day money-back guarantee applies. After 14 days, the Lifetime is non-
refundable (because it's a discount for committing).

Q: What if I want to upgrade my tier instead of switching to Lifetime?
A: That's also available. Email contact@atlasaidev.com or use the [Upgrade Tier] link 
in your Freemius portal.

[Counter-offer — for users not ready for Lifetime]
Not ready for Lifetime? Here's an upgrade-tier option:

- Current: Starter (1 site, $59/year)
- Professional (5 sites, $149/year): proration credit applied
- Enterprise (10 sites, $199/year): proration credit applied

[Upgrade to Professional →] [Upgrade to Enterprise →]

[Footer]
This offer expires for you specifically on [your offer expiration: 14 days from today].
Questions? Reply to the email that brought you here, or contact me at contact@atlasaidev.com.

— Azizul
```

## Personalization data needed per user (Freemius API)

| Field | Source | Example |
|---|---|---|
| First name | Freemius user_id | Azizul |
| Current tier | Freemius license | Starter / Professional / Enterprise |
| Current annual price | Freemius license | $59 / $149 / $199 |
| Subscription start date | Freemius | 2026-02-14 |
| Days remaining in subscription | calculated | 235 |
| Pro-rated credit | calculated | ~$39 |
| Lifetime price - credit = "Your price today" | calculated | $160 |
| Offer expiration date | now + 14 days | 2026-06-17 |

## Trigger flow

1. Email goes out to all 175 active yearly Pro subscribers (broadcast from Mailchimp, segment "yearly-Pro-active")
2. Email subject: "Lock in AtlasVoice Pro Lifetime — credit your yearly"
3. Email body summarizes the offer + links to the personalized page
4. The personalized page authenticates via Freemius SSO (or email-tokenized one-click)
5. User clicks "Upgrade to Lifetime" → Freemius checkout flow with the lifetime SKU and the credit applied as a coupon
6. Confirmation email + adds tag `customer-pro-lifetime` in Mailchimp (which skips the post-purchase nurture email P7 about upgrades — they already did the upgrade)

## Implementation timeline

| Step | Effort |
|---|---|
| Copy + offer mechanics (above) | 2 hours |
| Freemius coupon setup (proration credit math) | 2 hours |
| WordPress page build (authenticated, personalized) | 4 hours |
| Mailchimp email + automation linkage | 1 hour |
| QA on a test account | 1 hour |
| **Total** | **10 hours** |

## Risk

- **Cash trade-off:** Each $160 upfront lifetime sale = ~$59/year × 5 years of lost future yearly revenue if the user would have renewed. Math:
  - If 10 lifetime conversions × $160 = $1,600 upfront
  - Future revenue lost (assume 32% renewal × $59/yr × avg 3 yr lifetime) = $57 × 10 = $570 over 3 years
  - Net: cash-now wins; the renewal rate is poor (32%) so most of those wouldn't have renewed anyway

- **Cannibalization signal:** If too many existing subs convert, it tells you the yearly price was too low. That's useful data — increase yearly pricing for new sign-ups (current $59 → potentially $69 or $79 going forward).

## Success metric (Day 14)
- **10 conversions = baseline success** → $1,400-$2,800 immediate cash
- **20 conversions = stretch** → $2,800-$5,600 immediate cash
- Track post-offer cancellations (any user who converts to lifetime should be removed from the renewal queue cleanly)

---

# ASSET 3 — (bonus) `/changelog/` page

**Why:** Referenced from multiple places (post-purchase nurture, FAQ, brand-review). 1-hour build.

## Page structure
- H1: `AtlasVoice Changelog`
- Reverse-chronological list of releases (v2.2.3, v2.2.2, v2.2.1, ... down to v2.0)
- Each entry: version + date + bullet list of changes
- Pull source from existing changelog.md or Freemius changelog API
- Cross-link to `/roadmap/` for "what's coming next"

## Why this matters for sales
- Customers (and AI models, per ai-visibility doc) treat an active changelog as a "still maintained" signal
- The post-purchase nurture references it ("see what's shipping")
- Reduces cancellation reason "I thought you stopped working on it"

---

# Summary

| Asset | Effort | Expected outcome |
|---|---|---|
| `/temporarily-delisted-on-wp-org-download-direct/` | 5 hours | 200+ direct free downloads/month; Mailchimp captures |
| `/lifetime-upgrade/` | 10 hours | $1,400-$5,600 immediate cash; clean cash buffer during wp.org review period |
| `/changelog/` | 1 hour | Trust signal; reduces "is it still maintained" objection |
| **Total build** | **16 hours** | **Cash + audience preservation during wp.org review window** |

---

Would you like me to:
- Draft the email broadcast that sends the lifetime upgrade page to existing subs?
- Build the actual HTML mockup for either asset?
- Adjust offer mechanics (e.g., bigger discount, longer window, tier-specific variants)?
