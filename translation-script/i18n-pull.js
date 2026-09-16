#!/usr/bin/env node
/**
 * i18n:pull — the inverse of i18n:publish.
 *
 * Restores languages/ from the atlasaidev-translations repo.
 *
 * Only text-to-audio.pot is committed in the plugin; every .po, .mo and hashed
 * .json in languages/ is a build artefact that ships from the translations repo
 * instead, so a fresh clone starts with nothing to translate against. That is a
 * problem for the .po files specifically: they are not just output, they are the
 * input i18n:collect merges the .pot into. Without them a sync would hand you
 * ~1,100 empty strings per locale as if nothing had ever been translated.
 *
 * So: before running i18n:sync on a clone, run this.
 *
 *   npm run i18n:pull                    # restore everything
 *   npm run i18n:pull -- --po-only       # just the .po (npm run translate rebuilds the rest)
 *   npm run i18n:pull -- --locale=it_IT
 *   npm run i18n:pull -- --dry-run
 */

const fs = require('fs');
const path = require('path');
const { availableLocales, PLUGIN_ROOT, LANG_DIR, DOMAIN } = require('./lib/locales');

const DEFAULT_REPO = path.resolve(PLUGIN_ROOT, '..', '..', '..', '..', 'atlasaidev-translations');
const PLUGIN_SLUG = 'atlasvoice';

function parseArgs(argv) {
    const out = { repo: null, dryRun: false, poOnly: false, locales: null };
    for (const a of argv) {
        if (a === '--dry-run') out.dryRun = true;
        else if (a === '--po-only') out.poOnly = true;
        else {
            let m = a.match(/^--repo=(.+)$/);
            if (m) out.repo = m[1];
            m = a.match(/^--locale=(.+)$/);
            if (m) out.locales = m[1].split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return out;
}

/**
 * Copy one locale's published files back into languages/.
 *
 * Never deletes anything locally: a .po you are part-way through editing is
 * worth more than tidiness, so an existing file is only ever overwritten by a
 * newer published one, and local-only files are left alone.
 */
function pullLocale(locale, repoDir, { poOnly, dryRun }) {
    const srcDir = path.join(repoDir, PLUGIN_SLUG, locale);
    if (!fs.existsSync(srcDir)) return { skipped: 'not published yet' };

    const wanted = fs.readdirSync(srcDir).filter(name => {
        if (!name.startsWith(`${DOMAIN}-${locale}`)) return false;
        if (poOnly) return name === `${DOMAIN}-${locale}.po`;
        return name.endsWith('.po') || name.endsWith('.mo') || name.endsWith('.json');
    });

    if (!wanted.length) return { skipped: poOnly ? 'no .po published' : 'nothing published' };

    if (!dryRun) {
        fs.mkdirSync(LANG_DIR, { recursive: true });
        for (const name of wanted) {
            fs.copyFileSync(path.join(srcDir, name), path.join(LANG_DIR, name));
        }
    }

    return { copied: wanted.length };
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const repoDir = path.resolve(args.repo || DEFAULT_REPO);
    const locales = args.locales || availableLocales();

    if (!fs.existsSync(path.join(repoDir, PLUGIN_SLUG))) {
        console.error(`No ${PLUGIN_SLUG}/ folder in: ${repoDir}`);
        console.error('Pass --repo=<path> to point at the atlasaidev-translations clone.');
        process.exit(1);
    }

    console.log(`Restoring ${locales.length} locale(s) ← ${repoDir}`);
    console.log('');

    let total = 0;
    for (const locale of locales) {
        const r = pullLocale(locale, repoDir, args);
        if (r.skipped) { console.log(`  ${locale.padEnd(7)} skipped — ${r.skipped}`); continue; }
        total += r.copied;
        console.log(`  ${locale.padEnd(7)} ${String(r.copied).padStart(3)} files`);
    }

    console.log('');
    if (args.dryRun) { console.log('Dry run — nothing was written.'); return; }
    console.log(total
        ? (args.poOnly
            ? `Restored ${total} .po file(s). Run "npm run translate" to rebuild the .mo and .json.`
            : `Restored ${total} file(s). languages/ now matches the published packs.`)
        : 'Nothing restored.');
}

main();
