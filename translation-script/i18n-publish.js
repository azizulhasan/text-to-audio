#!/usr/bin/env node
/**
 * i18n:publish — the last step of the translation round trip.
 *
 * Copies the built translation files out of languages/ and into the public
 * atlasaidev-translations repository, which is what TTA_Translation_Downloader
 * fetches from at runtime. One command, so adding a locale never means moving
 * files by hand.
 *
 * The safety check is the point of this script. `npm run translate` is what
 * actually produces the .mo and hashed .json files, and it is easy to skip:
 * you would then have a .po for the new locale and nothing else, and publishing
 * would push an empty locale folder that sites try to download. So this refuses
 * to touch the repo unless EVERY locale in AVAILABLE_LOCALES is fully built.
 *
 * Publishing is outward-facing, so it never pushes on its own: it stages the
 * files and stops. Pass --commit to commit, --push to commit and push.
 *
 *   npm run i18n:publish                 # copy + rewrite manifest, show the diff
 *   npm run i18n:publish -- --dry-run    # report only, touch nothing
 *   npm run i18n:publish -- --push       # copy, commit and push
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { availableLocales, PLUGIN_ROOT, LANG_DIR, DOMAIN } = require('./lib/locales');

// The repo sits beside the WordPress install, not inside it. Overridable so a
// checkout somewhere else does not need the tree to be laid out just so.
const DEFAULT_REPO = path.resolve(PLUGIN_ROOT, '..', '..', '..', '..', 'atlasaidev-translations');
const PLUGIN_SLUG = 'atlasvoice';
const PENDING_DIR = path.join(__dirname, 'pending');

function parseArgs(argv) {
    const out = { repo: null, dryRun: false, commit: false, push: false, message: null };
    for (const a of argv) {
        if (a === '--dry-run') out.dryRun = true;
        else if (a === '--commit') out.commit = true;
        else if (a === '--push') { out.push = true; out.commit = true; }
        else {
            let m = a.match(/^--repo=(.+)$/);
            if (m) out.repo = m[1];
            m = a.match(/^--message=(.+)$/);
            if (m) out.message = m[1];
        }
    }
    return out;
}

/**
 * Every file in languages/ that belongs to one locale.
 *
 * The trailing separator matters: without it "ja" would also swallow "ja_JP",
 * and "pt_PT" and "pt_BR" would stay distinct only by luck.
 *
 * @param {string} locale
 * @returns {{po: string|null, mo: string|null, json: string[]}}
 */
function builtFiles(locale) {
    const po = `${DOMAIN}-${locale}.po`;
    const mo = `${DOMAIN}-${locale}.mo`;
    const jsonPrefix = `${DOMAIN}-${locale}-`;

    const all = fs.readdirSync(LANG_DIR);
    return {
        po: all.includes(po) ? po : null,
        mo: all.includes(mo) ? mo : null,
        json: all.filter(f => f.startsWith(jsonPrefix) && f.endsWith('.json')).sort(),
    };
}

/**
 * Refuse to publish anything unless every locale is completely built.
 *
 * @param {string[]} locales
 * @returns {string[]} Human-readable problems; empty means good to go.
 */
function preflight(locales) {
    const problems = [];

    for (const locale of locales) {
        const f = builtFiles(locale);

        if (!f.po) {
            problems.push(`${locale}: no .po — run "npm run i18n:sync" first`);
            continue;
        }
        if (!f.mo || !f.json.length) {
            const missing = [!f.mo && '.mo', !f.json.length && 'hashed .json'].filter(Boolean).join(' and ');
            problems.push(`${locale}: has a .po but no ${missing} — run "npm run translate" first`);
            continue;
        }
        // A pending file only survives i18n:apply when strings are still empty,
        // so its presence means this locale would ship with English gaps.
        if (fs.existsSync(path.join(PENDING_DIR, `${locale}.json`))) {
            problems.push(`${locale}: translation-script/pending/${locale}.json still exists — finish it, then "npm run i18n:apply -- --locale=${locale} && npm run translate"`);
        }
    }

    return problems;
}

/**
 * Make the published folder match languages/ exactly for one locale.
 *
 * Copying alone is not enough: the .json filenames carry a hash of the script
 * they belong to, so a rebuilt bundle leaves the old name orphaned in the repo
 * forever. Anything this pipeline owns and no longer generates is removed.
 *
 * @returns {{copied: number, removed: string[]}}
 */
