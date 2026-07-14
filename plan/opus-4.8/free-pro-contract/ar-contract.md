# AtlasAR — Free ↔ Pro Contract

> **Contract 2 of 4.** Siblings in this folder: `atlasvoice-contract.md` · `ar-contract.md` (this) ·
> `smart-local-ai-contract.md` · `atlasai-connector-contract.md`. Keys/filters below are AtlasAR-specific
> (`ar_try_on_*` / `atlas_ar_*` / `ATLAS_AR_*`) and do NOT apply to the other plugins.

> **Status: DRAFT — verified against source, but review before adopting.**
> Free: `ar-vr-3d-model-try-on` (namespace `AR_TRY_ON\`) · Pro: `ar-vr-3d-model-try-on-pro` (`AR_TRY_ON_Pro\`).
> Coupling is almost entirely **filter-based**, not inheritance (Pro extends only one Free class).
> Treat every item as a public API — changing it = breaking change → note in BOTH changelogs.

---

## 1. How to use
Before editing a shared class/key/filter: **"Does Pro read, write, or override this?"** If yes → grep Pro first.
Pro's init signal is the **`atlas_ar_loaded` action** (`Pro_Bridge::register`) — most Pro behavior is wired there.

## 2. Shared option keys (wp_options)

| Key | Owner | Purpose / coupling |
|---|---|---|
| `ar_try_on_settings` | Free | Plugin-wide settings; Pro extends |
| `ar_try_on_compression_settings` | Free | Compression config; **written by BOTH** (`AR_TRY_ON_Compression` ↔ `AR_TRY_ON_Pro_Compression`) |
| `ar_try_on_analytics_settings` | Pro | Analytics defaults (Pro activator) |
| `is_ar_try_on_installed` | Pro | Pro handshake flag (set/deleted by Pro) |
| `ar_try_on_activated_at` | Free | Install timestamp |
| `active_plugins` (core) | both | Pro-detection fallback |

> ⚠ Flag: Pro `AR_TRY_ON_Pro_Notices` writes a `tts_pro_setup_notice_next_show_time` key — the `tts_` prefix looks copy-pasted from AtlasVoice. Possible bug; Pro-only, not a boundary key.

## 3. Shared post meta

| Key | Owner | Purpose |
|---|---|---|
| `ar_try_on_product_settings` | Free | **THE** per-product config blob; read/written across Free AND Pro face-addon. This is the real shared meta. |
| `_ar_try_on_model` | Free-domain | Read by Pro `AR_TRY_ON_Pro_Compression_Routes` |

> ⚠ The older bridge doc listed `ar_try_on_model_url`, `_hotspots`, `_variant_models`, `_calibration`, etc. — **not found in current code.** Live shared meta is the single `ar_try_on_product_settings` blob. Verify before relying on the stale keys.

## 4. Filter bridge (Free `apply_filters` → Pro `add_filter`)

| Filter | Fired in Free | Gates premium? |
|---|---|---|
| `atlas_ar_supported_formats` | `Helper` | ✔ fbx/obj/usdz |
| `atlas_ar_compression_method` | `Compression` | ✔ server-side compression |
| `atlas_ar_dashboard_settings_tabs` | `Helper` | ✔ Bulk/Analytics tabs |
| `atlas_ar_metabox_sections` | `Helper` | ✔ pro→editor sections |
| `atlas_ar_generation_supported_modes` | `Helper` | ✔ |
| `atlas_ar_tryon_snapshot_watermark` / `_snapshot_hd` | `Tryon` | ✔ HD / watermark-free |
| `atlas_ar_tryon_models` / `_worker_options` / `_free_product_limit` | `Tryon` | ✔ |
| `atlas_ar_qr_brand_label` | `Helper` | branding |
| `ATLAS_AR_version` / `ATLAS_AR_plugin_name` | root file | identity override |
| `ATLAS_AR_rest_route_access` | `Api_Routes` | REST access policy |
| `atlas_ar_loaded` (**action**) | Free bootstrap | **Pro-init signal** |

## 5. Shared classes / constants / detection
- **Detection:** `AR_TRY_ON_Helper::is_pro_active()` = `defined('AR_TRY_ON_PRO_VERSION')` OR `active_plugins` lookup.
- **Hard dependency:** Pro bails via `is_plugin_active('ar-vr-3d-model-try-on/…')` + `Requires Plugins` header.
- **Inheritance:** only `AR_TRY_ON_Pro_Cache extends AR_TRY_ON_Cache`. Everything else is filter-based.
- **Loading Free code:** Pro constant `AR_TRY_ON_PRO_FREE_VERSION_PATH` (+ `_ADMIN_PATH`, `_URL`) requires Free files.
- **Lockstep helpers:** `AR_TRY_ON_Helper` ↔ `AR_TRY_ON_Pro_Helper`; `libs/AtlasAiDev/` ↔ `Libs/AtlasAiDev/`.

## 6. REST namespaces
`ar_try_on/v1` (Free; Pro face-addon also registers into it) · `ar_try_on_pro/v1` (Pro compression routes).

## 7. Rules
1. Grep Pro first. 2. Prefer a new filter over changing a signature. 3. Note shape changes in both changelogs.
4. `ar_try_on_product_settings` is the crown-jewel shared blob — never change its shape without checking the Pro face-addon. 5. Boundary = public API.
