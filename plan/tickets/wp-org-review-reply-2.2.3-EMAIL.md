# Reviewer Reply — 2.2.3 (to paste into the HelpScout thread)

**Subject:** Re: [WordPress Plugin Directory] Closure Notice - Guideline Violation: Text To Speech TTS Accessibility

---

Hi, and thank you for the follow-up.

You were right, and I reviewed the whole plugin for anything similar. **Version 2.2.3 is in `trunk/` and tagged `tags/2.2.3`**, tested on a clean install with `WP_DEBUG`; Plugin Check reports **"No errors found."**

**The two items you flagged**

1. **Dashboard widget "Top Post Today" / "Minutes Listened"** — now shown to all users; no add-on check.
2. **AudioObject JSON-LD schema** — needed an MP3 the free player never creates; removed from free, moved to the add-on.

**Other cases of the same kind I also fixed**

- **MP3 file-URL handling** — removed from free; supplied by the add-on via a filter.
- **Posts-list "Audio" column** — MP3 detection removed from free; add-on supplies it.
- **Voice-provider integrations (Google Cloud, ChatGPT, ElevenLabs)** — setup UI + auth checks removed from free, moved to the add-on; free shows an upgrade prompt only.
- **Listening tab voice settings** — premium voice/language selection + multilingual voice mapping removed from free, moved to the add-on; free keeps the browser-voice player only.
- **Analytics post limit** — free was capped at tracking 20 posts. Removed the cap; free now tracks all posts by default, with no artificial limit.
- **Internal naming** — renamed the add-on-detection function so it no longer reads like a license check.

The free plugin now has nothing disabled or hidden unless the add-on is active — premium code is removed, not gated.

If anything still looks off, I'm glad to fix it quickly — just point me to an example. Thank you for your time.

Best regards,
Azizul Hasan

`{#HS:3327588871-1050336#}`
