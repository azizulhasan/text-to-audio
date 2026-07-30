# WPExplorer Outreach Pack — AtlasVoice

> **Purpose:** get AtlasVoice properly represented in WPExplorer's text-to-speech coverage.
> WPExplorer is one of the third-party round-up sources Perplexity cites on the use-case and
> "alternatives" prompts where AtlasVoice currently loses (see `ai-visibility-recheck-2026-07.md`).
> **Researched 2026-07-30.**

---

## 🔴 The finding that changes the plan

**AtlasVoice is already in their round-up — and that's the problem, not the solution.**

`wpexplorer.com/text-to-speech-wordpress-plugins/` — *"7 Best Text-To-Speech WordPress Plugins"*, published/updated **January 14, 2025**:

| # | Plugin |
|---|---|
| 1 | **BeyondWords** |
| 2 | ResponsiveVoice |
| 3 | Trinity Audio |
| 4 | GSpeech |
| 5 | SiteSpeaker TTS |
| 6 | WebsiteVoice |
| **7** | **Text To Speech TTS Accessibility** ← this is you, last, under the legacy name |

Three separate problems in one article:

1. **You're listed under the legacy name, not AtlasVoice.** This is a direct, live cause of the brand fragmentation the June baseline flagged — a cited source teaching engines that "Text To Speech TTS Accessibility" is a different, lesser product than AtlasVoice.
2. **You're ranked last of seven**, on data that is ~18 months old and predates the four-provider Pro, MP3 export, analytics, audio schema and read-along highlighting.
3. **The author is a competitor.** The article is bylined **James MacLeod of SpeechKit** — and SpeechKit rebranded to **BeyondWords** in November 2021. MacLeod is BeyondWords' **co-founder and COO**. So the round-up ranking BeyondWords #1 was written by BeyondWords' co-founder, and the byline still carries the pre-2021 company name.

**Implication:** the highest-value action here is *not* a guest post. It's getting this one existing article corrected. It already ranks, it's already cited by AI engines, and fixing the name alone is worth more than a new post would be.

⚠️ **Tone warning.** Point 3 is factual and verifiable, but leading with it reads as an accusation and will get the email ignored. The email below raises it once, neutrally, at the end — framed as something the editor would want to know, not as a complaint. **Do not escalate it.** If they decline, drop it.

---

## Their rules (from wpexplorer.com/contact/, verified 2026-07-30)

Contact is email only: **hello [at] wpexplorer (dot) com** — no form.

They accept a limited number of guest posts, with guidelines:
- **WordPress-focused only**
- Topic **must not already be published** on their blog
- Content must be original and **explicitly not AI-generated**
- Send a **brief pitch with key points**
- One link in the bio

**They explicitly do NOT accept:**
- ❌ Product reviews
- ❌ How-to guides that only explain how to use a specific plugin
- ❌ Hosting subjects

They also screen outbound links carefully.

### 🚧 Hard constraint — read this before drafting anything

