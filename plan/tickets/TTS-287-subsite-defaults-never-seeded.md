# TTS-287 — Subsites created after network activation get no defaults, and render nothing

## The problem

`register_activation_hook()` fires once, for the site that activates the plugin. On a
network-activated multisite install, **every subsite created later starts with no
`tta_settings_data` and no `tta_customize_settings`**, so every option-driven gate in
`TTA_Helper::should_load_button()` reads an empty array and returns false.

The result: nothing renders on that subsite at all — not auto-insert, not the `[atlasvoice]`
shortcode, in staging or production, for admins or visitors. The plugin menu appears, the dashboard
loads and reports the right version, the mode indicator works, Go Live succeeds — so the site looks
installed and is silently inert.

## Reproduced

Found during 2.3.11 release testing on test.atlasaidev.com, 2026-08-27. Created a fresh subsite from
Network Admin with the plugin network-active:

- Only `tta-admin-bar.js` and its CSS enqueued; no player scripts, no `window.TTS`.
- `[atlasvoice]` returned empty rather than printing raw — registered but producing nothing.
- Reproduced four times: before saving settings, after saving settings, after switching to
  production, and via shortcode.
- Identical post content rendered correctly on the main site.

## Two wrong turns, recorded so nobody repeats them

**1. "Saving the Customization tab fixes it, so the customize option is the cause."** Saving that tab
did fix the site, which pointed at `display_player_based_on_date_range()` — it initialised its result
to `false` with every assignment inside `if (isset($customize['buttonSettings']) && ...)`, so a
missing option returned false and `should_load_button()` hit
`|| !$display_player_based_on_date_range`.

That default **is** wrong and was fixed (`3b655c41`): a date window that was never configured must
not be a reason to hide the player, and the same bug made a post with no `post_date` fall through to
false. But it is a correctness fix, **not the cause**.

**2. "So the per-gate default fix is enough; the seeding hook can wait."** Wrong, and the test proved
it. With `3b655c41` deployed and confirmed on the server (83 KB file vs 81 KB pre-fix), a fresh
subsite still rendered nothing, and saving the Settings tab alone did not help either. The reason:
**several independent options are missing at once**, not one. Making individual gates
default-permissive cannot cover that — the defaults have to exist.

## The fix

`text-to-audio.php`, beside the existing activation hook:

```php
add_action('wp_initialize_site', function ($new_site) {
    if (!function_exists('is_plugin_active_for_network')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    if (!is_plugin_active_for_network(plugin_basename(TEXT_TO_AUDIO_ROOT_FILE))) {
        return;
    }

    $blog_id = ($new_site instanceof WP_Site) ? (int) $new_site->blog_id : (int) $new_site;
    if (!$blog_id) {
        return;
    }

    switch_to_blog($blog_id);
    TTA_Activator::activate();
    restore_current_blog();
}, 20, 1);
```

Two guards beyond the obvious: `is_plugin_active_for_network()` is not loaded during a site-creation
request, so it needs the explicit `require_once`; and the callback accepts either a `WP_Site` or a
raw blog id. Priority 20 leaves core room to finish provisioning — `wp_initialize_site` runs after
the new site's tables exist, so `switch_to_blog()` is safe.

## Verified

Fresh subsite `avtest4`, **no settings ever saved**:

| Check | Result |
|---|---|
| Player renders | Yes |
| Extracted content | `Site4 hook verification. S4 heading no stop. S4 first paragraph no stop. S4 second ends with a stop. S4 中文句子。` |
| Boundary delimiters | Heading and unpunctuated paragraphs each get a stop |
| Already-punctuated paragraph | No doubled stop |
| Chinese `。` | No extra Latin stop |
| Speech payload | Present, `default_delimiter: ". "`, all 12 exclude tags seeded |
| Mode | Staging — correct default for a fresh site |
| Toolbar submenu | Go Live… / Pick content to read / Open AtlasVoice settings |
| Logged-out visitor in staging | No player markup |
| PHP notices / fatals | None |
| Existing sites 1–3 | Unaffected, all HTTP 200 |

## Scope

Free only. Pro needs no change — `TTA_Pro_Helper::should_load_button()` is a straight pass-through to
Free's, so Pro is fixed by the same commit. Pro is, however, *worse* affected until it ships: on an
unseeded subsite it loses the player **and** MP3 generation.

## Commits

- `3b655c41` — date-range gate defaults to allow (correctness, not the cause)
- `62fb07cf` — the seeding hook (the actual fix)
- `2fd6c7f9` — renumbered in-code references from 286 to 287

Both fix commits' messages still say TTS-286, from before Jira assigned that number to the
network-admin-menu ticket. The in-code comments say TTS-287 and are correct.

## Follow-up worth considering

This only covers subsites created **after** the fix ships. A network that already has unseeded
subsites stays broken until someone saves settings on each. Consider a one-time migration that seeds
defaults on any site missing `tta_customize_settings`.

## Related

- TTS-286 — no Network Admin menu. Same underlying gap: the plugin has no multisite model.
