/**
 * TTS-263 — "Listen to selected text": the selection pill, plus the two
 * discoverability affordances that tell readers the feature exists.
 *
 * Three cooperating pieces, all gated on
 * tta_highlight_settings['tta__selection_listen_enabled'] (default OFF):
 *
 *  1. SELECTION PILL — floats near a text selection inside the readable
 *     wrapper (`.tts_content_wrapper_<buttonId>`): "Listen" reads only the
 *     selection; "From here" reads from the selection's first word to the end
 *     (double-clicking a word = the classic click-a-word-to-read-from-there
 *     gesture). On coarse-pointer (touch) devices it positions BELOW the
 *     selection — the native copy/share toolbar owns the space above — with
 *     44px touch targets and an icon-only "From here".
 *  2. ONE-TIME TIP — small bubble under the player the first time the reader
 *     interacts with it; auto-hides, and never returns once seen/dismissed
 *     (localStorage).
 *  3. SIDE BADGE — a collapsed tab on the left edge that expands on
 *     hover/focus/tap to "Select any text to listen to it"; closing hides it
 *     for the session (sessionStorage).
 *
 * Which announcements run is the admin's choice via
 * tta__selection_announce: 'tip' (default) | 'badge' | 'both' | 'off'.
 *
 * This module is player-agnostic: it only captures the selection, maps it to
 * a span in the painter's flat text index (clipped to the wrapper, snapped to
 * word boundaries), and fires ONE wp.hooks action:
 *
 *   tts_listen_selection  { buttonId, text, start, end, fromHere }
 *
 * Players subscribe and implement playback their own way (1/2 speak it via
 * speechSynthesis; the MP3 players map it to an audio time range). No player
 * code lives here and no new window.* global is exposed — the painter
 * (window.AtlasVoiceHighlighter) hands this module its singleton accessor via
 * initSelectionControl(getPainter).
 *
 * All three pieces are colored from the site's existing button customization
 * (tta_customize_settings backgroundColor/color) — one brand pair the admin
 * already chose, no extra color settings.
 */

// TTS-264: i18n. wp-i18n is enqueued as a dependency of the player scripts that
// bundle this module, with wp_set_script_translations('text-to-audio') (see
// TTA_Admin frontend enqueue). The guard keeps the control working if i18n
// isn't present. All strings here are plain (no placeholders), so a bare __()
// is correct — no sprintf needed.
const { __ } = (typeof wp !== 'undefined' && wp.i18n) ? wp.i18n : { __: (s) => s };

const PILL_ID = 'atlasvoice-selection-control';
const TIP_ID = 'atlasvoice-selection-tip';
const BADGE_ID = 'atlasvoice-selection-badge';
const STYLE_ID = 'atlasvoice-selection-styles';
const TIP_SEEN_KEY = 'atlasvoice_selection_tip_seen';
const BADGE_HIDDEN_KEY = 'atlasvoice_selection_badge_hidden';

/** Read the gates lazily — localized data may arrive after this module runs. */
function highlightSettings() {
    return (window.ttsObj && window.ttsObj.settings && window.ttsObj.settings.highlight) || {};
}

function selectionEnabled() {
    return !!highlightSettings().tta__selection_listen_enabled;
}

/** Announcement strategy: 'tip' | 'badge' | 'both' | 'off' (default 'tip'). */
function announceMode() {
    const mode = highlightSettings().tta__selection_announce;
    return ['tip', 'badge', 'both', 'off'].indexOf(mode) !== -1 ? mode : 'tip';
}

/** Colors follow the configured button customization, like the player UI does. */
function controlColors() {
    const customize = (window.ttsObj && window.ttsObj.settings && window.ttsObj.settings.customize) || {};
    return {
        background: customize.backgroundColor || '#184c53',
        color: customize.color || '#ffffff',
    };
}

/**
 * UI strings, filterable so sites can localize/re-word them without a new
 * setting (same pattern as ttsProPlayerOptions).
 */
