# AtlasAR — Free ↔ Pro Contract (Fable 5 take)

> **DRAFT · Contract 2 of 4.** Free `ar-vr-3d-model-try-on` ↔ Pro `ar-vr-3d-model-try-on-pro`
> (namespaces `AR_TRY_ON\` / `AR_TRY_ON_Pro\`). Verified against source this session.

## The one thing to remember

**Almost all coupling is filters + a single shared meta blob.** Pro extends exactly one Free class
(`AR_TRY_ON_Pro_Cache extends AR_TRY_ON_Cache`); everything else arrives through `atlas_ar_*` filters
after the **`atlas_ar_loaded` action** (Pro's init signal — check `Pro_Bridge::register` first).

## Crown jewel: `ar_try_on_product_settings` (post meta)

One blob holds the per-product config, read and written by Free **and** the Pro face-addon.
Never change its shape without checking both. ⚠ Older bridge docs list `ar_try_on_model_url`,
`_hotspots`, `_variant_models`, `_calibration` — **not found in current code; the docs are stale.**
Also shared: `_ar_try_on_model` (read by Pro compression routes).

## Shared options

`ar_try_on_settings` (Free master) · `ar_try_on_compression_settings` (**written by both** —
`AR_TRY_ON_Compression` ↔ `AR_TRY_ON_Pro_Compression`; the riskiest option) ·
`ar_try_on_analytics_settings` (Pro) · `is_ar_try_on_installed` (Pro handshake) · `ar_try_on_activated_at`.

## Filter bridge (premium gates marked ✔)

`atlas_ar_supported_formats` ✔ (fbx/obj/usdz) · `atlas_ar_compression_method` ✔ ·
`atlas_ar_dashboard_settings_tabs` ✔ · `atlas_ar_metabox_sections` ✔ ·
`atlas_ar_generation_supported_modes` ✔ · `atlas_ar_tryon_snapshot_watermark` / `_snapshot_hd` ✔ ·
`atlas_ar_tryon_models` / `_worker_options` / `_free_product_limit` ✔ · `atlas_ar_qr_brand_label` ·
`ATLAS_AR_version` / `ATLAS_AR_plugin_name` · `ATLAS_AR_rest_route_access`.

## Detection & loading

`AR_TRY_ON_Helper::is_pro_active()` = `defined('AR_TRY_ON_PRO_VERSION')` or active-plugins lookup.
Pro hard-depends via `is_plugin_active(...)` + `Requires Plugins` header, and loads Free files through
`AR_TRY_ON_PRO_FREE_VERSION_PATH` — **Free's file layout is therefore part of the contract.**
REST: `ar_try_on/v1` (Free + face-addon) · `ar_try_on_pro/v1` (Pro compression).

## ⚠ Flagged while exploring

Pro's notices write a **`tts_pro_setup_notice_next_show_time`** option — a `tts_` (AtlasVoice!) prefix
inside AtlasAR. Almost certainly copy-paste; harmless today, but it pollutes another product's
namespace. Worth a cleanup ticket.

## Rules

1. Check `Pro_Bridge::register` before changing any filter. 2. The meta blob's shape is sacred.
3. `ar_try_on_compression_settings` has two writers — coordinate. 4. Don't move Free files Pro requires.

> ⚖ Divergence from Opus 4.8: substantively identical (same source, same findings). Fable adds one
> contract rule Opus implied but didn't state: **Free's file paths are contract surface** because Pro
> `require`s them directly.
