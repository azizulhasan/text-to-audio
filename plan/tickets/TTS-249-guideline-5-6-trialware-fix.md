# TTS-249 — Guideline 5/6 Trialware fix (§3.1 Primary blocker)

**Status:** Planned (design — not yet implemented)
**Closure ref:** `wp-closure-email.md` → "🔴 PRIMARY BLOCKER — Trialware and Locked Features"
**Scope:** Free `text-to-audio` **and** Pro `text-to-audio-pro` — one coordinated change.
**Skills to keep loaded while implementing:** `atlasvoice` (free/pro bridge + player system),
`wordpress-plugin-guidelines` (Guideline 5/6, escaping, REST). Pattern reference:
`free-pro-architecture-pattern.md`.

---

## Why this is the blocker

Items 1–18 of the closure (i18n, escaping, ABSPATH, REST permission, remote-asset bundling,
external-service docs, menu position, etc.) were handled under TTS-247. **The remaining structural
violation is Guideline 5 (Trialware) + 6 (Serviceware).** The free ZIP ships features that are
disabled until Pro is active. The wp.org team specifically flagged:

> `get_player_id` forces player 1 when no Pro license is active, the Pro demo player assets are
> shipped in this code, and several analytics/report routes/handlers return that they require Pro.

## The one rule (governs every change below)

> **Free must be 100% functional alone. Pro ADDS code that is not in the free ZIP — it never
> UNLOCKS code that is.** Free may only *advertise* Pro (links/badges), never ship a locked control.

Implementation strategy = the Yoast pattern (see `free-pro-architecture-pattern.md`):
- `is_pro_active()` = "Pro plugin present" (constant/dir check), used **only** for upsell visibility.
- Free has **no license gate** on any feature.
- Free exposes registries/filters; Pro **registers** players, routes, and UI through them.

---

## Trialware surfaces to remove (inventory)

| # | Surface | Where | Violation |
|---|---------|-------|-----------|
| A | `get_player_id()` clamps id>1 → 1 unless `is_pro_license_active()` | Free `includes/helpers.php` | License gate on a shipped feature |
| B | Player dropdown lists players 2–6 in the free bundle | Free `src/dashboard/.../Customize.js` | Locked controls advertised as usable |
| C | Pro demo player assets shipped in free | Free `admin/demos/player2/`, `admin/demos/player3/` (+ wizard demo audio from `cdn.openai.com`) | Pro-only code/assets in free ZIP + remote calls |
| D | Analytics/report routes that "require Pro" | Free `api/TTA_Api_Routes.php` (`heatmap_data`, `export_csv`, `export_pdf`, `save/get_schedule_report`, prev-period comparison) | Locked routes/handlers in free |
| E | `is_pro_license_active()` used for feature gating | Free `includes/helpers.php`, `TTA_Helper` | License concept inside the free plugin |

---

## Fix A — remove the license clamp from `get_player_id()`

**Free change.** In `includes/helpers.php` `get_player_id()`, delete:
```php
if ( ! is_pro_license_active() && $player_id > 1 ) { $player_id = 1; }
```
Replace with a **capability fallback** (NOT a license check): if the resolved id is not in the
registered available-players list, fall back to 1.
```php
$player_id = isset( $customize_settings['buttonSettings']['id'] ) ? (int) $customize_settings['buttonSettings']['id'] : 1;
$player_id = (int) apply_filters( 'tts_get_player_id', $player_id );
$available = array_keys( (array) apply_filters( 'tts_available_players', array( 1 => array() ) ) );
if ( ! in_array( $player_id, $available, true ) ) { $player_id = 1; }
return $player_id;
```

