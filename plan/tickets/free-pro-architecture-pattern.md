# Free (wp.org) + Pro (off-wp.org) — the compliant architecture pattern

A reusable blueprint for splitting any plugin into a **free plugin hosted on WordPress.org** and a
**paid add-on hosted elsewhere**, without tripping the Trialware guideline (Guideline 5) that closed
`text-to-audio`. Applies to AtlasVoice, AtlasAR, and any future plugin in the same situation.

Derived from the wp.org closure email + the official guidelines + how Yoast SEO (free) /
Yoast SEO Premium do it. Pair with the `wordpress-plugin-guidelines` and (for AtlasVoice) the
`atlasvoice` skills.

> ⚠️ Note: the local `wordpress-seo-premium` copy used for study is a **nulled build** (it fakes the
> license API via a `pre_http_request` shim). That cracker code was ignored — only the legitimate
> architecture below was extracted.

---

## The one rule everything follows

> **The free plugin must be 100% functional on its own. Pro ADDS code that is not in the free ZIP —
> it never UNLOCKS code that is.**

A locked feature in the free ZIP is a violation **even if it's only "there in case the user
upgrades."** The free plugin may *advertise* paid features (links/badges/notices) — that's all.

---

## The 12 transferable rules

1. **Free is fully functional standalone.** Every feature in the free ZIP works with no key, no
   unlock step, no required remote call. Ship nothing you intend to lock.
2. **Pro feature code lives ONLY in the Pro ZIP.** If a feature is paid, its PHP/JS does not exist in
   the free download. (Yoast: redirects, link suggestions, multi-keyword all live in the premium ZIP.)
3. **Pro depends on Free, never the reverse.** Declare with `Requires Plugins:` (WP 6.5+) **and** a
   runtime version-constant gate; refuse to boot if Free is absent/outdated.
4. **Pro boots off a single "loaded" action Free fires** (Yoast: `wpseo_loaded`; AtlasVoice: Pro
   inits on `init` after Free). Resolve shared services from Free's helpers — don't reach into
   internals.
5. **Free exposes an extension surface (filters/hooks/interfaces).** Pro *adds* menus, fields,
   blocks, players, and REST routes through those filters — never by editing free code.
6. **Upsell = links, badges, dismissible notices — never disabled feature code.** Use a
   presenter/badge that points at the pricing page. The free UI must not show a *selectable control
   that silently fails*.
7. **`is_pro()` means "is the Pro plugin present" (a defined constant), NOT "is a license valid."**
   Use it only to toggle upsell visibility, never to unlock shipped functionality. (Yoast:
   `Product_Helper::is_premium()` is literally `defined('WPSEO_PREMIUM_FILE')`.)
8. **License/activation logic lives entirely in Pro** — its own option, capabilities, and remote
   server. Free has no license field and no feature gating.
9. **License checks may gate UPDATES, never FEATURES.** A free-side add-on/update manager may check a
   subscription to deliver updates / warn on expiry, but must never disable a free feature.
10. **Share one settings framework with clear ownership.** Free owns core options; Pro registers its
    own namespaced options into the same framework and only reads Free's.
11. **No phoning home from Free without opt-in.** Remote calls run only behind explicit, off-by-default
    consent (or for an installed paid add-on's updates). No analytics/tracking by default.
12. **Bundle and disclose assets.** Ship a public source-repo link in `readme.txt` for compiled
    JS/CSS, prefix vendored PHP libs (php-scoper/Strauss), commit `composer.json`, and bundle (don't
    CDN) third-party files.

---

## How Yoast implements it (concrete reference)

- **Dependency**: Premium header `Requires Yoast SEO: X`; runtime `version_compare(WPSEO_VERSION, …)`;
  boots inside `wpseo_loaded`. If Free missing → an `admin_notices` banner with an Install/Activate
  button (can auto-install Free from `downloads.wordpress.org`), and Premium simply doesn't register.
- **Extension**: Free has `Integration_Interface::register_hooks()` + `Loadable_Interface::get_conditionals()`
  and a DI container (`YoastSEO()->classes->get(...)`). Premium registers features via filters like
  `wpseo_submenu_pages`, `wpseo_premium_indicator_classes`.
- **Upsell without locking**: `Premium_Badge_Presenter` (markup + pricing link), upsell
  "introduction" classes whose `should_show()` returns false when `is_premium()` — they decide
  whether to show an *ad*, never whether to run a feature. The redirects feature code is physically
  absent from the free ZIP.
- **License**: validated in Premium (its own `wpseo_premium` option + My Yoast). Free's
  `WPSEO_Addon_Manager` checks subscriptions **only to deliver updates / expiry warnings**, never to
  gate features.
- **Settings**: shared `WPSEO_Options` framework; Free owns `wpseo*`, Premium registers
  `wpseo_premium`/`wpseo_redirect` and only reads Free's.
- **Source compliance**: `readme.txt` links the public GitHub repo; vendored libs prefixed in
  `vendor_prefixed/`.

---

## Anti-patterns that get a plugin closed (what we did wrong)

- ❌ Free `get_player_id()` clamps id > 1 to 1 unless `is_pro_license_active()` → a license check
  disabling a shipped feature.
- ❌ Free UI dropdown lists players 2–6 that don't work in Free → locked controls advertised as usable.
- ❌ Pro demo player assets shipped inside the free ZIP.
- ❌ Analytics/report routes returning "requires Pro".
- ❌ Phoning home by default (Chart.js from CDN, GitHub fetches) without opt-in.
- ❌ Force-deactivating the Pro plugin from Free's deactivation hook.

---

## Checklist to apply this pattern to a new/closed plugin

- [ ] List every "premium" feature; confirm its code is **not** in the free ZIP.
- [ ] Remove all `is_*_license_active()` / license gates from the free plugin.
- [ ] Replace locked controls with upsell badges/links to the pricing page.
- [ ] Redefine `is_pro()` as a constant-presence check, used only for upsell visibility.
- [ ] Pro: `Requires Plugins:` + version gate; boots off Free's loaded hook; adds via filters.
- [ ] Pro owns all license logic + its own namespaced options.
- [ ] No default remote calls in Free; disclose all external services in the readme.
- [ ] Bundle assets locally; ship `composer.json` + public source link; prefix vendored libs.
- [ ] Test: Free alone (clean WP, `WP_DEBUG=true`), Free+Pro, and Pro-removed-leaves-no-locked-state.
