/**
 * TTS-354: the first play of a post without audio, made by an audio job
 * (admin/js/tts/AtlasVoiceAudioJob.js). Run with: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import AudioJob from '../admin/js/tts/AtlasVoiceAudioJob.js';

const MAKING = (part, parts, more = {}) => ({ state: 'making', url: '', part, parts, wait_ms: 2500, code: '', ...more });
const READY = { state: 'ready', url: 'https://site.test/uploads/TTA/gtts/jobs/post-7-en-abc.mp3', part: 0, parts: 0, wait_ms: 0, code: '' };

/**
 * A stand-in for the site: gives the queued answers in order and records
 * what was asked and how long the player waited.
 */
function site(answers) {
    const asked = [];
    const waits = [];
    const progress = [];
    let clock = 0;

    return {
        asked,
        waits,
        progress,
        options: {
            postId: 7,
            content: 'The old mill stands by the river.',
            fileKey: 'en',
            send: async (method, params) => {
                asked.push({ method, params });
                const next = answers.shift();
                if (next instanceof Error) {
                    throw next;
                }
                return next === undefined ? null : next;
            },
            wait: async (ms) => {
                waits.push(ms);
                clock += ms;
            },
            onProgress: (step) => progress.push(step),
            now: () => clock,
        },
    };
}

test('the player asks once with its text, then follows the job to the file', async () => {
    const s = site([MAKING(1, 4), MAKING(3, 4), READY]);

    const result = await AudioJob.make(s.options);

    assert.deepEqual(result, { url: READY.url });
    assert.deepEqual(s.asked, [
        { method: 'POST', params: { post_id: 7, content: 'The old mill stands by the river.', file_url_key: 'en' } },
        { method: 'GET', params: { post_id: 7, file_url_key: 'en' } },
        { method: 'GET', params: { post_id: 7, file_url_key: 'en' } },
    ]);
    assert.equal(s.asked.filter((a) => a.params.content !== undefined).length, 1, 'The text is sent once.');
});

test('each answer says which part is being made and how much is done', async () => {
    const s = site([MAKING(1, 4), MAKING(3, 4), READY]);

    await AudioJob.make(s.options);

    assert.deepEqual(s.progress, [
        { part: 1, parts: 4, share: 0 },
        { part: 3, parts: 4, share: 0.5 },
    ]);
});

test('a job that waits for its turn has nothing to count yet', async () => {
    const s = site([MAKING(0, 0), READY]);

    await AudioJob.make(s.options);

    assert.deepEqual(s.progress, [{ part: 0, parts: 0, share: undefined }]);
    assert.equal(AudioJob.shareOf(1, 1), undefined);
    assert.equal(AudioJob.shareOf(5, 4), undefined);
    assert.equal(AudioJob.shareOf('2', 4), undefined);
    assert.equal(AudioJob.shareOf(4, 4), 0.75);
});

test('audio that is already there is played at once, without waiting', async () => {
    const s = site([READY]);

    assert.deepEqual(await AudioJob.make(s.options), { url: READY.url });
    assert.deepEqual(s.waits, []);
    assert.equal(s.asked.length, 1);
});

test('the player waits as long as the site asks, within bounds', async () => {
    const s = site([MAKING(1, 4, { wait_ms: 4000 }), MAKING(2, 4, { wait_ms: 50 }), MAKING(3, 4, { wait_ms: 999999 }), MAKING(3, 4, { wait_ms: 'soon' }), READY]);

    await AudioJob.make(s.options);

    assert.deepEqual(s.waits, [4000, 1000, 15000, AudioJob.WAIT_MS]);
});

test('"fallback" from the site means: make it the usual way', async () => {
    for (const code of ['jobs_unavailable', 'service_unreachable', 'other_language', 'text_too_long', 'no_jobs_for_this_voice']) {
        const s = site([{ state: 'fallback', code }]);

        assert.deepEqual(await AudioJob.make(s.options), { fallback: true, code });
        assert.equal(s.asked.length, 1);
    }
});

test('a job that breaks on its way is also made the usual way', async () => {
    const s = site([MAKING(1, 4), { state: 'fallback', code: 'engine_failed' }]);

    assert.deepEqual(await AudioJob.make(s.options), { fallback: true, code: 'engine_failed' });
});

test('"failed" gives the reason and is not made another way', async () => {
    const s = site([{ state: 'failed', code: 'quota_exceeded' }]);

    assert.deepEqual(await AudioJob.make(s.options), { code: 'quota_exceeded' });

    const later = site([MAKING(1, 4), { state: 'failed', code: 'audio_off_for_post' }]);
    assert.deepEqual(await AudioJob.make(later.options), { code: 'audio_off_for_post' });
});

test('a site that cannot be asked, or has no such route, gets the usual way', async () => {
    for (const first of [null, undefined, new Error('offline'), {}, { code: 'rest_no_route' }, 'not json', { state: 7 }]) {
        const s = site([first]);

        assert.deepEqual(await AudioJob.make(s.options), { fallback: true, code: 'no_answer' });
        assert.deepEqual(s.waits, []);
    }
});

test('an answer the player does not know is made the usual way', async () => {
    const s = site([{ state: 'something-new' }]);

    assert.deepEqual(await AudioJob.make(s.options), { fallback: true, code: 'unknown_answer' });
});

test('"ready" without an address is not played', async () => {
    const s = site([{ state: 'ready', url: '' }]);

    assert.deepEqual(await AudioJob.make(s.options), { fallback: true, code: 'unknown_answer' });
});

test('one lost question does not end a job that is being made', async () => {
    const s = site([MAKING(1, 4), null, new Error('timeout'), MAKING(3, 4), READY]);

    assert.deepEqual(await AudioJob.make(s.options), { url: READY.url });
    assert.equal(s.asked.length, 5);
});

test('after three lost questions in a row the player stops, and does not pay twice', async () => {
    const s = site([MAKING(1, 4), null, null, null, READY]);

    const result = await AudioJob.make(s.options);

    // The job is still being made on the service: the usual way would bill it again.
    assert.deepEqual(result, { code: 'no_answer' });
    assert.equal(result.fallback, undefined);
    assert.equal(s.asked.length, 1 + AudioJob.MAX_MISSES);
});

test('lost questions are counted in a row only', async () => {
    const s = site([MAKING(1, 4), null, null, MAKING(2, 4), null, null, READY]);

    assert.deepEqual(await AudioJob.make(s.options), { url: READY.url });
});

test('a job is followed for fifteen minutes at most, and then not made a second way', async () => {
    const answers = [];
    for (let i = 0; i < 400; i++) {
        answers.push(MAKING(1, 4, { wait_ms: 15000 }));
    }
    const s = site(answers);

    const result = await AudioJob.make(s.options);

    assert.deepEqual(result, { code: 'timed_out' });
    assert.ok(s.waits.length <= AudioJob.MAX_FOLLOW_MS / 15000 + 2);
});

test('the player works without being told how far the job is', async () => {
    const s = site([MAKING(1, 4), READY]);
    delete s.options.onProgress;

    assert.deepEqual(await AudioJob.make(s.options), { url: READY.url });
});

test('a page that names no file key sends an empty one', async () => {
    const s = site([READY]);
    delete s.options.fileKey;

    await AudioJob.make(s.options);

    assert.equal(s.asked[0].params.file_url_key, '');
});