**Pro change.** None for this step (Pro keeps delegating to Free's `get_player_id()`).

**Free/Pro impact.** Free alone: only player 1 is ever available → fallback keeps it at 1 (same
result, compliant mechanism). Free+Pro: Pro registers 2–6 (Fix B) so saved ids survive. Pro removed
while id=3 saved: capability fallback → 1, no JS error.

**Test.** Free-only fresh; Free-only stale id=3; Free+Pro.

---

## Fix B — make the player list data-driven; gate in the UI

**Free change.**
1. Build the player registry server-side and localize into `ttsObj` (in `TTA_Admin`):
   ```php
   $players = apply_filters( 'tts_available_players', array(
       1 => array( 'id' => 1, 'label' => __( 'Default', 'text-to-audio' ) ),
   ) );
   // → ttsObj.availablePlayers
   ```
2. `src/dashboard/.../Customize.js`: render the selector from `ttsObj.availablePlayers` instead of
   the hardcoded 6. Add a **non-selectable upsell row** ("More players in AtlasVoice Pro" → pricing
   link) — a badge/link, never a disabled-but-listed functional option.
3. Rebuild: `npm run production`.

**Pro change.** `Includes/TTA_Pro_Filters.php` registers 2–6:
```php
add_filter( 'tts_available_players', function ( $players ) {
    $players[2] = array( 'id' => 2, 'label' => __( 'Default Pro', 'text-to-audio-pro' ) );
    $players[3] = array( 'id' => 3, 'label' => __( 'AtlasVoice TTS Pro', 'text-to-audio-pro' ) );
    $players[4] = array( 'id' => 4, 'label' => __( 'Google Cloud TTS', 'text-to-audio-pro' ) );
    $players[5] = array( 'id' => 5, 'label' => __( 'ChatGPT TTS', 'text-to-audio-pro' ) );
    $players[6] = array( 'id' => 6, 'label' => __( 'ElevenLabs TTS', 'text-to-audio-pro' ) );
    return $players;
} );
```
(Pro must also localize `availablePlayers` into its own object if its React bundle renders the
selector — confirm which bundle owns the customize tab when Pro is active.)

**Free/Pro impact.** Free shows player 1 + an upsell hint (no locked control). Pro shows 1–6. No
data migration — `buttonSettings.id` is unchanged.

---

## Fix C — remove Pro demo assets + remote demo audio from the free ZIP

**Free change.**
- Remove `admin/demos/player2/` and `admin/demos/player3/` from the free plugin and from the gulp
  `productionSrc` (they're Pro player demos).
- Welcome wizard / customize preview: stop loading remote demo audio (`cdn.openai.com/...`,
  `cdn...Chirp3...`). Free needs **no** demo audio files — player 1 preview uses live browser
  `speechSynthesis`; premium voices are advertised with an **upsell link** to the demo page on
  atlasaidev.com (see Decision 2). No bundled per-voice clips, no remote fetch.
- Rebuild bundles (`npm run production`), regenerate the wizard bundle.

**Pro change.** Ship the player2/player3 demos and any provider preview audio **inside Pro** (Pro
onboarding wizard), where premium previews legitimately belong.

**Free/Pro impact.** Free preview shows only what free does (player 1) + Pro upsell. Pro keeps full
provider demos. Also clears the Guideline-8 remote-call flags for `cdn.openai.com`.

**Note.** Cross-check with TTS-247 remote-asset remediation — some of this may already be partly
done; verify the wizard bundle no longer references `cdn.openai.com`.

---

## Fix D — move premium analytics/report routes out of the free plugin

**Free change.** In `api/TTA_Api_Routes.php`, **stop registering** the premium-only routes:
`heatmap_data`, `export_csv`, `export_pdf`, `save_schedule_report`, `get_schedule_report`, and the
previous-period comparison branch in `aggregated_insights`. Free keeps only the analytics it fully
implements (track, insights, aggregated_insights without prev-period, trend_data, latest_posts,
save/get_analytics_settings, geolocation-opt-in).
- React analytics tab: render premium widgets (heatmap, export buttons, scheduled reports,
  comparison) **only when present** — data-driven from an `availableAnalyticsFeatures` flag (same
  approach as the player registry), with an upsell card otherwise. No "requires Pro" stub responses.

**Pro change.** Pro registers those routes in its own `tta_pro/v1` namespace (or hooks
`rest_api_init` to add them to a Pro-owned namespace) and supplies the React widgets / enables them
via a localized capability flag.

**Free/Pro impact.** Free ships no locked route — the premium endpoints simply don't exist in the
free ZIP. Pro adds them when active. Verify the analytics React bundle degrades gracefully when the
Pro features/flags are absent.

---

## Fix E — redefine the Pro-detection semantics in Free

**Free change.**
- Keep `is_pro_active()` (Pro plugin present) — use it **only** to decide whether to show upsell UI,
  never to gate a free feature.
- Remove `is_pro_license_active()` from all **free** feature gating (only consumer was the
  `get_player_id()` clamp, removed in Fix A). The `tts_is_pro_license_active` filter may remain as a
  Pro-owned signal, but Free must not disable any free feature based on it.

**Pro change.** Pro may keep its own license logic for its own features (it's off wp.org). Today
`license_is_valid_callback()` returns `true`; that's Pro's concern, not Free's compliance.

**Free/Pro impact.** Free becomes license-agnostic (Yoast `is_premium()` == constant-presence
model). Pro behavior unchanged.

---

## Build & deploy steps

1. Free PHP edits (helpers.php, TTA_Admin, TTA_Api_Routes).
2. Free React edits (Customize.js player list + upsell; analytics tab feature flags). `npm run production`.
3. Remove demo dirs; update gulp `productionSrc`. Rebuild wizard bundle.
4. Pro edits (`TTA_Pro_Filters` player registry; Pro REST routes; Pro demos). `npm run production` in
   Pro; `npm run copyProButton` in Free if the pro-button bundle changed.
5. Deploy to test site (`copy:seven`), run Plugin Check, run the test matrix.

## Test matrix (must pass all)

1. **Free only, fresh, `WP_DEBUG=true`**: dropdown shows player 1 + upsell; player works via browser
   speechSynthesis; no premium routes registered; no remote demo audio; Plugin Check shows no
   trialware/remote findings.
2. **Free only, stale `id=3`** (Pro previously removed): falls back to player 1, no JS/PHP error.
3. **Free + Pro active**: dropdown shows 1–6; id 2 = Pro speech skin; id 3–6 = Plyr + MP3; premium
   analytics widgets + routes available; MP3 generation works.
4. **Pro deactivated mid-use**: no fatal; free degrades to player 1 + free analytics.

## Rollout / commit plan (per project conventions)

- Branch: continue on `feature/TTS-247` (or a new `feature/TTS-249` via git flow if preferred).
- Commits prefixed `TTS-249:`; no `Co-Authored-By`; short why-focused messages.
- Do NOT commit without explicit user approval.
- Bump Free `Version:` + readme `Stable tag:` for the SVN re-submission; reply on the closure thread.

## Decisions (confirmed by product owner)

**1. Free dropdown when Pro inactive** → show **player 1 + a non-selectable upsell hint** (link to
pricing). Confirmed.

**2. Free wizard / customize preview** → **no demo audio files in Free at all.** (One bundled sample
can't represent 6 players × many voices × many languages, and shipping per-voice premium MP3s in the
free ZIP is part of what was flagged.) Instead:
- **Player 1 preview = live browser `speechSynthesis`** — the preview speaks a sample sentence in the
  selected browser voice/language. Zero audio files; demos the actual free feature; multi-voice and
  multi-language for free out of the box.
- **Premium voices = upsell via a LINK**, not playback. Replace the per-provider remote demo audio
  with a link to the live demo page on `atlasaidev.com`. The guidelines explicitly allow links ("a
  link is preferred") and forbid embedding/calling the remote audio inside the plugin. So Free
  advertises premium voices with a link — it does not ship or fetch premium clips.
- **When Pro is active**, Pro supplies the real per-voice/per-language previews (its own assets or
  service, off wp.org — allowed).
- *Why not a CDN + readme note?* The readme "External services" disclosure (Guideline 6) is only for
  genuine **services** that do processing you can't do locally. A demo audio file is a **static
  asset** → Guideline 8 ("calling files remotely") requires it be local, and documentation does NOT
  create an exception. (Only GPL-compatible **fonts** may come from an approved CDN.)
- *Optional:* a single tiny local clip could be a fallback only for browsers lacking
  `speechSynthesis`, but it is not required.

**3. Premium analytics UI** → **Free HIDES premium widgets (upsell card only); Pro owns the
backend/routes.** Clarification on the wp.org concern: the directory review only inspects the
**free** plugin — it does not forbid the *Pro* plugin from injecting UI. So Pro injecting React/JS
into Free's admin page is allowed (Yoast does exactly this). But because you're unsure and want to
be safe, we take the conservative path:
- **Free** ships **no functional premium widget code** — only an upsell card where the premium
  widget would be, shown unless a capability flag (set by Pro) is present.
- **Pro** owns the premium REST routes (`tta_pro/v1`: heatmap, export CSV/PDF, scheduled reports,
  prev-period comparison) **and** provides the premium analytics UI — either injected into Free's
  mount point via Pro's own enqueued bundle, or as a Pro-owned section. Both are compliant; pick
  whichever is simpler at implementation time. The non-negotiable rule: the premium widget code is
  **absent from the free ZIP**.
