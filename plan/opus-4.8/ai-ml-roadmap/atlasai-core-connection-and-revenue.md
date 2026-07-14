# AtlasAI Core — How the Plugins Connect + Why It Grows Revenue

> **Status: DRAFT / discussion notes — to talk through later.** Companion to
> [ai-ml-feature-roadmap.md](ai-ml-feature-roadmap.md). Captures two Q&A discussions:
> (1) *how* the shared AtlasAI Core connects the four products, and (2) *why* that grows revenue
> and improves day-to-day work.

---

## Part 1 — How the four plugins connect (the shared AtlasAI Core)

1. **Extract one shared "AtlasAI Core" library.** The AI Connector already has a multi-provider manager
   (OpenAI/Gemini/Claude) and Smart Local AI already has an on-device embeddings engine — lift those two
   into a single reusable package that all four plugins load, instead of each rebuilding AI plumbing.

2. **Route every AI call through one decision point.** A "local-first, cloud-when-needed" router: use
   Smart Local AI's on-device inference for free/private work, and fall back to the Connector's cloud
   providers only when quality or size demands it.

3. **Share one embeddings service.** The same MiniLM vectors Smart Local AI generates power semantic
   search, related content, and RAG across *all* products (e.g. AtlasVoice answering reader questions,
   AtlasAR matching similar 3D products).

4. **Expose each plugin's abilities through the Connector's MCP server.** AtlasVoice, AtlasAR, and Smart
   Local AI become tools external agents (Claude/ChatGPT) can drive — turning the whole suite into one
   AI-controllable surface.

5. **Keep it free/Pro-clean.** The Core stays generic (a shared base library or must-install base plugin),
   and each product's Pro plugin extends it, respecting the boundary discipline the four contracts document.

> **Through-line:** one AI brain (providers + embeddings + router), four product "faces"
> (voice, vision/AR, automation, on-device) — a platform instead of four plugins.

---

## Part 2 — How this grows revenue + improves daily work

1. **Build once, sell four times.** Every AI feature added to the shared Core (a new provider, a better
   embedding, a summarizer) instantly upgrades all four products — one week of work creates four products'
   worth of new Pro selling points instead of one.

2. **Daily bug-load drops.** Instead of maintaining four separate AI plumbings (four sets of keys, rate
   limits, model handling), you fix and improve *one* Core — fewer of the cross-plugin breakages that eat
   your days now.

3. **Stronger Pro conversion.** "Local-first, cloud-when-needed" is a real, unique upgrade story (private
   AI free, premium cloud AI in Pro) — a clear reason to pay in each plugin, lifting free→Pro conversion
   across the suite.

4. **Bundle / platform pricing becomes possible.** Once connected, you can sell an "AtlasAI" bundle or
   higher tier (all products + cross-plugin features) at a higher price point than four standalone plugins,
   raising average revenue per customer.

5. **Cross-plugin features create lock-in.** When AtlasVoice speaks an AI answer that Smart Local AI
   retrieved on a product AtlasAR displays, customers who own several plugins get compounding value and are
   far less likely to churn.

6. **Faster shipping = faster revenue.** With the Core handling the hard AI parts, your limited solo hours
   go to features customers actually pay for — releases (and the revenue they drive) come more often.

7. **The tagline finally sells.** "We build applications for a better experience with AI" becomes literally
   demonstrable — strengthening marketing, reviews, and wp.org positioning, the top of the funnel that
   feeds every plugin's revenue.

> **Bottom line:** the Core turns effort from *linear* (one plugin at a time) into *leveraged*
> (one improvement → four products) — the single biggest lever a solo founder has to grow revenue
> without adding hours.
