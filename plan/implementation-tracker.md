# Abandon Rate Reduction — Implementation Plan

## Context

71.4% of Text-to-Audio users abandon the plugin. Root cause: users land on a Settings form after activation and never experience the plugin working. We implemented 4 P0 items that address the critical first-60-seconds experience and prove ongoing value. All P0 items are now complete and browser-tested.

---

## P0: Core Abandon Rate Reduction (COMPLETED)

### P0-1: Onboarding Wizard ✅
- 4-step wizard: Post Type → Voice → Customize → Analytics → Finish
- Separate webpack bundle (`tts-welcome-wizard.min.js`, 188 KiB) — zero impact on 689 KiB dashboard bundle
- All settings save correctly to DB (verified via PHP)
- Re-visit guard works: completed users see dashboard, not wizard
- "Run Setup Wizard" button added to Settings tab
- `reset_onboard=true` URL parameter available for re-testing
- Files: `src/dashboard/welcome.js`, `src/dashboard/welcome/` directory, modifications to `admin/TTA_Admin.php`, `api/TTA_Api_Routes.php`, `text-to-audio.php`, `webpack.mix.js`, `includes/TTA_Activator.php`

### P0-2: Enable Analytics by Default ✅
- New installs get `tts_enable_analytics: true` and `tts_trackable_post_ids: "all"`
- Free tracking limit increased from 5 → 20 posts
- Files: `includes/TTA_Activator.php`, `src/dashboard/components/dashboard/analitics/TrackPostIds.js`

### P0-3: Dashboard Widget ✅
- "AtlasVoice — Quick Stats" widget on wp-admin/index.php
- Shows plays today, views today, 7-day bar chart
- View Analytics / Customize Player links
- Pro upsell for free users
- 5-minute transient cache
- Files: `admin/TTA_Dashboard_Widget.php` (new), `includes/TTA.php`

### P0-4: Deactivation Warning ✅
- Freemius `deactivation_confirmation_message` filter with real usage stats
- 9 TTS-specific uninstall reasons replacing generic Freemius ones
- Note: modal cannot be tested when Pro plugin is installed (expected — dependency blocks deactivation)
- Files: `text-to-audio.php`

### Build & i18n ✅
- `npm run production` compiles successfully with all new bundles
- `npm run makepot` extracts all new strings

---

## IN PROGRESS

### P0-1 Enhancement: Finish Page Upsell
- Adding "Your Setup Summary" section (voice, player, analytics recap)
- Adding Pro feature cards (AI Voices, Bulk MP3, Deep Analytics)
- Adding cross-promo for AI Workflow Automation – AI Agent Hub plugin
- Files: `src/dashboard/welcome/steps/StepFinish.js`

---

## REMAINING TASKS

### P1: Post-Launch Optimization
1. **P1-1: WordPress.org Readme Optimization** — Update `readme.txt` with better description, screenshots section, FAQ addressing common abandon reasons
2. **P1-2: Brand Naming Consolidation** — Ensure "AtlasVoice" is used consistently across all UI strings (some places still say "Text To Speech TTS")
3. **P1-3: TTA_Notices Refactor** — Clean up admin notices, remove aggressive/spammy notices that hurt user trust
4. **P1-4: Schema Markup for Audio** — Add structured data for audio content to improve SEO

### P2: Growth Features
5. **P2-1: Admin Bar Quick Toggle** — One-click enable/disable audio from admin bar while browsing the site
6. **P2-2: Onboarding Analytics** — Track wizard completion rate, step drop-offs, to measure if abandon rate improves
7. **P2-3: Pro Onboarding Wizard** — Separate wizard for Pro plugin with AI voice provider setup, bulk MP3 configuration

### P3: Technical Debt
8. **P3-1: Unit Tests** — Add basic test coverage for critical paths (activation, settings save, API routes)
9. **P3-2: Code Splitting** — Consider lazy loading for dashboard tabs to reduce initial bundle size
10. **P3-3: Accessibility Audit** — Ensure wizard and dashboard widget meet WCAG 2.1 AA
