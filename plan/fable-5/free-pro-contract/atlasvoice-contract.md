# AtlasVoice — Free ↔ Pro Contract (Fable 5 take)

> **DRAFT · Contract 1 of 4.** Free `text-to-audio` ↔ Pro `text-to-audio-pro`.
> Everything listed is a **public API between two shipping plugins**: renaming, re-shaping, or
> re-ordering any of it is a breaking change requiring a check of the other repo first.
> Option/meta tables came from grep — **verify owners and shapes before adopting** (deferred TODO).

## Riskiest surfaces first

Ranked by how often changes here have actually broken the other plugin (TTS-260, TTS-261, voice/language bugs):

1. **`tta_listening_settings`** — Pro's generation depends on voice+language stored here; a player
   switch without matching voice = invalid-voice failures. Treat as the #1 fragile key.
2. **The content pipeline filters** — `tta_before_clean_content` → `tta_clean_content` →
   `atlasvoice_after_clean_content`: Pro injects/transforms content through these; order and argument
   changes ripple straight into what gets spoken.
3. **`tta_should_load_button`** — gates whether the player exists at all; every "button missing on X"
   bug routes through here.
4. **Wrapper/marker emission** — `tts_emit_legacy_wrapper`, `tts_free_emit_atlasvoice_markers`:
   markup Pro (and themes like Avada) depend on.

## Shared option keys (wp_options)

`tta_settings_data` (post types/exclusions/mode) · `tta_customize_settings` (button appearance) ·
`tta_listening_settings` (voice+language — Pro-critical) · `tta_highlight_settings` (TTS-256; off = old
behavior) · `tta_analytics_settings` · `tts_text_aliases` · `tta_compatible_data` ·
`tta__button_text_arr` · `tta_onboarding_completed` / `tta_pro_onboarding_completed`.

## Shared post meta

- `tts_pro_custom_css_selectors` — **written by Pro, read by Free** (`TTA_Helper`, `RuleResolver`,
  `RestRoutes`). The one meta key that crosses the boundary in both directions of dependency.
- `tts_mp3_*` — Pro's generated-MP3 references; Free surfaces status via `tts_post_has_mp3`.

## Filter bridge (Free fires → Pro hooks)

Premium gates: `tts_is_pro_active` · `tts_is_atlasvoice_addon_functional` · `tts_get_player_id` ·
`tts_post_has_mp3` · `tts_pro_plugins_data` · `tts_reduce_enqueue` · `tts_button_inline_handles`.
Content seams: `atlasvoice_player_content` · `atlasvoice__text_before_content` / `__text_after_content` ·
the clean-content chain above. Rendering: `tta_should_load_button` · `tts__listening_button` ·
`tts_button_with_content` · wrapper/marker filters.

## Rules

1. Grep Pro before touching anything above. 2. New capability = new filter, never a changed signature.
3. Both changelogs record boundary changes. 4. Default/off paths must behave exactly as before.

> ⚖ Divergence from Opus 4.8: same facts; Fable leads with a **risk ranking derived from the actual
> bug history** instead of a category listing — the contract should tell you where you'll get burned,
> not just what exists.
