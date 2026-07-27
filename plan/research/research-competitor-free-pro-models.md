# Competitor Analysis — Free vs Pro Models (ResponsiveVoice, GSpeech)

**Date:** 2026-07-27
**Purpose:** Understand how the two closest wp.org competitors structure free vs paid, so we can design
the AtlasVoice free/Pro split to lead the category.
**Method:** Both plugins downloaded from wp.org and read source-first, not marketing-first.

| Plugin | Slug | Version studied | Active installs | Local copy |
|---|---|---|---|---|
| ResponsiveVoice Text To Speech | `responsivevoice-text-to-speech` | 2.0.3 | ~7,000 | `wp-content/plugins/responsivevoice-text-to-speech` |
| GSpeech | `gspeech` | 3.21.2/3.21.3 | ~3,000 | `wp-content/plugins/gspeech` |

Related: [`../tickets/TTS-266-atlasvoice-cloud-consistent-voices-free.md`](../tickets/TTS-266-atlasvoice-cloud-consistent-voices-free.md) ·
[`research-opensource-tts-models.md`](research-opensource-tts-models.md)

---

## 1. The headline finding

**Both competitors run the same business shape: a hosted TTS cloud with a character quota, sold as a
subscription. Neither relies on browser voices, and neither asks the customer for an API key.**

Our current shape — free plugin on browser `speechSynthesis` + a separate Pro plugin where premium
providers are bring-your-own-key — is the outlier. It loses on the two things that decide whether an
install survives the first week: **how good it sounds on the visitor's device**, and **how much setup
the site owner has to do**.

GSpeech says this out loud in their readme, aimed squarely at plugins like ours:

> Unlike many text-to-speech solutions that rely on limited browser voices or require users to
> configure and pay for external API keys, GSpeech provides access to premium AI voices … with
> **no API key setup**.

That single sentence attacks our free plugin (browser voices) and our Pro plugin (BYOK) at the same time.

---

## 2. ResponsiveVoice (~7,000 installs)

### Model

Free account = **1M characters/month, 1 website, commercial use allowed, RV branding**. Then
$9 (5M) / $49 (50M, 10 sites) / $149 (250M, 50 sites) per month, overage $5 per extra million.
Branding removal starts at the $9 tier.

**Characters are metered at every playback**, not at generation. Every replay by every visitor costs
them money — which is exactly why the paid ladder is priced per million characters.

### Architecture (from `build/core.js`, `includes/*.php`)

- **Dual-engine router**: a `nativeEngine` ("Native TTS", `speechSynthesis`) and a `fallbackEngine`
  (their cloud), with `servicesEnabled=[true,true]`, `servicesPriority=[0,1]`, plus `forceFallback` /
  `preferNative` switches. Per voice, per browser, per OS it picks one.
- **Hosted synthesis**: `texttospeech.responsivevoice.org/v2/text/synthesize` → `audio/mpeg`, streamed
  as HTTP chunks or over WebSocket, played through a pooled `<audio>` element with the silent-MP3
  unlock trick for iOS.
- **Crowd-sourced voice database**: the SDK calls
  `/voices?lang=&gender=&browser=&browserVersion=&os=&osVersion=` (ETag-cached) and
  `POST /voices/report`, uploading each visitor's local voice list. Every install improves their
  voice-profile → native-voice mapping table.
- **Account probe from PHP**: `ConfigClient.php` → `GET /v2/config` with `X-API-Key`, cached in a
  transient plus a durable last-known-good option so a failed probe never wipes a working config.
- Character counts posted to `app.responsivevoice.org/analytics/cc/session`.

### Verdict

Architecturally correct, economically hostile to themselves. Their "51 languages, no browser problems"
claim is not clever Web Speech usage — it is a paid cloud with a native-voice shortcut.

---

## 3. GSpeech (~3,000 installs) — the more dangerous one

### Model: one plugin, SaaS behind it

