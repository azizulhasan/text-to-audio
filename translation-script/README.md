# Translation Scripts

This folder contains the unified translation generator for WordPress internationalization (i18n).

## 📋 Overview

The translation system intelligently separates PHP and JavaScript translations:

- **JSON files** → JavaScript strings (from .js files)
- **MO files** → PHP strings (from .php files)
- **Shared strings** → Included in BOTH files when used in both PHP and JS

## 🚀 Single Command

```bash
npm run translate
```

This one command:
1. ✅ Analyzes your PO files
2. ✅ Detects which strings are used in JS vs PHP files
3. ✅ Generates JSON files (JS strings + shared strings)
4. ✅ Generates MO files (PHP strings + shared strings)
5. ✅ Cleans up old translation files automatically

## 📁 Script

### `generate-translations.js`

**The complete translation generator with smart detection.**

**How it works:**
- Parses PO files and reads `#:` reference comments
- Identifies file types based on extensions:
  - `.js` files → JavaScript
  - `.php` files → PHP
  - Other files → PHP (default)
- Routes strings intelligently:
  - **JS only** → JSON file only
  - **PHP only** → MO file only
  - **Both JS and PHP** → BOTH JSON and MO files ✨

**Example PO file references:**
```po
# PHP only → Goes to MO only
#: admin/TTA_Posts_List.php:170
msgid "Audio Status"
msgstr "音频状态"

# JS only → Goes to JSON only
#: src/dashboard/components/Settings.js:45
msgid "Loading"
msgstr "加载中"

# Both PHP and JS → Goes to BOTH MO and JSON
#: includes/helpers.php:816
#: includes/TTA_Activator.php:128
#: admin/js/blocks/customize-button/customize-button.js:161
#: build/blocks.js:1
msgid "Listen"
msgstr "收听"
```

**Example output:**
```
Processing zh_CN...
  ✅ Dashboard JSON: text-to-audio-zh_CN-426a7034caa9f0345ef414c77a5c987e.json (39 JS strings)
  ✅ PHP MO: text-to-audio-zh_CN.mo (36 PHP strings)
  ℹ️  Shared strings (in both JSON & MO): 4
```

## 🔄 Complete Workflow

### Step 1: Extract Translatable Strings

```bash
npm run makepot
```

This generates `languages/text-to-audio.pot` with all translatable strings.

### Step 2: Update Translations

Edit your PO files manually or use a tool like Poedit:
- `languages/text-to-audio-zh_CN.po` (Chinese)
- `languages/text-to-audio-ja.po` (Japanese)
- `languages/text-to-audio-ko_KR.po` (Korean)

### Step 3: Generate Translation Files

```bash
npm run translate
```

This creates both JSON and MO files with proper separation and shared strings.

## 📊 How It Works

### Reference-Based Detection

The script reads `#:` reference lines from PO files to determine file type:

```po
# Single reference (JS) → JSON only
#: src/dashboard/components/Settings.js:45
msgid "Save"
msgstr "保存"

# Single reference (PHP) → MO only
#: admin/TTA_Posts_List.php:170
msgid "Audio Status"
msgstr "音频状态"

# Multiple references (both PHP and JS) → BOTH JSON and MO
#: includes/helpers.php:816
#: build/blocks.js:1
msgid "Listen"
msgstr "收听"
```

### Smart Detection Logic

```javascript
// Check if string is used in JavaScript
const hasJsReference = references.some(ref =>
    ref.endsWith('.js') || ref.includes('.js:')
);

// Check if string is used in PHP
const hasPhpReference = references.some(ref =>
    ref.endsWith('.php') || ref.includes('.php:') ||
    (!ref.endsWith('.js') && !ref.includes('.js:'))
);

// Add to JSON if used in JS
if (hasJsReference) {
    jsStrings[msgid] = [msgstr];
}

// Add to MO if used in PHP
if (hasPhpReference) {
    phpStrings[msgid] = [msgstr];
}
```

### File Type Detection

- Files ending with `.js` → **JavaScript** → JSON file
- Files ending with `.php` → **PHP** → MO file
- All other files → **PHP** → MO file (default)
- Files with BOTH `.js` and `.php` → **Shared** → Both files

## 📂 File Structure

