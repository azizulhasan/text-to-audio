# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Text To Speech TTS Accessibility** — a WordPress plugin that adds a text-to-audio player to WordPress sites. Built by AtlasAiDev. Uses Freemius for premium licensing. Has a companion Pro plugin (`text-to-speech-pro` / `text-to-audio-pro`).

- Plugin slug: `text-to-audio`
- Text domain: `text-to-audio`
- Requires PHP 7.4+, WordPress 5.6+
- Main entry: `text-to-audio.php`

## Build Commands

```bash
# React dashboard + all JS bundles (production)
npm run production

# React dashboard + all JS bundles (development, with watch)
npm run watch

# WordPress Gutenberg blocks
npm run block:build        # production
npm run block:start        # development watch

# Gulp tasks (CSS/JS minification, SCSS compilation)
npm run build              # gulp build

# Translations
npm run makepot            # Extract strings to languages/text-to-audio.pot
npm run translate          # Generate optimized JSON + MO files from .po files

# Release
npm run makeZip            # Create production ZIP in /production
npm run copy               # Copy files to /production directory
npm run release            # Full release automation
```

There is no test suite configured. `npm test` is a no-op.

## Dual Build System

The project uses **two** build systems that serve different purposes:

1. **Laravel Mix (Webpack)** — `webpack.mix.js` — Compiles React dashboard and JS bundles
   - `src/dashboard/index.js` → `admin/js/build/text-to-audio-dashboard-ui.min.js`
   - `src/dashboard/button.js` → `admin/js/build/text-to-audio-pro-button.min.js`
   - `src/dashboard/bulk-mp3-file.js` → `admin/js/build/tts-bulk-mp3-file.min.js`
   - `src/dashboard/css-selectors.js` → `admin/js/build/tts-css-selectors.min.js`
   - `admin/js/TextToSpeech.js` → `admin/js/build/TextToSpeech.min.js`
   - Plus analytics and demo bundles

2. **Gulp** — `gulpfile.js` — CSS minification, SCSS compilation, POT generation, ZIP packaging

## Architecture

### PHP Backend (PSR-4 Autoloaded via Composer)

```
TTA\            → includes/     (core plugin classes)
TTA_Admin\      → admin/        (admin dashboard)
TTA_Api\        → api/          (REST API endpoints)
AtlasAiDev\AppService\ → libs/AtlasAiDev/
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
- `TTA\TTA_Cache` — Caching layer using WordPress options API
- `includes/helpers.php` — Global functions: `tta_get_button_content()`, `tta_clean_content()`, shortcode handlers

**Shortcodes:** `[tta_listen_btn]` and `[atlasvoice]` — both handled by `tta_create_shortcode()`

### REST API

Namespace: `tta/v1`

Routes registered in `api/TTA_Api_Routes.php`:
- `/listening` — Track listening analytics
- `/customize` — Save button customization
- `/settings` — Get/save plugin settings
- `/browser` — Browser configuration
- `/track` — Analytics tracking

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

Source: `admin/js/blocks/` → Built to `build/` via `@wordpress/scripts`

## Translation Workflow

The plugin uses a smart i18n system that separates JS and PHP translations based on `#:` file references in .po files:

1. `npm run makepot` — Extract strings to `.pot`
2. Edit `.po` files in `languages/` (zh_CN, ja, ko_KR)
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