# Tracker DB pull — 2026-07-11

Source: `azizyzjn_tracker` MySQL DB behind **track.atlasaidev.com** (cPanel phpMyAdmin).
Rows with `id < 26635` in tracking/details belong to **another company (WebAppick / WooCommerce
Product Feed)** and are permanently excluded — they are NOT AtlasAiDev data.

## Files

| File | Filter applied | Rows | Notes |
|---|---|---|---|
| `tracking.csv` | `id >= 26635` | **5,614** | Installs w/ consent. Max id **37124**. Date range 2023-09-02 → 2026-07-11. |
| `tracking-details.csv` | `tracking_id >= 26635` | 5,384 | Serialized PHP `log` payloads (version, server, theme, plugins). |
| `uninstall-reasons.csv` | none (all rows) | **14,851** | Max id **15087**. Deactivation/uninstall feedback. |
| `subscribers.csv` | none (all rows) | **6** | "🔊 Stay Updated" form (atlasvoice-email-capture plugin). Max id **32**. |

## Per-plugin (tracking installs, id ≥ 26635)
Text To Speech TTS 5,066 · AtlasVoice 466 · Text To Speech Pro 36 · AtlasAR 29 · AR Try-On 7 ·
Atlas AI Connector 6 · Smart Local AI 3 · AtlasAR Pro 1

## Per-plugin (uninstall reasons, all-time)
Text To Speech TTS 13,666 · AtlasVoice 1,127 · TTS Pro 27 · AtlasAR 14 · Connector 7 · SLAI 6 · AR Try-On 3

## ⚠ NEXT PULL — incremental only (watermark 2026-07-11)

Never re-download everything. Next time query only:
- `wpxr_plugin_tracking`: `WHERE id > 37124`
- `wpxr_plugin_tracking_details`: `WHERE tracking_id > 37124`
- `wpxr_plugin_tracking_uninstall_reason`: `WHERE id > 15087`
- `wpxr_plugin_subscribers`: `WHERE id > 32`

Method notes: enter cPanel via Namecheap → Hosting List → "GO TO CPANEL" (SSO; direct cpsess URLs
expire fast). Launch phpMyAdmin from cPanel's launcher before deep-linking. **Never export the full
`tracking_details` table** (317 MB, mostly WebAppick) — always filter by tracking_id first.
