# TTS-262 — Remote Promotions Feed: Manual Test Cases

> Feed: `https://raw.githubusercontent.com/atlasaidev/plugins/main/text-to-audio-promotions.json`
> (currently `[]` — verified live). **Between every JSON change, clear the 12h cache:** search the
> `wp_options` table for `%cached_promos%` and delete that `_transient_*` row (or WP-CLI:
> `wp transient delete <slug>_cached_promos`). GitHub raw also caches ~5 min — wait after pushing.

## Test promo JSON (use for T2–T10)

```json
[{
  "start": "2026-07-01 00:00:01",
  "end": "2026-12-31 23:59:00",
  "hash": "tts262-test-001",
  "dismissible": 1,
  "audience": "all",
  "content": "<h3>TTS-262 test promo</h3><p>If you can read this, the feed works.</p>",
  "button": { "label": "Open demo", "url": "https://atlasaidev.com/plugins/text-to-speech-pro/demo/?utm_source=plugin&utm_medium=notice&utm_campaign=tts262test" }
}]
```

## Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| T1 | **Empty feed baseline** (current state) | Load wp-admin dashboard + plugin settings page; check `debug.log` | No notice anywhere, no PHP warnings/errors |
| T2 | **Promo renders** | Push test JSON → clear transient → reload wp-admin | Notice shows (heading, text, button) on dashboard AND other admin pages, styled, no layout break |
| T3 | **Button** | Click the button | Opens demo URL in new tab, UTM params intact |
| T4 | **Per-user dismissal** | Click X → reload → check other admin pages; then log in as a *second* admin user | AJAX succeeds; hidden everywhere for user 1 (persists across reloads); user 2 still sees it |
| T5 | **Audience: pro on free-only site** | Set `"audience": "pro"`, clear transient, Pro plugin DEACTIVATED | Notice hidden |
| T6 | **Audience: pro with Pro active** | Activate Pro, clear transient | Notice shows; also verify `"audience": "free"` is then hidden |
| T7 | **Date window** | Set `end` in the past (then `start` in the future), clear transient each time | Hidden in both cases |
| T8 | **Cache behavior** | Change JSON content WITHOUT clearing transient | Old content persists (expected, 12h TTL) — documents the ops rule |
| T9 | **Malformed/unreachable feed** | Temporarily point `set_source()` to a 404 URL (or invalid JSON in feed) | No fatal, no notice, admin works; recovers after fix + transient clear |
| T10 | **kses safety** | Add `<script>alert(1)</script>` inside `content` | Script stripped, no alert, rest renders |
| T11 | **Non-dismissible guard** | Remove `"dismissible"` from the promo | Renders WITHOUT an X (confirms the campaign rule: always set `dismissible:1` — never ship without it) |
| T12 | **Insights separation** | With Pro active | Promotions still run (intended per TTS-262), while free insights stay suppressed |

## After testing
Reset the feed to `[]` on GitHub, clear the transient, and delete the test dismissal row
(user option `<slug>_hidden_promos`) if you want a clean slate.
