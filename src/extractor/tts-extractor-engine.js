/**
 * AtlasVoice Content Extractor Engine (TTS-238)
 *
 * A single JS extraction pipeline that resolves text content for the player.
 * Resolution tiers (first match wins):
 *   1. atlasvoice comment markers    <!--atlasvoice:start:N-->  ...  <!--atlasvoice:end:N-->
 *   2. User-saved stable CSS selector (per post type in Pro; one global in Free)
 *   3. Legacy wrapper                .tts_content_wrapper_<buttonId>
 *   4. Schema / ARIA                 [itemprop="articleBody"], main[role="main"] article, [role="main"]
 *   5. Builder body selectors        Elementor / Divi / Beaver / Oxygen / Bricks / GB / Kadence / FSE /
 *                                    WooCommerce / LearnDash / TutorLMS / LifterLMS / MemberPress / BuddyBoss
 *   6. Generic article / .entry-content / main article
 *   7. PHP-baked ttsCurrentContent   (dumb fallback)
 *
 * Returns plain text ready for TTS. Does NOT include intro/outro — those are
 * stitched by the player (Pro) or baked into ttsCurrentContent (Free).
 *
 * PR-B (TTS-238 v4.1): Every result now carries a `confidence` number in [0, 1]
 * alongside `tier`. Deterministic tiers (markers / saved / wrapper) return a
 * fixed high confidence; heuristic tiers (schema / builder / article) compute
 * confidence from scored candidate competition per plan §4.5:
 *   confidence = winner_score / (winner_score + second_score)
 * This enables:
 *   - low-confidence toast (engine signals "not sure, open picker")
 *   - self-heal rescoring on saved-selector match-failure (§0.7)
 *   - UI diff preview coloring by confidence
 */

