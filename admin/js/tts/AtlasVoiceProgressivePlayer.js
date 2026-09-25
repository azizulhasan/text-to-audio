/**
 * TTS-321: progressive first play for players that make a post's MP3 in
 * batches (Free's player 3, Pro's players 3-7).
 *
 * The first visitor of a post without audio hears part 1 as soon as its batch
 * returns (a few seconds) instead of waiting for every batch. Parts play one
 * after another on the player's own media element; seeking stays off while
 * they play, because the post's full length is not known yet. When the last
 * batch returns the merged file, playback moves to it at the same point and
 * the normal controls come back. The merge deletes the part files on the
 * server, so that move happens at once, not when the parts run out.
 *
 * Subclasses own the media element, the batching and the analytics; they call
 * startProgressive() before the first batch, addPart() for every stored batch,
 * then finishProgressive() or cancelProgressive(). Free exposes this class as
 * TextToSpeech.ProgressivePlayer so Pro's players extend the same code.
 */
export default class AtlasVoiceProgressivePlayer {
    /**
     * The media element the post plays on. Free's player 3 keeps it in
     * `this.audio`; Pro overrides this.
     *
     * @returns {HTMLMediaElement|null}
     */
    progressiveMedia() {
        return this.audio || null;
    }

    /**
     * The element that carries the lock class and the status line.
     *
     * @returns {HTMLElement|null}
     */
    progressiveRoot() {
        const media = this.progressiveMedia();
        return media?.closest?.('.plyr')?.parentElement || media?.parentElement || null;
    }

    /** Pro checks this, so a Free without this class keeps the old behaviour. */
    canPlayProgressively() {
        return true;
    }

    /**
     * @param {Object}  options
     * @param {number}  options.totalChars Characters in the whole post (maps playback to text for highlighting).
     * @param {number}  options.totalParts Batches expected, for the status line (0 if unknown).
     * @param {boolean} options.autoplay   The visitor already pressed play: start part 1 when it arrives.
     */
    startProgressive({ totalChars = 0, totalParts = 0, autoplay = false } = {}) {
        this.progressive = {
            active: false,
            parts: [],
            index: -1,
            elapsed: 0,
            playedChars: 0,
            totalChars,
            totalParts,
            autoplay,
            waiting: false,
            switching: false,
            generating: true,
        };
    }

    /** Parts are playing (or waiting for the next one) and the merged file is not there yet. */
    isProgressiveActive() {
        return !!this.progressive?.active;
    }

    /**
     * Media events caused by moving between parts, or onto the merged file, are
     * not the visitor's: analytics must not count them as plays, pauses or ends.
     *
     * @param {string} type The media event being counted. While a failed load
     *                      is retried, its pause and replay are not the
     *                      visitor's; the first `playing` still counts.
     */
    isProgressiveTransition(type = '') {
        const p = this.progressive;
        if (!p) {
            return false;
        }
        return p.switching
            || (p.retrying && type !== 'playing')
            || (p.active && (p.waiting || !!this.progressiveMedia()?.ended));
    }

    /**
     * A batch was stored: queue its part, and start it if it is the first.
     *
     * @param {string} url   The part's MP3.
     * @param {number} chars Characters of text in the part.
     */
    addPart(url, chars = 0) {
        const p = this.progressive;
        const media = this.progressiveMedia();
        if (!p || !p.generating || !url || !media) {
            return;
        }

        p.parts.push({ url, chars });

        if (!p.active) {
            p.active = true;
            // A player with no file yet may be set to preload nothing; then a
            // new source would not load until the next play(), and the move
            // to the merged file (which waits for its length) would stall.
            media.preload = 'auto';
            this.bindProgressiveEvents(media);
            this.setSeekLocked(true);
            this.loadPart(0, p.autoplay);
        } else if (p.waiting) {
            p.waiting = false;
            this.loadPart(p.index + 1, true);
        }

        this.renderProgressiveStatus();
    }

