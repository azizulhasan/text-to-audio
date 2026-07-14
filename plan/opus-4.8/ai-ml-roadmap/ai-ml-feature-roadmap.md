# AtlasAiDev — Company-Wide AI/ML Feature Roadmap

> **Status: DRAFT — for review, not adopted.** Revise before acting.
> Scope: all **four** products (each free + Pro), not just AtlasVoice.
> Tagline: **"We build applications for a better experience with AI."**
> Purpose of this doc: move the company from *AI integrator* → *AI product builder*, and turn four
> separate plugins into one connected AI platform.

---

## 0. The four products (grounded)

| Product | What it is | AI it already uses | AI layer it represents |
|---|---|---|---|
| **AtlasVoice** (`text-to-audio` / `-pro`) | Text-to-speech accessibility player | ElevenLabs, Google/Azure TTS, MP3/GCS | **Voice / audio AI** |
| **AtlasAR** (`ar-vr-3d-model-try-on` / `-pro`) | 3D product view + AR try-on | Tripo3D, Meshy (text/image→3D), MediaPipe face tracking, model-viewer | **Vision + 3D-generation AI** |
| **AtlasAI Connector** (`ai-workflow-automation-ai-agent-hub` / `-pro`) | Turns WP into an MCP server + block-editor AI toolkit; 80+ abilities | OpenAI, Google Gemini, Anthropic Claude (via WP AI Client) | **Cloud-AI backbone / gateway** |
| **Smart Local AI** (`smart-local-ai` / `-pro`) | Privacy-first, in-browser ML (related posts, alt-text, personalization) | Transformers.js (MiniLM embeddings, ViT-GPT2 / Florence-2 captioning), WebGPU/WASM | **On-device / private-AI backbone** |

**The strategic realization:** you already own a cloud-AI gateway, an on-device inference engine, a
voice engine, and a vision/3D engine. They are currently four silos. The roadmap's core bet is to
**connect them** so each product is more valuable because the others exist.

---

## 1. Strategic thesis

Three horizons, applied to every product:

- **H1 — Make each product genuinely AI-native** (deepen the AI already there).
- **H2 — Build a shared AtlasAI core** (one reusable AI infrastructure, not four copies).
- **H3 — Cross-product intelligence** (features that only exist because you own all four).

"Better experience with AI" becomes true when AI is the *core* of each product, not a bolted-on API call.

---

## 2. H2 first — the shared AtlasAI core (the senior architectural move)

Do this early; everything else compounds on it. One clean reuse surface (a class/library), same
free↔Pro discipline as the existing plugins — **generic in free, premium extensions in Pro.**

1. **Unified AI Provider layer** — AtlasAI Connector's provider manager (OpenAI/Gemini/Claude) already
   exists. Extract it into a shared library the *other three* plugins can call, so AtlasVoice/AR/SLAI
   don't each re-implement key management, model selection, rate limits.
2. **Unified embeddings service** — Smart Local AI already generates MiniLM embeddings on-device.
   Expose it as the company's embedding primitive (semantic search, related content, RAG) reusable everywhere.
3. **Local-vs-cloud router** — one decision point: run on-device (private, free, SLAI) when possible,
   fall back to cloud (Connector) when quality/size demands. This *is* the differentiator no competitor has.
4. **Shared MCP surface** — expose AtlasVoice / AtlasAR / Smart Local AI abilities as MCP tools through
   the Connector, so external agents (Claude, ChatGPT) can drive all your plugins.

> This is the single highest-leverage item in this document. It converts four products into a platform.

---

## 3. Per-product roadmap (H1)

### AtlasVoice — voice/audio AI
- **Near-term:** AI-generated pronunciation/alias suggestions; auto-summary "TL;DR audio" of a post (uses Connector LLM); smart sentence/segment splitting via ML for natural prosody.
- **Mid-term:** voice cloning / brand voice (Pro); multilingual auto-translation + speak (bridge to Polylang); emotion/emphasis-aware reading.
- **AI-native leap:** "conversational article" — reader asks a question, AI answers in the site's voice (RAG over post + Connector + TTS). Voice becomes interactive, not just playback.

