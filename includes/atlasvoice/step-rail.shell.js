/* AtlasVoice step-rail shell (TTS-238 D9).
 *
 * Inlined by StepRail::shell_bootstrap_js() via wp_add_inline_script.
 * Framework-free IIFE — exposes window.AtlasVoiceStepRail with:
 *
 *   open({ post_id?, scope?, post_type?, language?, selector? })
 *   close()
 *   isOpen()
 *
 * Rail state lives in a single object inside the IIFE; re-opening
 * the rail with different args resets the visible fields but reuses
 * the same DOM shell + iframe element for snappy open → pick → save.
 *
 * The rail talks to three REST endpoints (registered in RestRoutes):
 *   GET  /tta/v1/step-rail/scopes
 *   GET  /tta/v1/step-rail/sample-url
 *   POST /tta/v1/save-selector          (existing)
 *   POST /tta/v1/post-rules             (existing, Pro-only)
 *
 * No build step: the file is read with file_get_contents and emitted
 * inline so the only runtime dependency is the picker bundle (which
 * is itself lazy-loaded by the D8 ttsLoadPicker stub).
 */
(function (w, d) {
    'use strict';

    if (w.AtlasVoiceStepRail) { return; }

    var state = {
        shell:       null,
        rest:        '',
        nonce:       '',
        iframeFlag:  'atlasvoice_iframe',
        pro:         false,
        open:        false,
        scopes:      null,      // REST /step-rail/scopes cache
        selection:   makeEmptySelection(),
        pickMode:    'pick',    // 'pick' | 'reject'
        undoStack:   [],        // ring buffer of pre-change selection snapshots
        UNDO_MAX:    20,
        iframeReady: false,
        parentOrigin: (typeof w.location !== 'undefined' && w.location.origin) || ''
    };

    // Canonical chip kinds — order matches the UI rows ④⑤⑥.
    var CHIP_KINDS = ['excl_css', 'excl_texts', 'excl_tags'];

    function makeEmptySelection() {
        return {
            scope:       '',
            post_type:   '',
            language:    '',
            post_id:     0,
            selector:    '',
            excl_css:    [],
            excl_texts:  [],
            excl_tags:   []
        };
    }

    // Shallow clone the selection for the undo snapshot. Array-of-strings
    // fields get their own copies; scalar fields are copied by value.
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

    // Snapshot the current selection onto the undo stack BEFORE a
    // destructive change. Caps at state.UNDO_MAX entries — older
    // snapshots are dropped silently. Called from every chip add /
    // remove + every reject-mode accept.
    function pushUndo(label) {
        state.undoStack.push({ label: label || '', snap: cloneSelection(state.selection) });
        if (state.undoStack.length > state.UNDO_MAX) {
            state.undoStack.shift();
        }
    }

    function popUndo() {
        var entry = state.undoStack.pop();
        if (!entry) { return false; }
        state.selection = entry.snap;
        renderAllChips();
        var input = $('.atlasvoice-step-rail__selector-input');
        if (input) { input.value = state.selection.selector || ''; }
        $('.atlasvoice-step-rail__save').disabled = !state.selection.selector;
        status('Undid: ' + (entry.label || 'last change') + '  (' + state.undoStack.length + ' more)');
        return true;
    }

    // ---- util ----

    function $(sel, root) {
        return (root || state.shell).querySelector(sel);
    }
    function $$(sel, root) {
        return Array.prototype.slice.call((root || state.shell).querySelectorAll(sel));
    }
    function status(msg) {
        var el = $('.atlasvoice-step-rail__status');
        if (el) { el.textContent = msg || ''; }
    }
    function setRowState(rowKey, stateName) {
        $$('.atlasvoice-step-rail__row').forEach(function (li) {
            if (li.getAttribute('data-row') === rowKey) {
                li.classList.toggle('is-active', stateName === 'active');
                li.classList.toggle('is-done',   stateName === 'done');
                li.classList.toggle('is-disabled', stateName === 'disabled');
            }
        });
    }

    function restFetch(path, opts) {
        opts = opts || {};
        var url = state.rest.replace(/\/$/, '') + path;
        var headers = { 'X-WP-Nonce': state.nonce, 'Accept': 'application/json' };
        if (opts.body && !(opts.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        return fetch(url, {
            method: opts.method || 'GET',
            credentials: 'same-origin',
            headers: headers,
            body: opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined
        }).then(function (r) {
            if (!r.ok) { return r.text().then(function (t) { throw new Error('HTTP ' + r.status + ': ' + t); }); }
            return r.json();
        });
    }

    // ---- row ① scope ----

    var SCOPE_OPTIONS = [
        { value: 'global',              label: 'Global',               needsPt: false, needsLang: false },
        { value: 'post_type',           label: 'Post type',            needsPt: true,  needsLang: false },
        { value: 'language',            label: 'Language',             needsPt: false, needsLang: true  },
        { value: 'post_type_language',  label: 'Post type + language', needsPt: true,  needsLang: true  },
        { value: 'post',                label: 'This post',            needsPt: false, needsLang: false }
    ];

    function renderScopeRow() {
        var wrap = $('.atlasvoice-step-rail__scope-group');
        if (!wrap) { return; }
        wrap.innerHTML = '';
        SCOPE_OPTIONS.forEach(function (opt) {
            var id = 'av-scope-' + opt.value;
            var label = d.createElement('label');
            label.setAttribute('for', id);
            if (state.selection.scope === opt.value) { label.classList.add('is-checked'); }
            if (opt.value === 'post' && !state.selection.post_id) { label.style.opacity = '0.5'; label.title = 'Open from a specific post to enable.'; }
            var input = d.createElement('input');
            input.type = 'radio'; input.name = 'av-scope'; input.id = id; input.value = opt.value;
            if (state.selection.scope === opt.value) { input.checked = true; }
            if (opt.value === 'post' && !state.selection.post_id) { input.disabled = true; }
            input.addEventListener('change', function () {
                state.selection.scope = opt.value;
                renderScopeRow();
                renderTargetRow();
                setRowState('scope', 'done');
                setRowState('target', 'active');
                maybeResolveSample();
            });
            label.appendChild(input);
            label.appendChild(d.createTextNode(' ' + opt.label));
            wrap.appendChild(label);
        });
    }

    // ---- row ② post-type / language ----

    function renderTargetRow() {
        var wrap = $('.atlasvoice-step-rail__target-fields');
        if (!wrap) { return; }
        wrap.innerHTML = '';
        var scope = SCOPE_OPTIONS.filter(function (o) { return o.value === state.selection.scope; })[0];
        if (!scope) {
            wrap.innerHTML = '<em style="color:#9ca3af;">' + 'Select a scope above.'.replace(/&/g, '&amp;') + '</em>';
            return;
        }

        if (!scope.needsPt && !scope.needsLang) {
            // Global or post — nothing to pick in this row; advance.
            wrap.innerHTML = '<em style="color:#059669;">No further target needed.</em>';
            setRowState('target', 'done');
            setRowState('region', 'active');
            maybeResolveSample();
            return;
        }

        if (scope.needsPt) {
            var ptLabel = d.createElement('label');
            ptLabel.appendChild(d.createTextNode('Post type'));
            var ptSelect = d.createElement('select');
            var blank = d.createElement('option'); blank.value = ''; blank.textContent = '— choose —'; ptSelect.appendChild(blank);
            (state.scopes && state.scopes.post_types ? state.scopes.post_types : []).forEach(function (pt) {
                var o = d.createElement('option'); o.value = pt.slug; o.textContent = pt.label + ' (' + pt.slug + ')';
                if (state.selection.post_type === pt.slug) { o.selected = true; }
                ptSelect.appendChild(o);
            });
            ptSelect.addEventListener('change', function () {
                state.selection.post_type = ptSelect.value;
                maybeResolveSample();
            });
            ptLabel.appendChild(ptSelect);
            wrap.appendChild(ptLabel);
        }

        if (scope.needsLang) {
            var langs = (state.scopes && state.scopes.languages) ? state.scopes.languages : [];
            if (!langs.length) {
                var warn = d.createElement('em');
                warn.style.color = '#b91c1c';
                warn.textContent = 'No multilingual plugin detected.';
                wrap.appendChild(warn);
            } else {
                var langLabel = d.createElement('label');
                langLabel.appendChild(d.createTextNode('Language'));
                var langSelect = d.createElement('select');
                var lb = d.createElement('option'); lb.value = ''; lb.textContent = '— choose —'; langSelect.appendChild(lb);
                langs.forEach(function (code) {
                    var o = d.createElement('option'); o.value = code; o.textContent = code;
                    if (state.selection.language === code) { o.selected = true; }
                    langSelect.appendChild(o);
                });
                langSelect.addEventListener('change', function () {
                    state.selection.language = langSelect.value;
                    maybeResolveSample();
                });
                langLabel.appendChild(langSelect);
                wrap.appendChild(langLabel);
            }
        }
    }

    // ---- row ③ iframe sandbox ----

    function maybeResolveSample() {
        var scope = SCOPE_OPTIONS.filter(function (o) { return o.value === state.selection.scope; })[0];
        if (!scope) { return; }
        if (scope.needsPt  && !state.selection.post_type) { return; }
        if (scope.needsLang && !state.selection.language)  { return; }
        if (scope.value === 'post' && !state.selection.post_id) { return; }

        status('Locating sample post…');
        var qs = [
            'scope=' + encodeURIComponent(state.selection.scope),
            'post_type=' + encodeURIComponent(state.selection.post_type || ''),
            'language=' + encodeURIComponent(state.selection.language || ''),
            'post_id=' + encodeURIComponent(state.selection.post_id || 0)
        ].join('&');

        restFetch('/step-rail/sample-url?' + qs).then(function (resp) {
            if (!resp || !resp.url) {
                status(resp && resp.reason ? resp.reason : 'No sample post available for this scope.');
                setIframe('');
                return;
            }
            status('Sample: ' + (resp.post_title || resp.url));
            setIframe(resp.url);
            setRowState('target', 'done');
            setRowState('region', 'active');
        }).catch(function (err) {
            status('Could not resolve sample: ' + err.message);
            setIframe('');
        });
    }

    function setIframe(url) {
        var wrap = $('.atlasvoice-step-rail__iframe-wrap');
        var iframe = $('.atlasvoice-step-rail__iframe');
        if (!wrap || !iframe) { return; }
        if (!url) {
            wrap.classList.remove('is-live');
            iframe.removeAttribute('src');
            state.iframeReady = false;
            return;
        }
        wrap.classList.add('is-live');
        state.iframeReady = false;
        iframe.src = url;
    }

    // ---- parent ← iframe bridge ----

    function onIframeMessage(event) {
        if (!state.open) { return; }
        if (state.parentOrigin && event.origin !== state.parentOrigin) { return; }
        var m = event.data || {};
        if (!m || m.source !== 'atlasvoice-iframe') { return; }
        if (m.type === 'ready') {
            state.iframeReady = true;
            status('Pick mode ready. Click any element in the preview.');
            // auto-kick the picker so admins don't need an extra button press
            postToIframe('pick:start');
        } else if (m.type === 'pick:selected') {
            var picked = (m.payload && m.payload.selector) || '';
            if (!picked) { return; }
            // D10 — if the payload flags `rejected` (Alt-click from the
            // iframe) OR the parent is in reject mode, the selector
            // becomes an excl_css chip instead of the content target.
            var rejected = !!(m.payload && m.payload.rejected) || state.pickMode === 'reject';
            if (rejected) {
                if (!state.pro) {
                    status('Exclude chips require Pro — switch back to Pick mode or upgrade.');
                    return;
                }
                if (addChip('excl_css', picked)) {
                    status('Excluded: ' + picked + '  (Cmd/Ctrl+Z to undo)');
                }
                return;
            }
            pushUndo('set selector "' + picked + '"');
            state.selection.selector = picked;
            var input = $('.atlasvoice-step-rail__selector-input');
            if (input) { input.value = state.selection.selector; }
            $('.atlasvoice-step-rail__save').disabled = !state.selection.selector;
            setRowState('region', 'done');
            status('Selector picked — review and Save.');
        } else if (m.type === 'pick:reject') {
            // Legacy / explicit reject message. Treat identically to
            // pick:selected with rejected=true.
            var rej = (m.payload && m.payload.selector) || '';
            if (!rej) { return; }
            if (!state.pro) {
                status('Exclude chips require Pro.');
                return;
            }
            if (addChip('excl_css', rej)) {
                status('Excluded: ' + rej + '  (Cmd/Ctrl+Z to undo)');
            }
        } else if (m.type === 'error') {
            status('Iframe error: ' + (m.payload && m.payload.code));
        }
    }

    function postToIframe(type, payload) {
        var iframe = $('.atlasvoice-step-rail__iframe');
        if (!iframe || !iframe.contentWindow) { return; }
        try {
            iframe.contentWindow.postMessage(
                { source: 'atlasvoice-parent', type: type, payload: payload || {} },
                state.parentOrigin || '*'
            );
        } catch (e) {}
    }

    // ---- save ----

    function save() {
        if (!state.selection.selector) { return; }
        var btn = $('.atlasvoice-step-rail__save');
        btn.disabled = true;
        status('Saving…');

        var body;
        var path;
        if (state.selection.scope === 'post') {
            path = '/post-rules';
            body = {
                action:   'set',
                post_id:  state.selection.post_id,
                selector: state.selection.selector
            };
            // D10 — post-scope saves ship the chip arrays in the same
            // payload. PerPostRules::set() sanitises unknown keys so
            // this is safe even if the server predates D10.
            if ((state.selection.excl_css   || []).length) { body.excl_css   = state.selection.excl_css.slice(); }
            if ((state.selection.excl_texts || []).length) { body.excl_texts = state.selection.excl_texts.slice(); }
            if ((state.selection.excl_tags  || []).length) { body.excl_tags  = state.selection.excl_tags.slice(); }
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

        restFetch(path, { method: 'POST', body: body }).then(function (resp) {
            status('Saved ✓');
            try {
                w.dispatchEvent(new CustomEvent('atlasvoice:steprail:saved', {
                    detail: { scope: state.selection.scope, selector: state.selection.selector, response: resp }
                }));
            } catch (e) {}
            setTimeout(api.close, 500);
        }).catch(function (err) {
            status('Save failed: ' + err.message);
            btn.disabled = false;
        });
    }

    // ---- open / close ----

    function attachOnce() {
        var shell = d.getElementById('atlasvoice-step-rail');
        if (!shell) { return false; }
        state.shell     = shell;
        state.rest      = shell.getAttribute('data-rest') || '';
        state.nonce     = shell.getAttribute('data-nonce') || '';
        state.iframeFlag = shell.getAttribute('data-iframe-flag') || 'atlasvoice_iframe';
        state.pro       = shell.getAttribute('data-pro') === '1';

        shell.addEventListener('click', function (e) {
            if (e.target.getAttribute('data-close') === '1') { api.close(); }
        });
        $('.atlasvoice-step-rail__save').addEventListener('click', save);
        var selInput = $('.atlasvoice-step-rail__selector-input');
        if (selInput) {
            selInput.addEventListener('input', function () {
                state.selection.selector = selInput.value.trim();
                $('.atlasvoice-step-rail__save').disabled = !state.selection.selector;
            });
        }
        w.addEventListener('message', onIframeMessage);
        w.addEventListener('keydown', onKeyDown);

        // D10 — wire chip add/remove forms + pick/reject mode toggle.
        // Both are cheap to attach once; the row DOM is rendered by the
        // server so the forms already exist when we land here.
        attachChipHandlers();
        attachModeToggle();
        return true;
    }

    function resetSelection(init) {
        var sel = makeEmptySelection();
        if (init) {
            sel.scope      = init.scope      || '';
            sel.post_type  = init.post_type  || '';
            sel.language   = init.language   || '';
            sel.post_id    = init.post_id    || 0;
            sel.selector   = init.selector   || '';
            if (Array.isArray(init.excl_css))   { sel.excl_css   = init.excl_css.slice();   }
            if (Array.isArray(init.excl_texts)) { sel.excl_texts = init.excl_texts.slice(); }
            if (Array.isArray(init.excl_tags))  { sel.excl_tags  = init.excl_tags.slice();  }
        }
        state.selection = sel;
        state.undoStack = [];
        state.pickMode  = 'pick';
    }

    // ---- rule chips (rows ④⑤⑥) ----

    // Per-kind validation — keeps the post-side sanitiser in the
    // driver's seat, but rejects obvious nonsense client-side so
    // admins get immediate feedback.
    function validateChipValue(kind, val) {
        val = (val || '').toString().trim();
        if (!val) { return ''; }
        if (kind === 'excl_tags') {
            // Single tag name — lowercase alphanumerics only.
            val = val.replace(/^<|>$/g, '').toLowerCase();
            if (!/^[a-z][a-z0-9]*$/.test(val)) { return ''; }
        }
        // excl_css + excl_texts accept almost anything printable; cap length.
        if (val.length > 512) { val = val.slice(0, 512); }
        return val;
    }

    function renderChipRow(kind) {
        var row = state.shell.querySelector('.atlasvoice-step-rail__row[data-chip-kind="' + kind + '"]');
        if (!row) { return; }
        var chipsWrap = row.querySelector('.atlasvoice-step-rail__chips');
        if (!chipsWrap) { return; }
        chipsWrap.innerHTML = '';
        var items = state.selection[kind] || [];
        if (!items.length) {
            var empty = d.createElement('span');
            empty.style.color = '#9ca3af';
            empty.style.fontSize = '12px';
            empty.textContent = 'No ' + kind.replace('excl_', '') + ' excludes yet.';
            chipsWrap.appendChild(empty);
            return;
        }
        items.forEach(function (val, idx) {
            var chip = d.createElement('span');
            chip.className = 'atlasvoice-step-rail__chip';
            chip.setAttribute('role', 'listitem');
            chip.appendChild(d.createTextNode(val));
            var x = d.createElement('button');
            x.type = 'button';
            x.setAttribute('aria-label', 'Remove');
            x.textContent = '\u00D7';
            x.addEventListener('click', function () {
                pushUndo('remove ' + kind + ' "' + val + '"');
                state.selection[kind].splice(idx, 1);
                renderChipRow(kind);
                $('.atlasvoice-step-rail__save').disabled = !state.selection.selector;
                status('Removed ' + kind + ' chip.');
            });
            chip.appendChild(x);
            chipsWrap.appendChild(chip);
        });
    }

    function renderAllChips() {
        CHIP_KINDS.forEach(renderChipRow);
        CHIP_KINDS.forEach(function (kind) {
            var row = state.shell.querySelector('.atlasvoice-step-rail__row[data-chip-kind="' + kind + '"]');
            if (!row) { return; }
            row.classList.toggle('is-locked', !state.pro);
        });
    }

    function addChip(kind, rawVal, opts) {
        opts = opts || {};
        var val = validateChipValue(kind, rawVal);
        if (!val) {
            status('Rejected: "' + rawVal + '" is not a valid ' + kind.replace('excl_', '') + ' entry.');
            return false;
        }
        if ((state.selection[kind] || []).indexOf(val) !== -1) {
            status('Already present: "' + val + '".');
            return false;
        }
        if (!opts.skipUndo) { pushUndo('add ' + kind + ' "' + val + '"'); }
        state.selection[kind] = (state.selection[kind] || []).concat([val]);
        renderChipRow(kind);
        // Saving the chip set requires a selector too; if none picked
        // yet, keep Save disabled so admins don't accidentally ship a
        // scope row with no body rule.
        $('.atlasvoice-step-rail__save').disabled = !state.selection.selector;
        return true;
    }

    function attachChipHandlers() {
        CHIP_KINDS.forEach(function (kind) {
            var row = state.shell.querySelector('.atlasvoice-step-rail__row[data-chip-kind="' + kind + '"]');
            if (!row) { return; }
            var form = row.querySelector('.atlasvoice-step-rail__chip-add');
            if (!form) { return; }
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (!state.pro) { status('Rule chips require Pro.'); return; }
                var inp = form.querySelector('input');
                if (addChip(kind, inp.value)) { inp.value = ''; inp.focus(); }
            });
        });
    }

    // ---- mode toggle ----

    function attachModeToggle() {
        $$('input[name="av-pick-mode"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                setPickMode(radio.value);
            });
        });
    }

    function setPickMode(mode) {
        state.pickMode = (mode === 'reject') ? 'reject' : 'pick';
        var wrap = $('.atlasvoice-step-rail__iframe-wrap');
        if (wrap) { wrap.classList.toggle('is-reject-mode', state.pickMode === 'reject'); }
        $$('input[name="av-pick-mode"]').forEach(function (r) {
            r.checked = (r.value === state.pickMode);
        });
        status(state.pickMode === 'reject'
            ? 'Reject mode: clicks add the target\u2019s selector to CSS excludes.'
            : 'Pick mode: clicks set the content selector.');
    }

    // ---- keyboard undo ----

    function onKeyDown(ev) {
        if (!state.open) { return; }
        var mod = ev.metaKey || ev.ctrlKey;
        if (mod && !ev.shiftKey && (ev.key === 'z' || ev.key === 'Z')) {
            ev.preventDefault();
            popUndo();
        }
    }

    var api = {
        open: function (init) {
            if (!state.shell && !attachOnce()) { return false; }
            resetSelection(init);
            state.open = true;
            state.shell.hidden = false;
            state.shell.setAttribute('aria-hidden', 'false');
            setRowState('scope', 'active');
            setRowState('target', '');
            setRowState('region', '');
            setIframe('');
            // D10 — paint the chip rows + sync the mode toggle back to
            // pick after resetSelection wiped the picker mode.
            renderAllChips();
            setPickMode('pick');
            status('Loading scopes…');

            restFetch('/step-rail/scopes').then(function (resp) {
                state.scopes = resp || { post_types: [], languages: [] };
                renderScopeRow();
                renderTargetRow();
                status(state.selection.scope ? 'Scope preselected.' : 'Choose a scope to continue.');
                if (state.selection.scope) {
                    setRowState('scope', 'done');
                    setRowState('target', 'active');
                    maybeResolveSample();
                }
            }).catch(function (err) { status('Failed to load scopes: ' + err.message); });

            return true;
        },
        close: function () {
            if (!state.shell) { return; }
            state.open = false;
            state.shell.hidden = true;
            state.shell.setAttribute('aria-hidden', 'true');
            setIframe('');
            $('.atlasvoice-step-rail__save').disabled = true;
            try {
                w.dispatchEvent(new CustomEvent('atlasvoice:steprail:closed', { detail: { selection: state.selection } }));
            } catch (e) {}
        },
        isOpen: function () { return !!state.open; }
    };

    w.AtlasVoiceStepRail = api;

    if (d.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', attachOnce);
    } else {
        attachOnce();
    }
})(window, document);
