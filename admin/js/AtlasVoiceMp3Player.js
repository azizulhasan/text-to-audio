/**
 * TTS-314: player 3 (AtlasVoice TTS) in Free.
 *
 * A saved MP3 per post, so every device plays the same audio. The file is made
 * on the first play: the post's text goes to `tta/v1/gtts` in batches, the site
 * merges them into one MP3 and remembers its URL. When audio cannot be made
 * (the site is not connected, or the monthly allowance is used up) the post is
 * read by the browser voice instead, so a visitor never meets a dead player.
 *
 * Pro renders player 3 with its own player and does not load this bundle.
 * Exposed as window.AtlasVoiceMp3Player, the base the Pro player will extend.
 */
import Plyr from 'plyr';
import AtlasVoiceAnalytics from './AtlasVoiceAnalytics';

const { __, sprintf } = wp.i18n;

/** Stop a lock wait after this many retries (10 s each). */
const MAX_LOCK_RETRIES = 12;

/** Browser voice for the rest of the visit when audio cannot be made. */
const FALLBACK_CODES = ['not_connected', 'quota_exceeded', 'player_not_active'];

/** One id per tab: the server's per-post lock tells two visitors apart with it. */
function visitorId() {
    const key = 'atlasvoice_mp3_visitor';
    try {
        let id = window.sessionStorage.getItem(key);
        if (!id) {
            id = (window.crypto?.randomUUID?.() || String(Date.now()) + Math.random()).replace(/[^a-zA-Z0-9-]/g, '');
            window.sessionStorage.setItem(key, id);
        }
        return id;
    } catch (e) {
        return 'anonymous';
    }
}

/**
 * Split text into batches, ending each at a sentence boundary when one is close.
 *
 * @param {string} text
 * @param {number} first Characters in the first batch (small, so audio starts soon).
 * @param {number} next  Characters in later batches.
 * @returns {string[]}
 */
export function splitIntoBatches(text, first = 1000, next = 1500) {
    const batches = [];
    let rest = text.trim();
    let size = first;

    while (rest.length > size) {
        const window_ = rest.slice(0, size);
        // Last sentence end in the window (Latin, CJK, Devanagari, Arabic).
        const match = window_.match(/[\s\S]*[.!?。！？।؟](?=\s|$)/);
        let cut = match && match[0].length > size * 0.5 ? match[0].length : window_.lastIndexOf(' ');
        if (cut <= 0) {
            cut = size;
        }
        batches.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
        size = next;
    }

    if (rest) {
        batches.push(rest);
    }

    return batches;
}

export class AtlasVoiceMp3Player {
    /**
     * @param {string}      buttonId Key into window.TTS.contents / extra.
     * @param {HTMLElement} host     The `.tts__listent_content` container.
     * @param {Object}      TTS      Page data printed by the plugin.
     */
    constructor(buttonId, host, TTS = window.TTS) {
        this.buttonId = buttonId;
        this.host = host;
        this.TTS = TTS;
        this.extra = TTS?.extra?.[buttonId] || {};
        this.content = TTS?.contents?.[buttonId] || '';
        this.url = this.storedUrl();
        this.generating = null;
        this.analytics = null;
    }

    /** REST URL for a Free route. */
    static route(name) {
        return String(window.ttsObj?.api_url || '/wp-json/').replace(/\/?$/, '/') + 'tta/v1/' + name;
    }

    /** The saved MP3 for this post and language, if any (keys compare case-insensitively). */
    storedUrl() {
        const urls = this.TTS?.settings?.fileURLs || {};
        const wanted = String(this.extra.file_url_key || this.extra.language || '').toLowerCase();
        const key = Object.keys(urls).find((k) => k.toLowerCase() === wanted);
        return key ? urls[key] : '';
    }

