# AtlasAI Core — Connection & Revenue (Fable 5 take)

> **DRAFT discussion notes.** Companion to [ai-ml-feature-roadmap.md](ai-ml-feature-roadmap.md).
> Same two questions the Opus 4.8 version answered: (1) how do the four plugins connect,
> (2) why does it grow revenue and improve daily work.

## Part 1 — How the four connect (5 points)

1. **One flagship flow first, not a framework first.** "Ask & Listen" (SLAI retrieves → Connector
   composes → AtlasVoice speaks) is the connection, made visible to a customer on day one.
2. **WP core's AI Client is the provider layer.** Don't rebuild OpenAI/Gemini/Claude plumbing —
   WordPress 7.0 ships it. Wrap it once; spend the saved months on features.
3. **Smart Local AI becomes the company's embeddings/RAG service.** Its MiniLM vectors power related
   content, semantic search, and answer retrieval for every product — on-device, free, private.
4. **The Connector's MCP server becomes the suite's front door for agents.** AtlasVoice, AtlasAR, and
   SLAI register abilities there; external AIs (and your own automations) drive all four through one surface.
5. **The boundary discipline already written down (the four contracts) is the glue's rulebook** —
   cross-product calls go through filters/abilities, never direct class reach-ins, so free/Pro and
   wp.org compliance survive the integration.

## Part 2 — Why this grows revenue (7 points)

1. **A demo that sells itself.** "Your site answers questions out loud" is a one-sentence pitch no
   single competitor plugin can copy — it takes owning voice + RAG + gateway simultaneously.
2. **Build once, sell four times.** Every core improvement (better embeddings, new provider, router
   logic) upgrades all four Pro products' feature lists in the same release cycle.
3. **Less plumbing, more product.** Adopting core's AI Client instead of maintaining your own provider
   layer returns weeks per year of solo time — the scarcest resource in the company.
4. **Privacy is a paid feature.** "On-device first, cloud only when needed" converts GDPR-sensitive
   European buyers the pure-cloud competitors can't touch — a concrete Pro upgrade reason.
5. **Bundle pricing unlocks.** Connected products justify an "AtlasAI Suite" tier priced above the sum
   of individual licenses; suites also resist per-plugin churn.
6. **Agent-era distribution.** Once the suite is MCP-exposed, it's discoverable/usable by the AI agents
   WordPress itself says are becoming the web's builders — positioning money can't buy later.
7. **Compounding lock-in.** Each additional Atlas product a customer activates makes the others better
   (shared answers, shared analytics, shared voice) — retention rises with attach rate.

> ⚖ Divergence from Opus 4.8: Part 2 is materially the same argument. Part 1 differs on sequencing
> (feature-first extraction vs core-first construction) and on point 2 — Fable says **don't build the
> provider layer at all**; WP 7.0 core just made it a commodity.