function syncLocale(locale, repoDir, dryRun) {
    const destDir = path.join(repoDir, PLUGIN_SLUG, locale);
    const f = builtFiles(locale);
    const wanted = [f.po, f.mo, ...f.json];

    if (!dryRun) fs.mkdirSync(destDir, { recursive: true });

    const existing = fs.existsSync(destDir) ? fs.readdirSync(destDir) : [];
    const ownedPrefix = `${DOMAIN}-${locale}`;
    const stale = existing.filter(name =>
        name.startsWith(ownedPrefix + '-') || name === `${ownedPrefix}.po` || name === `${ownedPrefix}.mo`
    ).filter(name => !wanted.includes(name));

    if (!dryRun) {
        for (const name of stale) fs.unlinkSync(path.join(destDir, name));
        for (const name of wanted) {
            fs.copyFileSync(path.join(LANG_DIR, name), path.join(destDir, name));
        }
    }

    return { copied: wanted.length, removed: stale };
}

/**
 * Rewrite the manifest from the full locale list.
 *
 * Always rebuilt, never appended to: the downloader reads this to know what
 * exists, so a manifest listing only the locale you just added would hide the
 * rest. Other keys are preserved so the file stays ours to edit.
 */
function writeManifest(locales, repoDir, dryRun) {
    const file = path.join(repoDir, PLUGIN_SLUG, 'manifest.json');
    let manifest = { plugin: DOMAIN, text_domain: DOMAIN, version: '1.0.0' };

    if (fs.existsSync(file)) {
        try {
            manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (e) {
            throw new Error(`manifest.json is not valid JSON (${e.message}) — fix or delete it, then re-run`);
        }
    }

    const before = (manifest.locales || []).join(',');
    manifest.locales = locales;

    if (!dryRun) fs.writeFileSync(file, JSON.stringify(manifest, null, 4) + '\n', 'utf8');
    return { changed: before !== locales.join(','), file };
}

function git(repoDir, args) {
    return execFileSync('git', args, { cwd: repoDir, encoding: 'utf8' });
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const repoDir = path.resolve(args.repo || DEFAULT_REPO);
    const locales = availableLocales();

    if (!fs.existsSync(path.join(repoDir, '.git'))) {
        console.error(`Not a git checkout: ${repoDir}`);
        console.error('Pass --repo=<path> to point at the atlasaidev-translations clone.');
        process.exit(1);
    }

    console.log(`Publishing ${locales.length} locale(s) → ${repoDir}`);
    console.log('');

    const problems = preflight(locales);
    if (problems.length) {
        console.error('Refusing to publish — some locales are not fully built:');
        console.error('');
        for (const p of problems) console.error('  ✗ ' + p);
        console.error('');
        console.error('Nothing was copied. The usual full sequence is:');
        console.error('  npm run i18n:sync      → fill translation-script/pending/*.json → npm run i18n:finish');
        console.error('  npm run i18n:publish');
        process.exit(1);
    }

    for (const locale of locales) {
        const r = syncLocale(locale, repoDir, args.dryRun);
        const note = r.removed.length ? `   -${r.removed.length} stale` : '';
        console.log(`  ${locale.padEnd(7)} ${String(r.copied).padStart(3)} files${note}`);
    }

    const m = writeManifest(locales, repoDir, args.dryRun);
    console.log('');
    console.log(`  manifest.json ${m.changed ? 'updated' : 'unchanged'} (${locales.length} locales)`);
    console.log('');

    if (args.dryRun) {
        console.log('Dry run — nothing was written.');
        return;
    }

    const status = git(repoDir, ['status', '--short']);
    if (!status.trim()) {
        console.log('Repository is already up to date; nothing to commit.');
        return;
    }

    console.log(status.trimEnd());
    console.log('');

    if (!args.commit) {
        console.log('Files copied but NOT committed. Review the diff above, then:');
        console.log('  npm run i18n:publish -- --commit    (or --push to commit and push)');
        return;
    }

    const message = args.message || `Update AtlasVoice translations (${locales.join(', ')})`;
    git(repoDir, ['add', '--all', PLUGIN_SLUG]);
    git(repoDir, ['commit', '-m', message]);
    console.log(`Committed: ${message}`);

    if (args.push) {
        git(repoDir, ['push']);
        console.log('Pushed to origin.');
    } else {
        console.log('Not pushed. Run "npm run i18n:publish -- --push" when you are ready.');
    }
}

main();
