> **SUPERSEDED (2026-07-15):** merged into plan/growth/master-action-plan-2026-07.md - track status THERE. This file remains as reference/audit trail.

# AtlasVoice TTS â€” 2026 Q3 Action Plan

> **One plan. Read in 15 minutes. Execute over 90 days.**
> Detailed artifacts (email copy, schema code, outreach drafts, content briefs) live in `2026-06-tts-artifacts/` â€” only open them when ready to execute the matching action.
> **Live edits already shipped + items deferred:** see `2026-06-content-edits-log.md` (book-readers refresh, the any-device CTR title/meta rewrite, author bio/schema, and the deferred list).

**Prepared:** 2026-06-03 (data re-pulled live)
**Last status update:** 2026-06-03
**Scope:** AtlasVoice (TTS) only. AR / Smart Local AI / AI Agent Hub plans separate.
**Status of base plugin:** wp.org listing CLOSED since May 19, 2026. v2.2.3 resubmitted June 1. **Expected to reopen within days.** Planning assumes reopen, but every action is designed to survive a future closure.

## Status legend

| Symbol | Meaning |
|---|---|
| â¬œ **TODO** | Not started |
| ðŸŸ¨ **PARTIAL** | Partially complete â€” exists but needs update or finishing |
| âœ… **DONE** | Completed; no further action needed unless re-tested |
| ðŸ” **RECURRING** | Ongoing cadence; repeats on schedule |
| ðŸš« **BLOCKED** | Cannot start until a prerequisite task completes |
| ðŸ¤” **DECISION** | Needs founder decision before execution |
| ðŸ”„ **REOPEN-TRIGGERED** | Fires when wp.org listing reopens (or stays unblocked otherwise) |

**Update cadence:** review and refresh status weekly. Reset blocked items when prerequisites complete.

---

## Part 1 â€” The situation in 60 seconds

**Where things stand:**
- May 19, 2026 â€” WordPress.org closed the AtlasVoice (Text To Speech TTS Accessibility) listing pending review. v2.2.3 resubmitted June 1 and **expected to reopen within days**.
- May 2026 gross dropped 40% ($3,482 â†’ $2,079); June MTD = **$0 gross, -$111 net** (only refunds).
- WordPress.org referral was 10.4% of all sessions over 24 months. That channel will return when the listing reopens.

**What we still have:**
- **$907 MRR** from **175 active Pro subscriptions** â€” the runway
- **315,000+ historic free downloads, 4.8â˜… from 83 reviews, 4,000+ active sites** â€” the brand asset
- **Brand "AtlasVoice" ranks #1-3 for branded queries**, "Text to Speech Pro" ranks #4.9 with 254 clicks / 2,549 impressions over 16 months â€” branded consolidation worked
- **Conversion pages are excellent** â€” `/plugins/text-to-speech-pro/` does 3.09% CTR from organic, pricing page is structured well
- **Mailchimp list of 3,193 contacts** + **12,475 ex-users in the tracker DB** (Segments A/B/C/D analyzed in March, never emailed)

**The three facts that dictate everything:**
1. The closure happened once. It can happen again. **Build channel diversity now as permanent insurance** â€” don't slow it down when wp.org reopens.
2. MRR $907 buys ~6-12 months of runway given strong yearly renewals.
3. Top of funnel is broken right now. Bottom of funnel works. The plan is to fix the top, then keep it diversified.

**Strategy in one sentence:**
> Treat the wp.org reopen as a re-amplifier, not as a return-to-normal. Continue building paid + content + partner + retained-user channels so wp.org is one of five working channels â€” not the only one.

---

## Part 2 â€” Scorecard against prior plans (March audit)

| Goal | Status |
|---|---|
| Rebuild pricing + product pages (table, social proof, FAQ, money-back) | âœ… **DONE** â€” well executed |
| Brand consolidation to "AtlasVoice" | âœ… **DONE** â€” now a real SEO asset |
| Email system (Mailchimp + 3K list + automation) | ðŸŸ¨ **PARTIAL** â€” only 1 automation, 0.23% click rate (10Ã— below industry), 0% order attribution (broken) |
| Onboarding wizard + abandon-rate fixes | âœ… **DONE** â€” code shipped; no live measurement yet |
| Content blitz (24 posts) | ðŸŸ¨ **PARTIAL** â€” 29 posts shipped, then dead air since April 7 (8 weeks) |
| Traffic recovery to 5,000/mo | âŒ **MISS** â€” still at ~550/mo |
| Win-back to 12,475 ex-users | âŒ **NEVER SENT** â€” biggest missed opportunity |
| 150+ wp.org reviews | ðŸŸ¨ **PARTIAL â€” UNBLOCKING SOON** â€” stuck at 83; review solicitation possible once listing reopens |
| Demo video on `/demo/` | ðŸŸ¨ **PARTIAL** â€” Playground works, no video |
| WP.org listing | ðŸŸ¨ **PARTIAL â€” REOPENING SOON** â€” closed May 19, v2.2.3 resubmitted, awaiting Plugins Team decision |

**Translation:** the bottom of the funnel got fixed. The top of the funnel didn't. The takedown temporarily removed the top entirely. When wp.org reopens, the top returns â€” but we don't trust a single channel anymore.

---

## Part 3 â€” 90-day execution plan

### MONTH 1 â€” Stop the bleed + prepare for reopen (Weeks 1-4)

**Goal:** Hold MRR. Reactivate ex-users. Surface lifetime upgrades. Fix the SEO defects bleeding CTR. Resume content cadence. **Prepare every reopen-triggered action so they fire the day the wp.org listing comes back.**

#### Week 1

**1. â¬œ TODO â€” Wire Mailchimp â†” Freemius e-commerce attribution.** Non-negotiable prerequisite. Without it, every email decision is blind (Mailchimp shows 0% order rate today even though Freemius has revenue). Use Mailchimp e-commerce API + Freemius webhook on every purchase. â€” *~3 hours dev*

**2. â¬œ TODO â€” Send the existing-subscriber lifetime upgrade email + page.** 175 yearly Pro subs get a personalized offer: credit unused yearly subscription against lifetime license. 14-day expiration. Frame the offer around the channel-diversification narrative (not the closure crisis), so it still makes sense after reopen. Full landing page spec + email copy in `2026-06-tts-artifacts/sales-assets.md` (Asset 2). Target: 10-20 conversions = **$1,400-$5,600 immediate cash**. â€” *10 hours total*

