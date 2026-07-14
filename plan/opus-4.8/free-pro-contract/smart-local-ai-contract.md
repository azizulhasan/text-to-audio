# Smart Local AI — Free ↔ Pro Contract

> **Contract 3 of 4.** Siblings: `atlasvoice-contract.md` · `ar-contract.md` ·
> `smart-local-ai-contract.md` (this) · `atlasai-connector-contract.md`. Keys/hooks below are
> Smart-Local-AI-specific (`atlas_ai_*` / `atlasai_*`) and do NOT apply to the other plugins.

> **Status: DRAFT — verified against source, but review before adopting.**
> Free: `smart-local-ai` (v1.0.6, prefix `atlas_ai_`/`atlasai_`) · Pro: `smart-local-ai-pro` (v2.0.0, Freemius premium add-on).
> Pro touches Free **only through hooks + a few public statics** — it extends **no** Free PHP classes.
> Pro's premium value is almost entirely **PersonaFlow behavioral signals** (Pro adds signals; it does not replace the ML engine).

---

## 1. How to use
Before editing: **"Does Pro read, write, or override this?"** Pro wires everything in
`class-atlas-ai-pro-loader.php` (the authoritative wiring point) — check it first.

## 2. Shared option keys (wp_options)

| Key | Owner | Coupling |
|---|---|---|
| `atlas_ai_settings` | Free | Master settings / module toggles; Pro reads |
| `atlas_ai_modules` | Free | Module enable state |
| `atlas_ai_pro_settings` | Pro | Pro flags (`enable_negative_signals`, `enable_social_signals`, `enable_session_context`, thresholds) — gates each bridge hook |
| `atlas_ai_pro_license` | Pro | License (uninstall cleanup) |
| `atlas_ai_onboarding_completed`, `atlas_ai_version` | Free | Free lifecycle |

## 3. Shared DB tables / post meta

| Object | Owner | Boundary use |
|---|---|---|
| `{prefix}atlasai_events` | Free | Pro reads heavily (Analytics, Cron, REST, negative signals) |
| `{prefix}atlasai_user_profiles` | Free | Free writes taste vectors; Pro session reads |
| `{prefix}atlasai_embeddings` / `atlasai_similar_posts` / `atlasai_personalized_cache` | Free | Free-only (RelevantFlow) |
| `{prefix}atlasai_user_exclusions` | **Pro** | Created by Pro AND injected into Free's create-table routine via `atlas_ai_personaflow_tables` filter |
| post meta `_atlas_ai_needs_embedding` | Free | Free-only |

## 4. Filter/action bridge (Free fires → Pro hooks)

Free advertises "12 extensibility points"; Pro wires them in the loader.

| Hook (Free fires) | Pro handler | Gated by |
|---|---|---|
| `atlas_ai_personaflow_signal_types` (f) | +77 Pro signals | always |
| `atlas_ai_personaflow_signal_weight` (f) | reweight scoring | always |
| `atlas_ai_personaflow_tracker_config` / `_tracker_js_data` (f) | social selectors / session context | flag-gated |
| `atlas_ai_personaflow_recommendation_query` / `_recommendation_results` (f) | exclusion penalty / filter results | `enable_negative_signals` |
| `atlas_ai_personaflow_event_stored` (a) | process negative signals | `enable_negative_signals` |
| `atlas_ai_personaflow_profile_computed` (a) | session aggregates | always |
| `atlas_ai_personaflow_tables` (f) | inject `atlasai_user_exclusions` DDL | always |
| `atlas_ai_personaflow_cron_schedules` (f) | Pro cron schedules | always |
| `atlas_ai_render_bulk_alttext` / `atlas_ai_enqueue_bulk_alttext` (a) | AltGenius Pro bulk-scan UI | global |

Highest-value: the two `recommendation_*` filters + `signal_types` / `signal_weight` — the PersonaFlow extension surface.

## 5. Shared classes / constants / detection
- **Pro calls Free statics:** `Smart_Local_AI::get_instance()`, `->get_module('personaflow'|'altgenius')`, `$module->is_enabled()`/`get_settings()`, `AtlasAI_REST_API::NAMESPACE` (`atlas-ai/v1`).
- **Free constants Pro consumes:** `ATLAS_AI_VERSION` (presence = "Free active" guard), `ATLAS_AI_PATH`, `ATLAS_AI_URL`.
- **No inheritance:** Pro signal classes are standalone (no `extends` of Free classes).
- **Detection:** Freemius (shared id `25926`, add-on model, `is_premium_only`) + `plugins_loaded` prio 20 + `defined('ATLAS_AI_VERSION')` + `can_use_premium_code()`.

## 6. JS / ML runtime coupling
`src/shared/ml-runtime.js` + `model-cache.js` exist **only in Free**. Pro ships only behavioral trackers
(`pro-tracker.js`, `pro-wc-tracker.js`, `pro-admin-sections.js`) — **no ML runtime**. Pro reuses Free's
compiled assets by URL (`ATLAS_AI_URL . 'build/…'`). ⚠ This means **Pro breaks if Free's build output
paths change** — treat `ATLAS_AI_URL . 'build/…'` asset paths as part of the contract.

## 7. Rules
1. Check the Pro loader first. 2. Don't rename `atlasai_*` tables/columns without checking Pro's readers.
3. Free build-asset URLs are a contract surface (Pro loads them). 4. Pro only extends PersonaFlow — keep new
premium signals on that seam, not in the ML engine. 5. Boundary = public API.