**There is no separate Pro plugin.** One plugin on wp.org containing every player and feature; what
unlocks capability is a `widget_id` bound to an account at gspeech.io. The site owner clicks
"Activate Cloud Console", types an email in WP Admin (`gspeech_backend.php` — `gsp_reg_email`,
`gsp_widget_id_val`), and **the server decides what the site may do**. No license file, no second
plugin, no download.

| | Free | Personal | Pro | Business | Enterprise |
|---|---|---|---|---|---|
| Price/month | $0 | $9.99 | $39.99 | $79.99 | $129.99 |
| Price/year | — | $99.90 | $399.90 | $799.90 | $1,299.90 |
| Characters/month | **50K** | 100K | 1M | 2M | 5M |
| Websites | **10** | 1 | 3 | 5 | 10 |
| Voices | "Machine voices" | 230+ AI | 230+ AI | 230+ AI | 230+ AI |
| Languages | 65 | 78 | 78 | 78 | 78 |
| Audio downloads | ✗ | ✓ | ✓ | ✓ | ✓ |

Yearly = 10× monthly (2 months free). A separate **AppSumo lifetime deal** runs as its own acquisition
channel — the plugin ships a dedicated `tab_upgrade_appsumo.php` for it.

**Their gating levers:** characters/month · number of websites · machine vs AI voices · language count ·
audio downloads · real-time translation · analytics. Note how they are generous where it costs nothing
(10 free websites) and tight where it costs money (50K characters ≈ 8 average posts per month).

### Architecture (from source)

- **Cloud generation + cache** — audio generated once on their infrastructure, cached, then served as a
  file. This is what lets them claim consistent playback on every browser/device and "up to 7 hours of
  playback per article" (i.e. a ~60,000-word article narrated in full, versus plugins that truncate).
- **Legacy free path** — `streamer.php` in the plugin root proxies `translate.google.com/translate_tts`
  from the *customer's own server* with a spoofed Android user-agent (`stagefright/1.2 (Linux;Android 5.0)`),
  falling back to `https://gspeech.io/` when cURL is unavailable. This is the "machine voices" free tier.
- **Aggressive optimizer defence** (`gspeech_frontend_protection.php`) — every script tag gets
  `data-no-defer`, `data-no-optimize`, `data-no-minify`, `data-cfasync="false"`, `nowprocket`; a
  `wp_print_footer_scripts` fallback re-injects the loader; if the JS file itself is blocked it is
  served through `admin-ajax.php` instead. More aggressive than our `TTA_Hooks` exclusion list.
- **Own DB table** `wp_gspeech_data` (widget_id, crypto key, session flags) plus a libsodium sealed-box
  handshake per visitor session.
- **Analytics by country/city/device** inside WP Admin, and an "Audio Database" tab listing generated
  files (download = paid only).

### Their weaknesses (observed in the code)

These are factual observations from the shipped source, and they matter to us because we have just been
through a wp.org closure (`TTS-247`, `TTS-249`):

- `gspeech_processor.php::process_db()` sends **site domain + `admin_email` + blog name + version** to
  `https://gspeech.io/make-statystics/<base64>` on install/upgrade with **no opt-in**, using
  `'verify_peer' => false`. `gspeech_frontend.php::make_statistics()` does the same from the front end.
- `streamer.php` reads a raw `$_GET['q']`, defines `ABSPATH` itself so the file is directly reachable,
  and proxies arbitrary text to Google.
- `session_start()` runs on front-end requests, which breaks full-page caching.
- No `== External services ==` section in the readme.
- 2012-era codebase: jQuery, `flashmediaelement.swf`, IE 6–8 conditional comments, `selectivizr`,
  bundled colorpicker.

---

## 4. Side by side

