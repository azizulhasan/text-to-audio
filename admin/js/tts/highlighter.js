/**
 * TTS-256 — Read-along highlighting for the speechSynthesis players (1 & 2).
 *
 * The base TextToSpeech.speak() fires two wp.hooks actions while the browser
 * speaks:
 *   - `tts_high_light_text`  (sentence, buttonId, splitSentences)  — onstart
 *   - `tts_highlight_word`   ({buttonId, sentence, word, charIndex}) — onboundary
 *   - `tts_highlight_clear`  (buttonId)                             — onend/stop
 *
 * This module paints the currently-spoken WORD inside the post content wrapper
 * (`.tts_content_wrapper_<buttonId>`) using the CSS Custom Highlight API — i.e.
 * a Range registered in `CSS.highlights`, styled via `::highlight(tts-word)`.
 * That paints over the live DOM WITHOUT mutating it, so links / bold / images
 * in the article stay intact (a naive word-span rewrite would flatten them).
 * The rest of the article is dimmed via a class on the wrapper so the active
 * word stands out ("word + dim the rest").
 *
 * Word position is resolved by a forward-search cursor rather than raw
 * charIndex math: speechSynthesis `charIndex` is relative to the current
 * sentence (speak-tts speaks one utterance per sentence), and the extracted
 * spoken text never lines up 1:1 with the rendered HTML's whitespace/markup.
 * Searching forward for each spoken word from a moving cursor is resilient to
 * those differences; each new sentence re-anchors the cursor.
 *
 * Graceful degradation: where the CSS Custom Highlight API is missing (older
 * Safari) or the voice fires no boundary events (most remote/Google voices,
 * Firefox), nothing is painted and playback is unaffected.
 */

const HL_WORD = 'tts-word';
const DIM_CLASS = 'tts-reading-dim';

class WrapperHighlighter {
    constructor(buttonId) {
        this.buttonId = buttonId;
        this.root = document.querySelector('.tts_content_wrapper_' + buttonId);
        this.supported = typeof Highlight !== 'undefined' && window.CSS && CSS.highlights;
        this.nodes = [];
        this.text = '';
        this.lower = '';
        this.cursor = 0;

        if (this.root) {
            this._index();
        }
        if (this.supported) {
            if (!CSS.highlights.has(HL_WORD)) {
                this._hl = new Highlight();
                CSS.highlights.set(HL_WORD, this._hl);
            } else {
                this._hl = CSS.highlights.get(HL_WORD);
            }
        }
    }

    /** Build a flat index of the wrapper's text nodes with cumulative offsets. */
    _index() {
        this.nodes = [];
        let offset = 0;
        const walker = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => {
                // Skip the player button's own label text and any script/style.
                if (n.parentElement && n.parentElement.closest('tts-play-button, .tts__listent_content, script, style')) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (!n.nodeValue) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            },
        });
        let node;
        while ((node = walker.nextNode())) {
            const len = node.nodeValue.length;
            this.nodes.push({ node, start: offset, end: offset + len });
            offset += len;
        }
        this.text = this.nodes.map((n) => n.node.nodeValue).join('');
        this.lower = this.text.toLowerCase();
    }

    /** Map a [start, end) span in the flat text back to a DOM Range. */
    _rangeAt(start, end) {
        const startNode = this.nodes.find((n) => start >= n.start && start < n.end);
        const endNode = this.nodes.find((n) => end > n.start && end <= n.end) || startNode;
        if (!startNode || !endNode) {
            return null;
        }
        const range = document.createRange();
        range.setStart(startNode.node, start - startNode.start);
        range.setEnd(endNode.node, end - endNode.start);
        return range;
    }

    /** Re-anchor the cursor to the located sentence so word search stays in sync. */
    syncSentence(sentence) {
        if (!this.root) {
            return;
        }
        this.root.classList.add(DIM_CLASS);
        const s = (sentence || '').trim();
        if (!s) {
            return;
        }
        const probe = s.slice(0, Math.min(24, s.length)).toLowerCase();
        // Prefer a match ahead of the cursor; fall back to a global search so a
        // fresh playback (cursor left at the end of a previous read) re-anchors.
        let idx = this.lower.indexOf(probe, Math.max(0, this.cursor - 4));
        if (idx === -1) {
            idx = this.lower.indexOf(probe);
        }
        if (idx !== -1) {
            this.cursor = idx;
        }
    }

    highlightWord(word) {
        if (!this.supported || !this.root || !this._hl) {
            return;
        }
        // Trim leading/trailing punctuation; keep letters/numbers (incl. unicode).
        const w = (word || '').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
        if (!w) {
            return;
        }
        const needle = w.toLowerCase();
        let idx = this.lower.indexOf(needle, this.cursor);
        if (idx === -1) {
            // small backward tolerance for drift, then give up silently
            idx = this.lower.indexOf(needle, Math.max(0, this.cursor - 40));
        }
        if (idx === -1) {
            return;
        }
        const range = this._rangeAt(idx, idx + w.length);
        if (!range) {
            return;
        }
        this._hl.clear();
        this._hl.add(range);
        this.cursor = idx + w.length;

        const anchor = range.startContainer.parentElement;
        if (anchor && typeof anchor.scrollIntoView === 'function') {
            anchor.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    clear() {
        if (this.supported && this._hl) {
            this._hl.clear();
        }
    }

    /** Full stop: clear the word highlight, undim, reset the cursor. */
    stop() {
        this.clear();
        if (this.root) {
            this.root.classList.remove(DIM_CLASS);
        }
        this.cursor = 0;
    }
}

const instances = {};
function getHighlighter(buttonId) {
    if (!instances[buttonId]) {
        instances[buttonId] = new WrapperHighlighter(buttonId);
    }
    return instances[buttonId];
}

// Register once even if this module is bundled into more than one entry.
if (window.wp && window.wp.hooks && !window.__ttsHighlighterReady) {
    window.__ttsHighlighterReady = true;

    wp.hooks.addAction('tts_high_light_text', 'tts/highlighter', (sentence, buttonId) => {
        getHighlighter(buttonId).syncSentence(sentence);
    });

    wp.hooks.addAction('tts_highlight_word', 'tts/highlighter', (payload) => {
        if (payload && payload.buttonId != null) {
            getHighlighter(payload.buttonId).highlightWord(payload.word);
        }
    });

    wp.hooks.addAction('tts_highlight_clear', 'tts/highlighter', (buttonId) => {
        getHighlighter(buttonId).stop();
    });
}

export default WrapperHighlighter;
