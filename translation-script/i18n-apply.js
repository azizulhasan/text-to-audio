#!/usr/bin/env node
/**
 * i18n:apply — step 4 of the translation round trip.
 *
 * Reads translation-script/pending/<locale>.json and writes each filled value
 * into the matching entry in languages/text-to-audio-<locale>.po.
 *
 * It only ever fills an EMPTY msgstr. An entry a human already translated is
 * left exactly as it is, so re-running this can never overwrite existing work,
 * and a half-filled pending file is safe to apply.
 */

const fs = require('fs');
const path = require('path');
const { parsePO, serializePO, isUntranslated } = require('./lib/po');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const LANG_DIR = path.join(PLUGIN_ROOT, 'languages');
const PENDING_DIR = path.join(__dirname, 'pending');
const DOMAIN = 'text-to-audio';

/**
 * The locale list lives in exactly one place — the downloader constant that
 * decides what a site can fetch. See lib/locales.js.
 */
const { availableLocales } = require('./lib/locales');

function parseArgs(argv) {
    const out = { locales: null, all: false };
    for (const a of argv) {
        if (a === '--all') out.all = true;
        const m = a.match(/^--locale=(.+)$/);
        if (m) out.locales = m[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    return out;
}

/**
 * @param {string} locale
 * @returns {Object|null} Counts, or null when there is nothing to apply.
 */
function applyLocale(locale) {
    const poFile = path.join(LANG_DIR, `${DOMAIN}-${locale}.po`);
    const pendingFile = path.join(PENDING_DIR, `${locale}.json`);

    if (!fs.existsSync(pendingFile)) return { skipped: 'no pending file' };
    if (!fs.existsSync(poFile)) return { skipped: 'no .po — run i18n:collect first' };

    let pending;
    try {
        pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
    } catch (e) {
        return { skipped: 'pending file is not valid JSON: ' + e.message };
    }

    const po = parsePO(poFile);
    let filled = 0;
    let stillEmpty = 0;

    for (const e of po.entries) {
        if (!isUntranslated(e)) continue;

        const key = e.msgctxt !== undefined ? `${e.msgctxt}${e.msgid}` : e.msgid;
        const value = pending[key];

        if (typeof value === 'string' && value.trim() !== '') {
            if (e.msgidPlural !== undefined) {
                // Without per-form input, use the one value for every form; a
                // translator can refine it, and it beats shipping empty.
                const n = Math.max(2, e.msgstrPlural.length);
                e.msgstrPlural = Array.from({ length: n }, () => value);
            } else {
                e.msgstr = value;
            }
            filled++;
        } else {
            stillEmpty++;
        }
    }

    fs.writeFileSync(poFile, serializePO(po.header, po.entries), 'utf8');

    // Only clear the work file once nothing is left, so a partial pass can be
    // resumed by filling the same file again.
    if (stillEmpty === 0) fs.unlinkSync(pendingFile);

    return { filled, stillEmpty, poFile };
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const locales = args.all ? availableLocales() : args.locales;

    if (!locales || !locales.length) {
        console.error('Usage: npm run i18n:apply -- --locale=it_IT   |   -- --all');
        console.error('Available: ' + availableLocales().join(', '));
        process.exit(1);
    }

    let grandFilled = 0;
    for (const locale of locales) {
        const r = applyLocale(locale);
        if (r.skipped) { console.log(`  ${locale.padEnd(7)} skipped — ${r.skipped}`); continue; }
        grandFilled += r.filled;
        const left = r.stillEmpty ? `${r.stillEmpty} still empty` : 'all filled';
        console.log(`  ${locale.padEnd(7)} +${String(r.filled).padStart(4)} translated   ${left}`);
    }

    console.log('');
    console.log(grandFilled
        ? 'Next: npm run translate   (distributes into .mo and the hashed .json files)'
        : 'Nothing applied.');
}

main();
