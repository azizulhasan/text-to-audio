# AtlasAI Connector (AI Agent Hub) — Free ↔ Pro Contract (Fable 5 take)

> **DRAFT · Contract 4 of 4.** Free `ai-workflow-automation-ai-agent-hub` ↔ `…-pro`
> (namespace `AtlasAiDev\Awfah\`, Freemius id 25508). Verified against source this session.

## The cleanest boundary of the four — keep it that way

Coupling is strictly **one-directional**: Pro reads Free; **Free never references Pro**. Pro boots at
`plugins_loaded` 20 behind a `defined('AWFAH_VERSION')` guard. This is the architecture the other three
products should converge toward. The standing rule: *a new premium capability is a new `awfah_*` filter
in Free plus a Pro handler — never a Free edit that knows Pro exists.*

## Two insertion points (memorize these)

Pro enters through exactly two filters: **`awfah_module_class_map`** (injects Pro ability classes into
module/RBAC resolution) and **`awfah_ability_classes`** (adds Pro abilities to the access-control
listing). Everything else hangs off them.

## Shared options

`awfah_settings` (master, incl. `modules[]`; Pro reads via `Plugin::get_settings()`) ·
`awfah_oauth_settings` (Pro `OAuth_Policy` reads directly) · `awfah_saved_workflows` (count gated by
`awfah_max_workflows`) · `awfah_backups` (**Pro-owned**; Free lists via `awfah_backups_list`) ·
`awfah_mcp_settings` / `awfah_rbac_initialized` / `awfah_jwt_secret_key` /
`wp_ai_client_provider_credentials` / `awfah_ai_preference`.

## Extension surface (duck-typed, no base class)

Abilities follow a static convention — `::get_abilities()` + `::register()` via WP core
`wp_register_ability()` on `wp_abilities_api_init`. Pro's `Store_Abilities` / `Debug_Fixer_Abilities`
mirror it. Pro **calls** `AI_Provider_Manager::generate_text_with_usage()`, `Error_Tracker::instance()`,
`Debug_Log_Abilities::execute_get_error_source()` — static call surface, not inheritance.
`Prompt_Registry` accepts Pro's 6 builders via `awfah_prompt_builder_classes`.

## Premium gates

`awfah_max_workflows` (→ PHP_INT_MAX) · `awfah_enable_external_abilities` · `awfah_enable_debug_fixer` ·
`awfah_auto_fix_execute` · `awfah_error_webhook_dispatch` · `awfah_error_email_fix_command` ·
`awfah_oauth_authorize_allowed` / `awfah_oauth_effective_scope` · `awfah_backups_*` · `awfah_version_label`.
MCP-level RBAC: `mcp_adapter_list_tools` / `mcp_adapter_can_call_tool` (+ Pro's
`awfah_oauth_ability_scope_map` / `_required_scope`).

## ⚠ Flagged while exploring

- **`License_Manager::is_valid()` is a stub returning `true`** ("will be replaced with Freemius") —
  Pro licensing is currently *not enforced* beyond plugin-active. Business risk, not just tech debt:
  Pro features run unlicensed today. Prioritize before any paid-marketing push.
- The `awfah_oauth_ability_scope_map` consumer in Free wasn't located during exploration — verify the
  `apply_filters` site exists before relying on scope enforcement.

## Rules

1. One direction, forever. 2. Two insertion points — extend there, don't add new coupling styles.
3. `AI_Provider_Manager` statics are API. 4. WP 7.0 note: core now ships Abilities API / AI Client —
this contract's ability convention should track core's, not diverge from it.

> ⚖ Divergence from Opus 4.8: same facts; Fable (a) frames this boundary as the **reference
> architecture** for the other three products, and (b) upgrades the license stub from a flag to a
> named **business risk** with a priority attached.
