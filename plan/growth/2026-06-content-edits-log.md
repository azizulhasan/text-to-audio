# Content Edits Log & Deferred Items — June 2026

> Companion to `2026-06-tts-action-plan.md`. Records live on-page/SEO edits made to atlasaidev.com
> blog posts, plus everything intentionally deferred (with the reason + how to finish it).
> For HOW to edit these posts safely, see `../atlasaidev-wp-post-editing-playbook.md`.

---

## ✅ DONE — live & verified (as of 2026-06-04)

### Post: `/best-text-to-speech-book-readers/` (ID 3497)
- **2026 freshness refresh** — replaced the old intro with a tight 2-paragraph lead (hook + AI-voice
  2026 angle + contextual link to `/plugins/text-to-speech-pro/`), then **2 paragraphs → TOC**.
  Converted the body from a monolithic Classic block to native blocks (TOC preserved as Custom HTML;
  all 48 TOC anchor links verified working). Modified date bumped to 2026-06-04.
- **P0 SEO (from SearchFit on-page audit):**
  - **Comparison table** added after the TOC — 9 tools × Tool / Best for / Platforms / Price / Free
    (Text to Speech Pro bolded at #1). Built via Table block → "Edit as HTML" (reliable).
  - **Pricing** for every tool now in the table (web-verified: Speechify $139/yr, NaturalReader
    from $9.99/mo, Voice Dream ~$79.99/yr, Icecream $39.95 once, TTSReader $99/yr, etc.).
  - **Meta description** fixed — removed false "real voice samples" claim → now "free and paid
    picks with pricing, platforms, and setup tips."
  - **Focus keyphrase** repaired (a table value had leaked into it) → "best text to speech book readers".

### Post: `/how-to-use-text-to-speech-on-any-device/` (ID 3085) — CTR rewrite
- **Why:** 97,000 impressions but **0.21% CTR** (biggest single CTR loss on the site). Diagnosis:
  page ranks for device/app-specific queries but the title said generic "Any Device," so SERP
  scanners didn't see their device named.
- **Title:** `How to Use Text-to-Speech on Any Device: Step-by-Step (2026)` →
  **`How to Use Text-to-Speech on iPhone, Android & PC (2026)`** (56 chars).
- **Meta:** →
  **`Turn on text-to-speech on iPhone, Android, PC, Mac, Google Docs, TikTok & WhatsApp — free, built-in, step-by-step. Start listening in under a minute.`** (149 chars) — names every app the page covers so any query matches.
- **Measure:** re-check this page's CTR in GSC in **2–4 weeks**.

### Sitewide
- **Author bio set** for "Atlas AiDev" (user id 2) — was empty. Now populated AND auto-pulled into
  the Yoast **Person schema** on the author page (E-E-A-T signal live at schema level).

### NEW POSTS — drafted (awaiting featured images + publish)
- **"Best Free Text-to-Speech Tools 2026 (Tested & Compared)"** — post **ID 4723**, slug
  `best-free-text-to-speech-tools-2026`, status **DRAFT**. ~2,100 words, native blocks, at-a-glance
  comparison table, all 9 tools, FAQ; 12 internal links (verified slugs), 7 nofollow competitor
  links; honest disclosure; SEO title/meta/keyphrase set (Yoast green). Built from
  `2026-06-tts-artifacts/content-brief-best-free-tts-2026.md`.
  - **Update 2026-06-05:** PUBLISHED. **Featured image added** (WebP, ID 4753, with alt text + og:image).
    Still optional: 9 tool screenshots + per-tool audio samples (can't auto-generate); word count ~2,100
    vs brief's 3,000–3,500 (optional expansion).
- **"How to Set Up Google Cloud Text-to-Speech in WordPress"** — post **ID 4725**, slug
  `how-to-set-up-google-cloud-tts-wordpress`, status **DRAFT**. ~980 words, 6-step tutorial +
  troubleshooting + FAQ. Technically accurate to AtlasVoice Pro (service-account JSON upload,
  confirmed in `text-to-audio-pro` code). SEO title/meta/keyphrase set. Reciprocally linked with
  post 4723 and the wider cluster.
  - **Update 2026-06-05:** PUBLISHED. **Featured image added** (WebP, ID 4755, with alt text + og:image).
- Both are interlinked and carry Article + Person schema (author bio). **Both now PUBLISHED (2026-06-05)**
  with WebP featured images. *(Also published 2026-06-05: ElevenLabs WordPress Integration guide, ID 4739 —
  see action plan #11.)*

---

## ⏸️ DEFERRED — not done yet (reason + how to finish)

### `/best-text-to-speech-book-readers/` (ID 3497)
- **Per-tool screenshots + alt text** — needs 9 source screenshots of each tool. Capture each tool's
  site/app, upload to Media, insert per entry with descriptive alt.
- **`ItemList` schema** for the Top-9 list — needs a safe JSON-LD injection method. The site's
  Custom HTML block uses a CodeMirror modal that **freezes** on large input (see playbook); inject
  via a small Code Snippet (`wp_head` on `is_single(3497)`) or a schema plugin instead.
- **Balanced pros/cons per tool** — partially addressed via the comparison table's "Best for"; a
  prose "Limitation:" line per entry would deepen E-E-A-T (9 native-paragraph edits).
- **Audio samples** — user is adding these (the meta no longer promises them).

### `/how-to-use-text-to-speech-on-any-device/` (ID 3085)
- **`og:title` alignment** — social-share title still reads "…on Any Device" (does NOT affect Google
  SERP CTR; cosmetic for social shares only).
- **GSC query-split investigation** — pull this page's top queries; if a big share is one app (e.g.
  "text to speech on TikTok"), spin off a dedicated page for a bigger win.

### Sitewide / theme-level
- **Visible "last updated" date + on-page author box** — theme/template-level (Astra child). NOT a
  per-post edit. Code Snippets **free** lacks GUI page-targeting (would need `is_singular('post')`
  in PHP, and pushing live PHP through that editor is risky). Do via Astra Pro's Author Box / a
  proper child-theme `functions.php` edit. (Author bio + Person schema already done above.)
- **Purpose-built og:image 1200×630** — interim image in use; create a branded share image.
- **File renames** (e.g. `Adobe-Express-file-2.webp`) — skipped earlier per founder decision.

---

## NEXT-BEST ACTIONS (from the action plan, not yet started)
- **Win-back email** to ~3,200 free users / leads (drafted, never sent) — highest single-action ROI.
- **"Best Free Text-to-Speech Tools 2026"** new post (brief ready) — captures ~2,000 uncaptured impressions on a fresh URL.
- **Convert-to-Pro 5-email journey** (`plan/email/email-journey-convert-to-pro.md`) — ready to build in Mailchimp.
