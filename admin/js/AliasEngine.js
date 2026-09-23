/**
 * TTS-319: pronunciation rules (aliases, number rules, filters) in one class.
 * Used by TextToSpeech (every player, Free and Pro) and, through the small
 * tts-alias-engine bundle, by pages that do not load a player (Pro Bulk MP3).
 * TTS-316: whole words only. Shared by JS players; mirrors TTA_Helper::replace_alias() in PHP.
 */
export default class AliasEngine {
    /**
     * Apply every pronunciation rule to `text`. TTS-316: whole words only, so
     * "ca." no longer rewrites "Africa." — a letter/number next to a match blocks it.
     */
    static replaceAliases(text, aliases, caseInsensitive = false) {
        if (!text) {
            return text;
        }
        // TTS-319: every path that prepares spoken text (players, multilingual
        // copies, Bulk MP3, selection) runs through here, so these two filters
        // are the single place a site can extend pronunciation:
        //   tts_text_aliases       - add/change rules ({actual_text, to_read, apply_to_numbers})
        //   tts_pronunciation_text - change the final text (e.g. a custom number format)
        const hooks = typeof window !== 'undefined' ? window.wp?.hooks : null;
        let rules = aliases ? Object.values(aliases) : [];
        if (hooks) {
            rules = hooks.applyFilters('tts_text_aliases', rules, text) || [];
        }
        for (const alias of rules) {
            const rule = AliasEngine.buildAliasRule(alias, caseInsensitive);
            if (rule) {
                text = text.replace(rule.regex, rule.replace);
            }
        }
        return hooks ? hooks.applyFilters('tts_pronunciation_text', text, rules) : text;
    }

    /**
     * TTS-319: one alias -> { regex, replace }. With `apply_to_numbers`, the
     * numbers in the example become "any number" and are carried into the
     * spoken text ("5k" -> "5 thousand" also reads "250k" as "250 thousand"),
     * so users teach by example and never write a pattern. Mirrors
     * TTA_Helper::replace_alias() in PHP. Returns null for an empty alias.
     */
    static buildAliasRule(alias, caseInsensitive = false) {
        const find = String(alias?.actual_text ?? '');
        if (!find) {
            return null;
        }
        const toRead = String(alias?.to_read ?? '');
        const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const numbers = alias?.apply_to_numbers ? (find.match(AliasEngine.ALIAS_NUMBER) || []) : [];
        // Reuse the numbers only when every one is in the spoken text too;
        // otherwise "5k" -> "five thousand" would read "250k" as "five thousand".
        const generalize = numbers.length > 0 && numbers.every((n) => toRead.includes(n));

        let source = esc(find);
        let template = toRead;
        if (generalize) {
            source = '';
            let rest = find;
            numbers.forEach((n, i) => {
                const at = rest.indexOf(n);
                source += esc(rest.slice(0, at)) + '(' + AliasEngine.ALIAS_NUMBER.source + ')';
                rest = rest.slice(at + n.length);
                // Letter-only placeholder: a digit here could be matched by the next number.
                template = template.replace(n, '\u0000' + String.fromCharCode(65 + i) + '\u0000');
            });
            source += esc(rest);
        }

        // Whole words only, except in scripts written without spaces (Chinese,
        // Japanese, Thai...), where a neighbouring letter is not a word edge.
        const needsEdge = (ch) => /[\p{L}\p{N}]/u.test(ch) && !AliasEngine.ALIAS_NO_SPACE_SCRIPT.test(ch);
        const before = needsEdge(find[0]) ? '(?<![\\p{L}\\p{N}])' : '';
        const after = needsEdge(find[find.length - 1]) ? '(?![\\p{L}\\p{N}])' : '';
        const regex = new RegExp(before + source + after, caseInsensitive ? 'giu' : 'gu');

        const replace = generalize
            ? (...m) => template.replace(/\u0000([A-Z])\u0000/g, (_, c) => m[c.charCodeAt(0) - 64])
            : () => toRead;
        return {regex, replace};
    }

    static ALIAS_NUMBER = /\p{Nd}+(?:[.,'  ]\p{Nd}+)*/gu;
    static ALIAS_NO_SPACE_SCRIPT = /[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Thai}\p{sc=Lao}\p{sc=Khmer}\p{sc=Myanmar}]/u;
}
