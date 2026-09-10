#!/usr/bin/env node
/**
 * i18n:collect — step 2 of the translation round trip.
 *
 *   npm run makepot
 *   npm run i18n:collect -- --locale=it_IT     (or --all)
 *   <an AI client fills translation-script/pending/<locale>.json>
 *   npm run i18n:apply   -- --locale=it_IT     (or --all)
 *   npm run translate
 *
 * For each locale this merges the freshly generated .pot into the .po (adding
 * new strings with an empty msgstr, never touching one that already has a
 * translation), then writes just the empty ones to a small JSON work file.
 *
 * There is no API key and no network call: the AI client you are already using
 * fills the JSON, which is why this works from Claude, ChatGPT or Gemini alike.
 */

const fs = require('fs');
const path = require('path');
const { parsePO, serializePO, entryKey, isUntranslated } = require('./lib/po');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const LANG_DIR = path.join(PLUGIN_ROOT, 'languages');
const POT = path.join(LANG_DIR, 'text-to-audio.pot');
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
 * Merge the POT into one locale's PO and write its pending work file.
 *
 * @param {string} locale
 * @param {Object} pot Parsed POT.
 * @returns {Object} Counts for the summary line.
 */
function collectLocale(locale, pot) {
    const poFile = path.join(LANG_DIR, `${DOMAIN}-${locale}.po`);

    let existing = { header: '', entries: [] };
    if (fs.existsSync(poFile)) {
        existing = parsePO(poFile);
    } else {
        // No catalogue yet: start from the POT header so the file is valid.
        existing.header = pot.header;
    }

    const known = new Map();
    for (const e of existing.entries) known.set(entryKey(e), e);

    // Rebuild from the POT so the PO mirrors the current code: strings that no
    // longer exist drop out, new ones arrive empty, and anything already
    // translated keeps its msgstr.
    const merged = pot.entries.map(potEntry => {
        const prev = known.get(entryKey(potEntry));
        const e = {
            comments: potEntry.comments,
            references: potEntry.references,
            msgctxt: potEntry.msgctxt,
            msgid: potEntry.msgid,
            msgidPlural: potEntry.msgidPlural,
            msgstr: prev ? prev.msgstr : '',
            msgstrPlural: prev ? (prev.msgstrPlural || []) : [],
        };
        return e;
    });

    // Anything the POT no longer lists — a string that moved, was rewritten, or
    // is temporarily unextractable — is KEPT, not dropped. Rebuilding strictly
    // from the POT silently destroys finished translations: it is what lost the
    // Italian for "Player Settings" the first time this ran. gettext would mark
    // these obsolete with #~; retaining them live is the same protection without
    // needing obsolete-block support in the serializer, and costs only file size.
    const inPot = new Set(pot.entries.map(entryKey));
    const retained = existing.entries.filter(e => !inPot.has(entryKey(e)) && !isUntranslated(e));
    for (const e of retained) {
        if (!e.comments.some(c => c.startsWith('#. retained'))) {
            e.comments = ['#. retained: no longer in the POT, kept so the translation is not lost'].concat(e.comments);
        }
    }

    fs.writeFileSync(poFile, serializePO(existing.header || pot.header, merged.concat(retained)), 'utf8');

    const pending = {};
    for (const e of merged) {
        if (!isUntranslated(e)) continue;
        // Context-qualified ids would collide as plain JSON keys, so they are
        // namespaced the way gettext writes them.
        const key = e.msgctxt !== undefined ? `${e.msgctxt}${e.msgid}` : e.msgid;
        pending[key] = '';
    }

    const pendingFile = path.join(PENDING_DIR, `${locale}.json`);
    if (Object.keys(pending).length) {
        fs.mkdirSync(PENDING_DIR, { recursive: true });
        fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2) + '\n', 'utf8');
    } else if (fs.existsSync(pendingFile)) {
        fs.unlinkSync(pendingFile);
    }

    return { total: merged.length, pending: Object.keys(pending).length, poFile, pendingFile };
}

function main() {
    if (!fs.existsSync(POT)) {
        console.error(`✗ ${POT} not found — run "npm run makepot" first.`);
        process.exit(1);
    }

    const args = parseArgs(process.argv.slice(2));
    const locales = args.all ? availableLocales() : args.locales;

    if (!locales || !locales.length) {
        console.error('Usage: npm run i18n:collect -- --locale=it_IT   |   -- --all');
        console.error('Available: ' + availableLocales().join(', '));
        process.exit(1);
    }

    const pot = parsePO(POT);
    console.log(`POT: ${pot.entries.length} strings\n`);

    let grandPending = 0;
    for (const locale of locales) {
        const r = collectLocale(locale, pot);
        grandPending += r.pending;
        const status = r.pending
            ? `${r.pending} awaiting translation → ${path.relative(PLUGIN_ROOT, r.pendingFile)}`
            : 'complete';
        console.log(`  ${locale.padEnd(7)} ${String(r.total).padStart(5)} strings   ${status}`);
    }

    console.log('');
    if (grandPending) {
        console.log(`Next: fill the empty values in translation-script/pending/, then run:`);
        console.log(`  npm run i18n:apply -- ${args.all ? '--all' : '--locale=' + locales.join(',')}`);
        console.log(`  npm run translate`);
    } else {
        console.log('Nothing to translate. Run "npm run translate" to distribute.');
    }
}

main();
