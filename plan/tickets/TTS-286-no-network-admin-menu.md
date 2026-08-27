# TTS-286 — No Network Admin menu: every subsite must be configured separately

## The problem

The plugin registers its admin menu only on the per-site `admin_menu` hook:

- `includes/TTA.php:120` — `$this->loader->add_action('admin_menu', $plugin_admin, 'TTA_menu')`
- `admin/TTA_Admin.php:644` — `add_menu_page(...)`

There is no `network_admin_menu` registration anywhere, so on a multisite install AtlasVoice
appears inside each individual subsite's wp-admin and **never in Network Admin**. Confirmed on
test.atlasaidev.com: the Network Admin sidebar shows Sites, Users, Themes, Plugins, Settings and the
other network-aware plugins, but no AtlasVoice entry.

## Why it matters

Every setting is per-site. On a network of N sites a super admin must open N dashboards and
configure each one independently. There is no network-wide default, no "apply to all sites", and no
single place to see what is configured where.

This became concrete once the paid providers were tested (TTS-280 release testing, 2026-08-27):
**Google Cloud TTS, ChatGPT TTS and ElevenLabs credentials are stored per site.** A 20-site network
means pasting the same API key 20 times, and rotating a key means doing it 20 times again. That is
the strongest argument for network-level settings — it is a credential-management problem, not just
a convenience one.

Related, and probably the same piece of work: TTS-287 showed that a subsite created after network
activation gets no defaults at all until `wp_initialize_site` seeds them. Both are symptoms of the
plugin having no real multisite model.

## What needs deciding first

This is not simply "add `network_admin_menu`". The product questions come first:

1. **What is network-scoped and what stays per-site?** Provider credentials and the player choice
   are plausible network defaults. Content-selection rules (CSS selectors, exclude tags) are
   inherently per-site, because sites have different themes and markup.
2. **Override model.** Network value as a default a site may override, or a hard lock the site
   cannot change? A lock is simpler to reason about; an override is what most multisite plugins
   ship. Decide before building the UI, because it determines the storage shape.
3. **Storage.** Per-site options today (`tta_settings_data`, `tta_customize_settings`,
   `tta_listening_settings`, integration keys). Network values would need `*_site_option` equivalents
   plus a resolver every read goes through — which is a change to every settings read in both
   plugins, not a new screen.
4. **Mode (staging / production).** Per-site today, and verified working that way — site 2 was in
   production while site 1 stayed staging. Going live is a per-site decision and should probably
   stay per-site even if credentials become network-wide.
5. **Credential visibility.** A network-stored API key is readable by every site admin unless
   deliberately hidden. On a network where subsite admins are not the network owner, that is a
   security decision, not a UI one.

## Scope note

Free and Pro both need this. Free owns the menu registration and the settings screens; Pro owns the
provider credentials that make network scope worth having. Free ships first, as with TTS-280.

## Acceptance criteria (draft — depends on the decisions above)

1. An AtlasVoice entry exists in Network Admin for a super admin on a multisite install.
2. Whatever is designated network-scoped can be set once and takes effect on every site.
3. Per-site settings remain editable per site and are not silently overwritten.
4. A single-site install is completely unaffected — no new menu, no new option reads.
5. A subsite admin without network rights cannot read network-stored credentials.
6. Existing per-site configuration is preserved on upgrade; nothing is reset.

## Related

- TTS-287 — subsites created after network activation got no defaults. Same underlying gap: the
  plugin has no multisite model.
