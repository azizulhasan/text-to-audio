/**
 * TTS-256 — Read-along highlighting for the speechSynthesis players (1 & 2).
 *
 * The base TextToSpeech.speak() fires these wp.hooks actions while the browser
 * speaks:
 *   - `tts_high_light_sentence`  (sentence, buttonId, splitSentences)  — onstart
 *   - `tts_highlight_word`   ({buttonId, sentence, word, charIndex}) — onboundary
 *   - `tts_highlight_clear`  (buttonId)                             — onend/stop
 *
 * This module paints the currently-spoken WORD (and, optionally, the active
 * SENTENCE) inside the post content wrapper (`.tts_content_wrapper_<buttonId>`)
 * using the CSS Custom Highlight API — Ranges registered in `CSS.highlights`,
 * styled via `::highlight(atlasvoice-word)` / `::highlight(atlasvoice-sentence)`. That paints
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

const HL_WORD = 'atlasvoice-word';
const HL_SENTENCE = 'atlasvoice-sentence';
const DIM_CLASS = 'atlasvoice-reading-dim';

const DEFAULTS = {
    enabled: true,
    mode: 'sentence', // sentence | word | word_sentence — sentence works with any voice
    wordBg: '#ffd54f',
    wordColor: '#202124',
    sentenceBg: '#fff3b0',
    dimEnabled: true,
    // a11y (WCAG 1.4.3): the dimmed (non-spoken) body text must stay readable.
    // 0.7 keeps the dimmed grey near the 4.5:1 minimum on a white background;
    // users can dim further (lower value) as an explicit opt-in.
    dimOpacity: 0.7,
    autoscroll: true,
};

/** Respect the user's reduced-motion preference for auto-scroll (WCAG 2.3.3). */
function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/** Scroll behavior: instant under reduced-motion, smooth otherwise. */
function scrollBehavior() {
    return prefersReducedMotion() ? 'auto' : 'smooth';
}

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
    if (document.getElementById('atlasvoice-highlight-styles')) {
        return;
    }
    const dimSel = ['', ' p', ' li', ' span', ' a', ' h1', ' h2', ' h3', ' h4', ' h5', ' h6', ' blockquote', ' td', ' th']
        .map((s) => '.atlasvoice-reading-dim' + s)
        .join(',');
    const css =
        '::highlight(atlasvoice-sentence){background-color:var(--atlasvoice-hl-sentence-bg,#fff3b0);}' +
        '::highlight(atlasvoice-word){background-color:var(--atlasvoice-hl-word-bg,#ffd54f);color:var(--atlasvoice-hl-word-color,#202124);}' +
        dimSel + '{color:var(--atlasvoice-dim-color,rgba(60,64,67,0.7)) !important;transition:color .25s ease;}' +
        // a11y (WCAG 1.4.3, Windows High Contrast): in forced-colors mode use
        // system highlight colors so the highlight stays visible, and stop
        // dimming (let the OS-forced text color through) so content stays legible.
        '@media (forced-colors: active){' +
            '::highlight(atlasvoice-sentence){background-color:Highlight;color:HighlightText;}' +
            '::highlight(atlasvoice-word){background-color:Highlight;color:HighlightText;}' +
            dimSel + '{color:CanvasText !important;}' +
        '}';
    const style = document.createElement('style');
    style.id = 'atlasvoice-highlight-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
}

/** Expose the configured colors as CSS variables the stylesheet consumes. */
function applyCssVars(cfg) {
    const root = document.documentElement;
    if (!root || !root.style) {
        return;
    }
    root.style.setProperty('--atlasvoice-hl-word-bg', cfg.wordBg);
    root.style.setProperty('--atlasvoice-hl-word-color', cfg.wordColor);
    root.style.setProperty('--atlasvoice-hl-sentence-bg', cfg.sentenceBg);
    const dimOpacity = isNaN(cfg.dimOpacity) ? DEFAULTS.dimOpacity : Math.max(0.1, Math.min(0.85, cfg.dimOpacity));
    root.style.setProperty('--atlasvoice-dim-color', 'rgba(60, 64, 67, ' + dimOpacity + ')');
}

/**
 * Lowercase + canonicalize a string for matching. ONLY 1:1 (length-preserving)
 * replacements so character offsets stay valid for Range mapping: unify dash
 * variants (– — ‐ …) to "-", curly quotes to straight, and NBSP to space. This
 * lets the spoken sentence match the rendered text even when the theme uses
 * typographic dashes/quotes.
 */
function canonicalize(str) {
    return (str || '')
        .toLowerCase()
        .replace(/[‐-―]/g, '-')
        .replace(/[‘’‚‛]/g, "'")
        .replace(/[“”„‟]/g, '"')
        .replace(/ /g, ' ');
}

