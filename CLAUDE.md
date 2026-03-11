# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Text To Speech TTS Accessibility** — a WordPress plugin that adds a text-to-audio player to WordPress sites. Built by AtlasAiDev. Uses Freemius for premium licensing. Has a companion Pro plugin (`text-to-speech-pro` / `text-to-audio-pro`) that extends functionality with AI voice providers.

- Plugin slug: `text-to-audio`
- Text domain: `text-to-audio`
- Requires PHP 7.4+, WordPress 5.6+
- Main entry: `text-to-audio.php`
- Admin page: `admin.php?page=text-to-audio`

## Build Commands

```bash
# React dashboard + all JS bundles (production)
npm run production

# React dashboard + all JS bundles (development)
npm run dev                # single build
npm run watch              # continuous watch

# WordPress Gutenberg blocks
npm run block:build        # production
npm run block:start        # development watch

# Gulp tasks (CSS/JS minification, SCSS compilation, ZIP)
npm run build              # gulp build (minify CSS + JS + makeZip)

# Translations
npm run makepot            # Extract strings to languages/text-to-audio.pot
npm run translate          # Generate optimized JSON + MO files from .po files

# Release
npm run makeZip            # Create production ZIP in /production
npm run copy               # Copy files to /production directory
npm run release            # Full release automation
npm run copyProButton      # Copy pro-button bundle to Pro plugin directory
```

There is no test suite configured. `npm test` is a no-op.

## Dual Build System

The project uses **two** build systems that serve different purposes:

1. **Laravel Mix (Webpack)** — `webpack.mix.js` — Compiles React dashboard and JS bundles
   - `src/dashboard/index.js` → `admin/js/build/text-to-audio-dashboard-ui.min.js`
   - `src/dashboard/button.js` → `admin/js/build/text-to-audio-pro-button.min.js`
   - `src/dashboard/bulk-mp3-file.js` → `admin/js/build/tts-bulk-mp3-file.min.js`
   - `src/dashboard/css-selectors.js` → `admin/js/build/tts-css-selectors.min.js`
   - `admin/js/TextToSpeech.js` → `admin/js/build/TextToSpeech.min.js` (frontend player)
   - `admin/js/text-to-audio-button.js` → `admin/js/build/text-to-audio-button.min.js`
   - `admin/js/AtlasVoiceAnalytics.js` → `admin/js/build/AtlasVoiceAnalytics.min.js`
   - `admin/js/AtlasVoicePlayerInsights.js` → `admin/js/build/AtlasVoicePlayerInsights.min.js`
   - Plus demo bundles in `admin/demos/`

2. **Gulp** — `gulpfile.js` — CSS minification, SCSS compilation, POT generation, ZIP packaging

## Architecture

### PHP Backend (PSR-4 Autoloaded via Composer)

```
TTA\                       → includes/        (core plugin classes)
TTA_Admin\                 → admin/           (admin dashboard)
TTA_Public\                → public/          (public-facing)
TTA_Api\                   → api/             (REST API endpoints)
AtlasAiDev\AppService\     → libs/AtlasAiDev/ (telemetry client)
```

**Bootstrap flow:**
```
text-to-audio.php
  → Composer autoload
  → Freemius SDK init (if Pro plugin not present)
  → Constants defined (TEXT_TO_AUDIO_*, TTA_*)
  → plugins_loaded (priority 9999):
      TTA_Init → TTA (core) → TTA_Loader (hook registry)
      → init (priority 9999):
          TTA_Api_Routes, TTA_Notices, TTA_Lib_AtlasAiDev
```

**Key classes:**
- `TTA\TTA` — Core plugin class, wires up hooks via `TTA_Loader`
- `TTA\TTA_Loader` — Central hook registry (actions + filters)
- `TTA\TTA_Helper` — Static utility methods, settings management, `should_load_button()`
- `TTA\TTA_Hooks` — Plugin compatibility filters (Autoptimize, LiteSpeed, WP Rocket, W3TC, SG Optimizer)
- `TTA\TTA_Cache` — Caching layer using WordPress transients/options API
- `TTA_Admin\TTA_Admin` — Admin dashboard setup, script enqueuing, menu registration, block registration
- `TTA_Admin\TTA_Posts_List` — Custom audio status column in posts list table
- `includes/helpers.php` — Global functions: `tta_get_button_content()`, `tta_clean_content()`, shortcode handlers

