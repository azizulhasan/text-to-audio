/**
 * Minimal gettext PO/POT parser and serializer.
 *
 * Shared by i18n-collect.js and i18n-apply.js so the two halves of the round
 * trip can never disagree about escaping or entry identity. Deliberately small:
 * it understands the subset this plugin's catalogues actually use (comments,
 * msgctxt, msgid, msgid_plural, msgstr, msgstr[n], multi-line continuations)
 * and nothing more.
 */

const fs = require('fs');

/**
 * Unescape a PO string literal. PO uses C-style escapes, so a quote arrives as
 * \" and must become " before it reaches JSON or a JS __() lookup — otherwise
 * the key never matches what the code asks for.
 *
 * @param {string} str Raw contents between the quotes.
 * @returns {string}
 */
function unescapePO(str) {
    let out = '';
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '\\' && i + 1 < str.length) {
            const next = str[i + 1];
            if (next === 'n') { out += '\n'; i++; continue; }
            if (next === 't') { out += '\t'; i++; continue; }
            if (next === 'r') { out += '\r'; i++; continue; }
            if (next === '"') { out += '"'; i++; continue; }
            if (next === '\\') { out += '\\'; i++; continue; }
        }
        out += str[i];
    }
    return out;
}

/**
 * Escape a string back into PO form. Backslash first, or it would double-escape
 * the sequences produced by the later replacements.
 *
 * @param {string} str
 * @returns {string}
 */
function escapePO(str) {
    return String(str === undefined || str === null ? '' : str)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
}

/**
 * An entry's identity in gettext is context + singular id, not the id alone —
 * the same word can carry different translations under different contexts.
 *
 * @param {Object} entry
 * @returns {string}
 */
function entryKey(entry) {
    return (entry.msgctxt === undefined ? '' : entry.msgctxt) + '' + entry.msgid;
}

/**
 * Parse a PO or POT file.
 *
 * @param {string} file Absolute path.
 * @returns {{header: string, entries: Array}} header is the raw text before the
 *          first real entry (the msgid "" block and any leading comments).
 */
function parsePO(file) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

    const entries = [];
    let headerLines = [];
    let seenHeader = false;

    let cur = null;
    let field = null;   // which buffer a bare "..." continuation appends to
    let pluralIdx = 0;

    const flush = () => {
        if (!cur) return;
        // The msgid "" block is the header, not a translatable entry.
        if (cur.msgid === '' && cur.msgctxt === undefined && !seenHeader) {
            seenHeader = true;
            headerLines = cur.raw.slice();
        } else {
            entries.push(cur);
        }
        cur = null;
        field = null;
    };

    const begin = () => {
        if (!cur) cur = { comments: [], references: [], msgid: undefined, msgstr: '', msgstrPlural: [], raw: [] };
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === '') { flush(); continue; }

        if (trimmed.startsWith('#')) {
            begin();
            cur.raw.push(line);
            cur.comments.push(line);
            if (trimmed.startsWith('#:')) {
                trimmed.slice(2).trim().split(/\s+/).filter(Boolean).forEach(r => cur.references.push(r));
            }
            continue;
        }

        const m = trimmed.match(/^(msgctxt|msgid_plural|msgid|msgstr(?:\[(\d+)\])?)\s+"([\s\S]*)"$/);
        if (m) {
            begin();
            cur.raw.push(line);
            const value = unescapePO(m[3]);
            if (m[1] === 'msgctxt') { cur.msgctxt = value; field = 'msgctxt'; }
            else if (m[1] === 'msgid') { cur.msgid = value; field = 'msgid'; }
            else if (m[1] === 'msgid_plural') { cur.msgidPlural = value; field = 'msgidPlural'; }
            else if (m[2] !== undefined) { pluralIdx = parseInt(m[2], 10); cur.msgstrPlural[pluralIdx] = value; field = 'plural'; }
            else { cur.msgstr = value; field = 'msgstr'; }
            continue;
        }

        // Bare "..." line: a continuation of whatever field we are inside.
        const cont = trimmed.match(/^"([\s\S]*)"$/);
        if (cont && cur && field) {
            cur.raw.push(line);
            const value = unescapePO(cont[1]);
            if (field === 'msgctxt') cur.msgctxt += value;
            else if (field === 'msgid') cur.msgid += value;
            else if (field === 'msgidPlural') cur.msgidPlural += value;
            else if (field === 'plural') cur.msgstrPlural[pluralIdx] += value;
            else cur.msgstr += value;
        }
    }
    flush();

    return { header: headerLines.join('\n'), entries };
}

/**
 * Serialize entries back to PO text.
 *
 * @param {string} header Raw header block (msgid "" ... msgstr "...").
 * @param {Array}  entries
 * @returns {string}
 */
function serializePO(header, entries) {
    const out = [];
    if (header) { out.push(header, ''); }

    for (const e of entries) {
        for (const c of e.comments) out.push(c);
        if (e.msgctxt !== undefined) out.push(`msgctxt "${escapePO(e.msgctxt)}"`);
        out.push(`msgid "${escapePO(e.msgid)}"`);
        if (e.msgidPlural !== undefined) {
            out.push(`msgid_plural "${escapePO(e.msgidPlural)}"`);
            const n = Math.max(2, e.msgstrPlural.length);
            for (let i = 0; i < n; i++) out.push(`msgstr[${i}] "${escapePO(e.msgstrPlural[i] || '')}"`);
        } else {
            out.push(`msgstr "${escapePO(e.msgstr)}"`);
        }
        out.push('');
    }

    return out.join('\n');
}

/**
 * Is this entry still waiting for a translation?
 *
 * @param {Object} e
 * @returns {boolean}
 */
function isUntranslated(e) {
    if (e.msgidPlural !== undefined) {
        return !e.msgstrPlural.length || e.msgstrPlural.every(s => !s);
    }
    return !e.msgstr;
}

module.exports = { parsePO, serializePO, escapePO, unescapePO, entryKey, isUntranslated };
