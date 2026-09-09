#!/usr/bin/env node
/**
 * i18n:fill — the optional automated middle step.
 *
 * Fills translation-script/pending/<locale>.json by calling an AI provider
 * directly, so the whole round trip can run unattended:
 *
 *   npm run i18n:auto            (collect → fill → apply → distribute)
 *
 * This does NOT replace the keyless path. With no --provider, or no key in the
 * environment, the pending files are still meant to be filled by whichever AI
 * client you are sitting in and applied with i18n:apply.
 *
 * Providers and the key each expects:
 *   --provider=anthropic   ANTHROPIC_API_KEY
 *   --provider=openai      OPENAI_API_KEY
 *   --provider=gemini      GEMINI_API_KEY
 *
 * Only empty values are sent, and only empty values are written back, so this
 * can never overwrite a translation a human already made.
 */

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const PENDING_DIR = path.join(__dirname, 'pending');

// Bulk translation is hundreds of short UI strings. Keep batches small enough
// that one bad response costs little and the model keeps full context on each.
const BATCH_SIZE = 40;

const DEFAULT_MODELS = {
    anthropic: 'claude-opus-5',
    openai: 'gpt-4o',
    gemini: 'gemini-2.0-flash',
};

/** Human-readable language names, so the prompt does not lean on locale codes. */
const LANGUAGE_NAMES = {
    es_ES: 'Spanish (Spain)',
    it_IT: 'Italian',
    pt_BR: 'Portuguese (Brazil)',
    pt_PT: 'Portuguese (Portugal)',
    de_DE: 'German',
    fr_FR: 'French',
    nl_NL: 'Dutch',
    ja: 'Japanese',
    pl_PL: 'Polish',
    ru_RU: 'Russian',
    tr_TR: 'Turkish',
    vi: 'Vietnamese',
};

/**
 * The locale list lives in exactly one place — the downloader constant that
 * decides what a site can fetch. See lib/locales.js.
 */
const { availableLocales } = require('./lib/locales');

function parseArgs(argv) {
    const out = { locales: null, all: false, provider: null, model: null, dryRun: false };
    for (const a of argv) {
        if (a === '--all') out.all = true;
        else if (a === '--dry-run') out.dryRun = true;
        else {
            let m;
            if ((m = a.match(/^--locale=(.+)$/))) out.locales = m[1].split(',').map(s => s.trim()).filter(Boolean);
            else if ((m = a.match(/^--provider=(.+)$/))) out.provider = m[1].trim().toLowerCase();
            else if ((m = a.match(/^--model=(.+)$/))) out.model = m[1].trim();
        }
    }
    return out;
}

function buildPrompt(language, strings) {
    return [
        `Translate these WordPress plugin UI strings from English into ${language}.`,
        '',
        'Rules:',
        '- Return ONLY a JSON object mapping each original English string to its translation.',
        '- Keep every key byte-identical to the input, including punctuation and case.',
        '- Preserve placeholders such as %s, %1$s, {count} and HTML tags exactly as they appear.',
        '- These label buttons, tooltips and settings in a text-to-speech accessibility plugin.',
        '  Keep them short enough to fit a control, and use the wording that platform’s users expect.',
        '- If a string is a proper noun or should stay in English, return it unchanged.',
        '',
        'Strings:',
        JSON.stringify(strings, null, 2),
    ].join('\n');
}

/**
 * Pull the first JSON object out of a model response, tolerating a ```json
 * fence or a sentence of preamble.
 *
 * @param {string} text
 * @returns {Object|null}
 */
function extractJSON(text) {
    if (!text) return null;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch (e) {
        return null;
    }
}

async function callAnthropic(model, prompt, key) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 8192,
            messages: [{ role: 'user', content: prompt }],
        }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    return (json.content || []).map(c => c.text || '').join('');
}

async function callOpenAI(model, prompt, key) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
}

async function callGemini(model, prompt, key) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
        }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    return (json.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
}

const PROVIDERS = {
    anthropic: { env: 'ANTHROPIC_API_KEY', call: callAnthropic },
    openai: { env: 'OPENAI_API_KEY', call: callOpenAI },
    gemini: { env: 'GEMINI_API_KEY', call: callGemini },
};

async function fillLocale(locale, provider, model, dryRun) {
    const file = path.join(PENDING_DIR, `${locale}.json`);
    if (!fs.existsSync(file)) return { skipped: 'no pending file' };

    const pending = JSON.parse(fs.readFileSync(file, 'utf8'));
    const empty = Object.keys(pending).filter(k => !pending[k]);
    if (!empty.length) return { skipped: 'already complete' };

    const language = LANGUAGE_NAMES[locale] || locale;
    if (dryRun) return { wouldSend: empty.length, batches: Math.ceil(empty.length / BATCH_SIZE) };

    const { env, call } = PROVIDERS[provider];
    const key = process.env[env];

    let filled = 0;
    for (let i = 0; i < empty.length; i += BATCH_SIZE) {
        const batch = empty.slice(i, i + BATCH_SIZE);
        const text = await call(model, buildPrompt(language, batch), key);
        const map = extractJSON(text);

        if (!map) {
            console.log(`      batch ${Math.floor(i / BATCH_SIZE) + 1}: unparseable response, skipped`);
            continue;
        }

        for (const k of batch) {
            const v = map[k];
            // Only ever fill an empty slot, and never write a blank.
            if (typeof v === 'string' && v.trim() && !pending[k]) {
                pending[k] = v;
                filled++;
            }
        }

        // Write after every batch so an interrupted run keeps its progress.
        fs.writeFileSync(file, JSON.stringify(pending, null, 2) + '\n', 'utf8');
        process.stdout.write(`      ${Math.min(i + BATCH_SIZE, empty.length)}/${empty.length}\r`);
    }

    return { filled, remaining: Object.keys(pending).filter(k => !pending[k]).length };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const locales = args.all ? availableLocales() : args.locales;

    if (!locales || !locales.length) {
        console.error('Usage: npm run i18n:fill -- --provider=anthropic --locale=it_IT   |   -- --all');
        process.exit(1);
    }

    if (!args.dryRun) {
        if (!args.provider || !PROVIDERS[args.provider]) {
            console.error('Missing or unknown --provider. Expected one of: ' + Object.keys(PROVIDERS).join(', '));
            console.error('Without a provider, fill translation-script/pending/*.json from your AI client instead,');
            console.error('then run: npm run i18n:apply -- --all');
            process.exit(1);
        }
        if (!process.env[PROVIDERS[args.provider].env]) {
            console.error(`${PROVIDERS[args.provider].env} is not set in the environment.`);
            console.error('Set it, or use the keyless path: fill the pending JSON from your AI client, then i18n:apply.');
            process.exit(1);
        }
    }

    const model = args.model || DEFAULT_MODELS[args.provider] || '';
    if (!args.dryRun) console.log(`Provider: ${args.provider}   Model: ${model}\n`);

    for (const locale of locales) {
        const r = await fillLocale(locale, args.provider, model, args.dryRun);
        if (r.skipped) { console.log(`  ${locale.padEnd(7)} skipped — ${r.skipped}`); continue; }
        if (args.dryRun) { console.log(`  ${locale.padEnd(7)} would send ${r.wouldSend} strings in ${r.batches} batch(es)`); continue; }
        console.log(`  ${locale.padEnd(7)} +${String(r.filled).padStart(4)} filled   ${r.remaining} left`);
    }

    if (!args.dryRun) console.log('\nNext: npm run i18n:apply -- --all && npm run translate');
}

main().catch(err => { console.error('\n✗ ' + err.message); process.exit(1); });
