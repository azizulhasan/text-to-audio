/**
 * TTS-367: helpers for reading sentences with the browser speech engine.
 *
 * iPhone and iPad can drop every sentence after the first when all of them are
 * handed to speechSynthesis at once. These helpers keep the queue in our own
 * hands: one sentence is given to the engine at a time, and the next one starts
 * when the current one ends. No DOM access here, so the logic is unit-tested
 * with a fake engine (tests/speech-queue.test.mjs).
 */

// How often the watchdog looks at the engine, and how many silent looks in a
// row mean "this sentence is over, but the engine never told us".
const WATCH_INTERVAL_MS = 500;
const SILENT_CHECKS_BEFORE_SKIP = 3;

/**
 * The sentences still to read, starting at the one being read now.
 *
 * When the current sentence is unknown the whole list is kept. The old code
 * sliced from index -1 in that case, which kept only the LAST sentence, so
 * Resume jumped to the end of the article.
 *
 * @param {string[]} sentences Sentences in reading order.
 * @param {string} current Text of the sentence being read.
 * @returns {string[]}
 */
export function sentencesFrom(sentences, current) {
    if (!Array.isArray(sentences)) {
        return [];
    }
    const index = current ? sentences.indexOf(current) : -1;

    return index > 0 ? sentences.slice(index) : sentences;
}

/**
 * Speak utterances one after another, giving the engine a single one at a time.
 *
 * @param {Object[]} utterances SpeechSynthesisUtterance objects, in order.
 * @param {Object} synth The speech engine (window.speechSynthesis).
 * @param {Object} [options]
 * @param {Function} [options.onDone] Called once, after the last utterance.
 * @param {number} [options.watchInterval] Watchdog interval in milliseconds.
 * @returns {{stop: Function}} stop() ends the sequence; nothing more is spoken.
 */
export function speakInSequence(utterances, synth, options = {}) {
    const onDone = options.onDone;
    const watchInterval = options.watchInterval || WATCH_INTERVAL_MS;
    let index = -1;
    let stopped = false;
    let silentChecks = 0;
    let watchdog = null;

    const stop = () => {
        stopped = true;
        clearInterval(watchdog);
        watchdog = null;
    };

    const next = () => {
        if (stopped) {
            return;
        }
        index++;
        silentChecks = 0;
        if (index >= utterances.length) {
            stop();
            if (onDone) onDone();
            return;
        }

        const position = index;
        const utterance = utterances[position];
        const ownOnEnd = utterance.onend;
        const ownOnError = utterance.onerror;

        utterance.onend = (event) => {
            if (ownOnEnd) ownOnEnd(event);
            // Ignore a late event from a sentence the watchdog already skipped.
            if (position === index) next();
        };
        // An error (cancel() reports one on some engines) ends the sequence.
        utterance.onerror = (event) => {
            stop();
            if (ownOnError) ownOnError(event);
        };

        synth.speak(utterance);
    };

    // Some engines go quiet without firing "end". Move on, so reading never
    // stays stuck on one sentence.
    watchdog = setInterval(() => {
        if (synth.speaking || synth.paused || synth.pending) {
            silentChecks = 0;
            return;
        }
        silentChecks++;
        if (silentChecks >= SILENT_CHECKS_BEFORE_SKIP) {
            next();
        }
    }, watchInterval);

    next();

    return { stop };
}
