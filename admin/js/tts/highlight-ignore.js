/**
 * TTS-369: parts of the content wrapper the read-along highlighter never reads.
 *
 * The player itself sits inside the wrapper on many sites, and its clock changes
 * every second while audio plays. The word index already skipped it, but the
 * content watcher did not, so each tick looked like a content change, the index
 * was rebuilt and word highlighting stopped after the first word of a sentence.
 * One selector now serves both, so they can't drift apart again.
 */
export const NOT_READ_SELECTOR = 'tts-play-button, .tts__listent_content, script, style';

/**
 * Is this DOM node (text or element) inside a part the highlighter never reads?
 *
 * @param {Node|null} node Any DOM node.
 * @returns {boolean}
 */
export function isNotRead(node) {
    const element = node && (node.nodeType === 1 ? node : node.parentElement);

    return !!(element && typeof element.closest === 'function' && element.closest(NOT_READ_SELECTOR));
}

/**
 * Did these mutations change text the highlighter reads?
 *
 * @param {MutationRecord[]} mutations Records from a MutationObserver.
 * @param {Function} hasText Whether an added or removed node carries text.
 * @returns {boolean}
 */
export function changesReadText(mutations, hasText) {
    return mutations.some((m) => {
        // Text changes inside the player (its clock) or a <style>/<script> never count.
        if (isNotRead(m.target)) {
            return false;
        }

        return m.type === 'characterData'
            || Array.prototype.some.call(m.addedNodes || [], (n) => !isNotRead(n) && hasText(n))
            || Array.prototype.some.call(m.removedNodes || [], (n) => hasText(n));
    });
}