### AtlasAR — vision + 3D AI
- **Near-term:** auto image→3D from existing WooCommerce product photos (Meshy `image_to_model`) to bootstrap catalogs with zero modeling.
- **Mid-term:** landmark-driven auto-fit/occlusion (kills manual per-product calibration — today's Pro pain); expand try-on beyond face (MediaPipe Hands/Pose → watches, rings, apparel).
- **AI-native leap:** ML "does it fit / size advisor" using AR real-world dimensions + body tracking; generative material/texture variants from a text prompt.

### AtlasAI Connector — cloud gateway
- **Near-term:** ship the stubbed **Automation Recipes / Support Desk** (comment summarization, reply drafting, ticket triage) — high value, already scaffolded.
- **Mid-term:** semantic retrieval of abilities/content (use the shared embeddings service) so agents pick the right tool by meaning, not static lists.
- **AI-native leap:** true agentic multi-step workflows with confidence-scored auto-remediation (Error Debugger closes the loop).

### Smart Local AI — private on-device AI
- **Near-term:** stronger captioners (Moondream/SmolVLM ONNX) for AltGenius; multilingual embedding model for RelevantFlow.
- **Mid-term:** small in-browser LLM (WebLLM) for on-device summaries, SEO meta, semantic search box — all private, no API cost.
- **AI-native leap:** PersonaFlow becomes a real learned session model (next-item prediction) instead of hand-weighted signals.

---

## 4. Cross-product plays (H3 — the moat)

Features that only you can build because you own all four:

1. **Private-first AI, cloud-when-needed** — Smart Local AI handles embeddings/captioning on-device for
   free & GDPR-safe; Connector escalates to cloud LLMs only when needed. A unique selling line.
2. **Accessible AI answers** — RAG (Connector) + on-device embeddings (SLAI) generate an answer, AtlasVoice
   speaks it. Accessibility + AI + voice in one flow.
3. **AR + AI content** — AtlasAR shows the 3D product; Connector auto-writes the description; AtlasVoice
   narrates it; SLAI recommends related products. One product page, four plugins.
4. **One AtlasAI dashboard** — shared settings/telemetry/onboarding brand surface across all four (reuse
   the setup-wizard blueprint already in `plan/roadmap/`).

---

## 5. Phasing & priority (solo-founder realistic)

| Phase | Focus | Why |
|---|---|---|
| **P1 (now)** | Shared **AI Provider layer** + **embeddings service** (§2.1, §2.2) | Foundation; stops re-building the same AI plumbing 4×. |
| **P2** | One AI-native leap in the **strongest revenue product** (likely Connector automations or AtlasVoice conversational) | Prove the tagline; drive Pro conversion. |
| **P3** | Local-vs-cloud router + shared MCP surface (§2.3, §2.4) | The differentiator competitors can't copy. |
| **P4** | Cross-product plays (§4) | The moat; sell the platform, not plugins. |
| **P5** | Per-product H1 depth, product by product | Continuous improvement. |

**Rule:** every new AI feature should ask — *can this reuse the shared core?* If it needs a new
provider/embedding/model path, that path belongs in the shared core, not in one plugin.

---

## 6. Open questions to decide before building
1. Which product earns the first AI-native leap? (Recommend: **AtlasAI Connector** — infra already there.)
2. Is "private-first, cloud-fallback" the company's headline positioning? (Recommend: **yes** — unique.)
3. Build the shared core as a bundled library, a must-install base plugin, or a Composer package?
4. Cost model — who pays for cloud inference (BYO key vs. metered Pro)?

> Draft. Revise, then we can turn any single phase into its own ticket + implementation plan.