**3. ðŸŸ¨ PARTIAL â€” Ship the 7 P0 on-page SEO defects** (5 hours total) â€” *in progress 2026-06-03*:
   - âœ… **DONE 2026-06-03** â€” `/demo/` now has H1 "Try AtlasVoice Pro Live â€” 4 AI Voice Providers" (added heading block; verified live). `/blog/` heading changed from `<h2>` "Empowering Accessibility" to `<h1>` "WordPress Text-to-Speech & Accessibility Blog" (UAGB headingTag â†’ h1; verified via MCP + live).
   - âœ… **DONE 2026-06-03** â€” Set Yoast **site-wide default OG image** (Site basics â†’ Site image) to the brand hero illustration. Fixes product, pricing, demo + every other bare page in one action (all verified live). INTERIM: image is 600Ã—338; replace with purpose-built 1200Ã—630 per-page images when designed (they'll override the default).
   - ðŸŸ¨ Alt text â€” PARTIAL. âœ… Homepage story image (core block) alt fixed + verified live; media-library alt set via MCP for homepage hero/story/contact. **Finding:** Spectra/UAGB image blocks don't emit media-library alt to rendered HTML and have no block alt field (reselect didn't work); only **core** image blocks are reliably fixable. AI-vision alt tool returns empty (no provider configured) â€” alts hand-written. Remaining core-block images (e.g. book-readers article) still fixable; UAGB marketing-page illustrations need a Spectra setting/custom code.
   - âœ… **DONE 2026-06-03** â€” Product page meta description trimmed 198 â†’ 154 chars (verified live): "AtlasVoice Text to Speech Pro is the most complete WordPress TTS plugin. 4 AI voice providers, MP3 downloads, audio schema SEO. 4,000+ sites. From $59/yr."
   - âœ… **DONE 2026-06-03** â€” Verified TTS product + pricing pages ALREADY agree: `315,000+ downloads Â· 4,000+ active sites Â· 4.8â˜… Â· 4 providers`. No change needed. Homepage "2,000+" stays company-level per scope. **OPEN (founder decision):** homepage company-wide claim "2,000+ websites" is lower than the TTS plugin's own "4,000+" â€” consider raising the homepage company figure for consistency (needs a defensible company-wide number).
   - âœ… **DONE 2026-06-03** â€” Homepage H1 rewritten to `AI-Powered WordPress Plugins for Voice, AR & Automation` (company-level, verified in DB). *Correction: homepage = company umbrella page, NOT the TTS product page â€” TTS-specific positioning belongs on `/plugins/text-to-speech-pro/`.*

**4. â¬œ TODO â€” Build the `/temporarily-delisted-on-wp-org-download-direct/` landing page as a *temporary* asset.** Anyone arriving from the closed wp.org listing in the gap days needs somewhere to go. Honest disclosure + direct download + soft Pro upsell. Built with reopen in mind â€” once wp.org is live, this page (a) becomes a redirect to `/plugins/` AND (b) keeps a "what happened in May 2026" footer link for transparency. Full page copy in `2026-06-tts-artifacts/sales-assets.md` (Asset 1). â€” *5 hours*