| | ResponsiveVoice | GSpeech | **AtlasVoice today** |
|---|---|---|---|
| Free voice source | Device voices + their cloud | Their cloud ("machine voices") | **Device voices only** |
| Sounds the same on every device? | Yes (paid path) | Yes | **No** |
| API key needed by customer | No | No | **Yes, for Pro providers** |
| Free quota | 1M chars/mo, 1 site | 50K chars/mo, 10 sites | Unlimited but device-dependent |
| Paid model | Subscription, per-character | Subscription, per-character | Plugin licence (Freemius) |
| Separate Pro plugin | No | No | **Yes** |
| Audio stored on customer's server | No | No | Yes (Pro) |
| Vendor lock-in | Total | Total | Low |
| Codebase age | Modern SDK | 2012 lineage | Modern React |

---

## 5. What both competitors prove

1. **The cloud + cache pattern is the winning architecture.** Two independent companies, 10,000 installs
   between them, converged on it. `TTS-266` proposes the same thing — this is validation, not novelty.
2. **"No API key" is the strongest sales line in this category.** Asking a blogger to create a Google
   Cloud project is where most of them quit.
3. **The free tier exists to prove the sound, not to be generous.** Both deliberately keep free voices
   worse than paid.
4. **Per-character metering forces stingy free tiers.** They must meter because their costs recur per
   character. That is the constraint we do not have.

---

## 5.1 Storage model — why local by default beats vendor-hosted

Both competitors store the generated audio on **their own** servers and serve it from there. We generate
on our server, hand the MP3 to the site, and store it in the customer's `wp-content/uploads` — our server
keeps it only as a transient buffer (~20 minutes, matching the existing Pro `gtts.atlasaidev.com`
cleanup).

**Their choice is not a feature — it is what per-playback metering requires.** If you bill per listen,
you must control the file. We bill per generation, so we are free to hand the file over.

**The question that decides it for a customer:** *what happens to my audio when I stop paying?*

| | GSpeech / ResponsiveVoice | AtlasVoice |
|---|---|---|
| Where the MP3 lives | Vendor servers | **Customer's own server** |
| Stop paying | Every listen button goes dead | **Everything keeps playing forever** |
| Per-play metering | Yes | No — generate once, unlimited plays |
| Vendor outage | Site audio is down | Audio unaffected |
| Customer text retained by vendor | Yes, indefinitely | No — deleted within ~20 min |
| Customer's disk / bandwidth | None used | ~3–6 MB per post, their bandwidth |

Who actually prefers which, stated honestly:

| Segment | Prefers | Why |
|---|---|---|
| Casual blogger / small site | Slight edge to vendor-hosted | Doesn't think about disk; "nothing on my server" *feels* simpler |
| Serious publisher (500+ posts) | **Ours, decisively** | Owns the asset, no meter, works with their CDN, survives vendor death |
| Agency / client sites | **Ours, decisively** | Cannot hand a client a site that breaks when a subscription lapses |
| Very high traffic | Vendor-hosted or CDN | Bandwidth genuinely matters at scale |

The only segment where they hold an edge is the one that cares least — and there the edge is *perceived*
ease, not real benefit.

**Their model's four genuine advantages** — no customer disk, no customer bandwidth, no backup bloat, no
writable-folder support tickets — **are already answered by Pro's existing Google Cloud Storage backup.**
That is GSpeech's storage model, available to us as an option instead of a constraint. So we can offer
what neither competitor can: local by default, cloud offload when the customer wants it, switchable
either way without losing anything.

**Verdict: keep local storage as the default and market it as ownership. Do not copy their model.**

> **Your audio, on your server, yours forever. Generate once — play unlimited, with no per-listen meter
> and nothing to keep paying for.**

---

## 6. What to copy

- **"No API keys required"** as our headline promise for the free plugin.
- **One-click activation from inside WP Admin** — email in, working audio out.
- **Generous website count, controlled character count** — cheap generosity, expensive limits.
- **Audio database in admin with downloads as a paid feature** — clean, obvious upsell.
- **Read Highlighted Text** and **welcome message** — small features that demo extremely well.
- **A lifetime-deal channel (AppSumo)** as distribution separate from wp.org.
- **Their optimizer-defence pattern** — worth comparing against our `TTA_Hooks` exclusions, especially
  the admin-ajax fallback when a cache plugin strips our JS entirely.

