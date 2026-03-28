# Translation Workflow Guide for Claude

This document describes the complete workflow for adding new language translations to the AtlasVoice (text-to-audio) plugin. Follow every step in order without asking for further instructions.

## Input

The user will provide:
- One or more locale codes (e.g., `de_DE`, `fr_FR`, `nl_NL`, `ja`, `ko_KR`, `zh_CN`, `es_ES`, `pt_BR`)

## Reference

Use any existing `generate-{lang}-po.js` file in `scripts/` as a template (e.g., `generate-pt-po.js`, `generate-de-po.js`). They all follow the same structure.

## Step-by-Step Workflow

### Step 1: Create the translation generator script

For each locale, create `scripts/generate-{lang}-po.js` with:

1. **A `translations` map object** — every `msgid` string from `languages/text-to-audio.pot` mapped to an accurate translation in the target language.
   - Extract ALL msgid strings from the `.pot` file (typically 800+ strings).
   - Translate every single one. Do not leave any empty.
   - Keep brand names as-is: `AtlasVoice`, `Google Cloud TTS`, `ChatGPT TTS`, `ElevenLabs`, `Chrome`, `Firefox`, `WordPress`, `WooCommerce`, `Autoptimize`, `LiteSpeed Cache`, `WP Rocket`, `W3 Total Cache`, `WP-Optimize`, `SG Optimizer`, etc.
   - Keep all placeholders exactly as-is: `%s`, `%d`, `%1$s`, `%2$s`, `%3$s`, `%4$s`, `%5$s`, `%6$s`, `%7$s`.
   - Keep all escaped quotes as-is: `\\\"`.
   - Keep emojis as-is.
   - Keep technical terms as-is: `CSS`, `API`, `JSON`, `MP3`, `SEO`, `TTS`, `HTML`, `DOM`, `JWT`, `SMTP`, `MCP`, `ACF`, `WPML`, `PHP`, etc.
   - Keep pricing values as-is: `$15.00 / 1M characters`, etc.
   - Keep shortcode names as-is: `tta_play_btn_shortcode`.
   - Keep URL strings as-is: `https://atlasaidev.com/`, `http://atlasaidev.com/`.
   - Keep format strings for audio as-is: `MP3 44100Hz 128kbps`, etc.
   - Keep percentages as-is: `25%`, `50%`, `75%`, `50% -> 75%`.

2. **Script logic** (after the translations object):
   - Read `../languages/text-to-audio.pot`.
   - Replace PO headers:
     - Copyright line -> `# Translation of Text To Speech TTS Accessibility into {Language Name}`
     - Last-Translator -> `AtlasAiDev <support@atlasaidev.com>`
     - Language-Team -> `{Language Name} <support@atlasaidev.com>`
     - PO-Revision-Date -> current date in `YYYY-MM-DD HH:MM+0000` format
   - Add Language header after Content-Transfer-Encoding:
     - `Language: {locale_code}`
     - `Plural-Forms:` (use correct plural form for the language)
   - Process line by line, strip `\r` from each line: `const line = lines[i].replace(/\r$/, '');`
   - Replace `msgstr ""` with the translation from the map when `currentMsgid` matches.
   - Output to `../languages/text-to-audio-{locale}.po`.

3. **Common plural forms:**
   - Germanic (de, nl, en): `nplurals=2; plural=(n != 1);`
   - French: `nplurals=2; plural=(n > 1);`
   - Romance (es, it, pt): `nplurals=2; plural=(n != 1);`
   - Japanese, Korean, Chinese: `nplurals=1; plural=0;`
   - Russian, Polish: more complex forms (look up if needed)

### Step 2: Run the generator scripts

```bash
node scripts/generate-{lang}-po.js
```

Verify the output shows a high translation count (e.g., `Translated: 828/829 strings`). If 0/0, the `.pot` file likely has `\r\n` line endings — ensure the script strips `\r` from each line.

### Step 3: Generate .mo and .json files

```bash
npm run translate
```

This creates:
- `.mo` file (PHP translations)
- Multiple `.json` files (JS translations, one per source file)

### Step 4: Move files to the translations repository

Move ALL generated files (`.po`, `.mo`, `.json`) — but NOT `.pot` — from `languages/` to:

```
D:\xampp\htdocs\azizulhasan\atlasaidev-translations\atlasvoice\{locale}\
```

Create the locale folder if it doesn't exist. Each language gets its own subfolder (e.g., `de_DE/`, `fr_FR/`, `nl_NL/`).

```bash
mkdir -p "D:\xampp\htdocs\azizulhasan\atlasaidev-translations\atlasvoice\{locale}"
cp languages/text-to-audio-{locale}* "D:\xampp\htdocs\azizulhasan\atlasaidev-translations\atlasvoice\{locale}/"
```

### Step 5: Remove translation files from the plugin languages folder

After copying, delete the generated files from the plugin's `languages/` folder. Only `text-to-audio.pot` should remain there.

```bash
rm -f languages/text-to-audio-{locale}*
```

### Step 6: Update manifest.json

Add the new locale(s) to the `locales` array in:

```
D:\xampp\htdocs\azizulhasan\atlasaidev-translations\atlasvoice\manifest.json
```

### Step 7: Update PHP files in the plugin

1. **`includes/TTA_Notices.php`** — in `get_locale_label()`:
   Add the new locale with its native language name to the `$labels` array.
   Use WordPress core locale labels (native names):
   - `de_DE` -> `Deutsch`
   - `fr_FR` -> `Francais`
   - `nl_NL` -> `Nederlands`
   - `es_ES` -> `Espanol (Espana)`
   - `it_IT` -> `Italiano`
   - `pt_PT` -> `Portugues (Portugal)`
   - `pt_BR` -> `Portugues (Brasil)`
   - `ja` -> Japanese characters
   - `ko_KR` -> Korean characters
   - `zh_CN` -> Chinese characters
   - Look up the native name for any other locale.

2. **`includes/TTA_Translation_Downloader.php`** — in `AVAILABLE_LOCALES`:
   Add the new locale code(s) to the array.

### Step 8: Push translations to git

Commit and push the translations repo:

```bash
cd "D:\xampp\htdocs\azizulhasan\atlasaidev-translations"
git add -A
git commit -m "Add {language names} translations for AtlasVoice"
git push
```

### Step 9: Verify

- Check the generator script output shows near 100% translation (e.g., 828/829).
- Check the `npm run translate` output shows JSON and MO files generated for each locale.
- Check the translations repo has the locale folders with all files.
- Check `manifest.json` includes the new locales.
- Check `AVAILABLE_LOCALES` includes the new locales.
- Check `get_locale_label()` includes the new locales.
- Check the plugin `languages/` folder only has `.pot` file (no generated locale files).

## Parallelization

- When translating multiple languages, create all `generate-{lang}-po.js` scripts in parallel using separate agents.
- Run all generator scripts in parallel.
- Run `npm run translate` once (it processes all `.po` files).

## Important Notes

- Do NOT add `Co-Authored-By` lines to git commits.
- The `.pot` file on Windows has `\r\n` line endings. Always strip `\r` in the script: `lines[i].replace(/\r$/, '')`.
- The translation map keys must match the `msgid` strings in the `.pot` file exactly (after unescaping PO format).
- Some strings are multiline in the `.pot` file. The script concatenates continuation lines (lines starting with `"` after `msgid`).
- Strings that are identical in source and target (brand names, URLs) should still be included in the map.