function controlLabels() {
    const defaults = {
        listen: __('Listen', 'text-to-audio'),
        fromHere: __('From here', 'text-to-audio'),
        listenTitle: __('Listen to the selected text', 'text-to-audio'),
        fromHereTitle: __('Listen from here to the end', 'text-to-audio'),
        tip: __('Tip: select any text in the article to listen to just that part.', 'text-to-audio'),
        badge: __('Select any text to listen to it', 'text-to-audio'),
        dismiss: __('Dismiss', 'text-to-audio'),
    };
    if (window.wp && window.wp.hooks) {
        return { ...defaults, ...(wp.hooks.applyFilters('tts_selection_control_labels', defaults) || {}) };
    }
    return defaults;
}

function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/** Coarse pointer = touch-first device: pill goes below the selection there. */
function isTouchDevice() {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
}

function injectControlStyles() {
    if (document.getElementById(STYLE_ID)) {
        return;
    }
    const touchPad = isTouchDevice() ? '12px 16px' : '8px 12px';
    const css =
        '#' + PILL_ID + '{position:absolute;z-index:2147483000;display:flex;align-items:center;gap:2px;' +
            'padding:4px;border-radius:22px;box-shadow:0 2px 10px rgba(0,0,0,.28);' +
            'font-size:13px;line-height:1;user-select:none;-webkit-user-select:none;' +
            'opacity:0;transform:scale(.96);transition:opacity .12s ease-out,transform .12s ease-out;}' +
        '#' + PILL_ID + '.atlasvoice-sel-in{opacity:1;transform:scale(1);}' +
        '#' + PILL_ID + ' button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;' +
            'color:inherit;font:inherit;cursor:pointer;padding:' + touchPad + ';border-radius:18px;white-space:nowrap;}' +
        '#' + PILL_ID + ' button[data-action="listen"]{background:rgba(255,255,255,.16);font-weight:600;}' +
        '#' + PILL_ID + ' button:hover,#' + PILL_ID + ' button:focus-visible{background:rgba(255,255,255,.26);outline:none;}' +
        '#' + PILL_ID + ' .atlasvoice-sel-divider{width:1px;height:18px;background:rgba(255,255,255,.25);margin:0 2px;flex:0 0 auto;}' +
        '#' + PILL_ID + ' svg{flex:0 0 auto;}' +
        '#' + TIP_ID + '{position:absolute;z-index:2147483000;display:flex;align-items:flex-start;gap:9px;' +
            'max-width:300px;padding:11px 12px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.28);' +
            'font-size:13px;line-height:1.45;opacity:0;transition:opacity .15s ease-out;}' +
        '#' + TIP_ID + '.atlasvoice-sel-in{opacity:1;}' +
        '#' + TIP_ID + ' button{border:0;background:transparent;color:inherit;cursor:pointer;padding:2px;line-height:0;opacity:.75;}' +
        '#' + TIP_ID + ' button:hover,#' + TIP_ID + ' button:focus-visible{opacity:1;outline:none;}' +
        '#' + BADGE_ID + '{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:2147482999;' +
            'display:flex;align-items:center;border-radius:0 22px 22px 0;box-shadow:0 2px 8px rgba(0,0,0,.22);' +
            'font-size:13px;line-height:1.35;overflow:hidden;user-select:none;-webkit-user-select:none;}' +
        '#' + BADGE_ID + ' .atlasvoice-badge-main{display:inline-flex;align-items:center;gap:0;border:0;background:transparent;' +
            'color:inherit;font:inherit;cursor:pointer;padding:11px 12px;min-height:44px;}' +
        '#' + BADGE_ID + ' .atlasvoice-badge-text{max-width:0;opacity:0;white-space:nowrap;overflow:hidden;' +
            'transition:max-width .18s ease-out,opacity .18s ease-out,margin .18s ease-out;}' +
        '#' + BADGE_ID + '.atlasvoice-badge-open .atlasvoice-badge-text,' +
        '#' + BADGE_ID + ':hover .atlasvoice-badge-text,' +
        '#' + BADGE_ID + ':focus-within .atlasvoice-badge-text{max-width:180px;opacity:1;margin-left:9px;}' +
        '#' + BADGE_ID + ' .atlasvoice-badge-close{display:none;border:0;background:transparent;color:inherit;' +
            'cursor:pointer;padding:6px 10px 6px 2px;line-height:0;opacity:.75;}' +
        '#' + BADGE_ID + '.atlasvoice-badge-open .atlasvoice-badge-close,' +
        '#' + BADGE_ID + ':hover .atlasvoice-badge-close,' +
        '#' + BADGE_ID + ':focus-within .atlasvoice-badge-close{display:inline-flex;}' +
        '#' + BADGE_ID + ' .atlasvoice-badge-close:hover,#' + BADGE_ID + ' .atlasvoice-badge-close:focus-visible{opacity:1;outline:none;}' +
        '@media (prefers-reduced-motion: reduce){' +
            '#' + PILL_ID + ',#' + TIP_ID + '{transition:none;transform:none;}' +
            '#' + BADGE_ID + ' .atlasvoice-badge-text{transition:none;}' +
        '}' +
        '@media (forced-colors: active){' +
            '#' + PILL_ID + ',#' + TIP_ID + ',#' + BADGE_ID + '{border:1px solid ButtonText;}' +
        '}';
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
}