**Shortcodes:** `[tta_listen_btn]` and `[atlasvoice]` — both handled by `tta_create_shortcode()`

### Settings Storage (WordPress Options)

- `tta_settings_data` — Plugin settings (post types, excluded posts/tags/categories)
- `tta_customize_settings` — Button appearance (color, size, border, styles)
- `tta_alias_settings` — Text aliases for pronunciation corrections

### REST API

Namespace: `tta/v1`

Routes registered in `api/TTA_Api_Routes.php`:
- `POST|GET /listening` — Track listening analytics
- `POST|GET /customize` — Save button customization
- `POST|GET /settings` — Get/save plugin settings
- `POST /browser` — Browser configuration
- `POST /track` — Analytics tracking
- `GET /geolocation` — IP-based city/country detection
- `GET /insights` — Single post analytics

All routes use `get_route_access()` for nonce + capability validation.

### React Frontend

Located in `src/dashboard/`. Uses React 17, React Router DOM 6, React Bootstrap 2, `@wordpress/hooks`, `@wordpress/i18n`.

**Entry points** (each is a separate webpack bundle):
- `index.js` — Main admin dashboard (settings, customize, analytics, compatibility, docs/FAQ)
- `button.js` — Button customization component
- `bulk-mp3-file.js` — Bulk MP3 generation
- `css-selectors.js` — CSS selector configuration

**State management:** React Context API (`src/dashboard/components/context/`)

**Dashboard translations** are synced from WordPress to React via `setLocaleData()` from `@wordpress/i18n` in `src/dashboard/index.js`.

### WordPress Blocks

Source: `admin/js/blocks/blocks.js` → Built to `build/` via `@wordpress/scripts`

### Key Hooks and Filters

- `tta_should_load_button` — Filter to control button visibility on specific posts/pages
- `tta_clean_content` — Filter content before TTS processing
- `tts_sentence_delimiter` — Configure sentence break character (default: `". "`)
- `tts_excludable_js_arr` — JS files to exclude from caching plugin minification
- `tts_version` — Filter plugin version string
- `tts_plugin_name` — Filter plugin display name
- `tts_is_exluded_by_terms` — Filter term-based exclusion logic

### Pro Plugin Interaction

The free plugin detects Pro via `is_pro_plugin_exists()` checking for any of these plugin directories: `text-to-speech-pro`, `text-to-speech-pro-premium`, `text-to-audio-pro`, `text-to-audio-pro-premium`. When Pro is present, Freemius SDK init is skipped (Pro handles it), and `TTA_PRO_PLUGIN_PATH` is defined by the Pro plugin. Use `TTA_Helper::is_pro_active()` to check Pro status at runtime.

## Translation Workflow

The plugin uses a smart i18n system that separates JS and PHP translations based on `#:` file references in .po files:

1. `npm run makepot` — Extract strings to `.pot`
2. Edit `.po` files in `languages/` (zh_CN, ja, ko_KR, es_ES, it_IT, pt_BR)
3. `npm run translate` — Generates optimized JSON (JS strings only) and MO (PHP strings only), with shared strings in both

See `scripts/README.md` for full details.

## Important Constants

Defined in `text-to-audio.php`:
- `TEXT_TO_AUDIO_VERSION`, `TEXT_TO_AUDIO_PLUGIN_NAME`, `TEXT_TO_AUDIO_TEXT_DOMAIN`
- `TEXT_TO_AUDIO_ROOT_FILE`, `TEXT_TO_AUDIO_NONCE`
- `TTA_PLUGIN_URL`, `TTA_PLUGIN_PATH`, `TTA_ADMIN_PATH`, `TTA_LIBS_PATH`
- `TTA_DEBUG_MODE` (0 by default)

## Production Build Exclusions

The `gulpfile.js` `productionSrc` array excludes from release ZIPs: `node_modules/`, `src/`, `scripts/`, `.claude/`, source JS files, `*.md`, config files, `.po`/`.pot` files, and `uninstall.php`.

## Caching Plugin Compatibility

`TTA_Hooks` registers filters to exclude plugin JS files from minification/deferral by: Autoptimize, LiteSpeed Cache, WP Rocket, W3 Total Cache, WP Optimize, and SiteGround SG Optimizer. Excluded files are listed in `TTA_Hooks::get_excluded_js()`.