```
text-to-audio/
├── scripts/
│   ├── generate-translations.js   ← Main script (smart separation)
│   └── README.md                  ← This file
├── languages/
│   ├── text-to-audio.pot          ← Template (from makepot)
│   ├── text-to-audio-zh_CN.po     ← Chinese source
│   ├── text-to-audio-zh_CN.mo     ← Chinese PHP + shared
│   └── text-to-audio-zh_CN-*.json ← Chinese JS + shared
└── package.json                   ← npm scripts
```

## 🎯 Why Separate PHP and JS (with Shared Strings)?

### Problem Without Smart Separation
- All strings in both JSON and MO files
- Duplicate translations loaded unnecessarily
- Larger file sizes
- Inefficient memory usage

### Solution With Smart Separation
- ✅ JS-only strings: Only in JSON
- ✅ PHP-only strings: Only in MO
- ✅ Shared strings: In BOTH files (so they work everywhere)
- ✅ Smaller files, faster loading
- ✅ No missing translations

## 📈 Translation Statistics

### Chinese (zh_CN)
- **JSON file**: 39 JS strings → 4.6 KB
- **MO file**: 36 PHP strings → 2.6 KB
- **Shared strings**: 4 (in both files)
- **Total unique**: 71 translations

**Shared strings:**
- "Listen" (收听)
- "Pause" (暂停)
- "Resume" (继续)
- "Replay" (重播)

### Japanese (ja)
- **JSON file**: 7 JS strings → 1.1 KB
- **MO file**: 42 PHP strings → 4.0 KB
- **Shared strings**: 6 (in both files)
- **Total unique**: 43 translations

### Korean (ko_KR)
- **JSON file**: 7 JS strings → 1.0 KB
- **MO file**: 42 PHP strings → 4.0 KB
- **Shared strings**: 6 (in both files)
- **Total unique**: 43 translations

## 🆕 Adding a new language

Adding a locale is a one-line change plus the normal round trip. You never
create a `.po` by hand and you never copy files into the translations repo by
hand.

1. **Add the locale code** to `AVAILABLE_LOCALES` in
   `includes/TTA_Translation_Downloader.php`. That constant is the single
   source of truth — every `--all` command reads it, so nothing else needs a
   second list. Skip this step and the locale is silently ignored everywhere.

2. **Optional but recommended**, so the new language does not fall back to
   English defaults:
   - `includes/TTA_Activator.php` — add a `$voice_map` entry (browser voice +
     BCP-47 language) for the locale.
   - `includes/TTA_Notices.php` — add a `get_locale_label()` entry so the
     "translation available" notice shows a language name, not a raw code.
   - `includes/helpers.php` already carries the full WordPress locale-name
     table, so it needs nothing.

3. **Run the round trip:**
   ```bash
   npm run i18n:sync                      # makepot + collect for every locale
   # → fill translation-script/pending/<new_locale>.json from your AI client
   npm run i18n:finish                    # apply for every locale + translate
   npm run i18n:publish                   # copy into the translations repo
   ```

`npm run translate` rebuilds **every** locale that has a `.po`, not only the new
one, so `languages/` always holds the complete set and publishing stays a
one-folder diff.

## 🔧 Dashboard Translation Fix

The dashboard uses `setLocaleData()` to sync translations between WordPress and React:

**File:** `src/dashboard/index.js`

```javascript
import { setLocaleData } from '@wordpress/i18n';

if (window.wp && window.wp.i18n && window.wp.i18n.getLocaleData) {
    const wpLocaleData = window.wp.i18n.getLocaleData('text-to-audio');
    if (wpLocaleData && Object.keys(wpLocaleData).length > 0) {
        setLocaleData(wpLocaleData, 'text-to-audio');
        console.log('✅ Dashboard translations loaded:',
                    Object.keys(wpLocaleData.messages || {}).length, 'strings');
    }
}
```