**5. ðŸŸ¨ PARTIAL â€” Update `llms.txt`** with the current closure status, the 4-engine positioning, and the updated free-vs-Pro feature matrix. File exists (last updated 2025-11-28). After reopen, refresh again (see action #34). â€” *1 hour now, +30 min after reopen*

#### Week 2

**6. â¬œ TODO â€” Send Win-back Segment A (715 bug reporters).** Email A1 from `2026-06-tts-artifacts/email-sequences.md`. Subject: "We fixed the issues you reported in AtlasVoice." Includes 25% off coupon `WELCOMEBACK25` (set up in Freemius first). Target: 14-20 reactivations. *Depends on #1.* Update CTA: if wp.org listing is live by send time, link to wp.org install; if not, link to the temporary download page. â€” *2 hours*

**7. âœ… DONE (2026-06-04) â€” Resume blog publishing.** Both top pages refreshed & live:
   - âœ… REFRESH `/best-text-to-speech-book-readers/` â€” replaced the intro with a tight 2-paragraph 2026 AI-voice lead (modified-date bumped); body converted to native blocks; added a 9-tool comparison table **with pricing**; fixed meta description; repaired focus keyphrase. *Audio samples still pending (founder to add â€” AI/image-audio generator not connected).*
   - âœ… REFRESH `/how-to-use-text-to-speech-on-any-device/` â€” rewrote SEO title â†’ `How to Use Text-to-Speech on iPhone, Android & PC (2026)` and meta to name the actual devices/apps (CTR play). *Monitor CTR in GSC over 2â€“4 weeks.*
   â€” *Done. Full record + pending image/audio follow-ups in `2026-06-content-edits-log.md`.*

**8. â¬œ TODO â€” Launch paid search** on branded + competitor brand keywords ($5/day = $150/mo). Targets: "atlasvoice", "atlasvoice pro", "speechify alternative" (you already rank #1 but get zero clicks â€” investigate why), "gspeech alternative", "trinity audio alternative". â€” *2 hours setup*

#### Week 3

**9. âŒ DO NOT EMAIL â€” Win-back Segment B (744 feature seekers).** **Founder decision (2026-06-04): do NOT send any email to this segment.** These are paid users who either unsubscribed from the list or stopped auto-pay. Emailing unsubscribed contacts is non-compliant (CAN-SPAM / GDPR) and Mailchimp suppresses them anyway, so the B1 marketing send is **dropped**. **Reach them via non-email channels instead:** (a) an **in-plugin admin notice** on their site highlighting the new features + a reactivation offer, and (b) **Freemius transactional license-expiry / renewal emails** (transactional, not marketing â†’ permitted). â€” *N/A (no email)*

**10. âœ… DONE (2026-06-04) â€” Published two new posts** (live):
   - âœ… **"Best Free Text-to-Speech Tools 2026 (Tested & Compared)"** â€” `/best-free-text-to-speech-tools-2026/` (ID 4723). ~2,100 words, at-a-glance comparison table, 6-question FAQ **converted to a Yoast FAQ block â†’ `FAQPage` schema confirmed live**, 12 internal + 7 nofollow links, honest disclosure, SEO title/meta/keyphrase set (Yoast green).
   - âœ… **"How to Set Up Google Cloud Text-to-Speech in WordPress"** â€” `/how-to-set-up-google-cloud-tts-wordpress/` (ID 4725). ~980-word step-by-step tutorial + troubleshooting + FAQ; technically accurate to AtlasVoice Pro (service-account JSON); SEO set; interlinked with 4723 + the cluster.
   - *Pending: featured images on both (site's AI image generator returns "check AI provider credentials" â€” not connected). Details in `2026-06-content-edits-log.md`.*

#### Week 4

**11. âœ… DONE (2026-06-05) â€” Published two more posts + closed the ElevenLabs AI-visibility gap (#23).** Drafts/specs in `2026-06-tts-artifacts/post-drafts-elevenlabs-and-bestfree-refresh.md`. ElevenLabs steps verified against the Pro plugin (Player ID 6, API-key flow, cached MP3s).
   - **NEW â€” "ElevenLabs WordPress Integration: Complete Setup Guide (2026)"** â†’ post **ID 4739**, slug `elevenlabs-wordpress-integration`, status **PUBLISHED**. ~1,430 words, 3 methods (AtlasVoice Pro step-by-step + Audio Native + direct API), comparison table, troubleshooting, FAQ. **searchfit on-page applied** (keyphrase `elevenlabs wordpress` 0â†’2 in body + title/H1; 4 cluster internal links; nofollow external). **FAQ converted to a Yoast FAQ block â†’ FAQPage schema live (5 questions).** Author 2, category 35.
   - **REFRESH â€” `/best-free-text-to-speech-ai/`** (ID 3231): **searchfit + freshness applied & verified live** â€” added an at-a-glance comparison table (none before; AtlasVoice #1); **fixed the stale #1 entry** (was "300 voices from Google & ChatGPT" â†’ now the **4 providers incl. ElevenLabs**) + link to the new guide; Pro links 1â†’3 (per `internal-linking.md`); ElevenLabs mentions 3â†’8; FAQPage already present; modified date bumped. (Optional residual: trim 3231 meta description 167â†’~155 chars.)
   - **Featured images (WebP) added to the latest 4 posts** (resolves the earlier featured-image gap noted in #10 / content-edits-log): 4739 ElevenLabs, 4725 Google Cloud TTS, 4723 Best Free TTS 2026, 4191 Amazon Polly vs AtlasVoice. Each set as featured image + **alt text**, og:image refreshed (re-saved to rebuild Yoast social data + cleared WP Fastest Cache), all verified live. WebP = smaller/faster (Core Web Vitals).

**12. â¬œ TODO â€” Send Monthly Newsletter #1** to all 3,193 contacts. First regular cadence ever. Template in `email-sequences.md` Sequence 3. â€” *2 hours*

**13. âœ… DONE (2026-06-04, verified) â€” `AggregateRating` + `Review` schema already live on product + pricing pages.** Diagnostic + Google Rich Results Test confirmed it's already deployed, valid, and eligible â€” no addition needed (adding the artifact block would have created a 3rd duplicate).
   - **Product page** (`/plugins/text-to-speech-pro/`): Rich Results Test â†’ **18 valid items, 0 errors**. Detected: Review snippets Ã—13, Software apps Ã—2, Product, Merchant listings, Breadcrumbs.
   - **Pricing page** (`/plugins/text-to-speech-pro/pricing/`): â†’ **19 valid items, 0 errors**. Same as above + FAQ.
   - Rating (**4.8/5, 83 Reviews**) is **visibly displayed** on both pages â†’ compliant with Google's "markup must match visible content" rule.
   - **Two non-blocking polish items (NOT errors):** (a) "Software apps: 2 valid" confirms a **duplicate `SoftwareApplication`/`Product`** pair on both pages (artifact Â§6 dedup â€” would need Yoast/theme inspection; deferred, awaiting go-ahead); (b) Merchant listings shows "Non-critical issues" = missing *recommended* fields (return/shipping), harmless for a software product.
   - **Original goal (unlock star-rating SERP rich results, +15-25% CTR over 4-6 weeks): met** â€” schema is eligible; monitor in GSC.

**14. ðŸ”„ REOPEN-TRIGGERED â€” Solicit wp.org reviews** from existing 175 active Pro subs via a dedicated email. Goal: 83 â†’ 130+ reviews to close the gap with GSpeech (currently 167). **Fires the day wp.org listing reopens.** Pre-write the email this week so it's ready to send the moment the listing is live. â€” *2 hours prep + 1 hour to send*

---

### MONTH 2 â€” Open new channels (Weeks 5-8)

**Goal:** Move from 1 acquisition channel (organic) to 5+. Start partner outreach. Launch the email engine fully. Maintain the wp.org channel without becoming dependent on it.

**15. â¬œ TODO â€” Launch Post-Purchase Nurture automation** (7 emails over 30 days) in Mailchimp. Backfill the 175 existing Pro subs with Email P1. Full email drafts in `email-sequences.md` Sequence 2. *Depends on #1.* â€” *4 hours*

**16. âŒ DO NOT EMAIL â€” Win-back Segment C (8,585 silent churn).** Founder decision (2026-06-04): do **not** send any marketing email to this segment.
   - **Why:** These addresses are `admin_email` values harvested from the plugin's uninstall-feedback table (`wpxr_plugin_tracking_uninstall_reason`, filter `reason_id = none/no-comment/other`) â€” they are **not marketing opt-ins**. Emailing them is unsolicited commercial email: GDPR-noncompliant for EU users (no lawful basis) and high-risk under CAN-SPAM. The business-analytics report's own rule applies: *"Only email users who opted in to communications."*
   - **Also:** lowest-signal segment (gave no actionable reason), and blasting 8,585 stale (up to 18-month-old), never-opted-in addresses would spike bounces/spam complaints and damage sender reputation â€” hurting deliverability to the contacts that matter (175 Pro subs, post-purchase nurture, newsletter).
   - **Verification note:** consent can't be checked via HubSpot/Klaviyo (data isn't there); it lives only in the WP DB + Mailchimp. Not needed â€” the feedback-table source already establishes no opt-in.
   - **Reach these users instead via:** organic re-discovery on wp.org (post-reopen) + the onboarding-wizard fix (analytics report Decision 3) to *prevent* this churn going forward. Email copy in `email-sequences.md` is retained for reference only â€” not to be sent.

**17. â¬œ TODO â€” Send 5 WordPress YouTuber outreach emails.** Personalized drafts ready for Adam Preiser (WPCrafter), Syed Balkhi (WPBeginner), Maxime Tetreault (WPTuts), Imran Siddiq (WebSquadron), Mark Zahra (WP Mayor). Offer: free lifetime Pro license + custom 90-second demo asset. Full email copy in `2026-06-tts-artifacts/outreach-emails.md`. Update each "personal hook" line to reference their last 30 days of content before sending. Once wp.org reopens, soften the closure language in each pitch (still mention as context, not as crisis). â€” *3 hours research + send*

**18. â¬œ TODO â€” Send 3 editorial pitches** to WP Tavern, Kinsta blog, WPMU DEV. Pitch angle (now stronger with reopen): "What WordPress plugin closures look like from the developer side â€” and how we came out the other side." Drafts in `outreach-emails.md`. **AI-visibility note (#23 baseline):** these neutral outlets are exactly the sources Perplexity & Claude cite on discovery prompts instead of us â€” each placement directly improves AI mention rate, not just referral traffic. â€” *2 hours*

**18a. ðŸ”„ IN PROGRESS â€” Small-budget promotion: guest posts + YouTube/video collabs on small-but-high-potential WP platforms.** Pattern = the LearnWoo blog + WPGlob video already done. Full target list (tiers, fit, contacts, pitch angles) in `2026-06-tts-artifacts/promotion-outreach-targets-2026-06.md`. **WPGlob price menu (confirmed):** guest post $150, "Best TTS plugin" listicle placement $100, comparison article $250 / video $500, Starter Review pkg $350. **Recommended first moves (~$250â€“350):** (a) WPGlob "Best Text-to-Speech plugin" listicle $100; (b) "AtlasVoice vs GSpeech" comparison $150â€“250 (counters the competitor Claude recommends); (c) free editorial pitches to WP Builds (accessibility angle) + WordPress Plugins A-to-Z (review/interview) â€” **drafts ready in `2026-06-tts-artifacts/outreach-wpbuilds-pluginsatoz.md`** (founder personalizes the [HOOK] line + sends). Each placement = independent third-party citation â†’ directly feeds #19/#23 AI visibility. **Founder confirms spend/orders.**

**18b. â„¹ï¸ Paid ads question â€” answered (2026-06-05).** Google **Merchant/Shopping ads are NOT the right first paid test for software** (only Approved products can run â€” 3 are "Not approved", AtlasVoice "Limited"; subscription Shopping ads also require the product TITLE to include "(1-year subscription)" + yearly term + shipping $0). Better small-budget paid options: a WPGlob/LearnWoo review (durable, citable) or a tiny Google **Search** Ads test ($5â€“10/day) on high-intent keywords ("wordpress text to speech plugin", "elevenlabs wordpress"). Revisit Shopping later only after products approved + titles reformatted. Details in the promotion-targets artifact. *(I can configure a campaign; founder enters billing + launches.)*

**19. ðŸ”„ IN PROGRESS â€” â­ TOP AI-VISIBILITY LEVER â€” Submit AtlasVoice to G2, Capterra, AlternativeTo, Freemius Store discovery + earn reviews.** Free directory listings cited heavily by AI assistants. **Elevated to #1 priority by the #23 baseline:** Claude (research mode) *actively discounts* AtlasVoice's own comparison pages ("self-comparison, not independent") and the "315k downloads" marketing claim â€” only **independent** third-party signals (directory listings + genuine reviews) will move the skeptical engines. Solicit 5-10 G2 reviews from existing 175 Pro subs. â€” *2 hours total + ongoing review solicitation*
   - **âœ… AlternativeTo pack ready (2026-06-05):** copy-paste listing content in `2026-06-tts-artifacts/listing-alternativeto-atlasvoice.md` â€” name/tagline/descriptions, platforms, feature tags, the 8 "alternative to" mappings (GSpeech, BeyondWords, ResponsiveVoice, Speechify, NaturalReader, Play.ht, Murf, Amazon Polly), screenshot shot-list + step-by-step submit guide. Account created + logged in (`atlasaidev`); confirmed no duplicate exists; form sections match the pack.
   - **â›” AlternativeTo blocked until 2026-06-12:** new-app submissions require **account age â‰¥ 7 days** (account made 2026-06-05). Unlock = **June 12, 2026, ~7:09 AM ET**. â° **Come back then and paste the pack** (founder clicks Submit). Meanwhile, do the no-wait channels (Capterra / review email).
   - **âš ï¸ Constraint baked in:** wp.org listing is **closed (since 2026-05-19, pending review)** â†’ listing points to `atlasaidev.com/text-to-speech-pro/` as official site, not wp.org; "315k downloads" claim dropped (use 85 wp.org reviews as the verifiable signal instead).
   - **âœ… Capterra/G2 pack ready (2026-06-05):** `2026-06-tts-artifacts/listing-capterra-g2-atlasvoice.md`. **KEY: Capterra is now G2 Digital Markets** â€” the one "Get Listed" flow (`app.g2digitalmarkets.com/get-listed/start`) covers **G2 + Capterra + GetApp + Software Advice** in a single submission, and reviews flow to all four. So this collapses the old separate "G2" + "Capterra" sub-tasks into ONE pass. Pack maps features to Capterra's exact taxonomy (AI Voices, API, Multi-Language/Voice, Custom Voices, SSML, Phonetic Variation Detection = our pronunciation aliases), category = **Text-To-Speech Software**, full pricing tiers. **Founder to create vendor account (use @atlasaidev.com email for faster verification) + submit.**
   - **ðŸ”„ AtlasVoice SUBMITTED to G2 Digital Markets (2026-06-05) â€” "under review", 1â€“2 business days, then publishes to Capterra (+G2/GetApp/Software Advice).** Founder created the vendor account; I filled the Target market step (industries: IT & Services, Marketing & Advertising, Publishing, E-Learning; company size & users: 1 / 2-10 / 11-50 / 51-200). Pricing was AI-auto-fetched and came in messy (6 plans incl. a fake "Most Popular" + lifetime tiers mislabeled, no Free tier) â€” founder handled final pricing; chosen layout = **Free + 3 annual tiers**, lifetime noted in descriptions. âš ï¸ A stray click triggered final submit before cleanup was confirmed â€” verify the live listing's pricing once approved.
   - **â›” Other 3 plugins (AtlasAI, AtlasML, AtlasAR) blocked:** the free Get-Listed funnel is ONE product per request and the session locks to the pending submission. **Add them from the vendor portal AFTER AtlasVoice is approved** (portal "Add another product" unlocks then). Waiting on the 1â€“2 day approval email.
   - **Strategic note (flagged to founder):** 1 listing with 5â€“10 reviews >> 4 zero-review listings. Concentrate the review push on AtlasVoice first; add the other 3 once reviewers exist to point at each.
   - **Next:** review-request email to the ~175 Pro subs (the real lever â€” a 0-review listing won't get cited; reviews now boost all 4 G2DM properties at once). Then on 2026-06-12, submit AlternativeTo; and add the other 3 plugins once the G2DM portal unlocks.

**20. â¬œ TODO â€” Publish two more posts:**
   - **"Most Realistic TTS Voices 2026 (with embedded audio samples)"** â€” flagship content. Only AtlasVoice can produce this because we have access to all 4 providers. â€” *1 day*
   - **REFRESH `/what-is-text-to-speech-accommodation/`** â€” currently 253 clicks from 43K impressions = 0.58% CTR. Title rewrite + FAQPage schema. â€” *2 hours*

**21. â¬œ TODO â€” Ship the 23 internal-link injections** mapped in `2026-06-tts-artifacts/internal-linking.md` â€” contextual links from blog posts to the product page, plus lateral cluster cohesion. Route equity to the conversion page. â€” *3 hours*

**22. â¬œ TODO â€” Investigate the "ranks #1 for 'speechify alternative' but zero clicks" anomaly.** Open GSC URL Inspection on the matching page; inspect the SERP; decide whether to enrich the snippet or accept it as zero-click branded awareness. â€” *30 min*

#### Week 8 wrap-up

**23. âœ… DONE (2026-06-04) â€” AI-visibility baseline run.** Full results + permalinks in `2026-06-tts-artifacts/ai-visibility-baseline-2026-06-04.md`. Ran the 15 prompts across **Perplexity (15), ChatGPT (15 personalized + 15 neutral), Gemini (15 anonymous)** + Claude.ai (behavioral characterization). **Headline findings:**
   - **Neutral mention rate:** Perplexity 47%, ChatGPT-neutral 43%, **Gemini 60% (most favorable)**, Claude (most skeptical â€” recommends GSpeech, discounts AtlasVoice's self-published content + "315k downloads" marketing claim). **GSpeech wins discovery prompts for a neutral user; AtlasVoice surfaces mainly on branded + free-listing + head-to-head-comparison prompts.**
   - **âš ï¸ Personalization caveat:** ChatGPT logged-in as the founder account is biased (ranks AtlasVoice #1 because it knows it's ours â†’ 80%); the *neutral* number (43%) is the real baseline.
   - **3 systemic gaps:** (1) ðŸ”´ third-party authority (Claude/Perplexity discount self-published content â†’ action #19 G2/Capterra/reviews is the top lever); (2) ðŸ”´ brand-name fragmentation across "AtlasVoice / Text to Audio / Text To Speech TTS Accessibility / TTSWP"; (3) ðŸŸ  use-case content gap (ElevenLabs/Google-Cloud/EPUB prompts surface 0 â€” new posts 4723/4725/3497 too fresh, recheck Day 30/60).
   - **Pricing:** $59/$149/$199 confirmed on ChatGPT + Gemini + schema artifact; **Perplexity stale** ($59/$99/$149) â€” fix the source page.
   - **Recheck 2026-07-04 / 2026-08-04.** Manual UI runs are slow + flaky (ChatGPT Temporary Chat & Gemini toggle); consider SearchFit.ai to automate daily. *(Claude full 15 deferred â€” incognito per-prompt carryover + ~50s research responses; behavior already conclusively characterized.)*

#### Follow-ups surfaced by the #23 baseline (do alongside #19)

**23a. â¬œ TODO â€” ðŸ”´ Consolidate the brand name across the web.** The engines split AtlasVoice into up to **four entities** â€” "AtlasVoice", "Text to Audio", "Text To Speech TTS Accessibility", "TTSWP" â€” and Gemini/ChatGPT sometimes list two as *separate plugins*, diluting every authority signal. Standardize one primary name + consistent secondary ("AtlasVoice â€” Text to Audio") in the **wp.org listing title, llms.txt, product/pricing pages, and directory listings (#19)** so signal accrues to one entity. â€” *2 hours*

**23b. â¬œ TODO â€” Refresh `llms.txt`** (last updated 2025-11-28, per ai-visibility audit). Add: wp.org closure/review status, the 4-provider list (AtlasVoice AI, Google Cloud, OpenAI, ElevenLabs), accessibility positioning, and a 200-word "What is AtlasVoice?" canonical answer designed to be quoted verbatim. Helps the engines that parse it (esp. Gemini, the friendliest). â€” *1 hour*

**23c. â¬œ TODO â€” Fix the stale pricing source Perplexity scraped.** Perplexity reports **$59/$99/$149**; the correct, live tiers (re-confirmed 2026-06-05 from `atlasaidev.com/text-to-speech-pro/`) are **annual $59 / $149 / $199** (Starter/Professional/Enterprise) with **lifetime $199 / $249 / $299**, 14-day money-back. Find and correct the page/source feeding the wrong numbers so AI answers quote accurate pricing. â€” *30 min*

**23d. â¬œ TODO â€” Close the use-case content gap (0% AI hits).** "ElevenLabs in WordPress", "cheapest Google Cloud TTS", and "EPUB/book audio" surface **zero AtlasVoice** on every engine. Posts 4723/4725/3497 already target these but are too fresh to be indexed â€” this is covered by **#28** (EPUB/Kindle + Elementor/Divi clusters); prioritize the ElevenLabs-in-WP and Google-Cloud-TTS angles there, then confirm they surface at the Day 30/60 recheck. â€” *(folds into #28)*

**23e. âœ… DONE (2026-06-05) â€” Google Search Console page-indexing audit + fixes.** Checked GSC Pages report: **116 indexed / 101 not-indexed (7 reasons)**. Diagnosis: the 101 are **not lost content** â€” they're RSS `/feed/` URLs, `?utm/?referrer/?srsltid` param-duplicates, `/wp-login.php`, `/wp-json/`, category pagination, an injected SEO-spam `/search/` URL, and the `/docs/` knowledge base (~38 pages); the 10 "noindex" are all intentional (admin/login/internal-search/author). **All real posts/pages are indexed.** Fixes applied:
   - **Requested indexing** (priority crawl queue) for the 3 new posts (4739, 4725, 4723) â€” they were "unknown to Google" only because published *after* the sitemap's last read (29 May).
   - **Re-submitted `sitemap_index.xml`** (forced fresh read); confirmed all 3 new posts are in `post-sitemap.xml`.
   - **robots.txt cleanup** (live) â€” added `Disallow:` for `/wp-login.php`, `/search/`, `/*?s=`, `/*?utm_source=`, `/*?referrer=`, `/*?srsltid=` to stop crawl-budget waste (incl. the SAP-exam-dump search spam); AI-crawler allow-block + Sitemap line left intact.
   - **Docs push:** requested indexing for the ElevenLabs + Google Cloud integration docs, and added internal links to them from posts 4739 & 4725 (durable crawl paths). Remaining docs covered by the sitemap + freed crawl budget.
   - **Expect:** new posts indexed within days; "not indexed" count should shrink as Google stops re-crawling the now-blocked junk URLs. **Recheck GSC at Day 30/60.**

**23f. â„¹ï¸ Google Analytics (GA4) â€” reviewed 2026-06-05, no urgent action.** Property `a263900082p373289847` is healthy: data flowing (531 users / 4.1k events / 28d), Search Console linked (Queries + organic reports), Business Objectives configured. Only improvement = conversion/revenue tracking for Pro sales & leads â†’ that's the Freemiusâ†”analytics attribution wiring (**action #1**, dev task), not a GA4-UI change.

**23g. âœ… DONE (2026-06-05) â€” Google Merchant Center (acct 5075034887): listed all 4 products + set up free shipping to clear "Limited".**
   - **(a) Added the 3 missing products** (the AtlasVoice product was already listed). All entered via "Add products one by one", brand `AtlasAiDev`, Condition New, "I don't have a GTIN" checked (required for software), image-by-URL, USD:
     - **AtlasAI â€“ AI Agent Hub & MCP Server for WordPress (WooCommerce Compatible)** â€” $49 â€” `/ai-agent-hub-pro/` â€” image `https://ps.w.org/ai-workflow-automation-ai-agent-hub/assets/banner-772x250.jpg`.
     - **AtlasML â€“ Browser-Based Private AI for WordPress** â€” $99.99 â€” `/smart-local-ai-pro/` â€” image `https://ps.w.org/smart-local-ai/assets/icon-256x256.png`.
     - **AtlasAR â€“ 3D Model Viewer & AR Try-On for WordPress** â€” $49.99 â€” `/plugins/3d-model-viewer-wordpress-plugin/` â€” image `https://atlasaidev.com/wp-content/uploads/2025/11/6bb98438-ef35-4675-bb5e-64adede9d204.webp`.
     - *Image blocker resolved by using wp.org static asset URLs (the wp.org icons that are animated .gif have static .png/.jpg variants) + AtlasAR's real og:image webp.*
   - **(b) Fixed "Limited" cause â€” created a free ($0) shipping policy.** A prior policy covered **Bangladesh only**; the "remaining countries" warning (US, UK, Germany, India, +90 more) was the trigger. New policy "Shipping Policy 16 41": **All products, all 93 countries, Free shipping, 0â€“1 business days.** (South Korea auto-excluded â€” requires KRW currency; not worth a separate policy for USD-priced software.)
   - **Status note (2026-06-05):** newly added products start as **"Not approved" / pending** while Google crawls â€” expect them to move to Approved/Limited over the next hoursâ€“days. Residual "Limited" reasons that remain are **structural for digital/SaaS** (Russia legal block, S.Korea biz-reg-number) and not worth chasing.
   - **Strategic note:** Merchant Center is a **weak channel for software**. The high-ROI "free listings" for a plugin are **G2 / Capterra / AlternativeTo (action #19)** â€” prioritize those.

**24. ðŸ” RECURRING â€” Send Monthly Newsletter #2.** First Monday of each month, 9am Eastern. Template in `email-sequences.md`. *Depends on #12 being live.*

---

### MONTH 3 â€” Lock and stabilize (Weeks 9-12)

**Goal:** Build the moat. Stabilize cadences. Lock the diversified-channel mix.

**25. â¬œ TODO â€” Ship the 90-second demo video** on `/demo/`. Script in `plan/growth/product-demo-video-and-interactive-demo.md`. Generate ElevenLabs narration via your own plugin (meta-marketing). Add `VideoObject` schema (block in `schema-markup.md`). â€” *1 day*

**26. â¬œ TODO â€” Embed WordPress Playground demo explicitly** on `/demo/`. Currently passive Playground referral delivers 684 sessions / 408 users over 24 months without explicit promotion. Embed should 2-3Ã— it. â€” *3 hours*

**27. ðŸš« BLOCKED â€” Send remaining Win-back Segment C waves + Segment D** (1,741 debug-only). *Blocked until #16 has run successfully through at least 2 waves.* â€” *2 hours*

**28. â¬œ TODO â€” Publish 4 more posts** per editorial calendar (also closes the #23 use-case AI-visibility gap â€” see #23d; add an "ElevenLabs voices in WordPress" + "cheapest Google Cloud TTS" angle, the two prompts that returned 0 AtlasVoice on every engine):
   - "Best TTS for EPUB Files" + "Text-to-Speech for Kindle Books 2026" (ebook cluster expansion)
   - "TTS in Elementor" + "TTS in Divi" (page-builder cluster)

**29. â¬œ TODO â€” Add the public `/changelog/` and `/roadmap/` pages.** Trust signal for customers and AI models. Reduces "is it still maintained?" objection. â€” *2 hours total*

**30. â¬œ TODO â€” Battlecards exposed publicly** as `/docs/comparisons/atlasvoice-vs-{gspeech|trinity|beyondwords}/`. Content already drafted in `2026-06-tts-artifacts/competitive-battlecards.md`. SEO + AI-citation value compounds. â€” *3 hours*

**31. ðŸ” RECURRING â€” Reddit + Quora presence.** One helpful answer/week in r/Wordpress, r/accessibility. Mention AtlasVoice once with disclosure ("I work on this"). AI models heavily weight Reddit for product recommendations. â€” *30 min/wk*

**32. â¬œ TODO â€” Publish Italian-language variant** of "Best Free TTS Tools" at `/it/migliori-strumenti-text-to-speech-2026/`. Italian queries rank position 7 already with near-zero competition. Cheap win. â€” *4 hours*

**33. ðŸ” RECURRING â€” Send Monthly Newsletter #3.** First Monday of each month. *Depends on #12 being live.*

**34. ðŸš« BLOCKED â€” End-of-quarter retro + Q4 plan refresh.** Review KPIs against targets below. If wp.org listing reopened (likely), evaluate channel mix and adjust paid spend. If still closed, decide whether to escalate. *Blocked by calendar â€” runs at week 12.*

---

### REOPEN-TRIGGERED ACTIONS (fire the day wp.org listing reopens)

These don't fit into a weekly slot because the trigger is external. Pre-write everything in week 1 so it ships within 24 hours of the listing going live.

**R1. ðŸ”„ REOPEN-TRIGGERED â€” Send "We're back" broadcast** to entire Mailchimp list (3,193 contacts). One short email: "AtlasVoice is live on WordPress.org again. Here's the link to install. Thanks for sticking with us." From Azizul. Suppress contacts who are in the active win-back sequence already. Pre-draft this email in Week 1, ready to send. â€” *30 min draft + 15 min send when triggered*

**R2. ðŸ”„ REOPEN-TRIGGERED â€” Update homepage / pricing / product page copy** to remove any "temporarily under review" banners or notices added in Week 1. Update `og:image`s if they referenced the closure. â€” *30 min*

**R3. ðŸ”„ REOPEN-TRIGGERED â€” Update llms.txt** to reflect the reopened state. Replace "currently under review" with "available on WordPress.org and direct from atlasaidev.com". â€” *30 min*

**R4. ðŸ”„ REOPEN-TRIGGERED â€” Update all 3 comparison posts** (vs GSpeech / vs Trinity / vs Amazon Polly) â€” remove the closure context paragraphs, keep the "we've been through it" narrative as a trust signal. â€” *1 hour*

**R5. ðŸ”„ REOPEN-TRIGGERED â€” Convert `/temporarily-delisted-on-wp-org-download-direct/` from active page to redirect.** 302 redirect to `/plugins/` for new visitors. Keep the URL alive with a small "what happened in May 2026" archive note for transparency / link-equity preservation. â€” *15 min*

**R6. ðŸ”„ REOPEN-TRIGGERED â€” Unblock action #14** (wp.org review solicitation). Pre-written email is ready; send within 24 hours of reopen. â€” *(execution time covered in #14)*

**R7. ðŸ”„ REOPEN-TRIGGERED â€” Update all in-flight outreach emails** (#17 YouTubers, #18 editorial) â€” soften "closed" language to "we came out the other side" where the emails haven't shipped yet. If already shipped, send a one-line follow-up to recipients: "Quick update â€” the listing is back live. Same offer stands." â€” *30 min*

**R8. ðŸ”„ REOPEN-TRIGGERED â€” Switch all win-back emails' install CTA** from direct download to wp.org install link. Edit the Mailchimp journey templates for any waves not yet sent. â€” *15 min*

**R9. ðŸ”„ REOPEN-TRIGGERED â€” Issue a public retrospective post** (optional but high-value): "What happened with AtlasVoice on WordPress.org â€” and what we learned." 800-1,200 words. Strengthens the editorial pitches (#18) and the AI-visibility narrative. Honest, no spin. â€” *2 hours*

**R10. ðŸ”„ REOPEN-TRIGGERED â€” Submit a Mailchimp e-commerce attribution test purchase** to verify action #1's wiring works for a wp.org-install user who later upgrades to Pro. â€” *30 min*

---

## Part 4 â€” Operational pre-requisites

### Mailchimp â†” Freemius attribution wiring (Week 1, before anything else)

**Status: â¬œ TODO** â€” confirmed broken (0% order rate in Mailchimp despite live Freemius revenue).

The Mailchimp dashboard shows 0% order rate today because the e-commerce integration is missing. Until this is wired, you cannot measure whether any email actually drove a sale. Implementation:
1. Configure Freemius webhook to POST to Mailchimp's `/ecommerce/stores/{store_id}/orders` endpoint on every successful purchase
2. Include the contact's email so Mailchimp matches the order to the campaign click
3. Verify by making a $1 test purchase from a Mailchimp-tagged contact and confirming the order appears in Mailchimp Reports

Without step 1-3, **every email A/B test is blind**. Do this first.

### Brand voice spec (used for all content)

**Status: â¬œ TODO** â€” voice is in use implicitly via existing emails; not yet documented as a spec.

Document and use the voice already in your existing emails (Azizul, founder, direct + warm + technically credible). Full 1-page spec is summarized below. Apply to every content piece, every email, every product copy update.

- **Direct**: clear, specific, fast. Not blunt or cold.
- **Founder-honest**: transparent about limits; willing to acknowledge what we don't do well. Not self-deprecating.
- **Technically credible**: comfortable with WordPress jargon (CSS selector, schema markup, post type) without explaining basics. Not showing off.
- **Warm without performative**: a real person signing emails. Not a generic SaaS team.

**Style rules:**
- Em-dash spaced (` â€” `)
- Headings: sentence case
- Contractions yes ("we're", "you'll")
- No "best" superlative unless qualified ("most-downloaded", "highest-rated")
- Emoji: OK in headers/CTAs/emails; never in tables/FAQ/legal copy

**Canonical product names:**
- Customer-facing: **AtlasVoice** (Pro version: **AtlasVoice Pro**)
- WP.org slug (unchangeable): `text-to-audio` / SEO title `Text To Speech TTS Accessibility`
- Never use generic "Text to Audio" in customer-facing copy

### Schema deployment workflow

**Status: ðŸ” RECURRING** â€” workflow used for every schema addition.

Use `2026-06-tts-artifacts/schema-markup.md` blocks. Workflow per page:
1. Copy JSON-LD block
2. Validate at https://search.google.com/test/rich-results
3. Inject via Code Snippets plugin OR child theme `functions.php` OR Yoast custom schema
4. Wait 2-4 weeks; check GSC "Enhancements" report for the rich-result type
5. Monitor for errors weekly in the first month

### Reopen-readiness checklist (pre-stage in Week 1)

**Status: â¬œ TODO** â€” prep these so they fire within 24 hours of the wp.org reopen notification.

- Pre-draft the "We're back" Mailchimp broadcast (R1)
- Pre-draft the wp.org review solicitation email (R6 / #14)
- Pre-write the optional public retrospective post (R9)
- Identify which pages have "temporarily under review" copy that needs swapping (R2)
- Save current llms.txt and prepare the reopen-version (R3)

---

## Part 5 â€” KPI targets (Day 90)

**Status: ðŸ” RECURRING** â€” review weekly, formal retro at Day 90.

| Metric | Today (2026-06-03) | Day 90 target | Current status | How |
|---|---|---|---|---|
| **MRR** | $907 | **$1,150 (+27%)** | â¬œ baseline | Lifetime upgrades + win-back conversions + new direct sales |
| **New Pro subs / month** | 0 (June MTD) | 12-15 | â¬œ baseline | Paid + content + Playground + win-back + wp.org reopen |
| **Mailchimp list size** | 3,193 | 4,500 | â¬œ baseline | Win-back reactivations + lead-magnet captures + wp.org-installed contacts |
| **Mailchimp open rate** | 19.62% | 25%+ | â¬œ baseline | Segmentation + list hygiene |
| **Mailchimp click rate** | 0.23% | 2-3% | â¬œ baseline | Audience segmentation + better CTAs + win-back send |
| **Mailchimp order rate** | 0% (broken) | Tracked, even if low | â¬œ broken | Attribution wiring first (action #1) |
| **Active automations** | 1 | 4 | â¬œ baseline | Convert-to-Pro + Post-purchase + Newsletter + Win-back |
| **Direct atlasaidev.com sessions / 28d** | 543 | 1,500 | â¬œ baseline | Content + YouTube + paid + partner |
| **GSC clicks / month** | 122 | 180 (+50%) | â¬œ baseline | Title/meta CTR fixes + cluster expansion |
| **GSC indexed pages** | 234 | 260 | â¬œ baseline | 24 new posts |
| **Site CTR** | 0.5-0.7% | 1.0%+ | â¬œ baseline | CTR fixes on top pages |
| **WP.org reviews** | 83 | 130+ | ðŸ”„ unblocks at reopen | Review solicitation via R6 / action #14 |
| **WP.org referral sessions / 28d** | 37 (declining during closure) | 200-400 | ðŸ”„ unblocks at reopen | Listing reopens â€” channel returns |
| **Star-rating SERP rich results** | 0 | Live (4-6 weeks after schema deploy) | âœ… schema deployed & validated (2026-06-04) â€” monitor SERP | `AggregateRating` schema (action #13 â€” already live + Rich-Results-Test clean) |
| **Lifetime upgrades** | 0 | 10-20 | â¬œ baseline | Lifetime offer to existing 175 yearly subs (action #2) |
| **WP YouTuber review videos** | 0 | 1-3 | â¬œ baseline | Outreach (action #17) |
| **Editorial mentions** | 0 | 1 | â¬œ baseline | WP Tavern / Kinsta / WPMU DEV outreach (action #18) |
| **AI-visibility mention rate** (neutral, 15-prompt) | **Perplexity 47% Â· ChatGPT-neutral 43% Â· Gemini 60% Â· Claude skeptical** (2026-06-04 baseline) | 60% best-plugin / 50% accessibility by Day 90 | âœ… baseline captured (action #23) | Third-party authority (#19) + name consolidation + use-case content; recheck Day 30/60 |
| **Source diversity** (no channel > 35%) | Direct + Google dominate | Direct â‰¤30%, organic â‰¥20%, email â‰¥15%, paid â‰¥10%, partner/affiliate â‰¥10%, wp.org â‰¤15% | â¬œ baseline | Channel work + cap wp.org dependence even after reopen |

---

## Part 6 â€” Artifacts you'll use (in `2026-06-tts-artifacts/`)

Don't read these now. Only open the relevant file when you reach the matching action above.

| File | When to open it | What's inside |
|---|---|---|
| `baseline-data.md` | Quarterly refresh / when sharing context with a teammate | 16-month GSC, 24-month GA4, all-time Freemius, Mailchimp snapshot |
| `keyword-clusters.md` | Whenever picking the next blog post topic | 14 clusters, target URL per cluster, content gap map |
| `content-strategy.md` | Editorial planning / hiring a writer | 12-week calendar, internal-linking pattern, refresh schedule for existing top pages |
| `content-brief-best-free-tts-2026.md` | Week 3 when writing the "Best Free TTS 2026" post | Full 3,000-word brief â€” outline, keywords, schema, internal links, FAQ |
| `internal-linking.md` | Week 6 when injecting the 23 contextual links | Hub+spoke map, anchor-text policy, page-by-page link instructions |
| `schema-markup.md` | Anytime adding schema | Copy-paste JSON-LD blocks: AggregateRating, Review, HowTo, VideoObject, FAQPage, Organization |
| `ai-visibility.md` | Week 8 baseline + 30/60/90 retest | 15 prompts to run, action plan to improve AI mention rate |
| `email-sequences.md` | Weeks 2+ as you send each | Three full sequences: win-back (4 segments), post-purchase nurture (7 emails), monthly newsletter â€” subject lines, preview text, body copy, branching, A/B tests |
| `sales-assets.md` | Week 1 when building landing pages | Full copy for `/temporarily-delisted-on-wp-org-download-direct/`, `/lifetime-upgrade/`, and `/changelog/` |
| `outreach-emails.md` | Week 7 when reaching out to YouTubers + editorial | 5 personalized YouTuber drafts + 3 editorial pitches + follow-up sequence |
| `competitive-battlecards.md` | Anytime someone says "we're evaluating you vs X" | Battlecards vs GSpeech / Trinity Audio / BeyondWords â€” pricing, talk tracks, objection handling, landmine questions |

---

## Part 7 â€” Decision triggers

Things that should change the plan:

| If this happens | Then | Status |
|---|---|---|
| **WP.org listing reopens** (expected within days) | Fire actions R1-R10 within 24 hours. Update the "Last status update" date. Do NOT pause the diversification work â€” wp.org returning is upside, not a reason to slow down channel-building. | ðŸ”„ imminent |
| WP.org closure passes 30 days from now | Escalate â€” contact Plugins Team via the support channel; consider legal review of the closure; treat the wp.org channel as gone for planning purposes | ðŸ¤” DECISION on trigger |
| 10+ lifetime upgrades in Week 1 | Run a second lifetime offer in Q4; raise yearly price for new sign-ups from $59 to $69-79 | ðŸ¤” DECISION on trigger |
| Win-back Segment A reactivation < 1% | Refine subject + offer before sending Segments B/C/D | ðŸ¤” DECISION on trigger |
| Paid CPA > $30 in any 14-day window | Cut paid spend; reallocate to content | ðŸ¤” DECISION on trigger |
| YouTuber outreach gets 0 responses in 14 days | Pivot to micro-influencer tier (3-10K subs) | ðŸ¤” DECISION on trigger |
| MRR drops below $800 | Escalate â€” second wave of existing-subscriber retention emails + emergency 30% discount push to win-backs | ðŸ¤” DECISION on trigger |
| Mailchimp deliverability damaged (unsub > 2%) | Pause win-back sends; warm domain with newsletter cadence only | ðŸ¤” DECISION on trigger |
| WP.org closes us again in the future | Plan is already built for this â€” execute the reopen-triggered actions in reverse (R5 reverts back to active landing page; R1 broadcast becomes "we'll be back" instead of "we're back"). The diversified channels remain the lifeline. | (covered by existing plan) |

---

## Part 8 â€” Total effort summary

| Phase | Effort | Cash impact | Status |
|---|---|---|---|
| Week 1 | ~25 hours (incl. ~3 hours of reopen prep) | Lifetime upgrades: $1,400-5,600 immediate | â¬œ TODO |
| Weeks 2-4 (Month 1 finish) | ~25 hours | Win-back A: 14-20 reactivations; 4-6 Pro conversions ($240-360); wp.org channel returns | â¬œ TODO |
| Reopen-triggered (when fired) | ~5 hours (within 24 hours of reopen) | "We're back" broadcast + review solicitation accelerate Pro conversions and reviews | ðŸ”„ REOPEN-TRIGGERED |
| Month 2 | ~40 hours | Win-back B+C: 30-50 reactivations; 5-10 Pro conversions ($300-600); paid sales + wp.org-led free installs compounding | â¬œ TODO |
| Month 3 | ~40 hours | Demo video + editorial + YouTuber compounding; channel mix locked | â¬œ TODO |
| **Total** | **~135 hours over 90 days** (~11 hr/week) | **$1,800-$6,500 immediate cash + $300-600/mo new recurring** (slightly higher than the closed-listing scenario because wp.org reopens) | â¬œ TODO |

Paid budget: **$450** ($150/mo Ã— 3 months) on branded + competitor search.

---

## How to update statuses

When you complete an action, change its leading symbol:
- `â¬œ TODO` â†’ `âœ… DONE`
- Add a date suffix when marking done: `âœ… DONE 2026-06-10`
- If you start but don't finish: `ðŸŸ¨ PARTIAL` with a note explaining what's left
- When a blocker resolves: `ðŸš« BLOCKED` â†’ `â¬œ TODO`
- When the wp.org listing reopens, fire R1-R10 in order, then change each `ðŸ”„ REOPEN-TRIGGERED` â†’ `âœ… DONE [date]`
- For recurring actions, the status stays `ðŸ” RECURRING` permanently; track individual instances in a separate log if useful

**Weekly review (10 minutes):**
1. Update statuses of any actions touched this week
2. Refresh the "Last status update" date at the top
3. Check Part 5 KPI table â€” note any baseline changes
4. Check Part 7 decision triggers â€” any fired?
5. If wp.org reopened this week, confirm all R1-R10 actions fired

That's it. One plan, one file, one priority order. Open the artifacts only when you reach the matching step.
