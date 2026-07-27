/**
 * TTS-266 — AtlasVoice Cloud (player 7) front-end player.
 *
 * Extends the existing free player rather than reimplementing one. Everything
 * that is not audio playback — content extraction, button wiring, state text,
 * plugin compatibility and, importantly, AtlasVoiceAnalytics — is inherited
 * unchanged, so insights data keeps exactly the same shape as player 1.
 *
 * The base class is taken from `window.TextToSpeech` instead of being imported.
 * TextToSpeech.js is itself a webpack entry with module-level side effects, so
 * importing it here would either bundle a second copy or create a circular
 * import. Reading the global is the same reuse pattern Pro already uses for
 * `window.AtlasVoiceHighlighter`, and it keeps one base class on the page.
 *
 * What changes versus player 1: audio comes from a pre-generated MP3 played by a
 * native <audio> element, not from speechSynthesis. That removes the entire class
 * of engine bugs the base class has to work around (shared-across-tabs pause
 * state, Chrome's unreliable pause/resume, the Android cancel-and-restart path),
 * because an <audio> element is per-element and its pause/resume is exact.
 */

import { ATLASVOICE_VOICES } from "./tts/atlasvoice-voices.js";

/**
 * The subclass is built lazily, not at module scope.
 *
 * On a free site TextToSpeech.js assigns `window.TextToSpeech` INSIDE a
 * DOMContentLoaded listener, so at the moment this file is parsed — footer
 * script, before DOMContentLoaded — the base class does not exist yet. Declaring
 * the script dependency guarantees load ORDER, not that the global is populated.
 * So define the class once the base is actually there.
 *
 * Note `window.TextToSpeech` is later reassigned to a player *instance*, so the
 * base is only usable while it is still a function — capture it at that point.
 */
