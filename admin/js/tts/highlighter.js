/**
 * TTS-256 — Read-along highlighting for the speechSynthesis players (1 & 2).
 *
 * The base TextToSpeech.speak() fires these wp.hooks actions while the browser
 * speaks:
 *   - `tts_high_light_text`  (sentence, buttonId, splitSentences)  — onstart
 *   - `tts_highlight_word`   ({buttonId, sentence, word, charIndex}) — onboundary
 *   - `tts_highlight_clear`  (buttonId)                             — onend/stop
 *
 * This module paints the currently-spoken WORD (and, optionally, the active
 * SENTENCE) inside the post content wrapper (`.tts_content_wrapper_<buttonId>`)
 * using the CSS Custom Highlight API — Ranges registered in `CSS.highlights`,
 * styled via `::highlight(tts-word)` / `::highlight(tts-sentence)`. That paints
 * over the live DOM WITHOUT mutating it, so links / bold / images in the article
 * stay intact (a naive word-span rewrite would flatten them). The rest of the
 * article can be dimmed so the active word stands out.
 *
 * All behaviour is driven by the admin "Highlight" tab, stored in the
 * tta_highlight_settings option and localized to window.ttsObj.settings.highlight.
 *
 * Word position uses a forward-search cursor rather than raw charIndex math:
 * speechSynthesis `charIndex` is relative to the current sentence (speak-tts
 * speaks one utterance per sentence) and the extracted spoken text doesn't align
 * 1:1 with the rendered HTML's whitespace/markup. Searching forward for each
 * spoken word from a moving cursor is resilient to those differences; each new
 * sentence re-anchors the cursor.
 *
 * Degrades silently where the CSS Custom Highlight API is missing (older Safari)
 * or the voice fires no boundary events (remote voices, Firefox) — in the latter
 * case the sentence-level highlight (driven by onstart) still works.
 */

const HL_WORD = 'tts-word';
const HL_SENTENCE = 'tts-sentence';
const DIM_CLASS = 'tts-reading-dim';

const DEFAULTS = {
    enabled: true,
    mode: 'word_sentence', // word_sentence | word | sentence
    wordBg: '#ffd54f',
    wordColor: '#202124',
    sentenceBg: '#fff3b0',
    dimEnabled: true,
    dimOpacity: 0.4,
    autoscroll: true,
};

/** Read the admin Highlight settings off the localized ttsObj, with defaults. */
function readConfig() {
    const s = (window.ttsObj && window.ttsObj.settings && window.ttsObj.settings.highlight) || {};
    const cfg = {
        enabled: s.tta__highlight_enabled !== undefined ? !!s.tta__highlight_enabled : DEFAULTS.enabled,
        mode: s.tta__highlight_mode || DEFAULTS.mode,
        wordBg: s.tta__highlight_word_bg || DEFAULTS.wordBg,
        wordColor: s.tta__highlight_word_color || DEFAULTS.wordColor,
        sentenceBg: s.tta__highlight_sentence_bg || DEFAULTS.sentenceBg,
        dimEnabled: s.tta__highlight_dim_enabled !== undefined ? !!s.tta__highlight_dim_enabled : DEFAULTS.dimEnabled,
        dimOpacity: s.tta__highlight_dim_opacity !== undefined ? parseFloat(s.tta__highlight_dim_opacity) : DEFAULTS.dimOpacity,
        autoscroll: s.tta__highlight_autoscroll !== undefined ? !!s.tta__highlight_autoscroll : DEFAULTS.autoscroll,
    };
    cfg.wantWord = cfg.mode !== 'sentence';
    cfg.wantSentence = cfg.mode !== 'word';
    return cfg;
}

/**
 * Inject the highlight stylesheet once. Done from JS (not a PHP-enqueued .css)
 * because the rules must exist on BOTH player pages, and Free's button CSS is
 * not loaded on Pro player-2 pages. Colors come from the CSS variables set by
 * applyCssVars() so the admin Highlight tab still drives them.
 */