(function (global) {
    'use strict';

    var ATLASVOICE_MARKER_START = 'atlasvoice:start:';
    var ATLASVOICE_MARKER_END   = 'atlasvoice:end:';

    /**
     * Page-builder / commerce / LMS body selectors.
     * Tier 5 — used when the site doesn't emit markers, has no saved selector,
     * no legacy wrapper, and no schema/ARIA markup.
     */
    var BUILDER_BODY_SELECTORS = {
        elementor:    '.elementor-widget-theme-post-content .elementor-widget-container, .elementor-widget-text-editor .elementor-widget-container',
        divi:         '.et_pb_post_content, .et_pb_text_inner, .et-l--post .et_pb_section',
        beaver:       '.fl-post-content, .fl-rich-text',
        oxygen:       '.oxy-post-content, .ct-section-inner-wrap',
        bricks:       '.brxe-post-content, .brxe-text',
        wpbakery:     '.wpb_text_column .wpb_wrapper, .vc_column-inner',
        avada:        '.fusion-post-content, .fusion-text',
        generateblocks: '.gb-container .gb-text, .gb-post-content',
        kadence:      '.kadence-inside-inner-col, .kb-block-post-content',
        fse:          'main.wp-block-post-content, .wp-block-post-content',
        woocommerce:  '.woocommerce-Tabs-panel--description, .woocommerce-product-details__short-description, .product .summary',
        learndash:    '.learndash-wrapper .ld-tabs-content, .ld-item-content, .ld-lesson-content, .ld-topic-content',
        tutorlms:     '.tutor-course-content, .tutor-lesson-content, .tutor-quiz-content, .tutor-single-course-content',
        lifterlms:    '.llms-lesson-content, .llms-course-description, .llms-quiz-wrapper',
        memberpress:  '.mepr-single-course-content, .mepr-page-content',
        buddyboss:    '.bb-lms-content, .bb-course-content'
    };

    var GENERIC_ARTICLE_SELECTORS = [
        'article .entry-content',
        'article .post-content',
        'main article',
        '.entry-content',
        '.post-content',
        'article'
    ];

    var SCHEMA_ARIA_SELECTORS = [
        '[itemprop="articleBody"]',
        'main[role="main"] article',
        '[role="main"] article',
        '[role="main"]'
    ];

    /**
     * Tier 1: Walk siblings between atlasvoice comment markers.
     * Clones the collected range into a fragment so downstream cleanup
     * (exclude selectors, strip nav) can mutate without touching live DOM.
     */
    function extractFromMarkers(buttonId) {
        var startText = ATLASVOICE_MARKER_START + String(buttonId);
        var endText   = ATLASVOICE_MARKER_END + String(buttonId);

        var walker = global.document.createTreeWalker(
            global.document.body,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );

        var startNode = null;
        var endNode = null;
        var node;
        while ((node = walker.nextNode())) {
            var text = (node.nodeValue || '').trim();
            if (!startNode && text === startText) {
                startNode = node;
            } else if (startNode && text === endText) {
                endNode = node;
                break;
            }
        }

        if (!startNode || !endNode) {
            return null;
        }

        var fragment = global.document.createDocumentFragment();
        var cursor = startNode.nextSibling;
        while (cursor && cursor !== endNode) {
            fragment.appendChild(cursor.cloneNode(true));
            cursor = cursor.nextSibling;
        }
        return fragment;
    }

    function extractFromSelector(selector) {
        if (!selector) { return null; }
        try {
            var el = global.document.querySelector(selector);
            if (el) { return el.cloneNode(true); }
        } catch (_) { /* invalid selector */ }
        return null;
    }

    function extractFromLegacyWrapper(buttonId) {
        return extractFromSelector('.tts_content_wrapper_' + buttonId);
    }

    function extractFromSelectorList(selectors) {
        for (var i = 0; i < selectors.length; i++) {
            var node = extractFromSelector(selectors[i]);
            if (node && (node.textContent || '').trim().length > 80) {
                return node;
            }
        }
        return null;
    }

    function extractFromBuilders() {
        var selectors = [];
        Object.keys(BUILDER_BODY_SELECTORS).forEach(function (key) {
            selectors.push(BUILDER_BODY_SELECTORS[key]);
        });
        return extractFromSelectorList(selectors);
    }

    // ---------- Scoring (PR-B Phase B1) ----------
    //
    // Implements the plan §4.5 heuristic: score each candidate by text density,
    // then penalize link-heavy / nav-like regions and boost known-good markers
    // (itemprop=articleBody, .entry-content, builder classes). Confidence is a
    // head-to-head ratio between the winner and the runner-up so that a clear
    // winner lands near 1.0 while a three-way tie lands near 0.34.

    var EXCLUDE_ANCESTORS_SELECTOR =
        'nav,header,footer,aside,' +
        '[role="navigation"],[role="banner"],[role="contentinfo"],' +
        '.menu,.sidebar,.widget,.comments-area,' +
        '.social-share,.related-posts,.yarpp-related';

    // Flattened list of every builder selector substring so we can test an
    // element's class list against them cheaply in scoreCandidate.
    var BUILDER_CLASS_HINTS = (function () {
        var hints = [];
        Object.keys(BUILDER_BODY_SELECTORS).forEach(function (k) {
            var parts = BUILDER_BODY_SELECTORS[k].split(',');
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i].trim();
                // Strip leading ".", attribute brackets, pseudo-selectors.
                if (p.charAt(0) === '.') { hints.push(p.slice(1).split(' ')[0]); }
            }
        });
        return hints;
    })();

    function matchesBuilderKnown(el) {
        if (!el || !el.className || typeof el.className !== 'string') { return false; }
        for (var i = 0; i < BUILDER_CLASS_HINTS.length; i++) {
            if (el.className.indexOf(BUILDER_CLASS_HINTS[i]) !== -1) { return true; }
        }
        return false;
    }

    function scoreCandidate(el) {
        if (!el || el.nodeType !== 1) { return 0; }
        var text = (el.innerText || el.textContent || '').trim();
        var T = text.length;
        if (T < 80) { return 0; }
        try {
            if (el.closest && el.closest(EXCLUDE_ANCESTORS_SELECTOR)) { return 0; }
        } catch (_) { /* invalid selector in some old browsers — keep scoring */ }

        var descendants = el.querySelectorAll ? el.querySelectorAll('*') : [];
        var E = descendants.length;
        var links = el.querySelectorAll ? el.querySelectorAll('a') : [];
        var L = 0;
        for (var i = 0; i < links.length; i++) {
            L += ((links[i].innerText || links[i].textContent || '').length);
        }
        var LR = T ? (L / T) : 1;
        var density = T / (E + 1);
        var s = T * density;

        if (LR > 0.5) { s *= 0.3; }                               // nav-ish
        if (matchesBuilderKnown(el)) { s *= 2.0; }                // Elementor/Divi/etc.
        if (el.matches && el.matches('[itemprop="articleBody"]')) { s *= 1.5; }
        if (/(^|\s)entry-content(\s|$)/.test(el.className || '')) { s *= 1.5; }
        return s;
    }

    /**
     * Rank every node matched by any of the given selector strings, returning
     * { node, liveNode, score, confidence } for the winner. When nothing scores
     * above 0 returns null. Confidence is clamped to [0, 1].
     *
     *   - `node`     : cloneNode(true) — safe to mutate without touching DOM.
     *   - `liveNode` : the original, in-DOM reference — needed by first-visit
     *                  auto-save to compute a stable CSS selector.
     */
    function pickBestCandidate(selectors) {
        var seen = [];
        var nodes = [];
        for (var i = 0; i < selectors.length; i++) {
            try {
                var list = global.document.querySelectorAll(selectors[i]);
                for (var j = 0; j < list.length; j++) {
                    if (seen.indexOf(list[j]) === -1) {
                        seen.push(list[j]);
                        nodes.push(list[j]);
                    }
                }
            } catch (_) { /* invalid selector — skip */ }
        }
        if (!nodes.length) { return null; }

        var scored = [];
        for (var k = 0; k < nodes.length; k++) {
            var sc = scoreCandidate(nodes[k]);
            if (sc > 0) { scored.push({ node: nodes[k], score: sc }); }
        }
        if (!scored.length) { return null; }
        scored.sort(function (a, b) { return b.score - a.score; });

        var winner = scored[0];
        var second = scored.length > 1 ? scored[1].score : 0;
        var confidence = winner.score / (winner.score + second);
        if (confidence > 1) { confidence = 1; }
        if (confidence < 0) { confidence = 0; }
        return {
            node: winner.node.cloneNode(true),
            liveNode: winner.node,
            score: winner.score,
            confidence: confidence
        };
    }

    function allBuilderSelectorStrings() {
        var out = [];
        Object.keys(BUILDER_BODY_SELECTORS).forEach(function (k) {
            out.push(BUILDER_BODY_SELECTORS[k]);
        });
        return out;
    }

    /**
     * Public API: resolve content for a given buttonId.
     *
     * @param {Object} opts
     * @param {number|string} opts.buttonId      Player/button id (1-based).
     * @param {string=}       opts.savedSelector User-saved stable selector (Tier 2).
     * @param {string=}       opts.fallbackText  PHP-baked ttsCurrentContent (Tier 7).
     * @returns {{ text: string, tier: string, node: (Node|null), confidence: number }}
     *          confidence is in [0, 1]: 1 = deterministic hit (markers/saved/wrapper),
     *          0 = php-fallback, otherwise a head-to-head ratio of the top two
     *          scored candidates per plan §4.5.
     */
    function resolveSavedSelector(opts) {
        if (opts.savedSelector) { return opts.savedSelector; }
        var tts = global.ttsObj || global.tta_obj || {};
        var store = tts.atlasvoice_selectors || {};
        var perType = store.per_post_type || {};
        if (opts.postType && perType[opts.postType]) { return perType[opts.postType]; }
        return store.global || '';
    }

    // Deterministic-tier confidence floors. These are anchors the user (or the
    // system as a whole) has opted into, so we trust them over any heuristic.
    var CONFIDENCE_MARKERS = 1.0;   // author-authored markers — gold standard
    var CONFIDENCE_SAVED   = 0.95;  // user picked via AtlasVoiceSelector
    var CONFIDENCE_WRAPPER = 0.85;  // legacy .tts_content_wrapper_N

    function resolveContent(opts) {
        opts = opts || {};
        var buttonId = opts.buttonId || 1;
        var savedSelector = resolveSavedSelector(opts);

        var text, node;
        // PR-C (C1a) — when the saved-selector tier fails health-check we set
        // `healedFrom` to the broken selector. It threads through every lower
        // tier's return value so firstVisitAutoDetect can tell "this post is
        // running on a fallback because your saved selector is broken" apart
        // from "this post has never had a selector". Caller uses it to POST
        // /save-selector?reason=heal.
        var healedFrom = '';

        // Tier 1 — comment markers.
        try {
            node = extractFromMarkers(buttonId);
            if (node) {
                text = (node.textContent || '').replace(/\s+/g, ' ').trim();
                if (text.length > 0) {
                    return { text: text, tier: 'markers', node: node, confidence: CONFIDENCE_MARKERS, healedFrom: '' };
                }
            }
        } catch (_) { /* fall through */ }

        // Tier 2 — user-saved stable selector. PR-C (C1a): beyond "does it
        // match anything", we also require the live element to still score
        // above zero. Common failure mode after a theme update is that the
        // saved class is reused on a nav-like region, so querySelector still
        // hits but the target is junk — scoreCandidate returns 0 for nav/
        // header/footer/aside ancestors so that check catches it.
        if (savedSelector) {
            try {
                var liveEl = global.document.querySelector(savedSelector);
                var liveScore = liveEl ? scoreCandidate(liveEl) : 0;
                if (liveEl && liveScore > 0) {
                    node = liveEl.cloneNode(true);
                    text = (node.textContent || '').replace(/\s+/g, ' ').trim();
                    if (text.length > 0) {
                        return {
                            text: text, tier: 'saved', node: node, liveNode: liveEl,
                            confidence: CONFIDENCE_SAVED, healedFrom: ''
                        };
                    }
                }
                // Miss: record which selector needs healing. Still fall through
                // so the player gets real content this request; the heal POST
                // persists the new winner for next page load.
                healedFrom = savedSelector;
            } catch (_) {
                healedFrom = savedSelector;
            }
        }

        // Tier 3 — legacy .tts_content_wrapper_N.
        try {
            node = extractFromLegacyWrapper(buttonId);
            if (node) {
                text = (node.textContent || '').replace(/\s+/g, ' ').trim();
                if (text.length > 0) {
                    return {
                        text: text, tier: 'wrapper', node: node,
                        confidence: CONFIDENCE_WRAPPER, healedFrom: healedFrom
                    };
                }
            }
        } catch (_) { /* fall through */ }

        // Tier 4 / 5 / 6 — heuristic scoring. Collect candidates from every
        // known selector set, score them, and let the best-scoring node win.
        // Tier name on the return value reports which family the winner came
        // from so downstream analytics (§10.1) can still classify events.
        var heuristicTiers = [
            { name: 'schema',  selectors: SCHEMA_ARIA_SELECTORS },
            { name: 'builder', selectors: allBuilderSelectorStrings() },
            { name: 'article', selectors: GENERIC_ARTICLE_SELECTORS }
        ];
        for (var i = 0; i < heuristicTiers.length; i++) {
            var best = null;
            try { best = pickBestCandidate(heuristicTiers[i].selectors); } catch (_) { best = null; }
            if (best && best.node) {
                text = (best.node.textContent || '').replace(/\s+/g, ' ').trim();
                if (text.length > 0) {
                    return {
                        text: text,
                        tier: heuristicTiers[i].name,
                        node: best.node,
                        liveNode: best.liveNode || null,
                        confidence: best.confidence,
                        healedFrom: healedFrom
                    };
                }
            }
        }

        return {
            text: (opts.fallbackText || '').trim(),
            tier: 'php-fallback',
            node: null,
            liveNode: null,
            confidence: 0,
            healedFrom: healedFrom
        };
    }

    /**
     * Player-facing wrapper. Opt-in only — the player calls this and, if it
     * returns a non-empty string, uses it in place of the legacy DOM scrape.
     * If it returns null the player falls through to its existing code path
     * unchanged (zero risk to users who haven't opted in).
     *
     * Gating:
     *   - ttsObj.use_atlasvoice_extractor must be truthy (mirrors the PHP opt-in)
     *   - Resolver must return text past a minimum length (avoid replacing a
     *     real scrape with a one-word schema stub)
     *
     * @param {Object} opts
     * @param {number|string} opts.buttonId
     * @param {string=}       opts.postType
     * @param {string=}       opts.fallbackText  Legacy ttsCurrentContent, used
     *                                           only to satisfy Tier 7; the
     *                                           player still owns the final
     *                                           decision on what to read.
     * @returns {string|null} Plain text, or null when opt-in is off / no match.
     */
    function getContentForPlayer(opts) {
        opts = opts || {};
        var tts = global.ttsObj || global.tta_obj || {};
        if (!tts.use_atlasvoice_extractor) { return null; }

        var result = resolveContent(opts);
        if (!result || !result.text) { return null; }
        // Refuse tiny fragments — those are almost always wrong-target hits.
        if (result.text.length < 40) { return null; }
        // php-fallback means nothing DOM-side matched; let the legacy path handle it.
        if (result.tier === 'php-fallback') { return null; }
        return result.text;
    }

    /**
     * Full-result wrapper — like getContentForPlayer but returns the whole
     * { text, tier, node, confidence } shape so UI paths (diff preview, listen
     * sample, self-heal badge) can inspect confidence without re-running the
     * resolver. Same opt-in gate as getContentForPlayer.
     *
     * @returns {{ text: string, tier: string, node: Node|null, confidence: number }|null}
     */
    function getResolutionForPlayer(opts) {
        opts = opts || {};
        var tts = global.ttsObj || global.tta_obj || {};
        if (!tts.use_atlasvoice_extractor) { return null; }
        var result = resolveContent(opts);
        if (!result || !result.text || result.text.length < 40) { return null; }
        if (result.tier === 'php-fallback') { return null; }
        return result;
    }

    // ---------- SPA / async-content wait (PR-C C7a) ----------
    //
    // Some themes/builders inject the article body AFTER DOMContentLoaded —
    // Elementor headless, client-side-rendered React/Vue themes, lazy-load
    // on scroll, etc. When the player resolves too early, every tier misses
    // and we fall through to php-fallback (stale or empty).
    //
    // The fix is a hint protocol: pages set either
    //   <body data-atlasvoice-wait-for="1">
    //     → wait for any mutation that produces a resolvable tier
    //   <body data-atlasvoice-wait-for=".my-content">
    //     → wait specifically for `.my-content` to exist
    //
    // When the hint is present we set up a MutationObserver and re-run the
    // resolver after each mutation burst. As soon as the resolver returns a
    // non-fallback tier with enough text, we disconnect and invoke the
    // callback. A timeout guards against the page never settling — after
    // `timeoutMs` we call back with whatever resolveContent returns (could
    // still be php-fallback, which the player will handle gracefully).
    //
    // Safe to call even when the hint attribute is missing: we immediately
    // resolve once, and if that succeeds we return synchronously via the
    // callback without ever arming the observer.

    var WAIT_TIMEOUT_DEFAULT_MS = 8000;
    var WAIT_ATTR = 'data-atlasvoice-wait-for';

    function hasAsyncHint() {
        var body = global.document && global.document.body;
        if (!body) { return { present: false, selector: '' }; }
        var raw = body.getAttribute && body.getAttribute(WAIT_ATTR);
        if (raw === null || typeof raw === 'undefined') {
            return { present: false, selector: '' };
        }
        // Attribute present with empty string, "1", or "true" → generic wait.
        // Anything else → CSS selector to wait for.
        var v = String(raw).trim();
        var isGeneric = (v === '' || v === '1' || v.toLowerCase() === 'true');
        return { present: true, selector: isGeneric ? '' : v };
    }

    /**
     * Resolve content once now, then keep watching the DOM until a real
     * (non-fallback) resolution lands or the timeout expires.
     *
     * @param {Object}   opts           Same shape as resolveContent.
     * @param {Function} callback       callback(resolution, meta)
     *                                  meta = { waited: ms, reason: 'sync'|'mutation'|'timeout' }
     * @param {number=}  timeoutMs      default 8000.
     * @returns {Function}              disposer that stops watching early.
     */
    function waitForResolution(opts, callback, timeoutMs) {
        opts = opts || {};
        if (typeof callback !== 'function') { return function () {}; }
        timeoutMs = (typeof timeoutMs === 'number' && timeoutMs > 0) ? timeoutMs : WAIT_TIMEOUT_DEFAULT_MS;

        var startedAt = (global.performance && global.performance.now) ? global.performance.now() : Date.now();
        var finished = false;
        var observer = null;
        var timer = null;
        function elapsed() {
            var now = (global.performance && global.performance.now) ? global.performance.now() : Date.now();
            return Math.round(now - startedAt);
        }
        function done(reason) {
            if (finished) { return; }
            finished = true;
            try { if (observer) { observer.disconnect(); } } catch (_) { /* */ }
            if (timer) { clearTimeout(timer); timer = null; }
            var finalRes = null;
            try { finalRes = resolveContent(opts); } catch (_) { finalRes = null; }
            try { callback(finalRes, { waited: elapsed(), reason: reason }); } catch (_) { /* */ }
        }

        // First try: maybe the content is already here.
        var first = null;
        try { first = resolveContent(opts); } catch (_) { first = null; }
        if (first && first.tier !== 'php-fallback' && first.text && first.text.length >= 40) {
            finished = true;
            try { callback(first, { waited: elapsed(), reason: 'sync' }); } catch (_) { /* */ }
            return function () {};
        }

        // Not ready. If hint is absent we still set up the observer but with
        // a short timeout — some themes are borderline (content lands a few
        // ms after DOMContentLoaded) and a tiny wait pays off.
        var hint = hasAsyncHint();
        if (!hint.present) {
            // No hint — use a very short grace window (250ms) rather than
            // the full 8s. We don't want to delay the player on every page.
            timeoutMs = Math.min(timeoutMs, 250);
        }

        if (!global.MutationObserver) {
            // Ancient browser. Give up gracefully: fall back to the sync result.
            finished = true;
            try { callback(first, { waited: elapsed(), reason: 'timeout' }); } catch (_) { /* */ }
            return function () {};
        }

        // Watch root for child-list changes. If the hint names a specific
        // selector, we only re-resolve when that selector matches.
        observer = new global.MutationObserver(function () {
            if (finished) { return; }
            if (hint.selector) {
                try {
                    if (!global.document.querySelector(hint.selector)) { return; }
                } catch (_) { return; }
            }
            var res;
            try { res = resolveContent(opts); } catch (_) { res = null; }
            if (res && res.tier !== 'php-fallback' && res.text && res.text.length >= 40) {
                done('mutation');
            }
        });
        try {
            observer.observe(global.document.body || global.document.documentElement, {
                childList: true,
                subtree: true
            });
        } catch (_) {
            finished = true;
            try { callback(first, { waited: elapsed(), reason: 'timeout' }); } catch (_) { /* */ }
            return function () {};
        }

        timer = global.setTimeout(function () { done('timeout'); }, timeoutMs);

        // Disposer — the player can call this if it's tearing down before
        // we finish (e.g., user navigates away in an SPA).
        return function dispose() {
            if (finished) { return; }
            finished = true;
            try { if (observer) { observer.disconnect(); } } catch (_) { /* */ }
            if (timer) { clearTimeout(timer); timer = null; }
        };
    }

    /**
     * Player-facing wrapper around waitForResolution — mirrors
     * getContentForPlayer's gate (opt-in must be ON, text >= 40 chars,
     * non-php-fallback tier). Callback receives the plain text string, or
     * null when we should defer to the legacy code path.
     */
    function getContentForPlayerAsync(opts, callback, timeoutMs) {
        opts = opts || {};
        if (typeof callback !== 'function') { return function () {}; }
        var tts = global.ttsObj || global.tta_obj || {};
        if (!tts.use_atlasvoice_extractor) { callback(null, { waited: 0, reason: 'opt-out' }); return function () {}; }
        return waitForResolution(opts, function (res, meta) {
            if (!res || !res.text || res.text.length < 40 || res.tier === 'php-fallback') {
                callback(null, meta);
                return;
            }
            callback(res.text, meta);
        }, timeoutMs);
    }

    global.AtlasVoiceExtractor = {
        resolveContent: resolveContent,
        getContentForPlayer: getContentForPlayer,
        getContentForPlayerAsync: getContentForPlayerAsync,
        getResolutionForPlayer: getResolutionForPlayer,
        waitForResolution: waitForResolution,
        scoreCandidate: scoreCandidate,
        pickBestCandidate: pickBestCandidate,
        BUILDER_BODY_SELECTORS: BUILDER_BODY_SELECTORS,
        MARKER_START: ATLASVOICE_MARKER_START,
        MARKER_END: ATLASVOICE_MARKER_END,
        WAIT_ATTR: WAIT_ATTR
    };
})(typeof window !== 'undefined' ? window : this);
