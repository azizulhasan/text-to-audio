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

## 🆕 Adding New Languages

1. **Copy the POT template:**
   ```bash
   cp languages/text-to-audio.pot languages/text-to-audio-fr.po
   ```

2. **Edit PO file header:**
   ```po
   "Language: fr\n"
   "Language-Team: French\n"
   ```

3. **Translate strings** (use Poedit or edit manually)

4. **Generate files:**
   ```bash
   npm run translate
   ```

The script automatically:
- Detects the new locale
- Analyzes file references
- Routes strings to JSON, MO, or both
- Creates files with correct hash

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
| `npm run translate` | Generate JSON and MO files (recommended) |

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
- Implementation docs: `I18N-IMPLEMENTATION-SUMMARY.md`

## 🎉 Summary

The translation system now:
- ✅ Uses a single command: `npm run translate`
- ✅ Automatically detects JS vs PHP strings
- ✅ Handles shared strings correctly (in both files)
- ✅ Generates optimized JSON and MO files
- ✅ Cleans up old files automatically

**No manual work needed - just run the command!** 🚀
