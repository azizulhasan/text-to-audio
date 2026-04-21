/**
 * AtlasVoiceSelector — Visual Content Picker (TTS-238)
 *
 * A SelectorGadget-inspired overlay that lets non-technical users point at a
 * region of their page and have the plugin learn a stable CSS selector for
 * content extraction. Based on SelectorGadget (MIT), adapted for our needs:
 *   - Emits a STABLE selector (prefers id, data-*, itemprop, unique class,
 *     falls back to structural nth-of-type).
 *   - Filters out auto-generated ids/classes (Gutenberg block-uid, Elementor
 *     widget-uid, etc.) via allow/deny patterns.
 *   - Posts the chosen selector to /tts/v1/save-selector along with the
 *     current post type so Pro can key it per-CPT.
 */

(function (global) {
    'use strict';

    // IDs / classes that change every render — never use them as anchors.
    var AUTO_ID_PATTERN = /^(block-|wp-block-|elementor-|et_pb_|ct-|brxe-|fl-node-|uagb-|kb-|gb-)[a-f0-9-]{6,}$/i;
    var AUTO_CLASS_PATTERN = /^(wp-block-|elementor-element-|et_pb_|ct-|brxe-|fl-node-|uagb-|kb-|gb-)[a-f0-9-]{6,}$/i;

    var STABLE_DATA_ATTRS = ['data-tts-target', 'data-content-area', 'data-post-content', 'itemprop'];

    function isStableId(id) {
        return typeof id === 'string' && id.length > 0 && !AUTO_ID_PATTERN.test(id);
    }

    function findStableDataAttr(el) {
        for (var i = 0; i < STABLE_DATA_ATTRS.length; i++) {
            var attr = STABLE_DATA_ATTRS[i];
            if (el.hasAttribute(attr)) {
                var val = el.getAttribute(attr);
                if (val) { return '[' + attr + '="' + CSS.escape(val) + '"]'; }
            }
        }
        return null;
    }

    function findUniqueStableClass(el) {
        if (!el.classList || !el.classList.length) { return null; }
        var classes = Array.prototype.slice.call(el.classList);
        for (var i = 0; i < classes.length; i++) {
            var c = classes[i];
            if (AUTO_CLASS_PATTERN.test(c)) { continue; }
            try {
                var matches = global.document.querySelectorAll('.' + CSS.escape(c));
                if (matches.length === 1) { return '.' + CSS.escape(c); }
            } catch (_) { /* skip */ }
        }
        return null;
    }

    function buildStructuralSelector(el) {
        var parts = [];
        var cur = el;
        while (cur && cur.nodeType === 1 && cur !== global.document.body) {
            var part = cur.tagName.toLowerCase();
            var parent = cur.parentNode;
            if (parent) {
                var siblings = Array.prototype.filter.call(
                    parent.children,
                    function (s) { return s.tagName === cur.tagName; }
                );
                if (siblings.length > 1) {
                    var idx = siblings.indexOf(cur) + 1;
                    part += ':nth-of-type(' + idx + ')';
                }
            }
            parts.unshift(part);
            cur = cur.parentNode;
        }
        return 'body > ' + parts.join(' > ');
    }

    /**
     * Compute a stable CSS selector for a chosen element.
     * Preference order: id > data-attr > itemprop > unique class > structural.
     */
    function computeStableSelector(el) {
        if (!el || el.nodeType !== 1) { return null; }
        if (isStableId(el.id)) { return '#' + CSS.escape(el.id); }
        var dataSel = findStableDataAttr(el);
        if (dataSel) { return dataSel; }
        var classSel = findUniqueStableClass(el);
        if (classSel) { return classSel; }
        return buildStructuralSelector(el);
    }

    // ---------- Overlay UI ----------

    var overlayEl = null;
    var highlightEl = null;
    var toolbarEl = null;
    var currentSelector = null;
    var currentElement = null;
    var onSaveCallback = null;

    function createOverlayStyles() {
        if (global.document.getElementById('atlasvoice-picker-styles')) { return; }
        var css = '' +
            '.atlasvoice-picker-highlight { outline: 3px solid #184c53 !important; outline-offset: 2px !important; background: rgba(24,76,83,0.08) !important; cursor: pointer !important; }' +
            '.atlasvoice-picker-toolbar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 2147483647; background: #184c53; color: #fff; padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.25); font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px; display: flex; gap: 10px; align-items: center; max-width: 90vw; }' +
            '.atlasvoice-picker-toolbar code { background: rgba(255,255,255,.15); padding: 3px 8px; border-radius: 4px; font-size: 12px; max-width: 40ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
            '.atlasvoice-picker-toolbar button { background: #fff; color: #184c53; border: 0; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer; }' +
            '.atlasvoice-picker-toolbar button.av-cancel { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4); }' +
            '';
        var style = global.document.createElement('style');
        style.id = 'atlasvoice-picker-styles';
        style.textContent = css;
        global.document.head.appendChild(style);
    }

    function clearHighlight() {
        if (highlightEl) {
            highlightEl.classList.remove('atlasvoice-picker-highlight');
            highlightEl = null;
        }
    }

    function setHighlight(el) {
        clearHighlight();
        if (el) {
            el.classList.add('atlasvoice-picker-highlight');
            highlightEl = el;
        }
    }

    function updateToolbar(selector) {
        if (!toolbarEl) { return; }
        var code = toolbarEl.querySelector('code');
        if (code) { code.textContent = selector || '(hover an element…)'; }
        var save = toolbarEl.querySelector('.av-save');
        if (save) { save.disabled = !selector; }
    }

    function isPickerChrome(el) {
        while (el && el !== global.document.body) {
            if (el.classList && (
                el.classList.contains('atlasvoice-picker-toolbar') ||
                el.classList.contains('atlasvoice-picker-highlight')
            )) {
                return true;
            }
            el = el.parentNode;
        }
        return false;
    }

    function onMouseMove(e) {
        var el = e.target;
        if (!el || isPickerChrome(el)) { return; }
        setHighlight(el);
        currentElement = el;
        currentSelector = computeStableSelector(el);
        updateToolbar(currentSelector);
    }

    function onClick(e) {
        var el = e.target;
        if (!el || isPickerChrome(el)) { return; }
        e.preventDefault();
        e.stopPropagation();
        setHighlight(el);
        currentElement = el;
        currentSelector = computeStableSelector(el);
        updateToolbar(currentSelector);
    }

    function buildToolbar() {
        var bar = global.document.createElement('div');
        bar.className = 'atlasvoice-picker-toolbar';
        bar.innerHTML = '' +
            '<span>AtlasVoiceSelector:</span>' +
            '<code>(hover an element…)</code>' +
            '<button class="av-save" type="button" disabled>Use this</button>' +
            '<button class="av-cancel" type="button">Cancel</button>';
        bar.querySelector('.av-save').addEventListener('click', function () {
            if (currentSelector && typeof onSaveCallback === 'function') {
                onSaveCallback({ selector: currentSelector, element: currentElement });
            }
            stop();
        });
        bar.querySelector('.av-cancel').addEventListener('click', stop);
        return bar;
    }

    /**
     * Persist a selector to the plugin via REST.
     * Resolves with the full store ({ global, per_post_type }).
     */
    function persistSelector(selector, postType) {
        var tts = global.ttsObj || global.tta_obj || {};
        var base = (tts.api_url || '/wp-json/').replace(/\/$/, '/');
        var nonce = tts.rest_nonce || tts.nonce || '';
        return fetch(base + 'tta/v1/save-selector', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            },
            body: JSON.stringify({ selector: selector, post_type: postType || '' })
        }).then(function (r) { return r.json(); });
    }

    /**
     * Start the picker.
     *
     * @param {Function|Object} optsOrOnSave  Either an `onSave({selector,element})`
     *                                        callback, or an options bag:
     *                                        { onSave, persist: true, postType: 'post' }
     */
    function start(optsOrOnSave) {
        if (overlayEl) { return; }
        createOverlayStyles();

        var opts = typeof optsOrOnSave === 'function' ? { onSave: optsOrOnSave } : (optsOrOnSave || {});
        var userOnSave = typeof opts.onSave === 'function' ? opts.onSave : null;
        var persist    = opts.persist !== false; // default: persist unless explicitly false
        var postType   = opts.postType || '';

        onSaveCallback = function (result) {
            if (persist) {
                persistSelector(result.selector, postType).then(function (res) {
                    // Hot-update in-memory ttsObj so the engine picks up the
                    // new selector immediately without requiring a reload.
                    // The server returns the full store shape { global, per_post_type }.
                    try {
                        var tts = global.ttsObj || global.tta_obj;
                        if (tts && res && res.data) {
                            tts.atlasvoice_selectors = res.data;
                        }
                    } catch (_) { /* non-fatal */ }
                    if (userOnSave) { userOnSave(Object.assign({}, result, { saved: res })); }
                }).catch(function (err) {
                    if (userOnSave) { userOnSave(Object.assign({}, result, { saved: null, error: err })); }
                });
            } else if (userOnSave) {
                userOnSave(result);
            }
        };

        toolbarEl = buildToolbar();
        global.document.body.appendChild(toolbarEl);
        overlayEl = toolbarEl; // marker that we're active
        global.document.addEventListener('mousemove', onMouseMove, true);
        global.document.addEventListener('click', onClick, true);
    }

    function stop() {
        clearHighlight();
        if (toolbarEl && toolbarEl.parentNode) { toolbarEl.parentNode.removeChild(toolbarEl); }
        toolbarEl = null;
        overlayEl = null;
        currentSelector = null;
        currentElement = null;
        global.document.removeEventListener('mousemove', onMouseMove, true);
        global.document.removeEventListener('click', onClick, true);
    }

    // ---------- First-visit auto-detect (PR-B Phase B2) ----------
    //
    // On the first admin visit to a post-type that has no saved selector, run
    // the engine's scored resolver and:
    //   confidence >= 0.65 → silently POST the stable selector to save-selector
    //                        (per-CPT when Pro, global when Free).
    //   confidence <  0.35 → surface a dismissable "need help?" toast that
    //                        opens the picker on click.
    //   otherwise           → no-op (engine picks fine, no need to persist).
    //
    // This is the zero-click path from plan §0.4. Runs only when:
    //   - extractor opt-in is ON
    //   - ttsObj.can_save_selector is true (user has manage_options)
    //   - no selector is already saved for the current post-type (or global in Free)
    //   - not inside the dashboard/admin
    //   - not a session-dismissed post (one toast per admin/session is enough)

    var TOAST_DISMISS_KEY = 'atlasvoice_lowconf_dismissed_v1';
    var AUTO_SAVE_THRESHOLD = 0.65;
    var LOW_CONFIDENCE_THRESHOLD = 0.35;

    function hasSavedSelectorForCurrentContext(tts, postType) {
        var store = tts.atlasvoice_selectors || {};
        var perType = store.per_post_type || {};
        if (tts.is_pro_active && postType && perType[postType]) { return true; }
        return !!(store.global && String(store.global).trim());
    }

    function buildLowConfidenceToast(onPick, onDismiss) {
        var bar = global.document.createElement('div');
        bar.className = 'atlasvoice-picker-toolbar';
        bar.style.cssText = (bar.style.cssText || '') +
            'max-width:480px;background:#8a3b00;'; // amber tint — "attention, not error"
        bar.innerHTML = '' +
            '<span>AtlasVoice isn\u2019t sure which region is the article.</span>' +
            '<button class="av-save av-pick" type="button">Pick content area</button>' +
            '<button class="av-cancel av-dismiss" type="button">Dismiss</button>';
        bar.querySelector('.av-pick').addEventListener('click', function () {
            if (bar.parentNode) { bar.parentNode.removeChild(bar); }
            if (typeof onPick === 'function') { onPick(); }
        });
        bar.querySelector('.av-dismiss').addEventListener('click', function () {
            if (bar.parentNode) { bar.parentNode.removeChild(bar); }
            if (typeof onDismiss === 'function') { onDismiss(); }
        });
        return bar;
    }

    function firstVisitAutoDetect() {
        var tts = global.ttsObj || global.tta_obj || {};
        if (!tts.use_atlasvoice_extractor) { return; }
        if (!tts.can_save_selector) { return; }

        var postType = tts.current_post_type || '';

        // Already saved? Nothing to auto-detect.
        if (hasSavedSelectorForCurrentContext(tts, postType)) { return; }

        if (!global.AtlasVoiceExtractor || typeof global.AtlasVoiceExtractor.resolveContent !== 'function') {
            return;
        }

        var resolution;
        try {
            resolution = global.AtlasVoiceExtractor.resolveContent({
                buttonId: 1,
                postType: postType || null
            });
        } catch (_) { return; }
        if (!resolution) { return; }

        // High confidence → silently save the winning node's stable selector.
        // Only heuristic tiers (schema / builder / article) trigger auto-save:
        // markers/saved are already authoritative, wrapper is a legacy anchor
        // we don't want to freeze as a per-CPT rule, php-fallback has no DOM.
        var isHeuristicTier = (
            resolution.tier === 'schema' ||
            resolution.tier === 'builder' ||
            resolution.tier === 'article'
        );
        if (resolution.confidence >= AUTO_SAVE_THRESHOLD && isHeuristicTier && resolution.liveNode) {
            var stable = computeStableSelector(resolution.liveNode);
            if (!stable) { return; }
            persistSelector(stable, postType).then(function (res) {
                try {
                    if (tts && res && res.data) {
                        tts.atlasvoice_selectors = res.data;
                    }
                } catch (_) { /* non-fatal */ }
            }).catch(function () { /* silent — retry on next visit */ });
            return;
        }

        // Low confidence → show the one-shot toast (admins only).
        if (resolution.confidence < LOW_CONFIDENCE_THRESHOLD) {
            try {
                if (global.sessionStorage && global.sessionStorage.getItem(TOAST_DISMISS_KEY) === '1') {
                    return;
                }
            } catch (_) { /* storage blocked — show anyway */ }

            createOverlayStyles();
            var toast = buildLowConfidenceToast(
                function onPick() { start({ postType: postType, persist: true }); },
                function onDismiss() {
                    try { global.sessionStorage.setItem(TOAST_DISMISS_KEY, '1'); } catch (_) {}
                }
            );
            global.document.body.appendChild(toast);
        }
    }

    // Kick off after the engine has loaded. The engine is enqueued right before
    // the picker, so AtlasVoiceExtractor is defined by the time this runs.
    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', firstVisitAutoDetect);
    } else {
        // DOM is already parsed — defer one tick so the engine has a chance to
        // register its globals in script-order.
        setTimeout(firstVisitAutoDetect, 0);
    }

    global.AtlasVoiceSelector = {
        start: start,
        stop: stop,
        computeStableSelector: computeStableSelector,
        firstVisitAutoDetect: firstVisitAutoDetect
    };
})(typeof window !== 'undefined' ? window : this);
