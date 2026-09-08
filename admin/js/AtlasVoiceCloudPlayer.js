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

    // ── progressive first play (TTS-266, option B) ──────────────────────
    //
    // A 40-batch post needs 2-3 minutes to finish, and nobody waits that long
    // watching a counter. So the very first playthrough plays each batch's own
    // part file as it lands — audio starts in a few seconds — and only switches
    // to the single merged MP3 once the server has built it.
    //
    // The native seek bar is OFF during that phase on purpose: an <audio> element
    // holds one part at a time, so its timeline would show the part's length and
    // reset to 0:00 at every join. A player whose timer restarts ten times reads
    // as broken. The button drives play/pause meanwhile, and the real controls
    // appear with the merged file, which is what every later visitor gets.

    /** Part-file URLs, in play order, as each batch comes back. */
    avParts = [];

    /** Index into avParts of the part currently playing. */
    avPartIndex = -1;

    /** True while this playthrough is chaining part files. */
    avProgressive = false;

    /** Set while swapping src between parts, so analytics sees one play, not N. */
    avSwitchingPart = false;

    /** A part ended before the next one had been generated: resume on arrival. */
    avWaitingForPart = false;

    /** The merged single-file MP3, once the last batch reports it. */
    avMergedURL = "";

    /** Seconds of audio in the parts already played, for the merged handover. */
    avElapsed = 0;

    /** Total batches for this post, known before the loop starts. */
    avTotalBatches = 0;

    /** The status line shown while batches are still being generated. */
    avStatusEl = null;

    constructor(buttonId, content = "", button = null, TTS = window.TTS) {
        super(buttonId, content, button, TTS);

        this.audio = this.#mountAudio();

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

    // ── static resolvers ────────────────────────────────────────────────
    //
    // The bootstrap has to know whether a finished MP3 exists BEFORE it decides
    // what to render — with a file, player 7 shows the native <audio> alone and
    // no button at all. It cannot construct a player to find out (constructing
    // one mounts DOM and claims window.TextToSpeech), so the resolution lives in
    // statics and the instance getters below delegate to them. One implementation,
    // two callers.

    static avLanguageFor(buttonId) {
        const extra = window.TTS?.extra?.[buttonId] || {};
        const listening = window.TTS?.settings?.listening || {};

        return extra.language || listening.tta__listening_lang || "en-US";
    }

    static avVoiceFor(buttonId) {
        // Only accept a saved voice that exists in the catalogue: sites upgrading
        // from player 1 still carry a browser voice name here.
        const listening = window.TTS?.settings?.listening || {};
        const saved = listening.tta__listening_voice;
        if (saved && ATLASVOICE_VOICES.some((v) => v.id === saved)) return saved;

        const language = this.avLanguageFor(buttonId);
        const first = ATLASVOICE_VOICES.find((v) => v.lang === language);

        return first ? first.id : "";
    }

    static fileURLFor(buttonId) {
        const urls = window.TTS?.settings?.fileURLs || {};
        // Prefer the key PHP computed (tts_get_file_url_key) over rebuilding it
        // here — it already accounts for whether a voice forms part of the key.
        const serverKey = window.TTS?.extra?.[buttonId]?.file_url_key;
        const language = this.avLanguageFor(buttonId);
        const voice = this.avVoiceFor(buttonId);

        return (
            (serverKey && urls[serverKey]) ||
            urls[`${language}--voice--${voice}`] ||
            urls[language] ||
            ""
        );
    }

    get avLanguage() {
        return AtlasVoiceCloudPlayer.avLanguageFor(this.buttonId);
    }

    get avVoice() {
        return AtlasVoiceCloudPlayer.avVoiceFor(this.buttonId);
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
        return AtlasVoiceCloudPlayer.fileURLFor(this.buttonId);
    }

    // ── audio element wiring ────────────────────────────────────────────
    /**
     * Player 7 plays a real file, so it gets a real <audio controls> element:
     * seek bar, volume, playback position and keyboard control all come from the
     * browser, and assistive tech gets the native media widget instead of a lone
     * button. It is mounted next to the button, inside the same root the button
     * lives in (a shadow root for this player, so the host theme's CSS cannot
     * reach it).
     *
     * Reused when one is already there: the bootstrap builds a NEW player
     * instance every time playback returns to "listen", and each one must not
     * append another element.
     */
    #mountAudio() {
        const anchor = this.speakButton;
        const root = this.avMountRoot();
        const existing = root.querySelector?.(".atlasvoice-audio");
        if (existing) return existing;

        const audio = document.createElement("audio");
        audio.className = "atlasvoice-audio";
        // Controls stay off until a COMPLETE file is the source — see the
        // progressive-play note on the fields above.
        audio.controls = false;
        audio.preload = "none";
        audio.style.cssText = "display:block;width:100%;margin-top:8px;";
        // Hidden until there is a source, so a page never shows an empty transport.
        audio.hidden = true;

        // Free hides the download affordance; Pro's filter turns it back on.
        // controlsList is honoured by Chrome/Edge/Opera and IGNORED by Firefox
        // and Safari — this is a feature gate, not a lock.
        if (!window.ttsObj?.atlasvoice_allow_download) {
            audio.setAttribute("controlsList", "nodownload");
        }

        if (anchor) anchor.insertAdjacentElement("afterend", audio);
        else root.appendChild(audio);

        return audio;
    }

    /**
     * Where this button's UI lives: the button's own root when there is a button,
     * otherwise the host element's shadow root — the audio-only render has no
     * button to anchor against.
     */
    avMountRoot() {
        // `isConnected` matters: updateButtonUI() re-renders the wrapper, which
        // leaves this.speakButton pointing at a DETACHED node whose getRootNode()
        // is its own orphan fragment — querying that finds nothing at all.
        if (this.speakButton?.isConnected && this.speakButton.getRootNode) {
            return this.speakButton.getRootNode();
        }

        const host = document.querySelector(
            `tts-play-button[data-id="${this.buttonId}"]`
        );

        return host?.shadowRoot || host || document.body;
    }

    /**
     * One-line progress while batches are generated: "Generating audio 5 of 12".
     * Sits where the audio element will be, and is removed the moment the real
     * controls appear, so the visitor never sees two things at once.
     */
    avSetStatus(text) {
        const root = this.avMountRoot();

        if (!this.avStatusEl) {
            this.avStatusEl = root.querySelector?.(".atlasvoice-status") || null;
        }

        if (!this.avStatusEl) {
            this.avStatusEl = document.createElement("p");
            this.avStatusEl.className = "atlasvoice-status";
            this.avStatusEl.setAttribute("role", "status");
            this.avStatusEl.setAttribute("aria-live", "polite");
            this.avStatusEl.style.cssText =
                "margin:6px 0 0;font-size:13px;opacity:.75;";

            if (this.audio) this.audio.insertAdjacentElement("beforebegin", this.avStatusEl);
            else root.appendChild(this.avStatusEl);
        }

        this.avStatusEl.textContent = text;
    }

    avClearStatus() {
        this.avStatusEl?.remove();
        this.avStatusEl = null;
    }

    /**
     * Hand playback over to the finished, single MP3: real controls, seek bar,
     * download item (Pro), and no AtlasVoice button in front of it.
     *
     * Called both by the bootstrap, when the file already existed at page load,
     * and at the end of a progressive first play.
     */
    avShowNativeControls(url, { autoplay = false } = {}) {
        if (!url) return;

        this.avProgressive = false;
        this.avClearStatus();

        if (this.audio.src !== url) this.audio.src = url;
        // Headers only, so the control shows the real duration instead of
        // "0:00 / 0:00" before the first play. The audio itself still waits.
        this.audio.preload = "metadata";
        this.audio.controls = true;
        this.audio.hidden = false;

        // The button was only ever the trigger for generating. With a real file
        // the native element is the whole player.
        //
        // Query the LIVE node rather than using this.speakButton: updateButtonUI()
        // re-renders the wrapper's innerHTML, so the reference captured at
        // construction can point at a detached node. And hide with an inline
        // display, not the `hidden` attribute — the button's own `#id{display:flex}`
        // rule outranks `[hidden]` and would keep it on screen.
        const liveButton = this.avMountRoot().querySelector?.(
            `#tts__listent_content_${this.buttonId}`
        );
        if (liveButton) liveButton.style.display = "none";

        if (autoplay) {
            // The element is reused across player instances, so it can still be
            // parked at the end of the previous playthrough.
            if (this.audio.currentTime > 0) this.audio.currentTime = 0;
            this.audio.playbackRate = this.avSpeed;
            this.audio.play().catch((e) =>
                // Autoplay policy blocks playback without a user gesture; expected
                // on autoplay and not an error worth surfacing.
                console.warn("[AtlasVoice] play blocked", e)
            );
        }
    }

    /**
     * Analytics is driven from the <audio> element's own events rather than from
     * speechSynthesis callbacks. Same three calls the base class makes, so the
     * insights payload is unchanged — only the event source differs.
     */
    #bindAudioEvents() {
        this.audio.addEventListener("play", () => {
            // Moving to the next part is one continuous listen, not a new play.
            if (this.avSwitchingPart) {
                this.avSwitchingPart = false;
                return;
            }
            this.listenStatus = "pause";
            this.displayButtonText(this.listenStatus);
            this.analytics?.trackPlay();
        });

        this.audio.addEventListener("pause", () => {
            // 'ended' also fires a 'pause'; let the ended handler own that case.
            if (this.audio.ended || this.avSwitchingPart) return;
            this.listenStatus = "resume";
            this.displayButtonText(this.listenStatus);
            this.analytics?.trackPause();
        });

        this.audio.addEventListener("ended", () => {
            if (this.avProgressive) {
                // Keep a running total so the handover to the merged file can
                // resume at the same point in the post.
                this.avElapsed += this.audio.duration || 0;

                // Next part already generated: play straight on.
                if (this.avPlayNextPart()) return;

                // Caught up with the generator — wait for the next batch rather
                // than reporting the post as finished.
                if (this.isGenerating) {
                    this.avWaitingForPart = true;
                    return;
                }

                // Every part played and the merge is done: hand over to the real
                // file so the visitor gets a seek bar from here on.
                this.avProgressive = false;
                if (this.avMergedURL) this.avShowNativeControls(this.avMergedURL);
            }

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

    /**
     * Queue a freshly generated part and, if nothing is playing yet, start it.
     * This is what turns "wait 3 minutes" into "audio in a few seconds".
     */
    avEnqueuePart(url) {
        if (!url) return;

        this.avParts.push(url);

        if (!this.avProgressive) {
            this.avProgressive = true;
            this.audio.hidden = false;
            this.avPlayNextPart();
            return;
        }

        if (this.avWaitingForPart) {
            this.avWaitingForPart = false;
            this.avPlayNextPart();
        }
    }

    /**
     * Swap the queued parts for the finished single file, mid-playback, without
     * the visitor noticing.
     *
     * This is not optional: merging DELETES the part files server-side, so once
     * the last batch lands every part still sitting in the queue is a 404. The
     * handover also earns the visitor the real seek bar the moment it is
     * available, instead of at the end of the playthrough.
     */
    avHandoverToMerged(url) {
        if (!url) return;

        const offset = this.avElapsed + (this.audio.currentTime || 0);
        const wasPlaying = !this.audio.paused;

        this.avProgressive = false;
        this.avWaitingForPart = false;
        this.avParts = [];
        this.avClearStatus();

        // One continuous listen, not a new play: keep analytics quiet.
        this.avSwitchingPart = true;

        this.audio.addEventListener(
            "loadedmetadata",
            () => {
                const duration = this.audio.duration;
                if (Number.isFinite(duration)) {
                    this.audio.currentTime = Math.min(offset, Math.max(duration - 0.25, 0));
                }
                if (wasPlaying) {
                    this.audio.play().catch(() => {
                        this.avSwitchingPart = false;
                    });
                } else {
                    this.avSwitchingPart = false;
                }
            },
            { once: true }
        );

        this.avShowNativeControls(url);
    }

    /** @returns {boolean} true when another part was available and started. */
    avPlayNextPart() {
        const next = this.avPartIndex + 1;
        if (next >= this.avParts.length) return false;

        this.avPartIndex = next;
        this.avSwitchingPart = true;
        this.audio.src = this.avParts[next];
        this.audio.playbackRate = this.avSpeed;
        this.audio.play().catch((e) => {
            this.avSwitchingPart = false;
            console.warn("[AtlasVoice] part playback blocked", e);
        });

        return true;
    }

    // ── playback (overrides) ────────────────────────────────────────────
    /**
     * Signature matches the base class so every existing caller — button click,
     * autoplay, selection control — works untouched. `speech` is accepted and
     * ignored: this player has no speechSynthesis engine.
     */
    async speak(speech, content = this.content, isClicked = false) {
        if (!content) content = this.content;

        // The normal case: a finished MP3 already exists, so the native element
        // is the whole player from the first frame.
        const existing = this.avFileURL;
        if (existing) {
            this.avShowNativeControls(existing, { autoplay: true });
            return;
        }

        // First ever play of this post. generate() streams parts into the queue
        // as they arrive, so audio starts long before this promise settles.
        const merged = await this.generate(content);
        this.avMergedURL = merged;

        if (!merged && !this.avParts.length) {
            // Nothing playable. The caller keeps the button in its idle state;
            // the PHP side decides whether to fall back to player 1.
            this.avClearStatus();
            this.listenStatus = "listen";
            this.displayButtonText(this.listenStatus);
            return;
        }

        this.avClearStatus();

        if (!merged) return;

        // Still hearing the parts: swap to the merged file at the same position
        // (the parts have just been deleted server-side). Otherwise start it.
        if (this.avProgressive) {
            this.avHandoverToMerged(merged);
        } else {
            this.avShowNativeControls(merged, { autoplay: true });
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

        // The FIRST batch is deliberately small — it is the one the visitor waits
        // on, and ~600 characters comes back in a few seconds. Later batches are
        // bigger because they are generated while earlier audio is already
        // playing, so their latency is hidden. Same split Pro uses for players
        // 3-6 (`initial_batch_charlen` / `latter_batch_char_length`).
        //
        // The upper bound also keeps each request inside the server-side HTTP
        // timeout: ~1,950 chars is ~63s of compute on Kokoro, uncomfortably close
        // to any sane timeout; Piper covers the same text in a few seconds.
        // Filterable so a slow host can lengthen the first batch, or a fast one
        // shorten it further, without touching the bundle.
        const hooks = window.wp?.hooks;
        const firstBatchSize = hooks
            ? hooks.applyFilters("atlasvoice_first_batch_charlen", 300)
            : 300;
        const batchSize = hooks
            ? hooks.applyFilters("atlasvoice_batch_charlen", 1200)
            : 1200;
        const chunks = this.splitForBatches(content, batchSize, firstBatchSize);
        this.avTotalBatches = chunks.length;
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

                // Progress is only worth showing while the visitor is still
                // waiting for the first sound; after that the audio itself is the
                // feedback, and the line just says the rest is still coming.
                this.avSetStatus(
                    this.avProgressive
                        ? this.avStatusText("preparing", i + 1, chunks.length)
                        : this.avStatusText("generating", i + 1, chunks.length)
                );

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

                // Every stored batch reports its own part file. Queue it so the
                // visitor hears batch 1 while batch 2 is still being made.
                if (!isLast && json?.status && json?.data?.url) {
                    this.avEnqueuePart(json.data.url);
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
     *
     * @param {string} text
     * @param {number} size      Characters per batch after the first.
     * @param {number} firstSize Characters in the first batch (smaller: it is the
     *                           one the visitor actually waits for).
     */
    splitForBatches(text, size, firstSize = size) {
        const sentences = String(text).split(/(?<=[.!?])\s+/);
        const out = [];
        let buffer = "";

        sentences.forEach((sentence) => {
            const limit = out.length === 0 ? firstSize : size;

            if (buffer.length + sentence.length > limit && buffer) {
                out.push(buffer.trim());
                buffer = "";
            }
            buffer += sentence + " ";
        });

        if (buffer.trim()) out.push(buffer.trim());

        return out.length ? out : [String(text)];
    }

    /**
     * Progress wording. Kept in one place so both states read the same way and
     * stay translatable.
     */
    avStatusText(phase, batchNo, total) {
        const { sprintf, __ } = window.wp?.i18n || {};

        if (!sprintf || !__) {
            return phase === "generating"
                ? `Generating audio ${batchNo} of ${total}…`
                : `Preparing the full track ${batchNo} of ${total}…`;
        }

        return phase === "generating"
            ? sprintf(
                  /* translators: 1: current batch number, 2: total batches. */
                  __("Generating audio %1$d of %2$d…", "text-to-audio"),
                  batchNo,
                  total
              )
            : sprintf(
                  /* translators: 1: current batch number, 2: total batches. */
                  __("Preparing the full track %1$d of %2$d…", "text-to-audio"),
                  batchNo,
                  total
              );
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