    /**
     * The last batch returned the merged file: continue on it from the same
     * point, with seeking back on.
     *
     * @param {string} url
     * @returns {boolean} False when no part was ever queued (the caller sets the
     *                    file up as before).
     */
    finishProgressive(url) {
        const p = this.progressive;
        if (!p) {
            return false;
        }
        p.generating = false;
        if (!p.active || !url) {
            return false;
        }

        const media = this.progressiveMedia();
        const inPart = p.waiting ? 0 : (media.currentTime || 0);
        const offset = p.elapsed + inPart;
        const wasPlaying = p.waiting || (!media.paused && !media.ended);
        const rate = media.playbackRate || 1;

        p.active = false;
        p.waiting = false;
        p.switching = true;
        // Playing resumes in the loadedmetadata listener below, after the seek.
        p.retries = 0;
        p.loadingPlays = false;

        media.addEventListener('loadedmetadata', () => {
            if (Number.isFinite(media.duration)) {
                media.currentTime = Math.min(offset, Math.max(media.duration - 0.25, 0));
            }
            media.playbackRate = rate;
            if (wasPlaying) {
                media.play().catch(() => { p.switching = false; });
            } else {
                p.switching = false;
            }
        }, { once: true });

        this.setMediaSource(url);
        this.setSeekLocked(false);
        this.clearProgressiveStatus();
        this.onProgressiveHandover(url);

        return true;
    }

    /**
     * Generation stopped without a merged file. The parts already queued still
     * play; the visitor is told the rest is missing when they run out.
     *
     * @returns {boolean} True when parts were playing (the caller must not
     *                    replace the player with a fallback mid-listen).
     */
    cancelProgressive() {
        const p = this.progressive;
        if (!p) {
            return false;
        }
        p.generating = false;
        if (!p.active) {
            return false;
        }
        if (p.waiting) {
            this.endProgressive();
        }
        return true;
    }

    /** Parts ran out and no merged file will come. */
    endProgressive() {
        const p = this.progressive;
        p.active = false;
        p.waiting = false;
        this.setSeekLocked(false);
        this.showProgressiveStatus(this.progressiveText('incomplete'));
    }

    /**
     * How far through the post's text the visitor is, 0-1, or null outside a
     * progressive play. Drives read-along highlighting while parts play.
     *
     * @returns {number|null}
     */
    progressiveFraction() {
        const p = this.progressive;
        const media = this.progressiveMedia();
        if (!p?.active || !p.totalChars || !media) {
            return null;
        }
        const part = p.parts[p.index];
        const within = media.duration ? Math.min(1, (media.currentTime || 0) / media.duration) : 0;
        return Math.min(1, (p.playedChars + within * (part?.chars || 0)) / p.totalChars);
    }

    // ── internals ────────────────────────────────────────────────────────

    /** Listeners on the media element, added once per player. */
    bindProgressiveEvents(media) {
        if (this.progressiveBound === media) {
            return;
        }
        this.progressiveBound = media;

        media.addEventListener('ended', () => this.onPartEnded());
        // Capture phase: a <source> child's error does not bubble to the media.
        media.addEventListener('error', () => this.retryLoad(), true);
        media.addEventListener('playing', () => {
            if (this.progressive) {
                this.progressive.switching = false;
                this.progressive.retrying = false;
                // Pressed play on a part: later parts may start on their own.
                this.progressive.autoplay = true;
            }
        });
        media.addEventListener('timeupdate', () => {
            const fraction = this.progressiveFraction();
            if (fraction !== null) {
                this.onProgressiveTime(fraction);
                this.renderProgressiveTime();
            }
        });
    }

    onPartEnded() {
        const p = this.progressive;
        if (!p?.active || p.switching) {
            return;
        }
        const media = this.progressiveMedia();
        p.elapsed += Number.isFinite(media.duration) ? media.duration : 0;
        p.playedChars += p.parts[p.index]?.chars || 0;

        if (p.index + 1 < p.parts.length) {
            this.loadPart(p.index + 1, true);
            return;
        }
        if (p.generating) {
            p.waiting = true;
            this.renderProgressiveStatus();
            return;
        }
        this.endProgressive();
    }

    /**
     * A file written a moment ago can be refused for a few seconds (LiteSpeed
     * answers the player's range request with 412 while the file is that new;
     * seen up to ~3 s). Load it again with a growing delay (1-5 s, 15 s in
     * all), keeping whether it should play.
     */
    retryLoad() {
        const p = this.progressive;
        const media = this.progressiveMedia();
        if (!p || !media || !(p.active || p.switching)) {
            return;
        }
        if ((p.retries || 0) >= 5) {
            // Give up: later events are the visitor's again.
            p.switching = false;
            p.retrying = false;
            return;
        }
        p.retries = (p.retries || 0) + 1;
        clearTimeout(p.retryTimer);
        p.retryTimer = setTimeout(() => {
            // A play the visitor asked for meanwhile is dropped by load(): ask again.
            const play = p.loadingPlays || !media.paused;
            // load() pauses a playing element; that pause and the replay are ours.
            p.retrying = true;
            media.load();
            if (play) {
                media.play().catch(() => {});
            }
        }, 1000 * p.retries);
    }

