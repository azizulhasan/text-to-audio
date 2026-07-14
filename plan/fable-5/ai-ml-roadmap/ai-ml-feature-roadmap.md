# AtlasAiDev — Company-Wide AI/ML Feature Roadmap (Fable 5 take)

> **DRAFT.** Scope: all four products (free+Pro). Tagline: *"We build applications for a better
> experience with AI."* Goal: AI integrator → AI product builder.

## 0. What we own (grounded)

| Product | AI today | Layer |
|---|---|---|
| AtlasVoice | ElevenLabs / Google / Azure TTS, MP3+GCS | Voice |
| AtlasAR | Tripo3D + Meshy (text/image→3D), MediaPipe landmarks | Vision & 3D-gen |
| AtlasAI Connector | OpenAI/Gemini/Claude via WP AI Client, MCP server, 80+ abilities | Cloud gateway |
| Smart Local AI | Transformers.js — MiniLM embeddings, ViT-GPT2/Florence-2 captioning, WebGPU | On-device / private |

Four silos that happen to be the four layers of one AI platform. The question is not *whether* to
connect them but **in what order, at what risk**.

## 1. The sequencing decision — feature first, core second

The obvious architectural move is "build a shared AtlasAI Core library first, then everything plugs in."
I recommend the reverse for a solo founder:

**Ship one thin, cross-product, AI-native feature first — and let it *force* the minimal core into
existence. Then extract.**

Why:
- A core built before its second consumer exists is guesswork; you'll design abstractions the real
  features don't want (classic platform trap, fatal at solo scale).
- A shipped feature produces revenue signal *now*; a library produces none until something uses it.
- WP 7.0 just shipped a **provider-agnostic AI Client + Abilities API in core**. Building your own
  provider manager today means maintaining a parallel copy of what core gives every plugin free.
  **Adopt core's AI Client as the provider layer; only build what core lacks** — the embeddings
  service, the local/cloud router, and cross-product glue.

## 2. The first feature: "Ask & Listen" (recommended)

One flagship slice that touches three products and is demo-able in a sentence:

> A visitor asks a question on any post; Smart Local AI retrieves the answer on-device (embeddings/RAG);
> the Connector's LLM composes it (via core AI Client); **AtlasVoice speaks it.**

- Accessibility + AI + voice in one flow — wp.org is actively promoting accessibility.
- Forces exactly the shared pieces the platform needs: an embeddings interface, a local/cloud
  decision point, and a cross-plugin call convention. Extract those *afterwards* as AtlasAI Core v0.1.
- Each piece already exists; this is integration work, not research.

## 3. The core (extracted, not designed up-front)

AtlasAI Core v0.1 = what "Ask & Listen" proves it needs, roughly:
1. **Embeddings service** — Smart Local AI's MiniLM vectors behind one interface (all products consume).
2. **Local/cloud router** — on-device when possible (free, private), core AI Client → cloud when needed.
3. **Ability conventions** — track WP core's Abilities API; expose each product's abilities through the
   Connector's MCP so external agents can drive the whole suite.
4. Free/Pro discipline preserved: Core stays generic; each Pro extends via filters (see the four contracts).

## 4. Per-product follow-ons (after the slice ships)

- **AtlasVoice:** AI pronunciation suggestions · TL;DR audio summaries · translated speech (Polylang
  bridge) · interactive voice Q&A (the slice, productized).
- **AtlasAR:** auto image→3D from WooCommerce product photos (Meshy) · landmark-driven auto-fit to kill
  manual calibration · body/hand tracking → watches/rings/apparel.
- **Connector:** ship the stubbed Automation Recipes / Support Desk · semantic ability retrieval via the
  embeddings service · confidence-scored auto-fix. **Fix the license stub before investing further.**
- **Smart Local AI:** stronger captioners (SmolVLM/Moondream ONNX) · multilingual embeddings ·
  in-browser LLM (WebLLM) for private summaries/search.

## 5. Phasing

| Phase | What | Exit test |
|---|---|---|
| P1 | "Ask & Listen" thin slice (3 products, hardcoded glue is fine) | A visitor hears an AI answer on a real site |
| P2 | Extract AtlasAI Core v0.1 from the working slice | Second consumer (e.g. AR product-Q&A) uses it unchanged |
| P3 | MCP-expose all products through Connector | An external Claude/ChatGPT agent drives AtlasVoice + AR |
| P4 | Per-product H1 features on the core | Each release note names a Core-powered feature |
| P5 | Bundle/platform pricing | One "AtlasAI" tier sold across products |

> ⚖ Divergence from Opus 4.8 — the main one this session. Opus: **build the shared core first**
> ("highest-leverage item; everything compounds on it"). Fable: **ship one cross-product feature
> first and extract the core from it**, and **adopt WP 7.0's AI Client rather than building a provider
> layer at all**. Same destination (one platform, four faces); different bet on how a solo founder
> gets there without stalling in infrastructure. Both agree the embeddings service + local/cloud
> router are the pieces core WordPress won't give you.