This bridges:
- WordPress's `window.wp.i18n` (loads JSON files)
- React's bundled `@wordpress/i18n` (used in components)

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run makepot` | Extract translatable strings to POT |
| `npm run i18n:collect` | Merge POT into the PO files, write the untranslated strings to `pending/` |
| `npm run i18n:apply` | Read the filled `pending/` JSON back into the PO files |
| `npm run i18n:fill` | Translate `pending/` via an AI provider (needs an API key) |
| `npm run i18n:sync` | `makepot` + `collect --all` |
| `npm run i18n:finish` | `apply --all` + `translate` |
| `npm run translate` | Generate the JSON and MO files from the PO files |
| `npm run i18n:publish` | Copy the built files into the `atlasaidev-translations` repo |
| `npm run i18n:pull` | Restore `languages/` from that repo (run this on a fresh clone) |

## 🐛 Troubleshooting

### Dashboard translations not loading?

1. **Regenerate translations:**
   ```bash
   npm run translate
   ```

2. **Rebuild dashboard:**
   ```bash
   npm run production
   ```

3. **Check console for:**
   ```
   ✅ Dashboard translations loaded: 39 strings
   ```

4. **Clear browser cache**

### Missing translations in PHP or JS?

Check if the string is properly referenced in the PO file:

```bash
# Look for the string in PO file
grep -A 3 "msgid \"Your String\"" languages/text-to-audio-zh_CN.po
```

The `#:` reference line should show which files use it:
- If only `.js` files → Will be in JSON only
- If only `.php` files → Will be in MO only
- If BOTH `.js` and `.php` → Will be in BOTH

### Shared string not working in PHP?

Make sure the string has PHP file references in the PO file. Run:
```bash
npm run makepot
```

This updates all file references.

### File size seems wrong?

The script automatically separates and shares strings. Check the output:
```
✅ Dashboard JSON: ... (39 JS strings)
✅ PHP MO: ... (36 PHP strings)
ℹ️  Shared strings (in both JSON & MO): 4
```

Shared strings are counted in both totals.

### Old JSON files accumulating?

Run the script - it auto-cleans:
```bash
npm run translate
```

Output shows:
```
🗑️ Deleted: old-file.json
```

## 📝 Technical Details

### Hash Calculation

Dashboard JSON hash is always `426a7034caa9f0345ef414c77a5c987e`:

```javascript
const crypto = require('crypto');
const hash = crypto.createHash('md5')
    .update('admin/js/build/text-to-audio-dashboard-ui.js')
    .digest('hex');
```

### JSON File Format

```json
{
  "translation-revision-date": "2026-01-19T10:51:11+01:00",
  "generator": "generate-translations.js",
  "source": "admin/js/build/text-to-audio-dashboard-ui.js",
  "domain": "messages",
  "locale_data": {
    "messages": {
      "": {
        "domain": "messages",
        "plural": "nplurals=1; plural=0;"
      },
      "Save": ["保存"],
      "Listen": ["收听"]
    }
  }
}
```

### MO File Contents

Binary file containing:
- PHP-only strings
- Shared strings (also in JSON)

Use `msgfmt -o` or `wp i18n make-mo` to generate.

## ✅ Benefits

1. **Smart Separation**
   - Automatically detects JS vs PHP strings
   - Handles shared strings correctly
   - No manual configuration needed

2. **Single Command**
   - One `npm run translate` does everything
   - Generates JSON and MO files
   - Cleans up old files

3. **Optimized Files**
   - Smaller JSON files (only JS strings + shared)
   - Smaller MO files (only PHP strings + shared)
   - No missing translations

4. **Clear Output**
   - Shows exactly what was generated
   - Reports shared string count
   - Easy to verify

5. **Maintainable**
   - Reference-based detection
   - Automatic file routing
   - Clean, documented code

## 🔍 Example: How Shared Strings Work

**In PO file:**
```po
#: includes/helpers.php:816
#: includes/TTA_Activator.php:128
#: admin/js/blocks/customize-button/customize-button.js:161
#: build/blocks.js:1
msgid "Listen"
msgstr "收听"
```

**Script detects:**
- Has `.php` references → Add to MO ✅
- Has `.js` references → Add to JSON ✅
- Result: String in BOTH files ✅

**In JSON file:**
```json
"Listen": ["收听"]
```

**In MO file:**
```
(binary data containing "Listen" → "收听")
```

**Result:**
- PHP code calling `__('Listen', 'text-to-audio')` → Uses MO file → Shows "收听" ✅
- JS code calling `__('Listen', 'text-to-audio')` → Uses JSON file → Shows "收听" ✅