function defineAtlasVoiceCloudPlayer() {
    if (typeof window === "undefined") return false;
    if (window.AtlasVoiceCloudPlayer) return true;

    const Base = window.TextToSpeech;
    if (typeof Base !== "function") return false;

    class AtlasVoiceCloudPlayer extends Base {
    /** The <audio> element doing the actual playback. */
    audio = null;

    /** Batch loop state, so a second click cannot start a second generation. */
    isGenerating = false;

    constructor(buttonId, content = "", button = null, TTS = window.TTS) {
        super(buttonId, content, button, TTS);

        this.audio = new Audio();
        this.audio.preload = "none";

        this.#bindAudioEvents();

        // Expose the live instance the same way the base class does, so the
        // selection-control and highlight modules can find whichever player is
        // active without knowing which one it is.
        window.TextToSpeech = this;
        window.AtlasVoiceCloudPlayerInstance = this;
    }

    // ── settings ────────────────────────────────────────────────────────
    //
    // All prefixed `av*` on purpose. The base class declares `voice`, `language`,
    // `content`, `settings` and friends as CLASS FIELDS, which are installed as
    // own properties on the instance during construction and therefore shadow any
    // same-named getter on this subclass's prototype. Using plain names here
    // silently yielded the browser defaults ("Google UK English Female", "en-GB")
    // instead of the configured AtlasVoice voice.
    get avSettings() {
        return window.TTS?.settings?.listening || {};
    }

    /**
     * Per-button server-side data: file_name, date, file_url_key, language.
     *
     * These are the values PHP itself uses to build the audio path and the merge
     * glob, so the client MUST read them rather than deriving its own — if the
     * two disagree, the server writes {title}-{n}.mp3 under one name and looks
     * for another, and nothing ever merges.
     */
    get avExtra() {
        return window.TTS?.extra?.[this.buttonId] || {};
    }

    get avLanguage() {
        return this.avExtra.language || this.avSettings.tta__listening_lang || "en-US";
    }

    get avVoice() {
        // Only accept a saved voice that exists in the catalogue: sites upgrading
        // from player 1 still carry a browser voice name here.
        const saved = this.avSettings.tta__listening_voice;
        if (saved && ATLASVOICE_VOICES.some((v) => v.id === saved)) return saved;

        const first = ATLASVOICE_VOICES.find((v) => v.lang === this.avLanguage);
        return first ? first.id : "";
    }

    get avSpeed() {
        const rate = parseFloat(this.avSettings.tta__listening_rate);
        return Number.isFinite(rate) && rate > 0 ? rate : 1;
    }

    /** Which engine owns the selected voice, per the shared catalogue. */
    get avEngine() {
        const match = ATLASVOICE_VOICES.find((v) => v.id === this.avVoice);
        return match ? match.engine : "";
    }

    /**
     * The MP3 for the current language + voice, if one has already been
     * generated. Mirrors how the Pro players read `settings.fileURLs`, which is
     * the `tts_mp3_file_urls` post meta keyed by language(+voice).
     */
    get avFileURL() {
        const urls = window.TTS?.settings?.fileURLs || {};
        // Prefer the key PHP computed (tts_get_file_url_key) over rebuilding it
        // here — it already accounts for whether a voice forms part of the key.
        const serverKey = this.avExtra.file_url_key;

        return (
            (serverKey && urls[serverKey]) ||
            urls[`${this.avLanguage}--voice--${this.avVoice}`] ||
            urls[this.avLanguage] ||
            ""
        );
    }

    // ── audio element wiring ────────────────────────────────────────────
    /**
     * Analytics is driven from the <audio> element's own events rather than from
     * speechSynthesis callbacks. Same three calls the base class makes, so the
     * insights payload is unchanged — only the event source differs.
     */
    #bindAudioEvents() {
        this.audio.addEventListener("play", () => {
            this.listenStatus = "pause";
            this.displayButtonText(this.listenStatus);
            this.analytics?.trackPlay();
        });

        this.audio.addEventListener("pause", () => {
            // 'ended' also fires a 'pause'; let the ended handler own that case.
            if (this.audio.ended) return;
            this.listenStatus = "resume";
            this.displayButtonText(this.listenStatus);
            this.analytics?.trackPause();
        });

        this.audio.addEventListener("ended", () => {
            this.listenStatus = "listen";
            this.displayButtonText(this.listenStatus);
            this.analytics?.trackEnd();
            wp.hooks.doAction("tts_highlight_clear", this.buttonId);
            if (this.callBackAfterEnd) this.callBackAfterEnd();
        });

        this.audio.addEventListener("error", () => {
            console.warn("[AtlasVoice] audio failed to play", this.audio.error);
            this.listenStatus = "listen";
            this.displayButtonText(this.listenStatus);
        });
    }

    // ── playback (overrides) ────────────────────────────────────────────
    /**
     * Signature matches the base class so every existing caller — button click,
     * autoplay, selection control — works untouched. `speech` is accepted and
     * ignored: this player has no speechSynthesis engine.
     */
    async speak(speech, content = this.content, isClicked = false) {
        if (!content) content = this.content;

        let url = this.avFileURL;

        if (!url) {
            url = await this.generate(content);
        }

        if (!url) {
            // Nothing playable. The caller keeps the button in its idle state;
            // the PHP side decides whether to fall back to player 1.
            this.listenStatus = "listen";
            this.displayButtonText(this.listenStatus);
            return;
        }

        if (this.audio.src !== url) {
            this.audio.src = url;
        }

        this.audio.playbackRate = this.avSpeed;

        try {
            await this.audio.play();
        } catch (e) {
            // Autoplay policy blocks playback without a user gesture; that is
            // expected on autoplay and not an error worth surfacing.
            console.warn("[AtlasVoice] play blocked", e);
        }
    }

    pause(speech, isClicked = false) {
        // No Chrome pause/cancel dance and no Android special case — an <audio>
        // element pauses exactly where it is and resumes from the same offset.
        this.audio.pause();
    }

    resume(speech, isClicked = false) {
        this.audio.play().catch((e) => console.warn("[AtlasVoice] resume blocked", e));
    }

    finishedSpeaking(speech, data = {}, cancelIntentionally = false) {
        if (cancelIntentionally) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.listenStatus = "listen";
        this.displayButtonText(this.listenStatus);
    }

    // ── generation ──────────────────────────────────────────────────────
    /**
     * Batch the content to the REST route until the last batch reports the
     * finished file. Same batching contract players 3-6 use: one request per
     * chunk, `temp_title` = `{title}-{n}`, and the server merges on the last one.
     *
     * @returns {Promise<string>} URL of the finished MP3, or "" on failure.
     */
    async generate(content) {
        if (this.isGenerating) return "";
        this.isGenerating = true;

        // Smaller batches mean audio starts sooner and each request stays well
        // inside the server-side HTTP timeout. Measured: ~1,950 chars is ~63s of
        // compute on Kokoro, which is uncomfortably close to any sane timeout;
        // Piper covers the same text in a few seconds.
        const batchSize = 1200;
        const chunks = this.splitForBatches(content, batchSize);
        // Server-authored, per button — see the `extra` getter above.
        const title = this.avExtra.file_name || "";
        const path = this.avExtra.date || "";
        let url = "";

        if (!title) {
            console.warn("[AtlasVoice] no file_name for button", this.buttonId);
            this.isGenerating = false;
            return "";
        }

        try {
            for (let i = 0; i < chunks.length; i++) {
                const isLast = i === chunks.length - 1;

                const res = await fetch(
                    `${window.ttsObj?.api_url || ""}tta/v1/atlasvoice_synthesize`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            // ttsObj carries two nonces. `nonce` is the plugin's own
                            // action nonce; the REST permission callback verifies
                            // against 'wp_rest', which is `rest_nonce`. Using the
                            // wrong one returns 403 with no visible error.
                            "X-WP-Nonce": window.ttsObj?.rest_nonce || "",
                        },
                        body: JSON.stringify({
                            is_last_batch: isLast,
                            temp_title: `${title}-${i + 1}`,
                            title,
                            content: chunks[i],
                            path,
                            settings: {
                                language: this.avLanguage,
                                voice: this.avVoice,
                                speed: this.avSpeed,
                                // Voice ids are engine-specific, so name the engine
                                // explicitly rather than letting the service guess
                                // from its default.
                                engine: this.avEngine,
                            },
                            post_id: window.TTS?.settings?.postId || 0,
                            user_id: this.analytics?.userId || 0,
                        }),
                    }
                );

                const json = await res.json();

                // Another visitor is already generating this post — stop and let
                // them finish rather than paying for the same audio twice.
                if (json?.data?.message === "locked") break;

                if (json?.data?.file_already_exists && json?.data?.url) {
                    url = json.data.url;
                    break;
                }

                if (isLast && json?.data?.url) {
                    url = json.data.url;
                }

                if (json?.status === false) {
                    console.warn("[AtlasVoice] generation stopped:", json?.data?.message);
                    break;
                }
            }
        } catch (e) {
            console.warn("[AtlasVoice] generation failed", e);
        } finally {
            this.isGenerating = false;
        }

        return url;
    }

    /**
     * Split on sentence ends, never mid-word, so each batch is independently
     * speakable and the joins between batches land on natural pauses.
     */
    splitForBatches(text, size) {
        const sentences = String(text).split(/(?<=[.!?])\s+/);
        const out = [];
        let buffer = "";

        sentences.forEach((sentence) => {
            if (buffer.length + sentence.length > size && buffer) {
                out.push(buffer.trim());
                buffer = "";
            }
            buffer += sentence + " ";
        });

        if (buffer.trim()) out.push(buffer.trim());

        return out.length ? out : [String(text)];
    }
    }

    window.AtlasVoiceCloudPlayer = AtlasVoiceCloudPlayer;

    return true;
}

// Try immediately (covers Pro-active sites, where the base is assigned at module
// scope), then again once the DOM is ready — our listener is registered after
// TextToSpeech.js's, so by then the base class exists.
if (!defineAtlasVoiceCloudPlayer() && typeof window !== "undefined") {
    window.document.addEventListener("DOMContentLoaded", function () {
        if (!defineAtlasVoiceCloudPlayer()) {
            console.warn(
                "[AtlasVoice] player 7 could not find the TextToSpeech base class."
            );
        }
    });
}

export default defineAtlasVoiceCloudPlayer;