## 7. Where we attack

- **Free-tier quality.** Their free voices are old Google Translate "machine voices"; good voices start
  at $9.99/mo. A free tier on Kokoro/Piper would sound **better than GSpeech's paid entry tier** and cost
  us licence-free CPU.
- **Free-tier size.** 50K characters/month is ~8 posts. Because `TTS-266` caches the MP3 on the
  customer's own server, replays cost us nothing, so we can be far more generous on the same spend.
- **Lock-in.** Their customers cannot bring their own key, cannot keep their audio, and lose everything
  if the service stops. Ours can.
- **Privacy and compliance.** Opt-in before any external call, a proper `== External services ==`
  disclosure, no `admin_email` sent on activation, no `session_start()` on the front end. Given what
  their code does today, "privacy-clean and cache-friendly" is a genuine marketing position.
- **Modern UI.** Our React dashboard versus their 2012 stack.

---

## 8. Recommended AtlasVoice free/Pro structure

- **Free plugin** — our own cloud (self-hosted Kokoro/Piper), no API key, quota generous enough to feel
  unlimited to a normal blogger, voices better than GSpeech's paid entry tier, small "Voiced by
  AtlasVoice" credit. `speechSynthesis` stays as the zero-config default and the offline fallback.
  This is the wedge that fixes free-user churn.
- **Pro plugin** — keeps **BYOK as an option** (ElevenLabs / OpenAI / Google at the customer's own cost,
  no markup from us) **and** adds our managed premium voices for people who never want to see an API key.
  Plus bulk MP3, GCS backup, per-word highlighting, no credit.
- **Positioning:** *"Your audio, on your server. Bring your own key or use ours. Nothing leaves your site
  until you say so."* — the one line neither competitor can copy.
- **Pricing levers:** copy their proven set (characters, sites, voice tier, downloads, translation,
  analytics); we do not have to copy their five-tier subscription ladder.

---

## 9. Open strategic decision — subscription vs bundled

Both competitors chose recurring subscriptions because their per-character costs recur. Our engine is
self-hosted and Apache/MIT-licensed, so our cost is a fixed server bill. That gives us an option they
do not have — and a decision to make.

Worked example at **100 paying customers**, VPS at $25/month ($300/year):

| Model | Revenue/year | Cost/year | Notes |
|---|---|---|---|
| **Monthly add-on** — cloud voices at $9/mo | 100 × $9 × 12 = **$10,800** | ~$300 | Recurring, but customers must keep paying or audio stops |
| **Bundled** — cloud voices inside Pro at $59/yr | 100 × $59 = **$5,900** | ~$300 | Half the revenue, far easier sell against $9.99–$129.99/mo |

**Trade-off in one line:** monthly earns roughly twice as much per customer; bundled wins more customers
away from GSpeech because it is dramatically cheaper for them.

**Not yet decided — founder call.** Recommend deciding this before Phase 1 of `TTS-266`, because the
quota/plan model in the service has to be built for whichever answer we pick (though the plan row design
in §A5 of that ticket supports both).

---

## 10. Notes for TTS-266

- `research-opensource-tts-models.md` (2026-04-15) independently reached the same engine conclusion and
  ranks **Kokoro first** (with a ready Docker image exposing an **OpenAI-compatible** `/v1/audio/speech`
  endpoint) and **Piper** as the lightweight fallback. TTS-266 §8.1 currently frames Piper as the free
  tier and Kokoro as premium — **Phase 0 should settle which is which by measurement**, and should
  seriously consider starting from `Kokoro-FastAPI`, since an OpenAI-compatible endpoint would cut
  Phase 1 build effort substantially.
- Both competitors keep a **native/device-voice engine as a shortcut path**. Our fallback chain already
  does this, but it is worth noting neither of them dropped `speechSynthesis` entirely.
