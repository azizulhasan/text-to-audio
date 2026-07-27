# TTS-266 — AtlasVoice Cloud: device-independent voices for the FREE plugin

**Status:** Plan / not started
**Jira:** [TTS-266](https://atlasaidev.atlassian.net/browse/TTS-266)
**Owner:** Azizul Hasan
**Created:** 2026-07-27
**Plugins affected:** `text-to-audio` (Free) — primary · `text-to-audio-pro` (Pro) — refactor only
**New infrastructure:** AtlasVoice Cloud synthesis service (new VPS + service, sibling of today's `gtts.atlasaidev.com`)

---

## 1. Problem

The free plugin ships **only player 1**, which is the browser Web Speech API (`speechSynthesis`).
The voice catalogue behind that API is supplied by the visitor's **browser + operating system**, so:

- The same post sounds different on Chrome/Windows, Safari/iOS, Firefox/Linux and Samsung Internet.
- A language the site is written in may have **no installed voice at all** on the visitor's device →
  silence, wrong-language reading, or a robotic default.
- Voice names are not stable, gender is not guaranteed, and `onvoiceschanged` timing differs per engine.
- Android WebView and several in-app browsers (Facebook, Instagram) expose a crippled or empty voice list.

This is the single biggest cause of churn on the free plugin: the site owner installs it, hears it work
on their own machine, then gets complaints (or bad reviews) from visitors on other devices and uninstalls.

## 2. Goal & success criteria

Make free-plugin playback **identical on every browser, OS and device**, without requiring the site owner
to buy anything or configure an API key of their own.

Success criteria:

1. A post plays with the same voice, same pronunciation, same speed on Chrome/Windows, Safari/iOS,
   Firefox, Edge, Samsung Internet and Android WebView.
2. Works in languages where the visitor's device has no local voice installed.
3. Zero configuration required for the plugin to remain functional (must keep working with no account).
4. Free-tier infrastructure cost per site stays near zero at steady state.
5. Passes wp.org review — no trialware gating, opt-in before any external call, external services disclosed.

## 3. Decision

**Server-side synthesis into a cached MP3, played through a plain `<audio>` element**, with the audio
produced by **open-source TTS engines we host ourselves** (Piper — MIT; Kokoro-82M — Apache-2.0), and
**one MP3 generated per post, stored on the site owner's own server**.

An MP3 is byte-identical everywhere. That removes the device variable completely.

### Why not the alternatives

| Option | Verdict | Reason |
|---|---|---|
| Keep `speechSynthesis`, improve voice matching | ✗ | Cannot invent a voice the device does not have. Matching only reduces the symptom. |
| ResponsiveVoice-style hosted service, billed per character | ✗ as a model | Works technically (see §4), but they meter **per play** — every visitor replay costs money forever. |
| Client-side neural TTS in the browser (Kokoro/Piper via ONNX Runtime Web) | ✗ as default, ✓ as a later option | 25–80 MB model download per visitor, WebGPU ~85% support (Firefox off by default), fragile iOS Safari WASM memory, slow on low-end Android. Also collides with the wp.org rule against offloading assets to remote services. Revisit as an opt-in "no-cloud / private" mode. |
| Third-party paid API keyed by us (Google/OpenAI/ElevenLabs) | ✗ | Per-character cost we cannot absorb on a free tier, and duplicates what Pro already sells. |
| `edge-tts` (unofficial Microsoft Edge Read-Aloud endpoint) | ✗ | Against Microsoft's ToS, and since 2026 it rejects non-Edge user agents in the browser. Unshippable in a wp.org plugin. |
| Cloud free tiers (Polly 5M/mo first year, Google 1M/mo, Azure 500k/mo) | ✗ as the base | Time-limited or small, and requires each site owner to create a cloud account — that is a Pro/BYOK story, not a free-plugin story. |

### Competitor reference — how ResponsiveVoice actually solves it

Studied from their v2.0.3 source (installed at `wp-content/plugins/responsivevoice-text-to-speech`,
~7,000 active installs, "51 languages / 158 voices"). Their claim is **not** clever use of the Web
Speech API. It is a hosted service:

- **Dual-engine router** in `build/core.js`: a `nativeEngine` ("Native TTS", `speechSynthesis`) and a
  `fallbackEngine` (their cloud), with `servicesEnabled=[true,true]`, `servicesPriority=[0,1]` and
  `forceFallback` / `preferNative` switches. Per voice, per browser, per OS it picks one.
- **Hosted synthesis API**: `https://texttospeech.responsivevoice.org/v2/text/synthesize` returns
  `audio/mpeg`, streamed as HTTP chunks or over WebSocket, played through a pooled `<audio>` element
  (with the silent-MP3 unlock trick for iOS).
- **Crowd-sourced voice database**: the SDK calls `/voices?lang=&gender=&browser=&browserVersion=&os=&osVersion=`
  (ETag-cached) and `POST /voices/report`, uploading each visitor's local voice list. Every install
  improves their profile→native-voice mapping table.
- **Account probe from PHP**: `ConfigClient.php` → `GET /v2/config` with `X-API-Key`, cached in a
  transient plus a durable last-known-good option; character counts posted to
  `app.responsivevoice.org/analytics/cc/session`.
- **Commercial model**: Free = 1M chars/month, 1 website, commercial use allowed, RV branding; then
  $9 / $49 / $149 per month, overage $5 per million characters — **counted at every playback**.

**Take the architecture, reject the economics.** Because we cache one MP3 per post on the customer's own
server, we pay per *post*, not per *play*. A 2,000-word article ≈ 12,000 characters synthesized once;
10,000 subsequent plays cost us nothing and are served by the customer's own host.

### What already exists in our stack

Pro **player 3** already generates MP3s through our own Node service at
`https://gtts.atlasaidev.com/api/gtts` (`TTA_PRO_GTTS_API_URL`, `includes/TTA_Pro_Constants.php`), stores
them in the uploads folder and records them in the `tts_mp3_file_urls` post meta. **The "our server makes
the MP3" pattern is already built and proven in production.** This ticket adds a new engine behind that
pattern and opens it to the free plugin with a key + quota.

---

## 4. Architecture overview

```
Visitor browser (any device)
        │  1. click Listen
        ▼
Free plugin player 7  ──── MP3 already cached? ──yes──►  <audio src="…/uploads/atlasvoice/…mp3">
        │ no                                                      (identical on every device)
        ▼
WP REST  tta/v1/cloud/synthesize   (site key, nonce, capability-checked)
        │
        ▼
AtlasVoice Cloud   https://voice.atlasaidev.com/api/v1/synthesize
   ├── auth: site key (domain-bound)     ├── quota: characters/month per key
   ├── dedupe: sha256(text|voice|speed)  ├── rate limit: per key + per IP
   └── engine: Piper (standard) / Kokoro (premium)
        │
        ▼  MP3 stream + JSON meta {url, attribution, chars_used, quota_left}
WP saves MP3 into wp-content/uploads/…  →  post meta tts_mp3_file_urls
        │
        ▼  quota exhausted / no key / service down
   FALLBACK → player 1 (speechSynthesis), exactly as today
```

---

## 4.1 Storage model — local by default, cloud offload as the Pro option

**Decision: the MP3 lives on the customer's own server (`wp-content/uploads`), and that stays our
default. Do not copy GSpeech's vendor-hosted storage.**

Both competitors host the audio themselves. They have to — vendor-hosted storage is what makes
per-playback metering possible. We do not meter playback, so we should not inherit the drawback that
comes with it.

**The question that decides it for the customer:** *what happens to my audio when I stop paying?*

| | GSpeech / ResponsiveVoice | AtlasVoice |
|---|---|---|
| Where the MP3 lives | Vendor servers | **Customer's own server** |
| Stop paying | Every listen button goes dead | **Everything keeps playing forever** |
| Per-play metering | Yes | No — generate once, unlimited plays |
| Vendor outage | Site audio is down | Audio unaffected (only new generation pauses) |
| Customer's text retained by vendor | Yes | No (§A5 — deleted within ~20 min) |

Segment reality, stated honestly:

| Segment | Prefers | Why |
|---|---|---|
| Casual blogger / small site | Slight edge to vendor-hosted | Doesn't think about disk; "nothing on my server" *feels* simpler, and writable-folder problems never arise |
| Serious publisher (500+ posts) | **Ours, decisively** | Owns the asset, no meter, works with their CDN, survives vendor death |
| Agency / client sites | **Ours, decisively** | Cannot hand a client a site that breaks when a subscription lapses |
| Very high traffic | Vendor-hosted or CDN | Bandwidth genuinely matters at scale |

Cost of our model on the customer's host — a 2,000-word post ≈ 13 minutes of audio ≈ **~6 MB** at
64 kbps mono, or **~3 MB** at 32 kbps (fine for speech). So 200 posts ≈ 0.6–1.2 GB, and 1,000 plays/month
≈ 3–6 GB of their bandwidth. Noticeable on small shared hosting, not fatal. Mitigations: encode at
**32–48 kbps mono**, generate **on first play** rather than for every post, and offer the offload below.

**Their model's four real advantages — no customer disk, no customer bandwidth, no backup bloat, no
writable-folder support tickets (`TTA_Helper::is_audio_folder_writable()` exists precisely because of
this) — are all already answered by Pro's existing Google Cloud Storage backup.** That feature is
GSpeech's storage model, available to us as an *option* rather than a constraint.

So we ship what neither competitor can:

- **Free / default** — the customer's server. Their files, theirs forever.
- **Pro option** — offload to cloud/CDN (existing GCS backup) for small hosting or heavy traffic.
- **The customer chooses, and can switch later without losing anything.**

Positioning line for the wp.org page and the Pro sales page:

> **Your audio, on your server, yours forever. Generate once — play unlimited, with no per-listen meter
> and nothing to keep paying for.**

---

## 5. Component A — AtlasVoice Cloud service (new)

### A1. Hosting

- A CPU VPS (shared hosting cannot run ONNX runtimes). Start at 2–4 vCPU / 4 GB.
- Piper runs ~2× faster than realtime on a **single** CPU core and fits in 1–2 GB RAM; Kokoro-82M
  (~80 MB ONNX) also runs CPU-only. No GPU required for launch.
- **Runtime: Python.** Both engines are Python-native (Kokoro is PyTorch/ONNX; `Kokoro-FastAPI` ships as
  a Python Docker image), and everything we will want next is Python-side too — chunking, phonemization,
  voice catalogues, and especially **forced alignment for the TTS-256 word-timing sidecars** (WhisperX,
  aeneas, MFA are all Python). Choosing Node would add an HTTP hop or a shell-out for no benefit and
  would push word timings into a second service.
- **Reuse option, decided in Phase 1, not Phase 0:** the existing `gtts.atlasaidev.com` Node service
  already implements quota, file serving and the ~20-minute cleanup. The lowest-risk production shape may
  be Node as the front door calling the Python engine over localhost. Phase 0 runs pure Python.
- **Disk:** small. Audio is transient (§A5) — do not buy a large-SSD plan.

### A2. Engines & voices

| Tier | Engine | Licence | Notes |
|---|---|---|---|
| Standard (Free plan) | **Piper** VITS/ONNX | MIT | 30+ languages, 100+ voices, ~60 MB per voice, very fast on CPU |
| Premium (Pro plan) | **Kokoro-82M** | Apache-2.0 | Better prosody, ~80 MB, multi-language |

Curate a **fixed shortlist** per language (1 female + 1 male where available) rather than exposing all
100+ Piper voices — the free product needs a short list, not a catalogue.

### A3. Endpoints (v1)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/sites/register` | Issue a site key for a domain + owner email (opt-in flow from WP admin) |
| `GET`  | `/api/v1/config` | Plan, quota used/remaining, attribution flag, engine tier, voice catalogue ETag |
| `GET`  | `/api/v1/voices` | Voice catalogue for the key's tier (ETag-cached) |
| `POST` | `/api/v1/synthesize` | Text → MP3 (streamed). The only metered endpoint |
| `POST` | `/api/v1/sites/disconnect` | Revoke a key from the WP side |

`/api/v1/config` mirrors ResponsiveVoice's `/v2/config` probe: called from PHP on the admin side, cached
in a transient (5 min) **plus** a durable last-known-good option so the front end never has to make a
network call and a failed probe never wipes a working configuration.

### A4. Auth & abuse control

- **Site key**, issued free, **bound to the registering domain**; sent as `X-AtlasVoice-Key`.
- The key is a **public site identifier, not a secret** (it ships in the site's own requests) — same
  posture as ResponsiveVoice. Security comes from domain binding + quota + rate limits, not secrecy.
- Rate limits per key and per source IP; hard cap on characters per single request; key revocation.
- Reject requests whose `Origin`/registered domain does not match the key.

### A5. Quota (the answer to "how do we cap the free tier")

- **Enforced only on the server.** Never in the plugin — a client-side counter is trivially bypassed,
  and shipping a limiter inside free plugin code is exactly the trialware pattern that got us closed
  under wp.org guidelines 5/6 (see `TTS-249-guideline-5-6-trialware-fix.md`).
- **Metered at synthesis, not at playback.** Once the MP3 is on the customer's server, replays are
  invisible to us and free. This is the core economic difference from ResponsiveVoice.
- **Audio is transient on our side; only the quota ledger persists.** Our VPS is a *generation buffer,
  not storage* — the same pattern the existing Pro `gtts.atlasaidev.com` service already uses, where the
  generated MP3 is deleted by a cleanup routine roughly 20 minutes after creation. We therefore keep only
  `hash + character count + timestamp` per synthesis (a few bytes), never the text and never the audio.
  A repeat request after the file has been cleaned up is **re-synthesized but not re-charged**. This
  resolves what would otherwise be a contradiction between the retention rule and the dedupe rule below.
  Two consequences: **disk is a non-issue** (a few GB, not hundreds — do not pay for storage when sizing
  the VPS), and we get a marketing line neither competitor can match — *"your text and audio are deleted
  from our servers within 20 minutes; we keep a character count and nothing else."*
- **Dedupe key** `sha256(normalised_text + voice_id + speed)` per site key: a regenerate of unchanged
  content returns the cached object and does **not** re-charge quota.
- **Monthly reset** per site key, calendar month, plan row in the service DB (`free`, `pro`, `unlimited`).
- **Over quota → HTTP 429** with a machine-readable reason. The plugin then falls back to player 1 and
  shows an admin notice ("monthly limit reached — resets on the 1st"). **Playback never breaks for the
  visitor.**

### A6. Attribution / branding (the answer to "how do we do the credit")

- **Attribution is tied to who produced the audio, not to who paid.**
  - Audio produced by AtlasVoice Cloud → response carries `attribution: true` → the player renders a
    small "Voiced by AtlasVoice" credit.
  - Audio produced by the customer's own Google / OpenAI / ElevenLabs key (Pro, BYOK) → we contributed
    nothing → **no credit at all, with no removal logic anywhere in the code.**
- The flag is **served, not stored by the plugin**: it arrives in the synthesis response and is persisted
  next to the file entry so the front end can render without another network call.
- A paid AtlasVoice Cloud plan simply receives `attribution: false` from the server for that key — same
  mechanism, zero plugin changes, and **no licence check inside the free plugin**.
- Accept that CSS can hide the credit. ResponsiveVoice's free-plan branding is client-side too. An audio
  watermark or spoken outro would damage the product; the credit is goodwill attribution, not DRM.

### A7. Synthesis response contract

```json
{
  "ok": true,
  "audio_url": "https://voice.atlasaidev.com/o/<hash>.mp3",
  "format": "mp3",
  "voice": "en_US-amy-medium",
  "engine": "piper",
  "duration": 412.5,
  "chars_charged": 11840,
  "quota": { "used": 48210, "limit": 250000, "resets": "2026-08-01" },
  "attribution": true,
  "cached": false
}
```

Errors use a stable `code` (`quota_exceeded`, `invalid_key`, `domain_mismatch`, `rate_limited`,
`text_too_long`, `engine_error`) so the plugin can decide between fallback and a notice.

Long posts are chunked server-side and returned as a single concatenated MP3 (same approach the Pro
players already use), so the plugin stores one file per post.

---

## 6. Component B — Free plugin (`text-to-audio`)

### B1. New player id 7 — "AtlasVoice Cloud"

- Ids 1–6 are taken (1 Free, 2–6 Pro). Free registers **id 7** into the existing
  `tts_available_players` registry (`TTA_Helper::get_available_players()`), so the React customize UI
  picks it up with no new plumbing.
- `get_player_id()` (`includes/helpers.php`) already falls back to player 1 for any id without a
  registered implementation — so an unconnected site, a disabled service or a revoked key degrades to
  player 1 through the mechanism that already exists. **Do not add a new gate.**

### B2. Shared audio-player base class (the OOP reuse surface)

Free currently has **no** audio-element playback path at all — Plyr and all MP3 handling live only in Pro.
This ticket introduces the generic layer **in Free**, and Pro's providers extend it:

- **PHP:** `includes/players/TTA_Audio_Player.php` — resolve the cached MP3 for a post, enqueue the
  player assets, emit the markup, expose the attribution flag. Pro's provider players extend this class
  instead of carrying their own copies.
- **JS:** `admin/js/tts/audio-player-base.js`, exposed as `window.AtlasVoiceAudioPlayer` — playback,
  progress, speed, iOS unlock, highlight-driver attach points. This mirrors the precedent already set by
  the highlighting work, where Free owns the base painter and exposes it as `window.AtlasVoiceHighlighter`
  for Pro's drivers (see `TTS-256-highlight-follow-ups.md`).
- **Rule:** no `window.*` one-off globals and no copy-paste of Pro's `plyr.js` into Free. One class,
  inherited.

### B3. REST routes (namespace `tta/v1`, `api/TTA_Api_Routes.php`)

| Route | Method | Purpose |
|---|---|---|
| `/cloud/connect` | POST | Register the domain, store the returned site key |
| `/cloud/status` | GET | Plan, quota, attribution, voice list (from cached config probe) |
| `/cloud/synthesize` | POST | Generate + store the MP3 for a post id |
| `/cloud/delete` | POST | Delete a post's cached MP3 |
| `/cloud/disconnect` | POST | Revoke the key and clear local settings |

All five reuse the existing `get_route_access()` permission callback (nonce + capability). No new
permission logic.

### B4. Storage & data model

| Key | Type | Purpose |
|---|---|---|
| `tta_cloud_settings` | option | `{ site_key, plan, attribution, engine, voice_id, quota_snapshot, connected_at }` |
| `tta_cloud_config_store` | option | Durable last-known-good `/config` probe (survives transient expiry) |
| `tta_cloud_config_<hash>` | transient | 5-minute probe cache |
| `tts_mp3_file_urls` | post meta | **Reuse the existing Pro key.** Free writes the same structure |
| `tts_is_mp3_file_url_exists` | post meta | Existing flag, reused |

Files land in the existing audio uploads folder (`TTA_Helper::is_audio_folder_writable()` already checks
writability and the dashboard already surfaces the failure).

### B5. Generation trigger

- **On demand at first play** (visitor clicks Listen, no MP3 yet → REST call → generate → play), plus
- **On publish/update** as an optional setting, and a **"Generate audio" button** in the post meta box.
- Reuse the existing `mp3_generation_lock__post_id__{id}` lock convention so concurrent requests for the
  same post do not double-charge quota.

### B6. Fallback chain (never break playback)

1. Cached MP3 exists → play it.
2. No MP3, connected, quota available → synthesize, store, play.
3. Not connected / 429 / 5xx / offline / folder not writable → **player 1 (`speechSynthesis`)**, exactly
   as today, with an admin-side notice explaining why.

### B7. Admin UI

- New **"AtlasVoice Cloud"** panel in the dashboard: a one-click Connect (email + domain), plan and quota
  meter, voice picker, "regenerate this post" action, and a plain-language explanation of what is sent.
- Setup wizard gets one extra optional step offering the connect.
- The plugin must remain **fully functional with the panel untouched** — player 1 stays the default until
  the owner connects.

### B8. wp.org compliance (non-negotiable)

- **Opt-in before any external contact.** No request to AtlasVoice Cloud before the owner clicks Connect.
  Guideline: *"Plugins may not contact external servers without explicit and authorized consent."*
- **`== External services ==`** section in `readme.txt` naming the endpoints, exactly what is sent (post
  text, site key, domain), when, and linking our Terms + Privacy Policy. ResponsiveVoice's readme section
  is a good template — they pass review with this pattern.
- **No trialware, no licence gate in free code.** The plugin must not disable working features to sell
  Pro. All limits live server-side; the plugin only reacts to a 429.
- MP3s are stored **locally on the customer's site**, not served from our CDN, so we are not "offloading
  assets to remote services".
- Pair with the `wordpress-plugin-guidelines` skill during implementation and run Plugin Check before release.

---

## 7. Component C — Pro plugin (`text-to-audio-pro`)

**BYOK stays BYOK.** Google, OpenAI and ElevenLabs remain strictly the customer's own API key, billed to
their own account. We never pay a character for those providers. Nothing in this ticket changes that.

Changes required in Pro:

1. **Player 3 backend swap** — repoint `TTA_PRO_GTTS_API_URL` at the new AtlasVoice Cloud service and
   the Kokoro (premium) tier. Same request/response shape, cheaper and better engine. Keep the existing
   filter (`tts_pro_gtts_api_url`) so the change is reversible per site.
2. **Inherit the new Free base classes** — players 3–6 extend `TTA_Audio_Player` /
   `window.AtlasVoiceAudioPlayer` instead of duplicating playback code. Deleting Pro-side duplication is
   part of the ticket, not a follow-up.
3. **Plan row** — Pro site keys are issued from the same service with a `pro` plan (high or uncapped
   quota, `attribution: false`, Kokoro tier).
4. **Word-timing sidecars unchanged** — players 4 and 6 keep provider timing. Piper/Kokoro output has no
   word timing at launch, so player 7 is **sentence-level** highlighting (Phase 2 candidate: forced
   alignment server-side to emit the same `{title}.json` sidecar contract).
5. **Lockstep release** — shared option/meta schema changes ship in both plugins in the same release, per
   the cross-plugin rule.

---

## 8. Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| **0 — PoC** (days) | One VPS, Piper + Kokoro installed, one endpoint, generate the MP3 for one real post in EN + one non-Latin language. Throwaway code. | We have listened to the output and accepted the quality; measured generation time per 1k chars; measured cost under a simulated 20-concurrent load. |
| **1 — Service** | Real service: keys, quota, dedupe, rate limits, `/config`, `/voices`, `/synthesize`, admin/ops dashboard. | Endpoints stable and documented; abuse controls tested; monitoring + alerting live. |
| **2 — Free plugin** | Player 7, base classes, REST routes, admin panel, connect flow, fallback chain, readme disclosure. | Passes Plugin Check; verified on the full browser/device matrix; works fully with Pro inactive. |
| **3 — Pro refactor** | Player 3 repoint, inheritance cleanup, plan rows, lockstep release. | No duplicated playback code; players 3–6 regression-clean; BYOK untouched. |
| **4 — Launch** | wp.org release, changelog/upgrade notice, docs, in-dashboard announcement to existing installs. | Adoption + churn tracked against the pre-launch baseline. |

Recommendation: **do not skip Phase 0.** If Piper's quality disappoints we lose days, not weeks.

---

## 8.1 Phase 0 — PoC specification (gate before any plugin code)

**Nothing in the free or Pro plugin is written until this gate passes.** Phase 0 answers three
questions only: *does it sound good enough, is it fast enough, and what does the server cost?*
All Phase 0 code is throwaway — no plugin files, no repo branches for the plugins.

**Timebox: 3–5 working days.**

### 8.1.1 VPS sizing

Piper needs ~1–2 GB RAM and runs ~2× faster than realtime on a **single** CPU core; Kokoro-82M
(~80 MB ONNX) is heavier but still CPU-only. Start small and measure — do not buy a GPU box.

| Option | Spec | Indicative cost/month | Notes |
|---|---|---|---|
| **Start here** | 2–4 vCPU / 4 GB / 40–80 GB SSD | ~$10–25 | Enough for Piper + Kokoro + a small queue. Hetzner CPX-class is the cheapest credible option; DigitalOcean/Vultr cost more but are simpler to operate. |
| If concurrency is the bottleneck | 8 vCPU / 16 GB | ~$40–60 | Only if the measurements below say so |
| Not needed at launch | any GPU instance | — | Piper/Kokoro are CPU-viable; revisit only for a much larger model |

Prices are indicative — **verify at purchase time**. Pick a region close to the majority of our
customer sites (check the tracker data for the top countries before choosing).

Also record: bandwidth allowance (MP3s leave the box once, at generation time) and whether the host
throttles sustained CPU (some cheap VPS plans are burst-only, which would silently ruin the numbers).

### 8.1.2 Setup

> **Which engine is the free tier is NOT pre-decided — Phase 0 decides it by measurement.**
> §3 of this plan frames Piper as the free tier and Kokoro as premium, but
> [`../research/research-opensource-tts-models.md`](../research/research-opensource-tts-models.md)
> (2026-04-15) independently ranked **Kokoro first** on quality and noted that `Kokoro-FastAPI` ships a
> Docker image exposing an **OpenAI-compatible** `/v1/audio/speech` endpoint. If that holds up, starting
> from it removes most of the Phase 1 API surface work — build the throwaway endpoint around it rather
> than hand-rolling one. Settle the free-vs-premium engine split from the numbers and the listening test.

1. Provision the VPS, plain Ubuntu LTS, no panel.
2. Stand up **Kokoro** first, ideally via the ready-made `Kokoro-FastAPI` Docker image
   (`POST /v1/audio/speech`, OpenAI-compatible), since that is also the shape Pro's provider code
   already speaks.
3. Install **Piper** alongside it (ONNX runtime + the `piper` binary) with a small voice set — English
   (US + UK), one Latin-script European language, and **one non-Latin-script language** (e.g. Hindi,
   Arabic or Chinese) so we test the hard case, not just English. Check the current `rhasspy/piper-voices`
   catalogue for the exact voice ids and the `low` / `medium` / `high` quality tiers.
4. Expose both behind one throwaway HTTP endpoint: `POST /synth {text, engine, voice}` → MP3, so the two
   engines are compared on the same box with the same text. No auth, no quota, no database — that is
   Phase 1's job.
5. Encode output as MP3 (mono, 22.05 kHz, ~64 kbps) so the file-size numbers match what the plugin
   would really store.

### 8.1.3 Test corpus

Use **real content**, not lorem ipsum — pull three posts from a live site:

- a short post (~500 words),
- a long post (~2,000 words / ~12,000 characters),
- one post in a non-Latin script.

Plus one text deliberately full of the things TTS gets wrong: numbers, currency, dates, acronyms,
URLs, and a couple of the pronunciation aliases customers already use in `tta_alias_settings`.

### 8.1.4 Measurements to record

| Metric | How | Why it matters |
|---|---|---|
| Seconds per 1,000 characters | Time a single synthesis run per engine/voice | Drives per-post generation time and server sizing |
| Real-time factor (audio seconds ÷ CPU seconds) | Derived from the above | Comparable across hardware |
| Full-post generation time | The 12,000-character post, end to end | Must be tolerable for on-demand first-play |
| Time to first audio byte | If streaming is wired | Decides whether Phase 1 needs streaming or can return a finished file |
| Peak RSS per worker | `/usr/bin/time -v` or `ps` during a run | Sets how many workers fit in RAM |
| Concurrency ceiling | Ramp 1 → 5 → 10 → 20 parallel requests | The real capacity number |
| p95 latency at the ceiling | From the load run | Where quality of service breaks |
| MP3 bytes per minute of audio | `ls -l` on the output | Storage growth on customer sites |
| Cold start | First request after boot | Whether we need a warm pool |
| Stability | 200 consecutive requests | Memory must stay flat, zero crashes |

### 8.1.5 Quality evaluation (the part that actually decides this)

Numbers are the easy half. Listen properly:

1. Generate the same paragraph with **Piper**, **Kokoro**, the visitor's **`speechSynthesis`** on a
   mid-range Android phone, and one **Pro provider** (ElevenLabs or Google) as the upper bound.
2. Compare blind, on phone speakers — not studio headphones. That is how our visitors listen.
3. Judge: is it clearly better than a bad device voice? Is it acceptable to listen to for 8 minutes
   straight? Does the non-Latin language sound like a native speaker or like a machine reading letters?
4. Check the hard cases from §8.1.3: numbers, dates, currency, acronyms, aliases.

### 8.1.6 Go / no-go checklist

Phase 1 starts only when **every** line is ticked:

- [ ] Piper (or Kokoro) output is clearly better than a poor device voice and acceptable as our default.
- [ ] The non-Latin-script language is intelligible and correctly pronounced.
- [ ] A 12,000-character post generates in a time we are willing to make a visitor wait for on first
      play — or streaming closes the gap.
- [ ] The chosen VPS handles our target concurrency with p95 latency inside budget.
- [ ] 200 consecutive requests: no crash, no memory growth.
- [ ] Projected monthly server cost for the first 12 months of expected free-tier volume is inside budget.
- [ ] We have decided which engine is the **Free** tier and which is the **Pro** tier.

### 8.1.7 If the gate fails

- **Piper quality too low** → ship Kokoro as the free tier too and re-run the cost numbers.
- **Both too slow on CPU** → move generation off the request path entirely (queue + "your audio is
  being prepared"), or re-price to a bigger box.
- **Both quality-fail** → reopen the alternatives in §3: client-side WASM as a private mode, or a
  paid managed API for the free tier at ~$0.70 per million characters with a tighter quota.

### 8.1.8 Deliverable

A short results file — `plan/tickets/TTS-266-phase0-poc-results.md` — containing the measurement
table filled in, the audio samples (or links), the cost projection, and a one-line **GO** or **NO-GO**
with the date and the reason. That file is what unblocks Phase 1.

---

## 9. Cost model

- Marginal cost is **CPU seconds**, not licence fees — Piper is MIT, Kokoro is Apache-2.0.
- Metered per post, not per play, and deduped by content hash → a site with 200 posts costs us ~200
  synthesis runs total, then approximately nothing.
- Reference point for "what per-character would have cost": managed Kokoro APIs run ~$0.65–0.80 per
  million characters; ResponsiveVoice resells at $9/5M → $149/250M with $5 per extra million. Self-hosting
  removes that line entirely.
- Storage sits on the **customer's** server, so our storage cost is limited to the dedupe cache.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| We now own infrastructure and uptime for a free product | Fallback chain §B6 means an outage degrades to today's behaviour, never to silence. Monitoring + alerting in Phase 1. |
| Abuse — someone scripts our free endpoint | Domain-bound keys, per-key/per-IP rate limits, request size cap, revocation, quota. |
| Piper quality below expectation | Phase 0 gate. Kokoro is the fallback engine choice; worst case the free tier ships Kokoro too and we accept the CPU cost. |
| Disk growth on customer sites | Cleanup on post delete, a "delete audio" action, and a documented regeneration policy. |
| Cannibalising Pro | Free = standard voices + capped quota + credit; Pro = BYOK premium providers, unlimited, bulk MP3, GCS backup, per-word highlighting, no credit. |
| wp.org rejection | Opt-in flow, external-services disclosure, zero licence gating, Plugin Check before submission. |
| No word timing from Piper/Kokoro | Ship player 7 sentence-level; forced alignment is a Phase 2 enhancement using the existing sidecar contract. |

## 11. Test matrix

- **Browsers/OS:** Chrome + Edge + Firefox on Windows; Safari + Chrome on macOS; Safari on iOS 17/18/26;
  Chrome + Samsung Internet on Android; Android WebView; Facebook/Instagram in-app browsers.
- **States:** not connected · connected under quota · exactly at quota · over quota (429) · service down
  · uploads folder not writable · key revoked · Pro active · Pro inactive with a stale player id.
- **Content:** short post, 5,000-word post, non-Latin script (Arabic/Chinese/Hindi), shortcode-only
  fragment, ACF/CPT content, a page builder layout.
- **Cross-plugin:** Free alone; Free + Pro with a BYOK provider selected; switching player 7 → 4 → 7
  (remember: after every player switch, set the matching voice + language in Listening).

## 12. Open questions

1. Free-tier quota size — characters/month, or posts/month (posts/month is easier for a blogger to
   understand)? Proposal: **250,000 characters/month per site** (≈ 20 average posts), reset monthly.
2. Do we sell a paid AtlasVoice Cloud tier standalone, or is our engine bundled only into Pro?
3. Domain for the service — `voice.atlasaidev.com`, or extend `gtts.atlasaidev.com`?
4. Do we migrate the existing player-3 traffic to the new engine immediately, or run both for one release?
5. Do we mirror ResponsiveVoice's `POST /voices/report` idea (collecting visitor voice lists) to improve
   the `speechSynthesis` fallback? **Recommendation: no** — extra privacy surface for a path we are
   trying to move users off.

## 13. References

- Competitor source studied: `wp-content/plugins/responsivevoice-text-to-speech` (v2.0.3) —
  `includes/AssetManager.php`, `includes/ConfigClient.php`, `includes/SdkRuntime.php`,
  `includes/WebPlayerEngine.php`, `build/core.js`.
- Existing in-house service: `TTA_PRO_GTTS_API_URL` → `https://gtts.atlasaidev.com/api/gtts`
  (`text-to-audio-pro/includes/TTA_Pro_Constants.php`).
- Player registry + capability fallback: `includes/helpers.php` → `get_player_id()`,
  `TTA_Helper::get_available_players()`, filter `tts_available_players`.
- Related plans: `TTS-249-guideline-5-6-trialware-fix.md`, `TTS-256-highlight-follow-ups.md`,
  `free-pro-architecture-pattern.md`.
- Competitor free/Pro models (ResponsiveVoice + GSpeech, source-read):
  [`../research/research-competitor-free-pro-models.md`](../research/research-competitor-free-pro-models.md).
  Confirms the cloud + cache pattern is what both competitors run, and carries the open
  subscription-vs-bundled pricing decision that should be settled before Phase 1.
- Engine shortlist and deployment notes:
  [`../research/research-opensource-tts-models.md`](../research/research-opensource-tts-models.md).
- Engines: Piper (MIT, VITS/ONNX, 30+ languages), Kokoro-82M (Apache-2.0, ~80 MB ONNX).
