# AtlasAI Connector (AI Agent Hub) — Free ↔ Pro Contract

> **Contract 4 of 4.** Siblings: `atlasvoice-contract.md` · `ar-contract.md` ·
> `smart-local-ai-contract.md` · `atlasai-connector-contract.md` (this). Keys/hooks below are
> Connector-specific (`awfah_*`) and do NOT apply to the other plugins.

> **Status: DRAFT — verified against source, but review before adopting.**
> Free: `ai-workflow-automation-ai-agent-hub` (namespace `AtlasAiDev\Awfah\`) · Pro: `…-pro`.
> Coupling is **one-directional** (Pro reads Free; Free never references Pro), via `awfah_*` filters + shared options.
> Abilities use a **duck-typed static contract** (`::get_abilities()`, `::register()`) — no base class/interface.
> Pro bootstraps on `plugins_loaded` priority 20.

---

## 1. How to use
Before editing a shared class/filter: **"Does Pro read or override this?"** Pro plugs in via two insertion
points — the `awfah_module_class_map` and `awfah_ability_classes` filters. Check both first.

## 2. Shared option keys (wp_options)

| Key | Owner | Coupling |
|---|---|---|
| `awfah_settings` | Free | Master settings incl. `modules[]`; Pro reads via `Plugin::get_settings()` |
| `awfah_oauth_settings` | Free | OAuth config; Pro `OAuth_Policy` reads directly |
| `awfah_saved_workflows` | Free | Workflow storage; count gated by `awfah_max_workflows` |
| `awfah_backups` | **Pro** (`Backup_Manager::OPTION_KEY`) | Debug-fixer backups; Free UI lists via `awfah_backups_list` |
| `awfah_mcp_settings`, `awfah_rbac_initialized`, `awfah_jwt_secret_key`, `wp_ai_client_provider_credentials`, `awfah_ai_preference` | Free | MCP/RBAC/JWT/provider creds; Pro consumes indirectly |

## 3. Shared classes (extension points Pro plugs into)

| Free class (`AtlasAiDev\Awfah\…`) | How Pro uses it |
|---|---|
| `Plugin::get_settings()` / `get_module_class_map()` | Read module state; `awfah_module_class_map` injects Pro ability classes |
| `Service\AI_Provider_Manager::generate_text_with_usage()` | Pro `Debug_Fixer_Abilities` calls directly (**no subclassing**) |
| `Service\Error_Tracker::instance()` | Auto-fix pulls error groups |
| `Abilities\Debug_Log_Abilities::execute_get_error_source()` | Auto-fix source retrieval |
| Ability convention (static `get_abilities`/`register` + `wp_register_ability`) | Pro `Store_Abilities`, `Debug_Fixer_Abilities` mirror it on `wp_abilities_api_init` |
| `Prompts\Prompt_Registry` (`awfah_prompt_builder_classes`) | Pro appends 6 prompt builders |

## 4. Filter / action bridge (Free fires → Pro hooks; premium gates)

| Hook | Fired in Free | Gates |
|---|---|---|
| `awfah_max_workflows` | `Workflows_Controller` | **Unlimited workflows** (Pro → PHP_INT_MAX) |
| `awfah_enable_external_abilities` | `Plugin`, `Resource_Registry` | External abilities |
| `awfah_enable_debug_fixer` | debug UI | AI debug fixer |
| `awfah_ability_classes` | `Abilities_Controller` | Pro abilities in Access-Control listing |
| `awfah_module_class_map` | `Plugin` | RBAC resolution incl. Pro abilities |
| `awfah_auto_fix_execute` | `Settings_Controller` | **Auto-fix** handler |
| `awfah_error_webhook_dispatch` | `Error_Email_Notifier` | Slack/Discord webhooks |
| `awfah_error_email_fix_command` | `Error_Email_Notifier` | Rich MCP fix command |
| `awfah_oauth_authorize_allowed` / `awfah_oauth_effective_scope` | `Authorize_Controller` | **Per-role OAuth policy + scope** |
| `awfah_backups_list` / `_delete` / `_delete_all` / `_restore` | Menu / `Settings_Controller` | Backup management |
| `awfah_version_label` | Menu | Pro version label |

Pro also registers `awfah_oauth_ability_scope_map` / `_required_scope` (Scope_Access) and gates MCP via
`mcp_adapter_list_tools` / `mcp_adapter_can_call_tool` (T/R/P per-ability RBAC).

## 5. MCP / ability registry
No central registry object — abilities register through WP core `wp_register_ability()` on
`wp_abilities_api_init`. Free's `Plugin::get_module_class_map()` + `get_available_mcp_abilities()` is the
effective map; `awfah_module_class_map` + `awfah_ability_classes` are the two Pro insertion points.

## 6. Dependency mechanism / constants
- **Hard dep:** header `Requires Plugins: ai-workflow-automation-ai-agent-hub`; runtime guard
  `if ( ! defined('AWFAH_VERSION') ) return;` before `Pro::instance()`.
- **Freemius:** shared `awaaah_fs()` (product id `25508`, free slug + `premium_slug`).
- **Constants:** `AWFAH_VERSION` (Free, dependency probe); Pro-owned `AWFAH_PRO_VERSION`, `AWFAH_PRO_PLUGIN_DIR/URL`.
- ⚠ **Flag:** `License\License_Manager::is_valid()` is a **stub returning `true`** ("will be replaced with Freemius") — licensing not yet enforced beyond plugin-active check.

## 7. Rules
1. Free never references Pro — keep it that way (one-directional). 2. New premium capability = a new `awfah_*`
filter in Free + Pro handler, not a Free edit that assumes Pro. 3. `AI_Provider_Manager` static methods are a
contract surface (Pro calls them). 4. Boundary = public API.
