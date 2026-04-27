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
        scopes:      null,
        selection:   makeEmptySelection(),
        pickMode:    null,        // null | 'pick' | 'excl'
        exclKind:    'excl_css',
        userEdited:  false,       // false = show active-system content; true = show live rule preview
        undoStack:   [],
        UNDO_MAX:    20,
        leftOpen:    false,
        rightOpen:   false,
        hoveredEl:   null,
        selectedEl:  null,
        excludedEls: [],
        postType:    '',          // post's actual post type (cached from /active-rule on init)
        postLang:    ''           // post's actual language  (cached from /active-rule on init)
    };

    var CHIP_KINDS = ['excl_css', 'excl_texts', 'excl_tags'];

    var CHIP_FEATURE_NAMES = {
        excl_css:   'Skip these areas',
        excl_texts: 'Skip these phrases',
        excl_tags:  'Skip these tag types'
    };

    var SCOPE_OPTIONS = [
        { value: 'global',             label: 'Global',               needsPt: false, needsLang: false, proOnly: false },
        { value: 'post_type',          label: 'Post type',            needsPt: true,  needsLang: false, proOnly: true  },
        { value: 'language',           label: 'Language',             needsPt: false, needsLang: true,  proOnly: true  },
        { value: 'post_type_language', label: 'Post type + language', needsPt: true,  needsLang: true,  proOnly: true  },
        { value: 'post',               label: 'This post',            needsPt: false, needsLang: false, proOnly: true  }
    ];

    function makeEmptySelection() {
        return {
            scope:      'post',
            post_type:  '',
            language:   '',
            post_id:    0,
            selector:   '',
            excl_css:   [],
            excl_texts: [],
            excl_tags:  []
        };
    }

    function cloneSelection(sel) {
        return {
            scope:      sel.scope,
            post_type:  sel.post_type,
            language:   sel.language,
            post_id:    sel.post_id,
            selector:   sel.selector,
            excl_css:   (sel.excl_css   || []).slice(),
            excl_texts: (sel.excl_texts || []).slice(),
            excl_tags:  (sel.excl_tags  || []).slice()
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
        if (state.selection.selector) {
            try {
                var el = d.querySelector(state.selection.selector);
                if (el) { state.selectedEl = el; el.classList.add('av-picker-selected'); }
            } catch (e) {}
        }
        renderAllChips();
        syncTagCheckboxes();
        updateSelectorDisplay();
        updateWordCount();
        updatePreview();
        saveBtn().disabled = !state.selection.selector;
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
        var cls = cleanClasses(el).split(/\s+/).filter(Boolean);
        var nth = nthOfType(el);
        var nthSfx = nth > 0 ? ':nth-of-type(' + nth + ')' : '';

        // Try unique class inside the selected content container.
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
            var pcls = cleanClasses(parent).split(/\s+/).filter(Boolean);
            if (parent.id && !/^\d/.test(parent.id)) {
                return '#' + parent.id + ' ' + tag + (cls.length ? '.' + cls[0] : '') + nthSfx;
            }
            return ptag + (pcls.length ? '.' + pcls[0] : '') + ' ' + tag + (cls.length ? '.' + cls[0] : '') + nthSfx;
        }
        return tag + (cls.length ? '.' + cls[0] : '') + nthSfx;
    }

    var PICKER_CLASSES = /\bav-picker-(hover|selected|exclude-hover|excluded|touch-include|touch-exclude)\b/g;

    function cleanClasses(el) {
        // Temporarily strip picker classes so they don't pollute the selector.
        var orig = (typeof el.className === 'string') ? el.className : (el.className.baseVal || '');
        return orig.replace(PICKER_CLASSES, '').trim().replace(/\s{2,}/g, ' ');
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
        if (el.id && !/^\d/.test(el.id) && d.getElementById(el.id) === el) {
            return '#' + el.id;
        }
        var tag = el.tagName.toLowerCase();
        var cls = cleanClasses(el).split(/\s+/).filter(Boolean);
        var nth = nthOfType(el);
        var nthSfx = nth > 0 ? ':nth-of-type(' + nth + ')' : '';

        // Try each class for global uniqueness (no positional suffix needed).
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
            var pcls = cleanClasses(parent).split(/\s+/).filter(Boolean);
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
        state.exclKind = kind || 'excl_css';
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
                state.selection.selector = '';
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
            state.selection.selector = sel;
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
    // selector. Many → comma-list. Reuses generateSelector for each so the
    // output matches what click-pick would produce.
    function selectorsFromTouched(els) {
        if (!els.length) { return ''; }
        var parts = els.map(function (el) { return generateSelector(el); }).filter(Boolean);
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
        if (state.pickMode === 'select-excl' && state.selection.selector) {
            try { contained = d.querySelector(state.selection.selector); } catch (e) {}
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
                state.selection.selector = selector;
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
                if ((state.selection.excl_css || []).indexOf(selector) !== -1) {
                    status('Already in list: "' + selector + '"');
                    return;
                }
                pushUndo('select to exclude "' + selector + '"');
                state.selection.excl_css = (state.selection.excl_css || []).concat([selector]);
                state.userEdited = true;
                renderChipRow('excl_css');
                reapplyExcludeHighlights();
                updatePreview();
                renderBrittleScopeWarning('excl_css', multi && brittleScope);
                status('Excluded: ' + selector + (multi && brittleScope ? ' (scope-brittle, see warning)' : ''));
                // Stay in mode so admin can drag another exclusion.
                state._selectTouched = [];
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
        if (state.selection.selector) {
            inp.value = state.selection.selector;
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
        if (!state.selection.selector) { slot.hidden = true; slot.textContent = ''; return; }
        try {
            var el = d.querySelector(state.selection.selector);
            if (!el) { slot.hidden = true; return; }
            var text = (el.innerText || el.textContent || '').trim();
            var words = text ? text.split(/\s+/).filter(Boolean).length : 0;
            slot.textContent = '~' + words + ' words';
            slot.hidden = false;
        } catch (e) { slot.hidden = true; }
    }

    /* ─── content extraction + preview ──────────────────────────── */

    // Mirrors extractor engine tier 1: walk comment nodes for atlasvoice markers.
    function extractFromCommentMarkers(buttonId) {
        if (!d.body) { return null; }
        var startText = 'atlasvoice:start:' + (buttonId || 1);
        var endText   = 'atlasvoice:end:'   + (buttonId || 1);
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
        // Tier 1 — AtlasVoice comment markers (new system active).
        var frag = extractFromCommentMarkers(1);
        if (frag) {
            var t = nodeToText(frag);
            if (t) { return { text: applyContentMeta(t), source: 'AtlasVoice markers' }; }
        }
        // Tier 2 — saved selector with current exclude rules.
        if (state.selection.selector) {
            var t2 = extractWithRules();
            if (t2) { return { text: t2, source: 'Saved selector' }; } // applyContentMeta already called inside
        }
        // Tier 3 — legacy wrapper div (.tts_content_wrapper_1).
        var legacy = d.querySelector('.tts_content_wrapper_1');
        if (legacy) {
            var t3 = (legacy.textContent || '').trim();
            if (t3) { return { text: applyContentMeta(t3), source: 'Legacy wrapper' }; }
        }
        return { text: '', source: '' };
    }

    // State B: live preview using whatever rules are currently in state.selection.
    function extractWithRules() {
        if (!state.selection.selector) { return ''; }
        var el;
        try { el = d.querySelector(state.selection.selector); } catch (e) { return ''; }
        if (!el) { return ''; }

        // Resolve excl_css selectors against the LIVE DOM before cloning so
        // positional pseudos (:nth-of-type, :nth-child) reflect the actual
        // page structure — not the detached clone's shifted sibling context.
        // Tag each live match with a one-shot data attribute; after cloning
        // we strip the same-attribute nodes out of the clone by reference,
        // guaranteeing preview removal matches the red highlight 1:1.
        var EXCL_MARK = 'data-av-excl-match';
        (state.selection.excl_css || []).forEach(function (sel) {
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

        Array.prototype.forEach.call(clone.querySelectorAll('[class]'), function (n) {
            n.className = (n.className || '').replace(PICKER_CLASSES, '').trim();
        });

        Array.prototype.forEach.call(clone.querySelectorAll('[' + EXCL_MARK + ']'), function (n) {
            if (n.parentNode) { n.parentNode.removeChild(n); }
        });

        (state.selection.excl_tags || []).forEach(function (tag) {
            try {
                Array.prototype.forEach.call(clone.querySelectorAll(tag), function (n) {
                    if (n.parentNode) { n.parentNode.removeChild(n); }
                });
            } catch (e) {}
        });

        var raw  = clone.textContent || '';
        var excl = state.selection.excl_texts || [];

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
        if (!state.rightOpen) { return; }
        var panel = d.getElementById('av-preview-panel');
        var body  = panel && panel.querySelector('.av-preview-panel__body');
        var meta  = panel && panel.querySelector('.av-preview-panel__meta');
        if (!body) { return; }

        var text, source;
        if (state.selection.selector) {
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

    /* ─── scope radiogroup ──────────────────────────────────────── */

    function renderScopeRow() {
        var wrap = $('.av-scope-group');
        if (!wrap) { return; }
        wrap.innerHTML = '';
        var scopes = state.scopes || { post_types: [], languages: [] };

        SCOPE_OPTIONS.forEach(function (opt) {
            // Language-based scopes: only render when a language plugin is active.
            if (opt.needsLang && !(scopes.languages || []).length) { return; }

            var id       = 'av-scope-' + opt.value;
            var isGated  = opt.proOnly && !state.pro;
            var isActive = (state.selection.scope === opt.value);

            var label = d.createElement('label');
            label.setAttribute('for', id);
            var cls = [];
            if (isActive)  { cls.push('is-checked'); }
            if (isGated)   { cls.push('is-disabled'); }
            if (cls.length) { label.className = cls.join(' '); }

            var input = d.createElement('input');
            input.type = 'radio'; input.name = 'av-scope'; input.id = id; input.value = opt.value;
            input.checked = isActive;

            if (isGated) {
                input.disabled = true;
                label.addEventListener('click', function (e) {
                    e.preventDefault();
                    showProPromo(opt.label);
                });
            } else {
                input.addEventListener('change', function () {
                    state.selection.scope     = opt.value;
                    state.selection.post_type = opt.needsPt   ? state.postType : '';
                    state.selection.language  = opt.needsLang ? state.postLang : '';
                    renderScopeRow();
                    loadRulesForScope();
                });
            }

            label.appendChild(input);
            label.appendChild(d.createTextNode('\u00a0' + opt.label));

            if (isGated) {
                var pill = d.createElement('span');
                pill.className = 'av-pro-pill';
                pill.textContent = 'Pro';
                label.appendChild(d.createTextNode('\u00a0'));
                label.appendChild(pill);
            }

            wrap.appendChild(label);
        });
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
            state.selection.selector = resp.selector || '';
            state.userEdited = false;
            if (resp.excl_set) {
                state.selection.excl_css   = Array.isArray(resp.excl_css)   ? resp.excl_css   : [];
                state.selection.excl_texts = Array.isArray(resp.excl_texts) ? resp.excl_texts : [];
                state.selection.excl_tags  = Array.isArray(resp.excl_tags)  ? resp.excl_tags  : [];
            } else {
                state.selection.excl_css   = [];
                state.selection.excl_texts = [];
                state.selection.excl_tags  = [];
                if (state.shell) {
                    Array.prototype.forEach.call(
                        state.shell.querySelectorAll('.av-tag-check input[type=checkbox]'),
                        function (cb) {
                            if (cb.defaultChecked && (state.selection.excl_tags || []).indexOf(cb.value) === -1) {
                                state.selection.excl_tags.push(cb.value);
                            }
                        }
                    );
                }
            }
            updateSelectorDisplay();
            updateWordCount();
            renderAllChips();
            syncTagCheckboxes();
            if (state.selection.selector) {
                try {
                    var el = d.querySelector(state.selection.selector);
                    if (el) { state.selectedEl = el; el.classList.add('av-picker-selected'); }
                } catch (e) {}
            }
            var sb = saveBtn();
            if (sb) { sb.disabled = !state.selection.selector; }
            status(resp.selector ? 'Rule loaded for scope: ' + scope + '.' : 'No saved rule for scope: ' + scope + '.');
            if (state.rightOpen) { updatePreview(); }
        }).catch(function () {
            status('Could not load rule for scope: ' + scope + '.');
        });
    }

    /* ─── chips ─────────────────────────────────────────────────── */

    // Re-apply red .av-picker-excluded highlight to every element matching a
    // saved excl_css selector. Called after loadExistingRules so reloads keep
    // the visual state, and after any chip mutation so live edits track the DOM.
    function reapplyExcludeHighlights() {
        state.excludedEls.forEach(function (el) { el.classList.remove('av-picker-excluded'); });
        state.excludedEls = [];
        (state.selection.excl_css || []).forEach(function (exclSel) {
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
        if (!state.selection.selector) { return; }
        try {
            var el = d.querySelector(state.selection.selector);
            if (el && !isRailElement(el)) {
                state.selectedEl = el;
                el.classList.add('av-picker-selected');
            }
        } catch (e) {}
    }

    function validateChipValue(kind, val) {
        val = (val || '').toString().trim();
        if (!val) { return ''; }
        if (kind === 'excl_tags') {
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
                if (kind === 'excl_css') { reapplyExcludeHighlights(); }
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
            if (kind === 'excl_css') { reapplyExcludeHighlights(); }
            updatePreview();
        }

        var done = false;
        function commit() {
            if (done) { return; } done = true;
            var finalVal = validateChipValue(kind, input.value);
            if (!finalVal) {
                // Invalid — revert to original.
                state.selection[kind][idx] = original;
                if (kind === 'excl_css') { reapplyExcludeHighlights(); }
                updatePreview();
                renderChipRow(kind);
                status('Invalid value — reverted.');
                return;
            }
            var list = state.selection[kind] || [];
            var dupIdx = list.indexOf(finalVal);
            if (dupIdx !== -1 && dupIdx !== idx) {
                state.selection[kind][idx] = original;
                if (kind === 'excl_css') { reapplyExcludeHighlights(); }
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
                if (kind === 'excl_css') { reapplyExcludeHighlights(); }
                updatePreview();
                status('Updated: ' + finalVal);
            }
            renderChipRow(kind);
        }
        function cancel() {
            if (done) { return; } done = true;
            // Restore original value + visuals.
            state.selection[kind][idx] = original;
            if (kind === 'excl_css') { reapplyExcludeHighlights(); }
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
        if (kind === 'excl_css') { reapplyExcludeHighlights(); }
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
        if (k === 'excl_css') { reapplyExcludeHighlights(); }
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
        if (sb) { sb.disabled = !state.selection.selector; }
        return true;
    }

    /* ─── tag checkboxes ────────────────────────────────────────── */

    function attachTagCheckboxes() {
        if (!state.shell) { return; }
        Array.prototype.forEach.call(state.shell.querySelectorAll('.av-tag-check input[type=checkbox]'), function (cb) {
            cb.addEventListener('change', function () {
                var tag = cb.value;
                if (cb.checked) {
                    if (addChip('excl_tags', tag)) { updatePreview(); }
                } else {
                    var idx = (state.selection.excl_tags || []).indexOf(tag);
                    if (idx !== -1) {
                        pushUndo('remove excl_tags "' + tag + '"');
                        state.selection.excl_tags.splice(idx, 1);
                        renderChipRow('excl_tags');
                        updatePreview();
                    }
                }
            });
        });
    }

    function syncTagCheckboxes() {
        if (!state.shell) { return; }
        Array.prototype.forEach.call(state.shell.querySelectorAll('.av-tag-check input[type=checkbox]'), function (cb) {
            cb.checked = (state.selection.excl_tags || []).indexOf(cb.value) !== -1;
        });
    }

    /* ─── chip add buttons ──────────────────────────────────────── */

    function attachChipAddButtons() {
        CHIP_KINDS.forEach(function (kind) {
            var step = state.shell && state.shell.querySelector('.av-step[data-chip-kind="' + kind + '"]');
            if (!step) { return; }

            // Pick-to-exclude button (only on excl_css step).
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

            // Drag-to-exclude button (loose-snap selection → excl_css chip).
            var selectExcl = step.querySelector('.av-btn--select-excl');
            if (selectExcl && kind === 'excl_css') {
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
                state.selection.selector = '';
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
                state.selection.selector = val;
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
    function makeDraggable(panel, handle) {
        if (!panel || !handle) { return; }
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
        });

        d.addEventListener('mouseup', function () { dragging = false; });
    }

    // Generic resizer — drag a handle element to change panel width and/or height.
    // dir: 'x' = width only, 'y' = height only, 'both' = both (default).
    function makeResizable(panel, handle, opts) {
        if (!panel || !handle) { return; }
        opts = opts || {};
        var minW = opts.minW || 200, minH = opts.minH || 120;
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
        // Right preview panel — drag by header, resize width via right edge, height via bottom edge.
        var previewPanel        = d.getElementById('av-preview-panel');
        var previewHandle       = previewPanel && previewPanel.querySelector('.av-preview-panel__handle');
        var previewResizeLeft   = previewPanel && previewPanel.querySelector('.av-resize-handle--left-edge');
        var previewResizeBottom = previewPanel && previewPanel.querySelector('.av-resize-handle--bottom');
        makeDraggable(previewPanel, previewHandle);
        makeResizable(previewPanel, previewResizeLeft,  { dir: 'x', minW: 220, reverseX: true });
        makeResizable(previewPanel, previewResizeBottom, { dir: 'y', minH: 120 });

        // Left rail panel — drag by its own header, resize width via right-edge handle.
        var railPanel  = d.getElementById('av-rail-panel');
        var railHandle = railPanel && railPanel.querySelector('.av-rail-panel__header');
        var railResize = railPanel && railPanel.querySelector('.av-resize-handle--edge');
        makeDraggable(railPanel, railHandle);
        makeResizable(railPanel, railResize, { dir: 'x', minW: 220 });
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
        if (!state.selection.selector) { status('Pick a content region first.'); return; }
        var btn = saveBtn();
        if (!btn) { return; }
        btn.disabled = true;
        status('Saving\u2026');

        var path, body;
        if (state.selection.scope === 'post') {
            path = '/post-rules';
            body = { action: 'set', post_id: state.selection.post_id, selector: state.selection.selector };
        } else {
            path = '/save-selector';
            body = { selector: state.selection.selector };
            if (state.selection.scope === 'post_type' || state.selection.scope === 'post_type_language') {
                body.post_type = state.selection.post_type;
            }
            if (state.selection.scope === 'language' || state.selection.scope === 'post_type_language') {
                body.language = state.selection.language;
            }
        }
        // Always send all excl_* for every scope so clearing chips is persisted.
        body.excl_css   = (state.selection.excl_css   || []).slice();
        body.excl_texts = (state.selection.excl_texts || []).slice();
        body.excl_tags  = (state.selection.excl_tags  || []).slice();

        restFetch(path, { method: 'POST', body: body }).then(function (resp) {
            status('Saved \u2713 — content selector updated.');
            state.userEdited = false; // revert preview to "active system" view
            btn.disabled = false;
            try {
                w.dispatchEvent(new CustomEvent('atlasvoice:steprail:saved', {
                    detail: { scope: state.selection.scope, selector: state.selection.selector, response: resp }
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
        // Tier 1 — AtlasVoice comment markers: find parent element of start comment.
        if (d.body) {
            var startText = 'atlasvoice:start:1';
            var walker = d.createTreeWalker(d.body, NodeFilter.SHOW_COMMENT, null, false);
            var node;
            while ((node = walker.nextNode())) {
                if ((node.nodeValue || '').trim() === startText) {
                    var parent = node.parentElement;
                    if (parent && parent.tagName.toLowerCase() !== 'body') {
                        return generateSelector(parent);
                    }
                }
            }
        }
        // Tier 3 — Legacy wrapper.
        if (d.querySelector('.tts_content_wrapper_1')) { return '.tts_content_wrapper_1'; }
        return '';
    }

    // Called when no saved rules exist for this post. Detects the active
    // extraction selector and pre-fills the Content Region field so the admin
    // immediately sees what the TTS system is already reading.
    function autoFillActiveSelector() {
        if (state.selection.selector) { return; } // already set by loadExistingRules
        var sel = detectActiveSelector();
        if (!sel) { return; }
        state.selection.selector = sel;
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
        if (state.rightOpen) { updatePreview(); }
    }

    /* ─── load existing rules ───────────────────────────────────── */

    function loadExistingRules() {
        if (!state.postId) { return; }
        // /step-rail/active-rule resolves the full precedence walk (per-post →
        // post_type_language → language → post_type → global) and returns the
        // winning rule + the scope it came from so the UI reflects reality.
        restFetch('/step-rail/active-rule?post_id=' + state.postId).then(function (resp) {
            if (!resp || !resp.selector) {
                autoFillActiveSelector();
                return;
            }
            state.selection.selector  = resp.selector  || '';
            state.selection.scope     = resp.scope      || 'global';
            state.selection.post_type = resp.post_type  || '';
            state.selection.language  = resp.language   || '';
            state.postType            = resp.post_type  || '';
            state.postLang            = resp.language   || '';
            // excl_set=true means the server has explicit excl_* data for this
            // scope (new array storage format). Restore them, even if empty —
            // empty means the user explicitly cleared all exclusions.
            // excl_set=false means a legacy string-format entry: keep the
            // pre-populated defaults from the HTML checkboxes.
            if (resp.excl_set) {
                state.selection.excl_css   = Array.isArray(resp.excl_css)   ? resp.excl_css   : [];
                state.selection.excl_texts = Array.isArray(resp.excl_texts) ? resp.excl_texts : [];
                state.selection.excl_tags  = Array.isArray(resp.excl_tags)  ? resp.excl_tags  : [];
            }
            state.userEdited = false;
            renderScopeRow();
            updateSelectorDisplay();
            updateWordCount();
            renderAllChips();
            syncTagCheckboxes();
            try {
                var el = d.querySelector(resp.selector);
                if (el) { state.selectedEl = el; el.classList.add('av-picker-selected'); }
            } catch (e) {}
            reapplyExcludeHighlights();
            var sb = saveBtn();
            if (sb) { sb.disabled = false; }
            status('Active rule loaded (' + (resp.scope || 'post') + ').');
            if (state.rightOpen) { updatePreview(); }
        }).catch(function () {
            autoFillActiveSelector();
        });
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
        // Per-post rules are Pro-only. Free sites default to global scope so
        // saves go to the selector store (readable by RuleResolver on Free).
        state.selection.scope   = state.pro ? 'post' : 'global';

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

        // Scope radiogroup — fetch dynamic data (post types / languages).
        restFetch('/step-rail/scopes').then(function (resp) {
            state.scopes = resp || { post_types: [], languages: [] };
        }).catch(function () {
            state.scopes = { post_types: [], languages: [] };
        }).then(function () {
            renderScopeRow();
        });

        // Wire pickers + chips.
        attachPickButton();
        attachChipAddButtons();
        attachTagCheckboxes();

        // Pre-populate excl_tags from the default-checked tag checkboxes.
        // loadExistingRules() will overwrite when this post already has saved rules.
        Array.prototype.forEach.call(
            state.shell.querySelectorAll('.av-tag-check input[type=checkbox]'),
            function (cb) {
                if (cb.checked && (state.selection.excl_tags || []).indexOf(cb.value) === -1) {
                    state.selection.excl_tags.push(cb.value);
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
