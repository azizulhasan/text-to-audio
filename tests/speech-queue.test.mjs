/**
 * TTS-367 regression tests. Run with: npm test
 *
 * The fake engines below copy what was reported on iPhone: sentences queued
 * behind the first one are lost, and the "end" event can be missing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sentencesFrom, speakInSequence } from '../admin/js/tts/speech-queue.js';

const SENTENCES = ['Primo paragrafo.', 'Secondo paragrafo.', 'Ultimo paragrafo.'];
const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const utterancesFor = (texts) => texts.map((text) => ({ text }));

/** An engine that speaks each utterance for one tick and then fires "end". */
function workingEngine(spoken) {
    const engine = {
        speaking: false,
        paused: false,
        pending: false,
        speak(utterance) {
            engine.speaking = true;
            spoken.push(utterance.text);
            setTimeout(() => {
                engine.speaking = false;
                if (utterance.onend) utterance.onend({});
            }, 1);
        },
    };

    return engine;
}

/** Like iPhone: an utterance queued while another is being spoken is dropped. */
function engineThatDropsQueuedUtterances(spoken) {
    const engine = workingEngine(spoken);
    const speak = engine.speak;
    engine.speak = (utterance) => {
        if (engine.speaking) return;
        speak(utterance);
    };

    return engine;
}

test('Resume keeps the whole text when the current sentence is unknown', () => {
    assert.deepEqual(sentencesFrom(SENTENCES, ''), SENTENCES);
    assert.deepEqual(sentencesFrom(SENTENCES, undefined), SENTENCES);
    assert.deepEqual(sentencesFrom(SENTENCES, 'Not in the article.'), SENTENCES);
});

test('Resume continues from the sentence being read', () => {
    assert.deepEqual(sentencesFrom(SENTENCES, 'Primo paragrafo.'), SENTENCES);
    assert.deepEqual(sentencesFrom(SENTENCES, 'Secondo paragrafo.'), SENTENCES.slice(1));
    assert.deepEqual(sentencesFrom(SENTENCES, 'Ultimo paragrafo.'), ['Ultimo paragrafo.']);
    assert.deepEqual(sentencesFrom(null, 'x'), []);
});

test('queueing everything at once loses sentences on an iPhone-like engine', () => {
    const spoken = [];
    const engine = engineThatDropsQueuedUtterances(spoken);
    utterancesFor(SENTENCES).forEach((utterance) => engine.speak(utterance));

    assert.deepEqual(spoken, ['Primo paragrafo.']);
});

test('one sentence at a time reads the whole article on an iPhone-like engine', async () => {
    const spoken = [];
    let done = 0;
    speakInSequence(utterancesFor(SENTENCES), engineThatDropsQueuedUtterances(spoken), {
        onDone: () => done++,
    });
    await tick(50);

    assert.deepEqual(spoken, SENTENCES);
    assert.equal(done, 1);
});

test('the listeners of each sentence still fire, in order', async () => {
    const ended = [];
    const utterances = utterancesFor(SENTENCES);
    utterances.forEach((utterance) => {
        utterance.onend = () => ended.push(utterance.text);
    });
    speakInSequence(utterances, workingEngine([]));
    await tick(50);

    assert.deepEqual(ended, SENTENCES);
});

test('stop() ends the sequence, so a pause never starts the next sentence', async () => {
    const spoken = [];
    const utterances = utterancesFor(SENTENCES);
    const engine = {
        speaking: false,
        paused: false,
        pending: false,
        speak(utterance) {
            engine.speaking = true;
            spoken.push(utterance.text);
        },
    };
    const sequence = speakInSequence(utterances, engine, { watchInterval: 5 });

    sequence.stop();
    // cancel() fires "end" for the sentence that was being read.
    engine.speaking = false;
    utterances[0].onend({});
    await tick(40);

    assert.deepEqual(spoken, ['Primo paragrafo.']);
});

test('an error ends the sequence and reaches the listener', async () => {
    const spoken = [];
    const errors = [];
    const utterances = utterancesFor(SENTENCES);
    utterances[0].onerror = (event) => errors.push(event.error);
    const engine = {
        speaking: false,
        paused: false,
        pending: false,
        speak(utterance) {
            spoken.push(utterance.text);
            setTimeout(() => utterance.onerror({ error: 'interrupted' }), 1);
        },
    };
    speakInSequence(utterances, engine, { watchInterval: 5 });
    await tick(40);

    assert.deepEqual(spoken, ['Primo paragrafo.']);
    assert.deepEqual(errors, ['interrupted']);
});

test('the watchdog moves on when the engine never fires "end"', async () => {
    const spoken = [];
    let done = 0;
    const engine = {
        speaking: false,
        paused: false,
        pending: false,
        speak(utterance) {
            spoken.push(utterance.text);
        },
    };
    speakInSequence(utterancesFor(SENTENCES), engine, { watchInterval: 2, onDone: () => done++ });
    // Nine watchdog checks are needed; Windows timers can take ~16 ms each.
    await tick(800);

    assert.deepEqual(spoken, SENTENCES);
    assert.equal(done, 1);
});

test('the watchdog waits while the engine is speaking or paused', async () => {
    const spoken = [];
    const engine = {
        speaking: true,
        paused: false,
        pending: false,
        speak(utterance) {
            spoken.push(utterance.text);
        },
    };
    const sequence = speakInSequence(utterancesFor(SENTENCES), engine, { watchInterval: 2 });
    await tick(40);
    engine.speaking = false;
    engine.paused = true;
    await tick(40);
    sequence.stop();

    assert.deepEqual(spoken, ['Primo paragrafo.']);
});
