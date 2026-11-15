/**
 * TTS-347: the device's voice behind a Listen button, when audio cannot be
 * made. Run with: npm test
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import BrowserFallback from '../admin/js/tts/AtlasVoiceBrowserFallback.js';

let started;
class Speaker {
    constructor(buttonId, content, button, TTS) {
        Object.assign(this, { buttonId, content, button, TTS });
    }
    playButtonContent() { return '<span>Listen</span>'; }
    _init(event, clicked) { started.push([this.buttonId, clicked]); }
}
const container = () => ({
    innerHTML: 'old player',
    children: [],
    append(node) { this.children.push(node); },
});

beforeEach(() => {
    started = [];
    globalThis.window = { speechSynthesis: {} };
    globalThis.document = {
        createElement: () => ({ style: {}, listeners: {}, addEventListener(type, run) { this.listeners[type] = run; } }),
    };
});

test('a browser without speech cannot fall back', () => {
    globalThis.window = {};
    assert.equal(BrowserFallback.canSpeak(Speaker), false);
    assert.equal(BrowserFallback.mount(container(), { buttonId: 'a', content: 'Text.', Speaker }), null);
});

test('without the browser-voice class there is nothing to fall back to', () => {
    assert.equal(BrowserFallback.canSpeak(undefined), false);
    assert.equal(BrowserFallback.mount(container(), { buttonId: 'a', content: 'Text.', Speaker: undefined }), null);
});

test('a post with no text gets no button', () => {
    const box = container();
    assert.equal(BrowserFallback.mount(box, { buttonId: 'a', content: '', Speaker }), null);
    assert.equal(box.innerHTML, 'old player', 'The player is left as it was.');
});

test('the button takes the player’s place and reading starts at once', () => {
    const box = container();
    const button = BrowserFallback.mount(box, { buttonId: 'btn-7', content: 'Text to read.', TTS: {}, Speaker });

    assert.equal(box.innerHTML, '');
    assert.deepEqual(box.children, [button]);
    assert.equal(button.id, 'btn-7');
    assert.equal(button.type, 'button');
    assert.match(button.className, /tts__listent_content/);
    assert.equal(button.innerHTML, '<span>Listen</span>');
    assert.deepEqual(started, [['btn-7', true]]);
});

test('a press on the button reads again', () => {
    const button = BrowserFallback.mount(container(), { buttonId: 'b', content: 'Text.', Speaker });
    button.listeners.click();

    assert.equal(started.length, 2);
});

test('it can be put on the page without starting', () => {
    BrowserFallback.mount(container(), { buttonId: 'b', content: 'Text.', Speaker, start: false });

    assert.deepEqual(started, []);
});