    loadPart(index, play) {
        const p = this.progressive;
        const media = this.progressiveMedia();
        const part = p.parts[index];
        if (!part) {
            return;
        }
        p.retries = 0;
        p.loadingPlays = play;
        p.index = index;
        // Starting part 1 is the visitor's play and counts as one; moving on
        // to a later part is not a new play.
        p.switching = index > 0;
        const rate = media.playbackRate || 1;

        media.addEventListener('loadedmetadata', () => {
            media.playbackRate = rate;
            if (!play) {
                p.switching = false;
            }
        }, { once: true });

        this.setMediaSource(part.url);

        if (play) {
            media.play().catch(() => { p.switching = false; });
        }
    }

    renderProgressiveStatus() {
        const p = this.progressive;
        if (!p?.active) {
            return;
        }
        this.showProgressiveStatus(this.progressiveText(p.waiting ? 'waiting' : 'playing'));
        this.renderProgressiveTime();
    }

    renderProgressiveTime() {
        const p = this.progressive;
        const el = this.progressiveStatusEl?.querySelector('.atlasvoice-progressive-status__time');
        if (!el || !p) {
            return;
        }
        const seconds = Math.max(0, Math.floor(p.elapsed + (p.waiting ? 0 : (this.progressiveMedia()?.currentTime || 0))));
        el.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    }

    /**
     * @param {'playing'|'waiting'|'incomplete'} state
     * @returns {string}
     */
    progressiveText(state) {
        const i18n = window.wp?.i18n;
        const __ = i18n ? i18n.__ : (s) => s;
        const sprintf = i18n ? i18n.sprintf : (s) => s;
        const p = this.progressive || {};

        if (state === 'waiting') {
            return __('Preparing the next part…', 'text-to-audio');
        }
        if (state === 'incomplete') {
            return __('The rest of the audio could not be prepared. Please try again later.', 'text-to-audio');
        }
        if (p.totalParts > 1) {
            /* translators: 1: parts ready, 2: parts in the post. */
            return sprintf(__('Preparing the rest (%1$d of %2$d). You can skip around once it is ready.', 'text-to-audio'), p.parts.length, p.totalParts);
        }
        return __('Preparing the rest. You can skip around once it is ready.', 'text-to-audio');
    }

    // ── hooks a subclass may override ────────────────────────────────────

    /**
     * Point the media element at a file. Setting `src` also wins over any
     * <source> child the element has.
     */
    setMediaSource(url) {
        const media = this.progressiveMedia();
        if (media && media.getAttribute('src') !== url) {
            media.src = url;
        }
    }

    /** Hide the seek bar, the part's own time and the download while parts play. */
    setSeekLocked(locked) {
        this.progressiveRoot()?.classList.toggle('atlasvoice-progressive', locked);
    }

    /** One status line under the player: elapsed time and what is happening. */
    showProgressiveStatus(text) {
        const root = this.progressiveRoot();
        if (!root) {
            return;
        }
        if (!this.progressiveStatusEl || !this.progressiveStatusEl.isConnected) {
            const el = document.createElement('div');
            el.className = 'atlasvoice-progressive-status';
            const time = document.createElement('span');
            time.className = 'atlasvoice-progressive-status__time';
            time.setAttribute('aria-hidden', 'true');
            const message = document.createElement('span');
            message.className = 'atlasvoice-progressive-status__text';
            message.setAttribute('role', 'status');
            message.setAttribute('aria-live', 'polite');
            el.append(time, message);
            root.append(el);
            this.progressiveStatusEl = el;
        }
        const message = this.progressiveStatusEl.querySelector('.atlasvoice-progressive-status__text');
        if (message.textContent !== text) {
            message.textContent = text;
        }
    }

    clearProgressiveStatus() {
        this.progressiveStatusEl?.remove();
        this.progressiveStatusEl = null;
    }

    /**
     * Playback position through the post's text, 0-1, on every time update
     * while parts play.
     *
     * @param {number} fraction
     */
    onProgressiveTime(fraction) {}

    /**
     * Playback moved to the merged file.
     *
     * @param {string} url
     */
    onProgressiveHandover(url) {}
}