const PLAY_SVG = '<svg width="11" height="11" viewBox="0 0 7 8" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polygon fill="currentColor" points="0 0 0 8 7 4"/></svg>';
const FORWARD_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M4 4l8 8-8 8V4zm9 0l8 8-8 8V4z"/></svg>';
const CLOSE_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z"/></svg>';
const SELECT_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 7h16M4 12h10"/><polygon fill="currentColor" points="14 14 14 23 16.6 20.2 19.1 23 20.6 21.5 18 18.8 21 16"/></svg>';

/** Find the readable wrapper an endpoint of the selection lives in. */
function wrapperForNode(node) {
    const el = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
    return el ? el.closest('[class*="tts_content_wrapper_"]') : null;
}

/** Extract the buttonId from a wrapper's `tts_content_wrapper_<id>` class. */
function buttonIdForWrapper(wrapper) {
    const match = wrapper && typeof wrapper.className === 'string'
        ? wrapper.className.match(/(?:^|\s)tts_content_wrapper_(\S+)/)
        : null;
    return match ? match[1] : null;
}

/** Is the selection feature usable on this page at all? */
function pageHasWrapper() {
    return !!document.querySelector('[class*="tts_content_wrapper_"]');
}

function storageGet(store, key) {
    try {
        return window[store].getItem(key);
    } catch (e) {
        return null;
    }
}

function storageSet(store, key, value) {
    try {
        window[store].setItem(key, value);
    } catch (e) { /* private mode — degrade to per-pageview */ }
}

/**
 * Wire everything up. `getPainter(buttonId)` must return the shared painter
 * singleton for that button (injected by highlighter.js — avoids a circular
 * import and keeps the painter the single reuse surface).
 */
