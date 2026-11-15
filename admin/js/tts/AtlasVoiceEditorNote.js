/**
 * TTS-347: the note under the player that only people who can edit the post
 * see. A visitor never reads why audio could not be made: they get the
 * device voice. The editor of the post reads the reason here.
 *
 * It has no words of its own. The site gives them, translated, with the
 * post's data (`extra.editor`, built by TTA\Player\Editor_Note in PHP), and
 * a visitor's page has no such data at all, so nothing is drawn for them.
 *
 * One module for the free MP3 player and for an extension's player, which
 * reaches it as `TextToSpeech.EditorNote`.
 */

/** Why audio could not be made => which note explains it ('' = no note). */
const KINDS = {
    daily_cap_reached: 'limit',
    quota_exceeded: 'quota',
    audio_off_for_post: 'off',
    // Not a failure: someone else's press is making it, or there is no text.
    locked: '',
    empty: '',
};

/**
 * Which note explains a refusal.
 *
 * @param {string} code What the site answered.
 * @return {string} failed, limit, quota, off or ''.
 */
export function kindOf(code) {
    if (!code) {
        return '';
    }
    return Object.prototype.hasOwnProperty.call(KINDS, code) ? KINDS[code] : 'failed';
}

/**
 * The words of a note.
 *
 * @param {string} kind   failed, limit, quota, off or outdated.
 * @param {Object} editor The post's data for editors (`extra.editor`).
 * @return {{who: string, text: string}|null} Null when there is nothing to say.
 */
export function wordsOf(kind, editor) {
    const words = editor && editor.words;
    if (!kind || !words || typeof words[kind] !== 'string' || !words[kind]) {
        return null;
    }
    // The monthly allowance is the owner's to change, so that note is for admins.
    if (kind === 'quota' && !editor.is_admin) {
        return null;
    }

    return {
        who: kind === 'quota' ? words.admins : words.editors,
        text: words[kind],
    };
}

/**
 * Builds a note.
 *
 * @param {{who: string, text: string}} words The words.
 * @return {HTMLElement} The note, not yet on the page.
 */
export function build(words) {
    const note = document.createElement('div');
    note.className = 'atlasvoice-editor-note';
    note.setAttribute('role', 'note');
    // Its look travels with it: the note is drawn by more than one player,
    // and none of them owns a stylesheet for it.
    note.style.cssText = 'margin:8px 0 0;padding:8px 12px;border-left:4px solid #dba617;background:#fcf9e8;color:#1e1e1e;font:13px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left;';

    const who = document.createElement('b');
    who.textContent = words.who;
    const text = document.createElement('span');
    text.textContent = ' ' + words.text;
    note.append(who, text);

    return note;
}

/**
 * Puts a note after an element, once: a second note of the same kind
 * replaces the first.
 *
 * @param {HTMLElement} after The element the note follows (the player).
 * @param {string}      kind  The kind of note.
 * @param {Object}      editor The post's data for editors.
 * @return {HTMLElement|null} The note, or null when nothing was drawn.
 */
export function show(after, kind, editor) {
    const words = wordsOf(kind, editor);
    if (!after || !after.parentNode || !words) {
        return null;
    }

    const parent = after.parentNode;
    parent.querySelectorAll('.atlasvoice-editor-note[data-kind="' + kind + '"]').forEach((old) => old.remove());

    const note = build(words);
    note.setAttribute('data-kind', kind);
    after.insertAdjacentElement('afterend', note);

    return note;
}

/**
 * The note for a refusal, after the player.
 *
 * @param {HTMLElement} after  The player.
 * @param {string}      code   What the site answered.
 * @param {Object}      editor The post's data for editors.
 * @return {HTMLElement|null} The note.
 */
export function showReason(after, code, editor) {
    return show(after, kindOf(code), editor);
}

/**
 * The note that says visitors hear an older version, with a way to make
 * the audio again.
 *
 * @param {HTMLElement} after  The player.
 * @param {Object}      editor The post's data for editors.
 * @param {Function}    send   Starts the job: (route) => Promise that resolves when it started.
 * @return {HTMLElement|null} The note.
 */
export function showOutdated(after, editor, send) {
    if (!editor || !editor.outdated) {
        return null;
    }
    const note = show(after, 'outdated', editor);
    if (!note) {
        return null;
    }
    const words = editor.words;

    if (editor.can_make && editor.make_route && typeof send === 'function') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'atlasvoice-editor-note__action';
        button.textContent = words.remake;
        button.addEventListener('click', () => {
            button.disabled = true;
            Promise.resolve()
                .then(() => send(editor.make_route))
                .then(() => {
                    button.replaceWith(document.createTextNode(' ' + words.started));
                })
                .catch((error) => {
                    button.disabled = false;
                    const why = document.createElement('span');
                    why.className = 'atlasvoice-editor-note__error';
                    why.textContent = ' ' + ((error && error.message) || words.not_started);
                    note.querySelectorAll('.atlasvoice-editor-note__error').forEach((old) => old.remove());
                    note.append(why);
                });
        });
        note.append(' ', button);
    } else if (editor.edit_url) {
        const link = document.createElement('a');
        link.className = 'atlasvoice-editor-note__action';
        link.href = editor.edit_url;
        link.textContent = words.open_editor;
        note.append(' ', link);
    }

    return note;
}

export default { kindOf, wordsOf, build, show, showReason, showOutdated };