    mount() {
        this.host.innerHTML = '';

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'player_content atlasvoice-mp3-player';
        this.wrapper.id = 'player_content_' + this.buttonId;

        this.audio = document.createElement('audio');
        this.audio.id = 'player_' + this.buttonId;
        this.audio.preload = this.url ? 'metadata' : 'none';
        if (this.url) {
            this.audio.src = this.url;
        }

        this.status = document.createElement('div');
        this.status.className = 'atlasvoice-mp3-player__status';
        this.status.setAttribute('role', 'status');
        this.status.setAttribute('aria-live', 'polite');
        this.status.hidden = true;

        this.wrapper.append(this.audio, this.status);
        this.host.append(this.wrapper);

        this.plyr = new Plyr(this.audio, {
            controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings'],
            settings: ['speed'],
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75] },
        });

        this.bindAnalytics();

        // First play of a post with no audio yet: make it, then play it. A media
        // element without a source never fires `play`, so the click on Plyr's
        // play button is caught first (capture phase), keyboard included.
        const firstPlay = (event) => {
            if (this.url || !event.target.closest?.('[data-plyr="play"]')) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            this.generateAndPlay();
        };
        this.wrapper.addEventListener('click', firstPlay, true);
        this.audio.addEventListener('play', () => {
            if (!this.url) {
                this.audio.pause();
                this.generateAndPlay();
            }
        });
    }

    bindAnalytics() {
        try {
            this.analytics = new AtlasVoiceAnalytics(this.TTS?.settings?.postId);
        } catch (e) {
            this.analytics = null;
            return;
        }
        const a = this.analytics;
        this.audio.addEventListener('playing', () => a?.trackPlay());
        this.audio.addEventListener('pause', () => { if (!this.audio.ended) a?.trackPause(); });
        this.audio.addEventListener('ended', () => a?.trackEnd());
        this.audio.addEventListener('loadedmetadata', () => a?.setAudioDuration(this.audio.duration));
        this.audio.addEventListener('timeupdate', () => a?.trackProgress(this.audio.currentTime));
    }

    showStatus(text) {
        this.status.textContent = text;
        this.status.hidden = !text;
    }

    async generateAndPlay() {
        if (!this.generating) {
            this.generating = this.generate().finally(() => { this.generating = null; });
        }
        const result = await this.generating;

        if (result.url) {
            this.url = result.url;
            this.showStatus('');
            this.plyr.source = { type: 'audio', sources: [{ src: result.url, type: 'audio/mp3' }] };
            this.plyr.once('canplay', () => this.plyr.play());
            return;
        }

        this.fallBack(result.code);
    }

    /**
     * Send the post in batches. Resolves to {url} or {code} — never throws.
     */
    async generate() {
        const batches = splitIntoBatches(this.content);
        if (!batches.length) {
            return { code: 'empty' };
        }

        const title = String(this.extra.file_name || 'post-' + this.TTS?.settings?.postId);
        const base = {
            title,
            path: this.extra.date || '',
            post_id: this.TTS?.settings?.postId,
            user_id: visitorId(),
            settings: {
                language: this.extra.language || '',
                file_url_key: this.extra.file_url_key || '',
            },
        };

        for (let attempt = 0; attempt <= MAX_LOCK_RETRIES; attempt++) {
            let last = null;

            for (let i = 0; i < batches.length; i++) {
                this.showStatus(batches.length > 1
                    /* translators: 1: current part, 2: number of parts. */
                    ? sprintf(__('Preparing audio (%1$d of %2$d)…', 'text-to-audio'), i + 1, batches.length)
                    : __('Preparing audio…', 'text-to-audio'));

                last = await this.send({
                    ...base,
                    content: batches[i],
                    temp_title: title + '-' + (i + 1),
                    is_last_batch: i === batches.length - 1,
                });

                if (!last?.status) {
                    return { code: last?.data?.message || 'service_unreachable' };
                }
                if (last.data.file_already_exists || last.data.message === 'locked') {
                    break;
                }
            }

            if (last?.data?.message === 'locked') {
                // Another visitor is making this post's audio; wait for it.
                this.showStatus(__('Audio is being prepared. One moment…', 'text-to-audio'));
                await new Promise((resolve) => setTimeout(resolve, 10000));
                continue;
            }

            return last?.data?.url ? { url: last.data.url } : { code: 'service_unreachable' };
        }

        return { code: 'locked' };
    }

    async send(body) {
        try {
            const res = await fetch(AtlasVoiceMp3Player.route('gtts'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-WP-Nonce': window.ttsObj?.rest_nonce || '',
                },
                body: JSON.stringify(body),
            });
            return await res.json();
        } catch (e) {
            return { status: false, data: { message: 'service_unreachable' } };
        }
    }

    /**
     * Read the post with the browser voice instead (Free's player 1 class).
     *
     * @param {string} code Why audio could not be made.
     */
    fallBack(code) {
        this.showStatus('');
        if (!FALLBACK_CODES.includes(code) && code !== 'locked') {
            this.showStatus(__('Audio is not available right now. Please try again later.', 'text-to-audio'));
            return;
        }

        const Speaker = window.TextToSpeech;
        if (typeof Speaker !== 'function' || !('speechSynthesis' in window)) {
            this.showStatus(__('Audio is not available right now. Please try again later.', 'text-to-audio'));
            return;
        }

        try { this.plyr.destroy(); } catch (e) { /* already gone */ }
        this.wrapper.innerHTML = '';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'atlasvoice-mp3-player__fallback';
        button.id = this.buttonId;
        this.wrapper.append(button);

        const speaker = new Speaker(this.buttonId, this.content, button, this.TTS);
        // The browser-voice class draws and updates its button only as player 1
        // (its own player); start it with player 1's normal "Listen" content.
        speaker.playButtonNo = 1;
        button.innerHTML = speaker.playButtonContent();
        button.addEventListener('click', () => speaker._init(null, true));

        // Start reading right away: the visitor already pressed play.
        speaker._init(null, true);

        /**
         * Lets a site react when player 3 falls back to the browser voice
         * (e.g. to show its own message). Receives the reason code.
         */
        wp.hooks.doAction('atlasvoice.mp3Player.fallback', code, this);
    }

    /**
     * Mount on every player slot on the page: Free's <tts-play-button> (player
     * 1's element, inert here because player 1's bundle is not loaded) and the
     * `.tts__listent_content` container other markup filters may print.
     */
    static mountAll() {
        document.querySelectorAll('tts-play-button[data-id], .tts__listent_content[data-id]').forEach((host) => {
            const id = host.getAttribute('data-id');
            if (id && !host.dataset.atlasvoiceMounted && window.TTS?.contents?.[id] !== undefined) {
                host.dataset.atlasvoiceMounted = '1';
                new AtlasVoiceMp3Player(id, host).mount();
            }
        });
    }
}

window.AtlasVoiceMp3Player = AtlasVoiceMp3Player;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AtlasVoiceMp3Player.mountAll());
} else {
    AtlasVoiceMp3Player.mountAll();
}
