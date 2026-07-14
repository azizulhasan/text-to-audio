# Smart Local AI — Free ↔ Pro Contract (Fable 5 take)

> **DRAFT · Contract 3 of 4.** Free `smart-local-ai` ↔ Pro `smart-local-ai-pro` (Freemius add-on,
> product id 25926). Verified against source this session.

## The shape of this boundary (different from the other three products)

Pro extends **no PHP classes** and ships **no ML runtime**. It is a pure **hook consumer**: everything
is wired in `class-atlas-ai-pro-loader.php` (read that file first, always), and Pro's entire premium
value is **extra PersonaFlow behavioral signals** (+77) layered onto Free's engine.

Two consequences that ARE the contract:

1. **Free's DB is Pro's API.** Pro reads `{prefix}atlasai_events` and `atlasai_user_profiles` heavily
   (analytics, cron, REST, negative signals). Schema changes = Pro breakage.
2. **Free's build output is Pro's runtime.** Pro loads Free's compiled JS by URL
   (`ATLAS_AI_URL . 'build/…'`) — it has no ml-runtime of its own. **Renaming a bundle in Free's build
   silently breaks Pro.** Treat build paths as public API.

## Shared options

`atlas_ai_settings` (Free master; Pro reads) · `atlas_ai_modules` · `atlas_ai_pro_settings`
(Pro flags: `enable_negative_signals`, `enable_social_signals`, `enable_session_context` — each gates a
bridge hook) · `atlas_ai_pro_license` · `atlas_ai_onboarding_completed` / `atlas_ai_version`.

## Shared DB

Free-owned, Pro-read: `atlasai_events`, `atlasai_user_profiles`.
Free-only: `atlasai_embeddings`, `atlasai_similar_posts`, `atlasai_personalized_cache`, meta `_atlas_ai_needs_embedding`.
**Pro-owned but installed through Free:** `atlasai_user_exclusions` — its DDL is *injected into Free's
table-creation routine* via the `atlas_ai_personaflow_tables` filter. Unusual pattern; don't refactor
Free's activator without preserving that filter.

## Hook bridge (Free fires → Pro loader hooks)

Signals: `atlas_ai_personaflow_signal_types` (+77) · `_signal_weight`.
Recommendations: `_recommendation_query` · `_recommendation_results` (both gated by negative-signals flag).
Tracking: `_tracker_config` · `_tracker_js_data` (flag-gated). Events: `_event_stored` (action) ·
`_profile_computed` (action). Infra: `_tables` · `_cron_schedules`. AltGenius Pro UI:
`atlas_ai_render_bulk_alttext` / `_enqueue_bulk_alttext`.

## Pro's touchpoints into Free PHP

`Smart_Local_AI::get_instance()` → `get_module('personaflow'|'altgenius')` → `is_enabled()` /
`get_settings()`; constant probes `ATLAS_AI_VERSION` / `ATLAS_AI_PATH` / `ATLAS_AI_URL`;
REST namespace constant `atlas-ai/v1`. These statics/constants are contract surface.

## Rules

1. Loader first. 2. `atlasai_*` schema is API. 3. Build filenames are API. 4. New premium value goes on
the PersonaFlow hook seam — don't let Pro grow tendrils into the ML engine.

> ⚖ Divergence from Opus 4.8: same findings; Fable elevates the two structural facts (DB-as-API,
> build-output-as-API) from list items to the **organizing principle** of the contract, since they're
> the two ways this product will actually break.