## 📚 References

- [WordPress i18n Documentation](https://developer.wordpress.org/block-editor/how-to-guides/internationalization/)
- [WP-CLI i18n Commands](https://developer.wordpress.org/cli/commands/i18n/)

## 🎉 Summary

The translation system now:
- ✅ Uses a single command: `npm run translate`
- ✅ Automatically detects JS vs PHP strings
- ✅ Handles shared strings correctly (in both files)
- ✅ Generates optimized JSON and MO files
- ✅ Cleans up old files automatically

**No manual work needed - just run the command!** 🚀

---

# 🌍 Filling in missing translations (TTS-296)

`npm run translate` only **moves** translations that already exist. It never
creates one. So when new English strings are added to the code, they appear in
the `.pot`, sit in each `.po` with an empty `msgstr ""`, and stay English on the
site until somebody supplies the words.

It was previously filled by hand-written per-language dictionaries, which went
stale the moment new strings appeared — which is why the Highlight tab,
"From here" and "Listen to selected text" sat untranslated for months. Those
dictionaries have been removed; their contents live in the `.po` files, and this
pipeline replaces them.

These commands close it.

## The pipeline, and why each step exists

| Step | Command | Why it is needed |
|------|---------|------------------|
| 1 | `npm run makepot` | Re-reads the code and refreshes `.pot`. Without this, strings added since the last run simply do not exist yet as far as translation is concerned. |
| 2 | `npm run i18n:collect` | Merges `.pot` into each `.po` (new strings arrive empty, existing translations are untouched) and writes just the empty ones to `translation-script/pending/<locale>.json`. |
| 3 | *(the AI fills that JSON)* | The actual translating. No command can invent the words — this is the only human/AI step. |
| 4 | `npm run i18n:apply` | Reads the filled JSON back into the `.po`. Only ever fills an empty `msgstr`, so existing work cannot be overwritten. |
| 5 | `npm run translate` | The existing distributor: routes each string into the `.mo` (PHP) and the hashed `.json` (JS) by its `#:` references. **Must run last** — run it earlier and it just redistributes empty strings. |
| 6 | `npm run i18n:publish` | Copies the built files into the public `atlasaidev-translations` repo, which is what sites download from at runtime. Refuses to run unless every locale is fully built. |

## A. One language (example: Italian)

```bash
npm run makepot
npm run i18n:collect -- --locale=it_IT
```

Output:

```
POT: 1098 strings

  it_IT    1098 strings   682 awaiting translation → translation-script\pending\it_IT.json
```

`translation-script/pending/it_IT.json` now looks like this — every key is an
English string with no Italian yet:

```json
{
  "From here": "",
  "Listen to selected text": "",
  "Close settings": ""
}
```

Ask any AI client (Claude, ChatGPT, Gemini) to **"fill translation-script/pending/it_IT.json"**.
It becomes:

```json
{
  "From here": "Da qui",
  "Listen to selected text": "Ascolta il testo selezionato",
  "Close settings": "Chiudi impostazioni"
}
```

Then:

```bash
npm run i18n:apply -- --locale=it_IT
npm run translate
```

```
  it_IT   +   8 translated   674 still empty
  ✅ text-to-audio-it_IT-51b071c0….json → admin/js/build/text-to-audio-button.js (20 strings)
```

Partial is fine: whatever is still empty stays in the pending file for next time.

## B. All languages at once

Two commands, with the AI filling in between:

```bash
npm run i18n:sync      # = makepot + collect for every locale
# → fill translation-script/pending/*.json from your AI client
npm run i18n:finish    # = apply for every locale + translate
```

`--all` reads the locale list from `TTA_Translation_Downloader::AVAILABLE_LOCALES`
(currently es_ES, it_IT, pt_BR, pt_PT, de_DE, fr_FR, nl_NL, ja, pl_PL,
ru_RU, tr_TR, vi), so it stays correct as
languages are added — there is no second list to keep in sync.

## C. Fully automatic (needs an API key)

```bash
npm run i18n:auto
```

`makepot → collect → AI fill → apply → translate`, no manual step. Requires
`ANTHROPIC_API_KEY` in the environment. Other providers:

```bash
npm run i18n:fill -- --all --provider=openai      # OPENAI_API_KEY
npm run i18n:fill -- --all --provider=gemini      # GEMINI_API_KEY
npm run i18n:fill -- --all --model=claude-sonnet-5   # cheaper for bulk
npm run i18n:fill -- --all --dry-run              # count strings, send nothing
```

## D. Publishing to the translations repo

The `.mo` and `.json` files in `languages/` are only half the story: the plugin
downloads translation packs at runtime from the public
**`atlasaidev-translations`** repo (`TTA_Translation_Downloader`). `i18n:publish`
is what gets them there.

```bash
npm run i18n:publish                  # copy + rewrite manifest, then show the diff
npm run i18n:publish -- --dry-run     # report only, write nothing
npm run i18n:publish -- --commit      # ...and commit
npm run i18n:publish -- --push        # ...and commit and push
npm run i18n:publish -- --repo=/path/to/atlasaidev-translations
```

It defaults to `atlasaidev-translations` sitting beside the WordPress install
(`D:/laragon/www/atlasaidev-translations`); use `--repo=` for any other checkout.

**What it does**

- Copies `text-to-audio-<locale>.po`, `.mo` and every hashed `.json` into
  `atlasvoice/<locale>/`.
- **Deletes stale files it owns.** The `.json` filenames embed a hash of the
  script they belong to, so a rebuilt bundle would otherwise leave the old
  filename orphaned in the repo forever.
- **Rewrites `manifest.json` from the full locale list**, never appending. The
  downloader reads that file to know what exists, so a manifest listing only the
  locale you just added would hide all the others.
- **Never pushes on its own.** Publishing is outward-facing, so it stages and
  stops; `--commit` / `--push` are explicit.

**The safety check**

It refuses to touch the repo unless *every* locale in `AVAILABLE_LOCALES` is
completely built, and it reports all problems at once without copying anything:

| Situation | What you see |
|-----------|--------------|
| You added the locale and translated it but skipped `npm run translate` | `vi: has a .po but no .mo and hashed .json — run "npm run translate" first` |
| You added the locale to the constant but never ran `i18n:sync` | `vi: no .po — run "npm run i18n:sync" first` |
| The pending JSON was only partly filled | `tr_TR: translation-script/pending/tr_TR.json still exists — finish it, then ...` |

That third one matters: `i18n:apply` deliberately keeps the pending file when
strings are still empty, so its presence is the signal that the locale would
ship with English gaps. Without this guard the repo would happily receive an
empty or half-built locale folder that live sites then try to download.

## E. Restoring languages/ on a fresh clone

Only `languages/text-to-audio.pot` is committed to the plugin. Everything else
in that folder is gitignored, because the plugin does not ship translations —
a non-English site downloads only its own pack at runtime.

That makes the `.po` files easy to misread as disposable output. They are not:
`i18n:collect` *merges the `.pot` into an existing `.po`*, so on a clone with no
`.po` files a sync reports ~1,100 untranslated strings per locale and every
existing translation looks lost.

```bash
npm run i18n:pull                  # restore .po + .mo + .json from the repo
npm run i18n:pull -- --po-only     # just the .po; npm run translate rebuilds the rest
npm run i18n:pull -- --locale=it_IT
npm run i18n:pull -- --dry-run
```

It never deletes anything locally — an existing file is only overwritten by the
published one, so a `.po` you are part-way through editing is never discarded.

**Run it before `i18n:sync` on any machine that has not published yet.**

## Safety rules these scripts follow

- **Never overwrites a translation.** Only an empty `msgstr` is ever filled.
- **Never loses one.** A string the `.pot` no longer lists is kept with a
  `#. retained` comment instead of being deleted. (Rebuilding strictly from the
  `.pot` is what wiped the Italian for "Player Settings" during development.)
- **Resumable.** The pending file is written after every batch, so an
  interrupted or rate-limited run keeps its progress.
- **Order matters.** `npm run translate` runs last, always.

## What these commands cannot fix

`Listen`, `Pause`, `Resume` and `Replay` are **not** translated by this pipeline.
They are printed from the saved `tta__button_text_arr` option
(`includes/helpers.php:672`), so whatever English text sits in the settings is
output verbatim and the `.po` is never consulted. That needs a code change, not
a translation.