**WPExplorer prohibits AI-generated content.** So the pitch email below is fine to send as-is (it's business correspondence), but **the article itself has to be written by you.** I won't ghostwrite a submission for a publisher that bans AI-written work — it would be misrepresenting authorship to them, and if spotted it costs the relationship and the placement permanently. Use the outline as scaffolding and write it in your own voice; you have the expertise and it's genuinely the differentiator here.

---

## ✉️ Route A — the update request (send this first)

**To:** hello@wpexplorer.com
**Subject:** Correction for your text-to-speech round-up — plugin #7 has changed name

---

Hi,

I'm Azizul Hasan — I build the plugin listed as #7 in your text-to-speech round-up ("Text To Speech TTS Accessibility"). I'm writing because the entry is out of date in a way that's probably confusing your readers.

The plugin is now called **AtlasVoice**. Same plugin, same wordpress.org slug (`text-to-audio`) — we consolidated the branding because the old name was being read as a different product. Right now search engines and AI assistants treat the two names as separate plugins, and your article is one of the places that split shows up.

A few things have also changed since the piece was published in January 2025:

- Four AI voice engines now supported — our own AtlasVoice AI (63 languages, no external API key), plus Google Cloud, OpenAI and ElevenLabs
- Bulk MP3 generation and visitor audio downloads
- Audio schema markup, listening analytics, and read-along highlighting
- Still genuinely free and unlimited on browser voices — no account, no API key, no character cap

Current verifiable numbers, if useful: **4,000+ active installs, 4.8★ from 91 reviews on wordpress.org**, last updated 24 July 2026, tested to WordPress 7.0.2.

Would you consider updating the name and entry? I'm happy to send screenshots or a test license if that helps — no expectations either way.

One thing you may not be aware of: the article is bylined James MacLeod of SpeechKit, which rebranded to BeyondWords in 2021 — he's their co-founder and COO, and BeyondWords is ranked #1 in the piece. Mentioning it only because the byline still shows the old company name and readers wouldn't spot the connection.

Thanks for the work you put into WPExplorer either way.

Azizul Hasan
Founder, AtlasAiDev
atlasaidev.com

---

## ✉️ Route B — the guest post pitch (only after A gets a reply, or if it doesn't)

**To:** hello@wpexplorer.com
**Subject:** Guest post pitch: making WordPress content readable by AI assistants

---

Hi,

I'd like to pitch a guest post. I build a text-to-speech plugin for WordPress, so I'll be upfront about the vendor angle — the piece below is deliberately not about my product, and I'm happy for it to name none of them.

**Working title:** *Your WordPress content is invisible to AI assistants — here's the fix*

**Why now:** ChatGPT, Perplexity and Google's AI answers increasingly cite WordPress sites directly, but most sites give them nothing structured to work with. Audio is the worst case — a crawler cannot listen to an MP3, so audio content is effectively invisible unless you expose it as text and schema.

**Outline:**

- How AI crawlers actually read a WordPress site (and what they silently skip)
- `robots.txt` for AI bots — which user-agents matter, and why blanket-blocking costs you citations
- Schema that changes what gets quoted: `Article`, `FAQPage`, `AudioObject`, `SpeakableSpecification`
- The transcript problem — why audio needs a text twin, and how to output one
- Where `llms.txt` fits, and an honest note that no major AI provider has confirmed they consume it
- A practical checklist readers can run against their own site in an afternoon

**Fit with your guidelines:** WordPress-focused, not a product review, not a how-to for any single plugin, no hosting content. I checked your archive and couldn't find this topic covered.

**About me:** I've built and maintained WordPress plugins since 2019; the free text-to-speech plugin I maintain runs on 4,000+ sites at 4.8★ on wordpress.org. Samples on request.

Original, written by me, not AI-generated. Happy to adjust scope or angle.

Thanks,
Azizul Hasan
atlasaidev.com

---

## Why this order

Route A is a **five-minute email that fixes a live citation** in a source AI engines already quote. Route B is a multi-week editorial process for a placement that doesn't exist yet.

Route A also fixes something no amount of new content can: the name split. Every week that article says "Text To Speech TTS Accessibility" is another week engines learn the wrong entity.

## Follow-up discipline

- **No reply in 7 days** → one short bump, then stop.
- **They update the entry** → check whether Perplexity's prompt 5 and 9 answers shift at the next recheck (2026-08-29).
- **They decline the guest post** → fine. Elegant Themes pays contributors and has an equally stale TTS round-up (2024); same play, different door.

## Cross-references

- `ai-visibility-recheck-2026-07.md` — the round-up gap this addresses
- `listing-producthunt-atlasvoice.md` — Product Hunt listing (live 2026-07-30)
- `promotion-outreach-targets-2026-06.md` — WPGlob paid listicle option ($100) as a fallback
- ⚠️ `outreach-emails.md` — **stale**; still claims the wp.org listing is closed and leads with "315,000+ downloads". Do not reuse until rewritten.
