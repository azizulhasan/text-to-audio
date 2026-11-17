/**
 * TTS-354: the first play of a post without audio, made by an audio job.
 *
 * The player asks the site once to make the post's audio as one job
 * (`tta/v1/audio/first-play`), then asks how far it is, and gets the address
 * of the MP3 when it is there. A second visitor joins the same job. The site
 * says "fallback" whenever a job is not the way (an older or busy service, a
 * page in another language, a very long text): the player then makes the
 * audio batch by batch, exactly as before.
 *
 * One module for the free MP3 player and for an extension's player, which
 * reaches it as `TextToSpeech.AudioJob`. No DOM and no WordPress in here: the
 * player hands in how to send a request and how to wait, so the rules can be
 * tested on their own.
 */

/** The site's route, after "tta/v1/". */
export const ROUTE = 'audio/first-play';

/** How long a player waits between two questions when the site names no time, in milliseconds. */
export const WAIT_MS = 2500;

/** The shortest and the longest wait the site can ask for. */
const MIN_WAIT_MS = 1000;
const MAX_WAIT_MS = 15000;

/** How many questions in a row may go unanswered before the player stops asking. */
export const MAX_MISSES = 3;

/** How long a player follows one job at most: a very long post takes minutes. */
export const MAX_FOLLOW_MS = 15 * 60 * 1000;

/**
 * The share of the audio that is made: the parts before the one being made.
 *
 * @param {number} part  The part being made, from 1.
 * @param {number} parts How many parts there are.
 * @return {number|undefined} 0 to 1, or undefined when there is nothing to count.
 */
export function shareOf(part, parts) {
    if (!Number.isInteger(part) || !Number.isInteger(parts) || parts < 2 || part < 1 || part > parts) {
        return undefined;
    }
    return (part - 1) / parts;
}

/** A wait the site asked for, kept within sensible bounds. */
function waitOf(answer) {
    const asked = Number(answer?.wait_ms);

    return Number.isFinite(asked) && asked > 0 ? Math.min(MAX_WAIT_MS, Math.max(MIN_WAIT_MS, asked)) : WAIT_MS;
}

/** The state of an answer, or '' when it is not one. */
function stateOf(answer) {
    return answer && typeof answer === 'object' && typeof answer.state === 'string' ? answer.state : '';
}

/**
 * Makes a post's audio with a job and follows it to the end.
 *
 * @param {Object}   options
 * @param {number}   options.postId     The post.
 * @param {string}   options.content    The text the player reads.
 * @param {string}   options.fileKey    The key the player stores this page's audio under, or ''.
 * @param {Function} options.send       (method, params) => Promise of the site's answer, or null when the request failed.
 * @param {Function} options.wait       (ms) => Promise that resolves after that long.
 * @param {Function} options.onProgress ({ part, parts, share }) => void, each time the site says how far it is.
 * @param {Function} options.now        () => milliseconds; Date.now by default.
 * @return {Promise<Object>} { url } when the audio is there, { fallback: true, code } when it must be made
 *                           the usual way, or { code } when it cannot be made. Never rejects.
 */
export async function make({ postId, content, fileKey = '', send, wait, onProgress, now = () => Date.now() }) {
    const started = now();
    let answer = null;

    try {
        answer = await send('POST', { post_id: postId, content, file_url_key: fileKey });
    } catch (e) {
        answer = null;
    }

    // The site has no such route (an older version), or could not be asked: the usual way.
    if (!stateOf(answer)) {
        return { fallback: true, code: 'no_answer' };
    }

    let misses = 0;

    for (;;) {
        const state = stateOf(answer);

        if (state === 'ready' && typeof answer.url === 'string' && answer.url) {
            return { url: answer.url };
        }
        if (state === 'fallback') {
            return { fallback: true, code: String(answer.code || 'fallback') };
        }
        if (state === 'failed') {
            return { code: String(answer.code || 'failed') };
        }
        if (state !== 'making') {
            // An answer the player does not know: it cannot follow it.
            return { fallback: true, code: 'unknown_answer' };
        }

        if (typeof onProgress === 'function') {
            const part = Number(answer.part) || 0;
            const parts = Number(answer.parts) || 0;
            onProgress({ part, parts, share: shareOf(part, parts) });
        }

        if (now() - started > MAX_FOLLOW_MS) {
            // The job may still finish; making it a second way would pay for it twice.
            return { code: 'timed_out' };
        }

        await wait(waitOf(answer));

        let next = null;
        try {
            next = await send('GET', { post_id: postId, file_url_key: fileKey });
        } catch (e) {
            next = null;
        }

        if (!stateOf(next)) {
            // One lost question is not the end of a job that is being made.
            if (++misses >= MAX_MISSES) {
                return { code: 'no_answer' };
            }
            continue;
        }

        misses = 0;
        answer = next;
    }
}

export default { ROUTE, WAIT_MS, MAX_MISSES, MAX_FOLLOW_MS, shareOf, make };
