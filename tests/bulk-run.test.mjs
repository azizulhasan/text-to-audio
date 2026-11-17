/**
 * TTS-354: the state of one Bulk MP3 run, for the message on the page
 * (src/dashboard/bulk-mp3-file/bulkRun.js). Run with: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Run from '../src/dashboard/bulk-mp3-file/bulkRun.js';

test('a run that has not started says nothing', () => {
    assert.deepEqual(Run.idleRun(), { status: 'idle', total: 0, made: 0, failed: 0 });
    assert.equal(Run.outcomeOf(Run.idleRun()), '');
});

test('a run counts every post, made or not', () => {
    let run = Run.startRun(3);
    assert.equal(run.status, 'running');
    assert.equal(Run.outcomeOf(run), '', 'Nothing is said about the end while it runs.');

    run = Run.stepRun(run, true);
    run = Run.stepRun(run, false);
    assert.deepEqual(run, { status: 'running', total: 3, made: 1, failed: 1 });

    run = Run.stepRun(run, true);
    assert.deepEqual(run, { status: 'done', total: 3, made: 2, failed: 1 });
});

test('the run ends after the last post even when a post could not be made', () => {
    // Before: the count of made files never reached the number of posts, so no end message came.
    let run = Run.startRun(2);
    run = Run.stepRun(run, true);
    run = Run.stepRun(run, false);

    assert.equal(run.status, 'done');
    assert.equal(Run.outcomeOf(run), 'some');
});

test('how a finished run went: all, some or none', () => {
    const finish = (results) => results.reduce((run, made) => Run.stepRun(run, made), Run.startRun(results.length));

    assert.equal(Run.outcomeOf(finish([true, true])), 'all');
    assert.equal(Run.outcomeOf(finish([true])), 'all');
    assert.equal(Run.outcomeOf(finish([true, false, true])), 'some');
    assert.equal(Run.outcomeOf(finish([false, false])), 'none');
});

test('a step after the end, or before a start, changes nothing', () => {
    const done = Run.stepRun(Run.startRun(1), true);
    assert.equal(Run.stepRun(done, false), done);

    const idle = Run.idleRun();
    assert.equal(Run.stepRun(idle, true), idle);
    assert.equal(Run.stepRun(undefined, true), undefined);
});

test('a step does not change the run it was given', () => {
    const run = Run.startRun(2);
    Run.stepRun(run, true);

    assert.deepEqual(run, { status: 'running', total: 2, made: 0, failed: 0 });
});

test('a run of nothing is over at once and is not called a success', () => {
    for (const total of [0, -3, 'many', undefined]) {
        const run = Run.startRun(total);
        assert.equal(run.status, 'done');
        assert.equal(run.total, 0);
        assert.equal(Run.outcomeOf(run), 'none');
    }
    assert.equal(Run.startRun(2.7).total, 2);
});

test('the screen opens no browser pop-up at the end and has no English left in its code', () => {
    const screen = readFileSync(new URL('../src/dashboard/bulk-mp3-file/generate-bulk-mp3-file.js', import.meta.url), 'utf8');

    assert.equal(/\balert\(/.test(screen), false, 'No alert(): it blocks the page until somebody closes it.');
    assert.equal(screen.includes('All MP3 File Generated'), false);
    assert.equal(screen.includes("' MP3 file generated out of '"), false);
    assert.equal(/>\s*Generate MP3 File\s*</.test(screen), false, 'The button text is translatable.');
    assert.ok(screen.includes('role="status"'), 'The message is read out by screen readers.');
});

test('the text box names the site language Pro gives the page, never "undefined"', () => {
    const screen = readFileSync(new URL('../src/dashboard/bulk-mp3-file/generate-bulk-mp3-file.js', import.meta.url), 'utf8');

    assert.ok(screen.includes('window?.ttsObjPro?.site_locale'), "The site language comes with Pro's data on the page.");
    assert.equal(screen.includes('Site language is ${selectedLang}'), false);
});
