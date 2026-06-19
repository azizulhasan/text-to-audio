/* AtlasVoice Step Rail — front-end live DOM picker (TTS-238 v5 rebuilt).
 *
 * Inlined by StepRail::shell_js() via wp_add_inline_script.
 * Framework-free IIFE. Operates directly on the post page DOM — no iframe.
 *
 * Two floating UIs (IDs from StepRail::render_shell):
 *   #av-rail-panel     — left sliding 300 px panel (scope + rule config)
 *   #av-preview-panel  — right draggable overlay (extracted text preview)
 *
 * Picker modes:
 *   'pick'  — mouseover → .av-picker-hover (teal),
 *             click     → toggle .av-picker-selected, sets content selector.
 *   'excl'  — mouseover → .av-picker-exclude-hover (red),
 *             click     → adds CSS-exclude chip (.av-picker-excluded).
 */
(function (w, d) {
    'use strict';

    if (w.AtlasVoiceStepRail) { return; }

    /* ─── state ─────────────────────────────────────────────────── */

    var state = {
        shell:       null,
        postId:      0,
        rest:        '',
        nonce:       '',
        pro:         false,
        // TTS-238 D27.27 — `scopes` field retired with the
        // /step-rail/scopes endpoint. Scope is URL-driven now.
        selection:   makeEmptySelection(),
        pickMode:    null,        // null | 'pick' | 'excl'
        exclKind:    'tta__settings_exclude_content_by_css_selectors',
        userEdited:  false,       // false = show active-system content; true = show live rule preview
        undoStack:   [],
        UNDO_MAX:    20,
        leftOpen:    false,
        rightOpen:   false,
        hoveredEl:   null,
        selectedEl:  null,
        excludedEls: [],
        postType:    '',          // post's actual post type (cached from atlasvoice_resolved_rule on init)
        postLang:    ''           // post's actual language  (cached from atlasvoice_resolved_rule on init)
    };

    var CHIP_KINDS = ['tta__settings_exclude_content_by_css_selectors', 'tta__settings_exclude_texts', 'tta__settings_exclude_tags'];

    // TTS-238 D27.17 — wire ships canonical pipe-strings; split here.
    function splitTags(v) {
        if (Array.isArray(v)) { return v.slice(); }
        return String(v == null ? '' : v).split(/[\s,;|]+/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    function splitTexts(v) {
        // Phrases must preserve internal commas/semicolons. Storage
        // separator is pipe (with newline accepted as a friendly fallback);
        // splitting on commas would corrupt phrases like
        // "Hello, world" into two chunks.
        if (Array.isArray(v)) { return v.slice(); }
        return String(v == null ? '' : v).split(/[|\r\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    function splitLines(v) {
        if (Array.isArray(v)) { return v.slice(); }
        return String(v == null ? '' : v).split(/[\r\n|]+/).map(function (s) { return s.trim(); }).filter(Boolean);
    }

    var CHIP_FEATURE_NAMES = {
        tta__settings_exclude_content_by_css_selectors:   'Skip these areas',
        tta__settings_exclude_texts: 'Skip these phrases',
        tta__settings_exclude_tags:  'Skip these tag types'
    };

    function makeEmptySelection() {
        return {
            scope:                                            'post',
            post_type:                                        '',
            language:                                         '',
            post_id:                                          0,
            tta__settings_css_selectors:                      '',
            tta__settings_exclude_content_by_css_selectors:   [],
            tta__settings_exclude_texts:                      [],
            tta__settings_exclude_tags:                       []
        };
    }

    function cloneSelection(sel) {
        return {
            scope:                                            sel.scope,
            post_type:                                        sel.post_type,
            language:                                         sel.language,
            post_id:                                          sel.post_id,
            tta__settings_css_selectors:                      sel.tta__settings_css_selectors,
            tta__settings_exclude_content_by_css_selectors:   (sel.tta__settings_exclude_content_by_css_selectors || []).slice(),
            tta__settings_exclude_texts:                      (sel.tta__settings_exclude_texts || []).slice(),
            tta__settings_exclude_tags:                       (sel.tta__settings_exclude_tags  || []).slice()
        };
    }

    /* ─── undo ──────────────────────────────────────────────────── */

    function pushUndo(label) {
        state.undoStack.push({ label: label || '', snap: cloneSelection(state.selection) });
        if (state.undoStack.length > state.UNDO_MAX) { state.undoStack.shift(); }
    }

    function popUndo() {
        var entry = state.undoStack.pop();
        if (!entry) { status('Nothing to undo.'); return false; }
        // Remove old selected/excluded highlights before restoring state.
        if (state.selectedEl) { state.selectedEl.classList.remove('av-picker-selected'); state.selectedEl = null; }
        state.excludedEls.forEach(function (el) { el.classList.remove('av-picker-excluded'); });
        state.excludedEls = [];
        state.selection = entry.snap;
        // Re-apply highlights for restored selection.
        if (state.selection.tta__settings_css_selectors) {
            try {
                var el = d.querySelector(state.selection.tta__settings_css_selectors);
                if (el) { state.selectedEl = el; el.classList.add('av-picker-selected'); }
            } catch (e) {}
        }
        renderAllChips();
        syncTagCheckboxes();
        updateSelectorDisplay();
        updateWordCount();
        updatePreview();
        saveBtn().disabled = !state.selection.tta__settings_css_selectors;
        status('Undid: ' + (entry.label || 'last change') + (state.undoStack.length ? ' (' + state.undoStack.length + ' more)' : ''));
        return true;
    }

    /* ─── util ──────────────────────────────────────────────────── */

    function $(sel, root) { return (root || state.shell).querySelector(sel); }

    function status(msg) {
        var el = state.shell && state.shell.querySelector('.av-status');
        if (el) { el.textContent = msg || ''; }
    }

    function saveBtn() { return state.shell && state.shell.querySelector('.av-btn--save'); }

    /* ─── REST ──────────────────────────────────────────────────── */

    function restFetch(path, opts) {
        opts = opts || {};
        var url = (state.rest || '').replace(/\/$/, '') + path;
        var headers = { 'X-WP-Nonce': state.nonce, 'Accept': 'application/json' };
        if (opts.body) { headers['Content-Type'] = 'application/json'; }
        return fetch(url, {
            method:      opts.method || 'GET',
            credentials: 'same-origin',
            headers:     headers,
            body:        opts.body ? JSON.stringify(opts.body) : undefined
        }).then(function (r) {
            if (!r.ok) { return r.text().then(function (t) { throw new Error('HTTP ' + r.status + ': ' + t); }); }
            return r.json();
        });
    }

    /* ─── CSS selector generation ───────────────────────────────── */

    // For EXCLUDE chips: generate a selector that works inside the content
    // clone (which IS the content element, not its parent). Never reference
    // the content container itself as a parent context — that would break
    // clone.querySelectorAll(). Falls back to tag+class or plain tag.
    function generateExcludeSelector(el) {
        if (el.id && !/^\d/.test(el.id) && d.getElementById(el.id) === el) {
            return '#' + el.id;
        }
        var tag = el.tagName.toLowerCase();
        // TTS-238 D27.35 — filter out per-instance hash classes here
        // too. An exclude rule built around `elementor-element-242e3e0d`
        // would only match on the post the admin happened to open the
        // picker on; on every other post the same widget renders with a
        // different hash and the exclusion silently fails.
        var cls = stableClassesOf(el);
        var nth = nthOfType(el);
        var nthSfx = nth > 0 ? ':nth-of-type(' + nth + ')' : '';

        // Try unique stable class inside the selected content container.
        if (state.selectedEl && cls.length) {
            for (var i = 0; i < cls.length; i++) {
                var cand = tag + '.' + cls[i];
                try {
                    if (state.selectedEl.querySelectorAll(cand).length === 1) { return cand; }
                } catch (e) {}
            }
        }

        // Use descendant combinator so the selector works regardless of nesting depth.
        var parent = el.parentElement;
        if (parent) {
            var ptag = parent.tagName.toLowerCase();
            var pcls = stableClassesOf(parent);
            if (parent.id && !/^\d/.test(parent.id)) {
                return '#' + parent.id + ' ' + tag + (cls.length ? '.' + cls[0] : '') + nthSfx;
            }
            return ptag + (pcls.length ? '.' + pcls[0] : '') + ' ' + tag + (cls.length ? '.' + cls[0] : '') + nthSfx;
        }
        return tag + (cls.length ? '.' + cls[0] : '') + nthSfx;
    }

    var PICKER_CLASSES = /\bav-picker-(hover|selected|exclude-hover|excluded|touch-include|touch-exclude)\b/g;

    // Built-in extraction defaults — always stripped before reading the
    // content, even when the admin hasn't added them as chips. Mirrors what
    // wp_strip_all_tags($text, true) and the legacy wrapper-based extractor
    // already remove server-side, so the picker preview stays in sync with
    // what the TTS engine will actually voice.
    //
    //   BUILTIN_EXCL_TAGS — element tag names to remove (with their content).
    //                       script/style cover what wp_strip_all_tags's
    //                       second-arg=true takes out.
    //   BUILTIN_EXCL_CSS  — CSS selectors that target this plugin's own
    //                       player chrome so the listen button + float
    //                       wrapper never end up in the read-aloud text.
    var BUILTIN_EXCL_TAGS = ['script', 'style'];
    var BUILTIN_EXCL_CSS  = [
        '[id^="tts__listent_content_"]',
        '.tts__listent_content',
        '#tts_button_should_float',
        '[class*="tts__custom-position_"]'
    ];

    function cleanClasses(el) {
        // Temporarily strip picker classes so they don't pollute the selector.
        var orig = (typeof el.className === 'string') ? el.className : (el.className.baseVal || '');
        return orig.replace(PICKER_CLASSES, '').trim().replace(/\s{2,}/g, ' ');
    }

    // TTS-238 D27.35 — selector stability layer.
    //
    // Page-builders (Elementor, Gutenberg blocks, scoped CSS-in-JS) emit
    // per-instance hash classes that change every time the post is rebuilt
    // and are unique per element on every page. Picking those gives a
    // selector that won't match anywhere else, which defeats the whole
    // point of a content-region rule.
    //
    // Three pieces:
    //   1. findContentWrapper() — if the picked element sits inside this
    //      plugin's own `tts_content_wrapper_<N>`, return that as the
    //      canonical site-wide selector. Highest stability guarantee
    //      because the wrapper is emitted server-side by Free + Pro.
    //   2. DYNAMIC_CLASS_PATTERNS — block obvious per-instance hash
    //      classes from being chosen for tag.class candidates.
    //   3. STABLE_CLASS_RANK — when a node has multiple non-dynamic
    //      classes, prefer well-known theme content classes over random
    //      ones. (No Elementor widget classes here per project decision.)
    var DYNAMIC_CLASS_PATTERNS = [
        /^elementor-element-[0-9a-f]{6,}$/,    // Elementor per-instance hash
        /^e-con-[0-9a-f]+$/,                   // Elementor v3 container hash
        /^wp-block-[a-z-]+-\d+$/,              // Gutenberg numbered block id
        /^css-[a-z0-9]{6,}$/,                  // emotion / styled-components
        /^id-[a-z0-9]{6,}$/,                   // generic page-builder ids
        /(^|[_-])[a-f0-9]{8,}([_-]|$)/         // any 8+ hex segment delimited by _ or -
    ];

    var STABLE_CLASS_RANK = {
        'entry-content':   10,
        'post-content':    9,
        'article-content': 8,
        'main-content':    7,
        'site-content':    6,
        'content':         5
    };

    function isDynamicClass(cls) {
        if (!cls) { return true; }
        for (var i = 0; i < DYNAMIC_CLASS_PATTERNS.length; i++) {
            if (DYNAMIC_CLASS_PATTERNS[i].test(cls)) { return true; }
        }
        return false;
    }

    // Returns the el's classes minus picker chrome AND minus per-instance
    // hash classes, sorted with well-known theme classes first.
    function stableClassesOf(el) {
        var raw = cleanClasses(el).split(/\s+/).filter(Boolean);
        var stable = raw.filter(function (c) { return !isDynamicClass(c); });
        stable.sort(function (a, b) {
            return (STABLE_CLASS_RANK[b] || 0) - (STABLE_CLASS_RANK[a] || 0);
        });
        return stable;
    }

    // Walk ancestors (and self) looking for the plugin's content wrapper.
    // The wrapper class is `tts_content_wrapper_<N>` where N is a per-PHP-
    // request counter; we pull the exact N from the first matched ancestor
    // and return `div.tts_content_wrapper_<N>` so the saved rule targets
    // exactly the wrapper the admin clicked into. (TTS-238 D27.39 — was
    // previously the substring match `[class*="tts_content_wrapper_"]`,
    // which matched every wrapper on the page — useful for the "read all
    // wrapped regions" case but loses specificity when the admin wants to
    // target one of several.)
    function findContentWrapper(el) {
        var node = el;
        while (node && node.nodeType === 1 && node !== d.body) {
            var className = (typeof node.className === 'string')
                ? node.className
                : (node.className && node.className.baseVal) || '';
            var m = className.match(/\btts_content_wrapper_(\d+)\b/);
            if (m) {
                return 'div.tts_content_wrapper_' + m[1];
            }
            node = node.parentElement;
        }
        return null;
    }

    // Returns 1-based position of el among its parent's children of the SAME tag.
    function nthOfType(el) {
        var tag = el.tagName;
        var n = 0;
        var sib = el.parentElement && el.parentElement.firstElementChild;
        while (sib) {
            if (sib.tagName === tag) { n++; }
            if (sib === el) { return n; }
            sib = sib.nextElementSibling;
        }
        return 0;
    }

    // Returns 1-based position of el among its parent's element children.
    function nthChild(el) {
        var n = 0;
        var sib = el.parentElement && el.parentElement.firstElementChild;
        while (sib) { n++; if (sib === el) { return n; } sib = sib.nextElementSibling; }
        return 0;
    }

    function generateSelector(el) {
        // TTS-238 D27.35 — Pass 0: prefer this plugin's own wrapper if
        // it's an ancestor. `tts_content_wrapper_<N>` is emitted by Free
        // (D26.7) + Pro and is the strongest stability hook — same
        // selector works on every post on the site.
        var wrapperSel = findContentWrapper(el);
        if (wrapperSel) { return wrapperSel; }

        if (el.id && !/^\d/.test(el.id) && d.getElementById(el.id) === el) {
            return '#' + el.id;
        }
        var tag = el.tagName.toLowerCase();
        // Pass 1: drop per-instance hash classes; rank well-known theme
        // content classes ahead of arbitrary ones.
        var cls = stableClassesOf(el);
        var nth = nthOfType(el);
        var nthSfx = nth > 0 ? ':nth-of-type(' + nth + ')' : '';

        // Try each stable class for global uniqueness (no positional suffix needed).
        for (var i = 0; i < cls.length; i++) {
            var cand = tag + '.' + cls[i];
            try { if (d.querySelectorAll(cand).length === 1) { return cand; } } catch (e) {}
        }

        // Use descendant combinator (space) so the selector works regardless of
        // how many elements sit between the parent and the target in the DOM.
        var base = tag + (cls.length ? '.' + cls[0] : '') + nthSfx;
        var parent = el.parentElement;
        if (parent) {
            if (parent.id && !/^\d/.test(parent.id)) {
                return '#' + parent.id + ' ' + base;
            }
            var ptag = parent.tagName.toLowerCase();
            var pcls = stableClassesOf(parent);
            return ptag + (pcls.length ? '.' + pcls[0] : '') + ' ' + base;
        }

        return base;
    }

    /* ─── DOM picker ────────────────────────────────────────────── */

    function isRailElement(el) {
        return !!(el && (el.id === 'av-steprail-root' || (el.closest && el.closest('#av-steprail-root'))));
    }

    function startPickMode(mode, kind) {
        stopPickMode();
        // If select-mode is active, kill it so click-pick and drag-mark
        // don't trample each other's listeners.
        if (state.pickMode === 'select' || state.pickMode === 'select-excl') { stopSelectMode(); }
        state.pickMode = mode;
        state.exclKind = kind || 'tta__settings_exclude_content_by_css_selectors';
        d.addEventListener('mouseover', onPickHover,    true);
        d.addEventListener('mouseout',  onPickHoverOut, true);
        d.addEventListener('click',     onPickClick,    true);
        d.addEventListener('keydown',   onPickEscape);
        // Visual feedback on button.
        if (mode === 'pick') {
            var pb = $('.av-btn--pick');
            if (pb) { pb.setAttribute('data-state', 'picking'); pb.classList.add('is-active'); }
            status('Click any element on the page to select it. Press Esc to cancel.');
        } else {
            var eb = state.shell && state.shell.querySelector('.av-btn--pick-excl[data-kind="' + state.exclKind + '"]');
            if (eb) { eb.classList.add('is-active'); }
            status('Click any element to exclude it. Press Esc to cancel.');
        }
    }

    function stopPickMode() {
        if (!state.pickMode) { return; }
        d.removeEventListener('mouseover', onPickHover,    true);
        d.removeEventListener('mouseout',  onPickHoverOut, true);
        d.removeEventListener('click',     onPickClick,    true);
        d.removeEventListener('keydown',   onPickEscape);
        if (state.hoveredEl) {
            state.hoveredEl.classList.remove('av-picker-hover', 'av-picker-exclude-hover');
            state.hoveredEl = null;
        }
        state.pickMode = null;
        var pb = $('.av-btn--pick');
        if (pb) { pb.setAttribute('data-state', 'idle'); pb.classList.remove('is-active'); }
        var ebs = state.shell && state.shell.querySelectorAll('.av-btn--pick-excl');
        if (ebs) { Array.prototype.forEach.call(ebs, function (b) { b.classList.remove('is-active'); }); }
    }

    function onPickHover(e) {
        if (isRailElement(e.target)) { return; }
        if (state.hoveredEl && state.hoveredEl !== e.target) {
            state.hoveredEl.classList.remove('av-picker-hover', 'av-picker-exclude-hover');
        }
        state.hoveredEl = e.target;
        e.target.classList.add(state.pickMode === 'excl' ? 'av-picker-exclude-hover' : 'av-picker-hover');
    }

    function onPickHoverOut(e) {
        if (state.hoveredEl === e.target) {
            e.target.classList.remove('av-picker-hover', 'av-picker-exclude-hover');
            state.hoveredEl = null;
        }
    }

    function onPickClick(e) {
        if (isRailElement(e.target)) { return; }
        e.preventDefault();
        e.stopPropagation();

        var el = e.target;

        if (state.pickMode === 'pick') {
            if (state.selectedEl === el) {
                // Toggle off — deselect.
                el.classList.remove('av-picker-selected');
                state.selectedEl = null;
                pushUndo('clear selector');
                state.selection.tta__settings_css_selectors = '';
                state.userEdited = true;
                updateSelectorDisplay();
                updateWordCount();
                updatePreview();
                if (saveBtn()) { saveBtn().disabled = true; }
                stopPickMode();
                status('Deselected. Click another element or pick again.');
                return;
            }
            if (state.selectedEl) { state.selectedEl.classList.remove('av-picker-selected'); }
            state.selectedEl = el;
            el.classList.add('av-picker-selected');
            var sel = generateSelector(el);
            pushUndo('set selector "' + sel + '"');
            state.selection.tta__settings_css_selectors = sel;
            state.userEdited = true;
            updateSelectorDisplay();
            updateWordCount();
            updatePreview();
            if (saveBtn()) { saveBtn().disabled = false; }
            stopPickMode();
            status('Selected: ' + sel + ' — review the preview and Save.');

        } else if (state.pickMode === 'excl') {
            if (!state.pro) {
                stopPickMode();
                showProPromo('Exclude areas');
                return;
            }
            var exclSel = generateExcludeSelector(el);
            if (addChip(state.exclKind, exclSel)) {
                el.classList.add('av-picker-excluded');
                state.excludedEls.push(el);
                updatePreview();
                status('Excluded: ' + exclSel + ' (Ctrl+Z to undo)');
            }
            stopPickMode();
        }
    }

    function onPickEscape(e) {
        if (e.key === 'Escape') { stopPickMode(); status('Picker cancelled.'); }
    }

    /* ─── select (drag-to-mark) mode ────────────────────────────── */

    // Block-style elements that look like "regions" to a human reading the
    // page. Used to short-circuit the touched-set when the only difference
    // is an inline ancestor (we'd rather generate a selector for the <p>
    // than the <a> the cursor happened to release on).
    var SELECT_TOUCH_CLASSES = 'av-picker-touch-include av-picker-touch-exclude';

    // Walk every element under `range.commonAncestorContainer` and return
    // those the range actually touches. Using TreeWalker keeps this O(n) on
    // the visible subtree instead of querying the whole document.
    function elementsInRange(range) {
        if (!range || range.collapsed) { return []; }
        var root = range.commonAncestorContainer;
        if (root && root.nodeType === 3 /* TEXT_NODE */) { root = root.parentNode; }
        if (!root || root.nodeType !== 1) { return []; }
        var result = [];
        if (range.intersectsNode(root)) { result.push(root); }
        var walker = d.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
            acceptNode: function (n) {
                try { return range.intersectsNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
                catch (e) { return NodeFilter.FILTER_REJECT; }
            }
        });
        var n;
        while ((n = walker.nextNode())) { result.push(n); }
        return result;
    }

    // Drop rail UI, invisible nodes, and (for excludes) anything outside the
    // active content region. Then drop strict ancestors of both range
    // endpoints — elements that merely *contain* the selection rather than
    // being cut across by it (e.g. the wrapper div the admin happens to be
    // dragging inside). Finally dedupe to topmost so a parent of touched
    // descendants doesn't bloat the comma-list.
    //
    // The "drop endpoint-containing ancestors" step is the difference
    // between "I selected the wrapper" and "I selected the 4 paragraphs
    // I dragged across" — the latter is what an admin actually means.
    function filterTouched(els, opts) {
        opts = opts || {};
        var contained = opts.containedIn || null;
        var startEl   = opts.startEl     || null;
        var endEl     = opts.endEl       || null;
        // Visibility + rail filter.
        var pass = [];
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el || el.nodeType !== 1) { continue; }
            if (isRailElement(el)) { continue; }
            if (contained && !(el === contained || contained.contains(el))) { continue; }
            // Skip elements with no layout box (script, style, hidden).
            if (!el.getClientRects || el.getClientRects().length === 0) { continue; }
            pass.push(el);
        }
        // Drop strict ancestors of BOTH endpoints — they are the "container
        // of the selection", not the selection itself.
        if (startEl && endEl) {
            pass = pass.filter(function (el) {
                if (el === startEl || el === endEl) { return true; }
                return !(el.contains(startEl) && el.contains(endEl));
            });
        }
        // Topmost-only dedupe.
        var set = pass;
        var topmost = pass.filter(function (el) {
            for (var p = el.parentElement; p; p = p.parentElement) {
                if (set.indexOf(p) !== -1) { return false; }
            }
            return true;
        });
        return topmost;
    }

    // Build a CSS selector string covering every element. Single → bare
    // selector. Many → comma-list. Reuses the same per-element builder
    // that click-pick uses so the output is consistent. TTS-238 D27.36 —
    // when the drag is in `select-excl` mode we route through
    // generateExcludeSelector instead, because generateSelector escalates
    // to the plugin's content wrapper if it's an ancestor — which is
    // correct for the include path (broadest stable container) but
    // catastrophic for the exclude path (would delete the entire
    // content region).
    function selectorsFromTouched(els) {
        if (!els.length) { return ''; }
        var build = (state.pickMode === 'select-excl')
            ? generateExcludeSelector
            : generateSelector;
        var parts = els.map(function (el) { return build(el); }).filter(Boolean);
        // De-dupe identical strings (rare, but happens if two siblings
        // share a unique-class shortcut path).
        var seen = {};
        parts = parts.filter(function (s) { if (seen[s]) { return false; } seen[s] = true; return true; });
        return parts.join(', ');
    }

    function startSelectMode(kind) {
        stopPickMode();
        stopSelectMode();
        state.pickMode = (kind === 'select-excl') ? 'select-excl' : 'select';
        state._selectTouched = [];
        d.body.classList.add(state.pickMode === 'select-excl' ? 'av-select-mode-excl' : 'av-select-mode');
        // Live update during drag + commit on mouseup.
        d.addEventListener('selectionchange', onSelectChange);
        d.addEventListener('mouseup',         onSelectMouseUp, true);
        d.addEventListener('keydown',         onSelectEscape);
        // Visual feedback on button.
        var btn = state.shell && state.shell.querySelector(state.pickMode === 'select-excl' ? '.av-btn--select-excl' : '.av-btn--select');
        if (btn) { btn.classList.add('is-active'); }
        if (state.pickMode === 'select-excl') {
            status('Drag across any element(s) to exclude. Press Esc to cancel.');
        } else {
            status('Drag across any element(s) to mark as content. Press Esc to cancel.');
        }
    }

    function stopSelectMode() {
        if (state.pickMode !== 'select' && state.pickMode !== 'select-excl') { return; }
        d.removeEventListener('selectionchange', onSelectChange);
        d.removeEventListener('mouseup',         onSelectMouseUp, true);
        d.removeEventListener('keydown',         onSelectEscape);
        d.body.classList.remove('av-select-mode', 'av-select-mode-excl');
        clearTouchedHighlights();
        state._selectTouched = [];
        state.pickMode = null;
        var btns = state.shell && state.shell.querySelectorAll('.av-btn--select, .av-btn--select-excl');
        if (btns) { Array.prototype.forEach.call(btns, function (b) { b.classList.remove('is-active'); }); }
        // Don't leave a dangling text selection on the page.
        try { var sel = w.getSelection(); if (sel) { sel.removeAllRanges(); } } catch (e) {}
    }

    function clearTouchedHighlights() {
        (state._selectTouched || []).forEach(function (el) {
            el.classList.remove('av-picker-touch-include', 'av-picker-touch-exclude');
        });
        state._selectTouched = [];
    }

    function onSelectEscape(e) {
        if (e.key === 'Escape') { stopSelectMode(); status('Drag cancelled.'); }
    }

    // Resolve the current text-Selection to the touched Element set.
    // Always called against the active mode — exclude mode constrains to
    // the current content region, include mode ranges over <body>.
    function currentTouched() {
        var sel;
        try { sel = w.getSelection(); } catch (e) { return []; }
        if (!sel || sel.rangeCount === 0) { return []; }
        var range = sel.getRangeAt(0);
        if (!range || range.collapsed) { return []; }
        var raw = elementsInRange(range);
        var contained = null;
        if (state.pickMode === 'select-excl' && state.selection.tta__settings_css_selectors) {
            try { contained = d.querySelector(state.selection.tta__settings_css_selectors); } catch (e) {}
        }
        // Endpoint-containing-ancestor drop is exclude-only. In include mode
        // we want the cleaner topmost-rolled-up result (e.g. the wrapper)
        // because that's what the admin almost always means when they drag
        // over a region — and excludes need leaf precision so they don't
        // wipe the whole content area.
        var opts = { containedIn: contained };
        if (state.pickMode === 'select-excl') {
            function elOf(node) { return node && (node.nodeType === 1 ? node : node.parentElement); }
            opts.startEl = elOf(range.startContainer);
            opts.endEl   = elOf(range.endContainer);
        }
        return filterTouched(raw, opts);
    }

    // Live preview while dragging — paint the dashed transient highlight on
    // every currently-touched element, removing it from anything that left
    // the selection. This is what makes the gesture WYSIWYG.
    function onSelectChange() {
        var touched = currentTouched();
        var cls = state.pickMode === 'select-excl' ? 'av-picker-touch-exclude' : 'av-picker-touch-include';
        // Remove from previous set first so leaving an element un-highlights.
        (state._selectTouched || []).forEach(function (el) {
            if (touched.indexOf(el) === -1) {
                el.classList.remove('av-picker-touch-include', 'av-picker-touch-exclude');
            }
        });
        touched.forEach(function (el) { el.classList.add(cls); });
        state._selectTouched = touched;
    }

    // Commit on mouseup. Native text-selection completes here, so this is
    // the last point we know exactly what the admin meant.
    function onSelectMouseUp() {
        // Defer one tick so the final selection is reflected in the
        // Selection API (some browsers fire mouseup before update).
        setTimeout(function () {
            if (state.pickMode !== 'select' && state.pickMode !== 'select-excl') { return; }
            var touched = currentTouched();
            // Strip transient highlight classes BEFORE generateSelector reads
            // each element's className — otherwise av-picker-touch-* leaks
            // into the saved selector string.
            touched.forEach(function (el) {
                el.classList.remove('av-picker-touch-include', 'av-picker-touch-exclude');
            });
            if (!touched.length) {
                clearTouchedHighlights();
                status('Empty selection — drag across at least one element.');
                return;
            }
            var selector = selectorsFromTouched(touched);
            if (!selector) {
                clearTouchedHighlights();
                status('Could not generate a selector for that selection.');
                return;
            }
            var multi = selector.indexOf(',') !== -1;
            var brittleScope = state.selection.scope && state.selection.scope !== 'post' && state.selection.scope !== 'post_type';

            if (state.pickMode === 'select') {
                // Replace any currently-selected element's highlight.
                if (state.selectedEl) {
                    state.selectedEl.classList.remove('av-picker-selected');
                    state.selectedEl = null;
                }
                clearTouchedHighlights();
                pushUndo('select to include "' + selector + '"');
                state.selection.tta__settings_css_selectors = selector;
                state.userEdited = true;
                updateSelectorDisplay();
                reapplySelectedHighlight();
                updateWordCount();
                updatePreview();
                if (saveBtn()) { saveBtn().disabled = !selector; }
                renderBrittleScopeWarning('region', multi && brittleScope);
                status('Content region set: ' + selector + (multi && brittleScope ? ' (scope-brittle, see warning)' : ''));
                stopSelectMode();
            } else if (state.pickMode === 'select-excl') {
                clearTouchedHighlights();
                if (!state.pro) {
                    stopSelectMode();
                    showProPromo('Exclude areas');
                    return;
                }
                // addChip is single-value; for a comma-list we want the
                // whole string saved as one chip (same shape produced by
                // typing it manually). Skip validation reuse and push raw.
                if ((state.selection.tta__settings_exclude_content_by_css_selectors || []).indexOf(selector) !== -1) {
                    status('Already in list: "' + selector + '"');
                    return;
                }
                pushUndo('select to exclude "' + selector + '"');
                state.selection.tta__settings_exclude_content_by_css_selectors = (state.selection.tta__settings_exclude_content_by_css_selectors || []).concat([selector]);
                state.userEdited = true;
                renderChipRow('tta__settings_exclude_content_by_css_selectors');
                reapplyExcludeHighlights();
                updatePreview();
                renderBrittleScopeWarning('tta__settings_exclude_content_by_css_selectors', multi && brittleScope);
                status('Excluded: ' + selector + (multi && brittleScope ? ' (scope-brittle, see warning)' : ''));
                // Auto-exit so the body text-cursor class is cleared and the
                // admin gets default cursor everywhere again. Matches the
                // include-mode behavior — one click, one selection, mode off.
                stopSelectMode();
            }
        }, 0);
    }

    // Inline yellow note shown when a multi-element comma-list is committed
    // under a scope broader than per-post / per-post-type. Re-rendered on
    // each commit; one warning per step.
    function renderBrittleScopeWarning(stepKey, show) {
        if (!state.shell) { return; }
        var step = state.shell.querySelector('.av-step[data-step="' + stepKey + '"]');
        if (!step) { return; }
        var existing = step.querySelector('.av-scope-warn');
        if (!show) { if (existing) { existing.remove(); } return; }
        if (existing) { return; }
        var warn = d.createElement('p');
        warn.className = 'av-scope-warn';
        warn.style.cssText = 'margin:6px 0 0;padding:6px 8px;background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f;line-height:1.4;';
        warn.textContent = 'This selector targets specific positions; it may not match all posts in this scope.';
        var body = step.querySelector('.av-step__body');
        if (body) { body.appendChild(warn); }
    }

    /* ─── selector display ──────────────────────────────────────── */

    function updateSelectorDisplay() {
        var disp = $('.av-selector-display');
        var inp  = $('.av-selector-input');
        if (!disp || !inp) { return; }
        if (state.selection.tta__settings_css_selectors) {
            inp.value = state.selection.tta__settings_css_selectors;
            disp.hidden = false;
        } else {
            inp.value = '';
            disp.hidden = true;
        }
    }

    /* ─── word count ─────────────────────────────────────────────── */

    function updateWordCount() {
        var slot = $('.av-word-count');
        if (!slot) { return; }
        if (!state.selection.tta__settings_css_selectors) { slot.hidden = true; slot.textContent = ''; return; }
        try {
            var el = d.querySelector(state.selection.tta__settings_css_selectors);
            if (!el) { slot.hidden = true; return; }
            var text = (el.innerText || el.textContent || '').trim();
            var words = text ? text.split(/\s+/).filter(Boolean).length : 0;
            slot.textContent = '~' + words + ' words';
            slot.hidden = false;
        } catch (e) { slot.hidden = true; }
    }

    /* ─── content extraction + preview ──────────────────────────── */

    // Walk comment nodes once and collect every atlasvoice:start:N id present
    // on the page. Pages can render multiple Listen buttons, each emitting
    // its own marker pair (atlasvoice:start:1 / :2 / …) and its own wrapper
    // div.tts_content_wrapper_N — so the picker can't assume id=1.
    function findAtlasVoiceMarkerIds() {
        var ids = [];
        if (!d.body) { return ids; }
        var walker = d.createTreeWalker(d.body, NodeFilter.SHOW_COMMENT, null, false);
        var node, m, seen = {};
        while ((node = walker.nextNode())) {
            m = /^\s*atlasvoice:start:(\d+)\s*$/.exec(node.nodeValue || '');
            if (m) {
                var id = parseInt(m[1], 10);
                if (id && !seen[id]) { seen[id] = true; ids.push(id); }
            }
        }
        return ids.sort(function (a, b) { return a - b; });
    }

    // Find every legacy wrapper element on the page (matches any
    // .tts_content_wrapper_N for N=1..). Returns elements in document order.
    function findLegacyWrappers() {
        if (!d.body) { return []; }
        var nodes = d.body.querySelectorAll('[class*="tts_content_wrapper_"]');
        var out = [];
        Array.prototype.forEach.call(nodes, function (n) {
            // Match-then-filter: rule out classes like tts_content_wrapper_inner.
            if (/(?:^|\s)tts_content_wrapper_\d+(?:\s|$)/.test(n.className || '')) {
                out.push(n);
            }
        });
        return out;
    }

    // Mirrors extractor engine tier 1: walk comment nodes for atlasvoice markers.
    // buttonId may be omitted — in that case the FIRST present marker pair
    // (smallest id) is used. Pass an explicit id to extract a specific button.
    function extractFromCommentMarkers(buttonId) {
        if (!d.body) { return null; }
        if (buttonId == null) {
            var ids = findAtlasVoiceMarkerIds();
            if (!ids.length) { return null; }
            buttonId = ids[0];
        }
        var startText = 'atlasvoice:start:' + buttonId;
        var endText   = 'atlasvoice:end:'   + buttonId;
        var walker = d.createTreeWalker(d.body, NodeFilter.SHOW_COMMENT, null, false);
        var startNode = null, endNode = null, node;
        while ((node = walker.nextNode())) {
            var val = (node.nodeValue || '').trim();
            if (!startNode && val === startText)  { startNode = node; }
            else if (startNode && val === endText) { endNode   = node; break; }
        }
        if (!startNode || !endNode) { return null; }
        var frag = d.createDocumentFragment();
        var cursor = startNode.nextSibling;
        while (cursor && cursor !== endNode) {
            frag.appendChild(cursor.cloneNode(true));
            cursor = cursor.nextSibling;
        }
        return frag;
    }

    function nodeToText(node) {
        var div = d.createElement('div');
        div.appendChild(node.cloneNode(true));
        return (div.textContent || '').trim();
    }

    // State A: what the active system (new or legacy) currently reads on this page.
    // Returns { text, source } where source is 'markers' | 'selector' | 'legacy' | ''.
    function extractFromActiveSystem() {
        // Tier 1 — AtlasVoice comment markers. Iterate every marker pair on
        // the page (atlasvoice:start:1, :2, …) and use the first that yields
        // non-empty text. Multi-button posts get handled correctly.
        var ids = findAtlasVoiceMarkerIds();
        for (var i = 0; i < ids.length; i++) {
            var frag = extractFromCommentMarkers(ids[i]);
            if (frag) {
                var t = nodeToText(frag);
                if (t) { return { text: applyContentMeta(t), source: 'AtlasVoice markers' }; }
            }
        }
        // Tier 2 — saved selector with current exclude rules.
        if (state.selection.tta__settings_css_selectors) {
            var t2 = extractWithRules();
            if (t2) { return { text: t2, source: 'Saved selector' }; } // applyContentMeta already called inside
        }
        // Tier 3 — legacy wrapper div. Match any .tts_content_wrapper_N.
        var legacies = findLegacyWrappers();
        for (var j = 0; j < legacies.length; j++) {
            var t3 = (legacies[j].textContent || '').trim();
            if (t3) { return { text: applyContentMeta(t3), source: 'Legacy wrapper' }; }
        }
        // Tier 4 — window.TTS.contents[N]. Server-cooked audio text injected
        // by helpers.php::tta_get_button_content. This is the ground-truth
        // text the player will speak; if every DOM tier above missed (page
        // builder bypassed the_content, theme stripped the wrapper, etc.)
        // the player itself still has content sitting here. Last-resort
        // surfacing so the preview matches what visitors actually hear.
        try {
            var bag = (w.TTS && w.TTS.contents) ? w.TTS.contents : null;
            if (bag) {
                for (var k in bag) {
                    if (!bag.hasOwnProperty(k)) { continue; }
                    var t4 = (bag[k] || '').toString().trim();
                    if (t4) { return { text: t4, source: 'TTS.contents[' + k + '] (player payload)' }; }
                }
            }
        } catch (e) {}
        return { text: '', source: '' };
    }

    // State B: live preview using whatever rules are currently in state.selection.
    function extractWithRules() {
        if (!state.selection.tta__settings_css_selectors) { return ''; }
        var el;
        try { el = d.querySelector(state.selection.tta__settings_css_selectors); } catch (e) { return ''; }
        if (!el) { return ''; }

        // Resolve tta__settings_exclude_content_by_css_selectors selectors against the LIVE DOM before cloning so
        // positional pseudos (:nth-of-type, :nth-child) reflect the actual
        // page structure — not the detached clone's shifted sibling context.
        // Tag each live match with a one-shot data attribute; after cloning
        // we strip the same-attribute nodes out of the clone by reference,
        // guaranteeing preview removal matches the red highlight 1:1.
        var EXCL_MARK = 'data-av-excl-match';
        (state.selection.tta__settings_exclude_content_by_css_selectors || []).forEach(function (sel) {
            if (!sel) { return; }
            try {
                // Match document-wide (same scope as reapplyExcludeHighlights)
                // but only mark nodes that are actually inside the content
                // region, since nothing outside `el` ends up in the clone.
                Array.prototype.forEach.call(d.querySelectorAll(sel), function (n) {
                    if (n === el || el.contains(n)) { n.setAttribute(EXCL_MARK, '1'); }
                });
            } catch (e) {}
        });

        var clone = el.cloneNode(true);

        // Clean up live markers immediately — extract side-effects must not
        // leak into the live DOM beyond the clone step.
        Array.prototype.forEach.call(el.querySelectorAll('[' + EXCL_MARK + ']'), function (n) {
            n.removeAttribute(EXCL_MARK);
        });
        if (el.hasAttribute && el.hasAttribute(EXCL_MARK)) { el.removeAttribute(EXCL_MARK); }

        // Strip picker highlight classes from every element with a class.
        // SVG elements expose .className as an SVGAnimatedString (object),
        // not a string — calling .replace on that throws. Use the raw
        // class attribute for write-back so both HTML and SVG nodes work.
        Array.prototype.forEach.call(clone.querySelectorAll('[class]'), function (n) {
            var raw = (typeof n.className === 'string') ? n.className : (n.getAttribute('class') || '');
            var cleaned = raw.replace(PICKER_CLASSES, '').trim();
            if (cleaned) { n.setAttribute('class', cleaned); }
            else { n.removeAttribute('class'); }
        });

        Array.prototype.forEach.call(clone.querySelectorAll('[' + EXCL_MARK + ']'), function (n) {
            if (n.parentNode) { n.parentNode.removeChild(n); }
        });

        // Built-in tag excludes (script, style). Always applied — the legacy
        // PHP path strips these via wp_strip_all_tags($text, true) and the
        // picker preview must match.
        BUILTIN_EXCL_TAGS.forEach(function (tag) {
            Array.prototype.forEach.call(clone.querySelectorAll(tag), function (n) {
                if (n.parentNode) { n.parentNode.removeChild(n); }
            });
        });

        // Built-in CSS excludes — strip this plugin's own player chrome so it
        // doesn't end up read aloud. Quietly skip selectors the browser
        // rejects so a future addition can't take down the whole extractor.
        BUILTIN_EXCL_CSS.forEach(function (sel) {
            try {
                Array.prototype.forEach.call(clone.querySelectorAll(sel), function (n) {
                    if (n.parentNode) { n.parentNode.removeChild(n); }
                });
            } catch (e) {}
        });

        (state.selection.tta__settings_exclude_tags || []).forEach(function (tag) {
            try {
                Array.prototype.forEach.call(clone.querySelectorAll(tag), function (n) {
                    if (n.parentNode) { n.parentNode.removeChild(n); }
                });
            } catch (e) {}
        });

        var raw  = clone.textContent || '';
        var excl = state.selection.tta__settings_exclude_texts || [];

        // Text-level removal: strip each exact phrase string from the raw text.
        excl.forEach(function (phrase) {
            if (phrase) { raw = raw.split(phrase).join(''); }
        });

        var body = raw.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).join('\n');

        return applyContentMeta(body);
    }

    // Mirrors PHP tta_should_add_delimiter(): appends delimiter only when the
    // text doesn't already end with a recognised punctuation character.
    // Delimiter is language-aware — resolved server-side via tts_sentence_delimiter filter.
    var DELIM_PUNCT = ['.', ',', '?', '!', '|', ';', ':', '\u00bf', '\u00a1', '\u060c', '\u061f'];
    function addDelimiter(text, delimiter) {
        if (!text) { return text; }
        var last = text.charAt(text.length - 1);
        if (DELIM_PUNCT.indexOf(last) !== -1) { return text + ' '; }
        return text + delimiter + ' ';
    }

    // Prepend/append title, excerpt, intro, outro per active settings.
    // Order + delimiter logic mirrors helpers.php assembly exactly:
    //   textBefore → title → excerpt → body → textAfter
    function applyContentMeta(body) {
        var m = state.contentMeta;
        if (!m) { return body; }
        var delim = m.delimiter || '. ';
        var parts = [];
        if (m.textBefore)                  { parts.push(addDelimiter(m.textBefore,  delim)); }
        if (m.addTitle && m.postTitle)      { parts.push(addDelimiter(m.postTitle,   delim)); }
        if (m.addExcerpt && m.postExcerpt) { parts.push(addDelimiter(m.postExcerpt, delim)); }
        if (body)                           { parts.push(body); }
        if (m.textAfter)                   { parts.push(addDelimiter(m.textAfter,   delim)); }
        return parts.join('');
    }

    // Keep extractText as alias used by updateWordCount and other callers.
    function extractText() { return extractWithRules(); }

    function updatePreview() {
        // No state.rightOpen gate — body element exists in the DOM whether
        // the panel is hidden or visible, so writing to it when closed is
        // harmless and means opening the panel just reveals already-prepared
        // content (no race against async rule loading, no stale body).
        var panel = d.getElementById('av-preview-panel');
        var body  = panel && panel.querySelector('.av-preview-panel__body');
        var meta  = panel && panel.querySelector('.av-preview-panel__meta');
        if (!body) { return; }

        var text, source;
        if (state.selection.tta__settings_css_selectors) {
            // Selector known — always apply exclusion rules so the preview
            // reflects what the TTS engine will actually read.
            text   = extractWithRules();
            source = state.userEdited ? 'Rule preview' : 'Active rules';
        } else {
            // No selector yet — show what the active system reads unfiltered.
            var active = extractFromActiveSystem();
            text   = active.text;
            source = active.source;
        }

        // Stale-rule fallback. When a saved selector returns no text AND
        // doesn't match anything in the current DOM (typical after a
        // theme swap — e.g. .entry-content disappears once the site
        // moves to Avada's .post-content), fall through to the active-
        // system tier waterfall so the preview surfaces the marker-
        // bracketed content instead of going blank. Source label is
        // prefixed so the meta line makes the rescue obvious to the
        // admin: their saved rule still needs updating, but the picker
        // shows what's available instead of looking dead.
        if (!text && state.selection.tta__settings_css_selectors) {
            var stillMatches = false;
            try { stillMatches = !!d.querySelector(state.selection.tta__settings_css_selectors); } catch (e) {}
            if (!stillMatches) {
                var fallback = extractFromActiveSystem();
                if (fallback && fallback.text) {
                    text   = fallback.text;
                    source = 'Saved rule misses DOM — fallback: ' + fallback.source;
                }
            }
        }

        if (!text) {
            body.innerHTML = '<p class="av-preview-panel__empty">Pick a content region on the left \u2014 the extracted text will appear here.</p>';
            if (meta) { meta.textContent = source || ''; }
            return;
        }

        var words = text.split(/\s+/).filter(Boolean).length;
        if (meta) { meta.textContent = (source ? source + ' \u00b7 ' : '') + '\u223c' + words + ' words'; }

        body.innerHTML = '';
        text.split('\n').forEach(function (line) {
            line = line.trim();
            if (!line) { return; }
            var p = d.createElement('p');
            p.style.cssText = 'margin:0 0 8px;';
            p.textContent = line;
            body.appendChild(p);
        });
    }

    /* ─── verify across posts (D14) ─────────────────────────────── */

    // Run the current state's selector + exclude rules against N random
    // posts of the same scope, in a hidden-iframe fleet. Each iframe
    // measurement reflects the live rendered DOM exactly the way a
    // visitor sees it, including JS-injected content that a server-side
    // approximation would miss.
    //
    // Returns a Promise resolving with
    //   { ok:true,  posts: [{id,url,title,matched,charCount,error}, ...] }
    // or
    //   { ok:false, error: '...' }
    // Never rejects — per-post errors land in the result row so the UI
    // can render a partial result instead of failing the whole batch.
    function runVerifyAcrossPosts(opts) {
        opts = opts || {};
        var sampleSize = Math.max(1, Math.min(20, parseInt(opts.sampleSize, 10) || 3));
        var perTimeout = parseInt(opts.timeoutMs, 10) || 12000;
        var sel        = (state.selection.tta__settings_css_selectors || '').toString().trim();
        if (!sel) { return Promise.resolve({ ok: false, error: 'No selector set.' }); }

        // Validate orderby against the same allowlist the server enforces.
        var orderby = (opts.orderby || '').toString();
        if (['rand', 'date_desc', 'date_asc'].indexOf(orderby) === -1) {
            orderby = 'rand';
        }

        // Smart post-type fallback: prefer the rule's own post-type scope
        // (so a post-type-scoped rule is tested against its actual audience),
        // fall back to the post the admin is on (so global / language /
        // per-post rules still test against a sensible default), only fall
        // through to "any public type" when both are missing.
        var pt = (state.selection.post_type || state.postType || '').toString();

        var qs = '?sample_size=' + sampleSize +
                 '&exclude_post_id=' + (state.postId || 0) +
                 '&orderby=' + encodeURIComponent(orderby);
        if (pt)                       { qs += '&post_type=' + encodeURIComponent(pt); }
        if (state.selection.language) { qs += '&language='  + encodeURIComponent(state.selection.language); }

        return restFetch('/step-rail/verify-sample' + qs).then(function (resp) {
            var posts = (resp && Array.isArray(resp.posts)) ? resp.posts : [];
            if (!posts.length) {
                return { ok: true, posts: [] };
            }
            return Promise.all(posts.map(function (p) { return verifyOnePost(p, sel, perTimeout); }))
                .then(function (results) { return { ok: true, posts: results }; });
        }).catch(function (e) {
            return { ok: false, error: (e && e.message) || 'Sample fetch failed.' };
        });
    }

    // Load a single post in a hidden iframe and report whether the saved
    // selector matches and how many chars of text would survive the full
    // exclude pass (user tta__settings_exclude_content_by_css_selectors + tta__settings_exclude_tags + BUILTIN_EXCL_*). Iframes
    // are removed after measurement; per-load timeout guards against pages
    // that never fire `load` (CMP popups, infinite redirects).
    function verifyOnePost(post, selector, timeoutMs) {
        return new Promise(function (resolve) {
            var iframe = d.createElement('iframe');
            iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1280px;height:800px;visibility:hidden;border:0;';
            iframe.setAttribute('aria-hidden', 'true');
            iframe.setAttribute('tabindex', '-1');
            iframe.src = post.url;

            var done = false;
            var timer = setTimeout(function () { finish('timeout'); }, timeoutMs);

            function finish(err) {
                if (done) { return; } done = true;
                clearTimeout(timer);
                var m = err ? null : measureInIframe(iframe, selector);
                try { if (iframe.parentNode) { iframe.parentNode.removeChild(iframe); } } catch (e) {}
                resolve({
                    id:        post.id,
                    url:       post.url,
                    title:     post.title,
                    matched:   !!(m && m.matched),
                    charCount: (m && m.charCount) || 0,
                    error:     err || (m && m.error) || null
                });
            }

            iframe.addEventListener('load', function () {
                // Defer one tick so theme JS that mutates content (lazy
                // render, comment-marker emit, CMP popups) has settled
                // before we read the DOM.
                setTimeout(function () { finish(null); }, 80);
            });
            iframe.addEventListener('error', function () { finish('iframe load error'); });

            d.body.appendChild(iframe);
        });
    }

    // Mirrors extractWithRules's exclusion pipeline against an iframe doc:
    // user tta__settings_exclude_content_by_css_selectors (resolved against live iframe DOM, then removed from
    // clone), built-in script/style + player-chrome excludes, user
    // tta__settings_exclude_tags. Returns { matched, charCount, error? }.
    function measureInIframe(iframe, selector) {
        var idoc;
        try { idoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document); }
        catch (e) { return { matched: false, charCount: 0, error: 'cross-origin' }; }
        if (!idoc || !idoc.body) { return { matched: false, charCount: 0, error: 'no document' }; }

        var el;
        try { el = idoc.querySelector(selector); }
        catch (e) { return { matched: false, charCount: 0, error: 'invalid selector' }; }
        if (!el) { return { matched: false, charCount: 0 }; }

        var EXCL_MARK = 'data-av-excl-match';
        (state.selection.tta__settings_exclude_content_by_css_selectors || []).forEach(function (s) {
            if (!s) { return; }
            try {
                Array.prototype.forEach.call(idoc.querySelectorAll(s), function (n) {
                    if (n === el || el.contains(n)) { n.setAttribute(EXCL_MARK, '1'); }
                });
            } catch (e) {}
        });

        var clone = el.cloneNode(true);

        // Clean up live markers — measurement must not mutate the iframe DOM
        // beyond the clone moment, in case the iframe is reused (it isn't,
        // but defensive).
        Array.prototype.forEach.call(el.querySelectorAll('[' + EXCL_MARK + ']'), function (n) {
            n.removeAttribute(EXCL_MARK);
        });

        Array.prototype.forEach.call(clone.querySelectorAll('[' + EXCL_MARK + ']'), function (n) {
            if (n.parentNode) { n.parentNode.removeChild(n); }
        });

        BUILTIN_EXCL_TAGS.forEach(function (tag) {
            Array.prototype.forEach.call(clone.querySelectorAll(tag), function (n) {
                if (n.parentNode) { n.parentNode.removeChild(n); }
            });
        });
        BUILTIN_EXCL_CSS.forEach(function (s) {
            try {
                Array.prototype.forEach.call(clone.querySelectorAll(s), function (n) {
                    if (n.parentNode) { n.parentNode.removeChild(n); }
                });
            } catch (e) {}
        });
        (state.selection.tta__settings_exclude_tags || []).forEach(function (tag) {
            try {
                Array.prototype.forEach.call(clone.querySelectorAll(tag), function (n) {
                    if (n.parentNode) { n.parentNode.removeChild(n); }
                });
            } catch (e) {}
        });

        var raw = (clone.textContent || '').trim();
        return { matched: true, charCount: raw.length };
    }

    // Wire the "Test rule across N posts" button. Click → runs the engine,
    // renders a per-post pass/fail table inside .av-verify-results. Disables
    // itself while the run is in flight; the size <input> is read live so
    // changing it then clicking re-uses the new value without a save step.
    function attachVerifyButton() {
        var btn = state.shell && state.shell.querySelector('.av-btn--verify');
        if (!btn) { return; }
        btn.addEventListener('click', function () {
            if (btn.classList.contains('is-running')) { return; }
            if (!state.selection.tta__settings_css_selectors) {
                renderVerifyResults({ ok: false, error: 'Pick a content region first.' });
                return;
            }
            var sizeInp    = state.shell.querySelector('.av-verify-size');
            var orderbyInp = state.shell.querySelector('.av-verify-orderby');
            var size    = sizeInp ? Math.max(1, Math.min(20, parseInt(sizeInp.value, 10) || 3)) : 3;
            var orderby = orderbyInp ? orderbyInp.value : 'rand';
            btn.classList.add('is-running');
            setVerifyStatus('Loading ' + size + ' post' + (size === 1 ? '' : 's') + '…');
            runVerifyAcrossPosts({ sampleSize: size, orderby: orderby }).then(function (res) {
                renderVerifyResults(res);
            }).catch(function (e) {
                renderVerifyResults({ ok: false, error: (e && e.message) || 'Verify failed.' });
            }).then(function () {
                btn.classList.remove('is-running');
            });
        });
    }

    function setVerifyStatus(msg) {
        var slot = state.shell && state.shell.querySelector('.av-verify-status');
        if (slot) { slot.textContent = msg || ''; }
    }

    // Render the verify result. Pass/fail icon per row, char count, link
    // to open the post in a new tab. A summary line at the bottom totals
    // matches and average char count so brittle rules stand out at a glance.
    function renderVerifyResults(res) {
        var box = state.shell && state.shell.querySelector('.av-verify-results');
        if (!box) { return; }
        box.innerHTML = '';
        if (!res || !res.ok) {
            box.hidden = false;
            var err = d.createElement('p');
            err.className = 'av-verify-row';
            err.style.color = '#b91c1c';
            err.textContent = (res && res.error) || 'Verify failed.';
            box.appendChild(err);
            setVerifyStatus('');
            return;
        }
        var posts = res.posts || [];
        if (!posts.length) {
            box.hidden = false;
            var none = d.createElement('p');
            none.className = 'av-verify-row';
            none.style.color = '#6b7280';
            none.textContent = 'No matching published posts found for this scope.';
            box.appendChild(none);
            setVerifyStatus('');
            return;
        }
        var passed = 0, totalChars = 0;
        posts.forEach(function (p) {
            var row = d.createElement('div');
            row.className = 'av-verify-row';

            var icon = d.createElement('span');
            icon.className = 'av-verify-row__icon ' + (p.matched ? 'is-pass' : 'is-fail');
            icon.textContent = p.matched ? '✓' : '✗';
            row.appendChild(icon);

            var title = d.createElement('span');
            title.className = 'av-verify-row__title';
            var a = d.createElement('a');
            a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
            a.textContent = p.title || ('Post #' + p.id);
            a.title = p.error ? ('Error: ' + p.error) : (p.url || '');
            title.appendChild(a);
            row.appendChild(title);

            var count = d.createElement('span');
            count.className = 'av-verify-row__count';
            count.textContent = p.error ? p.error : (p.charCount + ' chars');
            row.appendChild(count);

            box.appendChild(row);
            if (p.matched) { passed++; totalChars += (p.charCount || 0); }
        });
        var summary = d.createElement('div');
        summary.className = 'av-verify-summary';
        var matchedCount = d.createElement('span');
        matchedCount.textContent = passed + ' / ' + posts.length + ' matched';
        var avg = passed > 0 ? Math.round(totalChars / passed) : 0;
        var avgEl = d.createElement('span');
        avgEl.textContent = passed > 0 ? ('avg ' + avg + ' chars') : 'no matches';
        summary.appendChild(matchedCount);
        summary.appendChild(avgEl);
        box.appendChild(summary);

        box.hidden = false;
        setVerifyStatus(passed === posts.length ? 'All ' + posts.length + ' matched.' : (passed + ' of ' + posts.length + ' matched.'));
    }

    /* ─── Pro upgrade prompt ────────────────────────────────────── */

    function showProPromo(featureName) {
        var existing = d.getElementById('av-pro-promo-modal');
        if (existing) { existing.remove(); }

        var upgradeUrl = (typeof ttsObj !== 'undefined' && ttsObj.upgrade_url) ? ttsObj.upgrade_url : 'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/';

        var overlay = d.createElement('div');
        overlay.id = 'av-pro-promo-modal';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2147483647;display:flex;align-items:center;justify-content:center;';

        var box = d.createElement('div');
        box.style.cssText = 'background:#fff;border-radius:12px;padding:28px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25);font-family:inherit;';
        box.innerHTML =
            '<div style="font-size:36px;margin-bottom:10px;">&#9889;</div>' +
            '<h3 style="margin:0 0 8px;font-size:17px;color:#111;font-weight:700;">' + featureName + ' requires Pro</h3>' +
            '<p style="margin:0 0 20px;font-size:13px;color:#6b7280;line-height:1.5;">Upgrade to AtlasVoice Pro to unlock per-scope content extraction rules and advanced targeting.</p>' +
            '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' +
                '<button id="av-promo-close" style="padding:8px 18px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:13px;">Maybe later</button>' +
                '<a href="' + upgradeUrl + '" target="_blank" rel="noopener" style="padding:8px 18px;background:#7c3aed;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;text-decoration:none;display:inline-block;">Upgrade to Pro &#8594;</a>' +
            '</div>';

        overlay.appendChild(box);
        d.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) { if (e.target === overlay) { overlay.remove(); } });
        d.getElementById('av-promo-close').addEventListener('click', function () { overlay.remove(); });
    }


    /* \u2500\u2500\u2500 D26.1 \u2014 scope from URL + read-only readout \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

    // Parse the scope context the rail was launched in, from a URL
    // query parameter. The dashboard (Pick visually button) builds these:
    //
    //   ?scope=global              edit the legacy global keys
    //   ?scope=post_type:<slug>    edit per-post-type override (Pro)
    //   ?scope=post:<post_id>      edit per-post override (Pro)
    //
    // Default when the parameter is missing or unrecognised: 'global' on
    // Free, 'post:<currentPostId>' on Pro (matches the v5 default).
    function parseScopeFromUrl() {
        var raw = '';
        try {
            var qs = w.location && w.location.search ? w.location.search.substring(1) : '';
            qs.split('&').forEach(function (pair) {
                var p = pair.split('=');
                if (decodeURIComponent(p[0] || '') === 'scope') {
                    raw = decodeURIComponent(p[1] || '');
                }
            });
        } catch (e) {}
        if (!raw) { return null; }
        if (raw === 'global') { return { kind: 'global' }; }
        var m;
        if ((m = /^post_type:([a-z0-9_\-]+)$/i.exec(raw))) { return { kind: 'post_type', post_type: m[1] }; }
        if ((m = /^post:(\d+)$/.exec(raw)))                 { return { kind: 'post', post_id: parseInt(m[1], 10) }; }
        return null;
    }

    function describeScope(scope) {
        if (!scope) { return ''; }
        if (scope.kind === 'global')    { return 'Editing rule for: Global'; }
        if (scope.kind === 'post_type') { return 'Editing rule for: Post type "' + scope.post_type + '"'; }
        if (scope.kind === 'post')      { return 'Editing rule for: This post (#' + scope.post_id + ')'; }
        return '';
    }

    // Scope chooser. Was a read-only readout; now an interactive pill group
    // so the admin can target the content rule at this post, this post type,
    // or the whole site without relaunching the picker. The selected pill
    // mirrors state.scope — which init() sets from the launch URL
    // (?scope=post:N | post_type:slug | global) or the resolved-rule default
    // — so the dashboard / edit-page launch URLs pre-select correctly and a
    // bare ?atlasvoice_picker=1 keeps its existing default. Free shows only
    // the global pill (per-post / per-type are Pro).
    function scopePillLabel(kind) {
        if (kind === 'post')      { return 'Only this post'; }
        if (kind === 'post_type') { return 'This post type'; }
        return 'Everywhere';
    }

    function scopeHint(kind) {
        if (kind === 'post') {
            return { text: 'Saves to this post only. It overrides the post-type and global rules on this page.', warn: false };
        }
        if (kind === 'post_type') {
            var pt = state.postType ? ('“' + state.postType + '”') : 'this post type';
            return { text: 'Saves one rule for all ' + pt + ' posts. To use the global rule for this post type instead: open the AtlasVoice Settings page, clear this post type’s content selector there, and save — it then falls back to the global default.', warn: false };
        }
        return { text: 'Saves the site-wide default. A post or post-type rule will still override it wherever one exists.', warn: true };
    }

    function renderScopeReadout() {
        var slot = $('.av-scope-readout');
        if (!slot) { return; }
        slot.innerHTML = '';

        var current = (state.scope && state.scope.kind) || 'post';
        if (!state.pro) { current = 'global'; }
        var kinds = state.pro ? ['post', 'post_type', 'global'] : ['global'];

        var group = d.createElement('div');
        group.className = 'av-scope-group';
        kinds.forEach(function (kind) {
            var btn = d.createElement('button');
            btn.type = 'button';
            btn.className = 'av-scope-pill' + (kind === current ? ' is-checked' : '');
            btn.setAttribute('data-scope-kind', kind);
            btn.textContent = scopePillLabel(kind);
            if (state.pro) {
                btn.addEventListener('click', function () { switchScope(kind); });
            }
            group.appendChild(btn);
        });
        slot.appendChild(group);

        var h = state.pro
            ? scopeHint(current)
            : { text: 'Free uses one content rule for your whole site.', warn: false };
        var hint = d.createElement('p');
        hint.className = 'av-scope-hint' + (h.warn ? ' av-scope-hint--warn' : '');
        hint.textContent = h.text;
        slot.appendChild(hint);
    }

    // Switch the active scope from a pill click. Mirrors the retired scope
    // radiogroup: update state.scope + the legacy selection.scope string,
    // re-render the pills, then reload whatever rule is saved at the new
    // scope (loadRulesForScope reads selection.scope and hits
    // /step-rail/scope-rule). No-op on Free for non-global scopes.
    function switchScope(kind) {
        if (!state.pro && kind !== 'global') { return; }
        if (state.scope && state.scope.kind === kind) { return; }
        if (kind === 'post') {
            state.scope = { kind: 'post', post_id: state.postId };
            state.selection.scope = 'post';
        } else if (kind === 'post_type') {
            var pt = state.postType || (state.scope && state.scope.post_type) || '';
            state.scope = { kind: 'post_type', post_type: pt };
            state.selection.scope = 'post_type';
            state.selection.post_type = pt;
        } else {
            state.scope = { kind: 'global' };
            state.selection.scope = 'global';
        }
        renderScopeReadout();
        loadRulesForScope();
    }

    /* ─── load rules for a selected scope ──────────────────────── */

    function loadRulesForScope() {
        var scope  = state.selection.scope;
        var params = '?post_id=' + state.postId + '&scope=' + encodeURIComponent(scope);
        if (state.selection.post_type) { params += '&post_type=' + encodeURIComponent(state.selection.post_type); }
        if (state.selection.language)  { params += '&language='  + encodeURIComponent(state.selection.language);  }
        status('Loading\u2026');
        restFetch('/step-rail/scope-rule' + params).then(function (resp) {
            if (state.selectedEl) { state.selectedEl.classList.remove('av-picker-selected'); state.selectedEl = null; }
            state.selection.tta__settings_css_selectors = resp.tta__settings_css_selectors || '';
            state.userEdited = false;
            if (resp.excl_set) {
                state.selection.tta__settings_exclude_content_by_css_selectors = splitLines(resp.tta__settings_exclude_content_by_css_selectors);
                state.selection.tta__settings_exclude_texts                    = splitTexts(resp.tta__settings_exclude_texts);
                state.selection.tta__settings_exclude_tags                     = splitTags(resp.tta__settings_exclude_tags);
            } else {
                state.selection.tta__settings_exclude_content_by_css_selectors   = [];
                state.selection.tta__settings_exclude_texts = [];
                state.selection.tta__settings_exclude_tags  = [];
                if (state.shell) {
                    Array.prototype.forEach.call(
                        state.shell.querySelectorAll('.av-tag-check input[type=checkbox]'),
                        function (cb) {
                            if (cb.defaultChecked && (state.selection.tta__settings_exclude_tags || []).indexOf(cb.value) === -1) {
                                state.selection.tta__settings_exclude_tags.push(cb.value);
                            }
                        }
                    );
                }
            }
            updateSelectorDisplay();
            updateWordCount();
            renderAllChips();
            syncTagCheckboxes();
            if (state.selection.tta__settings_css_selectors) {
                try {
                    var el = d.querySelector(state.selection.tta__settings_css_selectors);
                    if (el) { state.selectedEl = el; el.classList.add('av-picker-selected'); }
                } catch (e) {}
            }
            var sb = saveBtn();
            if (sb) { sb.disabled = !state.selection.tta__settings_css_selectors; }
            status(resp.tta__settings_css_selectors ? 'Rule loaded for scope: ' + scope + '.' : 'No saved rule for scope: ' + scope + '.');
            updatePreview();
        }).catch(function () {
            status('Could not load rule for scope: ' + scope + '.');
        });
    }

    /* ─── chips ─────────────────────────────────────────────────── */

    // Re-apply red .av-picker-excluded highlight to every element matching a
    // saved tta__settings_exclude_content_by_css_selectors selector. Called after loadExistingRules so reloads keep
    // the visual state, and after any chip mutation so live edits track the DOM.
    function reapplyExcludeHighlights() {
        state.excludedEls.forEach(function (el) { el.classList.remove('av-picker-excluded'); });
        state.excludedEls = [];
        (state.selection.tta__settings_exclude_content_by_css_selectors || []).forEach(function (exclSel) {
            if (!exclSel) { return; }
            try {
                Array.prototype.forEach.call(d.querySelectorAll(exclSel), function (el) {
                    if (isRailElement(el)) { return; }
                    el.classList.add('av-picker-excluded');
                    state.excludedEls.push(el);
                });
            } catch (e) {}
        });
    }

    // Refresh the .av-picker-selected highlight after the Content region
    // selector changes (typing in the input or programmatic update).
    function reapplySelectedHighlight() {
        if (state.selectedEl) {
            state.selectedEl.classList.remove('av-picker-selected');
            state.selectedEl = null;
        }
        if (!state.selection.tta__settings_css_selectors) { return; }
        try {
            var el = d.querySelector(state.selection.tta__settings_css_selectors);
            if (el && !isRailElement(el)) {
                state.selectedEl = el;
                el.classList.add('av-picker-selected');
            }
        } catch (e) {}
    }

    function validateChipValue(kind, val) {
        val = (val || '').toString().trim();
        if (!val) { return ''; }
        if (kind === 'tta__settings_exclude_tags') {
            val = val.replace(/^<+|>+$/g, '').toLowerCase();
            if (!/^[a-z][a-z0-9]*$/.test(val)) { return ''; }
        }
        if (val.length > 512) { val = val.slice(0, 512); }
        return val;
    }

    function renderChipRow(kind) {
        var step = state.shell && state.shell.querySelector('.av-step[data-chip-kind="' + kind + '"]');
        if (!step) { return; }
        var wrap = step.querySelector('.av-chips');
        if (!wrap) { return; }
        wrap.innerHTML = '';
        var items = state.selection[kind] || [];
        if (!items.length) {
            var empty = d.createElement('span');
            empty.style.cssText = 'color:#9ca3af;font-size:12px;font-style:italic;';
            empty.textContent = 'None added yet.';
            wrap.appendChild(empty);
            return;
        }
        items.forEach(function (val, idx) {
            var chip = d.createElement('span');
            chip.className = 'av-chip';
            chip.setAttribute('role', 'listitem');

            var text = d.createElement('span');
            text.className = 'av-chip__text';
            text.textContent = val;
            text.title = 'Click to edit';
            text.style.cssText = 'cursor:text;';
            text.addEventListener('click', function (e) {
                e.stopPropagation();
                beginChipEdit(kind, idx, chip, text);
            });
            chip.appendChild(text);

            var x = d.createElement('button');
            x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + val); x.textContent = '\u00D7';
            x.addEventListener('click', function () {
                pushUndo('remove ' + kind + ' "' + val + '"');
                state.selection[kind].splice(idx, 1);
                state.userEdited = true;
                renderChipRow(kind);
                syncTagCheckboxes();
                if (kind === 'tta__settings_exclude_content_by_css_selectors') { reapplyExcludeHighlights(); }
                updatePreview();
                status('Removed ' + val + '.');
            });
            chip.appendChild(x);
            wrap.appendChild(chip);
        });
    }

    // Swap a chip's text span for an <input> so the value can be edited in
    // place. Every keystroke writes the provisional value into the selection
    // and refreshes highlights + preview — the page reacts live as the admin
    // types. Enter / blur finalize (push undo, re-render the chip row);
    // Escape reverts to the original value. Invalid / duplicate values are
    // skipped on the live update (kept as-is) so malformed strings never
    // clobber the DOM state mid-edit.
    function beginChipEdit(kind, idx, chip, textEl) {
        if (!state.pro) { showProPromo(CHIP_FEATURE_NAMES[kind] || kind); return; }
        var original = state.selection[kind][idx];
        var input = d.createElement('input');
        input.type = 'text';
        input.value = original;
        input.className = 'av-chip__edit';
        input.style.cssText = 'font:inherit;padding:0 2px;border:1px solid #93c5fd;border-radius:3px;min-width:120px;';
        chip.replaceChild(input, textEl);
        input.focus();
        input.select();

        // Live-apply each keystroke: validate, dedupe, update state in place,
        // then refresh highlights + preview. We intentionally do NOT call
        // renderChipRow here — that would rip the input out of the DOM.
        function liveApply() {
            var next = validateChipValue(kind, input.value);
            if (!next) { return; }
            var list = state.selection[kind] || [];
            var dupIdx = list.indexOf(next);
            if (dupIdx !== -1 && dupIdx !== idx) { return; }
            if (state.selection[kind][idx] === next) { return; }
            state.selection[kind][idx] = next;
            state.userEdited = true;
            if (kind === 'tta__settings_exclude_content_by_css_selectors') { reapplyExcludeHighlights(); }
            updatePreview();
        }

        var done = false;
        function commit() {
            if (done) { return; } done = true;
            var finalVal = validateChipValue(kind, input.value);
            if (!finalVal) {
                // Invalid — revert to original.
                state.selection[kind][idx] = original;
                if (kind === 'tta__settings_exclude_content_by_css_selectors') { reapplyExcludeHighlights(); }
                updatePreview();
                renderChipRow(kind);
                status('Invalid value — reverted.');
                return;
            }
            var list = state.selection[kind] || [];
            var dupIdx = list.indexOf(finalVal);
            if (dupIdx !== -1 && dupIdx !== idx) {
                state.selection[kind][idx] = original;
                if (kind === 'tta__settings_exclude_content_by_css_selectors') { reapplyExcludeHighlights(); }
                updatePreview();
                renderChipRow(kind);
                status('Already in list: "' + finalVal + '" — reverted.');
                return;
            }
            if (finalVal !== original) {
                pushUndo('edit ' + kind + ' "' + original + '" → "' + finalVal + '"');
                state.selection[kind][idx] = finalVal;
                state.userEdited = true;
                syncTagCheckboxes();
                if (kind === 'tta__settings_exclude_content_by_css_selectors') { reapplyExcludeHighlights(); }
                updatePreview();
                status('Updated: ' + finalVal);
            }
            renderChipRow(kind);
        }
        function cancel() {
            if (done) { return; } done = true;
            // Restore original value + visuals.
            state.selection[kind][idx] = original;
            if (kind === 'tta__settings_exclude_content_by_css_selectors') { reapplyExcludeHighlights(); }
            updatePreview();
            renderChipRow(kind);
        }

        input.addEventListener('input', liveApply);
        input.addEventListener('keydown', function (e) {
            e.stopPropagation();
            if (e.key === 'Enter')  { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        });
        input.addEventListener('blur', commit);
        input.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    function renderAllChips() {
        CHIP_KINDS.forEach(renderChipRow);
        CHIP_KINDS.forEach(function (kind) {
            var step = state.shell && state.shell.querySelector('.av-step[data-chip-kind="' + kind + '"]');
            if (!step) { return; }
            var locked = !state.pro;
            step.classList.toggle('is-locked', locked);
            var pill = step.querySelector('.av-pro-pill');
            if (pill) { pill.hidden = !locked; }
            // Transparent overlay catches all clicks on locked steps and shows
            // the promo modal. Created once; removed if Pro activates later.
            if (locked && !step._promoOverlay) {
                step.style.position = 'relative';
                var overlay = d.createElement('div');
                overlay.style.cssText = 'position:absolute;inset:0;z-index:10;cursor:not-allowed;';
                overlay.addEventListener('click', function (e) {
                    e.preventDefault();
                    showProPromo(CHIP_FEATURE_NAMES[kind] || kind);
                });
                step._promoOverlay = overlay;
                step.appendChild(overlay);
            } else if (!locked && step._promoOverlay) {
                step._promoOverlay.remove();
                step._promoOverlay = null;
            }
        });
    }

    // Temporarily splice `rawVal` into the chip list so the page highlights and
    // right-panel preview show what adding this chip WOULD do — but without
    // persisting. Paired with clearChipAddPreview(); nothing is committed until
    // the admin clicks Add.
    function previewChipAdd(kind, rawVal) {
        clearChipAddPreview(kind);
        var val = validateChipValue(kind, rawVal);
        if (!val) { return; }
        if ((state.selection[kind] || []).indexOf(val) !== -1) { return; }
        state._addPreview = { kind: kind, val: val };
        state.selection[kind] = (state.selection[kind] || []).concat([val]);
        if (kind === 'tta__settings_exclude_content_by_css_selectors') { reapplyExcludeHighlights(); }
        updatePreview();
    }

    function clearChipAddPreview(kind) {
        if (!state._addPreview) { return; }
        var k = state._addPreview.kind;
        var v = state._addPreview.val;
        state._addPreview = null;
        var list = state.selection[k] || [];
        var idx  = list.lastIndexOf(v);
        if (idx !== -1) { list.splice(idx, 1); }
        if (k === 'tta__settings_exclude_content_by_css_selectors') { reapplyExcludeHighlights(); }
        updatePreview();
    }

    function addChip(kind, rawVal, opts) {
        opts = opts || {};
        var val = validateChipValue(kind, rawVal);
        if (!val) {
            status('Invalid ' + kind.replace('excl_', '') + ' value: "' + rawVal + '"');
            return false;
        }
        if ((state.selection[kind] || []).indexOf(val) !== -1) {
            status('Already in list: "' + val + '"');
            return false;
        }
        if (!opts.skipUndo) { pushUndo('add ' + kind + ' "' + val + '"'); }
        state.selection[kind] = (state.selection[kind] || []).concat([val]);
        state.userEdited = true;
        renderChipRow(kind);
        var sb = saveBtn();
        if (sb) { sb.disabled = !state.selection.tta__settings_css_selectors; }
        return true;
    }

    /* ─── tag checkboxes ────────────────────────────────────────── */

    function attachTagCheckboxes() {
        if (!state.shell) { return; }
        Array.prototype.forEach.call(state.shell.querySelectorAll('.av-tag-check input[type=checkbox]'), function (cb) {
            cb.addEventListener('change', function () {
                var tag = cb.value;
                if (cb.checked) {
                    if (addChip('tta__settings_exclude_tags', tag)) { updatePreview(); }
                } else {
                    var idx = (state.selection.tta__settings_exclude_tags || []).indexOf(tag);
                    if (idx !== -1) {
                        pushUndo('remove tta__settings_exclude_tags "' + tag + '"');
                        state.selection.tta__settings_exclude_tags.splice(idx, 1);
                        renderChipRow('tta__settings_exclude_tags');
                        updatePreview();
                    }
                }
            });
        });
    }

    function syncTagCheckboxes() {
        if (!state.shell) { return; }
        Array.prototype.forEach.call(state.shell.querySelectorAll('.av-tag-check input[type=checkbox]'), function (cb) {
            cb.checked = (state.selection.tta__settings_exclude_tags || []).indexOf(cb.value) !== -1;
        });
    }

    /* ─── chip add buttons ──────────────────────────────────────── */

    function attachChipAddButtons() {
        CHIP_KINDS.forEach(function (kind) {
            var step = state.shell && state.shell.querySelector('.av-step[data-chip-kind="' + kind + '"]');
            if (!step) { return; }

            // Pick-to-exclude button (only on tta__settings_exclude_content_by_css_selectors step).
            var pickExcl = step.querySelector('.av-btn--pick-excl');
            if (pickExcl) {
                pickExcl.addEventListener('click', function () {
                    if (!state.pro) { showProPromo('Exclude areas'); return; }
                    if (state.pickMode === 'excl' && state.exclKind === kind) {
                        stopPickMode(); status('Exclude picker stopped.');
                    } else {
                        startPickMode('excl', kind);
                    }
                });
            }

            // Drag-to-exclude button (loose-snap selection → tta__settings_exclude_content_by_css_selectors chip).
            var selectExcl = step.querySelector('.av-btn--select-excl');
            if (selectExcl && kind === 'tta__settings_exclude_content_by_css_selectors') {
                selectExcl.addEventListener('click', function () {
                    if (!state.pro) { showProPromo('Exclude areas'); return; }
                    if (state.pickMode === 'select-excl') {
                        stopSelectMode(); status('Drag exclude stopped.');
                    } else {
                        startSelectMode('select-excl');
                    }
                });
            }

            var inp    = step.querySelector('.av-chip-input');
            var addBtn = step.querySelector('.av-btn--add-chip');
            if (inp && addBtn) {
                addBtn.addEventListener('click', function () {
                    if (!state.pro) { showProPromo('Exclude chips'); return; }
                    clearChipAddPreview(kind);
                    if (addChip(kind, inp.value)) { inp.value = ''; inp.focus(); reapplyExcludeHighlights(); updatePreview(); }
                });
                inp.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); }
                });
                // Live-preview a candidate selector as the user types: temporarily
                // inject the value into state.selection[kind] so highlights +
                // preview reflect what Add would do, then revert so nothing is
                // saved until the button is clicked.
                inp.addEventListener('input', function () {
                    if (!state.pro) { return; }
                    previewChipAdd(kind, inp.value);
                });
                inp.addEventListener('blur', function () {
                    clearChipAddPreview(kind);
                });
            }
        });
    }

    /* ─── pick button (content region) ──────────────────────────── */

    function attachPickButton() {
        var btn = $('.av-btn--pick');
        if (!btn) { return; }
        btn.addEventListener('click', function () {
            if (state.pickMode === 'pick') {
                stopPickMode(); status('Picker cancelled.');
            } else {
                startPickMode('pick');
            }
        });

        // Drag-to-include — loose-snap selection becomes the content region.
        var selBtn = $('.av-btn--select');
        if (selBtn) {
            selBtn.addEventListener('click', function () {
                if (state.pickMode === 'select') {
                    stopSelectMode(); status('Drag include stopped.');
                } else {
                    startSelectMode('select');
                }
            });
        }

        var clearBtn = $('.av-btn--clear-selector');
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                if (state.selectedEl) { state.selectedEl.classList.remove('av-picker-selected'); state.selectedEl = null; }
                pushUndo('clear selector');
                state.selection.tta__settings_css_selectors = '';
                state.userEdited = true;
                updateSelectorDisplay();
                updateWordCount();
                updatePreview();
                var sb = saveBtn();
                if (sb) { sb.disabled = true; }
                status('Selector cleared.');
            });
        }

        // Allow manual editing of the picked selector string.
        var selectorInput = $('.av-selector-input');
        if (selectorInput) {
            selectorInput.addEventListener('input', function () {
                var val = selectorInput.value.trim();
                state.selection.tta__settings_css_selectors = val;
                state.userEdited = true;
                reapplySelectedHighlight();
                updateWordCount();
                updatePreview();
                if (saveBtn()) { saveBtn().disabled = !val; }
            });
            // Prevent typing in the input from propagating to page pick-mode listeners.
            selectorInput.addEventListener('click',   function (e) { e.stopPropagation(); });
            selectorInput.addEventListener('keydown', function (e) { e.stopPropagation(); });
        }
    }

    /* ─── draggable panels ──────────────────────────────────────── */

    // Generic draggable — works for both the left rail panel and the right
    // preview panel. Once dragged, the panel switches to free-float mode:
    // the CSS slide/transition is disabled and position is fully controlled
    // by inline left/top. Closing + re-opening stays at the dragged position.
    function makeDraggable(panel, handle, opts) {
        if (!panel || !handle) { return; }
        opts = opts || {};
        // snapEdge: when the admin releases the panel within `threshold`
        // pixels of this screen edge, fire onSnapClose() so the panel
        // closes and collapses to the floating tab. Allows the rail
        // panel to drag-off-left and the preview panel to drag-off-right
        // without hunting for the small × button.
        var snapEdge    = opts.snapEdge    || null;   // 'left' | 'right' | null
        var threshold   = opts.threshold   || 50;
        var onSnapClose = opts.onSnapClose || null;

        var dragging = false, startX, startY, startLeft, startTop;

        handle.addEventListener('mousedown', function (e) {
            if (e.button !== 0) { return; }

            // Capture the current visual position BEFORE altering any styles.
            var rect   = panel.getBoundingClientRect();
            startLeft  = rect.left;
            startTop   = rect.top;
            startX     = e.clientX;
            startY     = e.clientY;

            // Switch to free-float: kill transition + transform, clear any
            // CSS-side right/bottom offsets, pin with explicit left/top.
            panel.style.transition = 'none';
            panel.style.transform  = 'none';
            panel.style.right      = 'auto';
            panel.style.bottom     = 'auto';
            panel.style.left       = startLeft + 'px';
            panel.style.top        = startTop  + 'px';
            panel.classList.add('av-panel--floating');

            dragging = true;
            e.preventDefault();
        });

        d.addEventListener('mousemove', function (e) {
            if (!dragging) { return; }
            var nx = Math.max(0, startLeft + (e.clientX - startX));
            var ny = Math.max(0, startTop  + (e.clientY - startY));
            panel.style.left = nx + 'px';
            panel.style.top  = ny + 'px';

            // Snap-hint feedback while approaching the snap edge so the
            // admin sees the panel "wants" to close before they release.
            if (snapEdge && onSnapClose) {
                var near = false;
                if (snapEdge === 'left') { near = nx < threshold; }
                if (snapEdge === 'right') {
                    near = (w.innerWidth - (nx + panel.offsetWidth)) < threshold;
                }
                panel.classList.toggle('av-panel--snap-hint', near);
            }
        });

        d.addEventListener('mouseup', function () {
            if (!dragging) { return; }
            dragging = false;
            panel.classList.remove('av-panel--snap-hint');
            if (!snapEdge || !onSnapClose) { return; }
            var rect = panel.getBoundingClientRect();
            var nearEdge = false;
            if (snapEdge === 'left'  && rect.left < threshold) { nearEdge = true; }
            if (snapEdge === 'right' && (w.innerWidth - rect.right) < threshold) { nearEdge = true; }
            if (nearEdge) { onSnapClose(); }
        });
    }

    // Generic resizer — drag a handle element to change panel width and/or height.
    // dir: 'x' = width only, 'y' = height only, 'both' = both (default).
    // Defaults dropped to 30/30 so admins can shrink either panel down to a
    // nub if they want it parked out of the way without fully closing.
    function makeResizable(panel, handle, opts) {
        if (!panel || !handle) { return; }
        opts = opts || {};
        var minW = opts.minW || 30, minH = opts.minH || 30;
        var dir  = opts.dir  || 'both';
        var resizing = false, startX, startY, startW, startH;

        handle.addEventListener('mousedown', function (e) {
            if (e.button !== 0) { return; }
            var rect = panel.getBoundingClientRect();
            startW = rect.width;  startH = rect.height;
            startX = e.clientX;   startY = e.clientY;
            resizing = true;
            panel.style.transition = 'none';
            e.preventDefault();
            e.stopPropagation(); // don't trigger parent drag handle
        });

        d.addEventListener('mousemove', function (e) {
            if (!resizing) { return; }
            if (dir !== 'y') {
                var dx = opts.reverseX ? (startX - e.clientX) : (e.clientX - startX);
                panel.style.width = Math.max(minW, startW + dx) + 'px';
            }
            if (dir !== 'x') {
                panel.style.maxHeight = 'none';
                panel.style.height    = Math.max(minH, startH + (e.clientY - startY)) + 'px';
            }
        });

        d.addEventListener('mouseup', function () { resizing = false; });
    }

    function attachDraggable() {
        // Right preview panel — drag by header, resize width via right edge,
        // height via bottom edge. Drag-to-right-edge snap-closes the panel.
        var previewPanel        = d.getElementById('av-preview-panel');
        var previewHandle       = previewPanel && previewPanel.querySelector('.av-preview-panel__handle');
        var previewResizeLeft   = previewPanel && previewPanel.querySelector('.av-resize-handle--left-edge');
        var previewResizeBottom = previewPanel && previewPanel.querySelector('.av-resize-handle--bottom');
        makeDraggable(previewPanel, previewHandle, {
            snapEdge:    'right',
            threshold:   50,
            onSnapClose: function () { toggleRight(false); }
        });
        makeResizable(previewPanel, previewResizeLeft,  { dir: 'x', minW: 30, reverseX: true });
        makeResizable(previewPanel, previewResizeBottom, { dir: 'y', minH: 30 });

        // Left rail panel — drag by header, resize width via right-edge,
        // height via bottom edge (D21). Drag-to-left-edge snap-closes.
        var railPanel        = d.getElementById('av-rail-panel');
        var railHandle       = railPanel && railPanel.querySelector('.av-rail-panel__header');
        var railResize       = railPanel && railPanel.querySelector('.av-resize-handle--edge');
        var railResizeBottom = railPanel && railPanel.querySelector('.av-resize-handle--bottom');
        makeDraggable(railPanel, railHandle, {
            snapEdge:    'left',
            threshold:   50,
            onSnapClose: function () { toggleLeft(false); }
        });
        makeResizable(railPanel, railResize,       { dir: 'x', minW: 30 });
        makeResizable(railPanel, railResizeBottom, { dir: 'y', minH: 30 });
    }

    /* ─── panel open/close ──────────────────────────────────────── */

    function toggleLeft(forceOpen) {
        var panel = d.getElementById('av-rail-panel');
        var tab   = state.shell && state.shell.querySelector('.av-tab--left');
        if (!panel || !tab) { return; }
        var open = (typeof forceOpen === 'boolean') ? forceOpen : panel.hasAttribute('hidden');
        if (open) {
            panel.hidden = false;
            tab.setAttribute('aria-expanded', 'true');
            state.leftOpen = true;
        } else {
            panel.hidden = true;
            tab.setAttribute('aria-expanded', 'false');
            state.leftOpen = false;
            stopPickMode();
        }
    }

    function toggleRight(forceOpen) {
        var panel = d.getElementById('av-preview-panel');
        var tab   = state.shell && state.shell.querySelector('.av-tab--right');
        if (!panel || !tab) { return; }
        var open = (typeof forceOpen === 'boolean') ? forceOpen : panel.hasAttribute('hidden');
        if (open) {
            panel.hidden = false;
            tab.setAttribute('aria-expanded', 'true');
            state.rightOpen = true;
            updatePreview();
        } else {
            panel.hidden = true;
            tab.setAttribute('aria-expanded', 'false');
            state.rightOpen = false;
        }
    }

    /* ─── save ──────────────────────────────────────────────────── */

    function save() {
        if (!state.selection.tta__settings_css_selectors) { status('Pick a content region first.'); return; }
        var btn = saveBtn();
        if (!btn) { return; }
        btn.disabled = true;
        status('Saving\u2026');

        // TTS-238 D27.17 — wire body uses canonical storage keys.
        var body = {
            tta__settings_css_selectors:                      state.selection.tta__settings_css_selectors,
            tta__settings_exclude_content_by_css_selectors:   (state.selection.tta__settings_exclude_content_by_css_selectors || []).join('\n'),
            tta__settings_exclude_texts:                      (state.selection.tta__settings_exclude_texts || []).slice(),
            tta__settings_exclude_tags:                       (state.selection.tta__settings_exclude_tags  || []).slice()
        };
        if (state.scope && state.scope.kind === 'post') {
            body.scope_kind = 'post';
            body.post_id    = state.scope.post_id;
        } else if (state.scope && state.scope.kind === 'post_type') {
            body.scope_kind = 'post_type';
            body.post_type  = state.scope.post_type;
        } else {
            body.scope_kind = 'global';
        }

        restFetch('/atlasvoice/save-rule', { method: 'POST', body: body }).then(function (resp) {
            status('Saved \u2713 — content selector updated.');
            state.userEdited = false; // revert preview to "active system" view
            btn.disabled = false;
            try {
                w.dispatchEvent(new CustomEvent('atlasvoice:steprail:saved', {
                    detail: { scope: state.selection.scope, selector: state.selection.tta__settings_css_selectors, response: resp }
                }));
            } catch (e) {}
        }).catch(function (err) {
            status('Save failed: ' + err.message);
            btn.disabled = false;
        });
    }

    /* ─── active-system selector detection ─────────────────────── */

    // Mirrors extractFromActiveSystem tier waterfall but returns a CSS selector
    // string instead of text, so the Content Region field can be pre-filled on load.
    function detectActiveSelector() {
        // Tier 1 — AtlasVoice comment markers: find parent element of any
        // atlasvoice:start:N comment on the page (smallest id wins). Walk
        // once and match the first start-marker rather than hardcoding id=1.
        if (d.body) {
            var walker = d.createTreeWalker(d.body, NodeFilter.SHOW_COMMENT, null, false);
            var node;
            while ((node = walker.nextNode())) {
                if (/^\s*atlasvoice:start:\d+\s*$/.test(node.nodeValue || '')) {
                    var parent = node.parentElement;
                    if (parent && parent.tagName.toLowerCase() !== 'body') {
                        return generateSelector(parent);
                    }
                }
            }
        }
        // Tier 3 — Legacy wrapper. Match any .tts_content_wrapper_N rather
        // than only id=1; return a selector targeting whichever exists.
        var legacies = findLegacyWrappers();
        if (legacies.length) {
            // Pull the actual numeric id off the first wrapper's class so the
            // emitted selector is exact (.tts_content_wrapper_3, not _1).
            var m = /(?:^|\s)(tts_content_wrapper_\d+)(?:\s|$)/.exec(legacies[0].className || '');
            if (m) { return '.' + m[1]; }
        }
        return '';
    }

    // Called when no saved rules exist for this post. Detects the active
    // extraction selector and pre-fills the Content Region field so the admin
    // immediately sees what the TTS system is already reading.
    function autoFillActiveSelector() {
        if (state.selection.tta__settings_css_selectors) { return; } // already set by loadExistingRules
        var sel = detectActiveSelector();
        if (!sel) { return; }
        state.selection.tta__settings_css_selectors = sel;
        state.userEdited = false;
        updateSelectorDisplay();
        updateWordCount();
        try {
            var el = d.querySelector(sel);
            if (el) { state.selectedEl = el; el.classList.add('av-picker-selected'); }
        } catch (e) {}
        var sb = saveBtn();
        if (sb) { sb.disabled = false; }
        status('Content region auto-detected: ' + sel);
        updatePreview();
    }

    /* ─── load existing rules ───────────────────────────────────── */

    function loadExistingRules() {
        if (!state.postId) { return; }
        // TTS-238 D27.15 — When the URL pinned us to a specific scope
        // (?scope=global | post_type:slug | post:N), load the rule
        // saved at THAT scope (via /step-rail/scope-rule reading
        // tta_settings_data + post-meta) instead of the precedence
        // walk's winner. Without this, the picker shows the global
        // rule even when the admin explicitly opened "post type" or
        // "post" scope.
        // Only fast-path through /scope-rule when the URL actually had
        // ?scope=… set. Without it we want the precedence walk so the
        // picker reflects the live winner.
        var urlPinned = state.scopeFromUrl && state.scope
            && (state.scope.kind === 'post_type' || state.scope.kind === 'post' || state.scope.kind === 'global');
        if (urlPinned) {
            var p = '?post_id=' + state.postId;
            if (state.scope.kind === 'post_type') {
                p += '&scope=post_type&post_type=' + encodeURIComponent(state.scope.post_type || '');
            } else if (state.scope.kind === 'post') {
                p += '&scope=post';
            } else {
                p += '&scope=global';
            }
            restFetch('/step-rail/scope-rule' + p).then(function (resp) {
                if (!resp || !resp.tta__settings_css_selectors) { autoFillActiveSelector(); return; }
                state.selection.tta__settings_css_selectors = resp.tta__settings_css_selectors || '';
                if (resp.excl_set) {
                    state.selection.tta__settings_exclude_content_by_css_selectors = splitLines(resp.tta__settings_exclude_content_by_css_selectors);
                    state.selection.tta__settings_exclude_texts                    = splitTexts(resp.tta__settings_exclude_texts);
                    state.selection.tta__settings_exclude_tags                     = splitTags(resp.tta__settings_exclude_tags);
                }
                state.userEdited = false;
                renderScopeReadout(); updateSelectorDisplay(); updateWordCount();
                renderAllChips(); syncTagCheckboxes();
                try { var el = d.querySelector(resp.tta__settings_css_selectors); if (el) { state.selectedEl = el; el.classList.add('av-picker-selected'); } } catch (e) {}
                reapplyExcludeHighlights();
                var sb2 = saveBtn(); if (sb2) { sb2.disabled = false; }
                status('Active rule loaded (' + state.scope.kind + ').');
                updatePreview();
            }).catch(function () { autoFillActiveSelector(); });
            return;
        }
        // TTS-238 D27.43 — read the resolved rule synchronously from the
        // localized field that LocalizeData::inject_lazy already shipped
        // for this page. /step-rail/active-rule was the same payload over
        // REST (one round-trip + a deferred state update); the localized
        // field has it on the page already so we skip the request.
        var resp = (w.ttsObj && w.ttsObj.atlasvoice_resolved_rule)
            || (w.tta_obj && w.tta_obj.atlasvoice_resolved_rule)
            || null;

        if (!resp || !resp.tta__settings_css_selectors) {
            autoFillActiveSelector();
            return;
        }

        // `source` (= RuleResolver's selector_source) maps to the picker's
        // legacy `scope` string verbatim for the small set of values that
        // remain post-D26: post / post_type / global.
        var scope = resp.source || 'global';

        state.selection.tta__settings_css_selectors = resp.tta__settings_css_selectors || '';
        state.selection.scope     = scope;
        state.selection.post_type = resp.post_type || '';
        state.selection.language  = resp.language  || '';
        state.postType            = resp.post_type || state.postType || '';
        state.postLang            = resp.language  || '';

        // TTS-238 D27.22 — When the URL didn't pin a scope, sync
        // state.scope to whichever layer the resolver picked. Otherwise
        // the readout would say "Editing rule for: This post" while the
        // data shown is the post_type rule, and a Save would land in
        // the wrong slot.
        if (!state.scopeFromUrl) {
            if (scope === 'post_type') {
                state.scope = { kind: 'post_type', post_type: resp.post_type || state.postType || '' };
            } else if (scope === 'post') {
                state.scope = { kind: 'post', post_id: state.postId };
            } else {
                state.scope = { kind: 'global' };
            }
        }

        // excl_set=true means the server has explicit excl_* data for
        // this scope. excl_set=false means no rule actually saved yet —
        // keep the pre-populated defaults from the HTML checkboxes.
        if (resp.excl_set) {
            state.selection.tta__settings_exclude_content_by_css_selectors = splitLines(resp.tta__settings_exclude_content_by_css_selectors);
            state.selection.tta__settings_exclude_texts                    = splitTexts(resp.tta__settings_exclude_texts);
            state.selection.tta__settings_exclude_tags                     = splitTags(resp.tta__settings_exclude_tags);
        }

        state.userEdited = false;
        renderScopeReadout();
        updateSelectorDisplay();
        updateWordCount();
        renderAllChips();
        syncTagCheckboxes();
        try {
            var el = d.querySelector(resp.tta__settings_css_selectors);
            if (el) { state.selectedEl = el; el.classList.add('av-picker-selected'); }
        } catch (e) {}
        reapplyExcludeHighlights();
        var sb = saveBtn();
        if (sb) { sb.disabled = false; }
        status('Active rule loaded (' + scope + ').');
        updatePreview();
    }

    /* ─── keyboard ──────────────────────────────────────────────── */

    function onKeyDown(e) {
        if (!state.leftOpen) { return; }
        var mod = e.metaKey || e.ctrlKey;
        if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            popUndo();
        }
    }

    /* ─── init ──────────────────────────────────────────────────── */

    function init() {
        var shell = d.getElementById('av-steprail-root');
        if (!shell) { return; }

        state.shell  = shell;
        state.postId      = parseInt(shell.getAttribute('data-post-id') || '0', 10);
        state.rest        = shell.getAttribute('data-rest')  || '';
        state.nonce       = shell.getAttribute('data-nonce') || '';
        state.pro         = shell.getAttribute('data-pro') === '1';
        state.postType    = shell.getAttribute('data-post-type') || '';
        state.contentMeta = {
            addTitle:    shell.getAttribute('data-add-title')    === '1',
            addExcerpt:  shell.getAttribute('data-add-excerpt')  === '1',
            textBefore:  shell.getAttribute('data-text-before')  || '',
            textAfter:   shell.getAttribute('data-text-after')   || '',
            postTitle:   shell.getAttribute('data-post-title')   || '',
            postExcerpt: shell.getAttribute('data-post-excerpt') || '',
            delimiter:   shell.getAttribute('data-delimiter')    || '. '
        };
        state.selection.post_id = state.postId;

        // D26.1 — scope is now driven by the URL query string. Dashboard
        // "Pick visually" buttons launch with ?scope=global, ?scope=
        // post_type:<slug>, or ?scope=post:N. When the rail is opened
        // without an explicit scope (e.g. directly hitting the post
        // with ?atlasvoice_picker=1), default to per-post on Pro and
        // global on Free.
        var parsed = parseScopeFromUrl();
        // TTS-238 D27.22/D27.43 — track whether the URL explicitly pinned
        // a scope. When it didn't, loadExistingRules reads the resolved
        // rule from `ttsObj.atlasvoice_resolved_rule` (precedence walk
        // already applied server-side) so the picker shows what's actually
        // winning at runtime instead of an empty per-post slot just because
        // Pro defaults to "post".
        state.scopeFromUrl = !!parsed;
        if (!parsed) {
            parsed = state.pro
                ? { kind: 'post', post_id: state.postId }
                : { kind: 'global' };
        }
        state.scope = parsed;
        // Keep state.selection.scope populated with the legacy 5-way
        // string for the existing save() / loadExistingRules() callers
        // (those will move to scope-aware writes in D26.2). Mapping:
        if (parsed.kind === 'post')      { state.selection.scope = 'post';      }
        else if (parsed.kind === 'post_type') { state.selection.scope = 'post_type'; state.selection.post_type = parsed.post_type; }
        else                             { state.selection.scope = 'global';    }
        // Render the read-only scope label immediately.
        renderScopeReadout();

        // Tab toggles.
        var leftTab  = shell.querySelector('.av-tab--left');
        var rightTab = shell.querySelector('.av-tab--right');
        if (leftTab)  { leftTab.addEventListener('click',  function () { toggleLeft();  }); }
        if (rightTab) { rightTab.addEventListener('click', function () { toggleRight(); }); }

        // Panel close buttons.
        var railPanel = d.getElementById('av-rail-panel');
        if (railPanel) {
            var closeBtn = railPanel.querySelector('.av-rail-panel__close');
            if (closeBtn) { closeBtn.addEventListener('click', function () { toggleLeft(false); }); }
        }
        var previewPanel = d.getElementById('av-preview-panel');
        if (previewPanel) {
            var previewClose = previewPanel.querySelector('.av-preview-panel__close');
            if (previewClose) { previewClose.addEventListener('click', function () { toggleRight(false); }); }
        }

        // Save.
        var sb = saveBtn();
        if (sb) { sb.addEventListener('click', save); }

        // Keyboard undo.
        d.addEventListener('keydown', onKeyDown);

        // Draggable preview.
        attachDraggable();

        // Scope radiogroup retired — fetch removed in D27.27.

        // Wire pickers + chips.
        attachPickButton();
        attachChipAddButtons();
        attachTagCheckboxes();
        attachVerifyButton();

        // Pre-populate tta__settings_exclude_tags from the default-checked tag checkboxes.
        // loadExistingRules() will overwrite when this post already has saved rules.
        Array.prototype.forEach.call(
            state.shell.querySelectorAll('.av-tag-check input[type=checkbox]'),
            function (cb) {
                if (cb.checked && (state.selection.tta__settings_exclude_tags || []).indexOf(cb.value) === -1) {
                    state.selection.tta__settings_exclude_tags.push(cb.value);
                }
            }
        );

        // Initial Pro gate render.
        renderAllChips();

        // Pre-load any saved rules for this post.
        loadExistingRules();

        // Auto-open left panel if ?atlasvoice_picker=1 is present.
        if (shell.getAttribute('data-auto-open') === '1') {
            toggleLeft(true);
            status('Picker ready \u2014 click any element to set the content region.');
        }
    }

    /* ─── public API ────────────────────────────────────────────── */

    w.AtlasVoiceStepRail = {
        open:   function () { toggleLeft(true);  },
        close:  function () { toggleLeft(false); },
        isOpen: function () { return state.leftOpen; }
    };

    if (d.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window, document);
