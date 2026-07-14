/**
 * TTS-252: Shared sentence splitter used by BOTH the highlighter
 * (admin/js/tts/utilities.js) and the audio engine
 * (admin/js/tts/speak-tts/lib/utils.js), so the spoken utterances and the
 * highlighted ranges are always chunked identically.
 *
 * The legacy splitter broke on EVERY "." "?" "!", which shattered:
 *   - abbreviations:  "Dr. Smith"      -> "Dr." | "Smith"
 *   - initialisms:    "U.S.A."         -> "U." | "S." | "A."
 *   - decimals:       "$3.50"          -> "It cost $3." | "50"
 *   - emails/domains: "info@example.com" -> "info@example." | "com"
 *   - versions:       "v1.2.3"         -> "v1." | "2." | "3"
 * into separate utterances (choppy audio + jumpy highlighting).
 *
 * This version only ends a sentence on terminal punctuation that is FOLLOWED BY
 * whitespace and a plausible sentence start, and never inside a known
 * abbreviation, an initialism, or a number. "?" and "!" always terminate.
 *
 * Known, accepted trade-off: an abbreviation that genuinely ends a sentence and
 * is followed by a capitalised word (e.g. "...in the U.S. Today we...") stays
 * merged. We deliberately err toward under-splitting rather than the previous
 * shredding.
 */

// Abbreviations whose trailing "." is NOT a sentence end. Compared lower-cased
// with internal dots removed, so "e.g" matches "e.g.", "U.S" matches "U.S.".
const ABBREVIATIONS = [
    'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'ave', 'rd', 'blvd',
    'inc', 'ltd', 'co', 'corp', 'vs', 'etc', 'no', 'vol', 'fig', 'dept', 'est',
    'approx', 'min', 'max',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
    'eg', 'ie', 'am', 'pm', 'us', 'uk', 'eu', 'ph', 'phd', 'mit', 'usa',
];

const ABBREVIATION_SET = new Set(ABBREVIATIONS);

/**
 * Is the token immediately before a "." an abbreviation or single-letter
 * initialism (so the "." should not end the sentence)?
 * @param {string} token
 * @returns {boolean}
 */
function isAbbreviation(token) {
    if (!token) return false;
    const cleaned = token.toLowerCase().replace(/[^a-z.]/g, '').replace(/\./g, '');
    if (!cleaned) return false;
    // Single letter before the dot => initialism (U.S.A., M.I.T., "J. Smith").
    // But a token carrying digits is a version number like "v1.2.3", not an
    // initialism — it genuinely ends the sentence, so let it split.
    if (/^[a-z]$/.test(cleaned)) return !/[0-9]/.test(token);
    return ABBREVIATION_SET.has(cleaned);
}

/**
 * Split text into sentences for speaking + highlighting.
 * @param {string} text
 * @returns {string[]}
 */
export const splitSentences = function splitSentences(text = '') {
    if (!text || typeof text !== 'string') return [];

    const sentences = [];
    let start = 0;

    // Candidate boundary: terminal punctuation, optional closing quotes/brackets,
    // then whitespace. Requiring trailing whitespace is what protects decimals,
    // emails, domains and versions (their dots have no space after them).
    const boundary = /([.!?]+)(["'”’)\]]*)(\s+)/g;
    let match;

    while ((match = boundary.exec(text)) !== null) {
        const punctuation = match[1];
        const boundaryEnd = boundary.lastIndex;       // just past the whitespace
        const segment = text.slice(start, match.index); // text before the punctuation
        const nextChar = text.charAt(boundaryEnd);      // first char of the next sentence

        // Only a sentence end if what follows looks like a new sentence.
        const startsNewSentence =
            nextChar === '' || /[A-Z0-9"'“‘(\[¿¡]/.test(nextChar);
        if (!startsNewSentence) continue;

        // "." inside an abbreviation/initialism is not a sentence end. "?"/"!" are.
        if (punctuation === '.') {
            const lastToken = (segment.match(/(\S+)$/) || [null, ''])[1];
            if (isAbbreviation(lastToken)) continue;
        }

        const piece = text.slice(start, boundaryEnd).trim();
        if (piece) sentences.push(piece);
        start = boundaryEnd;
    }

    const tail = text.slice(start).trim();
    if (tail) sentences.push(tail);
    // console.log(sentences)
    return sentences;
};

export default splitSentences;
