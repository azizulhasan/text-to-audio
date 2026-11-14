/**
 * TTS-369 regression tests. Run with: npm test
 *
 * The player's clock ticking inside the content wrapper must not count as a
 * content change, or the read-along index resets every second and only the
 * first word of each sentence is ever highlighted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNotRead, changesReadText } from '../admin/js/tts/highlight-ignore.js';

/** A fake element whose closest() knows which "areas" it sits in. */
function element(areas = []) {
    return {
        nodeType: 1,
        textContent: 'text',
        closest: (selector) => (areas.some((area) => selector.split(',').map((s) => s.trim()).includes(area)) ? {} : null),
    };
}

/** A fake text node inside the given element. */
function textIn(parent) {
    return { nodeType: 3, nodeValue: 'text', parentElement: parent };
}

const hasText = (n) => (n.nodeType === 3 ? !!n.nodeValue.trim() : !!(n.textContent || '').trim());

const article = element();
const playerClock = element(['.tts__listent_content']);
const styleTag = element(['style']);

test('text in the article is read, the player and <style> are not', () => {
    assert.equal(isNotRead(textIn(article)), false);
    assert.equal(isNotRead(textIn(playerClock)), true);
    assert.equal(isNotRead(textIn(styleTag)), true);
    assert.equal(isNotRead(element(['tts-play-button'])), true);
    assert.equal(isNotRead(null), false);
});

test('the player clock ticking is not a content change', () => {
    const tick = { type: 'characterData', target: textIn(playerClock), addedNodes: [], removedNodes: [] };
    assert.equal(changesReadText([tick], hasText), false);
});

test('the clock text being replaced inside the player is not a content change', () => {
    const replaced = {
        type: 'childList',
        target: playerClock,
        addedNodes: [textIn(playerClock)],
        removedNodes: [textIn(playerClock)],
    };
    assert.equal(changesReadText([replaced], hasText), false);
});

test('a translator rewriting article text is still a content change (TTS-340)', () => {
    const translated = { type: 'characterData', target: textIn(article), addedNodes: [], removedNodes: [] };
    assert.equal(changesReadText([translated], hasText), true);

    const rewritten = { type: 'childList', target: article, addedNodes: [textIn(article)], removedNodes: [] };
    assert.equal(changesReadText([rewritten], hasText), true);
});

test('one real change among many clock ticks still counts', () => {
    const tick = { type: 'characterData', target: textIn(playerClock), addedNodes: [], removedNodes: [] };
    const real = { type: 'characterData', target: textIn(article), addedNodes: [], removedNodes: [] };
    assert.equal(changesReadText([tick, tick, real], hasText), true);
});

test('adding the player or an empty node to the article is not a content change', () => {
    const playerAdded = { type: 'childList', target: article, addedNodes: [playerClock], removedNodes: [] };
    assert.equal(changesReadText([playerAdded], hasText), false);

    const emptyText = { nodeType: 3, nodeValue: '  ', parentElement: article };
    const blank = { type: 'childList', target: article, addedNodes: [emptyText], removedNodes: [] };
    assert.equal(changesReadText([blank], hasText), false);
});