/** Strip a leading player-button label that may be prepended to the content. */
function stripButtonLabel(str) {
    return (str || '').replace(/^(listen|pause|resume|replay)\s+/, '');
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
        // Fallback state: when a word-capable mode fires no boundary events
        // (remote voices / Firefox), degrade to sentence highlighting.
        this.gotWordEvent = false;
        this.fallbackActive = false;
        this.fallbackTimer = null;
        this._lastSentence = null; // {start, end} of the located sentence in flat text
        this._wordCursor = 0;      // forward search position WITHIN the located sentence

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
        // canonicalize() is 1:1 (length-preserving), so offsets into `lower`
        // map directly back to `text` / DOM ranges.
        this.lower = canonicalize(this.text);
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
        // Canonicalize + drop any leading button label ("Listen "/"Pause "…) that
        // may be prepended to the spoken content, so the probe matches the body.
        const normalizedSentence = stripButtonLabel(canonicalize((sentence || '').trim()));
        if (!normalizedSentence) {
            return;
        }
        // Probe on the first chars; strip trailing punctuation so short headings
        // ("Why she did it." spoken vs "Why she did it" rendered) still match.
        const probe = normalizedSentence.slice(0, Math.min(24, normalizedSentence.length)).replace(/[^\p{L}\p{N})\]]+$/u, '');
        if (!probe) {
            return;
        }
        let idx = this.lower.indexOf(probe, Math.max(0, this.cursor - 4));
        if (idx === -1) {
            idx = this.lower.indexOf(probe); // fresh playback: re-anchor from the top
        }
        if (idx === -1) {
            // Sentence not present in the readable area (e.g. the post title,
            // which is spoken but lives OUTSIDE .tts_content_wrapper). Skip it —
            // do NOT let its words match random text elsewhere — and clear the
            // previous highlight so a stale (wrong) sentence isn't left showing.
            this._lastSentence = null;
            this.clear();
            return;
        }
        this.cursor = idx;
        // Exact sentence end — no padding, or the sentence highlight bleeds into
        // the next sentence. Word-search tolerance (below) handles whitespace drift.
        this._lastSentence = { start: idx, end: Math.min(idx + normalizedSentence.length, this.text.length) };
        this._wordCursor = idx;

        // Paint the sentence when the mode asks for it, OR when the no-boundary
        // fallback has kicked in (word events never arrived).
        if (this.cfg.wantSentence || this.fallbackActive) {
            this._paintSentence();
        }

        // Word-capable mode but no boundary events yet → arm a one-shot timer.
        // If still no word event when it fires, the voice doesn't support
        // boundaries (remote voice / Firefox) → fall back to sentence highlight.
        if (this.cfg.wantWord && !this.gotWordEvent && !this.fallbackActive) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = setTimeout(() => {
                if (!this.gotWordEvent) {
                    this.fallbackActive = true;
                    this._paintSentence();
                }
            }, 1200);
        }
    }

    /** Paint the last-located sentence range (used by sentence mode + fallback). */
    _paintSentence() {
        if (!this.supported || !this._sentence || !this._lastSentence) {
            return;
        }
        const range = this._rangeAt(this._lastSentence.start, this._lastSentence.end);
        if (!range) {
            return;
        }
        this._sentence.clear();
        this._sentence.add(range);
        // Keep the sentence in view. In word mode the per-word highlight handles
        // scrolling; in sentence mode (and fallback) scroll here, else the page
        // never follows the read down a long article.
        if (this.cfg.autoscroll && (!this.cfg.wantWord || this.fallbackActive)) {
            const anchor = range.startContainer.parentElement;
            if (anchor && typeof anchor.scrollIntoView === 'function') {
                anchor.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
            }
        }
    }

    highlightWord(word) {
        if (!this.cfg.enabled || !this.cfg.wantWord || !this.supported || !this.root || !this._word) {
            return;
        }
        // A boundary event arrived — boundaries ARE supported, cancel the
        // fallback timer so we keep word-level highlighting.
        this.gotWordEvent = true;
        if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
        }
        const cleanWord = (word || '').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
        if (!cleanWord) {
            return;
        }
        // Only paint words belonging to the currently-located sentence. If the
        // active sentence isn't in the readable area (e.g. the title), skip —
        // never scan the whole body (that made title words like "the"/"City"
        // land on random body text and scrambled the cursor before body reading).
        if (!this._lastSentence) {
            return;
        }
        const needle = canonicalize(cleanWord);
        const start = this._lastSentence.start;
        // Small tolerance for the WORD search only (whitespace drift between the
        // spoken string and rendered text) — the sentence PAINT range stays exact.
        const end = Math.min(this._lastSentence.end + 20, this.text.length);
        let idx = this.lower.indexOf(needle, Math.max(start, this._wordCursor));
        if (idx === -1 || idx >= end) {
            idx = this.lower.indexOf(needle, start); // retry from the sentence start
        }
        if (idx === -1 || idx >= end) {
            return; // word not within this sentence — skip rather than mis-highlight
        }
        const range = this._rangeAt(idx, idx + cleanWord.length);
        if (!range) {
            return;
        }
        this._word.clear();
        this._word.add(range);
        this._wordCursor = idx + cleanWord.length;

        if (this.cfg.autoscroll) {
            const anchor = range.startContainer.parentElement;
            if (anchor && typeof anchor.scrollIntoView === 'function') {
                anchor.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
            }
        }
    }

    clear() {
        if (this.supported) {
            if (this._word) this._word.clear();
            if (this._sentence) this._sentence.clear();
        }
    }

    /** Full stop: clear highlights, undim, reset the cursor + fallback state. */
    stop() {
        this.clear();
        if (this.root) {
            this.root.classList.remove(DIM_CLASS);
        }
        this.cursor = 0;
        this.gotWordEvent = false;
        this.fallbackActive = false;
        if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
        }
        this._lastSentence = null;
        this._wordCursor = 0;
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

    wp.hooks.addAction('tts_high_light_sentence', 'tts/highlighter', (sentence, buttonId) => {
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