function injectStyles() {
    if (document.getElementById('tts-highlight-styles')) {
        return;
    }
    const dimSel = ['', ' p', ' li', ' span', ' a', ' h1', ' h2', ' h3', ' h4', ' h5', ' h6', ' blockquote', ' td', ' th']
        .map((s) => '.tts-reading-dim' + s)
        .join(',');
    const css =
        '::highlight(tts-sentence){background-color:var(--tts-hl-sentence-bg,#fff3b0);}' +
        '::highlight(tts-word){background-color:var(--tts-hl-word-bg,#ffd54f);color:var(--tts-hl-word-color,#202124);}' +
        dimSel + '{color:var(--tts-dim-color,rgba(60,64,67,0.4)) !important;transition:color .25s ease;}';
    const style = document.createElement('style');
    style.id = 'tts-highlight-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
}

/** Expose the configured colors as CSS variables the stylesheet consumes. */
function applyCssVars(cfg) {
    const root = document.documentElement;
    if (!root || !root.style) {
        return;
    }
    root.style.setProperty('--tts-hl-word-bg', cfg.wordBg);
    root.style.setProperty('--tts-hl-word-color', cfg.wordColor);
    root.style.setProperty('--tts-hl-sentence-bg', cfg.sentenceBg);
    const op = isNaN(cfg.dimOpacity) ? DEFAULTS.dimOpacity : Math.max(0.1, Math.min(0.7, cfg.dimOpacity));
    root.style.setProperty('--tts-dim-color', 'rgba(60, 64, 67, ' + op + ')');
}

class WrapperHighlighter {
    constructor(buttonId) {
        this.buttonId = buttonId;
        this.cfg = readConfig();
        this.root = document.querySelector('.tts_content_wrapper_' + buttonId);
        this.supported = typeof Highlight !== 'undefined' && window.CSS && CSS.highlights;
        this.nodes = [];
        this.text = '';
        this.lower = '';
        this.cursor = 0;

        if (this.cfg.enabled) {
            injectStyles();
            applyCssVars(this.cfg);
        }
        if (this.root) {
            this._index();
        }
        if (this.supported) {
            this._word = CSS.highlights.get(HL_WORD) || new Highlight();
            CSS.highlights.set(HL_WORD, this._word);
            this._sentence = CSS.highlights.get(HL_SENTENCE) || new Highlight();
            CSS.highlights.set(HL_SENTENCE, this._sentence);
        }
    }

    /** Build a flat index of the wrapper's text nodes with cumulative offsets. */
    _index() {
        this.nodes = [];
        let offset = 0;
        const walker = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => {
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
        range.setEnd(endNode.node, Math.min(end - endNode.start, endNode.node.nodeValue.length));
        return range;
    }

    /** Re-anchor the cursor to the located sentence; optionally paint the sentence. */
    syncSentence(sentence) {
        if (!this.cfg.enabled || !this.root) {
            return;
        }
        if (this.cfg.dimEnabled) {
            this.root.classList.add(DIM_CLASS);
        }
        const s = (sentence || '').trim();
        if (!s) {
            return;
        }
        const probe = s.slice(0, Math.min(24, s.length)).toLowerCase();
        let idx = this.lower.indexOf(probe, Math.max(0, this.cursor - 4));
        if (idx === -1) {
            idx = this.lower.indexOf(probe); // fresh playback: re-anchor from the top
        }
        if (idx !== -1) {
            this.cursor = idx;
            if (this.cfg.wantSentence && this.supported && this._sentence) {
                const range = this._rangeAt(idx, Math.min(idx + s.length, this.text.length));
                if (range) {
                    this._sentence.clear();
                    this._sentence.add(range);
                }
            }
        }
    }

    highlightWord(word) {
        if (!this.cfg.enabled || !this.cfg.wantWord || !this.supported || !this.root || !this._word) {
            return;
        }
        const w = (word || '').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
        if (!w) {
            return;
        }
        const needle = w.toLowerCase();
        let idx = this.lower.indexOf(needle, this.cursor);
        if (idx === -1) {
            idx = this.lower.indexOf(needle, Math.max(0, this.cursor - 40));
        }
        if (idx === -1) {
            return;
        }
        const range = this._rangeAt(idx, idx + w.length);
        if (!range) {
            return;
        }
        this._word.clear();
        this._word.add(range);
        this.cursor = idx + w.length;

        if (this.cfg.autoscroll) {
            const anchor = range.startContainer.parentElement;
            if (anchor && typeof anchor.scrollIntoView === 'function') {
                anchor.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }
    }

    clear() {
        if (this.supported) {
            if (this._word) this._word.clear();
            if (this._sentence) this._sentence.clear();
        }
    }

    /** Full stop: clear highlights, undim, reset the cursor. */
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
