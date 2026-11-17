/**
 * TTS-378: the natural voice's languages as AtlasVoice Cloud lists them, on
 * the classic Listening screen. Run with: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    NATURAL_ENGINE,
    VOICES_ROUTE,
    codeInList,
    languageMapFromAnswer,
    readServiceLanguages,
    voicesUrl,
} from '../src/dashboard/components/dashboard/listening/serviceLanguages.js';

const ANSWER = {
    source: 'service',
    voices: [
        { id: 'gtts-fr', engine: 'gtts', language: 'fr', name: 'French' },
        { id: 'gtts-en', engine: 'gtts', language: 'en', name: 'English' },
        { id: 'gtts-tlh', engine: 'gtts', language: 'tlh', name: 'Klingon' },
    ],
};

/** A stand-in for fetch that records what was asked. */
function fakeFetch(answer, { ok = true, fail = false } = {}) {
    const calls = [];
    const fn = async (url, options) => {
        calls.push({ url, options });
        if (fail) {
            throw new Error('network');
        }
        return { ok, json: async () => answer };
    };
    return { fn, calls };
}

test('the languages are what the service lists, by name', () => {
    const map = languageMapFromAnswer(ANSWER);

    assert.deepEqual(map, { en: 'English', fr: 'French', tlh: 'Klingon' });
    assert.deepEqual(Object.keys(map), ['en', 'fr', 'tlh']);
});

test('a language is listed once, and a voice without a name is called by its code', () => {
    assert.deepEqual(
        languageMapFromAnswer({
            source: 'service',
            voices: [
                { language: 'en', name: 'English' },
                { language: 'en', name: 'English again' },
                { language: 'de' },
                { language: '', name: 'No language' },
                { name: 'No language either' },
                { language: 7, name: 'A number' },
                null,
                'en',
            ],
        }),
        { de: 'de', en: 'English' }
    );
});

test('without a list from the service the plugin uses its own', () => {
    for (const answer of [
        undefined,
        null,
        {},
        { source: 'none', voices: [], error: 'service_unreachable' },
        { source: 'service', voices: [] },
        { source: 'service', voices: 'many' },
        { source: 'service' },
        { voices: ANSWER.voices },
        { source: 'service', voices: [{ name: 'No language' }] },
    ]) {
        assert.equal(languageMapFromAnswer(answer), null);
    }
});

test('the route is asked for the natural voice only, with or without pretty permalinks', () => {
    assert.equal(NATURAL_ENGINE, 'gtts');
    assert.equal(VOICES_ROUTE, 'tta/v1/cloud/voices');
    assert.equal(voicesUrl('https://site.test/wp-json/'), 'https://site.test/wp-json/tta/v1/cloud/voices?engine=gtts');
    assert.equal(voicesUrl('https://site.test/?rest_route=/'), 'https://site.test/?rest_route=/tta/v1/cloud/voices&engine=gtts');
    assert.equal(voicesUrl(undefined), '/wp-json/tta/v1/cloud/voices?engine=gtts');
});

test('a saved language is found in a list whatever its case', () => {
    const languages = { en: 'English', 'en-uk': 'English (United Kingdom)', 'zh-CN': 'Chinese' };

    assert.equal(codeInList('en', languages), 'en');
    assert.equal(codeInList('EN-UK', languages), 'en-uk');
    assert.equal(codeInList('zh-cn', languages), 'zh-CN');
    assert.equal(codeInList('fr', languages), '');
    assert.equal(codeInList('', languages), '');
    assert.equal(codeInList(undefined, languages), '');
    assert.equal(codeInList('en', null), '');
});

test('the site is asked once, with its nonce, and changes nothing', async () => {
    const { fn, calls } = fakeFetch(ANSWER);

    const map = await readServiceLanguages('https://site.test/wp-json/', 'abc123', fn);

    assert.deepEqual(map, { en: 'English', fr: 'French', tlh: 'Klingon' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://site.test/wp-json/tta/v1/cloud/voices?engine=gtts');
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(calls[0].options.headers['X-WP-Nonce'], 'abc123');
    assert.equal(calls[0].options.credentials, 'same-origin');
    assert.equal(calls[0].options.body, undefined);
});

test('a site that cannot answer gives no list, and never an error', async () => {
    assert.equal(await readServiceLanguages('/wp-json/', 'n', fakeFetch(ANSWER, { ok: false }).fn), null);
    assert.equal(await readServiceLanguages('/wp-json/', 'n', fakeFetch(ANSWER, { fail: true }).fn), null);
    assert.equal(await readServiceLanguages('/wp-json/', 'n', fakeFetch({ source: 'none', voices: [] }).fn), null);
    assert.equal(await readServiceLanguages('/wp-json/', 'n', async () => ({ ok: true, json: async () => { throw new Error('not json'); } })), null);
    assert.equal(await readServiceLanguages('/wp-json/', 'n', async () => null), null);
});