export function initSelectionControl(getPainter) {
    if (typeof window === 'undefined' || window.__ttsSelectionControlReady) {
        return;
    }
    window.__ttsSelectionControlReady = true;

    let pill = null;
    let current = null; // { buttonId, span } of the last valid selection
    let debounceTimer = null;

    /* ------------------------------ pill ------------------------------ */

    function ensurePill() {
        if (pill) {
            return pill;
        }
        injectControlStyles();
        const labels = controlLabels();
        const colors = controlColors();
        pill = document.createElement('div');
        pill.id = PILL_ID;
        pill.setAttribute('role', 'toolbar');
        pill.setAttribute('aria-label', labels.listenTitle);
        pill.style.background = colors.background;
        pill.style.color = colors.color;
        pill.style.display = 'none';
        // Touch devices: keep the pill narrow — "From here" collapses to its icon.
        const fromHereLabel = isTouchDevice() ? '' : '<span>' + labels.fromHere + '</span>';
        pill.innerHTML =
            '<button type="button" data-action="listen" title="' + labels.listenTitle + '">' + PLAY_SVG + '<span>' + labels.listen + '</span></button>' +
            '<span class="atlasvoice-sel-divider" aria-hidden="true"></span>' +
            '<button type="button" data-action="from-here" title="' + labels.fromHereTitle + '" aria-label="' + labels.fromHereTitle + '">' + FORWARD_SVG + fromHereLabel + '</button>';
        // Keep the text selection alive while interacting with the pill.
        pill.addEventListener('mousedown', (e) => e.preventDefault());
        pill.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (button) {
                dispatch(button.getAttribute('data-action') === 'from-here');
            }
        });
        document.body.appendChild(pill);
        return pill;
    }

    function hidePill() {
        if (pill) {
            pill.classList.remove('atlasvoice-sel-in');
            pill.style.display = 'none';
        }
        current = null;
    }

    function showPillAt(rect) {
        const el = ensurePill();
        el.style.display = 'flex';
        const width = el.offsetWidth || 180;
        const height = el.offsetHeight || 38;
        // Touch: below the selection (the native selection toolbar sits above);
        // mouse: above it, flipping below only when clipped by the viewport top.
        let top;
        if (isTouchDevice()) {
            top = rect.bottom + window.scrollY + 10;
        } else {
            top = rect.top + window.scrollY - height - 8;
            if (top < window.scrollY + 4) {
                top = rect.bottom + window.scrollY + 8;
            }
        }
        let left = rect.left + window.scrollX + rect.width / 2 - width / 2;
        left = Math.max(window.scrollX + 4, Math.min(left, window.scrollX + document.documentElement.clientWidth - width - 4));
        el.style.top = top + 'px';
        el.style.left = left + 'px';
        // Next frame so the entrance transition actually runs; timeout fallback
        // for contexts where rAF is throttled or paused.
        requestAnimationFrame(() => el.classList.add('atlasvoice-sel-in'));
        setTimeout(() => el.classList.add('atlasvoice-sel-in'), 80);
    }

    function updatePill() {
        if (!selectionEnabled()) {
            hidePill();
            return;
        }
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
            hidePill();
            return;
        }
        const range = sel.getRangeAt(0); // multi-range selections: first range only
        const wrapper = wrapperForNode(range.startContainer) || wrapperForNode(range.endContainer);
        const buttonId = buttonIdForWrapper(wrapper);
        if (buttonId == null) {
            hidePill();
            return;
        }
        const painter = getPainter(buttonId);
        if (!painter || !painter.root || typeof painter.spanForRange !== 'function') {
            hidePill();
            return;
        }
        // Clips to the wrapper's indexed text (selection may end outside it).
        const span = painter.spanForRange(range);
        if (!span || !span.text.trim()) {
            hidePill();
            return;
        }
        current = { buttonId, span: painter.snapSpanToWords(span) };
        showPillAt(range.getBoundingClientRect());
    }

    function dispatch(fromHere) {
        if (!current) {
            return;
        }
        const painter = getPainter(current.buttonId);
        const span = current.span;
        const payload = {
            buttonId: current.buttonId,
            text: fromHere ? painter.text.slice(span.start) : span.text,
            start: span.start,
            end: fromHere ? painter.text.length : span.end,
            fromHere: !!fromHere,
        };
        hidePill();
        // Drop the native selection so it doesn't sit on top of the read-along
        // highlight while the player reads.
        try {
            window.getSelection().removeAllRanges();
        } catch (e) { /* no-op */ }
        if (window.wp && window.wp.hooks) {
            wp.hooks.doAction('tts_listen_selection', payload);
        }
    }

    // selectionchange covers mouse, keyboard and touch selection; debounce so
    // the pill doesn't chase every intermediate drag state.
    document.addEventListener('selectionchange', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updatePill, 180);
    });

    // Escape dismisses the pill (and drops the selection focus ambiguity).
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && current) {
            hidePill();
        }
    });

    /* ------------------------------ tip ------------------------------- */

    let tipShown = false;

    function hideTip() {
        const el = document.getElementById(TIP_ID);
        if (el) {
            el.remove();
        }
    }

    function showTip(anchor) {
        if (tipShown) {
            return;
        }
        tipShown = true;
        storageSet('localStorage', TIP_SEEN_KEY, '1');
        injectControlStyles();
        const labels = controlLabels();
        const colors = controlColors();
        const el = document.createElement('div');
        el.id = TIP_ID;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.style.background = colors.background;
        el.style.color = colors.color;
        el.innerHTML =
            SELECT_SVG +
            '<span>' + labels.tip + '</span>' +
            '<button type="button" aria-label="' + labels.dismiss + '">' + CLOSE_SVG + '</button>';
        el.querySelector('button').addEventListener('click', hideTip);
        document.body.appendChild(el);
        // Under the player; clamped to the viewport width.
        const rect = anchor.getBoundingClientRect();
        const width = Math.min(300, document.documentElement.clientWidth - 16);
        let left = rect.left + window.scrollX;
        left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + document.documentElement.clientWidth - width - 8));
        el.style.top = (rect.bottom + window.scrollY + 10) + 'px';
        el.style.left = left + 'px';
        requestAnimationFrame(() => el.classList.add('atlasvoice-sel-in'));
        setTimeout(() => el.classList.add('atlasvoice-sel-in'), 80);
        setTimeout(hideTip, 10000);
    }

    // First interaction with any player (all six render inside one of these
    // containers) → show the tip once, at the moment the reader has shown
    // they care about audio.
    function onPlayerInteraction(e) {
        if (!selectionEnabled() || (announceMode() !== 'tip' && announceMode() !== 'both')) {
            return;
        }
        if (storageGet('localStorage', TIP_SEEN_KEY)) {
            document.removeEventListener('click', onPlayerInteraction, true);
            return;
        }
        const anchor = e.target && e.target.closest
            ? e.target.closest('tts-play-button, .tts__listent_content, [id^="player_content_"], .plyr')
            : null;
        if (!anchor) {
            return;
        }
        document.removeEventListener('click', onPlayerInteraction, true);
        showTip(anchor);
    }
    document.addEventListener('click', onPlayerInteraction, true);

    /* ----------------------------- badge ------------------------------ */

    function initBadge() {
        if (!selectionEnabled() || (announceMode() !== 'badge' && announceMode() !== 'both')) {
            return;
        }
        if (storageGet('sessionStorage', BADGE_HIDDEN_KEY) || !pageHasWrapper()) {
            return;
        }
        injectControlStyles();
        const labels = controlLabels();
        const colors = controlColors();
        const el = document.createElement('div');
        el.id = BADGE_ID;
        el.style.background = colors.background;
        el.style.color = colors.color;
        el.innerHTML =
            '<button type="button" class="atlasvoice-badge-main" aria-label="' + labels.badge + '">' +
                SELECT_SVG +
                '<span class="atlasvoice-badge-text">' + labels.badge + '</span>' +
            '</button>' +
            '<button type="button" class="atlasvoice-badge-close" aria-label="' + labels.dismiss + '">' + CLOSE_SVG + '</button>';
        // Tap toggles the expanded state (hover handles it on mouse devices).
        el.querySelector('.atlasvoice-badge-main').addEventListener('click', () => {
            el.classList.toggle('atlasvoice-badge-open');
        });
        el.querySelector('.atlasvoice-badge-close').addEventListener('click', () => {
            storageSet('sessionStorage', BADGE_HIDDEN_KEY, '1');
            el.remove();
        });
        document.body.appendChild(el);
    }

    // The badge needs the localized settings; on "delay JavaScript" sites they
    // can arrive after this module, so retry briefly before giving up.
    let badgeTries = 0;
    const badgeTimer = setInterval(() => {
        badgeTries++;
        if (selectionEnabled() || badgeTries > 10) {
            clearInterval(badgeTimer);
            if (selectionEnabled()) {
                initBadge();
            }
        }
    }, 500);
}
