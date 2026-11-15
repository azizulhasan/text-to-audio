/**
 * TTS-347: the note under the player that only people who can edit the post
 * see. Run with: npm test
 *
 * A very small stand-in for the page is enough: the note only creates
 * elements, sets their text and puts them after the player.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import EditorNote, { kindOf, wordsOf } from '../admin/js/tts/AtlasVoiceEditorNote.js';

class El {
    constructor(tag) {
        this.tagName = tag;
        this.children = [];
        this.attrs = {};
        this.style = {};
        this.listeners = {};
        this.parentNode = null;
        this.textContent = '';
        this.className = '';
        this.disabled = false;
    }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    getAttribute(name) { return this.attrs[name]; }
    append(...nodes) {
        nodes.forEach((node) => {
            const child = typeof node === 'string' ? Object.assign(new El('#text'), { textContent: node }) : node;
            child.parentNode = this;
            this.children.push(child);
        });
    }
    remove() {
        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
        }
    }
    replaceWith(node) {
        const at = this.parentNode.children.indexOf(this);
        node.parentNode = this.parentNode;
        this.parentNode.children[at] = node;
    }
    insertAdjacentElement(where, node) {
        const at = this.parentNode.children.indexOf(this);
        node.parentNode = this.parentNode;
        this.parentNode.children.splice(at + 1, 0, node);
    }
    querySelectorAll(selector) {
        const kind = (selector.match(/data-kind="([^"]+)"/) || [])[1];
        const cls = (selector.match(/^\.([\w-]+)/) || [])[1];
        const found = [];
        const walk = (el) => el.children.forEach((child) => {
            if (child.className && child.className.split(' ').includes(cls) && (!kind || child.attrs['data-kind'] === kind)) {
                found.push(child);
            }
            walk(child);
        });
        walk(this);
        return found;
    }
    addEventListener(type, run) { this.listeners[type] = run; }
    get text() { return this.textContent + this.children.map((child) => child.text).join(''); }
}

const WORDS = {
    editors: 'Editors only.',
    admins: 'Admins only.',
    failed: 'This audio could not be made right now.',
    limit: 'Today’s character limit is reached.',
    quota: 'This month’s characters are used up.',
    off: 'No audio is made for this post.',
    outdated: 'Visitors hear the version from 21 October.',
    remake: 'Make it again',
    started: 'Started.',
    not_started: 'It could not be started.',
    open_editor: 'Open the post editor',
};
const editor = (more = {}) => ({ is_admin: false, outdated: false, can_make: false, make_route: 'tta/v1/post-panel/7/audio', edit_url: 'https://site.test/edit', words: WORDS, ...more });

let page;
let player;
beforeEach(() => {
    globalThis.document = {
        createElement: (tag) => new El(tag),
        createTextNode: (text) => Object.assign(new El('#text'), { textContent: text }),
    };
    page = new El('div');
    player = new El('div');
    page.append(player);
});
const notes = () => page.querySelectorAll('.atlasvoice-editor-note');
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('each refusal has its kind of note', () => {
    assert.equal(kindOf('daily_cap_reached'), 'limit');
    assert.equal(kindOf('quota_exceeded'), 'quota');
    assert.equal(kindOf('audio_off_for_post'), 'off');
    assert.equal(kindOf('service_unreachable'), 'failed');
    assert.equal(kindOf('not_connected'), 'failed');
    assert.equal(kindOf('anything_new'), 'failed');
});

test('waiting for someone else’s press, or a post with no text, is not a failure', () => {
    assert.equal(kindOf('locked'), '');
    assert.equal(kindOf('empty'), '');
    assert.equal(kindOf(''), '');
    assert.equal(kindOf(undefined), '');
});

test('a visitor’s page has no editor data, so there are no words and no note', () => {
    assert.equal(wordsOf('failed', undefined), null);
    assert.equal(wordsOf('failed', null), null);
    assert.equal(EditorNote.showReason(player, 'service_unreachable', undefined), null);
    assert.equal(notes().length, 0);
});

test('an editor reads why the audio could not be made', () => {
    const note = EditorNote.showReason(player, 'service_unreachable', editor());

    assert.equal(notes().length, 1);
    assert.equal(note.text, 'Editors only. This audio could not be made right now.');
    assert.equal(note.attrs.role, 'note');
    assert.equal(page.children[1], note, 'It follows the player.');
});

test('the daily limit and a switched-off post have their own words', () => {
    assert.match(EditorNote.showReason(player, 'daily_cap_reached', editor()).text, /Today’s character limit is reached\./);
    assert.match(EditorNote.showReason(player, 'audio_off_for_post', editor()).text, /No audio is made for this post\./);
});

test('used-up characters are told to an administrator only', () => {
    assert.equal(EditorNote.showReason(player, 'quota_exceeded', editor()), null);
    assert.equal(notes().length, 0);

    const note = EditorNote.showReason(player, 'quota_exceeded', editor({ is_admin: true }));
    assert.equal(note.text, 'Admins only. This month’s characters are used up.');
});

test('the same note is not drawn twice', () => {
    EditorNote.showReason(player, 'service_unreachable', editor());
    EditorNote.showReason(player, 'not_connected', editor());

    assert.equal(notes().length, 1);
});

test('nothing is said about audio that is up to date', () => {
    assert.equal(EditorNote.showOutdated(player, editor(), () => {}), null);
    assert.equal(EditorNote.showOutdated(player, undefined, () => {}), null);
    assert.equal(notes().length, 0);
});

test('outdated audio can be made again from the note', async () => {
    const sent = [];
    const note = EditorNote.showOutdated(player, editor({ outdated: true, can_make: true }), (route) => { sent.push(route); });
    const button = note.children.find((child) => child.tagName === 'button');

    assert.match(note.text, /^Editors only\. Visitors hear the version from 21 October\./);
    assert.equal(button.textContent, 'Make it again');
    assert.deepEqual(sent, [], 'Nothing is started before the press.');

    button.listeners.click();
    await tick();

    assert.deepEqual(sent, ['tta/v1/post-panel/7/audio']);
    assert.match(note.text, /Started\.$/);
    assert.equal(note.children.some((child) => child.tagName === 'button'), false);
});

test('a job that cannot start says why and can be tried again', async () => {
    const note = EditorNote.showOutdated(player, editor({ outdated: true, can_make: true }), () => { throw new Error('The text is too long.'); });
    const button = note.children.find((child) => child.tagName === 'button');

    button.listeners.click();
    await tick();

    assert.match(note.text, /The text is too long\.$/);
    assert.equal(button.disabled, false);
});

test('without jobs the note opens the post editor instead', () => {
    const note = EditorNote.showOutdated(player, editor({ outdated: true, can_make: false }), () => {});
    const link = note.children.find((child) => child.tagName === 'a');

    assert.equal(link.href, 'https://site.test/edit');
    assert.equal(link.textContent, 'Open the post editor');
    assert.equal(note.children.some((child) => child.tagName === 'button'), false);
});
