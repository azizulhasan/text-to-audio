# Reviewer Reply — to paste into HelpScout thread

**Subject:** Re: [WordPress Plugin Directory] Closure Notice - Guideline Violation: Text To Speech TTS Accessibility

---

Hi, and thank you for the detailed report.

I've uploaded a new version (**2.2.2**) to SVN — committed to `trunk/` and tagged at `tags/2.2.2`, with the `Version:` header and `Stable tag:` both updated. It was tested on a clean WordPress install with `WP_DEBUG` enabled, and Plugin Check reports **"Checks complete. No errors found."** across all categories.

Here is how each reported item was addressed:

**1. Guideline 5 — Trialware / locked features.** All premium logic has been removed from this free plugin, not gated. The advanced analytics (top-post, previous-period, playing-trend, OS/browser/device/location breakdowns, peak-hours heatmap, CSV/PDF export, scheduled reports) and the player-2…6 handling/customization code no longer exist in this codebase — they now live exclusively in the separate Pro add-on. The free plugin no longer contains any `is_pro_active()` feature gating; the dashboard renders purely from a capabilities list that is empty unless the separate add-on provides it. The free plugin ships player 1, fully functional, with no locked code paths.

**2. Custom CSS / arbitrary code insertion.** The Custom CSS field has been removed from the UI, the settings schema, and all rendering. The plugin no longer accepts or stores arbitrary CSS/JS/PHP. Any value a user had previously saved is migrated once, on update, into WordPress core's Customizer → Additional CSS (`wp_update_custom_css_post()`), and the player now renders in the light DOM so the core-sanitized Additional CSS applies to it.

**3. Invalid Terms/Privacy URL.** Corrected. The readme now points to the live pages `https://atlasaidev.com/terms-and-conditions/` and `https://atlasaidev.com/privacy-policy/` (both return HTTP 200).

**4. Out-of-date library (Chart.js).** Upgraded from 4.4.7 to the latest stable **4.5.1**. (I also refreshed the other bundled vendor library, countries-and-timezones, to its latest stable.)

**5. `file_put_contents` in TTA_Translation_Downloader.php.** Rewritten to use the WordPress filesystem API (`WP_Filesystem` / `$wp_filesystem->put_contents()`) instead of writing directly.

**6. Inline `<script>` / `<style>` tags.** Audited the whole plugin (front-end and admin) and moved every inline script and style to enqueued assets via `wp_enqueue_style/script`, `wp_add_inline_style`, and `wp_localize_script` / `wp_add_inline_script`. The only inline block that remains is the `application/ld+json` AudioObject schema in the document head, which is the documented allowed exception.

**7. External services documentation.** The readme's "External services" section documents each service — what it is, what data is sent and under what circumstances, and links to its Terms and Privacy Policy. All such services (usage telemetry, and the optional IP→city/country lookup used only for the analytics Location chart) are **opt-in and off by default**.

I also reviewed the codebase more broadly for other instances of the same issues, per your note.

Thank you for your time and patience.

Best regards,
Azizul Hasan

`{#HS:3327588871-1050336#}`
